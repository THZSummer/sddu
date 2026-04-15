# Task Breakdown: 树形结构优化 v2 - 问题修复

## 元数据

| 元数据 | 值 |
|--------|-----|
| **Feature ID** | `TSO-V2-001` |
| **Feature 名称** | 树形结构优化 v2 - 问题修复 |
| **规范版本** | 2.1.0 |
| **总任务数** | 20 个 |
| **复杂度分布** | S 级 11 个，M 级 6 个，L 级 3 个 |
| **执行波次** | 4 个波次 |
| **创建日期** | 2026-04-15 |

---

## 任务依赖图

```
Wave 1 (可并行 - 6 个任务):
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  T001: StateLoader.create() 增强 ─────────┐                      │
│                                           │                      │
│  T002: TreeStateValidator.validate() ─────┤── 核心代码修改       │
│                                           │                      │
│  T003: StateMachine.createFeature() ──────┘                      │
│                                           │                      │
│  T010: analyzeSplitSuggestion() ────────┐ │                      │
│                                         │ │                      │
│  T011: sddu-discovery.md.hbs ───────────┤── Agent 模板修改       │
│                                         │ │                      │
│  T012: Spec Agent 拆分确认 ─────────────┤ │                      │
│                                         │ │                      │
│  T013: sddu-spec.md.hbs ────────────────┘ │                      │
│                                           │                      │
│  T030: split-principles.md ───────────────┤── 文档（无代码依赖）  │
│                                           │                      │
│  T031: tree-structure-demo ───────────────┘                      │
│                                                                  │
└──────────────────────────┬───────────────────────────────────────┘
                           │
Wave 2 (依赖 Wave 1 - 5 个任务):
┌──────────────────────────▼───────────────────────────────────────┐
│                                                                  │
│  T004: StateLoader 单元测试 ◄── T001                             │
│                                                                  │
│  T005: TreeStateValidator 单元测试 ◄── T002                      │
│                                                                  │
│  T006: StateMachine 单元测试 ◄── T003                            │
│                                                                  │
│  T014: analyzeSplitSuggestion 单元测试 ◄── T010                  │
│                                                                  │
│  T020: setup-tree-scenario.sh ◄── T001,T002,T003 (schema 依赖)  │
│                                                                  │
└──────────────────────────┬───────────────────────────────────────┘
                           │
Wave 3 (依赖 Wave 2 - 4 个任务):
┌──────────────────────────▼───────────────────────────────────────┐
│                                                                  │
│  T021: verify-childrens.sh ◄── T020                              │
│                                                                  │
│  T022: verify-depth.sh ◄── T020                                  │
│                                                                  │
│  T023: verify-cross-tree-deps.sh ◄── T020                        │
│                                                                  │
│  T024: run-all-tests.sh (验证入口) ◄── T021,T022,T023            │
│                                                                  │
└──────────────────────────┬───────────────────────────────────────┘
                           │
Wave 4 (依赖 Wave 3 + Wave 2 - 2 个任务):
┌──────────────────────────▼───────────────────────────────────────┐
│                                                                  │
│  T040: 完整流程集成测试 ◄── T024, T004~T006, T014               │
│                                                                  │
│  T041: 回归测试 ◄── 所有 Wave 1~3                                │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Sprint 1: State Schema 修复

### TASK-001: StateLoader.create() 增强

**复杂度**: M
**前置依赖**: 无
**执行波次**: 1

### 描述
增强 `StateLoader.create()` 方法，实现以下功能：
1. **自动计算 depth**：根据 `featurePath` 中 `specs-tree-` 出现次数计算层级深度
2. **统一初始化 phaseHistory**：确保 phaseHistory 至少包含当前阶段记录
3. **设置时间戳**：添加 `createdAt` 和 `updatedAt` 字段
4. **调用 TreeStateValidator.validate()**：写入前进行最终校验和修复
5. **强制 version 为 'v2.1.0'**

### 涉及文件
- [MODIFY] `src/state/state-loader.ts`

### 实现要点
```typescript
// 新增方法
private computeDepth(featurePath: string): number {
  const matches = featurePath.match(/specs-tree-/g);
  return matches ? matches.length - 1 : 0;
}

