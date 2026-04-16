# Feature Specification: 树形结构优化 v2 - 问题修复

## 元数据

| 元数据 | 值 |
|--------|-----|
| **Feature ID** | `TSO-V2-001` |
| **Feature 名称** | 树形结构优化 v2 - 问题修复 |
| **规范版本** | 2.1.0 |
| **创建日期** | 2026-04-15 |
| **作者** | SDDU Team |
| **优先级** | P0 |
| **状态** | specified |
| **相关干系人** | 插件开发团队、架构师、开发工程师、测试工程师 |
| **父 Feature** | `specs-tree-root` |
| **依赖 Feature** | `specs-tree-tree-structure-optimization`（v2.4.0） |
| **类型** | 完整叶子（走完整 6 阶段工作流） |

---

## 1. 上下文

### 1.1 问题定义

> 💡 **核心根因**: v2.4.0 实现了树形结构的核心能力，但在 `blog-platform` 全栈 E2E 测试验证中暴露出 **5 个关键遗漏**，导致可靠性、智能化、可验证性不足。

| 问题 ID | 问题描述 | 严重程度 | 影响范围 |
|---------|----------|----------|----------|
| **P-001** | state.json 缺少必填字段（version, depth, phaseHistory, dependencies） | 🔴 P0 | FR-020/024/060/061/062 |
| **P-002** | Discovery 阶段未输出 Feature 拆分建议（前后端分离未触发） | 🟡 P1 | FR-001/005 |
| **P-003** | 无树形嵌套 E2E 测试场景验证 | 🟡 P1 | FR-070~073 |
| **P-004** | 缺少拆分原则文档和树形示例项目 | 🟡 P1 | FR-050/051 |
| **P-005** | 跨子树依赖解析能力未验证 | 🟢 P2 | FR-030~033 |

### 1.2 根因因果链

```
v2.4.0 核心能力已实现（树形嵌套、混合状态、跨子树依赖）
  │
  ├──→ P-001: state.json 字段缺失 ←── State Machine 初始化逻辑不完善（🔴 P0）
  │     │
  │     └──→ 影响: FR-020/024/060/061/062（Schema 完整性）
  │
  ├──→ P-002: 拆分建议未触发 ←── 拆分识别规则不够精确（🟡 P1）
  │     │
  │     └──→ 影响: FR-001/005（Agent 智能化）
  │
  ├──→ P-003: 缺少树形嵌套测试 ←── 测试项目结构单一（🟡 P1）
  │     │
  │     └──→ 影响: FR-070~073（E2E 覆盖）
  │
  ├──→ P-004: 文档不完整 ←── 交付遗漏（🟡 P1）
  │     │
  │     └──→ 影响: FR-050/051（用户上手成本）
  │
  └──→ P-005: 跨子树依赖未验证 ←── 缺少测试场景（🟢 P2）
        │
        └──→ 影响: FR-030~033（依赖检查可靠性）
```

### 1.3 根因深度分析（5 Whys）

**P-001: 为什么 state.json 缺少必填字段？**
1. Why: State Machine 创建 state 时未强制校验必填字段
2. Why: 初始化逻辑只设置了部分字段（feature, name, status, phase）
3. Why: 开发时假设 Schema 验证会在写入时拦截
4. Why: Schema 验证器只验证 format，不主动填充
5. **根因**: State Machine 初始化逻辑与 Schema 验证器之间存在职责空白

**P-002: 为什么 Discovery 未输出拆分建议？**
1. Why: blog-platform 有前后端分离但未触发拆分
2. Why: 拆分识别规则只检查了"多个独立模块"关键词
3. Why: 规则未覆盖"前端/后端"、"客户端/服务端"等常见拆分模式
4. Why: 规则设计基于假设场景，未基于真实项目特征
5. **根因**: 拆分识别规则缺乏对常见项目模式（前后端分离、多端架构）的覆盖

### 1.4 现有代码约束

基于 v2.4.0 已有实现的约束：

| 模块 | 路径 | 当前行为 | v2 需要变更 |
|------|------|----------|-------------|
| **StateMachine** | `src/state/machine.ts` | 创建 state 时只填充部分字段 | ✅ 强制填充所有必填字段 |
| **TreeStateValidator** | `src/state/tree-state-validator.ts` | 只验证 format，不主动填充 | ✅ 增强为校验 + 自动修复 |
| **Discovery Workflow** | `src/discovery/workflow-engine.ts` | 拆分识别规则有限 | ✅ 扩展前后端分离等模式 |
| **E2E 测试** | `tests/e2e/fixtures/` | 只有单层结构测试 | ✅ 增加多层嵌套测试 |
| **文档** | `docs/`, `examples/` | 缺少拆分原则和示例 | ✅ 补充文档和示例项目 |

### 1.5 与相关 ADR 的关系

| ADR | 决策 | 对本 Feature 的影响 |
|-----|------|---------------------|
| **ADR-001** | 完全分布式存储 | ✅ 每个 Feature 独立 state.json，天然支持树形 |
| **ADR-005** | 7 步工作流固定顺序 | ✅ 本 Feature 为完整叶子，走全部 6 阶段 |
| **ADR-009** | 混合模式依赖检查 | ✅ 增强跨子树依赖验证 |

