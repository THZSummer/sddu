# Directory: .sddu/specs-tree-root/specs-tree-agent-output-templating/

## 目录简介
Agent 输出模板化系统 (FR-TEMPLATE-001) — 基于 Handlebars 模板引擎，为 7 个主流程 Agent 实现标准化输出模板，含模板校验与版本管理。

## 目录结构
```
specs-tree-agent-output-templating/
├── TREE.md                          # 本文件 - 目录导航
├── discovery.md                     # 需求挖掘 (阶段 0)
├── spec.md                          # 需求规范 (阶段 1)
├── spec.json                        # 规范 JSON
├── plan.md                          # 技术计划 (阶段 2)
├── tasks.md                         # 任务分解 (阶段 3)
├── tasks.json                       # 任务 JSON
├── review.md                        # 代码审查 (阶段 5)
├── validation-report.md             # 验证报告 (阶段 6)
├── state.json                       # 状态文件
└── decisions/                       # 架构决策子目录
```

## 文件说明
| 文件 | 说明 | 状态 |
|------|------|------|
| discovery.md | 需求挖掘 — 模板化系统需求分析 | ✅ 存在 |
| spec.md | 需求规范 — 功能、性能、约束描述 | ✅ 存在 |
| plan.md | 技术计划 — 架构设计、Handlebars 方案 | ✅ 存在 |
| tasks.md | 任务分解 — 具体开发任务列表 | ✅ 存在 |
| review.md | 代码审查 — 质量审查报告 | ✅ 存在 |
| validation-report.md | 验证报告 — 功能验证结果 | ✅ 存在 |
| state.json | Feature 状态 — phase: validated, status: completed | ✅ 已完成 |

## Feature 状态
| 字段 | 值 |
|------|-----|
| Feature ID | FR-TEMPLATE-001 |
| Phase | validated (7/7) |
| Status | ✅ completed |
| Priority | P1 |
| 所属版本 | v2.5.0 |

## 子目录
| 目录 | 说明 |
|------|------|
| decisions/ | Agent 输出模板化相关架构决策 |

## 上级目录
- [返回上级](../TREE.md)
- [返回首页](../../../TREE.md)
