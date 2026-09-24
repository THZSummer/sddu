# 技术计划：Roadmap 模板结构重构 v2（概览 / 详情分层）

> **文档定位**: SDDU 技术方案 — 记录架构设计、方案对比和 ADR，作为 tasks 阶段的输入  
> **前置依赖**: spec.md（需求规范 v1.0，12 FR / 8 NFR / 10 EC）、discovery.md（D1~D5 决策，v1.0 零待澄清）、FR-ROADMAP-TPL-001（v4.1.0 的 zone/entry 标记与合并机制）  
> **创建人**: SDDU Plan Agent  
> **创建时间**: 2026-09-24  
> **版本**: v1.0  
> **更新人**: SDDU Plan Agent  
> **更新时间**: 2026-09-24  
> **更新说明**: 初始创建 — 落定「纯模板双端重构」总方案（零运行时代码）；给出旧→新 zone 映射、8 章分层结构、每章 Mermaid 章首图落位、依赖风险三主体归属规则、P-xxx/PR-xxx 登记制与非破坏迁移策略；产出 3 个 ADR（结构分层 / zone 模式分配 / Mermaid 章首图）；含验证场景 V-01~V-10

## 1. 前置检查
> 启动技术规划前必须验证的前置条件

| 检查项 | 状态 |
|--------|:--:|
| spec.md 存在 | ✅（`.sddu/specs-tree-root/specs-tree-roadmap-structure-v2/spec.md`，193 行；12 FR / 8 NFR / 10 EC） |
| discovery 决策闭合 | ✅（D1~D5 已拍板，零待澄清；OP 无移交项） |
| 外部 API 文档缓存 | ⚠️ 不适用（纯模板 / 指令改造，不引用任何外部服务） |
| 前置依赖已满足 | ✅（FR-ROADMAP-TPL-001 / v4.1.0 已 `validated`；zone / entry + mode 机制可直接复用） |
| 工作分支 | ✅ `feature/roadmap-structure-v2`（禁止切 main、禁止合入 main） |
| 工程边界确认 | ✅ README「项目约束（Agent 必读）」：实现目标限于 `src/`；`.opencode/`（安装产物）、`.sddu/`（流程产物）不得列为实现目标 |

**本次规划的核心事实（源码级核对）**：

1. `src/templates/outputs/sddu-roadmap.md.hbs` 当前 **98 行**（旧 8 H2 / 9 zone = 6 rewrite + 3 preserve），是全量重写对象。
2. `src/templates/agents/sddu-roadmap.md.hbs` 当前 **412 行**（含修订记录至 v3.1.4），按 §5 / §5.4 / §5.5 / §5.7 / §8 / 修订记录定向改造。
3. `scripts/build-agents.cjs:158-185` 对 `src/templates/outputs/` 做 `readdirSync({recursive:true})` → `.hbs` 过滤 → `copyFileSync` **裸拷贝**；`specialAgents`（含 `sddu-roadmap`，`:145-156`）对 agent 模板**原样写出**。→ **`scripts/` 零改动**，构建脚本自动覆盖（延续 ADR-003 Agent-Native 路线）。
4. 旧结构基线产物：`docs/roadmap-rewrite:.sddu/ROADMAP.md` 为 **275 行**、含 9 个旧 zone（`meta` / `vision` / `version-overview` / `feature-index` / `priority` / `version-plan` / `dependencies-risks` / `next-actions` / `revision-log`）——作为 §8 V-05 沙箱演练的输入素材（`git show` 拷 `/tmp`，不触碰工作区）。

## 2. 架构分析
> 分析现有架构影响和需要的新组件

### 2.1 总方案：纯模板双端重构（零运行时代码）

本 Feature **不新增 / 不修改任何运行时代码**，改动面严格限于 **2 个 `src/` 模板文件**：

| 端 | 文件 | 操作 | 核心内容 |
|----|------|:--:|---------|
| 产物端 | `src/templates/outputs/sddu-roadmap.md.hbs` | **全量重写** | 8 章新结构 + 8 content zone（3 rewrite + 5 preserve）+ 3 张清单表 + 3 类详情 entry + 8 个 Mermaid 骨架 + 8 条编写期说明 + NOTE 块；元数据头 12 字段与 H1 逐字不变 |
| 指令端 | `src/templates/agents/sddu-roadmap.md.hbs` | **定向改造** | §5 章节定义表 / §5.4 zone 清单与合并语义（含旧 zone 迁移提示）/ §5.5 各章语义 + 信息归属判定表 + P/PR 编码规则 / 修订记录 bump v3.2.0 / §8 异常处置增补 |

