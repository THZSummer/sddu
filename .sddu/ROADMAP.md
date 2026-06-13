# SDDU 合并版 Roadmap

> **文档版本**: 4.1.0  
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
| **待处理已知问题** | 9 个 (A-F 来自 sddu-status-enhancement 验证报告，G-I 来自框架质量审查) |

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
| **v3.1.0** | 后续增强 | TBD | 💡 提议中 | Skills / TUI / MCP / 模板质量 / 命名标准化 |
| **v3.2.0** | 项目知识基础设施 | TBD | 💡 提议中 | 全局项目配置 + 知识自动沉淀 |

### 本周优先事项 (2026-06-13 ~ 2026-06-20)

- [ ] 完成 FR-E2E-CLEANUP-001 (E2E 脚本清理和统一规范)
- [ ] 评审 validation report A-F 问题，确定优先级
- [ ] 评审新增 G/H/I 问题，确认问题描述和 Feature 拆分方案
- [ ] 启动 v3.0.0 首个 Feature 的需求挖掘
- [ ] 为 FR-KB-001 (全局项目配置) 收拢初步需求

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
| **G** | **系统预置输出模板格式参差不齐** — 各阶段 Agent 输出的 .md 文件格式不统一、结构松散、可读性差。虽然支持用户自定义模板（`dist/templates/output/` 下的 `.hbs` 文件），但系统预置的默认模板本身质量不高：标题层级混乱、表格格式不统一、内容组织缺乏一致性。需提升预置模板的设计质量和一致性，让开箱即用体验达到基准水平 | 输出模板 (`src/templates/agents/output/`) | 🟡 中 |
| **H** | **缺乏项目级知识沉淀** — 每个 Feature 走完流程后产出物全部散落在各自 Feature 目录下，没有项目级「总览文档」供用户或 AI 快速了解项目全貌。缺失内容包括：系统架构概览、已完成 Feature 清单及核心设计决策、全局术语表、技术约束约定。ROADMAP 是版本规划，解决不了这个问题。需要的是项目知识的结构化沉淀 | SDDU 框架设计 | 🟡 中 |
| **I** | **全局项目规范无法定义和共享** — Agent 面对每个 Feature 都是「零上下文启动」，不知道项目的技术栈约定、命名规范、代码风格、架构原则。同一问题（如「项目用什么数据库」「API 路径什么风格」）每个 Feature 都要和 Agent 重新沟通。缺少一份全局配置文件，让所有 Agent 在启动时自动加载项目级上下文，避免重复沟通 | Agent 上下文加载 | 🔴 高 |

**建议 Feature 拆分 (A-F → v3.0.0)**:

| 提议 Feature | 覆盖问题 | 优先级 | 预计工作量 |
|-------------|----------|:------:|------------|
| FR-QUALITY-001: Build Agent Wave 一体化 | A | P0 🥇 | 3-5 天 |
| FR-QUALITY-002: Validate Agent E2E 能力增强 | C | P0 🥇 | 5-7 天 |
| FR-QUALITY-003: Review/Validate 阶段设计规划 | F | P1 🥈 | 3-5 天 |
| FR-QUALITY-004: 框架级自验证流程 | E | P1 🥈 | 5-7 天 |
| FR-QUALITY-005: Auto-updater Phase 推断修复 | B | P2 | 1-2 天 |
| FR-QUALITY-006: Coordinator 工具兼容性 | D | P2 | 1-2 天 |

**依赖关系 (A-F)**:
```
FR-QUALITY-001 (Build Wave 一体化) ──→ FR-QUALITY-003 (Review/Validate 设计规划)
FR-QUALITY-002 (Validate E2E) ──→ FR-QUALITY-004 (框架自验证)
FR-QUALITY-005 (auto-updater) — 可独立进行
FR-QUALITY-006 (coordinator) — 可独立进行
```

**建议 Feature 拆分 (G-I) → v3.1.0 / v3.2.0**:

| 提议 Feature | 覆盖问题 | 归属版本 | 优先级 | 预计工作量 | 说明 |
|-------------|----------|:------:|:------:|------------|------|
| FR-TPL-001: 预置输出模板质量统一 | G | v3.1.0 | P1 🥈 | 5-7 天 | 重新设计 7 个 Agent 输出模板的格式、标题层级、表格样式，建立一致性设计规范 |
| FR-KB-001: 全局项目配置文件 (`.sddu/project.json`) | I | v3.2.0 | P0 🥇 | 3-5 天 | 定义全局配置文件 schema，Agent 启动时自动加载。包含：技术栈约定、命名规范、代码风格、架构原则、API 路径风格等 |
| FR-KB-002: 项目级知识自动沉淀 | H | v3.2.0 | P1 🥈 | 7-10 天 | 基于 FR-KB-001 的配置，在每个 Feature validated 后自动/半自动聚合产出物为项目级总览文档（架构概览、Feature 清单、术语表、设计决策记录） |

