# Agent 体系 — ADR 索引

> **文档定位**: Agent 体系相关架构决策记录索引
> **输出文件名**: adr-index.md
> **数据来源**: 聚合自 specs-tree-root/specs-tree-docs-agent-optimization/ADR-*, specs-tree-root/specs-tree-sdd-plugin-roadmap/plan.md
> **创建人**: SDDU Docs Agent
> **创建时间**: 2026-07-05
> **版本**: v1.0

## 来自 specs-tree-docs-agent-optimization

| # | ADR | 状态 | 决策摘要 | 源文件 |
|:-:|-----|:----:|---------|--------|
| 1 | **ADR-001: Agent-Native 扫描方案** | PROPOSED | 所有 Feature 扫描、产物提取、信息聚合逻辑均在 `src/templates/agents/sddu-docs.md.hbs` 指令模板中定义，由 LLM Agent 执行。拒绝混合缓存层（方案 B）和构建脚本驱动（方案 C）两条替代路径 | `ADR-001-agent-native-scanning-approach.md` |
| 2 | **ADR-002: 三 Agent 7 维度边界定义** | PROPOSED | 明确定义 @sddu-docs / @sddu-tree / @sddu-roadmap 在扫描范围、不触碰区、输入、输出、消费方、触发时机、语义区分 7 个维度的边界。输出文件互斥（docs-tree-root / TREE.md / ROADMAP.md），输入维度不同互不冲突 | `ADR-002-three-agent-boundary-definition.md` |
| 3 | **ADR-003: 双模式架构** | PROPOSED | @sddu-docs 采用双模式架构：模式 1（specs-tree 主模式）扫描 `.sddu/specs-tree-root/` 过程产物；模式 2（代码扫描模式）由用户明确触发短语驱动扫描源代码和配置。两种模式不耦合、不自动降级、产物通过头部标注区分 | `ADR-003-docs-dual-mode-architecture.md` |

## 来自 specs-tree-sdd-plugin-roadmap（内联 ADR）

以下 ADR 定义于 `plan.md` 中，未独立成文件：

| # | ADR | 决策摘要 | 来源 |
|:-:|-----|---------|------|
| 4 | **ADR-001: 单一输出文件原则** | 只生成 `.sdd/ROADMAP.md` 一个文件。执行摘要放在文档顶部（前 20%），避免文件碎片化 | `plan.md §关键技术决策` |
| 5 | **ADR-002: 灵活输入设计** | 支持多种输入方式（单个 Feature、批量、仅约束、完全开放、基于现有文档），由 Agent 负责信息整理和补全 | `plan.md §关键技术决策` |
| 6 | **ADR-003: 温度参数设置** | temperature: 0.4 — 介于创造性（0.7）和严谨性（0.2）之间，兼顾规划建议的创新性和逻辑推理的严谨性 | `plan.md §关键技术决策` |

## 按影响范围分类

| 范围 | ADR |
|------|-----|
| **跨 Agent 体系** | ADR-002（三 Agent 边界），ADR-003（双模式架构） |
| **@sddu-docs 专属** | ADR-001（Agent-Native 扫描方案），ADR-003（双模式架构） |
| **@sddu-roadmap 专属** | ADR-001（单一输出文件），ADR-002（灵活输入），ADR-003（温度参数） |

## 修订记录

| 生成时间 | 变更 Feature | 生成方式 | 修订人 |
|---------|-------------|:--:|--------|
| 2026-07-05 | 初始生成 | 全量 | SDDU Docs Agent |
