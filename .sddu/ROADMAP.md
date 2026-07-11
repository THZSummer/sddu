# SDDU 项目版本 Roadmap

> **文档版本**: 13.0.0
> **更新日期**: 2026-07-11 (ROADMAP 审计整改 — FR-QUALITY-002/006 + Issue C/D + DOC1/4/5/6 + T1 删除)
> **状态**: 规划中 (v3.0.0 待启动)
> **生成方式**: `@sddu-roadmap` 全量扫描 17 Feature 的 state.json + spec.md + tasks.md + spec.json + validation-report.md + docs/ + TREE.md + 用户新需求评估 + Superpowers 竞品调研导入
> **当前项目版本**: v4.0.0
> **全局状态**: 16 validated, 0 tracked, 1 terminated | 待处理项目: 47 | 新提案: 2 (FR-BUG-001, FR-SKILL-001) | 竞品借鉴: 5 🆕

---

## 执行摘要 (前 20%)

### 愿景陈述

SDDU (Spec-Driven Development Unified) 是一套面向 AI 辅助开发的规范驱动工作流框架。通过 11 个专业化 Agent 协同工作，覆盖从问题挖掘 (discovery)、需求定义 (spec)、技术设计 (plan)、任务分解 (tasks)、实施构建 (build)、审查 (review) 到验证 (validate) 的完整开发生命周期。项目自 2026 年 3 月启动，已迭代至 v4.0.0，完成 16 个核心 Feature，当前聚焦 v3.0.0 质量与工作流改进。

项目的长期愿景是成为 AI 辅助软件工程的标准工作流框架 — 让 AI Agent 不仅能写代码，更能通过规范化流程保证交付质量、沉淀项目知识、持续自我演进。v3.0.0 系列将重点解决框架自身的质量闭环问题（Build Wave 一体化、Validate E2E 能力、框架级自验证），v3.2.0 将引入项目知识基础设施（全局配置 + 知识自动沉淀）。v4.0.0 已完成三域分层架构重组，为 SDDU 的跨平台扩展奠定基础。

### 项目状态速览

| 指标 | 值 |
|------|-----|
| **Feature 总数** | 17 |
| **已完成 (completed)** | 16 |
| **已终止 (terminated/migrated)** | 1 |
| **进行中 (tracked)** | **0** ⚠️ |
| **搁置 (suspended)** | 0 |
| **已知待解决问题** | **47 (A-F + H-I 核心 + BUG-001 + SKILL-001 + 5 竞品借鉴 + 32 审计发现)** |
| **规划中版本** | v3.0.0, v3.1.0, v3.2.0, v3.3.0 (搁置，含 FAST-001 + RATIONAL-001 + SKILL-001), v4.1.0 (远期) |

### ⚠️ 关键警示

> **当前无活跃 Feature！** 自 2026-06-21 `specs-tree-framework-architecture` (FR-FRAMEWORK-ARCH-001) validated 后，项目处于无进行中 Feature 的空窗期。v3.0.0 的 6 个核心问题 (A-F) 已记录但尚未启动任何 Feature 的 discovery 流程。Issue G (模板质量) 已通过 FR-TPL-001 (v3.0.1) 解决完成。

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
| **v3.1.0** | 工具链增强 | TBD | 💡 提议中 | FR-BUG-001 Bug 流程 + FR-WORKTREE-001 Git Worktree 隔离 |
| **v3.2.0** | 项目知识基础设施 (H-I) | TBD | 💡 提议中 | 全局配置 + 知识沉淀 |
| **v3.3.0** | Agent 行为强化 (延期汇入) | TBD | ⏸️ 搁置 | FR-RATIONAL-001 理性化对抗 + FR-FAST-001 快速模式 (竞品借鉴) + FR-SKILL-001 项目级业务 Skills |
| **v4.1.0** | 生态扩展 (远期) | TBD | 💡 远期 | 多平台适配 + 自动触发 (竞品借鉴 §5.3) |

### 本周优先事项 (2026-06-21 ~ 2026-06-28)

- [x] ~~**🟡 重要**: 评审 G 问题 (模板质量)，确认 scope 边界~~ → ✅ 已完成 (FR-TPL-001, v3.0.1)
- [ ] **🔴 紧急**: 启动首个 v3.0.0 Feature (建议 FR-QUALITY-001 / FR-KB-001 / FR-BUG-001) 的 discovery 流程
- [ ] **🟡 重要**: 评审 H/I 新增问题，确认 scope 边界
- [ ] **🟡 重要**: 决定 v3.0.0 / v3.1.0 / v3.2.0 的 Feature 归属和启动顺序
- [ ] **🟢 日常**: 运行残留检查脚本，确保无回归
- [ ] **⚡ 速赢**: 执行 5 项速赢任务 (~2h)：TREE.md 路径修正、FeatureStateEnum 清理、stale spec.json 同步、COMPLETION_CERTIFICATE 修正、phaseHistory 去重

### 功能优先级 Top 5 (跨版本 RICE 排名)

| 排名 | 功能 | 版本 | Reach | Impact | Conf. | Effort | **RICE** | 优先级 |
|:----:|------|:----:|:-----:|:------:|:-----:|:------:|:--------:|:------:|
| 🥇 | **FR-FAST-001**: 快速模式 Agent 🆕 | v3.3.0 | 9 | 8 | 60% | 2 | **21.6** | P0 |
| 🥈 | **FR-KB-001**: 全局项目配置 | v3.2.0 | 10 | 9 | 70% | 4 | **15.8** | P0 |
| 🥉 | **FR-BUG-001**: Bug 流程框架化 | v3.1.0 | 8 | 7 | 75% | 4 | **10.5** | P0 |
| 4 | **FR-QUALITY-001**: Build Wave 一体化 | v3.0.0 | 6 | 8 | 80% | 4 | **9.6** | P0 |
| 5 | **FR-RATIONAL-001**: 理性化对抗 🆕 | v3.3.0 | 8 | 6 | 70% | 3.5 | **9.6** | P1 |

> **注**: Issue G (模板质量) 已通过 FR-TPL-001 (v3.0.1) 解决完成，FR-FRAMEWORK-ARCH-001 (架构重组) 已于 v4.0.0 完成交付，均不参与排名。🆕 FR-FAST-001 (v3.3.0, RICE 21.6) 为 2026-07-11 竞品调研 + 用户战略决策新纳入；FR-RATIONAL-001/FR-WORKTREE-001/FR-AUTOTRIGGER-001/FR-CROSSPLAT-001 为同期竞品调研新纳入；FR-SKILL-001 (v3.3.0, RICE 7.9) 为用户战略决策新纳入。完整 RICE 排名见「跨版本 RICE 总排名」节。

### 关键 milestones

