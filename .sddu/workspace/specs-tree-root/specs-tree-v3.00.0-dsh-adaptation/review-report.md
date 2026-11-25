# 审查报告：specs-tree-dsh-adaptation

> **文档定位**: SDDU 审查报告 — 逐项记录自主审查的执行结果，作为 validate 阶段的输入  
> **审查策略**: review.md（C1~C48 审查清单 + 四维度指引，v1.0，已冻结）  
> **前置依赖**: review.md（审查策略）、spec.md（需求规范 v1.0）、plan.md（技术方案 v1.0）+ ADR-001~006、build.md（构建产物 v1.0）  
> **审查对象**: commit `1300ee7`（26 文件：17 NEW 源产物 + 4 MODIFY + 5 过程产物），分支 `feature/dsh-adaptation`  
> **创建人**: SDDU Review Agent  
> **创建时间**: 2026-09-27  
> **审查轮次**: R1  
> **版本**: v1.0  
> **更新人**: SDDU Review Agent  
> **更新时间**: 2026-09-27  
> **更新说明**: 初始创建 — 按 review.md 的 C1~C48 清单对 build 产物执行静态审查 + 本地可执行复核（tsc / node / bash -n / jest / package.cjs）；核对附录 A 的 A1~A10 偏差处置合规性

> **审查方式声明**：本报告以**静态分析**为主（阅读代码 / 模板 / 文档 / 生成物，对照 spec+plan+tasks），并辅以**本地可执行复核**（`tsc --noEmit` / `node build-dsh-skills.cjs` / `bash -n` / `jest` / `node package.cjs`）。**未执行任何 dsh 实机操作**；dsh 实机 V1~V5 属未观测项（NG-002，待用户配合），不计入本次审查失败。

---

## 1. 审查概要
> 审查结果的量化总览

| 维度 | 数值 |
|------|:--:|
| 审查项总数 | 48 |
| 通过 | 45 |
| 警告 | 3 |
| 失败 | 0 |
| 阻塞问题 | 0 |

**结论预览**：**⚠️ 有条件通过** —— 0 阻塞项；3 项 🟡 级改进（均非阻塞）；10 FR / 7 NFR / 9 EC 全部实现且经静态+可执行复核确认；21 项文件影响全部落地、4 项 MODIFY 为纯追加（删除行 = 0）。

---

## 2. 逐项审查结果（C1~C48）
> 对照 review.md 中定义的审查清单，逐项评估并记录发现

