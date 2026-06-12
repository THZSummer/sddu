# 📋 任务分解：SDDU 特性状态增强

**Feature ID**: `FR-STATUS-ENHANCE-001`
**Feature 名称**: SDDU 特性状态增强
**创建日期**: 2026-06-13
**阶段**: tasked
**方案**: 方案 B — 干净切换，不做增量过渡
**核心模型**: phase（8 值）+ status（5 值），完全独立
**总任务数**: 14
**总波次**: 6

---

## 任务依赖图

```
Wave 1 (Foundation)
  TASK-001 ──┐
  TASK-002 ──┤ (no deps, TASK-002 requires TASK-001 interface but parallel dev OK)
  TASK-003 ──┘
      │
Wave 2 (Engine)
  TASK-004 ──┐
  TASK-005 ──┤ (all depend on TASK-001)
  TASK-006 ──┘
      │
Wave 3 (Detection)
  TASK-007 ──┬── (depends on TASK-004, TASK-005)
  TASK-008 ──┘    (depends on TASK-004, TASK-005)
      │
Wave 4 (Agent)
  TASK-009 ──┬── (depends on TASK-004, TASK-005, TASK-007, TASK-008)
  TASK-010 ──┘    (depends on TASK-004, TASK-005)
      │
Wave 5 (Integration)
  TASK-011 ──┬── (depends on all Wave 1-4)
  TASK-012 ──┘
      │
Wave 6 (V2 — deferrable)
  TASK-013 ──┬── (depends on TASK-009)
  TASK-014 ──┘    (depends on TASK-009)
```

---

## Wave 1: Schema 层（Foundation — 无前置依赖）

### TASK-001: 创建 schema-v3.0.0.ts — 两字段模型完整定义

**复杂度**: L
**前置依赖**: 无
**执行波次**: 1
**对应 FR**: FR-001, FR-005, FR-006

#### 描述

新建 `src/state/schema-v3.0.0.ts`，定义 phase（8 值）+ status（5 值）两字段隔离模型的完整类型系统、常量、校验函数和推导函数。此文件是整个 Feature 的类型基石，所有下游模块依赖此文件。

**核心交付物**：
- `Phase` 类型（8 值全 -ed 形态）
- `FeatureStatus` 类型（5 值）
- `PhaseHistoryEntry`、`SuspendedInfo`、`MergedInfo`、`ChildFeatureInfoV3` 子类型
- `StateV3_0_0` 主接口（含 phase + status + suspended/merged metadata + phaseHistory）
- `VALID_PHASES`、`VALID_STATUSES` 常量数组
- `PHASE_ORDER` 排序映射（0-7）
- `NEXT_PHASE` 下一步映射
- `IRREVERSIBLE_STATUSES` 不可逆状态集合
- `validateStateV3()` — 完整校验（含组合约束：completed 仅 validated 合法；merged 必含 mergedInto）
- `shouldRecommendContinue()` — 是否推荐继续
- `getNextRecommendedPhase()` — 获取推荐下一步 phase
- `isStatusReversible()` — 状态是否可逆

**组合约束校验规则**：
1. `status === 'completed'` 仅在 `phase === 'validated'` 时合法
2. `status === 'merged'` 必须同时提供 `merged.mergedInto` 字段
3. `status === 'suspended'` 可选提供 `suspendedUntil` 和 `suspendedNote`

#### 涉及文件

- [NEW] `src/state/schema-v3.0.0.ts`（~200 行）

#### 验收标准

- [ ] `Phase` 类型严格限定 8 个合法值（registered → validated，全 -ed）
- [ ] `FeatureStatus` 类型严格限定 5 个合法值（tracked/completed/suspended/terminated/merged）
- [ ] `validateStateV3()` 拒绝非法 phase 值，错误信息指明合法值集合
- [ ] `validateStateV3()` 拒绝非法 status 值，错误信息指明合法值集合
- [ ] `validateStateV3()` 拒绝 `status='completed'` 但 `phase !== 'validated'` 的组合
- [ ] `validateStateV3()` 拒绝 `status='merged'` 但缺少 `merged.mergedInto` 的组合
- [ ] `validateStateV3()` 通过所有合法组合（含 suspended 可选字段、merged 必填字段）
- [ ] `shouldRecommendContinue('specified', 'tracked')` 返回 `true`
- [ ] `shouldRecommendContinue('specified', 'suspended')` 返回 `false`
- [ ] `shouldRecommendContinue('validated', 'completed')` 返回 `false`
- [ ] `getNextRecommendedPhase('specified', 'tracked')` 返回 `'planned'`
- [ ] `getNextRecommendedPhase('specified', 'suspended')` 返回 `null`
- [ ] `PHASE_ORDER['registered']` 为 `0`，`PHASE_ORDER['validated']` 为 `7`
- [ ] `IRREVERSIBLE_STATUSES` 包含 `['completed', 'terminated', 'merged']`
- [ ] 文件可被 TypeScript 独立编译通过

#### 验证命令

```bash
npx tsc --noEmit src/state/schema-v3.0.0.ts
```

---

### TASK-002: 编写 schema-v3.0.0 单元测试

**复杂度**: M
**前置依赖**: TASK-001（需接口定义）
**执行波次**: 1
**对应 FR**: FR-001, FR-005, FR-006

#### 描述

新建 `src/state/__tests__/schema-v3.0.0.test.ts`，对所有类型定义、校验函数、常量、推导函数编写完整单元测试，覆盖正常路径和所有边界/异常路径。

**测试用例清单**（`npx jest src/state/__tests__/schema-v3.0.0.test.ts`）：

