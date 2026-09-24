# 任务分解：specs-tree-roadmap-structure-v2

> **文档定位**: SDDU 任务清单 — 将技术方案分解为可并行执行的原子任务，作为 build 阶段的输入  
> **前置依赖**: plan.md（技术方案 v1.0）、spec.md（需求规范 v1.0，12 FR / 8 NFR / 10 EC）、ADR-001/002/003  
> **创建人**: SDDU Tasks Agent  
> **创建时间**: 2026-09-24  
> **版本**: v1.0  
> **更新人**: SDDU Tasks Agent  
> **更新时间**: 2026-09-24  
> **更新说明**: 初始创建 — 依据 plan §4.7 的 W1–W6 分解为 9 个原子任务 / 7 个波次（S×4 / M×5 / L×0）；实现目标严格限定为 2 个 `src/` 文件（零运行时代码）

## 1. 依赖拓扑总览
> 任务依赖关系和执行顺序

```
Wave 1 ─── (无依赖)
  TASK-001 [M]  输出模板全量重写为 8 章分层结构（产物端，独立文件）

Wave 2 ─── (依赖 TASK-001；agent 模板同文件串行)
  TASK-002 [M]  agent §5 章节定义表重写

Wave 3 ─── (依赖 TASK-002；同文件串行)
  TASK-003 [M]  agent §5.4 zone 清单 + 合并语义（含旧 zone 迁移提示）

Wave 4 ─── (依赖 TASK-003；同文件串行)
  TASK-004 [M]  agent §5.5 各章语义 + 归属判定表 + P/PR 编码规则

Wave 5 ─── (依赖 TASK-004；同文件串行)
  TASK-005 [S]  agent 修订记录 bump v3.2.0 + §8 异常处置增补

Wave 6 ─── (依赖 Wave 1–5，三路并行)
  TASK-006 [S]  构建分发验证（npm run build:agents + dist≡src）
  TASK-007 [S]  结构静态自检（H2 / zone / 表列 / mermaid / 行数 / 淘汰术语）
  TASK-008 [M]  沙箱演练（275 行旧 ROADMAP → 新结构映射 + 零丢失抽查）

Wave 7 ─── (依赖 TASK-006/007/008)
  TASK-009 [S]  状态收尾与越界核验（state.json / TREE / 变更集）
```

> **同文件串行约束**：TASK-002 → TASK-003 → TASK-004 → TASK-005 均修改 `src/templates/agents/sddu-roadmap.md.hbs`，必须按波次串行，避免写冲突。TASK-001 修改独立文件（产物端），先行以确立结构基线。

## 2. 任务列表
> 每个任务的详细定义

### TASK-001: 输出模板全量重写为 8 章分层结构
> 对应 plan §4.1~§4.6 / W1（FR-001~FR-010）

| 属性 | 值 |
|------|-----|
| **复杂度** | M |
| **前置依赖** | 无 |
| **执行波次** | 1 |
| **对应 FR** | FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, FR-008, FR-009, FR-010（NFR-001/004/005/006） |

**描述**: 把 `src/templates/outputs/sddu-roadmap.md.hbs` 从旧 8 章扁平结构全量重写为新「概览 / 详情分层」结构：8 H2 / 8 content zone（3 rewrite + 5 preserve）+ `meta`；3 张清单表 + 3 类详情 entry；8 个 Mermaid 章首图骨架；8 条编写期说明 + NOTE 块；元数据头 12 字段与 H1 逐字不变。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| MODIFY（全量重写） | `src/templates/outputs/sddu-roadmap.md.hbs` |

