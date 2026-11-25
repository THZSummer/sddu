# 技术计划：自主模式（sddu-auto 自动调度）

> **文档定位**: SDDU 技术方案 — 记录架构设计、方案对比和 ADR，作为 tasks 阶段的输入
> **前置依赖**: spec.md（需求规范）
> **创建人**: SDDU Plan Agent
> **创建时间**: 2026-08-15
> **版本**: v4.2
> **更新人**: SDDU Plan Agent
> **更新时间**: 2026-08-16
> **更新说明**: 调研（`research-agent-reply.md`）发现更优原生方案 E（插件内同步决策会话代答）→ 替代变体 B' 为首选，B' 降级为备选；5 要素机制由「队列 + 轮询」改为「决策会话创建（session.create）+ prompt 思考 + 全局 reply 代答 + 30s 超时兜底」

## 1. 前置检查
> 启动技术规划前必须验证的前置条件

| 检查项 | 状态 |
|--------|:--:|
| spec.md 存在 | ✅ |
| 外部 API 文档缓存 | ✅（本 Feature 为 SDDU 框架内部能力，无外部服务依赖） |
| 前置依赖已满足 | ✅ |

> 说明：spec 依赖 `FR-TPL-001`（模板体系）、`FR-AGENT-SCOPE-001`（Agent 职责边界），均为框架既有能力，无待缓存的外部 API。

## 2. 架构分析
> 分析现有架构影响和需要的新组件

### 2.1 现有架构影响

本 Feature 的边界已被 spec 严格锁定为「新增 `sddu-auto` 代理决策层」，**不改造既有 7 个子 Agent 的执行流程**（NG-001），**不改变 `sddu` 与 `sddu-fast` 的现有行为**（NG-004）。按 README §173 工程约束，本 Feature 的实现目标只限设计态源码（`src/`、`scripts/`），影响集中在「新增调度 Agent 定义」「平台适配器新增决策代理层」「Agent 注册模板」三处：

| 现有组件 | 影响程度 | 说明 |
|---------|:--:|------|
| 7 个子 Agent（discovery/spec/plan/tasks/build/review/validate） | 无 | 执行流程零改动，其 prompt 文件与提问行为保持不变 |
| `sddu`（coordinator） | 无 | 路由协议、状态仪表盘、标记命令均不动；sddu-auto 作为独立入口由用户直接 `@sddu-auto` 调用 |
| `sddu-fast`（快速模式） | 无 | 行为不变 |
| 状态机（`machine.ts` / `schema-v3.0.0.ts`） | 无 | sddu-auto 复用既有 `sddu_update_state` 工具推进 phase，不新增 phase/status 值 |
| 平台适配器（`src/adapters/opencode/plugin.ts`） | 中 | 新增「决策代理层」：订阅 `question.asked` 事件 + 识别 sddu-auto 子会话提问 + **插件内创建决策会话（agent=sddu-auto）→ prompt 同步思考 → 全局 reply 代答**（方案 E 核心） |
| Agent 注册模板（`src/adapters/opencode/templates/opencode.json.hbs`） | 低 | 在 `agent` 块注册 `sddu-auto`（设计态模板，经构建生成运行时配置） |

### 2.2 需要的新组件

| 组件 | 类型 | 职责 |
|------|------|------|
| `sddu-auto` | 独立调度 Agent（新增，第三调度入口） | 启动阶段结构化提问采集诉求 → 执行阶段全自主调度 7 个子 Agent（照旧同步等待 task，**方案 E 无需改造调度循环**）→ 沉淀全套产物 |
| 决策代理层（Question 拦截 + 决策会话代答） | 独立模块 `decision-proxy.ts`（见 ADR-018/ADR-021） | 订阅 `question.asked` 事件，识别 sddu-auto 调度的子会话提问，**插件内用 `client.session.create()` 建/复用独立「决策会话」（agent=sddu-auto，注入种子上下文）→ `client.session.prompt()` 同步等 LLM 思考 → 全局 `POST /question/{requestID}/reply` 代答，30s 超时兜底规则匹配**，确保子 Agent 提问确定性到达 sddu-auto 而非用户 |
| 决策追溯记录 | 轻量产物（可选，见 ADR-020） | 记录 sddu-auto 代答的关键决策点 + 依据 + 决策来源（真思考 / 超时兜底），供用户事后回溯 |

### 2.3 数据流变更