### 1.6 业务价值

| 价值类型 | 具体描述 | 衡量方式 |
|----------|----------|----------|
| **可靠性** | state.json schema 完整性保证，所有必填字段强制填充 | Schema 验证通过率 100% |
| **智能化** | Discovery 阶段自动识别前后端分离等模式，输出拆分建议 | 拆分建议输出率 ≥ 80% |
| **可验证性** | 树形嵌套 E2E 测试覆盖核心场景 | E2E 测试通过率 100% |
| **易用性** | 拆分原则文档 + 树形示例项目，降低新用户上手成本 | 文档完整度评分 ≥ 4/5 |

---

## 2. Goals & Non-Goals

### 2.1 Goals

| ID | 目标 | 验收标准 |
|----|------|----------|
| G-001 | 修复 State Schema 缺失字段问题 | 新 Feature 创建时 state.json 包含所有必填字段，Schema 验证通过率 100% |
| G-002 | 增强 Schema 验证器，支持自动修复缺失字段 | 缺失字段自动填充并记录警告日志 |
| G-003 | 扩展 Discovery 拆分识别规则 | 能识别前后端分离、多端架构等模式并输出拆分建议 |
| G-004 | 创建树形嵌套 E2E 测试场景 | 多层嵌套测试项目创建并通过所有验证 |
| G-005 | 补充分拆原则文档和树形示例项目 | 文档完整度评分 ≥ 4/5 |
| G-006 | 验证跨子树依赖解析能力 | 跨子树依赖解析正确率 100% |

### 2.2 Non-Goals

| ID | 非目标 | 说明 |
|----|--------|------|
| NG-001 | 修改 v2.4.0 已实现的树形核心能力 | 已通过验证，无需改动 |
| NG-002 | 修改现有 11 个 Feature 的目录结构 | 历史产物保持不变 |
| NG-003 | 状态自动实时汇聚 | 手动扫描即可满足，后续版本 |
| NG-004 | 跨子树依赖自动冲突检测 | 手动管理即可，后续版本 |
| NG-005 | 树形结构可视化 | 非核心能力，后续版本 |

---

## 3. 用户故事

| ID | 角色 | 故事 | 价值 |
|----|------|------|------|
| US-001 | 开发工程师 | 我希望新 Feature 创建时 state.json 包含所有必填字段，不被 Schema 验证阻断 | 减少因字段缺失导致的开发中断 |
| US-002 | 架构师 | 我希望 Discovery 阶段能自动识别前后端分离模式并给出拆分建议 | 自动化拆分决策，降低架构设计成本 |
| US-003 | 测试工程师 | 我希望树形嵌套场景有完整的 E2E 测试覆盖 | 确保核心能力可靠运行 |
| US-004 | 新用户 | 我希望有拆分原则文档和示例项目参考，快速上手树形结构 | 降低学习成本 |
| US-005 | 开发工程师 | 我希望跨子树依赖解析能力被充分验证，使用时有信心 | 提高依赖管理的可靠性 |

---

## 4. 功能需求

### 4.1 State Schema 修复（解决 P-001）

#### FR-101: State Schema 修复（必填字段强制填充）

| 属性 | 内容 |
|------|------|
| **描述** | State Machine 初始化时强制填充所有必填字段，确保新创建的 state.json 满足 v2.1.0 Schema 要求 |
| **触发条件** | 调用 `StateMachine.create()` 创建新 Feature 状态 |
| **输入** | Feature 基本信息：`feature`（路径）、`name`（名称）、`depth`（层级深度） |
| **处理** | 1. 设置 `version` 为固定值 `'v2.1.0'`<br>2. 根据目录层级计算并设置 `depth`（root=0, 第一层子=1, 以此类推）<br>3. 初始化 `phaseHistory` 为包含当前阶段的数组：`[{ phase: 0, status: 'discovered', timestamp: ISO_8601, triggeredBy: 'sddu-discovery-agent' }]`<br>4. 初始化 `dependencies` 为 `{ on: [], blocking: [] }`<br>5. 初始化 `childrens` 为空数组 `[]`<br>6. 初始化 `files` 为最小引用 `{ spec: 'spec.md' }` |
| **输出** | 完整的 state.json 对象，包含所有必填字段 |
| **错误处理** | 如果输入参数缺少必需信息（如 feature 路径），抛出 `InvalidStateInputError` |
| **可测试性** | ✅ 调用 `StateMachine.create()` 后检查返回对象是否包含所有必填字段，且值正确 |

#### FR-102: Schema 验证器增强（创建时验证 v2.1.0 合规性）

