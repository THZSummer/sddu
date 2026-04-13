# Feature Specification: v2.4.0 Feature 拆分与树形结构优化

## 元数据

| 元数据 | 值 |
|--------|-----|
| **Feature ID** | `tree-structure-optimization` |
| **Feature 名称** | v2.4.0 Feature 拆分与树形结构优化 |
| **规范版本** | 2.4.0 |
| **创建日期** | 2026-04-12 |
| **作者** | SDDU Team |
| **优先级** | P0 |
| **状态** | specified |
| **相关干系人** | 插件开发团队、架构师、开发工程师、路由 Agent |
| **父 Feature** | `specs-tree-root` |
| **类型** | 轻量化父级（仅 discovery/spec/plan，无 tasks/build/review/validate） |

---

## 1. 上下文

### 1.1 问题定义

> 💡 **核心根因**: P-001（插件缺少分而治之的拆分能力）是本质问题，P-002 和 P-003 是其表象。

| 问题 ID | 问题描述 | 与根因的关系 |
|---------|----------|--------------|
| **P-001** | 插件默认只生成平层目录，不具备 Feature 拆分能力 | 🔴 **核心根因** |
| **P-002** | root 缺少顶层规划文档 | 🟡 表象（因 root 无法拆分为子 Feature 管理） |
| **P-003** | Feature 水平平铺，非树形结构 | 🟡 表象（因缺少子 Feature 嵌套机制） |

**根因因果链**:
```
P-001: 插件缺少分而治之的能力 ←── 核心根因
  │
  ├──→ P-002: root 缺少顶层规划（因插件不支持轻量化父级规范）
  │
  └──→ P-003: Feature 水平平铺（因插件不支持子 Feature 嵌套机制）
```

### 1.2 5 Whys 根因分析

1. **Why**: 插件缺少分而治之的能力？→ Agent 总是生成完整的 6 阶段文档，不会区分父级和叶子
2. **Why**: 插件不支持父子 Feature 的目录嵌套机制？→ 目录扫描只扫描一级 `specs-tree-*`，不递归
3. **Why**: 目录扫描只扫描一级？→ 早期设计关注"多模块并行开发"，而非"层次化拆分管理"
4. **Why**: 早期设计如此？→ 架构设计时未定义 Feature 拆分粒度和父子关系模型
5. **根因**: 插件架构设计时未定义 Feature 拆分粒度和父子关系模型

### 1.3 现有代码约束

当前代码中与树形结构直接相关的模块：

| 模块 | 路径 | 当前行为 | 需变更 |
|------|------|----------|--------|
| **SubFeature Manager** | `src/utils/subfeature-manager.ts` | 基于 `sub-features/` 子目录管理子 Feature，使用旧的 `.state.json` 格式 | ✅ **重构**：改为递归扫描 `specs-tree-*` 嵌套目录 |
| **Schema v2.0.0** | `src/state/schema-v2.0.0.ts` | 无父子关系字段、无 depth | ✅ **升级**：新增 v2.1.0 schema（childrens、depth） |
| **AutoUpdater** | `src/state/auto-updater.ts` | 只扫描一级 `specs-tree-*` 目录 | ✅ **升级**：支持递归扫描 + 父级手动触发模式 |
| **DependencyChecker** | `src/state/dependency-checker.ts` | 依赖检查仅支持同层 | ✅ **升级**：支持跨子树依赖（完整路径引用） |
| **State Machine** | `src/state/machine.ts` | 单 Feature 状态管理 | ✅ **升级**：支持父级混合状态（自身 + 子级） |

### 1.4 与相关 ADR 的关系

| ADR | 决策 | 对本 Feature 的影响 |
|-----|------|---------------------|
| **ADR-001** | 完全分布式存储 | ✅ 每个 Feature 独立 state.json，天然支持树形 |
| **ADR-005** | 7 步工作流固定顺序 | ⚠️ 仅叶子完整走 6 阶段，父级仅 discovery/spec/plan |
| **ADR-009** | 混合模式依赖检查 | ✅ 可增强为跨子树依赖检查 |
| **ADR-014** | 打包分发结构优化 | ⚠️ 树形结构需纳入打包范围 |

### 1.5 业务价值

| 价值类型 | 具体描述 | 衡量方式 |
|----------|----------|----------|
| **架构合理性** | 分而治之符合高内聚低耦合原则 | 单一 Feature 职责数 = 1 |
| **可维护性** | 单一职责的 specs 降低认知负担 | 变更影响范围 ≤ 1 个 specs 目录 |
| **协作效率** | 多 Agent 可并行操作不同子 Feature | 并行操作冲突率 = 0 |
| **可扩展性** | 树形结构类比文件系统，支持无限层级嵌套 | 嵌套深度 = 无限制 |

---

## 2. Goals & Non-Goals

### 2.1 Goals

