# SDDU 项目版本 Roadmap

> **文档版本**: 9.0.0
> **更新日期**: 2026-06-21 (重大更新 — FR-FRAMEWORK-ARCH-001 已完成 validated，从规划移至已交付)
> **状态**: 规划中 (v3.0.0 待启动)
> **生成方式**: `@sddu-roadmap` 全量扫描 17 Feature 的 state.json + spec.md + tasks.md + spec.json + validation-report.md + docs/ + TREE.md + 用户新需求评估
> **当前项目版本**: v4.0.0
> **全局状态**: 16 validated, 0 tracked, 1 terminated | 待处理项目: 40 | 新提案: 1 (FR-BUG-001)

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
| **已知待解决问题** | **41 (A-F + H-I 核心 + BUG-001 新提案 + 32 审计发现)** |
| **规划中版本** | v3.0.0, v3.1.0, v3.2.0 |

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
| **v3.1.0** | 工具链增强 | TBD | 💡 提议中 | FR-BUG-001 Bug 流程 + Skills/TUI/MCP |
| **v3.2.0** | 项目知识基础设施 (H-I) | TBD | 💡 提议中 | 全局配置 + 知识沉淀 |

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
| 🥇 | **FR-KB-001**: 全局项目配置 | v3.2.0 | 10 | 9 | 70% | 4 | **15.8** | P0 |
| 🥈 | **FR-BUG-001**: Bug 流程框架化 | v3.1.0 | 8 | 7 | 75% | 4 | **10.5** | P0 |
| 🥉 | **FR-QUALITY-001**: Build Wave 一体化 | v3.0.0 | 6 | 8 | 80% | 4 | **9.6** | P0 |
| 4 | **FR-QUALITY-002**: Validate E2E | v3.0.0 | 8 | 9 | 70% | 6 | **8.4** | P0 |
| 5 | **FR-QUALITY-003**: Review/Validate 设计规划 | v3.0.0 | 5 | 7 | 60% | 4 | **5.3** | P1 |

> **注**: Issue G (模板质量) 已通过 FR-TPL-001 (v3.0.1) 解决完成，FR-FRAMEWORK-ARCH-001 (架构重组) 已于 v4.0.0 完成交付，均不参与排名。完整 RICE 排名见「跨版本 RICE 总排名」节。

### 关键 milestones

| 日期 | Milestone | 版本 |
|------|-----------|:----:|
| ✅ 2026-06-19 | v3.0.1 发布 — 模板质量统一 | v3.0.1 |
| ✅ 2026-06-21 | v4.0.0 发布 — SDDU 框架源码架构重组 | v4.0.0 |
| 2026-06-28 | 首个 v3.0.0 Feature discovery 完成 | v3.0.0 |
| 2026-07-05 | 首个 v3.0.0 Feature spec + plan 完成 | v3.0.0 |
| 2026-07-19 | v3.0.0 首批 P0 Feature validated | v3.0.0 |
| 2026-08-30 | v3.0.0 全部 Feature 完成 | v3.0.0 |
| 2026-Q4 | v3.1.0 FR-BUG-001 discovery + v3.2.0 评估 | v3.1.0 / v3.2.0 |

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
| **C** | **validate agent 不做真正 E2E 测试** — 当前只做静态合规检查，不执行端到端行为验证 | `sddu-validate` agent | 🔴 高 |
| **D** | **sddu coordinator 尝试调用 bash 工具失败** — opencode 环境中 bash 工具可能不可用 (已自愈) | `sddu` coordinator | 🟢 低 |
| **E** | **SDDU 缺少框架级系统验证层** — 框架 Feature 需要验证"SDDU 本身还能正常工作"，无标准化流程 | SDDU 框架设计 | 🟡 中 |
| **F** | **review/validate 阶段未经设计规划** — build 阶段经历设计规划产出质量高，review/validate 未经历 | SDDU 工作流设计 | 🟡 中 |

#### v3.0.0 提议 Feature 清单

