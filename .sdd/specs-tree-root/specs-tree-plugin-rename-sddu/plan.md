# SDD 技术规划 - 插件改名 SDDU

**Feature ID**: FR-SDDU-RENAME-001  
**Feature 名称**: 插件改名 SDDU  
**版本**: 1.0.0  
**状态**: reviewed  
**创建日期**: 2026-04-06  
**作者**: SDD Plan Agent  

---

## 1. 规划概述

### 1.1 背景

当前插件系统使用 "SDD" (Spec-Driven Development) 品牌名称。为统一品牌标识并避免与通用 SDD 概念混淆，需要将整个插件系统改名为 "SDDU" (Spec-Driven Development Unified)。

### 1.2 目标

1. **品牌统一**: 将插件名称从 "OpenCode SDD Plugin" 改为 "OpenCode SDDU Plugin"
2. **命名一致**: 统一所有 Agent、命令、工具的命名前缀
3. **平滑迁移**: 提供向后兼容层，确保现有用户无感迁移
4. **文档同步**: 更新所有相关文档以反映新品牌

### 1.3 改名范围 (6 个维度)

| 维度 | 当前命名 | 目标命名 | 迁移策略 |
|------|---------|---------|---------|
| 插件名称 | OpenCode SDD Plugin | OpenCode SDDU Plugin | 直接替换 |
| 包名 (npm) | opencode-sdd-plugin | opencode-sddu-plugin | 新包发布 |
| Agent 命令 | @sdd-* | @sddu-* | 双名称并存 |
| 工作空间目录 | .sdd/ | .sddu/ | 可选迁移 |
| specs-tree 目录 | specs-tree-sdd-* | specs-tree-sddu-* | 新建使用 |
| 工具/命令 | sdd_* | sddu_* | 双名称并存 |

---

## 2. 技术架构

### 2.1 架构影响分析

**影响等级**: 低（仅命名变更，无核心逻辑修改）

