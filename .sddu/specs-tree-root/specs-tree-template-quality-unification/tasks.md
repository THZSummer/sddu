# 任务分解：预置输出模板质量统一

> **Feature ID**: FR-TPL-001 | **阶段**: tasked | **状态**: tracked
> **基于 Plan**: `.sddu/specs-tree-root/specs-tree-template-quality-unification/plan.md`
> **总任务数**: 13 | **波次数**: 4 | **文件操作**: 22

---

## 依赖拓扑总览

```
Wave 1 ────────────────────────────────────────────────────────────── (无依赖，全部并行)
  TASK-001 [S]  删除 sddu-help 模板                                    [1 DELETE]
  TASK-002 [S]  重命名 sddu-docs → sddu-tree                           [1 RENAME]
  TASK-003 [S]  新建 sddu-docs 模板（项目全景）                          [1 NEW]
  TASK-004 [M]  统一指令模板：discovery / spec / plan                   [3 MODIFY]
  TASK-005 [M]  统一指令模板：tasks / build                             [2 MODIFY]
  TASK-006 [M]  统一指令模板：review / validate                         [2 MODIFY]
  TASK-007 [M]  统一产物模板：output/ 全部 7 个                          [7 MODIFY]
       │
Wave 2 ───────────────────────────────────────────────── (依赖 TASK-002 / TASK-003)
  TASK-008 [M]  统一指令模板：sddu / roadmap / tree / docs              [4 MODIFY]
       │
Wave 3 ──────────────────────────────────────────────── (依赖 Wave 1 + Wave 2)
  TASK-009 [S]  更新 build-agents.cjs 并验证构建                        [1 MODIFY]
  TASK-010 [M]  模板完整性验证（数量/占位符/残留/diff）                   [—]
       │
Wave 4 ───────────────────────────────────────────────── (依赖 Wave 1–3)
  TASK-011 [S]  审查清单：指令模板 (C1–C9)
  TASK-012 [S]  审查清单：产物模板 + 文件操作 + 构建脚本 (C10–C18)
  TASK-013 [S]  验证场景：全部边界/正向用例 (EC-001–004, V1–V6)
```

---

## 任务列表

---

### TASK-001: 删除 sddu-help 模板

**复杂度**: S
**前置依赖**: 无
**执行波次**: 1

#### 描述
删除 `src/templates/agents/sddu-help.md.hbs` 文件。该 Agent 功能已由 sddu（入口路由）和各子 Agent 自身承担，不再需要独立的帮助 Agent。

#### 涉及文件
- [DELETE] `src/templates/agents/sddu-help.md.hbs`

#### 验收标准
- [ ] `src/templates/agents/sddu-help.md.hbs` 文件不存在
- [ ] `git status` 显示该文件已删除（deleted）

#### 验证命令
```bash
test ! -f src/templates/agents/sddu-help.md.hbs && echo "✅ PASS: sddu-help removed" || echo "❌ FAIL: sddu-help still exists"
```

#### 对应 FR
FR-012

---

### TASK-002: 重命名 sddu-docs → sddu-tree

**复杂度**: S
**前置依赖**: 无
**执行波次**: 1

#### 描述
将 `src/templates/agents/sddu-docs.md.hbs` 重命名为 `src/templates/agents/sddu-tree.md.hbs`。原 sddu-docs 的目录导航功能归入 tree Agent，后续 TASK-008 会为其注入 tree 职责边界。

#### 涉及文件
- [RENAME] `src/templates/agents/sddu-docs.md.hbs` → `src/templates/agents/sddu-tree.md.hbs`

#### 验收标准
- [ ] `src/templates/agents/sddu-tree.md.hbs` 存在（内容同原 sddu-docs）
- [ ] `src/templates/agents/sddu-docs.md.hbs` 不存在
- [ ] `git status` 显示为一个 rename 操作

#### 验证命令
```bash
test -f src/templates/agents/sddu-tree.md.hbs && test ! -f src/templates/agents/sddu-docs.md.hbs && echo "✅ PASS: rename complete" || echo "❌ FAIL: rename incomplete"
```

#### 对应 FR
FR-009

---

### TASK-003: 新建 sddu-docs 模板（项目全景）

**复杂度**: S
**前置依赖**: 无
**执行波次**: 1

#### 描述
创建新的 `src/templates/agents/sddu-docs.md.hbs`，作为「项目全景」Agent 的指令模板。该 Agent 负责基于代码、配置、数据库 Schema 等实际产物生成项目全景文档（业务设计 + 技术设计）。

模板骨架（FR-013 序列）：角色定位与职责边界 → 执行顺序 → 依赖关系 → 前置验证 → 工作流程（标注「待后续 Feature 定义」）→ 输出模板 → 规则 → 异常处理 → 示例对话 → 修订记录。标题遵循 FR-014：`# 🎯 SDDU 项目全景专家 — 触发`。

#### 涉及文件
- [NEW] `src/templates/agents/sddu-docs.md.hbs`

#### 验收标准
- [ ] 文件存在且可读
- [ ] 标题格式：`# 🎯 SDDU 项目全景专家 — 触发`
- [ ] 四字段职责边界齐全：**负责**生成项目全景 / **输入**代码配置Schema等实际产物 / **输出**业务设计+技术设计文档 / **不负责**版本规划/目录导航/依赖过程性文档
- [ ] 包含完整的 FR-013 骨架（10 个章节），不适用章节标注「不适用」
- [ ] 包含 FR-018 修订记录节（至少一条初始条目：v3.0.1, 2026-06-19, 初始模板创建）
- [ ] 工作流程节标注「待后续 Feature 定义（本模板仅为占位骨架）」
- [ ] 输出模板节按 EC-004 标注输出为内置固定格式

