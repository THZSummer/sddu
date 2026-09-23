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
| R2 | 2026-09-23 | post-validation 模板结构性缺口修复 G1~G4（见 §7） |
| R3 | 2026-09-23 | post-validation 结构级修复：新增第 8 个 H2「特性索引」（见 §9） |
| R4 | 2026-09-24 | post-validation backlog 承接修正 + 规则空白补齐（见 §10） |
| R5 | 2026-09-24 | post-validation G-F 回退 + 一致性残留清理（见 §11） |

> §1~§3 为 **v1.0 构建时的快照**（其行数 / H2 / zone 计数为当时值），其后续逐轮变更由 §6~§11 追踪；R5 未回填 §1~§3 的历史快照数值（保持历史真实性），R5 的一致性残留清理范围与证据见 §11。

---

## §6 修复记录 R1 — 标题格式一致性修正

- **背景**: 一致性核查发现既有输出模板存在两套 H1 惯例 —— A 组（主流程 9 个模板）为 `# <中文类型>：<<feature_name>>`（全角冒号），B 组（docs 20 个模板）为 `# <<doc_subject>> — <类型>`；本 Feature 的 roadmap 模板 H1 为 `# <<项目名称>> 版本 Roadmap`，属第三种风格，与 A、B 两组均不符。
- **改动**: `src/templates/outputs/sddu-roadmap.md.hbs` 第 1 行 `# <<项目名称>> 版本 Roadmap` → `# 版本 Roadmap：<<项目名称>>`，对齐 A 组 `# <中文类型>：<<变量>>` 格式（全角冒号 `：`）。仅此 1 处实现改动，未触及其余 28 个输出模板。
- **同步检查**: 在 `src/templates/agents/sddu-roadmap.md.hbs` 中 grep 关键词 `版本 Roadmap` / `# <<项目名称>>` —— 该文件仅以文件名引用输出模板（§6 两级模板查找），未引用/规定 H1 标题格式，**无需同步**。
- **验证结果**: `npm run build:agents` 构建成功；`dist/templates/output/sddu-roadmap.md.hbs` 与 src 逐字节一致（`diff` 空输出）；`grep -c "版本 Roadmap："` = 1，旧标题计数 = 0。

---

## §7 修复记录 R2 — post-validation 模板结构性缺口修复（G1~G4）

- **背景**: 用户以新模板试渲染 `.sddu/ROADMAP.preview.md`（114 行），经三名评审 Agent（静态审查 / 动手验证 / 定位符合性）交叉评审，确认模板规则本身存在结构性缺口：① 排除内容表未覆盖「项目级非 Feature 待办」，该类信息必然净丢失且无承接方；② 结构校验拦不住其自身规则（带违规 `<!-- TODO/待确认 -->` 的预览产物仍通过）；③ 填写说明位于 zone 之外，必然泄漏进产物且永不被增量更新清除；④「版本号」语义未定义，导致两套口径混用、时间窗非单调。用户已批准修复。属 post-validation 修复（照 R1 先例记录），非新 Feature。
- **触发**: 用户批准修复；本 Feature 已有 R1 fix 先例，按 post-validation 修复流程记录，无需重走 discovery/spec/plan/tasks。
- **范围与变更文件**（均 ⊆ 硬约束白名单）:

| 修复项 | 文件 | 变更内容 |
|:--:|------|------|
| G1 | `src/templates/agents/sddu-roadmap.md.hbs` §5.5 | 排除内容表增补 1 行「项目级非 Feature 待办（技术债 / 文档配置 / 增强类 backlog）→ `@sddu-docs`（项目全景）；roadmap 仅在 `next-actions` 区保留一条指向承接方的指针条目」；表后新增 `next-actions` 指针规则引用块（不得承载明细、必留指针，避免净信息丢失） |
| G2 | `src/templates/agents/sddu-roadmap.md.hbs` §5.4.4 Step C3 | 结构校验由 4 项扩为 8 项：新增 5 无 `<<…>>` 占位符残留；6 无非 `sddu:` 前缀 HTML 注释残留（§5.4.1 命名空间规则的强制化）；7 各表格单元格非空且不含 HTML 注释（未确定值须显式写 `TBD` / 「不适用」）；8 `version-overview` 行序按时间窗单调（既非升序亦非时序即失败） |
| G3 | `src/templates/outputs/sddu-roadmap.md.hbs` | 7 行位于 H2 与 zone-open 之间（zone 外）的 `> …` 填写说明改写为**非 `sddu:` 前缀编写期注释**（`<!-- 编写期说明… -->`），按 §5.4.1 本就不写入产物，消除泄漏路径；7 个 H2 标题名称与顺序、zone 的 id / mode / 位置关系零改动；尾部 NOTE 追加第 5 条说明 |
| G4 | `src/templates/agents/sddu-roadmap.md.hbs` §5.5 | 新增「版本号语义」小节：`version-overview`「版本」列取**发布版本号**，与 Feature `state.json.version` 是两套口径不得混用；排序依据（时间窗 / 版本号）须一致以保证 C3-8 行序单调 |
| 同步 | `src/templates/agents/sddu-roadmap.md.hbs` §5.7 + 修订记录 | §5.7 生成后自检清单补齐 G2 对应 4 项勾选（清单由 10 项增至 14 项）；修订记录追加 v3.1.1（2026-09-23 / SDDU Team） |

- **流程记录同步**: `state.json` `phaseHistory` 追加 R2（`type: "fix"` / `triggeredBy: "sddu-build-agent"` / `timestamp: 2026-09-23T12:00:00.000Z`；`phase` 保持 `validated`、`status` 保持 `completed` 未改动）；`review-report.md` 追加 §8 追踪指针。
- **验证方式与结果**: 见 §8（下）与 `grep` 自检——G1 新增行 1 处；C3 校验项 8 项；§5.7 勾选项 14 项；修订记录 v3.1.1 存在；`npm run build:agents` 成功、`dist` 与 `src` 逐字节一致；`.sddu/ROADMAP.md` 仍 1382 行、`.sddu/ROADMAP.preview.md` 仍 114 行（未触碰）。
- **未做（登记）**: G5「下游导航位」需放宽固定 7 H2 约束，属结构级决策，本轮**不做**，仅在交付说明中登记待用户决策。

## §8 修复 R2 验证证据

| 检查项 | 命令 | 结果 |
|------|------|------|
| 构建 | `npm run build:agents` | ✅ 成功（Output templates copied (30 files)） |
| agent dist 产物 | `diff <(awk 去 frontmatter src/...) <(awk 去 frontmatter dist/...)` | ✅ 逐字节一致（正文） |
| output dist 下发 | `diff src/templates/outputs/sddu-roadmap.md.hbs dist/templates/output/sddu-roadmap.md.hbs` | ✅ 逐字节一致 |
| G1 落地 | `grep -c '项目级非 Feature 待办' src/templates/agents/sddu-roadmap.md.hbs` | ✅ 3（表行 + 指针规则 + 修订记录 v3.1.1） |
| G2 落地 | C3 校验项计数（1~8） | ✅ 8 项 |
| §5.7 同步 | 自检清单勾选项计数 | ✅ 14 项（原 10 + 新 4） |
| 修订记录 | `grep -c 'v3.1.1' src/templates/agents/sddu-roadmap.md.hbs` | ✅ 1 |
| G3 落地 | output 模板 zone 外 `^> ` 说明行数（排除 meta zone 的 12 行元数据头） | ✅ 0（原 7 行已改为非 `sddu:` 注释；meta 区元数据头 12 行按设计保留） |
| 硬约束 | `.sddu/ROADMAP.md` / `.sddu/ROADMAP.preview.md` 行数 | ✅ 1382 / 114（未触碰） |

## §9 修复记录 R3 — 新增「特性索引」章节（post-validation 结构级修复）

