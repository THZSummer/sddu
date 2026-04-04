# 废弃 SDD Tools 和 Commands - 任务分解文档

## 1. 元数据

| 字段 | 值 |
|------|-----|
| **Feature 标识符** | FR-DEP-001 |
| **关联 Spec** | `.sdd/.specs/deprecate-sdd-tools/spec.md` |
| **关联 Plan** | `.sdd/.specs/deprecate-sdd-tools/plan.md` |
| **文档版本** | 1.0.0 |
| **创建日期** | 2026-04-01 |
| **状态** | tasked |

---

## 2. 任务汇总

| 指标 | 值 |
|------|-----|
| **总任务数** | 8 个 |
| **复杂度分布** | S 级 5 个，M 级 2 个，L 级 1 个 |
| **执行波次** | 4 个波次 |
| **预计总工时** | 2.2 小时 |

---

## 3. 任务列表

### TASK-001: 删除 src/index.ts 中的 tool 对象

**复杂度**: M  
**前置依赖**: 无  
**执行波次**: 1  

#### 描述
编辑 `src/index.ts`，删除第 40-118 行的 `tool` 对象定义，包含 4 个工具：
- `sdd_init`
- `sdd_specify`
- `sdd_status`
- `sdd_roadmap`

#### 涉及文件
- [MODIFY] `src/index.ts` - 删除 `tool` 对象（行 40-118）

#### 验收标准
- [ ] `src/index.ts` 不包含 `tool = {` 定义
- [ ] `src/index.ts` 不包含 `sdd_init:` 定义
- [ ] `src/index.ts` 不包含 `sdd_specify:` 定义
- [ ] `src/index.ts` 不包含 `sdd_status:` 定义
- [ ] `src/index.ts` 不包含 `sdd_roadmap:` 定义
- [ ] TypeScript 编译无错误

#### 验证命令
```bash
# 验证 tool 定义已删除
! grep -q "tool = {" src/index.ts && echo "✅ tool 定义已删除"
! grep -q "sdd_init:" src/index.ts && echo "✅ sdd_init 已删除"
! grep -q "sdd_specify:" src/index.ts && echo "✅ sdd_specify 已删除"
! grep -q "sdd_status:" src/index.ts && echo "✅ sdd_status 已删除"
! grep -q "sdd_roadmap:" src/index.ts && echo "✅ sdd_roadmap 已删除"

# 验证保留的导出
grep -q "export const SDDPlugin" src/index.ts && echo "✅ SDDPlugin 导出保留"
grep -q "export default SDDPlugin" src/index.ts && echo "✅ default 导出保留"
```

---

### TASK-002: 删除 src/commands/sdd.ts 文件

**复杂度**: S  
**前置依赖**: 无  
**执行波次**: 1  

#### 描述
删除 `src/commands/sdd.ts` 文件，该文件包含 9 个 SDD 命令定义。

#### 涉及文件
- [DELETE] `src/commands/sdd.ts` - 删除整个文件

#### 验收标准
- [ ] `src/commands/sdd.ts` 文件不存在
- [ ] 文件内容完全移除

#### 验证命令
```bash
# 验证文件已删除
test ! -f src/commands/sdd.ts && echo "✅ src/commands/sdd.ts 已删除"
```

---

### TASK-003: 删除 src/commands/ 目录

**复杂度**: S  
**前置依赖**: TASK-002  
**执行波次**: 1  

#### 描述
删除 `src/commands/` 目录（确认目录为空后删除）。

#### 涉及文件
- [DELETE] `src/commands/` - 删除整个目录

#### 验收标准
- [ ] `src/commands/` 目录不存在
- [ ] 目录内无残留文件

#### 验证命令
```bash
# 验证目录已删除
test ! -d src/commands && echo "✅ src/commands/ 目录已删除"

# 如果目录仍存在，检查是否为空
if [ -d src/commands ]; then
  [ -z "$(ls -A src/commands 2>/dev/null)" ] && echo "⚠️ src/commands/ 目录存在但为空"
fi
```

---

### TASK-004: 更新 build-agents.cjs 注释

**复杂度**: S  
**前置依赖**: 无  
**执行波次**: 1  

#### 描述
更新 `build-agents.cjs` 中的输出结构描述注释，移除对 `commands/` 目录的引用。

需要修改第 174-178 行的注释输出：
```javascript
// 删除前:
console.log('   ├── commands/');

// 删除后:
console.log('   ├── agents/                (插件代码)');
console.log('   ├── state/                 (状态管理)');
console.log('   ├── utils/                 (工具函数)');
```

#### 涉及文件
- [MODIFY] `build-agents.cjs` - 更新输出结构描述注释

#### 验收标准
- [ ] `build-agents.cjs` 不包含 `commands/` 目录描述
- [ ] 输出结构注释准确反映当前代码结构
- [ ] 脚本可正常执行

