# ADR-001：业务对象架构 + adapters/ 平台适配器容器

## 状态
PROPOSED

## 背景
SDDU 框架当前 `src/` 目录采用扁平命名空间——`agents/`、`commands/`、`discovery/`、`state/`、`templates/`、`utils/` 等模块以同级目录存在，无层级区分。维护者阅读源码时无法从文件路径判断模块的平台依赖性（Q-001），新贡献者需通读全部源码才能建立心智模型（Q-003），架构决策者无法评估跨平台移植可行性（Q-002）。

经过审计，当前 46/47 个源文件已为零平台依赖的纯逻辑代码，唯一的平台耦合点是 `src/index.ts`（`import { tool } from '@opencode-ai/plugin'`）。架构重组的前提条件已经成熟。

spec.md 定义了以下核心需求：
- **FR-001**：工作流核心不依赖任何平台 SDK
- **FR-003**：平台适配层消费核心能力，单向依赖
- **FR-004**：共享类型/错误零平台依赖
- **FR-009**：核心对平台适配层暴露明确的能力边界
- **FR-010**：核心定义多平台适配接口契约

## 决策
我们决定将 `src/` 重组为**业务对象架构**，以**业务域**为顶层组织单元，平台适配以 `adapters/` 容器统一管理：

```
src/
├── index.ts                          ← 公共 API 薄桶导出

├── pipeline/                         ← 管线定义（工作流阶段流转）
├── state/                            ← 状态追踪（状态机、Schema、迁移）
├── discovery/                        ← 需求挖掘（引导式访谈、校验）
├── agents/                           ← 智能体注册（方法论层面）
├── templates/                        ← 模板引擎 + 方法论模板资产
│   ├── subfeature-templates.ts
│   ├── agents/                       ← Agent 提示词模板（11 个 sddu-*.md.hbs）
│   └── outputs/                      ← 阶段产出格式模板（7 个 output/*.md.hbs）

├── adapters/                       ← 平台适配器容器（为多平台扩展预留接入点）
│   └── opencode/                     ← OpenCode 平台适配
│       ├── plugin.ts                 ← 插件入口（工具注册 + 事件监听）
│       ├── agents/                   ← Agent 注册与集成
│       ├── commands/                 ← CLI 命令
│       └── templates/               ← 平台配置模板（opencode.json.hbs）

└── shared/                           ← 跨域共享（零平台依赖）
    ├── types.ts                      ← 统一类型定义
    ├── errors.ts                     ← 统一错误定义
    └── platform-adapter.ts           ← 多平台适配接口契约
```

**依赖方向**：
```
adapters/opencode/ → 业务对象（pipeline, state, discovery, agents, templates） → shared/
            \
             └──────────→ shared/
```
- 业务对象不 import `adapters/`（单向依赖）
- `shared/` 不 import 任何业务域或 `adapters/` 模块（零依赖）
- `adapters/opencode/` 可以 import `@opencode-ai/plugin`、任意业务对象、`shared/`

**模块归属规则**：
| 归属 | 判断标准 |
|------|---------|
| 业务对象（pipeline, state, discovery, agents, templates） | SDDU 方法论业务逻辑，零平台 SDK import |
| `adapters/opencode/` | 直接依赖 `@opencode-ai/plugin` 或语义上属于平台注册/集成的代码 |
| `shared/` | 被业务对象和 adapters 共同引用，本身零依赖 |

**顶层 `src/index.ts`**：重构为薄桶导出——从各业务域 re-export 公共 API，不再包含平台注册逻辑。

**方法论模板资产**：Agent 提示词模板（`.hbs`）和产出格式模板位于 `src/templates/agents/` 和 `src/templates/outputs/`，与模板引擎逻辑同目录管理，具体组织策略见 ADR-002。

## 后果

### 正面影响
1. **文件路径即架构文档**：维护者阅读 `src/state/machine.ts` 即知这是平台无关的状态机核心；阅读 `src/adapters/opencode/plugin.ts` 即知这是 OpenCode 平台适配入口
2. **平台可移植性**：使用 `adapters/` 作为平台适配器容器——未来适配新平台只需新增 `src/adapters/<新平台>/` 并实现 `PlatformAdapter` 接口，业务对象代码零修改
3. **新人入门成本降低**：从目录结构即可建立心智模型——pipeline/state/discovery/agents/templates = SDDU 方法论业务域，adapters/opencode/ = 平台胶水，shared/ = 公共约定
4. **依赖规则可自动化验证**：可通过 ESLint `import/no-restricted-paths` 或 `madge` 在 CI 中强制检查依赖方向（EC-001）
5. **测试可分层执行**：jest projects 配置可按业务域 / opencode 平台适配 / 全量 三种粒度独立执行（ADR-004）

### 负面影响
1. **import 路径变更**：~50 个源文件的 import 语句需逐文件更新（可通过脚本自动化缓解）
2. **协同分支冲突**：与并行开发的分支可能产生合并冲突（EC-004，缓解措施见 plan.md 风险评估）
3. **构建脚本调整**：`build-agents.cjs` 等工具脚本需同步更新模板源路径

### 与其他 ADR 的关系
- **ADR-002**（模板分离）：决定 `src/templates/` 内方法论模板与平台模板的组织策略
- **ADR-003**（构建配置）：决定 tsconfig paths 和 subpath exports 的具体方式
- **ADR-004**（测试组织）：决定测试如何在业务对象架构下组织
