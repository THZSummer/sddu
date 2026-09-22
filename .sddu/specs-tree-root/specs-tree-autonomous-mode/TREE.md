# Directory: .sddu/specs-tree-root/specs-tree-autonomous-mode/

## 目录简介
本 Feature 源于对 Roadmap v19.0.0 中 FR-AUTONOMY-001 原提案的深度访谈修正。原提案描述的是「给所有 Agent ...

## 目录结构
```
specs-tree-autonomous-mode/
├── TREE.md          # 本文件 - 目录导航
├── ADR-018.md          # ADR-018: 子 Agent 提问拦截重定向实现路径（协议层拦截 + 插件内决策会话代答，方案 E）
├── ADR-019.md          # ADR-019: 启动/执行边界切分点与启动提问充分性保障
├── ADR-020.md          # ADR-020: 决策追溯（Q-007）纳入本期范围及原 Roadmap 提案处置
├── ADR-021.md          # ADR-021: plugin.ts 职责拆分与决策代理层模块化
├── build.md          # 构建报告：specs-tree-autonomous-mode
├── discovery.md          # 问题挖掘报告：自主模式（sddu-auto 自动调度）
├── evaluation-report.md          # 评价报告：FR-AUTONOMY-001「自主模式 sddu-auto」真实用户体验复盘
├── plan.md          # 技术计划：自主模式（sddu-auto 自动调度）
├── research-agent-reply.md          # 调研报告：opencode「真正意义上的 agent 代答」机制
├── review.md          # 审查报告：specs-tree-autonomous-mode
├── review-report.md          # 审查报告：specs-tree-autonomous-mode
├── spec.md          # Feature Specification：自主模式（sddu-auto 自动调度）
├── spike-decision-proxy.md          # Spike 报告：决策代理层最小可行性验证（静态调研版）
├── spike-decision-session.md          # TASK-008 spike 报告：方案 E 前置契约验证（session.create/prompt + 决策会话权限 + SDK 依赖）
├── state.json          # 状态文件 (✅ 已完成)
├── tasks.json          # 任务清单 (机器可读)
├── tasks.md          # 任务分解：自主模式（sddu-auto 自动调度）
├── validate.md          # 验证策略：specs-tree-autonomous-mode
├── validate-report.md          # 验证报告：specs-tree-autonomous-mode
├── verify-decision-proxy.md          # FR-006 decision-proxy 代答闭环运行实证报告
└── verify-prompt-interrupt.md          # FR-AUTONOMY-001 关键技术假设验证：prompt_async 能否打断阻塞中的 turn
```

## 文件说明
| 文件 | 说明 | 状态 |
|------|------|------|
| ADR-018.md | ADR-018: 子 Agent 提问拦截重定向实现路径（协议层拦截 + 插件内决策会话代答，方案 E） — 本 Feature 的核心硬约束（用户已确认）：**子 Agent 零改动**（NG-001/FR-005），即在完全不修改 7 个子 Agent（dis... | ✅ 存在 |
| ADR-019.md | ADR-019: 启动/执行边界切分点与启动提问充分性保障 — spec 的两个开放问题在此一并解决： | ✅ 存在 |
| ADR-020.md | ADR-020: 决策追溯（Q-007）纳入本期范围及原 Roadmap 提案处置 — spec 的两个开放问题在此一并解决： | ✅ 存在 |
| ADR-021.md | ADR-021: plugin.ts 职责拆分与决策代理层模块化 — `src/adapters/opencode/plugin.ts`（537 行）作为插件唯一入口，混杂了 4 类职责： | ✅ 存在 |
| build.md | 构建报告：specs-tree-autonomous-mode — 构建报告：specs-tree-autonomous-mode | ✅ 存在 |
| discovery.md | 问题挖掘报告：自主模式（sddu-auto 自动调度） — Roadmap v19.0.0 中 FR-AUTONOMY-001 原提案描述的是「给所有 Agent 加决策边界 + 分级自主级别 L0/L1/L2 +... | ✅ 存在 |
| evaluation-report.md | 评价报告：FR-AUTONOMY-001「自主模式 sddu-auto」真实用户体验复盘 — .sddu/specs-tree-root/ | ✅ 存在 |
| plan.md | 技术计划：自主模式（sddu-auto 自动调度） — 本 Feature 的边界已被 spec 严格锁定为「新增 `sddu-auto` 代理决策层」，**不改造既有 7 个子 Agent 的执行流程**（N... | ✅ 存在 |
| research-agent-reply.md | 调研报告：opencode「真正意义上的 agent 代答」机制 — // 服务端插件 host（opencode serve 内）： | ✅ 存在 |
| review.md | 审查报告：specs-tree-autonomous-mode — 1. **代码质量** — 可读性、职责单一性、错误处理、编码规范 | ✅ 存在 |
| review-report.md | 审查报告：specs-tree-autonomous-mode — 「调度者不实施」的**核心目标已达成**——`edit/bash/webfetch: deny` 从权限层面物理禁止 sddu-auto 亲自改代码、执行... | ✅ 存在 |
| spec.md | Feature Specification：自主模式（sddu-auto 自动调度） — 本 Feature 源于对 Roadmap v19.0.0 中 FR-AUTONOMY-001 原提案的深度访谈修正。原提案描述的是「给所有 Agent ... | ✅ 存在 |
| spike-decision-proxy.md | Spike 报告：决策代理层最小可行性验证（静态调研版） — `/home/usb/wks/sddu/node_modules/@opencode-ai/plugin/dist/index.d.ts`（1.16.2）： | ✅ 存在 |
| spike-decision-session.md | TASK-008 spike 报告：方案 E 前置契约验证（session.create/prompt + 决策会话权限 + SDK 依赖） — SessionCreateData = { body?: { parentID?: string; title?: string }; query?: {... | ✅ 存在 |
| state.json | 状态文件 | ✅ 已完成 |
| tasks.json | 任务清单（机器可读） | ✅ 存在 |
| tasks.md | 任务分解：自主模式（sddu-auto 自动调度） — Wave 1 ─── (无依赖，全部并行) | ✅ 存在 |
| validate.md | 验证策略：specs-tree-autonomous-mode — 验证策略：specs-tree-autonomous-mode | ✅ 存在 |
| validate-report.md | 验证报告：specs-tree-autonomous-mode — R1 复审唯一 P1 阻塞问题（flaky 单测）已修复根因：`matchOption` 仅对多字符标签做关键词匹配，单字符标签直接回退首个选项，杜绝 p... | ✅ 存在 |
| verify-decision-proxy.md | FR-006 decision-proxy 代答闭环运行实证报告 — 子会话真实调用 question 工具后，runtime 发出 `question.asked` 事件（SSE 事件流可见），decision-proxy... | ✅ 存在 |
| verify-prompt-interrupt.md | FR-AUTONOMY-001 关键技术假设验证：prompt_async 能否打断阻塞中的 turn — C.post("promptAsync", Dn.promptAsync, { | ✅ 存在 |

## Feature 状态
| 字段 | 值 |
|------|-----|
| Feature ID | FR-AUTONOMY-001 |
| Phase | 验证完成 (7/7) |
| Status | ✅ 已完成 |

## 上级目录
- [返回上级](../TREE.md)
- [返回首页](../../TREE.md)
