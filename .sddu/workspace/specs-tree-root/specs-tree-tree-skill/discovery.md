# 问题挖掘报告：FR-TREE-SKILL @sddu-tree Agent 技能化

> **文档定位**: SDDU 问题挖掘报告 — 记录用户问题、痛点和场景，作为 spec 阶段的输入  
> **前置依赖**: FR-SKILL-001（SDDU Skill 系统）✅ 已交付 — 提供了 discovery/creator/sync 基础设施  
> **创建人**: SDDU Discovery Agent  
> **创建时间**: 2026-07-19  
> **版本**: v1.0  
> **更新人**: SDDU Discovery Agent  
> **更新时间**: 2026-07-19  
> **更新说明**: 初始创建 — 基于 ROADMAP v16.0.0 评估 + FR-SKILL-001 discovery 已有分析 + @sddu-tree Agent 模板审计 + SDDU 架构决策「Agent 固定 + Skill 扩展」

## 1. 问题定义
> 概括核心问题及其业务影响，回答"为什么需要关注"

| 核心问题 | 业务影响 | 不解决的成本 |
|---------|---------|------------|
| **@sddu-tree 以独立 Agent 形态存在，违反 FR-SKILL-001 定义的「Agent 固定 + Skill 扩展」架构原则**。当前 SDDU 拥有 11 个核心 Agent，@sddu-tree 是其中唯一的纯辅助 Agent（不参与主流水线，仅做目录扫描 → TREE 生成）。其职责（扫描目录 → 检测缺失 → 读取文件 → 生成 TREE → 验证已有 → 输出报告）是一个高度流程化、无状态、无需独立生命周期的可复用执行流程，完全符合 Skill 化条件。 | (1) 增加 Agent 清单的认知负担——用户面对 11 个 Agent 时需要理解 @sddu-tree 是一个「辅助」而非「主流程」Agent；(2) token 成本浪费——每次 @sddu-tree 触发都启动独立 subagent（含完整 Agent prompt），而 Skill 按需加载不增加固定 prompt 开销；(3) 违反自定架构原则——FR-SKILL-001 已确立 Skill 为能力扩展核心路径，保留一个可用 Skill 替代的 Agent 是对该决策的否定。 | (1) 架构一致性问题持续存在，SDDU 的「Agent 固定 + Skill 扩展」策略缺乏实战验证——没有一次真实的 Agent→Skill 降级来证明其可行性；(2) 后续若有更多辅助 Agent 诞生，缺少降级决策的参考范本；(3) Agent 数量膨胀的门槛被隐性降低——「既然 @sddu-tree 可以保留，为什么 XX 不能？」 |
| **8 个主流程 Agent 模板中硬编码了 `@sddu-tree` 调用指令**，形成隐性耦合。每次 Agent 完成主流程后自动触发独立 subagent 来生成 TREE——这种「A Agent 完成后调用 B Agent」的模式增加了 Agent 间的调度复杂度，且使 TREE 生成逻辑与宿主 Agent 的执行上下文割裂。 | 修改 TREE 生成逻辑需要同时更新 Agent 模板（sddu-tree.md.hbs）和所有引用模板中的 `@sddu-tree` 调用指令，维护成本分散。Agent 间的自动调用链增加调试复杂度——TREE 生成失败时难以定位是调用方还是被调用方的问题。 | 随着 SDDU 版本演进，TREE 生成逻辑的迭代（如支持新文件类型、新状态模型）将触及 8+ 模板文件，回归测试面广。且硬编码调用模式与 FR-SKILL-001 推崇的「Agent 按 Skill 发现机制按需加载」模式相悖。 |

## 2. 用户画像
> 描述受影响用户角色及其场景，回答"谁遇到了什么问题"

