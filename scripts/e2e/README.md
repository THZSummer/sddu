# SDDU E2E 测试脚本

**版本**: 1.3.0  
**更新日期**: 2026-06-13

---

## 核心意图（切勿偏离）

> **E2E 脚本的唯一目的是：验证 SDDU 插件代码在真实用户场景下是否正常工作。**

具体做法：

1. **生成一个全新的、与 SDDU 项目完全隔离的测试项目**（在 `$SDDU_TEST_DIR` 下）
2. **将当前 SDDU 最新代码安装到该测试项目中**
3. **附带一份完整的提示词**，引导 SDDU 的各个 Agent 按照提示词自由调度，走完 discovery → spec → plan → tasks → build → review → validate 全流程
4. **整个过程模拟真实用户的首次使用体验**——从安装插件、创建第一个 Feature、到完成全部 7 个阶段

**⚠️ 红线**：
- 不得在当前 SDDU 项目目录内创建测试数据
- 不得修改当前 SDDU 项目的 `.sddu/`、`.opencode/`、`opencode.json`
- 任何新增的 E2E 脚本必须遵循此隔离原则

---

## 目录结构

```
e2e/
├── README.md                 # 本文件（主文档）
├── basic/                    # 基础 E2E（TypeScript 单项目）
│   ├── sddu-e2e.sh
│   └── README.md
└── fullstack/                # 全栈 E2E（前后端分离）
    ├── sddu-e2e-fullstack.sh
    └── README.md
```

## 快速开始

### 基础 E2E（TypeScript 单项目）
```bash
bash scripts/e2e/basic/sddu-e2e.sh "online-bookstore" --auto --report
```

### 全栈 E2E（前后端分离）
```bash
bash scripts/e2e/fullstack/sddu-e2e-fullstack.sh "smart-office-system" --auto --report
```

## 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `SDDU_TEST_DIR` | E2E 测试项目根目录 | `~/sddu-e2e-tests` |
| `SDDU_AUTO_MODE` | 自动模式（跳过确认） | `false` |
| `SDDU_GENERATE_REPORT` | 生成验收报告 | `false` |

### 设置示例
```bash
export SDDU_TEST_DIR="$HOME/sddu-e2e-tests"
bash scripts/e2e/basic/sddu-e2e.sh "my-project" --auto --report
```

## 业务测试项目示例

### 基础 E2E 示例
```bash
# 在线书店系统（TypeScript 单项目）
bash scripts/e2e/basic/sddu-e2e.sh "online-bookstore" --auto --report
```
- 用户管理、书籍 CRUD、订单处理
- 生成 TypeScript + Node.js 项目
- 验收报告：`online-bookstore/sddu-e2e-report.md`

### 全栈 E2E 示例
```bash
# 智能办公系统（SpringBoot + React）
bash scripts/e2e/fullstack/sddu-e2e-fullstack.sh "smart-office-system" --auto --report
```
- 员工管理、考勤打卡、审批流程
- 生成 SpringBoot 后端 + React 前端
- 验收报告：`smart-office-system/sddu-e2e-report.md`

## 使用方式详解

### 参数说明
| 参数 | 说明 |
|------|------|
| `"project-name"` | 项目名称（必需） |
| `--auto` | 自动模式，跳过确认提示 |
| `--report` | 生成验收报告 |

### 完整命令示例
```bash
# 交互式（手动确认每个步骤）
bash scripts/e2e/basic/sddu-e2e.sh "online-bookstore"

# 自动模式（无确认）
bash scripts/e2e/basic/sddu-e2e.sh "online-bookstore" --auto

# 自动模式 + 生成报告
bash scripts/e2e/basic/sddu-e2e.sh "online-bookstore" --auto --report
```

## 设计原则

1. **每个 E2E 脚本有自己的资源目录**
   - 基础 E2E: 无需模板（纯 TypeScript 代码由 Agent 生成）
   - 全栈 E2E: 规范驱动（前后端代码由 Agent 根据提示词生成）

2. **规范驱动开发**
   - 不依赖模板复制
   - 在提示词中说明架构要求
   - Phase 0-6 由 Agent 自主生成代码

3. **脚本自包含**
   - 每个 E2E 脚本 + 自己的资源
   - 不依赖项目根目录
   - 可独立运行

## 清理说明

### 清理单个项目
```bash
rm -rf $SDDU_TEST_DIR/online-bookstore
```

### 清理所有 E2E 测试项目
```bash
rm -rf $SDDU_TEST_DIR/*
```

### 清理并重置环境
```bash
# 删除测试目录
rm -rf $SDDU_TEST_DIR

# 重新创建目录
mkdir -p $SDDU_TEST_DIR
```

## 验收报告

使用 `--report` 参数后，会在项目根目录生成 `sddu-e2e-report.md`，包含：

- ✅ 所有 Phase 完成情况
- ✅ 生成的文件清单
- ✅ 验收标准检查结果
- ✅ 存在的问题和建议

## 相关文档

- [基础 E2E 详细说明](./basic/README.md)
- [全栈 E2E 详细说明](./fullstack/README.md)
