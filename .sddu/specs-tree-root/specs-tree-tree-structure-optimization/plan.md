# 技术规划：v2.4.0 Feature 拆分与树形结构优化

## 元数据

| 元数据 | 值 |
|--------|-----|
| **Feature ID** | `tree-structure-optimization` |
| **规范版本** | 2.4.0 |
| **创建日期** | 2026-04-12 |
| **状态** | planned |
| **作者** | SDDU Team |

---

## 1. 架构影响分析

### 1.1 现有架构状态

| 模块 | 路径 | 当前行为 | 变更类型 |
|------|------|----------|----------|
| **StateMachine** | `src/state/machine.ts` | 集中式 `.sdd/state.json`，不支持父/叶区分 | 🔧 **重构**：改为分布式，每个 Feature 独立 state.json |
| **Schema v2.0.0** | `src/state/schema-v2.0.0.ts` | 无树形字段 | 🔧 修改（原地升级 v2.1.0） |
| **AutoUpdater** | `src/state/auto-updater.ts` | 单层扫描 | 🔧 修改 |
| **DependencyChecker** | `src/state/dependency-checker.ts` | 同层依赖检查 | 🔧 修改 |
| **SubFeature Manager** | `src/utils/subfeature-manager.ts` | `sub-features/` 中间层 | 🔧 修改 |
| **Discovery Workflow** | `src/discovery/workflow-engine.ts` | 7 步流程，无拆分建议 | 🔧 修改 |
| **Plugin Entry** | `src/index.ts` | 单根 `specs-tree-root/` | 🔧 修改 |
| **Types** | `src/types.ts` | 类型重导出 | 🔧 修改 |
| **Errors** | `src/errors.ts` | 错误码定义 | 🔧 修改 |
| **Agent Templates** | `src/templates/agents/*.hbs` | 11 个 Agent prompt | 🔧 修改（部分） |

### 1.2 需要新建的模块

| 模块 | 路径 | 职责 |
|------|------|------|
| **TreeScanner** | `src/state/tree-scanner.ts` | 递归扫描 `specs-tree-*` 目录，返回树形结构 |
| **ParentStateManager** | `src/state/parent-state-manager.ts` | 父级状态扫描更新（childrens 数组维护） |
| **StateLoader** | `src/state/state-loader.ts` | 分布式状态加载器（替代集中式 `.sdd/state.json` 读取） |
| **TreeStateValidator** | `src/state/tree-state-validator.ts` | 树形结构状态一致性验证 |

### 1.3 架构图（方案 B：完全分布式）

```
┌─────────────────────────────────────────────────────────────┐
│                    src/index.ts (入口)                       │
│  ┌─────────────────┐    ┌─────────────────┐                 │
│  │  StateMachine   │───▶│  AutoUpdater    │                 │
│  │  (重构: 分布式) │    │  (修改: 递归)   │                 │
│  └───────┬─────────┘    └────────┬────────┘                 │
│          │                       │                          │
│          ▼                       ▼                          │
│  ┌─────────────────┐    ┌─────────────────┐                 │
│  │ DependencyChecker│    │  TreeScanner    │ ← 【新建】      │
│  │ (修改: 跨子树)   │    │  (纯扫描)       │                 │
│  └─────────────────┘    └────────┬────────┘                 │
│          ▲                       │                          │
│          └───────────────────────┤                          │
│                                  │                          │
│  ┌──────────────┐  ┌─────────────┼──────┐ ┌──────────────┐ │
│  │  StateLoader │  │ParentStateMgr│     │ │SubFeatureMgr │ │
│  │  【新建】     │  │ 【新建】      │     │ │ (修改: 树感知)│ │
│  │  分布式加载   │  │ 扫描更新     │     │ │              │ │
│  └──────────────┘  └──────────────┘     │ └──────────────┘ │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  TreeStateValidator 【新建】                          │   │
│  │  验证树形结构一致性：深度、childrens、依赖环检测       │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────┐  ┌──────────────────┐                     │
│  │   Types      │  │   Errors         │                     │
│  │  (新增类型)  │  │  (新增错误码)     │                     │
│  └──────────────┘  └──────────────────┘                     │
└─────────────────────────────────────────────────────────────┘

状态存储（完全分布式）:
  specs-tree-root/
  ├── specs-tree-feature-a/state.json    ← Feature A 自身状态
  ├── specs-tree-feature-b/state.json    ← Feature B 自身状态 + childrens
  │   ├── specs-tree-b1/state.json       ← 子 Feature B1 自身状态
  │   └── specs-tree-b2/state.json       ← 子 Feature B2 自身状态
  └── specs-tree-feature-c/state.json    ← Feature C 自身状态
  ❌ 删除: .sdd/state.json（集中式文件不再存在）
```

