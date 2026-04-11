# SDD 工作流状态优化 (v2.0.0)

## 概述

本 Feature 旨在优化 SDD 工作流的状态管理流程。在 `sdd-multi-module (v1.2.11)` 已实现分布式 State 管理的基础上，进一步完善状态转换集成、自动更新、依赖检查等功能。

## 状态

| 属性 | 值 |
|------|-----|
| **状态** | `validated` |
| **阶段** | Phase 6 (Validate) - 已完成 |
| **优先级** | P1 |
| **版本** | 2.0.0 |
| **修订日期** | 2026-04-05 |

## 文档

| 文档 | 状态 | 路径 |
|------|------|------|
| 规范 v2.0.0 | ✅ 已完成 | [spec.md](./spec.md) |
| 规划 v2.0.0 | ✅ 已完成 | [plan.md](./plan.md) |
| 架构决策 (ADR-006~010) | ✅ 已完成 | [architecture/adr/](../architecture/adr/) |
| 任务分解 | ⏳ 待执行 | tasks.md |

## 依赖关系

- **依赖**: `specs-tree-sdd-plugin-baseline`, `specs-tree-sdd-plugin-phase2`, `specs-tree-sdd-multi-module`
- **阻塞**: 无

## 核心功能

### 已完成 (sdd-multi-module) ✅
1. **分布式状态存储** - 每个 Feature 独立 state.json
2. **State Schema v1.2.11** - 统一状态数据格式
3. **依赖关系图** - 构建 Feature 依赖关系
4. **循环依赖检测** - DFS 算法检测循环依赖

### 待实现 (本 Feature) 🎯
1. **状态机完全集成** - 将 StateMachine 集成到所有 Agent 工作流
2. **状态自动更新** - session.idle 事件触发状态更新
3. **状态历史记录自动化** - 每次状态变更自动记录
4. **依赖状态检查器** - 状态变更前检查依赖状态
5. **跨 Feature 聚合查询自动化** - 自动扫描并聚合所有 Feature 状态
6. **State Schema 统一** - 迁移到 v2.0.0 Schema

## 技术决策 (ADR)

| ADR ID | 标题 | 状态 |
|--------|------|------|
| ADR-006 | StateMachine 集成策略 | PROPOSED |
| ADR-007 | 状态自动更新机制 | PROPOSED |
| ADR-008 | 状态历史记录格式 | PROPOSED |
| ADR-009 | 依赖检查器实现方案 | PROPOSED |
| ADR-010 | State Schema v2.0.0 迁移 | PROPOSED |

## 下一步

👉 运行 `@sdd-tasks specs-tree-sdd-workflow-state-optimization` 开始任务分解

---

**规范版本**: 2.0.0  
**规划版本**: 2.0.0  
**规划状态**: planned  
**创建日期**: 2026-04-01  
**修订日期**: 2026-04-05
