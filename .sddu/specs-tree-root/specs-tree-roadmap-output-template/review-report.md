# 审查报告：specs-tree-roadmap-output-template

> **文档定位**: SDDU 审查报告 — 逐项记录 C1~C26 审查的执行结果，作为 validate 阶段的输入
> **审查策略**: review.md（包含 C1~C26 审查清单及四维度指引）
> **前置依赖**: review.md（审查策略）、spec.md（需求规范）、plan.md（技术方案）、build.md（构建产物）
> **创建人**: SDDU Review Agent
> **创建时间**: 2026-09-22
> **审查轮次**: R1
> **版本**: v1.0
> **更新人**: SDDU Review Agent
> **更新时间**: 2026-09-22
> **更新说明**: 初始创建 — 静态审查 3 个对象（1 NEW 输出模板 + 1 MODIFY agent 模板 + build.md），逐项执行 C1~C26，识别 3 个改进项（0 阻塞）

## 1. 审查概要
> 审查结果的量化总览

| 维度 | 数值 |
|------|:--:|
| 审查项总数 | 26 |
| 通过 | 23 |
| 改进 | 3 |
| 失败 | 0 |
| 阻塞问题 | 0 |
| 规范符合率 | 100%（12 FR + 8 NFR + 10 EC + SUP-001 全部落地） |

**审查对象与取证**：
- `src/templates/outputs/sddu-roadmap.md.hbs`（NEW，86 行；7 H2；8 zone = 5 rewrite + 3 preserve；36 个 `<<变量>>`；0 个 `{{`）
- `src/templates/agents/sddu-roadmap.md.hbs`（MODIFY，374 行；§1/§5.4–5.7/§6/§7/§8 改造，修订记录 v3.1.0）
- `.sddu/specs-tree-root/specs-tree-roadmap-output-template/build.md`（实施记录，60 行）

## 2. 逐项审查结果（C1~C26）
> 对照 review.md 中定义的审查清单，逐项评估并记录发现

