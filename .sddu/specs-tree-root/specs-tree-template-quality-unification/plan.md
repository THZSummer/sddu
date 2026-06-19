# 技术计划：预置输出模板质量统一

> **Feature ID**: FR-TPL-001 | **目标版本**: v3.0.1 | **类型**: 技术债务清理 / 质量改进

---

## 1. 前置检查

| 检查项 | 状态 |
|--------|:--:|
| spec.md 存在 | ✅ |
| 外部 API 文档依赖 | 无（纯模板文件变更） |
| 前置依赖 FR-TEMPLATE-001 | ✅ 已完成 |

---

## 2. 架构分析

### 2.1 当前模板架构

```
src/templates/agents/
├── sddu.md.hbs                    # 入口 Agent 指令 (380 行)
├── sddu-discovery.md.hbs          # 阶段 0/6 指令 (238 行)
├── sddu-spec.md.hbs               # 阶段 1/6 指令 (153 行)
├── sddu-plan.md.hbs               # 阶段 2/6 指令 (146 行)
├── sddu-tasks.md.hbs              # 阶段 3/6 指令 (140 行)
├── sddu-build.md.hbs              # 阶段 4/6 指令 (129 行)
├── sddu-review.md.hbs             # 阶段 5/6 指令 (153 行)
├── sddu-validate.md.hbs           # 阶段 6/6 指令 (146 行)
├── sddu-roadmap.md.hbs            # 辅助 Agent 指令 (301 行)
├── sddu-docs.md.hbs               # 辅助 Agent 指令 (222 行，将重命名为 tree)
├── sddu-help.md.hbs               # 将被移除 (159 行)
└── output/
    ├── sddu-discovery.md.hbs      # 产物模板 (89 行)
    ├── sddu-spec.md.hbs           # 产物模板 (36 行)
    ├── sddu-plan.md.hbs           # 产物模板 (39 行)
    ├── sddu-tasks.md.hbs          # 产物模板 (41 行)
    ├── sddu-build.md.hbs          # 产物模板 (45 行)
    ├── sddu-review.md.hbs         # 产物模板 (48 行)
    └── sddu-validate.md.hbs       # 产物模板 (69 行)
```

### 2.2 识别的格式不一致问题（10 维度诊断）

通过逐文件对比，识别出以下系统性问题：

| # | 问题维度 | 涉及文件数 | 严重度 |
|---|---------|:--:|:--:|
| I1 | **标题格式不统一**：主流程用 `# 🎯 SDDU 工作流 - 阶段 X/6`，入口用 `# @sddu - ...`，辅助用 `# 🎯 SDDU Roadmap 规划专家 (...)` | 4/11 | 🔴 高 |
| I2 | **章节骨架缺失/命名不一致**：sddu-roadmap/sddu-docs 缺少标准章节，sddu-build 用 "约束条件" 而非 "规则" | 4/11 | 🔴 高 |
| I3 | **职责边界缺失**：0/11 模板包含四字段（负责/输入/输出/不负责）边界声明 | 11/11 | 🔴 高 |
| I4 | **代码块反引号不一致**：3 个模板使用 4 反引号 ````, 其余用 3 反引号 ``` | 3/11 | 🟡 中 |
| I5 | **依赖关系节字段混杂**：前置条件+输入+输出+下游混在同一节，输入/输出与职责边界重复 | 7/11 | 🟡 中 |
| I6 | **修订记录节全部缺失**：0/11 模板包含修订记录 | 11/11 | 🟡 中 |
| I7 | **缩进不一致**：sddu-review/sddu-validate 前置验证节缩进异常（多余空格） | 2/11 | 🟢 低 |
| I8 | **产物模板缺少独立 ## 完成报告节**：完成报告内容嵌在 ## 输出格式 内 | 6/6 | 🟡 中 |
| I9 | **sddu-help 待移除** | 1/11 | 🔴 高 |
| I10 | **sddu-docs→sddu-tree 重命名 + 新 sddu-docs 创建** | 2/11 | 🔴 高 |

### 2.3 依赖关系图

```
build-agents.cjs (构建脚本，引用 specialAgents 列表)
    ├── AGENT_MAP[0..6] → src/templates/agents/sddu-{discovery|spec|plan|tasks|build|review|validate}.md.hbs
    └── specialAgents[4] → src/templates/agents/sddu.md.hbs
                        → src/templates/agents/sddu-help.md.hbs    ← 移除
                        → src/templates/agents/sddu-roadmap.md.hbs
                        → src/templates/agents/sddu-docs.md.hbs    ← 重命名为 sddu-tree

