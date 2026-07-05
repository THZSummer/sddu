# Directory: 工作流引擎/

## 目录简介
SDDU 工作流引擎是框架的核心调度系统，驱动规范驱动的 AI 辅助开发全流程。通过 Phase（8 阶段）+ Status（5 流转状态）双字段状态机保障各阶段单向流动，杜绝阶段跳过或回退。含 Mermaid 序列图、状态图、流程图等多类可视化内容。

## 目录结构
```
工作流引擎/
├── TREE.md                  # 本文件 - 目录导航
├── docs-overview.md         # 工作流引擎全景 — 7 阶段详情 + Mermaid 序列图 + 状态图
├── 工作流引擎-flow.md        # 流程规范 — 7 阶段主流程 + 状态转移矩阵 + 一致性检测 + 依赖检查流程图
└── source.md                # 数据源清单 — 4 个聚合 Feature 及辅助数据源
```

## 文件说明
| 文件 | 说明 | 类型 |
|------|------|------|
| docs-overview.md | 工作流引擎全景 — 7 阶段（Discovery→Validate）逐阶段详解（含 Mermaid 序列图）、Phase+Status 双字段模型、一致性检测器、子 Feature 并行支持（组内并行/组间串行/状态聚合）、组成 Feature 及技术要点 | 全景文档 |
| 工作流引擎-flow.md | 7 阶段管道流程规范 — 主流程 Mermaid 图、Phase 转移矩阵（合法/非法转移）、Status 转移规则、双字段一致性矩阵、session.idle 事件驱动自动更新、依赖检查解析流程图、5 类错误码 | 流程规范 |
| source.md | 数据源清单 — 4 个核心 Feature（discovery/multi-module/state-optimization/status-enhancement）的源文件路径、关键贡献及辅助数据源（全局 state.json、ADR、TREE.md） | 溯源清单 |

## 上级目录
- [返回上级](../TREE.md)
- [返回首页](../../TREE.md)
