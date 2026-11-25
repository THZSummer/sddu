# 审查报告：specs-tree-autonomous-mode

> **文档定位**: SDDU 审查策略 — 指导 review Agent 执行自主审查的清单和方法；审查结果见 review-report.md
> **前置依赖**: spec.md（需求规范）、plan.md（技术方案）、build.md（构建产物）
> **创建人**: SDDU Review Agent
> **创建时间**: 2026-08-15
> **版本**: v1.0
> **更新人**: SDDU Review Agent
> **更新时间**: 2026-08-15
> **更新说明**: 初始创建 — 基于 spec.md v1.0（FR-001~010 / NFR-001~003 / EC-001~005）+ plan.md v3.2（方案 D）+ ADR-018~021 自主定义 C1~C21 审查清单

## 1. 审查概要
> 审查结果的量化总览（此表为策略定义时的预估基线，最终数值以 review-report.md 为准）

| 维度 | 数值 |
|------|:--:|
| 审查文件数 | 11 个（5 NEW + 4 MODIFY 源码 + 2 测试相关） |
| 通过项 | — |
| 改进建议 | — |
| 阻塞问题 | — |

## 2. 自主审查清单（C1~C21）
> 审查 Agent 根据 spec/plan/build 产物自主定义具体审查项。

**审查对象来源**：
- `spec.md`：FR-001~010 / NFR-001~003 / EC-001~005 → 逐项核验实现完整性和正确性
- `plan.md`：ADR-018~021 + 文件影响分析（§5）→ 架构遵循性检查
- `build.md`：文件变更清单 → 覆盖完整性检查
- `src/` + `tests/`：源码和测试文件 → 代码质量和测试质量检查
- README §175 工程约束 → 实现目标边界检查

**四维度指引**（审查清单必须覆盖这 4 个维度）：
1. **代码质量** — 可读性、职责单一性、错误处理、编码规范
2. **规范符合性** — 对照 spec.md 逐 FR/NFR/EC 核验
3. **架构一致性** — 对照 plan.md ADR 和文件影响分析
4. **测试质量** — 覆盖率、边界条件、错误场景、断言有效性

