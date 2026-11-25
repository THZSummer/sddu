# Feature Specification: SDD Tools Optimization

## 元数据

| 元数据 | 值 |
|--------|-----|
| **Feature ID** | `sdd-tools-optimization` |
| **Feature 名称** | SDD 工具系统优化 |
| **规范版本** | 2.3.0 |
| **创建日期** | 2026-04-05 |
| **作者** | SDD Team |
| **优先级** | P1 |
| **状态** | specified |
| **相关干系人** | Plugin 开发团队、Agent 用户 |
| **最后更新** | 2026-04-05 (打包优化方案 - dist/sdd/ 和 dist/sdd.zip) |

---

## 1. 上下文

### 1.1 问题描述（基于实际代码）

当前 SDD 插件经过实际开发后，架构已演进为以下形态：

**注意**: Discovery 是可选流程，用户可能直接调用 spec agent。当前 Discovery 完成后缺少状态自动推进（可选功能）。

```
src/
├── index.ts              # 插件入口（176 行）- 集成 Discovery 和 AutoUpdater
├── agents/
│   └── sdd-agents.ts     # Agent 注册（205 行）- 静态硬编码列表
├── commands/
│   └── sdd-migrate-schema.ts  # Schema 迁移命令
├── discovery/            # Discovery 工作流引擎（新增核心功能）
│   ├── workflow-engine.ts    # 7 步需求挖掘流程
│   ├── coaching-mode.ts      # 辅导模式引擎
│   ├── types.ts              # 类型定义
│   └── state-validator.ts    # 状态验证器
├── state/                # 状态管理（核心模块）
│   ├── machine.ts            # 状态机（509 行）
│   ├── schema-v2.0.0.ts      # Schema v2.0.0
│   ├── auto-updater.ts       # 自动更新器（310 行）
│   ├── dependency-checker.ts # 依赖检查器（385 行）
│   └── ...
├── utils/                # 工具函数（分散）
│   ├── tasks-parser.ts       # 解析器（418 行）
│   ├── subfeature-manager.ts # 子 Feature 管理器（321 行）
│   ├── readme-generator.ts   # README 生成器
│   └── dependency-notifier.ts # 依赖通知
└── templates/            # ✅ 模板是源码的一部分，放在 src/ 内
    └── agents/           # Agent prompt 模板
        ├── spec.md
        ├── plan.md
        └── ...
    ├── tasks-parser.ts       # Tasks 解析器（418 行）
    ├── subfeature-manager.ts # 子 Feature 管理器（321 行）
    ├── readme-generator.ts   # README 生成器
    └── dependency-notifier.ts # 依赖通知
```

**实际痛点（经确认）：**

| 痛点 | 具体表现 | 影响 |
|------|----------|------|
| **T-001: 工具函数分散** | `utils/` 中的函数没有统一导出和管理，调用方需要知道具体文件路径 | 维护成本高，新开发者难以发现可用工具 |
| **T-002: Agent 注册静态化** | `agents/sdd-agents.ts` 中的 agents 列表是硬编码数组，添加新 Agent 需要修改核心代码 | 扩展性差，不支持插件化 |
| **T-003: Discovery 集成度低** | Discovery 工作流已实现但与 State Machine 联动不够，缺少状态自动推进 | 用户体验割裂，需要手动切换阶段 |
| **T-004: 类型定义分散** | 类型定义分散在 `state/types.ts`, `discovery/types.ts`, `agents/sdd-agents.ts` 等 | 类型导入路径复杂，可能存在循环依赖风险 |
| **T-005: 错误处理不统一** | 各模块使用不同的错误处理方式（console.error, throw Error, 返回错误对象） | 难以统一处理错误，日志格式不一致 |
| **T-006: Agent 配置分散** | ❌ 用户反馈：Agent 配置放在 `.opencode/agents/` 而非插件目录内，导致配置分散 | 插件不自包含，卸载时遗留配置，不符合插件标准结构 |

### 1.2 与原始 Spec 的差异

| 原始 Spec 计划 | 实际情况 | 调整 |
|----------------|----------|------|
| 创建 `src/tools/` 目录 | ❌ 未创建，功能分散在 agents/, state/, utils/ | ✅ 保留现有目录，增加统一导出层 |
| 重构核心工具到 tools/core | ❌ 未实现 | ✅ 不移动现有代码，增加工具注册层 |
| 实现 Structured Output 工具 | ❌ 未实现 | ⚠️ 标记为后续迭代 |
| 工具注册表 registry.ts | ❌ 未实现 | ✅ 在 agents 和 utils 层分别实现注册机制 |
| 新建安装脚本 | ❌ 不需要 | ✅ install.sh (409 行) 和 install.ps1 (180 行) 已存在 |
| Agent 配置放在 `.opencode/agents/` | ❌ 用户反馈：配置分散，不符合插件标准 | ✅ 改为 `.opencode/plugins/sdd/agents/`，插件自包含 |
| 使用 `*.config.json` 配置文件 | ❌ 用户反馈：增加复杂性，不必要 | ✅ 直接使用 `*.md` prompt 文件 |

### 1.3 业务价值

- **开发效率**: 统一工具导出减少查找时间，新成员快速上手
- **可扩展性**: 动态 Agent 注册支持第三方扩展
- **用户体验**: Discovery 与状态机联动，减少手动操作
- **代码质量**: 统一错误处理和类型定义，减少 Bug
- **插件标准化**: Agent 配置集中在插件目录内，符合 OpenCode 插件标准结构
- **维护性**: 插件自包含，卸载时不留遗留配置，便于版本升级

---

## 2. Goals & Non-Goals

### 2.1 Goals

| ID | 目标 | 验收标准 |
|----|------|----------|
| G-001 | 统一工具函数导出和管理 | 创建 `src/utils/index.ts`，所有工具函数可从统一入口导入 |
| G-002 | 实现动态 Agent 注册机制 | Agent 可通过插件目录内 prompt 文件动态注册，无需修改核心代码 |
| G-003 | 增强 Discovery 与状态机联动 | Discovery 完成后自动推进到 specified 状态，无需手动调用 |
| G-004 | 统一类型定义出口 | 创建 `src/types.ts`，导出所有公共类型，减少循环依赖 |
| G-005 | 统一错误处理机制 | 创建 `src/errors.ts`，所有模块使用统一的错误类型和处理方式 |
| G-006 | Agent 配置集中在插件目录内 | Agent prompt 放在 `.opencode/plugins/sdd/agents/`，不分散到 `.opencode/agents/` |

### 2.2 Non-Goals

| ID | 非目标 | 说明 |
|----|--------|------|
| NG-001 | 大规模目录重构 | 不移动现有模块目录，但不再保持旧导入路径的兼容性 |
| NG-002 | 修改 State Machine 核心逻辑 | 状态机逻辑已稳定，仅增加集成层 |
| NG-003 | 实现 Structured Output 工具 | 标记为后续迭代，本次不涉及 |
| NG-004 | 修改插件生命周期 API | 保持与 OpenCode 插件 API 的兼容性 |
| NG-005 | 修改 Discovery 7 步流程 | 流程已验证有效，仅增强集成 |
| NG-006 | 使用 `*.config.json` 配置文件 | ❌ 已废弃 - 直接使用 `*.md` prompt 文件 |
| NG-007 | 分散的 `.opencode/agents/` 目录 | ❌ 已废弃 - Agent 配置集中在 `.opencode/plugins/sdd/agents/` |

