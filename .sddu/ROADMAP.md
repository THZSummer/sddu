# 版本 Roadmap：SDDU

<!-- sddu:zone id="meta" mode="rewrite" -->
> **文档定位**: SDDU 版本路线图 — 跨版本 / 项目级顶层规划，是本文件格式的唯一权威来源  
> **输出文件名**: .sddu/ROADMAP.md  
> **前置依赖**: 无硬性前置依赖（可基于现有 spec/plan 或从零规划）  
> **创建人**: SDDU Roadmap Agent  
> **创建时间**: 2026-04-06  
> **版本**: v20.0.0  
> **更新人**: SDDU Roadmap Agent  
> **更新时间**: 2026-09-24  
> **更新说明**: 按输出模板 v3.1.4 完整重写（旧文档 1382 行 → 8 章新结构；内容无损迁移，R3 特性索引 / R4 锚点与取值链 / R5 回退规则落地）  
> **当前项目版本**: v4.0.0  
> **全局状态**: 规划中 — 特性 24 个（22 completed / 1 suspended / 1 terminated / 0 tracked）；待处理项目约 45；新提案 6（FR-BUG-001 / FR-TREE-SKILL / FR-AGENT-SCOPE-001 / FR-CONTEXT-001 / FR-DISCOVERY-002 / FR-AUTONOMY-001）；Skill 化候选 3（FR-BUG-001 / FR-WORKTREE-001 / FR-TREE-SKILL）；竞品借鉴 7 Feature + 2 内联改进  
> **生成方式**: 完整生成  
<!-- /sddu:zone -->

## 1. 项目愿景与定位

<!-- sddu:zone id="vision" mode="rewrite" -->
SDDU（Spec-Driven Development Unified）是一套面向 AI 辅助开发的规范驱动工作流框架。它由 12 个专业化 Agent 协同承载（7 阶段主流水线 discovery / spec / plan / tasks / build / review / validate，加 @sddu-fast 轻量入口，以及 @sddu-roadmap、@sddu-docs 等独立辅助 Agent），覆盖完整开发生命周期；以「树形 Feature 嵌套」「增量保留区合并」「双层可扩展架构」形成差异化优势。项目自 2026 年 3 月启动，已迭代至 v4.0.0，24 个 Feature 中 22 个完成 validated。

项目的长期愿景是成为 AI 辅助软件工程的标准工作流框架 —— 让 AI Agent 不仅能写代码，更能通过规范化流程保证交付质量、沉淀项目知识、持续自我演进。演进路径清晰：v3.0.0 系列聚焦框架自身的质量闭环（Build Wave 一体化、Validate E2E、框架级自验证）；v3.3.0 的 FR-FAST-001（快速模式）与 FR-SKILL-001（Skill 系统）使 SDDU 正式进入「固定引擎 + 可扩展能力」双层架构时代，Skill 三元自举闭环（discovery / creator / sync）为后续能力降级提供了基础设施；v4.0.0 完成三域分层架构重组与平台适配器隔离，为跨平台扩展奠定基础；FR-TREE-SKILL（@sddu-tree Agent 技能化）是 Agent→Skill 降级模型的首个实战验证案例。FR-AUTONOMY-001（自主模式）已于 2026-09-13 长期搁置（auto 效果不稳定）。当前重心为「质量闭环 + 待办清理」，并为多平台生态扩展积累条件。
<!-- /sddu:zone -->

## 2. 版本总览

<!-- sddu:zone id="version-overview" mode="rewrite" -->
| 版本 | 主题 | 时间窗 | 状态 | 核心目标 |
|------|------|--------|------|----------|
| v1.1.1 | Phase 1+ | 2026-03-30 | 已发布 | 16 Agent 上线 |
| v2.4.0 | Feature 拆分与树形结构优化 | 2026-04-13 | 已发布 | 树形嵌套 + 目录命名优化 + v2 修复 |
| v1.4.0 | SDD → SDDU 品牌升级 | 2026-04-20 | 已发布 | 插件改名 + 双命名空间命令 |
| v2.5.0 | Agent 输出模板化系统 | 2026-05-25 | 已发布 | Handlebars 模板引擎 + 7 模板 |
| v2.6.0 | SDDU 特性状态增强 | 2026-06-13 | 已发布 | phase（8 阶段）+ status（5 状态）两字段隔离模型 |
| v3.0.1 | 模板质量统一 | 2026-06-19 | 已发布 | 17 模板格式统一 + 11 Agent 职责边界 + @sddu-docs 补全 |
| v4.0.0 | 源码架构重组 | 2026-06-21 | 已发布 | 三域分层 + 平台适配器隔离 |
| v3.3.0 | Agent 行为强化 + 轻量入口 | 2026-07-19 | 部分完成 | FR-FAST-001 / FR-SKILL-001 已交付；FR-AUTONOMY-001 搁置；FR-RATIONAL-001 待启动；FR-DISCOVERY-002 提议中 |
| v3.0.0 | 质量与工作流改进（A-F） | 2026-Q3 | 规划中 | A-F 六问题修复；F 已由 FR-AGENT-SCOPE-001 交付替换 |
| v3.1.0 | Skill 化降级验证 | TBD | 提议中 | FR-BUG-001 → sddu-bug、FR-WORKTREE-001 → sddu-worktree；FR-TREE-SKILL 已交付 |
| v3.2.0 | 项目知识基础设施（H・I） | TBD | 部分完成 | FR-KB-002 已交付；FR-KB-001 提议中；FR-CONTEXT-001 低优先级 |
| v4.1.0 | 生态扩展（远期） | TBD | 远期 | 多平台适配 + Agent 自动触发；FR-ROADMAP-TPL-001 已交付 |

