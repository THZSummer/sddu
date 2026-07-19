# SDDU 项目版本 Roadmap

> **文档版本**: 16.0.0
> **更新日期**: 2026-07-19 (FR-TREE-SKILL 新增 — @sddu-tree Agent 技能化评估)
> **状态**: 规划中 (v3.0.0 待启动，v3.3.0 部分提前交付)
> **生成方式**: `@sddu-roadmap` 全量扫描 19 Feature 的 state.json + spec.md + tasks.md + spec.json + validation-report.md + docs/ + TREE.md + 用户新需求评估 + Superpowers 竞品调研导入
> **当前项目版本**: v4.0.0
> **全局状态**: 18 validated, 0 tracked, 1 terminated | 待处理项目: 45 | 新提案: 2 (FR-BUG-001/FR-TREE-SKILL) | Skill 化候选: 3 (FR-BUG-001/FR-WORKTREE-001/FR-TREE-SKILL → Skill 重评估) | 竞品借鉴: 3

---

## 执行摘要 (前 20%)

### 愿景陈述

SDDU (Spec-Driven Development Unified) 是一套面向 AI 辅助开发的规范驱动工作流框架。通过 12 个专业化 Agent 协同工作（含快速模式 @sddu-fast），覆盖从问题挖掘 (discovery)、需求定义 (spec)、技术设计 (plan)、任务分解 (tasks)、实施构建 (build)、审查 (review) 到验证 (validate) 的完整开发生命周期。项目自 2026 年 3 月启动，已迭代至 v4.0.0，完成 18 个核心 Feature，当前聚焦 v3.0.0 质量与工作流改进。

项目的长期愿景是成为 AI 辅助软件工程的标准工作流框架 — 让 AI Agent 不仅能写代码，更能通过规范化流程保证交付质量、沉淀项目知识、持续自我演进。v3.0.0 系列将重点解决框架自身的质量闭环问题（Build Wave 一体化、Validate E2E 能力、框架级自验证）。v3.3.0 的 FR-FAST-001（快速模式）和 FR-SKILL-001（Skill 系统）已提前交付，使 SDDU 正式进入「固定引擎 + 可扩展能力」的双层架构时代；Skill 系统的自举闭环（discovery + creator + sync）为后续 Feature 的 Skill 化降级提供了基础设施。v4.0.0 已完成三域分层架构重组，为 SDDU 的跨平台扩展奠定基础。FR-TREE-SKILL（@sddu-tree Agent 技能化）是 Agent→Skill 降级模型的**首个实战验证案例**——将现有辅助 Agent 降级为框架级 Skill，减少 Agent 数量的同时保持甚至提升能力。

### 项目状态速览

| 指标 | 值 |
|------|-----|
| **Feature 总数** | 19 (含 3 个提议中的 Skill 化候选: FR-BUG-001/FR-WORKTREE-001/FR-TREE-SKILL) |
| **已完成 (completed)** | 18 |
| **已终止 (terminated/migrated)** | 1 |
| **进行中 (tracked)** | **0** ⚠️ |
| **搁置 (suspended)** | 0 |
| **已知待解决问题** | **45 (A-F + I 核心 + BUG-001 + TREE-SKILL + 3 竞品借鉴 + 32 审计发现)** |
| **规划中版本** | v3.0.0, v3.1.0, v3.2.0, v3.3.0 (部分提前交付), v4.1.0 (远期) |

### ⚠️ 关键警示

> **当前无活跃 Feature！** 自 2026-06-21 `specs-tree-framework-architecture` (FR-FRAMEWORK-ARCH-001) validated 后，项目处于无进行中 Feature 的空窗期。v3.0.0 的 6 个核心问题 (A-F) 已记录但尚未启动任何 Feature 的 discovery 流程。Issue G (模板质量) 已通过 FR-TPL-001 (v3.0.1) 解决完成。好消息是 FR-FAST-001 (快速模式 Agent) 和 FR-SKILL-001 (Skill 系统) 已提前交付（2026-07-12 / 2026-07-19），为后续 Feature 提供了「Skill 化降级」的新选项。FR-TREE-SKILL（@sddu-tree Agent 技能化）是最纯粹的 Agent→Skill 降级案例——将现有辅助 Agent 的整体职责降级为框架级 Skill。

### 版本总览表

| 版本 | 主题 | 发布时间 | 状态 | 核心功能 |
|------|------|----------|:----:|----------|
| **v1.1.1** | Phase 1+ | 2026-03-30 | ✅ | 16 Agent 上线 |
| **v1.4.0** | SDD → SDDU 品牌升级 | 2026-04-20 | ✅ | 插件改名 + 双版本命令 |
| **v2.4.0** | Feature 拆分与树形结构优化 | 2026-04-13 | ✅ | 树形结构 + 目录优化 + v2 修复 |
| **v2.5.0** | Agent 输出模板化系统 | 2026-05-25 | ✅ | Handlebars 模板引擎 + 7 模板 |
| **v2.6.0** | SDDU 特性状态增强 | 2026-06-13 | ✅ | phase(8) + status(5) v3.0.0 |
| **v3.0.1** | 模板质量统一 | 2026-06-19 | ✅ | 17 模板格式统一 + 11 Agent 职责边界 |
| **v4.0.0** | 源码架构重组 🆕 | 2026-06-21 | ✅ | FR-FRAMEWORK-ARCH-001 三域分层 + 平台适配器隔离 |
| **v3.0.0** | 质量与工作流改进 (A-F) | 2026-Q3 | 📋 规划中 | 6 个问题修复 |
| **v3.1.0** | Skill 化降级验证 | TBD | 💡 提议中 | FR-BUG-001 → sddu-bug Skill 🔄 + FR-WORKTREE-001 → sddu-worktree Skill 🔄 + FR-TREE-SKILL → sddu-tree Skill 🆕 |
| **v3.2.0** | 项目知识基础设施 (H・I) | TBD | 🔄 部分完成 | FR-KB-001 全局配置 (💡 提议中) + FR-KB-002 知识沉淀 (✅ 已完成 — @sddu-docs) |
| **v3.3.0** | Agent 行为强化 + 轻量入口 | 2026-07-19 | 🔄 部分完成 | FR-FAST-001 ✅ (快速模式) + FR-SKILL-001 ✅ (Skill 系统) + FR-RATIONAL-001 (理性化对抗，待启动) |
| **v4.1.0** | 生态扩展 (远期) | TBD | 💡 远期 | 多平台适配 + 自动触发 (竞品借鉴 §5.3) |

### 本周优先事项 (2026-06-21 ~ 2026-06-28)

- [x] ~~**🟡 重要**: 评审 G 问题 (模板质量)，确认 scope 边界~~ → ✅ 已完成 (FR-TPL-001, v3.0.1)
- [ ] **🔴 紧急**: 启动首个 v3.0.0 Feature (建议 FR-QUALITY-001 / FR-KB-001 / FR-BUG-001) 的 discovery 流程
- [ ] **🟡 重要**: 评审 I 问题 (全局配置)，确认 scope 边界；H (知识沉淀) 已由 @sddu-docs 完成
- [ ] **🟡 重要**: 决定 v3.0.0 / v3.1.0 / v3.2.0 的 Feature 归属和启动顺序
- [ ] **🟢 日常**: 运行残留检查脚本，确保无回归
- [ ] **⚡ 速赢**: 执行 5 项速赢任务 (~2h)：TREE.md 路径修正、FeatureStateEnum 清理、stale spec.json 同步、COMPLETION_CERTIFICATE 修正、phaseHistory 去重

### 功能优先级 Top 5 (跨版本 RICE 排名)

| 排名 | 功能 | 版本 | Reach | Impact | Conf. | Effort | **RICE** | 优先级 |
|:----:|------|:----:|:-----:|:------:|:-----:|:------:|:--------:|:------:|
| 🥇 | **FR-BUG-001**: Bug 流程框架化 (→ sddu-bug Skill) | v3.1.0 | 8 | 7 | 75% | 2 | **21.0** | P0 |
| 🥈 | **FR-TREE-SKILL**: @sddu-tree Agent 技能化 🆕 | v3.1.0 | 5 | 6 | 85% | 1.5 | **17.0** | P0 |
| 🥉 | **FR-KB-001**: 全局项目配置 | v3.2.0 | 10 | 9 | 70% | 4 | **15.8** | P0 |
| 4 | **FR-QUALITY-001**: Build Wave 一体化 | v3.0.0 | 6 | 8 | 80% | 4 | **9.6** | P0 |
| 5 | **FR-RATIONAL-001**: 理性化对抗 | v3.3.0 | 8 | 6 | 70% | 3.5 | **9.6** | P1 |

> **注**: FR-FAST-001 (RICE 21.6) 和 FR-SKILL-001 (RICE 17.5 更新后) 已于 2026-07 提前交付完成，不参与排名。FR-BUG-001、FR-WORKTREE-001 和 FR-TREE-SKILL 已采纳 Skill 化降级路径——以上 RICE 分值均为 Skill 化后的评分（Effort 从 4d 降至 1.5~2d）。

### 关键 milestones

| 日期 | Milestone | 版本 |
|------|-----------|:----:|
| ✅ 2026-06-19 | v3.0.1 发布 — 模板质量统一 | v3.0.1 |
| ✅ 2026-06-21 | v4.0.0 发布 — SDDU 框架源码架构重组 | v4.0.0 |
| ✅ 2026-07-12 | FR-FAST-001 validated — @sddu-fast 快速模式 Agent 上线 | v3.3.0 (提前交付) |
| ✅ 2026-07-19 | FR-SKILL-001 validated — SDDU Skill 系统上线 (三元闭环: discovery/creator/sync) | v3.3.0 (提前交付) |
| 2026-07-19 | 首个 v3.0.0 Feature discovery 启动 (建议) | v3.0.0 |
| 2026-08-02 | 首个 v3.0.0 Feature spec + plan 完成 | v3.0.0 |
| 2026-08-16 | v3.0.0 首批 P0 Feature validated | v3.0.0 |
| 2026-09-30 | v3.0.0 全部 Feature 完成 | v3.0.0 |
| 2026-Q4 | v3.1.0 FR-BUG-001 (sddu-bug Skill) + FR-WORKTREE-001 (sddu-worktree Skill) + FR-TREE-SKILL (sddu-tree Skill) 启动评估 | v3.1.0 |
| 2027+ | v3.3.0 FR-RATIONAL-001 启动评估 / v4.1.0 远期生态扩展评估 | v3.3.0 / v4.1.0 |

### 功能完成时间线

```
2026-03-28  ✅  specs-tree-sdd-plugin-baseline (插件基线)
2026-03-30  ✅  v1.1.1 — 16 Agent 上线
2026-04-01  ✅  specs-tree-deprecate-sdd-tools (废弃旧工具)
2026-04-05  ✅  specs-tree-directory-optimization (目录优化)
2026-04-05  ✅  specs-tree-sdd-discovery-feature (Discovery)
2026-04-05  ✅  specs-tree-sdd-multi-module (多模块)
2026-04-05  ✅  specs-tree-sdd-tools-optimization (工具优化)
2026-04-05  ✅  specs-tree-sdd-workflow-state-optimization (状态优化)
2026-04-06  ✅  specs-tree-sdd-plugin-roadmap (Roadmap 专家)
2026-04-09  ✅  specs-tree-plugin-rename-sddu (改名 V1)
2026-04-09  ✅  specs-tree-plugin-rename-sddu-v2 (改名 V2)
2026-04-13  ✅  specs-tree-tree-structure-optimization (树形 V1)
2026-04-15  ✅  specs-tree-tree-structure-optimization-v2 (树形 V2)
2026-04-20  ✅  v1.4.0 SDDU 正式发布
2026-05-25  ✅  specs-tree-agent-output-templating (模板化)
2026-06-12  🚫  specs-tree-solo-team-flow (ETD) → 迁出
2026-06-13  ✅  specs-tree-sddu-status-enhancement (状态增强 v3.0.0)
2026-06-19  ✅  specs-tree-template-quality-unification (模板质量统一 v3.0.1)
2026-06-21  ✅  specs-tree-framework-architecture (架构重组 v4.0.0)
2026-07-12  ✅  specs-tree-sddu-fast (快速模式 Agent v3.3.0)
2026-07-19  ✅  specs-tree-skill-system (Skill 系统 v3.3.0-early)
            ↓
2026-Q3    📋  v3.0.0 质量与工作流改进
```

---

## 版本详细规划 (后 80%)

### 已完成版本回顾

#### Feature 全量状态扫描

##### 已完成 Feature (15 个)

> **注**: 本表含最新完成的 FR-FRAMEWORK-ARCH-001 (v4.0.0)、FR-FAST-001 (v3.3.0)、FR-SKILL-001 (v3.3.0-early)。共 18 个已完成 Feature。

