# 能力丢失排查报告（黑盒丢失审计）

> **文档定位**: v6 简化迁移前的能力全量排查——比对「现有框架能力」（四片深读审计）与「新设计决策面」（plan v5.27 + ADR-001~014），找出无决策记录即消失的能力  
> **排查方法**: 4 个独立审计（状态机 / 适配器+插件 / 框架技能+脚本 / 模板+e2e），逐文件深读提取能力清单，逐条对照决策记录  
> **创建时间**: 2026-11-24  
> **使用方式**: 逐项裁决，每项末尾「裁决」处填写结论（**保留 / 退役 / 由范式替代 / 蒸馏进 sddu.md / 补进 carrier-inventory / 待定**）；裁决完成后本文件转正式产物并同步 plan

---

## Legend

| 标记 | 含义 |
|------|------|
| 🔴 | 黑盒丢失——决策记录零提及，将随伞形删除静默消失 |
| 🟡A | 蒸馏底稿缺口——ADR-005 已拍板「语义蒸馏进 sddu.md」，但蒸馏清单未点名该语义 |
| 🟡B | FR-004 悬置——已决流程（转裁撤评估）、结论未出（carrier-inventory 未产出） |
| ✅ | 已决闭环——有 ADR / plan 行，抽查无丢失 |

---

# 第一部分 🔴 黑盒丢失（8 项，逐项裁决）

## L1 · opencode-operator（程序化驱动 opencode 的完整工具链）

**现状证据**：
- `src/skills/builtin/opencode-operator/SKILL.md`（697 行）：运行时操作 opencode 的完整知识——4 条操作路径（run/serve/acp/github）、长流程编排（<5min run / 5-30min `-c` 续接 / >30min serve 非阻塞）、8 种模式、v1/v2 双代端点对照
- `scripts/serve-api.cjs`（1470 行，Commander v15 CLI，21 个子命令）：
  - 阻塞：run（一条龙）、send
  - 非阻塞：start（detached，日志/PID 落盘，幂等）/ submit / status / result / wait / abort / stop
  - 运维：restart / attach（TUI）
  - 巡检：ps（健康探测）/ sessions（--grep/--limit）/ rm / detect（OpenAPI 自探测）/ skills / stats
  - v2 治理：revert（检查点回滚）/ fork / compact / diff
  - v1/v2 双代兼容：`/doc` 运行时自探测选路径；响应三态；v1 会话在 v2 视图空投影
- `scripts/init.cjs`：幂等 npm install；`scripts/package.json`：唯一依赖 commander ^15

**为何黑盒**：plan / spec / ADR-001~014 零提及「operator」；被「src/ 整目录 DELETE」伞形覆盖而静默死亡。

**冲突点**：① 自带 npm 依赖（与零 npm 直接冲突）；② opencode 平台专属工具（与平台中立冲突）；③ 独立能力域（驱动宿主平台），与 SDDU 方法论内核无关。

**选项**：
- A. 退役（随 src/ 删除，不蒸馏）——能力域属「驱动 opencode」而非「spec-driven 方法论」
- B. 拆独立项目/独立 skill 分发（不随 SDDU 本体走）
- C. 保留为 opencode 平台的可选附加包（v12 多平台二期重估）

**裁决**：________________

---

## L2 · 外部 API 文档缓存门禁（plan 阶段的前置检查链）

**现状证据**：
- `sddu-spec.md.hbs`：标记外部 API 依赖时提示运行 `/sddu:api-docs`
- `sddu-plan.md.hbs`：规划前扫描 spec 中 API 提及 → 查 `.sddu/api-docs/` 缓存 → **缺失则拒绝规划**（门禁：无缓存不能规划）

**为何黑盒**：`.sddu/api-docs/` 目录与 `/sddu:api-docs` 命令在 v6 决策（含 §5.1 树、§5.2 表、workspace 骨架清单）中零出现。

**冲突点**：完整门禁能力链；属 plan 阶段质量增强，非流程本质；但 Agent 规划外部 API 时确有真实价值。

