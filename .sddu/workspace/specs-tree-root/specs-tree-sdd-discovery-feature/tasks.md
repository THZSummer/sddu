# SDD Discovery 需求挖掘能力增强 - 任务分解

## 元数据表

| 元数据 | 值 |
|--------|-----|
| Feature ID | FR-SDD-DISCOVERY-001 |
| Feature 名称 | SDD Discovery 需求挖掘能力增强 |
| 版本 | 1.0.0 |
| 创建日期 | 2026-04-03 |
| 作者 | SDD Team |
| 状态 | tasked |

---

## 任务汇总

| 指标 | 数值 |
|------|------|
| 总任务数 | 9 个 |
| 复杂度分布 | S 级 3 个，M 级 4 个，L 级 2 个 |
| 执行波次 | 4 个波次 |
| 预计总工时 | 18 小时 |

---

## 任务依赖图

```
Wave 1 (无依赖)                    Wave 2                      Wave 3                      Wave 4
                                                                                              
┌─────────────┐                                                                              
│  TASK-001   │───────────────────────────────────────────────────────────────────┐          
│ Agent 定义  │                                                                   │          
└──────┬──────┘                                                                   │          
       │                                                                          │          
       ├────────────────────────┐                                                 │          
       │                        │                                                 │          
       ↓                        ↓                                                 ↓          
┌─────────────┐          ┌─────────────┐                                    ┌─────────────┐  
│  TASK-002   │          │  TASK-004   │                                    │  TASK-009   │  
│ 7 步工作流   │          │  状态机更新  │                                    │  测试验证   │  
└──────┬──────┘          └──────┬──────┘                                    ▲             ▲  
       │                        │                                           │             │  
       │                        ├───────────────────────────────────────────┤             │  
       │                        │                                           │             │  
       ↓                        ↓                                           │             │  
┌─────────────┐          ┌─────────────┐                                    │             │  
│  TASK-003   │          │  TASK-005   │────────────────────────────────────┤             │  
│  辅导模式   │          │ 智能入口更新 │                                    │             │  
└──────┬──────┘          └──────┬──────┘                                    │             │  
       │                        │                                           │             │  
       │                        ├───────────────────────────────────────────┤             │  
       │                        │                                           │             │  
       ↓                        ↓                                           │             │  
┌─────────────┐          ┌─────────────┐                                    │             │  
│  TASK-006   │          │  TASK-007   │────────────────────────────────────┤             │  
│ opencode.json│          │ README 更新 │                                    │             │  
└──────┬──────┘          └──────┬──────┘                                    │             │  
       │                        │                                           │             │  
       │                        ├───────────────────────────────────────────┤             │  
       │                        │                                           │             │  
       ↓                        │                                           │             │  
┌─────────────┐                 │                                           │             │  
│  TASK-008   │─────────────────┘                                           │             │  
│ 安装脚本更新 │                                                             │             │  
└─────────────┘                                                             │             │  
                                                                          ──┘             │  
                                                                                          │  
                                                                                          │  
==========================================================================================
```

---

## TASK-001: 创建 Discovery Agent 定义文件

**复杂度**: M  
**前置依赖**: 无  
**执行波次**: 1  
**优先级**: P0  
**预计工时**: 2h

### 描述

创建 `@sdd-discovery` Agent 的定义文件，实现完整的 7 步需求挖掘工作流。该 Agent 是 Discovery 阶段的核心执行组件，负责引导用户完成从问题空间探索到范围边界划定的全过程。

### 工作内容

1. 在 `dist/templates/agents/` 目录创建 `sdd-discovery.md` 文件
2. 定义 YAML frontmatter，包含：
   - Agent 名称、版本、类型
   - 输入参数定义（feature_name, user_input）
   - 输出定义（discovery.md 路径）
   - 7 步工作流配置
   - 辅导模式配置
