# SDDU 合并版 Roadmap

> **元信息**
> - **合并说明**: 本文档整合了 SDDU 版本历史 (v1.1-v1.4) 与未来规划 (v2.4-v2.8)
> - **文档版本**: 2.0.0
> - **更新日期**: 2026-04-12
> - **状态**: 已重构

---

## 第一部分：📚 SDDU 插件版本演进历史 (v1.1-v1.4)

> **来源**: 合并自 `.sdd/ROADMAP.md`  
> **作用**: 历史背景，说明当前版本的来源

### 执行摘要

**✅ 已完成**: SDD → SDDU 升级 (100% 完成)
- `opencode-sdd-plugin` → `opencode-sddu-plugin`
- `@sdd-*` 旧版命令完全向后兼容
- `@sddu-*` 新版命令上线启用
- 插件名称、包名、品牌标识全面升级
- 新增 Discovery 阶段功能 (Stage 0)
- 引入 specs-tree- 规范化目录结构

### v1.1-v1.4 版本总览

| 版本 | 主题 | 发布时间 | 状态 | 核心功能 |
|------|------|----------|------|----------|
| **v1.4.0** | SDD → SDDU 品牌升级 | 2026-04-20 | ✅ 完成 | 插件改名 + 双版本命令并存 |
| **v1.3.0** | 品牌升级规划 | 2026-04-13 | ✅ 合并 | 已整合至 v1.4.0 |
| **v1.2.0** | Phase 2: 能力增强 | 2026-04-30 | 🔄 开发中 | Skills + TUI + MCP + Structured Output |
| **v1.1.1** | Phase 1+ | 2026-03-30 | ✅ 已完成 | 16 个 Agent (6 阶段×2 + 4 特殊) |

### 已完成功能列表

**v1.4.0 完成交付**:
- ✅ F-301: 插件名称升级 (`opencode-sdd-plugin` → `opencode-sddu-plugin`)
- ✅ F-320: 双版本 Agent 系统 (@sdd-* 与 @sddu-* 并存)
- ✅ F-303: 文档和配置系统升级

**Phase 1+ 完成 Feature**:
- ✅ specs-tree-sdd-discovery-feature
- ✅ specs-tree-directory-optimization
- ✅ sdd-multi-module
- ✅ specs-tree-sdd-tools-optimization
- ✅ deprecate-sdd-tools
- ✅ specs-tree-sdd-workflow-state-optimization
- ✅ specs-tree-sdd-plugin-roadmap
- ✅ specs-tree-sdd-plugin-baseline
- ✅ specs-tree-plugin-rename-sddu

### 品牌升级历史

**SDDU**: **S**pecification-**D**riven **D**evelopment **U**ltimate

| 阶段 | 日期 | 里程碑 |
|------|------|--------|
| 启动 | 2026-04-07 | SDDU 品牌升级启动 |
| 重命名 | 2026-04-10 | 插件名称变更完成 |
| 双版本 | 2026-04-15 | 双版本指令上线 |
| 发布 | 2026-04-20 | v1.4.0 正式发布 |

### 新旧命令对照表

| SDD 旧版命令 | SDDU 新版命令 | 兼容性 |
|---------------|---------------|--------|
| `@sdd` | `@sddu` | ✅ 双版本可用 |
| `@sdd-discovery` | `@sddu-discovery` | ✅ 双版本可用 |
| `@sdd-spec` | `@sddu-spec` | ✅ 双版本可用 |
| `@sdd-plan` | `@sddu-plan` | ✅ 双版本可用 |
| `@sdd-tasks` | `@sddu-tasks` | ✅ 双版本可用 |
| `@sdd-build` | `@sddu-build` | ✅ 双版本可用 |
| `@sdd-review` | `@sddu-review` | ✅ 双版本可用 |
| `@sdd-validate` | `@sddu-validate` | ✅ 双版本可用 |

### 当前版本状态

| 项目 | 值 |
|------|-----|
| **当前版本** | v1.1.0 |
| **当前分支** | `feature/merge-sdd-to-sddu` |
| **分支状态** | 已推送到 `origin/feature/merge-sdd-to-sddu` |

---

## 第二部分：🎯 多 Feature 树形结构优化 Roadmap (v2.4-v2.8)

> **文档版本**: 1.0.0  
> **创建日期**: 2026-04-11  
> **状态**: 规划中

### 愿景陈述

SDDU 当前多 Feature 支持存在架构缺陷：specs-tree-root 缺少顶层规划文档、Feature 采用水平拆分而非树形结构、状态管理分散、文件命名不统一、Build 阶段文档缺失。本 Roadmap 旨在通过 5 个阶段的系统性优化，建立完整的树形 Feature 管理体系。