---

## 3. 用户故事

| ID | 角色 | 故事 | 价值 |
|----|------|------|------|
| US-001 | 插件开发者 | 我希望从一个统一入口导入所有工具函数 | 减少查找文件时间，提高开发效率 |
| US-002 | 插件开发者 | 我希望添加新 Agent 时不需要修改核心代码 | 支持插件化扩展，降低维护成本 |
| US-003 | 插件开发者 | 我希望有统一的错误类型可以捕获和处理 | 简化错误处理逻辑，提高代码一致性 |
| US-004 | 用户 | 我希望完成 Discovery 后状态自动更新 | 减少手动操作，流程更流畅 |
| US-005 | 用户 | 我希望看到一致的错误消息格式 | 快速理解问题，减少困惑 |

---

## 4. 功能需求

### 4.1 统一工具函数管理

| FR-ID | 需求 | 验收标准 |
|-------|------|----------|
| FR-001 | 创建 `src/utils/index.ts` 统一导出文件 | 所有 utils 子模块可从 `src/utils` 导入 |
| FR-002 | 导出 tasks-parser 的所有公共函数 | `parseTasksMarkdown`, `computeExecutionOrder`, `detectTaskCircularDependency` 等 |
| FR-003 | 导出 subfeature-manager 的所有公共函数 | `detectFeatureMode`, `createSubFeature`, `scanSubFeatures`, `generateSubFeatureIndex` |
| FR-004 | 导出 readme-generator 和 dependency-notifier | 提供统一的工具函数集合 |
| FR-005 | 提供迁移指南 | 文档说明新旧导入路径的迁移方式 |

### 4.2 动态 Agent 注册

| FR-ID | 需求 | 验收标准 |
|-------|------|----------|
| FR-010 | 实现 Agent 注册表类 | `AgentRegistry` 类支持动态注册和查询 |
| FR-011 | 支持从插件目录加载 Agent | 可从 `.opencode/plugins/sdd/agents/` 目录动态发现 |
| FR-012 | 现有静态注册仍然有效 | 现有 agents 列表仍然有效，但不再作为唯一注册方式 |
| FR-013 | 提供 Agent 元数据接口 | 定义 `AgentMetadata` 接口包含 name, description, mode, promptFile |
| FR-014 | 支持 Agent 分类查询 | 可按阶段（spec/plan/tasks/build/review/validate）过滤 |
| FR-015 | Agent prompt 放在插件目录内 | `src/templates/agents/` 目录包含所有 Agent prompt |
| FR-016 | 安装脚本复制到插件目录 | `.opencode/plugins/sdd/agents/` |
| FR-017 | 插件动态注册 Agent | 插件启动时加载并注册所有 Agent |
| FR-018 | 利用现有安装脚本 | 现有 `install.sh` 和 `install.ps1` 已支持 Agent prompt 复制，无需新建 |
| FR-019 | 扩展安装脚本支持插件目录结构 | 确保安装脚本能正确复制 `src/templates/agents/` 经构建到 `dist/templates/agents/` 再到 `.opencode/plugins/sdd/agents/` |
| FR-020 | 生成 opencode.json | 安装脚本已实现 opencode.json 的生成和智能合并 |
| FR-021 | 支持增量安装 | 已存在的配置文件不覆盖，除非使用 --force 参数 |

### 4.3 Discovery 工作流集成

| FR-ID | 需求 | 验收标准 |
|-------|------|----------|
| FR-026 | Discovery 完成后自动更新状态（可选） | 用户可配置是否在 Discovery 完成后自动推进状态，默认关闭 |
| FR-027 | Discovery 与 AutoUpdater 联动 | Discovery 生成的 `discovery.md` 触发 AutoUpdater 状态推断 |
| FR-028 | 提供 Discovery 状态回调 | 每步完成后可触发可选的回调函数 |
| FR-029 | Discovery 失败时回滚状态 | 如果 Discovery 中断，保持原状态不变 |
| FR-030 | 支持跳过 Discovery 直接调用 Spec | 用户可以直接调用 spec agent，无需先执行 Discovery |

### 4.4 统一类型管理

| FR-ID | 需求 | 验收标准 |
|-------|------|----------|
| FR-031 | 创建 `src/types.ts` 统一类型出口 | 所有公共类型可从 `src/types` 导入 |
| FR-032 | 导出 State 相关类型 | `FeatureStateEnum`, `FeatureState`, `FeatureWithFullHistory` |
| FR-033 | 导出 Discovery 相关类型 | `DiscoveryStep`, `DiscoveryContext`, `CoachingLevel` |
| FR-034 | 导出 Agent 相关类型 | `AgentMetadata`, `AgentIntegrationResult` |
| FR-035 | 导出工具函数类型 | `ParsedTask`, `ParallelGroup`, `SubFeatureMeta` |
| FR-036 | 保持原有类型文件 | 原有 `state/types.ts`, `discovery/types.ts` 仍然存在但 re-export |

### 4.5 统一错误处理

| FR-ID | 需求 | 验收标准 |
|-------|------|----------|
| FR-041 | 创建 `src/errors.ts` 定义错误类型 | 包含 `SddError`, `StateError`, `DiscoveryError`, `ToolError`, `AgentError` |
| FR-042 | 统一错误基类 | 所有错误继承自 `SddError`，包含 code, message, context |
| FR-043 | 模块使用统一错误抛出 | State 模块抛 `StateError`，Discovery 抛 `DiscoveryError` |
| FR-044 | 提供错误处理工具函数 | `handleError()`, `formatErrorMessage()`, `logError()` |
| FR-045 | 统一日志格式 | 所有错误日志使用一致的格式和级别 |

### 4.6 打包优化（第一阶段）

| FR-ID | 需求 | 验收标准 |
|-------|------|----------|
| FR-022 | 创建打包脚本 | 创建 `scripts/package.cjs`，打包 `dist/sdd/` 和 `dist/sdd.zip` |
| FR-023 | 优化目录结构 | `dist/sdd/` 包含完整插件包（含 agents/） |
| FR-024 | 支持 zip 分发 | 生成的 zip 文件可直接用于安装 |
| FR-025 | 安装脚本适配 | 支持从 `dist/sdd/` 复制或解压 `dist/sdd.zip` |

---

## 5. 非功能需求

| NFR-ID | 类型 | 需求 | 验收标准 |
|--------|------|------|----------|
| NFR-001 | 兼容性 | 保持向后兼容 | 现有导入路径仍然有效，但不再保证长期兼容，提供迁移指南 |
| NFR-002 | 类型安全 | 完整 TypeScript 类型 | 无 `any` 类型，严格模式通过 |
| NFR-003 | 性能 | 不增加显著开销 | 启动时间增加 < 50ms |
| NFR-004 | 可维护性 | 代码组织清晰 | 新增文件 < 150 行，函数 < 50 行 |
| NFR-005 | 文档 | 代码注释完整 | 所有公共 API 有 JSDoc 注释 |
| NFR-006 | 测试 | 关键功能有单元测试 | 错误处理和类型导出有测试覆盖 |

---

## 6. 技术设计

### 6.1 目录结构（变更后）

#### 6.1.1 源代码目录（本仓库）

**构建流程**: 源码 (`src/`) → 构建 (`tsc + build-agents.cjs`) → 输出 (`dist/`) → 打包 (`package.cjs`) → 安装 (`install.sh/install.ps1`) → 用户项目 (`.opencode/plugins/sdd/`)

