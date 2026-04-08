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
3. **彻底替换**: 移除所有旧版 SDD 引用，统一使用 SDDU
4. **文档同步**: 更新所有相关文档以反映新品牌

### 1.3 核心原则：配置模型驱动

**文件修改策略**:

```
src/config/opencode-config.ts (配置模型)
     ↓ 直接修改
自动生成 → opencode.json, .opencode/*, .sdd/*
```

**分类说明**:

| 类别 | 路径 | 修改策略 | 示例 |
|------|------|----------|------|
| 配置模型 | `src/config/*` | ✅ 直接修改 | `src/config/opencode-config.ts` |
| 源码 | `src/*` | ✅ 直接修改 | `src/agents/sddu-agents.ts` |
| 根目录配置 | `package.json`, `README.md` | ✅ 直接修改 | `package.json` |
| 生成产物 | `.opencode/*` | ❌ 不直接修改 | 由配置模型自动生成 |
| 生成产物 | `.sdd/*` | ❌ 不直接修改 | 由配置模型自动生成 |
| 生成产物 | `opencode.json` (根目录) | ❌ 不直接修改 | 由配置模型自动生成 |

**正确做法**:
- ✅ 直接修改 `src/config/opencode-config.ts` 配置模型
- ✅ 直接修改 `src/agents/sddu-agents.ts` 源码
- ✅ 配置模型会自动生成所有配置文件

**错误做法**:
- ❌ 修改构建脚本或生成脚本
- ❌ 新增生成脚本
- ❌ 直接编辑 `.opencode/*`、`.sdd/*`、`opencode.json`

### 1.4 改名范围 (6 个维度)

| 维度 | 当前命名 | 目标命名 | 迁移策略 |
|------|---------|---------|---------|
| 插件名称 | OpenCode SDD Plugin | OpenCode SDDU Plugin | 直接替换 |
| 包名 (npm) | opencode-sdd-plugin | opencode-sddu-plugin | 新包发布 |
| Agent 命令 | @sdd-* | @sddu-* | 直接替换，删除旧版 |
| 工作空间目录 | .sdd/ | .sddu/ | **不做迁移支持** |
| specs-tree 目录 | specs-tree-sdd-* | specs-tree-sddu-* | 新建使用 |
| 工具/命令 | sdd_* | sddu_* | 直接替换，删除旧版 |

### 1.5 成功标准

- [ ] 新插件包 `opencode-sddu-plugin` 可正常安装和使用
- [ ] 所有 18 个 Agent (`@sddu-*`) 可正常调用
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
- `/package.json` (源码，直接修改)
- `/src/config/opencode-config.ts` (配置模型，直接修改)
- `/src/package-template.ts` (模板源码，修改输出路径)

**注意**: 所有配置文件由配置模型自动生成，不应直接修改配置文件本身，直接修改配置模型即可。

---

### FR-002: 包名更新

**描述**: 更新 npm 包名和相关脚本命令

**验收标准**:
- [ ] npm 包名从 `opencode-sdd-plugin` 改为 `opencode-sddu-plugin`
- [ ] 所有 npm scripts 中的命令名从 `sdd-*` 改为 `sddu-*`
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
- [ ] 移除所有旧 Agent 名称 `@sdd-*`
- [ ] 所有 Agent 指向正确的 prompt 模板文件

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
- `/src/agents/sdd-agents.ts` → `/src/agents/sddu-agents.ts` (源码，直接修改)
- `/src/config/opencode-config.ts` (配置模型，直接修改)

**注意**: 配置文件由配置模型自动生成，不应直接修改配置文件本身，直接修改配置模型即可。

---

### FR-004: 配置模型更新

**描述**: 更新配置模型源码，使其包含正确的配置

**验收标准**:
- [ ] `src/config/opencode-config.ts` 配置模型包含更新后的 plugin 引用定义
- [ ] `src/config/opencode-config.ts` 配置模型包含更新后的 18 个 agent 定义
- [ ] Agent prompt 模板文件名更新
- [ ] 模板内容中的 `@sdd-*` 引用更新
- [ ] 错误处理类名前缀更新
- [ ] 日志服务名更新

**配置模型源码清单** (直接修改):

| 源码文件 | 变更内容 |
|------|---------|
| `/src/config/opencode-config.ts` | plugin 引用、18 个 agent 定义 |
| `/src/index.ts` | 导出常量 `SDDUPlugin`、日志名 `sddu-plugin` |
| `/src/errors.ts` | 错误前缀 `[SDDU-`、类前缀 `SdduError` |
| `/src/templates/agents/*.hbs` | 11 个模板文件名和内容 |
| `/src/templates/config/opencode.json.hbs` | **插件名引用更新**（文件名不变） |

