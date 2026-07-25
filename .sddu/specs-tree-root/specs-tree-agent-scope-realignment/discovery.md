# 问题挖掘报告：plan/review/validate 职责回归改造

> **文档定位**: SDDU 问题挖掘报告 — 记录架构成熟度问题、职责越界问题和影响范围，作为 spec 阶段的输入  
> **前置依赖**: 无（工作流起点；上下文来自 ROADMAP.md §FR-AGENT-SCOPE-001 的预分析）  
> **创建人**: SDDU Discovery Agent  
> **创建时间**: 2026-07-25  
> **版本**: v1.0  
> **更新人**: SDDU Discovery Agent  
> **更新时间**: 2026-07-25  
> **更新说明**: 初始创建 — 对 FR-AGENT-SCOPE-001 进行问题挖掘（dogfooding 场景：SDDU 用自身流程改造自身的 Agent 模板）

## 1. 问题定义
> 概括核心问题及其业务影响，回答"为什么需要关注"

| 核心问题 | 业务影响 | 不解决的成本 |
|---------|---------|------------|
| **plan §5.8/§5.9 越界代笔**：plan 的「产物审查策略」和「产物验证策略」是为 review/validate 代笔的工作清单，但 plan 作为技术设计师，缺乏审查和验证的领域视角，写出的策略模板化、不具体、薄弱——用户原话："plan 写得模板化、不具体，不知道 C1~CN 审查清单、V1~VN 验证场景该落到什么粒度" | review/validate 每次启动时「第一步读 plan 策略」→ 被动消费 plan 的薄弱输出 → 审查/验证每次都是"无准备的仗"（用户原话）→ SDDU 框架自身的质量闭环存在结构性缺陷 | 新 Feature 的 review/validate 质量持续走低；框架质量信心动摇；Issue F（ROADMAP: "review/validate 阶段未经设计规划"）长期悬而未决，SDDU 的质量保证链条最薄弱的一环反复被击穿 |
| **review/validate 被动依赖 plan**：当前 review.md §1/§3/§6 和 validate.md §1/§3/§5.0 均硬编码「第一步读 plan 策略」的依赖关系，把自身的审查清单和验证场景委托给 plan 代笔，而非自主定义 | review/validate 被设计成"plan 驱动"模式，但 plan 是薄弱的驱动源——这导致 review/validate 即使有能力做好，也因为入口依赖而受限于 plan 的输出质量 | review/validate 的 Agent 能力始终无法充分释放；即使它们的模板本身包含丰富的静态分析/动态验证方法论（review §5.1~5.4 / validate §5.1~5.5），启动路径的"先读 plan 策略"限制使其受制于上游 |
| **架构设计假设被证伪**：SDDU 早期假设"技术设计师（plan）应同时定义下游阶段的审查/验证策略"——这假设了 plan 具备 review/validate 的领域知识，但实证数据表明 plan 产出的「审查策略」和「验证策略」从未产出过一条具体的 C1~CN 或 V1~VN | 这个失效假设是 SDDU 架构的暗债——每新增一个 Feature，该暗债就复制一次（18 个已完成 Feature 的 plan.md 均含 §8/§9 薄策略），累计影响随功能量线性增长 | 若不根治，该设计缺陷将永久固化在 SDDU 的工作流模板中，被所有用户项目继承并放大 |

## 2. 受影响的 Agent 与工作流场景
> 描述受影响的 Agent 角色及其当前工作流，回答"谁遇到了什么问题"（dogfooding 场景适配：传统"用户画像"替换为"受影响 Agent"）