private initPhaseHistory(initialState: Partial<StateV2_1_0>): PhaseHistory[] {
  // 统一 phaseHistory 初始化策略
}
```

### 验收标准
- [ ] `create()` 自动计算 depth（EC-101），不依赖调用方传入
- [ ] `create()` 强制设置 `version = 'v2.1.0'`
- [ ] `create()` 统一初始化 `phaseHistory`（EC-103）
- [ ] `create()` 设置 `createdAt` 和 `updatedAt` 时间戳
- [ ] `create()` 在写入前调用 `TreeStateValidator.validate()` 进行校验
- [ ] 保持 `create()` 签名不变（向后兼容，NFR-001）
- [ ] 自动修复操作记录 WARNING 级别日志（NFR-007）

### 验证命令
```bash
npx tsc --noEmit
npx jest src/state/state-loader.test.ts  # 创建后运行
```

---

### TASK-002: TreeStateValidator.validate() 标准化接口

**复杂度**: M
**前置依赖**: 无
**执行波次**: 1

### 描述
新增标准化的 `validate()` 接口，替代现有的 `validateNewState()` 内部方法。符合 spec 定义的 `ValidationResult` 格式，支持自动修复缺失字段。

### 涉及文件
- [MODIFY] `src/state/tree-state-validator.ts`

### 实现要点
```typescript
// 新增接口和类型
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  autoFixed: string[];
  state: StateV2_1_0;
}

