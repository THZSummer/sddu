# specs-tree-root 管理目录结构命名优化规范

## 元数据

| 字段 | 值 |
|------|-----|
| **Feature ID** | FR-DIR-001 |
| **Feature 名称** | specs-tree-root 管理目录结构命名优化 |
| **创建日期** | 2026-04-01 |
| **作者** | SDD 规范编写专家 |
| **优先级** | P0 - 紧急 |
| **状态** | specified |
| **相关干系人** | SDD 工具开发团队、项目维护者 |

---

## 1. 问题陈述

### 1.1 核心问题

**当前 SDD 工作流的 Agent 代码（`./src/` 中的 agents）对 `.sdd/` 目录结构的认知与实际规范（TREE.md）不一致**：

1. **Agent 代码中的硬编码路径**：
   - 可能使用旧的 `.specs/` 目录名
   - 可能缺少 `specs-tree-` 前缀的识别逻辑
   - 可能不支持新的目录结构

2. **规范与实现脱节**：
   - TREE.md 定义了规范
   - 但 Agent 代码没有遵循这些规范
   - 导致 Agent 创建的目录不符合规范

3. **目录混乱的根源**：
   - `.sdd/.specs/` 下大量目录没有 `specs-tree-` 前缀
   - 这是因为 Agent 在创建时没有遵循规范
   - **需要从源头（Agent 代码）解决**

4. **根本问题：Agent 模板文件中的路径提示词与 TREE.md 规范不一致**：
   - **Agent 通过模板文件学习目录结构**
   - **如果模板使用旧路径 (.specs/)，Agent 会继续生成旧路径**
   - **这是目录混乱的根本原因**
   - **必须优先更新模板文件，从源头解决认知问题**

**影响**：
- Agent 通过模板文件中的提示词理解目录结构
- 如果模板文件使用旧路径 `.specs/`，Agent 会继续创建旧路径
- 即使核心运行时代码更新了，Agent 仍然会按照模板提示词行动
- **模板文件是 Agent 的认知来源，必须最优先更新**

### 1.2 现状

当前 `.sdd/.specs/` 目录存在以下规范违反问题：

```
.sdd/.specs/                                         # ❌ 根目录名称错误
├── architecture/                    # ❌ 缺少 specs-tree- 前缀
├── deprecate-sdd-tools/             # ❌ 缺少 specs-tree- 前缀
├── examples/                        # ❌ 缺少 specs-tree- 前缀，且内容可删除
├── feature-readme-template/         # ❌ 缺少 specs-tree- 前缀
├── roadmap-update/                  # ❌ 缺少 specs-tree- 前缀
├── sdd-multi-module/                # ❌ 缺少 specs-tree- 前缀
├── sdd-plugin-baseline/             # ❌ 缺少 specs-tree- 前缀
├── sdd-plugin-phase2/               # ❌ 缺少 specs-tree- 前缀
├── sdd-plugin-roadmap/              # ❌ 缺少 specs-tree- 前缀
├── sdd-tools-optimization/          # ❌ 缺少 specs-tree- 前缀
├── sdd-workflow-state-optimization/ # ❌ 缺少 specs-tree- 前缀
├── .templates/                      # ❌ 特殊目录位置不当
├── ROADMAP.md                       # ⚠️ 位置错误，应迁移到 specs-tree-root/
├── README.md                        # ✅ 保留
└── state.json                       # ⚠️ 由其他 feature 处理

.sdd/                                                  # 根目录待清理文件
├── docs/                            # ❌ 历史遗留临时文件，应删除
├── src/                             # ❌ 历史遗留临时文件，应删除（项目根目录 src/才是正式源代码）
├── tests/                           # ❌ 历史遗留临时文件，应删除
└── ROADMAP.md                       # ❌ 位置错误，应迁移到 specs-tree-root/

已符合规范的目录（无需处理）：
├── specs-tree-agentic/              # ✅ 已符合规范
├── specs-tree-directory-naming/     # ✅ 已符合规范
└── specs-tree-state-json-fix/       # ✅ 已符合规范
```

### 1.3 问题影响

1. **规范不一致**：与 `.sdd/TREE.md` 定义的命名规范冲突
2. **工具兼容性**：@sdd-* 工具依赖统一的目录命名约定
3. **可维护性**：目录命名混乱增加新成员学习成本
4. **自动化困难**：不统一的命名使得脚本处理复杂化
5. **临时文件残留**：`.sdd/docs/`, `.sdd/src/`, `.sdd/tests/` 是历史遗留临时文件，应删除
6. **文件位置错误**：`.sdd/ROADMAP.md` 应在 `specs-tree-root/` 下，而非根目录
7. **TREE.md 标记错误**：TREE.md 第 34-36 行错误地将 `.sdd/src/` 标记为"临时文件"，需修正
8. **历史遗留文件混淆**：`.sdd/` 根目录下的 `docs/`, `src/`, `tests/` 是 SDD 工作流早期版本的遗留文件，与项目根目录的正式源代码重复且已过时

### 1.4 规范依据

根据 `.sdd/TREE.md` 第 14 行和第 45-58 行定义的命名规范：
```
.sdd/
├── specs-tree-root/                # 根 specs（第 14 行）
```
- 根 specs 目录应使用 `specs-tree-root/`（不带点号前缀）
- 所有子 specs 目录必须以 `specs-tree-` 前缀开头
- 使用有意义的功能名称，避免过于宽泛的词汇
- 采用 kebab-case：`specs-tree-my-awesome-feature`
- 优先使用业务领域术语而非技术术语

### 1.5 `.sdd/` 根目录临时文件详细分析

**用户决策（2026-04-01）**：
- **项目根目录的 `src/`** 才是真正的 SDD 插件源代码
- **`.sdd/src/`, `.sdd/docs/`, `.sdd/tests/`** 是历史遗留文件，没有用
- **全部删除** `.sdd/` 根目录下的这三个临时目录

#### 1.5.1 `.sdd/src/` - 历史遗留临时文件

**实际情况**：
```
.sdd/src/                              # ❌ 历史遗留临时文件
├── README.md
├── sdd-multi-module.ts
├── state/
└── utils/
```

**问题**：
- 与项目根目录 `src/` 重复
- 是 SDD 工作流早期版本的遗留文件
- 已过时，不再反映当前代码状态

**结论**：**删除** `.sdd/src/`，项目根目录 `src/` 才是正式源代码。

#### 1.5.2 `.sdd/docs/` - 历史遗留临时文件

**已知内容**：
- `INSTALL.md` - 安装说明文档（旧版本）
- `README.md` - 文档说明（旧版本）

**结论**：**删除** `.sdd/docs/`，删除前备份有价值内容到文档。

#### 1.5.3 `.sdd/tests/` - 历史遗留临时文件

**结论**：**删除** `.sdd/tests/`，项目根目录有正式测试文件。

---

## 2. 目标与非目标

### 2.1 目标 (Goals)

| ID | 目标 | 优先级 | 验收标准 |
|----|------|--------|----------|
| G-001 | **更新 Agent 模板提示词** | P0-最高 | 11 个 .hbs 模板文件中的路径全部更新为 `specs-tree-root/` |
| G-002 | **统一 Agent 目录认知** | P0-最高 | Agent 通过模板文件学习正确的目录结构规范 |
| G-003 | **更新核心运行时代码** | P1-高 | 5 个 .ts 核心文件中的路径逻辑与 TREE.md 一致 |
| G-004 | **更新目录创建逻辑** | P1-高 | Agent 创建新 specs 时自动添加 `specs-tree-` 前缀 |
| G-005 | **更新目录扫描逻辑** | P1-高 | Agent 能正确识别和读取 `specs-tree-*` 目录 |
| G-006 | **清理历史遗留目录** | P1-高 | 删除 `.sdd/docs/`, `.sdd/src/`, `.sdd/tests/` |
| G-007 | **迁移现有目录** | P1-高 | 将现有 11 个目录重命名为符合规范的名称 |
| G-008 | **更新 TREE.md** | P1-高 | 修正关于临时文件的错误标记 |
| G-009 | **更新工具代码** | P1-高 | @sdd-spec/@sdd-plan/@sdd-tasks/@sdd-docs 都遵循新规范 |
| G-010 | **更新测试文件** | P2-中 | 8 个 .test.ts 测试文件验证新路径逻辑 |

