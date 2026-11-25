# Feature Specification：SDDU Skill 系统（双重定位：用户级 + 框架级）

> **文档定位**: SDDU 需求规范 — 定义功能需求、非功能需求和边界情况，作为 plan 阶段的输入  
> **前置依赖**: discovery.md v3.0（问题清单）  
> **创建人**: SDDU Spec Agent  
> **创建时间**: 2026-07-19  
> **版本**: v2.3.2  
> **更新人**: SDDU Spec Agent  
> **更新时间**: 2026-07-19  
> **更新说明**: v2.3.2 — **删除 FR-019（示例 Skills）**：用户决策——内置框架级 Skill（`sddu-skill-creator` / `sddu-skill-discovery` / `sddu-skill-sync`）已可作为用户参考模板，不需要额外产出示例 Skill 文件（`payment-integration` / `db-migration` / `code-review-checklist`）。FR 总数 28 → 27。  
> 　　　　　v2.3.1 — **统一命名规范**：将框架级 Skill `sddu-sync` 重命名为 `sddu-skill-sync`，对齐 `sddu-skill-*` 命名模式（与 `sddu-skill-creator`、`sddu-skill-discovery` 一致）。全文 `sddu-sync` → `sddu-skill-sync`，共 30 处。  
> 　　　　　v2.3 — **同步机制重构为 `sddu-skill-sync` Skill**：用户最终设计决策——否定 install.sh 主动同步方案，改用框架内置 `sddu-skill-sync` Skill 实现源目录到实际目录的同步逻辑。新增 G-009 和 FR-028，重写 FR-020，更新 §5.7 自举闭环为三元闭环（discovery + creator + sync）。Goal 总数 8 → 9，FR 总数 27 → 28。

## 1. 元数据
> Feature 基本信息

| 字段 | 值 |
|------|-----|
| Feature ID | FR-SKILL-001 |
| 名称 | SDDU Skill 系统（双重定位：用户级 + 框架级） |
| 优先级 | P0 |
| 目标版本 | v3.3.0（可提前至 v3.1.0/v3.2.0） |
| RICE | Reach 10 / Impact 10 / Confidence 70% / Effort 4 / Score 17.5 |

## 2. 上下文
> 回顾问题背景和目标用户

### 2.1 核心问题

SDDU 当前面临三个结构性空白：

1. **项目特有业务流程知识无沉淀**（用户视角）：用户每次在新的 SDDU 会话中执行项目特有任务（如接入支付渠道、数据库迁移）时，必须重新向 Agent 口头描述执行步骤、文件位置、校验规则。知识无法跨会话复用。

2. **SDDU 缺乏轻量能力扩展机制**（框架视角）：当前所有能力扩展都必须通过「新增 Agent」路径，每个新 Agent 需要完整生命周期（.hbs 模板 → OpenCode 注册 → 路由适配 → 交互协议设计 → SDDU 流程文档），导致轻量方法论无法低成本落地。用户原话："为一个小流程写一整个 Agent 太夸张了，像是在用重型卡车送一封信"。

3. **现有知识机制存在空白区间**：FR-KB-001（全局配置）承载声明式「是什么」，FR-KB-002（知识沉淀）自动聚合「过去做了什么」，但「未来怎么做某类事」的流程指引没有承载机制。

### 2.2 架构决策（不可更改）

> **用户架构决策（2026-07-18）**：「未来Agent的清单尽可能保持简单固定，拓展SDDU能力核心重任就放到SKILL这边来」

SDDU 架构采用「固定引擎 + 可扩展能力」的双层模型：
- **固定层（Agent）**：discovery / spec / plan / tasks / build / review / validate / roadmap / tree / docs / fast — 保持简单固定，不再轻易增加
- **扩展层（Skill）**：SDDU 能力扩展的核心路径 — 新能力首选 Skill 而非 Agent

### 2.3 目标用户

| 角色 | 核心诉求 |
|------|---------|
| SDDU 使用者（项目开发者） | 沉淀项目特有业务流程知识，让 Agent 自动发现并按需加载 |
| 项目维护者 | 为新加入者提供可自动发现的执行流程指引 |
| SDDU 框架扩展者 | 降低「新增 SDDU 能力」的成本——从写 Agent 降为写 Skill |
| SDDU 框架使用者（有扩展需求的用户） | 在 Agent 执行前后插入自定义检查/流程，无需创建新 Agent |

### 2.4 路径架构决策：「源目录 + 实际目录」双层架构（最终确认）

> **用户架构决策（2026-07-19）**：「用户级skill，默认放到.sddu/skills/（源目录）,框架级内置skill放到.opencode/plugins/skills/???（源目录），实际目录统一使用当前LLMAgent工具的逻辑放置，如当前安装到opencode里面，那就使用opencode的skill的路径：.opencode/skills/（实际目录），将框架级+用户级的源skill拷贝到实际目录里面使用，sddu的agent主动发现skill的方式是扫描源目录（正好做到与LLMAgent类型无关），用户手动调用/LLMAgent发现skill的方式就按照各自工具自己的逻辑执行，两套流程互不影响」

SDDU Skill 路径采用 **「源目录 + 实际目录」双层架构**：

#### 源目录（SDDU 管辖，用户/框架维护）

| 层级 | 路径 | 维护者 |
|------|------|--------|
| 用户级 Skills | `.sddu/skills/` | 用户手写、编辑、删除 |
| 框架级 Skills | `.opencode/plugins/sddu/skills/`（或以 `sddu-` 前缀命名的插件目录） | SDDU 框架，随插件分发 |

#### 实际目录（LLM Agent 工具管辖，运行时使用）

- 取决于当前使用的 LLM Agent 工具
- OpenCode 场景：`.opencode/skills/`
- 将所有活跃的源 Skill（用户级 + 框架级）**拷贝**到实际目录
- 拷贝时机：通过框架内置 `sddu-skill-sync` Skill 按需触发（用户对话触发，如「同步 SDDU Skills」）
- 框架级 Skill 拷贝到实际目录时使用 `sddu-` 前缀命名

#### 两套发现流程（互不干扰）

| 流程 | 扫描路径 | 用途 |
|------|---------|------|
| **SDDU Agent 发现** | 扫描**源目录**（`.sddu/skills/` + 框架源） | SDDU Agent 自己管理 Skill 清单，与 LLM Agent 类型解耦 |
| **LLM Agent / 用户手动发现** | 按 LLM Agent 工具**原生逻辑**（如 OpenCode 扫描 `.opencode/skills/`） | 用户可手动 `@skill` 调用，LLM Agent 按语义匹配自动触发 |

#### 命名空间规则

- 框架级 Skill 在任何目录中都使用 `sddu-` 前缀
- 用户级 Skill 无前缀限制
- 用户级 Skill 与框架级 Skill 命名冲突时框架级优先（或提示用户改名）
- 拷贝到实际目录时保持前缀规则不变

#### 架构图解

