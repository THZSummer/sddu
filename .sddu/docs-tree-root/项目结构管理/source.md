# 项目结构管理 — Source Features

## specs-tree-directory-optimization

| 属性 | 值 |
|------|-----|
| Feature ID | FR-DIR-001 |
| 目录 | specs-tree-directory-optimization |
| 名称 | specs-tree-root 管理目录结构命名优化 |
| 版本 | v1.0.0 |
| 优先级 | P0 |
| 状态 | ✅ completed |

**核心贡献**：统一了 SDDU 目录命名规范，将遗留的 `.sdd/.specs/` 目录重命名为 `specs-tree-root/`，11 个子目录补齐 `specs-tree-` 前缀，清理了 `.templates/`、`examples/` 等遗留临时目录。更新了 11 个 Agent `.hbs` 模板文件（55+ 处修改）作为认知源头，确保所有 Agent 生成符合规范的目录结构。

---

## specs-tree-tree-structure-optimization

| 属性 | 值 |
|------|-----|
| Feature ID | FR-TREE-001 |
| 目录 | specs-tree-tree-structure-optimization |
| 名称 | v2.4.0 Feature 拆分与树形结构优化 |
| 版本 | v2.1.0 |
| 优先级 | P0 |
| 状态 | ✅ completed |

**核心贡献**：引入树形嵌套结构（类比文件系统），替代扁平化的 `specs-tree-*` 布局。定义父级 Feature（轻量化：仅 discovery/spec/plan + state.json）与叶子 Feature（完整六阶段）的角色分离。新增 `state.json` schema v2.1.0，引入 `childrens` 数组、`depth` 字段、分布式状态管理。实现 TreeScanner 递归扫描、ParentStateManager 父子状态聚合、StateLoader 层级加载、TreeStateValidator 完整性校验四大核心模块。废除集中式 `.sdd/state.json`。

---

## specs-tree-tree-structure-optimization-v2

| 属性 | 值 |
|------|-----|
| Feature ID | FR-TREE-002 |
| 目录 | specs-tree-tree-structure-optimization-v2 |
| 名称 | 树形结构优化 v2 - 问题修复 |
| 版本 | v2.1.0 |
| 优先级 | P0 |
| 状态 | ✅ completed |
| 依赖 | specs-tree-tree-structure-optimization |

**核心贡献**：基于 `blog-platform` 全栈 E2E 测试发现 5 个关键问题并修复。强制 `state.json` 字段校验（version/depth/phaseHistory/dependencies 不可缺失），自动修复不兼容 v2.0 的历史文件。为 Discovery Agent 添加智能拆分建议能力（关键词匹配 frontend-backend / multi-platform / admin-user 模式），Spec Agent 支持接受/拒绝/自定义拆分方案。创建树形嵌套 E2E 测试套件、拆分原则文档（split-principles.md）和三层嵌套示例项目（ecommerce-platform demo）。
