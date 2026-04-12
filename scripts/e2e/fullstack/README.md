# 全栈 E2E 测试脚本

**版本**: 1.2.0  
**更新日期**: 2026-04-12  
**类型**: SpringBoot + React 前后端分离

---

## 技术栈

### 后端
| 组件 | 版本 | 说明 |
|------|------|------|
| SpringBoot | 3.x | Java Web 框架 |
| Java | 17+ | 后端开发语言 |
| H2 Database | 2.x | 内存数据库（测试用） |
| Spring Data JPA | 3.x | 数据访问层 |
| Docker | 24+ | 容器化部署 |

### 前端
| 组件 | 版本 | 说明 |
|------|------|------|
| React | 18.x | UI 框架 |
| TypeScript | 5.x | 开发语言 |
| Vite | 5.x | 构建工具 |
| Ant Design / MUI | 最新 | UI 组件库 |
| Docker | 24+ | 容器化部署 |

### 部署
- Docker Compose 编排后端 + 前端容器
- 一键启动完整系统

---

## 使用方式

### 基本命令
```bash
bash sddu-e2e-fullstack.sh "project-name" [选项]
```

### 常用示例
```bash
# 交互式运行
bash sddu-e2e-fullstack.sh "smart-office-system"

# 自动模式（跳过确认）
bash sddu-e2e-fullstack.sh "smart-office-system" --auto

# 自动模式 + 生成验收报告
bash sddu-e2e-fullstack.sh "smart-office-system" --auto --report
```

### 参数说明
| 参数 | 说明 |
|------|------|
| `"project-name"` | 项目名称（必需，用作目录名） |
| `--auto` | 自动模式，跳过所有确认提示 |
| `--report` | 生成验收报告 (`sddu-e2e-report.md`) |

---

## 环境变量

| 变量名 | 说明 | 默认值 | 示例 |
|--------|------|--------|------|
| `SDDU_TEST_DIR` | E2E 测试项目根目录 | `~/sddu-e2e-tests` | `/home/user/sddu-e2e-tests` |
| `SDDU_AUTO_MODE` | 自动模式开关 | `false` | `true` |
| `SDDU_GENERATE_REPORT` | 生成验收报告 | `false` | `true` |
| `DOCKER_HOST` | Docker 守护进程地址 | `unix:///var/run/docker.sock` | `tcp://localhost:2375` |

### 设置环境变量
```bash
# 临时设置（当前会话）
export SDDU_TEST_DIR="$HOME/my-e2e-tests"
bash sddu-e2e-fullstack.sh "smart-office-system" --auto --report

# 永久设置（~/.bashrc 或 ~/.zshrc）
echo 'export SDDU_TEST_DIR="$HOME/sddu-e2e-tests"' >> ~/.bashrc
source ~/.bashrc
```

---

## 示例业务项目：smart-office-system

### 项目描述
一个智能办公系统，支持员工管理、考勤打卡、审批流程等功能。

### 运行命令
```bash
cd /path/to/sddu/scripts/e2e/fullstack
bash sddu-e2e-fullstack.sh "smart-office-system" --auto --report
```

### 功能范围
- **员工管理**: 入职、离职、档案管理
- **考勤系统**: 打卡、请假、加班申请
- **审批流程**: 多级审批、流程配置
- **数据报表**: 考勤统计、审批分析
- **权限控制**: 角色管理、菜单权限

---

## 项目结构说明

### 整体结构
```
smart-office-system/
├── backend/                    # SpringBoot 后端
│   ├── src/main/java/          # Java 源代码
│   ├── src/main/resources/     # 配置文件
│   ├── pom.xml                 # Maven 配置
│   └── Dockerfile              # 后端容器化
├── frontend/                   # React 前端
│   ├── src/                    # TypeScript 源代码
│   ├── public/                 # 静态资源
│   ├── package.json            # NPM 配置
│   ├── vite.config.ts          # Vite 配置
│   └── Dockerfile              # 前端容器化
├── docker-compose.yml          # Docker 编排
└── .sddu/                      # SDDU 工作流目录
```

### SDDU 目录结构
```
.sddu/
├── specs-tree-root/            # 规范树
│   └── specs-tree-smart-office-system/
│       ├── spec.md
│       └── spec.json
├── plans-tree-root/            # 技术规划
│   └── plans-tree-smart-office-system/
│       ├── plan.md
│       └── adr/
├── tasks-tree-root/            # 任务分解
│   └── tasks-tree-smart-office-system/
│       └── tasks.md
├── build-output/               # 构建输出
├── review-reports/             # 代码审查报告
└── validation-reports/         # 验证报告
```

---

## 生成的文件清单

执行完成后，在 `$SDDU_TEST_DIR/smart-office-system/` 生成：

