# Directory: 插件工程架构/

## 目录简介
SDDU 插件的工程架构全景文档。采用三层分层设计（核心业务层 / 平台适配层 / 共享层），将 SDDU 方法论核心与 OpenCode 平台适配层清晰分离。含 Mermaid 架构图、构建流程图及 6 项架构决策记录。

## 目录结构
```
插件工程架构/
├── TREE.md              # 本文件 - 目录导航
├── docs-overview.md     # 插件工程架构全景 — 三层架构 Mermaid 图 + 构建流程 + 测试组织
├── adr-index.md         # 6 项架构决策记录 — ADR-001 ~ ADR-006
└── source.md            # 源 Feature 一览 — 2 个核心 Feature
```

## 文件说明
| 文件 | 说明 | 类型 |
|------|------|------|
| docs-overview.md | 插件工程架构全景 — 三层分层 Mermaid 架构图（核心业务层/平台适配层/共享层的依赖关系）、各层详细说明、工具系统（统一类型导出/Agent 动态注册/多平台安装）、构建流程 Mermaid 图（.hbs→.md→dist.zip→用户项目）、测试组织（3 粒度独立执行） | 全景文档 |
| adr-index.md | 6 项架构决策记录 — ADR-001（三层架构分层）、ADR-002（模板与业务逻辑分离）、ADR-003（构建配置标准化）、ADR-004（测试组织策略）、ADR-005（根目录架构公约）、ADR-006（模块 API 契约） | ADR 索引 |
| source.md | 源 Feature 一览 — specs-tree-framework-architecture（三层架构设计+构建分发+测试策略）、specs-tree-sdd-tools-optimization（build-agents.cjs+多平台安装脚本+dist 打包） | 溯源清单 |

## 上级目录
- [返回上级](../TREE.md)
- [返回首页](../../TREE.md)
