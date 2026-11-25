# 📋 Feature Specification: Agent 输出模板化系统

**Feature ID**: FR-TEMPLATE-001  
**Feature 名称**: Agent 输出模板化系统  
**创建日期**: 2026-05-24  
**优先级**: P1  
**状态**: specified  

---

## 1. 上下文

### 1.1 问题描述
目前 7 个主流程 SDDU Agent（discovery/spec/plan/tasks/build/review/validate + docs）的**输出格式硬编码**在各自的 Agent Prompt 文件中。修改输出格式需要直接修改 Agent Prompt 源模板（`src/templates/agents/sddu-*.md.hbs`），这些模板通过 build-agents.cjs 构建后经 install.sh/install.ps1 安装到 `.opencode/agents/`。无法灵活适配不同团队、不同项目的输出标准需求。

### 1.2 目标用户
| 角色 | 职责 | 使用方式 |
|------|------|----------|
| **普通开发者** | 日常使用 SDDU Agent 工作流 | **消费者**：使用内置默认模板或团队自定义模板的输出 |
| **团队 TL/架构师** | 制定团队输出标准和规范 | **定制者**：编写和维护团队自定义模板 |
| **SDDU 插件作者** | 维护 SDDU 插件 | **提供者**：提供内置默认模板，维护模板基础设施 |

### 1.3 当前痛点
- 每次需要调整输出格式都必须修改 Agent Prompt 文件，牵一发而动全身
- 不同项目/团队无法差异化输出标准
- 插件生态的灵活性受限

### 1.4 依赖关系
- **前置依赖**: 无（独立功能）
- **相关 Feature**: `specs-tree-sdd-workflow-state-optimization`（工作流状态优化）
- **涉及现有文件**:
  - `src/templates/agents/sddu-*.md.hbs`（Agent Prompt 源模板，需添加输出模板引用指令）⚠️ **这是唯一需要直接修改的源码文件**
  - `build-agents.cjs`（构建脚本，需排除 output/ 子目录不参与 agent 构建）
  - `scripts/package.cjs`（打包脚本，需将 output/ 模板包含到 dist/sddu/）
  - `install.sh` / `install.ps1`（安装脚本，需将 output/ 模板复制到 `.opencode/plugins/sddu/`）
  
  > ⚠️ **架构约束**: `.opencode/` 目录下的文件是安装产物，**禁止直接修改**。所有改动必须通过 `src/templates/` 下的源文件 + 构建/打包/安装脚本完成。

---

## 2. 目标与非目标

### Goals（要达成的）
1. 为 6 个主流程 Agent + docs Agent 提供独立的输出模板文件
2. 支持用户通过放置自定义模板文件覆盖内置默认模板
3. 使用 `<<变量名>>` 占位符语法，由 AI 自主解析填充
4. 模板语法错误或不存在的场景显式报错
5. 与现有 6 阶段工作流无缝集成，Agent 执行后按模板渲染输出
6. 安装阶段自动将内置模板部署到用户项目

### Non-Goals（明确不做）
1. ❌ 不支持 Section 级模板（以整个文件为模板单位）
2. ❌ 不引入独立的模板渲染引擎（依赖 AI 自主解析 `<<变量名>>`）
3. ❌ 不提供模板校验工具（留作未来增强）
4. ❌ 不提供多套内置模板风格（只做一套默认）
5. ❌ 不涉及 Agent Prompt 本身的模板化（`src/templates/agents/*.hbs` 已有的提示词模板系统与本功能独立）
6. ❌ docs/roadmap/help 等辅助 Agent 的输出模板化（V1 只覆盖 6 个主流程 Agent）

---

## 3. 用户故事

| ID | 用户故事 |
|----|----------|
| US-001 | 作为 **团队 TL**，我想要将团队输出格式写入自定义模板文件，以便团队所有成员的 Agent 输出自动遵循统一格式 |
| US-002 | 作为 **普通开发者**，我想要开箱即用地使用预设输出格式，以便不需要额外配置即可开始工作 |
| US-003 | 作为 **SDDU 插件作者**，我想要输出模板与 Agent Prompt 分离，以便修改输出格式时不触及核心 Agent 逻辑 |
| US-004 | 作为 **普通开发者**，我想要在模板语法错误时看到明确的报错信息，以便快速定位和修复问题 |
| US-005 | 作为 **团队 TL**，我希望在不同项目中使用不同的输出模板，以便满足不同项目的文档规范要求 |

