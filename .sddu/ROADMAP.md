# SDDU 合并版 Roadmap

> **文档版本**: 4.0.0  
> **更新日期**: 2026-06-13  
> **状态**: 活跃维护中  
> **项目版本**: v1.4.1

本文档整合了 SDDU 完整版本历史 (v1.1-v1.4) 与 Feature 规划 (v2.4-v3.x)，体现**分而治之**的核心理念。

---

## 执行摘要

### 项目状态速览

| 项目 | 值 |
|------|-----|
| **当前项目版本** | v1.4.1 |
| **当前活跃 Feature** | FR-E2E-CLEANUP-001 (E2E 脚本清理和统一规范) |
| **已完成 Features** | 15 个 (全部 validated/completed) |
| **已终止 Features** | 1 个 (ETD-001, 已迁移至独立仓库) |
| **待处理已知问题** | 6 个 (来自 sddu-status-enhancement 验证报告 A-F) |

### 版本总览表

| 版本 | 主题 | 发布时间 | 状态 | 核心交付 |
|------|------|----------|------|----------|
| **v1.1.1** | Phase 1+ | 2026-03-30 | ✅ 已完成 | 16 个 Agent |
| **v1.3.0** | 品牌升级规划 | 2026-04-13 | ✅ 已完成 | 整合至 v1.4.0 |
| **v1.4.0** | SDD → SDDU 品牌升级 | 2026-04-20 | ✅ 已完成 | 插件改名 + 双版本命令 |
| **v2.4.0** | Feature 拆分与树形结构优化 | 2026-04-13 | ✅ 已完成 | 树形结构 + 目录优化 + v2 修复 |
| **v2.5.0** | Agent 输出模板化系统 | 2026-05-25 | ✅ 已完成 | Handlebars 模板引擎 + 7 模板 |
| **v2.6.0** | SDDU 特性状态增强 | 2026-06-13 | ✅ 已完成 | phase(8) + status(5) 两字段模型 v3.0.0 |
| **v3.0.0** | 质量与工作流改进 | 2026-Q3 | 📋 规划中 | 验证报告 A-F 问题修复 |
| **v3.1.0** | 后续增强 | TBD | 💡 提议中 | Skills / TUI / MCP / 命名标准化 |

### 本周优先事项 (2026-06-13 ~ 2026-06-20)

- [ ] 完成 FR-E2E-CLEANUP-001 (E2E 脚本清理和统一规范)
- [ ] 评审 validation report A-F 问题，确定优先级
- [ ] 启动 v3.0.0 首个 Feature 的需求挖掘

### 功能完成时间线

```
2026-03-30  v1.1.1 ✅  16 Agent 上线
2026-04-07  v1.4.0 ✅  SDDU 品牌升级启动
2026-04-09  —— ✅  plugin-rename-sddu-v2 (代码清理)
2026-04-13  v2.4.0 ✅  树形结构优化
2026-04-15  —— ✅  树形结构优化 v2 (问题修复)
2026-04-20  v1.4.0 ✅  SDDU 正式发布
2026-05-25  v2.5.0 ✅  Agent 输出模板化
2026-06-12  —— ✅  ETD-001 迁出至独立仓库
2026-06-13  v2.6.0 ✅  SDDU 特性状态增强 (今日)
            ↓
2026-Q3    v3.0.0 📋  质量与工作流改进
```

---

## 已完成版本详细记录

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
**当前版本**: v1.4.1

**核心成果**:
- ✅ F-301: 插件名称升级 (`opencode-sdd-plugin` → `opencode-sddu-plugin`)
- ✅ F-320: 双版本 Agent 系统 (@sdd-\* 与 @sddu-\* 并存)
- ✅ F-303: 文档和配置系统升级

**品牌升级历史**:

| 阶段 | 日期 | 里程碑 |
|------|------|--------|
| 启动 | 2026-04-07 | SDDU 品牌升级启动 |
| 重命名 | 2026-04-10 | 插件名称变更完成 |
| 代码清理 | 2026-04-09 | plugin-rename-sddu-v2 validated |
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