### 版本总览表

| 版本 | 主题 | 发布时间 | 状态 | 核心功能 |
|------|------|----------|------|----------|
| v2.4.0 | 顶层规划规范化 | 2026-04-18 | 📋 规划中 | specs-tree-root 完整 SDDU 流程 |
| v2.5.0 | 树形 Feature 结构 | 2026-04-25 | 📋 规划中 | sub-features 嵌套、依赖管理 |
| v2.6.0 | 状态管理优化 | 2026-05-02 | 📋 规划中 | 状态汇聚、版本管理 |
| v2.7.0 | 文件命名标准化 | 2026-05-09 | 📋 规划中 | 统一命名、迁移脚本 |
| v2.8.0 | Build 阶段完善 | 2026-05-16 | 📋 规划中 | Build 文档模板、Agent 更新 |

### 功能优先级 (RICE 评分)

| 排名 | 功能 | 版本 | RICE Score | 说明 |
|------|------|------|------------|------|
| 🥇 | 顶层规划规范化 | v2.4.0 | 96 | 基础设施，影响所有后续开发 |
| 🥈 | 状态汇聚机制 | v2.6.0 | 84 | 核心功能，提升状态管理效率 |
| 🥉 | 树形结构设计 | v2.5.0 | 72 | 架构改进，支持复杂 Feature |
| 4 | 文件命名统一 | v2.7.0 | 60 | 提升可维护性 |
| 5 | Build 阶段文档 | v2.8.0 | 48 | 完善工作流闭环 |

### 关键 Milestones

| 日期 | Milestone | 版本 | 验收标准 |
|------|-----------|------|----------|
| 2026-04-18 | v2.4.0 发布 | v2.4.0 | specs-tree-root 完整 SDDU 流程 |
| 2026-04-25 | v2.5.0 发布 | v2.5.0 | 树形结构支持、依赖管理 |
| 2026-05-02 | v2.6.0 发布 | v2.6.0 | 状态自动汇聚 |
| 2026-05-09 | v2.7.0 发布 | v2.7.0 | 命名规范统一 |
| 2026-05-16 | v2.8.0 发布 | v2.8.0 | Build 阶段完整 |

### 背景与问题分析

#### 当前问题清单

| 问题 ID | 问题描述 | 影响范围 | 严重性 |
|---------|----------|----------|--------|
| P-001 | specs-tree-root 缺少 spec.md/plan.md/tasks.md | 顶层规划缺失 | 🔴 P0 |
| P-002 | Feature 水平拆分，非树形结构 | 无法表达复杂业务模块 | 🔴 P0 |
| P-003 | 状态管理分散，无父子汇聚 | 状态同步困难 | 🔴 P0 |
| P-004 | 文件命名不统一 | 可维护性差 | 🟡 P1 |
| P-005 | 缺少 Build 阶段文档 | 工作流不完整 | 🟡 P1 |

### 各版本详细规划

#### v2.4.0 - 顶层规划规范化 (阶段 1)

**发布时间**: 2026-04-18

**关键交付物**:
- specs-tree-root/1-spec.md - 顶层规范文档
- specs-tree-root/2-plan.md - 技术架构规划
- specs-tree-root/3-tasks.md - 任务分解文档
- specs-tree-root/state.json - 全局状态文件
- docs/module-guidelines.md - 业务模块划分原则

**任务分解**:
- TASK-1.0: 创建顶层规范 (1-spec.md)
- TASK-1.1: 创建技术规划 (2-plan.md)
- TASK-1.2: 创建任务分解 (3-tasks.md)
- TASK-1.3: 创建业务模块划分原则

#### v2.5.0 - 树形 Feature 结构 (阶段 2)

**发布时间**: 2026-04-25

**关键交付物**:
- src/utils/subfeature-manager.ts (增强) - 支持嵌套子 Feature
- docs/tree-structure-guide.md - 树形结构指南
- docs/migration-guide.md - 迁移指南
- templates/tree-structure-example/ - 示例项目

**目录结构设计**:
```
specs-tree-root/
└── specs-tree-online-bookstore/
    ├── state.json
    └── sub-features/
        ├── specs-tree-user-module/
        │   ├── state.json
        │   └── sub-features/
        │       ├── specs-tree-login/
        │       └── specs-tree-profile/
        └── specs-tree-commerce-module/
            └── sub-features/
                ├── specs-tree-cart/
                └── specs-tree-order/
```

#### v2.6.0 - 状态管理优化 (阶段 3)

**发布时间**: 2026-05-02