---

## 4. 功能需求

### 4.1 内置输出模板（Must Have）

**FR-001**: 为 6 个主流程 Agent 创建内置输出模板
- **描述**: 在 `src/templates/agents/output/` 目录下创建 6 个输出模板文件，分别对应 discovery、spec、plan、tasks、build、review、validate Agent
- **文件列表**:
  - `src/templates/agents/output/sddu-discovery.md.hbs`
  - `src/templates/agents/output/sddu-spec.md.hbs`
  - `src/templates/agents/output/sddu-plan.md.hbs`
  - `src/templates/agents/output/sddu-tasks.md.hbs`
  - `src/templates/agents/output/sddu-build.md.hbs`
  - `src/templates/agents/output/sddu-review.md.hbs`
  - `src/templates/agents/output/sddu-validate.md.hbs`
- **验证条件**:
  - [ ] 7 个模板文件全部存在且非空
  - [ ] 每个模板文件以 `.hbs` 为扩展名
  - [ ] 每个模板文件内容为纯 Markdown 格式，无 YAML frontmatter
  - [ ] 模板中使用的占位符均为 `<<变量名>>` 格式

**FR-002**: 内置模板内容从现有 Agent Prompt 提取
- **描述**: 每个输出模板的内容从对应 Agent Prompt 文件中现有的「输出格式」部分提取，逐字复刻，保证输出行为不变
- **验证条件**:
  - [ ] 发现阶段的输出模板与 `sddu-discovery.md` 中的「输出格式」内容完全一致
  - [ ] 规范编写阶段的输出模板与 `sddu-spec.md` 中的「输出格式」内容完全一致
  - [ ] 依此类推，每个 Agent 模板均与源文件一致

**FR-003**: 模板使用 `<<变量名>>` 占位符语法
- **描述**: 模板中的动态内容使用 `<<变量名>>` 格式标记（而非 `{{变量名}}`），避免与 Handlebars 模板引擎语法冲突
- **占位符示例**: `<<feature_name>>`, `<<status>>`, `<<file_path>>`, `<<next_step>>` 等
- **验证条件**:
  - [ ] 模板文件不包含 `{{` 语法（Handlebars 语法）
  - [ ] 所有动态内容使用 `<<变量名>>` 标记
  - [ ] `build-agents.cjs` 构建时不会解析/替换 `<<变量名>>`

### 4.2 用户自定义模板覆盖（Must Have）

**FR-004**: 用户自定义模板覆盖机制
- **描述**: 用户将同名模板文件放置在 `.sddu/templates/agents/output/` 目录下，即可覆盖内置默认模板
- **优先级规则**: `.sddu/templates/agents/output/`（用户自定义）> 插件内置（`src/templates/agents/output/`）
- **验证条件**:
  - [ ] 在 `.sddu/templates/agents/output/` 放置 `sddu-spec.md.hbs` 后，Agent 输出使用自定义格式
  - [ ] 删除自定义模板后，Agent 自动回退到内置模板
  - [ ] 自定义模板文件名必须与内置模板完全一致才能生效

**FR-005**: 模板发现路径优先级逻辑
- **描述**: 运行时按照优先级顺序查找模板，返回最先匹配到的模板内容
- **查找顺序**:
  1. `.sddu/templates/agents/output/<agent-name>.md.hbs`（用户自定义）
  2. `<plugin-root>/templates/output/<agent-name>.md.hbs`（插件内置）
  3. 无模板 → 回退到 Agent Prompt 中硬编码的输出格式（向后兼容）
- **验证条件**:
  - [ ] 自定义模板存在时使用自定义模板
  - [ ] 自定义模板不存在时使用内置模板
  - [ ] 两个模板都不存在时使用 Agent Prompt 中的硬编码格式（不报错）

### 4.3 AI 自主解析（Must Have）

