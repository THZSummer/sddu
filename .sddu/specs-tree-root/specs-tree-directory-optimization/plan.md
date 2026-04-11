# specs-tree-root 管理目录结构命名优化技术规划

## 元数据

| 字段 | 值 |
|------|-----|
| **Feature ID** | FR-DIR-001 |
| **Feature 名称** | specs-tree-root 管理目录结构命名优化 |
| **创建日期** | 2026-04-01 |
| **作者** | SDD 技术规划专家 |
| **优先级** | P0 - 紧急 |
| **状态** | planned |
| **版本** | 1.0.0 |

---

## 1. 架构概述

### 1.1 核心目标

**解决 Agent 对目录的认知问题，让 Agent 按 TREE.md 规范执行**。

当前问题的根本原因：
- Agent 通过模板文件（`.hbs`）学习目录结构
- 模板文件使用旧路径 `.specs/`，导致 Agent 继续生成旧路径
- 即使核心运行时代码更新，Agent 仍按模板提示词行动

**解决策略**：按优先级分层更新
1. **P0-最高**：Agent 模板文件（认知层）- 11 个文件
2. **P1-高**：核心运行时代码（运行时层）- 5 个文件
3. **P2-中**：测试文件（验证层）- 8 个文件

### 1.2 目录结构认知模型

```
┌─────────────────────────────────────────────────────────┐
│  Agent 认知层（模板文件 - P0）                           │
├─────────────────────────────────────────────────────────┤
│  src/templates/agents/*.hbs (11 个)                      │
│  - sdd.md.hbs           - 主入口                        │
│  - sdd-spec.md.hbs      - 规范编写                      │
│  - sdd-plan.md.hbs      - 技术规划                      │
│  - sdd-tasks.md.hbs     - 任务分解                      │
│  - sdd-build.md.hbs     - 任务实现                      │
│  - sdd-review.md.hbs    - 代码审查                      │
│  - sdd-validate.md.hbs  - 最终验证                      │
│  - sdd-docs.md.hbs      - 目录导航                      │
│  - sdd-roadmap.md.hbs   - Roadmap 规划                  │
│  - sdd-help.md.hbs      - 帮助文档                      │
│  └─ 每个模板包含路径提示词，决定 Agent 认知             │
└─────────────────────────────────────────────────────────┘
                          ↓ 指导
┌─────────────────────────────────────────────────────────┐
│  核心运行时层（.ts 代码 - P1）                           │
├─────────────────────────────────────────────────────────┤
│  src/state/machine.ts         - 状态机                  │
│  src/state/schema-v1.2.5.ts   - Schema 定义             │
│  src/state/migrator.ts        - 迁移器                  │
│  src/utils/subfeature-manager.ts - 子功能管理           │
│  src/index.ts                 - 插件入口                │
│  └─ 实现实际的路径处理逻辑                             │
└─────────────────────────────────────────────────────────┘
                          ↓ 验证
┌─────────────────────────────────────────────────────────┐
│  测试验证层（.test.ts - P2）                             │
├─────────────────────────────────────────────────────────┤
│  8 个测试文件，验证上述代码正确性                        │
└─────────────────────────────────────────────────────────┘
```

### 1.3 路径常量统一定义

```typescript
// 建议新增专用常量文件：src/constants/paths.ts
export const SDD_DIR = '.sdd';
export const SPECS_ROOT = 'specs-tree-root';
export const SPECS_PREFIX = 'specs-tree-';
export const TREE_MD = 'TREE.md';

// 辅助函数
export function getSpecsPath(featureName: string): string {
  return `${SDD_DIR}/${SPECS_ROOT}/${SPECS_PREFIX}${kebabCase(featureName)}`;
}
```

---

## 2. 技术方案对比

### 方案 A：渐进式更新（推荐）

**描述**：按优先级分层更新，先更新 Agent 模板，再更新核心代码，最后更新测试。

**优点**：
- ✅ 风险分散，每层独立验证
- ✅ 可快速验证 Agent 认知是否更新
- ✅ 问题定位清晰
- ✅ 符合认知逻辑（先改变认知，再改变行为）

**缺点**：
- ❌ 需要多轮测试验证
- ❌ 总体时间稍长

**风险评估**：低
- 每层更新后可独立验证
- 发现问题可快速回滚单层

**预估工作量**：4 天

### 方案 B：一次性全面更新

**描述**：同时更新所有 24 个文件，然后统一测试。

**优点**：
- ✅ 一次性完成，无需多次切换上下文
- ✅ 总体时间可能更短

**缺点**：
- ❌ 风险集中，问题难定位
- ❌ 回滚成本高
- ❌ 测试失败时难以判断哪层有问题

**风险评估**：高
- 一旦出现问题，影响范围广
- 回滚需要恢复所有文件

**预估工作量**：2.5 天

### 方案 C：双轨并行（模板 + 运行时同时更新）

**描述**：P0 和 P1 层同时更新，P2 层后续更新。

**优点**：
- ✅ 平衡风险和效率
- ✅ 核心功能快速更新

**缺点**：
- ❌ 需要协调两层更新进度
- ❌ 测试验证复杂

**风险评估**：中

**预估工作量**：3 天

### 推荐方案：方案 A（渐进式更新）

