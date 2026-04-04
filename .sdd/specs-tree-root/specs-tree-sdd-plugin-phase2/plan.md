# Technical Plan: SDD Plugin Phase 2

| 元数据 | 值 |
|--------|-----|
| **Feature ID** | sdd-plugin-phase2 |
| **规范版本** | 1.2.0 |
| **创建日期** | 2026-03-28 |
| **状态** | planned |

---

## 1. 架构分析

### 1.1 Phase 2 架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                          OpenCode Host                               │
├─────────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                      SDD Plugin (v1.2.0)                      │  │
│  ├───────────────────────────────────────────────────────────────┤  │
│  │  Phase 1 (已有)              │  Phase 2 (新增)                │  │
│  │  ┌──────────────────────┐    │  ┌──────────────────────────┐  │  │
│  │  │ Agents (14)          │    │  │ Skills (4)               │  │  │
│  │  │ Commands (/sdd)      │    │  │ Plugin Events (3)        │  │  │
│  │  │ State Machine        │    │  │ MCP Integration (2)      │  │  │
│  │  └──────────────────────┘    │  │ Structured Output        │  │  │
│  │                              │  └──────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 新增组件说明

| 组件 | 类型 | 职责 |
|------|------|------|
| sdd-workflow Skill | SKILL.md | 工作流引导和状态检查 |
| sdd-spec-template Skill | SKILL.md | 规范模板和示例 |
| sdd-review-checklist Skill | SKILL.md | 代码审查清单 |
| sdd-api-align Skill | SKILL.md | API 对齐检查指导 |
| TUI Plugin | TypeScript | TUI 事件处理 |
| Compaction Plugin | TypeScript | 会话压缩上下文注入 |
| context7 MCP | Remote MCP | 文档搜索 |
| gh_grep MCP | Remote MCP | 代码示例搜索 |

---

## 2. 技术方案

### 2.1 Agent Skills 实现

**目录结构**:
```
.opencode/skills/
├── sdd-workflow/
│   └── SKILL.md
├── sdd-spec-template/
│   └── SKILL.md
├── sdd-review-checklist/
│   └── SKILL.md
└── sdd-api-align/
    └── SKILL.md
```

**SKILL.md 格式** (基于官方文档规范):
```yaml
---
name: sdd-workflow
description: SDD 6阶段工作流引导和状态检查
license: MIT
compatibility: opencode
metadata:
  phase: all
  audience: developers
---

## What I do
- 检测当前 Feature 状态
- 推荐正确的下一步 Agent
- 验证阶段跳转合法性

## When to use me
当用户需要:
- 开始新的 Feature
- 查看当前进度
- 确认下一步操作
```

**4 个 Skills 内容**:

| Skill | 描述 | 触发场景 |
|-------|------|----------|
| sdd-workflow | 工作流引导 | 用户询问流程 |
| sdd-spec-template | 规范模板 | 编写规范时 |
| sdd-review-checklist | 审查清单 | 代码审查时 |
| sdd-api-align | API 对齐 | 检查一致性时 |

### 2.2 Plugin Events 实现

**TUI Plugin** (`src/plugins/tui-plugin.ts`):
```typescript
import type { Plugin } from "@opencode-ai/plugin"

export const TUIPlugin: Plugin = async ({ client }) => {
  return {
    // 阶段完成时显示通知
    "session.idle": async (input, output) => {
      const state = await getSDDState()
      if (state.phaseCompleted) {
        await client.tui.showToast({
          body: {
            message: `SDD ${state.phase} 阶段完成`,
            variant: "success"
          }
        })
      }
    },
    
    // TUI 命令执行
    "tui.command.execute": async (input, output) => {
      if (input.command?.startsWith("/sdd")) {
        // 处理 SDD 命令
      }
    }
  }
}
```

**Compaction Plugin** (`src/plugins/compaction-plugin.ts`):
```typescript
import type { Plugin } from "@opencode-ai/plugin"

export const CompactionPlugin: Plugin = async (ctx) => {
  return {
    "experimental.session.compacting": async (input, output) => {
      const state = await getSDDState()
      output.context.push(`
## SDD 状态上下文
- 当前 Feature: ${state.featureId}
- 当前阶段: ${state.phase}
- 已完成: ${state.completedPhases.join(', ')}
- 待处理: ${state.pendingTasks.join(', ')}

请在压缩后的会话中保持此上下文。
`)
    }
  }
}
```

### 2.3 MCP 集成实现

**配置** (`opencode.json`):
```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "context7": {
      "type": "remote",
      "url": "https://mcp.context7.com/mcp",
      "enabled": true
    },
    "gh_grep": {
      "type": "remote",
      "url": "https://mcp.grep.app",
      "enabled": true
    }
  }
}
```

**Agent 增强** (修改 `.opencode/agents/sdd-2-plan.md`):
```markdown
---
description: SDD 技术规划专家
permission:
  edit: ask
  bash: allow
  webfetch: allow
  task:
    "sdd-*": allow
    "context7": allow
    "gh_grep": allow
---

## 工具使用指南

当需要查询技术文档或代码示例时:
1. 使用 context7 搜索官方文档
2. 使用 gh_grep 搜索 GitHub 代码示例

示例命令:
- "使用 context7 搜索 React hooks 文档"
- "使用 gh_grep 搜索 Next.js API 路由示例"
```

