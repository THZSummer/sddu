# 废弃 SDD Tools 和 Commands 技术规划

## 1. 元数据

| 字段 | 值 |
|------|-----|
| **Feature 标识符** | FR-DEP-001 |
| **关联 Spec** | `.sdd/.specs/deprecate-sdd-tools/spec.md` |
| **规划版本** | 1.0.0 |
| **创建日期** | 2026-04-01 |
| **状态** | planned |

---

## 2. 架构分析

### 2.1 当前代码结构

```
src/
├── index.ts              # 包含 4 个 tools (待删除)
├── agents/
│   └── sdd-agents.ts     # Agents 注册逻辑 (保留)
├── commands/
│   └── sdd.ts            # 9 个 commands (待删除)
├── state/
│   ├── machine.ts        # 状态机 (保留 - 核心功能)
│   ├── migrator.ts       # 状态迁移 (保留)
│   └── *.ts              # 其他状态管理 (保留)
├── utils/
│   ├── dependency-notifier.ts   # 依赖通知 (保留)
│   ├── readme-generator.ts      # README 生成 (保留)
│   ├── subfeature-manager.ts    # 子功能管理 (保留)
│   └── tasks-parser.ts          # 任务解析 (保留)
└── templates/
    └── agents/           # Agent 模板 (保留)

.opencode/plugins/sdd/
├── opencode.json         # 配置 (仅需验证，无需修改)
├── agents/               # 编译后的 agents (保留)
├── commands/             # 编译后的 commands (待删除)
└── utils/                # 工具函数 (保留)

dist/
├── index.js              # 编译后的入口 (待更新)
├── commands/             # 编译后的 commands (待删除)
└── ...
```

### 2.2 待删除组件详情

#### Tools (4 个) - 位于 `src/index.ts` 行 40-118
| Tool 名称 | 功能 | 使用频率 |
|----------|------|----------|
| `sdd_init` | 初始化 SDD 目录结构 | 0 次 |
| `sdd_specify` | 创建规范目录 | 0 次 |
| `sdd_status` | 查看状态 | 0 次 |
| `sdd_roadmap` | 创建 Roadmap | 0 次 |

#### Commands (9 个) - 位于 `src/commands/sdd.ts`
| Command | 功能 | 使用频率 |
|---------|------|----------|
| `/sdd init` | 初始化工作流 | 0 次 |
| `/sdd specify` | 创建规范 | 0 次 |
| `/sdd clarify` | 澄清规范 | 0 次 |
| `/sdd plan` | 生成计划 | 0 次 |
| `/sdd tasks` | 分解任务 | 0 次 |
| `/sdd implement` | 实现任务 | 0 次 |
| `/sdd validate` | 验证实现 | 0 次 |
| `/sdd status` | 查看状态 | 0 次 |
| `/sdd retro` | 复盘 | 0 次 |

### 2.3 依赖关系图

