# Technical Plan: SDD Tools Optimization

## 元数据

| 元数据 | 值 |
|--------|-----|
| **Feature ID** | `specs-tree-sdd-tools-optimization` |
| **Feature 名称** | SDD 工具系统优化 |
| **规范版本** | 2.3.0 |
| **计划版本** | 1.0.0 |
| **创建日期** | 2026-04-05 |
| **作者** | SDD Team |
| **优先级** | P1 |
| **状态** | planned |
| **前置依赖** | spec.md (✅ 已完成) |
| **下游依赖** | tasks.md (待开始) |

---

## 1. 架构设计

### 1.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SDD Plugin Architecture                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐          │
│  │   Plugin Entry  │    │  Agent Registry │    │  State Machine  │          │
│  │   src/index.ts  │───▶│  src/agents/    │───▶│  src/state/     │          │
│  │                 │    │  registry.ts    │    │  machine.ts     │          │
│  └────────┬────────┘    └────────┬────────┘    └────────┬────────┘          │
│           │                      │                      │                    │
│           ▼                      ▼                      ▼                    │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐          │
│  │  Unified Types  │    │  Unified Errors │    │  Auto Updater   │          │
│  │  src/types.ts   │    │  src/errors.ts  │    │  src/state/     │          │
│  │                 │    │                 │    │  auto-updater.ts│          │
│  └────────┬────────┘    └────────┬────────┘    └─────────────────┘          │
│           │                      │                                           │
│           ▼                      ▼                                           │
│  ┌─────────────────┐    ┌─────────────────┐                                  │
│  │ Unified Utils   │    │ Discovery Engine│                                  │
│  │ src/utils/      │    │ src/discovery/  │                                  │
│  │  - index.ts     │    │  - workflow-    │                                  │
│  │  - tasks-parser │    │    engine.ts    │                                  │
│  │  - subfeature-  │    │  - coaching-    │                                  │
│  │    manager      │    │    mode.ts      │                                  │
│  │  - readme-      │    │  - types.ts     │                                  │
│  │    generator    │    └─────────────────┘                                  │
│  │  - dependency-  │                                                         │
│  │    notifier     │                                                         │
│  └─────────────────┘                                                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 模块依赖关系图

```
                    ┌─────────────────┐
                    │   src/index.ts  │
                    │   (Plugin Entry)│
                    └────────┬────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
            ▼                ▼                ▼
    ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
    │ src/types.ts  │ │ src/errors.ts │ │src/agents/    │
    │ (Type Export) │ │ (Error System)│ │registry.ts    │
    └───────┬───────┘ └───────┬───────┘ └───────┬───────┘
            │                │                 │
            │                │                 │
            ▼                ▼                 ▼
    ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
    │ src/utils/    │ │ src/state/    │ │ src/discovery/│
    │ index.ts      │ │ machine.ts    │ │ workflow-     │
    │               │ │               │ │ engine.ts     │
    └───────┬───────┘ └───────────────┘ └───────────────┘
            │
            │ re-export
            ▼
    ┌───────────────────────────────────────────────────────┐
    │  Individual Utils (no changes to implementation)      │
    │  - tasks-parser.ts                                    │
    │  - subfeature-manager.ts                              │
    │  - readme-generator.ts                                │
    │  - dependency-notifier.ts                             │
    └───────────────────────────────────────────────────────┘
```

### 1.3 数据流向

```
User Input (Command)
       │
       ▼
┌─────────────────┐
│  Agent Registry │◀── Load from .opencode/plugins/sdd/agents/*.md
│  (Dynamic +     │
│   Static)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Plugin Entry   │──▶ State Machine ──▶ AutoUpdater
│  (index.ts)     │         │
└────────┬────────┘         │
         │                  ▼
         │          ┌───────────────┐
         │          │ .sdd/state.json│
         │          └───────────────┘
         │
         ▼
┌─────────────────┐
│ Discovery Engine│ (Optional)
│ 7 Steps Flow    │
└────────┬────────┘
         │
         │ Auto-update state (configurable)
         ▼
┌─────────────────┐
│ State Machine   │
│ Update to       │
│ 'specified'     │
└─────────────────┘
```

### 1.4 调用链路示例

**场景：用户执行 `@sdd-spec 用户登录`**

