# 验证策略：DSH 适配

> **文档定位**: SDDU 验证策略 — 指导 validate Agent 执行自主验证的场景和方法；**验证结果见 validate-report.md**（本文件不含执行结论）
> **前置依赖**: spec.md（需求规范 v1.0，10 FR / 7 NFR / 9 EC + 附录 V1~V5）、plan.md（技术方案 v1.0，方案 C + ADR-001~006 + R-DSH-01~06 + 文件影响 21 项）、tasks.md / tasks.json（14 任务 / 4 波次）、review.md（审查策略 C1~C48）、build.md（构建产物，**本策略阶段尚不产出**）
> **创建人**: SDDU Validate Agent
> **创建时间**: 2026-09-27
> **版本**: v1.0
> **更新人**: SDDU Validate Agent
> **更新时间**: 2026-09-27
> **更新说明**: 初始创建 — 依据 spec §5/§6/§7 + 附录 V1~V5、plan §2.6/§5/§7、tasks §4.2 与既定验证边界（NG-002 / 无 CLI / 2026-08-14 快照），自主定义 22 个验证场景（V1~V5 用户配合人工观测 + V6~V22 本地自动化），并声明 Feature 类型判定、五维度适配性、判据口径、验证脚本规划与结论判定规则

> **阶段说明（重要）**：本文件是 validate 产物拆分的**步骤 1「策略文档」**（ADR-004）。此时 `phase=tasked`、build 尚未执行，因此：
> - 本文件只定义「验什么、怎么验、判据是什么」，**不产出任何通过/失败判定**；
> - 验证对象为**未来 build 产物**，路径以 `plan.md §5` 文件影响与 `tasks.md §2` 验收标准为准；
> - 逐项结果、实测数据、阻塞问题、结论由 **validate-report.md**（每轮 R1/R2… 独立产出）承载。
>
> **本 Feature 显式例外（既定约束）**：端到端验证**不在实施范围**（spec NG-002）；dsh 侧**无 CLI、仅 Web UI**（用户权威口径），实机观测须用户配合。故 **V1~V5 以「用户执行手册」形态交付，其 dsh 实机执行不计入本次交付阻断项**；本次交付的自动化验证面收敛为「构建 / 静态断言 / 打包 / 结构断言」。

---

## 1. 验证概要

> 本节量化「验证范围」，而非「验证结果」。结果量化见 validate-report.md §1。

| 维度 | 数值 |
|------|:--:|
| 验证场景总数（Vx） | **22**（V1~V22） |
| 本地自动化场景 | **17**（V6~V22，可在报告阶段由 validate 自行执行） |
| 用户配合人工观测场景 | **5**（V1~V5，严格对齐 spec.md 附录） |
| 覆盖 FR | **10 / 10**（每 FR ≥ 1 个 Vx） |
| 覆盖 NFR | **7 / 7** |
| 覆盖 EC | **9 / 9** |
| 覆盖验证维度 | §5.1 / §5.2 / §5.3 / §5.5 **全覆盖**；§5.4 **部分适用**（性能「不适用」，边界适用） |
| FR 覆盖目标 | 100% |
| NFR 覆盖目标 | ≥ 80%（7/7 均有观测路径） |
| 本地可执行验证面 | `npm run build` / `jest`（TASK-009 静态断言）/ `tsc --noEmit` / `scripts/build-dsh-skills.cjs` / `scripts/package.cjs` / `bash -n` / grep+diff 结构断言 |
| 阻塞问题上限 | 0 |
| 严重漂移上限 | 0 |

**场景编号约定**：**V1~V5 为 spec.md 附录既定的人工观测验证场景与方法**（保留原编号，便于逐条追溯）；**V6~V22 为 validate Agent 依据「本地可执行验证面」自主补充的自动化验证场景**。两层共同构成完整验证矩阵。

---

## 2. 验证边界与分层策略

### 2.1 Feature 类型判定

| 判定项 | 结果 |
|------|------|
| 是否存在 `src/` 代码文件 | ✅ 有（`src/adapters/dsh/{index,contract}.ts`） |
| 是否存在测试目录 | ✅ 有（`src/__tests__/unit/adapters/dsh/skill-package.test.ts`） |
| 是否存在 HTTP API / DB | ❌ 无 |
| 主体形态 | **混合型**：适配层代码（TS）+ 声明式资产（`.hbs` / `.json`）+ 构建/安装脚本（`.cjs` / `.sh`）+ 文档集（`docs/dsh/*`）+ 生成物（`dist/dsh/**`） |
| 结论 | 按**「代码 + 配置/文档混合型」**处理：**侧重 §5.1（静态断言覆盖）+ §5.3（构建与脚本完整性）+ §5.5（漂移与一致性）**；§5.2 以「静态数据契约一致性」重构口径；§5.4 性能项「不适用」、边界项适用 |