| 用户角色 | 典型场景 | 关键痛点（用户原话） | 当前应对方式 |
|---------|---------|-------------------|------------|
| **SDDU 框架维护者**（团队核心开发者） | 维护 11 个 Agent 的模板、注册、测试——@sddu-tree 需要独立的 `.hbs` 模板（265 行）、`opencode.json` 注册条目、以及 8 个主流程 Agent 模板末尾的硬编码调用声明。任何 TREE 格式变更（如 FR-STATUS-001 引入的 v3.0.0 状态模型）都需跨多个模板同步。 | 「@sddu-tree 是 11 个 Agent 中最轻量的一个，但它的维护成本却横跨 8+ 模板——修一个地方不够，必须全局 grep 替换」 | 全局搜索 `@sddu-tree` 引用，手动逐模板更新；依赖 @sddu-tree 自身的自举能力做一致性检查 |
| **SDDU 使用者**（日常使用 SDDU 工作流的开发者） | 完成一次 spec → build 流程后，TREE.md 自动更新不需要手动干预——这是好体验。但用户需要区分「@sddu-tree 是辅助 Agent」和「@sddu-spec 是主流程 Agent」，增加了 Agent 清单的理解负担。 | 「我不需要知道 TREE 是独立 Agent 生成的还是主流程 Agent 自己做的——只要我的目录有导航就行。但现在 agent 列表里它和其他 10 个 agent 并列，初次看到会困惑」 | 查阅 ROADMAP 了解 Agent 分类，或通过经验区分主/辅 Agent |
| **SDDU 架构决策者**（关注框架长期演进的开发者） | FR-SKILL-001 确立了「Agent 固定 + Skill 扩展」架构决策和 Agent 新增门禁，但该决策目前只剩一层声明——没有一次真实的 Agent→Skill 降级来验证其可行性。@sddu-tree 是最合适的首个验证案例：轻量、边界清晰、Stateless、不涉及主流水线。 | 「我们需要一个真实的降级案例来证明『Skill 可以替代 Agent』。如果连 @sddu-tree 这种最轻量的辅助 Agent 都降不了，那更复杂的候选（如 @sddu-docs）就没法评估了」 | 阅读 FR-SKILL-001 discovery.md 中的降级可行性评估表（§6.4），等待首个降级案例启动 |

## 3. 问题清单
> 按影响程度分级梳理所有识别到的问题，每项赋予唯一编号 Q-xxx

### 3.1 核心问题
> 影响面大、频率高、用户强烈感知

| ID | 问题描述 | 影响范围 |
|----|---------|---------|
| Q-001 | **@sddu-tree 以独立 Agent 形态存在，与「Agent 固定 + Skill 扩展」架构原则冲突**。FR-SKILL-001（discovery §6.1）明确定义：Agent 清单保持简单固定，能力扩展优先走 Skill 路径。@sddu-tree 的职责（扫描目录→检测缺失→读取文件→生成 TREE→验证已有→输出报告）是全流程化的可复用执行逻辑，无独立状态管理需求，不需要引入新工作流阶段——这三条均满足 Skill 化而非 Agent 化的条件。保留为 Agent 意味着 SDDU 自身的架构决策在自己身上失效。 | 影响 SDDU 框架的架构一致性和「Agent 新增门禁」的可信度。涉及 11 个 Agent 中的 1 个、8+ 主流程模板的硬编码调用。ROADMAP RICE 评估：Reach 5 / Impact 6 / Confidence 85% / Effort 1.5 = 17.0（P0，跨版本第 2 位）。 |
| Q-002 | **8 个主流程 Agent 模板末尾硬编码了 `@sddu-tree` 自动调用指令**，形成隐性调度耦合。这种「A Agent 完成后强制调用 B Agent」的模式：(1) 增加 Agent 间调度复杂度；(2) TREE 生成逻辑与宿主 Agent 执行上下文割裂——Agent A 不知道自己完成后为什么要调用 @sddu-tree，只是一个「照做」的指令；(3) 修改 TREE 逻辑需要跨 8+ 模板全局替换。 | 影响所有 8 个主流程 Agent 模板（discovery / spec / plan / tasks / build / review / validate / docs）。每次 TREE 格式演进（如新增文件类型支持、状态模型升级）的回归测试面横跨 8+ 文件。 |
| Q-003 | **@sddu-tree 的 token 成本模式不符合 Skill 的「按需加载」设计**。当前机制：每次 @sddu-tree 触发 → 启动独立 subagent（加载完整 265 行 Agent prompt + opencode.json 注册上下文）→ 执行 TREE 生成。相比之下，Skill 模式：Agent 加载 Skill body 一次性执行完成，不产生额外 subagent 启动开销。两者完成相同任务（扫描→生成 TREE）的 token 效率差异明显。 | 影响每个 SDDU 工作流会话的 token 开销。假设每次工作流会话触发 @sddu-tree 2-3 次（根目录 + Feature 目录更新），日均 10 个工作流会话 → 日均 20-30 次 subagent 启动的额外 token 消耗。 |
| Q-004 | **缺少 Agent→Skill 降级的真实案例，使 FR-SKILL-001 的降级模型停留在理论层面**。FR-SKILL-001 已在 discovery §6.4 中将 @sddu-tree 评估为「⭐⭐ 可考虑 Skill 化」，但该评估仅是理论推演——没有一次端到端的降级实战来验证：(1) Skill 形态是否不损失任何能力？(2) 模板引用替换是否无遗漏？(3) 自举验证（用 sddu-tree Skill 导航自身的 Skill 文件目录）是否可行？这些问题的答案直接影响 FR-BUG-001 和 FR-WORKTREE-001 的 Skill 化路径信心。 | 影响整个 v3.1.0 的交付策略——FR-BUG-001（RICE 21.0, P0）和 FR-WORKTREE-001 的 Skill 化路径都依赖 FR-TREE-SKILL 的降级验证结果来降低不确定性。 |

