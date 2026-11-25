# ADR-006：模块公共 API 契约 — 域级 index.ts 与跨域 import 规则

## 状态
PROPOSED

## 背景
spec.md FR-009 要求 SDDU 工作流核心业务域「定义明确的对外能力边界——声明它对平台适配层暴露的能力集合和调用契约」。FR-010 进一步要求核心定义「完整的多平台适配接口契约」。ADR-001 定义了业务对象架构的目录层级和依赖方向，但未约束具体文件的 import 方式——各域之间可以自由 import 任意文件的现状会导致：

1. **公共 API 边界模糊**：`adapters/opencode/plugin.ts` 可以直接 `import { createMachine } from '../../state/machine'`（越过 state 的公共 API），当 `machine.ts` 重构内部实现时，适配层可能被意外破坏
2. **封装泄露**：业务域内部实现细节（如 `state/migrator.ts`）被外部直接引用，后续重构内部文件时需搜索所有跨域引用点
3. **新人导航困难**：没有统一的公共 API 入口，新人需逐个文件阅读才能理解业务域对外暴露了哪些能力

参考 LangChain 等成熟框架的实践：每个模块通过 `index.ts` 明确定义公共 API 表面（public API surface），模块内部文件可以随意重构，只要 `index.ts` 的导出签保不变就不影响外部消费者。

## 决策
我们决定为每个业务域定义明确的 **`index.ts` 公共 API 契约**，并通过 import 规则强制执行域间隔离：

### 1. 各域 index.ts 公共 API 职责

| 域 | index.ts 路径 | 导出内容 |
|----|-------------|---------|
| `pipeline/` | `src/pipeline/index.ts` | `workflow-engine.ts`、`coaching-mode.ts`、`state-validator.ts` 的公共类型/函数 + `types.ts` |
| `state/` | `src/state/index.ts` | `machine.ts`（状态机核心）、`schema-v3.0.0.ts`（当前 schema）、`state-loader.ts` 等公共接口 |
| `discovery/` | `src/discovery/index.ts` | `workflow-engine.ts`、`coaching-mode.ts`、`state-validator.ts` 的公共接口 + `types.ts` |
| `agents/` | `src/agents/index.ts` | `registry.ts`、`sddu-agents.ts` 的公共接口（方法论层面 Agent 定义） |
| `templates/` | `src/templates/index.ts` | `subfeature-templates.ts` 的公共接口（模板引擎） |
| `adapters/opencode/` | `src/adapters/opencode/index.ts` | `plugin.ts`——适配层对外的唯一公共入口 |
| `shared/` | `src/shared/index.ts` | `types.ts`、`errors.ts`、`platform-adapter.ts`——跨域类型契约的聚合入口（供顶层 `src/index.ts` 薄桶引用） |

### 2. Import 规则矩阵

| 从 → 到 | pipeline | state | discovery | agents | templates | adapters/<br>opencode | shared |
|----------|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| **pipeline** | 域内自由 | ✅ 通过 index.ts | ✅ 通过 index.ts | ✅ 通过 index.ts | ✅ 通过 index.ts | ❌ 禁止 | ✅ 直接 import |
| **state** | ✅ 通过 index.ts | 域内自由 | ✅ 通过 index.ts | ✅ 通过 index.ts | ✅ 通过 index.ts | ❌ 禁止 | ✅ 直接 import |
| **discovery** | ✅ 通过 index.ts | ✅ 通过 index.ts | 域内自由 | ✅ 通过 index.ts | ✅ 通过 index.ts | ❌ 禁止 | ✅ 直接 import |
| **agents** | ✅ 通过 index.ts | ✅ 通过 index.ts | ✅ 通过 index.ts | 域内自由 | ✅ 通过 index.ts | ❌ 禁止 | ✅ 直接 import |
| **templates** | ✅ 通过 index.ts | ✅ 通过 index.ts | ✅ 通过 index.ts | ✅ 通过 index.ts | 域内自由 | ❌ 禁止 | ✅ 直接 import |
| **adapters/opencode** | ✅ 通过 index.ts | ✅ 通过 index.ts | ✅ 通过 index.ts | ✅ 通过 index.ts | ✅ 通过 index.ts | 域内自由 | ✅ 直接 import |
| **shared** | ❌ 禁止 | ❌ 禁止 | ❌ 禁止 | ❌ 禁止 | ❌ 禁止 | ❌ 禁止 | —（零依赖） |

### 3. 规则细则

#### R-API-01：域内自由 import
同一业务域内部的文件可以互相 import，不强制通过本域 `index.ts`。

```typescript
// ✅ 合法：src/state/machine.ts 引用同域文件
import { StateSchema } from './schema-v3.0.0';
import { migrateState } from './migrator';
```

#### R-API-02：域间仅通过 index.ts
业务域之间互相 import 时，**只能** import 对方的 `index.ts`，不得直接 import 对方内部文件。