```
┌─ 源目录（SDDU 管辖） ──────────────────────────────────────────┐
│                                                                 │
│  .sddu/skills/                    ← 用户级 Skill 源             │
│  ├── payment-integration/                                       │
│  │   └── SKILL.md                                               │
│  └── db-migration/                                              │
│      └── SKILL.md                                               │
│                                                                 │
│  .opencode/plugins/sddu/skills/   ← 框架级 Skill 源             │
│  ├── sddu-skill-creator/                                        │
│  │   └── SKILL.md                                               │
│  └── sddu-bug-fix-workflow/                                     │
│      └── SKILL.md                                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
        │                                              │
        │  拷贝（sddu-skill-sync Skill 按需触发）                │  SDDU Agent 扫描
        ▼                                              ▼
┌─ 实际目录（LLM Agent 管辖） ────────────────────────────────────┐
│                                                                 │
│  .opencode/skills/                 ← OpenCode 原生 skill 路径   │
│  ├── sddu-skill-creator/           ← 框架级（sddu- 前缀隔离）   │
│  │   └── SKILL.md                                               │
│  ├── sddu-bug-fix-workflow/                                     │
│  │   └── SKILL.md                                               │
│  ├── payment-integration/          ← 用户级                     │
│  │   └── SKILL.md                                               │
│  └── db-migration/                                              │
│      └── SKILL.md                                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

两套发现流程：
  ① SDDU Agent → 扫描源目录（平台无关，SDDU 自有逻辑）
  ② OpenCode / LLM Agent → 扫描实际目录（OpenCode 原生 skill 机制）
  → 两套流程互不影响，同一批 Skill 在不同发现路径下均可使用
```

## 3. 目标与非目标
> 明确需求范围，防止范围蔓延

### 3.1 目标 (Goals)
> 明确本次要达成的业务目标

| # | 目标描述 |
|---|---------|
| G-001 | 为 SDDU 用户提供「项目级业务流程知识沉淀」能力——用户可手写 Skill，Agent 按需自动发现和加载执行 |
| G-002 | 建立 Skill 作为 SDDU 框架能力扩展的核心路径——未来新能力优先走 Skill 而非新增 Agent |
| G-003 | 内置 `skill-creator` Skill —— 用 Skill 创建 Skill，形成自举闭环，降低 Skill 编写门槛 |
| G-004 | 建立 Agent 新增门禁制度 —— 任何提议新增 Agent 的需求必须先证明「Skill 无法满足」 |
| G-005 | 提供 Agent→Skill 降级评估决策框架 —— 为已规划 Agent 的 Feature（FR-BUG-001、FR-RATIONAL-001、FR-WORKTREE-001）做 Skill 化可行性评估 |
| G-006 | 定义用户级 Skills 和框架级 Skills 的「源目录 + 实际目录」双层存放架构、命名空间隔离、拷贝同步机制和生命周期协议 |
| G-007 | 内置 `sddu-skill-discovery` Skill —— 用 Skill 描述 Skill 的发现逻辑，形成发现的子自举闭环（与 skill-creator 并列），作为独立目录存在于框架源目录中 |
| G-008 | 将 `sddu-skill-discovery` 硬编码引用集成到 SDDU 核心 Agent 的 `.hbs` 提示词模板中，使所有 SDDU Agent 无需各自实现即可获得统一的 Skill 发现能力 |
| G-009 | 内置 `sddu-skill-sync` Skill —— 用 Skill 实现源目录到实际目录的同步逻辑，用户按需指定调度，适配不同 LLM Agent 工具的实际目录差异 |

### 3.2 非目标 (Non-Goals)
> 明确本次不涉及的范围，防止需求蔓延

| # | 明确不做 |
|---|---------|
| NG-001 | **不自建 Skill 扫描/匹配/加载引擎** — 完全复用 OpenCode 原生 skill 机制（路径扫描、LLM 语义匹配、`skill()` 工具按需加载）。SDDU 只在**源目录**层面做自有扫描（FR-021），但匹配和加载仍依赖 LLM Agent 工具原生机制 |
| NG-002 | **不新增 Agent** — 本 Feature 反向约束新增 Agent。任何提议新增 Agent 的需求必须过门禁审查 |
| NG-003 | **不改动现有 Agent 的职责边界** — 当前 11 个核心 Agent（discovery/spec/plan/tasks/build/review/validate/roadmap/tree/docs/fast）的职责范围保持不变 |
| NG-004 | **不覆盖 FR-KB-001 和 FR-KB-002 的职责** — Skill 系统与现有知识机制（声明式配置、知识沉淀）互补，不重叠 |
| NG-005 | **不实现 Skill 运行时沙箱/安全隔离** — Skill 是纯 Markdown 指令，执行安全性依赖 OpenCode 原生 `opencode.json` 权限控制 |
| NG-006 | **不提供 Skill 市场/分享/分发平台** — 仅聚焦于 SDDU 项目内和框架内的 Skill 机制 |
| NG-007 | **不提供 Skill 自动生成（AI 自动写 Skill）** — skill-creator 是对话式引导工具，不是自动化生成器 |

## 4. 用户故事
> 以用户视角描述功能需求

| # | 作为… | 我想要… | 以便… |
|---|-------|---------|-------|
| US-001 | SDDU 使用者（项目开发者） | 手写一个项目特有的「接入支付渠道」Skill，存放于项目目录中 | Agent 在遇到支付相关任务时自动发现并加载该 Skill，按预定流程执行，无需我每次口头描述 |
| US-002 | 项目维护者 | 为项目创建「数据库迁移流程」Skill，定义 migration 文件的创建位置、命名规范、回滚策略和测试方法 | 任何接手该项目的 Agent 都能按统一标准执行迁移操作 |
| US-003 | 新加入项目的开发者 | 在首次处理某个项目特有任务时，Agent 自动发现并加载已有 Skill | 无需搜索历史聊天记录或询问同事，快速上手 |
| US-004 | SDDU 框架扩展者 | 创建一个「Bug 修复流程」Skill（而非新建一个 Agent），包含复现→定位→修复→验证→回归的标准步骤 | 新能力上架成本从写 500 行 .hbs 降至写 100 行 Markdown |
| US-005 | SDDU 框架扩展者 | 使用内置的 `skill-creator` Skill，通过对话式引导创建符合规范的 Skills | 即使不熟悉 OpenCode/Anthropic skill 格式规范，也能产出触发准确率高的 SKILL.md |
| US-006 | SDDU 框架架构师 | 当有人提议新增 Agent 时，有明确的「Agent 新增门禁」审查流程 | 防止 Agent 清单膨胀，确保 Skill 优先路径被认真评估 |
| US-007 | SDDU 框架使用者（有扩展需求） | 在 @sddu-build 执行完毕后，Agent 自动加载我定义的「部署后检查清单」Skill | 无需修改 SDDU 源码或创建新 Agent，就能在工作流中插入自定义步骤 |
| US-008 | SDDU 框架维护者 | 框架级 Skills（如 bug-fix-workflow）随 SDDU 插件分发，用户安装后自动就绪 | 框架级 Skill 的一次更新能覆盖所有用户，无需各项目手动复制 |

## 5. 功能需求 (FR)
> 每个需求必须有唯一标识符且可测试

### 5.1 基础设施层：路径与存放（「源目录 + 实际目录」双层架构）

