# Feature Specification: SDD Plugin Phase 2

| 元数据 | 值 |
|--------|-----|
| **Feature ID** | sdd-plugin-phase2 |
| **名称** | OpenCode SDD 插件 - Phase 2 增强功能 |
| **版本** | 1.2.0 (规划中) |
| **创建日期** | 2026-03-28 |
| **状态** | specified |
| **优先级** | P1 |
| **干系人** | 开发团队 |

---

## 1. 上下文

### 1.1 项目背景
基于 Phase 1 已完成的 SDD 插件基线，Phase 2 将利用 OpenCode 官方最新能力（Agent Skills、Plugin Events、MCP 集成、SDK Client 等）增强插件功能。

### 1.2 解决的问题
- 缺乏可重用的 SDD 行为定义
- TUI 集成深度不足
- 无法利用外部文档和代码搜索
- 规范文件结构不够标准化

### 1.3 目标用户
- 需要 SDD 工作流引导的开发者
- 需要文档搜索支持的技术团队
- 关注规范化开发的组织

---

## 2. Goals & Non-Goals

### 2.1 Goals ✅
- 实现 Agent Skills 系统定义可重用 SDD 行为
- 利用 Plugin Events 深度集成 TUI（通知、会话压缩）
- 集成 MCP 服务（context7 文档搜索、gh_grep 代码示例）
- 实现 Structured Output 确保规范文件结构一致
- 使用 SDK Client 增强 Agent 能力

### 2.2 Non-Goals ❌
- 多 Feature 并发管理（Phase 3）
- 一键回滚功能（Phase 3）
- Git hooks 集成（Phase 3）

---

## 3. 用户故事

| ID | 故事 | 价值 |
|----|------|------|
| US-101 | 作为开发者，我想要通过 Skill 工具加载 SDD 行为指导，以便获得上下文相关的帮助 | 降低学习成本 |
| US-102 | 作为开发者，我想要在阶段完成时收到 TUI 通知，以便及时了解进度 | 提升体验 |
| US-103 | 作为开发者，我想要在规划阶段搜索技术文档，以便获取最新参考资料 | 提高质量 |
| US-104 | 作为开发者，我想要规范文件自动符合 JSON Schema，以便保证结构一致性 | 减少错误 |

---

## 4. 功能需求 (FR)

### 4.1 Agent Skills 系统

| ID | 需求 | 验收标准 |
|----|------|----------|
| FR-101 | 实现 sdd-workflow Skill | 加载后提供工作流引导和状态检查 |
| FR-102 | 实现 sdd-spec-template Skill | 提供规范模板和示例 |
| FR-103 | 实现 sdd-review-checklist Skill | 提供代码审查清单 |
| FR-104 | 实现 sdd-api-align Skill | 提供 API 对齐检查指导 |

### 4.2 TUI 集成

| ID | 需求 | 验收标准 |
|----|------|----------|
| FR-111 | 阶段完成通知 | session.idle 触发 showToast |
| FR-112 | 会话压缩上下文注入 | experimental.session.compacting 注入 SDD 状态 |
| FR-113 | TUI 命令执行 | tui.command.execute 处理 /sdd 命令 |

### 4.3 MCP 集成

| ID | 需求 | 验收标准 |
|----|------|----------|
| FR-121 | context7 文档搜索 | @sdd-plan 可使用 context7 搜索文档 |
| FR-122 | gh_grep 代码示例 | @sdd-plan 可使用 gh_grep 搜索代码示例 |

### 4.4 Structured Output

| ID | 需求 | 验收标准 |
|----|------|----------|
| FR-131 | 规范 JSON Schema | spec.md 符合预定义 Schema |
| FR-132 | 规划 JSON Schema | plan.md 符合预定义 Schema |
| FR-133 | 任务 JSON Schema | tasks.md 符合预定义 Schema |

---

## 5. 非功能需求 (NFR)

