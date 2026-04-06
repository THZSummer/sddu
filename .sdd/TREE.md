# .sdd 目录结构规范

## 概述

`.sdd` 目录是 **Software Development Definition (SDD)** 工作流的核心存储位置。该目录用于保存项目的设计规范、开发规划、实施计划等功能性文档，以及开发相关的元数据和配置。

## 目录树结构

```
.sdd/
├── README.md                       # SDD 工作空间说明
├── TREE.md                         # 目录结构定义（本文档）
├── ROADMAP.md                      # 版本路线图
└── specs-tree-root/                # 规范文件根目录（核心）
    ├── README.md                   # 目录导航说明
    ├── state.json                  # 集中状态管理
    ├── architecture/               # 架构目录（空，待清理）
    ├── specs-tree-deprecate-sdd-tools/        # Feature: 废弃 SDD 工具
    ├── specs-tree-directory-optimization/     # Feature: 目录结构优化
    ├── specs-tree-sdd-discovery-feature/      # Feature: Discovery 能力增强
    ├── specs-tree-sdd-multi-module/           # Feature: 子 Feature 并行开发
    ├── specs-tree-sdd-plugin-baseline/        # Feature: Phase 1 基线
    ├── specs-tree-sdd-plugin-roadmap/         # Feature: Roadmap 规划专家
    ├── specs-tree-sdd-tools-optimization/     # Feature: 工具系统优化
    └── specs-tree-sdd-workflow-state-optimization/ # Feature: 工作流状态优化
```

### 目录说明

| 目录/文件 | 类型 | 说明 |
|-----------|------|------|
| `README.md` | 文档 | SDD 工作空间入口说明 |
| `TREE.md` | 文档 | 目录结构规范（本文档） |
| `ROADMAP.md` | 文档 | 多版本路线图规划 |
| `specs-tree-root/` | 目录 | **核心目录**，所有 Feature 规范文件 |
| `specs-tree-root/state.json` | JSON | 集中状态管理（8 个 Feature） |

### 已清理的临时目录

以下目录已在 2026-04-06 清理中移除：

| 目录 | 迁移/删除 | 说明 |
|------|----------|------|
| `.specs/` | 删除 | 历史兼容目录 |
| `docs/` | 迁移到 `docs/` | 文档目录 |
| `src/` | 删除 | 临时源码（使用项目主 `src/`） |
| `tests/` | 迁移到 `tests/` | 测试目录 |
| `tmp/` | 删除 | 临时文件 |

### Feature 结构

每个 `specs-tree-[feature]/` 目录包含：

```
specs-tree-[feature]/
├── spec.md            # 需求规格说明
├── plan.md            # 技术规划
├── tasks.md           # 任务分解
├── review.md          # 代码审查报告
├── validation.md      # 最终验证报告
├── README.md          # 导航文档
└── .state.json        # 状态文件（可选，集中管理在 state.json）
```

## 命名规范

### specs 目录命名
- 所有 specs 目录必须以 `specs-tree-` 前缀开头
- 使用有意义的功能名称，避免过于宽泛的词汇
- 采用 kebab-case：`specs-tree-my-awesome-feature`
- 优先使用业务领域术语而非技术术语

### 推荐的命名实例
- ✅ `specs-tree-user-authentication`：用户认证 specs
- ✅ `specs-tree-api-rate-limiting`：API 限流 specs
- ✅ `specs-tree-database-migration`：数据库迁移 specs
- ✅ `specs-tree-login`：登录子 specs
- ✅ `specs-tree-payment-process`：支付处理子 specs

## 使用规则

⚠️ **所有 .sdd 内部活动必须参考本文件**

### 操作规范
1. **严格禁止手动编辑** `spec.md` / `plan.md` / `tasks.md` 等关键文档 - 应通过 `@sdd-*` 命令自动生成
2. **新增 specs**必须首先在 `specs-tree-root/` 下创建对应的 `specs-tree-xxx` 目录
3. **每个 specs**遵循 `spec` → `plan` → `tasks` → `build` → `review` → `validate` 的工作流
4. **状态同步**：每次工作流变更都应更新对应 `state.json`

### 索引维护
- 每次添加新 specs 目录时，必须相应更新根目录的 `README.md` 和 `specs-tree-root/README.md`
- 状态变更需反映在导航文档中

### 版本控制策略
- `.sdd` 目录整体纳入版本控制
- 敏感信息严禁存在于 `.sdd/` 目录中
- 保证 `.sdd` 在 CI/CD 流程中可用
- 非必要时不使用 `.gitignore` 屏蔽 `.sdd` 内文件

## 文件组织原则

### 结构化存储
根据生命周期将数据隔离，每个阶段使用独立的文件便于：
- 需求分析阶段关注 `spec.md`
- 设计阶段关注 `plan.md` 
- 实现阶段通过 `tasks.md` 追踪进度

### 明确边界
- `.sdd` 作为规范定义区域，**仅存放 SDD 规范文件**
- 源码存放在项目主 `src/` 目录
- 测试存放在项目主 `tests/` 目录
- 文档存放在项目主 `docs/` 目录
- 不存放临时工件或实验文件

### 可追溯性
- 每次对功能实现的修改都有对应的规范文件进行支撑
- 通过 `state.json` 状态文件记录变更历史

### 最小权限
- 不同团队成员根据权限级别访问相应规范文件
- 核心规范文件（spec、plan）变更需经过评审流程

---

💡 **注意**：此规范文档是 SDD 工作流程的权威规范，任何对 .sdd 目录的操作应遵循本文档所定义的规则。