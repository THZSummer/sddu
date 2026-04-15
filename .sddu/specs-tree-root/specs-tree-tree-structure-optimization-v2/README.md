# 树形结构优化 v2 - 问题修复

## 概述

本特性针对 v2.4.0 树形结构优化在 `blog-platform` 全栈 E2E 测试验证中发现的 5 个关键问题进行修复和完善。

## 问题清单

| 问题 | 严重程度 | 描述 |
|------|----------|------|
| P-001 | 🔴 P0 | state.json 缺少必填字段（version, depth, phaseHistory, dependencies） |
| P-002 | 🟡 P1 | Discovery 阶段未输出 Feature 拆分建议 |
| P-003 | 🟡 P1 | 无树形嵌套 E2E 测试场景验证 |
| P-004 | 🟡 P1 | 缺少拆分原则文档和树形示例项目 |
| P-005 | 🟢 P2 | 跨子树依赖解析能力未验证 |

## 修复范围

- **MVP**: State Schema 修复 + Agent 智能增强 + 树形嵌套 E2E 测试
- **V1**: MVP + 拆分原则文档 + 树形示例项目

## 依赖

- 依赖: `specs-tree-tree-structure-optimization` (v2.4.0)

## 状态

- **当前阶段**: 3 (Tasked)
- **Schema 版本**: v2.1.0

## 目录结构

```
specs-tree-tree-structure-optimization-v2/
├── README.md              # 本文件 - 目录导航
├── discovery.md           # 需求挖掘报告
├── spec.md                # 功能规范
├── spec.json              # 规范元数据
├── plan.md                # 技术规划
├── tasks.md               # 任务分解 (20 个任务, 4 个波次)
├── tasks.json             # 任务元数据 (JSON)
├── state.json             # 状态文件 (tasked, phase 3)
└── decisions/             # 架构决策记录子目录
    ├── README.md          # ADR 目录导航
    ├── ADR-V2-001.md      # State Schema 验证策略
    ├── ADR-V2-002.md      # 缺失字段处理策略
    ├── ADR-V2-003.md      # 拆分建议触发规则
    ├── ADR-V2-004.md      # 树形测试场景实现方式
    └── ADR-V2-005.md      # 历史 state.json 兼容性处理
```

## 文件说明

| 文件 | 说明 | 状态 |
|------|------|------|
| discovery.md | 需求挖掘报告 - E2E 测试验证发现的问题清单 | ✅ discovered |
| spec.md | 树形结构优化 v2 规范 - 5 个关键问题修复 | ✅ specified |
| spec.json | 规范元数据 | ✅ 存在 |
| plan.md | 技术规划 - MVP + V1 修复范围 | ✅ planned |
| tasks.md | 任务分解 - 20 个任务 (S×11, M×6, L×3), 4 个波次 | ✅ tasked |
| tasks.json | 任务元数据 - JSON 格式任务清单 (20 个任务) | ✅ 存在 |
| state.json | 状态文件 (tasked, phase 3) | ✅ tasked |

## 子目录

| 目录 | 说明 |
|------|------|
| [decisions/](./decisions/README.md) | 架构决策记录 (ADR-V2-001 ~ ADR-V2-005) |

## 上级目录

- [返回规范目录](../README.md)
- [返回 SDDU 工作空间](../../README.md)