**说明**: 配置文件 (`opencode.json`、`.opencode/*`、`.sdd/*`) 由配置模型自动生成，不列入修改范围。

**注意**: 配置文件由配置模型自动生成，直接修改配置模型即可，不需要修改构建脚本或新增脚本。

**模板文件改名**:

| 旧文件名 | 新文件名 | 说明 |
|---------|---------|------|
| `sdd.md.hbs` | `sddu.md.hbs` | Agent prompt 模板 |
| `sdd-help.md.hbs` | `sddu-help.md.hbs` | Agent prompt 模板 |
| `sdd-discovery.md.hbs` | `sddu-discovery.md.hbs` | Agent prompt 模板 |
| `sdd-spec.md.hbs` | `sddu-spec.md.hbs` | Agent prompt 模板 |
| `sdd-plan.md.hbs` | `sddu-plan.md.hbs` | Agent prompt 模板 |
| `sdd-tasks.md.hbs` | `sddu-tasks.md.hbs` | Agent prompt 模板 |
| `sdd-build.md.hbs` | `sddu-build.md.hbs` | Agent prompt 模板 |
| `sdd-review.md.hbs` | `sddu-review.md.hbs` | Agent prompt 模板 |
| `sdd-validate.md.hbs` | `sddu-validate.md.hbs` | Agent prompt 模板 |
| `sdd-docs.md.hbs` | `sddu-docs.md.hbs` | Agent prompt 模板 |
| `sdd-roadmap.md.hbs` | `sddu-roadmap.md.hbs` | Agent prompt 模板 |
| `config/opencode.json.hbs` | `config/opencode.json.hbs` | **配置模板（内容更新，文件名不变）** |

**配置模板说明**:
- `src/templates/config/opencode.json.hbs` 是生成根目录 `opencode.json` 的源模板
- 文件名不变，但需要更新内容中的插件引用
- 第 3 行 `"plugin": ["opencode-sdd-plugin"]` 改为 `"plugin": ["opencode-sddu-plugin"]`

---

### FR-005: 文档更新

**描述**: 更新所有文档文件中的品牌名称和引用

**验收标准**:
- [ ] `README.md` 标题和内容更新（直接修改）
- [ ] `docs/` 目录下的文档更新（直接修改）
- [ ] 安装脚本输出信息更新
- [ ] 保持历史文档的准确性（CHANGELOG 等可选）

**文档文件清单**:

| 文件 | 优先级 | 变更策略 |
|------|--------|---------|
| `/README.md` | P0 | 直接修改（源码文档） |
| `/docs/containerization-faq.md` | P1 | 直接修改（源码文档） |
| `/CHANGELOG.md` | P2 | 保留历史（可选） |
| `/RELEASE-NOTES.md` | P2 | 保留历史（可选） |

**说明**: `.sdd/*` 目录下的文档 (`.sdd/README.md`、`.sdd/TREE.md`、`.sdd/ROADMAP.md`) 由配置模型自动生成，不列入修改范围。

**注意**: 不创建迁移指南文档（仅内部开发人员使用，无需迁移文档）

**脚本文件更新**:

| 文件 | 变更内容 |
|------|---------|
| `/install.sh` | 输出 "SDDU Plugin Installer" |
| `/install.ps1` | 输出信息中的 SDD 引用 |
| `/scripts/package.cjs` | 打包脚本中的目录引用 |

---

### FR-006: 旧版本清理

**描述**: 移除所有旧版 SDD 相关代码和配置

**验收标准**:
- [ ] 删除旧 Agent 定义 `@sdd-*`
- [ ] 删除旧工具 `sdd_update_state.js`
- [ ] 删除旧脚本 `sdd-*`
- [ ] 清理文档中的 SDD 引用
- [ ] 确保代码中无向后兼容残留

**清理清单**:
1. 删除配置模型 `src/config/opencode-config.ts` 中的旧 agent 定义
2. 删除 `.tool/sdd_update_state.js` (旧工具文件)
3. 删除 package.json 中的旧 scripts
4. 更新所有文档移除 deprecated 说明

---

## 3. 非功能需求

### NFR-001: 无向后兼容性要求

**描述**: 本次改名不保留向后兼容性，直接替换

**要求**:
- 旧 Agent 名称 (`@sdd-*`) 不再支持
- 旧工具命令不再支持
- `.sdd/` 工作空间目录保持不变，无需迁移
- 新 Feature 默认使用 `.sddu/` 目录
- 用户需手动更新配置以使用新名称

