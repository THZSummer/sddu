# 技术计划：SDDU 框架源码架构重组

> **文档定位**: SDDU 技术方案 — 记录架构设计、方案对比和 ADR，作为 tasks 阶段的输入  
> **前置依赖**: spec.md（需求规范）  
> **创建人**: SDDU Plan Agent  
> **创建时间**: 2026-06-21  
> **版本**: v1.8
> **更新人**: SDDU Plan Agent
> **更新时间**: 2026-06-21
> **更新说明**: Bug-001 修复 — §2.2.1 `e2e/` 合并 `scripts/e2e/`，消除双 `e2e` 目录冗余

## 1. 前置检查
> 启动技术规划前必须验证的前置条件

| 检查项 | 状态 |
|--------|:--:|
| spec.md 存在 | ✅ |
| 外部 API 文档缓存 | ⚠️ 不适用（本 Feature 为源码架构重组，不涉及外部 API） |
| 前置依赖已满足 | ✅ |

**审计确认**：当前 `src/` 下 46/47 个源文件为零 `@opencode-ai/plugin` 依赖的纯逻辑代码。唯一的平台耦合点是 `src/index.ts`（第 14 行 `import { tool } from '@opencode-ai/plugin'`）。架构重组的前提条件已经成熟。

## 2. 架构分析
> 分析现有架构影响和需要的新组件

### 2.1 现有架构（As-Is）

#### 2.1.1 项目根目录现状

```
<<project-root>>/                    ← 根目录：配置文件 + 脚本 + 源码 + 文档 + 测试 —— 混杂无层级
│
├── .git/                            ← Git 版本控制元数据（必须根目录）
├── .gitignore                       ← Git 忽略规则（必须根目录）
├── .opencode/                       ← OpenCode 运行时目录 [不在修改范围]
├── opencode.json                    ← OpenCode 平台配置 [不在修改范围]
├── .sddu/                           ← SDDU 运行时目录 [不在修改范围]
│
├── package.json                     ← npm 项目清单（必须根目录）
├── package-lock.json                ← npm 依赖锁文件（必须根目录）
├── tsconfig.json                    ← TypeScript 编译配置（约定根目录）
├── jest.config.ts                   ← Jest 测试配置（约定根目录）
├── LICENSE                          ← 开源许可证（约定根目录）
├── README.md                        ← 项目说明文档（约定根目录）
├── CHANGELOG.md                     ← 变更日志（约定根目录）
│
├── bootstrap.sh                     ← 🔴 用户引导脚本，散落根目录
├── bootstrap.ps1                    ← 🔴 用户引导脚本（PowerShell），散落根目录
├── install.sh                       ← 🔴 安装脚本，散落根目录
├── install.ps1                      ← 🔴 安装脚本（PowerShell），散落根目录
├── build-agents.cjs                 ← 🔴 Agent 构建脚本，散落根目录
├── test-sddu-functionality.js       ← 🔴 冒烟验证脚本，散落根目录
│
├── src/                             ← 源码（单一扁平命名空间，详见 2.1.2）
├── scripts/                         ← 工具脚本（部分脚本已分类存放于此，部分仍散落根目录）
│   ├── package.cjs                  ← 打包脚本
│   ├── package.test.cjs             ← 打包测试
│   ├── migrate-sdd-to-sddu.sh       ← SDD→SDDU 迁移工具
│   ├── check-sdd-residue.sh         ← SDD 残留检查
│   ├── sddu-check.sh                ← SDDU 功能验证
│   ├── sddu-validation-report.sh    ← 验证报告生成
│   └── e2e/                         ← E2E 测试脚本
│       ├── basic/
│       └── fullstack/
├── tests/                           ← 工程级测试套件（与 src/ 内测试并存，多套组织）
│   ├── unit/                        ← 单元测试（与 src/__tests__/ 功能重叠）
│   ├── integration/                 ← 集成测试
│   ├── e2e/                         ← E2E 测试
│   ├── compatibility/               ← 向后兼容性测试
│   ├── regression/                  ← 回归测试
│   ├── state/                       ← 状态机集成测试
│   ├── fixtures/                    ← 测试固件
│   ├── reports/                     ← 测试报告
│   └── README.md                    ← 测试说明
├── docs/                            ← 项目文档
│   ├── migration-guide.md           ← 迁移指南
│   ├── cleanup-checklist.md         ← 清理清单
│   ├── containerization-faq.md      ← 容器化 FAQ
│   ├── FULLSTACK-E2E-GUIDE.md       ← 全栈 E2E 指南
│   ├── permission-audit-report.md   ← 权限审计报告
│   ├── sdd-residue-checklist.md     ← SDD 残留清单
│   ├── split-principles.md          ← 拆分原则
│   └── state-schema-v2.0.0.md       ← 状态模式文档
├── examples/                        ← 示例项目
│   └── tree-structure-demo/         ← 目录树结构示例
├── dist/                            ← 构建产物（gitignored，tsc 扁平输出）
└── node_modules/                    ← npm 依赖（gitignored）
```

**根目录关键发现**：

| # | 问题 | 详情 |
|---|------|------|
| R-001 | **脚本散落根目录** | `build-agents.cjs`、`test-sddu-functionality.js` 两个构建/验证脚本与 `package.json`、`tsconfig.json` 等配置文件混杂在根目录。`scripts/` 子目录已存在，部分脚本已收敛其中，但并非全部 |
| R-002 | **双重测试组织** | `tests/unit/` 与 `src/` 内 `__tests__/`、colocated `*.test.ts` 并存，测试文件散落在三个不同层级，无统一入口 |
| R-003 | **bootstrap/install 入口脚本定位** | `bootstrap.sh` 和 `install.sh` 是面向终端用户的一键安装入口。`bootstrap.sh` 被 curl 从 GitHub raw URL 拉取执行，其 repo 内路径构成公开 URL；`install.sh` 在 clone 后本地执行 |
| R-004 | **根目录认知负担高** | 27 个顶层条目（含目录），新贡献者进入项目后需逐个辨别 `bootstrap.sh`、`build-agents.cjs` 等文件的用途和归属 |
| R-005 | **构建工具未与源码同策略管理** | `build-agents.cjs` 内含硬编码路径引用 `src/templates/agents/` 和 `dist/templates/agents/`，但自身位于根目录——当 `src/` 重组时需同步更新此文件的路径引用，存在断裂风险 |
| R-006 | **package.json 脚本路径不统一** | `"build:agents": "node build-agents.cjs"` 引用根目录脚本，而 `"package": "node scripts/package.cjs"` 引用 scripts/ 下脚本——相同性质的构建操作，路径约定不一致 |

#### 2.1.2 源码目录现状

