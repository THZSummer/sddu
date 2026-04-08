# SDD Discovery 需求挖掘报告 - 插件改名 SDDU

**Feature ID**: FR-SDDU-RENAME-001  
**Feature 名称**: 插件改名 SDDU  
**Discovery 版本**: 1.0.0  
**创建日期**: 2026-04-06  
**状态**: Discovery Complete  

---

## 1. 执行摘要

### 1.1 任务目标
将当前项目名称从 "SDD" (Spec-Driven Development) 全面改名为 "SDDU"，涉及整个插件系统的命名更新。

### 1.2 关键发现
经过全面扫描，识别出 **2224+ 处** "sdd"/"SDD" 引用，分布在以下关键类别：

| 类别 | 文件数量 | 影响等级 |
|------|---------|---------|
| 配置文件 (package.json, opencode.json) | 8+ | 🔴 高 |
| Agent 定义与 Prompt 模板 | 24+ | 🔴 高 |
| 源代码文件 (.ts, .js) | 50+ | 🔴 高 |
| 文档文件 (.md) | 40+ | 🟡 中 |
| 测试文件 (.test.ts, .test.js) | 30+ | 🟡 中 |
| 脚本文件 (.sh, .cjs) | 10+ | 🟡 中 |
| specs-tree 目录命名 | 8 个现有 Feature | 🟡 中 |
| 工具与命令 | 5+ | 🔴 高 |

### 1.3 改名范围总览

```
改名维度          | 当前命名              | 目标命名              | 影响范围
-----------------|----------------------|----------------------|----------
插件名称          | OpenCode SDD Plugin  | OpenCode SDDU Plugin | 全局
包名 (npm)        | opencode-sdd-plugin  | opencode-sddu-plugin | 全局
Agent 前缀        | @sdd-*               | @sddu-*              | 用户交互
工作空间目录      | .sdd/                | .sddu/               | 可选
specs-tree 目录   | specs-tree-sdd-*     | specs-tree-sddu-*    | 现有 Feature
命令/工具         | sdd_*                | sddu_*               | 内部实现
```

---

## 2. 详细影响分析

### 2.1 配置文件改名清单

#### 2.1.1 package.json (关键文件)
**位置**: `/home/usb/workspace/wks-sddu/sddu/package.json`

| 字段 | 当前值 | 目标值 | 备注 |
|------|--------|--------|------|
| `name` | `opencode-sdd-plugin` | `opencode-sddu-plugin` | 必须修改 |
| `description` | `Specification-Driven Development plugin...` | `Specification-Driven Development Unified plugin...` | 可选 |
| `scripts.sdd-spec` | `node ./dist/commands/sdd-spec.js` | `node ./dist/commands/sddu-spec.js` | 保持向后兼容 |
| `scripts.sdd-plan` | `node ./dist/commands/sdd-plan.js` | `node ./dist/commands/sddu-plan.js` | 保持向后兼容 |
| `scripts.sdd-tasks` | `node ./dist/commands/sdd-tasks.js` | `node ./dist/commands/sddu-tasks.js` | 保持向后兼容 |
| `scripts.sdd-build` | `node ./dist/commands/sdd-build.js` | `node ./dist/commands/sddu-build.js` | 保持向后兼容 |
| `keywords` | `["opencode", "plugin", "sdd"]` | `["opencode", "plugin", "sddu"]` | 添加 sddu |
| `files` | `dist/sdd/**/*` | `dist/sddu/**/*` | 目录名变更 |

**相关文件**:
- `/home/usb/workspace/wks-sddu/sddu/.opencode/plugins/sdd/package.json`
- `/home/usb/workspace/wks-sddu/sddu/dist/sdd/package.json`

#### 2.1.2 opencode.json (多处)
**位置**: 
- `/home/usb/workspace/wks-sddu/sddu/opencode.json`
- `/home/usb/workspace/wks-sddu/sddu/.opencode/plugins/sdd/opencode.json`

**Agent 定义需要改名** (共 16 个 agent):