| Agent 角色 | 当前工作流场景 | 关键痛点（用户原话/设计发现） | 当前应对方式 |
|---------|---------|-------------------|------------|
| **sddu-plan**（核心受影响方） | 执行 §5.1~§5.7 的技术设计后，在模板要求下额外产出 §5.8「产物审查策略」和 §5.9「产物验证策略」。但 plan 是技术设计师，不是审查专家也不是验证专家——它无法定义"该查哪些 C1~CN"和"该测哪些 V1~VN" | "让技术设计师写质检员该查什么和测试工程师该测什么"（用户原话）——plan 产出的策略始终是模板化通用表（"审查产物 build.md，基准 spec.md"），从未产出一条具体的审查清单项 | plan 的 agent 模板中 §5.8/§5.9 共 ~10 行（详见 `src/templates/agents/sddu-plan.md.hbs` L112-120），每次执行时填入完全相同的通用内容。产出模板（`sddu-plan.md.hbs`）的 §8/§9 仅为 2 行表格骨架（审查产物 | 审查基准 / 验证产物 | 验证基准） |
| **sddu-review**（核心受影响方） | 启动时 §1/§3/§6 均要求「先读 plan.md 中的产物审查策略」——期望 plan 提供了 C1~CN 审查清单。但实际上 plan 的策略从未提供过一条具体清单项，review 每次都需要"从零开始"自主构建审查维度 | "好似无准备的仗"（用户原话）——review 模板本身包含丰富的审查方法论（§5.1 代码质量、§5.2 规范符合性、§5.3 架构一致性、§5.4 测试质量），但入口依赖 plan 的薄弱策略使其启动状态被动 | 实证表明（`specs-tree-skill-system/review.md`），review Agent 在缺少 plan 提供的 C1~CN 时，实际上**自行组织**了 C1~C18 审查清单（按审查维度自分类），即 review 有能力做好，但它被设计成"等待 plan 派活"的模式掩盖了其自主能力 |
| **sddu-validate**（核心受影响方） | 启动时 §1/§3/§5.0 均要求「第一步读 plan.md 中的产物验证策略」——期望 plan 提供了 V1~VN 验证场景。但实际上 plan 的策略仅有通用表格，4/12 项场景在 runtime 标注为 ⏭️ "need runtime"，验证的有效性大打折扣 | "验证的第一步永远是读取 plan.md 中的「产物验证策略」章节——plan 定义的验证场景是你最重要的任务清单"（`sddu-validate.md.hbs` §1 原文）——但 plan 从未定义过一条具体的验证场景 | 实证表明（`specs-tree-skill-system/validation.md` §9），validate 被迫执行 plan 的 12 条薄策略，其中 4 条因过于泛化无法执行（标注 ⏭️）。validate §5.0 写了 fallback："如果 plan 中无「产物验证策略」章节，跳过本步骤"——这意味着策略缺失时 validate 的"plan 驱动"模式直接降级 |
| **sddu-tasks**（间接受影响方） | tasks 读取 plan.md 生成任务分解。如果 plan 的 §5.8/§5.9 被剥离，tasks 的工作流不受直接影响——但 tasks 产出的 tasks.md 是 build 的输入，而 build 产出是 review/validate 的输入。改造后，如果 plan 不再定义"有哪些产物该被审查/验证"，tasks 和 build 产出的完整性可能没有被下游明确"点名" | 间接关联：如果 review/validate 自主后需要基于"什么产物存在"来设计审查策略，那么 plan 的 §5.5 文件影响分析（产物清单）作为 tasks/build 的输入物 → review/validate 的输入物，需要被 review/validate 可靠获取 | 当前 tasks 和 build 不感知 review/validate 的输入需求；这个环节属于下游消费模式变更，而非 tasks/build 本身的职责问题 |
| **sddu-build**（间接受影响方） | build 生成构建产物（代码、测试、配置），产出被 review/validate 消费。如果 plan 不再定义"哪些产物该审查/验证"，build 产物可能缺少 review/validate 需要但 plan 未曾关注到的产物（如 dist/ 中的构建输出、BUILD_INFO.json 等元数据文件） | 间接关联：review/validate 自主后可能需要增加对 build 产物类型的覆盖范围（如不只是"src/ 源码 + tests/ 测试"，还需检查构建脚本、package 配置等 plan 文件影响分析中未显式列出的产物） | — |

## 3. 问题清单
> 按影响程度分级梳理所有识别到的问题，每项赋予唯一编号 Q-xxx

### 3.1 核心问题
> 影响面大、频率高、结构性缺陷，是改造的核心驱动力