```
┌─────────────────────────────────────────────────────────────┐
│                      待删除部分                              │
├─────────────────────────────────────────────────────────────┤
│  src/index.ts (tool 对象)                                    │
│       │                                                      │
│       └──► 无外部依赖 (独立定义)                              │
│                                                              │
│  src/commands/sdd.ts                                         │
│       │                                                      │
│       ├──► src/state/machine.ts (StateMachine)               │
│       └──► fs/promises                                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      保留部分                                │
├─────────────────────────────────────────────────────────────┤
│  src/state/machine.ts                                        │
│       │                                                      │
│       └──► 核心状态管理 (被 commands 引用，但保留供未来使用)    │
│                                                              │
│  src/agents/sdd-agents.ts                                    │
│       │                                                      │
│       └──► Agent 注册逻辑 (独立)                              │
│                                                              │
│  src/utils/*                                                 │
│       │                                                      │
│       └──► 通用工具函数 (可能被 agents 间接使用)               │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. 删除方案设计

### 3.1 方案对比

#### 方案 A：直接删除（推荐）
| 方面 | 描述 |
|------|------|
| **描述** | 直接移除 tools 和 commands 代码，重新编译 |
| **优点** | - 代码干净，无遗留<br>- 维护成本低<br>- 无兼容负担 |
| **缺点** | - 如有隐藏用户会失效 (但使用频率为 0) |
| **风险** | 低 - 已确认无用户使用 |
| **工作量** | 约 2 小时 |

#### 方案 B：标记废弃 + 延迟删除
| 方面 | 描述 |
|------|------|
| **描述** | 先添加废弃警告，下个版本再删除 |
| **优点** | - 给用户缓冲期 |
| **缺点** | - 增加代码复杂度<br>- 需要维护废弃逻辑<br>- 延迟清理 |
| **风险** | 中 - 需要处理警告逻辑 |
| **工作量** | 约 4 小时 |

#### 方案 C：保留代码但禁用
| 方面 | 描述 |
|------|------|
| **描述** | 保留代码但通过配置禁用 |
| **优点** | - 可快速恢复 |
| **缺点** | - 代码冗余<br>- 配置复杂<br>- 仍需维护 |
| **风险** | 低 |
| **工作量** | 约 3 小时 |

### 3.2 推荐方案：方案 A（直接删除）

**理由**:
1. Spec 明确说明使用频率为 0 次
2. 无需迁移指南和向后兼容
3. 简化代码库，降低维护成本
4. 符合 Spec v3.0.0 简化版策略

### 3.3 删除顺序

```
1. 编辑 src/index.ts
   └── 删除 tool 对象 (行 40-118)
   
2. 删除 src/commands/sdd.ts 文件
   
3. 删除 src/commands/ 目录 (确认无其他文件)
   
4. 清理编译输出
   └── npm run clean
   
5. 重新编译
   └── npm run build
   
6. 验证
   └── 确认 dist/ 无 commands/ 目录
   └── 确认 .opencode/plugins/sdd/commands/ 已清理
```

### 3.4 可能的副作用

| 副作用 | 可能性 | 影响 | 缓解措施 |
|--------|--------|------|----------|
| StateMachine 无用警告 | 中 | 代码 lint 警告 | 保留供未来使用，或后续清理 |
| 编译脚本输出描述过时 | 高 | 文档不准确 | 更新 build-agents.cjs 注释 |
| 用户误用旧命令 | 低 | 命令不存在错误 | 无缓解 (已确认 0 使用) |

### 3.5 回滚方案

如需回滚，从 git 恢复以下文件：
```bash
git checkout HEAD -- src/index.ts
git checkout HEAD -- src/commands/
npm run clean && npm run build
```

---

## 4. 配置更新方案

### 4.1 `.opencode/plugins/sdd/opencode.json`

**当前状态**: 仅包含 `agent` 配置，无 `commands` 字段

**变更**: 无需修改

```json
{
  "plugin": ["opencode-sdd-plugin"],
  "agent": {
    // ... 16 个 agents (保持不变)
  },
  "permission": {
    "*": "allow",
    "edit": "allow",
    "bash": "allow"
  }
}
```

### 4.2 `package.json`

**变更**: 无需修改

构建脚本保持不变：
```json
{
  "scripts": {
    "build": "npm run build:agents && npm run build:ts",
    "build:agents": "node build-agents.cjs",
    "build:ts": "tsc",
    "clean": "rimraf dist"
  }
}
```

### 4.3 `tsconfig.json`

**变更**: 无需修改

TypeScript 配置自动处理删除的文件：
```json
{
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]  // 自动排除已删除文件
}
```

### 4.4 `build-agents.cjs`

**变更**: 更新输出结构描述注释

```javascript
// 更新前:
console.log('   ├── commands/                (插件代码)');

// 更新后:
console.log('   ├── index.js                 (插件入口)');
console.log('   ├── agents/                  (Agent 注册)');
console.log('   ├── state/                   (状态管理)');
console.log('   ├── utils/                   (工具函数)');
console.log('   └── templates/agents/        (16 个 agent 定义)');
```

---

## 5. 编译与构建

### 5.1 编译命令

```bash
# 1. 清理旧构建产物
npm run clean