| # | 审查对象 | 审查基准 | 评估 | 发现 | 严重程度 |
|---|---------|---------|:--:|------|:--:|
| C1 | 新模板单文件 / 占位符 / 无渲染期逻辑 | FR-001 | ✅ | 文件存在且同目录无 roadmap 附属模板；`<<变量>>` 占位符 36 处；`{{` 计数 0、`<script>`/JS 片段计数 0，纯静态骨架 + 占位符 | 无 |
| C2 | 自描述元数据头 | FR-002 | ✅ | 模板 L4 `> **文档定位**: SDDU 版本路线图 … 唯一权威来源`、L5 `> **输出文件名**: .sddu/ROADMAP.md`，两行齐备，与 docs 模板约定一致 | 无 |
| C3 | 7 H2 集合与顺序 == FR-003 表 | FR-003 | ✅ | `grep '^## '` 得 7 个且顺序完全一致：项目愿景与定位 / 版本总览 / 优先级（RICE Top N） / 版本规划详述 / 依赖与风险 / 下一步行动 / 修订记录 | 无 |
| C4 | 8 zone 与固化/保留划分 | FR-003 / FR-005 | ✅ | 16 处 `sddu:zone`（8 开 + 8 闭）= 8 区；`mode="rewrite"` 5 个（meta / vision / version-overview / priority / dependencies-risks）+ `mode="preserve"` 3 个（version-plan / next-actions / revision-log），与 spec「固化 5 + 保留 3」精确吻合；3 个保留区均有显式 `preserve` 标注 | 无 |
| C5 | 元数据头 8 统一 + 3 专属 | FR-004 | ✅ | L4–L15 依序：文档定位 / 前置依赖 / 创建人 / 创建时间 / 版本 / 更新人 / 更新时间 / 更新说明（统一 8）+ 当前项目版本 / 全局状态 / 生成方式（专属 3，追加形式）；`前置依赖` = 「无硬性前置依赖（可基于现有 spec/plan 或从零规划）」固定值一致；无旧字段名（`文档版本`/`更新日期`/`状态`）单独出现 | 无 |
| C6 | 显式区分 rewrite/preserve + 承载合并机制 | FR-005 | ✅ | 模板以双端 HTML 注释 + `mode` 显式区分；agent §5.4.1 标记语法（zone/entry 两级）+ §5.4.2–5.4.5 Step A–D 完整承载 plan §4.1 的条目级 upsert / 清单保留 / 表格自然键三种合并策略；FR-005 验收「模板可承载该机制」成立（静态） | 无 |
| C7 | 精简边界与内容准入 | FR-006 | ✅ | H2 = 7 ≤ 8；模板 86 行，配套规则 §5.5 给出 400 行指导上限与内容准入/排除表；模板不含「审计 / 覆盖率 / 附录 / 执行摘要」等排除章节（`grep` 命中 0） | 无 |
| C8 | agent §6 统一两级引用 | FR-007 | ✅ | agent §6（L300–L313）与 `sddu-plan.md.hbs` §6（L115–L128）结构逐行一致（引导句 + 两级路径 + 3 条使用规则 + 语义匹配段 + `当前 Agent`/`对应模板` 收尾）；「内置固定格式」「不通过外部模板文件定义」全文件计数 0 | 无 |
| C9 | §5 内联骨架已删除 | FR-008 | ✅ | `## 执行摘要 (前 20%)` 计数 0；`📊 输出格式` 仅出现在修订记录（L370）作为变更说明；§5.1（L70）与 §5.3 第六步（L178–182）均显式声明「输出格式不在本节内联定义，唯一权威来源见 §6」；全文件无第二处格式定义 | 无 |
| C10 | §1 四项自洽 + 笔误修正 | FR-009 | ✅ | §1 职责边界（L26–29）：负责 版本规划 / 输入 用户零散想法 / 输出 特性清单 + 版本路线图 / 不负责「不输出目录树与目录导航（归 sddu-tree Skill）」；「不输出版本路线图」计数 0，四字段无矛盾 | 无 |
| C11 | 通用模板化判定标准 | FR-010 | ✅ | §7 规则 8（L325）：固定落盘产物 → 必须外部模板 + 两级查找；零产物/结构不固定可豁免（`@sddu-fast`、`@sddu`）；新增 Agent 按此判定。语义与 SUP-001 并存无冲突 | 无 |
| C12 | 构建分发链路 | FR-011 | ✅ | `diff -q src/.../sddu-roadmap.md.hbs dist/templates/output/sddu-roadmap.md.hbs` 无差异（均 4306 字节）；`git diff --stat -- scripts '*.ts' '*.cjs' package.json` 为空；`scripts/build-agents.cjs` L169 `readdirSync(OUTPUT_SRC_DIR,{recursive:true})` + L173 `.hbs` 过滤 + copyFileSync 已自动覆盖根级新增模板，无需改 `scripts/` | 无 |
| C13 | 非模板结构非破坏性 | FR-012 / EC-004 | ✅ | §5.4.2 Step A3（L217）「不修改文件 + 提示『当前文档非模板结构』+ 三选项 + 禁止破坏性静默重写」；§8 异常表（L335）同义落地；全文件「自动迁移/自动重写」计数 0 | 无 |
| C14 | SUP-001 规范修订一致性 | SUP-001 | ✅ | agent 全文不再声明「内置固定格式 / 不通过外部模板文件定义 / 不走用户自定义模板覆盖路径」；§6 两级路径（`.sddu/templates/agents/output/sddu-roadmap.md.hbs` 用户优先 → `.opencode/plugins/sddu/templates/output/sddu-roadmap.md.hbs` 兜底）与 8 个主流程 Agent 完全一致；以本 spec SUP-001 为判定基准，未据旧 EC-004/FR-021 原文误判 | 无 |
| C15 | 风格与可维护性 | NFR-001 / NFR-007 | ✅ | 元数据头字段顺序、`<<变量，如 xxx>>` 占位风格、表格分隔行写法与 `sddu-plan.md.hbs` / `sddu-docs-*.md.hbs` 一致；`grep -Pc '\t'` = 0（无 Tab）；模板 86 行 ≤ 200；无 `<script>`/JS 逻辑 | 无 |
| C16 | 构建幂等 + 可覆盖 + 失败可见 | NFR-002 / NFR-004 / NFR-005 | ✅ | build §3 记录「二次构建 30 文件 md5sum IDEMPOTENT-OK」；§6 声明用户自定义模板优先；§8（L336–L337）给出 EC-001 显式报错文案「❌ 未找到可用的输出模板…」与 EC-002 回退文案「⚠️ …渲染失败…已回退到内置模板」，与 spec 文案逐字一致 | 无 |
| C17 | 可解析性 / 向后兼容 / EC 全量处置 | NFR-006 / NFR-008 / EC-001~010 | ✅ | §5.4.1「与标题解耦」明确 H2 集合与顺序由模板唯一产出；EC 逐项可溯源——EC-001/002（§8）、EC-003（Step A1）、EC-004（Step A3+§8）、EC-005（§5.6 结构漂移提示）、EC-006（§5.5 L255 标注不适用但保留标题）、EC-007（§5.5 L256 + Step C3-3 超限提示）、EC-008（§5.5 L269 排除多文件）、EC-009（§8 L333 初步规划）、EC-010（模板尾部 NOTE-1「章节变更须记入修订记录」）；其他 29 个既有输出模板 + 其他 10 个 Agent 指令零改动（`git status src/` 仅 2 项） | 无 |
| C18 | 变更清单 == plan §5.1 | plan §5.1 | ✅ | `git status --porcelain src/` = `M src/templates/agents/sddu-roadmap.md.hbs` + `?? src/templates/outputs/sddu-roadmap.md.hbs`，与 plan「NEW 1 + MODIFY 1」精确一致；`scripts/`、`*.ts`、`package.json`、`tsconfig.json` 无 diff，与「零运行时代码变更」一致 | 无 |
| C19 | ADR-001/002/003 落地一致 | ADR-001/002/003 | ✅ | ADR-001（双端 HTML 注释 + zone/entry + 显式 mode）→ §5.4.1 语法 + 模板标记；ADR-002（条目级 upsert / 清单保留 / 表格自然键 + 结构校验 + 非破坏性回退 + 幂等）→ Step B/C/D 逐条落地；ADR-003（Agent-Native 零代码）→ `scripts/`/TS 无 diff，未引入 handlebars 依赖。三 ADR 与实现一致 | 无 |
| C20 | 增量合并机制验证充分性 | plan §8 / build §4 | ⚠️ | build §1 TASK-007 标注「completed（静态）」、§4 明确披露「未执行 `/tmp/opencode/` 真实沙箱三场景演练（V-06 幂等 / V-07 保留 / V-08 非模板结构）」，建议 validate 阶段动态回归。静态证据（zone 配对完整、mode 语义明确、Step A–D 无歧义）成立，但 FR-005 的 P0 合并机制尚未取得真实产物的运行时证据 | 中 |
| C21 | 标记语法自洽 | plan §4.1 | ✅ | 模板 8 zone 全部双端配对；`id` 均为小写稳定标识且与 H2 标题解耦；`version-plan` 内含 `sddu:entry`（`/sddu:entry` 配对，仅出现在 preserve 区）；§5.4.1「表格例外」正确覆盖 `revision-log`（改用「版本」列自然键，避免 HTML 注释截断 Markdown 表格）；「未标注 == rewrite」缺省安全语义明确 | 无 |
| C22 | 编写期说明与产物隔离 | plan §4.1 | ✅ | 模板尾部 NOTE（L81–L86）为**非 `sddu:` 前缀** HTML 注释，自声明「仅供模板维护，不得写入产物」；§5.4.1「命名空间」规则（L210）要求非 `sddu:` 注释不得写入产物。隔离规则双向明确 | 无 |
| C23 | zone 语义描述与实际布局一致 | plan §4.2 | ⚠️ | §5.4.1「配对与唯一性」/「与标题解耦」表述为「标记只标注标题之下的内容区」，但模板 `meta` zone 包裹的是 H1 标题之下、`## 1.` 标题**之上**的 blockquote 元数据头（L3–L16），不隶属任何 H2。属表述与布局的轻微张力，不影响机制运行（meta 为顶层 rewrite 区语义清晰），建议在 §5.4.1 中补一句「zone 亦可标注标题之外的文件级区段（如 `meta`）」以消歧 | 低 |
| C24 | 变更集 ⊆ 2 个 src 文件 | NFR-003 / NG-005 | ✅ | `git status --porcelain` 实现文件仅 2 项（见 C18）；其余变更均为 `.sddu/` 流程产物（spec/plan/tasks/ADR/build/TREE/state），符合「实现目标仅限 `src/`」；分支保持 `feature/roadmap-output-template` | 无 |
| C25 | 未触碰禁区路径 | NG-004 / NG-005 | ✅ | `git status --porcelain .sddu/ROADMAP.md .opencode/` 为空——既有 `.sddu/ROADMAP.md` 未被迁移/重写（NG-001）；`.opencode/` 安装产物零改动；旧 Feature `specs-tree-template-quality-unification/spec.md` 未被修改（EC-004 修订以 SUP-001 条款形式生效） | 无 |
| C26 | 流程文档基线计数一致性 | NFR-008 / NG-008 | ⚠️ | spec §2 与 plan §5.1 均声明既有「28 个输出模板」不变，但实测 `find src/templates/outputs -name '*.hbs'` = 30（含本次新增 1），即**既有输出模板实为 29 个**（9 个根级 + 20 个 `docs/`）。不影响实现（全部既有模板零改动已由 git 确认），仅为流程文档基线计数偏差 1，建议后续在 spec/plan 中校正为 29 或注明计数口径 | 低 |