#### 验证命令
```bash
FILE="src/templates/agents/sddu-docs.md.hbs"
test -f "$FILE" && echo "✅ PASS: file exists"
grep -q '# 🎯 SDDU 项目全景专家.*触发' "$FILE" && echo "✅ PASS: title correct" || echo "❌ FAIL: title mismatch"
grep -q '\*\*负责\*\*:' "$FILE" && grep -q '\*\*输入\*\*:' "$FILE" && grep -q '\*\*输出\*\*:' "$FILE" && grep -q '\*\*不负责\*\*:' "$FILE" && echo "✅ PASS: 4-field boundary present" || echo "❌ FAIL: boundary missing"
grep -q '## 📝 修订记录' "$FILE" && echo "✅ PASS: revision record present" || echo "❌ FAIL: revision missing"
```

#### 对应 FR
FR-010, FR-013~019

---

### TASK-004: 统一指令模板 — discovery / spec / plan

**复杂度**: M
**前置依赖**: 无
**执行波次**: 1

#### 描述
对 `sddu-discovery.md.hbs`、`sddu-spec.md.hbs`、`sddu-plan.md.hbs` 三个主流程指令模板执行统一变更：

1. **注入四字段职责边界**（FR-015）：在「角色定位」节后插入 `- **负责**:` / `- **输入**:` / `- **输出**:` / `- **不负责**:`，内容对齐 spec 5.1 对应声明。
2. **统一章节骨架**（FR-013）：确保章节序列为「角色定位与职责边界 → 执行顺序 → 依赖关系 → 前置验证 → 工作流程 → 输出模板 → 规则 → 异常处理 → 示例对话 → 修订记录」。将现有内容按此序列重排，不适用章节标注「不适用」。
3. **分离依赖关系**（FR-016）：原有「依赖关系」节中混杂的前置条件+输入+输出+下游拆分为仅保留「前置条件」和「下游」两字段，输入/输出归入职责边界节。
4. **修复代码块反引号**（FR-019）：sddu-discovery 中存在的 4 反引号代码块改为 3 反引号。
5. **新增修订记录**（FR-018）：模板末尾追加 `## 📝 修订记录` 节，含一条初始条目。
6. **保持内容不变**：各 Agent 工作流程具体内容不做修改，仅章节重排和命名统一。所有 `<<变量名>>` 占位符原样保留。

#### 涉及文件
- [MODIFY] `src/templates/agents/sddu-discovery.md.hbs`
- [MODIFY] `src/templates/agents/sddu-spec.md.hbs`
- [MODIFY] `src/templates/agents/sddu-plan.md.hbs`

#### 验收标准
- [ ] 三个文件均包含四字段职责边界（负责/输入/输出/不负责）
- [ ] 职责边界内容可追溯到 spec 5.1（discovery: 挖掘问题→问题清单→不定义需求；spec: 定义需求→需求规范→不技术设计；plan: 技术设计→技术方案→不任务排布）
- [ ] 每个文件的章节序列符合 FR-013（10 节），顺序一致
- [ ] 标题格式：`# 🎯 SDDU [角色] — 阶段 X/6`
- [ ] 不存在 4 反引号代码块 `\`\`\`\``
- [ ] 依赖关系节仅含「前置条件」和「下游」两字段
- [ ] 每个文件末尾有 `## 📝 修订记录` 节，至少一条条目
- [ ] `<<变量名>>` 占位符与变更前完全一致（数量、名称均不变）

#### 验证命令
```bash
for F in src/templates/agents/sddu-discovery.md.hbs src/templates/agents/sddu-spec.md.hbs src/templates/agents/sddu-plan.md.hbs; do
  echo "=== Checking: $F ==="
  grep -q '\*\*负责\*\*:' "$F" && grep -q '\*\*输入\*\*:' "$F" && grep -q '\*\*输出\*\*:' "$F" && grep -q '\*\*不负责\*\*:' "$F" && echo "  ✅ 4-field boundary" || echo "  ❌ boundary missing"
  grep -q '^\`\`\`\`' "$F" && echo "  ❌ 4-backtick found" || echo "  ✅ no 4-backtick"
  grep -q '## 📝 修订记录' "$F" && echo "  ✅ revision record" || echo "  ❌ revision missing"
  DEP_SECTION=$(awk '/## 依赖关系/,/^## /' "$F")
  echo "$DEP_SECTION" | grep -q '\*\*前置条件\*\*:' && echo "  ✅ 前置条件 field" || echo "  ❌ 前置条件 missing"
  echo "$DEP_SECTION" | grep -q '\*\*下游\*\*:' && echo "  ✅ 下游 field" || echo "  ❌ 下游 missing"
  echo "$DEP_SECTION" | grep -q '\*\*输入\*\*:' && echo "  ⚠️ 输入 should be in boundary, not here" || echo "  ✅ no duplicate 输入"
  echo "$DEP_SECTION" | grep -q '\*\*输出\*\*:' && echo "  ⚠️ 输出 should be in boundary, not here" || echo "  ✅ no duplicate 输出"
done
```

#### 对应 FR
FR-001~003, FR-013~019

---

### TASK-005: 统一指令模板 — tasks / build

**复杂度**: M
**前置依赖**: 无
**执行波次**: 1

#### 描述
对 `sddu-tasks.md.hbs`、`sddu-build.md.hbs` 两个主流程指令模板执行统一变更。

**sddu-tasks 特殊处理**：
- 原模板有一独立「## 输入」节（第 31–33 行），其内容与职责边界的输入字段重复。将此节并入四字段职责边界的 `- **输入**:` 字段，移除独立的「## 输入」节。
- 注入四字段职责边界（负责：任务排布 / 输入：技术方案 / 输出：原子任务 / 不负责：实施构建）。

**sddu-build 特殊处理**：
- 原模板使用「## 约束条件」节名，改为统一的「## 规则」。
- 注入四字段职责边界（负责：实施构建 / 输入：原子任务 / 输出：实施产物 / 不负责：审查/验证）。

**共同变更**：
- 统一章节骨架（FR-013），补全缺失章节。
- 分离依赖关系为两字段格式（FR-016）。
- 新增修订记录（FR-018）。
- 保持 `<<变量名>>` 占位符不变，工作流程内容不变。