**依赖关系 (G-I)**:
```
FR-TPL-001 (输出模板质量) — 可独立进行（仅改模板内容）
FR-KB-001 (全局项目配置) ──→ FR-KB-002 (项目知识沉淀) — 配置是知识沉淀的前提
```

#### RICE 优先级分析 (全部 9 问题)

| 排名 | Feature | 覆盖 | Reach | Impact | Conf. | Effort | **RICE** | 优先级 |
|:----:|---------|:----:|:-----:|:------:|:-----:|:------:|:--------:|:------:|
| 🥇 | FR-KB-001: 全局项目配置 | I | 10 | 9 | 70% | 4 | **15.8** | P0 |
| 🥈 | FR-QUALITY-001: Build Wave 一体化 | A | 6 | 8 | 80% | 4 | **9.6** | P0 |
| 🥉 | FR-QUALITY-002: Validate E2E | C | 8 | 9 | 70% | 6 | **8.4** | P0 |
| 4 | FR-TPL-001: 模板质量统一 | G | 10 | 5 | 90% | 6 | **7.5** | P1 |
| 5 | FR-QUALITY-003: Review/Validate 设计规划 | F | 5 | 7 | 60% | 4 | **5.3** | P1 |
| 6 | FR-QUALITY-005: auto-updater 修复 | B | 3 | 4 | 80% | 2 | **4.8** | P2 |
| 7 | FR-KB-002: 项目知识沉淀 | H | 8 | 8 | 50% | 8 | **4.0** | P1 |
| 8 | FR-QUALITY-004: 框架自验证 | E | 4 | 7 | 60% | 6 | **2.8** | P1 |
| 9 | FR-QUALITY-006: coordinator 兼容 | D | 2 | 3 | 80% | 2 | **2.4** | P2 |

> **评分说明**: Reach (1-10 影响用户范围)、Impact (1-10 正面影响程度)、Confidence (估算可信度)、Effort (人天)。RICE = (Reach × Impact × Confidence) / Effort。

**关键发现**:
- **FR-KB-001 (全局项目配置)** RICE 得分最高 (15.8)，原因是 Reach 极高（每个 Feature 都受益）+ Impact 大（消除重复沟通）。建议尽早启动。
- **FR-KB-002 (项目知识沉淀)** 虽然 Reach/Impact 高，但 Confidence 仅 50%（scope 需 discovery 确认），Effort 大（7-10 天），RICE 较低 (4.0)。建议 FR-KB-001 落地后再启动。
- **FR-TPL-001 (模板质量)** Reach 满分 (10)，但 Impact 中等 (5，优化体验不增新能力)，属于典型的「高触及、中影响」优化项。

---

### v3.1.0 - 💡 后续增强提议

**预计时间**: TBD  
**状态**: 💡 提议中  
**优先级**: P2

**候选 Feature**:

| Feature | 说明 | 来源 |
|---------|------|------|
| **FR-TPL-001: 预置输出模板质量统一** | 重新设计 7 个 Agent 输出模板，统一标题层级、表格格式、内容组织结构 | Issue G (本次新增) |
| Skills 系统 | Agent Skills 集成 | v2.5.0 遗留 |
| TUI 界面 | 终端用户界面 | v2.5.0 遗留 |
| MCP 集成 | Model Context Protocol | v2.5.0 遗留 |
| 文件命名标准化 | 统一 phase 阶段文件名 (0-discovery.md, 1-spec.md...) | v2.7.0 遗留 |
| Build 阶段文档完善 | 4-build.md 模板 | v2.8.0 遗留 |
| FeatureStateEnum 清理 | 移除 deprecated 类型别名，完成方案 B 迁移 | status-enhancement 遗留 |
| 仪表盘渲染 TypeScript 化 | 分类/排序/过滤逻辑从模板迁入独立模块 | status-enhancement 建议 |

---

### v3.2.0 - 💡 项目知识基础设施

**预计时间**: TBD (建议 v3.1.0 部分完成后启动)  
**状态**: 💡 提议中  
**优先级**: P1 🥈

**背景**: 当前 SDDU 框架在两个关键维度存在缺失：(1) 无全局项目配置文件，导致 Agent 每个 Feature 都「零上下文启动」，重复沟通技术栈约定、命名规范等问题；(2) 各 Feature 产出物散落目录中，无项目级总览文档聚合架构概览、设计决策、术语表等知识。

**核心 Feature**:

| Feature | 覆盖问题 | 优先级 | 预计工作量 |
|---------|----------|:------:|------------|
| **FR-KB-001: 全局项目配置文件** (`.sddu/project.json`) | I | P0 🥇 | 3-5 天 |
| **FR-KB-002: 项目级知识自动沉淀** | H | P1 🥈 | 7-10 天 |

#### FR-KB-001: 全局项目配置文件 (Issue I)

**问题描述**: Agent 面对每个 Feature 都是「零上下文启动」，不知道项目的技术栈约定、命名规范、代码风格、架构原则。同一问题（如「这个项目用什么数据库」、「API 路径是什么风格」）每个 Feature 都要和 Agent 重新沟通。

