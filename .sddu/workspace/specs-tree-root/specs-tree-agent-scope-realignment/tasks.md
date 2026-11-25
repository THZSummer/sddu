# 任务分解：plan/review/validate 职责回归改造

> **文档定位**: SDDU 任务清单 — 将技术方案分解为可并行执行的原子任务，作为 build 阶段的输入  
> **前置依赖**: plan.md（技术方案 v1.6，含 ADR-001~004）、spec.md（需求规范 v1.1，14 FR/6 NFR/7 EC）  
> **创建人**: SDDU Tasks Agent  
> **创建时间**: 2026-08-01  
> **版本**: v3.0  
> **更新人**: SDDU Tasks Agent  
> **更新时间**: 2026-08-01  
> **更新说明**: 基于 plan v1.6 重生成 — 新增 TASK-010（@sddu coordinator 模板路由感知更新：二维时序 + 策略/报告文档拆分感知）；任务从 11→12，M×9 / S×3，波次保持 2 个

## 1. 依赖拓扑总览
> 任务依赖关系和执行顺序

```
Wave 1: TASK-001~010 (10 tasks, all parallel)
  TASK-001~003: Agent source templates
    TASK-001 [M]  plan Agent 源码模板 — 删除 §5.8/§5.9
    TASK-002 [M]  review Agent 源码模板 — §1/§3/§6/§10 自主化 + ADR-004 双文件产出指引
    TASK-003 [M]  validate Agent 源码模板 — §1/§3/§5.0/§6/§10 自主化 + ADR-003 脚本归属
  TASK-004~008: Output templates
    TASK-004 [M]  plan 输出模板 — 删除 §8/§9 + 修订记录编号 + migration note
    TASK-005 [M]  review 输出模板 — 新增 §2 C1~CN + 章节重新编号
    TASK-006 [M]  review-report 输出模板 — 新建审查报告模板 (ADR-004)
    TASK-007 [M]  validate 输出模板 — 新增 §2 V1~VN + 章节重新编号
    TASK-008 [M]  validate-report 输出模板 — 新建验证报告模板 (ADR-004)
  TASK-009 [S]  build-agents.cjs — 头部增加同步关系说明注释
  TASK-010 [M]  @sddu coordinator 模板 — 路由感知二维时序 + 文档拆分 ← was TASK-012

Wave 2: TASK-011~012 (2 tasks, parallel, depends on Wave 1)
  TASK-011 [S]  构建验证 — npm run build + diff 验证产物一致 ← was TASK-010
  TASK-012 [S]  验收 — grep 覆盖 FR-001~FR-014 + NFR-001~NFR-006 全部验收标准 ← was TASK-011
```

## 2. 任务列表
> 每个任务的详细定义

### TASK-001: plan Agent 源码模板 — 删除 §5.8/§5.9

> 从 plan Agent 的源模板中剥离产物审查策略和产物验证策略的定义职责

| 属性 | 值 |
|------|-----|
| **复杂度** | M |
| **前置依赖** | 无 |
| **执行波次** | 1 |
| **对应 FR** | FR-001, FR-002 |
| **对应 ADR** | ADR-002（一次性全量改造） |

**描述**:
修改 `src/templates/agents/sddu-plan.md.hbs`（这是 README 规定的唯一可修改源文件——`.opencode/` 下的副本由 `npm run build` 生成）：
1. 删除 §5.8「产物审查策略」及其全部内容（L112-116）：包括标题、描述段落和 3 行列表（审查产物、审查基准）
2. 删除 §5.9「产物验证策略」及其全部内容（L117-120）：包括标题、描述段落和 2 行列表（验证产物、验证基准）
3. 确保 §5.7（ADR 模板示例，L95-111）与 §6（输出模板，L122+）之间无残留空行或分隔断裂

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| MODIFY | `src/templates/agents/sddu-plan.md.hbs` |

**验收标准**:
- [ ] `src/templates/agents/sddu-plan.md.hbs` 中搜索「5.8 ``产物审查策略``」返回 0 结果
- [ ] `src/templates/agents/sddu-plan.md.hbs` 中搜索「5.9 ``产物验证策略``」返回 0 结果
- [ ] 搜索「产物审查策略」（不含编号限定）返回 0 结果（确认无遗留引用）
- [ ] §5.7 末尾到 §6 标题之间的过渡连续完整，无多余空行或内容断裂

**验证命令**:
```bash
# FR-001: 验证 §5.8 已删除
grep -c "5\.8.*产物审查策略" src/templates/agents/sddu-plan.md.hbs && echo "FAIL: §5.8 still present" || echo "PASS: §5.8 removed"

# FR-002: 验证 §5.9 已删除
grep -c "5\.9.*产物验证策略" src/templates/agents/sddu-plan.md.hbs && echo "FAIL: §5.9 still present" || echo "PASS: §5.9 removed"

# 验证无残留引用
grep -c "产物审查策略\|产物验证策略" src/templates/agents/sddu-plan.md.hbs && echo "FAIL: residue found" || echo "PASS: no residue"

# 验证 §5.7→§6 过渡
grep -c "^## 6\. 输出模板" src/templates/agents/sddu-plan.md.hbs
```

---

### TASK-002: review Agent 源码模板 — 自主化改写 + ADR-004 双文件产出

> 将 review Agent 源模板从"被动消费 plan 审查策略"改造为"自主定义 C1~CN 审查清单"，并体现 ADR-004 策略/报告文档拆分

| 属性 | 值 |
|------|-----|
| **复杂度** | M |
| **前置依赖** | 无 |
| **执行波次** | 1 |
| **对应 FR** | FR-005, FR-006, FR-007（模板侧）、FR-013（向后兼容） |
| **对应 ADR** | ADR-001（混合指引范式）、ADR-004（策略/报告拆分） |

**描述**:
修改 `src/templates/agents/sddu-review.md.hbs` 的 5 处内容（`.opencode/` 副本由构建生成）：

1. **§1 角色定位（L16）**：将「审查的产物清单和基准以 plan.md 中「产物审查策略」章节为准，该章节定义的审查清单（C1~CN）是你的首要检查项」替换为自主描述。新文本核心要素：
   - review 自主从 spec（FR/NFR/EC）+ plan（技术设计/文件影响/ADR）+ 实际产物中提取审查对象
   - 运用 §5.1~5.4 审查方法论（代码质量/规范符合/架构一致/测试质量四个维度）自主定义 C1~CN 审查清单
   - 质量门槛提示：每个 FR ≥ 1 个 Cx，每个审查维度至少 1 条，无法审查项显式标注「不适用」并说明原因（对应 spec EC-001 兜底策略）

2. **§3 依赖关系（L39）**：删除「审查的产物清单和基准见 plan.md 中「产物审查策略」章节（搜索该标题，不依赖固定章节号）」整行。前置条件列表保持 spec.md / plan.md / tasks.md / build.md 依赖不变。

3. **§6 审查标准（L82）**：将「审查的产物和基准见 plan.md 中「产物审查策略」章节（搜索该标题，不依赖固定章节号），以下为流程通过标准」替换为「审查对象和基准基于本 Agent 自主定义的 C1~CN 审查清单，以下为流程通过标准」。

4. **§10 示例对话（L142-149）**：移除示例中对「读取 plan 审查策略」的描述（如"第一步读 plan 审查策略"），改为自主审查模式。示例中体现：从 spec+plan 自主提取审查对象 → 对照四维度审查 → 产出 C1~CN。

5. **ADR-004 产物拆分指引**（新增于完成协议附近）：review Agent 分两步产出——步骤 N：生成 `review.md`（策略文档，含 C1~CN 审查清单，Feature 级固定产物，定义一次）；步骤 N+1：生成 `review-report.md`（报告文档，逐项审查结果与结论，每轮执行独立产出）。策略文档必须先于报告文档产出并获用户确认。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| MODIFY | `src/templates/agents/sddu-review.md.hbs` |

**验收标准**:
- [ ] §1 包含「自主从 spec+plan+产物」语义，不含对 plan.md「产物审查策略」的引用
- [ ] §1 包含四维度审查方法论引用（代码质量/规范符合/架构一致/测试质量）
- [ ] §1 包含质量门槛提示（每 FR ≥ 1 个 Cx 或标注不适用）
- [ ] §3 不含对 plan.md「产物审查策略」的引用
- [ ] §6 不含对 plan.md「产物审查策略」的引用，含「C1~CN 审查清单」
- [ ] §10 示例不含「读取 plan 审查策略」类描述，改为自主模式
- [ ] 包含 ADR-004 双文件产出指引（review.md 策略 + review-report.md 报告）
- [ ] §1 包含向后兼容提示：遇到旧格式 plan.md（含 §8）将其忽略，不报错（FR-013）

