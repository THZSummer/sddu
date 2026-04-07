# SDD Spec 规范 - 插件改名 SDDU

**Feature ID**: FR-SDDU-RENAME-001  
**Feature 名称**: 插件改名 SDDU  
**版本**: 1.0.0  
**状态**: reviewed  
**创建日期**: 2026-04-06  
**作者**: SDD Spec Agent  
**优先级**: P0  

---

## 1. 规范概述

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

### 1.4 成功标准

- [ ] 新插件包 `opencode-sddu-plugin` 可正常安装和使用
- [ ] 所有 18 个 Agent (`@sddu-*`) 可正常调用
- [ ] 旧 Agent 名称 (`@sdd-*`) 仍可工作（向后兼容）
- [ ] 完整工作流 (spec→plan→tasks→build→review→validate) 正常运行
- [ ] 所有文档更新完成
- [ ] 测试覆盖率 ≥ 90%

---

## 2. 功能需求

### FR-001: 插件名称更新

**描述**: 更新插件的品牌名称和包名

**验收标准**:
- [ ] `package.json` 中 `name` 字段改为 `opencode-sddu-plugin`
- [ ] `package.json` 中 `description` 字段更新为 "Specification-Driven Development Unified plugin..."
- [ ] `package.json` 中 `keywords` 包含 `sddu`
- [ ] `package.json` 中 `files` 字段指向 `dist/sddu/**/*`
- [ ] 插件安装后显示 "OpenCode SDDU Plugin"

**相关文件**:
- `/package.json`
- `/.opencode/plugins/sdd/package.json`
- `/dist/sdd/package.json`

---

### FR-002: 包名更新

**描述**: 更新 npm 包名和相关脚本命令

**验收标准**:
- [ ] npm 包名从 `opencode-sdd-plugin` 改为 `opencode-sddu-plugin`
- [ ] 所有 npm scripts 中的命令名从 `sdd-*` 改为 `sddu-*`
- [ ] 保持向后兼容：旧的 `sdd-*` 脚本仍可运行
- [ ] `package-lock.json` 正确反映新包名

**脚本改名清单**:

| 旧脚本名 | 新脚本名 |
|---------|---------|
| `sdd-spec` | `sddu-spec` |
| `sdd-plan` | `sddu-plan` |
| `sdd-tasks` | `sddu-tasks` |
| `sdd-build` | `sddu-build` |
| `sdd-review` | `sddu-review` |
| `sdd-validate` | `sddu-validate` |
| `sdd-migrate-schema` | `sddu-migrate-schema` |

**相关文件**:
- `/package.json` (scripts 字段)

---

### FR-003: Agent 命令更新

**描述**: 更新所有 Agent 的定义和命名

**验收标准**:
- [ ] 18 个 Agent 全部更新为 `@sddu-*` 前缀
- [ ] 旧 Agent 名称 `@sdd-*` 仍然可用（标记为 deprecated）
- [ ] 所有 Agent 指向正确的 prompt 模板文件
- [ ] Agent 描述中包含新旧名称映射说明

**Agent 改名清单**:

| 旧 Agent | 新 Agent | 描述 |
|---------|---------|------|
| `@sdd` | `@sddu` | Master Coordinator |
| `@sdd-help` | `@sddu-help` | Help Assistant |
| `@sdd-0-discovery` | `@sddu-0-discovery` | 需求挖掘专家 |
| `@sdd-discovery` | `@sddu-discovery` | 需求挖掘 (短名) |
| `@sdd-1-spec` | `@sddu-1-spec` | 规范编写专家 |
| `@sdd-spec` | `@sddu-spec` | 规范编写 (短名) |
| `@sdd-2-plan` | `@sddu-2-plan` | 技术规划专家 |
| `@sdd-plan` | `@sddu-plan` | 技术规划 (短名) |
| `@sdd-3-tasks` | `@sddu-3-tasks` | 任务分解专家 |
| `@sdd-tasks` | `@sddu-tasks` | 任务分解 (短名) |
| `@sdd-4-build` | `@sddu-4-build` | 任务实现专家 |
| `@sdd-build` | `@sddu-build` | 任务实现 (短名) |
| `@sdd-5-review` | `@sddu-5-review` | 代码审查专家 |
| `@sdd-review` | `@sddu-review` | 代码审查 (短名) |
| `@sdd-6-validate` | `@sddu-6-validate` | 验证专家 |
| `@sdd-validate` | `@sddu-validate` | 验证 (短名) |
| `@sdd-docs` | `@sddu-docs` | 目录导航生成器 |
| `@sdd-roadmap` | `@sddu-roadmap` | Roadmap 规划专家 |

