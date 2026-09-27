# 审查报告：DSH 适配

> **文档定位**: SDDU 审查策略 — 定义本 Feature 的 C1~C48 自主审查清单、审查方法学与覆盖矩阵，指导 review Agent 在 build 完成后执行逐项审查；**审查执行结果见 review-report.md**（本文件不含执行结论）  
> **前置依赖**: spec.md（需求规范 v1.0，10 FR / 7 NFR / 9 EC / V1~V5）、plan.md（技术方案 v1.0，方案 C + ADR-001~006 + R-DSH-01~06 + 文件影响 21 项）、tasks.md / tasks.json（14 任务 / 4 波次）、build.md（构建产物，**本策略阶段尚不产出**）  
> **创建人**: SDDU Review Agent  
> **创建时间**: 2026-09-27  
> **版本**: v1.0  
> **更新人**: SDDU Review Agent  
> **更新时间**: 2026-09-27  
> **更新说明**: 初始创建 — 依据 spec §5/§6/§7、plan §2.6/§5/§7、ADR-001~006 与 tasks 文件影响映射，自主定义 48 项审查清单（C1~C48，覆盖 10 FR / 7 NFR / 9 EC / 6 ADR / 6 隔离规则 / 4 结构化协议块 / 5 组测试断言 / 3 类文档），并声明审查方法学、严重级别口径与覆盖矩阵

> **阶段说明（重要）**：本文件是 **review 产物拆分的步骤 1「策略文档」**（ADR-004）。此时 `phase=tasked`、build 尚未执行，因此：
> - 本文件只定义「审什么、怎么审、判据是什么」，**不产出任何通过/改进/阻塞判定**；
> - 审查对象为 **未来 build 产物**，路径以 `plan.md §5` 文件影响分析与 `tasks.md §2` 验收标准为准；
> - 逐项结果、维度汇总、阻塞问题、结论由 **review-report.md**（每轮 R1/R2… 独立产出）承载。

---

## 1. 审查概要

> 本节量化「审查范围」，而非「审查结果」。结果量化见 review-report.md §1。

| 维度 | 数值 |
|------|:--:|
| 审查项总数（Cx） | **48** |
| 覆盖 FR | 10 / 10（每 FR ≥ 1 条） |
| 覆盖 NFR | 7 / 7 |
| 覆盖 EC | 9 / 9 |
| 覆盖 ADR | 6 / 6（ADR-001~006 逐条） |
| 覆盖隔离规则 | 6 / 6（R-DSH-01~06） |
| 覆盖结构化协议块 | 4 / 4（GATE-DENY / GATE-ALLOW / ROUTE-REJECT / STATE-SYNC） |
| 覆盖文件影响 | 21 / 21（17 NEW + 4 MODIFY + 0 DELETE） |
| 规范符合率目标 | 100% |
| 阻塞问题上限 | 0 |
| 改进项上限 | < 5 |

**审查对象范围**（以 plan §5 为准）：

| 类别 | 路径 |
|------|------|
| 适配层源码 | `src/adapters/dsh/index.ts`、`contract.ts`、`contract/dsh-contract-manifest.json` |
| 注入式资产 | `src/adapters/dsh/templates/skill-header.md.hbs`、`gate-protocol.md.hbs`、`state-sync-protocol.md.hbs`、`router-command-map.json` |
| 构建/安装脚本 | `scripts/build-dsh-skills.cjs`、`scripts/install-dsh.sh`、`scripts/uninstall-dsh.sh` |
| 修改面（4 项） | `package.json`、`scripts/package.cjs`、`jest.config.ts`、`README.md` |
| 测试 | `src/__tests__/unit/adapters/dsh/skill-package.test.ts` |
| 文档集 | `docs/dsh/README.md`、`verification.md`、`positioning.md`、`upgrade-following.md`、`contract-dependencies.md`（构建生成）、`dual-platform-diff.md` |
| 生成物（gitignored，静态只读核对） | `dist/dsh/skills/sddu-*/SKILL.md`（11）、`dist/dsh/manifest.json`、`dist/dsh/docs/*` |

---

## 2. 自主审查清单（C1~C48）

**审查对象来源**：
- `spec.md`：FR-001~010 / NFR-001~007 / EC-001~009 → 逐项核验实现完整性与正确性
- `plan.md`：§2.6 隔离规则 R-DSH-01~06、§2.7 FR→实现路径、§5 文件影响 21 项、§7 ADR-001~006 → 架构遵循性
- `tasks.md` / `tasks.json`：14 任务验收标准 → 可执行判据来源
- `src/` + `scripts/` + `docs/` + `dist/`：实际产物 → 代码质量、断言有效性

**四维度指引**（规范符合性下细分 FR/NFR/EC 三组；另设 3 个补充标注维度）：
1. **代码质量** — 可读性、职责单一性、错误处理、编码规范（C1~C5）
2. **规范符合性** — 对照 spec.md 逐 FR/NFR/EC 核验（C6~C27）
3. **架构一致性** — 对照 plan.md ADR、隔离规则与文件影响（C28~C36）
4. **测试质量** — 覆盖率、边界条件、错误场景、断言有效性（C41~C45）

