# 方案 E 真实用户体验评估报告：FR-AUTONOMY-001（LLM 真思考代答）

> **评估对象**: Feature `specs-tree-autonomous-mode`（FR-AUTONOMY-001）方案 E「决策会话 LLM 真思考代答」
> **评估依据**: 真实用户体验会话 `sddu-test-user-login-2/session-ses_ff68.md`（8/16 15:22→16:08，完整 7 流程），运行时日志 `~/.local/share/opencode/log/opencode.log`（run=e7595780）
> **对照**: spec.md（FR-001~010 / NFR-001~003）、ADR-018（方案 E）、ADR-020（决策追溯）
> **评估人**: SDDU 评估 Agent
> **评估时间**: 2026-08-16
> **核心结论**: ⚠️ **部分生效** —— 方案 E 机制真实存在且经运行实证可用（login-1 verify run 全链路走通），但**本次目标体验会话中 0 次触发**（decision_count=0，auto-decisions.md 未生成）：执行阶段子 Agent 全程未调用 question 工具，"LLM 真思考代答"在本会话中没有发生的机会。

> ## ✅ 2026-08-16 更新（契约修复后真实路径验证通过）
>
> 本报告的「⚠️ 部分生效（0 触发）」结论基于**契约修复前**的 user-login-2 会话（注入「绝不问人」契约抑制了子 Agent 提问）。根因修复（sddu-auto.md.hbs v1.5：注入契约改为「可正常使用 question 工具提问」）后，已用**全新体验项目 `sddu-test-user-login-3` 做真实路径复验**（用户正常跑 `@sddu-auto user-login`，如实回答启动问卷，**不注入任何强制提问指令**）——**方案 E 在真实路径下真实触发**：
>
> - **子 Agent 自然提问**：sddu-spec 在 spec 阶段自然调用 question 工具（问题「密码重置身份确认方式」，无任何强制注入）。
> - **decision-proxy 全链路触发**：`asking`（08:52:27）→ `sddu-auto 决策会话`创建（ses_ff63a45c...）→ LLM 真思考（deepseek-v4-pro ≈8s）→ `intercepting question` → `replied` 代答 → auto-decisions.md 落盘。
> - **decision_count = 1**（> 0）；auto-decisions.md 含 `**决策来源**：sddu-auto 决策会话` + `**是否硬决策**：LLM 真思考（sddu-auto 决策会话）`。
> - **E1 / E2 问题已解决**：方案 E 在真实体验中获得触发输入，不再空转。
>
> 详细证据见 `verify-real-path.md`。

---

## 1. 结论总评

**一句话结论**：方案 E 的「LLM 真思考代答」机制**已实装且被证明可用**，但在本次用户真实体验（`sddu-test-user-login-2` 会话 ses_ff68）中**未实际触发**——因为执行阶段没有任何子 Agent 发起提问，decision-proxy 无提问可拦截，`decision_count=0`、`auto-decisions.md` 未生成。

**分层判定**：

| 层面 | 结论 | 证据 |
|------|:--:|------|
| 方案 E 机制是否实现 | ✅ 已实现 | `decision-proxy.js`（v1.1.0）完整实现「拦截→识别→建决策会话→`client.session.prompt()` LLM 真思考→全局 reply 代答→30s 超时兜底」五步链路 |
| 方案 E 机制是否可用（运行实证） | ✅ 已实证 | **login-1 验证 run（06:05-06:06）**：决策会话建立（`ses_ff6d2c...`，agent=sddu-auto）→ LLM 真实流式思考（≈8s）→ `decisionSource="sddu-auto 决策会话"` → 全局 reply 代答成功 → auto-decisions.md 落盘（decision_count=1） |
| **本次目标体验会话中是否真实触发** | ❌ **0 次触发** | user-login-2（run=e7595780）：执行阶段无任何子 Agent 调用 question 工具 → decision-proxy 无可拦截对象 → 未建决策会话、未 prompt、未代答、未落盘 |
| 本次体验是否满足预期 | ⚠️ 部分 | 「执行阶段绝不问人」达标（FR-004），但核心卖点「决策会话 LLM 真思考代答」在本次体验中一次都没发生（decision_count=0） |

> **归因澄清（重要）**：本次 0 触发**不是机制故障**，而是**没有触发输入**——注入子 Agent 的「自主执行契约」（"提问将由 sddu-auto 代答 / 不要依赖人类介入 / 拿不准也硬决策"）+ 足够详尽的 task prompt（含「需求决策要点」「关键实现约束」），使 7 个子 Agent 全程自行决策、从不提问。方案 E 是"被动拦截"架构，子 Agent 不问就永远不会代答。这与 login-1 验证 run 中"子 Agent 主动提问→代答闭环走通"形成对照，共同证明：**机制可用，但依赖子 Agent 提问作为触发输入，真实体验中该输入为零**。

