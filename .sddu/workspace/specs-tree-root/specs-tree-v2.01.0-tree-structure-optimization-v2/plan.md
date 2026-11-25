# 技术规划：树形结构优化 v2 - 问题修复

## 元数据

| 元数据 | 值 |
|--------|-----|
| **Feature ID** | `TSO-V2-001` |
| **规范版本** | 2.1.0 |
| **创建日期** | 2026-04-15 |
| **状态** | planned |
| **作者** | SDDU Team |
| **依赖 Feature** | `specs-tree-tree-structure-optimization`（v2.4.0） |

---

## 1. 架构影响分析

### 1.1 现状评估

v2.4.0 已实现树形结构的核心基础设施（TreeScanner、StateLoader、TreeStateValidator、ParentStateManager），本次 v2 定位为 **增量修复增强**，不改变已有架构。

| 模块 | 路径 | 当前行为 | 变更类型 |
|------|------|----------|----------|
| **StateLoader** | `src/state/state-loader.ts` | create() 填充默认值，但 `depth` 自动计算逻辑不完整；`phaseHistory` 初始化策略不一致 | 🔧 **增强** |
| **TreeStateValidator** | `src/state/tree-state-validator.ts` | validateNewState() 支持自动修复，但 validate() 接口未标准化 | 🔧 **增强** |
| **StateMachine** | `src/state/machine.ts` | 创建 state 时部分字段依赖 StateLoader 填充 | 🔧 **增强** |
| **Discovery Workflow** | `src/discovery/workflow-engine.ts` | 无拆分建议能力 | 🔧 **新增** |
| **Agent Templates** | `src/templates/agents/sddu-discovery.md.hbs` | 无拆分建议指引 | 🔧 **修改** |
| **Agent Templates** | `src/templates/agents/sddu-spec.md.hbs` | 无拆分确认处理 | 🔧 **修改** |

### 1.2 需要新建的模块

| 模块 | 路径 | 职责 |
|------|------|------|
| **E2E 测试脚本** | `scripts/e2e/tree-scenario/` | 树形嵌套测试场景生成与验证 |
| **拆分原则文档** | `docs/split-principles.md` | 指导用户拆分决策 |
| **树形示例项目** | `examples/tree-structure-demo/` | 展示 3 层嵌套完整示例 |

### 1.3 架构图（增量变更）

```
┌─────────────────────────────────────────────────────────────┐
│                    增量变更模块                               │
│                                                              │
│  ┌──────────────────┐    ┌──────────────────┐               │
│  │  StateLoader     │    │ TreeStateValidator│               │
│  │  [增强 create]   │◀──▶│ [增强 validate]   │               │
│  └────────┬─────────┘    └──────────────────┘               │
│           │                                                  │
│           ▼                                                  │
│  ┌──────────────────┐    ┌──────────────────┐               │
│  │  StateMachine    │    │ Discovery Workflow│               │
│  │  [增强初始化]    │    │ [新增拆分建议]     │               │
│  └──────────────────┘    └────────┬─────────┘               │
│                                   │                          │
│  ┌──────────────┐  ┌──────────────┼──────────┐              │
│  │ sddu-discovery│  │  sddu-spec           │              │
│  │ .md.hbs       │  │  .md.hbs             │              │
│  │ [拆分指引]    │  │  [拆分确认]          │              │
│  └──────────────┘  └──────────────────────┘              │
│                                                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  新增产出物                                            │  │
│  │  - scripts/e2e/tree-scenario/    (树形 E2E 测试)      │  │
│  │  - docs/split-principles.md      (拆分原则文档)       │  │
│  │  - examples/tree-structure-demo/ (示例项目)           │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

已有模块（不修改）:
  src/state/tree-scanner.ts          ✅ 不修改
  src/state/parent-state-manager.ts  ✅ 不修改
  src/state/schema-v2.0.0.ts         ✅ 不修改
  src/state/auto-updater.ts          ✅ 不修改
  src/state/dependency-checker.ts    ✅ 不修改
```

---

## 2. 方案对比

### 方案 A：最小侵入式（✅ 推荐）

**策略**：在现有 StateLoader 和 TreeStateValidator 基础上增强，不改变核心架构，新增独立测试脚本和文档。

| 维度 | 说明 |
|------|------|
| **改动范围** | 3 个修改 + 3 个新建（文档/脚本/示例）= 6 个文件变更 |
| **风险** | 低（增量修改，v2.4.0 核心能力不变） |
| **工作量** | 2-3 天 |
| **优点** | 改动范围小，风险低，不触碰已验证的核心逻辑 |
| **缺点** | StateLoader 内部逻辑有一定复杂度，需要小心处理向后兼容 |

### 方案 B：重构 StateLoader

**策略**：将 StateLoader.create() 的自动填充逻辑全部迁移到 TreeStateValidator，StateLoader 仅做文件 I/O。

