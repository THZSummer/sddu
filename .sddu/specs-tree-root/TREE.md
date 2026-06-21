# Directory: .sddu/specs-tree-root/

## 目录简介
SDDU 规范文件根目录，存放 17 个 Feature 的完整 SDDU 工作流产物（discovery → spec → plan → tasks → build → review → validate）以及架构决策记录。

## 目录结构
```
specs-tree-root/
├── TREE.md                                           # 本文件 - 目录导航
├── state.json                                        # 全局状态文件 (v1.4.1)
├── architecture/                                     # 架构决策记录目录
│   ├── TREE.md                                       # architecture 导航
│   └── adr/                                          # ADR 文档集合 (ADR-001 ~ ADR-017)
│       ├── TREE.md                                   # ADR 导航
│       └── ADR-001.md ~ ADR-017.md                   # 17 篇架构决策记录
├── specs-tree-agent-output-templating/               # Agent 输出模板化系统
├── specs-tree-deprecate-sdd-tools/                   # 废弃旧版 SDD 工具
├── specs-tree-directory-optimization/                # 目录结构命名优化
├── specs-tree-framework-architecture/                # 框架源码架构重组
├── specs-tree-plugin-rename-sddu/                    # 插件改名 SDDU V1 (父)
├── specs-tree-plugin-rename-sddu-v2/                 # 插件改名 SDDU V2 (子)
├── specs-tree-sdd-discovery-feature/                 # Discovery 需求挖掘
├── specs-tree-sdd-multi-module/                      # 子 Feature 并行开发
├── specs-tree-sdd-plugin-baseline/                   # 插件基线建立
├── specs-tree-sdd-plugin-roadmap/                    # Roadmap 规划专家
├── specs-tree-sdd-tools-optimization/                # 工具系统优化
├── specs-tree-sdd-workflow-state-optimization/       # 工作流状态优化
├── specs-tree-sddu-status-enhancement/               # 特性状态增强 v3.0.0
├── specs-tree-solo-team-flow/                        # ETD — 已终止
├── specs-tree-template-quality-unification/          # 模板质量统一 v3.0.1
├── specs-tree-tree-structure-optimization/           # 树形结构优化 V1
└── specs-tree-tree-structure-optimization-v2/        # 树形结构优化 V2
```

## 全局状态

| 指标 | 值 |
|------|-----|
| 项目版本 | v1.4.1 |
| 最后修改 | 2026-06-21 |
| 当前活跃 Feature | 1 (specs-tree-framework-architecture) |
| 已完成 Feature | 15 |
| 已终止 Feature | 1 |

## Feature 目录一览

### 已完成 Feature (15 个)
| 目录 | Feature ID | 说明 | Phase | Status |
|------|-----------|------|:-----:|:------:|
| specs-tree-sdd-plugin-baseline | SDD-PLUGIN-BASE | SDD 插件基线建立 | validated | ✅ completed |
| specs-tree-deprecate-sdd-tools | FR-DEP-001 | 废弃旧版 SDD 工具 | validated | ✅ completed |
| specs-tree-directory-optimization | FR-DIR-001 | 目录结构命名优化 | validated | ✅ completed |
| specs-tree-sdd-discovery-feature | FR-DISCOVERY-001 | Discovery 需求挖掘 | validated | ✅ completed |
| specs-tree-sdd-multi-module | FR-MULTI-001 | 子 Feature 并行开发 | validated | ✅ completed |
| specs-tree-sdd-tools-optimization | FR-TOOLS-001 | 工具系统优化 | validated | ✅ completed |
| specs-tree-sdd-workflow-state-optimization | FR-WF-STATE-001 | 工作流状态优化 | validated | ✅ completed |
| specs-tree-sdd-plugin-roadmap | FR-ROADMAP-001 | Roadmap 规划专家 | validated | ✅ completed |
| specs-tree-plugin-rename-sddu | FR-RENAME-001 | 插件改名 SDDU V1 | validated | ✅ completed |
| specs-tree-plugin-rename-sddu-v2 | FR-RENAME-002 | 插件改名 V2 — 代码清理 | validated | ✅ completed |
| specs-tree-tree-structure-optimization | FR-TREE-001 | 树形结构优化 V1 | validated | ✅ completed |
| specs-tree-tree-structure-optimization-v2 | FR-TREE-002 | 树形结构优化 V2 修复 | validated | ✅ completed |
| specs-tree-agent-output-templating | FR-TEMPLATE-001 | Agent 输出模板化系统 | validated | ✅ completed |
| specs-tree-sddu-status-enhancement | FR-STATUS-001 | 特性状态增强 v3.0.0 | validated | ✅ completed |
| specs-tree-template-quality-unification | FR-TPL-001 | 模板质量统一 v3.0.1 | validated | ✅ completed |

### 进行中 Feature (1 个)
| 目录 | Feature ID | 说明 | Phase | Status |
|------|-----------|------|:-----:|:------:|
| specs-tree-framework-architecture | FR-FRAMEWORK-ARCH-001 | SDDU 框架源码架构重组 | tasked | tracked |

### 已终止 Feature (1 个)
| 目录 | Feature ID | 说明 | Status | 去向 |
|------|-----------|------|:------:|------|
| specs-tree-solo-team-flow | ETD-001 | ETD (Expert Tree Design) | 🚫 terminated | 独立仓库 |

## 子目录
| 目录 | 说明 |
|------|------|
| architecture/ | 架构决策记录 — ADR-001 ~ ADR-017 |

## 上级目录
- [返回上级](../TREE.md)
- [返回首页](../../TREE.md)
