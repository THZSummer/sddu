# 任务分解：@sddu-docs Agent 补全与优化

> **文档定位**: SDDU 任务清单 — 将技术方案分解为可并行执行的原子任务，作为 build 阶段的输入  
> **前置依赖**: plan.md（技术方案）、spec.md（需求规范）  
> **创建人**: SDDU Tasks Agent  
> **创建时间**: 2026-07-05  
> **版本**: v2.0  
> **更新人**: SDDU Tasks Agent  
> **更新时间**: 2026-07-05  
> **更新说明**: v2.0 — 增量任务：基于 plan v2.9 新约束（模板自声明输出文件名、`<<entity_name>>`→`<<doc_subject>>` 重命名、定位声明去限定词、子目录命名规则 N1~N5、禁止事项 X1~X3），新增 5 个任务、3 个波次

## 1. 依赖拓扑总览
> 任务依赖关系和执行顺序

```
Wave 1 ─── (无依赖，全部并行)
  TASK-001 [M]  创建 T1 全景入口模板 + 模板库目录体系
  TASK-002 [M]  创建实体/功能描述模板（T2-T6, T11, T13, T20，8 个文件）
  TASK-003 [M]  创建技术描述模板（T7-T10, T12，5 个文件）
  TASK-004 [M]  创建关系 + 元数据模板（T14-T19，6 个文件）

Wave 2 ─── (依赖 Wave 1)
  TASK-005 [L]  补全 Agent 指令模板核心 — §1-§6（角色→工作流→输出模板选择）

Wave 3 ─── (依赖 TASK-005)
  TASK-006 [M]  补全 Agent 指令模板规则 — §7-§10（边界→异常→对话→完成协议）

Wave 4 ─── (依赖 TASK-006)
  TASK-007 [S]  构建验证：build-agents.cjs 编译通过
  TASK-008 [S]  交叉一致性校验 + FR 覆盖清单 + 状态更新
```

## 2. 任务列表
> 每个任务的详细定义

### TASK-001: 创建全景入口模板 + 模板库目录体系
> 建立模板库目录结构，创建最核心的全景入口模板 T1

| 属性 | 值 |
|------|-----|
| **复杂度** | M |
| **前置依赖** | 无 |
| **执行波次** | Wave 1 |
| **对应 FR** | FR-002, FR-003, FR-008 |

**描述**: 
在 `src/templates/outputs/` 下新建 `docs/` 目录，创建模板库的基础设施和标杆模板 T1（`sddu-docs-overview.md.hbs`）。T1 是所有层级入口文档的模板，定义「本级是什么 + 子组件关系」的双全景结构。模板开头声明定位（`> **文档定位**: sddu-docs-overview — 本级全景入口`），包含业务全景和技术全景两章节，使用 `<<entity_name>>`、`#each children` 等 Handlebars 变量。作为模板库的参考标杆，后续 19 个模板复用其文件头结构和 Handlebars 模式。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| 🆕 NEW | `src/templates/outputs/docs/` (目录) |
| 🆕 NEW | `src/templates/outputs/docs/sddu-docs-overview.md.hbs` (~100 行) |

**验收标准**:
- [x] `src/templates/outputs/docs/` 目录已创建
- [x] `sddu-docs-overview.md.hbs` 包含文件头定位声明（`> **文档定位**: ...`）
- [x] 包含「1. 业务全景」章节：`<<entity_name>>`、自身概述表、`#each children` 子组件遍历
- [x] 包含「2. 技术全景」章节：`#each tech_stack`、`#each adrs` 遍历
- [x] 包含修订记录表格（`<<generated_at>>`、`<<changed_features>>`、`<<full_or_incremental>>`）
- [x] 全部使用 `<<变量名>>` 占位符，无硬编码内容
- [x] Handlebars 语法正确（`#each`/`#if`/`#else` 成对闭合）

**验证命令**:
```bash
# 验证目录存在
test -d src/templates/outputs/docs/ && echo "PASS: docs/ directory exists"

# 验证模板文件存在且非空
test -s src/templates/outputs/docs/sddu-docs-overview.md.hbs && echo "PASS: overview template exists"

# 验证关键 Handlebars 占位符存在
grep -q '<<entity_name>>' src/templates/outputs/docs/sddu-docs-overview.md.hbs && echo "PASS: entity_name placeholder"
grep -q '#each children' src/templates/outputs/docs/sddu-docs-overview.md.hbs && echo "PASS: children each"
grep -q '#each tech_stack' src/templates/outputs/docs/sddu-docs-overview.md.hbs && echo "PASS: tech_stack each"
grep -q '#each adrs' src/templates/outputs/docs/sddu-docs-overview.md.hbs && echo "PASS: adrs each"

# 验证 Handlebars 块闭合
grep -c '#each' src/templates/outputs/docs/sddu-docs-overview.md.hbs && grep -c '/each' src/templates/outputs/docs/sddu-docs-overview.md.hbs
```

---

### TASK-002: 创建实体/功能描述模板（批量 8 个）
> 创建所有描述业务实体与功能的模板 — 对象、API、数据、页面、流程、事件、命令、命令树

| 属性 | 值 |
|------|-----|
| **复杂度** | M |
| **前置依赖** | 无（并行于 TASK-001） |
| **执行波次** | Wave 1 |
| **对应 FR** | FR-002, FR-003 |
| **状态** | ✅ completed |

**描述**: 
按 plan §3.3 内置模板清单，批量创建 8 个实体/功能描述类模板。每个模板开头声明定位，使用 `<<变量名>>` 占位符，遵循 T1 建立的 Handsbars 模式。模板覆盖业务全景维度的核心文档类型：业务对象（T2）、API 路由（T3）、数据模型（T4）、前端页面（T5）、业务流程（T6）、领域事件（T11）、命令文档（T13）、命令树（T20）。每个模板 40-60 行。

**涉及文件**:

| 操作 | 文件路径 | 估算行数 |
|:--:|------|:--:|
| 🆕 NEW | `src/templates/outputs/docs/sddu-docs-object.md.hbs` | ~60 |
| 🆕 NEW | `src/templates/outputs/docs/sddu-docs-api.md.hbs` | ~60 |
| 🆕 NEW | `src/templates/outputs/docs/sddu-docs-data.md.hbs` | ~60 |
| 🆕 NEW | `src/templates/outputs/docs/sddu-docs-page.md.hbs` | ~60 |
| 🆕 NEW | `src/templates/outputs/docs/sddu-docs-flow.md.hbs` | ~60 |
| 🆕 NEW | `src/templates/outputs/docs/sddu-docs-event.md.hbs` | ~60 |
| 🆕 NEW | `src/templates/outputs/docs/sddu-docs-command.md.hbs` | ~60 |
| 🆕 NEW | `src/templates/outputs/docs/sddu-docs-command-tree.md.hbs` | ~40 |

**验收标准**:
- [ ] 8 个文件全部创建，非空
- [ ] 每个模板开头包含定位声明（`> **文档定位**: sddu-docs-{类型} — ...`）
- [ ] T2（object）：包含业务对象职责、属性表、关联关系、生命周期
- [ ] T3（api）：包含 REST 端点表、请求/响应 Schema、状态码
- [ ] T4（data）：包含表结构、字段、索引、关联关系
- [ ] T5（page）：包含路由、组件树、交互流程
- [ ] T6（flow）：包含状态机、流转规则、异常路径
- [ ] T11（event）：包含事件类型、生产者、消费者、触发条件
- [ ] T13（command）：包含命令名、参数说明、管道组合
- [ ] T20（command-tree）：包含该命令组的完整命令结构
- [ ] 全部使用 `<<变量名>>` 占位符和标准 Handlebars 语法

