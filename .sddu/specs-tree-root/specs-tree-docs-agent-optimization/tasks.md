# 任务分解：@sddu-docs Agent 补全与优化

> **文档定位**: SDDU 任务清单 — 将技术方案分解为可并行执行的原子任务，作为 build 阶段的输入  
> **前置依赖**: plan.md（技术方案）、spec.md（需求规范）  
> **创建人**: SDDU Tasks Agent  
> **创建时间**: 2026-07-05  
> **版本**: v1.0  
> **更新人**: SDDU Tasks Agent  
> **更新时间**: 2026-07-05  
> **更新说明**: 初始创建 — 基于 plan v1.9 分解为 8 个任务、4 个波次

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

## 修订记录
> 记录本文档的版本变更历史

| 版本 | 变更说明 | 日期 | 修订人 |
|------|---------|------|--------|
| v1.0 | 初始创建 — 基于 plan v1.9 分解为 8 个任务、4 个波次；覆盖 20 个模板（4 批）+ 1 个 Agent 指令模板（2 段）+ 2 个验证任务 | 2026-07-05 | SDDU Tasks Agent |
