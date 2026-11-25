# 问题挖掘报告：FR-SKILL-001 SDDU Skill 系统（双重定位）

> **文档定位**: SDDU 问题挖掘报告 — 记录用户问题、痛点和场景，作为 spec 阶段的输入  
> **前置依赖**: 无（工作流起点）  
> **创建人**: SDDU Discovery Agent  
> **创建时间**: 2026-07-18  
> **版本**: v2.0  
> **更新人**: SDDU Discovery Agent  
> **更新时间**: 2026-07-19  
> **更新说明**: **v3.0 (2026-07-19) — 用户架构决策注入：「Agent 固定 + Skill 扩展」确立为 SDDU 核心架构原则**。Skill 从「候选降级方案」提升为「SDDU 能力扩展的核心路径」。更新 §6 标题和结构（新增 §6.1 架构决策、§6.2 版本规划影响），更新 §1 核心问题（Skill 化能力扩展机制缺失），新增 §5.3 Agent 新增门禁约束，更新 §7.1 RICE Impact 理由（范式变革），新增 §8.3 Scope 边界（In/Out），更新 §9 补充框架级约束。原有「用户级 Skills」（项目特有业务流程）保留完整。

---

## 1. 问题定义
> 概括核心问题及其业务影响，回答"为什么需要关注"

| 核心问题 | 业务影响 | 不解决的成本 |
|---------|---------|------------|
| **（用户视角）项目特有业务流程知识无沉淀**，每次新会话新需求都要重新向 Agent 描述执行流程细节 | AI Agent 产出一致性差、用户重复沟通成本高、复杂业务流程易出错 | 每次"接入支付渠道"类任务需重新解释路由/验签/回调/测试流程，人效浪费且易遗漏 |
| **（框架视角）SDDU 缺乏 Skill 化的能力扩展机制**。当前所有能力扩展都必须通过新增 Agent 实现，导致：① Agent 数量膨胀，清单管理复杂；② 轻量方法论无法低成本落地（写个 Skill vs 写个 Agent 的 Effort 比是 1:10+）；③ 用户无法在 SDDU 框架内定制执行流程 | SDDU 团队/用户想增加一个轻量能力（如 bug 修复流程、TDD 工作流、代码审查清单）时，被迫按"新 Agent"的重量级路径推进，或退化为散落的 coordinator 指令片段 | 框架能力扩展成本高企，新能力上架速度慢，框架灵活性受限。用户潜在的大量轻量扩展需求被压制（或转用其他工具） |
| 现有知识机制无法覆盖项目级可复用流程知识：CLAUDE.md 静态全量加载爆 context，FR-KB-001 只管「是什么」的声明式配置，FR-KB-002 只管「过去做了什么」的聚合 | 存在明显知识管理空白区间——「未来怎么做某类事」无承载机制 | 用户只能在每次新会话中口述流程，AI 无法从已沉淀知识中自主获取执行指引 |
| 缺乏"用 LLM Agent 原生能力解决自身问题"的机制——用户有需求、平台有能力，但 DSL/手工系统的设计思路掩盖了复用平台能力的路径 | 过度设计导致开发成本高、与底层 Agent 能力割裂 | 自建扫描/匹配/加载引擎需要 3-5 天开发+持续维护，且无法享受平台升级红利 |

---

## 2. 用户画像
> 描述受影响用户角色及其场景，回答"谁遇到了什么问题"

| 用户角色 | 典型场景 | 关键痛点（用户原话） | 当前应对方式 |
|---------|---------|-------------------|------------|
| SDDU 使用者（开发者） | 需要向 Agent 描述"接入新的支付渠道"流程——路由在哪里、验签怎么写、回调怎么处理、测试怎么跑 | "每次新会话、新需求都要重新和 Agent 描述，低效繁琐" | 每次手动口述，依赖记忆+聊天历史复制粘贴 |
| SDDU 使用者（项目维护者） | 需要向 Agent 描述"数据库迁移流程"——migration 文件怎么创建、回滚策略、测试规范 | "不是配置问题，也不是历史文档聚合，是项目特有的、可复用的执行流程知识" | 维护项目 Wiki/README，但 Agent 无法自动发现和加载 |
| 新加入项目的开发者 | 接手项目后不知道特有业务流程，需要反复询问或查阅散落文档 | 隐性知识传递成本高、上手慢 | 口口相传 + 搜索历史聊天记录 |
| 🆕 **SDDU 框架扩展者**（框架维护者/社区贡献者） | 想为 SDDU 添加一个新能力（如 bug 修复流程、TDD 工作流、代码审查清单），但当前唯一路径是"写一个新 Agent"，需要完整走 Agent 生命周期：.hbs 模板 → OpenCode 注册 → 指令体系集成 → 多 Agent 路由适配 | "为一个小流程写一整个 Agent 太夸张了，像是在用重型卡车送一封信" | 要么按全 Agent 路径推进（重），要么把流程写成 coordinator 指令片段散落在路由逻辑中（散），要么放弃扩展 |
| 🆕 **SDDU 框架使用者（有扩展需求的用户）** | 对 SDDU 的工作流有自定义需求——比如希望 @sddu-build 完成后自动触发一段自定义检查清单，或希望为特定项目类型定制 discovery 访谈流程 | "我只是想在某个 Agent 执行前后插入一点自定义逻辑，不需要一整个新 Agent" | 手动修改 .hbs 模板（不优雅、难维护、升级冲突），或放弃定制 |

---

## 3. 问题清单
> 按影响程度分级梳理所有识别到的问题，每项赋予唯一编号 Q-xxx

### 3.1 核心问题
> 影响面大、频率高、用户强烈感知