`scripts/` 零改动（§1-3）；`.opencode/`、`.sddu/` 不作为变更目标（NG-005）。

### 2.2 旧 → 新 zone 映射表（结构重构的权威映射）

> 旧结构 = 6 rewrite + 3 preserve（9 content zone）；新结构 = 3 rewrite + 5 preserve（8 content zone）。**zone id 全部换代**（除 `meta` / `vision` / `revision-log` 沿用），语义按「三主体 × 两层粒度」重新切分。

| # | 旧 zone id | 旧 mode | 旧章节 | → | 新 zone id | 新 mode | 新章节 | 处理语义 |
|---|-----------|:--:|--------|---|-----------|:--:|--------|---------|
| 0 | `meta` | rewrite | 元数据头 | → | `meta` | rewrite | 元数据头 | 沿用（12 字段不变） |
| 1 | `vision` | rewrite | §1 项目愿景与定位 | → | `vision` | rewrite | §1 项目愿景与定位 | 沿用 |
| 2 | `version-overview` | rewrite | §2 版本总览 | → | `version-list` | rewrite | §2 版本清单 | 重命名 + 表结构改 6 列 |
| 3 | `feature-index` | rewrite | §3 特性索引 | → | `feature-list` | rewrite | §3 特性清单 | 重命名 + 表结构改 5 列（类型列含提案） |
| 4 | `priority` | rewrite | §4 优先级（RICE Top N） | → | ❌ **删除** | — | — | RICE / Top N 淘汰（FR-005）；P0/P1/P2 降为 §6 entry 字段 |
| 5 | `version-plan` | preserve | §5 版本规划详述 | → | `version-detail` | preserve | §5 版本详情 | 重命名 + entry 字段重构（含「风险与依赖」） |
| 6 | `dependencies-risks` | rewrite | §6 依赖与风险 | → | ❌ **删除** | — | — | 分流三主体（FR-004）：版本级→§5 / 特性级→§6 / 项目级→§4·§7 |
| 7 | `next-actions` | preserve | §7 下一步行动 | → | `issue-list` | preserve | §4 问题清单 | **语义重构**：待办清单 → 问题台账（P-xxx，六列表，保留既有内容防丢） |
| 8 | `revision-log` | preserve | §8 修订记录 | → | `revision-log` | preserve | §8 修订记录 | 沿用（恒为末位 H2） |
| — | （无） | — | — | → | 🆕 `feature-detail` | preserve | §6 特性详情 | 新增：特性 / 提案 entry（键 = Feature ID 或 PR-xxx） |
| — | （无） | — | — | → | 🆕 `issue-detail` | preserve | §7 问题详情 | 新增：问题 entry（键 = P-xxx） |

> **新 zone 排序（产物内出现顺序）**：`meta` → `vision` → `version-list` → `feature-list` → `issue-list` → `version-detail` → `feature-detail` → `issue-detail` → `revision-log`。删除 2 个旧 zone（`priority` / `dependencies-risks`）、重命名 3 个（`version-overview`→`version-list`、`feature-index`→`feature-list`、`version-plan`→`version-detail`）、语义重构 1 个（`next-actions`→`issue-list`）、新增 2 个（`feature-detail` / `issue-detail`）、沿用 3 个（`meta` / `vision` / `revision-log`）。**旧 zone 识别清单（FR-012 迁移提示用）**：`next-actions` / `version-overview` / `priority` / `dependencies-risks` / `version-plan` / `feature-index`。

### 2.3 数据流变更

```
[用户/调度] → @sddu-roadmap
   │ 读 agent 指令 §6（两级查找声明，不变）
   ├─① .sddu/templates/agents/output/sddu-roadmap.md.hbs   （用户自定义，优先）
   └─② .opencode/plugins/sddu/templates/output/sddu-roadmap.md.hbs（内置兜底 ← src/ 经构建下发）
   │ 读模板 → 按 zone 标记区分 重写区(3) / 保留区(5)
   │ 读 既有 .sddu/ROADMAP.md → 解析 zone/entry 快照
   │   ├─ 含旧 zone id → 判定「旧结构」→ 不静默重写，输出迁移提示（FR-012）
   │   └─ 无任何标记 → 判定「非模板结构」→ 不修改文件（EC-001）
   │ 扫描 specs-tree-root/*/state.json + 用户输入 → 刷新重写区 + 生成保留区候选
   │ 合并（rewrite 全量替换 / preserve 键控 upsert+保留）
   └→ 写回 .sddu/ROADMAP.md（唯一产物，携带 zone/entry 标记 + 各章 Mermaid 图）
```

### 2.4 依赖关系图

