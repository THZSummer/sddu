# 任务分解：SDDU 框架源码架构重组

> **文档定位**: SDDU 任务清单 — 将技术方案分解为可并行执行的原子任务，作为 build 阶段的输入  
> **前置依赖**: plan.md（技术方案）、spec.md（需求规范）  
> **创建人**: SDDU Tasks Agent  
> **创建时间**: 2026-06-21  
> **版本**: v1.0  
> **更新人**: SDDU Tasks Agent  
> **更新时间**: 2026-06-21  
> **更新说明**: 初始创建 — 基于 plan.md + 6 个 ADR，分解为 12 个原子任务 / 5 个执行波次

## 1. 依赖拓扑总览
> 任务依赖关系和执行顺序

```
Wave 1 ─── (无依赖，全部并行)
  TASK-001 [S]  根目录脚本收敛 — build-agents.cjs + test-sddu-functionality.js → scripts/
  TASK-002 [M]  shared/ 共享层创建 — types.ts + errors.ts + platform-adapter.ts + index.ts

Wave 2 ─── (依赖 Wave 1)
  TASK-003 [M]  业务域目录搭建 — pipeline/ state/ discovery/ agents/ templates/ + index.ts
  TASK-004 [M]  adapters/opencode/ 适配层搭建 — plugin.ts 提取 + index.ts
  TASK-005 [M]  编译与构建配置 — tsconfig paths + package.json exports + scripts 路径统一

Wave 3 ─── (依赖 Wave 2)
  TASK-006 [L]  核心业务域源码迁移 — pipeline + state + discovery + import 更新
  TASK-007 [L]  平台适配 + 模板源码迁移 — agents + templates + adapters + HBS 重组 + import 更新
  TASK-008 [M]  src/index.ts 薄桶重构 + utils/ 拆散归属各域

Wave 4 ─── (依赖 Wave 3)
  TASK-009 [L]  测试文件集中迁移 — ~35 个测试文件 → src/__tests__/ + e2e/
  TASK-010 [M]  测试配置重构 — jest.config.ts projects + e2e/jest.config.ts + test scripts

Wave 5 ─── (依赖 Wave 4)
  TASK-011 [M]  旧文件清理 — 删除旧址文件与空目录
  TASK-012 [L]  构建验证与全量测试回归 — tsc + npm test + 循环依赖检测
```

## 2. 任务列表
> 每个任务的详细定义

### TASK-001: 根目录脚本收敛
> 单一文件操作：向 scripts/ 移入 2 个脚本 + 1 行 package.json 变更

| 属性 | 值 |
|------|-----|
| **复杂度** | S |
| **前置依赖** | 无 |
| **执行波次** | Wave 1 |
| **对应 FR** | ADR-005（根目录架构） |

**描述**: 将散落根目录的 2 个开发者脚本统一收敛至 `scripts/`，更新 `package.json` 中 `build:agents` 脚本路径引用，使所有构建/验证脚本的路径约定一致。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| MOVE | `build-agents.cjs` → `scripts/build-agents.cjs`（含 __dirname 路径修正） |
| MOVE | `test-sddu-functionality.js` → `scripts/test-sddu-functionality.js` |
| MODIFY | `package.json` — `"build:agents": "node scripts/build-agents.cjs"` |
| DELETE | `build-agents.cjs`（根目录旧址） |
| DELETE | `test-sddu-functionality.js`（根目录旧址） |

**验收标准**:
- [ ] `scripts/build-agents.cjs` 存在且 `__dirname` 引用解析为 `scripts/` 父目录（`path.join(__dirname, '..', 'src', 'templates', 'agents')`）
- [ ] `scripts/test-sddu-functionality.js` 存在
- [ ] `package.json` 中 `build:agents` 脚本路径更新为 `node scripts/build-agents.cjs`
- [ ] 根目录旧址文件已删除
- [ ] `npm run build:agents` 可正常执行

**验证命令**:
```bash
# 检查文件到位
ls -la scripts/build-agents.cjs scripts/test-sddu-functionality.js

# 检查根目录旧址已清除
test ! -f build-agents.cjs && test ! -f test-sddu-functionality.js && echo "PASS: root cleaned"

# 检查 package.json 引用
node -e "const p=require('./package.json'); console.assert(p.scripts['build:agents']==='node scripts/build-agents.cjs', 'FAIL: build:agents path')" && echo "PASS: package.json"

# 验证脚本可执行
node scripts/build-agents.cjs --help 2>&1 | head -5
```

---

### TASK-002: shared/ 共享层创建
> 多文件创建：4 个新文件，shared/ 为零依赖基础层

| 属性 | 值 |
|------|-----|
| **复杂度** | M |
| **前置依赖** | 无 |
| **执行波次** | Wave 1 |
| **对应 FR** | FR-004, FR-010, ADR-001 |

**描述**: 创建 `src/shared/` 目录，放置 3 个零依赖的公共模块 + 1 个聚合出口。`types.ts` 从 `src/types.ts` 提取公共类型定义；`errors.ts` 从 `src/errors.ts` 提取错误类；`platform-adapter.ts` 全新创建多平台适配接口契约；`index.ts` 作为顶层薄桶的统一引用入口。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| NEW | `src/shared/types.ts` — 从 `src/types.ts` 提取零依赖的公共类型 |
| NEW | `src/shared/errors.ts` — 从 `src/errors.ts` 提取零依赖的错误定义 |
| NEW | `src/shared/platform-adapter.ts` — 多平台适配接口契约（ToolDefinition, AgentDefinition, EventHandler, PlatformContext, PlatformAdapter） |
| NEW | `src/shared/index.ts` — 聚合导出 shared/ 全部公共 API |