**理由**：
1. **符合认知逻辑**：Agent 先学习新规范，再执行新行为
2. **风险可控**：每层独立验证，问题易定位
3. **便于回滚**：单层问题不影响其他层
4. **符合 spec.md 优先级**：spec 明确要求按 P0→P1→P2 顺序

---

## 3. 详细修改方案

### 3.1 P0 阶段：Agent 模板文件（11 个）

#### 3.1.1 sdd.md.hbs（主入口）

**文件路径**：`src/templates/agents/sdd.md.hbs`

**修改位置**：7 处

```diff
# 修改 1：第 25 行 - 状态检查
- 3. 检查 `.sdd/.specs/[feature]/` 下的文件是否存在
+ 3. 检查 `.sdd/specs-tree-root/[feature]/` 下的文件是否存在

# 修改 2-4：第 53-55 行 - 跳转保护验证表
- | plan | specified | `.sdd/.specs/[feature]/spec.md` |
+ | plan | specified | `.sdd/specs-tree-root/[feature]/spec.md` |

- | tasks | planned | `.sdd/.specs/[feature]/plan.md` |
+ | tasks | planned | `.sdd/specs-tree-root/[feature]/plan.md` |

- | build | tasked | `.sdd/.specs/[feature]/tasks.md` |
+ | build | tasked | `.sdd/specs-tree-root/[feature]/tasks.md` |

# 修改 5：第 149 行 - 命令列表
- | `@sdd spec [name]` | 规范编写 | 无（起点） |
+ （路径隐含在描述中，无需修改）

# 修改 6-7：第 154-156 行 - 流程说明
- spec → plan → tasks → build → review → validate
+ （流程不变，路径在上下文中体现）
```

**预期效果**：Agent 主入口正确识别新目录路径。

#### 3.1.2 sdd-spec.md.hbs（规范编写）

**文件路径**：`src/templates/agents/sdd-spec.md.hbs`

**修改位置**：3 处

```diff
# 修改 1：第 21 行 - 依赖关系
- - **输出**: `.sdd/.specs/[feature]/spec.md`, `.sdd/.specs/[feature]/spec.json`
+ - **输出**: `.sdd/specs-tree-root/[feature]/spec.md`, `.sdd/specs-tree-root/[feature]/spec.json`

# 修改 2：第 31 行 - 前置验证
- 1. 检查 `.sdd/.specs/[feature]/` 目录是否存在
+ 1. 检查 `.sdd/specs-tree-root/[feature]/` 目录是否存在

# 修改 3：第 98 行 - 输出格式
- **文件**: `.sdd/.specs/[feature]/spec.md`
+ **文件**: `.sdd/specs-tree-root/[feature]/spec.md`
```

**预期效果**：spec agent 正确创建和读取新路径。

#### 3.1.3 sdd-plan.md.hbs（技术规划）

**文件路径**：`src/templates/agents/sdd-plan.md.hbs`

**修改位置**：6 处

```diff
# 修改 1-2：第 20-23 行 - 依赖关系
- - ✅ `.sdd/.specs/[feature]/spec.md`（@sdd-spec 输出）
+ - ✅ `.sdd/specs-tree-root/[feature]/spec.md`（@sdd-spec 输出）

- - **输入**: `.sdd/.specs/[feature]/spec.md`
+ - **输入**: `.sdd/specs-tree-root/[feature]/spec.md`

- - **输出**: `.sdd/.specs/[feature]/plan.md`, `.sdd/.specs/architecture/adr/ADR-XXX.md`
+ - **输出**: `.sdd/specs-tree-root/[feature]/plan.md`, `.sdd/specs-tree-root/architecture/adr/ADR-XXX.md`

# 修改 3：第 32 行 - 前置验证
- 1. 检查 `.sdd/.specs/[feature]/spec.md` 是否存在
+ 1. 检查 `.sdd/specs-tree-root/[feature]/spec.md` 是否存在

# 修改 4：第 36 行 - 重要规则
- **重要规则**：如果 spec.md 缺失，**必须拒绝执行**并告知用户先完成 Spec 阶段。
+ （规则不变，路径在上下文中体现）

# 修改 5-6：第 82, 108 行 - 输出格式
- **文件**: `.sdd/.specs/[feature]/plan.md`
+ **文件**: `.sdd/specs-tree-root/[feature]/plan.md`
```

**预期效果**：plan agent 正确读取 spec 并创建 plan。

#### 3.1.4 sdd-tasks.md.hbs（任务分解）

**文件路径**：`src/templates/agents/sdd-tasks.md.hbs`

**修改位置**：6 处

```diff
# 修改 1-4：第 20-23 行 - 依赖关系
- - ✅ `.sdd/.specs/[feature]/spec.md`
+ - ✅ `.sdd/specs-tree-root/[feature]/spec.md`

- - ✅ `.sdd/.specs/[feature]/plan.md`
+ - ✅ `.sdd/specs-tree-root/[feature]/plan.md`

- - **输入**: `.sdd/.specs/[feature]/plan.md`
+ - **输入**: `.sdd/specs-tree-root/[feature]/plan.md`

- - **输出**: `.sdd/.specs/[feature]/tasks.md`
+ - **输出**: `.sdd/specs-tree-root/[feature]/tasks.md`

# 修改 5-6：第 32-33, 37 行 - 前置验证
- 1. 检查 `.sdd/.specs/[feature]/plan.md` 是否存在
+ 1. 检查 `.sdd/specs-tree-root/[feature]/plan.md` 是否存在

# 修改 7-8：第 97, 127-128 行 - 输出格式
- **文件**: `.sdd/.specs/[feature]/tasks.md`
+ **文件**: `.sdd/specs-tree-root/[feature]/tasks.md`
```

