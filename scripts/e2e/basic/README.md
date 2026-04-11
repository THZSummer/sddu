# 基础 E2E 测试脚本

## 技术栈
- TypeScript 单项目
- Node.js 运行时
- 无需 Docker（纯代码生成测试）

## 使用方式
```bash
bash sddu-e2e.sh "project-name" --auto
```

## 工作流程
1. 创建 SDDU 测试环境
2. 生成提示词文件（定义 TypeScript 项目架构）
3. 用户执行 `@sddu` 开始 SDDU 工作流
4. Phase 4 (Build) 时由 Agent 生成 TypeScript 代码

## 与全栈 E2E 的区别
- **基础 E2E**: 单项目（TypeScript），无模板，代码由 Agent 生成
- **全栈 E2E**: 前后端分离（SpringBoot + React），有 templates/ 参考