**验证命令**:
```bash
# FR-005: §1 不再引用 plan 审查策略，改为自主模式
grep -c "plan\.md.*产物审查策略" src/templates/agents/sddu-review.md.hbs && echo "FAIL: still refs plan strategy" || echo "PASS: §1 de-ref'd"

# §1 包含自主语义 + 四维度引用
grep -c "自主.*spec.*plan" src/templates/agents/sddu-review.md.hbs
grep -c "代码质量.*规范符合.*架构一致.*测试质量" src/templates/agents/sddu-review.md.hbs

# FR-006: §3 不再引用 plan 审查策略
grep -c "审查的产物清单和基准见 plan" src/templates/agents/sddu-review.md.hbs && echo "FAIL: §3 still refs plan" || echo "PASS: §3 de-ref'd"

# §6 不再引用 plan 审查策略，含 C1~CN
grep -c "plan\.md.*产物审查策略" src/templates/agents/sddu-review.md.hbs && echo "FAIL: §6 still refs" || echo "PASS: §6 de-ref'd"
grep -c "C1.*CN.*审查清单" src/templates/agents/sddu-review.md.hbs

# ADR-004: 双文件产出指引存在
grep -c "review-report\.md" src/templates/agents/sddu-review.md.hbs

# FR-013: 向后兼容提示
grep -c "忽略.*旧格式\|向后兼容\|already completed" src/templates/agents/sddu-review.md.hbs
```

---

### TASK-003: validate Agent 源码模板 — 自主化改写 + ADR-003 脚本归属

> 将 validate Agent 源模板从"被动消费 plan 验证策略"改造为"自主定义 V1~VN 验证场景"，并体现 ADR-003（自主编写执行验证脚本）和 ADR-004（策略/报告拆分）

| 属性 | 值 |
|------|-----|
| **复杂度** | M |
| **前置依赖** | 无 |
| **执行波次** | 1 |
| **对应 FR** | FR-008, FR-009, FR-010（模板侧）、FR-014（向后兼容） |
| **对应 ADR** | ADR-001（混合指引范式）、ADR-003（验证脚本归属）、ADR-004（策略/报告拆分） |

**描述**:
修改 `src/templates/agents/sddu-validate.md.hbs` 的 6 处内容（`.opencode/` 副本由构建生成）：

1. **§1 角色定位（L16-17）**：将「验证的第一步永远是读取 plan.md 中的「产物验证策略」章节——plan 定义的验证场景是你最重要的任务清单，以下通用步骤是其补充和兜底」替换为自主描述。新文本核心要素：
   - validate 自主从 spec（FR/NFR/EC）+ plan（技术设计/文件影响/ADR）+ 实际产物中提取验证对象
   - 运用 §5.1~5.5 验证方法论自主定义 V1~VN 验证场景
   - 质量门槛提示：每个 FR ≥ 1 个 Vx，每个验证维度至少 1 条，无法验证项显式标注「不适用」并说明原因（对应 spec EC-002 Feature 类型自适应）

2. **§3 依赖关系（L35）**：删除「验证的产物清单和基准见 plan.md 中「产物验证策略」章节（搜索该标题，不依赖固定章节号）」整行。前置条件列表保持 spec.md / review.md（状态 passed）依赖不变。

3. **§5.0 场景验证 → 场景设计（L51-69）**：整体重写——
   - 标题从「场景验证（plan 驱动 — 优先级最高）」改为「场景设计（自主 — 优先级最高）」
   - 入口从「读取 plan 验证策略 → 提取 V1~VN → 逐项执行」改为「自主从 spec+NFR+产物 → 运用 §5.1~5.5 方法论 → 设计 V1~VN 场景矩阵 → 逐项执行」
   - 删除原步骤 1「读取 plan 验证策略」和末尾兜底提示「如果 plan 中无「产物验证策略」章节，跳过本步骤」
   - 保留 Feature 类型自适应逻辑（代码/模板/配置/文档），将判断条件从「plan 定义了哪些场景」改为「基于 Feature 类型自主选定验证维度」
   - 保留场景矩阵表格格式

4. **§6 验证标准（L145）**：将「验证的产物和基准见 plan.md 中「产物验证策略」章节（搜索该标题，不依赖固定章节号），以下为流程通过标准」替换为「验证对象和基准基于本 Agent 自主定义的 V1~VN 验证场景，以下为流程通过标准」。

5. **ADR-003 验证脚本归属**（在 §5.0 或角色定位中新增）：validate Agent 拥有"自主编写并直接执行验证脚本"的完整权限。核心表述：
   - 验证脚本是执行工具，不是正式产物——不走 task→build 流程
   - 脚本产出路径约定：`/tmp/sddu-validate-<feature>-<timestamp>/`（避免污染项目源码目录）
   - 验证脚本在验证报告（validate-report.md）中列出文件名、用途和执行结果，保持可追溯性
   - 如需长期维护的测试（回归测试、CI 集成测试），作为新 Feature 走完整 SDDU 流程
   - 职责闭环声明："validate 的核心职责是自主定义 V1~VN → 自主编写执行工具 → 产出验证报告。编写验证脚本是执行决策，不是架构决策，不依赖上游 task/build"

6. **§10 示例对话（L207-219）**：更新示例——移除「先读 plan 验证策略」「plan §10 定义了 4 个验证场景」类描述，改为「自主从 spec+NFR 中设计 V1~VN 场景矩阵」的自主模式示例。新示例需体现 ADR-003 脚本自主编写和 ADR-004 双文件产出。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| MODIFY | `src/templates/agents/sddu-validate.md.hbs` |

**验收标准**:
- [ ] §1 包含「自主从 spec+NFR+产物」语义，不含对 plan.md「产物验证策略」作为第一步/最重要任务清单的引用
- [ ] §1 包含五维度验证方法论引用（测试覆盖/接口数据/构建脚本/性能边界/漂移检测）
- [ ] §1 包含质量门槛提示（每 FR ≥ 1 个 Vx 或标注不适用/Feature 类型自适应）
- [ ] §3 不含对 plan.md「产物验证策略」的引用
- [ ] §5.0 标题改为「场景设计（自主 — 优先级最高）」
- [ ] §5.0 入口从读取 plan 验证策略改为自主设计场景矩阵，不含旧的兜底逻辑
- [ ] §6 不含对 plan.md「产物验证策略」的引用，含「V1~VN 验证场景」
- [ ] 包含 ADR-003 验证脚本归属声明（自主编写/执行、不走 task→build、路径约定、可追溯性）
- [ ] §10 示例不含「读取 plan 验证策略」类描述，改为自主模式
- [ ] §1 包含向后兼容提示：遇到旧格式 plan.md（含 §9）将其忽略，不报错（FR-014）

**验证命令**:
```bash
# FR-008: §1 不再以"读取 plan 验证策略"为第一步
grep -c "验证的第一步永远是读取 plan" src/templates/agents/sddu-validate.md.hbs && echo "FAIL: still first-step ref" || echo "PASS: §1 de-ref'd"
grep -c "自主.*spec.*NFR" src/templates/agents/sddu-validate.md.hbs

# §1 包含五维度引用
grep -c "测试覆盖.*接口.*构建.*性能.*漂移" src/templates/agents/sddu-validate.md.hbs

# FR-009: §3 不再引用 plan 验证策略
grep -c "验证的产物清单和基准见 plan" src/templates/agents/sddu-validate.md.hbs && echo "FAIL: §3 still refs" || echo "PASS: §3 de-ref'd"

# §5.0 改为自主模式
grep -c "场景设计（自主" src/templates/agents/sddu-validate.md.hbs
grep -c "场景验证（plan 驱动" src/templates/agents/sddu-validate.md.hbs && echo "FAIL: old §5.0 title" || echo "PASS: §5.0 title updated"
grep -c "如果 plan 中无.*产物验证策略.*跳过" src/templates/agents/sddu-validate.md.hbs && echo "FAIL: old fallback" || echo "PASS: fallback removed"

# §6 不再引用 plan 验证策略，含 V1~VN
grep -c "V1.*VN.*验证场景" src/templates/agents/sddu-validate.md.hbs

# ADR-003: 验证脚本归属声明
grep -c "自主编写.*验证脚本\|验证脚本.*不走.*task" src/templates/agents/sddu-validate.md.hbs
grep -c "/tmp/sddu-validate" src/templates/agents/sddu-validate.md.hbs

# ADR-004: 双文件产出指引
grep -c "validate-report\.md" src/templates/agents/sddu-validate.md.hbs

# FR-014: 向后兼容提示
grep -c "忽略.*旧格式\|向后兼容\|already completed" src/templates/agents/sddu-validate.md.hbs
```

