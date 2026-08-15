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

## 修订记录
> 记录本文档的版本变更历史

| 版本 | 变更说明 | 日期 | 修订人 |
|------|---------|------|--------|
| v1.0 | 初始创建 — R1 静态审查 11 文件，执行 C1~C21，识别 4 改进项（0 阻塞），结论：有条件通过 | 2026-08-15 | SDDU Review Agent |
