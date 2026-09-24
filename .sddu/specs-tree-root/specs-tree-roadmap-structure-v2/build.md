# Build Report: Roadmap 模板结构重构 v2（概览 / 详情分层）

| 字段 | 值 |
|------|-----|
| Feature | specs-tree-roadmap-structure-v2 (FR-ROADMAP-STRUCT-001) |
| 分支 | `feature/roadmap-structure-v2` |
| 日期 | 2026-09-24 |
| 状态 | ✅ completed（builded） |
| 目标版本 | v3.2.0 |

## §1 任务完成状态

| 任务 | 描述 | 复杂度 | 状态 | 结论 |
|------|------|:--:|:--:|------|
| TASK-001 / T1 | 全量重写 `src/templates/outputs/sddu-roadmap.md.hbs` | M | completed | 98 → **169 行**；8 H2 / 8 content zone（3 rewrite + 5 preserve）+ `meta` = 9 zone 标记；8 个章首 Mermaid 图；3 张清单表 + 3 类详情 entry（5 entry 键控）；8 条编写期说明 + NOTE 块 |
| TASK-002 / T2 | agent 模板 §5 新增「章节定义表」 | M | completed | 新增 8 章定义表（章节名 / zone id / mode / 层级 / 一句话定位），与产物模板 §5.4 zone 分配一一对应 |
| TASK-003 / T3 | agent 模板 §5.4 zone 清单与合并语义 | M | completed | 重写区 6→3（+`meta`）、保留区 3→5；entry 键控（版本号 / Feature ID·PR-xxx / P-ID / P-ID / 版本号）；新增旧 zone 识别清单 + 迁移提示；Step A/B/C 全面同步 |
| TASK-004 / T4 | agent 模板 §5.5 各章语义 + 信息归属判定表 + P/PR 编码 | M | completed | 新增信息归属判定表（8 行）；特性清单语义 / 问题登记制 / 提案编码 / 优先级 P0–P2 / 已淘汰方法论；EC-004/005/006/008/009/010 落实 |
| TASK-005 / T5 | agent 模板 §8 异常处置 + 修订记录 v3.2.0 + 一致性清理 | S | completed | §8 增补 2 行（旧 zone 迁移提示 / Mermaid 损坏不阻塞）；修订记录追加 v3.2.0；全文清理 RICE / next-actions / version-overview / feature-index / version-plan / 400 行 / 8 字段 等残留 |
| TASK-006 / T6 | 构建分发验证 | S | completed | `npm run build:agents` 成功；`dist ≡ src` 逐字节一致；二次构建幂等（30 output + agent 模板哈希一致） |
| TASK-007 / T7 | 结构静态自检 | S | completed | 8 项自检全绿（见 §3） |
| TASK-008 | 沙箱演练（旧 ROADMAP → 新结构） | M | 未执行（转 validate） | 依 D5 决议，`/tmp` 沙箱动态演练建议在 validate 阶段执行；本阶段仅做静态等价核验 |
| TASK-009 / T9 | 状态收尾与越界核验 | S | completed | 变更集 ⊆ 2 个 `src/` 文件 + 本 Feature 产物；`scripts/` / `*.ts` / `package.json` / `.opencode/` / `.sddu/ROADMAP.md` 零 diff |

FR 覆盖：12/12（FR-001~FR-012，见 tasks.md §3.2 矩阵）。

## §2 变更清单

| 操作 | 文件 | 说明 |
|:--:|------|------|
| REWRITE | `src/templates/outputs/sddu-roadmap.md.hbs` | 旧 98 行扁平 8 章 → 新 169 行「概览 / 详情分层」8 章（+71 / −98 行） |
| MODIFY | `src/templates/agents/sddu-roadmap.md.hbs` | §5 章节定义表 / §5.4 zone 清单与合并语义 / §5.5 各章语义 + 归属判定表 + P·PR 编码 / §5.3 执行流程 / §5.6–5.7 / §7 / §8 / 修订记录 v3.2.0（+200 变更行） |
| NEW | `.sddu/specs-tree-root/specs-tree-roadmap-structure-v2/build.md` | 本实施报告 |
| NEW | `.sddu/specs-tree-root/specs-tree-roadmap-structure-v2/TREE.md` | 目录导航（sddu-tree Skill 生成） |

