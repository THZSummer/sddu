# 调研报告：opencode「真正意义上的 agent 代答」机制

> 关联 Feature：`specs-tree-autonomous-mode`（FR-AUTONOMY-001，ADR-018）
> 调研日期：2026-08-16 ｜ 调研对象：opencode 1.18.18（官方中文文档 + 183MB 二进制反编译 + 本机 SDK 1.17.4 类型声明）
> 调研性质：只读调研，未改动任何代码

---

## 0. 结论速览

| 问题 | 结论 |
|---|---|
| 「真正意义上的 agent 代答」是否存在？ | **存在**。opencode 的 question 工具本质是「事件驱动 + deferred 异步等待 + 任意进程内/外 actor 可代答」的原生协议（`QuestionV2.ask → question.asked 事件 → QuestionV2.reply 解析 deferred → 子 Agent 拿到答案继续`）。这不是 hack，是工具本身的设计。 |
| 原生代答路径是什么？ | ① **HTTP 全局端点 `POST /question/{requestID}/reply`**（body `{answers: string[][]}`，运行实证可靠）；② **完整 SDK client 的 `client.question.reply({requestID, answers})`**（官方 SDK 1.17.4+ 类型完整声明，TUI 自身就在用）；③ SDK v2 的 `client.session.question.reply({sessionID, requestID, questionV2Reply})`（session 级）。 |
| 插件能否在进程内直接 reply？ | **能，但插件注入的 `client` 是 v1 精简版（无 `question`/`v2` 命名空间），进程内 reply 需二选一**：插件自建完整 SDK client（`createOpencodeClient`，需要 `@opencode-ai/sdk` 依赖），或直接 HTTP 调全局端点（已实证）。插件 `event` hook **能收到** `question.asked`（每个总线事件都会派发）。 |
| 有没有比变体 B'（轮询队列）更优雅的原生方案？ | **有 —— 方案 E（插件内同步决策会话代答）**：插件在 `question.asked` 回调里用 `client.session.create()` + `client.session.prompt()` 让一个独立的 sddu-auto 决策会话做 LLM 真思考（该会话 idle、无死锁、同步等待），再把答案经全局端点 reply 回去。**无队列、无轮询、无注入打断、无需改写 sddu-auto 调度循环**。 |
| 明确推荐 | **方案 E 替代变体 B' 作为首选**。B' 的复杂度全部来自「必须让阻塞中的 sddu-auto 主会话亲自思考」——这个前提在反编译层面是死锁，绕开它的代价（后台 task + 轮询 + 队列文件 + 调度循环改造）远大于方案 E 用一个独立决策会话。方案 E 用同一 agent 定义 + 同模型 + 同种子上下文，语义上等价「答案来自 sddu-auto 的 LLM 思考」。 |

---

## 1. 三个官方文档的关键发现

### 1.1 插件文档 —— https://opencode.ai/docs/zh-cn/plugins/

**官方文档事件清单里没有 `question.asked` / `question.replied` / `question.rejected`**。官方列出的所有事件（消息/权限/会话/工具/TUI 事件）：

- 权限事件：`permission.asked` / `permission.replied`（**权限有，question 没有**）
- 会话事件：`session.created/compacted/deleted/diff/error/idle/status/updated`
- 工具事件：`tool.execute.before` / `tool.execute.after`
- 其余：`command.executed`、`file.*`、`installation.updated`、`lsp.*`、`message.*`、`server.connected`、`todo.updated`、`shell.env`、`tui.*`

**关键发现（反编译补充）**：文档的事件清单是**不完全的**。二进制内嵌的官方 `customize-opencode` skill 明确写着插件 `event(input)` hook 收到的是 **"every bus event"**（每个总线事件），并且 1.18.18 服务端插件 host 的实现确实把**全部**总线事件派发给插件：

```js
// 服务端插件 host（opencode serve 内）：
let j = yield* $.listen((N) => {
  if (N.location?.directory !== W.directory) return v.void;   // 仅按目录过滤
  return v.sync(() => {
    for (let V of K) V.event?.({ event: { id: N.id, type: N.type, properties: N.data } })
  })
})
```