**预期效果**：tasks agent 正确读取 plan 并创建 tasks。

#### 3.1.5 sdd-build.md.hbs（任务实现）

**文件路径**：`src/templates/agents/sdd-build.md.hbs`

**修改位置**：5 处

```diff
# 修改 1-4：第 20-23 行 - 依赖关系
- - ✅ `.sdd/.specs/[feature]/tasks.md`
+ - ✅ `.sdd/specs-tree-root/[feature]/tasks.md`

# 修改 5：第 34 行 - 前置验证
- 检查 `.sdd/.specs/[feature]/tasks.md`
+ 检查 `.sdd/specs-tree-root/[feature]/tasks.md`

# 修改 6-7：第 44, 66 行 - 输出格式
- 实现代码并更新状态
+ （路径在上下文中体现）
```

**预期效果**：build agent 正确读取 tasks 并实现代码。

#### 3.1.6 sdd-review.md.hbs（代码审查）

**文件路径**：`src/templates/agents/sdd-review.md.hbs`

**修改位置**：5 处

```diff
# 修改 1-3：第 20-22 行 - 依赖关系
- - ✅ `.sdd/.specs/[feature]/` 下的代码实现
+ - ✅ `.sdd/specs-tree-root/[feature]/` 下的代码实现

# 修改 4-5：第 41, 53 行 - 前置验证
- 检查代码实现和 tasks.md
+ （路径在上下文中体现）

# 修改 6-7：第 64-66 行 - 输出格式
- 生成 review.md 到 `.sdd/.specs/[feature]/`
+ 生成 review.md 到 `.sdd/specs-tree-root/[feature]/`
```

**预期效果**：review agent 正确审查代码。

#### 3.1.7 sdd-validate.md.hbs（最终验证）

**文件路径**：`src/templates/agents/sdd-validate.md.hbs`

**修改位置**：6 处

```diff
# 修改 1-2：第 20, 23 行 - 依赖关系
- - ✅ `.sdd/.specs/[feature]/review.md`
+ - ✅ `.sdd/specs-tree-root/[feature]/review.md`

# 修改 3-4：第 34, 44 行 - 前置验证
- 检查 review 通过
+ （路径在上下文中体现）

# 修改 5-6：第 82, 186 行 - 输出格式
- 生成 validation.md
+ （路径在上下文中体现）
```

**预期效果**：validate agent 正确验证功能。

#### 3.1.8 sdd-docs.md.hbs（目录导航）

**文件路径**：`src/templates/agents/sdd-docs.md.hbs`

**修改位置**：6 处

```diff
# 修改 1：第 31 行 - 扫描路径
- 扫描 `.sdd/.specs/` 目录
+ 扫描 `.sdd/specs-tree-root/` 目录

# 修改 2-4：第 48-50 行 - 生成逻辑
- 读取 `.sdd/.specs/[feature]/README.md`
+ 读取 `.sdd/specs-tree-root/[feature]/README.md`

# 修改 5-6：第 136-137, 140 行 - 输出路径
- 生成导航到 `.sdd/README.md`
+ （路径在上下文中体现）

# 修改 7-8：第 145, 159-161 行 - 验证逻辑
- 验证 `.sdd/.specs/` 下文件
+ 验证 `.sdd/specs-tree-root/` 下文件
```

**预期效果**：docs agent 正确生成目录导航。

#### 3.1.9 sdd-roadmap.md.hbs（Roadmap 规划）

**文件路径**：`src/templates/agents/sdd-roadmap.md.hbs`

**修改位置**：6 处

```diff
# 修改 1-2：第 35-36 行 - 读取路径
- 读取 `.sdd/.specs/ROADMAP.md`
+ 读取 `.sdd/specs-tree-root/ROADMAP.md`

# 修改 3：第 62 行 - 保存路径
- 保存到 `.sdd/.specs/ROADMAP.md`
+ 保存到 `.sdd/specs-tree-root/ROADMAP.md`

# 修改 4-6：第 75-78 行 - 依赖关系
- 扫描 `.sdd/.specs/` 下 specs
+ 扫描 `.sdd/specs-tree-root/` 下 specs

# 修改 7-8：第 100, 102 行 - 输出格式
- 更新 ROADMAP.md
+ （路径在上下文中体现）
```

**预期效果**：roadmap agent 正确读取和更新 Roadmap。

#### 3.1.10 sdd-help.md.hbs（帮助文档）

**文件路径**：`src/templates/agents/sdd-help.md.hbs`

**修改位置**：2 处

```diff
# 修改 1-2：第 96-98 行 - 目录结构说明
- `.sdd/.specs/[feature]/`
+ `.sdd/specs-tree-root/[feature]/`

# 修改 3：第 112 行 - 文件列表
- spec.md, plan.md, tasks.md 在 `.sdd/.specs/[feature]/`
+ spec.md, plan.md, tasks.md 在 `.sdd/specs-tree-root/[feature]/`
```

