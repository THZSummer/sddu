---
feature: v6.00.0-essence-simplification
featureId: FR-ESSENCE-001
name: 简化与本质化（回归方法论本质）
version: v6.0.0
phase: reviewed
status: tracked
depth: 0
childrens: []
phaseHistory:
  - phase: registered
    timestamp: "2026-11-22T10:25:00.000Z"
    triggeredBy: sddu
    comment: "v6.0.0「简化与本质化」立项（PR-017 转化，承接 P-042）"
  - phase: discovered
    timestamp: "2026-11-22T10:32:00.000Z"
    triggeredBy: sddu-discovery
    comment: "问题挖掘完成：7 问题 / 4 假设 / 5 风险"
  - phase: specified
    timestamp: "2026-11-22T10:45:00.000Z"
    triggeredBy: sddu-spec
    comment: "需求规范完成：8 FR / 7 NFR / 7 EC（两大支柱 + 裁撤用户确认制）"
  - phase: planned
    timestamp: "2026-11-22T10:58:00.000Z"
    triggeredBy: sddu-plan
    comment: "技术规划完成：方案 A；产出 ADR-001~003"
  - phase: planned
    timestamp: "2026-11-23T01:10:00.000Z"
    triggeredBy: sddu
    comment: "回退 tasked：plan 迭代期撤除 tasks；plan 迭代至 v4.0"
  - phase: tasked
    timestamp: "2026-11-25T00:40:00.000Z"
    triggeredBy: sddu-tasks
    comment: "任务分解：15 任务 / 4 波次（S×2 / M×5 / L×8）"
  - phase: builded
    timestamp: "2026-11-25T13:00:00.000Z"
    triggeredBy: sddu-build
    comment: "实施构建完成：内核蒸馏 + 载体退役 + 模块/契约迁移 + 复制器 + e2e + 存量迁移 + ROADMAP 回填；产出 ADR-015~028"
  - phase: reviewed
    timestamp: "2026-11-25T13:20:00.000Z"
    triggeredBy: sddu-review
    comment: "R1 审查通过：15 项清单（14 ✅ / 1 ⚠️ / 0 ❌ / 0 阻塞）；唯一警告为 docs/fast 模块 .opencode/ 残留（低严重度非阻塞）"
dependencies: []
description: 回归方法论本质（v6.0.0）：方法论内核蒸馏 + 载体瘦身；统一安装范式（本体/工作空间二分 + 唯一入口 + 零运行时件）；载体降位为可替换附属品。
---

# 简化与本质化（回归方法论本质）

当前阶段：**reviewed** · 状态：**tracked**

回归方法论本质（v6.0.0）：方法论内核蒸馏 + 载体瘦身；统一安装范式（本体/工作空间二分 + 唯一入口 + 零运行时件）；载体降位为可替换附属品。

构建成果：`.sddu/.sddu/sddu.md` 内核 + 10 模块指令 + 31 契约 + 索引 + workspace 骨架 + 复制器 + e2e 结构回归；src/scripts/npm 全部退役；29 存量 state.json→state.md。