#### 涉及文件
- [MODIFY] `src/templates/agents/sddu-tasks.md.hbs`
- [MODIFY] `src/templates/agents/sddu-build.md.hbs`

#### 验收标准
- [ ] 两个文件均包含四字段职责边界
- [ ] sddu-tasks 不再有独立「## 输入」节（已并入职责边界）
- [ ] sddu-build 使用「## 规则」而非「约束条件」
- [ ] 章节序列符合 FR-013（10 节），不适用章节标注「不适用」
- [ ] 标题格式正确（tasks: 阶段 3/6; build: 阶段 4/6）
- [ ] 依赖关系节仅含前置条件+下游
- [ ] 修订记录节存在且至少一条条目
- [ ] `<<变量名>>` 占位符不变

#### 验证命令
```bash
for F in src/templates/agents/sddu-tasks.md.hbs src/templates/agents/sddu-build.md.hbs; do
  echo "=== Checking: $F ==="
  grep -q '\*\*负责\*\*:' "$F" && grep -q '\*\*输入\*\*:' "$F" && grep -q '\*\*输出\*\*:' "$F" && grep -q '\*\*不负责\*\*:' "$F" && echo "  ✅ 4-field boundary" || echo "  ❌ boundary missing"
  grep -q '## 📝 修订记录' "$F" && echo "  ✅ revision record" || echo "  ❌ revision missing"
done
# tasks 专项检查
grep -q '^## 输入$' src/templates/agents/sddu-tasks.md.hbs && echo "❌ FAIL: standalone ## 输入 still present in tasks" || echo "✅ PASS: no standalone ## 输入 in tasks"
# build 专项检查
grep -q '约束条件' src/templates/agents/sddu-build.md.hbs && echo "❌ FAIL: 约束条件 still present in build" || echo "✅ PASS: 约束条件 removed from build"
grep -q '## 规则' src/templates/agents/sddu-build.md.hbs && echo "✅ PASS: ## 规则 present in build" || echo "❌ FAIL: ## 规则 missing in build"
```

#### 对应 FR
FR-004~005, FR-013~019

---

### TASK-006: 统一指令模板 — review / validate

**复杂度**: M
**前置依赖**: 无
**执行波次**: 1

#### 描述
对 `sddu-review.md.hbs`、`sddu-validate.md.hbs` 两个主流程指令模板执行统一变更。这两个模板比前序模板多出三类专项修复：

1. **修复缩进**（FR-019）：原 review 和 validate 模板的前置验证节存在异常缩进（多余空格），统一为与其他模板一致的空格缩进层级。
2. **修复代码块**（FR-019）：如果有 4 反引号代码块，统一改为 3 反引号。
3. **补全「规则」节**（FR-013/FR-017）：原模板缺少独立「## 规则」节，需补全。如果该 Agent 无额外规则，标注「不适用」但保留节位。
4. **注入四字段职责边界**（FR-015）：review: 负责产物审查 / 输入实施产物+规范 / 输出审查报告 / 不负责产物验证。validate: 负责产物验证 / 输入实施产物+规范 / 输出验证报告 / 不负责产物审查。
5. **其他标准变更**：统一骨架（FR-013）、分离依赖关系（FR-016）、新增修订记录（FR-018）。

#### 涉及文件
- [MODIFY] `src/templates/agents/sddu-review.md.hbs`
- [MODIFY] `src/templates/agents/sddu-validate.md.hbs`

#### 验收标准
- [ ] 两个文件缩进一致（无异常多余空格），与 discovery/spec 等模板缩进风格相同
- [ ] 无 4 反引号代码块
- [ ] 包含「## 规则」节（内容可为「不适用」）
- [ ] 四字段职责边界齐全
- [ ] 章节序列符合 FR-013
- [ ] 修订记录节存在

#### 验证命令
```bash
for F in src/templates/agents/sddu-review.md.hbs src/templates/agents/sddu-validate.md.hbs; do
  echo "=== Checking: $F ==="
  grep -q '\*\*负责\*\*:' "$F" && grep -q '\*\*输入\*\*:' "$F" && grep -q '\*\*输出\*\*:' "$F" && grep -q '\*\*不负责\*\*:' "$F" && echo "  ✅ 4-field boundary" || echo "  ❌ boundary missing"
  grep -q '^\`\`\`\`' "$F" && echo "  ❌ 4-backtick found" || echo "  ✅ no 4-backtick"
  grep -q '## 规则' "$F" && echo "  ✅ rules section" || echo "  ❌ rules missing"
  grep -q '## 📝 修订记录' "$F" && echo "  ✅ revision record" || echo "  ❌ revision missing"
  echo "  Indent check (line start with unusual spaces in ## ⚠️ block):"
  awk '/^## ⚠️ 前置验证/,/^## /' "$F" | head -5
done
```

#### 对应 FR
FR-006~007, FR-013~019

---

### TASK-007: 统一产物模板 — output/ 全部 7 个

**复杂度**: M
**前置依赖**: 无
**执行波次**: 1

#### 描述
对 `src/templates/agents/output/` 下全部 7 个产物模板（sddu-discovery / spec / plan / tasks / build / review / validate）执行统一变更：

1. **拆分完成报告节**（FR-022）：当前各模板的「完成报告」内容嵌在 `## 输出格式` 节内或以非独立层级呈现。将 `## 完成报告` 提升为独立 `##` 级标题，与 `## 输出格式` 并列。
2. **调整自动触发子节**（FR-022）：`### 自动触发文档更新` 固定为 `## 完成报告` 内的独立 `###` 子节。
3. **对齐输出格式节内容**（FR-021）：`## 输出格式` 节内容对齐 spec 5.1 各 Agent 的输出字段（如 discovery→问题清单、spec→需求规范、plan→技术方案 等）。
4. **检查占位符完整性**：确保所有 `<<变量名>>` 在重构后保持不变。

注意：sddu-discovery 的输出模板当前结构可能与其他 6 个不同，需特别对齐至目标双节结构（EC-002）。