```mermaid
flowchart LR
  SRC["src/templates/outputs/sddu-roadmap.md.hbs<br/>（全量重写：8 章 / 8 zone）"]
  AGT["src/templates/agents/sddu-roadmap.md.hbs<br/>（§5 / §5.4 / §5.5 / §8 / 修订记录）"]
  BA["scripts/build-agents.cjs<br/>（零改动，裸拷贝）"]
  DIST["dist/templates/output/sddu-roadmap.md.hbs<br/>+ dist/templates/agents/sddu-roadmap.md"]
  OC[".opencode/plugins/sddu/templates/output/<br/>（安装产物，非本 Feature 目标）"]
  RM[".sddu/ROADMAP.md<br/>（产物，本 Feature 不重排）"]
  SRC --> BA --> DIST --> OC
  AGT --> BA
  OC -.运行时读取.- AGT
  AGT -.渲染+合并.-> RM
```

### 2.5 变更边界

| 类别 | 内容 |
|------|------|
| 修改 | 2 个设计态模板文件（`src/templates/outputs/sddu-roadmap.md.hbs` 全量重写 + `src/templates/agents/sddu-roadmap.md.hbs` 定向改造） |
| 不变 | `scripts/`（裸拷贝自动覆盖）、`src/**/*.ts`、`package.json`（零运行时代码）、其他 **30** 个输出模板、其他 **10** 个 Agent 指令、`.opencode/`、`.sddu/ROADMAP.md` |

## 3. 方案对比
> 3 个可行方案的对比分析

### 方案 A：纯模板双端重构（零运行时代码）— 推荐
- **描述**：只改 2 个 `src/` 模板（产物端 + 指令端），复用 v4.1.0 既有 zone/entry 标记与合并机制；新结构通过「8 章 + 8 zone + 每章 Mermaid 图」在**模板文本**中完全表达，由 LLM 依指令渲染。
- **优点**：工程边界最小（2 文件）、零运行时代码、无新增依赖、与既有 Agent-Native 机制同构；构建脚本递归裸拷贝自动覆盖；回滚 = 2 文件 revert。
- **缺点**：结构与图的正确性依赖 LLM 依指令执行，无编译期保证；Mermaid 语法需静态 + 沙箱双重校验。
- **风险**：中（LLM 遵守度 / Mermaid 语法）→ 由 §5 判定表 + §5.4 结构校验 + §8 异常表 + V-01~V-10 兜底。
- **工作量**：M（~1 人日）

### 方案 B：运行时代码渲染 + 图生成（新增脚本 / TS 模块）
- **描述**：新增脚本负责按新结构渲染骨架、注入 Mermaid 图、合并保留区，agent 只填语义内容。
- **优点**：结构与图完全确定、可单测、可 CI 回归。
- **缺点**：① 内容生成本质是 LLM 语义工作，会退化为「脚本骨架 + LLM 填充」混合体；② 突破工程边界（新增 `scripts/` 资产并进入分发/安装链路，触碰 `.opencode/`）；③ 与现状矛盾（`scripts/generate-tree.cjs` 缺失的既有反证）；④ 违反 NG-006（零运行时代码）。
- **风险**：中高（范围蔓延 / 维护断链）。
- **工作量**：L（≥2 人日）

### 方案 C：单层 8 章微调（保留独立依赖风险章，仅加图）
- **描述**：不引入「概览 / 详情分层」，保留旧章序，仅补 Mermaid 图与删 RICE。
- **优点**：改动最小、迁移成本最低。
- **缺点**：Q-001（横切杂物箱）/ Q-002（双时间轴）/ Q-004（依赖风险破坏三主体闭合）均无法消解；与 D1~D4 拍板结论正面冲突。
- **风险**：高（未解决任何核心问题）。
- **工作量**：S

### 方案对比总览

| 维度 | 方案 A（推荐） | 方案 B | 方案 C |
|------|:--:|:--:|:--:|
| 工程边界合规 | ✅ 仅 2 文件、零代码 | ❌ 需动 `scripts/` 与分发链路 | ✅ 仅 2 文件 |
| 核心问题消解（Q-001~Q-006） | 高（三主体分层 + 图） | 高 | 低 |
| 与 D1~D4 决策一致 | ✅ | ✅ | ❌ |
| 与既有 Agent-Native 机制一致性 | 高 | 低 | 高 |
| 实施成本 | M | L | S |
| 主要失败模式 | LLM 忽略指令 / Mermaid 语法（可检测） | 范围蔓延 / 维护断链 | 问题未解决 |

## 4. 推荐方案
> 推荐方案及选择理由