### 2.2 非目标 (Non-Goals)

| ID | 非目标 | 说明 |
|----|--------|------|
| NG-001 | 不改变 SDD 工作流 | 6 阶段工作流保持不变 |
| NG-002 | 不修改 specs 内部结构 | spec.md/plan.md/tasks.md 结构不变 |
| NG-003 | 不删除项目根目录 src/ | 这是 SDD 插件的正式源代码 |
| NG-004 | 不改变 state.json 格式 | 由其他 feature 处理 |

---

## 3. 用户故事

| ID | 用户故事 | 价值 |
|----|----------|------|
| US-001 | 作为**SDD 用户**，我希望**Agent 创建的目录自动符合规范**，以便**无需手动纠正** | 提升用户体验 |
| US-002 | 作为**开发者**，我希望**Agent 代码与 TREE.md 一致**，以便**维护成本降低** | 减少认知负担 |
| US-003 | 作为**维护者**，我希望**目录命名统一**，以便**快速定位和管理** | 提高维护效率 |
| US-004 | 作为**新 Agent**，我希望**有明确的规范参考**，以便**正确执行目录操作** | 保证规范执行 |

---

## 4. 功能需求

### 4.1 Agent 代码更新（优先级最高）

| ID | 需求 | 验收标准 |
|----|------|----------|
| FR-001 | 更新 `./src/agents/` 中的目录路径常量 | 所有路径引用使用 `specs-tree-root/` |
| FR-002 | 更新目录创建逻辑 | 创建 specs 时自动添加 `specs-tree-` 前缀 |
| FR-003 | 更新目录扫描逻辑 | 能正确识别 `specs-tree-*` 模式的目录 |
| FR-004 | 更新路径验证逻辑 | 检查目录名是否符合规范 |
| FR-005 | 更新错误提示 | 当目录不规范时给出明确提示 |

### 4.2 根目录重命名

| ID | 需求 | 验收标准 |
|----|------|----------|
| FR-006 | 将 `.sdd/.specs/` 重命名为 `.sdd/specs-tree-root/` | 根目录重命名后，所有子目录完整迁移 |
| FR-007 | 保留根目录下的 `state.json` | 保留原位置，本 feature 不做处理（由其他 feature 负责） |
| FR-008 | 保留根目录下的 `README.md` | 保留 `.sdd/README.md` + 新建 `specs-tree-root/README.md` |
| FR-009 | 迁移 `ROADMAP.md` | 从 `.sdd/ROADMAP.md` 迁移到 `specs-tree-root/ROADMAP.md` |

### 4.3 子目录重命名

| ID | 需求 | 验收标准 |
|----|------|----------|
| FR-010 | 所有现有子目录必须添加 `specs-tree-` 前缀 | 重命名后无遗漏，所有目录符合规范 |
| FR-011 | `architecture/` → `specs-tree-architecture/` | 包含子目录 adr/ 和 archive/ 完整迁移 |
| FR-012 | `deprecate-sdd-tools/` → `specs-tree-deprecate-sdd-tools/` | 内容完整保留 |
| FR-013 | `feature-readme-template/` → `specs-tree-feature-readme-template/` | 内容完整保留 |
| FR-014 | `roadmap-update/` → `specs-tree-roadmap-update/` | 内容完整保留 |
| FR-015 | `sdd-multi-module/` → `specs-tree-sdd-multi-module/` | 内容完整保留 |
| FR-016 | `sdd-plugin-baseline/` → `specs-tree-sdd-plugin-baseline/` | 内容完整保留 |
| FR-017 | `sdd-plugin-phase2/` → `specs-tree-sdd-plugin-phase2/` | 内容完整保留 |
| FR-018 | `sdd-plugin-roadmap/` → `specs-tree-sdd-plugin-roadmap/` | 内容完整保留 |
| FR-019 | `sdd-tools-optimization/` → `specs-tree-sdd-tools-optimization/` | 内容完整保留 |
| FR-020 | `sdd-workflow-state-optimization/` → `specs-tree-sdd-workflow-state-optimization/` | 内容完整保留 |

### 4.4 特殊目录处理

| ID | 需求 | 验收标准 |
|----|------|----------|
| FR-021 | 删除 `.templates/` 目录 | 删除前备份模板内容到文档 |
| FR-022 | 删除 `examples/` 目录 | 删除前确认无引用依赖 |

### 4.5 子目录处理

| ID | 需求 | 验收标准 |
|----|------|----------|
| FR-023 | `architecture/adr/` 保留在 `specs-tree-architecture/adr/` | ADR 文档完整保留 |
| FR-024 | `architecture/archive/` 内容需要评估后处理 | 有价值内容迁移，其余删除 |

### 4.6 文档更新

| ID | 需求 | 验收标准 |
|----|------|----------|
| FR-025 | 更新 `.sdd/README.md` 中的目录引用 | 所有路径从 `.specs/` 指向 `specs-tree-root/` |
| FR-026 | 更新 `specs-tree-root/README.md` | 反映新的目录结构 |
| FR-027 | 更新各 specs 内部的跨目录引用 | 检查并修复相对路径 |
| FR-028 | 新增 Agent 目录规范指南 | 创建 `.sdd/docs/agent-directory-spec.md` |

### 4.7 `.sdd/` 根目录临时文件删除（用户决策）

**用户决策（2026-04-01）**：
- 项目根目录的 `src/` 才是真正的 SDD 插件源代码
- `.sdd/docs/`, `.sdd/src/`, `.sdd/tests/` 是历史遗留文件，没有用
- **全部删除** `.sdd/` 根目录下的这三个临时目录

| ID | 需求 | 验收标准 |
|----|------|----------|
| FR-029 | 删除 `.sdd/docs/` | 删除前备份 `INSTALL.md` 和 `README.md` 内容到文档 |
| FR-029-A | 备份 `.sdd/docs/INSTALL.md` | 如果有价值内容，复制到 `.sdd/docs-INSTALL-backup.md` |
| FR-029-B | 删除 `.sdd/docs/` 目录 | 确认备份完成后执行删除 |
| FR-030 | 删除 `.sdd/src/` | 确认项目根目录 `src/` 存在且完整后删除 |
| FR-030-A | 前置检查项目根目录 src/ | 确认 `src/` 存在且包含完整源代码 |
| FR-030-B | 删除 `.sdd/src/` 目录 | 确认检查通过后执行删除 |
| FR-031 | 删除 `.sdd/tests/` | 确认项目根目录有测试文件后删除 |
| FR-031-A | 前置检查项目根目录测试文件 | 确认项目根目录或 `src/` 内部有测试文件 |
| FR-031-B | 删除 `.sdd/tests/` 目录 | 确认检查通过后执行删除 |

### 4.8 已规范目录保留

| ID | 需求 | 验收标准 |
|----|------|----------|
| FR-032 | 保留 `specs-tree-agentic/` 不做变更 | 目录及内容保持原状 |
| FR-033 | 保留 `specs-tree-directory-naming/` 不做变更 | 目录及内容保持原状 |
| FR-034 | 保留 `specs-tree-state-json-fix/` 不做变更 | 目录及内容保持原状 |

### 4.9 Agent 代码路径更新（核心任务）

