# 审查报告：specs-tree-autonomous-mode

> **文档定位**: SDDU 审查报告 — 逐项记录自主审查的执行结果，作为 validate 阶段的输入
> **审查策略**: review.md（包含 C1~C21 审查清单及四维度指引）
> **前置依赖**: review.md（审查策略）、spec.md（需求规范）、plan.md（技术方案）、build.md（构建产物）
> **创建人**: SDDU Review Agent
> **创建时间**: 2026-08-15
> **审查轮次**: R1
> **版本**: v1.0
> **更新人**: SDDU Review Agent
> **更新时间**: 2026-08-15
> **更新说明**: 初始创建 — 静态审查 11 个文件，逐项执行 C1~C21 清单，识别 4 个改进项（0 阻塞）

## 1. 审查概要
> 审查结果的量化总览

| 维度 | 数值 |
|------|:--:|
| 审查项总数 | 21 |
| 通过 | 16 |
| 警告 | 5 |
| 失败 | 0 |
| 阻塞问题 | 0 |

## 2. 逐项审查结果（C1~C21）
> 对照 review.md 中定义的审查清单，逐项评估并记录发现

| # | 审查对象 | 审查基准 | 评估 | 发现 | 严重程度 |
|---|---------|---------|:--:|------|:--:|
| C1 | decision-proxy.ts 本地类型声明与 SDK v2 事件形状对齐 | ADR-018 / v2 SDK types.gen.d.ts | ✅ | `QuestionAskedProperties`（id/sessionID/questions/tool）与 v2 `EventQuestionAsked.properties` 完全一致；`session.created` 解析 `properties.sessionID` + `info.parentID` + `info.agent` 与 v2 `EventSessionCreated`（`{sessionID, info: Session}`）对齐；`Session.agent` 字段在 v2 存在（types.gen.d.ts L92）。本地最小类型声明规避根 1.16.2 v2 子路径损坏，设计合理 | 无 |
| C2 | decision-proxy.ts 三级代答兜底 | ADR-018「reply 代答通道」 | ✅ | 通道 1 `client.v2.session.question.reply({sessionID, requestID, questionV2Reply:{answers}})` 与 v2 sdk.gen.d.ts `V2SessionQuestionReply` 签名精确对齐；`answers: string[][]` 对应 `QuestionV2Answer = Array<string>` 的数组。⚠️ 通道 3 `httpReplyQuestion` 在 `res.ok === false` 时 `throw Error`，而 `handleQuestionAsked` 未 try-catch 包裹（decision-proxy.ts L342-367），HTTP 兜底失败会冒泡至 event hook | 低 |
| C3 | SessionRegistry / DecisionEngine / DecisionProxy 职责单一性 | ADR-021 | ✅ | 三类职责清晰分离（映射登记 / 硬决策 / 编排代答），依赖注入（client/directory/serverUrl/contextFile）替代全局单例，与 ADR-021「依赖传递」原则一致 | 无 |
| C4 | 硬编码值检查 | 编码规范 | ⚠️ | `contextFile` 路径 `directory + '/.sddu/specs-tree-root/auto-context.json'`（plugin.ts L70）为硬编码，且**该文件无任何生产者**（grep 全库仅 plugin.ts 一处引用）；`'.sddu/specs-tree-root'` 字符串在 tools.ts/hooks.ts/plugin.ts 多处重复（既有遗留 + 本次新增） | 中 |
| C5 | FR-001 第三调度入口注册 | FR-001 | ✅ | opencode.json.hbs agent 块新增 `sddu-auto`（L72-76，prompt 指向 `{file:agents/sddu-auto.md}`）；build-agents.cjs `specialAgents` 加入 `'sddu-auto'`（L145） | 无 |
| C6 | FR-002 七阶段顺序调度 | FR-002 | ✅ | sddu-auto.md.hbs §5.2 定义 7 阶段顺序表（discovery→spec→plan→tasks→build→review→validate）+ 严格串行规则（L104-109） | 无 |
| C7 | FR-003 启动阶段唯一交互点 | FR-003 / ADR-019 | ✅ | 模板 §3 双阶段模型 + 切分点判据（显式表态 / 最小充分集静默超时）+ §4 六维问卷 | 无 |
| C8 | FR-004 执行阶段绝不问人 | FR-004 | ✅ | 模板 §5.1 四条硬约束（绝不问人 / 问题由 sddu-auto 答复 / 拿不准硬决策 / 外部信息缺失硬推进） | 无 |
| C9 | FR-005 子 Agent 零改动 | FR-005 / NG-001 | ✅ | `git diff --name-only` 对 7 个 `sddu-{discovery,spec,plan,tasks,build,review,validate}.md.hbs` 输出为空，零改动确认 | 无 |
| C10 | FR-006 提问重定向代答 | FR-006 / ADR-018 方案 D | ✅ | decision-proxy 四步链路完整：① event hook 订阅 question.asked（L372-396）② SessionRegistry.isInterceptTarget 识别子会话（L348）③ DecisionEngine 决策（L354-355）④ replyQuestion 代答（L366）。问题不到达终端用户 | 无 |
| C11 | FR-007 全套产物沉淀 | FR-007 / NFR-002 | ✅ | 模板 §5.2 阶段产物表（discovery.md~validate.md）+ 完成汇报模板（§7.3） | 无 |
| C12 | FR-008 进入即自主 | FR-008 | ✅ | 模板 §1「核心特点：进入即自主，无复杂度门槛」+ §8 规则 1 | 无 |
| C13 | FR-009 / FR-010 边界不越界 | FR-009 / FR-010 / NG-002 / NG-003 | ✅ | 模板 §1 职责边界（不改造子 Agent / 不修正回退）+ §8 规则 6/9 + §9 异常表 EC-001~005 | 无 |
| C14 | NFR-001 六维启动问卷 | NFR-001 / ADR-019 | ✅ | 模板 §4 六维表，前三项（背景/目标/范围）标注必采，构成最小充分信息集 | 无 |
| C15 | NFR-003 信息不足硬决策 | NFR-003 / EC-002 | ✅ | `DecisionEngine.decide`（decision-proxy.ts L185-192）无选项时返回 `customDecision` 确定性答案，绝不返回空/抛错/反问；单测「信息完全不足仍返回非空确定答案」覆盖 | 无 |
| C16 | ADR-018 方案 D 四步链路落地正确性 | ADR-018 / spike | ⚠️ | 四步链路本身正确（订阅/识别/决策/代答均落地）。但 ADR-018 承诺的「注入启动诉求 + 项目上下文」作为决策依据，其通道 `contextFile`（auto-context.json）**无生产者**——`refreshLaunchIntent`（L286-305）永远读不到文件，`launchIntent` 恒为空，`keywordHaystack` 仅含 projectDirectory，`matchOption` 退化为「选首个选项」，决策质量与「依赖启动诉求」的设计意图脱节 | 中 |
| C17 | ADR-021 plugin.ts 拆分行为零变化 | ADR-021 / TASK-002 | ✅ | 对照 git HEAD plugin.ts 逐行核对：3 工具（sddu_update_state / sddu_tag_feature / sddu_get_all_states）与辅助函数（legacyStatusToPhase / readFeatureState / writeFeatureState）逐字一致；4 hook（session.created / file.edited / session.idle / session.end）逻辑一致，仅全局单例 `globalAutoUpdater/globalStateMachine` 改为依赖注入（session.end 去掉置空语句，依赖注入模式下等价） | 无 |
| C18 | ADR-019 边界切分 + ADR-020 决策追溯 | ADR-019 / ADR-020 | ⚠️ | ADR-019 边界切分点在模板 §3 完整落地。但 ADR-020 决策「轻量纳入本期范围」的 `auto-decisions.md` **无生产者**：decision-proxy 代答发生在协议层（进程内），仅 `log('info', ...)` 不落盘；而 sddu-auto 主 Agent 收不到被拦截的子会话提问（FR-006 要求提问不达用户，主 Agent 也不可见），模板 §6「维护 auto-decisions.md」的指令在架构上无法执行——决策者（proxy）与记录者（模板）之间无数据通道 | 中 |
| C19 | README §175 工程约束 | README.md §175 | ✅ | 变更文件全部落在设计态源码：src/（decision-proxy.ts、tools.ts、hooks.ts、plugin.ts、opencode.json.hbs、sddu-auto.md.hbs、__tests__/）、scripts/build-agents.cjs、e2e/ 两脚本。未触碰 .opencode/ 运行时副本与 .sddu/ 其他产物。state.json/tasks.md/TREE.md/ADR-018.md 的修改属流程产物正常更新（非实现目标） | 无 |
| C20 | 18 单测覆盖核心链路 | TASK-003 验收标准 | ✅ | 18 单测有效：SessionRegistry 6 个（主/子/孙会话匹配、非 auto 不拦截、registerChild 拒绝误拦截）、DecisionEngine 5 个（硬决策/关键词匹配/自由文本/完全无信息/decideAll）、DecisionProxy 6 个（拦截代答/非目标透传/session.created 登记/chat.message 兜底/未知事件/dispose）。断言有效（replySpy 参数断言 + 答案内容断言） | 无 |
| C21 | 测试覆盖边界/错误场景 | 测试质量 | ⚠️ | 覆盖缺口：① `refreshLaunchIntent`（contextFile 懒加载）无测试；② `httpReplyQuestion`（HTTP 兜底）无测试；③ 三级代答兜底降级顺序（v2→全局→HTTP）仅测 v2 通道 | 低 |