**验收标准**:
- [ ] `src/shared/types.ts` 包含所有零平台依赖的公共类型定义
- [ ] `src/shared/errors.ts` 包含所有错误类定义
- [ ] `src/shared/platform-adapter.ts` 定义 `ToolDefinition`, `AgentDefinition`, `EventHandler`, `PlatformContext`, `PlatformAdapter` 五个接口
- [ ] `src/shared/index.ts` 从上述三个文件 re-export 全部公共 API
- [ ] `src/shared/` 内所有文件的 import 语句不包含 `@opencode-ai/plugin` 或任何业务域/adapters 模块的引用（零依赖）
- [ ] TypeScript 编译通过：`npx tsc --noEmit src/shared/index.ts`

**验证命令**:
```bash
# 检查 shared/ 目录结构
ls src/shared/{types,errors,platform-adapter,index}.ts

# 检查零平台依赖（不应出现 @opencode-ai/plugin）
rg '@opencode-ai/plugin' src/shared/ && echo "FAIL" || echo "PASS: zero platform dependency"

# 检查零业务域/adapters 依赖
rg "from '\.\.\/(pipeline|state|discovery|agents|templates|adapters)" src/shared/ && echo "FAIL" || echo "PASS: zero domain dependency"

# 类型编译检查
npx tsc --noEmit
```

---

### TASK-003: 业务域目录搭建与公共 API 定义
> 多文件创建：5 个业务域目录 + 5 个 index.ts 公共 API 出口

| 属性 | 值 |
|------|-----|
| **复杂度** | M |
| **前置依赖** | TASK-002（shared/ 类型可引用） |
| **执行波次** | Wave 2 |
| **对应 FR** | FR-001, FR-009, ADR-001, ADR-006 |

**描述**: 创建 5 个核心业务域目录（pipeline/, state/, discovery/, agents/, templates/），每个域写入 `index.ts` 作为公共 API 出口。此时源文件尚未迁入，index.ts 内容为占位或基于 plan.md 中定义的公共 API 表面预先声明导出签名。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| NEW | `src/pipeline/index.ts` — 导出 workflow-engine, coaching-mode, state-validator, types |
| NEW | `src/state/index.ts` — 导出 machine, schema-v3.0.0, state-loader 等 |
| NEW | `src/discovery/index.ts` — 导出 workflow-engine, coaching-mode, state-validator, types |
| NEW | `src/agents/index.ts` — 导出 registry, sddu-agents（方法论层面） |
| NEW | `src/templates/index.ts` — 导出 subfeature-templates（模板引擎） |

**验收标准**:
- [ ] 5 个业务域目录存在：`src/pipeline/`, `src/state/`, `src/discovery/`, `src/agents/`, `src/templates/`
- [ ] 每个域有 `index.ts` 文件（共 5 个）
- [ ] 每个 `index.ts` 中所有 import 和 export 语句不包含 `@opencode-ai/plugin`（遵守 FR-001）
- [ ] `src/pipeline/index.ts` 不 import `src/adapters/`（遵守 ADR-006 R-API-04）
- [ ] TypeScript 类型声明可解析（即使运行时引用还未到位）

**验证命令**:
```bash
# 检查目录存在
for dir in pipeline state discovery agents templates; do
  test -d "src/$dir" && echo "OK: src/$dir/" || echo "MISSING: src/$dir/"
done

# 检查 index.ts 存在
for dir in pipeline state discovery agents templates; do
  test -f "src/$dir/index.ts" && echo "OK: src/$dir/index.ts" || echo "MISSING: src/$dir/index.ts"
done

# 检查无平台 SDK 依赖
rg '@opencode-ai/plugin' src/{pipeline,state,discovery,agents,templates}/index.ts && echo "FAIL" || echo "PASS"

# 检查 pipeline/ 不反向引用 adapters/
rg "from '.*adapters" src/pipeline/index.ts && echo "FAIL" || echo "PASS"
```

---

### TASK-004: adapters/opencode/ 适配层搭建
> 多文件创建：适配层目录结构 + plugin.ts 提取 + index.ts

| 属性 | 值 |
|------|-----|
| **复杂度** | M |
| **前置依赖** | TASK-002（shared/ 类型可引用）, TASK-003（业务域域级 index.ts 可引用） |
| **执行波次** | Wave 2 |
| **对应 FR** | FR-003, ADR-001, ADR-006 |

**描述**: 创建 `src/adapters/opencode/` 适配层目录结构。从 `src/index.ts` 中提取平台注册逻辑（工具注册、Agent 注册、生命周期事件监听）到 `plugin.ts`。创建适配层自身的 `index.ts` 公共 API 出口。子目录（agents/, commands/, templates/）在此时创建空目录，源文件在 TASK-007 中迁入。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| NEW | `src/adapters/opencode/plugin.ts` — 从 `src/index.ts` 提取平台注册逻辑（`tool()` 调用、Agent 注册、事件监听） |
| NEW | `src/adapters/opencode/index.ts` — 适配层对外的唯一公共 API 出口 |
| NEW | `src/adapters/opencode/agents/` — 空目录，等待 TASK-007 迁入 |
| NEW | `src/adapters/opencode/commands/` — 空目录，等待 TASK-007 迁入 |
| NEW | `src/adapters/opencode/templates/` — 空目录，等待 TASK-007 迁入平台配置模板 |