| 维度 | 说明 |
|------|------|
| **改动范围** | 2 个修改（重构）+ 3 个新建 = 5 个文件变更 |
| **风险** | 中（重构 StateLoader.create 可能影响已有调用方） |
| **工作量** | 3-4 天 |
| **优点** | 职责更清晰，StateLoader 只做 I/O，Validator 专注校验/修复 |
| **缺点** | 重构可能引入回归 Bug，需要全面测试 |

### 方案 C：新建 Schema 验证中间层

**策略**：新建 `SchemaEnforcer` 模块，在 StateLoader 和文件写入之间插入统一验证/修复层。

| 维度 | 说明 |
|------|------|
| **改动范围** | 1 个新建 + 2 个修改 = 3 个文件变更 |
| **风险** | 中（新增中间层增加复杂度） |
| **工作量** | 3-4 天 |
| **优点** | 验证逻辑集中，未来扩展容易 |
| **缺点** | 增加间接层，调试困难，对当前问题过度设计 |

### 推荐方案 A 的理由

1. **v2 定位为修复**——spec 明确指出"不修改 v2.4.0 已实现的树形核心能力"（NG-001），方案 A 最符合此原则
2. **风险最小**——增量增强现有逻辑，不改变已有调用契约
3. **工作量可控**——2-3 天即可完成，不影响后续版本节奏
4. **向后兼容**——不破坏现有 11 个 Feature（NFR-001）

---

## 3. 详细技术设计

### 3.1 FR-101~103: State Schema 修复方案

#### 3.1.1 StateLoader.create() 增强

**当前问题**：
- `depth` 默认为 `0`，未根据 featurePath 层级自动计算（EC-101）
- `phaseHistory` 初始化策略不统一：有时为空数组，有时自动填充
- 缺少 `createdAt`/`updatedAt` 时间戳设置

**修改方案**：

```typescript
// src/state/state-loader.ts - create() 方法增强

public async create(featurePath: string, initialState: Partial<StateV2_1_0>): Promise<boolean> {
  const now = new Date().toISOString();
  
  // FR-101: 根据 featurePath 自动计算 depth
  const computedDepth = this.computeDepth(featurePath);
  
  const completeInitialState: StateV2_1_0 = {
    feature: initialState.feature || featurePath,
    name: initialState.name,
    version: 'v2.1.0',                          // FR-101: 强制 v2.1.0
    status: initialState.status || 'specified',
    phase: initialState.phase ?? 1,
    depth: initialState.depth ?? computedDepth, // FR-101: 自动计算
    phaseHistory: this.initPhaseHistory(initialState), // FR-101: 统一初始化
    files: {
      spec: initialState.files?.spec || `${path.basename(featurePath)}/spec.md`,
      plan: initialState.files?.plan,
      tasks: initialState.files?.tasks,
      readme: initialState.files?.readme,
      review: initialState.files?.review,
      validation: initialState.files?.validation
    },
    dependencies: {
      on: initialState.dependencies?.on || [],
      blocking: initialState.dependencies?.blocking || []
    },
    childrens: initialState.childrens || [],
    metadata: initialState.metadata,
    history: initialState.history,
    createdAt: now,    // FR-101: 新增
    updatedAt: now     // FR-101: 新增
  };
  
  // FR-103: 调用 TreeStateValidator 进行最终校验和修复
  const validator = new TreeStateValidator(this);
  const validationResult = validator.validateNewState(completeInitialState, featurePath);
  
  // 合并修复结果
  const finalState = validationResult.repairedState;
  
  if (validationResult.warnings.length > 0) {
    console.warn(`StateLoader.create() warnings for ${featurePath}:`, validationResult.warnings);
  }
  
  // 写入文件（同现有逻辑）
  // ...
}

/**
 * 根据 featurePath 中的 specs-tree- 出现次数计算 depth
 * EC-101: 自动计算层级深度
 */
private computeDepth(featurePath: string): number {
  const matches = featurePath.match(/specs-tree-/g);
  return matches ? matches.length - 1 : 0;  // specs-tree-root 不算
}

/**
 * 统一 phaseHistory 初始化策略
 */
private initPhaseHistory(initialState: Partial<StateV2_1_0>): PhaseHistory[] {
  if (initialState.phaseHistory && initialState.phaseHistory.length > 0) {
    return initialState.phaseHistory;
  }
  
  const phase = initialState.phase ?? 1;
  const status = (initialState.status as WorkflowStatus) || 'specified';
  
  return [{
    phase,
    status,
    timestamp: new Date().toISOString(),
    triggeredBy: 'StateLoader.create'
  }];
}
```

#### 3.1.2 TreeStateValidator 增强

**当前问题**：
- `validateNewState()` 方法已存在，但返回格式与 spec 定义的 `ValidationResult` 不一致
- 缺少标准化的 `validate()` 接口

**修改方案**：

