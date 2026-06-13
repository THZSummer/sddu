# 技术规划：SDDU 特性状态增强

## 元数据

| 元数据 | 值 |
|--------|-----|
| **Feature ID** | `FR-STATUS-ENHANCE-001` |
| **Feature 名称** | SDDU 特性状态增强 |
| **规范版本** | 1.0.0 |
| **创建日期** | 2026-06-12 |
| **阶段** | planned |
| **优先级** | P1 |
| **依赖 Feature** | 无（独立 Feature） |
| **核心模型版本** | v5.0.0（两字段隔离，全 -ed 形态） |

---

## 1. 架构影响分析

### 1.1 现状评估

当前 SDDU 状态系统存在以下架构问题：

| 问题 | 影响模块 | 严重程度 |
|------|----------|----------|
| **双宇宙状态映射**：`FeatureStateEnum`（9 状态内部） ↔ `WorkflowStatus`（6 状态 schema）持续互转 | `machine.ts`, `auto-updater.ts`, `dependency-checker.ts`, `state-validator.ts` | 🔴 严重 — 4 个模块各有一份映射逻辑 |
| **单字段混用**：`status` 字段同时承载阶段语义和流转语义 | `schema-v2.0.0.ts`, `sddu.md.hbs` | 🔴 严重 — `drafting`/`discovered`/`completed` 无法存入 schema |
| **无流转状态概念**：不支持 suspended / terminated / merged | 全部模块 | 🟡 中等 — 用户无法暂停/终止/合并特性 |
| **无一致性检测**：版本升级后手动迁移，无自动检测修复 | 无对应模块 | 🟡 中等 — 运行时产物可能偏离设计规则 |

### 1.2 目标架构

> **非直接修复范畴**：`.opencode/*`、`.sddu/*`、`opencode.json` 不在本 feature 代码中直接修改，由 R5 内置升级机制在用户执行 `@sddu 状态` 时自动检测并请示用户后修复。

```
src/state/
├── schema-v3.0.0.ts            # 🆕 新建 — phase（8 值）+ status（5 值）联合 schema
├── schema-v2.0.0.ts            # 🔵 保留 — 作为旧版本参考（不再使用）
├── schema-v1.2.5.ts            # 🔵 保留 — 作为旧版本参考（不再使用）
├── machine.ts                  # 🔴 重大修改 — 删除 FeatureStateEnum 双宇宙映射，使用 phase + status 直接驱动
├── state-loader.ts             # 🟡 中等修改 — 读取/写入/创建时支持 phase + status 新字段
├── tree-scanner.ts             # 🟡 中等修改 — 扫描时标记 status，支持子随父归逻辑
├── tree-state-validator.ts     # 🟡 中等修改 — 更新校验规则为 phase(8) + status(5)
├── parent-state-manager.ts     # 🟢 轻量修改 — childrens 中记录 status 字段
├── dependency-checker.ts       # 🟢 轻量修改 — 移除双宇宙映射，直接使用 phase/status
├── auto-updater.ts             # 🟡 中等修改 — 文件推导阶段改为 phase，跳过非 tracked 特性
├── consistency-checker.ts      # 🆕 新建 — R5 版本升级一致性检测 + 修复引擎
└── migrator.ts                 # 🟡 中等修改 — 增加 v2.x → v3.0.0 迁移路径

agents/
├── sddu.md                      # 🔴 重大修改 — 分类仪表盘 + 标记命令 + 子随父归 + 智能引导
└── sddu-docs.md                 # 🟡 中等修改 — README 中按 status 标注对应标记

templates/
├── agents/sddu.md.hbs           # 🔴 重大修改 — 对应 sddu agent 全部新功能
├── agents/sddu-docs.md.hbs      # 🟡 中等修改 — status 标注指引
└── agents/output/sddu-plan.md.hbs # 🟢 轻量 — phase/status 变量适配
```

### 1.3 架构对比

| 维度 | 当前 (v2.1.0) | 目标 (v3.0.0) |
|------|--------------|--------------|
| **schema 状态值** | 6 个（specified/planned/tasked/building/reviewed/validated） | 无单一状态字段，拆为 phase（8 值）+ status（5 值） |
| **内部状态枚举** | 9 个（FeatureStateEnum） | 不需要 — phase + status 直接表达 |
| **映射层** | 4 处（machine/auto-updater/dep-checker/state-validator） | 0 处 |
| **流转状态** | 不支持 | 5 种（tracked/completed/suspended/terminated/merged） |
| **一致性检测** | 无 | 内置升级机制（R5） |
| **标记命令** | 无 | `@sddu 标记` |
| **状态输出** | 线性列表 | 6 区分类仪表盘 |

---

## 2. 方案对比

### 方案 A：增量演进

**策略**：在现有 v2.1.0 架构上增量修改。新建 `schema-v3.0.0.ts`，逐步修改 `machine.ts` 移除双宇宙映射，保留旧 schema 作为兼容参考，渐进式切换。

| 维度 | 说明 |
|------|------|
| **改动范围** | ~17 个文件修改 + 2 个文件新建 |
| **风险** | 中低（渐进式修改，每步可独立测试） |
| **工作量** | MVP: 5-7 天, V1: +3-4 天, V2: +2 天 |
| **优点** | 利用已验证的基础设施；改动粒度可控；兼容旧 schema 参考 |
| **缺点** | schema-v2.0.0 保留增加维护负担；新旧逻辑并存期可能引入混淆；machine.ts 需充分回归测试 |

### 方案 B：干净切换（✅ 推荐）

**策略**：`schema-v3.0.0` 作为唯一活跃 schema，直接替换当前 phase/status 体系。**不做历史逻辑兼容** — 旧 schema（v1.2.5、v2.0.0）只读保留不作转换。**不做增量过渡** — machine、loader、validator 等模块直接切到新模型。**schema 版本升级问题由 R5 一致性检测机制解决** — 用户安装新版后执行 `@sddu 状态` 时自动发现旧格式 state.json，请示用户后修复。

| 维度 | 说明 |
|------|------|
| **改动范围** | ~85 个文件（含测试、fixtures、脚本、文档），核心源码 ~33 个 |
| **风险** | 中（干净切换，无新旧逻辑并存，但需充分测试） |
| **工作量** | MVP: 6-8 天, V1: +3-4 天, V2: +2 天 = 总计 11-14 天 |
| **优点** | 1) 无历史包袱，代码一致性强；2) 无双宇宙映射残留；3) schema 升级问题统一由 R5 处理，不与核心逻辑耦合；4) 后续维护成本低 |
| **缺点** | 1) 需同步修改测试/fixtures/脚本/示例（量大但机械）；2) 需充分回归测试 |

### 方案 C：适配器层

**策略**：新建 `state-adapter.ts` 适配器层，将新的 phase + status 模型翻译为旧格式。旧模块不做任何修改。

| 维度 | 说明 |
|------|------|
| **改动范围** | ~5 个文件修改 + 1 个文件新建 |
| **风险** | 低（不触碰核心逻辑） |
| **工作量** | MVP: 3-4 天 |
| **优点** | 风险极低；改动最小；快速上线 |
| **缺点** | 增加新映射层而非消除旧的；suspended/terminated/merged 无法正确映射；长期维护负担重 |

