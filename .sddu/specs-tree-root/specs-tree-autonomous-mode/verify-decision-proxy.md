# FR-006 decision-proxy 代答闭环运行实证报告

> **验证对象**: FR-AUTONOMY-001「自主模式 sddu-auto」核心机制 FR-006（decision-proxy 协议层拦截代答）
> **验证目的**: 补 O1 / P1-1 运行实证缺口 —— 构造「子 Agent 真实提问」场景，验证「question.asked 拦截 → sddu-auto 子会话识别 → LLM 决策 → reply 代答」四步闭环在真实 opencode 运行时是否成立
> **验证环境**: `/home/usb/sddu-test-projects/sddu-test-user-login-6/`（e2e 测试项目，已装插件 `decision-proxy.js` + `sddu-auto` agent + `auto-context.json`）
> **运行时**: opencode serve 1.18.18（`opencode serve --port 4096`）
> **验证时间**: 2026-08-16（UTC 2026-08-15T18:49~18:51）
> **验证人**: SDDU 验证 Agent

---

## 1. 验证场景构造

### 1.1 场景结构（模拟真实 sddu-auto 主会话 → task 调度子会话）

```
serve 主会话 (agent=sddu-auto, ses_ff93ceb3...)
  └── task 工具调度 → 子会话 (agent=general, ses_ff93cb5f..., parentID=主会话)
        └── 子会话按注入 prompt 强制调用 question 工具（验证场景，绕过「绝不问人」契约）
```

- **主会话**: 以 `sddu-auto` 身份创建（serve 会话），注册进 `SessionRegistry.autoRoots`。
- **子会话**: 主会话经 `task` 工具调度，runtime 创建子会话并带 `parentID=主会话` → `SessionRegistry.observeSessionCreated` 识别为拦截目标（`descendants`）。
- **强制提问**: 主会话 task prompt 明确指示子会话"第一个动作必须调用 question 工具向用户提问（数据存储方案，选项 A 内存 / B JSON）"——这是验证场景刻意绕过「绝不问人契约」抑制，让子 Agent 真实提问。

### 1.2 验证操作

```bash
# 1. 启动 serve（e2e 项目）
node scripts/serve-api.cjs start --port 4096 --dir /home/usb/sddu-test-projects/sddu-test-user-login-6

# 2. 提交主会话任务（agent=sddu-auto，prompt 指示 task 调度子会话并强制其提问）
node scripts/serve-api.cjs submit --port 4096 --agent sddu-auto --message "<强制提问场景 prompt>"
# -> sessionId: ses_ff93ceb3dffeYrP5Ei37DKzRkP

# 3. 观测：子会话创建 + question.asked + decision-proxy 拦截日志 + auto-decisions.md

# 4. 收尾
node scripts/serve-api.cjs stop --port 4096
```

### 1.3 关键前置修复（发现的环境问题）

验证过程中发现 **decision-proxy 从未被注册的根因**：opencode 本地插件自动发现 glob 为 `{plugin,plugins}/*.{ts,js}`（`packages/opencode/src/config/plugin.ts`），**只匹配 `.opencode/plugins/` 下的直接 `.ts/.js` 文件，不匹配子目录**。而 SDDU 插件安装在 `.opencode/plugins/sddu/`（子目录），故 serve/run 模式 **从未加载插件**（无 `SDDU Plugin loaded` 启动日志、无 sddu_* 工具、无 event hook 注册）——这解释了既往 `decision_count=0` 的根因不是"契约抑制提问"，而是**插件根本没加载**（详见 §4 问题 1）。

验证时为绕过此环境问题，在 e2e 项目 `.opencode/plugins/` 下临时放置直接入口文件 `sddu-loader.js`（`export { SDDUPlugin as default } from './sddu/index.js'`），使插件正常加载（日志出现 `SDDU Plugin loaded`）。**该 shim 为验证工作区改动，非产品改动**；根因记录见 §4。

---

## 2. 实测结果：四步闭环逐项证据

### 2.1 ① 拦截 question.asked —— ✅ 成功

子会话真实调用 question 工具后，runtime 发出 `question.asked` 事件（SSE 事件流可见），decision-proxy 的 `event` hook 收到并进入拦截逻辑：

```
[18:50:58.845] decision-proxy intercepting question
  sessionID=ses_ff93cb5f8ffeKmq5stwDF2IcNn
  requestID=que_006c35190001aiG3USJUZQ5pFK
  autoParent=ses_ff93ceb3dffeYrP5Ei37DKzRkP
  headers=["数据存储方案"]
  answers=[["A. 内存存储"]]
```

### 2.2 ② 识别 sddu-auto 子会话 —— ✅ 成功