**补充标注维度**（映射进上述四维度，用于逐条聚焦）：`隔离规则`（C36）、`协议块实现`（C37~C40）、`文档交付`（C46~C48）。

**方法与类型图例**：
- 【读】逐行阅读与语义对照（静态分析，本 Agent 主责）
- 【grep】关键字/字段/结构检索与存在性断言（静态）
- 【diff】`git diff` / `git status` 变更面与删除行核对（静态）
- 【可执行·可选】`tsc` / `node` / `bash -n` / `jest` / `package.cjs` 等本地命令；**报告阶段可选复算，属 validate 主责**，本策略仅登记命令作为可核对判据
- 严重级别：🔴 阻塞 / 🟠 高 / 🟡 中 / 🔵 低（定义见 §4）

### 2.1 组 A — 代码质量（C1~C5，维度：代码质量）

| # | 审查点（审查对象） | 审查基准（映射） | 方法 / 命令 | 通过判据 | 严重级别 |
|---|---------|---------|---------|---------|:--:|
| C1 | 适配层 TS 代码质量：`contract.ts`（类型 / load / validate / computeHash）与 `index.ts`（常量与 re-export） | TASK-001/007 AC；FR-007 / NFR-001 / FR-009②；ADR-005 决策 1 | 【读】两文件；【grep】`grep -rn "adapters/opencode" src/adapters/dsh/`；【可执行·可选】`npx tsc --noEmit` | ① 函数职责单一、命名清晰；② 类型完备，无失控 `any`；③ phase 枚举不一致时 `validateContractManifest` 抛错；④ `100`/`400`/`2026-08-14`/`sddu-` 常量单点定义、无多处硬编码；⑤ 无 `adapters/opencode` import；⑥ tsc 通过 | 🟠 高 |
| C2 | 构建脚本质量：`scripts/build-dsh-skills.cjs` | TASK-008 AC；FR-003 / NFR-002；ADR-005 决策 2 | 【读】脚本；【grep】硬编码 Skill 清单 / 对 `src/templates/agents` 的写操作；【可执行·可选】`node scripts/build-dsh-skills.cjs` 连跑两次比对 | ① 清单取自 `router-command-map.json`（不硬编码）；② 缺失模板 / 非法 `phaseTarget` → 非零退出 + 可定位错误；③ 对 `src/templates/agents/**` **零写操作**；④ 幂等（除 `generatedAt`）；⑤ 无重复渲染/近似逻辑 | 🟠 高 |
| C3 | Shell 脚本质量：`scripts/install-dsh.sh` / `uninstall-dsh.sh` | TASK-006 AC；FR-008 / NFR-006 | 【读】两脚本；【grep】`dsh ` 子命令；【可执行·可选】`bash -n` + `--help` | ① `set -euo pipefail`；② 路径变量加引号、`sddu-*` 精确匹配无通配误删；③ `--help` 退出码 0 且无落位副作用；④ 无 dsh CLI 调用；⑤ install 重复执行幂等 | 🟡 中 |
| C4 | 追加式配置改动质量：`package.json` / `scripts/package.cjs` / `jest.config.ts` / `README.md` | plan §5；R-DSH-04 | 【diff】`git diff --numstat -- package.json scripts/package.cjs jest.config.ts README.md` | ① 删除行数 = 0（纯追加）；② 无重复键 / 重复映射；③ 既有 `build` 管道、`itemsToKeep` 原项、`@opencode` 映射不变；④ `files` 新增不覆盖既有条目 | 🔴 阻塞 |
| C5 | 声明式资产质量：`skill-header.md.hbs` / `gate-protocol.md.hbs` / `state-sync-protocol.md.hbs` / `router-command-map.json` | TASK-002~005 AC；R-DSH-05；NFR-002① | 【读】4 资产；【grep】占位符数量、阶段正文特征串、JSON 结构 | ① `skill-header` 仅 frontmatter + 来源标识 + 命名/落位声明，**不含任何阶段职责正文**；② 占位符 ≥ 4；③ `router-command-map.json` 合法且 `skills`=11、`entries`=11、`phaseAliases` 目标 ⊆ `VALID_PHASES`、`sourceTemplate` 文件真实存在；④ 三个协议片段字段完备 | 🟠 高 |

### 2.2 组 B — 规范符合性 · FR（C6~C15，维度：规范符合性；每 FR 至少 1 条）