| Feature | 覆盖 | 优先级 | Effort | 说明 |
|---------|:----:|:------:|--------|------|
| **FR-QUALITY-001**: Build Agent Wave 一体化 | A | 🥇 P0 | 3-5 天 | 重构 build agent 为单次调用完成全部 wave |
| **FR-QUALITY-002**: Validate Agent E2E 能力增强 | C | 🥇 P0 | 5-7 天 | 实现端到端行为验证引擎 |
| **FR-QUALITY-003**: Review/Validate 阶段设计规划 | F | 🥈 P1 | 3-5 天 | 为 review/validate 引入设计规划阶段 |
| **FR-QUALITY-004**: 框架级自验证流程 | E | 🥈 P1 | 5-7 天 | 建立标准化框架自验证流程 |
| **FR-QUALITY-005**: Auto-updater Phase 推断修复 | B | P2 | 1-2 天 | 修复 phase 推断顺序 |
| **FR-QUALITY-006**: Coordinator 工具兼容性 | D | P2 | 1-2 天 | 增强 coordinator 工具兼容性 |

#### RICE 优先级分析 (v3.0.0 内部)

| 排名 | Feature | Reach | Impact | Conf. | Effort | **RICE** | 优先级 |
|:----:|---------|:-----:|:------:|:-----:|:------:|:--------:|:------:|
| 🥇 | FR-QUALITY-002 (Validate E2E) | 8 | 9 | 70% | 6 | **8.4** | P0 |
| 🥈 | FR-QUALITY-001 (Build Wave) | 6 | 8 | 80% | 4 | **9.6** | P0 |
| 🥉 | FR-QUALITY-003 (Review/Validate 设计) | 5 | 7 | 60% | 4 | **5.3** | P1 |
| 4 | FR-QUALITY-005 (auto-updater) | 3 | 4 | 80% | 2 | **4.8** | P2 |
| 5 | FR-QUALITY-004 (框架自验证) | 4 | 7 | 60% | 6 | **2.8** | P1 |
| 6 | FR-QUALITY-006 (coordinator) | 2 | 3 | 80% | 2 | **2.4** | P2 |

**推荐启动顺序**:
1. **FR-QUALITY-001** (Build Wave) — RICE 9.6，独立性好，改动集中
2. **FR-QUALITY-002** (Validate E2E) — RICE 8.4，影响范围大，需充分设计
3. **FR-QUALITY-005 + FR-QUALITY-006** — 快速修复，可穿插进行
4. **FR-QUALITY-003 → FR-QUALITY-004** — 两者可串行，先设计后实施

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

### 跨版本 RICE 总排名 (全部 9 项: A-F + H-I + BUG-001)

> **注**: Issue G (模板质量) 已通过 FR-TPL-001 (v3.0.1) 解决完成，FR-FRAMEWORK-ARCH-001 (架构重组) 已通过 v4.0.0 交付，不再参与排名。FR-BUG-001 为新提案。

| 排名 | Feature | 归属 | Reach | Impact | Conf. | Effort | **RICE** | 优先级 |
|:----:|---------|:----:|:-----:|:------:|:-----:|:------:|:--------:|:------:|
| 🥇 | **FR-KB-001**: 全局项目配置 | v3.2.0 | 10 | 9 | 70% | 4 | **15.8** | P0 |
| 🥈 | **FR-BUG-001**: Bug 流程框架化 | v3.1.0 | 8 | 7 | 75% | 4 | **10.5** | P0 |
| 🥉 | **FR-QUALITY-001**: Build Wave 一体化 | v3.0.0 | 6 | 8 | 80% | 4 | **9.6** | P0 |
| 4 | **FR-QUALITY-002**: Validate E2E | v3.0.0 | 8 | 9 | 70% | 6 | **8.4** | P0 |
| 5 | **FR-QUALITY-003**: Review/Validate 设计 | v3.0.0 | 5 | 7 | 60% | 4 | **5.3** | P1 |
| 6 | **FR-QUALITY-005**: auto-updater 修复 | v3.0.0 | 3 | 4 | 80% | 2 | **4.8** | P2 |
| 7 | **FR-KB-002**: 项目知识沉淀 | v3.2.0 | 8 | 8 | 50% | 8 | **4.0** | P1 |
| 8 | **FR-QUALITY-004**: 框架自验证 | v3.0.0 | 4 | 7 | 60% | 6 | **2.8** | P1 |
| 9 | **FR-QUALITY-006**: coordinator 兼容 | v3.0.0 | 2 | 3 | 80% | 2 | **2.4** | P2 |

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
            ├── FR-KB-001 (全局项目配置) — Issue I → v3.2.0
            └── FR-KB-002 (项目知识沉淀) — Issue H → v3.2.0 (依赖 KB-001)