public validate(state: Partial<StateV2_1_0>): ValidationResult {
  // 1. 检查并修复 version
  // 2. 检查并修复 depth
  // 3. 检查并修复 phaseHistory
  // 4. 检查并修复 dependencies
  // 5. 检查并修复 files
  // 返回 ValidationResult
}
```

### 验收标准
- [ ] 新增 `validate()` 方法，返回 `ValidationResult` 类型
- [ ] 能检测并自动修复缺失的 `version` 字段（EC-102）
- [ ] 能检测并自动修复缺失的 `depth` 字段（EC-101）
- [ ] 能检测并自动修复缺失的 `phaseHistory`（EC-103）
- [ ] 能检测并自动修复缺失的 `dependencies` 结构
- [ ] 能检测并自动修复缺失的 `files` 结构
- [ ] 严格区分"可修复"和"不可修复"场景，不可修复返回 `valid=false`（ADR-V2-002）
- [ ] 所有自动修复操作记录到 `warnings` 数组
- [ ] 保留现有 `validateNewState()` 方法以保证向后兼容

### 验证命令
```bash
npx tsc --noEmit
npx jest src/state/tree-state-validator.test.ts  # 创建后运行
```

---

### TASK-003: StateMachine.createFeature() 集成增强

**复杂度**: S
**前置依赖**: TASK-001, TASK-002
**执行波次**: 1

### 描述
修改 `StateMachine.createFeature()` 方法，使其调用增强后的 `StateLoader.create()`，只传递必要的初始信息，由 StateLoader 自动填充所有必填字段。

### 涉及文件
- [MODIFY] `src/state/machine.ts`

### 验收标准
- [ ] `createFeature()` 构建 `Partial<StateV2_1_0>` 只包含 name、status、phase 等必要字段
- [ ] 不再手动设置 `version`、`depth`、`phaseHistory`（交由 StateLoader 自动处理）
- [ ] 调用 `stateLoader.create(featurePath, initialState)` 创建状态
- [ ] 返回的 `StateV2_1_0` 包含所有必填字段
- [ ] 保持 `createFeature()` 对外接口不变

### 验证命令
```bash
npx tsc --noEmit
```

---

### TASK-004: StateLoader 单元测试

**复杂度**: M
**前置依赖**: TASK-001
**执行波次**: 2

### 描述
为 `StateLoader.create()` 编写完整的单元测试，覆盖所有自动填充逻辑和边界情况。

### 涉及文件
- [NEW] `src/state/state-loader.test.ts`（或在现有测试文件中新增用例）

### 验收标准
- [ ] 测试 `computeDepth()` 在多种路径下的正确性（root=0, 第一层=1, 第二层=2）
- [ ] 测试 `create()` 自动填充 `version='v2.1.0'`
- [ ] 测试 `create()` 自动计算 `depth`
- [ ] 测试 `create()` 初始化 `phaseHistory` 包含当前阶段
- [ ] 测试 `create()` 设置 `createdAt` 和 `updatedAt`
- [ ] 测试 `create()` 在传入完整 state 时不覆盖已有值
- [ ] 测试 `create()` 调用 TreeStateValidator.validate()
- [ ] 测试边界情况：特殊路径名、空路径名（EC-101）
- [ ] 测试覆盖率 > 85%（NFR-006）

### 验证命令
```bash
npx jest src/state/state-loader.test.ts --coverage
```

---

### TASK-005: TreeStateValidator 单元测试

**复杂度**: M
**前置依赖**: TASK-002
**执行波次**: 2

### 描述
为 `TreeStateValidator.validate()` 编写完整的单元测试，覆盖所有自动修复场景和边界情况。

### 涉及文件
- [NEW] `src/state/tree-state-validator.test.ts`（或在现有测试文件中新增用例）

### 验收标准
- [ ] 测试缺失 `version` 时自动设置为 `'v2.1.0'`
- [ ] 测试 `version='2.1.0'`（缺少 'v'）时自动修正（EC-102）
- [ ] 测试缺失 `depth` 时根据 feature 路径自动计算
- [ ] 测试缺失 `phaseHistory` 时初始化为当前阶段记录（EC-103）
- [ ] 测试缺失 `dependencies` 时初始化为 `{ on: [], blocking: [] }`
- [ ] 测试缺失 `files` 时初始化为 `{ spec: 'spec.md' }`
- [ ] 测试 `valid=false` 场景（字段类型错误无法修复）
- [ ] 测试 `autoFixed` 数组正确记录修复字段
- [ ] 测试 `warnings` 数组正确记录警告信息
- [ ] 测试覆盖率 > 90%（NFR-006）

### 验证命令
```bash
npx jest src/state/tree-state-validator.test.ts --coverage
```

---

### TASK-006: StateMachine 单元测试

**复杂度**: S
**前置依赖**: TASK-003
**执行波次**: 2

### 描述
为 `StateMachine.createFeature()` 编写集成测试，验证其调用增强后的 StateLoader 后，返回的 state 包含所有必填字段。

### 涉及文件
- [NEW] `src/state/machine.test.ts`（或在现有测试文件中新增用例）

### 验收标准
- [ ] 测试 `createFeature()` 返回的 state 包含 `version='v2.1.0'`
- [ ] 测试 `createFeature()` 返回的 state 包含正确的 `depth`
- [ ] 测试 `createFeature()` 返回的 state 包含 `phaseHistory.length >= 1`
- [ ] 测试 `createFeature()` 返回的 state 包含 `dependencies` 对象
- [ ] 测试 `createFeature()` 返回的 state 包含 `createdAt` 和 `updatedAt`
- [ ] 测试覆盖率 > 80%

### 验证命令
```bash
npx jest src/state/machine.test.ts --coverage
```

---

## Sprint 2: Agent 智能增强

### TASK-010: Discovery Workflow 拆分识别规则

**复杂度**: M
**前置依赖**: 无
**执行波次**: 1

### 描述
在 `src/discovery/workflow-engine.ts` 中新增 `analyzeSplitSuggestion()` 方法，基于关键词匹配识别常见拆分模式（前后端分离、多端架构、管理后台+用户端）。

### 涉及文件
- [MODIFY] `src/discovery/workflow-engine.ts`

### 实现要点
```typescript
interface SplitPattern {
  id: string;
  name: string;
  keywords: string[];
  description: string;
}

interface SplitSuggestion {
  patterns: SplitPattern[];
  ambiguous: boolean;
  suggestions: SplitSuggestionItem[];
}

