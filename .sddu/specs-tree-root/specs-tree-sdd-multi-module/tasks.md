# 任务分解：SDD 子 Feature 化并行开发支持

| 元数据 | 值 |
|--------|-----|
| **Feature ID** | sdd-multi-module |
| **Feature 名称** | SDD 子 Feature 化并行开发支持 |
| **规范版本** | 1.2.11 |
| **创建日期** | 2026-03-31 |
| **状态** | tasked |
| **总任务数** | 10 个 |
| **预计工时** | 37 小时 (约 5 人天) |
| **关联 Plan** | `.sdd/.specs/sdd-multi-module/plan.md` |
| **关联 Spec** | `.sdd/.specs/sdd-multi-module/spec.md` |

---

## 并行执行组

### 组 0: 容器化基础设施（优先执行）
- [ ] TASK-250-001: 实现工作空间识别 (2h)
- [ ] TASK-250-002: 更新状态管理器 (3h)
- [ ] TASK-250-003: 更新命令系统 (2h)
- [ ] TASK-250-004: 添加兼容层 (2h)
- [ ] TASK-250-005: 单元测试 (2h)
- [ ] TASK-250-006: 文档更新 (1h)

### 组 1: 核心状态管理基础 (可并行，等待组 0)
- [ ] TASK-001: 定义 State Schema v1.2.11 (FR-252-1, FR-252-6) (2h)
- [ ] TASK-002: 实现状态迁移工具 (FR-252-5) (3h)
- [ ] TASK-003: 创建子 Feature 目录结构模板 (FR-251-1, FR-251-2) (4h)

### 组 2: 状态管理核心 (等待组 1)
- [ ] TASK-004: 实现多子 Feature 状态管理器 (FR-252-2, FR-252-3, FR-252-4) (6h)
- [ ] TASK-005: 实现子 Feature 目录管理 (FR-251-3, FR-251-4) (4h)

### 组 3: 并行任务机制 (等待组 2)
- [ ] TASK-006: 实现 tasks.md 解析器 (FR-253-1, FR-253-2, FR-253-3) (4h)
- [ ] TASK-007: 实现依赖就绪通知 (FR-253-4, FR-253-5) (2h)

### 组 4: 集成测试 (等待组 3)
- [ ] TASK-008: 端到端测试 (FR-254 简化，整合到各任务) (4h)
- [ ] TASK-009: 向后兼容测试 (NFR-101~104) (3h)

---

## 任务详情

## TASK-250-001: 实现工作空间识别

| 属性 | 值 |
|------|-----|
| **功能需求** | F-250 |
| **优先级** | P0 |
| **预估工时** | 2 小时 |
| **依赖任务** | 无 |
| **并行组** | 组 0 |
| **负责人** | TBD |

### 工作内容
- [ ] 实现 `getSDDWorkspace()` 函数，支持优先级：环境变量 > `.sdd/` > `.specs/`
- [ ] 实现工作空间自动检测逻辑
- [ ] 添加工作空间验证
- [ ] 编写单元测试

### 交付物
- `.sdd/src/utils/workspace.ts` - 工作空间识别工具 (约 80 行)
- `.sdd/src/utils/workspace.test.ts` - 单元测试 (约 60 行)

### 验收标准
- [ ] 优先读取 `SDD_WORKSPACE` 环境变量
- [ ] 检测 `.sdd/` 目录存在时返回 `.sdd`
- [ ] 检测 `.specs/` 目录存在时返回 `.` (兼容模式)
- [ ] 无 SDD 工作空间时抛出明确错误
- [ ] 单元测试覆盖率 > 80%

### 验证命令
```bash
npm test -- workspace.test.ts
```

### 技术说明
```typescript
// .sdd/src/utils/workspace.ts
import { existsSync } from 'fs';

/**
 * 获取 SDD 工作空间根目录
 * 优先级：环境变量 > .sdd/ 目录 > .specs/ 目录
 */
export function getSDDWorkspace(): string {
  // 1. 检查环境变量
  if (process.env.SDD_WORKSPACE) {
    return process.env.SDD_WORKSPACE;
  }
  
  // 2. 优先查找 .sdd/ 目录（容器模式）
  if (existsSync('.sdd')) {
    return '.sdd';
  }
  
  // 3. 回退到 .specs/ 目录（兼容模式）
  if (existsSync('.specs')) {
    return '.';
  }
  
  throw new Error('未找到 SDD 工作空间：请确保存在 .sdd/ 或 .specs/ 目录');
}

/**
 * 获取 specs 目录路径
 */
export function getSpecsDir(): string {
  const workspace = getSDDWorkspace();
  return workspace === '.sdd' ? '.sdd/.specs' : '.specs';
}
```

---

## TASK-250-002: 更新状态管理器

| 属性 | 值 |
|------|-----|
| **功能需求** | F-250 |
| **优先级** | P0 |
| **预估工时** | 3 小时 |
| **依赖任务** | TASK-250-001 |
| **并行组** | 组 0 |
| **负责人** | TBD |

