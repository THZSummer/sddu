# 需求挖掘报告：Plugin Rename SDDU V2

**Feature**: Plugin Rename SDDU V2  
**版本**: 2.0.0  
**创建日期**: 2026-04-09  
**状态**: discovered  
**优先级**: P1  

---

## 1. 问题定义

### 核心问题
V1 插件改名项目虽然完成了品牌升级，但**代码中残留大量 SDD 字眼未彻底替换为 SDDU**：
1. **模板文件残留**: `src/templates/agents/*.hbs` 中仍使用 `@sdd-*` 而非 `@sddu-*`
2. **源码注释残留**: `src/index.ts` 等文件中仍有 "SDD Plugin" 描述
3. **配置引用残留**: 配置文件中可能仍有 `opencode-sdd-plugin` 引用
4. **类型定义残留**: `SddConfig`、`SddPhase` 等类型名未统一改为 `Sddu*`

### 业务价值
- **品牌一致性**: 确保所有代码、文档、配置 100% 使用 SDDU 品牌
- **降低混淆**: 避免新开发人员被 SDD/SDDU 混合命名搞混
- **维护简化**: 统一命名减少认知负担，提升维护效率
- **彻底切割**: 不再支持向后兼容，完全转向 SDDU

### 不做的成本
- 品牌不一致影响专业形象
- 新成员学习成本增加（需理解 SDD vs SDDU 区别）
- 长期维护需同时考虑两种命名
- 代码搜索和定位效率降低

---

## 2. 用户画像

### 主要用户
| 角色 | 诉求 | 痛点 |
|------|------|------|
| **内部开发人员** | 一致的品牌体验，清晰的代码命名 | 代码中 SDD/SDDU 混用，容易混淆 |
| **工具维护者** | 统一的命名规范，便于搜索和定位 | 搜索 "sdd" 会出现大量应改为 "sddu" 的结果 |
| **新加入成员** | 快速理解项目结构，无历史负担 | 看到 SDD 和 SDDU 混合，不清楚应该用哪个 |

### 用户场景还原
1. **场景**: 新开发人员查看源码，想理解 Agent 如何工作
   - **现状**: 模板文件中使用 `@sdd-*`，但文档中说应该用 `@sddu-*`，造成困惑
   - **期望**: 所有代码和文档统一使用 `@sddu-*`

2. **场景**: 维护者搜索 "SDD" 相关代码
   - **现状**: 搜索结果包含应保留的（如向后兼容代码）和应删除的（如遗留引用）
   - **期望**: **V2 不做向后兼容，所有 SDD 引用都应改为 SDDU**

3. **场景**: 代码审查时检查命名规范
   - **现状**: 需要逐一检查是否有 SDD 残留
   - **期望**: 自动化检查工具确保 100% SDDU 化，**不保留任何 SDD 兼容**

---

## 3. 需求清单

### Must Have（必备）
- [ ] **模板文件清理**: `src/templates/agents/*.hbs` 中所有 `@sdd-*` 改为 `@sddu-*`
- [ ] **源码注释清理**: 所有注释中的 "SDD Plugin" 改为 "SDDU Plugin"
- [ ] **类型定义清理**: `SddConfig` → `SdduConfig`, `SddPhase` → `SdduPhase` 等
- [ ] **配置引用清理**: 所有配置文件中的 `opencode-sdd-plugin` 改为 `opencode-sddu-plugin`
- [ ] **错误前缀清理**: `[SDD-` → `[SDDU-`, `SddError` → `SdduError`
- [ ] **全面扫描**: 使用 grep/ripgrep 扫描所有 `sdd` 关键字，逐一确认是否应改为 `sddu`

### Should Have（期望）
- [ ] **自动化检查工具**: 创建脚本检测 SDD 残留
- [ ] **清理清单文档**: 记录所有需要修改的文件和位置
- [ ] **回归测试**: 确保清理后功能正常

### Could Have（惊喜）
- [ ] **CI 集成**: 在 CI 中添加 SDD 残留检测
- [ ] **命名规范约束**: 在 TypeScript 中通过类型约束防止 SDD 命名重现

---

## 4. 推荐方案

### 方案概述
采用"彻底清理"策略，聚焦于：
1. 全面扫描代码库，识别所有 SDD 残留
2. 分类处理：直接替换、保留（向后兼容）、删除
3. 逐一修改并验证
4. 创建自动化检查工具防止回潮

### 选择理由
- V1 已完成品牌升级，但清理不彻底
- 内部开发工具应完全使用新品牌，不做向后兼容
- 统一命名提升长期可维护性