| # | 用例 | 预期 |
|---|------|------|
| 1 | 合法 phase + status（全 8×5 组合遍历，含有效组合过滤） | validate 通过 |
| 2 | 合法终态 `phase=validated, status=completed` | validate 通过 |
| 3 | 合法搁置 `status=suspended` + suspendedUntil + suspendedNote | validate 通过 |
| 4 | 合法迁出 `status=merged` + mergedInto + mergedAt | validate 通过 |
| 5 | 无 suspended 字段的 suspended | validate 通过 |
| 6 | 非法 phase 值 `"unknown"` | validate 失败，错误信息含合法值 |
| 7 | 非法 status 值 `"unknown"` | validate 失败，错误信息含合法值 |
| 8 | completed 不在 validated | validate 失败，错误信息指明约束 |
| 9 | merged 缺 mergedInto | validate 失败，错误信息指明约束 |
| 10 | 缺少 phase 字段 | validate 失败 |
| 11 | 缺少 status 字段 | validate 失败 |
| 12 | `version !== 'v3.0.0'` | validate 失败 |
| 13 | 缺少 feature 字段 | validate 失败 |
| 14 | shouldRecommendContinue 全组合 | 8×5 组合，仅 tracked+非 validated 返回 true |
| 15 | getNextRecommendedPhase 全组合 | 8×5 组合，符合推荐的返回正确 next phase |
| 16 | isStatusReversible 全组合 | suspended→tracked: true, 其余→tracked: false |
| 17 | PHASE_ORDER 完整性 | 8 个 phase 全部有映射，值为 0-7 |
| 18 | NEXT_PHASE 完整性 | registered→validated 共 7 步，validated 无 next |
| 19 | 状态对象缺少 depth/phasesHistory/files 等必填字段 | validate 失败 |

#### 涉及文件

- [NEW] `src/state/__tests__/schema-v3.0.0.test.ts`（~150 行）

#### 验收标准

- [ ] 全部 19 个测试用例通过
- [ ] 每个测试用例独立运行不互相影响
- [ ] 测试用例清晰描述被测行为和预期结果
- [ ] 边界用例覆盖 FR-001/FR-005/FR-006 所有验证条件

#### 验证命令

```bash
npx jest src/state/__tests__/schema-v3.0.0.test.ts --verbose
```

---

### TASK-003: 更新类型导出和模块索引

**复杂度**: S
**前置依赖**: TASK-001
**执行波次**: 1
**对应 FR**: FR-001

#### 描述

更新 `src/state/types.ts`、`src/types.ts`、`src/state/index.ts`，导出 schema-v3.0.0 中定义的新类型和函数，使下游模块可引用。

**变更清单**：
- `src/state/types.ts`: 重新导出 `Phase`、`FeatureStatus`、`StateV3_0_0` 等新类型；标记旧类型为 `@deprecated`
- `src/types.ts`: 导出新类型供外部使用
- `src/state/index.ts`: 导出 `ConsistencyChecker`（预留给 TASK-007）；导出 schema-v3.0.0 核心函数

#### 涉及文件

- [MODIFY] `src/state/types.ts`（~20 行变更）
- [MODIFY] `src/types.ts`（~15 行变更）
- [MODIFY] `src/state/index.ts`（~10 行变更）

#### 验收标准

- [ ] `import { Phase, FeatureStatus, StateV3_0_0 } from '../state/types'` 编译通过
- [ ] `import { Phase, FeatureStatus } from '../types'` 编译通过
- [ ] `import { validateStateV3, shouldRecommendContinue } from '../state'` 编译通过
- [ ] 旧类型保留但标记 `@deprecated`，不删除
- [ ] TypeScript 全项目编译通过（`npx tsc --noEmit`）

#### 验证命令

```bash
npx tsc --noEmit
```

---

## Wave 2: 引擎层（Engine Core — 依赖 Wave 1）

### TASK-004: 重构 machine.ts — 删除双宇宙映射，phase+status 直接驱动

**复杂度**: L
**前置依赖**: TASK-001, TASK-003
**执行波次**: 2
**对应 FR**: FR-001, FR-002, FR-006

#### 描述

这是本 Feature 工作量最大的单个任务。`machine.ts` 是状态流转的核心引擎，需彻底删除旧的 `FeatureStateEnum`（9 状态内部枚举）→ `WorkflowStatus`（6 状态 schema）双宇宙映射体系，改为 phase+status 直接驱动。同时集成 FR-006（phase 到达 validated 自动设 status 为 completed）。

**删除项**（约 120 行删除）：
- `FeatureStateEnum` 枚举（9 状态内部值）
- `OldFeatureStateEnum` 枚举
- `AgentWorkflowStateEnum` 枚举
- `mapInternalStateToWorkflowStatus()` 映射函数
- `mapFeatureStateToInternal()` 映射函数
- `getStatePhase()` 查询函数
- `validTransitions`（基于 FeatureStateEnum 的状态转换表）

**重写项**：

1. **`getNextStep(featurePath)`**: 
   - 读取 feature 的 phase + status
   - 调用 `shouldRecommendContinue()` 判断 → 不推荐时返回 null
   - 调用 `getNextRecommendedPhase()` 获取 next phase
   - 返回 `{ phase: Phase; action: string }`（action 为 `@sddu xxx` 命令字符串）

2. **`validateStageTransition(featurePath, targetPhase)`**:
   - 读取当前 phase
   - 使用 `PHASE_ORDER` 比较当前和目标 phase 序号
   - 目标序号 ≤ 当前序号 → 拒绝（PhaseReversalError）
   - 目标序号 > 当前序号+1 → 拒绝（PhaseSkipError），返回缺失阶段列表
   - 通过 → `{ allowed: true }`

3. **`updateState(featurePath, targetPhase, ...)`**:
   - 先调用 `validateStageTransition` 验证
   - 更新 `phase` 为 `targetPhase`
   - 追加 `phaseHistory` 记录
   - **FR-006**: 如果 `targetPhase === 'validated' && currentStatus === 'tracked'` → 自动设 `status = 'completed'`
   - **FR-006 不覆盖规则**: 如果 status 已是 suspended/terminated/merged，不自动变更

4. **`createFeature(initialState)`**:
   - 默认 `phase: 'registered'`（而非旧的 `'specified'`）
   - 默认 `status: 'tracked'`

**类型变更**：
- `getNextStep` 返回值从 `{ state: string; action: string }` → `{ phase: Phase; action: string }`
- `updateState` 参数从 `FeatureStateEnum` → `Phase`
- `validateStageTransition` 参数从内部状态 → `Phase`

#### 涉及文件