## 3. 审查维度汇总
> 按四维度统计审查结果

| 审查维度 | 审查项数 | 通过 | 改进 | 失败 | 通过率 |
|---------|:--:|:--:|:--:|:--:|:--:|
| 规范符合性（spec） | 17 | 17 | 0 | 0 | 100% |
| 架构一致性（plan/ADR） | 3 | 2 | 1 | 0 | 67% |
| 模板（代码）质量 | 3 | 2 | 1 | 0 | 67% |
| 工程边界 | 3 | 2 | 1 | 0 | 67% |
| **合计** | **26** | **23** | **3** | **0** | **88%** |

## 4. 阻塞问题
> 必须修复后才能进入 validate 阶段的问题

**无阻塞问题。**

## 5. 改进建议
> 非阻塞但建议优化的问题

| # | 位置 | 问题 | 对应 Cx | 严重度 | 建议 |
|---|------|------|:--:|:--:|------|
| 1 | build.md §1 TASK-007 / §4；plan §8 | FR-005 增量合并机制（P0 核心）仅有静态校验，未执行真实沙箱三场景（V-06 幂等 / V-07 保留 / V-08 非模板结构） | C20 | 中 | validate 阶段以真实 ROADMAP 样本执行三场景动态回归：输入未变时二次运行逐字节一致；既有保留区内容不丢失/不重排；旧结构产物不静默重写。回归证据回填 validate-report.md |
| 2 | `src/templates/agents/sddu-roadmap.md.hbs` §5.4.1 | 「标记只标注标题之下的内容区」与 `meta` zone（位于 H2 标题之上）轻微不符 | C23 | 低 | 在 §5.4.1「与标题解耦」行补注「zone 亦可标注标题之外的文件级区段（如 `meta` 元数据头）」，消除维护者歧义 |
| 3 | spec.md §2 / plan.md §5.1 | 声明的既有「28 个输出模板」与实际 29 个不符（基线计数偏差 1） | C26 | 低 | 后续维护时校正为 29，或注明计数口径（是否含 `docs/` 子目录），保持流程文档与实际一致 |