```
src/                          ← 单一扁平命名空间，无层级区分
├── index.ts                  ← 插件入口 + 工具注册 + 事件监听 + 类型导出（645 行，四重职责）
├── types.ts                  ← 类型统一出口（187 行，聚合所有模块类型）
├── errors.ts                 ← 错误定义
├── agents/                   ← Agent 定义与注册（依赖 @opencode-ai/plugin 语义）
│   ├── registry.ts           ← Agent 注册表（纯逻辑，但语义上属平台层）
│   └── sddu-agents.ts        ← Agent 集成与 Phase 映射
├── commands/                 ← CLI 命令（平台层功能）
│   └── sddu-migrate-schema.ts
├── discovery/                ← 工作流引擎：需求挖掘（核心业务域）
│   ├── workflow-engine.ts    ← 平台无关的纯逻辑
│   ├── coaching-mode.ts
│   ├── state-validator.ts
│   └── types.ts
├── state/                    ← 状态管理引擎（核心业务域）
│   ├── machine.ts            ← 状态机核心（672行）
│   ├── schema-v3.0.0.ts      ← 当前 schema（平台无关）
│   ├── schema-v2.0.0.ts      ← 旧版 schema（迁移参考）
│   ├── tree-scanner.ts / state-loader.ts / ...
│   └── __tests__/
├── templates/                ← 模板目录，职责混合
│   ├── subfeature-templates.ts ← 模板引擎逻辑（核心域）
│   ├── agents/               ← Agent 提示词模板（方法论资产，含 HBS 格式）
│   │   ├── sddu-*.md.hbs     ← 11 个 Agent 定义
│   │   └── output/           ← 阶段产物格式模板（方法论资产）
│   └── config/
│       └── opencode.json.hbs ← 平台配置模板（平台层资产）
└── utils/                    ← 工具函数（全部为纯逻辑，无平台依赖）
    ├── tasks-parser.ts
    ├── subfeature-manager.ts
    ├── readme-generator.ts
    └── dependency-notifier.ts
```

**关键发现**：
- 唯一平台耦合点：`src/index.ts` line 14 — `import { tool } from '@opencode-ai/plugin'`
- 所有其他 46 个源文件：零平台 SDK 依赖
- 测试组织不一致：3 种模式并存（colocated `.test.ts` / `__tests__/` / 根 `tests/`）

### 2.2 目标架构（To-Be）

#### 2.2.1 项目根目录重构

```
<<project-root>>/                      ← 项目根目录：约定文件 + 用户入口 + 功能子目录 —— 层级清晰
│
├── .git/                              ← Git 版本控制元数据 [必须根目录，不变]
├── .gitignore                         ← Git 忽略规则 [不变]
├── .opencode/                         ← OpenCode 运行时目录 [不在修改范围]
├── opencode.json                      ← OpenCode 平台配置 [不在修改范围]
├── .sddu/                             ← SDDU 运行时目录 [不在修改范围]
│
│   ┌─────────────────────────────────────────────────────────────┐
│   │                  仅保留必须根目录的约定文件                    │
│   └─────────────────────────────────────────────────────────────┘
├── package.json                       ← npm 项目清单 [MODIFY: 更新脚本路径]
├── package-lock.json                  ← npm 依赖锁 [不变]
├── tsconfig.json                      ← TypeScript 配置 [MODIFY: 更新 paths]
├── jest.config.ts                     ← Jest 测试配置 [MODIFY: 更新 projects]
├── LICENSE                            ← 开源许可证 [不变]
├── README.md                          ← 项目说明 [不变]
├── CHANGELOG.md                       ← 变更日志 [不变]
│
│   ┌─────────────────────────────────────────────────────────────┐
│   │           用户入口脚本——保留根目录，公开 URL 不变化              │
│   └─────────────────────────────────────────────────────────────┘
├── bootstrap.sh                       ← 用户引导入口 [保留根目录] 理由：curl 公开 URL 不变
├── bootstrap.ps1                      ← 用户引导入口 (Win) [保留根目录]
├── install.sh                         ← 安装入口 [保留根目录] 理由：clone 后直接运行
├── install.ps1                        ← 安装入口 (Win) [保留根目录]
│
│   ┌─────────────────────────────────────────────────────────────┐
│   │                    功能子目录——各司其职                         │
│   └─────────────────────────────────────────────────────────────┘
├── src/                               ← 源码：业务对象架构（详见 2.2.2）
│
├── e2e/                               ← 端到端测试目录（Jest 测试 + Shell 编排脚本统一入口）
│   ├── jest.config.ts                 ← E2E 独立 Jest 配置（不 import src/，不收集覆盖率）
│   ├── *.test.ts                      ← E2E Jest 测试用例
│   └── scripts/                       ← 🟢 Shell 编排脚本（从 scripts/e2e/ 迁入）
│       ├── basic/sddu-e2e.sh          ← 基础 E2E 编排
│       ├── fullstack/sddu-e2e-fullstack.sh ← 全栈 E2E 编排
│       └── README.md
│
├── scripts/                           ← 工具脚本统一收敛（构建/验证/迁移/检查）
│   ├── build-agents.cjs               ← 🟢 Agent 构建脚本 [MOVE from 根目录]
│   ├── test-sddu-functionality.js     ← 🟢 冒烟验证 [MOVE from 根目录]
│   ├── package.cjs                    ← 打包脚本 [已在此]
│   ├── package.test.cjs               ← 打包测试 [已在此]
│   ├── migrate-sdd-to-sddu.sh         ← SDD→SDDU 迁移 [已在此]
│   ├── check-sdd-residue.sh           ← SDD 残留检查 [已在此]
│   ├── sddu-check.sh                  ← SDDU 功能验证 [已在此]
│   └── sddu-validation-report.sh      ← 验证报告生成 [已在此]
│

├── docs/                              ← 项目文档（8 个 md 文件） [不变]
├── examples/                          ← 示例项目 [不变]
│
├── dist/                              ← 构建产物（gitignored） [tsc 输出，结构随 src/ 分层]
└── node_modules/                      ← npm 依赖（gitignored） [不变]
```

**根目录重构原则**：