**背景**：对 `./src/` 目录全面扫描发现 **96 处**使用旧路径 `.specs/` 的代码，需要更新为新路径 `specs-tree-root/`。

**文件优先级分类**：
- **P0-最高优先级（Agent 认知层）**：11 个 .hbs 模板文件，决定 Agent 如何理解目录结构
- **P1-高优先级（核心运行时）**：5 个 .ts 核心代码文件，实际路径逻辑
- **P2-中优先级（测试验证）**：8 个 .test.ts 测试文件，验证代码正确性

| ID | 需求 | 优先级 | 说明 |
|----|------|--------|------|
| FR-035 | 更新 Agent 模板提示词 | **P0-最高** | 11 个 .hbs 文件，决定 Agent 认知，55+ 处修改 |
| FR-036 | 更新核心运行时代码 | **P1-高** | 5 个 .ts 文件，实际路径逻辑，8 处修改 |
| FR-037 | 更新测试文件 | **P2-中** | 8 个 .test.ts 文件，验证功能，12+ 处修改 |

---

## 5. 非功能需求

| ID | 需求 | 验收标准 |
|----|------|----------|
| NFR-001 | **零数据丢失** | 迁移后所有 specs 内容完整可访问 |
| NFR-002 | **向后兼容** | 迁移过程中提供临时映射或过渡期 |
| NFR-003 | **可回滚** | 提供回滚脚本，可在 10 分钟内恢复原状 |
| NFR-004 | **执行时间** | 完整迁移在 5 分钟内完成 |
| NFR-005 | **文档同步** | 所有引用文档在迁移后 24 小时内更新 |
| NFR-006 | **Agent 代码一致性** | 所有 Agent 工具的目录路径引用与 TREE.md 一致 |

---

## 6. 技术设计

### 6.1 Agent 代码修改点

需要检查并更新的代码位置：

```
./src/
├── agents/
│   ├── sdd-spec.ts          # 检查目录路径引用
│   ├── sdd-plan.ts          # 检查目录路径引用
│   ├── sdd-tasks.ts         # 检查目录路径引用
│   ├── sdd-docs.ts          # 检查目录路径引用
│   └── sdd-roadmap.ts       # 检查目录路径引用
├── state/
│   └── manager.ts           # 检查 state.json 路径
└── utils/
    ├── subfeature-manager.ts # 检查子目录管理逻辑
    └── workspace.ts          # 检查工作空间识别逻辑
```

### 6.2 关键代码变更示例

```typescript
// 旧代码
const SPECS_DIR = '.sdd/.specs';

// 新代码
const SPECS_DIR = '.sdd/specs-tree-root';
const SPECS_PREFIX = 'specs-tree-';

// 创建新 specs 目录
function createSpecsDir(featureName: string): string {
  const dirName = `${SPECS_PREFIX}${kebabCase(featureName)}`;
  return path.join(SPECS_DIR, dirName);
}

// 扫描 specs 目录
function scanSpecsDirs(): string[] {
  const dirs = fs.readdirSync(SPECS_DIR);
  return dirs.filter(dir => dir.startsWith(SPECS_PREFIX) || dir === 'state.json' || dir === 'README.md');
}

// 验证目录名是否符合规范
function validateSpecsDirName(dirName: string): boolean {
  if (dirName === 'state.json' || dirName === 'README.md' || dirName === 'spec.md' || dirName === 'plan.md' || dirName === 'tasks.md') {
    return true;
  }
  return dirName.startsWith(SPECS_PREFIX);
}
```

### 6.3 代码修改清单

**扫描结果**：共发现 **96 处** 使用旧路径 `.specs/` 的代码，需要更新为 `specs-tree-root/`。

**优先级分类原则**：
- **P0-最高（Agent 认知层）**：模板文件决定 Agent 如何理解目录结构，必须最优先更新
- **P1-高（核心运行时）**：核心代码实现实际路径逻辑，确保运行时行为正确
- **P2-中（测试验证）**：测试文件验证代码正确性，不影响运行时行为

#### 6.3.1 Agent 模板文件（P0-最高优先级）- 11 个文件，55+ 处修改

| 文件路径 | 修改类型 | 具体行号 | 旧值 | 新值 | 修改数 |
|----------|----------|----------|------|------|--------|
| `src/templates/agents/sdd.md.hbs` | 主入口提示词 | 25, 53-55, 149, 154-156 | `.specs/` | `specs-tree-root/` | 7 |
| `src/templates/agents/sdd-spec.md.hbs` | spec agent | 21, 31, 98 | `.specs/` | `specs-tree-root/` | 3 |
| `src/templates/agents/sdd-plan.md.hbs` | plan agent | 20, 22-23, 32, 36, 82, 108 | `.specs/` | `specs-tree-root/` | 6 |
| `src/templates/agents/sdd-tasks.md.hbs` | tasks agent | 20-23, 32-33, 37, 97, 127-128 | `.specs/` | `specs-tree-root/` | 6 |
| `src/templates/agents/sdd-build.md.hbs` | build agent | 20-23, 34, 44, 66 | `.specs/` | `specs-tree-root/` | 5 |
| `src/templates/agents/sdd-review.md.hbs` | review agent | 20-22, 41, 53, 64-66 | `.specs/` | `specs-tree-root/` | 5 |
| `src/templates/agents/sdd-validate.md.hbs` | validate agent | 20, 23, 34, 44, 82, 186 | `.specs/` | `specs-tree-root/` | 6 |
| `src/templates/agents/sdd-docs.md.hbs` | docs agent | 31, 48-50, 136-137, 140, 145, 159-161 | `.specs/` | `specs-tree-root/` | 6 |
| `src/templates/agents/sdd-roadmap.md.hbs` | roadmap agent | 35-36, 62, 75-78, 100, 102 | `.specs/` | `specs-tree-root/` | 6 |
| `src/templates/agents/sdd-help.md.hbs` | help agent | 96-98, 112 | `.specs/` | `specs-tree-root/` | 2 |
| `src/templates/subfeature-templates.ts` | 子功能模板 | 252 | `.specs/` | `specs-tree-root/` | 1 |
| **小计** | **11 个文件** | - | - | - | **55 处** |

**重要性**：这些文件是 **Agent 的认知来源**，决定了 Agent 如何理解目录结构。如果不更新，Agent 会继续使用旧路径生成新目录。

#### 6.3.2 核心运行时文件（P1-高优先级）- 5 个文件，8 处修改

| 文件路径 | 修改类型 | 具体行号 | 旧值 | 新值 | 修改数 |
|----------|----------|----------|------|------|--------|
| `src/state/machine.ts` | 构造函数默认参数 | 52 | `.specs` | `specs-tree-root` | 1 |
| `src/state/schema-v1.2.5.ts` | 路径常量 | 188-191 | `.specs/${feature}/` | `specs-tree-root/${feature}/` | 4 |
| `src/state/migrator.ts` | 路径拼接 | 52 | `.specs/` | `specs-tree-root/` | 1 |
| `src/utils/subfeature-manager.ts` | 路径拼接 | 246 | `.specs` | `specs-tree-root` | 1 |
| `src/index.ts` | 路径检查 | 27 | `.specs/` | `specs-tree-root/` | 1 |
| **小计** | **5 个文件** | - | - | - | **8 处** |

**重要性**：这些文件是 **核心运行时逻辑**，实现实际的路径处理功能。确保 Agent 在执行时使用正确的路径。

#### 6.3.3 测试文件（P2-中优先级）- 8 个文件，12+ 处修改

