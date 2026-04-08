# 源码审查报告 - SDD→SDDU 引用全面清理

**审查日期**: 2026-04-08  
**审查人**: SDD Review Agent  
**审查范围**: 所有源码文件（排除 .sdd/ 历史文档）  
**状态**: 待修复  

---

## 执行摘要

本次审查扫描了以下目录的所有源码文件：
- `src/` - 主要源码目录
- `src/templates/` - 模板文件
- `src/agents/` - Agent 定义
- `src/commands/` - 命令脚本
- `src/state/` - 状态管理
- `src/discovery/` - 需求挖掘模块
- `tests/` - 测试文件
- `package.json`, `opencode.json` - 项目配置

**发现问题总数**: 7 个关键源码问题 + 多个测试文件遗留引用

---

## 问题清单

### 🔴 高优先级 - 必须修改的源码

#### 问题 1: opencode.json 配置文件使用旧插件名

**文件**: `/home/usb/workspace/wks-sddu/sddu/opencode.json`  
**问题**: 
- 第 4 行: `"plugin": ["opencode-sdd-plugin"]` 应改为 `"plugin": ["opencode-sddu-plugin"]`
- 第 7-96 行: 所有 agent 名称使用 `sdd-*` 前缀，应改为 `sddu-*`

**修改方案**:
```json
// 修改前
"plugin": ["opencode-sdd-plugin"]
"agent": {
  "sdd": {...},
  "sdd-help": {...},
  "sdd-spec": {...},
  ...
}

// 修改后
"plugin": ["opencode-sddu-plugin"]
"agent": {
  "sddu": {...},
  "sddu-help": {...},
  "sddu-spec": {...},
  ...
}
```

**影响**: 高 - 这是项目根目录配置文件，影响所有用户使用

---

#### 问题 2: 配置模板使用旧 agent 名称

**文件**: `/home/usb/workspace/wks-sddu/sddu/src/templates/config/opencode.json.hbs`  
**问题**: 
- 第 3 行: `"plugin": ["opencode-sddu-plugin"]` ✅ (已正确)
- 第 5-94 行: 所有 agent 名称仍然使用 `sdd-*` 前缀，应改为 `sddu-*`

**修改方案**:
将模板中所有 agent 名称从 `sdd-*` 改为 `sddu-*`：
- `sdd` → `sddu`
- `sdd-help` → `sddu-help`
- `sdd-0-discovery` → `sddu-0-discovery`
- `sdd-discovery` → `sddu-discovery`
- `sdd-1-spec` → `sddu-1-spec`
- `sdd-spec` → `sddu-spec`
- `sdd-plan` → `sddu-plan`
- `sdd-tasks` → `sddu-tasks`
- `sdd-build` → `sddu-build`
- `sdd-review` → `sddu-review`
- `sdd-validate` → `sddu-validate`
- `sdd-docs` → `sddu-docs`
- `sdd-roadmap` → `sddu-roadmap`

**影响**: 高 - 此模板用于生成新项目的 opencode.json

---

#### 问题 3: 主入口文件注释使用旧品牌名

**文件**: `/home/usb/workspace/wks-sddu/sddu/src/index.ts`  
**问题**: 
- 第 1 行: `// SDD Plugin for OpenCode` 应改为 `// SDDU Plugin for OpenCode`

**修改方案**:
```typescript
// 修改前
// SDD Plugin for OpenCode

// 修改后
// SDDU Plugin for OpenCode
```

**影响**: 低 - 仅注释，不影响功能

---

#### 问题 4: 类型定义使用旧命名

**文件**: `/home/usb/workspace/wks-sddu/sddu/src/types.ts`  
**问题**: 
- 第 100 行: `export interface SddConfig` 应改为 `export interface SdduConfig`

**修改方案**:
```typescript
// 修改前
export interface SddConfig {
  autoUpdateState?: boolean;
  ...
}

// 修改后
export interface SdduConfig {
  autoUpdateState?: boolean;
  ...
}
```

**影响**: 中 - 这是公共 API，需要同时检查所有引用点

---

#### 问题 5: 状态机类型使用旧命名

**文件**: `/home/usb/workspace/wks-sddu/sddu/src/state/machine.ts`  
**问题**: 
- 第 17 行: `export type SddPhase = 1 | 2 | 3 | 4 | 5 | 6;` 应改为 `export type SdduPhase`

**修改方案**:
```typescript
// 修改前
export type SddPhase = 1 | 2 | 3 | 4 | 5 | 6;

// 修改后
export type SdduPhase = 1 | 2 | 3 | 4 | 5 | 6;
```

