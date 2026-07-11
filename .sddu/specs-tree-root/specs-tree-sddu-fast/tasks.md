# 任务分解：@sddu-fast 快速模式 Agent

> **文档定位**: SDDU 任务清单 — 将技术方案分解为可并行执行的原子任务，作为 build 阶段的输入  
> **前置依赖**: plan.md（技术方案）、spec.md（需求规范）  
> **创建人**: SDDU Tasks Agent  
> **创建时间**: 2026-07-12  
> **版本**: v1.0  
> **更新人**: SDDU Tasks Agent  
> **更新时间**: 2026-07-12  
> **更新说明**: 初始创建 — 基于 plan.md v1.1 + spec.md v1.1 分解 5 个原子任务

## 1. 依赖拓扑总览
> 任务依赖关系和执行顺序

```
Wave 1 ─── (无依赖，5 个任务可全部并行 — 各自修改不同文件)
  TASK-001 [L]  创建 sddu-fast Agent 行为模板（核心，~200 行）
  TASK-002 [S]  注册 sddu-fast 到 TypeScript Agent 注册表
  TASK-003 [S]  注册 sddu-fast 到 OpenCode JSON 配置
  TASK-004 [M]  扩展 @sddu 协调器：路由表 + 调度逻辑 + 示例
  TASK-005 [S]  更新 README 双模架构说明
```

> **说明**：全部 5 个任务分属 5 个不同文件，无代码级依赖。plan.md §2.3 和 §4.1 已精确定义协调器和 README 的变更内容，无需等待模板完成即可并行开工。

## 2. 任务列表
> 每个任务的详细定义

### TASK-001: 创建 sddu-fast Agent 行为模板
> 核心产出 — Fast Agent 的 Handlebars 行为模板，定义其完整行为指令

| 属性 | 值 |
|------|-----|
| **复杂度** | L |
| **前置依赖** | 无 |
| **执行波次** | 1 |
| **对应 FR** | FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, FR-008, FR-010 |
| **对应 NFR** | NFR-002 |

**描述**: 创建 `src/templates/agents/sddu-fast.md.hbs`，作为 Fast Agent 的行为唯一定义来源。模板需包含以下核心章节（对齐 spec §5 全部 FR 和 plan §4.1.2 升级阈值）：

1. **Frontmatter** — `description`、`mode: subagent`、`temperature`、`permission`（edit/bash allow）
2. **§1 角色定位与职责边界** — 四字段声明（负责/输入/输出/不负责），明确"无状态、零产物、单会话解决"
3. **§2 执行顺序** — "不适用（非管道 Agent，独立于 SDDU 阶段流程）"
4. **§3 前置条件** — 无强制前置，参考 plan §5 上下文感知策略
5. **§4 领域知识注入策略** — 按需读取：specs-tree-root、docs-tree-root、ROADMAP、Agent 注册、TREE 结构（FR-004、FR-005）
6. **§5 上下文感知读取规则** — 5 类信息源按需读取策略
7. **§6 任务边界自律清单** — 适合/不适合 Fast 的任务对照表 + plan §4.1.2 升级阈值（文件数≥5、API 签名变更、跨模块≥2 等）
8. **§7 升级建议输出格式** — 判断理由 + 建议起点 + 操作命令（FR-007、EC-001、EC-006）
9. **§8 行为约束** — 禁止清单（禁止 phase 操作、禁止写入文档、禁止创建目录、禁止操作 .sddu/ 等至少 8 项）
10. **§9 双入口消歧** — welcome 消息明确说明定位（FR-010）
11. **§10 错误处理策略** — 文件读取失败、命令执行错误、上下文模糊时的处理（NFR-004、EC-002）
12. **§11 边界情况处理** — EC-001~EC-009 各场景的处理逻辑
13. **修订记录** — 版本历史表格

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| NEW | `src/templates/agents/sddu-fast.md.hbs` |