**验证命令**:
```bash
for f in object api data page flow event command command-tree; do
  file="src/templates/outputs/docs/sddu-docs-${f}.md.hbs"
  test -s "$file" && echo "PASS: $file exists and non-empty" || echo "FAIL: $file missing or empty"
  grep -q '文档定位' "$file" && echo "  PASS: $file has positioning declaration" || echo "  FAIL: $file missing positioning"
done
```

---

### TASK-003: 创建技术描述模板（批量 5 个）
> 创建所有描述技术实现的模板 — 配置、集成、部署、安全、导出符号表

| 属性 | 值 |
|------|-----|
| **复杂度** | M |
| **前置依赖** | 无（并行于 TASK-001/002） |
| **执行波次** | Wave 1 |
| **状态** | ✅ completed |
| **对应 FR** | FR-002, FR-003 |

**描述**: 
按 plan §3.3 内置模板清单，批量创建 5 个技术描述类模板。覆盖技术全景维度的核心文档类型：配置项（T7）、第三方集成（T8）、部署信息（T9）、安全模型（T10）、导出符号表（T12）。每个模板开头声明定位，使用 `<<变量名>>` 占位符，遵循 T1 模式。每个模板 ~60 行。

**涉及文件**:

| 操作 | 文件路径 | 估算行数 |
|:--:|------|:--:|
| 🆕 NEW | `src/templates/outputs/docs/sddu-docs-config.md.hbs` | ~60 |
| 🆕 NEW | `src/templates/outputs/docs/sddu-docs-integration.md.hbs` | ~60 |
| 🆕 NEW | `src/templates/outputs/docs/sddu-docs-deploy.md.hbs` | ~60 |
| 🆕 NEW | `src/templates/outputs/docs/sddu-docs-security.md.hbs` | ~60 |
| 🆕 NEW | `src/templates/outputs/docs/sddu-docs-export.md.hbs` | ~60 |

**验收标准**:
- [ ] 5 个文件全部创建，非空
- [ ] 每个模板开头包含定位声明
- [ ] T7（config）：包含环境变量表格、开关、参数说明
- [ ] T8（integration）：包含外部服务名称、端点、回调 URL、认证方式
- [ ] T9（deploy）：包含部署拓扑、资源配置、CI/CD 流程
- [ ] T10（security）：包含认证流程、授权矩阵、安全边界
- [ ] T12（export）：包含导出符号表 — 类型定义、公共接口、使用示例
- [ ] 全部使用 `<<变量名>>` 占位符和标准 Handlebars 语法

**验证命令**:
```bash
for f in config integration deploy security export; do
  file="src/templates/outputs/docs/sddu-docs-${f}.md.hbs"
  test -s "$file" && echo "PASS: $file exists and non-empty" || echo "FAIL: $file missing or empty"
  grep -q '文档定位' "$file" && echo "  PASS: $file has positioning declaration" || echo "  FAIL: $file missing positioning"
done
```

---

### TASK-004: 创建关系 + 元数据模板（批量 6 个）
> 创建组件关系描述和元数据支持模板 — 依赖、数据流、时序、矩阵、ADR 索引、产物溯源

| 属性 | 值 |
|------|-----|
| **复杂度** | M |
| **前置依赖** | 无（并行于 TASK-001/002/003） |
| **执行波次** | Wave 1 |
| **对应 FR** | FR-002, FR-003 |

**描述**: 
按 plan §3.3 内置模板清单，批量创建 4 个关系描述模板 + 2 个元数据支持模板。关系模板描述组件间的多种关系视图（依赖、数据流、时序、矩阵），元数据模板提供 ADR 索引和产物溯源功能。每个关系模板 ~40 行，元数据模板 ~40-50 行。

**涉及文件**:

| 操作 | 文件路径 | 估算行数 |
|:--:|------|:--:|
| 🆕 NEW | `src/templates/outputs/docs/sddu-docs-relation-deps.md.hbs` | ~40 |
| 🆕 NEW | `src/templates/outputs/docs/sddu-docs-relation-flow.md.hbs` | ~40 |
| 🆕 NEW | `src/templates/outputs/docs/sddu-docs-relation-sequence.md.hbs` | ~40 |
| 🆕 NEW | `src/templates/outputs/docs/sddu-docs-relation-matrix.md.hbs` | ~40 |
| 🆕 NEW | `src/templates/outputs/docs/sddu-docs-adr-index.md.hbs` | ~50 |
| 🆕 NEW | `src/templates/outputs/docs/sddu-docs-source.md.hbs` | ~40 |

**验收标准**:
- [ ] 6 个文件全部创建，非空
- [ ] 每个模板开头包含定位声明
- [ ] T14（relation-deps）：包含依赖关系表 — 调用方、被调用方、调用类型
- [ ] T15（relation-flow）：包含数据流描述 — 源、目标、数据格式、转换规则
- [ ] T16（relation-sequence）：包含时序描述 — 参与者、调用顺序、事件触发
- [ ] T17（relation-matrix）：包含关系矩阵 — 接口/能力对照表
- [ ] T18（adr-index）：包含 ADR 列表 — 编号、标题、状态、影响范围
- [ ] T19（source）：包含产物溯源表 — 原始文件路径、版本、最后修改时间
- [ ] 全部使用 `<<变量名>>` 占位符和标准 Handlebars 语法

**验证命令**:
```bash
for f in relation-deps relation-flow relation-sequence relation-matrix adr-index source; do
  file="src/templates/outputs/docs/sddu-docs-${f}.md.hbs"
  test -s "$file" && echo "PASS: $file exists and non-empty" || echo "FAIL: $file missing or empty"
  grep -q '文档定位' "$file" && echo "  PASS: $file has positioning declaration" || echo "  FAIL: $file missing positioning"
done
```

---

### TASK-005: 补全 Agent 指令模板核心 — §1-§6
> 将 sddu-docs.md.hbs 从占位骨架变为可执行 Agent — 核心执行逻辑

| 属性 | 值 |
|------|-----|
| **复杂度** | L |
| **前置依赖** | TASK-001, TASK-002, TASK-003, TASK-004（Wave 1） |
| **执行波次** | Wave 2 |
| **对应 FR** | FR-001, FR-001(a2), FR-009, NFR-002 |

**描述**: 
对 `src/templates/agents/sddu-docs.md.hbs` 进行核心改造。将 §5 从一行占位文字「待后续 Feature 定义」扩展为完整的 7 步可执行工作流，更新 §4 前置验证（从「扫描代码」改为「扫描 specs-tree-root」），新增 §6 输出模板选择机制（按 plan §3.4 的按内容匹配选择逻辑）。这是整个 Feature 最复杂、最核心的任务。需确保：
- 工作流步骤对齐 Agent-Native 扫描模式（ADR-001）
- 每步有明确的操作指令和工具调用（glob/read/grep/stat/bash）
- 每步结尾标注 `→ 进入步骤 N+1`
- 包含版本感知聚合（FR-001(a2)：多版本取最新）
- 包含增量更新分支逻辑（FR-009：首次全量 vs 后续增量）
- §6 输出模板节正确实现按内容匹配选择（FR-003, FR-006a）

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| ✏️ MODIFY | `src/templates/agents/sddu-docs.md.hbs`（110 行 → ~280 行，新增 ~170 行） |

