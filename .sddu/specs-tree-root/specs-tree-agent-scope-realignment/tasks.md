# 任务分解：plan/review/validate 职责回归改造

> **文档定位**: SDDU 任务清单 — 将技术方案分解为可并行执行的原子任务，作为 build 阶段的输入  
> **前置依赖**: plan.md（技术方案）、spec.md（需求规范）  
> **创建人**: SDDU Tasks Agent  
> **创建时间**: 2026-07-25  
> **版本**: v1.0  
> **更新人**: SDDU Tasks Agent  
> **更新时间**: 2026-07-25  
> **更新说明**: 初始创建 — 基于 plan.md (推荐方案 C：混合指引范式 + 一次性全量改造) 和 spec.md (14 FR / 6 NFR / 7 EC)，分解为 9 个原子任务、2 个波次

## 1. 依赖拓扑总览
> 任务依赖关系和执行顺序

```
Wave 1 ─── (无依赖，5 个 M 级任务全部并行)
  TASK-001 [M]  plan Agent 模板剥离 — 删除 plugin + runtime 副本的 §5.8/§5.9
  TASK-002 [M]  review Agent 模板自主化 — 改写 plugin + runtime 副本的 §1/§3/§6/§10
  TASK-003 [M]  validate Agent 模板自主化 — 改写 plugin + runtime 副本的 §1/§3/§5.0/§6/§10
  TASK-004 [M]  Agent 源模板同步 — 同步 3 个 src/templates/agents/*.hbs
  TASK-005 [M]  输出模板改造 — 修改 3 个 src/templates/outputs/*.hbs

Wave 2 ─── (依赖 Wave 1 全部完成)
  TASK-006 [S]  build-agents.cjs 同步注释 — 在构建脚本头部添加同步机制说明
  TASK-007 [S]  构建兼容性验证 — 运行构建脚本确认 exit 0
  TASK-008 [S]  内容正确性全面验证 — grep 检查所有 FR-001~FR-010 验收标准
  TASK-009 [S]  同步一致性验证 — diff 验证 plugin ↔ runtime 6 份副本一致
```

## 2. 任务列表
> 每个任务的详细定义

### TASK-001: plan Agent 模板剥离
> 从 plan Agent 的 plugin copy 和 runtime copy 中删除 §5.8（产物审查策略）和 §5.9（产物验证策略）

| 属性 | 值 |
|------|-----|
| **复杂度** | M |
| **前置依赖** | 无 |
| **执行波次** | 1 |
| **对应 FR** | FR-001, FR-002 |

**描述**: 
删除 `.opencode/agents/sddu-plan.md` 和 `.opencode/plugins/sddu/agents/sddu-plan.md` 中的 §5.8「产物审查策略」（L112-116）和 §5.9「产物验证策略」（L117-120）。两处删除内容完全一致（当前 diff 为空），逐段落精确删除即可。注意保留 §5.7 ADR 模板示例（L95-111）和 §6 输出模板章节（L122+）之间的分隔符和换行，删除后不留多余空行。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| MODIFY | `.opencode/agents/sddu-plan.md` |
| MODIFY | `.opencode/plugins/sddu/agents/sddu-plan.md` |

**验收标准**:
- [ ] `.opencode/agents/sddu-plan.md` 中搜索「5.8 ``产物审查策略``」返回 0 结果
- [ ] `.opencode/agents/sddu-plan.md` 中搜索「5.9 ``产物验证策略``」返回 0 结果
- [ ] `.opencode/plugins/sddu/agents/sddu-plan.md` 中搜索「5.8 ``产物审查策略``」返回 0 结果
- [ ] `.opencode/plugins/sddu/agents/sddu-plan.md` 中搜索「5.9 ``产物验证策略``」返回 0 结果
- [ ] §5.7（ADR 模板示例）与 §6（输出模板）之间无残留空行或断裂

