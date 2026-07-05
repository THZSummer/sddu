# 技术计划：@sddu-docs Agent 补全与优化

> **文档定位**: SDDU 技术方案 — 记录架构设计、方案对比和 ADR，作为 tasks 阶段的输入  
> **前置依赖**: spec.md (v1.3，需求规范) + discovery.md (问题挖掘)  
> **创建人**: SDDU Plan Agent  
> **创建时间**: 2026-07-04  
> **版本**: v2.4  
> **更新人**: SDDU Plan Agent  
> **更新时间**: 2026-07-05  
> **更新说明**: v2.4 — §10.3.1 步骤 2/7 修正：TEST_DIR 改为固定路径加时间戳（替代 mktemp 随机后缀），方便用户定位验证产物；验证完成后保留 TEST_DIR 不自动删除，方便复核

---

## 1. 前置检查

| 检查项 | 状态 |
|--------|:--:|
| spec.md 存在 | ✅ (v1.3, 147 行，包含 9 FR + 4 NFR + 11 EC) |
| discovery.md 存在 | ✅ (v1.0, 132 行，包含 10 问题 + 6 假设 + 5 风险) |
| 外部 API 文档缓存 | 无依赖（纯内部文件变更） |
| 前置依赖 | 无（@sddu-docs 不依赖任何现有 Feature 的产出） |
| `src/templates/agents/sddu-docs.md.hbs` 存在 | ✅ (110 行占位骨架，§5 标注「待后续 Feature 定义」) |
| `src/templates/outputs/docs/` 目录存在 | ❌ (缺失 — 需新建，含 base/web/lib/cli 四个子目录) |
| `.opencode/plugins/sddu/templates/output/docs/` 目录存在 | ❌ (缺失 — 需由 build-agents.cjs 构建时同步) |
| `.sddu/docs-tree-root/` 目录存在 | ❌ (未创建 — 运行时按需创建) |

---

## 2. 架构分析

### 2.1 现状架构

```
SDDU 模板系统架构 (当前)
═══════════════════════════════════════════════════════

src/templates/agents/                          ← Agent 指令模板（Handlebars 源文件）
├── sddu.md.hbs                               (入口 Agent 指令)
├── sddu-discovery.md.hbs                     (阶段 0/6，238 行)
├── sddu-spec.md.hbs                          (阶段 1/6，153 行)
├── sddu-plan.md.hbs                          (阶段 2/6，146 行)
├── sddu-tasks.md.hbs                         (阶段 3/6，140 行)
├── sddu-build.md.hbs                         (阶段 4/6，129 行)
├── sddu-review.md.hbs                        (阶段 5/6，153 行)
├── sddu-validate.md.hbs                      (阶段 6/6，146 行)
├── sddu-roadmap.md.hbs                       (辅助 Agent，367 行)
├── sddu-tree.md.hbs                          (辅助 Agent，261 行)
└── sddu-docs.md.hbs                          (辅助 Agent，110 行)

src/templates/outputs/                         ← 产物模板（Handlebars 源文件）
├── sddu-discovery.md.hbs                     (89 行)
├── sddu-spec.md.hbs                          (36 行)
├── sddu-plan.md.hbs                          (87 行)
├── sddu-tasks.md.hbs                         (41 行)
├── sddu-build.md.hbs                         (45 行)
├── sddu-review.md.hbs                        (48 行)
└── sddu-validate.md.hbs                      (69 行)

.opencode/plugins/sddu/templates/output/       ← 已安装插件模板
├── sddu-discovery.md.hbs ~ sddu-validate.md.hbs (7 个)
```

**关键链接点**:
- `build-agents.cjs` (`scripts/build-agents.cjs`): 第 108 行 `specialAgents` 已包含 `sddu-docs`
- `opencode.json`: 第 69-72 行已注册 `sddu-docs` agent，指向 `{file:.opencode/agents/sddu-docs.md}`
- 运行时 Agent 加载链: `opencode.json` → `build-agents.cjs` 构建产物 → `.opencode/agents/sddu-docs.md`（LLM prompt）
- `.sddu/docs-tree-root/`：不存在

### 2.2 现状问题

| # | 问题 | 现状具体表现 |
|---|------|------------|
| Q1 | **Agent 指令模板不完整** | `src/templates/agents/sddu-docs.md.hbs` 存在（110 行），但 §5 工作流程仅一行「待后续 Feature 定义」，不包含可执行的工作流指令 |
| Q2 | **输出模板缺失** | `src/templates/outputs/` 目录下无任何 sddu-docs 相关的 `.hbs` 文件。本 Feature 需新建模板库目录 |
| Q3 | **产物落盘目录不存在** | `.sddu/docs-tree-root/` 尚未创建。本 Feature 需定义其目录结构并支持运行时按需创建 |

### 2.3 需要的新组件

| 组件 | 类型 | 说明 |
|------|------|------|
| `sddu-docs.md.hbs` (agent template) | 改造 | 将现有 110 行占位骨架补全为 ~250-300 行的可执行指令模板，核心变更在 §5 工作流程（从「待后续 Feature 定义」变为 6 步骤执行流程 + 版本感知聚合 + 增量更新） |
| `src/templates/outputs/docs/` (template library) | 新建 | @sddu-docs 专用模板库，扁平结构，10 个模板文件，命名规则 `sddu-docs-{类型}[-{场景}].md.hbs`。LLM 按文件名选择，不依赖目录层级。详见 §2.7.5 |

### 2.4 数据流

```
@sddu-docs 调用
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│ 步骤 1: 工作空间验证                                       │
│   - 确认 specs-tree-root/ 存在且有 Feature 目录            │
│   - 确认 docs-tree-root/ 状态（不存在/已存在）              │
│   - EC-001: 无任何 Feature → 提示并终止                    │
│   - EC-002: docs-tree-root/ 已存在 → 进入增量模式          │
└─────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│ 步骤 2: Feature 扫描                                      │
│   - 扫描 specs-tree-root/ 下所有 Feature 目录             │
│   - 递归包含子 Feature (EC-008)                           │
│   - 提取每个 Feature 的元数据：名称、阶段、版本号            │
│   - 排除已终止迁移的 Feature                              │
└─────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│ 步骤 3: 业务层级推导（轻量预扫描）                         │
│   - 只读 state.json + spec.md 目标章节，输入量可控         │
│   - 按语义相似度将 Feature 分组为业务域和模块               │
│   - 无法归入其他域的 Feature 自成一级目录                   │
│   - 首次运行时将聚类结果持久化                              │
│     · 位置：根级 docs-overview.md 的 Feature 索引表         │
│     · 格式：Markdown 表格，增加「所属域」列                  │
│   - 后续增量运行时仅变更 Feature 重新评估归属               │
└─────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│ 步骤 4~7: 逐域迭代处理                                    │
│                                                         │
│  对每个业务域循环：                                       │
│    - 只加载该域 Feature 的完整 spec.md + plan.md          │
│    - 提取产物内容 → 选择模板 → 生成文档 → 写入目录树        │
│    - 同时提取该域技术信息（NFR/ADR/技术栈），写入域级        │
│      docs-overview.md 的技术章节（缓存供后续归纳）          │
│    - 处理完释放上下文，进入下一个域                        │
│                                                         │
│  同一 Agent 会话内完成，不跨会话调用。                     │
│  增量时：仅处理变更 Feature 所在的域，其余域跳过。          │
│  域归属变化时：删除旧域子树 → 在新域重建 → 更新索引表。      │
│                                                         │
│  逐域处理完成后：从各域技术章节归纳跨域视图，写入根级         │
│  docs-overview.md 的技术全景章节（整体架构/技术栈/部署拓扑/   │
│  跨域数据流）。根级入口文档包含业务全景 + 技术全景两章节。     │
└─────────────────────────────────────────────────────────┘
```

### 2.5 组件关系图

```
                              ┌──────────────────────┐
                              │   opencode.json       │
                              │   (Agent 注册表)       │
                              │   sddu-docs: {        │
                              │     prompt: "{file:   │
                              │     .opencode/agents/ │
                              │     sddu-docs.md}"    │
                              │   }                   │
                              └──────────┬───────────┘
                                         │ 引用
                                         ▼
┌────────────────────────────────────────────────────────────────┐
│                    build-agents.cjs                             │
│  specialAgents: ['sddu', 'sddu-roadmap', 'sddu-tree',          │
│                  'sddu-docs'] ◀── 已存在，无需修改               │
│                                                                │
│  ┌──→ src/templates/agents/sddu-docs.md.hbs ←── 补全 §5       │
│  │                  │                                          │
│  │   build-agents.cjs 构建时复制到 dist/ → .opencode/agents/   │
│  │                                                             │
│  └──→ src/templates/outputs/docs/              ←── 新建    │
│       (内置模板库，详见 §3.3)                                │
│                   │                                             │
│   build-agents.cjs 构建时复制到 dist/templates/output/docs/  │
│   → 用户安装插件后可用 .opencode/plugins/sddu/templates/      │
│                     output/docs/                               │
└────────────────────────────────────────────────────────────────┘
                                         │
                                         │ 引用
                                         ▼
                              ┌──────────────────────┐
                              │  @sddu-docs Agent     │
                              │  (LLM 执行)           │
                              │                      │
                              │  扫描 → 提取 → 聚合   │
                              │  选择模板 → 渲染 → 落盘│
                              └──────────┬───────────┘
                                         │ 产出
                                         ▼
                              ┌──────────────────────┐
                               │ .sddu/docs-tree-root/ │
                               │ └── 子系统/模块/对象   │
                               │     (业务层级全景)     │
                              └──────────────────────┘
```