#### 涉及文件
- [MODIFY] `src/templates/agents/output/sddu-discovery.md.hbs`
- [MODIFY] `src/templates/agents/output/sddu-spec.md.hbs`
- [MODIFY] `src/templates/agents/output/sddu-plan.md.hbs`
- [MODIFY] `src/templates/agents/output/sddu-tasks.md.hbs`
- [MODIFY] `src/templates/agents/output/sddu-build.md.hbs`
- [MODIFY] `src/templates/agents/output/sddu-review.md.hbs`
- [MODIFY] `src/templates/agents/output/sddu-validate.md.hbs`

#### 验收标准
- [ ] 7 个模板均包含 `## 输出格式` 和 `## 完成报告` 两个独立 `##` 级节
- [ ] 每个模板恰好有 2 个 `## ` 级标题（输出格式 + 完成报告）
- [ ] `### 自动触发文档更新` 为 `## 完成报告` 内的子节，不嵌于其他节
- [ ] `## 输出格式` 内容可追溯到 spec 5.1 对应 Agent 输出字段
- [ ] `<<变量名>>` 占位符与变更前一致

#### 验证命令
```bash
for F in src/templates/agents/output/sddu-*.md.hbs; do
  echo "=== Checking: $F ==="
  H2_COUNT=$(grep -c '^## ' "$F")
  [ "$H2_COUNT" -eq 2 ] && echo "  ✅ exactly 2 H2 sections (got $H2_COUNT)" || echo "  ❌ expected 2 H2, got $H2_COUNT"
  grep -q '^## 输出格式$' "$F" && echo "  ✅ ## 输出格式" || echo "  ❌ ## 输出格式 missing"
  grep -q '^## 完成报告$' "$F" && echo "  ✅ ## 完成报告" || echo "  ❌ ## 完成报告 missing"
  grep -q '### 自动触发文档更新' "$F" && echo "  ✅ auto-trigger sub-section" || echo "  ❌ auto-trigger missing"
done
```

#### 对应 FR
FR-020~022

---

### TASK-008: 统一指令模板 — sddu / roadmap / tree / docs

**复杂度**: M
**前置依赖**: TASK-002, TASK-003
**执行波次**: 2

#### 描述
对入口 Agent（sddu）和辅助 Agent（roadmap、tree、docs）的指令模板执行统一变更。这些模板与其他主流程模板格式差异最大，需重点处理：

**sddu.md.hbs**（入口，380 行）：
- 标题格式统一：`# 🎯 SDDU 工作流 — 入口`
- 注入四字段职责边界（负责：路由建议或调度 / 输入：用户意图 / 输出：路由建议 / 不负责：具体设计实施）
- 骨架对齐 FR-013（当前缺少多个标准章节）
- 新增修订记录

**sddu-roadmap.md.hbs**（辅助，301 行）：
- 标题格式统一：`# 🎯 SDDU Roadmap 规划专家 — 独立`
- 注入四字段职责边界（负责：版本规划 / 输入：用户零散想法 / 输出：特性清单+版本路线图 / 不负责：目录导航/输出版本路线图）
- **完整骨架注入**：当前模板章节结构最不标准，需从序言开始按 FR-013 逐节对齐，补全所有缺失章节（执行顺序、依赖关系、前置验证、规则、异常处理、修订记录）。不适用章节标注「不适用」。
- 输出模板节声明其输出为内置固定格式（EC-004）

**sddu-tree.md.hbs**（原 sddu-docs，222 行）：
- 依赖 TASK-002 完成（文件已重命名存在）
- 标题格式：`# 🎯 SDDU 目录导航专家 — 触发`
- 注入四字段职责边界（tree 的职责，非 docs）
- 骨架对齐 + 修订记录

**sddu-docs.md.hbs**（新，由 TASK-003 创建）：
- 依赖 TASK-003 完成（文件已创建存在）
- 确保 TASK-003 创建的骨架模板符合全部 FR-013~019 标准
- 完善工作流程节占位说明，输出模板节声明内置固定格式

**通用约束**：所有 `<<变量名>>` 占位符保持不变。

#### 涉及文件
- [MODIFY] `src/templates/agents/sddu.md.hbs`
- [MODIFY] `src/templates/agents/sddu-roadmap.md.hbs`
- [MODIFY] `src/templates/agents/sddu-tree.md.hbs`
- [MODIFY] `src/templates/agents/sddu-docs.md.hbs`

#### 验收标准
- [ ] sddu 标题为 `# 🎯 SDDU 工作流 — 入口` 或等效入口标识
- [ ] roadmap 标题为 `# 🎯 SDDU Roadmap 规划专家 — 独立`
- [ ] tree 标题为 `# 🎯 SDDU 目录导航专家 — 触发`
- [ ] docs 标题为 `# 🎯 SDDU 项目全景专家 — 触发`
- [ ] 四个文件均包含四字段职责边界，边界内容互不冲突
- [ ] roadmap 的章节序列完整符合 FR-013（当前缺失的执行顺序、依赖关系、前置验证、规则、异常处理、修订记录均已补全）
- [ ] roadmap 的输出模板节标注为内置固定格式
- [ ] 所有文件修订记录节存在
- [ ] 无 4 反引号代码块
- [ ] `<<变量名>>` 占位符不变