## 6. 结论
> 审查最终结论

**结论**: ✅ 通过

| 指标 | 结果 |
|------|------|
| 审查通过率 | 88%（23/26） |
| 阻塞问题数 | 0 |
| 改进项数 | 3（1 中 + 2 低，< 5） |
| 规范符合率 | 100%（12 FR + 8 NFR + 10 EC + SUP-001 全部落地） |
| 可进入 validate | 是 |

**理由**: 新模板严格实现 FR-003 的 7 H2 集合与顺序、8 个 zone（固化/保留 = 5/3 精确划分）与 FR-005 的 rewrite/preserve 显式区分；元数据头满足 FR-004（统一 8 + 追加 3，`前置依赖` 取固定值）与 FR-002（`文档定位` + `输出文件名`）。agent 模板已删除失效内联骨架（FR-008，`## 执行摘要 (前 20%)` 计数 0）、§6 改为与主流程 Agent 一致的两级查找（FR-007）、§1 笔误修正（FR-009）、§7 补通用判定标准（FR-010）、§8 落地非破坏性处置（FR-012 / EC-004）；SUP-001 落实，全文不再出现「内置固定格式」类表述。工程边界严格：变更集仅 2 个 `src/` 文件，`scripts/` 与运行时代码零改动，既有 29 个输出模板与其他 Agent 指令零改动；构建 dist 与 src 逐字节一致且幂等。无阻塞问题，符合 sddu-review Agent §6「阻塞 0 + 改进 < 5 + 规范符合率 100%」的通过标准。