### 2.6 三 Agent 边界面

参考 spec FR-005 的 7 维度边界定义：

| 维度 | @sddu-docs | @sddu-tree | @sddu-roadmap |
|------|-----------|-----------|---------------|
| **扫描范围** | `.sddu/specs-tree-root/` 下 Feature 目录的 `spec.md` / `plan.md` / `state.json` | `.sddu/` 全部目录（文件列表、`.md` 简介、`.json` 元数据） | `.sddu/specs-tree-root/` Feature 目录（state.json/spec.md） + 用户新需求 |
| **不触碰区** | `TREE.md` 文件、`ROADMAP.md`、`.sddu/docs-tree-root/` 内部 TREE | Feature 产物内容（不修改 spec/plan/tasks，不语义解释） | `TREE.md` 文件、Feature 内部 plan.md/tasks.md 详细内容 |
| **输入** | Feature spec.md（目标/FR/用户故事）+ plan.md（架构/技术栈/依赖）+ state.json（版本/状态） | 目录结构 + 文件列表 + 文件前 20 行简介 | Feature state.json + spec.md 摘要 + 用户零散想法 |
| **输出** | `docs-tree-root/` 目录树（含逐级 `docs-overview.md` + 业务对象 `.md`） | `TREE.md`（各级目录导航，含文件简介和 phase 进度条） | `ROADMAP.md`（版本路线图 + Feature 优先级 + 时间表） |
| **消费方** | 用户（项目入职/架构决策）、其他 Agent（上下文参考） | 用户、SDDU 系统（自动触发） | 用户、`@sddu-spec`（版本归属） |
| **触发时机** | **手动**: `@sddu-docs`；**不参与** 8 Agent 执行后自动触发 | **自动**: 8 个主流程 Agent 完成；**手动**: `@sddu-tree [path]` | **手动**: `@sddu-roadmap` |
| **一句话区分** | 「系统**实际是什么**」—— 语义聚合当前产物为项目全景 | 「文件**在哪里**」—— 结构导航和文件简介 | 「系统**应该怎么走**」—— 版本规划和 Feature 优先级 |

### 2.7 docs-tree-xxx 目录规范

> 本节定义 `docs-tree-root/` 下每一级目录（下称 **docs-tree-xxx**）的结构。该结构是递归的 —— 根、子系统、模块，每一级遵循相同结构。

```
{业务名称}/                    ← docs-tree-xxx 目录
│
├── docs-overview.md           ← 【必选】本级入口：自身描述 + 内部组件关系
│
├── {子模块目录}/               ← 【可选 · 递归】子级目录，结构与本级相同
│   ├── docs-overview.md        （必选）
│   └── ...                     （其余文件由 LLM 从模板库按需选用）
│
└── ...                         ← 其他文件由 LLM 从模板库按需选用
```

> 每级必须包含 `docs-overview.md`，其余文件由 LLM 从模板库按需选用，不限层级。目录深度由业务结构决定，不强制固定。具体文件类型由 §3 模板库定义。
> 
> 根级 `docs-overview.md` 为单一入口，包含业务全景（子系统关系、Feature 索引）和技术全景（整体架构、技术栈、部署拓扑、跨域数据流）两章节。技术全景由逐域处理完成后从各域技术章节归纳生成。

---

### 2.8 输出结构设计示例

> `@sddu-docs` 的职责：扫描 `specs-tree-root/` 中各 Feature 的过程产物（spec.md / plan.md / state.json / ADR），提取关键信息聚合为结果文档，落入 `docs-tree-root/`。
>
> **核心设计**：`docs-tree-root/` 不是一份文档，而是一个**按业务层级组织的目录树**。每一级目录的入口文件统一命名为 `docs-overview.md`，负责回答两个问题：**本级是什么 + 本级内部组件之间的关系**。这一模式在所有层级递归重复 —— 子系统、模块、对象，皆如此。

#### 2.8.1 设计原则

| # | 原则 | 说明 |
|---|------|------|
| **P1** | **层级即导航** | 用户看 `docs-tree-root/` 的目录结构就能理解系统的子系统 → 模块 → 对象的层级组成，不需要打开任何文件 |
| **P2** | **每级一个 `docs-overview.md`** | 统一入口文件名。每个目录的 `docs-overview.md` 负责描述「本级实体是什么 + 子级组件之间的关系」 |
| **P3** | **递归自相似** | 根级 docs-overview 描述系统和子系统的关系；子系统 docs-overview 描述模块间的关系；模块 docs-overview 描述对象间的关系。结构相同，粒度不同 |
| **P4** | **版本聚合** | `specs-tree-root/` 中同一业务域的多个版本目录（如 user-domain 的 v1/v2）→ 在 `docs-tree-root/` 中聚合成一份当前态目录。版本号降级为元数据行，不作为目录名 |
| **P5** | **LLM 决定拆分或合并** | specs-tree 里拆成多个文件，docs-tree 中可以合并也可以进一步拆分，由 LLM 根据实际内容量和模板适用性决定，没有固定映射规则 |
| **P6** | **不越界** | `specs-tree-root/` 的目录是 SDDU 主流程的工作空间，不反向要求其组织方式。聚类依赖 LLM 对 spec.md 内容的语义理解，不依赖目录命名规范。Feature 目录名怎么取不影响聚类结果 |

#### 2.8.2 期望的输出结构（以电商系统为例）

```
.sddu/docs-tree-root/
│
├── docs-overview.md                         ← 根级
│   │                                          
│   │  描述：【系统自身】电商平台全景
│   │  描述：【子系统关系】
│   │    ┌─────────┐   用户身份  ┌──────────┐
│   │    │  用户域   │─────────▶│   订单域   │
│   │    │  (auth)  │           │ (orders)  │
│   │    └────┬─────┘           └─────┬─────┘
│   │         │ 用户数据、权限           │ 订单状态
│   │         ▼                        ▼
│   │    ┌─────────────────────────────────┐
│   │    │            商品域                │
│   │    │  (商品信息、库存、类目)           │
│   │    └─────────────────────────────────┘
│   │
│   ├── 用户域/                              ← 子系统级目录
│   │   ├── docs-overview.md
│   │   │
│   │   │  描述：【子系统自身】用户域
│   │   │        负责用户注册、身份认证、会话管理、权限控制。
│   │   │        版本: v2（聚合自 v1/v2）
│   │   │
│   │   │  描述：【模块关系】
│   │   │        认证模块 ──▶ 用户画像 ──▶ 权限管理
│   │   │            │            │
│   │   │            └── 会话管理 ◀┘
│   │   │
│   │   ├── 认证模块/
│   │   │   ├── docs-overview.md
│   │   │   │
│   │   │   │  描述：【模块自身】认证模块
│   │   │   │        JWT 签发/验证、OAuth2 集成、Token 刷新。
│   │   │   │
│   │   │   │  描述：【对象关系】
│   │   │   │        登录认证 ──▶ Token签发 ──▶ Token刷新
│   │   │   │            │                         │
│   │   │   │            └── 登出注销 ◀─────────────┘
│   │   │   │
│   │   │   ├── 登录认证.md
│   │   │   ├── Token签发.md
│   │   │   ├── Token刷新.md
│   │   │   └── 登出注销.md
│   │   │
│   │   ├── 用户画像/
│   │   │   ├── docs-overview.md
│   │   │   ├── 个人信息.md
│   │   │   └── 偏好设置.md
│   │   │
│   │   └── 权限管理/
│   │       ├── docs-overview.md
│   │       ├── 角色定义.md
│   │       ├── 权限绑定.md
│   │       └── 策略评估.md
│   │
│   ├── 订单域/
│   │   ├── docs-overview.md
│   │   │
│   │   │  描述：【子系统自身】订单域
│   │   │        订单创建、状态流转、支付集成、履约发货。
│   │   │        依赖：用户域（身份校验）、商品域（SKU 信息）
│   │   │
│   │   │  描述：【模块关系】
│   │   │        订单CRUD ──▶ 支付处理 ──▶ 履约发货
│   │   │            │            │
│   │   │            └── 购物车 ◀─┘
│   │   │
│   │   ├── 订单CRUD/
│   │   │   ├── docs-overview.md
│   │   │   ├── 订单创建.md
│   │   │   ├── 状态流转.md
│   │   │   └── 订单查询.md
│   │   │
│   │   ├── 支付处理/
│   │   │   ├── docs-overview.md
│   │   │   ├── 支付发起.md
│   │   │   ├── 回调处理.md
│   │   │   └── 退款管理.md
│   │   │
│   │   ├── 履约发货/
│   │   │   ├── docs-overview.md
│   │   │   ├── 发货单生成.md
│   │   │   └── 物流追踪.md
│   │   │
│   │   └── 购物车/
│   │       ├── docs-overview.md
│   │       ├── 购物车管理.md
│   │       └── 结算处理.md
│   │
│   └── 商品域/
│       ├── docs-overview.md
│       ├── 商品管理/
│       │   ├── docs-overview.md
│       │   ├── 商品信息.md
│       │   └── SKU管理.md
│       ├── 库存管理/
│       │   ├── docs-overview.md
│       │   ├── 库存扣减.md
│       │   └── 库存预警.md
│       └── 类目管理/
│           ├── docs-overview.md
│           └── 类目树.md
│
└── TREE.md                                   ← @sddu-tree 维护
```