排序依据：按「时间窗」升序；精确日期取日期值，季度窗口按其覆盖区间结束日参与排序（如 2026-Q3 记为 2026-09-30），`TBD` 置末。
<!-- /sddu:zone -->

## 3. 特性索引

<!-- sddu:zone id="feature-index" mode="rewrite" -->
| Feature ID | 名称 | specs-tree 目录 | 状态 | 版本归属 |
|------------|------|----------------|------|:--:|
| FR-TEMPLATE-001 | Agent 输出模板化系统 | specs-tree-agent-output-templating | completed | 1.0.0（metadata.version） |
| FR-DIR-001（metadata.featureId） | specs-tree-root 管理目录结构命名优化 | specs-tree-directory-optimization | completed | 1.0.0 |
| FR-PLUGIN-RENAME-SDDU（推断） | Plugin Rename SDDU — 从 SDD 全面迁移至 SDDU | specs-tree-plugin-rename-sddu | completed | 1.0.0 |
| FR-SDD-PLUGIN-ROADMAP（推断） | SDD Roadmap 规划专家 | specs-tree-sdd-plugin-roadmap | completed | 1.0.0 |
| FR-SDD-PLUGIN-BASELINE（推断） | SDD Plugin Phase 1 基线 | specs-tree-sdd-plugin-baseline | completed | 1.1.0 |
| FR-SDD-MULTI-001（metadata.featureId） | SDD 子 Feature 化并行开发支持 | specs-tree-sdd-multi-module | completed | 1.2.11 |
| FR-PLUGIN-RENAME-SDDU-V2（推断） | Plugin Rename SDDU V2 — 代码清理 | specs-tree-plugin-rename-sddu-v2 | completed | 2.0.0 |
| FR-SDD-WORKFLOW-STATE-OPTIMIZATION（推断） | SDD 工作流状态优化 | specs-tree-sdd-workflow-state-optimization | completed | 2.0.0 |
| FR-TREE-STRUCTURE-OPTIMIZATION（推断） | v2.4.0 Feature 拆分与树形结构优化 | specs-tree-tree-structure-optimization | completed | v2.1.0 |
| FR-TREE-STRUCTURE-OPTIMIZATION-V2（推断） | 树形结构优化 v2 — 问题修复 | specs-tree-tree-structure-optimization-v2 | completed | v2.1.0 |
| ETD-001 | ETD（Expert Tree Design） | specs-tree-solo-team-flow | terminated | 2.2.0 |
| FR-AUTONOMY-001（metadata.featureId） | 自主模式（sddu-auto 自动调度） | specs-tree-autonomous-mode | suspended | v3.0.0 |
| FR-DOCS-AGENT-OPTIMIZATION（推断） | @sddu-docs Agent 补全与优化 | specs-tree-docs-agent-optimization | completed | v3.0.0 |
| FR-TREE-SKILL（metadata.featureId） | @sddu-tree Agent 技能化 | specs-tree-tree-skill | completed | v3.1.0（metadata.version） |
| FR-SKILL-001（feature） | SDDU Skill 系统（双重定位：用户级 + 框架级） | specs-tree-skill-system | completed | 3.3.0-early |
| FR-FAST-001 | @sddu-fast 快速模式 Agent | specs-tree-sddu-fast | completed | v3.3.0 |
| FR-FRAMEWORK-ARCH-001 | SDDU 框架源码架构重组 | specs-tree-framework-architecture | completed | v4.0.0 |
| FR-ROADMAP-TPL-001（metadata.featureId） | @sddu-roadmap 输出模板补全 | specs-tree-roadmap-output-template | completed | v4.1.0 |
| FR-AGENT-SCOPE-001（feature_id） | plan/review/validate 职责回归改造 | specs-tree-agent-scope-realignment | completed（phase=validated 推断） | 不适用 |
| FR-DEP-001 | 弃用旧版 SDD 工具 | specs-tree-deprecate-sdd-tools | completed | 不适用 |
| FR-SDD-DISCOVERY-001 | SDD Discovery 需求挖掘能力增强 | specs-tree-sdd-discovery-feature | completed | 不适用 |
| FR-SDD-TOOLS-OPTIMIZATION（推断） | SDD 工具系统优化 | specs-tree-sdd-tools-optimization | completed | 不适用 |
| FR-STATUS-ENHANCE-001 | SDDU 特性状态增强 | specs-tree-sddu-status-enhancement | completed | 不适用 |
| FR-TPL-001 | 预置输出模板质量统一 | specs-tree-template-quality-unification | completed | 不适用 |

排序依据：按「版本归属」升序（语义化版本比较、忽略 `v` 前缀，`3.3.0-early` 视为 `3.3.0` 的预发布前置；无版本归属者置末），同版本内按 specs-tree 目录名字典序；本区为实时投影（`mode="rewrite"`），随 `.sddu/specs-tree-root/` 下各 Feature `state.json` 变化整体重建。取值回退与推断均已就地标注来源：`Feature ID` 依 `featureId` > `feature_id` > `metadata.featureId` > `feature`（非 ID 形态按目录名推断，标「推断」）；`版本归属` 依 顶层 `version` > `metadata.version`（回退取值标注来源，均无则「不适用」）；`状态` 缺失时按 `phase` 推断（`validated` / 数值 7 → completed），本区仅 `specs-tree-agent-scope-realignment` 命中该推断。
<!-- /sddu:zone -->

