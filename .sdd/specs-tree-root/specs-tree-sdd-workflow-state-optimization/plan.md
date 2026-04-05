# SDD 工作流状态优化 - 技术规划 (v2.0.0)

| 元数据 | 值 |
|--------|-----|
| **Feature ID** | FR-SDD-004 |
| **Feature 名称** | SDD 工作流状态优化 |
| **版本** | 2.0.0 |
| **创建日期** | 2026-04-05 |
| **作者** | SDD Team |
| **状态** | planned |
| **Phase** | 2 |

---

## 1. 架构设计

### 1.1 整体架构

基于 **sdd-multi-module (v1.2.11)** 已有的分布式状态管理基础，本 Feature 聚焦于状态机集成和自动化能力增强。

```
┌─────────────────────────────────────────────────────────────────┐
│                      Agent 工作流层                              │
│  @sdd-spec → @sdd-plan → @sdd-tasks → @sdd-build → @sdd-review │
└────────────────────────┬────────────────────────────────────────┘
                         │ 状态变更事件
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   StateMachine (增强)                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ • 状态转换验证 (已有，需集成到 Agent 工作流)                  │   │
│  │ • 自动状态更新 (session.idle 事件触发)                     │   │
│  │ • 历史记录自动记录 (phaseHistory)                         │   │
│  │ • 依赖状态检查器 (新增)                                    │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────────┘
                         │ 状态读写
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              StateManager (已有，sdd-multi-module)               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ • 分布式 state.json 管理 (每个 Feature 独立)                 │   │
│  │ • State Schema v1.2.11 → v2.0.0 迁移                      │   │
│  │ • 依赖关系图构建 + 循环依赖检测                            │   │
│  │ • 跨 Feature 聚合查询 (自动扫描)                           │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                         │ 文件持久化
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    文件系统层                                    │
│  .sdd/specs-tree-root/*/state.json (分布式存储)                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 组件关系

| 组件 | 来源 | 职责 | 本 Feature 变更 |
|------|------|------|----------------|
| `StateMachine` | 现有 (`src/state/machine.ts`) | 状态转换验证 | **增强**: 集成到 Agent 工作流、自动更新 |
| `MultiFeatureManager` | 现有 (`src/state/multi-feature-manager.ts`) | 依赖图、聚合查询 | **复用**: 依赖检查器基于此实现 |
| `Schema v1.2.11` | 现有 (`src/state/schema-v1.2.5.ts`) | 状态数据格式 | **扩展**: 新增 v2.0.0 Schema |
| `Migrator` | 现有 (`src/state/migrator.ts`) | Schema 迁移 | **增强**: 支持 v1.2.11 → v2.0.0 |
| `WorkspaceUtils` | 现有 (`src/utils/workspace.ts`) | 工作空间识别 | **复用**: 无需变更 |

### 1.3 数据流

```
用户命令 (@sdd-plan)
       │
       ▼
┌──────────────────┐
│   Command Handler │
└────────┬─────────┘
         │ 1. 执行任务
         ▼
┌──────────────────┐
│   Agent 工作流    │
└────────┬─────────┘
         │ 2. 任务完成
         ▼
┌──────────────────┐
│   StateMachine   │ ← 3. 验证状态转换 (specified → planned)
└────────┬─────────┘
         │ 4. 验证通过
         ▼
┌──────────────────┐
│ StateManager     │ ← 5. 更新 state.json
└────────┬─────────┘
         │ 6. 追加历史记录
         ▼
