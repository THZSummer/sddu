# Task Dispatcher — 任务分配器

> **父特性**: [ETD (Expert Tree Design)](../README.md)  
> **状态**: 🚫 已终止 — 随父特性 ETD 迁移至独立项目

## 终止声明

此子特性随父特性 `ETD (Expert Tree Design)` 于 **2026-06-12** 在 SDDU 项目内终止。ETD 已迁移至独立仓库，SDDU 与 ETD 为两个独立项目，互不依赖。

**⚠️ 状态查询时请勿提示启动此特性。**

## 基本信息

| 属性 | 值 |
|------|-----|
| **Feature ID** | ETD-FR-DISPATCHER-001 |
| **名称** | Task Dispatcher / 任务分配器 |
| **状态** | 🚫 terminated（随父特性） |
| **优先级** | P0 |
| **创建日期** | 2026-04-18 |
| **预估工时** | Medium |

## 目录结构

```
specs-tree-task-dispatcher/
├── README.md              # 本文件 - 目录导航
└── state.json             # 状态文件
```

## 原始功能描述

实现「先找专家，找不到才自己做」的递归分配逻辑：
- 任务解析与专家匹配
- 递归向下分配
- 结果向上汇聚
- 支持 AI 执行树 + 人类看护树双树

## 上级目录

- [返回父特性](../README.md)
- [返回规范目录](../../README.md)

---

*创建日期：2026-04-18 | 终止日期：2026-06-12 | 去向：ETD 独立仓库*