specs-tree-solo-team-flow (ETD-001) ──────────── 🚫 terminated → 独立仓库
```

#### 执行依赖分析

```
FR-KB-001 (全局配置) ──→ FR-KB-002 (知识沉淀)         ← 配置是知识沉淀的前提
FR-BUG-001 (Bug 流程) ──受益于──→ FR-KB-001 (全局配置)   ← 全局配置可定义 bug 严重度等级
FR-BUG-001 (Bug 流程) ──借用──→ FR-TPL-001 (模板系统)   ← 共用 Handlebars 模板引擎
FR-QUALITY-001 (Build Wave) ──→ FR-QUALITY-003 (设计规划)    ← Wave 经验指导设计
FR-QUALITY-002 (Validate E2E) ──→ FR-QUALITY-004 (框架自验)  ← E2E 能力支撑自验证
FR-QUALITY-005 + FR-QUALITY-006 — 可独立快速修复

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
└────────────────────────────────────┘
┌─ Wave 3 (v3.0.0 收尾) ────────────┐
│ FR-QUALITY-003 (Review/Validate)   │ ← 依赖 Wave 1 完成
└────────────────────────────────────┘
┌─ Wave 4 (v3.0.0) ─────────────────┐
│ FR-QUALITY-004 (框架自验证)        │ ← 依赖 Wave 2 Validate E2E
└────────────────────────────────────┘
┌─ Wave 5 (v3.2.0) ─────────────────┐
│ FR-KB-002 (知识沉淀)               │ ← 依赖 KB-001
│ Skills / TUI / MCP (重新评估)      │ ← 基于 v4.0.0 三域分层架构评估
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
   - **FR-BUG-001 (Bug 流程框架化)** → v3.1.0 (轻量改进，可提前交付)
   - H-I → v3.2.0 (知识基础设施)
   - G → ✅ 已完成 (FR-TPL-001, v3.0.1)
   - **FR-FRAMEWORK-ARCH-001** → ✅ 已完成 (v4.0.0, 2026-06-21)
   - 是否需要调整归属？

3. **运行残留检查**: `bash scripts/check-sdd-residue.sh`

### 🟡 短期行动 (2 周内)

4. 对选中 Feature 执行完整 SDDU 工作流: `discovery → spec → plan → tasks`
5. 在首个 Feature 的 discovery 阶段，收集更多上下文信息
6. 评审 G/H/I 新增问题，确认描述准确性

### 🟢 中期行动 (1 个月内)

7. 完成 v3.0.0 全部 P0 级 Feature
8. 评估 v3.1.0 Feature (FR-BUG-001) 是否启动
9. 为 FR-KB-001 / FR-KB-002 收拢需求，基于 v4.0.0 三域分层架构协同设计

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
| ✨ 增强特性 | 11 | H-I + BUG-001 + FR-014~016 + Skills/TUI/MCP + 文档模板化 + 命名标准化 + FeatureStateEnum 清理 |
| 🔧 技术债务 | 9 | deprecated 类型、旧 schema、stale spec.json、仪表盘 TS 化、缺集成测试等 |
| 📄 文档/配置 | 6 | TREE.md 过时、冗余 wave1 文件、路径引用错误等 |
| ⏸️ 搁置但需关注 | 4 | ETD 独立仓库、Skills/TUI/MCP 持续延期 |

