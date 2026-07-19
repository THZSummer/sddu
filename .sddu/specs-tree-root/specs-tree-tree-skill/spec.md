# Feature Specification：@sddu-tree Agent 技能化

> **文档定位**: SDDU 需求规范 — 定义功能需求、非功能需求和边界情况，作为 plan 阶段的输入  
> **前置依赖**: discovery.md（问题清单）✅  
> **创建人**: SDDU Spec Agent  
> **创建时间**: 2026-07-19  
> **版本**: v1.0  
> **更新人**: SDDU Spec Agent  
> **更新时间**: 2026-07-19  
> **更新说明**: 初始创建 — 基于 discovery.md Q-001~Q-010 全量问题清单 + @sddu-tree Agent 模板全量审计 + 用户决策（全量迁移、业务指令替换、P0）

## 1. 元数据
> Feature 基本信息

| 字段 | 值 |
|------|-----|
| Feature ID | FR-TREE-SKILL |
| 名称 | @sddu-tree Agent 技能化 |
| 优先级 | P0 |
| 目标版本 | v3.1.0 |
| RICE | 17.0（Reach 5 / Impact 6 / Confidence 85% / Effort 1.5d） |
| 类型 | Agent→Skill 降级（辅助 Agent 降级为框架级 Skill） |
| 强依赖 | FR-SKILL-001（SDDU Skill 系统，已于 2026-07-19 validated） |

## 2. 上下文
> 回顾问题背景和目标用户

本 Feature 解决的核心问题（来源于 discovery.md §3.1）：

**Q-001**: @sddu-tree 以独立 Agent 形态存在，与 FR-SKILL-001 确立的「Agent 固定 + Skill 扩展」架构原则冲突。@sddu-tree 的职责（扫描目录→检测缺失→读取文件→生成 TREE→验证已有→输出报告）是高度流程化、无状态、无独立生命周期需求的可复用执行流程——完全符合 Skill 化条件，不应保留为 Agent。

**Q-002**: 8 个主流程 Agent 模板（discovery/spec/plan/tasks/build/review/validate/docs）末尾硬编码了 `@sddu-tree` 自动调用指令，形成隐性调度耦合。修改 TREE 生成逻辑需跨 8+ 模板全局替换。

**Q-003**: Token 成本模式不符合 Skill「按需加载」设计——每次 @sddu-tree 触发启动独立 subagent（含完整 265 行 Agent prompt），而 Skill 按需加载不产生额外 subagent 启动开销。

**Q-004**: 缺少 Agent→Skill 降级的真实案例，使 FR-SKILL-001 的降级模型停留在理论层面。@sddu-tree 是最合适的首个验证案例：轻量、边界清晰、无状态、不涉及主流水线。

**目标用户**：
- **SDDU 框架维护者** — 减少跨模板维护成本，简化 Agent 清单
- **SDDU 使用者** — 消除「辅助 Agent vs 主流程 Agent」的认知负担
- **SDDU 架构决策者** — 为后续 FR-BUG-001、FR-WORKTREE-001、@sddu-docs 降级提供实战范本

## 3. 目标与非目标
> 明确需求范围，防止范围蔓延

### 3.1 目标 (Goals)
> 明确本次要达成的业务目标

| # | 目标描述 |
|---|---------|
| G-001 | 将 @sddu-tree 从独立 Agent 降级为框架级 Skill（`sddu-tree`），注销 opencode.json 中的 subagent 注册条目。Agent 清单从 11 个收缩为 10 个，消除「辅助 Agent 与主流程 Agent 并列」的架构不一致。 |
| G-002 | 完整迁移原 Agent 模板（265 行）的 6 步工作流（扫描→检测缺失→读取文件→生成 TREE→验证已有→输出报告）、状态标记规则（v3.0.0 phase + status 双字段模型）、7 条行为规则、5 场景异常处理策略到 SKILL.md body，保证零能力损失。 |
| G-003 | 将 8 个主流程 Agent 模板中的硬编码 `@sddu-tree` 自动调用指令替换为 Skill 发现引用（通过已注入的 `## Skill 发现` 章节按需加载 sddu-tree Skill），消除隐性调度耦合。 |
| G-004 | 建立 Agent→Skill 降级的实战范本——覆盖完整的降级流程（审计→迁移→替换→同步→验证→自举），产出可复用降级 checklist，为后续 FR-BUG-001、FR-WORKTREE-001、@sddu-docs 降级提供经验基线。 |
| G-005 | 通过自举验证（sddu-tree Skill 扫描 `.sddu/skills/` 目录生成 TREE）和等价性验证（降级前后 TREE 输出 diff 一致性），证明 Skill 形态不损失任何能力。 |

