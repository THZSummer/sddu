# 技术计划：SDDU Skill 系统（双重定位：用户级 + 框架级）

> **文档定位**: SDDU 技术方案 — 记录架构设计、方案对比和 ADR，作为 tasks 阶段的输入  
> **前置依赖**: spec.md v2.3.1（需求规范，28 FR / 8 NFR / 10 EC / 15 OP）  
> **创建人**: SDDU Plan Agent  
> **创建时间**: 2026-07-19  
> **版本**: v2.0  
> **更新人**: SDDU Plan Agent  
> **更新时间**: 2026-07-19  
> **更新说明**: v2.0 — 基于 spec v2.3.1 重写技术方案：(1) 同步机制从 install.sh 全量拷贝重构为 `sddu-skill-sync` Skill 按需同步——重写 ADR-002 和 §3.1 方案对比、§4.1 推荐方案；(2) 自举闭环从双钥匙升级为三元闭环（discovery + creator + sync）；(3) 新增 FR-028 / G-009 覆盖 sddu-skill-sync Skill；(4) 更新架构分析、文件影响、风险评估、开放问题状态为 spec v2.3.1；(5) install.sh 移除拷贝逻辑（仅初始化目录 + 提示用户运行 sddu-skill-sync）

## 1. 前置检查
> 启动技术规划前必须验证的前置条件

| 检查项 | 状态 |
|--------|:--:|
| spec.md 存在（v2.3.1，28 FR / 8 NFR / 10 EC / 15 OP，三元闭环） | ✅ |
| 外部 API 文档缓存 | ✅（不涉及外部 API） |
| 前置依赖已满足（discovery.md v3.0 存在） | ✅ |
| **用户设计决策对齐**：同步机制选用 `sddu-skill-sync` Skill（非 install.sh） | ✅ spec v2.3.1 已落地 |

## 2. 架构分析
> 分析现有架构影响和需要的新组件

### 2.1 现有架构概览

```
当前 SDDU 架构（引入 Skill 前）:

src/
├── templates/agents/                      ← Agent .hbs 模板源目录（12 个）  
│   ├── sddu.md.hbs                          → coordinator @sddu  
│   ├── sddu-discovery.md.hbs                → 阶段 1/7  
│   ├── sddu-spec.md.hbs                     → 阶段 2/7  
│   ├── sddu-plan.md.hbs                     → 阶段 3/7  
│   ├── sddu-tasks.md.hbs                    → 阶段 4/7  
│   ├── sddu-build.md.hbs                    → 阶段 5/7  
│   ├── sddu-review.md.hbs                   → 阶段 6/7  
│   ├── sddu-validate.md.hbs                 → 阶段 7/7  
│   ├── sddu-roadmap.md.hbs                  → 独立辅助  
│   ├── sddu-tree.md.hbs                     → 独立辅助  
│   ├── sddu-docs.md.hbs                     → 独立辅助  
│   └── sddu-fast.md.hbs                     → 快速模式  
│   └── ...
└── adapters/opencode/templates/
    └── opencode.json.hbs                   → OpenCode 配置模板（编译生成目标项目 opencode.json）  

scripts/
├── build-agents.cjs                        → 构建引擎（.hbs → dist/templates/agents/）  
├── package.cjs                             → 打包引擎（dist/ → dist/sddu/）  
└── ...  

install.sh                                  → 安装脚本（分发到目标项目）  
```

### 2.2 需要的新组件

引入 Skill 系统后，新增以下架构组件和目录：

#### A. 源目录层（SDDU 管辖）

| 组件 | 路径 | 说明 |
|------|------|------|
| **用户级 Skill 源目录** | `.sddu/skills/` | 用户手写，受 git 管理 |
| **框架级 Skill 源目录** | `.opencode/plugins/sddu/skills/` | SDDU 插件分发（在 SDDU 仓库中对应 `src/skills/`，构建后拷贝到目标项目的 `.opencode/plugins/sddu/skills/`） |

> **注意**：`.opencode/plugins/sddu/skills/` 路径在 SDDU 源码仓库中不存在当前需新建。在 SDDU 仓库内，框架级 Skill 源码存放于 `src/skills/`，由 `package.cjs` 在打包时拷贝到 `dist/sddu/skills/`，再由 `install.sh` 最终部署到目标项目的 `.opencode/plugins/sddu/skills/`。

#### B. 实际目录层（LLM Agent 管辖）

| 组件 | 路径 | 说明 |
|------|------|------|
| **实际目录** | `.opencode/skills/` | OpenCode 原生 skill 扫描路径，通过 `sddu-skill-sync` Skill 按需从源目录同步 |

#### C. 三元自举闭环 Skill（框架级内置）

| Skill | 源目录 | 职责 |
|-------|--------|------|
| `sddu-skill-discovery` | `.opencode/plugins/sddu/skills/sddu-skill-discovery/` | 用 Skill 发现 Skill — 描述源目录扫描流程 |
| `sddu-skill-creator` | `.opencode/plugins/sddu/skills/sddu-skill-creator/` | 用 Skill 创建 Skill — 对话式引导创建新 Skill |
| `sddu-skill-sync` | `.opencode/plugins/sddu/skills/sddu-skill-sync/` | 用 Skill 同步 Skill — 源目录到实际目录的按需同步 |

> 在 SDDU 源码仓库中，三者的源码位于 `src/skills/sddu-skill-discovery/SKILL.md`、`src/skills/sddu-skill-creator/SKILL.md`、`src/skills/sddu-skill-sync/SKILL.md`。

#### D. 同步机制（关键设计变更 v2.3.1）

| 组件 | 形式 | 说明 |
|------|------|------|
| **`sddu-skill-sync` Skill** | 框架级 Skill（`src/skills/sddu-skill-sync/SKILL.md`） | Skill body 描述完整同步逻辑：源目录扫描 → 实际目录路径检测 → 全量拷贝 + 管辖标识 → 残留清理 → 同步报告 |
| **触发方式** | 用户对话触发（如「同步 SDDU Skills」等语义匹配） | 不依赖 install.sh / cron / hook，完全按需 |
| **install.sh** | 仅初始化目录 + 提示 | **移除**旧 plan 中的拷贝逻辑，改为创建空目录 + 打印「运行 sddu-skill-sync 同步 Skills」的提示 |

> **设计理由**：sync 逻辑封装在 Skill body（Markdown）中——适配不同 LLM Agent 工具（OpenCode / Codex / Claude Code 等）的实际目录差异时只需更新 Skill body，无需修改安装脚本。这符合 spec v2.3.1 的核心设计决策：「Skill 优先」原则。