`SessionRegistry` 通过 `session.created`（子会话 `parentID` = 主会话）识别子会话为拦截目标，日志 `autoParent=ses_ff93ceb3...`（主会话）证明 `childToAuto` 映射正确，未误拦截普通会话。

### 2.3 ③ LLM 决策 —— ✅ 成功

`DecisionEngine` 基于 `auto-context.json` 懒加载的 `launchIntent` + 项目上下文，对选项型问题做了关键词锚定决策：**`A. 内存存储`**（与启动诉求"数据存内存或本地 JSON 文件"匹配）。决策依据、硬决策标注均正确。

### 2.4 ③.5 决策追溯落盘 auto-decisions.md —— ✅ 成功

决策追溯（ADR-020）由 decision-proxy 协议层自动追加到 `<featureName>/auto-decisions.md`：

```markdown
### 2026-08-15T18:50:58.849Z（decision-proxy 协议层自动追加，会话 ses_ff93cb5f...）
- **决策点**：数据存储方案 — 数据存储采用哪种方案？
  - **采纳的决策**：A. 内存存储
  - **决策依据**：启动诉求「构建一个用户登录注册系统（user-login）…」+ 项目上下文
  - **是否硬决策**：基于启动诉求锚定
```

**decision_count = 1**（本验证首次真实触发，历史 `decision_count=0` 的根因见 §4）。

### 2.5 ④ 代答 reply —— ❌ 失败（运行时 bug）

decision-proxy 的三级代答通道在真实运行时**全部失败**：

```
[18:51:00.176] ERROR decision-proxy: HTTP reply failed
  sessionID=ses_ff93cb5f...
  requestID=que_006c35190001aiG3USJUZQ5pFK
  error="Error: decision-proxy HTTP reply failed: 404 Not Found"
```

- **通道 1**（`client.v2.session.question.reply`）：运行时客户端 `OpencodeClient`（v1 SDK 1.18.18）**没有 `v2` / `session.question.reply` 访问器** → 条件不成立直接跳过，且无降级 warn 日志（源码 `if (client?.v2?.session?.question?.reply)` 短路）。
- **通道 2**（`client.question.reply`）：运行时客户端**没有顶层 `question` 访问器**（`OpencodeClient` 成员为 `global/project/session/app/…`，无 `question`）→ 同样短路跳过。
- **通道 3**（HTTP `POST /api/session/{sessionID}/question/{requestID}/reply`）：真实返回 **404 `QuestionNotFoundError`** —— 子会话提问的 requestID 未挂在该会话作用域下，session 级 reply 端点找不到该问题。

**对照实验**：全局 reply 端点 `POST /question/{requestID}/reply`（body `{"answers":[["A. 内存存储"]]}`）返回 `true` 并成功解除 pending、子 Agent 拿到答案继续执行（最终汇报"收到的答案：A. 内存存储"）——证明**正确代答通道是全局 question reply 端点，而非 decision-proxy 当前实现的三个通道**。

---

## 3. 结论：FR-006 运行实证结论

| 步骤 | 环节 | 判定 | 证据 |
|:--:|------|:--:|------|
| ① | question.asked 拦截 | ✅ | decision-proxy intercepting question 日志 |
| ② | sddu-auto 子会话识别 | ✅ | autoParent=主会话；未误拦截 |
| ③ | LLM 决策（硬决策） | ✅ | 决策 A. 内存存储，基于启动诉求锚定 |
| ③.5 | 决策追溯 auto-decisions.md | ✅ | 文件生成，decision_count=1 |
| ④ | reply 代答 | ❌ | 三级通道全失败（v2/client 访问器缺失 + session 级端点 404）；全局端点可代答但未被采用 |

**结论（v1.0，首轮）：❌ FR-006 代答闭环运行实证未通过（关键步骤 ④ reply 失败）。**

> **✅ 2026-08-16 二轮修复后已通过**（详见 §5）：两个运行时 bug 均已修复（Bug 1 插件加载 / Bug 2 reply 全局通道），重新验证四步闭环全部通过，`decision_count=1`、子 Agent 拿到代答答案继续。**FR-006 代答闭环运行实证结论修正为 ✅ 通过。**

- **运行实证部分成立**：拦截→识别→决策→追溯四步在真实运行时全部工作，证明 decision-proxy 能真实拦截子 Agent 提问并作出决策、落盘追溯——`decision_count` 从历史 0 提升到 1。
- **闭环在最后一步断裂（首轮）**：代答 reply 三个通道全部失效，问题**到达不了子 Agent**，子 Agent 会持续阻塞等待。只有在人工用全局端点 reply 后子 Agent 才继续。**FR-006 的"问题全程不到达终端用户 + 子 Agent 拿到确定答案"闭环不成立。**（此缺陷已在二轮修复，见 §5）

---

## 4. 发现的问题（运行时 bug）

### 问题 1（环境级，阻断性）：opencode 未加载 SDDU 插件 → decision-proxy 从未注册