**进 validate 前置要求**：改进项 1（改进项清单第 1 条）应在 validate 阶段以真实沙箱三场景补齐 FR-005 的动态验证证据；改进项 2、3 为低优先级文档优化，可在后续迭代处理。

## 修订记录
> 记录本文档的版本变更历史

| 版本 | 变更说明 | 日期 | 修订人 |
|------|---------|------|--------|
| v1.0 | 初始创建 — R1 静态审查 3 个对象（NEW 输出模板 / MODIFY agent 模板 / build.md），逐项执行 C1~C26（规范符合性 17 / 架构一致性 3 / 模板质量 3 / 工程边界 3），识别 3 个改进项（0 阻塞），结论：✅ 通过 | 2026-09-22 | SDDU Review Agent |
| R1 | 2026-09-23 | 追加修复记录 §7：说明 NFR-001「一致性」维度漏检及 R1 修复闭环 | SDDU Review Agent |
| R2 | 2026-09-23 | 追加修复记录 §8：post-validation 模板结构性缺口修复（G1~G4）追踪指针 | SDDU Review Agent |
| R3 | 2026-09-23 | 追加修复记录 §9：post-validation 结构级修复（新增「特性索引」章节）追踪；标明受影响审查项与建议重开范围 | SDDU Review Agent |
| R4 | 2026-09-24 | 追加修复记录 §10：post-validation backlog 承接修正 + 规则空白补齐追踪指针 | SDDU Review Agent |
| R5 | 2026-09-24 | 追加修复记录 §11：post-validation G-F 回退 + 一致性残留清理追踪指针 | SDDU Review Agent |

---

## 7. 修复记录 R1 — NFR-001「一致性」维度漏检

- **漏检说明**: 原 R1 审查的 NFR-001「一致性」核查未延伸至文件 H1 标题格式，遗漏了 roadmap 输出模板 `# <<项目名称>> 版本 Roadmap` 与 A 组惯例 `# <中文类型>：<<变量>>` 的偏离。此为审查覆盖盲区（一致性维度未逐项核对 H1 标题），非实现缺陷。
- **修复**: 已通过本 Feature 修复记录 R1 修正 —— `src/templates/outputs/sddu-roadmap.md.hbs` H1 对齐 A 组全角冒号格式：`# 版本 Roadmap：<<项目名称>>`。
- **复查结论**: 修正后 H1 与 A 组 9 个主流程模板惯例一致；NFR-001 一致性维度的覆盖缺口已补齐，审查盲区关闭。