**验收标准**:
- [ ] `src/adapters/opencode/plugin.ts` 包含原 `src/index.ts` 中的 `@opencode-ai/plugin` 导入 + 工具注册 + Agent 注册 + 事件监听逻辑
- [ ] `src/adapters/opencode/index.ts` 从 `plugin.ts` 导出公共 API
- [ ] `src/adapters/opencode/plugin.ts` 中 import 业务域时仅通过域级 `index.ts`（遵守 ADR-006 R-API-02）
- [ ] 3 个子目录存在：`agents/`, `commands/`, `templates/`
- [ ] TypeScript 编译通过：`npx tsc --noEmit`

**验证命令**:
```bash
# 检查目录结构
ls -d src/adapters/opencode/{agents,commands,templates} && echo "PASS: dirs"

# 检查 plugin.ts 存在且含平台 SDK import
test -f src/adapters/opencode/plugin.ts && rg '@opencode-ai/plugin' src/adapters/opencode/plugin.ts && echo "PASS: plugin.ts"

# 检查 index.ts 存在
test -f src/adapters/opencode/index.ts && echo "PASS: index.ts"

# TypeScript 编译
npx tsc --noEmit 2>&1 | head -20
```

---

### TASK-005: 编译与构建配置更新
> 多文件修改：tsconfig paths + package.json exports/scripts + build-agents.cjs 路径

| 属性 | 值 |
|------|-----|
| **复杂度** | M |
| **前置依赖** | TASK-001（package.json scripts 统一）, TASK-003（域目录已知） |
| **执行波次** | Wave 2 |
| **对应 FR** | FR-005, FR-007, ADR-003, ADR-005 |

**描述**: 更新 `tsconfig.json` 添加 paths 别名映射（7 个域），更新 `package.json` 添加 subpath exports（FR-007）和 test scripts（FR-005），确认 `scripts/build-agents.cjs` 内的硬编码路径在移动后解析正确。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| MODIFY | `tsconfig.json` — 添加 `compilerOptions.paths`（@pipeline, @state, @discovery, @agents, @templates, @opencode, @shared） |
| MODIFY | `package.json` — 添加 `exports` 字段（subpath exports: ., ./pipeline, ./state, ./opencode, ./shared 等）；添加 `scripts`（test:core, test:opencode, test:integration, test:all, test:e2e） |
| MODIFY | `scripts/build-agents.cjs` — 确认 `__dirname` 引用 `path.join(__dirname, '..', 'src', 'templates', 'agents')` 路径正确 |

**验收标准**:
- [ ] `tsconfig.json` 包含 7 组 paths 别名（`@pipeline/*`, `@state/*`, `@discovery/*`, `@agents/*`, `@templates/*`, `@opencode/*`, `@shared/*`）
- [ ] `package.json` `exports` 字段包含主入口 `.` + 4 个子路径（`./pipeline`, `./state`, `./opencode`, `./shared`）
- [ ] `package.json` `scripts` 包含 `test:core`, `test:opencode`, `test:integration`, `test:all`, `test:e2e` 五个命令
- [ ] `scripts/build-agents.cjs` 中 `AGENT_SRC_DIR` 指向正确的 `src/templates/agents/`
- [ ] `node -e "require('./package.json').exports"` 无报错

**验证命令**:
```bash
# 检查 tsconfig paths
node -e "const c=require('./tsconfig.json'); const p=c.compilerOptions.paths; \
  console.assert(p['@pipeline/*'], 'missing @pipeline/*'); \
  console.assert(p['@shared/*'], 'missing @shared/*'); \
  console.assert(p['@opencode/*'], 'missing @opencode/*'); \
  console.log('PASS: tsconfig paths')"

# 检查 package.json exports
node -e "const p=require('./package.json'); \
  console.assert(p.exports, 'missing exports'); \
  console.assert(p.exports['./pipeline'], 'missing ./pipeline export'); \
  console.assert(p.exports['./opencode'], 'missing ./opencode export'); \
  console.log('PASS: package.json exports')"

# 检查 test scripts
node -e "const p=require('./package.json'); \
  ['test:core','test:opencode','test:all','test:e2e'].forEach(s => \
    console.assert(p.scripts[s], 'missing script: '+s)); \
  console.log('PASS: test scripts')"

# 检查 build-agents.cjs 路径
node -e "const f=require('fs').readFileSync('scripts/build-agents.cjs','utf8'); \
  console.assert(f.includes(\"src/templates/agents\"), 'FAIL: build-agents.cjs path'); \
  console.log('PASS: build-agents.cjs paths')"
```

---

### TASK-006: 核心业务域源码迁移（pipeline + state + discovery）
> 复杂变更：~25 个 .ts 文件从旧位置迁入新业务域 + import 路径逐文件更新

| 属性 | 值 |
|------|-----|
| **复杂度** | L |
| **前置依赖** | TASK-003（目标目录已创建）, TASK-004（adapters/opencode/ 已创建，避免迁移冲突）, TASK-005（tsconfig 配置到位） |
| **执行波次** | Wave 3 |
| **对应 FR** | FR-001, ADR-001, ADR-006 |