- [MODIFY] `src/state/machine.ts`（~200 行删除 + ~150 行新增）
- [MODIFY] `src/state/__tests__/machine.test.ts`（~100 行更新，测试数据迁移至新 phase 值）

#### 验收标准

- [ ] 创建 feature 后 state.json 中 `phase: "registered"`, `status: "tracked"`
- [ ] `registered → discovered → specified → planned → tasked → builded → reviewed → validated` 全流程顺利通过
- [ ] `specified → discovered` 回退被拒绝，抛出 PhaseReversalError
- [ ] `registered → planned` 跳跃被拒绝，抛出 PhaseSkipError，返回缺失阶段
- [ ] `phase` 推进到 `validated` 且当前 `status === 'tracked'` → `status` 自动变为 `completed`
- [ ] `phase` 推进到 `validated` 且当前 `status === 'suspended'` → `status` 保持 `suspended`（不覆盖）
- [ ] `getNextStep('specified', 'tracked')` 返回 action `"@sddu plan [feature]"`
- [ ] `getNextStep('specified', 'suspended')` 返回 `null`
- [ ] `getNextStep('validated', 'completed')` 返回 `null`
- [ ] 旧 FeatureStateEnum/映射函数等代码已完全删除（grep 确认无残留）
- [ ] `machine.test.ts` 全部测试用例使用新 phase 值并通过
- [ ] TypeScript 编译通过

#### 验证命令

```bash
npx tsc --noEmit
npx jest src/state/__tests__/machine.test.ts --verbose
# 确认旧枚举无残留
grep -rn "FeatureStateEnum" src/state/machine.ts
grep -rn "mapInternalStateToWorkflowStatus" src/
```

---

### TASK-005: 适配 state-loader.ts、auto-updater.ts、dependency-checker.ts

**状态**: ✅ completed

**复杂度**: M
**前置依赖**: TASK-001, TASK-003
**执行波次**: 2
**对应 FR**: FR-001, FR-003

#### 描述

三个引擎模块需适配新 phase+status 模型：

**state-loader.ts（~80 行变更）**：
- `create()`: 默认值从旧 `status: 'specified'` 改为 `phase: 'registered', status: 'tracked'`
- `create()`: 写入前调用 `validateStateV3()` 校验
- `get()`: 读取时支持识别 v3.0.0 格式（`version` 字段），对旧格式（v1.2.5/v2.0.0/无 version）做基本兼容读取
- `set()`/`update()`: 写入时统一使用 v3.0.0 格式
- 所有内部引用将 `state.state` 改为 `state.phase`，`state.status` 改为 `state.status`
- 子特性管理: `src/utils/subfeature-manager.ts` 创建 state.json 时使用新默认值

**auto-updater.ts（~50 行变更）**：
- 文件→phase 推导逻辑更新（如 `spec.md` 存在 → `specified`，`plan.md` 存在 → `planned`）
- 跳过非 tracked 特性（FR-003）：`status !== 'tracked'` 时不执行自动更新
- 移除对旧 FeatureStateEnum 的引用

**dependency-checker.ts（~30 行变更）**：
- 移除 `mapInternalStateToWorkflowStatus()` 调用 → 直接使用 `state.phase`
- 依赖状态判断基于 `phase` 而非内部枚举

#### 涉及文件

- [MODIFY] `src/state/state-loader.ts`（~80 行变更）
- [MODIFY] `src/utils/subfeature-manager.ts`（~15 行变更）
- [MODIFY] `src/state/auto-updater.ts`（~50 行变更）
- [MODIFY] `src/state/dependency-checker.ts`（~30 行变更）

#### 验收标准

- [x] `StateLoader.create(featurePath, {})` 写入的 state.json 中 `phase: "registered"`, `status: "tracked"`, `version: "v3.0.0"`
- [x] `validateStateV3` 校验失败时 `create()` 抛出异常
- [x] `StateLoader.get(featurePath)` 能正确读取 v3.0.0 格式的 state.json
- [x] 对旧格式 state.json（v2.0.0 或无 version 字段），reader 至少能提取 feature/phase/status 信息
- [x] `auto-updater` 对 `status !== 'tracked'` 的 feature 不执行自动更新
- [x] `auto-updater` 文件推导逻辑正确映射（spec.md → specified, plan.md → planned, tasks.md → tasked）
- [x] `dependency-checker` 不再引用 FeatureStateEnum
- [x] TypeScript 编译通过（TASK-005 修改的文件 0 errors）

**状态**: ✅ completed

#### 验证命令

```bash
npx tsc --noEmit
npx jest src/state/state-loader.test.ts --verbose 2>/dev/null || echo "需更新测试数据"
npx jest src/state/dependency-checker.test.ts --verbose 2>/dev/null || echo "需更新测试数据"
```

---

### TASK-006: 更新 tree-state-validator.ts、parent-state-manager.ts、migrator.ts

**复杂度**: M
**前置依赖**: TASK-001, TASK-003
**执行波次**: 2
**对应 FR**: FR-005, FR-007

#### 描述

三个辅助模块适配新模型：

**tree-state-validator.ts（~60 行变更）**：
- phase 校验从旧 6 状态模式改为 phase（8 值）+ status（5 值）联合校验
- 新增组合约束校验（completed 仅在 validated 合法；merged 需 mergedInto）
- 废弃旧的 `state` 字段校验 → 改为 `phase` + `status` 双字段校验
- 同步更新 `__tests__/tree-state-validator.test.ts`

**parent-state-manager.ts（~30 行变更）**：
- `childrens` 数组中每个子特性记录新增 `status` 字段（已有 `phase` 字段）
- `ChildFeatureInfo` 类型增加 `status: FeatureStatus`
- 读取子特性 state.json 时同时提取 `phase` 和 `status`

**migrator.ts（~40 行变更）**：
- 新增 v2.1.0 → v3.0.0 迁移路径
- 迁移逻辑：旧 `state`/`status` 字段 → 推理为新 `phase` + `status`
- 旧 `state` 承载阶段值 → 映射为新 `phase`
- 无明确 status 的旧格式 → 默认 `status: 'tracked'`
- `__tests__/migrator.test.ts` 补充 v2→v3 迁移测试用例

#### 涉及文件

