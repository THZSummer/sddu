# DeepSeek Harness (dsh) 深度调研报告

> 调研对象：[deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) — DeepSeek AI 官方开源的 agent harness
> 调研日期：2026-08-14
> 调研人：opencode (SDDU team)
> 对标项目：SDDU (本项目) — 重点对标 agent 基础设施层（插件体系 / 事件日志 / 技能注册 / 子代理 / 工具流水线）
> 调研深度：方法论 + 关键源码级（14MB tarball 快照，69MB 解压，覆盖 52 个 package + 2 个 app）

---

## 1. 项目概览

| 维度 | DeepSeek Harness (dsh) | SDDU |
|------|------------------------|------|
| 定位 | 通用 agent harness（"Everything is a Plugin"） | 软件开发定义统一流程框架（8 阶段 Agent 编排） |
| 作者 | DeepSeek AI（官方团队） | THZSummer |
| 许可证 | MIT | MIT |
| 仓库 Stars | ~87.1k（2026-08-14 快照，创建于 2026-08-13） | — |
| 语言 | TypeScript (pnpm monorepo, 52 packages) | TypeScript (OpenCode 插件) |
| 平台 | 任何可跑 Node ≥22.19 的环境 | OpenCode 专属 |
| 核心形态 | 插件树 + Cordis 框架 + Web UI | OpenCode 插件 + 状态机 + 模板体系 |
| 底层框架 | [Cordis](https://github.com/cordiverse/cordis)（时空可组合性编程范式，vendor 引入） | 无（自研状态机 v3.0.0） |
| 运行模式 | `npx @deepseek-ai/dsh web` → Web UI (127.0.0.1:3080) | `@sddu` 智能路由 → 阶段 Agent |
| 子代理 (subagents) | ✅ 核心能力（seam + 6 个 provider） | ✅ 子 Feature 树形嵌套 |
| Plan 模式 | ✅ 软引导（plan/mode 日志状态，非强制） | ✅ 硬强制（PhaseSkipError，不跳步） |
| 状态管理 | append-only 事件日志（可回放/fork/resume/compaction） | state.json 状态机（phase + status） |
| 权限系统 | 作用域化注册 + 单调 guard + approve/deny/ask 流水线 | 依赖 OpenCode 权限模型 |
| Skill 系统 | 提供方注册表（本地/内嵌/远程）+ rank 优先级 | 三层 Skill 目录 + 三元自举闭环 |
| 状态阶段 | Developer preview（快速迭代，兼容性破坏警告） | v3.3.0 稳定 |

**一句话总结**：dsh 是一个**"一切皆插件"的通用 agent harness**——把"agent 运行时、插件树、事件日志、工具流水线、子代理编排"这些基础设施做成零特权内核的插件化架构，并内置了 plan mode、todo、skill 等轻量方法论元素；SDDU 是一个**方法论层的流程框架**——把软件开发流程编排成 7 阶段规范，基建依赖 OpenCode。两者的本质差异与 Pi 类似，是"通用 agent 引擎" vs "专用开发流程层"；但 dsh 比 Pi 更接近 SDDU——它**自带 plan mode 和 skill 系统**，方法论元素多于 Pi，是当前与 SDDU 重叠度最高的竞品之一。

---

## 2. 架构全景（52 包 monorepo）

```
┌─────────────────────────────────────────────────────────────┐
│  apps/  cli (dsh CLI)  web (Web UI @ 127.0.0.1:3080)         │
├─────────────────────────────────────────────────────────────┤
│  profile 分层组装：dsh-base → dsh-web-app / dsh-headless      │
│  (组合包 bundle + cordis.patch.yml overlay 叠加)              │
├─────────────────────────────────────────────────────────────┤
│  packages/core/  产品 API 脊柱                                  │
│   session(事件日志) system-prompt(提示组装) tools(工具注册表)     │
│   agent(接口) agent-loop(驱动器) scope(作用域原语)               │
├─────────────────────────────────────────────────────────────┤
│  packages/llm/  统一 LLM seam + DeepSeek providers            │
│  packages/subagent/  子代理 seam + 6 providers                │
│  packages/skill/  技能提供方注册表 + 本地/内嵌 provider          │
│  packages/session/ 持久化/投影/标题/遥测                        │
│  packages/{fs,shell,subprocess,terminal,lsp,web,e2b}/ 能力 seam│
│  packages/{plan,todo,workflow,goal,compaction}/ 方法论插件     │
│  packages/{guard,hooks,interaction}/ 治理与交互                 │
│  packages/{boot,sdk,acp,api,typert}/ 平台与协议                 │
├─────────────────────────────────────────────────────────────┤
│  vendor/Cordis 源码（pinned 同步） python/ native/ SDK         │
└─────────────────────────────────────────────────────────────┘
```

| 包族 | 职责 | 关键设计 |
|------|------|---------|
| `core/session` | append-only `SessionEvent` 日志（唯一事实源） | 模型历史从日志 `deriveMessages()` 派生，不单独存储 |
| `core/system-prompt` | 提示词片段 + 工具 schema 组装 | 按序拼接，每个步骤读取插件注册的 section |
| `core/tools` | 作用域化工具注册表 + 把关执行流水线 | waterfall 事件链 + 单调 guard，allow/deny/ask |
| `core/agent` | `Agent` 接口 + 活跃注册表 + `agent/*` 事件 | 无状态 loop + 有状态外壳（agent.ctx 作用域） |
| `core/agent-loop` | 默认驱动器（可替换） | 每个 agent 独立 scope，卸载即撤销 |
| `core/scope` | 按 agent 划分作用域的注册原语 | 库（无 ctx 键），被 session/tools 复用 |
| `llm/llm` | 消息与流式词汇表 + 适配器 seam | 新增 provider = 注册适配器，不侵入 loop |
| `subagent/` | 子代理 seam + 6 providers | spawn-in-process / fork / acp / codex / claude-code / dsh-sdk |
| `skill/` | 技能提供方注册表 + 发现 | 本地/内嵌/远程 provider + rank 优先级 |
| `plan/` | plan mode 软引导 | `plan/mode` 仅存在于日志，非强制 |

---

## 3. 核心机制深度分析

### 3.1 "一切皆插件" + Cordis 插件树（零特权内核）

dsh 最核心的设计是**没有特权内核**：模型的适配器、工具注册表、会话日志、甚至 agent loop 本身都是插件，每个部分都可以从配置替换。

- 运行中的 dsh 是一棵**插件树**，由启动时按序叠加的各层组合而成
- **profile** 是具名组装（`web` / `headless` 模板随发行版交付），列出组合包 + 树外插件 + `cordis.patch.yml`
- **组合包（bundle）** 是 Cordis 配置项 + 挂载代码的分发格式，插入内容始终可被上层 patch
- patch 按 id 定位条目并替换整个 config，或插入新条目；`dsh --profile web --dump-config` 可查看实际配置树

Cordis 五个核心概念（vendor 引入，`docs/cordis-primer.md`）：

1. **插件是实现 Service 的对象**（函数或 Service 子类，生命周期由 Cordis 挂载）
2. **上下文是服务的容器**（`ctx.<key>` 稳定寻址，不导入具体实现）
3. **通过 `inject` 声明依赖**（加载顺序由依赖表达，非手动编排）
4. **类型化事件用于通信**（`emit` / `waterfall` / `parallel` / `serial` 四种分发模式）
5. **注册是可逆的副作用**（`ctx.effect()` / `ctx.on()` 安装，reload/teardown 自动撤销）

> **与 SDDU 对比**：SDDU 采用"固定 Agent 角色 + 可扩展 Skill"双层架构；dsh 是"一切皆插件"的单层插件树。SDDU 的 Agent 是流程角色（有明确阶段边界），dsh 的插件是能力单元（按 scope 叠加）。理念差异：SDDU 用**角色约束**保证流程纪律，dsh 用**作用域隔离**保证能力可组合。

### 3.2 append-only 会话事件日志（单一事实源）

dsh 的会话模型是 **append-only `SessionEvent` 日志**，12 种事件变体：

| 事件 | 含义 |
|------|------|
| `turn/start` / `turn/end` | 轮次边界（一个轮次 = 零或多个步骤） |
| `step/start` / `step/end` | 步骤边界（一个步骤 = 一次模型请求 + 工具调用） |
| `user/message` | 用户消息（持久） |
| `assistant/chunk` / `assistant/message` | 模型流式输出（原始 chunk 保证回放和 UI 保真） |
| `tool/call` / `tool/result` | 工具调用与结果（持久） |
| `steering/message` | 转向输入（不唤醒驱动器的消息） |
| `todo/write` | todo 写入（持久投影） |
| `request/header` | 请求头（冻结的调用配置） |

**关键不变量："模型可见即已记录"（Model-visible ⟺ logged）**——抵达模型请求的一切必须能从日志重建，由运行时断言强制执行。新增模型可见输入 = 扩展 `SessionEventMap` + 从日志渲染。

派生能力全部来自事件流：`deriveMessages()`（模型历史）、fork（分支）、resume（恢复）、compaction（压缩）、transcript（文本记录）、遥测、持久化。

> **与 SDDU 对比**：SDDU 用 state.json（可变状态机，phase + status）追踪 Feature 状态；dsh 用 append-only 事件日志（可回放、可 fork、可恢复）。SDDU 的"文档即状态"是**产物级**日志（每阶段产出文档），dsh 的"事件即状态"是**事件级**日志（每个动作都有记录）。两者哲学一致（可追溯），但粒度不同：dsh 可精确回放到任意时间点，SDDU 只能看到阶段产物快照。

### 3.3 工具流水线：waterfall 事件 + 单调 guard

`ctx.tools.execute()` 执行链：`tools/pre-execute`（可重排 allow/deny/ask）→ 注册的单调 guard → `tools/execute`（环绕包装层）→ `tools/post-execute`（检查/替换）→ `finalizeContent`（工具自有的内容收尾）→ `tools/result`（不可变权威结果）。

**安全设计的三个亮点**：

- **Waterfall 语义**：监听器接收 `(...args, next)`，调用 `next()` 委托下游；不调用则短路。策略监听器拥有决策权时可直接返回，观察监听器必须委托（`docs/cordis-primer.md#cordis-waterfall-semantics`）
- **单调 guard**：`ToolGuard` 返回 `string | undefined`，只能缩减权限（deny），**没有 allow 结果**——后续监听器无法把已拒绝的调用翻回允许，杜绝了"审批顺序漏洞"
- **结果物化**：规范 `value` 仅存在于执行期间，循环只持久化 `content` / `error` / `meta`——回放可重现展示，无法重建中间值（防泄漏）

工具 schema 使用**类型化 DSL**（`defineTool` + `ValueSchemaSpec`），TypeScript 类型精确推断到 16 层容器，运行时仍校验完整 schema。`schemas()` 用显式白名单构建面向模型的 `ToolSchema[]`，执行回调绝不泄漏到模型请求。

> **与 SDDU 对比**：SDDU 的 Agent 工具权限依赖 OpenCode 权限模型（allow/deny 静态规则）；dsh 的 waterfall + 单调 guard 是**运行时策略链**，支持 deny→ask→approve 的动态审批。单调 guard 的"只能缩减权限"设计值得 SDDU 借鉴——保证多层策略叠加时安全不降级。

### 3.4 Skill 系统：提供方注册表 + rank 优先级

dsh 的 skill 能力族（`packages/skill/`）是一个**提供方注册表**：`ctx.skills` 组合本地、内嵌、远程或其他提供方，Provider 接口为 `list()` + `get()`（`docs/subsystems/skills.md`）。

**本地发现优先级**（rank 顺序，重名时最近层优先，单层内按 rank 裁决）：

| Rank | Source | Root |
|------|--------|------|
| 100 | `project-dsh` | `<projectRoot>/.dsh/skills` |
| 200 | `project-agents` | `<projectRoot>/.agents/skills` |
| 300 | `custom` | `Config.customSkillDirs` |
| 400 | `user-dsh` | `<dshHome>/skills` |
| 500 | `user-agents` | `<agentsHome>/skills` |
| 600 | `bundled` | `Config.bundledSkillDir` |

关键设计：
- skill 是**可选的指令而非会话事件**（加载与否不影响日志一致性）
- 宿主 + 按 scope 分层（与工具注册表同构），preset 挂载的插件落入该 preset 层
- 发现缓存以解析后的 scope 链为键；提供方代次变化时重试一次，再变化返回不完整观测
- `skills/change` 失效事件驱动消费方重新快照

> **与 SDDU 对比**：SDDU 是"三层 Skill 目录"（用户级 `.sddu/skills/` / 框架级 `.opencode/plugins/sddu/skills/` / 实际运行 `.opencode/skills/`）+ 三元自举闭环（discovery/creator/sync）；dsh 是"提供方抽象 + rank 优先级"。差异：① dsh 的 provider 接口支持**远程/内嵌提供方**，SDDU 只有本地文件目录；② dsh 用 rank 数值仲裁冲突，SDDU 用目录层级仲裁；③ dsh 的 skill 发现与 scope 绑定，SDDU 的 skill 发现与 Agent 会话绑定。

### 3.5 Subagent：可委派 + 可继续的 seam

dsh 的子代理是一个 **seam**（`ctx.subagents`），与 bash 等能力不同——**同一上下文中可共存多个提供方实现**，按名称注册。6 个 provider：`spawn-in-process` / `fork` / `acp` / `codex` / `claude-code` / `dsh-sdk`。

两类能力：
- **单次启动**：`SubagentProvider.start()`，通过能力 flag（outputSchema / depthLimit / toolFilter / persona）声明，请求依赖的能力缺失时明确拒绝（fail loud）
- **可继续**：`SubagentProvider.prepareContinuable()` 存在即为能力（TypeScript 类型收窄作发现机制），子代理可以暂停、汇报、恢复

子代理继承父会话的 cwd、谱系、委派深度；`parent` 提供会话上下文；工具过滤器与 persona 通过作用域限定在子 agent 创建阶段。

> **与 SDDU 对比**：SDDU 的子 Feature 是**静态树形嵌套**（每个子 Feature 独立走完整 7 阶段），dsh 的子代理是**运行时动态委派**（一个 agent 可将工作委派给子 agent，可继续对话）。SDDU 强在流程确定性（子 Feature 可追溯），dsh 强在运行灵活性（委派关系可组合）。"可继续 subagent" 值得 SDDU 借鉴——用于多轮 Agent 协作的场景。

### 3.6 Plan Mode：软引导 vs 硬强制

dsh 的 plan mode 是**软引导**：`plan/mode`（`{ active: boolean }`）是一个仅存在于日志中的 `SessionEventMap` 成员，每次以完整值替换；`foldPlanMode(events)` 从日志恢复状态。

- `/plan [message]` 进入，`/plan off` 退出，`exit_plan_mode` 经用户明确批准后退出
- 部署方配置 `section` 提示词（"You are in plan mode. Explore and design before presenting the complete plan..."）
- **沙箱模式和批准策略各自强制执行限制，不读写 plan 状态**——plan mode 只是软引导，不越权强制

> **与 SDDU 对比**：这是两者理念最鲜明的差异——SDDU 的"不跳步"原则是**硬强制**（`PhaseSkipError` / `PhaseReversalError` 代码层拒绝），dsh 的 plan mode 是**软引导**（模型看到提示词 section，但工具仍可用）。SDDU 用强制保证流程纪律（适合方法论框架），dsh 用引导保证灵活性（适合通用 harness）。

---

## 4. 工程实践（AGENTS.md 观察）

dsh 的 AGENTS.md 是目前看到最详尽的 agent 协作规范之一，值得记录：

| 实践 | 内容 |
|------|------|
| 测试分层 | focused tests（行为）/ snapshots（模型或用户输出）/ doc-sync（文档门禁）/ build smokes（发布路径）/ real-API e2e（provider 行为） |
| 覆盖率门禁 | `test:coverage` 每文件 100%（CI 门禁，非 `test`） |
| 文档门禁 | `pnpm run doc-sync` 所有文档门禁，`gen-cordis-catalog` 生成 API 目录并校验新鲜 |
| 事件 JSDoc | 每个事件必须 `@mode` 标签 + `@param`，生成目录交叉校验声明与分发调用点 |
| Branded IDs | 跨包 ID 全部 branded（`Branded<B>`），type 层面不可互换，运行时是普通字符串 |
| 注册即效应 | 每个注册通过 `ctx.effect()` / `ctx.on()`，registry 的 `register()` 返回 disposer |
| 不变量断言 | 运行时不变量断言 owned relationships（检查权威事件流，非服务/方法存在性） |
| 双语文档 | 所有文档 i18n.yaml + 中英双语，website 是 VitePress 投影 |
| Pre-release 立场 | "foundation over blast radius"——无外部消费者时优先正确基础而非兼容垫片 |

---

## 5. 与 Pi 的关系（已调研竞品对照）

| 维度 | Pi (earendil-works) | DeepSeek Harness | SDDU |
|------|--------------------|------------------|------|
| 定位 | 极简终端 agent harness | 一切皆插件的 agent harness | 软件开发流程框架 |
| 子代理 | ❌ 明确不做 | ✅ seam + 6 providers | ✅ 子 Feature |
| Plan 模式 | ❌ 明确不做 | ✅ 软引导 | ✅ 硬强制 |
| 方法论元素 | 无 | 有（plan/todo/skill） | 强（7 阶段） |
| 扩展方式 | 扩展五件套 | 插件树 + 作用域 | 固定 Agent + Skill |
| 状态管理 | 会话=单调追加日志 | append-only 事件日志 | state.json 状态机 |

**结论**：dsh 介于 Pi 和 SDDU 之间——它比 Pi 多方法论元素（plan mode、skill、todo），比 SDDU 少流程强制力（软引导 vs 硬强制）。对 SDDU 而言，dsh 是最值得借鉴基础设施设计的竞品（事件日志、waterfall 流水线、技能注册表），而方法论层面 SDDU 仍保持"硬强制"差异化优势。

---

## 6. 对标评估：SDDU vs dsh 维度评分

| 维度 | SDDU | dsh | 差距分析 |
|------|:----:|:---:|---------|
| 流程确定性（阶段强制） | ⭐⭐⭐⭐⭐ | ⭐⭐ | SDDU 硬强制 vs dsh 软引导——方法论层 SDDU 胜 |
| 可追溯性（状态日志） | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | dsh 事件日志可回放任意时间点，SDDU 只有产物快照 |
| 扩展性（插件/技能） | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | dsh 一切皆插件零内核，SDDU 固定 Agent + Skill 双层 |
| 工具安全（执行流水线） | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | dsh waterfall + 单调 guard 动态审批，SDDU 依赖 OpenCode 静态权限 |
| 子代理/委派 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | dsh 可继续 subagent 运行时委派，SDDU 静态树形嵌套 |
| 文档工程化 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | dsh 双语 + 生成目录 + 门禁全链路，SDDU 单语为主 |

---

## 7. 竞品借鉴建议（未纳入 ROADMAP）

> 以下行动项为调研建议，未纳入 ROADMAP。如需正式立项，建议走 SDDU 完整流程（`@sddu 开始 [feature名]`）或在 `@sddu-roadmap` 阶段评估优先级。

### P0（低投入高回报，建议 1-2 周内）
- **SDDU-EVLOG-001**：借鉴 dsh 事件日志模型，为 state.json 增加 append-only 变更日志（记录每个 phase/status 迁移事件）——保留状态机的同时获得可回放性。改动集中在 `src/state/`，风险可控，可先做只读日志不改变现有状态机行为。

### P1（中期规划）
- **SDDU-GUARD-001**：为 Agent 工具把关引入"单调 guard"语义——SDDU 的权限模型只允许缩减权限（deny），不允许恢复（allow）。可先在 `@sddu-build` 的 git 操作把关中试点。
- **SDDU-SKILL-PROV-001**：将 Skill 发现从"目录扫描"升级为"提供方抽象 + rank 优先级"——支持远程/内嵌提供方，用 rank 仲裁目录冲突。与 FR-SKILL-001（Skill 系统）衔接，可作为其 v2 演进方向。
- **SDDU-SUBAGENT-001**：为子 Feature 引入"可继续委派"能力——父 Agent 可将轮次委派给子 Agent，暂停/汇报/恢复，而非仅静态树形嵌套。

### P2（长期参考）
- **SDDU-DOCGATE-001**：参考 dsh 的 `doc-sync` 文档门禁，为 SDDU 模板体系增加"生成目录 + 新鲜性校验"——Agent 模板变更时自动校验产物与模板一致性。
- **SDDU-BRANDED-001**：引入 Branded IDs（sessionId / featureId / taskId type 级隔离），提升跨包类型安全。

---

## 8. 结论

DeepSeek Harness 是当前与 SDDU 重叠度最高的竞品之一——它同时覆盖了 agent 基础设施（插件树、事件日志、工具流水线）和部分方法论元素（plan mode、skill、todo）。对 SDDU 的核心启示有三：

1. **事件日志是比状态机更优的可追溯方案**（P0 借鉴）：dsh 用 append-only 日志 + 派生投影实现"任意时间点可回放"，SDDU 的状态机 + 文档产物是"阶段快照"——两者不冲突，可为 state.json 补充变更日志获得回放能力。
2. **软引导 vs 硬强制是差异化选择**（保持）：SDDU 的"不跳步"硬强制是方法论框架的核心竞争力，不应向 dsh 的软引导靠拢；但可借鉴 dsh 的"引导 + 强制分离"（plan mode 只管提示，沙箱/批准各自强制）来明确各阶段 Agent 的强制边界。
3. **零特权内核是扩展性的终局**（长期）：dsh 的一切皆插件让每个能力可替换、可撤销；SDDU 的固定 Agent 角色保证了流程纪律但牺牲了部分扩展性——Skill 系统的"提供方抽象"方向是正确的演进路径。

---

## 9. 附录

### 9.1 调研对象信息

- 仓库：https://github.com/deepseek-ai/deepseek-harness
- 网站：https://deepseek.com/harness
- License：MIT
- 创建：2026-08-13；调研时点最近活跃：2026-08-14
- 下载方式：tarball 快照（`https://github.com/deepseek-ai/deepseek-harness/archive/refs/heads/master.tar.gz`，14MB，解压 69MB）

### 9.2 关键源码索引（调研快照 /tmp/opencode/dsh/deepseek-harness-master）

| 主题 | 关键文件 |
|------|---------|
| 架构总览 | `docs/architecture.md`、`docs/cordis-primer.md` |
| 会话事件日志 | `packages/core/session/`、`docs/subsystems/session.md` |
| Agent 接口与 loop | `packages/core/agent/src/types.ts`、`packages/core/agent-loop/` |
| 工具流水线 | `packages/core/tools/src/index.ts`、`packages/core/tools/src/schema.ts` |
| 作用域原语 | `packages/core/scope/` |
| Skill 提供方 | `packages/skill/skill/src/index.ts`、`packages/skill/skill-filesystem/src/index.ts` |
| Subagent seam | `packages/subagent/subagent/src/types.ts`、`packages/subagent/subagent/src/continuation.ts` |
| Plan mode | `packages/plan/plan-mode/README.md` |
| 开发规范 | `AGENTS.md`、`docs/development.md`、`docs/testing.md` |
| 事件生产/消费映射 | `docs/event-producer-consumer.md` |
| 能力 seam 图 | `docs/capability-seams.md` |

### 9.3 参考链接

- GitHub 仓库：https://github.com/deepseek-ai/deepseek-harness
- Cordis 框架：https://github.com/cordiverse/cordis
- Cordis 设计论文（时空可组合性编程范式）：https://github.com/cordiverse/paper