---

### TASK-004: plan 输出模板 — 删除 §8/§9 + 修订记录重新编号 + migration note

> 从 plan 输出模板中移除产物审查策略和产物验证策略章节，使 plan 产出不再包含下游代理策略

| 属性 | 值 |
|------|-----|
| **复杂度** | M |
| **前置依赖** | 无 |
| **执行波次** | 1 |
| **对应 FR** | FR-003, FR-004 |
| **对应 NFR** | NFR-003（§5.5 格式兼容） |

**描述**:
修改 `src/templates/outputs/sddu-plan.md.hbs`：

1. 删除 §8「产物审查策略」章节（L65-72）全部内容：标题行 `## 8. 产物审查策略`、说明段落、审查产物/审查基准表格（3 行数据）
2. 删除 §9「产物验证策略」章节（L74-80）全部内容：标题行 `## 9. 产物验证策略`、说明段落、验证产物/验证基准表格（2 行数据）
3. 将原「修订记录」章节（L82，当前无编号 `## 修订记录`）改为 `## 8. 修订记录`（删除两个章节后，修订记录接续 §7 之后）
4. 在修订记录章节前添加 migration note 注释行（HTML 注释格式，不参与渲染）：`<!-- Migration: §8/§9 已从 plan 输出模板中移除（v3.0.0+）。旧 Feature（18 个已完成）的 plan.md 可能仍包含「产物审查策略」「产物验证策略」章节，这些不再被 review/validate Agent 引用，仅作为历史记录保留 -->`

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| MODIFY | `src/templates/outputs/sddu-plan.md.hbs` |

**验收标准**:
- [ ] `src/templates/outputs/sddu-plan.md.hbs` 中搜索「产物审查策略」返回 0 结果
- [ ] `src/templates/outputs/sddu-plan.md.hbs` 中搜索「产物验证策略」返回 0 结果
- [ ] 修订记录章节编号为 `## 8. 修订记录`
- [ ] migration note 存在于修订记录之前（HTML 注释格式，不破坏 Markdown 结构）
- [ ] §5（文件影响分析）、§6（风险评估）、§7（生成的 ADR）三章节编号和结构完整不受影响

**验证命令**:
```bash
# FR-003: 验证 §8 已删除
grep -c "产物审查策略" src/templates/outputs/sddu-plan.md.hbs && echo "FAIL: §8 residue" || echo "PASS: §8 removed"

# FR-004: 验证 §9 已删除
grep -c "产物验证策略" src/templates/outputs/sddu-plan.md.hbs && echo "FAIL: §9 residue" || echo "PASS: §9 removed"

# 验证修订记录编号
grep -c "^## 8\. 修订记录" src/templates/outputs/sddu-plan.md.hbs

# 验证 migration note 存在
grep -c "Migration.*§8.*§9.*removed" src/templates/outputs/sddu-plan.md.hbs

# 验证 §5~§7 章节完整性
grep -c "^## [5-7]\. " src/templates/outputs/sddu-plan.md.hbs
```

---

### TASK-005: review 输出模板 — 新增 §2 C1~CN + 章节重新编号

> 在 review 输出模板中新增自主审查清单章节，适配 ADR-004 拆分——此模板只输出策略文档（review.md），报告文档另见 TASK-006

| 属性 | 值 |
|------|-----|
| **复杂度** | M |
| **前置依赖** | 无 |
| **执行波次** | 1 |
| **对应 FR** | FR-007（策略文档侧） |
| **对应 ADR** | ADR-001（质量门槛）、ADR-004（策略/报告拆分） |

**描述**:
修改 `src/templates/outputs/sddu-review.md.hbs`——此模板专用于策略文档 `review.md`（C1~CN 审查清单），不含逐项审查结果：

1. 更新文档顶部定位描述：将「SDDU 审查报告」改为「SDDU 审查策略」；将「静态分析代码质量、规范符合性和架构一致性的结果」改为「自主定义的 C1~CN 审查清单，作为审查执行的基准」
2. 在 §1「审查概要」之后、原 §2「审查详情」之前，新增 `## 2. 自主审查清单（C1~CN）` section
3. 新增 section 内容结构：
   - **审查对象来源说明**：从 spec（FR/NFR/EC）+ plan（技术设计/文件影响/ADR）+ 实际产物中自主提取
   - **审查维度说明**：四维度（代码质量/规范符合/架构一致/测试质量），引用 review Agent 的 §5.1~5.4 方法论
   - **审查清单表格**：
     | # | 审查对象 | 审查基准 | 审查维度 | 审查方法 |
     |---|---------|---------|:--:|------|
     | C1 | <<审查对象描述>> | <<对比基准（spec/ADR/规范）>> | <<代码质量/规范符合/架构一致/测试质量>> | <<静态分析方法>> |
   - **质量门槛**（数量基线法）：每个 FR ≥ 1 个 Cx，每审查维度至少 1 条，无法审查项显式标注「不适用」并说明原因
4. 章节重新编号：原 §2→§3、§3→§4、§4→§5、§5→§6、修订记录→§7

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| MODIFY | `src/templates/outputs/sddu-review.md.hbs` |

**验收标准**:
- [ ] 文档定位描述从「审查报告」改为「审查策略」
- [ ] `## 2. 自主审查清单（C1~CN）` section 存在且位于 §1 和原 §2 之间
- [ ] 审查清单表格包含列：审查对象、审查基准、审查维度、审查方法
- [ ] 质量门槛（数量基线法）说明存在
- [ ] 章节编号：§1 审查概要、§2 自主审查清单、§3 审查详情…§6 结论、§7 修订记录
- [ ] 原 4 个审查详情子章节（代码质量/规范符合/架构一致/测试质量）编号为 §3.1~§3.4

**验证命令**:
```bash
# FR-007: 新增自主审查清单 section
grep -c "自主审查清单.*C1.*CN" src/templates/outputs/sddu-review.md.hbs

# 文档定位改为策略
grep -c "审查策略" src/templates/outputs/sddu-review.md.hbs

# 审查清单表格列定义
grep -c "审查对象.*审查基准.*审查维度.*审查方法" src/templates/outputs/sddu-review.md.hbs

# 质量门槛
grep -c "每个 FR.*≥.*1.*Cx\|每.*维度.*至少.*1" src/templates/outputs/sddu-review.md.hbs

# 章节编号正确
grep -c "^## 2\. 自主审查清单" src/templates/outputs/sddu-review.md.hbs
grep -c "^## 7\. 修订记录" src/templates/outputs/sddu-review.md.hbs
```

---

### TASK-006: review-report 输出模板 — 新建审查报告模板（ADR-004）

> 创建 review 报告文档模板——逐项审查结果与结论，与 review.md（策略）分离，每轮执行独立产出

| 属性 | 值 |
|------|-----|
| **复杂度** | M |
| **前置依赖** | 无 |
| **执行波次** | 1 |
| **对应 FR** | FR-007（报告文档侧） |
| **对应 ADR** | ADR-004（策略/报告拆分） |

**描述**:
新建 `src/templates/outputs/sddu-review-report.md.hbs`。此模板专用于报告文档 `review-report.md`，包含逐项审查结果和最终结论。模板结构：

