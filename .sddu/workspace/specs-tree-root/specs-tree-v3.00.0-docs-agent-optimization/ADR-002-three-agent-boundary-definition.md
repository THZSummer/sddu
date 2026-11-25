# ADR-002: @sddu-docs / @sddu-tree / @sddu-roadmap 辅助 Agent 边界定义

## 状态
PROPOSED

## 背景

SDDU 框架包含三个侧向辅助 Agent，均以项目级视角扫描和产出文档：

| Agent | 描述 | 当前状态 |
|-------|------|:--:|
| `@sddu-docs` | 项目全景文档生成器 | ⚠️ 占位骨架，不可执行 |
| `@sddu-tree` | 目录导航生成器 | ✅ 完整可执行 |
| `@sddu-roadmap` | 版本路线图规划 | ✅ 完整可执行 |

问题：
1. **三者均扫描 `.sddu/` 目录**，存在潜在的职责重叠和重复劳动
2. **边界仅在各 Agent 的 §7 规则中一句话提及**（"不进行版本规划" / "不生成目录导航"），缺少精确的输入/输出/消费关系定义
3. **@sddu-roadmap 的 ROADMAP.md 实际输出包含「项目状态速览」**，与 @sddu-docs 的「业务全景」存在信息重叠
4. **用户不清楚何时调用哪个 Agent** ——「一个项目全景三份文档」的信息碎片化风险

## 决策

我们决定在 `@sddu-docs` 指令模板中明确定义三 Agent 的 7 维度精确边界，并在 `@sddu-tree` 和 `@sddu-roadmap` 的 §7 规则中标注对应的互斥边界引用（Nx4 互斥补充，本次 Feature 不修改 tree/roadmap 模板，仅通过 @sddu-docs 文档化）。

### 7 维度边界表

| 维度 | @sddu-docs | @sddu-tree | @sddu-roadmap |
|------|-----------|-----------|---------------|
| **扫描范围** | `.sddu/specs-tree-root/` 下 Feature 目录的 `spec.md` / `plan.md` / `state.json` | `.sddu/` 全部目录（文件列表、`.md` 简介、`.json` 元数据） | `.sddu/specs-tree-root/` Feature 目录（state.json/spec.md） + 用户新需求 |
| **不触碰区** | `TREE.md` 文件、`ROADMAP.md`、`.sddu/docs-tree-root/` 内部 TREE | Feature 产物内容（不修改 spec/plan/tasks，不语义解释） | `TREE.md` 文件、Feature 内部 plan.md/tasks.md 详细内容 |
| **输入** | Feature spec.md（目标/FR/用户故事）+ plan.md（架构/技术栈/依赖）+ state.json（版本/状态） | 目录结构 + 文件列表 + 文件前 20 行简介 | Feature state.json + spec.md 摘要 + 用户零散想法 |
| **输出** | `docs-tree-root/` 目录树（子系统→模块→对象逐级全景） | `TREE.md`（各级目录导航，含文件简介和 phase 进度条） | `ROADMAP.md`（版本路线图 + Feature 优先级 + 时间表） |
| **消费方** | 用户（项目入职/架构决策）、其他 Agent（上下文参考） | 用户、SDDU 系统（自动触发） | 用户、`@sddu-spec`（版本归属） |
| **触发** | **手动**: `@sddu-docs`；**不参与**自动触发 | **自动**: 8 个主流程 Agent 完成；**手动**: `@sddu-tree [path]` | **手动**: `@sddu-roadmap` |
| **语义区分** | 「系统**实际是什么**」——语义聚合当前产物为项目全景 | 「文件**在哪里**」——结构导航和文件简介 | 「系统**应该怎么走**」——版本规划和 Feature 优先级 |

### 关键设计原则

1. **互斥不重叠**: 三个 Agent 的输出文件互斥 —— `PROJECT.overview.md` (docs) / `TREE.md` (tree) / `ROADMAP.md` (roadmap)
2. **输入不冲突**: 虽有重叠的扫描目录，但关注的维度不同 —— docs 做语义提取，tree 做结构导航，roadmap 做版本规划
3. **消费链清晰**: 
   - tree 输出 → 被用户和系统引用（导航）
   - roadmap 输出 → 被 @sddu-spec 引用（版本归属）
   - docs 输出 → 被用户和 Agent 引用（上下文背景）
4. **ROADMAP.md 中的「现状信息」不是冗余**: roadmap 中的「项目状态速览」是规划的前置上下文（「当前状态是什么」才能规划「下一步做什么」），docs 中的「业务全景」是完整的语义描述。两者互补而非重叠。

### 对已有 ROADMAP.md 的影响

`ROADMAP.md` 中的「项目状态速览」（Feature 数量/状态统计）和「Feature 全量扫描」是 roadmap 规划所需的前置信息，不要求剥离。@sddu-docs 的 `PROJECT.overview.md` 提供的是更深入的语义层面描述（每个 Feature 做什么、用什么技术、如何关联），这是 ROADMAP.md 不需要、也无法提供的维度。

## 后果

### 正面影响
- ✅ **消除歧义**: 用户和 Agent 能明确知道何时调用哪个 Agent，预期哪个输出文件
- ✅ **防止职责漂移**: 后续扩展任何辅助 Agent 时，有明确的 7 维度模板可对照
- ✅ **文档化审计**: 边界定义不是只言片语，而是完整的表格，可由 review 阶段逐项验证

### 负面/风险
- ⚠️ **Nx4 需要三方同步**: 未来若修改任一 Agent 的边界，需要同步更新其余两个的引用。风险：某次修改只更新了一个 Agent 导致边界描述不一致
- ⚠️ **ROADMAP.md 的「现状速览」可能被误解为重叠**: 外部读者可能看到 ROADMAP.md 和 PROJECT.overview.md 都包含 Feature 清单，认为冗余。需要在两处文档中相互引用：「详见 PROJECT.overview.md 了解各 Feature 的具体设计」

### 缓解措施
1. 在 @sddu-docs 的指令模板 §7 中添加完整的 7 维度边界表
2. 在 ROADMAP.md 头部添加引用：「业务全景详见 PROJECT.overview.md（@sddu-docs 生成）」
3. 在 PROJECT.overview.md 头部添加引用：「版本规划详见 ROADMAP.md（@sddu-roadmap 生成）」
4. 此边界表写入 FR-TPL-001 的 11 Agent 边界文档作为权威参考

---

## 相关文档
- Feature Spec: `.sddu/specs-tree-root/specs-tree-docs-agent-optimization/spec.md` (v1.3, FR-005)
- 技术计划: `.sddu/specs-tree-root/specs-tree-docs-agent-optimization/plan.md`
- ADR-001: `./ADR-001-agent-native-scanning-approach.md`
- @sddu-tree 指令模板: `src/templates/agents/sddu-tree.md.hbs`
- @sddu-roadmap 指令模板: `src/templates/agents/sddu-roadmap.md.hbs`

## 修订记录
| 版本 | 变更说明 | 日期 | 修订人 |
|------|---------|------|--------|
| v1.0 | 初始创建 — 三 Agent 边界正式 ARCHITECTURE 定义 | 2026-07-04 | SDDU Plan Agent |
| v1.1 | 更新 @sddu-docs 输出描述：单文件 `PROJECT.overview.md` → 目录树 `docs-tree-root/` | 2026-07-05 | SDDU Plan Agent |