**推荐**：方案 A — 纯模板双端重构（零运行时代码）
**理由**：① 与 D1~D5 全部决策一致，直接消解 Q-001~Q-006；② 严格守住工程边界（仅 2 个 `src/` 文件、零运行时代码，NFR-006）；③ 复用 v4.1.0 既有 zone/entry 机制，不重造合并算法（NG-003），不引入第二套心智模型；④ 构建脚本递归裸拷贝自动覆盖，`scripts/` 零改动；⑤ 失败模式可静态 grep + 沙箱演练双重检测。方案 B 触碰工程边界且与零代码路线冲突；方案 C 与拍板决策正面冲突，未解决任何核心问题。

### 4.1 8 章分层结构与 zone 分配（FR-001 / FR-002 / FR-003）

| # | H2 章节 | zone id | mode | 层级 | 章首 Mermaid 图 |
|---|---------|---------|:----:|------|----------------|
| 1 | 项目愿景与定位 | `vision` | rewrite | 首尾 | 定位图 |
| 2 | 版本清单 | `version-list` | rewrite | 清单层 | 版本时间线 |
| 3 | 特性清单 | `feature-list` | rewrite | 清单层 | 特性状态分布 |
| 4 | 问题清单 | `issue-list` | preserve | 清单层 | 问题类型分布 |
| 5 | 版本详情 | `version-detail` | preserve | 详情层 | 版本-特性-问题关系图 |
| 6 | 特性详情 | `feature-detail` | preserve | 详情层 | 特性归属图 |
| 7 | 问题详情 | `issue-detail` | preserve | 详情层 | 问题归属图 |
| 8 | 修订记录 | `revision-log` | preserve | 首尾 | 修订时间线 |

> 8 content zone（3 rewrite + 5 preserve）+ `meta`（不计入 8，见 FR-010）；「修订记录」恒为最后一个 H2。**分层设计要点**：概览层（§2/§3/§4 清单）是「rewrite 投影 + preserve 台账」的混合层，详情层（§5/§6/§7）全 preserve 键控——清单层粗表可随扫描整体重建，详情层的观点与台账需被保护（决策见 ADR-002）。

### 4.2 章首 Mermaid 图落位与设计（FR-003 / NFR-005）

**落位规则**：每章恰 1 个 ` ```mermaid ` 块，位于**该 chapter 对应的 zone 内顶部**：

- `rewrite` 区（`vision` / `version-list` / `feature-list`）：图在 zone-open 之后、表格 / 正文之前，**随区整体重建**；
- `preserve` 区（`issue-list` / `version-detail` / `feature-detail` / `issue-detail` / `revision-log`）：图在 zone-open 之后、**首个 entry 之前**（entry 外、zone 内），**随区逐字保留**、静态演进。

**图设计（每图 ≤10 行，`mermaid` 围栏，节点名无空格陷阱）**：

| 章节 | 图类型 | 表达内容 |
|------|--------|---------|
| §1 定位 | `flowchart LR` | 项目 → 目标用户 → 长期价值（3 节点链） |
| §2 版本清单 | `flowchart LR` | 版本时间线（vN → vN+1 顺序链） |
| §3 特性清单 | `pie` | 特性 / 提案 状态分布 |
| §4 问题清单 | `pie` | 问题类型分布（问题 / 技术债 / 文档债 / 风险 / 依赖 / 决策） |
| §5 版本详情 | `flowchart LR` | 版本 - 特性 - 问题 归属关系 |
| §6 特性详情 | `flowchart LR` | 特性 / 提案 → 版本归属 + 关联问题 |
| §7 问题详情 | `flowchart LR` | 问题 → 归属主体（版本 / 特性 / 项目级） |
| §8 修订记录 | `flowchart LR` | 修订时间线（vN → vN+1） |

**语法护栏（NFR-005）**：节点标识符使用无空格英文 / 短横线（如 `V100` / `F_RDSTRUCT`）；节点标签若含中文或空格一律用引号包裹（`V100["v1.0.0 发布"]`）；图行数 ≤10；` ```mermaid ` 与闭合围栏必须配对。图损坏时退化为代码块、不阻塞正文（EC-007）。

### 4.3 依赖 / 风险三主体归属规则（FR-004 / NFR-008）

| 归属层级 | 判定条件 | 承载位 | 形式 |
|---------|---------|--------|------|
| 版本级 | 依赖 / 风险指向某个具体版本（影响该版本交付） | §5 版本详情 | 对应版本 entry 的「风险与依赖」字段 |
| 特性级 | 依赖 / 风险指向某个具体特性 / 提案（影响该条目实现） | §6 特性详情 | 对应 entry 的「风险与依赖」字段 |
| 项目级 | 无法归属任何具体版本或特性（跨版本 / 全局性） | §4 问题清单 + §7 问题详情 | 类型枚举 = `风险` / `依赖` 的 P-xxx 条目 |