| ID | 问题描述 | 影响范围 |
|----|---------|---------|
| Q-001 | **项目特有执行流程知识无处沉淀**：用户每次在使用 SDDU Agent 时，对于重复出现的某类项目特有任务（如接入支付、数据库迁移），必须重新向 Agent 口头解释执行步骤、文件位置、校验规则等。每次会话都是 clean slate，知识积累无法跨越会话复用。 | 所有 SDDU 用户的所有项目，覆盖高频的「重复描述」场景。ROADMAP RICE 评估：Reach 9 / Impact 8。 |
| Q-002 | **现有 SDDU 知识机制存在空白区间**：FR-KB-001（全局配置）承载声明式「是什么」，FR-KB-002（知识沉淀）自动聚合「过去做了什么」，但「未来怎么做某类事」的流程指引没有承载机制。三者不应混并，但空白本身是结构性问题。 | 影响所有需要沉淀流程知识的项目。用户原话："这不是配置问题（FR-KB-001 解决不了），也不是历史 Feature 文档聚合（FR-KB-002 解决不了）"。 |
| Q-003 | **存放路径设计与 OpenCode 原生能力存在冲突**：已确认设计决策要求存放于 `.sddu/skills/`，但 OpenCode 原生 skill 扫描路径为 `.opencode/skills/`、`.claude/skills/`、`.agents/skills/` 及其全局对应路径（`~/.config/opencode/skills/`、`~/.claude/skills/`、`~/.agents/skills/`），不包含 `.sddu/skills/`。若强制使用 `.sddu/skills/`，则需要 SDDU 自建扫描/加载机制或提供路径桥接方案。 | FR-SKILL-001 核心架构决策——选择「复用平台」还是「自建机制」。 |
| 🆕 Q-009 | **SDDU 能力扩展只能走「新增 Agent」路径，缺乏中间粒度**：当需要为 SDDU 增加新能力（bug 修复流程、TDD 工作流、代码审查清单、快速模式等），唯一路径是创建完整的新 Agent。每个 Agent 需要：.hbs 模板编写、OpenCode agent 注册、sddu-core 路由适配、与现有 Agent 体系的交互设计、完整的文档和测试。对于本质上只是"几段话术 + 几个步骤"的轻量能力，路径过重。 | 影响所有 SDDU 框架维护者和社区贡献者，（潜在）影响所有希望自定义 SDDU 工作流的用户。 |
| 🆕 Q-010 | **能力无法正交组合，存在"组合爆炸"风险**：当前 Agent 设计趋向「大而全」——每个 Agent 承担完整职责（如 @sddu-fast 同时包含：轻量对话策略、任务边界判断、领域知识注入、升级引导）。如果未来需要"轻量对话 + TDD 流程"或"代码审查 + bug 修复流程"，无法正交组合现有 Agent，只能创建新 Agent——导致 Agent 数量组合性增长。 | 影响 SDDU 框架的长期可维护性和扩展性。类比：如果每个 Linux 命令都是一个独立二进制且无法 pipe，sysadmin 梦魇。 |

### 3.2 次要问题
> 影响面中等、或为核心问题的衍生问题

| ID | 问题描述 | 影响范围 |
|----|---------|---------|
| Q-004 | **用户上手门槛**：用户需要了解如何编写符合 OpenCode/Anthropic 规范的 SKILL.md，包括 frontmatter 格式、description 撰写技巧（触发准确率）、body 结构等。Anthropic skill-creator 提供了完整的创建/测试/优化工作流，但 SDDU 用户可能不熟悉。 | 影响新用户，降低 skill 创建质量和触发准确率。 |
| Q-005 | **权限管理粒度**：OpenCode 原生支持 `opencode.json` 中按 skill 名称通配符设置 `allow/deny/ask`，但这一机制是否需要在 SDDU 层面做二次封装或文档指引？ | 影响多 Agent 场景下的 skill 访问控制。 |
| Q-006 | **skill 目录组织规范**：OpenCode 要求每个 skill 一个文件夹（含 SKILL.md + 可选 scripts/references/assets），但用户在 `.sddu/` 下如何组织多个 skill？需要定义命名约定和目录编排标准。 | 影响多 skill 项目的可维护性。 |
| 🆕 Q-011 | **框架级与用户级 Skill 的层次边界模糊**：如果 SDDU 提供框架级内置 Skills（如 skill-creator、bug-fix-workflow），这些 Skills 放置在何处（`src/skills/`？`~/.config/opencode/skills/sddu/`？还是 `.sddu/skills/framework/`）？如何避免用户手写的项目 Skills 与框架内置 Skills 命名冲突？当用户想覆盖框架内置 Skill 时应遵循什么规则？ | 影响框架级 Skills 的架构设计、分发机制和版本管理。 |
| 🆕 Q-012 | **Skill 粒度与 Agent 的边界线模糊**：什么做 Skill、什么做 Agent？当前 SDDU 的 7 个独立 Agent（discovery/spec/plan/tasks/build/review/validate）是合适的 Agent 粒度吗？还是某些可以内部以 Skill 方式组织？如果 Agent 内部调用 Skill，Agent 自身的指令模板与 Skill 内容如何分层？ | 影响 SDDU 框架的架构原则——何时升格为 Agent，何时保持为 Skill。 |

### 3.3 潜在问题
> 目前影响小但可能恶化，或信息不足待验证

| ID | 问题描述 | 影响范围 |
|----|---------|---------|
| Q-007 | **触发准确率验证困难**：OpenCode/Anthropic 依赖 LLM 语义匹配 description 触发 skill，用户无法预知哪些描述措辞会准确命中。Anthropic skill-creator 的 Description Optimization 流程需要 `claude -p` CLI 工具，SDDU 环境是否支持待验证。 | 若大量 skill 描述不准确，会导致"该触发未触发、不该触发误触发"的用户体验下降。 |
| Q-008 | **skill 版本演进与 git 集成**：用户手写 skill 通过 git 管理版本，但 skill 内容变更是否影响已有会话的行为？skill 更新后是否需要手动刷新？ | 长期维护场景下的版本一致性风险。 |
| 🆕 Q-013 | **框架级 Skills 的分发与版本管理**：框架级 Skills 随 SDDU 插件分发，但 Skills 本质是 Markdown 文件——其版本如何与 SDDU 插件版本（v3.1.0 / v3.2.0 / v4.0.0）对齐？用户安装插件后 Skills 自动就绪？还是需要类似 `arkcli +connect` 的安装步骤？Skills 更新是否支持增量（不覆盖用户自定义）？ | 影响框架级 Skills 的交付流程和用户体验。 |
| 🆕 Q-014 | **自举闭环的可行性**：用 `skill-creator` Skill 来创建新的用户级 Skill 是明确的；但用它来创建新的**框架级 Skill** 需要额外的质量门——框架级 Skills 需要经过完整的 discovery→spec→plan→build→review→validate 流程。`skill-creator` 是否能同时服务于这两个层次的产出质量？ | 影响「自举」的完整性——如果框架级 Skill 必须走 Agent 流程审查，则自举没有真正降低框架扩展成本。 |

---

## 4. 竞品参考
> 记录竞品对类似问题的处理方式，回答"别人怎么做的、我们有什么不同"

