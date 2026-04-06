# SDD 容器化结构迁移指南

## 概述

本文档介绍如何从旧版 SDD 目录结构迁移到新的容器化目录结构。新的结构更加清晰、可扩展，并支持更好的向后兼容性。

## 新结构 vs 旧结构

### 旧结构
```
.project-root/
├── .specs/                       # SDD 规范和状态
│   ├── [feature-id]/
│   │   ├── spec.md
│   │   ├── plan.md
│   │   ├── tasks.md
│   │   ├── state.json
│   │   └── README.md
│   └── ...
└── project-files...
```

### 新结构（容器化结构）
```
.project-root/
├── .sdd/                         # SDD 工作空间容器
│   ├── README.md                 # SDD 说明
│   └── .specs/                   # 规范文件隔离目录
│       ├── spec.md               # 主 Feature 规范
│       ├── plan.md               # 整体技术架构
│       ├── tasks.md              # 并行任务分组
│       ├── state.json            # Feature 整体状态
│       ├── [sub-feature-id]/     # 子 Feature 目录（同级）
│       │   ├── spec.md
│       │   ├── plan.md
│       │   ├── tasks.md
│       │   └── state.json
│       └── ...
└── project-files...
```

## 迁移说明

### 工作空间识别
- **新结构**: 优先查找 `.sdd/` 目录，其次是 `.specs/`（兼容模式）
- **环境变量**: 支持 `SDD_WORKSPACE` 环境变量覆盖默认行为

### 状态文件变更（State Schema v1.2.11）
- **移除字段**: `mode` 和 `subFeatures` 字段被移除
- **原因**: 模式识别现在通过目录结构自动完成
  - 有同级子 Feature 目录 = multi 模式
  - 无同级子 Feature 目录 = single 模式
- **新行为**: 不再需要显式设置状态文件的模式字段

### 子 Feature 结构
- **旧结构**: 子 Feature 在 `sub-features/` 子目录中
- **新结构**: 子 Feature 位于 `.sdd/.specs/[sub-feature-id]/` 同级目录
- **优点**: 更好的组织和并行访问能力

## 迁移步骤

### 选项 1：自动迁移（推荐）
1. 运行最新的 SDD 命令
2. 新版本会自动检测并提供迁移建议

### 选项 2：手动迁移
1. 创建新目录结构：
   ```bash
   mkdir -p .sdd/.specs
   ```
2. 将 `.specs/*` 内容移动到 `.sdd/.specs/`
   ```bash
   mv .specs/* .sdd/.specs/
   ```
3. 如果没有 `.specs/` 之外的特殊配置，则可以删除空的 `.specs/` 目录
4. 创建 `.sdd/README.md` 文件记录新的结构变化

## 兼容性保证

- **向后兼容**: 旧项目无需立即迁移即可继续使用
- **状态迁移**: 旧版本的状态文件会被自动备份并尝试迁移
- **命令不变**: `@sdd-*` 命令的工作方式保持一致

## 常见问题

**问**: 我的项目仍在使用旧 `.specs/` 结构怎么办？
**答**: 您无需立即更改。新版本将继续支持旧结构，但建议创建新项目时使用新结构。

**问**: 我可以同时维护新旧两个结构吗？
**答**: 不建议这样做，可能会导致混淆。推荐逐步迁移到新结构或保持原有结构。

## 了解更多

了解更多关于新结构的信息请查阅：
- [.sdd/README.md](./README.md) - SDD 容器化结构说明
- [官方文档](/) - 完整的 SDD 功能文档

## 验证迁移

完成迁移后，可通过以下指令验证结构是否正确：
1. 检查目录结构：`ls -la .sdd/.specs/`
2. 确认状态正常：`@sdd [feature-name]` 命令正常工作
3. 测试功能：验证 SDD 命令操作是否按预期工作