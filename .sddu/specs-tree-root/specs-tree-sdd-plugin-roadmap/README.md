# SDD Roadmap 规划专家

> **Feature ID**: specs-tree-sdd-plugin-roadmap  
> **版本**: v1.0.0  
> **状态**: validated ✅  
> **创建日期**: 2026-04-06  
> **最后更新**: 2026-04-06

---

## 📋 概述

创建专门用于**多版本 Roadmap 规划**的 Agent（`@sdd-roadmap`），补充现有 6 阶段工作流的不足。专注于协调多个功能特性的长期发展路线图，通过科学的优先级评估和时间规划，提供最佳的发布策略建议。

---

## 🎯 核心能力

1. **Roadmap 规划**: 制定多版本迭代的路线图
2. **Feature 优先级排序**: 使用 RICE 等科学方法评估功能优先级
3. **版本时间表规划**: 基于团队资源、复杂度等因素规划版本发布时间
4. **依赖关系分析**: 分析多模块/多 Feature 间的依赖关系，优化规划顺序
5. **风险评估与建议**: 识别规划中的潜在风险，提出改进建议

---

## 📁 目录结构

```
specs-tree-sdd-plugin-roadmap/
├── README.md           # 本文件
├── spec.md            # 需求规格说明 ✅
├── plan.md            # 技术规划 ✅
├── tasks.md           # 任务分解 ✅
├── .state.json        # 状态文件 ✅
├── review.md          # 代码审查报告 ✅
└── validation.md      # 最终验证报告 ✅
```

---

## 📄 文档导航

| 文档 | 状态 | 说明 | 链接 |
|------|------|------|------|
| spec.md | ✅ validated | 需求规格说明 | [查看](./spec.md) |
| plan.md | ✅ validated | 技术规划 | [查看](./plan.md) |
| tasks.md | ✅ validated | 任务分解 | [查看](./tasks.md) |
| review.md | ✅ validated | 代码审查报告 | [查看](./review.md) |
| validation.md | ✅ validated | 最终验证报告 | [查看](./validation.md) |

---

## 🔄 状态流转

```
specified → planned → tasked → implementing → reviewed → validated
    ✅         ✅         ✅          ✅          ✅         ✅
```

**当前阶段**: Phase 6/6 - validated ✅

---

## 📊 任务统计

| 状态 | 数量 | 完成度 |
|------|------|--------|
| ✅ 已完成 | 6/6 | 100% |

---

## 🚀 使用方法

```bash
# 调用 Roadmap Agent
@sdd-roadmap "规划 Q2 版本，包含登录、支付、分享功能"

# 或基于现有 spec 规划
@sdd-roadmap "基于现有 spec 规划下一步"
```

**输出**: `.sdd/ROADMAP.md`

---

## 📝 更新历史

| 日期 | 版本 | 说明 |
|------|------|------|
| 2026-04-06 | v1.0.0 | 完成功能开发和验证 |

---

## 🔗 相关链接

- [上级目录](../) - SDD 规范目录
- [ROADMAP](../../ROADMAP.md) - 版本路线图
