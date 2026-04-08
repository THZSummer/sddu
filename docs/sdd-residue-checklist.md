# SDD 残留清单 - Plugin Rename SDDU V2 代码清理

**Feature ID**: FR-SDDU-V2-CLEANUP-001  
**版本**: 2.0.0  
**创建日期**: 2026-04-09  
**扫描工具**: grep + 手动审查

---

## 1. 扫描概述

### 1.1 扫描范围
- ✅ `src/**/*.ts` - TypeScript 源码
- ✅ `src/templates/**/*.hbs` - Handlebars 模板（11 个文件）
- ✅ `src/**/*.test.ts` - 测试文件
- ✅ `scripts/*` - 脚本文件

### 1.2 扫描类别
1. **模板文件中的 `@sdd-*` 引用** - 需改为 `@sddu-*`
2. **源码注释中的 "SDD" 字眼** - 需改为 "SDDU"
3. **类型定义中的 `Sdd*` 命名** - 需改为 `Sddu*`
4. **所有 `sdd-` 引用（排除 `sddu-`）** - 需清理
5. **测试文件中的 `Sdd*` 命名** - 需改为 `Sddu*`
6. **向后兼容代码** - 需删除

---

## 2. SDD 残留详细清单

### 2.1 模板文件中的 `@sdd-*` 引用（高优先级）

**文件数**: 9 个模板文件包含 `@sdd-*` 引用

#### 2.1.1 `src/templates/agents/sddu-help.md.hbs`
| 行号 | 内容 | 类型 | 处理建议 |
|------|------|------|----------|
| 32 | `\| **@sddu-help** \| 查看帮助（别名） \| \`@sddu-help\` \| ✅ \`@sdd-help\` \|` | 向后兼容说明 | 删除别名列 |
| 49-56 | 表格中所有 `✅ \`@sdd-*\`` | 向后兼容说明 | 删除别名列 |
| 62-63 | 表格中所有 `✅ \`@sdd-*\`` | 向后兼容说明 | 删除别名列 |
| 115 | `- **老用户**: 可继续使用 \`@sdd-*\` 系列命令（已标记为废弃但依然可用）` | 向后兼容说明 | 删除整行 |
| 119 | `所有 \`@sdd-*\` 命令将在未来版本中逐步废弃，但目前：` | 向后兼容说明 | 删除或重写 |
| 135 | `1. **立即切换** - 现有项目可以直接从 \`@sdd-\` 改为 \`@sddu-\`` | 迁移指南 | 保留但删除兼容性描述 |
| 148 | `### Q: 为什么有两套命令 (\`@sdd-*\` 和 \`@sddu-*\`)？` | FAQ | 删除整个问题 |
| 151 | `- \`@sdd-*\` 保持原有功能不变（将被废弃）` | FAQ 答案 | 删除整个问题和答案 |
| 154 | `A: 不会，\`@sdd-*\` 命令将继续保持功能完整，直到正式通知移除。` | FAQ 答案 | 删除整个问题和答案 |

#### 2.1.2 `src/templates/agents/sddu-roadmap.md.hbs`
| 行号 | 内容 | 类型 | 处理建议 |
|------|------|------|----------|
| 195 | `- 旧命令: \`@sdd-roadmap\` \| 新命令：\`@sddu-roadmap\`` | 向后兼容说明 | 删除旧命令列 |
| 296 | `或使用 \`@sdd-roadmap\`（向后兼容）` | 向后兼容说明 | 删除括号内容 |

#### 2.1.3 `src/templates/agents/sddu-docs.md.hbs`
| 行号 | 内容 | 类型 | 处理建议 |
|------|------|------|----------|
| 33-34 | `@sdd-docs                  # 兼容旧命令` | 向后兼容说明 | 删除此行 |
| 138 | `- 旧命令：\`@sdd-docs\` \| 新命令：\`@sddu-docs\`` | 向后兼容说明 | 删除旧命令列 |
| 192 | `1. 确认范围：「开始扫描 .sdd/ 目录（注意：此命令可通过 \`@sdd-docs\` 向后兼容）」` | 示例对话 | 删除括号内容 |