## 8. 修复记录 R2 — post-validation 模板结构性缺口修复（G1~G4）

- **来源**: 用户以新模板试渲染 `.sddu/ROADMAP.preview.md`（114 行），经三名评审 Agent（静态审查 / 动手验证 / 定位符合性）交叉评审，确认模板**规则本身**存在结构性缺口，用户批准修复。
- **实施方**: 由 `sddu-build` 落地，属 **build 阶段的 post-validation 修复**（照本 Feature `state.json` 中 R1 先例记录），**非重新审查**。
- **范围**: 主线 `src/templates/agents/sddu-roadmap.md.hbs`（G1 / G2 / G4 + §5.7 + 修订记录 v3.1.1）；`src/templates/outputs/sddu-roadmap.md.hbs`（G3）。详见 `build.md` §7。
- **追踪说明**: 本报告 §2 的 C1~C26 审查结论（23 通过 / 3 改进 / 0 阻塞，结论 ✅ 通过）**不受本轮修复影响** —— 本轮针对的是模板规则缺口（原审查对象外的新增缺陷），非原审查对象本身的实现缺陷，故不重开 C1~C26。R2 仅作追踪指针，不改变 v1.0 审查结论与「可进入 validate」判定。
- **关联修复项（供后续 review/validate 复核）**: G1（排除内容表承接方 + next-actions 指针规则）/ G2（Step C3 结构校验 4→8 项）/ G3（输出模板填写说明泄漏路径消除）/ G4（版本号语义定义）；其中 G2 第 6 项为 C22「编写期说明与产物隔离」规则的强制化、G4 为 G2 第 8 项校验的前提定义。

## 9. 修复记录 R3 — post-validation 结构级修复（新增「特性索引」章节）

- **来源**: 用户查看 R2 修复后模板试渲染产物 `.sddu/ROADMAP.preview-v2.md`（133 行）后反馈「**缺少特性清单，与 specs-tree 承接不起来，有了断层，那么多特性哪里来的**」；经核实为本 Feature **规格内部矛盾**（§1 承诺「特性清单」，但骨架 7 个 H2 无承载位、且明示「不含逐 Feature 明细表」；24 Feature 仅 5 点名、0 目录锚点）。用户已拍板**方案 B**：新增第 8 个 H2「特性索引」。
- **实施方**: 由 `sddu-build` 落地，属 **build 阶段的 post-validation 修复**（照本 Feature R1 / R2 先例记录），**非重新审查**。实施明细见 `build.md` §9。
- **范围**: 输出模板（新增「特性索引」H2 + `feature-index` zone + 序号顺延 + `version-plan` 锚点 + NOTE 7→8）；agent 模板（§1 / §5.4.1 / §5.4.4 / §5.5 / §5.7 / 修订记录 v3.1.2 全量交叉引用同步）；`spec.md` §5.1 **SUP-002** + 修订记录 v1.1；新建 **ADR-004**；`plan.md` 定向增补。

- **对既有 C1~C26 结论的影响（**与 R1 / R2 不同，本轮**为结构级变更）**:**
  - **直接受影响（原结论以「7 H2 / 8 zone」为前提，现已失效）**:
    - **C3**（7 H2 集合与顺序 == spec FR-003 表）→ 数量与顺序变更，需按 **8 H2** 重核（新增「特性索引」居「版本总览」之后，原章节顺延）。
    - **C4**（8 zone 与固化/保留划分）→ zone 数由 8（5+3）变为 **9（6+3）**，需重核 `feature-index` 的 `mode="rewrite"` 归属。
    - **C7**（H2 = 7 ≤ 8）→ 需改按 **8 ≤ 8** 重核。
    - **C21**（标记语法自洽，含「模板 8 zone 全部双端配对」）→ 需改按 **9 zone** 重核。
    - **§1 审查概要 / §2 C3·C4 取证行 / §6 结论**中「7 H2 / 8 zone」的数字取证 → 失效，需更新。
  - **不受影响（其结论为规则 / 边界 / 构建层面，与 H2 数量无关）**: C1、C2、C5、C6、C8~C20、C22~C26（其中 C10 §1 四字段自洽、C22 编写期说明隔离、C25 未触碰禁区、C26 基线计数等均不因新增章节改变；C10 的 §1 表述在本轮仅为「特性清单」补承载位，仍然自洽）。