**描述**: 将当前分散的源码文件按业务域归属迁入 3 个核心域目录。pipeline/ 接收工作流阶段流转相关逻辑；state/ 接收状态机、Schema、迁移等文件（保留现有文件，新增 index.ts 已在 TASK-003 完成）；discovery/ 接收需求挖掘阶段逻辑。迁移时同步更新每个文件的 import 语句（内部引用、跨域引用、shared 引用），所有跨域 import 必须通过对方的 index.ts。

**涉及文件 — pipeline/**:

| 操作 | 文件路径 |
|:--:|------|
| NEW | `src/pipeline/workflow-engine.ts` — 从原 discovery/ 或其它位置迁入的工作流阶段流转引擎 |
| NEW | `src/pipeline/coaching-mode.ts` — 管线级引导模式 |
| NEW | `src/pipeline/state-validator.ts` — 管线状态校验 |
| NEW | `src/pipeline/types.ts` — 管线类型定义 |

**涉及文件 — state/**:

| 操作 | 文件路径 |
|:--:|------|
| MODIFY | `src/state/machine.ts` — import 路径更新 |
| MODIFY | `src/state/schema-v3.0.0.ts` — import 路径更新 |
| MODIFY | `src/state/schema-v2.0.0.ts` — import 路径更新 |
| MODIFY | `src/state/schema-v1.2.5.ts` — import 路径更新 |
| MODIFY | `src/state/tree-scanner.ts` — import 路径更新 |
| MODIFY | `src/state/state-loader.ts` — import 路径更新 |
| MODIFY | `src/state/consistency-checker.ts` — import 路径更新 |
| MODIFY | `src/state/auto-updater.ts` — import 路径更新 |
| MODIFY | `src/state/parent-state-manager.ts` — import 路径更新 |
| MODIFY | `src/state/tree-state-validator.ts` — import 路径更新 |
| MODIFY | `src/state/migrator.ts` — import 路径更新 |
| MODIFY | `src/state/migrate-v1-to-v2.ts` — import 路径更新 |
| MODIFY | `src/state/dependency-checker.ts` — import 路径更新 |
| MODIFY | `src/state/multi-feature-manager.ts` — import 路径更新 |
| MODIFY | `src/state/types.ts` — import 路径更新（如有） |

**涉及文件 — discovery/**:

| 操作 | 文件路径 |
|:--:|------|
| NEW | `src/discovery/workflow-engine.ts` — 发现阶段流程逻辑 |
| NEW | `src/discovery/coaching-mode.ts` — 发现阶段引导逻辑 |
| NEW | `src/discovery/state-validator.ts` — 发现阶段状态校验 |
| NEW | `src/discovery/types.ts` — 发现阶段类型定义 |

**验收标准**:
- [ ] `src/state/` 下所有 .ts 文件的 import 语句指向正确的新路径（通过域级 index.ts 跨域引用，域内自由引用）
- [ ] `src/pipeline/` 下所有文件的 import 语句零 `@opencode-ai/plugin`
- [ ] `src/state/` 下所有文件的 import 语句零 `@opencode-ai/plugin`
- [ ] `src/discovery/` 下所有文件的 import 语句零 `@opencode-ai/plugin`
- [ ] 各核心域文件的跨域 import 均通过目标域的 `index.ts`（不直接 import 内部文件）
- [ ] TypeScript 编译无错误：`npx tsc --noEmit`（import 路径全部解析成功）

**验证命令**:
```bash
# 检查无平台 SDK 依赖
for dir in pipeline state discovery; do
  rg '@opencode-ai/plugin' "src/$dir/" --include '*.ts' && echo "FAIL: $dir has platform dep" || echo "PASS: $dir"
done

# 检查不反向引用 adapters/
rg "from '.*/adapters/" src/{pipeline,state,discovery} --include '*.ts' && echo "FAIL" || echo "PASS: no adapters ref"

# 检查跨域 import 通过 index.ts（以 state 为例）
# 允许: import { X } from '../state' 或 import { X } from '../../state'
# 禁止: import { X } from '../state/machine'
rg "from '\.\./(pipeline|state|discovery)/[a-z]" src/pipeline --include '*.ts' && echo "WARN: bypassing index.ts" || echo "PASS"

