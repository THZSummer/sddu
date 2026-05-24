# Agent 输出模板化系统

## 概述

将每个 SDDU Agent（discovery/spec/plan/tasks/build/review/validate）的输出固化为标准化模板，支持用户自定义模板覆盖内置默认模板。通过模板变量替换实现动态内容填充，提升 Agent 输出的一致性和可定制性。

## 状态

| 属性 | 值 |
|------|-----|
| **状态** | `validated` |
| **阶段** | Phase 6 (Validate) - 已完成 |
| **优先级** | P1 |
| **版本** | 1.0.0 |
| **验证日期** | 2026-05-25 |

## 目录结构

```
specs-tree-agent-output-templating/
├── README.md              # 本文件 - 目录导航
├── discovery.md           # 需求挖掘报告
├── spec.md                # 功能规范
├── spec.json              # 规范元数据
├── plan.md                # 技术规划
├── tasks.json             # 任务元数据 (8 个任务, Sx9 + Mx4)
├── review.md              # 代码审查报告
├── validation-report.md   # 验证报告 (13/13 FR, 6/6 NFR, 8/8 EC 全部通过)
├── state.json             # 状态文件 (validated, phase 6)
└── decisions/             # 架构决策记录子目录
    ├── ADR-018.md         # 模板系统架构设计
    └── ADR-019.md         # 模板变量方案设计
```

## 文件说明

| 文件 | 说明 | 状态 |
|------|------|------|
| discovery.md | 需求挖掘 - Agent 输出格式硬编码问题分析 | ✅ 已完成 |
| spec.md | 功能规范 - 7 个 Agent 输出模板 + 自定义模板覆盖 | ✅ 已完成 |
| spec.json | 规范元数据 | ✅ 存在 |
| plan.md | 技术规划 - 内置模板 + 用户自定义模板 + 模板变量 | ✅ 已完成 |
| tasks.json | 任务分解 - 8 个任务 (Sx9 + Mx4) | ✅ 已完成 |
| review.md | 代码审查报告 | ✅ 已完成 |
| validation-report.md | 验证报告 - 100% 覆盖率 (13/13 FR, 6/6 NFR, 8/8 EC) | ✅ 已完成 |

## 子目录

| 目录 | 说明 |
|------|------|
| [decisions/](./decisions/) | 架构决策记录 (ADR-018, ADR-019) |

## 核心功能

1. **输出模板固化** - 每个 Agent 的输出格式固化为模板文件
2. **内置默认模板** - spec/plan/tasks/review/validate 等模板
3. **用户自定义模板** - 自定义模板优先于内置模板
4. **模板变量替换** - feature 名称、日期、路径等动态内容
5. **模板发现机制** - 内置模板 + 用户模板目录扫描
6. **6 阶段工作流集成** - 与现有工作流无缝融合

## 技术决策 (ADR)

| ADR ID | 标题 | 状态 |
|--------|------|------|
| ADR-018 | 模板系统架构设计 | 已采纳 |
| ADR-019 | 模板变量方案设计 | 已采纳 |

## 依赖关系

- **依赖**: `specs-tree-sdd-workflow-state-optimization`
- **阻塞**: 无

## 上级目录

- [返回规范目录](../README.md)
- [返回 SDDU 工作空间](../../README.md)

---

**创建日期**: 2026-05-24  
**验证日期**: 2026-05-25  
**修订日期**: 2026-05-25