**关键交付物**:
- src/state/machine.ts (增强) - 状态汇聚逻辑
- src/state/multi-feature-manager.ts (增强) - 树形状态管理
- src/state/schema-v2.1.0.ts - 新状态 schema
- src/state/auto-aggregator.ts - 状态自动汇聚器

**状态汇聚规则**:
```
父 Feature 状态 = 最慢子 Feature 的状态

状态优先级 (从慢到快):
specified < planned < tasked < building < reviewed < validated
```

#### v2.7.0 - 文件命名标准化 (阶段 4)

**发布时间**: 2026-05-09

**命名规范**:
| 阶段 | 旧命名 | 新命名 |
|------|--------|--------|
| 0 | discovery.md | 0-discovery.md |
| 1 | spec.md | 1-spec.md |
| 2 | plan.md | 2-plan.md |
| 3 | tasks.md | 3-tasks.md |
| 4 | build.md | 4-build.md |
| 5 | review.md | 5-review.md |
| 6 | validation.md | 6-validate.md |

**关键交付物**:
- scripts/migrate-naming.sh - Bash 迁移脚本
- scripts/migrate-naming.ps1 - PowerShell 迁移脚本
- docs/naming-convention.md - 命名规范文档

#### v2.8.0 - Build 阶段完善 (阶段 5)

**发布时间**: 2026-05-16

**关键交付物**:
- templates/build/4-build.md.hbs - Build 文档模板
- templates/build/4-build-summary.md.hbs - Build 总结模板
- src/templates/agents/sddu-build.md.hbs (增强)
- docs/build-workflow.md - Build 工作流指南

### 依赖关系分析

```
v2.4.0 (顶层规划)
    ↓
v2.5.0 (树形结构)
    ↓
v2.6.0 (状态汇聚)
    ↓
v2.7.0 (命名标准化)    v2.8.0 (Build 文档)
       ↑                    ↑
       └────── 可并行 ──────┘
```

### 资源需求

| 角色 | 人数 | 时间投入 | 技能要求 |
|------|------|----------|----------|
| 架构师 | 1 | 20% | SDDU 架构、状态机设计 |
| 开发工程师 | 2 | 80% | TypeScript、Node.js |
| 文档工程师 | 1 | 30% | 技术文档编写 |
| 测试工程师 | 1 | 20% | 单元测试、集成测试 |

**总人力投入**: 40 人天

### 风险评估

| 风险 ID | 风险描述 | 可能性 | 影响 | 缓解措施 |
|---------|----------|--------|------|----------|
| R-001 | 状态汇聚算法复杂度高 | 中 | 高 | 提前原型验证，分阶段实现 |
| R-002 | 树形结构导致性能下降 | 低 | 中 | 增加缓存，限制树深度 |
| R-003 | 迁移脚本导致数据丢失 | 中 | 高 | 充分测试，提供备份机制 |
| R-004 | 范围蔓延导致延期 | 中 | 中 | 严格控制 Non-Goals |

---

## 第三部分：📋 本周优先事项

### 本周优先事项 (2026-04-11 ~ 2026-04-18)

- [ ] 创建 specs-tree-root/1-spec.md（顶层规范）
- [ ] 创建 specs-tree-root/2-plan.md（技术架构设计）
- [ ] 创建 specs-tree-root/3-tasks.md（任务分解）
- [ ] 定义业务模块划分原则文档
- [ ] 评审并确认树形结构设计方案

### v2.4.0 阶段 1 任务清单

| 任务 ID | 任务名称 | 负责人 | 截止时间 | 状态 |
|---------|----------|--------|----------|------|
| TASK-1.0 | 创建顶层规范 | TBD | 2026-04-13 | 📋 待开始 |
| TASK-1.1 | 创建技术规划 | TBD | 2026-04-15 | 📋 待开始 |
| TASK-1.2 | 创建任务分解 | TBD | 2026-04-16 | 📋 待开始 |
| TASK-1.3 | 模块划分原则 | TBD | 2026-04-17 | 📋 待开始 |
| M-1.0 | 团队评审会议 | 全体 | 2026-04-17 | 📋 待开始 |

### 下一步行动

1. **立即执行**: 创建 specs-tree-root/1-spec.md
2. **近期计划**: 启动 v2.5.0 设计工作
3. **中期计划**: 开始迁移指南编写

---

## 附录：相关文档索引

- 📁 **项目状态**: [PROJECT-STATUS.md](./PROJECT-STATUS.md)
- 📝 **规范目录**: [specs-tree-root/README.md](./specs-tree-root/README.md)
- 🧪 **测试说明**: [tests/README.md](tests/README.md)
- 📖 **工作流指南**: [docs/guide.md](./docs/guide.md)

---

> **文档维护**: 本 Roadmap 是动态文档，建议每季度回顾和更新一次。
