# 验证报告：specs-tree-roadmap-output-template

> **文档定位**: SDDU 验证报告 — 逐项记录自主验证的执行结果，作为工作流终点  
> **验证策略**: validate.md（V1~V5 五组场景 / 21 检查项）  
> **前置依赖**: validate.md、spec.md、plan.md（§8）、build.md、review-report.md（状态 passed）  
> **创建人**: SDDU Validate Agent  
> **创建时间**: 2026-09-22  
> **验证轮次**: R1  
> **版本**: v1.0  
> **更新人**: SDDU Validate Agent  
> **更新时间**: 2026-09-22  
> **更新说明**: 初始创建 — 执行 V1~V5；V3 以可执行规程模拟补齐 review C20 交接的 FR-005 动态验证

## 1. 验证概要
> 验证结果的量化总览

| 维度 | 数值 |
|------|:--:|
| 验证项总数 | 21 |
| 通过 | 21 |
| 失败 | 0 |
| 无法执行 | 0 |
| 阻塞问题 | 0 |
| 非阻塞改进项 | 2（低优先，文档类） |

> **验证强度**：V1 / V2 / V4 / V5 = **实测**（命令 + 文件状态对比）；V3 = **推演**（可执行规程模拟，非真实 LLM Agent 运行），见 §3.4 说明。

## 2. 逐项验证结果（V1~VN）
> 对照 validate.md 中定义的验证场景，逐项执行并记录实测结果

| # | 验证对象 | 验证步骤 | 预期结果 | 实测结果 | 判定 |
|---|---------|---------|---------|---------|:--:|
| V1a | 构建成功（FR-011） | `npm run build:agents` | 退出码 0，拷贝 30 个输出模板 | 退出码 0；`Output templates copied (30 files)`；agent dist `sddu-roadmap.md` 374 行 | ✅ |
| V1b | 全量构建 | `npm run build` | 退出码 0 | 退出码 0（build:agents + tsc 均通过） | ✅ |
| V1c | dist 下发（FR-001） | `ls dist/templates/output/sddu-roadmap.md.hbs` | 存在（单数 `output/`） | 存在，4306 字节 / 86 行；`dist/templates/outputs/` 不存在（正确） | ✅ |
| V1d | 逐字节一致 | `diff src…/outputs/… dist…/output/…` | 无差异 | 无差异（均 4306 字节） | ✅ |
| V1e | 构建幂等（NFR-002） | 二次构建比对 30 个 dist `.hbs` md5 | 哈希一致 | `IDEMPOTENT-OK`（30/30 一致） | ✅ |
| V1f | 既有模板不受影响（NFR-008） | `diff -rq src/templates/outputs dist/templates/output` | 30 个模板全一致 | 无差异输出（30/30 byte-identical） | ✅ |
| V2a | zone 标记计数（FR-005） | grep 计数 | 18（9 开 + 9 闭） | 18（open 9 / close 9） | ✅ |
| V2b | rewrite/preserve 划分 | grep 计数 | 6 / 3 | 6 / 3 | ✅ |
| V2c | entry 标记 | grep 计数 | 2（1 开 + 1 闭） | 2（均在 `version-plan` preserve 区） | ✅ |
| V2d | 8 个 H2 集合与顺序（FR-003） | grep `^## ` | 与 spec FR-003 表一致 | 8 个且顺序完全一致 | ✅ |
| V2e | 元数据头（FR-004） | grep `^> \*\*` | 统一 8 + 专属 3 | 12 行：文档定位/输出文件名/前置依赖/创建人/创建时间/版本/更新人/更新时间/更新说明 + 当前项目版本/全局状态/生成方式 | ✅ |
| V2f | 篇幅/静态性（NFR-007） | `wc -l` / grep `{{` / Tab | ≤200 行；`{{`=0；Tab=0 | 86 行；`{{`=0；Tab=0；变量 36 处 | ✅ |
| V2g | 最小样例渲染结构合法性 | `<<…>>`→SAMPLE 后校验 | 标记成对、表格列数一致 | zone 8/8、entry 2/2、残留变量 0、表格列数 0 处不一致、PAIRING-OK | ✅ |
| V3a | V-06 增量幂等（FR-005 核心） | 沙箱产物输入未变二次合并 → `md5` + `diff` | 逐字节一致，revision-log 不追加 | 输入/输出 md5 均 `b591cbba…`，`diff` 空 | ✅ |
| V3b | V-07 保留区保留（FR-005 核心） | 改 rewrite 区 + 新增 1 entry | 既有 3 entry 逐字保留 + 新 entry 追加（计数 4）+ 顺序不变 + rewrite 整块替换 | v1.0.0/v2.0.0/v3.0.0 逐字保留 `True`；追加 v4.0.0；顺序 v1→v2→v3→v4；vision 整块替换；next-actions 追加；revision-log 新增行 | ✅ |
| V3c | V-08 非模板结构非破坏性（EC-004/FR-012） | 无标记文件执行 Step A3 | 判定非模板结构 + 文件零改动 | 返回 `NON_TEMPLATE`；无输出文件；真实 `.sddu/ROADMAP.md`（1382 行 / 0 标记）md5 `OK` 未变 | ✅ |
| V3d | V-09 标记损坏（EC / §5.4 B4） | 不成对标记执行合并 | 中止 + 含行号诊断 + 文件不变 | 返回 `ABORT`，诊断 `line 3: unpaired zone open: meta`；文件 md5 `OK` 未变；无输出文件 | ✅ |
| V4a | 分支保持 | `git branch --show-current` | `feature/roadmap-output-template` | 一致 | ✅ |
| V4b | 变更集边界（NFR-003） | `git status --short` | 实现仅 2 个 `src/` 文件 + `.sddu/` 流程产物 | `M src/templates/agents/sddu-roadmap.md.hbs`、`?? src/templates/outputs/sddu-roadmap.md.hbs`；其余均 `.sddu/` 产物 | ✅ |
| V4c | 禁区路径零 diff | `git status --porcelain .opencode/ .sddu/ROADMAP.md`；`git diff --stat -- scripts '*.ts' package.json` | 空 | 空（旧 Feature spec 亦零改动） | ✅ |
| V5a | FR/NFR/EC 覆盖（12/8/10） | 逐项 grep 锚点 + 归一化 diff | 100% | 12/12、8/8、10/10 | ✅ |
| V5b | SUP-001 一致性 | grep 旧表述 + §6 归一化 diff | 「内置固定格式」等 = 0；§6 结构一致 | 「内置固定格式」/「不通过外部模板文件定义」/「不输出版本路线图」均 0；§6 归一化 diff 仅后续章节标题不同，正文逐行一致 | ✅ |