### 2.2 五维度适配性

| 验证维度 | 适用性 | 说明 |
|------|:--:|------|
| §5.1 测试覆盖 | ✅ 适用 | TASK-009 静态断言套件（≥8 组）+ `tsc`；本地可执行。**注**：断言对象是**生成物静态结构**，不冒充 dsh 实机验证（NG-002） |
| §5.2 接口与数据 | ⚠️ 适用（重构口径） | 本 Feature **无 HTTP API / DB schema**。以静态**数据契约**一致性校验替代：`dsh-contract-manifest.json`、`dist/dsh/manifest.json`、`router-command-map.json`、四个结构化协议块字段、文档引用 |
| §5.3 构建与脚本 | ✅ 适用 | `npm run build`（含 `build:dsh`）、`build-dsh-skills.cjs`、`package.cjs`、`install-dsh.sh` / `uninstall-dsh.sh` |
| §5.4 性能与边界 | ⚠️ 部分适用 | **性能项「不适用」**：NFR-001~007 无运行时性能指标，且端到端运行不在范围（NG-002）。**边界项适用**：EC-001~009 + 构建失败路径 + 非法 phase 枚举抛错 |
| §5.5 漂移与孤立检测 | ✅ 适用 | 核心域 dsh 概念零泄漏扫描 / 单向依赖 / 零改动白名单 / 指令单一来源 / 时效标注一致 / 文档引用一致 |

### 2.3 分层与执行方

| 层 | 场景 | 执行方 | 是否本次交付阻断项 | 观测依据 |
|:--:|------|:--:|:--:|------|
| 层 A（本地自动化） | V6~V22 | validate Agent（自动化/脚本） | **✅ 是** | 构建退出码 / jest 结果 / tsc / grep / diff / unzip |
| 层 B（用户配合人工观测） | V1~V5 | 用户（dsh Web UI）+ 维护者 | **❌ 否**（既定约束：端到端不在实施范围，NG-002） | ① dsh Web UI 会话内容；② `.sddu/` 产物文件；③ dsh 会话事件日志（`SessionEvent` 可回放） |

> **报告阶段口径（EC-006）**：层 B 场景在 validate-report.md 中一律记为「待用户配合（未观测）」，**不得**将「未观测」表述为「通过」；层 A 场景逐项记录实测数据与退出码。

---

## 3. 自主验证场景矩阵（V1~V22）

**验证对象来源**：
- `spec.md`：FR-001~010 / NFR-001~007 / EC-001~009 / 附录 V1~V5 → 逐项验证实现完整性与验收标准
- `plan.md`：§2.6 隔离规则 R-DSH-01~06、§2.7 FR→实现路径、§5 文件影响 21 项、§7 ADR-001~006 → 架构遵循性
- `tasks.md` / `tasks.json`：14 任务验收标准与验证命令 → 可执行判据来源
- `src/` + `scripts/` + `docs/` + `dist/`：实际产物 → 结构、断言、构建完整性

**图例**：执行方 `自动化` = validate 阶段可脚本执行；`人工` = 需用户配合（dsh Web UI）。

### 3.1 层 B — 用户配合人工观测场景（V1~V5，严格对齐 spec.md 附录，**非端到端验收标准**）

> 性质声明：下列 V1~V5 是**验证方法与验证场景**，用于让「适配是否达成」可被观测，**不是端到端验收标准**。执行由用户配合人工完成，作为**用户执行手册**交付，不计入本次交付阻断项。