**预期效果**：help agent 正确显示帮助信息。

#### 3.1.11 subfeature-templates.ts（子功能模板）

**文件路径**：`src/templates/subfeature-templates.ts`

**修改位置**：1 处

```diff
# 修改 1：第 252 行 - 目录结构注释
- .specs/
+ specs-tree-root/

  └─ ${template.featureId}/
      ├─ spec.md
```

**预期效果**：子功能模板生成正确路径。

---

### 3.2 P1 阶段：核心运行时代码（5 个）

#### 3.2.1 machine.ts（状态机）

**文件路径**：`src/state/machine.ts`

**修改位置**：1 处

```diff
# 修改 1：第 52 行 - 构造函数默认参数
- constructor(private specsDir: string = '.specs') {
+ constructor(private specsDir: string = 'specs-tree-root') {
```

**影响范围**：
- 状态机初始化时使用新路径
- 所有状态文件读写路径变更

**回归测试建议**：
- 测试状态创建
- 测试状态加载
- 测试状态保存

#### 3.2.2 schema-v1.2.5.ts（Schema 定义）

**文件路径**：`src/state/schema-v1.2.5.ts`

**修改位置**：4 处

```diff
# 修改 1-4：第 188-191 行 - createInitialState 函数
- files: {
-   spec: `.specs/${feature}/spec.md`,
-   plan: `.specs/${feature}/plan.md`,
-   tasks: `.specs/${feature}/tasks.md`,
-   readme: `.specs/${feature}/README.md`
- }
+ files: {
+   spec: `specs-tree-root/${feature}/spec.md`,
+   plan: `specs-tree-root/${feature}/plan.md`,
+   tasks: `specs-tree-root/${feature}/tasks.md`,
+   readme: `specs-tree-root/${feature}/README.md`
+ }
```

**影响范围**：
- 新创建的状态对象使用新路径
- 文件路径验证使用新路径

**回归测试建议**：
- 测试 createInitialState 函数
- 测试 validateState 函数
- 测试 isMultiMode 函数

#### 3.2.3 migrator.ts（迁移器）

**文件路径**：`src/state/migrator.ts`

**修改位置**：1 处

```diff
# 修改 1：第 52 行 - 路径拼接
- stateFile: `.specs/${oldState.feature || 'main'}/.state.json`
+ stateFile: `specs-tree-root/${oldState.feature || 'main'}/.state.json`
```

**影响范围**：
- 状态迁移时使用新路径
- 备份和回滚路径变更

**回归测试建议**：
- 测试 migrateFrom111 函数
- 测试 backupState 函数
- 测试 rollbackState 函数

#### 3.2.4 subfeature-manager.ts（子功能管理）

**文件路径**：`src/utils/subfeature-manager.ts`

**修改位置**：1 处

```diff
# 修改 1：第 246 行 - 路径常量
- const specsDir = '.specs';
+ const specsDir = 'specs-tree-root';
```

**影响范围**：
- 子功能目录创建使用新路径
- 子功能扫描使用新路径

**回归测试建议**：
- 测试 detectFeatureMode 函数
- 测试 createSubFeature 函数
- 测试 generateSubFeatureIndex 函数

#### 3.2.5 index.ts（插件入口）

**文件路径**：`src/index.ts`

**修改位置**：1 处

```diff
# 修改 1：第 27 行 - 路径检查
- if (input.filePath.includes(".specs/")) {
+ if (input.filePath.includes("specs-tree-root/")) {
```

**影响范围**：
- 文件编辑监听使用新路径
- 日志记录使用新路径

**回归测试建议**：
- 测试插件加载
- 测试文件编辑监听

---

### 3.3 P2 阶段：测试文件（8 个）

#### 3.3.1 schema-v1.2.5.test.ts

**文件路径**：`src/state/schema-v1.2.5.test.ts`

**修改位置**：8 处

```diff
# 修改 1-4：第 64-67 行 - 测试路径常量
- spec: `.specs/test-feature/spec.md`
+ spec: `specs-tree-root/test-feature/spec.md`

# 修改 5-6：第 79, 86 行 - 测试验证
- expect(state.files.spec).toBe('.specs/test-feature/spec.md')
+ expect(state.files.spec).toBe('specs-tree-root/test-feature/spec.md')

# 修改 7-8：第 254-257 行 - 测试状态创建
- 路径断言使用 `.specs/`
+ 路径断言使用 `specs-tree-root/`
```

**预期测试结果**：所有测试通过。

#### 3.3.2 migrator.test.ts

**文件路径**：`src/state/migrator.test.ts`

**修改位置**：2 处

```diff
# 修改 1-2：第 57, 73 行 - 测试路径
- 路径常量使用 `.specs`
+ 路径常量使用 `specs-tree-root`
```

**预期测试结果**：所有测试通过。

#### 3.3.3 subfeature-manager.test.ts

**文件路径**：`src/utils/subfeature-manager.test.ts`

**修改位置**：2 处

```diff
# 修改 1-2：第 237, 254 行 - 测试路径拼接
- 路径常量使用 `.specs`
+ 路径常量使用 `specs-tree-root`
```

**预期测试结果**：所有测试通过。

#### 3.3.4 其他测试文件（5 个）

