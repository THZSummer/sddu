# ADR-003：构建配置与模块解析策略

## 状态
PROPOSED

## 背景
spec.md 开放问题 #1：当前 `tsconfig.json` 将 `src/` 编译为扁平的 `dist/` 目录结构。重组为三层架构后，构建产物需保留业务分层语义（FR-007），使下游消费者能从构建产物中识别核心 API 和平台 API 的边界。

同时，开发体验需要模块导入别名来减少深层相对路径（如 `../../../core/state/machine`），构建产物需要与下游消费者的模块解析方式兼容。

当前配置：
```json
// tsconfig.json (关键字段)
{ "rootDir": "./src", "outDir": "./dist" }

// package.json (关键字段)
{ "type": "module", "main": "dist/index.js" }
```

`dist/` 是扁平结构——所有 `.js` 和 `.d.ts` 文件位于 `dist/` 根层级，丢失了 `src/` 的目录语义。

## 决策
我们决定采用 **「tsconfig paths（开发期） + 目录保持构建（dist 分层） + subpath exports（消费期）」** 三层策略：

### 1. tsconfig paths（开发期别名）

在 `tsconfig.json` 中配置路径别名，使开发期可使用语义化导入：

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@pipeline/*":   ["./src/pipeline/*"],
      "@pipeline":     ["./src/pipeline/index.ts"],
      "@state/*":      ["./src/state/*"],
      "@state":        ["./src/state/index.ts"],
      "@discovery/*":  ["./src/discovery/*"],
      "@discovery":    ["./src/discovery/index.ts"],
      "@agents/*":     ["./src/agents/*"],
      "@agents":       ["./src/agents/index.ts"],
      "@templates/*":  ["./src/templates/*"],
      "@templates":    ["./src/templates/index.ts"],
      "@opencode/*":   ["./src/adapters/opencode/*"],
      "@opencode":     ["./src/adapters/opencode/plugin.ts"],
      "@shared/*":     ["./src/shared/*"],
      "@shared":       ["./src/shared/index.ts"]
    }
  }
}
```

**请注意**：paths 别名仅供**开发期** TypeScript 类型解析和 IDE 智能提示使用。TypeScript 编译器 (`tsc`) **不会重写** paths 别名为相对路径——生成的 `dist/` 中 import 语句保持原样。这意味着如果源码使用 `@core/state/machine`，编译后的 `.js` 文件仍包含 `@core/state/machine`，需要运行时解析。

### 2. 目录保持构建（dist 分层）

为了在运行时正确解析别名，同时保留 dist/ 的分层语义，我们采取以下方案：

**方案：源码内使用相对路径 import，dist/ 自然保持目录结构。**

- 重组的业务对象目录（`src/pipeline/`、`src/state/`、`src/discovery/`、`src/agents/`、`src/templates/`）、`src/adapters/opencode/`、`src/shared/` 经过 `tsc` 编译后，在 `dist/` 中自然保持相同的目录层次
- 所有源码文件之间的 import 使用**相对路径**（如 `../../shared/types.js`），不依赖 paths 别名
- `tsconfig.json` 中的 `paths` 仅作为**可选**的开发便利，不做硬性要求

**优势**：
- 不依赖任何运行时模块解析器（如 `tsconfig-paths`、`ts-node`）即可在 Node.js ESM 环境运行
- `dist/` 的目录结构天然保留分层语义，满足 FR-007
- 构建复杂度低——标准 `tsc` 即可完成

**tsconfig.json 调整**：
```json
{
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
    // paths 为可选的开发便利
    "paths": { /* ... */ }
  }
}
```

`rootDir: "./src"` 保持不变——TypeScript 以 `src/` 为根编译，`dist/` 中保留 `src/` 下的目录层次。`.hbs` 模板文件不在 `include` 匹配范围内（只匹配 `*.ts`），不影响编译。

### 3. subpath exports（消费期）

在 `package.json` 中添加 `exports` 字段，为下游消费者提供语义化子路径导入：

```json
{
  "name": "opencode-sddu-plugin",
  "version": "4.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./pipeline": {
      "types": "./dist/pipeline/index.d.ts",
      "import": "./dist/pipeline/index.js"
    },
    "./pipeline/*": {
      "types": "./dist/pipeline/*.d.ts",
      "import": "./dist/pipeline/*.js"
    },
    "./state": {
      "types": "./dist/state/index.d.ts",
      "import": "./dist/state/index.js"
    },
    "./state/*": {
      "types": "./dist/state/*.d.ts",
      "import": "./dist/state/*.js"
    },
    "./opencode": {
      "types": "./dist/adapters/opencode/plugin.d.ts",
      "import": "./dist/adapters/opencode/plugin.js"
    },
    "./shared": {
      "types": "./dist/shared/index.d.ts",
      "import": "./dist/shared/index.js"
    },
    "./shared/*": {
      "types": "./dist/shared/*.d.ts",
      "import": "./dist/shared/*.js"
    }
  }
}
```

**下游消费者使用**：
```typescript
// 主入口（插件注册函数，与 v3.x 兼容）
import { SDDUPlugin } from 'opencode-sddu-plugin';

// 按业务域导入（v4.0.0 新增）
import { StateMachine } from 'opencode-sddu-plugin/state';
import { WorkflowEngine } from 'opencode-sddu-plugin/pipeline/workflow-engine';
```

### 方案对比（为何不选其他方案）

| 方案 | 评估 |
|------|------|
| **纯 paths 别名 + 扁平 dist/** | dist/ 丢失分层语义 → 不满足 FR-007 |
| **纯 paths 别名 + 保留目录结构** | 需要运行时 `tsconfig-paths` 或 `--experimental-specifier-resolution` 才能解析别名 → 增加下游配置复杂度 |
| **多 tsconfig 项目引用** | 需要 `composite: true` + 多 `tsconfig.json`，对于单包插件过度复杂 |
| **相对路径 + 保留目录结构（本方案）** | ✅ dist/ 保留分层 + 零额外运行时依赖 + 构建简单 |

## 后果

### 正面影响
1. **dist/ 自然分层**：各业务域目录（`dist/pipeline/`、`dist/state/`...）、`dist/adapters/opencode/`、`dist/shared/` 保留源码层级，满足 FR-007
2. **零运行时依赖**：相对路径 import 在 Node.js ESM 环境原生支持，无需额外工具
3. **subpath exports** 提供语义化消费体验，框架使用者可通过 `import { ... } from 'opencode-sddu-plugin/core'` 显式表达依赖意图
4. **向后兼容**：`"main": "./dist/index.js"` 保持不动，现有使用 `import ... from 'opencode-sddu-plugin'` 的下游代码无需修改

### 负面影响
1. **深层相对路径**：`src/adapters/opencode/agents/sddu-agents.ts` 引用 `src/state/machine.ts` 需写 `../../state/machine.js`——路径表达了模块间的物理位置关系
2. **IDE 体验**：如不使用 paths 别名，IDE 自动 import 会生成相对路径而非别名。可通过配置 `tsconfig.json` paths 别名改善（仅 TS 类型检查使用，不影响编译产物）
3. **subpath exports** 增加了 `package.json` 的维护成本——新增模块时需同步更新 `exports` 声明

### 与其他 ADR 的关系
- **ADR-001**（三层架构）：定义了 src/ 目录结构，本 ADR 决定构建产物如何映射
- **ADR-004**（测试组织）：jest 配置需与 tsconfig paths 和 moduleNameMapper 协调
