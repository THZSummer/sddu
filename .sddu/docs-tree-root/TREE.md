# Directory: .sddu/docs-tree-root/

## 目录简介
SDDU 项目全景产物目录 — 聚合 `specs-tree-root/` 下各 Feature 的过程产物，生成面向人类阅读的框架全景文档。覆盖 Agent 体系、工作流引擎、插件工程架构、模板体系、项目结构管理五大领域，含 Mermaid 序列图/状态图/流程图等可视化内容及跨域数据流说明。

## 目录结构
```
docs-tree-root/
├── TREE.md              # 本文件 - 目录导航
├── docs-overview.md     # SDDU 项目全景 — 系统全貌入口（含 Mermaid 工作流序列图 + 跨域数据流图）
├── Agent体系/           # 15+ AI Agent 的分类、架构与核心设计原则（含组件关系图）
├── 工作流引擎/          # 7 阶段管道流程 + Phase/Status 双字段状态机（含序列图 + 状态图）
├── 插件工程架构/        # 三层分层设计、工程架构与 6 项 ADR（含架构图 + 构建流程图）
├── 模板体系/            # 35+ Handlebars 模板标准化基础设施（含模板架构图 + 加载优先级流程）
└── 项目结构管理/        # specs-tree-root 树形目录结构与分布式状态管理（含结构图）
```

## 文件说明
| 文件 | 说明 | 类型 |
|------|------|------|
| docs-overview.md | SDDU 系统全貌 — 7 阶段流水线 Mermaid 序列图 + 15+ Agent 矩阵 + 五大功能域跨域数据流图 + 安装指南 + 版本路线图 + Feature 索引 + 技术栈 | 全景入口 |

## 子目录
| 目录 | 说明 |
|------|------|
| Agent体系/ | AI Agent 分类（主流程 7 阶段 × 2 命名 + 智能入口 + 3 辅助）、6 项 ADR 索引、版本演进、内部组件关系图 |
| 工作流引擎/ | 核心调度系统：7 阶段管道流程 Mermaid 序列图/状态图、Phase+Status 双字段隔离模型、一致性检测器、子 Feature 并行执行规则 |
| 插件工程架构/ | 三层分层架构 Mermaid 图（核心业务层/平台适配层/共享层）、6 项架构 ADR、构建流程、测试组织 |
| 模板体系/ | 35+ Handlebars 模板（11 Agent 指令 + 20 输出文档 + 4 关系模板）、Mermaid 模板架构图、用户自定义覆盖优先加载、X1/X2 反泄漏规则 |
| 项目结构管理/ | 树形目录结构 Mermaid 图、Feature 父子模型、分布式 state.json（v1.0→v3.0 演进）、TreeScanner/ParentStateManager 递归扫描与状态聚合 |

## 上级目录
- [返回首页](../TREE.md)