| 当前 Agent 名称 | 目标 Agent 名称 | 描述 |
|----------------|----------------|------|
| `sdd` | `sddu` | Master Coordinator |
| `sdd-help` | `sddu-help` | Help Assistant |
| `sdd-0-discovery` | `sddu-0-discovery` | 需求挖掘专家 |
| `sdd-discovery` | `sddu-discovery` | 需求挖掘 (短名) |
| `sdd-1-spec` | `sddu-1-spec` | 规范编写专家 |
| `sdd-spec` | `sddu-spec` | 规范编写 (短名) |
| `sdd-2-plan` | `sddu-2-plan` | 技术规划专家 |
| `sdd-plan` | `sddu-plan` | 技术规划 (短名) |
| `sdd-3-tasks` | `sddu-3-tasks` | 任务分解专家 |
| `sdd-tasks` | `sddu-tasks` | 任务分解 (短名) |
| `sdd-4-build` | `sddu-4-build` | 任务实现专家 |
| `sdd-build` | `sddu-build` | 任务实现 (短名) |
| `sdd-5-review` | `sddu-5-review` | 代码审查专家 |
| `sdd-review` | `sddu-review` | 代码审查 (短名) |
| `sdd-6-validate` | `sddu-6-validate` | 验证专家 |
| `sdd-validate` | `sddu-validate` | 验证 (短名) |
| `sdd-docs` | `sddu-docs` | 目录导航生成器 |
| `sdd-roadmap` | `sddu-roadmap` | Roadmap 规划专家 |

**plugin 引用**:
- `"plugin": ["opencode-sdd-plugin"]` → `"plugin": ["opencode-sddu-plugin"]`

### 2.2 源代码文件改名清单

#### 2.2.1 核心入口文件
**位置**: `/home/usb/workspace/wks-sddu/sddu/src/index.ts`

| 内容 | 当前值 | 目标值 |
|------|--------|--------|
| 导出常量名 | `SDDPlugin` | `SDDUPlugin` |
| 日志服务名 | `sdd-plugin` | `sddu-plugin` |
| 注释 | `// SDD Plugin for OpenCode` | `// SDDU Plugin for OpenCode` |

#### 2.2.2 命令文件
**位置**: `/home/usb/workspace/wks-sddu/sddu/src/commands/`

| 当前文件名 | 目标文件名 | 备注 |
|-----------|-----------|------|
| `sdd-migrate-schema.ts` | `sddu-migrate-schema.ts` | 可选，保持向后兼容 |

#### 2.2.3 Agent 注册文件
**位置**: `/home/usb/workspace/wks-sddu/sddu/src/agents/sdd-agents.ts`

需要改名的内容：
- 文件名: `sdd-agents.ts` → `sddu-agents.ts` (可选)
- 所有 agent 名称引用

#### 2.2.4 工具文件
**位置**: `/home/usb/workspace/wks-sddu/sddu/.tool/sdd_update_state.js`

| 内容 | 当前值 | 目标值 |
|------|--------|--------|
| 文件名 | `sdd_update_state.js` | `sddu_update_state.js` |
| 函数调用 | `sdd_update_state` | `sddu_update_state` |

#### 2.2.5 错误处理
**位置**: `/home/usb/workspace/wks-sddu/sddu/src/errors.ts`

| 内容 | 当前值 | 目标值 |
|------|--------|--------|
| 错误前缀 | `SDD Error` | `SDDU Error` |
| 错误类前缀 | `SddError` | `SdduError` |
| 日志前缀 | `[SDD-` | `[SDDU-` |

### 2.3 Agent Prompt 模板文件

**位置**: `/home/usb/workspace/wks-sddu/sddu/src/templates/agents/`

| 当前文件名 | 目标文件名 |
|-----------|-----------|
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

**模板内容需要更新**:
- 所有 `@sdd-*` 引用 → `@sddu-*`
- 所有 `.sdd/` 目录引用 → `.sddu/` (可选)
- 所有 "SDD" 文本 → "SDDU"

### 2.4 文档文件

#### 2.4.1 README.md
**位置**: `/home/usb/workspace/wks-sddu/sddu/README.md`

需要更新的内容:
- 标题: `# OpenCode SDD Plugin` → `# OpenCode SDDU Plugin`
- 所有 `@sdd-*` 命令引用
- 所有 `.sdd/` 目录引用
- 项目结构图中的命名

#### 2.4.2 .sdd 目录文档
**位置**: `/home/usb/workspace/wks-sddu/sddu/.sdd/`

| 文件 | 需要更新的内容 |
|------|---------------|
| `README.md` | 标题、目录引用 |
| `TREE.md` | "Software Development Definition (SDD)" → "Software Development Definition Unified (SDDU)" |
| `ROADMAP.md` | 版本历史、品牌名称 |

#### 2.4.3 docs 目录
**位置**: `/home/usb/workspace/wks-sddu/sddu/docs/`