| ID | 问题描述 | 影响范围 |
|----|---------|---------|
| **Q-001** | **plan 职责越界：§5.8「产物审查策略」由 plan 代笔**。plan 的核心职责是技术设计（架构分析、方案对比、ADR、文件影响分析），但当前模板要求它额外产出审查策略——定义"审查哪些产物"和"用什么基准审查"。plan 不具备审查领域知识，产出的策略始终是模板化的通用表（"审查产物 build.md、src/、tests/，基准 spec.md、ADR"），从未产出过具体的 C1~CN 审查项。**信息来源**：用户原话 + 代码分析（所有 18 个已完成 Feature 的 plan.md 的 §8 均为相同的 3 行通用表，无一例外） | plan Agent 模板自身（`sddu-plan.md.hbs` §5.8）+ plan 产出模板（`sddu-plan.md.hbs` §8）+ 18 个已完成 Feature 的 plan.md |
| **Q-002** | **plan 职责越界：§5.9「产物验证策略」由 plan 代笔**。同上，plan 产出的验证策略始终是模板化的通用表（"验证产物 src/、tests/、构建脚本，基准 FR/NFR/EC、性能阈值"），从未产出过具体的 V1~VN 验证场景表。实证：`specs-tree-skill-system/validation.md` §9 的 12 条"plan 验证策略"中 4 条因过于泛化而标注 ⏭️（无法在当前环境执行） | plan Agent 模板自身（`sddu-plan.md.hbs` §5.9）+ plan 产出模板（`sddu-plan.md.hbs` §9）+ 18 个已完成 Feature 的 plan.md |
| **Q-003** | **review 的结构性被动依赖**。当前 `sddu-review.md.hbs` 中 3 处位置硬编码了对 plan 策略的依赖：§1（"审查的产物清单和基准以 plan.md 中「产物审查策略」章节为准，该章节定义的审查清单 C1~CN 是你的首要检查项"）、§3（"审查的产物清单和基准见 plan.md 中「产物审查策略」章节"）、§6（"审查的产物和基准见 plan.md 中「产物审查策略」章节"）。但 plan 从未定义过 C1~CN，review 每次都需要在"找不到 plan 给的清单"的状态下自行构建审查维度——明明 review §5.1~5.4 已有丰富的审查方法论，却被入口依赖限制了自主发挥 | review Agent 模板（`sddu-review.md.hbs` §1/§3/§6）+ 所有使用 review 的 Feature |
| **Q-004** | **validate 的结构性被动依赖**。当前 `sddu-validate.md.hbs` 中 4 处位置硬编码了对 plan 策略的依赖：§1（"验证的第一步永远是读取 plan.md 中的「产物验证策略」章节"）、§3（"验证的产物清单和基准见 plan.md 中「产物验证策略」章节"）、§5.0（"读取 plan.md 的「产物验证策略」章节，逐项执行其中定义的验证场景"）、§6（"验证的产物和基准见 plan.md 中「产物验证策略」章节"）。但计划从未定义过 V1~VN，validate §5.0 的 fallback 逻辑（"如果 plan 中无「产物验证策略」章节，跳过本步骤"）在其实际运行中从未被触发（因为 plan 总是有 §9，只是内容是空的），但"执行空策略"同样无效 | validate Agent 模板（`sddu-validate.md.hbs` §1/§3/§5.0/§6）+ 所有使用 validate 的 Feature |

### 3.2 次要问题
> 影响面中等、或为核心问题的衍生问题