---

## 2. 方案对比

### 方案 A：渐进式升级

在现有模块基础上修改，新增少量辅助模块，保持架构稳定。

**核心思路**：
1. 新增 `tree-scanner.ts`（纯扫描，无状态依赖）
2. 修改现有 `auto-updater.ts`、`dependency-checker.ts`、`machine.ts`
3. 集中式 `.sdd/state.json` 保持不变

| 维度 | 说明 |
|------|------|
| **改动范围** | 9 个修改 + 3 个新建 = 12 个文件 |
| **风险** | 中（核心 StateMachine 需小心处理） |
| **工作量** | 5-7 天 |
| **优点** | 改动范围小，风险低，保持现有模块结构 |
| **缺点** | 集中式 state.json 与分布式 state.json 的矛盾继续存在，积累更多技术债 |

### 方案 B：架构重构式（✅ 推荐）

**策略**：彻底将 StateMachine 改为分布式，删除集中式 `.sdd/state.json`，所有模块统一依赖分布式 state.json 文件。

| 维度 | 说明 |
|------|------|
| **改动范围** | 12 个修改 + 4 个新建 = 16 个文件 |
| **风险** | 中（SDDU 内部使用阶段，无外部用户影响） |
| **工作量** | 8-10 天 |
| **优点** | 彻底解决架构不一致，符合 ADR-001 完全分布式原则，零历史包袱，为后续版本奠定干净基础 |
| **缺点** | 改动范围较大 |

### 方案 C：插件化扩展式

**策略**：创建 `TreeManager` 独立层，核心模块不变。

| 维度 | 说明 |
|------|------|
| **改动范围** | 3 个新建 + 2 个修改 |
| **风险** | 中 |
| **工作量** | 7-10 天 |
| **优点** | 核心模块不受影响 |
| **缺点** | 间接层增加复杂度，集中式 vs 分布式矛盾继续存在 |

### 推荐方案 B 的理由

1. **SDDU 处于内部使用阶段，未正式发布**——没有外部用户影响，是彻底重构的最佳时机
2. **长痛不如短痛**——方案 A 虽然改动小，但会继续积累架构债务，后续修复成本更高
3. **符合 ADR-001 完全分布式原则**——集中式 state.json 与树形结构天然冲突，分布式才是正确方向
4. **树形结构需要分布式**——每个 Feature 独立管理自身状态（含 childrens），分布式模型天然适配

---

## 3. 详细技术设计

### 3.1 Schema v2.1.0 升级（原地升级）

**策略**：在 `schema-v2.0.0.ts` 中扩展 v2.1.0 字段。统一按新设计实施，不做旧版兼容适配。

```typescript
// src/state/schema-v2.0.0.ts 中追加：

/**
 * 子 Feature 简要信息
 */
export interface ChildFeatureInfo {
  /** 子 Feature 目录名 (e.g. "specs-tree-user-auth") */
  name: string;
  /** 子 Feature 自身状态 */
  status: string;
  /** 最后扫描更新时间 */
  lastScannedAt?: string;
  [key: string]: unknown;
}

/**
 * State Schema v2.1.0
 * 
 * 设计原则：state.json 的归属者就是主角
 * - status/phase 天然属于文件拥有者自身
 * - 子级信息通过 childrens 数组记录
 * 
 * 统一按新设计实施，不做旧版兼容适配
 */
export interface StateV2_1_0 {
  feature: string;
  name?: string;
  version: '2.1.0';
  status: WorkflowStatus | 'drafting' | 'discovered' | string;
  phase: number;
  phaseHistory: PhaseHistory[];
  files: {
    spec: string;
    plan?: string;
    tasks?: string;
    readme?: string;
    review?: string;
    validation?: string;
    discovery?: string;
  };
  dependencies: {
    on: string[];
    blocking: string[];
  };
  metadata?: Record<string, unknown>;
  history?: Array<Record<string, unknown>>;
  
  // === 新增：树形结构字段 ===
  /** 子 Feature 简要信息数组（仅父级使用，叶子节点为空数组） */
  childrens?: ChildFeatureInfo[];
  /** 当前层级深度（root=0, 第一层子=1） */
  depth?: number;
}

/**
 * 验证 v2.1.0 state
 */
export function validateStateV2_1_0(state: unknown): state is StateV2_1_0 {
  const s = state as Record<string, unknown>;
  if (!s || typeof s !== 'object') return false;
  if (!s.feature || typeof s.feature !== 'string') return false;
  if (!s.version) return false;
  if (s.depth !== undefined && typeof s.depth !== 'number') return false;
  if (s.childrens !== undefined && !Array.isArray(s.childrens)) return false;
  return true;
}
```