## 4. 优先级（RICE Top N）

<!-- sddu:zone id="priority" mode="rewrite" -->
| 排名 | 特性 | 目标版本 | RICE Score |
|:--:|------|:--:|:--:|
| 1 | FR-DISCOVERY-002 Discovery 访谈效率优化（未立项提案，无 specs-tree 目录） | v3.3.0 | 22.4 |
| 2 | FR-BUG-001 Bug 流程框架化（未立项提案，无 specs-tree 目录；目标形态 sddu-bug Skill） | v3.1.0 | 21.0 |
| 3 | FR-CONTEXT-001 Feature 级共享语言管理（未立项提案，无 specs-tree 目录） | v3.2.0 | 18.0 |
| 4 | FR-TREE-SKILL @sddu-tree Agent 技能化（specs-tree-tree-skill，已交付） | v3.1.0 | 17.0 |
| 5 | FR-KB-001 全局项目配置（未立项提案，无 specs-tree 目录） | v3.2.0 | 15.8 |
| 6 | FR-AGENT-SCOPE-001 plan/review/validate 职责回归改造（specs-tree-agent-scope-realignment，已交付） | v3.0.0 | 12.2 |
| 7 | FR-WORKTREE-001 Git Worktree Feature 隔离（未立项提案，无 specs-tree 目录；目标形态 sddu-worktree Skill） | v3.1.0 | 12.0 |
| 8 | FR-AUTONOMY-001 自主模式（specs-tree-autonomous-mode，已搁置） | v3.3.0 | 10.5 |
| 9 | FR-QUALITY-001 Build Agent Wave 一体化（未立项提案，无 specs-tree 目录） | v3.0.0 | 9.6 |
| 10 | FR-RATIONAL-001 Agent 理性化对抗（未立项提案，无 specs-tree 目录） | v3.3.0 | 9.6 |

> 注：FR-QUALITY-001 与 FR-RATIONAL-001 同为 9.6（并列）。FR-AUTONOMY-001 虽列第 8，但属用户核心痛点（Agent 频繁提问、缺乏自主决策），历史上按 P0 战略升格，现为搁置。已交付项不参与活跃排名：FR-FAST-001（21.6）、FR-SKILL-001（17.5）、FR-ROADMAP-TPL-001、FR-TPL-001（7.5）、FR-KB-002（4.0）、FR-QUALITY-002（8.4，Issue C 解决）、FR-QUALITY-006（2.4，Issue D 解决）；FR-QUALITY-003（Issue F 原方案）已被 FR-AGENT-SCOPE-001 替换。未入 Top 10 的活跃项：FR-AUTOTRIGGER-001（7.5）、FR-QUALITY-005（4.8）、FR-QUALITY-004（2.8）、FR-CROSSPLAT-001（2.4）。  
> RICE 四维明细（Reach / Impact / Confidence / Effort，本表仅承载 Score）：FR-DISCOVERY-002 = 7/6/80%/1.5；FR-BUG-001 = 8/7/75%/2；FR-CONTEXT-001 = 9/8/75%/3；FR-TREE-SKILL = 5/6/85%/1.5；FR-KB-001 = 10/9/70%/4；FR-AGENT-SCOPE-001 = 9/9/75%/5；FR-WORKTREE-001 = 5/6/60%/1.5；FR-AUTONOMY-001 = 10/9/70%/6；FR-QUALITY-001 = 6/8/80%/4；FR-RATIONAL-001 = 8/6/70%/3.5；FR-QUALITY-002 = 8/9/70%/6；FR-AUTOTRIGGER-001 = 6/5/50%/2；FR-QUALITY-005 = 3/4/80%/2；FR-QUALITY-004 = 4/7/60%/6；FR-CROSSPLAT-001 = 9/8/40%/12；FR-QUALITY-006 = 2/3/80%/2；FR-KB-002 已交付、FR-TPL-001 = 7.5、FR-FAST-001 = 21.6、FR-SKILL-001 = 17.5（更新后 R10/I10/C70%/E4）。
<!-- /sddu:zone -->

## 5. 版本规划详述