**验证命令**:
```bash
# FR-001: 验证 §5.8 已从两份副本删除
grep -c "5\.8.*产物审查策略" .opencode/agents/sddu-plan.md
grep -c "5\.8.*产物审查策略" .opencode/plugins/sddu/agents/sddu-plan.md

# FR-002: 验证 §5.9 已从两份副本删除
grep -c "5\.9.*产物验证策略" .opencode/agents/sddu-plan.md
grep -c "5\.9.*产物验证策略" .opencode/plugins/sddu/agents/sddu-plan.md

# 验证 §5.7→§6 过渡无断裂
grep -c "^## 6\. 输出模板" .opencode/agents/sddu-plan.md
```

### TASK-002: review Agent 模板自主化
> 将 review Agent 模板从"被动消费 plan 审查策略"改造为"自主定义 C1~CN 审查清单"

| 属性 | 值 |
|------|-----|
| **复杂度** | M |
| **前置依赖** | 无 |
| **执行波次** | 1 |
| **对应 FR** | FR-005, FR-006 |

**描述**:
修改 `.opencode/agents/sddu-review.md` 和 `.opencode/plugins/sddu/agents/sddu-review.md` 的 4 处内容：

1. **§1 角色定位（L16）**：将「审查的产物清单和基准以 plan.md 中「产物审查策略」章节为准，该章节定义的审查清单（C1~CN）是你的首要检查项」替换为自主描述——review 自主从 spec+plan+产物中提取审查对象，运用 §5.1~5.4 审查方法论自主定义 C1~CN 审查清单。

2. **§3 依赖关系（L39）**：删除「审查的产物清单和基准见 plan.md 中「产物审查策略」章节（搜索该标题，不依赖固定章节号）」。

3. **§6 审查标准（L82）**：将「审查的产物和基准见 plan.md 中「产物审查策略」章节（搜索该标题，不依赖固定章节号），以下为流程通过标准」替换为「审查对象和基准基于本 Agent 自主定义的 C1~CN 审查清单，以下为流程通过标准」。

4. **§10 示例对话（L142-149）**：移除示例中对「读取 plan 审查策略」的描述，改为自主审查模式。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| MODIFY | `.opencode/agents/sddu-review.md` |
| MODIFY | `.opencode/plugins/sddu/agents/sddu-review.md` |

**验收标准**:
- [ ] §1 包含「自主从 spec+plan+产物」语义，不含对 plan.md「产物审查策略」的引用
- [ ] §3 不含对 plan.md「产物审查策略」的引用
- [ ] §6 不含对 plan.md「产物审查策略」的引用，含「C1~CN 审查清单」
- [ ] §10 示例不含「读取 plan 审查策略」类描述
- [ ] 两份副本（plugin + runtime）改造后内容一致

**验证命令**:
```bash
# FR-005: §1 不再引用 plan 审查策略，改为自主模式
grep -c "plan\.md.*产物审查策略" .opencode/agents/sddu-review.md
grep -c "自主.*spec.*plan" .opencode/agents/sddu-review.md

# FR-006: §3/§6 不再引用 plan 审查策略
grep -c "审查的产物清单和基准见 plan" .opencode/agents/sddu-review.md
grep -c "C1.*CN.*审查清单" .opencode/agents/sddu-review.md

# plugin copy 同步验证
grep -c "plan\.md.*产物审查策略" .opencode/plugins/sddu/agents/sddu-review.md
grep -c "审查的产物清单和基准见 plan" .opencode/plugins/sddu/agents/sddu-review.md
```

### TASK-003: validate Agent 模板自主化
> 将 validate Agent 模板从"被动消费 plan 验证策略"改造为"自主定义 V1~VN 验证场景"

| 属性 | 值 |
|------|-----|
| **复杂度** | M |
| **前置依赖** | 无 |
| **执行波次** | 1 |
| **对应 FR** | FR-008, FR-009 |

**描述**:
修改 `.opencode/agents/sddu-validate.md` 和 `.opencode/plugins/sddu/agents/sddu-validate.md` 的 5 处内容：