### 3.2 次要问题
> 影响面中等、或为核心问题的衍生问题

| ID | 问题描述 | 影响范围 |
|----|---------|---------|
| Q-005 | **降级后 Skill body 与 Agent 模板逻辑的等价性保证**：原 @sddu-tree Agent 模板（265 行）包含 6 步工作流（扫描→检测→读取→生成→验证→报告）+ 状态标记规则 + 异常处理策略。迁移到 SKILL.md body 时需保证：所有指令逻辑完整迁移、状态标记规则（phase + status 双字段模型）无遗漏、异常处理场景全覆盖。 | 影响最终 Skill 的功能完整性——缺失任何一步会导致某些目录的 TREE 生成异常。 |
| Q-006 | **Skill 发现声明的已有注入 → 迁移过渡期**：FR-SKILL-001 已将 `## Skill 发现` 章节注入所有 Agent 模板，各 Agent 已具备按 `sddu-skill-discovery` 指引发现和加载 Skill 的能力。但当前 Agent 模板中仍保留「完成后自动触发 `@sddu-tree`」指令——若同时存在 Skill 发现机制和硬编码 `@sddu-tree` 调用，可能出现重复执行（Agent 通过 Skill 自己生成了一次 TREE，又调用 @sddu-tree 生成了一次）。迁移需要精确的时序控制。 | 影响 8 个主流程 Agent 模板的过渡期行为——需确保移除 `@sddu-tree` 调用和 Skill 发现加载是原子操作（同步完成），避免双写 TREE。 |
| Q-007 | **用户显式调用 `@sddu-tree` 的习惯中断**：部分用户习惯直接 `@sddu-tree .sddu/specs-tree-root/` 手动触发目录导航。Skill 化后用户无法直接 `@sddu-tree`——Agent 按 Skill 发现机制加载 sddu-tree Skill 自行执行。虽然用户可通过 `@sddu "扫描 .sddu/ 目录"` 间接使用，但命令习惯的改变需要文档和过渡期引导。 | 影响习惯显式调用 @sddu-tree 的高级用户（群体规模小但习惯深）。ROADMAP 已列入低风险项。 |

### 3.3 潜在问题
> 目前影响小但可能恶化，或信息不足待验证