需要检查并更新（如果需要）：
- `src/state/multi-feature-manager.test.ts`
- `src/utils/dependency-notifier.test.ts`
- `src/utils/tasks-parser.test.ts`
- `src/utils/readme-generator.test.ts`
- `src/templates/subfeature-templates.test.ts`

**检查方法**：搜索 `.specs` 字符串，确认是否需要更新。

---

## 4. 目录迁移脚本设计

### 4.1 迁移脚本

```bash
#!/bin/bash
# specs-directory-migration.sh
# 功能：将 .sdd/.specs/ 重命名为 .sdd/specs-tree-root/
#       并将子目录添加 specs-tree- 前缀

set -e

SDD_DIR=".sdd"
OLD_SPECS_DIR="$SDD_DIR/.specs"
NEW_SPECS_DIR="$SDD_DIR/specs-tree-root"

echo "=== SDD 目录结构迁移脚本 ==="
echo ""

# 前置检查
echo "[检查] 验证项目根目录 src/ 存在..."
if [ ! -d "src" ]; then
    echo "❌ 错误：项目根目录 src/ 不存在"
    exit 1
fi
echo "✅ 项目根目录 src/ 存在"
echo ""

# 阶段 0: 备份
echo "[备份] 创建 .sdd 目录备份..."
cp -r "$SDD_DIR" "$SDD_DIR.backup.$(date +%Y%m%d_%H%M%S)"
echo "✅ 备份完成"
echo ""

# 阶段 1: 根目录重命名
echo "[阶段 1] 重命名根目录：$OLD_SPECS_DIR → $NEW_SPECS_DIR"
mv "$OLD_SPECS_DIR" "$NEW_SPECS_DIR"
echo "✅ 完成"
echo ""

# 阶段 2: 子目录重命名
echo "[阶段 2] 重命名子目录（添加 specs-tree- 前缀）..."
cd "$NEW_SPECS_DIR"

declare -A DIR_MAP=(
    ["architecture"]="specs-tree-architecture"
    ["deprecate-sdd-tools"]="specs-tree-deprecate-sdd-tools"
    ["feature-readme-template"]="specs-tree-feature-readme-template"
    ["roadmap-update"]="specs-tree-roadmap-update"
    ["sdd-multi-module"]="specs-tree-sdd-multi-module"
    ["sdd-plugin-baseline"]="specs-tree-sdd-plugin-baseline"
    ["sdd-plugin-phase2"]="specs-tree-sdd-plugin-phase2"
    ["sdd-plugin-roadmap"]="specs-tree-sdd-plugin-roadmap"
    ["sdd-tools-optimization"]="specs-tree-sdd-tools-optimization"
    ["sdd-workflow-state-optimization"]="specs-tree-sdd-workflow-state-optimization"
)

for old_name in "${!DIR_MAP[@]}"; do
    new_name="${DIR_MAP[$old_name]}"
    if [ -d "$old_name" ]; then
        echo "  迁移：$old_name → $new_name"
        mv "$old_name" "$new_name"
    fi
done
echo "✅ 完成"
echo ""

# 阶段 3: 删除指定目录
echo "[阶段 3] 删除目录..."
rm -rf ".templates" "examples"
echo "  已删除：.templates/, examples/"
echo "✅ 完成"
echo ""

# 阶段 4: 迁移文件
echo "[阶段 4] 迁移文件..."
if [ -f "$SDD_DIR/ROADMAP.md" ]; then
    mv "$SDD_DIR/ROADMAP.md" "$NEW_SPECS_DIR/ROADMAP.md"
    echo "  迁移：$SDD_DIR/ROADMAP.md → $NEW_SPECS_DIR/ROADMAP.md"
fi
echo "✅ 完成"
echo ""

# 阶段 5: 删除临时目录
echo "[阶段 5] 删除 .sdd 根目录临时目录..."
rm -rf "$SDD_DIR/docs" "$SDD_DIR/src" "$SDD_DIR/tests"
echo "  已删除：docs/, src/, tests/"
echo "✅ 完成"
echo ""

# 验证
echo "[验证] 检查迁移结果..."
cd - > /dev/null
if [ -d "$NEW_SPECS_DIR" ]; then
    echo "✅ $NEW_SPECS_DIR 存在"
    count=$(ls -1 "$NEW_SPECS_DIR" | grep "^specs-tree-" | wc -l)
    echo "✅ 发现 $count 个 specs-tree-* 目录"
else
    echo "❌ 错误：$NEW_SPECS_DIR 不存在"
    exit 1
fi
echo ""

echo "=== 迁移完成 ==="
echo ""
echo "后续步骤："
echo "1. 运行 @sdd-docs 更新目录导航"
echo "2. 检查 .sdd/README.md 是否需要手动更新"
echo "3. 如果有问题，可以使用备份恢复："
echo "   cp -r $SDD_DIR.backup.* $SDD_DIR"
```

### 4.2 回滚脚本

```bash
#!/bin/bash
# rollback-migration.sh

SDD_DIR=".sdd"
BACKUP_DIR=$(ls -1td $SDD_DIR.backup.* | head -n 1)

if [ -z "$BACKUP_DIR" ]; then
    echo "❌ 错误：未找到备份目录"
    exit 1
fi

echo "回滚到：$BACKUP_DIR"
rm -rf "$SDD_DIR"
mv "$BACKUP_DIR" "$SDD_DIR"
echo "✅ 回滚完成"
```

