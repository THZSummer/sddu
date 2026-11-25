# ADR-004：测试组织与分层执行模式

## 状态
PROPOSED

## 背景
spec.md FR-005 要求测试按业务域组织，支持三种独立执行粒度：
- **仅核心业务**：只跑 SDDU 方法论工作流核心的测试
- **仅平台适配**：只跑 openCode 平台适配的测试
- **全量**：跑全部测试

当前测试组织存在三类问题（discovery.md Q-003）：
1. **组织不一致**：`errors.test.ts` / `types.test.ts` 与源文件平级混放 `src/`；`state/` / `discovery/` 使用 `__tests__/` 子目录；`agents/registry.test.ts` 与源文件同目录。三种模式并存。
2. **无法按层独立执行**：所有测试混在同一个 jest 配置中，无法选择性运行"仅核心"或"仅平台"测试。
3. **根 `tests/` 目录分离**：项目根目录有独立的 `tests/` 层级（`e2e/`、`integration/`、`unit/`、`state/`、`fixtures/` 等），与 `src/` 中的 `*.test.ts` 文件使用不同的组织方式——测试认知分布在两个不相关的文件树中，增加维护心智负担。

当前 jest 配置：
```typescript
// jest.config.ts
export default {
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'],
  // 单一配置，无分项目支持
};
```

## 决策
我们决定采用 **「src/__tests__/ 完全集中式（unit + integration）+ e2e/ 独立顶层」** 方案。

**核心规则**：所有测试文件（`*.test.ts`）**必须**位于 `src/__tests__/` 目录树中——禁止在业务源文件旁放置 co-located 测试文件，禁止在各业务域目录下创建 `__tests__/` 子目录。`e2e/` 作为唯一例外，独立为项目顶层目录（自带 `jest.config.ts`，不 import 源码，不收集覆盖率）。

测试组织规则：
1. 单元测试（`*.test.ts`，单模块验证）统一收敛到 `src/__tests__/unit/`，按业务域分子目录
2. 集成/兼容性/回归测试统一收敛到 `src/__tests__/integration/`
3. 各业务域源目录（`src/pipeline/`、`src/state/`、`src/discovery/` 等）**不包含任何测试文件**——源目录只保留业务逻辑
4. E2E 测试独立为顶层 `e2e/`（物理隔离，独立配置）

### 1. 测试文件组织：src/__tests__/ 集中式（unit + integration）+ e2e/ 独立顶层

单元测试和集成/兼容性/回归测试统一放在 `src/__tests__/` 下：

```
src/__tests__/
├── unit/                                 ← 单元测试（按业务域分子目录，与 src/ 下模块一一对应）
│   ├── pipeline/
│   │   ├── workflow-engine.test.ts
│   │   ├── coaching-mode.test.ts
│   │   └── ...
│   ├── state/
│   │   ├── machine.test.ts
│   │   ├── schema-v3.0.0.test.ts
│   │   └── ...
│   ├── discovery/
│   │   ├── workflow-engine.test.ts
│   │   └── ...
│   ├── agents/
│   │   ├── registry.test.ts
│   │   └── sddu-agents.test.ts
│   ├── templates/
│   │   └── subfeature-templates.test.ts
│   ├── adapters/
│   │   └── opencode/
│   │       ├── agents/
│   │       │   ├── registry.test.ts
│   │       │   └── sddu-agents.test.ts
│   │       └── commands/
│   │           └── sddu-migrate-schema.test.ts
│   └── shared/
│       ├── types.test.ts
│       ├── errors.test.ts
│       └── platform-adapter.test.ts
│
├── integration/                          ← 集成/兼容性/回归测试（从根 tests/ 迁入）
│   ├── compatibility/
│   │   ├── legacy.test.ts
│   │   ├── mock-migration-tool.js
│   │   └── validation-reporter.js
│   ├── regression/
│   │   └── existing-features.test.ts
│   ├── state/
│   │   ├── agent-integration.test.ts
│   │   ├── auto-updater.test.ts
│   │   ├── auto-updater-integration.test.ts
│   │   ├── dependency-checker.test.ts
│   │   ├── migrator-v2.test.ts
│   │   ├── session-idle-integration.test.ts
│   │   └── simple-agent-integration.test.ts
│   └── tree-workflow.test.ts
│
├── fixtures/                             ← 测试固件（从根 tests/fixtures/ 迁入）
│   ├── legacy-v1.1.1/
│   │   └── state.json
│   └── multi-feature/
│       ├── feature-a/  (spec.md + state.json)
│       ├── feature-b/  (spec.md + state.json)
│       └── feature-c/  (spec.md + state.json)
│
├── reports/                              ← 测试报告模板（生成物，从根 tests/reports/ 迁入）
│   └── test-report-template.md
│
└── README.md                             ← 测试组织说明
```