```
1. User Command: @sdd-spec 用户登录
   │
   ▼
2. Agent Registry.get('sdd-spec')
   │
   ▼
3. Load prompt from .opencode/plugins/sdd/agents/spec.md
   │
   ▼
4. Plugin Entry (index.ts) intercepts agent call
   │
   ▼
5. Update State: drafting → specified
   │
   ▼
6. Spec Agent executes with prompt
   │
   ▼
7. Generate .sdd/specs-tree-root/user-login/spec.md
   │
   ▼
8. AutoUpdater detects file change
   │
   ▼
9. Verify state consistency
   │
   ▼
10. Complete
```

---

## 2. 实现策略

### 2.1 技术方案对比

#### 方案 A: 渐进式重构（推荐）

**描述**: 保持现有代码不变，新增统一导出层，逐步迁移导入路径。

**优点**:
- ✅ 向后兼容性最好
- ✅ 风险最低，可回滚
- ✅ 可分阶段交付
- ✅ 不影响现有功能

**缺点**:
- ⚠️ 存在重复代码（旧文件 + 新导出层）
- ⚠️ 迁移周期较长

**风险评估**:
- 技术风险：低
- 兼容性风险：低
- 时间风险：中

**预估工作量**: 12 小时

---

#### 方案 B: 彻底重构

**描述**: 直接移动文件到新位置，更新所有导入路径。

**优点**:
- ✅ 代码结构最清晰
- ✅ 无重复代码
- ✅ 一次性完成

**缺点**:
- ❌ 破坏性变更
- ❌ 需要修改大量导入路径
- ❌ 风险高，难以回滚

**风险评估**:
- 技术风险：高
- 兼容性风险：高
- 时间风险：高

**预估工作量**: 20 小时

---

#### 方案 C: 混合方案

**描述**: 新增统一导出层，但废弃旧导入路径（标记 deprecated）。

**优点**:
- ✅ 平衡兼容性和清晰度
- ✅ 明确迁移路径
- ✅ 可逐步淘汰旧代码

**缺点**:
- ⚠️ 需要文档说明
- ⚠️ 用户需要主动迁移

**风险评估**:
- 技术风险：中
- 兼容性风险：中
- 时间风险：中

**预估工作量**: 16 小时

---

### 2.2 推荐方案

**选择**: 方案 A (渐进式重构)

**理由**:
1. SDD 插件处于活跃开发期，稳定性优先
2. 已有用户在使用，不能破坏现有功能
3. 可分 3 个阶段交付，降低单次交付风险
4. 符合 NFR-001 (兼容性) 要求

**实施条件**:
- 阶段 1 完成后，旧导入路径仍然有效
- 阶段 2 完成后，标记旧路径为 deprecated
- 阶段 3 完成后，提供迁移指南，但仍保持兼容

---

## 3. 技术方案

### 3.1 新增文件设计

#### 3.1.1 `src/types.ts` - 统一类型出口

**文件路径**: `src/types.ts`

**代码设计**:

```typescript
// ============================================
// State Types (re-export from state/machine)
// ============================================
export type {
  FeatureStateEnum,
  FeatureState,
  FeatureWithFullHistory,
  AgentWorkflowStateEnum,
  SddPhase,
  TransitionResult,
  AgentTransitionHook,
  AutoUpdaterIntegration
} from './state/machine';

export type {
  StateV2_0_0,
  WorkflowStatus,
  PhaseHistory
} from './state/schema-v2.0.0';

// ============================================
// Discovery Types
// ============================================
export type {
  DiscoveryStep,
  DiscoveryContext,
  DiscoveryProgress,
  DiscoveryResult,
  StepExecutionResult
} from './discovery/types';

export type {
  CoachingLevel,
  CoachingConfig
} from './discovery/types';

// ============================================
// Agent Types
// ============================================
export type {
  AgentIntegrationResult
} from './agents/sdd-agents';

export interface AgentMetadata {
  name: string;
  description: string;
  mode: 'subagent' | 'tool';
  promptFile: string;
  category?: 'spec' | 'plan' | 'tasks' | 'build' | 'review' | 'validate' | 'utility';
}

// ============================================
// Utility Types
// ============================================
export type {
  ParsedTask,
  ParallelGroup,
  ExecutionWave
} from './utils/tasks-parser';

export type {
  SubFeatureMeta
} from './utils/subfeature-manager';
```

**验收标准**:
- [ ] 所有公共类型可从 `src/types` 导入
- [ ] TypeScript 严格模式编译通过
- [ ] 无循环依赖
- [ ] JSDoc 注释完整

---

