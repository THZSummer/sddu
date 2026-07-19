# 任务分解：@sddu-tree Agent 技能化

> **文档定位**: SDDU 任务清单 — 将技术方案分解为可并行执行的原子任务，作为 build 阶段的输入  
> **前置依赖**: plan.md（技术方案 v1.2）、spec.md（需求规范 v1.0）  
> **创建人**: SDDU Tasks Agent  
> **创建时间**: 2026-07-19  
> **版本**: v1.0  
> **更新人**: SDDU Tasks Agent  
> **更新时间**: 2026-07-19  
> **更新说明**: 初始创建 — 基于 plan v1.2 §5 文件影响分析（14 项变更）分解 7 个原子任务，3 个执行波次

## 1. 依赖拓扑总览
> 任务依赖关系和执行顺序

```
Wave 1 ─── (无依赖，全部并行)
  TASK-001 [M]  创建 sddu-tree SKILL.md（FR-001）
  TASK-002 [S]  验证 Skill 发现章节已就绪（FR-009）
  TASK-003 [S]  更新 coordinator 模板 Agent 清单（FR-010）

Wave 2 ─── (原子迁移 FR-008，依赖 Wave 1 产物)
  TASK-004 [M]  替换 9 个 Agent 模板中 @sddu-tree 引用（FR-004）
  TASK-005 [S]  移除 opencode.json.hbs 中 sddu-tree 注册（FR-002）
  TASK-006 [S]  删除 sddu-tree.md.hbs Agent 模板（FR-003）

Wave 3 ─── (依赖 Wave 2 全量完成)
  TASK-007 [S]  构建验证 + @sddu-tree 引用残留审计（FR-005, EC-002）
```

**依赖规则**:
- FR-009/FR-010 与 FR-001 并行（spec §9 拆分建议）
- FR-002/FR-003 在 FR-004 触发（先替换引用，再注销 Agent——防止 EC-003 双写窗口）
- FR-008 原子迁移 = TASK-004 + TASK-005 + TASK-006 同波次 + 同 commit
- FR-006/FR-007 属于 validate 阶段，不在本 tasks 范围

## 2. 任务列表
> 每个任务的详细定义

### TASK-001: 创建 sddu-tree SKILL.md（原 Agent 265 行逻辑全量迁移）
> 框架级 Skill 源码——将 @sddu-tree Agent 降级为 sddu-tree Skill

| 属性 | 值 |
|------|-----|
| **复杂度** | M |
| **前置依赖** | 无 |
| **执行波次** | 1 |
| **对应 FR** | FR-001 |

**描述**:
在 `src/skills/sddu-tree/` 下创建 `SKILL.md`。完整迁移原 Agent 模板 `src/templates/agents/sddu-tree.md.hbs`（265 行）的全部逻辑到 Progressive Disclosure 三层结构：

**Frontmatter（Stage 1 — 默认上下文）**:
```yaml
name: sddu-tree
description: SDDU 目录导航专家 — 扫描 .sddu/ 目录结构，为每个层级生成 TREE 导航
```
触发语义优化：包含「扫描」「目录」「导航」「TREE」「更新目录结构」等触发词，与 `sddu-docs` 的「项目全景」语义明确区分。

**Stage 2 — 概述（触发时加载，~50 tokens）**:
- 角色定位：SDDU 目录导航专家，扫描 `.sddu/` 目录结构生成/更新 TREE.md
- 触发条件：完成 SDDU 阶段后自动更新目录导航
- 依赖：`find`、`ls`、文件读写工具
- 职责边界：仅扫描生成 TREE，不修改业务流程产出

**Stage 3 — Body（执行时按需加载）**，迁移原 Agent 模板的全部内容：
1. **6 步工作流**：扫描目录树 → 检测缺失 TREE → 读取文件生成简介 → 生成 TREE → 验证已有 TREE → 输出报告
2. **v3.0.0 状态标记规则**：phase + status 双字段模型（`specified`→`planned`→`tasked`→`built`→`reviewed`→`validated`，`tracked`/`draft`/`pending`/`blocked`）
3. **7 条行为规则**：目录优先于文件、增量更新非全量重建、简介不超过 1 行 80 字符等
4. **5 场景异常处理**：`.sddu/` 不存在、`state.json` 缺少字段、TREE.md 不存在、多个同名 Feature、超出扫描范围