| # | 审查点（审查对象） | 审查基准（映射） | 方法 / 命令 | 通过判据 | 严重级别 |
|---|---------|---------|---------|---------|:--:|
| C6 | Skill 包装配与落位 | **FR-001** / ADR-001 / EC-002 / EC-007 | 【读】`skill-header.md.hbs`、`router-command-map.json`、`docs/dsh/README.md`；【grep】`sddu-`、`metadata.sddu-source`、`rank 100`/`rank 400` | ① 命名 `sddu-` 前缀 + 来源标识 `metadata.sddu-source`/`sddu-contract-snapshot`；② rank 100 主落位 / rank 400 用户级常量一致；③ 三层目录 ↔ 六级 rank 落位推演成文（覆盖 200/300/500/600 取舍）；④ 遮蔽裁决约定成文、无静默遮蔽 | 🔴 阻塞 |
| C7 | 命令入口与阶段路由 | **FR-002** / ADR-002 / R-009 | 【读】路由 Skill 生成物 `dist/dsh/skills/sddu/SKILL.md`、`router-command-map.json`、README 入口清单；【grep】`SDDU-ROUTE-REJECT` | ① `/sddu` + 7 阶段 + roadmap/docs/fast = 11 条入口清单成文；② 非法阶段输入 `[SDDU-ROUTE-REJECT]` 且「不进入任何阶段、不写任何文件」；③ 入口清单 ↔ `router-command-map.json` 一致；④ 平台级命令注册缺口如实标注 | 🔴 阻塞 |
| C8 | 单阶段流程承载与产物落盘 | **FR-003** / EC-008；ADR-005 决策 2 | 【读】`build-dsh-skills.cjs`、阶段 `SKILL.md`；【grep】源模板正文特征串 | ① 11 个 `SKILL.md` 正文来自 `src/templates/agents/sddu-*.md.hbs`（拼接非改写）；② ≥ 2 个阶段 Agent 指令可被加载且行为符合阶段职责；③ 阶段 Skill 要求产出对应产物、格式依据 `src/templates/outputs/*.md.hbs`；④ 落盘失败 → 可观测错误 + **不推进**、非静默通过 | 🔴 阻塞 |
| C9 | 阶段门禁承载的目标与约束 | **FR-004** / EC-003；ADR-003 | 【读】`gate-protocol.md.hbs`、阶段 `SKILL.md`、`docs/dsh/README.md`；【grep】`SDDU-GATE-DENY`/`SDDU-GATE-ALLOW`/`已知降级`/`FR-004b` | ① 非法跃迁（跳步/回退）按拒绝处理，不得「提示后继续」；② 结构化拒绝/放行块字段完整、`action` 取值正确；③ 固定段落如实声明采用 **(b) 显式软引导**、边界清晰；④ 每份阶段 `SKILL.md` 与文档均含降级声明（无遗漏即无静默丢失） | 🔴 阻塞 |
| C10 | 状态推进与 `state.json` 一致性 | **FR-005** / EC-005；ADR-004 | 【读】`state-sync-protocol.md.hbs`、`docs/dsh/verification.md`；【grep】`SDDU-STATE-SYNC`/`phaseHistory`/`唯一权威` | ① `state.json` 为唯一权威、会话日志为观测/对账源且**不写入宿主日志**；② `phaseHistory` 追加条目 5 字段与既有 schema 一致；③ 三方对账（状态 vs 产物 / 状态 vs 记录 / 产物 vs 记录）规则成文；④ 不一致 → 报告并暂停，禁止静默覆盖/自动补齐；⑤ SYNC 记录非强证据的如实声明 | 🔴 阻塞 |
| C11 | 验证方法与验证场景 | **FR-006** / EC-006 / NFR-006；NG-002 | 【读】`docs/dsh/verification.md` | ① V1~V5 逐项含「步骤 / 观测方式 / 通过判据 / 配合方」；② 显式声明「V1~V5 为验证方法**非端到端验收标准**」与端到端验证不在范围；③ 显式声明「无 CLI → 无法自动化断言」缺口；④ 观测依据覆盖 Web UI 会话 + `.sddu/` 产物 + `SessionEvent` 日志 | 🟠 高 |
| C12 | 升级跟随机制 | **FR-007** / EC-001 / NFR-001 / NFR-007；ADR-006 | 【读】`dsh-contract-manifest.json`、`docs/dsh/upgrade-following.md`；【grep】`2026-08-14`/`observableCheck`/`破坏点记录模板` | ① 契约依赖点清单 ≥ 7 类、每条 8 字段（含 `snapshotDate`/`observableCheck`/`breakImpact`/`fixHint`）；② `manifest.json` 版本锚定（`sdduVersion`+`dshContractSnapshot`+`contractManifestHash`）；③ 升级跟随步骤 0~6 + 9 字段破坏点模板 + 成本基线口径；④ `guard-pipeline` 标注 v5.1.0+ 演进点不实现 | 🟠 高 |
| C13 | 安装 / 卸载 / 升级路径 | **FR-008** / EC-002 / EC-004 | 【读】两脚本 + README；【diff】`git status --porcelain -- install.sh install.ps1 src/index.ts` 为空 | ① 安装/卸载/升级三路径成文且可被无 SDDU 背景用户完成；② 卸载无 `sddu-*` 残留（二次扫描）；③ 升级后可重复 V1 装配可见；④ `install.sh` / `install.ps1` / `src/index.ts` 零改动 | 🟠 高 |
| C14 | 适配层隔离边界 | **FR-009** / NFR-004 / NG-001 / NG-004；R-DSH-01~06 | 【读】目录结构 + diff；【grep】核心域 dsh 关键字扫描（见 C36） | ① dsh 专项资产收敛于 `src/adapters/dsh/` + `scripts/*dsh*` + `docs/dsh/`；② 核心域零 dsh 概念、零反向 import；③ 既有 OpenCode 链路行为不变；④ 未提前抽象通用接口（NG-001）；⑤ 隔离边界与最小侵入范围成文 | 🔴 阻塞 |
| C15 | 与 dsh 原生方法论的分工定位 | **FR-010** / EC-009 | 【读】`docs/dsh/positioning.md`、`dual-platform-diff.md` | ① 与 plan mode / todo / workflow / goal / compaction 的分工与共存方式成文；② ≥ 3 个判定示例，分别覆盖「走 SDDU / 走原生 / 共存」；③ 混用时的可观测提示（EC-009）；④ 能力落差不得表述为两平台等价 | 🟡 中 |