- **现象**: `opencode serve` / `opencode run` 均无 `SDDU Plugin loaded` 日志、无 `sddu_update_state` 等工具、`init count=26`（与 wks/sddu 带插件时的 31 不同）；子 Agent 也明确观察"sddu_update_state 工具不可直接调用"。
- **根因**: opencode 本地插件自动发现 glob `{plugin,plugins}/*.{ts,js}` 只匹配 `.opencode/plugins/` 下直接 `.ts/.js` 文件，不递归子目录；SDDU 插件位于 `.opencode/plugins/sddu/`（子目录），故 serve/run 模式插件从未加载。
- **影响**: 这是既往 `decision_count=0` 的**根因**（decision-proxy 的 event hook 从未注册，任何提问都不可能被拦截）——与评估报告"子 Agent 从不同导致未触发"的归因不同，本验证证明是**插件加载失败**。同时说明 plugin.js 中 `event: decisionProxy.event` / `"chat.message": decisionProxy.chatMessage` 的注册在 serve/run 模式从未生效。
- **修复方向**: 需将插件入口以直接文件形式放入 `.opencode/plugins/`（或安装脚本调整布局 / 用 file: 路径引用）。**不属于本次验证范围（不改 decision-proxy.ts 源码，仅记录）**。

### 问题 2（运行时 bug，FR-006 阻断性）：replyQuestion 三级代答通道全部失效

- **通道 1/2**: `client.v2.session.question.reply` 与 `client.question.reply` 访问器在运行时客户端（`OpencodeClient`，v1 SDK）上不存在，被 `if` 短路静默跳过。
- **通道 3**: `POST /api/session/{sessionID}/question/{requestID}/reply` 返回 404 `QuestionNotFoundError`（子会话提问不在该 session 作用域）。
- **正确通道**: 全局 `POST /question/{requestID}/reply`（body `{answers:[[]]}`）实测可用，能解除 pending 并让子 Agent 继续。
- **修复方向**: replyQuestion 应补充/改用全局 question reply 端点（对应 SDK 全局 Question 服务），或修正运行时 client 访问器探测逻辑。**本次仅记录，不做修复。**

---

## 5. 二轮修复与重新验证（2026-08-16）

> 针对 §4 发现的两个运行时 bug 的修复与复验结果。

### 5.1 Bug 1（环境级：插件未加载）根因确认与修复

**根因确认**（对 opencode 1.18.18 二进制 strings 反编译 + 实测三组对照）：

1. opencode 本地插件**自动发现 glob 为 `{plugin,plugins}/*.{ts,js}`**（`packages/opencode/src/config/plugin.ts` → `ConfigPlugin` effect），`cwd` 为 `.opencode/` 目录，**只匹配直接 `.ts/.js` 文件，不递归子目录**。SDDU 插件本体被 install.sh 装到 `.opencode/plugins/sddu/`（子目录），故 serve/run 模式从未被自动发现。
2. `opencode.json` 的 `plugin` 字段在 1.18.18 中**仅接受 npm 包名**（`opencode plugin <module>` 安装 npm 包并更新 config）；实测 `plugin: ["./plugins/sddu/index.js"]`、`plugin: ["/abs/.../index.js"]`、`plugin: ["file:///.../index.js"]` 三种本地路径形态**均不加载插件**（`init count=26`、无 `SDDU Plugin loaded` 日志，且无任何错误日志——插件 import 失败被 `ConfigPlugin` 的 `.pipe(ignoreCause)` 静默吞掉）。而 npm 包名 `opencode-sddu-plugin` 在本地安装（非 npm 发布）场景无法解析。
3. 对照实验：在 `.opencode/plugins/` 下放直接入口文件 `sddu-loader.js`（`export { SDDUPlugin as default } from './sddu/index.js'`）后，插件正常加载（日志出现 `SDDU Plugin loaded`）——证明自动发现通道可行，只是 install.sh 的目录结构不匹配。

**修复**（产品态，非工作区 shim）：

- `install.sh` / `install.ps1`：在复制插件到 `.opencode/plugins/sddu/` 后，新增**直接入口 loader** `.opencode/plugins/sddu.js`（内容 `export { SDDUPlugin as default } from "./sddu/index.js";`），使自动发现 glob 命中，插件在 serve/run 模式被真实加载（含 decision-proxy 的 event hook 注册）。
- `src/adapters/opencode/templates/opencode.json.hbs`：`plugin` 字段由 `["opencode-sddu-plugin"]`（本地无法解析的 npm 名）改为 `[]`（本地插件由自动发现加载，不依赖 npm 解析）。
- install.sh/install.ps1 的 opencode.json 合并逻辑同步清理历史遗留的 SDDU/SDD npm 名与旧 file 路径，避免残留。