```
sddu/
├── src/
│   ├── index.ts                    # 插件入口（修改：使用统一导出）
│   ├── types.ts                    # 【新建】统一类型出口
│   ├── errors.ts                   # 【新建】统一错误处理
│   ├── agents/
│   │   ├── sdd-agents.ts           # 修改：使用 AgentRegistry
│   │   └── registry.ts             # 【新建】Agent 注册表
│   ├── utils/
│   │   ├── index.ts                # 【新建】统一导出
│   │   ├── tasks-parser.ts         # 保持不变
│   │   ├── subfeature-manager.ts   # 保持不变
│   │   ├── readme-generator.ts     # 保持不变
│   │   └── dependency-notifier.ts  # 保持不变
│   ├── discovery/
│   │   ├── workflow-engine.ts      # 修改：增加状态联动
│   │   ├── coaching-mode.ts        # 保持不变
│   │   ├── types.ts                # 保持不变（re-export from src/types）
│   │   └── state-validator.ts      # 保持不变
│   ├── state/
│   │   ├── machine.ts              # 保持不变
│   │   ├── schema-v2.0.0.ts        # 保持不变
│   │   ├── auto-updater.ts         # 保持不变
│   │   └── dependency-checker.ts   # 保持不变
│   ├── commands/
│   │   └── sdd-migrate-schema.ts   # 保持不变
│   └── templates/                  # ✅ 模板是源码的一部分，放在 src/ 内
│       └── agents/                 # Agent prompt 模板源码
│           ├── sdd.md              # SDD 智能入口 Agent
│           ├── spec.md             # 规范编写 Agent (阶段 1/6)
│           ├── plan.md             # 技术规划 Agent (阶段 2/6)
│           ├── tasks.md            # 任务拆分 Agent (阶段 3/6)
│           ├── build.md            # 实现构建 Agent (阶段 4/6)
│           ├── review.md           # 代码审查 Agent (阶段 5/6)
│           ├── validate.md         # 验证测试 Agent (阶段 6/6)
│           ├── roadmap.md          # 路线图规划 Agent
│           ├── docs.md             # 文档生成 Agent
│           └── help.md             # 帮助查询 Agent
├── scripts/
│   ├── build-agents.cjs            # 【已存在】Agents 构建脚本
│   └── package.cjs                 # 【新建】打包脚本
├── install.sh                      # 【已存在】安装脚本 (409 行，Linux/macOS)
├── install.ps1                     # 【已存在】安装脚本 (180 行，Windows)
└── package.json
```

**重要说明**:
- ✅ `src/templates/agents/` 包含所有 Agent prompt 模板（`.md` 文件）
- ✅ 模板文件属于源码，放在 `src/` 内
- ✅ 构建时 `.md` 文件直接复制到 `dist/templates/agents/`（不需要编译）
- ✅ 安装时从 `dist/templates/agents/` 复制到 `.opencode/plugins/sdd/agents/`
- ❌ 删除 `src/config/agents/` 目录（不再使用 `*.config.json`）
- ✅ Agent prompt 直接使用 Markdown 文件，无需 JSON 配置包装
- ✅ 新增 `sdd.md` 智能入口 Agent prompt

#### 6.1.2 构建输出目录（dist/）

**构建流程**: 
1. `tsc` 编译 TypeScript 到 `dist/`
2. `build-agents.cjs` 构建 agents
3. `package.cjs` 打包到 `dist/sdd/` 和 `dist/sdd.zip`

```
dist/
├── index.js                        # 编译后的插件入口
├── agents/                         # 编译后的 agents
├── commands/                       # 编译后的 commands
├── discovery/                      # 编译后的 discovery
├── state/                          # 编译后的 state
├── utils/                          # 编译后的 utils
├── templates/
│   └── agents/                     # Agent prompt 模板（从 src/ 复制）
│       ├── sdd.md
│       ├── spec.md
│       └── ...
├── package.json                    # 从根目录复制
├── sdd/                            # 【新建】完整插件包（由 package.cjs 生成）
│   ├── index.js
│   ├── agents/
│   ├── commands/
│   ├── discovery/
│   ├── state/
│   ├── utils/
│   ├── agents/                     # Agent prompt（从 templates/agents/ 复制）
│   │   ├── sdd.md
│   │   ├── spec.md
│   │   └── ...
│   └── package.json
└── sdd.zip                         # 【新建】压缩插件包（由 package.cjs 生成）
```

**重要说明**:
- ✅ `dist/sdd/` 包含完整的插件包，可直接复制到 `.opencode/plugins/sdd/`
- ✅ `dist/sdd.zip` 便于 npm 发布或 GitHub Release 分发
- ✅ 打包脚本确保目录结构原子性和完整性

#### 6.1.3 安装后目录（用户项目）

**安装流程**: 从 `dist/` 复制完整插件到 `.opencode/plugins/sdd/`，包括：
- `dist/*.js` → `.opencode/plugins/sdd/*.js`（编译后的代码）
- `dist/templates/agents/` → `.opencode/plugins/sdd/agents/`（Agent prompt）

```
用户项目/
├── .opencode/
│   ├── opencode.json               # 由安装脚本生成（如果不存在）
│   └── plugins/
│       └── sdd/                    # SDD 插件目录
│           ├── index.js            # 插件入口（从 dist/ 复制）
│           ├── package.json        # 从 dist/ 复制
│           ├── agents/             # ✅ 从 dist/templates/agents/ 复制
│           │   ├── sdd.md          # SDD 智能入口 Agent
│           │   ├── spec.md         # 规范编写 Agent (阶段 1/6)
│           │   ├── plan.md         # 技术规划 Agent (阶段 2/6)
│           │   ├── tasks.md        # 任务拆分 Agent (阶段 3/6)
│           │   ├── build.md        # 实现构建 Agent (阶段 4/6)
│           │   ├── review.md       # 代码审查 Agent (阶段 5/6)
│           │   ├── validate.md     # 验证测试 Agent (阶段 6/6)
│           │   ├── roadmap.md      # 路线图规划 Agent
│           │   ├── docs.md         # 文档生成 Agent
│           │   └── help.md         # 帮助查询 Agent
│           └── dist/               # 编译后的代码
├── .sdd/
│   └── ...
└── node_modules/
    └── @sddu/sddu/                 # npm 包（如果通过 npm 安装）
```

**优势**:
- ✅ Agent 定义集中在插件目录内，便于管理
- ✅ 不需要分散的 `.opencode/agents/` 目录
- ✅ 插件自包含，便于分发和卸载
- ✅ 符合 OpenCode 插件标准结构

**重要说明**:
- `.opencode/plugins/sdd/agents/` 是 Agent prompt 的唯一位置
- ❌ 不再使用 `.opencode/agents/` 目录
- ❌ 不再使用 `*.config.json` 配置文件
- ✅ 模板是源码：`src/templates/agents/` → 构建 → `dist/templates/agents/` → 安装 → `.opencode/plugins/sdd/agents/`
- 安装脚本 (`install.sh` / `install.ps1`) 负责将 `dist/` 完整复制到 `.opencode/plugins/sdd/`
- `opencode.json` 由安装脚本在首次安装时生成
- **安装脚本已存在**: `install.sh` (409 行，Linux/macOS) 和 `install.ps1` (180 行，Windows)

#### 6.1.4 Agent Prompt 文件格式