| 竞品 | 是否处理过类似问题 | 处理方式 | 与我们场景的差异 |
|------|-------------------|---------|----------------|
| **OpenCode（底层平台）** | ✅ 原生支持 | 提供完整 skill 机制：指定目录扫描（`.opencode/skills/` 等）、frontmatter 发现、`skill()` 工具按需加载、权限控制（allow/deny/ask）。无自建引擎，完全依赖 LLM Agent 语义匹配。格式：`name` + `description` + 可选 `license`/`compatibility`/`metadata`。 | SDDU 是 OpenCode 的插件/上层工作流，可以直接复用而非重新实现。OpenCode 的 skill 是通用机制，SDDU 的业务 skills 是内容层——用户填充项目特有知识。差异不在机制，而在"引导用户创建什么内容"。 |
| **Anthropic Skills（github.com/anthropics/skills）** | ✅ 提供格式标准 + skill-creator | SKILL.md 格式：YAML frontmatter（name + description 必填）+ Markdown body。Progressive disclosure: Metadata(~100 words) → Body(on trigger, <500 lines) → Resources(as needed)。skill-creator 提供完整创建/测试/优化/打包工作流：draft → eval → iterate → description optimization → package。 | Anthropic skills 面向 Claude Code/Claude.ai 生态，SDDU 面向 OpenCode 生态。但格式高度兼容：`name` + `description` frontmatter 一致。SDDU 可直接参考其 skill 写作方法论和 skill-creator 流程，但不必实现等价的工具链。 |
| 🆕 **Anthropic skill-creator（自举设计）** | ✅ **Skill 创建 Skill** | skill-creator 本身就是一个 skill——它教 Claude 如何创建一个新的 skill。YAML frontmatter + Markdown body 定义。用户说"我想创建一个 XX skill"→ Claude 加载 skill-creator → 按内置的创建/测试/优化/打包工作流引导用户产出新 skill。实现"用 Skill 创建 Skill"的自举闭环。 | **这是 FR-SKILL-001 框架级层次最重要的参照物**。SDDU 应内置等价物：一个 `skill-creator` Skill 帮助用户创建项目级业务 Skills；未来 SDDU 团队也可用它创建新的框架级 Skills（自举）。 |
| **Superpowers Skills** | ✅ 提供轻量 skill 触发 | 纯 Markdown SKILL.md，无运行时代码。`using-superpowers` skill 会话启动注入，强制 Agent 检查。`writing-skills` skill 将 TDD 应用于 skill 创建。Skill 间通过 `REQUIRED SUB-SKILL` 交叉引用。 | Superpowers skills 是通用方法论（TDD、调试），不是项目业务知识。SDDU 的区别在于内容是项目特有的，且选择复用 OpenCode 原生能力而非自建触发机制。 |
| **CLAUDE.md / AGENTS.md / .cursorrules** | 部分解决但不充分 | 静态全量加载到 system prompt，不适合长文件和多文件。无按需触发、无目录组织、无渐进加载。 | 这些是「声明式规则」而非「流程指引」，且全量加载在复杂项目中极易爆 context。FR-SKILL-001 的触发式按需加载是本质差异。 |
| 🆕 **Cursor Rules（.cursorrules / .cursor/rules/）** | ✅ 提供分层规则系统 | Project Rules（项目级，`.cursor/rules/`）vs User Rules（用户级，全局）。支持 glob 文件匹配触发。支持 `alwaysApply`、`agentRequested`、`manual` 三种应用模式。纯 Markdown 格式。 | Cursor 的规则系统更接近"声明式约束"而非"可执行流程指引"。SDDU Skills 的核心差异：Skills 包含完整的交互式执行步骤（Agent 主动按 Skill 内容与用户交互），而非仅静态约束注入 system prompt。 |

---

## 5. 假设与风险
> 记录问题挖掘过程中识别的假设和风险，供后续阶段验证和关注

### 5.1 关键假设
> 记录我们对问题理解所基于的假设，标注待验证项

| # | 假设内容 | 验证方式 |
|---|---------|---------|
| A-001 | OpenCode 原生 skill 机制的触发准确率能满足 SDDU 场景需求——Agent 能根据用户任务语义正确匹配到项目特有的 business skill | 用 2-3 个示例 skill 做端到端测试，统计触发准确率 |
| A-002 | 用户愿意接受将 skill 存放在 OpenCode 原生支持的路径（如 `.opencode/skills/` 或 `.agents/skills/`），而非最初决策的 `.sddu/skills/`——或接受通过桥接机制（符号链接/同步脚本）实现逻辑归属 `.sddu/` + 物理存放于 OpenCode 可发现路径 | 在 spec 阶段与用户确认最终路径方案（详见 Q-003） |
| A-003 | Anthropic skill-creator 的写作方法论（description 优化、progressive disclosure、层级组织）适用于 SDDU 的项目业务 skill 编写场景 | 通过编写 2-3 个示例 skill 验证，收集用户反馈 |
| A-004 | 用户会主动创建和维护 skill——skill 的生命力取决于用户投入 | 发布后跟踪 skill 创建量和使用率，若用户不主动创建则需考虑自动化建议机制 |
| A-005 | SDDU 无需自建任何 skill 扫描/匹配/加载引擎——完全依赖 OpenCode 原生机制即可满足需求 | 在 spec 阶段明确哪些能力由 OpenCode 提供、哪些由 SDDU 补充（如 skill 模板、创建指南） |
| 🆕 A-006 | **Skill 作为轻量扩展机制能覆盖至少 50% 的新增能力需求**：当前规划为独立 Agent 的 FR-BUG-001（Bug 修复流程）、FR-RATIONAL-001（理性化对抗）、@sddu-tree（目录导航）等可以降级为 Skill 实现，且降级后功能完整度不低于 Agent 方案 | 逐项评估拟降级的 Feature，在 spec 阶段产出对比表：Skill 方案 vs Agent 方案的功能覆盖度、实现成本和维护复杂度 |
| 🆕 A-007 | **skill-creator 自举可行**：用一个 Skill 引导创建新 Skill 的流程是可行的——用户通过对话触发 skill-creator，按步骤产出符合规范的 SKILL.md。框架级 Skills 也可通过 skill-creator 创建初稿，再走 SDDU 完整流程审查 | 用 skill-creator 创建 1 个用户级 Skill 和 1 个框架级 Skill 初稿，对比两端产出质量是否达到各自标准 |
| 🆕 A-008 | **OpenCode 的 skill 机制支持 skill 间交叉引用**：框架级 Skill（如 bug-fix-workflow）可能需要引用用户级 Skill（如项目特有的测试流程）。需要验证 OpenCode 是否支持 Skill A 的 body 中通过 `skill("B")` 或类似机制触发其他 Skill | 在 OpenCode 环境中测试 skill 间嵌套调用行为——Skill body 中的 `skill()` 工具调用是否被支持 |