```
# 审查报告：<<feature_name>>

> 文档定位: SDDU 审查报告 — 基于 review.md 中 C1~CN 审查清单的逐项执行结果
> 前置依赖: review.md（审查策略，含 C1~CN 审查清单）、build.md（构建产物）
> 创建人/时间: ...
> 审查轮次: R<<轮次编号>>

## 1. 审查概要
审查源: review.md（审查策略 C1~CN）
审查文件数: <<count>>
通过项: <<pass>>
改进建议: <<improvement>>
阻塞问题: <<blocking>>

## 2. 逐项审查结果 (C1~CN)
根据 review.md 中定义的 C1~CN 审查清单，逐项执行审查：

| # | 审查对象 | 审查基准 | 评估结果 | 发现 | 严重程度 |
|---|---------|---------|:--:|------|:--:|
| C1 | <<对象>> | <<基准>> | ✅/⚠️/❌ | <<具体发现>> | <<无/改进/阻塞>> |

（注：C1~CN 编号对齐 review.md 中的定义）

## 3. 审查维度汇总

### 3.1 代码质量
通过 <<n>> 项 / 改进 <<m>> 项 / 阻塞 <<k>> 项

### 3.2 规范符合性
...

### 3.3 架构一致性
...

### 3.4 测试质量
...

## 4. 阻塞问题
| # | Cx | 位置 | 问题 | 修复建议 |
|---|----|------|------|---------|

## 5. 改进建议
| # | Cx | 位置 | 问题 | 建议 |
|---|----|------|------|------|

## 6. 结论
结论: <<✅ 通过 / ⚠️ 有条件通过 / ❌ 不通过>>
理由: <<简述>>

## 修订记录
```

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| CREATE | `src/templates/outputs/sddu-review-report.md.hbs` |

**验收标准**:
- [ ] 文件 `src/templates/outputs/sddu-review-report.md.hbs` 存在
- [ ] 文档定位为「审查报告」（区别于 review.md 的「审查策略」）
- [ ] §2 逐项审查结果表格映射到 C1~CN（对齐 review.md 策略文档）
- [ ] 包含审查轮次字段（R1、R2…）
- [ ] 包含阻塞问题/改进建议列表
- [ ] 包含三态结论（通过/有条件通过/不通过）

**验证命令**:
```bash
# 文件存在
test -f src/templates/outputs/sddu-review-report.md.hbs && echo "PASS: file exists" || echo "FAIL: file missing"

# 关键章节存在
grep -c "逐项审查结果.*C1.*CN" src/templates/outputs/sddu-review-report.md.hbs
grep -c "审查轮次" src/templates/outputs/sddu-review-report.md.hbs
grep -c "阻塞问题" src/templates/outputs/sddu-review-report.md.hbs
grep -c "改进建议" src/templates/outputs/sddu-review-report.md.hbs

# 区别于 review.md（不含自主审查清单定义）
grep -c "自主审查清单" src/templates/outputs/sddu-review-report.md.hbs && echo "FAIL: should not contain strategy definition" || echo "PASS: report-only content"
```

---

### TASK-007: validate 输出模板 — 新增 §2 V1~VN + 章节重新编号

> 在 validate 输出模板中新增自主验证场景章节，适配 ADR-004 拆分——此模板只输出策略文档（validate.md），报告文档另见 TASK-008

| 属性 | 值 |
|------|-----|
| **复杂度** | M |
| **前置依赖** | 无 |
| **执行波次** | 1 |
| **对应 FR** | FR-010（策略文档侧） |
| **对应 ADR** | ADR-001（质量门槛）、ADR-004（策略/报告拆分） |

**描述**:
修改 `src/templates/outputs/sddu-validate.md.hbs`——此模板专用于策略文档 `validate.md`（V1~VN 验证场景），不含实测结果：

1. 更新文档顶部定位描述：将「SDDU 验证报告」改为「SDDU 验证策略」；将「通过动态执行验证产物的完整性、一致性和可交付性，作为工作流终点」改为「自主定义的 V1~VN 验证场景矩阵，作为验证执行的基准」
2. 在 §1「验证概要」之后、原 §2「测试覆盖验证」之前，新增 `## 2. 自主验证场景（V1~VN）` section
3. 新增 section 内容结构：
   - **验证对象来源说明**：从 spec（FR/NFR/EC）+ plan（技术设计/文件影响/ADR）+ 实际产物中自主提取
   - **Feature 类型自适应**：代码类 Feature → 全维度验证；模板/配置类 → 侧重构建完整性/格式一致性/引用完整性；文档类 → 侧重引用完整性
   - **验证场景矩阵表格**：
     | # | 验证对象 | 验证步骤 | 预期结果 | 验证维度 | 验证方法 |
     |---|---------|---------|---------|:--:|------|
     | V1 | <<验证对象（FR/NFR/产物）>> | <<分步操作>> | <<预期行为/数据>> | <<测试覆盖/接口/构建/性能/漂移>> | <<自动化/手动/脚本>> |
   - **质量门槛**（数量基线法）：每个 FR ≥ 1 个 Vx，每验证维度至少 1 条，无法验证项显式标注「不适用」并说明原因
   - **Feature 类型标注**：标注本 Feature 类型（代码/模板/配置/文档），说明启用的验证维度
4. 章节重新编号：原 §2→§3、§3→§4、§4→§5、§5→§6、§6→§7、§7→§8、修订记录→§9

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| MODIFY | `src/templates/outputs/sddu-validate.md.hbs` |

**验收标准**:
- [ ] 文档定位描述从「验证报告」改为「验证策略」
- [ ] `## 2. 自主验证场景（V1~VN）` section 存在且位于 §1 和原 §2 之间
- [ ] 验证场景矩阵表格包含列：验证对象、验证步骤、预期结果、验证维度、验证方法
- [ ] Feature 类型自适应说明存在
- [ ] 质量门槛（数量基线法）说明存在
- [ ] 章节编号：§1 验证概要、§2 自主验证场景、§3 测试覆盖验证…§8 结论、§9 修订记录
- [ ] 原 7 个验证子章节（测试覆盖/接口数据/构建脚本/性能边界/漂移检测）编号为 §3~§7

**验证命令**:
```bash
# FR-010: 新增自主验证场景 section
grep -c "自主验证场景.*V1.*VN" src/templates/outputs/sddu-validate.md.hbs

# 文档定位改为策略
grep -c "验证策略" src/templates/outputs/sddu-validate.md.hbs

# 验证场景表格列定义
grep -c "验证对象.*验证步骤.*预期结果.*验证维度.*验证方法" src/templates/outputs/sddu-validate.md.hbs

# Feature 类型自适应
grep -c "Feature.*类型.*自适应\|代码类.*全维度\|模板.*配置.*构建完整性" src/templates/outputs/sddu-validate.md.hbs

# 质量门槛
grep -c "每个 FR.*≥.*1.*Vx\|每.*维度.*至少.*1" src/templates/outputs/sddu-validate.md.hbs

# 章节编号正确
grep -c "^## 2\. 自主验证场景" src/templates/outputs/sddu-validate.md.hbs
grep -c "^## 9\. 修订记录" src/templates/outputs/sddu-validate.md.hbs
```

---

### TASK-008: validate-report 输出模板 — 新建验证报告模板（ADR-004）

> 创建 validate 报告文档模板——逐项验证结果与结论，含验证脚本执行记录（ADR-003），与 validate.md（策略）分离，每轮执行独立产出

| 属性 | 值 |
|------|-----|
| **复杂度** | M |
| **前置依赖** | 无 |
| **执行波次** | 1 |
| **对应 FR** | FR-010（报告文档侧） |
| **对应 ADR** | ADR-003（验证脚本归属）、ADR-004（策略/报告拆分） |

**描述**:
新建 `src/templates/outputs/sddu-validate-report.md.hbs`。此模板专用于报告文档 `validate-report.md`，包含逐项验证结果、实测数据和最终结论。模板结构：