| 日期 | Milestone | 版本 |
|------|-----------|:----:|
| ✅ 2026-06-19 | v3.0.1 发布 — 模板质量统一 | v3.0.1 |
| ✅ 2026-06-21 | v4.0.0 发布 — SDDU 框架源码架构重组 | v4.0.0 |
| 2026-06-28 | 首个 v3.0.0 Feature discovery 完成 | v3.0.0 |
| 2026-07-05 | 首个 v3.0.0 Feature spec + plan 完成 | v3.0.0 |
| 2026-07-19 | v3.0.0 首批 P0 Feature validated | v3.0.0 |
| 2026-08-30 | v3.0.0 全部 Feature 完成 | v3.0.0 |
| 2026-Q4 | v3.1.0 FR-BUG-001 + FR-WORKTREE-001 discovery + v3.2.0 评估 | v3.1.0 / v3.2.0 |
| 2027+ | v3.3.0 FR-RATIONAL-001 + FR-FAST-001 + FR-SKILL-001 评估启动 / v4.1.0 远期生态扩展评估 | v3.3.0 / v4.1.0 |

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
            ↓
2026-Q3    📋  v3.0.0 质量与工作流改进
```

---

## 版本详细规划 (后 80%)

### 已完成版本回顾

#### Feature 全量状态扫描

##### 已完成 Feature (15 个)

> **注**: 本表含最新完成的 FR-FRAMEWORK-ARCH-001 (v4.0.0)。共 16 个已完成 Feature。

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

### v3.1.0 — 工具链增强

**预计时间**: TBD (建议 v3.0.0 启动后评估)
**状态**: 💡 提议中
**主题**: Bug 流程框架化 + 其他增强项

**背景**: FR-FRAMEWORK-ARCH-001 (架构解耦) 已超前于 v4.0.0 完成交付。v3.1.0 的定位从"架构解耦与增强"调整为"工具链增强"，聚焦遗留改进和 Bug 流程框架化。Skills/TUI/MCP 等项继续搁置。

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

### v3.2.0 — 项目知识基础设施

**预计时间**: TBD (依赖 v3.1.0 部分完成)
**状态**: 💡 提议中
**新增问题**: H (知识沉淀), I (全局配置)
**注意**: FR-FRAMEWORK-ARCH-001 (v4.0.0) 已完成的三域分层架构为 KB-001 的配置格式设计提供了清晰的平台无关性参考。

| Feature | 覆盖 | 优先级 | Effort | 说明 |
|---------|:----:|:------:|--------|------|
| **FR-KB-001**: 全局项目配置文件 | I | 🥇 P0 | 3-5 天 | `.sddu/project.json` — 技术栈、命名规范、代码风格等 |
| **FR-KB-002**: 项目级知识自动沉淀 | H | 🥈 P1 | 7-10 天 | 聚合 Feature 产出物为项目总览文档 (依赖 KB-001) |

**RICE 分析 (H-I 问题)**:

| 排名 | Feature | Reach | Impact | Conf. | Effort | **RICE** | 优先级 |
|:----:|---------|:-----:|:------:|:-----:|:------:|:--------:|:------:|
| 🥇 | FR-KB-001 (全局配置) | 10 | 9 | 70% | 4 | **15.8** | P0 |
| 🥈 | FR-KB-002 (知识沉淀) | 8 | 8 | 50% | 8 | **4.0** | P1 |

---

### v3.3.0 — Agent 行为强化 (延期汇入)

**预计时间**: TBD (依赖 v3.0.0 ~ v3.2.0 全部交付)
**状态**: ⏸️ 搁置
**注意**: 本版本为延期 Feature 的汇入点，待前置版本交付后再启动 discovery。

#### 延期 Feature: FR-RATIONAL-001 — Agent 理性化对抗 🆕 (竞品借鉴)

> **来源**: [Superpowers 竞品调研 §5.1.2](../../docs/research/superpowers-competitor-analysis.md#512-理性化对抗-rationalization-bulletproofing)
> **加入日期**: 2026-07-11

| 属性 | 值 |
|------|-----|
| **Feature ID** | FR-RATIONAL-001 |
| **优先级** | 🥈 P1 (RICE 9.6) |
| **Effort** | M (3-4 天) |
| **来源** | 竞品调研 — Superpowers 的 Common Rationalizations 表 + Red Flags + `<HARD-GATE>` 标签 |
| **归属** | v3.3.0 (推迟汇入) |

**背景**: Superpowers 在每个纪律性 skill 中内置 Common Rationalizations 表（借口 vs 现实）+ Red Flags - STOP 列表 + `<HARD-GATE>` 标签强化关键约束。SDDU 当前仅有"不跳步""不越界"等基础约束，缺乏系统性的 Agent 理性化对抗。SDDU 的代码级状态机（PhaseReversalError）能堵住显式违规，但堵不住隐式偷懒（如 review 走形式、validate 不真跑）。理性化对抗是 Prompt 层的免疫系统，和代码层的状态机形成双重防线。

**核心目标**: 为所有核心阶段 Agent 模板增加理性化对抗表，提升 Agent 执行纪律性。

**预期范围** (待 discovery 阶段细化):
1. **Common Rationalizations 表** — 为 spec/plan/build/review/validate 各阶段定义 Agent 常见借口 + 反驳
2. **Red Flags — STOP 列表** — 每个阶段的"出现以下情况立即停止并报告用户"的硬条件
3. **`<HARD-GATE>` 等价标签** — 关键指令的权威性标注（不改变 Markdown 渲染）
4. **模板标准化** — 类似 FR-TPL-001 (v3.0.1)，纯模板内容变更，不改运行时代码

**RICE 详细分析**:

| 维度 | 评分 | 依据 |
|------|:---:|------|
| Reach | **8** | 影响全部核心 Agent 的每次调用，覆盖所有用户 |
| Impact | **6** | 显著降低 Agent "自作主张"（跳步、偷懒、走形式）的发生率 |
| Confidence | **70%** | 纯模板内容变更，与 FR-TPL-001 模式一致；实际效果依赖 AI 对自然语言指令的遵从度 |
| Effort | **3.5** | 中等：设计 6 阶段 Rationalizations 表 (1.5d) + 模板写入 (1d) + 验证 (0.5d) + discovery (0.5d) |
| **RICE** | **9.6** | **(8 × 6 × 0.7) / 3.5** |

**与其他 Feature 的依赖关系**:

```
FR-RATIONAL-001 (理性化对抗) ──借用──→ FR-TPL-001 (模板系统) — 共用 Handlebars 模板引擎
FR-RATIONAL-001 (理性化对抗) ──互补──→ 状态机 (PhaseReversalError) — Prompt 层 + 代码层双重防线
FR-RATIONAL-001 (理性化对抗) ──无硬依赖──→ 可独立启动 (仅模板内容变更)
```

**建议**: 推迟至 v3.3.0，等 v3.0.0~v3.2.0 全部交付后再启动。纯模板层改动，启动后 Effort 仅 3-4d，可作为 v3.3.0 首个 Feature 快速交付。

---

#### 延期 Feature: FR-FAST-001 — @sddu-fast 快速模式 Agent 🆕 (竞品借鉴 + 用户战略决策)

> **来源**: Superpowers 竞品调研 — Superpowers 的核心优势是"轻"：无状态机、无编译、纯 Markdown skill 自动触发、对话式推进
> **加入日期**: 2026-07-11
> **决策来源**: 用户战略确认（轻重双模演进方向）

| 属性 | 值 |
|------|-----|
| **Feature ID** | FR-FAST-001 |
| **优先级** | 🥇 P0 (RICE 21.6，跨版本第 1 位) |
| **Effort** | XS (1-2 天) |
| **来源** | 竞品调研 — Superpowers 的轻量性：纯 Markdown、无状态机、无编译、对话式推进 + 用户战略决策 |
| **归属** | v3.3.0 (搁置池，与 FR-RATIONAL-001 同版) |

**背景**: Superpowers 的核心竞争力在于"轻"—用户说"实现登录功能"，Agent 自动从 brainstorming 开始，轻量对话式推进，用户几乎无感。SDDU 的 8 阶段状态机对复杂 Feature 是质量保障，但对简单任务（bug 修复、小功能、配置调整等 60-70% 的日常工作）是过度工程。SDDU 当前缺少"轻量入口"，用户要么走完整 8 阶段，要么不用 SDDU，没有中间地带。这是 SDDU 从"重型框架"向"轻重双模"演进的关键一步。

**核心目标**: 提供一个零摩擦的轻量入口，让用户在不值得走完整 8 阶段流程时也能享受 SDDU Agent 的能力。Fast 模式不追求文档可追溯，核心在于快速解决问题。

**用户确认的设计决策（不可更改）**:

1. **Agent 形态**: `@sddu-fast` 独立 Agent
   - 有自己的 .hbs 模板和职责定义
   - 独立注册到 OpenCode subagent 系统
   - 不走状态机，不依赖 SDDU 核心状态管理

2. **内部流程**: 无阶段，纯对话
   - 理解问题 → 直接解决 → 验证结果
   - 零中间产物，不产出 discovery.md / spec.md / plan.md 等

3. **升级路径**: 纯一次性
   - 解决完就结束，不留痕
   - 不写 state.json，不进 specs-tree-root
   - 如果 Fast 发现问题复杂，Agent 可建议用户切换到 `@sddu 开始` 走完整流程（仅建议，不自动升级）

4. **版本归属**: v3.3.0（搁置池）
   - 与 FR-RATIONAL-001 同属 v3.3.0
   - 启动条件: v3.0.0~v3.2.0 全部交付后启动

**预期范围** (待 discovery 阶段细化):
1. `@sddu-fast` Agent 模板（.hbs）— 定义快速模式的行为约束和对话策略
2. Agent 注册 — 独立注册到 OpenCode subagent，不走状态机
3. 智能边界判断 — Agent 评估问题复杂度，如发现复杂建议升级到 `@sddu 开始`
4. 可选的 TDD / 调试能力引入 — 按需引入 Superpowers 式的轻量技能（先写测试再写代码、根因分析等），但不是必须

**RICE 详细分析**:

| 维度 | 评分 | 依据 |
|------|:---:|------|
| Reach | **9** | 影响所有 SDDU 用户，覆盖 60-70% 日常工作场景（bug 修复、小功能、配置调整等） |
| Impact | **8** | 显著降低使用门槛，从"重型框架"变"轻重双模"；零摩擦入口消除用户对 SDDU 的抵触心理 |
| Confidence | **60%** | 概念清晰且有 Superpowers 成功验证；但纯一次性无追溯的效果需验证，Agent 边界判断能力待评估 |
| Effort | **2** | 极低：一个 .hbs 模板 (0.5d) + Agent 注册 (0.3d) + 基础验证 (0.5d) + discovery (0.2d) |
| **RICE** | **21.6** | **(9 × 8 × 0.6) / 2** |

**与其他 Feature 的依赖关系**:

```
FR-FAST-001 (快速模式) ──借用──→ FR-TPL-001 (模板系统) — 共用 Handlebars 模板引擎生成 .hbs
FR-FAST-001 (快速模式) ──独立于──→ 状态机 — 不走 StateMachine，不依赖 pipeline/ 模块
FR-FAST-001 (快速模式) ──互补──→ SDDU 完整流程 — 轻/重双入口，覆盖不同复杂度场景
FR-FAST-001 (快速模式) ──无硬依赖──→ 可独立启动 (仅模板 + Agent 注册)
FR-FAST-001 (快速模式) ──启发自──→ Superpowers — 轻量对话式、无状态机、无编译
```

**建议**: 推迟至 v3.3.0，等 v3.0.0~v3.2.0 全部交付后再启动。Effort 极低 (1-2d)，可与 FR-RATIONAL-001 同期启动。二者互补：理性化对抗强化重型流程的 Agent 纪律，Fast 模式开辟轻量入口 — 共同构成 SDDU "轻重双模"的完整 Agent 体系。

---

#### 新增 Feature: FR-SKILL-001 — 项目级业务 Skills 🆕 (用户战略决策)

> **来源**: 用户战略决策 (2026-07-11)，竞品调研启发 — Superpowers 的 skills 概念启发了这个设计，但 SDDU 的 skills 是业务化的、用户填充的
> **加入日期**: 2026-07-11
> **决策来源**: 用户确认设计决策（存放位置 / 内容格式 / 触发机制 / 版本归属）

| 属性 | 值 |
|------|-----|
| **Feature ID** | FR-SKILL-001 |
| **优先级** | 🥈 P1 (RICE 7.9) |
| **Effort** | M (3-5 天) |
| **来源** | 用户战略决策 — SDDU 需要项目级业务知识沉淀机制，让用户手写可复用执行流程，Agent 按需发现并加载 |
| **归属** | v3.3.0 (搁置池，与 FR-FAST-001 + FR-RATIONAL-001 同版) |

**背景**: 用户项目里某类事情的执行流程没有地方沉淀，每次新会话、新需求都要重新和 Agent 描述，低效繁琐。例如"接入新的支付渠道"这件事，每次都要重新解释路由在哪、验签怎么写、回调怎么处理、测试怎么跑。这不是配置问题（FR-KB-001 解决不了），也不是历史 Feature 文档聚合（FR-KB-002 解决不了），而是项目特有的、可复用的执行流程知识。

当前生态里这个问题普遍存在：
- **CLAUDE.md / AGENTS.md**: 静态全量加载，不按上下文触发，长了就爆 context
- **Superpowers 的 skills**: 通用方法论（TDD、调试），不是项目业务知识
- **Cursor 的 .cursorrules**: 规则约束，不是流程指引

**与已有规划的本质区别**:
| Feature | 类型 | 内容 | 定位 |
|---------|------|------|------|
| **FR-KB-001** (全局配置) | 声明式配置 | 技术栈、命名规范、代码风格 | 静态的「是什么」 |
| **FR-KB-002** (知识沉淀) | 自动聚合 | Feature 产出物自动汇总 | 过去的「做了什么」 |
| **FR-SKILL-001** (业务 Skills) | 用户手写流程 | 项目特有的可复用执行流程 | 未来的「怎么做某类事」 |

三者本质不同，不应混并。

**核心目标**: 提供一个项目级业务知识沉淀机制，用户填充可复用执行流程，SDDU Agent 在相关任务时自动发现并应用，避免每次新会话重复描述。

**用户确认的设计决策（不可更改）**:

1. **存放位置**: `.sddu/skills/`
   - 与 Superpowers 的 skills 概念对齐，但内容是项目业务知识
   - 和 specs-tree-root 平级，属于 SDDU 工作空间的一部分

2. **内容格式**: 标准 skill 格式
   - 结构化 Markdown + frontmatter (name / tags / when)
   - 类似 Superpowers 的 SKILL.md 写法，用户可直接参考
   - 不用 .hbs 模板引擎，纯用户手写

3. **触发机制**: 混合模式
   - Agent 工作时自动扫描 `.sddu/skills/` 目录
   - 按关键词 / tags 匹配当前任务上下文
   - 匹配到后推荐给用户，用户确认后才加载（避免误匹配）
   - 不像 Superpowers 那样强制触发，也不像 CLAUDE.md 那样全量加载

4. **版本归属**: v3.3.0（搁置池）
   - 与 FR-FAST-001 / FR-RATIONAL-001 同版
   - 启动条件: v3.0.0~v3.2.0 全部交付后启动

**预期范围** (待 discovery 阶段细化):
1. **Skills 目录结构** — `.sddu/skills/` 目录 + 标准 skill 文件规范（frontmatter：name / tags / when）
2. **扫描与匹配引擎** — Agent 启动时扫描 `skills/`，按 tags 匹配当前任务上下文，生成推荐列表
3. **用户确认机制** — 匹配后通过对话推荐给用户，用户选择加载后才注入 Agent 上下文
4. **Agent 模板集成** — 在 `@sddu` coordinator 的 .hbs 模板中增加 skills 扫描与推荐逻辑
5. **示例 Skills** — 提供 2-3 个示例 skill 文件帮助用户上手（如：接入支付渠道、部署检查清单、数据库迁移流程）

**RICE 详细分析**:

| 纬度 | 评分 | 依据 |
|------|:---:|------|
| Reach | **9** | 影响所有 SDDU 用户的所有项目，覆盖高频的「重复描述」场景 — 几乎所有复杂项目都需要沉淀执行流程 |
| Impact | **8** | 显著提升效率，消除「每次重新描述」的摩擦；Agent 获得项目上下文后产出质量也提升；用户投资（手写 skill）有长期复用回报 |
| Confidence | **55%** | 概念清晰（Superpowers skills 已验证），但混合触发的匹配准确率需验证；用户是否会主动填充 skills 需观察；推荐确认机制可能增加交互步数 |
| Effort | **5** | 中等：skills 目录扫描逻辑 (1d) + frontmatter 解析 + 匹配推荐 (1.5d) + Agent 模板集成 (1d) + 示例 skills (0.5d) + discovery/spec (1d) |
| **RICE** | **7.9** | **(9 × 8 × 0.55) / 5** |

**与其他 Feature 的依赖关系**:

```
FR-SKILL-001 (业务 Skills) ──独立于──→ FR-KB-001 (全局配置) — Skills 是流程知识，不是声明式配置，不依赖 KB-001
FR-SKILL-001 (业务 Skills) ──互补于──→ FR-KB-002 (知识沉淀) — KB-002 聚合「过去的」产出物，Skills 指导「未来的」执行
FR-SKILL-001 (业务 Skills) ──借用──→ FR-TPL-001 (模板系统) — Coordinator 模板中增加 skills 扫描逻辑，共用 Handlebars 引擎
FR-SKILL-001 (业务 Skills) ──独立于──→ 状态机 — Skills 由 Agent 按需加载，不经过 pipeline 流转
FR-SKILL-001 (业务 Skills) ──无硬依赖──→ 可独立启动 (纯目录扫描 + 模板变更)
FR-SKILL-001 (业务 Skills) ──启发自──→ Superpowers — skills 概念 + SKILL.md 格式参考，但内容为项目业务知识
```

**建议**: 推迟至 v3.3.0，等 v3.0.0~v3.2.0 全部交付后再启动。FR-SKILL-001 与 FR-FAST-001 + FR-RATIONAL-001 共同构成 v3.3.0 的三大支柱：Fast 解决「轻量入口」问题、Rational 解决「Agent 纪律」问题、Skills 解决「项目知识复用」问题。三者互补，无需串行依赖。

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

### 跨版本 RICE 总排名 (全部 15 项: A-F + H-I + BUG-001 + FAST-001 + SKILL-001 + WORKTREE-001 + RATIONAL-001 + CROSSPLAT-001 + AUTOTRIGGER-001)

| 排名 | Feature | 归属 | Reach | Impact | Conf. | Effort | **RICE** | 优先级 |
|:----:|---------|:----:|:-----:|:------:|:-----:|:------:|:--------:|:------:|
| 🥇 | **FR-FAST-001**: 快速模式 Agent 🆕 | v3.3.0 | 9 | 8 | 60% | 2 | **21.6** | P0 |
| 🥈 | **FR-KB-001**: 全局项目配置 | v3.2.0 | 10 | 9 | 70% | 4 | **15.8** | P0 |
| 🥉 | **FR-BUG-001**: Bug 流程框架化 | v3.1.0 | 8 | 7 | 75% | 4 | **10.5** | P0 |
| 4 | **FR-QUALITY-001**: Build Wave 一体化 | v3.0.0 | 6 | 8 | 80% | 4 | **9.6** | P0 |
| 5 | **FR-RATIONAL-001**: 理性化对抗 🆕 | v3.3.0 | 8 | 6 | 70% | 3.5 | **9.6** | P1 |
| 6 | **FR-QUALITY-002**: Validate E2E | v3.0.0 | 8 | 9 | 70% | 6 | **8.4** | P0 |
| 7 | **FR-SKILL-001**: 项目级业务 Skills 🆕 | v3.3.0 | 9 | 8 | 55% | 5 | **7.9** | P1 |
| 8 | **FR-AUTOTRIGGER-001**: 自动触发 🆕 | v4.1.0 | 6 | 5 | 50% | 2 | **7.5** | P3 |
| 9 | **FR-QUALITY-003**: Review/Validate 设计 | v3.0.0 | 5 | 7 | 60% | 4 | **5.3** | P1 |
| 10 | **FR-QUALITY-005**: auto-updater 修复 | v3.0.0 | 3 | 4 | 80% | 2 | **4.8** | P2 |
| 11 | **FR-WORKTREE-001**: Git Worktree 🆕 | v3.1.0 | 5 | 6 | 60% | 4 | **4.5** | P2 |
| 12 | **FR-KB-002**: 项目知识沉淀 | v3.2.0 | 8 | 8 | 50% | 8 | **4.0** | P1 |
| 13 | **FR-QUALITY-004**: 框架自验证 | v3.0.0 | 4 | 7 | 60% | 6 | **2.8** | P1 |
| 14 | **FR-QUALITY-006**: coordinator 兼容 | v3.0.0 | 2 | 3 | 80% | 2 | **2.4** | P2 |
| 15 | **FR-CROSSPLAT-001**: 多平台适配 🆕 | v4.1.0 | 9 | 8 | 40% | 12 | **2.4** | P3 |

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
            ├── FR-BUG-001 (Bug 流程框架化) — 新提案 → v3.1.0
            ├── FR-WORKTREE-001 (Git Worktree 隔离) 🆕 — 竞品借鉴 §5.2.1 → v3.1.0
            ├── FR-KB-001 (全局项目配置) — Issue I → v3.2.0
            └── FR-KB-002 (项目知识沉淀) — Issue H → v3.2.0 (依赖 KB-001)

            ▼  ─── ⏸️ v3.3.0 搁置 ───
            ├── FR-RATIONAL-001 (理性化对抗) 🆕 — 竞品借鉴 §5.1.2 → v3.3.0
            ├── FR-FAST-001 (快速模式 Agent) 🆕 — 竞品借鉴 + 用户战略决策 → v3.3.0
            └── FR-SKILL-001 (项目级业务 Skills) 🆕 — 用户战略决策 → v3.3.0

            ▼  ─── 💡 v4.1.0 远期 ───
            ├── FR-CROSSPLAT-001 (多平台适配) 🆕 — 竞品借鉴 §5.3.1 → v4.1.0
            └── FR-AUTOTRIGGER-001 (自动触发) 🆕 — 竞品借鉴 §5.3.2 → v4.1.0

specs-tree-solo-team-flow (ETD-001) ──────────── 🚫 terminated → 独立仓库
```

