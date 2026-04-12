# 基础 E2E 测试脚本

**版本**: 1.2.0  
**更新日期**: 2026-04-12  
**类型**: TypeScript 单项目

---

## 技术栈

| 组件 | 版本 | 说明 |
|------|------|------|
| TypeScript | 5.x | 主要开发语言 |
| Node.js | 18+ | 运行时环境 |
| Jest | 29.x | 单元测试框架 |
| Express | 4.x | Web 框架（可选） |
| Docker | - | 无需 Docker（纯代码生成测试） |

### 架构特点
- 单项目结构（无前后端分离）
- 纯 TypeScript 代码由 Agent 生成
- 无需模板，规范驱动开发

---

## 使用方式

### 基本命令
```bash
bash sddu-e2e.sh "project-name" [选项]
```

### 常用示例
```bash
# 交互式运行
bash sddu-e2e.sh "online-bookstore"

# 自动模式（跳过确认）
bash sddu-e2e.sh "online-bookstore" --auto

# 自动模式 + 生成验收报告
bash sddu-e2e.sh "online-bookstore" --auto --report
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

### 设置环境变量
```bash
# 临时设置（当前会话）
export SDDU_TEST_DIR="$HOME/my-e2e-tests"
bash sddu-e2e.sh "online-bookstore" --auto --report

# 永久设置（~/.bashrc 或 ~/.zshrc）
echo 'export SDDU_TEST_DIR="$HOME/sddu-e2e-tests"' >> ~/.bashrc
source ~/.bashrc
```

---

## 示例业务项目：online-bookstore

### 项目描述
一个在线书店系统，支持用户管理、书籍 CRUD、订单处理等功能。

### 运行命令
```bash
cd /path/to/sddu/scripts/e2e/basic
bash sddu-e2e.sh "online-bookstore" --auto --report
```

### 功能范围
- **用户管理**: 注册、登录、权限控制
- **书籍管理**: 增删改查、分类、搜索
- **订单系统**: 下单、支付、状态跟踪
- **数据持久化**: TypeScript + JSON/SQLite

---

## 生成的文件清单

执行完成后，在 `$SDDU_TEST_DIR/online-bookstore/` 生成：

```
online-bookstore/
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
├── src/                            # TypeScript 源代码（Agent 生成）
│   ├── index.ts
│   ├── services/
│   ├── models/
│   └── controllers/
├── tests/                          # 测试文件（Agent 生成）
│   ├── unit/
│   └── integration/
├── package.json                    # 项目配置
├── tsconfig.json                   # TypeScript 配置
└── sddu-e2e-report.md              # 验收报告（--report 参数）
```

---

## 验收标准

### Phase 完成情况
- [ ] **Phase 0 (Spec)**: 规范文档生成（`spec.md`, `spec.json`）
- [ ] **Phase 1 (Plan)**: 技术规划完成（`plan.md`, `adr/`）
- [ ] **Phase 2 (Tasks)**: 任务分解完成（`tasks.md`）
- [ ] **Phase 3 (Build)**: 代码生成完成（`src/`, `tests/`）
- [ ] **Phase 4 (Review)**: 代码审查完成（`review-reports/`）
- [ ] **Phase 5 (Validate)**: 验证通过（`validation-reports/`）

### 文件完整性
- [ ] `.sddu/` 目录结构完整
- [ ] 所有 Phase 提示词文件存在
- [ ] TypeScript 源代码已生成
- [ ] 测试文件已生成
- [ ] 项目可编译（`tsc --noEmit` 通过）

### 验收报告检查
使用 `--report` 参数后，检查 `sddu-e2e-report.md`：
- [ ] 所有检查项状态为 ✅
- [ ] 无严重问题（ERROR）
- [ ] 警告项（WARNING）已审查

---

## 工作流程

```
┌─────────────────────────────────────────────────────────┐
│  1. 运行 sddu-e2e.sh                                    │
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
│     → 生成 src/, tests/, package.json 等                │
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
│     → 完成 E2E 测试                                      │
└─────────────────────────────────────────────────────────┘
```

---

## 与全栈 E2E 的区别

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
# 清理单个项目
rm -rf $SDDU_TEST_DIR/online-bookstore

# 清理所有基础 E2E 项目
rm -rf $SDDU_TEST_DIR/*

# 重置环境
rm -rf $SDDU_TEST_DIR && mkdir -p $SDDU_TEST_DIR
```

---

## 相关文档

- [主 E2E 文档](../README.md)
- [全栈 E2E 文档](../fullstack/README.md)