**验证方法**:
- 使用旧 Agent 名称调用，应提示使用新名称
- 检查文档中无 deprecated 警告（因为已直接移除）

---

### NFR-002: 目录策略

**描述**: 不做目录迁移支持，保持简洁

**策略**:

**工作空间目录原则**:
- `.sdd/` 目录保持不变，继续有效
- 新 Feature 默认使用 `.sddu/` 目录
- **不提供迁移脚本** - 仅内部开发人员使用，不做无价值工作
- **不提供迁移文档** - 一次性手动操作无需自动化
- 目录选择不影响插件功能

**设计原则**:
- 插件仅内部开发人员使用
- 不为一次性手动操作编写自动化脚本
- 不为无未来价值的工作投入开发时间
- 保持简洁，删除过度设计

**验证方法**:
- 验证新插件安装后 `.sdd/` 和 `.sddu/` 均可正常工作
- 确认无迁移脚本或迁移指南文档

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

**验收原则**:

本规范遵循以下验收原则：

| 验收类别 | 是否验收 | 说明 |
|----------|----------|------|
| 源码修改 (`src/`) | ✅ 验收 | 直接修改的源码文件 |
| 功能行为 | ✅ 验收 | Agent 是否正常工作 |
| 配置模型 (`src/config/*`) | ✅ 验收 | 配置模型源码 |
| 生成产物 (`.opencode/*`) | ❌ 不验收 | 由配置模型自动生成 |
| 生成产物 (`.sdd/*`) | ❌ 不验收 | 由配置模型自动生成 |
| 生成产物 (`opencode.json`) | ❌ 不验收 | 由配置模型自动生成 |

**说明**: 配置文件 (`.opencode/*`、`.sdd/*`、`opencode.json`) 由配置模型 (`src/config/opencode-config.ts`) 自动生成，验收应针对配置模型源码而非生成产物。

---

### 4.1 功能验收

| ID | 验收项 | 验证方法 | 状态 |
|----|--------|---------|------|
| AC-001 | 新插件包可安装 | `npm install opencode-sddu-plugin` | ⬜ |
| AC-002 | 所有 18 个 `@sddu-*` Agent 可调用 | 逐一测试每个 Agent | ⬜ |
| AC-004 | 完整工作流正常运行 | spec→plan→tasks→build→review→validate | ⬜ |
| AC-005 | 状态更新工具正常工作 | `/tool sddu_update_state` | ⬜ |
| AC-006 | 目录导航生成正常 | `@sddu-docs` 生成正确导航 | ⬜ |

### 4.2 文档验收

| ID | 验收项 | 验证方法 | 状态 |
|----|--------|---------|------|
| AC-101 | README.md 完全更新 | 检查标题、Agent 引用、目录结构 | ⬜ |
| AC-102 | 所有 Agent 描述更新 | 检查 `src/config/opencode-config.ts` 中的 agent 定义 | ⬜ |
| AC-103 | 无迁移指南 | 确认未创建 migration-guide.md | ⬜ |

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

### EC-001: 工作空间目录共存

**场景**: 用户已有 `.sdd/` 工作空间

**处理**:
- `.sdd/` 目录保持不变，继续有效
- 新 Feature 默认使用 `.sddu/` 目录
- **不提供迁移脚本** - 仅内部开发人员使用，不做无价值工作
- 两个目录可共存，互不影响

---

### EC-002: Agent 名称冲突

**场景**: 用户自定义了 `@sdd-*` 名称的 Agent

**处理**:
- 插件内置 Agent 使用更高优先级
- 在文档中说明冲突解决方法
- 提供配置覆盖指南

---

### EC-003: 旧项目升级

**场景**: 用户从旧版本升级到新版本

**处理**:
- 旧配置文件 `.sdd/` 可保留，无需迁移
- 新 Feature 默认使用 `.sddu/` 目录
- 旧 Agent 调用会失败，需更新为新名称
- 内部开发人员自行了解变更，无需升级指南

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

**P0 - 核心源码修改**:
- [ ] `package.json` - 包名、脚本名、keywords、files (直接修改)
- [ ] `src/index.ts` - 插件导出名、日志服务名 (直接修改)
- [ ] `src/agents/sdd-agents.ts` → `src/agents/sddu-agents.ts` - agent 注册 (直接修改)
- [ ] `src/templates/agents/*.hbs` - 11 个模板文件 (直接修改)
- [ ] `src/templates/config/opencode.json.hbs` - 配置模板内容更新 (直接修改)
- [ ] `README.md` - 主文档 (直接修改)
- [ ] `src/config/opencode-config.ts` - 配置模型 (直接修改)