```
# 验证报告：<<feature_name>>

> 文档定位: SDDU 验证报告 — 基于 validate.md 中 V1~VN 验证场景的逐项执行结果，含实测数据
> 前置依赖: validate.md（验证策略，含 V1~VN 验证场景）、review-report.md（审查报告，状态 passed）
> 创建人/时间: ...
> 验证轮次: R<<轮次编号>>

## 1. 验证概要
验证源: validate.md（验证策略 V1~VN）
FR 覆盖率: <<fr_pct>>%（<<fr_covered>>/<<fr_total>>）
NFR 覆盖率: <<nfr_pct>>%（<<nfr_covered>>/<<nfr_total>>）
构建: <<✅/❌>>（退出码 <<code>>）
漂移项: <<drift_count>>
阻塞问题: <<blocking_count>>

## 2. 逐项验证结果 (V1~VN)
根据 validate.md 中定义的 V1~VN 验证场景，逐项执行验证：

| # | 验证对象 | 验证步骤 | 预期结果 | 实测结果 | 判定 |
|---|---------|---------|---------|---------|:--:|
| V1 | <<对象(FR/NFR/产物)>> | <<分步操作>> | <<预期>> | <<实测数据>> | ✅/❌/⏭️ |
| V2 | ... | ... | ... | ... | ... |

（注：V1~VN 编号对齐 validate.md 中的定义；⏭️ = 无法执行，需附原因）

## 3. 验证详细信息

### 3.1 测试覆盖验证
运行测试套件，统计覆盖率...

### 3.2 接口与数据实测
...

### 3.3 构建与脚本验证
...

### 3.4 性能与边界验证
...

### 3.5 漂移检测
...

## 4. 验证脚本执行记录
> 本阶段自主编写并执行的验证脚本清单（ADR-003）

| 脚本文件 | 用途 | 对应场景 | 退出码 | 关键输出（摘要） |
|---------|------|:--:|:--:|------|
| /tmp/sddu-validate-<<feature>>-<<timestamp>>/<<script>>.sh | <<用途>> | V<<n>> | <<0/非0>> | <<结果摘要>> |

脚本存放路径: /tmp/sddu-validate-<<feature>>-<<timestamp>>/
说明: 验证脚本是执行工具，非正式产物。如需长期维护的测试，应作为新 Feature 走完整 SDDU 流程（ADR-003）

## 5. 阻塞问题
| # | Vx | 问题 | 影响 |
|---|----|------|------|

## 6. 结论
结论: <<✅ 通过 / ⚠️ 有条件通过 / ❌ 不通过>>

| 指标 | 实测 | 要求 | 达标 |
|------|------|------|:--:|
| FR 覆盖率 | <<fr_pct>>% | 100% | <<✅/❌>> |
| NFR 覆盖率 | <<nfr_pct>>% | ≥80% | <<✅/❌>> |
| 构建 | <<code>> | 退出码 0 | <<✅/❌>> |
| 漂移 | <<count>> 项 | 0 | <<✅/❌>> |
| 阻塞 | <<count>> 项 | 0 | <<✅/❌>> |

理由: <<简述>>

## 修订记录
```

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| CREATE | `src/templates/outputs/sddu-validate-report.md.hbs` |

**验收标准**:
- [ ] 文件 `src/templates/outputs/sddu-validate-report.md.hbs` 存在
- [ ] 文档定位为「验证报告」（区别于 validate.md 的「验证策略」）
- [ ] §2 逐项验证结果表格映射到 V1~VN（对齐 validate.md 策略文档）
- [ ] 包含验证轮次字段
- [ ] §4「验证脚本执行记录」section 存在（ADR-003 落地）——含脚本存放路径约定 `/tmp/sddu-validate-<feature>-<timestamp>/`
- [ ] 包含实测数据列（预期 vs 实测对比）
- [ ] 包含三态结论（通过/有条件通过/不通过）及指标达标判定

**验证命令**:
```bash
# 文件存在
test -f src/templates/outputs/sddu-validate-report.md.hbs && echo "PASS: file exists" || echo "FAIL: file missing"

# 关键章节存在
grep -c "逐项验证结果.*V1.*VN" src/templates/outputs/sddu-validate-report.md.hbs
grep -c "验证脚本执行记录" src/templates/outputs/sddu-validate-report.md.hbs

# ADR-003: 脚本路径约定
grep -c "/tmp/sddu-validate" src/templates/outputs/sddu-validate-report.md.hbs

# 验证轮次
grep -c "验证轮次" src/templates/outputs/sddu-validate-report.md.hbs

# 实测 vs 预期对比列
grep -c "预期结果.*实测结果" src/templates/outputs/sddu-validate-report.md.hbs

# 区别于 validate.md（不含自主验证场景定义表格）
grep -c "验证场景矩阵\|Feature.*类型.*自适应" src/templates/outputs/sddu-validate-report.md.hbs && echo "WARN: strategy content in report" || echo "PASS: report-only content"
```

---

### TASK-009: build-agents.cjs — 同步关系说明注释

> 在构建脚本头部添加源模板 → 运行时副本 → 插件副本的同步关系文档

| 属性 | 值 |
|------|-----|
| **复杂度** | S |
| **前置依赖** | 无 |
| **执行波次** | 1 |
| **对应 FR** | FR-012（文档化部分） |
| **对应 NFR** | NFR-005（模板冗余度受控） |

**描述**:
在 `scripts/build-agents.cjs` 文件头部 JSDoc 注释块内（`/**` 和 `*/` 之间，约 L2-L11），添加同步关系说明段落。添加位置：现有注释块末尾（构造输出路径说明行之后，`*/` 之前）。添加内容：

```
 * 
 * === 文件同步关系（source-of-truth 模型） ===
 * 
 * 三层文件路径：
 *   1. 源模板（source-of-truth）: src/templates/agents/sddu-*.md.hbs
 *      └─ 开发者修改入口 —— 所有 Agent 模板变更只改此层
 *   2. 构建产物（build output）: dist/templates/agents/sddu-*.md
 *      └─ npm run build 自动生成 —— 由本脚本从前端模板替换 + 后处理器生成
 *   3. 运行时副本（runtime copies，由 npm run build 同步）:
 *      a. .opencode/agents/sddu-*.md          ← LLM Agent 执行时加载
 *      b. .opencode/plugins/sddu/agents/sddu-*.md ← 插件分发源
 * 
 * 同步维护规则：
 *   - 修改流程：编辑 src/templates/agents/sddu-*.md.hbs → npm run build → 检查 dist/ 产物
 *   - 禁止操作：不要直接编辑 .opencode/agents/ 或 .opencode/plugins/sddu/agents/ 下的文件
 *   - 一致性验证：构建后建议运行 diff 对比源模板和运行时副本（除 frontmatter 外应一致）
 *   - 注意：输出模板（src/templates/outputs/*.hbs）不经过 Handlebars 处理，直接 raw copy 到 dist/templates/output/
 * 
 * 未来改进方向：完整自动同步机制（如构建 hook 自动 diff 告警）由后续 Feature 独立实现。
```

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| MODIFY | `scripts/build-agents.cjs` |

**验收标准**:
- [ ] build-agents.cjs 头部注释包含「同步关系说明」或「source-of-truth」段落
- [ ] 注释中列出了 3 层文件路径（源模板/构建产物/运行时副本）
- [ ] 注释中包含同步维护规则（修改流程 + 禁止操作 + 一致性验证）
- [ ] 添加注释不破坏脚本语法（`node -c scripts/build-agents.cjs` 退出码 0）

**验证命令**:
```bash
# 验证同步注释已添加
grep -c "source-of-truth" scripts/build-agents.cjs
grep -c "三层文件路径" scripts/build-agents.cjs
grep -c "同步维护规则" scripts/build-agents.cjs

# 验证脚本语法正确
node -c scripts/build-agents.cjs && echo "PASS: syntax OK" || echo "FAIL: syntax error"
```

---

### TASK-010: @sddu coordinator 模板 — 路由感知二维时序 + 文档拆分

> 更新 @sddu 路由调度专家模板，使其感知策略/报告文档拆分和二维时序（策略设计可与 build 并行）

| 属性 | 值 |
|------|-----|
| **复杂度** | M |
| **前置依赖** | 无 |
| **执行波次** | 1 |
| **对应 FR** | 无直接 FR 映射（协调器感知更新，对应 plan §5 文件影响分析，NG-004 约束：不修改运行时逻辑，仅更新指令模板） |
| **对应 ADR** | ADR-004（策略/报告文档拆分感知） |

**描述**:
修改 `src/templates/agents/sddu.md.hbs`——这是 @sddu 路由调度专家的 Agent 指令模板（源文件）。`.opencode/` 下的副本由 `npm run build` 生成。修改 3 处内容：

1. **§5.2 路由约束**（L72-76）：在现有 4 条约束列表末尾新增 1 条约束：
   ```
   - ✅ **二维时序路由**：review/validate 的策略设计阶段（产出 review.md / validate.md 策略文档）不依赖 tasks/build 完成——plan 完成后即可路由到 review/validate 进行策略设计。报告执行阶段（产出 review-report.md / validate-report.md 报告文档）需等待 build 完成后再路由。@sddu 应感知这条二维时间线：plan 完成后可同时路由 tasks（向前建设）和 review/validate 策略设计（逆向检验准备），两条线并行不悖。
   ```
   这条约束打破原有的"线性串行"隐含假设——明确告知 @sddu：plan 完成后可以同时路由 `@sddu-tasks`（正向建设链）和 `@sddu-review`/`@sddu-validate` 的策略设计（逆向检验链），策略设计链不等待 build 完成。