- **是否需重开审查**: **建议重开**——不同于 R1（标题格式）/ R2（规则缺口）的局部修正，本轮**改变了审查对象本身的结构基线**（章节集合、zone 数量、模板行数）。建议在 validate 之前，对上述**受影响项（C3 / C4 / C7 / C21）执行定向重审**（或开一次增量 review 轮次），并将 §1 概要 / §6 结论中的「7 H2 / 8 zone」取证更新为「8 H2 / 9 zone = 6+3」。其余 C1~C26 结论维持原判，不因本轮修复而需重核。
- **对 validate 的影响（提示）**: `validate-report.md` 的 V2（模板结构：7 H2 / 8 zone）与 V5（需求覆盖：FR-003）同样以旧结构为前提，建议 validate 阶段重跑 V2 及结构相关检查（预期：H2 = 8、zone = 9 = 6 rewrite + 3 preserve）。
- **追踪说明**: 本 §9 为**追踪指针**，不改变 v1.0 审查报告的原始记录（保留历史真实性）；受影响项的正式复判应由后续 review 轮次产出。

## 10. 修复记录 R4 — backlog 承接修正 + 规则空白补齐（post-validation）

- **来源**: 用户对 R3 后产物提出进一步质疑「**只有特性没有问题吗，问题清单是不是缺少了？**」。独立核查确认：R2 在 G1 中把「项目级非 Feature 待办」外移给 `@sddu-docs` 是**悬空指针**（该 Agent 模板全文 0 命中 backlog/待办/issues/bug，其产物为 `.sddu/docs-tree-root/` 现状聚合），且该 backlog 现实无归属。用户拍板**方案 B**：放回 roadmap，以 `next-actions` 行动项粒度承载；其余缺口（G-B / G-F / R-1~R-4）一并修。
- **实施方**: 由 `sddu-build` 落地，属 **build 阶段的 post-validation 修复**（照本 Feature R1 / R2 / R3 先例记录），**非重新审查**。实施明细见 `build.md` §10。
- **范围**: `src/templates/agents/sddu-roadmap.md.hbs`（G-A / G-B / R-1~R-4 / §5.7 / 修订记录 v3.1.3）；`src/templates/outputs/sddu-roadmap.md.hbs`（§7 编写期说明同步）；`src/templates/agents/sddu-docs.md.hbs`（G-F 仅 1 行落盘路径修正）。
- **对既有 C1~C26 / R3 复判建议的影响**: **不受影响**。本轮为**规则级 / 局部**修正，**未改变审查对象的结构基线**（H2 仍 8、zone 仍 9 = 6 rewrite + 3 preserve、output 模板结构未变），故 R3 §9 中对 C3 / C4 / C7 / C21 的定向重审建议维持原状、无需因 R4 扩展；C1~C26 其余结论亦不因本轮改动而需重核。唯一需登记的是 **G-A 承接归属变更**（backlog 由 roadmap 自身承载，原指针指向 `@sddu-docs` 的表述作废），该变更属「修正原实现缺陷」而非「原审查对象本身缺陷」，不重开审查。
- **关联修复项（供后续 review/validate 复核）**: G-A（排除内容表删 backlog 行 + 项目级待办承载规则 + 准入增列）/ G-B（待用户决策项契约）/ G-F（`@sddu-docs` §8.1 roadmap 落盘路径修正）/ R-1（锚点豁免）/ R-2（锚点适用范围）/ R-3（版本归属取值链）/ R-4（featureId 别名回退与 ID 形态判定）。
- **追踪说明**: 本 §10 为**追踪指针**，不改变 v1.0 审查报告的原始记录（保留历史真实性）。