**选项**：
- A. 退役——「四维判据」衡量属附属品；Agent 可现场 fetch API 文档
- B. 蒸馏为 sddu-plan 模块的可选协议段（不设硬门禁，只留「建议缓存」指引）
- C. 保留硬门禁语义，路径迁 `.sddu/workspace/api-docs/`

**裁决**：✅ **A 退役（2026-11-24 拍板）**——SDDU 是框架级、逻辑级、适用于各场景的 spec-driven 框架，不做具体场景的事情（API 缓存属场景增强）；场景需求走 `.sddu-config/` 钩子；产出 ADR-015；模块迁移时删除 sddu-spec/sddu-plan 模板中的 API 缓存门禁段

---

## L3 · `dependencies{on,blocking}` 字段失去载体 ⚠️ 结构性矛盾

**现状证据**：
- `schema-v3.0.0.ts:70-124`：StateV3_0_0 含 `dependencies{on,blocking}` 数组
- `dependency-checker.ts:140-209`：依赖拦截规则（依赖方 phase ≥ 目标 phase，未就绪者阻断推进）
- ADR-005 已拍板：「依赖校验口径」全量蒸馏进 sddu.md（TASK-002 范围）

**为何黑盒/矛盾**：ADR-005 拍板的 state.md front-matter 字段契约为 `feature/featureId/name/version/phase/status/depth/childrens/phaseHistory/description`——**不含 dependencies**。蒸馏了校验语义，却删了数据源——蒸馏空转。

**冲突点**：dependencies 是**声明性信息**（feature 间依赖关系），无法从目录结构或产物推导，必须有载体。

**选项**：
- A. front-matter **补 `dependencies` 字段**（如 `dependencies: [v6.00.0-xxx]` 简单字符串数组）——声明性信息、Agent 可读写
- B. 依赖关系判退役（依赖校验语义随之退化为「人工判断」）——但这与 ADR-005 蒸馏清单已含「依赖校验口径」冲突，需回改 ADR-005
- C. 依赖关系改存 feature 目录内独立文档（如 dependencies.md）

**裁决**：✅ **A front-matter 补 dependencies 字段（2026-11-24 拍板）**——单向声明（只存「我依赖谁」，对应原 dependencies.on；反向 blocking 为派生信息不落盘，由 Agent 反查推导）；依赖校验口径的数据源闭环；缺省合法；产出 ADR-016，ADR-005 字段契约九字段→十字段

---

## L4 · `files{...}` 产物注册字段失去载体

**现状证据**：
- `schema-v3.0.0.ts`：files 字段（discovery/spec/plan/tasks/review/reviewReport/validation/validationReport 路径注册）
- `sddu-review.md.hbs` / `sddu-validate.md.hbs`：完成后回写 `files.review` / `files.reviewReport` 等字段
- `machine.ts:140-149` requiredFiles 表 + `checkRequiredFiles`：阶段产物门槛检查的依据

**为何黑盒**：front-matter 契约不含 files 字段；产物存在性检查（前置产物门禁）失去权威数据源。

**冲突点**：files 本质是**产物注册副本**——违反「目录即真相」（ADR-010 同构逻辑）：产物文件就在 feature 目录里，`ls` 即可判断存在性，无需注册副本。

**选项**：
- A. **判退役**——前置产物检查改为「目录约定直查」（feature 目录内约定的文件名直接判断存在）；与 ADR-010「目录名即导航」共享同一设计哲学
- B. front-matter 补 files 字段（保留注册副本语义）

**裁决**：✅ **A 退役（2026-11-24 拍板）**——目录即真相：产物存在性直查（目录约定文件名），不建注册副本（副本即漂移源）；前置产物门禁语义保留、数据源换轨为直查（底稿 A6 判定依据同步）；模块迁移约束：sddu-review/sddu-validate 模板删除 files 回写联动段；产出 ADR-017

---

## L5 · 文件驱动自动推进（auto-updater 全链路）

