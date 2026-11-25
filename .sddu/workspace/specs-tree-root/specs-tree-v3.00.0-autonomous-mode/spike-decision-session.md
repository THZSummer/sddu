# TASK-008 spike 报告：方案 E 前置契约验证（session.create/prompt + 决策会话权限 + SDK 依赖）

> **关联 Feature**：`specs-tree-autonomous-mode`（FR-AUTONOMY-001，ADR-018 方案 E）
> **任务**：TASK-008（方案 E 前置契约验证 spike，build 实施前置）
> **验证性质**：契约固定（非重新设计方案——方案 B/B'/E 判定已由 `verify-prompt-interrupt.md` + `research-agent-reply.md` 定论）
> **验证方法**：静态读 SDK 类型声明 + e2e 测试项目运行时实测（一次真实 LLM 往返）
> **验证环境**：`/home/usb/sddu-test-projects/sddu-test-user-login/`（e2e 测试项目，opencode serve 1.18.18，port 4096）
> **验证时间**：2026-08-16
> **验证人**：SDDU Build Agent
> **结论先行**：✅ 三项契约全部实证通过；代答通道判定为 **HTTP 全局端点**（已实证可靠、零额外依赖）

---

## 0. 结论速览

| # | 契约 | 结论 | 关键证据 |
|---|------|------|---------|
| ① | `session.create` / `session.prompt` body 形状 + 同步等待 | ✅ | create body `{title}`/`{agent,title}` 均接受（agent 运行时接受并存储）；prompt body `{agent, parts:[{type:"text",text}]}` 正确；`prompt` 同步等待 10.5s 拿到完整回答（`data.parts` 含 text），无死锁 |
| ② | 决策会话权限（read 可用，edit/bash deny） | ✅ | 决策会话（agent=sddu-auto）实测 read 成功、edit/bash 均 denied，写入目标文件未生成 |
| ③ | 插件依赖 `@opencode-ai/sdk` 可解析性 | ✅ | `@opencode-ai/sdk`（v1）与 `@opencode-ai/sdk/v2` 均可在插件内 import；v2 `client.question.reply` 为 function（全局代答 SDK 通道） |
| ④ | 代答通道选择 | **HTTP 全局端点** | 已实证可靠 + 零依赖；SDK v2 client 仅作可选备选（需新增依赖、无功能增益） |

---

## 1. 验证环境

- **运行时**：opencode 1.18.18（serve 模式，port 4096）
- **测试项目**：`/home/usb/sddu-test-projects/sddu-test-user-login/`（已装 SDDU 插件 + `sddu-auto` agent + `.opencode/node_modules/@opencode-ai/{plugin,sdk}@1.18.18`）
- **spike 插件**：`.opencode/plugins/spike-session.js`（最小样本插件，注册 `spike_session_probe` 工具，落盘 `spike-session-result.json`）
- **模型**：`deepseek/deepseek-v4-pro`（⚠️ 原配置 `volcengine-plan-pro/glm-5.2` 在验证时触发「5 小时用量配额耗尽」，故测试项目 opencode.json 临时切到 `deepseek/deepseek-v4-pro`；**本 spike 验证的是 body 形状/同步等待/权限三项契约，均与模型无关**，模型切换不影响结论）
- **插件注入 client 真实形态**（实测）：v1 形态，顶层 keys = `_client/global/project/pty/config/tool/instance/path/vcs/session/command/provider/find/file/app/mcp/lsp/formatter/tui/auth/event`（**无顶层 `question`/`v2` 访问器**，与 `verify-decision-proxy.md` 一致）

---

## 2. 契约 ①：`session.create` / `session.prompt` body 精确形状 + 同步等待行为

### 2.1 `client.session.create()` body 形状

**SDK 类型声明**（`@opencode-ai/sdk/dist/gen/types.gen.d.ts` L1811，1.18.18）：
```ts
SessionCreateData = { body?: { parentID?: string; title?: string }; query?: { directory?: string }; url: "/session" }
// 注意：SDK 类型未声明 agent 字段
```

**运行时实测**（`spike-session-result.json`）：

