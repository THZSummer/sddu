# Technical Plan: SDD Plugin 基线

| 元数据 | 值 |
|--------|-----|
| **Feature ID** | sdd-plugin-baseline |
| **规范版本** | 1.1.0 |
| **创建日期** | 2026-03-28 |
| **状态** | completed |

---

## 1. 架构分析

### 1.1 当前架构

```
┌────────────────────────────────────────────────────────────────┐
│                        OpenCode Host                           │
├────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    SDD Plugin                            │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────────┐  │  │
│  │  │   Agents   │  │  Commands  │  │   State Machine    │  │  │
│  │  │  14 .md    │  │   /sdd     │  │  machine.ts        │  │  │
│  │  │  files     │  │  sdd.ts    │  │  - 状态验证        │  │  │
│  │  │            │  │            │  │  - 文件检查        │  │  │
│  │  └────────────┘  └────────────┘  └────────────────────┘  │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │                    TypeScript Core                       │  │
│  │                    index.ts                              │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

### 1.2 组件说明

| 组件 | 文件 | 职责 | 状态 |
|------|------|------|------|
| 插件入口 | `src/index.ts` | 注册 Hooks 和工具 | ✅ 已实现 |
| Agent 注册 | `src/agents/sdd-agents.ts` | 注册 14 个 Agent | ✅ 已实现 |
| 命令系统 | `src/commands/sdd.ts` | 实现 /sdd 命令 | ✅ 已实现 |
| 状态机 | `src/state/machine.ts` | 状态流转验证 | ✅ 已实现 |
| Agent 生成 | `build-agents.cjs` | 从模板生成 14 个 Agent 文件 | ✅ 已实现 |

---

## 2. 技术方案

### 2.1 状态机设计（已实现）

**状态定义**:
```typescript
type FeatureState = 'drafting' | 'specified' | 'planned' | 'tasked' | 'implementing' | 'reviewed' | 'validated' | 'completed'
```

**流转规则**:
```typescript
const validTransitions = {
  'drafting': ['specified'],
  'specified': ['planned'],
  'planned': ['tasked'],
  'tasked': ['implementing'],
  'implementing': ['reviewed'],
  'reviewed': ['validated'],
  'validated': ['completed'],
  'completed': []
}
```

**验证逻辑**:
1. 检查当前状态是否允许跳转到目标状态
2. 检查必需文件是否存在（spec.md, plan.md, tasks.md 等）
3. 返回验证结果和缺失的前置阶段

### 2.2 Agent 系统设计（已实现）

**Agent 命名策略**:
- 序号版：`sdd-1-spec`, `sdd-2-plan`, ...（推荐）
- 短名版：`sdd-spec`, `sdd-plan`, ...（兼容）

**权限配置**:
| Agent | edit | bash | webfetch |
|-------|------|------|----------|
| spec | ask | ask | allow |
| plan | ask | allow | allow |
| tasks | ask | allow | deny |
| build | ask | ask | allow |
| review | ask | allow | deny |
| validate | deny | allow | deny |

### 2.3 命令系统设计（已实现）

**命令列表**:
```
/sdd init           - 初始化工作流
/sdd specify        - 创建规范
/sdd plan           - 技术规划（带前置验证）
/sdd tasks          - 任务分解（带前置验证）
/sdd implement      - 任务实现（带前置验证）
/sdd validate       - 最终验证（带前置验证）
/sdd status         - 查看状态
```

---

## 3. 文件清单

### 3.1 核心源文件

| 文件路径 | 说明 | 行数 |
|----------|------|------|
| `src/index.ts` | 插件入口 | 102 |
| `src/agents/sdd-agents.ts` | Agent 注册 | 106 |
| `src/commands/sdd.ts` | 命令定义 | 271 |
| `src/state/machine.ts` | 状态机 | 289 |
| `build-agents.cjs` | Agent 生成脚本 | 179 |

### 3.2 Agent 定义文件（14 个）

| 文件 | 阶段 |
|------|------|
| `.opencode/agents/sdd.md` | 智能入口 |
| `.opencode/agents/sdd-help.md` | 帮助 |
| `.opencode/agents/sdd-1-spec.md` | 规范 |
| `.opencode/agents/sdd-spec.md` | 规范 (短名) |
| `.opencode/agents/sdd-2-plan.md` | 规划 |
| `.opencode/agents/sdd-plan.md` | 规划 (短名) |
| `.opencode/agents/sdd-3-tasks.md` | 任务 |
| `.opencode/agents/sdd-tasks.md` | 任务 (短名) |
| `.opencode/agents/sdd-4-build.md` | 实现 |
| `.opencode/agents/sdd-build.md` | 实现 (短名) |
| `.opencode/agents/sdd-5-review.md` | 审查 |
| `.opencode/agents/sdd-review.md` | 审查 (短名) |
| `.opencode/agents/sdd-6-validate.md` | 验证 |
| `.opencode/agents/sdd-validate.md` | 验证 (短名) |

### 3.3 文档文件

| 文件 | 说明 |
|------|------|
| `README.md` | 项目说明 |
| `INSTALL.md` | 安装指南 |
| `CHANGELOG.md` | 版本历史 |

---

**文档状态**: completed  
**实现进度**: 100% (Phase 1 已完成)