---

## 5. 实施计划

### 阶段 0: 准备（0.5 天）

- [ ] 创建 Git 分支：`feature/specs-tree-directory-optimization`
- [ ] 备份 `.sdd` 目录
- [ ] 通知团队成员迁移计划
- [ ] 确认项目根目录 `src/` 存在且完整
- [ ] 确认项目根目录有测试文件
- [ ] 备份 `.sdd/docs/INSTALL.md` 内容（如果有价值）

### 阶段 1: Agent 模板更新（1 天）

- [ ] 更新 `sdd.md.hbs`（7 处）
- [ ] 更新 `sdd-spec.md.hbs`（3 处）
- [ ] 更新 `sdd-plan.md.hbs`（6 处）
- [ ] 更新 `sdd-tasks.md.hbs`（6 处）
- [ ] 更新 `sdd-build.md.hbs`（5 处）
- [ ] 更新 `sdd-review.md.hbs`（5 处）
- [ ] 更新 `sdd-validate.md.hbs`（6 处）
- [ ] 更新 `sdd-docs.md.hbs`（6 处）
- [ ] 更新 `sdd-roadmap.md.hbs`（6 处）
- [ ] 更新 `sdd-help.md.hbs`（2 处）
- [ ] 更新 `subfeature-templates.ts`（1 处）
- [ ] 验证模板语法（无 Handlebars 编译错误）
- [ ] 运行简单测试

### 阶段 2: 核心运行时更新（1 天）

- [ ] 更新 `machine.ts`（1 处）
- [ ] 更新 `schema-v1.2.5.ts`（4 处）
- [ ] 更新 `migrator.ts`（1 处）
- [ ] 更新 `subfeature-manager.ts`（1 处）
- [ ] 更新 `index.ts`（1 处）
- [ ] 运行 TypeScript 编译
- [ ] 修复编译错误

### 阶段 3: 测试文件更新（0.5 天）

- [ ] 更新 `schema-v1.2.5.test.ts`（8 处）
- [ ] 更新 `migrator.test.ts`（2 处）
- [ ] 更新 `subfeature-manager.test.ts`（2 处）
- [ ] 检查并更新其他 5 个测试文件
- [ ] 运行测试套件
- [ ] 确保测试通过

### 阶段 4: 目录迁移（0.5 天）

- [ ] 运行迁移脚本
- [ ] 验证目录结构
- [ ] 运行 `@sdd-docs` 更新目录导航
- [ ] 检查 `.sdd/README.md` 是否需要手动更新

### 阶段 5: 验证与发布（0.5 天）

- [ ] 完整功能测试
  - [ ] @sdd-spec 可正常创建新 specs
  - [ ] @sdd-plan 可正常读取 specs
  - [ ] @sdd-tasks 可正常生成任务
  - [ ] @sdd-build 可正常执行构建
  - [ ] @sdd-review 可正常执行审查
  - [ ] @sdd-validate 可正常执行验证
  - [ ] @sdd-docs 可正常生成导航
  - [ ] @sdd-roadmap 可正常读取 roadmap
  - [ ] @sdd-help 可正常显示帮助信息
- [ ] 代码审查
- [ ] 合并到主分支
- [ ] 发布新版本

**总计**: 4 天

---

## 6. 风险评估与缓解

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 模板更新不完整 | 中 | 高 | 创建检查清单，逐文件验收 |
| 代码编译失败 | 中 | 中 | 分步编译，及时修复 |
| 测试失败 | 高 | 中 | 预留修复时间 |
| 目录迁移丢失数据 | 低 | 高 | 完整备份，可回滚 |
| Agent 行为异常 | 中 | 高 | 充分测试，灰度发布 |
| 路径引用遗漏 | 中 | 高 | 使用 grep 全面搜索 `.specs/` |
| 跨目录引用失效 | 中 | 中 | 运行查找替换脚本更新路径 |
| 团队成员未通知 | 低 | 中 | 提前邮件/消息通知 |

### 风险缓解详细措施

#### 6.1 模板更新不完整

**缓解措施**：
1. 创建详细检查清单（见附录 A）
2. 使用 grep 搜索确认：`grep -r "\.specs/" src/templates/`
3. 逐文件验收，双人复核

#### 6.2 目录迁移丢失数据

**缓解措施**：
1. 迁移前完整备份：`cp -r .sdd .sdd.backup.YYYYMMDD_HHMMSS`
2. 迁移脚本自带验证步骤
3. 提供一键回滚脚本

#### 6.3 Agent 行为异常

**缓解措施**：
1. 分阶段验证（P0→P1→P2）
2. 每阶段完成后运行功能测试
3. 发现问题立即回滚该层

---

## 7. 测试策略

### 7.1 单元测试

**测试目标**：验证路径常量更新正确。

| 测试项 | 测试内容 | 预期结果 |
|--------|----------|----------|
| 路径常量测试 | `SPECS_ROOT` = `'specs-tree-root'` | 通过 |
| 路径拼接测试 | `getSpecsPath('test')` = `'specs-tree-root/test'` | 通过 |
| 目录创建逻辑测试 | 创建目录自动添加前缀 | 通过 |
| 状态机流转测试 | 状态文件写入新路径 | 通过 |