#### 2.8.3 与 `@sddu-tree` 的边界

| 维度 | @sddu-docs | @sddu-tree |
|------|-----------|-----------|
| 产物 | `docs-tree-root/` 下的业务文档（`docs-overview.md` + 对象 `.md`） | `TREE.md` 文件 |
| 职责 | 语义聚合 — 描述业务层级和组件关系 | 结构导航 — 描述文件路径和 phase 状态 |
| 目录 | 创建/维护 `docs-tree-root/` 的业务目录树 | 只读扫描 `docs-tree-root/`，不修改其内容 |
| 关系 | @sddu-tree 扫描 docs-tree-root 的业务结构生成导航，不重复描述关系 | @sddu-docs 不生成 TREE.md，专注关系描述 |

#### 2.8.3 关键设计决策

| # | 决策 | 说明 |
|---|------|------|
| **D1** | **目录树即全景，不是文件内章节** | 单文件 5000 行 → 无人通读。目录结构用户一眼看透层级，按需点开 `docs-overview.md` 看关系，按需点开叶子文件看细节 |
| **D2** | **统一入口文件名 `docs-overview.md`** | 不叫 README（太泛），不叫 index（像代码）。`docs-overview.md` 语义明确：「这是这一级文档的全景入口」 |
| **D3** | **每级 docs-overview 做同一件事** | 自相似递归：根级描述子系统关系，子系统描述模块关系，模块描述对象关系。学会一级就学会所有级 |
| **D4** | **版本聚合，业务命名** | specs-tree 里 `order-domain-v3/` → docs-tree 里 `订单域/`。版本号和 Feature 目录名是过程信息，对结果读者是噪音 |
| **D5** | **拆分或合并由 LLM 决定** | specs-tree 的文件拆分方式不约束 docs-tree。内容多就拆，内容少就合，LLM 选最合适的模板即可，docs-overview 给关系导航 |
| **D6** | **每级都标注产物溯源** | §4 列出"本文档信息来自哪些原始文件"，读者想深入细节时知道去处。不丢信息，不替代原始文件 |
| **D7** | **语义聚类，不依赖目录名** | 业务域划分依据 spec.md 内容。无法归入其他域的 Feature 自成一级目录。首次聚类结果持久化，增量仅调整变更 Feature |

---

## 3. 模板库设计

> `@sddu-docs` 的输出文档不是凭空生成的 —— 它的格式和结构由**模板**控制。本章定义模板是什么、有哪些内置模板、LLM 如何选择模板、以及用户如何覆盖。

### 3.1 什么是模板

在 SDDU 体系中，**模板**是一个 **Handlebars（.hbs）文件**，它定义了一份输出文档的**结构骨架和格式约定**。Agent 在执行任务时读取模板，把提取到的实际内容填入模板中的占位符，渲染为最终的 `.md` 文档。

**模板由两部分组成**：

| 组成部分 | 说明 | 示例 |
|---------|------|------|
| **固定内容** | 不会变的章节标题、表格结构、说明文字 | `## 1. 自身概述`、`\| 属性 \| 值 \|` |
| **变量占位符** | `<<变量名>>`，由 Agent 在执行时替换为实际内容 | `<<entity_name>>` → `接口管理`，`<<responsibility>>` → `接收客户端请求...` |

**一个模板的例子**（`sddu-docs-overview.md.hbs` 的简化片段，参考 `sddu-spec.md.hbs` 模式）：

> ⚠️ 以下为**示意参考**，展示模板应有的元数据结构和 Handlebars 语法模式。最终模板由 §3.3 内置模板清单中的各 `.hbs` 文件定义，LLM 按需选用。

```handlebars
# <<entity_name>> — docs-overview

> **文档定位**: <<level_description>> — 包含业务全景 + 技术全景，描述本级实体自身 + 内部子组件间的关系  
> **数据来源**: 聚合自 specs-tree-root/<<feature_list>>  
> **创建人**: <<created_by，如 SDDU Docs Agent>>  
> **创建时间**: <<created_at，如 2026-07-05>>  
> **版本**: <<version，如 v1.0>>  
> **更新人**: <<updated_by，如 SDDU Docs Agent>>  
> **更新时间**: <<updated_at，如 2026-07-05>>  
> **更新说明**: <<change_description，如 增量更新 — 变更 Feature: FR-AUTH, FR-API>>

## 1. 业务全景

> 描述本级实体的业务职责、内部子组件及其关系。

### 1.1 自身概述

| 属性 | 值 |
|------|-----|
| **层级** | <<entity_level>> |
| **职责** | <<responsibility>> |
| **版本** | <<version>> |

### 1.2 内部组件

| 组件 | 关系说明 |
|------|---------|
<<#each children>>
| **<<name>>** | <<relation_description>> |
<<#else>>
| — | 本级无子组件 |
<</each>>

## 2. 技术全景

> 描述本级涉及的技术选型、架构决策和部署信息。

### 2.1 技术栈

| 技术 | 用途 |
|------|------|
<<#each tech_stack>>
| <<tech>> | <<purpose>> |
<<#else>>
| — | 无特殊技术依赖 |
<</each>>

### 2.2 关键 ADR

| ADR | 决策 | 影响范围 |
|-----|------|---------|
<<#each adrs>>
| ADR-<<id>> | <<decision>> | <<scope>> |
<<#else>>
| — | 本级无 ADR 记录 |
<</each>>

## 修订记录

| 生成时间 | 变更 Feature | 生成方式 | 修订人 |
|---------|-------------|:--:|--------|
| <<generated_at>> | <<changed_features>> | <<full_or_incremental>> | SDDU Docs Agent |
```

**模板在 SDDU 中的角色**：

| 与...的关系 | 说明 |
|-----------|------|
| **Agent 指令模板** | Agent 指令模板告诉 LLM **做什么**（工作流步骤）；产物模板告诉 LLM **输出长什么样**（格式骨架）。两者是独立的 `.hbs` 文件 |
| **Handlebars 引擎** | 使用标准 Handlebars 语法（`<<变量>>`、`#each`、`#if`），不引入自定义 helper |
| **LLM** | LLM 读取模板理解输出格式，提取信息，渲染填充。模板是 LLM 的"格式合同" |

### 3.2 模板设计原则

参考现有模板 `sddu-spec.md.hbs` 的设计模式：
- 每个模板文件**开头声明自己的定位**（`> **文档定位**: ...`），LLM 读开头即知用途
- 文件名直接反映定位，不需要目录层级做场景约束
- 模板之间是平等的，LLM 按内容匹配选择，不存在「基础/变体」的层级关系

### 3.3 内置模板清单

模板平铺在 `src/templates/outputs/docs/` 下：

> （示意，完整清单见下表）

```
src/templates/outputs/docs/
├── sddu-docs-overview.md.hbs      ← 每级入口文档
├── sddu-docs-api.md.hbs           ← 含 API 路由的文档
├── sddu-docs-data.md.hbs          ← 含数据模型的文档
├── ...
└── sddu-docs-command-tree.md.hbs  ← 命令树
```

