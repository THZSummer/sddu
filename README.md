# OpenCode SDD Plugin

规范驱动开发 (Specification-Driven Development) 插件，为 OpenCode 提供结构化的 7 阶段工作流，新增阶段 0（需求挖掘）。

## 📁 项目结构

```
opencode-sdd-plugin/
├── src/                        # 源码目录（开发者维护）
│   ├── index.ts                # 插件入口
│   ├── agents/                 # Agent 注册代码
│   ├── commands/               # 命令定义
│   ├── state/                  # 状态机
│   ├── discovery/              # 发现阶段实现
│   └── templates/              # 模板文件（源码一部分）
│       ├── agents/             # Agent 模板
│       └── config/             # 配置模板
│
├── dist/                       # 构建产物（完整可部署）
│   ├── opencode.json           # 配置模板
│   ├── index.js                # 编译后入口
│   ├── agents/                 # 编译后 Agent 代码
│   ├── commands/               # 编译后命令
│   ├── state/                  # 编译后状态机
│   └── templates/agents/       # 生成的 agent 定义（17+ 个.md）
│
├── .sdd/                       # SDD 工作空间容器（必选）
│   ├── README.md               # SDD 容器化工作空间说明
│   ├── ROADMAP.md              # 版本路线图
│   ├── config.json             # SDD 配置（可选）
│   ├── docs/                   # 文档目录
│   │   └── migration-guide.md  # 迁移指南
│   └── .specs/                 # 隔离规范文件目录
│       ├── spec.md             # 主 Feature 规范
│       ├── plan.md             # 整体技术架构
│       ├── tasks.md            # 并行任务分组
│       ├── state.json          # Feature 整体状态
│       ├── [sub-feature-id]/   # 子 Feature 目录（同级结构）
│       │   ├── spec.md
│       │   ├── plan.md
│       │   ├── tasks.md
│       │   └── state.json
│       └── ...
│
├── .opencode/                  # 安装文件（本地测试用，不应提交）
│   └── plugins/sdd/            # 插件安装目录
│
├── build-agents.cjs            # Agent 生成脚本
├── install.ps1                 # 安装脚本 (Windows)
├── install.sh                  # 安装脚本 (Linux/macOS)
├── package.json
├── tsconfig.json
└── .gitignore
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
# 1. 构建
npm install
npm run build

# 2. 复制 dist/ 到目标项目
cp -r dist/* <target-project>/.opencode/plugins/sdd/

# 3. 复制 agents
cp dist/templates/agents/* <target-project>/.opencode/agents/
```

## 🎯 使用方法

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

## 📊 7 阶段工作流详解

| 阶段 | Agent | 输入 | 输出 | 默认模型 | 说明 |
|------|-------|------|------|----------|------|
| **0. 挖掘** | `@sdd-discovery` | 用户想法 | `discovery.md` | bailian/qwen3.5-plus | 深度挖掘用户真实需求 |
| **1. 规范** | `@sdd-1-spec` | 用户需求 | `SDD_SPEC.md` | bailian/qwen3.5-plus | 将需求转为技术规格 |
| **2. 规划** | `@sdd-2-plan` | 规范文档 | `SDD_PLAN.md` | bailian/qwen3.5-plus | 制定技术实现路径 |
| **3. 任务** | `@sdd-3-tasks` | 计划文档 | `SDD_TASKS.md` | bailian/qwen3.5-plus | 拆解为可执行任务 |
| **4. 实现** | `@sdd-4-build` | 任务清单 | 源代码 | bailian/qwen3-coder-plus | 编写代码实现功能 |
| **5. 审查** | `@sdd-5-review` | 实现代码 | 审查报告 | bailian/qwen3-coder-plus | 代码质量检查和改进建议 |
| **6. 验证** | `@sdd-6-validate` | 审查报告 | 验证结果 | bailian/qwen3-coder-plus | 确保功能符合规范 |

**工作流说明：**
1. **需求挖掘**: 从初步想法、痛点出发，深度挖掘用户真实需求和业务价值
2. **规范阶段**: 将明确的需求转化为结构化技术规范
3. **规划阶段**: 制定技术方案和实现路径
4. **任务阶段**: 拆解为可执行的具体任务
5. **实现阶段**: 编写代码实现功能
6. **审查阶段**: 代码质量检查和改进建议
7. **验证阶段**: 确保功能符合规范

**状态流转**：drafting → discovered → specified → planned → tasked → implementing → reviewed → validated → completed

状态机验证了从 drafting 状态到后面各阶段的可选项，支持推荐路径(drafting → discovered → specified)或可跳过路径(drafting → specified)，但不允许直接跳过多阶段。

### 子 Feature 支持
从 v1.2.11+ 版本开始支持子 Feature 功能，允许将大型任务拆分为更小的可管理模块，提升团队协作效率。