**总计: 41 个待处理项目** (↓1: Issue G 已于 v3.0.1 解决；↓1: FR-FRAMEWORK-ARCH-001 已于 v4.0.0 交付；↑1: FR-BUG-001 新提案)

### 🐛 一、待修复 Bug / 质量问题 (10 项)

| # | 名称 | 类型 | 严重度 | Effort | 优先级 | 来源 | 描述 |
|:--|------|:----:|:------:|:------:|:------:|------|------|
| **A** | sddu-build Wave 衔接断裂 | 🐛 Bug | 🔴 高 | L (3-5d) | **P0** | E2E | build agent 被多次调用 (每个 wave 一次)，理想应一次完成全部 wave。`sddu` coordinator 反复重启 build → 效率低、中间状态污染 |
| **B** | auto-updater Phase 推断顺序错误 | 🐛 Bug | 🟡 中 | S (1-2d) | **P2** | E2E | Wave 1 完成时 state.json 就出现 `phase: "builded"`；`inferCurrentPhaseFromFiles()` 中 `reviewed` 在 `builded` 前检查 → 推断提前 |
| **C** | validate agent 不做真正 E2E 测试 | 🐛 Bug | 🔴 高 | L (5-7d) | **P0** | E2E | 当前只做静态合规检查（文件存在、spec 覆盖率），不执行端到端行为验证。E2E 应属于 validated 阶段核心职责 |
| **D** | Coordinator 调用 bash 工具失败 | 🐛 Bug | 🟢 低 | XS (<1d) | **P3** | E2E | opencode 环境中 bash 工具可能不可用，`invalid [tool=bash]` 错误（已自愈） |
| **E** | 框架级系统验证层缺失 | 🐛 Bug | 🟡 中 | L (5-7d) | **P1** | E2E | 框架 Feature 需要验证"SDDU 本身还能正常工作"，当前无标准化流程 |
| **F** | Review/Validate 阶段缺设计规划 | 🐛 Bug | 🟡 中 | M (3-5d) | **P1** | E2E | build 阶段经历设计规划产出质量高，同为实施阶段的 review/validate 未经历 |
| **T1** | 预存测试失败 × 4 | 🐛 Bug | 🟡 中 | S (1-2d) | **P2** | status-enhancement | 396/400 通过，4 失败为预存问题：2 timeout、1 断言失败、1 OOM。非本次引入但需修复 |
| **T2** | wf-state-optimization phaseHistory 重复 | 🐛 Bug | 🟢 低 | XS (<1d) | **P3** | state.json | phaseHistory 中有重复条目（从 tasked 回退到 specified 又回到 tasked），数据虽不影响功能但混淆调试 |
| **T3** | agent-output-templating spec.json state 过期 | 🐛 Bug | 🟢 低 | XS (<1d) | **P3** | spec.json | `"phase": "planned", "state": "specified"` — 实际 feature 早已 validated，spec.json 未同步更新 |

### ✨ 二、待实现的增强特性 (12 项)

| # | 名称 | 类型 | Effort | 优先级 | 归属 | 描述 |
|:--|------|:----:|:------:|:------:|:-----|------|
| **I** | 全局项目配置文件 | ✨ Enhancement | M (3-5d) | **P0** | v3.2.0 | `.sddu/project.json` — 技术栈、命名规范、代码风格等全局配置，RICE 15.8 排名第一 |
| **BUG-001** | Bug 追踪与修复流程框架化 | ✨ Enhancement | M (3-5d) | **P0** | v3.1.0 | Bug 模板 + 轻/重修复规则 + 跨项目跟随。当前 bug 目录为临时方案，需提升为框架级能力。RICE 10.5 排名第二 |
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

### 📄 四、文档/配置类 (6 项)