**验收标准**:
- [ ] 文件 `src/templates/agents/sddu-fast.md.hbs` 存在且包含有效 Handlebars frontmatter（`---` 分隔）
- [ ] Frontmatter 中 `mode` 为 `subagent`，`permission` 含 `edit: allow` 和 `bash: allow`
- [ ] 模板全文**不含** `phase`、`status`、`state.json` 写入指令（允许在禁止清单中提及）
- [ ] 模板全文**不含**"写入文档"或"创建 Feature 目录"的指令
- [ ] 模板包含"升级阈值"表（至少含文件数 ≥5、API 签名变更、跨模块 ≥2 三项阈值）
- [ ] 模板包含"禁止行为清单"（至少 8 项禁止项）
- [ ] 模板包含"任务边界对照表"（至少列明适合/不适合/边界模糊三类各 3 条）
- [ ] 模板包含 welcome 消息，说明 Fast 模式定位（"适合 X 类任务，不适合 Y 类任务"）
- [ ] 模板包含错误处理策略（至少覆盖文件读取失败、命令执行错误、上下文模糊 3 种场景）
- [ ] 模板包含 EC-001~EC-009 各边界情况的处理逻辑
- [ ] 文件总行数 ≥ 180 行（基于 spec 定义的 12 个核心章节 + 详细内容）

**验证命令**:
```bash
# V-A: 模板文件存在且非空
test -f src/templates/agents/sddu-fast.md.hbs && test -s src/templates/agents/sddu-fast.md.hbs && echo "PASS" || echo "FAIL: 文件不存在或为空"

# V-B: 模板包含 Handlebars frontmatter（两处 --- 分隔）
test $(grep -c '^---$' src/templates/agents/sddu-fast.md.hbs) -ge 2 && echo "PASS" || echo "FAIL: 缺少 frontmatter 分隔符"

# V-C: 模板不含 phase/state.json 写入指令（仅允许在禁止清单中提及）
! grep -nP '(?<!禁止)(写入|修改|更新|创建).*(phase|state\.json|state\.md|state\.yaml)' src/templates/agents/sddu-fast.md.hbs && echo "PASS" || echo "WARN: 含疑似 phase/state 操作指令，请人工复查"

# V-D: 模板声明 mode 为 subagent
grep -q 'mode:.*subagent' src/templates/agents/sddu-fast.md.hbs && echo "PASS" || echo "FAIL: mode 未设为 subagent"

# V-E: 模板包含核心章节关键词
for kw in "角色定位" "升级阈值" "禁止行为" "任务边界" "错误处理" "welcome" "前置条件" "上下文感知"; do
  grep -qi "$kw" src/templates/agents/sddu-fast.md.hbs || echo "FAIL: 缺少章节「$kw」"
done && echo "DONE: 核心章节检查完成"

# V-F: 行数充足（≥180 行）
lines=$(wc -l < src/templates/agents/sddu-fast.md.hbs)
test $lines -ge 180 && echo "PASS: $lines 行" || echo "FAIL: 仅 $lines 行（预期 ≥180）"
```

---

### TASK-002: 注册 sddu-fast 到 TypeScript Agent 注册表
> 在 builtinAgents[] 中新增条目，明确不加入 agentToPhaseMap

| 属性 | 值 |
|------|-----|
| **复杂度** | S |
| **前置依赖** | 无 |
| **执行波次** | 1 |
| **对应 FR** | FR-001 |
| **对应 NFR** | NFR-006 |

**描述**: 修改 `src/adapters/opencode/agents/sddu-agents.ts`，在 `builtinAgents[]` 数组末尾（`sddu-docs` 条目之后）新增 `sddu-fast` 条目。关键约束：**不加入** `agentToPhaseMap`，因为 Fast Agent 无阶段概念、不参与状态机流转。

新增条目格式：
```typescript
{
  name: 'sddu-fast',
  description: 'SDDU 快速模式 - 轻量任务直接解决（无状态、零产物）',
  mode: 'subagent',
  promptFile: '.opencode/agents/sddu-fast.md'
}
```

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| MODIFY | `src/adapters/opencode/agents/sddu-agents.ts` |

**验收标准**:
- [ ] `builtinAgents[]` 数组末尾附近存在 `name: 'sddu-fast'` 的条目
- [ ] 该条目含 `mode: 'subagent'` 和 `promptFile: '.opencode/agents/sddu-fast.md'`
- [ ] `agentToPhaseMap` 中**不含** `sddu-fast`（Fast 无阶段）
- [ ] 新增条目未破坏现有 11 个 Agent 的注册（数组其他条目不变）
- [ ] TypeScript 编译无新增类型错误（`npx tsc --noEmit` 通过）