**弃用 Agent 专属骨架章节**：执行顺序、依赖关系声明、输出模板引用（这些是 Agent 运行时约束，Skill 体不承载）。

**代理 Agent 工具约束**：Skill body 末尾声明——宿主 Agent 加载本 Skill 后直接使用自身的 `bash`、`glob`、`grep`、`read`、`write` 等工具执行扫描和文件操作，无需启动子 Agent 或子进程。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| NEW | `src/skills/sddu-tree/SKILL.md` |

**验收标准**:
- [ ] SKILL.md 存在于 `src/skills/sddu-tree/` 目录下
- [ ] frontmatter 包含 `name: sddu-tree` 和触发语义优化的 `description`
- [ ] 逐项对比原 Agent 模板 6 步工作流，覆盖率 100%
- [ ] 5 条异常处理场景全部覆盖
- [ ] phase + status 双字段状态标记规则完整
- [ ] 7 条行为规则全部迁移
- [ ] 弃用 Agent 专属骨架章节（执行顺序/依赖关系/输出模板声明）
- [ ] Skill body 末尾含代理工具约束声明
- [ ] 总体篇幅控制在 300 行以内（NFR-004 自包含约束）

**验证命令**:
```bash
# 检查文件存在
test -f src/skills/sddu-tree/SKILL.md && echo "PASS: file exists" || echo "FAIL: file missing"

# 检查 frontmatter
head -10 src/skills/sddu-tree/SKILL.md | grep -q "name:" && echo "PASS: frontmatter name" || echo "FAIL: frontmatter name"
head -10 src/skills/sddu-tree/SKILL.md | grep -q "description:" && echo "PASS: frontmatter description" || echo "FAIL: frontmatter description"

# 检查 6 步工作流关键词
grep -c "扫描目录树\|检测缺失\|读取文件生成简介\|生成 TREE\|验证已有\|输出报告" src/skills/sddu-tree/SKILL.md

# 检查异常处理 5 场景
for scenario in ".sddu/ 目录不存在" "TREE.md 格式不兼容" "state.json 缺少" "超出扫描范围" "同名"; do
  grep -q "$scenario" src/skills/sddu-tree/SKILL.md && echo "PASS: scenario '$scenario'" || echo "WARN: missing scenario '$scenario'"
done

# 检查弃用的 Agent 骨架章节（不应出现）
grep -n "执行顺序\|依赖关系.*前置条件\|输出模板" src/skills/sddu-tree/SKILL.md && echo "WARN: Agent skeleton residue" || echo "PASS: no Agent skeleton"

# 检查行数
LINES=$(wc -l < src/skills/sddu-tree/SKILL.md); echo "Lines: $LINES"
```

---

### TASK-002: 验证 8 个 Agent 模板 Skill 发现章节已就绪
> 确认 sddu-tree Skill 能被 Agent 发现和加载的前提条件

| 属性 | 值 |
|------|-----|
| **复杂度** | S |
| **前置依赖** | 无 |
| **执行波次** | 1 |
| **对应 FR** | FR-009 |

**描述**:
检查以下 8 个主流程 Agent 模板是否均已包含 `## Skill 发现` 章节（引用 `sddu-skill-discovery` Skill 获取完整发现流程指引）：

| # | 模板文件 |
|---|---------|
| 1 | `src/templates/agents/sddu-discovery.md.hbs` |
| 2 | `src/templates/agents/sddu-spec.md.hbs` |
| 3 | `src/templates/agents/sddu-plan.md.hbs` |
| 4 | `src/templates/agents/sddu-tasks.md.hbs` |
| 5 | `src/templates/agents/sddu-build.md.hbs` |
| 6 | `src/templates/agents/sddu-review.md.hbs` |
| 7 | `src/templates/agents/sddu-validate.md.hbs` |
| 8 | `src/templates/agents/sddu-docs.md.hbs` |