### 3.2 TreeScanner（新建）

```typescript
// src/state/tree-scanner.ts

import * as fs from 'fs/promises';
import * as path from 'path';

export interface FeatureTreeNode {
  id: string;                    // Feature 目录名
  relativePath: string;          // 相对于 specsTreeRoot 的路径
  depth: number;                 // 层级深度
  children: FeatureTreeNode[];   // 子节点
  isLeaf: boolean;               // 是否为叶子节点
  state?: unknown;               // state.json 内容
}

export interface ScanResult {
  nodes: FeatureTreeNode[];      // 顶层节点
  flatMap: Map<string, FeatureTreeNode>; // 路径 → 节点
}

/**
 * 递归扫描 specs-tree-* 目录结构
 * 
 * 扫描规则：
 * - 只识别以 `specs-tree-` 开头的目录
 * - 跳过 `specs-tree-root` 自身
 * - 递归扫描所有子目录
 */
export async function scanTreeStructure(
  rootDir: string
): Promise<ScanResult> {
  const flatMap = new Map<string, FeatureTreeNode>();
  
  async function scanDir(dirPath: string, relativePath: string, depth: number): Promise<FeatureTreeNode[]> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      const nodes: FeatureTreeNode[] = [];

      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        if (!entry.name.startsWith('specs-tree-')) continue;
        if (entry.name === 'specs-tree-root') continue;

        const nodeRelPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
        const fullPath = path.join(dirPath, entry.name);
        
        // 读取 state.json
        let state: unknown;
        try {
          const content = await fs.readFile(path.join(fullPath, 'state.json'), 'utf-8');
          state = JSON.parse(content);
        } catch { /* 忽略 */ }

        // 递归扫描子目录
        const children = await scanDir(fullPath, nodeRelPath, depth + 1);

        const node: FeatureTreeNode = {
          id: entry.name,
          relativePath: nodeRelPath,
          depth,
          children,
          isLeaf: children.length === 0,
          state
        };

        nodes.push(node);
        flatMap.set(nodeRelPath, node);
      }

      return nodes;
    } catch {
      return [];
    }
  }

  const nodes = await scanDir(rootDir, '', 0);
  return { nodes, flatMap };
}

/**
 * 判断路径是否为父级 Feature
 */
export function isParentFeature(node?: FeatureTreeNode): boolean {
  return node ? !node.isLeaf : false;
}
```

### 3.3 ParentStateManager（新建）

```typescript
// src/state/parent-state-manager.ts

import * as fs from 'fs/promises';
import * as path from 'path';
import type { ChildFeatureInfo } from './schema-v2.0.0';

/**
 * 手动触发父级状态扫描更新
 * 
 * 扫描规则：
 * 1. 读取直接子目录中所有 specs-tree-* 目录
 * 2. 读取每个子 Feature 的 state.json
 * 3. 更新父级 state.json 的 childrens 数组
 */
export async function scanAndUpdateParentState(
  parentFeatureDir: string
): Promise<void> {
  const stateFile = path.join(parentFeatureDir, 'state.json');
  
  // 1. 扫描子 Feature
  const childrens: ChildFeatureInfo[] = [];
  
  try {
    const entries = await fs.readdir(parentFeatureDir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (!entry.name.startsWith('specs-tree-')) continue;

      const childDir = path.join(parentFeatureDir, entry.name);
      const childStateFile = path.join(childDir, 'state.json');

      try {
        const content = await fs.readFile(childStateFile, 'utf-8');
        const childState = JSON.parse(content);

        childrens.push({
          name: entry.name,
          status: childState.status ?? 'unknown',
          lastScannedAt: new Date().toISOString()
        });
      } catch {
        childrens.push({
          name: entry.name,
          status: 'unreadable',
          lastScannedAt: new Date().toISOString()
        });
      }
    }
  } catch (error) {
    console.warn(`扫描父级子 Feature 失败: ${parentFeatureDir}`, error);
    return;
  }

  // 2. 更新父级 state.json
  try {
    const content = await fs.readFile(stateFile, 'utf-8');
    const parentState = JSON.parse(content);
    
    parentState.childrens = childrens;
    parentState.updatedAt = new Date().toISOString();
    
    await fs.writeFile(stateFile, JSON.stringify(parentState, null, 2));
  } catch (error) {
    console.warn(`更新父级状态失败: ${stateFile}`, error);
  }
}
```

### 3.4 AutoUpdater 修改

**核心变更**：
1. `getAllFeatureIds()` → 改为使用 `scanTreeStructure()`
2. 路径提取逻辑：支持嵌套路径

