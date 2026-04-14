# Task Breakdown: v2.4.0 Feature 拆分与树形结构优化

## 元数据

| 元数据 | 值 |
|--------|-----|
| **Feature ID** | `tree-structure-optimization` |
| **总任务数** | 14 个 |
| **复杂度分布** | S 级 5 个，M 级 8 个，L 级 1 个 |
| **执行波次** | 4 个波次 |

---

## 任务列表

### Wave 1: 基础设施

#### TASK-001: Schema v2.1.0 升级

**复杂度**: M
**前置依赖**: 无
**执行波次**: 1

**描述**
原地升级 `schema-v2.0.0.ts`，新增 v2.1.0 树形字段。统一按新设计实施，不做旧版兼容适配。

**涉及文件**
- [MODIFY] `src/state/schema-v2.0.0.ts`

**验收标准**
- [x] 新增 `ChildFeatureInfo` 接口
- [x] `StateV2_1_0` 接口继承或扩展 v2.0.0，新增 `childrens` 数组和 `depth` 字段
- [x] `version` 字段类型必须为字面量 `'v2.1.0'`（带 'v' 前缀）
- [x] `validateStateV2_1_0()` 验证函数实现（包含 version 格式校验）
- [x] TypeScript 编译通过，无类型错误

**验证命令**
```bash
npx tsc --noEmit
```

---

#### TASK-002: TreeScanner 实现 + 测试

**复杂度**: S
**前置依赖**: TASK-001
**执行波次**: 1

**描述**
实现纯函数模块 `tree-scanner.ts`，递归扫描 `specs-tree-*` 目录结构。

**涉及文件**
- [NEW] `src/state/tree-scanner.ts`
- [NEW] `src/state/tree-scanner.test.ts`

**验收标准**
- [x] `scanTreeStructure(rootDir)` 返回 `ScanResult { nodes, flatMap }`
- [x] 正确识别任意深度嵌套的 `specs-tree-*` 目录
- [x] `flatMap` 提供 O(1) 路径查找
- [x] `isParentFeature(node)` 正确判断父级/叶子
- [x] 单元测试覆盖率 > 80%

**验证命令**
```bash
npx jest tree-scanner.test.ts
```

---

#### TASK-003: StateLoader 实现

**复杂度**: M
**前置依赖**: TASK-001, TASK-002
**执行波次**: 1

**描述**
实现分布式状态加载器 `StateLoader`，替代集中式 `.sdd/state.json` 读写。

**涉及文件**
- [NEW] `src/state/state-loader.ts`

**验收标准**
- [x] `loadAll()` 通过 TreeScanner 扫描并加载所有分布式 state.json
- [x] `get(featurePath)` 读取单个 Feature 状态
- [x] `set(featurePath, state)` 写入单个 Feature 状态
- [x] `create(featurePath, initialState)` 创建新 Feature 状态
- [x] `create()` 方法初始化 `version` 必须为 `'v2.1.0'`（FR-062）
- [x] `create()` 方法确保所有必填字段存在：`phaseHistory`, `files`, `dependencies`, `depth`（FR-061）
- [x] `create()` 方法创建后调用 `validateStateV2_1_0` 验证 schema 合规性（FR-060）
- [x] 缓存机制（3 秒过期）
- [x] 不再读写 `.sdd/state.json` 文件

**验证命令**
```bash
npx tsc --noEmit
```

---

### Wave 2: 核心重构

#### TASK-004: StateMachine 重构为分布式

**复杂度**: L
**前置依赖**: TASK-003
**执行波次**: 2

**描述**
重构 `StateMachine`，删除集中式 `.sdd/state.json` 的 load/save 逻辑，改用 StateLoader。

**涉及文件**
- [MODIFY] `src/state/machine.ts`

**验收标准**
- [x] `load()` 使用 StateLoader 分布式加载
- [x] `save()` 变为空操作或仅触发缓存刷新
- [x] `updateState()` 通过 StateLoader 写入分布式文件
- [x] `isParentFeature()` 识别父级 Feature
- [x] `checkRequiredFiles()` 对父级只检查 discovery/spec/plan
- [x] 删除所有 `.sdd/state.json` 读写代码
- [x] 依赖注入 StateLoader

**验证命令**
```bash
npx tsc --noEmit
```

---

#### TASK-005: Types/Errors 扩展

**复杂度**: S
**前置依赖**: TASK-001
**执行波次**: 2

**描述**
更新类型定义和错误码，支持树形结构。

**涉及文件**
- [MODIFY] `src/types.ts`
- [MODIFY] `src/errors.ts`