**当前状态**（预验证结论）：`grep -c "Skill 发现"` 在每个模板中返回 ≥1。全量已就绪。

**如果发现缺失**（当前预验证已排除但保留兜底逻辑）：
- 以 `src/templates/agents/sddu-tree.md.hbs` 的 `## Skill 发现` 章节为参考（同一章节模板）
- 插入位置：`## 规则` 与 `## 修订记录` 之间
- 节号按各模板原有最大节号 +1

**涉及文件**:
> 本任务为验证任务，当前预期 0 文件 MODIFY。如发现缺失才需修改。

| 操作 | 文件路径 | 触发条件 |
|:--:|------|------|
| MODIFY | `src/templates/agents/sddu-*.md.hbs` | 仅当 Skill 发现章节缺失 |

**验收标准**:
- [ ] 8 个主流程 Agent 模板均包含 `## Skill 发现` 章节
- [ ] 章节内容正确引用 `sddu-skill-discovery` 路径
- [ ] 如有缺失，补充后再次验证通过

**验证命令**:
```bash
# 批量检查 8 个模板（不包括 sddu-fast、sddu-roadmap、sddu-tree、sddu.md）
for f in src/templates/agents/sddu-{discovery,spec,plan,tasks,build,review,validate,docs}.md.hbs; do
  if grep -q "Skill 发现" "$f"; then
    echo "PASS: $(basename $f) — Skill 发现 present"
  else
    echo "FAIL: $(basename $f) — Skill 发现 MISSING"
  fi
done

# 验证引用 sddu-skill-discovery
for f in src/templates/agents/sddu-{discovery,spec,plan,tasks,build,review,validate,docs}.md.hbs; do
  grep -q "sddu-skill-discovery" "$f" && echo "OK: $(basename $f) ref" || echo "WARN: $(basename $f) missing ref"
done
```

---

### TASK-003: 更新 coordinator 模板 Agent 清单表
> 移除 Agent 清单中的 @sddu-tree 条目，更新数量统计

| 属性 | 值 |
|------|-----|
| **复杂度** | S |
| **前置依赖** | 无 |
| **执行波次** | 1 |
| **对应 FR** | FR-010 |

**描述**:
修改 `src/templates/agents/sddu.md.hbs`（coordinator 模板），完成以下变更：

1. **移除 Agent 清单表中的 @sddu-tree 行**：从 §2 Agent 表格中删除 `sddu-tree` 行（含 description、model、prompt 列）。
2. **更新 Agent 数量统计**：如模板中存在「11 个核心 Agent」或「11 个 Agent」等描述，统一更新为「10 个」。
3. **如有辅助分类列移除之**：如果表格中存在「辅助 Agent」分类标签，一并清理。
4. **保留修订记录不变**：修订记录中的历史引用不修改。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| MODIFY | `src/templates/agents/sddu.md.hbs` |

**验收标准**:
- [ ] coordinator 模板 Agent 清单表中无 sddu-tree 行
- [ ] Agent 数量描述更新为 10 个（如存在数量描述）
- [ ] 辅助 Agent 分类列已移除（如存在）
- [ ] `grep "sddu-tree" src/templates/agents/sddu.md.hbs` 仅返回修订记录中的历史引用（如有）

**验证命令**:
```bash
# 检查 Agent 清单表中无 @sddu-tree（排除修订记录）
# 注意：修订记录行以 | v 或 | 版本开头
grep -n "sddu-tree" src/templates/agents/sddu.md.hbs | grep -v "修订记录\|v[0-9]" && echo "FAIL: sddu-tree residue" || echo "PASS: clean"

# 检查 Agent 数量（如有 "11" 字样的 Agent 计数描述）
grep -n "11.*Agent\|11 个" src/templates/agents/sddu.md.hbs | grep -v "修订记录" && echo "WARN: check Agent count" || echo "PASS: no stale count"
```

---