## 3. 审查维度汇总
> 按四维度统计审查结果

| 审查维度 | 审查项数 | 通过 | 警告 | 失败 | 通过率 |
|---------|:--:|:--:|:--:|:--:|:--:|
| 代码质量 | 4 | 2 | 2 | 0 | 50% |
| 规范符合性 | 11 | 11 | 0 | 0 | 100% |
| 架构一致性 | 4 | 2 | 2 | 0 | 50% |
| 测试质量 | 2 | 1 | 1 | 0 | 50% |

## 4. 阻塞问题
> 必须修复后才能进入 validate 阶段的问题

无阻塞问题。

## 5. 改进建议
> 非阻塞但建议优化的问题

| # | 位置 | 问题 | 对应 Cx | 建议 |
|---|------|------|:--:|------|
| 1 | src/adapters/opencode/plugin.ts L70 + decision-proxy.ts L286-305 | `auto-context.json` 无生产者：`refreshLaunchIntent` 永远读不到启动诉求，`launchIntent` 恒为空，决策退化为「选首个选项」，与 ADR-018「决策依赖启动诉求」脱节 | C4/C16 | 补全生产者链路：在 sddu-auto.md.hbs 模板 §4「固化自主执行上下文」处，明确要求 sddu-auto 在启动阶段将诉求写入 `.sddu/specs-tree-root/auto-context.json`（JSON 含 launchIntent/featureName）；或在 plugin.ts 通过 sddu-auto 的 task 调用参数直接注入 launchIntent |
| 2 | decision-proxy.ts（无落盘逻辑）+ sddu-auto.md.hbs §6 | `auto-decisions.md` 决策追溯无生产者：代答发生在协议层（proxy），主 Agent 收不到被拦截的提问，模板 §6 维护指令架构上不可执行 | C18 | 决策落盘下沉到 proxy：在 `handleQuestionAsked` 代答后，由 decision-proxy 将「决策点描述 + 采纳决策 + 是否硬决策」追加写入 Feature 目录的 auto-decisions.md（复用 contextFile 同级目录），实现 ADR-020 的轻量追溯；或显式将 ADR-020 降级为「本期不实现，仅模板声明」，消除架构矛盾 |
| 3 | decision-proxy.ts L342-367 | HTTP 兜底 `httpReplyQuestion` 在 res.ok=false 时 throw，未捕获，可能冒泡中断 event hook | C2 | 在 `replyQuestion` 三级兜底外包裹 try-catch，失败时 `log('error', ...)` 而非向上抛，确保 NFR-003「不阻塞」在代答通道异常时也成立 |
| 4 | src/__tests__/unit/adapters/decision-proxy.test.ts | 测试覆盖缺口：refreshLaunchIntent / httpReplyQuestion / 三级兜底降级顺序未测 | C21 | 补充 3~5 个单测：contextFile 懒加载成功/失败路径、HTTP 兜底成功/失败路径、三级通道降级顺序（mock v2 缺失时走全局/HTTP） |