| ID | 目标 | 验收标准 |
|----|------|----------|
| G-001 | 实现 Feature 拆分能力 | 支持将大型 Feature 拆分为多个子 Feature |
| G-002 | 支持无限层树形嵌套 | 技术上不限制嵌套深度（类比文件系统） |
| G-003 | 全新树形设计，无需为旧版平级做特殊兼容 | 平级是深度为 1 的树形特例，新设计无需背负历史债 |
| G-004 | 定义「轻量化父级」规范 | 父级 Feature 只需 discovery/spec/plan + README + state.json |
| G-005 | 定义「完整叶子」规范 | 叶子 Feature 走完整 SDDU 工作流（含 tasks/build/review/validate） |
| G-006 | 混合状态管理 | 父级 state.json 独立记录自身状态和每个子级状态 |
| G-007 | 支持跨子树依赖关系 | 子 Feature 的 state.json 中直接引用其他子 Feature 完整路径 |
| G-008 | 统一 state.json schema 为 v2.1.0 | 新增 `childrens` 数组、`depth` 字段 |

### 2.2 Non-Goals

| ID | 非目标 | 说明 |
|----|--------|------|
| NG-001 | 历史 `.sddu` 工作空间迁移/兼容 | 属于历史产物，不做处理 |
| NG-002 | 状态自动实时汇聚 | 当前手动扫描即可，后续版本 |
| NG-003 | 跨子树依赖自动冲突检测 | 当前手动管理即可，后续版本 |
| NG-004 | 树形结构可视化 | 非核心能力，后续版本 |
| NG-005 | v2.5.0 Skills/TUI/MCP | 功能增强非结构优化 |
| NG-006 | v2.7.0 文件命名标准化 | 属于后续版本 |
| NG-007 | 修改现有 11 个 Feature 的目录结构 | 历史产物保持不变 |

---

## 3. 用户故事

| ID | 角色 | 故事 | 价值 |
|----|------|------|------|
| US-001 | 架构师 | 我希望在 root 层级看到顶层 spec/plan，快速理解整体架构 | 产品级视图，新人快速上手 |
| US-002 | 开发工程师 | 我希望在大型需求中，能将前端/后端拆分为独立子 Feature | 关注点分离，独立开发 |
| US-003 | 开发工程师 | 我希望子 Feature 以父 Feature 文档为上下文输入 | 避免信息重复，保持一致性 |
| US-004 | 路由 Agent | 我希望自动识别树形结构，正确路由到对应层级 | 自动化程度提升 |
| US-005 | 架构师 | 我希望父级能看到自身状态和每个子级的独立状态 | 全景视角，手动触发更新 |
| US-006 | 开发工程师 | 我希望我的子 Feature 能依赖跨子树的其他 Feature | 灵活的依赖管理 |
| US-007 | 用户 | 我希望在 Discovery 或 Spec 阶段获得拆分建议 | 引导式拆分，减少手动决策 |

---

## 4. 功能需求

### 4.1 核心：Feature 拆分能力（解决 P-001）

| FR-ID | 需求 | 验收标准 |
|-------|------|----------|
| **FR-001** | Agent 模板支持识别拆分时机 | Discovery/Spec 阶段能识别需求包含多个独立模块，输出拆分建议 |
| **FR-002** | 支持用户指定拆分 | 用户可显式指定要拆分的子 Feature 名称和层级 |
| **FR-003** | 生成轻量化父级文档 | 父级生成 discovery.md + spec.md + plan.md + README.md + state.json |
| **FR-004** | 父级不生成 tasks/build/review/validate | 父级目录中不存在这些文件，Agent 模板不生成 |
| **FR-005** | 生成拆分建议文档 | 在父级 discovery.md 中包含拆分建议章节，列出建议的子 Feature |

### 4.2 树形嵌套结构

| FR-ID | 需求 | 验收标准 |
|-------|------|----------|
| **FR-010** | 递归扫描 `specs-tree-*` 嵌套目录 | 目录扫描器能递归识别任意深度的 `specs-tree-*` 目录 |
| **FR-011** | 子 Feature 目录作为父级目录的直接子目录 | 子 Feature 目录放置在父级 Feature 目录内（非 `sub-features/` 中间层） |
| **FR-012** | 目录命名规范保持不变 | 子 Feature 目录名仍为 `specs-tree-[feature-id]` |
| **FR-013** | 技术上不限制嵌套深度 | 递归扫描无最大深度限制（类比文件系统） |
| **FR-014** | 叶子 Feature 走完整 6 阶段工作流 | 叶子 Feature 生成 discovery~validate 全部文档 |

### 4.3 状态管理升级

| FR-ID | 需求 | 验收标准 |
|-------|------|----------|
| **FR-020** | 统一 state.json schema 为 v2.1.0 | 新增字段：`childrens`（数组）、`depth` |
| **FR-021** | 父级 `status` 即自身状态 | `status` 字段天然属于文件拥有者，无需额外的 selfStatus |
| **FR-022** | 父级 state.json 记录每个子级状态 | `childrens` 数组，每项包含子 Feature 的 name、status 等基本信息 |
| **FR-023** | ~~子 Feature state.json 引用父级~~ | ❌ **不需要**——树形结构本身隐含父子关系，上级目录即父级，无需显式存储 |
| **FR-024** | 子 Feature state.json 记录层级深度 | `depth` 字段存储当前层级（root=0，第一层子=1，以此类推） |
| **FR-025** | 手动触发扫描更新 | 父级状态通过手动触发扫描来更新自身 + 各子级状态 |
| **FR-026** | 子 Feature 状态独立管理 | 子 Feature 的 state.json 独立更新自身状态，不影响父级直到扫描 |