| 属性 | 内容 |
|------|------|
| **描述** | 增强 TreeStateValidator，在写入 state.json 前校验必填字段完整性，缺失时自动修复并记录警告 |
| **触发条件** | 调用 `TreeStateValidator.validate(state)` 验证状态对象 |
| **输入** | 待验证的 state 对象 |
| **处理** | 1. 检查 `version` 字段是否存在且为 `'v2.1.0'`，缺失则自动设置<br>2. 检查 `depth` 字段是否存在且为非负整数，缺失则根据 feature 路径计算<br>3. 检查 `phaseHistory` 是否为非空数组，缺失则初始化为当前阶段记录<br>4. 检查 `dependencies` 是否包含 `on` 和 `blocking` 数组，缺失则初始化<br>5. 检查 `files` 是否存在且为对象，缺失则初始化为 `{}`<br>6. 如果任何字段被自动修复，通过日志系统记录 WARNING 级别日志，包含修复的字段名和默认值 |
| **输出** | 验证结果对象：`{ valid: boolean, warnings: string[], autoFixed: string[] }` |
| **错误处理** | 如果 version 格式错误但可修复（如 `'2.1.0'`），自动修正为 `'v2.1.0'`；如果字段类型错误无法自动修复，返回 `valid: false` 并包含错误详情 |
| **可测试性** | ✅ 传入缺失字段的 state 对象，验证验证器是否自动修复并返回正确的 warnings 和 autoFixed 数组 |

#### FR-103: StateLoader.create() 修复（自动填充缺失字段）

| 属性 | 内容 |
|------|------|
| **描述** | 修复 StateLoader.create() 方法，在创建 state.json 文件前自动填充所有缺失的必填字段，确保文件写入合规 |
| **触发条件** | 调用 `StateLoader.create(featurePath, initialState)` 创建新状态文件 |
| **输入** | `featurePath`: Feature 目录路径<br>`initialState`: 初始状态对象（可能缺少部分字段） |
| **处理** | 1. 读取 initialState 对象<br>2. 调用 TreeStateValidator.validate(initialState) 进行校验和自动修复<br>3. 如果验证返回 autoFixed 数组，合并修复后的字段到 initialState<br>4. 生成完整的 state.json 内容（JSON 格式化，2 空格缩进）<br>5. 写入 featurePath/state.json 文件<br>6. 设置 `createdAt` 和 `updatedAt` 为当前 ISO 8601 时间 |
| **输出** | 写入的 state.json 文件路径 |
| **错误处理** | 如果目录不存在，创建目录；如果文件已存在，抛出 `StateAlreadyExistsError`；如果写入失败，抛出 `StateWriteError` |
| **可测试性** | ✅ 创建包含部分字段的 initialState，调用 StateLoader.create() 后读取文件，验证所有必填字段存在 |

### 4.2 Agent 智能增强（解决 P-002）

#### FR-110: Discovery Agent 拆分建议（识别前后端分离/多模块场景）

| 属性 | 内容 |
|------|------|
| **描述** | Discovery 阶段识别前后端分离、多端架构等常见拆分模式，输出拆分建议并等待用户确认 |
| **触发条件** | Discovery Agent 分析用户需求描述时 |
| **输入** | 用户需求描述文本 |
| **处理** | 1. 对用户描述进行关键词匹配和语义分析<br>2. **前后端分离模式**：匹配关键词 "前端/后端"、"client/server"、"web/api"、"UI/service"、"frontend/backend"<br>3. **多端架构模式**：匹配关键词 "iOS/Android"、"移动端/PC端"、"小程序/H5"、"App/Web"<br>4. **多模块模式**：匹配关键词 "管理后台/用户端"、"后台/前台"、"admin/user"<br>5. 识别到拆分模式后，生成拆分建议，包含：子 Feature 命名建议、各子 Feature 职责描述、推荐理由<br>6. 输出拆分建议并等待用户确认（接受/拒绝/自定义） |
| **输出** | 拆分建议对象或空数组（未识别到拆分模式） |
| **错误处理** | 如果关键词匹配存在歧义（同时匹配多个模式），输出所有候选模式供用户选择 |
| **可测试性** | ✅ 输入包含"前端/后端"的描述，验证是否输出拆分建议；输入无拆分特征的描述，验证不输出拆分建议 |

#### FR-111: Spec Agent 拆分确认（用户确认/拒绝拆分）

| 属性 | 内容 |
|------|------|
| **描述** | Spec Agent 处理用户对 Discovery 拆分建议的确认或拒绝，并根据选择生成对应的 Feature 结构 |
| **触发条件** | 用户对 Discovery 拆分建议做出响应后 |
| **输入** | 用户选择：`accept`（接受拆分）、`reject`（拒绝拆分）、`custom`（自定义拆分方案） |
| **处理** | **接受拆分**：<br>1. 生成父级 Feature 目录（轻量化：discovery.md + spec.md + README.md + state.json）<br>2. 在父级 state.json 中记录拆分建议<br>3. 输出子 Feature 创建指引<br><br>**拒绝拆分**：<br>1. 生成单个 Feature 目录（完整叶子：走完整 6 阶段）<br>2. 记录拒绝原因到 discovery.md<br><br>**自定义拆分**：<br>1. 使用用户指定的子 Feature 名称和数量<br>2. 生成父级 + 子 Feature 目录结构 |
| **输出** | 生成的 Feature 目录结构 |
| **错误处理** | 如果用户自定义拆分方案不合法（名称冲突、格式错误），返回错误提示并允许重新输入 |
| **可测试性** | ✅ 分别测试 accept/reject/custom 三种选择，验证生成的目录结构是否符合预期 |

### 4.3 树形嵌套 E2E 测试（解决 P-003）

