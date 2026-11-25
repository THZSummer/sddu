# 任务分解：specs-tree-roadmap-output-template

> **文档定位**: SDDU 任务清单 — 将技术方案分解为可并行执行的原子任务，作为 build 阶段的输入  
> **前置依赖**: plan.md（技术方案 v1.0）、spec.md（需求规范 v1.0）  
> **创建人**: SDDU Tasks Agent  
> **创建时间**: 2026-09-22  
> **版本**: v1.0  
> **更新人**: SDDU Tasks Agent  
> **更新时间**: 2026-09-22  
> **更新说明**: 初始创建 — 依据 plan §4.5 的 W1–W6 分解为 9 个原子任务 / 6 个波次；实现目标严格限定为 2 个 `src/` 文件（零运行时代码）

## 1. 依赖拓扑总览
> 任务依赖关系和执行顺序

```
Wave 1 ─── (无依赖，并行；三文件互不冲突)
  TASK-001 [M]  新建输出模板 src/templates/outputs/sddu-roadmap.md.hbs
  TASK-002 [S]  修正 agent §1 职责边界笔误
  TASK-006 [S]  复核 ADR-001/002/003

Wave 2 ─── (依赖 Wave 1；同文件串行)
  TASK-003 [M]  agent §5 删内联骨架 + §6 统一两级查找

Wave 3 ─── (依赖 TASK-003；同文件串行)
  TASK-004 [M]  agent §5 新增 §5.4 增量合并机制

Wave 4 ─── (依赖 TASK-004；同文件串行)
  TASK-005 [M]  agent §5.5–§5.7 + §7 规则 5–8 + §8 异常表 + 修订记录

Wave 5 ─── (依赖 Wave 1/3/4，并行)
  TASK-007 [M]  增量合并机制可执行性验证（V-06/V-07/V-08，沙箱）
  TASK-008 [S]  构建分发验证（npm run build:agents + dist 核对）

Wave 6 ─── (依赖 TASK-008)
  TASK-009 [S]  变更集自检与越界核验 + TREE/state 更新
```

> **同文件串行约束**：TASK-002 → TASK-003 → TASK-004 → TASK-005 均修改 `src/templates/agents/sddu-roadmap.md.hbs`，故必须按波次顺序串行，避免写冲突。

## 2. 任务列表
> 每个任务的详细定义

### TASK-001: 新建专属输出模板 src/templates/outputs/sddu-roadmap.md.hbs
> 对应 plan §4.2 骨架 + §4.1.1 标记 + W1

| 属性 | 值 |
|------|-----|
| **复杂度** | M |
| **前置依赖** | 无 |
| **执行波次** | 1 |
| **对应 FR** | FR-001, FR-002, FR-003, FR-004, FR-005, FR-006（NFR-001/006/007） |

**描述**: 按 plan §4.2 与 §4.1.1 新建 `.sddu/ROADMAP.md` 的唯一权威格式来源。结构 = 元数据头部（blockquote，`meta` zone）+ 7 个固定顺序 H2；8 个 zone（rewrite×5 / preserve×3）；`version-plan` 使用 entry 标记；末尾单块非 `sddu:` 前缀 `<!-- NOTE: … -->` 编写期说明（不写入产物）；篇幅 ≤ 200 行（目标 ~110–130 行），无 `{{#…}}` 逻辑。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| NEW | `src/templates/outputs/sddu-roadmap.md.hbs` |

**验收标准**:
- [ ] 文件存在且为单文件（同目录无 roadmap 附属模板）
- [ ] 头部含 `> **文档定位**: …` 与 `> **输出文件名**: .sddu/ROADMAP.md`；统一 8 字段齐全 + 追加 3 专属字段（当前项目版本 / 全局状态 / 生成方式）
- [ ] 7 个 H2 与 spec FR-003 表顺序一致：项目愿景与定位 / 版本总览 / 优先级（RICE Top N） / 版本规划详述 / 依赖与风险 / 下一步行动 / 修订记录
- [ ] `mode="rewrite"` = 5（meta / vision / version-overview / priority / dependencies-risks）；`mode="preserve"` = 3（version-plan / next-actions / revision-log）
- [ ] `version-plan` 含 1 组 entry 标记（open+close）；表格区段（revision-log）不使用 entry（ADR-001 R6）
- [ ] 含 `<<变量名>>` 中文描述式占位符（对齐 `sddu-plan.md.hbs`）；无 `{{#…}}`、无 `<script>`
- [ ] 末尾含单块非 `sddu:` 前缀 `<!-- NOTE: … -->`；篇幅 ≤ 200 行