> **结构基线复判更新（R3 / R4 / R5）**：R3 新增「特性索引」章节后，V2 的**结构类计数**由旧基线更正为当前基线——zone **16（8 开 + 8 闭）→ 18（9 开 + 9 闭）**、rewrite/preserve **5 / 3 → 6 / 3**、H2 **7 → 8**（判定结论仍为 ✅；V2d 的对照基准 `spec.md` FR-003 表已由 **SUP-002** 修订为 8 个 H2）。上述更正只涉及 H2 / zone 结构计数（判据、命令、方法与其余列文字均不变）；§2 表中 **V1a / V1c / V2f** 行的**行数 / 字节数 / 变量数**等**尺寸类**数值仍为 R1 实测记录（当前模板实测 98 行，见 `build.md` §11）。

## 3. 验证详细信息

### 3.1 测试覆盖
> 模板/配置类 Feature 无单元测试套件，以结构/构建/行为实测替代

| 需求 ID | spec 描述 | 验证场景 | 执行结果 | 覆盖率 |
|---------|----------|---------|:--:|:--:|
| FR-001 | 新增专属输出模板 | V1c/V1d/V1f | ✅ | 已覆盖 |
| FR-002 | 自描述元数据头 | V2e | ✅ | 已覆盖 |
| FR-003 | 固定章节骨架 | V2d | ✅ | 已覆盖 |
| FR-004 | 元数据头对齐统一约定 | V2e | ✅ | 已覆盖 |
| FR-005 | 增量更新语义（模板侧） | V2a–V2c + V3a/V3b | ✅ | 已覆盖（静态 + 动态） |
| FR-006 | 精简边界与内容准入 | V2a/V2f + V5 | ✅ | 已覆盖 |
| FR-007 | §6 统一两级引用 | V5b | ✅ | 已覆盖 |
| FR-008 | 移除 §5 内联骨架 | V5 | ✅ | 已覆盖 |
| FR-009 | §1 笔误修正 | V5 | ✅ | 已覆盖 |
| FR-010 | 通用模板化判定标准 | V5 | ✅ | 已覆盖 |
| FR-011 | 构建分发链路 | V1a/V1d | ✅ | 已覆盖 |
| FR-012 | 旧结构 ROADMAP 非破坏性 | V3c | ✅ | 已覆盖 |
| FR-002~012 NFR-001~008 EC-001~010 | 见 validate.md §3 | V2/V4/V5 + V3c/V3d | ✅ | 已覆盖 |

