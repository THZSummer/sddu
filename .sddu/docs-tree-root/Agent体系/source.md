# Agent 体系 — 产物溯源

> **文档定位**: 列出本文档聚合了哪些原始 SDDU Feature 产物
> **输出文件名**: source.md
> **数据来源**: 聚合自 specs-tree-root/ 下各 Feature 目录的 state.json
> **创建人**: SDDU Docs Agent
> **创建时间**: 2026-07-05
> **版本**: v1.0

## Feature 清单

| Feature 目录 | ID | 名称 | 版本 | 状态 | 本文档已引用 |
|-------------|-----|------|:----:|:----:|:----------:|
| specs-tree-docs-agent-optimization | FR-DOCS-OPT-001 | @sddu-docs Agent 补全与优化 | v3.0.0 | ✅ completed | spec.md, plan.md, ADR-001, ADR-002, ADR-003, state.json |
| specs-tree-sdd-plugin-roadmap | FR-ROADMAP-001 | SDD Roadmap 规划专家 | v1.0.0 | ✅ completed | spec.md, plan.md, state.json |
| specs-tree-sdd-plugin-baseline | SDD-PLUGIN-BASE | SDD Plugin Phase 1 基线 | v1.1.0 | ✅ completed | spec.md, state.json |
| specs-tree-agent-output-templating | FR-TEMPLATE-001 | Agent 输出模板化系统 | v2.5.0 | ✅ completed | spec.md |
| specs-tree-template-quality-unification | FR-TPL-001 | 预置输出模板质量统一 | v3.0.1 | ✅ completed | spec.md |

## 补充材料来源

| 来源 | 用途 |
|------|------|
| `.sddu/specs-tree-root/architecture/adr/` | 体系 ADR 对照（ADR-001~ADR-017） |
| `.sddu/ROADMAP.md` | 版本演进时间线、Feature 状态、三 Agent 数据 |
| `.sddu/TREE.md` | 目录结构验证 |
| `.sddu/specs-tree-root/state.json` | 全局 Feature 状态确认 |

## 本文档内容与原始产物的关系

| 本文档章节 | 主要来源 |
|-----------|---------|
| §1.2 概述 | docs-agent-optimization/spec.md + baseline/spec.md |
| §1.3 Agent 分类 | baseline/spec.md §8.1 + template-quality-unification |
| §1.4 核心设计原则 | docs-agent-optimization/ADR-002 + baseline/spec.md |
| §1.5 @sddu-docs 高级特性 | docs-agent-optimization/spec.md FR-003/FR-009 + ADR-003 |
| §1.6 Agent 架构 | docs-agent-optimization/plan.md §2.1 |
| §2.1 技术栈 | agent-output-templating/spec.md |
| §2.2 关键 ADR | docs-agent-optimization/ADR-{001,002,003} + roadmap/plan.md |
| §2.3 版本演进 | ROADMAP.md |

### 原始产物使用说明

- **spec.md**: 提取 Agent 功能需求、分类、边界定义
- **plan.md**: 提取架构设计、技术栈、方案对比、ADR
- **ADR**: 直接引用的架构决策记录
- **state.json**: 提取版本号、状态、阶段历史

## 修订记录

| 生成时间 | 变更 Feature | 生成方式 | 修订人 |
|---------|-------------|:--:|--------|
| 2026-07-05 | 初始生成 | 全量 | SDDU Docs Agent |
