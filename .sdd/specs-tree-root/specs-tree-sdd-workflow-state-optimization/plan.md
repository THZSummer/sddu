# SDD 工作流状态优化 - 技术规划

| 元数据 | 值 |
|--------|-----|
| **Feature ID** | FR-SDD-004 |
| **Feature 名称** | SDD 工作流状态优化 |
| **版本** | 1.0.0 |
| **规划日期** | 2026-04-02 |
| **作者** | SDD Team |
| **状态** | planned |
| **Phase** | 2 |

---

## 1. 技术架构

### 1.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SDD 状态管理系统架构                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐       │
│  │   @sdd-spec     │     │   @sdd-plan     │     │   @sdd-tasks    │       │
│  │   Agent         │     │   Agent         │     │   Agent         │       │
│  └────────┬────────┘     └────────┬────────┘     └────────┬────────┘       │
│           │                       │                       │                 │
│           └───────────────────────┼───────────────────────┘                 │
│                                   │                                         │
│                          ┌────────▼────────┐                                │
│                          │  State Manager  │                                │
│                          │  (状态管理器)    │                                │
│                          └────────┬────────┘                                │
│                                   │                                         │
│          ┌────────────────────────┼────────────────────────┐                │
│          │                        │                        │                │
│          ▼                        ▼                        ▼                │
│  ┌───────────────┐      ┌─────────────────┐      ┌───────────────┐         │
│  │ State Machine │      │ State Migrator  │      │   Aggregator  │         │
│  │ (状态机)      │      │ (迁移器)        │      │ (聚合器)      │         │
│  └───────┬───────┘      └────────┬────────┘      └───────┬───────┘         │
│          │                       │                       │                 │
│          └───────────────────────┼───────────────────────┘                 │
│                                  │                                          │
│                         ┌────────▼────────┐                                 │
│                         │  Schema v1.3.0  │                                 │
│                         │  (状态 Schema)   │                                 │
│                         └────────┬────────┘                                 │
│                                  │                                          │
│          ┌───────────────────────┼───────────────────────┐                  │
│          │                       │                       │                  │
│          ▼                       ▼                       ▼                  │
│  ┌───────────────┐       ┌───────────────┐       ┌───────────────┐         │
│  │ specs-tree-   │       │ specs-tree-   │       │ specs-tree-   │         │
│  │ feature-a/    │       │ feature-b/    │       │ feature-a/    │         │
│  │  state.json   │       │  state.json   │       │  specs-tree-  │         │
│  │  (分布式)     │       │  (分布式)     │       │  sub-c/       │         │
│  │               │       │               │       │   state.json  │         │
│  └───────────────┘       └───────────────┘       └───────────────┘         │
│          │                       │                       │                  │
│          └───────────────────────┴───────────────────────┘                  │
│                                  │                                          │
│                         ┌────────▼────────┐                                 │
│                         │  File Lock      │                                 │
│                         │  (文件锁机制)    │                                 │
│                         └─────────────────┘                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 核心组件说明

| 组件 | 职责 | 文件位置 |
|------|------|----------|
| **State Manager** | 状态管理核心，协调各子组件 | `src/state/manager.ts` |
| **State Machine** | 状态转换验证、状态流转规则 | `src/state/machine.ts` (重构) |
| **State Migrator** | 从集中式迁移到分布式状态 | `src/state/migrator.ts` (增强) |
| **Aggregator** | 递归扫描、状态聚合查询 | `src/state/aggregator.ts` (新增) |
| **Schema v1.3.0** | 新状态数据结构定义 | `src/state/schema-v1.3.0.ts` (新增) |
| **File Lock** | 并发控制、文件锁机制 | `src/utils/file-lock.ts` (新增) |

### 1.3 数据流

```
状态更新流程:
┌──────────┐    ┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌────────────┐
│  Agent   │───►│   Manager   │───►│   Machine    │───►│   Schema    │───►│ state.json │
│ (触发器)  │    │ (协调器)    │    │ (验证器)     │    │ (校验器)    │    │ (持久化)   │
└──────────┘    └─────────────┘    └──────────────┘    └─────────────┘    └────────────┘
                      │                                        │
                      ▼                                        ▼
               ┌─────────────┐                         ┌─────────────┐
               │    Lock     │                         │   History   │
               │ (并发控制)   │                         │ (历史记录)  │
               └─────────────┘                         └─────────────┘

状态查询流程:
┌──────────┐    ┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│  Query   │───►│  Aggregator │───►│  Recursive   │───►│   Result    │
│ (请求)   │    │  (聚合器)   │    │   Scanner    │    │  (聚合结果) │
└──────────┘    └─────────────┘    └──────────────┘    └─────────────┘
                                      │
                                      ▼
                               ┌─────────────┐
                               │ state.json  │
                               │ (分布式扫描) │
                               └─────────────┘
```

---

## 2. 数据结构设计

### 2.1 state.json Schema (v1.3.0)