| ID | 需求 | 指标 |
|----|------|------|
| NFR-101 | 性能 | Skill 加载时间 < 1 秒 |
| NFR-102 | 可用性 | MCP 响应时间 < 3 秒 |
| NFR-103 | 兼容性 | 与 Phase 1 功能完全兼容 |

---

## 6. 技术设计

### 6.1 架构概览

```
┌─────────────────────────────────────────────────────────────────────┐
│                          OpenCode Host                               │
├─────────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                      SDD Plugin (v1.2.0)                      │  │
│  ├───────────────────────────────────────────────────────────────┤  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────────┐  │  │
│  │  │ Agents   │ │ Commands │ │ Skills   │ │ State Machine   │  │  │
│  │  │ 14 .md   │ │  /sdd    │ │ 4 SKILL  │ │  machine.ts     │  │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └─────────────────┘  │  │
│  ├───────────────────────────────────────────────────────────────┤  │
│  │  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────┐  │  │
│  │  │ Plugin Events    │ │ MCP Integration  │ │ SDK Client   │  │  │
│  │  │ - tui.toast      │ │ - context7       │ │ - prompt     │  │  │
│  │  │ - session.compact│ │ - gh_grep        │ │ - showToast  │  │  │
│  │  └──────────────────┘ └──────────────────┘ └──────────────┘  │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.2 OpenCode 官方能力依赖

| 能力 | 文档位置 | 用途 |
|------|----------|------|
| Agent Skills | `/docs/skills/` | 定义可重用 SDD 行为 |
| Plugin Events | `/docs/plugins/#events` | TUI 集成、会话压缩 |
| MCP Servers | `/docs/mcp-servers/` | 文档搜索、代码示例 |
| Structured Output | `/docs/sdk/#structured-output` | JSON schema 响应 |
| SDK Client | `/docs/sdk/` | 编程控制 Agent |

### 6.3 文件结构

```
opencode-sdd-plugin/
├── .opencode/
│   ├── skills/
│   │   ├── sdd-workflow/SKILL.md
│   │   ├── sdd-spec-template/SKILL.md
│   │   ├── sdd-review-checklist/SKILL.md
│   │   └── sdd-api-align/SKILL.md
│   └── agents/           # Phase 1 已有
├── src/
│   ├── plugins/
│   │   ├── tui-plugin.ts
│   │   └── compaction-plugin.ts
│   └── tools/
│       └── spec-output.ts
└── opencode.json         # MCP 配置
```

---

## 7. 边界情况 (EC)

| ID | 场景 | 处理方式 |
|----|------|----------|
| EC-101 | MCP 服务不可用 | 降级为原有功能，显示警告 |
| EC-102 | Skill 加载失败 | 忽略该 Skill，不影响其他功能 |
| EC-103 | Structured Output 验证失败 | 提示用户修正，提供示例 |

---

## 8. 依赖关系

### 8.1 依赖 Phase 1 功能

| 功能 | 依赖方式 |
|------|----------|
| 14 个 Agent | 增强（添加 Skills、MCP 支持） |
| 状态机 | 不变 |
| /sdd 命令 | 不变 |

### 8.2 外部依赖

| 依赖 | 说明 |
|------|------|
| OpenCode Skills API | 官方支持 |
| context7 MCP | https://mcp.context7.com/mcp |
| gh_grep MCP | https://mcp.grep.app |

---

## 9. 附录

### 9.1 OpenCode 官方文档参考

- Agents: https://opencode.ai/docs/agents/
- Plugins: https://opencode.ai/docs/plugins/
- Skills: https://opencode.ai/docs/skills/
- MCP: https://opencode.ai/docs/mcp-servers/
- SDK: https://opencode.ai/docs/sdk/

### 9.2 版本规划

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.1.0 | 2026-03-25 | Phase 1 基线 |
| 1.2.0 | 待定 | Phase 2 增强功能 |

---

**文档状态**: specified  
**下一步**: 进入 plan 阶段，创建技术规划文档