### 5.2 Bug 2（通道级：reply 三级代答全失效）修复

**修复**：`src/adapters/opencode/decision-proxy.ts` 的 `replyQuestion` 三级代答中，HTTP 兜底通道由 session 级端点 `POST /api/session/{sessionID}/question/{requestID}/reply` 改为**全局端点 `POST /question/{requestID}/reply`**（body `{answers}`），并同步 `httpReplyQuestion` 签名（去掉不再需要的 `sessionID` 入参）。通道 1/2（client `v2.session.question.reply` / `client.question.reply`）保留为「若未来运行时 client 升级为 v2 则优先走进程内通道」的兼容探测；通道 3 HTTP 全局端点作为可靠兜底。单测同步更新（`decision-proxy.test.ts` 断言全局 URL `/question/req-http/reply`）。

### 5.3 重新验证结果（四步闭环全通过）

复验环境同首轮（`sddu-test-user-login-6`，serve 1.18.18，port 4096），插件经修复后的 install 布局安装（`.opencode/plugins/sddu.js` loader + `.opencode/plugins/sddu/` 本体 + `plugin: []`）。复验 run=`c7a2aed3`（2026-08-16T19:30）：

| 步骤 | 环节 | 判定 | 日志证据 |
|:--:|------|:--:|------|
| ① | 插件加载（Bug 1 修复验证） | ✅ | `19:30:20.464 "SDDU Plugin loaded ..."` |
| ② | 子会话创建 + 识别 | ✅ | `19:30:31.266 created ... title="决策代理层验证提问 (@general subagent)" agent=general parentID=ses_ff918a528...` |
| ③ | question.asked 拦截 | ✅ | `19:30:33.053 asking id=que_006e78bdd... questions=1` |
| ④ | LLM 决策 | ✅ | `19:30:33.078 "decision-proxy intercepting question" autoParent=ses_ff918a528... headers=["数据存储方案"] answers=[["A. 内存存储"]]` |
| ⑤ | reply 代答（Bug 2 修复验证） | ✅ | `19:30:33.104 replied requestID=que_006e78bdd... answers=[["A. 内存存储"]]`（**无 `HTTP reply failed 404`**） |
| ⑥ | 子 Agent 拿到答案继续 | ✅ | 子会话最终输出 `"收到的答案：A. 内存存储"`；question 工具返回 `"User has answered your questions: ... = A. 内存存储"` |

**关键证据**：拦截（19:30:33.078）→ 代答（19:30:33.104）间隔仅 26ms，是 decision-proxy 自动代答（非人工 reply；首轮人工 reply 在 404 后 47 秒才发生）。

- **decision_count = 1**：`auto-decisions.md` 由 decision-proxy 协议层真实追加 1 条决策记录。
- **四步闭环全部运行实证通过**：拦截 → 识别 → 决策 → 代答（reply 到达子 Agent，问题全程未呈现给终端用户）。

### 5.4 二轮结论

**✅ FR-006 代答闭环运行实证通过**。两个运行时 bug（Bug 1 插件加载 / Bug 2 reply 全局通道）已修复并经真实 serve 运行时复验：插件真实加载、decision-proxy 真实拦截子 Agent 提问、LLM 决策、全局端点代答成功、子 Agent 拿到答案继续、决策追溯落盘（`decision_count=1`）。`npm run build` 通过，`src/` 单测 27/27 通过。

---

## 6. 验证报告位置与关联

- 本报告：`.sddu/specs-tree-root/specs-tree-autonomous-mode/verify-decision-proxy.md`
- 关联产物：`evaluation-report.md`（O1 / P1-1 项已同步标注，见 §2.1 更新）
- 证据日志：`~/.local/share/opencode/log/opencode.log`（首轮 18:50~18:51 run=22bb3fad；二轮 19:30 run=c7a2aed3）
- 决策追溯实证：`/home/usb/sddu-test-projects/sddu-test-user-login-6/.sddu/specs-tree-root/specs-tree-user-login/auto-decisions.md`
- 相关 spike：`spike-decision-proxy.md`（静态/单测证据，本报告为运行实证）

---

## 7. 修订记录

| 版本 | 变更说明 | 日期 | 修订人 |
|:--:|------|------|------|
| v1.0 | 初始验证报告：构造强制提问场景，运行实证四步闭环；发现插件加载失败（问题 1）与 reply 通道失效（问题 2）两个运行时 bug；FR-006 结论 ❌ | 2026-08-16 | SDDU 验证 Agent |
| v1.1 | 二轮修复验证：Bug 1（插件加载）与 Bug 2（reply 全局通道）修复，重新验证四步闭环全部通过（decision_count=1、子 Agent 拿到答案），FR-006 结论修正为 ✅ | 2026-08-16 | SDDU 实施 Agent |