```
架构变更视图:

┌─────────────────────────────────────────────────────────────┐
│                     用户交互层                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  @sdd-*     │  │  @sddu-*    │  │  两者共存   │         │
│  │ (deprecated)│  │  (recommended)│ │  (兼容层)   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Agent 定义层                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  opencode.json: 双 agent 定义指向同一 prompt 文件     │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     核心实现层                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  src/       │  │  templates/ │  │  .tool/     │         │
│  │  index.ts   │  │  agents/    │  │  sddu_*.js  │         │
│  │  agents/    │  │  *.hbs      │  │             │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     配置层                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ package.json│  │ opencode.json│ │ .sdd/       │         │
│  │ (新包名)    │  │ (双 agent)   │ │ (可选迁移)  │         │
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
│  用户 → @sddu ─┬→ opencode.json → sddu.md.hbs → 执行工作流   │
│         ↓      │                                            │
│         @sdd ──┘ (deprecated，指向同一文件)                  │
│         ↓                                                    │
│         .sdd/ 或 .sddu/ → 状态管理 (双支持)                   │
└──────────────────────────────────────────────────────────────┘
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

### 方案 A: 双名称并存（推荐）

**描述**: 在配置文件中同时保留新旧 Agent 定义，旧名称标记为 deprecated，指向相同的实现文件。

**优点**:
- ✅ 现有用户工作流不受影响
- ✅ 迁移成本低，用户可逐步适应
- ✅ 降低采用门槛
- ✅ 可观察新旧名称使用情况

**缺点**:
- ❌ 配置文件体积增加约 2 倍
- ❌ 需要维护双份定义
- ❌ 可能造成用户困惑（哪个是正确的）

**风险评估**:
- 低风险：技术实现简单
- 中风险：用户可能需要时间适应
- 缓解：清晰的文档和 deprecated 警告

**预估工作量**: 24 小时

---

### 方案 B: 硬切换（不推荐）

**描述**: 直接替换所有 `@sdd-*` 为 `@sddu-*`，不保留旧名称。

**优点**:
- ✅ 配置简洁，无冗余
- ✅ 品牌统一快速完成
- ✅ 长期维护成本低

**缺点**:
- ❌ 现有用户工作流立即断裂
- ❌ 用户抵触情绪高
- ❌ 需要紧急发布补丁风险高

**风险评估**:
- 高风险：用户流失风险
- 高风险：紧急回滚需求
- 缓解：需要提前通知和迁移工具

**预估工作量**: 16 小时（但后续支持成本高）

---

### 方案 C: 渐进式切换（备选）

**描述**: 发布过渡版本，先添加新名称，再逐步废弃旧名称。

**优点**:
- ✅ 用户有充足适应时间
- ✅ 可收集使用数据指导决策
- ✅ 降低单次变更风险

**缺点**:
- ❌ 发布周期长
- ❌ 需要多个版本维护
- ❌ 文档需要多次更新

**风险评估**:
- 低风险：逐步推进
- 中风险：版本管理复杂
- 缓解：明确的版本路线图

**预估工作量**: 40 小时（跨多个版本）

---

## 4. 推荐方案

**推荐**: 方案 A - 双名称并存

**理由**:
1. **用户体验优先**: 现有用户（特别是企业内部用户）工作流不受影响
2. **技术风险低**: 实现简单，只需在配置文件中添加双份定义
3. **可回滚**: 如发现问题可快速回退
4. **符合语义化版本**: 在 v1.x 内保持兼容，v2.0 再移除旧名称
5. **数据驱动**: 可通过日志观察新旧名称使用比例，指导后续决策

**实施策略**:
- 当前版本 (v1.x): 双名称并存，旧名称标记 deprecated
- 下一版本 (v1.y): 文档默认使用新名称，旧名称有警告
- 大版本 (v2.0): 移除旧名称支持

---

## 5. 文件影响分析

### 5.1 必须修改 (P0)

| 操作 | 文件路径 | 变更说明 |
|------|---------|---------|
| MODIFY | `/package.json` | name, description, scripts, keywords, files |
| MODIFY | `/opencode.json` | plugin 引用，18 个 agent 定义 |
| MODIFY | `/.opencode/plugins/sdd/opencode.json` | plugin 配置，agent 定义 |
| MODIFY | `/.opencode/plugins/sdd/package.json` | 插件包配置 |
| MODIFY | `/src/index.ts` | 导出常量名，日志服务名 |
| MODIFY | `/src/agents/sdd-agents.ts` | agent 注册（或新建 sddu-agents.ts） |
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
| MODIFY | `/README.md` | 标题，Agent 引用，目录结构 |

### 5.2 建议修改 (P1)

| 操作 | 文件路径 | 变更说明 |
|------|---------|---------|
| MODIFY | `/src/errors.ts` | 错误前缀，类名前缀 |
| CREATE | `/.tool/sddu_update_state.js` | 新工具名（保留旧文件） |
| MODIFY | `/install.sh` | 输出信息 |
| MODIFY | `/install.ps1` | 输出信息 |
| MODIFY | `/build-agents.cjs` | Agent 生成脚本 |
| MODIFY | `/scripts/package.cjs` | 打包脚本中的目录引用 |
| MODIFY | `/.sdd/README.md` | 工作空间说明 |
| MODIFY | `/.sdd/TREE.md` | 目录结构规范定义 |
| MODIFY | `/.sdd/ROADMAP.md` | 版本历史，品牌名称 |
| MODIFY | `/docs/migration-guide.md` | 迁移指南内容 |
| MODIFY | `/docs/containerization-faq.md` | FAQ 中的品牌引用 |

### 5.3 可选修改 (P2)

| 操作 | 文件路径 | 变更说明 |
|------|---------|---------|
| SKIP | `/CHANGELOG.md` | 保留历史（可选） |
| SKIP | `/RELEASE-NOTES.md` | 保留历史（可选） |
| SKIP | `/.sdd/specs-tree-root/specs-tree-sdd-*/` | 现有 Feature 目录保留 |
| UPDATE | `/tests/**/*.test.ts` | 测试描述文本（逐步更新） |

---

## 6. 架构决策记录 (ADR)

本次规划产生 5 个架构决策，详见 `decisions/` 目录：

| ADR 编号 | 决策主题 | 状态 | 文件 |
|---------|---------|------|------|
| ADR-015 | 向后兼容策略 | PROPOSED | `decisions/ADR-015.md` |
| ADR-016 | Agent 命令别名机制 | PROPOSED | `decisions/ADR-016.md` |
| ADR-017 | 目录改名策略 | PROPOSED | `decisions/ADR-017.md` |
| ADR-018 | 配置文件更新方案 | PROPOSED | `decisions/ADR-018.md` |
| ADR-019 | 迁移脚本设计 | PROPOSED | `decisions/ADR-019.md` |

---

## 7. 风险评估与缓解

### 7.1 技术风险

| 风险 | 等级 | 描述 | 缓解措施 |
|------|------|------|---------|
| 向后兼容断裂 | 🔴 高 | 旧 Agent 名称失效 | 双名称并存，旧名称标记 deprecated |
| 构建产物不一致 | 🟡 中 | dist 目录路径错误 | 更新打包脚本，CI 验证 |
| Git 历史断裂 | 🟡 中 | 文件改名丢失历史 | 使用 `git mv`，单 commit 完成 |
| 测试覆盖不足 | 🟡 中 | 改名后功能未验证 | 完整工作流测试，覆盖率≥90% |

### 7.2 用户风险

| 风险 | 等级 | 描述 | 缓解措施 |
|------|------|------|---------|
| 学习成本 | 🟢 低 | 用户需要适应新名称 | 改名对照表，Help Agent 说明 |
| 文档混淆 | 🟡 中 | 新旧文档并存 | 统一更新，旧文档添加提示 |
| 迁移困难 | 🟢 低 | 用户不知如何迁移 | 迁移指南，自动迁移脚本 |

### 7.3 项目风险

| 风险 | 等级 | 描述 | 缓解措施 |
|------|------|------|---------|
| 依赖项目断裂 | 🟡 中 | 其他项目依赖旧包名 | npm 保留旧包，发布迁移公告 |
| 回滚困难 | 🟢 低 | 改名后发现问题 | 保留旧包最后版本，回滚指南 |

---

## 8. 实施计划

### 8.1 三阶段实施策略

```
阶段 1: 双名称并存 (当前版本 v1.x)
├─ 修改核心配置文件 (package.json, opencode.json)
├─ 更新 Agent 定义 (双份定义)
├─ 更新模板文件 (重命名 + 内容更新)
├─ 更新文档 (README, .sdd 文档)
└─ 保持向后兼容 (旧名称仍可用)