E2E 测试独立为顶层 `e2e/` 目录——自带 `jest.config.ts`，通过进程间接口驱动被测系统（不 import src/），不收集覆盖率：

```
e2e/                                      ← 端到端测试（独立 Jest 配置，不 import src/）
├── jest.config.ts                        ← E2E 独立配置（testEnvironment: node, 不收集覆盖率）
└── *.test.ts                             ← 端到端测试文件（从原 tests/e2e/ 迁入）
```

**E2E 独立于 `src/__tests__/` 的理由**：
- **物理隔离**：E2E 测试不 import 源码模块（通过 HTTP/CLI/进程 fork 等外部接口驱动），与单元/集成测试的 import 模式根本不同——放入 `src/__tests__/` 会导致 Jest 解析依赖时引入不必要的耦合
- **独立配置**：E2E 不需要 ts-jest 的 TypeScript 转译（不 import TS 源文件），不需要覆盖率阈值，可能需要更长的超时和不同的 testEnvironment 设置
- **独立执行**：E2E 通常由 CI 在构建/部署之后独立触发，与单元/集成测试的执行节奏完全不同——独立目录 + 独立脚本使 CI 编排更清晰
- **包体积控制**：`src/__tests__/` 下的 fixtures 和 E2E 脚本体量较大，独立到 `e2e/` 后 `src/` 在 `npm pack` 时保持简洁（E2E 不属于 npm 包分发的必要部分）

### 2. jest 配置：根配置管理 src/__tests__/ + e2e/ 独立配置

#### 2.1 根 `jest.config.ts`（只管理 `src/__tests__/`）

使用 jest 的 `projects` 特性配置三个独立的测试项目（unit 按 core/opencode/integration 分型），**不包含 `e2e/`**：