### 3.2 非目标 (Non-Goals)
> 明确本次不涉及的范围，防止需求蔓延

| # | 明确不做 |
|---|---------|
| NG-001 | **不降级 @sddu-docs**。@sddu-docs 降级不在本 Feature scope 内——尽管它是下一个候选，但其复杂度更高（需聚合多 Feature 产物），FR-TREE-SKILL 仅为其提供经验基线。 |
| NG-002 | **不修改 TREE 生成逻辑本身**。本 Feature 仅改变 @sddu-tree 的存在形态（Agent→Skill），不调整其工作流步骤、TREE 格式、状态标记规则或异常处理策略。任何 TREE 逻辑改进（如支持新文件类型、新状态模型字段）属于独立 Feature。 |
| NG-003 | **不修改 OpenCode 原生 Skill 加载机制**。sddu-tree Skill 复用 FR-SKILL-001 已建立的发现/同步/加载机制，不做底层引擎层面的改动。 |
| NG-004 | **不提供 @sddu-tree 用户级别名 wrapper**。手动调用习惯由文档过渡引导，不在框架层面保留命令别名。若有持续反馈，可在后续版本评估。 |
| NG-005 | **不调整 sddu-tree Skill 存放路径规范**。框架级 Skill 统一存放在 `.sddu/skills/sddu-tree/SKILL.md`（源码域），通过 `sddu-skill-sync` 同步到实际域——此规范由 FR-SKILL-001 定义，本 Feature 沿用。 |

## 4. 用户故事
> 以用户视角描述功能需求

| # | 作为… | 我想要… | 以便… |
|---|-------|---------|-------|
| US-001 | SDDU 框架维护者 | @sddu-tree 以 Skill 形态存在而非独立 Agent | 所有 Agent 都可以通过 Skill 发现机制按需加载它，我不再需要为 TREE 格式变更跨 8 个模板手动 grep 替换 |
| US-002 | SDDU 使用者 | 每次完成 spec→build 流程后 TREE.md 自动更新（与现在行为一致） | 我的目录导航保持最新，但我不需要在 Agent 列表里区分「辅助 Agent」和「主流程 Agent」 |
| US-003 | SDDU 架构决策者 | 拥有一次完整的 Agent→Skill 降级实战记录（审计→迁移→替换→同步→验证→自举） | 后续 FR-BUG-001、FR-WORKTREE-001、@sddu-docs 的降级决策有真实数据支撑，降级模型不再是纸上谈兵 |
| US-004 | 后续 Feature 开发者 | 有一个可复用的降级 checklist 和验证方法 | 我可以在自己的 Feature 中参考 FR-TREE-SKILL 的经验，直接复用验证工具和流程 |
| US-005 | SDDU 框架维护者 | Agent 清单收缩为 10 个（移除辅助 Agent 类别） | opencode.json 减少一个注册条目，Agent 分类表更简洁清晰 |

## 5. 功能需求 (FR)
> 每个需求必须有唯一标识符且可测试