```typescript
// src/state/schema-v1.3.0.ts

/**
 * 状态枚举 - 6 个标准工作流状态
 */
export type WorkflowStatus = 
  | 'specified'   // 规范中 (Phase 1)
  | 'planned'     // 规划中 (Phase 2)
  | 'tasked'      // 任务中 (Phase 3)
  | 'building'    // 构建中 (Phase 4)
  | 'reviewed'    // 评审中 (Phase 5)
  | 'validated';  // 已验证 (Phase 6)

/**
 * 状态变更历史记录
 */
export interface StatusHistory {
  timestamp: string;      // ISO 8601 时间戳
  from: WorkflowStatus | 'initial';  // 原状态
  to: WorkflowStatus;     // 新状态
  triggeredBy: string;    // 触发源 (如 @sdd-spec)
  actor?: string;         // 执行者 (Agent 名称)
  comment?: string;       // 变更说明
}

/**
 * 依赖关系
 */
export interface Dependencies {
  on: string[];      // 依赖的 Feature ID 列表
  blocking: string[]; // 被本 Feature 阻塞的 Feature ID 列表
}

/**
 * 文件引用
 */
export interface FileReferences {
  spec: string;
  plan: string;
  tasks: string;
  readme?: string;
}

/**
 * 嵌套层级信息
 */
export interface HierarchyInfo {
  level: number;           // 当前层级 (1, 2, 3...)
  parent: string | null;   // 父 Feature ID (根节点为 null)
  children: string[];      // 子 Feature ID 列表
}

/**
 * State Schema v1.3.0 - 分布式状态定义
 */
export interface StateV1_3_0 {
  // 基础信息
  feature: string;                    // Feature ID (目录名去掉 specs-tree-前缀)
  name: string;                       // Feature 名称
  version: '1.3.0';                   // Schema 版本
  
  // 状态信息
  status: WorkflowStatus;             // 当前状态
  phase: number;                      // 当前阶段 (1-6)
  
  // 层级信息
  level: number;                      // 嵌套层级
  parent: string | null;              // 父 Feature ID
  
  // 文件引用
  files: FileReferences;              // 文档文件引用
  
  // 依赖关系
  dependencies: Dependencies;         // 依赖关系
  
  // 历史记录
  history: StatusHistory[];           // 状态变更历史
  
  // 时间戳
  createdAt: string;                  // 创建时间
  updatedAt: string;                  // 最后更新时间
}
```

### 2.2 聚合查询结果结构

```typescript
// src/state/aggregator.ts

/**
 * 状态分布统计
 */
export interface StatusDistribution {
  specified: number;
  planned: number;
  tasked: number;
  building: number;
  reviewed: number;
  validated: number;
}

/**
 * 层级分布统计
 */
export interface LevelDistribution {
  [level: number]: number;  // 层级 -> 数量
}

/**
 * 阻塞 Feature 信息
 */
export interface BlockedFeature {
  feature: string;                    // Feature ID
  status: WorkflowStatus;             // 当前状态
  blockedBy: string[];                // 阻塞它的 Feature ID 列表
  reason: string;                     // 阻塞原因
}

/**
 * 聚合查询结果
 */
export interface AggregationResult {
  summary: {
    totalSpecs: number;                      // 总 specs 数量
    byStatus: StatusDistribution;            // 按状态分布
    byPhase: { [phase: number]: number };    // 按阶段分布
    byLevel: LevelDistribution;              // 按层级分布
  };
  progress: {
    overallPercentage: number;               // 整体进度百分比
    phaseProgress: Array<{
      phase: number;
      percentage: number;
    }>;
  };
  blocked: BlockedFeature[];                 // 阻塞 specs 列表
  scanInfo: {
    depth: number;                           // 扫描深度
    warnings: string[];                      // 扫描警告
    skipped: string[];                       // 跳过的目录
  };
}
```

### 2.3 目录结构

```
.sdd/
├── specs-tree-root/                    # specs 根目录
│   ├── spec.md                         # 根规格说明
│   ├── plan.md                         # 根技术计划
│   ├── tasks.md                        # 根任务分解
│   ├── state.json                      # 根状态文件
│   │
│   ├── architecture/                   # 架构目录
│   │   └── adr/                        # 架构决策记录
│   │       ├── ADR-001.md              # 分布式状态存储方案
│   │       └── ADR-002.md              # 状态 Schema v1.3.0
│   │
│   ├── specs-tree-sdd-workflow-state-optimization/
│   │   ├── spec.md
│   │   ├── plan.md
│   │   ├── tasks.md
│   │   └── state.json
│   │
│   └── specs-tree-feature-x/
│       ├── spec.md
│       ├── plan.md
│       ├── tasks.md
│       ├── state.json
│       └── specs-tree-sub-feature/     # 二级嵌套
│           ├── spec.md
│           ├── plan.md
│           ├── tasks.md
│           └── state.json
```

---

## 3. 接口设计

### 3.1 状态更新接口

```typescript
// src/state/manager.ts

interface StateUpdateOptions {
  triggeredBy: string;    // 触发源 (如 @sdd-spec)
  actor?: string;         // 执行者
  comment?: string;       // 变更说明
  skipValidation?: boolean; // 跳过验证 (仅用于迁移)
}

interface StateUpdateResult {
  success: boolean;
  previousStatus: WorkflowStatus;
  newStatus: WorkflowStatus;
  timestamp: string;
  error?: string;
}

class StateManager {
  /**
   * 更新 Feature 状态
   * @param featureId Feature ID
   * @param newStatus 新状态
   * @param options 更新选项
   */
  async updateStatus(
    featureId: string,
    newStatus: WorkflowStatus,
    options: StateUpdateOptions
  ): Promise<StateUpdateResult>;

  /**
   * 批量更新状态 (用于迁移)
   */
  async bulkUpdateStatus(
    updates: Array<{
      featureId: string;
      newStatus: WorkflowStatus;
    }>
  ): Promise<Array<StateUpdateResult>>;
}
```

### 3.2 状态查询接口