| ID | 需求描述 | 验收标准 | 优先级 |
|----|---------|---------|--------|
| FR-001 | **用户级 Skills 源目录**：用户手写的项目特有 Skills 存放于 `.sddu/skills/`（源目录）。用户在该目录下创建、编辑、删除 Skill。SDDU Agent 扫描该目录发现用户级 Skill。该目录由 git 管理，属于项目仓库的一部分。 | (1) 在项目根目录创建 `.sddu/skills/my-skill/SKILL.md`；(2) SDDU Agent 可通过扫描该路径发现 `my-skill`；(3) 该目录的内容受 git 版本控制，随项目仓库分发。 | P0 |
| FR-002 | **框架级 Skills 源目录**：SDDU 框架内置的 Skills 存放于 `.opencode/plugins/sddu/skills/`（源目录），随 SDDU 插件分发。所有框架级 Skill 使用 `sddu-` 前缀命名（如 `sddu-skill-creator`、`sddu-bug-fix-workflow`）。SDDU Agent 扫描该目录发现框架级 Skill。该目录由插件包管理器维护，用户不应手动修改（修改将在插件更新时丢失）。 | (1) 安装 SDDU 插件后，`.opencode/plugins/sddu/skills/sddu-skill-creator/` 自动创建；(2) SDDU Agent 可扫描该路径发现所有 `sddu-*` 前缀的框架级 Skill；(3) 该目录在 `.gitignore` 中排除，不纳入项目 git 管理。 | P0 |
| FR-003 | **实际目录**：运行时使用的 Skill 路径为 `.opencode/skills/`（OpenCode 场景）。安装/更新时将源目录（`.sddu/skills/` + `.opencode/plugins/sddu/skills/`）中所有活跃 Skill **拷贝**到实际目录。实际目录符合 OpenCode 原生 skill 扫描路径，LLM Agent 通过 OpenCode 原生机制自动发现和加载。 | (1) 拷贝后 `.opencode/skills/` 包含所有用户级和框架级 Skill；(2) OpenCode 原生 `skill()` 工具可列出和加载这些 Skill；(3) 用户手动调用 `@skill-name` 时 OpenCode 可正确匹配。 | P0 |
| FR-020 | **源目录到实际目录的同步机制（通过 `sddu-skill-sync` Skill）**：通过框架内置 `sddu-skill-sync` Skill 实现源目录到实际目录的同步。该 Skill 描述同步逻辑（源目录扫描 → 实际目录路径检测 → 全量拷贝 → 管辖标识标记），用户通过对话触发（如「同步 SDDU Skills」）。同步逻辑封装在 Skill body 中——适配不同 LLM Agent 工具（OpenCode / Codex / Claude Code 等）的实际目录差异时只需更新 Skill body（Markdown），无需修改安装脚本。拷贝规则：(a) 框架级 Skill 保持 `sddu-` 前缀拷贝；(b) 用户级 Skill 保持原名拷贝；(c) 命名冲突时框架级优先。 | (1) 用户对话触发 `sddu-skill-sync` Skill 后，`.opencode/skills/` 中 SDDU 管辖的 Skill 与源目录一致；(2) `sddu-skill-sync` Skill 的 body 包含当前 LLM Agent 工具的实际目录检测和拷贝逻辑描述；(3) 在源目录新增一个 Skill 后，通过 `sddu-skill-sync` 可将新 Skill 同步到实际目录；(4) 源目录删除 Skill 后，通过 `sddu-skill-sync` 可清理实际目录中对应的残留；(5) 用户手动放置在 `.opencode/skills/` 中的非 SDDU 管辖 Skill（无管辖标识）不受同步影响。 | P0 |
| FR-021 | **SDDU Agent 扫描源目录**：SDDU Agent（如 sddu-tree、sddu-docs）在需要发现 Skill 时，扫描源目录（`.sddu/skills/` + `.opencode/plugins/sddu/skills/`），而非实际目录。这确保 SDDU Agent 的 Skill 发现逻辑与 LLM Agent 工具（OpenCode）解耦，实现平台无关。 | (1) `@sddu-tree` 扫描源目录时，能列出所有用户级和框架级 Skill；(2) 切换 LLM Agent 工具（如从 OpenCode 切换到 Codex）后，SDDU Agent 的 Skill 发现行为不变；(3) SDDU Agent 不需要感知实际目录的存在。 | P0 |
| FR-022 | **Skill 目录组织规范（源目录版）**：源目录中每个 Skill 为独立文件夹，内含 `SKILL.md`（必填）和可选的 `scripts/`、`references/`、`assets/` 子目录。目录名遵循 `^[a-z0-9]+(-[a-z0-9]+)*$` 约束。框架级 Skill 目录名以 `sddu-` 开头。拷贝到实际目录时保持目录结构和命名规则不变。 | (1) 创建 `.sddu/skills/payment-integration/SKILL.md`，执行同步后 `.opencode/skills/payment-integration/SKILL.md` 结构一致；(2) `SKILL.md` 引用 `scripts/verify-payment.sh` 的路径为相对 Skill 目录的相对路径，拷贝后路径仍然有效；(3) 不符合命名规范的目录在同步时给出警告提示。 | P0 |
| FR-023 | **命名冲突处理规则**：用户级 Skill 与框架级 Skill 发生命名冲突时，框架级优先。即如果用户创建了 `sddu-skill-creator`（使用了框架保留前缀），同步时框架级版本覆盖用户版本。用户可通过 `sddu skill doctor` 诊断命令提前发现冲突。用户级 Skill 不应使用 `sddu-` 前缀（NFR-005 约束）。 | (1) 源目录中存在 `sddu-skill-creator` 用户级 Skill 时，同步到实际目录后实际生效的是框架级版本；(2) 诊断命令可列出所有冲突；(3) 文档明确说明 `sddu-` 是框架保留前缀。 | P1 |
| FR-024 | **实际目录清理机制**：在源目录中删除 Skill 后，下次同步时自动清理实际目录中对应的残留。不清理用户手动放置在 `.opencode/skills/` 中的非 SDDU 管辖 Skill（即不属于任何源目录的 Skill）。 | (1) 用户从 `.sddu/skills/` 删除 `my-skill/`，执行同步后 `.opencode/skills/my-skill/` 被清理；(2) 用户在 `.opencode/skills/` 手动创建的第三方 Skill 不受影响；(3) 同步日志记录清理操作。 | P1 |

### 5.2 基础能力层：Skill 创建与触发