| ID | 问题描述 | 影响范围 |
|----|---------|---------|
| Q-008 | **TREE 生成的一致性风险**：@sddu-tree 降级为 Skill 后，TREE 生成由各 Agent 自行执行（按 Skill 指引）。不同 Agent 的 LLM 模型/上下文差异可能导致生成的 TREE 格式轻微不一致（如文件简介的措辞风格、状态标记的 emoji 选择）。 | 影响所有 TREE.md 文件的质量一致性——尽管 Skill body 可定义严格格式模板，但 LLM 的非确定性本质不可完全消除差异。ROADMAP 已列入 🟡 中风险，建议缓解措施：(1) Skill body 定义严格 TREE 格式模板；(2) sddu-validate 新增 TREE 一致性检查。 |
| Q-009 | **sddu-tree Skill 的维护归属与生命周期**：作为框架级 Skill，sddu-tree 的 bug 修复、功能改进、文档更新应走什么流程？完整的 SDDU 流程（discovery→spec→plan→→build→review→validate）对于修订一个 Skill body 是否过重？如果用 @sddu-fast 直接改，质量如何保证？ | 影响 sddu-tree Skill 的长期可维护性——需要在 spec 阶段明确框架级 Skill 的轻量修订流程（FR-SKILL-001 discovery OP-004 已在更广层面提出此问题）。 |
| Q-010 | **自举验证的边界**：ROADMAP 提出「sddu-tree Skill 可立即用于自身的 Skill 文件目录导航」作为自举验证。但自举的具体场景是：sddu-tree 作为一个 Skill，能否扫描 `.sddu/skills/` 目录并为其生成 TREE.md？如果能，意味着 Skill 可以导航自己的存放目录——这是 Agent→Skill 降级后能力完整的强证明。 | 影响降级模型的验证可信度——自举成功 = 「Skill 不仅不丢能力，还能服务于自身的目录结构」，具有强烈的象征意义。 |

## 4. 竞品参考
> 记录竞品对类似问题的处理方式，回答"别人怎么做的、我们有什么不同"

| 竞品 | 是否处理过类似问题 | 处理方式 | 与我们场景的差异 |
|------|-------------------|---------|----------------|
| **Anthropic skill-creator**（github.com/anthropics/skills） | ✅ **验证了「用 Skill 替代轻量 Agent」的可行性** | skill-creator 本身是一个 Skill——它教 Claude 如何创建新的 Skill，而不是独立 Agent。其核心逻辑（引导对话 → 收集需求 → 产出 SKILL.md → 测试 → 优化 description → 打包）全在 SKILL.md body 中定义，不依赖独立 Agent。这直接证明：**高度流程化的操作指引可以作为 Skill 存在，不需要 Agent**。 | **完全一致**。@sddu-tree 的 6 步工作流（扫描→检测→读取→生成→验证→报告）与 skill-creator 的工作流（引导→收集→产出→测试→优化→打包）在结构上高度相似——都是流程化的操作指引，都不需要独立状态管理。Anthropic 的选择（以 Skill 而非 Agent 承载 skill-creator）直接支持我们的降级决策。 |
| **FR-SKILL-001: sddu-skill-discovery + sddu-skill-creator**（SDDU 框架自身） | ✅ **已建立 Skill 发现和创建基础设施** | `sddu-skill-discovery`（框架级 Skill）定义 SDDU Agent 如何发现可用 Skill（扫描源目录 → 识别 SKILL.md → 区分框架级/用户级）；`sddu-skill-creator`（框架级 Skill）提供对话式 Skill 创建引导。两者都是 Skill，不是 Agent。它们证明 SDDU 自己的 Skill 基础设施已就绪，sddu-tree 可以直接接入这个体系。 | sddu-tree 降级后将成为第三个框架级 Skill（继 skill-discovery 和 skill-creator 之后），进一步充实 SDDU Skill 生态。三个 Skill 的共存也验证了「框架级 Skills 命名空间隔离（sddu- 前缀）」的可行性。 |
| **OpenCode 原生 Skill 机制** | ✅ **提供 Skill 发现和加载的技术基础** | OpenCode 支持：指定目录扫描（`.opencode/skills/`）、语义匹配触发、`skill()` 工具按需加载 body、per-agent 权限控制。这些机制在 FR-SKILL-001 的 spec 阶段已被确认为 SDDU Skill 系统的底层依托。 | 无差异——FR-SKILL-001 已确认「复用 OpenCode 原生 Skill 机制，不自建引擎」。sddu-tree Skill 将通过 `sddu-skill-sync` 同步到 OpenCode 可发现的路径（`.opencode/skills/sddu/` 或 `.agents/skills/`），由 Agent 按 Skill 发现机制加载。 |
| **Superpowers Skills** | ✅ **提供 Skill 间交叉引用的先例** | Superpowers 的 Skill body 中使用 `REQUIRED SUB-SKILL` 声明 Skill 间的依赖关系，实现模块化 Skill 组合。 | sddu-tree 作为自包含 Skill（单一职责、无子 Skill 依赖），暂时无需此机制。但未来若 TREE 生成逻辑拆分出「状态解析」或「格式校验」子 Skill，可参考此模式。 |
| **@sddu-docs Agent**（SDDU 框架自身） | ⚠️ **另一个辅助 Agent，可能是下一个降级候选** | @sddu-docs 是第 11 个 Agent，职责为扫描 specs-tree-root 聚合项目全景。与 @sddu-tree 类似——都是辅助、流程化、无独立状态管理。FR-TREE-SKILL 的成功降级将直接推动 @sddu-docs 的降级评估。 | @sddu-docs 比 @sddu-tree 更复杂（需要聚合多个 Feature 的过程产物而非仅生成目录树），降级难度更大。FR-TREE-SKILL 应先完成，为 @sddu-docs 降级提供经验基线。 |