```typescript
// src/state/manager.ts

interface StateQueryOptions {
  status?: WorkflowStatus;      // 按状态过滤
  phase?: number;               // 按阶段过滤
  level?: number;               // 按层级过滤
  parent?: string | null;       // 按父节点过滤
}

class StateManager {
  /**
   * 查询单个 Feature 状态
   */
  async getStatus(featureId: string): Promise<StateV1_3_0 | null>;

  /**
   * 查询所有 Feature 状态
   */
  async getAllStatus(options?: StateQueryOptions): Promise<StateV1_3_0[]>;

  /**
   * 查询状态历史
   */
  async getStatusHistory(featureId: string, limit?: number): Promise<StatusHistory[]>;
}
```

### 3.3 聚合查询接口

```typescript
// src/state/aggregator.ts

interface AggregationOptions {
  maxDepth?: number;           // 最大递归深度 (默认 10)
  skipSymlinks?: boolean;      // 跳过符号链接 (默认 true)
  includeLevel?: number[];     // 包含的层级 (默认全部)
  timeout?: number;            // 超时时间 ms (默认 2000)
}

class StateAggregator {
  /**
   * 聚合查询所有 specs 状态
   */
  async aggregate(rootDir: string, options?: AggregationOptions): Promise<AggregationResult>;

  /**
   * 查询依赖链
   */
  async getDependencyChain(featureId: string): Promise<string[]>;

  /**
   * 检测循环依赖
   */
  async detectCircularDependencies(): Promise<string[][]>;

  /**
   * 查询阻塞 specs 列表
   */
  async getBlockedSpecs(): Promise<BlockedFeature[]>;
}
```

### 3.4 依赖检查接口

```typescript
// src/state/dependency-checker.ts

interface DependencyCheckResult {
  valid: boolean;
  missingDependencies: Array<{
    featureId: string;
    requiredStatus: WorkflowStatus;
    currentStatus: WorkflowStatus;
  }>;
  circularDependencies: string[][];
}

class DependencyChecker {
  /**
   * 检查依赖状态是否就绪
   */
  async checkDependencies(
    featureId: string,
    targetStatus: WorkflowStatus
  ): Promise<DependencyCheckResult>;

  /**
   * 检测循环依赖
   */
  async detectCircular(featureId: string): Promise<string[][]>;
}
```

---

## 4. 算法设计

### 4.1 状态转换验证算法

```typescript
// src/state/machine.ts

/**
 * 状态转换规则矩阵
 */
const TRANSITION_MATRIX: Record<WorkflowStatus, WorkflowStatus[]> = {
  'specified': ['planned', 'initial'],
  'planned': ['tasked', 'specified'],
  'tasked': ['building', 'planned'],
  'building': ['reviewed', 'tasked'],
  'reviewed': ['validated', 'building'],
  'validated': ['reviewed']  // 终态，仅允许回退
};

/**
 * 状态转换验证算法
 * 
 * 时间复杂度: O(1)
 * 空间复杂度: O(1)
 */
function validateTransition(
  currentStatus: WorkflowStatus,
  targetStatus: WorkflowStatus
): { valid: boolean; reason?: string } {
  // 1. 检查目标状态是否在允许列表中
  const allowedTargets = TRANSITION_MATRIX[currentStatus] || [];
  
  if (!allowedTargets.includes(targetStatus)) {
    return {
      valid: false,
      reason: `不允许从 ${currentStatus} 转换到 ${targetStatus}。允许的目标状态：${allowedTargets.join(', ')}`
    };
  }
  
  // 2. 检查是否为跳过状态（单步验证）
  const allStatuses: WorkflowStatus[] = [
    'specified', 'planned', 'tasked', 'building', 'reviewed', 'validated'
  ];
  const currentIndex = allStatuses.indexOf(currentStatus);
  const targetIndex = allStatuses.indexOf(targetStatus);
  
  // 前进时必须是相邻状态
  if (targetIndex > currentIndex && targetIndex - currentIndex > 1) {
    const skippedStatuses = allStatuses.slice(currentIndex + 1, targetIndex);
    return {
      valid: false,
      reason: `不能跳过中间状态：${skippedStatuses.join(', ')}`
    };
  }
  
  return { valid: true };
}
```

### 4.2 递归扫描算法

```typescript
// src/state/aggregator.ts

interface ScanResult {
  states: StateV1_3_0[];
  warnings: string[];
  skipped: string[];
  maxDepth: number;
}

/**
 * 递归扫描算法 - 收集所有 specs 的 state.json
 * 
 * 时间复杂度: O(n), n = specs 目录数量
 * 空间复杂度: O(d), d = 递归深度
 */
async function recursiveScan(
  dir: string,
  currentDepth: number = 0,
  options: AggregationOptions = {}
): Promise<ScanResult> {
  const maxDepth = options.maxDepth || 10;
  const states: StateV1_3_0[] = [];
  const warnings: string[] = [];
  const skipped: string[] = [];
  let maxDepthReached = currentDepth;
  
  // 深度限制检查
  if (currentDepth >= maxDepth) {
    warnings.push(`达到最大递归深度 ${maxDepth}，停止扫描 ${dir}`);
    return { states, warnings, skipped, maxDepthReached };
  }
  
  // 读取目录内容
  const entries = await fs.readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    // 跳过符号链接
    if (entry.isSymbolicLink()) {
      skipped.push(fullPath);
      continue;
    }
    
    // 跳过非目录
    if (!entry.isDirectory()) {
      continue;
    }
    
    // 跳过非 specs-tree-前缀的目录
    if (!entry.name.startsWith('specs-tree-')) {
      continue;
    }
    
    // 检查循环嵌套（通过记录访问路径）
    // 实现细节：维护一个访问路径栈
    
    // 尝试读取 state.json
    const stateFile = path.join(fullPath, 'state.json');
    try {
      const content = await fs.readFile(stateFile, 'utf-8');
      const state = JSON.parse(content);
      
      // Schema 验证
      const validation = validateStateV1_3_0(state);
      if (validation.valid) {
        states.push(state);
      } else {
        warnings.push(`${stateFile} Schema 验证失败：${validation.errors.join(', ')}`);
      }
    } catch (error) {
      // state.json 不存在或解析失败
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        warnings.push(`${stateFile} 不存在，该 specs 可能未完成初始化`);
      } else {
        warnings.push(`${stateFile} 读取失败：${(error as Error).message}`);
      }
    }
    
    // 递归扫描子目录
    const subResult = await recursiveScan(fullPath, currentDepth + 1, options);
    states.push(...subResult.states);
    warnings.push(...subResult.warnings);
    skipped.push(...subResult.skipped);
    maxDepthReached = Math.max(maxDepthReached, subResult.maxDepthReached);
  }
  
  return { states, warnings, skipped, maxDepthReached };
}
```