1. **§1 角色定位（L16-17）**：将「验证的第一步永远是读取 plan.md 中的「产物验证策略」章节——plan 定义的验证场景是你最重要的任务清单，以下通用步骤是其补充和兜底」替换为自主描述——validate 自主从 spec+NFR+产物中提取验证对象，运用 §5.1~5.5 验证方法论自主定义 V1~VN 验证场景。

2. **§3 依赖关系（L35）**：删除「验证的产物清单和基准见 plan.md 中「产物验证策略」章节（搜索该标题，不依赖固定章节号）」。

3. **§5.0 场景验证（L51-69）**：将标题从「场景验证（plan 驱动 — 优先级最高）」改为「场景设计（自主 — 优先级最高）」；将执行步骤从「读取 plan 验证策略 → 执行」改为「自主从 spec+NFR+产物中设计验证场景矩阵 V1~VN → 执行」；删除原步骤 1「读取 plan 验证策略」和末尾的兜底提示「如果 plan 中无「产物验证策略」章节，跳过本步骤」。

4. **§6 验证标准（L145）**：将「验证的产物和基准见 plan.md 中「产物验证策略」章节（搜索该标题，不依赖固定章节号），以下为流程通过标准」替换为「验证对象和基准基于本 Agent 自主定义的 V1~VN 验证场景，以下为流程通过标准」。

5. **§10 示例对话（L207-219）**：更新示例——移除「先读 plan 验证策略」「plan §10 定义了 4 个验证场景」类描述，改为「自主从 spec+NFR 中设计 V1~VN 场景矩阵」的自主模式示例。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| MODIFY | `.opencode/agents/sddu-validate.md` |
| MODIFY | `.opencode/plugins/sddu/agents/sddu-validate.md` |

**验收标准**:
- [ ] §1 包含「自主从 spec+NFR+产物」语义，不含对 plan.md「产物验证策略」作为第一步的引用
- [ ] §3 不含对 plan.md「产物验证策略」的引用
- [ ] §5.0 标题改为「场景设计（自主 — 优先级最高）」，入口从读取 plan 验证策略改为自主设计
- [ ] §6 不含对 plan.md「产物验证策略」的引用，含「V1~VN 验证场景」
- [ ] §10 示例不含「读取 plan 验证策略」类描述，改为自主模式
- [ ] 两份副本（plugin + runtime）改造后内容一致

**验证命令**:
```bash
# FR-008: §1 不再以"读取 plan 验证策略"为第一步
grep -c "验证的第一步永远是读取 plan" .opencode/agents/sddu-validate.md
grep -c "自主.*spec.*NFR" .opencode/agents/sddu-validate.md

# FR-009: §3/§5.0/§6 不再引用 plan 验证策略
grep -c "验证的产物清单和基准见 plan" .opencode/agents/sddu-validate.md
grep -c "场景验证（plan 驱动" .opencode/agents/sddu-validate.md
grep -c "场景设计（自主" .opencode/agents/sddu-validate.md
grep -c "V1.*VN.*验证场景" .opencode/agents/sddu-validate.md

# §5.0 不再包含旧的兜底逻辑
grep -c "如果 plan 中无.*产物验证策略.*跳过" .opencode/agents/sddu-validate.md

# plugin copy 同步验证
grep -c "验证的第一步永远是读取 plan" .opencode/plugins/sddu/agents/sddu-validate.md
grep -c "场景设计（自主" .opencode/plugins/sddu/agents/sddu-validate.md
```

### TASK-004: Agent 源模板同步
> 同步 src/templates/agents/ 下 3 个 .hbs 源模板文件，确保改造内容与 runtime/plugin copies 一致

| 属性 | 值 |
|------|-----|
| **复杂度** | M |
| **前置依赖** | 无（可参考已完成 TASK-001~003 的内容，但不构成硬依赖） |
| **执行波次** | 1 |
| **对应 FR** | FR-001, FR-002, FR-005, FR-006, FR-008, FR-009（源模板同步） |

**描述**:
`src/templates/agents/` 是 build-agents.cjs 的输入源——它读取这些 .hbs 文件并生成 dist 输出。本次改造需保持源模板与 Agent 副本内容一致：