| # | 审查对象 | 审查基准 | 评估 | 发现 | 严重程度 |
|---|---------|---------|:--:|------|:--:|
| C1 | `contract.ts` / `index.ts` | TASK-001/007 AC；FR-007 / NFR-001 / FR-009②；ADR-005 决策 1 | ✅ | 函数职责单一、命名清晰；类型完备（`DshContractManifest`/`DshContractError`），无失控 `any`；`validateContractManifest` 在 phase 枚举不一致时抛错；常量（rank 100/400、`2026-08-14`、`sddu-`）单点定义于 `index.ts`；无 `adapters/opencode` import；`tsc --noEmit` 退出码 0 | 🟠 高 |
| C2 | `scripts/build-dsh-skills.cjs` | TASK-008 AC；FR-003 / NFR-002；ADR-005 决策 2 | ✅ | 11 Skill 清单取自 `router-command-map.json`（未硬编码）；缺失模板/非法 `phaseTarget` → `fail()` 非零退出 + 可定位错误；对 `src/templates/agents/**` 零写操作（fingerprint 断言 + `git status` 复核为空）；连跑两次 skills 树 sha256 完全一致（幂等，仅 `generatedAt` 变）；无重复渲染逻辑 | 🟠 高 |
| C3 | `install-dsh.sh` / `uninstall-dsh.sh` | TASK-006 AC；FR-008 / NFR-006 | ✅ | `set -euo pipefail`；路径变量全部加引号；按精确名 `sddu` + 前缀 `sddu-*` 匹配、无宽松通配；`--help` 退出码 0 且无落位副作用；无 dsh CLI 调用；install 重复执行为幂等覆盖 | 🟡 中 |
| C4 | `package.json` / `scripts/package.cjs` / `jest.config.ts` / `README.md` | plan §5；R-DSH-04 | ✅ | `git diff --numstat` 四文件删除行合计 = **0**（纯追加：+17/+16/+1/+3）；无重复键/映射；`build` 管道、`itemsToKeep` 原项、`@opencode` 映射不变；`files` 新增 `dist/dsh/**/*` 不覆盖既有条目 | 🔴 阻塞 |
| C5 | `skill-header.md.hbs` / `gate-protocol.md.hbs` / `state-sync-protocol.md.hbs` / `router-command-map.json` | TASK-002~005 AC；R-DSH-05；NFR-002① | ✅ | `skill-header` 仅 frontmatter + 来源标识 + 命名/落位声明（无阶段职责正文）；占位符 5 个（≥4）；`router-command-map.json` 合法：`skills`=11、`entries`=11、`phaseAliases` 目标 100% ⊆ `VALID_PHASES`、`sourceTemplate` 全部真实存在；三协议片段字段完备 | 🟠 高 |
| C6 | Skill 装配与落位 | **FR-001** / ADR-001 / EC-002 / EC-007 | ✅ | 命名 `sddu-` 前缀 + 来源标识 `metadata.sddu-source`/`metadata.sddu-contract-snapshot`；rank 100 主落位 / rank 400 用户级常量在 `index.ts`、`skill-header`、`install-dsh.sh`、README 四处同源表达；三层目录 ↔ 六级 rank 推演成文（含 200/300/500/600 取舍）；遮蔽裁决约定成文、EC-002 显式提示无静默 | 🔴 阻塞 |
| C7 | 命令入口与阶段路由 | **FR-002** / ADR-002 / R-009 | ✅ | `/sddu` + 7 阶段 + roadmap/docs/fast = 11 条入口清单成文（README §6，测试断言与 map 一致）；非法阶段 `[SDDU-ROUTE-REJECT]` 含「不进入任何阶段、不写任何文件」；入口清单 ↔ `router-command-map.json` 一致；平台级命令注册缺口如实标注且无承诺 | 🔴 阻塞 |
| C8 | 单阶段流程承载与产物落盘 | **FR-003** / EC-008；ADR-005 决策 2 | ✅ | 11 个 `SKILL.md` 正文均含源模板正文 heading（拼接非改写，BEGIN/END 边界标记）；阶段 Skill 引用同源产物规范；落盘失败 → 报错 + 不推进 + 非静默（gate-protocol §4 / state-sync §2） | 🔴 阻塞 |
| C9 | 阶段门禁承载的目标与约束 | **FR-004** / EC-003；ADR-003 | ✅ | 非法跃迁（跳步/回退）明确按拒绝处理、禁止「提示后继续」；DENY/ALLOW 块字段完整、`action` 取值正确；固定段落如实声明采用 **(b) 显式软引导**；7 个阶段 `SKILL.md` + README + verification 均含降级声明（无遗漏） | 🔴 阻塞 |
| C10 | 状态推进与 `state.json` 一致性 | **FR-005** / EC-005；ADR-004 | ✅ | `state.json` 唯一权威、`SessionEvent` 为观测/对账源且声明**不写入宿主日志**；`phaseHistory` 追加 5 字段与既有 schema 一致；三方对账（状态vs产物/状态vs记录/产物vs记录）规则成文；不一致 → 报告并暂停、禁止静默覆盖/自动补齐；SYNC 非强证据如实声明 | 🔴 阻塞 |
| C11 | 验证方法与验证场景 | **FR-006** / EC-006 / NFR-006；NG-002 | ✅ | `verification.md` V1~V5 逐项含「步骤/观测方式/通过判据/配合方」；显式声明「V1~V5 为验证方法**非端到端验收标准**」；显式声明「无 CLI → 无法自动化断言」；观测依据覆盖 Web UI 会话 + `.sddu/` 产物 + `SessionEvent` 日志 | 🟠 高 |
| C12 | 升级跟随机制 | **FR-007** / EC-001 / NFR-001 / NFR-007；ADR-006 | ✅ | 契约依赖点 7 类、每条 8 字段（含 `snapshotDate`/`observableCheck`/`breakImpact`/`fixHint`）；`manifest.json` 版本锚定（`sdduVersion`+`dshContractSnapshot`+`contractManifestHash`，哈希 = 清单 sha256）；升级跟随步骤 0~6 + 9 字段破坏点模板 + 成本基线口径；`guard-pipeline` 标注 v5.1.0+ 演进点不实现 | 🟠 高 |
| C13 | 安装/卸载/升级路径 | **FR-008** / EC-002 / EC-004 | ✅ | README §2~§4 三路径成文、命令示例完整；卸载有 provenance 安全闸 + 残留二次扫描（有残留非零退出）；`install.sh`/`install.ps1`/`src/index.ts` 零改动（`git diff` 为空） | 🟠 高 |
| C14 | 适配层隔离边界 | **FR-009** / NFR-004 / NG-001 / NG-004；R-DSH-01~06 | ✅ | dsh 资产收敛于 `src/adapters/dsh/` + `scripts/*dsh*` + `docs/dsh/`；核心域零 dsh 概念、零反向 import（grep 扫描 0 命中）；既有 OpenCode 链路行为不变（test:core/test:opencode 全绿）；未提前抽象通用接口；隔离边界成文 | 🔴 阻塞 |
| C15 | 与 dsh 原生方法论分工定位 | **FR-010** / EC-009 | ✅ | `positioning.md` 覆盖 plan mode/todo/workflow/goal/compaction 分工；4 个判定示例（含走 SDDU/走原生/共存/易混归属）；EC-009 混用可观测提示；`dual-platform-diff.md` 明确「能力落差不得表述为等价」 | 🟡 中 |
| C16 | 契约依赖点集中于隔离层 | **NFR-001** / R-001 | ✅ | 7 类依赖点（skill-provider / skill-discovery-cache / command-registration / profile-bundle / dir-convention / session-events / guard-pipeline）全登记；每条含快照日期；变更影响面仅落隔离层（核心域无引用）；人读版由 manifest 单一来源渲染 | 🟠 高 |
| C17 | 双平台指令/文档零漂移 | **NFR-002** / R-006；ADR-005 决策 2 | ✅ | 阶段指令单一来源（生成物含源模板正文 heading，`adapters/dsh/` 内无指令副本）；`dual-platform-diff.md` 含入口/承载/门禁/状态/落位五维；核心文档保持中立表述 | 🟠 高 |
| C18 | 门禁与推进留下可观测证据 | **NFR-003** / ADR-003 / ADR-004 | ✅ | 产物文件 + 会话观测 + 会话日志三份证据链成文；`[SDDU-GATE-*]`/`[SDDU-STATE-SYNC]` 为单行 JSON、便于 `SessionEvent` 检索；可回溯「谁推进、依据何产物、门禁是否放行」 | 🟠 高 |
| C19 | 最小侵入与既有链路不变 | **NFR-004** / FR-009 / R-DSH-02/04 | ✅ | 白名单文件零改动（`git status --porcelain` 为空）；`test:core` 131 passed、`test:opencode` 32 passed（与 build 基线一致）；核心域无 dsh 专项概念引用 | 🔴 阻塞 |
| C20 | 无 CLI 下的人工可验证性 | **NFR-005 + NFR-006** / EC-006 | ✅ | 最小人工验证清单含步骤序列 + 时间预算上限（≤30min / 升级跟随 ≤2h）；逐条标注观测方式；不以命令行为必要前置；「未观测 ≠ 通过」显式声明 | 🟠 高 |
| C21 | dsh 事实时效与快照标注 | **NFR-007** / R-001 / A-008 | ✅ | manifest 每条依赖点 `snapshotDate=2026-08-14`；README/verification/positioning/upgrade-following/contract-dependencies 均标注 2026-08-14；契约刷新失败登记为开放问题/风险；统一「未刷新即不可信」措辞 | 🟠 高 |
| C22 | 破坏性升级导致适配失效 | **EC-001** / FR-007 / R-001 | ✅ | `upgrade-following.md` 步骤 0「刷新契约（失败则如实记录）」存在；契约级变更 → 更新清单并 bump `snapshotDate`（步骤 5）；必要时登记开放问题 | 🟡 中 |
| C23 | rank 遮蔽 / 命名冲突 | **EC-002 + EC-007** / FR-001 | ✅ | `install-dsh.sh` 扫描同层近义条目与其他 rank 层同名条目并显式提示 + 落位建议；命名 `sddu-` 前缀 + 来源标识；按 rank/最近层裁决并记录；无静默遮蔽路径 | 🟠 高 |
| C24 | 门禁无法硬承载 | **EC-003** / FR-004 / ADR-003 | ✅ | 如实声明为「已知降级」；无硬强制声称；全量生成物扫描：`硬强制` 计数 == `非硬强制` 计数（即仅出现在否定语境），无 `强制执行`/`运行时硬拒绝` | 🔴 阻塞 |
| C25 | 未被注册表发现 + 无 CLI 自动化缺口 | **EC-004 + EC-006** / FR-006 / FR-008 | ✅ | `install-dsh.sh`/`uninstall-dsh.sh` 输出落位自检 + `skills/change` 重新快照提示；不静默失败（来源缺失/数量不符 → 非零退出）；自动化缺口显式声明、不将未观测等同通过 | 🟠 高 |
| C26 | `state.json` 与会话/产物不一致 | **EC-005** / FR-005 / ADR-004 | ✅ | `state-sync-protocol.md.hbs` §3 对账规则完整；报告不一致并指出权威来源；禁止静默覆盖任一侧；必要时暂停推进；禁止自动补齐 | 🔴 阻塞 |
| C27 | 落盘失败不推进 + 原生能力混用 | **EC-008 + EC-009** / FR-003 / FR-010 | ✅ | gate-protocol §4：落盘失败 → 明确错误 + 不推进 `state.json` + 不输出放行块；positioning §4 给出混用可观测提示与建议 | 🟠 高 |
| C28 | ADR-001 落位与装配遵循 | ADR-001 | ✅ | 主落位 rank 100（`<projectRoot>/.dsh/skills`）/ 用户级 rank 400；只用本地文件系统 provider；三层目录 ↔ 六级 rank 映射与 ADR-001 §2 一致；不选 rank 300/600 理由成文；未选 `bundled`（不违反 NG-003） | 🟠 高 |
| C29 | ADR-002 命令入口承载遵循 | ADR-002 | ✅ | 以「路由 Skill + 文本前缀识别」承载，不依赖平台命令注册；入口清单成文；平台级命令注册缺口（需 dsh 插件）明确登记、不误导期待 | 🟠 高 |
| C30 | ADR-003 门禁承载遵循 | ADR-003 | ✅ | 采用 FR-004(b) 显式软引导；硬 guard 通道仅登记为版本锚定演进点、未实现插件；降级声明落到每个阶段 `SKILL.md` 与文档 | 🔴 阻塞 |
| C31 | ADR-004 状态权威遵循 | ADR-004 | ✅ | `state.json` 唯一权威、日志为对账源；核心状态机语义不变（NG-004）；不新增 append-only 事件日志、不写宿主日志 | 🔴 阻塞 |
| C32 | ADR-005 隔离与单一来源遵循 | ADR-005 | ✅ | 资产形态落于 `adapters/dsh`（无运行时平台耦合）；指令单一来源（构建期拼接）；隔离规则写入并被测试断言；`dist/dsh/` 与 `dist/sddu/` 同级并列、`package.cjs` 追加保留项 | 🔴 阻塞 |
| C33 | ADR-006 升级跟随机制遵循 | ADR-006 | ✅ | 契约清单 + 版本锚定 + 人工回归清单三件套齐备；未引入快照外新 dsh 事实；快照里程碑（2026-08-14）登记为开放问题/风险 | 🟠 高 |
| C34 | plan §5 文件影响 21 项对齐 | plan §5 / tasks §4.1 | ✅ | 17 NEW 全部落地（含构建生成的 `docs/dsh/contract-dependencies.md`）；4 MODIFY 纯追加；0 DELETE；无遗漏、无计划外源文件；commit 26 文件 = 17 NEW + 4 MODIFY + 5 过程产物，计数核对 = 21 | 🔴 阻塞 |
| C35 | 分发布局与打包隔离 | FR-009① / R-010 / ADR-005 决策 4 | ✅ | `dist/dsh/` 与 `dist/sddu/` 同级并列；`dist/sddu.zip` 不含 `dsh/`（python3 zipfile 计数 = 0）；`dist/sddu/adapters/` 仅含 `opencode`（dsh 编译产物已移除）；`install.sh` 只消费 `dist/sddu/` | 🔴 阻塞 |
| C36 | 隔离规则 R-DSH-01~06 逐条可断言 | plan §2.6 / ADR-005 决策 3 | ✅ | R-01 目录收敛 ✓；R-02 核心域零 import/零概念（扫描 0 命中）✓；R-03 单向依赖且无 `adapters/dsh → adapters/opencode`（grep 0 命中）✓；R-04 零改动白名单 + 追加式改动 ✓；R-05 指令单一来源 ✓；R-06 平台差异仅在 `adapters/` 与 `docs/dsh/` ✓ | 🔴 阻塞 |
| C37 | `[SDDU-GATE-DENY]` / `[SDDU-GATE-ALLOW]` 块协议 | FR-004 / ADR-003 决策 1；TASK-003 | ✅ | DENY 字段 `feature/from/to/missing/reason/action` 完整且 `action:"none"`；ALLOW 字段 `feature/from/to/prereq/action` 完整且 `action:"proceed"`；单行 JSON；拒绝语义含「不写 state.json、不产出产物」 | 🔴 阻塞 |
| C38 | `[SDDU-ROUTE-REJECT]` 块协议 | FR-002 / ADR-002；TASK-005 | ✅ | 字段 `input/valid/hint` 完整；「不进入任何阶段、不写任何文件」约束在 map 与路由 `SKILL.md` 均在；合法阶段别名集目标 ⊆ `VALID_PHASES` | 🔴 阻塞 |
| C39 | `[SDDU-STATE-SYNC]` 块协议 | FR-005 / ADR-004；TASK-004 | ✅ | 字段 `feature/from/to/artifact/phaseHistoryAdded/ts` 完整；与 `phaseHistory` 追加条目语义对应；明确标注为非机器可校验强证据 | 🔴 阻塞 |
| C40 | 结构化块跨生成物一致性与禁用语 | EC-003 / NFR-003；ADR-003 决策 2；TASK-009 断言 3/4 | ✅ | 7 个阶段 `SKILL.md` 均含 GATE-DENY/GATE-ALLOW/STATE-SYNC + 「已知降级」+「非硬强制」；路由 Skill 含 ROUTE-REJECT；全量生成物「硬强制」仅在否定语境、无禁用语；字段命名跨文件一致 | 🔴 阻塞 |
| C41 | 测试存在与落位 | FR-009 / NFR-004；TASK-009；ADR-005 决策 1 | ✅ | `skill-package.test.ts` 落在 `opencode` 项目 `testMatch`（`src/__tests__/unit/adapters/**`）；`^@dsh/(.*)$` 别名纯追加、与 `@opencode` 对称；三项目结构不变 | 🟠 高 |
| C42 | 8 组断言实装完整性 | TASK-009 AC；FR-001/002/004/005/007/009、NFR-002/004 | ✅ | 8 个 `describe` 组 + 32 个 `it` 用例（jest 实报 32 passed）；结构/入口清单/协议片段/禁用语/单一来源/版本锚定/核心域隔离/OpenCode 零污染 8 组全覆盖，且各组与 C36~C40 判据对应 | 🟠 高 |
| C43 | 断言有效性（非弱断言） | 方法论 §5.4 | ✅ | 断言具体文件名/字段/哈希等式（`manifest.contractManifestHash === computeContractManifestHash(...)`、`/^[0-9a-f]{64}$/`、`toEqual([...SKILL_NAMES].sort())`）；无 `toBeTruthy` 式空泛断言替代结构校验；失败信息以 `{file, ...}` 携带文件定位 | 🟠 高 |
| C44 | 边界与错误场景覆盖 | TASK-008/009 AC；EC-008 | ⚠️ | ① 生成物缺失时 `beforeAll` 按需构建（幂等）✓；**② 未实装「注入非法 phase 枚举 → `validateContractManifest` 抛错」用例**；**③ 未实装「构建失败非零退出」用例**；**④ 未实装「缺文档记 warning 不失败」用例**。②③④ 逻辑均在源码中存在（`contract.ts` 抛错、build 脚本 `fail()`/`warn()`），但测试未覆盖。→ 见 §5 改进建议 1（🟡 中） |
| C45 | 测试独立性与幂等 | TASK-009 AC；NG-002 | ⚠️ | ① 不依赖 dsh CLI、不访问网络 ✓；③ 可重复运行结果稳定、不冒充实机验证 ✓；**② 「不改写 dist/ 之外文件」未严格满足**：`beforeAll` 按需构建会经 `build-dsh-skills.cjs` 写入受版本控制的 `docs/dsh/contract-dependencies.md`（含 `generatedAt` 时间戳），使该文件非字节可复现、每次构建弄脏工作树。→ 见 §5 改进建议 2（🟡 中） |
| C46 | 文档集完整性 | FR-006/007/008/010、NFR-001②；plan §5 | ✅ | 六份文档齐备（README/verification/positioning/upgrade-following/dual-platform-diff/contract-dependencies）；`contract-dependencies.md` 由构建从 manifest 单一来源渲染（无手工第二份）；仓库 `README.md` 追加节存在 | 🟠 高 |
| C47 | 文档 ↔ 单一来源一致性 | NFR-002 / ADR-001 / ADR-002 | ✅ | README 入口清单覆盖 `router-command-map.json` 全部 11 条（脚本复核缺失 = 0）；README §5 落位推演与 ADR-001 §2 一致；`verification.md` V1~V5 与 spec 附录一致（含 V3 三方对账、V4 双判据）；`contract-dependencies.md` 7 条与 manifest 一一对应 | 🟠 高 |
| C48 | 时效与定位声明跨文档一致 | NFR-007 / FR-004b / FR-009① | ⚠️ | ① 5/6 文档显式标注 `2026-08-14`；**`docs/dsh/dual-platform-diff.md` 未显式标注快照日期**（仅泛称「快照」2 处，全文无「2026-08-14」/年份），而其正文含 dsh 事实（rank 100/400、SessionEvent、guard 流水线）。② 全量文档统一标注「已知降级 FR-004b、非硬强制」✓。③ 统一说明 `dist/dsh` 与 `dist/sddu` 同级并列 ✓。→ 见 §5 改进建议 3（🟡 中） |

