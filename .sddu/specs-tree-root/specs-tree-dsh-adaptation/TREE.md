# Directory: .sddu/specs-tree-root/specs-tree-dsh-adaptation/

## 目录简介
Feature Specification：DSH 适配

## 目录结构
```
specs-tree-dsh-adaptation/
├── TREE.md          # 本文件 - 目录导航
├── ADR-001-dsh-skill-package-placement.md          # ADR-001：dsh Skill 包的落位与装配
├── ADR-002-command-entry-as-router-skill.md          # ADR-002：命令入口以「路由 Skill + 文本前缀识别」承载
├── ADR-003-gate-soft-guidance-observable.md          # ADR-003：阶段门禁采用显式可观测软引导，硬 guard 通道记为演进点
├── ADR-004-state-authority-and-reconciliation.md          # ADR-004：state.json 为唯一权威，dsh 会话事件日志为观测与对账源
├── ADR-005-adapter-isolation-single-source.md          # ADR-005：适配层隔离边界与指令文本单一来源
├── ADR-006-upgrade-following-mechanism.md          # ADR-006：升级跟随机制 = 契约清单 + 版本锚定 + 人工回归清单
├── build.md          # 构建报告：specs-tree-dsh-adaptation
├── discovery.md          # 问题挖掘报告：DSH 适配
├── plan.md          # 技术计划：DSH 适配
├── review.md          # 审查报告：DSH 适配
├── review-report.md          # 审查报告：specs-tree-dsh-adaptation
├── spec.md          # Feature Specification：DSH 适配
├── state.json          # 状态文件 (✅ 已完成)
├── tasks.json          # 任务清单 (机器可读)
├── tasks.md          # 任务分解：DSH 适配
├── validate.md          # 验证策略：DSH 适配
└── validate-report.md          # 验证报告：specs-tree-dsh-adaptation
```

## 文件说明
| 文件 | 说明 | 状态 |
|------|------|------|
| ADR-001-dsh-skill-package-placement.md | ADR-001：dsh Skill 包的落位与装配 — 用户已拍板 SDDU 在 dsh 上的交付形态为「**dsh Skill 包**」（spec §1 元数据「交付形态（既定约束）」），并要求复用 dsh ... | ✅ 存在 |
| ADR-002-command-entry-as-router-skill.md | ADR-002：命令入口以「路由 Skill + 文本前缀识别」承载 — 用户的唯一对齐面（既定约束）是「**命令入口：`/sddu` 路由与阶段命令**」（spec §1 / Q-003），而 dsh 侧只有 Web UI、无... | ✅ 存在 |
| ADR-003-gate-soft-guidance-observable.md | ADR-003：阶段门禁采用显式可观测软引导，硬 guard 通道记为演进点 — SDDU 的核心竞争力是「不跳步」的**硬强制**门禁：`src/state/machine.ts` 在 `updateState()` 中抛出 `Pha... | ✅ 存在 |
| ADR-004-state-authority-and-reconciliation.md | ADR-004：state.json 为唯一权威，dsh 会话事件日志为观测与对账源 — SDDU 以 `state.json`（可变状态机：`phase` + `status` + `phaseHistory`）为事实源；dsh 以 **ap... | ✅ 存在 |
| ADR-005-adapter-isolation-single-source.md | ADR-005：适配层隔离边界与指令文本单一来源 — `FR-FRAMEWORK-ARCH-001`（v4.0.0）已建立三域分层与 `src/adapters/` 平台适配器容器：核心域（`state` /... | ✅ 存在 |
| ADR-006-upgrade-following-mechanism.md | ADR-006：升级跟随机制 = 契约清单 + 版本锚定 + 人工回归清单 — dsh 处于 **Developer preview**，带兼容性破坏警告、快速迭代（快照 §1）。用户的风险姿态是「**适配层隔离，允许跟随升级**」（... | ✅ 存在 |
| build.md | 构建报告：specs-tree-dsh-adaptation — dsh 实机 **V1~V5**（装配可见 / 入口可用 / 单阶段走通 / 门禁行为 / 升级跟随）均**未观测**， | ✅ 存在 |
| discovery.md | 问题挖掘报告：DSH 适配 — 问题挖掘报告：DSH 适配 | ✅ 存在 |
| plan.md | 技术计划：DSH 适配 — 核心难点是 spec 开放问题 4 / Q-002「**形态承载缺口：Skill 包不携带执行能力**」——即「状态推进 + 阶段门禁」如何在 dsh 侧... | ✅ 存在 |
| review.md | 审查报告：DSH 适配 — 1. **代码质量** — 可读性、职责单一性、错误处理、编码规范（C1~C5） | ✅ 存在 |
| review-report.md | 审查报告：specs-tree-dsh-adaptation — 1. **0 阻塞项** —— 全部 20 项 🔴 级审查点通过：隔离边界零泄漏、分发布局隔离（`dist/sddu.zip` 零 `dsh/` 条目）... | ✅ 存在 |
| spec.md | Feature Specification：DSH 适配 — Feature Specification：DSH 适配 | ✅ 存在 |
| state.json | 状态文件 | ✅ 已完成 |
| tasks.json | 任务清单（机器可读） | ✅ 存在 |
| tasks.md | 任务分解：DSH 适配 — Wave 1 ─── (无依赖，全部并行：适配层资产与仓库侧脚本) | ✅ 存在 |
| validate.md | 验证策略：DSH 适配 — 本策略阶段**不推进 state.json 的 `phase`**（策略设计不属于主流水线推进），也不由 Agent 直接改写 `state.json`。 | ✅ 存在 |
| validate-report.md | 验证报告：specs-tree-dsh-adaptation — 1. **层 A 全绿** —— V6~V22 共 17 个本地自动化场景全部通过：构建/打包退出码 0；生成物幂等且恰 11 个；manifest 四项... | ✅ 存在 |

## Feature 状态
| 字段 | 值 |
|------|-----|
| Feature ID | FR-DSH-ADAPT-001 |
| Phase | 验证完成 (7/7) |
| Status | ✅ 已完成 |

## 上级目录
- [返回上级](../TREE.md)
- [返回首页](../../TREE.md)