### 2.4 Structured Output 实现

**Schema 定义** (`src/tools/spec-output.ts`):
```typescript
import { tool } from "@opencode-ai/plugin"

export const specSchema = {
  type: "json_schema",
  schema: {
    type: "object",
    properties: {
      featureId: { type: "string", description: "Feature ID" },
      name: { type: "string", description: "Feature 名称" },
      version: { type: "string", description: "版本号" },
      goals: {
        type: "array",
        items: { type: "string" },
        description: "Goals 列表"
      },
      nonGoals: {
        type: "array",
        items: { type: "string" },
        description: "Non-Goals 列表"
      },
      userStories: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            story: { type: "string" },
            value: { type: "string" }
          }
        }
      }
    },
    required: ["featureId", "name", "goals"]
  }
}
```

**使用方式**:
```typescript
const result = await client.session.prompt({
  path: { id: sessionId },
  body: {
    parts: [{ type: "text", text: "生成 Feature 规范" }],
    format: specSchema
  }
})
```

---

## 3. 文件影响分析

### 3.1 新增文件

| 状态 | 文件路径 | 说明 |
|------|----------|------|
| [NEW] | `.opencode/skills/sdd-workflow/SKILL.md` | 工作流 Skill |
| [NEW] | `.opencode/skills/sdd-spec-template/SKILL.md` | 规范模板 Skill |
| [NEW] | `.opencode/skills/sdd-review-checklist/SKILL.md` | 审查清单 Skill |
| [NEW] | `.opencode/skills/sdd-api-align/SKILL.md` | API 对齐 Skill |
| [NEW] | `src/plugins/tui-plugin.ts` | TUI 事件插件 |
| [NEW] | `src/plugins/compaction-plugin.ts` | 会话压缩插件 |
| [NEW] | `src/tools/spec-output.ts` | Structured Output 工具 |

### 3.2 修改文件

| 状态 | 文件路径 | 修改内容 |
|------|----------|----------|
| [MODIFY] | `opencode.json` | 添加 MCP 配置 |
| [MODIFY] | `.opencode/agents/sdd-2-plan.md` | 添加 MCP 权限和使用说明 |
| [MODIFY] | `.opencode/agents/sdd-4-build.md` | 添加 Skills 支持 |
| [MODIFY] | `src/index.ts` | 注册新 Plugins |

### 3.3 不变文件

| 文件 | 说明 |
|------|------|
| `src/state/machine.ts` | 状态机逻辑不变 |
| `src/commands/sdd.ts` | 命令系统不变 |
| 其他 12 个 Agent | 仅权限配置可能微调 |

---

## 4. 实施计划

### 4.1 Wave 1: Skills 系统 (无依赖)

| 任务 | 预计工时 |
|------|----------|
| 创建 sdd-workflow Skill | 2h |
| 创建 sdd-spec-template Skill | 2h |
| 创建 sdd-review-checklist Skill | 2h |
| 创建 sdd-api-align Skill | 2h |

### 4.2 Wave 2: Plugin Events (依赖 Wave 1)

| 任务 | 预计工时 |
|------|----------|
| 实现 TUI Plugin | 4h |
| 实现 Compaction Plugin | 3h |
| 测试事件触发 | 2h |

### 4.3 Wave 3: MCP 集成 (依赖 Wave 2)

| 任务 | 预计工时 |
|------|----------|
| 配置 context7 MCP | 1h |
| 配置 gh_grep MCP | 1h |
| 增强 Agent 权限配置 | 2h |
| 测试 MCP 调用 | 2h |

### 4.4 Wave 4: Structured Output (依赖 Wave 3)

| 任务 | 预计工时 |
|------|----------|
| 定义 JSON Schema | 2h |
| 实现 Schema 验证 | 2h |
| 集成到 Agent | 2h |

**总工时**: 约 27 小时

---

## 5. 风险评估

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| MCP 服务不稳定 | 中 | 低 | 降级为原有功能 |
| OpenCode API 变更 | 低 | 高 | 关注官方更新 |
| Skills 加载冲突 | 低 | 中 | 使用唯一命名 |

---

## 6. OpenCode 官方能力参考

### 6.1 Skills API

```typescript
// 调用 Skill
skill({ name: "sdd-workflow" })
```

### 6.2 Plugin Events

```typescript
// 可用事件列表
"session.idle"              // 会话空闲
"session.compacted"         // 会话压缩完成
"tui.command.execute"       // TUI 命令执行
"tui.toast.show"            // 显示 Toast
"experimental.session.compacting"  // 会话压缩中
```

### 6.3 MCP 工具

```typescript
// context7 工具
context7_search({ query: "React hooks" })

// gh_grep 工具
gh_grep_search({ query: "Next.js API routes" })
```

---

**文档状态**: planned  
**下一步**: 进入 tasks 阶段，创建任务分解文档