| # | Feature 目录 | ID | 名称 | Phase | Priority | 完成日期 |
|:--|-------------|------|------|:-----:|:--------:|----------|
| 1 | `specs-tree-sdd-plugin-baseline` | SDD-PLUGIN-BASE | SDD Plugin Phase 1 基线 | validated | P1 | 2026-03-28 |
| 2 | `specs-tree-deprecate-sdd-tools` | FR-DEP-001 | 废弃旧版 SDD 工具 | validated | P0 | 2026-04-01 |
| 3 | `specs-tree-directory-optimization` | FR-DIR-001 | 目录结构命名优化 | validated | P0 | 2026-04-05 |
| 4 | `specs-tree-sdd-discovery-feature` | FR-DISCOVERY-001 | Discovery 需求挖掘 | validated | P0 | 2026-04-05 |
| 5 | `specs-tree-sdd-multi-module` | FR-MULTI-001 | 子 Feature 并行开发 | validated | P0 | 2026-04-05 |
| 6 | `specs-tree-sdd-tools-optimization` | FR-TOOLS-001 | 工具系统优化 | validated | P1 | 2026-04-05 |
| 7 | `specs-tree-sdd-workflow-state-optimization` | FR-WF-STATE-001 | 工作流状态优化 | validated | P1 | 2026-04-05 |
| 8 | `specs-tree-sdd-plugin-roadmap` | FR-ROADMAP-001 | Roadmap 规划专家 | validated | P1 | 2026-04-06 |
| 9 | `specs-tree-plugin-rename-sddu` | FR-RENAME-001 | 插件改名 SDDU V1 (父) | validated | P0 | 2026-04-09 |
| 10 | `specs-tree-plugin-rename-sddu-v2` | FR-RENAME-002 | 插件改名 V2 — 代码清理 (子) | validated | P1 | 2026-04-09 |
| 11 | `specs-tree-tree-structure-optimization` | FR-TREE-001 | 树形结构优化 | validated | P0 | 2026-04-13 |
| 12 | `specs-tree-tree-structure-optimization-v2` | FR-TREE-002 | 树形结构优化 v2 修复 | validated | P1 | 2026-04-15 |
| 13 | `specs-tree-agent-output-templating` | FR-TEMPLATE-001 | Agent 输出模板化系统 | validated | P1 | 2026-05-25 |
| 14 | `specs-tree-sddu-status-enhancement` | FR-STATUS-001 | SDDU 特性状态增强 v3.0.0 | validated | P1 | 2026-06-13 |
| **15** | **`specs-tree-template-quality-unification`** | **FR-TPL-001** | **预置输出模板质量统一 v3.0.1** | **validated** | **P1** | **2026-06-19** |
| **16** | **`specs-tree-framework-architecture`** | **FR-FRAMEWORK-ARCH-001** | **SDDU 框架源码架构重组 v4.0.0 🆕** | **validated** | **P0** | **2026-06-21** |
| **17** | **`specs-tree-sddu-fast`** | **FR-FAST-001** | **`@sddu-fast` 快速模式 Agent v3.3.0 🆕** | **validated** | **P0** | **2026-07-12** |
| **18** | **`specs-tree-skill-system`** | **FR-SKILL-001** | **SDDU Skill 系统（用户级 + 框架级）v3.3.0-early 🆕** | **validated** | **P0** | **2026-07-19** |

##### 已终止 Feature (1 个)

| # | Feature 目录 | ID | 名称 | 状态 | 终止日期 | 去向 |
|:--|-------------|------|------|:------:|----------|------|
| 1 | `specs-tree-solo-team-flow` | ETD-001 | Expert Tree Design | terminated-and-migrated | 2026-06-12 | ETD 独立仓库 |

##### 进行中 Feature (0 个)

> ⚠️ **当前无进行中的 Feature。** `state.json` 中 `inProgress` 数组为空，所有 14 个已完成 Feature 的 `status` 均为 `completed`。

---

### v3.0.0 — 质量与工作流改进

**预计时间**: 2026-Q3
**状态**: 📋 规划中
**当前进度**: 0/6 Feature 启动

**背景**: `sddu-status-enhancement` 的 E2E 全流程验证 (2026-06-13) 暴露了 6 个非本 Feature 范畴的问题，需作为后续 Feature 独立规划。

#### 待处理问题清单 (A-F)

| ID | 问题 | 影响组件 | 严重度 |
|----|------|----------|:------:|
| **A** | **sddu-build wave 间衔接断裂** — build agent 被多次调用，理想应一次完成全部 wave | `sddu-build` agent | 🔴 高 |
| **B** | **auto-updater 可能提前设 phase** — Wave 1 完成时就出现 `phase: "builded"`，推断顺序有误 | `auto-updater.ts` | 🟡 中 |
| **C** | ✅ **validate agent E2E 能力已完成** — v3.0.5 模板已重写为动手验证模式（测试覆盖、接口验证、构建验证、性能边界、漂移检测），ROADMAP 审计确认 (2026-07-11) | `sddu-validate` agent | 🟢 已解决 |
| **D** | ✅ **sddu coordinator bash 工具问题已修复** — coordinator 模板已 `bash: deny`，opencode 环境已自愈。同时 sddu-roadmap.md.hbs 已同步 deny (2026-07-11) | `sddu` coordinator | 🟢 已解决 |
| **E** | **SDDU 缺少框架级系统验证层** — 框架 Feature 需要验证"SDDU 本身还能正常工作"，无标准化流程 | SDDU 框架设计 | 🟡 中 |
| **F** | **review/validate 阶段未经设计规划** — build 阶段经历设计规划产出质量高，review/validate 未经历 | SDDU 工作流设计 | 🟡 中 |

#### v3.0.0 提议 Feature 清单

| Feature | 覆盖 | 优先级 | Effort | 说明 |
|---------|:----:|:------:|--------|------|
| **FR-QUALITY-001**: Build Agent Wave 一体化 | A | 🥇 P0 | 3-5 天 | 重构 build agent 为单次调用完成全部 wave |
| **FR-QUALITY-002**: Validate Agent E2E 能力增强 | C | ✅ 已完成 | — | v3.0.5 模板已重写为动手验证模式。ROADMAP 审计确认，从 v3.0.0 待办列表移除 |
| **FR-QUALITY-003**: Review/Validate 阶段设计规划 | F | 🥈 P1 | 3-5 天 | 为 review/validate 引入设计规划阶段 |
| **FR-QUALITY-004**: 框架级自验证流程 | E | 🥈 P1 | 5-7 天 | 建立标准化框架自验证流程 |
| **FR-QUALITY-005**: Auto-updater Phase 推断修复 | B | P2 | 1-2 天 | 修复 phase 推断顺序 |
| **FR-QUALITY-006**: Coordinator 工具兼容性 | D | ✅ 已完成 | — | coordinator 模板已 `bash: deny`，sddu-roadmap.md.hbs 同步修复。ROADMAP 审计确认，从 v3.0.0 待办列表移除 |

#### RICE 优先级分析 (v3.0.0 内部)

| 排名 | Feature | Reach | Impact | Conf. | Effort | **RICE** | 优先级 |
|:----:|---------|:-----:|:------:|:-----:|:------:|:--------:|:------:|
| 🥇 | FR-QUALITY-001 (Build Wave) | 6 | 8 | 80% | 4 | **9.6** | P0 |
| 🥈 | FR-QUALITY-003 (Review/Validate 设计) | 5 | 7 | 60% | 4 | **5.3** | P1 |
| 🥉 | FR-QUALITY-005 (auto-updater) | 3 | 4 | 80% | 2 | **4.8** | P2 |
| 4 | FR-QUALITY-004 (框架自验证) | 4 | 7 | 60% | 6 | **2.8** | P1 |

**推荐启动顺序**:
1. **FR-QUALITY-001** (Build Wave) — RICE 9.6，独立性好，改动集中
2. **FR-QUALITY-003** (Review/Validate 设计) — RICE 5.3
3. **FR-QUALITY-005** (auto-updater) — 快速修复，可穿插进行
4. **FR-QUALITY-004** (框架自验证) — RICE 2.8

---

### v3.1.0 — Skill 化降级验证

**预计时间**: TBD (建议 v3.0.0 启动后评估)
**状态**: 💡 提议中 (原定位: 工具链增强 → 新定位: Skill 化降级验证)
**主题**: 将已规划独立 Feature 降级为框架级 Skill，验证 FR-SKILL-001 的「Agent→Skill 降级模型」

**背景**: FR-SKILL-001 的交付为后续 Feature 引入了「Skill 化降级」新选项。FR-BUG-001 和 FR-WORKTREE-001 均高度适合 Skill 化——原合计 Effort 8d (M×2)，Skill 化后降至约 3.5d (S×2)，降幅 56%。v3.1.0 的使命从「工具链增强」转变为「Skill 化降级模型的首个验证场」。

#### 核心 Feature: FR-BUG-001 — Bug 追踪与修复流程框架化 🆕

| 属性 | 值 |
|------|-----|
| **Feature ID** | FR-BUG-001 |
| **优先级** | 🥇 P0 (RICE 10.5，跨版本第 2 位) |
| **Effort** | M (3-5 天) |
| **来源** | 用户提案 (2026-06-21) |
| **归属** | v3.1.0 轻量改进 (可提前独立交付) |

**背景**: 当前 bug 记录在 `.sddu/specs-tree-root/<feature>/specs-tree-bugs/` 下，属于项目级临时方案 — 模板和流程规则未纳入 SDDU 框架，切换项目时无法复用。需要将 bug 追踪从"约定俗成的目录"提升为"框架原生能力"，使模板随插件分发、流程规则写入 `@sddu` 指令体系。

**核心目标**: 将 bug 追踪从项目级临时约定提升为 SDDU 框架级能力 — 定义标准模板、修复流程规则、确保跨项目跟随插件走。

**预期范围** (待 discovery 阶段细化):
1. **Bug 模板** — 定义 bug 报告标准格式（Handlebars 模板），放在 `src/templates/` 下，随插件分发。内容包括：标题、严重度、复现步骤、影响范围、关联 Feature、修复方案建议
2. **轻修复规则** — 不改已完成阶段的文档（spec/plan/tasks 视为冻结），修复代码后仅更新 `state.json` 和补充验证记录 — 写入 `@sddu` coordinator 指令
3. **重修复规则** — 涉及已冻结文档变更时走子特性流程（`specs-tree-<feature>/specs-tree-<sub-feature>/`），写入 `@sddu` coordinator 指令
4. **跨项目复用** — 切换项目时 bug 模板和流程规则跟随插件走，不绑定单个 `.sddu/` 目录 — 确保 `@sddu` 在任何项目中都有统一的 bug 处理能力

**RICE 详细分析**:

| 维度 | 评分 | 依据 |
|------|:---:|------|
| Reach | **8** | 覆盖全部 11 个 Agent、所有当前及未来 Feature、所有使用 SDDU 的项目 — bug 是开发常态，无项目能免疫 |
| Impact | **7** | 标准化 bug 模板消除"各写各的"混乱；轻/重修复分离避免已完成文档被随意篡改；跨项目跟随消除重复配置 — 质量闭环显著增强 |
| Confidence | **75%** | 概念清晰（模板 + 规则 + 跟随机制），类似模板质量统一（FR-TPL-001）的成功模式可复用。discovery 阶段需确认：轻/重修复的边界判定标准、与现有 sub-feature 流程的耦合点 |
| Effort | **4** | 中等：模板设计 + Handlebars 实现 (1d) + 轻/重修复流程规则设计 + 写入 @sddu 指令 (1.5d) + 框架整合 + 跨项目验证 (1d) + discovery/spec (0.5d) |
| **RICE** | **10.5** | **(8 × 7 × 0.75) / 4** |

**与其他 Feature 的依赖关系**:

```
FR-BUG-001 (Bug 流程) ──无硬依赖──→ 可独立启动，不依赖任何未完成 Feature
FR-BUG-001 (Bug 流程) ──受益于──→ FR-KB-001 (全局配置) — 全局配置可定义 bug 严重度等级等参数
FR-BUG-001 (Bug 流程) ──与模板系统对齐──→ FR-TPL-001 (v3.0.1) — 共用 Handlebars 模板引擎和分发机制
```

**建议**: FR-BUG-001 无硬依赖，可在 v3.0.0 或 v3.1.0 期间随时启动。建议作为轻量改进快速交付（Effort 仅 3-5d），与 v3.0.0 的 P0 Feature 并行推进。

---

#### 新增 Feature: FR-WORKTREE-001 — Git Worktree Feature 隔离 🆕 (竞品借鉴)