| 原则 | 说明 |
|------|------|
| **约定文件必须根目录** | `package.json`、`tsconfig.json`、`LICENSE`、`README.md`、`CHANGELOG.md`、`.gitignore` 等工具链约定文件必须在根目录——这是 Node.js/TypeScript/npm/Git 生态的硬约束 |
| **用户入口脚本保留根目录** | `bootstrap.sh`、`install.sh` 是面向终端用户的公开入口——`bootstrap.sh` 的 curl URL (`https://raw.githubusercontent.com/.../main/bootstrap.sh`) 是外部文档和教程中的固定引用，移动会破坏公开链接；`install.sh` 的 `./install.sh` 调用习惯不宜变更 |
| **构建/验证脚本收敛 scripts/** | `build-agents.cjs` 和 `test-sddu-functionality.js` 面向开发者而非终端用户——将它们移入 `scripts/` 统一管理，根目录减少 2 个混杂条目。`package.json` 中的引用路径同步更新（`"build:agents": "node scripts/build-agents.cjs"`） |
| **测试全部统一至 src/__tests__/** | 根目录 `tests/` 整体迁入 `src/__tests__/`，按 `unit/` 和 `integration/` 分型管理（见 ADR-004）。E2E 测试独立为顶层 `e2e/`（Jest 测试 + Shell 编排脚本统一入口：`scripts/e2e/` 迁入 `e2e/scripts/`，消除双 `e2e` 目录冗余），与单元/集成测试物理隔离 |
| **根目录条目从 27 → 20** | 移除 2 个脚本（迁移至 scripts/）+ 移除 `tests/` 功能子目录（单元/集成迁入 `src/__tests__/`，E2E 独立为 `e2e/`），根目录保留约定文件 + 4 个入口脚本 + 5 个功能子目录（src/、e2e/、scripts/、docs/、examples/） |

**脚本路径变更详情**：

| 脚本 | 当前位置 | 目标位置 | package.json 引用变更 |
|------|---------|---------|---------------------|
| `build-agents.cjs` | 根目录 | `scripts/build-agents.cjs` | `"build:agents": "node build-agents.cjs"` → `"node scripts/build-agents.cjs"` |
| `test-sddu-functionality.js` | 根目录 | `scripts/test-sddu-functionality.js` | 无 package.json 引用（独立执行） |

#### 2.2.2 源码目录重构

```
src/
├── index.ts                          ← 公共 API 薄桶导出（不注册任何平台逻辑）

├── pipeline/                         ← 管线定义
│   ├── index.ts                      ← 公共 API 出口（域间唯一 import 入口）
│   ├── workflow-engine.ts            ← 工作流阶段流转引擎
│   ├── coaching-mode.ts              ← 引导式访谈逻辑
│   ├── state-validator.ts            ← 管线状态校验
│   └── types.ts                      ← 管线类型定义

├── state/                            ← 状态追踪
│   ├── index.ts                      ← 公共 API 出口
│   ├── machine.ts                    ← 状态机核心
│   ├── schema-v3.0.0.ts
│   ├── schema-v2.0.0.ts
│   ├── schema-v1.2.5.ts
│   ├── tree-scanner.ts
│   ├── state-loader.ts
│   ├── consistency-checker.ts
│   ├── auto-updater.ts
│   ├── parent-state-manager.ts
│   ├── tree-state-validator.ts
│   ├── migrator.ts
│   ├── migrate-v1-to-v2.ts
│   ├── dependency-checker.ts
│   ├── multi-feature-manager.ts

├── discovery/                        ← 需求挖掘
│   ├── index.ts                      ← 公共 API 出口
│   ├── workflow-engine.ts            ← 发现阶段流程逻辑
│   ├── coaching-mode.ts
│   ├── state-validator.ts
│   ├── types.ts

├── agents/                           ← 智能体注册（方法论层面）
│   ├── index.ts                      ← 公共 API 出口
│   ├── registry.ts                   ← Agent 注册表抽象
│   └── sddu-agents.ts                ← Agent 定义与 Phase 映射

├── templates/                        ← 模板引擎 + 方法论模板资产
│   ├── index.ts                      ← 公共 API 出口（模板引擎）
│   ├── subfeature-templates.ts       ← 模板生成引擎逻辑
│   ├── agents/                       ← Agent 定义模板（11 个 sddu-*.md.hbs）
│   └── outputs/                      ← 阶段产出格式模板（7 个 output/*.md.hbs）

├── adapters/                       ← 平台适配器容器（替代原先独立的 opencode/ 目录，为多平台扩展预留接入点）
│   └── opencode/                     ← OpenCode 平台适配
│       ├── index.ts                  ← 公共 API 出口（适配层对外的唯一入口）
│       ├── plugin.ts                 ← 插件入口（原 index.ts 的平台逻辑）
│       ├── agents/                   ← Agent 注册与集成
│       │   ├── registry.ts
│       │   └── sddu-agents.ts
│       ├── commands/                 ← CLI 命令
│       │   └── sddu-migrate-schema.ts
│       └── templates/               ← 平台配置模板
│           └── opencode.json.hbs

├── shared/                           ← 跨域共享（零平台依赖）
│   ├── index.ts                      ← 公共 API 出口（供顶层 index.ts 薄桶引用）
│   ├── types.ts                      ← 统一类型定义
│   ├── errors.ts                     ← 统一错误定义
│   └── platform-adapter.ts           ← 多平台适配接口契约

└── __tests__/                          ← 统一测试目录（源码级+工程级测试全部集中于此）
    ├── unit/                            ← 单元测试（按业务域分子目录）
    │   ├── pipeline/
    │   ├── state/
    │   ├── discovery/
    │   ├── agents/
    │   ├── templates/
    │   ├── adapters/
    │   │   └── opencode/
    │   └── shared/
    ├── integration/                     ← 集成/兼容性/回归测试（从根 tests/ 迁入）
    │   ├── compatibility/
    │   ├── regression/
    │   └── state/
    ├── fixtures/                        ← 测试固件（从根 tests/ 迁入）
    └── reports/                         ← 测试报告（生成物，从根 tests/ 迁入）

```

### 2.3 依赖方向规则

```
adapters/opencode/  ──import──▶  业务对象：pipeline, state, discovery,
       │                           agents, templates
       │                                    │
       └────────────────────────────────────┴───▶  shared/
              （可引用 shared，不可反向引用 adapters）
```

- **业务对象规则**（pipeline, state, discovery, agents, templates）：只 import Node.js 内置 + `shared/` + 同域/其他业务域模块，**禁止** import `adapters/` 下任何模块，**禁止** import 任何平台 SDK（如 `@opencode-ai/plugin`）
- **shared/ 规则**：零依赖，不 import 任何业务域或 `adapters/` 模块
- **adapters/opencode/ 规则**：可 import `@opencode-ai/plugin`、任意业务对象、`shared/`，**禁止**被业务对象反向引用
- **templates/ 规则**（位于 `src/templates/`）：模板引擎逻辑（`.ts`）遵循业务对象规则、零平台依赖；HBS 模板资产（`.hbs`）不在 TypeScript 编译范围内，由 `build-agents.cjs` 脚本处理

### 2.4 API 边界规则 — 模块公共 API 契约

> 各业务域通过 `index.ts` 明确定义公共 API，域间只通过公共 API 交互（见 ADR-006）

#### 2.4.1 规则总览

| # | 规则 | 说明 |
|---|------|------|
| R-API-01 | **域内自由 import** | 同一业务域内部的文件可以互相 import（不强制通过 index.ts） |
| R-API-02 | **域间仅通过 index.ts** | 业务域之间互相 import 时，**只能** import 对方的 `index.ts`（公共 API 出口），不得直接 import 对方内部文件 |
| R-API-03 | **shared/ 全域可 import** | `src/shared/` 可被所有业务域直接 import（shared 定义跨域类型契约，其每个文件本身即为公共契约） |
| R-API-04 | **adapters/ 单向依赖** | `src/adapters/opencode/` 可以 import 所有业务域（含 shared），反之不可——业务域不得 import adapters |

#### 2.4.2 各域 index.ts 职责

| 域 | index.ts 路径 | 公共 API 内容 |
|----|-------------|-------------|
| `pipeline/` | `src/pipeline/index.ts` | 导出 `workflow-engine.ts`、`coaching-mode.ts`、`state-validator.ts` 的公共接口 + `types.ts` 类型 |
| `state/` | `src/state/index.ts` | 导出 `machine.ts`（状态机）、`schema-v3.0.0.ts`（当前 schema）、`state-loader.ts` 等公共接口 |
| `discovery/` | `src/discovery/index.ts` | 导出 `workflow-engine.ts`、`coaching-mode.ts`、`state-validator.ts` 的公共接口 |
| `agents/` | `src/agents/index.ts` | 导出 `registry.ts`、`sddu-agents.ts` 的公共接口（方法论层面 Agent 定义） |
| `templates/` | `src/templates/index.ts` | 导出 `subfeature-templates.ts` 的公共接口（模板引擎） |
| `adapters/opencode/` | `src/adapters/opencode/index.ts` | 导出 `plugin.ts`（平台入口）——适配层对外的唯一公共 API |
| `shared/` | `src/shared/index.ts` | 导出 `types.ts`、`errors.ts`、`platform-adapter.ts` —— 跨域类型契约 |

#### 2.4.3 依赖方向与 import 路径示意

```
┌─────────────────────────────────────────────────────────────┐
│  adapters/opencode/                                          │
│  ✅ import { ... } from '../../pipeline'      // → index.ts  │
│  ✅ import { ... } from '../../state'         // → index.ts  │
│  ✅ import { ... } from '../../shared/types'  // 直接 import │
│  ✅ import { tool } from '@opencode-ai/plugin' // 平台 SDK   │
│  被 import: ❌ 业务域不能 import adapters/opencode/            │
└──────────┬──────────────────────────────────────────────────┘
           │ 单向依赖 (通过 index.ts)
           ▼
┌─────────────────────────────────────────────────────────────┐
│  业务域 (pipeline / state / discovery / agents / templates)   │
│  ✅ import { ... } from '../state'           // → index.ts  │
│  ✅ import { ... } from '../shared/types'    // 直接 import │
│  ✅ import { ... } from './internal-file'    // 域内随意    │
│  ❌ import { ... } from '../state/machine'   // 禁止越界    │
│  ❌ import { ... } from '../adapters/...'    // 禁止反向    │
└──────────┬──────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│  shared/                                                     │
│  ✅ 零依赖（不 import 任何业务域或 adapters）                    │
│  ✅ 可被所有域直接 import（types / errors / platform-adapter）  │
└─────────────────────────────────────────────────────────────┘
```

#### 2.4.4 示例：合法 vs 非法 import

```typescript
// ✅ 合法：域间通过 index.ts
// src/adapters/opencode/plugin.ts
import { createMachine } from '../../state';          // → state/index.ts
import { executeWorkflow } from '../../pipeline';     // → pipeline/index.ts

// ✅ 合法：域内直接引用
// src/state/machine.ts
import { StateSchema } from './schema-v3.0.0';        // 同域内部文件

// ✅ 合法：shared 直接引用
// src/pipeline/workflow-engine.ts
import { SDDUError } from '../shared/errors';         // shared 文件可直接引用

// ❌ 非法：越界直接引用内部文件
// src/adapters/opencode/plugin.ts
import { createMachine } from '../../state/machine';   // 越过 state/index.ts

// ❌ 非法：业务域反向引用 adapters
// src/state/machine.ts
import { someUtil } from '../adapters/opencode/plugin'; // 违反单向依赖
```

#### 2.4.5 为何 shared/ 不强制通过 index.ts

`shared/` 目录下只有 3 个文件（`types.ts`、`errors.ts`、`platform-adapter.ts`），每个文件本身就是独立的最小公共契约单元。强制通过 `index.ts` 聚合反而增加额外维护层次且无实际价值。但 `shared/` 的 `index.ts` 仍需存在，作为对外统一暴露入口（供 `src/index.ts` 顶层薄桶引用）。

### 2.4 多平台适配接口设计（FR-009 / FR-010）

在 `src/shared/platform-adapter.ts` 定义 SDDU 方法论引擎对宿主平台的依赖契约：

```typescript
/** 工具注册描述符 */
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  handler: (params: Record<string, unknown>) => Promise<unknown>;
}