1. **`src/templates/agents/sddu-plan.md.hbs`**：删除 §5.8（L112-116）和 §5.9（L117-120）——与 TASK-001 修改内容完全一致。
2. **`src/templates/agents/sddu-review.md.hbs`**：改写 §1（L16）、§3（L39）、§6（L82）、§10——与 TASK-002 修改内容完全一致。
3. **`src/templates/agents/sddu-validate.md.hbs`**：改写 §1（L16-17）、§3（L35）、§5.0（L51-69）、§6（L145）、§10——与 TASK-003 修改内容完全一致。

**注意**：如果 TASK-001~003 先完成，可以直接将对应的 runtime copy 内容 diff 应用到源模板文件上，减少逐行修改的工作量。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| MODIFY | `src/templates/agents/sddu-plan.md.hbs` |
| MODIFY | `src/templates/agents/sddu-review.md.hbs` |
| MODIFY | `src/templates/agents/sddu-validate.md.hbs` |

**验收标准**:
- [ ] `src/templates/agents/sddu-plan.md.hbs` 不含 §5.8/§5.9
- [ ] `src/templates/agents/sddu-review.md.hbs` 不含对 plan「产物审查策略」的引用
- [ ] `src/templates/agents/sddu-validate.md.hbs` 不含对 plan「产物验证策略」的引用且 §5.0 改为自主模式
- [ ] 源模板与对应 Agent runtime copy 各自带 frontmatter 差异外内容一致

**验证命令**:
```bash
# plan 源模板验证
grep -c "5\.8.*产物审查策略" src/templates/agents/sddu-plan.md.hbs
grep -c "5\.9.*产物验证策略" src/templates/agents/sddu-plan.md.hbs

# review 源模板验证
grep -c "plan\.md.*产物审查策略" src/templates/agents/sddu-review.md.hbs

# validate 源模板验证
grep -c "验证的第一步永远是读取 plan" src/templates/agents/sddu-validate.md.hbs
grep -c "场景设计（自主" src/templates/agents/sddu-validate.md.hbs
```

### TASK-005: 输出模板改造
> 修改 src/templates/outputs/ 下 3 个输出模板，适配 plan 剥离和 review/validate 自主输出

| 属性 | 值 |
|------|-----|
| **复杂度** | M |
| **前置依赖** | 无 |
| **执行波次** | 1 |
| **对应 FR** | FR-003, FR-004, FR-007, FR-010 |

**描述**:
修改 3 个输出模板文件，使其与 Agent 模板改造匹配：

1. **`src/templates/outputs/sddu-plan.md.hbs`**（FR-003, FR-004）：
   - 删除 §8「产物审查策略」（L65-72，包含表格：审查产物/审查基准 2 列 3 行）
   - 删除 §9「产物验证策略」（L74-80，包含表格：验证产物/验证基准 2 列 2 行）
   - 将原「修订记录」章节前补上 `## 8. 修订记录` 编号（当前无编号，直接是 `## 修订记录`）
   - 质量门槛提示：在修订记录前增加 migration note 注释行

2. **`src/templates/outputs/sddu-review.md.hbs`**（FR-007）：
   - 在 §1「审查概要」之后、原 §2「审查详情」之前，新增 `## 2. 自主审查清单（C1~CN）` section
   - 模板内容：审查对象来源说明（从 spec+plan+产物中提取），审查清单表格（# / 审查对象 / 审查基准 / 审查结果），质量门槛提示（每个 FR ≥ 1 个 Cx，每维度至少 1 条，不适用项显式标注并说明原因）
   - 原 §2→§3、§3→§4、§4→§5、§5→§6，修订记录编号顺延为 §7

3. **`src/templates/outputs/sddu-validate.md.hbs`**（FR-010）：
   - 在 §1「验证概要」之后、原 §2「测试覆盖验证」之前，新增 `## 2. 自主验证场景（V1~VN）` section
   - 模板内容：验证对象来源说明（从 spec+NFR+产物中提取），验证场景表格（# / 验证对象 / 验证步骤 / 预期结果 / 实测结果），质量门槛提示（每个 FR ≥ 1 个 Vx，每验证维度至少 1 条，无法验证项显式标注原因）
   - 原 §2→§3、§3→§4、...、§7→§8，修订记录编号顺延为 §9

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| MODIFY | `src/templates/outputs/sddu-plan.md.hbs` |
| MODIFY | `src/templates/outputs/sddu-review.md.hbs` |
| MODIFY | `src/templates/outputs/sddu-validate.md.hbs` |