# 2. 重新编译
npm run build

# 或一步完成
npm run clean && npm run build
```

### 5.2 输出目录结构变化

#### 删除前
```
dist/
├── index.js
├── index.d.ts
├── opencode.json
├── commands/
│   ├── sdd.js
│   └── sdd.d.ts
├── agents/
│   ├── sdd-agents.js
│   └── sdd-agents.d.ts
├── state/
│   └── *.js, *.d.ts
├── utils/
│   └── *.js, *.d.ts
└── templates/
    └── agents/
        └── *.md
```

#### 删除后
```
dist/
├── index.js               # 无 tool 导出
├── index.d.ts
├── opencode.json
├── agents/
│   ├── sdd-agents.js
│   └── sdd-agents.d.ts
├── state/
│   └── *.js, *.d.ts
├── utils/
│   └── *.js, *.d.ts
└── templates/
    └── agents/
        └── *.md
```

### 5.3 清理策略

1. **自动清理**: `npm run clean` 删除整个 dist 目录
2. **增量编译**: TypeScript 自动跳过已删除的源文件
3. **手动清理**: 如需彻底清理 `.opencode/plugins/sdd/`:
   ```bash
   rm -rf .opencode/plugins/sdd/commands/
   ```

---

## 6. 验证方案

### 6.1 删除验证

| 检查项 | 验证命令 | 预期结果 |
|--------|----------|----------|
| src/index.ts 无 tool | `grep "tool = {" src/index.ts` | 无输出 |
| src/commands/sdd.ts 不存在 | `ls src/commands/sdd.ts` | 文件不存在 |
| src/commands/ 目录不存在 | `ls src/commands/` | 目录不存在 |
| dist/commands/ 不存在 | `ls dist/commands/` | 目录不存在 |
| .opencode/plugins/sdd/commands/ 不存在 | `ls .opencode/plugins/sdd/commands/` | 目录不存在 |

### 6.2 功能验证

| 检查项 | 验证方法 | 预期结果 |
|--------|----------|----------|
| 编译成功 | `npm run build` | 无错误，退出码 0 |
| Agents 可加载 | 启动 OpenCode，加载 @sdd-spec | Agent 正常响应 |
| 所有 16 个 Agents 可用 | 检查 `.opencode/plugins/sdd/opencode.json` | agent 配置完整 |

### 6.3 测试用例

```bash
# 1. 编译测试
npm run clean && npm run build
# 预期：成功，无 errors

# 2. 文件存在性测试
test ! -f src/commands/sdd.ts && echo "✅ commands/sdd.ts 已删除"
test ! -d src/commands && echo "✅ commands/ 目录已删除"
test ! -d dist/commands && echo "✅ dist/commands/ 已删除"

# 3. 代码内容测试
! grep -q "tool = {" src/index.ts && echo "✅ index.ts 无 tool 定义"