| ID | 需求描述 | 验收标准 | 优先级 |
|----|---------|---------|--------|
| FR-004 | **Skill 内容格式规范**：`SKILL.md` 使用 YAML frontmatter + Markdown body 格式。Frontmatter 必须包含 `name`（1-64 字符，`^[a-z0-9]+(-[a-z0-9]+)*$`）、`description`（1-1024 字符，清楚描述何时触发、做什么）。可选字段为 `license`、`compatibility`、`metadata`。Body 不超过 500 行，遵循 Progressive Disclosure 原则：Metadata(~100 words) → Body(on trigger) → References(as needed)。 | (1) 编写合法 frontmatter 的 SKILL.md 可被 OpenCode 成功解析；(2) 缺少 `name` 或 `description` 的 SKILL.md 被 OpenCode 忽略，SDDU 提供诊断提示；(3) Body 超过 500 行的 Skill 给出健壮性警告但不阻止加载。 | P0 |
| FR-005 | **Skill 触发机制**：完全复用 OpenCode 原生 skill 机制 — LLM Agent 根据 `description` 语义匹配用户任务，通过 `skill({ name: "xxx" })` 工具按需加载完整 body 内容。SDDU 不自建任何扫描、匹配或加载引擎。 | (1) 用户描述「帮我接入一个新的支付渠道」时，Agent 自动匹配 `payment-integration` Skill（若 description 描述匹配）；(2) Agent 在未匹配到 Skill 时不加载任何额外内容；(3) 触发行为完全由 OpenCode LLM Agent 自主决策，SDDU 不干预匹配逻辑。 | P0 |
| FR-006 | **Skill 权限控制**：复用 OpenCode 原生 `opencode.json` 的 `permission.skill` 配置，支持按 Skill 名称通配符设置 `allow/deny/ask` 三种模式。SDDU 在文档中提供按 Agent 角色推荐的权限配置模板。 | (1) 在 `opencode.json` 中配置 `"sddu-*": "allow"`，所有 `sddu-` 前缀 Skill 无需确认；(2) 配置 `"payment-integration": "ask"`，加载前弹确认；(3) SDDU 文档提供推荐权限模板（如：框架级 Skill = allow，项目级 Skill = ask）。 | P1 |
| FR-007 | **Skill 禁用机制**：支持在 Agent 级别通过 `opencode.json` 的 `tools: { skill: false }` 完全禁用 Skill 加载。SDDU 文档说明哪些 Agent 角色适合禁用 Skill（如纯审查类 Agent）。 | (1) 在特定 Agent 配置中设置 `tools: { skill: false }`，该 Agent 不再加载任何 Skill；(2) 不影响其他 Agent 的 Skill 加载行为。 | P1 |

### 5.3 自举闭环层：skill-creator

| ID | 需求描述 | 验收标准 | 优先级 |
|----|---------|---------|--------|
| FR-008 | **skill-creator Skill 内置**：SDDU 框架内置 `sddu-skill-creator` 框架级 Skill，用户通过对话触发该 Skill 后，按内置引导工作流创建符合规范的 SKILL.md。 | (1) 用户说「帮我创建一个新的 Skill」或类似意图时，Agent 自动加载 `sddu-skill-creator`；(2) skill-creator 按步引导：确定 Skill 用途 → 撰写 description（触发语义优化）→ 编写 body（Progressive Disclosure 指导）→ 输出 SKILL.md 到正确路径；(3) 产出的 SKILL.md frontmatter 字段完整且符合 `^[a-z0-9]+(-[a-z0-9]+)*$` 约束。 | P0 |
| FR-009 | **skill-creator 的 description 优化指导**：skill-creator 内置 description 撰写技巧——如何用 1-2 句话覆盖关键触发场景、避免与已有 Skill description 重叠、使用自然语言而非关键词堆砌。 | (1) 用户在 skill-creator 中提供了 Skill 的用途后，skill-creator 给出 2-3 个候选 description 方案；(2) description 长度 ≤ 1024 字符；(3) description 中不包含与其他 Skill 高度重叠的措辞（skill-creator 会列出可能冲突的已有 Skill description）。 | P0 |
| FR-010 | **skill-creator 的测试验证**：skill-creator 引导用户进行端到端触发测试——用真实任务描述测试 Skill 是否被正确触发，收集触发结果并建议调整 description。 | (1) skill-creator 提供 3-5 个测试场景描述，用户可逐一验证 Skill 是否触发；(2) 若某场景未触发，skill-creator 给出 description 修改建议；(3) 测试完成后产出「触发测试报告」Markdown 文件（可选，由用户决定是否保留）。 | P1 |
| FR-011 | **skill-creator 的自举闭环**：`sddu-skill-creator` 不仅可创建用户级 Skill，也可用于创建框架级 Skill 的初稿。框架级 Skill 初稿完成后需走 SDDU 完整流程（discovery→spec→plan→build→review→validate）确保质量，正式版随插件分发。 | (1) 用户使用 skill-creator 创建用户级 Skill 可直接产出 SKILL.md（质量由用户负责）；(2) SDDU 团队使用 skill-creator 创建框架级 Skill 初稿后，产出物经过 SDDU 完整流程审查——初稿通过验收但不会直接用于发布；(3) 正式发布后，skill-creator 的触发 description 会更新以避免与新框架级 Skill 的 description 冲突。 | P0 |

### 5.4 框架治理层：Agent 门禁与降级评估

| ID | 需求描述 | 验收标准 | 优先级 |
|----|---------|---------|--------|
| FR-012 | **Agent 新增门禁审查标准**：任何提议新增 Agent 的需求，必须先回答三个审查问题并通过后才可启动 Agent 创建流程。审查标准：(1) 是否需要引入新的 SDDU 工作流阶段？(是→Agent)；(2) 是否需要独立的 phase/status 状态管理？(是→Agent)；(3) 是否属于执行方法论/流程知识？(是→Skill)。三个问题中任一满足「Agent 侧」则启动 Agent 创建；全部指向「Skill 侧」则必须走 Skill 路径。 | (1) 提交「新增 Agent」提案时，SDDU 流程强制要求填写「Agent 新增门禁审查表」；(2) 审查表包含三个问题的逐项回答和证据；(3) 若提案未通过门禁（三个问题全部指向 Skill），提案被退回并强制要求提供 Skill 方案。 | P0 |
| FR-013 | **Agent→Skill 降级评估决策框架**：对已规划为 Agent 但尚未实现的 Feature，提供标准化的降级评估矩阵。评估维度：(a) 状态管理需求 — 是否需要跨会话追踪阶段和状态；(b) 产物输出 — 是否产生 SDDU 中间文档（discovery/spec/plan/tasks 等）；(c) Agent 调度 — 是否需要主动调度其他 Agent；(d) 文件操作权限 — 是否需要独立于宿主 Agent 的文件操作权限；(e) 复杂度 — 是否超出「单一职责流程」（> 500 行 body）。每个维度「是 = Agent」「否 = Skill」。 | (1) 对 FR-BUG-001、FR-RATIONAL-001、FR-WORKTREE-001 逐项填充评估矩阵；(2) 每个 Feature 产出明确的「降级建议」：完全 Skill 化 / 部分 Skill 化 / 保持 Agent；(3) 评估矩阵存档为 spec.md 附件或独立 ADR。 | P0 |
| FR-014 | **Agent 清单维护约束**：当前 11 个核心 Agent 的清单写入 SDDU 框架的维护约束文档。任何新增 Agent 必须在 SDDU 核心文档中登记：新增理由（门禁审查结果）、职责边界、与已有 Agent 的关系、生命周期计划。 | (1) SDDU 维护约束文档包含当前全部 Agent 清单及每个 Agent 的「新增原因」追溯；(2) 无登记的新增 Agent 在 code review 阶段被拒绝；(3) 每季度对 Agent 清单做一次「降级回顾」——检查是否有 Agent 可降级为 Skill。 | P1 |

### 5.5 既有规划 Feature 的降级评估