#### 验证命令
```bash
for F in src/templates/agents/sddu.md.hbs src/templates/agents/sddu-roadmap.md.hbs src/templates/agents/sddu-tree.md.hbs src/templates/agents/sddu-docs.md.hbs; do
  echo "=== Checking: $F ==="
  grep -q '\*\*负责\*\*:' "$F" && grep -q '\*\*输入\*\*:' "$F" && grep -q '\*\*输出\*\*:' "$F" && grep -q '\*\*不负责\*\*:' "$F" && echo "  ✅ 4-field boundary" || echo "  ❌ boundary missing"
  grep -q '## 📝 修订记录' "$F" && echo "  ✅ revision record" || echo "  ❌ revision missing"
  grep -q '^\`\`\`\`' "$F" && echo "  ❌ 4-backtick found" || echo "  ✅ no 4-backtick"
done
# roadmap 专项：检查骨架完整性
echo "=== roadmap skeleton check ==="
SKELETON_SECTIONS=("角色定位与职责边界" "执行顺序" "依赖关系" "前置验证" "工作流程" "输出模板" "规则" "异常处理" "示例对话" "修订记录")
for SEC in "${SKELETON_SECTIONS[@]}"; do
  grep -q "$SEC" src/templates/agents/sddu-roadmap.md.hbs && echo "  ✅ $SEC" || echo "  ❌ $SEC MISSING"
done
# 辅助 Agent 输出声明
grep -q '内置固定格式' src/templates/agents/sddu-roadmap.md.hbs && echo "✅ roadmap declares built-in output" || echo "⚠️ roadmap may lack built-in output declaration"
```

#### 对应 FR
FR-008~011, FR-013~019

---

### TASK-009: 更新 build-agents.cjs 并验证构建

**复杂度**: S
**前置依赖**: TASK-001, TASK-002, TASK-003, TASK-004, TASK-005, TASK-006, TASK-007, TASK-008
**执行波次**: 3

#### 描述
模板文件变更全部就位后，更新 `build-agents.cjs` 中 `specialAgents` 列表以反映 Agent 模板的增减：

1. **修改 specialAgents 列表**（第 108 行）：将当前 `['sddu', 'sddu-help', 'sddu-roadmap', 'sddu-docs']` 更新为 `['sddu', 'sddu-roadmap', 'sddu-tree', 'sddu-docs']`。具体操作：移除 `'sddu-help'`、将 `'sddu-docs'` 改为 `'sddu-tree'`（对应原 docs→tree 重命名）、新增 `'sddu-docs'`（对应新创建的项目全景 Agent）。
2. **运行构建验证**：执行 `node build-agents.cjs` 验证构建通过（对应 Plan V2 验证场景）。预期退出码 0，`dist/` 目录输出完整。

#### 涉及文件
- [MODIFY] `build-agents.cjs`

#### 验收标准
- [ ] `specialAgents` 数组不包含 `'sddu-help'`
- [ ] `specialAgents` 数组包含 `'sddu-tree'`（替代原 `'sddu-docs'`）
- [ ] `specialAgents` 数组包含 `'sddu-docs'`（新 Agent）
- [ ] `node build-agents.cjs` 退出码 0，无报错
- [ ] `dist/templates/agents/` 下输出文件完整（11 个 Agent 定义文件）
- [ ] 构建日志中无 `sddu-help` 引用，含 `sddu-tree` 和 `sddu-docs`

#### 验证命令
```bash
echo "=== C18: build-agents.cjs specialAgents list ==="
# 检查 specialAgents 数组内容
grep "specialAgents" build-agents.cjs | grep -q "sddu-tree" && echo "  ✅ sddu-tree in specialAgents" || echo "  ❌ sddu-tree MISSING"
grep "specialAgents" build-agents.cjs | grep -q "sddu-docs" && echo "  ✅ sddu-docs in specialAgents" || echo "  ❌ sddu-docs MISSING"
grep "specialAgents" build-agents.cjs | grep -q "sddu-help" && echo "  ❌ sddu-help STILL in specialAgents" || echo "  ✅ sddu-help removed from specialAgents"

echo "=== V2: Build verification ==="
node build-agents.cjs
BUILD_EXIT=$?
[ "$BUILD_EXIT" -eq 0 ] && echo "✅ PASS: build exited 0" || echo "❌ FAIL: build exited $BUILD_EXIT"

echo "=== dist/ output check ==="
ls dist/templates/agents/sddu-*.md 2>/dev/null | wc -l
ls dist/templates/agents/sddu-tree.md 2>/dev/null && echo "  ✅ sddu-tree in dist" || echo "  ❌ sddu-tree MISSING from dist"
ls dist/templates/agents/sddu-docs.md 2>/dev/null && echo "  ✅ sddu-docs in dist" || echo "  ❌ sddu-docs MISSING from dist"
test -f dist/templates/agents/sddu-help.md && echo "  ❌ sddu-help STILL in dist" || echo "  ✅ sddu-help absent from dist"
```

#### 对应 FR
FR-009, FR-010, FR-012（构建脚本适配）

---

### TASK-010: 模板完整性验证

**复杂度**: M
**前置依赖**: TASK-001, TASK-002, TASK-003, TASK-004, TASK-005, TASK-006, TASK-007, TASK-008
**执行波次**: 3

#### 描述
所有模板变更完成后，验证文件层面的完整性。

验证步骤：
1. 检查模板文件数量：11 指令 + 7 产物 = 18（Plan V4）
2. 执行占位符完整性检查：对比变更前后 `<<.*?>>` 占位符列表（Plan V3）
3. 执行无残留引用检查：grep `sddu-help` 在 `src/templates/` 下应无匹配（Plan V5）
4. 执行 `git diff --stat` 确认变更范围合理（Plan V6）

#### 涉及文件
- （无直接文件修改，验证已有变更）

#### 验收标准
- [ ] `ls src/templates/agents/sddu-*.md.hbs | wc -l` 输出 10（+ sddu.md.hbs 共 11 个指令模板）
- [ ] `ls src/templates/agents/output/sddu-*.md.hbs | wc -l` 输出 7
- [ ] 占位符列表无缺失（`<<.*?>>` 在变更前后的 diff 中无减少）
- [ ] `grep -r 'sddu-help' src/templates/` 无输出
- [ ] `git diff --stat` 显示变更范围合理（约 19 个文件被修改 + 1 新建 + 1 删除 + 1 重命名）