# 4. Agent 加载测试 (手动)
# 在 OpenCode 中执行：
# @sdd-help
# 预期：返回 SDD 帮助信息
```

### 6.4 回归测试

| 测试场景 | 验证点 |
|----------|--------|
| SDD 工作流仍可运行 | 可执行 @sdd-spec, @sdd-plan 等 |
| 状态管理仍正常 | state.json 可读写 |
| 文档生成仍正常 | @sdd-docs 可扫描目录 |

---

## 7. 风险评估

### 7.1 技术风险

| 风险 | 等级 | 描述 | 缓解措施 |
|------|------|------|----------|
| StateMachine 成为死代码 | 低 | 仅 commands 使用，删除后无用 | 保留供未来使用，或后续评估删除 |
| 编译脚本描述过时 | 低 | build-agents.cjs 注释提及 commands | 更新注释 |
| TypeScript 类型错误 | 低 | 删除文件后类型引用断裂 | 编译时会报错，及时修复 |

### 7.2 依赖风险

| 风险 | 等级 | 描述 | 缓解措施 |
|------|------|------|----------|
| 外部依赖无 | 无 | tools/commands 无外部 API 依赖 | 不适用 |

### 7.3 时间风险

| 风险 | 等级 | 描述 | 缓解措施 |
|------|------|------|----------|
| 低估工作量 | 低 | 可能有隐藏依赖 | 预留 50% 缓冲时间 |

### 7.4 风险缓解总表

| 风险类型 | 缓解措施 | 负责人 | 状态 |
|----------|----------|--------|------|
| 代码删除不完整 | 使用验证脚本检查 | 开发者 | 待执行 |
| 编译失败 | 逐步验证，及时修复 | 开发者 | 待执行 |
| Agents 失效 | 全量测试 16 个 agents | 测试者 | 待执行 |

---

## 8. 文件影响分析

### 8.1 修改文件

| 文件路径 | 操作 | 说明 |
|----------|------|------|
| `src/index.ts` | 修改 | 删除 `tool` 对象 (行 40-118) |
| `build-agents.cjs` | 修改 | 更新输出结构描述注释 |

### 8.2 删除文件

| 文件路径 | 说明 |
|----------|------|
| `src/commands/sdd.ts` | Commands 定义文件 |
| `src/commands/` | 目录 (删除文件后) |
| `dist/commands/sdd.js` | 编译产物 |
| `dist/commands/sdd.d.ts` | 类型定义 |
| `dist/commands/` | 目录 (重新编译后) |
| `.opencode/plugins/sdd/commands/sdd.js` | 部署产物 |
| `.opencode/plugins/sdd/commands/sdd.d.ts` | 部署类型 |
| `.opencode/plugins/sdd/commands/` | 部署目录 |

### 8.3 保留文件

| 文件路径 | 说明 |
|----------|------|
| `src/state/machine.ts` | 状态机 (保留供未来使用) |
| `src/state/*.ts` | 其他状态管理文件 |
| `src/utils/*.ts` | 工具函数 |
| `src/agents/sdd-agents.ts` | Agents 注册 |
| `src/templates/` | Agent 模板 |
| `.opencode/plugins/sdd/opencode.json` | 配置 (无需修改) |
| `.opencode/plugins/sdd/agents/` | Agents 部署目录 |

---

## 9. 执行时间表

| 步骤 | 活动 | 预计时间 | 累计时间 |
|------|------|----------|----------|
| 1 | 编辑 src/index.ts，删除 tool 对象 | 30 分钟 | 30 分钟 |
| 2 | 删除 src/commands/ 目录 | 10 分钟 | 40 分钟 |
| 3 | 更新 build-agents.cjs 注释 | 15 分钟 | 55 分钟 |
| 4 | 清理并重新编译 | 10 分钟 | 65 分钟 |
| 5 | 验证删除结果 | 15 分钟 | 80 分钟 |
| 6 | 测试 Agents 功能 | 30 分钟 | 110 分钟 |
| 7 | 文档更新和提交 | 20 分钟 | 130 分钟 |

**总计**: 约 2.2 小时

---

## 10. 验收标准

- [ ] `src/index.ts` 不包含 `tool = {` 定义
- [ ] `src/commands/sdd.ts` 文件不存在
- [ ] `src/commands/` 目录不存在
- [ ] `dist/commands/` 目录不存在
- [ ] `.opencode/plugins/sdd/commands/` 目录不存在
- [ ] `npm run build` 编译成功，无错误
- [ ] 所有 16 个 Agents 可正常加载和使用
- [ ] `build-agents.cjs` 注释已更新
- [ ] 代码已提交到 git

---

## 11. 下一步

👉 运行 `@sdd-tasks 废弃 sdd 工具` 开始任务分解

---

<div align="center">

**状态**: `planned` ✅  
**ADR**: 无需 (不涉及架构决策)  
**下一步**: 运行 `@sdd-tasks 废弃 sdd 工具`

</div>