即 **`question.asked` 事件在运行时确实会到达插件 `event` hook**（与本 Feature `verify-decision-proxy.md` 的实证一致）。

**插件可注册自定义工具**：✅ 官方文档有 `tool: { mytool: tool({...}) }`（`@opencode-ai/plugin` 的 `tool()` 辅助函数）。但这与本 Feature 无关（拦截在 question 工具协议层，不需要注册自定义工具）。

**插件能否直接访问 Question 服务/代答？** 官方文档只写插件 context 含 `client`（"用于与 AI 交互的 OpenCode SDK 客户端"），**未文档化** `client.question`。反编译确认：插件注入的 `client` 是 **v1 精简客户端**（`qY` 类），成员为 `global/project/pty/config/tool/instance/path/vcs/session/command/provider/find/file/app/mcp/lsp/formatter/tui/auth/event` + `postSessionIdPermissionsPermissionId`——**无顶层 `question`、无 `v2` 命名空间**。这与 `verify-decision-proxy.md` 的运行实证完全一致。

### 1.2 服务器文档 —— https://opencode.ai/docs/zh-cn/server/

**官方 API 表里没有任何 question 端点**。会话/消息/权限相关端点：

- 会话：`GET/POST /session`、`POST /session/:id/abort`、`POST /session/:id/fork`、`POST /session/:id/message`、`POST /session/:id/prompt_async`（"异步发送消息（不等待响应）"，返回 204）…
- **权限：`POST /session/:id/permissions/:permissionID`**（"响应权限请求"，body `{response, remember?}`）——权限有官方文档化端点，question 没有。

**关键发现（反编译补充）**：question 路由存在但**未进官方文档**（"实验性"标注）：

| 版本 | 端点 | 说明 |
|---|---|---|
| v1 全局 | `GET /question` | `question.list` —— "Get all pending question requests across all sessions." |
| v1 全局 | `POST /question/{requestID}/reply` | `question.reply` —— body `QuestionReply{answers}`，返回 `boolean`（"Question answered successfully"） |
| v1 全局 | `POST /question/{requestID}/reject` | `question.reject` —— 返回 `boolean`，被拒时子 Agent 抛 `QuestionRejectedError` |
| v2 全局 | `GET /api/question/request` | `question.request.list`（按 location） |
| v2 session | `GET /api/session/:sessionID/question` | `v2.session.question.list` |
| v2 session | `POST /api/session/:sessionID/question/:requestID/reply` | `v2.session.question.reply`，body `{answers}`，204 |
| v2 session | `POST /api/session/:sessionID/question/:requestID/reject` | `v2.session.question.reject`，204 |

> ⚠️ 运行实证已知：**session 级 reply 对子 Agent 提问返回 404**（`QuestionNotFoundError`，子会话提问的 requestID 挂在全局作用域而非该 session 作用域下）；**全局 v1 端点 `POST /question/{requestID}/reply` 实测可靠**（`verify-decision-proxy.md`）。

**有没有"服务端程序化代答"官方路径？** 无官方文档化路径；反编译确认的服务端原语是 `QuestionV2` service（见 §2.1），HTTP 只是它的壳。

### 1.3 SDK 文档 —— https://opencode.ai/docs/zh-cn/sdk/

**官方 SDK 文档同样没有任何 question 方法**。`Sessions` 小节方法清单：`session.list/get/children/create/delete/update/init/abort/share/unshare/summarize/messages/message/prompt/command/shell/revert/unrevert/postSessionByIdPermissionsByPermissionId`——权限 reply 有（`postSessionByIdPermissionsByPermissionId`），question 无。

**关键发现（本机 SDK 1.17.4 类型声明 `dist/v2/gen/sdk.gen.d.ts`）**：官方 SDK 类型**完整声明**了 question 服务，只是文档页没写：