### TASK-004: 替换 9 个 Agent 模板中 @sddu-tree 引用
> 将硬编码的 @sddu-tree 子 Agent 调用替换为 Skill 发现引用声明

| 属性 | 值 |
|------|-----|
| **复杂度** | M |
| **前置依赖** | TASK-001（SKILL.md 已创建，明确 Skill 名称和加载方式） |
| **执行波次** | 2 |
| **对应 FR** | FR-004, FR-008 |

**描述**:
对 9 个 Agent 模板执行统一的 @sddu-tree 引用替换。替换规则：

**7 个主流程 Agent（sddu-discovery/spec/plan/tasks/build/review/validate）**：
- 旧文本：`完成后自动触发 \`@sddu-tree\` 扫描并更新 \`.sddu/\` 目录导航。`
- 新文本：`完成后通过 \`## Skill 发现\` 章节加载 \`sddu-tree\` Skill，扫描并更新 \`.sddu/\` 目录导航。`
- 位置：各模板完成协议 §7 末尾（行号见下表）

**sddu-docs.md.hbs（4 处替换）**：
| 位置 | 旧文本关键词 | 替换方式 |
|------|-------------|---------|
| L27 边界表 | `@sddu-tree` 相关行 | 移除该行或改为 Skill 引用 |
| L398/402 完成协议 | `@sddu-tree .sddu/docs-tree-root/` | Skill 发现引用 |
| L411-415 不触碰声明 | 相关 @sddu-tree 引用 | 更新为 Skill 引用 |
| L428-436 三 Agent 边界表 | @sddu-tree 列 | 移除列或改为 Skill 引用 |

**sddu-fast.md.hbs（1 处替换）**：
- 旧文本：`由 @sddu-tree 生成`
- 新文本：`由 sddu-tree Skill 生成`
- 位置：L46 文档性引用

**涉及文件**:

| 操作 | 文件路径 | 旧行号 | 替换内容 |
|:--:|------|:--:|------|
| MODIFY | `src/templates/agents/sddu-discovery.md.hbs` | L203 | @sddu-tree 调用 → Skill 发现引用 |
| MODIFY | `src/templates/agents/sddu-spec.md.hbs` | L153 | @sddu-tree 调用 → Skill 发现引用 |
| MODIFY | `src/templates/agents/sddu-plan.md.hbs` | L157 | @sddu-tree 调用 → Skill 发现引用 |
| MODIFY | `src/templates/agents/sddu-tasks.md.hbs` | L127 | @sddu-tree 调用 → Skill 发现引用 |
| MODIFY | `src/templates/agents/sddu-build.md.hbs` | L125 | @sddu-tree 调用 → Skill 发现引用 |
| MODIFY | `src/templates/agents/sddu-review.md.hbs` | L125 | @sddu-tree 调用 → Skill 发现引用 |
| MODIFY | `src/templates/agents/sddu-validate.md.hbs` | L190 | @sddu-tree 调用 → Skill 发现引用 |
| MODIFY | `src/templates/agents/sddu-docs.md.hbs` | ~L27/398/402/411/428 | 多处替换（边界表/完成协议/不触碰声明/三 Agent 表） |
| MODIFY | `src/templates/agents/sddu-fast.md.hbs` | L46 | 文档性引用更新 |

**验收标准**:
- [ ] 7 个主流程 Agent 的「完成后自动触发 `@sddu-tree`」已替换为 Skill 发现引用
- [ ] sddu-docs.md.hbs 所有 4 处 @sddu-tree 引用已更新
- [ ] sddu-fast.md.hbs「由 @sddu-tree 生成」已更新
- [ ] `grep -rn "@sddu-tree" src/templates/agents/*.hbs | grep -v "修订记录\|v[0-9]"` 零匹配
- [ ] 没有任何模板同时含有 @sddu-tree 调用和 Skill 发现声明（EC-003 防护）

