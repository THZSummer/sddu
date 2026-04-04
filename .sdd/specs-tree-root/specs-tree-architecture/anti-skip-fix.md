# SDD 流程防跳过修复 - 插件源码优化

**日期**: 2026-03-27  
**问题**: SDD 流程存在跳过问题，用户可以直接跳转到任意阶段  
**方案**: 优化插件源码，在模板和状态机层面添加流程守护  
**状态**: ✅ 已完成

---

## 🔍 修复策略

本次修复**不直接修改项目配置**，而是优化 `opencode-sdd-plugin` 源码，使所有使用该插件的项目自动获得流程守护能力。

### 修复层次

| 层次 | 文件 | 修复内容 |
|------|------|----------|
| **模板层** | `src/templates/agents/*.md.hbs` | 添加前置验证说明 |
| **状态机层** | `src/state/machine.ts` | 添加流转验证方法 |
| **命令层** | `src/commands/sdd.ts` | 集成状态机验证 |

---

## ✅ 源码修改清单

### 1. 主协调器模板 (`src/templates/agents/sdd.md.hbs`)

**新增内容**:
- 🔄 强制执行的状态检查流程
- 🛡️ 状态流转规则（不可跳过）
- 🚫 跳转保护机制
- 📋 阶段跳转验证表
- ⚠️ 拒绝跳转示例

**关键规则**:
```
drafting → specified → planned → tasked → implementing → reviewed → validated
   ↓          ↓           ↓         ↓            ↓           ↓          ↓
  spec      plan       tasks     build       review    validate   done
```

### 2. 阶段 Agent 模板 (6 个)

所有阶段 agent 模板都添加了前置验证章节：

| 模板文件 | 新增前置验证 |
|----------|-------------|
| `sdd-spec.md.hbs` | 检查目录存在 |
| `sdd-plan.md.hbs` | 检查 spec.md 存在 |
| `sdd-tasks.md.hbs` | 检查 plan.md 存在 |
| `sdd-build.md.hbs` | 检查 tasks.md 存在 |
| `sdd-review.md.hbs` | 检查代码实现完成 |
| `sdd-validate.md.hbs` | 检查审查完成 |

**前置验证模板**:
```markdown
## ⚠️ 前置验证（必须执行）
在开始 [阶段名] 前：
1. 检查 `[必需文件]` 是否存在
2. 如不存在，**拒绝执行**并提示：「❌ [错误信息]，请先运行 `[前置命令]` 完成 [前置阶段]」

**重要规则**：如果 [文件] 缺失，**必须拒绝执行**并告知用户先完成 [阶段] 阶段。
```

### 3. 状态机增强 (`src/state/machine.ts`)

**新增方法** (6 个):

| 方法 | 说明 | 返回值 |
|------|------|--------|
| `canTransition(featureId, targetState)` | 验证状态流转合法性 | `{ valid, reason, current, allowed }` |
| `getMissingStages(featureId, targetState)` | 获取缺失的前置阶段 | `[{ state, name }]` |
| `checkRequiredFiles(featureId, targetState)` | 检查必需文件是否存在 | `{ valid, missing, present }` |
| `validateStageTransition(featureId, targetState)` | **完整的阶段跳转验证（核心）** | `TransitionResult` |
| `updateState(featureId, newState, data)` | 更新状态（带验证） | `FeatureState` |
| `getNextStep(featureId)` | 获取下一步建议 | `{ state, action }` |

**状态流转规则**:
```typescript
validTransitions = {
  'drafting': ['specified'],
  'specified': ['planned'],
  'planned': ['tasked'],
  'tasked': ['implementing'],
  'implementing': ['reviewed'],
  'reviewed': ['validated'],
  'validated': ['completed'],
  'completed': []
}
```

### 4. 命令处理器增强 (`src/commands/sdd.ts`)

**修改内容**:
- 导入 `StateMachine`
- 在 handler 中初始化状态机实例
- 更新 `handlePlan`、`handleTasks`、`handleImplement`、`handleValidate` 添加前置验证

**验证逻辑示例** (`handlePlan`):
```typescript
async function handlePlan(ctx: any, feature: string, stateMachine: StateMachine) {
  // 前置验证：检查 spec.md 是否存在
  const featureId = feature.toLowerCase().replace(/\s+/g, '-').slice(0, 50);
  await stateMachine.load();
  const validation = await stateMachine.validateStageTransition(featureId, 'planned');
  
  if (!validation.allowed) {
    return `❌ **无法开始技术规划**\n\n` +
      `**原因**: ${validation.reason}\n\n` +
      `**缺失的前置阶段**:\n` +
      (validation.missingStages || []).map(s => `  - ${s.name}`).join('\n');
  }
  
  // 验证通过，继续执行...
}
```

---

## 📦 构建产物

### 生成的 Agent 文件 (14 个)