#### FR-120: 树形嵌套 E2E 测试场景创建（1 父 + 2 子）

| 属性 | 内容 |
|------|------|
| **描述** | 创建多层嵌套测试项目结构，用于验证树形嵌套核心能力 |
| **触发条件** | 运行 E2E 测试初始化脚本时 |
| **输入** | 无（测试 fixture 自动生成） |
| **处理** | 1. 创建测试项目目录结构：<br>```<br>specs-tree-root/<br>├── specs-tree-test-parent/           # 父级（轻量化）<br>│   ├── discovery.md<br>│   ├── spec.md<br>│   ├── README.md<br>│   └── state.json                    # depth=1, childrens=[...]<br>│   ├── specs-tree-test-child-a/      # 子级 A（叶子）<br>│   │   ├── discovery.md<br>│   │   ├── spec.md<br>│   │   ├── state.json                # depth=2<br>│   │   └── ...<br>│   └── specs-tree-test-child-b/      # 子级 B（叶子）<br>│       ├── discovery.md<br>│       ├── spec.md<br>│       ├── state.json                # depth=2<br>│       └── ...<br>└── specs-tree-test-standalone/       # 独立 Feature（叶子）<br>    └── state.json                    # depth=1<br>```<br>2. 为每个节点生成合规的 state.json<br>3. 父级 state.json 的 childrens 数组包含子级信息 |
| **输出** | 完整的测试项目目录结构 |
| **错误处理** | 如果测试目录已存在，先清理旧数据再创建 |
| **可测试性** | ✅ 检查测试项目目录结构是否存在且符合预期，每个 state.json 包含正确的 depth 和 childrens |

#### FR-121: childrens 数组验证

| 属性 | 内容 |
|------|------|
| **描述** | 验证父级 state.json 的 childrens 数组正确填充，包含子级信息（name, status, lastScannedAt） |
| **触发条件** | 运行 E2E 测试中的 childrens 验证用例 |
| **输入** | 父级 state.json 文件路径 |
| **处理** | 1. 读取父级 state.json<br>2. 验证 `childrens` 字段存在且为数组<br>3. 验证数组长度等于直接子 Feature 数量（= 2）<br>4. 验证每个子级条目包含：`name`（目录名）、`status`（工作流状态）、`lastScannedAt`（ISO 8601 时间戳）<br>5. 验证 `name` 字段与子目录名称匹配<br>6. 验证 `status` 字段为有效的工作流状态值 |
| **输出** | 验证结果：通过/失败 + 失败详情 |
| **错误处理** | 如果 childrens 数组长度不匹配或条目字段缺失，返回详细错误信息 |
| **可测试性** | ✅ 运行验证函数，检查返回值是否为通过 |

#### FR-122: depth 字段验证

| 属性 | 内容 |
|------|------|
| **描述** | 验证各层级 state.json 的 depth 字段正确计算（root=0, parent=1, child=2） |
| **触发条件** | 运行 E2E 测试中的 depth 验证用例 |
| **输入** | 测试项目中各层级 state.json 文件路径 |
| **处理** | 1. 读取 root/state.json，验证 `depth === 0`<br>2. 读取 parent/state.json，验证 `depth === 1`<br>3. 读取 child-a/state.json，验证 `depth === 2`<br>4. 读取 child-b/state.json，验证 `depth === 2`<br>5. 读取 standalone/state.json，验证 `depth === 1` |
| **输出** | 验证结果：通过/失败 + 每个节点的 depth 值 |
| **错误处理** | 如果 depth 值与预期不符，返回预期值和实际值的对比 |
| **可测试性** | ✅ 运行验证函数，检查所有节点的 depth 值是否符合预期 |

#### FR-123: 跨子树依赖验证

| 属性 | 内容 |
|------|------|
| **描述** | 创建跨子树依赖场景，验证依赖解析器能正确处理跨子树的依赖引用 |
| **触发条件** | 运行 E2E 测试中的跨子树依赖验证用例 |
| **输入** | 测试项目目录路径 |
| **处理** | 1. 在测试项目中创建跨子树依赖场景：child-a 的 `dependencies.on` 引用 specs-tree-test-standalone 的完整路径<br>2. 运行依赖检查器，验证：<br>   a. 能正确解析跨子树路径 `"specs-tree-test-standalone"`<br>   b. 能找到目标 Feature 的 state.json<br>   c. 能读取目标 Feature 的状态<br>3. 验证循环依赖检测：创建 child-b 依赖 child-a，child-a 依赖 child-b，验证能检测到循环 |
| **输出** | 依赖解析结果和循环依赖检测结果 |
| **错误处理** | 如果依赖目标不存在，标记为"未满足"并返回警告 |
| **可测试性** | ✅ 运行依赖检查，验证能正确解析跨子树路径；创建循环依赖场景，验证能检测到循环 |

### 4.4 文档完善（解决 P-004）

#### FR-130: 拆分原则文档