**验证命令**:
```bash
# === 1. 逐文件检查已完成替换 ===
for f in src/templates/agents/sddu-{discovery,spec,plan,tasks,build,review,validate}.md.hbs; do
  if grep -q "加载.*sddu-tree.*Skill" "$f"; then
    echo "PASS: $(basename $f)"
  else
    echo "FAIL: $(basename $f) — Skill discovery reference not found"
  fi
done

# === 2. sddu-docs 多处替换验证 ===
# 边界表（L27 附近）
grep -A2 "边界\|不负责" src/templates/agents/sddu-docs.md.hbs | grep -v "@sddu-tree" && echo "PASS: docs boundary table" || echo "WARN: docs boundary"

# 完成协议
grep -q "sddu-tree.*Skill" src/templates/agents/sddu-docs.md.hbs && echo "PASS: docs completion" || echo "FAIL: docs completion"

# === 3. 全局零残留审计（排除修订记录） ===
echo "=== @sddu-tree 残留审计 ==="
REMAINING=$(grep -rn "@sddu-tree" src/templates/agents/*.hbs | grep -v "修订记录\|v[0-9]\." | wc -l)
if [ "$REMAINING" -eq 0 ]; then
  echo "PASS: zero @sddu-tree residue (excluding revision history)"
else
  echo "FAIL: $REMAINING @sddu-tree references remaining:"
  grep -rn "@sddu-tree" src/templates/agents/*.hbs | grep -v "修订记录\|v[0-9]\."
fi

# === 4. 双重触发检测（EC-003 防护） ===
for f in src/templates/agents/sddu-*.md.hbs; do
  HAS_SUBAGENT=$(grep -c "@sddu-tree" "$f")
  HAS_SKILL=$(grep -c "sddu-tree.*Skill" "$f")
  if [ "$HAS_SUBAGENT" -gt 0 ] && [ "$HAS_SKILL" -gt 0 ]; then
    echo "FAIL: $(basename $f) — dual trigger (subagent + skill) detected!"
  fi
done
echo "PASS: no dual-trigger files"
```

---

### TASK-005: 移除 opencode.json.hbs 中 sddu-tree 注册条目
> 注销 @sddu-tree 子 Agent，使其不再可作为 subagent 调用

| 属性 | 值 |
|------|-----|
| **复杂度** | S |
| **前置依赖** | TASK-004（Agent 模板引用已替换） |
| **执行波次** | 2 |
| **对应 FR** | FR-002, FR-008 |

**描述**:
修改 `src/adapters/opencode/templates/opencode.json.hbs`，移除 L62-66 的 sddu-tree subagent 注册条目：

```json
// 删除以下 5 行（约 L62-66）：
    "sddu-tree": {
      "description": "...",
      "model": "...",
      "prompt": "{file:.opencode/agents/sddu-tree.md}"
    },
```

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| MODIFY | `src/adapters/opencode/templates/opencode.json.hbs` |

**验收标准**:
- [ ] `grep "sddu-tree" src/adapters/opencode/templates/opencode.json.hbs` 返回零匹配
- [ ] opencode.json 语法有效（通过 JSON schema 验证或 `npm run build` 不报错）

**验证命令**:
```bash
# 检查零残留
grep -n "sddu-tree" src/adapters/opencode/templates/opencode.json.hbs \
  && echo "FAIL: sddu-tree registration still present" \
  || echo "PASS: sddu-tree removed from opencode.json"

# 检查 subagents 计数变化（从 11 → 10）
echo "subagent entries count:"
grep -c '"sddu-' src/adapters/opencode/templates/opencode.json.hbs
```

---

### TASK-006: 删除 sddu-tree.md.hbs Agent 模板
> 移除原 Agent 模板源文件——不再需要，逻辑已迁移到 SKILL.md

| 属性 | 值 |
|------|-----|
| **复杂度** | S |
| **前置依赖** | TASK-004（Agent 模板引用已替换） |
| **执行波次** | 2 |
| **对应 FR** | FR-003, FR-008 |

**描述**:
删除源文件 `src/templates/agents/sddu-tree.md.hbs`（265 行）。

