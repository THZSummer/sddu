# Directory: 项目结构管理/

## 目录简介
SDDU 通过 specs-tree-root 树形目录结构管理所有 Feature 的完整生命周期产物。系统支持无限层嵌套的子 Feature 结构，实现"分而治之"的大型项目开发模式。含 Mermaid 结构图、分布式 state.json Schema 演进（v1.0→v3.0）及 TreeScanner 递归扫描机制。

## 目录结构
```
项目结构管理/
├── TREE.md                  # 本文件 - 目录导航
├── docs-overview.md         # 项目结构管理全景 — 核心结构 Mermaid 图 + Feature 目录规范 + 状态管理
├── 项目结构管理-data.md      # state.json Schema 演进 — v1.0 原始模型 → v3.0 双字段隔离
└── source.md                # Source Features — 3 个聚合 Feature 详情
```

## 文件说明
| 文件 | 说明 | 类型 |
|------|------|------|
| docs-overview.md | 项目结构管理系统 — .sddu/ 核心结构 Mermaid 层级图、Feature 目录规范（统一前缀/父级轻量化/叶子完整/嵌套深度/目录互斥）、分布式 state.json + 父子状态聚合（ParentStateManager→叶子→根节点传播路径）、TreeScanner 递归扫描→StateLoader 层级加载→TreeStateValidator 校验、3 个组成 Feature | 全景文档 |
| 项目结构管理-data.md | state.json Schema 演进历史 — v1.0（原始单 Feature 模型）、v2.0（分布式状态+childrens+depth）、v2.1（phaseHistory+dependencies 增强+TreeStateValidator）、v3.0（Phase+Status 双字段隔离+workflow 标识） | 数据模型 |
| source.md | Source Features — specs-tree-directory-optimization（统一前缀+清理遗留目录+55+处模板修改）、specs-tree-tree-structure-optimization（树形嵌套+分布式状态+TreeScanner/ParentStateManager/StateLoader/TreeStateValidator 四大模块）、specs-tree-tree-structure-optimization-v2（5 项 E2E 问题修复+字段强制校验+智能拆分建议） | 溯源清单 |

## 上级目录
- [返回上级](../TREE.md)
- [返回首页](../../TREE.md)