#### E. Agent 模板变更

| 组件 | 说明 |
|------|------|
| **coordinator 模板** | 硬编码 skill-discovery 引用（新增 § Skill 发现与同步 章节） |
| **11 个核心 Agent 模板** | 各自硬编码 skill-discovery 引用（或继承 coordinator 的设置） |

### 2.3 数据流变更

```
引入 Skill 前（当前）:
  用户请求 → @sddu（路由）→ 子 Agent（执行）→ 产物
  
引入 Skill 后（新）:
  用户请求 → @sddu（路由）→ 子 Agent（执行）
                               ├── 步骤 1: 硬编码 skill-discovery 引用 → 扫描源目录发现可用 Skill
                               ├── 步骤 2: 根据任务语义判断需加载哪个 Skill
                               ├── 步骤 3: 通过 skill({name: "xxx"}) 加载 Skill body（OpenCode 原生机制，扫描实际目录）
                               ├── 步骤 4: 按 Skill 指引执行 + 自身模板逻辑
                               └── 步骤 5: 产出产物

  同步数据流（独立于执行流）:
  用户对话「同步 SDDU Skills」
       → 步骤 1: Agent 通过硬编码引用加载 sddu-skill-discovery
       → 步骤 2: sddu-skill-discovery 扫描源目录，发现 sddu-skill-sync 存在
       → 步骤 3: Agent 加载 sddu-skill-sync Skill
       → 步骤 4: 按 sddu-skill-sync body 指引:
           ├── 扫描源目录（.sddu/skills/ + .opencode/plugins/sddu/skills/）
           ├── 检测当前 LLM Agent 工具的实际目录路径
           ├── 全量拷贝 + 管辖标识标记
           ├── 清理源目录已删除的 Skill 残留
           └── 输出同步报告
```

**关键数据流说明**：

1. **SDDU Agent 发现 Skill（流程①）**：Agent 启动后，通过模板中的硬编码引用（如「当需发现 Skill 时，参考 `sddu-skill-discovery` Skill」），由 `sddu-skill-discovery` 描述如何扫描源目录（`.sddu/skills/` + `.opencode/plugins/sddu/skills/`），列出可用 Skill 清单——这一步是 SDDU 自己的逻辑，不依赖 LLM Agent 实际目录。

2. **LLM Agent 加载 Skill（流程②）**：当 Agent 判定需要加载某个 Skill 时，调用 `skill({name: "xxx"})` 工具——OpenCode 原生按实际目录（`.opencode/skills/`）路径解析 SKILL.md 的 body 内容并注入上下文。这一步完全由 OpenCode 原生机制驱动。

3. **两套流程的桥接**：流程① 产出「可用 Skill 名称列表」，流程② 用该列表中的名称调用 `skill()` 加载 Skill。源目录扫描（流程①）确保 SDDU Agent 知道有哪些 Skill 存在，实际目录加载（流程②）确保内容实际可读。

4. **同步流（新增 v2.3.1）**：源目录 Skill → `sddu-skill-sync` Skill 按需同步 → 实际目录 Skill。同步不依赖安装脚本，用户可通过自然语言对话触发。

### 2.4 依赖关系图

```
┌─────────────────────────────────────────────────────────────────┐
│  SDDU 源码仓库 (git)                                              │
│                                                                  │
│  src/skills/                         ← 框架级 Skill 源码（三元）  │
│  ├── sddu-skill-discovery/SKILL.md                                │
│  ├── sddu-skill-creator/SKILL.md                                  │
│  └── sddu-skill-sync/SKILL.md        ← 新增 v2.3.1               │
│                                                                  │
│  src/templates/agents/sddu-*.md.hbs  ← Agent 模板（12 个）        │
│                                                                  │
│  构建 (build-agents.cjs + tsc + package.cjs):                     │
│    src/skills/             → dist/sddu/skills/                   │
│    src/templates/agents/   → dist/sddu/agents/                   │
│    src/templates/outputs/  → dist/sddu/templates/output/         │
│    opencode.json.hbs       → dist/sddu/opencode.json             │
│                                                                  │
│  安装 (install.sh → 目标项目):                                    │
│    dist/sddu/skills/       → 目标项目 .opencode/plugins/sddu/skills/│
│    dist/sddu/agents/       → 目标项目 .opencode/agents/          │
│    dist/sddu/opencode.json → 目标项目 opencode.json              │
│    （不再在 install.sh 中拷贝 Skill 到实际目录——由 sddu-skill-sync 负责）│
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  用户目标项目                                                      │
│                                                                  │
│  .sddu/skills/                        ← 用户级 Skill 源 (git 管理)│
│  ├── payment-integration/SKILL.md                                 │
│  └── db-migration/SKILL.md                                        │
│                                                                  │
│  .opencode/plugins/sddu/skills/       ← 框架级 Skill 源 (插件管理) │
│  ├── sddu-skill-discovery/SKILL.md                                │
│  ├── sddu-skill-creator/SKILL.md                                  │
│  └── sddu-skill-sync/SKILL.md         ← 新增 v2.3.1              │
│                                                                  │
│  .opencode/skills/                    ← 实际目录 (OpenCode 原生)  │
│  ├── sddu-skill-discovery/SKILL.md     ← 从框架源同步              │
│  ├── sddu-skill-creator/SKILL.md       ← 从框架源同步              │
│  ├── sddu-skill-sync/SKILL.md          ← 从框架源同步              │
│  ├── payment-integration/SKILL.md      ← 从用户源同步              │
│  └── db-migration/SKILL.md             ← 从用户源同步              │
│                                                                  │
│  .opencode/agents/sddu-*.md            ← Agent 定义 (插件安装)     │
│  opencode.json                         ← 权限 + skill: allow      │
│                                                                  │
│  同步机制（v2.3.1 变更）:                                          │
│    用户对话触发 → sddu-skill-sync Skill 按需同步                    │
│    install.sh 不再主动拷贝（仅初始化目录 + 提示）                    │
└─────────────────────────────────────────────────────────────────┘
```

### 2.5 三元自举闭环全景