### 选择方案 B 的理由

1. **符合用户决策** — 「不做增量渐进式修改，不做历史逻辑兼容」
2. **职责清晰** — schema 只管规范，升级兼容交给 R5，各司其职
3. **代码干净** — 一次切换到位，无新旧并存期，无适配器层
4. **维护成本低** — 后续只有一个 schema 版本活跃，不会累积历史包袱

---

## 3. 详细技术设计

### 3.1 R1: 两字段模型落地 (FR-001 ~ FR-002)

#### 3.1.1 Schema v3.0.0 定义

新建 `src/state/schema-v3.0.0.ts`：

```typescript
// State Schema v3.0.0
// Two-field model: phase (8 stages) + status (5 flow states), completely independent

// === Phase (8 stages, all -ed form) ===
export type Phase =
  | 'registered'   // Feature registered, awaiting discovery
  | 'discovered'   // Discovery completed
  | 'specified'    // Specification completed
  | 'planned'      // Planning completed
  | 'tasked'       // Task breakdown completed
  | 'builded'      // Build/implementation completed
  | 'reviewed'     // Review completed
  | 'validated';   // Validation completed

// === Status (5 flow states) ===
export type FeatureStatus =
  | 'tracked'      // Normal tracking, in flow (default for new features)
  | 'completed'    // Completed (auto-set when phase reaches validated)
  | 'suspended'    // Suspended, may resume (user-marked)
  | 'terminated'   // Permanently terminated, irreversible (user-marked)
  | 'merged';      // Merged into another feature, irreversible (user-marked)

// === Phase history record ===
export interface PhaseHistoryEntry {
  phase: Phase;
  timestamp: string;       // ISO timestamp
  triggeredBy: string;     // Triggering Agent or 'user'
  comment?: string;        // Optional comment
}

// === Suspended optional fields ===
export interface SuspendedInfo {
  suspendedUntil?: string;  // ISO date string for expiry reminder
  suspendedNote?: string;   // Reason for suspension
}

// === Merged required fields ===
export interface MergedInfo {
  mergedInto: string;       // Target feature name (required)
  mergedAt: string;         // ISO timestamp of merge
}

// === Child feature info in tree structure ===
export interface ChildFeatureInfoV3 {
  path: string;
  featureName: string;
  phase: Phase;
  status: FeatureStatus;
  lastModified: string;
}

// === StateV3_0_0: the canonical state format ===
export interface StateV3_0_0 {
  // Identity
  feature: string;          // Feature ID (required)
  name?: string;            // Human-readable name (optional)
  version: 'v3.0.0';       // Schema version (required)

  // Two-field model
  phase: Phase;             // SDDU stage (required, 1 of 8 values)
  status: FeatureStatus;    // Flow state (required, 1 of 5 values)

  // Suspended/Merged metadata
  suspended?: SuspendedInfo;  // Only when status === 'suspended'
  merged?: MergedInfo;        // Only when status === 'merged'

  // Tree structure
  depth: number;            // Tree depth (0 for root-level features in specs-tree-root)
  childrens?: ChildFeatureInfoV3[];  // Direct children

  // Phase history
  phaseHistory: PhaseHistoryEntry[];

  // Dependencies
  dependencies: {
    on: string[];           // Features this depends on
    blocking: string[];     // Features blocked by this feature
  };

  // File references
  files: {
    discovery?: string;
    spec: string;
    plan?: string;
    tasks?: string;
    readme?: string;
    review?: string;
    validation?: string;
  };

  // Metadata
  metadata?: {
    priority?: string;      // P0/P1/P2
    featureId?: string;
    createdAt?: string;
    updatedAt?: string;
  };

  // General history
  history?: Array<{
    timestamp: string;
    from?: string;
    to?: string;
    triggeredBy?: string;
    comment?: string;
  }>;
}

// === Valid phase values ===
export const VALID_PHASES: Phase[] = [
  'registered', 'discovered', 'specified', 'planned',
  'tasked', 'builded', 'reviewed', 'validated'
];

// === Valid status values ===
export const VALID_STATUSES: FeatureStatus[] = [
  'tracked', 'completed', 'suspended', 'terminated', 'merged'
];

// === Phase ordering (for monotonic validation) ===
export const PHASE_ORDER: Record<Phase, number> = {
  'registered': 0,
  'discovered': 1,
  'specified': 2,
  'planned': 3,
  'tasked': 4,
  'builded': 5,
  'reviewed': 6,
  'validated': 7
};

// === Next phase mapping ===
export const NEXT_PHASE: Partial<Record<Phase, Phase>> = {
  'registered': 'discovered',
  'discovered': 'specified',
  'specified': 'planned',
  'planned': 'tasked',
  'tasked': 'builded',
  'builded': 'reviewed',
  'reviewed': 'validated'
  // 'validated' has no next phase
};

// === Irreversible statuses ===
export const IRREVERSIBLE_STATUSES: FeatureStatus[] = [
  'completed', 'terminated', 'merged'
];

// === Validation function ===
export function validateStateV3(state: any): state is StateV3_0_0 {
  if (!state || typeof state !== 'object') return false;
  if (state.version !== 'v3.0.0') return false;
  if (typeof state.feature !== 'string' || !state.feature) return false;
  if (!VALID_PHASES.includes(state.phase)) return false;
  if (!VALID_STATUSES.includes(state.status)) return false;

  // Combined constraints
  if (state.status === 'completed' && state.phase !== 'validated') {
    console.error('status=completed is only valid when phase=validated');
    return false;
  }
  if (state.status === 'merged' && (!state.merged || !state.merged.mergedInto)) {
    console.error('status=merged requires merged.mergedInto field');
    return false;
  }
  if (typeof state.depth !== 'number' || state.depth < 0) return false;
  if (!Array.isArray(state.phaseHistory)) return false;
  if (!state.files || typeof state.files.spec !== 'string') return false;
  if (!state.dependencies || !Array.isArray(state.dependencies.on) || !Array.isArray(state.dependencies.blocking)) return false;

  return true;
}

// === Recommend continue? ===
export function shouldRecommendContinue(phase: Phase, status: FeatureStatus): boolean {
  return status === 'tracked' && phase !== 'validated';
}

// === Get next recommended phase (null if should not continue) ===
export function getNextRecommendedPhase(phase: Phase, status: FeatureStatus): Phase | null {
  if (!shouldRecommendContinue(phase, status)) return null;
  return NEXT_PHASE[phase] || null;
}
```

#### 3.1.2 Machine 简化

`src/state/machine.ts` 核心变更：