**验收标准**:
- [ ] §4 前置验证改为：检查 specs-tree-root/ 存在且有 Feature 目录（不再提代码/DB 扫描）
- [ ] §5 包含 7 个明确编号的步骤（`### 步骤 N:`），每步结尾标注 `→ 进入步骤 N+1`
- [ ] 步骤 1（工作空间验证）：验证 specs-tree-root/ 存在，docs-tree-root/ 状态，EC-001/EC-002 逻辑
- [ ] 步骤 2（Feature 扫描）：使用 glob 扫描所有 Feature 目录，支持 EC-008 嵌套子 Feature
- [ ] 步骤 3（业务层级推导）：LLM 语义聚类 Feature 分组为业务域，首次持久化到 docs-overview.md 索引表
- [ ] 步骤 4~7（逐域迭代处理）：明确「只加载当前域 Feature 产物 → 提取内容 → 选模板 → 生成文档 → 释放上下文」循环
- [ ] 步骤中包含版本感知逻辑：Feature 多版本目录时取最新版本（EC-011），自然排序比较
- [ ] 步骤中包含增量更新分支：docs-tree-root/ 已存在 → 对比 mtime（通过 `stat -c %Y`）→ 仅重写变更 Feature 子树（EC-002, EC-009, FR-009）
- [ ] §6 输出模板节说明：模板库在 `src/templates/outputs/docs/` 下，列举 20 个模板的定位声明和适用场景
- [ ] §6 包含按内容匹配选择规则：LLM 读模板开头定位声明 → 判断是否适用 → 按需组合选用（对齐 plan §3.4）
- [ ] §6 包含模板加载优先级：用户 `.sddu/templates/agents/output/docs/` 同名文件优先 → 回退内置（FR-006a）
- [ ] §6 包含 EC-005（无匹配模板回退通用）、EC-006（自定义模板渲染失败回退内置）、EC-010（两处模板均不可用报错）
- [ ] 无「待后续 Feature 定义」占位文本残留

**验证命令**:
```bash
# 验证核心占位已移除
! grep -q '待后续 Feature 定义' src/templates/agents/sddu-docs.md.hbs && echo "PASS: no placeholder text" || echo "FAIL: placeholder remains"

# 验证步骤编号
grep -c '### 步骤 [1-7]:' src/templates/agents/sddu-docs.md.hbs | xargs -I{} test {} -ge 7 && echo "PASS: 7+ workflow steps" || echo "FAIL: < 7 steps"

# 验证关键关键词存在
grep -q 'docs-overview.md' src/templates/agents/sddu-docs.md.hbs && echo "PASS: references docs-overview"
grep -q 'stat -c %Y' src/templates/agents/sddu-docs.md.hbs && echo "PASS: mtime command"
grep -q '逐域迭代' src/templates/agents/sddu-docs.md.hbs && echo "PASS: per-domain iteration"

# 验证 Handlebars frontmatter 完整
grep -q '^---$' src/templates/agents/sddu-docs.md.hbs && echo "PASS: has frontmatter"
```

---

### TASK-006: 补全 Agent 指令模板规则 — §7-§10
> 添加边界定义、异常处理、示例对话对齐和完成协议

| 属性 | 值 |
|------|-----|
| **复杂度** | M |
| **前置依赖** | TASK-005 |
| **执行波次** | Wave 3 |
| **对应 FR** | FR-005, FR-007, FR-008 |
| **状态** | ✅ completed |

**描述**: 
在 TASK-005 完成的核心工作流基础上，补全 Agent 指令模板的规则、异常处理和用户交互章节。主要包括：§7 完成协议（输出路径确认、状态摘要格式）、§8 规则（更新为 specs-tree 扫描规则 + 三 Agent 边界定义）、§9 异常处理（从 5 条扩展为 EC-001~011 共 11 条完整方案）、§10 示例对话（与实际 7 步工作流对齐）。§7 边界定义包含 ADR-002 定义的 7 维度三 Agent 边界表（与 @sddu-tree/@sddu-roadmap 精确划分）。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| ✏️ MODIFY | `src/templates/agents/sddu-docs.md.hbs`（新增 ~60 行于文件 §7-§10 + 修订记录更新） |

**验收标准**:
- [ ] §7 完成协议：明确输出摘要格式（Feature 数量、版本清单、生成方式 全量/增量、耗时），含状态更新指令 `/tool sddu_update_state`
- [ ] §7 完成协议：标注完成后自动触发 `@sddu-tree` 扫描 docs-tree-root/
- [ ] §8 规则更新：规则 1 改为「扫描 specs-tree-root/ 下 Feature 的 spec.md/plan.md/state.json/ADR」（不扫描代码）
- [ ] §8 规则更新：包含 @sddu-docs/@sddu-tree/@sddu-roadmap 的 7 维度边界表（对齐 plan §2.6 / ADR-002）
- [ ] §8 规则更新：声明不触碰 `TREE.md`、`ROADMAP.md`、`docs-tree-root/` 内部 `TREE.md`
- [ ] §9 异常处理：覆盖 EC-001~EC-011 共 11 个场景，每项含「场景」和「处理方式」两列
- [ ] §9 异常处理关键场景：EC-001（空项目终止）、EC-002（增量模式入口）、EC-003（缺失文件标注）、EC-004（格式异常降级）、EC-007（权限不足兜底到对话）、EC-008（嵌套递归）、EC-011（多版本取最新）
- [ ] §10 示例对话：展示用户调用 `@sddu-docs` 后的完整交互 — 确认范围 → Feature 扫描统计 → 业务域聚类展示 → 逐域生成进展 → 完成摘要（对齐 FR-007）
- [ ] §10 示例对话：增量模式下的交互示例（展示变更检测清单）
- [ ] 修订记录更新：新增本次变更条目

**验证命令**:
```bash
# 验证 EC 覆盖
for ec in EC-001 EC-002 EC-003 EC-004 EC-005 EC-006 EC-007 EC-008 EC-009 EC-010 EC-011; do
  grep -q "$ec" src/templates/agents/sddu-docs.md.hbs && echo "PASS: $ec covered" || echo "FAIL: $ec missing"
done

# 验证边界表关键词
grep -q '@sddu-tree' src/templates/agents/sddu-docs.md.hbs && echo "PASS: tree boundary"
grep -q '@sddu-roadmap' src/templates/agents/sddu-docs.md.hbs && echo "PASS: roadmap boundary"

# 验证完成协议关键指令
grep -q 'sddu_update_state' src/templates/agents/sddu-docs.md.hbs && echo "PASS: state update command"

# 验证示例对话对齐工作流
grep -q '业务域' src/templates/agents/sddu-docs.md.hbs && echo "PASS: example references domain clustering"
grep -q '增量' src/templates/agents/sddu-docs.md.hbs && echo "PASS: example references incremental mode"
```

---

### TASK-007: 构建验证 — build-agents.cjs 编译通过
> 验证所有新增/修改的 Handlebars 模板通过现有构建流程

| 属性 | 值 |
|------|-----|
| **复杂度** | S |
| **前置依赖** | TASK-006 |
| **执行波次** | Wave 4 |
| **对应 FR** | NFR-002, NFR-003 |

**描述**: 
运行 `node scripts/build-agents.cjs` 验证所有模板文件（20 个输出模板 + 1 个修改的 agent 指令模板）能正常编译。build-agents.cjs 无需修改（按 plan §6.2 确认 — 模板平铺于 `docs/` 下，现有 `readdirSync` + `filter *.hbs` 逻辑可直接处理）。重点验证：(a) Handlebars 语法无错误，(b) 前面板（frontmatter）格式正确，(c) 产物输出到 `.opencode/` 正确位置。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| 🔍 VERIFY | `scripts/build-agents.cjs`（只运行，不修改） |
| 🔍 VERIFY | `.opencode/agents/sddu-docs.md`（构建产物） |
| 🔍 VERIFY | `.opencode/plugins/sddu/templates/output/docs/`（构建产物目录） |

**验收标准**:
- [ ] `node scripts/build-agents.cjs` 执行返回 exit code 0
- [ ] 构建输出中无 Handlebars 编译错误
- [ ] `.opencode/agents/sddu-docs.md` 构建产物存在且非空
- [ ] `.opencode/plugins/sddu/templates/output/docs/` 下包含全部 20 个模板文件