### 4.3 聚合计算算法

```typescript
// src/state/aggregator.ts

/**
 * 聚合计算算法 - 从扫描结果计算统计数据
 * 
 * 时间复杂度: O(n), n = specs 数量
 * 空间复杂度: O(1)
 */
function computeAggregation(states: StateV1_3_0[]): AggregationResult {
  // 初始化统计
  const byStatus: StatusDistribution = {
    specified: 0, planned: 0, tasked: 0,
    building: 0, reviewed: 0, validated: 0
  };
  const byPhase: { [phase: number]: number } = {};
  const byLevel: LevelDistribution = {};
  
  // 统计各状态/阶段/层级数量
  for (const state of states) {
    byStatus[state.status]++;
    byPhase[state.phase] = (byPhase[state.phase] || 0) + 1;
    byLevel[state.level] = (byLevel[state.level] || 0) + 1;
  }
  
  // 计算整体进度百分比
  const totalSpecs = states.length;
  const phaseWeights = [1, 2, 3, 4, 5, 6]; // 阶段权重
  let weightedSum = 0;
  let maxWeightedSum = totalSpecs * 6;
  
  for (const state of states) {
    weightedSum += state.phase;
  }
  
  const overallPercentage = totalSpecs > 0 
    ? Math.round((weightedSum / maxWeightedSum) * 100)
    : 0;
  
  // 计算各阶段进度
  const phaseProgress = [];
  for (let phase = 1; phase <= 6; phase++) {
    const count = byPhase[phase] || 0;
    // 简化计算：假设每个阶段应该有的 specs 数量相等
    const expectedCount = Math.ceil(totalSpecs / 6);
    const percentage = expectedCount > 0 
      ? Math.round((count / expectedCount) * 100)
      : 0;
    phaseProgress.push({ phase, percentage: Math.min(percentage, 100) });
  }
  
  // 检测阻塞 specs
  const blocked = detectBlockedSpecs(states);
  
  return {
    summary: {
      totalSpecs,
      byStatus,
      byPhase,
      byLevel
    },
    progress: {
      overallPercentage,
      phaseProgress
    },
    blocked,
    scanInfo: {
      depth: Math.max(...Object.keys(byLevel).map(Number)),
      warnings: [],
      skipped: []
    }
  };
}

/**
 * 检测阻塞 specs
 */
function detectBlockedSpecs(states: StateV1_3_0[]): BlockedFeature[] {
  const stateMap = new Map(states.map(s => [s.feature, s]));
  const blocked: BlockedFeature[] = [];
  
  for (const state of states) {
    const dependencies = state.dependencies?.on || [];
    const blockingDeps: string[] = [];
    
    for (const depId of dependencies) {
      const depState = stateMap.get(depId);
      if (depState && depState.phase < state.phase) {
        blockingDeps.push(depId);
      }
    }
    
    if (blockingDeps.length > 0) {
      blocked.push({
        feature: state.feature,
        status: state.status,
        blockedBy: blockingDeps,
        reason: `依赖 ${blockingDeps.join(', ')} 未达到 Phase ${state.phase}`
      });
    }
  }
  
  return blocked;
}
```

---

## 5. 并发控制

### 5.1 文件锁机制