**范围** (待 discovery 确认):
- 定义 `.sddu/project.json` 配置文件 schema
- 包含字段（建议）: `techStack`、`namingConventions`、`codeStyle`、`architecturePrinciples`、`apiPathStyle`、`globalConstraints`
- Agent 启动时自动加载该配置作为上下文
- 支持 `@sddu project init` 或交互式引导创建
- 与现有 `state.json` 分离，专注「规范约定」而非「状态追踪」

**注意**: 此问题仅记录问题本身和大致方向。具体 scope 和实现方案需经 `@sddu-discovery` 阶段确认。当前描述中以下内容为建议，不预设为结论：
- 配置文件名（`.sddu/project.json`）— 待确认
- 字段列表 — 待通过 discovery 明确
- 加载机制 — 待 plan 阶段设计

#### FR-KB-002: 项目级知识自动沉淀 (Issue H)

**问题描述**: 每个 Feature 走完流程后，产出物（discovery → spec → plan → tasks → build → review → validate）全部散落在各自 Feature 目录下。没有一份项目级「总览文档」供用户或 AI 快速了解项目全貌——例如系统架构概览、已完成 Feature 清单及核心设计决策、全局术语表、技术约束约定。ROADMAP 是版本规划，解决不了这个问题。

**范围** (待 discovery 确认, 依赖 FR-KB-001):
- 自动/半自动聚合各 Feature validated 后的产出物
- 生成/更新项目级知识文档（建议存放于 `.sddu/knowledge/`）
- 可能包含：架构概览、Feature 清单及决策记录、全局术语表、技术约束
- `@sddu-docs` 可能承担部分职责或扩展

**注意**: 此问题仅记录问题本身。具体 scope、产出物格式、聚合机制需经 `@sddu-discovery` 确认。当前描述中的目录结构和输出格式为建议，不预设为结论。

**依赖关系**:
```
FR-KB-001 (全局项目配置) ──→ FR-KB-002 (项目知识沉淀)
    ↑ 配置是知识沉淀的前提：术语表定义、架构原则、技术约束都需要先存在于配置中
```

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
                            ├── v3.1.0 (后续增强) ────────────────────────── 💡
                            │       ├── FR-TPL-001 (模板质量统一)
                            │       ├── Skills 系统
                            │       ├── TUI 界面
                            │       └── MCP 集成
                            │
                            └── v3.2.0 (项目知识基础设施) ──────────────────── 💡
                                    ├── FR-KB-001 (全局项目配置)
                                    └── FR-KB-002 (项目知识沉淀) ← 依赖 KB-001
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
| 项目知识沉淀 (KB-002) 范围不明确 | 中 | 高 | 依赖 FR-KB-001 先落地；discovery 阶段详细界定 scope |
| 全局配置文件 (KB-001) schema 设计争议 | 中 | 中 | 参考主流框架实践；discovery 阶段充分收拢需求 |
| v3.1.0 候选 Feature 过多 (8 → 9 个) | 中 | 中 | 严格 RICE 排序，低于阈值的延后或取消；FR-TPL-001 为新增 P1 |

---

## 📋 下一步行动

### 立即行动 (本周)
1. [ ] 完成 FR-E2E-CLEANUP-001 (E2E 脚本清理和统一规范)
2. [ ] 评审 A-F 问题，确定 v3.0.0 首个 Feature 的 scope
3. [ ] 为 v3.0.0 首个 Feature 启动 `@sddu-discovery`
4. [ ] 评审 G/H/I 问题，确认问题描述准确性（标记了「待确认」的字段需澄清）

### 短期行动 (2 周内)
5. [ ] 启动 FR-QUALITY-001 (Build Agent Wave 一体化) 或 FR-QUALITY-002 (Validate E2E)
6. [ ] 快速修复 FR-QUALITY-005 (auto-updater) 和 FR-QUALITY-006 (coordinator)
7. [ ] 为 FR-KB-001 (全局项目配置) 启动预研，收拢需求

### 中期行动 (1 个月内)
8. [ ] 完成 v3.0.0 全部 P0/P1 Feature
9. [ ] 评估 v3.1.0 Feature 优先级，确认是否启动 FR-TPL-001 (模板质量统一) 或 Skills/TUI/MCP
10. [ ] 启动 FR-KB-001 (全局项目配置) discovery → spec 流程

---

## 📁 相关文档

- 📁 **项目状态**: [state.json](./specs-tree-root/state.json)
- 📝 **规范目录**: [specs-tree-root/README.md](./specs-tree-root/README.md)
- 📋 **状态增强验证报告**: [specs-tree-sddu-status-enhancement/validation-report.md](./specs-tree-root/specs-tree-sddu-status-enhancement/validation-report.md)
- 🏗️ **架构决策**: [architecture/adr/](./specs-tree-root/architecture/adr/)

---

> **文档维护**: 本 Roadmap 是动态文档。建议每季度回顾和更新一次，或每当一个 Feature 完成 validated 阶段时更新状态。