| 文件路径 | 修改类型 | 具体行号 | 旧值 | 新值 | 修改数 |
|----------|----------|----------|------|------|--------|
| `src/state/schema-v1.2.5.test.ts` | 测试路径常量 | 64-67, 79, 86, 254-257 | `.specs` | `specs-tree-root` | 8 |
| `src/state/migrator.test.ts` | 测试路径常量 | 57, 73 | `.specs` | `specs-tree-root` | 2 |
| `src/utils/subfeature-manager.test.ts` | 测试路径拼接 | 237, 254 | `.specs` | `specs-tree-root` | 2 |
| `src/state/multi-feature-manager.test.ts` | 待检查 | 待确认 | 待确认 | 待确认 | 待确认 |
| `src/utils/dependency-notifier.test.ts` | 待检查 | 待确认 | 待确认 | 待确认 | 待确认 |
| `src/utils/tasks-parser.test.ts` | 待检查 | 待确认 | 待确认 | 待确认 | 待确认 |
| `src/utils/readme-generator.test.ts` | 待检查 | 待确认 | 待确认 | 待确认 | 待确认 |
| `src/templates/subfeature-templates.test.ts` | 待检查 | 待确认 | 待确认 | 待确认 | 待确认 |
| **小计** | **8 个文件** | - | - | - | **12+ 处** |

**重要性**：这些文件是 **测试验证层**，确保代码更新后功能正确。不影响运行时行为，但保证质量。

**合计**：24 个文件，75+ 处修改点（实际扫描 96 处，部分待确认）。

### 6.4 目录结构变更

#### 变更前
```
.sdd/
├── .specs/                                    # ❌ 根目录名称错误
│   ├── architecture/
│   ├── deprecate-sdd-tools/
│   ├── examples/
│   ├── feature-readme-template/
│   ├── roadmap-update/
│   ├── sdd-multi-module/
│   ├── sdd-plugin-baseline/
│   ├── sdd-plugin-phase2/
│   ├── sdd-plugin-roadmap/
│   ├── sdd-tools-optimization/
│   ├── sdd-workflow-state-optimization/
│   ├── .templates/
│   ├── ROADMAP.md
│   ├── README.md
│   └── state.json
├── docs/                                      # ❌ 历史遗留临时文件，应删除
├── src/                                       # ❌ 历史遗留临时文件，应删除
├── tests/                                     # ❌ 历史遗留临时文件，应删除
├── ROADMAP.md                                 # ❌ 位置错误
├── specs-tree-agentic/                        # ✅ 已符合规范
├── specs-tree-directory-naming/               # ✅ 已符合规范
└── specs-tree-state-json-fix/                 # ✅ 已符合规范
```

#### 变更后
```
.sdd/
├── specs-tree-root/                           # ✅ 符合 TREE.md 第 14 行
│   ├── spec.md                                # 根 specs 规格文档（新增）
│   ├── plan.md                                # 根 specs 技术计划（新增）
│   ├── tasks.md                               # 根 specs 任务分解（新增）
│   ├── state.json                             # 全局状态文件（保留原位置）
│   ├── README.md                              # 更新内容
│   ├── ROADMAP.md                             # 从 .sdd/ 迁移
│   ├── specs-tree-architecture/
│   │   ├── spec.md
│   │   ├── plan.md
│   │   ├── tasks.md
│   │   ├── state.json
│   │   ├── adr/
│   │   └── archive/ (内容评估后处理)
│   ├── specs-tree-deprecate-sdd-tools/
│   ├── specs-tree-feature-readme-template/
│   ├── specs-tree-roadmap-update/
│   ├── specs-tree-sdd-multi-module/
│   ├── specs-tree-sdd-plugin-baseline/
│   ├── specs-tree-sdd-plugin-phase2/
│   ├── specs-tree-sdd-plugin-roadmap/
│   ├── specs-tree-sdd-tools-optimization/
│   └── specs-tree-sdd-workflow-state-optimization/
├── specs-tree-agentic/                        # ✅ 保持不变
├── specs-tree-directory-naming/               # ✅ 保持不变
└── specs-tree-state-json-fix/                 # ✅ 保持不变
```

**注意**：`.sdd/src/`, `.sdd/docs/`, `.sdd/tests/` 将在阶段 5 删除（见用户决策 2026-04-01）。

### 6.4 迁移脚本设计

```bash
#!/bin/bash
# specs-directory-migration.sh
# 功能：将 .sdd/.specs/ 重命名为 .sdd/specs-tree-root/ 并更新子目录

SDD_DIR=".sdd"
OLD_SPECS_DIR="$SDD_DIR/.specs"
NEW_SPECS_DIR="$SDD_DIR/specs-tree-root"

# 阶段 1: 根目录重命名
echo "=== 阶段 1: 重命名根目录 ==="
mv "$OLD_SPECS_DIR" "$NEW_SPECS_DIR"

# 阶段 2: 子目录重命名
echo "=== 阶段 2: 重命名子目录 ==="
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
        echo "迁移：$old_name → $new_name"
        mv "$old_name" "$new_name"
    fi
done

# 阶段 3: 删除指定目录
echo "=== 阶段 3: 删除目录 ==="
rm -rf ".templates" "examples"

# 阶段 4: 迁移 ROADMAP.md
echo "=== 阶段 4: 迁移文件 ==="
if [ -f "$SDD_DIR/ROADMAP.md" ]; then
    mv "$SDD_DIR/ROADMAP.md" "$NEW_SPECS_DIR/ROADMAP.md"
    echo "迁移：$SDD_DIR/ROADMAP.md → $NEW_SPECS_DIR/ROADMAP.md"
fi

# 阶段 5: 删除 .sdd 根目录临时文件
echo "=== 阶段 5: 删除临时目录 ==="

# 前置检查
if [ ! -d "src" ]; then
    echo "错误：项目根目录 src/ 不存在，无法删除 .sdd/src/"
    exit 1
fi

# 备份 docs 内容（可选）
if [ -f ".sdd/docs/INSTALL.md" ]; then
    echo "备份：.sdd/docs/INSTALL.md"
    cp ".sdd/docs/INSTALL.md" ".sdd/docs-INSTALL-backup.md"
fi

# 执行删除
rm -rf ".sdd/docs" ".sdd/src" ".sdd/tests"
echo "已删除：docs/, src/, tests/"

echo ""
echo "=== 迁移完成 ==="
```

### 6.5 回滚脚本设计

```bash
#!/bin/bash
# specs-directory-rollback.sh
# 功能：回滚到迁移前的目录结构

SDD_DIR=".sdd"
NEW_SPECS_DIR="$SDD_DIR/specs-tree-root"
OLD_SPECS_DIR="$SDD_DIR/.specs"

echo "=== 开始回滚 specs-tree-root/ → .specs/ ==="

# 步骤 1: 反向目录映射表
declare -A DIR_MAP=(
    ["specs-tree-architecture"]="architecture"
    ["specs-tree-deprecate-sdd-tools"]="deprecate-sdd-tools"
    ["specs-tree-feature-readme-template"]="feature-readme-template"
    ["specs-tree-roadmap-update"]="roadmap-update"
    ["specs-tree-sdd-multi-module"]="sdd-multi-module"
    ["specs-tree-sdd-plugin-baseline"]="sdd-plugin-baseline"
    ["specs-tree-sdd-plugin-phase2"]="sdd-plugin-phase2"
    ["specs-tree-sdd-plugin-roadmap"]="sdd-plugin-roadmap"
    ["specs-tree-sdd-tools-optimization"]="sdd-tools-optimization"
    ["specs-tree-sdd-workflow-state-optimization"]="sdd-workflow-state-optimization"
)

# 步骤 2: 恢复子目录名称
echo "步骤 1: 恢复子目录名称"
for new_name in "${!DIR_MAP[@]}"; do
    old_name="${DIR_MAP[$new_name]}"
    if [ -d "$NEW_SPECS_DIR/$new_name" ]; then
        echo "  恢复：$new_name → $old_name"
        mv "$NEW_SPECS_DIR/$new_name" "$NEW_SPECS_DIR/$old_name"
    fi
done

# 步骤 3: 恢复根目录名称
echo ""
echo "步骤 2: 恢复根目录名称"
mv "$NEW_SPECS_DIR" "$OLD_SPECS_DIR"

echo ""
echo "=== 回滚完成 ==="
echo "已恢复到：$OLD_SPECS_DIR"
```