**验证命令**:
```bash
# V-A: builtinAgents 含 sddu-fast 条目
grep -q "name: 'sddu-fast'" src/adapters/opencode/agents/sddu-agents.ts && echo "PASS" || echo "FAIL: builtinAgents 缺少 sddu-fast"

# V-B: agentToPhaseMap 不含 sddu-fast（Fast 无阶段）
! grep -A100 "agentToPhaseMap" src/adapters/opencode/agents/sddu-agents.ts | grep -q "'sddu-fast'" && echo "PASS" || echo "FAIL: agentToPhaseMap 不应包含 sddu-fast"

# V-C: 现有 Agent 条目数不变（原 11 个 + 新增 1 个 = 12 个）
count=$(grep -c "name: 'sddu-" src/adapters/opencode/agents/sddu-agents.ts)
test $count -ge 12 && echo "PASS: $count 个 sddu-* Agent" || echo "FAIL: 仅 $count 个"

# V-D: TypeScript 编译无回归（在项目根目录执行）
npx tsc --noEmit 2>&1 | grep -v "node_modules" | grep -q "error" && echo "FAIL: TypeScript 编译报错" || echo "PASS"
```

---

### TASK-003: 注册 sddu-fast 到 OpenCode JSON 配置
> 在 opencode.json.hbs 的 agent:{} 块中新增 sddu-fast 条目

| 属性 | 值 |
|------|-----|
| **复杂度** | S |
| **前置依赖** | 无 |
| **执行波次** | 1 |
| **对应 FR** | FR-001 |
| **对应 NFR** | NFR-006 |

**描述**: 修改 `src/adapters/opencode/templates/opencode.json.hbs`，在 `agent:{}` 块末尾（`sddu-docs` 条目之后）新增 `sddu-fast` 条目。格式与其他 Agent 一致——`model` 使用 `"opencode/deepseek-v4-flash-free"`，`prompt` 使用 `"{file:.opencode/agents/sddu-fast.md}"`。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| MODIFY | `src/adapters/opencode/templates/opencode.json.hbs` |

**验收标准**:
- [ ] `agent:{}` 块中新增 `"sddu-fast"` 条目
- [ ] `model` 字段值为 `"opencode/deepseek-v4-flash-free"`
- [ ] `prompt` 字段值为 `"{file:.opencode/agents/sddu-fast.md}"`
- [ ] `description` 字段说明快速定位（"SDDU 快速模式 - 轻量任务直接解决"）
- [ ] JSON 格式有效（`python3 -m json.tool` 可解析）
- [ ] 原有 11 个 Agent 条目未被意外修改

**验证命令**:
```bash
# V-A: agent 块含 sddu-fast 条目
grep -A5 '"sddu-fast"' src/adapters/opencode/templates/opencode.json.hbs | grep -q 'opencode/deepseek-v4-flash-free' && echo "PASS" || echo "FAIL: sddu-fast 条目不完整"

# V-B: prompt 路径正确
grep -A5 '"sddu-fast"' src/adapters/opencode/templates/opencode.json.hbs | grep -q '.opencode/agents/sddu-fast.md' && echo "PASS" || echo "FAIL: prompt 路径错误"

# V-C: JSON 格式有效（需临时替换 Handlebars 变量为占位值后验证）
sed 's/{{[^}]*}}/"__TMP__"/g' src/adapters/opencode/templates/opencode.json.hbs | python3 -m json.tool > /dev/null 2>&1 && echo "PASS" || echo "FAIL: JSON 格式无效"

# V-D: 原有 Agent 条目数不变（原 11 个 + 新增 1 个 = 12 个）
grep -c '"sddu-[a-z]' src/adapters/opencode/templates/opencode.json.hbs | xargs -I{} test {} -ge 12 && echo "PASS" || echo "FAIL: Agent 条目数异常"
```

---

### TASK-004: 扩展 @sddu 协调器路由与调度逻辑
> 在 sddu.md.hbs 中三处修改：路由表 + 简单任务调度 + 示例对话

| 属性 | 值 |
|------|-----|
| **复杂度** | M |
| **前置依赖** | 无 |
| **执行波次** | 1 |
| **对应 FR** | FR-001, FR-009 |

**描述**: 修改 `src/templates/agents/sddu.md.hbs`，完成以下三处变更（对齐 plan §2.3 和 §4.1.1）：

**① §3 路由目标表** — 在 `@sddu-docs` 行之后新增一行：
```
| @sddu-fast | — | 快速解决（轻量任务） |
```