3. 实现 7 步工作流的详细提示词：
   - Step 1: 问题空间探索（背景理解、痛点挖掘、业务价值澄清）
   - Step 2: 用户画像与场景（目标用户定义、用户场景还原、用户旅程地图）
   - Step 3: 需求分类与优先级（MoSCoW 分类、需求归类、优先级排序）
   - Step 4: 竞品与方案调研（竞品对标、替代方案评估）
   - Step 5: 风险与假设识别（关键假设、潜在风险）
   - Step 6: 成功标准定义（定性指标、定量指标、验收标准）
   - Step 7: 范围边界划定（MVP/V1/未来版本规划）
4. 集成辅导模式逻辑，支持 4 种用户水平自动检测
5. 定义 discovery.md 输出模板结构

### 涉及文件

- [NEW] `dist/templates/agents/sdd-discovery.md`
- [NEW] `dist/templates/discovery-template.md`

### 验收标准

- [ ] AC-001.1: Agent 文件必须包含完整的 YAML frontmatter
- [ ] AC-001.2: 7 步工作流必须全部定义，每步包含至少 3 个引导问题
- [ ] AC-001.3: 辅导模式必须支持 4 种水平（想法/痛点/方案/执行阶段）
- [ ] AC-001.4: discovery.md 模板必须包含 7 个核心章节
- [ ] AC-001.5: Agent 文件语法必须通过 OpenCode Plugin API 验证

### 验证命令

```bash
# 验证 Agent 文件存在
test -f dist/templates/agents/sdd-discovery.md && echo "✓ Agent 文件存在"

# 验证 YAML frontmatter 格式
head -50 dist/templates/agents/sdd-discovery.md | grep -q "^---$" && echo "✓ YAML frontmatter 格式正确"

# 验证 7 步工作流定义
grep -c "step:" dist/templates/agents/sdd-discovery.md | grep -q "7" && echo "✓ 7 步工作流已定义"

# 验证辅导模式配置
grep -q "coaching:" dist/templates/agents/sdd-discovery.md && echo "✓ 辅导模式已配置"
```

---

## TASK-002: 实现 7 步工作流逻辑

**复杂度**: L  
**前置依赖**: TASK-001  
**执行波次**: 2  
**优先级**: P0  
**预计工时**: 3h

### 描述

实现 Discovery 工作流引擎，负责按顺序执行 7 步需求挖掘流程。该引擎需要支持逐步引导、上下文记忆、中断续执行等功能，确保用户能够系统地完成需求挖掘。

### 工作内容

1. 创建 `src/discovery/` 目录
2. 实现 `workflow-engine.ts`：
   - 定义 `DiscoveryStep` 接口
   - 实现 `DISCOVERY_WORKFLOW` 常量数组（7 步配置）
   - 实现 `DiscoveryWorkflowEngine` 类
   - 实现 `execute()` 方法支持顺序执行
   - 实现 `executeStep()` 方法处理单步逻辑
   - 实现进度追踪和状态持久化
3. 实现上下文管理：
   - 每步输出的收集与合并
   - 跨步骤的上下文传递
   - 用户输入的历史记录
4. 实现中断与续执行：
   - 检查点保存
   - 从指定步骤恢复执行
5. 集成 Agent 调用逻辑，调用 `sdd-discovery` Agent

### 涉及文件

- [NEW] `src/discovery/workflow-engine.ts`
- [NEW] `src/discovery/types.ts`
- [MODIFY] `src/index.ts`（导出新模块）

### 验收标准

- [ ] AC-002.1: `DiscoveryWorkflowEngine` 类必须正确实现
- [ ] AC-002.2: 7 步工作流必须按顺序执行，不能跳过任何步骤
- [ ] AC-002.3: 必须支持中断后从指定步骤恢复
- [ ] AC-002.4: 每步执行后必须生成对应的 discovery.md 章节
- [ ] AC-002.5: 必须正确调用 `sdd-discovery` Agent
- [ ] AC-002.6: 执行完成后必须生成完整的 discovery.md 文件

### 验证命令