#### 3.1.2 `src/errors.ts` - 统一错误处理

**文件路径**: `src/errors.ts`

**代码设计**:

```typescript
// 错误码枚举
export enum ErrorCode {
  // State Errors (1000-1999)
  STATE_NOT_FOUND = 'STATE_1001',
  STATE_INVALID_TRANSITION = 'STATE_1002',
  STATE_FILE_MISSING = 'STATE_1003',
  STATE_DEPENDENCY_BLOCKED = 'STATE_1004',
  
  // Discovery Errors (2000-2999)
  DISCOVERY_STEP_FAILED = 'DISCOVERY_2001',
  DISCOVERY_TIMEOUT = 'DISCOVERY_2002',
  DISCOVERY_INVALID_CONTEXT = 'DISCOVERY_2003',
  
  // Tool Errors (3000-3999)
  TOOL_NOT_FOUND = 'TOOL_3001',
  TOOL_EXECUTION_FAILED = 'TOOL_3002',
  TOOL_VALIDATION_ERROR = 'TOOL_3003',
  
  // Agent Errors (4000-4999)
  AGENT_NOT_FOUND = 'AGENT_4001',
  AGENT_REGISTRATION_FAILED = 'AGENT_4002',
  AGENT_EXECUTION_FAILED = 'AGENT_4004',
  
  // General Errors (5000-5999)
  FILE_NOT_FOUND = 'FILE_5001',
  INVALID_ARGUMENT = 'ARGUMENT_5002',
  INTERNAL_ERROR = 'INTERNAL_5003'
}

// 错误上下文接口
export interface ErrorContext {
  featureId?: string;
  filePath?: string;
  agentName?: string;
  stepId?: string;
  [key: string]: unknown;
}

// 统一错误基类
export class SddError extends Error {
  constructor(
    message: string,
    public readonly code: ErrorCode,
    public readonly context?: ErrorContext,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'SddError';
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      context: this.context,
      cause: this.cause?.message
    };
  }
}

// State 错误
export class StateError extends SddError {
  constructor(message: string, code: ErrorCode, context?: ErrorContext, cause?: Error) {
    super(message, code, context, cause);
    this.name = 'StateError';
  }
}

// Discovery 错误
export class DiscoveryError extends SddError {
  constructor(message: string, code: ErrorCode, context?: ErrorContext, cause?: Error) {
    super(message, code, context, cause);
    this.name = 'DiscoveryError';
  }
}

// Tool 错误
export class ToolError extends SddError {
  constructor(message: string, code: ErrorCode, context?: ErrorContext, cause?: Error) {
    super(message, code, context, cause);
    this.name = 'ToolError';
  }
}

// Agent 错误
export class AgentError extends SddError {
  constructor(message: string, code: ErrorCode, context?: ErrorContext, cause?: Error) {
    super(message, code, context, cause);
    this.name = 'AgentError';
  }
}

// 错误处理工具函数
export function handleError(error: unknown, context?: ErrorContext): SddError {
  if (error instanceof SddError) {
    return error;
  }
  
  if (error instanceof Error) {
    return new SddError(
      error.message,
      ErrorCode.INTERNAL_ERROR,
      context,
      error
    );
  }
  
  return new SddError(
    String(error),
    ErrorCode.INTERNAL_ERROR,
    context
  );
}

export function formatErrorMessage(error: SddError): string {
  return `[${error.code}] ${error.name}: ${error.message}`;
}

export function logError(error: SddError, level: 'info' | 'warn' | 'error' = 'error'): void {
  const message = formatErrorMessage(error);
  console[level](message);
}
```

**验收标准**:
- [ ] 所有错误类型继承自 `SddError`
- [ ] 错误码按模块分类
- [ ] 提供统一的错误处理函数
- [ ] 支持错误上下文传递

---

#### 3.1.3 `src/utils/index.ts` - 工具函数统一导出

**文件路径**: `src/utils/index.ts`

**代码设计**:

```typescript
// ============================================
// Tasks Parser
// ============================================
export {
  parseTasksMarkdown,
  parseParallelGroups,
  computeExecutionOrder,
  detectTaskCircularDependency,
  getReadyTasks,
  areDependenciesSatisfied,
  parseTask
} from './tasks-parser';

export type {
  ParsedTask,
  ParallelGroup,
  ExecutionWave
} from './tasks-parser';

// ============================================
// SubFeature Manager
// ============================================
export {
  detectFeatureMode,
  createSubFeature,
  generateSubFeatureIndex,
  scanSubFeatures,
  validateSubFeatureCompleteness
} from './subfeature-manager';

export type {
  SubFeatureMeta
} from './subfeature-manager';

// ============================================
// README Generator
// ============================================
export {
  generateReadme,
  generateFeatureReadme,
  generateSubFeatureReadme
} from './readme-generator';

// ============================================
// Dependency Notifier
// ============================================
export {
  notifyDependencyChange,
  getDependentFeatures
} from './dependency-notifier';
```

**验收标准**:
- [ ] 所有工具函数可从 `src/utils` 导入
- [ ] 类型导出完整
- [ ] 编译无错误

---

#### 3.1.4 `src/agents/registry.ts` - Agent 注册表

**文件路径**: `src/agents/registry.ts`

**代码设计**:

```typescript
import type { AgentMetadata } from '../types';

export interface AgentConfig {
  name: string;
  description: string;
  mode: 'subagent' | 'tool';
  promptFile: string;
  category?: 'spec' | 'plan' | 'tasks' | 'build' | 'review' | 'validate' | 'utility';
}

export interface RegisteredAgent extends AgentMetadata {
  registeredAt: string;
  source: 'static' | 'dynamic';
}

export class AgentRegistry {
  private agents: Map<string, RegisteredAgent> = new Map();

  /**
   * 注册单个 Agent
   */
  register(agent: AgentMetadata, source: 'static' | 'dynamic' = 'static'): void {
    if (this.agents.has(agent.name)) {
      console.warn(`Agent 已存在：${agent.name}，将被覆盖`);
    }

    this.agents.set(agent.name, {
      ...agent,
      registeredAt: new Date().toISOString(),
      source
    });
  }

  /**
   * 批量注册 Agents
   */
  registerMany(agents: AgentMetadata[], source?: 'static' | 'dynamic'): void {
    for (const agent of agents) {
      this.register(agent, source);
    }
  }

  /**
   * 获取单个 Agent
   */
  get(name: string): RegisteredAgent | undefined {
    return this.agents.get(name);
  }

  /**
   * 获取所有 Agents
   */
  getAll(): RegisteredAgent[] {
    return Array.from(this.agents.values());
  }

  /**
   * 按阶段过滤 Agents
   */
  getByCategory(category: AgentMetadata['category']): RegisteredAgent[] {
    if (!category) return this.getAll();
    return this.getAll().filter(agent => agent.category === category);
  }

  /**
   * 检查 Agent 是否存在
   */
  has(name: string): boolean {
    return this.agents.has(name);
  }

  /**
   * 注销 Agent
   */
  unregister(name: string): boolean {
    return this.agents.delete(name);
  }

  /**
   * 清除所有 Agents
   */
  clear(): void {
    this.agents.clear();
  }

  /**
   * 从插件目录动态加载 Agents
   * 
   * 目录来源:
   * - 源码目录：`src/templates/agents/`（开发时）
   * - 构建输出：`dist/templates/agents/`（构建后）
   * - 用户项目：`.opencode/plugins/sdd/agents/`（安装后）
   */
  async loadFromDirectory(dirPath: string): Promise<number> {
    const fs = await import('fs/promises');
    const path = await import('path');

    let count = 0;

    try {
      const files = await fs.readdir(dirPath);
      const mdFiles = files.filter(f => f.endsWith('.md') || f.endsWith('.md.hbs'));

      for (const file of mdFiles) {
        const agentName = file.replace('.md.hbs', '').replace('.md', '');
        const metadata: AgentMetadata = {
          name: `sdd-${agentName}`,
          description: `SDD ${agentName} Agent`,
          mode: 'subagent',
          promptFile: path.join(dirPath, file),
          category: this.inferCategory(agentName)
        };

        this.register(metadata, 'dynamic');
        count++;
      }
    } catch (error) {
      console.error('加载 Agents 失败:', error);
    }

    return count;
  }

  /**
   * 根据名称推断类别
   */
  private inferCategory(name: string): AgentMetadata['category'] {
    const categoryMap: Record<string, AgentMetadata['category']> = {
      'spec': 'spec',
      '1-spec': 'spec',
      'plan': 'plan',
      '2-plan': 'plan',
      'tasks': 'tasks',
      '3-tasks': 'tasks',
      'build': 'build',
      '4-build': 'build',
      'review': 'review',
      '5-review': 'review',
      'validate': 'validate',
      '6-validate': 'validate',
      'roadmap': 'utility',
      'docs': 'utility',
      'help': 'utility',
      'sdd': 'utility',
      'discovery': 'utility'
    };

    return categoryMap[name] || 'utility';
  }
}

// 单例实例
export const agentRegistry = new AgentRegistry();
```