- **全局 `client.question`（`class Question extends HeyApiClient`）**：
  - `list({directory?, workspace?})` → `GET /question`
  - `reply({requestID, directory?, workspace?, answers?: QuestionAnswer[]})` → `POST /question/{requestID}/reply`
  - `reject({requestID, directory?, workspace?})` → `POST /question/{requestID}/reject`
- **session 级 `client.session.question`（`class Question2`）**：`list({sessionID})` / `reply({sessionID, requestID, questionV2Reply: QuestionV2Reply})` / `reject({sessionID, requestID})`
- 另有访问器 `client.questionV2Reply`、`client.question`（全局）等。

**类型定义**（`dist/v2/gen/types.gen.d.ts`）：
```ts
type QuestionAnswer = Array<string>;                      // 每题的答案 = 选中 label 的数组
type QuestionV2Reply = { answers: Array<QuestionV2Answer> }; // "User answers in order of questions"
type QuestionV2Request = { id; sessionID; questions: QuestionV2Info[]; tool?: {messageID, callID} };
type QuestionV2Info = { question; header; options: QuestionV2Option[]; multiple?; custom? };
```

**"一个会话代理另一个会话"的官方 API？** 没有 session→session 的直接问答 API。官方会话交互只有 `session.prompt`（阻塞等待响应）/ `session.prompt_async`（排队不等待，反编译已实证会话忙时仅 FIFO 排队不打断）/ `session.command` / `session.shell`。**"代答"的唯一原生通道是 question 服务本身**（谁都能答，答了就解除 pending）。

---

## 2. 反编译源码的关键发现（1.18.18 二进制）

### 2.1 核心机制：QuestionV2 service（deferred/resolve 原语）

```js
// QuestionV2.ask（子 Agent 调用 question 工具时）：
L.set(f, { request: x, deferred: h });                          // 登记 pending
yield* H.publish(x1.Asked, x);                                  // 发布 question.asked 事件
yield* $(YI.await(h));                                           // 阻塞等待 deferred 被唤醒

// QuestionV2.reply(requestID, answers)：
let $ = L.get(S.requestID); if(!$) return NotFoundError;
yield* H.publish(x1.Replied, {sessionID, requestID, answers: S.answers.map(f=>[...f])});  // 发布 question.replied
yield* YI.succeed($.deferred, S.answers);                        // ★ 唤醒 deferred，注入答案
L.delete(S.requestID);

// QuestionV2.reject(requestID)：
yield* H.publish(x1.Rejected, {sessionID, requestID});
yield* YI.fail($.deferred, new QuestionRejectedError);           // 子 Agent 抛 QuestionRejectedError
L.delete(S);

// QuestionV2.list()：返回所有 pending requests
```

**这是"真正意义上的代答"的原生底座**：任何 actor（插件、SDK 客户端、HTTP 客户端）只要拿到 requestID，调用 `reply` 就能确定性解除子 Agent 的 pending 并注入答案——与子 Agent 是哪个会话、哪个 agent 无关。**子 Agent 的 question 工具是"可被代答"的第一公民设计，不是注入/轮询这类 workaround。**

### 2.2 事件与数据形状

- `question.asked` properties = `QuestionRequest = { id, sessionID, questions, tool? }`（`id` 即 requestID）
- `question.replied` properties = `{ sessionID, requestID, answers }`
- `question.rejected` properties = `{ sessionID, requestID }`
- 错误：`QuestionRejectedError`（"The user dismissed this question"）、`Question.NotFoundError`（重复 reply / 已过期 requestID）

### 2.3 插件 client 的真实形态（关键澄清）

