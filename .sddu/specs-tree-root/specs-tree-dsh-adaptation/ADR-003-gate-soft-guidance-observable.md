# ADR-003：阶段门禁采用显式可观测软引导，硬 guard 通道记为演进点

## 状态
PROPOSED

## 背景

SDDU 的核心竞争力是「不跳步」的**硬强制**门禁：`src/state/machine.ts` 在 `updateState()` 中抛出 `PhaseReversalError` / `PhaseSkipError`，从代码层拒绝非法跃迁（快照 §3.6 对照：dsh 的 plan mode 只是日志软引导，限制由沙箱与批准策略各自执行，不读写 plan 状态）。而 dsh 侧的既定交付形态是 Skill 包，且快照 §3.4 明确「skill 是**可选的指令而非会话事件**，不携带执行能力」。

spec FR-004 因此只定义**目标与约束**（机制由 plan 决策）：

- (a) 保留**可观测的拒绝行为**（非法跃迁被拒绝且不推进状态）；或
- (b) 平台能力所限时降级为**显式、可观测、对用户可见**的软引导。
- **禁止在用户不可见的情况下静默丢失门禁语义**。

协调器指引：优先可观测拒绝；确不可行则显式降级（用户可见 + 文档如实标注），禁止静默丢失。

快照中与「可观测拒绝」可能相关的 dsh 机制：

- `ctx.tools.execute()` 的 waterfall + **单调 guard**（`tools/pre-execute` → 单调 guard → `tools/execute` → `tools/post-execute` → `tools/result`），guard 返回 `string | undefined` 且**只能缩减权限**（无 allow 结果）。这是**运行时硬拒绝**的理想载体（快照 §3.3）。
- 但接入该流水线需要**注册 dsh 工具**，而工具注册属于 **dsh 插件/bundle** 范畴（profile 分层组装：`dsh-base → dsh-web-app` + `cordis.patch.yml` overlay），快照**未覆盖** Cordis bundle 的完整契约细节。

判断：**在「Skill 包」交付形态内不存在运行时拒绝点**——Skill 不能注册工具、不能挂 guard、不能介入工具执行流水线。实现 (a) 必须自研 dsh 插件，将：① 突破既定交付形态（用户拍板 Skill 包）；② 把本 Feature 押在快照未覆盖的插件契约上（R-001 放大）；③ 把跟随升级面从「改文本」升级为「改插件代码」（与「适配层隔离、允许跟随升级」的风险姿态相悖）；④ 与 NG-001（不提前抽象）及 v5.1.0 收敛时机冲突。

## 决策

**1. 采用 FR-004(b)：显式、可观测、对用户可见的软引导门禁。**

门禁以 `src/adapters/dsh/templates/gate-protocol.md.hbs` 注入每个阶段 Skill（及路由 Skill 的前置检查段），要求模型执行以下确定性步骤：

1. 读 `.sddu/specs-tree-root/<feature>/state.json`，取得 `phase`。
2. 校验**相邻性**：目标阶段必须等于 `NEXT_PHASE[current]`（与核心 `PHASE_ORDER` 同源语义）。
3. 校验**前置产物存在性**（如 plan 需 `spec.md`）。
4. 输出结构化结果块（单行 JSON，便于检索与回放）：
   - 拒绝：`[SDDU-GATE-DENY] {"feature":"…","from":"…","to":"…","missing":[…],"reason":"…","action":"none"}`，并**不写 `state.json`、不产出阶段产物**。
   - 放行：`[SDDU-GATE-ALLOW] {"feature":"…","from":"…","to":"…","prereq":"…","action":"proceed"}`。
5. 遇非法跃迁（跳步 / 回退）**必须**按拒绝处理，不得「提示后继续」。

**2. 降级的可见性要求（禁止静默）**：

- 每个 `SKILL.md` 与 `docs/dsh/README.md`、`docs/dsh/verification.md` 必须在固定段落声明：**「⚠️ 已知降级：dsh 侧无可执行的运行时拒绝点，本门禁为模型执行的显式软引导（FR-004b），非硬强制；非法跃迁会输出 `[SDDU-GATE-DENY]` 且不推进，但其约束力来自模型对指令的遵从」**。
- 文档**禁止**出现「硬强制 / 强制执行 / 运行时拒绝」等与 (a) 相关的表述（EC-003：「禁止声称硬强制」）。
- 若模型未按协议输出拒绝块，即视为**降级边界被穿越**，用户可在 V4 场景中观测到；该情形不得被文档掩盖。

**3. 硬 guard 通道登记为演进点（版本锚定，本 Feature 不实现）**：

在 `dsh-contract-manifest.json` 与 `docs/dsh/upgrade-following.md` 登记：

- 依赖点 `guard-pipeline`：`tools/pre-execute` waterfall + 单调 guard（快照 §3.3，2026-08-14）。
- 前置条件：实现 SDDU 的 dsh 插件（Cordis bundle / `cordis.patch.yml` overlay），契约细节**快照未覆盖，需刷新契约后评估**。
- 触发条件：用户明确要求硬拒绝语义，或 v5.1.0 通用多平台适配评估「门禁承载」的跨平台抽象时。
- 明确标记为 **v5.1.0+**，不进入本 Feature 范围（NG-002/NG-001 边界）。

## 后果

**正面**

- FR-004 的三条验收标准全部可满足：① 非法跃迁产生明确可观测结果（`[SDDU-GATE-DENY]`）；② 文档如实标注采用 (b) 及其边界；③ 不存在「声称存在但不生效且无提示」的情形（因为不存在任何硬强制声称，且软引导也有结构化输出）。
- NFR-003 可追溯性达成：门禁行为留下「产物文件 + 会话观测 + 会话日志」三份证据，且 `[SDDU-GATE-*]` 块可在 dsh 会话日志（`SessionEvent` 可回放）中检索。
- 不引入未经快照支撑的插件契约风险，不破坏既定交付形态。

**负面 / 需承担**

- 门禁**不具运行时强制力**：约束力取决于模型对指令的遵从；对抗性用户（明确要求模型跳步）可以绕过——这是公开的、文档化的边界。
- 与 OpenCode 侧的硬强制存在**能力落差**：同一方法论在两平台上的「强制力」不同。已在 `docs/dsh/dual-platform-diff.md`（NFR-002）与定位说明（FR-010）中如实表达，避免用户误以为两平台等价。
- 需要在文档中反复、显式地声明降级——任何一处遗漏都可能构成 EC-003 的「静默丢失」，故测试需断言每个 `SKILL.md` 含降级声明段（可静态校验）。

**对下游（tasks）的约束**

- `gate-protocol.md.hbs` 是唯一门禁协议来源；`skill-package.test.ts` 必须断言：① 每个阶段 `SKILL.md` 含 `[SDDU-GATE-DENY]` 与 `[SDDU-GATE-ALLOW]` 片段；② 含「已知降级」声明段；③ 全量生成物中**不出现**「硬强制」类禁用语（防文档漂移）。
- V4 验证场景（`docs/dsh/verification.md`）必须把「观测到拒绝块」与「观测到降级声明」同时列为通过判据。
