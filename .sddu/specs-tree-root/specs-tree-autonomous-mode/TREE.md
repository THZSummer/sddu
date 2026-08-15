# Directory: .sddu/specs-tree-root/specs-tree-autonomous-mode/

## 目录简介
本 Feature 源于对 Roadmap v19.0.0 中 FR-AUTONOMY-001 原提案的深度访谈修正。原提案描述的是「给所有 Agent ...

## 目录结构
```
specs-tree-autonomous-mode/
├── TREE.md          # 本文件 - 目录导航
├── ADR-018.md          # ADR-018: 子 Agent 提问拦截重定向实现路径（Question 协议层拦截 + 代答）
├── ADR-019.md          # ADR-019: 启动/执行边界切分点与启动提问充分性保障
├── ADR-020.md          # ADR-020: 决策追溯（Q-007）纳入本期范围及原 Roadmap 提案处置
├── ADR-021.md          # ADR-021: plugin.ts 职责拆分与决策代理层模块化
├── discovery.md          # 问题挖掘报告：自主模式（sddu-auto 自动调度）
├── plan.md          # 技术计划：自主模式（sddu-auto 自动调度）
├── spec.md          # Feature Specification：自主模式（sddu-auto 自动调度）
├── state.json          # 状态文件 (🟢 tracked [tasked])
├── tasks.json          # 任务清单 (机器可读)
└── tasks.md          # 任务分解：自主模式（sddu-auto 自动调度）
```

## 文件说明
| 文件 | 说明 | 状态 |
|------|------|------|
| ADR-018.md | ADR-018: 子 Agent 提问拦截重定向实现路径（Question 协议层拦截 + 代答） — 本 Feature 的核心硬约束（用户已确认）：**子 Agent 零改动**（NG-001/FR-005），即在完全不修改 7 个子 Agent（dis... | ✅ 存在 |
| ADR-019.md | ADR-019: 启动/执行边界切分点与启动提问充分性保障 — spec 的两个开放问题在此一并解决： | ✅ 存在 |
| ADR-020.md | ADR-020: 决策追溯（Q-007）纳入本期范围及原 Roadmap 提案处置 — spec 的两个开放问题在此一并解决： | ✅ 存在 |
| ADR-021.md | ADR-021: plugin.ts 职责拆分与决策代理层模块化 — `src/adapters/opencode/plugin.ts`（537 行）作为插件唯一入口，混杂了 4 类职责： | ✅ 存在 |
| discovery.md | 问题挖掘报告：自主模式（sddu-auto 自动调度） — Roadmap v19.0.0 中 FR-AUTONOMY-001 原提案描述的是「给所有 Agent 加决策边界 + 分级自主级别 L0/L1/L2 +... | ✅ 存在 |
| plan.md | 技术计划：自主模式（sddu-auto 自动调度） — 本 Feature 的边界已被 spec 严格锁定为「新增 `sddu-auto` 代理决策层」，**不改造既有 7 个子 Agent 的执行流程**（N... | ✅ 存在 |
| spec.md | Feature Specification：自主模式（sddu-auto 自动调度） — 本 Feature 源于对 Roadmap v19.0.0 中 FR-AUTONOMY-001 原提案的深度访谈修正。原提案描述的是「给所有 Agent ... | ✅ 存在 |
| state.json | 状态文件 | 🟢 tracked [tasked] |
| tasks.json | 任务清单（机器可读） | ✅ 存在 |
| tasks.md | 任务分解：自主模式（sddu-auto 自动调度） — Wave 1 ─── (无依赖，全部并行) | ✅ 存在 |

## Feature 状态
| 字段 | 值 |
|------|-----|
| Feature ID | FR-AUTONOMY-001 |
| Phase | 任务分解 (4/7) |
| Status | 🟢 tracked [tasked] |

## 上级目录
- [返回上级](../TREE.md)
- [返回首页](../../TREE.md)