### v2.4.0 - ✅ Feature 拆分与树形结构优化

**发布时间**: 2026-04-13  
**状态**: ✅ 已完成  
**优先级**: P0 🥇

**关联 Feature**:
| Feature | 完成日期 | 说明 |
|---------|----------|------|
| specs-tree-tree-structure-optimization | 2026-04-13 | v2.4.0 树形结构优化 (P0) |
| specs-tree-tree-structure-optimization-v2 | 2026-04-15 | 树形结构优化 v2 - 问题修复 |
| specs-tree-directory-optimization | — | 目录结构命名优化 |

**解决问题**:
- P-001: specs-tree-root 缺少顶层规划文档 ✅
- P-002: Feature 水平拆分，非树形结构 ✅
- P-003: 大型 Feature 难以管理，缺少分而治之的拆分机制 ✅

**关键交付**:
- 建立 specs-tree-root 顶层规划体系
- 实现 Feature 拆分能力，支持父子 Feature 分层管理
- 提供分而治之的 Feature 架构设计原则

---

### v2.5.0 - ✅ Agent 输出模板化系统

**发布时间**: 2026-05-25  
**状态**: ✅ 已完成  
**优先级**: P1 🥈

**关联 Feature**:
| Feature | 完成日期 | 说明 |
|---------|----------|------|
| specs-tree-agent-output-templating | 2026-05-25 | Handlebars 模板引擎 + 7 个 Agent 模板 |

**核心交付**:
- Handlebars 模板引擎集成
- 7 个 SDDU Agent 输出模板 (sddu, sddu-discovery, sddu-spec, sddu-plan, sddu-tasks, sddu-build, sddu-review)
- FR 覆盖率 100% (13/13), NFR 覆盖率 100% (6/6)

**延后至 v3.1.0**:
- Skills 系统
- TUI 界面
- MCP 集成

---

### v2.6.0 - ✅ SDDU 特性状态增强

**发布时间**: 2026-06-13  
**状态**: ✅ 已完成  
**优先级**: P1 🥈

**关联 Feature**:
| Feature | 完成日期 | 说明 |
|---------|----------|------|
| specs-tree-sddu-status-enhancement | 2026-06-13 | phase(8) + status(5) 两字段隔离重构 |

**核心交付**:
- Schema v3.0.0: `phase` (8 阶段: registered→discovered→specified→planned→tasked→builded→reviewed→validated) + `status` (5 状态: tracked/completed/suspended/terminated/merged)
- `@sddu 标记` 命令 (结构化 + 自然语言)
- `@sddu 状态` 6 区分类仪表盘
- Phase 单向推进 (拒回退/跳跃)
- 子随父归算法 (非 tracked 祖先归入父节点)
- R5 一致性检测 (7 项检测 + 版本比较)
- 长期停滞检测 + Suspended 到期提醒 + Merged 跳转追溯

**测试指标**:
- FR 覆盖率: 100% (15/15)
- NFR 覆盖率: 100% (6/6)
- EC 覆盖率: 100% (12/12)
- 核心 v3.0.0 测试: 122/122 全部通过
- E2E 全流程验证: ✅ 通过 (bookstore 测试项目完成 8 阶段)

---

## 🚫 已终止 Feature

### ETD-001 (Expert Tree Design)

**终止日期**: 2026-06-12  
**状态**: terminated-and-migrated  
**目标**: 迁移至 ETD 独立项目仓库

**子 Feature (随父终止/迁出)**:
- ETD-FR-REGISTRY-001 (Expert Node Registry) — drafting
- ETD-FR-DISPATCHER-001 (Task Dispatcher) — drafting
- ETD-FR-WORKBENCH-001 (Expert Workbench) — drafting

**说明**: SDDU 与 ETD 为两个独立项目，互不依赖。ETD 后续开发在独立仓库进行。

---

## 📋 规划中版本