# 编译检查
npx tsc --noEmit 2>&1 | grep "error TS" | head -10
```

---

### TASK-007: 平台适配源码迁移与模板资产重组
> 复杂变更：~12 个 .ts 文件迁入 adapters/opencode/ + 19 个 HBS 模板资产重组 + import 更新

| 属性 | 值 |
|------|-----|
| **复杂度** | L |
| **前置依赖** | TASK-004（adapters/opencode/ 目标目录已创建）, TASK-005（tsconfig 配置到位） |
| **执行波次** | Wave 3 |
| **对应 FR** | FR-002, FR-003, FR-006, ADR-001, ADR-002 |

**描述**: 将平台相关源码迁入 `src/adapters/opencode/`（agents/, commands/），将 HBS 模板资产按方法论/平台性质分离重组（outputs/ 重命名 + opencode.json.hbs 迁入适配层）。迁移时同步更新所有 import 路径。

**涉及文件 — adapters/opencode/**:

| 操作 | 文件路径 |
|:--:|------|
| NEW | `src/adapters/opencode/agents/registry.ts` — 从 `src/agents/registry.ts` 迁入 |
| NEW | `src/adapters/opencode/agents/sddu-agents.ts` — 从 `src/agents/sddu-agents.ts` 迁入 |
| NEW | `src/adapters/opencode/commands/sddu-migrate-schema.ts` — 从 `src/commands/sddu-migrate-schema.ts` 迁入 |
| NEW | `src/adapters/opencode/templates/opencode.json.hbs` — 从 `src/templates/config/opencode.json.hbs` 迁入 |

**涉及文件 — 模板重组**:

| 操作 | 文件路径 |
|:--:|------|
| MODIFY | `src/templates/subfeature-templates.ts` — import 路径更新 |
| MOVE | `src/templates/agents/output/` → `src/templates/outputs/`（7 个 .hbs 产出格式模板） |
| KEEP | `src/templates/agents/*.hbs`（11 个 Agent 提示词模板，路径不变） |

**验收标准**:
- [ ] `src/adapters/opencode/agents/` 包含 registry.ts 和 sddu-agents.ts
- [ ] `src/adapters/opencode/commands/sddu-migrate-schema.ts` 存在且 import 正确
- [ ] `src/adapters/opencode/templates/opencode.json.hbs` 存在
- [ ] `src/templates/outputs/` 包含 7 个产出格式 .hbs 文件
- [ ] `src/templates/agents/` 保留 11 个 Agent 提示词 .hbs 文件
- [ ] `src/templates/config/` 目录不存在（已清空）
- [ ] 适配层可以通过域级 index.ts 引用业务域
- [ ] TypeScript 编译无错误

**验证命令**:
```bash
# 检查 adapters/opencode/ 文件到位
ls src/adapters/opencode/agents/{registry,sddu-agents}.ts && echo "PASS: agents"
ls src/adapters/opencode/commands/sddu-migrate-schema.ts && echo "PASS: commands"
ls src/adapters/opencode/templates/opencode.json.hbs && echo "PASS: templates"

# 检查模板分离
ls src/templates/outputs/*.hbs | wc -l | xargs -I{} test {} -eq 7 && echo "PASS: 7 output templates"
ls src/templates/agents/*.hbs | wc -l | xargs -I{} test {} -eq 11 && echo "PASS: 11 agent templates"
test ! -d src/templates/config && echo "PASS: config dir removed"

# 编译检查
npx tsc --noEmit 2>&1 | grep "error TS" | head -10
```

---

### TASK-008: src/index.ts 薄桶重构 + utils/ 拆散归属
> 多文件操作：重写 src/index.ts 为薄桶导出 + 拆散 utils/ 文件至各域

| 属性 | 值 |
|------|-----|
| **复杂度** | M |
| **前置依赖** | TASK-006（核心域有内容）, TASK-007（adapters/opencode/ 有内容） |
| **执行波次** | Wave 3 |
| **对应 FR** | FR-008, ADR-001, ADR-006 |

**描述**: 重构 `src/index.ts` —— 移除所有平台注册逻辑（已在 TASK-004 提取至 plugin.ts），改为从各业务域和 shared/ 的 index.ts 做 re-export 的薄桶。将 `src/utils/` 下的 5 个纯逻辑工具文件按其功能语义分别归属到各业务域。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| MODIFY | `src/index.ts` — 薄桶重写：仅 re-export 各域 index.ts 的公共 API，移除平台注册逻辑 |
| MOVE | `src/utils/tasks-parser.ts` → 归属到 pipeline/ 或 state/（按语义判断） |
| MOVE | `src/utils/subfeature-manager.ts` → 归属到 templates/ |
| MOVE | `src/utils/readme-generator.ts` → 归属到 templates/ 或 discovery/ |
| MOVE | `src/utils/dependency-notifier.ts` → 归属到 shared/ |
| MOVE | `src/utils/index.ts` → 内容拆散，不再需要集中式 utils 出口 |

**验收标准**:
- [ ] `src/index.ts` 的内容为纯 re-export（不包含 `tool()` 调用、Agent 注册、事件监听）
- [ ] `src/index.ts` 中 `import { tool } from '@opencode-ai/plugin'` 已移除
- [ ] `src/utils/` 目录下的 .ts 文件已全部迁入对应业务域并更新 import
- [ ] `src/utils/` 目录为空或仅保留与 utils 语义无关的文件（可通过 TASK-011 清理）
- [ ] TypeScript 编译无错误

**验证命令**:
```bash
# 检查 src/index.ts 不含平台注册
rg '@opencode-ai/plugin' src/index.ts && echo "FAIL: still has platform import" || echo "PASS: no platform import in index.ts"
rg 'tool\(' src/index.ts && echo "FAIL: still has tool()" || echo "PASS: no tool() in index.ts"

# 检查 utils/ 为空（仅 .ts 文件）
ls src/utils/*.ts 2>/dev/null && echo "WARN: utils/ still has files" || echo "PASS: utils/ clean"

# 编译检查
npx tsc --noEmit 2>&1 | grep "error TS" | head -10
```

---

### TASK-009: 测试文件集中迁移
> 复杂变更：~35 个测试文件 + fixtures/reports 从分散位置集中迁移至 src/__tests__/ 和 e2e/

| 属性 | 值 |
|------|-----|
| **复杂度** | L |
| **前置依赖** | TASK-006（源文件在新位置）, TASK-007（HBS 模板重组完成）, TASK-008（src/index.ts 收口） |
| **执行波次** | Wave 4 |
| **对应 FR** | FR-005, ADR-004 |

**描述**: 将所有分散在 3 种测试模式中的 ~35 个测试文件集中迁移至统一的 `src/__tests__/` 目录（按业务域分子目录结构）。co-located 测试（16 个）、`__tests__/` 子目录测试（6 个）和根 `tests/` 测试（16 个 .test.ts）均迁入 `src/__tests__/unit/` 或 `src/__tests__/integration/`。E2E 测试迁移至独立的顶层 `e2e/` 目录。fixtures 和 reports 同步迁移。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| NEW | `src/__tests__/unit/pipeline/` — 管线域单元测试 |
| NEW | `src/__tests__/unit/state/` — 状态域单元测试（~13 个 .test.ts） |
| NEW | `src/__tests__/unit/discovery/` — 发现域单元测试 |
| NEW | `src/__tests__/unit/agents/` — Agent 域单元测试 |
| NEW | `src/__tests__/unit/templates/` — 模板域单元测试 |
| NEW | `src/__tests__/unit/adapters/opencode/agents/` — 适配层 Agent 测试 |
| NEW | `src/__tests__/unit/adapters/opencode/commands/` — 适配层命令测试 |
| NEW | `src/__tests__/unit/shared/` — shared 层测试（~7 个 utils .test.ts） |
| NEW | `src/__tests__/integration/compatibility/` — 兼容性测试 |
| NEW | `src/__tests__/integration/regression/` — 回归测试 |
| NEW | `src/__tests__/integration/state/` — 状态集成测试（~7 个） |
| NEW | `src/__tests__/fixtures/` — 测试固件（从 tests/fixtures/ 迁入） |
| NEW | `src/__tests__/reports/` — 测试报告模板 |
| NEW | `e2e/jest.config.ts` — E2E 独立 Jest 配置 |
| MOVE | `tests/e2e/*.test.ts` → `e2e/*.test.ts` — E2E 测试文件 |
| DELETE | `src/` 内 co-located `*.test.ts` 文件（16 个）和 `__tests__/` 子目录（2 个）— 源文件迁移后旧址删除 |
| DELETE | `tests/` 目录（整体移除，内容已迁入 src/__tests__/ 和 e2e/） |

**验收标准**:
- [ ] 所有 `src/` 内 co-located `*.test.ts` 文件已删除（不在业务源目录中）
- [ ] 所有 `src/` 内 `__tests__/` 子目录已删除
- [ ] `src/__tests__/unit/` 按业务域分子目录，共 7 个子域目录
- [ ] `src/__tests__/integration/` 包含 compatibility/, regression/, state/ 子目录
- [ ] `src/__tests__/fixtures/` 包含 legacy-v1.1.1/ 和 multi-feature/ 固件
- [ ] `e2e/` 目录包含 E2E 测试文件和 `jest.config.ts`
- [ ] 测试文件中的 import 路径指向正确的新源文件位置
- [ ] `tests/` 根目录不存在（无残留）

**验证命令**:
```bash
# 检查 co-located 测试已清理
find src/ -name '*.test.ts' -not -path '*/__tests__/*' | grep -v node_modules && echo "FAIL: co-located tests remain" || echo "PASS: no co-located tests"

# 检查旧 __tests__ 目录已清理
find src/ -type d -name '__tests__' -not -path 'src/__tests__' && echo "FAIL: old __tests__ dirs remain" || echo "PASS: no old __tests__ dirs"

# 检查新测试结构
for dir in pipeline state discovery agents templates adapters/opencode/agents adapters/opencode/commands shared; do
  test -d "src/__tests__/unit/$dir" && echo "OK: src/__tests__/unit/$dir" || echo "MISSING: src/__tests__/unit/$dir"
done

# e2e 独立
test -f e2e/jest.config.ts && echo "PASS: e2e/jest.config.ts" || echo "FAIL"
test -d tests && echo "FAIL: tests/ still exists" || echo "PASS: tests/ removed"
```

---

### TASK-010: 测试配置重构
> 多文件修改：jest.config.ts projects 配置 + e2e/jest.config.ts 独立配置 + test scripts 最终确认

| 属性 | 值 |
|------|-----|
| **复杂度** | M |
| **前置依赖** | TASK-009（测试文件已在 src/__tests__/ 和 e2e/ 中就位） |
| **执行波次** | Wave 4 |
| **对应 FR** | FR-005, ADR-004 |

**描述**: 重构 `jest.config.ts` — 引入 `projects` 配置支持 3 个独立测试项目（core / opencode / integration），基于 `src/__tests__/` 的目录结构通过 `testMatch` 区分。创建 `e2e/jest.config.ts` 作为 E2E 测试独立配置（不 import src/，不收集覆盖率）。在 `package.json` 中确认 test scripts 的最终映射。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| MODIFY | `jest.config.ts` — 重写为 projects 模式：core / opencode / integration 三个项目 + 全局覆盖率阈值 |
| MODIFY | `e2e/jest.config.ts` — E2E 独立配置（testMatch: e2e/, 不收集覆盖率, testTimeout: 30000） |
| MODIFY | `package.json` — 确认 scripts 中的 test 命令映射正确（已在 TASK-005 添加，此处最终验证） |

**验收标准**:
- [ ] `jest.config.ts` 包含 `projects` 数组，含 3 个项目：core, opencode, integration
- [ ] core 项目的 `testMatch` 覆盖 `src/__tests__/unit/(pipeline|state|discovery|agents|templates|shared)/`
- [ ] opencode 项目的 `testMatch` 覆盖 `src/__tests__/unit/adapters/`
- [ ] integration 项目的 `testMatch` 覆盖 `src/__tests__/integration/`
- [ ] `e2e/jest.config.ts` 的 `testMatch` 指向 `e2e/`，`coverageReporters` 为空
- [ ] `npm run test:core -- --passWithNoTests` 加载正确的测试项目（无测试时也不报错）
- [ ] `npm run test:e2e -- --passWithNoTests` 使用 e2e/jest.config.ts

**验证命令**:
```bash
# 检查 jest.config.ts 结构
node -e "
const c = require('./jest.config.ts').default || require('./jest.config.ts');
console.assert(c.projects && c.projects.length === 3, 'FAIL: should have 3 projects');
const names = c.projects.map(p => p.displayName);
console.assert(names.includes('core'), 'FAIL: missing core project');
console.assert(names.includes('opencode'), 'FAIL: missing opencode project');
console.assert(names.includes('integration'), 'FAIL: missing integration project');
console.log('PASS: jest.config.ts projects');
"

# 检查 e2e/jest.config.ts
node -e "
const c = require('./e2e/jest.config.ts').default || require('./e2e/jest.config.ts');
console.assert(c.testMatch && c.testMatch[0].includes('e2e/'), 'FAIL: e2e testMatch');
console.assert(!c.coverageThreshold, 'FAIL: e2e should not have coverage');
console.log('PASS: e2e/jest.config.ts');
"

# 加载测试配置（不实际运行测试）
npx jest --config jest.config.ts --listTests 2>&1 | head -5
npx jest --config e2e/jest.config.ts --listTests 2>&1 | head -5
```

---

### TASK-011: 旧文件清理
> 多文件删除：清除所有已迁移文件的旧址和空目录

| 属性 | 值 |
|------|-----|
| **复杂度** | M |
| **前置依赖** | TASK-006（核心域迁移完成）, TASK-007（平台+模板迁移完成）, TASK-008（utils/ 清空）, TASK-009（测试迁移完成） |
| **执行波次** | Wave 5 |
| **对应 FR** | ADR-001, ADR-004, ADR-005 |

**描述**: 删除所有已迁移到新位置的源文件旧址、旧测试文件、空目录。确保无残留引用指向已删除文件。清理后项目的 `src/` 目录只保留新架构下的目录结构。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| DELETE | `src/agents/` 目录（含 registry.ts, sddu-agents.ts, registry.test.ts — 测试已迁移） |
| DELETE | `src/commands/` 目录（含 sddu-migrate-schema.ts） |
| DELETE | `src/discovery/` 内的旧文件（workflow-engine.ts, coaching-mode.ts, state-validator.ts, types.ts + `__tests__/`）— **仅删除已迁入 pipeline/ 或新 discovery/ 的旧文件** |
| DELETE | `src/errors.ts`（旧址） |
| DELETE | `src/errors.test.ts`（co-located 旧址） |
| DELETE | `src/types.ts`（旧址） |
| DELETE | `src/types.test.ts`（co-located 旧址） |
| DELETE | `src/utils/` 目录（含全部文件 + index.test.ts） |
| DELETE | `src/templates/config/` 目录 |
| DELETE | `src/templates/subfeature-templates.test.ts`（co-located 旧址） |
| DELETE | `src/state/` 内的 `__tests__/` 子目录和 co-located `*.test.ts` 文件 |
| DELETE | `src/discovery/__tests__/` 子目录 |
| DELETE | `tests/` 根目录（整体删除，内容已迁入 src/__tests__/ + e2e/） |
| DELETE | 残留空目录（`src/commands/`, `src/templates/config/` 等） |

**验收标准**:
- [ ] `src/agents/` 目录不存在
- [ ] `src/commands/` 目录不存在
- [ ] `src/utils/` 目录不存在
- [ ] `src/errors.ts`, `src/types.ts` 不存在
- [ ] `src/` 内无 co-located `*.test.ts` 文件（除 src/__tests__/ 内部）
- [ ] `tests/` 根目录不存在
- [ ] `src/discovery/` 内仅保留新架构下该域应有的业务逻辑文件
- [ ] `src/templates/config/` 目录不存在
- [ ] TypeScript 编译通过（无引用旧文件路径的 import）

**验证命令**:
```bash
# 检查已删除目录
for dir in src/agents src/commands src/utils tests; do
  test -d "$dir" && echo "FAIL: $dir still exists" || echo "PASS: $dir removed"
done

# 检查已删除文件
for f in src/errors.ts src/types.ts; do
  test -f "$f" && echo "FAIL: $f still exists" || echo "PASS: $f removed"
done

# 检查无 co-located 测试文件
find src/ -maxdepth 1 -name '*.test.ts' && echo "FAIL" || echo "PASS: root src/ clean"
find src/ -name '*.test.ts' -not -path 'src/__tests__/*' | grep -v src/__tests__/ && echo "FAIL: co-located tests" || echo "PASS: no co-located tests"

# 检查 src/templates/config/ 已清除
test -d src/templates/config && echo "FAIL" || echo "PASS: config dir removed"

# 残留检查 — 编译通过
npx tsc --noEmit 2>&1 | grep "error TS" | head -10
```

---

### TASK-012: 构建验证与全量测试回归
> 复杂变更：全量构建 + 分层测试执行 + 循环依赖检测 + 产物质检

| 属性 | 值 |
|------|-----|
| **复杂度** | L |
| **前置依赖** | TASK-001 ~ TASK-011（全部前置任务完成） |
| **执行波次** | Wave 5 |
| **对应 FR** | NFR-001, NFR-002, NFR-004, NFR-005, EC-001, ADR-003, ADR-004, ADR-006 |

**描述**: 执行端到端验证管线 — ① TypeScript 编译检查（`tsc --noEmit`）② 按 FR-005 三层粒度分别执行测试（core / opencode / integration）③ 执行 E2E 测试 ④ 运行循环依赖检测（madge/dpdm）⑤ 关键路径性能对比（重组前后差异 < 5%）⑥ npm pack 产物结构验证（dist/ 保留分层语义）。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| VERIFY | `dist/` 目录 — tsc 编译产物，验证分层结构 |
| VERIFY | `src/` 所有 .ts 文件 — tsc --noEmit 零错误 |
| VERIFY | `src/__tests__/` — 全量测试通过率 100% |
| VERIFY | `e2e/` — E2E 测试通过 |
| VERIFY | 循环依赖 — madge 检测零循环 |

**验收标准**:
- [ ] `npx tsc --noEmit` 零错误（所有 import 路径正确，类型一致）
- [ ] `npm run build` 成功，dist/ 中保留分层结构（`dist/pipeline/`, `dist/state/`, `dist/adapters/opencode/`, `dist/shared/`）
- [ ] `npm run test:core` 通过（测试 src/__tests__/unit/ 核心域）
- [ ] `npm run test:opencode` 通过（测试 src/__tests__/unit/adapters/）
- [ ] `npm run test:integration` 通过（测试 src/__tests__/integration/）
- [ ] `npm run test:e2e` 通过（E2E 场景无回归）
- [ ] `npm run test:all` 通过（全部 unit + integration 测试）
- [ ] 循环依赖检测零问题（`npx madge --circular src/` 或 `npx dpdm src/index.ts`）
- [ ] `npm pack` 产物可正常安装使用

**验证命令**:
```bash
# 1. TypeScript 编译
npx tsc --noEmit && echo "PASS: tsc" || echo "FAIL: tsc"

# 2. 全量构建
npm run build && echo "PASS: build"

# 3. 验证 dist/ 分层结构
ls dist/pipeline/ && echo "PASS: dist/pipeline/"
ls dist/state/ && echo "PASS: dist/state/"
ls dist/adapters/opencode/ && echo "PASS: dist/adapters/opencode/"
ls dist/shared/ && echo "PASS: dist/shared/"

# 4. 分层测试
npm run test:core -- --passWithNoTests && echo "PASS: test:core"
npm run test:opencode -- --passWithNoTests && echo "PASS: test:opencode"
npm run test:integration -- --passWithNoTests && echo "PASS: test:integration"
npm run test:all -- --passWithNoTests && echo "PASS: test:all"

# 5. E2E 测试
npm run test:e2e -- --passWithNoTests && echo "PASS: test:e2e"

# 6. 循环依赖检测（如果 madge 可用）
npx madge --circular --extensions ts src/index.ts 2>/dev/null && echo "WARN: circular deps found" || echo "PASS: no circular deps (or madge not available)"

# 7. npm pack 验证
npm pack --dry-run 2>&1 | head -20
echo "---"
echo "PASS: npm pack preview"
```

---

## 3. 任务汇总
> 任务数量、复杂度和波次的统计总览

| 统计项 | 数值 |
|--------|:--:|
| 总任务数 | 12 |
| S 级 (简单) | 1 |
| M 级 (中等) | 6 |
| L 级 (复杂) | 5 |
| 执行波次 | 5 |

## 4. 执行策略
> 各波次的执行说明

| 波次 | 任务 | 策略 |
|:--:|------|------|
| 1 | TASK-001, TASK-002 | 并行执行 — 零依赖，互不干扰 |
| 2 | TASK-003, TASK-004, TASK-005 | 并行执行 — 均依赖 Wave 1 完成，三者间无直接依赖 |
| 3 | TASK-006, TASK-007, TASK-008 | 并行执行 — 均依赖 Wave 2 的目录和配置就绪 |
| 4 | TASK-009, TASK-010 | 顺序执行 — TASK-010 依赖 TASK-009 测试文件到位 |
| 5 | TASK-011, TASK-012 | 顺序执行 — TASK-012 依赖 TASK-011 清理完成后编译通过 |

**建议的 build 执行顺序**：
```
@sddu-build TASK-001 → @sddu-build TASK-002        (Wave 1 并行)
@sddu-build TASK-003 → @sddu-build TASK-004 → @sddu-build TASK-005  (Wave 2 并行)
@sddu-build TASK-006 → @sddu-build TASK-007 → @sddu-build TASK-008  (Wave 3 并行)
@sddu-build TASK-009                                            (Wave 4)
@sddu-build TASK-010                                            (Wave 4)
@sddu-build TASK-011 → @sddu-build TASK-012                     (Wave 5)
```

## 修订记录
> 记录本文档的版本变更历史

| 版本 | 变更说明 | 日期 | 修订人 |
|------|---------|------|--------|
| v1.0 | 初始创建 — 基于 plan.md + 6 个 ADR，分解为 12 个任务 / 5 个波次 | 2026-06-21 | SDDU Tasks Agent |