<!-- sddu:zone id="version-plan" mode="preserve" -->
<!-- sddu:entry id="v1.1.1" -->
### v1.1.1 — Plugin Phase 1+
- **目标**: 交付 SDD 插件 Phase 1 基线能力（基础架构、配置管理、生命周期管理、可观测性），上线 16 个 Agent。
- **关键特性**: FR-SDD-PLUGIN-BASELINE（specs-tree-sdd-plugin-baseline）
- **里程碑**: 2026-03-30 发布
<!-- /sddu:entry -->
<!-- sddu:entry id="v1.4.0" -->
### v1.4.0 — SDD → SDDU 品牌升级
- **目标**: 插件生态从 @sdd-* 全面迁移到 @sddu-*，实现双命名空间管理与向后兼容。
- **关键特性**: FR-PLUGIN-RENAME-SDDU（specs-tree-plugin-rename-sddu）、FR-PLUGIN-RENAME-SDDU-V2（specs-tree-plugin-rename-sddu-v2）
- **里程碑**: 2026-04-20 发布（18 个迁移任务 T-001~T-018 完成，100% 向后兼容）
<!-- /sddu:entry -->
<!-- sddu:entry id="v2.4.0" -->
### v2.4.0 — Feature 拆分与树形结构优化
- **目标**: 支持无限层树形 Feature 嵌套与跨子树依赖检查，定义「轻量化父级 / 完整叶子」规范并统一 state.json schema；同步完成目录命名优化。
- **关键特性**: FR-TREE-STRUCTURE-OPTIMIZATION（specs-tree-tree-structure-optimization）、FR-TREE-STRUCTURE-OPTIMIZATION-V2（specs-tree-tree-structure-optimization-v2）、FR-DIR-001（specs-tree-directory-optimization）
- **里程碑**: 2026-04-13 发布；v2 修复 2026-04-15
<!-- /sddu:entry -->
<!-- sddu:entry id="v2.5.0" -->
### v2.5.0 — Agent 输出模板化系统
- **目标**: 将主流程 Agent 的输出固化为 Handlebars 标准化模板，支持用户自定义模板覆盖内置默认模板。
- **关键特性**: FR-TEMPLATE-001（specs-tree-agent-output-templating）
- **里程碑**: 2026-05-25 发布（13 FR / 6 NFR / 8 EC 100% 通过）
<!-- /sddu:entry -->
<!-- sddu:entry id="v2.6.0" -->
### v2.6.0 — SDDU 特性状态增强
- **目标**: 状态模型从单字段混用重构为两字段隔离（phase 8 阶段 / status 5 状态），内置一致性检测、标记命令与分类仪表盘。
- **关键特性**: FR-STATUS-ENHANCE-001（specs-tree-sddu-status-enhancement）
- **里程碑**: 2026-06-13 发布（v3.0.0 状态模型）
<!-- /sddu:entry -->
<!-- sddu:entry id="v3.0.1" -->
### v3.0.1 — 模板质量统一
- **目标**: 统一 17 个内置模板的格式与结构，明确全部 11 个 Agent 的职责边界；同步补全 @sddu-docs。
- **关键特性**: FR-TPL-001（specs-tree-template-quality-unification）、FR-DOCS-AGENT-OPTIMIZATION（specs-tree-docs-agent-optimization）
- **里程碑**: 2026-06-19 发布（22 FR + 3 NFR 100% 通过）；FR-DOCS-OPT-001 于 2026-07-05 完成
<!-- /sddu:entry -->
<!-- sddu:entry id="v4.0.0" -->
### v4.0.0 — 源码架构重组
- **目标**: 三域分层架构重组 + 平台适配器隔离，为跨平台扩展奠定基础。
- **关键特性**: FR-FRAMEWORK-ARCH-001（specs-tree-framework-architecture）
- **里程碑**: 2026-06-21 发布（全部现有测试通过，npm build/pack 验证通过）
<!-- /sddu:entry -->
<!-- sddu:entry id="v3.0.0" -->
### v3.0.0 — 质量与工作流改进（A-F）
- **目标**: 解决 specs-tree-sddu-status-enhancement E2E 全流程验证（2026-06-13）暴露的 6 个框架级问题（A-F），并以职责回归作为 Issue F 的根本解法。
- **关键特性**: FR-AGENT-SCOPE-001（specs-tree-agent-scope-realignment，已交付 2026-08-01，替换被取消的 FR-QUALITY-003）；FR-QUALITY-001 Build Agent Wave 一体化（未立项提案，无 specs-tree 目录）；FR-QUALITY-004 框架级自验证（未立项提案，无 specs-tree 目录）；FR-QUALITY-005 auto-updater phase 推断修复（未立项提案，无 specs-tree 目录）；FR-QUALITY-002（Issue C）、FR-QUALITY-006（Issue D）均已交付
- **里程碑**: 目标 2026-09-30 全部 Feature 完成；FR-AGENT-SCOPE-001 已于 2026-08-01 validated（62 项检查：58 pass / 3 warn / 0 fail）
<!-- /sddu:entry -->
<!-- sddu:entry id="v3.1.0" -->
### v3.1.0 — Skill 化降级验证
- **目标**: 将已规划独立 Feature 降级为框架级 Skill，验证 FR-SKILL-001 定义的「Agent→Skill 降级模型」；原总 Effort 8d（M×2）→ Skill 化后约 5d（S×3）。
- **关键特性**: FR-TREE-SKILL（specs-tree-tree-skill，已交付 2026-07-22 有条件通过，Agent→Skill 首个实战案例）；FR-BUG-001 → sddu-bug Skill（未立项提案，无 specs-tree 目录）；FR-WORKTREE-001 → sddu-worktree Skill（未立项提案，无 specs-tree 目录）
- **里程碑**: TBD — 待复用 FR-TREE-SKILL 降级结论后启动剩余两项
<!-- /sddu:entry -->
<!-- sddu:entry id="v3.2.0" -->
### v3.2.0 — 项目知识基础设施（H・I）
- **目标**: 建立项目知识层 —— FR-KB-001 管「怎么做」（技术栈 / 命名规范 / 代码风格），FR-CONTEXT-001 管「说什么」（领域语言 / 术语表）；v4.0.0 三域分层为配置格式提供平台无关性参考。
- **关键特性**: FR-KB-002 项目级知识自动沉淀（已交付，由 FR-DOCS-AGENT-OPTIMIZATION 的 @sddu-docs 实现，对应 Issue H）；FR-KB-001 全局项目配置文件 `.sddu/project.json`（未立项提案，无 specs-tree 目录）；FR-CONTEXT-001 Feature 级共享语言 CONTEXT.md（未立项提案，无 specs-tree 目录，P2 低优先级）
- **里程碑**: TBD — 依赖 v3.1.0 部分完成；FR-KB-001 与 FR-CONTEXT-001 可并行推进
<!-- /sddu:entry -->
<!-- sddu:entry id="v3.3.0" -->
### v3.3.0 — Agent 行为强化 + 轻量入口
- **目标**: 轻重双模入口（@sddu-fast）+ Skill 系统双层架构（固定引擎 + 可扩展能力）+ 「自主-约束」双翼（自主模式 × 理性化对抗）。
- **关键特性**: FR-FAST-001（specs-tree-sddu-fast，已交付 2026-07-12）；FR-SKILL-001（specs-tree-skill-system，已交付 2026-07-19，三元自举闭环）；FR-AUTONOMY-001（specs-tree-autonomous-mode，2026-09-13 长期搁置 — auto 效果不稳定，实施代码保留在 `feature/autonomous-mode`，main 仅留设计文档，见 SHELF.md）；FR-RATIONAL-001 Agent 理性化对抗（未立项提案，无 specs-tree 目录）；FR-DISCOVERY-002 Discovery 访谈效率优化（未立项提案，无 specs-tree 目录，与 FR-AUTONOMY-001 的 scope 关系待决策）
- **里程碑**: 2026-07-19 两项提前交付；FR-RATIONAL-001 需 v3.0.0~v3.2.0 交付后启动
<!-- /sddu:entry -->
<!-- sddu:entry id="v4.1.0" -->
### v4.1.0 — 生态扩展（远期）
- **目标**: 基于 v4.0.0 的 adapters/ 架构扩展到 OpenCode 之外的 AI Agent 平台，并提升 Agent 主动性。
- **关键特性**: FR-ROADMAP-TPL-001（specs-tree-roadmap-output-template，已交付）；FR-CROSSPLAT-001 多平台适配（未立项提案，无 specs-tree 目录）；FR-AUTOTRIGGER-001 Agent 自动触发（未立项提案，无 specs-tree 目录）
- **里程碑**: TBD（远期；每季度回顾是否达到启动评估条件）
<!-- /sddu:entry -->
<!-- /sddu:zone -->