**验证命令**:
```bash
node scripts/build-agents.cjs && echo "✓ Build passed"

# 验证构建产物
test -s .opencode/agents/sddu-docs.md && echo "PASS: sddu-docs agent built" || echo "FAIL: agent not built"
count=$(ls .opencode/plugins/sddu/templates/output/docs/*.hbs 2>/dev/null | wc -l)
test $count -eq 20 && echo "PASS: 20 output templates built" || echo "FAIL: expected 20, got $count"
```

---

### TASK-008: 交叉一致性校验 + FR 覆盖清单 + 状态更新
> 验证 Agent 指令模板中的引用与实际的模板文件一致，逐项勾检 plan §9 审查清单

| 属性 | 值 |
|------|-----|
| **复杂度** | S |
| **前置依赖** | TASK-006, TASK-007 |
| **执行波次** | Wave 4 |
| **对应 FR** | FR-001 ~ FR-009 (全覆盖) |

**描述**: 
执行三项最终验证：(1) Agent 指令模板 §6 中引用的模板文件名与 `src/templates/outputs/docs/` 下实际文件一致，无遗漏或多余引用；(2) 按 plan §9 审查清单（C1-C12）逐项勾检，确保每条 FR/EC 有对应实现；(3) 更新 state.json 的 phase 从 "planned" → "tasked"，添加 phaseHistory 条目。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| 🔍 VERIFY | `src/templates/agents/sddu-docs.md.hbs`（对照验证） |
| 🔍 VERIFY | `src/templates/outputs/docs/`（对照验证） |
| ✏️ MODIFY | `.sddu/specs-tree-root/specs-tree-docs-agent-optimization/state.json` |

**验收标准**:
- [x] Agent 模板 §6 引用的模板名称全部在 `src/templates/outputs/docs/` 下存在实际文件
- [x] `src/templates/outputs/docs/` 下的 20 个文件全部被 Agent 模板 §6 覆盖（无孤立模板）
- [x] 审查清单 C1-C12：12 项全部通过
- [x] state.json `phase` 字段值为 `"builded"`
- [x] state.json `phaseHistory` 更新 `"builded"` 条目时间戳
- [x] state.json `files` 新增 `"agentTemplate"` + `"templateFiles"` 条目

**审查清单（plan §9 C1-C12）**:
- [x] **C1**: §5 工作流从占位变为分批可执行流程（轻量预扫描 + 逐域迭代），每步含操作指令 → FR-001
- [x] **C2**: 工作流程包含版本感知聚合逻辑 → FR-001(a2)
- [x] **C3**: 输出为目录树结构，每级含入口文档，其余由模板库按需选用 → FR-002
- [x] **C4**: Agent 指令模板 §8 包含 7 维度三 Agent 边界表 → FR-005
- [x] **C5**: §6 输出模板节正确实现了按内容匹配选择逻辑 → FR-006, FR-006a
- [x] **C6**: 模板库包含 20 个内置模板，LLM 按内容匹配选择 → FR-003
- [x] **C7**: 异常处理表覆盖 EC-001 ~ EC-011 全部场景 → FR-001(f)
- [x] **C8**: 增量更新采用统一增量模式（首次=全量，后续=仅变更 Feature 子树）→ FR-009
- [x] **C9**: 示例对话与 §5 工作流步骤一致 → FR-007
- [x] **C10**: §6 关于输出格式的描述由模板库定义，不写死固定格式 → FR-008
- [x] **C11**: Handlebars 语法使用标准 `#each`/`#if`/`<<变量名>>`，无自定义 helper → NFR-002
- [x] **C12**: 20 个模板文件遵循 `.hbs` 扩展名约定，可通过 build-agents.cjs 正常构建 → NFR-003

**验证命令**:
```bash
# 一致性检查
echo "=== Template File Count ==="
ls src/templates/outputs/docs/*.hbs | wc -l

echo "=== Agent Template Reference Check ==="
grep -c 'sddu-docs-' src/templates/agents/sddu-docs.md.hbs

# 验证 state.json 更新
python3 -c "
import json
with open('.sddu/specs-tree-root/specs-tree-docs-agent-optimization/state.json') as f:
    s = json.load(f)
assert s['phase'] == 'tasked', 'FAIL: phase not tasked'
assert 'tasks.md' in s.get('files', {}).values(), 'FAIL: tasks not in files'
tasks_phases = [h['phase'] for h in s.get('phaseHistory', [])]
assert 'tasked' in tasks_phases, 'FAIL: tasked not in phaseHistory'
print('PASS: state.json validated')
"
```

---

## 3. 任务汇总
> 任务数量、复杂度和波次的统计总览

| 统计项 | 数值 |
|--------|:--:|
| 总任务数 | 8 |
| S 级 (简单) | 2 |
| M 级 (中等) | 5 |
| L 级 (复杂) | 1 |
| 执行波次 | 4 |

## 4. 执行策略
> 各波次的执行说明

| 波次 | 任务 | 策略 |
|:--:|------|------|
| 1 | TASK-001, TASK-002, TASK-003, TASK-004 | **并行执行** — 4 个模板创建任务互不依赖，可同一批次完成。TASK-001 创建目录和标杆模板后，其余 3 个任务按 T1 模式并行构建。每个 M 级任务包含 5-8 个文件的批量创建 |
| 2 | TASK-005 | **阻塞执行** — 等待 Wave 1 全部完成。Agent 指令模板核心改造，依赖完整的模板清单（§6 需列举 20 个模板）。L 级任务，需人工监督关键步骤（特别是 §5 工作流逻辑正确性） |
| 3 | TASK-006 | **阻塞执行** — 等待 TASK-005 完成。在核心工作流就位后补充规则、异常处理和示例对话。M 级任务，对齐 FR-005/FR-007/FR-008 |
| 4 | TASK-007, TASK-008 | **并行执行** — 等待 TASK-006 完成。构建验证和一致性校验可同时进行。均为 S 级，自动化执行 |

**关键路径**: TASK-001~004 → TASK-005 → TASK-006 → TASK-008
> TASK-007（构建验证）可在 TASK-006 完成后与 TASK-008 并行，不阻塞关键路径

---

## 5. 增量任务（plan v2.9 约束对齐）

> 以下为 plan v1.9→v2.9 迭代中新增的 7 类设计约束所对应的增量任务。前置任务 TASK-001~008 已完成，20 个模板 + Agent 模板均已就位。增量任务聚焦于修改现有文件，不新增模板。

### 5.1 增量依赖拓扑总览

```
Wave 1 ─── (无依赖，全部并行)
  TASK-009 [M]  模板 T1~T10 三合一改造（输出文件名 + 变量重命名 + 定位去限定词）
  TASK-010 [M]  模板 T11~T20 三合一改造（输出文件名 + 变量重命名 + 定位去限定词）
  TASK-011 [M]  Agent 模板 §5 步骤 3（N1~N5 命名规则）+ §8（X1~X3 禁止事项）

Wave 2 ─── (依赖 TASK-009, TASK-010)
  TASK-012 [S]  Agent 模板 §6.2 表定位声明同步

Wave 3 ─── (依赖 Wave 1 + Wave 2)
  TASK-013 [S]  构建验证 + 交叉一致性校验 + 版本升级
```

### 5.2 增量任务列表

---

#### TASK-009: 模板 T1~T10 三合一改造
> 对前 10 个输出模板施加 3 类变更：输出文件名元数据、变量重命名、定位声明去限定词