`npm run build:agents` 使用 `glob src/templates/agents/sddu-*.md.hbs` 模板渲染——删除源文件后，`npm run build` 自动不再渲染该 Agent 产物。`npm run package` 自动不再将产物复制到 `dist/sddu/agents/`。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| DELETE | `src/templates/agents/sddu-tree.md.hbs` |

**验收标准**:
- [ ] `src/templates/agents/sddu-tree.md.hbs` 文件不存在
- [ ] `npm run build` 执行后 `dist/sddu/agents/sddu-tree.md` 文件不存在
- [ ] 其他 Agent 模板的构建不受影响

**验证命令**:
```bash
# 检查源文件已删除
test -f src/templates/agents/sddu-tree.md.hbs \
  && echo "FAIL: sddu-tree.md.hbs still exists" \
  || echo "PASS: sddu-tree.md.hbs deleted"

# 检查构建产物中无残留
test -f .opencode/agents/sddu-tree.md \
  && echo "FAIL: build artifact sddu-tree.md still exists (clean build needed)" \
  || echo "PASS: no build artifact residue"
```

---

### TASK-007: 构建验证 + @sddu-tree 引用残留全量审计
> 验证完整构建链路产出正确 + 全量 grep 审计确保零 @sddu-tree Agent 引用残留

| 属性 | 值 |
|------|-----|
| **复杂度** | S |
| **前置依赖** | TASK-004, TASK-005, TASK-006（Wave 2 全量完成） |
| **执行波次** | 3 |
| **对应 FR** | FR-005, EC-002 |

**描述**:
执行完整构建链路验证和全量引用审计：

**步骤 1 — 构建**:
```bash
npm run build && npm run package
```
验证：
- exit code 0，无 error/warning
- `dist/sddu/skills/sddu-tree/SKILL.md` 存在（FR-005 sync 验证——package.cjs 已有 `src/skills/ → dist/` 逻辑）
- `dist/sddu/agents/` 含 10 个 Agent （不含 sddu-tree.md）
- `dist/sddu/opencode.json` 不含 sddu-tree 注册

**步骤 2 — @sddu-tree 全量审计（EC-002）**:
```bash
grep -rn "@sddu-tree" src/ --include="*.hbs" --include="*.json" | grep -v "修订记录\|v[0-9]"
```
预期：零匹配（修订记录除外）。

**步骤 3 — Agent 数量一致性**:
```bash
grep -c '"sddu-' src/adapters/opencode/templates/opencode.json.hbs
```
预期：10（与 coordinator Agent 数量声明一致）。

**涉及文件**:
> 本任务不修改文件 — 仅运行验证命令

**验收标准**:
- [ ] `npm run build` 执行成功（exit 0）
- [ ] `npm run package` 执行成功（exit 0）
- [ ] `dist/sddu/skills/sddu-tree/SKILL.md` 存在
- [ ] `dist/sddu/agents/sddu-tree.md` 不存在
- [ ] 构建产物中 agents 数量 = 10
- [ ] `grep "@sddu-tree" src/` 仅返回修订记录历史引用（0 处实际引用）
- [ ] `grep "sddu-tree" src/adapters/opencode/templates/opencode.json.hbs` 零匹配

**验证命令**:
```bash
echo "=== Step 1: Build ==="
npm run build || { echo "FAIL: build error"; exit 1; }
npm run package || { echo "FAIL: package error"; exit 1; }

echo "=== Step 2: Verify dist/sddu/skills/ ==="
test -f dist/sddu/skills/sddu-tree/SKILL.md && echo "PASS: SKILL.md in dist" || echo "FAIL: SKILL.md missing in dist"

echo "=== Step 3: Verify dist/sddu/agents/ ==="
AGENT_COUNT=$(ls dist/sddu/agents/sddu-*.md 2>/dev/null | wc -l)
echo "Agent count in dist: $AGENT_COUNT (expect 10)"
test -f dist/sddu/agents/sddu-tree.md && echo "FAIL: sddu-tree.md still in dist" || echo "PASS: no sddu-tree.md in dist"

echo "=== Step 4: Verify dist/sddu/opencode.json ==="
grep -q "sddu-tree" dist/sddu/opencode.json && echo "FAIL: sddu-tree in opencode.json" || echo "PASS: no sddu-tree in opencode.json"

echo "=== Step 5: Full @sddu-tree audit (exclude revision history) ==="
REMAINING=$(grep -rn "@sddu-tree" src/ --include="*.hbs" --include="*.json" | grep -v "修订记录\|v[0-9]\." | wc -l)
if [ "$REMAINING" -eq 0 ]; then
  echo "PASS: zero @sddu-tree residue"
else
  echo "FAIL: $REMAINING reference(s) remaining:"
  grep -rn "@sddu-tree" src/ --include="*.hbs" --include="*.json" | grep -v "修订记录\|v[0-9]\."
fi

echo "=== Step 6: Coordinator consistency ==="
OP_AGENTS=$(grep -c '"sddu-' src/adapters/opencode/templates/opencode.json.hbs)
echo "opencode.json subagents: $OP_AGENTS (expect 10)"

echo "=== Build verification complete ==="
```