```typescript
// ❌ 删除 — 不再需要双宇宙映射
// - FeatureStateEnum (9 internal states)
// - OldFeatureStateEnum
// - AgentWorkflowStateEnum
// - mapInternalStateToWorkflowStatus()
// - mapFeatureStateToInternal()
// - getStatePhase() — replaced by PHASE_ORDER lookup

// ✅ 简化 getNextStep()
async getNextStep(featurePath: string): Promise<{ phase: Phase; action: string } | null> {
  const feature = await this.getState(featurePath);
  if (!feature) return null;
  
  const { phase, status } = feature as StateV3_0_0;
  const nextPhase = getNextRecommendedPhase(phase, status);
  if (!nextPhase) return null;
  
  const actionMap: Record<Phase, string> = {
    'registered': '@sddu discovery [feature]',
    'discovered': '@sddu spec [feature]',
    'specified': '@sddu plan [feature]',
    'planned': '@sddu tasks [feature]',
    'tasked': '@sddu build [feature]',
    'builded': '@sddu review [feature]',
    'reviewed': '@sddu validate [feature]',
    'validated': '已完成'
  };
  
  return { phase: nextPhase, action: actionMap[nextPhase] };
}

// ✅ 简化 validateStageTransition() — 基于 phase 顺序而非内部状态枚举
async validateStageTransition(featurePath: string, targetPhase: Phase): Promise<TransitionResult> {
  const current = await this.getState(featurePath);
  if (!current) return { allowed: false, reason: 'Feature 不存在' };
  
  const { phase: currentPhase, status } = current as StateV3_0_0;
  
  // Phase 顺序检查
  const currentOrder = PHASE_ORDER[currentPhase] ?? -1;
  const targetOrder = PHASE_ORDER[targetPhase] ?? -1;
  
  if (targetOrder <= currentOrder) {
    return { allowed: false, reason: `Phase 流转单向不可逆 (${currentPhase} → ${targetPhase})` };
  }
  if (targetOrder > currentOrder + 1) {
    const nextPhase = NEXT_PHASE[currentPhase];
    return {
      allowed: false,
      reason: `Phase 必须按序推进，当前为 ${currentPhase}，下一步为 ${nextPhase}`,
      missingStages: [{ state: nextPhase || 'unknown', name: nextPhase || 'unknown' }]
    };
  }
  
  return { allowed: true };
}

// ✅ 简化 updateState() — 直接使用 Phase 而非映射
async updateState(featurePath: string, targetPhase: Phase, ...): Promise<StateV3_0_0> {
  // ...
  updatedState.phase = targetPhase;
  
  // FR-006: phase 到达 validated 时自动设 status 为 completed
  if (targetPhase === 'validated' && updatedState.status === 'tracked') {
    updatedState.status = 'completed';
  }
  
  // ...
}

// ❌ 删除 validTransitions（基于 FeatureStateEnum）
// ❌ 删除 requiredFiles（改用更简单的 phase → files 映射）
```

#### 3.1.3 StateLoader 适配

`src/state/state-loader.ts` 核心变更：

```typescript
// create() — 使用新字段
public async create(featurePath: string, initialState: Partial<StateV3_0_0>): Promise<boolean> {
  const now = new Date().toISOString();
  const computedDepth = this.computeDepth(featurePath);
  
  const completeState: StateV3_0_0 = {
    feature: initialState.feature || featurePath,
    name: initialState.name,
    version: 'v3.0.0',
    phase: initialState.phase || 'registered',       // 🆕 默认 registered
    status: initialState.status || 'tracked',         // 🆕 默认 tracked
    depth: initialState.depth ?? computedDepth,
    phaseHistory: initialState.phaseHistory || [{
      phase: initialState.phase || 'registered',
      timestamp: now,
      triggeredBy: 'StateLoader.create'
    }],
    files: {
      spec: initialState.files?.spec || '',
      ...initialState.files
    },
    dependencies: {
      on: initialState.dependencies?.on || [],
      blocking: initialState.dependencies?.blocking || []
    },
    childrens: initialState.childrens || [],
    // don't auto-set status=completed — that's the machine's job
  };
  
  // FR-005: validate before writing
  if (!validateStateV3(completeState)) {
    throw new Error('Created state fails v3.0.0 validation');
  }
  
  // write...
}
```

### 3.2 R2: Status 过滤 (FR-003)

修改位置：`agents/sddu.md`（通过模板 `sddu.md.hbs`）

```
当输出 @sddu 状态 时，只推荐 status === "tracked" && phase !== "validated" 的
特性继续。非 tracked 特性不出现在操作建议区，不参与活跃统计计数。
```

实现方式：agent 模板中增加明确的过滤规则指引（Agent 在运行时按规则执行，而非硬编码关键词匹配）。

### 3.3 R3: 子随父归 (FR-004)

修改位置：`src/state/tree-scanner.ts` + `agents/sddu.md`

**TreeScanner 增强**：

```typescript
// tree-scanner.ts 新增导出
export interface DisplayContext {
  effectiveParent: string | null;  // 最终归属的父节点路径
  isIndependent: boolean;          // 是否独立显示
}

export function resolveDisplayContext(
  featurePath: string,
  allStates: Map<string, StateV3_0_0>,
  treeNodes: Map<string, FeatureTreeNode>
): DisplayContext {
  // 向上查找第一个非 tracked 祖先
  let current = featurePath;
  while (true) {
    const node = treeNodes.get(current);
    if (!node || !node.parent) break;
    
    const parentPath = path.relative(process.cwd(), node.parent);
    const parentState = allStates.get(parentPath);
    
    if (parentState && parentState.status !== 'tracked') {
      return {
        effectiveParent: parentPath,
        isIndependent: false
      };
    }
    
    current = parentPath;
  }
  
  return { effectiveParent: null, isIndependent: true };
}
```

### 3.4 R5: 一致性检测（内置升级机制）(FR-007 ~ FR-008)

新建 `src/state/consistency-checker.ts`（全新模块，~300 行）：

