# ADR-002: zone 模式分配 — 清单层 2 rewrite + 1 preserve，详情层全 preserve 键控

## 状态
ACCEPTED

## 背景

ADR-001 确定了 8 章的分层结构。下一步决定每个章节对应的 **content zone** 采用哪种合并模式（`mode="rewrite"` 整块重建 / `mode="preserve"` 按键控合并、既有内容不静默丢弃）。该模式来自 v4.1.0 既有机制（复用、不重造，NG-003），本 Feature 只重新分配。

约束与事实：

- **可投影 vs 需保护**：清单层的版本 / 特性是 `.sddu/specs-tree-root/*/state.json` 的**实时投影**（事实数据，可整体重建）；而问题台账（P-xxx）是**人工维护的资产**，一旦被 rewrite 覆盖就会静默丢问题（Q-001 / Q-003 的教训）。
- **观点与台账不可再生**：详情层的 entry（版本目标 / 特性定位 / 问题描述与处置）是判断与决策，无法从 state.json 推导，必须 preserve。
- **EC-009**：preserve 区已有内容须逐字保留，仅按 entry 键控合并新增 / 更新。
- **FR-003**：rewrite 区图随区整体重建，preserve 区图随区逐字保留。
- **entry 仅用于 preserve 区**；表格类区段（修订记录）不用 entry 标记（HTML 注释会截断 Markdown 表格），改用「版本」列自然键合并。

## 决策

按章节内容形态分配模式：

| zone id | 章节 | mode | 理由 |
|---------|------|:----:|------|
| `vision` | §1 项目愿景与定位 | rewrite | 项目级陈述，随全局认知整体重建 |
| `version-list` | §2 版本清单 | rewrite | state.json 实时投影（版本 / 主题 / 时间窗 / 状态 / 特性数 / 开放问题数） |
| `feature-list` | §3 特性清单 | rewrite | state.json 实时投影（Feature ID / 名称 / 类型 / 状态 / 版本归属） |
| `issue-list` | §4 问题清单 | **preserve** | **问题台账是人工资产，防静默丢问题**（Q-001 教训）；既有 P-xxx 逐字保留、按 ID 键控合并 |
| `version-detail` | §5 版本详情 | preserve | entry 键控（键 = 版本号）；版本目标 / 里程碑 / 风险与依赖为判断，不可再生 |
| `feature-detail` | §6 特性详情 | preserve | entry 键控（键 = `Feature ID` 或 `PR-xxx`）；定位 / 优先级 / 状态去向为判断 |
| `issue-detail` | §7 问题详情 | preserve | entry 键控（键 = `P-ID`）；描述 / 影响 / 处置 / 状态流转为台账 |
| `revision-log` | §8 修订记录 | preserve | 追加式 + 自然键更新（键 =「版本」列）；审计语义，既有行逐字保留 |

合计 **8 content zone = 3 rewrite + 5 preserve**（`meta` 沿用既有处理，不计入 8，FR-010）。

关键设计取舍：

1. **清单层 2 rewrite + 1 preserve**：版本 / 特性可从 state.json 投影（事实），问题必须防丢（资产）。三种清单同层却分属两种模式，正是「**事实可投影、观点与台账需保护**」原则的体现。
2. **详情层全 preserve**：三个详情章一律 entry 键控，保证观点与台账跨次不丢、可独立 upsert 单个条目。
3. **`next-actions` → `issue-list` 的语义重构**：旧 `next-actions`（待办清单，preserve）重构为 `issue-list`（问题台账，preserve，6 列表 + P-xxx）——沿用 preserve 保护既有条目，同时把「横切杂物箱」升格为「有编码的问题登记制」。
4. **删除 `priority` / `dependencies-risks`（原 rewrite）**：RICE 表整体淘汰；依赖风险不再独立成章（分流三主体，见 ADR-001）。

## 后果

**正向**：
- 事实数据可被最新扫描结果整体刷新（3 rewrite），观点与台账被保护（5 preserve），各得其所。
- 问题不再可能被静默覆盖 → Q-001 / Q-003 的「反复遗忘」闭环风险被机制性规避。
- 模式分配可静态校验（`grep -c 'mode="rewrite"'` = 4 含 meta、`mode="preserve"` = 5），review / validate 具备确定性判据。

**代价 / 残余风险**：
- 清单层内 `issue-list` 为 preserve，意味着其表结构变更（列增删）不能靠 rewrite 自动完成，须人工迁移 → 由 FR-012 迁移提示与模板 NOTE 说明覆盖。
- preserve 区既有内容永不自动删除，长期可能出现「已关闭问题仍保留」→ 由状态字段（`已关闭`）与人工复核覆盖，符合「不静默处理」原则。

## 备选方案与否决理由

| 备选 | 否决理由 |
|------|---------|
| 清单层全部 rewrite（含 `issue-list`） | 问题台账每次被整体重建 → 人工登记的 P-xxx 会被静默丢弃，Q-001 / Q-003 复发，直接违反 EC-009 |
| 详情层改为 rewrite（整章重建） | 版本目标 / 特性定位 / 问题处置是判断与台账，无法从任何数据源推导 → 必然丢内容 |
| 全 preserve | 版本 / 特性清单应随 state.json 实时刷新，preserve 会导致陈旧条目长期滞留、需人工逐条更新 |
| `revision-log` 使用 entry 标记 | HTML 注释行会截断 Markdown 表格 → 改用「版本」列自然键合并（v4.1.0 既有约定） |