```
【普通 sddu 流程】
用户 ──提问──> 子 Agent（每阶段）──答复──> 用户

【sddu-auto 自主流程】
                    ┌───────────── 启动阶段（唯一人机交互点）─────────────┐
用户 ──诉求──> sddu-auto ──结构化追问──> 用户 ──补全──> sddu-auto
                    └────────────────────────────────────────────────┘
                               ↓ 固化「自主执行上下文」
                    ┌───────────── 执行阶段（全自主，绝不问人）─────────────┐
sddu-auto ──task(同步等待, 注入诉求上下文)──> 子Agent(discovery→…→validate)
                    │                                    │ 子 Agent 调用 question 工具
                    │                                    ↓
                    │                    question.asked 事件（sessionID + requestID）
                    │                                    ↓
                    │              决策代理层订阅 → 识别 sddu-auto 子会话提问
                    │                                    ↓
                    │              ┌──── 决策代理层（插件内，async）────────┐
                    │              │ ① client.session.create() 建/复用「决策会话」│
                    │              │    （agent=sddu-auto，注入种子上下文：        │
                    │              │     启动诉求 + 项目上下文 + 上游产物）         │
                    │              │ ② client.session.prompt() 同步等 LLM 思考     │
                    │              │ ③ 解析答案 → 全局 reply 代答                  │
                    │              └──────────────────────────────────┘
                    │                                    ↓
                    │              POST /question/{requestID}/reply（body {answers}）
                    │                        （30s 超时 → 降级规则匹配兜底，NFR-003 不阻塞）
                    │                                    ↓
                    └──────────── reply 代答 → 子 Agent 拿到答案继续
                    └────────────────────────────────────────────────┘
                               ↓
                    全套产物（discovery.md ~ validate.md）
```

关键数据流变更：子 Agent 的「提问」不再流向用户，而是在 question 工具的**协议层**被决策代理层拦截，**决策代理层在插件内开一个独立的 sddu-auto「决策会话」（同 agent 定义 + 同模型 + 同种子上下文），同步等待其 LLM 真思考后经全局 reply 代答**——子 Agent 的 question 工具必然拿到答案后继续执行。**提问的「接收方」由用户确定性变为 sddu-auto**（对应 FR-006），且**答案来自 sddu-auto 的 LLM 思考而非规则匹配**（恢复 ADR-018「LLM 自主决策」设计意图）；主会话与 7 个子 Agent 均零改动（方案 E 无需改造调度循环）。

### 2.4 依赖关系图

```
sddu-auto（新增，第三调度入口）
  ├── 依赖 7 个子 Agent（经 task 工具调度，零改动）
  ├── 依赖 sddu_update_state 工具（推进 phase，复用）
  ├── 依赖 sddu-tree Skill（完成后更新目录导航，复用）
  ├── 依赖决策代理层（decision-proxy）拦截提问并经独立决策会话代答
  └── 无外部服务依赖

决策代理层（decision-proxy）新增依赖：
  └── 插件 v1 client 的 session.create/prompt（建决策会话）+ 全局 reply 端点（代答）

与既有入口并列（互不依赖）：
  sddu（普通调度）│ sddu-fast（快速调度）│ sddu-auto（自动调度）★新增
```

### 2.5 架构结论（是否拆分）

spec §9 已判定本 Feature 边界清晰、功能内聚，**无需拆分**。plan 阶段复核：核心交付物只有「一个新调度 Agent 的行为定义」，无可独立交付的子模块。维持单 Feature 模式。

---

## 3. 方案对比
> 针对核心难点 #3「子 Agent 提问拦截重定向」的可行实现路径

核心约束回顾：在「子 Agent 零改动」（NG-001/FR-005）前提下，让子 Agent 在执行阶段的提问**确定性**到达 sddu-auto 而非用户（FR-006），且**可靠性必须 100% 保证**。

**平台机制调研结论**（opencode 1.18.18 官方文档 + 源码反编译 + 运行实证）：opencode 的 question 工具是「事件驱动 + 异步等待 + 可代答」协议——子 Agent 调用 question 工具时，发布 `question.asked` 事件（携带 `sessionID` + `requestID` + questions），并阻塞等待；任何能订阅该事件并调用 `reply(requestID, answers)` 的组件都能「拦截并代答」，子 Agent 的 question 工具必然拿到代答答案后继续执行。这是「代理决策」的确定性基础（TASK-001 spike + `verify-decision-proxy.md` 二轮已实证拦截→识别→代答闭环成立）。

**本版对比的决定性维度 —— 代答的「智能来源」**：ADR-018 原始设计意图是「LLM 自主决策答案」，但上一版方案 D 的落地（TASK-003）实际实现为 `DecisionEngine` 规则匹配（关键词匹配/选首项/保守默认，`decision-proxy.ts` L194-238），**答案未经 LLM 思考，偏离设计意图**。v4.0 曾推荐方案 B（协议层拦截 + prompt_async 注入 sddu-auto 思考），其先决条件已由**反编译 opencode 1.18.18 实证否决**（`verify-prompt-interrupt.md`：会话 busy 时新消息仅 FIFO 排队，唯一打断是 cancel 且语义为取消整个 turn，构成死锁闭环）；v4.1 由此确定变体 B'（后台 task + 轮询 + 间隙响应）。**本次调研（`research-agent-reply.md`）发现更优原生方案 E**——插件内用独立「决策会话」代答，消解 B' 的调度循环改造复杂度。本节按「智能来源」对比 5 个方案：