### 7.2 集成测试

**测试目标**：验证完整工作流正确。

| 测试项 | 测试内容 | 预期结果 |
|--------|----------|----------|
| 完整工作流测试 | spec → plan → tasks → build → review → validate | 所有阶段通过 |
| 多 Feature 并发测试 | 同时处理多个 feature | 无路径冲突 |
| 子 Feature 管理测试 | 创建和管理子 feature | 路径正确 |

### 7.3 验收测试

**测试目标**：验证用户可见功能正确。

| 测试项 | 验收标准 |
|--------|----------|
| 新创建的 specs 目录 | 自动带 `specs-tree-` 前缀 |
| Agent 读取现有 specs | 能正确读取 `specs-tree-root/` 下 specs |
| 目录导航生成 | @sdd-docs 正确生成导航 |
| 模板语法验证 | 无 Handlebars 编译错误 |
| TypeScript 编译 | 无类型错误 |

---

## 8. 文件影响分析

### 8.1 需要修改的文件（24 个）

#### P0-最高优先级（11 个）
```
- [MODIFY] src/templates/agents/sdd.md.hbs (7 处)
- [MODIFY] src/templates/agents/sdd-spec.md.hbs (3 处)
- [MODIFY] src/templates/agents/sdd-plan.md.hbs (6 处)
- [MODIFY] src/templates/agents/sdd-tasks.md.hbs (6 处)
- [MODIFY] src/templates/agents/sdd-build.md.hbs (5 处)
- [MODIFY] src/templates/agents/sdd-review.md.hbs (5 处)
- [MODIFY] src/templates/agents/sdd-validate.md.hbs (6 处)
- [MODIFY] src/templates/agents/sdd-docs.md.hbs (6 处)
- [MODIFY] src/templates/agents/sdd-roadmap.md.hbs (6 处)
- [MODIFY] src/templates/agents/sdd-help.md.hbs (2 处)
- [MODIFY] src/templates/subfeature-templates.ts (1 处)
```

#### P1-高优先级（5 个）
```
- [MODIFY] src/state/machine.ts (1 处)
- [MODIFY] src/state/schema-v1.2.5.ts (4 处)
- [MODIFY] src/state/migrator.ts (1 处)
- [MODIFY] src/utils/subfeature-manager.ts (1 处)
- [MODIFY] src/index.ts (1 处)
```

#### P2-中优先级（8 个）
```
- [MODIFY] src/state/schema-v1.2.5.test.ts (8 处)
- [MODIFY] src/state/migrator.test.ts (2 处)
- [MODIFY] src/utils/subfeature-manager.test.ts (2 处)
- [MODIFY] src/state/multi-feature-manager.test.ts (待检查)
- [MODIFY] src/utils/dependency-notifier.test.ts (待检查)
- [MODIFY] src/utils/tasks-parser.test.ts (待检查)
- [MODIFY] src/utils/readme-generator.test.ts (待检查)
- [MODIFY] src/templates/subfeature-templates.test.ts (待检查)
```

### 8.2 需要迁移的目录（13 个）

```
- [RENAME] .sdd/.specs/ → .sdd/specs-tree-root/
- [RENAME] .sdd/.specs/architecture/ → .sdd/specs-tree-root/specs-tree-architecture/
- [RENAME] .sdd/.specs/deprecate-sdd-tools/ → .sdd/specs-tree-root/specs-tree-deprecate-sdd-tools/
- [RENAME] .sdd/.specs/feature-readme-template/ → .sdd/specs-tree-root/specs-tree-feature-readme-template/
- [RENAME] .sdd/.specs/roadmap-update/ → .sdd/specs-tree-root/specs-tree-roadmap-update/
- [RENAME] .sdd/.specs/sdd-multi-module/ → .sdd/specs-tree-root/specs-tree-sdd-multi-module/
- [RENAME] .sdd/.specs/sdd-plugin-baseline/ → .sdd/specs-tree-root/specs-tree-sdd-plugin-baseline/
- [RENAME] .sdd/.specs/sdd-plugin-phase2/ → .sdd/specs-tree-root/specs-tree-sdd-plugin-phase2/
- [RENAME] .sdd/.specs/sdd-plugin-roadmap/ → .sdd/specs-tree-root/specs-tree-sdd-plugin-roadmap/
- [RENAME] .sdd/.specs/sdd-tools-optimization/ → .sdd/specs-tree-root/specs-tree-sdd-tools-optimization/
- [RENAME] .sdd/.specs/sdd-workflow-state-optimization/ → .sdd/specs-tree-root/specs-tree-sdd-workflow-state-optimization/
- [DELETE] .sdd/.specs/.templates/
- [DELETE] .sdd/.specs/examples/
```

### 8.3 需要删除的目录（3 个）

```
- [DELETE] .sdd/docs/
- [DELETE] .sdd/src/
- [DELETE] .sdd/tests/
```

### 8.4 需要迁移的文件（1 个）

```
- [MOVE] .sdd/ROADMAP.md → .sdd/specs-tree-root/ROADMAP.md
```

---

## 9. 开放问题