> **质量门槛复核**：每个 FR ≥ 1 个 Cx（C6~C15 一一对应）✓；每个审查维度 ≥ 1 条 ✓；Cx 总数 48 ≥ max(10 FR, 4 维度) ✓。

---

## 3. 审查维度汇总
> 按四维度统计审查结果（补充维度按 review.md §3.2 归入「规范符合性」与「架构一致性」）

| 审查维度 | 审查项数 | 通过 | 警告 | 失败 | 通过率 |
|---------|:--:|:--:|:--:|:--:|:--:|
| 代码质量（C1~C5） | 5 | 5 | 0 | 0 | 100% |
| 规范符合性（C6~C27 + 协议块 C37~C40 + 文档 C46~C48） | 29 | 28 | 1 | 0 | 96.6% |
| 架构一致性（C28~C36，含隔离规则 C36） | 9 | 9 | 0 | 0 | 100% |
| 测试质量（C41~C45） | 5 | 3 | 2 | 0 | 60% |
| **合计** | **48** | **45** | **3** | **0** | **93.8%** |

**规范符合性偏差**：1 项（C48，`dual-platform-diff.md` 缺显式快照日期）；**测试质量偏差**：2 项（C44 边界/错误用例未实装、C45 按需构建写入 dist 之外受控文件）。