```typescript
// ConsistencyChecker — 版本升级一致性检测 + 修复引擎

export interface ConsistencyAnomaly {
  type: 'missing_state_json' | 'hidden_state_file' | 'invalid_root_reference'
      | 'field_mixing' | 'non_standard_status' | 'missing_field'
      | 'combined_constraint_violation' | 'invalid_phase' | 'invalid_status';
  path: string;
  detail: string;
  severity: 'error' | 'warning';
  repairable: boolean;
}

export interface ConsistencyReport {
  pluginVersion: string;
  lastCheckedVersion?: string;
  checkedAt: string;
  totalFeatures: number;
  anomalies: ConsistencyAnomaly[];
  repaired: ConsistencyAnomaly[];
  failed: ConsistencyAnomaly[];
}

export class ConsistencyChecker {
  private pluginVersion: string;
  private lastCheckedVersion: string | null;

  constructor(pluginVersion: string) {
    this.pluginVersion = pluginVersion;
    this.lastCheckedVersion = this.loadLastCheckedVersion();
  }

  // 是否需要触发检测
  needsCheck(): boolean {
    return this.lastCheckedVersion !== this.pluginVersion;
  }

  // 全量检测
  async checkAll(specsRootDir: string): Promise<ConsistencyReport> {
    const report: ConsistencyReport = {
      pluginVersion: this.pluginVersion,
      checkedAt: new Date().toISOString(),
      totalFeatures: 0,
      anomalies: [],
      repaired: [],
      failed: []
    };

    // 1. 扫描树结构
    const scanResult = await scanTreeStructure(specsRootDir);
    report.totalFeatures = scanResult.nodes.length;

    // 2. 对每个 feature 执行 7 项检测
    for (const [featurePath, node] of scanResult.flatMap) {
      const anomalies = await this.checkFeature(featurePath, node, scanResult);
      report.anomalies.push(...anomalies);
    }

    // 3. 检测根引用失效
    const rootAnomalies = await this.checkRootReferences(specsRootDir);
    report.anomalies.push(...rootAnomalies);

    // 4. 保存检测记录
    this.saveLastCheckedVersion(this.pluginVersion);

    return report;
  }

  // 对单个 feature 的 7 项检测
  private async checkFeature(
    featurePath: string,
    node: FeatureTreeNode,
    scanResult: ScanResult
  ): Promise<ConsistencyAnomaly[]> {
    const anomalies: ConsistencyAnomaly[] = [];
    const stateFilePath = path.join(featurePath, 'state.json');
    const hiddenStatePath = path.join(featurePath, '.state.json');

    // 检测 1: 缺失 state.json
    // 检测 2: 隐藏 state 文件 (.state.json)
    // 检测 3: 字段命名混用（使用 state 而非 phase）
    // 检测 4: 非标 phase 值
    // 检测 5: 非标 status 值
    // 检测 6: 缺少 phase 或 status 字段
    // 检测 7: 组合约束违反（completed 不在 validated）

    // ...详细实现见 tasks 阶段
    return anomalies;
  }

  // 执行修复（需用户确认后调用）
  async repair(anomalies: ConsistencyAnomaly[], specsRootDir: string): Promise<{
    repaired: ConsistencyAnomaly[];
    failed: ConsistencyAnomaly[];
  }> {
    const repaired: ConsistencyAnomaly[] = [];
    const failed: ConsistencyAnomaly[] = [];

    for (const anomaly of anomalies) {
      try {
        await this.repairOne(anomaly, specsRootDir);
        repaired.push(anomaly);
      } catch (e) {
        failed.push(anomaly);
      }
    }

    return { repaired, failed };
  }

  // FR-008: 修复时不覆盖非 tracked 的 status
  private async repairOne(anomaly: ConsistencyAnomaly, specsRootDir: string): Promise<void> {
    const state = await this.loadState(anomaly.path);
    
    switch (anomaly.type) {
      case 'field_mixing':
        // 将 state 字段迁移为 phase，保留已有 status
        if (state.status && VALID_STATUSES.includes(state.status)) {
          // FR-008: 已有非 tracked 的 status，保留不覆盖
          state.phase = this.inferPhase(state.state);
          // status 保持不变
        }
        delete state.state;
        break;
      case 'missing_field':
        if (!state.phase) state.phase = this.inferPhase(state.status || state.state);
        if (!state.status) state.status = 'tracked';  // 仅当 status 不存在时才设 tracked
        break;
      // ...其他修复类型
    }
    
    await this.saveState(anomaly.path, state);
  }

  // ...辅助方法
}
```

**版本号存储方案（Q-001）**：

```typescript
// 版本号存储于 .sddu/.consistency-state.json
interface ConsistencyState {
  pluginVersion: string;
  lastCheckedAt: string;
  lastCheckResult: 'clean' | 'anomalies_found' | 'repair_needed';
  anomalyCount: number;
}
```

### 3.5 R6: @sddu 标记 命令 (FR-009)

修改位置：`agents/sddu.md`（通过模板 `sddu.md.hbs`）

**命令格式**：
```
@sddu 标记 <feature> <status> [options]
  suspended  [--until <YYYY-MM-DD>] [--note <text>]
  terminated
  merged     --into <target-feature>
  tracked    (从 suspended 恢复)
```

**自然语言推导原则**：AI 时代不做关键词映射表。在 agent prompt 中说明推导原则：
- 根据用户自然语言输入的语义理解真实意图（status、feature 名称、附加参数）
- 推导结果在执行前向用户确认
- terminated/merged 操作需要用户二次确认（不可逆）
- merged 缺少 --into 参数时报错

**三处同步**：标记后需同步更新：
1. 目标 Feature 的 `state.json`
2. root `state.json`（如果涉及根引用）
3. 对应 `README.md` 的状态标注

### 3.6 R7: @sddu 状态 分类输出 (FR-010)

修改位置：`agents/sddu.md`（通过模板 `sddu.md.hbs`）

**分区结构**（6 区仪表盘）：

| 分区 | 图标 | 筛选条件 | 展示内容 |
|------|------|----------|----------|
| 🟢 进行中 | 🟢 | `status: "tracked"` 且 `phase !== "validated"` | 当前 phase、下一步建议 |
| ✅ 已完成 | ✅ | `status: "completed"` 或 `phase: "validated"` 且 `status: "tracked"` | 完成时间 |
| 🟡 搁置 | 🟡 | `status: "suspended"` | suspendedUntil、suspendedNote、搁置时长 |
| 🔴 终止 | 🔴 | `status: "terminated"` | 终止时间 |
| 🔵 迁出 | 🔵 | `status: "merged"` | 目标特性 (mergedInto) |
| ⚠️ 异常 | ⚠️ | 缺失 state.json / 字段违规 / 引用失效等 | 异常类型、具体描述 |

### 3.7 R8: 智能引导 (FR-010b)

修改位置：`agents/sddu.md`（通过模板 `sddu.md.hbs`）

在 `@sddu 状态` 输出末尾附加智能引导清单，包括：
- 进行中特性 → 下一阶段操作建议
- 搁置特性 → 恢复建议
- 异常特性 → 修复建议
- 全部完成 → `@sddu roadmap` 建议

推导原则：AI 时代不做规则表，基于语义理解推导真实意图。

### 3.8 R9: 父特性聚合展示 (FR-011)

修改位置：`agents/sddu.md`（通过模板 `sddu.md.hbs`）

父特性（`isParent: true`）根据所有子特性的 phase 进度聚合展示：
- 子特性总数
- 各 phase 分布统计（如: 3 specified, 2 tasked, 1 builded）
- 最高完成度（子特性中最靠后的 phase）
- 最低完成度（子特性中最靠前的 phase）

### 3.9 R10: Suspended 到期被动提醒 (FR-012)

修改位置：`agents/sddu.md`（通过模板 `sddu.md.hbs`）

用户执行 `@sddu 状态` 时：
1. 扫描所有 `status: "suspended"` 且含 `suspendedUntil` 字段的特性
2. 比较 `suspendedUntil` 与当前日期
3. 已到期 → 在输出中带提醒标记，包含确认选项（恢复 / 继续搁置 / 终止）
4. 未到期 → 不提醒
5. 无 `suspendedUntil` → 不做到期提醒

### 3.10 V2 特性 (FR-013 ~ FR-014)

FR-013（长期停滞检测）和 FR-014（merged 跳转追溯）为 Nice to Have，V2 实现。详见 spec.md 第 4.3 节。技术方案简要：