| 维度 | 方案 A：上下文指令注入 | 方案 B：注入打断回传 | 方案 C：双会话代理（resume） | 方案 D：协议层拦截 + 规则匹配 | 方案 E：插件内同步决策会话代答 |
|------|:--|:--|:--|:--|:--|
| **代答智能来源** | ❌ 无代答（靠子 Agent 遵从「别问」指令） | ✅ sddu-auto LLM 真思考（主会话） | ✅ sddu-auto LLM 真思考 | ❌ 规则匹配（关键词/选首项/保守默认，**非 LLM 思考**） | ✅ sddu-auto LLM 真思考（独立决策会话，同 agent 定义 + 同模型 + 同种子上下文） |
| 描述 | 调度前在 task 的 prompt 参数注入「自主执行契约」，劝子 Agent 别问、拿不准硬决策。从源头「预防」提问。 | 拦截 `question.asked` 后向 sddu-auto 主会话注入 `prompt_async` 消息，打断阻塞并触发思考，再 `reply` 代答。 | 为每个子 Agent 开辟独立子会话，提问经 task 返回通道回传，sddu-auto 决策后用 task_id resume 续接。 | 子 Agent 照常提问；决策代理层订阅 `question.asked`、识别子会话，用 `DecisionEngine` 规则匹配答案后 `reply` 代答。 | 子 Agent 照常提问；决策代理层拦截后，用插件 v1 client 开独立决策会话（agent=sddu-auto）→ `prompt` 同步思考 → 全局 `reply` 代答。 |
| 可靠性 | ❌ 依赖 LLM 指令遵从度（非确定性） | ⚠️ 已实证死锁（不可行） | ⚠️ 依赖平台 subagent resume 行为，需实测 | ✅ 拦截在 question 工具协议层，确定性 | ✅ 拦截在协议层确定性 + 超时兜底保底（NFR-003 不阻塞） |
| 决策质量 | — | 高（真思考） | 高（真思考） | 低（规则匹配非语义理解，易误判） | 高（真思考），兜底降级时退化为规则匹配 |
| 子 Agent 改动 | 零改动 | 零改动 | 零改动（保留「提问」自然行为） | 零改动（保留「提问」自然行为） | 零改动（保留「提问」自然行为） |
| 主会话改动 | 零（纯 prompt 编排） | 需改造（注入思考） | 零 | 零 | **零（方案 E 不改造调度循环）** |
| 平台改动 | 零 | 新增「决策代理层」+ 注入通道 | 可能触及平台级改动 | 新增「决策代理层」（协议层拦截） | 新增「决策代理层」（拦截 + 决策会话 + 代答） |
| 实现复杂度 | 低 | 高（且死锁不可行） | 高 | 中 | 中（仅插件层，无队列/无轮询/无注入） |
| 结论 | ❌ 已否决（可靠性不达标） | ❌ 已否决（反编译实证死锁） | ⏸️ 备选（E 失败时的退路） | ❌ 实现偏离（规则匹配非「LLM 自主决策」，已否决；其「拦截 + 识别」机制被 E 继承） | ⭐ 推荐（原生代答协议，无死锁、无队列、无轮询） |

> **方案 B 否决说明（v4.1 保留）**：v4.0 推荐的方案 B（协议层拦截 + prompt_async 注入 sddu-auto 思考）已由 `verify-prompt-interrupt.md` 反编译实证否决——opencode 会话 busy（阻塞等待 task）时，prompt_async 注入的新消息只 FIFO 排队、不打断当前 turn（Runner 状态机 `case"Running" → y(m.run.done)`），唯一打断路径 `cancel` 语义为「取消整个 turn」而非「插入思考后恢复」。因此「注入打断」构成死锁闭环：主会话等 task → task 等子 Agent → 子 Agent 等 question 回答 → 回答等 decision-proxy 注入 → 注入等主会话处理（turn 未结束）。

> **方案 D 的实现偏离说明**：方案 D 在设计意图上写的是「LLM 自主决策答案」，但 plan v3.x 只给了一句「用 LLM 自主决策」，未把「LLM 从哪来、如何注入上下文、如何拿到答案」落地机制写清，导致 TASK-003 用 `DecisionEngine` 规则匹配填坑（关键词匹配 `haystack.includes(label)` / 选首项 / 保守默认），**答案没经过 LLM 思考，不是真正意义上的「代答」**。其「拦截 + 识别」机制已被 spike + 运行实证证明可靠，被方案 E 继承；「规则匹配决策」降级为方案 E 的 30s 超时兜底。