| ID | 需求描述 | 验收标准 | 优先级 |
|----|---------|---------|--------|
| FR-001 | **创建 sddu-tree SKILL.md**：将原 `@sddu-tree` Agent 模板（`src/templates/agents/sddu-tree.md.hbs`，265 行）的完整逻辑迁移为框架级 Skill 文件 `.sddu/skills/sddu-tree/SKILL.md`。迁移内容包括：(a) 角色定位与职责边界（目录扫描→TREE 生成）；(b) 前置验证逻辑（`.sddu/` 目录存在性检查）；(c) 6 步工作流（扫描目录树→检测缺失 TREE→读取文件生成简介→生成 TREE→验证已有 TREE→输出报告）；(d) 状态标记规则（v3.0.0 phase + status 双字段模型）；(e) 7 条行为规则；(f) 5 场景异常处理策略。使用 Progressive Disclosure 模式：frontmatter（description + 触发语义优化）→ Stage 2 概述（职责/触发条件/依赖）→ Stage 3 详细 body（工作流/规则/异常处理）。弃用 Agent 专属骨架章节（执行顺序、依赖关系、输出模板声明）。 | (1) SKILL.md 存在于 `.sddu/skills/sddu-tree/SKILL.md`；(2) 逐项对比 Agent 模板 6 步工作流，覆盖率 100%；(3) 5 条异常处理场景全部覆盖；(4) phase + status 双字段状态标记规则完整。 | P0 |
| FR-002 | **注销 opencode.json 中的 @sddu-tree 注册条目**：从 `.opencode/plugins/sddu/opencode.json` 的 subagents 节中移除 `sddu-tree` 条目（含 description、model、prompt 字段）。注销后 `@sddu-tree` 命令不再可用，用户尝试该命令时 LLM Agent 将收到 subagent not found 错误。 | (1) `grep "sddu-tree" .opencode/plugins/sddu/opencode.json` 返回零匹配；(2) 尝试 `@sddu-tree` 命令时预期失败（无法找到 subagent）。 | P0 |
| FR-003 | **移除 sddu-tree Agent 模板文件**：删除源文件 `src/templates/agents/sddu-tree.md.hbs`。此文件注销为 Agent 后无消费者，保留将造成混淆（与新的 SKILL.md 并存）。若构建流程自动将 `.hbs` 渲染到 `.opencode/agents/`，需同步清理构建产物中的 `.opencode/agents/sddu-tree.md`。 | (1) `src/templates/agents/sddu-tree.md.hbs` 文件不存在；(2) `.opencode/agents/sddu-tree.md`（如存在）已移除。 | P0 |
| FR-004 | **更新 8 个主流程 Agent 模板中的 @sddu-tree 调用**：将以下模板中的硬编码 `@sddu-tree` 自动调用指令替换为 Skill 发现引用声明。核心替换模式：`完成后自动触发 `@sddu-tree` 扫描并更新 `.sddu/` 目录导航。` → `完成后根据 `## Skill 发现` 章节加载 `sddu-tree` Skill，扫描并更新 `.sddu/` 目录导航。`。涉及的 8 个模板：(a) sddu-discovery.md.hbs（完成协议 §7）；(b) sddu-spec.md.hbs（完成协议 §7）；(c) sddu-plan.md.hbs（完成协议 §7）；(d) sddu-tasks.md.hbs（完成协议 §7）；(e) sddu-build.md.hbs（完成协议 §7）；(f) sddu-review.md.hbs（完成协议 §7）；(g) sddu-validate.md.hbs（完成协议 §7）；(h) sddu-docs.md.hbs（完成协议 + §3 边界声明中多处引用——需逐处替换）。不替换修订记录中的历史引用（保持历史记录完整性）。额外处理：sddu-fast.md.hbs 的文档性引用（仅提及 @sddu-tree 为"由 @sddu-tree 生成"）改为"由 sddu-tree Skill 生成"；sddu.md.hbs coordinator 模板的 Agent 清单表移除此行。 | (1) 所有 8 个模板中的「完成后自动触发 `@sddu-tree`」指令已替换为 Skill 发现引用；(2) sddu-docs.md.hbs 中 §3 边界声明表中 @sddu-tree 引用全部更新；(3) `grep -rn "@sddu-tree" src/templates/agents/ --include="*.hbs" \| grep -v "修订记录\|v[0-9]"` 仅保留修订记录中的历史引用；(4) sddu.md.hbs Agent 清单表移除 @sddu-tree 行。 | P0 |
| FR-005 | **通过 sddu-skill-sync 同步 sddu-tree Skill**：将 `.sddu/skills/sddu-tree/SKILL.md` 同步到实际域（`.opencode/skills/sddu/SKILL.md` 或 LLM Agent 工具对应的实际 Skill 发现路径）。同步行为由 FR-SKILL-001 建立的 `sddu-skill-sync` 机制处理：扫描源目录→检测实际目录→全量拷贝+管辖标识标记→清理残留→输出同步报告。 | (1) 执行 `sddu-skill-sync` 后 sddu-tree SKILL.md 出现在实际域路径中；(2) 同步报告确认 sddu-tree Skill 同步成功；(3) 管辖标识（`.sddu-managed` 或等效标记）存在。 | P0 |
| FR-006 | **自举验证——sddu-tree Skill 扫描自身的 Skill 目录**：验证 sddu-tree Skill 被 Agent 加载后能扫描 `.sddu/skills/` 目录并为其生成 TREE.md。该 TREE 应正确列出 `sddu-tree/SKILL.md`（自身）、`sddu-skill-discovery/SKILL.md`、`sddu-skill-creator/SKILL.md` 以及其他 Skill 文件。自举成功 = Skill 不仅不丢能力，还能服务于自身的目录结构——具有强烈的象征意义。 | (1) `.sddu/skills/TREE.md` 生成成功；(2) TREE 中正确列出 sddu-tree/SKILL.md（含简介）；(3) TREE 中正确列出 sddu-skill-discovery/SKILL.md 和 sddu-skill-creator/SKILL.md。 | P1 |
| FR-007 | **等价性验证——降级前后 TREE 输出 diff 一致性**：选取 2 个代表性目录（`.sddu/specs-tree-root/` 和 `.sddu/specs-tree-root/specs-tree-tree-skill/`），分别用：(a) 降级前的 @sddu-tree Agent（需保留 Agent 模板快照）；(b) 降级后的 sddu-tree Skill（由 @sddu-build 加载），生成 TREE.md。对两组输出执行 `diff` 对比，预期差异仅限于文件系统的时间戳差异（如 state.json 的 updatedAt）和生成者的标记差异（如 TREE 元数据行），不涉及结构/内容差异。 | (1) 两组 TREE 输出的目录树结构一致；(2) 两组 TREE 输出的文件说明表内容一致（除时间戳和生成者标记）；(3) 状态标记（phase + status）一致。 | P1 |
| FR-008 | **原子迁移——无重复执行窗口**：确保 8 个 Agent 模板中的 `@sddu-tree` 调用移除与 Skill 发现声明激活是原子操作（同一次提交或同步完成）。不允许出现过渡状态——即某个 Agent 模板同时保留了 `@sddu-tree` 调用和 Skill 发现声明，导致 TREE 被重复生成（一次由 Agent 加载 Skill 执行，一次由 @sddu-tree subagent 执行）。 | (1) 在任何 Agent 模板中，不存在「同时含有 `@sddu-tree` 调用指令和 sddu-tree Skill 加载声明且两者都激活」的状态；(2) 构建产物（渲染后的 `.md`）同样满足此条件。 | P0 |
| FR-009 | **Agent 模板 Skill 发现声明验证**：确认 8 个主流程 Agent 模板末尾均已包含 `## Skill 发现` 章节（FR-SKILL-001 已注入），引用 `sddu-skill-discovery/SKILL.md`。这是 sddu-tree Skill 能被 Agent 发现和加载的前提——如果某个模板缺少此声明，该 Agent 无法通过发现机制加载 sddu-tree Skill。 | (1) 8 个模板均包含 `## Skill 发现` 章节；(2) 章节内容正确引用 sddu-skill-discovery 路径；(3) 如有缺失，需先修复再执行本 Feature。 | P0 |
| FR-010 | **更新 sddu.md coordinator 模板**：移除 coordinator 模板（`src/templates/agents/sddu.md.hbs`）中 Agent 清单表的 `@sddu-tree` 行（当前 §2 表格第 10 行），并更新 Agent 数量统计说明（从"11 个"改为"10 个"）。如表格中有分类列（主流程/辅助），一并移除辅助分类。 | (1) coordinator 模板 Agent 清单表中无 @sddu-tree；(2) Agent 数量描述更新为 10 个；(3) `grep "@sddu-tree" src/templates/agents/sddu.md.hbs` 仅返回修订记录中的历史引用（如有）。 | P0 |