### 4.4 依赖检查升级

| FR-ID | 需求 | 验收标准 |
|-------|------|----------|
| **FR-030** | 支持跨子树依赖（完整路径引用） | `dependencies.on` 中可引用任意子 Feature 的完整相对路径 |
| **FR-031** | 依赖解析器能处理跨子树路径 | 能正确解析 `specs-tree-parent/specs-tree-child` 格式的路径 |
| **FR-032** | 依赖检查时验证目标 Feature 状态 | 检查目标 Feature 的状态是否满足前置要求 |
| **FR-033** | 循环依赖检测 | 在树形结构中检测循环依赖并报错 |

### 4.5 Agent 模板升级

| FR-ID | 需求 | 验收标准 |
|-------|------|----------|
| **FR-040** | Spec Agent 识别父级/叶子角色 | 根据用户输入或父级存在性判断当前 Feature 是父级还是叶子 |
| **FR-041** | 父级 Spec 生成轻量化文档 | 仅生成 spec.md（不含 tasks/build/review/validate 章节） |
| **FR-042** | 叶子 Spec 生成完整文档 | 生成完整的 spec.md，包含所有 6 阶段相关内容 |
| **FR-043** | 子级 Spec 以父级文档为上下文 | 生成子级 spec 时读取并参考父级 spec.md/plan.md 内容 |
| **FR-044** | Plan Agent 支持父级子级协作关系描述 | 父级 plan.md 描述子 Feature 之间的协作关系和依赖 |
| **FR-045** | Discovery Agent 输出拆分建议 | 识别到多模块需求时，输出 Feature 拆分建议并等待确认 |

### 4.6 示例与文档

| FR-ID | 需求 | 验收标准 |
|-------|------|----------|
| **FR-050** | 提供拆分原则文档 | 文档说明拆分粒度建议、父子关系规则 |
| **FR-051** | 提供示例项目 | 包含 3 层嵌套 + 轻量父级/完整叶子的示例 |

---

## 5. 非功能需求

| NFR-ID | 类型 | 需求 | 验收标准 |
|--------|------|------|----------|
| **NFR-001** | 兼容性 | 不破坏现有 11 个 Feature 的正常运行 | 现有 Feature 目录结构保持不变，功能正常 |
| **NFR-002** | 类型安全 | 完整 TypeScript 类型定义 | 无 `any` 类型，严格模式通过 |
| **NFR-003** | 性能 | 递归扫描不影响启动性能 | 扫描 10 层嵌套、50 个 Feature 耗时 < 100ms |
| **NFR-004** | 可维护性 | 代码组织清晰 | 新增/修改文件有清晰注释和文档 |
| **NFR-005** | 文档 | 公共 API 有 JSDoc 注释 | 所有导出函数和接口有完整注释 |
| **NFR-006** | 测试 | 关键功能有测试覆盖 | 递归扫描、状态管理、依赖检查有单元测试 |
| **NFR-007** | 向后兼容 | 旧版 state.json v2.0.0 仍可读取 | 读取旧版 schema 时自动填充新字段默认值 |

---

## 6. 技术设计

### 6.1 树形目录结构

```
specs-tree-root/                              # ← 轻量化父级：仅 discovery/spec/plan
├── discovery.md
├── spec.md                                   # ← 父级自身业务/技术架构
├── plan.md                                   # ← 子级协作关系和技术规划
├── README.md
├── state.json                                # ← 自身状态 + 每个子级状态
├── architecture/
│   └── adr/
├── specs-tree-tree-structure-optimization/   # ← 当前 Feature（叶子）
│   ├── discovery.md
│   ├── spec.md
│   ├── plan.md
│   ├── tasks.md
│   ├── build.md
│   ├── review.md
│   ├── validate.md
│   └── state.json
├── specs-tree-[parent-feature]/              # ← 可能也是轻量化父级
│   ├── discovery.md                          # ← 为什么拆分子级
│   ├── spec.md                               # ← 父级自身架构
│   ├── plan.md                               # ← 子级协作关系
│   ├── README.md
│   ├── state.json                            # ← 自身状态 + 子级状态
│   ├── specs-tree-[sub-feature]/             # ← 完整叶子：走完整 6 阶段
│   │   ├── discovery.md
│   │   ├── spec.md
│   │   ├── plan.md
│   │   ├── tasks.md
│   │   ├── build.md
│   │   ├── review.md
│   │   ├── validate.md
│   │   └── state.json                        # ← dependencies.on 可直接引用跨子树路径
│   └── specs-tree-[sub-feature-2]/           # ← 另一个完整叶子
│       └── ...
```

**关键差异 vs 现有结构**：
- ❌ 不再使用 `sub-features/` 中间层
- ✅ 子 Feature 目录直接嵌套在父级 Feature 目录内
- ✅ 目录命名统一为 `specs-tree-[feature-id]`