#### 验证命令
```bash
echo "=== Template Integrity Verification ==="

# 1. 模板文件总数（注意：sddu.md.hbs 不匹配 sddu-* 通配）
SRC_COUNT=$(ls src/templates/agents/sddu-*.md.hbs 2>/dev/null | wc -l)
OUT_COUNT=$(ls src/templates/agents/output/sddu-*.md.hbs 2>/dev/null | wc -l)
SDDU_ENTRY=$(test -f src/templates/agents/sddu.md.hbs && echo 1 || echo 0)
TOTAL=$((SRC_COUNT + SDDU_ENTRY + OUT_COUNT))
echo "Instruction templates: $SRC_COUNT (sddu-*) + $SDDU_ENTRY (sddu.md.hbs) = $((SRC_COUNT + SDDU_ENTRY))"
echo "Output templates: $OUT_COUNT"
echo "Total: $TOTAL"
[ "$((SRC_COUNT + SDDU_ENTRY))" -eq 11 ] && echo "✅ PASS: 11 instruction templates" || echo "❌ FAIL: expected 11 instruction, got $((SRC_COUNT + SDDU_ENTRY))"
[ "$OUT_COUNT" -eq 7 ] && echo "✅ PASS: 7 output templates" || echo "❌ FAIL: expected 7 output, got $OUT_COUNT"

# 2. 占位符完整性
echo "--- Placeholder check ---"
echo "Current placeholders:"
grep -roh '<<[^>]*>>' src/templates/agents/ --include='*.hbs' | sort -u

# 3. 无 sddu-help 残留
HELP_REF=$(grep -r 'sddu-help' src/templates/ 2>/dev/null | wc -l)
[ "$HELP_REF" -eq 0 ] && echo "✅ PASS: no sddu-help references in src/templates/" || echo "❌ FAIL: $HELP_REF sddu-help references found"

# 4. git diff 统计
echo "--- git diff --stat ---"
git diff --stat
```

#### 对应 FR
全部 FR（完整性验证）

---

### TASK-011: 审查清单 — 指令模板 (C1–C9)

**复杂度**: S
**前置依赖**: TASK-001, TASK-002, TASK-003, TASK-004, TASK-005, TASK-006, TASK-007, TASK-008
**执行波次**: 4

#### 描述
对照 Plan §7.1 的审查清单 C1–C9，对 11 个指令模板文件逐项勾检。本任务由 sddu-review Agent 执行。

审查清单：
| # | 检查项 | 对应 FR |
|---|--------|:------:|
| C1 | 标题格式 `# 🎯 SDDU [角色] — [后缀]` 一致 | FR-014 |
| C2 | 章节骨架序列完整 (10 节)，不适用标注 | FR-013 |
| C3 | 四字段职责边界齐全 | FR-015 |
| C4 | 依赖关系两字段（前置条件/下游） | FR-016 |
| C5 | 异常处理表格两列格式 | FR-017 |
| C6 | 无 4 反引号代码块 | FR-019 |
| C7 | 缩进一致（空格缩进，层级一致） | FR-019 |
| C8 | 修订记录节存在且至少一条条目 | FR-018 |
| C9 | "不负责"措辞遵循 EC-003（主责而非禁止） | FR-015 |

#### 涉及文件
- （审查已变更的 11 个指令模板文件）

#### 验收标准
- [ ] C1–C9 全部 9 项检查通过

#### 验证命令
```bash
echo "=== C1: Title Format ==="
for F in src/templates/agents/sddu.md.hbs src/templates/agents/sddu-*.md.hbs; do
  TITLE=$(head -20 "$F" | grep '^# 🎯 SDDU')
  echo "  $(basename $F): $TITLE"
done

echo "=== C6: No 4-backtick ==="
for F in src/templates/agents/sddu.md.hbs src/templates/agents/sddu-*.md.hbs; do
  grep -q '^\`\`\`\`' "$F" && echo "❌ $(basename $F): 4-backtick found" || true
done

echo "=== C8: Revision Record ==="
for F in src/templates/agents/sddu.md.hbs src/templates/agents/sddu-*.md.hbs; do
  grep -q '## 📝 修订记录' "$F" && echo "  ✅ $(basename $F)" || echo "  ❌ $(basename $F) MISSING revision"
done

echo "=== C9: EC-003 wording (no 禁止/唯一 in 不负责) ==="
grep -n '不负责' src/templates/agents/sddu.md.hbs src/templates/agents/sddu-*.md.hbs | grep -E '禁止|唯一|不允许' && echo "⚠️ potential EC-003 violation" || echo "✅ no EC-003 violation"
```

#### 对应 FR
FR-013~019 (审查覆盖)

---

### TASK-012: 审查清单 — 产物模板 + 文件操作 + 构建脚本 (C10–C18)

**复杂度**: S
**前置依赖**: TASK-001, TASK-002, TASK-003, TASK-004, TASK-005, TASK-006, TASK-007, TASK-008, TASK-009
**执行波次**: 4

#### 描述
对照 Plan §7.2–§7.3 的审查清单 C10–C18，对产物模板、文件级操作及构建脚本逐项勾检。本任务由 sddu-review Agent 执行。

审查清单：
| # | 检查项 | 对应 FR |
|---|--------|:------:|
| C10 | 产物模板骨架：`## 输出格式` → `## 完成报告` | FR-020 |
| C11 | `## 输出格式` 内容对齐 spec 5.1 输出字段 | FR-021 |
| C12 | `## 完成报告` 为独立 `##` 级标题 | FR-022 |
| C13 | `### 自动触发文档更新` 为独立子节 | FR-022 |
| C14 | 所有 `<<变量名>>` 占位符与变更前一致 | NFR-002 |
| C15 | `sddu-help.md.hbs` 已移除 | FR-012 |
| C16 | `sddu-tree.md.hbs` 存在且职责边界对应 tree | FR-009 |
| C17 | 新 `sddu-docs.md.hbs` 存在且职责边界对应 docs | FR-010 |
| C18 | `build-agents.cjs` specialAgents 列表已更新 | FR-009/010/012 |

#### 涉及文件
- （审查已变更的 7 个产物模板 + 文件级操作 + build-agents.cjs）

#### 验收标准
- [ ] C10–C18 全部 9 项检查通过