| 场景 | 验证对象（FR） | 前置条件 | 验证步骤 | 观测判据 | 预期记录方式 | 所需环境 | 执行方 |
|:--:|------|------|------|------|------|------|:--:|
| **V1 装配可见** | FR-001 | SDDU Skill 包已由 `install-dsh.sh` 落位（主 rank 100 `<projectRoot>/.dsh/skills`；用户级 rank 400 `<dshHome>/skills`）；dsh Web 会话已开启 | 1) 在 dsh Web UI 打开/刷新可用 skill 列表；2) 确认出现 `sddu` / `sddu-*` 条目；3) 核对条目来源标识（`metadata.sddu-source`）与优先级；4) 若存在同名/近义 skill，按 rank / 最近层规则核对是否有显式冲突提示 | 列表出现 SDDU 条目且**来源可辨识**；**无静默遮蔽**（冲突时有显式提示与落位建议） | 截图 + 条目清单（`name` / `source` / `rank`）；冲突时记录提示原文 | dsh Web UI（用户侧，无 CLI） | 人工（用户） |
| **V2 入口可用** | FR-002 | V1 通过（SDDU 条目可见） | 1) 会话输入入口 `/sddu`；2) 输入 `/sddu plan specs-tree-x`；3) 输入非法阶段（如 `/sddu foo specs-tree-x`） | 进入**正确**阶段 Agent 行为；非法输入输出 `[SDDU-ROUTE-REJECT]` 且**不误推进**（不进入任何阶段、不写任何文件） | 会话对话片段（含 `[SDDU-ROUTE-REJECT]` 原文） | dsh Web 会话 | 人工（用户） |
| **V3 单阶段走通** | FR-003 / FR-005 | V2 通过；已准备一个最小 Feature（建议 discovery） | 1) 触发 `/sddu discovery <feature>`；2) 观察阶段产物落盘；3) 检查 `.sddu/specs-tree-root/<feature>/discovery.md` 存在且格式合法（可被 SDDU 后续阶段读取）；4) 检查 `state.json` 的 `phase` / `phaseHistory` 与产物一致；5) 执行**三方对账**（`state.json` ⟷ 产物存在性 ⟷ `[SDDU-STATE-SYNC]` 会话记录） | 产物存在且合法；`state.json` 与产物一致；会话含 `[SDDU-STATE-SYNC]` 记录；三方无不一致或已按规则报告 | 产物文件 + `state.json` 片段 + `[SDDU-STATE-SYNC]` 原文 | dsh Web 会话 + `.sddu/` 工作区 | 人工（用户 + 维护者） |
| **V4 门禁行为观测** | FR-004 | V2 通过；某 Feature 处于 `registered`（前置阶段未完成） | 1) 尝试非法跃迁（如 `registered` 直接进入 build）；2) 观测会话结果块；3) 核对交付文档中的降级声明 | **双判据**：① 出现明确的 `[SDDU-GATE-DENY]` 拒绝块且 `state.json` **未推进**；② 每份阶段 `SKILL.md` 与 `docs/dsh/verification.md` / `README.md` 均含「已知降级：dsh 侧无运行时硬拒绝点，FR-004b 非硬强制」声明 | 会话原文（`[SDDU-GATE-DENY]` 块）+ 文档降级声明位置 | dsh Web 会话 + 交付文档 | 人工（用户 + 维护者） |
| **V5 升级跟随** | FR-007 / NFR-001 | dsh 版本更新后；已按 `upgrade-following.md` 步骤 0 刷新契约（或**如实记录刷新失败**） | 1) 按 `upgrade-following.md` 步骤 0~6 执行；2) 重复 V1→V2→V3；3) 定位破坏点并填写记录模板 | 能按清单定位破坏点并完成回归/修复；破坏点记录模板 9 字段填齐；未刷新时如实标注「快照态、不可信」 | 破坏点记录表（9 字段）+ 成本基线口径 | dsh Web 会话 + 交付文档 | 人工（用户） |

### 3.2 层 A — 本地自动化验证场景（V6~V22）