2. **§6.5 智能引导**（或新建 §6.6）：在仪表盘末尾「操作建议」之后、§7 标记命令之前，补充二维时序引导段落。最佳添加位置：§6.5 现有内容尾部（L132-133 之后）新增 `### 6.6 二维时序引导` 子章节：
   ```
   ### 6.6 二维时序引导
   > plan 完成后，正向建设链和逆向检验准备链可并行推进
   
   当 Feature phase = planned 时，在操作建议中补充以下二维时序提示：
   
   **正向建设链**（串行依赖）：
   tasks → build（产出实际产物）
   
   **逆向检验准备链**（与正向链并行，不依赖 tasks/build）：
   review 策略设计（产出 review.md，定义 C1~CN 审查清单）
   validate 策略设计（产出 validate.md，定义 V1~VN 验证场景）
   
   **执行建议**：
   - plan 完成后，建议用户同时启动 `@sddu-tasks <feature>` 和 `@sddu-review <feature>` / `@sddu-validate <feature>` 策略设计
   - 报告执行（产出 review-report.md / validate-report.md）需等待 build 完成后触发
   ```

3. **§3 路由目标**（L38-49）：更新路由目标表中 review/validate 的「说明」列，标注策略/报告文档拆分。在说明列中补充 `（策略设计可提前，不依赖 build）`。修改后表格如下：
   ```
   | @sddu-review | 6/7 | 产物审查（策略设计可提前，不依赖 build；报告执行需 build 完成） |
   | @sddu-validate | 7/7 | 产物验证（策略设计可提前，不依赖 build；报告执行需 build 完成） |
   ```

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| MODIFY | `src/templates/agents/sddu.md.hbs` |

**验收标准**:
- [ ] §5.2 路由约束包含新增的「二维时序路由」约束，明确策略设计不依赖 tasks/build
- [ ] §6.6 二维时序引导章节存在（或等效内容在 §6.5 尾部），包含正向建设链和逆向检验准备链的并行说明
- [ ] §3 路由目标表中 review/validate 的说明列标注了策略设计可提前
- [ ] 模板中标注了策略/报告文档拆分概念（review.md vs review-report.md，validate.md vs validate-report.md）
- [ ] 不修改运行时逻辑或状态机代码（仅改 Agent 指令模板文本，符合 NG-004 约束）

**验证命令**:
```bash
# 1. §5.2 二维时序路由约束新增
grep -c "二维时序\|策略设计.*不依赖.*build\|策略设计.*不依赖.*tasks" src/templates/agents/sddu.md.hbs

# 2. §6.6（或等效于 §6 中的）二维时序引导
grep -c "二维时序引导\|正向建设链\|逆向检验准备链\|plan.*完成后.*同时.*review.*validate\|策略设计.*并行" src/templates/agents/sddu.md.hbs

# 3. §3 路由目标表标注
grep -c "策略设计可提前" src/templates/agents/sddu.md.hbs

# 4. 策略/报告文档拆分概念
grep -c "review\.md.*review-report\.md\|validate\.md.*validate-report\.md" src/templates/agents/sddu.md.hbs

# 5. NG-004 合规：不修改运行时逻辑（确认文件仍是 .hbs 模板格式）
grep -c "{{" src/templates/agents/sddu.md.hbs
head -5 src/templates/agents/sddu.md.hbs | grep -c "handelbars\|hbs\|template"
```

---

### TASK-011: 构建 + 同步验证

> 运行 npm run build，验证改造后的源模板可正确构建，并确认运行时副本与源模板一致

| 属性 | 值 |
|------|-----|
| **复杂度** | S |
| **前置依赖** | TASK-001~010（所有源文件改造完成） |
| **执行波次** | 2 |
| **对应 FR** | FR-011（模板副本同步）、FR-012（构建兼容性） |
| **对应 NFR** | NFR-001（一致性） |

**描述**:
执行 `npm run build`（触发 `build:agents` + `build:ts`），确认：
1. 构建退出码为 0，无 ERROR 日志
2. `.opencode/agents/` 下的 plan/review/validate Agent 副本由构建生成，内容反映改造
3. `.opencode/plugins/sddu/agents/` 下的同名副本同步更新
4. 运行 `diff`（排除 frontmatter 差异）验证 3 个 Agent 的 6 份副本正文内容一致
5. `src/templates/outputs/` 下的输出模板正确 raw copy 到 dist

**涉及文件**: 无（纯验证任务，不修改文件）

**验收标准**:
- [ ] `npm run build` 退出码为 0
- [ ] 构建日志无 ERROR
- [ ] `.opencode/agents/sddu-plan.md` 不含 §5.8/§5.9
- [ ] `.opencode/agents/sddu-review.md` 不含 plan 审查策略引用，§1 自主化
- [ ] `.opencode/agents/sddu-validate.md` 不含 plan 验证策略引用，§5.0 自主化
- [ ] `.opencode/agents/sddu.md` 包含二维时序路由感知（TASK-010 产物同步验证）
- [ ] 3 个 Agent 的 plugin copy 与 runtime copy 正文内容一致
- [ ] dist 目录下新输出模板文件（sddu-review-report.md.hbs, sddu-validate-report.md.hbs）存在

**验证命令**:
```bash
# 运行构建
npm run build 2>&1; echo "EXIT_CODE=$?"

# 验证 .opencode/ 副本内容正确
echo "=== plan ==="
grep -c "5\.8.*产物审查策略\|5\.9.*产物验证策略" .opencode/agents/sddu-plan.md && echo "FAIL: residue" || echo "PASS: clean"

echo "=== review ==="
grep -c "plan\.md.*产物审查策略" .opencode/agents/sddu-review.md && echo "FAIL: residue" || echo "PASS: clean"
grep -c "自主.*spec.*plan" .opencode/agents/sddu-review.md && echo "PASS: autonomous §1" || echo "WARN: missing"

echo "=== validate ==="
grep -c "验证的第一步永远是读取 plan" .opencode/agents/sddu-validate.md && echo "FAIL: residue" || echo "PASS: clean"
grep -c "场景设计（自主" .opencode/agents/sddu-validate.md && echo "PASS: autonomous §5.0" || echo "WARN: missing"

echo "=== coordinator ==="
grep -c "二维时序\|2D.*timing\|review.*策略设计.*不依赖.*build" .opencode/agents/sddu.md && echo "PASS: 2D routing aware" || echo "WARN: missing"

# 同步一致性：plugin vs runtime 正文 diff（排除 frontmatter）
echo "=== sync check ==="
for agent in plan review validate; do
  diff <(sed -n '/^---$/,/^---$/!p' ".opencode/plugins/sddu/agents/sddu-${agent}.md") \
       <(sed -n '/^---$/,/^---$/!p' ".opencode/agents/sddu-${agent}.md") \
    && echo "OK sddu-${agent}" \
    || echo "WARN sddu-${agent}: body differs"
done

# 验证新输出模板已复制到 dist
echo "=== dist output templates ==="
ls -la dist/templates/output/sddu-review-report.md.hbs 2>/dev/null && echo "PASS: review-report exists" || echo "WARN: missing"
ls -la dist/templates/output/sddu-validate-report.md.hbs 2>/dev/null && echo "PASS: validate-report exists" || echo "WARN: missing"
```

---

### TASK-012: 完整内容验证 — FR/NFR 全量验收

> 执行全量 grep 验证脚本，逐项确认 FR-001~FR-014 和 NFR-001~NFR-006 的验收标准全部满足

| 属性 | 值 |
|------|-----|
| **复杂度** | S |
| **前置依赖** | TASK-001~010（所有改造） + TASK-011（构建完成） |
| **执行波次** | 2 |
| **对应 FR** | FR-001~FR-014（集中验证） |
| **对应 NFR** | NFR-001~NFR-006（集中验证） |

**描述**:
此为"数量基线法"质量门槛的最终落地——对所有 FR 和 NFR 执行可自动化检查的 grep/diff 命令，汇总为 pass/fail 报告矩阵。本任务不修改任何文件，仅执行验证命令并输出结果。