**FR-006**: AI 自主解析 `<<变量名>>` 占位符
- **描述**: Agent Prompt 中明确指令要求 AI 在生成输出时，将 `<<变量名>>` 替换为实际内容。变量名具有语义含义，AI 根据上下文自动理解并填充
- **Agent Prompt 指令示例**:
  ```
  ## 输出模板
  请按照以下输出模板结构生成输出文件。模板中的 <<变量名>> 占位符需要用实际内容替换。
  - <<feature_name>>: 当前 Feature 的名称
  - <<status>>: 当前阶段的状态
  - <<file_path>>: 生成文件的相对路径
  ```
- **验证条件**:
  - [ ] Agent 输出的文件中不存在未替换的 `<<变量名>>`
  - [ ] 变量值填充合理且符合上下文语义
  - [ ] 变量名支持中英文混合（如 `<<用户故事列表>>` 或 `<<user_story_list>>`）

### 4.4 错误处理（Must Have）

**FR-007**: 模板缺失报错
- **描述**: 当模板文件路径存在但文件不可读或损坏时，Agent 应输出明确的错误信息，包含模板路径和错误原因
- **错误信息格式**:
  ```
  ⚠️ 输出模板加载失败: <template_path>
  原因: <error_description>
  将使用 Agent Prompt 中的默认输出格式继续执行。
  ```
- **验证条件**:
  - [ ] 模板文件权限不足时报错
  - [ ] 模板文件损坏（非 UTF-8 编码）时报错
  - [ ] 模板目录不存在时**不报错**，回退到硬编码格式

### 4.5 构建与安装适配（Must Have）

**FR-008**: `build-agents.cjs` 排除 output/ 子目录
- **描述**: 构建 Agent Prompt 时，`build-agents.cjs` 必须跳过 `src/templates/agents/output/` 子目录。output/ 目录中的 `.hbs` 文件不应被构建为 Agent 定义文件
- **验证条件**:
  - [ ] 运行 `node build-agents.cjs` 后，`dist/templates/agents/` 中不包含 output/ 子目录中的文件
  - [ ] 构建过程无报错
  - [ ] `dist/templates/agents/` 中原有的 Agent Prompt 文件不受影响

**FR-009**: `scripts/package.cjs` 包含 output/ 模板
- **描述**: 打包脚本 `package.cjs` 在构建 dist/sddu/ 插件目录时，将 `src/templates/agents/output/` 复制到 `dist/sddu/templates/output/`
- **验证条件**:
  - [ ] 运行打包后，`dist/sddu/templates/output/` 目录存在
  - [ ] 目录中包含 7 个 `.hbs` 文件
  - [ ] 文件内容与源文件完全一致

**FR-010**: 安装脚本复制 output/ 模板
- **描述**: `install.sh` 和 `install.ps1` 将 `dist/sddu/templates/output/` 复制到用户项目的 `.opencode/plugins/sddu/templates/output/`
- **验证条件**:
  - [ ] 安装完成后，`.opencode/plugins/sddu/templates/output/` 目录存在
  - [ ] 目录中包含 7 个 `.hbs` 模板文件
  - [ ] 安装不中断其他功能
- **⚠️ 测试安全约束**:
  > 测试 install.sh / install.ps1 时，**禁止**直接安装到当前项目（会污染工作目录）。
  > 必须在当前目录下创建临时测试目录：`./temp/sddu-test-project-xxx/`，在该临时目录中执行安装测试。
  > 测试完成后删除 `./temp/` 目录。确保 `.opencode/` 和 `opencode.json` 不会被意外覆盖。

### 4.6 工作流集成（Must Have）

**FR-011**: Agent Prompt 中添加模板引用指令
- **描述**: 每个主流程 Agent 的 Prompt 末尾添加「输出模板引用」章节，说明输出模板的路径和解析规则
- **Agent Prompt 新增内容**（追加在所有 Agent 中）:
  ```markdown
  ## 输出模板
  你的输出格式由输出模板文件定义。
  - 模板路径: `.opencode/plugins/sddu/templates/output/sddu-<agent>.md.hbs`
  - 用户自定义覆盖路径: `.sddu/templates/agents/output/sddu-<agent>.md.hbs`
  - 模板中的 `<<变量名>>` 占位符需要用实际内容替换
  - 如果两个模板都不存在，使用本提示中定义的默认输出格式
  ```