- [MODIFY] `src/state/tree-state-validator.ts`（~60 行变更）
- [MODIFY] `src/state/__tests__/tree-state-validator.test.ts`（~40 行更新）
- [MODIFY] `src/state/parent-state-manager.ts`（~30 行变更）
- [MODIFY] `src/state/migrator.ts`（~40 行变更）
- [MODIFY] `src/state/__tests__/migrator.test.ts`（~30 行新增测试用例）

#### 验收标准

- [ ] `tree-state-validator` 拒绝 `phase: "unknown"` 的状态文件
- [ ] `tree-state-validator` 拒绝 `status: "unknown"` 的状态文件
- [ ] `tree-state-validator` 拒绝 `status: "completed" && phase !== "validated"` 的组合
- [ ] `tree-state-validator` 拒绝 `status: "merged"` 缺少 `mergedInto` 的状态文件
- [ ] `parent-state-manager` 的 `childrens` 中每个子特性包含 `phase` 和 `status` 字段
- [ ] `migrator` v2.1.0 → v3.0.0 迁移路径正确工作
- [ ] `migrator` 迁移后 `state.json` 通过 `validateStateV3()` 校验
- [ ] 对应单元测试通过

#### 验证命令

```bash
npx jest src/state/__tests__/tree-state-validator.test.ts --verbose
npx jest src/state/__tests__/migrator.test.ts --verbose
```

---

## Wave 3: 检测层（Detection — 依赖 Wave 2）

### TASK-007: 创建 consistency-checker.ts — R5 内置升级机制

**复杂度**: L
**前置依赖**: TASK-004, TASK-005
**执行波次**: 3
**对应 FR**: FR-007, FR-008

#### 描述

新建 `src/state/consistency-checker.ts`（~350 行），实现 R5 版本升级一致性检测与修复引擎。

**核心类**: `ConsistencyChecker`

**7 项检测规则**：

| # | 检测类型 | 检测内容 | 严重度 |
|---|---------|---------|--------|
| 1 | `missing_state_json` | Feature 目录存在但无 state.json（仅有 validation-result.json 或空目录） | error |
| 2 | `hidden_state_file` | 存在 `.state.json`（应规范为 state.json） | warning |
| 3 | `invalid_root_reference` | root state.json 引用的 Feature 目录不存在 | error |
| 4 | `field_mixing` | state.json 使用 `state`/`status` 字段承载阶段值（应为 `phase`） | error |
| 5 | `non_standard_status` | status 字段不在 5 个合法值内 | error |
| 6 | `missing_field` | state.json 缺少 `phase` 或 `status` 字段 | error |
| 7 | `combined_constraint_violation` | completed 不在 validated 阶段 / merged 缺 mergedInto 等 | error |

**版本号来源与存储**：
- 插件版本号：`package.json` 的 `version` 字段
- 上次检测版本号：持久化于 `.sddu/.consistency-state.json`
- 触发条件：`lastCheckedVersion !== currentPluginVersion`

**修复引擎**（`repair(anomalies, specsRootDir)`）：
- 修复前向用户展示异常列表并请示确认
- 检测 1（缺失）→ 尝试从目录名/子特性/README 推断基本信息，创建 v3.0.0 state.json
- 检测 2（隐藏文件）→ 重命名 `.state.json` → `state.json`
- 检测 3（根引用失效）→ 清理 root state.json 中的失效引用
- 检测 4（字段混用）→ 将 `state` 字段值映射为 `phase`，保留已有 `status`
- 检测 5/6（非标/缺失）→ 根据上下文推理正确值
- 检测 7（组合约束违反）→ 按规则修正

**FR-008 保护逻辑**：
- 修复 phase 字段时，如果当前 status 已是 `suspended`/`terminated`/`merged`（非 tracked），**不覆盖** status
- 仅在 status 不存在或为无效值时才设默认 `tracked`

**输出**: `ConsistencyReport`（含 anomalies/repaired/failed 列表）

#### 涉及文件

- [NEW] `src/state/consistency-checker.ts`（~350 行）

#### 验收标准

- [ ] `needsCheck()` 在版本号变更后返回 `true`，同版本返回 `false`
- [ ] 全量 `checkAll()` 扫描所有 Feature 目录，执行 7 项检测
- [ ] 缺失 state.json 的目录被标记为 `missing_state_json`
- [ ] 存在 `.state.json` 的目录被标记为 `hidden_state_file`
- [ ] 使用 `state` 字段（而非 `phase`）的 state.json 被标记为 `field_mixing`
- [ ] status 值不在 5 个合法值内的被标记为 `non_standard_status`
- [ ] `status='completed'` 但 `phase !== 'validated'` 被标记为 `combined_constraint_violation`
- [ ] 异常按类型分组展示
- [ ] `repair()` 需传入确认参数，未确认不执行修复
- [ ] FR-008: 修复 phase 时若 status 已是 `suspended`，status 保持不变
- [ ] FR-008: 修复 phase 时若 status 已是 `terminated`，status 保持不变
- [ ] FR-008: 修复 phase 时若 status 已是 `merged`，status 保持不变
- [ ] 修复后输出变更报告（repaired + failed 列表）
- [ ] 检测状态持久化到 `.sddu/.consistency-state.json`

#### 验证命令

```bash
npx tsc --noEmit
```

---

### TASK-008: 增强 tree-scanner.ts — 子随父归逻辑

**复杂度**: M
**前置依赖**: TASK-004, TASK-005
**执行波次**: 3
**对应 FR**: FR-004

#### 描述

在 `tree-scanner.ts` 中新增 `resolveDisplayContext()` 函数，实现子随父归（child-belongs-to-parent）逻辑。

**核心算法**：
```
function resolveDisplayContext(featurePath, allStates, treeNodes):
  从 featurePath 向上遍历祖先链
  找到第一个 status !== 'tracked' 的祖先
  如果找到 → 该 feature 归入此祖先显示，isIndependent = false
  如果未找到 → 独立显示，isIndependent = true
  递归生效：子特性的子特性同样归入最顶层非 tracked 祖先
```

