# SDDU 特性状态增强

## 概述

将 SDDU 状态模型从单字段混用重构为两字段隔离：
- **phase**（8 阶段，统一 -ed）：registered → discovered → specified → planned → tasked → builded → reviewed → validated
- **status**（5 状态）：tracked / completed / suspended / terminated / merged
- 包含一致性检测内置升级机制（R5）、`@sddu 标记` 命令、分类仪表盘

## 状态

| 属性 | 值 |
|------|-----|
| **phase** | `specified` |
| **status** | `tracked` |
| **优先级** | P1 |
| **Feature ID** | FR-STATUS-ENHANCE-001 |
| **创建日期** | 2026-06-12 |
| **更新日期** | 2026-06-12 |

## 目录结构

```
specs-tree-sddu-status-enhancement/
├── README.md              # 本文件 - 目录导航
├── discovery.md           # 需求挖掘报告 v5.0.0（最终模型）
├── spec.md                # Feature 规范（本阶段产出）
├── spec.json              # 结构化规范数据
└── state.json             # 状态文件 (phase: specified, status: tracked)
```

## 需求全景

### MVP — Must Have（R1-R5）
- [ ] **FR-001**: 两字段模型落地 — state.json 使用 phase + status 替代混用字段
- [ ] **FR-002**: Phase 自动推进 — 单向不可逆，系统自动
- [ ] **FR-003**: Status 过滤 — 非 tracked 特性不在建议区列出
- [ ] **FR-004**: 子随父归 — 非 tracked 父特性下的子特性归入父节点
- [ ] **FR-005**: Schema 联合验证 — phase（8 值）+ status（5 值）
- [ ] **FR-006**: 自动完成 — phase 到达 validated 时自动设 status 为 completed
- [ ] **FR-007**: 一致性检测 — 版本升级后首次 `@sddu 状态` 自动触发
- [ ] **FR-008**: 非 tracked 保护 — 修复时不覆盖用户设定的非 tracked status

### V1 — Should Have（R6-R9）
- [ ] **FR-009**: `@sddu 标记` 命令 — suspended/terminated/merged/tracked
- [ ] **FR-010**: 分类仪表盘 — 🟢进行中/✅已完成/🟡搁置/🔴终止/🔵迁出/⚠️异常
- [ ] **FR-011**: 父特性聚合 — 根据子特性进度聚合展示
- [ ] **FR-012**: Suspended 到期提醒 — 被动检测，仅提醒不自动变更

### V2 — Nice to Have（R10-R11）
- [ ] **FR-013**: 长期停滞检测
- [ ] **FR-014**: Merged 特性跳转追溯

## 核心模型（不可变更）

| 维度 | 内容 |
|------|------|
| **设计原则** | phase + status 两字段完全独立，互不推导 |
| **phase 值** | registered, discovered, specified, planned, tasked, builded, reviewed, validated |
| **status 值** | tracked, completed, suspended, terminated, merged |
| **推荐规则** | 仅 `status === "tracked" && phase !== "validated"` 时推荐继续 |
| **不可逆状态** | completed, terminated, merged |

## 受影响模块

| 模块 | 文件 | 改动等级 |
|------|------|----------|
| Schema | `src/state/schema.ts` | 🔴 重大（phase + status 联合） |
| StateMachine | `src/state/machine.ts` | 🔴 重大（getNextStep 联合推导） |
| StateLoader | `src/state/state-loader.ts` | 🟡 中等（识别新模型） |
| TreeScanner | `src/state/tree-scanner.ts` | 🟡 中等（子随父归） |
| ConsistencyChecker | `src/state/consistency-checker.ts` | 🆕 新建（R5） |
| AutoUpdater | `src/state/auto-updater.ts` | 🟡 中等（跳过非 tracked） |
| Agent | `agents/sddu.md` | 🔴 重大（过滤+分类+标记） |
| Agent | `agents/sddu-docs.md` | 🟡 中等（status 标注） |

## 成功指标

| 指标 | 当前 | 目标 |
|------|------|------|
| 建议区非 tracked 特性 | 有 | 0 |
| 非 tracked 子特性独立计数 | 有 | 0（归入父节点） |
| 标记操作步骤 | 3 步 | 1 条命令 |
| Phase 值 | 混用不完整 | 8 个（统一 -ed） |
| Status 值 | 混用不完整 | 5 个 |
| 自动完成标记 | 无 | 自动设 completed |
| 结构异常检测 | 无 | 实时报告 |

## 下一步

👉 运行 `@sddu-plan specs-tree-sddu-status-enhancement` 进入技术规划阶段

## 上级目录

- [返回规范目录](../README.md)
- [返回 SDDU 工作空间](../../README.md)

---

*创建日期：2026-06-12 | phase：specified | status：tracked | discovery v5.0.0*