```diff
// src/state/auto-updater.ts 修改要点

- private async getAllFeatureIds(): Promise<string[]> {
-   const items = await fs.readdir(specsDirPath, { withFileTypes: true });
-   return items.filter(i => i.isDirectory()).map(i => i.name);
- }

+ private async getAllFeatureIds(): Promise<{ id: string; path: string; depth: number }[]> {
+   const { scanTreeStructure } = await import('./tree-scanner');
+   const result = await scanTreeStructure(this.specsDir);
+   return Array.from(result.flatMap.entries()).map(([path, node]) => ({
+     id: node.id,
+     path,
+     depth: node.depth
+   }));
+ }

- private async inferCurrentStateFromFiles(featureId: string): Promise<FeatureStateEnum | null> {
-   const featureDir = path.join(this.specsDir, featureId);
+ private async inferCurrentStateFromFiles(featurePath: string): Promise<FeatureStateEnum | null> {
+   const featureDir = path.join(this.specsDir, featurePath);
    // ... 保持原有逻辑，但增加对父级轻量化状态的识别
  }
```

### 3.5 DependencyChecker 修改

**核心变更**：
1. `scanAllFeatures()` → 使用 `scanTreeStructure()` 递归扫描
2. 依赖解析：支持跨子树路径（`specs-tree-parent/specs-tree-child`）

```diff
// src/state/dependency-checker.ts 修改要点

  async scanAllFeatures(): Promise<Map<string, FeatureStateInfo>> {
-   const items = await fs.readdir(specsDirPath, { withFileTypes: true });
-   for (const item of items) {
-     if (!item.isDirectory()) continue;
-     const featureId = item.name;
-     // ...
+   const { scanTreeStructure } = await import('./tree-scanner');
+   const result = await scanTreeStructure(this.specsDir);
+   for (const [featurePath, node] of result.flatMap) {
+     const featureId = featurePath;
+     const stateFile = path.join(this.specsDir, featurePath, 'state.json');
+     // ... 原有逻辑，featureId 使用完整相对路径
    }
  }
```

### 3.6 StateLoader（新建）

**核心职责**：替代集中式 `.sdd/state.json` 的读写，实现完全分布式状态管理。

```typescript
// src/state/state-loader.ts

import * as fs from 'fs/promises';
import * as path from 'path';
import { scanTreeStructure, FeatureTreeNode } from './tree-scanner';
import type { StateV2_1_0 } from './schema-v2.0.0';

/**
 * 分布式状态加载器
 * 
 * 设计原则：
 * - 每个 Feature 有独立的 state.json 在其目录内
 * - 不再存在集中式 .sdd/state.json 文件
 * - 通过扫描目录结构 + 读取各 state.json 构建完整状态视图
 */
export class StateLoader {
  private specsDir: string;
  private cache: Map<string, StateV2_1_0> = new Map();
  private cacheExpiry: number = 3000; // 3 秒缓存
  private lastCacheUpdate: number = 0;

  constructor(specsDir: string) {
    this.specsDir = specsDir;
  }

  /**
   * 加载所有 Feature 状态（分布式）
   */
  async loadAll(): Promise<Map<string, StateV2_1_0>> {
    const now = Date.now();
    if (this.cache.size > 0 && now - this.lastCacheUpdate < this.cacheExpiry) {
      return this.cache;
    }

    const { nodes, flatMap } = await scanTreeStructure(this.specsDir);
    const states = new Map<string, StateV2_1_0>();

    for (const [featurePath, node] of flatMap) {
      if (node.state) {
        states.set(featurePath, node.state as StateV2_1_0);
      }
    }

    this.cache = states;
    this.lastCacheUpdate = now;
    return states;
  }

  /**
   * 获取单个 Feature 状态
   */
  async get(featurePath: string): Promise<StateV2_1_0 | undefined> {
    const stateFile = path.join(this.specsDir, featurePath, 'state.json');
    try {
      const content = await fs.readFile(stateFile, 'utf-8');
      return JSON.parse(content) as StateV2_1_0;
    } catch {
      return undefined;
    }
  }

  /**
   * 更新单个 Feature 状态
   */
  async set(featurePath: string, state: StateV2_1_0): Promise<void> {
    const stateFile = path.join(this.specsDir, featurePath, 'state.json');
    state.updatedAt = new Date().toISOString();
    await fs.writeFile(stateFile, JSON.stringify(state, null, 2));
    
    // 更新缓存
    this.cache.set(featurePath, state);
  }

  /**
   * 创建新 Feature 状态
   */
  async create(featurePath: string, initialState: Partial<StateV2_1_0>): Promise<StateV2_1_0> {
    const state: StateV2_1_0 = {
      feature: featurePath,
      name: initialState.name ?? featurePath,
      version: '2.1.0',
      status: initialState.status ?? 'discovered',
      phase: initialState.phase ?? 0,
      phaseHistory: initialState.phaseHistory ?? [],
      files: initialState.files ?? { spec: 'spec.md' },
      dependencies: { on: [], blocking: [] },
      childrens: initialState.childrens ?? [],
      depth: initialState.depth ?? 0,
      ...initialState
    };

    await this.set(featurePath, state);
    return state;
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
    this.lastCacheUpdate = 0;
  }
}
```