- **FR-013**: 在 `consistency-checker.ts` 中新增停滞检测逻辑，阈值可配置（默认 30 天），在 `@sddu 状态` 输出中展示
- **FR-014**: 在 `@sddu 状态` 输出中，merged 特性展示可跳转链接格式 `🔵 迁出 → specs-tree-other-feature`

---

## 4. 文件影响分析

### 4.1 新建文件

| 文件 | 行数预估 | 对应 FR | 说明 |
|------|----------|---------|------|
| `src/state/schema-v3.0.0.ts` | ~200 行 | FR-001, FR-005, FR-006 | phase(8) + status(5) 联合 schema，含验证、推导、常量 |
| `src/state/consistency-checker.ts` | ~350 行 | FR-007, FR-008 | R5 一致性检测 + 修复引擎 |
| `src/state/__tests__/schema-v3.0.0.test.ts` | ~150 行 | FR-001, FR-005 | Schema v3.0.0 单元测试 |
| `src/state/__tests__/consistency-checker.test.ts` | ~120 行 | FR-007, FR-008 | 一致性检测器单元测试 |

### 4.2 修改文件

> **注意**：下表仅列出核心源码文件（17 个）。全项目扫描表明实际受影响的文件约 **85 个**（含测试文件 ~33 个、测试 fixtures ~7 个、E2E 脚本 ~6 个、examples ~5 个、文档 ~4 个、模板 ~2 个等）。此处聚焦架构核心，完整清单见 discovery.md §4.3 及全项目扫描报告。

| 文件 | 改动等级 | 对应 FR | 变更说明 |
|------|----------|---------|----------|
| `src/state/machine.ts` | 🔴 重大 | FR-001, FR-002, FR-006 | 删除 FeatureStateEnum 双宇宙映射；拆为 phase + status 直接驱动；FR-006 自动 completed |
| `src/state/state-loader.ts` | 🟡 中等 | FR-001 | create/get/set 适配 phase + status；默认值改为 registered/tracked |
| `src/state/tree-scanner.ts` | 🟡 中等 | FR-003, FR-004 | 新增 resolveDisplayContext() — 子随父归逻辑；扫描时读取 status |
| `src/state/tree-state-validator.ts` | 🟡 中等 | FR-005 | 更新校验规则为 phase(8) + status(5)；新增组合约束校验 |
| `src/state/auto-updater.ts` | 🟡 中等 | FR-001, FR-003 | 文件→phase 推导；跳过非 tracked 特性 |
| `src/state/dependency-checker.ts` | 🟢 轻量 | FR-001 | 移除双宇宙映射；直接使用 phase |
| `src/state/parent-state-manager.ts` | 🟢 轻量 | FR-001 | childrens 记录 status 字段 |
| `src/state/migrator.ts` | 🟡 中等 | FR-007 | 新增 v2.x → v3.0.0 迁移路径 |
| `src/state/types.ts` | 🟡 中等 | FR-001 | 更新类型导出 |
| `src/state/index.ts` | 🟢 轻量 | FR-007 | 导出 ConsistencyChecker |
| `src/templates/agents/sddu.md.hbs` | 🔴 重大 | FR-003, FR-004, FR-009, FR-010, FR-010b, FR-011, FR-012 | 分类仪表盘 + 标记命令 + 子随父归 + 智能引导 + 到期提醒 |
| `src/templates/agents/sddu-docs.md.hbs` | 🟡 中等 | FR-010 | README 中按 status 标注对应标记 |
| `src/templates/agents/output/sddu-plan.md.hbs` | 🟢 轻量 | — | phase/status 变量适配 |
| `src/templates/subfeature-templates.ts` | 🟢 轻量 | FR-001 | 适配新字段 |
| `src/utils/readme-generator.ts` | 🟢 轻量 | FR-010 | status 标注 |
| `src/agents/sddu-agents.ts` | 🟡 中等 | FR-002 | 更新 agent→phase 映射表 |
| `src/types.ts` | 🟢 轻量 | FR-001 | 导出新类型 |
| `package.json` | 🟢 轻量 | — | 版本号 bump（用于 R5 检测） |

### 4.3 全项目扫描发现的其他受影响文件

以下模块/文件在 spec 定义的直接关联之外，经全项目扫描确认也需修改：

| 类别 | 关键文件 | 原因 |
|------|---------|------|
| **测试** | `src/state/machine.test.ts`、`migrator.test.ts`、`schema-*.test.ts`、`tree-state-validator.test.ts`、`state-loader.test.ts`、`multi-feature-manager.test.ts`、`dependency-checker.test.ts`、`auto-updater.test.ts` 等约 33 个 | 全部使用旧 phase/status 值，需更新测试数据和断言 |
| **测试 fixtures** | `tests/fixtures/legacy-v1.1.1/state.json`、`multi-feature/*/state.json`（7 个） | 旧格式 JSON，需迁移至新 schema |
| **类型系统** | `src/types.ts`、`src/state/types.ts` | 重新导出旧类型，需同步更新 |
| **迁移模块** | `src/state/migrator.ts`、`src/state/migrate-v1-to-v2.ts`、`src/commands/sddu-migrate-schema.ts` | 旧格式迁移映射需更新 |
| **子特性管理** | `src/utils/subfeature-manager.ts` | 创建 state.json 时使用旧字段 |
| **父状态管理** | `src/state/parent-state-manager.ts` | 读取子特性 phase/status 字段 |
| **E2E 脚本** | `scripts/e2e/basic/sddu-e2e.sh`、`scripts/e2e/tree-scenario/setup.sh`、`scripts/e2e/fullstack/sddu-e2e-fullstack.sh` 等 | 创建和验证 state.json 使用旧格式 |
| **Examples** | `examples/tree-structure-demo/` 下所有 `state.json`（5 个） | 示例数据需更新 |
| **文档** | `docs/state-schema-v2.0.0.md`、`docs/migration-guide.md`、`docs/containerization-faq.md` 等 | 引用旧 schema 和命令 |
| **插件入口** | `src/index.ts` | `sddu_update_state` 工具 + `@sddu 状态/标记` 命令 |
| **Agent 定义** | `src/agents/sddu-agents.ts` | agent→state 映射表 |
| **Discovery** | `src/discovery/state-validator.ts`、`src/discovery/workflow-engine.ts` | 使用旧 FeatureStateEnum |
| **构建脚本** | `build-agents.cjs` | agent 映射可能需更新 |
| **变更日志** | `CHANGELOG.md`、`RELEASE-NOTES.md` | 记录破坏性变更 |

### 4.4 不修改文件（确认无需修改）

| 文件 | 说明 |
|------|------|
| `src/state/schema-v1.2.5.ts` | 保留作为旧版本参考，不删除不修改 |
| `src/state/schema-v2.0.0.ts` | 保留作为旧版本参考，不删除不修改 |
| `src/state/tree-scanner.ts` | 纯目录扫描，无状态模型依赖 |
| `src/discovery/coaching-mode.ts` | 无状态引用 |
| `src/agents/registry.ts` | 纯 agent 注册，无状态模型依赖

### 4.5 非直接修复范畴（R5 自动处理）

以下文件/目录不在本 feature 代码中直接修改，但 R5 一致性检测会自动发现和修复问题：