**相关文件**:
- `/opencode.json`
- `/.opencode/plugins/sdd/opencode.json`
- `/src/agents/sdd-agents.ts` → `/src/agents/sddu-agents.ts`

---

### FR-004: 配置文件更新

**描述**: 更新所有配置文件中的命名引用

**验收标准**:
- [ ] 所有 `opencode.json` 中的 plugin 引用更新
- [ ] Agent prompt 模板文件名更新
- [ ] 模板内容中的 `@sdd-*` 引用更新
- [ ] 错误处理类名前缀更新
- [ ] 日志服务名更新

**配置文件清单**:

| 文件 | 变更内容 |
|------|---------|
| `/opencode.json` | plugin 引用、18 个 agent 定义 |
| `/.opencode/plugins/sdd/opencode.json` | plugin 引用、agent 定义 |
| `/src/index.ts` | 导出常量 `SDDUPlugin`、日志名 `sddu-plugin` |
| `/src/errors.ts` | 错误前缀 `[SDDU-`、类前缀 `SdduError` |
| `/src/templates/agents/*.hbs` | 11 个模板文件名和内容 |

**模板文件改名**:

| 旧文件名 | 新文件名 |
|---------|---------|
| `sdd.md.hbs` | `sddu.md.hbs` |
| `sdd-help.md.hbs` | `sddu-help.md.hbs` |
| `sdd-discovery.md.hbs` | `sddu-discovery.md.hbs` |
| `sdd-spec.md.hbs` | `sddu-spec.md.hbs` |
| `sdd-plan.md.hbs` | `sddu-plan.md.hbs` |
| `sdd-tasks.md.hbs` | `sddu-tasks.md.hbs` |
| `sdd-build.md.hbs` | `sddu-build.md.hbs` |
| `sdd-review.md.hbs` | `sddu-review.md.hbs` |
| `sdd-validate.md.hbs` | `sddu-validate.md.hbs` |
| `sdd-docs.md.hbs` | `sddu-docs.md.hbs` |
| `sdd-roadmap.md.hbs` | `sddu-roadmap.md.hbs` |

---

### FR-005: 文档更新

**描述**: 更新所有文档文件中的品牌名称和引用

**验收标准**:
- [ ] `README.md` 标题和内容更新
- [ ] `.sdd/` 目录下的文档更新
- [ ] `docs/` 目录下的迁移指南更新
- [ ] 脚本输出信息更新
- [ ] 保持历史文档的准确性（CHANGELOG 等可选）

**文档文件清单**:

| 文件 | 优先级 | 变更内容 |
|------|--------|---------|
| `/README.md` | P0 | 标题、Agent 引用、目录结构 |
| `/.sdd/README.md` | P0 | 标题、目录引用 |
| `/.sdd/TREE.md` | P0 | "SDD" → "SDDU" 定义 |
| `/.sdd/ROADMAP.md` | P1 | 版本历史、品牌名称 |
| `/docs/migration-guide.md` | P1 | 迁移指南内容 |
| `/docs/containerization-faq.md` | P1 | FAQ 中的品牌引用 |
| `/CHANGELOG.md` | P2 | 保留历史（可选） |
| `/RELEASE-NOTES.md` | P2 | 保留历史（可选） |

**脚本文件更新**:

| 文件 | 变更内容 |
|------|---------|
| `/install.sh` | 输出 "SDDU Plugin Installer" |
| `/install.ps1` | 输出信息中的 SDD 引用 |
| `/build-agents.cjs` | Agent 生成脚本中的命名 |
| `/scripts/package.cjs` | 打包脚本中的目录引用 |

