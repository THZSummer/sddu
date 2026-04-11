# SDDU E2E 测试脚本

## 目录结构

```
e2e/
├── README.md                 # 本文件
├── basic/                    # 基础 E2E（TypeScript 单项目）
│   ├── sddu-e2e.sh
│   └── README.md
└── fullstack/                # 全栈 E2E（前后端分离）
    ├── sddu-e2e-fullstack.sh
    ├── templates/            # 全栈专用模板
    │   ├── backend/          # SpringBoot 后端模板
    │   ├── frontend/         # React 前端模板
    │   └── docker-compose.yml
    └── README.md
```

## 使用方式

### 基础 E2E（TypeScript 单项目）
```bash
bash scripts/e2e/basic/sddu-e2e.sh "project-name" --auto
```

### 全栈 E2E（前后端分离）
```bash
bash scripts/e2e/fullstack/sddu-e2e-fullstack.sh "project-name" --auto
```

## 设计原则

1. **每个 E2E 脚本有自己的资源目录**
   - 基础 E2E: 无需模板（纯 TypeScript 代码由 Agent 生成）
   - 全栈 E2E: 有 templates/ 目录（Phase 4 参考）

2. **模板不直接复制**
   - 模板作为 Agent 参考示例
   - 在提示词中说明架构要求
   - Phase 4 (Build) 时由 Agent 生成代码

3. **脚本自包含**
   - 每个 E2E 脚本 + 自己的资源
   - 不依赖项目根目录
   - 可独立运行