```typescript
// src/state/tree-state-validator.ts - 新增标准化 validate() 接口

/**
 * FR-102: 标准化验证接口
 * 符合 spec 定义的 ValidationResult 格式
 */
public validate(state: Partial<StateV2_1_0>): ValidationResult {
  const warnings: string[] = [];
  const autoFixed: string[] = [];
  const errors: string[] = [];
  
  let repairedState: StateV2_1_0 = { ...state } as StateV2_1_0;
  
  // 1. 检查 version 字段
  if (!repairedState.version || repairedState.version !== 'v2.1.0') {
    if (repairedState.version && typeof repairedState.version === 'string') {
      // 可修复的情况
      if (repairedState.version === '2.1.0' || repairedState.version.match(/^\d+\.\d+\.\d+$/)) {
        repairedState.version = 'v2.1.0';
        autoFixed.push('version');
        warnings.push(`Fixed version format to 'v2.1.0'`);
      } else {
        errors.push(`Invalid version format: '${repairedState.version}'`);
      }
    } else {
      repairedState.version = 'v2.1.0';
      autoFixed.push('version');
      warnings.push(`Added missing version as 'v2.1.0'`);
    }
  }
  
  // 2. 检查 depth 字段
  if (repairedState.depth === undefined || typeof repairedState.depth !== 'number') {
    if (repairedState.feature) {
      repairedState.depth = this.computeDepthFromFeature(repairedState.feature);
    } else {
      repairedState.depth = 0;
    }
    autoFixed.push('depth');
    warnings.push(`Set depth to ${repairedState.depth}`);
  }
  
  // 3. 检查 phaseHistory
  if (!Array.isArray(repairedState.phaseHistory) || repairedState.phaseHistory.length === 0) {
    const phase = repairedState.phase ?? 0;
    const status = (repairedState.status as WorkflowStatus) || 'discovered';
    repairedState.phaseHistory = [{
      phase,
      status,
      timestamp: new Date().toISOString(),
      triggeredBy: 'TreeStateValidator.validate'
    }];
    autoFixed.push('phaseHistory');
    warnings.push(`Initialized phaseHistory with current phase record`);
  }
  
  // 4. 检查 dependencies
  if (!repairedState.dependencies || typeof repairedState.dependencies !== 'object') {
    repairedState.dependencies = { on: [], blocking: [] };
    autoFixed.push('dependencies');
    warnings.push(`Added default dependencies object`);
  } else {
    if (!Array.isArray(repairedState.dependencies.on)) {
      repairedState.dependencies.on = [];
      autoFixed.push('dependencies.on');
    }
    if (!Array.isArray(repairedState.dependencies.blocking)) {
      repairedState.dependencies.blocking = [];
      autoFixed.push('dependencies.blocking');
    }
  }
  
  // 5. 检查 files
  if (!repairedState.files || typeof repairedState.files !== 'object') {
    repairedState.files = { spec: 'spec.md' };
    autoFixed.push('files');
    warnings.push(`Added default files object`);
  } else if (!repairedState.files.spec) {
    repairedState.files.spec = 'spec.md';
    autoFixed.push('files.spec');
  }
  
  const valid = errors.length === 0;
  
  return { valid, errors, warnings, autoFixed, state: repairedState };
}

/**
 * 根据 feature 路径计算 depth
 */
private computeDepthFromFeature(featurePath: string): number {
  const matches = featurePath.match(/specs-tree-/g);
  return matches ? matches.length - 1 : 0;
}
```

新增 `ValidationResult` 类型：

```typescript
// src/state/tree-state-validator.ts

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  autoFixed: string[];
  state: StateV2_1_0;
}
```

#### 3.1.3 StateMachine 集成

**修改点**：在 StateMachine 创建新 Feature 时，调用增强后的 StateLoader.create()，确保自动填充所有必填字段。

```diff
// src/state/machine.ts 修改要点

  async createFeature(featurePath: string, options: CreateFeatureOptions): Promise<StateV2_1_0> {
-   const state = {
-     feature: featurePath,
-     name: options.name,
-     status: 'discovered',
-     phase: 0
-   };
-   await this.stateLoader.create(featurePath, state);
+   const initialState: Partial<StateV2_1_0> = {
+     name: options.name,
+     status: 'specified',
+     phase: 1,
+     files: { spec: `${path.basename(featurePath)}/spec.md` }
+   };
+   // StateLoader.create() 内部会自动填充 version, depth, phaseHistory, dependencies 等
+   await this.stateLoader.create(featurePath, initialState);
    return this.stateLoader.get(featurePath);
  }
```

### 3.2 FR-110~111: Agent 模板修改方案

#### 3.2.1 Discovery Agent 拆分识别规则

**策略**：基于规则引擎 + 关键词匹配（保守策略，避免过度拆分）。