#### 验证命令
```bash
# 验证注释已更新
! grep -q "commands/" build-agents.cjs && echo "✅ commands 目录引用已删除"

# 验证脚本可执行
node build-agents.cjs | grep -q "Building SDD" && echo "✅ 脚本可正常执行"
```

---

### TASK-005: 清理编译产物并重新编译

**复杂度**: L  
**前置依赖**: TASK-001, TASK-002, TASK-003, TASK-004  
**执行波次**: 2  

#### 描述
清理旧的编译产物并重新编译 TypeScript 代码，确保删除操作后代码仍可正常编译。

#### 涉及文件
- [DELETE] `dist/` - 清理整个 dist 目录
- [GENERATE] `dist/index.js` - 重新编译生成
- [GENERATE] `dist/index.d.ts` - 重新编译生成

#### 验收标准
- [ ] `npm run clean` 执行成功
- [ ] `npm run build` 执行成功，无错误
- [ ] `dist/commands/` 目录不存在
- [ ] `dist/index.js` 不包含 tool 导出
- [ ] 编译退出码为 0

#### 验证命令
```bash
# 清理并编译
npm run clean && npm run build

# 验证编译产物
test ! -d dist/commands && echo "✅ dist/commands/ 目录不存在"
! grep -q "tool = {" dist/index.js && echo "✅ dist/index.js 无 tool 导出"

# 验证编译成功
npm run build 2>&1 | grep -q "error" && echo "❌ 编译有错误" || echo "✅ 编译成功"
```

---

### TASK-006: 验证删除结果

**复杂度**: S  
**前置依赖**: TASK-005  
**执行波次**: 3  

#### 描述
全面验证所有待删除的代码和产物已完全移除。

#### 涉及文件
- [VERIFY] `src/index.ts`
- [VERIFY] `src/commands/`
- [VERIFY] `dist/`
- [VERIFY] `.opencode/plugins/sdd/`

#### 验收标准
- [ ] `src/index.ts` 无 tool 定义
- [ ] `src/commands/sdd.ts` 文件不存在
- [ ] `src/commands/` 目录不存在
- [ ] `dist/commands/` 目录不存在
- [ ] `.opencode/plugins/sdd/commands/` 目录不存在（如存在）

#### 验证命令
```bash
# 源代码验证
test ! -f src/commands/sdd.ts && echo "✅ src/commands/sdd.ts 已删除"
test ! -d src/commands && echo "✅ src/commands/ 目录已删除"
! grep -q "tool = {" src/index.ts && echo "✅ src/index.ts 无 tool 定义"

# 编译产物验证
test ! -d dist/commands && echo "✅ dist/commands/ 目录不存在"
! grep -q "sdd_init" dist/index.js && echo "✅ dist/index.js 无 sdd_init"

# 部署产物验证（如存在）
if [ -d .opencode/plugins/sdd ]; then
  test ! -d .opencode/plugins/sdd/commands && echo "✅ .opencode/plugins/sdd/commands/ 已清理"
fi
```

---

### TASK-007: 验证 Agents 功能完整性

**复杂度**: M  
**前置依赖**: TASK-005  
**执行波次**: 3  

#### 描述
验证所有 16 个 Agents 配置完整且可正常加载。

#### 涉及文件
- [VERIFY] `.opencode/plugins/sdd/opencode.json`
- [VERIFY] `dist/templates/agents/`

#### 验收标准
- [ ] `.opencode/plugins/sdd/opencode.json` 包含全部 16 个 agents 配置
- [ ] `dist/templates/agents/` 包含 16 个 agent 定义文件
- [ ] 所有 agents 可正常加载（无配置错误）
- [ ] 无 commands 相关配置残留

#### 验证命令
```bash
# 验证 opencode.json 配置
node -e "const c=require('./.opencode/plugins/sdd/opencode.json'); 
  const agents=Object.keys(c.agent||{}); 
  console.log('Agents count:', agents.length);
  console.log('Agents:', agents.join(', '));
  if(agents.length===16) console.log('✅ 16 个 agents 配置完整');
  else console.log('❌ agents 数量不正确');
  if(!c.commands) console.log('✅ 无 commands 配置');
  else console.log('❌ 仍有 commands 配置');"

# 验证 agent 文件
ls dist/templates/agents/*.md | wc -l | grep -q "16" && echo "✅ 16 个 agent 文件已生成"

# 验证 agents 文件列表
echo "Agent 文件列表:"
ls dist/templates/agents/*.md
```

---

### TASK-008: 更新文档和状态

**复杂度**: S  
**前置依赖**: TASK-006, TASK-007  
**执行波次**: 4  

#### 描述
更新相关文档和状态文件，标记此 feature 为已完成状态。