### 2.3 组 C — 规范符合性 · NFR（C16~C21，维度：规范符合性）

| # | 审查点（审查对象） | 审查基准（映射） | 方法 / 命令 | 通过判据 | 严重级别 |
|---|---------|---------|---------|---------|:--:|
| C16 | 契约依赖点集中于隔离层（兼容性） | **NFR-001** / R-001 | 【读】`dsh-contract-manifest.json`、`contract.ts`、`docs/dsh/contract-dependencies.md` | ① 7 类依赖点（skill-provider-rank / skill-discovery-cache / command-registration / profile-bundle / dir-convention / session-events / guard-pipeline）全登记；② 每条含快照日期；③ 变更影响面仅落隔离层（核心域无引用）；④ 人读版由 manifest 单一来源生成 | 🟠 高 |
| C17 | 双平台指令/文档零漂移（可维护性） | **NFR-002** / R-006；ADR-005 决策 2 | 【读】生成物 vs 源模板；【grep】`sourceTemplate` 正文特征串；【读】`dual-platform-diff.md` | ① 阶段指令单一来源（生成物含源模板正文特征串，无 `adapters/dsh/` 内复制改写）；② 双平台差异清单含入口/承载/门禁/状态/落位五维；③ 核心文档保持单平台中立表述 | 🟠 高 |
| C18 | 门禁与推进留下可观测证据（可追溯性） | **NFR-003** / ADR-003 / ADR-004 | 【读】协议片段与文档；【grep】四个结构化块 | ① 产物文件 + 会话观测 + 会话日志三份证据链成文；② `[SDDU-GATE-*]` / `[SDDU-STATE-SYNC]` 便于在 `SessionEvent` 中检索；③ 可回溯「谁推进、依据何产物、门禁是否放行」 | 🟠 高 |
| C19 | 最小侵入与既有链路不变（隔离性） | **NFR-004** / FR-009 / R-DSH-02/04 | 【diff】`git status` 白名单；【grep】核心域 dsh 扫描；【可执行·可选】`npm run test:core` + `npm run test:opencode` | ① `install.sh` / `install.ps1` / `src/index.ts` / `src/adapters/opencode/**` / `src/state/**` / `src/templates/agents/**` 零改动；② 现有测试全部通过；③ 核心域无 dsh 专项概念引用 | 🔴 阻塞 |
| C20 | 无 CLI 下的人工可验证性（可用性 + 可验证性） | **NFR-005 + NFR-006** / EC-006 | 【读】`docs/dsh/verification.md` | ① 最小人工验证清单含步骤序列与**时间预算上限**；② 逐条验收标准标注观测方式；③ 不以命令行为必要前置；④ 「未观测」≠「通过」显式声明 | 🟠 高 |
| C21 | dsh 事实时效与快照标注（时效性） | **NFR-007** / R-001 / A-008 | 【读】全量交付文档与清单；【grep】`2026-08-14` | ① 每条 dsh 事实可追溯至 2026-08-14 快照；② 契约刷新失败显式登记为开放问题与风险；③ 无过时快照冒充当前事实的表述（统一「快照态」措辞） | 🟠 高 |

### 2.4 组 D — 规范符合性 · EC（C22~C27，维度：规范符合性；覆盖 EC-001~009）

| # | 审查点（审查对象） | 审查基准（映射） | 方法 / 命令 | 通过判据 | 严重级别 |
|---|---------|---------|---------|---------|:--:|
| C22 | 破坏性升级导致适配失效 | **EC-001** / FR-007 / R-001 | 【读】`upgrade-following.md` 步骤 0、契约清单刷新流程 | ① 步骤 0「刷新契约（失败则如实记录）」存在；② 契约级变更 → 更新清单并 bump `snapshotDate`；③ 必要时登记开放问题 | 🟡 中 |
| C23 | rank 遮蔽 / 命名冲突（显式提示，不静默） | **EC-002 + EC-007** / FR-001 | 【读】`install-dsh.sh` 冲突提示段、README 裁决约定；【grep】`skills/change` | ① 同名/近义 `sddu-*` 冲突显式提示 + 落位建议；② 命名 `sddu-` 前缀 + 来源标识；③ 按 rank / 最近层裁决并记录；④ 无静默遮蔽路径 | 🟠 高 |
| C24 | 门禁无法硬承载 | **EC-003** / FR-004 / ADR-003 | 【读】文档与生成物；【grep】禁用语 | ① 如实声明为「已知降级」；② 禁止声称硬强制；③ 「硬强制」仅出现在「非硬强制」否定语境，无「强制执行」/「运行时硬拒绝」肯定表述 | 🔴 阻塞 |
| C25 | 未被注册表发现 + 无 CLI 自动化缺口 | **EC-004 + EC-006** / FR-006 / FR-008 | 【读】`install-dsh.sh` 自检段、`verification.md` | ① 落位自检清单（目录层级/scope 链/`skills/change` 失效重新快照）；② 不得静默失败；③ 自动化缺口显式声明，不将未观测等同通过 | 🟠 高 |
| C26 | `state.json` 与会话/产物不一致 | **EC-005** / FR-005 / ADR-004 | 【读】`state-sync-protocol.md.hbs` 对账规则 | ① 报告不一致并指出权威来源；② 禁止静默覆盖任一侧；③ 必要时暂停推进等待人工确认；④ 禁止自动补齐 | 🔴 阻塞 |
| C27 | 落盘失败不推进 + 原生能力混用 | **EC-008 + EC-009** / FR-003 / FR-010 | 【读】`gate-protocol.md.hbs`、`positioning.md` | ① 产物落盘失败 → 明确错误 + 回退指引 + **不推进** `state.json`；② 混用 dsh 原生 plan mode → 可观测提示与建议，避免两套矛盾产物 | 🟠 高 |