### 5.2 主要风险
> 识别可能影响问题判断或后续决策的风险因素

| # | 风险描述 | 影响程度 |
|---|---------|---------|
| R-001 | **存放路径两难**：若选择 `.sddu/skills/`，需自建引擎（违背"复用平台"的简化设计方向）；若选择 `.opencode/skills/`，skill 在逻辑上属于 SDDU 但在物理上散落于 OpenCode 目录下，可能造成管理混乱 | 🔴 高 — 这是架构层面的根本决策，影响 discovery→spec→plan 全流程 |
| R-002 | **触发准确率不可控**：LLM 语义匹配本质是不确定的，用户精心编写的 skill 可能在某些语境下不触发或少触发。Anthropic 文档承认模型有"undertrigger"倾向，但没有银弹 | 🟡 中 — 影响用户体验，但可通过 description 优化和用户反馈迭代缓解 |
| R-003 | **scope 漂移**：从"构建完整 skill 系统（扫描/匹配/加载/确认/生命周期）"到"复用 OpenCode 原生能力 + SDDU 提供写作指引"的简化过程中，用户可能觉得产出"不够"，期望更多框架级能力 | 🟡 中 — 需在 spec 阶段明确 scope 边界 |
| R-004 | **与 FR-FAST-001 / FR-RATIONAL-001 的版本归属**：原定 v3.3.0 搁置池，现用户决定提前启动。若 FR-SKILL-001 先于 v3.0.0~v3.2.0 的前置 Feature 完成，需确认是否产生跨版本兼容问题 | 🟢 低 — FR-SKILL-001 无硬依赖，独立性强，提前启动风险低 |
| 🆕 R-005 | **Agent→Skill 降级争议**：将已规划为 Agent 的 Feature（如 FR-BUG-001 Bug 流程、FR-RATIONAL-001 理性化对抗）降级为 Skill，可能引发设计团队的哲学争论——"这些 Feature 真的只是 Skill 吗？它们没有状态管理需求吗？"。如果降级后能力不足，需要重新升格回 Agent，造成返工 | 🔴 高 — 涉及多个已规划 Feature 的架构重定义，影响 ROADMAP 版本规划 |
| 🆕 R-006 | **框架级 Skill 的维护归属模糊**：用户创建的 Skill 归用户维护，但框架级 Skill（如 bug-fix-workflow）随插件分发——其 bug 修复、功能改进、文档更新应该走 SDDU 框架自身的什么流程？如果用 Skill 来管 Skill 的维护，是否陷入无限递归？ | 🟡 中 — 需要明确框架级 Skill 的生命周期管理协议 |
| 🆕 R-007 | **Skill 数量膨胀导致触发竞争**：随着用户级和框架级 Skills 同时增长，Agent 的语义匹配空间扩大——多个 Skill 的 description 可能同时匹配用户请求，Agent 需要在多个候选 Skill 中做选择，增加误触发概率 | 🟡 中 — 类似搜索引擎的"查询歧义"问题，需在 Skill 设计层面做命名空间隔离或优先级机制 |

### 5.3 约束：Agent 新增门禁

> **Agent 新增门禁**：任何提议新增 Agent 的需求，必须先证明「Skill 无法满足」才启动。审查标准：
> - 是否需要引入新的工作流阶段？（是 → Agent）
> - 是否需要独立的状态管理？（是 → Agent）
> - 是否属于执行方法论/流程知识？（是 → Skill）

此约束是 §6.1 架构决策「Agent 固定 + Skill 扩展」的落地机制——确保 Agent 清单保持简单固定，将 SDDU 能力扩展的核心压力导向 Skill 路径。

---

## 6. 🆕 框架级 Skills：核心扩展路径（Agent 固定 + Skill 扩展）

> **新增大节** — 这是 FR-SKILL-001 scope 纠正的核心内容：SKILL 不仅用于沉淀用户项目知识，更是 SDDU 框架自身的轻量化扩展机制。

### 6.1 架构决策：Agent 固定 + Skill 扩展

> **用户架构决策（2026-07-18）**：「未来Agent的清单尽可能保持简单固定，拓展SDDU能力核心重任就放到SKILL这边来」

SDDU 架构采用「固定引擎 + 可扩展能力」的双层模型：

```
┌─ 固定层：Agent ─────────────────────────────┐
│ discovery / spec / plan / tasks / build      │
│ review / validate / roadmap / tree / docs    │
│ ←── 保持简单固定，不再轻易增加               │
│ 职责：工作流引擎，定义「阶段」和「流程」       │
└──────────────────────────────────────────────┘
                      ↓ 按需加载
┌─ 扩展层：Skill ─────────────────────────────┐
│ sddu-bug-fix-workflow / sddu-rational-prompt │
│ skill-creator / sddu-worktree-workflow       │
│ 用户自定义 skills...                          │
│ ←── SDDU 能力扩展的核心机制                   │
│ 职责：执行方法论，定义「怎么做」               │
└──────────────────────────────────────────────┘
```

**关键含义**：
1. **Agent 清单保持简单固定** — 当前 11 个核心 Agent（discovery / spec / plan / tasks / build / review / validate / roadmap / tree / docs / fast）不再轻易增加。未来新增能力优先走 Skill 路径。
2. **SKILL 是核心扩展机制** — 不是「补充」，不是「可选项」，而是**核心路径**。新能力的首选载体是 Skill 而非 Agent。
3. **已规划 Agent 需重新评估** — FR-FAST-001 / FR-RATIONAL-001 / FR-BUG-001 等通过新增 Agent 解决的需求，如果有轻量化可能性，应优先考虑 Skill 化。

**Agent 新增门禁**：任何提议新增 Agent 的需求，必须先证明「Skill 无法满足」才启动。审查标准（详见 §5.3）：
- 是否需要引入新的工作流阶段？（是 → Agent）
- 是否需要独立的状态管理？（是 → Agent）
- 是否属于执行方法论/流程知识？（是 → Skill）

### 6.2 对版本规划的影响