| ID | 需求描述 | 验收标准 | 优先级 |
|----|---------|---------|--------|
| FR-015 | **FR-RATIONAL-001 降级为 `sddu-rational-prompts` 框架级 Skill**：理性化对抗的逻辑由 Skill 承载——包含 Devil's Advocate 视角的 critique prompt，按需注入到 spec/plan/review 等 Agent 的决策环节。 | (1) `sddu-rational-prompts` SKILL.md 作为框架级 Skill 存在于源目录 `.opencode/plugins/sddu/skills/sddu-rational-prompts/`，同步后位于实际目录 `.opencode/skills/sddu-rational-prompts/`；(2) 当用户请求「做理性化对抗」或类似语义时，Agent 加载该 Skill；(3) Skill body 包含对不同阶段（spec/plan/review）的差异化 critique prompt 模板。 | P1 |
| FR-016 | **FR-BUG-001 降级为 `sddu-bug-fix-workflow` 框架级 Skill**：Bug 修复流程由 Skill 承载——包含「复现→定位→修复→验证→回归」的标准步骤指引和轻量状态追踪（日志文件）。 | (1) `sddu-bug-fix-workflow` SKILL.md 作为框架级 Skill 存在于源目录 `.opencode/plugins/sddu/skills/sddu-bug-fix-workflow/`，同步后位于实际目录 `.opencode/skills/sddu-bug-fix-workflow/`；(2) 用户描述「帮我修一个 bug」时 Agent 自动加载该 Skill；(3) Skill 包含每个步骤的检查清单和输出模板（如 Bug 分析报告 Markdown）。 | P1 |
| FR-017 | **FR-WORKTREE-001 部分 Skill 化**：Git Worktree 的「创建→初始化→工作→清理」流程步骤提取为 `sddu-worktree-workflow` Skill，由现有 Agent（如 @sddu-build）在需要时加载。底层的 `git worktree` 命令执行和文件系统隔离保持 Agent 级权限（不降级）。 | (1) `sddu-worktree-workflow` SKILL.md 作为框架级 Skill 存在于源目录，同步后位于实际目录；(2) Skill 包含 Worktree 流程的步骤描述和命令清单；(3) 执行 git worktree 的实际命令由宿主 Agent 的工具权限执行，不在 Skill 内脚本化；(4) Skill 和 Agent 的分工在文档中明确说明。 | P1 |

### 5.6 文档与指南

| ID | 需求描述 | 验收标准 | 优先级 |
|----|---------|---------|--------|
| FR-018 | **SDDU Skill 写作指南文档**：产出「如何编写 SDDU Skill」的指南——包含 Skill 格式规范、「源目录 + 实际目录」双层架构说明、description 撰写技巧（触发准确率优化）、Progressive Disclosure 指导、目录组织规范、示例 Skills 和常见问题。 | (1) 指南存在于 SDDU 插件文档中（或 README）；(2) 指南包含至少 1 个完整示例 Skill（用户级：如接入支付渠道）；(3) 指南包含 description 优化的 Do/Don't 对照表；(4) 指南说明 OpenCode 和 Anthropic skill 规范的兼容性；(5) 指南说明源目录和实际目录的关系、拷贝时机和两套发现流程。 | P0 |

### 5.7 自举闭环层：skill-discovery

| ID | 需求描述 | 验收标准 | 优先级 |
|----|---------|---------|--------|
| FR-025 | **skill-discovery Skill 内置**：SDDU 框架内置 `sddu-skill-discovery` 框架级 Skill，描述 SDDU Agent 如何扫描源目录、识别 Skill（判断目录是否包含有效 SKILL.md）、加载 SKILL.md 内容、理解命名空间规则（`sddu-` 前缀属于框架级、无前缀属于用户级）、区分框架源目录（`.opencode/plugins/sddu/skills/`）和用户源目录（`.sddu/skills/`）。该 Skill 覆盖 SDDU Agent 的「流程①」发现逻辑（源目录扫描），与 LLM Agent 的「流程②」原生发现（实际目录扫描）互不影响。 | (1) `sddu-skill-discovery` SKILL.md 存在于框架源目录 `.opencode/plugins/sddu/skills/sddu-skill-discovery/`；(2) Skill body 包含完整的源目录扫描流程描述（路径、识别规则、命名空间分类、SKILL.md 加载方式）；(3) 可通过 `skill("sddu-skill-discovery")` 加载；(4) 其 description 明确标注为「仅覆盖 SDDU 源目录扫描（流程①），不涉及 LLM Agent 原生发现机制」。 | P0 |
| FR-026 | **Agent 模板硬编码引用**：SDDU 核心 Agent 的 `.hbs` 提示词模板中硬编码对 `sddu-skill-discovery` 的引用/指令，使 Agent 在需要发现或使用 SDDU Skill 时知道通过该 Skill 获取发现指引。目标 Agent 包括：coordinator 及所有核心阶段 Agent（discovery、spec、plan、tasks、build、review、validate、roadmap、tree、docs、fast）。 | (1) coordinator 的 `.hbs` 模板中包含对 `sddu-skill-discovery` 的引用；(2) 核心阶段 Agent 的 `.hbs` 模板中包含对 `sddu-skill-discovery` 的引用或继承 coordinator 的 Skill 发现配置；(3) Agent 在需要发现 SDDU Skill 时能正确加载 `sddu-skill-discovery` 并按其指引扫描源目录。 | P0 |
| FR-027 | **框架级 Skill 清单更新**：SDDU 内置框架级 Skill 清单增加 `sddu-skill-discovery`，与已有的 `sddu-skill-creator` 并列。两者共同构成 Skill 生态的完整自举闭环——`skill-discovery` 告诉 Agent 如何发现有哪些 Skill 可用，`skill-creator` 告诉 Agent 如何创建新 Skill。通过 `sddu-skill-sync` Skill 同步时两者同时部署到实际目录。 | (1) 框架级 Skill 清单（如源码目录或插件 manifest）中包含 `sddu-skill-discovery` 和 `sddu-skill-creator`；(2) 通过 `sddu-skill-sync` Skill 同步后，两个 Skill 同时位于实际目录 `.opencode/skills/sddu-skill-discovery/` 和 `.opencode/skills/sddu-skill-creator/`；(3) 框架级 Skill 命名空间规范文档中列出完整内置 Skill 清单。 | P0 |
| FR-028 | **`sddu-skill-sync` Skill 内置**：SDDU 框架内置 `sddu-skill-sync` 框架级 Skill，描述源目录到实际目录的完整同步逻辑：(a) 扫描源目录（`.sddu/skills/` + 框架源）；(b) 检测当前 LLM Agent 工具的实际目录路径；(c) 全量拷贝 + 管辖标识标记（区分 SDDU 管辖 Skill 和第三方 Skill）；(d) 清理源目录中已删除的 Skill 在实际目录的残留；(e) 输出同步报告。 | (1) `sddu-skill-sync` SKILL.md 存在于框架源目录 `.opencode/plugins/sddu/skills/sddu-skill-sync/`（源目录对应 `src/skills/sddu-skill-sync/`）；(2) Skill body 包含完整的同步流程描述；(3) 可通过 `skill("sddu-skill-sync")` 加载；(4) 用户说「同步 SDDU Skills」时 Agent 加载该 Skill。 | P0 |

#### 自举闭环全景

将 `sddu-skill-discovery`、`sddu-skill-creator` 与 `sddu-skill-sync` 三者并列，共同构成 Skill 生态的完整自举闭环：

```
┌──────────────────────────────────────────────────────────────┐
│                    SDDU Skill 自举闭环                         │
│                                                              │
│  skill-discovery  ──→ 告诉 Agent 如何发现 Skill                │
│  skill-creator    ──→ 告诉 Agent 如何创建 Skill                │
│  sddu-skill-sync        ──→ 告诉 Agent 如何同步 Skill                │
│                                                              │
│  三者共同实现：                                                │
│  「用 Skill 发现 Skill + 用 Skill 创建 Skill + 用 Skill 同步 Skill」│
│                                                              │
│  三元自举闭环：发现 + 创建 + 同步 = Skill 生态完整闭环           │
└──────────────────────────────────────────────────────────────┘
```