### v3.0.0 - 📋 质量与工作流改进

**预计时间**: 2026-Q3  
**状态**: 📋 规划中  
**优先级**: P1 🥈

**背景**: sddu-status-enhancement 的 E2E 全流程验证 (2026-06-13) 暴露了 6 个非本 Feature 范畴的问题，需作为后续 Feature 独立规划。

#### 待处理问题清单 (来自验证报告 A-F)

| ID | 问题 | 影响组件 | 严重度 |
|----|------|----------|:------:|
| **A** | **sddu-build wave 间衔接断裂** — build agent 被调用 4 次（每个 wave 一次），每次返回后由 sddu 协调器重新调用。理想情况应一次 `sddu-build` 完成全部 wave | `sddu-build` agent | 🔴 高 |
| **B** | **auto-updater 可能提前设 phase** — Wave 1 完成时磁盘上 state.json 已出现 `phase: "builded"`，会话中全部完成后才显式更新。`inferCurrentPhaseFromFiles()` 中 `reviewed` 在 `builded` 前检查 | `auto-updater.ts` | 🟡 中 |
| **C** | **validate agent 不做真正 E2E 测试** — 当前 validate 只做静态合规检查（文件存在、spec 覆盖率），不执行端到端行为验证。E2E 应属于 validated 阶段的核心职责 | `sddu-validate` agent | 🔴 高 |
| **D** | **sddu coordinator 尝试调用 bash 工具失败** — opencode 环境中 `bash` 工具可能不可用，`invalid [tool=bash]` 错误（已自愈） | `sddu` coordinator | 🟢 低 |
| **E** | **SDDU 缺少框架级系统验证层** — 框架 Feature（如本 Feature）需要验证"SDDU 本身还能正常工作"，当前无标准化流程 | SDDU 框架设计 | 🟡 中 |
| **F** | **实施阶段中 build 经历了设计规划，review/validate 没有** — build 阶段产出物厚度高、质量可控，与其经过设计规划直接相关。同为实施阶段的 review 和 validate 未经历设计规划过程 | SDDU 工作流设计 | 🟡 中 |

**建议 Feature 拆分**:

| 提议 Feature | 覆盖问题 | 优先级 | 预计工作量 |
|-------------|----------|:------:|------------|
| FR-QUALITY-001: Build Agent Wave 一体化 | A | P0 🥇 | 3-5 天 |
| FR-QUALITY-002: Validate Agent E2E 能力增强 | C | P0 🥇 | 5-7 天 |
| FR-QUALITY-003: Review/Validate 阶段设计规划 | F | P1 🥈 | 3-5 天 |
| FR-QUALITY-004: 框架级自验证流程 | E | P1 🥈 | 5-7 天 |
| FR-QUALITY-005: Auto-updater Phase 推断修复 | B | P2 | 1-2 天 |
| FR-QUALITY-006: Coordinator 工具兼容性 | D | P2 | 1-2 天 |

**依赖关系**:
```
FR-QUALITY-001 (Build Wave 一体化) ──→ FR-QUALITY-003 (Review/Validate 设计规划)
FR-QUALITY-002 (Validate E2E) ──→ FR-QUALITY-004 (框架自验证)
FR-QUALITY-005 (auto-updater) — 可独立进行
FR-QUALITY-006 (coordinator) — 可独立进行
```

---

### v3.1.0 - 💡 后续增强提议

**预计时间**: TBD  
**状态**: 💡 提议中  
**优先级**: P2

**候选 Feature**:

| Feature | 说明 | 来源 |
|---------|------|------|
| Skills 系统 | Agent Skills 集成 | v2.5.0 遗留 |
| TUI 界面 | 终端用户界面 | v2.5.0 遗留 |
| MCP 集成 | Model Context Protocol | v2.5.0 遗留 |
| 文件命名标准化 | 统一 phase 阶段文件名 (0-discovery.md, 1-spec.md...) | v2.7.0 遗留 |
| Build 阶段文档完善 | 4-build.md 模板 | v2.8.0 遗留 |
| FeatureStateEnum 清理 | 移除 deprecated 类型别名，完成方案 B 迁移 | status-enhancement 遗留 |
| 仪表盘渲染 TypeScript 化 | 分类/排序/过滤逻辑从模板迁入独立模块 | status-enhancement 建议 |

