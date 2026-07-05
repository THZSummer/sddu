# 任务分解：@sddu-docs Agent 补全与优化

> **文档定位**: SDDU 任务清单 — 将技术方案分解为可并行执行的原子任务，作为 build 阶段的输入  
> **前置依赖**: plan.md（技术方案）、spec.md（需求规范）  
> **创建人**: SDDU Tasks Agent  
> **创建时间**: 2026-07-05  
> **版本**: v3.0  
> **更新人**: SDDU Tasks Agent  
> **更新时间**: 2026-07-05  
> **更新说明**: v3.0 — 增量任务：基于 plan v3.3 双模式架构（YAML 描述修正、双模式入口、§5.2 代码扫描 5 步骤工作流、C1~C4 冲突检测、EC-001 增强），新增 8 个任务、4 个波次

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

---

## 6. 增量任务（plan v3.3 代码扫描双模式 + 冲突检测）

> 以下为 plan v2.9→v3.3 迭代中新增的 5 类设计变更所对应的增量任务。前置任务 TASK-001~013 已完成，20 个模板 + Agent 模板 specs-tree 主模式均已就位。增量任务聚焦于修改 Agent 指令模板（`src/templates/agents/sddu-docs.md.hbs`），新增代码扫描双模式入口、§5.2 代码扫描工作流、C1~C4 冲突检测，不新增模板文件。

### 6.1 增量依赖拓扑总览

```
Wave 8 ─── (无依赖，独立段落并行)
  TASK-014 [S]  YAML frontmatter description 修正
  TASK-015 [S]  §1 角色定位双模式更新
  TASK-016 [M]  §4 前置验证触发短语路由 + EC-001 增强

Wave 9 ─── (依赖 TASK-014, TASK-015, TASK-016)
  TASK-017 [L]  §5 拆分 §5.1 + §5.2 代码扫描工作流（步骤 8~10, 12）
  TASK-018 [M]  §5.2 步骤 11 冲突检测 C1~C4

Wave 10 ─── (依赖 TASK-017, TASK-018)
  TASK-019 [M]  §8 规则双模式 + §9 EC 模式适用范围标注
  TASK-020 [S]  §10 示例对话代码扫描模式

Wave 11 ─── (依赖 Wave 9 + Wave 10)
  TASK-021 [S]  构建验证 + 交叉一致性校验 + 版本升级
```

### 6.2 增量任务列表

---

#### TASK-014: YAML frontmatter description 修正
> 将 Agent 模板 YAML description 从虚假承诺改为诚实描述

| 属性 | 值 |
|------|-----|
| **复杂度** | S |
| **前置依赖** | 无（Wave 8 并行） |
| **执行波次** | Wave 8 |
| **状态** | ✅ completed |
| **对应 plan** | §2.9.4 修正清单 #1, §2.9.3 决策 #4 |

**描述**: 
修正 Agent 模板 YAML frontmatter（第 2 行）的 `description` 字段。当前描述为「扫描代码、配置、Schema 等实际产物，生成项目业务与技术全景视图」——这是对项目源码级全景的承诺，与 §1/§8 定义的 specs-tree-root 扫描矛盾。根据 plan v3.3 双模式架构，改为如实反映两种能力：

**原**：
```
description: SDDU 项目全景专家 - 扫描代码、配置、Schema 等实际产物，生成项目业务与技术全景视图
```

**新**：
```
description: SDDU 项目全景专家 - 主扫描 .sddu/specs-tree-root/ 下各 Feature 的过程产物（spec.md / plan.md / state.json / ADR），聚合为项目业务与技术全景视图；支持用户指令下扫描项目代码和配置生成项目快照
```

**涉及文件**:

| 操作 | 文件路径 | 变更 |
|:--:|------|------|
| ✏️ MODIFY | `src/templates/agents/sddu-docs.md.hbs` | YAML description 行替换（~1 行） |

**验收标准**:
- [x] YAML `description` 不再包含「扫描代码、配置、Schema 等实际产物」等原文本
- [x] 新描述包含「主扫描 specs-tree-root」开头
- [x] 新描述包含「支持用户指令下扫描项目代码和配置生成代码级全景」
- [x] YAML 格式完整（`---` 分隔符、`mode: subagent`、`temperature: 0.3`、`permission:` 块不变）

**验证命令**:
```bash
# 验证原描述已替代
! grep -q '扫描代码、配置、Schema 等实际产物' src/templates/agents/sddu-docs.md.hbs \
  && echo "PASS: old description removed" || echo "FAIL: old description remains"

# 验证新描述关键词
grep -q '主扫描.*specs-tree-root' src/templates/agents/sddu-docs.md.hbs \
  && echo "PASS: main mode description"
grep -q '用户指令.*扫描项目代码' src/templates/agents/sddu-docs.md.hbs \
  && echo "PASS: code scanning description"

# 验证 YAML 完整性
grep -c '^---$' src/templates/agents/sddu-docs.md.hbs | xargs -I{} test {} -eq 2 \
  && echo "PASS: YAML frontmatter intact"
```

---

#### TASK-015: §1 角色定位双模式更新
> 将 §1 职责描述从单一 specs-tree 扫描改为双模式

| 属性 | 值 |
|------|-----|
| **复杂度** | S |
| **前置依赖** | 无（Wave 8 并行） |
| **执行波次** | Wave 8 |
| **对应 plan** | §2.9.4 修正清单 #3 |

**描述**: 
更新 Agent 模板 §1「角色定位与职责边界」（第 16 行）的职责描述，从纯 specs-tree 扫描改为双模式声明。原「负责扫描 `.sddu/specs-tree-root/` 下各 Feature 的过程产物…」改为：

```
你是 SDDU 项目全景专家。主模式：扫描 `.sddu/specs-tree-root/` 下各 Feature 的过程产物（spec.md、plan.md、state.json、ADR），抽取并聚合业务信息与技术信息，生成按业务层级组织的项目全景目录树（`.sddu/docs-tree-root/`）。辅助模式：响应用户明确指令（如「扫描代码生成全景」），扫描项目代码和配置生成代码快照。
```

同时更新「不负责」条目，体现双模式下的能力边界（代码扫描模式不超能力天花板——无法还原设计意图和技术决策，详见 plan §2.10.2）。

**涉及文件**:

| 操作 | 文件路径 | 变更 |
|:--:|------|------|
| ✏️ MODIFY | `src/templates/agents/sddu-docs.md.hbs` | §1 职责描述改写（~3 行变更） |

**验收标准**:
- [ ] §1 职责描述包含「主模式」和「辅助模式」两个模式的分离声明
- [ ] 主模式描述保留「扫描 specs-tree-root/ → 生成 docs-tree-root/」核心链路
- [ ] 辅助模式描述包含「用户明确指令」「代码快照」关键词
- [ ] 「不负责」条目更新（如：辅助模式不负责推断设计意图）

**验证命令**:
```bash
# 验证双模式关键词
grep -q '主模式' src/templates/agents/sddu-docs.md.hbs && echo "PASS: main mode declared"
grep -q '辅助模式' src/templates/agents/sddu-docs.md.hbs && echo "PASS: auxiliary mode declared"
grep -q '代码快照' src/templates/agents/sddu-docs.md.hbs && echo "PASS: code snapshot mentioned"

# 验证核心链路保留
grep -q 'specs-tree-root' src/templates/agents/sddu-docs.md.hbs && echo "PASS: specs-tree-root referenced"
grep -q 'docs-tree-root' src/templates/agents/sddu-docs.md.hbs && echo "PASS: docs-tree-root referenced"
```

---

#### TASK-016: §4 前置验证触发短语路由 + EC-001 增强
> 在 §4 前置验证中插入触发短语检测逻辑，实现双模式入口路由

| 属性 | 值 |
|------|-----|
| **复杂度** | M |
| **前置依赖** | 无（Wave 8 并行） |
| **执行波次** | Wave 8 |
| **对应 plan** | §2.9.4 修正清单 #2, #4；§2.10.1 触发条件；§2.10.5 §4 影响 |
| **对应 FR/EC** | FR-001 |
| **状态** | ✅ completed |

**描述**: 
在 Agent 模板 §4「前置验证」（约第 38 行）的**最开头**，在「检查 specs-tree-root/ 是否存在」之前，插入触发短语检测路由逻辑。同时增强 EC-001 错误提示，追加代码扫描模式引导。

**变更 1 — 插入触发短语路由逻辑**（§4 开头 +~15 行）：

```
## 4. ⚠️ 前置验证（必须执行）
> 启动前必须检查的环境和文件条件，不满足则拒绝执行

**首先判断用户意图**：检查用户输入是否包含以下代码扫描触发短语（任一匹配即进入代码扫描分支）：
- "扫描代码生成全景" / "扫描代码" / "分析项目代码" / "分析代码" / "代码模式" / "代码快照"

→ **匹配**：跳过 specs-tree-root 验证，直接进入 §5.2「代码扫描模式」
→ **不匹配**：继续执行以下 specs-tree 主模式前置验证

在开始项目全景生成前（specs-tree 主模式）：
1. 检查 `.sddu/specs-tree-root/` 目录是否存在
2. ...
```

**变更 2 — EC-001 错误提示增强**（在第 3 步末尾追加一行）：
在现有的 EC-001 终止提示后追加：
```
💡 若您的项目尚未使用 SDDU 工作流，可尝试 "@sddu-docs 扫描代码生成全景" 进入代码扫描模式（产出为代码快照，非完整全景）
```

**涉及文件**:

| 操作 | 文件路径 | 变更 |
|:--:|------|------|
| ✏️ MODIFY | `src/templates/agents/sddu-docs.md.hbs` | §4 开头插入路由逻辑（+~15 行）+ EC-001 提示末尾追加（+~1 行） |

**验收标准**:
- [x] §4 开头最先执行的是触发短语检测（在 specs-tree-root 检查之前）
- [x] 触发短语集包含「扫描代码」「分析项目代码」「scan code」「不依赖 SDDU」「直接分析项目」「代码级全景」六类触发关键词
- [x] 匹配成功时明确指示「直接跳转到 §5.2（代码扫描分支）」
- [x] 不匹配时继续执行现有 EC-001~EC-002 逻辑（行为不变）
- [x] EC-001 错误提示末尾包含「💡」引导提示，指向代码扫描模式
- [x] 提示文本包含「基于项目实际代码生成全景」的质量说明

**验证命令**:
```bash
# 验证触发短语路由在 §4 开头
grep -n '触发短语' src/templates/agents/sddu-docs.md.hbs | head -1

# 验证核心触发短语
for phrase in "扫描代码" "分析代码" "代码模式" "代码快照"; do
  grep -q "$phrase" src/templates/agents/sddu-docs.md.hbs && echo "PASS: trigger '$phrase'" || echo "FAIL: missing '$phrase'"
done

# 验证路由跳转指令
grep -q '§5.2' src/templates/agents/sddu-docs.md.hbs && echo "PASS: routes to §5.2"
grep -q '代码扫描模式' src/templates/agents/sddu-docs.md.hbs && echo "PASS: code scan mode referenced"

# 验证 EC-001 增强提示
grep -q '扫描代码生成全景' src/templates/agents/sddu-docs.md.hbs && echo "PASS: EC-001 enhanced"
grep -q '代码快照.*非完整全景' src/templates/agents/sddu-docs.md.hbs && echo "PASS: quality disclaimer"
```

---

#### TASK-017: §5 拆分 §5.1 + §5.2 代码扫描工作流（步骤 8~10, 12）
> 将现有的统一 §5 拆分为主模式 §5.1 + 新增 §5.2 代码扫描分支，定义代码快照生成的核心流程

| 属性 | 值 |
|------|-----|
| **复杂度** | L |
| **前置依赖** | TASK-014, TASK-015, TASK-016（Wave 8） |
| **执行波次** | Wave 9 |
| **状态** | ✅ completed |
| **对应 plan** | §2.10.4 工作流分支设计；§2.10.2 能力边界 CS1~CS5；§2.10.3 产物标注与覆盖行为 |
| **对应 FR/EC** | FR-001 |

**描述**: 
对 `src/templates/agents/sddu-docs.md.hbs` 的 §5 进行结构性拆分和扩展。这是 v3.0 最核心的变更。