## 6. 结论
> 审查最终结论

**结论**: ⚠️ 有条件通过

| 指标 | 结果 |
|------|------|
| 审查通过率 | 76%（16/21） |
| 阻塞问题数 | 0 |
| 规范符合性偏差 | 0 项（10 FR + 3 NFR + 5 EC 全部有对应实现，符合率 100%） |
| 可进入 validate | 是 |

**理由**: 方案 D 四步链路（订阅→识别→决策→代答）实现正确、健壮，事件形状与代答签名经 v2 SDK 类型定义逐字段核验对齐；子 Agent 零改动（NG-001）与行为零变化（ADR-021）经 git 历史严格确认；工程约束（README §175）完全符合；10 FR + 3 NFR + 5 EC 全部落地。无阻塞问题。存在 4 个改进项（2 中 2 低），核心是两个「生产者缺失」的架构一致性缺口——`auto-context.json`（决策依据注入）与 `auto-decisions.md`（决策追溯）均只有消费者、无生产者，影响决策质量与追溯能力，但不阻塞 FR/NFR 验收。建议在 validate 阶段前按 §5 建议补全生产者链路（尤其改进项 1），其余可在后续迭代处理。

## 7. 增量复核记录：调度者不实施权限修复（增量复核 1）

> **复核触发**: 真实体验会话发现 F7 职责越界（sddu-auto 亲自 bugfix），build 阶段分两轮修复：v1.2 文字约束 + v1.3 权限硬约束（frontmatter `edit/bash/webfetch: deny`，写文件改为 task 派发子 Agent）
> **复核对象**: `src/templates/agents/sddu-auto.md.hbs`（本次改动核心文件）
> **复核范围**: 权限配置正确性 / §4.1 派发写入方案自洽性 / 残留越界风险 / 与 coordinator 权限一致性 / 副作用评估
> **复核方式**: 静态分析（阅读模板 + 对照 opencode Agent 配置 schema `types.gen.d.ts` + `plugin/dist/index.d.ts` hook 契约 + decision-proxy 源码 + sddu-tree SKILL.md）
> **复核人**: SDDU Review Agent
> **复核时间**: 2026-08-16