### 6.2 state.json Schema v2.1.0

#### 6.2.1 核心设计原则

> **谁的 `state.json` 文件，谁就是主角**。`status`、`phase` 等字段天然属于文件拥有者自身，无需额外的 `selfStatus`。

| 字段 | 说明 |
|------|------|
| `status` | **文件拥有者自身**的工作流状态（父级/叶子通用） |
| `phase` | **文件拥有者自身**当前阶段（父级/叶子通用） |
| `childrens` | 数组类型，记录每个直接子 Feature 的简要信息（仅父级使用） |
| `depth` | 当前层级深度（root=0, 第一层子=1, 以此类推） |

> ~~`parent`~~：树形结构本身隐含父子关系，上级目录即父级，无需显式存储。

#### 6.2.2 完整 Schema 定义

```typescript
// State Schema v2.1.0 - 树形结构增强版
// 兼容 v2.0.0 的所有字段，新增树形相关字段

import { WorkflowStatus, PhaseHistory, StateV2_0_0 } from './schema-v2.0.0';

/**
 * 子 Feature 简要状态信息（用于父级 state.json 的 childrens 数组）
 */
export interface ChildFeatureInfo {
  /** 子 Feature 目录名 (e.g. "specs-tree-user-auth") */
  name: string;
  /** 子 Feature 自身状态 */
  status: string;
  /** 最后扫描更新时间 */
  lastScannedAt?: string;
  /** 其他需要快速展示的字段... */
  [key: string]: unknown;
}

/**
 * 状态 Schema v2.1.0
 * 
 * 设计原则：state.json 的归属者就是主角
 * - status/phase 天然属于文件拥有者自身
 * - 子级信息通过 childrens 数组记录
 */
export interface StateV2_1_0 extends StateV2_0_0 {
  // === v2.0.0 保留字段（无需变更） ===
  // status: WorkflowStatus;       // ← 就是文件拥有者自身的状态
  // phase: number;                // ← 就是文件拥有者自身的阶段
  // phaseHistory: PhaseHistory[];
  // files, dependencies, metadata, history ...

  // === 新增：树形结构字段 ===
  version: '2.1.0';                // Schema 版本号

  /** 子 Feature 简要信息数组（仅父级使用，叶子节点为空数组或省略） */
  childrens?: ChildFeatureInfo[];

  /** 当前层级深度（root=0, 第一层子=1, 以此类推） */
  depth: number;
}
```

#### 6.2.3 父级 state.json 示例

```json
{
  "feature": "specs-tree-root/specs-tree-[parent-feature]",
  "name": "父级 Feature 名称",
  "version": "2.1.0",
  "status": "planned",
  "phase": 2,
  "depth": 1,
  "childrens": [
    {
      "name": "specs-tree-[sub-feature]",
      "status": "validated",
      "lastScannedAt": "2026-04-12T10:00:00.000Z"
    },
    {
      "name": "specs-tree-[sub-feature-2]",
      "status": "tasked",
      "lastScannedAt": "2026-04-12T10:00:00.000Z"
    }
  ],
  "files": {
    "spec": "spec.md",
    "plan": "plan.md",
    "readme": "README.md"
  },
  "dependencies": {
    "on": [],
    "blocking": []
  },
  "phaseHistory": [
    {
      "phase": 0,
      "status": "discovered",
      "timestamp": "2026-04-12T00:00:00.000Z",
      "triggeredBy": "sddu-discovery-agent"
    },
    {
      "phase": 1,
      "status": "specified",
      "timestamp": "2026-04-12T01:00:00.000Z",
      "triggeredBy": "sddu-spec-agent"
    },
    {
      "phase": 2,
      "status": "planned",
      "timestamp": "2026-04-12T02:00:00.000Z",
      "triggeredBy": "sddu-plan-agent"
    }
  ]
}
```

#### 6.2.4 叶子 state.json 示例

```json
{
  "feature": "specs-tree-root/specs-tree-[parent-feature]/specs-tree-[sub-feature]",
  "name": "子 Feature A",
  "version": "2.1.0",
  "status": "validated",
  "phase": 6,
  "depth": 2,
  "childrens": [],
  "files": {
    "spec": "spec.md",
    "plan": "plan.md",
    "tasks": "tasks.md",
    "readme": "README.md",
    "review": "review.md",
    "validation": "validate.md"
  },
  "dependencies": {
    "on": [
      "specs-tree-root/specs-tree-[parent-feature]/specs-tree-[sub-feature-2]"
    ],
    "blocking": []
  },
  "phaseHistory": [
    { "phase": 1, "status": "specified", "timestamp": "2026-04-12T00:00:00.000Z", "triggeredBy": "sddu-spec-agent" },
    { "phase": 2, "status": "planned", "timestamp": "2026-04-12T01:00:00.000Z", "triggeredBy": "sddu-plan-agent" },
    { "phase": 3, "status": "tasked", "timestamp": "2026-04-12T02:00:00.000Z", "triggeredBy": "sddu-tasks-agent" },
    { "phase": 4, "status": "building", "timestamp": "2026-04-12T03:00:00.000Z", "triggeredBy": "sddu-build-agent" },
    { "phase": 5, "status": "reviewed", "timestamp": "2026-04-12T04:00:00.000Z", "triggeredBy": "sddu-review-agent" },
    { "phase": 6, "status": "validated", "timestamp": "2026-04-12T05:00:00.000Z", "triggeredBy": "sddu-validate-agent" }
  ]
}
```