```bash
# 验证 workflow-engine.ts 存在
test -f src/discovery/workflow-engine.ts && echo "✓ workflow-engine.ts 存在"

# 验证 DiscoveryWorkflowEngine 类实现
grep -q "class DiscoveryWorkflowEngine" src/discovery/workflow-engine.ts && echo "✓ 类定义存在"

# 验证 7 步工作流数组
grep -q "DISCOVERY_WORKFLOW" src/discovery/workflow-engine.ts && echo "✓ 工作流数组已定义"

# 验证 execute 方法
grep -q "async execute" src/discovery/workflow-engine.ts && echo "✓ execute 方法已实现"

# TypeScript 编译检查
npx tsc --noEmit src/discovery/workflow-engine.ts && echo "✓ TypeScript 编译通过"
```

---

## TASK-003: 实现辅导模式

**复杂度**: M  
**前置依赖**: TASK-002  
**执行波次**: 2  
**优先级**: P1  
**预计工时**: 2h

### 描述

实现辅导模式引擎，根据用户输入的详细程度和关键词自动判断用户所处的阶段（想法/痛点/方案/执行），并提供相应的引导策略。辅导模式确保不同水平的用户都能获得适当的支持。

### 工作内容

1. 实现 `coaching-mode.ts`：
   - 定义 `CoachingLevel` 类型（4 种水平）
   - 定义 `CoachingConfig` 接口
   - 实现 `COACHING_CONFIGS` 配置对象
   - 实现 `CoachingModeEngine` 类
2. 实现用户水平检测逻辑：
   - 基于输入长度判断（<20 字为想法阶段）
   - 基于关键词匹配（痛点/问题/方案/实现等）
   - 支持用户手动指定水平
3. 实现引导策略：
   - 想法阶段：高干预，引导式提问
   - 痛点阶段：中干预，5 Whys 深度挖掘
   - 方案阶段：低干预，验证可行性
   - 执行阶段：最小干预，确认范围边界
4. 集成到工作流引擎，在每步执行前应用辅导策略

### 涉及文件

- [NEW] `src/discovery/coaching-mode.ts`
- [MODIFY] `src/discovery/workflow-engine.ts`（集成辅导模式）

### 验收标准

- [ ] AC-003.1: `CoachingModeEngine` 类必须正确实现
- [ ] AC-003.2: 必须正确检测 4 种用户水平
- [ ] AC-003.3: 每种水平必须有对应的引导策略
- [ ] AC-003.4: 必须支持用户手动指定辅导级别
- [ ] AC-003.5: 辅导模式必须在每步工作流中生效

### 验证命令

```bash
# 验证 coaching-mode.ts 存在
test -f src/discovery/coaching-mode.ts && echo "✓ coaching-mode.ts 存在"

# 验证 CoachingModeEngine 类实现
grep -q "class CoachingModeEngine" src/discovery/coaching-mode.ts && echo "✓ 类定义存在"

# 验证 4 种辅导水平
grep -q "想法阶段" src/discovery/coaching-mode.ts && echo "✓ 想法阶段已定义"
grep -q "痛点阶段" src/discovery/coaching-mode.ts && echo "✓ 痛点阶段已定义"
grep -q "方案阶段" src/discovery/coaching-mode.ts && echo "✓ 方案阶段已定义"
grep -q "执行阶段" src/discovery/coaching-mode.ts && echo "✓ 执行阶段已定义"

# 验证 detectLevel 方法
grep -q "detectLevel" src/discovery/coaching-mode.ts && echo "✓ detectLevel 方法已实现"

# TypeScript 编译检查
npx tsc --noEmit src/discovery/coaching-mode.ts && echo "✓ TypeScript 编译通过"
```

---

## TASK-004: 更新状态机添加 discovered 状态

**复杂度**: M  
**前置依赖**: 无  
**执行波次**: 1  
**优先级**: P0  
**预计工时**: 2h

### 描述

更新状态机模块，添加 `discovered` 状态并定义合法的流转规则。`discovered` 状态位于 `drafting` 和 `specified` 之间，是推荐的必经路径（但允许跳过）。

### 工作内容

1. 在 `src/state-machine.ts` 中：
   - 添加 `DISCOVERED = 'discovered'` 枚举值
   - 更新 `STATE_TRANSITIONS` 映射表：
     - `drafting → discovered`（新增）
     - `drafting → specified`（保留，允许跳过）
     - `discovered → specified`（新增）
   - 更新状态流转验证逻辑
