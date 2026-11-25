# ADR-002：模板分离策略 — 方法论资产 vs 平台配置

## 状态
PROPOSED

## 背景
SDDU 框架有 19 个 Handlebars (`.hbs`) 模板文件，当前全部存放于 `src/templates/` 下，分为三类：

| 类别 | 文件 | 内容性质 | 当前路径 |
|------|------|---------|---------|
| Agent 提示词模板 | `sddu-*.md.hbs`（11 个） | SDDU 方法论——每个阶段 Agent 的职责定义和工作流指令 | `src/templates/agents/` |
| 产出格式模板 | `sddu-*.md.hbs`（7 个） | SDDU 方法论——每个阶段产出物的格式规范 | `src/templates/agents/output/` |
| 平台配置模板 | `opencode.json.hbs`（1 个） | OpenCode 平台配置——Agent 注册、模型配置、权限规则 | `src/templates/config/` |

spec.md 提出了以下需求：
- **FR-002**：Agent 行为定义（HBS 模板内容）作为方法论资产独立管理，与平台注册机制分离
- **FR-006**：方法论文档模板与平台配置模板在代码组织中可明确区分、修改互不影响

spec 开放问题 #2：Agent 提示词模板的内容属于 SDDU 方法论资产，但其 Handlebars 格式和某些平台特定语法是为 openCode 定制的——需在 plan 阶段逐文件审计，确定分离策略。

## 决策
我们决定采用 **「方法论模板留在 src/templates/ + 平台模板归属适配层」** 的分离方案：

### 模板归属方案

```
src/
├── templates/                           ← 模板引擎 + 方法论资产（同目录统一管理）
│   ├── subfeature-templates.ts          ← 模板生成引擎逻辑（TypeScript）
│   ├── agents/                          ← Agent 提示词模板（11 个 sddu-*.md.hbs）
│   │   ├── sddu.md.hbs                  ← 主协调器
│   │   ├── sddu-discovery.md.hbs        ← 需求挖掘
│   │   ├── sddu-spec.md.hbs             ← 规范编写
│   │   ├── sddu-plan.md.hbs             ← 技术规划
│   │   ├── sddu-tasks.md.hbs            ← 任务分解
│   │   ├── sddu-build.md.hbs            ← 任务实现
│   │   ├── sddu-review.md.hbs           ← 代码审查
│   │   ├── sddu-validate.md.hbs         ← 最终验证
│   │   ├── sddu-roadmap.md.hbs          ← 版本规划
│   │   ├── sddu-tree.md.hbs             ← 目录导航
│   │   └── sddu-docs.md.hbs             ← 文档生成
│   └── outputs/                         ← 阶段产出格式模板（7 个）
│       ├── sddu-discovery.md.hbs
│       ├── sddu-spec.md.hbs
│       ├── sddu-plan.md.hbs
│       ├── sddu-tasks.md.hbs
│       ├── sddu-build.md.hbs
│       ├── sddu-review.md.hbs
│       └── sddu-validate.md.hbs
│
├── adapters/
│   └── opencode/
│       └── templates/                   ← OpenCode 平台配置模板
│           └── opencode.json.hbs        ← 生成 .opencode/opencode.json 的模板
│
...
```

### 决策依据

**为何方法论模板留在 `src/templates/`？**

1. **模板与生成逻辑就近管理**：模板引擎代码（`subfeature-templates.ts`）与其处理的模板资产（`.hbs`）同目录，修改模板时无需跨目录查找，降低认知负担。

2. **单目录统一资产视图**：`src/templates/` 既是模板引擎的运行时代码，也是模板资产的管理入口——维护者打开一个目录即可看到全部模板相关内容。

3. **构建路径简洁**：`build-agents.cjs` 直接引用 `src/templates/agents/` 作为源目录，无需跨越 `src/` 边界，路径更短、更直观。

4. **编译隔离不变**：`.hbs` 文件不会被 `tsc` 编译——`tsconfig.json` 的 `include` 只匹配 `*.ts`，模板资产天然被排除，`src/` 目录内的混合不影响编译。

**为何平台配置模板归属适配层？**

`opencode.json.hbs` 生成的是 OpenCode 平台特定配置（Agent 注册列表、模型配置、权限规则），其内容结构直接依赖 OpenCode 的 plugin API schema。当适配其他平台时，这个模板会被全新的平台配置模板替换。因此归属 `src/adapters/opencode/templates/` 是合理的。

**关于 Handlebars 格式**：

当前模板使用 Handlebars 语法（`{{#if}}`、`{{#each}}` 等）是纯模板引擎语法，不属于任何平台的 SDK。未来如果 SDDU 迁移到其他模板引擎（如 Mustache、Liquid），只需替换模板文件格式，方法论内容本身不变。因此 Handlebars 格式不作为「平台依赖」处理。

### 构建脚本影响

`build-agents.cjs` 模板源路径保持 `src/templates/agents/`，无需变更：
- **源路径**：`AGENT_SRC_DIR = src/templates/agents`（不变）
- **输出目录**：`AGENT_OUT_DIR = dist/templates/agents`（确保下游引用不中断）

## 后果

### 正面影响
1. **模板与引擎就近管理**：`src/templates/` 统一管理模板引擎代码和模板资产，认知路径集中
2. **方法论模板可独立演进**：修改 Agent 提示词内容不影响 TypeScript 编译（`.hbs` 不在 `tsc` 范围内）
3. **平台模板明确归属**：平台配置模板位于适配层目录内，新人一眼即知其平台相关性
4. **满足 FR-006**：方法论文档模板（`src/templates/outputs/`）与平台配置模板（`src/adapters/opencode/templates/`）在代码组织中明确可区分
5. **无需迁移代价**：模板源路径保持 `src/templates/agents/` 不变，`build-agents.cjs` 无需修改

### 负面影响
1. **`src/templates/` 目录混合文件类型**：`.ts` 代码与 `.hbs` 资产同目录，但 `tsc` 天然忽略 `.hbs`，不影响编译
2. **平台模板路径略深**：`src/adapters/opencode/templates/opencode.json.hbs` 路径较长，但表达了清晰的归属层级

### 与其他 ADR 的关系
- **ADR-001**（业务对象架构）：`src/templates/` 属于核心业务域，零平台依赖
- **ADR-003**（构建配置）：`tsc` 只在 `src/` 编译 `.ts` 文件，`.hbs` 不在编译范围内