### 6.6 依赖关系

```
┌─────────────────────────────────────┐
│  前置依赖                            │
├─────────────────────────────────────┤
│  • 备份现有 .sdd/.specs/ 目录       │
│  • 确认无正在进行中的 specs 操作    │
│  • 通知团队成员迁移计划             │
│  • 确认项目根目录 src/ 存在且完整  │
│  • 确认项目根目录有测试文件         │
│  • 备份 .sdd/docs/INSTALL.md 内容  │
└─────────────────────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  更新 Agent 代码                     │
├─────────────────────────────────────┤
│  • 更新 ./src/agents/ 中的路径常量 │
│  • 更新目录创建逻辑                 │
│  • 更新目录扫描逻辑                 │
│  • 更新路径验证逻辑                 │
│  • 测试 Agent 代码功能              │
└─────────────────────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  执行迁移                            │
├─────────────────────────────────────┤
│  • 运行迁移脚本                     │
│  • 验证目录重命名                   │
│  • 删除指定目录 (.templates/, examples/)│
│  • 迁移 ROADMAP.md                  │
│  • 删除 .sdd/docs/, .sdd/src/, .sdd/tests/│
└─────────────────────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  更新文档和工具                      │
├─────────────────────────────────────┤
│  • 更新 .sdd/README.md              │
│  • 更新 specs-tree-root/README.md   │
│  • 更新 @sdd-* 工具代码             │
│  • 更新 TREE.md（修正 src/ 标记）   │
│  • 新增 Agent 目录规范指南          │
└─────────────────────────────────────┘
```

---

## 7. 边界情况与错误处理

| ID | 场景 | 处理方案 |
|----|------|----------|
| EC-001 | `specs-tree-root/` 目录已存在 | 跳过迁移，记录警告日志，手动处理冲突 |
| EC-002 | 迁移过程中断 | 提供回滚脚本恢复原状 |
| EC-003 | 文件被占用无法移动 | 提示关闭相关进程后重试 |
| EC-004 | 跨目录引用失效 | 运行查找替换脚本更新路径 |
| EC-005 | 工具代码引用硬编码路径 | 全面搜索并更新代码引用 |
| EC-006 | `.sdd/` 根目录已存在 ROADMAP.md | 迁移到 `specs-tree-root/ROADMAP.md` |
| EC-007 | `.sdd/src/` 是历史遗留临时文件 | 确认项目根目录 src/ 存在后删除 `.sdd/src/` |
| EC-008 | `.sdd/docs/` 包含旧版文档 | 备份有价值内容后删除 |
| EC-009 | `.sdd/tests/` 是历史遗留测试 | 确认项目根目录有测试文件后删除 |
| EC-010 | 已规范目录被误操作 | 脚本中明确排除 specs-tree-* 目录 |
| EC-011 | TREE.md 标记与实际内容不符 | 更新 TREE.md 以反映正确的文件分类 |
| EC-012 | Agent 代码更新后功能异常 | 提供回滚机制，恢复旧版代码 |
| EC-013 | 目录创建逻辑未添加前缀 | 检查验证逻辑，确保强制添加前缀 |

---

## 8. 验收标准

### 8.1 验收顺序

**验收原则**：按照文件优先级顺序验收，确保 Agent 认知层优先验证。

#### 8.1.1 第一阶段：Agent 模板验收（P0-最高优先级）

**验收目标**：确保 Agent 通过模板文件学习正确的目录结构。

- [ ] `src/templates/agents/sdd.md.hbs` 主入口提示词路径已更新（7 处）
- [ ] `src/templates/agents/sdd-spec.md.hbs` spec agent 路径已更新（3 处）
- [ ] `src/templates/agents/sdd-plan.md.hbs` plan agent 路径已更新（6 处）
- [ ] `src/templates/agents/sdd-tasks.md.hbs` tasks agent 路径已更新（6 处）
- [ ] `src/templates/agents/sdd-build.md.hbs` build agent 路径已更新（5 处）
- [ ] `src/templates/agents/sdd-review.md.hbs` review agent 路径已更新（5 处）
- [ ] `src/templates/agents/sdd-validate.md.hbs` validate agent 路径已更新（6 处）
- [ ] `src/templates/agents/sdd-docs.md.hbs` docs agent 路径已更新（6 处）
- [ ] `src/templates/agents/sdd-roadmap.md.hbs` roadmap agent 路径已更新（6 处）
- [ ] `src/templates/agents/sdd-help.md.hbs` help agent 路径已更新（2 处）
- [ ] `src/templates/subfeature-templates.ts` 子功能模板路径已更新（1 处）
- [ ] 所有模板文件语法正确，无 Handlebars 编译错误

**验收标准**：11 个模板文件中所有 `.specs/` 路径已更新为 `specs-tree-root/`。

#### 8.1.2 第二阶段：核心运行时验收（P1-高优先级）

**验收目标**：确保核心运行时代码使用正确的路径逻辑。

- [ ] `src/state/machine.ts` 第 52 行：`specsDir` 默认值已更新为 `specs-tree-root`
- [ ] `src/state/schema-v1.2.5.ts` 第 188-191 行：路径常量已更新为 `specs-tree-root/${feature}/`
- [ ] `src/state/migrator.ts` 第 52 行：路径拼接已更新为 `specs-tree-root/`
- [ ] `src/utils/subfeature-manager.ts` 第 246 行：路径常量已更新为 `specs-tree-root`
- [ ] `src/index.ts` 第 27 行：路径检查已更新为 `specs-tree-root/`
- [ ] 所有核心代码文件编译通过，无 TypeScript 错误

**验收标准**：5 个核心文件编译通过，路径常量正确。

#### 8.1.3 第三阶段：测试文件验收（P2-中优先级）

**验收目标**：确保测试文件验证新路径逻辑。

- [ ] `src/state/schema-v1.2.5.test.ts` 测试路径常量已更新
- [ ] `src/state/migrator.test.ts` 测试路径常量已更新
- [ ] `src/utils/subfeature-manager.test.ts` 测试路径拼接已更新
- [ ] 其余 5 个测试文件已检查并更新（如需要）
- [ ] 所有测试用例运行通过

**验收标准**：8 个测试文件路径已更新，所有测试通过。

#### 8.1.4 第四阶段：功能验证

**验收目标**：确保所有 Agent 工具功能正常。

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

**验收标准**：所有 Agent 工具功能正常，无路径错误。

### 8.2 目录迁移验收

- [ ] `.sdd/.specs/` 已重命名为 `.sdd/specs-tree-root/`
- [ ] 所有 11 个子目录已完成 `specs-tree-` 前缀添加
- [ ] `.templates/` 和 `examples/` 已删除
- [ ] `state.json` 保留原位置（本 feature 不处理）
- [ ] `ROADMAP.md` 已从 `.sdd/` 迁移到 `specs-tree-root/`
- [ ] `.sdd/README.md` 保留，`specs-tree-root/README.md` 新建
- [ ] `spec.md`/`plan.md`/`tasks.md` 已在 `specs-tree-root/` 根目录创建
- [ ] 所有子目录内容完整保留
- [ ] `.sdd/docs/` 已删除（内容已备份）
- [ ] `.sdd/src/` 已删除（确认项目根目录 src/ 完整）
- [ ] `.sdd/tests/` 已删除
- [ ] 项目根目录 `src/` 完整存在
- [ ] 删除操作已记录日志
- [ ] `specs-tree-agentic/`, `specs-tree-directory-naming/`, `specs-tree-state-json-fix/` 保持不变