2. 实现 `DiscoveryStateValidator` 类：
   - `canTransitionToSpec()` 方法检查 discovery.md 是否存在
   - `validateTransition()` 方法验证状态流转合法性
   - 返回警告信息（当跳过 discovery 时）
3. 更新状态检查逻辑：
   - 在状态变更时更新 `.sdd-state` 文件
   - 记录状态变更历史
4. 添加状态解释文档（注释）

### 涉及文件

- [NEW] `src/discovery/state-validator.ts`
- [MODIFY] `src/state-machine.ts`

### 验收标准

- [ ] AC-004.1: `FeatureState.DISCOVERED` 枚举值必须添加
- [ ] AC-004.2: 状态流转表必须包含 `drafting → discovered → specified`
- [ ] AC-004.3: 必须保留 `drafting → specified` 路径（允许跳过）
- [ ] AC-004.4: 跳过 discovery 时必须显示警告但不阻止
- [ ] AC-004.5: 状态变更必须正确更新 `.sdd-state` 文件
- [ ] AC-004.6: 非法状态流转必须被拒绝

### 验证命令

```bash
# 验证 DISCOVERED 状态枚举
grep -q "DISCOVERED = 'discovered'" src/state-machine.ts && echo "✓ DISCOVERED 状态已添加"

# 验证状态流转表更新
grep -q "discovered.*specified" src/state-machine.ts && echo "✓ 状态流转表已更新"

# 验证 state-validator.ts 存在
test -f src/discovery/state-validator.ts && echo "✓ state-validator.ts 存在"

# 验证 canTransitionToSpec 方法
grep -q "canTransitionToSpec" src/discovery/state-validator.ts && echo "✓ canTransitionToSpec 方法已实现"

# TypeScript 编译检查
npx tsc --noEmit src/state-machine.ts src/discovery/state-validator.ts && echo "✓ TypeScript 编译通过"
```

---

## TASK-005: 更新智能入口添加 discovery 命令

**复杂度**: M  
**前置依赖**: TASK-004  
**执行波次**: 3  
**优先级**: P0  
**预计工时**: 2h

### 描述

更新 `@sdd` 智能入口，添加 `discovery` 命令支持，并更新阶段跳转验证表。智能入口需要正确路由 `@sdd discovery [feature-name]` 命令到 `sdd-discovery` Agent。

### 工作内容

1. 在 `src/smart-entry.ts` 中：
   - 添加 `discovery` 命令配置：
     - 命令名称、描述、用法
     - 关联 Agent（sdd-discovery）
     - 输出文件（discovery.md）
     - 下一状态（discovered）
   - 更新命令路由表 `SDD_COMMANDS`
2. 更新阶段跳转验证表：
   - 添加 `discovery → spec` 推荐路径
   - 保留 `drafting → spec` 跳过路径（带警告）
   - 定义非法跳转规则（如 `discovered → planned`）
3. 实现前置条件检查：
   - 检查 Feature 名称合法性
   - 检查 `.sdd/specs-tree-root/` 目录存在性
   - 检查 discovery.md 是否已存在（询问覆盖）
4. 更新状态流转图显示逻辑
5. 添加命令帮助信息

### 涉及文件

- [MODIFY] `src/smart-entry.ts`
- [MODIFY] `src/sdd.md`（智能入口文档）

### 验收标准

- [ ] AC-005.1: `@sdd discovery [feature-name]` 命令必须可用
- [ ] AC-005.2: 命令必须正确调用 `sdd-discovery` Agent
- [ ] AC-005.3: 执行后必须生成 `.sdd/specs-tree-root/[feature]/discovery.md`
- [ ] AC-005.4: 状态必须正确更新为 `discovered`
- [ ] AC-005.5: 跳过 discovery 直接 spec 时必须显示警告
- [ ] AC-005.6: 非法状态跳转必须被拒绝
- [ ] AC-005.7: 命令帮助信息必须包含 discovery 命令

### 验证命令

