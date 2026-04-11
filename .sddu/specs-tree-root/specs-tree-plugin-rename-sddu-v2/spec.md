# SDD Spec 规范 - Plugin Rename SDDU V2 代码清理

**Feature ID**: FR-SDDU-V2-CLEANUP-001  
**Feature 名称**: Plugin Rename SDDU V2 - 代码清理  
**版本**: 2.0.0  
**状态**: specified  
**创建日期**: 2026-04-09  
**作者**: SDDU Spec Agent  
**优先级**: P1  
**父 Feature**: FR-SDDU-RENAME-001 (Plugin Rename SDDU V1)

---

## 1. 规范概述

### 1.1 背景

V1 插件改名项目（FR-SDDU-RENAME-001）完成了从 SDD 到 SDDU 的品牌升级，但**代码中残留大量 SDD 字眼未彻底替换为 SDDU**。经过实际扫描发现：
- 模板文件中有 47+ 处 `@sdd-*` 引用
- 源码注释中有 "SDD Plugin" 描述
- 类型定义中仍有 `SddConfig`、`SddPhase` 等命名

### 1.2 目标

1. **彻底清理**: 所有源码中的 SDD 字眼替换为 SDDU（除向后兼容层）
2. **品牌一致**: 确保代码、模板、文档 100% 使用 SDDU 品牌
3. **降低混淆**: 避免新开发人员被 SDD/SDDU 混合命名搞混
4. **维护简化**: 统一命名减少认知负担

### 1.3 核心原则：修改源码，不修改生成物

**文件修改策略**:
```
src/ (源码 - 直接修改)
     ↓ 构建/安装时自动生成
.opencode/*, .sdd/*, .sddu/*, opencode.json (生成物 - ❌ 不修改)
dist/* (构建产物 - ❌ 不修改)
```

**分类说明**:

| 类别 | 路径 | 修改策略 | 示例 |
|------|------|----------|------|
| 源码 | `src/**/*.ts` | ✅ 直接修改 | `src/index.ts`, `src/types.ts` |
| 模板 | `src/templates/**/*.hbs` | ✅ 直接修改 | `src/templates/agents/*.hbs` |
| 配置模型 | `src/config/*.ts` | ✅ 直接修改 | `src/config/opencode-config.ts` |
| 文档 | `README.md`, `docs/*.md` | ✅ 直接修改 | 源码文档 |
| 脚本 | `install.sh`, `scripts/*` | ✅ 直接修改 | 安装和打包脚本 |
| 插件配置 | `.opencode/*` | ❌ 禁止修改 | 安装时自动生成 |
| 工作空间 | `.sdd/*`, `.sddu/*` | ❌ 禁止修改 | 运行时自动生成 |
| 根目录配置 | `opencode.json` | ❌ 禁止修改 | 安装时自动生成 |
| 构建产物 | `dist/*` | ❌ 禁止修改 | 构建时自动生成 |

**正确做法**:
- ✅ 直接修改 `src/config/opencode-config.ts` 配置模型
- ✅ 修改后运行完整构建流程：
  ```bash
  npm run clean
  npm install
  npm run build
  npm run package
  ```
- ✅ 运行 E2E 脚本生成测试项目验证
- ✅ 如不符合预期，重新修改源码并执行完整流程
- ✅ 直到测试项目符合预期后再继续

**错误做法**:
- ❌ 直接编辑 `opencode.json`
- ❌ 直接编辑 `.sdd/*` 或 `.sddu/*`
- ❌ 直接编辑 `.opencode/*`
- ❌ 直接编辑 `dist/*`
- ❌ **直接给当前项目安装未经测试的插件**（会严重影响后续工作）
- ❌ 手动创建测试项目（应使用 E2E 脚本自动生成）
- ❌ 跳过 `npm run clean` 或 `npm run package` 步骤

### 1.4 清理范围