- `.opencode/*` — 运行时产物
- `.sddu/*` — 用户项目状态数据（除本 feature 自身外）
- `opencode.json` — OpenCode 配置

---

## 5. 数据流设计

### 5.1 Feature 创建数据流（新）

```
用户发起创建 Feature
        │
        ▼
┌─────────────────────┐
│  StateMachine       │
│  createFeature()    │
│  initialState:      │
│    phase: 'registered'│  ← 🆕 默认 phase = registered
│    status: 'tracked' │  ← 🆕 默认 status = tracked
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  StateLoader        │
│  create()           │
│  - 计算 depth       │
│  - 初始化           │
│    phaseHistory     │
│  - 校验 v3.0.0      │  ← 🆕 validateStateV3()
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  写入 state.json     │
│  version: v3.0.0    │
│  phase: registered  │
│  status: tracked    │
└─────────────────────┘
```

### 5.2 Phase 推进 + completed 自动设置 (FR-002 + FR-006)

```
Agent 完成（如 @sddu-spec 完成）
        │
        ▼
┌─────────────────────────┐
│  sddu_update_state tool │
│  targetPhase: 'specified'│
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  StateMachine           │
│  updateState()          │
│  1. 验证 phase 单向推进  │
│  2. 设置 phase          │
│  3. FR-006: 检测        │
│     phase===validated   │
│     && status===tracked │
│     → status=completed  │  ← 🆕 自动完成
│  4. 写入 state.json     │
└─────────────────────────┘
```

### 5.3 @sddu 标记 数据流 (FR-009)

```
用户: @sddu 标记 foo suspended --until 2027-03-01 --note "等依赖"
        │
        ▼
┌─────────────────────────────┐
│  sddu Agent                 │
│  1. 推导意图 → suspended    │
│  2. 确认（不可逆操作需二次） │
│  3. 三处同步:               │
│     a) foo/state.json       │
│        status='suspended'   │
│        suspendedUntil=...   │
│        suspendedNote=...    │
│     b) root state.json      │
│        (如果涉及根引用)      │
│     c) foo/README.md        │
│        添加搁置标记         │
└─────────────────────────────┘
```

### 5.4 R5 一致性检测数据流 (FR-007)

```
插件版本升级 (package.json version bump)
        │
        ▼
用户首次执行 @sddu 状态
        │
        ▼
┌─────────────────────────┐
│  ConsistencyChecker     │
│  needsCheck() → true    │
│  (lastCheckedVersion    │
│   !== pluginVersion)    │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  checkAll()             │
│  扫描所有 state.json    │
│  执行 7 项检测:         │
│  1. 缺失 state.json     │
│  2. 隐藏 .state.json    │
│  3. 根引用失效          │
│  4. 字段命名混用        │
│  5. 非标 phase/status   │
│  6. 缺少 phase/status   │
│  7. 组合约束违反        │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  输出异常列表           │
│  请示用户: 是否修复?    │
└────────────┬────────────┘
             │
    ┌────────┴────────┐
    ▼                 ▼
  同意              拒绝
    │                 │
    ▼                 ▼
┌──────────┐    ┌──────────┐
│ 修复执行 │    │ 标记为   │
│ FR-008:  │    │ "已知待  │
│ 保护非   │    │ 处理"    │
│ tracked  │    └──────────┘
│ status   │
└────┬─────┘
     │
     ▼
┌──────────┐
│ 输出修复 │
│ 报告     │
└──────────┘
```

---

## 6. 接口设计

### 6.1 新增公开 API

#### ConsistencyChecker

```typescript
export class ConsistencyChecker {
  constructor(pluginVersion: string);

  needsCheck(): boolean;
  checkAll(specsRootDir: string): Promise<ConsistencyReport>;
  repair(anomalies: ConsistencyAnomaly[], specsRootDir: string): Promise<{
    repaired: ConsistencyAnomaly[];
    failed: ConsistencyAnomaly[];
  }>;
  getLastCheckResult(): ConsistencyState | null;
}
```

#### Schema v3.0.0 公开函数

```typescript
export function validateStateV3(state: any): state is StateV3_0_0;
export function shouldRecommendContinue(phase: Phase, status: FeatureStatus): boolean;
export function getNextRecommendedPhase(phase: Phase, status: FeatureStatus): Phase | null;
export function isStatusReversible(currentStatus: FeatureStatus, targetStatus: FeatureStatus): boolean;
```

### 6.2 修改已有 API

#### StateMachine

```typescript
// 修改前
getNextStep(featurePath: string): Promise<{ state: string; action: string } | null>
updateState(featurePath: string, newState: FeatureStateEnum, ...): Promise<FeatureWithFullHistory>

// 修改后
getNextStep(featurePath: string): Promise<{ phase: Phase; action: string } | null>
updateState(featurePath: string, targetPhase: Phase, data?: any, triggeredBy?: string, comment?: string, skipValidation?: boolean): Promise<StateV3_0_0>
```

#### StateLoader

```typescript
// create() — 初始值变更
// 修改前: status: 'specified', phase: 1
// 修改后: phase: 'registered', status: 'tracked'
```

### 6.3 删除的 API

```typescript
// 从 machine.ts 删除:
- FeatureStateEnum        // 9 状态枚举 — 被 Phase + FeatureStatus 替代
- OldFeatureStateEnum      // 旧状态枚举
- AgentWorkflowStateEnum   // Agent 状态枚举
- mapInternalStateToWorkflowStatus()  // 映射函数 — 不再需要
- mapFeatureStateToInternal()         // 映射函数 — 不再需要
- getStatePhase()          // phase 查询 — 被 PHASE_ORDER 替代
```

---

## 7. 测试策略

### 7.1 测试原则

1. **全量覆盖**：约有 33 个测试文件需同步更新（详见 §4.3），采用批量机械修改 + 关键场景手动验证的组合策略
2. **先测后改**：schema-v3.0.0 先编写测试 → 再实现 schema → 再修改下游模块 → 跑全量回归
3. **每 FR 独立验证**：每个 FR 有对应的测试用例，可独立运行验证

### 7.2 单元测试

#### 7.2.1 Schema v3.0.0 (`src/state/__tests__/schema-v3.0.0.test.ts`，新建)

**测试命令**：`npx jest src/state/__tests__/schema-v3.0.0.test.ts`

| 用例 | 输入 | 预期结果 |
|------|------|----------|
| 合法 phase + status | `{ phase: "specified", status: "tracked" }` | validate 通过 |
| 合法终态 | `{ phase: "validated", status: "completed" }` | validate 通过 |
| 合法搁置 | `{ phase: "planned", status: "suspended", suspendedUntil: "2027-01-01" }` | validate 通过 |
| 非法 phase 值 | `{ phase: "unknown", status: "tracked" }` | validate 失败，错误信息指明 phase 不在合法集合 |
| 非法 status 值 | `{ phase: "specified", status: "unknown" }` | validate 失败，错误信息指明 status 不在合法集合 |
| 缺少 phase 字段 | `{ status: "tracked" }` | validate 失败 |
| 缺少 status 字段 | `{ phase: "specified" }` | validate 失败 |
| merged 缺 mergedInto | `{ phase: "planned", status: "merged" }` | validate 失败（merged 必须含 mergedInto） |
| shouldRecommendContinue | `{ phase: "specified", status: "tracked" }` | 返回 true + 下一步 "planned" |
| shouldRecommendContinue | `{ phase: "specified", status: "suspended" }` | 返回 false |
| shouldRecommendContinue | `{ phase: "validated", status: "completed" }` | 返回 false |