#### 2.1.4 `src/templates/agents/sddu.md.hbs`
| 行号 | 内容 | 类型 | 处理建议 |
|------|------|------|----------|
| 17 | `> - 查看帮助：\`@sddu 帮助\` 或 \`@sdd-help\`` | 向后兼容说明 | 删除 `或 \`@sdd-help\`` |
| 131 | `@sdd-roadmap "规划 Q2 版本，包含登录、支付、分享功能"` | 示例代码 | 改为 `@sddu-roadmap` |
| 173 | `@sdd-docs .sdd/specs-tree-root/       # (兼容) 扫描指定目录` | 示例代码 | 改为 `@sddu-docs` 并删除注释 |
| 190 | `- **老用户**: 可继续使用 \`@sdd-*\` 系列命令（已标记为废弃但依然可用）` | 向后兼容说明 | 删除整行 |
| 194 | `所有 \`@sdd-*\` 命令将在未来版本中逐步废弃，但目前：` | 向后兼容说明 | 删除或重写 |

#### 2.1.5 `src/templates/agents/sddu-tasks.md.hbs`
| 行号 | 内容 | 类型 | 处理建议 |
|------|------|------|----------|
| 20-21 | `（@sddu-spec 输出或 @sdd-spec 兼容输出）` | 向后兼容说明 | 删除 `或 @sdd-spec 兼容输出` |
| 38 | `或 \`@sdd-plan [feature]\`（兼容）` | 向后兼容说明 | 删除括号内容 |
| 101-102 | `- 旧命令：\`@sdd-tasks\` \| 新命令：\`@sddu-tasks\`` | 向后兼容说明 | 删除旧命令列 |
| 111 | `或运行 \`@sdd-build TASK-001\`（兼容命令）` | 示例 | 删除此行 |
| 123 | `或 \`@sdd-docs\`` | 向后兼容说明 | 删除 |
| 151 | `或 \`@sdd-plan [feature]\`（兼容）` | 错误提示 | 删除括号内容 |
| 161 | `（注意：此命令可通过 \`@sdd-tasks [feature]\` 向后兼容）」` | 示例对话 | 删除括号内容 |
| 168 | `或 \`@sdd-build TASK-001\`（兼容）` | 示例对话 | 删除括号内容 |

#### 2.1.6 `src/templates/agents/sddu-discovery.md.hbs`
| 行号 | 内容 | 类型 | 处理建议 |
|------|------|------|----------|
| 207 | `- 旧命令：\`@sdd-discovery\` \| 新命令：\`@sddu-discovery\`` | 向后兼容说明 | 删除旧命令列 |
| 217 | `或运行 \`@sdd-spec [feature 名称]\`（兼容命令）` | 示例 | 删除括号内容 |
| 229 | `或 \`@sdd-docs\`` | 向后兼容说明 | 删除 |
| 266 | `（注意：您可以继续使用 \`@sdd-discovery\` 命令进行向后兼容）` | 示例对话 | 删除括号内容 |
| 273 | `或 \`@sdd-spec 积分系统\`（兼容）` | 示例对话 | 删除括号内容 |

#### 2.1.7 `src/templates/agents/sddu-build.md.hbs`
| 行号 | 内容 | 类型 | 处理建议 |
|------|------|------|----------|
| 20-22 | `（@sddu-spec 输出或 @sdd-spec 兼容输出）` | 向后兼容说明 | 删除 `或 @sdd-spec 兼容输出` |
| 35 | `或 \`@sdd-tasks [feature]\`（兼容）` | 错误提示 | 删除括号内容 |
| 97-98 | `- 旧命令：\`@sdd-build\` \| 新命令：\`@sddu-build\`` | 向后兼容说明 | 删除旧命令列 |
| 102 | `或 @sdd-review` | 向后兼容说明 | 删除 |
| 114 | `或 \`@sdd-docs\`` | 向后兼容说明 | 删除 |
| 129 | `(@sdd-spec 兼容)` | 注释 | 删除括号内容 |
| 143 | `或 \`@sdd-tasks [feature]\`（兼容）` | 错误提示 | 删除括号内容 |
| 145 | `或 \`@sdd-spec\`（兼容）` | 错误提示 | 删除括号内容 |
| 153 | `（注意：此命令可通过 \`@sdd-build\` 向后兼容）」` | 示例对话 | 删除括号内容 |
| 157 | `或 \`@sdd-build TASK-002\`（兼容）` | 示例对话 | 删除括号内容 |
| 157 | `或 \`@sdd-review\`（兼容）` | 示例对话 | 删除括号内容 |