| # | 审查对象 | 审查基准 | 审查维度 | 审查方法 |
|---|---------|---------|---------|---------|
| C1 | decision-proxy.ts 本地最小类型声明（QuestionAskedProperties / OpenCodeEvent）与 SDK v2 事件形状对齐 | ADR-018 spike 结论 / v2 SDK types.gen.d.ts | 代码质量 | 代码走查 + 对照 `@opencode-ai/sdk` v2 类型定义逐字段核验 |
| C2 | decision-proxy.ts 三级代答兜底（v2.session.question.reply → client.question.reply → HTTP API） | ADR-018「reply 代答通道」 | 代码质量 | 代码走查 + 对照 v2 sdk.gen.d.ts 方法签名 |
| C3 | SessionRegistry / DecisionEngine / DecisionProxy 职责单一性 | ADR-021「决策代理层模块化」 | 代码质量 | 代码走查（类内聚性 / 依赖注入） |
| C4 | 硬编码值检查（contextFile 路径 / '.sddu/specs-tree-root' 字符串） | 编码规范 | 代码质量 | grep 硬编码字符串 |
| C5 | FR-001 第三调度入口 `sddu-auto` 注册（opencode.json.hbs + build-agents.cjs） | FR-001 / spec §2 三入口定位 | 规范符合性 | 对照 opencode.json.hbs agent 块 + build-agents.cjs specialAgents |
| C6 | FR-002 七阶段顺序调度编排（sddu-auto.md.hbs §5.2） | FR-002 | 规范符合性 | 模板走查（7 阶段表 + 严格串行规则） |
| C7 | FR-003 启动阶段为唯一人机交互点（双阶段模型 §3/§4） | FR-003 / ADR-019 边界切分 | 规范符合性 | 模板走查（切分点判据 + 六维问卷） |
| C8 | FR-004 执行阶段「绝不问人」硬约束（§5.1） | FR-004 | 规范符合性 | 模板走查（4 条硬约束） |
| C9 | FR-005 子 Agent 零改动（7 个模板源文件） | FR-005 / NG-001 | 规范符合性 | git diff 验证 7 个 sddu-{discovery..validate}.md.hbs 零改动 |
| C10 | FR-006 提问重定向代答（decision-proxy 四步链路） | FR-006 / ADR-018 方案 D | 规范符合性 | 代码走查（订阅→识别→决策→代答）+ 单测核对 |
| C11 | FR-007 全套产物沉淀（discovery.md~validate.md） | FR-007 / NFR-002 | 规范符合性 | 模板走查（§5.2 阶段产物表 + 完成汇报） |
| C12 | FR-008 进入即自主（无复杂度判定） | FR-008 | 规范符合性 | 模板走查（§1 核心特点 + §8 规则 1） |
| C13 | FR-009 / FR-010 边界不越界（不改造子 Agent / 不修正迭代） | FR-009 / FR-010 / NG-002 / NG-003 | 规范符合性 | 模板走查（§1 职责边界 + §8 规则 9 + §9 异常表） |
| C14 | NFR-001 六维启动问卷充分性（背景/目标/范围必采） | NFR-001 / ADR-019 | 规范符合性 | 模板走查（§4 六维表 + 最小充分信息集） |
| C15 | NFR-003 信息不足硬决策（DecisionEngine.customDecision） | NFR-003 / EC-002 | 规范符合性 | 代码走查（decide/customDecision 返回确定性答案）+ 单测 |
| C16 | ADR-018 方案 D 四步链路落地正确性（含 sessionID 关联） | ADR-018 / spike-decision-proxy.md | 架构一致性 | 代码走查（event hook 订阅 + SessionRegistry 映射 + reply 代答） |
| C17 | ADR-021 plugin.ts 拆分行为零变化（3 工具 + 4 hook） | ADR-021 / TASK-002 | 架构一致性 | git diff 对照 tools.ts/hooks.ts 与 HEAD plugin.ts 逐行核对 |
| C18 | ADR-019 启动/执行边界 + ADR-020 决策追溯（auto-decisions.md 不参与状态机校验） | ADR-019 / ADR-020 | 架构一致性 | 模板走查（§3 切分点 / §6 追溯产物 + 不校验声明） |
| C19 | README §175 工程约束（实现目标限设计态源码，.opencode/ 与 .sddu/ 排除） | README.md §175 | 架构一致性 | git status 核对变更文件归属 |
| C20 | 18 单测覆盖核心链路（SessionRegistry 匹配 / DecisionEngine 硬决策 / DecisionProxy 四步） | TASK-003 验收标准 | 测试质量 | 测试代码走查（断言有效性 + 覆盖路径） |
| C21 | 测试覆盖边界/错误场景（refreshLaunchIntent / httpReplyQuestion 分支） | 测试质量 | 测试质量 | 测试代码走查（识别未覆盖分支） |

> **质量门槛（数量基线法）**：10 个 FR（C5~C13 逐项覆盖）+ 3 个 NFR（C14/C15 + 隐含）+ 四维度各 ≥1 条（代码质量 C1~C4 / 规范 C5~C15 / 架构 C16~C19 / 测试 C20~C21），Cx 总数 21 条，满足门槛。

## 3. 审查详情
> 详细逐项审查结果见 `review-report.md`（按 ADR-004 产物拆分：策略与报告分离）

本策略文档仅定义审查清单（C1~C21）与审查方法，不承载逐项发现。逐项审查结果、维度汇总、阻塞问题与结论均在 `review-report.md` 中记录。

## 4. 改进建议
> 见 review-report.md §5

## 5. 阻塞问题
> 见 review-report.md §4

## 6. 结论
> 见 review-report.md §6

## 7. 修订记录
> 记录本文档的版本变更历史

| 版本 | 变更说明 | 日期 | 修订人 |
|------|---------|------|--------|
| v1.0 | 初始创建 — 基于 spec/plan/build 产物自主定义 C1~C21 审查清单，覆盖四维度 + 10 FR + 3 NFR | 2026-08-15 | SDDU Review Agent |
