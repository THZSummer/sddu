# Directory: specs-tree-tree-structure-optimization/

## 目录简介

v2.4.0 Feature 拆分与树形结构优化 — 实现 Feature 分而治之能力：支持无限层树形嵌套（类比文件系统），定义「轻量化父级」vs「完整叶子」规范，支持混合状态管理与跨子树依赖检查。

**Feature ID**: `tree-structure-optimization`  
**版本**: 2.4.0  
**状态**: specified ✅  
**阶段**: 1/7 (Spec)  
**创建日期**: 2026-04-12  
**优先级**: P0

---

## 目录结构

```
specs-tree-tree-structure-optimization/
├── README.md              # 本文件 - 目录导航
├── discovery.md           # 需求挖掘报告 (v3.0.0)
├── spec.md                # Feature 规范 (2.4.0, 939 行)
├── spec.json              # 规范元数据
└── state.json             # 状态文件 (specified, phase 1)
```

---

## 文件说明

| 文件 | 说明 | 状态 |
|------|------|------|
| discovery.md | 需求挖掘报告 — 5 Whys 根因分析、用户画像、需求清单、推荐方案 | ✅ discovery-complete |
| spec.md | Feature 规范 — 树形结构设计、state.json v2.1.0 Schema、技术设计方案 | ✅ specified |
| spec.json | 规范元数据 — goals、userStories、requirements 结构化摘要 | ✅ 存在 |
| state.json | 状态文件 — specified (phase 1), depth=1 | ✅ 存在 |

---

## Feature 概述

### 核心问题

| 问题 ID | 问题描述 | 与根因的关系 |
|---------|----------|--------------|
| **P-001** | 插件默认只生成平层目录，不具备 Feature 拆分能力 | 🔴 核心根因 |
| **P-002** | root 缺少顶层规划文档 | 🟡 表象 |
| **P-003** | Feature 水平平铺，非树形结构 | 🟡 表象 |

### 核心目标

| ID | 目标 | 验收标准 |
|----|------|----------|
| G-001 | 实现 Feature 拆分能力 | 支持将大型 Feature 拆分为多个子 Feature |
| G-002 | 支持无限层树形嵌套 | 技术上不限制嵌套深度（类比文件系统） |
| G-003 | 全新树形设计，无需为旧版平级做特殊兼容 | 平级是深度为 1 的树形特例，新设计无需背负历史债 |
| G-004 | 定义「轻量化父级」规范 | 父级只需 discovery/spec/plan + README + state.json |
| G-005 | 定义「完整叶子」规范 | 叶子走完整 SDDU 工作流 |
| G-006 | 混合状态管理 | 父级 status 为自身状态，childrens 记录各子级状态 |
| G-007 | 支持跨子树依赖 | 子 Feature 直接引用其他子 Feature 完整路径 |
| G-008 | 统一 schema v2.1.0 | 新增 childrens 数组、depth 字段 |

### 技术设计要点

- **递归扫描器** (`tree-scanner.ts`): 递归识别任意深度 `specs-tree-*` 目录
- **State Schema v2.1.0**: 新增 childrens 数组、depth 字段（parent 无需存储，上级目录即父级）
- **跨子树依赖解析**: 支持完整路径引用 + 循环依赖检测
- **手动扫描更新**: 父级通过手动触发扫描更新 childrens 数组

### 示例树形结构

```
specs-tree-root/                              # ← 轻量化父级
├── specs-tree-tree-structure-optimization/   # ← 当前 Feature（叶子）
│   ├── discovery.md
│   ├── spec.md
│   └── state.json
├── specs-tree-[parent-feature]/              # ← 未来可能的父级
│   ├── discovery.md / spec.md / plan.md
│   └── specs-tree-[sub-feature]/             # ← 完整叶子
│       └── discovery.md ~ validate.md
```

---

## 流程阶段

```
✅ Discovery → 2026-04-12 完成 (discovery-complete)
    ↓
✅ Spec      → 2026-04-12 完成 (specified)
    ↓
⏳ Plan      → 待执行
    ↓
⏳ Tasks     → 待执行
    ↓
⏳ Build     → 待执行
    ↓
⏳ Review    → 待执行
    ↓
⏳ Validate  → 待执行
```

---

## 依赖关系

| 依赖类型 | Feature | 说明 |
|----------|---------|------|
| **父 Feature** | specs-tree-root | 根层级 |
| **前置依赖** | 无 | 独立启动 |

---

## 相关链接

### 上级目录
- [返回规范目录](../README.md)
- [返回 SDDU 工作空间](../../README.md)

### 相关 ADR
- **ADR-001**: 完全分布式存储 → ✅ 天然支持树形
- **ADR-005**: 7 步工作流固定顺序 → ⚠️ 仅叶子完整走 6 阶段
- **ADR-009**: 混合模式依赖检查 → ✅ 可增强为跨子树
- **ADR-014**: 打包分发结构优化 → ⚠️ 树形结构需纳入打包

### 下一步
👉 运行 `@sddu-plan tree-structure-optimization` 开始技术规划

---

*最后更新：2026-04-12 | 状态：specified | 阶段：1/7*