export async function analyzeSplitSuggestion(userDescription: string): Promise<SplitSuggestion | null>
```

### 验收标准
- [ ] 实现 `analyzeSplitSuggestion()` 方法
- [ ] 能识别"前后端分离"模式（关键词：前端/后端/frontend/backend/client/server/web/api/ui/service）（AC-004）
- [ ] 能识别"多端架构"模式（关键词：ios/android/移动端/PC端/小程序/H5/app/web）（AC-005）
- [ ] 能识别"管理后台+用户端"模式（关键词：管理后台/用户端/后台/前台/admin/user）
- [ ] 未识别到拆分模式时返回 `null`
- [ ] 同时匹配多个模式时设置 `ambiguous=true` 并输出所有候选（EC-105）
- [ ] 生成 `suggestedChildren` 建议列表
- [ ] 公共 API 有 JSDoc 注释（NFR-005）

### 验证命令
```bash
npx tsc --noEmit
npx jest src/discovery/workflow-engine.test.ts  # 创建后运行
```

---

### TASK-011: Discovery Agent 模板修改

**复杂度**: S
**前置依赖**: TASK-010
**执行波次**: 1

### 涉及文件
- [MODIFY] `src/templates/agents/sddu-discovery.md.hbs`

### 验收标准
- [ ] 模板中包含拆分建议输出指引
- [ ] 指引说明何时会触发拆分建议
- [ ] 指引说明用户如何回应拆分建议（accept/reject/custom）
- [ ] 模板渲染结果格式正确

### 验证命令
```bash
# 验证模板语法
node -e "const hbs = require('handlebars'); const tmpl = require('fs').readFileSync('src/templates/agents/sddu-discovery.md.hbs', 'utf8'); hbs.compile(tmpl);"
```

---

### TASK-012: Spec Agent 拆分确认逻辑

**复杂度**: S
**前置依赖**: TASK-010
**执行波次**: 1

### 描述
在 Spec Agent 工作流中增加拆分确认处理逻辑，处理用户的 accept/reject/custom 三种选择。

### 涉及文件
- [MODIFY] `src/spec/` 相关文件（根据现有 Spec Agent 实现确定具体文件）

### 验收标准
- [ ] **接受拆分（accept）**：生成父级 Feature 目录（轻量化：discovery.md + spec.md + README.md + state.json），父级 state.json 记录 childrens 数组（AC-006）
- [ ] **拒绝拆分（reject）**：生成单个 Feature 完整叶子目录，记录拒绝原因到 discovery.md（AC-007）
- [ ] **自定义拆分（custom）**：使用用户指定的子 Feature 名称和数量生成目录结构
- [ ] 名称冲突或格式错误时返回错误提示（EC-106）

### 验证命令
```bash
npx tsc --noEmit
```

---

### TASK-013: Spec Agent 模板修改

**复杂度**: S
**前置依赖**: TASK-012
**执行波次**: 1

### 涉及文件
- [MODIFY] `src/templates/agents/sddu-spec.md.hbs`

### 验收标准
- [ ] 模板中包含拆分确认处理指引
- [ ] 指引覆盖 accept/reject/custom 三种选择
- [ ] 每种选择对应的操作步骤清晰
- [ ] 模板渲染结果格式正确

### 验证命令
```bash
node -e "const hbs = require('handlebars'); const tmpl = require('fs').readFileSync('src/templates/agents/sddu-spec.md.hbs', 'utf8'); hbs.compile(tmpl);"
```

---

### TASK-014: analyzeSplitSuggestion 单元测试

**复杂度**: S
**前置依赖**: TASK-010
**执行波次**: 2

### 描述
为 `analyzeSplitSuggestion()` 编写单元测试，覆盖所有拆分模式匹配和边界情况。

### 涉及文件
- [NEW] `src/discovery/workflow-engine.test.ts`（或新增拆分识别测试用例）

### 验收标准
- [ ] 测试"前端/后端"描述输出拆分建议（AC-004）
- [ ] 测试"iOS/Android"描述输出拆分建议（AC-005）
- [ ] 测试无拆分特征描述返回 `null`
- [ ] 测试同时匹配多个模式时 `ambiguous=true`
- [ ] 测试大小写不敏感匹配
- [ ] 测试覆盖率 > 80%

### 验证命令
```bash
npx jest src/discovery/workflow-engine.test.ts --coverage
```

---

## Sprint 3: 树形 E2E 测试

### TASK-020: E2E 测试场景初始化脚本

**复杂度**: S
**前置依赖**: TASK-001, TASK-002, TASK-003
**执行波次**: 2

### 描述
创建 `scripts/e2e/tree-scenario/setup.sh` 脚本，生成标准的树形嵌套测试项目结构（1 父 + 2 子 + 1 独立 Feature）。

### 涉及文件
- [NEW] `scripts/e2e/tree-scenario/setup.sh`

### 验收标准
- [ ] 清理旧测试数据（EC-107）
- [ ] 创建父级 Feature：`specs-tree-e2e-parent/`（depth=1）
- [ ] 创建子级 A：`specs-tree-e2e-parent/specs-tree-e2e-child-a/`（depth=2）
- [ ] 创建子级 B：`specs-tree-e2e-parent/specs-tree-e2e-child-b/`（depth=2）
- [ ] 创建独立 Feature：`specs-tree-e2e-standalone/`（depth=1）
- [ ] 每个 state.json 包含所有必填字段（version, depth, phaseHistory, dependencies, files）
- [ ] 父级 state.json 的 `childrens` 数组包含 2 个子级信息
- [ ] 子级 A 的 `dependencies.on` 引用 `specs-tree-e2e-standalone`
- [ ] 脚本执行成功返回 0，失败返回非 0

### 验证命令
```bash
bash scripts/e2e/tree-scenario/setup.sh && echo "✅ setup 成功"
```

---

### TASK-021: childrens 数组验证脚本

**复杂度**: S
**前置依赖**: TASK-020
**执行波次**: 3

### 描述
创建 `scripts/e2e/tree-scenario/verify-childrens.sh` 脚本，验证父级 state.json 的 childrens 数组正确填充。

### 涉及文件
- [NEW] `scripts/e2e/tree-scenario/verify-childrens.sh`

### 验收标准
- [ ] 读取父级 state.json，验证 `childrens` 字段存在且为数组（FR-121）
- [ ] 验证数组长度等于直接子 Feature 数量（=2）
- [ ] 验证每个子级条目包含 `name`、`status` 字段
- [ ] 验证 `name` 字段与子目录名称匹配
- [ ] 验证 `status` 字段为有效工作流状态值
- [ ] 验证失败时输出详细错误信息
- [ ] 纯 bash 实现，不依赖外部工具（ADR-V2-004）

### 验证命令
```bash
bash scripts/e2e/tree-scenario/setup.sh && bash scripts/e2e/tree-scenario/verify-childrens.sh
```

---

### TASK-022: depth 字段验证脚本

**复杂度**: S
**前置依赖**: TASK-020
**执行波次**: 3

### 描述
创建 `scripts/e2e/tree-scenario/verify-depth.sh` 脚本，验证各层级 state.json 的 depth 字段正确计算。

### 涉及文件
- [NEW] `scripts/e2e/tree-scenario/verify-depth.sh`

### 验收标准
- [ ] 验证父级 depth = 1（FR-122）
- [ ] 验证子级 A depth = 2（FR-122）
- [ ] 验证子级 B depth = 2（FR-122）
- [ ] 验证独立 Feature depth = 1（FR-122）
- [ ] 验证失败时输出预期值和实际值对比
- [ ] 纯 bash 实现

### 验证命令
```bash
bash scripts/e2e/tree-scenario/setup.sh && bash scripts/e2e/tree-scenario/verify-depth.sh
```

---

### TASK-023: 跨子树依赖验证脚本

**复杂度**: M
**前置依赖**: TASK-020
**执行波次**: 3

### 描述
创建 `scripts/e2e/tree-scenario/verify-cross-tree-deps.sh` 脚本，验证跨子树依赖解析和循环依赖检测。

### 涉及文件
- [NEW] `scripts/e2e/tree-scenario/verify-cross-tree-deps.sh`

### 验收标准
- [ ] 验证子级 A 能正确解析对 `specs-tree-e2e-standalone` 的跨子树依赖（FR-123）
- [ ] 验证能找到目标 Feature 的 state.json
- [ ] 验证能读取目标 Feature 的状态
- [ ] 验证循环依赖检测：创建 child-b → child-a → child-b 场景，验证能检测到循环（EC-108）
- [ ] 验证依赖目标不存在时标记为"未满足"（EC-104）
- [ ] 纯 bash 实现

### 验证命令
```bash
bash scripts/e2e/tree-scenario/setup.sh && bash scripts/e2e/tree-scenario/verify-cross-tree-deps.sh
```

---

### TASK-024: E2E 测试总入口脚本

**复杂度**: S
**前置依赖**: TASK-021, TASK-022, TASK-023
**执行波次**: 3

### 描述
创建 `scripts/e2e/tree-scenario/validate.sh` 脚本，作为所有树形 E2E 测试的统一入口，运行 setup 后依次执行各验证脚本。

### 涉及文件
- [NEW] `scripts/e2e/tree-scenario/validate.sh`

### 验收标准
- [ ] 先运行 setup.sh 创建测试项目
- [ ] 依次运行 verify-childrens.sh、verify-depth.sh、verify-cross-tree-deps.sh
- [ ] 输出每个测试的通过/失败状态
- [ ] 输出汇总结果（通过数/失败数/总数）
- [ ] 全部通过时返回 0，有失败时返回 1
- [ ] 输出格式清晰，便于 CI/CD 集成

### 验证命令
```bash
bash scripts/e2e/tree-scenario/validate.sh
```

---

## Sprint 4: 文档和示例

### TASK-030: 拆分原则文档

**复杂度**: S
**前置依赖**: 无
**执行波次**: 1

### 描述
创建 `docs/split-principles.md` 文档，指导用户何时拆分、如何拆分、拆分到什么粒度。

### 涉及文件
- [NEW] `docs/split-principles.md`

### 验收标准
- [ ] 文档包含"拆分时机判断规则"章节（FR-130a）
- [ ] 文档包含"拆分粒度建议"章节（FR-130b）
- [ ] 文档包含"父子关系定义规则"章节（FR-130c）
- [ ] 文档包含"常见拆分模式"章节，至少覆盖 4 种模式（FR-130d）
- [ ] 文档包含至少 2 个完整的拆分示例（FR-130e）
- [ ] 文档格式符合项目 Markdown 规范
- [ ] 文档内容完整度评分 ≥ 4/5（AC-009）

### 验证命令
```bash
# 检查文件存在性和关键章节
test -f docs/split-principles.md && \
grep -q "拆分时机" docs/split-principles.md && \
grep -q "拆分粒度" docs/split-principles.md && \
grep -q "父子关系" docs/split-principles.md && \
grep -q "常见拆分模式" docs/split-principles.md && \
grep -q "示例" docs/split-principles.md && \
echo "✅ 文档完整"
```

---

### TASK-031: 树形示例项目

**复杂度**: L
**前置依赖**: 无
**执行波次**: 1

### 描述
创建 `examples/tree-structure-demo/` 目录，展示 3 层嵌套、轻量化父级 + 完整叶子的完整示例。

### 涉及文件
- [NEW] `examples/tree-structure-demo/` 目录及所有子文件
- [NEW] `examples/tree-structure-demo/specs-tree-ecommerce-platform/`（父级，depth=0）
- [NEW] `examples/tree-structure-demo/specs-tree-ecommerce-platform/specs-tree-frontend/`（叶子，depth=1）
- [NEW] `examples/tree-structure-demo/specs-tree-ecommerce-platform/specs-tree-backend/`（父级，depth=1）
- [NEW] `examples/tree-structure-demo/specs-tree-ecommerce-platform/specs-tree-backend/specs-tree-api/`（叶子，depth=2）
- [NEW] `examples/tree-structure-demo/specs-tree-ecommerce-platform/specs-tree-backend/specs-tree-database/`（叶子，depth=2）
- [NEW] `examples/tree-structure-demo/README.md`

### 验收标准
- [ ] 3 层嵌套结构完整（FR-131）
- [ ] 父级 `ecommerce-platform` 为轻量化（discovery.md + spec.md + README.md + state.json）
- `frontend` 为完整叶子（discovery.md ~ validate.md 完整 6 阶段）
- `backend` 也是父级（discovery.md + spec.md + README.md + state.json）
- `api` 和 `database` 为完整叶子（6 阶段文档）
- [ ] 每个 state.json 包含正确的 `depth` 和 `childrens` 字段
- [ ] 演示跨子树依赖：frontend 依赖 api
- [ ] 示例项目 README.md 说明整体结构和使用方式
- [ ] 所有 state.json 通过 TreeStateValidator.validate() 校验（AC-010）

### 验证命令
```bash
# 检查目录结构
test -d examples/tree-structure-demo && \
test -f examples/tree-structure-demo/README.md && \
test -f examples/tree-structure-demo/specs-tree-ecommerce-platform/state.json && \
test -f examples/tree-structure-demo/specs-tree-ecommerce-platform/specs-tree-frontend/state.json && \
test -f examples/tree-structure-demo/specs-tree-ecommerce-platform/specs-tree-backend/state.json && \
test -f examples/tree-structure-demo/specs-tree-ecommerce-platform/specs-tree-backend/specs-tree-api/state.json && \
test -f examples/tree-structure-demo/specs-tree-ecommerce-platform/specs-tree-backend/specs-tree-database/state.json && \
echo "✅ 示例项目结构完整"
```

---

## Sprint 5: 集成测试

### TASK-040: 完整流程集成测试

**复杂度**: L
**前置依赖**: TASK-004, TASK-005, TASK-006, TASK-014, TASK-024
**执行波次**: 4

### 描述
编写完整的集成测试，覆盖从 Discovery 到 Validate 的全流程，验证树形结构下各阶段的正确性。

### 涉及文件
- [NEW] `tests/integration/tree-workflow.test.ts`

### 验收标准
- [ ] 测试完整工作流：discovery → spec → plan → tasks → build → review → validate（FR-120）
- [ ] 测试父级 Feature 在 tasks/build/review/validate 阶段被正确拦截
- [ ] 测试叶子 Feature 能走完整 6 阶段
- [ ] 测试跨子树依赖解析（FR-123）
- [ ] 测试 childrens 数组自动更新（FR-121）
- [ ] 测试 depth 自动计算（FR-122）
- [ ] 测试 E2E 场景验证脚本集成（TASK-024）
- [ ] 所有单元测试通过

### 验证命令
```bash
npx jest tests/integration/tree-workflow.test.ts --coverage
```

---

### TASK-041: 回归测试

**复杂度**: L
**前置依赖**: TASK-001, TASK-002, TASK-003, TASK-010, TASK-024, TASK-030, TASK-031
**执行波次**: 4

### 描述
确保本次 v2 修改不破坏现有功能，验证现有 11 个 Feature 的正常运行（NFR-001）。

### 涉及文件
- [NEW] `tests/regression/existing-features.test.ts`
- [MODIFY] `scripts/e2e/basic/sddu-e2e.sh`（如有需要）

### 验收标准
- [ ] 现有 11 个 Feature 的 state.json 仍能被正确读取（NFR-001）
- [ ] 现有 Feature 的目录结构保持不变
- [ ] 历史 state.json 缺失字段能被 TreeStateValidator.validate() 自动修复（ADR-V2-005）
- [ ] 自动修复操作记录 WARNING 级别日志
- [ ] 现有 E2E 测试脚本仍能通过
- [ ] TypeScript 严格模式编译通过（NFR-002）
- [ ] 100 次 state.json 创建耗时 < 500ms（NFR-003）

### 验证命令
```bash
# 回归测试 - 验证现有功能不受影响
npx jest tests/regression/ --coverage