### 3.2 接口数据
> 无运行时 API / 数据库；以构建分发链路（src→dist 裸拷贝）为等价接口。**本项跳过**（Feature 类型自适应）。

### 3.3 构建脚本

| 命令 | 退出码 | 输出摘要 | 结果 |
|------|:--:|---------|:--:|
| `npm run build:agents` | 0 | outputs 30/30 拷贝；agents 11（`sddu-tree` 跳过为既有设计） | ✅ |
| `npm run build` | 0 | build:agents + `tsc`（build:ts）均通过 | ✅ |
| `npm run build:ts`（tsc） | 0 | 无错误 | ✅ |

### 3.4 性能边界 / 动态行为
> V3 增量合并动态验证（review C20 交接重点）

- **沙箱路径**：`/tmp/sddu-validate-roadmap/`（含脚本 `merge_sim.py`、样例 `product.initial.md` / `product.v06.md` / `product.v07.md`）
- **方法**：将 agent 模板 §5.4 Step A–D 规程逐条实现为**可执行规程模拟**（确定性重放 `mode` 分派、条目级 upsert、清单保留、表格自然键、C3 结构校验、B4 中止），对**沙箱文件状态**做对比。
- **验证强度（如实标注）**：**推演 / 规程模拟**，非真实 LLM Agent 运行。其可证伪性在于：若规程本身不可执行或算法自相矛盾，模拟会在幂等/保留/回退场景暴露失败。真实的「LLM 是否遵循 §5.4」属 plan R1 残余风险，由 C3 结构校验 + §5.7 自检清单 + §8 异常表三道护栏约束，不在本报告可确定性验证范围。
- **结论**：V-06 幂等、V-07 保留、V-08 非破坏性、V-09 中止诊断四项**全部符合预期**。

### 3.5 漂移检测

| 漂移类型 | 检测方法 | 结果 |
|---------|---------|------|
| 孤立代码 | `git status` vs plan §5.1 变更清单（V4） | ✅ 无（实现仅 2 个 `src/` 文件） |
| 需求缺失 | FR/NFR/EC 逐项锚点（V5a） | ✅ 无（12/8/10 全落实） |
| 规格漂移 | SUP-001 与 agent 模板实际表述复核（V5b） | ✅ 无（旧表述计数全 0） |
| 文档基线漂移 | 核对「28 个既有输出模板」计数（review C26） | ⚠️ 1 项：文档声明 28，实际既有 29（详见 §5）；**R5 已校正 `plan.md` 侧计数口径（28 → 29，既有 29 / 实测总数 30）** |

## 4. 验证脚本执行记录
> ADR-003 落地：validate Agent 自主编写并直接执行的验证脚本记录

| 脚本文件 | 用途 | 对应场景 | 退出码 | 关键输出 |
|---------|------|:--:|:--:|---------|
| `/tmp/sddu-validate-roadmap/merge_sim.py` | Step A–D 合并规程可执行模拟（幂等/保留/非模板/损坏标记） | V3a–V3d | 0 | `MERGED`(md5 一致) / `MERGED`(entries=4, 旧 3 保留) / `NON_TEMPLATE` / `ABORT: line 3` |
| 内联 shell（`/tmp/sddu-validate-h1.txt` / `h2.txt`） | 30 个 dist `.hbs` 两次构建 md5 比对 | V1e | 0 | `IDEMPOTENT-OK` |
| 内联 shell（`md5sum -c`） | 真实 `.sddu/ROADMAP.md` 与无标记样例的改动前后 md5 校验 | V3c/V3d | 0 | `OK`（文件未变） |