```typescript
// jest.config.ts（根目录 — 只管 src/__tests__/ 下的 unit + integration）
export default {
  projects: [
    // Project 1: 仅核心业务（单元测试）
    {
      displayName: 'core',
      testMatch: ['<rootDir>/src/__tests__/unit/(pipeline|state|discovery|agents|templates|shared)/**/*.test.ts'],
      // shared/ 的测试随核心业务一起运行——因为 shared 是零依赖基础
    },
    // Project 2: 仅平台适配（单元测试）
    {
      displayName: 'opencode',
      testMatch: ['<rootDir>/src/__tests__/unit/adapters/**/*.test.ts'],
    },
    // Project 3: 集成测试（src/__tests__/integration/ 全部内容）
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/src/__tests__/integration/**/*.test.ts'],
    },
  ],
  // 全局配置继承
  preset: 'ts-jest',
  testEnvironment: 'node',
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

#### 2.2 `e2e/jest.config.ts`（独立配置，不收集覆盖率）

```typescript
// e2e/jest.config.ts（独立 — 不 import src/，通过进程间接口驱动）
export default {
  testMatch: ['<rootDir>/e2e/**/*.test.ts'],
  testEnvironment: 'node',
  // 不需要 ts-jest（E2E 测试不 import TS 源文件，或通过编译后的 dist/ 间接使用）
  // 不需要覆盖率阈值（E2E 衡量场景通过率，不衡量代码覆盖）
  coverageReporters: [],           // 不收集覆盖率
  testTimeout: 30000,              // E2E 可能需要更长超时
};
```

### 3. package.json scripts

在 `package.json` 中映射各执行粒度：

```json
{
  "scripts": {
    "test": "jest",
    "test:core": "jest --selectProjects core",
    "test:opencode": "jest --selectProjects opencode",
    "test:integration": "jest --selectProjects integration",
    "test:all": "jest --selectProjects core --selectProjects opencode --selectProjects integration",
    "test:e2e": "jest --config e2e/jest.config.ts"
  }
}
```

| 命令 | 覆盖范围 | Jest 配置 | 对应 FR-005 |
|------|---------|-----------|------------|
| `test:core` | `src/__tests__/unit/(pipeline\|state\|discovery\|agents\|templates\|shared)/` 的测试 | 根 `jest.config.ts` | "仅核心业务" |
| `test:opencode` | `src/__tests__/unit/adapters/` 的测试 | 根 `jest.config.ts` | "仅平台适配" |
| `test:integration` | `src/__tests__/integration/` 的集成测试 | 根 `jest.config.ts` | 集成层 |
| `test:all` | 上述全部 | 根 `jest.config.ts` | "全量"（不含 E2E） |
| `test:e2e` | `e2e/*.test.ts` 端到端测试 | `e2e/jest.config.ts` | 端到端验证（独立执行） |

### 为何 shared/ 测试并入 core 项目

`src/shared/` 是零依赖层，被所有业务对象和 `adapters/opencode/` 共同引用。其测试（types.test.ts、errors.test.ts、platform-adapter.test.ts）属于「平台无关的基础设施验证」，与核心业务逻辑的测试语义相同——都是「不依赖平台即可运行」。在 `test:core` 中一次性运行 shared 测试，避免创建额外的第四个测试项目。

### 为何不选其他方案

| 方案 | 评估 |
|------|------|
| **保持混合模式（colocated + __tests__ + tests/）** | 三种模式并存增加认知负担，三套文件树；不解决 Q-003——已明确拒绝 |
| **co-located 模式（同目录 `*.test.ts`）** | 🚫 已被本 ADR 明确拒绝。测试与源码混合在同一目录，各业务域源码目录不纯净——维护者在目录中需要区分"业务文件"与"测试文件"；且无法与 jest `testMatch` 配置自然配合以实现分层独立执行。迁移完成后，任何业务域源码旁不得再出现 `*.test.ts` |
| **测试全部迁移到根 `tests/`** | 🚫 已被本 ADR 明确拒绝。测试与源文件跨目录（`tests/` 在根，`src/` 在子目录），按业务域定位不够直观；且根目录仍保留独立功能子目录，降低根目录简洁度 |
| **E2E 纳入 `src/__tests__/integration/`** | 🚫 已被本 ADR 明确拒绝。E2E 不 import 源码（通过外部接口驱动），放入 `src/__tests__/` 后会引入不必要的 TypeScript 依赖耦合；E2E 不需要覆盖率，不需要 ts-jest，与单元/集成的 Jest 配置完全不同 |
| **`src/__tests__/` 完全集中式（unit+integration）+ `e2e/` 独立顶层（本方案）** | ✅ 唯一采纳方案：源码目录纯净 + 按业务域可发现 + 清晰的执行粒度 + E2E 物理隔离（独立配置、独立执行、独立生命周期）+ 测试数据（fixtures/reports）与代码就近。**所有测试文件唯一合法位置为 `src/__tests__/` 或 `e2e/`** |

## 后果

### 正面影响
1. **测试文件唯一出口**：`src/__tests__/`（单元 + 集成 + fixtures）和 `e2e/`（端到端）是两个唯一的测试代码位置——维护者永远不需要去 `src/pipeline/`、`src/state/` 等业务源目录寻找或放置测试文件
2. **E2E 物理隔离**：`e2e/` 独立顶层目录，自带 `jest.config.ts`——不 import 源码、不收集覆盖率、独立超时和 testEnvironment 配置。CI 可在构建/部署后独立触发 E2E，与单元/集成测试解耦
3. **源码目录纯净**：各业务域目录（pipeline/、state/、discovery/ 等）只包含业务逻辑文件，无测试文件混入，便于代码审查和导航 —— **严格禁止 `*.test.ts` 出现在源码目录中**
4. **根目录简洁化**：移除 `tests/` 功能子目录后，E2E 回归为独立 `e2e/`（1 个目录替换 1 个目录量），根目录保持清晰（见 ADR-005）
5. **分层独立执行**：`test:core`、`test:opencode`、`test:integration`、`test:e2e` 互不依赖——修改核心逻辑时只跑 core 测试，修改平台适配时只跑 opencode 测试，部署后跑 E2E
6. **CI 粒度可控**：可在 CI 中根据变更范围选择性运行对应层级的测试，加速反馈
7. **FR-005 完全满足**：三种执行粒度映射为三个 jest projects + 独立 E2E，对应明确的 npm scripts

### 负面影响
1. **迁移成本增加**：所有散落在各业务域的测试文件 + 根 `tests/` 下文件需整体迁移到 `src/__tests__/` 和 `e2e/` 对应位置，并更新 import 和相对路径引用（约 60 个文件）
2. **import 路径变长**：测试文件中的源文件导入路径多一层到两层 `../`，但配合 tsconfig `paths` 别名可完全消除此问题
3. **fixtures 路径引用需更新**：任何硬编码了 `tests/fixtures/` 路径的代码需更新为 `src/__tests__/fixtures/`
4. **E2E 额外配置维护**：`e2e/jest.config.ts` 作为独立配置文件需独立维护，但这与 E2E 的独立生命周期相匹配——边际成本低

### 与其他 ADR 的关系
- **ADR-001**（业务对象架构）：测试目录跟随业务对象目录结构（`src/__tests__/unit/<域>/`）
- **ADR-003**（构建配置）：jest 的 `moduleNameMapper` 需与 tsconfig paths 对齐
- **ADR-005**（根目录架构）：`tests/` 从根目录移除后，根目录功能子目录从 5 个降为 4 个（src/、scripts/、docs/、examples/）