/** Agent 注册描述符 */
export interface AgentDefinition {
  name: string;
  description: string;
  mode: 'subagent';
  promptSource: string;  // 指向方法论模板的路径（平台适配层负责解析）
}

/** 事件处理器 */
export type EventHandler = (payload: unknown) => void | Promise<void>;

/** 平台资源句柄（文件系统、目录、工作区等平台提供的原语） */
export interface PlatformContext {
  /** 项目根目录的绝对路径 */
  directory: string;
  /** 持久化 KV 存储（平台提供） */
  store: {
    get<T>(key: string): Promise<T | undefined>;
    set<T>(key: string, value: T): Promise<void>;
  };
  /** 平台日志接口 */
  log(level: 'debug' | 'info' | 'warn' | 'error', message: string, meta?: Record<string, unknown>): Promise<void>;
}

/** 多平台适配器接口 —— 任何 LLM 平台实现此接口即可接入 SDDU 方法论引擎 */
export interface PlatformAdapter {
  /** 平台身份 */
  readonly platform: string;

  /** 注册一个工具函数到平台 */
  registerTool(def: ToolDefinition): void;

  /** 注册一个子 Agent 到平台 */
  registerAgent(def: AgentDefinition): void;

  /** 监听平台生命周期事件 */
  onEvent(event: string, handler: EventHandler): void;