**验收标准**:
- [ ] 支持静态注册
- [ ] 支持动态加载
- [ ] 支持按类别过滤
- [ ] 单例模式正确实现

---

#### 3.1.5 `scripts/package.cjs` - 打包脚本

**文件路径**: `scripts/package.cjs`

**代码设计**:

```javascript
// scripts/package.cjs
const fs = require('fs-extra');
const archiver = require('archiver');
const path = require('path');

const DIST_DIR = path.join(__dirname, '..', 'dist');
const SDD_DIR = path.join(DIST_DIR, 'sdd');
const ZIP_FILE = path.join(DIST_DIR, 'sdd.zip');

async function package() {
  console.log('📦 Starting package process...');
  
  // 1. 清理 dist/sdd/
  await fs.remove(SDD_DIR);
  await fs.mkdirp(SDD_DIR);
  console.log('✅ Cleaned dist/sdd/');
  
  // 2. 复制文件（排除 templates/ 和 sdd/）
  const items = await fs.readdir(DIST_DIR);
  for (const item of items) {
    if (item !== 'templates' && item !== 'sdd' && item !== 'sdd.zip') {
      await fs.copy(
        path.join(DIST_DIR, item),
        path.join(SDD_DIR, item)
      );
    }
  }
  console.log('✅ Copied core files');
  
  // 3. 复制 agents (从 templates/agents/)
  const templatesAgentsDir = path.join(DIST_DIR, 'templates', 'agents');
  const sddAgentsDir = path.join(SDD_DIR, 'agents');
  
  if (await fs.pathExists(templatesAgentsDir)) {
    await fs.copy(templatesAgentsDir, sddAgentsDir);
    console.log('✅ Copied agents to dist/sdd/agents/');
  } else {
    console.warn('⚠️  templates/agents/ not found, skipping');
  }
  
  // 4. 复制 package.json
  await fs.copy(
    path.join(__dirname, '..', 'package.json'),
    path.join(SDD_DIR, 'package.json')
  );
  console.log('✅ Copied package.json');
  
  // 5. 打包 zip
  await createZip(SDD_DIR, ZIP_FILE);
  console.log('✅ Created sdd.zip');
  
  // 6. 输出统计
  const stats = await fs.stat(ZIP_FILE);
  console.log(`📊 Package complete: ${ZIP_FILE} (${(stats.size / 1024).toFixed(2)} KB)`);
}

async function createZip(source, dest) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(dest);
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    output.on('close', resolve);
    archive.on('error', reject);
    archive.pipe(output);
    archive.directory(source, 'sdd');
    archive.finalize();
  });
}

package().catch((error) => {
  console.error('❌ Package failed:', error);
  process.exit(1);
});
```

**验收标准**:
- [ ] 生成 `dist/sdd/` 目录
- [ ] 生成 `dist/sdd.zip` 文件
- [ ] 包含完整插件包
- [ ] 错误处理完善

---

### 3.2 修改文件设计

#### 3.2.1 `src/agents/sdd-agents.ts` 修改

**修改点**:
1. 引入 `AgentRegistry`
2. 使用注册表管理静态 Agents
3. 支持从插件目录动态加载

**修改后代码片段**:

```typescript
import { agentRegistry } from './registry';
import type { AgentMetadata } from '../types';

export async function registerAgents(context: any) {
  // 定义静态 Agents（向后兼容）
  const staticAgents: AgentMetadata[] = [
    {
      name: 'sdd',
      description: 'SDD 工作流智能入口 - 自动路由到正确阶段',
      mode: 'subagent',
      promptFile: '.opencode/plugins/sdd/agents/sdd.md',
      category: 'utility'
    },
    {
      name: 'sdd-spec',
      description: 'SDD 规范编写专家 (阶段 1/6)',
      mode: 'subagent',
      promptFile: '.opencode/plugins/sdd/agents/spec.md',
      category: 'spec'
    },
    // ... 其他 Agents
  ];

  // 注册静态 Agents
  agentRegistry.registerMany(staticAgents, 'static');

  // 动态加载插件目录下的 Agents
  const pluginsDir = path.join(context.directory, '.opencode', 'plugins', 'sdd', 'agents');
  const loadedCount = await agentRegistry.loadFromDirectory(pluginsDir);
  
  console.log(`✅ 已注册 ${agentRegistry.getAll().length} 个 SDD Agents (${loadedCount} 动态加载)`);

  return {
    agents: agentRegistry.getAll(),
    updateStateForAgentCall: createUpdateStateFunction()
  };
}
```