**影响**: 中 - 需要检查所有引用此类型的地方

---

#### 问题 6: 命令类名和文件名使用旧命名

**文件**: `/home/usb/workspace/wks-sddu/sddu/src/commands/sdd-migrate-schema.ts`  
**问题**: 
- 文件名: `sdd-migrate-schema.ts` 应改为 `sddu-migrate-schema.ts`
- 第 33 行: `export class SddMigrateSchemaCommand` 应改为 `export class SdduMigrateSchemaCommand`
- 第 353 行: 引用也需要更新

**修改方案**:
1. 重命名文件: `sdd-migrate-schema.ts` → `sddu-migrate-schema.ts`
2. 更新类名:
```typescript
// 修改前
export class SddMigrateSchemaCommand {

// 修改后
export class SdduMigrateSchemaCommand {
```

**影响**: 中 - 需要同时更新所有导入此类的地方

---

#### 问题 7: Agent 注册表过滤条件不完整

**文件**: `/home/usb/workspace/wks-sddu/sddu/src/agents/registry.ts`  
**问题**: 
- 第 166 行: `file.startsWith('sdd-')` 只支持旧前缀，应同时支持 `sddu-`

**修改方案**:
```typescript
// 修改前
const agentFiles = configFiles.filter(file => 
  file.endsWith('.md') && file.startsWith('sdd-')
);

// 修改后
const agentFiles = configFiles.filter(file => 
  file.endsWith('.md') && (file.startsWith('sdd-') || file.startsWith('sddu-'))
);
```

**影响**: 中 - 影响动态 Agent 加载功能

---

### 🟡 中优先级 - 测试文件中的遗留引用

测试文件中的 `@sdd-*` 引用大部分是为了测试向后兼容性，可以保留。但以下文件需要更新以同时测试 `@sddu-*`：

| 文件 | 问题 | 建议 |
|------|------|------|
| `tests/e2e/multi-feature.test.ts` | 使用 `@sdd-spec`, `@sdd-plan` 等 | 添加 `@sddu-*` 测试用例 |
| `tests/state/agent-integration.test.ts` | `triggeredBy: '@sdd-spec'` | 同时测试 `@sddu-spec` |
| `tests/unit/compatibility.test.ts` | 路径包含 `opencode-sdd-plugin` | 保留作为兼容性测试 |
| `tests/compatibility/legacy.test.ts` | 注释使用 `@sdd-*` | 保留作为兼容性文档 |

---

### 🟢 低优先级 - 构建产物

`dist/` 目录中的文件是构建产物，应在源码修改后重新构建自动生成。

---

## 修改优先级

| 优先级 | 文件数 | 描述 |
|--------|--------|------|
| 🔴 P0 | 2 | `opencode.json`, `src/templates/config/opencode.json.hbs` |
| 🔴 P0 | 5 | 源码类型和类名 (`SddConfig`, `SddPhase`, `SddMigrateSchemaCommand`) |
| 🟡 P1 | 4 | 测试文件更新 |
| 🟢 P2 | - | 构建产物（自动更新） |

---

## 修改后验证步骤

1. **语法检查**: `npm run build` 应无编译错误
2. **类型检查**: TypeScript 类型应全部正确
3. **单元测试**: `npm test` 应全部通过
4. **e2e 测试**: 运行 e2e 脚本验证完整工作流
5. **生成验证**: 检查生成的 `opencode.json` 和 `.opencode/*` 文件使用新命名

---

## 附录：完整文件清单

### 需要修改的源码文件 (7 个)
1. `/opencode.json`
2. `/src/templates/config/opencode.json.hbs`
3. `/src/index.ts`
4. `/src/types.ts`
5. `/src/state/machine.ts`
6. `/src/commands/sdd-migrate-schema.ts` (需重命名)
7. `/src/agents/registry.ts`

### 需要更新的测试文件 (4 个)
1. `/tests/e2e/multi-feature.test.ts`
2. `/tests/state/agent-integration.test.ts`
3. `/tests/state/simple-agent-integration.test.ts`
4. `/tests/state/migrator-v2.test.ts`

### 排除的文件
- `.sdd/` 目录下所有文件（历史文档，保留作为记录）
- `dist/` 目录下所有文件（构建产物，自动更新）
- `node_modules/` 目录下所有文件（依赖包）

---

**报告生成时间**: 2026-04-08  
**下一步**: 将此报告纳入 spec.md 规范，创建修改任务