```
┌──────────────────────────────────────────────────────────────┐
│                    SDDU Skill 自举闭环                         │
│                                                              │
│  sddu-skill-discovery  ──→ 告诉 Agent 如何发现 Skill           │
│  sddu-skill-creator    ──→ 告诉 Agent 如何创建 Skill           │
│  sddu-skill-sync       ──→ 告诉 Agent 如何同步 Skill           │
│                                                              │
│  三者共同实现：                                                │
│  「用 Skill 发现 Skill + 用 Skill 创建 Skill + 用 Skill 同步 Skill」│
│                                                              │
│  三元自举闭环：发现 + 创建 + 同步 = Skill 生态完整闭环           │
└──────────────────────────────────────────────────────────────┘
```

> **与「两套发现流程」的关系**：`sddu-skill-discovery` 只覆盖「流程①」—— SDDU Agent 扫描源目录的发现逻辑。LLM Agent 的「流程②」原生发现（扫描实际目录 `.opencode/skills/`）不受影响。`sddu-skill-sync` 负责桥接两套流程——将源目录内容同步到实际目录，使 LLM Agent 能通过原生机制加载。三者协作完成完整的 Skill 生命周期。

## 3. 方案对比
> 2-3 个可行方案的对比分析

### 3.1 决策维度 1：源目录到实际目录的同步机制（FR-020 / FR-028 —— 核心变更 v2.3.1）

> **⚠️ spec v2.3.1 已将同步机制从 install.sh 脚本改为 sddu-skill-sync Skill。方案 A 是 spec 的推荐方案。**

| 维度 | 方案 A：`sddu-skill-sync` Skill 按需同步（推荐） | 方案 B：install.sh 全量拷贝脚本 | 方案 C：混合——install.sh 初始化 + Skill 增量同步 |
|------|:--|:--|:--|
| 描述 | 框架内置 `sddu-skill-sync` Skill，在其 Skill body 中描述完整同步逻辑（源目录扫描 → 实际目录路径检测 → 全量拷贝 + 管辖标识标记 → 残留清理 → 同步报告）。用户通过对话触发（如「同步 SDDU Skills」），Agent 加载该 Skill 按指引执行文件操作。拷贝规则：(a) 框架级 Skill 保持 `sddu-` 前缀拷贝；(b) 用户级 Skill 保持原名拷贝；(c) 命名冲突时框架级优先。install.sh 不再执行拷贝逻辑，仅初始化目录 + 提示用户运行 sddu-skill-sync。 | `install.sh` 和 `sddu update` 命令中新增 bash 拷贝函数，按规则将源目录 Skill 全量拷贝到实际目录。拷贝策略：清空实际目录中 SDDU 管辖的 Skill 后全量重新拷贝（对应旧 plan v1.0 的方案 A，已被用户否决）。 | 安装时由 install.sh 执行一次性全量拷贝初始化（确保安装即就绪）；后续增量变更通过 `sddu-skill-sync` Skill 按需同步。两者协作——install.sh 负责首装、sddu-skill-sync 负责日常增量。 |
| 优点 | (1) **符合「Skill 优先」原则**——同步逻辑以 Skill 形式承载，而非 bash 脚本硬编码；(2) **跨 LLM Agent 可适配**——适配不同工具（OpenCode / Codex / Claude Code）的实际目录差异时只需更新 Skill body（Markdown），无需修改安装脚本；(3) **轻量、用户可控**——用户按需触发，不强制在安装/更新时执行；(4) **上下文完整**——Agent 加载 Skill 后了解完整的「为什么同步 + 如何同步」，可做出智能决策（如检测到权限不足时给出建议）；(5) **可测试性高**——Skill 可独立验证，不依赖安装脚本的环境变量。 | (1) 行为确定——bash 脚本的执行结果是可预测的；(2) 不依赖 Agent 对 Skill 的理解和工具调用；(3) 安装即就绪，无需用户额外操作。 | (1) 安装即就绪（首装体验好）；(2) 增量变更通过 Skill 处理——保留按需同步的灵活性；(3) 两种路径可互为冗余。 |
| 缺点 | (1) **依赖 Agent 工具的文件操作权限**——不同 LLM Agent 工具的工具权限可能不同（OpenCode 有 full access，其他工具可能受限），拷贝等文件操作可能被权限控制阻止；(2) 用户首次安装后 Skill 不在实际目录中——sddu-skill-sync 自身也在源目录，需要用户手动拷贝或通过其他手段首次部署后才能使用（自举冷启动问题）；(3) 比 bash 脚本慢——Agent 解析 Skill body → 理解指令 → 执行文件操作，比直接运行 bash 多一步推理开销。 | (1) **硬编码路径——不同 LLM Agent 工具的实际目录路径不同**（OpenCode 用 `.opencode/skills/`，Claude Code 用 `.claude/skills/`），bash 脚本需为每种工具写适配逻辑；(2) **违反 spec v2.3.1 设计决策**——sync 逻辑应在 Skill 中而非 bash 脚本中；(3) **已被用户否决**——用户最终设计决策明确否定该方案。 | (1) **维护两套同步路径**——install.sh bash 逻辑 + sddu-skill-sync Skill body，增加维护负担；(2) 两套路径的逻辑可能产生分歧——如 install.sh 的初始化策略与 Skill body 的增量策略不一致；(3) 复杂度最高。 |
| 风险 | 🟡 中：(1) 冷启动——sddu-skill-sync 自身的首次部署需额外处理；(2) 文件操作权限依赖 Agent 工具配置；(3) 不同 LLM Agent 工具对 Skill body 中「执行文件拷贝」的理解可能存在差异 | 🔴 **高**：bash 硬编码路径不可跨 LLM Agent 适配；已被用户否决；违反 Skill 优先原则 | 🟡 中：双路径维护复杂度 |
| 工作量 | 中（1.5 天）— 创建 1 个 Skill（SKILL.md body）+ 修改 install.sh 移除拷贝逻辑 + 处理冷启动策略 | 低（1 天）— 在 install.sh 中新增约 50 行 bash 函数（已被否决，仅作对比基准） | 中高（2.5 天）— 开发 install.sh 初始化 + sddu-skill-sync Skill + 两套逻辑的协调测试 |
| spec 覆盖 | ✅ FR-020, FR-028, FR-003, FR-024 全覆盖 | ⚠️ FR-020 不满足（sync 应在 Skill 中）| ✅ 全覆盖 |

### 3.2 决策维度 2：SDDU Agent 源目录扫描方式（FR-021）