> **与「两套发现流程」的关系**：`sddu-skill-discovery` 只覆盖「流程①」—— SDDU Agent 扫描源目录的发现逻辑。LLM Agent 的「流程②」原生发现（扫描实际目录 `.opencode/skills/`）不受影响。`skill-discovery` 与 LLM Agent 发现流程解耦，实现平台无关的 SDDU 自有 Skill 发现。

#### 对 Agent 模板的影响

SDDU 核心 Agent 的 `.hbs` 模板中，预计新增类似以下内容的硬编码引用（具体措辞由 plan 阶段设计）：

```
## Skill 发现
当需要发现或使用 SDDU Skill 时，参考 skill-discovery 这个 Skill 的指引。
SDDU Skills 的源目录位于 .sddu/skills/（用户级）和 
.opencode/plugins/sddu/skills/（框架级）。
```

所有 SDDU Agent（coordinator + discovery / spec / plan / tasks / build / review / validate / roadmap / tree / docs / fast）通过模板中的硬编码引用来获取统一的 Skill 发现能力，不需要每个 Agent 各自实现扫描逻辑。

## 6. 非功能需求 (NFR)
> 性能、安全、可用性等跨切面需求

| ID | 类别 | 需求描述 | 验收标准 |
|----|------|---------|---------|
| NFR-001 | 可用性 | **Skill 创建门槛低**：用户无需理解 OpenCode/Anthropic skill 机制的底层细节即可创建有效 Skill。skill-creator 提供对话式引导，用户只需回答「这个 Skill 做什么」「什么时候应该触发」两个核心问题。 | 一个新用户通过 skill-creator 对话式引导，在 10 分钟内产出可被正确触发的 SKILL.md（触发准确率 ≥ 80%，按 FR-010 的测试场景统计）。 |
| NFR-002 | 可用性 | **Skill 触发语义清晰**：每个 Skill 的 `description` 措辞应避免与其他 Skill 高度重叠，降低 LLM 语义匹配的歧义。框架级 Skill description 在发布前需经过交叉冲突检查。 | 对任意两个框架级 Skill，其 description 的语义重叠度（由 LLM 判断）不超过 50%。存在重叠时，优先调整后创建的 Skill 的 description。 |
| NFR-003 | 性能 | **Skill 加载不影响 Agent 启动性能**：Agent 启动时不预加载任何 Skill body。仅在 LLM Agent 判定语义匹配后，通过 `skill()` 工具按需加载。加载单个 Skill body 的延迟不超过 1 秒。 | (1) Agent 启动到就绪时间与引入 Skill 系统前无显著差异（≤5% 增加）；(2) `skill()` 加载 500 行 body 的延迟 ≤ 1 秒。 |
| NFR-004 | 安全性 | **Skill 执行权限受控**：所有 Skill 的执行权限由 OpenCode 原生 `opencode.json` 的 `permission.skill` 控制。SDDU 框架不提供任何绕过 OpenCode 权限控制的机制。 | (1) 配置为 `"deny"` 的 Skill 无法被加载；(2) 配置为 `"ask"` 的 Skill 加载前弹出用户确认；(3) 用户级 Skill 未经用户显式允许不会被自动执行危险操作。 |
| NFR-005 | 可维护性 | **框架级 Skill 的前缀命名空间隔离**：所有框架级 Skill 的 `name` 字段以 `sddu-` 为前缀，确保与用户级 Skill 无命名冲突。用户级 Skill 禁止使用 `sddu-` 前缀。 | (1) `skill-creator` 在创建用户级 Skill 时检查 name 是否以 `sddu-` 开头，若是则警告并建议修改；(2) SDDU 框架维护者保证所有框架级 Skill 使用 `sddu-` 前缀。 |
| NFR-006 | 可维护性 | **Skill 内容不超过负载上限**：每个 Skill 的 body 推荐不超过 500 行 Markdown，超过时给出健壮性警告。大型 Skill 建议拆分为多个协作 Skill。 | (1) skill-creator 在产出超过 500 行 body 时给出拆分建议；(2) 超过 500 行的 Skill 不阻止加载，但 SDDU 文档中明确建议拆分。 |
| NFR-007 | 兼容性 | **格式对齐 Anthropic/OpenCode 标准**：SKILL.md 格式完全兼容 Anthropic Skills 规范（YAML frontmatter + Markdown body）和 OpenCode skill 机制。不扩展自定义 frontmatter 字段，但保留对 OpenCode 未来扩展字段（如 `compatibility`、`metadata`）的支持。 | (1) 按 SDDU Skill 写作指南产出的 SKILL.md 可在标准 OpenCode 环境中被正确解析和加载；(2) SDDU 不引入任何非标准 frontmatter 字段。 |
| NFR-008 | 可测试性 | **Skill 触发可验证**：每个 Skill 创建后，用户可通过标准化测试场景验证触发准确率。框架级 Skill 必须通过至少 5 个测试场景，触发准确率 ≥ 80% 才可发布。 | (1) 用户级 Skill 的触发测试为可选流程（skill-creator 引导）；(2) 框架级 Skill 的触发测试为强制流程——未通过测试的框架级 Skill 不合并入主分支。 |

## 7. 边界情况 (EC)
> 异常场景和边界条件的处理方式