```typescript
// ✅ 合法：通过 index.ts
// src/adapters/opencode/plugin.ts
import { createMachine, StateMachine } from '../../state';  // → state/index.ts

// ❌ 非法：越过 index.ts 直接引用内部文件
import { createMachine } from '../../state/machine';  // 封装泄露
```

#### R-API-03：shared/ 可直接 import
`shared/` 目录下的每个文件本身就是独立的公共契约单元（`types.ts` 定义共享类型、`errors.ts` 定义错误体系、`platform-adapter.ts` 定义平台适配接口）。不强制通过 `shared/index.ts`，因为 shared 只有 3 个文件且每个文件代表不同的契约维度。

```typescript
// ✅ 合法：直接引用 shared 文件
// src/pipeline/workflow-engine.ts
import { SDDUError, ErrorCode } from '../shared/errors';
import { PlatformContext } from '../shared/platform-adapter';
import { FeatureState } from '../shared/types';
```

但 `shared/index.ts` 仍需存在，作为 `src/index.ts` 顶层薄桶的统一引用入口。

#### R-API-04：adapters/ 单向依赖
`adapters/opencode/` 可以 import 所有业务域，业务域不得反向 import `adapters/`。这条规则已在 ADR-001 中定义，本 ADR 进一步将其细化到具体文件路径约束。

```typescript
// ❌ 非法：业务域反向引用 adapters
// src/state/machine.ts
import { someUtil } from '../adapters/opencode/plugin';

// ❌ 非法：业务域 import 平台 SDK
// src/state/machine.ts
import { tool } from '@opencode-ai/plugin';
```

### 4. CI 强制执行

可通过 ESLint `import/no-restricted-paths` 在 CI 中自动检查：

```javascript
// .eslintrc.js
{
  rules: {
    'import/no-restricted-paths': ['error', {
      zones: [
        {
          target: './src/(pipeline|state|discovery|agents|templates)/',
          from: './src/adapters/',
          message: '业务域禁止 import adapters/ —— 违反 ADR-006 单向依赖规则',
        },
        {
          target: './src/(pipeline|state|discovery|agents|templates|adapters)/',
          from: './node_modules/@opencode-ai/plugin/',
          message: '业务域禁止直接依赖 @opencode-ai/plugin —— 违反 FR-001',
          // adapters/ 不在此限制中
          except: ['./src/adapters/'],
        },
      ],
    }],
  },
}
```

同时配合 `madge` 或 `dpdm` 做循环依赖检测，确保 `shared/` 零依赖成立。

## 后果

### 正面影响
1. **公共 API 明确可寻**：每个域的能力集合在 `index.ts` 一望而知——新人首次接触 `src/state/` 只需阅读 `index.ts` 即可理解状态管理模块对外提供的能力，无需遍历 14 个内部文件
2. **封装安全**：域内部实现文件的重构（如 `migrator.ts` 合并到 `machine.ts`）只需更新本域 `index.ts` 的 re-export，不会破坏跨域消费者
3. **依赖方向可自动化验证**：域间只通过 `index.ts` 交互的规则可通过 ESLint 或自定义脚本自动化检查——任何 `import ... from '../../state/machine'`（越过 index.ts 直接引用内部文件）均在 CI 中报错
4. **平台可移植性增强**：`adapters/opencode/index.ts` 作为适配层的唯一公共入口——未来适配新平台只需新增 `adapters/<新平台>/index.ts`，实现了相同的 `PlatformAdapter` 接口，对消费者而言多平台切换是配置而非代码变更
5. **LangChain 对齐**：与 LangChain 等成熟框架的实践一致——每个模块有明确的 public API surface，模块内聚且边界清晰

### 负面影响
1. **index.ts 维护成本**：每个域多一个 `index.ts` 文件（共 7 个），需在新增大类/函数时同步更新公共 API 导出。边际成本低——每个域每年新增的公共接口不超过 3~5 个
2. **交叉依赖需中间层**：当 `pipeline` 需要同时引用 `state` 和 `discovery` 的公共能力时，需分别 import 两个 `index.ts`——这本身就是正确的依赖表达，不应视为额外复杂度
3. **初始迁移工作**：各域的 `index.ts` 需在源文件重组完成后逐个编写——与 §5.3 的旧址清理同步执行，不增加额外步骤

### 与其他 ADR 的关系
- **ADR-001**（业务对象架构）：本 ADR 是 ADR-001 的细化——在目录层级的基础上，进一步约束了文件级的 import 规则
- **ADR-003**（构建配置）：tsconfig `paths` 别名配合 `index.ts` 公共 API，使外部引用更简洁（`import { createMachine } from '@state'` 而非 `import { createMachine } from '../../state'`）
- **ADR-004**（测试组织）：测试文件也应遵守 import 规则——跨域测试应通过被测试域的 `index.ts` 引入其公共 API