#### 涉及文件
- [MODIFY] `.sdd/.specs/deprecate-sdd-tools/README.md` - 更新状态
- [MODIFY] `.sdd/.specs/state.json` - 更新状态记录
- [MODIFY] `.sdd/.specs/deprecate-sdd-tools/tasks.md` - 更新本文档状态

#### 验收标准
- [ ] `.sdd/.specs/deprecate-sdd-tools/README.md` 状态更新为 `completed`
- [ ] `.sdd/.specs/state.json` 记录此 feature 完成
- [ ] 本文档状态更新为 `completed`
- [ ] 提交 git commit

#### 验证命令
```bash
# 验证状态更新
grep -q "completed" .sdd/.specs/deprecate-sdd-tools/README.md && echo "✅ README 状态已更新"

# 验证 git 状态
git status --short | grep -q "deprecate-sdd-tools" && echo "✅ 相关文件已修改待提交"

# 运行状态更新工具
/tool sdd_update_state {"feature": "deprecate-sdd-tools", "state": "completed"}
```

---

## 4. 任务依赖关系图

```
Wave 1 (并行)          Wave 2            Wave 3 (并行)        Wave 4
┌─────────────────┐
│ TASK-001        │
│ 删除 tool 对象    │─────┐
└─────────────────┘     │
┌─────────────────┐     │    ┌─────────────────┐
│ TASK-002        │     │    │ TASK-005        │     ┌─────────────────┐
│ 删除 sdd.ts     │─────┼────►│ 清理并编译      │─────┤ TASK-006        │
└─────────────────┘     │    └─────────────────┘     │ 验证删除结果    │───┐
┌─────────────────┐     │                            └─────────────────┘   │
│ TASK-003        │─────┘                            ┌─────────────────┐   │    ┌─────────────────┐
│ 删除 commands/ │                                  │ TASK-007        │───┼────►│ TASK-008        │
└─────────────────┘                                  │ 验证 Agents     │   │    │ 更新文档状态    │
┌─────────────────┐                                  └─────────────────┘   │    └─────────────────┘
│ TASK-004        │                                                        │
│ 更新构建脚本注释 │────────────────────────────────────────────────────────┘
└─────────────────┘

图例:
─────►  依赖关系
并行   同一波次可并行执行
```

---

## 5. 执行顺序建议

### 推荐执行流程

```bash
# ========== Wave 1: 并行执行基础删除任务 ==========
# 可同时进行以下操作：

# 1. 编辑 src/index.ts，删除 tool 对象
# 2. 删除 src/commands/sdd.ts
# 3. 删除 src/commands/ 目录
# 4. 编辑 build-agents.cjs，更新注释

# ========== Wave 2: 清理和编译 ==========
npm run clean
npm run build

# ========== Wave 3: 并行验证 ==========
# 验证删除结果
test ! -f src/commands/sdd.ts && echo "✅"
test ! -d dist/commands && echo "✅"

# 验证 Agents
ls dist/templates/agents/*.md | wc -l  # 应为 16

# ========== Wave 4: 文档和提交 ==========
# 更新状态文档
# 提交 git commit
```

### 风险缓解

| 风险 | 缓解措施 |
|------|----------|
| 编译失败 | 检查 TypeScript 错误，修复类型引用 |
| 依赖未清理干净 | 运行 `npm run clean` 彻底清理 |
| Agents 配置错误 | 验证 opencode.json 语法 |
| 遗漏删除文件 | 使用验证命令全面检查 |

---

## 6. 验收标准汇总

### 代码删除验收
- [ ] `src/index.ts` 不包含 `tool = {` 定义
- [ ] `src/commands/sdd.ts` 文件不存在
- [ ] `src/commands/` 目录不存在

### 编译产物验收
- [ ] `dist/commands/` 目录不存在
- [ ] `dist/index.js` 无 tool 导出
- [ ] `npm run build` 编译成功，无错误

### Agents 功能验收
- [ ] `.opencode/plugins/sdd/opencode.json` 包含 16 个 agents
- [ ] `dist/templates/agents/` 包含 16 个 agent 文件
- [ ] 所有 agents 可正常加载

### 文档验收
- [ ] `build-agents.cjs` 注释已更新
- [ ] `.sdd/.specs/deprecate-sdd-tools/README.md` 状态更新
- [ ] 代码已提交到 git

---

## 7. 下一步

👉 运行 `@sdd-build TASK-001` 开始实现第一个任务

所有任务按波次执行：
1. **Wave 1**: 执行 TASK-001 至 TASK-004（可并行）
2. **Wave 2**: 执行 TASK-005（清理编译）
3. **Wave 3**: 执行 TASK-006 和 TASK-007（可并行验证）
4. **Wave 4**: 执行 TASK-008（文档更新）

---

<div align="center">

**状态**: `tasked` ✅  
**总任务数**: 8 个  
**执行波次**: 4 个  
**预计工时**: 2.2 小时

</div>