## 6. 非功能需求 (NFR)
> 性能、安全、可用性等跨切面需求

| ID | 类别 | 需求描述 | 验收标准 |
|----|------|---------|---------|
| NFR-001 | 性能（Token 效率） | sddu-tree Skill 按需加载后，与原 @sddu-tree subagent 启动相比，完成相同任务（扫描→生成 TREE）的 token 消耗应降低。Skill 模式不产生额外 subagent 启动开销——Skill body 在 Agent 上下文中加载，不启动独立对话会话。 | 选取同一目录，对比 (a) @sddu-tree subagent 调用，(b) Agent 加载 sddu-tree Skill 自主执行，两者的 token 消耗（可通过 API 计费数据估算或 API 响应中的 usage 字段对比）。预期 Skill 模式 token 消耗更低。 |
| NFR-002 | 一致性（TREE 格式确定性） | 不同 Agent（如 @sddu-spec、@sddu-build、@sddu-review）加载同一 sddu-tree Skill 后扫描同一目录，生成的 TREE 格式（目录树结构、文件说明表字段、状态标记）应保持一致。LLM 的非确定性不可完全消除，但格式偏差应在可控范围内——Skill body 中的严格模板（含示例 TREE 截图级格式规范）应最大程度约束输出。 | (1) 3 个不同 Agent 加载 Skill 扫描同一目录，3 份 TREE 输出的目录树一致；(2) 文件说明表结构（列、排序）一致；(3) 状态标记规则应用一致；(4) 如存在格式偏差，偏差仅限于文件简介措辞的自由度（非结构性）。 |
| NFR-003 | 兼容性（存量 TREE 无损） | 降级后由 sddu-tree Skill 生成的 TREE.md 必须保持与原 @sddu-tree Agent 生成的 TREE.md 向后兼容——存量 TREE.md 文件无需重新生成即可被 sddu-tree Skill 正确识别、验证和增量更新。Skill 生成的 TREE 新增/更新条目格式与原 Agent 完全一致（无字段增减）。 | (1) 用 sddu-tree Skill 验证一个由原 @sddu-tree Agent 生成的存量 TREE.md，识别为「内容一致→跳过」而非「格式不兼容→重建」；(2) 增量更新（新增一个文件后重新运行）仅更新变化部分，不变部分保持原样。 |
| NFR-004 | 可维护性（Skill body 自包含） | sddu-tree SKILL.md 应为自包含文档——所有执行指令、格式模板、状态规则、异常策略均定义在 Skill body 内部，不依赖宿主 Agent 除 Skill 发现章节外的额外上下文注入。这意味着任何具备 Skill 发现能力的 Agent 加载此 Skill 后即可独立完成 TREE 生成，无需猜测外部规则。 | (1) 加载 sddu-tree Skill 后，Agent 不需要额外的外部指令（如用户额外说明 TREE 格式）即可生成正确 TREE；(2) Skill body 内的所有引用（如状态标记规则、异常场景）均为内部自引用或指向已有 SDDU 文档的稳定引用。 |
| NFR-005 | 过渡期（用户感知中断最小化） | 手动调用习惯的中断（从 `@sddu-tree` 命令到 Skill 自动触发）应有文档说明和引导。不保留别名 wrapper，但需在降级完成后提供清晰的用户通知。 | (1) ROADMAP/CHANGELOG 中记录行为变更；(2) 降级完成后的 summary 中提示用户新的使用方式。 |

