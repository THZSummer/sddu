# SDDU 合并版 Roadmap

> **文档版本**: 3.1.0 (统一版本表)  
> **更新日期**: 2026-04-12  
> **状态**: 已优化

本文档整合了 SDDU 完整版本历史 (v1.1-v1.4) 与未来多 Feature 树形结构优化规划 (v2.4-v2.8)。

---

## 📊 全版本规划总览

### 版本总览表

| 版本 | 主题 | 发布时间 | 状态 | 优先级 | 关键交付物 | 详细规划 |
|------|------|----------|------|--------|------------|----------|
| **v1.1.1** | Phase 1+ | 2026-03-30 | ✅ 已完成 | P1 🥈 | 16 个 Agent | [↓ 展开 ↓](#v111------phase-1) |
| **v1.3.0** | 品牌升级规划 | 2026-04-13 | ✅ 已完成 | P0 🥇 | 已整合至 v1.4.0 | [↓ 展开 ↓](#v130------品牌升级规划) |
| **v1.4.0** | SDD → SDDU 品牌升级 | 2026-04-20 | ✅ 已完成 | P0 🥇 | 插件改名 + 双版本命令 | [↓ 展开 ↓](#v140------sdd--sddu-品牌升级) |
| **v2.4.0** | 顶层规划规范化 | 2026-04-18 | 📋 规划中 | P0 🥇 | 1-spec.md, 2-plan.md, 3-tasks.md | [↓ 展开 ↓](#v240------顶层规划规范化) |
| **v2.5.0** | 树形 Feature 结构 | 2026-04-25 | 📋 规划中 | P1 🥉 | subfeature-manager, tree-guide | [↓ 展开 ↓](#v250------树形-feature-结构) |
| **v2.6.0** | 状态管理优化 | 2026-05-02 | 📋 规划中 | P0 🥈 | auto-aggregator, schema-v2.1.0 | [↓ 展开 ↓](#v260------状态管理优化) |
| **v2.7.0** | 文件命名标准化 | 2026-05-09 | 📋 规划中 | P2 | migrate-naming.sh | [↓ 展开 ↓](#v270------文件命名标准化) |
| **v2.8.0** | Build 阶段完善 | 2026-05-16 | 📋 规划中 | P2 | 4-build.md.hbs | [↓ 展开 ↓](#v280------build-阶段完善) |
| **v1.2.0** | Phase 2: 能力增强 | 2026-04-30 | 🔄 开发中 | P1 🥈 | Skills + TUI + MCP | [↓ 展开 ↓](#v120------phase-2-能力增强) |

### 状态图例

| 状态标识 | 含义 |
|----------|------|
| ✅ 已完成 | 版本已发布并交付 |
| 🔄 开发中 | 版本正在开发迭代 |
| 📋 规划中 | 版本已规划待启动 |

### 优先级图例

| 优先级 | 标识 | 说明 |
|--------|------|------|
| P0 🥇 | 最高优先级 | 必须优先完成 |
| P1 🥈 | 高优先级 | 重要功能 |
| P1 🥉 | 中高优先级 | 次重要功能 |
| P2 | 中优先级 | 可延后功能 |

---

### v1.1.1 - ✅ Phase 1+

**发布时间**: 2026-03-30  
**状态**: ✅ 已完成

**核心成果**: 16 个 Agent (6 阶段×2 + 4 特殊)

**已完成 Feature**:
- ✅ specs-tree-sdd-discovery-feature
- ✅ specs-tree-directory-optimization
- ✅ sdd-multi-module
- ✅ specs-tree-sdd-tools-optimization
- ✅ deprecate-sdd-tools
- ✅ specs-tree-sdd-workflow-state-optimization
- ✅ specs-tree-sdd-plugin-roadmap
- ✅ specs-tree-sdd-plugin-baseline
- ✅ specs-tree-plugin-rename-sddu

---

### v1.3.0 - ✅ 品牌升级规划

**发布时间**: 2026-04-13  
**状态**: ✅ 已完成 (已整合至 v1.4.0)

**说明**: 本版本规划内容已完全整合至 v1.4.0，不单独发布。

---

### v1.4.0 - ✅ SDD → SDDU 品牌升级

**发布时间**: 2026-04-20  
**状态**: ✅ 已完成

**核心成果**:
- ✅ F-301: 插件名称升级 (`opencode-sdd-plugin` → `opencode-sddu-plugin`)
- ✅ F-320: 双版本 Agent 系统 (@sdd-* 与 @sddu-* 并存)
- ✅ F-303: 文档和配置系统升级

**品牌升级历史**:

| 阶段 | 日期 | 里程碑 |
|------|------|--------|
| 启动 | 2026-04-07 | SDDU 品牌升级启动 |
| 重命名 | 2026-04-10 | 插件名称变更完成 |
| 双版本 | 2026-04-15 | 双版本指令上线 |
| 发布 | 2026-04-20 | v1.4.0 正式发布 |

**新旧命令对照**:

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

---

### v2.4.0 - 📋 顶层规划规范化

**预计发布**: 2026-04-18  
**状态**: 📋 规划中  
**优先级**: P0 🥇

**解决问题**: P-001 specs-tree-root 缺少顶层规划文档  
**依赖关系**: 无（起点版本）  
**资源需求**: 架构师 20% + 开发 40%  
**风险评估**: 范围蔓延 → 严格控制 Non-Goals

**关键交付物**:
- `specs-tree-root/1-spec.md` - 顶层规范
- `specs-tree-root/2-plan.md` - 技术规划
- `specs-tree-root/3-tasks.md` - 任务分解
- `specs-tree-root/state.json` - 全局状态文件
- `docs/module-guidelines.md` - 业务模块划分原则

**任务分解**:
- TASK-1.0: 创建顶层规范 (1-spec.md)
- TASK-1.1: 创建技术规划 (2-plan.md)
- TASK-1.2: 创建任务分解 (3-tasks.md)
- TASK-1.3: 创建业务模块划分原则

---

### v2.5.0 - 📋 树形 Feature 结构

**预计发布**: 2026-04-25  
**状态**: 📋 规划中  
**优先级**: P1 🥉

**解决问题**: P-002 Feature 水平拆分，非树形结构  
**依赖关系**: ← v2.4.0  
**资源需求**: 架构师 20% + 开发 80%  
**风险评估**: 树形结构导致性能下降 → 增加缓存，限制树深度≤5 层

**关键交付物**:
- `src/utils/subfeature-manager.ts` (增强) - 支持嵌套子 Feature
- `docs/tree-structure-guide.md` - 树形结构指南
- `docs/migration-guide.md` - 迁移指南
- `templates/tree-structure-example/` - 示例项目

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

---

### v2.6.0 - 📋 状态管理优化

**预计发布**: 2026-05-02  
**状态**: 📋 规划中  
**优先级**: P0 🥈

**解决问题**: P-003 状态管理分散，无父子汇聚  
**依赖关系**: ← v2.5.0  
**资源需求**: 架构师 20% + 开发 80% + 测试 20%  
**风险评估**: 状态汇聚算法复杂度高 → 提前原型验证，分阶段实现

**关键交付物**:
- `src/state/machine.ts` (增强) - 状态汇聚逻辑
- `src/state/multi-feature-manager.ts` (增强) - 树形状态管理
- `src/state/schema-v2.1.0.ts` - 新状态 schema
- `src/state/auto-aggregator.ts` - 状态自动汇聚器

**状态汇聚规则**:
```
父 Feature 状态 = 最慢子 Feature 的状态

状态优先级 (从慢到快):
specified < planned < tasked < building < reviewed < validated
```

---

### v2.7.0 - 📋 文件命名标准化

**预计发布**: 2026-05-09  
**状态**: 📋 规划中  
**优先级**: P2

**解决问题**: P-004 文件命名不统一  
**依赖关系**: ← v2.6.0（可与 v2.8.0 并行）  
**资源需求**: 开发 40% + 文档 30%  
**风险评估**: 迁移脚本导致数据丢失 → 充分测试，提供备份机制

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
- `scripts/migrate-naming.sh` - Bash 迁移脚本
- `scripts/migrate-naming.ps1` - PowerShell 迁移脚本
- `docs/naming-convention.md` - 命名规范文档

---

### v2.8.0 - 📋 Build 阶段完善

**预计发布**: 2026-05-16  
**状态**: 📋 规划中  
**优先级**: P2

**解决问题**: P-005 缺少 Build 阶段文档  
**依赖关系**: ← v2.6.0（可与 v2.7.0 并行）  
**资源需求**: 开发 40% + 文档 30%  
**风险评估**: 范围蔓延导致延期 → 严格控制 Non-Goals

**关键交付物**:
- `templates/build/4-build.md.hbs` - Build 文档模板
- `templates/build/4-build-summary.md.hbs` - Build 总结模板
- `src/templates/agents/sddu-build.md.hbs` (增强)
- `docs/build-workflow.md` - Build 工作流指南

---

### v1.2.0 - 🔄 Phase 2: 能力增强

**发布时间**: 2026-04-30  
**状态**: 🔄 开发中

**关键功能**:
- Skills 系统
- TUI 界面
- MCP 集成
- Structured Output

---

## 🔗 依赖关系图谱

```
v2.4.0 (顶层规划)
    ↓
v2.5.0 (树形结构)
    ↓
v2.6.0 (状态汇聚)
    ↓
    ├────→ v2.7.0 (命名标准化)
    └────→ v2.8.0 (Build 文档)
```

**总人力投入**: 40 人天

| 角色 | 人数 | 时间投入 | 技能要求 |
|------|------|----------|----------|
| 架构师 | 1 | 20% | SDDU 架构、状态机设计 |
| 开发工程师 | 2 | 80% | TypeScript、Node.js |
| 文档工程师 | 1 | 30% | 技术文档编写 |
| 测试工程师 | 1 | 20% | 单元测试、集成测试 |

---

## 📋 本周优先事项 (2026-04-11 ~ 2026-04-18)

- [ ] 创建 specs-tree-root/1-spec.md（顶层规范）
- [ ] 创建 specs-tree-root/2-plan.md（技术架构设计）
- [ ] 创建 specs-tree-root/3-tasks.md（任务分解）
- [ ] 定义业务模块划分原则文档
- [ ] 评审并确认树形结构设计方案

### v2.4.0 任务清单

| 任务 ID | 任务名称 | 负责人 | 截止时间 | 状态 |
|---------|----------|--------|----------|------|
| TASK-1.0 | 创建顶层规范 | TBD | 2026-04-13 | 📋 待开始 |
| TASK-1.1 | 创建技术规划 | TBD | 2026-04-15 | 📋 待开始 |
| TASK-1.2 | 创建任务分解 | TBD | 2026-04-16 | 📋 待开始 |
| TASK-1.3 | 模块划分原则 | TBD | 2026-04-17 | 📋 待开始 |
| M-1.0 | 团队评审会议 | 全体 | 2026-04-17 | 📋 待开始 |

---

## 📁 相关文档

- 📁 **项目状态**: [PROJECT-STATUS.md](./PROJECT-STATUS.md)
- 📝 **规范目录**: [specs-tree-root/README.md](./specs-tree-root/README.md)
- 🧪 **测试说明**: [tests/README.md](tests/README.md)
- 📖 **工作流指南**: [docs/guide.md](./docs/guide.md)

---

## 📌 当前版本状态

| 项目 | 值 |
|------|-----|
| **当前版本** | v1.1.0 |
| **当前分支** | `feature/merge-sdd-to-sddu` |
| **分支状态** | 已推送到 `origin/feature/merge-sdd-to-sddu` |

---

> **文档维护**: 本 Roadmap 是动态文档，建议每季度回顾和更新一次。