- 插件注入 client：`RY({baseUrl, directory, headers, fetch}) → new qY({client})` —— **v1 精简版**，无 `question` / `v2`。
- **TUI 用的 SDK client 是另一个工厂**（`he`，来自 chunk-z7z1z7ht），**有 `question.list/reply/reject`**（TUI 源码 `s.sdk.question.list()` / `n.sdk.question.reply(i)` 直接调用）。
- 结论：**「运行时 client 没有 question」只对插件注入的 v1 精简 client 成立**；完整 SDK client（`@opencode-ai/sdk` 的 `createOpencodeClient`）始终有 `question`。ADR-018 里「未来 client 升级 v2 后走进程内」的兼容探测可以落地：**插件自建完整 client 即可立刻走 `client.question.reply`**。
- 插件 v1 client **有 `session` 命名空间**（`list/create/get/prompt/message/...` 全量）——这是方案 E 的机制基础（见 §3）。

### 2.4 插件 event hook 派发是 fire-and-forget

`v.sync(() => { for (let V of K) V.event?.({event}) })` —— 派发器不 await 插件返回的 Promise，插件异步 handler 与服务端并发运行。**插件可以在回调里 `await client.session.prompt(...)` 做同步 LLM 思考**，不会阻塞服务端事件派发；并发安全靠按 requestID 的 pending map 去重（已答的 requestID 再 reply 会 404，天然幂等）。

---

## 3. 「真正意义上的 agent 代答」判定与路径

### 3.1 判定：存在

判定依据：
1. **原生协议层**：`question` 工具 = 事件（`question.asked`）+ deferred 等待（`YI.await`）+ 可代答（`QuestionV2.reply` 解析 deferred）。代答是设计内行为。
2. **运行实证**：`verify-decision-proxy.md` 二轮已证明 `POST /question/{requestID}/reply` 解除 pending、子 Agent 拿到答案继续（`decision_count=1`）。
3. **无官方文档化，但有官方类型声明**：三个文档页均未写 question，但 SDK 1.17.4+ 类型完整声明、服务端路由真实存在。属于「实验性但可用」的官方 API 面。

### 3.2 路径清单

| 路径 | 形态 | 可用性 |
|---|---|---|
| **A. HTTP 全局端点** `POST /question/{requestID}/reply` | 任意进程可调，body `{answers: [["A"],["B"]]}` | ✅ 运行实证可靠（当前 ADR-018 采用） |
| **B. 完整 SDK client** `client.question.reply({requestID, answers})` | 插件自建 `createOpencodeClient` 后可用 | ✅ 类型完整；运行时需插件依赖 `@opencode-ai/sdk` |
| C. SDK v2 session 级 `client.session.question.reply({sessionID, requestID, questionV2Reply})` | 官方类型存在 | ⚠️ 运行实证 session 级 404（子 Agent 提问作用域在全局） |
| D. 插件注入的 v1 client `client.question.*` | — | ❌ 运行时无此访问器（已实证 + 反编译确认） |

---

## 4. 更优方案：方案 E —— 插件内同步决策会话代答

### 4.1 机制（一次完整代答闭环）

```
子 Agent（discovery/spec/…）调用 question 工具
  → QuestionV2.ask：登记 pending + 发布 question.asked + await deferred
  → 服务端插件 host 把 question.asked 派发给插件 event hook
  → SDDU 决策代理层（event hook 内，async）：
      ① client.session.create({ body: { agent: "sddu-auto", ... } })     // 创建/复用「决策会话」
         —— 首次创建后缓存 sessionID，后续复用（长生命周期决策会话）
      ② client.session.prompt({
           path: { id: 决策会话ID },
           body: {
             agent: "sddu-auto",                       // 同一 agent 定义 + 同一模型
             parts: [ 系统上下文(启动诉求+项目上下文+上游产物) + 问题全文+选项 ]
           }
         })
         → 决策会话 idle（非阻塞中的主会话），LLM 真思考，同步等待完整回答
      ③ 从回答中解析答案
      ④ 代答：POST /question/{requestID}/reply（body {answers}）  // 或自建 v2 client 后 client.question.reply
  → QuestionV2.reply 解析 deferred → 发布 question.replied
  → 子 Agent 拿到答案继续执行（问题全程不到终端用户）
```

### 4.2 为什么它成立（与反编译证据的对照）