**变更 1 — §5 标题拆分**：
原：
```
## 5. 工作流程
```
改为：
```
## 5. 工作流程
> specs-tree 主模式（§5.1）和代码扫描辅助模式（§5.2），由 §4 触发短语检测路由决定执行哪个分支

### 5.1 specs-tree 主模式（默认）
```
在现有 7 步工作流末尾（步骤 7 之后）插入：

```
---

### 5.2 代码扫描模式（用户指令触发）
> 响应用户明确指令（如「@sddu-docs 扫描代码生成全景」），扫描项目源代码和配置文件，生成代码快照。产出为代码级项目视图，不包含设计意图、业务语义和技术决策分析。

#### 步骤 8: 模式确认

**目标**: 向用户确认进入代码扫描模式，告知产出限制。

1. 向用户输出以下确认信息：
   ```
   ⚠️ 代码扫描模式将分析项目源代码和配置，生成代码快照。
   此模式无法还原设计意图和技术决策。
   产物将标注"未经 SDDU 工作流验证"。
   
   产物将写入 .sddu/docs-tree-root/（若该目录已有 specs-tree 模式产物，将被覆盖）。
   是否继续？（y/n）
   ```
2. 等待用户确认。用户拒绝 → 终止执行

→ 进入步骤 9

#### 步骤 9: 项目结构扫描

**目标**: 扫描项目根目录，从 5 个维度收集代码级信息。

1. **CS1 目录结构**: 使用 `ls -R --max-depth=2` 或 glob 扫描一级/二级子目录，识别关键目录名（如 `src/`、`tests/`、`config/`、`docs/`）
2. **CS2 技术栈**: 使用 glob 检测依赖声明文件（`package.json` / `go.mod` / `Cargo.toml` / `requirements.txt` / `pom.xml` / `pyproject.toml` 等），提取技术栈清单（语言、框架、关键依赖及版本）
3. **CS3 API 面**: 使用 grep/glob 检测路由定义文件（`routes/*.ts`、`@RequestMapping` 注解、`app.get()` 调用、`@Get()` 装饰器等），提取 API 端点清单（方法 + 路径 + 处理器函数名）
4. **CS4 配置信息**: 使用 glob 检测配置文件（`.env` / `config/*.yaml` / `docker-compose.yml` / `Dockerfile` / CI 配置文件），提取部署信息摘要（服务端口、环境变量名、外部依赖）
5. **CS5 数据模型**: 使用 glob 检测模型文件（`*.sql` / `schema/*.prisma` / `models/*.ts` / ORM 实体定义），提取数据表/实体清单（表名、关键字段、索引）

→ 进入步骤 10

#### 步骤 10: 生成代码快照文档

**目标**: 按 CS1~CS5 五个维度组织代码快照文档结构，写入 `docs-tree-root/`。

1. 生成目录结构文档：`docs-tree-root/模块划分.md`（目录 → 模块映射表）
2. 生成技术栈文档：`docs-tree-root/技术栈清单.md`
3. 生成 API 端点清单：`docs-tree-root/API端点清单.md`
4. 生成部署信息：`docs-tree-root/部署信息摘要.md`
5. 生成数据模型清单：`docs-tree-root/数据模型清单.md`
6. 生成根级入口文档：`docs-tree-root/docs-overview.md`（整合 5 个维度 + 内部导航链接）

**产物标注**：上述每个 `.md` 文件头部必须标注：
```
> ⚠️ **数据来源**: 代码扫描生成（用户指令触发），未经 SDDU 工作流验证。不包含设计意图、业务语义和技术决策分析。
```

**产物覆盖行为**：代码扫描模式产物直接写入 `.sddu/docs-tree-root/`。若该目录存在由 specs-tree 模式生成的产物，将被覆盖。Agent 在步骤 8 模式确认时已告知用户此行为。每个文件通过「数据来源」标注区分来源。

→ 进入步骤 12
```

**设计理由**：步骤编号从 8 开始（而非从 1），在 Agent 指令模板中自然形成分段——步骤 1~7 是主模式，步骤 8~12 是辅助模式。步骤 11 由 TASK-018 单独实现。

**涉及文件**:

| 操作 | 文件路径 | 变更 |
|:--:|------|------|
| ✏️ MODIFY | `src/templates/agents/sddu-docs.md.hbs` | §5 标题拆分 + §5.1 包装 + 新增 §5.2（步骤 8~10,12，~120 行） |

**验收标准**:
- [ ] §5 标题行新增双模式概览说明（一行）
- [ ] 原 7 步工作流被包裹为「### 5.1 specs-tree 主模式（默认）」，内部步骤编号不变（步骤 1~7）
- [ ] 新增「### 5.2 代码扫描模式（用户指令触发）」
- [ ] 步骤 8 包含模式确认交互（⚠️ 警告 + y/n 确认）
- [ ] 步骤 9 按 CS1~CS5 五个维度定义扫描操作（每维度 1-2 行 + 示例命令）
- [ ] 步骤 10 定义 6 个产物文档（模块划分/技术栈/API/部署/数据模型/入口 docs-overview.md）
- [ ] 步骤 10 定义产物标注格式（「⚠️ **数据来源**: 代码扫描生成…」）
- [ ] 步骤 10 包含覆盖行为说明（统一写入 docs-tree-root/）
- [ ] 步骤 12（完成报告）列出扫描到的模块数、技术栈项数、API 端点数、配置项数、数据表数
- [ ] 步骤 12 提示用户产物为代码快照的局限
- [ ] §5.1 和 §5.2 之间有清晰的分隔线（`---`）
- [ ] 不破坏现有步骤 1~7 的结构和「→ 进入步骤 N+1」跳转链
- [ ] 新增内容总计约 120-150 行

**验证命令**:
```bash
# 验证 §5 拆分
grep -q '### 5.1 specs-tree 主模式' src/templates/agents/sddu-docs.md.hbs && echo "PASS: §5.1 exists"
grep -q '### 5.2 代码扫描模式' src/templates/agents/sddu-docs.md.hbs && echo "PASS: §5.2 exists"

# 验证步骤 8~12 存在
for step in 8 9 10 11 12; do
  grep -q "步骤 $step" src/templates/agents/sddu-docs.md.hbs && echo "PASS: step $step present" || echo "FAIL: step $step missing"
done

# 验证 CS1~CS5 维度
for cs in CS1 CS2 CS3 CS4 CS5; do
  grep -q "$cs" src/templates/agents/sddu-docs.md.hbs && echo "PASS: $cs defined" || echo "FAIL: $cs missing"
done

# 验证产物标注格式
grep -q '⚠️.*数据来源.*代码扫描生成' src/templates/agents/sddu-docs.md.hbs && echo "PASS: data source annotation"
grep -q '未经 SDDU 工作流验证' src/templates/agents/sddu-docs.md.hbs && echo "PASS: quality disclaimer"

# 验证 y/n 确认交互
grep -q '是否继续.*y/n' src/templates/agents/sddu-docs.md.hbs && echo "PASS: user confirmation"

# 验证主模式步骤 1~7 仍在
for step in 1 2 3 4 5 6 7; do
  grep -q "步骤 $step:" src/templates/agents/sddu-docs.md.hbs && echo "PASS: step $step still present" || echo "FAIL: step $step lost"
done

# 统计新增行数（近似）
old_lines=468
new_lines=$(wc -l < src/templates/agents/sddu-docs.md.hbs)
delta=$((new_lines - old_lines))
echo "Delta: +$delta lines (target: +120~150)"
```

---

#### TASK-018: §5.2 步骤 11 冲突检测 C1~C4
> 在代码扫描工作流的步骤 10 和步骤 12 之间插入四类设计-实现冲突检测

| 属性 | 值 |
|------|-----|
| **复杂度** | M |
| **前置依赖** | TASK-014, TASK-015, TASK-016（Wave 8 — 与 TASK-017 同波次 Wave 9） |
| **执行波次** | Wave 9 |
| **对应 plan** | §2.10.6 冲突检测机制（C1~C4 + 检测流程 + 产物格式 + 覆盖保留规则 + D8~D11 决策） |
| **对应 FR/EC** | FR-001 |
| **状态** | ✅ completed |

**描述**: 
在 TASK-017 创建的 §5.2 框架中，步骤 10「生成代码快照文档」和步骤 12「完成报告」之间，插入步骤 11「设计-实现一致性检测」。这是 plan v3.3 区别于 v3.1~v3.2 的核心增量。

**变更内容**（在步骤 10 和步骤 12 之间插入 ~80 行）：

```
→ 进入步骤 11

#### 步骤 11: 设计-实现一致性检测

**目标**: 若 specs-tree-root/ 存在，对比代码实际实现与设计文档（spec.md/plan.md/ADR），检测四类偏差。只检测不修复（D8）。

**前置检查**: 
- glob/read 检查 `.sddu/specs-tree-root/` 是否存在且至少含一个 Feature 目录
- 不满足 → **跳过**步骤 11，直接进入步骤 12，完成报告中标注「无可对比的设计文档，未执行一致性检测」（D10）

**四类冲突定义**（对齐 plan §2.10.6.2）:

| # | 冲突类型 | 检测方式 | 示例 |
|---|:------:|---------|------|
| C1 | **技术选型漂移** | 对比 plan.md/ADR 中的技术栈记录与代码依赖声明文件（package.json/go.mod 等）的实际依赖 | spec.md 写 JWT，代码已用 OAuth2（next-auth）；plan.md 写 Node.js 16，引擎声明 >=20 |
| C2 | **模块增删** | 对比 specs-tree Feature 目录对应的模块与代码目录结构中的模块 | specs-tree 有 feature-payment，代码无对应 src/payment/；代码有 src/notification/ 但 specs-tree 无对应 Feature |
| C3 | **API 差异** | 对比 spec.md FR 章节的 API 端点（方法+路径）与步骤 9 CS3 扫描到的路由定义 | spec 定义 POST /api/v1/login，路由为 POST /api/v1/auth/signin；参数签名不同 |
| C4 | **架构偏离** | 对比 plan.md 描述的架构设计（部署拓扑、数据流方向、组件关系、通信协议）与步骤 9/10 代码中的实际实现 | plan 设计 REST 同步调用，代码改为消息队列；plan 设计单体，代码已有 docker-compose 多服务 |

**检测流程**（对齐 plan §2.10.6.3）:

**步骤 11-1: 前置检查** — glob/read 检查 specs-tree-root/ 存在且非空；不满足 → 跳过，进入步骤 12

**步骤 11-2: 加载设计文档** — 读取 specs-tree-root/ 下各 Feature 的 spec.md（FR 章节、API 描述）、plan.md（技术栈、架构设计、部署拓扑）、ADR（技术决策记录）

**步骤 11-3: 逐类对比**:
- C1 技术选型: 从 plan.md/ADR 提取依赖项 → 对比步骤 9 扫描到的实际依赖 → 语义对比（关注整体方案变更）
- C2 模块对比: 从 specs-tree 提取 Feature 目录名 → 对比步骤 9 代码目录 → 差集分析（代码有但设计无 / 设计有但代码无）
- C3 API 对比: 从 spec.md FR 提取端点 → 对比步骤 9 CS3 路由 → 对比路径、方法、参数
- C4 架构对比: 从 plan.md 提取架构描述 → 对比步骤 9/10 配置/部署推断的实际架构模式

**步骤 11-4: 生成一致性报告** — 按 §2.10.6.4 格式（含 Markdown 冲突表 + 检测摘要），**追加**到根级 `docs-overview.md` 末尾：

```markdown
---

## ⚠️ 设计-实现一致性报告

> 以下对比 specs-tree-root/ 中设计文档与代码实际实现。仅检测差异，不自动修改任何文件。

| # | 冲突类型 | specs-tree 记录 | 代码实际实现 | 建议操作 |
|---|:------:|----------------|-------------|---------|
| ... | ... | ... | ... | ... |

**检测摘要**: 共检测 N 个 Feature，发现 M 处不一致
- C1 技术选型漂移: X 处 / C2 模块增删: X 处 / C3 API 差异: X 处 / C4 架构偏离: X 处
```

若未检测到冲突，报告为：「✅ 未检测到设计文档与代码实现的明显冲突。设计文档与代码实现基本一致。」

**覆盖保留规则**（对齐 plan §2.10.6.5）:
- 旧版有一致性报告 + 本次执行了检测 → 新版替换旧版
- 旧版有一致性报告 + 本次跳过了检测 → 保留旧版，标注「（上次检测于 \<timestamp\>）」
- 旧版无报告 + 本次执行了检测 → 追加新版
- 旧版无报告 + 本次跳过了检测 → 不追加
- 一致性报告追加在 docs-overview.md 末尾，不混合业务/技术全景章节（D9）
- 报告由 Agent 内联生成，不依赖独立模板文件（D11）

→ 进入步骤 12
```

**涉及文件**:

| 操作 | 文件路径 | 变更 |
|:--:|------|------|
| ✏️ MODIFY | `src/templates/agents/sddu-docs.md.hbs` | 在 §5.2 步骤 10 之后插入步骤 11（~80 行） |

**验收标准**:
- [ ] 步骤 11 位于步骤 10（生成代码快照）和步骤 12（完成报告）之间
- [ ] 步骤 11 开头有前置检查说明（specs-tree-root 不存在 → 跳过）
- [ ] 四种冲突类型 C1~C4 均有定义（含检测方式 + 示例）
- [ ] C1 对比 plan.md/ADR 技术栈 vs 代码依赖声明文件
- [ ] C2 对比 specs-tree Feature 列表 vs 代码目录结构（差集分析）
- [ ] C3 对比 spec.md FR 端点 vs 代码路由定义
- [ ] C4 对比 plan.md 架构设计 vs 代码组件关系/部署文件
- [ ] 检测流程按 11-1~11-4 四子步骤组织
- [ ] 产物格式包含 Markdown 冲突表（冲突类型/specs-tree 记录/代码实现/建议操作 4 列）+ 检测摘要
- [ ] 未检测到冲突时输出「✅ 未检测到明显冲突…」
- [ ] 覆盖保留规则 4 场景完整覆盖
- [ ] 报告追加在 docs-overview.md 末尾（`---` 分隔 + 独立章节标题）
- [ ] 设计决策标注：D8 只检测不修复 / D9 追加不替换正文 / D10 无对比文档则跳过 / D11 不新增独立模板

**验证命令**:
```bash
# 验证步骤 11 存在
grep -q "步骤 11.*一致性检测" src/templates/agents/sddu-docs.md.hbs && echo "PASS: step 11 title"

# 验证 C1~C4 四类冲突定义
for c in C1 C2 C3 C4; do
  grep -c "$c" src/templates/agents/sddu-docs.md.hbs | xargs -I{} test {} -ge 2 && echo "PASS: $c defined" || echo "FAIL: $c underdefined"
done

# 验证子步骤 11-1~11-4
for ss in 11-1 11-2 11-3 11-4; do
  grep -q "步骤 $ss" src/templates/agents/sddu-docs.md.hbs && echo "PASS: sub-step $ss" || echo "FAIL: sub-step $ss missing"
done

# 验证关键关键词
for kw in "只检测不修复" "前置检查" "覆盖保留规则" "设计-实现一致性报告" "未检测到明显冲突"; do
  grep -q "$kw" src/templates/agents/sddu-docs.md.hbs && echo "PASS: keyword '$kw'" || echo "FAIL: keyword '$kw' missing"
done

# 验证报告格式关键词
grep -q '冲突类型.*specs-tree 记录.*代码实际实现' src/templates/agents/sddu-docs.md.hbs && echo "PASS: report table format"
grep -q '检测摘要' src/templates/agents/sddu-docs.md.hbs && echo "PASS: detection summary"

# 验证 D8~D11 决策引用
for d in D8 D9 D10 D11; do
  grep -q "$d" src/templates/agents/sddu-docs.md.hbs && echo "PASS: decision $d referenced" || echo "WARN: $d not referenced"
done
```

---

#### TASK-019: §8 规则双模式 + §9 EC 模式适用范围标注
> 为双模式架构更新规则体系和异常处理表

| 属性 | 值 |
|------|-----|
| **复杂度** | M |
| **前置依赖** | TASK-017, TASK-018（Wave 9） |
| **执行波次** | Wave 10 |
| **对应 plan** | §2.10.5 对 §7/§8/§9 的影响分析 |
| **对应 FR/EC** | FR-005 |

**描述**: 
在 Agent 模板的 §8（规则）和 §9（异常处理）中体现双模式架构的差异。

**变更 1 — §8「规则」新增代码扫描模式规则**（在现有 10 条规则末尾追加 ~22 行）：

在第 10 条规则「根级入口固定（X3）」之后、§8.1「三 Agent 精确边界」之前插入：

```
### 8.0 模式专属规则

以下规则明确标注适用范围：

**specs-tree 主模式专属规则**（已在上方列出）：
- 规则 1~10 — 适用于 specs-tree 主模式，约束 Feature 产物扫描、模板驱动的输出、子目录命名、禁止事项

**代码扫描模式专属规则**：
11. **不自动触发**：代码扫描模式仅在用户输入包含触发短语时激活（§4 路由），Agent 不在缺乏 specs-tree-root 时自作主张降级（plan §2.9.3 决策 #2）
12. **能力天花板声明**：代码扫描产物头部必须标注「未经 SDDU 工作流验证」，明确区分代码快照与完整全景（plan §2.10.2）
13. **不推断意图**：代码扫描模式不推断设计意图、业务语义和技术决策（如「为什么选这个框架」「模块 A 和 B 的业务关系」），这些信息仅能从 SDDU 过程产物中提取（plan §2.10.2 能力天花板）
14. **可覆盖**：代码扫描模式产物写入 docs-tree-root/，若同名文件存在（来自 specs-tree 模式），直接覆盖。用户在步骤 8 确认时已知情（plan §2.10.3）
15. **冲突检测可选**：步骤 11 冲突检测仅在 specs-tree-root/ 存在时执行；不存在则跳过并标注（plan §2.10.6 D10）
```

**变更 2 — §9「异常处理」追加模式适用范围标注**（在 EC 表前加一行注释）：

在 §9 标题行后、EC 表之前插入：
```
> **适用范围**: EC-001~EC-011 适用于 specs-tree 主模式。代码扫描模式的异常处理在 §5.2 各步骤的内联注释中定义（如：无 package.json → 标注「未检测到依赖声明文件」；无配置文件 → 标注「未检测到配置文件」），不占用独立 EC 编号（对齐 plan §2.10.5 §8 异常处理影响评估）。
```

**变更 3 — EC-001 更新模式引用**：
在 EC-001 的「处理方式」列中已有行为不变，但需确认触发短语路由已在 §4 实现（TASK-016）。

**涉及文件**:

| 操作 | 文件路径 | 变更 |
|:--:|------|------|
| ✏️ MODIFY | `src/templates/agents/sddu-docs.md.hbs` | §8 追加规则 11~15（~22 行）+ §9 加适用范围标注（~3 行） |

**验收标准**:
- [ ] §8 新增「### 8.0 模式专属规则」分隔小节
- [ ] 明确标注「specs-tree 主模式专属规则」（规则 1~10）和「代码扫描模式专属规则」（规则 11~15）
- [ ] 规则 11 包含「不自动触发」声明
- [ ] 规则 12 包含「能力天花板声明」
- [ ] 规则 13 包含「不推断意图」
- [ ] 规则 14 包含「可覆盖」和「用户知情」
- [ ] 规则 15 包含「冲突检测可选」
- [ ] §9 标题后有一行适用范围标注（明确 EC-001~011 仅适用主模式）
- [ ] 标注说明代码扫描异常处理在 §5.2 内联定义
- [ ] 三 Agent 边界表（§8.1）保持不变

**验证命令**:
```bash
# 验证模式专属规则段存在
grep -q '模式专属规则' src/templates/agents/sddu-docs.md.hbs && echo "PASS: mode-specific rules section"
grep -q '代码扫描模式专属规则' src/templates/agents/sddu-docs.md.hbs && echo "PASS: code scan rules subtitle"

# 验证规则 11~15 关键词
for rule_num in 11 12 13 14 15; do
  grep -q "$rule_num" src/templates/agents/sddu-docs.md.hbs && echo "PASS: rule $rule_num present" || echo "FAIL: rule $rule_num missing"
done

# 验证关键规则内容
grep -q '不自动触发' src/templates/agents/sddu-docs.md.hbs && echo "PASS: rule 11 no-auto-trigger"
grep -q '未经 SDDU 工作流验证' src/templates/agents/sddu-docs.md.hbs && echo "PASS: rule 12 capability ceiling"
grep -q '不推断.*设计意图' src/templates/agents/sddu-docs.md.hbs && echo "PASS: rule 13 no-intent-inference"
grep -q '可覆盖' src/templates/agents/sddu-docs.md.hbs && echo "PASS: rule 14 overwrite"

# 验证 §9 适用范围标注
grep -q 'EC-001.*EC-011.*适用于.*主模式' src/templates/agents/sddu-docs.md.hbs && echo "PASS: §9 scope annotation"

# 验证三 Agent 边界表不变
grep -c '7 维度' src/templates/agents/sddu-docs.md.hbs | xargs -I{} test {} -ge 1 && echo "PASS: boundary table intact"
```

---

#### TASK-020: §10 示例对话代码扫描模式
> 在示例对话章节中新增代码扫描模式的完整交互示例

| 属性 | 值 |
|------|-----|
| **复杂度** | S |
| **前置依赖** | TASK-017, TASK-018（Wave 9） |
| **执行波次** | Wave 10 |
| **对应 plan** | §2.10.5 §10 影响评估 |
| **对应 FR/EC** | FR-007 |

**描述**: 
在 Agent 模板 §10「示例对话」中，现有的 §10.1 全量模式和 §10.2 增量模式之后，新增 §10.3 代码扫描模式示例对话。展示用户通过「扫描代码生成全景」触发短语进入代码扫描分支的完整交互流程——从触发识别 → 模式确认 → 五维度扫描 → 冲突检测 → 完成摘要。

**变更**（在 §10.2 末尾之后追加 ~45 行）：

```
### 10.3 代码扫描模式（用户指令触发）

**用户**: `@sddu-docs 扫描代码生成全景`

**你**:

```
🔍 检测到代码扫描触发短语 → 进入代码扫描模式

[步骤 8/12] 模式确认
  ⚠️ 代码扫描模式将分析项目源代码和配置，生成代码快照。
  此模式无法还原设计意图和技术决策。
  产物将标注"未经 SDDU 工作流验证"。

  产物将写入 .sddu/docs-tree-root/（若已有 specs-tree 模式产物将被覆盖）。
  是否继续？（y/n）

<用户确认 y>

[步骤 9/12] 项目结构扫描
  CS1 目录结构: 识别到 12 个一级子目录 — src/ tests/ config/ docs/ scripts/ dist/ ...
  CS2 技术栈: 检测到 package.json → Node.js 20 + TypeScript 5.x + Express 4.18
               检测到依赖: zod, jsonwebtoken, bcrypt, prisma
  CS3 API 面: 扫描到 15 个路由端点（src/routes/）— GET/POST/PUT/DELETE
  CS4 配置信息: 检测到 .env 模板、docker-compose.yml, Dockerfile, .github/workflows/ci.yml
  CS5 数据模型: 检测到 prisma/schema.prisma — 8 个数据表, 3 个关系

[步骤 10/12] 生成代码快照文档
  📝 生成模块划分文档 · docs-tree-root/模块划分.md
  📝 生成技术栈清单 · docs-tree-root/技术栈清单.md
  📝 生成 API 端点清单 · docs-tree-root/API端点清单.md (15 endpoints)
  📝 生成部署信息 · docs-tree-root/部署信息摘要.md
  📝 生成数据模型清单 · docs-tree-root/数据模型清单.md (8 tables)
  📝 生成根级入口 · docs-tree-root/docs-overview.md

[步骤 11/12] 设计-实现一致性检测
  ✅ 检测到 specs-tree-root/ 含 8 个 Feature
  对比设计文档 vs 代码实现...
  
  ⚠️ 发现 3 处不一致：
  C1 技术选型漂移: feature-auth/plan.md 记录 JWT，代码使用 next-auth (OAuth2)
  C3 API 差异: feature-api/spec.md 定义 POST /api/v1/login → 代码路由 POST /api/v1/auth/signin
  C2 模块增删: specs-tree 含 feature-legacy，代码中无对应目录
  
  一致性报告已追加至 docs-tree-root/docs-overview.md

[步骤 12/12] 完成摘要
  ────────────────────────────────────
  🏗️ 代码快照生成完成
  
  - 扫描到模块数: 12
  - 技术栈项数: 16
  - API 端点数: 15
  - 配置项数: 8
  - 数据表数: 8
  - 冲突检测: 3 处不一致（C1×1, C2×1, C3×1）
  
  ⚠️ 此产物为代码快照，非完整全景。
  如需包含设计意图的全景视图，请先完成 Feature 的 spec/plan 后运行 @sddu-docs。
  
  产物路径: .sddu/docs-tree-root/
  ────────────────────────────────────
```
```

**涉及文件**:

| 操作 | 文件路径 | 变更 |
|:--:|------|------|
| ✏️ MODIFY | `src/templates/agents/sddu-docs.md.hbs` | §10 新增 §10.3（~45 行） |

**验收标准**:
- [ ] §10.3 标题存在「代码扫描模式（用户指令触发）」
- [ ] 示例对话以 `@sddu-docs 扫描代码生成全景` 作为用户输入
- [ ] 对话展示步骤 8~12 的完整流程（含步骤编号 `/12`）
- [ ] 步骤 9 展示 CS1~CS5 五个维度的扫描摘要
- [ ] 步骤 10 展示 6 个产物文件的生成列表
- [ ] 步骤 11 展示冲突检测结果（含具体 C1/C2/C3 示例）
- [ ] 步骤 12 完成摘要含模块数、技术栈项数、API 端点数、配置项数、数据表数
- [ ] 步骤 12 末尾提示「代码快照，非完整全景」及完整全景触发方式
- [ ] 示例整体对齐 §5.2 步骤 8~12 的结构

**验证命令**:
```bash
# 验证 §10.3 存在
grep -q '### 10.3 代码扫描模式' src/templates/agents/sddu-docs.md.hbs && echo "PASS: §10.3 section"

# 验证步骤编号为 /12
grep -c '步骤 8/12' src/templates/agents/sddu-docs.md.hbs | xargs -I{} test {} -ge 1 && echo "PASS: step 8/12"
grep -c '步骤 12/12' src/templates/agents/sddu-docs.md.hbs | xargs -I{} test {} -ge 1 && echo "PASS: step 12/12"

# 验证 CS1~CS5 出现在示例中
grep -q 'CS1.*目录结构' src/templates/agents/sddu-docs.md.hbs && echo "PASS: CS1 in example"
grep -q 'CS5.*数据模型' src/templates/agents/sddu-docs.md.hbs && echo "PASS: CS5 in example"

# 验证冲突检测示例
grep -q 'C1.*技术选型漂移' src/templates/agents/sddu-docs.md.hbs && echo "PASS: C1 example"
grep -q 'C3.*API 差异' src/templates/agents/sddu-docs.md.hbs && echo "PASS: C3 example"
grep -q '3 处不一致' src/templates/agents/sddu-docs.md.hbs && echo "PASS: conflict count"

# 验证完成摘要表格
grep -q '扫描到模块数' src/templates/agents/sddu-docs.md.hbs && echo "PASS: module count"
grep -q '技术栈项数' src/templates/agents/sddu-docs.md.hbs && echo "PASS: tech stack count"
grep -q 'API 端点数' src/templates/agents/sddu-docs.md.hbs && echo "PASS: API endpoint count"

# 验证代码快照限制提示
grep -q '代码快照.*非完整全景' src/templates/agents/sddu-docs.md.hbs && echo "PASS: limitation disclaimer"
```

---

#### TASK-021: 构建验证 + 交叉一致性校验 + 版本升级
> 运行构建流程，验证所有增量变更编译通过；执行交叉一致性校验；升级版本号

| 属性 | 值 |
|------|-----|
| **复杂度** | S |
| **前置依赖** | TASK-017, TASK-018, TASK-019, TASK-020（Wave 9 + Wave 10） |
| **执行波次** | Wave 11 |
| **对应 plan** | §6 文件影响分析 |
| **对应 FR/EC** | NFR-002, NFR-003 |

**描述**: 
在 v3.0 增量变更全部完成后执行三项收尾工作：

**1. 构建验证**：
- 运行 `node scripts/build-agents.cjs` 验证 Agent 指令模板（+240 行）编译通过
- 重点验证：Handlebars frontmatter 语法正确（YAML description 修改不破坏 `---` 分隔）、`#each`/`#if` 块在新增的 §5.2 步骤中配对完好
- 构建产物 `.opencode/agents/sddu-docs.md` 存在且非空

**2. 交叉一致性校验**：
- Agent 模板中 phrasal references 一致：§4 路由指令引用的「§5.2」在文件中真实存在
- 步骤编号连续性：§5.1 步骤 1~7 + §5.2 步骤 8~12，全 12 步连续
- CS1~CS5 全部 5 个维度在 §5.2 中定义
- C1~C4 全部 4 类冲突在 §5.2 步骤 11 中定义
- D8~D11 全部 4 个设计决策在步骤 11 中引用
- 规则编号连续（1~10 主模式 + 11~15 代码模式），无跳号
- 示例对话与 §5.2 工作流步骤结构一致

**3. 版本升级**：
- tasks.md 头部信息：版本 v2.0 → v3.0，更新说明改为 plan v3.3 变更
- tasks.json `version` → `"v3.0"`，`totalTasks` 13→21，`totalWaves` 7→11，`complexityDistribution` 更新
- tasks.json 新增 TASK-014~021 共 8 个任务条目
- tasks.md 合并统计表更新（新增 v3.0 列）
- state.json phaseHistory 新增 `tasked` 条目（v3.0）

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| 🔍 VERIFY | `scripts/build-agents.cjs`（只运行，不修改） |
| 🔍 VERIFY | `.opencode/agents/sddu-docs.md`（构建产物） |
| ✏️ MODIFY | `.sddu/specs-tree-root/specs-tree-docs-agent-optimization/tasks.json` |
| ✏️ MODIFY | `.sddu/specs-tree-root/specs-tree-docs-agent-optimization/tasks.md` |
| ✏️ MODIFY | `.sddu/specs-tree-root/specs-tree-docs-agent-optimization/state.json` |

**验收标准**:
- [ ] `node scripts/build-agents.cjs` 执行返回 exit code 0
- [ ] 构建输出中无 Handlebars 编译错误
- [ ] `.opencode/agents/sddu-docs.md` 构建产物存在且非空
- [ ] Agent 模板 §4 引用「§5.2」真实存在于文件中
- [ ] 步骤 1~12 全部连续存在（12 个步骤，无跳号）
- [ ] CS1~CS5 + C1~C4 + D8~D11 全覆盖
- [ ] tasks.md 版本号为 v3.0
- [ ] tasks.json `version` = `"v3.0"`, `totalTasks` = 21, `totalWaves` = 11
- [ ] state.json phaseHistory 含新 `tasked` 条目（v3.0 标记）

**验证命令**:
```bash
# 构建验证
node scripts/build-agents.cjs && echo "✓ Build passed"
test -s .opencode/agents/sddu-docs.md && echo "PASS: agent built" || echo "FAIL: agent not built"

# 步骤连续性验证
echo "=== Step Coverage ===" 
for i in $(seq 1 12); do
  grep -q "步骤 $i" src/templates/agents/sddu-docs.md.hbs && echo "  PASS: step $i" || echo "  FAIL: step $i missing"
done

# CS/C/D 全覆盖验证
for label in CS1 CS2 CS3 CS4 CS5 C1 C2 C3 C4 D8 D9 D10 D11; do
  grep -q "$label" src/templates/agents/sddu-docs.md.hbs && echo "PASS: $label covered" || echo "FAIL: $label missing"
done

# §4→§5.2 交叉引用验证
grep -q '§5.2' src/templates/agents/sddu-docs.md.hbs && echo "PASS: §5.2 cross-reference"

# tasks.json 验证
python3 -c "
import json
with open('.sddu/specs-tree-root/specs-tree-docs-agent-optimization/tasks.json') as f:
    t = json.load(f)
assert t['version'] == 'v3.0', f'FAIL: version={t[\"version\"]}'
assert t['totalTasks'] == 21, f'FAIL: totalTasks={t[\"totalTasks\"]}'
assert t['totalWaves'] == 11, f'FAIL: totalWaves={t[\"totalWaves\"]}'
task_ids = [task['id'] for task in t['tasks']]
assert 'TASK-021' in task_ids, 'FAIL: TASK-021 missing'
print('PASS: tasks.json validated')
"

# state.json 验证
python3 -c "
import json
with open('.sddu/specs-tree-root/specs-tree-docs-agent-optimization/state.json') as f:
    s = json.load(f)
# Check latest phaseHistory entry
latest = s['phaseHistory'][-1]
assert latest['phase'] == 'tasked', f'FAIL: phase={latest[\"phase\"]}'
assert 'v3.0' in latest.get('note', ''), f'FAIL: v3.0 not in note: {latest.get(\"note\", \"\")}'
print('PASS: state.json latest entry = tasked (v3.0)')
"
```

---

### 6.3 增量任务汇总

| 统计项 | 数值 |
|--------|:--:|
| 增量任务数 | 8 |
| S 级 (简单) | 4 |
| M 级 (中等) | 3 |
| L 级 (复杂) | 1 |
| 执行波次 | 4 |
| 修改文件数 | 1（Agent 指令模板 `sddu-docs.md.hbs`）+ 2 元数据文件（`tasks.json` + `state.json`） |
| 新增行数（Agent 模板） | ~240 行（468 → ~708 行） |

### 6.4 增量执行策略

| 波次 | 任务 | 策略 |
|:--:|------|------|
| 8 | TASK-014, TASK-015, TASK-016 | **并行执行** — 三个任务修改 Agent 模板的不同段落（YAML 第 2 行、§1 第 16 行、§4 第 38 行），互不冲突。build agent 应按序写入（YAML→§1→§4），或合并为单次文件写入 |
| 9 | TASK-017, TASK-018 | **阻塞执行** — TASK-017 创建 §5.2 骨架（步骤 8~10,12），TASK-018 在骨架中插入步骤 11。两者依赖 Wave 8 完成（需 §4 路由 + §5.1/§5.2 标识就位）。同一波次内 TASK-018 依赖 TASK-017 的步骤 10/12 就位后再插入步骤 11 |
| 10 | TASK-019, TASK-020 | **并行执行** — TASK-019 修改 §8/§9（文件后半），TASK-020 修改 §10（文件后半），段落紧邻但互不覆盖。依赖 Wave 9 完成（需 §5.2+步骤 11 已就位） |
| 11 | TASK-021 | **阻塞执行** — 等待所有变更完成。构建验证 + 交叉一致性 + 版本升级 |

**关键路径**: TASK-014~016 → TASK-017 → TASK-018 → TASK-019 → TASK-021
> TASK-020 与 TASK-019 并行，不阻塞关键路径。TASK-014/015/016 互不阻塞。

### 6.5 合并后总体统计

| 统计项 | 原 v1.0 | 增量 v2.0 | 增量 v3.0 | 合计 |
|--------|:--:|:--:|:--:|:--:|
| 总任务数 | 8 | +5 | +8 | 21 |
| S 级 | 2 | +2 | +4 | 8 |
| M 级 | 5 | +3 | +3 | 11 |
| L 级 | 1 | +0 | +1 | 2 |
| 波次数 | 4 | +3 | +4 | 11 |

---

## 修订记录
> 记录本文档的版本变更历史

| 版本 | 变更说明 | 日期 | 修订人 |
|------|---------|------|--------|
| v1.0 | 初始创建 — 基于 plan v1.9 分解为 8 个任务、4 个波次；覆盖 20 个模板（4 批）+ 1 个 Agent 指令模板（2 段）+ 2 个验证任务 | 2026-07-05 | SDDU Tasks Agent |
| v2.0 | 增量任务 — 基于 plan v2.9 新约束（模板自声明输出文件名、`<<entity_name>>`→`<<doc_subject>>` 重命名、定位声明去限定词、子目录命名规则 N1~N5、禁止事项 X1~X3），新增 TASK-009~013 共 5 个任务、3 个波次；涉及 21 个文件的修改 | 2026-07-05 | SDDU Tasks Agent |
| v3.0 | 增量任务 — 基于 plan v3.3 双模式架构（§2.9 YAML 修正→§2.10 双模式入口→§2.10.4 代码扫描 5 步骤→§2.10.6 C1~C4 冲突检测→§2.9 EC-001 增强），新增 TASK-014~021 共 8 个任务、4 个波次；全部变更集中在 Agent 指令模板（单一文件，+~240 行） | 2026-07-05 | SDDU Tasks Agent |