### 2.5 组 E — 架构一致性（C28~C36，维度：架构一致性；含隔离规则）

| # | 审查点（审查对象） | 审查基准（映射） | 方法 / 命令 | 通过判据 | 严重级别 |
|---|---------|---------|---------|---------|:--:|
| C28 | ADR-001 落位与装配遵循 | ADR-001 | 【读】`install-dsh.sh`、README 推演表、`router-command-map.json` | ① 主落位 rank 100（`<projectRoot>/.dsh/skills`）、用户级 rank 400；② 只用本地文件系统 provider；③ 三层目录 ↔ 六级 rank 映射与 ADR-001 一致；④ 不选 rank 300/600 的理由成文；⑤ 未选 `bundled`（不违反 NG-003） | 🟠 高 |
| C29 | ADR-002 命令入口承载遵循 | ADR-002 | 【读】路由 Skill、`router-command-map.json`、README | ① 以「路由 Skill + 文本前缀识别」承载，不依赖平台命令注册；② 入口清单成文；③ 平台级命令注册需 dsh 插件的**已知缺口**明确登记（不误导期待） | 🟠 高 |
| C30 | ADR-003 门禁承载遵循 | ADR-003 | 【读】`gate-protocol.md.hbs`、契约清单、`upgrade-following.md` | ① 采用 FR-004(b) 显式软引导；② 硬 guard 通道仅登记为版本锚定演进点、**未实现插件**；③ 降级声明可见性要求落到每个 `SKILL.md` 与文档 | 🔴 阻塞 |
| C31 | ADR-004 状态权威遵循 | ADR-004 | 【读】`state-sync-protocol.md.hbs`、`contract.ts` | ① `state.json` 唯一权威、日志为对账源；② 核心状态机语义不变（NG-004）；③ 不新增 append-only 事件日志、不写宿主日志 | 🔴 阻塞 |
| C32 | ADR-005 隔离与单一来源遵循 | ADR-005 | 【读】目录结构、`build-dsh-skills.cjs`、`package.cjs` | ① 资产形态落于 `adapters/dsh`（无运行时平台耦合）；② 指令单一来源（构建期拼接、不复制改写）；③ 隔离规则写入并被测试断言；④ `dist/dsh/` 与 `dist/sddu/` 同级并列、`package.cjs` 追加保留项 | 🔴 阻塞 |
| C33 | ADR-006 升级跟随机制遵循 | ADR-006 | 【读】`dsh-contract-manifest.json`、`manifest.json`、`upgrade-following.md` | ① 契约清单 + 版本锚定 + 人工回归清单三件套齐备；② **未引入任何快照外新 dsh 事实**；③ 快照里程碑（2026-08-14）登记为开放问题 | 🟠 高 |
| C34 | plan §5 文件影响 21 项对齐 | plan §5 / tasks §4.1 | 【diff】`git status --porcelain`；【读】逐项存在性 | ① 17 NEW 全部落地（含构建生成的 `docs/dsh/contract-dependencies.md`）；② 4 MODIFY 为纯追加；③ 0 DELETE；④ 无遗漏、无计划外文件；⑤ 计数核对 = 21 | 🔴 阻塞 |
| C35 | 分发布局与打包隔离 | FR-009① / R-010 / ADR-005 决策 4 | 【读】`package.cjs`；【可执行·可选】`node scripts/package.cjs` + `unzip -l dist/sddu.zip` | ① `dist/dsh/` 与 `dist/sddu/` 同级并列、互不包含；② `dist/sddu.zip` **不含** `dsh/` 条目；③ `install.sh` 只消费 `dist/sddu/`；④ dsh 资产不进入 `.opencode/` | 🔴 阻塞 |
| C36 | 隔离规则 R-DSH-01~06 逐条可断言 | plan §2.6 / ADR-005 决策 3 | 【grep】核心域扫描；【读】`skill-package.test.ts`；【diff】白名单 | ① R-DSH-01 目录收敛；② R-DSH-02 核心域零 import/零概念；③ R-DSH-03 单向依赖且无 `adapters/dsh → adapters/opencode`；④ R-DSH-04 零改动白名单 + 追加式改动；⑤ R-DSH-05 指令单一来源；⑥ R-DSH-06 平台差异仅在 `adapters/` 与 `docs/dsh/` | 🔴 阻塞 |

