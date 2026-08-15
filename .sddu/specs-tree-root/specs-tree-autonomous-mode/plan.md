# 技术计划：自主模式（sddu-auto 自动调度）

> **文档定位**: SDDU 技术方案 — 记录架构设计、方案对比和 ADR，作为 tasks 阶段的输入
> **前置依赖**: spec.md（需求规范）
> **创建人**: SDDU Plan Agent
> **创建时间**: 2026-08-15
> **版本**: v3.2
> **更新人**: SDDU Plan Agent
> **更新时间**: 2026-08-15
> **更新说明**: 第5章补充 e2e 验证入口 — 启用现有 --auto 标志，AUTO_MODE=true 时 e2e 测试入口切换为 @sddu-auto

## 1. 前置检查
> 启动技术规划前必须验证的前置条件

| 检查项 | 状态 |
|--------|:--:|
| spec.md 存在 | ✅ |
| 外部 API 文档缓存 | ✅（本 Feature 为 SDDU 框架内部能力，无外部服务依赖） |
| 前置依赖已满足 | ✅ |

> 说明：spec 依赖 `FR-TPL-001`（模板体系）、`FR-AGENT-SCOPE-001`（Agent 职责边界），均为框架既有能力，无待缓存的外部 API。

## 2. 架构分析
> 分析现有架构影响和需要的新组件

### 2.1 现有架构影响

本 Feature 的边界已被 spec 严格锁定为「新增 `sddu-auto` 代理决策层」，**不改造既有 7 个子 Agent 的执行流程**（NG-001），**不改变 `sddu` 与 `sddu-fast` 的现有行为**（NG-004）。按 README §173 工程约束，本 Feature 的实现目标只限设计态源码（`src/`、`scripts/`），影响集中在「新增调度 Agent 定义」「平台适配器新增决策代理层」「Agent 注册模板」三处：

| 现有组件 | 影响程度 | 说明 |
|---------|:--:|------|
| 7 个子 Agent（discovery/spec/plan/tasks/build/review/validate） | 无 | 执行流程零改动，其 prompt 文件与提问行为保持不变 |
| `sddu`（coordinator） | 无 | 路由协议、状态仪表盘、标记命令均不动；sddu-auto 作为独立入口由用户直接 `@sddu-auto` 调用 |
| `sddu-fast`（快速模式） | 无 | 行为不变 |
| 状态机（`machine.ts` / `schema-v3.0.0.ts`） | 无 | sddu-auto 复用既有 `sddu_update_state` 工具推进 phase，不新增 phase/status 值 |
| 平台适配器（`src/adapters/opencode/plugin.ts`） | 中 | 新增「决策代理层」：订阅 `question.asked` 事件 + 识别 sddu-auto 子会话提问 + 调用 Question.reply 代答（方案 D 核心） |
| Agent 注册模板（`src/adapters/opencode/templates/opencode.json.hbs`） | 低 | 在 `agent` 块注册 `sddu-auto`（设计态模板，经构建生成运行时配置） |

### 2.2 需要的新组件

| 组件 | 类型 | 职责 |
|------|------|------|
| `sddu-auto` | 独立调度 Agent（新增，第三调度入口） | 启动阶段结构化提问采集诉求 → 执行阶段全自主调度 7 个子 Agent → 沉淀全套产物 |
| 决策代理层（Question 拦截代答） | 独立模块 `decision-proxy.ts`（见 ADR-018/ADR-021） | 订阅 `question.asked` 事件，识别 sddu-auto 调度的子会话提问，用 LLM 自主决策后调用 `reply(requestID, answers)` 代答，确保子 Agent 提问确定性到达 sddu-auto 而非用户 |
| 决策追溯记录 | 轻量产物（可选，见 ADR-020） | 记录 sddu-auto 代答的关键决策点 + 依据，供用户事后回溯 |

### 2.3 数据流变更

```
【普通 sddu 流程】
用户 ──提问──> 子 Agent（每阶段）──答复──> 用户

【sddu-auto 自主流程】
                    ┌───────────── 启动阶段（唯一人机交互点）─────────────┐
用户 ──诉求──> sddu-auto ──结构化追问──> 用户 ──补全──> sddu-auto
                    └────────────────────────────────────────────────┘
                               ↓ 固化「自主执行上下文」
                    ┌───────────── 执行阶段（全自主，绝不问人）─────────────┐
sddu-auto ──task(注入诉求上下文)──> 子Agent(discovery→…→validate)
    ↑                                   │ 子 Agent 调用 question 工具
    │                                   ↓
    │                     question.asked 事件（sessionID + requestID）
    │                                   ↓
    │              决策代理层订阅 → LLM 自主决策 → reply(requestID, answers)
    │                                   ↓
    └────────── 子 Agent 拿到答案继续 / 产物返回 ←────────┘
                    └────────────────────────────────────────────────┘
                               ↓
                    全套产物（discovery.md ~ validate.md）
```