#### 执行依赖分析

```
FR-KB-001 (全局配置) ──→ FR-KB-002 (知识沉淀)         ← 配置是知识沉淀的前提
FR-BUG-001 (Bug 流程) ──受益于──→ FR-KB-001 (全局配置)   ← 全局配置可定义 bug 严重度等级
FR-BUG-001 (Bug 流程) ──借用──→ FR-TPL-001 (模板系统)   ← 共用 Handlebars 模板引擎
FR-WORKTREE-001 (Worktree) ──受益于──→ FR-MULTI-001 (多模块) ← Worktree 为子 Feature 提供物理隔离
FR-WORKTREE-001 (Worktree) ──受益于──→ FR-KB-001 (全局配置) ← 全局配置可定义默认 worktree 行为
FR-RATIONAL-001 (理性化) ──借用──→ FR-TPL-001 (模板系统)  ← 纯模板层变更，共用 Handlebars 引擎
FR-FAST-001 (快速模式) 🆕 ──借用──→ FR-TPL-001 (模板系统)  ← 纯模板层变更，共用 Handlebars 引擎
FR-FAST-001 (快速模式) 🆕 ──独立于──→ 状态机 (pipeline/)  ← 不走状态机，不依赖 state.json
FR-FAST-001 (快速模式) 🆕 ──互补──→ SDDU 完整流程       ← 轻/重双入口，覆盖不同复杂度
FR-SKILL-001 (业务 Skills) 🆕 ──独立于──→ FR-KB-001 (全局配置) ← Skills 是流程知识，不是声明式配置
FR-SKILL-001 (业务 Skills) 🆕 ──互补于──→ FR-KB-002 (知识沉淀) ← KB-002 聚合过去产物，Skills 指导未来执行
FR-SKILL-001 (业务 Skills) 🆕 ──借用──→ FR-TPL-001 (模板系统) ← Coordinator 模板中增加 skills 扫描逻辑
FR-SKILL-001 (业务 Skills) 🆕 ──独立于──→ 状态机 (pipeline/) ← Skills 由 Agent 按需加载，不经过 pipeline 流转
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
│ FR-BUG-001 (Bug 流程)              │ ← RICE 10.5, 无硬依赖，可随时启动
│ FR-WORKTREE-001 (Git Worktree) 🆕   │ ← RICE 4.5, 无硬依赖，可独立启动
└────────────────────────────────────┘
┌─ Wave 3 (v3.0.0 收尾) ────────────┐
│ FR-QUALITY-003 (Review/Validate)   │ ← 依赖 Wave 1 完成
└────────────────────────────────────┘
┌─ Wave 4 (v3.0.0) ─────────────────┐
│ FR-QUALITY-004 (框架自验证)        │ ← 依赖 Wave 2 Validate E2E
└────────────────────────────────────┘
┌─ Wave 5 (v3.2.0) ─────────────────┐
│ FR-KB-002 (知识沉淀)               │ ← 依赖 KB-001
└────────────────────────────────────┘
┌─ Wave 6 (v3.3.0 搁置) ────────────┐
│ FR-RATIONAL-001 (理性化对抗) 🆕     │ ← 等 v3.0~v3.2 交付后启动
│ FR-FAST-001 (快速模式 Agent) 🆕    │ ← 等 v3.0~v3.2 交付后启动，Effort 1-2d
│ FR-SKILL-001 (项目级业务 Skills) 🆕 │ ← 等 v3.0~v3.2 交付后启动，Effort 3-5d
└────────────────────────────────────┘
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
| KB-002 (知识沉淀) scope 不明确 | 🟡 中 | 🔴 高 | 依赖 KB-001 先落地；discovery 阶段详细界定 |
| KB-001 (全局配置) schema 争议 | 🟡 中 | 🟡 中 | 参考主流框架实践；充分收拢需求再设计；v4.0.0 三域分层提供平台无关性参考 |
| **FR-WORKTREE-001 嵌套 worktree 检测** 🆕 | 🟡 中 | 🟡 中 | 参考 Superpowers Step 0 检测逻辑；增加环境变量标记避免嵌套 |
| **FR-WORKTREE-001 平台兼容性** 🆕 | 🟢 低 | 🟡 中 | 优先走平台原生工具 → 降级 git worktree add；E2E 测试覆盖多平台 |
| **v3.3.0/v4.1.0 前瞻 Feature 过早承诺** 🆕 | 🟢 低 | 🟡 中 | 标记为 "远期"，不进入近期执行计划；每季度回顾一次是否启动评估 |
| **FR-FAST-001 纯一次性无追溯** 🆕 | 🟡 中 | 🟡 中 | Fast 模式不产出任何文档或 state.json — 问题解决后无审计痕迹。缓解：通过 Agent prompt 建议用户对重要变更走完整流程；Fast 模式定位为"低风险快速任务"专用 |
| **FR-FAST-001 Agent 边界判断不准** 🆕 | 🟡 中 | 🟡 中 | Agent 自行判断问题复杂度（Fast 还是完整流程）可能不准确。缓解：在 .hbs 模板中内置复杂度评估清单；允许用户显式选择路径（`@sddu-fast` vs `@sddu 开始`） |
| **FR-FAST-001 与完整流程的割裂** 🆕 | 🟢 低 | 🟢 低 | 两种模式之间无数据互通，用户可能困惑何时用哪个。缓解：`@sddu` 入口增加智能路由提示；Fast Agent 检测到复杂问题时主动建议升级 |
| **FR-SKILL-001 用户不主动填充 skills** 🆕 | 🔴 高 | 🟡 中 | Skills 的价值依赖用户持续填充 — 如果用户不写 skills，整个功能将成为空壳。缓解：&zero-width-space;(1) 提供初版示例 skills 降低上手门槛；(2) Agent 在发现重复操作模式时主动建议用户物化为 skill；(3) 在 v3.3.0 discovery 阶段设计技能发现 UI |
| **FR-SKILL-001 混合触发匹配准确率低** 🆕 | 🟡 中 | 🟡 中 | 基于 keywords/tags 的自动匹配可能误推荐（不相关 skill）或漏推荐（相关 skill 未匹配）。缓解：&zero-width-space;(1) 使用关键词+语义双通道匹配；(2) 用户确认机制确保不误加载；(3) v3.3.0 discovery 阶段设计匹配度评分阈值 |
| **FR-SKILL-001 Skills 冗余/过时管理** 🆕 | 🟡 中 | 🟢 低 | 随着项目演进，skills 可能过时或与代码实际行为不一致。缓解：&zero-width-space;(1) 每个 skill 记录 last-updated；(2) Agent 在相关任务后建议用户检查 skill 是否需更新 |
| **v3.3.0 三大 Feature (FAST + RATIONAL + SKILL) 同时启动资源争抢** 🆕 | 🟡 中 | 🟢 低 | 三个 Feature 均为 v3.3.0 归属，若同时启动 discovery 可能分散注意力。缓解：&zero-width-space;FAST-001 Effort 仅 XS (1-2d) 可快速交付；SKILL-001 和 RATIONAL-001 Effort 均为 M (3-5d)，建议 FAST-001 先行作为速赢开路 |

---

## 下一步行动

### 🔴 立即行动 (本周)

1. **启动首个 v3.0.0 Feature** — 建议按以下决策树选择:
   - **如优先解决最大痛点**: 启动 `FR-QUALITY-001 (Build Wave 一体化)` — RICE 9.6，独立性强
   - **如优先解决架构基础**: 启动 `FR-KB-001 (全局项目配置)` — RICE 15.8，全局影响力最大
   - **如优先快速收益**: 同时启动 `FR-QUALITY-005 (auto-updater)` + `FR-QUALITY-006 (coordinator)` — 总 Effort 仅 2-4 天
   - **如优先框架级质量能力**: 启动 `FR-BUG-001 (Bug 流程框架化)` — RICE 10.5，无硬依赖，Effort 仅 3-5d，可快速交付

2. **确认 Feature 归属版本** — 当前方案:
    - A-F → v3.0.0 (质量与工作流改进)
    - **FR-BUG-001 (Bug 流程框架化)** + **FR-WORKTREE-001 (Git Worktree 隔离)** 🆕 → v3.1.0 (工具链增强)
    - H-I → v3.2.0 (知识基础设施)
    - G → ✅ 已完成 (FR-TPL-001, v3.0.1)
    - **FR-FRAMEWORK-ARCH-001** → ✅ 已完成 (v4.0.0, 2026-06-21)
    - **FR-RATIONAL-001 (理性化对抗)** + **FR-FAST-001 (快速模式)** + **FR-SKILL-001 (项目级业务 Skills)** 🆕 → v3.3.0 (搁置，等前置版本交付)
    - **FR-CROSSPLAT-001 + FR-AUTOTRIGGER-001** 🆕 → v4.1.0 (远期)
    - 是否需要调整归属？

3. **运行残留检查**: `bash scripts/check-sdd-residue.sh`

### 🟡 短期行动 (2 周内)

4. 对选中 Feature 执行完整 SDDU 工作流: `discovery → spec → plan → tasks`
5. 在首个 Feature 的 discovery 阶段，收集更多上下文信息
6. 评审 G/H/I 新增问题，确认描述准确性

### 🟢 中期行动 (1 个月内)

7. 完成 v3.0.0 全部 P0 级 Feature
8. 评估 v3.1.0 Feature (FR-BUG-001 + FR-WORKTREE-001) 是否启动
9. 为 FR-KB-001 / FR-KB-002 收拢需求，基于 v4.0.0 三域分层架构协同设计

### 🔵 远期行动 (季度回顾)

10. 每季度回顾竞品借鉴项 (FR-FAST-001 / FR-RATIONAL-001 / FR-SKILL-001 / FR-CROSSPLAT-001 / FR-AUTOTRIGGER-001) 是否达到启动条件
11. FR-RATIONAL-001 启动条件: v3.0.0~v3.2.0 全部交付 + 用户反馈 Agent 偷懒/走形式问题频发
12. FR-FAST-001 启动条件: v3.0.0~v3.2.0 全部交付 + 用户反馈 "简单功能也要走完整流程太繁琐" 成为痛点（RICE 21.6 全榜第一，一旦 v3.2.0 交付应优先启动）
13. FR-SKILL-001 启动条件: v3.0.0~v3.2.0 全部交付 + 用户反馈 "每次新会话都要重复描述项目流程" 成为痛点，或项目 `.sddu/skills/` 目录已有至少 2-3 个手写 skill（证明用户有填充意愿）
14. FR-CROSSPLAT-001 启动条件: OpenCode 之外的主流 AI Agent 平台明确需求 + adapters/ 架构成熟
15. FR-AUTOTRIGGER-001 启动条件: 用户反馈 "忘记调用 @sddu" 成为痛点

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
| solo-team-flow (终止) | ✅ | — | — | — | — | — | — |

> ✅ = 文件存在  — = 文件缺失 (可能因 Feature 时代/类型不同)

---

## 附录 B: 全量审计 — 所有待处理项目清单 (2026-06-13 深度扫描)

### 分类汇总

| 类别 | 数量 | 说明 |
|------|:----:|------|
| 🐛 Bug / 质量问题 | 10 | A-F + 4 预存测试失败 |
| ✨ 增强特性 | 17 | H-I + BUG-001 + SKILL-001 + FAST-001 + WORKTREE-001 + RATIONAL-001 + CROSSPLAT-001 + AUTOTRIGGER-001 + FR-014~016 + Skills/TUI/MCP + 文档模板化 + 命名标准化 + FeatureStateEnum 清理 |
| 🔧 技术债务 | 9 | deprecated 类型、旧 schema、stale spec.json、仪表盘 TS 化、缺集成测试等 |
| 📄 文档/配置 | 7 | TREE.md 过时、冗余 wave1 文件、路径引用错误、ROADMAP 结构混乱等 |
| ⏸️ 搁置但需关注 | 4 | ETD 独立仓库、Skills/TUI/MCP 持续延期 |

**总计: 47 个待处理项目** (↓1: Issue G 已于 v3.0.1 解决；↓1: FR-FRAMEWORK-ARCH-001 已于 v4.0.0 交付；↑1: FR-BUG-001 新提案；↑5: 竞品借鉴 — FAST-001 + WORKTREE-001 + RATIONAL-001 + CROSSPLAT-001 + AUTOTRIGGER-001；↑1: FR-SKILL-001 新提案)

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

### ✨ 二、待实现的增强特性 (18 项)

| # | 名称 | 类型 | Effort | 优先级 | 归属 | 描述 |
|:--|------|:----:|:------:|:------:|:-----|------|
| **I** | 全局项目配置文件 | ✨ Enhancement | M (3-5d) | **P0** | v3.2.0 | `.sddu/project.json` — 技术栈、命名规范、代码风格等全局配置，RICE 15.8 排名第二 |
| **BUG-001** | Bug 追踪与修复流程框架化 | ✨ Enhancement | M (3-5d) | **P0** | v3.1.0 | Bug 模板 + 轻/重修复规则 + 跨项目跟随。当前 bug 目录为临时方案，需提升为框架级能力。RICE 10.5 排名第三 |
| **FAST-001** 🆕 | @sddu-fast 快速模式 Agent | ✨ Enhancement | XS (1-2d) | **P0** | v3.3.0 | 竞品借鉴 + 用户战略 — 零摩擦轻量入口，无状态机、纯对话、不留痕。覆盖 60-70% 日常简单任务。RICE 21.6 全榜第一 |
| **SKILL-001** 🆕 | 项目级业务 Skills | ✨ Enhancement | M (3-5d) | **P1** | v3.3.0 | 用户战略 — `.sddu/skills/` 目录，用户手写可复用执行流程，Agent 按 tags 匹配后推荐加载。与 FR-KB-001 (声明式配置) / FR-KB-002 (自动聚合) 本质不同。RICE 7.9 |
| **H** | 项目级知识自动沉淀 | ✨ Enhancement | L (7-10d) | **P1** | v3.2.0 | 聚合 Feature 产出物为项目总览文档 (依赖 I: 全局配置) |
| **S1** | FR-014: 模板校验工具命令 | ✨ Enhancement | M (3-5d) | **P2** | Could Have | `@sddu-validate-template` 命令，用户可提前验证模板正确性 (spec 中标记 "未来") |
| **S2** | FR-015: 多套内置模板风格 | ✨ Enhancement | M (3-5d) | **P3** | Could Have | 简洁版/详细版等多套模板风格，通过配置切换 (spec 中标记 "未来") |
| **S3** | FR-016: 模板版本管理 | ✨ Enhancement | M (3-5d) | **P3** | Could Have | 模板版本管理，与 Agent 版本对应 (spec 中标记 "未来") |
| **S4** | Skills 系统 | ✨ Enhancement | L (>7d) | **P2** | v3.1.0 遗留 | v2.5.0 遗留：Skill 机制 |
| **S5** | TUI 界面 | ✨ Enhancement | L (>7d) | **P3** | v3.1.0 遗留 | v2.5.0 遗留：终端 UI 交互界面 |
| **S6** | MCP 集成 | ✨ Enhancement | L (>7d) | **P3** | v3.1.0 遗留 | v2.5.0 遗留：Model Context Protocol 集成 |
| **S7** | 文件命名标准化 | ✨ Enhancement | S (1-2d) | **P2** | v2.7.0 遗留 | 统一 validate.md / validation.md / validation-report.md 等命名不一致 |
| **S8** | FeatureStateEnum 清理 | ✨ Enhancement | XS (<1d) | **P1** | v3.1.0 遗留 | 移除 `@deprecated` 的 `FeatureStateEnum` 类型别名 (status-enhancement 延后) |
| **S9** | docs Agent 输出模板化 | ✨ Enhancement | S (1-2d) | **P3** | 未来 | agent-output-templating 只覆盖 6 主流程 Agent，docs/roadmap/help 辅助 Agent 待模板化 |
| **WORKTREE-001** 🆕 | Git Worktree Feature 隔离 | ✨ Enhancement | M (3-5d) | **P2** | v3.1.0 | 竞品借鉴 §5.2.1 — Worktree 创建/初始化/收尾全生命周期 |
| **RATIONAL-001** 🆕 | Agent 理性化对抗 | ✨ Enhancement | M (3-4d) | **P1** | v3.3.0 | 竞品借鉴 §5.1.2 — Common Rationalizations 表 + Red Flags + HARD-GATE |
| **CROSSPLAT-001** 🆕 | 多平台适配支持 | ✨ Enhancement | XL (>10d) | **P3** | v4.1.0 | 竞品借鉴 §5.3.1 — 基于 adapters/ 扩展到非 OpenCode 平台 |
| **AUTOTRIGGER-001** 🆕 | Agent 自动触发机制 | ✨ Enhancement | S (1-2d) | **P3** | v4.1.0 | 竞品借鉴 §5.3.2 — 会话启动注入 @sddu 入口指令 |

> **注**: ~~G: 预置输出模板质量统一~~ 已于 2026-06-19 通过 FR-TPL-001 (v3.0.1) 完成。全 22 FR + 3 NFR 100% 通过，17 个模板 + 11 个 Agent 职责边界声明全部到位。

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

### 📈 全量优先级总排名 (Top 20)

| 排名 | ID | 名称 | 类型 | 归属 | Effort | RICE | 优先级 |
|:----:|----|------|:----:|------|:------:|:----:|:------:|
| 🥇 | **FAST-001** 🆕 | @sddu-fast 快速模式 Agent | ✨ | v3.3.0 | XS | **21.6** | **P0** |
| 🥈 | **I** | 全局项目配置文件 | ✨ | v3.2.0 | M | 15.8 | **P0** |
| 🥉 | **BUG-001** | Bug 追踪与修复流程框架化 | ✨ | v3.1.0 | M | 10.5 | **P0** |
| 4 | **A** | Build Wave 一体化 | 🐛 | v3.0.0 | L | 9.6 | **P0** |
| 5 | **RATIONAL-001** 🆕 | Agent 理性化对抗 | ✨ | v3.3.0 | M | 9.6 | **P1** |
| 6 | **C** | Validate Agent E2E | 🐛 | v3.0.0 | L | 8.4 | **P0** |
| 7 | **SKILL-001** 🆕 | 项目级业务 Skills | ✨ | v3.3.0 | M | **7.9** | **P1** |
| 8 | **AUTOTRIGGER-001** 🆕 | Agent 自动触发 | ✨ | v4.1.0 | S | 7.5 | **P3** |
| 9 | **F** | Review/Validate 设计规划 | 🐛 | v3.0.0 | M | 5.3 | **P1** |
| 10 | **B** | auto-updater 修复 | 🐛 | v3.0.0 | S | 4.8 | **P2** |
| 11 | **WORKTREE-001** 🆕 | Git Worktree 隔离 | ✨ | v3.1.0 | M | 4.5 | **P2** |
| 12 | **H** | 项目知识沉淀 | ✨ | v3.2.0 | L | 4.0 | **P1** |
| 13 | **E** | 框架自验证 | 🐛 | v3.0.0 | L | 2.8 | **P1** |
| 14 | **D** | coordinator 兼容 | 🐛 | v3.0.0 | XS | 2.4 | **P3** |
| 15 | **CROSSPLAT-001** 🆕 | 多平台适配 | ✨ | v4.1.0 | XL | 2.4 | **P3** |
| 16 | **S8** | FeatureStateEnum 清理 | ✨ | v3.1.0 | XS | — | **P1** |
| 17 | **T1** | 预存测试修复 | 🐛 | — | S | — | **P2** |
| 18 | **TD1** | 仪表盘 TS 化 | 🔧 | — | M | — | **P2** |
| 19 | **TD2** | consistency-checker 集成测试 | 🔧 | — | S | — | **P2** |
| 20 | **DOC1** | TREE.md sdd→sddu | 📄 | — | XS | — | **P2** |
| 21 | **DOC2** | Wave1 冗余文件归档 | 📄 | — | XS | — | **P2** |
| 22 | **S4** | Skills 系统 | ✨ | v3.1.0 | L | — | **P2** |
| 23 | **S7** | 文件命名标准化 | ✨ | — | S | — | **P2** |
| 24 | **TD8** | AI Agent 行为验证 | 🔧 | — | M | — | **P2** |
| 25 | **S1** | 模板校验工具 | ✨ | Could Have | M | — | **P2** |
| 26 | **DOC3-6** | 路径/数量修正 | 📄 | — | XS×4 | — | **P3** |
| 27 | **TD3** | schema-v1.2.5 清理 | 🔧 | — | XS | — | **P3** |

### 🗺️ 推荐执行顺序

```
Phase 0 — ✅ 已完成 (v3.0.1, 2026-06-19)
└── ✅ FR-TPL-001 (模板质量统一) — RICE 7.5，22 FR + 3 NFR 100% 通过