| # | 名称 | 全景目标 | 模板文件 | 定位说明 |
|---|------|:--:|---------|---------|
| T1 | 全景入口 | 双 | `sddu-docs-overview.md.hbs` | 本级全景入口（每级必选）— 包含业务全景 + 技术全景，描述本级实体是什么 + 内部子组件间的关系 |
| T2 | 业务对象 | 业务 | `sddu-docs-object.md.hbs` | 业务对象详情 — 描述单个业务实体的职责、属性、关联关系、生命周期 |
| T3 | API 文档 | 业务 | `sddu-docs-api.md.hbs` | 含 API 路由的文档 — REST 端点、请求/响应 Schema、状态码 |
| T4 | 数据模型 | 业务 | `sddu-docs-data.md.hbs` | 含数据模型的文档 — 表结构、字段、索引、关联关系 |
| T5 | 前端页面 | 业务 | `sddu-docs-page.md.hbs` | 含前端页面的文档 — 路由、组件树、交互流程 |
| T6 | 业务流程 | 业务 | `sddu-docs-flow.md.hbs` | 含业务流程的文档 — 状态机、流转规则、异常路径 |
| T7 | 配置项 | 技术 | `sddu-docs-config.md.hbs` | 含配置项的文档 — 环境变量、开关、参数说明 |
| T8 | 第三方集成 | 技术 | `sddu-docs-integration.md.hbs` | 含第三方集成的文档 — 外部服务、回调、认证方式 |
| T9 | 部署信息 | 技术 | `sddu-docs-deploy.md.hbs` | 含部署信息的文档 — 拓扑、资源、CI/CD |
| T10 | 安全模型 | 技术 | `sddu-docs-security.md.hbs` | 含安全策略的文档 — 认证流程、授权矩阵、安全边界 |
| T11 | 领域事件 | 业务 | `sddu-docs-event.md.hbs` | 含领域事件的文档 — 事件类型、生产者、消费者、触发条件 |
| T12 | 导出符号表 | 技术 | `sddu-docs-export.md.hbs` | 含导出符号表的文档 — 类型定义、公共接口、使用示例 |
| T13 | 命令文档 | 业务 | `sddu-docs-command.md.hbs` | 含命令树的文档 — 参数说明、管道组合 |
| T14 | 依赖关系 | 双 | `sddu-docs-relation-deps.md.hbs` | 组件之间的依赖、调用链 |
| T15 | 数据流 | 双 | `sddu-docs-relation-flow.md.hbs` | 组件之间的数据流向、格式、转换 |
| T16 | 时序 | 双 | `sddu-docs-relation-sequence.md.hbs` | 组件之间的调用顺序、事件触发 |
| T17 | 关系矩阵 | 双 | `sddu-docs-relation-matrix.md.hbs` | 组件间的接口/能力对照 |
| T18 | ADR 索引 | 技术 | `sddu-docs-adr-index.md.hbs` | 汇总本级所有架构决策 |
| T19 | 产物溯源 | 双 | `sddu-docs-source.md.hbs` | 列出聚合了哪些原始文件 |
| T20 | 命令树 | 业务 | `sddu-docs-command-tree.md.hbs` | 该命令组的完整命令结构 |

### 3.4 模板选择机制

LLM 不预判项目类型，而是**按内容匹配选择模板**：

- 每个模板开头声明了自己的定位，LLM 读取声明后判断是否适用于当前内容
- T3~T13 是内容模板，LLM 根据特征选最合适的，同一内容可匹配多个，按需组合选用
- T14~T17 是关系描述模板，内容涉及组件间关系时选用
- T18~T20 是按需选用的独立模板
- 不合适就跳过，不存在「基础/变体」的强制层级

### 3.5 用户自定义覆盖

用户在 `.sddu/templates/agents/output/docs/` 下放置**同名模板文件**即可覆盖：

```
.sddu/templates/agents/output/docs/
├── sddu-docs-overview.md.hbs     ← 覆盖 T1
├── sddu-docs-api.md.hbs            ← 覆盖 T2
└── ...                           ← 要覆盖哪个就放哪个
```

- 按文件名匹配，不需要完整复制模板库
- EC-006：用户模板渲染失败 → 回退内置

### 3.6 模板库扩展

新增模板只需在 `docs/` 下新建 `.hbs` 文件，文件名体现定位，开头声明用途。LLM 自动发现并按内容匹配选择。 |

---

## 4. 方案对比

### 4.1 方案 A：Agent-Native 扫描（推荐）

**描述**：所有扫描、提取、聚合逻辑均通过 Agent 指令模板驱动。Agent 使用 `glob` / `read` / `grep` 工具逐 Feature 读取产物，LLM 理解 spec.md / plan.md 内容后语义提取关键信息，按输出模板结构聚合为目录树。增量更新通过对比根级文档中记录的 Feature mtime 实现。这是 SDDU 体系中所有 Agent 的通用模式。

| 维度 | 评估 |
|------|------|
| **优点** | ① 完全对齐 SDDU 所有其他 Agent 的工作模式，零学习成本；② 无需新增工具/脚本/中间格式，变更范围极小（仅模板文件）；③ LLM 天然具备语义理解能力，能自适应格式异常的 spec.md（EC-004）；④ 维护简单 — 所有逻辑在指令模板中，修改即生效；⑤ 符合 Non-Goals NG-003（不修改模板引擎） |
| **缺点** | ① 准确性依赖 LLM 理解和遵循指令模板的能力；② 大项目场景需逐域分批处理以控制上下文窗口；③ 输出格式一致性需模板约束 + review 验证双保险 |
| **预估工作量** | 6-8 小时（agent 模板补全 3h + 输出模板库 17 个模板 3h + ADR 文档 1h） |
| **风险** | **低-中**：LLM 幻觉可能导致聚合内容偏差，但可通过输出模板结构约束 + review 阶段验证来缓解 |

### 4.2 方案 B：混合缓存层

**描述**：在方案 A 基础上新增一个 `.sddu/docs-tree-root/.cache.json` 缓存文件，存储上次全量扫描的 Feature 列表、mtime、提取摘要。Agent 首次运行时执行全量扫描并写缓存，后续运行时读取缓存对比增量。缓存文件由 Agent 指令模板中定义的规则管理。

| 维度 | 评估 |
|------|------|
| **优点** | ① 增量更新更精确（缓存文件有结构化对比数据）；② 减少重复读取（缓存命中时跳过未变更 Feature 的 spec/plan 重读）；③ 缓存文件格式可控，便于下游程序化消费 |
| **缺点** | ① 引入新的缓存文件增加了维护复杂度；② 缓存过期/不一致需要额外的处理逻辑（如 Feature 被手动删除后缓存残留）；③ 缓存为 agent 进程中生成的 JSON，LLM 写入 JSON 的格式可靠性不如确定性脚本；④ 违反 NG-004 的精简原则 |
| **风险** | **中**：缓存文件可能因 LLM 写入格式不规范导致损坏或不一致，需要增加缓存验证和自动修复逻辑 |
| **预估工作量** | 8-10 小时（agent 模板 3h + 缓存逻辑设计 2h + 输出模板 1h + 场景变体 1h + ADR 1h） |

### 4.3 方案 C：构建脚本驱动

**描述**：创建 `scripts/build-docs.cjs` Node.js 脚本，用程序化方式扫描 Feature 目录、解析 state.json、读取 spec.md/plan.md 元数据，生成一个 `project-overview.json` 中间文件。Agent 只需读取该 JSON 并按模板渲染为 `PROJECT.overview.md`。脚本由 `@sddu-docs` 指令模板在第一步自动调用。

| 维度 | 评估 |
|------|------|
| **优点** | ① 扫描和提取逻辑完全确定、可单元测试；② 性能优于 LLM 逐文件读取（脚本批量操作）；③ JSON 中间格式可被多个下游消费 |
| **缺点** | ① 引入新的构建脚本，超出本次 Feature 范围；② 违反 NG-003（不修改模板引擎 / 构建基础设施）；③ script 需要维护 state.json 格式变更的兼容性（当前 state.json 格式不统一：有的用 `phase: 7` 数字，有的用 `phase: "specified"` 字符串）；④ Agent 与 Script 之间的耦合增加维护成本 |
| **风险** | **中-高**：构建脚本可能与未来 state.json 格式演进产生兼容性问题；脚本错误不易被 LLM Agent 诊断和修复 |
| **预估工作量** | 12-16 小时（script 开发 6h + agent 适配 2h + 测试 3h + 输出模板 1h + 场景变体 1h + ADR 1h） |

### 4.4 方案对比总览

| 维度 | 方案 A（Agent-Native） | 方案 B（混合缓存） | 方案 C（脚本驱动） |
|------|:--:|:--:|:--:|
| SDDU 模式对齐 | ✅ 完全一致 | ✅ 一致，额外缓存 | ❌ 引入新组件 |
| 实现复杂度 | 低 | 中 | 高 |
| 变更范围 | 最小（仅模板文件） | 中等（模板 + 缓存文件） | 大（新增脚本） |
| Non-Goal 合规 | ✅ | ✅ | ❌ 违反 NG-003 |
| 增量更新精度 | LLM 对比 mtime | 结构化缓存对比 | 脚本精确 diff |
| 可维护性 | 极高（模板即文档） | 中（需维护缓存逻辑） | 低（脚本 + 模板耦合） |
| 工作量 | 4-6h | 8-10h | 12-16h |

---

## 5. 推荐方案：方案 A — Agent-Native 扫描

### 5.1 选择理由

1. **SDDU 模式一致性**（权重高）：SDDU 所有 10 个已完成 Agent 均采用"指令模板驱动 LLM 执行"的模式。方案 A 完全复用这一模式，用户和下游 Agent 已有心智模型，无需额外学习。

2. **Non-Goal 合规**：方案 A 变更范围仅限模板文件（agent 指令模板 + output 产物模板），不引入新脚本或中间格式，严格对齐 NG-003（不修改模板引擎/构建基础设施）。

3. **维护成本最低**：agent 指令模板使用 Markdown 编写，自然语言描述的工作流程即文档本身。后端 Agent 行为修改只需编辑指令模板文本，无需重新编译/测试脚本。

4. **EC-004 自适应能力**：LLM 天然能处理格式不完全标准的 spec.md（如章节标题微调、表格列宽变化），而脚本方案需要精确的格式匹配或正则表达式，容错性差。

5. **历史对齐**：FR-TPL-001（模板质量统一）已在 v3.0.1 中完成 11 Agent 模板的格式统一和职责边界注入。本次 Feature 是在该基础上"补全最后一个占位 Agent"，应保持与已完成的 10 个 Agent 相同的技术路径。

---

## 6. 文件影响分析