关键数据流变更：子 Agent 的「提问」不再流向用户，而是在 question 工具的**协议层**被决策代理层拦截并代答——子 Agent 的 question 工具必然拿到 sddu-auto 决策的答案后继续执行。**提问的「接收方」由用户确定性变为 sddu-auto**（对应 FR-006）。

### 2.4 依赖关系图

```
sddu-auto（新增，第三调度入口）
  ├── 依赖 7 个子 Agent（经 task 工具调度，零改动）
  ├── 依赖 sddu_update_state 工具（推进 phase，复用）
  ├── 依赖 sddu-tree Skill（完成后更新目录导航，复用）
  └── 无外部服务依赖

与既有入口并列（互不依赖）：
  sddu（普通调度）│ sddu-fast（快速调度）│ sddu-auto（自动调度）★新增
```

### 2.5 架构结论（是否拆分）

spec §9 已判定本 Feature 边界清晰、功能内聚，**无需拆分**。plan 阶段复核：核心交付物只有「一个新调度 Agent 的行为定义」，无可独立交付的子模块。维持单 Feature 模式。

---

## 3. 方案对比
> 针对核心难点 #3「子 Agent 提问拦截重定向」的可行实现路径

核心约束回顾：在「子 Agent 零改动」（NG-001/FR-005）前提下，让子 Agent 在执行阶段的提问**确定性**到达 sddu-auto 而非用户（FR-006），且**可靠性必须 100% 保证**。

**平台机制调研结论**（opencode 1.18.18 官方文档 + 源码反编译）：opencode 的 question 工具是「事件驱动 + 异步等待 + 可代答」协议——子 Agent 调用 question 工具时，发布 `question.asked` 事件（携带 `sessionID` + `requestID` + questions），并阻塞等待；任何能订阅该事件并调用 `reply(requestID, answers)` 的组件都能「拦截并代答」，子 Agent 的 question 工具必然拿到代答答案后继续执行。这是「代理决策」的确定性基础。

| 维度 | 方案 A：上下文指令注入 | 方案 C：双会话代理（resume） | 方案 D：Question 协议层拦截 + 代答 |
|------|:--|:--|:--|
| 描述 | 调度前在 task 的 prompt 参数注入「自主执行契约」，劝子 Agent 别问、拿不准硬决策。从源头「预防」提问。 | 为每个子 Agent 开辟独立子会话，提问经 task 返回通道回传，sddu-auto 决策后用 task_id resume 续接。 | 子 Agent 照常提问；sddu-auto 的「决策代理层」订阅 `question.asked` 事件，识别自己调度的子会话提问，用 LLM 决策答案后调用 `reply(requestID, answers)` 代答。 |
| 可靠性 | ❌ 依赖 LLM 对注入指令的遵从度（非确定性） | ⚠️ 依赖平台 subagent resume 行为，需实测 | ✅ 拦截发生在 question 工具协议层，子 Agent 无论怎么问都被确定性拦截 |
| 子 Agent 改动 | 零改动 | 零改动 | 零改动（保留其「提问」自然行为） |
| 平台改动 | 零（纯 prompt 编排） | 可能触及平台级改动 | 新增「决策代理层」组件（插件 hook 或自定义工具），不改既有组件 |
| 实现复杂度 | 低 | 高 | 中 |
| 结论 | ❌ 已否决（可靠性不达标） | ⏸️ 备选 | ⭐ 推荐 |

> 原方案 B（调度层后置拦截：识别子 Agent 输出中的「提问」文本再代答）与方案 A 同属「软拦截」，依赖「提问语义识别」精度、且无法覆盖「子 Agent 提问后阻塞等待」的情形，可靠性同样不达标，一并否决；其「兜底代答」思想由方案 D 在协议层更彻底地实现。

---

## 4. 推荐方案
> 推荐方案及选择理由

**推荐**: 方案 D —— Question 协议层拦截 + 代答。