## 7. 边界情况 (EC)
> 异常场景和边界条件的处理方式

| ID | 场景 | 处理方式 |
|----|------|---------|
| EC-001 | **`.sddu/` 目录不存在** | sddu-tree Skill 加载后执行前置验证：如 `.sddu/` 目录不存在，Skill 应提示宿主 Agent 报告「❌ .sddu/ 目录不存在，请先初始化 SDDU 工作空间」，不抛异常。处理方式与原 Agent 模板 §9 异常处理第 1 条一致。 |
| EC-002 | **Agent 模板中 @sddu-tree 引用泄漏** | 构建完成后执行全局审计：`grep -rn "@sddu-tree" src/templates/agents/ --include="*.hbs"`。预期仅保留修订记录中的历史引用。如发现非修订记录的引用，标记为 FR-004 未完成——需补充替换。此检查应纳入 build 阶段的验收步骤。 |
| EC-003 | **双写 TREE——同时存在子 agent 调用和 Skill 加载** | 原子迁移（FR-008）应防止此场景。但如果因人为失误导致某模板同时保留两个触发路径，后果是该目录的 TREE.md 被重复生成（第二次覆盖第一次）。Mitigation：(a) FR-008 原子迁移验收必须通过；(b) sddu-validate 可在验证阶段做重复 TREE 写入检测（可选，不阻碍 P0）。 |
| EC-004 | **Skill 加载失败——Agent 无法找到 sddu-tree Skill** | 如果 Agent 的 Skill 发现机制未能找到 sddu-tree SKILL.md（如路径未同步、sync 未执行、管辖标识冲突），Agent 应：(a) 不中断主流程——TREE 生成失败不应阻塞 spec/build 等核心任务；(b) 在报告/摘要中注明「⚠️ sddu-tree Skill 未找到，目录导航未更新」。此为降级优雅处理——原 @sddu-tree subagent 不存在时会直接报错，Skill 模式应更优雅。 |
| EC-005 | **大规模目录树——多层嵌套扫描性能** | 当扫描 `.sddu/specs-tree-root/` 包含大量子目录（如 20+ Feature 目录）时，Skill 的 bash 命令（`find .sddu -type d` 等）执行时间线性增长。虽然当前规模不大，但 Skill body 应在「规则」中注明性能边界（如建议扫描范围 ≤ 50 个目录），超出时建议分步执行或指定子目录。 |
| EC-006 | **state.json 缺少 phase/status 字段** | 与当前 Agent 模板 §9 异常处理第 5 条一致：标记为「⚠️ 状态异常」并提示使用 R5 一致性检测修复。Skill body 中完整保留此逻辑。 |
| EC-007 | **TREE.md 已存在但格式来自旧版 Agent（如 v3.0.0 之前）** | Skill 验证已有 TREE 时，应按「内容不一致→更新」策略处理。旧格式 TREE 不会导致解析失败——Skill 只对比实际目录结构与 TREE 中的文件列表，不依赖 TREE 内部格式结构。 |
| EC-008 | **sddu-tree Skill 自身被删除或损坏** | 如果 `.sddu/skills/sddu-tree/SKILL.md` 被意外删除或损坏，Agent 加载 Skill 时失败（参见 EC-004）。恢复方式：通过 `sddu-skill-sync` 从源码域重新同步（如果有源码备份）或通过 git 历史恢复。 |