| # | 场景 / 验证对象 | 前置条件 | 验证步骤（命令 / 脚本） | 通过判据 | 所需环境 | 映射 FR/NFR/EC | 维度 | 执行方 |
|:--:|------|------|------|------|------|------|:--:|:--:|
| **V6** | 构建完整性（全链 build） | 依赖已安装（`npm ci`） | `npm run build`（= `build:agents` && `build:ts` && `build:dsh`） | 退出码 **0**；`dist/dsh/skills/sddu-*`（11）与 `dist/sddu/` **同级并列**存在 | Node.js + npm | FR-003、NFR-004；（plan R-010） | §5.3 | 自动化 |
| **V7** | dsh 生成物结构与幂等 | V6 通过 | 1) `node scripts/build-dsh-skills.cjs`；2) 连跑第二次比对；3) `ls -d dist/dsh/skills/sddu-* \| wc -l`；4) 检查每个 `SKILL.md` 非空 | 退出码 **0**；生成目录恰 **11** 个；二次运行除 `generatedAt` 外产物字节一致（幂等） | Node.js | FR-001、FR-003、NFR-002 | §5.3 | 自动化 |
| **V8** | manifest 版本锚定与契约哈希 | V6 通过 | node 脚本比对 `dist/dsh/manifest.json`：`sdduVersion` == `package.json.version`；`dshContractSnapshot` == `"2026-08-14"`；`contractManifestHash` == `sha256(src/adapters/dsh/contract/dsh-contract-manifest.json)`；`skills.length` == 11 | 四项等式**全部成立** | Node.js | FR-007、NFR-001、NFR-007 | §5.2 | 自动化 |
| **V9** | jest 生成物静态断言套件（TASK-009） | V6 通过（生成物存在；`beforeAll` 缺失时按需触发构建） | `npx jest --config jest.config.ts --selectProjects opencode --testPathPattern adapters/dsh`；统计 `it/test` 用例数 | **全绿**；用例数 **≥ 8**（覆盖结构/入口清单/协议片段/禁用语/单一来源/版本锚定/核心域隔离/OpenCode 零污染 8 组） | Node.js + jest | FR-001/002/004/005/007/009、NFR-002/004 | §5.1 | 自动化 |
| **V10** | 类型检查 | 依赖已安装 | `npx tsc --noEmit` | 退出码 **0** | Node.js + TS | FR-007、NFR-004 | §5.3 | 自动化 |
| **V11** | 核心域零泄漏 + 孤立代码扫描 | 源码就绪 | 1) `grep -rEl 'dsh\|rank\|\.dsh/skills' src --include='*.ts' \| grep -v '^src/adapters/dsh/' \| grep -v '^src/__tests__/' \| wc -l`；2) 扫描 `src/` 中 dsh 命名的非白名单文件 | 核心域命中数 **0**；无白名单外的 dsh 源文件（R-DSH-01）；`src/index.ts` 无 dsh 导出 | bash + git | FR-009②、NFR-004；R-DSH-01/02 | §5.5 | 自动化 |
| **V12** | 单向依赖 + 零改动白名单 + 纯追加 | 源码就绪 | 1) `! grep -rn 'adapters/opencode' src/adapters/dsh/`；2) `git status --porcelain -- install.sh install.ps1 src/index.ts src/adapters/opencode src/state src/templates/agents` 为空；3) `git diff --numstat` 对 4 个 MODIFY 文件删除行数 == 0 | 无越界依赖（R-DSH-03）；白名单**零改动**（R-DSH-04）；4 MODIFY 为**纯追加** | bash + git | FR-009①、NFR-004；R-DSH-03/04 | §5.5 | 自动化 |
| **V13** | 打包隔离与同级并列 | V6 通过 | 1) `node scripts/package.cjs`；2) `test -d dist/dsh && test -d dist/sddu`；3) `unzip -l dist/sddu.zip \| grep -c 'dsh/'`；4) `ls -d dist/dsh/skills/sddu-* \| wc -l` | `dist/dsh/` 与 `dist/sddu/` **同级并列**且均存在；`dist/sddu.zip` 含 `dsh/` 条目数 **0**；dist/dsh/skills **11** | Node.js + unzip | FR-009①、NFR-004；（plan R-010） | §5.3 | 自动化 |
| **V14** | 入口清单 ↔ phase 枚举一致性 | 源码就绪 | node 校验 `router-command-map.json`：`skills.length`==11；每条 `sourceTemplate` 在 `src/templates/agents/` **真实存在**；`entries`==11；`phaseAliases` 目标值 ⊆ `VALID_PHASES`；与 `src/adapters/dsh/index.ts` 的 `SKILL_NAMES` 一致 | 全部成立（防双平台入口漂移） | Node.js | FR-001③、FR-002③、NFR-002 | §5.2 | 自动化 |
| **V15** | 结构化协议块完备性 + 禁用语 | V6 通过 | 1) 每个阶段 `SKILL.md` 含 `[SDDU-GATE-DENY]` / `[SDDU-GATE-ALLOW]` / `[SDDU-STATE-SYNC]` + 「已知降级」段；2) 路由 `sddu/SKILL.md` 含 `[SDDU-ROUTE-REJECT]`；3) `gate-protocol.md.hbs` 含 `"action":"none"` / `"action":"proceed"`；4) 全量生成物中「硬强制」**仅**出现在「非硬强制」否定语境，且无 `强制执行` / `运行时硬拒绝` 肯定表述 | 全部成立（无静默丢失门禁语义） | bash + Node.js | FR-002/004/005、NFR-003、EC-003 | §5.2 / §5.1 | 自动化 |
| **V16** | 指令单一来源（R-DSH-05） | V6 通过 | 1) 每个生成物含其 `sourceTemplate` 正文**抽样特征串**；2) `grep` `src/adapters/dsh/` 内无阶段指令正文副本；3) `git status --porcelain -- src/templates/agents` 为空 | 构建期**拼接而非改写**；`src/templates/agents/**` **零写操作** | bash + git | FR-003、NFR-002；R-DSH-05 | §5.5 | 自动化 |
| **V17** | 文档交付完整性 + 跨文档引用一致 | V6 通过 | 1) 存在 `docs/dsh/{README,verification,positioning,upgrade-following,dual-platform-diff,contract-dependencies}.md` 六份；2) README 入口清单与 `router-command-map.json` 11 条一致；3) `verification.md` V1~V5 每项含「步骤/观测方式/通过判据/配合方」；4) `positioning.md` ≥3 判定示例；5) `upgrade-following.md` 步骤 0~6 + 9 字段破坏点模板；6) `contract-dependencies.md` 条目与 manifest 一一对应；7) 仓库 `README.md` 追加节删除行 == 0 | 六份齐备且**交叉引用一致**；`contract-dependencies.md` 为构建单一来源（无手工第二份） | bash + git | FR-006/007/008/010、NFR-001②/002/005/006 | §5.5 | 自动化 |
| **V18** | 时效快照 + 降级声明跨文档一致 | 源码/文档就绪 | 1) grep `2026-08-14` 出现在所有含 dsh 事实的文档与 manifest；2) 统一「快照态」措辞；3) 统一「已知降级 FR-004b、非硬强制」表述 | 无**过时快照冒充当前事实**；时效与降级口径**跨文档一致** | bash | NFR-007、EC-003 | §5.5 | 自动化 |
| **V19** | 契约依赖清单结构完备 | 源码就绪 | node 校验源清单 `dsh-contract-manifest.json`：顶层 `dshContractSnapshot`=="2026-08-14"；`dependencies` ≥7；每条含 8 字段且 `snapshotDate` 全为 `"2026-08-14"`；7 类依赖点齐全；`command-registration` / `guard-pipeline` / `profile-bundle` 有**缺口标注** | 全部成立 | Node.js | NFR-001、FR-007、EC-001 | §5.2 | 自动化 |
| **V20** | 安装/卸载脚本静态 + 功能 | V6 通过 | 1) `bash -n scripts/install-dsh.sh && bash -n scripts/uninstall-dsh.sh`；2) `--help` 退出码 0 且无副作用；3) 在临时目录 `install-dsh.sh --project-root <tmp>` 落位后校验 `tmp/.dsh/skills` 含 11 个 `sddu-*`；4) `uninstall-dsh.sh` 后残留 **0**；5) `grep 'dsh '` 无 dsh CLI 子命令调用；6) `git status --porcelain -- install.sh install.ps1` 为空 | 全部通过；`sddu-*` 精确匹配无通配误删；不依赖 dsh CLI | bash + 临时目录 | FR-008、EC-002、EC-004、EC-007 | §5.3 | 自动化 |
| **V21** | 既有链路回归（OpenCode 零污染） | V6 通过 | `npm run test:core` + `npm run test:opencode` | 两条测试**全绿** | Node.js + jest | FR-009①、NFR-004；（plan R-010） | §5.1 | 自动化 |
| **V22** | 边界与错误路径 | 源码就绪 | 1) 构造非法 `phaseTarget` / 缺失模板 → `build-dsh-skills.cjs` 以**非零退出**并打印可定位错误；2) 向 `validateContractManifest()` 注入非法 phase 枚举 → **抛错**；3) 核对 `gate-protocol.md.hbs` 含 EC-008「落盘失败 → 报错 + 回退 + 不推进」文本 | 错误路径**可观测**且**不静默通过** | Node.js | EC-008、FR-004 | §5.4（边界） | 自动化 |