| ID | 问题描述 | 影响范围 |
|----|---------|---------|
| **Q-005** | **plan 产出模板的 §8/§9 与「谁需要谁设计」原则冲突**。`src/templates/outputs/sddu-plan.md.hbs` 目前将 §8「产物审查策略」和 §9「产物验证策略」定义为 plan 产出的正式章节。这些章节的存在本身就暗示"审查策略由 plan 定义"——与本次改造的目标「review/validate 自主定义策略」相矛盾。即使 plan agent 模板剥离了 §5.8/§5.9，只要产出模板还保留了 §8/§9，下游 review/validate 仍可能尝试从中读取策略 | plan 产出模板（`sddu-plan.md.hbs`）+ plan agent 模板（`sddu-plan.md.hbs` 的完成协议未提及审查/验证策略的输出） |
| **Q-006** | **plugin copies 同步的维护负担**。每个 Agent 模板在项目中同时存在于两个位置：`.opencode/agents/sddu-*.md`（实际运行时版本）和 `.opencode/plugins/sddu/agents/sddu-*.md.hbs`（plugin 源版本）。每次修改 Agent 模板都需要同步两个副本——本次改造涉及 3 个 Agent 模板的 2 份副本（共 6 个文件），且产出模板也需要同步修改（3 个产出模板） | 6 个 Agent 模板文件（plan×2 + review×2 + validate×2）+ 3 个产出模板文件（plan/review/validate output templates） |
| **Q-007** | **review/validate 的输出模板可能需要扩展**。如果 review/validate 变为自主定义策略，review 的输出模板可能需要新增「自主审查清单 (C1~CN)」章节来承接其新生成的审查策略；validate 的输出模板可能也需要类似的「自主验证场景 (V1~VN)」章节。当前两个输出模板均无此章节——它们预设审查/验证清单来自 plan 而非 review/validate 自身 | review 产出模板（`sddu-review.md.hbs`）+ validate 产出模板（`sddu-validate.md.hbs`） |
| **Q-008** | **plugin copies 和 .opencode/agents/ 之间的模板版本关系不透明**。当前机制通过 `build-agents.cjs` 将 `.hbs` 源模板渲染为 `.md` 分发到 `.opencode/plugins/` 中，但没有明确文档说明「运行时版本」和「源版本」之间的对应关系。改造涉及双向变更（源模板修改 + plugin copies 同步），若同步遗漏会导致 Agent 实际行为与模板意图不一致 | `build-agents.cjs` + `install.sh` + 6 个 Agent 模板文件的 plugin copy |

### 3.3 潜在问题
> 目前影响小但可能恶化，或信息不足待验证

| ID | 问题描述 | 影响范围 |
|----|---------|---------|
| **Q-009** | **已完成 Feature 的 backward compatibility 风险**。已有 18 个 validated Feature 的 `plan.md` 中包含旧格式的 §8/§9（包含固定的审查策略和验证策略）。改造后 review/validate 不再依赖 plan 的策略章节——已完成 Feature 不受直接影响（已完成，不再触发 review/validate）。但如果新 review/validate Agent 在处理一个「有 plan.md 但无审查策略」的新 Feature 时，是否可能因读到旧格式 plan 而产生混淆？（问题级别低：review/validate 按改造后设计应忽略 plan 的策略章节，无论其是否存在） | 18 个已完成 Feature 的 plan.md |
| **Q-010** | **"产物清单归属"的架构边界未划定**。plan 的 §5.5 文件影响分析天然产出了"有哪些产物该被审查/验证"的清单（产物清单），但"怎么查/怎么验"（审查/验证策略）应由 review/validate 自主。当前 plan 的 §5.8/§5.9 将两者混为一谈——既定义了产物列表，又定义了（薄弱的）审查基准。剥离 §5.8/§5.9 后，产物清单是否还应由 plan 提供？还是 review/validate 应完全自主从 spec+plan+产物中提取？这是本次改造的**核心架构决策**，直接影响 scope 边界（详见第 7 节的开放问题） | plan §5.5 文件影响分析、review 自主策略设计、validate 自主策略设计 |
| **Q-011** | **SDDU 框架自身的 dogfooding 边界**。当前 SDDU 用于改造自身 Agent 模板，但改造的是"流程引擎"本身——这相当于"用手术刀给自己做手术"。生产环境中的 Agent 模板在改造进行期间不能离线，任何中间状态都可能产生模板预期与实际行为不一致的问题。需要确保改造的原子性（一次性完成所有模板的同步修改 + 构建 + 安装） | 全部 12 个 Agent 模板的生产环境 + 3 个核心 Agent（plan/review/validate）的运行时行为 |