---

## 4. 阻塞问题
> 必须修复后才能进入 validate 阶段的问题

**无阻塞问题（🔴 = 0）**。20 项 🔴 级审查点（C4/C6/C7/C8/C9/C10/C14/C19/C24/C26/C30/C31/C32/C34/C35/C36/C37/C38/C39/C40）全部通过。

---

## 5. 改进建议
> 非阻塞但建议优化的问题

| # | 位置 | 问题 | 对应 Cx | 建议 |
|---|------|------|:--:|------|
| 1 | `src/__tests__/unit/adapters/dsh/skill-package.test.ts` | 边界/错误路径测试未实装：无「注入非法 `phaseEnum` → `validateContractManifest` 抛错」用例、无「构建失败非零退出」用例、无「缺文档记 warning 不失败」用例（逻辑已在 `contract.ts` 与 `build-dsh-skills.cjs` 中存在，仅缺断言） | C44 | 新增 3 个用例：① 构造非法清单对象调用 `validateContractManifest` 断言 `toThrow(DshContractError)`；② 以临时非法 `phaseTarget` / 缺失模板触发构建脚本，断言非零退出；③ 断言缺文档时构建退出码仍为 0 且输出 warning。（可在 validate 阶段或后续回归补充） |
| 2 | `docs/dsh/contract-dependencies.md`（生成物）+ `scripts/build-dsh-skills.cjs` | 该文档受版本控制，但每次构建因 `generatedAt` 变化导致文件字节不固定 → `npm run build`（含 `test:opencode` 的按需构建）会弄脏工作树，降低可复现性 | C45（亦涉 C2） | 二选一：① 从渲染中移除 `generatedAt` 行（仅保留哈希锚定，哈希已足够标识基线）；② 或将 `docs/dsh/contract-dependencies.md` 改为构建产物（gitignore + 安装包内分发）。推荐 ①，改动最小且保留文档即时可用性 |
| 3 | `docs/dsh/dual-platform-diff.md` | 文档含 dsh 事实（rank 表、`SessionEvent`、guard 流水线），但未显式标注 `2026-08-14` 快照日期（其他 5 份文档均已标注），时效可追溯性略有缺口 | C48 | 在文档头部「权威来源」行补注「dsh 事实锚定 **2026-08-14** 快照」，与 `positioning.md` 表述对齐即可 |