```typescript
// src/discovery/workflow-engine.ts - 新增拆分建议方法

interface SplitPattern {
  id: string;
  name: string;
  keywords: string[];
  description: string;
}

const SPLIT_PATTERNS: SplitPattern[] = [
  {
    id: 'frontend-backend',
    name: '前后端分离',
    keywords: ['前端', '后端', 'frontend', 'backend', 'client', 'server', 'web', 'api', 'ui', 'service'],
    description: '识别到前端/后端分离架构，建议拆分为独立的 frontend 和 backend Feature'
  },
  {
    id: 'multi-platform',
    name: '多端架构',
    keywords: ['ios', 'android', '移动端', 'pc端', '小程序', 'h5', 'app', 'web'],
    description: '识别到多端架构，建议按端拆分'
  },
  {
    id: 'admin-user',
    name: '管理后台+用户端',
    keywords: ['管理后台', '用户端', '后台', '前台', 'admin', 'user'],
    description: '识别到管理后台与用户端分离模式'
  }
];

export async function analyzeSplitSuggestion(userDescription: string): Promise<SplitSuggestion | null> {
  const lowerDesc = userDescription.toLowerCase();
  const matchedPatterns: SplitPattern[] = [];
  
  for (const pattern of SPLIT_PATTERNS) {
    const hasMatch = pattern.keywords.some(kw => lowerDesc.includes(kw.toLowerCase()));
    if (hasMatch) {
      matchedPatterns.push(pattern);
    }
  }
  
  if (matchedPatterns.length === 0) {
    return null;  // 未识别到拆分模式
  }
  
  // 如果同时匹配多个模式，输出所有候选
  return {
    patterns: matchedPatterns,
    ambiguous: matchedPatterns.length > 1,
    suggestions: matchedPatterns.map(p => ({
      patternId: p.id,
      patternName: p.name,
      description: p.description,
      suggestedChildren: generateSuggestedChildren(p.id)
    }))
  };
}
```

#### 3.2.2 Spec Agent 拆分确认处理

**修改点**：在 `sddu-spec.md.hbs` 模板中增加拆分确认指引。

```markdown
## 拆分确认处理

当 Discovery 阶段输出拆分建议后，用户有三种选择：

### 选择 1: 接受拆分（accept）
1. 生成父级 Feature 目录（轻量化：discovery.md + spec.md + README.md + state.json）
2. 父级 state.json 记录：
   - `childrens`: 子 Feature 信息数组
   - `depth`: 根据路径自动计算
   - `phase`: 1（specified 阶段）
3. 输出子 Feature 创建指引

### 选择 2: 拒绝拆分（reject）
1. 生成单个 Feature 目录（完整叶子：走完整 6 阶段）
2. 在 discovery.md 中记录拒绝原因
3. state.json 的 `childrens` 为空数组

### 选择 3: 自定义拆分（custom）
1. 使用用户指定的子 Feature 名称和数量
2. 生成父级 + 子 Feature 目录结构
3. 如果名称冲突或格式错误，返回错误提示
```

### 3.3 FR-120~123: 树形嵌套 E2E 测试方案

#### 3.3.1 测试场景设计

```
scripts/e2e/tree-scenario/
├── setup.sh                    # 创建测试项目结构
├── validate.sh                 # 运行所有验证
├── verify-childrens.sh         # FR-121: childrens 数组验证
├── verify-depth.sh             # FR-122: depth 字段验证
└── verify-cross-tree-deps.sh   # FR-123: 跨子树依赖验证
```

**测试项目结构**：

```
.sddu/specs-tree-root/
├── specs-tree-e2e-parent/              # 父级（depth=1）
│   ├── discovery.md
│   ├── spec.md
│   ├── README.md
│   └── state.json                      # childrens=[child-a, child-b]
│   ├── specs-tree-e2e-child-a/         # 子级 A（depth=2, 叶子）
│   │   ├── discovery.md
│   │   ├── spec.md
│   │   └── state.json                  # dependencies.on: [standalone]
│   └── specs-tree-e2e-child-b/         # 子级 B（depth=2, 叶子）
│       ├── discovery.md
│       ├── spec.md
│       └── state.json                  # dependencies.on: [child-a] (循环依赖测试)
└── specs-tree-e2e-standalone/          # 独立 Feature（depth=1, 叶子）
    ├── discovery.md
    ├── spec.md
    └── state.json
```

#### 3.3.2 验证脚本实现

**setup.sh** - 创建测试项目：