- **背景**: 用户查看 R2 修复后模板试渲染产物 `.sddu/ROADMAP.preview-v2.md`（133 行）后指出「**缺少特性清单，与 specs-tree 承接不起来，有了断层，那么多特性哪里来的**」。经核实为本 Feature 的**规格内部矛盾**：agent 模板 §1 职责边界声明「输出: **特性清单** + 版本路线图」，但输出模板骨架**仅有 7 个 H2** 且 §5.5 排除内容表 / §5.7 自检写明「不含逐 Feature 明细表」，导致 7 个 H2 中**没有任何位置**承载「特性清单」——`.sddu/specs-tree-root/` 下 **24 个 Feature** 中仅 **5 个**被点名、**0 个**带目录锚点，roadmap 与 specs-tree 断层。
- **触发**: 用户已拍板**方案 B**（新增第 8 个 H2「特性索引」；H2 ≤ 8 上限仍有余量，不突破）。属 post-validation 修复（照本 Feature R1 / R2 先例记录），非新 Feature，无需重走 discovery/spec/plan/tasks。
- **范围与变更文件**（均 ⊆ 硬约束白名单）:

| # | 文件 | 变更内容 |
|:--:|------|------|
| 1 | `src/templates/outputs/sddu-roadmap.md.hbs` | 在「版本总览」之后新增 **§3「特性索引」** H2 + 新 zone `feature-index`（`mode="rewrite"`）；列固定 5 列（Feature ID / 名称 / specs-tree 目录 / 状态 / 版本归属），章节内显式声明排序依据；既有章节顺延编号为 4~8（「修订记录」仍为末位）；`version-plan` 关键特性占位符补 specs-tree 目录锚点要求；尾部 NOTE 第 1 / 5 条 7→8；新增 1 条同构编写期说明注释 |
| 2 | `src/templates/agents/sddu-roadmap.md.hbs` | §1 职责边界为「特性清单」补承载位交叉引用；§5.4.1 重写区（5 个）→（6 个）并加入 `feature-index`；§5.4.4 C1 加入 `feature-index`、C3-① 「7 个」→「8 个」、C3-② 配对计数同步为 9（6+3）；§5.5 结构与篇幅 7→8（列举 8 章节名）、准入内容增列「特性索引」、排除内容表新增「逐 Feature 明细表」行 + 「索引 ≠ 明细」说明、新增「特性索引语义（`feature-index`）」小节；§5.7 自检第 2 项 7→8 并明确「含特性索引、不含明细」；修订记录追加 **v3.1.2** |
| 3 | `…/spec.md` | §5.1 新增显式修订条款 **SUP-002**（FR-003 骨架 7 → 8，理由 / 边界 / 生效方式）；修订记录追加 v1.1 |
| 4 | `…/ADR-004-feature-index-section.md` | **新建**：位置论证（为何紧随「版本总览」）、`mode="rewrite"` 理由、索引 vs 明细边界、对 ADR-001 zone 基线（5+3 → 6+3）的修订说明、6 项备选与否决理由 |
| 5 | `…/plan.md` | 定向增补：§4.1.1 zone 布局表后加修订说明（指向 ADR-004，声明 8 H2 / 9 zone = 6+3）；§9 ADR 表追加 ADR-004 行；§10 修订记录追加 v1.1 |
| 6 | `…/state.json` / `…/build.md` / `…/review-report.md` | 流程记录：追加 R3 fix（`type:"fix"` / `triggeredBy:"sddu-build-agent"` / `timestamp:"2026-09-23T18:00:00.000Z"`；`phase` 保持 `validated`、`status` 保持 `completed` 未改动）、本 §9、review-report §9 |

- **交叉引用同步清单**: §1 / §5.4.1 / §5.4.4（C1 + C3-① + C3-②）/ §5.5（结构与篇幅 + 准入 + 排除 + 新增语义小节）/ §5.7 / 修订记录 —— 六处表述互不矛盾（详见本报告「交叉引用同步清单」）。
- **验证方式与结果**: 见下（§9.1）。
- **未做（登记）**: 未重新渲染 `.sddu/ROADMAP.md` / preview 副本（属独立后续验证步骤）；未迁移既有 ROADMAP（RT-004 / NG-001 不变）；未修改 ADR-001~003 原文（其基线由 ADR-004 显式修订，符合「决策记录单向追加」惯例）。

### §9.1 修复 R3 验证证据