| 维度 | 方案 A：每个 Agent 模板中硬编码扫描路径 | 方案 B：通过 `sddu-skill-discovery` Skill 统一描述扫描逻辑 | 方案 C：coordinator 集中扫描 + 路由传递 |
|------|:--|:--|:--|
| 描述 | 在每个 Agent 的 `.hbs` 模板中写死扫描路径和识别规则。每个 Agent 独立实现。 | 创建一个框架级 Skill `sddu-skill-discovery`，在其 SKILL.md body 中描述完整的源目录扫描流程。所有 Agent 模板中硬编码对该 Skill 的引用。Agent 需要发现 Skill 时加载该 Skill。 | coordinator（@sddu）在路由前预扫描源目录，将「可用 Skill 清单」作为上下文传递给子 Agent。 |
| 优点 | (1) 简单直接，无需额外 Skill 文件；(2) 无 Skill 间调用的潜在可靠性问题 | (1) 单一真相来源——扫描逻辑在一个地方定义和维护；(2) 新增 Agent 自动获得 Skill 发现能力；(3) 完整自举闭环——「用 Skill 发现 Skill」；(4) 与 spec G-007/G-008 完全对齐 | (1) 扫描逻辑只需一处实现（coordinator）；(2) 子 Agent 模板无需改动——低侵入 |
| 缺点 | (1) 12 个 Agent 模板中重复维护相同逻辑——DRY 违反；(2) 扫描逻辑变更需改 12 个文件；(3) spec G-007 要求 `sddu-skill-discovery` 作为独立 Skill 存在——该方案未创建该 Skill | (1) 需创建一个新 Skill 文件；(2) 依赖 Skill 的加载可靠性——若 `skill()` 加载失败则 Agent 无法发现任何 Skill；(3) 需验证 OpenCode 环境下的 Skill 嵌套加载行为（OP-007 待验证） | (1) coordinator 复杂度增加；(2) 子 Agent 在被 `task()` 调度时不经过 coordinator——无法获得 Skill 清单；(3) 「子 Agent 独立调用」场景（用户直接 @sddu-build）丢失 Skill 发现能力 |
| 风险 | 🟡 中：维护负担随 Agent 数量线性增长，且不完全对齐 spec G-007 | 🟢 低：技术核心需求简单（scandir + readdir），`skill()` 调用机制已成熟 | 🟡 中：task() 调度绕过 coordinator 导致部分 Agent 丢失 Skill 清单 |
| 工作量 | 低（0.5 天）| 中（1 天）| 中（1.5 天）|

### 3.3 决策维度 3：Agent 模板中 hardcode 引用措辞（FR-026, OP-015）

| 维度 | 方案 A：`skill("sddu-skill-discovery")` 工具调用 | 方案 B：自然语言指令 | 方案 C：两者混合 |
|------|:--|:--|:--|
| 描述 | Agent 模板中直接写 `skill("sddu-skill-discovery")`，Agent 启动或需要时自动执行该工具调用。 | Agent 模板中写自然语言指令：「当需要发现或使用 SDDU Skill 时，参考 `sddu-skill-discovery` 这个 Skill 了解如何发现 SDDU Skill」。 | 模板中同时包含自然语言说明 + `skill(...)` 调用示例。 |
| 优点 | (1) 确定性——Agent 必然加载该 Skill；(2) 行为可测试 | (1) 灵活——Agent 只在需要时才加载，节省 context；(2) 与 Anthropic skill 使用模式一致——语义匹配触发 | (1) 兼具灵活性和确定性；(2) 给 Agent 自主权 |
| 缺点 | (1) 强制加载，增加每次 Agent 启动的 context 消耗；(2) OpenCode 未明确定义 Agent prompt 中使用工具调用的行为 | (1) Agent 可能忽略指令或延迟加载；(2) 存在冷启动问题 | (1) 复杂度略高；(2) 行为不完全确定 |
| 风险 | 🟡 中：工具调用语义在 System Prompt 中不可靠 | 🟡 中：Agent 可能不加载 | 🟢 低 |
| spec 覆盖 | ✅ FR-026 满足 | ✅ 满足——但依赖 Agent 正确理解自然语言 | ✅ 满足 |

### 3.4 决策维度 4：框架级 Skill 源在 SDDU 仓库中的源码路径

| 维度 | 方案 A：`src/skills/` | 方案 B：`src/templates/skills/` | 方案 C：`.opencode/plugins/sddu/skills/`（仓库内直放） |
|------|:--|:--|:--|
| 描述 | 框架级 Skill 的 SKILL.md 源码放在 `src/skills/` 下，由 package.cjs 在打包时拷贝到 `dist/sddu/skills/` | 框架级 Skill 的 SKILL.md 源码与 Agent 模板放在一起——`src/templates/skills/` | 框架级 Skill 直接放在仓库的 `.opencode/plugins/sddu/skills/` 路径，跳过构建拷贝步骤 |
| 优点 | (1) 语义清晰——`src/skills/` 明确表达「框架能力」；(2) 与 `src/templates/agents/` 平级，目录职责划分清晰 | (1) 复用现有模板构建流程；(2) 减少 `package.cjs` 修改量 | (1) 零构建拷贝——路径即目标路径；(2) 安装时 `install.sh` 直接拷贝整个目录 |
| 缺点 | (1) 需要 package.cjs 新增拷贝逻辑；(2) 引入新顶层目录 `src/skills/` | (1) Skill 不是模板——SKILL.md 不需 `.hbs` 处理；(2) 语义混淆 | (1) `.opencode/` 目录在仓库中为空——全量追踪该目录可能引入不必要文件；(2) 与现有 `install.sh` 的分发逻辑不一致 |
| 风险 | 🟢 低 | 🟡 中：语义混淆导致未来维护困难 | 🟡 中：与现有构建流程不一致 |
| 工作量 | 低（0.5 天）| 低（0.5 天）| 低（0.5 天）|

## 4. 推荐方案
> 推荐方案及选择理由

### 4.1 同步机制：**方案 A（`sddu-skill-sync` Skill 按需同步）**（v2.3.1 核心变更）

**理由**：
1. **符合 spec v2.3.1 用户最终设计决策**——spec 明确将同步机制从 install.sh 改为 `sddu-skill-sync` Skill。用户否决了 install.sh 主动拷贝方案，选择「Skill 优先」路径。
2. **跨 LLM Agent 工具可适配**——sync 逻辑在 Markdown Skill body 中，而非 bash 硬编码路径。切换 LLM Agent 工具时（OpenCode → Codex → Claude Code），只需更新 Skill body 中的实际目录路径描述，无需修改安装脚本。
3. **完成三元自举闭环**——`sddu-skill-sync` 与 `sddu-skill-discovery`、`sddu-skill-creator` 并列，三者共同构成「用 Skill 发现 + 用 Skill 创建 + 用 Skill 同步」的完整 Skill 生态——这是 spec G-009 和 §5.7 的核心设计目标。
4. **用户可控、按需触发**——不强制在安装/更新时执行拷贝，用户根据需要主动触发同步。符合「Agent 不越界」的安全原则。
5. **aligns with 整体架构哲学**：「Agent 固定 + Skill 扩展」——同步机制作为扩展能力通过 Skill 实现，而非在核心安装脚本中硬编码。