| 文件 | 影响 |
|------|------|
| `migration-guide.md` | SDD 容器化结构迁移指南 |
| `containerization-faq.md` | SDD 容器化结构快速参考 |
| `state-schema-v2.0.0.md` | Schema 文档中的 SDD 引用 |

#### 2.4.4 CHANGELOG.md & RELEASE-NOTES.md
需要更新所有历史引用中的品牌名称（可选，建议保留历史记录）

### 2.5 specs-tree 现有 Feature 目录

**位置**: `/home/usb/workspace/wks-sddu/sddu/.sdd/specs-tree-root/`

现有 8 个 Feature 目录:

| 当前目录名 | 建议处理 |
|-----------|---------|
| `specs-tree-deprecate-sdd-tools` | 保留（历史 Feature） |
| `specs-tree-sdd-discovery-feature` | 保留（历史 Feature） |
| `specs-tree-sdd-plugin-baseline` | 保留（历史 Feature） |
| `specs-tree-sdd-workflow-state-optimization` | 保留（历史 Feature） |
| `specs-tree-sdd-plugin-roadmap` | 保留（历史 Feature） |
| `specs-tree-sdd-multi-module` | 保留（历史 Feature） |
| `specs-tree-sdd-tools-optimization` | 保留（历史 Feature） |
| `specs-tree-directory-optimization` | 无需改名 |

**建议**: 现有 Feature 目录保持原名，新建 Feature 使用 `specs-tree-sddu-*` 前缀

### 2.6 脚本文件

**位置**: `/home/usb/workspace/wks-sddu/sddu/`

| 文件 | 需要更新的内容 |
|------|---------------|
| `install.sh` | 输出信息中的 "SDD Plugin Installer" → "SDDU Plugin Installer" |
| `install.ps1` | 输出信息中的 SDD 引用 |
| `build-agents.cjs` | Agent 生成脚本中的命名 |
| `scripts/package.cjs` | 打包脚本中的目录引用 |

### 2.7 测试文件

**影响范围**: 30+ 测试文件

需要更新的内容:
- 测试描述中的 "SDD" → "SDDU"
- Agent 名称引用 `@sdd-*` → `@sddu-*`
- 目录路径 `.sdd/` → `.sddu/` (可选)
- 工具调用 `sdd_update_state` → `sddu_update_state`

### 2.8 其他配置文件

| 文件 | 需要更新的内容 |
|------|---------------|
| `tsconfig.json` | 无需修改 |
| `jest.config.ts` | 无需修改 |
| `.gitignore` | 无需修改 |
| `package-lock.json` | 自动生成，无需手动修改 |

---

## 3. 利益相关者分析

### 3.1 受影响的用户群体

#### 3.1.1 现有用户 (已安装插件)
**影响等级**: 🟡 中等

**影响内容**:
- 需要更新插件包名
- Agent 名称变更可能需要适应期
- 现有 `.sdd/` 工作空间保持兼容

**应对策略**:
- 提供迁移指南文档
- 保持向后兼容（同时支持 `@sdd-*` 和 `@sddu-*`）
- 提供自动迁移脚本

#### 3.1.2 新用户
**影响等级**: 🟢 低

**影响内容**:
- 直接使用新品牌名称
- 无历史包袱

#### 3.1.3 开发者/贡献者
**影响等级**: 🟡 中等

**影响内容**:
- 需要熟悉新的命名规范
- 代码引用需要更新
- 文档需要学习

### 3.2 使用场景分析

| 场景 | 当前行为 | 改名后行为 | 兼容性要求 |
|------|---------|-----------|-----------|
| 安装插件 | `bash install.sh <dir>` | 不变 | ✅ 完全兼容 |
| 调用 Agent | `@sdd 开始 feature` | `@sddu 开始 feature` | ⚠️ 需要兼容层 |
| 工作空间目录 | `.sdd/specs-tree-root/` | `.sddu/specs-tree-root/` | ⚠️ 可选迁移 |
| 状态更新工具 | `/tool sdd_update_state` | `/tool sddu_update_state` | ⚠️ 需要兼容层 |
| 查看文档 | `README.md` 中的 SDD | README.md 中的 SDDU | ✅ 文档更新即可 |

---

## 4. 风险识别

### 4.1 技术风险

#### 4.1.1 向后兼容性断裂
**风险等级**: 🔴 高

**描述**: 如果直接替换所有 `@sdd-*` 为 `@sddu-*`，现有用户的工作流会断裂。

**缓解措施**:
- 在 opencode.json 中同时保留旧的和新的 agent 定义
- 旧 agent 指向相同的 prompt 文件
- 在文档中明确标注 Deprecated 警告