| 属性 | 内容 |
|------|------|
| **描述** | 创建拆分原则文档（`docs/split-principles.md`），指导用户何时拆分、如何拆分、拆分到什么粒度 |
| **触发条件** | Feature 构建阶段 |
| **输入** | 无（文档编写） |
| **处理** | 1. 创建 `docs/split-principles.md` 文件<br>2. 文档内容必须包含：<br>   a. **拆分时机判断规则**：什么情况下应该拆分（需求包含多个独立模块、前后端分离、多端架构等）<br>   b. **拆分粒度建议**：拆到单一职责、一个 Feature 对应一个用户故事<br>   c. **父子关系定义规则**：什么是父级（聚合型）、什么是叶子（实现型）<br>   d. **常见拆分模式**：前后端分离、多端架构、微服务、管理后台+用户端<br>   e. **拆分示例**：至少 2 个完整的拆分示例 |
| **输出** | `docs/split-principles.md` 文件 |
| **错误处理** | 无 |
| **可测试性** | ✅ 检查文件是否存在，检查是否包含所有章节（拆分时机、粒度、父子关系、常见模式、示例） |

#### FR-131: 树形示例项目

| 属性 | 内容 |
|------|------|
| **描述** | 创建树形示例项目（`examples/tree-structure-demo/`），展示 3 层嵌套、轻量化父级 + 完整叶子的完整示例 |
| **触发条件** | Feature 构建阶段 |
| **输入** | 无（示例项目创建） |
| **处理** | 1. 创建 `examples/tree-structure-demo/` 目录<br>2. 构建 3 层嵌套示例结构：<br>   ```<br>   examples/tree-structure-demo/<br>   ├── specs-tree-ecommerce-platform/        # 父级（depth=0, 轻量化）<br>   │   ├── discovery.md<br>   │   ├── spec.md<br>   │   ├── README.md<br>   │   └── state.json<br>   │   ├── specs-tree-frontend/              # 子级 A（depth=1, 叶子）<br>   │   │   ├── discovery.md<br>   │   │   ├── spec.md<br>   │   │   ├── plan.md<br>   │   │   ├── tasks.md<br>   │   │   ├── build.md<br>   │   │   ├── review.md<br>   │   │   ├── validate.md<br>   │   │   └── state.json<br>   │   └── specs-tree-backend/               # 子级 B（depth=1, 也是父级）<br>   │       ├── discovery.md<br>   │       ├── spec.md<br>   │       ├── README.md<br>   │       └── state.json<br>   │       ├── specs-tree-api/               # 孙级 A（depth=2, 叶子）<br>   │       │   └── ...                       # 完整 6 阶段文档<br>   │       └── specs-tree-database/          # 孙级 B（depth=2, 叶子）<br>   │           └── ...                       # 完整 6 阶段文档<br>   └── README.md                             # 示例项目说明文档<br>   ```<br>3. 每个 state.json 包含正确的 depth、childrens、dependencies 字段<br>4. 演示跨子树依赖：frontend 依赖 api |
| **输出** | `examples/tree-structure-demo/` 目录结构 |
| **错误处理** | 无 |
| **可测试性** | ✅ 检查示例项目目录结构是否符合预期，验证每个 state.json 的 depth 和 childrens 字段正确 |

---

## 5. API 规范

### 5.1 StateLoader API

```typescript
interface StateLoader {
  /**
   * 创建新的 state.json 文件
   * @param featurePath Feature 目录路径
   * @param initialState 初始状态（可能缺少部分字段）
   * @returns 写入的 state.json 文件路径
   */
  create(featurePath: string, initialState: Partial<StateV2_1_0>): Promise<string>;

  /**
   * 读取 state.json 文件
   * @param featurePath Feature 目录路径
   * @returns 解析后的状态对象
   */
  read(featurePath: string): Promise<StateV2_1_0>;

  /**
   * 更新 state.json 文件
   * @param featurePath Feature 目录路径
   * @param updates 要更新的字段
   * @returns 更新后的完整状态对象
   */
  update(featurePath: string, updates: Partial<StateV2_1_0>): Promise<StateV2_1_0>;
}
```

### 5.2 Schema 验证 API

```typescript
interface TreeStateValidator {
  /**
   * 验证状态对象是否符合 v2.1.0 Schema
   * @param state 待验证的状态对象
   * @returns 验证结果，包含是否有效、警告列表、自动修复列表
   */
  validate(state: Partial<StateV2_1_0>): ValidationResult;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  autoFixed: string[];
  state: StateV2_1_0;  // 修复后的完整状态
}
```

---

## 6. 数据模型

### 6.1 State Schema v2.1.0 定义

> **⚠️ 重要**：以下字段在 state.json 创建时必须存在，缺失将触发自动修复。