## 5. 假设与风险
> 记录问题挖掘过程中识别的假设和风险，供后续阶段验证和关注

### 5.1 关键假设
> 记录我们对问题理解所基于的假设，标注待验证项

| # | 假设内容 | 验证方式 |
|---|---------|---------|
| A-001 | **@sddu-tree 的 6 步工作流（扫描→检测→读取→生成→验证→报告）可以完整迁移到 SKILL.md body，不损失任何执行能力**。包括状态标记规则（phase + status 双字段模型）、异常处理策略、TREE 格式规范。 | 在 spec 阶段逐步骤对比原 Agent 模板（265 行）与 SKILL.md body 草案，产出能力覆盖度矩阵。build 完成后运行对比测试：同一 `.sddu/` 目录，分别用原 Agent 和新 Skill 生成 TREE，diff 输出确保等价。 |
| A-002 | **Agent 通过 Skill 发现机制加载 sddu-tree Skill 后，能自主完成 TREE 生成，不需要独立 subagent 的权限提升**。原 @sddu-tree 拥有 `edit: allow` + `bash: allow` 权限（允许写文件和执行 find 命令），Skill 化后依赖宿主 Agent 的权限——宿主 Agent（如 @sddu-build）本就拥有这些权限，应无权限降级问题。 | 在 build 阶段测试各宿主 Agent 加载 sddu-tree Skill 后执行 TREE 生成的完整流程，抽样验证 8 个主流程 Agent 均无权限不足导致的操作失败。 |
| A-003 | **8 个主流程 Agent 模板中所有 `@sddu-tree` 调用指令可以通过全局 grep 精确审计，无遗漏**。替换（移除硬编码调用 + 依赖 Skill 发现）是批量搜索替换 + 手动 review 的确定性操作，不依赖 LLM 推理。 | 在 spec 阶段执行：`grep -rn "sddu-tree" src/templates/agents/ --include="*.hbs"` 生成完整引用清单。plan 阶段列出逐模板替换计划。build 后再次 grep 确认零残留。 |
| A-004 | **sddu-tree Skill 的自举验证成立**——即 sddu-tree Skill 被加载后，能扫描 `.sddu/skills/` 目录并为其生成 TREE.md（包括导航自身的 SKILL.md 文件）。这需要 `.sddu/skills/` 目录实际存在且包含至少 2-3 个 Skill（sddu-skill-discovery、sddu-skill-creator、sddu-tree 自身）。 | build 完成后立即执行自举测试：@sddu-build 加载 sddu-tree Skill → 扫描 `.sddu/skills/` → 生成该目录的 TREE.md。验证生成的 TREE 正确列出 sddu-tree/SKILL.md 及其他 Skill。 |
| A-005 | **FR-SKILL-001 已注入的「Skill 发现」章节在所有 8 个 Agent 模板中已生效**，即每个 Agent 的 `.hbs` 模板末尾都有 `## Skill 发现` 章节，引用了 `sddu-skill-discovery/SKILL.md`。这是 sddu-tree Skill 能被 Agent 发现和加载的前提。 | 在 spec 阶段审计 8 个 Agent 模板，确认所有模板均已包含 Skill 发现章节（FR-SKILL-001 已于 2026-07-19 validated——可交叉验证其交付产物）。 |