**示例配置**:
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

#### 4.1.2 目录结构变更导致的文件丢失
**风险等级**: 🟡 中

**描述**: 如果将 `.sdd/` 目录改名为 `.sddu/`，可能导致:
- 现有工作空间文件找不到
- 状态文件路径断裂
- 历史 Feature 无法访问

**缓解措施**:
- **不建议**强制改名 `.sdd/` 目录
- 提供迁移脚本供用户选择使用
- 代码中同时支持两种目录名

#### 4.1.3 构建产物不一致
**风险等级**: 🟡 中

**描述**: `dist/sdd/` 目录改名可能导致:
- 安装脚本找不到目标目录
- 打包产物路径错误

**缓解措施**:
- 更新 `scripts/package.cjs` 中的输出目录
- 更新 `install.sh` 和 `install.ps1` 中的路径引用

### 4.2 用户风险

#### 4.2.1 学习成本
**风险等级**: 🟢 低

**描述**: 用户需要适应新的 Agent 名称。

**缓解措施**:
- 提供详细的改名对照表
- 在 Help Agent 中说明新旧名称映射
- 保持短时间的双名称支持

#### 4.2.2 文档混淆
**风险等级**: 🟡 中

**描述**: 新旧文档并存可能导致混淆。

**缓解措施**:
- 在旧文档顶部添加明显的更新提示
- 统一更新所有文档
- 维护单一的真实来源 (Single Source of Truth)

### 4.3 项目风险

#### 4.3.1 Git 历史断裂
**风险等级**: 🟡 中

**描述**: 大规模文件改名会导致 Git 历史难以追踪。

**缓解措施**:
- 使用 `git mv` 而非删除 + 新建
- 在单个 commit 中完成所有改名
- Commit message 清晰说明改名原因

#### 4.3.2 依赖项目断裂
**风险等级**: 🟡 中

**描述**: 如果有其他项目依赖此插件的包名。

**缓解措施**:
- 在 npm 上保留旧包名的 redirect (如果可能)
- 发布迁移公告
- 提供足够长的过渡期

---

## 5. 过渡策略建议

### 5.1 推荐策略：渐进式迁移

**阶段 1: 双名称并存** (2-4 周)
- 同时支持 `@sdd-*` 和 `@sddu-*`
- 旧名称标记为 deprecated
- 发布迁移指南

**阶段 2: 默认新名称** (4-8 周)
- 文档默认使用 `@sddu-*`
- 旧名称仍然可用但有警告
- 提供自动迁移脚本

**阶段 3: 移除旧名称** (8 周后)
- 在下一个大版本中移除旧名称
- 提前 2 周发出移除警告

### 5.2 目录改名策略

**建议**: 不强制改名 `.sdd/` 目录

**原因**:
1. `.sdd/` 已成为工作空间的实际标准
2. 改名成本高，收益低
3. 品牌名 SDDU 与目录名 .sdd 可以共存

**替代方案**:
- 新项目可以选择使用 `.sddu/`
- 代码同时支持 `.sdd/` 和 `.sddu/`
- 在文档中说明两者等价

### 5.3 包名迁移策略

**步骤**:
1. 在 npm 发布新包 `opencode-sddu-plugin`
2. 在旧包 `opencode-sdd-plugin` 的 README 添加迁移提示
3. 旧包发布最后一个版本后标记为 deprecated
4. 新包作为主要维护版本

---

## 6. 实施清单

### 6.1 必须修改 (P0)

- [ ] `package.json` - 包名、脚本名
- [ ] `opencode.json` - plugin 引用、所有 agent 定义
- [ ] `src/index.ts` - 插件导出名、日志服务名
- [ ] `src/agents/sdd-agents.ts` - agent 注册
- [ ] `src/templates/agents/*.hbs` - 所有 11 个模板文件
- [ ] `README.md` - 主文档
- [ ] `.opencode/plugins/sdd/opencode.json` - 插件配置
- [ ] `.opencode/plugins/sdd/package.json` - 插件包配置

### 6.2 建议修改 (P1)

- [ ] `src/errors.ts` - 错误前缀
- [ ] `.tool/sdd_update_state.js` - 工具名
- [ ] `install.sh` - 安装脚本输出
- [ ] `install.ps1` - 安装脚本输出
- [ ] `build-agents.cjs` - Agent 生成脚本
- [ ] `scripts/package.cjs` - 打包脚本
- [ ] `.sdd/README.md` - 工作空间说明
- [ ] `.sdd/TREE.md` - 目录结构规范
- [ ] `docs/migration-guide.md` - 迁移指南
- [ ] `docs/containerization-faq.md` - FAQ