**P1 - 其他源码修改**:
- [ ] `src/errors.ts` - 错误前缀 (直接修改)
- [ ] `.tool/sddu_update_state.js` - 新工具名 (直接修改)
- [ ] `install.sh` - 安装脚本输出 (直接修改)
- [ ] `install.ps1` - 安装脚本输出 (直接修改)
- [ ] `scripts/package.cjs` - 打包脚本 (直接修改)
- [ ] `docs/containerization-faq.md` - FAQ (直接修改)

**注意**: `.opencode/*` 和 `.sdd/*` 目录下的文件由配置模型自动生成，不需要修改构建脚本或新增脚本。

**P1 - 删除旧文件**:
- [ ] 删除 `src/agents/sdd-agents.ts` (清理旧源码)
- [ ] 删除旧模板文件 `sdd*.hbs` (清理旧模板)

**P2 - 可选修改**:
- [ ] `CHANGELOG.md` - 保留历史（可选）
- [ ] `RELEASE-NOTES.md` - 保留历史（可选）
- [ ] specs-tree 现有 Feature 目录名 - 保留
- [ ] 测试文件中的描述文本 - 逐步更新

### 8.2 工作量估算

| 任务类别 | 预估工时 | 备注 |
|---------|---------|------|
| 配置文件修改 | 2 小时 | package.json 等 |
| 配置模型修改 | 3 小时 | opencode-config.ts |
| 源代码修改 | 4 小时 | index.ts, agents, errors 等 |
| 模板文件修改 | 3.5 小时 | 11 个 .hbs 文件 + opencode.json.hbs |
| 文档更新 | 4 小时 | README, .sdd 文档，docs |
| 安装/打包脚本更新 | 1 小时 | install.sh, install.ps1, package |
| 旧文件清理 | 1 小时 | 删除旧 agent、工具 |
| 测试更新 | 3 小时 | 测试文件和验证 |
| 测试验证 | 4 小时 | 完整测试流程 |
| **总计** | **25.5 小时** | 约 3 个工作日 |

---

## 9. 开放问题

| ID | 问题 | 状态 | 负责人 |
|----|------|------|--------|
| OQ-001 | 是否强制改名 `.sdd/` 目录为 `.sddu/`？ | 已决策：不强制 | Spec Agent |
| OQ-002 | 旧包 `opencode-sdd-plugin` 何时 deprecated？ | 待决策 | 项目负责人 |
| OQ-003 | 是否需要自动迁移脚本？ | **已决策：不需要** - 仅内部开发人员使用 | Spec Agent |
| OQ-004 | specs-tree 现有 Feature 目录是否改名？ | 已决策：保留 | Spec Agent |

---

## 10. 版本历史

| 版本 | 日期 | 作者 | 变更说明 |
|------|------|------|---------|
| 1.0.5 | 2026-04-08 | 用户要求 | 纳入遗漏的 `src/templates/config/opencode.json.hbs` 模板文件，更新修改范围和工作量估算 |
| 1.0.4 | 2026-04-08 | 用户要求 | 移除生成产物验收项：不验收 `.opencode/*`、`.sdd/*`、`opencode.json`，仅验收源码和配置模型 |
| 1.0.3 | 2026-04-08 | 用户要求 | 修正配置修改策略：直接修改 `src/config/opencode-config.ts` 配置模型，不需要修改构建脚本或新增脚本 |
| 1.0.2 | 2026-04-07 | 用户要求 | 修正文件修改策略：明确区分源码和生成产物，不直接修改 `.opencode/*`、`.sdd/*`、`.opencode.json` |
| 1.0.1 | 2026-04-06 | 用户要求 | 修改策略：从双名称并存改为直接替换，删除旧版 SDD |
| 1.0.0 | 2026-04-06 | SDD Spec Agent | 初始版本 |

---

## 附录

### A. 改名对照表