#### 7.2.2 StateMachine (`src/state/machine.test.ts`，更新)

**测试命令**：`npx jest src/state/machine.test.ts`

前置条件：使用 `npm test -- --testPathPattern="machine"` 可跑全部 machine 相关测试（含 `__tests__/machine.test.ts`）

| 用例 | 操作 | 预期结果 |
|------|------|----------|
| 创建 feature | `createFeature(...)` | phase="registered", status="tracked" |
| 顺序推进 | `registered → discovered → specified → planned → tasked → builded → reviewed → validated` | 每步成功，phase 正确 |
| 回退拒绝 | `specified → discovered` | 抛出 PhaseReversalError |
| 跳跃拒绝 | `registered → planned` | 抛出 PhaseSkipError |
| completed 自动设置 | phase 到达 validated 时 status=tracked | status 自动变为 completed |
| completed 不覆盖 | phase 到达 validated 时 status=suspended | status 保持 suspended |
| getNextStep | phase="specified", status="tracked" | 返回 "planned" |
| getNextStep | phase="specified", status="suspended" | 返回 null |
| getNextStep | phase="validated", status="completed" | 返回 null |

#### 7.2.3 ConsistencyChecker (`src/state/__tests__/consistency-checker.test.ts`，新建)

**测试命令**：`npx jest src/state/__tests__/consistency-checker.test.ts`

| 用例 | 场景 | 预期结果 |
|------|------|----------|
| 无异常 | 全部 state.json 符合 v3.0.0 规则 | issues 列表为空 |
| 缺失 state.json | 目录存在但无 state.json | 报告 "missing_state_json"，建议修复 |
| 隐藏文件 | 存在 `.state.json` | 报告 "hidden_state_file" |
| 字段混用 | state.json 使用 `state` 字段（旧格式） | 报告 "field_mixing" |
| 非标 status | status 值不在 5 个合法值内 | 报告 "non_standard_status" |
| 修复确认 | 用户同意修复 | 按新规则重写 state.json，输出变更报告 |
| 修复拒绝 | 用户拒绝修复 | 不修改，仅保留异常报告 |
| 版本比较 | 插件版本号变更 | 触发检测 |
| 版本相同 | 同版本第二次调用 | 不触发检测 |
| 不覆盖非 tracked | 修复 phase 时 status=suspended | status 保持 suspended |

### 7.3 集成测试

**测试命令**：`npx jest tests/integration/` 和 `npx jest tests/state/`

#### 7.3.1 两字段模型端到端 (`tests/state/agent-integration.test.ts`，更新)

| 用例 | 验证内容 |
|------|----------|
| 完整生命周期 | 创建 → discovery → spec → plan → tasks → build → review → validate → completed |
| 中途搁置 | 创建 → discovery → spec → suspended → 恢复 → plan → ... |
| 中途终止 | 创建 → discovery → terminated（不可逆） |
| 中途合并 | 创建 → discovery → spec → merged → into=other（不可逆） |

#### 7.3.2 状态过滤与子随父归 (`tests/integration/tree-workflow.test.ts`，更新)

| 用例 | 验证内容 |
|------|----------|
| tracked 子特性 | 在"进行中"分区出现 |
| suspended 父特性 | 父 + 子均不在"进行中"分区，归于"搁置"分区 |
| terminated 父特性 | 子特性不独立统计，统一归入父节点 |
| merged 父特性 | 显示 mergedInto 目标 |

### 7.4 E2E 测试

**测试命令**：`bash scripts/e2e/basic/sddu-e2e.sh`（需先更新脚本中的 state.json 格式为新模型）

| 用例 | 操作 | 预期结果 |
|------|------|----------|
| R5 首次检测 | 升级插件版本号 → 执行 `@sddu 状态` | 输出一致性检测报告 |
| R5 修复流程 | 检测到异常 → 请示用户 → 用户同意 | state.json 按新规则修复，输出变更报告 |
| R5 二次跳过 | 同版本再次执行 `@sddu 状态` | 不再触发一致性检测 |
| 分类仪表盘 | 执行 `@sddu 状态` | 输出 🟢进行中 / ✅已完成 / 🟡搁置 / 🔴终止 / 🔵迁出 / ⚠️异常 六区 |
| 智能引导 | 执行 `@sddu 状态` | 末尾显示建议命令清单 |
| 标记命令 | `@sddu 标记 foo suspended --until 2027-01` | status 变为 suspended，三处同步 |
| 自然语言标记 | `@sddu 帮我挂起 foo` | 推导为 suspended 并执行 |
| 到期提醒 | suspendedUntil 已过期的特性 | `@sddu 状态` 中被标出提醒 |
| completed 自动 | phase 到达 validated | status 自动变为 completed |

### 7.5 回归测试

**测试命令**：`npx jest --testPathPattern="src/state" && npx jest --testPathPattern="tests/state" && npx jest --testPathPattern="tests/integration"`

执行全量 state 相关测试（约 40 个测试文件），确保：

1. 无新增失败（schema 变更导致）
2. 旧测试用例数据已全部迁移至新格式
3. 所有 mocking 和 fixture 已更新

### 7.6 验收清单

| # | 验收条件 | FR |
|---|---------|-----|
| 1 | `@sddu 状态` 不列出任何 status≠tracked 的特性在建议区 | FR-003 |
| 2 | terminated 父特性下的子特性不独立统计 | FR-004 |
| 3 | phase 推进到 validated 时 status 自动变为 completed | FR-006 |
| 4 | R5 在版本升级后首次 `@sddu 状态` 自动触发 | FR-007 |
| 5 | `@sddu 标记 foo suspended` 三处同步 | FR-009 |
| 6 | `@sddu 帮我挂起 foo` 推导为 suspended | FR-009 |
| 7 | `@sddu 状态` 输出六区分类 + 建议清单 | FR-010, FR-010b |
| 8 | suspendedUntil 到期 → `@sddu 状态` 中提醒 | FR-012 |
| 9 | state.json 只有 phase + status 字段，无旧的 state/status 混用 | FR-001 |
| 10 | 全量回归测试通过 | — |

---

## 8. 部署计划

### 8.1 实施顺序