**理由**:
1. **可靠性 100%（唯一满足）**：拦截点位于 question 工具的协议层（`question.asked` 事件 + `reply` 代答），子 Agent 的任何提问都会被「确定性」路由到 sddu-auto 的决策代理层——代理层不给答案，子 Agent 的 question 工具就无法继续。完全不依赖「子 Agent 听不听话」，这是方案 A/B「软约束」所不具备的。
2. **严格符合原始诉求**：用户明确「后面的 agent 的问题都由 auto agent 去决策」。方案 D 保留子 Agent 的提问行为（它本来就需要在决策点发问），仅把「回答者」从用户换成 sddu-auto，语义精确对应。
3. **子 Agent 零改动**：7 个子 Agent 的 prompt 文件一个字符不改，其提问行为照常发生（FR-005）。
4. **有源码依据**：`question.asked` 事件订阅、`reply(requestID, answers)` 代答通道、`session.question.reply` API 均在 opencode 1.18.18 源码中确认存在（`@opencode/Question` service 导出 `ask/reply/reject/list`）。
5. **落地路径清晰**：决策代理层作为 sddu-auto 的配套组件，优先走插件 hook（进程内订阅 `question.asked` + 调 `@opencode/Question.reply`），备选走 HTTP API（`session.question.reply`）；具体签名在 build 阶段用最小样本实测后固定。

**待 build 阶段实测确认的点**（已记录入 ADR-018 后果章节）：
1. 决策代理层落地位置：插件 hook（进程内）vs HTTP API（server 模式），以实测确定。
2. sddu-auto 通过 task 工具拿到子会话 sessionID，与 `question.asked` 事件 sessionID 的关联方式，需实测固定。
3. 若实测发现 opencode 当前版本插件 API 未暴露 question 代答能力，则降级评估方案 C（双会话代理 resume），届时 ADR-018 状态更新为 SUPERSEDED。

---

## 5. 文件影响分析
> 所有需要创建/修改/删除的文件（实现目标仅限设计态源码，遵循 README §173 工程约束）

| 操作 | 文件路径 | 说明 |
|:--:|------|------|
| NEW | `src/templates/agents/sddu-auto.md.hbs` | sddu-auto Agent 模板源码（第 1 层 source-of-truth，唯一可手动修改的 Agent 定义）：启动结构化提问 + 全自主调度编排 + 决策追溯。核心交付物 |
| MODIFY | `src/adapters/opencode/plugin.ts` | 瘦身为「初始化 + 组装」入口（拆分见 ADR-021）：实例化组件 + 组装 tools / hooks / decision-proxy |
| NEW | `src/adapters/opencode/tools.ts` | 从 plugin.ts 拆出 3 个状态工具 + 辅助函数（行为零变化，见 ADR-021） |
| NEW | `src/adapters/opencode/hooks.ts` | 从 plugin.ts 拆出 4 个生命周期 hook（行为零变化，见 ADR-021） |
| NEW | `src/adapters/opencode/decision-proxy.ts` | **决策代理层**（本 Feature 核心）：订阅 `question.asked` + 识别 sddu-auto 子会话提问 + 调用 Question.reply 代答（方案 D，见 ADR-018） |
| MODIFY | `src/adapters/opencode/templates/opencode.json.hbs` | 在 `agent` 块注册 `sddu-auto`（description/model/prompt 指向 `{file:agents/sddu-auto.md}`） |
| MODIFY | `scripts/build-agents.cjs` | `specialAgents` 列表加入 `sddu-auto`，使 `npm run build` 生成其构建产物（第 2 层） |
| MODIFY | `e2e/scripts/basic/sddu-e2e.sh`、`e2e/scripts/fullstack/sddu-e2e-fullstack.sh` | 启用现有 `--auto` 标志（脚本已有 `AUTO_MODE` 变量）：`AUTO_MODE=true` 时测试提示词入口从 `@sddu` 切换为 `@sddu-auto`，作为本 Feature 的 e2e 验证入口 |

**构建/安装链路（自动生成，不列为手动实现目标）**：
```
src/templates/agents/sddu-auto.md.hbs          ← 第 1 层（source-of-truth，唯一手动改）
        ↓ npm run build（build-agents.cjs）
dist/templates/agents/sddu-auto.md             ← 第 2 层（自动生成，禁止手动编辑）
        ↓ 插件安装/更新
.opencode/agents/sddu-auto.md                  ← 第 3 层（运行时副本，禁止手动编辑）
.opencode/plugins/sddu/agents/sddu-auto.md
```

> ⚠️ **安装边界（重要）**：第 3 层（`install.sh` 安装到 `.opencode/`）**不在当前项目执行**。当前项目是 SDDU 插件自身的开发仓库（dogfooding），不得用最新代码覆盖其 `.opencode/` 运行时副本。安装/运行验证依赖 e2e 脚本——`e2e/scripts/basic/sddu-e2e.sh` / `e2e/scripts/fullstack/sddu-e2e-fullstack.sh` 在 `$HOME/sddu-test-projects/` 下创建临时测试项目时，其 `[2/3]` 步骤已内置 `install.sh` 安装（**创建即自动安装，无需主动调用 install.sh**），sddu-auto 的运行验证在测试项目内完成。