### 3.7 StateMachine 修改（重构为分布式）

**核心变更**：
1. 删除集中式 `.sdd/state.json` 的 load/save 逻辑
2. 使用 `StateLoader` 作为底层状态存储
3. `requiredFiles` 增加对父级轻量化状态的识别
4. `checkRequiredFiles()` 支持父级只检查 discovery/spec/plan

```diff
// src/state/machine.ts 修改要点

  class StateMachine {
-   private states: Map<string, FeatureWithFullHistory> = new Map();
-   private stateFilePath: string;
+   private stateLoader: StateLoader;

-   constructor(private specsDir: string = 'specs-tree-root') {
-     this.stateFilePath = path.join(specsDir, '.sdd', 'state.json');
+   constructor(specsDir: string = 'specs-tree-root') {
+     this.stateLoader = new StateLoader(specsDir);
    }

-   async load(): Promise<void> {
-     // 读取集中式 .sdd/state.json
-     const content = await fs.readFile(this.stateFilePath, 'utf-8');
-     const data = JSON.parse(content);
-     this.states = new Map(Object.entries(data.features));
+   async load(): Promise<void> {
+     // 分布式加载：扫描所有 state.json
+     await this.stateLoader.loadAll();
    }

-   async save(): Promise<void> {
-     // 写入集中式 .sdd/state.json
-     await fs.writeFile(this.stateFilePath, JSON.stringify({
-       version: '2.0.0',
-       updatedAt: new Date().toISOString(),
-       features: Object.fromEntries(this.states)
-     }, null, 2));
+   async save(): Promise<void> {
+     // 分布式模式：无需集中保存，各 state.json 已独立更新
    }

    async updateState(featureId: string, newState: FeatureStateEnum, ...): Promise<void> {
-     const feature = this.states.get(featureId);
+     const feature = await this.stateLoader.get(featureId);
      // ... 状态转换逻辑
-     this.states.set(featureId, updatedFeature);
-     await this.save(); // 写入集中式文件
+     await this.stateLoader.set(featureId, updatedFeature); // 写入分布式文件
    }

+   private requiredFiles: Record<FeatureStateEnum, string[]> = {
+     'drafting': [],
+     'discovered': ['discovery.md'],
+     'specified': ['spec.md', 'discovery.md'],
+     'planned': ['spec.md', 'plan.md', 'discovery.md'],
+     'tasked': ['spec.md', 'plan.md', 'tasks.md', 'discovery.md'],
+     // ... 其他状态
+   };

+   private async isParentFeature(featureId: string): Promise<boolean> {
+     const { scanTreeStructure } = await import('./tree-scanner');
+     const result = await scanTreeStructure(this.specsDir);
+     const node = result.flatMap.get(featureId);
+     return node ? !node.isLeaf : false;
+   }

    checkRequiredFiles(featureId: string, targetState: FeatureStateEnum): { missing: string[]; present: string[] } {
+     // 对于父级 Feature，只检查 discovery/spec/plan
+     if (this.isParentFeature(featureId) && ['tasked', 'implementing', 'reviewed', 'validated', 'completed'].includes(targetState)) {
+       return { missing: [], present: [] };
+     }
      // ... 原有逻辑
    }
  }
```

### 3.7 SubFeature Manager 修改

**核心变更**：废弃 `sub-features/` 模式，内部调用 `tree-scanner.ts`。

```diff
// src/utils/subfeature-manager.ts 修改要点

  export async function detectFeatureMode(featurePath: string): Promise<'parent' | 'leaf'> {
-   const subFeaturesPath = path.join(featurePath, 'sub-features');
-   // ... 检查 sub-features 目录
+   const { scanTreeStructure } = await import('../state/tree-scanner');
+   // 扫描 featurePath 下是否有 specs-tree-* 子目录
+   try {
+     const entries = await fs.readdir(featurePath, { withFileTypes: true });
+     const hasChildren = entries.some(e => 
+       e.isDirectory() && e.name.startsWith('specs-tree-') && e.name !== 'specs-tree-root'
+     );
+     return hasChildren ? 'parent' : 'leaf';
+   } catch {
+     return 'leaf';
+   }
  }
```