```
smart-office-system/
├── .sddu/                          # SDDU 工作流目录
│   ├── specs-tree-root/            # 规范树
│   ├── plans-tree-root/            # 技术规划
│   ├── tasks-tree-root/            # 任务分解
│   ├── build-output/               # 构建输出
│   ├── review-reports/             # 代码审查报告
│   └── validation-reports/         # 验证报告
├── prompts/                        # 生成的提示词
│   ├── phase-0-spec.prompt.md
│   ├── phase-1-plan.prompt.md
│   ├── phase-2-tasks.prompt.md
│   ├── phase-3-build.prompt.md
│   └── phase-4-review.prompt.md
├── backend/                        # SpringBoot 后端（Agent 生成）
│   ├── src/main/java/com/example/
│   │   ├── controller/
│   │   ├── service/
│   │   ├── repository/
│   │   ├── model/
│   │   └── dto/
│   ├── src/main/resources/
│   │   ├── application.yml
│   │   └── application-test.yml
│   ├── pom.xml
│   └── Dockerfile
├── frontend/                       # React 前端（Agent 生成）
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── types/
│   │   └── App.tsx
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── Dockerfile
├── docker-compose.yml              # Docker 编排配置
└── sddu-e2e-report.md              # 验收报告（--report 参数）
```

---

## 验收标准

### Phase 完成情况
- [ ] **Phase 0 (Spec)**: 规范文档生成（`spec.md`, `spec.json`）
- [ ] **Phase 1 (Plan)**: 技术规划完成（`plan.md`, `adr/`）
- [ ] **Phase 2 (Tasks)**: 任务分解完成（`tasks.md`）
- [ ] **Phase 3 (Build)**: 代码生成完成（`backend/`, `frontend/`）
- [ ] **Phase 4 (Review)**: 代码审查完成（`review-reports/`）
- [ ] **Phase 5 (Validate)**: 验证通过（`validation-reports/`）

### 文件完整性
- [ ] `.sddu/` 目录结构完整
- [ ] 所有 Phase 提示词文件存在
- [ ] SpringBoot 后端代码已生成
- [ ] React 前端代码已生成
- [ ] Docker 配置文件已生成
- [ ] 后端可编译（`mvn compile` 通过）
- [ ] 前端可构建（`npm run build` 通过）

### 系统启动验证
```bash
cd $SDDU_TEST_DIR/smart-office-system
docker-compose up -d
# 等待服务启动
curl http://localhost:8080/api/health  # 后端健康检查
# 前端访问 http://localhost:3000
```

### 验收报告检查
使用 `--report` 参数后，检查 `sddu-e2e-report.md`：
- [ ] 所有检查项状态为 ✅
- [ ] 无严重问题（ERROR）
- [ ] 警告项（WARNING）已审查
- [ ] Docker 容器正常运行

---

## 工作流程

```
┌─────────────────────────────────────────────────────────┐
│  1. 运行 sddu-e2e-fullstack.sh                          │
│     → 创建 $SDDU_TEST_DIR/project-name/                 │
│     → 生成 prompts/ 目录下的提示词文件                   │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│  2. 用户执行 @sddu-spec 开始规范编写                     │
│     → 创建 spec.md, spec.json                           │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│  3. 用户执行 @sddu-plan 开始技术规划                     │
│     → 创建 plan.md, adr/                                │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│  4. 用户执行 @sddu-tasks 开始任务分解                    │
│     → 创建 tasks.md                                     │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│  5. 用户执行 @sddu-build 开始代码生成                    │
│     → 生成 backend/, frontend/, docker-compose.yml      │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│  6. 用户执行 @sddu-review 开始代码审查                   │
│     → 生成 review-reports/                              │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│  7. 用户执行 @sddu-validate 开始验证                     │
│     → 生成 validation-reports/                          │
│     → docker-compose 启动验证                            │
│     → 完成 E2E 测试                                      │
└─────────────────────────────────────────────────────────┘
```

---

## 与基础 E2E 的区别

| 特性 | 基础 E2E | 全栈 E2E |
|------|----------|----------|
| 项目类型 | TypeScript 单项目 | SpringBoot + React 前后端分离 |
| 模板依赖 | 无（Agent 生成） | 无（Agent 生成） |
| Docker 需求 | 不需要 | 需要（后端 + 前端容器） |
| 复杂度 | 低 | 高 |
| 适用场景 | 快速验证、简单项目 | 企业级应用、完整系统 |

---

## 清理说明

```bash
# 停止并清理 Docker 容器
cd $SDDU_TEST_DIR/smart-office-system
docker-compose down -v

# 清理单个项目
cd -
rm -rf $SDDU_TEST_DIR/smart-office-system

# 清理所有全栈 E2E 项目
rm -rf $SDDU_TEST_DIR/*

# 重置环境
rm -rf $SDDU_TEST_DIR && mkdir -p $SDDU_TEST_DIR
```

---

## 相关文档

- [主 E2E 文档](../README.md)
- [基础 E2E 文档](../basic/README.md)