**验证范围**：
- FR-001~FR-002: plan Agent 模板 §5.8/§5.9 删除（源模板 + 构建产物）
- FR-003~FR-004: plan 输出模板 §8/§9 删除
- FR-005~FR-006: review Agent 模板自主化
- FR-007: review 策略/报告文档拆分（输出模板 + 新报告模板）
- FR-008~FR-009: validate Agent 模板自主化（含 ADR-003）
- FR-010: validate 策略/报告文档拆分（输出模板 + 新报告模板）
- FR-011: plugin ↔ runtime 副本同步一致性
- FR-012: 构建兼容性
- FR-013~FR-014: 向后兼容（review/validate 模板中的兼容声明）
- NFR-001: 一致性（diff 验证已含于 TASK-011）
- NFR-002: 兼容性（不破坏已完成 Feature）
- NFR-003: §5.5 格式向前兼容
- NFR-004: 自主策略设计质量指引
- NFR-005: 模板冗余度受控（build-agents.cjs 同步注释）
- NFR-006: 可测试性（本脚本自身即为可测试性证明）

**涉及文件**: 无（纯验证任务，不修改文件）

**验收标准**:
- [ ] 所有 FR-001~FR-014 的 grep/diff 命令返回预期结果
- [ ] 所有 NFR-001~NFR-006 的检查通过
- [ ] 验证结果报告完整，每项标注 PASS/FAIL
- [ ] 0 个 FAIL 项（全部通过）

**验证命令**:
```bash
#!/bin/bash
# ===== SDDU FR-AGENT-SCOPE-001 完整验收脚本 =====
PASS=0; FAIL=0; CHECKS=0

check() {
  local desc="$1"; local expected="$2"; local actual="$3"
  CHECKS=$((CHECKS+1))
  if [ "$expected" = "$actual" ]; then
    echo "✅ PASS [$CHECKS] $desc"; PASS=$((PASS+1))
  else
    echo "❌ FAIL [$CHECKS] $desc (expected=$expected, actual=$actual)"; FAIL=$((FAIL+1))
  fi
}

# ======== FR-001/FR-002: plan Agent 模板剥离 ========
check "FR-001 src plan §5.8" 0 "$(grep -c '5\.8.*产物审查策略' src/templates/agents/sddu-plan.md.hbs 2>/dev/null || echo 0)"
check "FR-002 src plan §5.9" 0 "$(grep -c '5\.9.*产物验证策略' src/templates/agents/sddu-plan.md.hbs 2>/dev/null || echo 0)"
check "FR-001 runtime plan §5.8" 0 "$(grep -c '5\.8.*产物审查策略' .opencode/agents/sddu-plan.md 2>/dev/null || echo 0)"
check "FR-002 runtime plan §5.9" 0 "$(grep -c '5\.9.*产物验证策略' .opencode/agents/sddu-plan.md 2>/dev/null || echo 0)"

# ======== FR-003/FR-004: plan 输出模板 §8/§9 删除 ========
check "FR-003 plan output §8" 0 "$(grep -c '产物审查策略' src/templates/outputs/sddu-plan.md.hbs 2>/dev/null || echo 0)"
check "FR-004 plan output §9" 0 "$(grep -c '产物验证策略' src/templates/outputs/sddu-plan.md.hbs 2>/dev/null || echo 0)"
check "FR-003/004 rev numbering" 1 "$(grep -c '^## 8\. 修订记录' src/templates/outputs/sddu-plan.md.hbs 2>/dev/null || echo 0)"

# ======== FR-005: review Agent §1 自主化 ========
check "FR-005 src review refs" 0 "$(grep -c 'plan\.md.*产物审查策略' src/templates/agents/sddu-review.md.hbs 2>/dev/null || echo 0)"
check "FR-005 src review autonomous" 1 "$(grep -c '自主.*spec.*plan' src/templates/agents/sddu-review.md.hbs 2>/dev/null || echo 0)"
check "FR-005 src review dimensions" 1 "$(grep -c '代码质量.*规范符合.*架构一致.*测试质量' src/templates/agents/sddu-review.md.hbs 2>/dev/null || echo 0)"

# ======== FR-006: review Agent §3/§6 解除依赖 ========
check "FR-006 src review §3" 0 "$(grep -c '审查的产物清单和基准见 plan' src/templates/agents/sddu-review.md.hbs 2>/dev/null || echo 0)"
check "FR-006 src review C1CN" 1 "$(grep -c 'C1.*CN.*审查清单' src/templates/agents/sddu-review.md.hbs 2>/dev/null || echo 0)"

# ======== FR-007: review 策略/报告拆分 ========
check "FR-007 review strategy §2" 1 "$(grep -c '自主审查清单.*C1.*CN' src/templates/outputs/sddu-review.md.hbs 2>/dev/null || echo 0)"
check "FR-007 review-report exists" 1 "$(test -f src/templates/outputs/sddu-review-report.md.hbs && echo 1 || echo 0)"
check "FR-007 review-report content" 1 "$(grep -c '逐项审查结果' src/templates/outputs/sddu-review-report.md.hbs 2>/dev/null || echo 0)"

# ======== FR-008: validate Agent §1 自主化 ========
check "FR-008 src validate first-step" 0 "$(grep -c '验证的第一步永远是读取 plan' src/templates/agents/sddu-validate.md.hbs 2>/dev/null || echo 0)"
check "FR-008 src validate autonomous" 1 "$(grep -c '自主.*spec.*NFR' src/templates/agents/sddu-validate.md.hbs 2>/dev/null || echo 0)"

# ======== FR-009: validate Agent §3/§5.0/§6 解除依赖 ========
check "FR-009 src validate §3" 0 "$(grep -c '验证的产物清单和基准见 plan' src/templates/agents/sddu-validate.md.hbs 2>/dev/null || echo 0)"
check "FR-009 src validate §5.0 old" 0 "$(grep -c '场景验证（plan 驱动' src/templates/agents/sddu-validate.md.hbs 2>/dev/null || echo 0)"
check "FR-009 src validate §5.0 new" 1 "$(grep -c '场景设计（自主' src/templates/agents/sddu-validate.md.hbs 2>/dev/null || echo 0)"
check "FR-009 src validate fallback" 0 "$(grep -c '如果 plan 中无.*产物验证策略.*跳过' src/templates/agents/sddu-validate.md.hbs 2>/dev/null || echo 0)"
check "FR-009 src validate V1VN" 1 "$(grep -c 'V1.*VN.*验证场景' src/templates/agents/sddu-validate.md.hbs 2>/dev/null || echo 0)"

# ======== ADR-003: validate 验证脚本归属 ========
check "ADR-003 script ownership" 1 "$(grep -c '自主编写.*验证脚本\|验证脚本.*不走.*task' src/templates/agents/sddu-validate.md.hbs 2>/dev/null || echo 0)"
check "ADR-003 script path" 1 "$(grep -c '/tmp/sddu-validate' src/templates/agents/sddu-validate.md.hbs 2>/dev/null || echo 0)"

# ======== ADR-004: 双文件产出指引 ========
check "ADR-004 review two-file" 1 "$(grep -c 'review-report\.md' src/templates/agents/sddu-review.md.hbs 2>/dev/null || echo 0)"
check "ADR-004 validate two-file" 1 "$(grep -c 'validate-report\.md' src/templates/agents/sddu-validate.md.hbs 2>/dev/null || echo 0)"

# ======== FR-010: validate 策略/报告拆分 ========
check "FR-010 validate strategy §2" 1 "$(grep -c '自主验证场景.*V1.*VN' src/templates/outputs/sddu-validate.md.hbs 2>/dev/null || echo 0)"
check "FR-010 validate-report exists" 1 "$(test -f src/templates/outputs/sddu-validate-report.md.hbs && echo 1 || echo 0)"
check "FR-010 validate-report content" 1 "$(grep -c '逐项验证结果.*V1.*VN' src/templates/outputs/sddu-validate-report.md.hbs 2>/dev/null || echo 0)"
check "FR-010 validate-report scripts" 1 "$(grep -c '验证脚本执行记录' src/templates/outputs/sddu-validate-report.md.hbs 2>/dev/null || echo 0)"

# ======== TASK-010: @sddu coordinator 路由感知 ========
check "TASK-010 coordinator 2D timing" 1 "$(grep -c '二维时序\|策略设计.*不依赖.*build\|plan.*完成后.*同时.*review.*validate' src/templates/agents/sddu.md.hbs 2>/dev/null || echo 0)"
check "TASK-010 coordinator doc split" 1 "$(grep -c '策略.*报告.*拆分\|review\.md.*review-report\.md\|validate\.md.*validate-report\.md' src/templates/agents/sddu.md.hbs 2>/dev/null || echo 0)"

# ======== FR-011: 副本同步一致性 ========
check "FR-011 plan sync" 0 "$(diff <(sed -n '/^---$/,/^---$/!p' .opencode/plugins/sddu/agents/sddu-plan.md 2>/dev/null) <(sed -n '/^---$/,/^---$/!p' .opencode/agents/sddu-plan.md 2>/dev/null) | wc -l)"
check "FR-011 review sync" 0 "$(diff <(sed -n '/^---$/,/^---$/!p' .opencode/plugins/sddu/agents/sddu-review.md 2>/dev/null) <(sed -n '/^---$/,/^---$/!p' .opencode/agents/sddu-review.md 2>/dev/null) | wc -l)"
check "FR-011 validate sync" 0 "$(diff <(sed -n '/^---$/,/^---$/!p' .opencode/plugins/sddu/agents/sddu-validate.md 2>/dev/null) <(sed -n '/^---$/,/^---$/!p' .opencode/agents/sddu-validate.md 2>/dev/null) | wc -l)"

# ======== FR-012: 构建兼容性 ========
check "FR-012 build exit" 0 "$(npm run build >/dev/null 2>&1; echo $?)"

# ======== FR-013/FR-014: 向后兼容 ========
check "FR-013 review backward" 1 "$(grep -ci '忽略\|旧格式\|backward\|already completed' src/templates/agents/sddu-review.md.hbs 2>/dev/null || echo 0)"
check "FR-014 validate backward" 1 "$(grep -ci '忽略\|旧格式\|backward\|already completed' src/templates/agents/sddu-validate.md.hbs 2>/dev/null || echo 0)"

# ======== NFR-003: §5.5 格式向前兼容 ========
check "NFR-003 plan §5 preserved" 1 "$(grep -c '^## 5\. 文件影响分析' src/templates/outputs/sddu-plan.md.hbs 2>/dev/null || echo 0)"

# ======== NFR-005: 模板冗余度受控 ========
check "NFR-005 build-agents sync comment" 1 "$(grep -c 'source-of-truth' scripts/build-agents.cjs 2>/dev/null || echo 0)"

echo ""
echo "============================================"
echo "  SDDU FR-AGENT-SCOPE-001 Verification"
echo "============================================"
echo "Total checks : $CHECKS"
echo "Passed       : $PASS"
echo "Failed       : $FAIL"
[ "$FAIL" -eq 0 ] && echo "🎉 ALL PASS" || echo "❌ HAS FAILURES - review above"
```