**② 新增 §5.4 简单任务调度**（在 §5.3 之后）— 定义复杂度评估规则：
- 关键词匹配：含"修复"、"改一下"、"review"、"补充测试"、"调整配置"、"帮我看看"等轻量动词，且不含"设计"、"规划"、"立项"、"建立 Feature"等重量动词 → 路由到 `@sddu-fast`
- 意图模式：不匹配任何 pipeline Agent 调用模式，且为祈使句/提问句 → 路由到 `@sddu-fast`
- 保守策略：不确定时不调度到 Fast，在回复中给两个选项让用户决策
- 明确声明：调度到 `@sddu-fast` **不触发** phase 流转

**③ §11 示例对话** — 新增一个 Fast 调度示例：
```
**用户**: `@sddu "修复 src/config.ts 中 API_BASE_URL 的拼写错误"`
**你**: 识别为简单任务 → 路由到 @sddu-fast 处理 → 不触发 phase 流转。
```

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| MODIFY | `src/templates/agents/sddu.md.hbs` |

**验收标准**:
- [ ] §3 路由目标表含 `@sddu-fast` 行，阶段列为 `—`，说明列为 `快速解决（轻量任务）`
- [ ] 存在 `§5.4`（或等效的简单任务调度章节），位于 §5.3 之后
- [ ] §5.4 含关键词匹配规则（至少列出"修复"、"改一下"、"review" 三个轻量动词示例）
- [ ] §5.4 含保守策略声明（"不确定时不调度"）
- [ ] §5.4 明确声明调度到 Fast 不触发 phase 流转
- [ ] §11 示例对话含 `@sddu "修复..."` → 路由到 `@sddu-fast` 的示例
- [ ] `@sddu` 核心路由约束（"只路由不设计"）未被破坏
- [ ] `@sddu` 原有 9 个路由目标全部保留（无丢失）

**验证命令**:
```bash
# V-A: 路由表含 @sddu-fast 行
grep -q '@sddu-fast.*—.*快速解决' src/templates/agents/sddu.md.hbs && echo "PASS" || echo "FAIL: 路由表缺少 @sddu-fast"

# V-B: 存在简单任务调度章节（§5.4 或等效命名）
grep -qP '##\s+\d+\.\d+\s+(简单任务调度|Fast|快速模式).*调度' src/templates/agents/sddu.md.hbs && echo "PASS" || echo "WARN: 未找到简单任务调度章节"

# V-C: 调度逻辑含关键词匹配
grep -qP '(修复|改一下|review|补充测试|调整配置|帮我看看)' src/templates/agents/sddu.md.hbs && echo "PASS" || echo "WARN: 调度逻辑未找到关键词匹配示例"

# V-D: 调度逻辑含保守策略
grep -qi '不确定' src/templates/agents/sddu.md.hbs && echo "PASS" || echo "WARN: 未找到保守策略声明"

# V-E: 明确不触发 phase 流转
grep -qiP '(不触发|不做).*(phase|阶段|状态).*(流转|变更|更新)' src/templates/agents/sddu.md.hbs && echo "PASS" || echo "WARN: 未声明不触发 phase 流转"

# V-F: 原有 11 个路由目标全部保留
for agent in sddu-discovery sddu-spec sddu-plan sddu-tasks sddu-build sddu-review sddu-validate sddu-roadmap sddu-tree sddu-docs; do
  grep -q "@$agent" src/templates/agents/sddu.md.hbs || echo "FAIL: 路由表丢失 $agent"
done && echo "DONE: 全部路由目标检查完成"

# V-G: 示例对话含 Fast 调度示例
grep -qiP '修复.*拼写|路由.*sddu-fast' src/templates/agents/sddu.md.hbs && echo "PASS" || echo "WARN: 示例对话未找到 Fast 调度示例"
```

---

### TASK-005: 更新 README 双模架构说明
> 在项目 README 中体现 @sddu（完整流程）与 @sddu-fast（快速模式）的双模架构

| 属性 | 值 |
|------|-----|
| **复杂度** | S |
| **前置依赖** | 无 |
| **执行波次** | 1 |
| **对应 FR** | FR-010 |
| **对应 QP** | QP-002（已决策） |

**描述**: 修改 `README.md`，在适当位置（建议在"🎯 什么是 SDDU"章节之后、"⚡ 一分钟上手"之前）新增双模架构说明段。内容参考 plan §2.4 数据流图：