**验收标准**:
- [ ] H2 恰为 8 个且顺序固定：愿景 / 版本清单 / 特性清单 / 问题清单 / 版本详情 / 特性详情 / 问题详情 / 修订记录（「修订记录」恒为末位）
- [ ] 8 content zone 与 mode 一一对应（rewrite = vision/version-list/feature-list；preserve = issue-list/version-detail/feature-detail/issue-detail/revision-log）；`meta` 不计入 8
- [ ] 3 张清单表列数 / 列名固定（§2 六列 / §3 五列 / §4 六列）
- [ ] 3 类 entry 键 / 字段固定（§5 版本号 / §6 Feature ID·PR-xxx / §7 P-ID）
- [ ] 8 章各含恰 1 个 ` ```mermaid ` 块；每图 ≤10 行；rewrite 区图随区重建、preserve 区图在 entry 外 zone 内保留；无空格节点陷阱
- [ ] 含 8 条编写期说明注释 + 末尾单块 NOTE；无 `{{#…}}`、无 `<script>`
- [ ] 元数据头 12 字段与 H1 逐项不变；无 RICE / Top N / Phase / Wave / 立即-短期-中期-远期 表述
- [ ] 篇幅 ≤170 行

**验证命令**:
```bash
f=src/templates/outputs/sddu-roadmap.md.hbs
wc -l "$f"                       # <=170
grep -c '^## ' "$f"              # 8
grep -c 'mode="rewrite"' "$f"    # 4（含 meta）
grep -c 'mode="preserve"' "$f"   # 5
grep -c 'sddu:entry' "$f"        # 6（3 组 open+close）
grep -c '```mermaid' "$f"        # 8
grep -c 'RICE\|Top N\|Phase\|Wave' "$f"   # 0
grep -c '{{#' "$f"               # 0
```

---

### TASK-002: agent 模板 §5 章节定义表重写
> 对应 plan §4.1 / W2（FR-011）

| 属性 | 值 |
|------|-----|
| **复杂度** | M |
| **前置依赖** | TASK-001 |
| **执行波次** | 2 |
| **对应 FR** | FR-011（NFR-004） |

**描述**: 重写 `src/templates/agents/sddu-roadmap.md.hbs` §5 的章节定义表，使其列出的 8 个 H2 与产物端一致，并标注层级（清单层 / 详情层 / 首尾）、zone id、mode；统一「XX 清单」/「XX 详情」命名口径。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| MODIFY | `src/templates/agents/sddu-roadmap.md.hbs` |

**验收标准**:
- [ ] §5 章节定义表的 8 章集合与顺序与 TASK-001 一致
- [ ] 表格标注每章的 zone id 与 mode（与 plan §4.1 一致）
- [ ] 显式「清单层 / 详情层 / 首尾」与「修订记录恒为末位」
- [ ] 旧章名（版本总览 / 特性索引 / 优先级 / 版本规划详述 / 依赖与风险 / 下一步行动）不再作为当前定义出现

**验证命令**:
```bash
a=src/templates/agents/sddu-roadmap.md.hbs
grep -c '项目愿景与定位' "$a"
grep -c '版本清单' "$a"
grep -c '特性清单' "$a"
grep -c '问题清单' "$a"
grep -c '版本详情' "$a"
grep -c '特性详情' "$a"
grep -c '问题详情' "$a"
```

---

### TASK-003: agent 模板 §5.4 zone 清单 + 合并语义（含旧 zone 迁移提示）
> 对应 plan §2.2 / §4.6 / W2（FR-012）

| 属性 | 值 |
|------|-----|
| **复杂度** | M |
| **前置依赖** | TASK-002 |
| **执行波次** | 3 |
| **对应 FR** | FR-011, FR-012（EC-001/002/003/009） |

**描述**: 更新 §5.4 的 zone 清单与合并语义：重写区由 6 改为 3、保留区由 3 改为 5；preserve 区按 entry 键控 / 清单保留 / 表格自然键分派合并；新增旧 zone 识别清单与迁移提示语义（不静默重写）。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| MODIFY | `src/templates/agents/sddu-roadmap.md.hbs` |

**验收标准**:
- [ ] zone 清单 = 8 content zone（3 rewrite + 5 preserve）+ meta，与 FR-002 / plan §4.1 一致
- [ ] 合并语义：rewrite 整块替换；version-detail/feature-detail/issue-detail 条目级 upsert；issue-list 清单保留式；revision-log 表格自然键更新
- [ ] 新增旧 zone 识别清单（next-actions / version-overview / priority / dependencies-risks / version-plan / feature-index）→ 判定「旧结构」→ 迁移提示、不静默重写（FR-012）
- [ ] 保留「非模板结构 → 不修改 + 三选项」（EC-001）、标记不成对 → 中止 + 诊断（EC-003）、preserve 逐字保留（EC-009）
- [ ] Step C3 校验：H2 集合 == 新 8 章；zone/entry 配对计数一致

**验证命令**:
```bash
a=src/templates/agents/sddu-roadmap.md.hbs
grep -c 'version-list' "$a"
grep -c 'issue-detail' "$a"
grep -c 'next-actions' "$a"    # 旧 zone 识别清单中出现
grep -c '旧结构' "$a"
grep -c '非模板结构' "$a"
```

---

### TASK-004: agent 模板 §5.5 各章语义 + 信息归属判定表 + P/PR 编码规则
> 对应 plan §4.3 / §4.5 / W3（FR-004~FR-007）

| 属性 | 值 |
|------|-----|
| **复杂度** | M |
| **前置依赖** | TASK-003 |
| **执行波次** | 4 |
| **对应 FR** | FR-004, FR-005, FR-006, FR-007, FR-011（NFR-008） |

**描述**: 重写 §5.5 各章语义，新增「信息归属判定表」（版本级 / 特性级 / 项目级三分）与 P-xxx / PR-xxx 编码规则、淘汰过时方法论（RICE / 批次 / 双时间轴），并落实 EC-004/005/006/008/009/010 的处置说明。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| MODIFY | `src/templates/agents/sddu-roadmap.md.hbs` |

**验收标准**:
- [ ] §5.5 含信息归属判定表（判定条件 + 承载位 + 形式），三条规则可一次性判定（NFR-008）
- [ ] §5.5 逐章语义更新为 8 新章；淘汰 RICE / Top N / Phase / Wave / 立即-短期-中期-远期
- [ ] P/PR 编码规则完备：P-xxx（P-001 起、不复用、开放项在前同状态按影响降序）、类型枚举、状态枚举、PR-xxx（类型=提案）
- [ ] 详情 entry 禁实现明细（EC-010）；§5 内问题外移 §4/§7（EC-008）；缺失 state.json 标注「推断」（EC-006）；P-ID 冲突追加新号（EC-005）；未立项提案缺码按规则生成（EC-004）；preserve 逐字保留（EC-009）

**验证命令**:
```bash
a=src/templates/agents/sddu-roadmap.md.hbs
grep -c '风险与依赖' "$a"
grep -c '归属判定' "$a"
grep -c 'P-xxx' "$a"
grep -c 'PR-xxx' "$a"
grep -c 'P0' "$a"
grep -c 'RICE' "$a"    # 0
```

---

### TASK-005: agent 模板修订记录 bump v3.2.0 + §8 异常处置增补
> 对应 plan §4.6 / W4（FR-011/012）

| 属性 | 值 |
|------|-----|
| **复杂度** | S |
| **前置依赖** | TASK-004 |
| **执行波次** | 5 |
| **对应 FR** | FR-011, FR-012（EC-001/002） |

**描述**: 修订记录追加 v3.2.0 行（本次重构摘要）；§8 异常处理表新增「旧 zone id → 旧结构 + 迁移提示」行；§5.7 自检清单同步新结构。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| MODIFY | `src/templates/agents/sddu-roadmap.md.hbs` |

**验收标准**:
- [ ] 修订记录新增 v3.2.0 行，摘要覆盖 8 章分层 / 8 zone / Mermaid 图 / 归属规则 / P·PR 登记制 / P0-P2 / 旧 zone 迁移
- [ ] §8 新增旧 zone 迁移提示行；既有非模板结构行保留；全文无「自动迁移 / 静默重写」
- [ ] §5.7 自检清单同步新结构（8 章命名 / 8 zone 配对 / 无淘汰术语）

**验证命令**:
```bash
a=src/templates/agents/sddu-roadmap.md.hbs
grep -c 'v3.2.0' "$a"       # 1
grep -c '旧 zone' "$a"      # >=1
grep -c '自动迁移' "$a"      # 0
grep -n '^| v3.2.0' "$a"
```

---

### TASK-006: 构建分发验证（npm run build:agents + dist≡src）
> 对应 plan §2.1 / W5（NFR-003/006/007）

| 属性 | 值 |
|------|-----|
| **复杂度** | S |
| **前置依赖** | TASK-001, TASK-002, TASK-003, TASK-004, TASK-005 |
| **执行波次** | 6 |
| **对应 FR** | FR-011（NFR-003/006/007） |

**描述**: 运行 `npm run build:agents` 验证 output 模板经递归裸拷贝自动下发、agent 模板原样产出；核对 dist ≡ src、构建幂等、既有模板哈希不变、`scripts/` 无改动。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| READ | `dist/templates/output/sddu-roadmap.md.hbs` |
| READ | `dist/templates/agents/sddu-roadmap.md` |

**验收标准**:
- [ ] 构建成功，输出 30 个 output 模板（含 sddu-roadmap.md.hbs）
- [ ] output 模板 dist ≡ src 逐字节一致；agent dist 产物含 v3.2.0
- [ ] 连续两次构建 dist `*.hbs` 哈希一致（幂等）
- [ ] 其他 30 个输出模板 + 10 个其他 Agent 指令哈希不变
- [ ] `scripts/`、`src/**/*.ts`、`package.json` 无 diff

**验证命令**:
```bash
npm run build:agents
diff src/templates/outputs/sddu-roadmap.md.hbs dist/templates/output/sddu-roadmap.md.hbs
grep -c 'v3.2.0' dist/templates/agents/sddu-roadmap.md
md5sum dist/templates/output/*.hbs > /tmp/h1
npm run build:agents
md5sum dist/templates/output/*.hbs > /tmp/h2
diff /tmp/h1 /tmp/h2
git status --porcelain scripts/ package.json '*.ts'
```

---

### TASK-007: 结构静态自检
> 对应 plan §7 / §8 V-01~V-03 / V-07 / V-08 / V-10（W6）

| 属性 | 值 |
|------|-----|
| **复杂度** | S |
| **前置依赖** | TASK-001, TASK-002, TASK-003, TASK-004 |
| **执行波次** | 6 |
| **对应 FR** | FR-001~FR-011（NFR-001/004/005/008；EC-003/007） |

**描述**: 对产物端与指令端做静态一致性自检：H2 集合与顺序、zone 配对计数、表列数、mermaid 围栏与行数、模板行数预算、风格一致性、agent 淘汰术语与修订记录。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| READ | `src/templates/outputs/sddu-roadmap.md.hbs` |
| READ | `src/templates/agents/sddu-roadmap.md.hbs` |

**验收标准**:
- [ ] 产物端 H2 = 8 且顺序正确；zone open/close 配对；rewrite = 4（含 meta）/ preserve = 5；entry open/close 各 3
- [ ] 3 张清单表列数与表头一致；3 类 entry 键 / 字段与 plan §4.4 一致
- [ ] ` ```mermaid ` = 8 且围栏配对；每图 ≤10 行；无裸空格节点名
- [ ] 模板 ≤170 行；与 `sddu-plan.md.hbs` 风格一致、无 Tab 缩进
- [ ] agent 淘汰术语计数 = 0；含 v3.2.0；§5 / §5.4 / §5.5 与新结构一致

**验证命令**:
```bash
f=src/templates/outputs/sddu-roadmap.md.hbs
a=src/templates/agents/sddu-roadmap.md.hbs
wc -l "$f" "$a"
grep -c '^## ' "$f"                 # 8
grep -c '```mermaid' "$f"           # 8
grep -c 'mode="preserve"' "$f"      # 5
grep -c 'RICE\|Top N\|Phase\|Wave' "$a"   # 0
grep -c 'v3.2.0' "$a"               # 1
```

---

### TASK-008: 沙箱演练（275 行旧 ROADMAP → 新结构映射 + 零丢失抽查）
> 对应 plan §2.2 / §4.6 / V-05 / V-06 / V-09（D5 决议）

| 属性 | 值 |
|------|-----|
| **复杂度** | M |
| **前置依赖** | TASK-001, TASK-003 |
| **执行波次** | 6 |
| **对应 FR** | FR-003, FR-012（NFR-005；EC-001/002/004/009） |

**描述**: 在 `/tmp` 隔离沙箱中导出 `docs/roadmap-rewrite` 分支的 275 行旧结构 ROADMAP，按 plan §2.2 旧→新 zone 映射逐节演练为新结构，验证迁移提示非破坏与零丢失抽查。**不改动工作区、不改动 `.sddu/ROADMAP.md`**。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| READ | `src/templates/outputs/sddu-roadmap.md.hbs` |

**验收标准**:
- [ ] `git show docs/roadmap-rewrite:.sddu/ROADMAP.md`（275 行）导出到 `/tmp`，工作区不变
- [ ] 旧→新映射逐节演练：version-overview→version-list、feature-index→feature-list、version-plan→version-detail、next-actions→issue-list；priority / dependencies-risks 正确分流三主体
- [ ] 旧 zone id 被识别为「旧结构」+ 迁移提示，文件 md5 不变（FR-012 / EC-002）
- [ ] 零丢失抽查：抽 10 条内容在新结构均有承载位（EC-009）
- [ ] 8 个 mermaid 块可解析 / 围栏配对（NFR-005）

**验证命令**:
```bash
mkdir -p /tmp/opencode/roadmap-struct-v2
git show docs/roadmap-rewrite:.sddu/ROADMAP.md > /tmp/opencode/roadmap-struct-v2/legacy.md
wc -l /tmp/opencode/roadmap-struct-v2/legacy.md    # 275
md5sum /tmp/opencode/roadmap-struct-v2/legacy.md > /tmp/opencode/roadmap-struct-v2/before.md5
md5sum -c /tmp/opencode/roadmap-struct-v2/before.md5
git status --porcelain .sddu/ROADMAP.md src/       # 应为空
```

---

### TASK-009: 状态收尾与越界核验
> 对应 plan §5 / W6（NFR-006/007）

| 属性 | 值 |
|------|-----|
| **复杂度** | S |
| **前置依赖** | TASK-006, TASK-007, TASK-008 |
| **执行波次** | 7 |
| **对应 FR** | —（NFR-006/007；NG-001/005） |

**描述**: 核对实现变更集严格 ⊆ 2 个 `src/` 文件；确认未触碰 `scripts/`、`src/**/*.ts`、`package.json`、`.opencode/`、`.sddu/ROADMAP.md`；推进 state.json 并补登 TREE。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| MODIFY | `.sddu/specs-tree-root/specs-tree-roadmap-structure-v2/state.json` |
| MODIFY（如存在） | `.sddu/specs-tree-root/specs-tree-roadmap-structure-v2/TREE.md` |

**验收标准**:
- [ ] `git status` 实现变更集 ⊆ {`src/templates/outputs/sddu-roadmap.md.hbs`, `src/templates/agents/sddu-roadmap.md.hbs`}
- [ ] `scripts/`、`src/**/*.ts`、`package.json` 无 diff
- [ ] `.opencode/` 无变更；`.sddu/ROADMAP.md` 无变更（NG-001/NG-005）
- [ ] state.json phase → `builded`，phaseHistory 追加 build 记录
- [ ] TREE.md 补登 plan.md / 3 ADR / tasks.md / tasks.json

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
| 执行波次 | 7 |

### 3.1 复杂度分布

| 复杂度 | 任务 |
|:--:|------|
| S | TASK-005, TASK-006, TASK-007, TASK-009 |
| M | TASK-001, TASK-002, TASK-003, TASK-004, TASK-008 |
| L | （无） |

### 3.2 FR 覆盖矩阵

| FR | 覆盖任务 | 说明 |
|----|---------|------|
| FR-001 | TASK-001, TASK-007 | 8 章结构定义 + 静态校验 |
| FR-002 | TASK-001, TASK-007 | 8 zone 与模式分配 + 配对校验 |
| FR-003 | TASK-001, TASK-007, TASK-008 | 8 个 Mermaid 骨架 + 静态 / 沙箱校验 |
| FR-004 | TASK-001, TASK-004, TASK-007 | 归属字段入模板 + §5.5 判定表 |
| FR-005 | TASK-001, TASK-004, TASK-007 | 淘汰 RICE 等 + P0/P1/P2 entry 字段 |
| FR-006 | TASK-001, TASK-004, TASK-007 | 问题登记制 / P-xxx 表 |
| FR-007 | TASK-001, TASK-004, TASK-007 | PR-xxx 入 §3 / §6 |
| FR-008 | TASK-001, TASK-007 | 三张清单表列结构 |
| FR-009 | TASK-001, TASK-007 | 三类详情 entry 结构 |
| FR-010 | TASK-001, TASK-007 | 元数据头 12 字段与 H1 不变 |
| FR-011 | TASK-002, TASK-003, TASK-004, TASK-005, TASK-007 | agent §5 / §5.4 / §5.5 / 修订记录同步 |
| FR-012 | TASK-003, TASK-005, TASK-008 | 旧 zone 迁移提示（语义 / 异常表 / 沙箱） |

> **NFR 覆盖**：001→TASK-001,007；002→TASK-008；003→TASK-006；004→TASK-001,007；005→TASK-001,007,008；006→TASK-001,006；007→TASK-006；008→TASK-004,007
> **EC 覆盖**：001/002→TASK-003,005,008；003→TASK-003,007；004→TASK-004,008；005/006→TASK-004；007→TASK-001,007；008→TASK-004；009→TASK-003,004,008；010→TASK-004

## 4. 执行策略
> 各波次的执行说明

| 波次 | 任务 | 策略 |
|:--:|------|------|
| 1 | TASK-001 | 产物端独立文件先行（确立结构基线） |
| 2 | TASK-002 | 串行（agent 模板同文件，依赖 TASK-001） |
| 3 | TASK-003 | 串行（同文件，依赖 TASK-002） |
| 4 | TASK-004 | 串行（同文件，依赖 TASK-003） |
| 5 | TASK-005 | 串行（同文件，依赖 TASK-004） |
| 6 | TASK-006, TASK-007, TASK-008 | 并行执行（构建验证 / 静态自检 / 沙箱演练互不冲突） |
| 7 | TASK-009 | 收尾核验（依赖 Wave 6） |

> **执行顺序建议**：先完成 Wave 1 的 TASK-001（产物端结构基线），再按 TASK-002→003→004→005 串行改造 agent 模板；Wave 6 三路并行验证（构建 / 静态 / 沙箱）；最后 Wave 7 越界核验与状态收尾。

## 修订记录
> 记录本文档的版本变更历史

| 版本 | 变更说明 | 日期 | 修订人 |
|------|---------|------|--------|
| v1.0 | 初始创建 — 依据 plan v1.0 §4.7（W1–W6）分解为 9 个原子任务 / 7 个波次（S×4 / M×5 / L×0）；实现目标严格限定 2 个 `src/` 文件（零运行时代码）；FR 12/12 全覆盖 + NFR/EC 映射 | 2026-09-24 | SDDU Tasks Agent |