> **变体 B' 降级说明（v4.2 新增）**：v4.1 确定的变体 B'（后台 task + 轮询 + 间隙响应）的全部复杂度源于「必须让阻塞中的 sddu-auto 主会话亲自思考」——该前提在反编译层面是死锁，绕开它需改造调度循环 + 队列中转。方案 E 用「独立决策会话」直接消解该问题（换一个不阻塞的会话思考），主会话与 7 个子 Agent 零改动、无队列无轮询，语义上等价「答案来自 sddu-auto 的 LLM 思考」。**B' 降级为备选**，仅当产品硬性要求「决策必须发生在 sddu-auto 主会话同一会话实例」时保留（ADR-018 原始意图未作此要求）。

> **方案 A / 原方案 B（调度层后置拦截）说明**：原「调度层后置拦截」方案（识别子 Agent 输出中的「提问」文本再代答）与方案 A 同属「软拦截」，依赖「提问语义识别」精度、且无法覆盖「子 Agent 提问后阻塞等待」的情形，可靠性不达标，一并否决；其「兜底代答」思想由方案 E 在协议层更彻底地实现。

---

## 4. 推荐方案
> 推荐方案及选择理由

**推荐**: 方案 E —— 插件内同步决策会话代答（拦截 `question.asked` → 插件内建独立「决策会话」→ `client.session.prompt()` 同步等 LLM 思考 → 全局 `POST /question/{requestID}/reply` 代答）。

> **方案 B' → 方案 E 的修正背景（v4.2）**：v4.1 确定的变体 B'（后台 task + 轮询 + 间隙响应）是「改造调度方式以在阻塞间隙偷时间思考」——其全部复杂度源于一个被反编译定论的死锁事实（sddu-auto 主会话阻塞等待 task 时无法被打断，`verify-prompt-interrupt.md`）。本次调研（`research-agent-reply.md`）确认 opencode question 工具本质是「事件 + deferred 异步等待 + 任意 actor 可代答」的原生协议，据此发现方案 E——「换一个不阻塞的会话去思考」：decision-proxy 在插件 event hook 回调里用插件 v1 client 的 `client.session.create()` 开一个独立 sddu-auto 决策会话（idle、无死锁），`client.session.prompt()` 同步等其 LLM 真思考，再经已实证的全局端点 reply 代答。**无队列、无轮询、无注入打断、无需改造 sddu-auto 调度循环**，主会话与 7 个子 Agent 零改动。

**理由**:
1. **原生代答协议，无死锁**：决策会话是独立 session，`session.prompt` 走 `ensureRunning` 的 Idle 分支正常启动新 run（反编译确认 Idle 分支可用）；被阻塞等待的是子 Agent 会话，不是决策会话——方案 B 的死锁闭环被完全绕开，B' 的「后台 task + 轮询」复杂度也一并消解。
2. **恢复「LLM 自主决策」设计意图**：决策会话使用**同一 agent 定义（sddu-auto）+ 同模型 + 同种子上下文**（启动诉求 auto-context.json + 项目上下文 + 上游产物），答案来自 sddu-auto 的 LLM 真思考，而非协议层规则匹配（对应 spec Q-004）。
3. **决策代理层职责收敛**：decision-proxy 只做「拦截 + 识别 + 建决策会话 + prompt 思考 + reply 代答 + 超时兜底」的确定性管道，不持有模型、不重建推理上下文，职责清晰可测。
4. **严格符合原始诉求**：用户明确「后面的 agent 的问题都由 auto agent 去决策」。方案 E 的决策会话用 sddu-auto agent 定义，语义精确对应「由 auto agent 决策」；决策代理层只是「把问题送达决策会话、把答案送达子 Agent」的确定性通道。
5. **子 Agent 零改动 + 主会话零改动 + 可靠性 100%**：7 个子 Agent prompt 一个字符不改（FR-005），sddu-auto 主会话照旧同步等待 task（无需调度循环改造）；拦截发生在 question 工具协议层，子 Agent 无论怎么问都被确定性路由（FR-006）；30s 超时兜底保证 NFR-003 不阻塞、不反问。
6. **复杂度与延迟均优于 B'**：B' 需「调度循环改造 + 队列中转 + 轮询延迟（轮询间隔 + 思考时长）」；方案 E 只需插件层新增「决策会话管理」，延迟 ≈ 一次 LLM 思考往返（数秒），无队列无轮询。

### 4.1 五要素可落地机制（必须写清，供 tasks 直接执行）

> 逻辑架构：子 Agent 提问 → decision-proxy 拦截 → 插件内建/复用「决策会话」→ prompt 同步思考 → 全局 reply 代答。

**要素 ① —— 决策会话创建（session.create）**：
- decision-proxy 拦截 `question.asked` 后，经 `SessionRegistry.getAutoParent(sessionID)` 确认是 sddu-auto 调度的子会话提问（`autoRoots` 已登记，识别机制不变）。
- 用插件 v1 client 的 `client.session.create({ body: { agent: "sddu-auto", ... } })` 创建「决策会话」；**首次创建后缓存 sessionID，后续决策点复用同一长生命周期决策会话**（避免反复建会话的开销）。
- 决策会话注入**种子上下文**：启动诉求（auto-context.json）+ 项目上下文 + 上游产物（等价 B' 要素 ③ 要求注入的内容）。