| 类别 | 当前命名 | 目标命名 | 示例 |
|------|---------|---------|------|
| 模板引用 | `@sdd-*` | `@sddu-*` | `@sdd-spec` → `@sddu-spec` |
| 源码注释 | `SDD Plugin` | `SDDU Plugin` | `// SDD Plugin for OpenCode` |
| 类型定义 | `Sdd*` | `Sddu*` | `SddConfig` → `SdduConfig` |
| 错误类 | `SddError` | `SdduError` | 类名和实例 |
| 相位类型 | `SddPhase` | `SdduPhase` | 状态机类型 |
| 测试文件 | `Sdd*` | `Sddu*` | `SddConfig` → `SdduConfig` |
| **向后兼容** | **保留** | **删除** | **V2 不做任何兼容** |

**核心原则**:
- ✅ **V2 不做任何 SDD 兼容** - 所有代码、模板、测试全部改为 SDDU
- ✅ **彻底清理** - 不留任何向后兼容描述或代码
- ✅ **一致使用** - 只使用 `@sddu-*`，不存在 `@sdd-*`

### 1.5 成功标准

- [ ] 模板文件中 `@sdd-*` 引用从 47+ 个降至 0 个
- [ ] 源码注释中 "SDD" 字眼从 20+ 处降至 0 处
- [ ] 类型定义中 `Sdd*` 从 10+ 个降至 0 个（除向后兼容层）
- [ ] SDD 残留清理率 ≥ 98%
- [ ] 完整工作流测试通过（spec→plan→tasks→build→review→validate）

---

## 2. 功能需求

### FR-001: 模板文件清理

**描述**: 清理所有 Handlebars 模板文件中的 `@sdd-*` 引用

**验收标准**:
- [ ] `src/templates/agents/sddu-help.md.hbs` - 18 处 `@sdd-*` 改为 `@sddu-*`
- [ ] `src/templates/agents/sddu.md.hbs` - 4 处 `@sdd-*` 改为 `@sddu-*`
- [ ] `src/templates/agents/sddu-tasks.md.hbs` - 8 处 `@sdd-*` 改为 `@sddu-*`
- [ ] `src/templates/agents/sddu-build.md.hbs` - 6 处 `@sdd-*` 改为 `@sddu-*`
- [ ] `src/templates/agents/sddu-discovery.md.hbs` - 4 处 `@sdd-*` 改为 `@sddu-*`
- [ ] `src/templates/agents/sddu-roadmap.md.hbs` - 2 处 `@sdd-*` 改为 `@sddu-*`
- [ ] `src/templates/agents/sddu-docs.md.hbs` - 3 处 `@sdd-*` 改为 `@sddu-*`
- [ ] `src/templates/agents/sddu-spec.md.hbs` - 检查并清理
- [ ] `src/templates/agents/sddu-plan.md.hbs` - 检查并清理
- [ ] `src/templates/agents/sddu-review.md.hbs` - 检查并清理
- [ ] `src/templates/agents/sddu-validate.md.hbs` - 检查并清理

**相关文件**:
- `src/templates/agents/*.hbs` (11 个文件)

**修改说明**:
- 将 `@sdd-*` 直接替换为 `@sddu-*`
- **删除所有向后兼容说明** - V2 不做兼容
- 模板中不要出现 "也可使用 `@sdd-*`" 或类似描述

---

### FR-002: 源码注释清理

**描述**: 清理所有 TypeScript 源码文件中的 "SDD" 注释

**验收标准**:
- [ ] `src/index.ts` - 第 1 行 `// SDD Plugin for OpenCode` 改为 `// SDDU Plugin for OpenCode`
- [ ] 扫描所有 `src/**/*.ts` 文件，确保无 "SDD Plugin"、"SDD tool" 等描述
- [ ] 保留必要的历史说明（如 CHANGELOG 相关注释）

**相关文件**:
- `src/index.ts`
- `src/**/*.ts` (所有 TypeScript 源码)

**扫描命令**:
```bash
grep -r "SDD Plugin" src --include="*.ts"
grep -r "//.*SDD" src --include="*.ts"
```

---

### FR-003: 类型定义清理

**描述**: 清理所有 TypeScript 类型定义中的 `Sdd*` 前缀