### 6.1 源文件变更清单

| 操作 | 文件路径 | 说明 | 行数估算 |
|:--:|------|------|:--:|
| 🆕 NEW | `src/templates/outputs/docs/sddu-docs-overview.md.hbs` | 全景入口 | ~100 |
| 🆕 NEW | `src/templates/outputs/docs/sddu-docs-object.md.hbs` | 业务对象 | ~60 |
| 🆕 NEW | `src/templates/outputs/docs/sddu-docs-api.md.hbs` | 含 API 路由 | ~60 |
| 🆕 NEW | `src/templates/outputs/docs/sddu-docs-data.md.hbs` | 含数据模型 | ~60 |
| 🆕 NEW | `src/templates/outputs/docs/sddu-docs-page.md.hbs` | 含前端页面 | ~60 |
| 🆕 NEW | `src/templates/outputs/docs/sddu-docs-flow.md.hbs` | 含业务流程 | ~60 |
| 🆕 NEW | `src/templates/outputs/docs/sddu-docs-config.md.hbs` | 含配置项 | ~60 |
| 🆕 NEW | `src/templates/outputs/docs/sddu-docs-integration.md.hbs` | 含第三方集成 | ~60 |
| 🆕 NEW | `src/templates/outputs/docs/sddu-docs-deploy.md.hbs` | 含部署信息 | ~60 |
| 🆕 NEW | `src/templates/outputs/docs/sddu-docs-export.md.hbs` | 含导出符号表 | ~60 |
| 🆕 NEW | `src/templates/outputs/docs/sddu-docs-command.md.hbs` | 含命令树 | ~60 |
| 🆕 NEW | `src/templates/outputs/docs/sddu-docs-relation-deps.md.hbs` | 依赖关系 | ~40 |
| 🆕 NEW | `src/templates/outputs/docs/sddu-docs-relation-flow.md.hbs` | 数据流 | ~40 |
| 🆕 NEW | `src/templates/outputs/docs/sddu-docs-relation-sequence.md.hbs` | 时序 | ~40 |
| 🆕 NEW | `src/templates/outputs/docs/sddu-docs-relation-matrix.md.hbs` | 关系矩阵 | ~40 |
| 🆕 NEW | `src/templates/outputs/docs/sddu-docs-adr-index.md.hbs` | ADR 索引 | ~50 |
| 🆕 NEW | `src/templates/outputs/docs/sddu-docs-source.md.hbs` | 产物溯源 | ~40 |
| 🆕 NEW | `src/templates/outputs/docs/sddu-docs-command-tree.md.hbs` | 命令树 | ~40 |
| ✏️ MODIFY | `src/templates/agents/sddu-docs.md.hbs` | **指令模板补全** — 从 110 行占位骨架扩展为 ~300 行可执行模板。核心变更：§5（7 步工作流）、§6（输出模板选择）、§7（三 Agent 边界）、§8（EC-001~EC-011）、§9（示例对话） | +190 / -10 |
| 🆕 NEW | 运行时创建 | `.sddu/docs-tree-root/` 目录树（含子系统/模块/对象逐级目录 + 文件） | 由 @sddu-docs 运行时按需生成 |
| 🆕 NEW | `e2e/scripts/docs-agent/sddu-docs-e2e.sh` | **E2E 验证脚本** — 创建隔离测试项目 + 安装 SDDU 插件 + 生成 mock Feature 目录（3 个 Feature：完整/缺 plan/含 ADR）→ 供 validate Agent 层 B 使用 | ~80 |

### 6.2 无需变更的组件

| 组件 | 原因 |
|------|------|
| `build-agents.cjs` | 模板平铺于 `docs/` 下，现有 `readdirSync` + `filter *.hbs` 逻辑可直接处理，无需修改 |
| `opencode.json` | `sddu-docs` agent 已注册，无需修改 |
| `.sddu/docs-tree-root/` | 运行时按需创建，无需预置 |
| `sddu-roadmap.md.hbs` | 已知 §1 存在自相矛盾的职责声明（名称"版本规划专家"但写"不输出版本路线图"），因 NG-004 限制本次不修改，后续应单独修复 |

### 6.3 运行时产物（不由 build 管理）

| 文件 | 说明 |
|------|------|
| `.sddu/docs-tree-root/` 目录树 | @sddu-docs 执行时动态生成。不入仓库（建议 `.gitignore` — 非本次 scope） |

---

## 7. 风险评估

| # | 风险 | 概率 | 影响 | 缓解措施 |
|---|------|:--:|:--:|----------|
| **R1** | **LLM 对复杂指令遵循不稳定** — §5 工作流程 6 步骤在长上下文中可能被 LLM 跳过或乱序执行 | 中 | 中 | ① 指令模板使用 `### 步骤 N:` 明确编号，每步结尾标注 `→ 进入步骤 N+1`；② 每步设置前置检查（"确认上一步完成"）；③ 输出模板结构强制 LLM 按序填充 |
| **R2** | **state.json 格式不统一** — 当前 Feature state.json 存在两种格式：数字 phase（`phase: 7`）和字符串 phase（`phase: "specified"`），agent 需兼容两种格式 | 高 | 中 | ① 指令模板中列出两种格式的处理规则（优先取 `phaseHistory` 数组中最后一个 phase 的 status）；② 未识别的格式标注「格式异常」跳过；③ 不阻塞 — 继续聚合其他 Feature |
| **R3** | **增量更新 mtime 获取不可靠** — LLM 无法直接获取文件 mtime，需通过 bash 调用 `stat` 命令 | 中 | 低 | ① 指令模板明确定义 mtime 获取命令: `stat -c %Y <file>`；② LLM 解析命令输出为标准操作；③ mtime 对比失败时自动退化为全量更新 |
| **R4** | **大项目性能** — 目录树方案下全量读取所有 Feature 产物可能超上下文窗口 | 中 | 中 | 步骤 3 轻量预扫描（只读目标章节）+ 步骤 4~7 逐域迭代处理（每次只持有一个域的完整产物）。同一会话内完成，不跨调用 |
| **R5** | **模板渲染失败** — Handlebars 语法错误或用户自定义模板格式异常 | 低 | 中 | ① EC-006: 捕获异常，提示用户并回退内置模板；② 内置模板使用 `<<变量名>>` 占位符格式（与现有 7 个 output 模板一致），不引入新语法 |
| **R6** | **三 Agent 边界漂移** — 后续 Feature 可能模糊 @sddu-docs/@sddu-tree/@sddu-roadmap 的边界 | 中 | 中 | ① FR-005 边界在 3 个 Agent 指令模板的 §7 规则中明确定义（Nx4 互斥补充）；② 后续修改任何 Agent 边界时需跨 Agent 检查一致性 |
| **R7** | **多版本目录检测逻辑错误** — 若未来出现 `v1/`、`v10/` 子目录，字符串排序 `"v10" < "v2"` 导致取错版本 | 低 | 低 | ① 当前无版本子目录，风险为远期；② 指令模板指定用自然排序（按数字部分比较）；③ @sddu-docs 执行时可向用户展示所选版本供确认 |

---

## 8. 生成的 ADR

| ADR 编号 | 标题 | 状态 |
|:--------:|------|:--:|
| ADR-001 | Agent-Native 扫描方案选择 | PROPOSED |
| ADR-002 | @sddu-docs / @sddu-tree / @sddu-roadmap 辅助 Agent 边界定义 | PROPOSED |

> 详细内容见同级文件：
> - `ADR-001-agent-native-scanning-approach.md`
> - `ADR-002-three-agent-boundary-definition.md`

---

## 9. 产物审查策略

> 供 `@sddu-review` 阶段使用的产物清单和审查基准

| 审查产物 | 审查基准 |
|---------|---------|
| `src/templates/agents/sddu-docs.md.hbs`（变更后） | spec.md FR-001（工作流补全）/ FR-005（边界划分）/ FR-007（示例对话对齐）/ 11 Agent 模板骨架一致性（对齐 FR-TPL-001 标准） |
| `src/templates/outputs/docs/` 下 17 个模板（新建） | spec.md FR-002（输出内容结构）/ FR-004（产物落盘格式）/ NFR-002（Handlebars 兼容性）/ NFR-003（扩展机制标准化） |
| 模板加载优先级 | FR-006/FR-006a 运行时模板选择行为是否正确（用户自定义优先，按内容匹配选择） |

### 审查清单（逐项勾检）

| # | 检查项 | 对应 FR/EC |
|---|--------|:---:|
| C1 | §5 工作流程从占位变为分批可执行流程（轻量预扫描 + 逐域迭代），每步含操作指令 | FR-001 |
| C2 | 工作流程包含版本感知聚合逻辑 | FR-001(a2) |
| C3 | 输出为目录树结构，每级含入口文档，其余由模板库按需选用 | FR-002 |
| C4 | Agent 指令模板 §7 包含 7 维度三 Agent 边界表 | FR-005 |
| C5 | §6 输出模板节正确实现了 FR-006/FR-006a 按内容匹配选择逻辑 | FR-006, FR-006a |
| C6 | 模板库包含 17 个内置模板，LLM 按内容匹配选择 | FR-003 |
| C7 | 异常处理表覆盖 EC-001 ~ EC-011 全部场景 | FR-001(f) |
| C8 | 增量更新采用统一增量模式（首次=全量，后续=仅变更 Feature 子树） | FR-009 |
| C9 | 示例对话与 §5 工作流步骤一致 | FR-007 |
| C10 | §6 关于输出格式的描述由模板库定义，不写死固定格式 | FR-008 |
| C11 | Handlebars 语法使用标准 `#each`/`#if`/`<<变量名>>`，无自定义 helper | NFR-002 |
| C12 | 17 个模板文件遵循 `.hbs` 扩展名约定，可通过 build-agents.cjs 正常构建 | NFR-003 |