# 性能测试 - 100 次创建
node -e "
const start = Date.now();
// 模拟 100 次创建...
const elapsed = Date.now() - start;
console.log('100 次创建耗时:', elapsed, 'ms');
process.exit(elapsed > 500 ? 1 : 0);
"

# 类型检查
npx tsc --noEmit
```

---

## 任务汇总

### 复杂度分布

| 复杂度 | 数量 | 任务列表 |
|--------|------|----------|
| **S** | 11 个 | T003, T006, T011, T012, T013, T014, T020, T021, T022, T024, T030 |
| **M** | 6 个 | T001, T002, T004, T005, T010, T023 |
| **L** | 3 个 | T031, T040, T041 |

### 按波次分布

| 波次 | 任务数 | 任务列表 | 可并行 |
|------|--------|----------|--------|
| **Wave 1** | 9 个 | T001, T002, T003, T010, T011, T012, T013, T030, T031 | 是（T003 依赖 T001/T002，可与 T010~T013/T030/T031 并行） |
| **Wave 2** | 5 个 | T004, T005, T006, T014, T020 | 是 |
| **Wave 3** | 4 个 | T021, T022, T023, T024 | 部分（T021/T022/T023 可并行，T024 依赖前 3 个） |
| **Wave 4** | 2 个 | T040, T041 | 是 |

> 注：T003 在 Wave 1 中但依赖 T001/T002 完成，实际可与 T010+ 并行

### 并行执行建议

```
Wave 1 (并行度 8):
  ├── Group A (State Schema):  T001, T002  →  T003
  ├── Group B (Agent 增强):    T010  →  T011, T012  →  T013
  └── Group C (文档/示例):     T030, T031  （完全独立）