### 差异化优势
- 相比 V1 的"双名称并存"，V2 采用"彻底 SDDU 化"
- 创建自动化检查工具，确保长期一致性

---

## 5. 成功指标

### 北极星指标
**SDD 残留清理率**: 代码中 SDD 字眼清理率 ≥ 98%（仅保留明确的向后兼容代码）

### 目标数值
| 指标 | 基线 (V1) | 目标 (V2) |
|------|----------|----------|
| 模板文件中 `@sdd-*` 引用 | 11 个 | 0 个 |
| 源码注释中 "SDD" 字眼 | 20+ 处 | 0 处 |
| 类型定义中 `Sdd*` | 10+ 个 | 0 个（除向后兼容层） |
| 配置中 `opencode-sdd-plugin` | 5+ 处 | 0 处 |
| 自动化检查覆盖率 | 0% | 100% |

---

## 6. 范围边界

### 核心原则：修改源码，不修改生成物

**修改策略**:
```
src/ (源码 - 直接修改)
     ↓ 构建/安装时自动生成
.opencode/*, .sdd/*, .sddu/*, opencode.json (生成物 - ❌ 不修改)
dist/* (构建产物 - ❌ 不修改)
```

### 必须修改 (✅ 源码)
| 类别 | 路径 | 说明 |
|------|------|------|
| 源码 | `src/**/*.ts` | TypeScript 源码文件 |
| 模板 | `src/templates/**/*.hbs` | Handlebars 模板文件 |
| 配置模型 | `src/config/*.ts` | 配置模型源码 |
| 根目录文档 | `README.md`, `docs/*.md` | 源码文档 |
| 脚本 | `install.sh`, `install.ps1`, `scripts/*` | 安装和打包脚本 |

### 禁止修改 (❌ 生成物)
| 类别 | 路径 | 说明 |
|------|------|------|
| 插件配置 | `.opencode/*` | 安装插件时自动生成 |
| 工作空间 | `.sdd/*`, `.sddu/*` | 工作流运行时自动生成 |
| 根目录配置 | `opencode.json` | 安装插件时自动生成 |
| 构建产物 | `dist/*` | 构建时自动生成 |

**正确做法**:
- ✅ 直接修改 `src/config/opencode-config.ts` 配置模型
- ✅ 修改后运行 `npm run build` 重新生成 `dist/*`
- ✅ 修改后重新安装插件更新 `.opencode/*`、`opencode.json`

**错误做法**:
- ❌ 直接编辑 `opencode.json`
- ❌ 直接编辑 `.sdd/*` 或 `.sddu/*`
- ❌ 直接编辑 `.opencode/*`
- ❌ 直接编辑 `dist/*`

---

### MVP 范围
1. 扫描并列出所有 SDD 残留位置（仅限 `src/` 和 `src/templates/`）
2. 修改模板文件中的 `@sdd-*` 为 `@sddu-*`
3. 修改源码注释和类型定义
4. 验证修改后功能正常

### V1 范围（包含 MVP）
5. 创建自动化检查脚本
6. 更新所有相关文档（`README.md`, `docs/*.md`）
7. 确保 CI/CD 流程正常

### 明确不做
- ❌ 不保留 `@sdd-*` 向后兼容（V1 已做，V2 彻底清理）
- ❌ 不修改核心功能逻辑（仅改命名）
- ❌ 不创建迁移工具（内部工具，直接替换）
- ❌ **不直接修改生成物**（`.opencode/*`, `.sdd/*`, `.sddu/*`, `opencode.json`, `dist/*`）

---

## 7. 风险与假设

### 关键假设
- 假设所有 SDD 残留都应该改为 SDDU（除了明确标注的向后兼容代码）
- 假设修改后不影响现有功能
- 假设团队已准备好完全切换到 SDDU

### 主要风险
| 风险 | 等级 | 缓解措施 |
|------|------|---------|
| 误改向后兼容代码 | 🟡 中 | 修改前标记哪些是向后兼容层，不应修改 |
| 修改后功能异常 | 🟡 中 | 完整测试工作流，确保所有 Agent 正常 |
| 遗漏某些 SDD 残留 | 🟢 低 | 使用自动化扫描工具，多轮检查 |

### 验证计划
1. 修改前创建完整备份
2. 使用 grep/ripgrep 全面扫描
3. 修改后运行完整工作流测试（spec→plan→tasks→build→review→validate）
4. 检查所有 Agent 调用正常

---