**验收标准**:
- [ ] plan 输出模板中搜索「产物审查策略」返回 0 结果
- [ ] plan 输出模板中搜索「产物验证策略」返回 0 结果
- [ ] plan 输出模板中原「修订记录」有 §8 编号
- [ ] plan 输出模板中包含 v3.0.0 migration note
- [ ] review 输出模板包含 `## 2. 自主审查清单（C1~CN）` section
- [ ] validate 输出模板包含 `## 2. 自主验证场景（V1~VN）` section
- [ ] 新增 section 后的原章节编号顺延正确（review 模板修订记录为 §7，validate 模板修订记录为 §9）

**验证命令**:
```bash
# FR-003/FR-004: plan 输出模板删除 §8/§9
grep -c "产物审查策略" src/templates/outputs/sddu-plan.md.hbs
grep -c "产物验证策略" src/templates/outputs/sddu-plan.md.hbs
grep -c "^## 8\. 修订记录" src/templates/outputs/sddu-plan.md.hbs

# FR-007: review 输出模板新增自主审查清单
grep -c "自主审查清单.*C1.*CN" src/templates/outputs/sddu-review.md.hbs
grep -c "^## 7\. 修订记录" src/templates/outputs/sddu-review.md.hbs

# FR-010: validate 输出模板新增自主验证场景
grep -c "自主验证场景.*V1.*VN" src/templates/outputs/sddu-validate.md.hbs
grep -c "^## 9\. 修订记录" src/templates/outputs/sddu-validate.md.hbs
```

### TASK-006: build-agents.cjs 同步注释
> 在构建脚本头部添加插件副本与运行时副本同步机制的说明注释

| 属性 | 值 |
|------|-----|
| **复杂度** | S |
| **前置依赖** | TASK-001~005（需知悉 3 个 Agent 的 2 份副本同步关系） |
| **执行波次** | 2 |
| **对应 FR** | FR-012（文档化部分），NFR-005 |

**描述**:
在 `scripts/build-agents.cjs` 文件头部注释块中增加同步说明。具体位置：在现有注释块末尾（`*/` 之前，约 L11），添加以下说明段落，列出 3 层文件路径（源模板 → 运行时副本 → 插件副本）和同步维护规则。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| MODIFY | `scripts/build-agents.cjs` |

**验收标准**:
- [ ] build-agents.cjs 头部注释包含「同步关系说明」段落
- [ ] 注释中列出了 3 层文件路径和同步维护规则
- [ ] 添加注释不破坏脚本语法（`node -c scripts/build-agents.cjs` 退出码 0）

**验证命令**:
```bash
# 验证同步注释已添加
grep -c "同步关系说明" scripts/build-agents.cjs
grep -c "source-of-truth" scripts/build-agents.cjs
grep -c "自动同步机制" scripts/build-agents.cjs

# 验证脚本语法正确
node -c scripts/build-agents.cjs && echo "SYNTAX_OK" || echo "SYNTAX_ERROR"
```

### TASK-007: 构建兼容性验证
> 运行 build-agents.cjs 验证改造后的模板可正确构建

| 属性 | 值 |
|------|-----|
| **复杂度** | S |
| **前置依赖** | TASK-001~005（模板文件已改造完成） |
| **执行波次** | 2 |
| **对应 FR** | FR-012 |

**描述**:
执行 `node scripts/build-agents.cjs`，确认构建过程在改造后的模板上不产生错误。build-agents.cjs 的工作方式是：读取 `src/templates/agents/*.hbs` → 做 frontmatter 替换 → 输出到 `dist/templates/agents/`。它不依赖模板的章节结构（不解析 Markdown 内容），因此删除 §5.8/§5.9 或新增章节理论上不会导致构建失败。