**验收标准**
- [x] `types.ts` 导出 `FeatureTreeNode`, `ScanResult`, `StateV2_1_0` 等
- [x] `errors.ts` 新增 `ErrorCode`：`TREE_SCAN_FAILED`, `TREE_DEPTH_EXCEEDED`, `CROSS_TREE_DEP_NOT_FOUND`, `PARENT_STATE_UPDATE_FAILED`
- [x] 所有新增错误码有对应的错误类或工厂函数

**验证命令**
```bash
npx tsc --noEmit
```

---

#### TASK-006: ParentStateManager 实现

**复杂度**: S
**前置依赖**: TASK-002, TASK-003
**执行波次**: 2

**描述**
实现父级状态扫描更新逻辑，维护 `childrens` 数组。

**涉及文件**
- [NEW] `src/state/parent-state-manager.ts`

**验收标准**
- [x] `scanAndUpdateParentState(parentDir)` 扫描子 Feature 并更新 `childrens`
- [x] 正确读取子 Feature state.json 的 `status` 字段
- [x] 处理子 Feature 不存在或 state.json 读取失败的情况
- [x] 更新后写入父级 state.json

**验证命令**
```bash
npx tsc --noEmit
```

---

### Wave 3: 核心模块改造

#### TASK-007: AutoUpdater 递归扫描改造

**复杂度**: M
**前置依赖**: TASK-004
**执行波次**: 3

**描述**
改造 `AutoUpdater` 支持递归扫描和嵌套路径提取。

**涉及文件**
- [MODIFY] `src/state/auto-updater.ts`

**验收标准**
- [x] `getAllFeatureIds()` 使用 TreeScanner 返回完整路径列表
- [x] `scanAndAutoUpdate()` 支持嵌套路径
- [x] 路径提取逻辑适配 `specs-tree-parent/specs-tree-child` 格式
- [x] 防抖逻辑正常工作

**验证命令**
```bash
npx tsc --noEmit
```

---

#### TASK-008: DependencyChecker 跨子树改造

**复杂度**: M
**前置依赖**: TASK-004
**执行波次**: 3

**描述**
改造 `DependencyChecker` 支持跨子树依赖解析。

**涉及文件**
- [MODIFY] `src/state/dependency-checker.ts`

**验收标准**
- [x] `scanAllFeatures()` 使用 TreeScanner 递归扫描
- [x] 依赖路径解析支持 `specs-tree-parent/specs-tree-child` 格式
- [x] `checkDependenciesForStateChange()` 正确处理跨子树依赖
- [x] 循环依赖检测覆盖嵌套结构

**验证命令**
```bash
npx tsc --noEmit
```

---

#### TASK-009: SubFeatureManager 树形改造

**复杂度**: S
**前置依赖**: TASK-002
**执行波次**: 3

**描述**
改造 `SubFeatureManager`，废弃 `sub-features/` 中间层模式。

**涉及文件**
- [MODIFY] `src/utils/subfeature-manager.ts`

**验收标准**
- [x] `detectFeatureMode()` 通过检查 `specs-tree-*` 子目录判断父/叶
- [x] `createSubFeature()` 创建正确的嵌套目录结构
- [x] 移除所有 `sub-features/` 路径引用
- [x] 兼容旧的 `sub-features/` 目录存在但不优先识别

**验证命令**
```bash
npx tsc --noEmit
```

---

#### TASK-013: State 生成验证增强

**复杂度**: M
**前置依赖**: TASK-003
**执行波次**: 3

**描述**
实现 `TreeStateValidator.validateNewState`，处理 EC-012~EC-014 边界情况。确保所有新创建的 state.json 严格符合 v2.1.0 schema，对异常情况进行自动修复。

**涉及文件**
- [NEW] `src/state/tree-state-validator.ts`
- [NEW] `src/state/tree-state-validator.test.ts`

**验收标准**
- [ ] 检测缺失必填字段并警告/自动填充默认值（EC-012）
- [ ] 检测 `version` 非 `'v2.1.0'`（如 `'2.1.0'`）并自动修正为 `'v2.1.0'`（EC-013）
- [ ] 检测 `phaseHistory` 为空数组但 `phase > 0` 并自动填充历史阶段记录（EC-014）
- [ ] 所有自动修正操作记录警告日志
- [ ] 单元测试覆盖率 > 80%

**验证命令**
```bash
npx jest tree-state-validator.test.ts
```

---

### Wave 4: Agent 与集成

#### TASK-010: 主路由 Agent 改造

**复杂度**: M
**前置依赖**: TASK-004
**执行波次**: 4

**描述**
改造主路由 Agent 模板 `sddu.md.hbs`，支持树形路径和父/叶角色拦截。

**涉及文件**
- [MODIFY] `src/templates/agents/sddu.md.hbs`