```typescript
// src/utils/file-lock.ts

import { createWriteStream, promises as fs } from 'fs';
import { join } from 'path';

class FileLock {
  private locks: Map<string, { fd: number; timestamp: number }> = new Map();
  private readonly lockTimeout = 5000; // 5 秒超时
  
  /**
   * 获取文件锁
   */
  async acquire(filePath: string): Promise<boolean> {
    const lockFile = filePath + '.lock';
    const startTime = Date.now();
    
    while (Date.now() - startTime < this.lockTimeout) {
      try {
        // 尝试创建锁文件（排他性）
        const fd = await fs.open(lockFile, 'wx');
        await fd.close();
        
        this.locks.set(filePath, { fd: -1, timestamp: Date.now() });
        return true;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
          // 锁已存在，等待后重试
          await this.sleep(100);
          
          // 检查锁是否超时
          await this.checkStaleLock(lockFile);
        } else {
          throw error;
        }
      }
    }
    
    return false; // 超时
  }
  
  /**
   * 释放文件锁
   */
  async release(filePath: string): Promise<void> {
    const lockFile = filePath + '.lock';
    try {
      await fs.unlink(lockFile);
      this.locks.delete(filePath);
    } catch (error) {
      // 锁文件不存在，忽略
    }
  }
  
  /**
   * 检查并清理过期锁
   */
  private async checkStaleLock(lockFile: string): Promise<void> {
    try {
      const stat = await fs.stat(lockFile);
      const age = Date.now() - stat.mtimeMs;
      
      if (age > this.lockTimeout) {
        // 锁已过期，强制清理
        await fs.unlink(lockFile);
      }
    } catch {
      // 锁文件不存在，忽略
    }
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 5.2 冲突解决策略

| 冲突场景 | 解决策略 |
|----------|----------|
| 同一 specs 并发更新 | 文件锁排队，先获取锁者先执行 |
| 不同 specs 并发更新 | 允许并行（分布式优势） |
| 锁获取超时 | 返回错误，建议用户重试 |
| 锁文件残留 | 自动检测并清理过期锁（>5 秒） |
| 进程崩溃未释放锁 | 启动时扫描并清理孤儿锁文件 |

---

## 6. 错误处理

### 6.1 异常场景

| 异常场景 | 错误码 | 处理策略 | 用户消息 |
|----------|--------|----------|----------|
| state.json 不存在 | STATE_001 | 自动创建初始状态 | "检测到 specs 缺少 state.json，已自动创建初始状态文件" |
| state.json 格式错误 | STATE_002 | 返回解析错误，保留原文件 | "state.json 格式错误：[详情]，请检查 JSON 语法" |
| 状态转换非法 | STATE_003 | 拒绝更新，返回允许的目标状态 | "不允许从 [当前状态] 转换到 [目标状态]。允许的转换：[列表]" |
| 依赖未就绪 | STATE_004 | 拒绝更新，列出未就绪依赖 | "依赖 [Feature ID] 未达到所需状态 [状态]，无法推进" |
| 循环依赖检测 | STATE_005 | 拒绝更新，显示循环链 | "检测到循环依赖：[链]，请调整依赖关系" |
| 文件锁超时 | STATE_006 | 返回繁忙错误 | "状态文件被锁定，请稍后重试或检查是否有其他操作正在进行" |
| 递归深度超限 | STATE_007 | 返回警告，返回部分结果 | "递归深度达到限制 (10 层)，部分 specs 可能未包含在结果中" |
| 聚合查询超时 | STATE_008 | 返回已收集的结果，提示重试 | "查询超时，返回部分结果。建议缩小查询范围或重试" |

### 6.2 降级策略

```typescript
// 错误降级处理
async function safeUpdateStatus(
  featureId: string,
  newStatus: WorkflowStatus,
  options: StateUpdateOptions
): Promise<StateUpdateResult> {
  try {
    // 尝试正常更新
    return await stateManager.updateStatus(featureId, newStatus, options);
  } catch (error) {
    // 降级策略 1: 记录错误日志
    logger.error(`状态更新失败：${featureId}`, error);
    
    // 降级策略 2: 如果是锁超时，建议重试
    if ((error as any).code === 'LOCK_TIMEOUT') {
      return {
        success: false,
        previousStatus: await getCurrentStatus(featureId),
        newStatus: newStatus,
        timestamp: new Date().toISOString(),
        error: '文件锁超时，请重试'
      };
    }
    
    // 降级策略 3: 如果是 Schema 验证失败，尝试修复
    if ((error as any).code === 'SCHEMA_VALIDATION') {
      await attemptSchemaRepair(featureId);
      // 重试一次
      return await stateManager.updateStatus(featureId, newStatus, options);
    }
    
    // 降级策略 4: 其他错误，返回友好消息
    throw error;
  }
}
```

---

## 7. 性能优化

### 7.1 缓存策略

```typescript
// src/state/cache.ts

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // 存活时间 ms
}

class StateCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly defaultTTL = 60000; // 1 分钟
  
  /**
   * 获取缓存
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }
  
  /**
   * 设置缓存
   */
  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    });
  }
  
  /**
   * 失效缓存
   */
  invalidate(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
  
  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear();
  }
}

// 缓存使用示例
const cache = new StateCache();

// 聚合查询结果缓存 1 分钟
async function getCachedAggregation(rootDir: string): Promise<AggregationResult> {
  const cacheKey = `aggregation:${rootDir}`;
  const cached = cache.get<AggregationResult>(cacheKey);
  
  if (cached) {
    return cached;
  }
  
  const result = await aggregator.aggregate(rootDir);
  cache.set(cacheKey, result, 60000);
  return result;
}

// 状态更新后失效相关缓存
async function updateStatusWithCacheInvalidation(
  featureId: string,
  newStatus: WorkflowStatus
): Promise<void> {
  await stateManager.updateStatus(featureId, newStatus, { triggeredBy: '@sdd-plan' });
  
  // 失效聚合缓存
  cache.invalidate('aggregation:');
  cache.invalidate(`status:${featureId}`);
}
```

### 7.2 增量更新

```typescript
// 增量更新策略：只更新变更的字段

interface IncrementalUpdate {
  featureId: string;
  changes: {
    status?: WorkflowStatus;
    phase?: number;
    files?: Partial<FileReferences>;
    dependencies?: Partial<Dependencies>;
  };
  historyEntry?: StatusHistory;
}

