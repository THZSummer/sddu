# SDD Specs Tree Root

这是 SDD (Specifications-Driven Development) 系统的规范根目录。根据最新容器化结构设计，所有规范现在位于 `.sdd/.specs/` 目录中。

## 容器化目录结构

```
.sdd/                             # SDD 工作空间容器（必选）
├── README.md                     # SDD 使用说明（必选）
├── ROADMAP.md                    # 版本路线图  
├── config.json                   # SDD 配置（可选）
├── docs/                         # 文档目录
│   └── migration-guide.md        # 迁移指南
└── .specs/                       # SDD 规范文件目录（必选）
    ├── spec.md                   # 主 Feature 规范
    ├── plan.md                   # 整体技术架构
    ├── tasks.md                  # 并行任务分组
    ├── state.json                # Feature 整体状态
    ├── [sub-feature-id]/         # 子 Feature 目录（同级扁平结构）
    │   ├── spec.md               # 需求规格（必选）
    │   ├── plan.md               # 技术规划（必选）
    │   ├── tasks.md              # 任务分解（必选）
    │   ├── state.json            # 状态文件（必选）
    │   └── README.md             # 目录说明（必选）
    └── ...
```

## 使用模式

### 单 Feature 模式
适用于相对简单的功能开发，在 `.sdd/.specs/` 目录下只有主 Feature 文件，无子 Feature 目录。

### 多 Sub-Feature 模式
适用于大型复杂项目，支持拆分为多个子 Feature 并行开发。

## 功能概览
当前包含以下主要特性模块：

1. **login-module** - 登录认证模块（P0 优先级，已规划）
2. **specs-tree-agentic** - SDD 智能化功能
3. **specs-tree-directory-naming** - 目录结构命名约定
4. **specs-tree-directory-optimization** - 目录结构优化（当前执行的迁移）
5. **specs-tree-state-json-fix** - 状态管理 JSON 修复
6. 以及其他正在开发的 specs-tree 系列功能

## 特性目录列表

| 目录 | 说明 | 状态 | 优先级 |
|------|------|------|--------|
| [login-module/](./login-module/) | 登录认证模块 - 支持用户名密码、手机验证码、第三方 OAuth 登录 | planned | P0 |
| [specs-tree-agentic/](./specs-tree-agentic/) | SDD 智能化功能 | - | - |
| [specs-tree-directory-naming/](./specs-tree-directory-naming/) | 目录结构命名约定 | - | - |
| [specs-tree-directory-optimization/](./specs-tree-directory-optimization/) | 目录结构优化 | - | - |
| [specs-tree-state-json-fix/](./specs-tree-state-json-fix/) | 状态管理 JSON 修复 | - | - |

## 迁移指南

如果您使用的是旧版的 `.specs/` 结构，可以参考 [迁移指南](../docs/migration-guide.md) 来了解如何迁移到新的容器化结构。

## 特性目录约定
所有特性目录均遵循 `specs-tree-[功能命名]` 的命名模式。