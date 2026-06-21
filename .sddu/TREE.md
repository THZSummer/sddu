# Directory: .sddu/

## 目录简介
`.sddu/` 目录是 **Software Development Definition Unified (SDDU)** 工作流的核心存储位置，存放项目的设计规范、开发规划、实施计划等功能性文档，以及开发相关的元数据和配置。

## 目录结构
```
.sddu/
├── TREE.md                                     # 本文件 - 目录导航
├── ROADMAP.md                                  # 版本路线图 (v3.0.0 ~ v3.2.0 规划)
├── COMPLETION_CERTIFICATE.json                 # SDD→SDDU 迁移完成证书
├── review-report-plugin-rename-sddu.json       # 插件改名审查报告
├── docs/                                       # 工具文档目录 (29 个文档)
│   ├── TREE.md                                 # docs 目录导航
│   ├── faq.md                                  # 常见问题解答
│   ├── migration-guide.md                       # SDD→SDDU 迁移指南
│   ├── containerization-faq.md                  # 容器化 FAQ
│   └── migration-*.md                           # 迁移状态系列文档 (25 个)
└── specs-tree-root/                             # 规范文件根目录
    ├── TREE.md                                  # specs-tree-root 目录导航
    ├── state.json                               # 全局状态文件 (v1.4.1)
    ├── architecture/                            # 架构决策记录目录
    │   ├── TREE.md                              # architecture 目录导航
    │   └── adr/                                 # ADR 文档集合
    │       ├── TREE.md                          # ADR 目录导航
    │       └── ADR-001.md ~ ADR-017.md          # 主 ADR 集合 (17 篇)
    └── specs-tree-[feature]/                    # 标准化 Feature 目录 (17 个)
```

## 文件说明
| 文件 | 说明 | 状态 |
|------|------|------|
| ROADMAP.md | SDDU 版本路线图 v8.0.0 — v3.0.0 ~ v3.2.0 全量规划 | ✅ 存在 |
| COMPLETION_CERTIFICATE.json | SDD→SDDU 迁移完成证书 (T-004, T-018) | ✅ 存在 |
| review-report-plugin-rename-sddu.json | 插件改名 SDDU 审查报告 | ✅ 存在 |

## 子目录
| 目录 | 说明 | 状态 |
|------|------|------|
| docs/ | SDDU 文档资源 — FAQ、迁移指南、迁移状态记录 (29 个文档) | ✅ 存在 |
| specs-tree-root/ | 规范文件根目录 — 17 个 Feature 目录 + 架构 ADR | ✅ 存在 |

## 统计
| 指标 | 值 |
|------|-----|
| Feature 总数 | 17 |
| 已完成 (completed) | 15 |
| 已终止 (terminated) | 1 |
| 进行中 (tracked) | 1 |
| 架构 ADR | 17 篇 (ADR-001 ~ ADR-017) |
| 文档资源 | 29 个 .md 文件 |

## 上级目录
- [返回首页](../TREE.md)

## 命名规范
- 所有 specs 目录以 `specs-tree-` 前缀开头
- 采用 kebab-case：`specs-tree-my-feature`
- SDDU 支持更深嵌套层次和更丰富域名结构

## SDDU 7 阶段工作流
```
discovery → spec → plan → tasks → build → review → validate
(阶段 0)    (阶段 1)  (阶段 2)  (阶段 3)  (阶段 4)  (阶段 5)  (阶段 6)
```