## 5. 阻塞问题
> 必须修复后才能通过验证的问题

**无阻塞问题。**

**非阻塞改进项（低优先，文档类，不影响实现与交付）**：

| # | 位置 | 问题 | 对应 Vx | 修复建议 |
|---|------|------|:--:|---------|
| 1 | `spec.md` §2 / `plan.md` §5.1 | 声明既有「28 个输出模板」，实测既有 29（9 根级 + 20 `docs/`），基线计数偏差 1（review C26） | V1f/V5 | 后续维护时校正为 29 或注明计数口径；纯流程文档，不影响实现。**R5 已执行**：`plan.md` 各「其他 / 既有 28 个」→ **29**（实测依据 `find src/templates/outputs -name '*.hbs'` = 30，既有/其他 = 29）；`spec.md` 侧经复核无该计数声明，无需改 |
| 2 | `src/templates/agents/sddu-roadmap.md.hbs` §5.4.1 | 「标记只标注标题之下的内容区」与 `meta` zone（位于 H2 之上）轻微不符（review C23） | V2a | 补注「zone 亦可标注标题之外的文件级区段（如 `meta`）」。**R5 已执行（N-6）**：§5.4.1「与标题解耦」行补 `meta` zone 例外 |

> 另注（非缺陷）：任务书曾提及 `dist/templates/outputs/sddu-roadmap.md.hbs`（复数），实测复数目录不存在；规范路径为 `dist/templates/output/…`（单数，spec FR-001），实现与 spec 一致。

## 6. 结论
> 验证最终结论

**结论**: ✅ 通过

**指标达标矩阵**：

| 指标 | 要求 | 实测 | 达标？ |
|------|------|------|:--:|
| FR 测试覆盖 | 100% | 100%（12/12） | ✅ |
| NFR 测试覆盖 | 100% | 100%（8/8） | ✅ |
| EC 覆盖 | 100% | 100%（10/10） | ✅ |
| SUP-001 一致性 | 成立 | 成立（旧表述计数 0） | ✅ |
| 构建退出码 | 0 | 0（build:agents / build / tsc） | ✅ |
| 构建幂等 | 一致 | 30/30 哈希一致 | ✅ |
| src↔dist 一致 | 逐字节 | 逐字节一致（4306B） | ✅ |
| FR-005 动态行为 | 幂等 / 保留 / 非破坏性 | 4 场景全部符合（强度：推演） | ✅ |
| 阻塞问题数 | 0 | 0 | ✅ |
| 漂移项 | 0 | 1（文档基线计数，低优先非阻塞） | ⚠️ |

**理由**: 2 个 `src/` 实现文件严格落地 12 FR / 8 NFR / 10 EC 与 SUP-001；模板结构（18 zone / 6 rewrite / 3 preserve / 8 H2 / 98 行）与元数据头（统一 8 + 专属 3）完全符合 spec；构建分发链路 dist 逐字节一致且二次构建幂等，30 个模板不受影响；工程边界严格，变更集仅 2 个 `src/` 文件，`scripts/`/`*.ts`/`package.json`/`.opencode/`/`.sddu/ROADMAP.md`/旧 Feature spec 零 diff；review C20 交接的 FR-005 增量合并机制已由沙箱可执行规程模拟完成 V-06 幂等 / V-07 保留 / V-08 非模板结构 / V-09 损坏标记四项动态验证，全部符合预期。无阻塞问题；2 项低优先文档改进不改变交付结论。**结论：✅ 通过。**

**验证强度声明**: V3 为「规程模拟（推演）」，已在 §3.4 如实标注；真实 LLM 对 §5.4 规程的运行时遵循度属残余风险（plan R1），由结构校验与自检清单护栏覆盖。

## 修订记录
> 记录本文档的版本变更历史

| 版本 | 变更说明 | 日期 | 修订人 |
|------|---------|------|--------|
| v1.0 | 初始创建 — 执行 V1~V5（21 检查项，21 通过）；V3 以可执行规程模拟完成 FR-005 动态验证；识别 2 项低优先非阻塞文档改进；结论 ✅ 通过 | 2026-09-22 | SDDU Validate Agent |