> **质量门槛（数量基线法）**：每个 FR ≥ 1 个 Vx（FR-001 → V1/V7/V9/V14；FR-002 → V2/V9/V14/V15；FR-003 → V3/V6/V7/V16；FR-004 → V4/V9/V15/V22；FR-005 → V3/V9/V15；FR-006 → V5/V17；FR-007 → V5/V8/V17/V19；FR-008 → V17/V20；FR-009 → V9/V11/V12/V13/V21；FR-010 → V17）✅；每个相关维度 ≥ 1 条（§5.1 → V9/V21；§5.2 → V8/V14/V15/V19；§5.3 → V6/V7/V10/V13/V20；§5.4 → V22；§5.5 → V11/V12/V16/V17/V18）✅；Vx 总数 22 ≥ max(10 FR, 5 维度) ✅。**清单合格。**

---

## 4. 测试覆盖验证

> 本节定义**覆盖验证计划**；实测结果与覆盖率数字由 validate-report.md 填充。

### 4.1 功能需求 (FR) — 覆盖映射

| 需求 ID | spec 描述 | 覆盖场景 | 覆盖类型 | 目标状态 |
|:--:|------|------|:--:|:--:|
| FR-001 | Skill 包装配与落位 | V7、V9、V14、V17、**V1** | 自动化 + 人工 | 待执行 |
| FR-002 | 命令入口与阶段路由 | V9、V14、V15、**V2** | 自动化 + 人工 | 待执行 |
| FR-003 | 单阶段流程承载与产物落盘 | V6、V7、V16、**V3** | 自动化 + 人工 | 待执行 |
| FR-004 | 阶段门禁承载的目标与约束 | V9、V15、V22、**V4** | 自动化 + 人工 | 待执行 |
| FR-005 | 状态推进与 state.json 一致性 | V9、V15、**V3** | 自动化 + 人工 | 待执行 |
| FR-006 | 验证方法与验证场景 | V17（verification.md）、**V1~V5** | 文档 + 人工 | 待执行 |
| FR-007 | 升级跟随机制 | V8、V17、V19、**V5** | 自动化 + 人工 | 待执行 |
| FR-008 | 安装 / 卸载 / 升级路径 | V17、V20 | 自动化 | 待执行 |
| FR-009 | 适配层隔离边界 | V9、V11、V12、V13、V21 | 自动化 | 待执行 |
| FR-010 | 与 dsh 原生方法论的分工定位 | V17（positioning.md） | 文档 | 待执行 |