| 属性 | 值 |
|------|-----|
| **复杂度** | M |
| **前置依赖** | 无（Wave 1 并行） |
| **执行波次** | Wave 1 |
| **对应 FR** | FR-002, FR-003, FR-008 |
| **状态** | ✅ completed |

**描述**: 
根据 plan v2.5（模板自声明输出文件名）、v2.7（`<<entity_name>>`→`<<doc_subject>>` 重命名）、v2.8（定位声明去限定词）三项设计约束，对模板 T1~T10（`sddu-docs-overview` / `object` / `api` / `data` / `page` / `flow` / `config` / `integration` / `deploy` / `security`）执行以下 3 类修改：

**变更 A — 添加 `> **输出文件名**` 元数据行**（10 个文件各 +1 行）：
在 `> **文档定位**` 行后插入 `> **输出文件名**: xxx` 行。固定文件名（T1: `docs-overview.md`）直接写死；模板表达式（T2~T10: `<<doc_subject>>.md` / `<<doc_subject>>-api.md` / 等）使用 Handlebars 变量。

**变更 B — `<<entity_name>>` → `<<doc_subject>>` 全局替换**（8 个文件含此变量）：
- `overview.md.hbs`（标题）：`# <<entity_name>> — 全景入口` → `# <<doc_subject>> — 全景入口`
- `object.md.hbs`（标题 + 属性表）：`# <<entity_name>>` + `| **对象名称** | <<entity_name>> |`
- `flow.md.hbs`（概述表）：`| **本流程涉及业务对象** | \`<<entity_name>>\` |`
- `config.md.hbs`（标题 + 概述）：`` # <<entity_name>> — 配置项 `` + `记录<<entity_name>>涉及的所有可配置项`
- `integration.md.hbs`（标题 + 概述）：`` # <<entity_name>> — 第三方集成 `` + `记录<<entity_name>>依赖和提供的...`
- `deploy.md.hbs`（标题 + 概述）：`` # <<entity_name>> — 部署信息 `` + `记录<<entity_name>>的部署拓扑...`
- `security.md.hbs`（标题 + 概述）：`` # <<entity_name>> — 安全模型 `` + `记录<<entity_name>>的认证授权体系...`
- `api.md.hbs` + `data.md.hbs` + `page.md.hbs`：不含 `<<entity_name>>`，仅变更 A/C

**变更 C — 定位声明去限定词**（7 个文件含旧模式）：
按 plan v2.8 §3.3 要求，模板定位声明改为集合语义：
- T2 `object`: `描述单个业务实体的职责...` → `描述业务实体的职责、属性、关联关系和生命周期`（去「单个」）
- T3 `api`: `含 API 路由的文档，描述 REST...` → `API 路由文档 — REST 端点、请求/响应 Schema、状态码`
- T4 `data`: `含数据模型的文档，描述表结构...` → `数据模型文档 — 表结构、字段、索引、关联关系`
- T5 `page`: `含前端页面的文档，描述路由信息...` → `前端页面文档 — 路由、组件树、交互流程`
- T6 `flow`: `含业务流程的文档，描述状态机...` → `业务流程文档 — 状态机、流转规则、异常路径`
- T7 `config`: `含配置项的文档，记录环境变量...` → `配置项文档 — 环境变量、功能开关、参数说明`
- T8 `integration`: `含第三方集成的文档，记录外部服务...` → `第三方集成文档 — 外部服务、回调、认证方式`
- T9 `deploy`: `含部署信息的文档，记录部署拓扑...` → `部署信息文档 — 拓扑、资源、CI/CD`
- T10 `security`: `含安全策略的文档，记录认证流程...` → `安全策略文档 — 认证流程、授权矩阵、安全边界`
- T1 `overview`: 定位声明无需修改（已是集合语义）

**涉及文件**:

| 操作 | 文件路径 | 变更 |
|:--:|------|------|
| ✏️ MODIFY | `src/templates/outputs/docs/sddu-docs-overview.md.hbs` | A+B |
| ✏️ MODIFY | `src/templates/outputs/docs/sddu-docs-object.md.hbs` | A+B+C |
| ✏️ MODIFY | `src/templates/outputs/docs/sddu-docs-api.md.hbs` | A+C |
| ✏️ MODIFY | `src/templates/outputs/docs/sddu-docs-data.md.hbs` | A+C |
| ✏️ MODIFY | `src/templates/outputs/docs/sddu-docs-page.md.hbs` | A+C |
| ✏️ MODIFY | `src/templates/outputs/docs/sddu-docs-flow.md.hbs` | A+B+C |
| ✏️ MODIFY | `src/templates/outputs/docs/sddu-docs-config.md.hbs` | A+B+C |
| ✏️ MODIFY | `src/templates/outputs/docs/sddu-docs-integration.md.hbs` | A+B+C |
| ✏️ MODIFY | `src/templates/outputs/docs/sddu-docs-deploy.md.hbs` | A+B+C |
| ✏️ MODIFY | `src/templates/outputs/docs/sddu-docs-security.md.hbs` | A+B+C |

**验收标准**:
- [x] T1~T10 每个模板元数据头含 `> **输出文件名**: ...` 行（位于 `> **文档定位**` 之后）
- [x] T1 输出文件名为固定值 `docs-overview.md`
- [x] T2~T10 输出文件名为模板表达式（如 `<<doc_subject>>-api.md`），与 plan §3.3 表一致
- [x] 8 个含 `<<entity_name>>` 的模板全部替换为 `<<doc_subject>>`，无残留
- [x] T2~T10 定位声明中无「含...的文档」「单个」等限定词
- [x] `api.md.hbs` + `data.md.hbs` + `page.md.hbs` 不含 `<<entity_name>>`（原始即无，变更 A+C 后验证仍无残留）
- [x] 所有 `#each`/`#if` 块配对完好（变更前后计数一致）

**验证命令**:
```bash
# 验证输出文件名元数据存在（T1~T10 各 1 行）
for f in overview object api data page flow config integration deploy security; do
  grep -q '输出文件名' "src/templates/outputs/docs/sddu-docs-${f}.md.hbs" && echo "PASS: $f has output filename" || echo "FAIL: $f missing output filename"
done

# 验证无 <<entity_name>> 残留
grep -rn 'entity_name' src/templates/outputs/docs/sddu-docs-{overview,object,api,data,page,flow,config,integration,deploy,security}.md.hbs \
  && echo "FAIL: entity_name residue found" || echo "PASS: entity_name cleared"

# 验证 <<doc_subject>> 存在（至少 8 个文件含此变量）
count=$(grep -l 'doc_subject' src/templates/outputs/docs/sddu-docs-{overview,object,flow,config,integration,deploy,security}.md.hbs 2>/dev/null | wc -l)
test $count -ge 7 && echo "PASS: doc_subject in $count files" || echo "WARN: doc_subject in $count files"

# 验证 T1 输出文件名固定
grep -q '输出文件名.*docs-overview.md' src/templates/outputs/docs/sddu-docs-overview.md.hbs && echo "PASS: T1 fixed filename"

# 验证定位声明去限定词
! grep -q '含.*的文档' src/templates/outputs/docs/sddu-docs-{api,data,page,flow,config,integration,deploy,security}.md.hbs 2>/dev/null \
  && echo "PASS: no '含X的文档' pattern" || echo "FAIL: old pattern found"
! grep -q '单个' src/templates/outputs/docs/sddu-docs-object.md.hbs \
  && echo "PASS: no '单个' in T2" || echo "FAIL: '单个' found in T2"
```

---

#### TASK-010: 模板 T11~T20 三合一改造
> 对后 10 个输出模板施加 3 类变更：输出文件名元数据、变量重命名、定位声明去限定词