### 6.3 递归扫描器重构

#### 6.3.1 新增模块：`src/utils/tree-scanner.ts`

```typescript
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * 树形 Feature 节点信息
 */
export interface TreeNode {
  /** Feature 目录名 (e.g. "specs-tree-my-feature") */
  id: string;
  /** 相对于 specs-tree-root 的完整路径 */
  path: string;
  /** 层级深度 (root=0) */
  depth: number;
  /** 子节点列表 */
  children: TreeNode[];
  /** 是否为叶子节点（无子 Feature 目录） */
  isLeaf: boolean;
  /** state.json 内容（如果存在） */
  state?: any;
}

/**
 * 递归扫描 specs-tree-* 目录结构
 * 
 * @param rootDir specs-tree-root 目录路径
 * @param relativePath 当前相对路径（递归用，初始为空）
 * @param depth 当前深度（递归用，初始为 0）
 * @param parentPath 父级路径（递归用，初始为空）
 * @returns 树形结构
 */
export async function scanTreeStructure(
  rootDir: string,
  relativePath: string = '',
  depth: number = 0
): Promise<TreeNode[]> {
  const scanDir = relativePath ? path.join(rootDir, relativePath) : rootDir;
  
  try {
    const entries = await fs.readdir(scanDir, { withFileTypes: true });
    const nodes: TreeNode[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (!entry.name.startsWith('specs-tree-')) continue;
      if (entry.name === 'specs-tree-root') continue; // 跳过 root 自身

      const nodePath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
      const fullPath = path.join(rootDir, nodePath);
      
      // 读取 state.json（如果存在）
      let state: any;
      try {
        const stateContent = await fs.readFile(path.join(fullPath, 'state.json'), 'utf-8');
        state = JSON.parse(stateContent);
      } catch {
        // state.json 不存在，忽略
      }

      // 递归扫描子目录
      const children = await scanTreeStructure(rootDir, nodePath, depth + 1);

      nodes.push({
        id: entry.name,
        path: nodePath,
        depth,
        children,
        isLeaf: children.length === 0,
        state
      });
    }

    return nodes;
  } catch (error) {
    console.warn(`扫描目录失败: ${scanDir}`, error);
    return [];
  }
}

/**
 * 查找指定路径的 Feature 节点
 */
export function findNode(tree: TreeNode[], targetPath: string): TreeNode | undefined {
  for (const node of tree) {
    if (node.path === targetPath) return node;
    const found = findNode(node.children, targetPath);
    if (found) return found;
  }
  return undefined;
}

/**
 * 获取指定节点的所有祖先节点
 */
export function getAncestors(tree: TreeNode[], targetPath: string): TreeNode[] {
  const ancestors: TreeNode[] = [];
  
  function search(nodes: TreeNode[], target: string, path: TreeNode[]): boolean {
    for (const node of nodes) {
      if (node.path === target) {
        ancestors.push(...path);
        return true;
      }
      if (search(node.children, target, [...path, node])) {
        return true;
      }
    }
    return false;
  }
  
  search(tree, targetPath, []);
  return ancestors;
}

/**
 * 判断一个 Feature 是否为父级（有子 Feature 目录）
 */
export function isParentFeature(node: TreeNode): boolean {
  return !node.isLeaf;
}
```

### 6.4 SubFeature Manager 重构

**当前** (`src/utils/subfeature-manager.ts`): 基于 `sub-features/` 中间层管理子 Feature。
**目标**: 废弃 `sub-features/` 模式，改用 `tree-scanner.ts` 的递归扫描。