> 说明：**FR-006 / FR-010 为文档类需求**，其验收标准本身即「交付说明/清单/定位文档」，由 V17 静态核对文档内容与一致性；不涉及运行时行为，故无 jest 断言但**有验证路径**，不计为「未覆盖」。

### 4.2 非功能需求 (NFR) — 覆盖映射

| 需求 ID | spec 描述 | 覆盖场景 | 覆盖类型 | 目标状态 |
|:--:|------|------|:--:|:--:|
| NFR-001 | 兼容性（契约依赖集中/隔离层） | V8、V19 | 自动化 | 待执行 |
| NFR-002 | 可维护性（双平台零漂移） | V9、V14、V16、V17 | 自动化 | 待执行 |
| NFR-003 | 可追溯性（可观测证据） | V9、V15 | 自动化 | 待执行 |
| NFR-004 | 隔离性（最小侵入） | V6、V10、V11、V12、V13、V21 | 自动化 | 待执行 |
| NFR-005 | 可用性（无 CLI 人工成本可控） | V17（时间预算）、**V1** | 文档 + 人工 | 待执行 |
| NFR-006 | 可验证性（Web UI 可判定） | V17、**V1~V5** | 文档 + 人工 | 待执行 |
| NFR-007 | 时效性（快照标注） | V8、V18 | 自动化 | 待执行 |

> NFR 覆盖 7/7（100%），满足 ≥ 80% 门槛。

---

## 5. 接口与数据实测

> **口径重构**：本 Feature **无 HTTP API、无 DB schema**（§2.2）。本节以静态**数据契约**一致性校验替代「接口调用」。实测结果由 validate-report.md 填充。

| 检查项（数据契约） | 契约来源 | 预期要求 | 验证场景 |
|------|------|------|:--:|
| `dist/dsh/manifest.json` 版本锚定 | plan §2.7 / ADR-006 | `sdduVersion` == `package.json.version`；`dshContractSnapshot `== `"2026-08-14"`；`contractManifestHash` == 源清单 sha256；`skills.length` == 11 | V8 |
| `dsh-contract-manifest.json` 结构 | TASK-001 / NFR-001 | 顶层 `dshContractSnapshot`；`dependencies` ≥7；每条 8 字段；7 类齐全；三条缺口标注 | V19 |
| `router-command-map.json` 入口契约 | TASK-005 / FR-001/002 | `skills`==11；`entries`==11；`sourceTemplate` 文件存在；`phaseAliases ⊆ VALID_PHASES` | V14 |
| 四个结构化协议块字段 | ADR-003/004 / TASK-003/004/005 | `GATE-DENY{feature,from,to,missing,reason,action:"none"}`；`GATE-ALLOW{...,action:"proceed"}`；`ROUTE-REJECT{input,valid,hint}`；`STATE-SYNC{feature,from,to,artifact,phaseHistoryAdded,ts}` | V15 |
| 文档 ↔ 单一来源引用 | NFR-002 / C47 | README 入口清单 == 11 条；`contract-dependencies.md` == manifest；`verification.md` V1~V5 == spec 附录 | V17 |

> 判据：各契约「来源值 ↔ 生成值/文档值」**逐字段等式成立**；任一处不一致即记为偏差项，写入 validate-report.md。

---

## 6. 构建与脚本验证

> 实测退出码与输出由 validate-report.md 填充。

