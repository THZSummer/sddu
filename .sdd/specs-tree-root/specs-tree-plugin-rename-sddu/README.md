# Directory: .sdd/specs-tree-root/specs-tree-plugin-rename-sddu/

## 目录简介
插件改名 SDDU Feature 规范目录，记录从 "OpenCode SDD Plugin" 升级到 "OpenCode SDDU Plugin" 的完整规范、规划、任务和决策。

**Feature ID**: FR-SDDU-RENAME-001  
**状态**: completed (validated)  
**版本**: 1.4.0

## 目录结构
```
specs-tree-plugin-rename-sddu/
├── README.md                          # 本文件 - 目录导航
├── spec.md                            # 规范文档 - 插件改名 SDDU 需求规范
├── plan.md                            # 技术规划 - 实施计划和技术方案
├── tasks.md                           # 任务分解 - 18 个开发任务
├── review.md                          # 代码审查报告
├── validation-report.md               # 验证报告
├── discovery.md                       # 需求挖掘文档
├── state.json                         # 状态文件 (completed.legendary.sealed)
├── spec.json                          # 规范元数据
├── tasks.json                         # 任务元数据
└── decisions/                         # 架构决策子目录
    ├── README.md                      # 决策目录导航
    ├── ADR-015.md                     # 向后兼容策略 - 双名称并存
    ├── ADR-016.md ~ ADR-019.md        # 其他相关决策
```

## 文件说明
| 文件 | 说明 | 状态 |
|------|------|------|
| spec.md | 插件改名 SDDU 需求规范 - 6 个维度改名策略 | ✅ specified |
| plan.md | 技术规划 - 配置模型驱动修改策略 | ✅ reviewed |
| tasks.md | 任务分解 - P0/P1/P2 优先级任务列表 | ✅ completed |
| review.md | 代码审查报告 | ✅ completed |
| validation-report.md | 验证报告 - 功能验证结果 | ✅ completed |
| discovery.md | 需求挖掘文档 | ✅ completed |
| state.json | 状态文件 - completed.legendary.sealed | ✅ sealed |
| spec.json | 规范元数据 | ✅ 存在 |
| tasks.json | 任务元数据 | ✅ 存在 |

## 子目录
| 目录 | 说明 |
|------|------|
| decisions/ | 架构决策记录，包含 ADR-015 至 ADR-019，记录改名过程中的关键决策 |

## Feature 概述

### 改名范围 (6 个维度)
| 维度 | 旧命名 | 新命名 |
|------|--------|--------|
| 插件名称 | OpenCode SDD Plugin | OpenCode SDDU Plugin |
| 包名 (npm) | opencode-sdd-plugin | opencode-sddu-plugin |
| Agent 命令 | @sdd-* | @sddu-* |
| 工具/命令 | sdd_* | sddu_* |
| specs-tree 目录 | specs-tree-sdd-* | specs-tree-sddu-* |
| 错误前缀 | [SDD- | [SDDU- |

### 核心原则：配置模型驱动
- ✅ 直接修改 `src/config/opencode-config.ts` 配置模型
- ✅ 配置文件由配置模型自动生成
- ❌ 不直接修改 `.opencode/*`、`.sdd/*`、`opencode.json`

### 主要成就
- 🏆 Legendary Grade III 认证
- 🔐 Permanently Authenticated
- ✅ 不可能三角已解决 (增强无中断、功能无移除、进展无风险)

## 相关文档
- [架构决策](./decisions/README.md) - 改名过程中的关键决策记录

## 上级目录
- [返回上级](../README.md)
- [返回首页](../../README.md)