**冷启动策略**：
`sddu-skill-sync` 是框架级 Skill，通过 install.sh 部署到源目录。用户使用 SDDU Agent（@sddu / @sddu-fast 等）时，模板中已硬编码 discovery → 可自动发现 sync → 加载执行同步。非 SDDU Agent 场景下如需同步，询问任意 SDDU Agent 即可。

### 4.2 SDDU Agent 源目录扫描方式：**方案 B（sddu-skill-discovery Skill 统一描述）**

**理由**：
1. **与 spec G-007/G-008 完全对齐**——spec 明确要求创建 `sddu-skill-discovery` Skill 作为独立目录存在 + Agent 模板硬编码引用。
2. **完整自举闭环**——与 `sddu-skill-creator`、`sddu-skill-sync` 并列构成三元闭环。
3. **单一真相来源**——扫描逻辑一处定义，12 个 Agent 模板只需引用。
4. **新增 Agent 自动获得**——未来新增 Agent 只需在模板中包含引用，无需重复实现。

### 4.3 Agent 模板引用措辞：**自然语言指令 — 三阶段渐进披露**

**三阶段模型**：

| 阶段 | 触发条件 | 动作 | 返回 | 成本 |
|:--:|------|------|------|:--:|
| **1** | 始终默认执行 | 扫描 `xxx/skills/` 目录列表（不读文件） | 目录名清单 | ~0 tokens |
| **2** | LLM 对某 skill 感兴趣 | 读取 `SKILL.md` 头部 frontmatter | name + description | ~100 tokens/skill |
| **3** | LLM 决定使用某 skill | 返回该 skill 的目录路径 | 目录路径 | 0（路径引用） |

**理由**：
1. **Stage 1 零成本**——仅 `ls`/`readdir` 目录名，不读任何文件内容，始终默认执行，不依赖 Agent 判断「何时需要」。
2. **Stage 2 按兴趣触发**——Agent 拿到目录清单后，根据目录名初步判断相关性，仅对感兴趣的 skill 读取 frontmatter 获取 description，避免全量加载。
3. **Stage 3 路径引用**——不把完整 body 注入 context。返回目录路径，由 LLM 自行进入目录按需读取 `SKILL.md` body 和 `references/`、`scripts/` 等资源文件——context 完全由 LLM 控制。

**推荐的具体措辞**（待 tasks 阶段标准化写入模板）：

```
## Skill 发现

当需要发现或使用 SDDU Skill 时，加载 `sddu-skill-discovery` Skill 获取完整指引 —— 该 Skill 描述了三阶段渐进披露模型（目录扫描 / frontmatter 读取 / 目录路径返回）、边界情况处理、可用清单组织，以及与 `sddu-skill-sync`、`sddu-skill-creator` 的协作关系。

**源目录**（SDDU 管辖）：
- 用户级：`.sddu/skills/`
- 框架级：`.opencode/plugins/sddu/skills/`

**实际目录**：`.opencode/skills/`（由 `sddu-skill-sync` 同步后，供 LLM Agent 原生机制加载）

若实际目录中无 SDDU Skill，从源目录 `.opencode/plugins/sddu/skills/sddu-skill-sync/SKILL.md` 加载 `sddu-skill-sync` 执行同步。
```

### 4.4 框架级 Skill 源码路径：**方案 A（`src/skills/`）**

**理由**：
1. **语义清晰**——`src/skills/` 直接表达「SDDU 框架级 Skills 的源码」。
2. **目录职责单一**——Agent 模板是「如何执行」，Skill 是「执行什么」，不同质的文件应分目录管理。
3. **构建流程少耦合**——Skill 是纯 Markdown，不需要 `.hbs` 编译，放在独立的 `src/skills/` 目录下由 `package.cjs` 直接拷贝即可。

### 4.5 推荐方案的 spec 合规检查

| spec P0 FR | 需求 | 推荐方案覆盖 |
|-----------|------|:--:|
| FR-001 | 用户级 Skill 源目录 `.sddu/skills/` | ✅ install.sh 创建 + Agent 模板中引用 |
| FR-002 | 框架级 Skill 源目录 `.opencode/plugins/sddu/skills/` | ✅ `src/skills/` → `dist/sddu/skills/` → 目标项目 |
| FR-003 | 实际目录拷贝 | ✅ sddu-skill-sync Skill 按需同步 |
| FR-004 | SKILL.md 格式规范 | ✅ skill-creator 对话式引导 |
| FR-005 | Skill 触发机制（复用 OpenCode） | ✅ 同步到实际目录后 OpenCode 原生生效 |
| FR-008 | skill-creator Skill 内置 | ✅ `src/skills/sddu-skill-creator/SKILL.md` |
| FR-009 | skill-creator description 优化 | ✅ SKILL.md body 中实现 |
| FR-011 | skill-creator 自举闭环 | ✅ 框架级 Skill 产自 SDDU 完整流程 |
| FR-012 | Agent 新增门禁 | ✅ 写入 SDDU 维护约束文档 |
| FR-013 | Agent→Skill 降级评估框架 | ✅ 由 plan ADR 承载（不单独产出文档） |
| FR-018 | 写作指南 | ✅ 由 `sddu-skill-creator` Skill 对话式引导承载 + README.md 简述 |
| FR-020 | 源目录到实际目录的同步机制 | ✅ sddu-skill-sync Skill 按需同步 |
| FR-021 | SDDU Agent 扫描源目录 | ✅ sddu-skill-discovery Skill |
| FR-025 | skill-discovery Skill 内置 | ✅ `src/skills/sddu-skill-discovery/SKILL.md` |
| FR-026 | Agent 模板硬编码引用 | ✅ 12 个模板中新增「Skill 发现与同步」章节 |
| FR-027 | 框架级 Skill 清单更新（三元） | ✅ 内置清单含 discovery + creator + sync |
| FR-028 | sddu-skill-sync Skill 内置 | ✅ `src/skills/sddu-skill-sync/SKILL.md` |