---

### FR-006: 向后兼容支持

**描述**: 提供向后兼容层，确保现有用户平滑迁移

**验收标准**:
- [ ] 旧 Agent 名称 `@sdd-*` 仍可调用
- [ ] 旧工具名 `sdd_update_state` 仍可工作
- [ ] 旧脚本 `sdd-*` 仍可运行
- [ ] `.sdd/` 目录仍被支持（不强制改名）
- [ ] 在 Help Agent 中说明新旧名称映射
- [ ] 在文档中明确标注 deprecated 警告

**向后兼容实现**:

1. **Agent 双定义**: 在 `opencode.json` 中同时保留新旧 agent 定义
   ```json
   {
     "agent": {
       "sdd": {
         "description": "[Deprecated] Use @sddu instead",
         "prompt": "{file:.opencode/agents/sddu.md}"
       },
       "sddu": {
         "description": "SDDU Master Coordinator",
         "prompt": "{file:.opencode/agents/sddu.md}"
       }
     }
   }
   ```

2. **工具双命名**: 保留 `sdd_update_state.js`，同时创建 `sddu_update_state.js`

3. **目录双支持**: 代码中同时支持 `.sdd/` 和 `.sddu/` 目录

---

## 3. 非功能需求

### NFR-001: 向后兼容性要求

**描述**: 确保现有用户的工作流不受影响

**要求**:
- 旧 Agent 名称 (`@sdd-*`) 在 2 个大版本内保持可用
- 旧工具命令保持可用
- `.sdd/` 工作空间目录继续支持
- 提供明确的 deprecated 警告

**验证方法**:
- 使用旧 Agent 名称调用，验证功能正常
- 检查 deprecated 警告是否正确显示

---

### NFR-002: 迁移路径

**描述**: 提供清晰的 3 阶段迁移策略

**阶段 1: 双名称并存** (当前版本)
- 同时支持 `@sdd-*` 和 `@sddu-*`
- 旧名称标记为 deprecated
- 发布迁移指南文档

**阶段 2: 默认新名称** (下 1-2 个版本)
- 文档默认使用 `@sddu-*`
- 旧名称仍可用但有明显警告
- 提供自动迁移脚本

**阶段 3: 移除旧名称** (大版本更新)
- 在 v2.0.0 中移除旧名称
- 提前 2 周发出移除警告
- 提供迁移工具

**验证方法**:
- 检查每个阶段的文档和实现一致性
- 验证迁移脚本功能正常

---

### NFR-003: 测试覆盖率要求

**描述**: 确保改名后功能完整性

**要求**:
- 单元测试覆盖率 ≥ 90%
- 集成测试覆盖所有 Agent
- 端到端测试覆盖完整工作流
- 向后兼容性测试覆盖旧名称

**测试清单**:
- [ ] 插件安装测试
- [ ] 所有 18 个 Agent 调用测试
- [ ] 完整工作流测试 (spec→validate)
- [ ] 向后兼容性测试
- [ ] 文档链接验证测试

**验证方法**:
- 运行 `npm test` 验证覆盖率报告
- 手动测试完整工作流

---

### NFR-004: 性能要求

**描述**: 改名不应影响插件性能

**要求**:
- Agent 响应时间无显著变化
- 文件扫描速度无显著变化
- 构建时间无显著增加

**验证方法**:
- 对比改名前后的性能指标
- 性能回归测试

---

### NFR-005: 安全性要求

**描述**: 改名过程中不引入安全风险

**要求**:
- 不修改任何安全相关配置
- 不引入新的依赖
- 保持现有的权限控制

**验证方法**:
- 安全审计检查
- 依赖扫描

---

## 4. 验收标准

### 4.1 功能验收