---

## 10. 产物验证策略

> 供 `@sddu-validate` 阶段使用的产物清单和验证基准。
>
> **核心思路**：SDDU 的验证应类比其他项目类型的真实验证 —— Java 项目启动应用调接口、前端项目启动 dev server 交互验证。SDDU 项目的"真实运行"就是：**在隔离项目中安装当前构建的 SDDU 插件，执行对应工作流，验证产物**。

### 10.1 验证分层

本 Feature 的产物是 Agent 指令模板 + Handlebars 输出模板。验证分两层：

| 层 | 内容 | 验证什么 | 依赖 | 可执行性 |
|:--:|------|------|------|:--:|
| **A** | 静态检查 | 模板可编译、Handlebars 语法正确、FR 覆盖完整 | 仅需 Node.js + grep | ✅ 本期可直接执行 |
| **B** | E2E 隔离运行 | `@sddu-docs` Agent 在隔离项目中对 mock Feature 执行扫描 → 模板选择 → 渲染 → 落盘，验证完整执行链路 | 需 Agent 模板已构建（build phase 输出）+ opencode task 工具 + LLM + install.sh | ✅ build phase 完成后可执行 |

层 A 是**必要条件**（不通过则产物无法交付），层 B 是**充分条件**（通过才代表产物在真实项目中真正可用）。

**与旧版的关键区别**：
- **旧版 v1.x**：要求"在当前项目上运行 @sddu-docs 来验证 @sddu-docs"→ 循环依赖，不可行
- **旧版 v2.0**：引入 fixture 隔离项目，但未解决 install.sh 依赖和 task 工具调用路径
- **本版 v2.1**：层 B 通过 `mktemp` 创建隔离项目 → `install.sh` 安装当前构建产物 → `task(sddu-docs)` 以绝对路径指定 mock Feature 目录 → 验证 docs-tree-root/ 输出。全程不污染当前项目的 `.sddu/`，Agent 按 prompt 中的绝对路径操作测试项目

---

### 10.2 层 A：构建 + 静态语法检查（10 项 · 可直接执行）

> 所有检查均可通过 `bash` + `grep` + `node` 命令执行，不依赖 LLM。

| # | 验证项 | 执行方法 | 预期 |
|:--:|------|------|------|
| A1 | **构建产物就绪** | `node scripts/build-agents.cjs` | exit 0；`dist/templates/agents/sddu-docs.md` 存在；`dist/templates/output/docs/` 下有 ≥16 个 `.hbs` 文件 |
| A2 | **`#each` 块闭合** | `for f in src/templates/outputs/docs/*.hbs; do open=$(grep -c '#each' "$f"); close=$(grep -c '/each' "$f"); [ "$open" != "$close" ] && echo "MISMATCH: $f"; done` | 无 MISMATCH 输出 |
| A3 | **`#if` 块闭合** | `for f in src/templates/outputs/docs/*.hbs; do open=$(grep -c '#if' "$f"); close=$(grep -c '/if' "$f"); [ "$open" != "$close" ] && echo "MISMATCH: $f"; done` | 无 MISMATCH 输出 |
| A4 | **无占位残留** | `grep -rn '待后续 Feature 定义' src/templates/agents/sddu-docs.md.hbs` | 0 处（`grep` 无匹配或 exit 1） |
| A5 | **工作流步骤连续** | `grep -oP '步骤 \d+' src/templates/agents/sddu-docs.md.hbs \| sort -u` | 1→7 连续（含步骤 1~7 全部） |
| A6 | **EC 全量覆盖** | `grep -oP 'EC-\d{3}' src/templates/agents/sddu-docs.md.hbs \| sort -u \| wc -l` | ≥11 项 |
| A7 | **输出模板齐全** | `ls src/templates/outputs/docs/sddu-docs-*.md.hbs \| wc -l` | 与 §3.3 模板清单数量一致 |
| A8 | **三 Agent 边界表存在** | `grep -c '@sddu-docs\|@sddu-tree\|@sddu-roadmap' src/templates/agents/sddu-docs.md.hbs` | ≥7 行（7 维度边界表） |
| A9 | **增量模式检测逻辑** | `grep -c 'mtime\|增量\|incremental\|stat' src/templates/agents/sddu-docs.md.hbs` | ≥3 处 |
| A10 | **模板引用一致性** | 对比 Agent 模板 §6 引用的模板文件名 ↔ `src/templates/outputs/docs/` 实际文件列表 | 1:1 匹配，无悬空引用 |

> **判定**：10/10 通过 → ✅ 层 A 通过。任一项失败 → ❌ 阻塞，不可进入层 B。

---

### 10.3 层 B：E2E 隔离运行验证（8 项 · build phase 完成后可执行）

层 B 验证 `@sddu-docs` Agent 在隔离测试项目中的完整执行链路：构建当前产物 → 安装到隔离项目 → 创建 mock Feature → Agent 扫描 → 模板选择与渲染 → 目录树落盘 → 增量更新。

#### 10.3.1 执行链路（7 步）

```
步骤 1: 构建当前产物
  cd <当前项目根目录>
  node scripts/build-agents.cjs
  → dist/templates/agents/sddu-docs.md         (Agent 编译产物)
  → dist/templates/output/docs/*.hbs           (输出模板编译产物)
  → install.sh 在后续步骤中引用这些产物

步骤 2: 创建隔离测试项目
  TEST_DIR="/tmp/sddu-validate-docs-$(date +%Y%m%d-%H%M%S)"
  mkdir -p "$TEST_DIR"
  mkdir -p "$TEST_DIR/.sddu/specs-tree-root"
  → TEST_DIR 与当前项目完全隔离，无文件污染

步骤 3: 安装 SDDU 插件到隔离项目
  bash install.sh "$TEST_DIR"
  → 从当前源码完整构建（npm install + build:agents + build:ts + package）
  → 安装到 $TEST_DIR/.opencode/plugins/sddu/
  → 复制 Agent 定义到 $TEST_DIR/.opencode/agents/
  → 生成 $TEST_DIR/opencode.json

步骤 4: 创建 Mock Feature（3 个 Feature，覆盖完整/缺 plan/含 ADR）
  按 §10.3.2 设计写入以下目录结构:
    $TEST_DIR/.sddu/specs-tree-root/
    ├── feature-auth/              ← 完整 Feature（spec + plan + ADR）
    │   ├── spec.md
    │   ├── plan.md
    │   ├── ADR-001-jwt-auth.md
    │   └── state.json
    ├── feature-api/               ← 完整 Feature（spec + plan）
    │   ├── spec.md
    │   ├── plan.md
    │   └── state.json
    └── feature-legacy/            ← 不完整 Feature（只有 spec，故意缺 plan）
        ├── spec.md
        └── state.json

步骤 5: 独立 opencode 进程执行 Agent（方案 B — 进程级隔离，v2.3 修正）

  设计说明：
  - **v2.2 缺陷**：使用 `--dir "$TEST_DIR"` 切换工作目录，但 `--dir` 只改变 Agent 进程的 CWD
    （`.sddu/specs-tree-root/` 的查找路径），**不改变** opencode 自身的插件加载路径。
    opencode 仍从当前项目（`/home/usb/wks/sddu`）加载 `.opencode/plugins/` 和 `opencode.json`，
    导致 Agent §4 的前置验证读取当前项目的 `.sddu/specs-tree-root/`（18 个真实 Feature），
    而非测试项目中仅有的 3 个 mock Feature。
  - **v2.3 修正**：`install.sh` 已将 SDDU 插件完整安装到 `$TEST_DIR/.opencode/plugins/sddu/`
    并生成了 `$TEST_DIR/opencode.json`。改为 `cd "$TEST_DIR"` 后启动 opencode，
    opencode 从测试项目根目录启动 → 加载测试项目的插件（含 sddu-docs Agent 定义）
    → Agent CWD 自然为测试项目根目录 → §4 前置验证看到的就是 3 个 mock Feature。
  - **核心区别**：`--dir` 只切换 Agent 工作目录（CWD，即文件操作的默认路径），
    `cd` 切换 opencode 的启动目录（决定插件加载路径 + Agent 工作目录）。
    插件目录的 `opencode.json` 是 Agent 定义（包括 §4 前置验证逻辑）的加载来源，
    必须通过启动目录切换才能实现真正的上下文隔离。

  validate Agent 通过 bash 工具执行（超时 300s，对齐 NFR-001 ≤120s 全量生成 + 缓冲）:
    cd "$TEST_DIR"
    response=$(opencode run \
      "扫描 .sddu/specs-tree-root/ 下的所有 Feature，
       生成项目全景文档到 .sddu/docs-tree-root/" \
      --agent sddu-docs \
      --model deepseek/deepseek-v4-pro \
      --auto \
      2>&1)

  关键参数：
  - `cd "$TEST_DIR"` — 切换到隔离项目根目录，确保 opencode 从该目录启动，
    加载 `$TEST_DIR/.opencode/plugins/sddu/` 下的插件和 `$TEST_DIR/opencode.json`
    （Agent 定义来源）；同时 Agent 的 CWD 即为测试项目，§4 检查命中 3 个 mock Feature
  - 注意：**不再使用 `--dir` 参数** — `cd` 已经同时设置了启动目录和 Agent CWD，
    无需重复指定（且 `--dir` 仍只影响 CWD 不影响插件加载）
  - `--agent sddu-docs` — 直接以 sddu-docs Agent 身份执行，接收上述消息作为用户输入
  - `--auto` — 自动批准权限（Agent 需 bash/write/read/glob），非交互模式必需
  - `--model deepseek/deepseek-v4-pro` — 与 Agent 定义一致
  - `2>&1` — 合并 stderr，确保 LLM 响应文本可被 grep 断言
  - `response` 变量存储完整终端输出，供步骤 6/7 中 B6/B8 断言匹配 Agent 响应文本

步骤 6: 验证输出（首次全量）
  按 §10.3.3 断言矩阵 B1~B5 逐项检查 $TEST_DIR/.sddu/docs-tree-root/

步骤 7: 增量验证 + 清理
  修改 $TEST_DIR/.sddu/specs-tree-root/feature-api/spec.md（追加一行注释触发 mtime 变更）
  再次执行步骤 5（Agent 应识别 docs-tree-root/ 已存在 → 增量模式）
  按断言 B6~B7 检查仅 feature-api 子树更新

  > ⚠️ 验证完成后**保留** `$TEST_DIR`，不自动删除。方便用户手动进入目录复核产物内容。
```