| 原规划 Feature | 原方案 | 新方案（Skill 优先） |
|---------------|--------|---------------------|
| FR-FAST-001 (RICE 21.6) | 新增 @sddu-fast Agent | ⚠️ **需重新评估**。快速模式逻辑是否可转为 Skill？如果 @sddu-fast 已作为固定 Agent 存在，其内部策略是否可 Skill 化？ |
| FR-RATIONAL-001 (RICE 9.6) | 新增理性化对抗 Agent | ✅ **可完全 Skill 化**。理性化对抗是 Prompt 层注入，天然适合 Skill |
| FR-BUG-001 (RICE 10.5) | Bug 流程框架化（可能 Agent） | ✅ **可完全 Skill 化**。Bug 修复流程是方法论，不是工作流阶段 |
| FR-WORKTREE-001 (RICE 4.5) | Worktree 隔离（可能 Agent） | ⚠️ **部分 Skill 化**。流程部分可 Skill，工具脚本部分需代码支持 |

### 6.3 问题根因：为什么"新增 Agent"太重？

SDDU 当前的能力扩展基本靠「新增 Agent」——即增加一个新的 `@sddu-xxx` Agent。例如：
- 需要一个快速模式 → 增加 `@sddu-fast` Agent
- 需要理性化对抗 → 增加 `@sddu-rational` Agent
- 需要 Bug 流程 → 规划为 `@sddu-bug` Agent（FR-BUG-001）
- 需要 Worktree 隔离 → 规划为 Agent（FR-WORKTREE-001）
- 需要目录导航 → 增加 `@sddu-tree` Agent

**每个新 Agent 的背后是**：
1. 编写 `.hbs` 行为定义模板（200-500 行）
2. 在 OpenCode 中注册 agent definition（agents 配置）
3. 在 sddu-core 路由层适配调度逻辑
4. 设计与其他 Agent 的交互协议（谁调用谁、谁在谁之前/之后）
5. 编写完整的 SDDU 过程文档（discovery→spec→plan→tasks→build→review→validate）
6. 维护——每个 Agent 有自己的模板、注册、测试、文档

**后果**：
- **扩展成本高**：新增能力 = 新增 Agent = 完整 SDDU 工作流
- **组合爆炸**：无法正交组合——「轻量对话 + TDD 流程」和「轻量对话 + 代码审查」只能做两个 Agent 或一个「大而全」的 Agent
- **缺乏中间粒度**：要么是「重」Agent（如 @sddu-fast），要么是「散」的 coordinator 指令片段

### 6.4 解决方案：Skill 作为中间粒度扩展单元

类比 Anthropic 的 skill-creator：**用 Skill 来创建 Skill，实现自举拓展**。

FR-SKILL-001 应解决两个层次的问题：

#### 层次 1：用户级 Skills（面向项目）— 原有，保留
- **位置**：`.sddu/skills/`（或桥接到的 OpenCode 原生路径）
- **创建者**：用户手写
- **内容**：项目特有业务执行流程知识
- **场景**：「接入支付渠道」「部署检查清单」「数据库迁移流程」
- **生命周期**：用户手动创建和维护

#### 🆕 层次 2：框架级 Skills（面向 SDDU 自身）— 新增
- **位置**：框架内置，随插件分发（存放路径待定——`src/skills/` 或与用户 Skills 同目录但以 `sddu-` 前缀命名空间隔离）
- **创建者**：SDDU 框架维护者（通过 SDDU 完整流程，可能以 skill-creator 辅助初稿）
- **内容**：替代部分「新增 Agent」需求，把轻量能力变成 Skill 而非 Agent
- **场景示例**：

| 框架级 Skill | 描述 | 替代的 Agent 方案 | 降级可行性分析 |
|-------------|------|-----------------|--------------|
| `skill-creator` | 自举的「创建 Skill」Skill — 引导用户创建符合规范的 SKILL.md，包含 description 优化、progressive disclosure 指导、触发测试流程 | 无（新概念） | ⭐⭐⭐ 天然适合 Skill — Anthropic 已有先例 |
| `bug-fix-workflow` | Bug 修复流程 Skill — 定义「复现→定位→修复→验证→回归」的标准步骤，可与 @sddu-fast 或 @sddu-build 配合使用 | FR-BUG-001（独立 Agent，RICE 10.5，P0，v3.1.0） | ⭐⭐⭐ 高度适合 Skill — 本质是流程性指引，无状态管理刚性需求 |
| `tdd-workflow` | TDD 流程 Skill — Red-Green-Refactor 循环指引，测试先行规范 | 无已有规划 | ⭐⭐⭐ 天然适合 Skill — 方法论注入 |
| `code-review-checklist` | 代码审查清单 Skill — 按项目类型加载对应审查维度（SDDU Agent 模板审查 / 通用代码质量 / 安全性） | 无已有规划 | ⭐⭐⭐ 天然适合 Skill — 清单式指引 |
| `sddu-fast-strategy` | 轻量对话策略 Skill — 替代 @sddu-fast 中「任务边界判断 + 升级引导 + 自律声明」的逻辑 | FR-FAST-001（独立 Agent，P0，v3.3.0，RICE 21.6） | ⭐⭐ 部分可降级 — Fast 模式的核心价值（零状态、直接解决）仍需 Agent 作为执行载体，但其内嵌的「何时升级」「任务边界」逻辑可以抽离为 Skill |
| `sddu-rational-prompts` | 理性化对抗 Prompt 注入 Skill — 在 Agent 决策环节注入 Devil's Advocate 视角 | FR-RATIONAL-001（规划中，竞品借鉴来源） | ⭐⭐ 高度适合 Skill — Prompt 层注入，无状态需求 |
| `git-worktree-workflow` | Git Worktree 隔离流程 Skill — `worktree add → 初始化 → 工作 → 清理` 流程+脚本 | FR-WORKTREE-001（竞品借鉴，RICE 4.5，P2，v3.1.0） | ⭐⭐ 可考虑 Skill 化 — 流程+脚本天然适合 Skill，但 Worktree 的物理隔离可能需要 Agent 级权限（文件系统操作） |
| `sddu-tree-scan` | 目录导航扫描 Skill — specs-tree-root 扫描、TREE 生成、一致性验证 | @sddu-tree（现有独立 Agent） | ⭐⭐ 可考虑 Skill 化 — 扫描任务是流程性的，但 @sddu-tree 涉及跨 Feature 目录的读写操作，需要 Agent 级文件权限 |

### 6.5 自举循环：skill-creator 的设计

> 核心洞察类比：Anthropic 的 skill-creator 本身就是一个 skill，它教 Claude 如何创建新的 skill。

