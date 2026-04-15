# 目录：废弃 SDD Tools 和 Commands

## 目录简介

**直接移除方案**：由于 Tools 和 Commands 从未被使用，直接删除代码，无需迁移。

本目录包含废弃 SDD Tools（4 个）和 Commands（9 个）的完整规范、规划、任务分解、代码审查和验证文档。最终状态为 `validated`，所有删除工作已完成并通过验证。

---

## 目录结构

```
deprecate-sdd-tools/
├── README.md          # 本文件 - 目录导航
├── spec.md            # 规范文档（v3.0.0 简化版）
├── spec.json          # 规范元数据
├── plan.md            # 技术规划
├── tasks.md           # 任务分解（8 个任务）
├── tasks.json         # 任务元数据 (JSON)
├── review.md          # 代码审查报告
├── validate.md        # 验证报告
└── state.json         # 状态文件
```

---

## 文件说明

| 文件 | 说明 | 状态 |
|------|------|------|
| spec.md | 废弃 SDD Tools 和 Commands 规范（简化版） - 直接移除未使用的 Tools 和 Commands | ✅ specified |
| spec.json | 规范元数据（FR-DEP-001, P0 优先级） | ✅ 已完成 |
| plan.md | 技术规划 - 代码结构分析、删除方案、影响评估 | ✅ planned |
| tasks.md | 任务分解 - 8 个任务，4 个执行波次，预计 2.2 小时 | ✅ tasked |
| tasks.json | 任务元数据 - JSON 格式任务清单 | ✅ 存在 |
| review.md | 代码审查报告 - 审查删除工作的完整性和正确性 | ✅ reviewed |
| validate.md | 验证报告 - 验收标准逐项验证通过 | ✅ validated |
| state.json | 状态文件（validated, 2026-04-01） | ✅ validated |

---

## 范围摘要

### 删除内容
- **Tools（4 个）**: `sdd_init`, `sdd_specify`, `sdd_status`, `sdd_roadmap`
- **Commands（9 个）**: `/sdd init`, `specify`, `clarify`, `plan`, `tasks`, `implement`, `validate`, `status`, `retro`
- **文件**: `src/commands/sdd.ts`, `src/commands/` 目录

### 保留内容
- **Agents（16 个）**: `@sdd`, `@sdd-spec`, `@sdd-plan`, `@sdd-tasks`, `@sdd-build`, `@sdd-review`, `@sdd-validate`, `@sdd-roadmap`, `@sdd-docs` 等

---

## 最终架构

```
┌─────────────────────────────────────────┐
│  SDD Plugin                             │
├─────────────────────────────────────────┤
│  ┌───────┐                              │
│  │Agents │  (唯一入口)                   │
│  │(16 个) │                              │
│  └───────┘                              │
└─────────────────────────────────────────┘
```

---

## 相关链接

### 上级目录
- [返回规范目录](../README.md)
- [返回 SDD 根目录](../../README.md)

### 相关文档
- [SDD 规范目录](../README.md) - 查看所有规范

---

## 时间线

| 日期 | 活动 |
|------|------|
| 2026-04-01 | 规范完成 + 执行删除 + 审查 + 验证 |
| 2026-04-02 | 发布 v1.3.0 |

---

## 状态

**当前状态**: `validated` ✅

所有删除工作已完成，代码审查通过，验证报告确认所有验收标准已满足。