### 5.2 主要风险
> 识别可能影响问题判断或后续决策的风险因素

| # | 风险描述 | 影响程度 |
|---|---------|---------|
| R-001 | **TREE 生成一致性下降**（ROADMAP 已识别）：不同 Agent 加载同一 Skill 后生成的 TREE 格式可能因 LLM 非确定性而轻微不一致。虽然 Skill body 可定义严格模板，但无法 100% 消除差异。 | 🟡 中 — 影响所有 TREE.md 文件的质量一致性。缓解措施：(1) Skill body 定义严格 TREE 格式模板（含示例）；(2) sddu-validate 新增 TREE 一致性检查；(3) 降级后 diff 对比原 Agent 生成物确保等价性。 |
| R-002 | **模板引用替换遗漏**（ROADMAP 已识别）：8+ Agent 模板中散落 `@sddu-tree` 调用指令（既有自动触发声明，也有显式引用），批量替换时可能遗漏某个模板。 | 🟡 中 — 漏掉的引用会导致该 Agent 仍尝试调用不存在的 @sddu-tree subagent（报错）。缓解措施：(1) 全局 grep 审计；(2) 替换后逐个模板运行验证；(3) FR-SKILL-001 的 Skill 发现声明已注入所有模板 → 天然具备 fallback。 |
| R-003 | **用户依赖 `@sddu-tree` 手动调用中断**（ROADMAP 已识别）：部分用户习惯显式 `@sddu-tree` 调用目录导航，Skill 化后无法直接使用此命令。 | 🟢 低 — 受影响的用户群体小。缓解措施：(1) ROADMAP/CHANGELOG 文档说明；(2) `@sddu` coordinator 指令中新增「目录导航」说明；(3) 如有持续反馈，可保留轻量别名 wrapper。 |
| R-004 | **降级后若能力不足需回滚为 Agent**：如果 sddu-tree Skill 在实际使用中发现无法覆盖某些边界场景（如跨 Feature 的大规模 TREE 重建），可能需要临时回滚到 Agent 模式。 | 🟢 低 — 原 Agent 模板和注册条目可在 git 历史中恢复；Skill 化方案本身就是无破坏性的（仅移除 Agent + 新增 Skill），回滚成本低。 |
| R-005 | **8 个 Agent 模板并发更新的合并冲突**：本项目无多人协作问题（单人开发），但如果未来有社区贡献者同时对 Agent 模板提出修改，sddu-tree Skill 化的批量模板更新可能与社区贡献产生合并冲突。 | 🟢 低 — 当前项目为单人维护，无并发冲突风险。未来若有社区贡献，可在 CONTRIBUTING.md 中约定模板变更流程。 |

## 6. 下一步建议
> 给出后续工作的优先级建议，回答"接下来优先做什么"