> **来源**: [Superpowers 竞品调研 §5.2.1](../../docs/research/superpowers-competitor-analysis.md#521-git-worktree-隔离)
> **加入日期**: 2026-07-11

| 属性 | 值 |
|------|-----|
| **Feature ID** | FR-WORKTREE-001 |
| **优先级** | 🥉 P2 (RICE 4.5) |
| **Effort** | M (3-5 天) |
| **来源** | 竞品调研 — Superpowers 的 `using-git-worktrees` + `finishing-a-development-branch` |
| **归属** | v3.1.0 工具链增强 |

**背景**: Superpowers 为每个 Feature 开发创建隔离的 Git Worktree，含完整生命周期管理（创建→初始化→基线验证→收尾/清理）。SDDU 当前无 worktree 管理，Feature 开发直接在当前分支进行，有交叉污染风险。SDDU 的树形 Feature 嵌套（差异化优势）如果加上 worktree 隔离会更强大。

**核心目标**: 新增 Git Worktree 隔离能力，为每个 Feature 创建独立工作区，完整的生命周期管理。

**预期范围** (待 discovery 阶段细化):
1. **Worktree 创建** — 检测是否已在隔离环境（避免嵌套）、优先平台原生工具、降级 `git worktree add`
2. **项目初始化** — 自动检测项目类型并安装依赖、验证测试基线
3. **收尾管理** — merge / PR / keep / discard 四选项 + worktree 清理
4. **与树形 Feature 集成** — 子 Feature 可在独立 worktree 中开发，主分支不受影响

**RICE 详细分析**:

| 维度 | 评分 | 依据 |
|------|:---:|------|
| Reach | **5** | 影响需要使用隔离环境开发复杂 Feature 的用户，非所有 SDDU 用户都需要 |
| Impact | **6** | 显著降低主分支污染风险，提升大型 Feature 开发体验 |
| Confidence | **60%** | Git Worktree 是成熟技术，但集成到 SDDU 工作流需仔细设计；Superpowers 提供了参考实现 |
| Effort | **4** | 中等：worktree 创建/检测逻辑 (1.5d) + 项目初始化/基线验证 (1d) + 收尾管理 (1d) + discovery/spec (0.5d) |
| **RICE** | **4.5** | **(5 × 6 × 0.6) / 4** |

**与其他 Feature 的依赖关系**:

```
FR-WORKTREE-001 (Worktree) ──无硬依赖──→ 可独立启动
FR-WORKTREE-001 (Worktree) ──受益于──→ FR-MULTI-001 (树形多模块) — Worktree 为子 Feature 提供物理隔离支撑
FR-WORKTREE-001 (Worktree) ──受益于──→ FR-KB-001 (全局配置) — 全局配置可定义默认 worktree 行为
```

**建议**: FR-WORKTREE-001 无硬依赖，Effort 中等 (3-5d)。建议在 FR-BUG-001 之后启动，v3.1.0 两个 M 级 Feature（Bug + Worktree）并行推荐。

---

#### 新增 Feature: FR-TREE-SKILL — @sddu-tree Agent 技能化 🆕

> **来源**: 用户提案 (2026-07-19) — SDDU 架构演进：Agent→Skill 降级
> **加入日期**: 2026-07-19

| 属性 | 值 |
|------|-----|
| **Feature ID** | FR-TREE-SKILL |
| **优先级** | 🥈 P0 (RICE 17.0，跨版本第 2 位) |
| **Effort** | S (1-2 天，Skill 化后) |
| **来源** | 架构决策 — FR-SKILL-001 的 Agent→Skill 降级模型首个实战验证案例 |
| **归属** | v3.1.0 Skill 化降级验证 |

**背景**: `@sddu-tree` 是 SDDU 的目录导航辅助 Agent，职责为扫描 `.sddu/` 目录结构、在各层级生成/更新 `TREE.md` 导航文件。当前作为独立 subagent 注册在 `opencode.json` 中，8 个主流程 Agent 完成后自动触发。FR-SKILL-001 定义了 Agent 新增门禁——任何提议新增 Agent 的需求必须先证明「Skill 无法满足」；反之，**现有 Agent 如果可以用 Skill 替代，也应评估降级为 Skill**。`@sddu-tree` 的职责（扫描目录 → 检查缺失 TREE → 读取文件提取元数据 → 生成格式化导航）是典型的「可复用执行流程」，高度适合 Skill 化。

**核心目标**: 将 `@sddu-tree` 从独立 Agent 降级为框架级 `sddu-tree` Skill，所有 Agent 通过 Skill 发现机制加载目录导航逻辑，而非通过独立的 subagent 调用。这是 FR-SKILL-001 定义的「Agent→Skill 降级模型」的**首个纯实战案例**——不同于 FR-BUG-001/WORKTREE-001（从未构建为 Agent，直接以 Skill 形态出现），FR-TREE-SKILL 是**拿现有 Agent 做降级手术**，能最直接地验证降级模型的可行性与收益。

**Skill 化方案设计**:
1. **Skill body 内容** — 将原 `sddu-tree.md.hbs` Agent 模板的核心逻辑（6 步工作流：扫描目录→检测缺失→读取文件→生成 TREE→验证已有→输出报告）迁移到 `sddu-tree` Skill 的 body 中，保持 Progressive Disclosure 设计
2. **触发机制变更** — 原模式：8 个主流程 Agent 模板中硬编码「完成后自动触发 `@sddu-tree`」；新模式：Agent 模板的「## Skill 发现」章节加载 `sddu-tree` Skill，Agent 按 Skill 指引自行执行目录导航
3. **Agent 注销** — 从 `opencode.json` 中移除 `sddu-tree` subagent 注册；从 Agent 模板中移除 `@sddu-tree` 调用指令
4. **自举性质** — `sddu-tree` Skill 生成后，通过 `sddu-skill-sync` 同步到实际目录；各 Agent 通过 `sddu-skill-discovery` 按需加载
5. **保留能力** — 用户仍可显式调用 Skill 进行目录导航（通过 Agent 的 Skill 加载机制，而非独立的 subagent）

**与原 Agent 的差异对比**:

| 维度 | 原 Agent 模式 | Skill 化后 |
|------|-------------|-----------|
| **注册方式** | opencode.json subagent + .hbs 模板 | 框架级 Skill (`.sddu/skills/sddu-tree/SKILL.md`) |
| **触发方式** | 硬编码 `@sddu-tree` 调用（独立 subagent 启动） | Agent 按 Skill 发现机制加载，自行执行目录导航 |
| **Token 成本** | 每次调用启动独立 subagent（含完整 Agent prompt） | Skill body 按需加载（Stage 3），不增加固定 prompt 开销 |
| **Agent 数量** | +1 独立 subagent | 0（不增加 Agent 清单） |
| **维护成本** | Agent 模板 + opencode.json 注册 + 所有引用模板的 `@sddu-tree` 调用 | 单一 Skill 文件，引用方仅需 Skill 发现声明（已在 FR-SKILL-001 中注入） |
| **可扩展性** | 修改需更新 Agent 模板 | Skill body 独立更新，不需动 Agent 模板 |

**RICE 详细分析**:

| 维度 | 评分 | 依据 |
|------|:---:|------|
| Reach | **5** | 影响 8+ 主流程 Agent（discovery/spec/plan/tasks/build/review/validate/docs）和所有使用 `@sddu-tree` 的用户。但 TREE 导航是辅助功能，非核心业务 |
| Impact | **6** | (1) 减少 Agent 数量 → 降低用户认知负担和 prompt 复杂度；(2) Agent→Skill 降级模型的首个完整验证 → 为后续降级（如 sddu-docs 是否也可 Skill 化）提供范本；(3) TREE 生成逻辑以 Skill 形式可独立迭代 |
| Confidence | **85%** | 非常高 — TREE 职责边界清晰（6 步工作流已有完整定义），Skill 化方案明确（迁移 body + 注销 Agent + 更新引用），类似 FR-BUG-001/WORKTREE-001 的评估框架已验证可行 |
| Effort | **1.5** | 小 (S)：Skill body 编写（迁移现有模板逻辑，0.5d）+ 更新 8+ Agent 模板引用（批量替换 `@sddu-tree` → Skill 发现指引，0.3d）+ 注销 Agent + 验证 + 同步（0.4d）+ discovery/spec（0.3d） |
| **RICE** | **17.0** | **(5 × 6 × 0.85) / 1.5** |

**与其他 Feature 的依赖关系**:

```
FR-TREE-SKILL (Tree Skill 化) ──强依赖──→ FR-SKILL-001 ✅ (Skill 基础设施: discovery/creator/sync)
FR-TREE-SKILL (Tree Skill 化) ──影响──→ 8 个主流程 Agent 模板 (需移除 @sddu-tree 调用指令)
FR-TREE-SKILL (Tree Skill 化) ──受益于──→ FR-BUG-001 / FR-WORKTREE-001 (共享 Skill 化降级模式经验)
FR-TREE-SKILL (Tree Skill 化) ──与等同──→ FR-RATIONAL-001 (混合方案参考 — 部分 Skill 化 + 模板变更)
```

**Agent→Skill 降级模型验证价值**:

FR-TREE-SKILL 区别于 FR-BUG-001/WORKTREE-001 的关键特征：它是 **Agent→Skill 降级**，而非 Feature→Skill 降级。这意味着：

1. **最纯粹的降级案例**: `@sddu-tree` 已是成熟可用的 Agent，降级后须证明「Skill 形态不损失任何能力」
2. **模板变更量最大**: 需要修改 8+ Agent 模板中的 `@sddu-tree` 调用 → 测试覆盖广
3. **自举价值**: `sddu-tree` Skill 生成后，可立即用于自身的 Skill 文件目录导航（自举验证）
4. **决策门槛**: 如果此次降级成功，将建立「辅助 Agent 优先考虑 Skill 化」的默认规则 — 类似 FR-SKILL-001 中的 Agent 新增门禁，但方向相反

**建议**: FR-TREE-SKILL 建议作为 v3.1.0 的**首个启动项**（甚至可在 FR-BUG-001 之前启动），理由：
- Effort 极低 (S, 1.5d)，可快速交付验证
- 降级模型的首个实战案例 → 验证结果将直接影响 FR-BUG-001 和 FR-WORKTREE-001 的 Skill 化路径信心
- 与 FR-BUG-001 和 FR-WORKTREE-001 无硬依赖，三者可并行或串行
- 成功后直接减少 1 个 Agent → 立竿见影的架构收益

---

### v3.2.0 — 项目知识基础设施

**预计时间**: TBD (依赖 v3.1.0 部分完成)
**状态**: 🔄 部分完成 (FR-KB-002 已由 @sddu-docs 提前实现)
**新增问题**: I (全局配置); H (知识沉淀) — ✅ 已完成
**注意**: FR-FRAMEWORK-ARCH-001 (v4.0.0) 已完成的三域分层架构为 KB-001 的配置格式设计提供了清晰的平台无关性参考。

| Feature | 覆盖 | 优先级 | Effort | 说明 |
|---------|:----:|:------:|--------|------|
| **FR-KB-001**: 全局项目配置文件 | I | 🥇 P0 | 3-5 天 | `.sddu/project.json` — 技术栈、命名规范、代码风格等 |
| **FR-KB-002**: 项目级知识自动沉淀 | H | ✅ 已完成 | — | ✅ 由 `@sddu-docs` Agent 实现 — 扫描 specs-tree-root 下 Feature 过程产物，聚合为项目全景（这正是本需求的核心目标） |

**RICE 分析 (问题 I)**:

| 排名 | Feature | Reach | Impact | Conf. | Effort | **RICE** | 优先级 |
|:----:|---------|:-----:|:------:|:-----:|:------:|:--------:|:------:|
| 🥇 | FR-KB-001 (全局配置) | 10 | 9 | 70% | 4 | **15.8** | P0 |
| — | ~~FR-KB-002 (知识沉淀)~~ | — | — | — | — | — | ✅ 已完成 |

---

### v3.3.0 — Agent 行为强化 (部分提前交付)

**预计时间**: 2026-07 (FR-FAST-001 + FR-SKILL-001 已交付) / TBD (FR-RATIONAL-001)
**状态**: 🔄 部分完成
**已交付**: FR-FAST-001 ✅ / FR-SKILL-001 ✅
**待启动**: FR-RATIONAL-001 (理性化对抗)

v3.3.0 原规划为三个 Feature 的搁置汇入点，现其中两个已提前交付，仅 FR-RATIONAL-001 待 v3.0.0~v3.2.0 交付后启动。FR-SKILL-001 的完成为后续 Feature 引入了「Skill 化降级」的新选项（详见 §Skill 化可行性评估）。

---

#### ✅ 已完成: FR-FAST-001 — @sddu-fast 快速模式 Agent

> **交付日期**: 2026-07-12 | **版本**: v3.3.0 | **RICE**: 21.6 | **Effort**: XS (1-2d)
> **交付物**: `@sddu-fast` Agent 模板 (.hbs) + OpenCode subagent 注册 + 6 任务全部完成 + validated

SDDU 正式进入「轻重双模」时代。`@sddu-fast` 提供零摩擦轻量入口：无状态机、纯对话、零中间产物、不留痕。覆盖 60-70% 日常简单任务（bug 修复、小功能、配置调整）。用户显式选择 `@sddu-fast` 或 `@sddu 开始`，Agent 在检测到复杂问题时建议升级到完整流程。

**关键设计决策**（已落地）:
- 独立 Agent，不走状态机，不依赖 `pipeline/` 模块
- 理解问题 → 直接解决 → 验证结果（三阶段，无中间文件）
- 不写 `state.json`，不进 `specs-tree-root`
- 建议升级但**不自动**升级到完整流程

**依赖**: FR-TPL-001 (模板系统) — 共用 Handlebars 引擎

---

#### ✅ 已完成: FR-SKILL-001 — SDDU Skill 系统 (双重定位)

> **交付日期**: 2026-07-19 | **版本**: v3.3.0-early | **RICE**: 17.5 (更新后 R=10/I=10/C=70%/E=4) | **Effort**: M (4d)
> **交付物**: 3 个框架级 Skill + 12 个 Agent 模板注入 + 双层架构 + 三元自举闭环 + 28 FR / 8 NFR / 10 EC 覆盖 + validated (⚠️ 有条件通过)
> **Commit**: `04d78a8`

FR-SKILL-001 是 SDDU 架构演进的里程碑——SDDU 从「全功能 Agent 集合」进化为「固定引擎 + 可扩展能力」双层模型：

**架构决策**（不可更改）: 「未来 Agent 的清单尽可能保持简单固定，拓展 SDDU 能力核心重任就放到 Skill 这边来。」

**交付的关键成果**:
1. **3 个框架级 Skill**（三元自举闭环）:
   - `sddu-skill-discovery` — 用 Skill 描述 Skill 发现逻辑（Stage 1/2/3 渐进披露模型）
   - `sddu-skill-creator` — 用 Skill 引导用户创建符合规范的 Skills
   - `sddu-skill-sync` — 用 Skill 实现源目录 → 实际目录同步（按需触发）
2. **12 个 Agent 模板全部注入**「## Skill 发现」章节（三阶段 + 冷启动同步路径，极简一行，不泄漏 discovery 内部职责）
3. **「源目录 + 实际目录」双层架构**: 源目录 SDDU 管辖（`.sddu/skills/` + `.opencode/plugins/sddu/skills/`），实际目录 LLM Agent 工具管辖（`.opencode/skills/`），两套发现流程互不干扰
4. **接口优先的契约式设计**: 每个框架级 Skill 包含参数/返回值/调用示例
5. **Agent 新增门禁**: 任何提议新增 Agent 的需求必须先证明「Skill 无法满足」
6. **Agent→Skill 降级评估框架**: 为 FR-BUG-001、FR-RATIONAL-001、FR-WORKTREE-001 等已规划 Feature 提供 Skill 化可行性评估（见下方）

**验证结论**: ⚠️ 有条件通过 — 构建全链路 zero error，FR 覆盖率 92%（scope 内），NFR 覆盖率 75%，0 阻塞漂移，1 项非阻塞观察（`src/skills/` untracked → 建议提交）。

---

#### 📊 Skill 化可行性评估 — 对后续 Feature 的影响分析

FR-SKILL-001 的交付引入了「Skill 化降级」的新范式：原本规划为独立 Feature 的能力，现在可以通过 Skill 以更低成本实现。下面对三个已规划 Feature 做 Skill 化可行性评估：

##### FR-BUG-001: Bug 流程框架化 → ⚡ 高度适合 Skill 化

| 评估维度 | 分析 |
|---------|------|
| **Skill 化适配度** | 🟢 **高** — Bug 流程本质是「可复用的执行流程指引」，正是 Skill 的核心定位 |
| **Skill 化方案** | 创建框架级 `sddu-bug` Skill，包含：轻修复规则 (不改 spec/plan/tasks)、重修复规则 (走子特性流程)、bug 报告模板引用 |
| **与原 Feature 的差异** | 原 FR-BUG-001 规划为「框架级 Feature + Bug 模板 + 规则写入 @sddu 指令」；Skill 化后 Bug 模板和流程规则封装为 Skill body，Agent 按需加载而非硬编码到 coordinator 指令中 |
| **节省 Effort** | 原 Effort 4d (M) → Skill 化后约 2d (S) — 减少 50%，模板编写 + 注册即可，无需改 coordinator 指令体系 |
| **跨项目复用** | ✅ Skill 随 `sddu-skill-sync` 同步，天然跨项目跟随 |
| **建议** | **强烈推荐 Skill 化**。将 FR-BUG-001 从独立 Feature 降级为框架级 `sddu-bug` Skill，通过 `sddu-skill-creator` 创建，`sddu-skill-sync` 同步到实际目录。保留 FR-BUG-001 的 Feature ID 用于追踪，但 scope 大幅缩小为「创建并验证 sddu-bug Skill」 |

##### FR-WORKTREE-001: Git Worktree 隔离 → ⚡ 高度适合 Skill 化

| 评估维度 | 分析 |
|---------|------|
| **Skill 化适配度** | 🟢 **高** — Worktree 创建/初始化/收尾是典型的「可复用执行流程」，适合 Skill 封装 |
| **Skill 化方案** | 创建框架级 `sddu-worktree` Skill，描述：Step 0 嵌套检测 → Step 1 创建 worktree → Step 2 项目初始化/依赖安装 → Step 3 基线验证 → Step 4 收尾（merge/PR/keep/discard） |
| **与原 Feature 的差异** | 原规划为独立 Feature (M, 3-5d)；Skill 化后为框架级 Skill (S, 1-2d)，Agent 在 spec/plan 阶段按需发现并加载 |
| **节省 Effort** | 原 Effort 4d (M) → Skill 化后约 1.5d (S) — 减少 60%+ |
| **与树形 Feature 集成** | ✅ Skill body 可描述子 Feature 的 worktree 隔离策略，由 Agent 在运行时按 Skill 指引执行 |
| **建议** | **推荐 Skill 化**。Worktree 操作本身高度流程化，Skill 格式天然适合。保留 FR-WORKTREE-001 Feature ID 用于追踪 |

##### FR-RATIONAL-001: Agent 理性化对抗 → ⚠️ 部分适合，核心仍需模板变更

| 评估维度 | 分析 |
|---------|------|
| **Skill 化适配度** | 🟡 **中** — 理性化表可作为「参考 Skill」在 Agent 模板中引用，但核心交付仍是模板变更 |
| **Skill 化方案** | (1) 创建 `sddu-rationalizations` Skill 作为「理性化知识库」— 包含各阶段常见借口 + 反驳； (2) Agent 模板中增加引用指令（如「执行前参考 `sddu-rationalizations` Skill 的对应阶段表」） |
| **不能 Skill 化的部分** | Red Flags STOP 列表、`<HARD-GATE>` 标签需要硬编码到模板中才能保证执行纪律——仅靠 Skill 引用无法达到「强制停止」的效果 |
| **与原 Feature 的关系** | 不能降级为纯 Skill，但可以 Skill + 模板变更混合实现。Skill 承载「知识」，模板承载「纪律」 |
| **节省 Effort** | 有限 — 原 Effort 3.5d (M) → Skill + 模板混合约 3d，仅减少 ~15% |
| **建议** | **保留为独立 Feature，但融入 Skill 引用**。在 FR-RATIONAL-001 的 discovery 阶段设计「Skill 知识库 + 模板强制约束」的混合方案。Rationalization 表作为 Skill 的好处：后续可独立更新（无需走模板变更流程） |

##### Skill 化影响总结

| Feature | 原归属 | Effort (原) | Skill 化后 Effort | 节省 | Skill 化建议 | 类型 |
|---------|:------:|:-----------:|:-----------------:|:----:|:-----------:|:----:|
| FR-BUG-001 | v3.1.0 | M (4d) | S (~2d) | **~50%** | ✅ 强烈推荐 | Feature→Skill |
| FR-WORKTREE-001 | v3.1.0 | M (4d) | S (~1.5d) | **~60%** | ✅ 推荐 | Feature→Skill |
| FR-TREE-SKILL 🆕 | v3.1.0 | — (原为 Agent) | S (~1.5d) | **N/A** | ✅ 强烈推荐 | **Agent→Skill** (降级) |
| FR-RATIONAL-001 | v3.3.0 | M (3.5d) | M (~3d) | ~15% | ⚠️ 混合方案 | Skill + 模板 |

> **决策建议**: FR-BUG-001 和 FR-WORKTREE-001 从独立 Feature 降级为框架级 Skill（`sddu-bug` / `sddu-worktree`），可显著降低 v3.1.0 的交付负担。FR-TREE-SKILL 是新 Proposal，建议作为 v3.1.0 **首个启动项**——它是 Agent→Skill 降级的最纯粹验证案例，成功后将直接减少 1 个 Agent，并为后续 Agent 降级建立范本。原 v3.1.0 总 Effort 约 8d (M×2)，加入 FR-TREE-SKILL (S, 1.5d) 后总 Effort 约 5d (S×3)，仍远低于原规划。

---

#### 待启动: FR-RATIONAL-001 — Agent 理性化对抗

> **来源**: Superpowers 竞品调研 §5.1.2 | **RICE**: 9.6 | **Effort**: M (3d) | **归属**: v3.3.0

FR-RATIONAL-001 是 v3.3.0 仅剩的未启动 Feature。纯模板层改动，无硬依赖，可独立启动。建议采用「Skill 知识库 + 模板强制约束」混合方案：Rationalization 表和 Red Flags 以 Skill 形式承载，`<HARD-GATE>` 标签硬编码到 Agent 模板中。

**启动条件**: v3.0.0~v3.2.0 全部交付 + 用户反馈 Agent 偷懒/走形式问题频发

---

### v4.1.0 — 生态扩展 (远期)

**预计时间**: TBD (依赖 v4.0.0 架构基础 + 需求评估)
**状态**: 💡 远期
**注意**: v4.0.0 的三域分层架构已为跨平台扩展奠定基础 (adapters/ 目录)。本版本的两个 Feature 为长线竞争力投资。

#### FR-CROSSPLAT-001 — 多平台适配支持 🆕 (竞品借鉴)

> **来源**: [Superpowers 竞品调研 §5.3.1](../../docs/research/superpowers-competitor-analysis.md#531-多平台支持)

| 属性 | 值 |
|------|-----|
| **Feature ID** | FR-CROSSPLAT-001 |
| **优先级** | P3 (RICE 2.4) |
| **Effort** | XL (>10 天) |
| **来源** | 竞品调研 — Superpowers 支持 11+ 平台，SDDU 仅支持 OpenCode |
| **归属** | v4.1.0 远期 |

**核心目标**: 将 SDDU 扩展到 OpenCode 之外的 AI Agent 平台（Claude Code、Codex、Cursor 等），基于 v4.0.0 的 adapters/ 架构实现平台适配器模式。

**RICE**: Reach 9 × Impact 8 × Confidence 40% / Effort 12 = **2.4** | P3

#### FR-AUTOTRIGGER-001 — Agent 自动触发机制 🆕 (竞品借鉴)

> **来源**: [Superpowers 竞品调研 §5.3.2](../../docs/research/superpowers-competitor-analysis.md#532-技能自动触发-automatic-skill-triggering)

| 属性 | 值 |
|------|-----|
| **Feature ID** | FR-AUTOTRIGGER-001 |
| **优先级** | P3 (RICE 7.5) |
| **Effort** | S (1-2 天) |
| **来源** | 竞品调研 — Superpowers 的 `using-superpowers` 会话启动注入 + "1% 可能就触发"策略 |
| **归属** | v4.1.0 远期 |

**核心目标**: 实现会话启动时自动注入 `@sddu` 入口指令，提升 Agent 主动性。注意需谨慎评估——Superpowers 的强制注入可能干扰非 SDDU 场景的用户交互。

**RICE**: Reach 6 × Impact 5 × Confidence 50% / Effort 2 = **7.5** | P3 (战略降级)

---

### 跨版本 RICE 总排名 (全部 16 项: A-F + H-I + BUG-001 + WORKTREE-001 + TREE-SKILL + RATIONAL-001 + CROSSPLAT-001 + AUTOTRIGGER-001)

| 排名 | Feature | 归属 | Reach | Impact | Conf. | Effort | **RICE** | 优先级 |
|:----:|---------|:----:|:-----:|:------:|:-----:|:------:|:--------:|:------:|
| 🥇 | **FR-BUG-001**: Bug 流程框架化 🔄 | v3.1.0 | 8 | 7 | 75% | 2 | **21.0** | P0 |
| 🥈 | **FR-TREE-SKILL**: @sddu-tree 技能化 🆕 🔄 | v3.1.0 | 5 | 6 | 85% | 1.5 | **17.0** | P0 |
| 🥉 | **FR-KB-001**: 全局项目配置 | v3.2.0 | 10 | 9 | 70% | 4 | **15.8** | P0 |
| 4 | **FR-QUALITY-001**: Build Wave 一体化 | v3.0.0 | 6 | 8 | 80% | 4 | **9.6** | P0 |
| 5 | **FR-RATIONAL-001**: 理性化对抗 | v3.3.0 | 8 | 6 | 70% | 3.5 | **9.6** | P1 |
| 6 | **FR-QUALITY-002**: Validate E2E | v3.0.0 | 8 | 9 | 70% | 6 | **8.4** | P0 |
| 7 | **FR-AUTOTRIGGER-001**: 自动触发 | v4.1.0 | 6 | 5 | 50% | 2 | **7.5** | P3 |
| 8 | **FR-QUALITY-003**: Review/Validate 设计 | v3.0.0 | 5 | 7 | 60% | 4 | **5.3** | P1 |
| 9 | **FR-QUALITY-005**: auto-updater 修复 | v3.0.0 | 3 | 4 | 80% | 2 | **4.8** | P2 |
| 10 | **FR-WORKTREE-001**: Git Worktree 🔄 | v3.1.0 | 5 | 6 | 60% | 1.5 | **12.0** | P2 |
| 11 | ~~**FR-FAST-001**: 快速模式 Agent~~ | ~~v3.3.0~~ | — | — | — | — | — | ✅ 已完成 |
| 12 | ~~**FR-SKILL-001**: 项目级业务 Skills~~ | ~~v3.3.0~~ | — | — | — | — | — | ✅ 已完成 |
| 13 | ~~**FR-KB-002**: 项目知识沉淀~~ | ~~v3.2.0~~ | — | — | — | — | — | ✅ 已完成 |
| 14 | **FR-QUALITY-004**: 框架自验证 | v3.0.0 | 4 | 7 | 60% | 6 | **2.8** | P1 |
| 15 | **FR-QUALITY-006**: coordinator 兼容 | v3.0.0 | 2 | 3 | 80% | 2 | **2.4** | P2 |
| 16 | **FR-CROSSPLAT-001**: 多平台适配 | v4.1.0 | 9 | 8 | 40% | 12 | **2.4** | P3 |

> **注**: FR-BUG-001、FR-WORKTREE-001 和 FR-TREE-SKILL 标注 🔄 表示采用 Skill 化路径——表中 Effort 和 RICE 均为 Skill 化后的值。FR-TREE-SKILL 是唯一的 **Agent→Skill 降级**案例（其余为 Feature→Skill 降级），建议作为 v3.1.0 首个启动项，为降级模型提供最纯粹的验证。

---

### 依赖关系分析

#### 依赖关系图谱

```
specs-tree-sdd-plugin-baseline ─────────────────────────────────────────────────────── ✅
    │
    ├── specs-tree-sdd-tools-optimization ───────────────────────────────────────────── ✅
    │       └── specs-tree-deprecate-sdd-tools ───────────────────────────────────────── ✅
    │
    ├── specs-tree-sdd-workflow-state-optimization ───────────────────────────────────── ✅
    │       │  (depends on: baseline, multi-module)
    │       └── specs-tree-agent-output-templating ───────────────────────────────────── ✅
    │               (depends on: workflow-state-optimization)
    │               └── specs-tree-template-quality-unification ────────────────────── ✅
    │                       (depends on: agent-output-templating, v3.0.1)
    │
    ├── specs-tree-sdd-multi-module ──────────────────────────────────────────────────── ✅
    │
    ├── specs-tree-sdd-discovery-feature ─────────────────────────────────────────────── ✅
    │
    ├── specs-tree-directory-optimization ────────────────────────────────────────────── ✅
    │
    ├── specs-tree-plugin-rename-sddu (parent) ───────────────────────────────────────── ✅
    │       └── specs-tree-plugin-rename-sddu-v2 (child) ─────────────────────────────── ✅
    │
    ├── specs-tree-sdd-plugin-roadmap ────────────────────────────────────────────────── ✅
    │
    ├── specs-tree-tree-structure-optimization ───────────────────────────────────────── ✅
    │       └── specs-tree-tree-structure-optimization-v2 (child) ─────────────────────── ✅
    │
            └── specs-tree-sddu-status-enhancement (v2.6.0 / v3.0.0 model) ──────────────────── ✅
            │  (latest: 2026-06-13)
            │
            ▼  ─── ✅ v4.0.0 已完成 ───
            ├── specs-tree-framework-architecture (FR-FRAMEWORK-ARCH-001) ───────────── ✅ v4.0.0
            │       (depends on: template-quality-unification for template layout ref)
            │
            ▼  ─── 📋 v3.0.0 规划中 ───
            ├── FR-QUALITY-001 (Build Wave 一体化) — Issue A
            ├── FR-QUALITY-002 (Validate E2E) — Issue C
            ├── FR-QUALITY-003 (Review/Validate 设计规划) — Issue F
            ├── FR-QUALITY-004 (框架自验证) — Issue E
            ├── FR-QUALITY-005 (auto-updater 修复) — Issue B
            ├── FR-QUALITY-006 (coordinator 兼容) — Issue D
            │
            ▼  ─── 💡 v3.1.0 / v3.2.0 提议中 ───
            ├── FR-TPL-001 (模板质量统一) — Issue G → ✅ v3.0.1 已完成
            ├── FR-BUG-001 (Bug 流程框架化 → sddu-bug Skill) — 新提案 → v3.1.0
            ├── FR-WORKTREE-001 (Git Worktree 隔离 → sddu-worktree Skill) 🆕 — 竞品借鉴 §5.2.1 → v3.1.0
            ├── FR-TREE-SKILL (@sddu-tree Agent 技能化 → sddu-tree Skill) 🆕 — 用户提案 → v3.1.0
            ├── FR-KB-001 (全局项目配置) — Issue I → v3.2.0
            └── FR-KB-002 (项目知识沉淀) — Issue H → ✅ 已完成 (@sddu-docs)

            ▼  ─── 🔄 v3.3.0 部分提前交付 ───
            ├── FR-FAST-001 (快速模式 Agent) — ✅ 已完成 (2026-07-12)
            ├── FR-SKILL-001 (SDDU Skill 系统) — ✅ 已完成 (2026-07-19)
            └── FR-RATIONAL-001 (理性化对抗) — 📋 待启动 (v3.3.0 唯一剩余)

            ▼  ─── 💡 v4.1.0 远期 ───
            ├── FR-CROSSPLAT-001 (多平台适配) 🆕 — 竞品借鉴 §5.3.1 → v4.1.0
            └── FR-AUTOTRIGGER-001 (自动触发) 🆕 — 竞品借鉴 §5.3.2 → v4.1.0

specs-tree-solo-team-flow (ETD-001) ──────────── 🚫 terminated → 独立仓库
```

#### 执行依赖分析

```
FR-KB-001 (全局配置) ──→ ~~FR-KB-002 (知识沉淀)~~ ✅ 已完成       ← 配置是知识沉淀的前提 (已实现)
FR-BUG-001 (Bug 流程) ──受益于──→ FR-KB-001 (全局配置)   ← 全局配置可定义 bug 严重度等级
FR-BUG-001 (Bug 流程) ──借用──→ FR-TPL-001 (模板系统)   ← 共用 Handlebars 模板引擎
FR-BUG-001 (Bug 流程) ──Skill 化──→ FR-SKILL-001 ✅     ← 高度适合 Skill 降级为框架级 sddu-bug Skill
FR-WORKTREE-001 (Worktree) ──受益于──→ FR-MULTI-001 (多模块) ← Worktree 为子 Feature 提供物理隔离
FR-WORKTREE-001 (Worktree) ──受益于──→ FR-KB-001 (全局配置) ← 全局配置可定义默认 worktree 行为
FR-WORKTREE-001 (Worktree) ──Skill 化──→ FR-SKILL-001 ✅ ← 高度适合 Skill 降级为框架级 sddu-worktree Skill
FR-TREE-SKILL (Tree Agent 技能化) ──强依赖──→ FR-SKILL-001 ✅ ← 纯 Agent→Skill 降级，依赖 Skill 基础设施 (discovery/creator/sync)
FR-TREE-SKILL (Tree Agent 技能化) ──影响──→ 8 个主流程 Agent 模板 ← 需移除 @sddu-tree 调用指令
FR-TREE-SKILL (Tree Agent 技能化) ──受益于──→ FR-BUG-001 / FR-WORKTREE-001 ← 共享 Skill 化降级模式经验
FR-TREE-SKILL (Tree Agent 技能化) ──自举性质──→ @sddu-tree 自身 ← sddu-tree Skill 可导航自身的 Skill 文件目录
FR-RATIONAL-001 (理性化) ──借用──→ FR-TPL-001 (模板系统)  ← 纯模板层变更，共用 Handlebars 引擎
FR-RATIONAL-001 (理性化) ──部分 Skill 化──→ FR-SKILL-001 ✅ ← Rational 知识库以 Skill 承载，纪律约束硬编码模板
FR-FAST-001 (快速模式) ✅ ──已完成──→ 2026-07-12         ← 轻量入口，无状态机，纯对话
FR-SKILL-001 (Skill 系统) ✅ ──已完成──→ 2026-07-19      ← 三元闭环 + 双层架构 + Agent 门禁
FR-QUALITY-001 (Build Wave) ──→ FR-QUALITY-003 (设计规划)    ← Wave 经验指导设计
FR-QUALITY-002 (Validate E2E) ──→ FR-QUALITY-004 (框架自验)  ← E2E 能力支撑自验证
FR-QUALITY-005 + FR-QUALITY-006 — 可独立快速修复
FR-CROSSPLAT-001 (多平台) ──依赖──→ FR-FRAMEWORK-ARCH-001 (v4.0.0) ← 基于 adapters/ 架构
FR-AUTOTRIGGER-001 (自动触发) — 无硬依赖，远期评估

推荐并行组合:
┌─ Wave 1 (v3.0.0) ─────────────────┐
│ FR-QUALITY-001 (Build Wave)        │ ← RICE 9.6, 独立
│ FR-QUALITY-005 (auto-updater)      │ ← RICE 4.8, 快速修复
│ FR-QUALITY-006 (coordinator)       │ ← RICE 2.4, 快速修复
└────────────────────────────────────┘
┌─ Wave 2 (v3.0.0 + v3.1.0) ────────┐
│ FR-QUALITY-002 (Validate E2E)      │ ← RICE 8.4, 依赖 Wave 1 经验
│ FR-KB-001 (全局配置)               │ ← RICE 15.8, 独立
│ FR-BUG-001 (Bug 流程 → Skill)      │ ← RICE 21.0, 无硬依赖，可随时启动
│ FR-WORKTREE-001 (Git Worktree → Skill) │ ← RICE 12.0, 无硬依赖，可独立启动
│ FR-TREE-SKILL (Tree Agent → Skill) 🆕│ ← RICE 17.0, 建议首个启动 (Agent→Skill 降级验证) │
└────────────────────────────────────┘
┌─ Wave 3 (v3.0.0 收尾) ────────────┐
│ FR-QUALITY-003 (Review/Validate)   │ ← 依赖 Wave 1 完成
└────────────────────────────────────┘
┌─ Wave 4 (v3.0.0) ─────────────────┐
│ FR-QUALITY-004 (框架自验证)        │ ← 依赖 Wave 2 Validate E2E
└────────────────────────────────────┘
┌─ Wave 5 (v3.2.0) ─────────────────┐
│ ~~FR-KB-002 (知识沉淀)~~            │ ← ✅ 已完成 (@sddu-docs)
└────────────────────────────────────┘
┌─ Wave 6 (v3.3.0 部分交付完毕 + 剩余) ────┐
│ FR-FAST-001 (快速模式 Agent) ✅            │ ← 已完成 (2026-07-12)
│ FR-SKILL-001 (SDDU Skill 系统) ✅          │ ← 已完成 (2026-07-19)
│ FR-RATIONAL-001 (理性化对抗) 📋            │ ← 待 v3.0~v3.2 交付后启动
└────────────────────────────────────────────┘
┌─ Wave 7 (v4.1.0 远期) ────────────┐
│ FR-CROSSPLAT-001 (多平台) 🆕        │ ← 依赖 v4.0.0 adapters 基础
│ FR-AUTOTRIGGER-001 (自动触发) 🆕    │ ← 无硬依赖
└────────────────────────────────────┘
```

---

### 风险评估

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|:----:|----------|
| **无活跃 Feature 空窗期过长** | 🔴 高 | 🟡 中 | 本周内启动首个 v3.0.0 Feature 的 discovery |
| ~~**FR-ARCH-001 scope 膨胀**~~ | — | — | ✅ 已解决 — v4.0.0 已完成交付，三域分层 + 平台适配器隔离已验证有效 |
| ~~**FR-ARCH-001 引入回归**~~ | — | — | ✅ 已解决 — 全部现有测试通过，npm build/pack 验证通过 |
| **FR-BUG-001 轻/重修复边界模糊** | 🟡 中 | 🟡 中 | discovery 阶段精确定义判定标准（如：变更是否触及 spec.md → 走重修复）；可先硬编码规则再迭代 |
| v3.0.0 范围蔓延 (6 问题全做) | 🔴 高 | 🟡 中 | 严格按优先级排序；A/C 先做，B/D 快速修复可并行 |
| Build Wave 一体化改动大 | 🟡 中 | 🟡 中 | 提前原型验证 build agent 的 multi-wave 能力 |
| Validate E2E 设计复杂度高 | 🟡 中 | 🟡 中 | 分两步：最小可行 E2E runner → 完整框架 |
| Skills/TUI/MCP 持续延期 | 🟢 低 | 🔴 高 | v4.0.0 三域分层架构已完成，Skills/MCP 可基于新架构评估 |
| ~~**KB-002 (知识沉淀) scope 不明确**~~ | — | — | ✅ 已解决 — 通过 `@sddu-docs` Agent 实现，scope 已收缩为「扫描 specs-tree-root 下 Feature 过程产物，聚合为项目全景」 |
| KB-001 (全局配置) schema 争议 | 🟡 中 | 🟡 中 | 参考主流框架实践；充分收拢需求再设计；v4.0.0 三域分层提供平台无关性参考 |
| **FR-WORKTREE-001 嵌套 worktree 检测** 🆕 | 🟡 中 | 🟡 中 | 参考 Superpowers Step 0 检测逻辑；增加环境变量标记避免嵌套 |
| **FR-WORKTREE-001 平台兼容性** 🆕 | 🟢 低 | 🟡 中 | 优先走平台原生工具 → 降级 git worktree add；E2E 测试覆盖多平台 |
| **v3.3.0/v4.1.0 前瞻 Feature 过早承诺** 🆕 | 🟢 低 | 🟡 中 | 标记为 "远期"，不进入近期执行计划；每季度回顾一次是否启动评估 |
| **FR-FAST-001 纯一次性无追溯** | ~~🟡 中~~ → ✅ 已解决 | — | ✅ FR-FAST-001 已交付 — Fast 模式定位为"低风险快速任务"专用，Agent prompt 中明确建议重要变更走完整流程 |
| **FR-FAST-001 Agent 边界判断不准** | ~~🟡 中~~ → ✅ 已解决 | — | ✅ FR-FAST-001 已交付 — @sddu-fast 模板内置复杂度评估清单，用户显式选择路径 |
| **FR-FAST-001 与完整流程的割裂** | ~~🟢 低~~ → ✅ 已解决 | — | ✅ FR-FAST-001 已交付 — 轻重双入口体系就绪 |
| **FR-SKILL-001 用户不主动填充 skills** | 🔴 高 → 🟡 中 | 🟡 中 | FR-SKILL-001 基础设施已就绪（三元闭环 + 双层架构）；skill-creator Skill 降低创建门槛；Agent 可在发现重复模式时建议用户物化为 Skill。实际填充率仍需观察 |
| **FR-SKILL-001 混合触发匹配准确率低** | ~~🟡 中~~ → ✅ 已解决 | — | ✅ FR-SKILL-001 采用三阶段渐进披露模型（Stage 1 零 token → Stage 2 frontmatter → Stage 3 按需加载），不依赖关键词匹配；SDDU Agent 扫描源目录，OpenCode 原生 skill 机制按语义匹配 |
| **FR-SKILL-001 Skills 冗余/过时管理** | 🟡 中 | 🟢 低 | 每个 skill 需记录 last-updated；Agent 在相关任务后可建议用户检查 skill 是否需更新。FR-SKILL-001 已交付 discovery/creator/sync 三元闭环，过时管理待运营经验积累 |
| **FR-BUG-001 / FR-WORKTREE-001 Skill 化降级后 scope 漂移** 🆕 | 🟡 中 | 🟡 中 | Skill 化后 Feature 的 scope 边界可能模糊——"创建一个 Skill"是否还需要完整 SDDU 8 阶段流程？缓解：(1) 在 v3.1.0 discovery 阶段明确定义 Skill 化 Feature 的轻量流程；(2) FR-SKILL-001 的 skill-creator Skill 可作为创建过程的辅助工具 |
| **FR-SKILL-001 框架级 Skill 与 Agent 新增门禁的实际执行力** 🆕 | 🟡 中 | 🟡 中 | FR-SKILL-001 定义的 Agent 新增门禁（「必须证明 Skill 无法满足」）目前是约定而非代码强制。缓解：在 FR-RATIONAL-001 中可将门禁规则纳入 Agent 模板的 HARD-GATE 约束，提升执行力 |
| **v3.3.0 两 Feature 提前交付后的版本空窗** 🆕 | 🟡 中 | 🟢 低 | FR-FAST-001 和 FR-SKILL-001 提前交付后，v3.3.0 仅剩 FR-RATIONAL-001，版本定位从「三大 Feature 汇入」变为「单项收尾」。缓解：不影响 v3.0.0~v3.2.0 的优先级；FR-RATIONAL-001 可与前序版本 Feature 并行启动 |
| **FR-TREE-SKILL Agent→Skill 降级后能力丢失** 🆕 | 🟡 中 | 🟢 低 | @sddu-tree 降级为 Skill 后，TREE 生成由各 Agent 自行执行（按 Skill 指引），可能产生「各 Agent 生成的 TREE 格式不一致」问题。缓解：(1) Skill body 中定义严格的 TREE 格式模板；(2) sddu-validate 可新增 TREE 一致性检查；(3) 降级后对比原 Agent 生成的 TREE 输出确保等价性 |
| **FR-TREE-SKILL 模板引用更新遗漏** 🆕 | 🟡 中 | 🟡 中 | 8+ Agent 模板中散落 `@sddu-tree` 调用指令（既有自动触发声明，也有显式引用），批量替换时可能遗漏。缓解：(1) 全局 grep 审计 `@sddu-tree` 所有引用位置；(2) 替换后运行现有验证确保无回归；(3) FR-SKILL-001 的 Skill 发现声明已在各 Agent 中注入 → 可自然过渡 |
| **FR-TREE-SKILL 用户依赖 @sddu-tree 手动调用** 🆕 | 🟢 低 | 🟡 中 | 用户可能习惯 `@sddu-tree` 显式调用目录导航。Skill 化后用户无法直接 `@sddu-tree`，需通过 Agent 的 Skill 加载机制间接使用。缓解：(1) 在 ROADMAP 和 CHANGELOG 中说明变更；(2) `@sddu` coordinator 指令中新增「目录导航：加载 sddu-tree Skill」说明；(3) 保持向后兼容 — 如频繁收到用户反馈，可考虑保留轻量别名 |

---

## 下一步行动

### 🔴 立即行动 (本周)

1. **启动首个 v3.0.0 Feature** — 建议按以下决策树选择:
   - **如优先解决最大痛点**: 启动 `FR-QUALITY-001 (Build Wave 一体化)` — RICE 9.6，独立性强
   - **如优先解决架构基础**: 启动 `FR-KB-001 (全局项目配置)` — RICE 15.8，全局影响力最大
   - **如优先快速收益**: 同时启动 `FR-QUALITY-005 (auto-updater)` + `FR-QUALITY-006 (coordinator)` — 总 Effort 仅 2-4 天
   - **如优先框架级质量能力 + Skill 化验证**: 启动 `FR-BUG-001 (Bug 流程框架化)` — 以 Skill 化路径（sddu-bug Skill），验证 FR-SKILL-001 的 Skill 化降级模型实战效果
   - **🔥 推荐首启**: `FR-TREE-SKILL (@sddu-tree Agent 技能化)` — RICE 17.0，Effort 仅 1.5d，是 Skill 化降级最纯粹验证案例。成功后直接减少 1 个 Agent，建立「辅助 Agent 优先 Skill 化」范本

2. **确认 Feature 归属版本** — 当前方案:
    - A-F → v3.0.0 (质量与工作流改进)
    - **FR-BUG-001 (Bug 流程框架化 → sddu-bug Skill 化)** + **FR-WORKTREE-001 (Git Worktree → sddu-worktree Skill 化)** + **FR-TREE-SKILL (@sddu-tree Agent 技能化 → sddu-tree Skill 化)** → v3.1.0 (Skill 化降级验证)
    - H → ✅ 已完成 (FR-KB-002)；I → v3.2.0 (知识基础设施)
    - G → ✅ 已完成 (FR-TPL-001, v3.0.1)
    - **FR-FRAMEWORK-ARCH-001** → ✅ 已完成 (v4.0.0)
    - **FR-FAST-001** → ✅ 已完成 (v3.3.0 提前交付, 2026-07-12)
    - **FR-SKILL-001** → ✅ 已完成 (v3.3.0-early, 2026-07-19)
    - **FR-RATIONAL-001** → v3.3.0 (Agent 理性化对抗，唯一剩余)
    - **FR-CROSSPLAT-001 + FR-AUTOTRIGGER-001** → v4.1.0 (远期)
    - 是否需要调整归属？

3. **提交 `src/skills/` 到版本控制**: `git add src/skills/ && git commit` — FR-SKILL-001 validation 发现 src/skills/ 为 untracked（3 个框架级 Skill 文件存在于磁盘但未 add）

4. **运行残留检查**: `bash scripts/check-sdd-residue.sh`

### 🟡 短期行动 (2 周内)

4. 对选中 Feature 执行完整 SDDU 工作流: `discovery → spec → plan → tasks`
5. **对于 FR-BUG-001 / FR-WORKTREE-001 / FR-TREE-SKILL**: 优先以 Skill 化路径启动 — 使用 `sddu-skill-creator` 创建框架级 Skill，通过 `sddu-skill-sync` 同步，验证 FR-SKILL-001 的降级模型实战效果。建议启动顺序：FR-TREE-SKILL (Agent→Skill 降级，最快验证) → FR-BUG-001 (Feature→Skill 降级，高价值) → FR-WORKTREE-001 (Feature→Skill 降级)
6. 在首个 v3.0.0 Feature 的 discovery 阶段，收集更多上下文信息

### 🟢 中期行动 (1 个月内)

7. 完成 v3.0.0 全部 P0 级 Feature
8. 启动 v3.1.0 Feature — **优先以 Skill 化路径**，建议启动顺序: **FR-TREE-SKILL (Agent→Skill 降级，最快 1.5d 交付)** → FR-BUG-001 (sddu-bug Skill) → FR-WORKTREE-001 (sddu-worktree Skill)，验证三种降级模型
9. 为 FR-KB-001 收拢需求，基于 v4.0.0 三域分层架构协同设计 (FR-KB-002 已由 @sddu-docs 提前完成)

### 🔵 远期行动 (季度回顾)

10. 每季度回顾竞品借鉴项 (FR-RATIONAL-001 / FR-CROSSPLAT-001 / FR-AUTOTRIGGER-001) 是否达到启动条件
11. FR-RATIONAL-001 启动条件: v3.0.0~v3.2.0 全部交付 + 用户反馈 Agent 偷懒/走形式问题频发。建议采用「Skill 知识库 + 模板强制约束」混合方案
12. 每季度回顾 FR-SKILL-001 的运营效果：用户填充 skills 的活跃度、Skill 化降级模型的实际价值、Agent 新增门禁的执行情况
13. FR-CROSSPLAT-001 启动条件: OpenCode 之外的主流 AI Agent 平台明确需求 + adapters/ 架构成熟
14. FR-AUTOTRIGGER-001 启动条件: 用户反馈 "忘记调用 @sddu" 成为痛点

---

## 附录 A: Feature 文件覆盖率检查

### 各 Feature 文件产出物一览

| Feature | discovery | spec | plan | tasks | build | review | validation |
|---------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| sdd-plugin-baseline | — | ✅ | ✅ | ✅ | — | — | — |
| sdd-tools-optimization | — | ✅ | ✅ | ✅ | — | ✅ | ✅ |
| deprecate-sdd-tools | — | ✅ | ✅ | ✅ | — | ✅ | ✅ |
| directory-optimization | — | ✅ | ✅ | ✅ | — | ✅ | ✅ |
| plugin-rename-sddu | — | — | — | — | — | — | ✅(json) |
| plugin-rename-sddu-v2 | — | ✅ | ✅ | ✅ | — | ✅ | ✅ |
| sdd-discovery-feature | — | ✅ | ✅ | ✅ | — | ✅ | ✅ |
| sdd-multi-module | — | ✅ | ✅ | ✅ | — | ✅ | ✅ |
| sdd-plugin-roadmap | — | ✅ | ✅ | ✅ | — | ✅ | ✅ |
| sdd-workflow-state-optimization | — | ✅ | ✅ | ✅ | — | — | — |
| tree-structure-optimization | ✅ | ✅ | ✅ | ✅ | — | ✅ | ✅ |
| tree-structure-optimization-v2 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| agent-output-templating | ✅ | ✅ | ✅ | ✅ | — | ✅ | ✅ |
| sddu-status-enhancement | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| template-quality-unification 🆕 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| framework-architecture 🆕 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| sddu-fast 🆕 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| skill-system 🆕 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| solo-team-flow (终止) | ✅ | — | — | — | — | — | — |

> ✅ = 文件存在  — = 文件缺失 (可能因 Feature 时代/类型不同)

---

## 附录 B: 全量审计 — 所有待处理项目清单 (2026-06-13 深度扫描)

### 分类汇总

| 类别 | 数量 | 说明 |
|------|:----:|------|
| 🐛 Bug / 质量问题 | 10 | A-F + 4 预存测试失败 |
| ✨ 增强特性 | 18→16 | H-I + BUG-001 + WORKTREE-001 + TREE-SKILL + RATIONAL-001 + CROSSPLAT-001 + AUTOTRIGGER-001 + FR-014~016 + Skills/TUI/MCP + 文档模板化 + 命名标准化 + FeatureStateEnum 清理 — SKILL-001 和 FAST-001 从待实现移至已完成 |
| 🔧 技术债务 | 9 | deprecated 类型、旧 schema、stale spec.json、仪表盘 TS 化、缺集成测试等 |
| 📄 文档/配置 | 7 | TREE.md 过时、冗余 wave1 文件、路径引用错误、ROADMAP 结构混乱等 |
| ⏸️ 搁置但需关注 | 4 | ETD 独立仓库、Skills/TUI/MCP 持续延期 |

**总计: 45 个待处理项目** (↓2: FR-FAST-001 已于 2026-07-12 交付；↓2: FR-SKILL-001 已于 2026-07-19 交付；↓1: Issue G 已于 v3.0.1 解决；↓1: FR-FRAMEWORK-ARCH-001 已于 v4.0.0 交付；↓1: Issue H (FR-KB-002) 已由 @sddu-docs 完成；↑1: FR-BUG-001 新提案；↑5: 竞品借鉴 — FAST-001 + WORKTREE-001 + RATIONAL-001 + CROSSPLAT-001 + AUTOTRIGGER-001；↑1: FR-SKILL-001 新提案 → ✅；↑1: FR-TREE-SKILL 新提案；净变化 46→45)

### 🐛 一、待修复 Bug / 质量问题 (10 项)

| # | 名称 | 类型 | 严重度 | Effort | 优先级 | 来源 | 描述 |
|:--|------|:----:|:------:|:------:|:------:|------|------|
| **A** | sddu-build Wave 衔接断裂 | 🐛 Bug | 🔴 高 | L (3-5d) | **P0** | E2E | build agent 被多次调用 (每个 wave 一次)，理想应一次完成全部 wave。`sddu` coordinator 反复重启 build → 效率低、中间状态污染 |
| **B** | auto-updater Phase 推断顺序错误 | 🐛 Bug | 🟡 中 | S (1-2d) | **P2** | E2E | Wave 1 完成时 state.json 就出现 `phase: "builded"`；`inferCurrentPhaseFromFiles()` 中 `reviewed` 在 `builded` 前检查 → 推断提前 |
| **C** | validate agent 不做真正 E2E 测试 | 🐛 Bug | 🔴 高 | L (5-7d) | **P0** | E2E | 当前只做静态合规检查（文件存在、spec 覆盖率），不执行端到端行为验证。E2E 应属于 validated 阶段核心职责 |
| **D** | Coordinator 调用 bash 工具失败 | 🐛 Bug | 🟢 低 | XS (<1d) | **P3** | E2E | opencode 环境中 bash 工具可能不可用，`invalid [tool=bash]` 错误（已自愈） |
| **E** | 框架级系统验证层缺失 | 🐛 Bug | 🟡 中 | L (5-7d) | **P1** | E2E | 框架 Feature 需要验证"SDDU 本身还能正常工作"，当前无标准化流程 |
| **F** | Review/Validate 阶段缺设计规划 | 🐛 Bug | 🟡 中 | M (3-5d) | **P1** | E2E | build 阶段经历设计规划产出质量高，同为实施阶段的 review/validate 未经历 |
| **T2** | wf-state-optimization phaseHistory 重复 | 🐛 Bug | 🟢 低 | XS (<1d) | **P3** | state.json | phaseHistory 中有重复条目（从 tasked 回退到 specified 又回到 tasked），数据虽不影响功能但混淆调试 |
| **T3** | agent-output-templating spec.json state 过期 | 🐛 Bug | 🟢 低 | XS (<1d) | **P3** | spec.json | `"phase": "planned", "state": "specified"` — 实际 feature 早已 validated，spec.json 未同步更新 |

### ✨ 二、待实现的增强特性 (15 项)

| # | 名称 | 类型 | Effort | 优先级 | 归属 | 描述 |
|:--|------|:----:|:------:|:------:|:-----|------|
| **I** | 全局项目配置文件 | ✨ Enhancement | M (3-5d) | **P0** | v3.2.0 | `.sddu/project.json` — 技术栈、命名规范、代码风格等全局配置，RICE 15.8 排名第一 |
| **BUG-001** | Bug 追踪与修复流程框架化 🔄 | ✨ Enhancement | S (~2d) | **P0** | v3.1.0 | 🔄 Skill 化候选 → `sddu-bug` Skill。Bug 模板 + 轻/重修复规则封装为框架级 Skill，Agent 按需加载。原 Effort M(4d) → S(2d) |
| **WORKTREE-001** | Git Worktree Feature 隔离 🔄 | ✨ Enhancement | S (~1.5d) | **P2** | v3.1.0 | 🔄 Skill 化候选 → `sddu-worktree` Skill。Worktree 创建/初始化/收尾封装为框架级 Skill。原 Effort M(4d) → S(1.5d) |
| **TREE-SKILL** 🆕 | @sddu-tree Agent 技能化 🔄 | ✨ Enhancement | S (~1.5d) | **P0** | v3.1.0 | 🔄 Agent→Skill 降级 → `sddu-tree` Skill。现有 Agent 降级为框架级 Skill，减少 Agent 数量 + 建立降级范本。最纯粹降级验证 |
| **H** | ✅ 项目级知识自动沉淀 (FR-KB-002) | ✨ Enhancement | — | **P1** | ✅ 已完成 | ✅ 由 `@sddu-docs` Agent 实现 — 扫描 specs-tree-root，聚合 Feature 过程产物为项目全景文档 |
| **FAST-001** | ✅ @sddu-fast 快速模式 Agent (FR-FAST-001) | ✨ Enhancement | — | **P0** | ✅ v3.3.0 | ✅ 已于 2026-07-12 完成交付 — 轻重双模入口 |
| **SKILL-001** | ✅ SDDU Skill 系统 (FR-SKILL-001) | ✨ Enhancement | — | **P0** | ✅ v3.3.0-early | ✅ 已于 2026-07-19 完成交付 — 三元闭环 + 双层架构 + Agent 门禁 |
| **S1** | FR-014: 模板校验工具命令 | ✨ Enhancement | M (3-5d) | **P2** | Could Have | `@sddu-validate-template` 命令，用户可提前验证模板正确性 (spec 中标记 "未来") |
| **S2** | FR-015: 多套内置模板风格 | ✨ Enhancement | M (3-5d) | **P3** | Could Have | 简洁版/详细版等多套模板风格，通过配置切换 (spec 中标记 "未来") |
| **S3** | FR-016: 模板版本管理 | ✨ Enhancement | M (3-5d) | **P3** | Could Have | 模板版本管理，与 Agent 版本对应 (spec 中标记 "未来") |
| **S4** | Skills 系统 (v2.5.0 遗留) | ✨ Enhancement | — | **P2** | ✅ 已解决 | ✅ 原 v2.5.0 遗留 Skill 机制需求 — 通过 FR-SKILL-001 实现解决 |
| **S5** | TUI 界面 | ✨ Enhancement | L (>7d) | **P3** | v3.1.0 遗留 | v2.5.0 遗留：终端 UI 交互界面 |
| **S6** | MCP 集成 | ✨ Enhancement | L (>7d) | **P3** | v3.1.0 遗留 | v2.5.0 遗留：Model Context Protocol 集成 |
| **S7** | 文件命名标准化 | ✨ Enhancement | S (1-2d) | **P2** | v2.7.0 遗留 | 统一 validate.md / validation.md / validation-report.md 等命名不一致 |
| **S8** | FeatureStateEnum 清理 | ✨ Enhancement | XS (<1d) | **P1** | v3.1.0 遗留 | 移除 `@deprecated` 的 `FeatureStateEnum` 类型别名 (status-enhancement 延后) |
| **S9** | docs Agent 输出模板化 | ✨ Enhancement | S (1-2d) | **P3** | 未来 | agent-output-templating 只覆盖 6 主流程 Agent，docs/roadmap/help 辅助 Agent 待模板化 |
| **WORKTREE-001** 🆕 | Git Worktree Feature 隔离 | ✨ Enhancement | M (3-5d) | **P2** | v3.1.0 | 竞品借鉴 §5.2.1 — Worktree 创建/初始化/收尾全生命周期 |
| **RATIONAL-001** 🆕 | Agent 理性化对抗 | ✨ Enhancement | M (3-4d) | **P1** | v3.3.0 | 竞品借鉴 §5.1.2 — Common Rationalizations 表 + Red Flags + HARD-GATE |
| **CROSSPLAT-001** 🆕 | 多平台适配支持 | ✨ Enhancement | XL (>10d) | **P3** | v4.1.0 | 竞品借鉴 §5.3.1 — 基于 adapters/ 扩展到非 OpenCode 平台 |
| **AUTOTRIGGER-001** 🆕 | Agent 自动触发机制 | ✨ Enhancement | S (1-2d) | **P3** | v4.1.0 | 竞品借鉴 §5.3.2 — 会话启动注入 @sddu 入口指令 |

> **注**: ~~G: 预置输出模板质量统一~~ 已于 2026-06-19 通过 FR-TPL-001 (v3.0.1) 完成。~~H (FR-KB-002): 项目级知识自动沉淀~~ 已于 2026-07-11 由 @sddu-docs Agent 完成。全 22 FR + 3 NFR 100% 通过，17 个模板 + 11 个 Agent 职责边界声明全部到位。

### 🔧 三、技术债务 (9 项)

| # | 名称 | 类型 | Effort | 优先级 | 描述 |
|:--|------|:----:|:------:|:------:|------|
| **TD1** | 仪表盘渲染逻辑 TypeScript 化 | 🔧 Tech-Debt | M (3-5d) | **P2** | `sddu.md.hbs` 中分类/排序/过滤逻辑依赖 AI 理解，迁入 `src/state/dashboard-renderer.ts` 可单元测试 |
| **TD2** | consistency-checker 缺集成测试 | 🔧 Tech-Debt | S (1-2d) | **P2** | 当前仅有单元测试 (28 用例)，建议补充含真实 `.sddu/` 目录结构的集成测试 |
| **TD3** | schema-v1.2.5.ts 保留 | 🔧 Tech-Debt | XS (<1d) | **P3** | 旧版 schema 文件保留仅作测试/参考用途，无功能依赖 |
| **TD4** | schema-v2.0.0.ts 保留 | 🔧 Tech-Debt | XS (<1d) | **P3** | 同上，旧版 schema 文件 |
| **TD5** | status-enhancement spec.json 过期 | 🔧 Tech-Debt | XS (<1d) | **P3** | `"phase": "planned", "status": "tracked"` — 实际已 validated/completed |
| **TD6** | agent-output-templating spec.json 过期 | 🔧 Tech-Debt | XS (<1d) | **P3** | `"phase": "planned", "state": "specified"` — 实际已 validated |
| **TD7** | root state.json features.completed 命名陈旧 | 🔧 Tech-Debt | XS (<1d) | **P3** | 仍使用 "T-001 ~ T-018" 命名空间（plugin-rename 时代的迁移任务），未反映当前 Feature 结构 |
| **TD8** | 实际 AI Agent 行为验证缺失 | 🔧 Tech-Debt | M (3-5d) | **P2** | 建议在实际 opencode 环境中执行 `@sddu 状态` 并对比预期效果与模板描述是否一致 |
| **TD9** | agent-output-templating plan.md 改进项 | 🔧 Tech-Debt | XS (<1d) | **P3** | 审查报告的改进项 #2：plan.md 示例路径引用，非阻塞 |

### 📄 四、文档/配置类 (7 项)

| # | 名称 | 类型 | Effort | 优先级 | 描述 |
|:--|------|:----:|:------:|:------:|------|
| **DOC1** | ✅ `.sddu/TREE.md` 路径引用已修复 | 📄 Doc | — | ✅ 已完成 | TREE.md 已全局替换为 `.sddu/` 路径。ROADMAP 审计确认 |
| **DOC2** | `.sddu/docs/` 冗余 Wave1 迁移文件 (17+) | 📄 Doc | XS (<1d) | **P2** | 17+ 个 `migration-status-achieved-wave1-*-verified-final-...` 文件，大量冗余可归档 |
| **DOC3** | `COMPLETION_CERTIFICATE.json` 路径引用过时 | 📄 Doc | XS (<1d) | **P3** | 第 47 行 `"file": ".sdd/specs-tree-root/..."` 仍引用 `.sdd/` |
| **DOC4** | `.sddu/TREE.md` 可能列出不存在命令 | 📄 Doc | XS (<1d) | **P3** | 原描述引用 `.sddu/README.md`（文件已不存在），实际导航文件为 TREE.md。需确认 TREE.md 中的命令引用是否有效 |
| **DOC5** | `architecture/TREE.md` ADR 数量未含 Feature 目录下的 ADR-018~020 | 📄 Doc | XS (<1d) | **P3** | TREE.md 记录 17 篇 ADR，全项目实际共 20 篇（Feature 目录下有 ADR-018/019/020）。原描述引用的 README.md 已不存在 |
| **DOC6** | `.sddu/docs/` 导航未包含 v3.0.0 Roadmap | 📄 Doc | XS (<1d) | **P3** | 原描述引用 `.sddu/docs/README.md`（文件已不存在），实际导航文件为 `docs/TREE.md`，未提及 v3.0.0 |
| **DOC7** | ROADMAP 文档结构混乱，目录格式不可读 🆕 | 📄 Doc | S (1-2d) | **P2** | ROADMAP.md 当前 800+ 行，用户反馈"目录格式看不懂，乱七八糟的"。来源: 用户反馈 2026-07-11 |

### ⏸️ 五、搁置但需关注 (4 项)

| # | 名称 | 状态 | Effort | 触发条件 | 描述 |
|:--|------|:----:|:------:|----------|------|
| **SUS1** | ETD-001: Solo Team Flow | 🚫 terminated-and-migrated | L (>7d) | 独立仓库创建 | ETD 已迁出为独立项目，但 `targetRepo: "独立仓库（待创建）"` — 需在合适的时机创建 ETD 独立仓库 |
| **SUS2** | Skills/TUI/MCP 持续延期 | ⏸️ suspended (隐式) | L (>7d) | v3.1.0 启动 | v2.5.0 遗留，ROADMAP 多次记录但至今未启动 discovery |
| **SUS3** | wf-state-optimization 缺 review/validation | ⏸️ 已标记 | N/A | — | Feature 在 state.json 中标记 completed 但 `files` 字段无 review/validation — 可能是 pre-SDDU 时代特征，功能已完成 |
| **SUS4** | 预存测试 4 失败 | ⏸️ 已知 | S (1-2d) | — | 2 timeout + 1 断言 + 1 OOM，status-enhancement 中标记为非本次引入，需专门修复 |

### 📈 全量优先级总排名 (Top 20 — 移除已完成项)

| 排名 | ID | 名称 | 类型 | 归属 | Effort | RICE | 优先级 |
|:----:|----|------|:----:|------|:------:|:----:|:------:|
| 🥇 | **I** | 全局项目配置文件 | ✨ | v3.2.0 | M | 15.8 | **P0** |
| 🥈 | **TREE-SKILL** 🆕 | @sddu-tree Agent 技能化 (→ sddu-tree Skill) | ✨ | v3.1.0 | S | 17.0 | **P0** |
| 🥉 | **BUG-001** 🔄 | Bug 流程框架化 (→ sddu-bug Skill) | ✨ | v3.1.0 | S | 21.0 | **P0** |
| 4 | **A** | Build Wave 一体化 | 🐛 | v3.0.0 | L | 9.6 | **P0** |
| 4 | **RATIONAL-001** | Agent 理性化对抗 | ✨ | v3.3.0 | M | 9.6 | **P1** |
| 5 | **C** | Validate Agent E2E | 🐛 | v3.0.0 | L | 8.4 | **P0** |
| 6 | **AUTOTRIGGER-001** | Agent 自动触发 | ✨ | v4.1.0 | S | 7.5 | **P3** |
| 7 | **F** | Review/Validate 设计规划 | 🐛 | v3.0.0 | M | 5.3 | **P1** |
| 8 | **B** | auto-updater 修复 | 🐛 | v3.0.0 | S | 4.8 | **P2** |
| 9 | **WORKTREE-001** 🔄 | Git Worktree (→ sddu-worktree Skill) | ✨ | v3.1.0 | S | 12.0 | **P2** |
| 10 | **E** | 框架自验证 | 🐛 | v3.0.0 | L | 2.8 | **P1** |
| 11 | **D** | coordinator 兼容 | 🐛 | v3.0.0 | XS | 2.4 | **P3** |
| 12 | **CROSSPLAT-001** | 多平台适配 | ✨ | v4.1.0 | XL | 2.4 | **P3** |
| 13 | **S8** | FeatureStateEnum 清理 | ✨ | v3.1.0 | XS | — | **P1** |
| 14 | **T1** | 预存测试修复 | 🐛 | — | S | — | **P2** |
| 15 | **TD1** | 仪表盘 TS 化 | 🔧 | — | M | — | **P2** |
| 16 | **TD2** | consistency-checker 集成测试 | 🔧 | — | S | — | **P2** |
| 17 | **DOC1** | TREE.md sdd→sddu | 📄 | — | XS | — | **P2** |
| 18 | **DOC2** | Wave1 冗余文件归档 | 📄 | — | XS | — | **P2** |
| 19 | **S7** | 文件命名标准化 | ✨ | — | S | — | **P2** |
| 20 | **TD8** | AI Agent 行为验证 | 🔧 | — | M | — | **P2** |
| — | ~~FAST-001~~ | ✅ @sddu-fast 快速模式 Agent | ✨ | ✅ v3.3.0 | — | 21.6 | ✅ |
| — | ~~SKILL-001~~ | ✅ SDDU Skill 系统 | ✨ | ✅ v3.3.0-early | — | 17.5 | ✅ |
| — | ~~H~~ | ✅ 项目知识沉淀 (FR-KB-002) | ✨ | ✅ | — | 4.0 | ✅ |
| — | ~~S4~~ | ✅ Skills 系统 (v2.5.0 遗留) | ✨ | ✅ | — | — | ✅ (FR-SKILL-001 解决) |
| — | **S1** | 模板校验工具 | ✨ | Could Have | M | — | **P2** |
| — | **DOC3-6** | 路径/数量修正 | 📄 | — | XS×4 | — | **P3** |
| — | **TD3** | schema-v1.2.5 清理 | 🔧 | — | XS | — | **P3** |

### 🗺️ 推荐执行顺序

```
Phase 0 — ✅ 已完成 (v3.0.1, 2026-06-19)
├── ✅ FR-TPL-001 (模板质量统一) — RICE 7.5，22 FR + 3 NFR 100% 通过
├── ✅ FR-FAST-001 (快速模式 Agent v3.3.0) — RICE 21.6，2026-07-12
└── ✅ FR-SKILL-001 (SDDU Skill 系统 v3.3.0-early) — RICE 17.5，2026-07-19

Phase 1 — 🔥 立即启动 (本周)
├── 🔴 P0: FR-QUALITY-001 (Build Wave 一体化) — RICE 9.6，独立性强
├── 🔴 P0: FR-KB-001 (全局项目配置) — RICE 15.8，全局影响力最大
├── 🔴 P0: FR-TREE-SKILL → sddu-tree Skill — RICE 17.0 (S, 1.5d)，Agent→Skill 降级最纯粹验证
├── 🔴 P0: FR-BUG-001 → sddu-bug Skill — RICE 21.0 (Skill 化后)，验证 Feature→Skill 降级
└── 🟢 快速穿插: D (coordinator) + B (auto-updater) — 合共 1-3 天

Phase 2 — 🟡 第二周
├── 🔴 P0: FR-QUALITY-002 (Validate E2E) — RICE 8.4，依赖 Phase 1 经验
├── 🔴 P0: FR-WORKTREE-001 → sddu-worktree Skill — RICE 12.0 (Skill 化后)，验证第二个降级模型
├── 🟡 P1: FR-QUALITY-003 (Review/Validate 设计规划)
├── 🟡 P1: S8 (FeatureStateEnum 清理) — XS，顺手做
└── 🟡 P2: T1 (预存测试修复) + TD2 (集成测试)

Phase 3 — 🟡 第三~四周
├── 🟡 P1: FR-QUALITY-004 (框架自验证) — 依赖 Validate E2E
├── ~~FR-KB-002 (知识沉淀)~~ → ✅ 已完成 (@sddu-docs)
└── 📄 P2: DOC2 (Wave1 文件归档) + TD1 (仪表盘 TS 化)

Phase 4 — 🟢 后续 (v3.1.0/v3.2.0)
├── ~~FR-ARCH-001 (SDDU 架构解耦)~~ → ✅ v4.0.0 已完成 (2026-06-21)
├── ~~S4 (Skills 系统)~~ → ✅ 通过 FR-SKILL-001 实现解决
├── S7 (文件命名标准化) + S9 (docs 模板化) + TD8 (AI Agent 行为验证) + S1 (模板校验工具)
├── 📄 DOC1 + DOC3-6 (路径/引用修正，批量处理)
└── v3.2.0 FR-KB-001 (全局配置) — 与 v3.0.0 P0 Feature 协同推进

Phase 5 — 🔄 v3.3.0 部分交付 + 收尾
├── ✅ FR-FAST-001 (快速模式 Agent) — 已完成 (2026-07-12)
├── ✅ FR-SKILL-001 (SDDU Skill 系统) — 已完成 (2026-07-19)
├── 📋 FR-RATIONAL-001 (理性化对抗) — v3.3.0 唯一剩余，等 v3.0~v3.2 交付后启动
├── S5 (TUI) + S6 (MCP) — 持续延期，无明确需求（可通过 Skill 化实现部分能力）
├── SUS3 (wf-state 缺 review/validation) — 历史 feature，不需要补
└── TD3/TD4 (旧 schema) + TD5-7/TD9 (stale spec.json) — 低优先级清理
```

### ⚡ 本周速赢清单 (Effort ≤ XS-S, 可立即执行，总耗时 ~2.5h)

| # | 项目 | 时间 | 价值 |
|---|------|:--:|------|
| 1 | **DOC1**: TREE.md `.sdd`→`.sddu` 全局替换 | 30min | 消除根目录误导 |
| 2 | **S8**: FeatureStateEnum deprecated 别名移除 | 30min | 完成方案 B 迁移 |
| 3 | **T3 + TD5 + TD6**: 3 个 spec.json 同步更新 | 15min | 消除 stale 数据 |
| 4 | **DOC3**: COMPLETION_CERTIFICATE.json 路径修正 | 5min | 消除过时引用 |
| 5 | **T2**: wf-state-optimization phaseHistory 去重 | 10min | 数据整洁 |
| 6 | **D**: coordinator bash 工具兼容性 | 1h | RICE 2.4 |
| **合计** | **6 项速赢** | **~2.5h** | **快速降低技术债** |

---

## 📁 相关文档

- 📁 **全局状态**: [state.json](./specs-tree-root/state.json)
- 📝 **规范目录导航**: [specs-tree-root/README.md](./specs-tree-root/README.md)
- 📋 **状态增强验证报告**: [specs-tree-sddu-status-enhancement/validation-report.md](./specs-tree-root/specs-tree-sddu-status-enhancement/validation-report.md)
- 🏗️ **架构决策记录**: [architecture/adr/](./specs-tree-root/architecture/adr/)
- 📁 **项目 README**: [../../../README.md](../../../README.md)

---

> **文档维护**: 本 Roadmap 是动态文档。建议每季度回顾更新，或每当一个 Feature 完成 validated 阶段时运行 `@sddu-roadmap` 刷新状态。

> **生成信息**: 本文档由 `@sddu-roadmap` Agent 于 2026-06-21 重大更新 (v9.0.0)，反映 FR-FRAMEWORK-ARCH-001 (v4.0.0) 已完成交付。
> 
> **最近更新 (v16.0.0)**: 2026-07-19 — FR-TREE-SKILL (@sddu-tree Agent 技能化) 新增。更新内容：
> - **FR-TREE-SKILL 🆕**: @sddu-tree Agent 技能化提案 — RICE 17.0，Effort S(1.5d)，归属 v3.1.0。Agent→Skill 降级的最纯粹验证案例（区别于 FR-BUG-001/WORKTREE-001 的 Feature→Skill 降级）
> - **v3.1.0 定位强化**: 从 2 个 Skill 化候选扩展到 3 个，新增 FR-TREE-SKILL 作为首个 Agent→Skill 降级验证
> - **Skill 化影响总结**: 新增 FR-TREE-SKILL 行 + 「类型」列（Agent→Skill vs Feature→Skill），总 Effort 更新为 5d
> - **RICE 排名刷新**: 插入 FR-TREE-SKILL (17.0, 🥈)；FR-BUG-001 Skill 化后 (21.0, 🥇)；FR-KB-001 降至 🥉
> - **依赖关系更新**: 新增 FR-TREE-SKILL 依赖链（强依赖 FR-SKILL-001 + 影响 8 Agent 模板 + 自举性质）
> - **风险评估更新**: 新增 3 项 FR-TREE-SKILL 专属风险（能力丢失、引用遗漏、用户依赖）
> - **下一步行动更新**: FR-TREE-SKILL 推荐为首个 v3.1.0 启动项（最快验证，1.5d 交付）
> - **统计数字变化**: 待处理项目 44→45，新提案 1→2，Skill 化候选 2→3