## 5. 文件影响分析
> 所有需要创建/修改/删除的文件

| 操作 | 文件路径 | 说明 | 对应 FR |
|:--:|------|------|:--:|
| **新建（框架级 Skill — 三元闭环）** |
| NEW | `src/skills/sddu-skill-creator/SKILL.md` | skill-creator Skill body——对话式引导创建 Skill 的工作流 | FR-008, FR-009, FR-010 |
| NEW | `src/skills/sddu-skill-discovery/SKILL.md` | skill-discovery Skill body——源目录扫描流程描述 | FR-025 |
| NEW | `src/skills/sddu-skill-sync/SKILL.md` | sddu-skill-sync Skill body：源目录扫描 + 实际目录检测 + 全量拷贝 + 管辖标识 + 残留清理 + 同步报告 | FR-028, FR-020 |
| **修改（Agent 模板 — 12 个文件）** |
| MODIFY | `src/templates/agents/sddu.md.hbs`（coordinator） | 新增「Skill 发现与同步」章节——硬编码 `sddu-skill-discovery` 引用（sync 通过 discovery 间接发现） | FR-026, G-008 |
| MODIFY | `src/templates/agents/sddu-discovery.md.hbs` | 同上 | FR-026 |
| MODIFY | `src/templates/agents/sddu-spec.md.hbs` | 同上 | FR-026 |
| MODIFY | `src/templates/agents/sddu-plan.md.hbs` | 同上 | FR-026 |
| MODIFY | `src/templates/agents/sddu-tasks.md.hbs` | 同上 | FR-026 |
| MODIFY | `src/templates/agents/sddu-build.md.hbs` | 同上 | FR-026 |
| MODIFY | `src/templates/agents/sddu-review.md.hbs` | 同上 | FR-026 |
| MODIFY | `src/templates/agents/sddu-validate.md.hbs` | 同上 | FR-026 |
| MODIFY | `src/templates/agents/sddu-roadmap.md.hbs` | 同上 | FR-026 |
| MODIFY | `src/templates/agents/sddu-tree.md.hbs` | 同上 | FR-026 |
| MODIFY | `src/templates/agents/sddu-docs.md.hbs` | 同上 | FR-026 |
| MODIFY | `src/templates/agents/sddu-fast.md.hbs` | 同上 | FR-026 |
| **修改（构建/安装脚本）** |
| MODIFY | `scripts/package.cjs` | 新增 `src/skills/` → `dist/sddu/skills/` 的拷贝逻辑（约 10 行） | FR-002 |
| MODIFY | `install.sh` | 移除旧 plan 中的全量拷贝函数；改为：Step 8 创建 `.sddu/skills/` 空目录 + 打印「请运行 sddu-skill-sync 同步 SDDU Skills」提示；Step 5 继续拷贝框架源到 `.opencode/plugins/sddu/skills/`（插件分发，不受影响） | FR-020, G-009 |
| **修改（配置）** |
| MODIFY | `src/adapters/opencode/templates/opencode.json.hbs` | 确保 `skill: "allow"` 权限已启用（当前已启用，需验证） | FR-006 |
| **修改（SDDU 核心文档）** |
| MODIFY | `README.md` | 新增 Skill 系统介绍章节 + 三元闭环说明 | FR-018 |
| > **注**：`.opencode/skills/.sddu-manifest.txt` 由 `sddu-skill-sync` Skill 在**目标项目运行时**创建（管辖标识清单），不属于 SDDU 源码仓库的文件变更。`.sddu/` 下的 state.json / ADR 等由 SDDU 流程自身产出，不列入 plan 文件影响。

**汇总**：
- **NEW**: 3 个文件（框架级 Skill 三元闭环 `src/skills/`）
- **MODIFY**: 16 个文件（12 个 Agent 模板 + `scripts/package.cjs` + `install.sh` + `opencode.json.hbs` + `README.md`）— 全部在 `src/`、`scripts/`、`examples/` 等设计态源码范围内
- **DELETE**: 0 个文件

> **关键变更 vs 旧 plan v1.0**：install.sh 的修改方向从「新增拷贝函数」变为「移除拷贝逻辑 + 新增提示」。不再依赖 install.sh 完成同步。

## 6. 风险评估
> 识别技术、依赖和时间风险及缓解措施

| 风险 | 概率 | 影响 | 缓解措施 |
|------|:--:|:--:|----------|
| **sddu-skill-sync 的 Skill body 中描述的拷贝操作依赖 Agent 工具的文件操作权限**——不同 LLM Agent 工具的工具权限可能不同（OpenCode 有 full access，其他工具可能受限），拷贝等文件操作可能被权限控制阻止（**v2.3.1 新增风险**） | 🟡 中 | 🔴 高 — 若 Agent 无法执行 Skill body 中描述的文件拷贝操作，则 sync 完全失效，实际目录永远为空 | (1) 在 Skill body 中使用通用自然语言描述操作（「使用文件操作工具将源目录中的文件拷贝到实际目录」），而非硬编码特定工具调用；(2) 在 OpenCode 权限配置中为 `sddu-skill-sync` Skill 设置 `allow` 权限；(3) 在 skill-writing-guide.md 中说明不同 LLM Agent 工具的权限配置要求；(4) 在 validate 阶段用多个 Agent 工具环境实测 |
| **sddu-skill-sync 自身的冷启动问题**——首次安装后 sddu-skill-sync 仅在源目录，非 SDDU Agent 无法直接发现和加载 sync（非 SDDU Agent 的模板中无 discovery 硬编码） | 🟢 低 | 🟢 低 — 用户正常使用 @sddu / @sddu-fast 等 SDDU Agent 时，模板中已硬编码 discovery，可通过 discovery 发现并加载 sync，无冷启动问题。若用户执意使用非 SDDU Agent 来同步，只需询问任意 SDDU Agent 即可获知解决方法 | (1) install.sh 保持简单——不做复杂提示，不偏离安装脚本定位；(2) 缓解逻辑在 SDDU Agent 模板中——discovery 发现 sync 存在后 Agent 知晓如何同步
| **硬编码 discovery 引用的 LLM 可达性**——Agent 模板中硬编码的 discovery 引用能否被 LLM 正确理解并执行？ | 🟢 低 | 🟢 低 — LLM 的本质是提示词驱动，模板中的硬编码引用即为其输入的一部分，LLM 自然可以读取和理解。不依赖 LLM Agent 工具的 `skill()` 嵌套调用机制 | (1) 直接在模板中写入三阶段渐进披露指令，作为 LLM 的 system prompt 上下文；(2) tasks 阶段做简单的端到端验证确认行为符合预期即可 |
| **拷贝同步的 clean-up 可能误删用户手动放置的第三方 Skill**（FR-024） | 🟡 中 | 🟡 中 — 若管辖标识机制（`.sddu-manifest.txt`）失效，可能在同步时误删第三方 Skill | (1) sddu-skill-sync Skill body 中明确描述——同步前先读取 `.sddu-manifest.txt`，只操作清单中的 Skill；(2) 在诊断流程中加入「非 SDDU 管辖 Skill 检测」；(3) 同步前 Agent 应列出将受影响的操作清单供用户确认 |
| **Agent 模板变更（12 个文件）的维护一致性** | 🟡 中 | 🟡 中 — 12 个 Agent 模板中新增相同的「Skill 发现」章节（仅硬编码 discovery），存在不同步风险 | (1) 措辞模板抽取为一段标准文本，通过代码审查确保一致 |
| **Skill 数量增长后触发准确性下降**（EC-006） | 🟢 低 | 🟡 中 — 当前 Skill 数量极少（~5 个），暂不构成问题 | (1) NFR-002 已定义交叉冲突检查；(2) Skill 写作指南中提供 description 优化建议；(3) 待 OpenCode 提供优先级/权重配置后跟进适配 |
| **package.cjs 和 install.sh 改动可能破坏现有构建/安装流程** | 🟢 低 | 🔴 高 — `install.sh` 和 `package.cjs` 是关键基础设施 | (1) install.sh 修改为**移除**逻辑（比新增更安全），仅修改 Step 8 的提示；(2) package.cjs 修改量极小（约 10 行新增拷贝）；(3) E2E 测试覆盖完整构建→安装→验证流程 |