### 7.1 复核结论

**结论：基本闭环（存在 1 个中等遗留缺口 + 5 个低严重度提示，0 阻塞）**

「调度者不实施」的**核心目标已达成**——`edit/bash/webfetch: deny` 从权限层面物理禁止 sddu-auto 亲自改代码、执行命令、访问网络，这是相较 v1.2 纯文字约束（可被 LLM 无视）的关键跃迁，且未误禁任何必需能力（见 7.3）。但存在 **1 个中等遗留缺口**（R1-A：§7.2 未同步）与 5 个低严重度提示（权限键准确性、措辞含糊、LLM 转写风险、sddu-fast 定位张力、coordinator 同构矛盾），均不阻塞 FR/NFR 验收。

### 7.2 逐项发现（按严重度）

| # | 严重度 | 发现 | 说明 | 建议 |
|---|:--:|------|------|------|
| R1-A | 🟡 中 | §7.2 未随权限改造同步：sddu-tree 更新导航需 bash，与 `bash: deny` 冲突 | §7.2 仍表述「加载 sddu-tree Skill → 定向更新 TREE.md」，但 sddu-tree Skill 的核心能力是调用 `node scripts/generate-tree.cjs`（bash 命令）；sddu-auto 现在无 bash 权限，无法自行执行该脚本，「更新 TREE.md」这一写文件动作与 §8 规则 11「连写文件也派发」矛盾。v1.2/v1.3 修改点清单仅覆盖 §1/§4.1/§5.2/§5.3/§5.4/§8/§9/§10，**§7 被遗漏** | §7.2 改为「task 派发子 Agent（如 sddu-fast）执行 sddu-tree Skill 更新 TREE.md」，与 §4.1 派发模式对齐 |
| R1-B | 🟡 中 | `task: allow` / `skill: allow` 是无效 permission 键（冗余但无害） | opencode Agent 配置 schema（`types.gen.d.ts` L1161-1169，1.16.2 与 1.17.4 一致）的 `permission` 字段仅支持 `edit/bash/webfetch/doom_loop/external_directory` 五键，**不含 task/skill**；这两行会被 opencode 忽略。功能无影响（task/skill 默认启用，其管控在 `tools` 字段而非 permission），但注释「调度子 Agent 保留」会误导维护者以为 task/skill 是靠这行保下来的 | 若需显式声明，改用 `tools: { task: true, skill: true }`；或直接删除这两行（默认即允许） |
| R1-C | 🟢 低 | §9「前置产物缺失」行「回退重跑该阶段」措辞含糊 | 整句虽以「派发调度对应子 Agent 执行补齐缺失产物」限定，但「回退重跑该阶段」未明确主语是「派发子 Agent 重跑」，可能被 LLM 理解为 sddu-auto 亲自回退重跑 | 改为「派发对应子 Agent 重跑该阶段」 |
| R1-D | 🟢 低 | §4.1 派发写入存在 LLM 转写失真风险 | auto-context.json 的 JSON 内容经 prompt 注入给子 Agent「原样落盘」，多一层 LLM 转写，存在改写/格式化/遗漏字段可能。有兜底（`refreshLaunchIntent` 对解析失败静默降级、不影响硬决策），可接受 | 可选优化：decision-proxy 从 `chat.message` hook 的 `output.message` 直接提取 launchIntent（绕开落盘 + 消除转写失真），需额外实现文本提取逻辑，列入后续迭代 |
| R1-E | 🟢 低 | 派 sddu-fast 写 auto-context.json 与其「零产物、无状态」定位轻微张力 | sddu-fast 定位为轻量快速模式（不产出 SDDU 产物、不触发 phase），派它落盘 SDDU 上下文文件偏离其本职；功能可行（sddu-fast edit: allow），但语义稍显勉强 | 可优先派 `general`（通用执行 agent）落盘，或接受现状（sddu-fast 仅做文件落盘、不产生流程产物） |
| R1-F | 🟢 低 | 与 coordinator 同构矛盾提示（框架级） | coordinator（sddu.md §7.2 标记命令）同样声称「更新 TREE.md」却 `bash: deny`，无法执行 generate-tree.cjs 脚本——说明「调度入口无 bash 权限」与「sddu-tree Skill 依赖 bash 脚本」的冲突是**框架级问题**，非 sddu-auto 独有。sddu-auto 与 coordinator 权限模型一致（一致地存在此矛盾） | 建议框架层面统一：sddu-tree Skill 提供非 bash 更新通道，或明确「TREE.md 更新一律由具备 bash 权限的子 Agent 派发执行」 |