```typescript
// 重构后的 subfeature-manager.ts（核心变更摘要）

// ❌ 废弃的模式：
// featurePath/sub-features/[sub-feature-id]/

// ✅ 新的模式：
// featurePath/specs-tree-[sub-feature-id]/

/**
 * 检测 Feature 模式（树形感知版本）
 * 
 * @param featurePath Feature 的根目录路径
 * @returns 'parent' - 有子 Feature, 'leaf' - 无子 Feature
 */
export async function detectFeatureMode(featurePath: string): Promise<'parent' | 'leaf'> {
  try {
    const entries = await fs.readdir(featurePath, { withFileTypes: true });
    const hasSubFeatures = entries.some(entry => 
      entry.isDirectory() && 
      entry.name.startsWith('specs-tree-') && 
      entry.name !== 'specs-tree-root'
    );
    return hasSubFeatures ? 'parent' : 'leaf';
  } catch {
    return 'leaf';
  }
}

/**
 * 创建子 Feature 目录结构（树形版本）
 * 
 * @param parentPath 父 Feature 目录路径
 * @param featureId 子 Feature ID（不含 specs-tree- 前缀）
 * @param name 子 Feature 名称
 * @param depth 层级深度
 * @returns 子 Feature 目录路径
 */
export async function createSubFeature(
  parentPath: string,
  featureId: string,
  name: string,
  depth: number
): Promise<string> {
  const subFeatureDirName = `specs-tree-${featureId}`;
  const subFeatureDir = path.join(parentPath, subFeatureDirName);
  
  // 创建子 Feature 目录
  await fs.mkdir(subFeatureDir, { recursive: true });
  
  // 创建初始 state.json（v2.1.0）
  // 注意：parent 关系由目录结构隐含，无需显式存储
  const stateContent = JSON.stringify({
    feature: `${path.relative(SPECS_TREE_ROOT, subFeatureDir)}`,
    name: name,
    version: '2.1.0',
    status: 'discovered',
    phase: 0,
    depth: depth,
    childrens: [],
    files: { spec: 'spec.md' },
    dependencies: { on: [], blocking: [] },
    phaseHistory: [{
      phase: 0,
      status: 'discovered',
      timestamp: new Date().toISOString(),
      triggeredBy: 'manual'
    }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }, null, 2);
  await fs.writeFile(path.join(subFeatureDir, 'state.json'), stateContent);
  
  return subFeatureDir;
}
```

### 6.5 跨子树依赖解析器

```typescript
// src/state/cross-tree-dependency.ts

import * as path from 'path';
import * as fs from 'fs/promises';

/**
 * 解析跨子树依赖路径
 * 
 * 路径格式: "specs-tree-parent/specs-tree-child"
 * 解析为: 相对于 specs-tree-root 的完整路径
 */
export function resolveCrossTreeDependencyPath(
  dependencyPath: string,
  specsTreeRoot: string
): string {
  // 如果已经是完整路径，直接使用
  if (dependencyPath.startsWith('specs-tree-')) {
    return path.join(specsTreeRoot, dependencyPath);
  }
  // 否则假设是同层引用
  return path.join(specsTreeRoot, dependencyPath);
}

/**
 * 验证跨子树依赖是否存在
 */
export async function validateCrossTreeDependency(
  dependencyPath: string,
  specsTreeRoot: string
): Promise<{ exists: boolean; state?: any; error?: string }> {
  const fullPath = resolveCrossTreeDependencyPath(dependencyPath, specsTreeRoot);
  const stateFile = path.join(fullPath, 'state.json');
  
  try {
    const stateContent = await fs.readFile(stateFile, 'utf-8');
    const state = JSON.parse(stateContent);
    return { exists: true, state };
  } catch (error) {
    return { 
      exists: false, 
      error: `依赖 Feature 不存在或 state.json 无效: ${dependencyPath}` 
    };
  }
}

/**
 * 检测跨子树循环依赖
 */
export async function detectCrossTreeCircularDependencies(
  specsTreeRoot: string
): Promise<string[][]> {
  const { scanTreeStructure, TreeNode } = await import('../utils/tree-scanner');
  const tree = await scanTreeStructure(specsTreeRoot);
  
  // 构建依赖图
  const depGraph = new Map<string, string[]>();
  
  async function collectDependencies(nodes: TreeNode[]) {
    for (const node of nodes) {
      if (node.state?.dependencies?.on) {
        depGraph.set(node.path, node.state.dependencies.on);
      }
      await collectDependencies(node.children);
    }
  }
  
  await collectDependencies(tree);
  
  // DFS 检测循环
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  
  function dfs(nodeId: string, currentPath: string[]): void {
    if (recursionStack.has(nodeId)) {
      const cycleStart = currentPath.indexOf(nodeId);
      cycles.push([...currentPath.slice(cycleStart), nodeId]);
      return;
    }
    if (visited.has(nodeId)) return;
    
    visited.add(nodeId);
    recursionStack.add(nodeId);
    
    const deps = depGraph.get(nodeId) || [];
    for (const dep of deps) {
      dfs(dep, [...currentPath, nodeId]);
    }
    
    recursionStack.delete(nodeId);
  }
  
  for (const [nodeId] of depGraph) {
    dfs(nodeId, []);
  }
  
  return cycles;
}
```

### 6.6 手动扫描更新逻辑