## 6. 依赖与风险

<!-- sddu:zone id="dependencies-risks" mode="rewrite" -->
| 类型 | 依赖 / 风险 | 影响 | 缓解措施 |
|------|------------|:--:|----------|
| 依赖 | FR-KB-001（全局配置）为 FR-KB-002 的前提 | 低 | FR-KB-002 已由 @sddu-docs 实现；KB-001 收拢需求后参考 v4.0.0 三域分层设计 |
| 依赖 | FR-BUG-001 / FR-WORKTREE-001 共用 FR-TPL-001（Handlebars 模板引擎与分发机制） | 低 | 模板系统已交付，无阻塞 |
| 依赖 | FR-TREE-SKILL 强依赖 FR-SKILL-001（discovery / creator / sync 三元闭环） | 低 | 基础设施已交付，降级已落地（2026-07-22） |
| 依赖 | FR-CROSSPLAT-001 依赖 FR-FRAMEWORK-ARCH-001（v4.0.0 adapters/ 架构） | 中 | 架构基础已就绪；待平台需求明确后启动 |
| 依赖 | FR-AUTONOMY-001 联动 FR-KB-001（autonomyLevel 写入 project.json） | 中 | 已搁置；若重启可先硬编码默认 L1，KB-001 交付后迁移为配置项 |
| 依赖 | FR-CONTEXT-001 与 FR-KB-001 互补、与 FR-KB-002 互补，可借用 FR-SKILL-001 的 skill-creator | 低 | 一个管「说什么」、一个管「怎么做」；skill-creator 可辅助生成 CONTEXT.md |
| 依赖 | FR-AGENT-SCOPE-001 替换 FR-QUALITY-003（Issue F 原方案） | 已解除 | 根本解法已交付（2026-08-01）；FR-QUALITY-003 正式取消 |
| 依赖 | FR-DISCOVERY-002 与 FR-AUTONOMY-001 scope 重叠（同改 discovery 模板提问行为） | 中 | 待 spec 决策 Option A（并入 AUTONOMY-001）或 Option B（保留独立、明确边界） |
| 依赖 | ETD-001 已终止并迁出（specs-tree-solo-team-flow → 独立仓库） | 低 | 待创建 ETD 独立仓库（原 targetRepo 仍为「待创建」） |
| 依赖 | 外部参考依据：docs/research/superpowers-competitor-analysis.md、docs/research/grillme-competitor-analysis.md | 低 | 竞品借鉴项的来源依据；季度回顾时同步核对结论是否仍适用 |
| 依赖 | 关键路径：.sddu/specs-tree-root/state.json（全局状态 v1.4.1）、.sddu/specs-tree-root/architecture/adr/（主集合 ADR-001~ADR-017，Feature 目录下另有 ADR-018 起） | 低 | 「特性索引」实时投影依赖 state.json；架构决策以 ADR 为准 |
| 技术债台账 | 2026-06-13 深度扫描口径 48 项 → 现约 45 项（Bug/质量 10 · 增强 17 · 技术债 9 · 文档配置 7 · 搁置关注 4） | 中 | 逐项承接于「下一步行动」；额度随交付递减，季度回顾复核 |
| 风险 | 无活跃 Feature 空窗期过长（当前 0 tracked） | 高 | 立即启动剩余项中优先级最高者的 discovery（见「下一步行动」） |
| 风险 | v3.0.0 范围蔓延（6 问题全做） | 高 | 严格按优先级排序；A/B/D 优先，快速修复穿插进行 |
| 风险 | FR-AUTONOMY-001 自主边界定义模糊（过度自主 ↔ 过度谨慎） | 高 | 已搁置；若重启，discovery 阶段将四维边界模型（可逆性 / 影响半径 / 置信度 / 成本）列为首要决策项 |
| 风险 | FR-AUTONOMY-001 过度自主导致不可逆错误 | 高 | 不可逆操作（删数据 / 破坏 API / git 历史改写）一律 HARD-GATE 强制确认，任何自主级别不得豁免 |
| 风险 | FR-QUALITY-001 Build Wave 一体化改动大 | 中 | 提前原型验证 build agent 的 multi-wave 能力 |
| 风险 | Validate E2E 设计复杂度高（Issue C 已随 v3.0.5 模板重写解决，遗留框架级自验证） | 中 | 分两步：最小可行 E2E runner → 完整框架 |
| 风险 | FR-BUG-001 轻 / 重修复边界模糊、Skill 化后 scope 漂移 | 中 | discovery 阶段精确定义判定标准（变更是否触及 spec.md → 走重修复）；明确 Skill 化 Feature 的轻量流程 |
| 风险 | FR-WORKTREE-001 嵌套 worktree 检测、平台兼容性 | 中 | 参考 Superpowers Step 0 检测逻辑 + 环境变量标记；优先平台原生工具 → 降级 `git worktree add`；E2E 覆盖多平台 |
| 风险 | FR-KB-001 全局配置 schema 争议 | 中 | 参考主流框架实践；充分收拢需求再设计；v4.0.0 三域分层提供平台无关性参考 |
| 风险 | FR-TREE-SKILL 降级后 TREE 格式不一致、模板引用更新遗漏、用户失去显式调用入口 | 中 | Skill body 定义严格格式模板 + validate 增 TREE 一致性检查；全局 grep 审计 @sddu-tree 引用；ROADMAP / CHANGELOG 说明变更 |
| 风险 | FR-AGENT-SCOPE-001 已交付，遗留：review/validate 自主策略质量不足、模板变更回归 | 中 | 逐个 Agent 修改 + 验证（不并行）；模板提供 C1~CN / V1~VN 结构化方法论；前 2-3 个 Feature 收集反馈迭代 |
| 风险 | FR-SKILL-001 运营：用户不主动填充 skills、Skills 冗余过时、Agent 新增门禁执行力 | 中 | skill-creator 降低创建门槛 + Agent 建议物化；记录 last-updated 并提示更新；门禁纳入 HARD-GATE 约束提升执行力 |
| 风险 | Skills / TUI / MCP 持续延期（v2.5.0 遗留） | 低 | v4.0.0 三域分层后可基于新架构评估；部分能力可通过 Skill 化实现 |
| 风险 | FR-CONTEXT-001 各 Feature 词汇表格式不一致 | 中 | 定义标准格式模板（词条 + 定义）；skill-creator 辅助生成；@sddu-docs 聚合时做格式校验 |
| 风险 | FR-DISCOVERY-002 批量提问导致用户信息过载 | 中 | 限制前沿大小（建议每轮 ≤5 问）+ 每个问题附 Agent 推荐答案 + 提供「一步步说」降级选项 |
| 风险 | v3.3.0 / v4.1.0 前瞻 Feature 过早承诺（含 P2 低优先级远期承诺） | 低 | 标记为「远期」，不进入近期执行计划；每季度回顾一次启动条件 |
| 风险 | v3.3.0 两项提前交付后的版本空窗（仅剩 FR-RATIONAL-001） | 中 | 不影响 v3.0.0~v3.2.0 优先级；FR-RATIONAL-001 可与前序版本 Feature 并行启动 |
| 风险 | 已解决项归档：FR-ARCH-001 scope 膨胀与回归、KB-002 scope 不明、FR-FAST-001 三项风险、FR-SKILL-001 混合触发准确率、DOC1 TREE.md 路径 | 已解决 | 均有结论：v4.0.0 已交付且测试通过；KB-002 由 @sddu-docs 实现；@sddu-fast 模板内置复杂度评估清单 + 轻重双入口；Skill 采用三阶段渐进披露模型；TREE.md 路径已修复 |