### 3.8 Discovery Workflow 修改

**核心变更**：在 scope-boundary 步骤后增加拆分建议输出。

```diff
// src/discovery/workflow-engine.ts 修改要点

  async execute(context: DiscoveryContext): Promise<DiscoveryContext> {
    // ... 7 步流程
    return context;
  }

+ /**
+  * 输出 Feature 拆分建议
+  * 在 Discovery 完成后调用，识别到多模块需求时输出拆分建议
+  */
+ async suggestSplit(context: DiscoveryContext): Promise<SplitSuggestion | null> {
+   // 分析需求分类结果，判断是否包含多个独立模块
+   const requirements = context.requirements ?? [];
+   const modules = new Set(requirements.map(r => r.module ?? 'default'));
+   
+   if (modules.size <= 1) return null;
+   
+   return {
+     featureName: context.featureName,
+     suggestedSplits: Array.from(modules).map(m => ({
+       id: `specs-tree-${m.toLowerCase().replace(/\s+/g, '-')}`,
+       name: m,
+       reason: `独立模块: ${m}`
+     })),
+     reason: `检测到 ${modules.size} 个独立模块，建议拆分`
+   };
+ }
```

### 3.9 Error 系统扩展

```diff
// src/errors.ts 新增错误码

  export enum ErrorCode {
    // ... 现有错误码
+   
+   // Tree Errors (6000-6999)
+   TREE_SCAN_FAILED = 'TREE_6001',
+   TREE_DEPTH_EXCEEDED = 'TREE_6002',
+   CROSS_TREE_DEP_NOT_FOUND = 'TREE_6003',
+   PARENT_STATE_UPDATE_FAILED = 'TREE_6004',
  }
```

### 3.10 主路由 Agent 修改（sddu.md.hbs）

**当前问题**：主路由 agent 只支持平层路径模式 `.sddu/specs-tree-root/specs-tree-[feature]/`，不支持嵌套路径。

**核心变更**：
1. 路径识别改为支持树形嵌套路径
2. 状态检查改为读取 Feature 自身的 `state.json`（不再读取 `.opencode/sdd/state.json`）
3. 父级/叶子角色识别（父级只允许 discovery/spec/plan）

```diff
// src/templates/agents/sddu.md.hbs 修改要点

## 🔄 工作流程（强制执行）

### 1. 状态检查（必须执行）
当用户调用 `@sddu` 或任何阶段命令时：
- 1. 读取 `.opencode/sdd/state.json`（如果存在）
- 2. 检查当前 feature 的状态
-  3. 检查 `.sddu/specs-tree-root/specs-tree-[feature]/` 下的文件是否存在
+ 1. 递归扫描 `.sddu/specs-tree-root/` 下的树形结构
+ 2. 定位目标 feature 并读取其 `state.json`
+ 3. 检查对应路径下的文件是否存在（spec.md, plan.md, tasks.md）
+    - 平层：`specs-tree-[feature]/`
+    - 嵌套：`specs-tree-[parent]/specs-tree-[child]/`
+    - 任意深度：`specs-tree-[l1]/specs-tree-[l2]/.../specs-tree-[ln]/`
4. 根据状态决定下一步
5. 识别父级/叶子角色：
   - 父级（有子 feature）：只允许 discovery/spec/plan
   - 叶子（无子 feature）：允许完整 6 阶段

### 阶段跳转验证表（更新）

| 目标阶段 | 必需前置 | 必需文件 | 验证逻辑 |
|----------|----------|----------|----------|
| discovery | 无 | 无 | 始终允许 |
| spec | 无 | 无 | 始终允许 |
| plan | specified | `**/specs-tree-[feature]/spec.md` | 检查文件存在 + 状态 |
| tasks | planned | `**/specs-tree-[feature]/plan.md` | 检查文件存在 + 状态；父级 feature 拒绝此阶段 |
| build | tasked | `**/specs-tree-[feature]/tasks.md` | 检查文件存在 + 状态；父级 feature 拒绝此阶段 |
| review | implementing | 代码已实现 | 检查代码文件 + 状态；父级 feature 拒绝此阶段 |
| validate | reviewed | review 报告 | 检查审查通过 + 状态；父级 feature 拒绝此阶段 |

## 支持的命令（更新路径描述）

| 命令 | 说明 | 路径模式 |
|------|------|----------|
| `@sddu spec [name]` | 规范编写 | `specs-tree-root/**/specs-tree-[name]/spec.md` |
| `@sddu plan [name]` | 技术规划 | `specs-tree-root/**/specs-tree-[name]/plan.md` |
| `@sddu tasks [name]` | 任务分解 | `specs-tree-root/**/specs-tree-[name]/tasks.md` |
| `@sddu build [TASK]` | 任务实现 | `specs-tree-root/**/specs-tree-[name]/tasks.md` |
```

