# ADR-001: Agent-Native 扫描方案选择

## 状态
PROPOSED

## 背景

`@sddu-docs` 是 SDDU 框架中唯一的半成品 Agent —— 指令模板 §5 工作流程为「待后续 Feature 定义」占位文本，无输出模板，无产物落盘机制。completion 本 Feature 需要决策 `@sddu-docs` 的核心技术实现路径。

当前 SDDU 框架已有 10 个完成的 Agent，全部采用 **Agent-Native** 模式：Agent 指令模板（Markdown）驱动 LLM 使用 `glob` / `read` / `grep` / `bash` 等工具执行扫描、提取、聚合、写入等操作。所有逻辑内嵌于指令模板的 Markdown 文本中，无需额外的脚本或中间格式。

核心问题：扫描 Feature 目录并聚合信息的逻辑应该放在哪里？
- Agent 指令模板中（让 LLM 驱动执行）
- 独立的 Node.js 脚本中（程序化执行）
- 混合方案（脚本 + Agent 各司其职）

## 决策

我们决定采用 **方案 A：Agent-Native 扫描**。所有 Feature 扫描、产物提取、信息聚合逻辑均在 `src/templates/agents/sddu-docs.md.hbs` 指令模板中定义，由 LLM Agent 执行。输出格式由 Handlebars 产物模板定义，产物落盘到 `.sddu/docs-tree-root/` 目录树。

### 具体实现

1. **指令模板** (`src/templates/agents/sddu-docs.md.hbs`):
   - §5 工作流程从一行占位扩展为 6 步骤可执行流程
   - 步骤包含：工作空间验证 → Feature 扫描 → 产物提取 → 模板选择 → 增量/全量分支 → 产物落盘（目录树）
   - 每步有明确的工具调用指令（glob / read / grep / stat / write / mkdir）
   - 所有边界情况（EC-001 ~ EC-011）在 §8 异常处理中定义

2. **产物模板库** (`src/templates/outputs/docs/`):
   - 按场景分子目录：`base/`（基础通用）、`web/`（Web 应用）、`lib/`（库/SDK）、`cli/`（CLI 工具）
   - 基础模板：`docs-overview.md.hbs`（全层级入口）、`docs-object.md.hbs`（业务对象）、`docs-adr-index.md.hbs`、`docs-source.md.hbs`
   - 场景变体覆盖同名模板（如 `web/docs-object.md.hbs` 覆盖 `base/docs-object.md.hbs`），新增场景只需新建子目录
   - 总计 10 个内置模板文件
   - 使用 `<<变量名>>` 占位符（与现有 7 个 output 模板一致）

3. **产物形态**：`.sddu/docs-tree-root/` 目录树
   - 按业务层级组织（子系统 → 模块 → 对象）
   - 每级目录包含 `docs-overview.md` 入口 + 可选 `adr-index.md` / `specs-source.md` + 业务对象 `.md`
   - 支持增量更新：对比 mtime → 仅重写变更 Feature 的子树

### 对比的其他方案

| 方案 | 结论 |
|------|------|
| 方案 B: 混合缓存层 | 引入 `.cache.json` 增加维护复杂度，LLM 写入 JSON 格式不可靠，不推荐 |
| 方案 C: 构建脚本驱动 | 引入新组件（`build-docs.cjs`）违反 NG-003，state.json 格式不统一导致脚本脆弱，不推荐 |

## 后果

### 正面影响
- ✅ **一致性**: 与 SDDU 所有 10 个已完成 Agent 保持相同技术路径，用户和下游 Agent 无额外学习成本
- ✅ **简单性**: 变更范围 —— 新增模板库目录（10 个模板）+ 修改 1 个指令模板 + 修改 build-agents.cjs（递归复制），不引入新组件
- ✅ **可维护性**: Agent 行为逻辑即文档本身（Markdown 自然语言），修改后即时生效，无需编译/测试脚本
- ✅ **容错性**: LLM 天然能处理格式不完全标准的 spec.md（章节标题微调、表格列宽变化等），优于脚本的精确匹配

### 负面/风险
- ⚠️ **LLM 依赖性**: 聚合质量依赖 LLM 对指令的遵循度，增量更新的 mtime 获取需通过 bash `stat` 命令（LLM 需正确解析命令输出）
- ⚠️ **上下文窗口**: 若 Feature 数量大幅增长（>30 个），全量读取可能接近 LLM 上下文上限（当前 17 个 Feature 安全）
- ⚠️ **输出一致性**: 纯 LLM 驱动的聚合可能在多次运行中产生微妙差异，需通过输出模板结构约束 + review 阶段验证双保险

### 缓解措施
1. 指令模板使用 `### 步骤 N:` 明确编号，每步结尾标注 `→ 进入步骤 N+1`，确保 LLM 按序执行
2. R4（大项目性能）远期通过分批扫描 + 流式聚合解决（纳入未来 Feature）
3. 增量更新在 mtime 对比失败时自动退化为全量更新

---

## 相关文档
- Feature Spec: `.sddu/specs-tree-root/specs-tree-docs-agent-optimization/spec.md` (v1.3)
- 技术计划: `.sddu/specs-tree-root/specs-tree-docs-agent-optimization/plan.md`
- ADR-002: `./ADR-002-three-agent-boundary-definition.md`

## 修订记录
| 版本 | 变更说明 | 日期 | 修订人 |
|------|---------|------|--------|
| v1.0 | 初始创建 — Agent-Native 方案 ARCHITECTURE 决策 | 2026-07-04 | SDDU Plan Agent |
| v1.1 | 更新为目录树方案 — 产物形态、模板库结构、build-agents 递归复制 | 2026-07-05 | SDDU Plan Agent |
