# {{project-name}} - Fullstack Application

## 技术栈

### 后端
- SpringBoot 3.2
- Java 17
- H2 Database
- Spring Data JPA
- Docker

### 前端
- React 18
- TypeScript 5
- Vite 5
- React Router 6
- Axios
- TanStack Query
- Docker (Nginx)

## 快速开始

### 开发环境
```bash
# 启动后端
cd backend
./mvnw spring-boot:run

# 启动前端（新终端）
cd frontend
npm install
npm run dev
```

### Docker 部署
```bash
# 构建并启动所有服务
docker-compose up --build

# 停止所有服务
docker-compose down
```

## 访问地址
- 前端：http://localhost:3000
- 后端 API：http://localhost:8080
- H2 控制台：http://localhost:8080/h2-console
