# Feature Specification: SDD Plugin 基线

| 元数据 | 值 |
|--------|-----|
| **Feature ID** | sdd-plugin-baseline |
| **名称** | OpenCode SDD 插件 - Phase 1 基线 |
| **版本** | 1.1.0 |
| **创建日期** | 2026-03-28 |
| **状态** | completed |
| **优先级** | P0 |
| **干系人** | 开发团队 |

---

## 1. 上下文

### 1.1 项目背景
本项目是一个 OpenCode 插件，实现 Specification-Driven Development (SDD) 工作流，帮助开发团队通过规范的 6 阶段流程进行软件开发。

### 1.2 解决的问题
- 缺乏标准化的开发流程
- 规范与实现脱节（漂移问题）
- 缺少阶段跳转控制机制
- 难以追踪 Feature 进度

### 1.3 目标用户
- 使用 OpenCode 的开发团队
- 需要规范化开发流程的项目
- 关注代码质量和文档一致性的团队

---

## 2. Goals & Non-Goals

### 2.1 Goals ✅ (已实现)
- ✅ 实现完整的 6 阶段 SDD 工作流（spec → plan → tasks → build → review → validate）
- ✅ 提供状态机防止阶段跳过
- ✅ 创建 14 个 Agent 覆盖所有工作流阶段
- ✅ 提供智能入口 Agent 自动路由
- ✅ 实现命令系统支持 CLI 操作
- ✅ 提供安装脚本支持多平台部署

### 2.2 Non-Goals ❌ (不在当前版本)
- 多 Feature 并发管理
- 图形化状态面板
- Git hooks 集成
- 一键回滚功能

---

## 3. 用户故事

| ID | 故事 | 价值 | 实现状态 |
|----|------|------|----------|
| US-001 | 作为开发者，我想要通过 @sdd 开始新 feature，以便自动进入规范编写阶段 | 快速启动开发流程 | ✅ 已实现 |
| US-002 | 作为开发者，我想要状态机防止跳过阶段，以便保证开发质量 | 避免遗漏关键步骤 | ✅ 已实现 |
| US-003 | 作为开发者，我想要查看当前进度，以便了解项目状态 | 进度可视化 | ✅ 已实现 |
| US-004 | 作为团队，我想要统一的 Agent 配置，以便标准化开发流程 | 团队协作一致性 | ✅ 已实现 |

---

## 4. 功能需求 (FR) - 已实现

### 4.1 核心工作流

| ID | 需求 | 验收标准 | 状态 |
|----|------|----------|------|
| FR-001 | 支持 6 阶段工作流 | 每个阶段有对应的 Agent | ✅ |
| FR-002 | 状态机防跳过 | 无法从 spec 直接跳转到 build | ✅ |
| FR-003 | 状态持久化 | 状态保存在 `.opencode/sdd/state.json` | ✅ |
| FR-004 | 智能路由 | @sdd 自动选择正确的阶段 Agent | ✅ |

### 4.2 Agent 系统

| ID | 需求 | 验收标准 | 状态 |
|----|------|----------|------|
| FR-010 | 提供 14 个 Agent | 6 阶段×2 命名 + sdd + sdd-help | ✅ |
| FR-011 | Agent 权限配置 | 每个 Agent 有独立的 edit/bash/webfetch 权限 | ✅ |
| FR-012 | 模型配置分离 | 模型配置在 opencode.json 中 | ✅ |

### 4.3 命令系统

| ID | 需求 | 验收标准 | 状态 |
|----|------|----------|------|
| FR-020 | 支持 /sdd 命令 | 包含 init/specify/plan/tasks/implement/validate/status | ✅ |
| FR-021 | 命令前置验证 | plan 需要 spec.md，tasks 需要 plan.md | ✅ |
| FR-022 | 友好的错误提示 | 缺失前置条件时显示明确的修复指引 | ✅ |

### 4.4 安装部署

| ID | 需求 | 验收标准 | 状态 |
|----|------|----------|------|
| FR-030 | Linux/macOS 安装脚本 | install.sh 一键安装 | ✅ |
| FR-031 | Windows 安装脚本 | install.ps1 一键安装 | ✅ |
| FR-032 | 手动安装支持 | 提供详细的手动安装文档 | ✅ |

---

## 5. 非功能需求 (NFR)

| ID | 需求 | 指标 | 状态 |
|----|------|------|------|
| NFR-001 | 性能 | Agent 响应时间 < 5 秒 | ✅ |
| NFR-002 | 可靠性 | 状态机验证准确率 100% | ✅ |
| NFR-003 | 兼容性 | 支持 Linux/macOS/Windows | ✅ |

---

## 6. 技术设计

### 6.1 架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                      OpenCode Plugin                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Agents    │  │  Commands   │  │     State Machine   │  │
│  │  (14 个)    │  │  (/sdd)     │  │  (防跳过验证)       │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                    TypeScript Runtime                        │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 目录结构

```
opencode-sdd-plugin/
├── src/                      # 源码
│   ├── index.ts              # 插件入口
│   ├── agents/               # Agent 注册
│   ├── commands/             # 命令定义
│   └── state/                # 状态机
├── dist/                     # 构建产物
├── .opencode/agents/         # Agent 定义 (14 个.md)
├── install.sh / install.ps1  # 安装脚本
└── docs/                     # 文档
```

### 6.3 状态流转

```
drafting → specified → planned → tasked → implementing → reviewed → validated → completed
   ↓          ↓           ↓         ↓            ↓           ↓           ↓
  spec      plan       tasks     build       review    validate    done
```

---

## 7. 边界情况 (EC)

| ID | 场景 | 处理方式 |
|----|------|----------|
| EC-001 | 用户尝试跳过阶段 | 状态机拒绝，显示缺失的前置阶段 |
| EC-002 | 规范文件不存在 | 提示先运行对应阶段的 Agent |
| EC-003 | 状态文件损坏 | 重新初始化状态 |
| EC-004 | Agent 文件缺失 | 启动时警告，不影响其他功能 |

---

## 8. 附录

### 8.1 已实现 Agent 列表

| Agent | 阶段 | 模型 |
|-------|------|------|
| @sdd | 入口 | qwen3.5-plus |
| @sdd-help | 帮助 | - |
| @sdd-1-spec / @sdd-spec | 1/6 规范 | qwen3.5-plus |
| @sdd-2-plan / @sdd-plan | 2/6 规划 | qwen3.5-plus |
| @sdd-3-tasks / @sdd-tasks | 3/6 任务 | qwen3.5-plus |
| @sdd-4-build / @sdd-build | 4/6 实现 | qwen3-coder-plus |
| @sdd-5-review / @sdd-review | 5/6 审查 | qwen3-coder-plus |
| @sdd-6-validate / @sdd-validate | 6/6 验证 | qwen3-coder-plus |

### 8.2 版本历史

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.0.0 | 2026-03-20 | 首发版本 |
| 1.1.0 | 2026-03-25 | Phase 1 优化（权限配置 + 模板格式） |

---

**文档状态**: completed  
**实现进度**: 100% (Phase 1 已完成)