### 8.3 文档验收

- [ ] `.sdd/README.md` 已更新（`.specs/` → `specs-tree-root/`）
- [ ] `specs-tree-root/README.md` 已更新
- [ ] 各 specs 内部引用已修复
- [ ] 新增 Agent 目录规范指南 `.sdd/docs/agent-directory-spec.md`

### 8.4 回滚验收

- [ ] 回滚脚本测试通过
- [ ] 回滚后状态与迁移前一致

---

## 9. 开放问题

| ID | 问题 | 负责人 | 状态 |
|----|------|--------|------|
| OQ-001 | `architecture/archive/` 内容是否需要保留？ | 待定 | 待决策 |
| OQ-002 | 是否需要为旧目录名创建软链接兼容期？ | 待定 | 待讨论 |
| OQ-003 | 是否需要更新 CI/CD 中的路径配置？ | 待定 | 待调研 |
| OQ-004 | `state.json` 的长期处理方案？ | 其他 feature | 本 feature 范围外 |
| OQ-005 | TREE.md 是否需要更新以反映正确的文件分类？ | 待定 | **需修正**：更新 TREE.md，明确标注这些目录为"历史遗留文件，应删除" |

**已决策事项**：
- ~~OQ-006~~: `.sdd/src/` 是否应该作为历史版本保留？ → **已决策：删除**
- ~~OQ-007~~: 如果保留 `.sdd/src/`，是否应该纳入 specs-tree 管理？ → **已决策：删除**
- ~~OQ-008~~: `.sdd/tests/` 内容是什么？ → **已决策：删除**

---

## 10. 版本历史

| 版本 | 日期 | 作者 | 变更说明 |
|------|------|------|----------|
| 1.0.0 | 2026-04-01 | SDD 规范编写专家 | 初始版本 |
| 1.0.1 | 2026-04-01 | SDD 规范编写专家 | 修正根目录名称：`.specs/` → `specs-tree-root/` |
| 1.0.2 | 2026-04-01 | SDD 规范编写专家 | 根据用户决策更新：临时文件删除、ROADMAP.md 迁移、已规范目录保留、state.json 弱化 |
| 1.0.3 | 2026-04-01 | SDD 规范编写专家 | **修正临时文件处理策略**：`.sdd/src/` 是 SDD 插件 v1.2.11 源代码而非临时文件，修订 FR-027/028/029 从"删除"改为"检查后决定"，新增 OQ-006/007/008/009 |
| 1.0.4 | 2026-04-01 | SDD 规范编写专家 | **修订临时文件处理策略为"删除"**：用户明确 `.sdd/src/`, `.sdd/docs/`, `.sdd/tests/` 是历史遗留文件，新增删除前检查清单，更新迁移脚本执行删除，移除 OQ-006/007/009 |
| 1.0.5 | 2026-04-01 | SDD 规范编写专家 | **重大修订：突出核心目标** - 修订核心目标为"解决 Agent 目录认知问题"，新增 Agent 代码更新需求（FR-001 至 FR-005），新增技术设计章节（6.1 Agent 代码修改点、6.2 关键代码变更示例），重组功能需求章节（Agent 代码更新作为 4.1 优先级最高），更新验收标准（新增 8.1 Agent 代码验收） |
| 1.0.6 | 2026-04-01 | SDD 规范编写专家 | **新增代码修改清单** - 基于 `./src/` 全面扫描结果，新增 4.9 Agent 代码路径更新需求（FR-035 至 FR-041），新增 6.3 代码修改清单表格（25 个文件，96 处修改点），细化 8.1 Agent 代码验收（分 4 个子章节），新增附录 D 完整文件修改清单，新增附录 E 版本历史详细 |
| 1.0.7 | 2026-04-01 | SDD 规范编写专家 | **修正文件优先级分类** - 模板文件提升为 P0-最高优先级（Agent 认知层），核心运行时调整为 P1-高优先级，测试文件调整为 P2-中优先级，更新问题陈述强调模板文件是认知来源，更新目标章节新增 G-001/G-002（P0），更新功能需求 4.9 重新分类优先级，更新技术设计 6.3 重新排序（模板→运行时→测试），更新验收标准 8.1 调整验收顺序，更新附录 D.5 执行顺序建议 |

---

## 附录 E: 版本历史详细说明

### A.1 根目录映射

| 原目录名 | 新目录名 | 状态 |
|----------|----------|------|
| `.sdd/.specs/` | `.sdd/specs-tree-root/` | ✅ 重命名 |

### A.2 子目录映射

```
源目录：.sdd/.specs/ → 目标：.sdd/specs-tree-root/

需要重命名的目录 (11 个)：
├── architecture/                              → specs-tree-architecture/
├── deprecate-sdd-tools/                       → specs-tree-deprecate-sdd-tools/
├── feature-readme-template/                   → specs-tree-feature-readme-template/
├── roadmap-update/                            → specs-tree-roadmap-update/
├── sdd-multi-module/                          → specs-tree-sdd-multi-module/
├── sdd-plugin-baseline/                       → specs-tree-sdd-plugin-baseline/
├── sdd-plugin-phase2/                         → specs-tree-sdd-plugin-phase2/
├── sdd-plugin-roadmap/                        → specs-tree-sdd-plugin-roadmap/
├── sdd-tools-optimization/                    → specs-tree-sdd-tools-optimization/
└── sdd-workflow-state-optimization/           → specs-tree-sdd-workflow-state-optimization/

需要删除的目录 (2 个)：
├── .templates/                                → ❌ 删除
└── examples/                                  → ❌ 删除

已符合规范的目录 (3 个，保持不变)：
├── specs-tree-agentic/                        → ✅ 不变
├── specs-tree-directory-naming/               → ✅ 不变
└── specs-tree-state-json-fix/                 → ✅ 不变
```

### A.3 根目录文件映射

| 文件名 | 操作 | 说明 |
|--------|------|------|
| `spec.md` | 新增 | 根 specs 规格文档 |
| `plan.md` | 新增 | 根 specs 技术计划 |
| `tasks.md` | 新增 | 根 specs 任务分解 |
| `state.json` | 保留 | 全局状态跟踪文件（本 feature 不处理） |
| `README.md` | 保留 | `.sdd/README.md` + `specs-tree-root/README.md` 两者都保留 |
| `ROADMAP.md` | 迁移 | 从 `.sdd/ROADMAP.md` → `specs-tree-root/ROADMAP.md` |

### A.4 .sdd/ 根目录临时文件处理策略（用户决策）

| 目录名 | 操作 | 说明 |
|--------|------|------|
| `docs/` | ❌ 删除 | 历史遗留临时文件，删除前备份 `INSTALL.md` 内容 |
| `src/` | ❌ 删除 | 历史遗留临时文件，项目根目录 `src/` 才是正式源代码 |
| `tests/` | ❌ 删除 | 历史遗留临时文件，项目根目录有正式测试文件 |

**用户决策（2026-04-01）**：
- 项目根目录的 `src/` 才是真正的 SDD 插件源代码
- `.sdd/docs/`, `.sdd/src/`, `.sdd/tests/` 是历史遗留文件，没有用
- **全部删除** `.sdd/` 根目录下的这三个临时目录

**删除前检查清单**：
- [ ] 确认项目根目录 `src/` 存在且包含完整源代码
- [ ] 确认项目根目录有测试文件（或在 `src/` 内部）
- [ ] 备份 `.sdd/docs/INSTALL.md` 内容（如果有价值）
- [ ] 通知团队成员删除计划

---

## 附录 B: TREE.md 规范引用

根据 `.sdd/TREE.md` 第 14 行：
```
.sdd/
├── specs-tree-root/                # 根 specs
```

**关键修正点**：
- ❌ 旧规范：`.sdd/.specs/`（带点号，不符合 TREE.md）
- ✅ 新规范：`.sdd/specs-tree-root/`（不带点号，符合 TREE.md 第 14 行）