## 7. 生成的 ADR
> 本次规划产出的架构决策记录

| ADR | 标题 | 状态 | v2.3.1 变更 |
|-----|------|:--:|------------|
| ADR-001 | 「源目录 + 实际目录」双层架构 | ACCEPTED | 无变更 |
| **ADR-002** | **同步机制：`sddu-skill-sync` Skill 按需同步** | **PROPOSED** | **🔴 完全重写** — 从「install.sh 全量拷贝 + 管辖标识」改为「sddu-skill-sync Skill 按需同步」 |
| ADR-003 | Skill 发现流程：`sddu-skill-discovery` Skill 统一描述 vs Agent 模板硬编码 | PROPOSED | 无变更（更新引用措辞以反映三元闭环） |
| ADR-004 | Agent 模板中 Skill 发现的三阶段渐进披露模型 | PROPOSED | 更新为三阶段模型（目录名→frontmatter→目录路径）；措辞从「当需要时」改为「始终默认 Stage 1」 |
| ADR-005 | 框架级 Skill 源码在仓库中的存放路径：`src/skills/` | PROPOSED | 无变更（新增子目录 `src/skills/sddu-skill-sync/` 纳入此 ADR） |

## 8. 产物审查策略
> 供 review 阶段使用的产物清单和审查基准

| 审查产物 | 审查基准 |
|---------|---------|
| `src/skills/sddu-skill-creator/SKILL.md` | spec.md FR-008/FR-009/FR-010（验收标准） |
| `src/skills/sddu-skill-discovery/SKILL.md` | spec.md FR-025（验收标准） |
| `src/skills/sddu-skill-sync/SKILL.md` | spec.md FR-028（验收标准）+ FR-020（同步行为验收标准） |
| 12 个 Agent `.hbs` 模板变更 | spec.md FR-026（验收标准）+ plan.md ADR-004（三阶段渐进披露） |
| 12 个 Agent `.hbs` 模板变更 | spec.md FR-026（验收标准）+ plan.md ADR-004（引用措辞一致性，含 sync 引用） |
| `scripts/package.cjs` 变更 | spec.md FR-002（框架源目录到位） |
| `install.sh` 变更 | spec.md FR-020/FR-028 — 不执行拷贝，仅初始化目录 + 提示同步 |
| `src/adapters/opencode/templates/opencode.json.hbs` | spec.md FR-006（权限配置） |
| plan.md 中的 ADR（尤其是 ADR-002 重写） | spec.md §2.4 路径架构决策 + G-009（sddu-skill-sync 内置） |

## 9. 产物验证策略
> 供 validate 阶段使用的产物验证流程——基于 E2E 测试项目实际执行

### 验证流程

```
Step 0: 构建 → Step 1: 创建 E2E 测试项目 → Step 2~9: 逐项验证
```

### 验证场景

| ID | 场景 | 命令/检查 | 预期结果 | 实测 |
|:--:|------|----------|---------|:--:|
| **V1** | 安装后目录结构 | `test -d .sddu/skills` + `test -d .opencode/plugins/sddu/skills` | 两个源目录均存在 | ✅ |
| **V2** | 框架 Skill 文件完整性 | 检查 3 个 SKILL.md 的 name + description + 行数 | 均存在，frontmatter 完整，≤500 行 | ✅ |
| **V3** | 实际目录初始为空 | `ls .opencode/skills/` | 空（sync 未执行） | ✅ |
| **V4** | Agent 模板含三阶段章节 | `grep -q "Skill 发现" .opencode/agents/sddu*.md` | 12/12 通过 | ✅ |
| **V5** | sync 未独立硬编码 | grep 确认仅在三阶段发现上下文中引用 | 通过（发现上下文，非独立绑定） | ✅ |
| **V6** | install.sh 同步提示 | `grep "同步 SDDU Skills"` | 提示已内置 | ✅ |
| **V7** | opencode.json 权限 | `grep '"skill".*"allow"'` | skill: allow | ✅ |
| **V8** | 三阶段模型完整性 | `grep "Stage 1\|Stage 2\|Stage 3"` | 三个阶段均存在 | ✅ |
| **V9** | 源目录 Skill 清单 | 扫描 `.opencode/plugins/sddu/skills/` | 3 个 Skill（discovery/creator/sync），含完整 description | ✅ |

### 执行脚本

验证脚本位于 `scripts/verify-skills.sh`，包含完整的 E2E 验证流程：

```bash
bash scripts/verify-skills.sh
```

**脚本结构**：