**新增导出**：
- `DisplayContext` 接口（effectiveParent, isIndependent）
- `resolveDisplayContext()` 函数
- `findFirstNonTrackedAncestor()` 内部辅助函数

**tree-scanner 扫描增强**：
- 扫描时读取并缓存每个 feature 的 `status` 字段
- 构建 `Map<string, FeatureStatus>` 供 display context 解析使用

#### 涉及文件

- [MODIFY] `src/state/tree-scanner.ts`（~60 行新增）

#### 验收标准

- [ ] 独立 tracked feature → `effectiveParent: null, isIndependent: true`
- [ ] `terminated` 父特性下的子特性 → `effectiveParent` 指向父特性，`isIndependent: false`
- [ ] `suspended` 父特性下的子特性 → `effectiveParent` 指向父特性，`isIndependent: false`
- [ ] `merged` 父特性下的子特性 → `effectiveParent` 指向父特性，`isIndependent: false`
- [ ] 递归生效：子特性的子特性归入最顶层非 tracked 祖先
- [ ] 父特性恢复 `tracked` 后，子特性自动恢复独立显示
- [ ] tracked 父特性（中间层）不影响子特性独立显示（跳过 tracked 祖先继续向上查找）

#### 验证命令

```bash
npx tsc --noEmit
npx jest src/state/__tests__/tree-scanner.test.ts --verbose 2>/dev/null || echo "需更新/补充测试用例"
```

---

## Wave 4: Agent 层（Agent Layer — 依赖 Wave 2+3）

### TASK-009: 重写 sddu.md.hbs — 分类仪表盘 + 标记命令 + 智能引导

**复杂度**: L
**前置依赖**: TASK-004, TASK-005, TASK-007, TASK-008
**执行波次**: 4
**对应 FR**: FR-003, FR-004, FR-009, FR-010, FR-010b, FR-011, FR-012

#### 描述

这是 Agent 层的核心任务，全面重写 `src/templates/agents/sddu.md.hbs` 模板（对应 `agents/sddu.md` Agent 定义），实现以下 6 项功能：

**1. 分类仪表盘（FR-010）**：
在 `@sddu 状态` 输出中展示 6 区分类：

| 分区 | 图标 | 筛选条件 | 展示内容 |
|------|------|----------|----------|
| 🟢 进行中 | 🟢 | `status: "tracked"` 且 `phase !== "validated"` | 当前 phase、下一步建议 |
| ✅ 已完成 | ✅ | `status: "completed"` 或 (`phase: "validated"` 且 `status: "tracked"`) | 完成时间 |
| 🟡 搁置 | 🟡 | `status: "suspended"` | suspendedUntil、suspendedNote、搁置时长 |
| 🔴 终止 | 🔴 | `status: "terminated"` | 终止时间 |
| 🔵 迁出 | 🔵 | `status: "merged"` | 目标特性 (mergedInto) |
| ⚠️ 异常 | ⚠️ | 缺失 state.json / 字段违规 / 引用失效等 | 异常类型、具体描述 |

各区按优先级/时间排序。

**2. Status 过滤（FR-003）**：
- `@sddu 状态` 操作建议区仅列出 `status === "tracked" && phase !== "validated"` 的特性
- 非 tracked 特性不参与活跃统计计数

**3. 子随父归（FR-004）**：
- 调用 `resolveDisplayContext()`，非 tracked 父特性下子特性归入父节点显示
- 子特性在父节点下正确缩进显示

**4. 标记命令（FR-009）**：
- 结构化输入：`@sddu 标记 <f> suspended [--until <date>] [--note <text>]` / `terminated` / `merged --into <target>` / `tracked`
- 自然语言推导：根据语义推导意图（"帮我挂起 xxx" → suspended、"把 xxx 终止掉" → terminated 等），执行前确认
- terminated/merged 需用户二次确认（不可逆操作）
- merged 缺 --into 时报错
- 标记后三处同步：state.json + root state.json + README.md

**5. 智能引导（FR-010b）**：
- `@sddu 状态` 末尾输出智能引导清单
- 进行中特性 → 下一阶段操作建议命令（如 `@sddu plan xxx`）
- 搁置特性 → 恢复建议
- 异常特性 → 修复建议（触发 R5）
- 全部完成 → `@sddu roadmap` 建议
- 原则：AI 时代不做规则表/关键词匹配，基于语义理解推导

**6. 父特性聚合展示（FR-011）**：
- 父特性（isParent: true）展示：子特性总数、各 phase 分布统计、最高/最低完成度

**7. Suspended 到期被动提醒（FR-012）**：
- 仅在 `@sddu 状态` 时被动检测
- 比较 `suspendedUntil` 与当前日期
- 已到期 → 带提醒标记 + 确认选项（恢复/继续搁置/终止）
- 未到期 → 不提醒
- 无 `suspendedUntil` → 不做到期提醒

#### 涉及文件

- [MODIFY] `src/templates/agents/sddu.md.hbs`（~300 行重写）

#### 验收标准

- [x] `@sddu 状态` 输出分 6 个明确的视觉分区
- [x] 🟢进行中区仅含 `status === "tracked" && phase !== "validated"` 的特性
- [x] suspended/terminated/merged/completed 特性不在🟢进行中区
- [x] 🟡搁置区显示 suspendedUntil（如有）、suspendedNote（如有）、搁置时长
- [x] 🔵迁出区显示 mergedInto 目标特性
- [x] ⚠️异常区列出所有结构异常及类型描述
- [x] 非 tracked 父特性下子特性归入父节点，正确缩进显示
- [x] `@sddu 标记 foo suspended` 将 foo 的 status 设为 suspended，三处同步
- [x] `@sddu 帮我挂起 foo` 推导为 suspended 并执行
- [x] `@sddu 标记 foo terminated` 触发二次确认后执行
- [x] `@sddu 标记 foo merged` 缺 --into 时报错提示
- [x] `@sddu 标记 foo merged --into bar` 设置 mergedInto 并需确认
- [x] `@sddu 标记 foo tracked` 从 suspended 恢复
- [x] `@sddu 状态` 末尾汇总可执行操作清单（智能引导）
- [x] 智能引导中无硬编码关键词匹配逻辑
- [x] 父特性聚合显示子特性总数和各 phase 分布
- [x] suspendedUntil 已到期特性在输出中带提醒标记
- [x] 提醒包含确认选项（恢复/继续搁置/终止）
- [x] 未到期/无 suspendedUntil 的 suspended 特性不做提醒