> 锚点标注：本表出现的 FR-QUALITY-001 / FR-QUALITY-003 / FR-QUALITY-004 / FR-QUALITY-005、FR-BUG-001、FR-WORKTREE-001、FR-KB-001、FR-CONTEXT-001、FR-DISCOVERY-002、FR-RATIONAL-001、FR-CROSSPLAT-001、FR-AUTOTRIGGER-001 均为**未立项提案（无 specs-tree 目录）**；可在「特性索引」查到目录锚点的为已立项 Feature（如 FR-TREE-SKILL → specs-tree-tree-skill、FR-AGENT-SCOPE-001 → specs-tree-agent-scope-realignment、FR-AUTONOMY-001 → specs-tree-autonomous-mode）。
<!-- /sddu:zone -->

## 7. 下一步行动

<!-- sddu:zone id="next-actions" mode="preserve" -->
- [ ] 确认下一启动 Feature：候选 FR-KB-001（RICE 15.8，全局影响力最大，并为 autonomyLevel 预留配置载体）/ FR-BUG-001（RICE 21.0，Skill 化路径最成熟）/ FR-RATIONAL-001（v3.3.0 唯一未启动项）；确认后按 discovery → spec → plan → tasks 推进
- [ ] 确认各 Feature 版本归属：v3.0.0 = A/B/E 剩余问题；v3.1.0 = FR-BUG-001 + FR-WORKTREE-001；v3.2.0 = FR-KB-001 + FR-CONTEXT-001；v3.3.0 = FR-RATIONAL-001 + FR-DISCOVERY-002；v4.1.0 = FR-CROSSPLAT-001 + FR-AUTOTRIGGER-001
- [ ] 提交 `src/skills/` 到版本控制（`git add src/skills/ && git commit`）— FR-SKILL-001 验证发现的 untracked 项（3 个框架级 Skill 文件在磁盘未入库）
- [ ] 运行残留检查 `bash scripts/check-sdd-residue.sh`，确保 SDD→SDDU 迁移无回归
- [ ] 决定 FR-AUTONOMY-001 与 FR-DISCOVERY-002 的 scope 关系（随搁置一并作废；如未来重启该能力，单独重新实施，不复活原需求）
- [ ] A / FR-QUALITY-001：build agent 重构为单次调用完成全部 wave（P0，L，3-5d）
- [ ] B / FR-QUALITY-005：修复 auto-updater phase 推断顺序（`inferCurrentPhaseFromFiles()` 中 `reviewed` 先于 `builded` 检查）（P2，S，1-2d）
- [ ] C / FR-QUALITY-002：Validate Agent E2E 能力增强（Issue C）— 已随 v3.0.5 模板重写（动手验证模式）解决，待复核
- [ ] D / FR-QUALITY-006：coordinator bash 工具兼容性（Issue D）— 已修复（coordinator 与 sddu-roadmap.md.hbs 均 `bash: deny`），待复核
- [ ] E / FR-QUALITY-004：建立标准化框架级自验证流程（P1，L，5-7d）
- [ ] F（Issue F）：已由 FR-AGENT-SCOPE-001（specs-tree-agent-scope-realignment）根本解决并交付，关闭该项
- [ ] I / FR-KB-001：`.sddu/project.json` 全局项目配置（技术栈 / 命名规范 / 代码风格），收拢需求后启动（P0，M，3-5d）
- [ ] G（Issue G）：预置输出模板质量统一 — 已由 FR-TPL-001（specs-tree-template-quality-unification）交付，关闭该项
- [ ] H（Issue H）/ FR-KB-002：项目级知识自动沉淀 — 已由 @sddu-docs（specs-tree-docs-agent-optimization）交付，关闭该项
- [ ] S8：移除 `@deprecated` 的 FeatureStateEnum 类型别名（v3.1.0 遗留，XS，~30min）
- [ ] T2：specs-tree-sdd-workflow-state-optimization phaseHistory 去重（XS，~10min）
- [ ] T3 / TD6：同步 specs-tree-agent-output-templating 的 stale spec.json（`phase: planned, state: specified` → validated）
- [ ] TD5：同步 specs-tree-sddu-status-enhancement 的 stale spec.json（`phase: planned, status: tracked` → validated/completed）
- [ ] DOC3：修正 COMPLETION_CERTIFICATE.json 第 47 行的 `.sdd/` 路径引用
- [ ] DOC4 / DOC5 / DOC6：校验 `.sddu/TREE.md` 命令引用有效性、ADR 数量（TREE.md 记 17 篇主集合，Feature 目录下另有 ADR-018/019/020）、docs 导航是否含 v3.0.0 内容
- [ ] DOC2：归档 `.sddu/docs/` 下 17+ 个冗余 Wave1 迁移文件（`migration-status-achieved-wave1-*-verified-final-*`）
- [ ] TD3 / TD4：评估清理旧 schema 文件 schema-v1.2.5.ts / schema-v2.0.0.ts（仅测试参考用途，无功能依赖）
- [ ] TD7：更新 root state.json 中 `features.completed` 的陈旧命名空间（仍为 T-001 ~ T-018）
- [ ] TD9：修正 specs-tree-agent-output-templating plan.md 的示例路径引用（审查报告改进项 #2，非阻塞）
- [ ] T1：修复 4 个预存测试失败（2 timeout + 1 断言 + 1 OOM；status-enhancement 中标记为非本次引入）
- [ ] TD2：为 consistency-checker 补充含真实 `.sddu/` 目录结构的集成测试（当前仅 28 用例单元测试）
- [ ] TD1：将仪表盘分类 / 排序 / 过滤逻辑迁入 `src/state/dashboard-renderer.ts` 以支持单元测试
- [ ] TD8：在实际 opencode 环境执行 `@sddu 状态`，比对 AI Agent 行为与模板描述是否一致
- [ ] S7：统一 validate.md / validation.md / validation-report.md 等文件命名（v2.7.0 遗留）
- [ ] S9：为 docs / roadmap / help 等辅助 Agent 补输出模板（agent-output-templating 仅覆盖 6 主流程 Agent）
- [ ] S5 / S6：TUI 界面与 MCP 集成（v2.5.0 遗留，持续延期，无明确需求；部分能力可经 Skill 化实现）
- [ ] S1 / S2 / S3：模板校验工具命令（FR-014）、多套内置模板风格（FR-015）、模板版本管理（FR-016）— spec 中标记为「未来」
- [ ] 短期（2 周内）：对选中 Feature 执行完整 SDDU 工作流（discovery → spec → plan → tasks）；FR-BUG-001 / FR-WORKTREE-001 优先走 Skill 化路径（`sddu-skill-creator` 创建 → `sddu-skill-sync` 同步）
- [ ] 中期（1 个月内）：完成 v3.0.0 剩余 P0（FR-QUALITY-001）与 v3.1.0 Skill 化项；启动 v3.3.0「自主-约束」双翼（FR-RATIONAL-001 与后续重启评估）；FR-KB-001 与 FR-CONTEXT-001 协同收拢需求
- [ ] FR-RATIONAL-001 启动条件：v3.0.0~v3.2.0 全部交付 + 用户反馈 Agent 偷懒 / 走形式问题频发；建议采用「Skill 知识库 + 模板强制约束」混合方案
- [ ] FR-DISCOVERY-002 启动条件：v3.0.0~v3.2.0 全部交付 + 用户反馈 Discovery 交互轮次过多 / 耗时过长；可与 FR-RATIONAL-001 并行
- [ ] FR-CONTEXT-001 启动条件：v3.0.0/v3.1.0 P0 Feature 全部交付 + FR-KB-001 启动（可并行互补）
- [ ] FR-CROSSPLAT-001 启动条件：OpenCode 之外的主流 AI Agent 平台出现明确需求 + adapters/ 架构成熟
- [ ] FR-AUTOTRIGGER-001 启动条件：用户反馈「忘记调用 @sddu」成为痛点
- [ ] SUS1：创建 ETD 独立仓库（ETD-001 已迁出，targetRepo 仍为「待创建」）
- [ ] SUS3：specs-tree-sdd-workflow-state-optimization 无 review/validation 文件（pre-SDDU 时代特征，功能已完成，确认无需补）
- [ ] 远期（季度回顾）：复核竞品借鉴项启动条件；回顾 FR-SKILL-001 运营效果（skills 填充活跃度 / 降级模型价值 / Agent 新增门禁执行情况）；同步更新本 Roadmap
- [ ] （锚点说明）本清单中的 FR-QUALITY-001 / FR-QUALITY-002 / FR-QUALITY-004 / FR-QUALITY-005 / FR-QUALITY-006、FR-BUG-001、FR-WORKTREE-001、FR-KB-001、FR-CONTEXT-001、FR-DISCOVERY-002、FR-RATIONAL-001、FR-CROSSPLAT-001、FR-AUTOTRIGGER-001 均为未立项提案（无 specs-tree 目录）；已立项 Feature 的 specs-tree 目录锚点见「特性索引」
<!-- /sddu:zone -->