---

## 2. 方案 E 生效证据（分来源）

### 2.1 本次目标会话（user-login-2 / ses_ff68 / run=e7595780）—— ❌ 未触发

**auto-decisions.md**：`find` 实测 **不存在**（Feature 目录下无该文件）。

**decision_count**：**0**（无决策会话代答记录；sddu-auto 完成汇报亦自述 `decision_count=0`）。

**会话日志证据**（session-ses_ff68.md）：
- 唯一一次 `question` 工具调用发生在**启动阶段**：`que_0097372020019Xbzc0UnqaI5xf`（六维问卷 5 题，由用户回答）——这是 FR-003 允许的唯一人机交互点，非方案 E 范畴。
- 7 个执行阶段子 Agent（discovery/spec/plan/tasks/build/review/validate）**从未调用 question 工具**。
- 完成阶段 sddu-auto 自述（session 末段）：
  > "`auto-decisions.md` 应由 decision-proxy 协议层自动落盘，本次会话协议层未触发写入（0 个关键决策点记录）。执行过程中所有子 Agent 的决策均基于启动阶段固化的六维诉求上下文自主完成，未向用户提问。"

**运行时日志证据**（opencode.log）：
- run=e7595780 中全部 `asking/replied` 事件仅 1 组（07:22:35 启动问卷 ask / 07:22:54 用户 reply），无子 Agent 提问。
- run=e7595780 中**无** `decision-proxy: decision session created`、**无** `decision-proxy intercepting question` 日志。
- 全程 **0 次** `decision session failed, degrading`（超时兜底未发生）。

### 2.2 运行实证（login-1 / run=d1145d64 / 06:05-06:06）—— ✅ 全链路可用

这是方案 E 修复后（verify-decision-proxy.md §5 二轮修复验证）在真实 serve 运行时的实证，同一插件版本：

| 步骤 | 日志证据 | 结论 |
|------|---------|------|
| ① 拦截 | `decision-proxy intercepting question sessionID=ses_ff6d2f... requestID=que_0092d376... headers=["HTTP 框架选型"]` | ✅ 拦截成功 |
| ② 建决策会话 | `created id=ses_ff6d2c887... title="sddu-auto 决策会话" agent=sddu-auto` + `decision-proxy: decision session created` | ✅ 独立决策会话建立 |
| ③ LLM 真思考 | `process session.id=ses_ff6d2c...` → `stream providerID=opencode modelID=deepseek-v4-flash-free agent=sddu-auto`（06:05:53→06:06:01，≈8s 真实思考） | ✅ LLM 真思考 |
| ④ 代答 | `replied requestID=que_0092d3769001D1JoXBh0eudqtU answers=[["B 使用原生 Node http 模块"]]` | ✅ 全局 reply 成功，子 Agent 拿到答案继续 |
| ⑤ 追溯 | auto-decisions.md 落盘：`决策来源：sddu-auto 决策会话` / `是否硬决策：LLM 真思考（sddu-auto 决策会话）` / 决策依据含启动诉求 | ✅ 落盘，decision_count=1 |

**代答质量（login-1 实证样本）**：子 Agent 问「HTTP 框架选型 — 是否应该使用 Express？」→ 决策会话基于启动诉求（"零外部中间件依赖"）返回「B 使用原生 Node http 模块」——**上下文锚定正确、非"选首项"规则匹配**，证明 LLM 真思考提升了决策质量。

### 2.3 决策来源分布（目标会话）

| 来源 | 次数 | 说明 |
|------|:--:|------|
| sddu-auto 决策会话（LLM 真思考） | **0** | 无子 Agent 提问，无可代答对象 |
| 超时兜底（规则匹配） | **0** | 决策会话从未被创建/调用 |

---

## 3. 需求满足度对照表（对照 spec.md）

### 3.1 功能需求（FR）