每个 Agent prompt 文件 (`*.md`) 遵循以下格式:

```markdown
# SDD Spec Agent

你是 SDD 规范编写专家，通过引导式访谈帮助用户创建完整、可测试的 Feature Specification。

## 工作流程
1. 元数据收集
2. 上下文理解
3. 目标与非目标
4. 用户故事
5. 功能需求
6. 非功能需求
7. 技术设计
8. 边界情况
9. 开放问题

## 输出格式
规范完成后生成 `.sdd/specs-tree-root/[feature]/spec.md`
```

| 文件 | 说明 | 对应阶段 |
|------|------|----------|
| `sdd.md` | SDD 智能入口 Agent - 自动路由到正确阶段 | 工具类 |
| `spec.md` | 规范编写 Agent | 阶段 1/6 |
| `plan.md` | 技术规划 Agent | 阶段 2/6 |
| `tasks.md` | 任务拆分 Agent | 阶段 3/6 |
| `build.md` | 实现构建 Agent | 阶段 4/6 |
| `review.md` | 代码审查 Agent | 阶段 5/6 |
| `validate.md` | 验证测试 Agent | 阶段 6/6 |
| `roadmap.md` | 路线图 Agent | 工具类 |
| `docs.md` | 文档生成 Agent | 工具类 |
| `help.md` | 帮助查询 Agent | 工具类 |

**Prompt 文件部署流程**:
- 源码位置：`src/templates/agents/*.md`（模板是源码的一部分）
- 构建输出：`dist/templates/agents/*.md`（`.md` 文件直接复制，不需要编译）
- 安装后位置：`.opencode/plugins/sdd/agents/*.md`（从 `dist/templates/agents/` 复制）
- 复制工具：现有 `install.sh` 和 `install.ps1` 脚本（复制整个 `dist/` 目录）

### 6.2 统一类型导出 (`src/types.ts`)

```typescript
// ============================================
// State Types (re-export from state/machine)
// ============================================
export type {
  FeatureStateEnum,
  FeatureState,
  FeatureWithFullHistory,
  AgentWorkflowStateEnum,
  SddPhase,
  TransitionResult,
  AgentTransitionHook,
  AutoUpdaterIntegration
} from './state/machine';

export type {
  StateV2_0_0,
  WorkflowStatus,
  PhaseHistory
} from './state/schema-v2.0.0';

// ============================================
// Discovery Types
// ============================================
export type {
  DiscoveryStep,
  DiscoveryContext,
  DiscoveryProgress,
  DiscoveryResult,
  StepExecutionResult
} from './discovery/types';

export type {
  CoachingLevel,
  CoachingConfig
} from './discovery/types';

// ============================================
// Agent Types
// ============================================
export type {
  AgentIntegrationResult
} from './agents/sdd-agents';

export interface AgentMetadata {
  name: string;
  description: string;
  mode: 'subagent' | 'tool';
  promptFile: string;
  category?: 'spec' | 'plan' | 'tasks' | 'build' | 'review' | 'validate' | 'utility';
}

// ============================================
// Utility Types
// ============================================
export type {
  ParsedTask,
  ParallelGroup,
  ExecutionWave
} from './utils/tasks-parser';

export type {
  SubFeatureMeta
} from './utils/subfeature-manager';
```

### 6.3 统一错误处理 (`src/errors.ts`)

```typescript
// 错误码枚举
export enum ErrorCode {
  // State Errors (1000-1999)
  STATE_NOT_FOUND = 'STATE_1001',
  STATE_INVALID_TRANSITION = 'STATE_1002',
  STATE_FILE_MISSING = 'STATE_1003',
  STATE_DEPENDENCY_BLOCKED = 'STATE_1004',
  
  // Discovery Errors (2000-2999)
  DISCOVERY_STEP_FAILED = 'DISCOVERY_2001',
  DISCOVERY_TIMEOUT = 'DISCOVERY_2002',
  DISCOVERY_INVALID_CONTEXT = 'DISCOVERY_2003',
  
  // Tool Errors (3000-3999)
  TOOL_NOT_FOUND = 'TOOL_3001',
  TOOL_EXECUTION_FAILED = 'TOOL_3002',
  TOOL_VALIDATION_ERROR = 'TOOL_3003',
  
  // Agent Errors (4000-4999)
  AGENT_NOT_FOUND = 'AGENT_4001',
  AGENT_REGISTRATION_FAILED = 'AGENT_4002',
  AGENT_EXECUTION_FAILED = 'AGENT_4004',
  
  // General Errors (5000-5999)
  FILE_NOT_FOUND = 'FILE_5001',
  INVALID_ARGUMENT = 'ARGUMENT_5002',
  INTERNAL_ERROR = 'INTERNAL_5003'
}

// 错误上下文接口
export interface ErrorContext {
  featureId?: string;
  filePath?: string;
  agentName?: string;
  stepId?: string;
  [key: string]: unknown;
}

// 统一错误基类
export class SddError extends Error {
  constructor(
    message: string,
    public readonly code: ErrorCode,
    public readonly context?: ErrorContext,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'SddError';
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      context: this.context,
      cause: this.cause?.message
    };
  }
}

// State 错误
export class StateError extends SddError {
  constructor(message: string, code: ErrorCode, context?: ErrorContext, cause?: Error) {
    super(message, code, context, cause);
    this.name = 'StateError';
  }
}

// Discovery 错误
export class DiscoveryError extends SddError {
  constructor(message: string, code: ErrorCode, context?: ErrorContext, cause?: Error) {
    super(message, code, context, cause);
    this.name = 'DiscoveryError';
  }
}

// Tool 错误
export class ToolError extends SddError {
  constructor(message: string, code: ErrorCode, context?: ErrorContext, cause?: Error) {
    super(message, code, context, cause);
    this.name = 'ToolError';
  }
}

// Agent 错误
export class AgentError extends SddError {
  constructor(message: string, code: ErrorCode, context?: ErrorContext, cause?: Error) {
    super(message, code, context, cause);
    this.name = 'AgentError';
  }
}

// 错误处理工具函数
export function handleError(error: unknown, context?: ErrorContext): SddError {
  if (error instanceof SddError) {
    return error;
  }
  
  if (error instanceof Error) {
    return new SddError(
      error.message,
      ErrorCode.INTERNAL_ERROR,
      context,
      error
    );
  }
  
  return new SddError(
    String(error),
    ErrorCode.INTERNAL_ERROR,
    context
  );
}

export function formatErrorMessage(error: SddError): string {
  return `[${error.code}] ${error.name}: ${error.message}`;
}
```

### 6.4 统一工具导出 (`src/utils/index.ts`)

```typescript
// ============================================
// Tasks Parser
// ============================================
export {
  parseTasksMarkdown,
  parseParallelGroups,
  computeExecutionOrder,
  detectTaskCircularDependency,
  getReadyTasks,
  areDependenciesSatisfied,
  parseTask
} from './tasks-parser';

export type {
  ParsedTask,
  ParallelGroup,
  ExecutionWave
} from './tasks-parser';

// ============================================
// SubFeature Manager
// ============================================
export {
  detectFeatureMode,
  createSubFeature,
  generateSubFeatureIndex,
  scanSubFeatures,
  validateSubFeatureCompleteness
} from './subfeature-manager';

export type {
  SubFeatureMeta
} from './subfeature-manager';

// ============================================
// README Generator
// ============================================
export {
  generateReadme,
  generateFeatureReadme,
  generateSubFeatureReadme
} from './readme-generator';

// ============================================
// Dependency Notifier
// ============================================
export {
  notifyDependencyChange,
  getDependentFeatures
} from './dependency-notifier';
```