async function incrementalUpdate(update: IncrementalUpdate): Promise<StateV1_3_0> {
  // 1. 读取当前状态
  const currentState = await stateManager.getStatus(update.featureId);
  if (!currentState) {
    throw new Error(`Feature 不存在：${update.featureId}`);
  }
  
  // 2. 应用变更
  const newState: StateV1_3_0 = {
    ...currentState,
    ...update.changes,
    updatedAt: new Date().toISOString()
  };
  
  // 3. 添加历史记录
  if (update.historyEntry) {
    newState.history.push(update.historyEntry);
    // 限制历史记录数量
    if (newState.history.length > 100) {
      newState.history = newState.history.slice(-100);
    }
  }
  
  // 4. 写入（原子操作）
  await writeAtomic(update.featureId, newState);
  
  return newState;
}
```

### 7.3 性能目标

| 操作 | 目标响应时间 | 优化措施 |
|------|-------------|----------|
| 单状态查询 | < 10ms | 直接文件读取，无缓存依赖 |
| 聚合查询 (100 specs) | < 500ms | 递归扫描 + 结果缓存 |
| 状态更新 | < 500ms | 原子写入 + 文件锁 |
| 依赖检查 | < 100ms | 内存状态图 + 缓存 |
| 历史记录查询 | < 50ms | 直接读取 state.json |

---

## 8. 测试策略

### 8.1 单元测试

```typescript
// src/state/__tests__/machine.test.ts

describe('StateMachine', () => {
  describe('validateTransition', () => {
    it('应该允许合法的前进转换', () => {
      expect(validateTransition('specified', 'planned')).toEqual({ valid: true });
      expect(validateTransition('planned', 'tasked')).toEqual({ valid: true });
    });
    
    it('应该允许合法的回退转换', () => {
      expect(validateTransition('planned', 'specified')).toEqual({ valid: true });
      expect(validateTransition('tasked', 'planned')).toEqual({ valid: true });
    });
    
    it('应该拒绝跳过状态的转换', () => {
      const result = validateTransition('specified', 'tasked');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('不能跳过中间状态');
    });
    
    it('应该拒绝非法的终态前进', () => {
      const result = validateTransition('validated', 'completed');
      expect(result.valid).toBe(false);
    });
  });
});

// src/state/__tests__/aggregator.test.ts

describe('StateAggregator', () => {
  describe('recursiveScan', () => {
    it('应该扫描所有 specs-tree-前缀的目录', async () => {
      // 设置测试目录结构
      await setupTestDirectory({
        'specs-tree-a/state.json': createTestState('a', 'specified'),
        'specs-tree-b/state.json': createTestState('b', 'planned'),
        'specs-tree-a/specs-tree-sub/state.json': createTestState('sub', 'tasked')
      });
      
      const result = await aggregator.recursiveScan(testRoot);
      
      expect(result.states).toHaveLength(3);
      expect(result.states.map(s => s.feature)).toEqual(
        expect.arrayContaining(['a', 'b', 'sub'])
      );
    });
    
    it('应该跳过符号链接', async () => {
      await setupTestDirectory({
        'specs-tree-a/state.json': createTestState('a', 'specified')
      });
      await createSymlink('specs-tree-a', 'specs-tree-link');
      
      const result = await aggregator.recursiveScan(testRoot);
      
      expect(result.skipped).toContain(expect.stringContaining('specs-tree-link'));
    });
    
    it('应该在达到深度限制时返回警告', async () => {
      // 创建 12 层嵌套结构
      await setupDeepNestedDirectory(12);
      
      const result = await aggregator.recursiveScan(testRoot, { maxDepth: 10 });
      
      expect(result.warnings).toContainEqual(
        expect.stringContaining('达到最大递归深度')
      );
    });
  });
  
  describe('computeAggregation', () => {
    it('应该正确计算状态分布', () => {
      const states = [
        createTestState('a', 'specified'),
        createTestState('b', 'specified'),
        createTestState('c', 'planned'),
        createTestState('d', 'validated')
      ];
      
      const result = computeAggregation(states);
      
      expect(result.summary.byStatus.specified).toBe(2);
      expect(result.summary.byStatus.planned).toBe(1);
      expect(result.summary.byStatus.validated).toBe(1);
    });
  });
});
```

### 8.2 集成测试

```typescript
// src/state/__tests__/integration.test.ts