> 说明：3 项改进均为 🟡 级（代码质量/一致性/断言强度），**不阻断**进入 validate。按协调器处置原则「🟡 中/低级问题登记不阻断」，本轮**不就地修改**（避免触碰 build 交付物与生成物一致性）。

---

## 6. 结论
> 审查最终结论

**结论**: **⚠️ 有条件通过**

| 指标 | 结果 |
|------|------|
| 审查通过率 | 45 / 48 = 93.8%（含警告口径） |
| 阻塞问题数 | 0 |
| 规范符合性偏差 | 1 项（C48；FR/NFR/EC 条款实现本身 100% 满足） |
| 可进入 validate | **是** |

**理由**：

1. **0 阻塞项** —— 全部 20 项 🔴 级审查点通过：隔离边界零泄漏、分发布局隔离（`dist/sddu.zip` 零 `dsh/` 条目）、4 项 MODIFY 纯追加（删除行 = 0）、门禁/状态/路由四个结构化协议块字段完整且禁用语合规、21 项文件影响全部落地。
2. **规范全实现** —— 10 FR / 7 NFR / 9 EC 全部在代码/模板/脚本/文档中有对应实现，并经静态对照 + 本地可执行复核双重确认（`tsc` 0 错、`npm run build` 0 错且幂等、`test:core` 131 passed、`test:opencode` 32 passed、`package.cjs` 后 `dist/sddu.zip` 零 `dsh/`）。
3. **3 项 🟡 改进（< 5）且不阻断** —— C44（错误路径测试未实装）、C45（生成文件时间戳导致非字节可复现）、C48（`dual-platform-diff.md` 缺显式日期）。三者均为测试完备性/文档一致性层面，不改变设计语义，建议在 validate 阶段或后续回归中补齐。
4. **未观测项如实分列** —— dsh 实机 V1~V5 属 NG-002 范围外，标注「待用户配合验证」，**未**计入通过，未表述为「通过」。
5. **偏差处置合规** —— 附录 A 的 A1~A10 十项偏差处置全部合规（详见附录 A）。

