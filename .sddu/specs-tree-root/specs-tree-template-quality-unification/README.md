# 预置输出模板质量统一

> **Feature ID**: FR-TPL-001  
> **类型**: 技术债务清理 / 质量改进  
> **目标版本**: v3.0.1 Patch  
> **阶段**: Phase 1 (Discovered)  
> **状态**: 🟢 进行中 (tracked)

## 概述

统一 SDDU 插件 v2.5.0 (FR-TEMPLATE-001) 中 **17 个内置模板文件**的格式、结构和命名。深度审查发现 **10 类不一致问题**（标题格式、章节结构、代码块反引号数、缩进、异常处理表格、依赖关系节、输出模板结构、版本信息缺失、输出模板节覆盖不均、输出模板结构深度不均），影响模板可维护性和开发者体验（DX）。

## 状态

| 属性 | 值 |
|------|-----|
| **phase** | `discovered` |
| **status** | `tracked` |
| **优先级** | P3 |
| **Feature ID** | FR-TPL-001 |
| **发现日期** | 2026-06-13 |
| **目标版本** | v3.0.1 |
| **预估工作量** | S (5 小时) |
| **依赖** | `specs-tree-agent-output-templating` (✅ completed) |

## 目录结构

```
specs-tree-template-quality-unification/
├── README.md              # 本文件 - 目录导航
├── discovery.md           # 需求挖掘报告 (386 行)
└── state.json             # 状态文件 (phase: discovered, status: tracked)
```

## 文件说明

| 文件 | 说明 | 状态 |
|------|------|------|
| discovery.md | 需求挖掘报告 — 10 类模板质量问题详解 + 修复策略 + 验收标准 | ✅ discovered |
| state.json | 状态文件 — phase 1 (discovered), status: tracked | ✅ 存在 |

## 核心问题 (10 类)

| # | 问题 | 影响文件 | 风险 |
|---|------|----------|:----:|
| Q1 | 标题格式不统一 | 4 个辅助 Agent | 低 |
| Q2 | 章节结构不统一 | 11 个 Agent | 中 |
| Q3 | 代码块反引号数不一致 | review, validate | 低 |
| Q4 | 缩进断裂 | review (L19), validate (L33) | 低 |
| Q5 | 异常处理表格列宽/格式不统一 | 7 个 Agent | 中 |
| Q6 | 依赖关系节格式不一致 | 7 个主流程 Agent | 中 |
| Q7 | 输出模板「自动触发文档更新」块位置不一 | 6 个 output/*.hbs | 低 |
| Q8 | Agent 版本信息缺失 | 6 个主流程 + 3 个辅助 Agent | 低 |
| Q9 | 输出模板节覆盖不均 | 4 个辅助 Agent | 低 |
| Q10 | 输出模板结构深度不均 | 6 个 output/*.hbs | 低 |

## 需求清单

### Must Have (R1-R10)
- R1-R4: 格式问题修复（标题、章节顺序、代码块、缩进）
- R5-R7: 结构对齐（异常处理表格、依赖关系节、输出模板）
- R8-R9: 功能补全（版本信息、输出模板节）
- R10: 编写 VARIABLES.md 变量命名规范文档

### Should Have (R11-R12)
- R11: 模板编写 checklist 加入 VARIABLES.md
- R12: Frontmatter 字段顺序统一

### 明确不做 (W1-W6)
- 不修改构建脚本、不新增模板文件、不改 Agent 行为/逻辑、不做模板校验工具、不做多套风格、不做模板版本管理

## 三步修复策略

```
阶段 1: 制定规范 (1h)  → VARIABLES.md + 标准结构确定
阶段 2: 批量修复 (3h)  → Q1-Q10 逐类修复
阶段 3: 构建验证 (1h)  → node build-agents.cjs + npm test + 冒烟测试
```

## 验收标准 (10 项)

| AC | 条件 |
|----|------|
| AC-1 | 11 个 Agent Prompt 模板标题格式一致 |
| AC-2 | 7 个主流程 Agent 章节顺序一致 |
| AC-3 | 所有代码块使用 3 反引号 |
| AC-4 | 缩进对齐 |
| AC-5 | 异常处理表格列统一 |
| AC-6 | 依赖关系节字段格式统一 |
| AC-7 | 6 个 output/*.hbs 结构一致 |
| AC-8 | `node build-agents.cjs` 构建成功 |
| AC-9 | `npm test` 全量通过 |
| AC-10 | Agent 冒烟测试无回归 |

## 依赖关系

- **依赖**: `specs-tree-agent-output-templating` (✅ completed 2026-05-25)
- **阻塞**: 无 — 本 Feature 不阻塞任何其他 Feature
- **建议**: 在 v3.0.0 正式发布前完成，使模板格式统一成为 v3.x 的基线

## 下一步

👉 运行 `@sddu-spec template-quality-unification` 进入规范编写阶段

## 上级目录

- [返回规范目录](../README.md)
- [返回 SDDU 工作空间](../../README.md)

---

*创建日期：2026-06-13 | phase：discovered | status：tracked | 北极星指标：10/10 AC 通过*