**验证命令**:
```bash
f=src/templates/outputs/sddu-roadmap.md.hbs
test -f "$f" && wc -l "$f"
grep -c 'mode="rewrite"' "$f"   # 5
grep -c 'mode="preserve"' "$f"  # 3
grep -c 'sddu:entry' "$f"       # 2（1 组 open+close）
grep -c '^## ' "$f"             # 7
grep -c '{{#' "$f"              # 0
grep -c '输出文件名' "$f"        # >=1
```

---

### TASK-002: 修正 agent 模板 §1 职责边界笔误
> 对应 plan §4.3 §1 行 / W3（FR-009）

| 属性 | 值 |
|------|-----|
| **复杂度** | S |
| **前置依赖** | 无 |
| **执行波次** | 1 |
| **对应 FR** | FR-009（NFR-008） |

**描述**: 修正 `src/templates/agents/sddu-roadmap.md.hbs` §1「不负责」字段的笔误——该字段当前与「输出: 特性清单 + 版本路线图」自相矛盾。改为「不输出目录树与目录导航（归 sddu-tree Skill），不输出 Feature 级实现产物」。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| MODIFY | `src/templates/agents/sddu-roadmap.md.hbs` |

**验收标准**:
- [ ] §1「不负责」由「不目录导航，不输出版本路线图」改为新文案
- [ ] §1 四字段（负责/输入/输出/不负责）自洽
- [ ] 全文 `不输出版本路线图` 计数 = 0

**验证命令**:
```bash
a=src/templates/agents/sddu-roadmap.md.hbs
grep -c '不输出版本路线图' "$a"   # 0
grep -c '不输出目录树' "$a"       # >=1
```

---

### TASK-003: agent §5 删除内联格式骨架 + §6 改为统一两级模板查找
> 对应 plan §4.3 §5(DELETE)/§6(REPLACE) / W2

| 属性 | 值 |
|------|-----|
| **复杂度** | M |
| **前置依赖** | TASK-002 |
| **执行波次** | 2 |
| **对应 FR** | FR-007, FR-008（NFR-001, NFR-004；SUP-001） |

**描述**: 删除已事实失效的 §5 `### 📊 输出格式` 整节（含列数不一致的 markdown 骨架）与 `### 版本规划示例` code fence；将 §6 由「内置固定格式」改为与 `src/templates/agents/sddu-plan.md.hbs` §6 结构完全一致的两级查找声明（用户自定义优先 > 插件内置兜底 + 3 条使用规则 + `当前 Agent`/`对应模板` 收尾）。不在 §6 追加额外条目（保证 FR-007 结构一致）。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| MODIFY | `src/templates/agents/sddu-roadmap.md.hbs` |

**验收标准**:
- [ ] `### 📊 输出格式` 节及其 markdown 骨架代码块删除；§5 不再内联任何输出格式定义
- [ ] §6 与 `sddu-plan.md.hbs` §6 规范化 diff 为空（仅 Agent/模板名不同）
- [ ] §6 声明用户自定义路径 `.sddu/templates/agents/output/sddu-roadmap.md.hbs` 与插件内置路径 `.opencode/plugins/sddu/templates/output/sddu-roadmap.md.hbs`
- [ ] `内置固定格式` = 0；`不通过外部模板文件定义` = 0；`## 执行摘要 (前 20%)` = 0

**验证命令**:
```bash
a=src/templates/agents/sddu-roadmap.md.hbs
grep -c '内置固定格式' "$a"                   # 0
grep -c '不通过外部模板文件定义' "$a"           # 0
grep -c '## 执行摘要 (前 20%)' "$a"            # 0
grep -c '📊 输出格式' "$a"                     # 0
diff <(sed -n '/^## 6\. 输出模板/,/^## 7\./p' "$a" | sed 's/sddu-roadmap/sddu-X/g') \
     <(sed -n '/^## 6\. 输出模板/,/^## 7\./p' src/templates/agents/sddu-plan.md.hbs | sed 's/sddu-plan/sddu-X/g')
```