**要素 ② —— 思考（session.prompt，同步等待）**：
- 用 `client.session.prompt({ path: { id: 决策会话ID }, body: { agent: "sddu-auto", parts: [种子上下文 + 问题全文 + 选项] } })` 触发决策会话 LLM 真思考，**同步等待完整回答**（decision-proxy 在插件 event hook 内 async 处理，`event` hook 派发是 fire-and-forget，await 不阻塞服务端事件派发）。
- 决策会话 idle（非阻塞中的主会话），`session.prompt` 走 Idle 分支正常启动新 run，无死锁。

**要素 ③ —— 答案回传（全局 reply 代答）**：
- 从决策会话回答中解析答案（单题 → 选中 label；多选题 → label 数组；自由文本 → 保守默认）。
- 代答走**全局端点 `POST /question/{requestID}/reply`**（body `{answers}`，运行实证可靠）；备选：插件自建完整 SDK client 后走 `client.question.reply`（需 `@opencode-ai/sdk` 依赖，见 §4.2 验证点 ③）。
- requestID 直接复用 `question.asked` 事件的 `properties.id`，天然唯一且与 reply 关联。

**要素 ④ —— 30s 超时兜底（NFR-003 不阻塞、不反问）**：
- decision-proxy 对每次「决策会话思考」设超时（**30s**）。
- 超时未拿到决策会话回答 → 降级为**规则匹配兜底**（复用现有 `DecisionEngine`：有选项选关键词匹配项/首项，无选项返回保守默认答案），保证子 Agent 的 question 工具不被无限阻塞。
- 兜底答案同样写入 `auto-decisions.md`，并标注「⏱ 超时兜底（决策会话未在 30s 内响应）」。

**要素 ⑤ —— 决策追溯（保留现有，新增来源字段）**：
- 代答答案 + 依据仍由 decision-proxy 写入 `auto-decisions.md`（生产者 = decision-proxy，与 ADR-020 架构结论一致）。
- 追溯字段标注「决策来源」：`sddu-auto 决策会话`（真 LLM 决策）vs `超时兜底（规则匹配）`，供用户区分决策质量。

### 4.2 技术风险与验证点（核心风险已消除，剩余待 build 阶段固定签名）

> ✅ **核心风险已消除（v4.1）**：方案 B 的先决条件「prompt_async 能否打断阻塞等待 task 的主会话」已由反编译 opencode 1.18.18 **实证否决**（`verify-prompt-interrupt.md` §2.2/§3：Runner 状态机 `case"Running"` 只返回 `y(m.run.done)` 排队，唯一打断 `cancel` 为取消整个 turn 语义）。方案 B 判死锁不可行；**方案 E（插件内同步决策会话代答）为当前首选**，其核心机制依赖已反编译/实证确认：
- ✅ **决策会话 Idle 态可启动新 run**：决策会话是独立 session，`session.prompt` 走 `ensureRunning` 的 `case"Idle"` 分支正常启动新 run（反编译已确认 Idle 分支可用），无死锁。
- ✅ **全局 reply 代答端点已实证**：`POST /question/{requestID}/reply`（body `{answers}`）的拦截→识别→代答闭环已由 `verify-decision-proxy.md` 二轮实证成立。

> ⚠️ **剩余待 build 阶段固定签名**（非可行性风险，仅签名/契约确认，方案 E 的 3 个 build 前置验证点）：
> 1. **session.create / session.prompt body 形状**：插件 v1 client `client.session.create({ body: { agent: "sddu-auto", ... } })` 与 `client.session.prompt({ path: { id }, body: { agent, parts } })` 的精确请求体字段名与返回结构，build 阶段 spike 固定。
> 2. **决策会话权限**：确认插件 v1 client 以何种身份/权限创建并 prompt 决策会话（agent=sddu-auto），确保不会触发权限校验拒绝或陷入与主会话相同的阻塞。
> 3. **@opencode-ai/sdk 可解析性**：若要素 ③ 备选路径走 `client.question.reply`，需确认 `@opencode-ai/sdk` 依赖在当前插件工程可解析、`question.reply` 契约可用；否则走已实证的全局端点 `POST /question/{requestID}/reply`。

---

## 5. 文件影响分析
> 所有需要创建/修改/删除的文件（实现目标仅限设计态源码，遵循 README §173 工程约束）