---

#### 3.2.2 `src/discovery/workflow-engine.ts` 修改

**修改点**:
1. 增加 `autoUpdateState` 配置选项
2. Discovery 完成后自动更新状态（可选）
3. 增加状态回滚机制

**修改后代码片段**:

```typescript
export interface DiscoveryConfig {
  /** 是否在 Discovery 完成后自动更新状态（默认 false） */
  autoUpdateState?: boolean;
}

export class DiscoveryWorkflowEngine {
  private config: DiscoveryConfig;
  
  constructor(private stateMachine?: StateMachine, config?: DiscoveryConfig) {
    this.coachingModeEngine = new CoachingModeEngine();
    this.config = { autoUpdateState: false, ...config };
  }

  async execute(context: DiscoveryContext): Promise<DiscoveryContext> {
    const originalState = await this.saveCurrentState(context.featureId);
    
    try {
      // ... 执行步骤逻辑 ...
      
      // Discovery 完成后自动更新状态（可选）
      if (this.config.autoUpdateState && this.stateMachine && context.featureId) {
        await this.stateMachine.updateState(
          context.featureId,
          'specified',
          {},
          'discovery-workflow',
          'Discovery 工作流完成，自动生成 discovery.md'
        );
      }
      
      return context;
    } catch (error) {
      // 失败时回滚状态
      await this.rollbackState(originalState);
      throw error;
    }
  }
}
```

---

#### 3.2.3 `src/index.ts` 修改

**修改点**:
1. 使用统一类型导出
2. 使用统一错误处理
3. 使用统一工具函数

**修改后导入**:

```typescript
// 使用统一类型导出
import type {
  WorkflowStatus,
  PhaseHistory,
  DiscoveryContext,
  CoachingLevel
} from './types';

// 使用统一错误处理
import { SddError, ErrorCode, handleError } from './errors';

// 使用统一工具函数
import {
  parseTasksMarkdown,
  detectFeatureMode,
  generateReadme
} from './utils';

// Agent 注册
import { registerAgents } from './agents/sdd-agents';
```

---

#### 3.2.4 `install.sh` 修改

**修改点**:
1. 支持从 `dist/sdd/` 复制
2. 支持解压 `dist/sdd.zip`
3. 降级兼容 `dist/`

**修改后代码片段**:

```bash
# 优先使用打包后的插件包
if [ -f "$SCRIPT_DIR/dist/sdd.zip" ]; then
    echo "📦 解压插件包：dist/sdd.zip"
    unzip -o "$SCRIPT_DIR/dist/sdd.zip" -d "$TARGET_DIR/.opencode/plugins/"
elif [ -d "$SCRIPT_DIR/dist/sdd" ]; then
    echo "📦 使用打包后的插件包：dist/sdd/"
    cp -r "$SCRIPT_DIR/dist/sdd/"* "$PLUGIN_DEST/"
else
    echo "⚠️  未找到打包目录，使用降级模式：dist/"
    cp -r "$SCRIPT_DIR/dist/"* "$PLUGIN_DEST/"
fi
```

---

#### 3.2.5 `install.ps1` 修改

**修改点**: 同 `install.sh`，适配 PowerShell 语法

---