## 4. 竞品参考
> 记录同类框架/工具对类似问题的处理方式，回答"别人怎么做的、我们有什么不同"（dogfooding 场景适配：传统"竞品调研"替换为"同类框架的审查/验证分工模式参考"）

| 竞品/参考 | 是否处理过类似问题 | 处理方式 | 与我们场景的差异 |
|------|-------------------|---------|----------------|
| **Superpowers** | ✅ 部分相关 | Superpowers 的 skills-based architecture 中，skills 各自独立定义自己的"execution contract"，不依赖上游 agent/skill 为下游定义策略。其 `using-superpowers` skill 提供了全局的质量指引框架，但每个 skill 的 verify/validate 步骤由 skill 自身定义 | Superpowers 是 skills-based（Skills 负责完整流程），SDDU 是 pipeline-based（Agent 串行接力）。SDDU 的上下游依赖链更严格，改造复杂度更高——需要确保 plan→tasks→build→review→validate 的接力棒传递方式正确变更 |
| **Anthropic Skills / OpenCode Skill 系统** | ⚠️ 部分相关 | 每个 Skill 独立描述其"前置条件/后置条件/验证方式"，不依赖其他 Skill 为其定义验证策略。Skill 作者即 Skill 的 domain expert，天然遵循"谁需要，谁设计"原则 | Skills 是独立能力单元，SDDU Agents 是工作流中的接力阶段。Skills 天然不存在"上游替下游写策略"问题，但 SDDU 的 pipeline 架构创造了这种越界条件——这个对比从反面印证了"pipeline 中的阶段间策略代笔"是一个架构特有的反模式 |
| **传统 CI/CD Pipeline（Jenkins/GitLab CI）** | ✅ 高度相关 | 每个 Pipeline Stage 自主定义自己的执行逻辑，上游 Stage 只产出中间产物（artifacts），不定义下游 Stage 的"执行策略"。例如，build stage 产出 binary → test stage 自主定义测试策略（选哪些测试框架、覆盖什么场景）→ deploy stage 自主定义部署策略 | SDDU 的核心差异在于：SDDU 的 Agents 是 AI Agent（而非确定的脚本），其行为依赖于 prompt 指令。plan 的 §5.8/§5.9 本质上是"在两个 AI Agent 之间传递 prompt 指令"，但传递的是"一个 AI 为另一个 AI 写的策略"，而这种跨 Agent 的"策略代笔"在 AI Agent 间引入了领域知识鸿沟 |

## 5. 假设与风险
> 记录问题挖掘过程中识别的假设和风险，供后续阶段验证和关注

### 5.1 关键假设
> 记录我们对问题理解所基于的假设，标注待验证项

| # | 假设内容 | 验证方式 |
|---|---------|---------|
| **A-001** | review 和 validate Agent 具备自主定义高质量审查/验证策略的能力——即 review 的 §5.1~5.4 方法论 + validate 的 §5.1~5.5 方法论足够支撑其从 spec+plan+产物 中自主提取审查维度（C1~CN）和验证场景（V1~VN）。**假设程度：中高**。实证表明 review 已能在缺少 plan 策略时自产出 C1~C18（`specs-tree-skill-system/review.md`），但 validate 的自主能力较少实证 | 在 spec 阶段定义具体的"自主策略设计指南"后，以 FR-AGENT-SCOPE-001 自身的 review/validate 作为第一个验证案例（自举验证）。如果 FR-AGENT-SCOPE-001 的 review 能自产出高质量的 C1~CN，则 A-001 通过 |
| **A-002** | plan 的 §5.5「文件影响分析」产出的产物清单，作为 review/validate 的输入是"充分且合理的"——即 review/validate 自主定义策略不需要比"哪些文件被变更了"更多的产物上下文。**假设程度：中**。如果 review 需要比文件列表更多的信息（如"每个文件的预期复杂度"或"本 Feature 的关键架构风险点"），则产物清单可能不够 | 观察 FR-AGENT-SCOPE-001 自身的 review 是否只依赖 plan 的 §5.5 文件影响分析就能自产出审查清单。如果 review 在自产出过程中频繁回查 plan 的其他章节（如 §4 推荐方案、§6 风险评估），说明产物清单之外的信息也是审查的输入，需在改造中处理 |
| **A-003** | 剥离 plan 的 §5.8/§5.9 不会导致 plan.md 作为完整技术方案文档的章节结构出现"断层"——即 §5.7（生成 ADR）到 plan 的完成协议之间不需要 §5.8/§5.9 来"填充"，其他章节的组合已构成完整的技术设计输出。**假设程度：低**。plan 的核心价值在 §5.2~§5.7，§5.8/§5.9 一直是"附录"性质量，剥离应属自然 | plan Agent 模板改动后，运行一次完整 plan 流程（对 FR-AGENT-SCOPE-001 自身），检查产出的 plan.md 是否感觉"完整"——由用户确认 |
| **A-004** | 改造不需要修改 SDDU 的状态机（`sddu_update_state`）或 coordinator（`@sddu` 入口）——改造仅涉及 Agent 模板内容和输出模板格式，不影响工作流阶段衔接、状态流转和产物依赖链。**假设程度：低** | 检查 `sddu_update_state` 和 coordinator 模板是否引用了 plan 的 §5.8/§5.9 或 review/validate 的 plan 依赖行为。确认无依赖后，该假设通过 |