| ID | 问题 | 负责人 | 状态 | 决策 |
|------|------|--------|------|------|
| OQ-001 | `architecture/archive/` 内容是否需要保留？ | 待定 | 待决策 | 评估后决定 |
| OQ-002 | 是否需要为旧目录名创建软链接兼容期？ | 待定 | 待讨论 | 不创建，直接迁移 |
| OQ-003 | 是否需要更新 CI/CD 中的路径配置？ | 待定 | 待调研 | 迁移后检查 |

---

## 10. 验收标准

### 10.1 Agent 模板验收（P0）

- [ ] 11 个模板文件中所有 `.specs/` 路径已更新为 `specs-tree-root/`
- [ ] 所有模板文件语法正确，无 Handlebars 编译错误
- [ ] grep 搜索确认无遗漏：`grep -r "\.specs/" src/templates/` 返回空

### 10.2 核心运行时验收（P1）

- [ ] 5 个核心文件编译通过，无 TypeScript 错误
- [ ] 路径常量正确：`specs-tree-root`
- [ ] grep 搜索确认无遗漏：`grep -r "\.specs/" src/state/ src/utils/ src/index.ts` 返回空

### 10.3 测试文件验收（P2）

- [ ] 8 个测试文件路径已更新
- [ ] 所有测试用例运行通过
- [ ] 测试覆盖率不降低

### 10.4 目录迁移验收

- [ ] `.sdd/.specs/` 已重命名为 `.sdd/specs-tree-root/`
- [ ] 所有 11 个子目录已完成 `specs-tree-` 前缀添加
- [ ] `.templates/` 和 `examples/` 已删除
- [ ] `ROADMAP.md` 已从 `.sdd/` 迁移到 `specs-tree-root/`
- [ ] `.sdd/docs/`, `.sdd/src/`, `.sdd/tests/` 已删除
- [ ] 所有子目录内容完整保留
- [ ] `specs-tree-agentic/`, `specs-tree-directory-naming/`, `specs-tree-state-json-fix/` 保持不变

### 10.5 功能验收

- [ ] @sdd-spec 可正常创建新 specs（自动添加 `specs-tree-` 前缀）
- [ ] @sdd-plan 可正常读取 specs
- [ ] @sdd-tasks 可正常生成任务
- [ ] @sdd-build 可正常执行构建
- [ ] @sdd-review 可正常执行审查
- [ ] @sdd-validate 可正常执行验证
- [ ] @sdd-docs 可正常生成导航
- [ ] @sdd-roadmap 可正常读取 roadmap
- [ ] @sdd-help 可正常显示帮助信息
- [ ] 无任何 Agent 报告路径错误

---

## 11. 附录

### 附录 A: 模板文件检查清单

```markdown
## P0-模板文件检查清单

- [ ] src/templates/agents/sdd.md.hbs
  - [ ] 第 25 行：状态检查路径
  - [ ] 第 53-55 行：跳转保护验证表
  - [ ] 第 154-156 行：流程说明

- [ ] src/templates/agents/sdd-spec.md.hbs
  - [ ] 第 21 行：输出路径
  - [ ] 第 31 行：前置验证
  - [ ] 第 98 行：输出格式

- [ ] src/templates/agents/sdd-plan.md.hbs
  - [ ] 第 20-23 行：依赖关系
  - [ ] 第 32 行：前置验证
  - [ ] 第 82, 108 行：输出格式

...（完整清单见实施计划）
```

### 附录 B: grep 验证命令

```bash
# 验证模板文件
grep -r "\.specs/" src/templates/agents/
grep -r "\.specs/" src/templates/subfeature-templates.ts

# 验证核心代码
grep -r "\.specs/" src/state/
grep -r "\.specs/" src/utils/
grep -r "\.specs/" src/index.ts

# 验证测试文件
grep -r "\.specs/" src/**/*.test.ts

# 预期：所有命令返回空（无匹配）
```

### 附录 C: 迁移验证命令

```bash
# 验证目录结构
ls -la .sdd/
ls -la .sdd/specs-tree-root/

# 验证 specs-tree-前缀目录数量
ls -1 .sdd/specs-tree-root/ | grep "^specs-tree-" | wc -l
# 预期：11 个

# 验证已删除目录
ls -la .sdd/.templates/  # 应报错：不存在
ls -la .sdd/examples/    # 应报错：不存在
ls -la .sdd/docs/        # 应报错：不存在
ls -la .sdd/src/         # 应报错：不存在
ls -la .sdd/tests/       # 应报错：不存在

# 验证已规范目录保持不变
ls -la .sdd/specs-tree-agentic/
ls -la .sdd/specs-tree-directory-naming/
ls -la .sdd/specs-tree-state-json-fix/
```

---

## 12. 版本历史

| 版本 | 日期 | 作者 | 变更说明 |
|------|------|------|----------|
| 1.0.0 | 2026-04-01 | SDD 技术规划专家 | 初始版本 |

---

## ✅ 技术规划完成

**Feature**: specs-tree-directory-optimization  
**状态**: planned  
**文件**: `.sdd/.specs/specs-tree-directory-optimization/plan.md`

### 生成的 ADR
无（本 feature 不涉及架构决策）

### 下一步
👉 运行 `@sdd-tasks specs-tree-directory-optimization` 开始任务分解

```bash
/tool sdd_update_state {"feature": "specs-tree-directory-optimization", "state": "planned"}
```