### 2.6 组 F — 协议块实现（C37~C40，维度：规范符合性 · 补充标注「协议块实现」）

| # | 审查点（审查对象） | 审查基准（映射） | 方法 / 命令 | 通过判据 | 严重级别 |
|---|---------|---------|---------|---------|:--:|
| C37 | `[SDDU-GATE-DENY]` / `[SDDU-GATE-ALLOW]` 块协议 | FR-004 / ADR-003 决策 1；TASK-003 | 【读】`gate-protocol.md.hbs` + 生成物；【grep】字段与 `action` | ① 拒绝块字段 `feature/from/to/missing/reason/action` 完整、`action:"none"`；② 放行块字段 `feature/from/to/prereq/action` 完整、`action:"proceed"`；③ 单行 JSON 便于检索；④ 拒绝语义含「不写 state.json、不产出产物」 | 🔴 阻塞 |
| C38 | `[SDDU-ROUTE-REJECT]` 块协议 | FR-002 / ADR-002；TASK-005 | 【读】路由 Skill 生成物 + `router-command-map.json` | ① 字段 `input/valid/hint` 完整；② 「不进入任何阶段、不写任何文件」约束；③ 合法阶段别名集与 `VALID_PHASES` 一致 | 🔴 阻塞 |
| C39 | `[SDDU-STATE-SYNC]` 块协议 | FR-005 / ADR-004；TASK-004 | 【读】`state-sync-protocol.md.hbs` + 生成物 | ① 字段 `feature/from/to/artifact/phaseHistoryAdded/ts` 完整；② 与 `phaseHistory` 追加条目语义对应；③ 标注为非机器可校验强证据 | 🔴 阻塞 |
| C40 | 结构化块跨生成物一致性与禁用语 | EC-003 / NFR-003；ADR-003 决策 2；TASK-009 断言 3/4 | 【grep】全量 `dist/dsh/**` 扫描四个块与禁用语 | ① 每个阶段 `SKILL.md` 同时含 GATE-DENY / GATE-ALLOW / STATE-SYNC + 「已知降级」段；② 路由 Skill 含 ROUTE-REJECT；③ 全量生成物「硬强制」仅在否定语境、无「强制执行」/「运行时硬拒绝」；④ 字段命名与取值跨文件一致 | 🔴 阻塞 |

### 2.7 组 G — 测试质量（C41~C45，维度：测试质量）

| # | 审查点（审查对象） | 审查基准（映射） | 方法 / 命令 | 通过判据 | 严重级别 |
|---|---------|---------|---------|---------|:--:|
| C41 | 测试存在与落位 | FR-009 / NFR-004；TASK-009；ADR-005 决策 1 | 【读】`skill-package.test.ts`、`jest.config.ts`；【diff】alias 追加 | ① 测试文件存在且落在 `opencode` 项目 `testMatch`（`src/__tests__/unit/adapters/**`）；② `^@dsh/(.*)$` 别名纯追加、与 `@opencode` 对称；③ 三项目结构不变 | 🟠 高 |
| C42 | 8 组断言实装完整性 | TASK-009 AC；FR-001/002/004/005/007/009、NFR-002/004 | 【读】测试；【grep】`\b(it|test)\(` 计数 ≥ 8 | ① 结构/入口清单/协议片段/禁用语/单一来源/版本锚定/核心域隔离/OpenCode 零污染 8 组全覆盖；② 每组断言与 C37~C40、C36 判据可对应 | 🟠 高 |
| C43 | 断言有效性（非弱断言） | 方法论 §5.4 | 【读】断言体 | ① 断言具体文件名/字段/哈希等式（如 `contractManifestHash === sha256`）；② 无 `toBeTruthy` 式空泛断言替代结构校验；③ 失败信息可定位文件与期望 | 🟠 高 |
| C44 | 边界与错误场景覆盖 | TASK-008/009 AC；EC-008 | 【读】测试 `beforeAll` 与用例 | ① 生成物缺失时按需触发构建（幂等）而非跳过；② 非法 phase 枚举的抛错路径；③ 构建失败路径非零退出；④ 缺文档记 warning 不失败的口径 | 🟡 中 |
| C45 | 测试独立性与幂等 | TASK-009 AC；NG-002 | 【读】测试；【可执行·可选】重复运行 | ① 不依赖 dsh CLI、不访问网络；② 不改写 `dist/` 之外文件；③ 可重复运行结果稳定（不冒充实机验证） | 🟡 中 |

### 2.8 组 H — 文档交付（C46~C48，维度：规范符合性 · 补充标注「文档交付」）