### 工作内容
- [ ] 更新状态文件路径：`.specs/[feature]/state.json` → `.sdd/.specs/[feature]/state.json`
- [ ] 更新状态加载和保存逻辑
- [ ] 支持统一 State Schema v1.2.11（无 mode/subFeatures 字段）
- [ ] 实现子 Feature 状态扫描功能

### 交付物
- `.sdd/src/state/manager.ts` - 状态管理器 (更新，约 150 行)
- `.sdd/src/state/manager.test.ts` - 单元测试 (约 100 行)

### 验收标准
- [ ] 状态文件路径使用 `.sdd/.specs/[feature]/state.json`
- [ ] 支持统一 State Schema（无 mode/subFeatures 字段）
- [ ] 实现 `scanSubFeatures()` 函数扫描同级子 Feature 目录
- [ ] 状态加载/保存正常工作
- [ ] 单元测试覆盖率 > 80%

### 验证命令
```bash
npm test -- state/manager.test.ts
```

### 技术说明
```typescript
// .sdd/src/state/manager.ts
import { getSpecsDir } from '../utils/workspace';
import { readdirSync, statSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

/**
 * 统一 State Schema v1.2.11
 * 移除了 mode 和 subFeatures 字段，通过目录结构自动识别模式
 */
export interface FeatureState {
  feature: string;
  name?: string;
  version?: string;
  status: FeatureStatus;
  phase?: number;
  files?: {
    spec?: string;
    plan?: string;
    tasks?: string;
    readme?: string;
  };
  dependencies?: {
    on?: string[];
    blocking?: string[];
  };
  assignee?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 扫描子 Feature 目录（同级扁平结构）
 * 子 Feature 位于 .sdd/.specs/[sub-feature-id]/ 目录下
 */
export function scanSubFeatures(featurePath: string): FeatureState[] {
  const specsDir = getSpecsDir();
  const subFeatureStates: FeatureState[] = [];
  
  const entries = readdirSync(specsDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && !entry.name.startsWith('.')) {
      const stateFile = join(specsDir, entry.name, 'state.json');
      if (existsSync(stateFile)) {
        subFeatureStates.push(JSON.parse(readFileSync(stateFile, 'utf-8')));
      }
    }
  }
  
  return subFeatureStates;
}
```

---

## TASK-250-003: 更新命令系统

| 属性 | 值 |
|------|-----|
| **功能需求** | F-250 |
| **优先级** | P0 |
| **预估工时** | 2 小时 |
| **依赖任务** | TASK-250-001 |
| **并行组** | 组 0 |
| **负责人** | TBD |

### 工作内容
- [ ] 更新所有命令的路径引用（`.specs/` → `.sdd/.specs/`）
- [ ] 更新 `@sdd-spec` 命令支持新目录结构
- [ ] 更新 `@sdd-plan` 命令支持新目录结构
- [ ] 更新 `@sdd-tasks` 命令支持新目录结构
- [ ] 更新 `@sdd-build` 命令支持新目录结构

### 交付物
- `.sdd/src/commands/sdd-spec.ts` - 更新 (约 50 行变更)
- `.sdd/src/commands/sdd-plan.ts` - 更新 (约 50 行变更)
- `.sdd/src/commands/sdd-tasks.ts` - 更新 (约 50 行变更)
- `.sdd/src/commands/sdd-build.ts` - 更新 (约 50 行变更)

### 验收标准
- [ ] 所有命令使用 `getSpecsDir()` 获取规范目录
- [ ] 文件路径正确指向 `.sdd/.specs/[feature]/`
- [ ] 命令执行正常，无路径错误
- [ ] 集成测试通过

### 验证命令
```bash
npm test -- commands/*.test.ts
```

---

## TASK-250-004: 添加兼容层

| 属性 | 值 |
|------|-----|
| **功能需求** | F-250, NFR-101~104 |
| **优先级** | P0 |
| **预估工时** | 2 小时 |
| **依赖任务** | TASK-250-001, TASK-250-002 |
| **并行组** | 组 0 |
| **负责人** | TBD |

### 工作内容
- [ ] 实现旧 `.specs/` 结构检测
- [ ] 实现自动迁移逻辑（可选）
- [ ] 实现旧格式 state.json 读取兼容
- [ ] 添加迁移提示和文档

### 交付物
- `.sdd/src/utils/compatibility.ts` - 兼容层工具 (约 120 行)
- `.sdd/src/utils/compatibility.test.ts` - 单元测试 (约 80 行)

### 验收标准
- [ ] 自动检测旧 `.specs/` 结构项目
- [ ] 支持旧格式 state.json（无 version 字段）读取
- [ ] 提供迁移提示（不强制迁移）
- [ ] 旧项目无需修改可正常工作
- [ ] 单元测试覆盖率 > 80%

### 验证命令
```bash
npm test -- compatibility.test.ts
```