- **无死锁**：决策会话是独立 session，`session.prompt` 走 `ensureRunning` 的 Idle 分支正常启动新 run（反编译确认 Idle 分支可用）；被阻塞等待的是子 Agent 会话，不是决策会话。方案 B 的死锁闭环被完全绕开。
- **无轮询、无队列**：决策是「事件驱动 + 同步等待一次 LLM」的单次往返，延迟 ≈ 一次 LLM 思考时长（数秒），远优于 B' 的「轮询间隔 + 思考时长」。
- **无需改写 sddu-auto 调度循环**：B' 要求把主会话调度改为「后台 task + 轮询 + 间隙响应」；方案 E 对主会话 sddu-auto 模板**零改动**（它照旧同步阻塞等待 task 即可），子 Agent 也零改动（FR-005 保持）。
- **「答案来自 sddu-auto 的 LLM 思考」语义成立**：决策会话使用**同一 agent 定义（sddu-auto）+ 同一模型**，种子上下文与 B' 要素 ③ 要求注入的内容一致（启动诉求 + 项目上下文 + 上游产物）。唯一区别是会话实例不同——这是死锁约束下必然的取舍（主会话阻塞中无法亲自思考，反编译已定论）。
- **拦截/识别机制不变**：仍然走插件 event hook + `SessionRegistry` 识别子会话（方案 D 已实证的部分），可靠性与 B' 相同。

### 4.3 代价与风险（对照 B'）

| 维度 | 变体 B'（队列 + 轮询） | 方案 E（插件内同步决策会话） |
|---|---|---|
| sddu-auto 调度循环改造 | 需要（后台 task + 轮询 + 间隙响应） | **不需要**（主会话零改动） |
| 队列文件/内存共享 | 需要 | **不需要** |
| 决策延迟 | 轮询间隔 + LLM 思考 | LLM 思考（一次往返） |
| 并发正确性 | requestID 严格匹配（已设计） | 同一 pending map 机制，天然兼容 |
| LLM 成本 | 每决策点一次 | 每决策点一次（等价） |
| 决策上下文 | 主会话持有（需显式写入队列） | 决策会话持有（prompt 内种子注入，等价） |
| 决策会话生命周期 | — | 新增「决策会话」管理（创建/复用/清理） |
| 兜底 | 30s 超时 → 规则匹配 | 可保留 30s 超时 → 规则匹配（不变） |

### 4.4 需要前置确认的 3 个技术点（build 阶段 spike）

1. **插件内 `client.session.create` + `client.session.prompt` 的 body 精确形状**（v1 client，`agent`/`model`/`parts` 字段），确认决策会话能跑通一次 LLM 往返。
2. **决策会话的权限约束**：沿用 sddu-auto 的 `edit/bash/webfetch deny`，防止决策会话跑偏实施动作；如需读项目文件，确认 `read` 在决策会话可用。
3. **插件依赖 `@opencode-ai/sdk` 的可解析性**：若插件要自建完整 client 走 `client.question.reply`（替代 HTTP），需在 `.opencode/package.json` 声明 `@opencode-ai/sdk`；否则 HTTP 全局端点作为兜底（已实证，无需额外依赖）。

---

## 5. 对变体 B' 的重新评估

**变体 B' 的全部复杂度源于一个被反编译定论的死锁事实**：sddu-auto 主会话阻塞等待 task 时无法被打断，因此"让主会话亲自思考"只能通过「后台 task 提交 + 轮询 + 间隙响应」绕开（`verify-prompt-interrupt.md` 实证 `prompt_async` 仅 FIFO 排队、`cancel` 语义为取消整个 turn）。

**方案 E 用「独立决策会话」直接消解了这个问题的存在**：
- B' 是"改造调度方式以在阻塞间隙偷时间思考"；
- E 是"换一个不阻塞的会话去思考"。