| # | 审查点（审查对象） | 审查基准（映射） | 方法 / 命令 | 通过判据 | 严重级别 |
|---|---------|---------|---------|---------|:--:|
| C46 | 文档集完整性 | FR-006/007/008/010、NFR-001②；plan §5 | 【读】`docs/` + `dist/dsh/docs/` | ① 六份文档齐备：README/verification/positioning/upgrade-following/dual-platform-diff/contract-dependencies；② `contract-dependencies.md` 由构建从 manifest 单一来源渲染，**无手工第二份**；③ README 追加节存在 | 🟠 高 |
| C47 | 文档 ↔ 单一来源一致性 | NFR-002 / ADR-001 / ADR-002 | 【读】交叉核对 | ① README 入口清单与 `router-command-map.json` 11 条一致；② README 落位推演与 ADR-001 一致；③ `verification.md` V1~V5 与 spec 附录一致（含 V3 三方对账、V4 双判据）；④ `contract-dependencies.md` 条目与 manifest 一一对应 | 🟠 高 |
| C48 | 时效与定位声明跨文档一致 | NFR-007 / FR-004b / FR-009① | 【grep】`2026-08-14` / `FR-004b` / `快照` | ① 全部含 dsh 事实的文档标注 2026-08-14 快照态；② 统一如实标注「已知降级 FR-004b、非硬强制」；③ 统一说明 `dist/dsh` 与 `dist/sddu` 同级并列 | 🟡 中 |

> **质量门槛（数量基线法）**：每个 FR ≥ 1 个 Cx（C6~C15 一一对应）✅；每个审查维度 ≥ 1 条（代码质量 C1~C5 / 规范符合 C6~C27 / 架构一致 C28~C36 / 测试质量 C41~C45）✅；Cx 总数 48 ≥ max(10 FR, 4 维度) ✅。清单合格。

---

## 3. 覆盖矩阵与维度分布

### 3.1 需求覆盖矩阵（FR / NFR / EC / ADR / R-DSH → Cx）

| 需求 | 覆盖 Cx |
|------|---------|
| FR-001 | C6, C23, C28, C42 |
| FR-002 | C7, C29, C38, C42 |
| FR-003 | C2, C8, C27, C34 |
| FR-004 | C9, C24, C30, C37, C40 |
| FR-005 | C10, C26, C31, C39 |
| FR-006 | C11, C20, C25, C46 |
| FR-007 | C1, C12, C22, C33, C46 |
| FR-008 | C3, C13, C25, C46 |
| FR-009 | C4, C14, C19, C32, C34, C35, C36, C41 |
| FR-010 | C15, C27, C47 |
| NFR-001 | C1, C12, C16, C33, C46 |
| NFR-002 | C2, C5, C17, C42, C47 |
| NFR-003 | C18, C39, C40 |
| NFR-004 | C14, C19, C32, C36, C41, C42 |
| NFR-005 / NFR-006 | C3, C11, C20 |
| NFR-007 | C12, C16, C21, C33, C48 |
| EC-001 | C22 |
| EC-002 | C6, C13, C23 |
| EC-003 | C9, C24, C30 |
| EC-004 | C13, C23, C25 |
| EC-005 | C10, C26 |
| EC-006 | C11, C20, C25 |
| EC-007 | C6, C23 |
| EC-008 | C8, C27, C44 |
| EC-009 | C15, C27 |
| ADR-001 | C28 |
| ADR-002 | C29, C38, C47 |
| ADR-003 | C9, C24, C30, C37, C40 |
| ADR-004 | C10, C26, C31, C39 |
| ADR-005 | C1, C2, C17, C32, C41 |
| ADR-006 | C12, C33 |
| R-DSH-01 | C14, C36 |
| R-DSH-02 | C19, C36 |
| R-DSH-03 | C1, C36 |
| R-DSH-04 | C4, C13, C19, C36 |
| R-DSH-05 | C5, C17, C36 |
| R-DSH-06 | C17, C36, C48 |
| V1~V5 | C11, C20, C47（方法文档与场景清单）；**实机执行 = 用户配合（NG-002，超本 Feature 范围）** |

### 3.2 维度分布

| 审查维度 | Cx 数量 | Cx 编号 |
|---------|:--:|------|
| 代码质量（canonical ①） | 5 | C1~C5 |
| 规范符合性（canonical ②） | 22 | C6~C27 |
| 架构一致性（canonical ③） | 9 | C28~C36 |
| 测试质量（canonical ④） | 5 | C41~C45 |
| 补充：协议块实现 | 4 | C37~C40 |
| 补充：文档交付 | 3 | C46~C48 |

> 补充维度在语义上分别归入「规范符合性」（协议块、文档）与「架构一致性」（隔离规则 C36），不新增 canonical 维度，确保与 review-report.md §3 的四维度汇总表兼容。

### 3.3 严重级别分布（预期口径）

| 级别 | 数量 | 说明 |
|------|:--:|------|
| 🔴 阻塞 | 20 | 任一失败即结论「❌ 不通过」，须回到 build 修复 |
| 🟠 高 | 22 | 非阻塞，但须在 validate 前修复或显式记录 |
| 🟡 中 | 6 | 改进项，纳入 review-report 改进建议 |
| 🔵 低 | 0 | 本清单未设低级别项；报告阶段发现纯措辞/可读性问题时按 🔵 补充 |
| **合计** | **48** | —— |

---

## 4. 审查方法学与判据口径

### 4.1 审查方式定位