**验收标准**:
- [ ] `src/types.ts` - `export interface SddConfig` 改为 `export interface SdduConfig`
- [ ] `src/state/machine.ts` - `export type SddPhase` 改为 `export type SdduPhase`
- [ ] 所有使用 `SddConfig` 的地方改为 `SdduConfig`
- [ ] 所有使用 `SddPhase` 的地方改为 `SdduPhase`
- [ ] 更新所有引用这些类型的文件

**相关文件**:
- `src/types.ts` - 类型定义
- `src/state/machine.ts` - 状态机定义
- `src/**/*.ts` - 所有引用这些类型的文件

**影响分析**:
- `SddConfig` → `SdduConfig`: 预计影响 5-10 个文件
- `SddPhase` → `SdduPhase`: 预计影响 3-5 个文件

---

### FR-004: 错误类清理

**描述**: 清理所有错误处理相关的 `Sdd*` 命名

**验收标准**:
- [ ] `src/errors.ts` - `SddError` 改为 `SdduError`（如仍存在）
- [ ] 所有错误实例创建改为使用新类名
- [ ] 错误处理逻辑保持不变

**相关文件**:
- `src/errors.ts`
- `src/errors.test.ts` (测试文件)

---

### FR-005: 测试文件更新（必须）

**描述**: 更新测试文件中的类型引用为 SDDU 命名

**验收标准**:
- [ ] `src/types.test.ts` - `SddConfig` 改为 `SdduConfig`
- [ ] `src/errors.test.ts` - `SddError` 改为 `SdduError`
- [ ] 所有测试文件中的 `Sdd*` 引用改为 `Sddu*`
- [ ] 所有测试用例正常运行
- [ ] 测试覆盖率 ≥ 90%

**说明**: V2 不做任何向后兼容，测试文件必须同步更新为新命名。

**相关文件**:
- `src/**/*.test.ts` - 所有测试文件
- `tests/**/*.ts` - E2E 测试文件

---

### FR-006: 自动化检查工具

**描述**: 创建脚本自动检测 SDD 残留

**验收标准**:
- [ ] 创建 `scripts/check-sdd-residue.sh` 或类似脚本
- [ ] 扫描 `src/` 目录下所有 `sdd`（不区分大小写）引用
- [ ] 输出详细的残留位置和数量
- [ ] 可集成到 CI/CD 流程中

**脚本示例**:
```bash
#!/bin/bash
# scripts/check-sdd-residue.sh

echo "=== SDD Residue Check ==="
echo ""

# 扫描源码中的 SDD 引用（排除测试文件和向后兼容层）
echo "Source code residue:"
grep -rn "sdd-" src --include="*.ts" --exclude="*.test.ts" | grep -v "sddu-" | grep -v "// backward compatibility"

echo ""
echo "Template residue:"
grep -rn "@sdd-" src/templates --include="*.hbs"

echo ""
echo "Type definition residue:"
grep -rn "Sdd[A-Z]" src --include="*.ts" | grep -v "Sddu"

echo ""
echo "Check complete."
```

---

### FR-007: 文档更新

**描述**: 更新源码文档中的品牌引用

**验收标准**:
- [ ] `README.md` - 确保所有引用为 `@sddu-*`
- [ ] `docs/*.md` - 检查并更新相关文档
- [ ] 移除或更新向后兼容说明

**相关文件**:
- `README.md`
- `docs/*.md`

---

## 3. 非功能需求

### NFR-001: 不修改生成物

**描述**: 严禁直接修改自动生成的文件

**要求**:
- ❌ 不直接编辑 `.opencode/*`
- ❌ 不直接编辑 `.sdd/*` 或 `.sddu/*`
- ❌ 不直接编辑 `opencode.json`
- ❌ 不直接编辑 `dist/*`

**验证方法**:
- 代码审查时检查修改文件列表
- CI 流程中添加生成物修改检测

---

### NFR-002: 功能完整性

**描述**: 清理后所有功能应正常工作

**要求**:
- 所有 18 个 `@sddu-*` Agent 可正常调用
- 完整工作流（spec→plan→tasks→build→review→validate）正常运行
- 状态管理工具正常工作
- 目录导航生成正常

**验证方法**:
- 运行完整工作流端到端测试
- 逐一测试每个 Agent