#### 2.1.8 `src/templates/agents/sddu-plan.md.hbs`
| 行号 | 内容 | 类型 | 处理建议 |
|------|------|------|----------|
| 20 | `（@sddu-spec 输出或 @sdd-spec 兼容输出）` | 向后兼容说明 | 删除 `或 @sdd-spec 兼容输出` |
| 37 | `或 \`@sdd-spec [feature]\`（兼容）` | 错误提示 | 删除括号内容 |
| 114-115 | `- 旧命令：\`@sdd-plan\` \| 新命令：\`@sddu-plan\`` | 向后兼容说明 | 删除旧命令列 |
| 119 | `或运行 \`@sdd-tasks [feature 名称]\`（兼容命令）` | 示例 | 删除括号内容 |
| 131 | `或 \`@sdd-docs\`` | 向后兼容说明 | 删除 |
| 154 | `或 \`@sdd-spec [feature]\`（兼容）` | 错误提示 | 删除括号内容 |
| 164 | `（注意：此命令可通过 \`@sdd-plan [feature]\` 向后兼容）」` | 示例对话 | 删除括号内容 |
| 172 | `或 \`@sdd-tasks 用户登录\`（兼容）` | 示例对话 | 删除括号内容 |

#### 2.1.9 `src/templates/agents/sddu-review.md.hbs`
| 行号 | 内容 | 类型 | 处理建议 |
|------|------|------|----------|
| 20-22 | `（@sddu-spec 输出或 @sdd-spec 兼容输出）` | 向后兼容说明 | 删除 `或 @sdd-spec 兼容输出` |
| 54 | `或 \`@sdd-build\`（兼容）` | 错误提示 | 删除括号内容 |
| 106 | `- 旧命令：\`@sdd-review\` \| 新命令：\`@sddu-review\`` | 向后兼容说明 | 删除旧命令列 |
| 139 | `或 \`@sdd-docs\`` | 向后兼容说明 | 删除 |
| 177 | `（注意：此命令可通过 \`@sdd-review\` 向后兼容）」` | 示例对话 | 删除括号内容 |
| 182 | `或 \`@sdd-validate 用户登录\`（兼容）` | 示例对话 | 删除括号内容 |

#### 2.1.10 `src/templates/agents/sddu-validate.md.hbs`
| 行号 | 内容 | 类型 | 处理建议 |
|------|------|------|----------|
| 20 | `（@sddu-spec 输出或 @sdd-spec 兼容输出）` | 向后兼容说明 | 删除 `或 @sdd-spec 兼容输出` |
| 36 | `或 \`@sdd-review [feature]\`（兼容）` | 错误提示 | 删除括号内容 |
| 98 | `- 旧命令：\`@sdd-validate\` \| 新命令：\`@sddu-validate\`` | 向后兼容说明 | 删除旧命令列 |
| 151 | `或 \`@sdd-docs\`` | 向后兼容说明 | 删除 |
| 179 | `或 \`@sdd-review [feature]\`（兼容）` | 错误提示 | 删除括号内容 |
| 189 | `（注意：此命令可通过 \`@sdd-validate\` 向后兼容）」` | 示例对话 | 删除括号内容 |

#### 2.1.11 `src/templates/agents/sddu-spec.md.hbs`
| 行号 | 内容 | 类型 | 处理建议 |
|------|------|------|----------|
| 101 | `- 旧命令：\`@sdd-spec\` \| 新命令：\`@sddu-spec\`` | 向后兼容说明 | 删除旧命令列 |
| 106 | `或运行 \`@sdd-plan [feature 名称]\`（兼容命令）` | 示例 | 删除括号内容 |
| 118 | `或 \`@sdd-docs\`` | 向后兼容说明 | 删除 |
| 152 | `（注意：此命令可通过 \`@sdd-spec\` 向后兼容）」` | 示例对话 | 删除括号内容 |
| 158 | `或 \`@sdd-plan 用户登录\`（兼容）` | 示例对话 | 删除括号内容 |

---

### 2.2 源码注释中的 "SDD" 字眼（中优先级）

**文件数**: 4 个文件

#### 2.2.1 `src/index.ts`
| 行号 | 内容 | 类型 | 处理建议 |
|------|------|------|----------|
| 1 | `// SDD Plugin for OpenCode` | 文件头注释 | 改为 `// SDDU Plugin for OpenCode` |
| 88 | `// 可以在这里初始化 SDD 状态` | 注释 | 改为 `// 可以在这里初始化 SDDU 状态` |

#### 2.2.2 `src/agents/sddu-agents.ts`
| 行号 | 内容 | 类型 | 处理建议 |
|------|------|------|----------|
| 1 | `// SDDU Agents 注册` | 文件头注释 | ✅ 已经是 SDDU，无需修改 |