### 7.3 权限配置正确性确认

**核心确认：权限配置正确，未误禁必需能力，核心目标（禁实施）达成。**

| sddu-auto 职责 | 所需能力 | 是否被误禁 | 判定 |
|------|------|:--:|------|
| 启动采集六维问卷 | `question` 工具（内置交互，不受 permission 管控） | 否 | ✅ 不受影响；且 SessionRegistry 只拦截子会话、不拦主会话自身提问 |
| 调度 7 阶段子 Agent | `task` 工具 | 否 | ✅ task 默认启用，`task: allow` 虽无效键但不影响（见 R1-B） |
| 校验产物（读 discovery.md~validate.md、state.json） | `read/list/glob/grep` 只读工具 | 否 | ✅ 只读工具不在 permission deny 范围，默认可用（coordinator 同样依赖只读工具输出仪表盘，已验证） |
| 推进/校验 phase | `/tool sddu_update_state`（plugin tool，内部 Node fs 写 state.json） | 否 | ✅ 经 `/tool` 调用而非 bash，`bash: deny` 不阻断；写 state.json 属调度者状态校验本职（与 coordinator `@sddu 标记` 同构），非「实施性动作」越界 |
| 加载 Skill（sddu-tree） | `skill` 工具 | 否（但见 R1-A） | ⚠️ skill 加载本身不受限，但 sddu-tree Skill 的执行动作需 bash，受 `bash: deny` 阻断 |
| 完成汇报 | 输出文本 | 否 | ✅ 纯输出，无工具依赖 |
| 亲自改代码 / 执行命令 / 访问网络 | `edit/bash/webfetch` | **是（这正是目标）** | ✅ deny 生效，杜绝亲自实施 |