### 技术说明
```typescript
// .sdd/src/utils/compatibility.ts
import { existsSync, readFileSync } from 'fs';

/**
 * 检测是否为旧格式 state.json（v1.1.1 或更早）
 */
export function isLegacyState(state: any): boolean {
  return !state.version || state.version === '1.1.1';
}

/**
 * 检测旧 .specs/ 结构
 */
export function hasLegacySpecsStructure(): boolean {
  return existsSync('.specs') && !existsSync('.sdd');
}

/**
 * 获取迁移建议
 */
export function getMigrationSuggestion(): string {
  if (hasLegacySpecsStructure()) {
    return '检测到旧版 .specs/ 结构，建议迁移到 .sdd/.specs/ 容器化结构';
  }
  return '';
}
```

---

## TASK-250-005: 单元测试

| 属性 | 值 |
|------|-----|
| **功能需求** | F-250 |
| **优先级** | P1 |
| **预估工时** | 2 小时 |
| **依赖任务** | TASK-250-001 ~ TASK-250-004 |
| **并行组** | 组 0 |
| **负责人** | TBD |

### 工作内容
- [ ] 编写工作空间识别测试
- [ ] 编写状态管理器测试
- [ ] 编写兼容层测试
- [ ] 确保测试覆盖率 > 80%

### 交付物
- `.sdd/tests/unit/workspace.test.ts` - 工作空间测试
- `.sdd/tests/unit/state-manager.test.ts` - 状态管理测试
- `.sdd/tests/unit/compatibility.test.ts` - 兼容性测试

### 验收标准
- [ ] 所有 F-250 功能有对应测试
- [ ] 测试覆盖率 > 80%
- [ ] 所有测试通过
- [ ] CI 集成正常

### 验证命令
```bash
npm test -- tests/unit/
```

---

## TASK-250-006: 文档更新

| 属性 | 值 |
|------|-----|
| **功能需求** | F-250 |
| **优先级** | P1 |
| **预估工时** | 1 小时 |
| **依赖任务** | TASK-250-001 ~ TASK-250-005 |
| **并行组** | 组 0 |
| **负责人** | TBD |

### 工作内容
- [ ] 更新 README.md 中的路径说明
- [ ] 更新用户指南中的目录结构示例
- [ ] 添加容器化结构迁移指南
- [ ] 更新 API 文档

### 交付物
- `.sdd/README.md` - 更新
- `.sdd/docs/migration-guide.md` - 新增迁移指南

### 验收标准
- [ ] README.md 包含 `.sdd/` 容器化结构说明
- [ ] 迁移指南清晰完整
- [ ] 所有文档路径示例使用新结构
- [ ] 文档无过时引用

### 验证命令
```bash
# 手动检查文档
```

---

## TASK-001: 定义 State Schema v1.2.11

| 属性 | 值 |
|------|-----|
| **功能需求** | FR-252-1, FR-252-6 |
| **优先级** | P0 |
| **预估工时** | 2 小时 |
| **依赖任务** | TASK-250-001, TASK-250-002 |
| **并行组** | 组 1 |
| **负责人** | TBD |

### 工作内容
- [ ] 定义 v1.2.11 统一 State JSON Schema
- [ ] **移除 mode 和 subFeatures 字段**，采用统一 Schema
- [ ] 实现 Schema 验证逻辑（使用 ajv）
- [ ] 编写 Schema 单元测试

### 交付物
- `.sdd/src/state/schema-v1.2.11.ts` - State Schema 定义 (约 120 行)
- `.sdd/src/state/schema-v1.2.11.test.ts` - Schema 验证测试 (约 80 行)

### 验收标准
- [ ] JSON Schema 包含必需字段 (feature, status, version, phase, files, dependencies, assignee)
- [ ] **不包含 mode 字段**（通过目录结构自动识别）
- [ ] **不包含 subFeatures 字段**（通过扫描同级目录发现）
- [ ] 使用 ajv 验证 Schema 有效性
- [ ] 单元测试覆盖率 > 80%

### 技术说明
```typescript
// Schema 核心结构 (v1.2.11)
// 移除了 mode 和 subFeatures 字段
interface FeatureState {
  feature: string;           // Feature ID
  name?: string;             // 人类可读名称
  version?: string;          // State schema 版本，默认 "1.2.11"
  status: FeatureStatus;     // 当前状态
  phase?: number;            // SDD 阶段 1-6
  files?: {                  // 文档路径配置
    spec?: string;
    plan?: string;
    tasks?: string;
    readme?: string;
  };
  dependencies?: {           // 依赖关系
    on?: string[];
    blocking?: string[];
  };
  assignee?: string;         // 负责人
  createdAt?: string;
  updatedAt?: string;
}

// 模式识别通过目录结构：
// - 有同级子 Feature 目录 = multi 模式
// - 无同级子 Feature 目录 = single 模式
```

---

## TASK-002: 实现状态迁移工具

| 属性 | 值 |
|------|-----|
| **功能需求** | FR-252-5 |
| **优先级** | P1 |
| **预估工时** | 3 小时 |
| **依赖任务** | TASK-001 |
| **并行组** | 组 1 |
| **负责人** | TBD |