本 Agent 执行 **静态分析**：阅读代码/文档/生成物、对照 spec+plan+tasks 逐项评估。**不跑 dsh 实机、不做端到端验证**（NG-002；实机 V1~V5 由用户配合人工执行）。本地可执行命令（`tsc` / `node` / `bash -n` / `jest` / `package.cjs` / `unzip`）仅作为**可核对的判据登记**，在报告阶段按需复算，其最终断言责任归 validate 阶段。

### 4.2 严重级别定义与处置

| 级别 | 定义 | 处置 |
|:--:|------|------|
| 🔴 阻塞 | 核心 FR 未实现 / 隔离规则被违反 / 核心域泄漏 dsh 概念 / 分发布局破坏 / 既有 OpenCode 链路回归 / 静默丢失门禁语义 / 虚假硬强制声称 / 纯追加改动引入删除 | 结论「❌ 不通过」，列出修复建议，回到 `@sddu-build` |
| 🟠 高 | NFR 未达成 / 结构化协议块字段缺失 / 文档缺必需章节 / 断言未实装 | 可「⚠️ 有条件通过」，须在 validate 前修复 |
| 🟡 中 | 代码质量、命名、一致性、断言强度不足 | 记入改进建议 |
| 🔵 低 | 措辞、重复、可读性 | 记入改进建议 |

### 4.3 结论判定

| 条件 | 结论 |
|------|:--:|
| 阻塞 = 0 且 改进 < 5 且 规范符合率 100% | ✅ 通过 |
| 阻塞 = 0 且（改进 ≥ 5 或 规范符合率 < 100%） | ⚠️ 有条件通过 |
| 阻塞 ≥ 1 | ❌ 不通过 |

### 4.4 建议审查执行顺序（报告阶段）

1. **静态骨架核对**：C34（文件影响 21 项）→ C35（dist 布局）→ C36（隔离规则扫描）——先确认产物完整性与隔离底线，避免在缺件基础上逐项评审。
2. **规范符合性逐项**：C6~C27（FR→NFR→EC）。
3. **协议块深读**：C37~C40 + C1~C5（代码质量）。
4. **测试与文档**：C41~C45 + C46~C48。
5. **汇总**：按 §3.2 输出维度汇总表，按 §4.3 给出结论，写入 review-report.md。

---

## 5. 审查详情

> **待 review-report.md 产出**。本策略阶段不产出任何逐项评估结果。
> 报告阶段按 §3.2 维度分布输出「代码质量 / 规范符合性 / 架构一致性 / 测试质量」四张详情表（对应模板 §3.1~§3.4）。

## 6. 改进建议

> **待 review-report.md 产出**。预期承载 🟡 / 🔵 级发现（< 5 项方可判「通过」）。

## 7. 阻塞问题

> **待 review-report.md 产出**。任一 🔴 级失败均在此逐条列明（位置 / 问题 / 对应 Cx / 修复建议）。

## 8. 结论

> **待 review-report.md 产出**。结论类型：✅ 通过 / ⚠️ 有条件通过 / ❌ 不通过。

---

## 9. 产物关联与后续

### 9.1 双文件关系（ADR-004）

| 文件 | 性质 | 时机 | 状态 |
|------|------|------|:--:|
| `review.md`（本文件） | 审查策略（C1~C48 清单 + 方法学 + 覆盖矩阵） | plan 完成后、build 前 | ✅ 已产出，**待用户确认清单** |
| `review-report.md` | 审查报告（逐项结果 + 维度汇总 + 阻塞/改进 + 结论，支持多轮 R1/R2…） | build 完成后触发 | ⏳ 未产出 |

> **策略确认**：按 §8.2，`review.md` 产出后需等待用户确认 C1~C48 清单无误，方进入报告阶段。若后续调整清单，请更新本文件并 bump 版本；报告文档在清单不变的前提下可多轮迭代。

### 9.2 产物注册提醒

本策略阶段**不推进 state.json 的 `phase`**（策略设计不属于 8 阶段主流水线推进），也不由 Agent 直接改写 `state.json`。
当前 `state.json.files` 尚未包含 `review` / `reviewReport` 字段。**建议由状态机或用户手动补登**：
- `files.review = "review.md"`（本文件产出后）
- `files.reviewReport = "review-report.md"`（报告产出后）

### 9.3 下一步

1. 用户确认 C1~C48 审查清单（重点核对：严重级别分布、47/48 项是否存在遗漏或过度）。
2. 运行 `@sddu-build` 完成 tasks.md 全部 14 个任务（当前 `phase=tasked`）。
3. build 完成后触发 `@sddu-review specs-tree-dsh-adaptation`（报告执行阶段）→ 产出 `review-report.md`（R1）。
4. 报告通过后运行 `@sddu-validate specs-tree-dsh-adaptation` 动手验证。

---

## 修订记录

| 版本 | 变更说明 | 日期 | 修订人 |
|------|---------|------|--------|
| v1.0 | 初始创建 — review 策略文档；自主定义 C1~C48 审查清单（代码质量 5 / 规范符合 22 / 架构一致 9 / 测试质量 5 + 补充协议块 4 + 文档 3），覆盖 10 FR / 7 NFR / 9 EC / 6 ADR / 6 隔离规则 / 4 协议块 / 21 文件影响；声明严重级别口径、结论判定与审查执行顺序 | 2026-09-27 | SDDU Review Agent |