## 11. 修复记录 R5 — G-F 回退 + 一致性残留清理（post-validation，收尾轮）

- **来源**: G7（定向重审 + validate 重跑）结果 —— review 的 **C3 / C4 / C7 / C21 定向重审全部维持「通过」**（建议合并）；validate 的 V2 ✅ 通过、**V5 ⚠️ 部分不通过**。V5 根因：R4 的 **G-F**（`sddu-docs.md.hbs` §8.1 roadmap 落盘路径修正）实际改动**第 3 个 src 文件**，突破本 Feature **NFR-003**（变更集 ⊆ 2 个 src 文件）与 **NFR-008**（不影响其他 Agent 指令内容），并连带使原 **V4**（工程边界）结论失效。用户决策：**G-F 回退 + 单独登记**（不改 NFR-003 边界）；低风险一致性残留一并修。
- **实施方**: 由 `sddu-build` 落地，属 **build 阶段的 post-validation 修复**（照本 Feature R1~R4 先例记录），**非重新审查**。实施明细见 `build.md` §11。
- **范围**: `src/templates/agents/sddu-docs.md.hbs`（**G-F 回退**，使该文件相对基线**零 diff**）；`spec.md`（N-1：FR-003 骨架表回填「特性索引」+ OP-001）；`plan.md`（N-2 旧计数校正 + ⑤ 模板计数口径统一）；`src/templates/outputs/sddu-roadmap.md.hbs`（N-3 编写期说明关键词清除 / N-4 占位符说明同步 R-3·R-4）；`src/templates/agents/sddu-roadmap.md.hbs`（N-6 `meta` 例外 / N-7 `ENTRY_ID` 非版本类例外 + 键稳定性规则 + 修订记录 v3.1.4）；`review.md` / `validate-report.md`（N-5 结构计数复判）；`state.json` / `build.md`（§11）/ 本报告。
- **对既有 C1~C26 结论的影响**: **不受影响** —— R5 未改变审查对象的结构基线（H2 仍 **8**、zone 仍 **9 = 6 rewrite + 3 preserve**；输出模板**结构零破坏**，仅改编写期说明措辞与占位符说明文字）。N-3 关键词清除后，C7 的「排除关键词 grep 命中 0」判据**恢复为 0**（R4 后一度为 1）；N-6 / N-7 为 §5.4.1 表述自洽化（规则表 +1 行），不改变合并机制语义。
- **对 G-F 的处置（关键）**: G7 已复判 C3 / C4 / C7 / C21 维持「通过」；R4 §10「关联修复项」中登记的 **G-F** 经 R5 **回退**（不再作为本 Feature 的修复项）。其路径笔误（`.sddu/specs-tree-root/ROADMAP.md` 应为 `.sddu/ROADMAP.md`）作为**独立待办**移交 `sddu-docs` / 框架级处理（见 `build.md` §11「遗留」）。
- **对原 V4（工程边界）的影响说明**: R4 因 G-F 越界导致原 V4 结论失效；R5 回退后 `git diff --name-only -- src/` 仅剩 **2 个 src 文件**（`src/templates/outputs/sddu-roadmap.md.hbs`、`src/templates/agents/sddu-roadmap.md.hbs`），`git diff src/templates/agents/sddu-docs.md.hbs` 输出为空 —— **NFR-003 / NFR-008 合规恢复**，工程边界结论重新成立（由后续 validate 重跑确认）。
- **追踪说明**: 本 §11 为**追踪指针**，不改变 v1.0 审查报告的原始记录（保留历史真实性）；受影响项的正式复判应由后续 review 轮次产出。
