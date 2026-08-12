# Pi (earendil-works) 深度调研报告

> 调研对象：[earendil-works/pi](https://github.com/earendil-works/pi) — Pi Agent Harness
> 调研日期：2026-08-12
> 调研人：opencode (SDDU team)
> 对标项目：SDDU (本项目) — 重点对标 agent 基础设施层（LLM 抽象 / agent 运行时 / harness 扩展体系）
> 调研深度：源码级（5.9MB 源码快照，覆盖 10 个 package）

---

## 1. 项目概览

| 维度 | Pi Agent Harness | SDDU |
|------|-----------------|------|
| 定位 | 极简终端编码 agent harness（"adapt pi to your workflows"） | 软件开发定义统一流程框架（8 阶段 Agent 编排） |
| 作者 | earendil-works（badlogic / Mario Zechner 主导） | THZSummer |
| 许可证 | MIT | MIT |
| 仓库 Stars | ~88.4k（2026-08 快照） | — |
| 语言 | TypeScript (monorepo, Bun 编译单二进制) | TypeScript (OpenCode 插件) |
| 平台 | 任何可跑 Node ≥22 / Bun 的环境 | OpenCode 专属 |
| 核心形态 | 10 个 npm package 的 agent 工具链 | OpenCode 插件 + 状态机 + 模板体系 |
| 运行模式 | interactive / print / JSON / RPC / SDK 五模式 | @sddu 智能路由 → 阶段 Agent |
| 子代理 (sub agents) | ❌ 明确不做（"skips features like sub agents and plan mode"） | ✅ 核心能力（8 阶段编排） |
| Plan 模式 | ❌ 明确不做 | ✅ 核心能力（plan.md + tasks.md） |
| 权限系统 | 无内置（容器化 3 模式：Gondolin / Docker / OpenShell） | 依赖 OpenCode 权限模型 |
| 可观测性 | pi-telemetry 厂商中立契约 | 无系统化遥测 |
| 评测体系 | pi-evals 行为级评测（vitest-evals） | validate 阶段（人工/脚本） |

**一句话总结**：Pi 是一个**基础设施层的通用 agent harness**——把"调 LLM、跑 agent 循环、管会话、做终端 UI"这些 agent 基建做到极致，但刻意不做业务方法论（无 plan mode、无 sub agents、无流程编排）；SDDU 是一个**方法论层的流程框架**——把"需求挖掘→规格→计划→任务→构建→审查→验证"的软件开发流程编排成规范，但基建完全依赖 OpenCode。两者的本质差异是"通用 agent 引擎" vs "专用开发流程层"，**互补性大于竞争性**。

---

## 2. 架构全景（10 包 monorepo）

```
┌─────────────────────────────────────────────────────────────────┐
│                     pi-coding-agent (CLI/harness)                │
│   interactive TUI / print / JSON / RPC / SDK 五模式             │
│   7 内置工具 + 21 斜杠命令 + 扩展五件套                          │
├─────────────────────────────────────────────────────────────────┤
│  pi-agent-core        pi-protocol ◄── pi-client ──► pi-server    │
│  (agent loop + 会话)  (CBOR RPC 契约)  (会话租约)   (常驻服务)    │
├─────────────────────────────────────────────────────────────────┤
│            pi-ai (统一 LLM API：provider/auth/模型目录)          │
├─────────────────────────────────────────────────────────────────┤
│  pi-tui (差分渲染)  pi-telemetry (遥测契约)  pi-evals (评测)      │
│  session-backends/sqlite-node (可插拔会话后端)                   │
└─────────────────────────────────────────────────────────────────┘
```

| 包 | 定位 | 关键设计 |
|----|------|---------|
| `pi-ai` | 统一多 provider LLM API | 三层解耦（API 实现 / Provider 工厂 / Models 集合）、模型目录生成期强制 tool_call 过滤 |
| `pi-agent-core` | 有状态 agent + 工具执行 + 事件流 | 无状态 loop + 有状态外壳、会话=单调追加日志、compaction 压缩 |
| `pi-coding-agent` | 交互式编码 CLI | 单内核多模式、扩展五件套、RPC 双轨制 |
| `pi-protocol` | 运行时无关协议 | 4 字节长度前缀 + CBOR、snapshot 权威 + progress 增量 |
| `pi-client` | 传输中立远程会话客户端 | session lease（exclusive/shared）互斥 |
| `pi-server` | 常驻会话服务（实验性） | listener 可插拔、Unix socket 认证 |
| `pi-tui` | 极简终端 UI 框架 | 差分渲染 + CSI 2026 原子同步输出 |
| `pi-telemetry` | 厂商中立遥测契约 | 回调式 span、无 exporter、NOOP 兜底、conformance 测试 |
| `pi-evals` | 行为级模型评测 | vitest-evals 适配、隔离目录、A/B 对比 |
| `session-backends/sqlite-node` | SQLite 会话后端 | SessionRepo 接口倒置、conformance 保障互换性 |

---

## 3. 核心机制深度分析

### 3.1 pi-ai：统一 LLM API（packages/ai）

**三层解耦架构**是最大亮点：

- **API 实现层**（`src/api/*.ts`）：每个 provider 一个模块，导出统一的 `stream`/`streamSimple`（`ProviderStreams` 接口，`types.ts:268-277`）
- **Provider 工厂层**（`src/providers/*.ts`）：`createProvider({ id, baseUrl, auth, models, api })` 把"模型目录 + auth + API 实现"装配成 Provider
- **Models 集合层**（`src/models.ts`）：持有所有 Provider，统一路由 + auth 解析 + 便捷方法

新增一家供应商 = 加一个 API 模块 + 一个 provider 工厂，互不侵入。

**模型目录双层管理**：
- 静态目录：构建期从 models.dev / OpenRouter 抓取生成 `models.generated.ts`，**生成期强制过滤 tool-calling 模型**（`if (m.tool_call !== true) continue;`）——因为 agentic 工作流必须工具调用
- 动态 provider（openrouter 等）：`refreshModels()` + ModelsStore 持久化，与静态基线 merge 覆盖

**Auth 作为 Provider 第一公民**：每个 provider 必有 apiKey/oauth；CredentialStore 的 `modify()` 用 per-provider 串行 promise 链防并发双刷新；OAuth 带双重检查锁；解析顺序 = 显式 override → 已存凭据 → 环境变量/文件 ambient。

**统一事件流协议**：`AssistantMessageEvent`（text/thinking/toolcall 的 start/delta/end + partial 快照）是 pi-ai 与 agent 层的通信语言。流式 tool call 部分 JSON 用 `parseStreamingJson`（JSON.parse → partial-json → repair 三级回退）渐进解析。

**Thinking 统一抽象**：pi 的 7 级 thinking（off/minimal/low/.../max）通过 `Model.thinkingLevelMap` 映射到各 provider 的 effort/toggle 值（null=不支持），配 ThinkingBudgets 分配 + clamp。

**成本即元数据**：`model.cost`（$/M token + tiers 阶梯）+ `calculateCost`，usage 随 AssistantMessage 全程流转，agent 层累计 SessionStats。

### 3.2 pi-agent-core：agent 引擎（packages/agent）

**agent loop 双层循环**（`agent-loop.ts`）：外层 steering/follow-up 队列多轮，内层单轮工具循环。`stopReason === "length"` 时**整体废弃工具调用**（防截断误执行）。错误不 throw 而是编码进事件流。

**Agent（有状态）包住 loop（无状态）**：`Agent` 提供 subscribe/queue/abort 外壳；`AgentLoopConfig` 的全部 hook（transformContext / convertToLlm / beforeToolCall / afterToolCall / prepareNextTurn / shouldStopAfterTurn）都是注入点——**上层框架（如 SDDU）可以在不 fork 的情况下接入自己的编排逻辑**。

**会话 = 单调追加日志 + 可还原状态机**（`session/state.ts`）：
- `SessionState` 强制 seq 连续、id 唯一、parent 链合法
- JSONL 每行一个 mutation，原子发布（`.tmp` + rename）+ torn-tail 修复
- 支持 fork / 多 lane / branch 树形会话
- `reducer.ts` 是崩溃恢复心脏：`validateRecordLog`（13 种 corruption）→ `reduceLaneState` 纯函数重建操作状态

**compaction 压缩**：`findCutPoint` 按 keepRecentTokens 从尾部找合法切点；固定结构化 prompt（Goal/Progress/Key Decisions/Next Steps）生成摘要；**提取历史文件读写操作**附加到摘要；以 compaction entry 持久化（含 retainedTail），旧内容丢弃只留最新摘要。

**分支摘要**（`branch-summarization.ts`）：找旧 leaf 与新 target 的最深公共祖先，被抛弃分支条目收拢生成 `branch_summary`，恢复时以 `<summary>` 块注入——这是"会话树导航"的基础。

**工具执行安全**：所有文件/Shell 操作走可注入的 `ExecutionEnv`（FileSystem + Shell 接口）；错误用 `Result<..., FileError|ExecutionError>`（不 throw）；`withFileMutationQueue` 按 canonical path per-file 串行化防并发写冲突；edit 工具精确匹配失败才 fuzzy（Unicode 归一化）+ 多 edit 重叠检测。

### 3.3 pi-coding-agent：harness 层（packages/coding-agent，199 个源文件）

**单内核多模式**：`AgentSession`（业务）+ `AgentSessionRuntime`（服务）+ 四层薄模式（interactive TUI / print / JSON / RPC）共用同一内核，模式只换协议。模式判定：rpc → json → print（非 TTY 自动）→ interactive。

**工具集**：7 个内置工具 `read/bash/edit/write/grep/find/ls`；`!cmd`（结果进上下文）vs `!!cmd`（excludeFromContext 不污染上下文）；21 个 `/` 斜杠命令（settings/model/export/fork/tree/trust/compact...）。

**扩展五件套**（这是与 SDDU 相关性最高的一块）：
| 机制 | 本质 | 文件 |
|------|------|------|
| Extensions | TS 模块（jiti/Bun 加载），订阅 30+ 生命周期事件，可注册工具/命令/快捷键/CLI flag/Provider | `core/extensions/` |
| Skills | Agent Skills 规范（agentskills.io）：SKILL.md frontmatter、`<available_skills>` XML 注入、`/skill:name` 调用 | `core/skills.ts` |
| Prompt Templates | `prompts/*.md` + bash 风格参数替换（`$1/$@/${N:-default}`） | `core/prompt-templates.ts` |
| Themes | JSON 主题 + 文件 watcher 热切换 | `modes/interactive/theme/` |
| Pi Packages | package.json 的 `pi` 字段声明以上资源，npm/git 分享 | `core/pi-manifest.ts` |

资源统一由 resource-loader 按 **user/project/path 三层 source 聚合**，SourceInfo 记录来源 + 冲突诊断——与 SDDU 的 `sddu-skill-sync`（源目录→实际目录）形成对照。

**RPC 双轨制**：进程内 JSONL RPC（stdin/stdout，`takeOverStdout` 保证协议干净）+ 常驻 server/client（Unix socket、CBOR 帧、snapshot 权威 + progress 增量、session lease 互斥）。覆盖从脚本嵌入到守护进程的所有集成场景。

### 3.4 其他包要点

- **pi-tui**：组件树全量 `render(width)` + 屏幕层 diff 只写变化行；CSI 2026（`\x1b[?2026h/l`）同步输出防闪烁；Kitty/iTerm2 内联图片。
- **pi-telemetry**：回调式 `TelemetryContext.startSpan` 契约；NOOP 共享单例兜底；InMemory 参考实现；**"Recording is passive"**（记录失败绝不影响业务）；conformance 测试保证任何 exporter 契约一致——无全局 current-span、无 exporter、无后端依赖。
- **pi-protocol/client/server**：SessionMetadata（轻量索引）vs SessionSnapshot（完整权威状态，revision 单调递增广播）；snapshot 权威、progress 只做中间渲染；session lease exclusive/shared 互斥 + generation 断线失效。
- **pi-evals**：真实 AgentSession + 完全隔离临时目录 + vitest-evals harness/judge；产物 `runs.jsonl` + 会话 JSONL artifact；A/B 对比（baseline vs candidate × repetition）配对 lift 统计。
- **session-backends**：接口倒置——核心包只认 `SessionRepo` 接口 + conformance 测试，SQLite 独立包实现（node:sqlite，Node ≥22.19），未来任意后端可插。

### 3.5 工程治理（AGENTS.md / SECURITY.md）

**AGENTS.md 是"人 + agent 共同遵守"的项目规则**，非常值得 SDDU 学习，亮点包括：
- **多会话并发安全 git 规则**：只 stage 自己会话改的文件（`git add <path>` 禁止 `git add -A`）、提交前 `git status` 核对、禁止 `git reset --hard`/`git clean -fd` 等破坏性命令
- 提交格式规范 `{feat,fix,docs}[(scope)]: message` + 禁止 emoji
- 依赖安全：直接依赖精确锁定、lockfile 变更视为 review 代码、pre-commit 拦截
- 测试纪律：不跑全量 vitest（含 e2e 会烧 token）、回归测试命名 `<issue>-<slug>.test.ts`
- 版本发布：lockstep 同步版本、`/cl` prompt 审计 CHANGELOG、CI OIDC 可信发布（npm trusted publishing）

**安全模型**：明确"本地用户账户与 pi 进程同一信任边界"；不设沙箱；AGENTS.md/注释可被 prompt inject 且无法防护；容器化 3 模式（Gondolin 微 VM / 纯 Docker / OpenShell 策略沙箱）作为增强边界。

---

## 4. 与 SDDU 对比

### 4.1 架构对比

| 维度 | Pi | SDDU | 关系 |
|------|----|------|------|
| 层位 | agent 基础设施层（LLM/loop/会话/UI） | 方法论流程层（阶段编排/规范/状态机） | 互补：pi 可作 SDDU 的底层引擎候选 |
| Agent 编排 | 无 sub agents、无 plan mode（刻意省略） | 8 阶段 sub-agent 编排 + plan/tasks 文档 | **哲学对立 → 各自边界清晰** |
| 会话/状态 | 追加日志 + reducer 还原（JSONL/SQLite） | state.json 状态机（phase/status 字段） | pi 的崩溃恢复更强；SDDU 的语义更明确 |
| 会话树 | fork/lane/branch + compaction 压缩 | specs-tree 目录树（Feature 产物） | 同为树形，一个在运行时一个在文件系统 |
| 扩展体系 | Extensions/Skills/Prompt Templates/Themes/Pi Packages | Agents/skills 体系（源目录→实际目录同步） | 高度对应，可互相借鉴 |
| 工具契约 | TypeBox schema 校验 + ExecutionEnv 注入 | 各 Agent 内置工具（无统一契约） | pi 更严格 |
| 可观测性 | telemetry 契约 + conformance | 无 | **SDDU 缺口** |
| 评测 | 行为级 evals（隔离目录 + A/B） | validate 阶段（人工/脚本） | **SDDU 可借鉴** |
| 权限 | 无内置（容器化） | 依赖 OpenCode 权限模型 | 同为"信任边界靠外部" |
| 供应链 | 精确锁定 + shrinkwrap + install-lock | 常规 npm | **pi 更严格** |

### 4.2 维度对比

| 维度 | 评估 |
|------|------|
| **定位清晰度** | pi：通用工具链，无方法论负担，任何团队可直接用；SDDU：开发流程规范，方法论资产重但价值高 |
| **上手门槛** | pi：`npm i -g` 即用；SDDU：需 OpenCode + 插件 + 流程学习 |
| **扩展成本** | pi：TS 扩展 + SKILL.md 零代码；SDDU：注册 Agent + 模板（成本略高） |
| **可测试性** | pi：evals + conformance 双保障；SDDU：validate 阶段人工为主 |
| **可观测性** | pi：telemetry 契约化；SDDU：无 |
| **崩溃恢复** | pi：reducer 纯函数重建；SDDU：state.json 直接覆盖（无原子性保障） |
| **社区** | 88.4k stars 快速崛起（2025-08 创建）；SDDU：内部项目 |

---

## 5. Pi 的可借鉴之处

### 5.1 高优先级（建议短期借鉴）

| # | 借鉴点 | 来源 | 说明 | RICE 粗评 |
|---|--------|------|------|----------|
| 1 | **多会话并发安全 git 规则** | AGENTS.md §Git | SDDU 同样面临"多会话改同一仓库"（build/review/validate 并行）。规则：只 stage 自己文件、禁 `git add -A`、提交前 status 核对、禁破坏性命令。成本极低、直接提升协作安全 | Reach 3 / Impact 4 / Conf 4 / Effort 1 → 48 |
| 2 | **会话/产物原子写 + 损坏自愈** | session/jsonl/storage.ts | state.json 写入用 `.tmp` + 原子 rename + torn-tail 修复，避免崩溃留下半写状态。SDDU state.json 更新可加同样机制 | Reach 2 / Impact 4 / Conf 4 / Effort 1 → 32 |
| 3 | **Tool schema 统一校验** | TypeBox 贯穿 | SDDU 各 Agent 工具无统一 schema 校验；引入 TypeBox（或 zod）统一工具参数契约 + 校验失败友好错误 | Reach 4 / Impact 3 / Conf 4 / Effort 2 → 24 |

### 5.2 中优先级（建议中期借鉴）

| # | 借鉴点 | 来源 | 说明 | RICE 粗评 |
|---|--------|------|------|----------|
| 4 | **telemetry 厂商中立契约** | packages/telemetry | SDDU 增加回调式 span 契约（NOOP 兜底、passive 记录、conformance 测试），记录各阶段耗时/token/成本，零侵入 | Reach 3 / Impact 3 / Conf 3 / Effort 3 → 9 |
| 5 | **conformance 测试模式** | session-backends + telemetry | 对关键接口（会话存储/遥测适配器）提供契约测试，任何实现必须过同一套用例——SDDU 的 skills 同步/存储层可用 | Reach 3 / Impact 3 / Conf 3 / Effort 2 → 13.5 |
| 6 | **上下文压缩（compaction）** | agent/compaction | SDDU discovery/spec 长文档上下文管理可借鉴"结构化摘要 + 文件操作追踪 + retainedTail 重建"策略，降低长会话 token 消耗 | Reach 3 / Impact 3 / Conf 3 / Effort 3 → 9 |
| 7 | **Prompt Template 参数化** | core/prompt-templates.ts | `$1/$@/${N:-default}` 参数替换模板——SDDU 的 .hbs 模板已有 Handlebars，可借鉴 pi 的"文档模板 + 占位符"轻量模式 | Reach 3 / Impact 2 / Conf 4 / Effort 1 → 24 |

### 5.3 低优先级（长期参考）

| # | 借鉴点 | 来源 | 说明 |
|---|--------|------|------|
| 8 | 行为级评测体系 | packages/evals | SDDU validate 增强为"隔离目录 + 模型判官 + A/B 对比"，重投入（需评测基建） |
| 9 | 会话分享生态 | pi-share-hf | 把 OSS 会话发布到 HuggingFace 数据集，需社区生态配合 |
| 10 | Bun 单二进制分发 | build:binary | SDDU 若需独立分发插件可借鉴，当前 OpenCode 插件形态不需要 |
| 11 | Session lease 互斥 | pi-client | SDDU 若做远程/多客户端场景可借鉴 exclusive/shared 租约 |

---

## 6. SDDU 的差异化优势（应保持）

1. **方法论资产**：SDDU 的 8 阶段流程、spec/plan/tasks 模板、ADR 体系、TREE 导航——pi 完全不涉及，这是 SDDU 不可替代的核心。
2. **流程即规范**：SDDU 把"需求→交付"做成可追踪的状态机（phase/status），pi 无任何流程语义，会话只是通用对话记录。
3. **Agent 编排**：SDDU 的 sub-agent 分工（discovery/spec/plan/build/review/validate）是 pi 明确不做的（"skips sub agents"）——SDDU 的编排能力是差异化优势。
4. **文档体系**：specs-tree-root 的 Feature 产物 + docs-tree-root 全景文档，pi 只有 JSONL 会话树。
5. **方法论落地**：SDDU 的 discovery 访谈协议、ADR 判定标准、validate 验证清单——pi 没有对应物。

---

## 7. 量化对比总表

| 指标 | Pi | SDDU |
|------|----|------|
| Stars | ~88.4k | — |
| 源文件数（调研快照） | ~500+ TS 文件 | — |
| 包/模块数 | 10 package monorepo | 8 阶段 Agent + 19 Feature |
| 运行模式 | 5 种 | 1 种（OpenCode 内） |
| 内置工具 | 7 个 | 各 Agent 自带 |
| 扩展机制 | 5 种资源 | Agents + skills 2 层 |
| 权限模型 | 无内置（容器化） | OpenCode 权限 |
| 遥测 | 有（契约化） | 无 |
| 评测 | 行为级 evals | validate 脚本/人工 |
| 状态恢复 | reducer + 原子写 | state.json 直接覆盖 |
| 供应链 | 精确锁定 + 双重校验 | 常规 |
| 生态 | npm 发布 + HF 会话分享 | 内部项目 |

---

## 8. 建议行动项

### P0（低投入高回报，建议 1-2 周内）
- **SDDU-AGENT-001**：将 AGENTS.md 的"多会话并发安全 git 规则"移植到 SDDU 工作流规范（只 stage 自己的文件、提交前 status 核对、禁止破坏性命令）——覆盖 @sddu-build/review/validate 的 git 操作指引。

### P1（中期规划）
- **SDDU-OBS-001**：引入 telemetry 厂商中立契约（参考 pi-telemetry），为 8 阶段流程增加"阶段耗时/token/成本"可观测性，零侵入（NOOP 兜底 + conformance 测试）。
- **SDDU-STATE-001**：state.json 更新增加原子写（`.tmp` + rename）+ 损坏自愈（torn-tail 检测），提升崩溃恢复能力。
- **SDDU-TOOL-001**：为 Agent 工具引入统一 schema 校验（TypeBox/zod），统一工具参数契约。

### P2（长期参考）
- **SDDU-EVAL-001**：参考 pi-evals 增强 validate 阶段为"隔离目录 + 行为级断言"（重投入，需评测基建）。

> **说明**：以上行动项为调研建议，未纳入 ROADMAP。如需正式立项，建议走 SDDU 完整流程（`@sddu 开始 [feature名]`）或在 `@sddu-roadmap` 阶段评估优先级。

---

## 9. 附录

### 9.1 调研对象信息

- 仓库：https://github.com/earendil-works/pi
- 网站：https://pi.dev
- 文档：https://pi.dev/docs/latest
- License：MIT
- 创建：2025-08-09；最近活跃：2026-08-12
- 下载方式：tarball 快照（`https://github.com/earendil-works/pi/archive/refs/heads/main.tar.gz`，5.9MB）

### 9.2 关键源码索引（调研快照 /tmp/opencode/pi-src/pi-main）

| 主题 | 关键文件 |
|------|---------|
| LLM 三层抽象 | `packages/ai/src/models.ts`、`providers/openai.ts`、`types.ts` |
| 模型目录生成 | `packages/ai/scripts/generate-models.ts`（tool_call 过滤） |
| Auth 解析 | `packages/ai/src/auth/resolve.ts`、`credential-store.ts` |
| agent loop | `packages/agent/src/agent-loop.ts`、`agent.ts` |
| 会话状态机 | `packages/agent/src/harness/session/state.ts`、`jsonl/storage.ts` |
| 压缩/分支摘要 | `packages/agent/src/harness/compaction/` |
| 崩溃恢复 reducer | `packages/agent/src/harness/reducer.ts` |
| 扩展体系 | `packages/coding-agent/src/core/extensions/`、`skills.ts`、`pi-manifest.ts` |
| RPC 协议 | `packages/protocol/src/framing.ts`、`codec.ts`、`schemas.ts` |
| 会话租约 | `packages/client/src/client.ts`、`session-handle.ts` |
| 遥测契约 | `packages/telemetry/src/index.ts`、`testing/conformance.ts` |
| TUI 差分渲染 | `packages/tui/src/tui-main-screen.ts`、`tui-alt-screen.ts` |
| 评测体系 | `packages/evals/src/pi-harness.ts`、`smoke.eval.ts` |

### 9.3 参考链接

- GitHub 仓库：https://github.com/earendil-works/pi
- Pi 官网与文档：https://pi.dev / https://pi.dev/docs/latest
- 会话分享工具：https://github.com/badlogic/pi-share-hf
- 评测框架：https://github.com/getsentry/vitest-evals
- AGENTS.md 原文（多会话 git 规则参考）：https://github.com/earendil-works/pi/blob/main/AGENTS.md