```bash
#!/bin/bash
# scripts/e2e/tree-scenario/setup.sh

set -e

SPEC_ROOT=".sddu/specs-tree-root"
NOW=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")

# 清理旧数据（EC-107）
rm -rf "$SPEC_ROOT/specs-tree-e2e-parent"
rm -rf "$SPEC_ROOT/specs-tree-e2e-standalone"

# === 创建父级 Feature ===
mkdir -p "$SPEC_ROOT/specs-tree-e2e-parent/specs-tree-e2e-child-a"
mkdir -p "$SPEC_ROOT/specs-tree-e2e-parent/specs-tree-e2e-child-b"

cat > "$SPEC_ROOT/specs-tree-e2e-parent/state.json" << EOF
{
  "feature": "specs-tree-e2e-parent",
  "name": "E2E 测试父级",
  "version": "v2.1.0",
  "status": "specified",
  "phase": 1,
  "depth": 1,
  "childrens": [],
  "files": { "discovery": "discovery.md", "spec": "spec.md", "readme": "README.md" },
  "dependencies": { "on": [], "blocking": [] },
  "phaseHistory": [{ "phase": 1, "status": "specified", "timestamp": "$NOW", "triggeredBy": "setup.sh" }],
  "createdAt": "$NOW",
  "updatedAt": "$NOW"
}
EOF

# === 创建子级 A ===
cat > "$SPEC_ROOT/specs-tree-e2e-parent/specs-tree-e2e-child-a/state.json" << EOF
{
  "feature": "specs-tree-e2e-parent/specs-tree-e2e-child-a",
  "name": "子级 A",
  "version": "v2.1.0",
  "status": "specified",
  "phase": 1,
  "depth": 2,
  "childrens": [],
  "files": { "discovery": "discovery.md", "spec": "spec.md" },
  "dependencies": {
    "on": ["specs-tree-e2e-standalone"],
    "blocking": []
  },
  "phaseHistory": [{ "phase": 1, "status": "specified", "timestamp": "$NOW", "triggeredBy": "setup.sh" }],
  "createdAt": "$NOW",
  "updatedAt": "$NOW"
}
EOF

# === 创建子级 B ===
cat > "$SPEC_ROOT/specs-tree-e2e-parent/specs-tree-e2e-child-b/state.json" << EOF
{
  "feature": "specs-tree-e2e-parent/specs-tree-e2e-child-b",
  "name": "子级 B",
  "version": "v2.1.0",
  "status": "specified",
  "phase": 1,
  "depth": 2,
  "childrens": [],
  "files": { "discovery": "discovery.md", "spec": "spec.md" },
  "dependencies": {
    "on": ["specs-tree-e2e-parent/specs-tree-e2e-child-a"],
    "blocking": []
  },
  "phaseHistory": [{ "phase": 1, "status": "specified", "timestamp": "$NOW", "triggeredBy": "setup.sh" }],
  "createdAt": "$NOW",
  "updatedAt": "$NOW"
}
EOF

# === 创建独立 Feature ===
mkdir -p "$SPEC_ROOT/specs-tree-e2e-standalone"

cat > "$SPEC_ROOT/specs-tree-e2e-standalone/state.json" << EOF
{
  "feature": "specs-tree-e2e-standalone",
  "name": "独立 Feature",
  "version": "v2.1.0",
  "status": "specified",
  "phase": 1,
  "depth": 1,
  "childrens": [],
  "files": { "discovery": "discovery.md", "spec": "spec.md" },
  "dependencies": { "on": [], "blocking": [] },
  "phaseHistory": [{ "phase": 1, "status": "specified", "timestamp": "$NOW", "triggeredBy": "setup.sh" }],
  "createdAt": "$NOW",
  "updatedAt": "$NOW"
}
EOF

echo "✅ E2E 测试项目结构创建完成"
```

**validate.sh** - 运行所有验证：

```bash
#!/bin/bash
# scripts/e2e/tree-scenario/validate.sh

set -e

PASS=0
FAIL=0

run_test() {
  local name="$1"
  local script="$2"
  
  echo "🧪 运行: $name"
  if bash "$script"; then
    echo "  ✅ 通过"
    PASS=$((PASS + 1))
  else
    echo "  ❌ 失败"
    FAIL=$((FAIL + 1))
  fi
}

run_test "FR-121: childrens 数组验证" "scripts/e2e/tree-scenario/verify-childrens.sh"
run_test "FR-122: depth 字段验证" "scripts/e2e/tree-scenario/verify-depth.sh"
run_test "FR-123: 跨子树依赖验证" "scripts/e2e/tree-scenario/verify-cross-tree-deps.sh"

echo ""
echo "=== E2E 测试结果 ==="
echo "通过: $PASS / 失败: $FAIL / 总计: $((PASS + FAIL))"

if [ $FAIL -gt 0 ]; then
  echo "❌ E2E 测试未通过"
  exit 1
else
  echo "✅ E2E 测试全部通过"
fi
```

### 3.4 FR-130~131: 文档和示例方案

#### 3.4.1 拆分原则文档

**位置**：`docs/split-principles.md`

**内容大纲**：

```markdown
# SDDU Feature 拆分原则

## 1. 拆分时机判断
- 需求包含多个独立模块
- 前后端分离架构
- 多端架构（iOS/Android/Web）
- 管理后台 + 用户端

## 2. 拆分粒度建议
- 单一职责原则
- 一个 Feature 对应一个用户故事
- 避免过细拆分（单个文件级）

## 3. 父子关系定义
- 父级：聚合型，负责协调子 Feature
- 叶子：实现型，走完整 6 阶段工作流

## 4. 常见拆分模式
- 前后端分离（frontend + backend）
- 多端架构（ios + android + web）
- 微服务（api-gateway + service-a + service-b）
- 管理后台 + 用户端（admin + user-portal）

## 5. 拆分示例
### 示例 1: 电商平台
### 示例 2: 博客平台
```