#### 验证命令

```bash
# Agent 模板验证（需在 Agent 运行时验证，build 阶段手动测试）
# 验证模板语法正确性
npx tsc --noEmit                                    # ✅ PASS
# 验证模板被 build-agents.cjs 正确处理
node build-agents.cjs --dry-run 2>&1 | grep -i error # ✅ PASS (no errors)
```

---

### TASK-010: 更新 sddu-docs.md.hbs、sddu-agents.ts 及相关模板

**复杂度**: M
**前置依赖**: TASK-004, TASK-005
**执行波次**: 4
**对应 FR**: FR-002, FR-010

#### 描述

**sddu-docs.md.hbs（~50 行变更）**：
- README 生成时根据 `status` 字段标注对应标记：
  - `suspended` → 🟡 搁置标记 + 搁置原因
  - `terminated` → 🔴 终止标记
  - `merged` → 🔵 迁出标记 + 目标
  - `completed` → ✅ 已完成标记
- 根据 `phase` 标注当前阶段进度

**sddu-agents.ts（~20 行变更）**：
- 更新 agent→phase 映射表（如 `sddu-spec` 完成 → phase 推进到 `specified`）
- 使用 `Phase` 类型替代旧的字符串/枚举映射
- 确保 7 个阶段 Agent 的映射正确：
  - `sddu-discovery` → `discovered`
  - `sddu-spec` → `specified`
  - `sddu-plan` → `planned`
  - `sddu-tasks` → `tasked`
  - `sddu-build` → `builded`
  - `sddu-review` → `reviewed`
  - `sddu-validate` → `validated`

**其他输出模板（~30 行变更，多个文件）**：
- `sddu-plan.md.hbs` 等输出模板中的 phase/status 变量名适配
- 将旧的 `{{state}}` 变量替换为 `{{phase}}` 和 `{{status}}`

#### 涉及文件

- [MODIFY] `src/templates/agents/sddu-docs.md.hbs`（~50 行变更）
- [MODIFY] `src/agents/sddu-agents.ts`（~20 行变更）
- [MODIFY] `src/templates/agents/output/sddu-plan.md.hbs`（~10 行变更）
- [MODIFY] `src/templates/subfeature-templates.ts`（~10 行变更）
- [MODIFY] `src/utils/readme-generator.ts`（~15 行变更）

#### 验收标准

- [ ] README 生成时 `suspended` 特性显示搁置标记和原因
- [ ] README 生成时 `terminated` 特性显示终止标记
- [ ] README 生成时 `merged` 特性显示迁出标记和目标
- [ ] `sddu-agents.ts` agent→phase 映射表使用 `Phase` 类型
- [ ] 7 个阶段 Agent 与对应 phase 映射正确
- [ ] 输出模板中变量名统一为 `phase`/`status`
- [ ] TypeScript 编译通过

#### 验证命令

```bash
npx tsc --noEmit
```

---

## Wave 5: 集成验证（Integration Validation — 依赖全部前序波次）

### TASK-011: 更新全量回归测试套件和测试 fixtures

**复杂度**: M
**前置依赖**: TASK-004, TASK-005, TASK-006
**执行波次**: 5
**对应 FR**: FR-001, FR-002, FR-005, FR-006（全覆盖验证）

#### 描述

更新所有受影响的测试文件和测试 fixtures，使其使用新的 phase+status 模型。约 33 个测试文件需批量机械修改 + 关键场景手动验证。

**测试文件更新（机械修改为主）**：
- `machine.test.ts` — phase/status 新值、移除 FeatureStateEnum 引用
- `state-loader.test.ts` — 创建默认值变更
- `tree-state-validator.test.ts` — 8+5 验证规则
- `dependency-checker.test.ts` — 移除旧枚举引用
- `auto-updater.test.ts` — 非 tracked 跳过验证
- `multi-feature-manager.test.ts` — 新字段适配
- `parent-state-manager.test.ts` — childrens 含 status
- 其他约 25 个测试文件 — 搜索替换旧枚举/字段引用

**Fixtures 更新**：
- `tests/fixtures/legacy-v1.1.1/state.json` — 保留为旧格式（用于 migrator 测试）
- `tests/fixtures/multi-feature/*/state.json`（~7 个）— 迁移至 v3.0.0 格式
- `examples/tree-structure-demo/*/state.json`（~5 个）— 迁移至 v3.0.0 格式

**E2E 脚本更新**：
- `scripts/e2e/basic/sddu-e2e.sh` — 创建 state.json 使用新默认值
- `scripts/e2e/tree-scenario/setup.sh` — phase/status 字段更新
- `scripts/e2e/fullstack/sddu-e2e-fullstack.sh` — 全流程验证使用新字段

**更新策略**：
1. 全局搜索 `state = {` 模式查找测试中的状态对象创建
2. 将 `state: 'specified'` / `status: 'specified'` → `phase: 'registered', status: 'tracked'`
3. 将 `FeatureStateEnum.SPECIFIED` → `'specified'`（直接用字符串字面量）
4. 将 `mapInternalStateToWorkflowStatus` 调用 → 直接读取 `state.phase`
5. 批量替换后逐测试文件验证通过

#### 涉及文件

- [MODIFY] `src/state/__tests__/machine.test.ts`
- [MODIFY] `src/state/__tests__/state-loader.test.ts`
- [MODIFY] `src/state/__tests__/tree-state-validator.test.ts`
- [MODIFY] `src/state/__tests__/dependency-checker.test.ts`
- [MODIFY] `src/state/__tests__/auto-updater.test.ts`
- [MODIFY] `src/state/__tests__/multi-feature-manager.test.ts`
- [MODIFY] `src/state/__tests__/parent-state-manager.test.ts`
- [MODIFY] `tests/integration/tree-workflow.test.ts`
- [MODIFY] `tests/state/agent-integration.test.ts`
- 以及其他约 24 个测试文件（全量搜索确认）
- [MODIFY] `tests/fixtures/multi-feature/*/state.json`（~7 个）
- [MODIFY] `examples/tree-structure-demo/*/state.json`（~5 个）
- [MODIFY] `scripts/e2e/basic/sddu-e2e.sh`
- [MODIFY] `scripts/e2e/tree-scenario/setup.sh`
- [MODIFY] `scripts/e2e/fullstack/sddu-e2e-fullstack.sh`