| 字段 | 必填 | 类型 | 说明 | 默认值 |
|------|------|------|------|--------|
| `feature` | ✅ 必填 | `string` | Feature 唯一标识（相对路径） | - |
| `name` | ⚠️ 可选 | `string` | Feature 显示名称 | `''` |
| `version` | ✅ 必填 | `'v2.1.0'` | Schema 版本号，必须带 'v' 前缀 | `'v2.1.0'` |
| `status` | ✅ 必填 | `WorkflowStatus` | 工作流状态 | `'discovered'` |
| `phase` | ✅ 必填 | `number` | 当前阶段（0-6） | `0` |
| `depth` | ✅ 必填 | `number` | 层级深度（root=0, 第一层子=1, 以此类推） | 根据路径计算 |
| `phaseHistory` | ✅ 必填 | `PhaseHistory[]` | 阶段历史记录数组 | `[{ phase: 0, status: 'discovered', timestamp: ISO_8601, triggeredBy }]` |
| `files` | ✅ 必填 | `FilesMap` | 文件引用对象 | `{ spec: 'spec.md' }` |
| `dependencies` | ✅ 必填 | `Dependencies` | 依赖关系 | `{ on: [], blocking: [] }` |
| `childrens` | ⚠️ 条件必填 | `ChildFeatureInfo[]` | **父级必填**（至少为空数组），叶子可省略 | `[]` |
| `createdAt` | ⚠️ 可选 | `string` | 创建时间（ISO 8601） | 当前时间 |
| `updatedAt` | ⚠️ 可选 | `string` | 更新时间（ISO 8601） | 当前时间 |

### 6.2 JSON Schema 定义

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "SDDU State v2.1.0",
  "description": "树形结构增强版状态 Schema",
  "type": "object",
  "required": ["feature", "version", "status", "phase", "phaseHistory", "files", "dependencies", "depth"],
  "properties": {
    "feature": {
      "type": "string",
      "description": "Feature 唯一标识（相对于 specs-tree-root 的路径）",
      "examples": ["specs-tree-root/specs-tree-user-auth"]
    },
    "name": {
      "type": "string",
      "description": "Feature 显示名称"
    },
    "version": {
      "type": "string",
      "const": "v2.1.0",
      "description": "Schema 版本号，必须为 'v2.1.0'（带 'v' 前缀）"
    },
    "status": {
      "type": "string",
      "enum": ["discovered", "specified", "planned", "tasked", "building", "reviewed", "validated"],
      "description": "工作流状态"
    },
    "phase": {
      "type": "integer",
      "minimum": 0,
      "maximum": 6,
      "description": "当前阶段（0=discovered, 1=specified, ..., 6=validated）"
    },
    "depth": {
      "type": "integer",
      "minimum": 0,
      "description": "层级深度（root=0, 第一层子=1, 以此类推）"
    },
    "phaseHistory": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "required": ["phase", "status", "timestamp", "triggeredBy"],
        "properties": {
          "phase": { "type": "integer", "minimum": 0, "maximum": 6 },
          "status": { "type": "string" },
          "timestamp": { "type": "string", "format": "date-time" },
          "triggeredBy": { "type": "string" }
        }
      }
    },
    "files": {
      "type": "object",
      "required": ["spec"],
      "properties": {
        "discovery": { "type": "string" },
        "spec": { "type": "string" },
        "plan": { "type": "string" },
        "tasks": { "type": "string" },
        "readme": { "type": "string" },
        "review": { "type": "string" },
        "validation": { "type": "string" }
      }
    },
    "dependencies": {
      "type": "object",
      "required": ["on", "blocking"],
      "properties": {
        "on": {
          "type": "array",
          "items": { "type": "string" },
          "description": "当前 Feature 依赖的其他 Feature 路径列表"
        },
        "blocking": {
          "type": "array",
          "items": { "type": "string" },
          "description": "被当前 Feature 阻塞的其他 Feature 路径列表"
        }
      }
    },
    "childrens": {
      "type": "array",
      "description": "子 Feature 简要信息数组（父级使用，叶子节点为空数组或省略）",
      "items": {
        "type": "object",
        "required": ["name", "status"],
        "properties": {
          "name": { "type": "string", "description": "子 Feature 目录名" },
          "status": { "type": "string", "description": "子 Feature 状态" },
          "lastScannedAt": { "type": "string", "format": "date-time", "description": "最后扫描时间" }
        }
      }
    },
    "createdAt": {
      "type": "string",
      "format": "date-time",
      "description": "创建时间（ISO 8601）"
    },
    "updatedAt": {
      "type": "string",
      "format": "date-time",
      "description": "更新时间（ISO 8601）"
    },
    "metadata": {
      "type": "object",
      "description": "扩展元数据"
    },
    "history": {
      "type": "array",
      "description": "操作历史记录"
    }
  },
  "additionalProperties": false
}
```

### 6.3 TypeScript 类型定义

```typescript
export type WorkflowStatus = 
  | 'discovered'
  | 'specified'
  | 'planned'
  | 'tasked'
  | 'building'
  | 'reviewed'
  | 'validated';

export interface PhaseHistory {
  phase: number;
  status: WorkflowStatus;
  timestamp: string; // ISO 8601
  triggeredBy: string;
}

export interface FilesMap {
  discovery?: string;
  spec?: string;
  plan?: string;
  tasks?: string;
  readme?: string;
  review?: string;
  validation?: string;
}

export interface Dependencies {
  on: string[];
  blocking: string[];
}

export interface ChildFeatureInfo {
  name: string;
  status: WorkflowStatus | 'unknown' | 'unreadable';
  lastScannedAt?: string;
  [key: string]: unknown;
}