---

### NFR-003: 测试覆盖率

**描述**: 确保清理后测试覆盖率不下降

**要求**:
- 单元测试覆盖率 ≥ 90%
- 所有现有测试用例通过
- 新增自动化检查工具的测试

**验证方法**:
- 运行 `npm test` 验证覆盖率报告
- 检查测试通过率

---

### NFR-004: 性能要求

**描述**: 清理不应影响插件性能

**要求**:
- Agent 响应时间无显著变化
- 文件扫描速度无显著变化
- 构建时间无显著增加

**验证方法**:
- 对比清理前后的性能指标
- 性能回归测试

---

## 4. 验收标准

### 4.1 功能验收

| ID | 验收项 | 验证方法 | 优先级 | 状态 |
|----|--------|---------|--------|------|
| AC-001 | 模板文件无 `@sdd-*` 引用 | grep 扫描 | P0 | ⬜ |
| AC-002 | 源码注释无 "SDD" 字眼 | grep 扫描 | P0 | ⬜ |
| AC-003 | 类型定义无 `Sdd*` 命名 | grep 扫描 | P0 | ⬜ |
| AC-004 | 所有 `@sddu-*` Agent 可调用 | 逐一测试 | P0 | ⬜ |
| AC-005 | 完整工作流正常运行 | 端到端测试 | P0 | ⬜ |
| AC-006 | 自动化检查工具可用 | 运行检查脚本 | P1 | ⬜ |
| AC-007 | 测试覆盖率 ≥ 90% | `npm test` | P1 | ⬜ |

### 4.2 文档验收

| ID | 验收项 | 验证方法 | 优先级 | 状态 |
|----|--------|---------|--------|------|
| AC-101 | README.md 完全更新 | 检查 Agent 引用 | P0 | ⬜ |
| AC-102 | 文档无向后兼容说明 | 检查 `docs/*.md` | P1 | ⬜ |
| AC-103 | 清理清单文档完整 | 检查修改文件列表 | P1 | ⬜ |

### 4.3 技术验收

| ID | 验收项 | 验证方法 | 优先级 | 状态 |
|----|--------|---------|--------|------|
| AC-201 | 未修改生成物 | 检查 git diff | P0 | ⬜ |
| AC-202 | 构建正常 | `npm run build` | P0 | ⬜ |
| AC-203 | 所有测试通过 | `npm test` | P0 | ⬜ |
| AC-204 | SDD 残留率 ≤ 2% | 运行检查工具 | P0 | ⬜ |
| AC-205 | Git 历史清晰 | 单 commit 完成 | P1 | ⬜ |
| **AC-206** | **E2E 脚本生成测试项目** | **运行 E2E 脚本验证** | **P0** | ⬜ |
| **AC-207** | **测试项目结构符合预期** | **检查测试项目结构** | **P0** | ⬜ |
| **AC-208** | **未直接在当前项目安装** | **检查安装记录** | **P0** | ⬜ |

### 4.4 验收原则

| 验收类别 | 是否验收 | 说明 |
|----------|----------|------|
| 源码修改 (`src/`) | ✅ 验收 | 直接修改的源码文件 |
| 模板修改 (`src/templates/`) | ✅ 验收 | 直接修改的模板文件 |
| 功能行为 | ✅ 验收 | Agent 是否正常工作 |
| 生成物 (`.opencode/*`) | ❌ 不验收 | 由安装自动生成 |
| 生成物 (`.sdd/*`, `.sddu/*`) | ❌ 不验收 | 由工作流自动生成 |
| 生成物 (`opencode.json`) | ❌ 不验收 | 由安装自动生成 |
| 构建产物 (`dist/*`) | ❌ 不验收 | 由构建自动生成 |

---

## 5. 依赖关系

### 5.1 前置依赖

| Feature | 依赖类型 | 说明 |
|---------|---------|------|
| FR-SDDU-RENAME-001 (V1) | 强依赖 | V1 完成品牌升级框架，V2 在此基础上清理 |

### 5.2 阻塞关系