```bash
# 验证 discovery 命令配置
grep -q "name: 'discovery'" src/smart-entry.ts && echo "✓ discovery 命令已配置"

# 验证命令路由表更新
grep -q "sdd-discovery" src/smart-entry.ts && echo "✓ Agent 路由已配置"

# 验证跳转保护规则
grep -q "JUMP_PROTECTION_RULES" src/smart-entry.ts && echo "✓ 跳转保护规则已定义"

# 验证状态流转图更新
grep -q "discovered" src/smart-entry.ts && echo "✓ 状态流转图已更新"

# TypeScript 编译检查
npx tsc --noEmit src/smart-entry.ts && echo "✓ TypeScript 编译通过"
```

---

## TASK-006: 更新 opencode.json 配置

**复杂度**: S  
**前置依赖**: TASK-001  
**执行波次**: 2  
**优先级**: P0  
**预计工时**: 0.5h

### 描述

更新 `opencode.json` 配置文件，注册新的 `sdd-discovery` Agent，确保 OpenCode 平台能够识别和调用该 Agent。

### 工作内容

1. 读取 `opencode.json` 文件
2. 在 `agents` 数组中添加 `sdd-discovery` 配置：
   ```json
   {
     "name": "sdd-discovery",
     "description": "SDD 需求挖掘 Agent - 执行 7 步需求挖掘工作流",
     "path": "dist/templates/agents/sdd-discovery.md",
     "version": "1.0.0"
   }
   ```
3. 更新 `tools` 配置（如有需要）
4. 更新 `version` 字段到 `2.0.0`
5. 更新 `changelog` 添加 Discovery 功能说明
6. 验证 JSON 格式正确性

### 涉及文件

- [MODIFY] `opencode.json`

### 验收标准

- [ ] AC-006.1: `sdd-discovery` Agent 必须在 `opencode.json` 中注册
- [ ] AC-006.2: Agent 路径必须指向 `dist/templates/agents/sdd-discovery.md`
- [ ] AC-006.3: JSON 格式必须有效（可通过 JSON 验证）
- [ ] AC-006.4: 版本号必须更新到 `2.0.0`
- [ ] AC-006.5: changelog 必须包含 Discovery 功能说明

### 验证命令

```bash
# 验证 opencode.json 格式
node -e "JSON.parse(require('fs').readFileSync('opencode.json'))" && echo "✓ JSON 格式有效"

# 验证 sdd-discovery Agent 注册
grep -q '"name": "sdd-discovery"' opencode.json && echo "✓ Agent 已注册"

# 验证版本号
grep -q '"version": "2.0.0"' opencode.json && echo "✓ 版本号已更新"

# 验证 Agent 路径
grep -q 'dist/templates/agents/sdd-discovery.md' opencode.json && echo "✓ Agent 路径正确"
```

---

## TASK-007: 更新 README.md 文档

**复杂度**: S  
**前置依赖**: TASK-005  
**执行波次**: 3  
**优先级**: P1  
**预计工时**: 1h

### 描述

更新项目根目录的 `README.md`，添加 Discovery 阶段说明，更新 7 阶段工作流图，确保文档与实际功能一致。

### 工作内容

1. 更新 SDD 工作流说明：
   - 将 6 阶段更新为 7 阶段
   - 添加 Discovery 阶段（阶段 0）说明
   - 更新状态流转图
2. 添加 `@sdd discovery` 命令使用说明：
   - 命令语法
   - 使用场景
   - 输出说明
3. 更新快速开始示例：
   - 添加 discovery 阶段示例
   - 展示完整 7 阶段流程
4. 更新特性列表：
   - 添加"需求挖掘"特性
   - 标注版本号 2.0.0
5. 更新目录结构说明（如有需要）

### 涉及文件

- [MODIFY] `README.md`

### 验收标准

- [ ] AC-007.1: README 必须展示 7 阶段工作流图
- [ ] AC-007.2: 必须包含 Discovery 阶段详细说明
- [ ] AC-007.3: 必须包含 `@sdd discovery` 命令使用示例
- [ ] AC-007.4: 版本号必须标注为 2.0.0
- [ ] AC-007.5: 状态流转图必须包含 `discovered` 状态