**现状证据**：
- `auto-updater.ts:219-270`：file.edited / session.idle 事件触发 → 由产物文件反推 phase（`inferCurrentPhaseFromFiles`，高→低找文件齐全阶段）→ 自动 `updateState`（triggeredBy='auto-updater'）
- 推进条件：status==='tracked'（FR-003：非 tracked 跳过保护）+ 严格前进 + 非父特性 + 文件齐全；仍走完整校验+依赖拦截；**无任何用户确认环节**
- `plugin.ts:407-441`（file.edited）/ `:444-514`（session.idle 全量扫描+父状态级联）
- 已知缺陷：builded/reviewed 与 tasked 文件集相同，文件推断混同

**为何黑盒**：蒸馏清单（8 phase / 5 status / 迁移表 / 树嵌套联动 / 依赖校验口径）不含自动推进语义。

**冲突点**：新范式下「设计态即运行态、Agent 直接读写 state.md」——Agent 完成阶段产物的瞬间顺手更新 front-matter 是协议内建行为，文件反推自动推进可能天然被替代。

**选项**：
- A. **由范式替代**——新协议中「完成产物 → 更新 state.md」是同一动作（Agent 写完即更新，无需文件反推）；产出 ADR 固化
- B. 蒸馏「文件反推 phase」为 sddu.md 的对账协议段（用于 state 与产物漂移时修复）
- C. 完全退役（对账漂移场景留给用户人工处理）

**裁决**：✅ **C 完全退役（2026-11-24 拍板）**——属 OpenCode 插件内容（触发链挂在插件 file.edited/session.idle 事件上）；当前设计不包容平台限定的业务（与 ADR-015 场景中立同构：平台特定的运行时机制不入框架）；阶段推进唯一路径 = A8 完成协议；蒸馏范围明确排除文件反推语义；产出 ADR-018

---

## L6 · state 自动修复 / 隐式版本迁移（state-loader 对账）

**现状证据**：
- `state-loader.ts:176-273` applyReparation：① version 强制补 v3.0.0（隐式旧版迁移）② feature←basename ③ phase 从旧 `state` 字段映射（drafting→registered、implementing→builded、completed→validated 等）④ status 仅缺失/非法时置 tracked，**已有非 tracked 一律保留**（FR-008 保护）⑤ depth 重算 ⑥ 结构兜底重建 ⑦ phase 超前历史空→补首条
- 修复后仍不过校验时返回原数据用于 recovery；无回滚/删除

**为何黑盒**：蒸馏清单不含修复语义。

**冲突点**：产品未推广、存量 29 个 state.json 是一次性转换（ADR-008 已拍板不计迁移成本）——「隐式版本迁移」的场景本身即将消失；但「state.md 被 Agent 写坏后如何对账」在新范式下仍可能发生（front-matter 字段写错/枚举非法）。

**选项**：
- A. **非问题 ADR**——旧版迁移场景随一次性转换消失；新范式下 state.md 异常由 e2e 结构回归暴露（非法枚举即断言失败），修复协议=「按目录与产物重建 front-matter」写进 sddu.md 一段话即可
- B. 蒸馏完整对账修复协议进 sddu.md

**裁决**：✅ **A 非问题（2026-11-24 拍板）**——不考虑迁移的事情：存量转换是 ADR-008 拍板的一次性显式转换（EC-005 逐文件回归断言），转换后 state.md 天生符合契约，不存在「旧格式读入」输入；无常驻隐式修复层（静默改数据是最危险漂移源）；异常走 e2e 显式暴露；产出 ADR-019

---

## L7 · bootstrap.sh / bootstrap.ps1（一键安装入口）

**现状证据**：
- `bootstrap.sh:7-124`：curl|bash 一行安装；依赖检查 git/node/npm；git clone --depth 1；平台委派（opencode→install.sh npm 全构建链；dsh→install.sh --build npm build:dsh）——**间接强依赖 npm/build**
- `bootstrap.ps1:31-133`：Windows 等价

**为何黑盒**：plan §5.1 树中 bootstrap 无任何标注（非 ✖D 非 ✎M）= **v6 默认保留**——但零 npm 后其委派的构建链已不存在，保留即死代码。