两者都满足「答案来自 sddu-auto 的 LLM 思考」（E 用同一 agent 定义 + 同模型 + 同种子上下文），但 E 少了一个完整的机制层（队列/轮询/调度循环改造），复杂度显著更低、延迟更低、对现有模板的侵入面更小（主会话与 7 个子 Agent 全部零改动，仅插件层新增）。

**保留 B' 的场景**：若产品上硬性要求"决策必须发生在 sddu-auto **主会话**（即与调度同一个会话实例）"，那 E 不满足（决策会话是独立实例）。但 ADR-018 的原始意图是"答案来自 sddu-auto 的 LLM 思考"，并未要求"必须同一会话实例"——E 在语义上覆盖该意图。

---

## 6. 明确结论与推荐

1. **「真正意义上的 agent 代答」存在**：opencode question 工具 = 事件 + deferred + 可代答的原生协议；官方三文档未文档化，但 SDK 类型 + 服务端路由 + 运行实证三重确认。代答通道以**全局 `POST /question/{requestID}/reply`** 为唯一运行实证可靠入口。
2. **插件进程内 reply 可行**：插件 `event` hook 收到 `question.asked`（every bus event）；reply 走全局 HTTP 端点（无额外依赖）或插件自建完整 SDK client 后走 `client.question.reply`（类型完整、TUI 自身在用）。
3. **推荐以方案 E（插件内同步决策会话代答）替代变体 B'**：决策由独立的 sddu-auto 决策会话（同 agent 定义 + 同模型 + 种子上下文）在插件回调内同步完成，无队列、无轮询、无注入、无调度循环改造；保留 30s 超时规则匹配兜底。
4. **变体 B' 降级为备选**：仅在"决策必须发生在主会话实例"的强约束下保留；其余情况方案 E 严格更优。
5. **建议动作**：更新 ADR-018 决策记录（B' → E），并在 build 阶段按 §4.4 的 3 个技术点做前置 spike 固定签名；代答通道维持全局端点优先 + SDK client 兼容探测。

---

## 附录 A：反编译证据索引（opencode 1.18.18 二进制 strings）

| 证据 | 二进制位置/说明 |
|---|---|
| `QuestionV2.ask/reply/reject/list`（deferred 解析） | 字符串区 offset ~11,459,832 |
| v1 路由 `question.list/reply/reject`（`T.make("question")`） | 字符串区 offset ~9,148,451 |
| v2 路由 `session.question.list/reply/reject` | 字符串区 offset ~9,187,056 |
| 插件 host 事件派发 `V.event?.({event:{id,type,properties}})` | 字符串区 offset ~10,989,500 |
| 插件 context `{client, project, worktree, directory, serverUrl, $}`（`RY` 工厂） | 字符串区 offset ~10,988,399 |
| 插件 client 类 `qY`（v1 精简：无 question/v2） | 字符串区 offset ~10,915,770 |
| 插件 client 工厂 `RY($)`（`new qY({client})` + `x-opencode-directory`） | 字符串区 offset ~10,917,103 |
| TUI SDK client（`he`，含 `sdk.question.list/reply/reject`） | 字符串区 offset ~24,669,110 / 24,638,812 模块 |
| 事件类型 `question.asked/replied/rejected` 的 schema | 字符串区 offset ~9,542,291 |

## 附录 B：本机 SDK 类型声明证据（`/home/usb/wks/sddu/.opencode/node_modules/@opencode-ai/sdk/dist/v2/`）

- `gen/sdk.gen.d.ts` L852-883：`class Question`（`list/reply/reject`，全局）
- `gen/sdk.gen.d.ts` L1566-1594：`class Question2`（session 级 `list/reply/reject`）
- `gen/sdk.gen.d.ts` L2048-2049：`get question(): Question`（完整 client 顶层访问器）
- `gen/types.gen.d.ts` L3608-3613：`QuestionV2Reply = { answers: QuestionV2Answer[] }`
- `gen/types.gen.d.ts` L2527-2547：`QuestionV2Info` / `QuestionV2Tool`
- `dist/client.d.ts`（v1）：无 question（与插件注入 client 一致）