| ID | 场景 | 处理方式 |
|----|------|---------|
| EC-001 | 多个 Skill 的 description 同时匹配用户请求，Agent 加载了错误的 Skill | 依赖 OpenCode LLM Agent 的语义匹配能力做选择。SDDU 在 Skill 写作指南中建议：description 包含具体的触发场景关键词（如「支付渠道接入」而非「集成外部服务」）以降低歧义。若用户发现频繁误触发，可通过 skill-creator 的优化指导调整 description。 |
| EC-002 | 用户修改了框架级 Skill 的实际目录副本（`.opencode/skills/sddu-*`），同步时被源目录版本覆盖 | (1) 框架级 Skill 的实际目录副本标注为「由 SDDU 插件管理，修改将在同步时丢失」；(2) 若用户确实需要定制框架级 Skill，建议在源目录 `.sddu/skills/` 中创建一个包装 Skill（用户级），通过 Skill body 引用框架级 Skill 并追加自定义步骤；(3) 框架级 Skill 同步策略为全量覆盖（源目录 → 实际目录）。 |
| EC-003 | Agent 禁用了 `skill` 工具，但用户期望 Skill 生效 | 在 SDDU 文档中说明：每个 Agent 的 Skill 能力由 `opencode.json` 的 `tools.skill` 控制。若用户发现某 Agent 不加载 Skill，应先检查该 Agent 的工具配置。SDDU 推荐的默认配置为所有 Agent 启用 `skill` 工具。 |
| EC-004 | Skill 的 body 引用了不存在的 `scripts/` 或 `references/` 文件 | Agent 加载 Skill 时发现引用路径无效：(1) Agent 告知用户引用文件缺失，尝试跳过该引用继续执行；(2) 若引用是关键步骤，Agent 暂停并请求用户修复路径或提供替代方案；(3) skill-creator 在产出 Skill 时自动检查 `scripts/` 和 `references/` 引用完整性。 |
| EC-005 | 框架级 Skill 和用户级 Skill 的 description 高度重叠 | (1) 框架级 Skill description 发布前做交叉冲突检查（NFR-002）；(2) 运行时若 OpenCode Agent 同时匹配到框架级和用户级 Skill，由 Agent 自主决策（可能有歧义）；(3) 用户在 skill-creator 中创建 Skill 时，skill-creator 会列出可能冲突的已有 Skill description 供参考。 |
| EC-006 | Skill 数量增长后触发竞争加剧（50+ Skills 的 description 语义空间拥挤） | (1) 框架侧：SDDU 定期审查框架级 Skill 的 description，合并冗余 Skill；(2) 用户侧：Skill 写作指南建议 description 使用精确的「何时触发」措辞而非通用描述；(3) 若 OpenCode 未来支持 Skill 触发优先级/权重配置，SDDU 跟进适配。 |
| EC-007 | 用户删除或重命名了源目录中的 Skill，但已有 Agent 会话缓存了旧 Skill | SDDU Agent 每次扫描源目录时重新发现 Skill——删除/重命名 Skill 后 SDDU Agent 的 Skill 清单自动更新。LLM Agent（OpenCode）每次会话启动时重新扫描实际目录。SDDU 文档说明此行为。若 Agent 在会话中间需要重新扫描，由 LLM Agent 工具原生机制处理。 |
| EC-008 | 源目录 `.sddu/skills/` 存在不完整的 Skill（有目录但无 SKILL.md，或 SKILL.md 格式错误） | (1) 同步到实际目录时，不完整的 Skill 目录跳过不拷贝（不污染实际目录）；(2) SDDU 提供诊断命令/工具（`sddu skill doctor`），扫描源目录下所有 Skill 并报告：有效 Skill 数、格式错误 Skill 数、缺失 SKILL.md 的目录数；(3) skill-creator 在启动时可选做一次环境诊断。 |
| EC-009 | 框架级 Skill 随 SDDU 插件升级，但用户源目录中有同名用户级 Skill（如用户手动在 `.sddu/skills/` 创建了 `sddu-skill-creator`） | (1) 同步时框架级版本优先（FR-023 冲突规则），用户版本被覆盖；(2) `sddu skill doctor` 诊断命令提前检测并警告冲突；(3) 正常情况下不会发生——用户级 Skill 不使用 `sddu-` 前缀（NFR-005），skill-creator 在创建时也会拦截。 |
| EC-010 | 用户在 Skill body 中使用了 `skill()` 工具调用另一个 Skill（Skill 间嵌套调用） | (1) OpenCode 是否支持 Skill body 中的 `skill()` 嵌套调用待验证（对应开放问题 OP-007）；(2) 若支持：SDDU 文档说明 Skill 间引用的推荐模式——框架级 Skill 可引用用户级 Skill（如 `sddu-bug-fix-workflow` 引用用户自定义的测试流程 Skill）；(3) 若不支持：SDDU 文档说明替代方案——在 Skill body 中使用自然语言提示「此时应加载 XX Skill」。 |

## 8. 开放问题
> 待决策事项和需要进一步调研的内容

### 8.1 路径决策（已确认）

| # | 问题 | 决策 | 理由 | 状态 |
|---|------|------|------|:--:|
| OP-001 | 用户级 Skills 物理存放路径？ | **`.sddu/skills/`（源目录）** | (1) 用户可直接在项目目录下手写、编辑、删除 Skill；(2) 受 git 版本控制，随项目仓库分发；(3) SDDU Agent 扫描该路径发现用户级 Skill，与 LLM Agent 工具解耦；(4) 通过拷贝机制同步到实际目录（`.opencode/skills/`），不影响 LLM Agent 工具原生发现。 | ✅ 已确认 |
| OP-002 | 框架级 Skills 存放位置？ | **源目录**: `.opencode/plugins/sddu/skills/` → **实际目录**: `.opencode/skills/sddu-*` | (1) 源目录随 SDDU 插件分发，由插件包管理器维护；(2) 安装/更新时拷贝到实际目录，LLM Agent 通过 OpenCode 原生机制发现；(3) 通过 `sddu-` 前缀命名空间隔离；(4) SDDU Agent 独立扫描源目录。 | ✅ 已确认 |

### 8.2 待 plan 阶段决策

| # | 问题 | 状态 |
|---|------|:--:|
| OP-003 | 哪些已规划 Agent 可或部分降级为 Skill？| 🟡 **Spec 已给出初始建议**（FR-015/FR-016/FR-017），最终评估矩阵在 plan 阶段输出 ADR |
| OP-004 | Skill 生命周期管理协议：用户级 Skills 走什么流程？框架级 Skills 的改进走什么流程？ | 🟡 待 plan 阶段定义 |
| OP-005 | skill-creator 定位：纯指引 vs 交互式创建工具？ | 🟡 **Spec 偏向交互式**（FR-008/FR-009/FR-010 的设计反映此定位）。最终复杂度在 plan 阶段决定 |
| OP-006 | Skill 触发准确率验证路径？ | 🟡 待 plan 阶段验证——需要确认 OpenCode 环境下的等价测试方法（是否支持类似 Anthropic `claude -p` 的 Skill 触发测试 CLI） |
| OP-007 | Skill 间引用和组合机制？OpenCode 是否支持 Skill body 中的 `skill()` 嵌套调用？ | 🟡 待 plan 阶段实验验证（需在 OpenCode 环境中做端到端测试） |
| OP-008 | Skill 版本与插件版本对齐策略？框架级 Skills 更新是否自动覆盖？用户自定义修改如何保留？ | 🟡 待 plan 阶段设计（注：当前决策为全量覆盖策略，FC-001/FR-024 已定义） |

### 8.3 新识别的开放问题

| # | 问题 | 状态 |
|---|------|:--:|
| OP-009 | **框架级 Skills 安装时机**：SDDU 插件安装时自动写入 `.opencode/skills/sddu-*`？还是类似 `arkcli +connect` 由用户主动触发安装？ | 待决策 |
| OP-010 | **Skill 诊断工具形态**：EC-008 中提到的 Skill 环境诊断应该是独立命令（如 `sddu skill doctor`）、内置在 skill-creator 中、还是作为 plan/tasks 阶段的一个 Feature？ | 待决策 |
| OP-011 | **同步机制细节**：`sddu-skill-sync` Skill 的 body 中同步流程的具体描述粒度？管辖标识用什么方式标记（如实际目录中放置 `.sddu-managed` 标记文件）？同步性能（Skills 数量增长时的拷贝开销）？ | 🟡 待 plan 阶段设计 — FR-020/FR-028 定义了行为需求和 Skill body 描述范围，具体 Skill body 措辞和实现策略由 plan 决定 |
| OP-012 | **框架源路径确认**：`.opencode/plugins/sddu/skills/` 是否为 OpenCode 插件目录的最佳路径？需在 plan 阶段确认 OpenCode 插件目录结构规范（是否存在 `.opencode/plugins/<name>/` 的标准路径约定）。如 OpenCode 不支持插件级目录规范，备选方案为 SDDU 自有路径（如 `.sddu/skills/framework/`）。 | 🟡 待 plan 阶段调研 — 需确认 OpenCode 插件目录约定后最终确定框架级 Skill 源目录 |
| OP-013 | **跨 LLM Agent 工具的实际目录适配**：当前实际目录为 `.opencode/skills/`，但若用户切换到其他 LLM Agent 工具（如 Codex、Claude Code），实际目录的路径和拷贝策略如何适配？SDDU 安装脚本是否需要检测当前 LLM Agent 环境自动选择实际目录？ | 🟡 待 plan 阶段设计 — 可在安装脚本中通过环境检测自动适配，也可提供用户手动配置选项 |
| OP-014 | **skill-discovery 的感知范围**：`sddu-skill-discovery` 是否需要感知 LLM Agent 实际目录（`.opencode/skills/`）的状态？还是只关注源目录（`.sddu/skills/` + `.opencode/plugins/sddu/skills/`）？ | 🟡 建议：只关注源目录，与 LLM Agent 发现流程（流程②）解耦，保持与 FR-021 一致 |
| OP-015 | **Agent 模板中硬编码引用的措辞**：SDDU Agent `.hbs` 模板中对 `sddu-skill-discovery` 的引用——是直接用 `skill()` 工具调用，还是用自然语言指令「请参考 `sddu-skill-discovery` Skill」？两种方式对 Agent 行为的触发效果可能不同。 | 🟡 待 plan 阶段确定措辞后标准化 — 建议在 coordinator 模板中做统一措辞并写入 SDDU Skill 写作指南 |