#### 10.3.2 Mock Feature 设计

> 以下内容由 validate Agent 在步骤 4 使用 `write` 工具直接创建。Feature 内容使用真实业务语义，使 Agent 能从中提取有意义的信息进行模板选择和聚合。

**Feature A — `feature-auth`**（完整 Feature：spec + plan + ADR）

`state.json`：
```json
{
  "feature": "feature-auth",
  "phase": "specified",
  "status": "tracked",
  "version": "v1.0",
  "phaseHistory": [
    {"phase": "specified", "status": "completed", "timestamp": "2026-06-01T10:00:00Z"}
  ]
}
```

`spec.md` 核心内容（~60 行）：
- FR 清单：JWT 签发/验证、OAuth2 第三方登录集成、Token 刷新机制、会话管理
- 用户故事：作为用户，我希望能用邮箱/密码注册并登录；作为管理员，我希望能管理用户角色和权限
- 目标：构建统一认证中心，支持多种登录方式，提供 Token 生命周期管理

`plan.md` 核心内容（~50 行）：
- 方案选择：方案 A（JWT 自签发）vs 方案 B（OAuth2 代理），推荐方案 A
- 技术栈：Node.js 18 + jsonwebtoken 9.x + bcrypt 5.x + Express 4.x
- 架构：无状态 JWT（access 15min + refresh 7d），Redis 黑名单缓存
- ADR-001：JWT 签发选择 HMAC-SHA256，理由：内网部署无需非对称加密开销

`ADR-001-jwt-auth.md`：
```markdown
# ADR-001: JWT 认证方案选择

## 状态
ACCEPTED

## 背景
需要统一的用户认证机制支持多系统 SSO。

## 决策
选择 JWT（HMAC-SHA256）+ refresh token 方案。

## 后果
- 优点：无状态、水平扩展友好、跨域支持
- 缺点：无法主动撤销单个 token（依赖短期过期 + 黑名单缓存缓解）
```

---

**Feature B — `feature-api`**（完整 Feature：spec + plan，无 ADR）

`state.json`：
```json
{
  "feature": "feature-api",
  "phase": "planned",
  "status": "tracked",
  "version": "v2.1",
  "phaseHistory": [
    {"phase": "specified", "status": "completed", "timestamp": "2026-05-15T09:00:00Z"},
    {"phase": "planned", "status": "completed", "timestamp": "2026-05-20T14:30:00Z"}
  ]
}
```

`spec.md` 核心内容（~50 行）：
- FR 清单：RESTful API 端点定义（CRUD for products）、请求参数字段校验、基于 token bucket 的限流策略、统一错误响应格式
- NFR：P99 延迟 ≤200ms，单实例 QPS ≥1000
- API 端点表：`GET /api/v1/products`、`POST /api/v1/products`、`GET /api/v1/products/:id`、`PUT /api/v1/products/:id`、`DELETE /api/v1/products/:id`、`GET /api/v1/health`

`plan.md` 核心内容（~50 行）：
- 技术栈：Express 4.18 + TypeScript 5.x + helmet + express-rate-limit + zod（请求校验）
- 部署拓扑：Nginx 反向代理 → PM2 cluster（4 worker）→ Express → 内存存储
- 中间件链：helmet → cors → rate-limiter → validator → handler

---

**Feature C — `feature-legacy`**（不完整 Feature：仅 spec，故意缺 plan.md）

`state.json`：
```json
{
  "feature": "feature-legacy",
  "phase": "discovered",
  "status": "tracked",
  "version": "v1.0",
  "phaseHistory": [
    {"phase": "discovered", "status": "completed", "timestamp": "2026-01-10T08:00:00Z"}
  ]
}
```

`spec.md` 核心内容（~30 行）：
- 自由文本描述（非标准章节，测试 EC-004 格式自适应）：「遗留订单模块负责管理系统中所有订单的创建、状态变更和历史查询。原本基于 PHP 单体架构，计划迁移到 Node.js 微服务。订单状态包括：待支付、已支付、配送中、已完成、已取消。该模块目前尚未进入 plan 阶段。」
- **不含 plan.md** —— 验证 EC-003（缺 plan 时标注但不崩溃）

---

#### 10.3.3 断言矩阵（B1~B8）

| 场景 | 输入条件 | 预期行为 | 验证方法 | 对应 |
|:--:|------|------|------|:--:|
| **B1** | 3 个 Feature，2 完整 + 1 缺 plan | `docs-tree-root/` 创建成功；根级 `docs-overview.md` 含 feature-auth、feature-api、feature-legacy 三个 Feature 的索引条目 | `grep -c 'feature-auth\|feature-api\|feature-legacy' "$TEST_DIR/.sddu/docs-tree-root/docs-overview.md"` → 3 | FR-001, FR-002, FR-004 |
| **B2** | feature-legacy 缺 plan.md | feature-legacy 子树存在但标注「缺失 plan.md」或类似标记，Agent 不崩溃不报错 | `grep -c '缺失.*plan\|missing.*plan' "$TEST_DIR/.sddu/docs-tree-root/" -r` → ≥1 | EC-003 |
| **B3** | feature-api plan.md 含技术栈描述（Express/TypeScript/helmet） | feature-api 子树使用了技术类模板渲染（如部署信息、配置项），文档含技术栈引用 | `grep -c 'Express\|TypeScript\|helmet' "$TEST_DIR/.sddu/docs-tree-root/" -r` → ≥2 | FR-003 |
| **B4** | feature-auth 含 ADR-001 | feature-auth 子树或根级文档含 ADR 索引引用（ADR-001 字样或 ADR 摘要） | `grep -c 'ADR-001\|JWT.*认证\|HMAC-SHA256' "$TEST_DIR/.sddu/docs-tree-root/" -r` → ≥1 | FR-003 |
| **B5** | 首次运行（docs-tree-root/ 原本不存在） | 产物含全量模式标记（如「全量生成」「首次构建」「full generation」） | `grep -ci '全量\|full\|首次.*生成\|initial' "$TEST_DIR/.sddu/docs-tree-root/docs-overview.md"` → ≥1 | FR-009 |
| **B6** | 二次运行（docs-tree-root/ 已存在，无 Feature 变更） | Agent 识别已有产物，进入增量模式，不重复生成（或输出标注「增量模式」「无变更」） | validate Agent 捕获 `opencode run` 输出到 `$response` 变量，`grep -ci '增量\|无变更\|skip\|unchanged' <<< "$response"` → ≥1 | EC-002 |
| **B7** | 二次运行 + 仅 feature-api spec.md 有变更 | 仅 feature-api 子树重新生成（mtime 更新），feature-auth 和 feature-legacy 子树内容不变（mtime 不变） | `find "$TEST_DIR/.sddu/docs-tree-root/" -name '*.md' -newer "$MARKER_FILE"` 返回的文件均在 feature-api 相关路径下 | FR-009, EC-009 |
| **B8** | 空项目（specs-tree-root/ 无任何 Feature 目录） | Agent 输出提示「无可分析的 Feature」并终止，不写入空文档 | `opencode run` 输出（`$response`）含终止提示（EC-001），`docs-tree-root/` 未被创建或不含业务文件 | EC-001 |

