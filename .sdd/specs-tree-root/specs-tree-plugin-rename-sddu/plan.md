# SDD 技术规划 - 插件改名 SDDU

**Feature ID**: FR-SDDU-RENAME-001  
**Feature 名称**: 插件改名 SDDU  
**版本**: 1.0.5  
**状态**: reviewed  
**创建日期**: 2026-04-06  
**更新日期**: 2026-04-08  
**作者**: SDD Plan Agent  

---

## 1. 规划概述

### 1.1 背景

当前插件系统使用 "SDD" (Spec-Driven Development) 品牌名称。为统一品牌标识并避免与通用 SDD 概念混淆，需要将整个插件系统改名为 "SDDU" (Spec-Driven Development Unified)。

### 1.2 目标

1. **品牌统一**: 将插件名称从 "OpenCode SDD Plugin" 改为 "OpenCode SDDU Plugin"
2. **命名一致**: 统一所有 Agent、命令、工具的命名前缀
3. **直接替换**: 移除所有旧版 SDD 引用，统一使用 SDDU
4. **文档同步**: 更新所有相关文档以反映新品牌

### 1.3 改名范围 (6 个维度)

| 维度 | 当前命名 | 目标命名 | 迁移策略 |
|------|---------|---------|---------|
| 插件名称 | OpenCode SDD Plugin | OpenCode SDDU Plugin | 直接替换 |
| 包名 (npm) | opencode-sdd-plugin | opencode-sddu-plugin | 新包发布 |
| Agent 命令 | @sdd-* | @sddu-* | 直接替换，删除旧版 |
| 工作空间目录 | .sdd/ | .sddu/ | 不做迁移支持 |
| specs-tree 目录 | specs-tree-sdd-* | specs-tree-sddu-* | 新建使用 |
| 工具/命令 | sdd_* | sddu_* | 直接替换，删除旧版 |

---

## 2. 技术架构

### 2.1 架构影响分析

**影响等级**: 低（仅命名变更，无核心逻辑修改）

**核心原则**: 配置模型驱动
```
src/config/opencode-config.ts (配置模型)
     ↓ 直接修改
自动生成 → opencode.json, .opencode/*, .sdd/*
```

**架构变更视图**:

```
┌─────────────────────────────────────────────────────────────┐
│                     用户交互层                               │
│  ┌─────────────┐                                            │
│  │  @sddu-*    │  (直接替换，无旧版兼容)                     │
│  │  (recommended)│                                          │
│  └─────────────┘                                            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Agent 定义层                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  src/config/opencode-config.ts: 配置模型定义         │    │
│  │  自动生成 → opencode.json 中的 agent 配置             │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     核心实现层                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  src/       │  │  templates/ │  │  .tool/     │         │
│  │  index.ts   │  │  agents/    │  │  sddu_*.js  │         │
│  │  config/    │  │  *.hbs      │  │             │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     配置层 (自动生成)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ opencode.json│ │ .opencode/* │ │ .sdd/       │         │
│  │ (自动生成)  │  │ (自动生成)   │ │ (自动生成)  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 数据流分析

```
改名前后数据流对比:

┌──────────────────────────────────────────────────────────────┐
│                        改名前                                │
│                                                              │
│  用户 → @sdd → opencode.json → sdd.md.hbs → 执行工作流       │
│         ↓                                                    │
│         .sdd/specs-tree-root/ → 状态管理                      │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                        改名后                                │
│                                                              │
│  用户 → @sddu → opencode.json → sddu.md.hbs → 执行工作流     │
│         (直接替换，无旧版兼容)                               │
│         ↓                                                    │
│         .sdd/ 或 .sddu/ → 状态管理 (双支持，无迁移)           │
└──────────────────────────────────────────────────────────────┘

配置文件生成流程:
src/config/opencode-config.ts (配置模型)
         ↓ 构建时自动生成