Phase 1 — 🔥 立即启动 (本周)
├── 🔴 P0: FR-QUALITY-001 (Build Wave 一体化) — RICE 9.6，独立性强
├── 🔴 P0: FR-KB-001 (全局项目配置) — RICE 15.8，全局影响力最大
└── 🟢 快速穿插: D (coordinator) + B (auto-updater) — 合共 1-3 天

Phase 2 — 🟡 第二周
├── 🔴 P0: FR-QUALITY-002 (Validate E2E) — RICE 8.4，依赖 Phase 1 经验
├── 🔴 P0: FR-BUG-001 (Bug 流程框架化) 🆕 — RICE 10.5，无硬依赖，可独立启动
├── 🟡 P1: FR-QUALITY-003 (Review/Validate 设计规划)
├── 🟡 P1: S8 (FeatureStateEnum 清理) — XS，顺手做
└── 🟡 P2: T1 (预存测试修复) + TD2 (集成测试) + DOC1 (TREE.md)

Phase 3 — 🟡 第三~四周
├── 🟡 P1: FR-QUALITY-004 (框架自验证) — 依赖 Validate E2E
├── 🟡 P1: FR-KB-002 (知识沉淀) — 依赖 KB-001
└── 📄 P2: DOC2 (Wave1 文件归档) + TD1 (仪表盘 TS 化)