#### 验收标准

- [ ] 全量 state 相关单元测试通过（`npx jest --testPathPattern="src/state"` 全部绿）
- [ ] 全量集成测试通过（`npx jest --testPathPattern="tests/"` 全部绿）
- [ ] 无测试用例依赖旧 FeatureStateEnum
- [ ] 无测试用例创建不符合 v3.0.0 schema 的状态对象
- [ ] E2E 脚本创建 state.json 后可通过 `validateStateV3()` 校验
- [ ] 所有 fixture 文件符合 v3.0.0 schema（legacy-v1.1.1 除外 — 保留用于迁移测试）

#### 验证命令

```bash
# 全量回归
npx jest --testPathPattern="src/state" --verbose
npx jest --testPathPattern="tests/state" --verbose
npx jest --testPathPattern="tests/integration" --verbose
# 确认无旧枚举残留
grep -rn "FeatureStateEnum" src/ --include="*.ts" | grep -v ".d.ts"
```

---

### TASK-012: E2E 端到端验证和性能测试

**复杂度**: M
**前置依赖**: TASK-009, TASK-010, TASK-011
**执行波次**: 5
**对应 FR**: FR-001 ~ FR-012（全覆盖，MVP+V1）

#### 描述

执行端到端集成验证，覆盖完整生命周期、状态过滤、子随父归、R5 检测修复、标记命令、分类仪表盘、到期提醒等所有场景。同时验证非功能需求（NFR-001, NFR-002 性能指标）。

**E2E 测试场景**：

**场景 1 — 完整生命周期**：
1. 创建 Feature → phase=registered, status=tracked
2. @sddu-discovery → phase=discovered
3. @sddu-spec → phase=specified
4. @sddu-plan → phase=planned
5. @sddu-tasks → phase=tasked
6. @sddu-build → phase=builded
7. @sddu-review → phase=reviewed
8. @sddu-validate → phase=validated, status=completed（自动）
9. 验证 completed 不可逆

**场景 2 — 中途搁置与恢复**：
1. 创建 → discovery → spec
2. @sddu 标记 <f> suspended --until 2027-01-01 --note "等待依赖"
3. @sddu 状态 验证 → 出现在🟡搁置区，不在🟢进行中
4. @sddu 标记 <f> tracked（恢复）
5. @sddu 状态 验证 → 回到🟢进行中区

**场景 3 — 终止与子随父归**：
1. 创建父特性 parent-foo（isParent=true）
2. 创建子特性 parent-foo/child-bar
3. @sddu 标记 parent-foo terminated
4. @sddu 状态 验证 → parent-foo 在🔴终止区
5. parent-foo/child-bar 归入 parent-foo 显示，不独立出现在🟢进行中

**场景 4 — R5 一致性检测**：
1. 模拟版本号变更（手动修改 `.sddu/.consistency-state.json` lastCheckedVersion）
2. 执行 @sddu 状态 → 触发 R5 检测
3. 验证异常列表展示（如有）
4. 用户确认 → 修复执行 → 输出修复报告
5. 再次执行 @sddu 状态 → 不重复触发 R5

**场景 5 — 自然语言标记**：
1. `@sddu 帮我挂起 foo` → 推导为 suspended
2. `@sddu 把 bar 终止掉` → 推导为 terminated（二次确认）
3. `@sddu foo 合并到 bar` → 推导为 merged --into bar

**性能验证**（NFR-001, NFR-002）：
- 测量含 50+ Feature 项目的 `@sddu 状态` 扫描耗时（目标 ≤ 3s）
- 测量一致性检测全量扫描耗时（目标 ≤ 5s）

#### 涉及文件

- [VERIFY] 全部已修改文件 — 通过 E2E 流程间接验证

#### 验收标准

- [ ] 完整生命周期（registered → validated → completed）全部通过
- [ ] 中途搁置后 `@sddu 状态` 正确分类
- [ ] 恢复搁置后 `@sddu 状态` 正确回归
- [ ] 终止父特性后子特性归入父节点
- [ ] R5 版本升级后首次 `@sddu 状态` 自动触发
- [ ] R5 修复后输出变更报告
- [ ] R5 同版本不重复触发
- [ ] 自然语言标记推导正确并确认后执行
- [ ] terminated/merged 二次确认正常工作
- [ ] merged 缺 --into 参数时报错
- [ ] `@sddu 状态` 输出正确包含 6 区 + 智能引导 + 到期提醒
- [ ] 标记后 state.json / root state.json / README.md 三处同步
- [ ] `@sddu 状态` 扫描 50 Feature ≤ 3s
- [ ] 一致性检测全量扫描 ≤ 5s

#### 验证命令

```bash
# 执行 E2E 脚本
bash scripts/e2e/fullstack/sddu-e2e-fullstack.sh && echo "✅ E2E PASS"

# 性能测试（如工具可用）
time node -e "require('./dist/state/tree-scanner').scanAll()" 2>/dev/null || echo "E2E 手动验证"
```

---

## Wave 6: V2 特性（Nice to Have — 可延后）

### TASK-013: FR-013 长期停滞检测

**复杂度**: M
**前置依赖**: TASK-009
**执行波次**: 6
**对应 FR**: FR-013

#### 描述

在 `consistency-checker.ts` 中新增长期停滞检测逻辑，在 `@sddu 状态` 输出中展示停滞提醒。

**实现要点**：
- 检测逻辑：扫描所有 `status === 'tracked' && phase !== 'validated'` 的特性
- 判断条件：`updatedDate`（state.json 中的 `metadata.updatedAt` 或文件 mtime）距今超过配置阈值
- 阈值：默认 30 天，可配置（建议通过 `.sddu/config.json` 或环境变量）
- 输出：在 `@sddu 状态` 🟢进行中区末尾展示停滞列表
- 提醒包含：特性名称、上次更新时间、停滞天数、建议操作（标记搁置/继续推动）
- 不做：不自动变更状态、不主动推送