目录结构示例：
```
.sdd/                           # SDD 工作空间容器（必选）  
├── README.md                   # SDD 容器化工作空间说明（必选）
├── ROADMAP.md                  # 版本路线图（顶层规划）（必选）
├── config.json                 # SDD 配置（可选）
├── docs/                       # 文档目录
│   └── migration-guide.md      # 迁移指南
└── .specs/                     # SDD 规范文件隔离目录（必选）
    ├── README.md               # 目录说明
    ├── discovery.md             # 需求挖掘文档（阶段 0）（可选推荐）
    ├── spec.md                 # 需求规格（可选）
    ├── plan.md                 # 技术规划（可选）
    ├── tasks.md                # 任务分解（可选）
    ├── state.json              # 状态文件（可选）
    ├── [sub-feature-id]/       # 子 Feature 目录（同级扁平结构）（可选）
    │   ├── README.md           # 目录说明（必选）
    │   ├── discovery.md        # 需求挖掘文档（必选推荐）
    │   ├── spec.md             # 需求规格（必选）
    │   ├── plan.md             # 技术规划（必选）
    │   ├── tasks.md            # 任务分解（必选）
    │   └── state.json          # 状态文件（必选）
    └── ...                     # 其他子 Feature 目录
```

容器化结构的优势包括：
- **隔离性**: 规范文件存储在 `.sdd/.specs/` 完全隔离目录中
- **兼容性**: 支持从旧的 `.specs/` 结构迁移
- **扩展性**: 更易于管理和扩展复杂的多子 Feature 项目
- **清晰性**: 明确区分插件代码和项目规格

如需从旧结构迁移，请参考 [迁移指南](./.sdd/docs/migration-guide.md)。

## 💡 使用场景

### 场景 1: 启发式需求（推荐使用 discovery）
```bash
# 1. 需求挖掘 - 新增阶段 0
@sdd-discovery "用户觉得登录太麻烦，想要更快捷的方式"

# 2. 后续标准流程
@sdd-spec "基于发现的需求，规范双因子认证功能"  
@sdd-plan "双因子认证技术方案"
@sdd-tasks "双因子认证任务分解"
@sdd-build "实现 TASK-001"
```

### 场景 2: 新项目启动（推荐 Roadmap + Discovery）
```bash
# 1. 制定整体规划
@sdd-roadmap "新项目，Q2 上线，2 个人，做什么好"
# 输出：.sdd/.specs/ROADMAP.md

# 2. 从 Roadmap 选择优先 Feature，先需求挖掘
@sdd-discovery "用户登录功能"
@sdd-spec "用户登录"
@sdd-plan "用户登录"
@sdd-tasks "用户登录"
@sdd-4-build "实现 TASK-001"
```

### 场景 3: 已有明确需求（跳过 Discovery）
```bash
@sdd-spec "用户登录"        # 直接开始规范（推荐先做discovery）
@sdd-plan "用户登录"
@sdd-tasks "用户登录"
@sdd-4-build "实现 TASK-001"
```

### 场景 4: 多版本规划（基于现有项目）
```bash
@sdd-roadmap "基于现有 spec 规划版本"
# 扫描 .sdd/.specs/ 已有 Feature，输出版本分组建议
```

### 场景 5: 使用智能入口
```bash
@sdd 开始 用户登录      # 自动路由到 spec 阶段（可推荐先discovery）
@sdd 继续              # 继续当前工作
@sdd 状态              # 查看进度
@sdd 帮助              # 查看完整命令
```

## ⚙️ 配置文件说明

