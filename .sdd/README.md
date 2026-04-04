# SDD Workspace

## 目录结构

```
.sdd/
├── README.md              # 本文件 - SDD 工作空间说明
├── ROADMAP.md             # 版本路线图
├── config.json            # SDD 配置（可选）
└── .specs/                # 规范文件目录
    ├── README.md          # 目录说明
    └── [feature]/         # Feature 目录
```

## 快速开始

1. 使用 `@sdd 开始 [feature 名称]` 开始新 feature
2. 规范文件将自动创建在 `.sdd/.specs/` 目录
3. 文档会自动维护，无需手动创建 README

## Agents

- `@sdd` - 智能入口
- `@sdd-docs` - 目录导航（自动触发）
- `@sdd-roadmap` - Roadmap 规划