### 3.3 文件影响分析

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/types.ts` | NEW | 统一类型出口 |
| `src/errors.ts` | NEW | 统一错误处理 |
| `src/utils/index.ts` | NEW | 工具函数统一导出 |
| `src/agents/registry.ts` | NEW | Agent 注册表 |
| `scripts/package.cjs` | NEW | 打包脚本 |
| `src/agents/sdd-agents.ts` | MODIFY | 使用 AgentRegistry |
| `src/discovery/workflow-engine.ts` | MODIFY | 增加状态联动 |
| `src/index.ts` | MODIFY | 使用统一导出 |
| `install.sh` | MODIFY | 适配新结构 |
| `install.ps1` | MODIFY | 适配新结构 |
| `package.json` | MODIFY | 添加打包脚本和依赖 |

---

## 4. 风险评估

### 4.1 技术风险

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 循环依赖 | 中 | 高 | 使用 `src/types.ts` 作为唯一出口，避免交叉导入 |
| 类型导出遗漏 | 低 | 中 | 编写类型导出测试，验证所有公共类型可导入 |
| 动态加载失败 | 中 | 中 | 静默跳过，不影响静态 Agent 注册 |
| 打包脚本错误 | 低 | 中 | 添加详细日志，提供降级模式 |

### 4.2 兼容性风险

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 旧导入路径失效 | 低 | 高 | 保持旧文件不变，仅新增导出层 |
| Agent prompt 路径变更 | 中 | 中 | 提供迁移指南，安装脚本自动处理 |
| 用户自定义 Agent 冲突 | 低 | 中 | 静态注册优先级高于动态加载 |

### 4.3 性能风险

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 启动时间增加 | 低 | 低 | 基准测试，确保增加 < 50ms |
| 动态加载延迟 | 中 | 低 | 异步加载，不阻塞主流程 |
| 内存占用增加 | 低 | 低 | 单例模式，避免重复实例化 |

### 4.4 时间风险

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 任务量估计不足 | 中 | 中 | 分 3 个阶段交付，每阶段可独立验收 |
| 依赖冲突 | 低 | 中 | 提前检查 `package.json` 依赖 |
| 测试时间不足 | 中 | 中 | 优先测试关键路径，回归测试自动化 |

---

## 5. 测试计划

### 5.1 单元测试覆盖范围

| 模块 | 测试文件 | 覆盖重点 |
|------|----------|----------|
| `src/types.ts` | N/A | 类型导出验证（编译时） |
| `src/errors.ts` | `src/errors.test.ts` | 错误类实例化、序列化、格式化 |
| `src/utils/index.ts` | N/A | 导出验证（编译时） |
| `src/agents/registry.ts` | `src/agents/registry.test.ts` | 注册、查询、过滤、动态加载 |
| `scripts/package.cjs` | N/A | 手动测试打包结果 |

### 5.2 集成测试场景

| 场景 | 测试步骤 | 预期结果 |
|------|----------|----------|
| 统一类型导入 | 从 `src/types` 导入所有类型 | 编译通过，无类型错误 |
| 统一错误处理 | 各模块抛出统一错误类型 | 错误可被统一捕获和处理 |
| Agent 动态加载 | 插件目录下新增 Agent prompt | 启动时自动注册新 Agent |
| Discovery 状态联动 | 执行 Discovery 完成 | 状态自动更新为 `specified`（配置开启时） |
| 打包脚本 | 运行 `npm run package` | 生成 `dist/sdd/` 和 `dist/sdd.zip` |
| 安装脚本 | 运行 `./install.sh` | 正确复制插件到 `.opencode/plugins/sdd/` |

### 5.3 回归测试重点

| 功能 | 测试点 | 验收标准 |
|------|--------|----------|
| 现有 Agent 调用 | 调用 `@sdd-spec` | 正常工作，prompt 加载成功 |
| 状态机 | 状态转换 | 所有状态转换正常 |
| AutoUpdater | 文件变更检测 | 自动更新状态正常 |
| Discovery | 7 步流程 | 流程执行完整 |

---

## 6. 里程碑

### 阶段 1: 统一导出层（预计 4 小时）

**目标**: 创建统一类型、错误、工具导出层

**任务**:
- [ ] 创建 `src/types.ts`
- [ ] 创建 `src/errors.ts`
- [ ] 创建 `src/utils/index.ts`
- [ ] 更新 `src/index.ts` 使用新导出
- [ ] 编译验证

**验收标准**:
- TypeScript 编译通过
- 所有类型可从 `src/types` 导入
- 所有错误类可用
- 所有工具函数可从 `src/utils` 导入

---

### 阶段 2: Agent 注册优化（预计 5 小时）

**目标**: 实现动态 Agent 注册机制

**任务**:
- [ ] 创建 `src/agents/registry.ts`
- [ ] 修改 `src/agents/sdd-agents.ts` 使用注册表
- [ ] 支持从插件目录动态加载
- [ ] 更新 prompt 路径为 `.opencode/plugins/sdd/agents/`
- [ ] 编写单元测试

**验收标准**:
- 静态 Agents 注册正常
- 动态加载 Agents 正常
- 按类别过滤正常
- 单元测试通过

---

### 阶段 3: 集成与打包（预计 3 小时）

**目标**: 完成 Discovery 集成和打包脚本

**任务**:
- [ ] 修改 `src/discovery/workflow-engine.ts` 增加状态联动
- [ ] 创建 `scripts/package.cjs`
- [ ] 修改 `install.sh` 适配新结构
- [ ] 修改 `install.ps1` 适配新结构
- [ ] 更新 `package.json` 添加脚本和依赖

**验收标准**:
- Discovery 完成后可选状态更新
- 打包脚本生成 `dist/sdd/` 和 `dist/sdd.zip`
- 安装脚本正确复制插件
- 端到端测试通过

---

## 7. ADR (架构决策记录)

### ADR-011: 统一类型导出架构

**状态**: PROPOSED

**背景**: 类型定义分散在多个文件中，导致导入路径复杂，存在循环依赖风险。

**决策**: 创建 `src/types.ts` 作为统一类型出口，所有公共类型从该文件 re-export。

**后果**:
- ✅ 简化导入路径
- ✅ 减少循环依赖风险
- ⚠️ 需要维护 re-export 列表

---

### ADR-012: 统一错误处理体系

**状态**: PROPOSED

**背景**: 各模块使用不同的错误处理方式，难以统一处理和日志记录。

**决策**: 创建 `src/errors.ts` 定义统一错误基类和错误码枚举，所有模块使用统一错误类型。

**后果**:
- ✅ 统一错误处理逻辑
- ✅ 一致的日志格式
- ⚠️ 需要迁移现有错误处理代码

---

### ADR-013: Agent 动态注册机制

**状态**: PROPOSED

**背景**: Agent 列表硬编码在 `sdd-agents.ts` 中，添加新 Agent 需要修改核心代码。

**决策**: 实现 `AgentRegistry` 类支持静态注册和动态加载，Agent prompt 放在插件目录内。

**后果**:
- ✅ 支持插件化扩展
- ✅ 无需修改核心代码添加新 Agent
- ⚠️ 需要维护注册表逻辑
- ⚠️ 动态加载可能失败（静默跳过）

---

### ADR-014: 打包分发结构优化

**状态**: PROPOSED

**背景**: 安装时需要分别复制多个目录，逻辑复杂，缺乏原子性保证。

**决策**: 创建打包脚本生成 `dist/sdd/` 目录和 `dist/sdd.zip` 文件，安装时优先使用打包结果。

**后果**:
- ✅ 简化安装逻辑
- ✅ 原子性保证
- ✅ 便于分发
- ⚠️ 增加构建步骤
- ⚠️ 需要新依赖 (`fs-extra`, `archiver`)

---

## 8. 下一步

👉 运行 `@sdd-tasks specs-tree-sdd-tools-optimization` 开始任务分解

---

## 附录

### A. 迁移指南

#### A.1 类型导入迁移

**旧方式**:
```typescript
import { FeatureStateEnum } from './state/machine';
import { DiscoveryContext } from './discovery/types';
```

**新方式**:
```typescript
import type { FeatureStateEnum, DiscoveryContext } from './types';
```

#### A.2 错误处理迁移

**旧方式**:
```typescript
throw new Error('State not found');
```

**新方式**:
```typescript
import { StateError, ErrorCode } from './errors';
throw new StateError('State not found', ErrorCode.STATE_NOT_FOUND);
```

#### A.3 工具函数迁移

**旧方式**:
```typescript
import { parseTasksMarkdown } from './utils/tasks-parser';
```

**新方式**:
```typescript
import { parseTasksMarkdown } from './utils';
```

---

### B. 命令参考

```bash
# 构建
npm run build

# 打包
npm run package

# 安装到本地项目
./install.sh [项目根目录]

# 运行测试
npm test
```

---

### C. 相关文件

| 文件 | 说明 |
|------|------|
| `.sdd/specs-tree-root/specs-tree-sdd-tools-optimization/spec.md` | Feature Specification |
| `.sdd/specs-tree-root/specs-tree-sdd-tools-optimization/plan.md` | 本文档 |
| `.sdd/specs-tree-root/architecture/adr/ADR-011.md` | 统一类型导出架构 |
| `.sdd/specs-tree-root/architecture/adr/ADR-012.md` | 统一错误处理体系 |
| `.sdd/specs-tree-root/architecture/adr/ADR-013.md` | Agent 动态注册机制 |
| `.sdd/specs-tree-root/architecture/adr/ADR-014.md` | 打包分发结构优化 |