Wave 2 (并行度 5):
  ├── T004 (依赖 T001)
  ├── T005 (依赖 T002)
  ├── T006 (依赖 T003)
  ├── T014 (依赖 T010)
  └── T020 (依赖 T001, T002, T003)

Wave 3 (并行度 3+1):
  ├── T021 (依赖 T020) ─┐
  ├── T022 (依赖 T020) ─┤── 可并行
  ├── T023 (依赖 T020) ─┘
  └── T024 (依赖 T021, T022, T023)

Wave 4 (并行度 2):
  ├── T040 (依赖 T024, T004~T006, T014)
  └── T041 (依赖所有 Wave 1~3)
```

### 任务执行顺序总览

```
T001 ──┐
       ├──→ T003 ──┐
T002 ──┘           ├──→ T004 ──┐
                   │           │
                   ├──→ T005 ──┤
                   │           │              ┌──→ T040
                   ├──→ T020 ──┼──→ T021 ────┤
                   │           │     T022 ────┤
T010 ──┐           │           │     T023 ────┤    ┌──→ T041
       ├──→ T014 ──┘           │              └───→┘         │
       │                       │                             │
T010 ──┤──→ T011 ──┐           │                             │
       │           │           │                             │
       └──→ T012 ──┴──→ T013 ─┘                             │
                                                            │