## 8. 开放问题
> 待决策事项和需要进一步调研的内容

| # | 问题 | 状态 |
|---|------|:--:|
| OP-001 | **TREE 一致性验证是否作为 sddu-validate 的内置检查项**？discovery R-001 建议由 sddu-validate 新增 TREE 一致性检查（对比 Skill 生成的 TREE 与预期格式模板）。此需求是否纳入本 Feature scope 还是作为独立 Feature？（建议：纳入本 Feature——在 FR-007 等价性验证中附带实现） | 待决策 |
| OP-002 | **框架级 Skill 的轻量修订流程**（discovery Q-009）：sddu-tree Skill 的 bug 修复走完整 SDDU 7 阶段还是用 @sddu-fast + review 简化流程？此问题影响所有框架级 Skill（sddu-skill-discovery、sddu-skill-creator、sddu-tree），但本 Feature 只需明确 sddu-tree 的修订策略——建议暂定：小改动（≤50 行）用 @sddu-fast + @sddu-review 轻量流程，大改动（>50 行）走完整 SDDU。是否接受？ | 待决策 |
| OP-003 | **@sddu-docs 降级评估的时间窗口**：discovery 建议在 FR-TREE-SKILL 的 review/validate 阶段产出初步评估。此评估产物的存放位置：作为本 Feature 的附录，还是独立创建一个 discovery 记录？（建议：作为独立 discovery 记录 `.sddu/specs-tree-root/specs-tree-docs-skill/discovery.md`，由 @sddu-discovery 在 review 后创建） | 待决策 |
| OP-004 | **手动触发 `@sddu-tree` 的替代方案**：Skill 化后用户无法直接 `@sddu-tree`。方案 A：通过 `@sddu "扫描 .sddu/ 目录"`（coordinator 路由到合适的主流程 Agent，Agent 加载 Skill 执行）。方案 B：提供一个轻量级用户 Skill（如 `sddu-nav`），用户可直接 `@sddu-nav` 触发。方案 B 背离了「Agent 固定 + Skill 扩展」中「用户不应直接调用框架级 Skill」的设计理念。建议：先采用方案 A，观察用户反馈，0 反馈则不做方案 B。 | 待决策 |
| OP-005 | **sddu-skill-sync 的触发机制**：sddu-tree SKILL.md 创建后需要同步到实际域。同步是作为 (a) 本 Feature build 阶段的原子步骤，(b) 用户手动执行 `@sddu-skill-sync`，还是 (c) SDDU 自动检测 Skill 变更并同步？FR-SKILL-001 当前采用方案 (b)——显式手动同步。本 Feature 沿用此模式。 | 已决策——沿用 FR-SKILL-001 的手动同步模式 |