### 6.3 可选修改 (P2)

- [ ] `CHANGELOG.md` - 历史版本记录（建议保留原样）
- [ ] `RELEASE-NOTES.md` - 发布说明（建议保留原样）
- [ ] specs-tree 现有 Feature 目录名（建议保留）
- [ ] `.sdd/` 目录改名（不建议）
- [ ] 测试文件中的描述文本

### 6.4 测试验证清单

- [ ] 插件可以正常安装
- [ ] 所有 Agent 可以正常调用
- [ ] 工作流可以正常运行（spec→plan→tasks→build→review→validate）
- [ ] 状态更新工具正常工作
- [ ] 目录导航生成正常
- [ ] 向后兼容性验证（旧 Agent 名称仍可用）

---

## 7. 工作量估算

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

## 8. 验收标准

### 8.1 功能验收

- [ ] 新插件名 `opencode-sddu-plugin` 可以正常安装
- [ ] 所有 16+ 个 Agent (`@sddu-*`) 可以正常调用
- [ ] 工作流完整运行无错误
- [ ] 向后兼容层正常工作（`@sdd-*` 仍可用）

### 8.2 文档验收

- [ ] README.md 完全更新为新品牌
- [ ] 所有 Agent 描述更新
- [ ] 迁移指南发布
- [ ] 帮助文档更新

### 8.3 技术验收

- [ ] 所有测试通过
- [ ] 构建产物正确（`dist/sddu/` 或保持 `dist/sdd/`）
- [ ] 安装包结构正确
- [ ] Git 历史清晰

---

## 9. 附录

### 9.1 文件扫描统计

```
总匹配数: 2224+ 处 "sdd"/"SDD" 引用

按文件类型分布:
- .ts 文件: ~150 处
- .js 文件: ~200 处
- .json 文件: ~100 处
- .md 文件: ~800 处
- .hbs 模板: ~400 处
- .sh/.cjs 脚本: ~100 处
- 测试文件: ~300 处
- 其他: ~174 处
```

### 9.2 关键路径汇总

```
核心配置:
- /home/usb/workspace/wks-sddu/sddu/package.json
- /home/usb/workspace/wks-sddu/sddu/opencode.json
- /home/usb/workspace/wks-sddu/sddu/.opencode/plugins/sdd/opencode.json

核心代码:
- /home/usb/workspace/wks-sddu/sddu/src/index.ts
- /home/usb/workspace/wks-sddu/sddu/src/agents/sdd-agents.ts
- /home/usb/workspace/wks-sddu/sddu/src/errors.ts

模板文件:
- /home/usb/workspace/wks-sddu/sddu/src/templates/agents/*.hbs (11 个文件)

文档:
- /home/usb/workspace/wks-sddu/sddu/README.md
- /home/usb/workspace/wks-sddu/sddu/.sdd/README.md
- /home/usb/workspace/wks-sddu/sddu/.sdd/TREE.md
- /home/usb/workspace/wks-sddu/sddu/.sdd/ROADMAP.md

脚本:
- /home/usb/workspace/wks-sddu/sddu/install.sh
- /home/usb/workspace/wks-sddu/sddu/install.ps1
- /home/usb/workspace/wks-sddu/sddu/build-agents.cjs
- /home/usb/workspace/wks-sddu/sddu/scripts/package.cjs

工具:
- /home/usb/workspace/wks-sddu/sddu/.tool/sdd_update_state.js
```

### 9.3 改名对照表

| 类别 | 旧名称 | 新名称 | 备注 |
|------|--------|--------|------|
| 插件名 | OpenCode SDD Plugin | OpenCode SDDU Plugin | 必须 |
| 包名 | opencode-sdd-plugin | opencode-sddu-plugin | 必须 |
| Agent 前缀 | @sdd-* | @sddu-* | 建议双支持 |
| 工作目录 | .sdd/ | .sddu/ | 可选 |
| 工具前缀 | sdd_* | sddu_* | 建议双支持 |
| 错误前缀 | [SDD- | [SDDU- | 建议 |
| 类前缀 | Sdd* | Sddu* | 建议 |

---

**Discovery 完成时间**: 2026-04-06  
**Discovery Agent**: SDD Discovery Agent  
**下一步**: 创建 spec.md 规范文档