### 5.2 主要风险
> 识别可能影响问题判断或后续决策的风险因素

| # | 风险描述 | 影响程度 |
|---|---------|:------:|
| **R-001** | **自主策略质量退化风险**。剥离 plan 的策略后，如果 review/validate 的自主策略设计指南不够具体，可能导致新 review/validate 产出的审查/验证质量比之前"有 plan 薄策略但 review 自己补全"的质量更低——即"本来有 50 分底线的纸，撕掉后直接交白卷"。**但已有证据表明这种风险可控**：`specs-tree-skill-system/review.md` 在 plan 只提供薄策略的情况下已能自产出 C1~C18，说明 review 的自主能力是存在的，关键是将这能力从"隐式补全"提升为"显式方法论" | 🔴 高 |
| **R-002** | **plan 剥离后的空窗期**。如果按拆分方案 B（2 个子 Feature：001a plan 剥离、001b review/validate 自主），001a 完成后但 001b 未完成时，review/validate 失去了 plan 的策略输入（虽然薄但有），但尚未接入自主策略能力——产生"空窗期"中间状态。虽然 ROADMAP 推荐单 Feature（一次完成），但若 spec 阶段决定拆分，需在 001a 中预埋兜底行为 | 🟡 中 |
| **R-003** | **模板变更的回归引入**。改造涉及 6 个 Agent 模板文件（plan/review/validate × 2 副本）+ 3 个产出模板 + `build-agents.cjs` 构建脚本——这些文件的 Human Author 修改（非 AI Generated）需要逐字审查。如果同步出现遗漏（例如改了一处 plan Agent 模板但遗漏了 plugin copy），会导致生产环境与实际模板行为不一致 | 🟡 中 |
| **R-004** | **"产物清单归属"决策的 Scope 漂移**。如果用户选择 Option A（plan 仍提供产物清单，但不定义策略），改造 scope 可控（plan 保留 §5.5 + 增强产物清单结构化，剥离 §5.8/§5.9）。如果用户选择 Option B（review/validate 完全自主，包含提取产物清单），scope 扩大——review/validate 需要新增"产物发现"能力，Effort 从 ROADMAP 估算的 5d 可能增加到 7-8d | 🟡 中 |
| **R-005** | **已完成 Feature 的向后兼容恐慌**。虽然理论上已完成 Feature 不受影响（不再触发 review/validate），但如果用户担心未来可能对已完成 Feature 重新执行 review/validate（如 SDK 升级后回归验证），新 review/validate 在面对旧格式 plan.md（含 §8/§9）时的行为需要明确定义 | 🟢 低 |

## 6. Feature 拆分建议
> 分析问题聚类中是否隐含合理的 Feature 拆分模式，提出建议供用户决策

