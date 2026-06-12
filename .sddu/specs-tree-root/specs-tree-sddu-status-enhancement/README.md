# SDDU 特性状态增强

## 概述

将 SDDU 状态模型从单字段混用重构为两字段隔离：
- **phase**（8 阶段，统一 -ed）：registered → discovered → specified → planned → tasked → builded → reviewed → validated
- **status**（5 状态）：tracked / completed / suspended / terminated / merged
- 包含一致性检测内置升级机制（R5）、`@sddu 标记` 命令、分类仪表盘

## 状态

| 属性 | 值 |
|------|-----|
| **phase** | `validated` |
| **status** | `completed` |
| **优先级** | P1 |
| **Feature ID** | FR-STATUS-ENHANCE-001 |
| **创建日期** | 2026-06-12 |
| **更新日期** | 2026-06-13 |

## 目录结构

```
specs-tree-sddu-status-enhancement/
├── README.md               # 本文件 - 目录导航
├── discovery.md            # 需求挖掘报告 v5.0.0（最终模型）
├── spec.md                 # Feature 规范 (15 FR + 6 NFR + 12 EC)
├── spec.json               # 结构化规范数据
├── plan.md                 # 技术规划 (方案 B — 干净切换)
├── tasks.md                # 任务分解 (14 个任务, 6 波次)
├── tasks.json              # 任务元数据
├── build.md                # 构建报告 (14/14 任务完成, 396/400 测试通过)
├── review.md               # 代码审查报告 (✅ 通过)
├── validation-report.md    # 验证报告 (100% 覆盖率: 15 FR/6 NFR/12 EC)
├── ADR-020.md              # 架构决策: 两字段隔离模型
└── state.json              # 状态文件 (phase: validated, status: completed)
```

## 需求全景

### MVP — Must Have（R1-R5）✅ 全部完成
- [x] **FR-001**: 两字段模型落地 — state.json 使用 phase + status 替代混用字段
- [x] **FR-002**: Phase 自动推进 — 单向不可逆，系统自动
- [x] **FR-003**: Status 过滤 — 非 tracked 特性不在建议区列出
- [x] **FR-004**: 子随父归 — 非 tracked 父特性下的子特性归入父节点
- [x] **FR-005**: Schema 联合验证 — phase（8 值）+ status（5 值）
- [x] **FR-006**: 自动完成 — phase 到达 validated 时自动设 status 为 completed
- [x] **FR-007**: 一致性检测 — 版本升级后首次 `@sddu 状态` 自动触发
- [x] **FR-008**: 非 tracked 保护 — 修复时不覆盖用户设定的非 tracked status

### V1 — Should Have（R6-R9）✅ 全部完成
- [x] **FR-009**: `@sddu 标记` 命令 — suspended/terminated/merged/tracked
- [x] **FR-010**: 分类仪表盘 — 🟢进行中/✅已完成/🟡搁置/🔴终止/🔵迁出/⚠️异常
- [x] **FR-011**: 父特性聚合 — 根据子特性进度聚合展示
- [x] **FR-012**: Suspended 到期提醒 — 被动检测，仅提醒不自动变更

### V2 — Nice to Have（R10-R11）✅ 全部完成
- [x] **FR-013**: 长期停滞检测
- [x] **FR-014**: Merged 特性跳转追溯

## 核心模型（不可变更）

| 维度 | 内容 |
|------|------|
| **设计原则** | phase + status 两字段完全独立，互不推导 |
| **phase 值** | registered, discovered, specified, planned, tasked, builded, reviewed, validated |
| **status 值** | tracked, completed, suspended, terminated, merged |
| **推荐规则** | 仅 `status === "tracked" && phase !== "validated"` 时推荐继续 |
| **不可逆状态** | completed, terminated, merged |

## 构建成果

| 指标 | 值 |
|------|-----|
| 任务完成 | 14/14 (100%) |
| 新建文件 | 7 |
| 修改文件 | ~75 |
| 变更行数 | +12,200 / -3,700 |
| 核心测试 | 122/122 (100%) |
| 全量测试 | 396/400 (99%) |
| 编译状态 | ✅ 0 errors |

## 验证结果

| 需求类型 | 总数 | 已覆盖 | 覆盖率 |
|----------|------|--------|--------|
| 功能需求 (FR) | 15 | 15 | **100%** |
| 非功能需求 (NFR) | 6 | 6 | **100%** |
| 边界情况 (EC) | 12 | 12 | **100%** |

**结论**: ✅ 通过 — 代码实现与规范完全一致，无阻塞问题，无严重漂移。

## 受影响模块

| 模块 | 文件 | 改动等级 |
|------|------|----------|
| Schema | `src/state/schema-v3.0.0.ts` | 🔴 重大（新建，278 行） |
| StateMachine | `src/state/machine.ts` | 🔴 重大（删除双宇宙映射，672 行） |
| StateLoader | `src/state/state-loader.ts` | 🟡 中等（适配 v3.0.0） |
| TreeScanner | `src/state/tree-scanner.ts` | 🟡 中等（子随父归） |
| ConsistencyChecker | `src/state/consistency-checker.ts` | 🆕 新建（927 行，7 项检测） |
| AutoUpdater | `src/state/auto-updater.ts` | 🟡 中等（跳过非 tracked） |
| Agent 模板 | `src/templates/agents/sddu.md.hbs` | 🔴 重大（6 区仪表盘 + 标记命令） |

## 架构决策

| ADR ID | 标题 | 状态 |
|--------|------|------|
| ADR-020 | 两字段隔离模型 — Phase + Status 完全独立 | PROPOSED |

## Feature 工作流已完成

```
discovery → spec → plan → tasks → build → review → validate ✅ 全部完成
```

## 上级目录

- [返回规范目录](../README.md)
- [返回 SDDU 工作空间](../../README.md)

---

*创建日期：2026-06-12 | phase：validated | status：completed | 验证日期：2026-06-13*