---

## 附录 C: Agent 代码更新检查清单

### C.1 需要检查的文件

| 文件路径 | 检查内容 | 优先级 | 说明 |
|----------|----------|--------|------|
| `src/templates/agents/sdd.md.hbs` | Agent 模板提示词 | **P0-最高** | Agent 认知来源 |
| `src/templates/agents/sdd-spec.md.hbs` | Agent 模板提示词 | **P0-最高** | Agent 认知来源 |
| `src/templates/agents/sdd-plan.md.hbs` | Agent 模板提示词 | **P0-最高** | Agent 认知来源 |
| `src/templates/agents/sdd-tasks.md.hbs` | Agent 模板提示词 | **P0-最高** | Agent 认知来源 |
| `src/templates/agents/sdd-build.md.hbs` | Agent 模板提示词 | **P0-最高** | Agent 认知来源 |
| `src/templates/agents/sdd-review.md.hbs` | Agent 模板提示词 | **P0-最高** | Agent 认知来源 |
| `src/templates/agents/sdd-validate.md.hbs` | Agent 模板提示词 | **P0-最高** | Agent 认知来源 |
| `src/templates/agents/sdd-docs.md.hbs` | Agent 模板提示词 | **P0-最高** | Agent 认知来源 |
| `src/templates/agents/sdd-roadmap.md.hbs` | Agent 模板提示词 | **P0-最高** | Agent 认知来源 |
| `src/templates/agents/sdd-help.md.hbs` | Agent 模板提示词 | **P0-最高** | Agent 认知来源 |
| `src/templates/subfeature-templates.ts` | 子功能模板 | **P0-最高** | Agent 认知来源 |
| `src/state/machine.ts` | 目录路径常量 | **P1-高** | 核心运行时 |
| `src/state/schema-v1.2.5.ts` | 路径生成逻辑 | **P1-高** | 核心运行时 |
| `src/state/migrator.ts` | 路径拼接 | **P1-高** | 核心运行时 |
| `src/utils/subfeature-manager.ts` | 子目录管理逻辑 | **P1-高** | 核心运行时 |
| `src/index.ts` | 路径检查逻辑 | **P1-高** | 核心运行时 |
| `src/state/migrator.test.ts` | 测试路径常量 | **P2-中** | 测试验证 |
| `src/state/schema-v1.2.5.test.ts` | 测试路径常量 | **P2-中** | 测试验证 |
| `src/utils/subfeature-manager.test.ts` | 测试路径拼接 | **P2-中** | 测试验证 |

### C.2 关键常量更新

```typescript
// 需要更新的所有路径常量
const SPECS_DIR = '.sdd/specs-tree-root';        // 旧：'.sdd/.specs'
const SPECS_PREFIX = 'specs-tree-';              // 新增常量
const STATE_FILE = 'state.json';
const README_FILE = 'README.md';
```

### C.3 关键函数更新

| 函数 | 变更内容 |
|------|----------|
| `createSpecsDir()` | 自动添加 `specs-tree-` 前缀 |
| `scanSpecsDirs()` | 识别 `specs-tree-*` 模式 |
| `validateSpecsDirName()` | 验证目录名是否符合规范 |
| `getSpecsPath()` | 返回正确的路径 |

---

## 附录 D: 完整文件修改清单

**扫描统计**：共 **25 个文件**，**96 处** 修改点。

### D.1 Agent 模板文件（P0-最高优先级）- 11 个文件，55 处修改

| # | 文件路径 | 修改类型 | 行号 | 旧路径 | 新路径 | 修改数 |
|---|----------|----------|------|--------|--------|--------|
| 1 | `src/templates/agents/sdd.md.hbs` | 主入口提示词 | 25, 53-55, 149, 154-156 | `.specs/` | `specs-tree-root/` | 7 |
| 2 | `src/templates/agents/sdd-spec.md.hbs` | spec agent | 21, 31, 98 | `.specs/` | `specs-tree-root/` | 3 |
| 3 | `src/templates/agents/sdd-plan.md.hbs` | plan agent | 20, 22-23, 32, 36, 82, 108 | `.specs/` | `specs-tree-root/` | 6 |
| 4 | `src/templates/agents/sdd-tasks.md.hbs` | tasks agent | 20-23, 32-33, 37, 97, 127-128 | `.specs/` | `specs-tree-root/` | 6 |
| 5 | `src/templates/agents/sdd-build.md.hbs` | build agent | 20-23, 34, 44, 66 | `.specs/` | `specs-tree-root/` | 5 |
| 6 | `src/templates/agents/sdd-review.md.hbs` | review agent | 20-22, 41, 53, 64-66 | `.specs/` | `specs-tree-root/` | 5 |
| 7 | `src/templates/agents/sdd-validate.md.hbs` | validate agent | 20, 23, 34, 44, 82, 186 | `.specs/` | `specs-tree-root/` | 6 |
| 8 | `src/templates/agents/sdd-docs.md.hbs` | docs agent | 31, 48-50, 136-137, 140, 145, 159-161 | `.specs/` | `specs-tree-root/` | 6 |
| 9 | `src/templates/agents/sdd-roadmap.md.hbs` | roadmap agent | 35-36, 62, 75-78, 100, 102 | `.specs/` | `specs-tree-root/` | 6 |
| 10 | `src/templates/agents/sdd-help.md.hbs` | help agent | 96-98, 112 | `.specs/` | `specs-tree-root/` | 2 |
| 11 | `src/templates/subfeature-templates.ts` | 子功能模板 | 252 | `.specs/` | `specs-tree-root/` | 1 |
| **小计** | **11 个文件** | - | - | - | - | **55 处** |

**重要性**：这些文件是 **Agent 的认知来源**，决定了 Agent 如何理解目录结构。如果不更新，Agent 会继续使用旧路径生成新目录。

### D.2 核心代码文件（P1-高优先级）- 5 个文件，8 处修改

| # | 文件路径 | 修改类型 | 行号 | 旧路径 | 新路径 | 修改数 |
|---|----------|----------|------|--------|--------|--------|
| 12 | `src/state/machine.ts` | 构造函数默认参数 | 52 | `.specs` | `specs-tree-root` | 1 |
| 13 | `src/state/schema-v1.2.5.ts` | 路径常量 | 188-191 | `.specs/${feature}/` | `specs-tree-root/${feature}/` | 4 |
| 14 | `src/state/migrator.ts` | 路径拼接 | 52 | `.specs/` | `specs-tree-root/` | 1 |
| 15 | `src/utils/subfeature-manager.ts` | 路径拼接 | 246 | `.specs` | `specs-tree-root` | 1 |
| 16 | `src/index.ts` | 路径检查 | 27 | `.specs/` | `specs-tree-root/` | 1 |
| **小计** | **5 个文件** | - | - | - | - | **8 处** |

**重要性**：这些文件是 **核心运行时逻辑**，实现实际的路径处理功能。确保 Agent 在执行时使用正确的路径。

### D.3 测试文件（P2-中优先级）- 8 个文件，12+ 处修改