describe('状态管理集成测试', () => {
  it('应该完成完整的状态流转流程', async () => {
    const featureId = 'test-integration';
    
    // 1. 创建初始状态
    await stateManager.create(featureId, '测试集成');
    
    // 2. 逐步推进状态
    await stateManager.updateStatus(featureId, 'specified', { triggeredBy: '@sdd-spec' });
    await stateManager.updateStatus(featureId, 'planned', { triggeredBy: '@sdd-plan' });
    await stateManager.updateStatus(featureId, 'tasked', { triggeredBy: '@sdd-tasks' });
    
    // 3. 验证最终状态
    const state = await stateManager.getStatus(featureId);
    expect(state?.status).toBe('tasked');
    expect(state?.phase).toBe(3);
    expect(state?.history).toHaveLength(3);
  });
  
  it('应该正确处理依赖检查', async () => {
    // 创建依赖链：A <- B <- C
    await setupDependencyChain(['c', 'b', 'a']);
    
    // 尝试在依赖未就绪时推进 C
    const result = await dependencyChecker.checkDependencies('c', 'planned');
    
    expect(result.valid).toBe(false);
    expect(result.missingDependencies).toHaveLength(2);
  });
});
```

### 8.3 边界测试

| 测试场景 | 预期行为 |
|----------|----------|
| 1000 个 specs 聚合查询 | < 2 秒完成，返回完整结果 |
| 并发 10 个状态更新 | 所有更新成功，无数据损坏 |
| state.json 损坏 | 返回解析错误，不影响其他 specs |
| 嵌套 15 层 | 返回警告，扫描前 10 层 |
| 循环依赖 A→B→A | 检测并阻止，显示循环链 |
| 空目录聚合 | 返回空结果，无错误 |

---

## 9. 迁移计划

### 9.1 迁移场景

当前系统使用集中式 `state.json`（旧版 v1.2.5 Schema），需要迁移到分布式状态存储（新版 v1.3.0 Schema）。

### 9.2 迁移步骤

**步骤 1: 备份现有状态**
```bash
cp .sdd/.specs/state.json .sdd/.specs/state.json.backup.$(date +%Y%m%d_%H%M%S)
```

**步骤 2: 扫描现有 specs 目录**
```typescript
// 使用迁移器扫描所有 specs 目录
const existingSpecs = await migrator.scanExistingSpecs('.sdd/specs-tree-root');
// 返回所有包含 spec.md 的 specs-tree-目录
```

**步骤 3: 为每个 specs 创建 state.json**
```typescript
for (const spec of existingSpecs) {
  const newState: StateV1_3_0 = {
    feature: extractFeatureId(spec.dir),
    name: spec.name,
    version: '1.3.0',
    status: mapOldStatusToNew(spec.oldStatus),
    phase: statusToPhase(spec.oldStatus),
    level: calculateLevel(spec.dir),
    parent: findParent(spec.dir),
    files: {
      spec: 'spec.md',
      plan: 'plan.md',
      tasks: 'tasks.md',
      readme: 'README.md'
    },
    dependencies: {
      on: spec.oldDependencies?.on || [],
      blocking: spec.oldDependencies?.blocking || []
    },
    history: [
      {
        timestamp: spec.createdAt,
        from: 'initial',
        to: mapOldStatusToNew(spec.oldStatus),
        triggeredBy: 'migration',
        comment: '从集中式状态迁移'
      }
    ],
    createdAt: spec.createdAt,
    updatedAt: new Date().toISOString()
  };
  
  await fs.writeFile(
    path.join(spec.dir, 'state.json'),
    JSON.stringify(newState, null, 2)
  );
}
```

**步骤 4: 验证迁移结果**
```typescript
const aggregation = await aggregator.aggregate('.sdd/specs-tree-root');
console.log(`迁移完成：${aggregation.summary.totalSpecs} 个 specs`);
```

**步骤 5: 保留旧 state.json 作为只读备份**
```typescript
// 重命名旧文件
await fs.rename(
  '.sdd/.specs/state.json',
  '.sdd/.specs/state.json.migrated-backup'
);
```

### 9.3 迁移工具

```typescript
// src/state/migrator.ts

export class StateMigrator {
  /**
   * 从集中式迁移到分布式
   */
  async migrateFromCentralized(
    oldStateFile: string,
    newRoot: string
  ): Promise<MigrationResult> {
    // 1. 读取旧状态
    const oldState = await this.readOldState(oldStateFile);
    
    // 2. 扫描现有 specs 目录
    const specs = await this.scanSpecsDirectories(newRoot);
    
    // 3. 合并信息并创建新状态
    const results: MigrationEntry[] = [];
    for (const spec of specs) {
      const entry = await this.createMigratedState(spec, oldState);
      results.push(entry);
    }
    
    // 4. 返回迁移报告
    return {
      success: results.every(r => r.success),
      migrated: results.filter(r => r.success).length,
      failed: results.filter(r => r => !r.success).length,
      details: results
    };
  }
}
```

### 9.4 回滚方案

如果迁移失败，可以回滚到旧版集中式状态：

```bash
# 删除新创建的分布式 state.json
find .sdd/specs-tree-root -name "state.json" -delete