---

## 附录 A. build 偏差（A1~A10）合规性核对
> 对 build.md 附录 A 登记的 10 项偏差逐项核对处置合规性

| # | build 处置 | 审查结论 | 证据 |
|:--:|-----------|:--:|------|
| A1 | `package.json` 未改 `build` 行，改新增 `postbuild` 钩子 | ✅ **合规** | `package.json` 新增 `build:dsh` + `postbuild`（+3/0，删除行 0）；`npm run build` 实测依次执行 `build:agents → build:ts → build:dsh`，退出码 0；TASK-010「删除行 = 0」硬约束得以保持 |
| A2 | `scripts/package.cjs` 除 `itemsToKeep.push('dsh')` 外，追加复制循环 `if (file === 'dsh') continue;` + 移除 `dist/sddu/adapters/dsh/` | ✅ **合规** | `git diff --numstat` 显示 +16/0（纯插入）；`node scripts/package.cjs` 后 `dist/sddu.zip` 的 `dsh/` 条目 = 0（python3 zipfile）；`dist/sddu/adapters/` 仅含 `opencode`（实测泄漏已被阻断）；`dist/dsh` 与 `dist/sddu` 同级并列 |
| A3 | 测试用相对 import；另加一条 `require('@dsh/index')` 用例显式断言别名可用 | ✅ **合规** | `jest.config.ts` 别名纯追加（+1/0）；测试含 `require('@dsh/index')` 断言 `SKILL_PREFIX`/`DEFAULT_RANK`；`tsconfig.json` 不在 4 个 MODIFY 内 → 未改（见 A9） |
| A4 | 额外增加 1 组断言（`docs/dsh/README.md` 入口清单含 map 全部 11 条 `entry`） | ✅ **合规** | 测试组 2 含该用例并通过；脚本独立复核 README 缺失入口 = 0；属于「TASK-011 验收允许由 TASK-009 保证」的合法强化，且不引入测试外的硬依赖问题 |
| A5 | `sddu-*` glob 漂移 → 以 ADR-001 §1 目录树为权威，用 `ls dist/dsh/skills \| wc -l` = 11 | ✅ **合规** | 实测 `dist/dsh/skills` 目录数 = 11（含无连字符的路由 Skill `sddu`）；未为迎合错误 glob 而多造目录，符合「以权威来源为准」原则 |
| A6 | 环境无 `unzip` → 改用 `python3 -m zipfile -l` 等价断言 | ✅ **合规** | `python3 -m zipfile -l dist/sddu.zip \| grep -c 'dsh/'` = 0；`find dist/sddu -path '*dsh*'` = 0 双重确认，结论等价 |
| A7 | jest 将 `--testPathPattern` 更名 `--testPathPatterns` | ✅ **合规（附注）** | 实测 jest 版本为 **30.2.0**（build 报告记为 30.3.0，属轻微记录差异、不影响结论）；`npm run test:opencode` 正常执行、32 passed |
| A8 | 别名集自包含、无编译期等价保障；`_note` 显式登记漂移风险 | ✅ **合规** | `router-command-map.json` 的 `_note` 含「漂移 / legacyStatusToPhase / VALID_PHASES」；测试组 2 断言 `_note` 存在且含上述关键字；属已登记技术债，供 v5.1.0 收敛 |
| A9 | `tsconfig.json` 缺 `@dsh/*` 的 `paths` | ✅ **合规** | `grep '@dsh' tsconfig.json` = 无；补 paths 超出本 Feature 4 MODIFY 约束，登记为技术债合理；`@dsh` 运行时别名已由测试断言可用 |
| A10 | `collectCoverageFrom` 含 `src/adapters/**`；本 Feature 未改覆盖率配置 | ✅ **合规** | `jest.config.ts` opencode 项目 `collectCoverageFrom` 含 `src/adapters/**/*.ts`；`package.json` 的 `test:opencode = jest --config jest.config.ts --selectProjects opencode`（无 `--coverage`），当前不受影响；与 plan 缺口 6 处置一致 |