| 检查项 | 命令 | 预期退出码 | 验证场景 |
|------|------|:--:|:--:|
| 全链构建 | `npm run build` | 0 | V6 |
| dsh 生成 | `node scripts/build-dsh-skills.cjs` | 0 | V7 |
| 类型检查 | `npx tsc --noEmit` | 0 | V10 |
| 打包 | `node scripts/package.cjs` | 0 | V13 |
| Shell 语法 | `bash -n scripts/install-dsh.sh` / `uninstall-dsh.sh` | 0 | V20 |
| 静态断言套件 | `npx jest --config jest.config.ts --selectProjects opencode --testPathPattern adapters/dsh` | 0 | V9 |
| 回归（核心） | `npm run test:core` | 0 | V21 |
| 回归（OpenCode） | `npm run test:opencode` | 0 | V21 |

---

## 7. 性能与边界验证

> **性能项：不适用**。本 Feature 无运行时性能 NFR（NFR-001~007 均非性能指标），且端到端运行不在实施范围（NG-002）→ 不做压测/基准。
>
> **边界项：适用**（EC-001~009）。下为边界验证计划，实测由 validate-report.md 填充。

| 边界 (EC) | spec 要求 | 验证方式（场景） | 判据 |
|:--:|------|:--:|------|
| EC-001 破坏性升级导致失效 | 按 FR-007 清单定位并记录 | V5（人工）/ V19（清单缺口标注） | 步骤 0「刷新契约（失败则如实记录）」存在；破坏点模板 9 字段 |
| EC-002 rank 遮蔽冲突 | 显式提示、不静默遮蔽 | V20 / V15 | install 输出含同名/近义冲突提示段 |
| EC-003 门禁无法硬承载 | 如实声明已知降级 | V15 / V18 | 「硬强制」仅出现在否定语境 |
| EC-004 未被注册表发现 | 落位自检清单 + `skills/change` 失效提示 | V20 / V17 | 自检段存在，无静默失败 |
| EC-005 state 与会话/产物不一致 | 报告不一致 + 禁止静默覆盖 | V15 / V3 | 三方对账规则成文 |
| EC-006 无 CLI 无法自动断言 | 人工清单 + 显式缺口声明 | V17 / V1~V5 | 「无法自动化断言」声明存在；未观测 ≠ 通过 |
| EC-007 命名/近义冲突 | `sddu-` 前缀 + 来源标识 | V14 / V20 | 命名约定与裁决规则存在 |
| EC-008 产物落盘失败 | 报错 + 回退 + **不推进** | V22 / V15 | gate-protocol 含「落盘失败不推进」文本 |
| EC-009 混用原生 plan mode | 可观测提示与建议 | V17（positioning.md） | 混用提示与 ≥3 判定示例 |

---

## 8. 漂移检测

> 检测计划；实测结果由 validate-report.md 填充。

| 漂移类型 | 检测方式 | 验证场景 | 预期 |
|------|------|:--:|:--:|
| 孤立代码（有代码无需求） | 扫描 `src/` 中 dsh 命名的白名单外文件 | V11 | 0 项 |
| 需求缺失（有需求无代码） | plan §5 的 21 项文件影响逐项存在性核对 | V17 / V19 | 0 项缺失 |
| 规格漂移（spec/plan 被修改） | `git status` 核对 spec.md/plan.md/tasks.md 未被 build 改动 | V12 | 0 项 |
| 核心域概念渗透 | 核心域 `dsh\|rank\|\.dsh/skills` 关键字扫描 | V11 | 0 命中（R-DSH-02） |
| 双平台表述漂移 | 生成物含源模板正文（单一来源）+ 入口清单一致 | V16 / V14 | 0 项 |
| 时效漂移 | `2026-08-14` 快照标注跨文档一致 | V18 | 0 项 |

---

## 9. 验证脚本规划（ADR-003）

> validate 阶段自主编写并直接执行验证脚本（不走 task→build 流程）。脚本产出路径约定：`/tmp/sddu-validate-specs-tree-dsh-adaptation-<timestamp>/`。脚本清单、退出码与关键输出将在 **validate-report.md §4「验证脚本执行记录」**逐项登记。

