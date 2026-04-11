# 全栈 E2E 测试脚本

## 技术栈
- 后端：SpringBoot 3.x + Java 17 + H2 + Docker
- 前端：React 18 + TypeScript 5 + Vite 5 + Docker
- 部署：Docker Compose

## 使用方式
```bash
bash sddu-e2e-fullstack.sh "project-name" --auto
```

## 模板目录
`templates/` 包含：
- `backend/` - SpringBoot 项目模板
- `frontend/` - React 项目模板
- `docker-compose.yml` - Docker 编排

## 工作流程
1. 创建 SDDU 测试环境
2. 生成提示词文件（定义前后端架构）
3. 用户执行 `@sddu` 开始 SDDU 工作流
4. Phase 4 (Build) 时参考 templates/ 生成代码