| 类别 | 旧名称 | 新名称 | 备注 |
|------|--------|--------|------|
| 插件名 | OpenCode SDD Plugin | OpenCode SDDU Plugin | 直接替换 |
| 包名 | opencode-sdd-plugin | opencode-sddu-plugin | 直接替换 |
| Agent 前缀 | @sdd-* | @sddu-* | 直接替换，删除旧版 |
| 工作目录 | .sdd/ | .sddu/ | **不做迁移支持** |
| 工具前缀 | sdd_* | sddu_* | 直接替换，删除旧版 |
| 错误前缀 | [SDD- | [SDDU- | 直接替换 |
| 类前缀 | Sdd* | Sddu* | 直接替换 |
| 接口前缀 | Sdd* | Sddu* | 直接替换 (如 SddConfig→SdduConfig) |
| 类型前缀 | Sdd* | Sddu* | 直接替换 (如 SddPhase→SdduPhase) |
| 命令类前缀 | Sdd*Command | Sddu*Command | 直接替换 (如 SddMigrateSchemaCommand) |
| 文件修改策略 | 修改构建脚本 | 直接修改配置模型 | 配置模型自动生成所有配置文件 |

**目录策略说明**:
- `.sdd/` 目录保持不变，继续有效
- 新 Feature 默认使用 `.sddu/` 目录
- 不提供迁移脚本或迁移文档
- 仅内部开发人员使用，不做无价值工作

### B. 关键路径汇总

**核心原则**: 直接修改配置模型 (`src/config/opencode-config.ts`) 和源码，不需要修改构建脚本或新增脚本

```
配置模型 (直接修改):
- /src/config/opencode-config.ts

源码 (直接修改):
- /src/index.ts
- /src/agents/sdd-agents.ts → sddu-agents.ts
- /src/errors.ts
- /src/templates/agents/*.hbs (11 个文件)
- /src/templates/config/opencode.json.hbs (内容更新)
- /src/types.ts (SddConfig→SdduConfig)
- /src/state/machine.ts (SddPhase→SdduPhase)
- /src/commands/sdd-migrate-schema.ts → sddu-migrate-schema.ts (重命名+SddMigrateSchemaCommand→SdduMigrateSchemaCommand)
- /src/agents/registry.ts (过滤条件更新)

根目录配置 (直接修改):
- /package.json
- /README.md
- /opencode.json (新增发现，需修改)
- /docs/containerization-faq.md

安装/打包脚本 (直接修改):
- /install.sh
- /install.ps1
- /scripts/package.cjs

工具:
- /.tool/sdd_update_state.js (删除)
- /.tool/sddu_update_state.js (新建)

**说明**: 生成产物 (`opencode.json`、`.opencode/*`、`.sdd/*`) 由配置模型自动生成，不列入修改范围。
但根目录的 `opencode.json` 是项目配置文件，需要直接修改。
```

---

### C. 2026-04-08 源码审查补充发现

在 2026-04-08 的全面源码审查中，发现以下遗漏的 SDD→SDDU 引用需要修改：

#### C.1 高优先级问题（7 个）

| # | 文件 | 问题 | 修改方案 |
|---|------|------|----------|
| 1 | `/opencode.json` | 第 4 行使用 `opencode-sdd-plugin`，第 7-96 行使用 `sdd-*` agent | 改为 `opencode-sddu-plugin` 和 `sddu-*` |
| 2 | `/src/templates/config/opencode.json.hbs` | 第 5-94 行使用 `sdd-*` agent 名称 | 全部改为 `sddu-*` |
| 3 | `/src/index.ts` | 第 1 行注释 `// SDD Plugin for OpenCode` | 改为 `// SDDU Plugin for OpenCode` |
| 4 | `/src/types.ts` | 第 100 行 `export interface SddConfig` | 改为 `export interface SdduConfig` |
| 5 | `/src/state/machine.ts` | 第 17 行 `export type SddPhase` | 改为 `export type SdduPhase` |
| 6 | `/src/commands/sdd-migrate-schema.ts` | 类名 `SddMigrateSchemaCommand`，文件名也需改 | 改为 `SdduMigrateSchemaCommand`，文件重命名 |
| 7 | `/src/agents/registry.ts` | 第 166 行只过滤 `sdd-` 前缀 | 改为同时支持 `sdd-` 和 `sddu-` |

#### C.2 中优先级问题（测试文件）

测试文件中的 `@sdd-*` 引用大部分用于向后兼容性测试，可以保留。但以下文件建议添加 `@sddu-*` 测试用例：

- `tests/e2e/multi-feature.test.ts`
- `tests/state/agent-integration.test.ts`
- `tests/state/simple-agent-integration.test.ts`
- `tests/state/migrator-v2.test.ts`

#### C.3 完整审查报告

详细审查报告已生成：`.sdd/specs-tree-root/specs-tree-plugin-rename-sddu/source-code-review.md`

---

**规范完成时间**: 2026-04-06  
**规范更新时间**: 2026-04-08 (添加源码审查补充发现)  
**规范状态**: specified  
**下一步**: 运行 `@sddu-plan 插件改名 SDDU` 开始技术规划