| 属性 | 值 |
|------|-----|
| **复杂度** | M |
| **前置依赖** | 无（Wave 1 并行） |
| **执行波次** | Wave 1 |
| **对应 FR** | FR-002, FR-003, FR-008 |
| **状态** | ✅ completed |

**描述**: 
对模板 T11~T20（`sddu-docs-event` / `export` / `command` / `relation-deps` / `relation-flow` / `relation-sequence` / `relation-matrix` / `adr-index` / `source` / `command-tree`）执行与 TASK-009 相同的 3 类修改。

**变更 A — 添加 `> **输出文件名**` 元数据行**（10 个文件各 +1 行）：
- T11 `event`: `<<doc_subject>>-event.md`
- T12 `export`: `<<doc_subject>>-export.md`
- T13 `command`: `<<doc_subject>>-command.md`
- T14 `relation-deps`: `<<doc_subject>>-deps.md`
- T15 `relation-flow`: `<<doc_subject>>-dataflow.md`
- T16 `relation-sequence`: `<<doc_subject>>-sequence.md`
- T17 `relation-matrix`: `<<doc_subject>>-matrix.md`
- T18 `adr-index`: `adr-index.md`（固定值）
- T19 `source`: `source.md`（固定值）
- T20 `command-tree`: `<<doc_subject>>-command-tree.md`

**变更 B — `<<entity_name>>` → `<<doc_subject>>` 全局替换**（7 个文件含此变量）：
- `export.md.hbs`（标题 + 概述）：`` # <<entity_name>> — 导出符号表 `` + `记录<<entity_name>>对外暴露的...`
- `relation-deps.md.hbs`（标题）：`` # <<entity_name>> — 依赖关系 ``
- `relation-flow.md.hbs`（标题）：`` # <<entity_name>> — 数据流 ``
- `relation-sequence.md.hbs`（标题）：`` # <<entity_name>> — 时序关系 ``
- `relation-matrix.md.hbs`（标题）：`` # <<entity_name>> — 关系矩阵 ``
- `adr-index.md.hbs`（标题）：`` # <<entity_name>> — ADR 索引 ``
- `source.md.hbs`（标题）：`` # <<entity_name>> — 产物溯源 ``
- `event.md.hbs` + `command.md.hbs` + `command-tree.md.hbs`：不含 `<<entity_name>>`，仅变更 A/C

**变更 C — 定位声明去限定词**（4 个文件含旧模式）：
- T11 `event`: `含领域事件的文档，描述事件类型...` → `领域事件文档 — 事件类型、生产者、消费者、触发条件`
- T12 `export`: `含导出符号表的文档，记录类型定义...` → `导出符号表文档 — 类型定义、公共接口、使用示例`
- T13 `command`: `含命令的文档，描述命令名称...` → `命令列表文档 — 命令名称、参数说明、管道组合`
- T20 `command-tree`: `该命令组的完整命令树结构，展示命令与子命令层级` → `命令树的完整层级结构`
- T14~T19：定位声明为集合语义，无需修改

**涉及文件**:

| 操作 | 文件路径 | 变更 |
|:--:|------|------|
| ✏️ MODIFY | `src/templates/outputs/docs/sddu-docs-event.md.hbs` | A+C |
| ✏️ MODIFY | `src/templates/outputs/docs/sddu-docs-export.md.hbs` | A+B+C |
| ✏️ MODIFY | `src/templates/outputs/docs/sddu-docs-command.md.hbs` | A+C |
| ✏️ MODIFY | `src/templates/outputs/docs/sddu-docs-relation-deps.md.hbs` | A+B |
| ✏️ MODIFY | `src/templates/outputs/docs/sddu-docs-relation-flow.md.hbs` | A+B |
| ✏️ MODIFY | `src/templates/outputs/docs/sddu-docs-relation-sequence.md.hbs` | A+B |
| ✏️ MODIFY | `src/templates/outputs/docs/sddu-docs-relation-matrix.md.hbs` | A+B |
| ✏️ MODIFY | `src/templates/outputs/docs/sddu-docs-adr-index.md.hbs` | A+B |
| ✏️ MODIFY | `src/templates/outputs/docs/sddu-docs-source.md.hbs` | A+B |
| ✏️ MODIFY | `src/templates/outputs/docs/sddu-docs-command-tree.md.hbs` | A+C |

**验收标准**:
- [ ] T11~T20 每个模板元数据头含 `> **输出文件名**: ...` 行
- [ ] T18 `adr-index`、T19 `source` 为固定文件名
- [ ] T11~T17, T20 为模板表达式（含 `<<doc_subject>>`），与 plan §3.3 表一致
- [ ] 7 个含 `<<entity_name>>` 的模板全部替换为 `<<doc_subject>>`，无残留
- [ ] T11~T13, T20 定位声明无「含...的文档」「该命令组」等旧模式
- [ ] 所有 `#each`/`#if` 块配对完好

**验证命令**:
```bash
# 验证输出文件名元数据存在（T11~T20 各 1 行）
for f in event export command relation-deps relation-flow relation-sequence relation-matrix adr-index source command-tree; do
  grep -q '输出文件名' "src/templates/outputs/docs/sddu-docs-${f}.md.hbs" && echo "PASS: $f has output filename" || echo "FAIL: $f missing output filename"
done

# 验证无 <<entity_name>> 残留
grep -rn 'entity_name' src/templates/outputs/docs/sddu-docs-{event,export,command,relation-deps,relation-flow,relation-sequence,relation-matrix,adr-index,source,command-tree}.md.hbs \
  && echo "FAIL: entity_name residue found" || echo "PASS: entity_name cleared"

# 验证 T18/T19 固定文件名
grep -q '输出文件名.*adr-index.md' src/templates/outputs/docs/sddu-docs-adr-index.md.hbs && echo "PASS: T18 fixed filename"
grep -q '输出文件名.*source.md' src/templates/outputs/docs/sddu-docs-source.md.hbs && echo "PASS: T19 fixed filename"

# 验证定位声明去限定词
! grep -q '含.*的文档' src/templates/outputs/docs/sddu-docs-{event,export,command}.md.hbs 2>/dev/null \
  && echo "PASS: no '含X的文档' pattern" || echo "FAIL: old pattern found"
! grep -q '该命令组' src/templates/outputs/docs/sddu-docs-command-tree.md.hbs \
  && echo "PASS: no '该命令组' in T20" || echo "FAIL: '该命令组' found"
```

---

#### TASK-011: Agent 模板新增 §5 步骤 3 命名规则 + §8 禁止事项
> 在 Agent 指令模板中注入 plan v2.9 新增的子目录命名规则（N1~N5）和产物禁止事项（X1~X3）

| 属性 | 值 |
|------|-----|
| **复杂度** | M |
| **前置依赖** | 无（Wave 1 并行，只读 plan v2.9 概念，不依赖模板文件） |
| **执行波次** | Wave 1 |
| **对应 FR** | FR-001, FR-002 |
| **状态** | ✅ completed |

**描述**: 
在 Agent 指令模板 `src/templates/agents/sddu-docs.md.hbs` 的 §5（工作流程）和 §8（规则）中新增 plan v2.9 定义的两组约束，解决 E2E 验证发现的偏离（Agent 使用了 Feature 目录名作为子目录名、未使用模板渲染）。

**变更 1 — §5 步骤 3「业务层级推导」追加子目录命名规则 N1~N5**（对齐 plan §2.8.2）：
在步骤 3 第 2 条「LLM 语义聚类」之后、第 3 条「首次持久化」之前，插入子目录命名约束块（Markdown 表格）：