> 判定顺序（可判定、防漂移）：先问「是否影响某具体版本」→ 是则版本级；否则问「是否影响某具体特性 / 提案」→ 是则特性级；否则项目级。**不存在独立的「依赖与风险」章**；同一依赖 / 风险**只登记一处**，跨层引用用锚点（EC-008）。

### 4.4 清单层表结构 / 详情层 entry 结构（FR-008 / FR-009）

**清单层**：
- §2 版本清单（6 列）：版本 / 主题 / 时间窗 / 状态 / 特性数 / 开放问题数
- §3 特性清单（5 列）：Feature ID / 名称 / 类型[特性·提案] / 状态 / 版本归属
- §4 问题清单（6 列）：ID / 类型 / 摘要 / 影响 / 归属 / 状态

**详情层 entry**（`entry` 仅用于 `mode="preserve"` 区）：
- §5 版本详情（键 = 版本号）：目标 / 关联特性 / 关联问题 / 里程碑 / 风险与依赖
- §6 特性详情（键 = `Feature ID` 或 `PR-xxx`）：定位 / 优先级 / 版本归属 / 关联问题 / 状态与去向 / 详档锚点 / 风险与依赖
- §7 问题详情（键 = `P-ID`）：描述（客观陈述，禁行动指令）/ 影响 / 归属 / 建议处置 / 状态与流转

> 详情 entry **禁止承载实现明细**（文件级 / 任务级内容）——详档锚点指向 `specs-tree`（EC-010）。§5/§6/§7 均为 preserve 键控，既有 entry 逐字保留、按 entry 键 upsert。

### 4.5 问题登记制与 P/PR 编码（FR-006 / FR-007）

| 维度 | 取值 |
|------|------|
| 问题编码 | `P-xxx`（`P-001` 起，顺序编号，不复用已关闭编号） |
| 提案编码 | `PR-xxx`（`PR-001` 起） |
| 问题类型 | 问题 / 技术债 / 文档债 / 风险 / 依赖 / 决策 |
| 问题状态 | 开放 / 已转化 / 已关闭 |
| 清单排序 | 开放项在前；同状态按影响降序 |
| 特性清单类型 | 特性 / 提案 |
| 优先级 | `P0` / `P1` / `P2`（仅 §6 entry 字段） |

> **淘汰项**（FR-005）：`RICE` / `Top N` / `Phase` / `Wave` / 立即-短期-中期-远期 时间轴——模板与 agent 指令中均不得再作为结构或字段出现。

### 4.6 迁移策略（FR-012 / EC-001 / EC-002）

| 既有产物形态 | 判定 | 处理 |
|-------------|------|------|
| 无任何 zone 标记 | 非模板结构（EC-001） | **不修改文件**；提示由人工决定重构 / 保留 / 增量补充 |
| 含旧 zone id（§2.2 识别清单） | 旧结构（EC-002 / FR-012） | **不静默重写**；提示「当前文档为旧结构，请按新模板完整迁移」；给出旧→新映射摘要 |
| 含新 zone id 且配对完整 | 新结构 | 按 §5.4 增量合并（3 rewrite + 5 preserve） |

> **正式迁移由用户装新版后自行触发（D5）**：本 Feature 不重排 `.sddu/ROADMAP.md`（NG-001），仅保证「识别旧结构 + 提示迁移 + 不静默重写」。

### 4.7 实现步骤（供 @sddu-tasks 分解）

| 步骤 | 内容 | 完成判据 |
|:--:|------|---------|
| W1 | 全量重写 `src/templates/outputs/sddu-roadmap.md.hbs` | 8 H2 / 8 zone（3 rewrite + 5 preserve）/ 3 张清单表 / 3 类 entry / 8 个 mermaid 块 / NOTE 块；≤170 行 |
| W2 | agent 模板 §5 章节定义表 + §5.4 zone 清单与合并语义 | 章节集合与 zone 清单与产物端一致；含旧 zone 迁移提示语义 |
| W3 | agent 模板 §5.5 各章语义 + 信息归属判定表 + P/PR 编码规则 | 含 §4.3 判定表；P/PR 编码规则完备 |
| W4 | agent 模板修订记录 bump v3.2.0 + §8 异常处置增补 | 修订记录新增 v3.2.0 行；§8 含旧结构迁移提示行 |
| W5 | `npm run build:agents` + dist ≡ src 核对 | dist 产物与 src 逐字节一致；二次构建幂等；`scripts/` 无 diff |
| W6 | 结构静态自检 + `/tmp` 沙箱演练 | V-01~V-10 通过 |