插件行为由 `dist/opencode.json` 配置：

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-sdd-plugin"],
  "agent": {
    "sdd": {
      "description": "SDD Master Coordinator - 智能路由助手",
      "model": "bailian/qwen3.5-plus",
      "prompt": "{file:.opencode/agents/sdd.md}"
    },
    "sdd-help": {
      "description": "SDD Help Assistant - 使用指南",
      "model": "bailian/qwen3.5-plus",
      "prompt": "{file:.opencode/agents/sdd-help.md}"
    },
    "sdd-0-discovery": {
      "description": "SDD 需求挖掘专家 (阶段 0/6)",
      "model": "bailian/qwen3.5-plus",
      "prompt": "{file:.opencode/agents/sdd-discovery.md}"
    },
    "sdd-1-spec": {
      "description": "SDD 规范编写专家 (阶段 1/6)",
      "model": "bailian/qwen3.5-plus",
      "prompt": "{file:.opencode/agents/sdd-1-spec.md}"
    },
    "sdd-2-plan": {
      "description": "SDD 技术规划专家 (阶段 2/6)",
      "model": "bailian/qwen3.5-plus",
      "prompt": "{file:.opencode/agents/sdd-2-plan.md}"
    },
    "sdd-3-tasks": {
      "description": "SDD 任务分解专家 (阶段 3/6)",
      "model": "bailian/qwen3.5-plus",
      "prompt": "{file:.opencode/agents/sdd-3-tasks.md}"
    },
    "sdd-4-build": {
      "description": "SDD 任务实现专家 (阶段 4/6)",
      "model": "bailian/qwen3-coder-plus",
      "prompt": "{file:.opencode/agents/sdd-4-build.md}"
    },
    "sdd-5-review": {
      "description": "SDD 代码审查专家 (阶段 5/6)",
      "model": "bailian/qwen3-coder-plus",
      "prompt": "{file:.opencode/agents/sdd-5-review.md}"
    },
    "sdd-6-validate": {
      "description": "SDD 验证专家 (阶段 6/6)",
      "model": "bailian/qwen3-coder-plus",
      "prompt": "{file:.opencode/agents/sdd-6-validate.md}"
    },
    "sdd-discovery": {
      "description": "SDD 需求挖掘 (短名)",
      "model": "bailian/qwen3.5-plus",
      "prompt": "{file:.opencode/agents/sdd-discovery.md}"
    },
    "sdd-spec": {
      "description": "SDD 规范编写 (短名)",
      "model": "bailian/qwen3.5-plus",
      "prompt": "{file:.opencode/agents/sdd-spec.md}"
    },
    "sdd-plan": {
      "description": "SDD 技术规划 (短名)",
      "model": "bailian/qwen3.5-plus",
      "prompt": "{file:.opencode/agents/sdd-plan.md}"
    },
    "sdd-tasks": {
      "description": "SDD 任务分解 (短名)",
      "model": "bailian/qwen3.5-plus",
      "prompt": "{file:.opencode/agents/sdd-tasks.md}"
    },
    "sdd-build": {
      "description": "SDD 任务实现 (短名)",
      "model": "bailian/qwen3-coder-plus",
      "prompt": "{file:.opencode/agents/sdd-build.md}"
    },
    "sdd-review": {
      "description": "SDD 代码审查 (短名)",
      "model": "bailian/qwen3-coder-plus",
      "prompt": "{file:.opencode/agents/sdd-review.md}"
    },
    "sdd-validate": {
      "description": "SDD 验证 (短名)",
      "model": "bailian/qwen3-coder-plus",
      "prompt": "{file:.opencode/agents/sdd-validate.md}"
    },
    "sdd-docs": {
      "description": "SDD 目录导航生成器 - 扫描目录结构生成 README 导航",
      "model": "bailian/qwen3.5-plus",
      "prompt": "{file:.opencode/agents/sdd-docs.md}"
    },
    "sdd-roadmap": {
      "description": "SDD Roadmap 规划专家 - 多版本路线图规划",
      "model": "bailian/qwen3.5-plus",
      "prompt": "{file:.opencode/agents/sdd-roadmap.md}"
    }
  },
  "permission": {
    "*": "allow",
    "edit": "allow",
    "bash": "allow"
  }
}
```

**配置项说明：**

| 配置项 | 说明 | 可选值 |
|--------|------|--------|
| `model` | 指定 Agent 使用的模型 | `qwen3.5-plus`, `qwen3-coder-plus` 等 |

**模型选择建议：**
- **qwen3.5-plus**: 适合需求挖掘、规范、规划、任务等思考型任务
- **qwen3-coder-plus**: 适合编码、审查、验证等技术型任务

## 🔨 开发命令

```bash
# 安装依赖
npm install

# 构建（agent + TypeScript）
npm run build

# 仅构建 agent
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
| v1.2.12 | 2026-03-31 | 容器化支持（开发中） |
| v1.1.1 | 2026-03-30 | 16 个 Agent 完成 |
| v1.2.0 | 2026-04-30 | Phase 2 开发中 - Skills + TUI + MCP + Structured Output |
| v1.2.11 | 2026-05-20 | 添加 v1.2.8 子 Feature 支持 |
| v1.2.0 | 2026-04-30 | Phase 2 能力增强 - Skills/TUI/MCP/Structured Output |
| v2.0.0 | 2026-04-03 | 新增阶段 0：需求挖掘 (Discovery) 功能 - 升级 SDD 工作流至 7 阶段 |

**未来版本规划:**
- **v1.3.0** (2026-06-15): Phase 3 - 图形化状态面板 + Git Hooks + 多 Feature 并发管理
- **v2.0.0** (2026-09-30): Phase 4 - 企业级权限管理 + 插件市场 + 数据分析

📊 **详细 Roadmap**: 查看 [`.sdd/.specs/ROADMAP.md`](./.sdd/.specs/ROADMAP.md)

详细变更记录请参见 `.sdd/.specs/ROADMAP.md`

## 🔗 参考链接

- [OpenCode 官方文档](https://opencode.ai/docs)
- [OpenCode Plugin 开发](https://opencode.ai/docs/plugins)
- [OpenCode Agent 系统](https://opencode.ai/docs/agents)
- [OpenCode MCP 集成](https://opencode.ai/docs/mcp-servers)

## 📄 许可证

MIT License