#### 3.4.2 树形示例项目

**位置**：`examples/tree-structure-demo/`

**结构**（同 spec 定义，3 层嵌套）：

```
examples/tree-structure-demo/
├── specs-tree-ecommerce-platform/        # 父级（depth=0, 轻量化）
│   ├── discovery.md
│   ├── spec.md
│   ├── README.md
│   └── state.json
│   ├── specs-tree-frontend/              # 子级 A（depth=1, 叶子）
│   │   ├── discovery.md ~ validate.md    # 完整 6 阶段
│   │   └── state.json
│   └── specs-tree-backend/               # 子级 B（depth=1, 也是父级）
│       ├── discovery.md
│       ├── spec.md
│       ├── README.md
│       └── state.json
│       ├── specs-tree-api/               # 孙级 A（depth=2, 叶子）
│       │   ├── discovery.md ~ validate.md
│       │   └── state.json
│       └── specs-tree-database/          # 孙级 B（depth=2, 叶子）
│           ├── discovery.md ~ validate.md
│           └── state.json
└── README.md
```

---

## 4. 模块设计（修改/新建文件清单）

### 4.1 修改文件（5 个）

| 文件 | 变更类型 | 对应 FR | 变更说明 |
|------|----------|---------|----------|
| `src/state/state-loader.ts` | 🔧 增强 | FR-101, FR-103 | create() 增加 depth 自动计算、phaseHistory 统一初始化、createdAt/updatedAt 设置、调用 TreeStateValidator.validate() |
| `src/state/tree-state-validator.ts` | 🔧 增强 | FR-102 | 新增标准化 validate() 接口，返回 ValidationResult 格式 |
| `src/state/machine.ts` | 🔧 增强 | FR-101 | createFeature() 调用增强后的 StateLoader.create() |
| `src/discovery/workflow-engine.ts` | 🔧 新增 | FR-110 | 新增 analyzeSplitSuggestion() 方法 |
| `src/templates/agents/sddu-discovery.md.hbs` | 🔧 修改 | FR-110 | 增加拆分建议输出指引 |
| `src/templates/agents/sddu-spec.md.hbs` | 🔧 修改 | FR-111 | 增加拆分确认处理指引 |

### 4.2 新建文件（7 个）

| 文件 | 行数预估 | 对应 FR | 说明 |
|------|----------|---------|------|
| `scripts/e2e/tree-scenario/setup.sh` | ~80 行 | FR-120 | 创建测试项目结构 |
| `scripts/e2e/tree-scenario/validate.sh` | ~30 行 | FR-120 | 运行所有验证 |
| `scripts/e2e/tree-scenario/verify-childrens.sh` | ~40 行 | FR-121 | childrens 数组验证 |
| `scripts/e2e/tree-scenario/verify-depth.sh` | ~30 行 | FR-122 | depth 字段验证 |
| `scripts/e2e/tree-scenario/verify-cross-tree-deps.sh` | ~50 行 | FR-123 | 跨子树依赖验证 |
| `docs/split-principles.md` | ~150 行 | FR-130 | 拆分原则文档 |
| `examples/tree-structure-demo/` | ~20 个文件 | FR-131 | 树形示例项目（含完整 state.json 和文档） |

### 4.3 不修改文件

| 文件 | 说明 |
|------|------|
| `src/state/tree-scanner.ts` | v2.4.0 已验证，无需修改 |
| `src/state/parent-state-manager.ts` | v2.4.0 已验证，无需修改 |
| `src/state/schema-v2.0.0.ts` | v2.1.0 schema 已定义，无需修改 |
| `src/state/auto-updater.ts` | v2.4.0 已改造，无需修改 |
| `src/state/dependency-checker.ts` | v2.4.0 已改造，无需修改 |

---

## 5. 接口设计

### 5.1 内部 API 变更

#### StateLoader.create() 签名变更

```typescript
// 修改前
create(featurePath: string, initialState: Partial<StateV2_1_0>): Promise<boolean>

// 修改后（签名不变，行为增强）
// - 自动计算 depth（基于 featurePath）
// - 统一初始化 phaseHistory
// - 设置 createdAt/updatedAt
// - 调用 TreeStateValidator.validate() 进行最终校验
```

#### TreeStateValidator 新增接口

```typescript
// 新增
validate(state: Partial<StateV2_1_0>): ValidationResult

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  autoFixed: string[];
  state: StateV2_1_0;
}
```

#### Discovery Workflow 新增接口

```typescript
// 新增
analyzeSplitSuggestion(userDescription: string): Promise<SplitSuggestion | null>

interface SplitSuggestion {
  patterns: SplitPattern[];
  ambiguous: boolean;
  suggestions: SplitSuggestionItem[];
}

interface SplitSuggestionItem {
  patternId: string;
  patternName: string;
  description: string;
  suggestedChildren: { id: string; name: string; description: string }[];
}
```

