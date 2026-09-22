# Build Report: @sddu-roadmap 输出模板补全

| 字段 | 值 |
|------|-----|
| Feature | specs-tree-roadmap-output-template (FR-ROADMAP-TPL-001) |
| 分支 | `feature/roadmap-output-template` |
| 日期 | 2026-09-22 |
| 状态 | ✅ completed（builded） |
| 目标版本 | v4.1.0 |

## §1 任务完成状态

| 任务 | 描述 | 复杂度 | 状态 | 结论 |
|------|------|:--:|:--:|------|
| TASK-001 | 新建 output 模板 `src/templates/outputs/sddu-roadmap.md.hbs` | M | completed | 86 行；7 个 H2；8 个 zone（5 rewrite + 3 preserve） |
| TASK-002 | agent 模板 §1 修订 | S | completed | 输出路径/说明对齐统一模板逻辑 |
| TASK-003 | agent 模板 §5→§6 改造（移除「内置固定格式」） | M | completed | SUP-001 落实：并入两级模板查找 |
| TASK-004 | agent 模板 §5.4 新增（增量合并 Step A–D） | M | completed | 12 处 Step A/B/C/D 引用 |
| TASK-005 | agent 模板 §5.5–5.7 + §7 + §8 + 修订记录 | M | completed | 修订记录 v3.1.0 落款 |
| TASK-006 | 复核 ADR-001/002/003 | S | completed | 实现与 ADR 一致：标记语法 zone/entry + mode=rewrite\|preserve（ADR-001）；Step A–D 条目级 upsert/清单保留/表格自然键（ADR-002）；零运行时代码载体（ADR-003）。三 ADR 状态 ACCEPTED，无冲突 |
| TASK-007 | 增量合并机制可执行性验证（V-06/V-07/V-08） | M | completed（静态） | 静态校验通过：zone 配对完整、mode 语义明确、Step A–D 无歧义；**沙箱动态验证（真实 V-06 幂等 / V-07 保留 / V-08 非模板结构）建议在 validate 阶段执行** |
| TASK-008 | 构建分发验证 | S | completed | 见 §3，全部通过 |
| TASK-009 | 变更集自检与越界核验 + TREE/state 更新 | S | completed | 变更集 ⊆ 2 个 src 文件；无越界 |

FR 覆盖：12/12（见 tasks.md §4 矩阵）。

## §2 变更清单

| 操作 | 文件 | 说明 |
|:--:|------|------|
| NEW | `src/templates/outputs/sddu-roadmap.md.hbs` | 专属输出模板（86 行） |
| MODIFY | `src/templates/agents/sddu-roadmap.md.hbs` | §1 / §5→§6 / §5.4 / §5.5–5.7 / §7 / §8 + 修订记录 v3.1.0（227 行变更） |

- **零运行时代码变更**：`scripts/`、`src/**/*.ts`、`package.json` 均无 diff。
- 流程产物：本 Feature `plan.md` / `tasks.md` / `tasks.json` / 3 个 ADR / `state.json` / `TREE.md`。

## §3 验证证据

| 检查项 | 命令 | 结果 |
|------|------|------|
| 构建 | `npm run build:agents` | ✅ 成功，Output templates copied (30 files) |
| dist 产物 | `ls dist/templates/agents/sddu-roadmap.md` | ✅ 21187 字节 / 374 行 |
| 模板下发 | `diff src/.../outputs/sddu-roadmap.md.hbs dist/.../output/sddu-roadmap.md.hbs` | ✅ 逐字节一致 |
| 构建幂等 | 二次构建后 dist `.hbs` md5sum 对比（30 文件） | ✅ IDEMPOTENT-OK |
| dist 模板含修订 | `grep -c 'v3.1.0' dist/templates/agents/sddu-roadmap.md` | ✅ 1 |
| zone/Step 标记 | `grep -c 'sddu:zone'`（模板）=16 / `grep -c 'Step A\|Step B\|Step C\|Step D'`（agent）=12 | ✅ 8 zone 配对 + Step A–D 完整 |
| 越界核验 | `git diff --stat -- scripts '*.ts' package.json` / `git status --porcelain .opencode/ .sddu/ROADMAP.md` | ✅ 空（无越界） |

变更集范围核实：`git diff --stat` = 仅 2 个 `src/` 实现文件 + `.sddu/` 流程产物，符合 plan §5 边界。

## §4 备注

- **TASK-007 为静态校验**：未执行任务书定义的 `/tmp/opencode/` 真实沙箱三场景演练（V-06/V-07/V-08）。建议在 validate 阶段以真实 ROADMAP 样本动态回归，确认幂等与非破坏性回退行为。
- `scripts/generate-tree.cjs` 缺失（历史遗留，不属本 Feature 范围），故 `TREE.md` 为手工定向更新；本阶段未执行 `git commit` / `git push`，分支保持 `feature/roadmap-output-template`。

## §5 修订记录

| 版本 | 日期 | 变更 |
|------|------|------|
| v1.0 | 2026-09-22 | 初次产出：9 任务完成状态、变更清单、验证证据、TASK-007 静态校验说明 |
| R1 | 2026-09-23 | 标题格式一致性修正（见 §6） |

---

## §6 修复记录 R1 — 标题格式一致性修正

- **背景**: 一致性核查发现既有输出模板存在两套 H1 惯例 —— A 组（主流程 9 个模板）为 `# <中文类型>：<<feature_name>>`（全角冒号），B 组（docs 20 个模板）为 `# <<doc_subject>> — <类型>`；本 Feature 的 roadmap 模板 H1 为 `# <<项目名称>> 版本 Roadmap`，属第三种风格，与 A、B 两组均不符。
- **改动**: `src/templates/outputs/sddu-roadmap.md.hbs` 第 1 行 `# <<项目名称>> 版本 Roadmap` → `# 版本 Roadmap：<<项目名称>>`，对齐 A 组 `# <中文类型>：<<变量>>` 格式（全角冒号 `：`）。仅此 1 处实现改动，未触及其余 28 个输出模板。
- **同步检查**: 在 `src/templates/agents/sddu-roadmap.md.hbs` 中 grep 关键词 `版本 Roadmap` / `# <<项目名称>>` —— 该文件仅以文件名引用输出模板（§6 两级模板查找），未引用/规定 H1 标题格式，**无需同步**。
- **验证结果**: `npm run build:agents` 构建成功；`dist/templates/output/sddu-roadmap.md.hbs` 与 src 逐字节一致（`diff` 空输出）；`grep -c "版本 Roadmap："` = 1，旧标题计数 = 0。