| # | 规则 | 说明 |
|---|------|------|
| **N1** | **业务语义命名** | 子目录名是 LLM 语义聚类产生的业务域/模块名称。使用业务术语（如 `用户域/`、`订单域/`、`认证模块/`），语言由 Feature 产物中的主导语言决定 |
| **N2** | **禁止泄漏 Feature 目录名** | 禁止直接拷贝 `specs-tree-root/` 下的 Feature 目录名（如 `feature-api/`）作为子目录名 |
| **N3** | **层级自相似，固定入口文件命名** | 每级入口文件固定为 `docs-overview.md`。子目录命名与父级规则相同，不添加 `docs-tree-` 前缀 |
| **N4** | **版本号不参与目录名** | 版本号降级为元数据行，不作为目录名（`用户域-v2/` 错误，`用户域/` 正确） |
| **N5** | **首次聚类持久化** | 首次运行时的业务域分组结果写入根级 `docs-overview.md` Feature 索引表，后续增量仅调整变更 Feature 域归属 |

**变更 2 — §8「规则」追加产物禁止事项 X1~X3**（对齐 plan §2.7）：
在规则列表末尾（第 7 条之后）、§8.1 三 Agent 边界表之前，插入禁止事项块：

| # | 禁止行为 | 说明 | 正确做法 |
|---|---------|------|---------|
| ❌ **X1** | **原文照搬 spec.md / plan.md / ADR** | 不得复制粘贴原始产物文件到 docs-tree-root | 使用 T19 模板标注出处链接 |
| ❌ **X2** | **以 Feature 目录名作为子目录名** | 子目录名必须是业务语义名称 | 遵循 N1~N5 命名规则 |
| ❌ **X3** | **更改根级入口文件名** | 根级入口固定命名为 `docs-overview.md` | 使用 T1 模板（输出文件名 `docs-overview.md`） |

**变更 3 — 验证 §5 步骤 2/4 docs-tree-root 引用**（对齐 plan §2.7）：
- 步骤 1 已正确使用 `.sddu/docs-tree-root/`
- 步骤 2 使用 `stat -c %Y` 获取 mtime，路径引用正确
- 步骤 4 使用 `.sddu/docs-tree-root/{业务域}/`，无需修改
- 如发现 `docs-tree-xxx`（泛指占位符）误用为实际目录名，修正为 `docs-tree-root/` 或业务语义名称

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| ✏️ MODIFY | `src/templates/agents/sddu-docs.md.hbs`（新增 ~45 行于 §5 步骤 3 + §8） |

**验收标准**:
- [ ] §5 步骤 3 第 2 条「LLM 语义聚类」之后含 N1~N5 命名规则表
- [ ] §8 规则列表之后含 X1~X3 禁止事项表（位于 §8.1 三 Agent 边界表之前）
- [ ] X1~X3 表包含「禁止行为」「说明」「正确做法」三列
- [ ] N1~N5 表包含「规则」「说明」两列
- [ ] §5 步骤 2/4 中不包含 `docs-tree-xxx` 泛指占位符作为目录引用（如存在则修正）
- [ ] 变更不破坏现有步骤编号和 `→ 进入步骤 N+1` 跳转逻辑

**验证命令**:
```bash
# 验证 N1~N5 规则存在
for n in N1 N2 N3 N4 N5; do
  grep -q "$n" src/templates/agents/sddu-docs.md.hbs && echo "PASS: $n present" || echo "FAIL: $n missing"
done

# 验证 X1~X3 禁止事项存在
for x in X1 X2 X3; do
  grep -q "$x" src/templates/agents/sddu-docs.md.hbs && echo "PASS: $x present" || echo "FAIL: $x missing"
done

# 验证禁止事项关键词
grep -q '原文照搬.*spec.*plan.*ADR' src/templates/agents/sddu-docs.md.hbs && echo "PASS: X1 verbatim-copy rule"
grep -q 'Feature 目录名.*子目录名' src/templates/agents/sddu-docs.md.hbs && echo "PASS: X2 feature-dir-name rule"
grep -q '更改根级入口文件名' src/templates/agents/sddu-docs.md.hbs && echo "PASS: X3 root-entry-name rule"

# 验证无 docs-tree-xxx 误用为目录引用（排除解释性说明）
! grep -P 'docs-tree-(?!root\b)[a-z]+/' src/templates/agents/sddu-docs.md.hbs 2>/dev/null \
  && echo "PASS: no docs-tree-xxx literal directory refs" || echo "WARN: check context"

# 验证步骤编号连续性
grep -c '### 步骤 [1-7]:' src/templates/agents/sddu-docs.md.hbs | xargs -I{} test {} -eq 7 && echo "PASS: 7 steps intact"
```

---

#### TASK-012: Agent 模板 §6.2 表定位声明同步
> 同步 Agent 指令模板中的模板清单表定位声明，使其与 TASK-009/010 更新后的模板实际定位一致

| 属性 | 值 |
|------|-----|
| **复杂度** | S |
| **前置依赖** | TASK-009, TASK-010 |
| **执行波次** | Wave 2 |
| **对应 FR** | FR-003, FR-006 |

**描述**: 
Agent 指令模板 §6.2「模板清单与适用场景」表中的「定位声明」列，必须与模板文件 `.hbs` 中 `> **文档定位**: ...` 行的实际文本保持一致。TASK-009/010 更新了 20 个模板的定位声明后，本任务同步 §6.2 表中的对应行。

**更新规则**（对齐 plan v2.8 §3.3）：
- T2: `描述单个业务实体的职责...` → `描述业务实体的职责、属性、关联关系和生命周期`
- T3: `含 API 路由的文档 — REST...` → `API 路由文档 — REST 端点、请求/响应 Schema、状态码`
- T4: `含数据模型的文档 — 表结构...` → `数据模型文档 — 表结构、字段、索引、关联关系`
- T5: `含前端页面的文档 — 路由...` → `前端页面文档 — 路由、组件树、交互流程`
- T6: `含业务流程的文档 — 状态机...` → `业务流程文档 — 状态机、流转规则、异常路径`
- T7: `含配置项的文档 — 环境变量...` → `配置项文档 — 环境变量、开关、参数说明`
- T8: `含第三方集成的文档 — 外部服务...` → `第三方集成文档 — 外部服务、回调、认证方式`
- T9: `含部署信息的文档 — 拓扑...` → `部署信息文档 — 拓扑、资源、CI/CD`
- T10: `含安全策略的文档 — 认证流程...` → `安全策略文档 — 认证流程、授权矩阵、安全边界`
- T11: `含领域事件的文档 — 事件类型...` → `领域事件文档 — 事件类型、生产者、消费者、触发条件`
- T12: `含导出符号表的文档 — 类型定义...` → `导出符号表文档 — 类型定义、公共接口、使用示例`
- T13: `含命令的文档 — 命令名称...` → `命令列表文档 — 命令名称、参数说明、管道组合`
- T20: `命令树 — 命令组的完整层级结构` → `命令树 — 命令树的完整层级结构`
- T1, T14~T19：定位声明无需修改（已为集合语义）

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| ✏️ MODIFY | `src/templates/agents/sddu-docs.md.hbs`（§6.2 表 13 行变更） |

**验收标准**:
- [ ] §6.2 表中 T2~T13, T20 的定位声明与对应 `.hbs` 模板文件的 `> **文档定位**` 行文本一致
- [ ] 表中无「含...的文档」「单个」「该命令组」等旧模式
- [ ] 表中行数仍为 20（T1~T20），无增删
- [ ] 修订记录新增本次变更条目