#### 2.2.3 `src/state/machine.ts`
| 行号 | 内容 | 类型 | 处理建议 |
|------|------|------|----------|
| 13 | `// Agent workflow stages matching SDD Agent phases` | 注释 | 改为 `// Agent workflow stages matching SDDU Agent phases` |
| 16 | `// Mapping for phase tracking (matching SDD workflow)` | 注释 | 改为 `// Mapping for phase tracking (matching SDDU workflow)` |
| 275 | `// 对于 SDD 工作流阶段，标记可能的跳跃 - 根据 SDD 阶段 1-6 进行考虑` | 中文注释 | 改为 `// 对于 SDDU 工作流阶段...` |
| 423 | `// Determine SDD phase number based on state` | 注释 | 改为 `// Determine SDDU phase number based on state` |

#### 2.2.4 `src/types.ts`
| 行号 | 内容 | 类型 | 处理建议 |
|------|------|------|----------|
| 1 | `// SDD 工具系统类型定义统一出口` | 文件头注释 | 改为 `// SDDU 工具系统类型定义统一出口` |

---

### 2.3 类型定义中的 `Sdd*` 命名（高优先级）

**文件数**: 3 个文件

#### 2.3.1 `src/types.ts`
| 行号 | 内容 | 类型 | 处理建议 |
|------|------|------|----------|
| 100 | `export interface SddConfig {` | 类型定义 | 改为 `export interface SdduConfig {` |

#### 2.3.2 `src/state/machine.ts`
| 行号 | 内容 | 类型 | 处理建议 |
|------|------|------|----------|
| 17 | `export type SddPhase = 1 | 2 | 3 | 4 | 5 | 6;` | 类型定义 | 改为 `export type SdduPhase = 1 | 2 | 3 | 4 | 5 | 6;` |

#### 2.3.3 `src/commands/sddu-migrate-schema.ts`
| 行号 | 内容 | 类型 | 处理建议 |
|------|------|------|----------|
| 33 | `export class SddMigrateSchemaCommand {` | 类名 | 改为 `export class SdduMigrateSchemaCommand {` |
| 353 | `const command = new SddMigrateSchemaCommand(options.specsDir);` | 类实例化 | 改为 `SdduMigrateSchemaCommand` |

#### 2.3.4 `src/index.ts`
| 行号 | 内容 | 类型 | 处理建议 |
|------|------|------|----------|
| 41 | `import { SddMigrateSchemaCommand } from './commands/sddu-migrate-schema';` | 导入 | 改为 `SdduMigrateSchemaCommand` |
| 205 | `SddMigrateSchemaCommand,` | 导出 | 改为 `SdduMigrateSchemaCommand,` |

---

### 2.4 测试文件中的 `Sdd*` 命名（高优先级）

**文件数**: 3 个文件

#### 2.4.1 `src/types.test.ts`
| 行号 | 内容 | 类型 | 处理建议 |
|------|------|------|----------|
| 52 | `SddConfig,` | 导入 | 改为 `SdduConfig,` |
| 187 | `const config: SddConfig = {` | 类型引用 | 改为 `const config: SdduConfig = {` |

#### 2.4.2 `src/errors.test.ts`
| 行号 | 内容 | 类型 | 处理建议 |
|------|------|------|----------|
| 131 | `// 测试处理已有 SddError` | 注释 | 改为 `// 测试处理已有 SdduError` |
| 133 | `const handledSddError = ErrorHandler.handle(sddError);` | 变量名 | 改为 `handledSdduError` 和 `sdduError` |
| 135 | `expect(handledSddError).toBe(sddError);` | 断言 | 改为 `handledSdduError` 和 `sdduError` |

#### 2.4.3 `src/agents/registry.test.ts`
| 行号 | 内容 | 类型 | 处理建议 |
|------|------|------|----------|
| 89 | `name: 'sdd-api-agent',` | Agent 名称 | 改为 `sddu-api-agent` |
| 95 | `name: 'sdd-db-agent',` | Agent 名称 | 改为 `sddu-db-agent` |
| 113-114 | `expect(sddAgents.some(a => a.name === 'sdd-api-agent')).toBe(true);` | 断言 | 改为 `sddu-api-agent` |
| 120 | `expect(apiRelated[0].name).toBe('sdd-api-agent');` | 断言 | 改为 `sddu-api-agent` |