**验收标准**
- [x] 状态检查改为递归扫描树形结构
- [x] 不再读取 `.opencode/sdd/state.json`
- [x] 父级 Feature 拒绝 tasks/build/review/validate 阶段
- [x] 路径模式支持 `**/specs-tree-[name]/` 通配
- [x] 路由提示包含正确的树形路径

**验证命令**
```bash
# 手动测试路由提示
```

---

#### TASK-011: DiscoveryWorkflow 拆分建议

**复杂度**: S
**前置依赖**: 无
**执行波次**: 4

**描述**
在 Discovery Workflow 中增加 Feature 拆分建议输出。

**涉及文件**
- [MODIFY] `src/discovery/workflow-engine.ts`

**验收标准**
- [x] 新增 `suggestSplit(context)` 方法
- [x] 识别多模块需求并输出拆分建议
- [x] 在 discovery 完成后调用

**验证命令**
```bash
npx tsc --noEmit
```

---

#### TASK-012: Index 集成与整体联调

**复杂度**: M
**前置依赖**: TASK-004, TASK-007, TASK-008, TASK-010, TASK-011
**执行波次**: 4

**描述**
更新插件入口 `index.ts`，集成所有树形模块，验证完整工作流。

**涉及文件**
- [MODIFY] `src/index.ts`

**验收标准**
- [x] StateMachine 初始化传入 StateLoader
- [x] 删除所有 `.sddu/state.json` 相关代码  
- [x] 文件监听覆盖嵌套路径
- [x] 完整工作流测试：discovery → spec → plan → tasks → build → review → validate
- [x] 父级/叶子状态管理正确

**验证命令**
```bash
npm run build
```

---

#### TASK-014: 树形嵌套 E2E 测试脚本

**复杂度**: M
**前置依赖**: TASK-001, TASK-002, TASK-003, TASK-004, TASK-005, TASK-006, TASK-007, TASK-008, TASK-009, TASK-010, TASK-011, TASK-012, TASK-013
**执行波次**: 4

**描述**
增强 `scripts/e2e/basic/sddu-e2e.sh`，支持生成 1 父 + 2 子的树形测试结构，验证完整的树形嵌套场景（FR-070 ~ FR-073）。

**涉及文件**
- [MODIFY] `scripts/e2e/basic/sddu-e2e.sh`
- [NEW] `scripts/e2e/basic/e2e-tree-scenario.sh`（可选，独立树形场景脚本）

**验收标准**
- [ ] 脚本能生成 `specs-tree-e2e-parent` 父级目录及两个子目录 `specs-tree-e2e-child-a`、`specs-tree-e2e-child-b`（FR-070）
- [ ] 父级 `state.json` 的 `childrens` 数组包含两个子级信息（name, status, lastScannedAt）（FR-071）
- [ ] 父级 `depth` = 0，子级 `depth` = 1（FR-072）
- [ ] 子级 A 的 `dependencies.on` 包含子级 B 的完整路径（跨子树依赖）（FR-073）
- [ ] 所有 `state.json` 的 `version` 为 `'v2.1.0'`
- [ ] 所有必填字段完整存在
- [ ] 运行脚本后 TreeScanner 能正确扫描出 1 父 2 子结构
- [ ] 运行脚本后 StateLoader 能正确加载所有状态

**验证命令**
```bash
bash scripts/e2e/basic/sddu-e2e.sh --scenario tree
```

---

## 依赖关系图

```
Wave 1:
  TASK-001 (Schema)
    ├── TASK-002 (TreeScanner)
    │     └── TASK-003 (StateLoader)
    │           ├── TASK-006 (ParentStateManager)
    │           └── TASK-013 (State Validator) ← 新增
    └── TASK-005 (Types/Errors)

Wave 2:
  TASK-004 (StateMachine) ← TASK-003

Wave 3:
  TASK-007 (AutoUpdater) ← TASK-004
  TASK-008 (DependencyChecker) ← TASK-004
  TASK-009 (SubFeatureManager) ← TASK-002
  TASK-013 (State Validator) ← TASK-003  ← 新增

Wave 4:
  TASK-010 (Main Router) ← TASK-004
  TASK-011 (Discovery)
  TASK-012 (Index Integration) ← TASK-004, 007, 008, 010, 011
  TASK-014 (E2E Tree Test) ← ALL TASK-001 ~ TASK-013  ← 新增
```

> **变更说明**:
> - 🔵 **TASK-013** 新增于 Wave 3，依赖 TASK-003（StateLoader），实现 State 生成验证增强
> - 🔵 **TASK-014** 新增于 Wave 4，依赖所有核心任务，验证完整树形嵌套 E2E 场景