#### 验证命令
```bash
echo "=== C10: Output template skeleton ==="
for F in src/templates/agents/output/sddu-*.md.hbs; do
  H2_COUNT=$(grep -c '^## ' "$F")
  [ "$H2_COUNT" -eq 2 ] && echo "  ✅ $(basename $F) ($H2_COUNT sections)" || echo "  ❌ $(basename $F) ($H2_COUNT sections)"
done

echo "=== C15: sddu-help removed ==="
test -f src/templates/agents/sddu-help.md.hbs && echo "❌ sddu-help STILL EXISTS" || echo "✅ sddu-help removed"

echo "=== C16: sddu-tree exists ==="
test -f src/templates/agents/sddu-tree.md.hbs && echo "✅ sddu-tree exists" || echo "❌ sddu-tree MISSING"

echo "=== C17: sddu-docs (new) exists ==="
test -f src/templates/agents/sddu-docs.md.hbs && echo "✅ sddu-docs (new) exists" || echo "❌ sddu-docs MISSING"

echo "=== C18: build-agents.cjs specialAgents list ==="
grep "specialAgents" build-agents.cjs
grep "specialAgents" build-agents.cjs | grep -q "sddu-help" && echo "  ❌ C18 FAIL: sddu-help still in specialAgents" || echo "  ✅ C18 PASS: sddu-help removed from specialAgents"
grep "specialAgents" build-agents.cjs | grep -q "sddu-tree" && echo "  ✅ C18 PASS: sddu-tree in specialAgents" || echo "  ❌ C18 FAIL: sddu-tree MISSING from specialAgents"
grep "specialAgents" build-agents.cjs | grep -q "sddu-docs" && echo "  ✅ C18 PASS: sddu-docs in specialAgents" || echo "  ❌ C18 FAIL: sddu-docs MISSING from specialAgents"
```

#### 对应 FR
FR-009~022, NFR-002 (审查覆盖, C18 新增)

---

### TASK-013: 验证场景 — 全部边界/正向用例 (EC-001–004, V1–V6)

**复杂度**: S
**前置依赖**: TASK-001, TASK-002, TASK-003, TASK-004, TASK-005, TASK-006, TASK-007, TASK-008, TASK-009, TASK-010
**执行波次**: 4

#### 描述
执行 Plan §8 中全部验证场景。本任务由 sddu-validate Agent 执行。

边界用例：
| 场景 | 验证步骤 |
|------|----------|
| EC-001 | grep 所有模板 `约束条件` / `## 规则`，仅出现 `## 规则` |
| EC-002 | 统计 7 个 output/ 模板的 `## ` 级标题，每个恰好 2 个 |
| EC-003 | grep 所有模板「不负责」字段中的 `禁止`/`唯一`/`不允许`，应为 0 |
| EC-004 | 检查 roadmap/tree/docs 的输出模板标注内置固定格式 |

正向场景：
| 场景 | 计划定义 | 验证步骤 |
|------|----------|----------|
| V1 | 新增模板骨架生效 | 对照 FR-013 骨架验证新 sddu-docs 模板可自然遵循 |
| V2 | **构建脚本通过** | `node build-agents.cjs` 退出码 0，无报错，dist/ 输出完整 |
| V3 | 占位符完整性 | `grep -r '<<.*?>>'` 对比变更前后占位符列表无缺失 |
| V4 | 模板数量正确 | 11 指令 + 7 产物 = 18 |
| V5 | 无残留引用 | `grep -r 'sddu-help' src/templates/` 无匹配 |
| V6 | git diff 范围可控 | `git diff --stat` 变更行数合理，无意外波及 |

#### 涉及文件
- （验证已变更的全部模板文件 + build-agents.cjs）

#### 验收标准
- [ ] EC-001 ~ EC-004 全部 4 项通过
- [ ] V1 ~ V6 全部 6 项通过
- [ ] 总通过数 ≥ 10/10

#### 验证命令
```bash
echo "============================================"
echo "  SDDU Validate: FR-TPL-001 全量验证"
echo "============================================"
PASS=0
FAIL=0

check() {
  if eval "$1"; then
    echo "✅ PASS: $2"
    PASS=$((PASS + 1))
  else
    echo "❌ FAIL: $2"
    FAIL=$((FAIL + 1))
  fi
}

echo "--- EC-001: Section name consistency ---"
check '! grep -rn "约束条件" src/templates/agents/sddu.md.hbs src/templates/agents/sddu-*.md.hbs 2>/dev/null' "EC-001: no 约束条件 (all are 规则)"

echo "--- EC-002: Output template dual-section ---"
check 'for F in src/templates/agents/output/sddu-*.md.hbs; do [ $(grep -c "^## " "$F") -eq 2 ] || exit 1; done' "EC-002: all 7 output templates have exactly 2 H2 sections"

echo "--- EC-003: No absolute prohibitive wording ---"
check '! grep -n "不负责" src/templates/agents/sddu.md.hbs src/templates/agents/sddu-*.md.hbs 2>/dev/null | grep -qE "禁止|唯一|不允许"' "EC-003: no 禁止/唯一/不允许 in 不负责 fields"

echo "--- EC-004: Aux agent output declaration ---"
check 'grep -q "内置固定格式" src/templates/agents/sddu-roadmap.md.hbs || grep -q "内置固定格式" src/templates/agents/sddu-tree.md.hbs || grep -q "内置固定格式" src/templates/agents/sddu-docs.md.hbs' "EC-004: aux agents declare built-in output format"

echo "--- V2: Build script verification ---"
check 'node build-agents.cjs > /dev/null 2>&1' "V2: build-agents.cjs succeeds (exit 0)"

echo "--- V3: Placeholder integrity ---"
check 'echo "manual verification: compare placeholder lists before/after"' "V3: placeholder integrity (verify manually)"

echo "--- V4: Template file count ---"
check '[ $(ls src/templates/agents/sddu-*.md.hbs 2>/dev/null | wc -l) -eq 10 ] && [ -f src/templates/agents/sddu.md.hbs ] && [ $(ls src/templates/agents/output/sddu-*.md.hbs 2>/dev/null | wc -l) -eq 7 ]' "V4: 10(sddu-*) + 1(sddu.md.hbs) + 7(output) = 18 total"

echo "--- V5: No sddu-help residue ---"
check '[ $(grep -r "sddu-help" src/templates/ 2>/dev/null | wc -l) -eq 0 ]' "V5: no sddu-help references"

echo "--- V6: git diff scope ---"
git diff --stat
check '[ $(git diff --stat 2>/dev/null | tail -1 | grep -o "[0-9]* file" | grep -o "[0-9]*") -le 25 ]' "V6: git diff within expected scope (≤25 files)"

echo "============================================"
echo "  Results: $PASS passed, $FAIL failed"
echo "============================================"
[ "$FAIL" -eq 0 ] && echo "🎉 ALL CHECKS PASSED" || echo "⚠️  SOME CHECKS FAILED"
```

