# OpenCode SDD Plugin

[![Version](https://img.shields.io/badge/version-2.3.0-blue)](https://github.com/THZSummer/sddu/releases)
[![Phase](https://img.shields.io/badge/Phase-2-complete)](https://github.com/THZSummer/sddu)
[![Status](https://img.shields.io/badge/status-stable-green)](https://github.com/THZSummer/sddu)
[![License](https://img.shields.io/badge/license-MIT-green)](https://github.com/THZSummer/sddu/blob/main/LICENSE)

规范驱动开发 (Specification-Driven Development) 插件，为 OpenCode 提供结构化的 7 阶段工作流 + 需求挖掘阶段。

## 📁 项目结构

```
opencode-sdd-plugin/
├── src/                        # 源码目录
│   ├── index.ts                # 插件入口
│   ├── types.ts                # 统一类型导出 (新增)
│   ├── errors.ts               # 统一错误处理 (新增)
│   ├── agents/                 # Agent 注册
│   │   ├── registry.ts         # Agent 注册表 (新增)
│   │   └── sdd-agents.ts       # Agent 注册逻辑
│   ├── commands/               # 命令定义
│   ├── state/                  # 状态机
│   ├── discovery/              # 发现阶段实现
│   ├── utils/                  # 工具函数
│   │   ├── index.ts            # 统一导出 (新增)
│   │   ├── tasks-parser.ts
│   │   ├── subfeature-manager.ts
│   │   ├── readme-generator.ts
│   │   └── dependency-notifier.ts
│   └── templates/              # 模板文件
│       └── agents/             # Agent prompt 模板
│
├── scripts/                    # 工具脚本
│   └── package.cjs             # 打包脚本 (新增)
│
├── dist/                       # 构建产物
│   ├── sdd/                    # 完整插件包 (新增)
│   │   ├── src/
│   │   ├── agents/
│   │   ├── ...
│   │   └── package.json
│   └── sdd.zip                 # 压缩包 (新增)
│
├── .sdd/                       # SDD 工作空间
│   ├── README.md
│   ├── ROADMAP.md
│   ├── docs/
│   │   └── migration-guide.md
│   └── specs-tree-root/        # 规范目录 (新结构)
│       ├── README.md           # 目录导航
│       ├── state.json          # 全局状态
│       ├── specs-tree-sdd-tools-optimization/  # 已完成的 Feature
│       │   ├── spec.md         # v2.3.0
│       │   ├── plan.md
│       │   ├── tasks.md
│       │   ├── review.md
│       │   ├── validation.md
│       │   └── state.json
│       └── ...                 # 其他 Feature
│
├── install.sh                  # 安装脚本 (Linux/macOS)
├── install.ps1                 # 安装脚本 (Windows)
├── package.json
├── tsconfig.json
└── ...
```

**目录说明：**
| 目录 | 用途 | 是否提交 |
|------|------|----------|
| `src/` | 源码 | ✅ 是 |
| `dist/` | 构建产物 | ✅ 是 |
| `.sdd/` | SDD 工作空间容器 | ✅ 是 |
| `.sdd/.specs/` | 规范文件隔离目录 | ✅ 是 |
| `.opencode/` | 本地安装测试 | ❌ 否 |

## 🚀 安装

### 一键安装（推荐）

**Linux/macOS:**
```bash
bash install.sh <目标项目目录>
# 或 (确保脚本可执行)
chmod +x install.sh
./install.sh <目标项目目录>
```

⚠️ **注意**: 必须使用 `bash`，不要用 `sh install.sh`！

**Windows:**
```powershell
powershell -ExecutionPolicy Bypass -File "install.ps1" <目标项目目录>
```

### 手动安装

```bash
# 构建
npm install
npm run build

# 打包（生成 dist/sdd/ 和 dist/sdd.zip）
npm run package

# 安装
bash install.sh <目标项目>
```

### 打包优化说明
- ✅ 自动清理 dist 目录冗余文件
- ✅ 仅保留 `dist/sdd/` 和 `dist/sdd.zip`
- ✅ 支持 ZIP 解压安装

## 🎯 使用方法

### 核心功能
- ✅ 统一类型导出 (`src/types.ts`)
- ✅ 统一错误处理体系 (`src/errors.ts`)
- ✅ 工具函数统一导出 (`src/utils/index.ts`)
- ✅ Agent 动态注册表 (`src/agents/registry.ts`)
- ✅ 打包脚本优化 (`scripts/package.cjs`)
- ✅ Discovery 可选状态联动
- ✅ 安装脚本适配 `dist/sdd/` 结构

### Agent 列表

#### 智能入口
- @sdd - SDD Master Coordinator - 智能路由助手  
- @sdd-help - SDD Help Assistant - 使用指南  

#### 7 阶段标准版 (新增阶段 0 - 需求挖掘)
- @sdd-0-discovery - SDD 需求挖掘专家 (阶段 0/6)  
- @sdd-1-spec - SDD 规范编写专家 (阶段 1/6)  
- @sdd-2-plan - SDD 技术规划专家 (阶段 2/6)  
- @sdd-3-tasks - SDD 任务分解专家 (阶段 3/6)  
- @sdd-4-build - SDD 任务实现专家 (阶段 4/6)  
- @sdd-5-review - SDD 代码审查专家 (阶段 5/6)  
- @sdd-6-validate - SDD 验证专家 (阶段 6/6)  

#### 7 阶段短名版  
- @sdd-discovery - SDD 需求挖掘 (短名)  
- @sdd-spec - SDD 规范编写 (短名)  
- @sdd-plan - SDD 技术规划 (短名)  
- @sdd-tasks - SDD 任务分解 (短名)  
- @sdd-build - SDD 任务实现 (短名)  
- @sdd-review - SDD 代码审查 (短名)  
- @sdd-validate - SDD 验证 (短名)  

#### 特殊功能
- @sdd-roadmap - SDD Roadmap 规划专家 - 多版本路线图规划
- @sdd-docs - SDD 目录导航生成器 - 扫描目录结构生成 README 导航

使用 `@sdd` 作为统一入口，自动根据当前状态路由到正确阶段：

```bash
@sdd 开始 用户登录功能
@sdd 继续
@sdd 状态
```

### 核心工作流 Agent（阶段性执行）

直接调用特定阶段 Agent：
```bash
@sdd-discovery "用户需要登录和注册功能"  # 需求挖掘 (新增阶段 0)
@sdd-spec "基于需求完善技术规范"           # 技术规范 (阶段 1) 
@sdd-plan "制定实现计划"                  # 技术规划 (阶段 2)
@sdd-tasks "拆解为具体任务"              # 任务分解 (阶段 3)
@sdd-build "实现代码"                    # 任务实现 (阶段 4)
@sdd-review "代码审查"                   # 代码审查 (阶段 5)
@sdd-validate "验证功能"                 # 功能验证 (阶段 6)
```

### 规划辅助 Agent（整体规划支持）

提供跨版本、跨功能的整体规划支持：

```bash
@sdd-roadmap "为整个项目创建 roadmap 规划"
@sdd-roadmap "Q2 上线，2 个人，做什么功能好"
@sdd-roadmap "基于现有 spec 规划版本"
```

`sdd-roadmap` Agent 支持:
- **多版本规划**: 创建包含多个迭代版本的详细路线图
- **功能优先级排序**: 使用 RICE 模型 (Reach, Impact, Confidence, Effort) 评估功能优先级
- **依赖关系分析**: 识别功能开发的依赖关系，优化开发顺序
- **时间表规划**: 基于资源和复杂度预测版本发布周期
- **智能 Feature 整理**: 从用户零散输入中提取和推荐相关功能

#### 📊 完整 Agent 关系图

```
┌─────────────────────────────────────────────────────────────┐
│                   SDD 完整规划体系                           │
├─────────────────────────────────────────────────────────────┤
│  横向规划 (战略层)                                           │
│  @sdd-roadmap → .sdd/.specs/ROADMAP.md                     │
│  (多 Feature 多版本规划，可选)                                │
│                           ↓                                  │
│  纵向开发 (战术层) - 单 Feature 7 阶段工作流 (含需求挖掘)            │
│  @sdd-discovery → @sdd-spec → @sdd-plan → @sdd-tasks    │
│  (需求挖掘)     (需求规范)   (技术方案)   (任务分解)      │
│                           ↓                                  │
│           @sdd-build → @sdd-review → @sdd-validate       │
│           (实现)      (审查)      (验证)                  │
└─────────────────────────────────────────────────────────────┘
```

#### 📋 Agent 对比表

| Agent | 层次 | 输入 | 输出 | 必需 |
|-------|------|------|------|------|
| `@sdd-roadmap` | 战略层 | 零散想法/约束 | 多版本 Roadmap | ❌ 可选 |
| `@sdd-discovery` | 认知层 | 用户初步想法 | discovery.md | ⚠️ 推荐 |
| `@sdd-spec` | 战术层 | 用户需求(推荐已挖掘的) | spec.md | ✅ 必需 |
| `@sdd-plan` | 战术层 | spec.md | plan.md | ✅ 必需 |
| `@sdd-tasks` | 战术层 | plan.md | tasks.md | ✅ 必需 |
| `@sdd-build` | 执行层 | tasks.md | 源代码 | ✅ 必需 |
| `@sdd-review` | 执行层 | 代码 | 审查报告 | ✅ 必需 |
| `@sdd-validate` | 执行层 | 审查报告 | 验证结果 | ✅ 必需 |

## ⚡ 快速开始

### 1. 安装插件
```bash
# 克隆项目
git clone https://github.com/THZSummer/sddu.git
cd sddu

# 构建和打包
npm install
npm run build
npm run package

# 安装到你的项目
bash install.sh /path/to/your/project
```

### 2. 开始第一个 Feature
```bash
cd /path/to/your/project
opencode

# 使用智能入口
@sdd 开始 用户登录功能

# 或分阶段执行
@sdd-discovery "用户需要快捷登录"
@sdd-spec "用户登录"
@sdd-plan "用户登录"
@sdd-tasks "用户登录"
@sdd-build "实现 TASK-001"
```

## ✅ 已完成 Feature

### SDD 工具系统优化 (v2.3.0)
- **状态**: validated ✅
- **阶段**: 6/6 (完成)
- **核心成果**:
  - 统一类型导出
  - 统一错误处理
  - Agent 动态注册
  - 打包分发优化

**详细文档**: [.sdd/specs-tree-root/specs-tree-sdd-tools-optimization/](.sdd/specs-tree-root/specs-tree-sdd-tools-optimization/)

## 🔨 开发命令

```bash
# 安装依赖
npm install

# 构建（agent + TypeScript）
npm run build

# 打包（生成 dist/sdd/ 和 dist/sdd.zip）
npm run package

# 打包后自动清理冗余文件，仅保留：
# - dist/sdd/ (完整插件包)
# - dist/sdd.zip (压缩包)
npm run build:agents

# 监听 TypeScript 编译
npm run dev

# 清理构建产物
npm run clean

# 本地测试
npm run test
```

## 📋 版本历史

| 版本 | 日期 | 说明 |
|------|------|------|
| v2.3.0 | 2026-04-05 | ✅ SDD 工具系统优化 - 统一导出层 + Agent 注册表 + 打包优化 |
| v2.2.0 | 2026-04-05 | ✅ 打包结构优化 - dist/sdd/ + dist/sdd.zip |
| v2.1.0 | 2026-04-05 | ✅ 架构重新设计 - Agent 配置集中在插件目录 |
| v2.0.0 | 2026-04-03 | 新增阶段 0：需求挖掘 (Discovery) 功能 - 升级 SDD 工作流至 7 阶段 |
| v1.2.12 | 2026-03-31 | 容器化支持（开发中） |
| v1.1.1 | 2026-03-30 | 16 个 Agent 完成 |

**未来版本规划:**
- **v1.3.0** (2026-06-15): Phase 3 - 图形化状态面板 + Git Hooks + 多 Feature 并发管理
- **v2.0.0** (2026-09-30): Phase 4 - 企业级权限管理 + 插件市场 + 数据分析

📊 **详细 Roadmap**: 查看 [`.sdd/ROADMAP.md`](./.sdd/ROADMAP.md)

详细变更记录请参见 `.sdd/ROADMAP.md`

## 🔗 参考链接

- [SDD 工具系统优化规范](.sdd/specs-tree-root/specs-tree-sdd-tools-optimization/spec.md)
- [技术规划文档](.sdd/specs-tree-root/specs-tree-sdd-tools-optimization/plan.md)
- [版本路线图](.sdd/ROADMAP.md)
- [OpenCode 官方文档](https://opencode.ai/docs)
- [OpenCode Plugin 开发](https://opencode.ai/docs/plugins)
- [OpenCode Agent 系统](https://opencode.ai/docs/agents)
- [OpenCode MCP 集成](https://opencode.ai/docs/mcp-servers)

## 📄 许可证

MIT License