### 工作内容
- [ ] 实现状态版本检测逻辑
- [ ] 实现旧格式 → v1.2.11 迁移逻辑
- [ ] 创建备份机制（迁移前自动备份到 `.sdd/.backups/`）
- [ ] 实现回滚功能
- [ ] 编写迁移测试

### 交付物
- `.sdd/src/state/migrator.ts` - 状态迁移工具 (约 120 行)
- `.sdd/src/state/migrator.test.ts` - 迁移测试 (约 100 行)

### 验收标准
- [ ] 自动检测旧格式 state.json（无 version 字段或 version < 1.2.11）
- [ ] 迁移前创建备份到 `.sdd/.backups/state-YYYYMMDD-HHMMSS.json`
- [ ] 迁移后符合 v1.2.11 Schema（无 mode/subFeatures 字段）
- [ ] 迁移失败时可回滚到备份
- [ ] 迁移日志输出清晰

### 技术说明
```typescript
// .sdd/src/state/migrator.ts
import { FeatureState } from './schema-v1.2.11';

/**
 * 迁移流程
 */
export async function migrateState(oldState: any): Promise<FeatureState> {
  // 1. 备份旧状态
  await backupState(oldState);
  
  // 2. 检测版本并执行相应迁移
  if (!oldState.version || oldState.version === '1.1.1') {
    return migrateFrom111(oldState);
  }
  
  // 3. 验证新状态符合 v1.2.11 Schema
  validateState(newState);
  
  return newState;
}

/**
 * 从 v1.1.1 迁移到 v1.2.11
 * 移除 mode 和 subFeatures 字段
 */
function migrateFrom111(oldState: any): FeatureState {
  const { mode, subFeatures, ...rest } = oldState;
  return {
    ...rest,
    version: '1.2.11',
    updatedAt: new Date().toISOString()
  };
  // mode 和 subFeatures 被移除，通过目录结构自动识别
}
```

---

## TASK-003: 创建子 Feature 目录结构模板

| 属性 | 值 |
|------|-----|
| **功能需求** | FR-251-1, FR-251-2 |
| **优先级** | P0 |
| **预估工时** | 4 小时 |
| **依赖任务** | TASK-250-001 |
| **并行组** | 组 1 |
| **负责人** | TBD |

### 工作内容
- [ ] 设计主 spec.md 模板（包含子 Feature 索引表）
- [ ] 设计子 Feature 文档模板（`.sdd/.specs/[sub-feature-id]/*.md`）
- [ ] 设计 README.md 模板（Feature 级和子 Feature 级）
- [ ] 创建子 Feature 目录模板（**同级扁平结构**，非 sub-features/子目录）
- [ ] 设计跨子 Feature 协同信息结构
- [ ] 创建示例模板文件

### 交付物
模板由 `src/templates/subfeature-templates.ts` 动态生成：
- `generateMainSpec()` - 生成主 spec.md 模板
- `generateSubFeatureSpec()` - 生成子 Feature spec 模板
- `generateFeatureReadmeTemplate()` - 生成 Feature README 模板
- `generateSubFeatureReadmeTemplate()` - 生成子 Feature README 模板
- `generateExample()` - 生成完整示例

### 验收标准
- [ ] 主 spec.md 包含子 Feature 索引表（子 Feature ID、名称、**目录路径**、状态、负责人、阻塞依赖）
- [ ] 子 Feature 索引表为 Markdown 表格格式
- [ ] README.md 模板包含导航和子 Feature 列表
- [ ] **子 Feature 位于 `.sdd/.specs/[sub-feature-id]/` 同级目录**
- [ ] 子 Feature 目录结构完整（README.md + spec.md + state.json）
- [ ] 跨子 Feature 协同信息包含接口约定和数据流
- [ ] 模板可直接用于新项目

### 技术说明
```markdown
# 主 spec.md 模板结构

## 概述
[全局概述]

## 目标
[Feature 级目标]

## 非目标
[Feature 级非目标]

---

## 子 Feature 索引

| 子 Feature ID | 子 Feature 名称 | 目录路径 | 状态 | 负责人 | 阻塞依赖 |
|---------------|-----------------|----------|------|--------|----------|
| user-center | 用户中心 | user-center | specified | 张三 | - |
| order-system | 订单系统 | order-system | planned | 李四 | user-center |
| payment | 支付模块 | payment | planned | 王五 | order-system |

---

## 跨子 Feature 协同

### 接口约定
[接口表格]

### 数据流
[数据流图]
```

**目录结构示例**:
```
.sdd/.specs/
├── spec.md                  # 主文档
├── plan.md                  # 整体技术架构
├── tasks.md                 # 并行任务分组
├── state.json               # Feature 级状态
├── user-center/             # 子 Feature（同级目录）
│   ├── spec.md
│   ├── plan.md
│   ├── tasks.md
│   └── state.json
├── order-system/            # 子 Feature（同级目录）
│   └── ...
└── payment/                 # 子 Feature（同级目录）
    └── ...
```

---

## TASK-004: 实现多子 Feature 状态管理器