| # | 文件路径 | 修改类型 | 行号 | 旧路径 | 新路径 | 修改数 |
|---|----------|----------|------|--------|--------|--------|
| 17 | `src/state/schema-v1.2.5.test.ts` | 测试路径常量 | 64-67, 79, 86, 254-257 | `.specs` | `specs-tree-root` | 8 |
| 18 | `src/state/migrator.test.ts` | 测试路径常量 | 57, 73 | `.specs` | `specs-tree-root` | 2 |
| 19 | `src/utils/subfeature-manager.test.ts` | 测试路径拼接 | 237, 254 | `.specs` | `specs-tree-root` | 2 |
| 20 | `src/state/multi-feature-manager.test.ts` | 待检查 | 待确认 | 待确认 | 待确认 | 待确认 |
| 21 | `src/utils/dependency-notifier.test.ts` | 待检查 | 待确认 | 待确认 | 待确认 | 待确认 |
| 22 | `src/utils/tasks-parser.test.ts` | 待检查 | 待确认 | 待确认 | 待确认 | 待确认 |
| 23 | `src/utils/readme-generator.test.ts` | 待检查 | 待确认 | 待确认 | 待确认 | 待确认 |
| 24 | `src/templates/subfeature-templates.test.ts` | 待检查 | 待确认 | 待确认 | 待确认 | 待确认 |
| **小计** | **8 个文件** | - | - | - | - | **12+ 处** |

**重要性**：这些文件是 **测试验证层**，确保代码更新后功能正确。不影响运行时行为，但保证质量。

### D.4 修改统计汇总

| 类别 | 文件数 | 修改点数 | 优先级 | 说明 |
|------|--------|----------|--------|------|
| Agent 模板文件 | 11 | 55 | **P0-最高** | Agent 认知层，决定 Agent 如何理解目录结构 |
| 核心代码文件 | 5 | 8 | **P1-高** | 核心运行时，实现实际路径逻辑 |
| 测试文件 | 8 | 12+ | **P2-中** | 测试验证层，确保代码正确性 |
| **总计** | **24** | **75+** | - | 实际扫描 96 处，部分待确认 |

**优先级说明**：
- **P0-最高（Agent 认知层）**：模板文件是 Agent 的认知来源，必须最优先更新
- **P1-高（核心运行时）**：核心代码实现实际路径逻辑，确保运行时行为正确
- **P2-中（测试验证）**：测试文件验证代码正确性，不影响运行时行为

### D.5 修改执行顺序建议

**执行原则**：按照文件优先级分类执行，确保 Agent 认知先于运行时更新。

```
阶段 1: 更新 Agent 模板（P0-最高优先级）
├─ 目标：确保 Agent 理解新规范
├─ 文件：11 个 .hbs 模板文件
├─ 修改：55+ 处路径提示词
└─ 验证：模板语法检查，无 Handlebars 编译错误

阶段 2: 更新核心运行时（P1-高优先级）
├─ 目标：确保实际路径逻辑正确
├─ 文件：5 个 .ts 核心代码文件
├─ 修改：8 处路径常量
└─ 验证：TypeScript 编译通过，无类型错误

阶段 3: 更新测试文件（P2-中优先级）
├─ 目标：确保测试验证通过
├─ 文件：8 个 .test.ts 测试文件
├─ 修改：12+ 处测试路径
└─ 验证：所有单元测试运行通过

阶段 4: 功能验证
├─ @sdd-spec 可正常创建新 specs（自动添加 specs-tree- 前缀）
├─ @sdd-plan 可正常读取 specs
├─ @sdd-tasks 可正常生成任务
├─ @sdd-docs 可正常生成导航
└─ 无任何 Agent 报告路径错误
```

**为什么这个顺序重要**：
1. **模板优先**：如果先更新核心代码但模板未更新，Agent 仍会按旧模板生成旧路径
2. **认知统一**：确保 Agent 的"认知"（模板）和"行为"（运行时）一致
3. **验证最后**：测试文件不影响运行时，最后更新以确保验证通过

---

## 附录 E: 版本历史详细说明

### E.1 版本 1.0.0 - 初始版本
- 创建规范文档框架
- 定义目录命名问题
- 制定迁移策略

### E.2 版本 1.0.1 - 根目录名称修正
- 将根目录从 `.specs/` 修正为 `specs-tree-root/`
- 符合 TREE.md 第 14 行规范

### E.3 版本 1.0.2 - 用户决策更新
- 临时文件删除策略确认
- ROADMAP.md 迁移方案
- 已规范目录保留策略
- state.json 处理弱化（由其他 feature 负责）

### E.4 版本 1.0.3 - 临时文件处理策略修正
- 发现 `.sdd/src/` 是 SDD 插件 v1.2.11 源代码
- 修订 FR-027/028/029 从"删除"改为"检查后决定"
- 新增 OQ-006/007/008/009 开放问题

### E.5 版本 1.0.4 - 临时文件处理策略最终确认
- 用户明确 `.sdd/src/`, `.sdd/docs/`, `.sdd/tests/` 是历史遗留文件
- 新增删除前检查清单
- 更新迁移脚本执行删除
- 移除 OQ-006/007/009

### E.6 版本 1.0.5 - 核心目标突出
- 修订核心目标为"解决 Agent 目录认知问题"
- 新增 Agent 代码更新需求（FR-001 至 FR-005）
- 新增技术设计章节（6.1 Agent 代码修改点、6.2 关键代码变更示例）
- 重组功能需求章节（Agent 代码更新作为 4.1 优先级最高）
- 更新验收标准（新增 8.1 Agent 代码验收）

### E.7 版本 1.0.6 - 代码修改清单详细化
- 基于 `./src/` 全面扫描结果（96 处使用旧路径）
- 新增 4.9 Agent 代码路径更新需求（FR-035 至 FR-041）
- 新增 6.3 代码修改清单表格（25 个文件，96 处修改点）
  - 6.3.1 核心代码文件（5 个，P0）
  - 6.3.2 测试文件（8 个，P1）
  - 6.3.3 Agent 模板文件（12 个，P0）
- 细化 8.1 Agent 代码验收（4 个子章节）
  - 8.1.1 核心代码文件验收
  - 8.1.2 测试文件验收
  - 8.1.3 Agent 模板验收
  - 8.1.4 功能验证
- 新增附录 D 完整文件修改清单
  - D.1 核心代码文件（5 个）
  - D.2 测试文件（8 个）
  - D.3 Agent 模板文件（11 个）
  - D.4 修改统计汇总
  - D.5 修改执行顺序建议
- 新增附录 E 版本历史详细说明

### E.8 版本 1.0.7 - 文件优先级分类修正
- **修正文件优先级分类**：模板文件提升为 P0-最高优先级（Agent 认知层）
- **核心运行时调整**：从 P0 调整为 P1-高优先级
- **测试文件调整**：从 P1 调整为 P2-中优先级
- **更新问题陈述（1.1）**：补充 Agent 模板文件是认知来源的说明
- **更新目标章节（2.1）**：新增 G-001/G-002（P0-最高），强调模板文件核心地位
- **更新功能需求（4.9）**：重新分类优先级为 P0/P1/P2
- **更新技术设计（6.3）**：重新排序为 Agent 模板→核心运行时→测试文件
- **更新验收标准（8.1）**：调整验收顺序为模板→运行时→测试
- **更新附录 D**：重新组织 D.1/D.2/D.3 顺序，更新 D.4 统计汇总
- **更新附录 D.5**：新增执行顺序说明和重要性解释
- **更新版本历史（10）**：新增 v1.0.7 变更记录
- **新增附录 E.8**：版本 1.0.7 详细说明

---

## 附录 F: 相关文档索引

| 文档 | 路径 | 说明 |
|------|------|------|
| TREE.md | `.sdd/TREE.md` | 目录结构规范（第 14 行定义 specs-tree-root） |
| README.md | `.sdd/README.md` | SDD 工作流概述 |
| state.json | `.sdd/.specs/state.json` | 全局状态跟踪（本 feature 不处理） |
| Agent 模板 | `src/templates/agents/` | 12 个 Agent 提示词模板 |
| 核心代码 | `src/state/` | 状态管理核心代码 |
| 工具代码 | `src/utils/` | 通用工具函数 |

---

**文档结束**

*最后更新：2026-04-01 (v1.0.7)*  
*规范状态：specified*  
*下一步：运行 `@sdd-plan specs-tree-directory-optimization` 开始技术规划*