### 6.5 Agent 注册表 (`src/agents/registry.ts`)

```typescript
import type { AgentMetadata } from '../types';

export interface AgentConfig {
  name: string;
  description: string;
  mode: 'subagent' | 'tool';
  promptFile: string;
  category?: 'spec' | 'plan' | 'tasks' | 'build' | 'review' | 'validate' | 'utility';
}

export interface RegisteredAgent extends AgentMetadata {
  registeredAt: string;
  source: 'static' | 'dynamic';
}

export class AgentRegistry {
  private agents: Map<string, RegisteredAgent> = new Map();

  /**
   * 注册单个 Agent
   */
  register(agent: AgentMetadata, source: 'static' | 'dynamic' = 'static'): void {
    if (this.agents.has(agent.name)) {
      console.warn(`Agent 已存在：${agent.name}，将被覆盖`);
    }

    this.agents.set(agent.name, {
      ...agent,
      registeredAt: new Date().toISOString(),
      source
    });
  }

  /**
   * 批量注册 Agents
   */
  registerMany(agents: AgentMetadata[], source?: 'static' | 'dynamic'): void {
    for (const agent of agents) {
      this.register(agent, source);
    }
  }

  /**
   * 获取单个 Agent
   */
  get(name: string): RegisteredAgent | undefined {
    return this.agents.get(name);
  }

  /**
   * 获取所有 Agents
   */
  getAll(): RegisteredAgent[] {
    return Array.from(this.agents.values());
  }

  /**
   * 按阶段过滤 Agents
   */
  getByCategory(category: AgentMetadata['category']): RegisteredAgent[] {
    if (!category) return this.getAll();
    return this.getAll().filter(agent => agent.category === category);
  }

  /**
   * 检查 Agent 是否存在
   */
  has(name: string): boolean {
    return this.agents.has(name);
  }

  /**
   * 注销 Agent
   */
  unregister(name: string): boolean {
    return this.agents.delete(name);
  }

  /**
   * 清除所有 Agents
   */
  clear(): void {
    this.agents.clear();
  }

    /**
     * 从插件目录动态加载 Agents
     * 
     * 目录来源:
     * - 源码目录：`src/templates/agents/`（开发时）
     * - 构建输出：`dist/templates/agents/`（构建后，.md 文件直接复制）
     * - 用户项目：`.opencode/plugins/sdd/agents/`（安装后，从 dist/ 复制）
     * 
     * 加载方式:
     * 1. 扫描目录下所有 *.md 文件
     * 2. 根据文件名推断 Agent 名称和类别
     * 3. 动态注册到 OpenCode
     */
  async loadFromDirectory(dirPath: string): Promise<number> {
    const fs = await import('fs/promises');
    const path = await import('path');

    let count = 0;

    try {
      const files = await fs.readdir(dirPath);
      const mdFiles = files.filter(f => f.endsWith('.md'));

      for (const file of mdFiles) {
        const agentName = file.replace('.md', '');
        const metadata: AgentMetadata = {
          name: `sdd-${agentName}`,
          description: `SDD ${agentName} Agent`,
          mode: 'subagent',
          promptFile: path.join(dirPath, file),
          category: this.inferCategory(agentName)
        };

        this.register(metadata, 'dynamic');
        count++;
      }
    } catch (error) {
      console.error('加载 Agents 失败:', error);
    }

    return count;
  }

  /**
   * 根据名称推断类别
   */
  private inferCategory(name: string): AgentMetadata['category'] {
    const categoryMap: Record<string, AgentMetadata['category']> = {
      'spec': 'spec',
      '1-spec': 'spec',
      'plan': 'plan',
      '2-plan': 'plan',
      'tasks': 'tasks',
      '3-tasks': 'tasks',
      'build': 'build',
      '4-build': 'build',
      'review': 'review',
      '5-review': 'review',
      'validate': 'validate',
      '6-validate': 'validate',
      'roadmap': 'utility',
      'docs': 'utility',
      'help': 'utility',
      'sdd': 'utility'
    };

    return categoryMap[name] || 'utility';
  }
}

// 单例实例
export const agentRegistry = new AgentRegistry();
```

**关键变更**:
- ❌ 删除 `loadFromConfig()` 方法（不再使用 `*.config.json`）
- ✅ 简化 `loadFromDirectory()` 方法，直接加载 `*.md` 文件
- ✅ 目录路径改为 `.opencode/plugins/sdd/agents/`

### 6.6 Agent 注册修改 (`src/agents/sdd-agents.ts`)

```typescript
// 修改后的核心代码片段
import { agentRegistry } from './registry';

export async function registerAgents(context: any) {
  // 定义静态 Agents（向后兼容，但不再作为唯一注册方式）
  // 注意：promptFile 指向安装后的路径 (.opencode/plugins/sdd/agents/)
  const staticAgents: AgentMetadata[] = [
    {
      name: 'sdd',
      description: 'SDD 工作流智能入口 - 自动路由到正确阶段',
      mode: 'subagent',
      promptFile: '.opencode/plugins/sdd/agents/sdd.md',
      category: 'utility'
    },
    {
      name: 'sdd-spec',
      description: 'SDD 规范编写专家 (阶段 1/6)',
      mode: 'subagent',
      promptFile: '.opencode/plugins/sdd/agents/spec.md',
      category: 'spec'
    },
    {
      name: 'sdd-plan',
      description: 'SDD 技术规划专家 (阶段 2/6)',
      mode: 'subagent',
      promptFile: '.opencode/plugins/sdd/agents/plan.md',
      category: 'plan'
    },
    {
      name: 'sdd-tasks',
      description: 'SDD 任务拆分专家 (阶段 3/6)',
      mode: 'subagent',
      promptFile: '.opencode/plugins/sdd/agents/tasks.md',
      category: 'tasks'
    },
    {
      name: 'sdd-build',
      description: 'SDD 实现构建专家 (阶段 4/6)',
      mode: 'subagent',
      promptFile: '.opencode/plugins/sdd/agents/build.md',
      category: 'build'
    },
    {
      name: 'sdd-review',
      description: 'SDD 代码审查专家 (阶段 5/6)',
      mode: 'subagent',
      promptFile: '.opencode/plugins/sdd/agents/review.md',
      category: 'review'
    },
    {
      name: 'sdd-validate',
      description: 'SDD 验证测试专家 (阶段 6/6)',
      mode: 'subagent',
      promptFile: '.opencode/plugins/sdd/agents/validate.md',
      category: 'validate'
    },
    {
      name: 'sdd-roadmap',
      description: 'SDD 路线图规划工具',
      mode: 'subagent',
      promptFile: '.opencode/plugins/sdd/agents/roadmap.md',
      category: 'utility'
    },
    {
      name: 'sdd-docs',
      description: 'SDD 文档生成工具',
      mode: 'subagent',
      promptFile: '.opencode/plugins/sdd/agents/docs.md',
      category: 'utility'
    },
    {
      name: 'sdd-help',
      description: 'SDD 帮助查询工具',
      mode: 'subagent',
      promptFile: '.opencode/plugins/sdd/agents/help.md',
      category: 'utility'
    }
  ];

  // 注册静态 Agents
  agentRegistry.registerMany(staticAgents, 'static');

  // 动态加载插件目录下的 Agents
  // 这些 prompt 文件来源：src/templates/agents/ → 构建 → dist/templates/agents/ → 安装 → .opencode/plugins/sdd/agents/
  const pluginsDir = path.join(context.directory, '.opencode', 'plugins', 'sdd', 'agents');
  await agentRegistry.loadFromDirectory(pluginsDir);

  return {
    agents: agentRegistry.getAll(),
    updateStateForAgentCall: createUpdateStateFunction()
  };
}
```

