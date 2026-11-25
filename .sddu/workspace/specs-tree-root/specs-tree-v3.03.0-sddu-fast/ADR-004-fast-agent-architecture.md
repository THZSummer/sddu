# ADR-004: @sddu-fast Agent 独立子 Agent 架构及复杂度阈值策略

## 状态
PROPOSED

## 背景

SDDU 框架当前缺少轻量入口，用户面对 60-70% 的日常简单任务时，被迫在"走完整 8 阶段流程（产出 6-8 份文档 + state.json）"和"完全不用 SDDU"之间二选一。FR-FAST-001 引入 `@sddu-fast` 快速模式 Agent，需要决策以下架构层面的关键设计：

1. **Agent 架构形态**：Fast 是独立子 Agent、还是嵌入 `@sddu` 协调器、还是完全独立不与协调器互通？
2. **状态机集成**：Fast 是否参与 SDDU 状态机（agentToPhaseMap）？
3. **复杂度判断机制**：如何量化"简单任务"与"复杂任务"的边界（QP-001）？
4. **行为约束保障**：如何确保 Fast Agent 不越界产出过程文档、不操作 state.json？

## 决策

### 决策 1：独立子 Agent 架构

`@sddu-fast` 以**独立子 Agent** 形态存在，通过以下 4 个组件实现：

| 组件 | 说明 |
|------|------|
| `src/templates/agents/sddu-fast.md.hbs` | Fast Agent 的 Handlebars 行为模板（核心） |
| `.opencode/agents/sddu-fast.md`（目标项目） | `install.sh` 从 `dist/sddu/agents/` 部署的运行时 Prompt |
| `sddu-agents.ts` builtinAgents[] | TypeScript 注册（**不加入** agentToPhaseMap） |
| `opencode.json.hbs` agent:{} | OpenCode 配置注册 |

**拒绝的替代方案**：
- **方案 B（协调器内联）**：违反 `@sddu` "只路由不设计"核心原则，需将协调器权限从 deny 改为 allow（edit/bash），破坏安全边界，且在单一模板中混合路由逻辑和执行逻辑导致维护灾难。
- **方案 C（无协调器感知）**：不满足 FR-001（@sddu 可调度 Fast）和 FR-009（路由调度集成）的核心验收标准，双入口孤立违背"融入 SDDU 路由体系"的设计意图。

### 决策 2：零状态机集成

`@sddu-fast` **不加入** `agentToPhaseMap`（`sddu-agents.ts`）。

- Fast 调用的完成不触发 phase 流转
- Fast 不产生 state.json 更新
- Fast 不出现在 `@sddu 状态` 仪表盘中
- `sddu-agents.ts` 中的 `updateStateForAgentCall()` 对 `sddu-fast` 返回"无状态更新的必要"

### 决策 3：双重阈值复杂度判断

采用**协调器预筛选 + Fast Agent 自主判断**的双重机制：

#### 协调器侧（粗粒度，保守策略）

| 信号 | 判定 | 动作 |
|------|------|------|
| 轻量关键词 + 无重量关键词 | 简单 | 调度到 @sddu-fast |
| 明确 pipeline 调用格式 | 复杂 | 走标准路由 |
| 不确定 | 模糊 | 给出两个选项，让用户决策 |

**保守原则**：宁可漏过简单任务让用户手动 `@sddu-fast`，不将复杂任务误路由到 Fast。

#### Fast Agent 侧（细粒度，可计数阈值）

| 信号 | 阈值 | 判定 |
|------|------|:--:|
| 文件影响数 | ≥ 5 | 建议升级 |
| 接口签名变更 | 任何 public API/导出函数签名变更 | 建议升级 |
| 跨模块数 | ≥ 2 独立模块 | 建议升级 |
| 需要新 Feature 目录 | 任何 | 建议升级 |
| 需要 ADR/正式 spec | 任何 | 建议升级 |
| 边界模糊 | 3-4 文件、小范围接口变更 | **询问用户**（EC-009） |

### 决策 4：模板层行为约束

Fast Agent 的行为约束通过 **.hbs 模板中的指令文本**实现，而非代码层 guardrail：

- 模板中明确列出"禁止行为清单"（8 项：不操作 phase、不写 state.json、不产出 spec/plan/tasks 文档、不创建 specs-tree 目录、不修改 .sddu/……）
- 模板中定义"任务边界对照表"（3 列：适合 Fast、不适合 Fast、边界模糊→询问用户）
- Agent 有 edit/bash 权限（因为 Fast 的核心价值是"直接解决"），依赖模板指令约束行为边界

**理由**：如果通过 deny edit/bash 来约束，Fast Agent 将丧失"直接修改代码→验证"的核心能力，失去存在价值。模板层约束是目前 OpenCode Agent 框架下最可行的软约束方式。

## 后果

### 正面影响

1. **架构一致性好**：Fast Agent 与 pipeline Agent 共享相同的三层结构（.hbs→.md→注册），SDDU 整体架构模型统一，不引入特殊 case
2. **关注点分离**：协调器只做路由和关口检查，Fast Agent 只做任务解决，各自模板独立、可独立审查和调优
3. **扩展性**：未来增加其他非管道 Agent（如 @sddu-research）时，遵循相同模式即可
4. **零代码依赖**：Fast 不 import StateMachine、不触及状态管理代码，纯模板级变更，部署风险极低
5. **阈值可调优**：复杂度阈值在模板中明确定义，后续根据实际使用反馈直接修改模板文本，无需改代码

### 需要关注

1. **模板质量依赖**：Fast Agent 的行为完全由 .hbs 模板中的自然语言指令控制，没有代码层 hard guardrail。模板编写质量和审查流程成为关键（对应 R-004 风险）
2. **LLM 判断不确定性**：复杂度阈值虽然给了可计数的规则（文件数≥5、跨模块≥2），但最终判定仍依赖 LLM 的语义理解，边界 case 可能存在误判
3. **协调器误路由**：协调器侧的粗粒度预筛选（关键词匹配）可能误将复杂任务调度到 Fast，虽然保守策略降低了此风险但无法完全消除
4. **双入口认知成本**：用户需要理解 @sddu 和 @sddu-fast 的定位差异（通过 welcome 消息、help 列表、README 缓解）

### 可逆性

高。本决策的产物均为模板文件和注册配置，不涉及数据结构变更或 API 兼容性承诺。如需调整：

- **调整阈值**：直接修改 .hbs 模板中的阈值文本
- **下线 Fast**：从注册列表中移除 sddu-fast 条目
- **切换到方案 B/C**：成本仅限于删除/重建模板和配置

### 后续

- `@sddu-tasks` 阶段将本 ADR 的决策分解为具体实施任务
- `@sddu-build` 阶段按任务清单逐个实现模板、注册、配置变更
- `@sddu-review` 阶段审查 .hbs 模板质量（含任务边界定义清晰度）
- `@sddu-validate` 阶段执行 Fast Agent 行为验证（含 EC-001~EC-009 边界场景）

## 修订记录

| 版本 | 变更说明 | 日期 | 修订人 |
|------|---------|------|--------|
| v1.0 | 初始创建 — 基于 plan.md §3/§4 方案对比和推荐决策 | 2026-07-11 | SDDU Plan Agent |