**冲突点**：ADR-007 已拍板「无安装器时手工复制亦等效」——安装已坍缩为 `cp -r` 一条命令。

**选项**：
- A. **判退役**——README 写明两条命令（git clone + cp -r），bootstrap 整体删除
- B. 重写为极简 bootstrap（git clone + cp -r sddu-project-template/. <project>/，零 npm 依赖）
- C. 保留现状（不可行——构建链已亡）

**裁决**：✅ **A 退役（2026-11-24 拍板）**——新的设计不区分平台（统一安装 = cp -r 一条命令全平台同动作，bootstrap 的平台分派前提消失；--platform 分支与间接 npm 依赖同为死代码）；一行安装的说明归 README（git clone + cp -r 两步）；§5.1 树补 ✖D 标注；产出 ADR-020

---

## L8 · `@sddu 标记` 命令族 + 仪表盘富语义

**现状证据**：
- `sddu.md.hbs`（路由模板）：
  - 标记命令：suspended[--until/--note] / terminated / merged[--into] / tracked → **用户二次确认（不可逆）** → 三处同步（feature state.json + root state.json + TREE.md——后两者已随 ADR-008/010 退役）
  - 仪表盘 6 区分类（进行中/已完成/搁置/终止/迁出/异常）
  - **30 天停滞检测** + **suspendedUntil 到期提醒 🔔** + **merged 目标存在性检查 ⚠️**
  - **子随父归**：非 tracked 祖先下的子特性归入父节点不独立展示（tree-scanner.ts:147-205 findFirstNonTrackedAncestor / resolveDisplayContext）
  - 智能引导建议
- `machine.ts` getNextStep：下一阶段命令推荐

**为何黑盒**：新设计只说 sddu.md 含「路由表 + 门禁/状态协议 + 读取规则」+「状态仪表盘」——标记命令语义、仪表盘分区/提醒/归并语义均未逐项决策。

**冲突点**：状态协议蒸馏只点名 phase 迁移表；status 流转命令（标记族）与仪表盘行为无落点。

**子项拆分裁决**（可分别裁）：
- L8-1 标记命令族（--until/--note/--into、不可逆二次确认）→ 蒸馏进 sddu.md 状态协议？
- L8-2 仪表盘 6 区分类 + 子随父归 → 蒸馏进 sddu.md 读取规则？
- L8-3 30 天停滞检测 + suspendedUntil 到期提醒 🔔 → 判退役？（运行时策略、违反「元数据不是状态」；suspendedUntil 字段在 front-matter 契约中也无位置）
- L8-4 merged 目标存在性检查 ⚠️ → 蒸馏 or 退役？
- L8-5 下一阶段命令推荐（getNextStep）→ 蒸馏进读取规则？

**裁决**：________________

---

# 第二部分 🟡A 蒸馏底稿缺口（9 条——TASK-002 蒸馏时以 machine.ts / schema-v3.0.0.ts 逐条比对补齐，基本无争议，可整体拍板）

> 原则已在 plan §6 风险表：「蒸馏以现 machine.ts/schema-v3.0.0.ts 语义为底稿逐一比对，不凭记忆重写」。以下为逐条清单，防止「底稿」自身遗漏：

| # | 语义 | 现状出处 |
|---|------|----------|
| A1 | **FR-006**：推进到 validated 且 status=tracked 时，status 自动置 completed（无用户确认） | machine.ts:487-642 |
| A2 | **父特性天花板**：父 feature 禁止推进超过 planned（targetOrder>3 拒绝） | machine.ts:449-459 |
| A3 | **状态可逆表**：仅 suspended→tracked 可逆；completed/terminated/merged 终态不可离开 | schema:154-167, 345-350 |
| A4 | **依赖拦截规则**：依赖方 phase ≥ **目标** phase（非当前）；依赖缺失仅警告不拦；循环依赖 DFS 检测；回退影响警告 | dependency-checker.ts:140-345 |
| A5 | **phaseHistory 条目契约**：phase + timestamp + triggeredBy + comment 四字段 | schema:38-43 |
| A6 | **前置产物表**：每 phase 必需文件清单 + 父特性差异化（只查 discovery/spec/plan 类） | machine.ts:140-149, 378-408 |
| A7 | **createFeature 规则**：id=小写连字符截 50、幂等创建（已存在拒绝）、创建后回读校验 | machine.ts:196-238, state-loader.ts:340-419 |
| A8 | **完成协议改写**：11 个模块模板的 `/tool sddu_update_state` 调用 → state.md front-matter 更新动作（迁移任务需显式列入 tasks） | 全部模板完成协议段 |
| A9 | 顺带修现状缺陷：builded/reviewed 文件集无法区分（推断混同）——蒸馏时以 phaseHistory 为权威而非文件反推 | auto-updater.ts:125-179 |