| Feature | 阻塞类型 | 说明 |
|---------|---------|------|
| 所有新 Feature | 无阻塞 | V2 清理不影响新功能开发 |
| V3 功能 | 无阻塞 | 可在 V2 完成后使用更干净的代码库 |

### 5.3 外部依赖

| 依赖 | 类型 | 说明 |
|------|------|------|
| npm | 构建 | `npm run build` 重新生成构建产物 |
| OpenCode 平台 | 兼容 | 确保 Agent 定义格式兼容 |

---

## 6. 技术设计

### 6.1 实施策略

**核心原则**: 修改源码，不修改生成物

```
阶段 1: 扫描和清单
├─ 运行 grep 扫描所有 SDD 残留
├─ 创建详细的修改清单
└─ 标记哪些是向后兼容层（不应修改）

阶段 2: 批量替换
├─ 使用 sed/ripgrep 批量替换
├─ 逐一验证每个文件的修改
└─ 确保无遗漏

阶段 3: 手动检查和修正
├─ 审查自动替换的结果
├─ 修正特殊情况
└─ 更新测试文件（可选）

阶段 4: 验证
├─ 运行完整工作流测试
├─ 运行自动化检查工具
└─ 验证 SDD 残留率 ≤ 2%

阶段 5: 构建和打包
├─ 运行 npm run clean
├─ 运行 npm install
├─ 运行 npm run build
├─ 运行 npm run package
└─ 验证构建产物正确生成

阶段 6: E2E 测试验证
├─ 运行 E2E 脚本生成测试项目
├─ 验证测试项目结构符合预期
└─ 在生成的测试项目中运行完整测试

阶段 7: 迭代修正（如需要）
├─ 如不符合预期，修改源码
├─ 重新执行完整构建流程
└─ 重新验证直到符合预期

阶段 8: 文档和审查
├─ 更新 README.md
├─ 创建清理清单文档
└─ 代码审查
```

### 6.2 文件修改清单

**P0 - 必须修改**:

| 文件 | 修改内容 | 预计修改行数 |
|------|---------|-------------|
| `src/index.ts` | 注释 "SDD Plugin" → "SDDU Plugin" | 1 行 |
| `src/types.ts` | `SddConfig` → `SdduConfig` | 5-10 行 |
| `src/state/machine.ts` | `SddPhase` → `SdduPhase` | 3-5 行 |
| `src/templates/agents/sddu-help.md.hbs` | 18 处 `@sdd-*` → `@sddu-*` | 18 行 |
| `src/templates/agents/sddu.md.hbs` | 4 处 `@sdd-*` → `@sddu-*` | 4 行 |
| `src/templates/agents/sddu-tasks.md.hbs` | 8 处 `@sdd-*` → `@sddu-*` | 8 行 |
| `src/templates/agents/sddu-build.md.hbs` | 6 处 `@sdd-*` → `@sddu-*` | 6 行 |
| `src/templates/agents/sddu-discovery.md.hbs` | 4 处 `@sdd-*` → `@sddu-*` | 4 行 |
| `src/templates/agents/sddu-roadmap.md.hbs` | 2 处 `@sdd-*` → `@sddu-*` | 2 行 |
| `src/templates/agents/sddu-docs.md.hbs` | 3 处 `@sdd-*` → `@sddu-*` | 3 行 |

**P1 - 建议修改**:

| 文件 | 修改内容 | 说明 |
|------|---------|------|
| `scripts/check-sdd-residue.sh` | 新建 | 自动化检查工具 |
| `README.md` | 更新引用 | 确保一致性 |
| `src/types.test.ts` | `SddConfig` → `SdduConfig` | 测试文件（可选） |
| `src/errors.test.ts` | `SddError` → `SdduError` | 测试文件（可选） |

### 6.3 批量替换命令

**安全替换步骤**:

```bash
# 1. 创建备份
git checkout -b feature/plugin-rename-sddu-v2-cleanup

# 2. 扫描并保存结果
grep -rn "sdd-" src --include="*.ts" --include="*.hbs" > /tmp/sdd-residue-before.txt

# 3. 批量替换模板文件中的 @sdd- 为 @sddu-
# 注意：只替换向后兼容说明中的引用，不是整个文件名
find src/templates -name "*.hbs" -exec sed -i 's/`@sdd-\([^u]\)`/`@sddu-\1`/g' {} \;

# 4. 替换类型定义
sed -i 's/SddConfig/SdduConfig/g' src/types.ts
sed -i 's/SddPhase/SdduPhase/g' src/state/machine.ts

# 5. 替换源码注释
sed -i 's/SDD Plugin/SDDU Plugin/g' src/index.ts

# 6. 验证修改
grep -rn "sdd-" src --include="*.ts" --include="*.hbs" > /tmp/sdd-residue-after.txt

# 7. 对比前后结果
diff /tmp/sdd-residue-before.txt /tmp/sdd-residue-after.txt
```

**注意**: 批量替换后需要手动审查，确保：
- 没有误改向后兼容层代码
- 文件名本身包含 "sdd" 的没有被错误修改
- 测试文件根据需求决定是否修改

### 6.4 自动化检查工具设计

**脚本功能**:
1. 扫描 `src/` 目录下所有 SDD 残留
2. 分类报告（模板、源码、类型定义）
3. 输出残留数量和位置
4. 可设置阈值（如 ≤ 2% 为通过）
5. 可集成到 CI/CD

**脚本位置**: `scripts/check-sdd-residue.sh`

**CI 集成**:
```yaml
# .github/workflows/check-sdd-residue.yml
jobs:
  check-sdd-residue:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build
        run: npm run build
      - name: Check SDD Residue
        run: ./scripts/check-sdd-residue.sh
```

---

## 7. 边界情况

### EC-001: 向后兼容层代码

**场景**: V1 中可能存在向后兼容层代码

**处理**:
- ❌ **V2 不保留向后兼容层** - 所有 `sdd-` 引用改为 `sddu-*`
- ✅ **彻底清理** - 删除所有向后兼容描述和代码
- ✅ **在代码审查时重点检查** - 确保无遗漏的向后兼容代码

**识别方法**:
- 查找注释中包含 "backward compatibility"、"legacy"、"deprecated" 的代码
- 检查 `src/agents/registry.ts` 中的 agent 过滤逻辑
- 如有向后兼容代码，**必须删除或改为 sddu**

---

### EC-002: 测试文件中的 SDD 引用

**场景**: 测试文件中使用 `SddConfig` 等类型