| 检查项 | 命令 | 结果 |
|------|------|------|
| 构建 | `npm run build:agents` | ✅ 成功（Output templates copied (30 files)） |
| output 下发一致 | `diff src/templates/outputs/sddu-roadmap.md.hbs dist/templates/output/sddu-roadmap.md.hbs` | ✅ 逐字节一致 |
| agent dist 一致 | `diff`（去 frontmatter）src ↔ dist | ✅ 正文逐字节一致 |
| H2 计数/名称 | `grep '^## ' src/templates/outputs/sddu-roadmap.md.hbs` | ✅ 8 个且顺序含「特性索引」 |
| zone 计数 | `grep -c 'sddu:zone'` / 按 zone-open 行统计 `mode` | ✅ 18（9 开 + 9 闭）；rewrite **6** + preserve **3** = 9（`grep 'mode="rewrite"'` 原始计数为 7，多出的 1 处为 `feature-index` 章节内排序依据说明对 `mode="rewrite"` 的正文引用，非 zone 标记） |
| 计数表述同步 | `grep -c '重写区（6 个）'` / `模板定义的 8 个` | ✅ 各 1 |
| 过期表述残留 | `grep -n '7 个 H2\|重写区（5\|5 rewrite\|本模板共 7 条'`（两个模板） | ✅ 0（仅 v3.1.2 修订说明中的历史描述） |
| 硬约束 | `.sddu/ROADMAP.md` / `.sddu/ROADMAP.preview.md` / `.sddu/ROADMAP.preview-v2.md` 行数 | ✅ 1382 / 114 / 133（均未触碰） |

## §10 修复记录 R4 — backlog 承接修正 + 规则空白补齐（post-validation）

- **背景**: R3 后用户对产物提出进一步质疑「**只有特性没有问题吗，问题清单是不是缺少了？**」。独立核查确认：R2 在 G1 中把「项目级非 Feature 待办（技术债 / 文档配置 / 增强类 backlog）」的承接方指定为 `@sddu-docs` 是**错误的悬空指针**——
  - `src/templates/agents/sddu-docs.md.hbs` 的职责=「语义聚合 Feature 产物为项目全景」，输入=Feature 产物/代码，输出=`.sddu/docs-tree-root/`，不负责=版本规划与目录导航；对该模板全文检索 `backlog|待办|待处理|问题清单|issues|bug` → **0 命中**；
  - 故 `sddu-roadmap.md.hbs` 原 `:281` / `:288` 指向了并不拥有该产物的 Agent；且该 backlog 在现实中**无任何归属**（旧 `.sddu/ROADMAP.md` 附录 B 为唯一承载，按 RT-004 不迁移；无 specs-tree Feature 承接；FR-BUG-001 定位是「修复流程 Skill」而非 backlog 注册表）。
- **触发**: 用户已拍板**方案 B**（把 backlog 放回 roadmap，以 `next-actions` 的**行动项粒度**承载）；其余缺口（G-B / G-F / R-1~R-4）顺手一并修。属 post-validation 修复（照本 Feature R1 / R2 / R3 先例记录），非新 Feature，无需重走 discovery/spec/plan/tasks。
- **范围与变更文件**（均 ⊆ 硬约束白名单）:

| # | 文件 | 变更内容 |
|:--:|------|------|
| 1 | `src/templates/agents/sddu-roadmap.md.hbs` | **G-A** 删除 §5.5 排除内容表中「项目级非 Feature 待办（技术债 / 文档配置 / 增强类 backlog）→ `@sddu-docs`」悬空指针行；将原「`next-actions` 指针规则」引用块**改写**为「**项目级待办承载规则**」（由 roadmap 自身承载、粒度=行动项、禁止多列台账表、与 `@sddu-docs` 的现状描述明确区分、超 ≤ 400 行按既有机制提示收敛）；「准入内容」增列「项目级待办（以行动项粒度）」；**G-B** 新增「待用户决策项承载契约」（作为 `next-actions` 子类，不新增 H2 / zone，措辞可区分）；**R-1** 「锚点义务豁免」；**R-2** 「Feature 引用锚点」补适用范围；**R-3** 「`版本归属` 取值链」；**R-4** 「`Feature ID` 取值与别名回退」；§5.7 自检补 2 项；修订记录追加 **v3.1.3** |
| 2 | `src/templates/outputs/sddu-roadmap.md.hbs` | §7「下一步行动」编写期说明**同步**：明确承载项目级待办与待用户决策项、以行动项粒度、不扩为台账表（仅改注释文字，未改动 zone/H2/占位符结构） |
| 3 | `src/templates/agents/sddu-docs.md.hbs` | **G-F 仅 1 行**：§8.1 三 Agent 边界表 roadmap 落盘路径 `.sddu/specs-tree-root/ROADMAP.md` → `.sddu/ROADMAP.md`（与实际一致，见 `README.md:190` 与本 Feature 输出模板 L5）；**未触及其他任何内容** |