**裁决**（建议整体：并入 TASK-002 蒸馏底稿）：________________

---

# 第三部分 🟡B FR-004 悬置（6 项——carrier-inventory 未产出，build 前必须先裁）

## B1 · sddu-skill-creator（用户自定义 Skill 创建入口）

**现状证据**：`src/skills/framework/sddu-skill-creator/SKILL.md`——对话式引导创建用户级 Skill（三问引导触发/输入/输出 → description 候选×3 + 冲突检查 🟢🟡🔴 → Progressive Disclosure body 编写 ≤500 行 → 命名检查 → 可选触发测试）；产物 `.sddu/skills/<name>/SKILL.md`。

**悬置原因**：新设计中 `.sddu/skills/` 用户级目录不存在；用户扩展范式已换成 `.sddu-config/` 钩子 + 契约覆盖——**但钩子是阶段内嵌的，不能独立触发**；「把对话流程固化成可触发的新 Skill」这一能力无对应物。

**选项**：
- A. 退役——用户自定义扩展收敛为钩子+契约（新范式自洽）
- B. 保留能力但换载体：用户 Skill 放 `.sddu-config/skills/<name>/`（索引机制指向）——需扩 sddu.md 读取规则
- C. 拆独立能力不随本体分发

**裁决**：________________

## B2 · sddu-skill-discovery（清单管理 + 冷启动协议）

**现状证据**：discover.cjs 三操作（list/summary/path，扫描用户级+框架级目录）+ 冷启动协议（首次安装后提议同步）。

**悬置原因**：发现指针机制已拍板删除（2026-11-23：平台 skill 识别非 sddu 核心，用户自行放置索引）；「复制即生效」无冷启动场景。**大体已决死亡**，但清单管理语义（Agent 查询可用能力）无对应物。

**选项**：
- A. 退役（已决指针删除的自然推论；能力清单=sddu.md 路由表本身）
- B. 部分蒸馏（路由表即清单，无需独立发现机制）

**裁决**：________________

## B3 · sddu-skill-sync（全量同步管线）

**现状证据**：sync.cjs——两源扫描→实际目录探测（.opencode/.claude/.codex）→全量拷贝→init→manifest 管辖→残留清理→第三方 protected 硬保护→备份回滚→JSON 报告；默认 dry-run。

**悬置原因**：设计态即运行态（ADR-007）+ 索引唯一（.agents/skills/sddu/）后无「同步到平台目录」环节——**大体已决死亡**；manifest/protected/回滚等安全设计随迁移场景消失。

**选项**：
- A. 退役（范式推论：复制即生效，无同步）
- B. 保留 dry-run/备份理念进新复制器的旧布局迁移段（已有「备份+回滚」行，✅ 精神已保留）

**裁决**：________________

## B4 · dev-guide（框架自身二次开发指南）

**现状证据**：`.sddu/skills/dev-guide/SKILL.md`——「用 SDDU 开发 SDDU」：只改 src/ 不碰 dist/ 铁律、L0/L1 定级、四层产物链心智模型、变更类型→真源映射表、发布收尾流程。

**悬置原因**：plan §5.2 有 MODIFY 行（改引用 sddu.md）但 §5.1 模板树**无落位**——随 dogfooding 迁 `.sddu/workspace/skills/` 后变仓库私有文件，分发面消失。且其内容（src/dist 产物链、npm 构建）在新架构下**全部失真**。