### 3.11 Agent 模板修改（其他）

需要修改的 Agent 模板：

| 模板 | 修改内容 |
|------|----------|
| `sddu-discovery.md.hbs` | 增加拆分建议输出指引 |
| `sddu-spec.md.hbs` | 增加父级/叶子角色识别，轻量化文档生成规则 |
| `sddu-plan.md.hbs` | 增加父级子级协作关系描述指引 |

---

## 4. 文件影响分析

### 4.1 新建文件（4 个）

| 文件 | 行数预估 | 说明 |
|------|----------|------|
| `src/state/tree-scanner.ts` | ~120 行 | 递归扫描器，纯函数无副作用 |
| `src/state/parent-state-manager.ts` | ~80 行 | 父级状态扫描更新（childrens 数组维护） |
| `src/state/state-loader.ts` | ~150 行 | 分布式状态加载器（替代集中式 .sdd/state.json） |
| `src/state/tree-state-validator.ts` | ~100 行 | 树形结构状态一致性验证 |

### 4.2 修改文件（10 个）

| 文件 | 变更类型 | 变更范围 |
|------|----------|----------|
| `src/state/schema-v2.0.0.ts` | 🔧 扩展 | 新增 ChildFeatureInfo、StateV2_1_0、validateStateV2_1_0 |
| `src/state/machine.ts` | 🔧 **重构** | 删除集中式 load/save，改用 StateLoader 分布式加载 |
| `src/state/auto-updater.ts` | 🔧 修改 | 递归扫描、路径提取 |
| `src/state/dependency-checker.ts` | 🔧 修改 | 跨子树依赖解析 |
| `src/utils/subfeature-manager.ts` | 🔧 修改 | 废弃 sub-features/ 模式 |
| `src/discovery/workflow-engine.ts` | 🔧 修改 | 拆分建议输出 |
| `src/index.ts` | 🔧 修改 | 删除集中式 state.json 引用，多树根初始化 |
| `src/types.ts` | 🔧 修改 | 新增树形类型导出 |
| `src/errors.ts` | 🔧 修改 | 新增树形错误码 |
| `src/templates/agents/sddu.md.hbs` | 🔧 修改 | **主路由**：树形路径识别、父/叶角色拦截 |
| `src/templates/agents/sddu-spec.md.hbs` | 🔧 修改 | 父/叶角色识别 |

### 4.3 删除文件（1 个）

| 文件 | 说明 |
|------|------|
| `.sdd/state.json`（运行时生成） | 集中式状态文件，v2.4.0 后不再存在 |

### 4.4 不修改文件

| 文件 | 说明 |
|------|------|
| `src/templates/agents/*.hbs`（除 spec/plan/discovery 外） | build/review/validate 模板无需修改 |

---

## 5. 风险评估

### 5.1 技术风险

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| StateMachine 分布式重构引入回归 Bug | 高 | 中 | SDDU 内部使用阶段，无外部用户影响；充分单元测试 |
| 递归扫描性能问题（深层嵌套） | 中 | 低 | TreeScanner 使用增量扫描 + 缓存，仅在有文件变更时触发 |
| 旧版 sub-features/ 目录被误识别 | 低 | 低 | 优先识别 specs-tree-* 子目录，sub-features/ 作为降级 |
| 跨子树依赖路径解析错误 | 中 | 低 | 依赖解析使用相对路径，与 specsTreeRoot 拼接验证 |

### 5.2 依赖风险

| 风险 | 说明 | 缓解措施 |
|------|------|----------|
| Node.js fs 版本兼容 | 使用 `fs/promises` API | 项目已使用，无额外依赖 |
| 循环依赖 | tree-scanner ↔ auto-updater | tree-scanner 为纯模块，不导入任何状态模块 |

### 5.3 时间风险

| 风险 | 说明 | 缓解措施 |
|------|------|----------|
| Agent 模板调整需要多轮测试 | Agent prompt 行为难以精确控制 | 先实现核心逻辑，Agent 模板可后续迭代 |
| 测试覆盖不足 | 树形结构测试场景多 | 优先覆盖核心路径（扫描、状态更新、依赖检查） |

---

## 6. 实施顺序