  /** 获取平台上下文（文件系统、存储等） */
  getContext(): PlatformContext;
}
```

**设计原则**：
- 契约定义在 `shared/`，作为零依赖的共享契约——它是「SDDU 方法论需要什么」，而非「OpenCode 提供什么」
- 接口描述的是 SDDU 引擎对平台**能力**的需求，不绑定任何具体平台的类型或 API
- 当前只实现 OpenCode 适配，但接口为未来迁移到其他平台预留接入点（新增 `src/adapters/<新平台>/` 并实现 `PlatformAdapter` 即可）

## 3. 方案对比
> 2-3 个可行方案的对比分析

| 维度 | 方案 A：源码分层 + Path Aliases（推荐） | 方案 B：扁平 + Import 规则约束 | 方案 C：完整接口抽象 + 多包 |
|------|:--|:--|:--|
| 描述 | 重组 `src/` 为业务对象架构（pipeline/state/discovery/agents/templates 顶层目录）+ `adapters/` 平台容器 + `shared/` 跨域共享，配合 tsconfig paths 提供分层别名，dist/ 自然保留分层语义 | 保持现有扁平 `src/` 结构不变，通过 ESLint `import/no-restricted-paths` 规则强制执行依赖方向，靠约定和 lint 约束而非目录传达架构意图 | 不仅重组源码，还将业务对象和 shared 抽取为独立 npm 包（`@sddu/core`、`@sddu/shared`），openCode 适配作为独立包消费核心包 |
| 优点 | ① 文件路径即传达架构意图——维护者看目录即知模块平台依赖性 ② 改动集中：仅 import 路径变更，逻辑不动 ③ package.json 单包发布不变，下游升级成本低 ④ 与 spec FR-001~FR-010 全部对齐 ⑤ 构建复杂度增量最小 | ① 零文件移动——无 import 路径变更回归风险 ② 实施速度最快 ③ 无构建配置变更 | ① 最彻底的解耦——核心包可独立发布到 npm ② 符合 LangChain 等框架的分包惯例 ③ 下游可按需安装 |
| 缺点 | ① ~50 个源码文件的 import 路径需逐文件更新 ② 协同开发分支合并冲突风险（EC-004） ③ 需更新构建脚本（build-agents.cjs）模板路径 | ① 架构意图不通过目录传达——不解决 discovery 文档 Q-001 的根本问题 ② 新人仍需通读源码 + lint 配置才能理解架构 ③ 不满足 FR-001 / FR-003 / FR-009 / FR-010 的目录隔离要求 | ① 多包增加构建流水线、版本管理、发布流程复杂度 ② SDDU 目前只适配 openCode 一个平台，多包过早引入 ③ 下游需升级 import 路径到 `@sddu/core`（破坏性变更大于方案 A） |
| 风险 | 中：大量 import 路径变更可能引入隐蔽引用错误（R-002）；团队共识风险（R-003） | 低：实施风险最小，但功能上不满足 spec 的核心需求 | 高：过度设计风险（R-001）——当前单一平台场景不需要包级隔离；多包发布流程复杂，增加维护负担 |
| 工作量 | 中（3-5 人天）：文件移动 + import 更新 + 构建配置 + 测试验证 | 低（1 人天）：lint 规则配置 | 高（8-12 人天）：包拆分 + monorepo 配置 + CI/CD 改造 + 迁移文档 |

## 4. 推荐方案
> 推荐方案及选择理由

**推荐**: **方案 A — 业务对象架构 + adapters/ 平台容器**

**理由**：

1. **根本解决问题**：方案 A 直接回应 discovery 文档 Q-001~Q-007 的全部 7 个问题，文件路径即为架构文档——维护者和新人从目录结构即能理解模块归属和平台依赖关系。

2. **符合 spec 全部功能需求**：FR-001~FR-010 要求的业务域隔离（pipeline/state/discovery/agents/templates vs adapters/opencode/）、Agent 行为与平台注册分离、测试分层执行、多平台适配接口等，方案 A 均有明确的落地路径。

3. **实施风险可控**：当前已有 46/47 源文件为零平台依赖的事实基础，重组只是「将已有的事实用目录结构显式化」——不改变任何模块内部逻辑。配合 tsconfig paths 和内聚的 import 更新脚本，回归风险可通过全量测试套件快速验证。

4. **平台可移植性**：方案 A 使用 `adapters/` 作为平台适配器容器——当前 OpenCode 是唯一实现，位于 `adapters/opencode/`。未来若需适配新平台，只需新增 `adapters/<新平台>/` 目录并实现 `shared/platform-adapter.ts` 中定义的 `PlatformAdapter` 接口，业务对象代码零改动——满足 G-005「平台适配层可被替换」。

5. **构建复杂度最小**：方案 A 保持单包结构——`package.json` 的 `main`、`files`、发布流程几乎不变。方案 C 的多包拆分对于当前「只有一个平台适配」的场景是过度设计。

6. **平衡「超前设计」与「务实」**：用户要求「超前设计，不急但一定要设计好」——方案 A 通过 `adapters/` 容器和 `PlatformAdapter` 接口为未来多平台预留了接入点，但没有引入多包发布的复杂性，在架构前瞻性和实施成本之间取得平衡。

## 5. 文件影响分析
> 所有需要创建/修改/删除的文件

### 5.1 新建文件

#### 5.1.1 根目录级新建

| 操作 | 文件路径 | 说明 |
|:--:|------|------|
| NEW | `scripts/build-agents.cjs` | 🟢 从根目录迁入：Agent 构建脚本统一收敛至 scripts/ |
| NEW | `scripts/test-sddu-functionality.js` | 🟢 从根目录迁入：冒烟验证脚本统一收敛至 scripts/ |
| NEW | `e2e/jest.config.ts` | E2E 测试独立 Jest 配置（不 import src/，不收集覆盖率） |
| NEW | `e2e/*.test.ts` | 端到端测试文件（从原 `tests/e2e/` 迁入） |
| NEW | `src/__tests__/`（按业务域子目录） | 统一源码级测试目录（unit + integration），替代混杂的 colocated + `__tests__/` + `tests/` 多套模式 |

#### 5.1.2 源码级新建

| 操作 | 文件路径 | 说明 |
|:--:|------|------|
| NEW | `src/shared/types.ts` | 从 `src/types.ts` 提取，零依赖的公共类型定义 |
| NEW | `src/shared/errors.ts` | 从 `src/errors.ts` 提取，零依赖的公共错误定义 |
| NEW | `src/shared/platform-adapter.ts` | 多平台适配接口契约（FR-010） |
| NEW | `src/shared/index.ts` | shared/ 公共 API 出口（供顶层 index.ts 薄桶引用） |
| NEW | `src/pipeline/` | 管线定义模块（整体迁入 workflow-engine 等管线核心逻辑） |
| NEW | `src/pipeline/index.ts` | pipeline/ 公共 API 出口（域间唯一 import 入口，见 ADR-006） |
| NEW | `src/discovery/` | 需求挖掘模块（整体迁入） |
| NEW | `src/discovery/index.ts` | discovery/ 公共 API 出口 |
| NEW | `src/state/` | 状态机与 Schema 管理模块（整体迁入） |
| NEW | `src/state/index.ts` | state/ 公共 API 出口 |
| NEW | `src/agents/` | 智能体注册（方法论层面，从旧址重组） |
| NEW | `src/agents/index.ts` | agents/ 公共 API 出口 |
| NEW | `src/templates/subfeature-templates.ts` | 模板引擎逻辑 |
| NEW | `src/templates/index.ts` | templates/ 公共 API 出口 |
| NEW | `src/adapters/opencode/plugin.ts` | 平台插件入口——提取自 `src/index.ts` 的平台注册逻辑 |
| NEW | `src/adapters/opencode/index.ts` | adapters/opencode/ 公共 API 出口 |
| NEW | `src/adapters/opencode/agents/` | Agent 注册与集成（从 src/agents/ 迁入） |
| NEW | `src/adapters/opencode/commands/` | CLI 命令（从 src/commands/ 迁入） |
| NEW | `src/adapters/opencode/templates/opencode.json.hbs` | 平台配置模板（从 src/templates/config/ 迁入） |
| NEW | `src/templates/agents/` | 方法论 Agent 提示词模板（11 个 sddu-*.md.hbs，从 src/templates/agents/ 迁出） |
| NEW | `src/templates/outputs/` | 方法论产出格式模板（7 个 output/*.md.hbs，从 src/templates/agents/output/ 迁出） |

### 5.2 修改文件

#### 5.2.1 根目录级修改

| 操作 | 文件路径 | 说明 |
|:--:|------|------|
| MODIFY | `package.json` | 更新 `build:agents` 脚本路径：`"node build-agents.cjs"` → `"node scripts/build-agents.cjs"`；新增 `"test:e2e"` 脚本指向 `e2e/`；更新 `test` 相关脚本路径；更新 `main`/`exports`（见 ADR-003 subpath exports） |
| MODIFY | `tsconfig.json` | 添加 `paths` 映射（`@pipeline/*`、`@state/*`、`@discovery/*`、`@agents/*`、`@templates/*`、`@opencode/*`、`@shared/*`） |
| MODIFY | `jest.config.ts` | 添加 `projects` 配置支持按域独立执行测试（core / opencode / integration），**只管理 `src/__tests__/`，不包含 `e2e/`**（见 ADR-004） |
| MODIFY | `README.md` | 如有引用根目录脚本路径，同步更新 |

#### 5.2.2 源码级修改

| 操作 | 文件路径 | 说明 |
|:--:|------|------|
| MODIFY | `src/index.ts` | 重构为薄桶导出——从各业务域 re-export 公共 API，移除平台注册逻辑至 `src/adapters/opencode/plugin.ts` |
| MODIFY | `scripts/build-agents.cjs` | 更新模板源路径（如受 src/ 重组影响）；确认 `AGENT_SRC_DIR` 指向正确的新路径 |
| MODIFY | `~50 个 .ts 源文件` | 逐文件更新 import 语句中的相对路径，适配新目录结构 |
| MODIFY | `~25 个 .test.ts 测试文件` | import 路径同步更新 |

### 5.3 删除文件（源文件移动到新位置后删除旧址）

#### 5.3.1 根目录级删除

| 操作 | 文件路径 | 说明 |
|:--:|------|------|
| DELETE | `build-agents.cjs`（根目录旧址） | 已迁至 `scripts/build-agents.cjs` |
| DELETE | `test-sddu-functionality.js`（根目录旧址） | 已迁至 `scripts/test-sddu-functionality.js` |
| DELETE | `tests/`（根目录旧址） | 整体拆迁移入——单元测试 → `src/__tests__/unit/`，集成/兼容性/回归测试 → `src/__tests__/integration/`，E2E 测试 → `e2e/`，fixtures → `src/__tests__/fixtures/` |

#### 5.3.2 源码级删除

| 操作 | 文件路径 | 说明 |
|:--:|------|------|
| DELETE | `src/types.ts`（旧址） | 已迁至 `src/shared/types.ts` |
| DELETE | `src/errors.ts`（旧址） | 已迁至 `src/shared/errors.ts` |
| DELETE | `src/agents/`（旧址） | 已迁至 `src/adapters/opencode/agents/` |
| DELETE | `src/commands/`（旧址） | 已迁至 `src/adapters/opencode/commands/` |
| DELETE | `src/discovery/`（旧址） | 重组至 `src/pipeline/` 和 `src/discovery/` |
| DELETE | `src/state/`（旧址） | 已迁至 `src/state/`（重组） |
| DELETE | `src/utils/`（旧址） | 已分散至各业务域或 `src/shared/` |
| DELETE | `src/templates/subfeature-templates.ts`（旧址） | 已迁至 `src/templates/` |
| DELETE | `src/templates/agents/`（旧址） | 已迁至 `src/templates/agents/`（重组，同在 `src/templates/` 下） |
| DELETE | `src/templates/agents/output/`（旧址） | 已迁至 `src/templates/outputs/`（重组，同在 `src/templates/` 下） |
| DELETE | `src/templates/config/`（旧址） | 已迁至 `src/adapters/opencode/templates/` |
| DELETE | `src/errors.test.ts` | 🟢 co-located 测试 → `src/__tests__/unit/shared/errors.test.ts`（见 ADR-004 集中式测试策略） |
| DELETE | `src/types.test.ts` | 🟢 co-located 测试 → `src/__tests__/unit/shared/types.test.ts` |
| DELETE | `src/utils/dependency-notifier.test.ts` | 🟢 co-located 测试 → `src/__tests__/unit/shared/dependency-notifier.test.ts` |
| DELETE | `src/utils/index.test.ts` | 🟢 co-located 测试 → `src/__tests__/unit/shared/index.test.ts` |
| DELETE | `src/utils/tasks-parser.test.ts` | 🟢 co-located 测试 → `src/__tests__/unit/shared/tasks-parser.test.ts` |
| DELETE | `src/utils/subfeature-manager.test.ts` | 🟢 co-located 测试 → `src/__tests__/unit/shared/subfeature-manager.test.ts` |
| DELETE | `src/utils/readme-generator.test.ts` | 🟢 co-located 测试 → `src/__tests__/unit/shared/readme-generator.test.ts` |
| DELETE | `src/agents/registry.test.ts` | 🟢 co-located 测试 → `src/__tests__/unit/agents/registry.test.ts` |
| DELETE | `src/templates/subfeature-templates.test.ts` | 🟢 co-located 测试 → `src/__tests__/unit/templates/subfeature-templates.test.ts` |
| DELETE | `src/state/multi-feature-manager.test.ts` | 🟢 co-located 测试 → `src/__tests__/unit/state/multi-feature-manager.test.ts` |
| DELETE | `src/state/tree-scanner.test.ts` | 🟢 co-located 测试 → `src/__tests__/unit/state/tree-scanner.test.ts` |
| DELETE | `src/state/schema-v1.2.5.test.ts` | 🟢 co-located 测试 → `src/__tests__/unit/state/schema-v1.2.5.test.ts` |
| DELETE | `src/state/migrator.test.ts` | 🟢 co-located 测试 → `src/__tests__/unit/state/migrator.test.ts` |
| DELETE | `src/state/tree-state-validator.test.ts` | 🟢 co-located 测试 → `src/__tests__/unit/state/tree-state-validator.test.ts` |
| DELETE | `src/state/schema-v2.0.0.test.ts` | 🟢 co-located 测试 → `src/__tests__/unit/state/schema-v2.0.0.test.ts` |
| DELETE | `src/state/migrate-v1-to-v2.test.ts` | 🟢 co-located 测试 → `src/__tests__/unit/state/migrate-v1-to-v2.test.ts` |
| DELETE | `src/discovery/__tests__/workflow-engine.test.ts` | 🟢 集中式测试 → `src/__tests__/unit/discovery/workflow-engine.test.ts` |
| DELETE | `src/state/__tests__/schema-v3.0.0.test.ts` | 🟢 集中式测试 → `src/__tests__/unit/state/schema-v3.0.0.test.ts` |
| DELETE | `src/state/__tests__/state-loader.test.ts` | 🟢 集中式测试 → `src/__tests__/unit/state/state-loader.test.ts` |
| DELETE | `src/state/__tests__/tree-state-validator.test.ts` | 🟢 集中式测试 → `src/__tests__/unit/state/tree-state-validator.test.ts` |
| DELETE | `src/state/__tests__/consistency-checker.test.ts` | 🟢 集中式测试 → `src/__tests__/unit/state/consistency-checker.test.ts` |
| DELETE | `src/state/__tests__/machine.test.ts` | 🟢 集中式测试 → `src/__tests__/unit/state/machine.test.ts` |

### 5.4 汇总统计

| 类别 | 数量 | 备注 |
|------|:--:|------|
| 根目录级 — 新建文件（迁入 scripts/） | 2 | `build-agents.cjs`、`test-sddu-functionality.js` |
| 根目录级 — 新建目录 | 1 | `e2e/`（从原 `tests/e2e/` 独立，含 `jest.config.ts`） |
| 根目录级 — 新建文件（e2e/ 内） | 1 | `e2e/jest.config.ts` |
| 根目录级 — 删除文件（旧址） | 2 + 1 个目录 | 根目录 `build-agents.cjs`、`test-sddu-functionality.js` 删除，`tests/` 目录整体删除 |
| 根目录级 — 修改文件 | 4 | `package.json`、`tsconfig.json`、`jest.config.ts`、`README.md` |
| 源码级 — 新建目录 | 11 | `pipeline/`、`shared/`、`adapters/opencode/` 等 |
| 源码级 — 新建文件（含接口定义 + index.ts） | 8 | `platform-adapter.ts` + 7 个域级 `index.ts`（pipeline/state/discovery/agents/templates/adapters-opencode/shared），其余为迁入 |
| 源码级 — 新建测试文件（迁入 src/__tests__/） | ~35 | 从 co-located（16 个）+ `__tests__/`（6 个）+ 根 `tests/`（~18 个）集中迁入 |
| 源码级 — 修改文件 | ~80 | 含所有 import 路径变更的源文件和配置文件 |
| 源码级 — 删除文件（旧址） | ~85 | 含 ~50 个源文件旧址 + ~22 个测试文件旧址 + 11 个空目录清理 |
| 根目录条目 | 27 → 20 | 减少 7 个顶层条目（2 个脚本迁移 + `tests/` 拆分为 `src/__tests__/` + `e2e/`） |

## 6. 风险评估
> 识别技术、依赖和时间风险及缓解措施

| 风险 | 概率 | 影响 | 缓解措施 |
|------|:--:|:--:|----------|
| **import 路径断裂**：~50 个源文件的 import 语句更新可能遗漏或写错路径，导致编译失败或运行时错误 | 高 | 高 | ① 编写自动化脚本批量更新 import 路径（基于模块归属映射表）② 重组后立即执行 `tsc --noEmit` 和全量测试套件验证 ③ CI 中启用 `import/no-restricted-paths` 检查依赖方向 |
| **循环依赖**：重组过程中业务对象与 `adapters/opencode/` 之间可能出现循环 import | 中 | 高 | ① plan 阶段定义清晰的依赖方向规则（业务对象 → shared ← adapters）② 在 CI 中通过 `madge` 或 `dpdm` 工具检测循环依赖 ③ 接口层（`shared/platform-adapter.ts`）确保业务对象只依赖共享抽象，不依赖具体实现 |
| **协同分支冲突**：若有并行开发的特性分支，目录重组产生的 import 变更可能与正在开发的分支产生大量冲突（EC-004） | 中 | 中 | ① 建议在团队无活跃特性分支的时间窗口执行重组 ② 提供迁移脚本，供其他分支执行 `rebase` 后自动修复 import ③ 优先合并本 Feature 分支后再继续其他 Feature |
| **模板路径引用断裂**：HBS 模板中可能存在对文件路径的引用（EC-002），重组后需确保不失效 | 中 | 中 | ① 审计所有 `.hbs` 模板中的路径引用（已知 `build-agents.cjs` 中有硬编码路径）② `build-agents.cjs` 同步更新源路径和目标路径 ③ 构建后验证 `dist/templates/agents/` 产物完整 |
| **硬编码路径**：源码中可能有硬编码的目录路径（EC-003），重组后需确保语义不变 | 低 | 中 | ① `grep -r "\.sddu/" src/` 审计全量硬编码路径 ② `grep -r "specs-tree" src/` 审计特性树路径 ③ 确认所有硬编码路径指向 `.sddu/`（不在修改范围），语义不变 |
| **过度抽象**：`PlatformAdapter` 接口如果定义过于泛化或不够准确，未来实际迁移到新平台时可能不适用（R-001） | 中 | 低 | ① 接口基于当前 openCode 实际使用的原语（directory、store、log）设计，不凭空抽象 ② 接口标记为 `@experimental`，在 v4.1+ 中根据实际迁移需求迭代 ③ 接口保持最小化——只覆盖 SDDU 引擎确实需要的平台能力 |
| **测试迁移的 import 调整**：将散落在各业务域的 co-located `*.test.ts`（16 个）、`__tests__/` 子目录（6 个）和根 `tests/`（约 18 个）共计 ~40 个测试文件集中迁移到 `src/__tests__/` 和 `e2e/` 后，测试文件中的源文件导入路径多一层 `../`，需批量更新 | 中 | 低 | ① 配合 tsconfig `paths` 别名（如 `@pipeline/*`）可消除相对路径问题 ② jest 的 `testMatch` 使用 `<rootDir>/src/__tests__/` 绝对前缀，保持与源码结构解耦 ③ 迁移后全量运行 `npm test` 一次性验证所有 import 正确性 ④ co-located 测试迁徙清单已在 §5.3.2 中逐项列明（从 `src/errors.test.ts` 到 `src/state/migrate-v1-to-v2.test.ts`），无遗漏 |

## 7. 生成的 ADR
> 本次规划产出的架构决策记录

| ADR | 标题 | 状态 |
|-----|------|:--:|
| ADR-001 | 业务对象架构 + adapters/ 平台适配器容器 | PROPOSED |
| ADR-002 | 模板分离策略：方法论资产 vs 平台配置 | PROPOSED |
| ADR-003 | 构建配置与模块解析策略 | PROPOSED |
| ADR-004 | 测试组织与分层执行模式 — src/__tests__/ 完全集中式 + e2e/ 独立顶层 | PROPOSED |
| ADR-005 | 项目根目录架构 — 脚本收敛与功能子目录分层 | PROPOSED |
| ADR-006 | 模块公共 API 契约 — 域级 index.ts 与跨域 import 规则 | PROPOSED |

## 8. 产物审查策略
> 供 review 阶段使用的产物清单和审查基准

| 审查产物 | 审查基准 |
|---------|---------|
| `plan.md`（本文档）+ ADR-001~006 | spec.md FR-001~FR-010（架构需求） |
| `scripts/build-agents.cjs` | ADR-005（根目录架构）；包脚本路径一致性 |
| `scripts/test-sddu-functionality.js` | ADR-005（根目录架构） |
| `package.json` scripts 字段 | ADR-005（脚本路径统一）+ ADR-003（subpath exports） |
| `src/pipeline/` 源码 + `index.ts` | spec.md FR-001 / FR-009（零平台依赖；对外能力边界）+ ADR-006（公共 API 契约） |
| `src/state/` 源码 + `index.ts` | spec.md FR-001（零平台依赖）+ ADR-006（公共 API 契约） |
| `src/discovery/` 源码 + `index.ts` | spec.md FR-001（零平台依赖）+ ADR-006（公共 API 契约） |
| `src/agents/` 源码 + `index.ts` | spec.md FR-001（零平台依赖）+ ADR-006（公共 API 契约） |
| `src/templates/` 源码 + `index.ts` | spec.md FR-001（零平台依赖）+ ADR-006（公共 API 契约） |
| `src/shared/` 源码 + `index.ts` | spec.md FR-004（零平台依赖）+ ADR-006（跨域类型契约） |
| `src/adapters/opencode/` 源码 + `index.ts` | spec.md FR-003（单向依赖业务对象）+ ADR-006（公共 API 契约） |
| `src/shared/platform-adapter.ts` | spec.md FR-010（多平台适配接口契约） |
| `src/templates/` 目录（含 HBS 模板资产） | spec.md FR-002 / FR-006（方法论模板与平台模板分离） |
| `jest.config.ts` + `package.json` scripts | spec.md FR-005（三层测试粒度：core / opencode / integration） |
| `e2e/jest.config.ts` + `e2e/*.test.ts` | ADR-004（E2E 独立配置，不 import src/，不收集覆盖率） |
| `tsconfig.json` + `package.json` exports | spec.md FR-007（构建产物保留分层语义） |
| 跨域 import 语句 | ADR-006（域间仅通过 index.ts 交互；业务域不 import adapters） |

## 9. 产物验证策略
> 供 validate 阶段使用的产物清单和验证基准

| 验证产物 | 验证基准 |
|---------|---------|
| `src/pipeline/` 所有模块的 import 语句 | spec.md FR-001：零 `@opencode-ai/plugin` 引用 |
| `src/state/` 所有模块的 import 语句 | spec.md FR-001：零 `@opencode-ai/plugin` 引用 |
| `src/discovery/` 所有模块的 import 语句 | spec.md FR-001：零 `@opencode-ai/plugin` 引用 |
| `src/agents/` 所有模块的 import 语句 | spec.md FR-001：零 `@opencode-ai/plugin` 引用 |
| `src/templates/` 所有模块的 import 语句 | spec.md FR-001：零 `@opencode-ai/plugin` 引用 |
| `src/shared/` 所有模块的 import 语句 | spec.md FR-004：零 `@opencode-ai/plugin` 引用，不依赖业务域或 adapters |
| `npm run build` 构建成功 | spec.md NFR-004：项目可正常构建 |
| `npm pack` 产物可安装和使用 | spec.md NFR-004 / FR-007 |
| `npm test` 全量测试通过率 100% | spec.md NFR-002：无回归 |
| `npm run test:core` 独立通过 | spec.md FR-005："仅核心业务"粒度 |
| `npm run test:opencode` 独立通过 | spec.md FR-005："仅平台适配"粒度 |
| `npm run test:all` 独立通过 | spec.md FR-005："全量"粒度 |
| `npm run test:e2e` 独立通过 | spec.md NFR-001：E2E 场景行为一致，无回归 |
| E2E 验证场景行为一致 | spec.md NFR-001：重组前后功能行为不变 |
| 关键路径耗时对比（重组前 vs 重组后） | spec.md NFR-005：差异 < 5% |
| `madge` / `dpdm` 循环依赖检测 | spec.md EC-001：零循环依赖 |
| 跨域 import 合规性检查 | ADR-006：域间只通过 index.ts 交互——如发现 `adapters/opencode/` 中 `import ... from '../../state/machine'`（越界直接引用内部文件）或业务域中 `import ... from '../adapters/...'`（反向依赖），均视为违规 |

## 修订记录
> 记录本文档的版本变更历史

| 版本 | 变更说明 | 日期 | 修订人 |
|------|---------|------|--------|
| v1.8 | Bug-001 修复 — §2.2.1 To-Be 架构：`e2e/` 下增加 `scripts/` 子目录（Shell 编排脚本从 `scripts/e2e/` 迁入），`scripts/` 移除 `e2e/` 子目录；同步更新 ADR-005 | 2026-06-21 | SDDU Plan Agent |
| v1.7 | 调研修正 — ADR-004 明确完全集中式测试（禁止 co-located .test.ts），§5.3 增加 22 个测试文件旧址删除清单；新增 §2.4 API 边界规则（域级 index.ts 公共 API 契约）与 ADR-006；To-Be 架构图 + §5.1 增加各域 index.ts；更新汇总统计与审查/验证策略 | 2026-06-21 | SDDU Plan Agent |
| v1.6 | E2E 测试独立 — 采用方案 B，E2E 从 `src/__tests__/integration/e2e/` 独立为顶层 `e2e/` 目录（含独立 `jest.config.ts`，不 import src/、不收集覆盖率）；重新统计根目录条目（27→20）；同步更新 ADR-004 / ADR-005 | 2026-06-21 | SDDU Plan Agent |
| v1.5 | 根目录测试统一 — `tests/` 整体迁入 `src/__tests__/`，按 `unit/` / `integration/` 分型；根目录移除独立的 `tests/` 功能子目录；同步更新 ADR-004 / ADR-005 | 2026-06-21 | SDDU Plan Agent |
| v1.4 | 架构分析扩展至项目根目录 — §2.1/§2.2 新增根目录级 As-Is/To-Be 完整结构、§5 新增根目录级文件变更清单、§7 新增 ADR-005（根目录架构决策） | 2026-06-21 | SDDU Plan Agent |
| v1.3 | 测试组织调整 — ADR-004 从 colocated 模式改为 `src/__tests__/` 集中式按业务域分子目录；To-Be 架构图移除各业务域下 `__tests__/` 子目录，新增 `src/__tests__/` 统一测试根 | 2026-06-21 | SDDU Plan Agent |
| v1.2 | 术语调整 — extensions/ → adapters/（语义从"功能扩展"修正为"平台接入"）；模板资产从仓库根 `templates/` 迁入 `src/templates/` | 2026-06-21 | SDDU Plan Agent |
| v1.1 | 架构方案调整 — 从三层容器（core/platforms/shared）改为业务对象架构 + adapters/ 平台适配器容器 | 2026-06-21 | SDDU Plan Agent |
| v1.0 | 初始创建 — 基于 spec.md FR-001~FR-010 完成架构设计，产出 4 个 ADR | 2026-06-21 | SDDU Plan Agent |