**验证步骤**：
1. 确认 `src/templates/agents/sddu-plan.md.hbs` 的 §5.8/§5.9 已删除
2. 运行 `node scripts/build-agents.cjs`
3. 检查退出码为 0
4. 检查构建日志中无 ERROR 级别输出
5. 检查 `dist/templates/agents/` 下的输出文件存在且有内容

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| (无) | 此任务为验证任务，不修改文件 |

**验收标准**:
- [ ] `node scripts/build-agents.cjs` 退出码为 0
- [ ] 构建日志无 ERROR
- [ ] `dist/templates/agents/sddu-plan-*.md` 文件存在且不含 §5.8/§5.9
- [ ] `dist/templates/agents/sddu-review-*.md` 文件存在且不含 plan 策略引用
- [ ] `dist/templates/agents/sddu-validate-*.md` 文件存在且不含 plan 策略引用

**验证命令**:
```bash
# 运行构建
node scripts/build-agents.cjs 2>&1; echo "EXIT_CODE=$?"

# 验证 dist 输出文件内容正确
grep -c "5\.8.*产物审查策略" dist/templates/agents/sddu-plan-sddu.md 2>/dev/null || echo "OK: 0"
grep -c "plan\.md.*产物审查策略" dist/templates/agents/sddu-review-sddu.md 2>/dev/null || echo "OK: 0"
grep -c "验证的第一步永远是读取 plan" dist/templates/agents/sddu-validate-sddu.md 2>/dev/null || echo "OK: 0"
```

### TASK-008: 内容正确性全面验证
> 对所有 12 个目标文件执行 grep 验证，确认 FR-001~FR-010 的每一条验收标准全部满足

| 属性 | 值 |
|------|-----|
| **复杂度** | S |
| **前置依赖** | TASK-001~005（全部修改任务完成） |
| **执行波次** | 2 |
| **对应 FR** | FR-001~FR-010（集中验证） |

**描述**:
此为「数量基线法」质量门槛的具体落地——对每个 FR 执行至少 1 条可自动化检查的 grep 命令，汇总所有验收标准为单一的 pass/fail 报告。本任务不修改任何文件，仅执行验证命令并输出结果矩阵。

**验证范围**（14 个 FR 中 10 个 P0 FR）：
- FR-001/FR-002: plan Agent 模板 §5.8/§5.9 删除（4 个 grep）
- FR-003/FR-004: plan 输出模板 §8/§9 删除（2 个 grep）
- FR-005/FR-006: review Agent 模板自主化（5 个 grep）
- FR-008/FR-009: validate Agent 模板自主化（8 个 grep）
- FR-007/FR-010: 输出模板新增 section（4 个 grep）

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| (无) | 此任务为验证任务，不修改文件 |

**验收标准**:
- [ ] 所有 FR-001~FR-010 的 grep 命令返回预期结果（0 或 >=1 按需）
- [ ] 验证结果报告完整，每项标注 PASS/FAIL
- [ ] 0 个 FAIL 项（全部通过）

