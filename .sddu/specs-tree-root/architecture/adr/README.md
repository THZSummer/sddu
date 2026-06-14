# Directory: .sddu/specs-tree-root/architecture/adr/

## 目录简介
架构决策记录 (ADR - Architecture Decision Record) 集合，记录 SDDU 系统的关键架构决策及其背景、影响。

## 目录结构
```
adr/
├── README.md                          # 本文件 - 目录导航
├── ADR-001.md                         # 分布式状态存储架构
├── ADR-002.md                         # bcrypt 密码加密方案
├── ADR-003.md                         # Discovery 阶段可选而非强制
├── ADR-004.md                         # 辅导模式采用 4 级分类
├── ADR-005.md                         # 7 步工作流固定顺序执行
├── ADR-006.md                         # StateMachine 集成策略
├── ADR-007.md                         # 状态自动更新机制
├── ADR-008.md                         # 状态历史记录格式
├── ADR-009.md                         # 依赖检查器实现方案
├── ADR-010.md                         # State Schema v2.0.0 迁移
├── ADR-011.md                         # 统一类型导出架构
├── ADR-012.md                         # 统一错误处理体系
├── ADR-013.md                         # Agent 动态注册机制
├── ADR-014.md                         # 打包分发结构优化
├── ADR-015.md                         # 原地升级 Schema 而非新建文件
├── ADR-016.md                         # TreeScanner 为纯模块
└── ADR-017.md                         # 完全分布式状态管理
```

## 文件说明
| 文件 | 说明 | 状态 |
|------|------|------|
| ADR-001.md | 分布式状态存储架构 — 决定采用分布式状态文件设计 | ✅ 存在 |
| ADR-002.md | bcrypt 密码加密方案 | ✅ 存在 |
| ADR-003.md | Discovery 阶段可选而非强制 | ✅ 存在 |
| ADR-004.md | 辅导模式采用 4 级分类 | ✅ 存在 |
| ADR-005.md | 7 步工作流固定顺序执行 | ✅ 存在 |
| ADR-006.md | StateMachine 集成策略 | ✅ 存在 |
| ADR-007.md | 状态自动更新机制 | ✅ 存在 |
| ADR-008.md | 状态历史记录格式 | ✅ 存在 |
| ADR-009.md | 依赖检查器实现方案 | ✅ 存在 |
| ADR-010.md | State Schema v2.0.0 迁移 | ✅ 存在 |
| ADR-011.md | 统一类型导出架构 | ✅ 存在 |
| ADR-012.md | 统一错误处理体系 | ✅ 存在 |
| ADR-013.md | Agent 动态注册机制 | ✅ 存在 |
| ADR-014.md | 打包分发结构优化 | ✅ 存在 |
| ADR-015.md | 原地升级 Schema 而非新建文件 | ✅ 存在 |
| ADR-016.md | TreeScanner 为纯模块 | ✅ 存在 |
| ADR-017.md | 完全分布式状态管理 | ✅ 存在 |

## ADR 格式
每个 ADR 文档遵循标准格式：
- 元数据表 (ID、标题、状态、日期、作者)
- 背景与问题陈述
- 决策方案
- 影响分析
- 相关 Feature

## 上级目录
- [返回上级](../README.md)
- [返回首页](../../README.md)

## 子 Feature 中的 ADR
以下 ADR 位于各自 Feature 目录中，与主 adr/ 并列：

| 位置 | ADR | 说明 |
|------|-----|------|
| `../specs-tree-agent-output-templating/decisions/` | ADR-018 | Agent 输出模板解析 — AI-Side 方案 |
| `../specs-tree-agent-output-templating/decisions/` | ADR-019 | 模板变量格式为 `<<变量名>>` |
| `../specs-tree-sddu-status-enhancement/` | ADR-020 | 两字段隔离模型 — Phase + Status 完全独立 |
| `../specs-tree-tree-structure-optimization-v2/decisions/` | ADR-V2-001 ~ V2-005 | 树形结构优化 v2 相关决策 (5 篇) |