---

## 3. 任务汇总
> 任务数量、复杂度和波次的统计总览

| 统计项 | 数值 |
|--------|:--:|
| 总任务数 | 7 |
| S 级 (简单) | 5 |
| M 级 (中等) | 2 |
| L 级 (复杂) | 0 |
| 执行波次 | 3 |

| FR 覆盖 | 覆盖任务 |
|---------|---------|
| FR-001 (SKILL.md 创建) | TASK-001 |
| FR-002 (注销 opencode.json) | TASK-005 |
| FR-003 (删除 Agent 模板) | TASK-006 |
| FR-004 (替换 9 模板引用) | TASK-004 |
| FR-005 (sync 验证) | TASK-007 |
| FR-008 (原子迁移) | TASK-004, TASK-005, TASK-006 |
| FR-009 (Skill 发现验证) | TASK-002 |
| FR-010 (coordinator 更新) | TASK-003 |
| EC-002 (引用残留审计) | TASK-007 |

## 4. 执行策略
> 各波次的执行说明

| 波次 | 任务 | 策略 |
|:--:|------|------|
| 1 | TASK-001, TASK-002, TASK-003 | **并行执行** — FR-001/FR-009/FR-010 互不依赖，可同时执行。TASK-001 创建 SKILL.md（核心产物），TASK-002 验证发现章节（当前已就绪，预期 0 修改），TASK-003 更新 coordinator 表格（1 文件 MODIFY）。 |
| 2 | TASK-004 → TASK-005, TASK-006 | **顺序控制在波次内** — TASK-004 先完成（替换全部 9 个模板的 @sddu-tree 引用），TASK-005 和 TASK-006 随后执行（注销注册 + 删除模板）。三任务同波次 + 同 commit = FR-008 原子迁移。TASK-005/006 均为单文件操作，可并行执行。 |
| 3 | TASK-007 | **依赖 Wave 2 全量完成** — 执行完整构建 (`npm run build && package`) 并运行全量 grep 审计。验证全部 7 个任务的产物完整性。 |

**原子性保证（FR-008）**:
Wave 2 的三个任务（TASK-004 + TASK-005 + TASK-006）必须在同一 commit 中完成。顺序：先替换引用（TASK-004），再注销注册（TASK-005）+ 删除模板（TASK-006）。禁止分 commit 提交——否则在过渡窗口期可能出现「Agent 模板正在引用一个已注销的 subagent」或「@sddu-tree subagent 仍然可用但模板已切换到 Skill 发现」的不一致状态。

## 修订记录
> 记录本文档的版本变更历史

| 版本 | 变更说明 | 日期 | 修订人 |
|------|---------|------|--------|
| v1.0 | 初始创建 — 基于 plan v1.2 §5 文件影响分析（14 项变更）分解 7 个原子任务，3 个执行波次（S×5 / M×2 / L×0），覆盖 FR-001~010（除 FR-006/007 属 validate 阶段）。原子迁移方案：Wave 2 三任务（TASK-004→TASK-005/006）同波次同 commit。 | 2026-07-19 | SDDU Tasks Agent |
