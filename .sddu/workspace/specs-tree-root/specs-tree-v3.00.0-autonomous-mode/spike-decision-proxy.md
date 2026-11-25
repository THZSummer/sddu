# Spike 报告：决策代理层最小可行性验证（静态调研版）

> **Feature**: `specs-tree-autonomous-mode`（FR-AUTONOMY-001）
> **Task**: TASK-001（spike — 决策代理层最小可行性实测，静态调研版）
> **调研方式**: 静态只读调研（读文件 / grep / strings 反编译），**未运行任何 e2e 测试项目**
> **调研日期**: 2026-08-15
> **结论状态**: ✅ 方案 D（Question 协议层拦截 + 代答）**可行**，落地路径为「插件 event hook 通道（首选）+ HTTP API 通道（备选）」

---

## 调研环境与版本矩阵

| 组件 | 版本 | 路径 |
|------|------|------|
| opencode 运行时二进制 | **1.18.18** | `/home/usb/.nvm/versions/node/v24.15.0/lib/node_modules/opencode-ai/bin/opencode.exe`（`opencode --version` 实测 = 1.18.18） |
| 根 node_modules `@opencode-ai/plugin` | **1.16.2** | `/home/usb/wks/sddu/node_modules/@opencode-ai/plugin/package.json` |
| 根 node_modules `@opencode-ai/sdk` | **1.16.2** | `/home/usb/wks/sddu/node_modules/@opencode-ai/sdk/package.json` |
| **`.opencode/node_modules` `@opencode-ai/plugin`** | **1.17.4** | `/home/usb/wks/sddu/.opencode/node_modules/@opencode-ai/plugin/package.json` |
| **`.opencode/node_modules` `@opencode-ai/sdk`** | **1.17.4** | `/home/usb/wks/sddu/.opencode/node_modules/@opencode-ai/sdk/package.json` |

**⚠️ 关键版本差异发现（比 ADR-018 预期的更乐观）**：

- ADR-018 担忧「当前 SDK 1.16.2 无 question 能力」，但**运行时插件实际解析的是 `.opencode/node_modules` 下的 1.17.4**（Node 模块解析从插件文件位置向上逐层查找 node_modules，`.opencode/node_modules` 先于根 `node_modules` 命中）。
- 1.17.4 的 `@opencode-ai/sdk` **v2 子路径是完整的**（含 `EventQuestionAsked` 等 question 事件类型 + `Question` 服务客户端方法）；而根 1.16.2 的 v2 子路径**不完整/损坏**（缺失 `types.gen.d.ts` / `sdk.gen.d.ts` / `index.d.ts`）。
- 但需要说明：**插件 `Hooks.event` 的类型签名用的是 v1 `Event`（来自 `@opencode-ai/sdk` 顶层）**，v1 的 `Event` 联合在 1.16.2 与 1.17.4 **都**不含 question 事件；含 question 事件的是 **v2 的 `Event`**（`@opencode-ai/sdk/v2`）。

---

## ① 结论：question.asked 可订阅性 — ✅ 运行时可达，需升级 SDK 类型

### 证据 1：插件 `Hooks.event` 钩子在 1.16.2 存在，但类型不含 question 事件

`/home/usb/wks/sddu/node_modules/@opencode-ai/plugin/dist/index.d.ts`（1.16.2）：

```ts
export interface Hooks {
    dispose?: () => Promise<void>;
    event?: (input: { event: Event }) => Promise<void>;   // line 175-177
    ...
}
```

`Event` 从 `@opencode-ai/sdk`（v1）导入（line 1）。v1 `Event` 联合（`gen/types.gen.d.ts` line 602）**不含** `question.asked` / `question.replied` / `question.rejected` — 在 1.16.2 与 1.17.4 的 v1 `gen/types.gen.d.ts` 中 grep `question` 均 **0 命中**。

### 证据 2：1.18.18 运行时把**所有** server bus 事件派发给插件 `event` hook

反编译 `opencode.exe`（1.18.18）关键代码：

```
let j=yield*$.listen((N)=>{if(N.location?.directory!==W.directory)return v.void;
  return v.sync(()=>{for(let V of K)V.event?.({event:{id:N.id,type:N.type,properties:N.data}})})});
```