> 本 Feature **无运行时代码变更**，故不存在「改 `src/` 后 TS 编译生效」环节；构建仅把模板资产下发到 `dist/`。

## 5. 文件影响分析
> 所有需要创建/修改/删除的文件

### 5.1 变更清单（实现目标）

| 操作 | 文件路径 | 说明 |
|:--:|------|------|
| MODIFY（全量重写） | `src/templates/outputs/sddu-roadmap.md.hbs` | 旧 98 行 → 新 8 章结构，≤170 行（NFR-001）；8 zone / 8 mermaid / NOTE 块；元数据头 12 字段与 H1 不变 |
| MODIFY | `src/templates/agents/sddu-roadmap.md.hbs` | §5 章节定义表 / §5.4 zone 清单 + 合并语义 / §5.5 各章语义 + 归属判定表 + P/PR 编码 / 修订记录 v3.2.0 / §8 增补 |
| — | `scripts/` | **不变**（递归裸拷贝自动覆盖） |
| — | `src/**/*.ts` / `package.json` / `tsconfig.json` | **不变**（零运行时代码） |
| — | 其他 30 个输出模板 + 10 个其他 Agent 指令 | **不变**（NFR-007） |

### 5.2 流程产物（非实现目标，属 SDDU 工作流维护）

| 操作 | 文件路径 | 说明 |
|:--:|------|------|
| NEW | `…/specs-tree-roadmap-structure-v2/plan.md` | 本文件 |
| NEW | `…/ADR-001-overview-detail-layering.md` | 概览 / 详情分层结构决策 |
| NEW | `…/ADR-002-zone-mode-allocation.md` | zone 模式分配决策 |
| NEW | `…/ADR-003-chapter-mermaid-diagrams.md` | Mermaid 章首图决策 |
| NEW | `…/tasks.md` / `…/tasks.json` | 任务分解（本阶段产出） |
| MODIFY | `…/state.json` | phase: specified → planned → tasked |

### 5.3 明确不变内容（防越界）

- `.sddu/ROADMAP.md`（NG-001：不迁移、不重写；`docs/roadmap-rewrite` 分支产物仅作 V-05 沙箱素材）
- `.opencode/`（NG-005：安装产物，含 `plugins/sddu/templates/output/`）
- 增量合并算法 / 标记机制本身（NG-003：复用 v4.1.0）
- 其他 10 个 Agent 模板与 30 个输出模板（NFR-007）

## 6. 风险评估
> 识别技术、依赖和时间风险及缓解措施

| 风险 | 概率 | 影响 | 缓解措施 |
|------|:--:|:--:|----------|
| R1 Mermaid 语法陷阱（节点名空格 / 图超 10 行 / 围栏不配对）导致 GitHub 渲染失败 | 中 | 中 | 图行数 ≤10、节点名无空格 / 含空格一律引号包裹、围栏配对的静态 grep（V-03）+ `/tmp` 沙箱解析（V-05）；损坏时退化为代码块不阻塞（EC-007） |
| R2 信息归属再次漂移（依赖 / 风险重新塞错章） | 中 | 高 | §4.3 三主体判定表显式、可判定；agent 指令 §5.5 落表 + §5.7 自检；NFR-008 |
| R3 旧 zone 产物兼容风险（直接按新结构重写破坏保留区） | 中 | 高 | FR-012 非破坏识别 + 迁移提示（§4.6）；旧 zone 识别清单显式；沙箱演练 V-06 验证 |
| R4 模板 / 产物行数膨胀突破 170 / 450 行 | 中 | 中 | 模板复用紧凑表 + 图 ≤10 行；行数预算静态校验（V-08）；超限提示收敛（不静默截断） |
| R5 `preserve` 区 Mermaid 图随区逐字保留 → 结构演进后图可能过时 | 低 | 低 | 图仅表达静态结构关系（非数据快照）；结构变更属模板变更，随修订记录登记；必要时由用户显式更新该区 |
| R6 3 表 / 3 entry 字段与 spec FR-008/009 偏差 | 低 | 中 | plan §4.4 逐字段固化 + review / validate 逐列比对 |
| R7 改动错误扩散到其他模板 | 低 | 中 | 变更集 ⊆ 2 文件（`git status` 核对）；构建后其他模板哈希不变（V-04） |
| R8 agent 指令交叉引用（§5.5 / §5.7 / §8）漏改导致语义不一致 | 中 | 中 | W2~W4 逐节改造 + V-10 全量 grep 核对（旧术语 `RICE` / `Top N` / `Phase` / `Wave` / 旧 zone id 计数为 0） |