| 调用 | 返回 Session 字段 | 说明 |
|------|------------------|------|
| `create({ body: { title: "spike-decision-session" } })` | `{id, slug, projectID, directory, path, cost, tokens, title, version, time}` | ✅ 无 agent 字段，创建成功 |
| `create({ body: { agent: "sddu-auto", title: "..." } })` | 上述字段 **+ `agent: "sddu-auto"`** | ✅ `agent` 字段**运行时被接受并存储**（SDK 类型宽松，未声明但运行时透传接受） |

**结论**：`session.create({ body: { agent, title } })` 的 `agent` 字段**运行时有效**（存储到 session），ADR-018 的 `client.session.create({ body: { agent: "sddu-auto", ... } })` 假设成立。但 `agent` 字段**非权威**——LLM 实际用的 agent 由 `session.prompt` 的 `body.agent` 决定（见 2.3）。

### 2.2 `client.session.prompt()` body 形状

**SDK 类型声明**（`types.gen.d.ts` L2244，1.18.18）：
```ts
SessionPromptData = {
  path: { id: string },                       // 会话 ID
  body?: {
    messageID?: string;
    model?: { providerID: string; modelID: string };
    agent?: string;                            // ★ agent 在这里
    noReply?: boolean;
    system?: string;
    tools?: { [key: string]: boolean };
    parts: Array<TextPartInput | FilePartInput | AgentPartInput | SubtaskPartInput>;  // ★ 必填
  };
  url: "/session/{id}/message";
}
// TextPartInput = { type: "text"; text: string; synthetic?; ignored?; id?; time?; metadata? }
```

**运行时实测 body 形状**（最小可用）：
```js
client.session.prompt({
  path: { id: decisionSessionID },
  body: {
    agent: "sddu-auto",                              // 权威 agent（决定权限模型 + 默认 model）
    parts: [{ type: "text", text: "只回复两个词：PONG" }],  // 文本 part
  },
})
```

### 2.3 同步等待行为（idle 无死锁，一次 LLM 往返成功）

**实测**：`prompt` 返回耗时 **10480ms（≈10.5s）**，期间同步等待 LLM 完整思考完成（非 204 立即返回，对比 `promptAsync` 返回 204 void）。

**返回结构**（`spike-session-result.json` → `prompt-sync-wait`）：
```jsonc
{
  "durationMs": 10480,                              // 同步等待 ≈10.5s
  "data": {                                         // 返回 data，非 error
    "info": {                                       // AssistantMessage
      "role": "assistant", "agent": "sddu-auto",
      "modelID": "deepseek-v4-pro", "providerID": "deepseek",
      "finish": "..."                                // finish 字段存在（turn 完整结束）
    },
    "parts": [                                      // parts 类型序列
      { "type": "step-start" }, { "type": "reasoning" },
      { "type": "text", "text": "PONG PONG" },      // ★ 答案文本在此
      { "type": "step-finish" }
    ]
  }
}
```

**关键结论**：
1. **同步等待**：`prompt` 阻塞等待 LLM 完成，返回 `{ data: { info, parts } }`（hey-api `{data, error, request, response}` 形状，用 `.data` 取值）。
2. **无死锁**：决策会话是独立 session（idle），`prompt` 走 `ensureRunning` 的 Idle 分支正常启动新 run，10.5s 完整往返——方案 B 的死锁闭环被绕开（与 `verify-prompt-interrupt.md` 反编译结论一致）。
3. **会话复用无死锁**：同一决策会话连续两次 `prompt`（第二次为权限验证，耗时 9.8s）均正常完成，证明 idle→prompt→idle→prompt 长生命周期复用成立。

### 2.4 答案文本提取规则（供 TASK-009 解析）

决策会话回答中，答案文本在 `data.parts` 里 `type === "text"` 的 part 中，提取方式：
```ts
const text = result.data.parts
  .filter((p) => p.type === "text")
  .map((p) => p.text)
  .join("\n");
```
（`reasoning` part 是思考过程，`step-start`/`step-finish` 是回合边界，均不参与答案解析）

---

## 3. 契约 ②：决策会话权限约束