> **明确不改**：
> - 7 个子 Agent 模板源码 `src/templates/agents/sddu-{discovery,spec,plan,tasks,build,review,validate}.md.hbs`（零改动硬约束 NG-001）
> - `src/state/`（复用既有 phase 模型，不新增 phase/status）
> - `.opencode/` 与 `.sddu/`（安装产物/流程产物，README §173 明确不得列为实现目标）
> - `.opencode/agents/sddu.md`（coordinator 路由不变）

> **注**：ADR-018/019/020 是 plan 阶段自身产出（已写入 `.sddu/specs-tree-root/specs-tree-autonomous-mode/`），属流程产物，不列为 build 阶段实现目标。

---

## 6. 风险评估
> 识别技术、依赖和时间风险及缓解措施

| 风险 | 概率 | 影响 | 缓解措施 |
|------|:--:|:--:|----------|
| **技术风险**：opencode 插件 API 未暴露「订阅 question.asked + 调 Question.reply」的完整能力，或行为与源码推断不符 | 低 | 高 | build 阶段前置实测：以最小 Feature 验证「子 Agent 提问能否被代理层拦截并代答」；若插件通道不可用，走 HTTP API（session.question.reply）备选；若均不可行，降级评估方案 C，届时 ADR-018 更新为 SUPERSEDED |
| **技术风险**：sddu-auto 与子 Agent 子会话的 sessionID 关联未打通，无法精确识别「该代答哪个提问」 | 中 | 高 | build 阶段实测 task 工具返回的 task_id 与 question 事件 sessionID 的关联方式；必要时在决策代理层维护「调度 sessionID → 子会话 sessionID」映射表 |
| **依赖风险**：决策质量高度依赖启动提问的充分性（Q-004/A-001） | 高 | 高 | ADR-019 定义结构化启动问卷（背景/目标/范围/验收期望/技术偏好/约束六维）+ 最小充分信息集 + 启动阶段内多轮追问（EC-001） |
| **时间风险**：全自主硬决策连锁跑偏，7 流程产物质量下降甚至作废（R-001/Q-006） | 中 | 高 | 属 spec 明确 Non-Goal（NG-003），本模式不负责修正回退；通过 ADR-020 的轻量决策追溯（auto-decisions.md）降低用户事后纠偏成本；用户不满意自行改走 fast/普通 sddu |
| **依赖风险**：原 Roadmap 提案 FR-AUTONOMY-001（分级自主 L0/L1/L2）未正式处置，语义残留 | 低 | 低 | 建议由 roadmap 阶段将原提案标记废弃、由本 Feature 替换（见 ADR-020 后果章节）；plan 阶段给出建议并记录，实际 ROADMAP.md 修改归 roadmap 阶段 |

---

## 7. 生成的 ADR
> 本次规划产出的架构决策记录

| ADR | 标题 | 状态 |
|-----|------|:--:|
| ADR-018 | 子 Agent 提问拦截重定向实现路径（Question 协议层拦截 + 代答） | PROPOSED |
| ADR-019 | 启动/执行边界切分点与启动提问充分性保障 | PROPOSED |
| ADR-020 | 决策追溯（Q-007）纳入本期范围及原 Roadmap 提案处置 | PROPOSED |
| ADR-021 | plugin.ts 职责拆分与决策代理层模块化 | PROPOSED |

---

## 8. 修订记录
> 记录本文档的版本变更历史

| 版本 | 变更说明 | 日期 | 修订人 |
|------|---------|------|--------|
| v1.0 | 初始创建 — 基于 spec.md v1.0，明确「新增 sddu-auto 代理决策层」技术路径，解决 5 个开放问题，产出 3 个 ADR（018~020） | 2026-08-15 | SDDU Plan Agent |
| v2.0 | 方案对比重写 — 经 opencode 源码调研，否决方案 A/B（软约束不可靠），改推方案 D（Question 协议层拦截 + 代答），更新文件影响与风险评估 | 2026-08-15 | SDDU Plan Agent |
| v3.0 | 第5章按 README §173 工程约束重写（实现目标限设计态源码）+ plugin.ts 职责拆分（新增 ADR-021：tools/hooks/decision-proxy 模块化） | 2026-08-15 | SDDU Plan Agent |
| v3.1 | 第5章补充「安装边界」约束：当前项目不执行 install.sh，安装/运行验证一律在 e2e 生成的测试项目中完成 | 2026-08-15 | SDDU Plan Agent |
| v3.2 | 第5章补充 e2e 验证入口：启用现有 --auto 标志，AUTO_MODE=true 时 e2e 测试入口切换为 @sddu-auto | 2026-08-15 | SDDU Plan Agent |