**回滚策略**：变更仅 2 个源文件、零运行时代码。回滚 = `git checkout -- src/templates/outputs/sddu-roadmap.md.hbs src/templates/agents/sddu-roadmap.md.hbs && npm run build:agents`；对既有 30 个模板与其他 Agent 行为零影响，无数据迁移、无不可逆副作用。

## 7. 审查清单（供 sddu-review 阶段逐项勾检）
> 本清单为验证入口，逐项对应 spec 条款

### 7.1 FR（12 项）
- [ ] FR-001 产物端 H2 恰为 8 个且顺序固定；「修订记录」恒为末位；命名遵循「XX 清单」/「XX 详情」
- [ ] FR-002 8 个 zone id / mode 与 §4.1 一一对应（3 rewrite + 5 preserve）；`meta` 不计入 8
- [ ] FR-003 8 章各含恰 1 个 ` ```mermaid ` 块；≤10 行；rewrite 区内 / preserve 区 entry 外落位
- [ ] FR-004 依赖风险三分归属规则可判定；无独立「依赖与风险」章；项目级在 §4 / §7 有承载
- [ ] FR-005 全文无 `RICE` / `Top N` / `Phase` / `Wave` / 立即-短期-中期-远期 作为结构或字段；§6 entry 含优先级字段且 ∈ {P0,P1,P2}
- [ ] FR-006 问题登记制：P-xxx / 类型 / 状态 / 排序规则明确；§4 清单与 §7 详情以 P-xxx 键对应
- [ ] FR-007 PR-xxx 进入 §3（类型=提案）与 §6（entry 键=PR-xxx）
- [ ] FR-008 三张清单表列数与列名与 §4.4 完全一致
- [ ] FR-009 三个详情章 entry 键 / 字段集合与 §4.4 一致；§7 描述为客观陈述
- [ ] FR-010 元数据头 12 字段与 H1 与既有模板逐项一致
- [ ] FR-011 agent §5 / §5.4 / §5.5 与新结构同步；修订记录含 v3.2.0
- [ ] FR-012 旧 zone 识别 + 迁移提示；全文无「自动迁移 / 静默重写」要求

### 7.2 NFR（8 项）
- [ ] NFR-001 `wc -l src/templates/outputs/sddu-roadmap.md.hbs` ≤ 170
- [ ] NFR-002 沙箱渲染产物 ≤ 450 行
- [ ] NFR-003 连续两次 `npm run build:agents` dist 无差异；dist 与 src 逐字节一致
- [ ] NFR-004 与 `sddu-plan.md.hbs` 风格逐项一致（标题 / `<<变量>>` 占位符 / 表格 / 无 Tab 缩进）
- [ ] NFR-005 Mermaid 语法合法；无裸空格节点名；围栏配对
- [ ] NFR-006 `git diff --name-only` 不含 `*.ts` / `scripts/**` / `package.json`
- [ ] NFR-007 除 2 个目标文件外 `src/templates/**` 哈希不变
- [ ] NFR-008 agent §5.5 含 §4.3 判定表；三条归属规则均一次性可判定

### 7.3 EC（10 项）
- [ ] EC-001/002 非模板 / 旧结构 → 不重写 + 提示（agent §8）
- [ ] EC-003 zone 与 entry 不配对 → 中止 + 诊断
- [ ] EC-004 未立项提案缺 PR 码 → 按规则生成
- [ ] EC-005 P-ID 冲突 → 追加新号
- [ ] EC-006 无 state.json → 标注「推断」不丢弃
- [ ] EC-007 Mermaid 损坏 → 退化为代码块不阻塞
- [ ] EC-008 §5 内应登记问题 → 外移 §4 / §7 + 锚点
- [ ] EC-009 preserve 区既有内容逐字保留
- [ ] EC-010 详情 entry 禁实现明细 → 详档锚点指向 specs-tree

## 8. 验证场景（供 sddu-validate 阶段执行）

| # | 场景 | 命令 / 方法 | 预期 |
|:--:|------|-----------|------|
| V-01 | 结构（FR-001） | `grep -c '^## ' src/templates/outputs/sddu-roadmap.md.hbs`；核对 8 个标题与顺序 | 8；顺序 = 愿景 / 版本清单 / 特性清单 / 问题清单 / 版本详情 / 特性详情 / 问题详情 / 修订记录 |
| V-02 | zone 配对（FR-002 / EC-003） | `grep -c 'sddu:zone'`、`grep -c 'mode="rewrite"'`、`grep -c 'mode="preserve"'`、`grep -c 'sddu:entry'` | zone open/close 配对；rewrite = 4（含 meta）；content rewrite = 3；preserve = 5；entry open/close 各 3 |
| V-03 | Mermaid 静态（FR-003 / NFR-005） | `grep -c '```mermaid'` = 8 / 闭合围栏配对；每图行数 ≤10；`grep -nE '[A-Za-z0-9_]+ [A-Za-z0-9_]+ \[' ` 无裸空格节点 | 8 图、全配对、≤10 行、无空格陷阱 |
| V-04 | 构建幂等（NFR-003 / NFR-007） | `npm run build:agents` ×2；`diff src/... dist/...`；两次 dist `md5sum` 比对；其他模板哈希比对 | dist ≡ src；幂等；其他 30 模板哈希不变 |
| V-05 | 沙箱演练（D5 决议） | `git show docs/roadmap-rewrite:.sddu/ROADMAP.md > /tmp/...`（275 行）→ 按 §2.2 映射逐节演练到新结构；不改工作区 | 映射可执行；图落位符合 §4.2；产出 `/tmp` 演练产物 |
| V-06 | 兼容旧标记（FR-012 / EC-002） | 以 V-05 素材（含旧 zone id）作为既有产物 → 触发 Step A | 判定「旧结构」+ 迁移提示；文件 `md5` 不变（非破坏） |
| V-07 | 风格一致性（NFR-004） | 与 `sddu-plan.md.hbs` 逐项比对（H1 / `<<变量>>` / 表头写法 / 缩进） | 风格一致；无 Tab 缩进 |
| V-08 | 行数预算（NFR-001 / NFR-002） | `wc -l`（模板 / 沙箱渲染产物） | 模板 ≤170；产物 ≤450 |
| V-09 | 零丢失抽查（EC-009） | 从 V-05 素材抽 10 条内容（版本主题 / 特性 / 问题 / 风险条目）核对新结构承载位 | 10/10 有承载位，无遗失、无静默丢弃 |
| V-10 | agent 指令一致性（FR-011） | `grep -c 'RICE\|Top N\|Phase\|Wave\|立即\|短期\|中期\|远期' agent 模板`；`grep -c 'v3.2.0'`；核对 §5 / §5.4 / §5.5 | 淘汰术语计数 = 0；修订记录含 v3.2.0；章节 / zone / 判定表与产物端一致 |

## 9. 生成的 ADR
> 本次规划产出的架构决策记录

| ADR | 标题 | 状态 |
|-----|------|:--:|
| ADR-001 | 概览 / 详情分层结构：三主体 × 两层粒度，替代单层 8 章混合结构 | ACCEPTED |
| ADR-002 | zone 模式分配：清单层 2 rewrite + 1 preserve，详情层全 preserve 键控 | ACCEPTED |
| ADR-003 | 章首 Mermaid 图：GitHub 原生渲染、零构建依赖、preserve 区静态演进 | ACCEPTED |

## 10. 修订记录
> 记录本文档的版本变更历史

| 版本 | 变更说明 | 日期 | 修订人 |
|------|---------|------|--------|
| v1.0 | 初始创建 — 落定纯模板双端重构总方案；给出旧→新 zone 映射（§2.2）、8 章分层结构与 8 zone 分配（§4.1）、Mermaid 章首图落位（§4.2）、依赖风险三主体归属规则（§4.3）、清单 / entry 结构（§4.4）、P/PR 编码（§4.5）、迁移策略（§4.6）；产出 3 个 ADR；含验证场景 V-01~V-10 | 2026-09-24 | SDDU Plan Agent |

---

## ✅ 技术规划完成

### 关键结论
- **总方案 = 纯模板双端重构**：仅 2 个 `src/` 文件（产物端全量重写 + 指令端定向改造），零运行时代码，`scripts/` 零改动（裸拷贝自动覆盖）。
- **结构 = 概览 / 详情分层**：8 H2 / 8 content zone（3 rewrite + 5 preserve）；依赖风险按「版本级 / 特性级 / 项目级」三分归属；每章章首 1 个 Mermaid 图。
- **非破坏迁移**：旧 zone / 非模板产物只识别 + 提示，不静默重写；正式迁移由用户装新版后自行触发（D5）。
- **工程边界守住**：变更集 ⊆ 2 个 `src/` 文件，`.opencode/` 与 `.sddu/` 不作变更目标。

### 下一步
👉 运行 `@sddu-tasks specs-tree-roadmap-structure-v2` 开始任务分解（按 §4.7 的 W1–W6 分解为原子任务）。
