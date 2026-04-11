# SDDU 前后端 E2E 测试指南

## 🎯 功能说明

`sddu-e2e-fullstack.sh` 脚本用于生成**前后端分离项目**的 SDDU 测试环境。

### 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| **后端** | SpringBoot | 3.2 |
| 后端语言 | Java | 17 |
| 数据库 | H2 Database | 内存模式 |
| 构建工具 | Maven | 3.9 |
| **前端** | React | 18 |
| 前端语言 | TypeScript | 5 |
| 构建工具 | Vite | 5 |
| **部署** | Docker + Docker Compose | 最新版本 |

---

## 📦 使用方式

### 基础用法

```bash
# 1. 生成默认项目
bash sddu-e2e-fullstack.sh "my-project"

# 2. 自动执行全流程（推荐）
bash sddu-e2e-fullstack.sh "my-project" --auto

# 3. 生成详细测试报告
bash sddu-e2e-fullstack.sh "my-project" --auto --report
```

### 项目命名规则

- ✅ **必须**以小写字母开头
- ✅ **只能**包含小写字母、数字、连字符
- ❌ **不能**包含大写字母、下划线、空格

**示例**:
- ✅ `smart-coffee-order`
- ✅ `home-fitness-coach`
- ❌ `SmartCoffeeOrder`
- ❌ `smart_coffee_order`

---

## 📁 生成的项目结构

```
my-project/
├── .opencode/                 # OpenCode 配置
│   ├── agents/                # 24 个 SDDU Agent
│   └── plugins/sddu/          # SDDU 插件
├── .sddu/                     # SDDU 工作空间
├── backend/                   # SpringBoot 后端
│   ├── src/main/java/        # Java 源代码
│   ├── src/main/resources/   # 配置文件
│   ├── pom.xml               # Maven 配置
│   └── Dockerfile            # 后端 Docker 镜像
├── frontend/                  # React 前端
│   ├── src/                  # TypeScript 源代码
│   ├── public/               # 静态资源
│   ├── package.json          # NPM 配置
│   ├── vite.config.ts        # Vite 配置
│   ├── tsconfig.json         # TypeScript 配置
│   └── Dockerfile            # 前端 Docker 镜像
├── docker-compose.yml         # Docker 编排配置
├── README.md                  # 项目说明
├── sddu-test-prompt.md       # 测试提示词
└── sddu-test-report.md       # 测试报告（--report 选项）
```

---

## 🚀 快速开始

### 1. 生成测试项目

```bash
cd /home/usb/workspace/wks-sddu/sddu
bash sddu-e2e-fullstack.sh "smart-coffee-fullstack" --auto
```

### 2. 进入项目目录

```bash
cd ../wks-sdd-test-projects/sddu-test-smart-coffee-fullstack
```

### 3. 启动 OpenCode

```bash
opencode
```

### 4. 执行 SDDU 全流程

```bash
# 方式 1: 一键执行
@sddu smart-coffee-fullstack

# 方式 2: 分阶段执行
@sddu-discovery smart-coffee-fullstack   # Phase 0: 需求挖掘
@sddu-1-spec smart-coffee-fullstack      # Phase 1: 规范编写
@sddu-2-plan smart-coffee-fullstack      # Phase 2: 技术规划
@sddu-3-tasks smart-coffee-fullstack     # Phase 3: 任务分解
@sddu-4-build smart-coffee-fullstack     # Phase 4: 代码实现
@sddu-5-review smart-coffee-fullstack    # Phase 5: 代码审查
@sddu-6-validate smart-coffee-fullstack  # Phase 6: 验证确认
```

---

## 💻 本地开发

### 启动后端

```bash
cd backend

# 方式 1: Maven
./mvnw spring-boot:run

# 方式 2: 直接运行 JAR
./mvnw clean package
java -jar target/*.jar
```

**访问地址**:
- API: http://localhost:8080
- H2 控制台：http://localhost:8080/h2-console

### 启动前端

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

**访问地址**: http://localhost:5173

---

## 🐳 Docker 部署

### 构建并启动所有服务

```bash
# 在项目根目录
docker-compose up --build
```

### 停止所有服务

```bash
docker-compose down
```

### 查看日志

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看后端日志
docker-compose logs -f backend

# 查看前端日志
docker-compose logs -f frontend
```

---

## ✅ 验收标准

### 脚本执行

- [x] 脚本执行成功
- [x] 项目结构完整（backend/ + frontend/）
- [x] 后端配置正确（pom.xml + application.yml）
- [x] 前端配置正确（package.json + tsconfig.json）
- [x] Docker 配置正确（docker-compose.yml）

### SDDU 集成

- [x] 24 个 SDDU Agent 已安装
- [x] 7 阶段工作流可用
- [x] 提示词文件包含前后端架构说明

---

## 📚 参考文档

- [SDDU 使用指南](../README.md)
- [SpringBoot 官方文档](https://spring.io/projects/spring-boot)
- [React 官方文档](https://react.dev/)
- [Docker Compose 文档](https://docs.docker.com/compose/)

---

## 🎯 示例项目

### 示例 1: 智能咖啡订购系统

```bash
bash sddu-e2e-fullstack.sh "smart-coffee-fullstack" --auto
```

**核心功能**:
- AI 口味推荐
- 智能预调制
- 社交分享
- 订阅服务

### 示例 2: 家庭健身教练

```bash
bash sddu-e2e-fullstack.sh "home-fitness-coach" --auto
```

**核心功能**:
- AI 动作指导
- 个性化计划
- 进度追踪
- 社交挑战

---

## 🆘 故障排除

### 问题 1: 项目名格式错误

**错误信息**:
```
警告：项目名 'MyProject' 格式无效
项目名必须：小写字母开头，只能包含小写字母、数字、连字符
使用默认项目名：user-login
```

**解决方案**: 使用符合规范的项目名，如 `my-project`

### 问题 2: 模板文件不存在

**错误信息**:
```
ERROR: Template directory not found
```

**解决方案**: 
```bash
# 确保在 sddu 项目根目录执行
cd /home/usb/workspace/wks-sddu/sddu

# 检查模板目录
ls -la templates/
```

### 问题 3: Docker 启动失败

**错误信息**:
```
ERROR: Cannot start service backend
```

**解决方案**:
```bash
# 检查 Docker 是否运行
docker ps

# 清理旧容器
docker-compose down -v

# 重新构建
docker-compose up --build
```

---

**最后更新**: 2026-04-12
**版本**: v1.0.0
