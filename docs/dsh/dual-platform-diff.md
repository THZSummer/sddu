# 双平台差异清单：OpenCode vs dsh

> **文档定位**: 同一套 SDDU 方法论在两个平台上的承载方式差异 —— 供用户判断「能期待什么」
> **权威来源**: 两平台的承载方案分别见 `plan.md` 与 ADR-001~006（本 Feature，v5.0.0）
> **时效锚定**: 本文档的 dsh 事实（rank 100/400、`SessionEvent` 会话日志、guard 流水线、目录约定）锚定 **2026-08-14** 单一快照；未按 [`upgrade-following.md`](./upgrade-following.md) 步骤 0 刷新契约前**不得视为当前 dsh 事实**（快照态、不可信）。
> **创建人**: SDDU Build Agent
> **版本**: v1.0

---

## 0. 核心结论（先读）

**同一套 SDDU 方法论，两个平台的承载机制不同，能力并不等价。**

- **指令语义**：同源（dsh 的 `SKILL.md` 指令正文来自与 OpenCode 相同的源模板，构建期拼接、不改写）→ 方法论一致。
- **承载与强制力**：不同（一个是 TypeScript 插件 + 硬状态机，一个是 Markdown 指令包）→ **能力落差真实存在**。

> ⚠️ **能力落差不得表述为两平台等价**：任何文档、说明或口头表述都不得暗示
> 「dsh 侧与 OpenCode 侧行为一致」或「dsh 侧同样强制」。本清单的存在就是为了让落差**可见**。

---

## 1. 五维差异表

| 维度 | OpenCode 侧 | dsh 侧 | 落差性质 |
|------|-------------|--------|---------|
| **入口** | 智能路由 `@sddu` + Agent 模式；平台原生命令/Agent 机制 | **路由 Skill `sddu` + 文本前缀识别**（`/sddu <phase> <feature>`）；无平台级命令注册 | ⚠️ **已知缺口**：平台级命令需 dsh 插件；入口是「指令约定的入口」，若平台拦截斜杠输入则走降级用法 |
| **承载** | TypeScript 插件（`src/adapters/opencode/`），有运行时逻辑 | **非代码形态**：Markdown `SKILL.md` 目录树（`dist/dsh/skills/`），**无运行时逻辑** | dsh 侧适配能力**无法被单元测试覆盖**，测试只能断言生成物结构 |
| **门禁** | **代码层强制**：核心状态机在 `updateState()` 中抛 `PhaseReversalError` / `PhaseSkipError`，从代码层拒绝非法跃迁（调用即抛错，不可绕过） | **显式可观测软引导**（FR-004b，**非硬强制**）：输出 `[SDDU-GATE-DENY]` / `[SDDU-GATE-ALLOW]` 且不推进；**无运行时拒绝点** | ⚠️ 门禁在 dsh 侧**不具运行时强制力**，约束力来自模型对指令的遵从；对抗性用户可以绕过（公开边界） |
| **状态** | `state.json` 为事实源，由状态机读写（含不可逆状态与父/子状态管理） | `state.json` **仍为唯一权威**；dsh `SessionEvent` 日志仅作**观测与对账源**；推进时输出 `[SDDU-STATE-SYNC]` | 语义不变（NG-004）；差别在于 dsh 侧由**模型用文件工具**写 `state.json`，存在并发/覆盖风险，靠三方对账发现 |
| **落位** | 插件安装到 `.opencode/`（`install.sh` 只消费 `dist/sddu/`） | Skill 包落位 `rank 100` `<projectRoot>/.dsh/skills`（或 `rank 400` `<dshHome>/skills`） | 分发隔离：`dist/dsh/` 与 `dist/sddu/` **同级并列、互不包含** |

---

## 2. 逐维补充说明

### 入口

- OpenCode：`@sddu` 智能路由 / Agent 模式是**平台一等公民**。
- dsh：只有「Skill 被加载后，模型按指令识别文本前缀」。`/sddu ...` 是否送达取决于平台行为，
  **不由 SDDU 控制** → 必须提供降级用法（`sddu <phase> <feature>` 或自然语言）。

### 承载

- OpenCode：插件可注册工具、读写文件、抛错中断。
- dsh：Skill 是「**可选的指令而非会话事件**」，**不携带执行能力** ——
  不能注册工具、不能挂 guard、不能介入 `ctx.tools.execute()` 流水线。
- 因此「适配能力」在 dsh 侧的可验证面只剩**生成物静态结构 + 人工实机观测**。

### 门禁

- OpenCode 的拒绝是**代码层**的：调用即抛错，无法绕过。
- dsh 的拒绝是**指令层**的：输出结构化拒绝块并停止推进；模型若不遵从，门禁失效。
- 硬 guard 通道（`tools/pre-execute` → 单调 guard → …）是理论上的运行时载体，
  但需实现 dsh 插件（Cordis bundle），契约细节在快照中未覆盖 → **v5.1.0+ 演进点，本 Feature 不实现**。

### 状态

- 两平台都用 `.sddu/specs-tree-root/<feature>/state.json`，`phase` / `status` / `phaseHistory` 语义一致。
- dsh 侧额外要求把每次推进以 `[SDDU-STATE-SYNC]` 单行 JSON 输出到会话中，
  使 `SessionEvent` 日志自然获得可回放的推进证据；**该记录不是机器可校验的强证据**。

### 落位

- OpenCode：`install.sh` 只消费 `dist/sddu/`，dsh 资产**不会**进入 `.opencode/`。
- dsh：`rank 100` 为主落位（目录约定即生效），`rank 400` 为用户级选项。

---

## 3. 随版本核对说明

本清单是**活文档**，必须随版本核对，避免长期漂移：

| 触发时机 | 核对动作 |
|---------|---------|
| dsh 契约刷新（升级跟随步骤 0） | 重新核对「入口 / 承载 / 门禁 / 状态 / 落位」五维是否仍成立；重点核对 `command-registration`、`profile-bundle`、`guard-pipeline` 三类快照空白是否已补全 |
| SDDU 侧新增阶段或 Agent | 核对入口清单（`router-command-map.json`）、11 个 Skill 清单与本表是否一致 |
| 门禁机制演进（硬 guard 落地） | 若 v5.1.0+ 实现 dsh 插件承载硬拒绝，本表的「门禁」行必须同步改写，**不得**保留旧表述 |
| `dist/dsh/manifest.json` 的 `contractManifestHash` 变化 | 说明契约基线变化 → 应复核本清单与 `contract-dependencies.md` |

**核对口径**：以 `docs/dsh/contract-dependencies.md` 的 `observableCheck` 为逐条核对清单，
逐项标注「未变 / 已变 / 无法观测」；**「无法观测」不得记为「未变」**。

---

## 4. 一句话结论

> **方法论同源，能力不等价。** SDDU 在 dsh 上的交付是「**可观测、可对账、明示降级**」的
> 指令包形态；强制力与自动化程度低于 OpenCode 侧，且该落差是**公开的、文档化的边界**。