#### 2.4.4 `src/state/schema-v2.0.0.test.ts`
| 行号 | 内容 | 类型 | 处理建议 |
|------|------|------|----------|
| 14, 20, 26, 32, 56 | `triggeredBy: 'sdd-spec-agent'` 等 | triggeredBy 字段 | 改为 `sddu-spec-agent` 等 |

---

### 2.5 所有 `sdd-` 引用（排除 `sddu-`）（中优先级）

这部分已在 2.4 中覆盖，主要是测试文件中的 Agent 名称引用。

---

### 2.6 向后兼容代码（高优先级）

**文件数**: 2 个文件

#### 2.6.1 `src/state/migrate-v1-to-v2.ts`
| 行号 | 内容 | 类型 | 处理建议 |
|------|------|------|----------|
| 2 | `// Provides backward compatibility for state schema evolution` | 文件注释 | 删除或重写为说明迁移功能 |
| 7 | `* Represents legacy state schema v1.2.11 format` | JSDoc | 保留（这是迁移功能，不是兼容性代码） |
| 22 | `* Maps legacy status values to new workflow status values` | JSDoc | 保留（这是迁移功能） |
| 24 | `const mapLegacyStatus = (legacyStatus: string): string => {` | 函数名 | 保留但修改注释 |
| 26, 41, 46, 47, 51, 53-68, 76, 77, 83, 85, 102, 104, 113 | 多处 `legacy` 字眼 | 变量名和注释 | 保留（这是迁移逻辑，不是向后兼容代码） |

**判定**: 此文件是**状态迁移工具**，不是向后兼容代码，应该保留。但需要更新注释中的 "backward compatibility" 字眼。

#### 2.6.2 `src/agents/sddu-agents.ts`
| 行号 | 内容 | 类型 | 处理建议 |
|------|------|------|----------|
| 226 | `// Return the agent info for backward compatibility` | 注释 | 改为 `// Return the agent info` |

---

## 3. 处理优先级

### P0 - 必须修改（阶段 2 和阶段 3）
1. ✅ **模板文件中的所有 `@sdd-*` 引用** - 9 个文件，约 80 处
2. ✅ **类型定义 `Sdd*` → `Sddu*`** - 4 个文件，约 10 处
3. ✅ **测试文件中的 `Sdd*` 命名** - 4 个文件，约 15 处
4. ✅ **源码注释中的 "SDD"** - 4 个文件，约 8 处

### P1 - 应该修改（阶段 4）
1. ✅ **向后兼容说明** - 从模板中删除所有 "backward compatibility"、"legacy"、"deprecated" 描述
2. ✅ **更新注释中的 "backward compatibility"** - 2 处

### P2 - 保留（迁移功能）
1. ⚠️ **`src/state/migrate-v1-to-v2.ts`** - 这是状态迁移工具，不是向后兼容代码，应该保留

---

## 4. 处理统计

| 类别 | 文件数 | 位置数 | 优先级 | 状态 |
|------|--------|--------|--------|------|
| 模板文件 `@sdd-*` | 9 | ~80 | P0 | 待处理 |
| 源码注释 "SDD" | 4 | ~8 | P0 | 待处理 |
| 类型定义 `Sdd*` | 4 | ~10 | P0 | 待处理 |
| 测试文件 `Sdd*` | 4 | ~15 | P0 | 待处理 |
| 向后兼容代码 | 2 | ~2 | P1 | 待处理 |
| **总计** | **23** | **~115** | - | - |

---

## 5. 验收标准

### 阶段 2 完成后
- [ ] grep 扫描无 "SDD Plugin" 残留
- [ ] grep 扫描无 `Sdd[A-Z]` 残留（除 Sddu 外）
- [ ] grep 扫描无 `@sdd-` 残留（除 @sddu- 外）
- [ ] 模板中无 "backward compatibility"、"legacy"、"deprecated" 等描述

### 阶段 3 完成后
- [ ] 所有测试文件中的 `Sdd*` 已改为 `Sddu*`
- [ ] 所有测试用例运行通过
- [ ] 测试覆盖率 ≥ 90%

### 阶段 4 完成后
- [ ] `src/agents/sddu-agents.ts` 中的 "backward compatibility" 注释已删除
- [ ] `src/state/migrate-v1-to-v2.ts` 中的 "backward compatibility" 注释已更新
- [ ] 无其他向后兼容代码残留

---

## 6. 更新历史

| 日期 | 操作 | 负责人 | 备注 |
|------|------|--------|------|
| 2026-04-09 | 创建清单 | SDDU Build Agent | 初始版本 |

---

**下一步**: 开始执行阶段 2: 批量替换