| 操作 | 文件路径 | 说明 |
|:--:|------|------|
| NEW | `src/templates/agents/sddu-auto.md.hbs` | sddu-auto Agent 模板源码（第 1 层 source-of-truth，唯一可手动修改的 Agent 定义）：启动结构化提问 + 全自主调度编排（照旧同步等待 task，**方案 E 主会话零改动、无需调度循环改造**）+ 决策追溯。核心交付物 |
| MODIFY | `src/adapters/opencode/plugin.ts` | 瘦身为「初始化 + 组装」入口（拆分见 ADR-021）：实例化组件 + 组装 tools / hooks / decision-proxy |
| NEW | `src/adapters/opencode/tools.ts` | 从 plugin.ts 拆出 3 个状态工具 + 辅助函数（行为零变化，见 ADR-021） |
| NEW | `src/adapters/opencode/hooks.ts` | 从 plugin.ts 拆出 4 个生命周期 hook（行为零变化，见 ADR-021） |
| MODIFY | `src/adapters/opencode/decision-proxy.ts` | **决策代理层（本 Feature 核心，方案 E 改造）**：保留「订阅 `question.asked` + `SessionRegistry` 识别 + `reply` 代答」；将「决策」职责由 `DecisionEngine` 规则匹配改为**「建/复用决策会话（session.create）→ prompt 思考 → 全局 reply 代答 → 30s 超时兜底」**，`DecisionEngine` 降级为超时兜底（见 ADR-018） |
| MODIFY | `src/adapters/opencode/templates/opencode.json.hbs` | 在 `agent` 块注册 `sddu-auto`（description/model/prompt 指向 `{file:agents/sddu-auto.md}`） |
| MODIFY | `scripts/build-agents.cjs` | `specialAgents` 列表加入 `sddu-auto`，使 `npm run build` 生成其构建产物（第 2 层） |
| MODIFY | `e2e/scripts/basic/sddu-e2e.sh`、`e2e/scripts/fullstack/sddu-e2e-fullstack.sh` | 启用现有 `--auto` 标志（脚本已有 `AUTO_MODE` 变量）：`AUTO_MODE=true` 时测试提示词入口从 `@sddu` 切换为 `@sddu-auto`，作为本 Feature 的 e2e 验证入口 |
| （可能）NEW | `src/adapters/opencode/decision-session.ts` | **仅当**决策会话管理逻辑（建会话 + 复用缓存 sessionID + 种子上下文组装）封装较复杂、超出 decision-proxy.ts 可读性阈值时，抽为独立 helper；否则内联于 decision-proxy.ts（build 阶段按实际复杂度决定） |

**构建/安装链路（自动生成，不列为手动实现目标）**：
```
src/templates/agents/sddu-auto.md.hbs          ← 第 1 层（source-of-truth，唯一手动改）
        ↓ npm run build（build-agents.cjs）
dist/templates/agents/sddu-auto.md             ← 第 2 层（自动生成，禁止手动编辑）
        ↓ 插件安装/更新
.opencode/agents/sddu-auto.md                  ← 第 3 层（运行时副本，禁止手动编辑）
.opencode/plugins/sddu/agents/sddu-auto.md
```

> ⚠️ **安装边界（重要）**：第 3 层（`install.sh` 安装到 `.opencode/`）**不在当前项目执行**。当前项目是 SDDU 插件自身的开发仓库（dogfooding），不得用最新代码覆盖其 `.opencode/` 运行时副本。安装/运行验证依赖 e2e 脚本——`e2e/scripts/basic/sddu-e2e.sh` / `e2e/scripts/fullstack/sddu-e2e-fullstack.sh` 在 `$HOME/sddu-test-projects/` 下创建临时测试项目时，其 `[2/3]` 步骤已内置 `install.sh` 安装（**创建即自动安装，无需主动调用 install.sh**），sddu-auto 的运行验证在测试项目内完成。

> **明确不改**：
> - 7 个子 Agent 模板源码 `src/templates/agents/sddu-{discovery,spec,plan,tasks,build,review,validate}.md.hbs`（零改动硬约束 NG-001）
> - `src/state/`（复用既有 phase 模型，不新增 phase/status）
> - `.opencode/` 与 `.sddu/`（安装产物/流程产物，README §173 明确不得列为实现目标）
> - `.opencode/agents/sddu.md`（coordinator 路由不变）
> - **权限模型不变**：sddu-auto 保持 `edit: deny` / `bash: deny`（调度者不实施，见现有模板 frontmatter）
> - **SessionRegistry 识别机制不变**：拦截职责（`autoRoots` / `descendants` / `childToAuto`）完全保留，仅在其下游新增「建/复用决策会话 + prompt 思考 + 全局 reply 代答」能力。

> **注**：ADR-018/019/020/021 是 plan 阶段自身产出（已写入 `.sddu/specs-tree-root/specs-tree-autonomous-mode/`），属流程产物，不列为 build 阶段实现目标。

---

## 6. 风险评估
> 识别技术、依赖和时间风险及缓解措施