> **偏差登记完整性**：A1~A10 覆盖「实现层偏差（A1~A4）/ 命令漂移（A5~A7）/ 待观察技术债（A8~A10）」三类，逐项处置均满足对应任务的机器可校验验收，且均未修改 spec/plan/tasks 既有内容。**核对结论：10/10 合规**。

---

## 附录 B. 本地可执行复核证据（判据复算）
> review.md §4.1 登记命令的复算结果（最终断言责任归 validate 阶段）

| 判据 | 命令 | 结果 |
|------|------|------|
| 类型检查 | `npx tsc --noEmit` | 退出码 0（无输出） |
| 全链构建 | `npm run build` | 退出码 0；`build:agents → build:ts → build:dsh` 全过；11 个 `SKILL.md` + manifest + 6 文档 + `contract-dependencies.md` |
| 构建幂等 | `node scripts/build-dsh-skills.cjs` ×2，skills 树 sha256 比对 | 前后哈希一致（`2e6838cc…`）——幂等（除 `generatedAt`） |
| 零写操作 | 构建后 `git status --porcelain -- src/templates/agents` | 空（未触碰源模板） |
| 分发布局 | `ls dist/` | `dsh`、`sddu`、`sddu.zip` 同级并列 |
| 打包隔离 | `node scripts/package.cjs` + `python3 -m zipfile -l dist/sddu.zip \| grep -c 'dsh/'` | 打包后 `dist/dsh` 与 `dist/sddu` 均存在；`dsh/` 条目 = **0**；`dist/sddu/adapters/` 仅 `opencode` |
| 核心测试 | `npm run test:core` | 6 suites / **131 passed**（与改动前基线一致） |
| 适配测试 | `npm run test:opencode` | 1 suite / **32 passed** |
| Shell 语法 | `bash -n scripts/install-dsh.sh && bash -n scripts/uninstall-dsh.sh` | 均通过；`--help` 退出码均 0 |
| 隔离扫描 | `grep -rEl 'dsh\|\.dsh/skills' src --include='*.ts'`（排除 dsh 资产与测试） | 命中 = 0；`\brank\b` 命中 = 0 |
| 禁用语扫描 | `grep '硬强制' vs '非硬强制'` 逐文件计数（`dist/dsh/**` + `contract-dependencies.md`） | 各文件两项计数相等（仅否定语境）；`强制执行`/`运行时硬拒绝` 命中 = 0 |

---

## 修订记录
> 记录本文档的版本变更历史

| 版本 | 变更说明 | 日期 | 修订人 |
|------|---------|------|--------|
| v1.0 | 初始创建（R1）— 按 review.md C1~C48 执行审查：45 通过 / 3 警告 / 0 失败 / 0 阻塞；核对 A1~A10 偏差处置全合规；结论 ⚠️ 有条件通过（3 项 🟡 改进，可进入 validate） | 2026-09-27 | SDDU Review Agent |