**选项**：
- A. 重写——新范式下「开发 SDDU 自身」=改 sddu-project-template/ + 模块 md，指南内容全换
- B. 退役——零构建后「二次开发」已无复杂度（改 md 即生效），指南失去存在理由
- C. 保持仓库私有（不进分发模板）

**裁决**：________________

## B5 · 根 docs/ 归类（dsh/×6 + research/×4 + 工程文档）

**现状证据**：plan §5.1 只写「docs/ dsh/×6、research/×4 及工程文档——归类见清单」，FR-004 要求覆盖「文档集（README/docs/.sddu/docs）」——**清单未产出**。

**悬置原因**：FR-004 本就是 P0 验收前提；carrier-inventory（FR-004/005 的载体，plan §5.2 已列 NEW 行）至今未创建。

**选项**：
- A. 立即补 carrier-inventory（本审计已提供 80% 素材）
- B. 逐项直接拍板（研究文档归档/删除；dsh 文档随平台适配重估）

**裁决**：________________

## B6 · e2e shell 生成器 + FULLSTACK 指南

**现状证据**：`e2e/scripts/basic/sddu-e2e.sh`（轻量 e2e 环境生成器）、`e2e/scripts/fullstack/sddu-e2e-fullstack.sh`（前后端分离全栈场景）、`docs/FULLSTACK-E2E-GUIDE.md`（使用手册，内含旧命名代差）。

**悬置原因**：plan e2e MODIFY 行只点名「jest TS 测试 ×2 → 裸 node 结构回归」——shell 生成器与指南未点名。

**选项**：
- A. 退役——新 e2e = 裸 node 结构回归（安装范式断言），场景生成器属运行时验证工具链
- B. 保留改写（面向真实 Agent 会话的 e2e 仍需环境生成器）
- C. v7 质量闭环重估

**裁决**：________________

---

# 第四部分 ✅ 已决闭环抽查记录（无丢失，留档备查）

| 能力 | 决策 |
|------|------|
| TREE.md 生成 + sddu-tree 联动 | ADR-010 裁撤 |
| OpenCode 硬门禁（updateState 抛错透传）| ADR-004 退役，v12 重估 |
| opencode.json 三分支合并/旧 agent 清理/root 配置迁移 | 随插件退役（新设计不装插件）|
| 11 dsh skill → 1 索引 | ADR-004/007 |
| 模板迁移 ×10 指令 + ×31 契约 | plan §5.2 |
| 用户自定义模板两级查找 | → `.sddu-config/contracts` 覆盖（FR-008⑪）|
| fast 9 禁令 + 升级阈值表 | 模块迁移保留 |
| review/validate 策略/报告双产物 + files 联动* | 双产物保留（*联动见 L4）|
| tasks.json | 运行期产物非契约 |
| roadmap zone/entry 增量合并 | 保留（ADR-009 基础）|
| 依赖图可视化/双向视图（getBlockedByFeatures 等）| 纯运行时展示，随 TS 亡（蒸馏仅口径）|
| examples/、证书、review-report-*.json、migration×27 | 禁项/拍板删除 |
| 旧布局迁移（备份+回滚）进新复制器 | plan §5.2 已有行 |
| dsh 断言（数量强校验/冲突/缓存提示）| 归 e2e 裸 node |
| 安装器 skills init 失败即中止 | 随 skill 体系亡（见 B2/B3）|

---

## 汇总统计

- 🔴 黑盒丢失：**8 项**（L1~L8，其中 L3/L4 为结构性矛盾）
- 🟡A 蒸馏底稿缺口：**9 条**（建议整体并入 TASK-002）
- 🟡B FR-004 悬置：**6 项**（B1~B6，carrier-inventory 欠账）
- ✅ 已决闭环：15+ 项抽查通过

> 裁决完成后：本文件转正式产物；裁决产出新 ADR（预计 ADR-015 起）；plan §6 风险表补「黑盒丢失排查已完成」条目；TASK-002 蒸馏底稿范围扩展。