阶段 2: 迁移支持 (下 1-2 个版本 v1.y)
├─ 发布迁移指南文档
├─ 提供自动迁移脚本
├─ 旧名称添加明显警告
├─ 文档默认使用新名称
└─ 收集使用数据

阶段 3: 清理旧名称 (大版本 v2.0)
├─ 提前 2 周发出移除警告
├─ 移除旧 Agent 定义
├─ 移除旧工具别名
└─ 更新所有文档移除旧引用
```

### 8.2 工作量估算

| 任务类别 | 预估工时 | 负责人 | 优先级 |
|---------|---------|--------|--------|
| 配置文件修改 | 2 小时 | Build Agent | P0 |
| 源代码修改 | 4 小时 | Build Agent | P0 |
| 模板文件修改 | 3 小时 | Build Agent | P0 |
| 文档更新 | 4 小时 | Docs Agent | P0/P1 |
| 脚本更新 | 2 小时 | Build Agent | P1 |
| 向后兼容层 | 2 小时 | Plan Agent | P0 |
| 测试更新 | 3 小时 | Validate Agent | P1 |
| 测试验证 | 4 小时 | Validate Agent | P0 |
| **总计** | **24 小时** | - | - |

### 8.3 任务分解

详细任务分解请运行 `@sddu-tasks 插件改名 SDDU` 生成。

---

## 9. 验收标准

### 9.1 功能验收

| ID | 验收项 | 验证方法 | 优先级 |
|----|--------|---------|--------|
| AC-001 | 新插件包可安装 | `npm install opencode-sddu-plugin` | P0 |
| AC-002 | 所有 18 个 `@sddu-*` Agent 可调用 | 逐一测试每个 Agent | P0 |
| AC-003 | 旧 `@sdd-*` Agent 仍可调用 | 逐一测试旧 Agent | P0 |
| AC-004 | 完整工作流正常运行 | spec→plan→tasks→build→review→validate | P0 |
| AC-005 | 状态更新工具正常工作 | `/tool sddu_update_state` | P0 |
| AC-006 | 目录导航生成正常 | `@sddu-docs` 生成正确导航 | P1 |

### 9.2 文档验收

| ID | 验收项 | 验证方法 | 优先级 |
|----|--------|---------|--------|
| AC-101 | README.md 完全更新 | 检查标题、Agent 引用、目录结构 | P0 |
| AC-102 | 所有 Agent 描述更新 | 检查 opencode.json 中的描述 | P0 |
| AC-103 | 迁移指南发布 | 检查 docs/migration-guide.md | P1 |
| AC-104 | Help Agent 说明新旧映射 | 调用 @sddu-help 验证 | P1 |

### 9.3 技术验收

| ID | 验收项 | 验证方法 | 优先级 |
|----|--------|---------|--------|
| AC-201 | 所有测试通过 | `npm test` | P0 |
| AC-202 | 构建产物正确 | 检查 dist/sddu/ 目录结构 | P0 |
| AC-203 | 安装包结构正确 | 安装后验证文件完整性 | P0 |
| AC-204 | Git 历史清晰 | 使用 git mv 保持历史 | P1 |
| AC-205 | 测试覆盖率 ≥ 90% | 检查 coverage 报告 | P1 |

---

## 10. 开放问题

| ID | 问题 | 状态 | 决策 |
|----|------|------|------|
| OQ-001 | 是否强制改名 `.sdd/` 目录？ | 已决策 | 不强制，双支持 |
| OQ-002 | 旧包何时 deprecated？ | 待决策 | v2.0 时 deprecated |
| OQ-003 | 是否需要自动迁移脚本？ | 已决策 | 建议有，P1 优先级 |
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
| 插件名 | OpenCode SDD Plugin | OpenCode SDDU Plugin | 必须 |
| 包名 | opencode-sdd-plugin | opencode-sddu-plugin | 必须 |
| Agent 前缀 | @sdd-* | @sddu-* | 双支持 |
| 工作目录 | .sdd/ | .sddu/ | 可选 |
| 工具前缀 | sdd_* | sddu_* | 双支持 |
| 错误前缀 | [SDD- | [SDDU- | 建议 |
| 类前缀 | Sdd* | Sddu* | 建议 |

### B. 关键路径汇总

```
核心配置:
- /package.json
- /opencode.json
- /.opencode/plugins/sdd/opencode.json

核心代码:
- /src/index.ts
- /src/agents/sdd-agents.ts
- /src/errors.ts

模板文件 (11 个):
- /src/templates/agents/sdd*.hbs → sddu*.hbs

文档:
- /README.md
- /.sdd/README.md
- /.sdd/TREE.md
- /.sdd/ROADMAP.md

脚本:
- /install.sh
- /install.ps1
- /build-agents.cjs
- /scripts/package.cjs

工具:
- /.tool/sdd_update_state.js (保留)
- /.tool/sddu_update_state.js (新建)
```

---

**规划完成时间**: 2026-04-06  
**规划状态**: planned  
**下一步**: 运行 `@sddu-tasks 插件改名 SDDU` 开始任务分解