| 脚本（规划） | 用途 | 对应场景 | 关键断言 |
|------|------|:--:|------|
| `verify-build.sh` | 构建/生成/打包全链 | V6 / V7 / V13 | 退出码 0；11 个 SKILL；dist 同级并列；zip 零 dsh |
| `verify-manifest.cjs` | 版本锚定与数据契约 | V8 / V14 / V19 | 字段等式 + sha256 一致性 |
| `run-static-assertions.sh` | 静态断言 + 类型检查 | V9 / V10 | jest 全绿 + `tsc` 0 |
| `scan-isolation.sh` | 核心域零泄漏 + 单向依赖 + 白名单 + 纯追加 | V11 / V12 / V16 | 命中 0；白名单零改动；删除行 0 |
| `check-protocol-blocks.sh` | 协议块与禁用语 | V15 | 4 块齐备 + 禁用语口径 |
| `check-docs-consistency.sh` | 文档完整性与跨文档引用 | V17 / V18 | 六份齐备 + 引用一致 |
| `verify-installer.sh` | 安装/卸载脚本静态 + 临时目录功能 | V20 | `bash -n` 0；落位 11；残留 0 |
| `run-regression.sh` | 既有链路回归 | V21 | `test:core` + `test:opencode` 全绿 |
| `verify-error-paths.cjs` | 非法 phase / 构建失败路径 | V22 | 非零退出 / 抛错 |

> 层 B（V1~V5）**不编写脚本**（无 CLI，无法自动化断言，EC-006）；以 `docs/dsh/verification.md` 的用户执行手册 + 本文件 §3.1 为交付。

---

## 10. 产物关联与后续

### 10.1 双文件关系（ADR-004）

| 文件 | 性质 | 时机 | 状态 |
|------|------|------|:--:|
| `validate.md`（本文件） | 验证策略（V1~V22 场景 + 判据口径 + 脚本规划） | plan 完成后、build 前 | ✅ 已产出，**待用户确认场景清单** |
| `validate-report.md` | 验证报告（逐项实测 + 脚本执行记录 + 阻塞/偏差 + 结论，支持多轮 R1/R2…） | build 完成 + review-report.md 状态 passed 后触发 | ⏳ 未产出 |

> **策略确认**：按 §8.2，`validate.md` 产出后需等待用户确认 V1~V22 清单无误，方进入报告阶段。若后续调整清单，请更新本文件并 bump 版本；报告文档在清单不变的前提下可多轮迭代。

### 10.2 产物注册提醒（§8.2）

本策略阶段**不推进 state.json 的 `phase`**（策略设计不属于主流水线推进），也不由 Agent 直接改写 `state.json`。
当前 `state.json.files` 尚未包含 `validate` / `validationReport` 字段。**建议由状态机或用户手动补登**：
- `files.validate = "validate.md"`（本文件产出后）
- `files.validationReport = "validate-report.md"`（报告产出后）

### 10.3 结论判定口径（报告阶段适用）

| 条件 | 结论 |
|------|:--:|
| 全部层 A 场景（V6~V22）通过 且 阻塞 = 0 且 严重漂移 = 0 且 层 B（V1~V5）已作为用户手册交付（实机未观测如实标注） | ✅ 通过 |
| 阻塞 = 0，但存在非阻塞偏差（如文档措辞、覆盖率略低、非关键断言薄弱） | ⚠️ 有条件通过 |
| 构建失败 / 核心域 dsh 概念泄漏 / 隔离规则被违反 / 某 FR 未实现 / 分发布局破坏 / 出现肯定式「硬强制」声称 | ❌ 不通过 |

### 10.4 下一步

1. **用户确认** V1~V22 验证场景清单（重点核对：层 A/层 B 划分、V1~V5 与 spec 附录一致性、判据充分性）。
2. 运行 `@sddu-build` 完成 tasks.md 全部 14 个任务（当前 `phase=tasked`）。
3. build 完成后触发 `@sddu-review specs-tree-dsh-adaptation` → 产出 `review-report.md`（状态需 passed）。
4. review 通过后触发 `@sddu-validate specs-tree-dsh-adaptation`（**报告执行阶段**）→ 执行 V6~V22 本地自动化场景、编写验证脚本、产出 `validate-report.md`（R1）；V1~V5 交付为用户执行手册并记为「待用户配合（未观测）」。

---

## 11. 修订记录

| 版本 | 变更说明 | 日期 | 修订人 |
|------|---------|------|--------|
| v1.0 | 初始创建 — validate 策略文档；自主定义 22 个验证场景（V1~V5 用户配合人工观测，严格对齐 spec 附录；V6~V22 本地自动化），判定 Feature 为「代码 + 配置/文档混合型」，声明五维度适配性（§5.1/§5.2/§5.3/§5.5 全覆盖、§5.4 性能不适用/边界适用）、FR/NFR/EC 覆盖映射、数据契约口径、验证脚本规划与结论判定规则；遵循既定约束（NG-002 端到端不在范围、无 CLI、2026-08-14 快照时效） | 2026-09-27 | SDDU Validate Agent |