---

## 6. 数据流设计

### 6.1 Feature 创建数据流

```
用户发起创建 Feature
        │
        ▼
┌─────────────────────┐
│  StateMachine       │
│  createFeature()    │
│  构建 initialState   │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  StateLoader        │
│  create()           │──────────────┐
│  - 计算 depth       │              │
│  - 初始化           │              │
│    phaseHistory     │              │
│  - 设置时间戳       │              │
└────────┬────────────┘              │
         │                           │
         ▼                           ▼
┌─────────────────────┐    ┌─────────────────────┐
│ TreeStateValidator  │    │  自动修复            │
│ validate()          │◀───│  - version           │
│ - 校验必填字段      │    │  - depth             │
│ - 自动修复缺失      │    │  - phaseHistory      │
│ - 记录警告日志      │    │  - dependencies      │
└────────┬────────────┘    │  - files             │
         │                 └─────────────────────┘
         ▼
┌─────────────────────┐
│  写入 state.json     │
│  更新缓存            │
└─────────────────────┘
```

### 6.2 拆分建议数据流

```
用户需求描述
        │
        ▼
┌─────────────────────┐
│ Discovery Agent     │
│ 分析需求描述         │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ analyzeSplitSuggestion│
│ 关键词匹配           │
│ - 前后端分离模式      │
│ - 多端架构模式        │
│ - 管理后台+用户端     │
└────────┬────────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
  匹配到     未匹配到
    │         │
    ▼         ▼
 输出建议    不输出建议
    │
    ▼
用户确认 (accept/reject/custom)
    │
    ▼
┌─────────────────────┐
│ Spec Agent          │
│ 根据选择生成目录结构 │
└─────────────────────┘
```

---

## 7. 测试策略

### 7.1 单元测试

| 测试模块 | 测试内容 | 覆盖目标 |
|----------|----------|----------|
| `state-loader.test.ts` | create() 自动填充 depth、phaseHistory、createdAt/updatedAt | > 85% |
| `tree-state-validator.test.ts` | validate() 自动修复各缺失字段 | > 90% |
| `workflow-engine.test.ts` | analyzeSplitSuggestion() 各模式匹配 | > 80% |

### 7.2 E2E 测试

| 测试场景 | 对应 FR | 验证内容 |
|----------|---------|----------|
| 树形嵌套结构创建 | FR-120 | 1 父 + 2 子 + 1 独立 Feature 结构正确 |
| childrens 数组验证 | FR-121 | 父级 childrens 包含 2 个子级，name/status 正确 |
| depth 字段验证 | FR-122 | parent=1, child=2, standalone=1 |
| 跨子树依赖验证 | FR-123 | child-a 能解析对 standalone 的依赖 |
| 循环依赖检测 | FR-123 | child-b → child-a → child-b 能被检测 |

### 7.3 验收测试（AC 映射）

| AC-ID | 测试方式 | 通过标准 |
|-------|----------|----------|
| AC-001 | 创建新 Feature 检查 state.json | version='v2.1.0', depth≥0, phaseHistory.length≥1 |
| AC-002 | 传入缺失字段的 state 对象 | valid=true, autoFixed 包含修复字段 |
| AC-003 | create() 后读取文件 | 所有必填字段存在 |
| AC-004~005 | 输入含关键词的描述 | 输出拆分建议 |
| AC-006~007 | 模拟 accept/reject | 生成对应目录结构 |
| AC-008 | 检查 E2E 测试项目 | 1 父 + 2 子结构正确 |
| AC-009 | 检查 split-principles.md | 包含所有章节 |
| AC-010 | 检查示例项目 | 3 层嵌套正确 |
| AC-011 | 运行跨子树依赖测试 | 依赖解析正确 |
| AC-012 | 批量创建 100 个 Feature | 100% 包含必填字段 |

---

## 8. 部署计划

### 8.1 实施顺序

```
Phase 1: Schema 修复（1 天）
  ├── 1.1 StateLoader.create() 增强（depth 计算、phaseHistory 初始化）
  ├── 1.2 TreeStateValidator.validate() 标准化
  └── 1.3 StateMachine 集成

Phase 2: Agent 智能增强（0.5 天）
  ├── 2.1 Discovery Workflow 拆分识别规则
  ├── 2.2 sddu-discovery.md.hbs 模板修改
  └── 2.3 sddu-spec.md.hbs 模板修改

Phase 3: E2E 测试（0.5 天）
  ├── 3.1 测试项目结构创建脚本
  ├── 3.2 childrens/depth/跨子树依赖验证脚本
  └── 3.3 运行 E2E 测试并修复

Phase 4: 文档和示例（0.5 天）
  ├── 4.1 拆分原则文档
  └── 4.2 树形示例项目
```

### 8.2 回滚策略