**实测**（`spike-session-result.json` → `decision-session-permission`）：向决策会话（agent=sddu-auto）注入「依次 read / edit / bash 三件事并汇报」的 prompt，决策会话实际执行后汇报：

```
1) 【成功】读取 package.json 第一行内容为：{
2) 【失败：原因】无 edit/write 工具权限，无法新建文件写入内容
3) 【失败：原因】无 bash 工具权限，无法执行命令

最终结论：
- read 是否可用：✅ 可用（已成功读取 package.json 第一行）
- edit 是否可用：❌ 不可用（无编辑/写文件工具，符合 sddu-auto「调度者不实施」权限约束）
- bash 是否可用：❌ 不可用（无命令执行工具）
```

**旁证**：`write-target-exists: false` —— 决策会话尝试新建的 `spike-should-not-exist.txt` 在文件系统**不存在**，证明 edit 确被拒绝（非仅口头汇报）。

**结论**：决策会话沿用 sddu-auto 的 frontmatter 权限模型（`edit: deny` / `bash: deny` / `webfetch: deny`），实测 **read ✅ 可用、edit ❌ deny、bash ❌ deny**。决策会话可读上游产物/上下文，但无法跑偏实施动作——与 ADR-018 要素「决策会话权限」要求一致。`webfetch: deny` 与 edit/bash 同处 frontmatter 同一块，虽未单独实测（非 TASK-008 验收点），推论同被 deny。

> ⚠️ **前提说明**：权限模型由 `session.prompt` 的 `body.agent: "sddu-auto"` 决定（本验证在 prompt 处指定 agent，故权限生效）。若 prompt 处**不指定 agent**，则取决于 session.create 时是否存入了 agent——TASK-009 实现应**始终在 prompt body 显式传 `agent: "sddu-auto"`**，确保权限模型与模型选择确定性生效。

---

## 4. 契约 ③：插件依赖 `@opencode-ai/sdk` 可解析性

**实测**（`spike-session-result.json` → `sdk-resolvability`，在插件 `execute` 内动态 import）：

| 探测 | 结果 |
|------|------|
| `import('@opencode-ai/sdk')`（v1） | ✅ 可解析，`createOpencodeClient` 为 function |
| v1 client `client.session.prompt` | ✅ function |
| v1 client `client.question.reply` | ❌ `undefined`（**v1 client 无 question 命名空间**） |
| `import('@opencode-ai/sdk/v2')`（v2） | ✅ 可解析，`createOpencodeClient` 为 function |
| v2 client `client.question.reply` | ✅ **function**（全局代答 SDK 通道） |
| v2 client `client.session.question.reply` | ❌ `undefined`（session 级 question 访问器运行时不可用，与「session 级 reply 404」既证一致） |

**结论**：
1. 插件运行时**能自建完整 SDK client**（`@opencode-ai/sdk/v2` 的 `createOpencodeClient`），且 v2 client 暴露 `client.question.reply({requestID, answers})`（function）——即「进程内 SDK 代答通道」理论可行。
2. 但插件注入的 **v1 client 无 `question` 命名空间**（与 `verify-decision-proxy.md` 一致），走 SDK 代答必须**自建 v2 client**，需在 `.opencode/package.json` 声明 `@opencode-ai/sdk` 依赖 + 传 `baseUrl`（serverUrl）+ client 生命周期管理。
3. `client.question.reply`（v2 全局）本质是全局端点 `POST /question/{requestID}/reply` 的 SDK 壳，与 HTTP 全局端点**同源**，无功能增益。

---

## 5. 代答通道选择判定

| 通道 | 形态 | 依赖 | 可用性 | 判定 |
|------|------|------|:--:|:--:|
| **A. HTTP 全局端点** `POST /question/{requestID}/reply`（body `{answers}`） | 任意进程可调 | **零额外依赖** | ✅ 已实证（`verify-decision-proxy.md` 二轮） | ⭐ **主通道** |
| B. 自建 v2 SDK client `client.question.reply({requestID, answers})` | 插件内 `import('@opencode-ai/sdk/v2')` | 需声明 `@opencode-ai/sdk` 依赖 + baseUrl 配置 | ✅ 可解析（本次 spike 实证） | ⏸️ 备选（收益低） |
| C. SDK v2 session 级 `client.session.question.reply` | — | — | ❌ 运行时 `undefined` + 既证 404 | 否决 |
| D. 插件注入 v1 client `client.question.*` | — | — | ❌ 运行时无此访问器 | 否决 |