> ⚠️ `build-agents.cjs` 属于项目构建脚本，可纳入本 Feature 修改范畴。模板文件移除/重命名后需同步更新 specialAgents 列表。
```

### 2.4 变更边界

变更范围：除以下三项 SDDU 插件安装产物外，项目内其余文件均可纳入本次修改范畴：
- **`.opencode/*`**
- **`.sddu/*`**
- **`opencode.json`**

以上三项由插件自身管理，不在本 Feature 变更范围内。

不触及的层级：
- Agent 运行时逻辑（LLM system prompt 内容）
- 模板渲染引擎（Handlebars 处理逻辑）
- 状态机（state.json 管理）
- `<<变量名>>` 占位符（全部保留原样）

---

## 3. 方案对比

### 方案 A：批量统一重构（推荐）

**描述**：按 FR-013 骨架顺序，为 11 个指令模板逐文件注入四字段职责边界，统一章节命名、标题格式、代码块、缩进；为 6 个产物模板拆分完成报告节；按 FR-012 移除 sddu-help，按 FR-009 重命名 sddu-docs→sddu-tree，按 FR-010 新建 sddu-docs。

实现方式：一次性批量变更，按依赖拓扑顺序执行。

| 维度 | 评估 |
|------|------|
| **优点** | 一次到位消除所有不一致；变更原子性强；后续新增模板可直接参考 11 个标准化模板 |
| **缺点** | 单次变更量较大（17 文件）；需要仔细逐文件 diff 审查 |
| **风险** | 低——纯文本模板变更，不涉及运行时逻辑，回滚成本极低（git revert） |
| **预估工作量** | 约 4-6 小时（含审查） |

### 方案 B：分批渐进重构

**描述**：分 3 批次执行——第 1 批注入职责边界（FR-001~FR-011），第 2 批统一章节骨架与格式（FR-013~FR-019），第 3 批处理产物模板（FR-020~FR-022）+ Agent 增减（FR-009/FR-010/FR-012）。

| 维度 | 评估 |
|------|------|
| **优点** | 单次变更量小，审查聚焦；每批可独立验证和交付 |
| **缺点** | 中间状态存在格式不一致（第 1 批后骨架仍不统一）；3 批总计时间更长；需 3 次验证周期 |
| **风险** | 低——同方案 A |
| **预估工作量** | 约 6-8 小时（3 批 + 3 次审查） |

### 方案 C：模板引擎化

**描述**：不修改现有模板，而是创建一个"模板生成器"脚本，从统一的 Schema 定义（JSON/YAML）自动生成 17 个模板。此后新增模板只需维护 Schema。

| 维度 | 评估 |
|------|------|
| **优点** | 一劳永逸；格式零漂移；新增模板成本降至零 |
| **缺点** | 需要设计和实现模板生成器，超出本次范围；引入新组件增加维护负担；违反 NG2（不做模板校验工具）和 NG3（不做多套模板风格） |
| **风险** | 中——可能过度设计，时间不可控 |
| **预估工作量** | 约 12-16 小时 |

### 方案对比总览

| | 方案 A（批量统一） | 方案 B（分批渐进） | 方案 C（模板引擎化） |
|----|:--:|:--:|:--:|
| 一致性达成 | ✅ 一次到位 | ⚠️ 中间态不一致 | ✅ 零漂移 |
| 实现复杂度 | 低 | 低 | 高 |
| 回归风险 | 极低 | 极低 | 中 |
| 工作量 | 4-6h | 6-8h | 12-16h |
| 符合 Non-Goals | ✅ | ✅ | ❌ 违反 NG2/NG3 |

---

## 4. 推荐方案：方案 A — 批量统一重构

### 选择理由

1. **Non-Goal 合规**：方案 A 纯文本变更，方案 C 引入了模板生成工具，违反 NG2（不做模板校验工具）
2. **原子性**：所有模板一次性对齐到 FR-013/FR-020 骨架，无中间不一致状态
3. **业务价值最大化**：方案 A 以最短时间达成 G1（有章可循）、G2（体验一致）、G3（边界分明）
4. **回滚成本极低**：`git checkout -- src/templates/agents/` 即可完整回滚
5. **下游友好**：后续 review 和 validate 阶段只需对照一批标准化模板执行检查

### 变更顺序（拓扑序）

```
Phase 1: 结构清理
  1.1 移除 sddu-help.md.hbs                                    [FR-012]
  1.2 重命名 sddu-docs.md.hbs → sddu-tree.md.hbs               [FR-009]

Phase 2: 新增模板
  2.1 创建 sddu-docs.md.hbs（项目全景）                         [FR-010]

Phase 3: 指令模板格式统一（主流程 → 入口 → 辅助）
  3.1 sddu-discovery.md.hbs  [FR-001, FR-013~019]
  3.2 sddu-spec.md.hbs       [FR-002, FR-013~019]
  3.3 sddu-plan.md.hbs       [FR-003, FR-013~019]
  3.4 sddu-tasks.md.hbs      [FR-004, FR-013~019]
  3.5 sddu-build.md.hbs      [FR-005, FR-013~019]
  3.6 sddu-review.md.hbs     [FR-006, FR-013~019]
  3.7 sddu-validate.md.hbs   [FR-007, FR-013~019]
  3.8 sddu.md.hbs            [FR-011, FR-013~019]
  3.9 sddu-roadmap.md.hbs    [FR-008, FR-013~019]
  3.10 sddu-tree.md.hbs      [FR-009, FR-013~019]
  3.11 sddu-docs.md.hbs      [FR-010, FR-013~019]

Phase 4: 产物模板格式统一
   4.1 ~ 4.7 逐个处理 7 个 output/ 模板  [FR-020~022]

Phase 5: 构建脚本适配
   5.1 build-agents.cjs: specialAgents 列表更新（移除 sddu-help，sddu-docs→sddu-tree，新增 sddu-docs）

Phase 6: 构建验证
   6.1 运行 node build-agents.cjs 验证构建通过
   6.2 git diff --stat 确认变更范围
```

---

## 5. 文件影响分析

### 每个文件的具体变更

| 操作 | 文件路径 | 关键变更 | 对应 FR |
|:--:|------|------|:--:|
| ❌ DELETE | `src/templates/agents/sddu-help.md.hbs` | 移除 sddu-help Agent 模板 | FR-012 |
| 🔄 RENAME | `src/templates/agents/sddu-docs.md.hbs` → `sddu-tree.md.hbs` | 目录导航功能归入 tree | FR-009 |
| 🆕 NEW | `src/templates/agents/sddu-docs.md.hbs` | 项目全景 Agent 模板（新） | FR-010 |
| ✏️ MODIFY | `src/templates/agents/sddu-discovery.md.hbs` | 四字段职责边界 + 修复代码块4→3反引号 + 分离依赖关系 + 新增修订记录 | FR-001,013~019 |
| ✏️ MODIFY | `src/templates/agents/sddu-spec.md.hbs` | 四字段职责边界 + 骨架统一 + 新增修订记录 | FR-002,013~019 |
| ✏️ MODIFY | `src/templates/agents/sddu-plan.md.hbs` | 四字段职责边界 + 骨架统一 + 新增修订记录 | FR-003,013~019 |
| ✏️ MODIFY | `src/templates/agents/sddu-tasks.md.hbs` | 四字段职责边界 + 移除独立"输入"节（并入职责边界）+ 新增修订记录 | FR-004,013~019 |
| ✏️ MODIFY | `src/templates/agents/sddu-build.md.hbs` | 四字段职责边界 + "约束条件"→"规则" + 新增修订记录 | FR-005,013~019 |
| ✏️ MODIFY | `src/templates/agents/sddu-review.md.hbs` | 四字段职责边界 + 修复代码块4→3反引号 + 修复缩进 + 补"规则"节 + 新增修订记录 | FR-006,013~019 |
| ✏️ MODIFY | `src/templates/agents/sddu-validate.md.hbs` | 四字段职责边界 + 修复代码块4→3反引号 + 修复缩进 + 补"规则"节 + 新增修订记录 | FR-007,013~019 |
| ✏️ MODIFY | `src/templates/agents/sddu-roadmap.md.hbs` | 四字段职责边界 + 完整骨架注入（补全所有缺失节）+ 标题格式统一 + 新增修订记录 | FR-008,013~019 |
| ✏️ MODIFY | `src/templates/agents/sddu.md.hbs` | 四字段职责边界 + 标题格式统一 + 骨架对齐 + 新增修订记录 | FR-011,013~019 |
| ✏️ MODIFY | `src/templates/agents/sddu-tree.md.hbs` | 四字段职责边界（tree）+ 骨架统一 + 新增修订记录 | FR-009,013~019 |
| ✏️ MODIFY | `src/templates/agents/sddu-docs.md.hbs`（新） | 四字段职责边界（新 docs）+ 完整骨架 | FR-010,013~019 |
| ✏️ MODIFY | `src/templates/agents/output/sddu-discovery.md.hbs` | 拆分 ## 完成报告 节 | FR-020~022 |
| ✏️ MODIFY | `src/templates/agents/output/sddu-spec.md.hbs` | 拆分 ## 完成报告 节 | FR-020~022 |
| ✏️ MODIFY | `src/templates/agents/output/sddu-plan.md.hbs` | 拆分 ## 完成报告 节 | FR-020~022 |
| ✏️ MODIFY | `src/templates/agents/output/sddu-tasks.md.hbs` | 拆分 ## 完成报告 节 | FR-020~022 |
| ✏️ MODIFY | `src/templates/agents/output/sddu-build.md.hbs` | 拆分 ## 完成报告 节 | FR-020~022 |
| ✏️ MODIFY | `src/templates/agents/output/sddu-review.md.hbs` | 拆分 ## 完成报告 节 | FR-020~022 |
| ✏️ MODIFY | `src/templates/agents/output/sddu-validate.md.hbs` | 拆分 ## 完成报告 节 | FR-020~022 |
| ✏️ MODIFY | `build-agents.cjs` | specialAgents 列表：移除 sddu-help，sddu-docs→sddu-tree，新增 sddu-docs | FR-009/010/012 |

**统计**：DELETE 1 | NEW 1 | RENAME 1 | MODIFY 19 | **总计 22 项文件操作**

---

## 6. 风险评估

| 风险 | 概率 | 影响 | 缓解措施 |
|------|:--:|:--:|----------|
| **R1: 构建中断** — build-agents.cjs 引用了被移除/重命名的模板文件导致构建失败 | 中 | 高 | Phase 5 在模板变更完成后立即更新构建脚本，Phase 6 运行构建验证 |
| **R2: Agent 行为漂移** — 修改指令模板时误改工作流程内容 | 低 | 高 | 严格按 FR-013 规则：不适用于某 Agent 的章节标注"不适用"但保留骨架位置；工作流程内容只做章节重排不做内容修改 |
| **R3: 占位符被破坏** — `<<变量名>>` 在编辑过程中被意外修改 | 低 | 高 | diff 验证步骤中 grep `<<.*?>>` 对比变更前后的占位符列表 |
| **R4: 缩进不一致残留** — 手工编辑可能引入新的缩进问题 | 中 | 低 | Phase 6 使用统一缩进检测脚本（检测 tab/空格混用） |
| **R5: 新 sddu-docs 内容空白** — FR-010 新 Agent 的模板内容需要从零编写 | 中 | 中 | 基于 sddu-roadmap 的模板结构作为起点，填入 spec 5.1 中定义的边界声明，工作流程节标注"待后续 Feature 定义" |

### 回滚策略

```bash
# 完整回滚：恢复所有模板文件和构建脚本到变更前状态
git checkout -- src/templates/agents/
git checkout -- build-agents.cjs

# 分阶段回滚：仅回滚某类文件
git checkout -- src/templates/agents/output/    # 仅回滚产物模板
git checkout -- src/templates/agents/sddu-*.md.hbs  # 仅回滚指令模板
```

---

## 7. 审查清单（供 sddu-review 阶段逐项勾检）

以下清单基于 spec 5.1~5.3 中所有功能需求，按模板类型分组。

### 7.1 指令模板审查清单（11 个文件）

对 `src/templates/agents/sddu-{discovery|spec|plan|tasks|build|review|validate|roadmap|tree|docs|sddu}.md.hbs` 逐文件检查：

| # | 检查项 | 对应 FR | 预期结果 |
|---|--------|:------:|----------|
| C1 | 标题格式：`# 🎯 SDDU [角色名称] — [类型后缀]` | FR-014 | 主流程带"阶段 X/6"，辅助带"独立"或"触发"，入口带"SDDU 工作流 — 入口" |
| C2 | 章节骨架序列：角色定位与职责边界 → 执行顺序 → 依赖关系 → 前置验证 → 工作流程 → 输出模板 → 规则 → 异常处理 → 示例对话 → 修订记录 | FR-013 | 逐文件对比，序列完全一致，不适用章节有"不适用"标记 |
| C3 | 职责边界四字段齐全：`- **负责**:` `- **输入**:` `- **输出**:` `- **不负责**:` | FR-015 | 每个 Agent 的四字段内容可追溯到 spec 5.1 |
| C4 | 依赖关系两字段：`- **前置条件**:` `- **下游**:` | FR-016 | 输入/输出不在此节重复 |
| C5 | 异常处理表格：`| 场景 | 处理方式 |` 两列 | FR-017 | 逐文件检查表格存在且列数为 2 |
| C6 | 代码块使用 3 反引号（```） | FR-019 | 不存在 ```` 4 反引号代码块 |
| C7 | 缩进一致：空格缩进，层级一致 | FR-019 | 逐文件检查，尤其 sddu-review / sddu-validate |
| C8 | 修订记录节存在：`## 📝 修订记录`，至少一条条目 | FR-018 | 修订条目含版本号、日期、变更摘要 |
| C9 | "不负责"措辞遵循 EC-003 | FR-015 | 使用"主责"而非"禁止/唯一"措辞，允许协作但明确主责 |

### 7.2 产物模板审查清单（7 个文件）

对 `src/templates/agents/output/sddu-*.md.hbs` 逐文件检查：

| # | 检查项 | 对应 FR | 预期结果 |
|---|--------|:------:|----------|
| C10 | 章节骨架：`## 输出格式` → `## 完成报告` | FR-020 | 序列一致，无遗漏 |
| C11 | `## 输出格式` 节内容对齐 spec 5.1 对应 Agent 的"输出"字段 | FR-021 | 辅助 Agent（roadmap/tree/docs）标注输出为内置固定格式 |
| C12 | `## 完成报告` 节为独立 `##` 级标题 | FR-022 | 不可嵌于 ## 输出格式 或其他节内 |
| C13 | `### 自动触发文档更新` 为 `## 完成报告` 内的独立 `###` 子节 | FR-022 | 不可内嵌于其他段落 |
| C14 | 所有 `<<变量名>>` 占位符与变更前一致 | NFR-002 | 逐文件 grep `<<.*?>>` 对比 |

### 7.3 文件级操作审查清单

| # | 检查项 | 对应 FR | 预期结果 |
|---|--------|:------:|----------|
| C15 | `sddu-help.md.hbs` 已移除 | FR-012 | 文件不存在于 src/templates/agents/ |
| C16 | `sddu-tree.md.hbs` 存在（原 sddu-docs 的内容 + 新边界） | FR-009 | 标题/职责边界对应 tree |
| C17 | 新 `sddu-docs.md.hbs` 存在 | FR-010 | 标题/职责边界对应 docs（项目全景） |
| C18 | `build-agents.cjs` specialAgents 列表已更新 | FR-009/010/012 | 无 sddu-help，含 sddu-tree 和 sddu-docs |

---

## 8. 验证场景（供 sddu-validate 阶段执行）

### 8.1 边界用例验证（EC-001 ~ EC-004）

| 场景 | 验证步骤 | 预期结果 |
|------|----------|----------|
| **EC-001** 章节名统一 | grep 所有模板中的 `约束条件`、`## 规则` | 仅出现 `## 规则`，无 `约束条件` |
| **EC-002** 产物模板双节结构 | 统计 7 个 output/ 模板的 `## ` 级标题 | 每个模板恰好含 `## 输出格式` 和 `## 完成报告` |
| **EC-003** "不负责"措辞 | grep 所有模板中的 `禁止`、`唯一`、`不允许` 出现在"不负责"字段中 | "不负责"字段不含绝对禁止性措辞，使用"不输出/不设计/不X"格式 |
| **EC-004** 辅助 Agent 输出声明 | 检查 sddu-roadmap / sddu-tree / sddu-docs 的输出模板 | 标注输出为内置固定格式，不走用户自定义模板覆盖路径 |

### 8.2 正向验证场景

| 场景 | 验证步骤 | 预期结果 |
|------|----------|----------|
| **V1** 新增模板时骨架生效 | 人工新增一个模拟 Agent 模板，对照 FR-013 骨架检查 | 新增模板可自然遵循统一骨架，不会引入新的一致性问题 |
| **V2** 构建脚本通过 | `node build-agents.cjs` | 退出码 0，无报错，dist/ 输出完整 |
| **V3** 占位符完整性 | `grep -r '<<.*?>>' src/templates/agents/ --include='*.hbs' -o | sort | uniq -c` 对比变更前后 | 占位符列表无差异（允许新增，不允许缺失） |
| **V4** 模板数量正确 | `ls src/templates/agents/sddu-*.md.hbs | wc -l` → 11 个指令模板<br>`ls src/templates/agents/output/sddu-*.md.hbs | wc -l` → 7 个产物模板 | 11 + 7 = 18 个模板文件 |
| **V5** 无残留引用 | grep `sddu-help` 在所有 src/templates/ 文件中 | 无匹配（已完整移除） |
| **V6** git diff 范围可控 | `git diff --stat` | 变更行数合理，无意外波及 |

---

## 9. 生成的 ADR

> 见同级文件 `ADR-001-template-quality-unification-approach.md`

---

## 10. 不变内容确认

| 内容类别 | 状态 |
|----------|:--:|
| 所有 `<<变量名>>` 占位符 | 保持不变 |
| 各 Agent 的工作流程/核心职责内容 | 保持内容不变，仅做章节重排和命名统一 |
| 模板渲染逻辑（Handlebars） | 完全不涉及 |
| Agent 运行时行为 | 完全不涉及 |

---

## ✅ 技术规划完成

**Feature**: 预置输出模板质量统一  
**Feature ID**: FR-TPL-001  
**阶段**: planned  
**状态**: tracked  
**文件**: `.sddu/specs-tree-root/specs-tree-template-quality-unification/plan.md`

### 生成的 ADR
- `.sddu/specs-tree-root/specs-tree-template-quality-unification/ADR-001-template-quality-unification-approach.md` — 批量统一重构方案

### 下一步
👉 运行 `@sddu-tasks 预置输出模板质量统一` 开始任务分解