> **注意**：B5~B7 的验证依赖 LLM 输出文本的语义匹配（如「全量」「增量」等关键词），存在一定概率偏差。若关键词匹配失败但实际行为正确（文件时间戳验证通过），应视为通过。

#### 10.3.4 执行前置条件与可行性分析

| 条件 | 状态 | 说明 |
|------|:--:|------|
| Agent 模板已编译（build phase 完成） | ✅ 本期满足 | validate 在 build 之后执行，`dist/templates/agents/sddu-docs.md` 已就绪 |
| opencode `run` 子命令可用 | ✅ 本期满足 | opencode v24+ 支持 `opencode run --agent --auto --model` 非交互执行；通过 `cd "$TEST_DIR"` 切换启动目录使 opencode 加载测试项目插件（非 `--dir`，后者只设 CWD 不切换插件路径）；validate Agent 通过 `bash` 工具调用 |
| `install.sh` 可从当前源码构建 | ✅ 本期满足 | install.sh 读取当前项目 `scripts/build-agents.cjs` + `package.json`，构建产物即为本次 build phase 产出 |
| LLM 可调用 | ✅ 本期满足 | `opencode run` 启动独立进程，LLM 调用由 opencode 管理，与 validate Agent 会话隔离 |
| 磁盘空间充足（tmp 目录） | ✅ 预期满足 | mock Feature 文件总量 < 50KB |
| **无后续基础设施依赖** | ✅ | 不依赖外部数据库、消息队列、第三方 API |

> **结论**：层 B 所有 8 项断言均可在本期 validate 阶段执行。唯一前置条件是 build phase 已完成 Agent 模板编译 —— 这与 SDDU 工作流顺序天然吻合（validate 在 build 之后执行）。

---

### 10.4 验证结论判定

| 条件 | 通过标准 | 不通过行为 |
|------|------|------|
| 层 A（10/10） | 全部 10 项通过 | ❌ 阻塞 — 产物存在语法/结构缺陷，不可交付 |
| 层 B（8/8） | B1~B8 全通过 | ⚠️ 有条件通过 — 结构性断言失败需修复；LLM 输出波动导致的单项失败经人工复核后可豁免 |

> **最终判定**：层 A + 层 B 均达标 → ✅ **通过**。层 A 不通过 → ❌ **不可进入 build 阶段的后续流程**。

---

### 10.5 不在验证范围的事项

| 事项 | 原因 | 替代验证 |
|------|------|------|
| Agent 生成文档的内容质量（措辞准确性、完整性） | LLM 生成内容，无确定性断言标准 | 层 B 验证**结构性完整**（文件存在、关键词覆盖、模板使用正确） |
| NFR-001（首次全量耗时 ≤120s） | 依赖 LLM 响应速度 + 当前模型负载，非模板本身可控制 | —（性能测试需在受控环境中独立完成） |
| 语义聚类的业务准确性（Feature A 是否该归属「用户域」） | LLM 行为，不同模型/不同运行结果可能不同 | 层 B 只验证聚类产出了**某种**层级结构，不验证语义正确性 |
| NFR-003（新增模板自动发现） | 本 Feature 创建的是初始模板库，不包含模板添加后的增量行为 | 后续模板新增 Feature 中单独验证 |
| EC-011（多版本目录 v1/v2 处理） | mock Feature 设计为单版本（无 v1/v2 子目录），EC-011 为远期场景 | 在多版本 mock 可用后补充 |
## 修订记录

| 版本 | 变更说明 | 日期 | 修订人 |
|------|---------|------|--------|
| v1.0 | 初始创建 — 架构分析、三方案对比、推荐方案 A、2 个 ADR、9 验证场景 | 2026-07-04 | SDDU Plan Agent |
| v1.1 | 新增 §2.6 输出模板设计示例 — 以假设电商系统展示 arc42 §5 白盒/黑盒递归分解；更新 §2.2/§5.1 输出模板描述为 arc42 术语；修正基础模板行数估算 120→150 | 2026-07-04 | SDDU Plan Agent |
| v1.2 | **重写 §2.6** — 移除越界的假设 `specs-tree-root/` 目录树设计；改为以当前项目真实 Feature 为输入，展示输出模板如何把平铺结构组织为 arc42 §5 嵌套属性块；核心修正：输出模板只设计 `docs-tree-root/PROJECT.overview.md` 的章节，不碰 `specs-tree-root/` 的目录；新增 D4 设计决策（"业务对象"不再强求） | 2026-07-04 | SDDU Plan Agent |
| v1.3 | **输出重构为目录树** — 新增 §2.6 docs-tree-xxx 目录规范；§2.7 以电商示例展示；产物模板从 1 变 4；删除场景变体；§5.1 重写 | 2026-07-05 | SDDU Plan Agent |
| v1.4 | **重构 §2 结构** — §2.1 纯现状描述（去除 ⚠️/设计标签），新增 §2.2 现状问题表；新增 §2.7.5 模板库设计（嵌套目录：base/web/lib/cli）；全文编号顺延 | 2026-07-05 | SDDU Plan Agent |
| v1.5 | **模板库扁平化** — 从 `base/web/lib/cli` 嵌套目录 → 10 个模板平铺于 `docs/` 下；命名规则 `sddu-docs-{类型}[-{场景}].md.hbs`；§2.7.5/§2.4/§4.2/§5.1 同步更新 | 2026-07-05 | SDDU Plan Agent |
| v1.6 | **模板库提升为独立 §3** — 新增 §3.1 "什么是模板"；§3~§9 顺延为 §4~§10 | 2026-07-05 | SDDU Plan Agent |
| v1.7 | **对齐专家裁定（一期目录树）** — §2 清除单文件残留；§3 模板库恢复嵌套目录；§4~§7 路径/数字/引用对齐；ADR-001/002 同步；build-agents 列入变更 | 2026-07-05 | SDDU Plan Agent |
| v1.8 | **P0-2 聚类算法** — 新增 §2.4 步骤 3 业务层级推导（LLM 语义聚类 + 首次持久化）；新增 D7；更新 P6 | 2026-07-05 | SDDU Plan Agent |
| v1.9 | **§3 模板库重构** — 参考 sddu-spec.md.hbs：模板开头声明定位、文件名即语义、扁平目录、按内容匹配选择；同步 §4.2/§5.1/§5.2/§6.2 | 2026-07-05 | SDDU Plan Agent |
| v2.0 | **§10 产物验证策略重写** — 三层验证体系（A 构建语法 / B E2E 隔离运行），新增 Mock Feature 隔离测试项目，消除循环依赖和项目污染风险；§6.1 追加 docs-agent fixtures 文件清单 | 2026-07-05 | SDDU Plan Agent |
| v2.1 | **§10 产物验证策略重写（v2）** — 层 A 10 项静态检查（可直接执行，仅需 Node.js + grep）；层 B E2E 隔离验证（mktemp → install.sh → task(sddu-docs) 绝对路径 → 增量验证 → 清理），含 3 个 mock Feature 完整设计（完整/缺 plan/含 ADR）和 8 项断言矩阵 B1~B8，明确本期可执行性和前置条件；§6.1 追加 e2e/scripts/docs-agent/sddu-docs-e2e.sh 入口 | 2026-07-05 | SDDU Plan Agent |
| v2.2 | **§10.3.1 步骤 5 修复** — 设计缺陷修正：`task(sddu-docs)` 在**当前** opencode 会话执行会导致 Agent §4 前置验证扫描当前项目的 `.sddu/specs-tree-root/`（18 个 Feature），而非隔离项目的 3 个 mock Feature，即便 prompt 中明确指定 `$TEST_DIR` 绝对路径也无法绕过 Agent 模板硬编码的 CWD 检查；改为 `opencode run --dir $TEST_DIR --agent sddu-docs --auto` **方案 B（独立进程）**，利用 `--dir` 切换进程工作目录实现真正的上下文隔离，Agent 仅看到测试项目的 `.sddu/specs-tree-root/`；B6/B8 断言验证方法 + 可行性表同步更新 | 2026-07-05 | SDDU Plan Agent |
| v2.3 | **§10.3.1 步骤 5 二次修正** — v2.2 使用 `--dir` 切换工作目录，但 `--dir` 只设置 Agent CWD 不改变 opencode 插件加载路径；`install.sh` 已将 SDDU 插件安装到 `$TEST_DIR`，opencode 必须从 `$TEST_DIR` 启动（`cd "$TEST_DIR"`）才能加载该目录下的 `.opencode/plugins/sddu/` 和 `opencode.json`；步骤 5 说明文字补充「插件加载路径 vs 工作目录」区别；可行性表同步更新 | 2026-07-05 | SDDU Plan Agent |
| v2.4 | **§10.3.1 步骤 2/7 修正** — 步骤 2：TEST_DIR 由 `mktemp -d /tmp/sddu-docs-test-XXXXXX`（随机后缀，用户无法定位）改为固定路径 `"/tmp/sddu-validate-docs-$(date +%Y%m%d-%H%M%S)"`，用时间戳避免多实例冲突；步骤 7：移除 `rm -rf "$TEST_DIR"` 自动删除，补充说明验证完成后保留目录供用户手动复核产物内容 | 2026-07-05 | SDDU Plan Agent |