**判定：代答通道选择 HTTP 全局端点（通道 A）**。理由：
1. **已实证可靠**：`verify-decision-proxy.md` 二轮证明 `POST /question/{requestID}/reply` 能解除 pending 并让子 Agent 拿到答案继续。
2. **零额外依赖**：无需在 `.opencode/package.json` 声明 `@opencode-ai/sdk`，避免依赖解析/版本对齐风险。
3. **与现状零改动**：现有 `decision-proxy.ts` 通道 3 已实现 HTTP 全局端点，TASK-009 无需改代答通道。
4. 通道 B（SDK v2 client）虽然可解析，但走同一全局端点、无功能增益，反而引入依赖与 client 生命周期管理成本——**不建议本期引入**，保留为「若未来需进程内直连」的兼容探测即可。

---

## 6. 给 TASK-009 的契约签名（可直接实现）

### 6.1 决策会话创建（建/复用）

```ts
// ① 建决策会话（首次创建后缓存 sessionID 复用）
const created = await client.session.create({
  body: { agent: "sddu-auto", title: "sddu-auto 决策会话" },
  //      ^^^^^ agent 可选（运行时接受并存储），但非权威
});
const decisionSessionID = created.data.id;   // 返回 { data: Session, error? }，取 .data.id
```

### 6.2 决策会话思考（prompt 同步等待）

```ts
// ② 同步等 LLM 真思考（决策会话 idle，无死锁，一次完整往返）
const result = await client.session.prompt({
  path: { id: decisionSessionID },
  body: {
    agent: "sddu-auto",                       // ★ 权威 agent（决定权限 + 默认 model），必须显式传
    parts: [
      { type: "text", text: `${种子上下文}\n${问题全文}\n${选项}` },  // 种子上下文 + 问题 + 选项
    ],
  },
});

// ③ 解析答案文本
const text = result.data.parts
  .filter((p) => p.type === "text")
  .map((p) => p.text)
  .join("\n");
// 从 text 解析：单题 → 选中 label；多选题 → label 数组；自由文本 → 保守默认
```

### 6.3 代答（全局端点）

```ts
// ④ 全局 reply 代答（30s 超时 → 降级 DecisionEngine 规则匹配兜底）
const res = await fetch(`${serverUrl}/question/${encodeURIComponent(requestID)}/reply`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ answers }),   // answers: string[][]
});
```

### 6.4 关键契约要点汇总

| 契约点 | 固定值 |
|--------|--------|
| `session.create` body | `{ agent?: string; title?: string }`（agent 可选，运行时接受） |
| `session.prompt` path | `{ id: decisionSessionID }` |
| `session.prompt` body | `{ agent: "sddu-auto", parts: [{ type: "text", text }] }`（agent 必传，parts 必填） |
| `session.prompt` 返回 | `{ data: { info: AssistantMessage, parts: Part[] } }`（同步等待，取 `.data`） |
| 答案文本提取 | `data.parts.filter(p => p.type === "text").map(p => p.text).join("\n")` |
| 决策会话权限 | read ✅ / edit ❌ / bash ❌（由 `body.agent: "sddu-auto"` 的 frontmatter 决定） |
| 代答通道 | `POST /question/{requestID}/reply` body `{ answers: string[][] }` |
| 超时兜底 | 30s → `DecisionEngine` 规则匹配（NFR-003） |
| 会话复用 | 同一 decisionSessionID 连续 prompt 无死锁（已实证 idle→prompt→idle） |

---

## 7. 修订记录

| 版本 | 变更说明 | 日期 | 修订人 |
|------|---------|------|--------|
| v1.0 | 初始创建 — 三项契约（session.create/prompt 形状 + 同步等待、决策会话权限、@opencode-ai/sdk 可解析性）运行时实证全部通过；代答通道判定 HTTP 全局端点；固定 TASK-009 契约签名 | 2026-08-16 | SDDU Build Agent |