---

## 🔗 依赖关系图谱

```
v1.1.1 (16 Agent) ───────────────────────────────────────────────────────── ✅
    │
v1.4.0 (SDDU 品牌升级) ───────────────────────────────────────────────────── ✅
    │
    ├── v2.4.0 (树形结构优化) ────────────────────────────────────────────── ✅
    │       └── v2.4.1 (树形结构 v2 修复) ────────────────────────────────── ✅
    │
    ├── v2.5.0 (Agent 输出模板化) ────────────────────────────────────────── ✅
    │       └── Skills/TUI/MCP (延后至 v3.1.0)
    │
    └── v2.6.0 (SDDU 特性状态增强 v3.0.0) ───────────────────────────────── ✅
            │
            └── v3.0.0 (质量与工作流改进) ────────────────────────────────── 📋
                    ├── FR-QUALITY-001 (Build Wave 一体化)
                    ├── FR-QUALITY-002 (Validate E2E)
                    ├── FR-QUALITY-003 (Review/Validate 设计规划)
                    ├── FR-QUALITY-004 (框架自验证)
                    ├── FR-QUALITY-005 (auto-updater 修复)
                    └── FR-QUALITY-006 (coordinator 兼容)
                            │
                            └── v3.1.0 (后续增强) ────────────────────────── 💡
```

---

## ⚠️ 风险评估

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|:----:|----------|
| v3.0.0 问题过多导致范围蔓延 | 高 | 中 | 严格按优先级排序；A/C 先做，B/D 可快速修复 |
| Build Wave 一体化改动大 | 中 | 中 | 提前原型验证 build agent 的 multi-wave 能力 |
| Validate E2E 能力设计复杂度高 | 中 | 中 | 分两步：先做最小可行 E2E runner，再做完整框架 |
| Skills/TUI/MCP 持续延后 | 低 | 高 | 已有明确记录在 v3.1.0，不影响当前工作流 |
| E2E 脚本清理 Feature 仍在进行 | 低 | 低 | 当前活跃 Feature，预计近期完成 |

---

## 📋 下一步行动

### 立即行动 (本周)
1. [ ] 完成 FR-E2E-CLEANUP-001 (E2E 脚本清理和统一规范)
2. [ ] 评审 A-F 问题，确定 v3.0.0 首个 Feature 的 scope
3. [ ] 为 v3.0.0 首个 Feature 启动 `@sddu-discovery`

### 短期行动 (2 周内)
4. [ ] 启动 FR-QUALITY-001 (Build Agent Wave 一体化) 或 FR-QUALITY-002 (Validate E2E)
5. [ ] 快速修复 FR-QUALITY-005 (auto-updater) 和 FR-QUALITY-006 (coordinator)

### 中期行动 (1 个月内)
6. [ ] 完成 v3.0.0 全部 P0/P1 Feature
7. [ ] 评估 v3.1.0 Feature 优先级，确认是否启动 Skills/TUI/MCP

---

## 📁 相关文档

- 📁 **项目状态**: [state.json](./specs-tree-root/state.json)
- 📝 **规范目录**: [specs-tree-root/README.md](./specs-tree-root/README.md)
- 📋 **状态增强验证报告**: [specs-tree-sddu-status-enhancement/validation-report.md](./specs-tree-root/specs-tree-sddu-status-enhancement/validation-report.md)
- 🏗️ **架构决策**: [architecture/adr/](./specs-tree-root/architecture/adr/)

---

> **文档维护**: 本 Roadmap 是动态文档。建议每季度回顾和更新一次，或每当一个 Feature 完成 validated 阶段时更新状态。