## 修订记录
> 记录本文档的版本变更历史

| 版本 | 变更说明 | 日期 | 修订人 |
|------|---------|------|--------|
| v2.3.2 | **删除 FR-019（示例 Skills 产出）**：用户决策——内置框架级 Skill（`sddu-skill-creator` / `sddu-skill-discovery` / `sddu-skill-sync`）已可作为用户参考模板，不需要额外产出示例 Skill 文件。级联清理：删除 FR-019 需求行；保留架构图中 `payment-integration`/`db-migration` 示例（路径架构示意，不依赖 FR-019）和 US-001/US-002 故事叙述（独立于 FR-019）；FR-018 中「示例 Skills」措辞保留（写作指南内容描述，非独立交付物）。FR 总数 28 → 27。 | 2026-07-19 | SDDU Spec Agent |
| v2.3.1 | **统一命名规范**：框架级 Skill `sddu-sync` → `sddu-skill-sync`，对齐 `sddu-skill-*` 命名模式（与 `sddu-skill-creator`、`sddu-skill-discovery` 一致）。全文替换共 30 处（目录名、Skill name、描述文本、图表标签、路径、`skill()` 调用等），不涉及功能变更。 | 2026-07-19 | SDDU Spec Agent |
| v2.3 | **同步机制重构为 `sddu-skill-sync` Skill（用户最终设计决策）**：(1) 新增 G-009 — 内置 `sddu-skill-sync` Skill 实现按需同步；(2) 重写 FR-020 — 从 install.sh 主动同步改为 `sddu-skill-sync` Skill 按需同步，验收标准同步更新；(3) 新增 FR-028 — `sddu-skill-sync` Skill 内置需求（同步逻辑描述、实际目录检测、管辖标识、残留清理、同步报告）；(4) §5.7 自举闭环全景升级为三元闭环 — skill-discovery + skill-creator + sddu-skill-sync；(5) 更新 FR-027 验收标准 — 从 `sddu install/update` 改为通过 `sddu-skill-sync` 同步；(6) 更新 OP-011 — 从「拷贝机制细节」改为「同步机制细节」指向 sddu-skill-sync；(7) 更新 §2.4 拷贝时机和架构图标注。保持不破坏：源目录 + 实际目录双层架构、两套发现流程、Agent 固定 + Skill 扩展、NG-001（不自建引擎——sddu-skill-sync 是 Skill body 描述逻辑，不涉及自建引擎）。Goal 总数 8 → 9，FR 总数 27 → 28。 | 2026-07-19 | SDDU Spec Agent |
| v2.2 | **拆分 G-007 为原子目标**：(1) G-007 精简为仅描述 `sddu-skill-discovery` Skill 作为独立目录存在于框架源目录中（对标 G-003 写法）；(2) 新增 G-008 — 将 `sddu-skill-discovery` 硬编码引用集成到 SDDU 核心 Agent `.hbs` 模板中；(3) Goal 总数 7 → 8。FR/NFR/EC/OP 数量和内容不变（27 FR / 8 NFR / 10 EC / 15 OP）。 | 2026-07-19 | SDDU Spec Agent |
| v2.1 | **新增 skill-discovery 自举发现机制**：(1) 新增 G-007 — 建立 Skill 的自举发现机制；(2) 新增 FR-025（`sddu-skill-discovery` Skill 内置）、FR-026（Agent 模板硬编码引用）、FR-027（框架级 Skill 清单更新）组成 §5.7 自举闭环层：skill-discovery；(3) 新增自举闭环全景图——skill-discovery + skill-creator 共同构成「用 Skill 发现 Skill + 用 Skill 创建 Skill」的完整闭环；(4) 新增 OP-014（skill-discovery 感知范围）、OP-015（模板硬编码引用措辞）；(5) 命名确认：框架级 Skill 名称 `sddu-skill-discovery` 遵循 `sddu-` 前缀规范。保持不破坏：Agent 固定 + Skill 扩展架构、源目录 + 实际目录双层架构、两套发现流程互不影响、Agent 新增门禁、skill-creator 自举闭环、所有已有 FR/NFR/EC 不变。总计 27 FR / 8 NFR / 10 EC / 15 OP。 | 2026-07-19 | SDDU Spec Agent |
| v2.0 | **路径架构最终决策落地** — 引入「源目录 + 实际目录」双层架构：(1) 用户级 Skill 源目录 `.sddu/skills/`、框架级 Skill 源目录 `.opencode/plugins/sddu/skills/`、实际目录 `.opencode/skills/`；(2) 新增 FR-020~FR-024 覆盖拷贝/同步机制、SDDU Agent 源目录扫描、命名冲突处理、实际目录清理；(3) 重写 FR-001~FR-003 适配双层架构；(4) 关闭 OP-001（✅ 用户级路径确认）、OP-002（✅ 框架级路径确认）；(5) 新增 OP-011（拷贝机制细节）、OP-012（框架源路径调研）、OP-013（跨 LLM Agent 适配）；(6) 更新 EC-002/EC-007/EC-008/EC-009 适配新路径模型；(7) 更新 FR-015/FR-016/FR-017/FR-018 引用路径；(8) NG-001 补充源目录扫描说明；(9) 补充 §2.4 双层架构图解和两套发现流程说明。总计 24 FR / 8 NFR / 10 EC / 13 OP。 | 2026-07-19 | SDDU Spec Agent |
| v1.0 | 初始创建 — 基于 discovery.md v3.0 产出完整 Feature Specification，覆盖 19 个 FR、8 个 NFR、10 个 EC、10 个开放问题。核心内容：路径决策推荐（OP-001/OP-002）、双重定位需求分解、skill-creator 自举闭环、Agent 门禁与降级评估框架、既有规划 Feature（FR-RATIONAL-001/FR-BUG-001/FR-WORKTREE-001）的 Skill 化需求定义。 | 2026-07-19 | SDDU Spec Agent |