| 优先级 | 事项 | 说明 |
|--------|------|------|
| 🔴 高 | **进入 spec 阶段**：基于本问题清单，由 @sddu-spec 产出 Feature Specification。核心决策点：(1) Skill body 内容边界（哪些 Agent 模板逻辑迁移到 Skill，哪些保留在宿主 Agent 的 Skill 发现指引中）；(2) 模板引用替换的具体策略（是批量替换还是逐个处理）；(3) 验证标准（降级前后 TREE 输出 diff 一致性、8 个 Agent 模板零 `@sddu-tree` 残留、自举验证通过）。 | 本 discovery 已完成问题域梳理——4 个核心问题 + 3 个次要问题 + 3 个潜在问题已全部记录。问题定义清晰，用户画像明确，ROADMAP 已有详细的 RICE 分析和 Skill 化方案设计。spec 阶段可直接进入方案设计，无需额外调研。 |
| 🔴 高 | **产出 Skill body 初稿**：将 `src/templates/agents/sddu-tree.md.hbs`（265 行）的核心逻辑（§1 角色定位 → §2-3 上下文声明 → §4 前置验证 → §6 工作流 6 步 → §8 规则 → §9 异常处理）迁移为 SKILL.md 格式，保持 Progressive Disclosure。弃用 Agent 专属章节（如 §2 执行顺序、§3 依赖关系描述、§7 输出模板声明——这些是 Agent 骨架，Skill 不需要）。 | 此初稿可作为 spec 阶段的输入，帮助快速验证能力覆盖度（假设 A-001）。也可在 spec 阶段由 @sddu-spec 产出更精确的 Skill body 规范。 |
| 🟡 中 | **审计 `@sddu-tree` 引用位置**：执行 `grep -rn "@sddu-tree" src/templates/ --include="*.hbs"` + `grep -rn "sddu-tree" .opencode/plugins/ --include="*.json"`，产出完整引用清单。为 plan 阶段的批量替换做数据准备。 | 这是 plan 阶段的前置输入——不确定引用数量就无法准确评估替换工作量（ROADMAP 估算 0.3d）。同时验证假设 A-003 的可行性。 |
| 🟡 中 | **调研 Skill body 中 bash 命令的执行可行性**：原 @sddu-tree Agent 模板中包含 shell 命令（`find .sddu -type d`、`head -20 [file].md`）。Skill 化后，宿主 Agent 执行这些命令的行为是否与独立 subagent 一致？需要确认 OpenCode 的 Skill 工具调用上下文是否支持。 | 影响 Skill body 的编写方式——如果 Skill body 中的 bash 命令执行受限，需要用文件操作工具（glob/read/grep）替代，需在 spec 阶段明确。 |
| 🟢 低 | **评估 @sddu-docs 的降级可行性**：FR-TREE-SKILL 成功后，@sddu-docs 作为另一个辅助 Agent 是否也应降级？可在本 Feature 的 review/validate 阶段产出初步评估（不作为本 Feature 的 scope，仅为后续决策提供依据）。 | 此评估不在本 Feature scope 内，但 FR-TREE-SKILL 的验证结果（特别是「辅助 Agent 优先 Skill 化」范本的建立）将直接影响 @sddu-docs 的降级决策。 |

## 附录 A：与已有 Feature 的关系矩阵