### 验证命令

```bash
# 验证 7 阶段工作流图
grep -q "阶段 0" README.md && echo "✓ 阶段 0 已添加"
grep -q "Discovery" README.md && echo "✓ Discovery 阶段已说明"

# 验证 discovery 命令说明
grep -q "@sdd discovery" README.md && echo "✓ 命令使用说明已添加"

# 验证状态流转图
grep -q "discovered" README.md && echo "✓ 状态流转图已更新"

# 验证版本号
grep -q "2.0.0" README.md && echo "✓ 版本号已更新"
```

---

## TASK-008: 更新安装脚本

**复杂度**: S  
**前置依赖**: TASK-001  
**执行波次**: 3  
**优先级**: P1  
**预计工时**: 1h

### 描述

更新 `dist/install.sh` 安装脚本，确保新版本的 Agent 定义文件和模板文件在安装时正确复制到目标目录。

### 工作内容

1. 在 `dist/install.sh` 中：
   - 添加 `sdd-discovery.md` 的复制命令
   - 添加 `discovery-template.md` 的复制命令
   - 确保复制到正确的目标目录
2. 更新版本检查逻辑：
   - 检查是否已有旧版本
   - 提示版本升级信息
3. 添加新文件的权限设置
4. 更新安装完成提示信息
5. 测试安装脚本在干净环境中的执行

### 涉及文件

- [MODIFY] `dist/install.sh`

### 验收标准

- [ ] AC-008.1: 安装脚本必须复制 `sdd-discovery.md` 到目标目录
- [ ] AC-008.2: 安装脚本必须复制 `discovery-template.md` 到目标目录
- [ ] AC-008.3: 复制的文件权限必须正确（可执行）
- [ ] AC-008.4: 安装完成提示必须包含 Discovery 功能说明
- [ ] AC-008.5: 安装脚本必须通过 shell 语法检查

### 验证命令

```bash
# 验证 sdd-discovery.md 复制命令
grep -q "sdd-discovery.md" dist/install.sh && echo "✓ Agent 复制命令已添加"

# 验证 discovery-template.md 复制命令
grep -q "discovery-template.md" dist/install.sh && echo "✓ 模板复制命令已添加"

# Shell 语法检查
bash -n dist/install.sh && echo "✓ Shell 语法检查通过"

# 验证文件可执行权限
test -x dist/install.sh && echo "✓ 安装脚本可执行"
```

---

## TASK-009: 测试 discovery 功能

**复杂度**: L  
**前置依赖**: TASK-002, TASK-005  
**执行波次**: 4  
**优先级**: P0  
**预计工时**: 2h

### 描述

执行完整的端到端测试，验证 Discovery 功能的所有组件协同工作正常。包括单元测试、集成测试和手动验证。

### 工作内容

1. 创建测试文件：
   - `__tests__/discovery/workflow-engine.test.ts`
   - `__tests__/discovery/coaching-mode.test.ts`
   - `__tests__/discovery/state-validator.test.ts`
2. 执行单元测试：
   - 测试 7 步工作流执行
   - 测试辅导模式检测
   - 测试状态流转验证
3. 执行集成测试：
   - 完整 discovery 流程测试
   - 跳过 discovery 直接 spec 测试
   - 非法状态跳转测试
4. 手动验证：
   - 创建测试 Feature
   - 运行 `@sdd discovery test-feature`
   - 验证 discovery.md 生成和内容
   - 运行 `@sdd spec test-feature`
   - 验证 spec.md 引用 discovery.md 内容
5. 记录测试结果和问题

### 涉及文件

- [NEW] `__tests__/discovery/workflow-engine.test.ts`
- [NEW] `__tests__/discovery/coaching-mode.test.ts`
- [NEW] `__tests__/discovery/state-validator.test.ts`
- [NEW] `.sdd/specs-tree-root/test-discovery-feature/discovery.md`（测试生成）

### 验收标准