```typescript
// src/state/parent-state-scanner.ts

import * as fs from 'fs/promises';
import * as path from 'path';
import { scanTreeStructure, TreeNode } from '../utils/tree-scanner';

/**
 * 手动触发父级状态扫描更新
 * 
 * 1. 递归扫描所有子 Feature 目录
 * 2. 读取每个子 Feature 的 state.json
 * 3. 更新父级 state.json 的 childrens 数组
 */
export async function scanAndUpdateParentState(
  parentFeaturePath: string,
  specsTreeRoot: string
): Promise<void> {
  // 1. 扫描子 Feature
  const entries = await fs.readdir(parentFeaturePath, { withFileTypes: true });
  const childrens: Array<{ name: string; status: string; lastScannedAt?: string }> = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (!entry.name.startsWith('specs-tree-')) continue;

    const childDir = path.join(parentFeaturePath, entry.name);
    const stateFile = path.join(childDir, 'state.json');

    try {
      const stateContent = await fs.readFile(stateFile, 'utf-8');
      const childState = JSON.parse(stateContent);

      childrens.push({
        name: entry.name,
        status: childState.status || 'unknown',
        lastScannedAt: new Date().toISOString()
      });

      // 递归处理更深层的子 Feature
      await scanAndUpdateParentState(childDir, specsTreeRoot);
    } catch {
      childrens.push({
        name: entry.name,
        status: 'unreadable',
        lastScannedAt: new Date().toISOString()
      });
    }
  }

  // 2. 更新父级 state.json
  const parentStateFile = path.join(parentFeaturePath, 'state.json');
  try {
    const parentStateContent = await fs.readFile(parentStateFile, 'utf-8');
    const parentState = JSON.parse(parentStateContent);

    parentState.childrens = childrens;
    parentState.updatedAt = new Date().toISOString();

    await fs.writeFile(parentStateFile, JSON.stringify(parentState, null, 2));
  } catch (error) {
    console.warn(`更新父级状态失败: ${parentFeaturePath}`, error);
  }
}
```

### 6.7 目录结构变更（变更后）

```
sddu/
├── src/
│   ├── index.ts                    # 修改：集成 tree-scanner
│   ├── types.ts                    # 修改：新增树形相关类型
│   ├── errors.ts                   # 修改：新增树形相关错误类型
│   ├── agents/
│   │   ├── sdd-agents.ts           # 修改：Agent 模板更新
│   │   └── registry.ts             # 不变
│   ├── utils/
│   │   ├── index.ts                # 修改：导出 tree-scanner
│   │   ├── tree-scanner.ts         # 【新建】递归扫描器
│   │   ├── subfeature-manager.ts   # 【重构】改为树形感知
│   │   ├── tasks-parser.ts         # 不变
│   │   ├── readme-generator.ts     # 修改：支持树形结构
│   │   └── dependency-notifier.ts  # 修改：支持跨子树
│   ├── state/
│   │   ├── machine.ts              # 【修改】支持父级混合状态
│   │   ├── schema-v2.0.0.ts       # 不变（保留旧版）
│   │   ├── schema-v2.1.0.ts       # 【新建】树形增强版 schema
│   │   ├── auto-updater.ts         # 【修改】支持递归扫描 + 手动模式
│   │   ├── dependency-checker.ts   # 【修改】支持跨子树依赖
│   │   ├── parent-state-scanner.ts # 【新建】手动扫描更新
│   │   ├── cross-tree-dependency.ts# 【新建】跨子树依赖解析
│   │   └── types.ts                # 不变
│   ├── discovery/
│   │   ├── workflow-engine.ts      # 修改：增加拆分建议输出
│   │   └── ...                     # 不变
│   ├── commands/
│   │   └── sdd-migrate-schema.ts   # 不变
│   └── templates/
│       └── agents/
│           ├── spec.md             # 【修改】识别父级/叶子角色
│           ├── plan.md             # 【修改】支持父级子级协作关系
│           ├── discovery.md        # 【修改】输出拆分建议
│           └── ...
├── scripts/
│   └── ...
├── install.sh
├── install.ps1
└── package.json
```

---

## 7. 边界情况

| EC-ID | 场景 | 处理方式 |
|-------|------|----------|
| **EC-001** | 子 Feature 目录名冲突 | 创建时检查是否已存在同名目录，存在则报错 |
| **EC-002** | 父级 state.json 缺失 | 自动创建最小化 state.json，status 为 'drafting' |
| **EC-003** | 跨子树依赖目标不存在 | 依赖检查时标记为"未满足"，不阻断但给出警告 |
| **EC-004** | 循环依赖检测失败 | 在依赖检查阶段检测并阻止状态变更 |
| **EC-005** | 递归扫描深度过大（>50 层） | 警告日志，但仍继续扫描（不硬性限制） |
| **EC-006** | 父级有子 Feature 但 childrens 为空数组 | 手动触发扫描后自动填充 |
| **EC-007** | 子 Feature 被手动删除但父级 childrens 仍有记录 | 下次扫描时自动移除过期条目 |
| **EC-008** | 父级自身状态 vs 子级状态不一致 | 父级 status 天然独立于 childrens，两者不汇聚 |
| **EC-009** | 同级目录下同时存在 `sub-features/` 和 `specs-tree-*` | 优先识别 `specs-tree-*` 为树形结构，忽略 `sub-features/` |
| **EC-010** | 跨子树依赖路径格式错误 | 依赖解析器报错并提示正确格式 |
| **EC-011** | Agent 生成文档时误判父级/叶子角色 | 允许用户显式指定 `--mode parent|leaf` 参数覆盖 |
| **EC-012** | state.json v2.0.0 旧版数据读取 | 自动填充新字段默认值（childrens=[], depth=1） |

---

## 8. 开放问题