- **验证条件**:
  - [ ] 6 个主流程 Agent 的 Prompt 均包含模板引用指令
  - [ ] 指令明确说明了查找优先级
  - [ ] 指令说明了 `<<变量名>>` 的替换规则

**FR-012**: Agent 执行后按模板渲染输出
- **描述**: Agent 在完成主要工作后，最终输出文件（discovery.md / spec.md / plan.md 等）的结构和内容遵循输出模板的格式
- **验证条件**:
  - [ ] 运行 discovery Agent 后，输出文件格式与 `sddu-discovery.md.hbs` 一致
  - [ ] 运行 spec Agent 后，输出文件格式与 `sddu-spec.md.hbs` 一致
  - [ ] 依此类推，每个 Agent 的输出均匹配对应模板

### 4.7 期望功能（Should Have）

**FR-013**: 模板文件命名与 Agent 命名对齐
- **描述**: 输出模板文件名使用 `sddu-<shortname>.md.hbs` 格式，与对应 Agent Prompt 模板文件命名一致
- **命名对照表**:

| Agent | 提示词模板 | 输出模板 |
|-------|-----------|----------|
| discovery | `sddu-discovery.md.hbs` | `sddu-discovery.md.hbs` |
| spec | `sddu-spec.md.hbs` | `sddu-spec.md.hbs` |
| plan | `sddu-plan.md.hbs` | `sddu-plan.md.hbs` |
| tasks | `sddu-tasks.md.hbs` | `sddu-tasks.md.hbs` |
| build | `sddu-build.md.hbs` | `sddu-build.md.hbs` |
| review | `sddu-review.md.hbs` | `sddu-review.md.hbs` |
| validate | `sddu-validate.md.hbs` | `sddu-validate.md.hbs` |

- **验证条件**: 所有输出模板的文件名与提示词模板的文件名前缀一致

### 4.8 未来功能（Could Have）

- **FR-014**（未来）：提供模板校验工具命令 `@sddu-validate-template`，用户可提前验证模板正确性
- **FR-015**（未来）：多套内置模板风格（简洁版/详细版等），通过配置切换
- **FR-016**（未来）：模板版本管理，与 Agent 版本对应

---

## 5. 非功能需求

| ID | 类别 | 描述 | 验证条件 |
|----|------|------|----------|
| NFR-001 | 性能 | 模板加载时间不应超过 50ms（本地文件读取 + 缓存），不影响 Agent 启动速度 | 测量模板加载耗时，< 50ms |
| NFR-002 | 兼容性 | 输出模板化后，Agent 的输出格式与现有输出**完全一致**（内置模板场景） | diff 对比模板化前后的输出，无差异 |
| NFR-003 | 兼容性 | 使用自定义模板时，Agent 输出格式应与自定义模板完全一致 | 对比自定义模板与 Agent 实际输出，结构一致 |
| NFR-004 | 安全性 | 模板文件仅为纯文本 Markdown，不包含可执行代码，不存在注入风险 | 模板文件无脚本标签或可执行内容 |
| NFR-005 | 编码 | 所有模板文件必须使用 UTF-8 编码 | `file -I *.hbs` 检查输出为 UTF-8 |
| NFR-006 | 可用性 | 用户无需任何配置即可使用内置模板，开箱即用 | 全新安装后运行任意 Agent，输出格式正常 |

---

## 6. 技术设计

### 6.1 目录结构