| # | 名称 | 类型 | Effort | 优先级 | 描述 |
|:--|------|:----:|:------:|:------:|------|
| **DOC1** | `.sddu/TREE.md` 仍引用 `.sdd` 目录 | 📄 Doc | XS (<1d) | **P2** | 项目已迁移到 `.sddu/`，TREE.md 全篇仍使用 `.sdd/` 路径，需全局替换 |
| **DOC2** | `.sddu/docs/` 冗余 Wave1 迁移文件 (17+) | 📄 Doc | XS (<1d) | **P2** | 17+ 个 `migration-status-achieved-wave1-*-verified-final-...` 文件，大量冗余可归档 |
| **DOC3** | `COMPLETION_CERTIFICATE.json` 路径引用过时 | 📄 Doc | XS (<1d) | **P3** | 第 47 行 `"file": ".sdd/specs-tree-root/..."` 仍引用 `.sdd/` |
| **DOC4** | `.sddu/README.md` 列出可能不存在的命令 | 📄 Doc | XS (<1d) | **P3** | 列出 `@sddu-help` 命令但需确认是否实际存在 |
| **DOC5** | architecture/README.md ADR 数量过时 | 📄 Doc | XS (<1d) | **P3** | 说"ADR-002 ~ ADR-017"，实际有 ADR-001 ~ ADR-020（含子 Feature 的 ADR-018/019/020） |
| **DOC6** | `.sddu/docs/README.md` 未包含 v3.0.0 Roadmap | 📄 Doc | XS (<1d) | **P3** | docs 导航未引用 v3.0.0 质量改进计划 |

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
| 🥇 | **I** | 全局项目配置文件 | ✨ | v3.2.0 | M | 15.8 | **P0** |
| 🥈 | **BUG-001** | Bug 追踪与修复流程框架化 | ✨ | v3.1.0 | M | 10.5 | **P0** |
| 🥉 | **A** | Build Wave 一体化 | 🐛 | v3.0.0 | L | 9.6 | **P0** |
| 4 | **C** | Validate Agent E2E | 🐛 | v3.0.0 | L | 8.4 | **P0** |
| 5 | **F** | Review/Validate 设计规划 | 🐛 | v3.0.0 | M | 5.3 | **P1** |
| 6 | **B** | auto-updater 修复 | 🐛 | v3.0.0 | S | 4.8 | **P2** |
| 7 | **H** | 项目知识沉淀 | ✨ | v3.2.0 | L | 4.0 | **P1** |
| 8 | **E** | 框架自验证 | 🐛 | v3.0.0 | L | 2.8 | **P1** |
| 9 | **D** | coordinator 兼容 | 🐛 | v3.0.0 | XS | 2.4 | **P3** |
| 10 | **S8** | FeatureStateEnum 清理 | ✨ | v3.1.0 | XS | — | **P1** |
| 11 | **T1** | 预存测试修复 | 🐛 | — | S | — | **P2** |
| 12 | **TD1** | 仪表盘 TS 化 | 🔧 | — | M | — | **P2** |
| 13 | **TD2** | consistency-checker 集成测试 | 🔧 | — | S | — | **P2** |
| 14 | **DOC1** | TREE.md sdd→sddu | 📄 | — | XS | — | **P2** |
| 15 | **DOC2** | Wave1 冗余文件归档 | 📄 | — | XS | — | **P2** |
| 16 | **S4** | Skills 系统 | ✨ | v3.1.0 | L | — | **P2** |
| 17 | **S7** | 文件命名标准化 | ✨ | — | S | — | **P2** |
| 18 | **TD8** | AI Agent 行为验证 | 🔧 | — | M | — | **P2** |
| 19 | **S1** | 模板校验工具 | ✨ | Could Have | M | — | **P2** |
| 20 | **DOC3-6** | 路径/数量修正 | 📄 | — | XS×4 | — | **P3** |
| 20 | **TD3** | schema-v1.2.5 清理 | 🔧 | — | XS | — | **P3** |

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

Phase 5 — ⏸️ 搁置
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