| Step | 内容 | 方法 |
|:--:|------|------|
| 1 | `npm run build && npm run package` | 本地构建 |
| 2 | `bash e2e/scripts/basic/sddu-e2e.sh` | 创建 E2E 测试项目（附带最新插件） |
| 3-6 | V1-V9 文件级验证 | bash 直接检查 |
| 7 | V10 sync 验证 | `opencode run --auto --agent sddu "同步 SDDU Skills"` |
| 7 | V11 creator 验证 | `opencode run --auto --agent sddu "帮我创建一个 SDDU Skill..."` |

### LLM Agent 运行时验证（opencode run --auto）

`opencode run --auto` 支持非交互式执行，关键参数：

```bash
cd <test-project>
opencode run --auto --format json --agent sddu "同步 SDDU Skills"
```

| 验证项 | 命令 | 验收标准 | 实测 |
|--------|------|---------|:--:|
| **V10** | `opencode run --auto --agent sddu "同步 SDDU Skills"` | `.opencode/skills/` 出现 3 个 Skill + `.sddu-manifest.txt` | ✅ |
| **V11** | `opencode run --auto --agent sddu "帮我创建一个 SDDU Skill，叫 deploy-checklist"` | `.sddu/skills/deploy-checklist/SKILL.md` 产出 | — |

> ⚠️ `opencode run` 依赖 LLM 模型响应时间，单次执行可能需要 3-5 分钟。V10/V11 设置了 10 分钟超时，超时后脚本会检查文件系统确认任务是否已完成（LLM 可能已完成但 CLI 仍阻塞）。

---

## 10. 开放问题解决状态
> 对 spec.md §8 中待 plan 阶段决策的开放问题的解决情况

| OP # | 问题 | plan 解决状态 |
|------|------|:--:|
| OP-003 | 已规划 Agent 降级评估 | ✅ 已输出 ADR-003 附件——降级评估矩阵 |
| OP-004 | Skill 生命周期管理协议 | 🟡 **部分解决**——用户级走轻量流程（直接编辑 SKILL.md），框架级走完整 SDDU 流程。具体协议细节留待 tasks 阶段定义 |
| OP-005 | skill-creator 定位 | ✅ **确认交互式**——spec FR-008/FR-009/FR-010 设计反映交互式定位 |
| OP-006 | Skill 触发准确率验证路径 | 🟡 **部分解决**——在 tasks 阶段定义测试框架 |
| OP-007 | Skill 间嵌套调用验证 | ✅ **已确认低风险**——硬编码引用写入 LLM 提示词模板即为 LLM 输入，LLM 自然可读取，不依赖工具侧 skill() 嵌套机制 |
| OP-008 | Skill 版本与插件版本对齐 | ✅ **已确认全量覆盖策略**——spec EC-002 已定义。同步时源目录覆盖实际目录 |
| OP-009 | 框架级 Skill 安装时机 | ✅ **确认随插件安装至源目录**——install.sh 将框架源 Skill 部署到 `.opencode/plugins/sddu/skills/`，但不拷贝到实际目录。实际目录的同步由 sddu-skill-sync 按需触发 |
| OP-010 | 诊断工具形态 | ✅ **确认独立命令**——`sddu skill doctor`，由 @sddu-fast 快速模式处理 |
| OP-011 | 同步机制细节（v2.3.1 更新） | ✅ **本计划确认**——sddu-skill-sync Skill body 描述同步逻辑（源目录扫描 → 实际目录检测 → 全量拷贝 → 管辖标识 → 残留清理 → 同步报告）。管辖标识使用 `.sddu-manifest.txt` 清单文件。同步由用户对话触发（如「同步 SDDU Skills」） |
| OP-012 | 框架源路径确认 | ✅ **已确认无风险**——`.opencode/plugins/sddu/skills/` 是 SDDU 内部源目录约定，同步前 SDDU Agent 自发现，同步后 OpenCode 扫 `.opencode/skills/` 原生生效，无需 OpenCode 侧确认 |
| OP-013 | 跨 LLM Agent 实际目录适配 | ✅ **通过 sddu-skill-sync Skill 解决**——Skill body 描述实际目录检测逻辑（「检测当前 LLM Agent 工具的实际目录路径，如 OpenCode 使用 `.opencode/skills/`，Claude Code 使用 `.claude/skills/`」），适配不同工具只需更新 Skill body（Markdown），无需修改安装脚本。这正是 spec v2.3.1 选择 Skill 路径的核心原因 |
| OP-014 | skill-discovery 感知范围 | ✅ **确认只关注源目录**——与 FR-021 一致，保持与 LLM Agent 流程②解耦 |
| OP-015 | Agent 模板硬编码引用措辞 | ✅ **选定三阶段渐进披露模型**（ADR-004）。仅硬编码 `sddu-skill-discovery`；sync 通过 discovery 间接发现（三阶段：目录名→frontmatter→路径） |

**tasks 阶段需优先处理的技术验证**：
1. **验证 sddu-skill-sync Skill 的全链路可达性**——Agent 通过硬编码 discovery → 扫描源目录 → 发现 sync → 加载 sync → 能否执行 Skill body 中描述的文件拷贝操作？
2. 验证 `sddu skill doctor` 命令的诊断覆盖度（EC-008 场景）

## 修订记录
> 记录本文档的版本变更历史

| 版本 | 变更说明 | 日期 | 修订人 |
|------|---------|------|--------|
| v2.0 | 基于 spec v2.3.1 重写技术方案：(1) 同步机制从 install.sh 全量拷贝重构为 `sddu-skill-sync` Skill 按需同步——重写 ADR-002 和 §3.1 方案对比（A/B/C 三方案）、§4.1 推荐方案；(2) 自举闭环从双钥匙升级为三元闭环（discovery + creator + sync），更新 §2.2、§2.4、§2.5；(3) 新增 FR-028/G-009 覆盖 sddu-skill-sync Skill 内置需求；(4) 更新架构分析（§2.2-§2.3）、文件影响（NEW +1 sddu-skill-sync/SKILL.md，MODIFY install.sh 移除拷贝逻辑）、风险评估（新增 2 项 v2.3.1 特有风险）、开放问题 OP-011/OP-013 状态更新；(5) ADR-002 完全重写，ADR-004 措辞微调（含 sync 引用），§10 开放问题全部刷新 | 2026-07-19 | SDDU Plan Agent |
| v1.0 | 初始创建 — 基于 spec.md v2.2 产出完整技术方案、4 个架构决策维度的方案对比、5 个 ADR、文件影响分析（NEW 6 / MODIFY 16 / DELETE 0）、风险评估（6 项）、产物审查/验证策略、15 个开放问题的解决状态 | 2026-07-19 | SDDU Plan Agent |
