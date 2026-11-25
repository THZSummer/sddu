# 废弃 SDD Tools 和 Commands 规范（简化版）

## 1. 元数据

| 字段 | 值 |
|------|-----|
| **Feature 标识符** | FR-DEP-001 |
| **Feature 名称** | 废弃 SDD Tools 和 Commands |
| **创建日期** | 2026-04-01 |
| **作者** | SDD 团队 |
| **优先级** | P0 |
| **状态** | specified |
| **版本** | 3.0.0（简化版） |

---

## 2. 背景

### 2.1 问题陈述

当前 SDD 系统存在三套入口机制（Tools、Commands、Agents），但实际使用情况：

| 机制 | 使用频率 | 原因 |
|------|----------|------|
| Tools (`/tool sdd_xxx`) | 0 次 | 无用户使用 |
| Commands (`/sdd xxx`) | 0 次 | 无用户使用 |
| Agents (`@sdd-xxx`) | 高频 | 唯一实际使用的入口 |

**结论**：Tools 和 Commands 从未被使用，可以直接移除，无需迁移。

### 2.2 待删除内容

#### Tools（4 个）
- `sdd_init` - src/index.ts
- `sdd_specify` - src/index.ts
- `sdd_status` - src/index.ts
- `sdd_roadmap` - src/index.ts

#### Commands（9 个）
- `/sdd init`, `specify`, `clarify`, `plan`, `tasks`, `implement`, `validate`, `status`, `retro`
- 文件：`src/commands/sdd.ts`

### 2.3 保留内容

#### Agents（16 个）- 唯一入口
- `@sdd`, `@sdd-help`, `@sdd-spec`, `@sdd-plan`, `@sdd-tasks`, `@sdd-build`, `@sdd-review`, `@sdd-validate`
- `@sdd-roadmap`, `@sdd-docs`
- 以及对应的数字版本 `@sdd-1-spec` 等

---

## 3. 目标

| 编号 | 目标 | 验收标准 |
|------|------|----------|
| G-001 | 删除所有 Tools 代码 | `src/index.ts` 无 `tool` 定义 |
| G-002 | 删除所有 Commands 代码 | `src/commands/sdd.ts` 文件删除 |
| G-003 | 更新配置 | `opencode.json` 无 commands 配置 |
| G-004 | 保留 Agents | 所有 Agents 正常工作 |

### 非目标

| 编号 | 非目标 | 说明 |
|------|--------|------|
| NG-001 | 不需要迁移指南 | 无用户使用，无需迁移 |
| NG-002 | 不需要向后兼容 | 直接删除，不保留兼容层 |
| NG-003 | 不需要错误提示 | 不需要处理废弃调用 |
| NG-004 | 不需要通知期 | 直接执行删除 |

---

## 4. 执行步骤

### 4.1 代码删除

```bash
# 1. 编辑 src/index.ts，删除 tool 对象
# 2. 删除 src/commands/sdd.ts 文件
# 3. 删除 src/commands/ 目录（如果只有 sdd.ts）
```

### 4.2 配置更新

编辑 `.opencode/plugins/sdd/opencode.json`：
- 移除 `commands` 字段
- 保留 `agents` 字段

### 4.3 重新编译

```bash
npm run clean
npm run build
```

### 4.4 验证

```bash
# 检查编译输出
ls -la dist/
# 确认无 commands/ 目录
# 确认 index.js 无 tool 导出
```

---

## 5. 文件变更清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/index.ts` | 修改 | 删除 `tool` 对象定义 |
| `src/commands/sdd.ts` | 删除 | 删除整个文件 |
| `src/commands/` | 删除 | 如果目录为空则删除 |
| `.opencode/plugins/sdd/opencode.json` | 修改 | 移除 commands 配置 |
| `dist/index.js` | 自动 | 重新编译生成 |
| `dist/commands/` | 自动 | 重新编译后删除 |

---

## 6. 验收标准

- [ ] `src/index.ts` 不包含 `tool = {` 定义
- [ ] `src/commands/sdd.ts` 文件不存在
- [ ] `.opencode/plugins/sdd/opencode.json` 无 `commands` 字段
- [ ] `npm run build` 编译成功
- [ ] 所有 Agents 可正常加载

---

## 7. 时间线

| 日期 | 活动 |
|------|------|
| 2026-04-01 | 规范完成，开始执行 |
| 2026-04-01 | 代码删除 + 编译 + 验证（1 天完成） |
| 2026-04-02 | 发布 v1.3.0 |

---

## 文档历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| 1.0.0 | 2026-04-01 | 初始版本（仅废弃 Tools） |
| 2.0.0 | 2026-04-01 | 扩展废弃 Commands，含迁移 |
| 3.0.0 | 2026-04-01 | 简化版，直接移除无迁移 |

---

<div align="center">

**状态**: `specified` ✅  
**下一步**: 运行 `@sdd-plan 废弃 sdd 工具`

</div>