---

### TASK-004: agent §5 新增「🔄 输出生成与增量合并（OP-002）」
> 对应 plan §4.1.1/§4.1.2（Step A–D）/ W3

| 属性 | 值 |
|------|-----|
| **复杂度** | M |
| **前置依赖** | TASK-003 |
| **执行波次** | 3 |
| **对应 FR** | FR-005, FR-012（NFR-006；EC-003/004/006/007） |

**描述**: 在 §5 新增 `### 🔄 输出生成与增量合并（OP-002）`，写入 plan §4.1.2 的 Step A–D 全文（生成方式判定 / 快照保留区 / 渲染合并+结构校验 / 写出与报告）、§4.1.1 标记语法摘要、冲突处理与幂等要求。这是 OP-002 的核心落地正文，供 LLM 执行。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| MODIFY | `src/templates/agents/sddu-roadmap.md.hbs` |

**验收标准**:
- [ ] 含 Step A（A1 完整生成 / A2 增量更新 / A3 非模板结构不修改）、Step B（zone/entry 快照 + 配对失败中止）、Step C（rewrite 整块替换 / preserve 键控合并 / C3 四项结构校验）、Step D（写唯一产物 + 合并摘要）
- [ ] 含标记语法摘要：zone/entry 双端 HTML 注释、`mode=rewrite|preserve`、ZONE_ID 与 H2 解耦、未标注 == rewrite
- [ ] 含冲突处理（列出差异、无法裁决交用户）与幂等要求（输入未变化二次运行逐字节一致；无变更不追加修订记录行）
- [ ] 明确非模板结构「不修改文件 + 三选项（按新模板重构 / 保留现状 / 仅增量补充）」；全文无「自动迁移 / 自动重写」
- [ ] §5 无第二处 markdown 格式骨架（` ```markdown ` = 0）

**验证命令**:
```bash
a=src/templates/agents/sddu-roadmap.md.hbs
grep -c 'Step A' "$a"          # >=1
grep -c 'preserve' "$a"        # >=1
grep -c '幂等' "$a"            # >=1
grep -c '非模板结构' "$a"       # >=1
grep -c '自动迁移' "$a"        # 0
grep -c '```markdown' "$a"     # 0
```

---

### TASK-005: agent §5.5–§5.7 + §7 规则 5–8 + §8 异常表 + 修订记录
> 对应 plan §4.3 §5(ADD/MODIFY)、§7(ADD)、§8(ADD)、修订记录 / W3

| 属性 | 值 |
|------|-----|
| **复杂度** | M |
| **前置依赖** | TASK-004 |
| **执行波次** | 4 |
| **对应 FR** | FR-006, FR-010, FR-012（NFR-005；EC-001/002/005/008/009/010） |

**描述**: 补齐精简约束与异常处置闭环：§5.5 内容准入与精简约束、§5.6 风险提示与建议、§5.7 生成后自检清单（归并原风险预警/资源需求分析/建议与备注/迭代提醒/验证标准）；§7 追加规则 5–8；§8 追加 4 行异常处置并改写既有 `.sddu/ROADMAP.md` 已存在行；修订记录追加 v3.1.0。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| MODIFY | `src/templates/agents/sddu-roadmap.md.hbs` |

**验收标准**:
- [ ] §5.5：H2 ≤ 8 且集合/顺序固定；篇幅指导上限 ≤ 400 行（超限按 EC-007 提示收敛/外移）；准入=仅跨版本/项目级信息；排除=实现细节→spec/plan、任务待办→tasks、现状审计/覆盖率/全量审计→docs
- [ ] §5.6 / §5.7 存在（要点清单 + 自检清单，含「章节集合与顺序==模板」「标记配对完整」「篇幅 ≤ 400 行」）
- [ ] 原 `风险预警`/`资源需求分析`/`建议与备注`/`迭代提醒`/`验证标准` 已归并，无重复定义
- [ ] §7 追加规则 5 结构不可变（EC-006）/ 6 增量不静默重写（EC-004）/ 7 篇幅守界（EC-007）/ 8 通用判定标准（FR-010：有固定落盘产物必须模板化；零产物/结构不固定可豁免，如 @sddu-fast、@sddu）
- [ ] §8 异常表含：非模板结构→三选项；模板缺失（两级均无）→显式报错终止（EC-001）；自定义模板渲染失败→回退内置+提示（EC-002）；保留区标记不成对→中止并询问；既有「`.sddu/ROADMAP.md` 已存在」行改写为「按 §5.4 判定全量/增量」
- [ ] 修订记录追加 v3.1.0；§9 示例对话未被破坏

**验证命令**:
```bash
a=src/templates/agents/sddu-roadmap.md.hbs
grep -c '内容准入' "$a"    # >=1
grep -c '400' "$a"        # >=1
grep -c '固定落盘' "$a"    # >=1
grep -c '非模板结构' "$a"   # >=1
grep -c 'v3.1.0' "$a"     # 1
sed -n '/^## 7\. 规则/,/^## 9\./p' "$a"
```

---

### TASK-006: 复核 ADR-001/002/003
> 对应 plan §4.5 W5 / §9

| 属性 | 值 |
|------|-----|
| **前置依赖** | 无 |
| **执行波次** | 1 |
| **对应 FR** | —（NFR-006；ADR-001/002/003） |

**描述**: 3 个 ADR 已由 plan 阶段产出；build 阶段仅复核其存在性、状态与和实际实现的一致性（不做实现改动）。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| READ | `.sddu/specs-tree-root/specs-tree-roadmap-output-template/ADR-001-roadmap-increment-marker-syntax.md` |
| READ | `.sddu/specs-tree-root/specs-tree-roadmap-output-template/ADR-002-roadmap-merge-algorithm.md` |
| READ | `.sddu/specs-tree-root/specs-tree-roadmap-output-template/ADR-003-agent-native-zero-code-merge.md` |

**验收标准**:
- [ ] 3 个 ADR 存在且状态 ACCEPTED
- [ ] ADR-001 标记语法与 TASK-001 模板实际标记一致
- [ ] ADR-002 合并算法与 §5.4 Step A–D 一致
- [ ] ADR-003 明确零代码约束（不新增脚本/TS/handlebars）
- [ ] 若发现偏差 → 记录为 review 待办（本任务不改实现）

**验证命令**:
```bash
d=.sddu/specs-tree-root/specs-tree-roadmap-output-template
ls "$d"/ADR-00{1,2,3}-*.md
grep -l 'ACCEPTED' "$d"/ADR-00{1,2,3}-*.md | wc -l   # 3
```

---

### TASK-007: 增量合并机制可执行性验证（V-06 / V-07 / V-08）
> 对应 plan §4.1.2 + §8 验证场景 / OP-002 核心

| 属性 | 值 |
|------|-----|
| **复杂度** | M |
| **前置依赖** | TASK-001, TASK-004 |
| **执行波次** | 5 |
| **对应 FR** | FR-005, FR-012（NFR-006；EC-003/004） |

**描述**: 在 `/tmp/opencode/` 隔离沙箱按 §5.4 Step A–D 走通三个场景，验证零代码机制「可执行、可检测、非破坏」：V-07 保留区保留、V-06 幂等、V-08 非模板结构。**不改动 `src/`、不改动 `.sddu/ROADMAP.md`**。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| READ | `src/templates/outputs/sddu-roadmap.md.hbs` |
| READ | `src/templates/agents/sddu-roadmap.md.hbs` |

**验收标准**:
- [ ] V-07：3 个既有 entry + 新增 1 个版本 → 既有 3 条逐字保留 + 新条目追加（计数 4），相对顺序不变
- [ ] V-06：输入未变化时二次运行，除更新时间类字段外逐字节一致；`revision-log` 未重复追加
- [ ] V-08：以无标记文档为既有产物 → 输出「当前文档非模板结构」+ 三选项，文件 `md5` 不变
- [ ] C3 结构校验通过：H2 集合/顺序 == 模板 7 个；zone/entry 全配对；H2 ≤ 8；表格列数与表头一致
- [ ] 算法文本无歧义；沙箱外 `src/` 与 `.sddu/ROADMAP.md` 保持不变

**验证命令**:
```bash
mkdir -p /tmp/opencode/roadmap-merge && cd /tmp/opencode/roadmap-merge
cp /home/usb/wks/sddu/.sddu/ROADMAP.md legacy.md
md5sum legacy.md > before.md5 && md5sum -c before.md5
git -C /home/usb/wks/sddu status --porcelain .sddu/ROADMAP.md src/   # 应为空
```

---

### TASK-008: 构建分发验证
> 对应 plan §4.5 W4 / §2.1 链路 / FR-011

| 属性 | 值 |
|------|-----|
| **复杂度** | S |
| **前置依赖** | TASK-001, TASK-003, TASK-005 |
| **执行波次** | 5 |
| **对应 FR** | FR-001, FR-011（NFR-002, NFR-008） |

**描述**: 运行 `npm run build:agents` 验证新增根级模板经递归裸拷贝自动下发到 `dist/templates/output/`，且逐字节一致、构建幂等、既有 28 个模板不受影响、`scripts/` 无需改动。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| READ | `dist/templates/output/sddu-roadmap.md.hbs` |

**验收标准**:
- [ ] `npm run build:agents` 成功且输出含 `dist/templates/output/sddu-roadmap.md.hbs`（拷贝数 29 → 30）
- [ ] `diff src/templates/outputs/sddu-roadmap.md.hbs dist/templates/output/sddu-roadmap.md.hbs` 无差异
- [ ] 连续两次构建后全部 dist `.hbs` 哈希一致（幂等）
- [ ] 既有 28 个 dist 模板哈希不变（NFR-008）
- [ ] `scripts/`、`src/**/*.ts`、`package.json` 无 diff（FR-011）
- [ ] `dist/templates/agents/sddu-roadmap.md` 含 v3.1.0 修订行

**验证命令**:
```bash
npm run build:agents
ls dist/templates/output/sddu-roadmap.md.hbs
diff src/templates/outputs/sddu-roadmap.md.hbs dist/templates/output/sddu-roadmap.md.hbs
md5sum dist/templates/output/*.hbs dist/templates/output/docs/*.hbs > /tmp/h1
npm run build:agents
md5sum dist/templates/output/*.hbs dist/templates/output/docs/*.hbs > /tmp/h2
diff /tmp/h1 /tmp/h2
grep -c 'v3.1.0' dist/templates/agents/sddu-roadmap.md
```

---

### TASK-009: 变更集自检与越界核验 + 导航/状态更新
> 对应 plan §4.5 W6 / §5.2 / NFR-003

| 属性 | 值 |
|------|-----|
| **复杂度** | S |
| **前置依赖** | TASK-008 |
| **执行波次** | 6 |
| **对应 FR** | FR-011（NFR-003；NG-001/004/005） |

**描述**: 核对实现变更集严格 ⊆ 2 个 `src/` 文件；确认未触碰 `scripts/`、`src/**/*.ts`、`package.json`、`.opencode/`、`.sddu/ROADMAP.md` 与旧 Feature spec；更新 Feature 目录 `TREE.md` 与 `state.json`。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| MODIFY | `.sddu/specs-tree-root/specs-tree-roadmap-output-template/TREE.md` |
| MODIFY | `.sddu/specs-tree-root/specs-tree-roadmap-output-template/state.json` |

**验收标准**:
- [ ] `git status` 实现变更集 ⊆ {`src/templates/outputs/sddu-roadmap.md.hbs`, `src/templates/agents/sddu-roadmap.md.hbs`}
- [ ] `scripts/`、`src/**/*.ts`、`package.json` 无 diff
- [ ] `.opencode/` 无变更；`.sddu/ROADMAP.md` 无变更（NG-001/NG-005）
- [ ] 旧 Feature `specs-tree-template-quality-unification/spec.md` 无变更（NG-004）
- [ ] Feature 目录 `TREE.md` 补登 `tasks.md` / `tasks.json` 并更新 Phase 为 任务分解 (4/7)
- [ ] `state.json` phase 推进到 `built`

**验证命令**:
```bash
git status --porcelain
git status --porcelain .opencode/ .sddu/ROADMAP.md scripts/
git diff --stat -- src '*.ts' package.json
```

## 3. 任务汇总
> 任务数量、复杂度和波次的统计总览

| 统计项 | 数值 |
|--------|:--:|
| 总任务数 | 9 |
| S 级 (简单) | 4 |
| M 级 (中等) | 5 |
| L 级 (复杂) | 0 |
| 执行波次 | 6 |

### 3.1 复杂度分布

| 复杂度 | 任务 |
|:--:|------|
| S | TASK-002, TASK-006, TASK-008, TASK-009 |
| M | TASK-001, TASK-003, TASK-004, TASK-005, TASK-007 |
| L | （无） |

### 3.2 FR 覆盖矩阵

| FR | 覆盖任务 | 说明 |
|----|---------|------|
| FR-001 | TASK-001, TASK-008 | 新模板建立 + dist 逐字节一致 |
| FR-002 | TASK-001 | 自描述元数据头（文档定位 + 输出文件名） |
| FR-003 | TASK-001 | 7 个固定 H2 骨架与顺序 |
| FR-004 | TASK-001 | 统一 8 字段 + 追加 3 专属字段 |
| FR-005 | TASK-001, TASK-004, TASK-007 | 模板区分布局 + §5.4 合并机制 + 可执行性验证 |
| FR-006 | TASK-001, TASK-005 | H2 ≤ 8 / 排除审计章节 + §5.5 准入与篇幅规则 |
| FR-007 | TASK-003 | §6 统一两级查找（与 sddu-plan §6 结构一致） |
| FR-008 | TASK-003 | §5 删除内联格式骨架 |
| FR-009 | TASK-002 | §1 边界笔误修正 |
| FR-010 | TASK-005 | §7 规则 8 通用模板化判定标准 |
| FR-011 | TASK-008 | 构建分发链路验证（scripts/ 无需改动） |
| FR-012 | TASK-004, TASK-005, TASK-007 | 非模板结构非破坏性处置（Step A3 / §8 / V-08） |

> **NFR / EC / SUP 覆盖**：
> - NFR：001→TASK-001,003；002→TASK-008；003→TASK-009；004→TASK-003；005→TASK-005；006→TASK-001,004,007；007→TASK-001；008→TASK-002,008
> - EC：001/002→TASK-005；003/004→TASK-004,007；005→TASK-005；006/007→TASK-004,005；008/009/010→TASK-005
> - SUP-001：TASK-003（移除「内置固定格式」）+ TASK-005（FR-010 判定标准）+ TASK-006（规范一致性复核）

## 4. 执行策略
> 各波次的执行说明

| 波次 | 任务 | 策略 |
|:--:|------|------|
| 1 | TASK-001, TASK-002, TASK-006 | 并行执行（模板文件 / agent §1 / ADR 复核互不冲突） |
| 2 | TASK-003 | 串行（同文件，依赖 TASK-002） |
| 3 | TASK-004 | 串行（同文件，依赖 TASK-003） |
| 4 | TASK-005 | 串行（同文件，依赖 TASK-004） |
| 5 | TASK-007, TASK-008 | 并行执行（依赖已就绪；一为沙箱验证、一为构建验证） |
| 6 | TASK-009 | 收尾核验（依赖 TASK-008） |

> **执行顺序建议**：先做 Wave 1 的 TASK-001（模板先行，§5.4 需与标记对齐），再按 002→003→004→005 完成 agent 模板串行改造；Wave 5 两条验证可并行；最后 Wave 6 越界核验。

## 修订记录
> 记录本文档的版本变更历史

| 版本 | 变更说明 | 日期 | 修订人 |
|------|---------|------|--------|
| v1.0 | 初始创建 — 依据 plan v1.0 §4.5（W1–W6）分解为 9 个原子任务 / 6 个波次（S×4 / M×5 / L×0）；实现目标严格限定 2 个 `src/` 文件（零运行时代码） | 2026-09-22 | SDDU Tasks Agent |