| 风险 | 概率 | 影响 | 缓解措施 |
|------|:--:|:--:|----------|
| **技术风险（方案 B 先决条件，已实证否决 → 方案 E 首选）**：opencode 会话 API 不支持「向阻塞等待 task 的 sddu-auto 主会话注入消息并打断、触发新一轮思考」，prompt_async 打断能力不成立 | 已确认（原"中"） | 高 | **反编译实证（`verify-prompt-interrupt.md`）已定论**：prompt_async 在会话 busy 时仅 FIFO 排队（Runner `case"Running" → y(m.run.done)`），唯一打断 `cancel` 语义为取消整个 turn，方案 B 死锁不可行。**已决定走方案 E**（插件内独立决策会话代答），其依赖的决策会话 Idle 态启动新 run（`ensureRunning` `case"Idle"`）与全局 reply 端点均已反编译/实证确认 |
| **技术风险（方案 E 新增）**：决策会话创建/复用管理开销——首次 `session.create` 建会话、后续复用 sessionID 的生命周期与并发管理易出错（会话失效/过期未清理、重复建会话） | 中 | 中 | 首次创建后缓存 sessionID 长期复用，避免反复建会话；决策会话失效（过期/被清）时检测并重建；决策会话管理逻辑收敛在 decision-proxy 单一模块，必要时抽 `decision-session.ts` helper 隔离复杂度 |
| **成本风险（方案 E 新增）**：每个决策点消耗一次独立决策会话的 LLM 推理（session.create/prompt 往返 + 思考 token），长流程决策点多则 token 成本上升 | 中 | 低 | 属「真思考」的必然成本，换取决策质量；决策会话复用（非每问重建）摊薄会话初始化开销；30s 超时兜底为规则匹配（零额外 LLM 成本）作为降级下限 |
| **技术风险（方案 E 新增）**：决策会话思考超过 30s 超时窗的概率——模型慢/超时则频繁触发规则匹配兜底，导致决策质量退化 | 低 | 中 | 30s 超时窗与模型响应时长留足余量；超时兜底仅作为保底（NFR-003 不阻塞），非主路径；决策会话空闲（非阻塞等待），思考时长通常数秒内完成 |
| **技术风险**：决策会话回答的解析形状（单题/多选题/自由文本 JSON）不足以可靠提取答案，或 requestID 在多决策点并发下错配 | 中 | 中 | 决策会话回答按约定结构化解析（单题→选中 label、多选题→label 数组、自由文本→保守默认）；requestID 在 event hook 闭包内按次捕获，天然与当前 `question.asked` 对应；JSON 解析失败静默丢弃（等 30s 超时兜底），绝不误配 |
| **性能风险**：代答延迟从规则匹配的 ~26ms 升至决策会话一次 LLM 思考往返的数秒级 | 高 | 中 | 可接受——决策点非高频路径，子 Agent 处于阻塞等待，延迟不影响正确性；30s 超时兜底保证上限；决策会话复用降低会话初始化延迟 |
| **并发风险**：同一时刻多个子 Agent 提问（如并行调度场景），多条 `question.asked` 并发触发决策会话 prompt，回复可能乱序/竞争 | 低 | 中 | requestID 在 event hook 闭包内按次捕获，天然解耦乱序；sddu-auto 调度本就「单任务单阶段串行」（模板 §5.2 规则 4），实际并发提问场景极低；若出现，每条独立决策会话 prompt 互不干扰 |
| **技术风险**：opencode 插件 API 未暴露「订阅 question.asked + 调 Question.reply」完整能力（既有方案 D 风险，已实证缓解） | 低 | 高 | 已被 `verify-decision-proxy.md` 二轮实证：拦截→识别→代答闭环成立（reply 走全局端点 `POST /question/{requestID}/reply`）；此风险降级为已解决 |
| **依赖风险**：决策质量高度依赖启动提问的充分性（Q-004/A-001） | 高 | 高 | ADR-019 定义结构化启动问卷（背景/目标/范围/验收期望/技术偏好/约束六维）+ 最小充分信息集 + 启动阶段内多轮追问（EC-001） |
| **时间风险**：全自主硬决策连锁跑偏，7 流程产物质量下降甚至作废（R-001/Q-006） | 中 | 高 | 属 spec 明确 Non-Goal（NG-003），本模式不负责修正回退；通过 ADR-020 的轻量决策追溯（auto-decisions.md）降低用户事后纠偏成本；用户不满意自行改走 fast/普通 sddu |
| **依赖风险**：原 Roadmap 提案 FR-AUTONOMY-001（分级自主 L0/L1/L2）未正式处置，语义残留 | 低 | 低 | 建议由 roadmap 阶段将原提案标记废弃、由本 Feature 替换（见 ADR-020 后果章节）；plan 阶段给出建议并记录，实际 ROADMAP.md 修改归 roadmap 阶段 |

---

## 7. 生成的 ADR
> 本次规划产出的架构决策记录