- 插件宿主订阅整个服务端事件总线，把**每个事件**以 `{id, type, properties}` 形状调用插件的 `event` 钩子（仅按 `location.directory` 过滤同项目目录）。
- `question.asked` 是 server bus 事件（Question 服务发布：`yield*o.publish(wr.Asked,$)`），**会原样进入插件 `event` hook**。

### 证据 3：1.18.18 二进制确认 question 事件三件套完整存在

```
strings opencode.exe | grep -oE "question\.(asked|replied|rejected)"   → 14/14/13 次
"question.asked" / "question.replied" / "question.rejected" 事件定义存在
B.event.on("question.asked", ...) / B.event.on("question.replied", ...) / B.event.on("question.rejected", ...) 订阅模式存在
```

### 证据 4：SDK v2 类型（1.17.4）完整声明 question 事件

`/home/usb/wks/sddu/.opencode/node_modules/@opencode-ai/sdk/dist/v2/gen/types.gen.d.ts`：

```ts
export type EventQuestionAsked = {
    id: string;
    type: "question.asked";
    properties: { id: string; sessionID: string; questions: Array<QuestionInfo>; tool?: QuestionTool; };
};
export type EventQuestionReplied = { id: string; type: "question.replied"; properties: { sessionID: string; requestID: string; answers: Array<QuestionAnswer>; }; };
export type EventQuestionRejected = { id: string; type: "question.rejected"; properties: { sessionID: string; requestID: string; }; };
// Event 联合（line 4）包含 EventQuestionAsked | EventQuestionReplied | EventQuestionRejected | EventQuestionV2* ...
```

`/home/usb/wks/sddu/.opencode/node_modules/@opencode-ai/sdk/dist/v2/gen/sdk.gen.d.ts`：`OpencodeClient` 有 `get question(): Question`，且 `Session` 有 `get question(): Question2`（session 级 list/reply/reject）。

### 结论 ①

| 问题 | 答案 |
|------|------|
| 1.16.2 插件 `event` hook 能否收到 `question.asked`？ | **运行时可以**（1.18.18 二进制把全部 server 事件派发给插件 `event` hook），但 **1.16.2 的 TS 类型不声明 question 事件**，需要类型断言或升级 SDK |
| 是否必须升级 SDK？ | **建议升级到 1.17.4+（推荐 1.18.x 对齐运行时）**。升级后 v2 类型（`@opencode-ai/sdk/v2`）完整声明 question 事件与服务；插件 `Hooks.event` 的 v1 `Event` 类型仍不含 question，需 cast 或用 v2 `Event` 类型。不升级（保持 1.16.2）也可运行时收到事件，只是类型不安全。 |

---

## ② 结论：reply 代答通道 — ✅ HTTP API 与 v2 SDK client 均存在

### 证据 1：1.18.18 二进制确认 `session.question.reply` HTTP API

```
strings opencode.exe | grep -oE "session.question.[a-z]+" → session.question.reply / session.question.reject / session.question.list
"/api/session/{sessionID}/question/{requestID}/reply"   ← 精确路由字符串存在
"/api/session/{sessionID}/question/{requestID}/reject"
"/api/session/{sessionID}/question"
"/api/question/request"
"/api/question/{requestID}/reply" / "/api/question/{requestID}/reject"  ← 全局 question 路由
C.post("session.question.reply","/api/session/:sessionID/question/:requestID/reply",{params:{sessionID:b.ID,requestID:dm.ID},payload:dm.Reply,...})
```

### 证据 2：`@opencode/Question` 服务（1.18.18）暴露 reply/reject/list

```
class zo extends ao.Service()("@opencode/Question"){}
Question.ask / Question.reply(requestID, answers) / Question.reject(requestID) / Question.list()
Question.reply 实现：从 pending map 取 deferred → 发布 question.replied 事件 → succeed(deferred, answers)
QuestionRejectedError = "The user dismissed this question"
```

### 证据 3：v2 SDK（1.17.4）client 级代答方法

