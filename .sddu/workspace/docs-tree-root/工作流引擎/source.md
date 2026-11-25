# 数据源清单

本文档由以下 Feature 过程产物聚合生成。

---

## Feature 数据源

| # | Feature 目录 | 聚合文件 |
|---|-------------|---------|
| 1 | specs-tree-sdd-discovery-feature | spec.md · plan.md · state.json |
| 2 | specs-tree-sdd-multi-module | spec.md · plan.md · state.json |
| 3 | specs-tree-sdd-workflow-state-optimization | spec.md · plan.md · state.json |
| 4 | specs-tree-sddu-status-enhancement | spec.md · plan.md · state.json |

### 源文件路径（相对 .sddu/）

```
specs-tree-root/
├── specs-tree-sdd-discovery-feature/
│   ├── spec.md
│   ├── plan.md
│   └── state.json
├── specs-tree-sdd-multi-module/
│   ├── spec.md
│   ├── plan.md
│   └── state.json
├── specs-tree-sdd-workflow-state-optimization/
│   ├── spec.md
│   ├── plan.md
│   └── state.json
└── specs-tree-sddu-status-enhancement/
    ├── spec.md
    ├── plan.md
    └── state.json
```

### 各 Feature 简要说明

| Feature | 角色 | 关键贡献 |
|---------|------|---------|
| discovery-feature | Stage 0 基石 | 定义 7 步 Discovery 流程，将需求挖掘纳入规范管道 |
| multi-module | 并行架构 | 引入子 Feature + Task Group 机制，支撑大规模 Feature 拆分 |
| state-optimization | 状态机规范 | 统一状态转移规则，引入自动扫描和依赖检查 |
| status-enhancement | v3.0 核心 | 设计 Phase + Status 双字段隔离模型，终结状态耦合 |

---

## 辅助数据源

| 路径 | 说明 |
|------|------|
| specs-tree-root/state.json | 全局状态聚合（所有 Feature 的最新 phase/status） |
| specs-tree-root/TREE.md | 完整 Feature 目录树 |
| architecture/adr/ADR-*.md | 架构决策记录（共 17 份） |

---

*聚合时间：2026-07-05 · 聚合 Agent：sddu-docs*