opencode.json, .opencode/*, .sdd/*
```

### 2.3 依赖关系图

```
依赖关系:

┌─────────────────────────────────────────────────────────────┐
│                    外部依赖                                  │
│  ┌─────────────┐  ┌─────────────┐                          │
│  │ npm registry│  │ OpenCode    │                          │
│  │ (发布新包)  │  │ 平台兼容    │                          │
│  └─────────────┘  └─────────────┘                          │
└─────────────────────────────────────────────────────────────┘
         │                    │
         ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                    本 Feature                                │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  FR-SDDU-RENAME-001: 插件改名 SDDU                   │    │
│  │  - 配置文件更新 (package.json, opencode.json)        │    │
│  │  - Agent 定义更新 (18 个 agent)                       │    │
│  │  - 模板文件更新 (11 个 .hbs)                          │    │
│  │  - 文档更新 (README, .sdd 文档)                       │    │
│  │  - 向后兼容层 (双名称支持)                           │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                    阻塞的 Feature                            │
│  - 所有新 Feature 应使用 @sddu-* Agent                       │
│  - FR-SDDU-* 系列功能依赖改名完成                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. 技术方案对比

### 方案 A: 直接替换（推荐）

**描述**: 直接替换所有 `@sdd-*` 为 `@sddu-*`，不保留旧名称。配置文件由配置模型 (`src/config/opencode-config.ts`) 自动生成。

**优点**:
- ✅ 配置简洁，无冗余
- ✅ 品牌统一快速完成
- ✅ 长期维护成本低
- ✅ 符合 spec v1.0.5"配置模型驱动"原则
- ✅ 内部开发人员使用，无需迁移支持

**缺点**:
- ❌ 现有用户工作流需要手动更新
- ❌ 需要用户适应新名称

**风险评估**:
- 低风险：内部开发人员使用，影响范围可控
- 低风险：技术实现简单，直接修改配置模型
- 缓解：清晰的改名对照表

**预估工作量**: 25 小时

---

### 方案 B: 双名称并存（不推荐）

**描述**: 在配置文件中同时保留新旧 Agent 定义，旧名称标记为 deprecated。

**优点**:
- ✅ 现有用户工作流不受影响
- ✅ 迁移成本低

**缺点**:
- ❌ 配置文件体积增加约 2 倍
- ❌ 需要维护双份定义
- ❌ 违背 spec v1.0.5"直接替换"原则
- ❌ 增加不必要的复杂性

**风险评估**:
- 中风险：配置冗余可能导致混淆
- 中风险：维护成本增加
- 缓解：无必要，因为是内部开发工具

**预估工作量**: 24 小时（但后续维护成本高）

---

### 方案 C: 渐进式切换（不推荐）

**描述**: 发布过渡版本，先添加新名称，再逐步废弃旧名称。

**优点**:
- ✅ 用户有充足适应时间

**缺点**:
- ❌ 发布周期长
- ❌ 需要多个版本维护
- ❌ 违背"不做无价值工作"原则
- ❌ 内部工具不需要渐进式迁移

**风险评估**:
- 低风险：逐步推进
- 高风险：版本管理复杂
- 缓解：无必要，增加工作量

**预估工作量**: 40 小时（跨多个版本，不必要）

---

## 4. 推荐方案

**推荐**: 方案 A - 直接替换

**理由**:
1. **符合 spec 原则**: spec v1.0.5 明确规定"直接替换，删除旧版"
2. **配置模型驱动**: 通过修改 `src/config/opencode-config.ts` 自动生成所有配置文件
3. **内部工具定位**: 插件仅内部开发人员使用，无需复杂迁移支持
4. **简洁优先**: 不做无价值工作，不编写迁移脚本或文档
5. **维护成本低**: 无冗余配置，长期维护简单

**实施策略**:
- 直接修改配置模型 `src/config/opencode-config.ts`
- 直接修改源码 `src/` 下的文件
- 直接修改根目录配置 `package.json`、`README.md`
- 生成产物 (`opencode.json`、`.opencode/*`、`.sdd/*`) 由配置模型自动生成
- 不保留旧名称，不做向后兼容

---

## 5. 文件影响分析

### 5.1 核心原则：配置模型驱动

**修改策略**:
```
src/config/opencode-config.ts (配置模型)
     ↓ 直接修改
自动生成 → opencode.json, .opencode/*, .sdd/*
```

**分类说明**:

| 类别 | 路径 | 修改策略 | 说明 |
|------|------|----------|------|
| 配置模型 | `src/config/*` | ✅ 直接修改 | 自动生成配置文件 |
| 源码 | `src/*` | ✅ 直接修改 | 核心实现代码 |
| 根目录配置 | `package.json`, `README.md` | ✅ 直接修改 | 源码文档和配置 |
| 生成产物 | `.opencode/*` | ❌ 不修改 | 由配置模型自动生成 |
| 生成产物 | `.sdd/*` | ❌ 不修改 | 由配置模型自动生成 |
| 生成产物 | `opencode.json` | ❌ 不修改 | 由配置模型自动生成 |

---

### 5.2 必须修改 (P0) - 配置模型和源码

| 操作 | 文件路径 | 变更说明 |
|------|---------|---------|
| MODIFY | `/package.json` | name, description, scripts, keywords, files |
| MODIFY | `/src/config/opencode-config.ts` | plugin 引用，18 个 agent 定义 (配置模型) |
| MODIFY | `/src/index.ts` | 导出常量名，日志服务名 |
| MODIFY | `/src/agents/sdd-agents.ts` | → 重命名为 `sddu-agents.ts` |
| RENAME | `/src/templates/agents/sdd.md.hbs` | → `sddu.md.hbs` |
| RENAME | `/src/templates/agents/sdd-help.md.hbs` | → `sddu-help.md.hbs` |
| RENAME | `/src/templates/agents/sdd-discovery.md.hbs` | → `sddu-discovery.md.hbs` |
| RENAME | `/src/templates/agents/sdd-spec.md.hbs` | → `sddu-spec.md.hbs` |
| RENAME | `/src/templates/agents/sdd-plan.md.hbs` | → `sddu-plan.md.hbs` |
| RENAME | `/src/templates/agents/sdd-tasks.md.hbs` | → `sddu-tasks.md.hbs` |
| RENAME | `/src/templates/agents/sdd-build.md.hbs` | → `sddu-build.md.hbs` |
| RENAME | `/src/templates/agents/sdd-review.md.hbs` | → `sddu-review.md.hbs` |
| RENAME | `/src/templates/agents/sdd-validate.md.hbs` | → `sddu-validate.md.hbs` |
| RENAME | `/src/templates/agents/sdd-docs.md.hbs` | → `sddu-docs.md.hbs` |
| RENAME | `/src/templates/agents/sdd-roadmap.md.hbs` | → `sddu-roadmap.md.hbs` |
| MODIFY | `/src/templates/config/opencode.json.hbs` | **插件名引用更新**（文件名不变） |
| MODIFY | `/README.md` | 标题，Agent 引用，目录结构 |
| MODIFY | `/src/errors.ts` | 错误前缀，类名前缀 |

**注意**: `opencode.json`、`.opencode/*`、`.sdd/*` 由配置模型自动生成，不列入修改范围。

---

### 5.3 建议修改 (P1) - 其他源码和脚本

| 操作 | 文件路径 | 变更说明 |
|------|---------|---------|
| CREATE | `/.tool/sddu_update_state.js` | 新工具名 |
| DELETE | `/.tool/sdd_update_state.js` | 删除旧工具 |
| MODIFY | `/install.sh` | 输出信息 |
| MODIFY | `/install.ps1` | 输出信息 |
| MODIFY | `/scripts/package.cjs` | 打包脚本中的目录引用 |
| MODIFY | `/docs/containerization-faq.md` | FAQ 中的品牌引用 |

**注意**: `.sdd/README.md`、`.sdd/TREE.md`、`.sdd/ROADMAP.md` 由配置模型自动生成，不列入修改范围。

---

### 5.4 可选修改 (P2)

| 操作 | 文件路径 | 变更说明 |
|------|---------|---------|
| SKIP | `/CHANGELOG.md` | 保留历史（可选） |
| SKIP | `/RELEASE-NOTES.md` | 保留历史（可选） |
| SKIP | `/src/agents/sdd-agents.ts` | 旧文件删除后不保留 |
| SKIP | `/src/templates/agents/sdd*.hbs` | 旧模板删除后不保留 |
| UPDATE | `/tests/**/*.test.ts` | 测试描述文本（逐步更新） |

---

## 6. 架构决策记录 (ADR)

本次规划产生 3 个架构决策，详见 `decisions/` 目录：

| ADR 编号 | 决策主题 | 状态 | 文件 |
|---------|---------|------|------|
| ADR-015 | 直接替换策略（无向后兼容） | PROPOSED | `decisions/ADR-015.md` |
| ADR-016 | 配置模型驱动生成 | PROPOSED | `decisions/ADR-016.md` |
| ADR-017 | 无迁移脚本策略 | PROPOSED | `decisions/ADR-017.md` |

**决策说明**:
- **ADR-015**: 基于 spec v1.0.5"无向后兼容性要求"，采用直接替换策略
- **ADR-016**: 配置文件由 `src/config/opencode-config.ts` 配置模型自动生成
- **ADR-017**: 内部开发人员工具，不编写迁移脚本或文档

---

## 7. 风险评估与缓解

### 7.1 技术风险

| 风险 | 等级 | 描述 | 缓解措施 |
|------|------|------|---------|
| 配置模型错误 | 🟡 中 | 配置模型定义错误导致生成产物异常 | 构建后验证生成的配置文件 |
| 构建产物不一致 | 🟡 中 | dist 目录路径错误 | 更新打包脚本，CI 验证 |
| Git 历史断裂 | 🟡 中 | 文件改名丢失历史 | 使用 `git mv`，单 commit 完成 |
| 测试覆盖不足 | 🟡 中 | 改名后功能未验证 | 完整工作流测试，覆盖率≥90% |

### 7.2 用户风险

| 风险 | 等级 | 描述 | 缓解措施 |
|------|------|------|---------|
| 学习成本 | 🟢 低 | 内部开发人员需适应新名称 | 改名对照表，Help Agent 说明 |
| 旧调用失效 | 🟢 低 | `@sdd-*` 调用失败 | 清晰的错误提示，引导使用新名称 |

### 7.3 项目风险

| 风险 | 等级 | 描述 | 缓解措施 |
|------|------|------|---------|
| 回滚需求 | 🟢 低 | 改名后发现问题 | 保留 Git 历史，可快速回滚 |

---

## 8. 实施计划

### 8.1 实施策略

**核心原则**: 配置模型驱动，直接替换

```
阶段：一次性替换
├─ 修改配置模型 src/config/opencode-config.ts
├─ 修改源代码 src/ 下的文件
├─ 修改根目录配置 package.json、README.md
├─ 构建自动生成 opencode.json、.opencode/*、.sdd/*
└─ 清理旧文件（旧 agent 源码、旧模板、旧工具）
```

**不做的工作**:
- ❌ 不编写迁移脚本（内部工具，无价值）
- ❌ 不编写迁移文档（内部开发人员自行了解）
- ❌ 不保留向后兼容（spec 规定直接替换）
- ❌ 不修改生成产物（由配置模型自动生成）

### 8.2 工作量估算

| 任务类别 | 预估工时 | 负责人 | 优先级 |
|---------|---------|--------|--------|
| 配置模型修改 | 3 小时 | Build Agent | P0 |
| 源代码修改 | 4 小时 | Build Agent | P0 |
| 模板文件修改 | 3.5 小时 | Build Agent | P0 |
| 文档更新 | 4 小时 | Docs Agent | P0/P1 |
| 脚本更新 | 1 小时 | Build Agent | P1 |
| 旧文件清理 | 1 小时 | Build Agent | P1 |
| 测试更新 | 3 小时 | Validate Agent | P1 |
| 测试验证 | 4 小时 | Validate Agent | P0 |
| **总计** | **23.5 小时** | - | - |

### 8.3 任务分解

详细任务分解请运行 `@sddu-tasks 插件改名 SDDU` 生成。

---

## 9. 验收标准

### 9.1 功能验收

| ID | 验收项 | 验证方法 | 优先级 |
|----|--------|---------|--------|
| AC-001 | 新插件包可安装 | `npm install opencode-sddu-plugin` | P0 |
| AC-002 | 所有 18 个 `@sddu-*` Agent 可调用 | 逐一测试每个 Agent | P0 |
| AC-004 | 完整工作流正常运行 | spec→plan→tasks→build→review→validate | P0 |
| AC-005 | 状态更新工具正常工作 | `/tool sddu_update_state` | P0 |
| AC-006 | 目录导航生成正常 | `@sddu-docs` 生成正确导航 | P1 |

### 9.2 文档验收

| ID | 验收项 | 验证方法 | 优先级 |
|----|--------|---------|--------|
| AC-101 | README.md 完全更新 | 检查标题、Agent 引用、目录结构 | P0 |
| AC-102 | 所有 Agent 描述更新 | 检查 `src/config/opencode-config.ts` 中的 agent 定义 | P0 |
| AC-103 | 无迁移指南 | 确认未创建 migration-guide.md | P1 |

### 9.3 技术验收

| ID | 验收项 | 验证方法 | 优先级 |
|----|--------|---------|--------|
| AC-201 | 所有测试通过 | `npm test` | P0 |
| AC-202 | 构建产物正确 | 检查 dist/sddu/ 目录结构 | P0 |
| AC-203 | 安装包结构正确 | 安装后验证文件完整性 | P0 |
| AC-204 | Git 历史清晰 | 使用 git mv 保持历史 | P1 |
| AC-205 | 测试覆盖率 ≥ 90% | 检查 coverage 报告 | P1 |

**验收原则**:

| 验收类别 | 是否验收 | 说明 |
|----------|----------|------|
| 源码修改 (`src/`) | ✅ 验收 | 直接修改的源码文件 |
| 功能行为 | ✅ 验收 | Agent 是否正常工作 |
| 配置模型 (`src/config/*`) | ✅ 验收 | 配置模型源码 |
| 生成产物 (`.opencode/*`) | ❌ 不验收 | 由配置模型自动生成 |
| 生成产物 (`.sdd/*`) | ❌ 不验收 | 由配置模型自动生成 |
| 生成产物 (`opencode.json`) | ❌ 不验收 | 由配置模型自动生成 |

---

## 10. 开放问题

| ID | 问题 | 状态 | 决策 |
|----|------|------|------|
| OQ-001 | 是否强制改名 `.sdd/` 目录？ | 已决策 | 不强制，双支持 |
| OQ-002 | 旧包何时 deprecated？ | 待决策 | 由项目负责人决定 |
| OQ-003 | 是否需要自动迁移脚本？ | 已决策 | 不需要（内部工具） |
| OQ-004 | specs-tree 现有目录改名？ | 已决策 | 保留原名 |

---

## 11. 下一步行动

### 立即可执行

1. ✅ 技术规划完成
2. 👉 运行 `@sddu-tasks 插件改名 SDDU` 开始任务分解
3. 👉 更新状态：`/tool sddu_update_state {"feature": "specs-tree-plugin-rename-sddu", "state": "planned"}`

### 任务分解后

4. 运行 `@sddu-build` 开始实施
5. 运行 `@sddu-review` 进行代码审查
6. 运行 `@sddu-validate` 进行验收验证

---

## 附录

### A. 改名对照表

| 类别 | 旧名称 | 新名称 | 备注 |
|------|--------|--------|------|
| 插件名 | OpenCode SDD Plugin | OpenCode SDDU Plugin | 直接替换 |
| 包名 | opencode-sdd-plugin | opencode-sddu-plugin | 直接替换 |
| Agent 前缀 | @sdd-* | @sddu-* | 直接替换，删除旧版 |
| 工作目录 | .sdd/ | .sddu/ | 不做迁移支持 |
| 工具前缀 | sdd_* | sddu_* | 直接替换，删除旧版 |
| 错误前缀 | [SDD- | [SDDU- | 直接替换 |
| 类前缀 | Sdd* | Sddu* | 直接替换 |
| 文件修改策略 | 修改配置文件 | 直接修改配置模型 | 配置模型自动生成所有配置文件 |

**目录策略说明**:
- `.sdd/` 目录保持不变，继续有效
- 新 Feature 默认使用 `.sddu/` 目录
- 不提供迁移脚本或迁移文档
- 仅内部开发人员使用，不做无价值工作

### B. 关键路径汇总

**核心原则**: 直接修改配置模型 (`src/config/opencode-config.ts`) 和源码，生成产物自动生成

```
配置模型 (直接修改):
- /src/config/opencode-config.ts

源码 (直接修改):
- /src/index.ts
- /src/agents/sdd-agents.ts → sddu-agents.ts
- /src/errors.ts
- /src/templates/agents/*.hbs (11 个文件)
- /src/templates/config/opencode.json.hbs (内容更新)

根目录配置 (直接修改):
- /package.json
- /README.md
- /docs/containerization-faq.md

安装/打包脚本 (直接修改):
- /install.sh
- /install.ps1
- /scripts/package.cjs

工具:
- /.tool/sdd_update_state.js (删除)
- /.tool/sddu_update_state.js (新建)

**说明**: 生成产物 (`opencode.json`、`.opencode/*`、`.sdd/*`) 由配置模型自动生成，不列入修改范围。
```

---

**规划完成时间**: 2026-04-06  
**规划更新时间**: 2026-04-08  
**规划状态**: planned  
**下一步**: 运行 `@sddu-tasks 插件改名 SDDU` 开始任务分解

---

## 版本历史

| 版本 | 日期 | 作者 | 变更说明 |
|------|------|------|---------|
| 1.0.6 | 2026-04-08 | Plan Agent | 纳入遗漏的 `src/templates/config/opencode.json.hbs` 模板文件，更新文件影响分析和工作量估算 |
| 1.0.5 | 2026-04-08 | Plan Agent | 更新以符合 spec v1.0.5：移除生成产物修改项，采用配置模型驱动原则 |
| 1.0.0 | 2026-04-06 | SDD Plan Agent | 初始版本 |
