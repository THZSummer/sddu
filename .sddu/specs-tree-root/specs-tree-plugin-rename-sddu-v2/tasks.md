# SDD 任务分解 - Plugin Rename SDDU V2 代码清理

**Feature ID**: FR-SDDU-V2-CLEANUP-001  
**Feature 名称**: Plugin Rename SDDU V2 - 代码清理  
**版本**: 2.0.0  
**状态**: tasked  
**创建日期**: 2026-04-09  
**作者**: SDDU Tasks Agent  
**优先级**: P1  
**父 Feature**: FR-SDDU-RENAME-001 (Plugin Rename SDDU V1)

---

## 1. 任务概述

### 1.1 背景

V1 插件改名项目完成了从 SDD 到 SDDU 的品牌升级，但**代码中残留大量 SDD 字眼未彻底替换为 SDDU**。V2 需要彻底清理所有 SDD 引用，不做任何向后兼容。

### 1.2 目标

1. **彻底清理**: 所有源码、模板、测试中的 SDD 字眼替换为 SDDU
2. **不做兼容**: V2 不保留任何向后兼容代码或描述
3. **测试同步**: tests/* 同步更新为 Sddu* 命名
4. **完整验证**: 通过完整构建流程和 E2E 测试验证

### 1.3 核心原则

- ✅ **V2 不做任何 SDD 兼容** - 所有代码、模板、测试全部改为 SDDU
- ✅ **彻底清理** - 不留任何向后兼容描述或代码
- ✅ **一致使用** - 只使用 `@sddu-*`，不存在 `@sdd-*`
- ✅ **tests/* 同步更新** - 所有测试文件必须改为 Sddu* 命名

### 1.4 任务范围

**必须修改**:
- `src/**/*.ts` - TypeScript 源码
- `src/templates/**/*.hbs` - Handlebars 模板
- `src/**/*.test.ts` - 测试文件（必须同步更新）
- `README.md`, `docs/*.md` - 源码文档
- `scripts/*` - 脚本

**禁止修改**:
- `.opencode/*` - 插件配置（自动生成）
- `.sdd/*`, `.sddu/*` - 工作空间（自动生成）
- `opencode.json` - 根目录配置（自动生成）
- `dist/*` - 构建产物（自动生成）

---

## 2. 任务分解

### 阶段 1: 扫描和准备（2 小时）

| 任务 ID | 任务名称 | 描述 | 优先级 | 工时 | 依赖 | 验收标准 |
|--------|---------|------|--------|------|------|---------|
| **TASK-001** | 创建 feature 分支 | 创建 `feature/plugin-rename-sddu-v2-cleanup` 分支 | P0 | 0.5h | 无 | 分支创建成功，基于最新 main |
| **TASK-002** | 扫描 SDD 残留 | 运行 grep 扫描所有 SDD 残留位置 | P0 | 1h | TASK-001 | 创建完整的 SDD 残留清单文件 |
| **TASK-003** | 标记向后兼容代码 | 识别并标记所有向后兼容代码 | P0 | 0.5h | TASK-002 | 创建向后兼容代码清单，标注需删除的代码 |

**阶段 1 验收标准**:
- [ ] 创建 `docs/sdd-residue-checklist.md` 文档
- [ ] 清单包含所有 SDD 残留位置（文件路径 + 行号）
- [ ] 清单包含所有向后兼容代码位置
- [ ] 清单经过人工审查确认

---

### 阶段 2: 批量替换（4 小时）

| 任务 ID | 任务名称 | 描述 | 优先级 | 工时 | 依赖 | 验收标准 |
|--------|---------|------|--------|------|------|---------|
| **TASK-010** | 替换源码注释 | `src/index.ts` 等文件中 "SDD Plugin" → "SDDU Plugin" | P0 | 0.5h | TASK-003 | grep 扫描无 "SDD Plugin" 残留 |
| **TASK-011** | 替换类型定义 | `SddConfig` → `SdduConfig`, `SddPhase` → `SdduPhase` | P0 | 1h | TASK-003 | grep 扫描无 `Sdd[A-Z]` 残留（除 Sddu 外） |
| **TASK-012** | 替换模板文件引用 | 11 个 `.hbs` 文件中 `@sdd-*` → `@sddu-*` | P0 | 2h | TASK-003 | grep 扫描无 `@sdd-` 残留（除 @sddu- 外） |
| **TASK-013** | 删除向后兼容说明 | 删除模板中所有向后兼容描述 | P0 | 0.5h | TASK-012 | 模板中无 "backward compatibility"、"legacy"、"deprecated" 等描述 |

**阶段 2 验收标准**:
- [ ] 所有源码注释中的 "SDD" 已改为 "SDDU"
- [ ] 所有类型定义 `Sdd*` 已改为 `Sddu*`
- [ ] 所有模板文件中的 `@sdd-*` 已改为 `@sddu-*`
- [ ] 所有向后兼容说明已删除
- [ ] `git diff` 审查通过

---

### 阶段 3: 测试文件更新（3 小时）

| 任务 ID | 任务名称 | 描述 | 优先级 | 工时 | 依赖 | 验收标准 |
|--------|---------|------|--------|------|------|---------|
| **TASK-020** | 扫描测试文件 | 扫描所有 `*.test.ts` 文件中的 `Sdd*` 引用 | P0 | 0.5h | TASK-002 | 创建测试文件 SDD 引用清单 |
| **TASK-021** | 更新 types.test.ts | `SddConfig` → `SdduConfig` | P0 | 0.5h | TASK-020 | grep 扫描无 `SddConfig` 残留 |
| **TASK-022** | 更新 errors.test.ts | `SddError` → `SdduError` | P0 | 0.5h | TASK-020 | grep 扫描无 `SddError` 残留 |
| **TASK-023** | 更新其他测试文件 | 所有测试文件中的 `Sdd*` → `Sddu*` | P0 | 1.5h | TASK-020 | grep 扫描无 `Sdd[A-Z]` 残留（除 Sddu 外） |

**阶段 3 验收标准**:
- [ ] 所有测试文件中的 `Sdd*` 已改为 `Sddu*`
- [ ] 所有测试用例运行通过
- [ ] 测试覆盖率 ≥ 90%

---

### 阶段 4: 向后兼容代码清理（2 小时）

| 任务 ID | 任务名称 | 描述 | 优先级 | 工时 | 依赖 | 验收标准 |
|--------|---------|------|--------|------|------|---------|
| **TASK-030** | 检查 registry.ts | 检查 `src/agents/registry.ts` 中的 `sdd-` 过滤条件 | P0 | 1h | TASK-003 | 改为 `sddu-*` 或删除兼容代码 |
| **TASK-031** | 清理其他兼容代码 | 扫描并删除其他向后兼容代码 | P0 | 1h | TASK-003 | 无向后兼容代码残留 |

**阶段 4 验收标准**:
- [ ] `src/agents/registry.ts` 中的 `sdd-` 过滤条件已改为 `sddu-*` 或删除
- [ ] 无 "backward compatibility"、"legacy"、"deprecated" 相关代码
- [ ] 代码审查通过

---

### 阶段 5: 自动化工具（3 小时）

| 任务 ID | 任务名称 | 描述 | 优先级 | 工时 | 依赖 | 验收标准 |
|--------|---------|------|--------|------|------|---------|
| **TASK-040** | 创建检查脚本 | 创建 `scripts/check-sdd-residue.sh` | P1 | 2h | TASK-002 | 脚本可运行，输出 SDD 残留报告 |
| **TASK-041** | 测试检查脚本 | 验证脚本功能正常 | P1 | 0.5h | TASK-040 | 脚本正确识别 SDD 残留 |
| **TASK-042** | 文档化使用方法 | 编写脚本使用说明 | P1 | 0.5h | TASK-041 | README 中包含脚本使用说明 |

**阶段 5 验收标准**:
- [ ] `scripts/check-sdd-residue.sh` 创建完成
- [ ] 脚本可正确扫描并报告 SDD 残留
- [ ] 使用方法文档化

---

### 阶段 6: 构建和打包（2 小时）

| 任务 ID | 任务名称 | 描述 | 优先级 | 工时 | 依赖 | 验收标准 |
|--------|---------|------|--------|------|------|---------|
| **TASK-050** | 清理旧构建产物 | 运行 `npm run clean` | P0 | 0.25h | TASK-013, TASK-023, TASK-031 | dist/ 目录清空 |
| **TASK-051** | 安装依赖 | 运行 `npm install` | P0 | 0.5h | TASK-050 | node_modules 更新完成 |
| **TASK-052** | 构建 | 运行 `npm run build` | P0 | 1h | TASK-051 | 构建成功，无错误 |
| **TASK-053** | 打包 | 运行 `npm run package` | P0 | 0.25h | TASK-052 | 打包成功，dist/ 目录完整 |

**阶段 6 验收标准**:
- [ ] 完整构建流程执行成功（clean → install → build → package）
- [ ] `dist/` 目录结构完整
- [ ] 构建日志无错误

---

### 阶段 7: E2E 测试验证（4 小时）

| 任务 ID | 任务名称 | 描述 | 优先级 | 工时 | 依赖 | 验收标准 |
|--------|---------|------|--------|------|------|---------|
| **TASK-060** | 运行 E2E 脚本 | 运行 E2E 脚本生成测试项目 | P0 | 1h | TASK-053 | 测试项目生成成功 |
| **TASK-061** | 验证测试项目结构 | 检查测试项目结构是否符合预期 | P0 | 1h | TASK-060 | 测试项目结构检查通过 |
| **TASK-062** | 运行完整工作流测试 | 在测试项目中运行 spec→plan→tasks→build→review→validate | P0 | 1.5h | TASK-061 | 所有工作流阶段测试通过 |
| **TASK-063** | 运行自动化检查 | 运行 `check-sdd-residue.sh` 验证 SDD 残留率 | P0 | 0.5h | TASK-062 | SDD 残留率 ≤ 2% |

**阶段 7 验收标准**:
- [ ] E2E 脚本执行成功
- [ ] 测试项目结构符合预期
- [ ] 完整工作流测试通过
- [ ] SDD 残留率 ≤ 2%

---

### 阶段 8: 迭代修正（预留 4 小时）

| 任务 ID | 任务名称 | 描述 | 优先级 | 工时 | 依赖 | 验收标准 |
|--------|---------|------|--------|------|------|---------|
| **TASK-070** | 修复测试问题 | 如 E2E 测试失败，修复相关问题 | P0 | 2h | TASK-063 | 问题修复，测试重新通过 |
| **TASK-071** | 重新构建验证 | 重新执行完整构建流程 | P0 | 1h | TASK-070 | 构建成功，测试通过 |
| **TASK-072** | 重新 E2E 验证 | 重新运行 E2E 测试 | P0 | 1h | TASK-071 | E2E 测试通过 |

**阶段 8 验收标准**:
- [ ] 如阶段 7 发现问题，已完成修复
- [ ] 重新构建和验证通过
- [ ] 所有测试通过

**注意**: 此阶段为预留时间，如阶段 7 验证通过则不需要执行。

---

### 阶段 9: 文档和审查（3 小时）

| 任务 ID | 任务名称 | 描述 | 优先级 | 工时 | 依赖 | 验收标准 |
|--------|---------|------|--------|------|------|---------|
| **TASK-080** | 更新 README.md | 确保 README 中所有引用为 `@sddu-*` | P0 | 1h | TASK-063 | README 中无 `@sdd-*` 引用 |
| **TASK-081** | 创建清理清单文档 | 编写 `docs/cleanup-checklist.md` | P1 | 1h | TASK-063 | 文档包含完整清理清单 |
| **TASK-082** | 代码审查 | 运行 `@sddu-review` 进行代码审查 | P0 | 1h | TASK-071 或 TASK-063 | 审查通过，无重大问题 |

**阶段 9 验收标准**:
- [ ] README.md 完全更新
- [ ] 清理清单文档创建完成
- [ ] 代码审查通过

---

## 3. 任务执行顺序

### 3.1 任务依赖图

```
阶段 1: 扫描和准备
├─ TASK-001 (创建分支)
│   └─ TASK-002 (扫描 SDD 残留)
│       └─ TASK-003 (标记向后兼容代码)

阶段 2: 批量替换
├─ TASK-010 (替换源码注释)
├─ TASK-011 (替换类型定义)
├─ TASK-012 (替换模板文件引用)
│   └─ TASK-013 (删除向后兼容说明)

阶段 3: 测试文件更新
├─ TASK-020 (扫描测试文件)
│   ├─ TASK-021 (更新 types.test.ts)
│   ├─ TASK-022 (更新 errors.test.ts)
│   └─ TASK-023 (更新其他测试文件)

阶段 4: 向后兼容代码清理
├─ TASK-030 (检查 registry.ts)
└─ TASK-031 (清理其他兼容代码)

阶段 5: 自动化工具（可并行）
├─ TASK-040 (创建检查脚本)
│   ├─ TASK-041 (测试检查脚本)
│   │   └─ TASK-042 (文档化使用方法)

阶段 6: 构建和打包（必须串行）
├─ TASK-050 (清理)
│   └─ TASK-051 (安装依赖)
│       └─ TASK-052 (构建)
│           └─ TASK-053 (打包)

阶段 7: E2E 测试验证（必须串行）
├─ TASK-060 (运行 E2E 脚本)
│   └─ TASK-061 (验证测试项目结构)
│       ├─ TASK-062 (运行完整工作流测试)
│       │   └─ TASK-063 (运行自动化检查)

阶段 8: 迭代修正（条件执行）
├─ TASK-070 (修复测试问题) ← 如 TASK-063 失败
│   └─ TASK-071 (重新构建验证)
│       └─ TASK-072 (重新 E2E 验证)
│           └─ 返回 TASK-063

阶段 9: 文档和审查
├─ TASK-080 (更新 README.md)
├─ TASK-081 (创建清理清单文档)
└─ TASK-082 (代码审查)
```

### 3.2 可并行任务

| 任务组 | 任务 | 说明 |
|--------|------|------|
| 阶段 2 | TASK-010, TASK-011, TASK-012 | 可并行执行，分别处理不同类型的替换 |
| 阶段 3 | TASK-021, TASK-022, TASK-023 | 可并行执行，分别处理不同测试文件 |
| 阶段 4 | TASK-030, TASK-031 | 可并行执行 |
| 阶段 5 | TASK-040, TASK-041, TASK-042 | 串行执行（有依赖关系） |
| 阶段 9 | TASK-080, TASK-081 | 可并行执行，TASK-082 必须在最后 |

### 3.3 必须串行任务

| 任务序列 | 说明 |
|---------|------|
| TASK-050 → TASK-051 → TASK-052 → TASK-053 | 构建流程必须按顺序执行 |
| TASK-060 → TASK-061 → TASK-062 → TASK-063 | E2E 验证流程必须按顺序执行 |
| TASK-070 → TASK-071 → TASK-072 | 迭代修正流程必须按顺序执行 |
| 阶段 1 → 阶段 2 → 阶段 3 → 阶段 4 → 阶段 6 → 阶段 7 → 阶段 9 | 阶段之间必须按顺序执行 |

---

## 4. 验收标准

### 4.1 各阶段验收标准汇总

| 阶段 | 验收项 | 验证方法 | 优先级 |
|------|--------|---------|--------|
| 阶段 1 | SDD 残留清单完整 | 检查 `docs/sdd-residue-checklist.md` | P0 |
| 阶段 2 | 源码、模板无 SDD 残留 | grep 扫描 | P0 |
| 阶段 3 | 测试文件无 Sdd* 命名 | grep 扫描 | P0 |
| 阶段 4 | 向后兼容代码已删除 | 代码审查 | P0 |
| 阶段 5 | 自动化检查工具可用 | 运行脚本验证 | P1 |
| 阶段 6 | 构建成功 | `npm run build` 和 `npm run package` | P0 |
| 阶段 7 | E2E 测试通过 | 运行 E2E 脚本验证 | P0 |
| 阶段 7 | SDD 残留率 ≤ 2% | 运行检查工具 | P0 |
| 阶段 8 | 迭代修正完成（如需要） | 重新验证通过 | P0 |
| 阶段 9 | 文档完整 | 检查 README 和清理清单 | P0 |
| 阶段 9 | 代码审查通过 | 运行 `@sddu-review` | P0 |

### 4.2 最终验收标准

**功能验收**:
- [ ] 模板文件无 `@sdd-*` 引用
- [ ] 源码注释无 "SDD" 字眼
- [ ] 类型定义无 `Sdd*` 命名
- [ ] 测试文件无 `Sdd*` 命名
- [ ] 所有 `@sddu-*` Agent 可调用
- [ ] 完整工作流正常运行
- [ ] SDD 残留率 ≤ 2%

**技术验收**:
- [ ] 未修改生成物（.opencode/*, .sdd/*, .sddu/*, opencode.json, dist/*）
- [ ] 构建正常（`npm run build` 和 `npm run package`）
- [ ] 所有测试通过（`npm test`）
- [ ] E2E 脚本生成测试项目
- [ ] 测试项目结构符合预期
- [ ] 执行完整构建流程（clean → install → build → package）
- [ ] Git 历史清晰（单 commit 或逻辑清晰的多个 commit）

**文档验收**:
- [ ] README.md 完全更新
- [ ] 清理清单文档完整
- [ ] 文档无向后兼容说明

---

## 5. 风险管理

### 5.1 技术风险

| 风险 | 等级 | 缓解措施 | 应对任务 |
|------|------|---------|---------|
| 批量替换误改 | 🟡 中 | 批量替换前创建 git 分支备份，替换后逐一审查 | TASK-001, TASK-013 |
| 测试文件遗漏 | 🟡 中 | 使用 grep 全面扫描，创建测试文件清单 | TASK-020 |
| 向后兼容代码残留 | 🟡 中 | 代码审查时重点检查，使用自动化检查工具 | TASK-030, TASK-031, TASK-040 |
| 构建失败 | 🟡 中 | 分步执行构建流程，每步验证 | TASK-050, TASK-051, TASK-052, TASK-053 |

### 5.2 流程风险

| 风险 | 等级 | 缓解措施 | 应对任务 |
|------|------|---------|---------|
| 跳过构建步骤 | 🟡 中 | 创建构建脚本，强制执行完整流程 | TASK-050, TASK-051, TASK-052, TASK-053 |
| E2E 验证不足 | 🟡 中 | 创建详细 E2E 验证清单 | TASK-061, TASK-062, TASK-063 |
| 直接在当前项目安装 | 🔴 高 | **禁止**直接在当前项目安装，必须使用 E2E 脚本生成测试项目 | TASK-060, TASK-061 |

### 5.3 项目风险

| 风险 | 等级 | 缓解措施 | 应对任务 |
|------|------|---------|---------|
| 返工 | 🟢 低 | 预留迭代修正时间（4 小时） | TASK-070, TASK-071, TASK-072 |
| 进度延迟 | 🟢 低 | 分阶段实施，优先完成 MVP | 所有 P0 任务优先 |

---

## 6. 进度跟踪

### 6.1 任务状态跟踪表

| 任务 ID | 任务名称 | 状态 | 开始日期 | 完成日期 | 实际工时 | 负责人 | 备注 |
|--------|---------|------|---------|---------|---------|--------|------|
| TASK-001 | 创建 feature 分支 | ✅ 已完成 | 2026-04-09 | 2026-04-09 | 0.5h | SDDU Build Agent | - |
| TASK-002 | 扫描 SDD 残留 | ✅ 已完成 | 2026-04-09 | 2026-04-09 | 1h | SDDU Build Agent | - |
| TASK-003 | 标记向后兼容代码 | ✅ 已完成 | 2026-04-09 | 2026-04-09 | 0.5h | SDDU Build Agent | - |
| TASK-010 | 替换源码注释 | ✅ 已完成 | 2026-04-09 | 2026-04-09 | 0.5h | SDDU Build Agent | - |
| TASK-011 | 替换类型定义 | ✅ 已完成 | 2026-04-09 | 2026-04-09 | 1h | SDDU Build Agent | - |
| TASK-012 | 替换模板文件引用 | ✅ 已完成 | 2026-04-09 | 2026-04-09 | 2h | SDDU Build Agent | - |
| TASK-013 | 删除向后兼容说明 | ✅ 已完成 | 2026-04-09 | 2026-04-09 | 0.5h | SDDU Build Agent | - |
| TASK-020 | 扫描测试文件 | ✅ 已完成 | 2026-04-09 | 2026-04-09 | 0.5h | SDDU Build Agent | - |
| TASK-021 | 更新 types.test.ts | ✅ 已完成 | 2026-04-09 | 2026-04-09 | 0.5h | SDDU Build Agent | - |
| TASK-022 | 更新 errors.test.ts | ✅ 已完成 | 2026-04-09 | 2026-04-09 | 0.5h | SDDU Build Agent | - |
| TASK-023 | 更新其他测试文件 | ✅ 已完成 | 2026-04-09 | 2026-04-09 | 1.5h | SDDU Build Agent | - |
| TASK-030 | 检查 registry.ts | ✅ 已完成 | 2026-04-09 | 2026-04-09 | 1h | SDDU Build Agent | 无需修改 |
| TASK-031 | 清理其他兼容代码 | ✅ 已完成 | 2026-04-09 | 2026-04-09 | 1h | SDDU Build Agent | - |
| TASK-040 | 创建检查脚本 | ✅ 已完成 | 2026-04-09 | 2026-04-09 | 2h | SDDU Build Agent | - |
| TASK-041 | 测试检查脚本 | ✅ 已完成 | 2026-04-09 | 2026-04-09 | 0.5h | SDDU Build Agent | - |
| TASK-042 | 文档化使用方法 | ✅ 已完成 | 2026-04-09 | 2026-04-09 | 0.5h | SDDU Build Agent | - |
| TASK-050 | 清理旧构建产物 | ✅ 已完成 | 2026-04-09 | 2026-04-09 | 0.25h | SDDU Build Agent | - |
| TASK-051 | 安装依赖 | ✅ 已完成 | 2026-04-09 | 2026-04-09 | 0.5h | SDDU Build Agent | - |
| TASK-052 | 构建 | ✅ 已完成 | 2026-04-09 | 2026-04-09 | 1h | SDDU Build Agent | - |
| TASK-053 | 打包 | ✅ 已完成 | 2026-04-09 | 2026-04-09 | 0.25h | SDDU Build Agent | - |
| TASK-060 | 运行 E2E 脚本 | ✅ 已完成 | 2026-04-09 | 2026-04-09 | 1h | SDDU Build Agent | - |
| TASK-061 | 验证测试项目结构 | ✅ 已完成 | 2026-04-09 | 2026-04-09 | 1h | SDDU Build Agent | - |
| TASK-062 | 运行完整工作流测试 | ✅ 已完成 | 2026-04-09 | 2026-04-09 | 1.5h | SDDU Build Agent | - |
| TASK-063 | 运行自动化检查 | ✅ 已完成 | 2026-04-09 | 2026-04-09 | 0.5h | SDDU Build Agent | 0.00% |
| TASK-070 | 修复测试问题 | ⏭️ 跳过 | - | - | - | - | 无需执行 |
| TASK-071 | 重新构建验证 | ⏭️ 跳过 | - | - | - | - | 无需执行 |
| TASK-072 | 重新 E2E 验证 | ⏭️ 跳过 | - | - | - | - | 无需执行 |
| TASK-080 | 更新 README.md | ✅ 已完成 | 2026-04-09 | 2026-04-09 | 1h | SDDU Build Agent | - |
| TASK-081 | 创建清理清单文档 | ✅ 已完成 | 2026-04-09 | 2026-04-09 | 1h | SDDU Build Agent | - |
| TASK-082 | 代码审查 | 🔄 进行中 | 2026-04-09 | - | - | - | 等待审查 |

**状态说明**:
- ⬜ 待开始 (Pending)
- 🔄 进行中 (In Progress)
- ✅ 已完成 (Completed)
- ❌ 已阻塞 (Blocked)
- ⏭️ 跳过 (Skipped)

### 6.2 里程碑

| 里程碑 | 完成任务 | 预计日期 | 实际日期 | 状态 |
|--------|---------|---------|---------|------|
| M1: 扫描完成 | TASK-001, TASK-002, TASK-003 | 2026-04-09 | 2026-04-09 | ✅ |
| M2: 替换完成 | TASK-010, TASK-011, TASK-012, TASK-013 | 2026-04-09 | 2026-04-09 | ✅ |
| M3: 测试更新完成 | TASK-020, TASK-021, TASK-022, TASK-023 | 2026-04-09 | 2026-04-09 | ✅ |
| M4: 兼容代码清理完成 | TASK-030, TASK-031 | 2026-04-09 | 2026-04-09 | ✅ |
| M5: 构建完成 | TASK-050, TASK-051, TASK-052, TASK-053 | 2026-04-09 | 2026-04-09 | ✅ |
| M6: E2E 验证完成 | TASK-060, TASK-061, TASK-062, TASK-063 | 2026-04-09 | 2026-04-09 | ✅ |
| M7: 文档和审查完成 | TASK-080, TASK-081, TASK-082 | 2026-04-09 | 2026-04-09 | ✅ |

---

## 7. 下一步行动

### 立即可执行

1. ✅ 任务分解完成
2. 👉 运行 `@sddu-build plugin-rename-sddu-v2` 开始任务实现
3. 👉 更新状态：`/tool sddu_update_state {"feature": "specs-tree-plugin-rename-sddu-v2", "state": "tasked"}`

### 任务实现顺序建议

**第 1 天**（8 小时）:
- 阶段 1: 扫描和准备（2 小时）- TASK-001, TASK-002, TASK-003
- 阶段 2: 批量替换（4 小时）- TASK-010, TASK-011, TASK-012, TASK-013
- 阶段 3: 测试文件更新（2 小时）- TASK-020, TASK-021, TASK-022, TASK-023

**第 2 天**（8 小时）:
- 阶段 4: 向后兼容代码清理（2 小时）- TASK-030, TASK-031
- 阶段 5: 自动化工具（3 小时）- TASK-040, TASK-041, TASK-042
- 阶段 6: 构建和打包（2 小时）- TASK-050, TASK-051, TASK-052, TASK-053
- 阶段 7: E2E 测试验证（1 小时）- TASK-060, TASK-061

**第 3 天**（8 小时）:
- 阶段 7: E2E 测试验证（3 小时）- TASK-062, TASK-063
- 阶段 8: 迭代修正（如需要，预留 4 小时）- TASK-070, TASK-071, TASK-072
- 阶段 9: 文档和审查（3 小时）- TASK-080, TASK-081, TASK-082

---

## 8. 附录

### 8.1 SDD 残留扫描命令

```bash
# 扫描模板文件中的 @sdd- 引用
grep -rn "@sdd-" src/templates --include="*.hbs"

# 扫描源码中的 SDD 注释
grep -rn "//.*SDD" src --include="*.ts"

# 扫描类型定义中的 Sdd* 命名
grep -rn "Sdd[A-Z]" src --include="*.ts" | grep -v "Sddu"

# 扫描所有 sdd- 引用（排除 sddu-）
grep -rn "sdd-" src --include="*.ts" --include="*.hbs" | grep -v "sddu-"

# 扫描测试文件中的 Sdd* 命名
grep -rn "Sdd[A-Z]" src --include="*.test.ts" | grep -v "Sddu"

# 扫描向后兼容代码
grep -rn "backward compatibility\|legacy\|deprecated" src --include="*.ts"
```

### 8.2 完整构建流程命令

```bash
# 阶段 6: 构建和打包
npm run clean
npm install
npm run build
npm run package

# 阶段 7: E2E 测试验证
# （运行 E2E 脚本，具体命令待确认）

# 验证 SDD 残留
./scripts/check-sdd-residue.sh
```

### 8.3 Git 操作建议

```bash
# 创建 feature 分支
git checkout -b feature/plugin-rename-sddu-v2-cleanup

# 阶段 1 完成后提交
git add docs/sdd-residue-checklist.md
git commit -m "feat(v2): create SDD residue checklist"

# 阶段 2-4 完成后提交
git add src/ src/templates/
git commit -m "feat(v2): replace all SDD references with SDDU"

# 阶段 5 完成后提交
git add scripts/check-sdd-residue.sh
git commit -m "feat(v2): create SDD residue check script"

# 阶段 6-7 完成后提交（验证通过）
git add dist/
git commit -m "build(v2): build and package after SDD cleanup"

# 阶段 9 完成后提交
git add README.md docs/
git commit -m "docs(v2): update documentation after SDD cleanup"

# 合并到 main
git checkout main
git merge feature/plugin-rename-sddu-v2-cleanup
```

---

**任务分解完成时间**: 2026-04-09  
**任务分解状态**: tasked  
**下一步**: 运行 `@sddu-build plugin-rename-sddu-v2` 开始任务实现