### 6.1 拆分模式分析

本改造涉及 3 个 Agent（plan/review/validate）的职责调整，但它们之间不是独立的平行变更——存在级联依赖：

```
plan 剥离 §5.8/§5.9 ──前提──→ review/validate 自主策略
                              │
                              ├─ review 新增自主审查能力（基于 plan §5.5 产物清单 + spec）
                              └─ validate 新增自主验证能力（基于 plan §5.5 产物清单 + spec + NFR）
```

如果没有 plan 剥离，review/validate 即使有自主能力，仍被入口的"先读 plan 策略"指令约束——这意味着三者必须协同改造，不能各自独立。

### 6.2 拆分评估

| 拆分方式 | 说明 | 优点 | 缺点 | 推荐？ |
|---------|------|------|------|:--:|
| **单 Feature**（推荐）| FR-AGENT-SCOPE-001 一次性完成 plan 剥离 + review 自主 + validate 自主，7 份文件同步改造 | 原子性：不产生中间空窗期；协同性强：plan 剥离和 review/validate 自主必须同步才有效；ROADMAP 已分析 Effort 5d 可控 | 改动面较宽（9 个文件），但每个文件改动集中在 3~4 处位置（每处 ~5~20 行） | ✅ 推荐 |
| **2 个子 Feature** | 001a: plan 剥离 §5.8/§5.9 + 产物清单规范化；001b: review/validate 各自基于产物清单自主定义策略 | 渐进式交付，风险分散；001a 可独立验证（plan 不再写策略，但产物清单清晰） | 001a 完成但 001b 未完成时，review/validate 失去策略输入——需要在 001a 中预埋"兜底行为"（如 review/validate 在找不到 plan 策略时执行默认通用流程），增加临时复杂度 | ❌ 不推荐 |
| **3 个子 Feature** | 001a: plan 剥离；001b: review 自主；001c: validate 自主 | 最细粒度控制 | 过度拆分，协调成本高；001a 的空窗期问题最严重；review 和 validate 的自主能力设计高度相关（共享"从产物清单推导策略"的方法论），分开设计会导致重复 | ❌ 不推荐 |

### 6.3 推荐结论

**推荐单 Feature 路径**，理由：
1. 三者改造具有**级联依赖**（plan 必须先剥离，review/validate 才能摆脱被动依赖），不可并行交付
2. **Effort 5d 可控**（ROADMAP 已分析），单次交付不超 Medium 级别
3. **空窗期问题**在单 Feature 中不存在——所有模板一次性同步修改
4. **plugin copy 同步**在单 Feature 中更可靠——6 个 agent 文件 + 3 个产出模板的一次性批量修改比多次修改的同步遗漏概率低

## 7. 需要用户决策的关键问题
> ⚠️ 以下问题在 discovery 阶段无法自行判断，需用户决策后传递到 spec 阶段

### Q7.1：「产物清单归属 vs 策略归属」——核心架构决策

plan 的 §5.5「文件影响分析」天然产出了"哪些产物该被审查/验证"的清单（产物清单），但"怎么查/怎么验"（C1~CN 审查清单、V1~VN 验证场景）应由 review/validate 自主。当前 plan 的 §5.8/§5.9 将两者混为一谈（既列产物，又写了薄弱的基准）。

剥离后，产物清单的归属有三种选项：

