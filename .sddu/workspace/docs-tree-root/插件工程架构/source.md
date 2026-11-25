# 源 Feature 一览

## specs-tree-framework-architecture

| 属性 | 值 |
|------|------|
| **标识** | specs-tree-framework-architecture |
| **名称** | 框架架构 |
| **阶段** | validated |
| **描述** | 定义 SDDU 插件三层工程架构，实现方法论核心与平台适配层分离 |

### 包含内容

- 三层架构设计（核心业务层 / 平台适配层 / 共享层）
- 模块 API 契约与统一导出
- 构建与打包分发流程
- 测试组织策略

---

## specs-tree-sdd-tools-optimization

| 属性 | 值 |
|------|------|
| **标识** | specs-tree-sdd-tools-optimization |
| **名称** | SDDU 工具优化 |
| **阶段** | completed |
| **描述** | 优化 SDDU 工具链的构建脚本、安装脚本和打包分发机制 |

### 包含内容

- `build-agents.cjs` 模板编译工具
- 多平台安装脚本（`install.sh` / `install.ps1`）
- `dist/` 扁平化打包