- **零运行时代码变更**：`scripts/`、`src/**/*.ts`、`package.json` 均无 diff（NFR-006）。
- 其他 30 个输出模板 + 10 个其他 Agent 指令零改动（NFR-007，已核）。

## §3 验证证据（8 项自检 + 构建）

| # | 检查项 | 命令 | 期望 | 实测 |
|:--:|------|------|:--:|:--:|
| 1 | 模板行数 | `wc -l src/templates/outputs/sddu-roadmap.md.hbs` | ≤170 | **169** ✅ |
| 2 | H2 章节数 | `grep -c '^## ' …` | 8 | **8** ✅ |
| 3 | zone-open 数 | `grep -c '<!-- sddu:zone id=' …` | 9（含 meta） | **9** ✅ |
| 4 | zone-close 数 | `grep -c '<!-- /sddu:zone -->' …` | 9 | **9** ✅ |
| 5 | Mermaid 图数 | `grep -c '```mermaid' …` | 8 | **8** ✅ |
| 6 | 无 Handlebars 语法 | `grep -c '{{' …` | 0 | **0** ✅ |
| 7 | agent 修订版本 | `grep -c 'v3.2.0' src/templates/agents/sddu-roadmap.md.hbs` | ≥1 | **1** ✅ |
| 8 | 构建下发一致 | `diff src/.../outputs/sddu-roadmap.md.hbs dist/.../output/sddu-roadmap.md.hbs` | 无差异 | **无差异** ✅ |

| 检查项 | 命令 | 结果 |
|------|------|------|
| 构建 | `npm run build:agents` | ✅ 成功（Output templates copied；agent 模板原样产出） |
| 构建幂等 | 二次构建后 `md5sum dist/templates/output/*.hbs` 对比 | ✅ IDEMPOTENT-OK（30 output 模板哈希一致） |
| agent 下发 | `wc -l dist/templates/agents/sddu-roadmap.md` | ✅ 468 行 = src 逐字节一致 |
| 越界核验 | `git status --porcelain` / `git diff --stat -- scripts '*.ts' package.json` | ✅ 仅 2 个 `src/` 文件 + 本 Feature 产物；无 `scripts/` / `*.ts` / `package.json` diff |
| 非目标未触碰 | `git status --porcelain .opencode/ .sddu/ROADMAP.md` | ✅ 空（NG-001 / NG-005） |

## §4 备注

- **骨架忠实度**：产物模板骨架按任务书给定结构逐行转录（8 章 / 8 zone / 每章 Mermaid / 3 清单表 / 3 类 entry / 元数据头 12 字段 / H1）。为满足 NFR-001「≤170 行」，末尾 NOTE 块由 8 条独立行压缩为 4 个物理行承载（8 个编号条目内容完整保留，条目间以空格分隔）；章内编写期说明、空行、表格与 zone/entry 标记均按骨架原样保留。
- **§1 Mermaid 用 `graph LR`**：骨架给定 `graph LR`（与 plan §4.2 文字描述的 `flowchart LR` 同义，GitHub 均可渲染），按骨架忠实转录。
- **骨架内 `（RICE 已淘汰）`**：§6 编写期说明含「RICE 已淘汰」括注，属非 `sddu:` 前缀的编写期说明（不写入产物），与 FR-005「不得作为**结构或字段**出现」不冲突；按骨架忠实保留。
- **TASK-008 沙箱演练交接**：本阶段未执行 `/tmp` 旧 ROADMAP → 新结构动态演练（D5 允许 validate 阶段执行），静态等价核验已通过。
- **TREE 范围**：sddu-tree Skill 同时更新了父链 `.sddu/specs-tree-root/TREE.md` 与 `.sddu/TREE.md` 的状态统计；为保持变更集 ⊆「2 个 src 文件 + 本 Feature 产物」，父链 TREE 改动已回退，仅保留本 Feature `TREE.md`。
- 本阶段未执行 `git push`。

## §5 修订记录

| 版本 | 日期 | 变更 |
|------|------|------|
| v1.0 | 2026-09-24 | 初次产出：9 任务完成状态、变更清单、8 项自检 + 构建证据、Note（骨架忠实度 / 沙箱演练交接 / TREE 范围） |