**验证命令**:
```bash
# ===== 综合验证脚本 =====
PASS=0; FAIL=0

check() {
  local desc="$1"; local expected="$2"; local actual="$3"
  if [ "$expected" = "$actual" ]; then
    echo "PASS $desc"; PASS=$((PASS+1))
  else
    echo "FAIL $desc (expected: $expected, actual: $actual)"; FAIL=$((FAIL+1))
  fi
}

# FR-001/FR-002: plan Agent 模板
check "FR-001 runtime 5.8" 0 "$(grep -c '5\.8.*产物审查策略' .opencode/agents/sddu-plan.md 2>/dev/null || echo 0)"
check "FR-001 plugin 5.8"  0 "$(grep -c '5\.8.*产物审查策略' .opencode/plugins/sddu/agents/sddu-plan.md 2>/dev/null || echo 0)"
check "FR-002 runtime 5.9" 0 "$(grep -c '5\.9.*产物验证策略' .opencode/agents/sddu-plan.md 2>/dev/null || echo 0)"
check "FR-002 plugin 5.9"  0 "$(grep -c '5\.9.*产物验证策略' .opencode/plugins/sddu/agents/sddu-plan.md 2>/dev/null || echo 0)"

# FR-003/FR-004: plan 输出模板
check "FR-003 plan-output 审查策略" 0 "$(grep -c '产物审查策略' src/templates/outputs/sddu-plan.md.hbs 2>/dev/null || echo 0)"
check "FR-004 plan-output 验证策略" 0 "$(grep -c '产物验证策略' src/templates/outputs/sddu-plan.md.hbs 2>/dev/null || echo 0)"

# FR-005: review §1
check "FR-005 runtime plan-ref" 0 "$(grep -c 'plan\.md.*产物审查策略' .opencode/agents/sddu-review.md 2>/dev/null || echo 0)"
check "FR-005 runtime autonomous" 1 "$(grep -c '自主.*spec.*plan' .opencode/agents/sddu-review.md 2>/dev/null || echo 0)"
check "FR-005 plugin plan-ref"  0 "$(grep -c 'plan\.md.*产物审查策略' .opencode/plugins/sddu/agents/sddu-review.md 2>/dev/null || echo 0)"

# FR-006: review §3/§6
check "FR-006 runtime 3-plan" 0 "$(grep -c '审查的产物清单和基准见 plan' .opencode/agents/sddu-review.md 2>/dev/null || echo 0)"
check "FR-006 runtime C1-CN"  1 "$(grep -c 'C1.*CN.*审查清单' .opencode/agents/sddu-review.md 2>/dev/null || echo 0)"

# FR-008: validate §1
check "FR-008 runtime first-step" 0 "$(grep -c '验证的第一步永远是读取 plan' .opencode/agents/sddu-validate.md 2>/dev/null || echo 0)"
check "FR-008 runtime autonomous" 1 "$(grep -c '自主.*spec.*NFR' .opencode/agents/sddu-validate.md 2>/dev/null || echo 0)"

# FR-009: validate §3/§5.0/§6
check "FR-009 runtime 3-plan"      0 "$(grep -c '验证的产物清单和基准见 plan' .opencode/agents/sddu-validate.md 2>/dev/null || echo 0)"
check "FR-009 runtime 5.0-plan"    0 "$(grep -c '场景验证（plan 驱动' .opencode/agents/sddu-validate.md 2>/dev/null || echo 0)"
check "FR-009 runtime 5.0-auto"    1 "$(grep -c '场景设计（自主' .opencode/agents/sddu-validate.md 2>/dev/null || echo 0)"
check "FR-009 runtime 6-V1VN"      1 "$(grep -c 'V1.*VN.*验证场景' .opencode/agents/sddu-validate.md 2>/dev/null || echo 0)"
check "FR-009 runtime fallback"    0 "$(grep -c '如果 plan 中无.*产物验证策略.*跳过' .opencode/agents/sddu-validate.md 2>/dev/null || echo 0)"

# FR-007: review 输出模板
check "FR-007 review-output C1CN" 1 "$(grep -c '自主审查清单.*C1.*CN' src/templates/outputs/sddu-review.md.hbs 2>/dev/null || echo 0)"

# FR-010: validate 输出模板
check "FR-010 validate-output V1VN" 1 "$(grep -c '自主验证场景.*V1.*VN' src/templates/outputs/sddu-validate.md.hbs 2>/dev/null || echo 0)"

echo ""
echo "===== Verification Summary ====="
echo "Pass: $PASS / Fail: $FAIL"
[ "$FAIL" -eq 0 ] && echo "ALL PASS" || echo "HAS FAILURES - check above"
```

### TASK-009: 同步一致性验证
> 逐对 diff plugin copy 与 runtime copy，确认 3 个 Agent 的 2 份副本内容一致（FR-011, NFR-001）

| 属性 | 值 |
|------|-----|
| **复杂度** | S |
| **前置依赖** | TASK-001~005（全部修改任务完成） |
| **执行波次** | 2 |
| **对应 FR** | FR-011, NFR-001 |