| 选项 | 方案 | pros | cons |
|:--:|------|------|------|
| **A** | plan 仍提供 `<file_manifest>` 结构化产物清单（基于 §5.5 文件影响分析增强为结构化产物清单），但不再定义"怎么查/怎么验"；review/validate 自主基于该清单生成 C1~CN / V1~VN | plan 有改动但小（§5.5 增强结构化输出）；review/validate 有明确的"输入接口"（产物清单），降低自主策略设计的不确定性 | plan 的 §5.5 需要从"列表格式"增强为"结构化清单"（如标注每个产物的类型、关键性、关联 FR），增加 plan scope |
| **B** | review/validate 完全自主——从 spec+plan+产物中自行提取产物清单，不依赖 plan 提供任何产物列表 | 各 Agent 完全独立，plan scope 最小（仅剥离 §5.8/§5.9，不改动 §5.5）；符合"谁需要谁设计"原则的最纯粹版本 | review/validate 的自主策略设计难度增加——需要先"发现产物"再"设计策略"；如果 self-discovery 遗漏关键产物（如 BUILD_INFO.json 这类 plan 未在 §5.5 中列出的构建产物），审查/验证会遗漏 |
| **C** | 折中：plan 提供产物清单（Option A），但只是**参考输入**而非**权威清单**——review/validate 在自主策略设计时以 plan 产物清单为起点，补充遗漏项 | 兼顾了 plan 的"已知产物"优势（文件影响分析天然知道改了什么）和 review/validate 的自主性（可以补充 plan 遗漏的产物） | 实现最复杂——需要 review/validate 的自主策略设计流程中增加"产物清单补充"步骤 |

> **此决策直接影响改造 scope**：Option A 下 plan scope 扩大（需增强 §5.5），review/validate scope 缩小（有结构化输入）；Option B 下 plan scope 最小，review/validate scope 扩大（需新增产物发现能力）；Option C 是中间路径，scope 适中但实现最复杂。

### Q7.2：改造是单 Feature 还是拆分

ROADMAP 推荐单 Feature（见 §6.3 分析），但最终决策在 spec 阶段。如果 spec 阶段选择了拆分，需要在拆分边界上定义"空窗期"的兜底行为（第一个子 Feature 需确保 review/validate 在 plan 策略缺失时不会崩溃）。

### Q7.3：已完成 Feature 的 plan.md 遗留 §8/§9 是否处理

18 个已完成 Feature 的 plan.md 中包含旧格式的 §8「产物审查策略」和 §9「产物验证策略」。这些 Feature 已完成（phase: validated, status: completed），理论上不会再触发 review/validate。但如果用户希望保持产物的一致性（所有 plan.md 格式统一），是否需要对已完成 Feature 的 plan.md 执行批量清理（移除 §8/§9）？

> **建议**：不对已完成 Feature 执行追溯清理——已完成 Feature 的 plan.md 是 freeze 状态的规范产物，且改造后的 review/validate 不会读取已完成 Feature 的 plan.md。但可在输出模板中标注"§8/§9 已从 plan 模板中移除（v3.0.0+），旧 Feature 的 plan.md 可能仍包含此章节"。

## 8. 下一步建议
> 给出后续工作的优先级建议，回答"接下来优先做什么"

| 优先级 | 事项 | 说明 |
|--------|------|------|
| 🔴 高 | **澄清 Q7.1「产物清单归属 vs 策略归属」** | 这是决定整个改造 scope 的核心决策——影响 plan §5.5 是否需要增强、review/validate 的自主能力需要到什么程度、总 Effort 是 5d 还是 7d+。必须由用户在 spec 启动前决策 |
| 🔴 高 | **启动 spec 阶段** — `@sddu-spec agent-scope-realignment` | discovery 完成、问题清单就绪后，由 spec Agent 将问题清单转化为需求规范（FR/NFR/EC），纳入 Q7.1 的决策作为首要决策项 |
| 🟡 中 | **验证 A-001（review/validate 自主能力假设）** | 在 spec 阶段定义"自主策略设计指南"后，以 FR-AGENT-SCOPE-001 自身的 review/validate 作为自举验证，确认假设成立 |
| 🟡 中 | **确认 Q7.3（已完成 Feature 的向后兼容处理）** | 不影响改造 scope，但影响改造完成后的文档清理策略 |

## 修订记录
> 记录本文档的版本变更历史

| 版本 | 变更说明 | 日期 | 修订人 |
|------|---------|------|--------|
| v1.0 | 初始创建 — 对 FR-AGENT-SCOPE-001 进行问题挖掘：识别 11 个问题（Q-001~Q-011）、4 项关键假设（A-001~A-004）、5 项风险（R-001~R-005）、3 项开放决策（Q7.1~Q7.3） | 2026-07-25 | SDDU Discovery Agent |