1. **双模对比表** — `@sddu`（完整流程：8 阶段管道，适合新 Feature 规划/复杂重构）vs `@sddu-fast`（快速模式：单 Agent 直接解决，适合 bug 修复/配置调整/code review）
2. **简单场景示例** — 修拼写用 Fast / 设计模块走完整流程 / 不确定时先用 Fast 试探
3. **入口指令** — `@sddu 开始 [feature]` 和 `@sddu-fast "任务描述"` 的具体用法
4. 更新"三个设计原则"后的描述，将 `@sddu-fast` 纳入"11 个专业 AI Agent"的统计（更新为 12 个）

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| MODIFY | `README.md` |

**验收标准**:
- [ ] README 含 `@sddu-fast` 的提及
- [ ] 存在双模对比说明（`@sddu` vs `@sddu-fast` 的定位差异）
- [ ] 含至少 2 个场景示例（修拼写用 Fast / 设计模块走完整流程）
- [ ] 用户读完能自行判断选哪个入口
- [ ] Agent 数量统计已更新为 12 个

**验证命令**:
```bash
# V-A: README 含 sddu-fast 提及
grep -qi 'sddu-fast' README.md && echo "PASS" || echo "FAIL: README 未提及 sddu-fast"

# V-B: 含双模对比说明
grep -qiP '(双模|两种模式|两个入口|快速模式.*完整流程|@sddu-fast.*@sddu)' README.md && echo "PASS" || echo "WARN: 未找到双模对比说明"

# V-C: 含场景示例
grep -qiP '(修.*拼写|fix.*typo|设计.*模块|design.*module|不确定.*先.*fast)' README.md && echo "PASS" || echo "WARN: 未找到场景示例"

# V-D: Agent 数量已更新
grep -q '12.*Agent' README.md && echo "PASS: Agent 数量已更新为 12" || echo "WARN: Agent 数量可能未更新"
```

---

## 3. 任务汇总
> 任务数量、复杂度和波次的统计总览

| 统计项 | 数值 |
|--------|:--:|
| 总任务数 | 5 |
| S 级 (简单) | 3 |
| M 级 (中等) | 1 |
| L 级 (复杂) | 1 |
| 执行波次 | 1 |

## 4. 执行策略
> 各波次的执行说明

| 波次 | 任务 | 策略 |
|:--:|------|------|
| 1 | TASK-001, TASK-002, TASK-003, TASK-004, TASK-005 | **全部并行** — 5 个任务各自修改不同文件，无代码级依赖。plan.md §2.3 和 §4.1 已精确定义协调器和 README 的变更内容，无需等待模板完成即可开工。建议优先执行 TASK-001（核心模板，工作量最大），然后 TASK-004（协调器，M 级），其余 S 级任务快速完成 |

> **注意**: 虽然全部 Wave 1 并行，但建议执行顺序为 TASK-001 → TASK-004 → (TASK-002 + TASK-003 + TASK-005 并行)。因为 TASK-001 是核心定义，TASK-004 的调度逻辑在理解模板内容后编写更准确。TASK-002/TASK-003/TASK-005 是纯配置/文档变更，无内容依赖。

## 5. FR 覆盖矩阵
> 每个功能需求由哪些任务实现

| FR | 描述 | 覆盖任务 |
|----|------|:-------:|
| FR-001 | 融入 SDDU 路由体系 | TASK-001, TASK-002, TASK-003, TASK-004 |
| FR-002 | 无状态对话 | TASK-001 |
| FR-003 | 零中间产物 | TASK-001 |
| FR-004 | SDDU 领域知识注入 | TASK-001 |
| FR-005 | 项目上下文感知 | TASK-001 |
| FR-006 | 直接解决能力 | TASK-001 |
| FR-007 | 升级建议 | TASK-001 |
| FR-008 | 任务边界自律 | TASK-001 |
| FR-009 | 路由调度集成 | TASK-004 |
| FR-010 | 双入口消歧 | TASK-001, TASK-005 |
| NFR-002 | 模板质量要求 | TASK-001 |
| NFR-006 | 与现有 Agent 体系共存 | TASK-002, TASK-003 |

## 修订记录
> 记录本文档的版本变更历史

| 版本 | 变更说明 | 日期 | 修订人 |
|------|---------|------|--------|
| v1.0 | 初始创建 — 基于 plan.md v1.1 + spec.md v1.1 分解 5 个原子任务，全部 Wave 1 并行 | 2026-07-12 | SDDU Tasks Agent |