## 8. 下一步建议

### 立即可执行
1. ✅ 需求挖掘完成
2. 👉 运行 `@sddu-spec plugin-rename-sddu-v2` 开始规范编写
3. 👉 更新状态：`/tool sddu_update_state {"feature": "specs-tree-plugin-rename-sddu-v2", "state": "discovered"}`

### 规范编写重点关注
- 列出所有需要扫描的文件类型和位置
- 定义 SDD→SDDU 的完整替换规则
- 明确哪些 SDD 引用应该保留（如向后兼容层）
- 创建验收检查清单

---

## 附录：V1 SDD 残留扫描结果（2026-04-09 实际扫描）

### 高优先级问题（必须修改）

| # | 文件 | 问题描述 | 修改方案 |
|---|------|----------|---------|
| 1 | `src/index.ts` | 第 1 行注释 `// SDD Plugin for OpenCode` | 改为 `// SDDU Plugin for OpenCode` |
| 2 | `src/types.ts` | 第 100 行 `export interface SddConfig` | 改为 `export interface SdduConfig` |
| 3 | `src/state/machine.ts` | 第 17 行 `export type SddPhase` | 改为 `export type SdduPhase` |
| 4 | `src/templates/agents/sddu-help.md.hbs` | 18 处 `@sdd-*` 引用（向后兼容说明） | 评估是否删除向后兼容描述 |
| 5 | `src/templates/agents/sddu.md.hbs` | 4 处 `@sdd-*` 引用 | 评估是否删除向后兼容描述 |
| 6 | `src/templates/agents/sddu-tasks.md.hbs` | 8 处 `@sdd-*` 引用 | 评估是否删除向后兼容描述 |
| 7 | `src/templates/agents/sddu-build.md.hbs` | 6 处 `@sdd-*` 引用 | 评估是否删除向后兼容描述 |
| 8 | `src/templates/agents/sddu-discovery.md.hbs` | 4 处 `@sdd-*` 引用 | 评估是否删除向后兼容描述 |
| 9 | `src/templates/agents/sddu-roadmap.md.hbs` | 2 处 `@sdd-*` 引用 | 评估是否删除向后兼容描述 |
| 10 | `src/templates/agents/sddu-docs.md.hbs` | 3 处 `@sdd-*` 引用 | 评估是否删除向后兼容描述 |

### 中优先级问题（测试文件）

| # | 文件 | 问题描述 | 建议 |
|---|------|----------|------|
| 1 | `src/types.test.ts` | 2 处 `SddConfig` 引用 | 测试文件，可保留或改为 `SdduConfig` |
| 2 | `src/errors.test.ts` | 2 处 `SddError` 引用 | 测试文件，可保留或改为 `SdduError` |

### 低优先级问题（需进一步扫描）

- `src/agents/registry.ts` - 可能包含 `sdd-` 过滤条件

### ❌ 排除范围（生成物，不扫描）

以下文件是**安装/构建时自动生成**，不纳入修改范围：

| 类别 | 路径 | 说明 |
|------|------|------|
| 插件配置 | `.opencode/*` | 安装插件时自动生成 |
| 工作空间 | `.sdd/*`, `.sddu/*` | 工作流运行时自动生成 |
| 根目录配置 | `opencode.json` | 安装插件时自动生成 |
| 构建产物 | `dist/*` | 构建时自动生成 |

**正确做法**: 修改 `src/` 源码后，通过以下完整流程验证：
1. 运行 `npm run clean` 清理旧构建产物
2. 运行 `npm install` 安装依赖
3. 运行 `npm run build` 构建
4. 运行 `npm run package` 打包
5. 运行 E2E 脚本生成测试项目
6. 验证测试项目结构符合预期
7. 如不符合预期，返回步骤 1 重新修改源码并执行完整流程
8. 直到符合预期后再继续后续工作

**错误做法**:
- ❌ 直接编辑 `opencode.json`
- ❌ 直接编辑 `.sdd/*` 或 `.sddu/*`
- ❌ 直接编辑 `.opencode/*`
- ❌ 直接编辑 `dist/*`
- ❌ **直接在当前项目安装未经测试的插件**（高危！）
- ❌ 手动创建测试项目（应使用 E2E 脚本自动生成）
- ❌ 跳过 `npm run clean` 或 `npm run package` 步骤

---

**需求挖掘完成时间**: 2026-04-09  
**需求挖掘状态**: discovered  
**下一步**: 运行 `@sddu-spec plugin-rename-sddu-v2` 开始规范编写