## 9. 拆分建议
> 如发现可独立交付的子模块，向用户建议拆分

本 Feature 不拆分。各 FR 之间存在强时序依赖（FR-001→FR-002→FR-003→FR-004→FR-005→FR-006/FR-007），且所有 FR 共享同一个交付物——将 @sddu-tree 从 Agent 转换为 Skill，拆分会引入不必要的集成复杂度。无论用户拒绝拆分、接受拆分还是自定义方案，本 Feature 均以单 Feature 模式执行。

完整性和依赖链分析：
- FR-001（SKILL.md 创建）必须先于 FR-005（sync）和 FR-007（等价性验证）
- FR-002/FR-003（注销 Agent）必须在 FR-004（替换模板引用）之后——否则模板引用指向已注销的 Agent
- FR-008（原子迁移）要求 FR-002+FR-003+FR-004 同时完成
- FR-006（自举验证）依赖 FR-001+FR-005
- FR-007（等价性验证）依赖 FR-001+FR-005 完成
- FR-009/FR-010 可与 FR-001 并行

## 修订记录
> 记录本文档的版本变更历史

| 版本 | 变更说明 | 日期 | 修订人 |
|------|---------|------|--------|
| v1.0 | 初始创建 — 基于 discovery.md Q-001~Q-010 全量问题清单 + @sddu-tree Agent 模板全量审计（265 行） + grep 审计 25 处 @sddu-tree 引用 + opencode.json 注册条目（L62-66）。产出 10 个 FR、5 个 NFR、8 个 EC、5 个开放问题。决策确认：全量迁移、业务指令替换、P0 优先级。 | 2026-07-19 | SDDU Spec Agent |