```
src/
└── templates/
    └── agents/
        ├── sddu-discovery.md.hbs          ← Agent Prompt 源模板（需修改！移除硬编码输出格式，添加模板引用指令）
        ├── sddu-spec.md.hbs               ← Agent Prompt 源模板（需修改！同上）
        ├── ...
        └── output/                        ← [新] 输出模板目录
            ├── sddu-discovery.md.hbs      ← 从 Agent Prompt 中提取出的输出格式（新文件）
            ├── sddu-spec.md.hbs           ← 提取自 Agent Prompt 的输出格式
            ├── sddu-plan.md.hbs
            ├── sddu-tasks.md.hbs
            ├── sddu-build.md.hbs
            ├── sddu-review.md.hbs
            └── sddu-validate.md.hbs

# 安装后（dist/sddu/ 插件包结构中）:
dist/
└── sddu/
    ├── index.js
    ├── agents/                            ← Agent 定义文件（构建生成）
    ├── templates/
    │   └── output/                        ← [新] 输出模板（构建时复制）
    │       ├── sddu-discovery.md.hbs
    │       ├── sddu-spec.md.hbs
    │       └── ...
    ├── package.json
    └── opencode.json

# 运行阶段（用户项目）:
.sddu/
└── templates/
    └── agents/
        └── output/                        ← [新] 用户自定义输出模板
            ├── sddu-spec.md.hbs           ← 可选，覆盖内置模板
            └── ...
```

### 6.2 模板文件内容格式

输出模板文件**不包含 YAML frontmatter**，仅为纯 Markdown 内容。示例如下：

```markdown
# 需求挖掘报告：<<feature_name>>

## 1. 问题定义
- 核心问题：<<core_problem>>
- 业务价值：<<business_value>>
- 不做的成本：<<cost_of_not_doing>>

## 2. 用户画像
- 主要用户：<<primary_users>>
- 用户场景：<<user_scenarios>>
```

### 6.3 模板发现算法

```
function findTemplate(agentName):
    # 1. 检查用户自定义目录
    userPath = ".sddu/templates/agents/output/sddu-" + agentName + ".md.hbs"
    if fileExists(userPath):
        return readFile(userPath)

    # 2. 检查插件内置目录
    pluginPath = pluginRoot + "/templates/output/sddu-" + agentName + ".md.hbs"
    if fileExists(pluginPath):
        return readFile(pluginPath)

    # 3. 无模板 - 返回 null，Agent 使用硬编码格式
    return null
```

### 6.4 构建脚本变更

**`build-agents.cjs`** 变更：
- 在 `AGENT_MAP` 循环构建结束后，新增一个步骤：将 `src/templates/agents/output/` 目录下的文件逐字复制到 `dist/templates/output/`（不经过 Handlebars 处理）

**`scripts/package.cjs`** 变更：
- 在 `packageSingleVersion` 函数中，增加对 `dist/templates/output/` 目录的处理：将其复制到 `dist/sddu/templates/output/`

### 6.5 安装脚本变更

**`install.sh` / `install.ps1`** 变更：
- 在 Step 5（复制插件文件）中添加：
  ```bash
  # 复制输出模板
  if [ -d "${DIST_SDDU_DIR}/templates/output" ]; then
      mkdir -p "${TARGET_DIR}/.opencode/plugins/sddu/templates/output"
      cp "${DIST_SDDU_DIR}/templates/output/"* "${TARGET_DIR}/.opencode/plugins/sddu/templates/output/"
  fi
  ```

### 6.6 第三方依赖

- **无新增第三方依赖**。本功能不引入新的 npm 包或外部服务
- 模板文件读取使用 Node.js 内置 `fs.readFileSync` 或 `fs.promises.readFile`

---

## 7. 边界情况

| ID | 场景 | 预期行为 |
|----|------|----------|
| EC-001 | 用户自定义模板文件存在但为空 | Agent 输出**错误提示**：模板文件为空，回退到内置模板 |
| EC-002 | 用户自定义模板文件名拼写错误（如 `sddu-spec.md.hbs` 写成 `sddu-speec.md.hbs`） | 不匹配内置模板文件名，被视为不存在的模板，使用内置模板 |
| EC-003 | 用户自定义模板中存在非 UTF-8 字符 | 报错提示编码问题，回退到内置模板 |
| EC-004 | 多个用户同时在同一个项目目录中操作，同时读取模板 | 模板读取操作为只读，无并发问题 |
| EC-005 | 用户将模板放在错误目录（如 `.sddu/templates/agents/` vs `.sddu/templates/agents/output/`） | 模板不会被发现，Agent 使用内置模板（静默降级） |
| EC-006 | Agent Prompt 中的模板引用指令被用户修改或删除 | 如果引用指令不存在，Agent 仍可使用硬编码格式输出（向后兼容） |
| EC-007 | 模板文件包含 `{{变量名}}`（Handlebars 语法）| 构建阶段输出/ 目录被排除，不会被 Handlebars 处理；运行时 AI 可能误解析或保留原样 |
| EC-008 | 插件升级后内置模板更新，用户自定义模板未更新 | 用户自定义模板优先级更高，不受插件升级影响 |