```
Phase 1: 分布式基础设施（2-3 天）
  ├── 1.1 schema-v2.0.0.ts 扩展 v2.1.0 字段
  ├── 1.2 新增 tree-scanner.ts + 测试
  ├── 1.3 新增 state-loader.ts（分布式加载器）
  └── 1.4 新增 tree-state-validator.ts

Phase 2: StateMachine 重构（2-3 天）
  ├── 2.1 machine.ts 改为分布式（使用 StateLoader）
  ├── 2.2 删除集中式 .sdd/state.json 的 load/save 逻辑
  ├── 2.3 父级状态识别 + requiredFiles 差异化
  └── 2.4 集成测试：状态转换 + 文件检查

Phase 3: 核心模块改造（2 天）
  ├── 3.1 auto-updater.ts 递归扫描
  ├── 3.2 dependency-checker.ts 跨子树依赖
  ├── 3.3 subfeature-manager.ts 改为树形感知
  └── 3.4 parent-state-manager.ts 扫描更新

Phase 4: 集成与完善（1-2 天）
  ├── 4.1 discovery workflow 拆分建议
  ├── 4.2 types.ts / errors.ts 扩展
  ├── 4.3 Agent 模板修改
  └── 4.4 index.ts 集成
```

---

## 7. 验收标准

### 7.1 功能验收

- [ ] TreeScanner 能递归扫描任意深度的 `specs-tree-*` 目录
- [ ] StateLoader 能正确从分布式 state.json 加载所有 Feature 状态
- [ ] StateMachine 的 load/save 完全分布式，不再读写 `.sdd/state.json`
- [ ] 父级 state.json 的 `childrens` 数组正确反映子 Feature 状态
- [ ] DependencyChecker 能解析跨子树依赖路径
- [ ] AutoUpdater 能正确处理嵌套 Feature 的文件变更
- [ ] StateMachine 对父级 Feature 只检查 discovery/spec/plan 文件
- [ ] 所有 state.json 统一使用 v2.1.0 schema

### 7.2 非功能验收

- [ ] TypeScript 严格模式编译通过
- [ ] TreeScanner + StateLoader 单元测试覆盖率 > 80%
- [ ] 扫描 50 个 Feature / 10 层嵌套耗时 < 100ms
- [ ] 无循环依赖引入
- [ ] 现有 11 个 Feature 目录结构不受影响

---

## 8. 架构决策记录 (ADR)

### ADR-015: 原地升级 Schema 而非新建文件

**状态**: PROPOSED

**背景**: Schema 需要从 v2.0.0 升级到 v2.1.0，新增 `childrens` 和 `depth` 字段。

**决策**: 在 `schema-v2.0.0.ts` 中原地扩展，而非新建 `schema-v2.1.0.ts`。

**理由**:
1. v2.1.0 是 v2.0.0 的超集，统一按新设计实施
2. 减少模块数量，降低维护成本
3. 不做旧版兼容适配，零历史包袱

**后果**:
- 所有 state.json 统一使用 v2.1.0 schema
- 版本字段固定为 `'2.1.0'`

### ADR-016: TreeScanner 为纯模块

**状态**: PROPOSED

**背景**: TreeScanner 需要被 AutoUpdater、DependencyChecker、StateMachine 等多个模块使用。

**决策**: TreeScanner 不导入任何状态管理模块，仅提供纯扫描函数。

**理由**:
1. 避免循环依赖（tree-scanner → auto-updater → tree-scanner）
2. 可独立测试
3. 符合单一职责原则

**后果**:
- 状态更新逻辑由调用方自行处理（通过 parent-state-manager.ts）
- TreeScanner 的输出为原始数据结构，不含业务逻辑

### ADR-017: 完全分布式状态管理

**状态**: PROPOSED

**背景**: 当前架构存在状态存储不一致问题：
- StateMachine 使用集中式 `.sdd/state.json`
- DependencyChecker 使用分布式 `<featureId>/state.json`

**决策**: v2.4.0 将 StateMachine 彻底改为分布式，删除集中式 `.sdd/state.json`，所有模块统一依赖分布式 state.json 文件。

**理由**:
1. SDDU 处于内部使用阶段，未正式发布，是彻底重构的最佳时机
2. 集中式 state.json 与树形结构天然冲突，分布式才是正确方向
3. 长痛不如短痛——继续积累架构债务，后续修复成本更高
4. 符合 ADR-001 完全分布式存储的设计原则

**后果**:
- **正面**: 架构统一，消除不一致；树形结构天然适配；零历史包袱
- **负面**: 改动范围较大，需要重构 StateMachine 的 load/save 逻辑
- **风险**: SDDU 内部使用阶段，无外部用户影响，风险可控

**相关决策**:
- ADR-001: 完全分布式存储 → ✅ 本决策直接实现该原则
- ADR-005: 7 步工作流固定顺序 → ⚠️ 父级/叶子差异化不影响工作流顺序