| ID | 验收项 | 验证方法 | 状态 |
|----|--------|---------|------|
| AC-001 | 新插件包可安装 | `npm install opencode-sddu-plugin` | ⬜ |
| AC-002 | 所有 18 个 `@sddu-*` Agent 可调用 | 逐一测试每个 Agent | ⬜ |
| AC-003 | 旧 `@sdd-*` Agent 仍可调用 | 逐一测试旧 Agent | ⬜ |
| AC-004 | 完整工作流正常运行 | spec→plan→tasks→build→review→validate | ⬜ |
| AC-005 | 状态更新工具正常工作 | `/tool sddu_update_state` | ⬜ |
| AC-006 | 目录导航生成正常 | `@sddu-docs` 生成正确导航 | ⬜ |

### 4.2 文档验收

| ID | 验收项 | 验证方法 | 状态 |
|----|--------|---------|------|
| AC-101 | README.md 完全更新 | 检查标题、Agent 引用、目录结构 | ⬜ |
| AC-102 | 所有 Agent 描述更新 | 检查 opencode.json 中的描述 | ⬜ |
| AC-103 | 迁移指南发布 | 检查 docs/migration-guide.md | ⬜ |
| AC-104 | Help Agent 说明新旧映射 | 调用 @sddu-help 验证 | ⬜ |

### 4.3 技术验收

| ID | 验收项 | 验证方法 | 状态 |
|----|--------|---------|------|
| AC-201 | 所有测试通过 | `npm test` | ⬜ |
| AC-202 | 构建产物正确 | 检查 dist/sddu/ 目录结构 | ⬜ |
| AC-203 | 安装包结构正确 | 安装后验证文件完整性 | ⬜ |
| AC-204 | Git 历史清晰 | 使用 git mv 保持历史 | ⬜ |
| AC-205 | 测试覆盖率 ≥ 90% | 检查 coverage 报告 | ⬜ |

---

## 5. 依赖关系

### 5.1 前置依赖

| Feature | 依赖类型 | 说明 |
|---------|---------|------|
| 无 | - | 本 Feature 为独立改名任务 |

### 5.2 阻塞关系

| Feature | 阻塞类型 | 说明 |
|---------|---------|------|
| 所有新 Feature | 强阻塞 | 新 Feature 应使用 `@sddu-*` Agent |
| FR-SDDU-* 系列 | 无 | 改名完成后才能发布其他 SDDU 功能 |

### 5.3 外部依赖

| 依赖 | 类型 | 说明 |
|------|------|------|
| npm registry | 发布 | 需要发布新包 `opencode-sddu-plugin` |
| OpenCode 平台 | 兼容 | 确保 Agent 定义格式兼容 |

---

## 6. 技术设计

### 6.1 架构影响

**影响范围**: 低
- 不改核心架构
- 仅改命名和引用

**架构变更**:
```
src/
├── agents/
│   ├── sdd-agents.ts → sddu-agents.ts (可选)
│   └── ...
├── templates/
│   └── agents/
│       ├── sdd*.hbs → sddu*.hbs
│       └── ...
└── ...
```

### 6.2 数据模型变更

**无数据模型变更**
- Schema 保持不变
- 状态文件格式保持不变

### 6.3 API 接口设计

**无 API 变更**
- 内部命令接口保持不变（保持向后兼容）
- 工具函数接口保持不变

### 6.4 第三方依赖

| 依赖 | 变更 | 说明 |
|------|------|------|
| opencode | 无 | 插件框架不变 |
| npm | 新包发布 | 发布 `opencode-sddu-plugin` |

---

## 7. 边界情况

### EC-001: 旧项目迁移

**场景**: 用户已有 `.sdd/` 工作空间

**处理**:
- 保持 `.sdd/` 目录支持
- 提供迁移脚本（可选）
- 新 Feature 可使用 `.sddu/` 或继续用 `.sdd/`

---

### EC-002: Agent 名称冲突

**场景**: 用户自定义了 `@sdd-*` 名称的 Agent

**处理**:
- 插件内置 Agent 使用更高优先级
- 在文档中说明冲突解决方法
- 提供配置覆盖指南

---

### EC-003: 并发调用

**场景**: 用户同时使用新旧 Agent 名称