---

## 8. 开放问题

| # | 问题 | 状态 | 需要决策方 |
|---|------|------|-----------|
| OQ-001 | 模板发现路径查找应在 Agent Prompt（AI 端）实现，还是在插件代码（Node.js 端）实现？ | ⏳ 待决策 | SDDU 架构师 |
| OQ-002 | 如果选择代码端实现，需要在 `.opencode/plugins/sddu/` 下添加新的 JS 模块来加载模板，该模块的命名和接口？ | ⏳ 待 OQ-001 决策后 | SDDU 开发者 |
| OQ-003 | docs Agent 是否应纳入 V1 模板化范围？目前 6 个主流程 Agent 确认，docs 待确认 | ⏳ 待决策 | 产品负责人 |
| OQ-004 | 是否需要在 Agent Prompt 中明确列出每个 `<<变量名>>` 的语义说明，还是让 AI 完全自主理解？ | ⏳ 推荐：列出语义说明（参考 FR-006 示例） | SDDU 插件作者 |

---

## 9. 需求汇总

| 类型 | ID | 描述 | 优先级 | 工作量预估 |
|------|----|------|--------|-----------|
| FR | FR-001 | 创建 7 个内置输出模板文件 | P0 | S |
| FR | FR-002 | 模板内容从现有 Agent Prompt 提取 | P0 | S |
| FR | FR-003 | 使用 `<<变量名>>` 占位符语法 | P0 | S |
| FR | FR-004 | 用户自定义模板覆盖机制 | P0 | M |
| FR | FR-005 | 模板发现路径优先级逻辑 | P0 | M |
| FR | FR-006 | AI 自主解析 `<<变量名>>` 占位符 | P0 | S |
| FR | FR-007 | 模板缺失/损坏报错 | P0 | S |
| FR | FR-008 | build-agents.cjs 排除 output/ | P0 | S |
| FR | FR-009 | package.cjs 包含 output/ 模板 | P0 | S |
| FR | FR-010 | 安装脚本复制 output/ 模板 | P0 | S |
| FR | FR-011 | Agent Prompt 添加模板引用指令 | P0 | M |
| FR | FR-012 | Agent 执行后按模板渲染输出 | P0 | M |
| FR | FR-013 | 模板文件命名与 Agent 对齐 | P1 | S |
| NFR | NFR-001 | 模板加载性能 < 50ms | P0 | S |
| NFR | NFR-002 | 内置模板输出与现有输出一致 | P0 | S |
| NFR | NFR-003 | 自定义模板输出与模板一致 | P0 | S |
| NFR | NFR-004 | 模板安全性（无注入风险） | P0 | S |
| NFR | NFR-005 | UTF-8 编码 | P0 | S |
| NFR | NFR-006 | 开箱即用 | P0 | S |
| EC | EC-001 ~ EC-008 | 边界情况处理 | P1 | S |

**工作量总预估**: 9 × S + 4 × M = ~13 单位工作量

---

## 10. 验收标准

### MVP 验收条件
1. ✅ 7 个内置输出模板文件存在于 `src/templates/agents/output/`
2. ✅ 模板内容与现有 Agent 输出格式一致
3. ✅ 构建时 output/ 目录不被 Handlebars 处理
4. ✅ 打包时 output/ 模板被包含在 dist/sddu/ 中
5. ✅ 安装后模板文件存在于 `.opencode/plugins/sddu/templates/output/`
6. ✅ Agent Prompt 中包含模板引用指令
7. ✅ 用户放置自定义模板后覆盖生效
8. ✅ 模板缺失/损坏时给出错误信息