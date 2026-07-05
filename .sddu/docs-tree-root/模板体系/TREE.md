# Directory: 模板体系/

## 目录简介
SDDU 的模板体系是所有 Agent 指令和输出文档的标准化基础设施。全系统包含 35+ 个 Handlebars (.hbs) 模板，含 Mermaid 模板架构图与加载优先级流程图。核心机制为用户自定义模板优先加载、内置模板兜底，Agent-Native 运行时解析。

## 目录结构
```
模板体系/
├── TREE.md              # 本文件 - 目录导航
├── docs-overview.md     # 模板体系全景 — 35+ 模板 + Mermaid 架构图 + 加载优先级流程
└── source.md            # 源 Feature 一览 — 2 个核心 Feature
```

## 文件说明
| 文件 | 说明 | 类型 |
|------|------|------|
| docs-overview.md | 模板体系全景 — Mermaid 模板架构图（用户自定义→优先加载→Agent Runtime；内置→兜底；EC-010 报错）、11 个 Agent 指令模板表（含 mode/temperature）、20 个输出文档模板（定位/关系/元数据三类）、模板加载优先级流程（FR-006a 四步链）、5 项核心设计原则（Agent-Native 解析/模板自声明文件名/反歧义命名/X1 禁止照搬/X2 禁止泄漏）、用户自定义指南、模板质量统一里程碑（17 模板 10 维度统一、11 Agent 职责边界标准化） | 全景文档 |
| source.md | 源 Feature 一览 — specs-tree-agent-output-templating（11 指令模板+20 输出模板+加载优先级+反歧义命名）、specs-tree-template-quality-unification（17 模板格式统一+11 Agent 边界标准化+消除 7 处冲突） | 溯源清单 |

## 上级目录
- [返回上级](../TREE.md)
- [返回首页](../../TREE.md)