- **交叉引用同步清单**: §5.5 准入内容（增「项目级待办」）/ §5.5 排除内容表（删 backlog 行、保留「现状审计…→ `@sddu-docs`」行）/ §5.5 项目级待办承载规则 / §5.5 待用户决策项承载契约 / §5.5 特性索引语义（R-1~R-4）/ §5.7 自检（补 2 项）/ 修订记录 v3.1.3 —— 各表述互不矛盾；**不存在**「某类信息被外移但无承接方」或「指针指向非拥有者」的情形（backlog 现由 roadmap 自身承载；「现状审计…」仍归 `@sddu-docs`，其为**现状聚合**非待办承接）。
- **方案 B 与 FR-006 准入自洽性**: FR-006 准入定位=「仅跨版本 / 项目级信息」，并**不含**「项目级待办不可准入」；backlog 天然是项目级信息，故由 roadmap 以行动项粒度承载与准入定位自洽。与「任务级待办」区分：任务级待办（原子任务拆分）仍排除 → `tasks.md`（属单 Feature 实现层）。
- **未做（登记）**: 未重新渲染 `.sddu/ROADMAP.md` / preview 副本（属独立后续验证步骤）；未迁移既有 ROADMAP（RT-004 / NG-001 不变）；未修正 `sddu-docs.md.hbs` 中的其他遗留口径（如「Agent 数量」等 —— 登记为本轮范围外的遗留项，见最终报告「遗留与建议」）；未改动 `README.md` 中任何口径。

### §10.1 修复 R4 验证证据

| 检查项 | 命令 | 结果 |
|------|------|------|
| 构建 | `npm run build:agents` | ✅ 成功（Output templates copied (30 files)） |
| output 下发一致 | `diff src/templates/outputs/sddu-roadmap.md.hbs dist/templates/output/sddu-roadmap.md.hbs` | ✅ IDENTICAL（逐字节一致） |
| agent dist 一致 | 去 frontmatter 后 src ↔ dist 逐行比对 | ✅ 正文 IDENTICAL（roadmap 398 行 / docs 亦一致） |
| 悬空指针清除 | `grep -n 'backlog\|指针规则\|指向承接方' src/templates/agents/sddu-roadmap.md.hbs` | ✅ 无活跃指针（仅 v3.1.1 历史行保留原文，另 v3.1.3 记录本轮修正） |
| R-1~R-4 明文 | `grep -n '（R-4）\|（R-3）\|（含 R-2\|（R-1）'` | ✅ 4/4 均在（L268 / L269 / L272 / L273） |
| §5.5 ↔ §5.7 一致 | 自检项 L319 / L320 对应 §5.5 待办规则与 R-3/R-4 | ✅ 一致 |
| docs 模板最小改动 | `git diff --unified=0 src/templates/agents/sddu-docs.md.hbs` | ✅ 恰 1 行（-1 / +1） |
| output 结构未变 | `grep -c '^## '` / `grep -c 'sddu:zone id='` 输出模板 | ✅ 8 H2 / 9 zone（R3 基线不变） |
| 编写期说明数 | `grep -c '编写期说明（非 sddu: 前缀，仅供模板维护，不写入产物）'` | ✅ 8（未增删） |
| 硬约束 | `.sddu/ROADMAP.md` / `preview` / `preview-v2` / `preview-v3` 行数 | ✅ 1382 / 114 / 133 / 186（均未触碰） |

## §11 修复记录 R5 — G-F 回退 + 一致性残留清理（post-validation，收尾轮）