Phase 4 — 🟢 后续 (v3.1.0/v3.2.0)
├── ~~FR-ARCH-001 (SDDU 架构解耦)~~ → ✅ v4.0.0 已完成 (2026-06-21)
├── S4 (Skills 系统) + S7 (文件命名标准化) + S9 (docs 模板化)
├── TD8 (AI Agent 行为验证) + S1 (模板校验工具)
└── 📄 DOC3-6 (路径/引用修正，批量处理)

Phase 5 — ⏸️ 搁置 (v3.3.0)
├── FR-FAST-001 (快速模式 Agent) 🆕 — RICE 21.6，Effort XS，等 v3.2.0 交付后优先启动
├── FR-RATIONAL-001 (理性化对抗) 🆕 — RICE 9.6，与 FAST-001 同期启动
├── FR-SKILL-001 (项目级业务 Skills) 🆕 — RICE 7.9，Effort M，等 v3.2.0 交付后与 FAST-001/RATIONAL-001 统筹启动
├── S5 (TUI) + S6 (MCP) — 持续延期，无明确需求
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

> **生成信息**: 本文档由 `@sddu-roadmap` Agent 于 2026-06-21 重大更新 (v9.0.0)，反映 FR-FRAMEWORK-ARCH-001 (v4.0.0) 已完成交付——从「规划中」移至「已交付」，并更新全局状态、优先级排序、依赖图、风险评估、下一步行动。FR-BUG-001 仍为新提案待处理。扫描范围覆盖 `.sddu/specs-tree-root/` 下 17 个 Feature 目录的全部 state.json / spec.md / tasks.md / spec.json / validation-report.md 以及 `.sddu/docs/` / `.sddu/TREE.md` / 架构 ADR 目录。
> 
> **最近更新 (v12.0.0)**: 2026-07-11 — 新增 FR-SKILL-001 (项目级业务 Skills)，源自用户战略决策 — `.sddu/skills/` 目录，用户手写可复用执行流程，Agent 按 tags 匹配后推荐加载。FR-SKILL-001 以 RICE 7.9 位列全榜第 7，归属于 v3.3.0 搁置池，与 FR-FAST-001 + FR-RATIONAL-001 同版。更新内容：RICE 排名表、版本总览、v3.3.0 版本节（新增 FR-SKILL-001 完整规划，含与 FR-KB-001/KB-002 的本质区别说明）、依赖图谱、风险评估（新增 4 项 FR-SKILL-001 相关风险）、远期行动（新增 FR-SKILL-001 启动条件）、附录 B 全量清单（17→18 增强特性，46→47 待处理项目）。同时修正全量优先级总排名表中重复编号问题。