由于本次为增量修改，不涉及架构变更，回滚策略：
- 修改的文件通过 git revert 恢复
- 新建的文档/脚本/示例可直接删除
- 不影响现有 11 个 Feature 的 state.json

---

## 9. 风险评估

### 9.1 技术风险

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| StateLoader.create() 增强破坏已有调用方 | 高 | 低 | 保持签名不变，仅增强内部逻辑；编写单元测试覆盖所有调用路径 |
| depth 自动计算逻辑在特殊路径下出错 | 中 | 低 | 增加边界测试（EC-101），对异常路径使用 fallback depth=0 |
| TreeStateValidator.validate() 自动修复过度 | 中 | 低 | 严格区分"可修复"和"不可修复"场景，不可修复返回 valid=false |
| Agent 模板拆分建议误报 | 低 | 中 | 保守策略，仅匹配明确关键词；提供用户手动指定兜底（FR-111） |
| E2E 测试脚本环境依赖问题 | 低 | 低 | 使用纯 bash 实现，不依赖外部工具 |

### 9.2 依赖风险

| 风险 | 说明 | 缓解措施 |
|------|------|----------|
| 依赖 v2.4.0 已有模块 | tree-scanner.ts、schema-v2.0.0.ts 等 | v2.4.0 已通过验证，作为稳定依赖 |
| 历史 state.json 兼容性 | 现有 11 个 Feature 的 state.json 字段可能不完整 | TreeStateValidator.validate() 自动修复，不阻断 |

### 9.3 时间风险

| 风险 | 说明 | 缓解措施 |
|------|------|----------|
| Agent 模板调整需要多轮测试 | Agent prompt 行为难以精确控制 | 先实现核心拆分识别逻辑，Agent 模板行为可后续微调 |
| 示例项目文档编写耗时 | 需要编写完整的 3 层嵌套示例 | 使用脚本辅助生成 state.json 骨架，重点编写 README |

### 9.4 历史兼容性决策

关于现有 11 个 Feature 的 state.json（ADR-V2-005）：
- **策略**：保持兼容，不强制迁移
- **机制**：TreeStateValidator.validate() 在读取时自动修复缺失字段
- **日志**：自动修复操作记录 WARNING 级别日志
- **范围**：仅修复可自动推断的字段（version、depth、phaseHistory、dependencies、files）

---

## 10. 架构决策记录 (ADR)

本 Feature 涉及 5 个架构决策，详见 `decisions/` 目录：

| ADR 编号 | 决策标题 | 状态 |
|----------|----------|------|
| [ADR-V2-001](decisions/ADR-V2-001.md) | State Schema 验证策略（运行时验证 vs 创建时验证） | PROPOSED |
| [ADR-V2-002](decisions/ADR-V2-002.md) | 缺失字段处理策略（自动填充 vs 报错拒绝） | PROPOSED |
| [ADR-V2-003](decisions/ADR-V2-003.md) | 拆分建议触发规则（基于规则 vs 基于 AI 判断） | PROPOSED |
| [ADR-V2-004](decisions/ADR-V2-004.md) | 树形测试场景实现方式（脚本生成 vs 手动创建） | PROPOSED |
| [ADR-V2-005](decisions/ADR-V2-005.md) | 历史 state.json 兼容性处理（保持兼容 vs 强制迁移） | PROPOSED |

---

## 11. 验收标准

### 11.1 功能验收

- [ ] FR-101: StateLoader.create() 自动填充所有必填字段，depth 根据路径正确计算
- [ ] FR-102: TreeStateValidator.validate() 能检测并自动修复缺失字段，返回标准化 ValidationResult
- [ ] FR-103: StateLoader.create() 调用 validate() 后写入的 state.json 100% 合规
- [ ] FR-110: Discovery 能识别前后端分离、多端架构模式并输出拆分建议
- [ ] FR-111: Spec Agent 能处理 accept/reject/custom 三种选择，生成对应目录结构
- [ ] FR-120: E2E 测试项目结构正确（1 父 + 2 子 + 1 独立 Feature）
- [ ] FR-121: 父级 childrens 数组正确填充子级信息
- [ ] FR-122: 各层级 depth 值正确（parent=1, child=2, standalone=1）
- [ ] FR-123: 跨子树依赖解析正确，循环依赖能被检测
- [ ] FR-130: split-principles.md 包含所有章节
- [ ] FR-131: 树形示例项目包含 3 层嵌套，每个 state.json 合规

### 11.2 非功能验收

- [ ] TypeScript 严格模式编译通过（NFR-002）
- [ ] 自动修复不显著影响创建性能：100 次 < 500ms（NFR-003）
- [ ] 自动修复操作有 WARNING 级别日志（NFR-007）
- [ ] 公共 API 有 JSDoc 注释（NFR-005）
- [ ] 现有 11 个 Feature 不受影响（NFR-001）

---

## 12. 下一步

👉 运行 `@sddu-tasks tree-structure-optimization-v2` 开始任务分解