| ID | 需求 | 判定 | 证据（user-login-2 会话） |
|----|------|:--:|------|
| FR-001 | 新增独立调度入口 sddu-auto | ✅ 满足 | 会话以 `Sddu-Auto` 身份运行（opencode.json agent 配置存在） |
| FR-002 | 走完整 7 流程 | ✅ 满足 | 7 个子 Agent 依次调度；phaseHistory: discovered→specified→planned→tasked→builded→reviewed→validated |
| FR-003 | 启动阶段为唯一人机交互点并提问澄清 | ⚠️ 部分满足 | 启动阶段通过 question 工具提问六维问卷（5 题）✅；但技术偏好（⑤）因 md 已含未再问，非完整六维 |
| FR-004 | 执行阶段绝不问人、拿不准也硬决策 | ✅ 满足 | 执行阶段 0 次面向用户提问；子 Agent 基于上下文自主决策（契约注入软约束实现） |
| FR-005 | 7 个子 Agent 执行流程零改动 | ✅ 满足 | 所有约束经 task prompt 注入，未修改子 Agent 定义 |
| FR-006 | 子 Agent 提问由 sddu-auto 代答（提问不呈现给用户） | ⚠️ 部分满足 | **机制实证可用**（login-1 全链路走通，见 §2.2）；但**本次会话未触发**（无子 Agent 提问），FR-006 在目标会话中零执行 |
| FR-007 | 沉淀全套过程产物（discovery.md~validate.md） | ✅ 满足 | 17 项产物完整落盘（见 §4） |
| FR-008 | 选择入口即进入自主决策模式，无开关/判定 | ✅ 满足 | 无复杂度判定、无配置项 |
| FR-009 | 边界=新增代理决策层，不改造子 Agent、无 autonomyLevel | ✅ 满足 | 子 Agent 定义未改；无 L0/L1/L2 |
| FR-010 | 7 流程跑完+全套产物即完成，无修正/回退 | ✅ 满足 | validated 后收尾；P2 遗留不修（D2~D6 记录级） |

**FR 汇总**：满足 7 项 / 部分满足 2 项（FR-003 问卷不完整、FR-006 本次未触发）

### 3.2 非功能需求（NFR）

| ID | 需求 | 判定 | 证据 |
|----|------|:--:|------|
| NFR-001 | 启动提问覆盖必要维度 | ✅ 满足 | 背景/目标/范围/验收/优先级 5 维已采；技术偏好来自 md；auto-context.json 六维完整 |
| NFR-002 | 产物命名与结构同普通 sddu 一致 | ✅ 满足 | discovery.md~validate-report.md 命名/位置与标准流程一致 |
| NFR-003 | 信息不足必须返回确定决策，不阻塞/反问 | ✅ 满足 | 全程无阻塞、无反问、无超时兜底 |

### 3.3 边界情况（EC，抽样核对）

| ID | 场景 | 判定 |
|----|------|:--:|
| EC-001 | 启动诉求不完整 | ⚠️ 未触发（问卷已采满 5/6 维） |
| EC-002 | 执行阶段未覆盖决策点 | ✅ 满足（子 Agent 硬决策，无反问） |
| EC-003 | 需外部信息 | ⚠️ 未触发（无外部依赖） |
| EC-004 | 复杂项目误交 | ⚠️ 未触发（简单项目） |
| EC-005 | 产物不满意不修正 | ✅ 满足（P2 遗留不修） |

---

## 4. 产物沉淀情况（`find`/`ls` 实测，避免 glob 假阴性）

`.sddu/specs-tree-root/` 下**产物完整**（17 项，与会话声称一致）：

```
.sddu/specs-tree-root/
├── auto-context.json                    # 六维自主执行上下文（决策锚点）✅
└── specs-tree-user-login/
    ├── discovery.md / spec.md / plan.md
    ├── tasks.md + tasks.json
    ├── build.md
    ├── review.md
    ├── validate.md + validate-report.md + validation.md
    ├── ADR-001~005（http/存储/scrypt/令牌/测试）
    ├── state.json（phase: validated, status: completed）✅
    └── TREE.md
```

- **state.json**：phase=`validated`，status=`completed`，phaseHistory 完整 8 条（registered→validated），与会话一致。
- **auto-context.json**：存在且六维内容正确（featureName=`specs-tree-user-login` 已写入，可供 decision-proxy 定位）。
- **auto-decisions.md**：❌ **不存在**（目标会话未触发写入；仅 login-1 验证 run 产出过）。

---

## 5. 瑕疵清单 / 问题清单（含严重度）