**验证命令**:
```bash
# 验证 §6.2 表定位声明与模板文件一致（抽样对比 T3, T10, T13）
agent_t3=$(grep 'T3.*API' src/templates/agents/sddu-docs.md.hbs | head -1)
template_t3=$(grep '文档定位' src/templates/outputs/docs/sddu-docs-api.md.hbs | head -1)
echo "Agent T3: $agent_t3"
echo "Template T3: $template_t3"

# 验证旧模式已清除
! grep -q '含.*的文档' src/templates/agents/sddu-docs.md.hbs && echo "PASS: no old pattern in agent"
! grep -q '单个.*实体' src/templates/agents/sddu-docs.md.hbs && echo "PASS: no '单个' in agent"
! grep -q '该命令组' src/templates/agents/sddu-docs.md.hbs && echo "PASS: no '该命令组' in agent"

# 验证表行数
grep -c '| T[0-9]' src/templates/agents/sddu-docs.md.hbs | xargs -I{} test {} -ge 20 && echo "PASS: >=20 T-rows"
```

---

#### TASK-013: 构建验证 + 交叉一致性校验 + 版本升级
> 运行构建流程，验证所有增量变更编译通过；执行交叉一致性校验；升级版本号

| 属性 | 值 |
|------|-----|
| **复杂度** | S |
| **前置依赖** | TASK-009, TASK-010, TASK-011, TASK-012 |
| **执行波次** | Wave 3 |
| **对应 FR** | NFR-002, NFR-003 |

**描述**: 
在增量变更全部完成后执行三项收尾工作：

**1. 构建验证**：
- 运行 `node scripts/build-agents.cjs` 验证所有 Handlebars 模板编译通过
- 重点验证：`<<doc_subject>>` 变量语法正确（出现在 `> **输出文件名**` 行时不破坏构建）、20 个模板全部复制到 `.opencode/plugins/sddu/templates/output/docs/`

**2. 交叉一致性校验**：
- Agent 模板 §6.2 引用的模板名 ↔ `src/templates/outputs/docs/` 实际文件 1:1 匹配
- 所有 20 个模板均有 `> **输出文件名**` 元数据
- 无 `<<entity_name>>` 残留于任何 `.hbs` 文件
- 无「含...的文档」「单个」「该命令组」等旧模式残留
- §5 步骤 3 含 N1~N5、§8 含 X1~X3
- 所有 `#each`/`#if` 块完好闭合

**3. 版本升级**：
- tasks.md 版本 v2.0（已完成）
- tasks.json `version` → `"v2.0"`，更新 `totalTasks`、`totalWaves`、`complexityDistribution`
- state.json `phase` → `"tasked"`，新增 phaseHistory 条目

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| 🔍 VERIFY | `scripts/build-agents.cjs`（只运行，不修改） |
| 🔍 VERIFY | `.opencode/plugins/sddu/templates/output/docs/`（构建产物） |
| ✏️ MODIFY | `.sddu/specs-tree-root/specs-tree-docs-agent-optimization/tasks.json` |
| ✏️ MODIFY | `.sddu/specs-tree-root/specs-tree-docs-agent-optimization/state.json` |

**验收标准**:
- [ ] `node scripts/build-agents.cjs` 执行返回 exit code 0
- [ ] 构建输出中无 Handlebars 编译错误
- [ ] `.opencode/plugins/sddu/templates/output/docs/` 下含 20 个 `.hbs` 文件
- [ ] Agent 模板 §6.2 引用的模板名与实际文件 1:1 匹配
- [ ] 全项目无 `<<entity_name>>` 残留
- [ ] 全项目无「含...的文档」定位声明旧模式
- [ ] tasks.json `version` = `"v2.0"`，`totalTasks` = 13，`totalWaves` = 7
- [ ] state.json `phase` = `"tasked"`，phaseHistory 含新 `tasked` 条目

**验证命令**:
```bash
# 构建验证
node scripts/build-agents.cjs && echo "✓ Build passed"

# 构建产物数量
count=$(ls .opencode/plugins/sddu/templates/output/docs/*.hbs 2>/dev/null | wc -l)
test $count -eq 20 && echo "PASS: 20 output templates in plugin dir" || echo "FAIL: expected 20, got $count"

# 全局残留检查
echo "=== entity_name residue ==="
grep -rn 'entity_name' src/templates/outputs/docs/ src/templates/agents/sddu-docs.md.hbs || echo "PASS: zero residue"

echo "=== Old positioning pattern ==="
grep -rn '含.*的文档' src/templates/outputs/docs/ src/templates/agents/sddu-docs.md.hbs || echo "PASS: zero old pattern"

# Handlebars 闭合检查
for f in src/templates/outputs/docs/*.hbs src/templates/agents/sddu-docs.md.hbs; do
  open=$(grep -c '#each' "$f" 2>/dev/null || echo 0)
  close=$(grep -c '/each' "$f" 2>/dev/null || echo 0)
  [ "$open" != "$close" ] && echo "MISMATCH each: $f ($open/$close)"
  open=$(grep -c '#if' "$f" 2>/dev/null || echo 0)
  close=$(grep -c '/if' "$f" 2>/dev/null || echo 0)
  [ "$open" != "$close" ] && echo "MISMATCH if: $f ($open/$close)"
done

# state.json 验证
python3 -c "
import json
with open('.sddu/specs-tree-root/specs-tree-docs-agent-optimization/state.json') as f:
    s = json.load(f)
assert s['phase'] == 'tasked', 'FAIL: phase not tasked'
tasks_phases = [h['phase'] for h in s.get('phaseHistory', [])]
assert 'tasked' in tasks_phases, 'FAIL: tasked not in phaseHistory'
print('PASS: state.json validated')
"
```

---

### 5.3 增量任务汇总

| 统计项 | 数值 |
|--------|:--:|
| 增量任务数 | 5 |
| S 级 (简单) | 2 |
| M 级 (中等) | 3 |
| L 级 (复杂) | 0 |
| 执行波次 | 3 |
| 修改文件数 | 21（20 模板 + 1 Agent 模板 + 2 元数据文件） |

### 5.4 增量执行策略

| 波次 | 任务 | 策略 |
|:--:|------|------|
| 1 | TASK-009, TASK-010, TASK-011 | **并行执行** — TASK-009/010 各改 10 个模板（互不重叠），TASK-011 改 Agent 模板（§5+§8 与模板文件独立）。3 个任务可同时执行 |
| 2 | TASK-012 | **阻塞执行** — 等待 TASK-009/010 完成。Agent §6.2 表需与更新后的模板定位声明一致 |
| 3 | TASK-013 | **阻塞执行** — 等待所有变更完成。构建验证 + 交叉一致性 + 版本升级 |

**关键路径**: TASK-009/010 → TASK-012 → TASK-013
> TASK-011 与 TASK-009/010 并行，不阻塞关键路径

### 5.5 合并后总体统计

| 统计项 | 原 v1.0 | 增量 v2.0 | 合计 |
|--------|:--:|:--:|:--:|
| 总任务数 | 8 | +5 | 13 |
| S 级 | 2 | +2 | 4 |
| M 级 | 5 | +3 | 8 |
| L 级 | 1 | +0 | 1 |
| 波次数 | 4 | +3 | 7 |

---

## 修订记录
> 记录本文档的版本变更历史

| 版本 | 变更说明 | 日期 | 修订人 |
|------|---------|------|--------|
| v1.0 | 初始创建 — 基于 plan v1.9 分解为 8 个任务、4 个波次；覆盖 20 个模板（4 批）+ 1 个 Agent 指令模板（2 段）+ 2 个验证任务 | 2026-07-05 | SDDU Tasks Agent |
| v2.0 | 增量任务 — 基于 plan v2.9 新约束（模板自声明输出文件名、`<<entity_name>>`→`<<doc_subject>>` 重命名、定位声明去限定词、子目录命名规则 N1~N5、禁止事项 X1~X3），新增 TASK-009~013 共 5 个任务、3 个波次；涉及 21 个文件的修改 | 2026-07-05 | SDDU Tasks Agent |