**处理**:
- 新旧 Agent 指向同一实现
- 无状态冲突
- 日志中记录使用的名称

---

### EC-004: 回滚场景

**场景**: 改名后发现问题需要回滚

**处理**:
- 保留旧包 `opencode-sdd-plugin` 的最新版本
- 提供回滚指南
- 回滚步骤：
  1. 卸载 `opencode-sddu-plugin`
  2. 安装 `opencode-sdd-plugin` (最后版本)
  3. 恢复 `opencode.json` 中的旧配置

---

## 8. 实施计划

### 8.1 实施清单

**P0 - 必须修改**:
- [ ] `package.json` - 包名、脚本名、keywords、files
- [ ] `opencode.json` - plugin 引用、18 个 agent 定义
- [ ] `src/index.ts` - 插件导出名、日志服务名
- [ ] `src/agents/sdd-agents.ts` - agent 注册
- [ ] `src/templates/agents/*.hbs` - 11 个模板文件
- [ ] `README.md` - 主文档
- [ ] `.opencode/plugins/sdd/opencode.json` - 插件配置
- [ ] `.opencode/plugins/sdd/package.json` - 插件包配置

**P1 - 建议修改**:
- [ ] `src/errors.ts` - 错误前缀
- [ ] `.tool/sdd_update_state.js` - 工具名（保留旧文件）
- [ ] `.tool/sddu_update_state.js` - 新工具名
- [ ] `install.sh` - 安装脚本输出
- [ ] `install.ps1` - 安装脚本输出
- [ ] `build-agents.cjs` - Agent 生成脚本
- [ ] `scripts/package.cjs` - 打包脚本
- [ ] `.sdd/README.md` - 工作空间说明
- [ ] `.sdd/TREE.md` - 目录结构规范
- [ ] `docs/migration-guide.md` - 迁移指南
- [ ] `docs/containerization-faq.md` - FAQ

**P2 - 可选修改**:
- [ ] `CHANGELOG.md` - 保留历史（可选）
- [ ] `RELEASE-NOTES.md` - 保留历史（可选）
- [ ] specs-tree 现有 Feature 目录名 - 保留
- [ ] 测试文件中的描述文本 - 逐步更新

### 8.2 工作量估算

| 任务类别 | 预估工时 | 备注 |
|---------|---------|------|
| 配置文件修改 | 2 小时 | package.json, opencode.json 等 |
| 源代码修改 | 4 小时 | index.ts, agents, errors 等 |
| 模板文件修改 | 3 小时 | 11 个 .hbs 文件 |
| 文档更新 | 4 小时 | README, .sdd 文档，docs |
| 脚本更新 | 2 小时 | install.sh, build-agents, package |
| 测试更新 | 3 小时 | 测试文件和验证 |
| 向后兼容层 | 2 小时 | 双名称支持 |
| 测试验证 | 4 小时 | 完整测试流程 |
| **总计** | **24 小时** | 约 3 个工作日 |

---

## 9. 开放问题

| ID | 问题 | 状态 | 负责人 |
|----|------|------|--------|
| OQ-001 | 是否强制改名 `.sdd/` 目录为 `.sddu/`？ | 已决策：不强制 | Spec Agent |
| OQ-002 | 旧包 `opencode-sdd-plugin` 何时 deprecated？ | 待决策 | 项目负责人 |
| OQ-003 | 是否需要自动迁移脚本？ | 建议有 | Build Agent |
| OQ-004 | specs-tree 现有 Feature 目录是否改名？ | 已决策：保留 | Spec Agent |

---

## 10. 版本历史

| 版本 | 日期 | 作者 | 变更说明 |
|------|------|------|---------|
| 1.0.0 | 2026-04-06 | SDD Spec Agent | 初始版本 |

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

模板文件:
- /src/templates/agents/*.hbs (11 个文件)

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
- /.tool/sdd_update_state.js
- /.tool/sddu_update_state.js (新建)
```

---

**规范完成时间**: 2026-04-06  
**规范状态**: specified  
**下一步**: 运行 `@sddu-plan 插件改名 SDDU` 开始技术规划