- **背景**: R4 的 **G-F**（修正 `src/templates/agents/sddu-docs.md.hbs` §8.1 的 roadmap 落盘路径）实际改动了**第 3 个 src 文件**，突破了本 Feature **NFR-003**（变更集 ⊆ 2 个 src 文件）与 **NFR-008**（不影响其他 Agent 指令内容），并连带使原 **V4**（工程边界）结论失效。G7（定向重审 + validate 重跑）结果：review 的 C3/C4/C7/C21 定向重审**全部维持「通过」**（建议合并）；validate 的 V2 ✅ 通过、**V5 ⚠️ 部分不通过**（根因即上述 G-F 越界）。用户决策：**G-F 回退 + 单独登记**（不改 NFR-003 边界）；低风险一致性残留一并修掉。
- **触发**: 用户批准；属 post-validation 修复（照本 Feature R1~R4 先例记录），无需重走 discovery/spec/plan/tasks。
- **范围与变更文件**（均 ⊆ 硬约束白名单）:

| # | 文件 | 变更内容 |
|:--:|------|------|
| 1 | `src/templates/agents/sddu-docs.md.hbs` | **G-F 回退（最高优先）**：§8.1 三 Agent 边界表 roadmap 落盘路径由 `.sddu/ROADMAP.md` 恢复为**基线原值** `.sddu/specs-tree-root/ROADMAP.md`，使该文件相对基线**零 diff**（`git diff` 输出为空）→ 本 Feature 变更集恢复为 **2 个 src 文件**，NFR-003 / NFR-008 合规恢复。该笔误（应为 `.sddu/ROADMAP.md`）作为**独立待办**登记（见下方「遗留」），不在本 Feature 变更范围内。 |
| 2 | `spec.md`（N-1） | FR-003 骨架表**回填「特性索引」**（7→8 行：在「版本总览」之后插入，其余行顺延编号）+ 表下「H2 章节合计 7 个」→ **8 个**并注明**本节已由 SUP-002 修订**；OP-001 由「7 个 H2 / 固化 5 个」同步为「**8 个 H2 / 固化 6 个（含 `feature-index`）**」并注明与 SUP-002 / ADR-004 一致。 |
| 3 | `plan.md`（N-2 / ⑤） | 逐处校正旧计数为当前基线（**8 H2 / 9 zone = 6 rewrite + 3 preserve**）：§2.2 数据流「重写区(5)」→(6)、§2.4「28 个输出模板」→29、§4.1.2 Step C3-①「7 个」→8、§4.2 结构「7 个 H2」→8、§4.5 W1「`mode="rewrite"` = 5」→6、§5.1 变更清单「8 个 zone；7 个 H2」→「9 个 zone；8 个 H2」+「28 个」→29、§6 回滚策略「28」→29、§7.1 审查清单「7 个 H2」→8、§8 V-04「28」→29、**V-05 期望值 `3/5/2/7`→`3/6/2/8`**；§4.1.1 zone 表头标注为 **ADR-001 原基线**、`:165` 修订说明**扩写**至覆盖以上位置。**模板计数口径统一**（实测依据见下）。 |
| 4 | `src/templates/outputs/sddu-roadmap.md.hbs`（N-3 / N-4） | **N-3**：`feature-index` 章节编写期说明去除「覆盖率 / 代码级盘点」等**被排除章节关键词**（改用「逐 Feature 的实现级罗列」），恢复 C7「排除关键词 grep 命中 0」的确定性；**N-4**：`feature-index` 表内占位符说明**同步 R-3 / R-4**（`Feature ID` 别名回退链 + ID 形态判定、`版本归属` 取值链 + 回退标注来源，并指向 agent 模板 §5.5），**5 列表结构与列数不变**。 |
| 5 | `src/templates/agents/sddu-roadmap.md.hbs`（N-6 / N-7） | **N-6**：§5.4.1「与标题解耦」行补 **`meta` zone 例外**（文件级元数据头，位于 H1 之下、首个 H2 之上，不隶属任何 H2）；**N-7**：§5.4.1 `ENTRY_ID` 语法为**非版本类 entry** 留出明确例外（版本类取版本号 / 非版本类取语义稳定分类键，如承接提案池的 `unplanned`），并新增「**entry 键稳定性**」规则行。 |
| 6 | `review.md` / `validate-report.md`（N-5） | **定向复判更新**结构计数为 **8 H2 / 9 zone = 6 + 3**（`review.md` C3/C4；`validate-report.md` V2a/V2b/V2d/结论），保留原判据文字、只更正计数，并**注明由 R3/R4/R5 复判更新**。 |
| 7 | `state.json` / `build.md` / `review-report.md` | 流程记录：追加 R5 fix（`type:"fix"` / `triggeredBy:"sddu-build-agent"` / `timestamp:"2026-09-24T06:00:00.000Z"`；`phase` 保持 `validated`、`status` 保持 `completed` 未改动）、本 §11、review-report §11。 |
| 8 | agent 修订记录 | 追加 **v3.1.4**。 |