**描述**:
对 plan/review/validate 三个 Agent，逐对比较 plugin copy（`.opencode/plugins/sddu/agents/`）与 runtime copy（`.opencode/agents/`）的内容差异。改造前已验证两副本 diff 为空，改造后应保持这一一致性。

**验证维度**：
1. plugin copy 与 runtime copy 逐对 diff：3 个 Agent x 1 对 = 3 次 diff
2. frontmatter 差异为允许差异：如果存在差异，仅允许 frontmatter 字段差异
3. 同步性验证：确认删除/改写/新增等改造在双副本上同步完成

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| (无) | 此任务为验证任务，不修改文件 |

**验收标准**:
- [ ] plan Agent 的 plugin copy 与 runtime copy 正文内容一致
- [ ] review Agent 的 plugin copy 与 runtime copy 正文内容一致
- [ ] validate Agent 的 plugin copy 与 runtime copy 正文内容一致
- [ ] 如存在差异，仅限 frontmatter 区（`---` 块内），正文区域完全一致

**验证命令**:
```bash
echo "===== Plugin vs Runtime Copy Consistency Check ====="

check_diff() {
  local agent="$1"
  local plugin=".opencode/plugins/sddu/agents/sddu-${agent}.md"
  local runtime=".opencode/agents/sddu-${agent}.md"

  # Exclude frontmatter and compare body
  diff <(sed -n '/^---$/,/^---$/!p' "$plugin" 2>/dev/null) \
       <(sed -n '/^---$/,/^---$/!p' "$runtime" 2>/dev/null) \
    && echo "OK sddu-${agent}: body content identical" \
    || echo "WARN sddu-${agent}: body content differs, please check"
}

check_diff "plan"
check_diff "review"
check_diff "validate"

echo ""
echo "===== Full diff (including frontmatter) ====="
echo "--- sddu-plan ---"
diff .opencode/plugins/sddu/agents/sddu-plan.md .opencode/agents/sddu-plan.md || true
echo "--- sddu-review ---"
diff .opencode/plugins/sddu/agents/sddu-review.md .opencode/agents/sddu-review.md || true
echo "--- sddu-validate ---"
diff .opencode/plugins/sddu/agents/sddu-validate.md .opencode/agents/sddu-validate.md || true
```

## 3. 任务汇总
> 任务数量、复杂度和波次的统计总览

| 统计项 | 数值 |
|--------|:--:|
| 总任务数 | 9 |
| S 级 (简单) | 4 |
| M 级 (中等) | 5 |
| L 级 (复杂) | 0 |
| 执行波次 | 2 |

## 4. 执行策略
> 各波次的执行说明

| 波次 | 任务 | 策略 |
|:--:|------|------|
| 1 | TASK-001, TASK-002, TASK-003, TASK-004, TASK-005 | 并行执行（5 个 M 级任务互不依赖，分别修改 Agent 模板的不同文件组） |
| 2 | TASK-006, TASK-007, TASK-008, TASK-009 | 并行执行（依赖 Wave 1 全部完成，4 个 S 级验证任务可并行） |

**注意事项**：
- Wave 1 中 TASK-004（源模板同步）建议在 TASK-001~003 完成后再执行，可直接 diff 对应用 runtime copy 来减少工作量——但这只是效率建议，非硬依赖
- Wave 2 中的 TASK-006 可在 Wave 1 后立即执行（仅改 1 个脚本文件）；TASK-007~009 是纯验证任务，不修改文件
- **S 级任务可批量执行**：Wave 2 的 4 个 S 级任务可合并为一个 build 指令 `@sddu-build TASK-006~009` 一次性执行

## 修订记录
> 记录本文档的版本变更历史

| 版本 | 变更说明 | 日期 | 修订人 |
|------|---------|------|--------|
| v1.0 | 初始创建 — 基于 plan.md (推荐方案 C) + spec.md (14 FR)，分解为 9 个任务 2 个波次 | 2026-07-25 | SDDU Tasks Agent |