## 8. 修订记录

<!-- sddu:zone id="revision-log" mode="preserve" -->
| 版本 | 变更说明 | 日期 | 修订人 |
|------|---------|------|--------|
| v9.0.0 | 重大更新：反映 FR-FRAMEWORK-ARCH-001（v4.0.0）已完成交付 | 2026-06-21 | SDDU Roadmap Agent |
| v17.0.0 | 新增 FR-AGENT-SCOPE-001（plan/review/validate 职责回归改造，RICE 12.2，归属 v3.0.0）；FR-QUALITY-003 标记 superseded（Issue F 改由职责回归根本解决）；更新 RICE 排名 / 推荐启动顺序 / 依赖链 / 4 项专属风险 / 拆分建议（推荐单 Feature）与待 spec 决策项（产物清单归属 vs 策略归属）；待处理项目 45→46、新提案 2→3 | 2026-07-25 | SDDU Roadmap Agent |
| v18.0.0 | 纳入 Grillme 竞品调研：新增 FR-CONTEXT-001（共享语言，RICE 18.0，v3.2.0）与 FR-DISCOVERY-002（访谈效率，RICE 22.4，v3.3.0），均标记 P2 低优先级；FR-AGENT-SCOPE-001 连带融入 2 项改进（代码一致性预检 + ADR 触发条件）；待处理项目 46→48、新提案 3→5、竞品借鉴 3→7 Feature + 2 内联改进；更新版本总览 / RICE 排名 / 依赖链 / 3 项风险 / 行动项 / 参考链接 | 2026-08-05 | SDDU Roadmap Agent |
| v19.0.0 | 新增 FR-AUTONOMY-001（自主模式，RICE 10.5 按 P0 战略升格，归属 v3.3.0，四维决策边界模型 + 三级自主级别 + HARD-GATE 强制确认）；回补 FR-AGENT-SCOPE-001（08-01 validated）、FR-TREE-SKILL（07-22 有条件通过）、FR-DOCS-OPT-001（07-05 completed）三项状态；validated 18→21、新提案 5→6、待处理 ~48→~45；更新版本总览 / RICE 排名（第 8 位）/ 依赖链（TPL-001、KB-001、AGENT-SCOPE-001、RATIONAL-001、DISCOVERY-002、AUTOTRIGGER-001）/ 5 项专属风险 / 下一步行动 | 2026-08-15 | SDDU Roadmap Agent |
| v19.0.1 | FR-AUTONOMY-001（自主模式）长期搁置：auto 效果不稳定（用户实测反馈），无恢复期限；实施代码保留在 `feature/autonomous-mode`，main 仅留设计文档（见 specs-tree-autonomous-mode/SHELF.md）；其 discovery 启动项与 scope 关系评审项一并作废 | 2026-09-13 | SDDU Roadmap Agent |
| v20.0.0 | 按输出模板 v3.1.4 完整重写：旧文档（1382 行、结构混乱）→ 8 章新结构（元数据头 12 字段 + 9 个 zone）；内容无损迁移，「特性索引」以 24 个 state.json 实时投影重建，R3 特性索引 / R4 锚点与取值链 / R5 回退规则落地；旧文档的审计台账与覆盖率附录按模板边界外移并逐项说明；备份见 `.sddu/ROADMAP.md.bak-20260924` | 2026-09-24 | SDDU Roadmap Agent |
<!-- /sddu:zone -->
