# SDDU 容器化结构快速参考

## 概述

SDDU (Specification-Driven Development Ultimate) 的容器化结构提供了一个清晰、隔离和可扩展的工作空间组织方式。

## 目录结构

```
.sddu/                             # SDDU 工作空间容器
├── README.md                     # 容器化工作空间说明
├── ROADMAP.md                    # 项目路线图  
├── config.json                   # SDDU 配置
├── docs/                         # 文档目录
│   └── guide.md                  # 使用指南
└── .specs/                       # 规范文件隔离目录
    ├── spec.md                   # 主 Feature 规范
    ├── plan.md                   # 技术架构
    ├── tasks.md                  # 任务分组
    ├── state.json                # 整体状态
    ├── [sub-feature-id]/         # 子 Feature 目录（同级）
    │   ├── spec.md
    │   ├── plan.md
    │   ├── tasks.md
    │   └── state.json
    └── ...
```

## 关键特性

### 容器化 (Containerization)
- `.sdd/` 作为 SDD 工作空间的专用容器
- 与项目代码完全隔离，避免冲突

### 隔离化 (Isolation) 
- 规范文件存储在 `.sdd/.specs/` 目录中
- 与应用代码和其他项目文件隔离

### 扩展性 (Scalability)
- 支持从简单的单 Feature 项目扩展到多子 Feature 项目
- 子 Feature 使用同级扁平结构

## 使用指南

### 创建新项目
1. 运行 `@sddu [feature-name]` 创建项目
2. SDDU 自动创建容器化结构

### 管理子 Feature
- 子 Feature 在 `.sdd/.specs/[sub-feature-id]/` 创建
- 每个子 Feature 具有相同的文档结构

### 查看项目状态
- 使用 `@sddu-status` 查看整个容器的状态
- 也可逐个查看子 Feature 状态

## 常见问题

**问：为什么需要容器化结构?**
答：为了更好地组织规范文件，避免与项目代码混杂，并支持更大规模的项目开发。

**问：这个结构适用于 SDDU 环境吗?** 
答：是的，SDDU 使用这个容器化结构作为标准工作区管理方式。

**问：目录结构可以自定义吗?**
答：我们建议使用标准结构以获得最佳 SDDU 体验，但这不会限制其他工作流工具的使用。