export interface StateV2_1_0 {
  feature: string;
  name?: string;
  version: 'v2.1.0';
  status: WorkflowStatus;
  phase: number;
  depth: number;
  phaseHistory: PhaseHistory[];
  files: FilesMap;
  dependencies: Dependencies;
  childrens?: ChildFeatureInfo[];
  createdAt?: string;
  updatedAt?: string;
}
```

### 6.3 完整 state.json 示例

#### 父级 state.json

```json
{
  "feature": "specs-tree-root/specs-tree-ecommerce-platform",
  "name": "电商平台",
  "version": "v2.1.0",
  "status": "planned",
  "phase": 2,
  "depth": 0,
  "childrens": [
    {
      "name": "specs-tree-frontend",
      "status": "validated",
      "lastScannedAt": "2026-04-15T10:00:00.000Z"
    },
    {
      "name": "specs-tree-backend",
      "status": "specified",
      "lastScannedAt": "2026-04-15T10:00:00.000Z"
    }
  ],
  "files": {
    "discovery": "discovery.md",
    "spec": "spec.md",
    "readme": "README.md"
  },
  "dependencies": {
    "on": [],
    "blocking": []
  },
  "phaseHistory": [
    {
      "phase": 0,
      "status": "discovered",
      "timestamp": "2026-04-15T00:00:00.000Z",
      "triggeredBy": "sddu-discovery-agent"
    },
    {
      "phase": 1,
      "status": "specified",
      "timestamp": "2026-04-15T01:00:00.000Z",
      "triggeredBy": "sddu-spec-agent"
    },
    {
      "phase": 2,
      "status": "planned",
      "timestamp": "2026-04-15T02:00:00.000Z",
      "triggeredBy": "sddu-plan-agent"
    }
  ],
  "createdAt": "2026-04-15T00:00:00.000Z",
  "updatedAt": "2026-04-15T02:00:00.000Z"
}
```

#### 叶子 state.json

```json
{
  "feature": "specs-tree-root/specs-tree-ecommerce-platform/specs-tree-frontend",
  "name": "前端应用",
  "version": "v2.1.0",
  "status": "validated",
  "phase": 6,
  "depth": 1,
  "childrens": [],
  "files": {
    "discovery": "discovery.md",
    "spec": "spec.md",
    "plan": "plan.md",
    "tasks": "tasks.md",
    "readme": "README.md",
    "review": "review.md",
    "validation": "validate.md"
  },
  "dependencies": {
    "on": [
      "specs-tree-root/specs-tree-ecommerce-platform/specs-tree-backend/specs-tree-api"
    ],
    "blocking": []
  },
  "phaseHistory": [
    { "phase": 0, "status": "discovered", "timestamp": "2026-04-15T00:00:00.000Z", "triggeredBy": "sddu-discovery-agent" },
    { "phase": 1, "status": "specified", "timestamp": "2026-04-15T01:00:00.000Z", "triggeredBy": "sddu-spec-agent" },
    { "phase": 2, "status": "planned", "timestamp": "2026-04-15T02:00:00.000Z", "triggeredBy": "sddu-plan-agent" },
    { "phase": 3, "status": "tasked", "timestamp": "2026-04-15T03:00:00.000Z", "triggeredBy": "sddu-tasks-agent" },
    { "phase": 4, "status": "building", "timestamp": "2026-04-15T04:00:00.000Z", "triggeredBy": "sddu-build-agent" },
    { "phase": 5, "status": "reviewed", "timestamp": "2026-04-15T05:00:00.000Z", "triggeredBy": "sddu-review-agent" },
    { "phase": 6, "status": "validated", "timestamp": "2026-04-15T06:00:00.000Z", "triggeredBy": "sddu-validate-agent" }
  ],
  "createdAt": "2026-04-15T00:00:00.000Z",
  "updatedAt": "2026-04-15T06:00:00.000Z"
}
```

---

## 7. 验收标准

| AC-ID | 描述 | 验证方法 | 通过标准 |
|-------|------|----------|----------|
| **AC-001** | 新 Feature 创建时 state.json 包含所有必填字段 | 创建新 Feature 并检查 state.json | version='v2.1.0', depth≥0, phaseHistory.length≥1, dependencies.on 和 blocking 均为数组 |
| **AC-002** | Schema 验证器能检测并自动修复缺失字段 | 传入缺失字段的 state 对象 | 返回 valid=true，autoFixed 数组包含修复的字段名 |
| **AC-003** | StateLoader.create() 自动填充缺失字段后写入文件 | 调用 create() 后读取文件 | 文件中所有必填字段存在且值正确 |
| **AC-004** | Discovery 能识别前后端分离模式并输出拆分建议 | 输入包含"前端/后端"的描述 | 输出包含子 Feature 命名建议和职责描述 |
| **AC-005** | Discovery 能识别多端架构模式并输出拆分建议 | 输入包含"iOS/Android"的描述 | 输出拆分建议 |
| **AC-006** | Spec Agent 处理用户接受拆分选择 | 用户选择 accept | 生成父级 + 子 Feature 目录结构 |
| **AC-007** | Spec Agent 处理用户拒绝拆分选择 | 用户选择 reject | 生成单个 Feature 目录（完整叶子） |
| **AC-008** | 树形嵌套 E2E 测试项目结构正确 | 检查测试项目目录和 state.json | 1 父 + 2 子结构存在，depth 和 childrens 正确 |
| **AC-009** | 拆分原则文档包含所有章节 | 检查文档内容 | 包含拆分时机、粒度、父子关系、常见模式、示例 |
| **AC-010** | 树形示例项目包含 3 层嵌套 | 检查示例项目目录结构 | 3 层嵌套存在，每个 state.json 的 depth 和 childrens 正确 |
| **AC-011** | 跨子树依赖解析正确，能读取目标 Feature 状态 | 运行跨子树依赖测试 | child-a 能正确解析对 child-b 的依赖路径，依赖检查器能读取 target state.json |
| **AC-012** | 所有必填字段自动填充成功率为 100% | 创建 100 个 Feature 并验证 | 所有 state.json 包含 version/depth/phaseHistory/dependencies 字段 |

---

## 8. 非功能性需求

| NFR-ID | 类型 | 需求 | 验收标准 |
|--------|------|------|----------|
| **NFR-001** | 兼容性 | 不破坏现有 11 个 Feature 的正常运行 | 现有 Feature 目录结构保持不变，功能正常 |
| **NFR-002** | 类型安全 | 完整 TypeScript 类型定义 | 无 `any` 类型，严格模式编译通过 |
| **NFR-003** | 性能 | 自动修复不显著影响创建性能 | 100 次 state.json 创建耗时 < 500ms |
| **NFR-004** | 可维护性 | 代码组织清晰，关键逻辑有注释 | 新增/修改文件有清晰注释 |
| **NFR-005** | 文档 | 公共 API 有 JSDoc 注释 | 所有导出函数和接口有完整注释 |
| **NFR-006** | 测试 | 关键功能有测试覆盖 | State Schema 修复、Schema 验证、拆分识别有单元测试 |
| **NFR-007** | 日志 | 自动修复操作有日志记录 | WARNING 级别日志包含修复的字段名和默认值 |

---

## 9. 边界情况

| EC-ID | 场景 | 处理方式 |
|-------|------|----------|
| **EC-101** | State Machine 创建时未提供 depth | 根据 feature 路径中的 `specs-tree-` 出现次数自动计算 depth |
| **EC-102** | version 格式错误（如 '2.1.0' 缺少 'v'） | 自动修正为 'v2.1.0'，记录 WARNING 日志 |
| **EC-103** | phaseHistory 为空数组但 phase > 0 | 自动填充历史阶段记录，每个阶段的 status 根据 phase 推断 |
| **EC-104** | dependencies.on 中包含不存在的路径 | 依赖检查时标记为"未满足"，返回警告但不阻断 |
| **EC-105** | 拆分建议关键词匹配存在歧义 | 输出所有候选模式供用户选择，不自动决策 |
| **EC-106** | 用户自定义拆分方案名称冲突 | 返回错误提示，要求用户重新输入 |
| **EC-107** | 测试项目目录已存在 | 先清理旧数据再创建新测试项目 |
| **EC-108** | 跨子树循环依赖 | 依赖检查阶段检测并阻止状态变更，返回循环路径 |
| **EC-109** | childrens 数组条目对应的子 Feature 已被手动删除 | 下次扫描时标记为 'unreadable'，不自动移除（保留历史） |
| **EC-110** | state.json 文件写入权限不足 | 返回 `StateWriteError`，包含详细错误信息 |

---

## 10. 开放问题

| ID | 问题 | 影响 | 解决建议 |
|----|------|------|----------|
| **OP-001** | Discovery 拆分识别规则的精确匹配策略 | Agent 拆分建议可能不准确或过度拆分 | 提供用户手动指定能力兜底（FR-111） |
| **OP-002** | 拆分建议触发阈值如何设定 | 阈值过低导致过度拆分，过高导致漏拆 | 初始保守策略（仅匹配明确关键词），后续基于用户反馈调优 |
| **OP-003** | 示例项目是否需要包含完整 6 阶段文档 | 增加示例体积但提升参考价值 | 父级仅包含 discovery/spec/README，叶子包含完整 6 阶段 |

---

## 11. 相关文件

| 文件 | 说明 | 状态 |
|------|------|------|
| `src/state/machine.ts` | 【修改】State Machine 初始化强制填充必填字段 | 修改 |
| `src/state/tree-state-validator.ts` | 【修改】Schema 验证器增强 | 修改 |
| `src/state/loader.ts` | 【修改】StateLoader.create() 自动修复 | 修改 |
| `src/discovery/workflow-engine.ts` | 【修改】拆分识别规则扩展 | 修改 |
| `src/templates/agents/discovery.md` | 【修改】拆分建议输出模板 | 修改 |
| `src/templates/agents/spec.md` | 【修改】拆分确认处理模板 | 修改 |
| `tests/e2e/fixtures/tree-nested/` | 【新建】树形嵌套测试项目 | 新建 |
| `tests/e2e/tree-state-validation.spec.ts` | 【新建】树形状态验证 E2E 测试 | 新建 |
| `docs/split-principles.md` | 【新建】拆分原则文档 | 新建 |
| `examples/tree-structure-demo/` | 【新建】树形示例项目 | 新建 |

---

## 12. 下一步

👉 运行 `@sddu-plan tree-structure-optimization-v2` 开始技术规划