**注意**: 
- `promptFile` 路径是相对于用户项目根目录的
- 模板文件是源码的一部分：`src/templates/agents/`
- 构建时 `.md` 文件直接复制到 `dist/templates/agents/`（不需要编译）
- 安装脚本 (`install.sh` / `install.ps1`) 将 `dist/` 完整复制到 `.opencode/plugins/sdd/`
- 动态加载的 Agent prompt 不会覆盖静态定义（静态定义优先级更高）
- ✅ 插件自包含：所有 Agent 定义都在插件目录内，不分散到 `.opencode/agents/`

### 6.8 Discovery 与状态机联动 (`src/discovery/workflow-engine.ts` 修改)

```typescript
// 修改后的 execute 方法，增加状态联动（可选）
import { StateMachine } from '../state/machine';

export interface DiscoveryConfig {
  /** 是否在 Discovery 完成后自动更新状态（默认 false） */
  autoUpdateState?: boolean;
}

export class DiscoveryWorkflowEngine {
  private config: DiscoveryConfig;
  
  constructor(private stateMachine?: StateMachine, config?: DiscoveryConfig) {
    this.coachingModeEngine = new CoachingModeEngine();
    this.config = { autoUpdateState: false, ...config };
  }

  async execute(context: DiscoveryContext): Promise<DiscoveryContext> {
    console.log(`🚀 开始执行 Discovery 工作流：${context.featureName}`);
    
    const totalSteps = DISCOVERY_WORKFLOW.length;
    
    for (let i = context.currentStepIndex; i < totalSteps; i++) {
      // ... 执行步骤逻辑 ...
      
      // 每步完成后的回调
      if (this.onStepComplete) {
        await this.onStepComplete(step, context);
      }
    }
    
    console.log(`🎉 Discovery 工作流执行完成：${context.featureName}`);
    
    // Discovery 完成后自动更新状态（可选，默认关闭）
    if (this.config.autoUpdateState && this.stateMachine && context.featureId) {
      try {
        await this.stateMachine.updateState(
          context.featureId,
          'specified',
          {},
          'discovery-workflow',
          'Discovery 工作流完成，自动生成 discovery.md'
        );
        console.log(`✅ 状态已自动更新为 'specified'`);
      } catch (error) {
        console.warn('状态自动更新失败，需要手动更新:', error);
      }
    }
    
    return context;
  }

  /**
   * 步骤完成回调（可选）
   */
  private onStepComplete?: (step: DiscoveryStep, context: DiscoveryContext) => Promise<void>;

  /**
   * 设置步骤完成回调
   */
  setOnStepComplete(callback: (step: DiscoveryStep, context: DiscoveryContext) => Promise<void>): void {
    this.onStepComplete = callback;
  }
}
```

### 6.9 现有安装脚本说明

项目已提供完整的安装脚本，无需重新实现。

#### 6.9.1 脚本位置
| 脚本 | 平台 | 行数 | 状态 |
|------|------|------|------|
| `install.sh` | Linux/macOS | 409 行 | ✅ 已存在 |
| `install.ps1` | Windows | 180 行 | ✅ 已存在 |

#### 6.9.2 安装流程（复制 dist/ 到 .opencode/plugins/sdd/）