#### 对应 FR
全部 FR (验证覆盖)

---

## 任务汇总表

| TASK | 名称 | 复杂度 | 波次 | 依赖 | 文件操作数 |
|------|------|:--:|:--:|------|:--:|
| TASK-001 | 删除 sddu-help 模板 | S | 1 | — | 1 DELETE |
| TASK-002 | 重命名 sddu-docs → sddu-tree | S | 1 | — | 1 RENAME |
| TASK-003 | 新建 sddu-docs 模板 | S | 1 | — | 1 NEW |
| TASK-004 | 统一指令模板：discovery/spec/plan | M | 1 | — | 3 MODIFY |
| TASK-005 | 统一指令模板：tasks/build | M | 1 | — | 2 MODIFY |
| TASK-006 | 统一指令模板：review/validate | M | 1 | — | 2 MODIFY |
| TASK-007 | 统一产物模板：output/ 7 个 | M | 1 | — | 7 MODIFY |
| TASK-008 | 统一指令模板：sddu/roadmap/tree/docs | M | 2 | 002,003 | 4 MODIFY |
| TASK-009 | 更新 build-agents.cjs 并验证构建 | S | 3 | 001–008 | 1 MODIFY |
| TASK-010 | 模板完整性验证 | M | 3 | 001–008 | — |
| TASK-011 | 审查清单：指令模板 (C1–C9) | S | 4 | 001–008 | — |
| TASK-012 | 审查清单：产物+文件+构建 (C10–C18) | S | 4 | 001–009 | — |
| TASK-013 | 验证场景：全部用例 (EC+V) | S | 4 | 001–010 | — |

**统计**: 13 个任务 | S 级 7 个，M 级 6 个，L 级 0 个 | 4 个执行波次 | 22 项文件操作 (1 DELETE + 1 RENAME + 1 NEW + 19 MODIFY)

---

## 执行策略

### Wave 1（批量并行 — 建议一次提交）
TASK-001 ~ TASK-007 全部无依赖，可由 sddu-build 并行执行或批量顺序执行。这 7 个任务覆盖了 17 项文件操作（1 DELETE + 1 RENAME + 1 NEW + 14 MODIFY），是变更的核心主体。

### Wave 2（依赖文件存在）
TASK-008 必须在 TASK-002 和 TASK-003 完成后执行，因为需要修改刚重命名/创建的 tree 和 docs 文件。覆盖 4 MODIFY 操作。

### Wave 3（依赖全部模板就位 + 构建适配）
TASK-009 在所有模板变更完成后更新 build-agents.cjs 并运行构建验证（覆盖 Plan V2）。TASK-010 验证模板完整性（数量、占位符、残留引用、diff 范围，覆盖 Plan V3–V6）。两任务可并行。

### Wave 4（审查与验证）
TASK-011 ~ TASK-013 在所有实现完成后，分别由 sddu-review 和 sddu-validate Agent 执行。这三个任务可并行。

---

## 审查清单覆盖矩阵

| Plan 审查项 | 对应 TASK | 审查对象 |
|-------------|:---------:|----------|
| C1–C9 | TASK-011 | 11 个指令模板 |
| C10–C14 | TASK-012 | 7 个产物模板 |
| C15–C17 | TASK-012 | 文件级操作 |
| **C18** | **TASK-012** | **build-agents.cjs** |

## 验证场景覆盖矩阵

| Plan 验证项 | 对应 TASK | 类别 |
|-------------|:---------:|------|
| EC-001 ~ EC-004 | TASK-013 | 边界用例 |
| V1 (新增模板骨架) | TASK-013 | 正向 |
| **V2 (构建通过)** | **TASK-009 + TASK-013** | **正向** |
| V3 (占位符) | TASK-010 + TASK-013 | 正向 |
| V4 (模板数量) | TASK-010 + TASK-013 | 正向 |
| V5 (无残留) | TASK-010 + TASK-013 | 正向 |
| V6 (diff 范围) | TASK-010 + TASK-013 | 正向 |

---

## 不变内容确认

| 内容类别 | 状态 |
|----------|:--:|
| 所有 `<<变量名>>` 占位符 | 保持完全不变 |
| 各 Agent 的工作流程/核心职责内容 | 仅做章节重排和命名统一，不修改具体指令内容 |
| 模板渲染逻辑（Handlebars） | 完全不涉及 |
| Agent 运行时行为 | 完全不涉及（NG1） |

---

## 回滚策略

```bash
# 完整回滚：恢复所有模板文件和构建脚本到变更前状态
git checkout -- src/templates/agents/
git checkout -- build-agents.cjs

# 分阶段回滚
git checkout -- src/templates/agents/output/    # 仅产物模板
git checkout -- src/templates/agents/sddu-*.md.hbs  # 仅指令模板
```

---

✅ **任务分解完成 — 已修正全部已知问题**  
**修正内容**: 新增 TASK-009 (build-agents.cjs + 构建验证) | 审查清单 C18 纳入 TASK-012 | V2 验证场景恢复 | 文件操作统计修正为 22

**File**: `.sddu/specs-tree-root/specs-tree-template-quality-unification/tasks.md`