| ADR | 标题 | 状态 |
|-----|------|:--:|
| ADR-018 | 子 Agent 提问拦截重定向实现路径（协议层拦截 + 插件内决策会话代答，方案 E） | ACCEPTED |
| ADR-019 | 启动/执行边界切分点与启动提问充分性保障 | PROPOSED |
| ADR-020 | 决策追溯（Q-007）纳入本期范围及原 Roadmap 提案处置 | PROPOSED |
| ADR-021 | plugin.ts 职责拆分与决策代理层模块化 | PROPOSED |

---

## 8. 修订记录
> 记录本文档的版本变更历史

| 版本 | 变更说明 | 日期 | 修订人 |
|------|---------|------|--------|
| v1.0 | 初始创建 — 基于 spec.md v1.0，明确「新增 sddu-auto 代理决策层」技术路径，解决 5 个开放问题，产出 3 个 ADR（018~020） | 2026-08-15 | SDDU Plan Agent |
| v2.0 | 方案对比重写 — 经 opencode 源码调研，否决方案 A/B（软约束不可靠），改推方案 D（Question 协议层拦截 + 代答），更新文件影响与风险评估 | 2026-08-15 | SDDU Plan Agent |
| v3.0 | 第5章按 README §173 工程约束重写（实现目标限设计态源码）+ plugin.ts 职责拆分（新增 ADR-021：tools/hooks/decision-proxy 模块化） | 2026-08-15 | SDDU Plan Agent |
| v3.1 | 第5章补充「安装边界」约束：当前项目不执行 install.sh，安装/运行验证一律在 e2e 生成的测试项目中完成 | 2026-08-15 | SDDU Plan Agent |
| v3.2 | 第5章补充 e2e 验证入口：启用现有 --auto 标志，AUTO_MODE=true 时 e2e 测试入口切换为 @sddu-auto | 2026-08-15 | SDDU Plan Agent |
| v4.0 | **修正「代答机制」实现偏离**：§3 重写为 4 方案对比（以「智能来源」为决定性维度：规则匹配 vs LLM 思考 vs agent 思考）；§4 改为推荐方案 B（协议层拦截 + 回传 sddu-auto 思考），给出 5 要素可落地机制（注入通道/requestID 关联/模板配合/30s 超时兜底/决策追溯）+ opencode 打断能力 spike 验证点与变体 B' 预案；§5 更新 decision-proxy.ts 决策职责改造 + sddu-auto 模板响应 DECISION-REQUEST；§6 补充方案 B 风险（打断能力依赖/延迟/成本/并发）；ADR-018 同步更新 | 2026-08-16 | SDDU Plan Agent |
| v4.1 | **反编译实证否决方案 B → 确定变体 B'**：方案 B 先决条件「prompt_async 注入打断」经反编译 opencode 1.18.18 实证不可行（会话 busy 仅 FIFO 排队、cancel 为取消整个 turn 语义，构成死锁，`verify-prompt-interrupt.md`）；§3 方案 B 列替换为变体 B' 并补否决说明；§4 改为推荐变体 B'（task 后台提交 + 轮询 + 间隙响应 DECISION-REQUEST），5 要素机制由「注入打断」改写为「队列文件/内存共享 + 轮询响应 + 超时兜底」；§4.2 核心风险升级为「已实证否决」并补 B' 轮询延迟/复杂度风险；§5 更新 decision-proxy.ts（写/读队列）与 sddu-auto 模板（调度循环改造）；§6 风险 1 升级为实证结论、新增 B' 轮询风险；ADR-018 同步更新为变体 B' | 2026-08-16 | SDDU Plan Agent |
| v4.2 | **调研发现方案 E → 变体 B' 降级为备选**：调研（`research-agent-reply.md`）确认 opencode question 工具是「事件 + deferred 异步等待 + 任意 actor 可代答」的原生协议，据此确定方案 E（插件内同步决策会话代答）；§3 方案对比以「智能来源」为准补入方案 E 并降级 B'；§4 改为推荐方案 E（拦截 → 建/复用决策会话 session.create → prompt 同步思考 → 全局 reply 代答 → 30s 超时兜底）；5 要素机制由「队列 + 轮询」改写为「决策会话创建 + prompt 思考 + 全局 reply 代答 + 超时兜底」；§4.2 验证点改为方案 E 的 3 个 build 前置验证点（session.create/prompt body 形状、决策会话权限、@opencode-ai/sdk 可解析性）；§5 删除 sddu-auto 调度循环改造说明、decision-proxy.ts 改为「建/复用决策会话 + prompt 思考 + 代答」、`decision-queue.ts` 改为 `decision-session.ts`；§6 删除 B' 专属风险（调度循环复杂度、轮询延迟），替换为方案 E 风险（决策会话创建/复用开销、决策会话 LLM 成本、超时兜底）；ADR-018 标题更新为「协议层拦截 + 插件内决策会话代答（方案 E）」 | 2026-08-16 | SDDU Plan Agent |