> **结论**：`edit/bash/webfetch: deny` 精确命中「亲自实施」的三条通道，未误伤任何调度必需能力（task/read/question/skill 加载均不受影响）。唯一受影响的是「sddu-tree 更新导航」这一收尾动作（R1-A），需改为派发。

### 7.4 §4.1 派发写入方案自洽性评估

**结论：方案自洽，可工作；存在可接受的转写风险与一个更优方向。**

- **自洽性** ✅：生产者/消费者语义清晰（生产者 = sddu-auto 产出内容，落盘动作由执行 agent 完成；消费者 = decision-proxy `refreshLaunchIntent` 懒加载）；写入失败不阻塞（`refreshLaunchIntent` 对 JSON 缺失/损坏 try-catch 静默降级，维持既有上下文硬决策）；「先落盘、后调度 discovery」的时序保证第一个决策点有启动诉求锚定。
- **转义/格式风险** ⚠️：JSON 内容经 prompt 注入给子 Agent 由 LLM「原样落盘」，中文内容与特殊字符（引号/换行）存在转义与忠实度风险；因消费者有兜底，风险被限制在「决策质量退化」（launchIntent 为空 → 选首个选项），不导致功能失败。
- **更优方案（建议方向，非本次缺陷）**：decision-proxy 的 `chat.message` hook 已携带 `output.message: UserMessage`（`plugin/dist/index.d.ts` L187-199），可从 sddu-auto 主会话的消息直接提取 launchIntent，**绕开 auto-context.json 落盘**、消除 LLM 转写失真、且决策依据来自协议层捕获的真实对话。代价是需新增 message 文本解析 + 意图提取逻辑。建议列入后续迭代优化。

## 修订记录
> 记录本文档的版本变更历史

| 版本 | 变更说明 | 日期 | 修订人 |
|------|---------|------|--------|
| v1.0 | 初始创建 — R1 静态审查 11 文件，执行 C1~C21，识别 4 改进项（0 阻塞），结论：有条件通过 | 2026-08-15 | SDDU Review Agent |
| v1.1 | 增量复核 1 — 针对「调度者不实施」权限修复（v1.2 文字约束 + v1.3 权限硬约束）静态复核 `sddu-auto.md.hbs`：核心目标闭环（edit/bash/webfetch deny 生效），识别 1 中等遗留缺口（R1-A §7.2 sddu-tree 需 bash 未同步）+ 5 低严重度提示（R1-B 权限键无效 / R1-C 措辞含糊 / R1-D LLM 转写风险 / R1-E sddu-fast 定位张力 / R1-F coordinator 同构矛盾），0 阻塞 | 2026-08-16 | SDDU Review Agent |