---

## 3. 任务汇总
> 任务数量、复杂度和波次的统计总览

| 统计项 | 数值 |
|--------|:--:|
| 总任务数 | 12 |
| S 级 (简单: 单文件<50行) | 3 |
| M 级 (中等: 多文件<200行) | 9 |
| L 级 (复杂: >200行) | 0 |
| 执行波次 | 2 |

| 波次 | 任务数 | 类型 | 并行 |
|:--:|:--:|------|:--:|
| 1 | 10 | 9M + 1S（全部文件修改/创建） | ✅ 全部并行 |
| 2 | 2 | 2S（构建 + 验证） | ✅ 全部并行 |

## 4. 执行策略
> 各波次的执行说明

**Wave 1（10 个任务全部并行）**：
- TASK-001~TASK-008 全部修改 `src/templates/` 下不同文件，零重叠——各任务操作互不冲突
- TASK-009 修改 `scripts/build-agents.cjs`，与模板操作互不冲突
- TASK-010 修改 `src/templates/agents/sddu.md.hbs`（@sddu coordinator 模板），与 TASK-001~003 不同文件，不冲突
- **效率提示**：TASK-001~003（Agent 源码模板 3 文件）+ TASK-010（coordinator 模板）可在一个 build 命令中批量执行 `@sddu-build TASK-001~003 TASK-010`

**Wave 2（依赖 Wave 1 全部完成）**：
- TASK-011 运行构建将 `src/templates/` 的改造同步到 `.opencode/` 副本
- TASK-012 执行全量验证脚本，确认所有 FR/NFR 验收标准通过
- 两任务可并行（TASK-012 验证源文件，TASK-011 验证构建产物）

**关键约束**：
- **禁止直接修改 `.opencode/` 下的文件**——所有 Agent 模板变更只改 `src/templates/agents/*.hbs`，由 `npm run build` 生成运行时副本（README 约束）
- TASK-006、TASK-008 是新文件创建（CREATE），其余为文件修改（MODIFY）
- S 级任务（TASK-009, TASK-011, TASK-012）可在一个 build 指令中批量执行
- TASK-010 是 plan v1.6 新增项——@sddu coordinator 模板不修改运行时逻辑（符合 NG-004），仅更新 Agent 指令模板使其感知二维时序和文档拆分

**FR 覆盖矩阵**：

| FR | TASK-001 | TASK-002 | TASK-003 | TASK-004 | TASK-005 | TASK-006 | TASK-007 | TASK-008 | TASK-009 | TASK-010 | TASK-011 | TASK-012 |
|----|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| FR-001 | ✅ | | | | | | | | | | ✅ | ✅ |
| FR-002 | ✅ | | | | | | | | | | ✅ | ✅ |
| FR-003 | | | | ✅ | | | | | | | | ✅ |
| FR-004 | | | | ✅ | | | | | | | | ✅ |
| FR-005 | | ✅ | | | | | | | | | ✅ | ✅ |
| FR-006 | | ✅ | | | | | | | | | ✅ | ✅ |
| FR-007 | | ✅ | | | ✅ | ✅ | | | | | | ✅ |
| FR-008 | | | ✅ | | | | | | | | ✅ | ✅ |
| FR-009 | | | ✅ | | | | | | | | ✅ | ✅ |
| FR-010 | | | ✅ | | | | ✅ | ✅ | | | | ✅ |
| FR-011 | | | | | | | | | | | ✅ | ✅ |
| FR-012 | | | | | | | | | ✅ | | ✅ | ✅ |
| FR-013 | | ✅ | | | | | | | | | | ✅ |
| FR-014 | | | ✅ | | | | | | | | | ✅ |

**ADR 覆盖矩阵**：

| ADR | 标题 | 落地的任务 |
|-----|------|-----------|
| ADR-001 | 混合指引范式（维度清单 + 结构化模板 + 质量门槛） | TASK-002, TASK-003, TASK-005, TASK-007 |
| ADR-002 | 一次性全量改造（src/templates/ + scripts/） | 所有 Wave 1 任务 |
| ADR-003 | validate 验证脚本归属 | TASK-003, TASK-008 |
| ADR-004 | review/validate 策略与报告文档拆分 | TASK-002, TASK-003, TASK-005, TASK-006, TASK-007, TASK-008, **TASK-010** |

## 修订记录
> 记录本文档的版本变更历史

| 版本 | 变更说明 | 日期 | 修订人 |
|------|---------|------|--------|
| v3.1 | 任务排序修正 — 将 TASK-012（@sddu coordinator 模板）移至 Wave 1 的 TASK-010 位置（紧随 TASK-009 之后），原 TASK-010/011（构建验证/验收）顺延为 TASK-011/012，全文件引用同步重映射 | 2026-08-01 | SDDU Tasks Agent |
| v3.0 | 基于 plan v1.6 重生成 — 新增 TASK-010（@sddu coordinator 模板路由感知更新：§5.2 二维时序路由约束、§6.6 二维时序引导、§3 文档拆分标注）；任务从 11→12，M×9 / S×3，波次保持 2；TASK-011/012 前置依赖扩展至 TASK-010；ADR-004 覆盖矩阵加入 TASK-010 | 2026-08-01 | SDDU Tasks Agent |
| v2.0 | 基于 plan v1.5 重生成 — 遵守 README 约束（仅改 `src/templates/` + `scripts/`，`.opencode/` 由构建生成）；新增 TASK-006/008（review-report/validate-report 输出模板，ADR-004）；TASK-003 增加 ADR-003 脚本归属；任务从 9 个增至 11 个 | 2026-08-01 | SDDU Tasks Agent |
| v1.0 | 初始创建 — 基于 plan v1.0 + spec v1.0，9 个任务、2 个波次 | 2026-07-25 | SDDU Tasks Agent |