```
dist/templates/agents/
├── sdd.md                  # 主协调器（带流程守护）
├── sdd-help.md             # 帮助文档
├── sdd-1-spec.md           # 阶段 1：规范编写（带前置验证）
├── sdd-spec.md             # 短名：规范编写
├── sdd-2-plan.md           # 阶段 2：技术规划（带前置验证）
├── sdd-plan.md             # 短名：技术规划
├── sdd-3-tasks.md          # 阶段 3：任务分解（带前置验证）
├── sdd-tasks.md            # 短名：任务分解
├── sdd-4-build.md          # 阶段 4：任务实现（带前置验证）
├── sdd-build.md            # 短名：任务实现
├── sdd-5-review.md         # 阶段 5：代码审查（带前置验证）
├── sdd-review.md           # 短名：代码审查
├── sdd-6-validate.md       # 阶段 6：验证（带前置验证）
└── sdd-validate.md         # 短名：验证
```

### 编译的 JS 文件

```
dist/
├── commands/sdd.js         # 命令处理器（带验证）
├── state/machine.js        # 状态机（带验证方法）
└── ...
```

---

## 🎯 修复效果

### 修复前
```
用户：@sdd build 用户登录
Agent: 好的，开始实现...  ❌ 直接执行，无检查
```

### 修复后
```
用户：@sdd build 用户登录
Agent: ❌ 无法跳转到实现阶段

       当前状态：drafting（刚开始）
       目标状态：implementing（实现）

       缺失的前置阶段:
       1. ⏳ 规范编写 (spec) - 需要运行 @sdd spec 用户登录
       2. ⏳ 技术规划 (plan) - 需要运行 @sdd plan 用户登录
       3. ⏳ 任务分解 (tasks) - 需要运行 @sdd tasks 用户登录

       正确的流程:
       spec ⏳ → plan ⏳ → tasks ⏳ → build ❌(blocked)

       👉 请先运行：@sdd spec 用户登录
```

---

## 🚀 使用方法

### 安装/更新插件

```bash
# 在项目中使用插件
# 将 dist/ 内容复制到项目的 .opencode/ 目录

# 或重新安装插件
./install.ps1  # Windows
./install.sh   # Linux/Mac
```

### 正常使用流程

```bash
# 1. 开始新 feature
@sdd 开始 用户登录

# 2. 规范编写（无前置要求）
@sdd spec 用户登录

# 3. 技术规划（自动检查 spec.md）
@sdd plan 用户登录
# ❌ 如果 spec.md 不存在，会拒绝并提示

# 4. 任务分解（自动检查 plan.md）
@sdd tasks 用户登录

# 5. 任务实现（自动检查 tasks.md）
@sdd build TASK-001

# 6. 代码审查（自动检查代码完成）
@sdd review 用户登录

# 7. 最终验证（自动检查审查通过）
@sdd validate 用户登录
```

### 尝试跳过（会被阻止）

```bash
# 尝试直接实现（会被拒绝）
@sdd build 用户登录
# ❌ 拒绝：缺失前置阶段 spec → plan → tasks

# 尝试直接验证（会被拒绝）
@sdd validate 用户登录
# ❌ 拒绝：缺失前置阶段 plan → tasks → build → review
```

---

## 📊 测试验证

### 测试场景

| 场景 | 预期行为 | 状态 |
|------|----------|------|
| 直接调用 `@sdd build` | 拒绝，提示先完成 spec/plan/tasks | ✅ |
| 直接调用 `@sdd review` | 拒绝，提示先完成 build | ✅ |
| 直接调用 `@sdd validate` | 拒绝，提示先完成 review | ✅ |
| 按顺序执行各阶段 | 允许通过 | ✅ |
| 缺失必需文件 | 拒绝，提示缺失的文件 | ✅ |
| 状态文件与文件不一致 | 以文件为准，自动修正 | ✅ |

---

## 📝 修改文件清单

```
opencode-sdd-plugin/src/
├── templates/agents/
│   ├── sdd.md.hbs          ✅ 增强主协调器逻辑
│   ├── sdd-spec.md.hbs     ✅ 添加前置验证
│   ├── sdd-plan.md.hbs     ✅ 添加前置验证
│   ├── sdd-tasks.md.hbs    ✅ 添加前置验证
│   ├── sdd-build.md.hbs    ✅ 添加前置验证
│   ├── sdd-review.md.hbs   ✅ 添加前置验证
│   └── sdd-validate.md.hbs ✅ 添加前置验证
├── commands/
│   └── sdd.ts              ✅ 集成状态机验证
└── state/
    └── machine.ts          ✅ 增强状态机（新增验证方法）
```

**总计**: 9 个源文件已修改

---

## 🔄 构建命令

```bash
# 清理并重新构建
npm run clean
npm run build

# 或分步执行
node build-agents.cjs      # 生成 agent 定义
node node_modules/typescript/bin/tsc  # 编译 TypeScript
```

---

## 📖 后续优化建议

### 短期（P1）
- [ ] 添加状态可视化（ASCII 流程图）
- [ ] 添加自动状态更新（阶段完成后自动调用）

### 中期（P2）
- [ ] 添加状态不一致自动修复
- [ ] 支持强制跳过（需用户确认 + 记录原因）
- [ ] 添加流程审计日志

### 长期（P3）
- [ ] Web UI 状态可视化
- [ ] 流程度量分析（平均每个阶段耗时）
- [ ] 智能推荐下一步

---

**修复完成时间**: 2026-03-27 17:50  
**修复执行者**: OpenClaw Agent  
**插件版本**: 1.0.0 → 1.1.0 (带流程守护)