| 属性 | 值 |
|------|-----|
| **功能需求** | FR-252-2, FR-252-3, FR-252-4 |
| **优先级** | P0 |
| **预估工时** | 6 小时 |
| **依赖任务** | TASK-001, TASK-002, TASK-250-002 |
| **并行组** | 组 2 |
| **负责人** | TBD |

### 工作内容
- [ ] 实现状态聚合逻辑（Feature 状态 = 最慢子 Feature 状态）
- [ ] 实现子 Feature 依赖关系图构建
- [ ] 实现阻塞关系计算（blocking 字段）
- [ ] 实现循环依赖检测（DFS 算法）
- [ ] 集成到现有状态机

### 交付物
- `.sdd/src/state/multi-feature.ts` - 多子 Feature 状态管理核心 (约 200 行)
- `.sdd/src/utils/dependency-graph.ts` - 依赖图计算工具 (约 150 行)
- `.sdd/src/state/multi-feature.test.ts` - 单元测试 (约 150 行)

### 验收标准
- [ ] 状态聚合正确：Feature 状态等于所有子 Feature 中最慢的状态
- [ ] 依赖关系图可查询任意子 Feature 的依赖和被依赖关系
- [ ] blocking 字段自动计算并更新
- [ ] 循环依赖检测准确，发现循环时报错并阻止
- [ ] 与现有状态机无缝集成
- [ ] **通过扫描 `.sdd/.specs/` 同级目录发现子 Feature**

### 技术说明
```typescript
/**
 * 聚合子 Feature 状态计算 Feature 整体状态
 * 规则：Feature 状态 = 最慢子 Feature 的状态
 */
function aggregateFeatureState(specsDir: string): FeatureStatus {
  // 扫描 .sdd/.specs/ 同级目录获取所有子 Feature
  const subFeatureStates = scanSubFeatures(specsDir);
  
  if (subFeatureStates.length === 0) {
    return 'specified';
  }
  
  const statusOrder: FeatureStatus[] = [
    'specified', 'planned', 'tasked', 'implementing', 'reviewing', 'validated', 'completed'
  ];
  
  let slowestStatus = subFeatureStates[0].status;
  for (const sf of subFeatureStates) {
    if (statusOrder.indexOf(sf.status) < statusOrder.indexOf(slowestStatus)) {
      slowestStatus = sf.status;
    }
  }
  return slowestStatus;
}

/**
 * 扫描子 Feature 目录（同级扁平结构）
 */
function scanSubFeatures(specsDir: string): FeatureState[] {
  const subFeatures: FeatureState[] = [];
  const entries = readdirSync(specsDir, { withFileTypes: true });
  
  for (const entry of entries) {
    if (entry.isDirectory() && !entry.name.startsWith('.')) {
      const stateFile = join(specsDir, entry.name, 'state.json');
      if (existsSync(stateFile)) {
        subFeatures.push(JSON.parse(readFileSync(stateFile, 'utf-8')));
      }
    }
  }
  
  return subFeatures;
}

/**
 * 循环依赖检测 (DFS)
 */
function detectCircularDependency(
  subFeatureId: string,
  dependencies: Record<string, string[]>,
  visited = new Set<string>(),
  path: string[] = []
): string[] | null {
  if (path.includes(subFeatureId)) {
    return [...path, subFeatureId];
  }
  if (visited.has(subFeatureId)) return null;
  
  visited.add(subFeatureId);
  path.push(subFeatureId);
  
  for (const dep of (dependencies[subFeatureId] || [])) {
    const cycle = detectCircularDependency(dep, dependencies, visited, [...path]);
    if (cycle) return cycle;
  }
  
  return null;
}
```

---

## TASK-005: 实现子 Feature 目录管理

| 属性 | 值 |
|------|-----|
| **功能需求** | FR-251-3, FR-251-4 |
| **优先级** | P0 |
| **预估工时** | 4 小时 |
| **依赖任务** | TASK-003, TASK-250-001 |
| **并行组** | 组 2 |
| **负责人** | TBD |

### 工作内容
- [ ] 实现 `.sdd/.specs/[sub-feature-id]/` 目录创建和初始化
- [ ] 实现子 Feature 文档读取和写入
- [ ] 实现子 Feature 索引表自动生成
- [ ] 实现单模块模式检测（向后兼容）
- [ ] 实现子 Feature 文档完整性验证

### 交付物
- `.sdd/src/utils/subfeature-manager.ts` - 子 Feature 目录管理工具 (约 180 行)
- `.sdd/src/utils/subfeature-manager.test.ts` - 单元测试 (约 100 行)

### 验收标准
- [ ] 自动检测 Feature 是单模块还是多子 Feature 模式（通过扫描同级目录）
- [ ] **多子 Feature 模式下子 Feature 位于 `.sdd/.specs/[sub-feature-id]/` 同级目录**
- [ ] 子 Feature 索引表自动从同级目录生成
- [ ] 单模块模式下正常工作（向后兼容）
- [ ] 子 Feature 文档缺失时告警