```
Phase 1: Schema 层 (1-2 天)
  ├── 1.1 新建 schema-v3.0.0.ts（phase + status 联合定义、校验、常量）
  ├── 1.2 编写 schema-v3.0.0.test.ts
  └── 1.3 更新 types.ts / state/index.ts 导出

Phase 2: 引擎层 — MVP (2-3 天)
  ├── 2.1 machine.ts 简化：删除双宇宙映射，phase + status 直接驱动
  ├── 2.2 state-loader.ts 适配：create/get/set 支持新字段
  ├── 2.3 tree-state-validator.ts 更新：校验规则改为 phase(8) + status(5)
  ├── 2.4 auto-updater.ts 更新：文件→phase 推导，跳过非 tracked
  ├── 2.5 dependency-checker.ts 更新：移除双宇宙映射
  └── 2.6 编写/更新对应单元测试

Phase 3: 检测层 — MVP (1-2 天)
  ├── 3.1 新建 consistency-checker.ts（7 项检测 + 修复引擎）
  ├── 3.2 编写 consistency-checker.test.ts
  ├── 3.3 tree-scanner.ts 增强：resolveDisplayContext() 子随父归
  └── 3.4 state-loader.ts 集成版本比较逻辑

Phase 4: Agent 层 — V1 (2-3 天)
  ├── 4.1 sddu.md.hbs 重写：分类仪表盘输出模板
  ├── 4.2 sddu.md.hbs 增加：标记命令模板 + 自然语言推导原则
  ├── 4.3 sddu.md.hbs 增加：智能引导清单
  ├── 4.4 sddu.md.hbs 增加：父特性聚合展示
  ├── 4.5 sddu.md.hbs 增加：到期提醒逻辑
  ├── 4.6 sddu-docs.md.hbs 更新：status 标注
  └── 4.7 sddu-agents.ts 更新：agent→phase 映射

Phase 5: 集成测试 (1 天)
  ├── 5.1 全流程 E2E 测试
  ├── 5.2 回归测试（不破坏现有 11 个 Feature）
  └── 5.3 性能测试（NFR-001, NFR-002）

Phase 6: V2 特性 (1-2 天，可延后)
  ├── 6.1 FR-013: 长期停滞检测
  └── 6.2 FR-014: merged 跳转追溯
```

### 8.2 回滚策略

- 旧 schema 文件（v1.2.5, v2.0.0）保留不删除
- machine.ts 重构通过 git 版本控制可回滚
- 新增文件（schema-v3.0.0.ts, consistency-checker.ts）可独立删除
- state.json 存量文件不会被自动修改（R5 需用户确认后执行）

---

## 9. 风险评估

### 9.1 技术风险

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| machine.ts 简化引入回归 Bug | 高 | 中 | 保留旧代码的单元测试，逐步迁移；每步通过测试后再继续 |
| 双宇宙映射移除遗漏 | 中 | 中 | 全局搜索 `FeatureStateEnum`、`mapInternalStateToWorkflowStatus` 等引用 |
| state-loader 向后兼容性问题 | 高 | 低 | 读取时支持 v2.1.0 格式；写入时统一为 v3.0.0 |
| Agent 模板行为不可精确预测 | 中 | 中 | 先定义明确的规则边界，Agent 模板在边界内自由发挥 |
| R5 修复逻辑错误导致数据损失 | 高 | 低 | 修复前强制用户确认；FR-008 保护非 tracked 的 status；修复操作记录日志 |

### 9.2 依赖风险

| 风险 | 说明 | 缓解措施 |
|------|------|----------|
| 现有 11 个 Feature 的 state.json 格式不统一 | 读写兼容性 | R5 首次检测时请示用户修复；读取时做格式兼容 |
| Agent 模板生成机制依赖 build-agents.cjs | 生成失败可能导致 Agent 行为异常 | 本地验证模板生成结果后再发布 |
| opencode-sddu-plugin 发布流程 | 版本号更新触发 R5 | 版本号 bump 与功能变更同步 |

### 9.3 时间风险

| 风险 | 说明 | 缓解措施 |
|------|------|----------|
| Agent 模板调试周期不确定 | 自然语言行为难以精确控制 | V1 特性可先以简化版上线，后续迭代优化 |
| 跨模块回归测试耗时 | machine/loader/validator/scanner 互相关联 | 优先保证 MVP (R1-R5) 稳定，V1/V2 特性独立迭代 |

---

## 10. 架构决策记录 (ADR)

本 Feature 涉及架构决策，详见：

| ADR 编号 | 决策标题 | 状态 |
|----------|----------|------|
| [ADR-020](ADR-020.md) | 两字段隔离模型：Phase + Status 完全独立 | PROPOSED |

---

## 11. 开放问题

| ID | 问题 | 计划中决策 | 状态 |
|----|------|-----------|------|
| Q-001 | SDDU 插件版本号的存储和读取方式？ | 存储于 `.sddu/.consistency-state.json`，与 `package.json` version 比较 | ✅ 已决 |
| Q-002 | 一致性检测修复报告是否需要持久化？ | 保存到 `.sddu/consistency-reports/` 目录 | ✅ 已决 |
| Q-003 | `@sddu 标记` 是否需要支持批量操作？ | V1 不做，留待 V2 | ✅ 已决 |
| Q-004 | 非 tracked 特性的子特性恢复后是否自动恢复独立显示？ | 是 — 子随父归是动态推导 | ✅ 已决 |
| Q-005 | 长期停滞阈值是否可配置？ | 可配置，默认 30 天 | ✅ 已决 |

---

## 12. 验收标准映射

### 12.1 MVP (R1-R5)

- [ ] FR-001: state.json 同时包含 `phase` 和 `status` 两个字段，无旧混用字段
- [ ] FR-002: Phase 单向推进（拒绝回退/跳跃），各阶段 Agent 自动推进
- [ ] FR-003: `@sddu 状态` 建议区仅含 `status === "tracked" && phase !== "validated"` 的特性
- [ ] FR-004: 非 tracked 父特性下子特性归入父节点显示，递归生效
- [ ] FR-005: Schema 支持 phase(8) + status(5) 联合验证，组合约束校验
- [ ] FR-006: phase → validated 时自动设 status 为 completed（仅当 status 为 tracked）
- [ ] FR-007: 版本升级后首次 `@sddu 状态` 触发一致性检测（7 项检测）
- [ ] FR-008: 一致性检测修复时不覆盖非 tracked 的 status

### 12.2 V1 (R6-R9)

- [ ] FR-009: `@sddu 标记` 命令支持 suspended/terminated/merged/tracked，三处同步
- [ ] FR-010: `@sddu 状态` 输出 6 区分类仪表盘
- [ ] FR-010b: `@sddu 状态` 末尾智能引导清单
- [ ] FR-011: 父特性根据子特性进度聚合展示
- [ ] FR-012: suspendedUntil 到期被动提醒

### 12.3 V2 (R10-R12)

- [ ] FR-013: 长期停滞检测（可配置阈值）
- [ ] FR-014: merged 特性跳转追溯

### 12.4 非功能

- [ ] NFR-001: `@sddu 状态` 扫描 50 Feature ≤ 3s
- [ ] NFR-002: 一致性检测 50 Feature ≤ 5s
- [ ] NFR-003: 自动流程 100% 保留用户设定的非 tracked status
- [ ] NFR-004: `@sddu 标记` 参数错误提示清晰
- [ ] NFR-005: 升级后无需手动迁移
- [ ] NFR-006: 新增 phase/status 值仅在一处集中定义

---

*创建日期：2026-06-12 | 阶段：planned | 版本：1.0.0*