# 恢复旧 state.json
mv .sdd/.specs/state.json.migrated-backup .sdd/.specs/state.json
```

---

## 10. 风险评估

### 10.1 技术风险

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 递归扫描性能问题 | 中 | 高 | 实现深度限制、结果缓存、超时控制 |
| 并发写入冲突 | 中 | 高 | 实现文件锁机制、超时检测、自动重试 |
| Schema 不兼容 | 低 | 高 | 提供迁移工具、保留旧格式兼容读取 |
| 循环依赖检测复杂 | 中 | 中 | 使用 DFS 算法、限制检测深度、提供可视化 |
| 嵌套层级过深 | 低 | 中 | 设置 10 层限制、提供警告、建议扁平化 |

### 10.2 依赖风险

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| Node.js fs 模块变更 | 低 | 低 | 使用稳定 API、添加版本检测 |
| VS Code API 变更 | 低 | 中 | 遵循官方文档、定期更新依赖 |
| 现有 Agent 不兼容 | 中 | 高 | 保持接口向后兼容、提供适配器 |

### 10.3 时间风险

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 迁移复杂度高 | 中 | 中 | 分阶段迁移、充分测试、保留回滚方案 |
| 测试覆盖率不足 | 中 | 高 | 编写全面测试、边界测试、集成测试 |
| 文档更新滞后 | 中 | 低 | 文档与代码同步更新、使用自动化生成 |

### 10.4 缓解措施汇总

1. **性能风险**: 
   - 实现缓存层（聚合结果缓存 1 分钟）
   - 设置递归深度限制（10 层）
   - 实现查询超时控制（2 秒）

2. **并发风险**:
   - 文件锁机制（5 秒超时）
   - 原子写入操作
   - 锁文件自动清理

3. **兼容性风险**:
   - 提供迁移工具
   - 保留旧 Schema 读取能力
   - 版本检测和提示

4. **数据完整性风险**:
   - 写入前验证 Schema
   - 历史记录只追加
   - 定期备份机制

---

## 11. 文件影响分析

### 11.1 需要创建的文件

```
[NEW] src/state/schema-v1.3.0.ts          # 新状态 Schema 定义
[NEW] src/state/aggregator.ts             # 状态聚合查询器
[NEW] src/state/dependency-checker.ts     # 依赖检查器
[NEW] src/state/cache.ts                  # 状态缓存
[NEW] src/utils/file-lock.ts              # 文件锁工具
[NEW] src/state/__tests__/schema-v1.3.0.test.ts
[NEW] src/state/__tests__/aggregator.test.ts
[NEW] src/state/__tests__/dependency-checker.test.ts
[NEW] src/state/__tests__/integration.test.ts
[NEW] .sdd/specs-tree-root/architecture/adr/ADR-001.md
[NEW] .sdd/specs-tree-root/architecture/adr/ADR-002.md
```

### 11.2 需要修改的文件

```
[MODIFY] src/state/machine.ts             # 重构状态机，支持新 Schema
[MODIFY] src/state/migrator.ts            # 增强迁移器，支持 v1.3.0
[MODIFY] src/state/multi-feature-manager.ts # 更新以使用新接口
[MODIFY] src/agents/sdd-agents.ts         # 集成状态自动更新
[MODIFY] src/index.ts                     # 导出新组件
```

### 11.3 需要删除的文件

```
[DELETE] 无（保持向后兼容，不删除旧代码）
```

---

## 12. 验收标准

### 12.1 功能验收

| ID | 验收标准 | 验证方法 |
|----|----------|----------|
| AC-001 | 支持 6 个标准工作流状态 | 单元测试验证状态枚举 |
| AC-002 | 状态转换规则正确执行 | 测试所有合法/非法转换 |
| AC-003 | 分布式状态存储正常工作 | 验证每个 specs 有独立 state.json |
| AC-004 | 状态自动更新触发正确 | 模拟 Agent 完成，验证状态变更 |
| AC-005 | 历史记录完整记录 | 验证每次变更都有历史记录 |
| AC-006 | 依赖状态检查生效 | 测试依赖未就绪时阻止更新 |
| AC-007 | 状态查询接口响应 <100ms | 性能测试 |
| AC-008 | 状态报告生成正确 | 验证报告内容准确性 |
| AC-009 | 聚合查询支持多层嵌套 | 测试 3 层嵌套结构查询 |
| AC-010 | 层级状态传播正确 | 验证子状态变更影响父状态 |

### 12.2 非功能验收

| ID | 验收标准 | 验证方法 |
|----|----------|----------|
| NFR-001 | 单状态查询 <10ms | 性能测试 |
| NFR-002 | 聚合查询 (100 specs) <500ms | 性能测试 |
| NFR-003 | 状态更新 <500ms | 性能测试 |
| NFR-004 | 并发更新无数据损坏 | 并发测试（10 个并发） |
| NFR-005 | 更新失败自动回滚 | 模拟失败场景测试 |
| NFR-006 | 配置文件化管理状态定义 | 验证配置可修改 |

---

## 13. 下一步

完成本规划后，需要执行以下步骤：

1. **创建架构决策记录 (ADR)**
   - ADR-001: 分布式状态存储方案
   - ADR-002: 状态 Schema v1.3.0 设计

2. **更新 state.json**
   - 状态：`specified` → `planned`
   - 阶段：1 → 2
   - 添加 `plan.md` 到 files

3. **运行 @sdd-tasks**
   - 开始任务分解阶段

---

## 14. 文档历史

| 版本 | 日期 | 作者 | 变更说明 |
|------|------|------|----------|
| 1.0.0 | 2026-04-02 | SDD Team | 初始技术规划 |

---

## 附录 A: 状态转换矩阵详细表

| 当前状态 | 允许转换 | 触发条件 | 必需文件 |
|----------|----------|----------|----------|
| `initial` | `specified` | @sdd-spec 完成 | spec.md |
| `specified` | `planned` | @sdd-plan 完成 | spec.md, plan.md |
| `specified` | `initial` | 手动回退 | - |
| `planned` | `tasked` | @sdd-tasks 完成 | spec.md, plan.md, tasks.md |
| `planned` | `specified` | 手动回退 | - |
| `tasked` | `building` | @sdd-build 开始 | spec.md, plan.md, tasks.md |
| `tasked` | `planned` | 手动回退 | - |
| `building` | `reviewed` | @sdd-review 完成 | spec.md, plan.md, tasks.md, review.md |
| `building` | `tasked` | 手动回退 | - |
| `reviewed` | `validated` | @sdd-validate 完成 | spec.md, plan.md, tasks.md, review.md, validation.md |
| `reviewed` | `building` | 手动回退 | - |
| `validated` | `reviewed` | 手动回退 | - |

## 附录 B: Schema 版本迁移路径

```
v1.2.5 (集中式) → v1.3.0 (分布式)

变更点:
1. 存储位置：集中式 → 分布式（每个 specs 独立）
2. 新增字段：level, parent, history
3. 状态枚举：8 个 → 6 个标准工作流状态
4. 依赖关系：增强，支持 blocking 字段
5. 文件引用：规范化，使用相对路径
```