| # | 严重度 | 问题 | 描述 |
|---|:--:|------|------|
| E1 | 🟡 中 | **方案 E 在真实体验中 0 触发（核心卖点未呈现）** | 执行阶段子 Agent 全程不提问（被"自主执行契约"+详尽 prompt 抑制），decision-proxy 无可拦截输入，LLM 真思考代答本次一次未发生。**机制可用≠体验生效**——用户看不到 auto-decisions.md，无从感知方案 E 价值 |
| E2 | 🟡 中 | **方案 E 与"子 Agent 不提问"存在内在张力** | FR-005 要求子 Agent 提问行为照常发生（由代理层拦截代答），但注入的自主契约恰恰引导子 Agent 从不提问 → 拦截链路"空转"。需在「契约软约束（子 Agent 尽量自决）」与「留出可拦截的提问点（触发 LLM 真思考）」之间找平衡，否则方案 E 沦为永远不响的机制 |
| E3 | 🟢 低 | **FR-003 启动问卷不完整** | 六维问卷实际只呈现 5 题（技术偏好从 md 读取未问），未展示"已识别诉求摘要+最小确认"（评估报告 O2 未落实），用户无纠偏机会 |
| E4 | 🟢 低 | **`sddu_get_all_states` 报 missing_state_json 假阳性** | 会话中 state.json 有效但状态机持续报 `missing_state_json` 异常（tools.js 扫描路径与 tree-scanner 的 node.path 前缀不匹配，specsDir 双拼问题），sddu-auto 为此耗时多轮排查（读 sddu.js/tree-scanner.js/tools.js），浪费上下文 |
| E5 | 🟢 低 | **glob 对隐藏目录假阴性** | `.sddu/**` glob 返回 No files found（dot 目录被忽略），需 `find`/`ls`/read 实测；会话中多次触发误判排查 |
| E6 | 🟢 低 | **父链 TREE.md 未生成** | `.sddu/specs-tree-root/TREE.md`、`.sddu/TREE.md` 缺失（generate-tree skip「文件不存在」），导航链不完整 |
| E7 | 🟢 低 | **长 task 无中间可见性** | build 单次 task 阻塞约 17 分钟、validate 约 8 分钟，用户全程静默等待（无阶段进度心跳） |

**严重度分布**：中 2 / 低 5；无高。**无报错、无卡死、无异常崩溃**——7 流程全程顺畅跑完（15:22→16:08，约 46 分钟）。

---

## 6. 建议（供下轮迭代）

1. **让方案 E 有"触发机会"**：在子 Agent task prompt 的「自主执行契约」中明确"存在关键决策点时**必须**调用 question 工具（由 sddu-auto 代答），而非全部自行硬决"，或对特定决策点（如技术选型、范围取舍）强制走提问-代答链路，使 LLM 真思考真正落地并被 auto-decisions.md 记录。
2. **修复 `sddu_get_all_states` 假阳性（E4）**：统一 tools.js 与 tree-scanner 的 featurePath 语义（去除 specsDir 前缀双拼），避免 sddu-auto 每轮浪费上下文排查。
3. **落实启动最小确认（E3/O2）**：问卷后展示"已识别诉求摘要 + 最小确认"或显式声明切分，恢复"启动问一次"体验。
4. **补决策可见性**：即使无子 Agent 提问，也建议将 sddu-auto 自身关键自主决策（问卷切分、D1 修复派发等）写入决策日志（O3），使用户对"自主做了什么"有据可查。

---

## 7. 附：评估方法

- 通读 `session-ses_ff68.md`（2478 行）完整追踪 7 流程调度与决策行为。
- `find`/`ls` 实测产物落盘（17 项），与 `find` 目录树、`state.json` 内容逐项核对。
- 检索运行时日志 `opencode.log`：按 run=e7595780 过滤 `asking/replied/decision-proxy/error` 事件，确认 0 触发；按 run=d1145d64 提取 login-1 实证链路（决策会话建立→LLM 流式思考→全局 reply→auto-decisions.md 落盘）。
- 对照 spec.md FR/NFR/EC 逐项取证；检查 plugin 实装（decision-proxy.js 五步链路、plugin.js event 注册、BUILD_INFO v1.1.0）。
- **契约修复后复验**：全新体验项目 `sddu-test-user-login-3`，真实路径跑 `@sddu-auto user-login`（run=8b67e366），按 `asking / intercepting question / decision session created / replied / 决策来源` 检索运行时日志，确认方案 E 真实触发（decision_count=1），详见 `verify-real-path.md`。

---

## 8. 修订记录

| 版本 | 变更说明 | 日期 | 修订人 |
|:--:|------|------|------|
| v1.0 | 初版评估：user-login-2 完整 7 流程，方案 E 机制可用但 0 触发（decision_count=0，契约抑制子 Agent 提问） | 2026-08-16 | SDDU 评估 Agent |
| v1.1 | 契约修复（v1.5「正常提问」）后复验标注：真实路径（user-login-3）方案 E 真实触发，sddu-spec 自然提问→决策会话 LLM 真思考代答→decision_count=1→auto-decisions.md 含「决策来源：sddu-auto 决策会话」；E1/E2 问题解决；核心结论由 ⚠️ 部分生效更新为 ✅ 真实路径触发（详见 verify-real-path.md） | 2026-08-16 | SDDU 验证 Agent |