┌──────────────────┐
│  state.json      │
│  (分布式存储)     │
└──────────────────┘
```

---

## 2. 技术决策 (ADR)

### 2.1 ADR 列表

| ADR ID | 标题 | 状态 | 优先级 |
|--------|------|------|--------|
| [ADR-006](../architecture/adr/ADR-006.md) | StateMachine 集成策略 | PROPOSED | P0 |
| [ADR-007](../architecture/adr/ADR-007.md) | 状态自动更新机制 | PROPOSED | P0 |
| [ADR-008](../architecture/adr/ADR-008.md) | 状态历史记录格式 | PROPOSED | P1 |
| [ADR-009](../architecture/adr/ADR-009.md) | 依赖检查器实现方案 | PROPOSED | P1 |
| [ADR-010](../architecture/adr/ADR-010.md) | State Schema v2.0.0 迁移 | PROPOSED | P0 |

### 2.2 决策摘要

#### ADR-006: StateMachine 集成策略

**决策**: 在现有 StateMachine 基础上添加 Agent 工作流钩子，每个 Agent 完成后自动调用状态更新。

**理由**:
- 复用现有 StateMachine 验证逻辑
- 最小化代码改动
- 保持向后兼容

#### ADR-007: 状态自动更新机制

**决策**: 采用双重触发机制：
1. **显式触发**: Agent 完成后立即调用状态更新
2. **隐式触发**: session.idle 事件触发时扫描文件变更并更新

**理由**:
- 显式触发确保及时性
- 隐式触发作为备用机制
- 避免过度频繁的状态更新

#### ADR-008: 状态历史记录格式

**决策**: 在现有 `history` 数组基础上，新增 `phaseHistory` 字段记录阶段级别的变更。

**格式**:
```json
{
  "history": [
    {
      "timestamp": "2026-04-05T10:00:00Z",
      "from": "specified",
      "to": "planned",
      "triggeredBy": "@sdd-plan",
      "actor": "agent-name",
      "comment": "技术规划完成"
    }
  ],
  "phaseHistory": [
    {
      "timestamp": "2026-04-05T10:00:00Z",
      "phase": 2,
      "phaseName": "planned",
      "triggeredBy": "@sdd-plan"
    }
  ]
}
```

**理由**:
- `history` 记录状态变更（细粒度）
- `phaseHistory` 记录阶段变更（粗粒度，便于统计）
- 两者互补，满足不同查询需求

#### ADR-009: 依赖检查器实现方案

**决策**: 基于现有 `MultiFeatureManager` 的依赖图构建能力，新增状态级别的依赖检查。

**检查规则**:
- 状态前进时：检查所有依赖 Feature 的状态 ≥ 当前状态
- 状态回退时：警告检查被依赖 Feature 的状态

**理由**:
- 复用现有依赖图构建逻辑
- 避免重复实现
- 与 sdd-multi-module 保持一致

#### ADR-010: State Schema v2.0.0 迁移

**决策**: 采用渐进式迁移策略，支持 v1.2.11 和 v2.0.0 共存，提供迁移工具。

**迁移路径**:
```
v1.2.11 → (Migrator) → v2.0.0
```

**兼容性**:
- 读取：支持 v1.2.5/v1.2.11/v2.0.0
- 写入：统一使用 v2.0.0
- 迁移：自动检测并提示升级

**理由**:
- 避免破坏现有 Feature
- 允许渐进迁移
- 保持向后兼容

---

## 3. 实现策略

### 3.1 增量重构原则

1. **复用优先**: 优先复用 sdd-multi-module 已有实现
2. **向后兼容**: 保持现有 API 不变，新增功能通过扩展实现
3. **渐进迁移**: 支持多 Schema 版本共存，逐步迁移到 v2.0.0
4. **最小改动**: 仅修改必要代码，避免大范围重构

### 3.2 与 sdd-multi-module 的关系

| 功能 | sdd-multi-module 状态 | 本 Feature 动作 |
|------|----------------------|----------------|
| 分布式 state.json | ✅ 已完成 | **复用** |
| State Schema v1.2.11 | ✅ 已完成 | **扩展** (新增 v2.0.0) |
| 依赖关系图构建 | ✅ 已完成 | **复用** |
| 循环依赖检测 | ✅ 已完成 | **复用** |
| 依赖就绪检查 | ✅ 已完成 | **增强** (状态级别检查) |
| StateMachine | ⚠️ 部分实现 | **集成** (到 Agent 工作流) |
| 状态自动更新 | ❌ 未实现 | **新增** |
| 状态历史记录 | ⚠️ 部分实现 | **增强** (自动化) |
| 跨 Feature 聚合 | ⚠️ 部分实现 | **增强** (自动化扫描) |

### 3.3 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Node.js | ≥ 18.0.0 | 运行时 |
| TypeScript | ≥ 5.0.0 | 开发语言 |
| fs/promises | 内置 | 文件操作 |
| path | 内置 | 路径处理 |

---

## 4. 文件影响分析

### 4.1 新增文件

```
- [NEW] src/state/schema-v2.0.0.ts          # State Schema v2.0.0 定义
- [NEW] src/state/dependency-checker.ts     # 依赖状态检查器
- [NEW] src/state/auto-updater.ts           # 状态自动更新器 (session.idle)
- [NEW] src/commands/sdd-migrate-schema.ts  # Schema 迁移命令
- [NEW] .sdd/specs-tree-root/architecture/adr/ADR-006.md
- [NEW] .sdd/specs-tree-root/architecture/adr/ADR-007.md
- [NEW] .sdd/specs-tree-root/architecture/adr/ADR-008.md
- [NEW] .sdd/specs-tree-root/architecture/adr/ADR-009.md
- [NEW] .sdd/specs-tree-root/architecture/adr/ADR-010.md
```

### 4.2 修改文件

```
- [MODIFY] src/state/machine.ts             # 集成到 Agent 工作流
- [MODIFY] src/state/multi-feature-manager.ts # 增强依赖检查器
- [MODIFY] src/state/migrator.ts            # 支持 v1.2.11 → v2.0.0 迁移
- [MODIFY] src/agents/sdd-agents.ts         # 添加状态更新钩子
- [MODIFY] src/index.ts                     # 导出新组件
```

### 4.3 删除文件

```
- 无 (保持向后兼容)
```

---

## 5. 任务分解指导

### 5.1 执行波次 (Waves)

| Wave | 主题 | 任务数 | 依赖 |
|------|------|--------|------|
| Wave 1 | Schema 和类型定义 | 2 | 无 |
| Wave 2 | StateMachine 核心集成 | 3 | Wave 1 |
| Wave 3 | 自动更新机制 | 2 | Wave 2 |
| Wave 4 | 依赖检查器 | 2 | Wave 1 |
| Wave 5 | Schema 迁移工具 | 2 | Wave 1 |
| Wave 6 | 测试和集成 | 3 | Wave 2-5 |

### 5.2 任务分配建议

| 任务类型 | 建议执行者 |
|----------|------------|
| Schema 定义 | AI Assistant |
| StateMachine 集成 | AI Assistant |
| 自动更新器 | AI Assistant |
| 依赖检查器 | AI Assistant |
| 迁移工具 | AI Assistant |
| 测试 | AI Assistant + 人工评审 |

### 5.3 避免重复工作

**不要重新实现** (sdd-multi-module 已有):
- ❌ 分布式 state.json 管理
- ❌ 依赖关系图构建
- ❌ 循环依赖检测
- ❌ 工作空间识别

**聚焦新增功能**:
- ✅ StateMachine 与 Agent 工作流集成
- ✅ session.idle 事件处理
- ✅ 状态历史记录自动化
- ✅ Schema v2.0.0 定义和迁移

---

## 6. 风险评估

### 6.1 技术风险

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| StateMachine 与 Agent 集成复杂 | 高 | 中 | 分步实现，先集成一个 Agent 验证 |
| session.idle 事件触发不准确 | 中 | 中 | 提供手动触发备用机制 |
| Schema 迁移导致数据丢失 | 高 | 低 | 迁移前备份，支持回滚 |
| 依赖检查器性能问题 | 中 | 低 | 添加缓存机制，限制递归深度 |

### 6.2 依赖风险

| 依赖 | 风险 | 缓解措施 |
|------|------|----------|
| sdd-multi-module | 低风险 (已验证完成) | 复用已有 API，不修改核心逻辑 |
| Agent 工作流 | 中风险 (需协调 6 个 Agent) | 统一钩子接口，逐个集成测试 |

### 6.3 时间风险

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 任务量估计不足 | 中 | 分 Wave 交付，优先 P0 任务 |
| 测试时间不足 | 中 | 自动化测试优先，人工评审关键路径 |

### 6.4 兼容性风险

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 旧 Schema Feature 无法读取 | 高 | Migrator 支持多版本读取 |
| 状态更新破坏现有流程 | 高 | 默认关闭自动更新，手动开启 |

---

## 7. 验收标准

### 7.1 功能验收

| ID | 验收项 | 验证方法 |
|----|--------|----------|
| AC-001 | StateMachine 集成到所有 6 个 Agent | 运行每个 Agent，验证状态自动更新 |
| AC-002 | session.idle 触发状态更新 | 修改文件后等待 idle，验证状态更新 |
| AC-003 | 历史记录自动记录 | 检查 state.json 的 history 数组 |
| AC-004 | 依赖状态检查 | 尝试在依赖未就绪时推进状态，验证被阻止 |
| AC-005 | Schema 迁移工具 | 运行迁移命令，验证 v1.2.11 → v2.0.0 |
| AC-006 | 跨 Feature 聚合查询 | 运行聚合查询，验证返回所有 Feature 状态 |

### 7.2 性能验收

| 指标 | 目标 | 验证方法 |
|------|------|----------|
| 单个状态查询 | < 100ms | 性能测试 |
| 状态更新操作 | < 500ms | 性能测试 |
| 跨 Feature 聚合 (100 个) | < 500ms | 性能测试 |
| 依赖检查 | < 200ms | 性能测试 |

### 7.3 兼容性验收

| 验收项 | 验证方法 |
|--------|----------|
| 支持 v1.2.5/v1.2.11/v2.0.0 读取 | 加载不同版本的 state.json |
| 迁移后数据完整 | 迁移前后对比关键字段 |
| 现有 Agent 工作流不受影响 | 运行现有 Feature 的 Agent |

---

## 8. 下一步

### 8.1 立即可执行

1. ✅ 技术规划评审完成
2. ✅ ADR-006 ~ ADR-010 已创建
3. 👉 运行 `@sdd-tasks specs-tree-sdd-workflow-state-optimization` 开始任务分解

### 8.2 状态更新

完成后请运行：
```bash
/tool sdd_update_state {"feature": "specs-tree-sdd-workflow-state-optimization", "state": "planned"}
```

---

## 9. 附录

### 9.1 State Schema v2.0.0 定义 (草案)

```typescript
interface StateV2_0_0 {
  feature: string;                    // Feature ID
  name: string;                       // Feature 名称
  version: '2.0.0';                   // Schema 版本
  status: FeatureStatus;              // 当前状态
  phase: number;                      // 当前阶段 (1-6)
  level: number;                      // 嵌套层级 (1-10)
  parent: string | null;              // 父 Feature ID
  files: {
    spec: string;
    plan: string;
    tasks: string;
    readme: string;
    review?: string;
    validation?: string;
  };
  dependencies: {
    on: string[];                     // 依赖的 Feature ID 列表
    blocking: string[];               // 被哪些 Feature 阻塞
  };
  history: HistoryEntry[];            // 状态变更历史
  phaseHistory: PhaseHistoryEntry[];  // 阶段变更历史
  createdAt: string;                  // ISO 8601
  updatedAt: string;                  // ISO 8601
}
```

### 9.2 参考文档

- [规范文档](./spec.md)
- [sdd-multi-module 实现](../specs-tree-sdd-multi-module/)
- [StateMachine 实现](../../../src/state/machine.ts)
- [TREE.md 目录结构规范](../../../TREE.md)

---

**规划版本**: 2.0.0  
**规划状态**: planned  
**下一步**: 运行 `@sdd-tasks specs-tree-sdd-workflow-state-optimization` 开始任务分解