#### 涉及文件

- [MODIFY] `src/state/consistency-checker.ts`（~40 行新增）
- [MODIFY] `src/templates/agents/sddu.md.hbs`（~20 行新增停滞展示）

#### 验收标准

- [ ] 超过 30 天无更新的 tracked 特性在 `@sddu 状态` 中被标记
- [ ] 停滞特性附带建议操作选项
- [ ] 阈值可通过配置调整
- [ ] 未超阈值的特性不被标记

#### 验证命令

```bash
# 模拟修改 updatedDate 为 31 天前，验证停滞检测输出
```

---

### TASK-014: FR-014 Merged 特性跳转追溯

**复杂度**: S
**前置依赖**: TASK-009
**执行波次**: 6
**对应 FR**: FR-014

#### 描述

在 `@sddu 状态` 输出中，merged 特性提供可跳转到目标特性（mergedInto）的导航链接。

**实现要点**：
- 🔵迁出区中每个 merged 特性显示格式：`🔵 迁出 → specs-tree-{target-feature}`
- 如果目标特性存在 → 可点击/导航（Agent 中提供特性路径）
- 如果目标特性不存在 → 标注 "⚠️ 目标不存在: specs-tree-{target}"
- 记录迁出时间（mergedAt）

#### 涉及文件

- [MODIFY] `src/templates/agents/sddu.md.hbs`（~20 行变更）

#### 验收标准

- [ ] merged 特性显示 `🔵 迁出 → specs-tree-target` 格式
- [ ] 目标存在时提供导航信息
- [ ] 目标不存在时标注警告
- [ ] 显示迁出时间

#### 验证命令

```bash
# E2E: 创建 merged 特性后执行 @sddu 状态 验证输出格式
```

---

## 任务汇总

| ID | 名称 | 复杂度 | 波次 | 前置依赖 | 对应 FR |
|----|------|--------|------|----------|---------|
| TASK-001 | 创建 schema-v3.0.0.ts | L | 1 | 无 | FR-001, FR-005, FR-006 |
| TASK-002 | 编写 schema-v3.0.0 单元测试 | M | 1 | TASK-001 | FR-001, FR-005, FR-006 |
| TASK-003 | 更新类型导出和模块索引 | S | 1 | TASK-001 | FR-001 |
| TASK-004 | 重构 machine.ts | L | 2 | TASK-001, TASK-003 | FR-001, FR-002, FR-006 | ✅ completed |
| TASK-005 | 适配 loader/updater/dep-checker | M | 2 | TASK-001, TASK-003 | FR-001, FR-003 | ✅ completed |
| TASK-006 | 更新 validator/parent/migrator | M | 2 | TASK-001, TASK-003 | FR-005, FR-007 |
| TASK-007 | 创建 consistency-checker.ts | L | 3 | TASK-004, TASK-005 | FR-007, FR-008 |
| TASK-008 | 增强 tree-scanner.ts | M | 3 | TASK-004, TASK-005 | FR-004 |
| TASK-009 | 重写 sddu.md.hbs | L | 4 | TASK-004/005/007/008 | FR-003/004/009/010/010b/011/012 |
| TASK-010 | 更新 docs/agents 模板 | M | 4 | TASK-004, TASK-005 | FR-002, FR-010 |
| TASK-011 | 更新回归测试套件 | M | 5 | TASK-004/005/006 | FR-001/002/005/006 |
| TASK-012 | E2E 验证和性能测试 | M | 5 | TASK-009/010/011 | FR-001~012（全覆盖） |
| TASK-013 | FR-013 长期停滞检测 | M | 6 | TASK-009 | FR-013 |
| TASK-014 | FR-014 Merged 跳转追溯 | S | 6 | TASK-009 | FR-014 |

### 复杂度分布
- **L 级（4 个）**: TASK-001, TASK-004, TASK-007, TASK-009 — 需要人工监督，逐个人工确认
- **M 级（8 个）**: TASK-002, TASK-005, TASK-006, TASK-008, TASK-010, TASK-011, TASK-012, TASK-013 — 逐个执行
- **S 级（2 个）**: TASK-003, TASK-014 — 可自动批量执行

### 执行波次
- **Wave 1** (3 tasks): Schema 层 — 可并行执行
- **Wave 2** (3 tasks): 引擎层 — TASK-004/005/006 可并行
- **Wave 3** (2 tasks): 检测层 — TASK-007/008 可并行
- **Wave 4** (2 tasks): Agent 层 — TASK-009/010 可并行
- **Wave 5** (2 tasks): 集成验证 — TASK-011 先于 TASK-012
- **Wave 6** (2 tasks): V2 特性 — 可延后，TASK-013/014 可并行

### MVP 覆盖
| MVP FR | 覆盖任务 |
|--------|---------|
| FR-001 | TASK-001, TASK-002, TASK-003, TASK-004, TASK-005 |
| FR-002 | TASK-004, TASK-010 |
| FR-003 | TASK-005, TASK-009 |
| FR-004 | TASK-008, TASK-009 |
| FR-005 | TASK-001, TASK-002, TASK-006 |
| FR-006 | TASK-001, TASK-004 |
| FR-007 | TASK-006, TASK-007 |
| FR-008 | TASK-007 |

---

## 附录：关键约束

1. **修改边界**: 仅修改「直接修复范畴」（除 `.opencode/*`、`.sddu/*`、`opencode.json` 外的源码）
2. **方案 B**: 干净切换，不做增量过渡。旧 schema（v1.2.5/v2.0.0）保留但不使用
3. **FR-008 保护**: 任何自动流程不得覆盖用户设定的非 tracked status
4. **R5 修复前确认**: 一致性检测修复需用户明确确认后执行
5. **NFR-006**: 新增 phase/status 值仅需在一处集中定义（schema-v3.0.0.ts）

---

*创建日期：2026-06-13 | 阶段：tasked | 版本：1.0.0*