**处理**:
- ✅ **必须更新为新命名** - `SddConfig` → `SdduConfig`, `SddError` → `SdduError`
- ✅ **不保留向后兼容测试** - V2 不做任何 SDD 兼容
- ✅ **tests/* 同步更新** - 所有测试文件统一改为 SDDU 命名

**修改清单**:
- `src/types.test.ts` - `SddConfig` → `SdduConfig`
- `src/errors.test.ts` - `SddError` → `SdduError`
- 其他测试文件中所有 `Sdd*` 引用 → `Sddu*`

---

### EC-003: 文件名本身包含 "sdd"

**场景**: 文件名如 `sddu-agents.ts` 包含 "sdd" 但不是 "sdd-" 前缀

**处理**:
- 使用精确匹配，避免误改
- 使用正则表达式 `@sdd-` 而非简单字符串 `sdd`
- 手动审查批量替换结果

---

### EC-004: 模板文件名包含 "sddu"

**场景**: 模板文件 `sddu-help.md.hbs` 文件名正确，但内容包含 `@sdd-*`

**处理**:
- 文件名不需要修改
- 只修改文件内容中的引用
- 确保替换命令不会影响文件名

---

### EC-005: 生成物被意外修改

**场景**: 开发人员不小心直接修改了 `opencode.json` 或 `.sdd/*`

**处理**:
- 在代码审查时检查修改文件列表
- 如发现生成物被修改，要求重新通过源码修改
- CI 流程中添加生成物修改检测

---

### EC-006: 直接在当前项目安装未经测试的插件（高危！）

**场景**: 开发人员构建完成后，直接在当前项目运行 `npm link` 或 `npm install` 安装新插件

**风险**:
- ⚠️ **未经充分测试的插件可能破坏现有工作流**
- ⚠️ **可能导致正在进行的工作丢失或损坏**
- ⚠️ **可能污染当前项目的 `.sdd/` 工作空间**

**处理**:
- ✅ **必须**使用 E2E 脚本生成测试项目验证
- ✅ **必须**运行完整测试套件确认无问题
- ✅ **必须**经过代码审查和验收
- ✅ 确认无问题后，再通过正式流程部署
- ❌ **禁止**直接在当前项目安装未经测试的插件
- ❌ **禁止**手动创建测试项目（应使用 E2E 脚本自动生成）

**正确验证流程**:
1. 运行 `npm run build` 构建
2. 运行 E2E 脚本生成测试项目
3. 在生成的测试项目中验证
4. 确认测试项目结构符合预期

---

### EC-007: 批量替换误改重要代码

**场景**: 使用 sed/ripgrep 批量替换时误改了不应修改的代码

**处理**:
- 批量替换前创建 git 分支备份
- 替换后逐一审查修改结果
- 使用 `git diff` 检查所有修改
- 发现误改立即恢复

---

## 8. 实施计划

### 8.1 实施清单

**阶段 1: 扫描和准备 (2 小时)**:
- [ ] 创建 feature 分支
- [ ] 运行全面扫描，创建修改清单
- [ ] 标记向后兼容层代码
- [ ] 备份当前状态

**阶段 2: 批量替换 (4 小时)**:
- [ ] 替换模板文件中的 `@sdd-*` 为 `@sddu-*`
- [ ] 替换类型定义 `SddConfig` → `SdduConfig`
- [ ] 替换类型定义 `SddPhase` → `SdduPhase`
- [ ] 替换源码注释中的 "SDD Plugin"
- [ ] 手动审查替换结果

**阶段 3: 测试文件更新 (2 小时)**:
- [ ] 决定是否更新测试文件
- [ ] 如更新，替换测试文件中的类型引用
- [ ] 运行测试确保正常

**阶段 4: 自动化工具 (3 小时)**:
- [ ] 创建 `scripts/check-sdd-residue.sh`
- [ ] 测试脚本功能
- [ ] 文档化使用方法
- [ ] 可选：集成到 CI

**阶段 5: 构建和打包 (4 小时)**:
- [ ] 运行 `npm run clean` 清理旧构建产物
- [ ] 运行 `npm install` 安装依赖
- [ ] 运行 `npm run build` 重新构建
- [ ] 运行 `npm run package` 打包
- [ ] 验证构建产物正确生成
- [ ] 检查 `dist/` 目录结构完整

**阶段 6: E2E 测试验证 (4 小时)**:
- [ ] 运行 E2E 脚本生成测试项目
- [ ] 验证测试项目结构符合预期
- [ ] 在生成的测试项目中运行完整工作流测试
- [ ] 运行自动化检查工具
- [ ] 验证 SDD 残留率 ≤ 2%

**阶段 7: 迭代修正（如需要）**:
- [ ] 如测试项目不符合预期，返回阶段 5 修改源码
- [ ] 重新执行完整构建流程
- [ ] 重新运行 E2E 脚本验证
- [ ] 直到测试项目符合预期

**阶段 8: 文档和审查 (3 小时)**:
- [ ] 更新 `README.md`
- [ ] 创建清理清单文档
- [ ] 代码审查
- [ ] 修复审查发现的问题

**总计**: 约 20 小时（2-3 个工作日）

### 8.2 工作量估算

| 任务类别 | 预估工时 | 负责人 | 优先级 |
|---------|---------|--------|--------|
| 扫描和准备 | 2 小时 | Build Agent | P0 |
| 批量替换 | 4 小时 | Build Agent | P0 |
| 测试文件更新 | 2 小时 | Validate Agent | P1 |
| 自动化工具 | 3 小时 | Build Agent | P1 |
| 构建 | 2 小时 | Build Agent | P0 |
| **E2E 测试验证** | **4 小时** | Validate Agent | **P0** |
| 文档和审查 | 3 小时 | Docs Agent | P1 |
| **总计** | **20 小时** | - | - |

---

## 9. 开放问题

| ID | 问题 | 状态 | 决策 |
|----|------|------|------|
| OQ-001 | 测试文件是否更新为新命名？ | **已决策** | **必须更新** - tests/* 同步更新为 `SdduConfig`、`SdduError` |
| OQ-002 | 向后兼容层代码是否保留 `sdd-` 引用？ | **已决策** | **不保留** - V2 不做任何 SDD 兼容，彻底清理为 `sddu-*` |
| OQ-003 | 自动化检查工具是否集成到 CI？ | 待决策 | 可选，建议 V2 完成后集成 |
| OQ-004 | 清理完成后是否立即发布新版本？ | 待决策 | 由项目负责人决定 |

**核心原则**：
- ✅ **V2 不做任何 SDD 兼容** - 所有代码、模板、测试全部改为 SDDU
- ✅ **彻底清理** - 不留任何向后兼容描述或代码
- ✅ **一致使用** - 只使用 `@sddu-*`，不存在 `@sdd-*`

---

## 10. 版本历史

| 版本 | 日期 | 作者 | 变更说明 |
|------|------|------|---------|
| 1.0.0 | 2026-04-09 | SDDU Spec Agent | 初始版本 |

---

## 附录

### A. SDD 残留扫描命令汇总

```bash
# 扫描模板文件中的 @sdd- 引用
grep -rn "@sdd-" src/templates --include="*.hbs"

# 扫描源码中的 SDD 注释
grep -rn "//.*SDD" src --include="*.ts"

# 扫描类型定义中的 Sdd* 命名
grep -rn "Sdd[A-Z]" src --include="*.ts" | grep -v "Sddu"

# 扫描所有 sdd- 引用（排除 sddu-）
grep -rn "sdd-" src --include="*.ts" --include="*.hbs" | grep -v "sddu-"

# 扫描生成物（验证是否被意外修改）
grep -rn "sdd-" .opencode --include="*.json"
grep -rn "sdd-" .sdd --include="*.md"
grep -rn "sdd-" opencode.json
```

### B. 完整文件修改清单

**高优先级（必须修改）**:
1. `src/index.ts`
2. `src/types.ts`
3. `src/state/machine.ts`
4. `src/templates/agents/sddu-help.md.hbs`
5. `src/templates/agents/sddu.md.hbs`
6. `src/templates/agents/sddu-tasks.md.hbs`
7. `src/templates/agents/sddu-build.md.hbs`
8. `src/templates/agents/sddu-discovery.md.hbs`
9. `src/templates/agents/sddu-roadmap.md.hbs`
10. `src/templates/agents/sddu-docs.md.hbs`

**中优先级（建议修改）**:
11. `scripts/check-sdd-residue.sh` (新建)
12. `README.md`
13. `src/types.test.ts` (可选)
14. `src/errors.test.ts` (可选)

**低优先级（检查）**:
- `src/agents/registry.ts` - 检查是否有 `sdd-` 过滤条件
- 其他 `src/templates/agents/*.hbs` 文件

### C. 验收检查清单

```markdown
## 验收检查清单

### 代码清理
- [ ] 模板文件无 `@sdd-*` 引用（除向后兼容层）
- [ ] 源码注释无 "SDD Plugin" 等描述
- [ ] 类型定义无 `SddConfig`、`SddPhase` 等命名
- [ ] SDD 残留率 ≤ 2%

### 功能验证
- [ ] 所有 18 个 `@sddu-*` Agent 可调用
- [ ] 完整工作流正常运行
- [ ] 状态管理工具正常工作
- [ ] 目录导航生成正常

### 技术验证
- [ ] 未修改生成物（.opencode/*, .sdd/*, .sddu/*, opencode.json, dist/*）
- [ ] 构建正常 (`npm run build`)
- [ ] 所有测试通过 (`npm test`)
- [ ] 测试覆盖率 ≥ 90%

### 文档
- [ ] README.md 完全更新
- [ ] 清理清单文档完整
- [ ] 自动化检查工具文档化
```

---

**规范完成时间**: 2026-04-09  
**规范状态**: specified  
**下一步**: 运行 `@sddu-plan plugin-rename-sddu-v2` 开始技术规划