`/home/usb/wks/sddu/.opencode/node_modules/@opencode-ai/sdk/dist/v2/gen/sdk.gen.d.ts`：

```ts
export declare class Question extends HeyApiClient {
    list(...): ...;                                            // GET /question
    reply(parameters: { requestID: string; answers?: Array<QuestionAnswer>; }, ...): ...;   // POST /question/{requestID}/reply
    reject(parameters: { requestID: string; }, ...): ...;      // POST /question/{requestID}/reject
}
export declare class Question2 extends HeyApiClient {          // session 级（v2.session.question）
    list(parameters: { sessionID: string; }, ...): ...;        // GET /api/session/{sessionID}/question
    reply(parameters: { sessionID: string; requestID: string; questionV2Reply: QuestionV2Reply; }, ...): ...; // POST /api/session/{sessionID}/question/{requestID}/reply
    reject(parameters: { sessionID: string; requestID: string; }, ...): ...;
}
```

### 证据 4：1.16.2 SDK **无** client 级 question 通道

- 根 `@opencode-ai/sdk/dist/gen/sdk.gen.d.ts`（1.16.2）：grep `question` **0 命中**，无 Question service。
- 根 `@opencode-ai/sdk/dist/v2/`（1.16.2）：**不完整** — `v2/gen/` 缺 `types.gen.d.ts`、`sdk.gen.d.ts`、`index.d.ts`，`v2/index.d.ts` 缺失，v2 子路径不可用。

### 结论 ②

| 通道 | 1.16.2 可用？ | 1.17.4+ 可用？ | 1.18.18 运行时 |
|------|:---:|:---:|:---:|
| SDK client `client.question.reply` | ❌ 无 | ✅ v2 SDK | ✅（运行时 client 为 1.18.18 SDK） |
| SDK client `client.v2.session.question.reply` | ❌ v2 损坏 | ✅ | ✅ |
| HTTP API `session.question.reply` | —（需 server 模式） | ✅（需 server 模式） | ✅ 路由已确认 |

- **当前 1.16.2 没有 client 级代答通道**，但 **HTTP API 通道（`session.question.reply`）在 1.18.18 存在**（需 `opencode serve` server 模式，插件可经 `serverUrl` 访问）。
- 插件运行时实际注入的 `client`（`createOpencodeClient()`，PluginInput.client）在 1.18.18 二进制中带有 `get question()` 与 `v2.session.question` 访问器（`strings` 检出 6 处 `get question()`）。

---

## ③ 结论：sessionID 关联 — ✅ question.asked 事件携带 sessionID，task 子会话关联可行

### 证据 1：QuestionRequest 结构（1.18.18 二进制）

```
be=p.Struct({id:pr, sessionID:lr, questions:p.Array(he), tool:p.optional(ae)}).annotate({identifier:"QuestionRequest"})
```

即 `QuestionRequest = { id, sessionID, questions[], tool? }`。

### 证据 2：事件属性（1.18.18 二进制 + v2 类型）

- 事件定义：`se=dr({type:"question.asked", schema:be.fields})` → `question.asked` 事件 properties = QuestionRequest 字段，**含 `sessionID`**。
- v2 类型（1.17.4）`EventQuestionAsked.properties = { id, sessionID, questions, tool? }` — 完全一致。
- 插件 `event` hook 收到的形状：`{event: {id, type: "question.asked", properties: {id, sessionID, questions, tool}}}`。

### 证据 3：TUI / client 侧也用 sessionID 关联 question

二进制中 TUI reducer：`if(L.type==="question.asked"){...B(G.questions,L.properties)...}`，且 TUI 订阅端 `question(sessionID)` 按 sessionID 索引（plugin tui.d.ts line 308 `question: (sessionID: string) => ReadonlyArray<QuestionRequest>`）。

### 结论 ③

- `question.asked` 事件**确实携带 sessionID**。
- task 工具调度子会话时，记录 task 返回的子会话 sessionID；决策代理层收到 `question.asked` 后，用 `event.properties.sessionID` 匹配该子会话，即可精确判定「这个提问属于 sddu-auto 调度的哪个子 Agent」，进而决定代答。**关联机制可行**（SDK 1.18.x 的 `Session.children` API 也可辅助建立 主会话→子会话 映射）。