| Feature | 关系 | 说明 |
|---------|:--:|------|
| **FR-SKILL-001**（SDDU Skill 系统）✅ | 🔴 **强依赖** | FR-TREE-SKILL 的执行完全依赖 FR-SKILL-001 的交付产物：(1) `sddu-skill-discovery` — 各 Agent 通过此 Skill 发现和加载 sddu-tree；(2) `sddu-skill-sync` — 将 sddu-tree Skill 从源目录同步到实际目录；(3) Agent 模板中已注入的 `## Skill 发现` 章节 — sddu-tree 的触发入口。FR-SKILL-001 已于 2026-07-19 validated，依赖已满足。 |
| **FR-BUG-001**（Bug 流程 → sddu-bug Skill） | 🟢 **受益于** | FR-BUG-001 同样走 Skill 化路径（Feature→Skill 降级），FR-TREE-SKILL 的降级实战经验（引用审计方法、模板替换策略、等价性验证）可直接复用。且 FR-TREE-SKILL 若成功，将提升 FR-BUG-001 团队对 Skill 化路径的信心。 |
| **FR-WORKTREE-001**（Git Worktree → sddu-worktree Skill） | 🟢 **受益于** | 同上，FR-WORKTREE-001 是三 Skill 降级候选之一，共享降级模式经验。 |
| **@sddu-docs**（项目全景生成 Agent） | 🟡 **潜在受益** | @sddu-docs 是另一个辅助 Agent（扫描 specs-tree-root → 聚合项目全景），若 FR-TREE-SKILL 成功，「辅助 Agent 优先 Skill 化」范本将推动 @sddu-docs 的降级评估。但 @sddu-docs 降级不在本 Feature scope 内。 |
| **FR-STATUS-001**（v3.0.0 状态增强）✅ | 🟢 **间接依赖** | @sddu-tree 当前使用的 `phase + status` 双字段状态模型是 FR-STATUS-001 的产出。sddu-tree Skill body 需保持对此模型的支持。FR-STATUS-001 已于 v3.0.1 完成，无风险。 |
| **FR-FRAMEWORK-ARCH-001**（v4.0.0 三域分层）✅ | 🟢 **上下文借用** | v4.0.0 的三域分层（src/templates/ 模板域 + .opencode/plugins/ 插件域）定义了 Skill 存放路径的规范——sddu-tree Skill body 应存放在 `src/skills/`（源码域），通过 `sddu-skill-sync` 同步到 `.opencode/skills/`（实际域）。 |

## 附录 B：@sddu-tree Agent 模板关键信息速查

> 来源：`src/templates/agents/sddu-tree.md.hbs`（2026-07-19 审计）

| 维度 | 当前状态 | Skill 化后变化 |
|------|---------|---------------|
| **注册方式** | `opencode.json` subagent 注册（mode: subagent, temp: 0.2） | 注销 opencode.json 条目 → 仅作为 SKILL.md 存在 |
| **权限** | edit: allow, bash: allow, webfetch: deny | 继承宿主 Agent 权限（8 个主流程 Agent 均已有 edit + bash 权限） |
| **前置验证** | 检查 `.sddu/` 目录存在 | 相同——Skill body 中保留此检查 |
| **工作流** | 6 步：扫描→检测缺失→读取文件→生成 TREE→验证已有→输出报告 | 完整迁移 6 步到 Skill body |
| **状态标记规则** | v3.0.0 两字段模型（phase + status） | 保留——不变 |
| **TREE 格式** | 内置固定格式（含目录树、文件说明表、子目录表） | 保留——不变 |
| **异常处理** | 5 场景（目录不存在/为空/TREE 已存在/权限问题/state.json 异常） | 保留 5 场景处理策略 |
| **Skill 发现章节** | ✅ 已包含（末尾 `## Skill 发现`） | 保留——这是 sddu-tree 自身作为 Skill 触发后，仍能加载其他 Skill 的保证 |
| **修订记录** | v3.0.1 → v3.0.2 → v3.0.3 | 迁移到 SKILL.md 后重新开始版本记录 |

## 修订记录
> 记录本文档的版本变更历史

| 版本 | 变更说明 | 日期 | 修订人 |
|------|---------|------|--------|
| v1.0 | 初始创建 — 基于 ROADMAP v16.0.0 评估 + FR-SKILL-001 discovery §6.4 已有分析 + @sddu-tree Agent 模板全量审计 + SDDU 架构决策「Agent 固定 + Skill 扩展」上下文。识别 4 个核心问题、3 个次要问题、3 个潜在问题。产出用户画像（3 角色）、竞品参考（5 条）、假设（5 条）、风险（5 条）、关系矩阵（6 Feature）。 | 2026-07-19 | SDDU Discovery Agent |