```
┌─────────────────────────────────────────────────────────────┐
│                   SDDU Skill 自举循环                         │
│                                                             │
│   ┌───────────────┐    创建     ┌─────────────────────────┐ │
│   │ skill-creator │ ──────────→ │ 用户级 Skills           │ │
│   │ (框架级 Skill) │            │ (项目特有业务流程)       │ │
│   └───────┬───────┘            └─────────────────────────┘ │
│           │                                                  │
│           │ 创建（初稿）                                      │
│           ▼                                                  │
│   ┌───────────────────────────────────────────────────────┐ │
│   │  框架级 Skills 初稿                                      │ │
│   │  (bug-fix-workflow / tdd-workflow / ...)               │ │
│   └───────────────────────┬───────────────────────────────┘ │
│                           │                                  │
│                           │ 走 SDDU 完整流程审查              │
│                           ▼                                  │
│   ┌───────────────────────────────────────────────────────┐ │
│   │  框架级 Skills 正式版 → 随插件分发                       │ │
│   └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**关键设计要点**：
1. **`skill-creator` 本身是框架级 Skill** — 随 SDDU 插件内置
2. **用户用它创建用户级 Skills** — 对话式引导，产出符合 OpenCode/Anthropic 规范的 SKILL.md
3. **SDDU 团队用它创建框架级 Skills 初稿** — 加速框架扩展，初稿完成后走 SDDU 完整流程确保质量
4. **形成自举闭环** — 用 Skill 创建 Skill，降低整个生态的扩展成本

### 6.6 Skill vs Agent 边界原则（建议）

> 在 spec 阶段需正式定义的决策框架，此处仅初步建议

| 维度 | 适合做 Skill | 适合做 Agent |
|------|:----------:|:----------:|
| **状态管理** | 无状态（纯指引/流程/清单） | 需要追踪 phase/status/state.json |
| **产物输出** | 不产生 SDDU 中间文档 | 产出 discovery/spec/plan/tasks 等文档 |
| **其他 Agent 调度** | 被 Agent 调用（被动） | 可调度其他 Agent（主动） |
| **文件操作权限** | 随宿主 Agent 权限 | 独立权限控制 |
| **复杂度** | 单一职责流程（< 500 行 body） | 多职责协调或有复杂路由逻辑 |
| **生命周期** | 轻量 — 版本化 Markdown 文件 | 重 — 完整 SDDU 流程 |
| **扩展示例** | bug-fix-workflow / tdd-workflow / code-review-checklist | @sddu-discovery / @sddu-spec / @sddu-plan / @sddu-build |

---

## 7. 🆕 RICE 重新评估

> **原有 RICE**: Reach 9 / Impact 8 / Confidence 70% / Effort 3 = **7.9**  
> **新 RICE**: Reach **10** / Impact **10** / Confidence 70% / Effort 4 = **17.5**

### 7.1 评分变更说明

| 维度 | 原评分 | 新评分 | 变更原因 |
|------|:-----:|:-----:|---------|
| **Reach（覆盖面）** | 9 | **10** | 从「所有 SDDU 用户」扩展为「所有 SDDU 用户 + SDDU 框架自身扩展者」。框架级 Skills 同时解决用户侧（项目知识沉淀）和框架侧（能力扩展）两个群体的痛点。 |
| **Impact（影响度）** | 8 | **10 — 范式变革** | 升级理由：不仅是效率提升，而是 **SDDU 扩展模型从「写 Agent」到「写 Skill」的范式转移**，从根本上降低扩展成本并保证 Agent 清单的简洁性。触及 SDDU 的架构根本——"新增能力 = 新增 Agent"变为"新增能力优先走 Skill 轻量路径"，降低整个生态的扩展成本。对 SDDU 框架的长期架构健康度影响深远。 |
| **Confidence（信心）** | 70% | **70%** | 不变 — Anthropic skill-creator 验证了 Skill 自举的可行性，但 SDDU 特有的 Agent→Skill 降级尚未验证。 |
| **Effort（投入）** | 3 | **4** | 增加 — 从"仅用户级 Skills"扩展为"用户级 + 框架级双轨"：需额外设计框架级 Skill 命名空间、分发机制、skill-creator 内容、Agent→Skill 降级评估流程。 |
| **RICE Score** | **7.9** | **17.5** | ⬆️ 2.2x 提升 — 触及框架扩展范式后，FR-SKILL-001 从"锦上添花"变为"基础设施级" |

### 7.2 优先级重新评估

| 维度 | 原 | 新 | 说明 |
|------|:--:|:--:|------|
| Priority | P1 | **P0** | 触及 SDDU 框架扩展范式——FR-SKILL-001 不仅解决用户的 Skill 沉淀需求，更是 SDDU 框架能力扩展机制的基础设施。在框架级 Skills 就绪前，新 Feature（如 FR-BUG-001、FR-RATIONAL-001）的架构选型缺少"Skill 还是 Agent"的决策框架。 |
| 版本归属 | v3.3.0 | **v3.3.0（或可提前至 v3.1.0/v3.2.0）** | P0 优先级建议重新纳入近期版本规划，与 FR-BUG-001（v3.1.0）并行或先行——后者可能受益于 Skill 化选型。 |

---

## 8. 下一步建议
> 给出后续工作的优先级建议，回答"接下来优先做什么"

| 优先级 | 事项 | 说明 |
|--------|------|------|
| 🔴 高 | **解决 Q-003 路径冲突 + Q-011 框架级 Skill 存放位置**：在 spec 阶段与用户确认最终存放路径方案——包括用户级 Skills 和框架级 Skills 的物理路径、命名空间隔离和桥接策略。建议选项：A) 使用 `.opencode/skills/`，框架级 Skill 以 `sddu-` 前缀隔离；B) `.agents/skills/`（OpenCode 也扫描，agent 语义更匹配）；C) `.sddu/skills/` + 符号链接桥接到 OpenCode 可发现路径；D) 若 OpenCode 插件 API 支持注册额外扫描路径，则 `.sddu/skills/` 可直接注册 | 
| 🔴 高 | **明确 scope 边界 + Agent→Skill 降级评估**：spec 阶段精确定义 FR-SKILL-001 做什么（两层次 Skills + skill-creator + Agent→Skill 降级评估决策框架）和不做什么（不实现扫描引擎、不实现匹配算法、不实现加载器——这些由 OpenCode 原生提供）。产出面向 FR-BUG-001、FR-RATIONAL-001、FR-WORKTREE-001 的 Agent vs Skill 对比评估表 | 
| 🔴 高 | **定义 Skill vs Agent 边界原则**：制定"何时做 Skill、何时做 Agent"的决策框架（参考 §6.6 初步建议），将其固化为 ADR。这对后续所有 Feature 的架构选型有根本性影响 | 
| 🟡 中 | **产出 skill-creator Skill 初稿**：参考 Anthropic skill-creator 方法论和 OpenCode skill 格式，编写内置的 skill-creator。内容包括：Skill 格式规范、description 撰写技巧（触发准确率优化）、progressive disclosure 指导、触发测试流程 | 
| 🟡 中 | **产出示例 skills + 写作指南**：编写 2-3 个示例 skill（用户级：如接入支付渠道、数据库迁移流程；框架级：如代码审查清单）和一个「如何编写 SDDU Skill」的指南文档 | 
| 🟡 中 | **验证端到端流程**：用示例 skill 在 SDDU 环境中完成一次完整验证——用户描述任务 → OpenCode Agent 自动匹配 skill → 加载指令 → 正确执行 | 
| 🟢 低 | **调研 OpenCode 插件 API**：确认是否存在"注册自定义 skill 扫描路径"的能力，若有则可能解决路径冲突且保持 `.sddu/skills/` 路径决策 | 
| 🟢 低 | **内置 Skill 清单初稿评审**：将 §6.4 的降级可行性分析表提交用户评审，确认哪些 Feature 可降级、哪些不可、哪些部分可降级 | 

### 8.3 Scope 边界（框架级视角 — 2026-07-19 更新）

> 以下 scope 定义基于 §6.1 的架构决策「Agent 固定 + Skill 扩展」。

**In scope（框架级）**:
- 内置 `skill-creator`（自举的创建 Skill 的 Skill）
- 建立 Skill 作为 SDDU 能力扩展的核心路径（非降级方案，非可选项）
- 将部分规划中的 Agent 能力重新评估为 Skill
- Agent 新增门禁制度（详见 §5.3）

**Out of scope**:
- 新增 Agent（本 Feature 反向约束新增 Agent——任何新增 Agent 的需求必须先过门禁证明「Skill 无法满足」）
- 改动现有 Agent 的职责边界（保持固定——当前 11 个核心 Agent 的职责范围不因 Skill 化而改变）

---

## 9. 开放问题

> 需要后续阶段回答的关键问题

| # | 问题 | 优先级 | 说明 |
|---|------|:------:|------|
| OP-001 | **用户级 Skills 的物理存放路径？** 是 `.opencode/skills/`（零额外工作）、`.agents/skills/`、还是 `.sddu/skills/` + 桥接？ | 🔴 P0 | 架构根本决策，影响后续所有技术选型 |
| 🆕 OP-002 | **框架级 Skills 的存放位置？** `src/skills/`（源码级，随插件分发）vs `.sddu/skills/framework/`（运行时可覆盖）vs OpenCode 原生路径 + `sddu-` 前缀？ | 🔴 P0 | 影响框架 Skills 的分发、版本管理和用户覆盖机制 |
| 🆕 OP-003 | **哪些已规划 Agent 可以或部分降级为 Skill？** FR-BUG-001 / FR-RATIONAL-001 / FR-WORKTREE-001 / @sddu-tree / @sddu-fast（部分）的降级可行性需要在 spec 阶段做逐项评估并产出 ADR | 🔴 P0 | 直接影响 v3.1.0~v3.3.0 的版本规划 |
| 🆕 OP-004 | **Skill 的生命周期管理协议？** 用户级 Skills 走什么流程（Fast 直接改？完整 SDDU？）框架级 Skills 的改进走什么流程（完整 SDDU 是硬要求吗？） | 🟡 P1 | 影响 Skills 的长期可维护性 |
| 🆕 OP-005 | **skill-creator 的定位** — 是纯指引 Skill（教怎么写），还是交互式创建工具（对话式引导产出 SKILL.md）？Anthropic 的 skill-creator 偏向后者。 | 🟡 P1 | 影响 skill-creator 的复杂度——指引式简单但依赖用户自学，交互式更易用但需要设计对话流 |
| OP-006 | **Skill 触发准确率如何验证？** Anthropic skill-creator 提供了 Description Optimization 流程，但依赖 `claude -p` CLI。SDDU 环境下的等价验证路径是什么？ | 🟡 P1 | 影响用户创建 Skill 的质量迭代 |
| OP-007 | **Skill 间引用和组合机制？** OpenCode 是否支持 Skill body 中通过 `skill()` 工具调用另一个 Skill？框架级 Skill 是否可引用用户级 Skill？ | 🟡 P1 | 影响 Skill 的组合性和正交性 |
| OP-008 | **Skill 版本与插件版本的对齐策略？** 框架级 Skills 随插件分发时，版本号如何管理？用户安装新版本插件时是否自动覆盖旧 Skills？用户自定义修改如何保留？ | 🟢 P2 | 长期维护问题 |

---

## 附录 A：设计决策速览（已确认 / 新增 / 待定）

| # | 决策 | 状态 | 来源 |
|---|------|:----:|------|
| D-001 | 存放位置：原定 `.sddu/skills/`（与 specs-tree-root 平级，属于 SDDU 工作空间的一部分）。⚠️ **待重新确认**——需同时考虑用户级和框架级 Skills 的路径需求 | 🔴 待定 | ROADMAP + OpenCode 文档冲突 + 新 scope |
| D-002 | 内容格式：标准 skill 格式——YAML frontmatter（`name` + `description`）+ Markdown body。用户确认对齐 Anthropic 最小规范，不扩展自定义字段 | ✅ 已确认 | 用户访谈确认 |
| D-003 | 触发机制：**复用 OpenCode 原生 skill 机制**——LLM Agent 语义匹配 + `skill()` 工具按需加载。不自建扫描/匹配/加载引擎 | ✅ 已确认 | 用户访谈确认（"参考 https://opencode.ai/docs/zh-cn/skills/"） |
| D-004 | 版本归属：原定 v3.3.0，现 P0 优先级建议重新纳入近期规划 | 🟡 待定 | 用户决策 + RICE 重评估 |
| 🆕 D-005 | **双重定位**：FR-SKILL-001 同时覆盖用户级 Skills（项目业务知识沉淀）和框架级 Skills（SDDU 轻量扩展机制）。两者共享同一套技术基础设施（OpenCode native skill mechanism），但有不同的创建者、生命周期和质量门 | ✅ 已确认 | 用户 scope 纠正（本次更新） |
| 🆕 D-006 | **自举性**：框架内置 `skill-creator` Skill，用户用它创建用户级 Skills；SDDU 团队可用它加速框架级 Skills 的创建（初稿→SDDU 完整流程审查→正式版） | 🟡 待 spec 细化 | 用户 scope 纠正 + Anthropic skill-creator 参照 |
| 🆕 D-007 | **命名空间隔离**：框架级 Skills 建议使用 `sddu-` 前缀（如 `sddu-skill-creator`、`sddu-bug-fix-workflow`），用户级 Skills 无前缀限制——OpenCode frontmatter `name` 字段的 `^[a-z0-9]+(-[a-z0-9]+)*$` 约束天然支持 | 🟡 待 spec 确认 | Discovery 建议 |

---

## 附录 B：与已有 Feature 的关系矩阵（更新版）

| Feature | 关系 | 说明 |
|---------|:--:|------|
| FR-KB-001（全局配置） | 互补，不重叠 | KB-001 管「是什么」（声明式配置），SKILL-001 管「怎么做」（执行流程） |
| FR-KB-002（知识沉淀）✅ | 互补，不重叠 | KB-002 自动聚合「过去的产出」，SKILL-001 用户手写「未来的指引」 |
| FR-TPL-001（模板系统） | 间接借用 | 若 SDDU 需要产生任何 `.hbs` 输出（如 skill 模板），共用 Handlebars 引擎。纯 OpenCode 方案下可能无需借用 |
| FR-FAST-001（快速模式） | 🆕 **强关联** | Fast 模式是 Skill 轻量化扩展的「消费者」——Fast Agent 可通过加载不同 Skill 获得不同能力（bug-fix-workflow、code-review-checklist 等），实现正交组合。同时 Fast 模式自身的「任务边界判断」「升级引导」逻辑可抽离为 Skill 注入 |
| FR-RATIONAL-001（理性化对抗） | 🆕 **可降级** | 理性化对抗的 Prompt 注入逻辑天然适合 Skill —— 作为 `sddu-rational-prompts` 框架级 Skill，按需注入到 spec/plan/review 等 Agent 的决策环节 |
| 🆕 FR-BUG-001（Bug 流程框架化） | 🆕 **可降级评估** | Bug 流程本质是「复现→定位→修复→验证→回归」的步骤指引 + 轻量状态追踪（日志文件）。若 OpenCode Skill 机制支持 skill 间调用（OP-007），可降级为 `sddu-bug-fix-workflow` + `sddu-bug-log` 两个协作 Skill。降级后是否能覆盖 FR-BUG-001 的完整需求（如跨项目 bug 跟随）需 spec 阶段评估 |
| 🆕 FR-WORKTREE-001（Git Worktree 隔离） | 🆕 **部分可降级** | Worktree 流程步骤（创建→初始化→收尾）可 Skill 化，但执行 git worktree 命令、管理文件系统隔离等操作需要 Agent 级权限。建议保持 Agent 但内嵌 Skill 作为流程指引 |
| @sddu-tree（目录导航） | 🆕 **可评估降级** | 扫描+验证流程可 Skill 化，但涉及跨 Feature 目录写操作的 TREE 生成需要 Agent 级权限。建议保持 Agent 但内嵌 Skill 作为扫描逻辑 |
| 🆕 FR-QUALITY-001（模板质量） | 独立 | 技能质量有自身的衡量维度，不依赖 Skill 系统 |

---

## 附录 C：OpenCode Skill 机制关键约束速查

> 来源：https://opencode.ai/docs/zh-cn/skills/ （2026-07-18）

| 维度 | 约束 |
|------|------|
| **扫描路径** | `.opencode/skills/`、`.claude/skills/`、`.agents/skills/` 及其 `~/.config/`、`~/.claude/`、`~/.agents/` 对应全局路径。不支持 `.sddu/skills/` |
| **Frontmatter** | `name`（必填，1-64 字符，`^[a-z0-9]+(-[a-z0-9]+)*$`）、`description`（必填，1-1024 字符）、`license`（可选）、`compatibility`（可选）、`metadata`（可选）。未知字段忽略 |
| **发现** | 从工作目录向上遍历到 git 根，加载所有匹配路径的 SKILL.md |
| **加载** | Agent 通过 `skill({ name: "xxx" })` 工具按需加载完整 body |
| **权限** | `opencode.json` 中 `permission.skill: { "name": "allow/deny/ask" }`，支持通配符，可按 agent 覆盖 |
| **禁用** | 可在 agent 级别 `tools: { skill: false }` 完全禁用 |
| 🆕 **Skill 间调用** | **未知** — OpenCode 文档未明确说明 Skill body 中是否支持通过 `skill()` 工具调用另一个 Skill。需在 spec 阶段做实验验证（OP-007） |

---

## 修订记录
> 记录本文档的版本变更历史

| 版本 | 变更说明 | 日期 | 修订人 |
|------|---------|------|--------|
| v1.0 | 初始创建 — 用户叙述阶段直入 + 访谈确认 7 个落地维度 + OpenCode 文档 + Anthropic skill-creator 参考 | 2026-07-18 | SDDU Discovery Agent |
| v2.0 | **重大扩充** — 用户 scope 纠正：引入「框架级 Skills」作为 SDDU 轻量化扩展机制。新增 §6 框架级 Skills 设计、6 个新问题（Q-009~Q-014）、3 个新假设（A-006~A-008）、3 个新风险（R-005~R-007）、Skill vs Agent 边界原则、Agent→Skill 降级可行性评估表、skill-creator 自举设计、RICE 重新评估（P1→P0，7.9→17.5）。开放问题从 0 新增至 8 项。关系矩阵扩展至 FR-BUG-001 / FR-RATIONAL-001 / FR-WORKTREE-001 / @sddu-tree。 | 2026-07-19 | SDDU Discovery Agent |
| v3.0 | **架构决策注入：「Agent 固定 + Skill 扩展」确立为 SDDU 核心架构原则**。§6 重构：新增 §6.1 架构决策（双层模型图 + 用户原话引用）、§6.2 版本规划影响表，原 §6.1~§6.4 重编号为 §6.3~§6.6。§1 核心问题更新（Skill 化扩展机制缺失）。新增 §5.3 Agent 新增门禁约束。§7.1 RICE Impact 理由更新（范式变革 8→10）。新增 §8.3 Scope 边界（In/Out）。Skill 从「候选降级方案」提升为「核心扩展路径」。 | 2026-07-19 | SDDU Discovery Agent |