1. **检查源码** (`package.json`)
2. **构建到 dist/** (`tsc` + `build-agents.cjs`)
   - `.ts` 文件编译为 `.js`
   - `src/templates/agents/*.md` 直接复制到 `dist/templates/agents/`
3. **创建 `.opencode/plugins/sdd/` 目录**
4. **复制 dist/ 到 `.opencode/plugins/sdd/`**
   - `dist/*.js` → `.opencode/plugins/sdd/*.js`
   - `dist/templates/agents/` → `.opencode/plugins/sdd/agents/`
5. **版本检测和更新提示**
6. **opencode.json 智能合并**
7. **初始化 `.sdd/` 目录**

#### 6.9.3 Agent Prompt 处理

**构建阶段** (`tsc`):
- ✅ `src/templates/agents/*.md` 直接复制到 `dist/templates/agents/`（不需要编译）

**安装阶段** (`install.sh` / `install.ps1`):
- ✅ 复制 `dist/templates/agents/` 到 `.opencode/plugins/sdd/agents/`
- ✅ 版本检测
- ✅ opencode.json 智能合并
- ✅ 支持 `--force` 参数覆盖已有配置
- ✅ 支持增量安装（已存在文件不覆盖）

**关键路径**:
- 源码：`src/templates/agents/`
- 构建输出：`dist/templates/agents/`
- 安装目标：`.opencode/plugins/sdd/agents/`

#### 6.9.4 使用方式
```bash
# Linux/macOS
./install.sh [项目根目录] [--force]

# Windows PowerShell
.\install.ps1 -ProjectRoot <path> [-Force]
```

#### 6.9.5 npm 集成
`package.json` 中已配置 postinstall 钩子：
```json
{
  "scripts": {
    "postinstall": "node scripts/postinstall.js"
  }
}
```

**注意**: 安装脚本是独立于插件源码的部署工具。构建流程确保 `src/templates/` 的内容被正确复制到 `dist/templates/`，然后安装脚本将整个 `dist/` 复制到 `.opencode/plugins/sdd/`。

### 6.11 打包脚本设计（第一阶段优化）

#### 6.11.1 设计目标

| 目标 | 说明 |
|------|------|
| **简化安装流程** | 安装时只需复制 `dist/sdd/` 或解压 `dist/sdd.zip` |
| **清晰边界** | `dist/sdd/` 包含完整插件包，不含开发文件 |
| **支持分发** | `.zip` 文件便于 npm 发布或 GitHub Release |
| **原子性** | 要么全部安装成功，要么失败 |
| **向后兼容** | 保持现有构建流程，增加打包步骤 |

#### 6.11.2 脚本位置

- `scripts/package.cjs` - 打包脚本（新建）
- 依赖：`fs-extra`, `archiver`（开发依赖）

#### 6.11.3 打包流程

```
1. 清理 dist/sdd/ 目录
2. 复制 dist/* 到 dist/sdd/ (排除 templates/)
3. 复制 dist/templates/agents/ 到 dist/sdd/agents/
4. 复制 package.json 到 dist/sdd/
5. 打包 dist/sdd.zip
```

#### 6.11.4 代码示例

```javascript
// scripts/package.cjs
const fs = require('fs-extra');
const archiver = require('archiver');
const path = require('path');

const DIST_DIR = path.join(__dirname, '..', 'dist');
const SDD_DIR = path.join(DIST_DIR, 'sdd');
const ZIP_FILE = path.join(DIST_DIR, 'sdd.zip');

async function package() {
  // 1. 清理
  await fs.remove(SDD_DIR);
  await fs.mkdirp(SDD_DIR);
  
  // 2. 复制文件（排除 templates/）
  const items = await fs.readdir(DIST_DIR);
  for (const item of items) {
    if (item !== 'templates' && item !== 'sdd') {
      await fs.copy(path.join(DIST_DIR, item), path.join(SDD_DIR, item));
    }
  }
  
  // 3. 复制 agents
  await fs.copy(
    path.join(DIST_DIR, 'templates', 'agents'),
    path.join(SDD_DIR, 'agents')
  );
  
  // 4. 复制 package.json
  await fs.copy(
    path.join(__dirname, '..', 'package.json'),
    path.join(SDD_DIR, 'package.json')
  );
  
  // 5. 打包 zip
  await createZip(SDD_DIR, ZIP_FILE);
  
  console.log('✅ Package complete:', ZIP_FILE);
}

async function createZip(source, dest) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(dest);
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    output.on('close', resolve);
    archive.on('error', reject);
    archive.pipe(output);
    archive.directory(source, 'sdd');
    archive.finalize();
  });
}

package().catch(console.error);
```

#### 6.11.5 package.json 脚本

```json
{
  "scripts": {
    "build": "tsc && node build-agents.cjs",
    "package": "node scripts/package.cjs",
    "install": "bash install.sh",
    "postinstall": "node scripts/postinstall.js"
  },
  "devDependencies": {
    "fs-extra": "^11.0.0",
    "archiver": "^6.0.0"
  }
}
```

### 6.12 安装脚本修改（适配新结构）

#### 6.12.1 修改说明

安装脚本第 4 步（复制文件）修改为支持新结构：

**方案 A: 从 dist/sdd/ 复制（推荐）**

```bash
# 检查 dist/sdd/ 是否存在
if [ -d "$SCRIPT_DIR/dist/sdd" ]; then
    echo "📦 使用打包后的插件包：dist/sdd/"
    cp -r "$SCRIPT_DIR/dist/sdd/"* "$PLUGIN_DEST/"
else
    # 降级：从 dist/ 复制（向后兼容）
    echo "⚠️  未找到打包目录，使用降级模式：dist/"
    cp -r "$SCRIPT_DIR/dist/"* "$PLUGIN_DEST/"
fi
```

**方案 B: 解压 zip（如果存在）**

```bash
# 如果存在 sdd.zip，优先使用 zip 解压
if [ -f "$SCRIPT_DIR/dist/sdd.zip" ]; then
    echo "📦 解压插件包：dist/sdd.zip"
    unzip -o "$SCRIPT_DIR/dist/sdd.zip" -d "$TARGET_DIR/.opencode/plugins/"
fi
```

#### 6.12.2 安装流程（更新后）

1. **检查源码** (`package.json`)
2. **构建到 dist/** (`tsc` + `build-agents.cjs`)
3. **打包到 dist/sdd/** (`package.cjs`)
4. **创建 `.opencode/plugins/sdd/` 目录**
5. **复制/解压 dist/sdd/ 到 `.opencode/plugins/sdd/`**
   - 优先使用 `dist/sdd.zip` 解压
   - 降级使用 `dist/sdd/` 目录复制
   - 最后降级使用 `dist/` 目录复制（向后兼容）
6. **版本检测和更新提示**
7. **opencode.json 智能合并**
8. **初始化 `.sdd/` 目录**

#### 6.12.3 优势

| 优势 | 说明 |
|------|------|
| **简化安装逻辑** | 不需要分别复制多个目录 |
| **清晰边界** | `dist/sdd/` 包含完整插件包 |
| **原子性** | 要么全部安装成功，要么失败 |
| **便于测试** | 可直接测试 `dist/sdd/` 内容 |
| **便于分发** | `.zip` 文件可用于 npm/GitHub Release |

### 6.13 插件入口修改 (`src/index.ts` 修改)

```typescript
// 使用统一类型导出
import type {
  WorkflowStatus,
  PhaseHistory,
  DiscoveryContext,
  CoachingLevel
} from './types';

// 使用统一错误处理
import { SddError, ErrorCode, handleError } from './errors';

// 使用统一工具函数
import {
  parseTasksMarkdown,
  detectFeatureMode,
  generateReadme
} from './utils';

// Agent 注册
import { registerAgents } from './agents/sdd-agents';

// Discovery 工作流引擎与状态机集成
const stateMachine = new StateMachine(directory + '/specs-tree-root');
await stateMachine.load();

const discoveryEngine = new DiscoveryWorkflowEngine(stateMachine); // 传入 stateMachine

// 插件初始化时注册所有 Agents
export const SDDPlugin = async ({ project, client, $, directory, worktree }) => {
  // 注册 Agents（静态 + 动态）
  const { agents, updateStateForAgentCall } = await registerAgents({ directory });
  
  console.log(`✅ 已注册 ${agents.length} 个 SDD Agents`);
  
  // ... 事件监听和工具导出
};
```

**关键变更**:
- ✅ 插件入口负责初始化 Agent 注册
- ✅ 支持静态注册和动态加载两种方式
- ✅ 从 `.opencode/plugins/sdd/agents/` 加载 prompt 文件
- ✅ 注册完成后输出日志确认

---

## 7. 边界情况

| EC-ID | 场景 | 处理方式 |
|-------|------|----------|
| EC-001 | Agent 注册冲突（同名） | 记录警告日志，静态注册优先级高于动态加载 |
| EC-002 | 动态加载 Agent 目录不存在 | 静默跳过，不影响静态 Agent 注册 |
| EC-003 | Discovery 完成但状态更新失败 | 记录警告日志，不阻断流程，用户可手动更新 |
| EC-004 | 类型导入循环依赖 | 使用 `src/types.ts` 作为唯一出口，避免交叉导入 |
| EC-005 | 错误处理中再次抛出错误 | 使用 `handleError()` 统一包装，防止二次异常 |
| EC-006 | utils 工具函数执行超时 | 设置合理超时，返回错误而非挂起 |
| EC-007 | AutoUpdater 与 Discovery 同时触发状态更新 | 使用防抖机制，以最新状态为准 |
| EC-008 | 用户跳过 Discovery 直接调用 Spec | 允许，状态从 drafting 直接到 specified |
| EC-009 | `.opencode/plugins/sdd/agents/` 目录权限问题 | 安装脚本检查并提供 sudo 提示 |
| EC-010 | Agent prompt 文件损坏或格式错误 | 加载时记录错误日志，跳过该 Agent |
| EC-011 | opencode.json 已存在但不是 JSON 格式 | 安装脚本已处理：备份原文件，生成新文件并提示用户 |
| EC-012 | 插件目录结构不完整 | 安装脚本验证目录结构，缺失时自动创建 |

---

## 8. 开放问题

| ID | 问题 | 影响 | 解决建议 |
|----|------|------|----------|
| OP-001 | Agent prompt 格式标准化 | ✅ 已解决 - 直接使用 `*.md` 文件，无需 JSON 配置包装 |
| OP-002 | Structured Output 工具实现 | 需要 JSON Schema 验证支持 | 标记为 Phase 3 功能 |
| OP-003 | 错误日志的存储和查询 | 需要集中式日志管理 | 集成 OpenCode 日志 API |
| OP-004 | 第三方 Agent 插件机制 | 支持外部开发者扩展 | 设计插件加载接口 |
| OP-005 | 类型定义的版本管理 | 类型变更的向后兼容 | 使用语义化版本管理 |
| OP-006 | npm install 自动执行安装脚本 | ✅ 已解决 - package.json 中已配置 postinstall 钩子 |
| OP-007 | Windows 安装支持 | ✅ 已解决 - install.ps1 已提供 (180 行) |
| OP-008 | 插件目录结构标准化 | ✅ 已解决 - 明确 `.opencode/plugins/sdd/` 为标准结构 |
| OP-009 | 打包脚本依赖管理 | 需要添加 `fs-extra` 和 `archiver` | 作为 devDependencies 添加 |
| OP-010 | 后续优化：修改 tsconfig 输出 | 考虑直接输出到 `dist/sdd/` | 标记为第二阶段优化 |
| OP-011 | 后续优化：npm publish 支持 | 支持 npm 发布 | 标记为第二阶段优化 |
| OP-012 | 后续优化：GitHub Actions 自动发布 | 自动构建和发布 | 标记为第二阶段优化 |

---

## 9. 相关文件

| 文件 | 说明 | 状态 |
|------|------|------|
| `.opencode/plugins/sdd/agents/*.md` | Agent prompt 文件（安装后生成） | 新建 |
| `.opencode/opencode.json` | 插件配置文件（安装脚本生成） | 新建 |
| `src/templates/agents/*.md` | Agent prompt 模板源码（模板是源码的一部分） | 新建 |
| `src/templates/agents/sdd.md` | SDD 智能入口 Agent prompt | 新建 |
| `src/types.ts` | 统一类型出口 | 新建 |
| `src/errors.ts` | 统一错误处理 | 新建 |
| `src/utils/index.ts` | 工具函数统一导出 | 新建 |
| `src/agents/registry.ts` | Agent 注册表 | 新建 |
| `src/agents/sdd-agents.ts` | Agent 注册（修改） | 修改 |
| `src/discovery/workflow-engine.ts` | Discovery 引擎（修改） | 修改 |
| `src/index.ts` | 插件入口（修改） | 修改 |
| `scripts/package.cjs` | 【新建】打包脚本 | 新建 |
| `dist/sdd/` | 【新建】完整插件包目录 | 构建生成 |
| `dist/sdd.zip` | 【新建】压缩插件包 | 构建生成 |
| `install.sh` | 安装脚本 (Linux/macOS) | ✅ 已存在 (需修改路径) |
| `install.ps1` | 安装脚本 (Windows) | ✅ 已存在 (需修改路径) |
| `.sdd/specs-tree-root/specs-tree-sdd-tools-optimization/spec.md` | 本文档 | 更新 |

---

## 10. 验收标准汇总

### 10.1 功能验收

- [ ] FR-001 ~ FR-005: 工具函数统一导出，可从 `src/utils` 导入
- [ ] FR-010 ~ FR-021: Agent 注册表实现，支持从 `.opencode/plugins/sdd/agents/` 动态加载 prompt 文件
- [ ] FR-022 ~ FR-025: 打包脚本创建，`dist/sdd/` 和 `dist/sdd.zip` 生成，安装脚本适配
- [ ] FR-026: Discovery 完成后状态自动更新（可选，默认关闭）
- [ ] FR-027 ~ FR-030: Discovery 与 AutoUpdater 联动、回调、回滚、跳过支持
- [ ] FR-031 ~ FR-036: 类型统一导出，无循环依赖
- [ ] FR-041 ~ FR-045: 错误类型定义完整，各模块使用一致

### 10.2 非功能验收

- [ ] NFR-001: 现有导入路径仍然有效，但不再保证长期兼容
- [ ] NFR-002: TypeScript 严格模式编译通过
- [ ] NFR-003: 性能测试启动时间增加 < 50ms
- [ ] NFR-004: 新增文件代码审查通过
- [ ] NFR-005: JSDoc 注释完整
- [ ] NFR-006: 关键功能单元测试通过

### 10.3 架构验收

- [ ] ✅ Agent prompt 集中在 `.opencode/plugins/sdd/agents/` 目录
- [ ] ✅ 不再使用 `.opencode/agents/` 分散目录
- [ ] ✅ 不再使用 `*.config.json` 配置文件
- [ ] ✅ 插件自包含，卸载后不留遗留配置
- [ ] ✅ 符合 OpenCode 插件标准结构

---

## 11. 架构变更总结

### 11.1 关键变更

| 变更前 | 变更后 | 优势 |
|--------|--------|------|
| `.opencode/agents/*.config.json` | `.opencode/plugins/sdd/agents/*.md` | 配置集中，插件自包含 |
| 分散的 `.opencode/agents/` 目录 | 插件目录内的 `agents/` 子目录 | 符合插件标准结构 |
| JSON 配置包装 | 直接使用 Markdown prompt | 简化结构，易于编辑 |
| 模板在根目录 `templates/` | 模板在 `src/templates/`（模板是源码） | 目录结构清晰，构建流程统一 |
| 安装脚本复制到 `.opencode/agents/` | 安装脚本复制 `dist/` 到 `.opencode/plugins/sdd/` | 插件目录完整 |
| 安装时分别复制多个目录 | 安装时复制 `dist/sdd/` 或解压 `dist/sdd.zip` | 简化安装逻辑，原子性保证 |
| 无打包分发格式 | 新增 `dist/sdd.zip` | 便于 npm/GitHub Release 分发 |

### 11.2 用户反馈解决的问题

| 用户问题 | 解决方案 |
|----------|----------|
| "sdd 插件的信息在哪里，没有 plugin 目录吗" | ✅ 明确 `.opencode/plugins/sdd/` 为插件目录 |
| "agents 的定义一定要放到这里吗" | ✅ 改为放到插件目录内，不分散 |
| "在 sdd plugin 目录动态注册可不可行" | ✅ 采用此方案，插件启动时动态注册 |
| "可考虑优化打包脚本，dist/sdd 目录放 sdd 插件的所有信息" | ✅ 第一阶段优化：创建 `scripts/package.cjs` 生成 `dist/sdd/` 和 `dist/sdd.zip` |

### 11.3 迁移指南

**对于已安装的用户**:
1. 运行新版安装脚本会自动迁移到新目录结构
2. 旧的 `.opencode/agents/` 目录会被保留但不再使用
3. 建议手动删除旧目录以避免混淆

**对于开发者**:
1. 更新 `src/templates/agents/` 目录结构（模板从根目录移到 `src/` 内）
2. 构建脚本确保 `src/templates/` 复制到 `dist/templates/`
3. 安装脚本复制 `dist/` 到 `.opencode/plugins/sdd/`
4. 更新测试用例中的路径引用

### 11.4 优化阶段说明

#### 第一阶段：简单优化（本次 spec 范围）
- ✅ 创建 `scripts/package.cjs` 打包脚本
- ✅ 生成 `dist/sdd/` 目录（完整插件包）
- ✅ 生成 `dist/sdd.zip` 文件
- ✅ 修改安装脚本使用新的目录结构
- ✅ 改动最小，向后兼容，快速实现

#### 第二阶段：后续优化（未来考虑）
- ⚠️ 修改 tsconfig 输出到 `dist/sdd/`（需要调整路径引用）
- ⚠️ 添加 npm publish 支持
- ⚠️ 添加 GitHub Actions 自动发布

---

**文档状态**: specified  
**下一步**: 运行 `@sdd-plan sdd-tools-optimization` 开始技术规划

```bash
/tool sdd_update_state {"feature": "sdd-tools-optimization", "state": "specified"}
```