### 技术说明
```typescript
/**
 * 检测 Feature 模式
 * 通过扫描 .sdd/.specs/ 同级目录判断
 */
async function detectFeatureMode(featurePath: string): Promise<'single' | 'multi'> {
  const specsDir = dirname(featurePath);
  const entries = await fs.readdir(specsDir, { withFileTypes: true });
  const featureDirs = entries
    .filter(e => e.isDirectory() && !e.name.startsWith('.'))
    .map(e => e.name);
  
  // 有多个目录 = multi 模式
  return featureDirs.length > 1 ? 'multi' : 'single';
}

/**
 * 生成子 Feature 索引表
 */
async function generateSubFeatureIndex(specsDir: string): Promise<string> {
  const entries = await fs.readdir(specsDir, { withFileTypes: true });
  const subFeatureDirs = entries
    .filter(e => e.isDirectory() && !e.name.startsWith('.'))
    .map(e => e.name);
  
  const rows = await Promise.all(
    subFeatureDirs.map(async (dir) => {
      const stateFile = join(specsDir, dir, 'state.json');
      if (existsSync(stateFile)) {
        const state = JSON.parse(readFileSync(stateFile, 'utf-8'));
        return `| ${state.feature} | ${state.name || '-'} | ${dir} | ${state.status} | ${state.assignee || '-'} | - |`;
      }
      return null;
    })
  );
  
  return [
    '| 子 Feature ID | 子 Feature 名称 | 目录路径 | 状态 | 负责人 | 阻塞依赖 |',
    '|---------------|-----------------|----------|------|--------|----------|',
    ...rows.filter(r => r !== null)
  ].join('\n');
}
```

---

## TASK-006: 实现 tasks.md 解析器

| 属性 | 值 |
|------|-----|
| **功能需求** | FR-253-1, FR-253-2, FR-253-3 |
| **优先级** | P0 |
| **预估工时** | 4 小时 |
| **依赖任务** | TASK-004 |
| **并行组** | 组 3 |
| **负责人** | TBD |

### 工作内容
- [ ] 实现并行分组声明语法解析
- [ ] 实现组内并行、组间串行语义
- [ ] 实现跨组依赖声明解析
- [ ] 实现依赖解析和排序
- [ ] 编写解析器测试

### 交付物
- `.sdd/src/utils/tasks-parser.ts` - tasks.md 解析器 (约 200 行)
- `.sdd/src/utils/tasks-parser.test.ts` - 单元测试 (约 150 行)

### 验收标准
- [ ] 正确解析并行分组声明语法（### 组 X: 名称）
- [ ] 组内任务标记为可并行
- [ ] 组间依赖正确解析（等待组 X 完成）
- [ ] 跨组依赖声明正确解析（依赖：TASK-XXX）
- [ ] 输出可执行的任务顺序

### 技术说明
```typescript
interface ParallelGroup {
  id: number;
  name: string;
  tasks: ParsedTask[];
  dependencies: number[]; // 依赖的组 ID
}

interface ParsedTask {
  id: string; // TASK-XXX
  description: string;
  assignee?: string;
  dependencies: string[]; // 依赖的任务 ID
}

/**
 * 解析 tasks.md 中的并行分组
 */
function parseParallelGroups(markdown: string): ParallelGroup[] {
  const groups: ParallelGroup[] = [];
  const groupRegex = /###\s*组\s*(\d+):\s*([^\n]+)\n([\s\S]*?)(?=### 组|$)/g;
  
  let match;
  while ((match = groupRegex.exec(markdown)) !== null) {
    groups.push({
      id: parseInt(match[1]),
      name: match[2].trim(),
      tasks: parseTasks(match[3]),
      dependencies: parseGroupDependencies(match[2])
    });
  }
  
  return groups;
}

/**
 * 计算任务执行顺序（考虑依赖）
 */
function computeExecutionOrder(groups: ParallelGroup[]): ParallelGroup[][] {
  const waves: ParallelGroup[][] = [];
  const completed = new Set<number>();
  const remaining = new Set(groups.map(g => g.id));
  
  while (remaining.size > 0) {
    const readyWave: ParallelGroup[] = [];
    for (const groupId of remaining) {
      const group = groups.find(g => g.id === groupId)!;
      const depsMet = group.dependencies.every(dep => completed.has(dep));
      if (depsMet) {
        readyWave.push(group);
      }
    }
    
    if (readyWave.length === 0) {
      throw new Error('检测到循环依赖');
    }
    
    waves.push(readyWave);
    readyWave.forEach(g => {
      completed.add(g.id);
      remaining.delete(g.id);
    });
  }
  
  return waves;
}
```

---

## TASK-007: 实现依赖就绪通知

| 属性 | 值 |
|------|-----|
| **功能需求** | FR-253-4, FR-253-5 |
| **优先级** | P1 |
| **预估工时** | 2 小时 |
| **依赖任务** | TASK-004, TASK-006 |
| **并行组** | 组 3 |
| **负责人** | TBD |