| ID | 问题 | 影响 | 解决建议 |
|----|------|------|----------|
| **OP-001** | Discovery 阶段拆分识别规则的精细化 | Agent 拆分建议可能不准确 | 提供用户手动指定能力兜底 |
| **OP-002** | 手动扫描更新的用户体验优化 | 用户可能忘记手动触发 | 考虑在状态变更时给出提醒 |
| **OP-003** | 「轻量化父级」vs「完整叶子」的边界场景 | 中间状态的 Feature 如何定义 | 当前以是否有 `specs-tree-*` 子目录为准 |
| **OP-004** | README 生成器如何适配树形结构 | 需要递归生成子 Feature 索引 | 已纳入 FR-050 文档范围 |
| **OP-005** | 打包分发时是否包含树形示例项目 | 增加包体积 | 作为可选安装内容 |

---

## 9. 相关文件

| 文件 | 说明 | 状态 |
|------|------|------|
| `src/utils/tree-scanner.ts` | 【新建】递归树形扫描器 | 新建 |
| `src/utils/subfeature-manager.ts` | 【重构】改为树形感知 | 重构 |
| `src/state/schema-v2.1.0.ts` | 【新建】树形增强版 Schema | 新建 |
| `src/state/parent-state-scanner.ts` | 【新建】手动扫描更新逻辑 | 新建 |
| `src/state/cross-tree-dependency.ts` | 【新建】跨子树依赖解析 | 新建 |
| `src/state/auto-updater.ts` | 【修改】支持递归扫描 | 修改 |
| `src/state/dependency-checker.ts` | 【修改】支持跨子树依赖 | 修改 |
| `src/state/machine.ts` | 【修改】支持父级混合状态 | 修改 |
| `src/templates/agents/spec.md` | 【修改】识别父级/叶子角色 | 修改 |
| `src/templates/agents/plan.md` | 【修改】支持父级协作关系 | 修改 |
| `src/templates/agents/discovery.md` | 【修改】输出拆分建议 | 修改 |
| `src/types.ts` | 【修改】新增树形类型导出 | 修改 |
| `src/errors.ts` | 【修改】新增树形错误类型 | 修改 |

---

## 10. 验收标准汇总

### 10.1 功能验收

- [ ] **FR-001 ~ FR-005**: Agent 模板支持识别拆分时机，生成轻量化父级文档
- [ ] **FR-010 ~ FR-014**: 递归扫描 `specs-tree-*` 嵌套目录，子目录直接嵌套
- [ ] **FR-020 ~ FR-026**: state.json schema v2.1.0，混合状态管理，手动扫描更新
- [ ] **FR-030 ~ FR-033**: 跨子树依赖支持，依赖解析器处理完整路径，循环依赖检测
- [ ] **FR-040 ~ FR-045**: Agent 模板升级，父级/叶子角色识别，拆分建议输出
- [ ] **FR-050 ~ FR-051**: 拆分原则文档和示例项目

### 10.2 非功能验收

- [ ] **NFR-001**: 现有 11 个 Feature 目录不受影响
- [ ] **NFR-002**: TypeScript 严格模式编译通过
- [ ] **NFR-003**: 递归扫描性能 < 100ms（50 个 Feature, 10 层嵌套）
- [ ] **NFR-004**: 新增/修改文件代码审查通过
- [ ] **NFR-005**: 公共 API JSDoc 注释完整
- [ ] **NFR-006**: 递归扫描、状态管理、依赖检查有单元测试
- [ ] **NFR-007**: 旧版 v2.0.0 state.json 仍可读取

### 10.3 架构验收

- [ ] ✅ 子 Feature 目录直接嵌套在父级目录内（无 `sub-features/` 中间层）
- [ ] ✅ 父级 state.json 通过 status 记录自身状态，通过 childrens 记录子级状态
- [ ] ✅ 跨子树依赖使用完整路径引用
- [ ] ✅ 手动触发扫描更新逻辑正常工作
- [ ] ✅ 循环依赖检测正常工作

---

## 11. 架构变更总结

### 11.1 关键变更

| 变更前 | 变更后 | 优势 |
|--------|--------|------|
| 平层 `specs-tree-*` 目录 | 嵌套 `specs-tree-*` 目录（无限层） | 分而治之，关注点分离 |
| `sub-features/` 中间层管理子 Feature | 子目录直接嵌套 | 类比文件系统，更直观 |
| state.json 只有 status/phase | 新增 childrens 数组、depth 字段 | 父级可记录子级状态概览 |
| 依赖仅支持同层 | 支持跨子树完整路径引用 | 灵活的依赖管理 |
| 自动扫描所有目录 | 父级手动触发扫描 | 减少不必要的 I/O |
| 旧版 Schema v2.0.0 | 新版 Schema v2.1.0 | 树形结构原生支持 |

### 11.2 不做的内容（明确排除）

| 不做 | 原因 | 归属 |
|------|------|------|
| 历史 `.sddu` 工作空间迁移 | 属于历史产物 | 不做 |
| 状态自动实时汇聚 | 手动扫描即可满足 | 后续 |
| 跨子树依赖自动冲突检测 | 手动管理即可 | 后续 |
| 树形结构可视化 | 非核心能力 | 后续 |
| Skills/TUI/MCP | 功能增强非结构优化 | v2.5.0 |

---

## 12. 下一步

👉 运行 `@sddu-plan tree-structure-optimization` 开始技术规划