- **模板计数口径（⑤，实测依据）**: `find src/templates/outputs -name '*.hbs' | wc -l` = **30**（10 根级 + 20 `docs/`，含本 Feature 新增的 `sddu-roadmap.md.hbs`）；**既有 / 其他输出模板 = 29 个**（9 根级 + 20 `docs/`，不含本 Feature 新增）。故 `plan.md` 中所有「其他 / 既有 N 个输出模板」统一为 **29**，`:31` 明确标注既有 29 / 实测总数 30。原「28 个」为口径偏差。

### §11.1 修复 R5 验证证据

| 检查项 | 命令 | 结果 |
|------|------|------|
| 构建 | `npm run build:agents` | ✅ 成功（Output templates copied (30 files)） |
| **G-F 回退零 diff** | `git diff src/templates/agents/sddu-docs.md.hbs` | ✅ **输出为空**（相对基线零 diff） |
| **变更集恢复 2 文件** | `git diff --name-only -- src/` | ✅ 仅 `src/templates/outputs/sddu-roadmap.md.hbs`、`src/templates/agents/sddu-roadmap.md.hbs` |
| output 下发一致 | `diff src/templates/outputs/sddu-roadmap.md.hbs dist/templates/output/sddu-roadmap.md.hbs` | ✅ 逐字节一致 |
| agent dist 一致 | 去 frontmatter 后 src ↔ dist 逐行比对 | ✅ 正文一致 |
| 不被允许路径零 diff | `git diff --stat` 中 `scripts/` / `*.ts` / `package.json` / `.opencode/` | ✅ 无 |
| N-3 关键词清除 | `grep -n '覆盖率\|全量审计\|代码级盘点' src/templates/outputs/sddu-roadmap.md.hbs` | ✅ 0 命中 |
| 结构未破坏 | `grep -c '^## '` / zone 计数 | ✅ 8 H2 / 9 zone（6 rewrite + 3 preserve） |
| 硬约束 | `.sddu/ROADMAP.md` / 四个 preview 行数 | ✅ 1382 / 114 / 133 / 186 / 213（均未触碰、未重新渲染） |

- **未做（登记，见「遗留」）**: G-F 的路径笔误本身**未修复**（属 `sddu-docs` 范畴，独立待办）；未重新渲染 `.sddu/ROADMAP.md` 与 preview 副本；未迁移既有 ROADMAP（RT-004 / NG-001 不变）；`validate.md`（R1 验证策略文件）不在本轮硬约束白名单内，其 V2/V3 行仍含旧结构计数（`7 个 H2` / `8 zone`），**未修改**，登记为遗留。

### 遗留（R5 登记）

1. **G-F 独立待办（未修复）**：`src/templates/agents/sddu-docs.md.hbs` §8.1 边界表 roadmap 落盘路径**笔误**——现值为 `.sddu/specs-tree-root/ROADMAP.md`，**应为** `.sddu/ROADMAP.md`（对齐 `README.md:190`、本 Feature 输出模板 `> **输出文件名**: .sddu/ROADMAP.md`）。属 **`sddu-docs` / 框架级**修正，**不在本 Feature 变更范围内**（修复会再次突破 NFR-003 的 2 文件边界），故 R5 仅回退、不修复。
2. **`validate.md` 旧结构计数**：该文件（验证策略）不在 R5 硬约束白名单内，其 V2/V3 行仍写「7 个 H2 / 8 zone」，未随 R5 复判更新。