### 工作内容
- [ ] 实现依赖就绪检测算法
- [ ] 实现通知触发机制
- [ ] 实现通知配置（可选开启/关闭）
- [ ] 集成到状态变更流程
- [ ] 编写通知测试

### 交付物
- `.sdd/src/utils/dependency-notifier.ts` - 依赖通知工具 (约 150 行)
- `.sdd/src/utils/dependency-notifier.test.ts` - 单元测试 (约 100 行)

### 验收标准
- [ ] 子 Feature 状态变更时检查依赖该子 Feature 的其他子 Feature
- [ ] 依赖就绪时触发通知（控制台输出或日志）
- [ ] 通知包含：就绪子 Feature 名称、可开始的任务
- [ ] 通知机制可配置（开启/关闭）
- [ ] 与状态变更流程无缝集成

### 技术说明
```typescript
/**
 * 检查子 Feature 是否所有依赖已完成
 */
function isDependencyReady(
  subFeatureId: string,
  dependencies: Record<string, string[]>,
  subFeatureStates: Map<string, FeatureState>
): boolean {
  const deps = dependencies[subFeatureId] || [];
  if (deps.length === 0) return true;
  
  // 检查所有依赖子 Feature 是否至少完成 plan 阶段
  return deps.every(depId => {
    const depState = subFeatureStates.get(depId);
    return depState && depState.phase && depState.phase >= 2;
  });
}

/**
 * 通知依赖就绪的子 Feature
 */
async function notifyDependencyReady(
  completedSubFeatureId: string,
  dependencies: Record<string, string[]>,
  subFeatureStates: Map<string, FeatureState>
): Promise<void> {
  // 找到所有依赖此子 Feature 的其他子 Feature
  const dependentSubFeatures = Object.entries(dependencies)
    .filter(([_, deps]) => deps.includes(completedSubFeatureId))
    .map(([subFeatureId, _]) => subFeatureId);
  
  for (const subFeatureId of dependentSubFeatures) {
    if (isDependencyReady(subFeatureId, dependencies, subFeatureStates)) {
      console.log(`📢 子 Feature "${subFeatureId}" 的依赖已就绪，可以开始开发`);
    }
  }
}
```

---

## TASK-008: 端到端测试

| 属性 | 值 |
|------|-----|
| **功能需求** | FR-251~253 整合 |
| **优先级** | P0 |
| **预估工时** | 4 小时 |
| **依赖任务** | TASK-006, TASK-007 |
| **并行组** | 组 4 |
| **负责人** | TBD |

### 工作内容
- [ ] 设计端到端测试场景
- [ ] 创建测试 fixture（多子 Feature Feature 示例）
- [ ] 实现完整流程测试（spec→plan→tasks→build）
- [ ] 验证并行执行无冲突
- [ ] 输出测试报告

### 交付物
- `.sdd/tests/e2e/multi-feature.test.ts` - 端到端测试 (约 300 行)
- `.sdd/tests/fixtures/multi-feature/` - 测试 fixture 目录

### 验收标准
- [ ] 可成功创建多子 Feature Feature
- [ ] **子 Feature 位于 `.sdd/.specs/[sub-feature-id]/` 同级目录**
- [ ] 子 Feature 状态追踪正常
- [ ] 并行任务执行无文件冲突
- [ ] 依赖就绪通知触发
- [ ] 测试报告包含详细结果

### 技术说明
```typescript
describe('Multi-Feature E2E Tests', () => {
  let featurePath: string;
  
  beforeEach(async () => {
    featurePath = await createTestFeature('e2e-test-multi-feature');
  });
  
  test('完整多子 Feature 流程', async () => {
    // 1. 创建多子 Feature spec
    await runAgent('@sdd-spec', { feature: 'e2e-test', mode: 'multi' });
    
    // 2. 验证子 Feature 目录创建（同级扁平结构）
    expect(await fs.exists('.sdd/.specs/user-center/')).toBe(true);
    expect(await fs.exists('.sdd/.specs/order-system/')).toBe(true);
    
    // 3. 执行并行 build
    await runCommand('/sdd build --parallel');
    
    // 4. 验证无冲突
    const states = await loadAllSubFeatureStates();
    expect(states.every(sf => sf.status !== 'error')).toBe(true);
    
    // 5. 验证状态聚合正确
    const featureState = await loadState('e2e-test');
    expect(featureState.status).toBeDefined();
  });
});
```

---

## TASK-009: 向后兼容测试

| 属性 | 值 |
|------|-----|
| **功能需求** | NFR-101~104 |
| **优先级** | P0 |
| **预估工时** | 3 小时 |
| **依赖任务** | TASK-002, TASK-004, TASK-005, TASK-250-004 |
| **并行组** | 组 4 |
| **负责人** | TBD |

### 工作内容
- [ ] 创建旧格式 state.json fixture（v1.1.1）
- [ ] 测试单模块 Feature 加载
- [ ] 测试状态迁移流程
- [ ] 测试核心 Agent 兼容性
- [ ] 测试旧 `.specs/` 结构兼容
- [ ] 输出兼容性测试报告