---

## 判定：落地路径（明确推荐）

### 🥇 首选：插件 event hook 通道（方案 D 主通道）— 推荐

- **运行时可达性已证实**：1.18.18 二进制把全部 server bus 事件（含 `question.asked`）派发给插件 `event` hook，`event.properties.sessionID` 携带子会话 ID。
- **代答已证实**：可调用 `client.question.reply({requestID, answers})` 或 `client.v2.session.question.reply({sessionID, requestID, questionV2Reply})`（HTTP 后端路由在 1.18.18 确认存在）。
- **前置动作**：将 SDK/插件依赖升级至 **1.17.4+（推荐对齐 1.18.x）**，以获得 v2 类型（`EventQuestionAsked`、`Question` 服务）与完整 v2 子路径；升级后 event hook 仍需类型 cast（Hooks.event 的 v1 `Event` 不含 question），或用 v2 `Event` 类型自行收窄。
- 进程内实现，无需 server 模式；可靠性最高（协议层拦截）。

### 🥈 备选：HTTP API 通道（`session.question.reply`）— 可用

- 路由 `POST /api/session/{sessionID}/question/{requestID}/reply` 在 1.18.18 二进制确认存在。
- **需 opencode 运行在 server 模式**（`opencode serve`），插件经 `serverUrl` + fetch 调用。
- 适合「插件进程内通道受限」时的兜底；不依赖 SDK 客户端方法（裸 HTTP 即可），但需要自建 requestID→sessionID 映射与鉴权处理。

### 🥉 方案 C（双会话 resume 降级）— **不触发**

- ①② 均判定可行，方案 D 的插件通道 + HTTP API 均落地，**无需降级方案 C**。

### 版本差异实测依据（AD-018 补充）

| 能力 | 1.16.2（根） | 1.17.4（.opencode） | 1.18.18（运行时） |
|------|:---:|:---:|:---:|
| v1 `Event` 含 question 事件 | ❌ | ❌ | —（运行时事件流为 v2 形状 `{id,type,properties}`） |
| v2 `Event` 含 question 事件 | ❌ v2 损坏（文件缺失） | ✅ | ✅ |
| `Question` 服务 client（list/reply/reject） | ❌ | ✅ | ✅ |
| `session.question.reply` HTTP 路由 | ❌（类型未生成） | ✅（类型已生成） | ✅（二进制确认） |
| 插件 `event` hook 收到 question.asked | 运行时可达（1.18.18 派发全部事件） | 同左 | ✅ |

---

## 验收对照

- [x] spike 报告落地，明确记录「question.asked 是否可订阅」「reply 代答通道是否存在」「sessionID 关联方式」三项调研结论（见 ①②③）
- [x] 明确判定 decision-proxy 落地路径：**插件 event hook 通道（首选）+ HTTP API（备选），方案 C 不触发**
- [x] ADR-018 状态已按结论更新：**PROPOSED → ACCEPTED**（见 ADR-018.md 更新）

## 给 TASK-003 的落地建议

1. **升级依赖**：`package.json` 中 `@opencode-ai/plugin` 与 `@opencode-ai/sdk` 升级到 **≥1.17.4（推荐 1.18.x，与运行时 1.18.18 对齐）**，并确保 `.opencode/package.json`（已锁定 1.17.4）同步。
2. **实现 decision-proxy.ts**：插件返回 Hooks 对象中注册 `event` 钩子，过滤 `event.type === "question.asked"`；按 `event.properties.sessionID` 匹配 sddu-auto 调度子会话（用 task 返回的 sessionID 建立映射）；调用 `client.v2.session.question.reply({sessionID, requestID, questionV2Reply:{answers}})` 代答；拿不准也硬决策。
3. **类型处理**：`Hooks.event` 的 v1 `Event` 不含 question，代码内用 v2 `Event` 类型（`import type { Event } from "@opencode-ai/sdk/v2"`）或局部 cast 收窄。
4. **HTTP 兜底**：若插件进程内通道受限，封装 `POST {serverUrl}/api/session/{sessionID}/question/{requestID}/reply`。