- [ ] AC-009.1: 所有单元测试必须通过
- [ ] AC-009.2: 所有集成测试必须通过
- [ ] AC-009.3: 手动验证 discovery 流程必须成功
- [ ] AC-009.4: discovery.md 必须包含所有 7 个章节
- [ ] AC-009.5: 状态必须正确流转（drafting → discovered → specified）
- [ ] AC-009.6: 跳过 discovery 时必须显示警告
- [ ] AC-009.7: 非法状态跳转必须被拒绝

### 验证命令

```bash
# 运行单元测试
npm test -- __tests__/discovery/ && echo "✓ 单元测试通过"

# 运行集成测试
npm run test:integration -- discovery && echo "✓ 集成测试通过"

# 验证测试 Feature 的 discovery.md 生成
test -f .sdd/specs-tree-root/test-discovery-feature/discovery.md && echo "✓ discovery.md 已生成"

# 验证 discovery.md 结构（检查 7 个章节）
grep -c "^## " .sdd/specs-tree-root/test-discovery-feature/discovery.md | grep -qE "[7-9]" && echo "✓ discovery.md 包含所有章节"

# 验证状态文件
grep -q "discovered" .sdd/specs-tree-root/test-discovery-feature/.sdd-state && echo "✓ 状态已更新"
```

---

## 进度追踪表

| 任务 ID | 任务名称 | 复杂度 | 波次 | 状态 | 开始日期 | 完成日期 | 负责人 |
|---------|----------|--------|------|------|----------|----------|--------|
| TASK-001 | 创建 Discovery Agent 定义文件 | M | 1 | ⬜ 待开始 | - | - | - |
| TASK-002 | 实现 7 步工作流逻辑 | L | 2 | ⬜ 待开始 | - | - | - |
| TASK-003 | 实现辅导模式 | M | 2 | ⬜ 待开始 | - | - | - |
| TASK-004 | 更新状态机添加 discovered 状态 | M | 1 | ⬜ 待开始 | - | - | - |
| TASK-005 | 更新智能入口添加 discovery 命令 | M | 3 | ⬜ 待开始 | - | - | - |
| TASK-006 | 更新 opencode.json 配置 | S | 2 | ⬜ 待开始 | - | - | - |
| TASK-007 | 更新 README.md 文档 | S | 3 | ⬜ 待开始 | - | - | - |
| TASK-008 | 更新安装脚本 | S | 3 | ⬜ 待开始 | - | - | - |
| TASK-009 | 测试 discovery 功能 | L | 4 | ⬜ 待开始 | - | - | - |

### 状态图例

| 符号 | 含义 |
|------|------|
| ⬜ | 待开始 (Pending) |
| 🔄 | 进行中 (In Progress) |
| ✅ | 已完成 (Completed) |
| ⏸️ | 已阻塞 (Blocked) |
| ❌ | 已取消 (Cancelled) |

---

## 执行顺序建议

### Wave 1（并行执行）
```bash
# 可并行执行的任务
TASK-001  # 创建 Discovery Agent 定义文件
TASK-004  # 更新状态机添加 discovered 状态
```

### Wave 2（依赖 Wave 1 完成）
```bash
# 依赖 TASK-001
TASK-002  # 实现 7 步工作流逻辑
TASK-006  # 更新 opencode.json 配置

# 依赖 TASK-002
TASK-003  # 实现辅导模式
```

### Wave 3（依赖 Wave 2 完成）
```bash
# 依赖 TASK-004
TASK-005  # 更新智能入口添加 discovery 命令

# 依赖 TASK-005
TASK-007  # 更新 README.md 文档

# 依赖 TASK-001
TASK-008  # 更新安装脚本
```

### Wave 4（依赖 Wave 3 完成）
```bash
# 依赖 TASK-002, TASK-005
TASK-009  # 测试 discovery 功能
```

---

## 下一步

👉 运行 `@sdd-build TASK-001` 开始实现第一个任务

```bash
/tool sdd_update_state {"feature": "specs-tree-sdd-discovery-feature", "state": "tasked"}
```

---

**文档状态**: tasked  
**创建日期**: 2026-04-03  
**下一步**: 运行 `@sdd-build TASK-001` 开始实现