### 交付物
- `.sdd/tests/compatibility/legacy.test.ts` - 兼容性测试 (约 200 行)
- `.sdd/tests/fixtures/legacy-v1.1.1/` - 旧版本 fixture 目录

### 验收标准
- [ ] v1.1.1 state.json 可自动升级为 v1.2.11
- [ ] **升级后移除 mode 和 subFeatures 字段**
- [ ] 单模块项目无需迁移可正常工作
- [ ] 核心 Agent（@sdd-spec/plan/tasks/build）正常调用
- [ ] 迁移后备份文件存在且可回滚
- [ ] 旧 `.specs/` 结构项目可正常加载
- [ ] 兼容性测试报告完整

### 技术说明
```typescript
describe('Backward Compatibility Tests', () => {
  test('v1.1.1 state.json 迁移', async () => {
    const legacyState = {
      feature: 'legacy-feature',
      status: 'planned',
      mode: 'single',      // 将被移除
      subFeatures: [],     // 将被移除
      createdAt: '2026-03-01T00:00:00Z',
      updatedAt: '2026-03-01T00:00:00Z'
    };
    
    await saveState('legacy-feature', legacyState);
    
    // 加载时应自动迁移
    const newState = await loadState('legacy-feature');
    
    expect(newState.version).toBe('1.2.11');
    expect(newState).not.toHaveProperty('mode');
    expect(newState).not.toHaveProperty('subFeatures');
  });
  
  test('核心 Agent 兼容性', async () => {
    const agents = ['@sdd-spec', '@sdd-plan', '@sdd-tasks', '@sdd-build'];
    for (const agent of agents) {
      const result = await runAgent(agent, { feature: 'test-multi' });
      expect(result.error).toBeUndefined();
    }
  });
  
  test('旧 .specs/ 结构兼容', async () => {
    // 创建旧结构 fixture
    await createLegacySpecsStructure();
    
    // 应能正常加载
    const workspace = getSDDWorkspace();
    expect(workspace).toBe('.');
  });
});
```

---

## 实施里程碑

| 里程碑 | 目标日期 | 完成的任务 | 状态 |
|--------|----------|------------|------|
| M0: 容器化结构 | 2026-03-31 | TASK-250-001 ~ TASK-250-006 | 📋 |
| M1: 子 Feature 结构 | 2026-05-03 | TASK-001, TASK-002, TASK-003 | 📋 |
| M2: 状态管理 | 2026-05-07 | TASK-004, TASK-005 | 📋 |
| M3: 并行机制 | 2026-05-10 | TASK-006, TASK-007 | 📋 |
| M4: 测试发布 | 2026-05-13 | TASK-008, TASK-009 | 📋 |

---

## 工时统计

| 功能模块 | 任务数 | 工时 | 占比 |
|----------|--------|------|------|
| F-250 容器化基础设施 | TASK-250-001 ~ 006 | 12 小时 | 32% |
| F-251 子 Feature Spec 结构 | TASK-003, TASK-005 | 8 小时 | 22% |
| F-252 分布式 State | TASK-001, TASK-002, TASK-004 | 11 小时 | 30% |
| F-253 并行任务 | TASK-006, TASK-007 | 6 小时 | 16% |
| 测试与验证 | TASK-008, TASK-009 | 7 小时 | 19% |
| **总计** | **12** | **37 小时** | **100%** |

**变更说明**: 
- 简化后 12 任务 37 小时
- 新增 F-250 容器化任务组（6 任务，12 小时）
- 删除 FR-254 辅助工具任务，功能整合到核心命令
- 任务总数保持在合理范围（10-15 个）

---

## 风险与缓解

| 风险 | 影响任务 | 缓解措施 |
|------|----------|----------|
| 循环依赖检测遗漏 | TASK-004 | 使用 DFS 算法 + 启动时全量验证 |
| 状态并发写入冲突 | TASK-004 | 实现文件锁 + 乐观锁重试机制 |
| 状态迁移失败 | TASK-002 | 迁移前自动备份 + 回滚机制 |
| 并行执行冲突 | TASK-006, TASK-008 | 文件锁机制 + 冲突检测 |
| 旧项目迁移复杂 | TASK-250-004 | 提供自动迁移脚本，保留备份，不强制迁移 |

---

## 下一步

👉 **运行 `@sdd-build TASK-250-001` 开始实现第一个任务**

建议执行顺序：
1. **Wave 1 (组 0)**: TASK-250-001 ~ TASK-250-006（容器化基础设施，优先执行）
2. **Wave 2 (组 1)**: TASK-001, TASK-002, TASK-003（等待组 0 完成）
3. **Wave 3 (组 2)**: TASK-004, TASK-005（等待组 1 完成）
4. **Wave 4 (组 3)**: TASK-006, TASK-007（等待组 2 完成）
5. **Wave 5 (组 4)**: TASK-008, TASK-009（等待组 3 完成）

---

**文档状态**: tasked  
**状态更新命令**: 
```bash
/tool sdd_update_state {"feature": "sdd-multi-module", "state": "tasked"}
```