T030 ───────────────────────────────────────────────────────┘
T031 ───────────────────────────────────────────────────────┘
```

---

## AC 与任务映射

| AC-ID | 对应任务 | 验证方式 |
|-------|----------|----------|
| AC-001 | T001, T003, T004, T006 | 创建新 Feature 检查 state.json |
| AC-002 | T002, T005 | 传入缺失字段的 state 对象 |
| AC-003 | T001, T004 | create() 后读取文件 |
| AC-004 | T010, T014 | 输入含"前端/后端"的描述 |
| AC-005 | T010, T014 | 输入含"iOS/Android"的描述 |
| AC-006 | T012, T013 | 模拟 accept 选择 |
| AC-007 | T012, T013 | 模拟 reject 选择 |
| AC-008 | T020, T021, T022 | 检查 E2E 测试项目 |
| AC-009 | T030 | 检查 split-principles.md |
| AC-010 | T031 | 检查示例项目 |
| AC-011 | T023, T040 | 运行跨子树依赖测试 |
| AC-012 | T004, T041 | 批量创建 100 个 Feature |

---

## NFR 与任务映射

| NFR-ID | 对应任务 | 验收标准 |
|--------|----------|----------|
| NFR-001 | T001, T041 | 现有 11 个 Feature 不受影响 |
| NFR-002 | T001, T002, T041 | TypeScript 严格模式编译通过 |
| NFR-003 | T001, T041 | 100 次创建 < 500ms |
| NFR-005 | T010 | 公共 API 有 JSDoc 注释 |
| NFR-006 | T004, T005, T006, T014, T040 | 测试覆盖率达标 |
| NFR-007 | T001, T002, T041 | 自动修复有 WARNING 日志 |
