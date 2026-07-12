# 技术计划：@sddu-fast 快速模式 Agent

> **文档定位**: SDDU 技术方案 — 记录架构设计、方案对比和 ADR，作为 tasks 阶段的输入  
> **前置依赖**: spec.md（需求规范）  
> **创建人**: SDDU Plan Agent  
> **创建时间**: 2026-07-11  
> **版本**: v1.0  
> **更新人**: SDDU Plan Agent  
> **更新时间**: 2026-07-11  
> **更新说明**: 初始创建 — 基于 spec.md v1.1 完成技术规划，定义独立子 Agent 模板 + 注册 + 路由调度方案

---

## 1. 前置检查
> 启动技术规划前必须验证的前置条件

| 检查项 | 状态 |
|--------|:--:|
| spec.md 存在 | ✅ |
| 外部 API 文档缓存 | ⚠️ 不适用（纯模板变更，无外部 API 依赖） |
| 前置依赖 FR-TPL-001 已满足 | ✅（Handlebars 模板系统已就绪） |

## 2. 架构分析
> 分析现有架构影响和需要的新组件

### 2.1 现有架构回顾

当前 SDDU Agent 体系采用**三层结构**：

```
第 1 层 — HBS 模板源:  src/templates/agents/sddu-*.md.hbs       （Agent 行为定义模板）
                  ↓  Handlebars 渲染
第 2 层 — 运行时 Prompt: .opencode/agents/sddu-*.md             （Agent 实际执行的指令）
                  ↓  注册
第 3 层 — Agent 注册:
  ├── sddu-agents.ts    → builtinAgents[] 数组（TypeScript 侧注册）
  └── opencode.json.hbs → agent:{} 块（OpenCode JSON 配置侧注册）
```

**数据流**：

```
用户 → @sddu（路由协调器）
         │
         ├── 复杂任务 → @sddu-discovery → spec → plan → ... → validated（状态机 pipeline）
         ├── 状态查看 → 仪表盘 / 标记命令
         └── 简单任务 → 【缺失】当前无处路由，用户只能用普通 AI 对话
```

**关键约束**：
- `sddu-agents.ts` 中的 `agentToPhaseMap` 映射了每个 Agent → 对应 phase，`@sddu-fast` 不应加入此映射（Fast 无 phase）
- `@sddu` 路由表（sddu.md.hbs §3）当前未列出 `@sddu-fast`
- 现有 15 个 Agent 全部属于主流水线或辅助角色，无"轻量通用"类别

### 2.2 新增组件：@sddu-fast 独立子 Agent

本 Feature 引入一个**纯模板级的新 Agent**，技术实现涉及 4 个视角：

| 视角 | 组件 | 说明 |
|------|------|------|
| **行为模板** | `src/templates/agents/sddu-fast.md.hbs` | 定义 Fast Agent 的完整行为指令（任务边界、升级标准、约束清单、上下文感知策略） |
| **运行时 Prompt** | `.opencode/agents/sddu-fast.md`（目标项目） | 由 `install.sh` 从 `dist/sddu/agents/` 部署到目标项目，Agent 实际执行的 Prompt 文件 |
| **TypeScript 注册** | `src/adapters/opencode/agents/sddu-agents.ts` | 在 `builtinAgents[]` 数组中新增一条记录（**不加入** `agentToPhaseMap`） |
| **OpenCode 配置** | `src/adapters/opencode/templates/opencode.json.hbs` | 在 `agent:{}` 块中新增 `sddu-fast` 条目，声明 model/prompt/permission |

### 2.3 协调器变更

`@sddu` 路由协调器（`sddu.md.hbs`）需两处修改：

1. **路由表扩展**（§3）：新增 `@sddu-fast` 行，标注为 `—`（无阶段），说明"快速解决（轻量任务）"
2. **简单任务调度逻辑**（新增 §5.4）：在路由协议中增加复杂度评估环节——当用户请求不符合任何 pipeline Agent 的意图模式且复杂度为"简单"时，调度到 `@sddu-fast`

### 2.4 数据流变更（目标态）

```
用户 → @sddu（路由协调器）
         │
         ├── 复杂任务 → @sddu-discovery → spec → plan → ... → validated（状态机 pipeline）
         ├── 状态查看 → 仪表盘 / 标记命令
         └── 简单任务 → @sddu-fast → 单会话解决（无状态、无产物、不留痕）
                                            │
                                            └── 超范围 → 升级建议 → 用户手动 @sddu 开始
```

### 2.5 依赖关系图

```
FR-TPL-001（Handlebars 模板系统） ←── 本 Feature 依赖模板渲染链路
     │
     ├── src/templates/agents/sddu-fast.md.hbs [NEW]
     │       ↓ npm run build（Handlebars 渲染）
     ├── dist/templates/agents/sddu-fast.md（构建产物，build-agents.cjs 渲染）
     │       ↓ 引用
     ├── src/adapters/opencode/templates/opencode.json.hbs [MODIFY]
     │       ↓ 注册
     └── src/adapters/opencode/agents/sddu-agents.ts [MODIFY]

sddu-fast 本身无状态机依赖：不 import StateMachine，不加入 agentToPhaseMap
@sddu 协调器（src/templates/agents/sddu.md.hbs）[MODIFY]：路由表 + 调度逻辑

README.md [MODIFY]：双模架构说明（QP-002）
```

### 2.6 从源码到用户可用的完整链路

基于实际构建脚本（`scripts/build-agents.cjs`、`scripts/package.cjs`、`install.sh`）的链路：

```
1. 源码变更（本 Feature 的修改目标）
   ├── [NEW]  src/templates/agents/sddu-fast.md.hbs      行为模板
   ├── [MOD]  src/adapters/opencode/agents/sddu-agents.ts  builtinAgents[] 注册
   ├── [MOD]  src/adapters/opencode/templates/opencode.json.hbs  新增 sddu-fast Agent 条目
   ├── [MOD]  src/templates/agents/sddu.md.hbs            协调器路由+调度
   └── [MOD]  README.md                                   双模说明

        ↓ npm run build（实际 = build:agents → tsc）

2. 构建产出
   ├── dist/templates/agents/sddu-fast.md   build-agents.cjs 渲染 .hbs → .md
   ├── dist/templates/agents/sddu.md        build-agents.cjs 重新渲染协调器
   └── dist/*.js                            tsc 编译 src/ 下所有 TS

        ↓ npm run package（scripts/package.cjs）

3. 打包 — 将构建产物组装为可分发的插件目录 dist/sddu/
   ├── dist/sddu/agents/sddu-fast.md    ← 来自 dist/templates/agents/（复制+改名处理）
   ├── dist/sddu/agents/sddu.md         ← 同上（协调器已含 Fast 调度逻辑）
   ├── dist/sddu/opencode.json          ← 来自 src/.../opencode.json.hbs（原样复制，含 sddu-fast 条目）
   ├── dist/sddu/*.js                   ← 来自 dist/（插件核心 JS）
   └── dist/sddu.zip                    ← 以上全部压缩打包

        ↓ install.sh <目标项目>

4. 安装 — install.sh 将插件部署到目标项目
   ├── dist/sddu/               →  {目标}/.opencode/plugins/sddu/     （插件本体）
   ├── dist/sddu/agents/*.md    →  {目标}/.opencode/agents/           （Agent Prompt 文件）
   └── dist/sddu/opencode.json  →  合并到 {目标}/opencode.json        （Agent 注册+权限）

        ↓ 用户在目标项目中 opencode

5. 用户使用
   ├── @sddu "修一个拼写错误"       → 协调器调度 → @sddu-fast
   └── @sddu-fast "review 这段代码"  → 直接调用
```

> **注意**: 本 Feature 的**源码级变更**仅步骤 1 中列出的 5 个文件。步骤 2-4 由现有 `npm run build` / `npm run package` / `install.sh` 链路自动完成——新增的 `sddu-fast.md.hbs` 会被 `build-agents.cjs` 的 `sddu-*.md.hbs` 通配模式自动匹配，`opencode.json.hbs` 的新条目会被 `package.cjs` 原样打包，`install.sh` 的 agents 目录批量拷贝自然覆盖新文件。

## 3. 方案对比
> 2-3 个可行方案的对比分析

| 维度 | 方案 A：独立子 Agent + 协调器调度【推荐】 | 方案 B：协调器内联 Fast 模式 | 方案 C：独立 Agent + 无协调器感知 |
|------|:--|:--|:--|
| **描述** | 创建独立的 `sddu-fast` 子 Agent（含 .hbs 模板和 .md Prompt），在 sddu-agents.ts 中注册，但不加入 agentToPhaseMap。`@sddu` 协调器新增复杂度评估逻辑和路由表条目，将简单任务调度到 `@sddu-fast`。用户也可直接调用 `@sddu-fast`。 | 不在外部创建新 Agent，而是在 `@sddu` 协调器模板中直接内嵌 Fast 模式的对话逻辑。当协调器判定为简单任务时（如"修复拼写错误"），不路由到任何子 Agent，直接在协调器会话中完成解决（读取文件→编辑→验证→报告）。 | 创建独立的 `sddu-fast` Agent（同方案 A），但不修改 `@sddu` 协调器。`@sddu-fast` 完全作为独立入口存在（`@sddu-fast "修一个 bug"`），与 `@sddu` 无调度关系。`@sddu` 不感知 Fast 的存在。 |
| **优点** | ① 符合关注点分离原则：协调器只管路由，Fast 只管解决<br>② Agent 行为独立可审查（.hbs 模板自包含）<br>③ `@sddu` 可感知并引导，实现双入口互通<br>④ 扩展性好：未来可增加类似 @sddu-research 等非管道 Agent<br>⑤ 满足 FR-001 全部验收标准（@sddu 可调度 + 用户可直接调 + 不参与状态流转） | ① 文件变更最少（仅修改 sddu.md.hbs）<br>② 无需新增注册逻辑<br>③ 协调器可直接访问已加载的项目上下文 | ① 实现最简单（仅新增 .hbs + 注册）<br>② `@sddu` 零改动，无回归风险<br>③ 可独立上线，再后续对接协调器 |
| **缺点** | ① 涉及文件最多（5 个文件变更）<br>② 协调器复杂度评估为模糊逻辑（依赖 LLM 判断而非规则引擎） | ① **违反 `@sddu` "只路由不设计"的核心原则** — 协调器需要具备代码读写/命令执行能力<br>② 协调器职责膨胀：从"关口检查 + 路由转发"变为"关口检查 + 简单任务执行 + 路由转发"<br>③ 权限冲突：`@sddu` 当前 permission 为 deny（edit/webfetch/bash），需改为 allow，破坏其安全边界<br>④ 无法隔离 Fast 和管道模式的行为约束，模板混杂 | ① **不满足 FR-001 验收标准①②**：@sddu 不能调度到 Fast<br>② **不满足 FR-009（路由调度集成）**：@sddu 无法识别简单任务并调度<br>③ 双入口完全孤立，用户发现 Fast 路径困难（仅靠文档/README 宣传）<br>④ 不符合 spec 中的"融入 SDDU 路由体系"设计意图 |
| **风险** | ① 复杂度评估准确性依赖 LLM 判断（无硬规则）<br>② 如果协调器频繁误判，用户可能绕开协调器直接调用 @sddu-fast | ① 协调器行为不可预测（既要做路由又要做执行）<br>② 安全边界模糊（deny→allow 后可能被滥用执行危险命令） | ① 双入口孤立，通过时间推移形成信息孤岛<br>② 用户混淆"什么时候用 @sddu vs @sddu-fast" |
| **工作量** | XS（1-2 天）：<br>• .hbs 模板编写：4-6h<br>• 渲染 + 注册：1h<br>• 协调器修改：2-3h<br>• 测试验证：2-3h | XS（0.5 天）：<br>• 协调器模板修改：4-6h<br>• 权限调整 + 测试：2-3h | XXS（0.5 天）：<br>• .hbs 模板编写：4-6h<br>• 渲染 + 注册：1h |

## 4. 推荐方案
> 推荐方案及选择理由

**推荐**: **方案 A — 独立子 Agent + 协调器调度**

**理由**（按 spec 需求对齐排序）：

| # | 决策理由 | 对应需求 |
|---|---------|:-------:|
| 1 | 满足 FR-001 全部 3 条验收标准：`@sddu` 可调度 + 用户可直接调 + 不参与状态流转 | FR-001 |
| 2 | 符合 `@sddu` "只路由不设计"的核心原则，Fast Agent 的行为完全由自身 .hbs 模板定义 | FR-002/003 |
| 3 | 通过独立模板实现 FR-002（无状态）、FR-003（零产物）的行为约束——模板中无 phase/state.json 操作指令 | FR-002, FR-003 |
| 4 | 支持 FR-007 升级建议：Fast Agent 模板中定义升级判断标准，协调器仅做初步筛选 | FR-007, FR-008 |
| 5 | 满足 FR-009 路由调度集成：`@sddu` 通过路由表 + 复杂度评估实现对 Fast 的调度 | FR-009 |
| 6 | 架构扩展性好：未来增加 @sddu-research 或 @sddu-quick（其他非管道 Agent）时，无需修改协调器核心逻辑 | NFR-006 |

**方案 B 的致命缺陷**：违反 `@sddu` "只路由不设计"的设计原则，且需将 `@sddu` 权限从 deny 改为 allow（edit/bash），彻底破坏其安全边界。协调器职责从"关口检查"膨胀为"关口检查 + 任务执行"，未来所有简单任务的修改都需通过协调器模板控制，难以维护。

**方案 C 的致命缺陷**：不满足 FR-001 和 FR-009 的核心验收标准。双入口完全孤立违背 spec 的"融入 SDDU 路由体系"意图。

### 4.1 QP-001 复杂度阈值初步方案

为支持 `@sddu` 协调器的**简单任务识别**（调度到 Fast）和 `@sddu-fast` 自身的**升级判断**（建议升级），定义以下阈值体系：

#### 4.1.1 协调器侧（@sddu 预筛选 — 粗粒度）

| 信号 | 判定规则 | 动作 |
|------|---------|------|
| **关键词匹配** | 用户消息含"修复"、"改一下"、"review"、"补充测试"、"调整配置"、"帮我看看"等轻量动词，且不含"设计"、"规划"、"立项"、"建立 Feature"等重量动词 | → 路由到 `@sddu-fast` |
| **意图模式** | 用户消息不匹配任何 pipeline Agent 的调用模式（如非 `plan feature-x` 格式），且为祈使句/提问句而非项目规划声明 | → 路由到 `@sddu-fast` |
| **保守策略** | 不确定时，**不调度到 Fast**，而是在回复中给出两个选项：`@sddu-fast` 直接解决 或 `@sddu-discovery` 走完整流程 | → 让用户决策 |

> **设计原则**：协调器侧尽量保守——宁可漏过简单任务让用户手动 `@sddu-fast`，不要将复杂任务误路由到 Fast 导致体验断裂。误将复杂任务调度到 Fast 的成本（用户被建议升级、重新开始）远大于误将简单任务留在协调器（用户自己选用 @sddu-fast）。

#### 4.1.2 Fast Agent 侧（@sddu-fast 升级判断 — 细粒度）

| 信号 | 阈值 | 判定 |
|------|------|:--:|
| **文件影响数** | ≥ 5 个文件（跨模块） | → 建议升级 |
| **接口签名变更** | 任何 public API / 导出函数签名的变更 | → 建议升级 |
| **新增 Feature 目录要求** | 需要创建新的 specs-tree 目录 | → 建议升级 |
| **跨模块架构变更** | 涉及 2+ 独立模块（如同时改 adapters/ + state/ + discovery/） | → 建议升级 |
| **设计决策需要记录** | 需要产出 ADR 或正式 spec 文档 | → 建议升级 |
| **边界模糊** | 3-4 个文件、小范围接口变更、整体可控 | → 向用户说明判定不确定性，给出"在 Fast 尝试" / "建议升级"两个选项（对应 EC-009） |

> **验收参考**：以上阈值在 `sddu-fast.md.hbs` 模板中明确定义，后续基于实际使用反馈可灵活调整（无需修改代码）。

## 5. 文件影响分析
> 所有需要创建/修改/删除的文件

| 操作 | 文件路径 | 说明 |
|:--:|------|------|
| **NEW** | `src/templates/agents/sddu-fast.md.hbs` | **核心产物** — Fast Agent 的 Handlebars 行为模板。包含：角色定位与职责边界、执行顺序说明、领域知识注入策略（specs-tree/docs-tree/ROADMAP/Agent 注册/TREE 结构）、上下文感知读取规则（5 类信息源按需读取）、任务边界自律清单（适合/不适合任务、升级阈值）、升级建议输出格式、行为约束（禁止 phase 操作/文档写入/目录创建）、双入口消歧 welcome 消息、错误处理策略（文件读取失败/命令错误/上下文模糊） |
| ⚙️ | `.opencode/agents/sddu-fast.md`（目标项目） | **分发产物** — 由 `install.sh` 从 `dist/sddu/agents/` 拷贝到目标项目的 `.opencode/agents/`，不列入源码变更清单 |
| **MODIFY** | `src/adapters/opencode/agents/sddu-agents.ts` | **Agent 注册** — 在 `builtinAgents[]` 数组中新增 `sddu-fast` 条目（`name: 'sddu-fast'`, `mode: 'subagent'`, `promptFile: '.opencode/agents/sddu-fast.md'`）。**不加入** `agentToPhaseMap`，因为 Fast 无阶段概念。 |
| **MODIFY** | `src/adapters/opencode/templates/opencode.json.hbs` | **OpenCode 配置** — 在 `agent:{}` 块中新增 `"sddu-fast"` 条目，声明 `model: "opencode/deepseek-v4-flash-free"`, `prompt: "{file:.opencode/agents/sddu-fast.md}"`。保持与其他 Agent 一致。 |
| **MODIFY** | `src/templates/agents/sddu.md.hbs` | **协调器变更（3 处）**：<br>① §3 路由目标表：新增 `@sddu-fast` 行（Agent: `@sddu-fast`, 阶段: `—`, 说明: `快速解决（轻量任务）`）<br>② 新增 §5.4 简单任务调度：定义复杂度评估规则（关键词匹配 + 意图模式），简单任务调度到 `@sddu-fast`<br>③ §11 示例对话：新增 `@sddu "修复一个配置文件拼写错误"` → 识别为简单任务 → 调度 `@sddu-fast` 的对话示例 |
| **MODIFY** | `README.md` | **项目 README** — 基于 QP-002 已决策：README 需体现 SDDU 双模架构，讲清 `@sddu`（完整流程）vs `@sddu-fast`（快速模式）的定位差异和使用场景。在现有文档结构上新增双模说明段，附带简单场景示例（如：修拼写用 Fast / 设计模块走完整流程 / 不确定时先用 Fast 试探）。 |

## 6. 风险评估
> 识别技术、依赖和时间风险及缓解措施

| 风险 | 概率 | 影响 | 缓解措施 |
|------|:--:|:--:|----------|
| **R-004 🔴 模板编写质量决定 Agent 行为**：.hbs 模板是 Fast Agent 行为唯一定义来源。如果任务边界不清晰、行为约束不明确、升级标准模糊，Agent 可能越界产出 process 文档或反过来过于保守不敢行动 | 高 | 高 | ① 模板中分节明确定义"禁止行为清单"（8 条禁止项）和"任务边界对照表"（适合/不适合/边界模糊 3 列）；② 每次模板修改后运行 Fast Agent 验证用例集（至少覆盖：修拼写→直接解决、设计系统→建议升级、模糊任务→询问用户）；③ 模板作为独立文件可单独 code review（满足 NFR-002 验收标准） |
| **R-003 🟡 Agent 升级判断不准**：Fast Agent 依赖 LLM 判断"何时该建议升级"。阈值太激进（频繁建议升级）失去轻量意义；太保守（复杂任务不升级）产出质量低 | 中 | 中 | ① 在模板中提供**具体可计数的阈值**（文件数≥5、接口变更、跨模块数≥2），将 LLM 判断从纯语义变为规则+语义混合模式；② 边界模糊任务（3-4 文件/小范围接口变更）采用"先询问后行动"策略（EC-009），让用户决策而非 Agent 决定；③ 协调器侧采取保守策略——宁可漏过简单任务也不误将复杂任务调度到 Fast；④ 阈值在模板中明确定义，后续调优无需改代码 |
| **R-001 🟡 两个入口的认知混乱**：用户可能不理解 `@sddu-fast` 和 `@sddu` 的区别和适用场景，导致使用焦虑或错误选择 | 中 | 低 | ① `@sddu-fast` 的 welcome 消息明确说明定位（FR-010）；② `@sddu` 的 help 中列出 `@sddu-fast` 入口及简要说明（FR-009 验收标准③）；③ README 中提供双模对比 + 场景示例（QP-002）；④ `@sddu` 协调器在用户意图模糊时返回两个选项让用户自行选择 |
| **R-002 🟡 "Fast becomes the norm" 风险**：如果 Fast 模式体验好，用户可能滥用它处理不应走轻量模式的任务 | 中 | 中 | ① 模板中的"不适合 Fast 的任务清单"明确列出需走完整流程的任务类型；② Agent 拒止策略明确——不适合的任务输出升级建议后**拒绝执行**，不可用"先做一部分再升级"的模糊策略；③ 升级建议中给出具体判断理由（不仅是"建议升级"，而是"为什么不适合"—文件数≥5/涉及 API 签名变更等） |
| **NFR-003 🟢 隔离性验证**：确保 Fast 会话绝对不修改 .sddu/ 目录 | 低 | 低 | ① 模板中明确禁止操作 .sddu/ 目录；② 每次模板变更后在验证环节执行 `git diff .sddu/` 确认零差异 |
| **FR-TPL-001 🟢 模板渲染链路依赖**：依赖 build-agents.cjs 渲染链路的正确性，若模板语法错误导致渲染失败，Fast Agent 无法工作 | 低 | 中 | ① 遵循现有 sddu-*.md.hbs 的 Handlebars 语法模式；② 渲染后验证 `dist/templates/agents/sddu-fast.md` 是否生成且内容合法 |

## 7. 生成的 ADR
> 本次规划产出的架构决策记录

| ADR | 标题 | 状态 |
|-----|------|:--:|
| ADR-004 | @sddu-fast Agent 独立子 Agent 架构及复杂度阈值策略 | PROPOSED |

### ADR-004 详细内容

> 📄 参见目录下独立文件 `ADR-004-fast-agent-architecture.md`，与 plan.md 同级存放。

**决策摘要**：

1. **架构决策**：`@sddu-fast` 作为独立子 Agent，不加入 `agentToPhaseMap`，不参与 SDDU 状态机流转。通过 `@sddu` 协调器的路由表扩展 + 简单任务调度逻辑实现双入口互通。

2. **复杂度阈值决策**：采用双重阈值机制——协调器侧粗粒度预筛选（关键词匹配 + 意图模式，保守策略）→ Fast Agent 侧细粒度升级判断（文件数≥5 / API 签名变更 / 跨模块≥2 等可计数阈值 + 边界模糊→询问用户的策略）。

3. **模板约束决策**：Fast Agent 的行为约束通过在 .hbs 模板中明确列出"禁止行为清单"（8 项）和"任务边界对照表"来保证，不依赖代码层 guardrail（如权限 deny），因为 Fast Agent 需要有 edit/bash 权限才能完成直接解决任务。

4. **决策理由**：方案 B（协调器内联）违反 `@sddu` "只路由不设计"原则且需变更安全边界；方案 C（无协调器感知）不满足 FR-001/FR-009。方案 A 是唯一同时满足所有 FR 且保持架构一致性的选择。

## 8. 产物审查策略
> 供 review 阶段使用的静态分析清单和审查基准。review 只「看」——阅读代码、对比规范、检查模式，不做动态执行。

| 审查产物 | 审查内容 | 审查基准 |
|---------|---------|---------|
| `src/templates/agents/sddu-fast.md.hbs` | **行为模板完整性**：逐段对照 spec，确认以下内容存在且正确——角色定位与职责边界（§1）、执行顺序说明（§2）、前置条件（§3）、领域知识注入策略（§5，含 specs-tree / docs-tree-root / ROADMAP / docs/）、上下文感知读取规则（§5，5 类信息源按需读取）、任务边界自律清单（适合/不适合任务对照表）、升级建议输出格式（FR-007）、行为约束（禁止 phase 操作、禁止文档写入、禁止目录创建）、双入口消歧 welcome 消息（FR-010）、错误处理策略（FR-XXX / NFR-004） | spec.md §5 FR-001~FR-010；NFR-002（模板含任务边界+升级标准+行为约束+错误处理）；EC-001~EC-009 边界情况处理覆盖 |
| `src/templates/agents/sddu.md.hbs`（协调器变更） | **路由表**（§3）：是否存在 `@sddu-fast` 行，标注为「—」（无阶段），说明「快速解决（轻量任务）」；**调度逻辑**（§5.4）：是否存在简单任务评估 + 调度到 `@sddu-fast` 的逻辑，调度时明确不触发 phase 流转；**示例对话**（§11）：是否新增 Fast 调度示例 | spec.md FR-009 验收标准①②③ |
| `src/adapters/opencode/agents/sddu-agents.ts` | **builtinAgents[]** 是否含 `sddu-fast` 条目（name/mode/promptFile）；**agentToPhaseMap** 是否不含 `sddu-fast`（Fast 无阶段） | NFR-006（不与现有 Agent 冲突） |
| `src/adapters/opencode/templates/opencode.json.hbs` | `agent:{}` 中是否含 `"sddu-fast"` 条目（model/prompt 字段格式与其他 Agent 一致）；原有 11 个 Agent 条目未被意外修改或删除 | NFR-006 |
| `README.md` | 是否体现 SDDU 双模架构——`@sddu`（完整流程）vs `@sddu-fast`（快速模式）的定位差异；是否附带简单场景示例（修拼写用 Fast / 设计模块走完整流程 / 不确定时先用 Fast 试探）；用户读完是否能自行判断选哪个入口 | QP-002（已决策） |

## 9. 产物验证策略
> 供 validate 阶段使用的可执行验证步骤。validate 只「做」——跑构建、跑测试、跑脚本，不「看」文件内容（那是 review 的职责）。

| # | 验证项 | 具体动作 | 通过标准 |
|:--:|--------|---------|---------|
| V1 | 构建通过 | `npm run build` | 退出码 0 |
| V2 | 打包通过 | `npm run package` | 退出码 0 |
| V3 | TypeScript 无回归 | `npx tsc --noEmit` | 退出码 0，无新增类型错误 |
| V4 | 现有测试全部通过 | `npm test` | 退出码 0，无失败用例 |
| V5 | 构建产物完整 | `ls dist/sddu/agents/sddu-fast.md && ls dist/sddu/agents/sddu.md` | 两个文件均存在 |
| V6 | 安装到临时项目 | `bash install.sh /tmp/sddu-fast-e2e-$(date +%s)` — 在全新空目录中执行完整安装流程：清理 dist → npm install → build → package → 创建目标目录 → 拷贝插件文件与 agent 产物 → 合并 opencode.json → 初始化 .sddu/ | 退出码 0；目标目录下 `.opencode/agents/sddu-fast.md` 存在；`opencode.json` 含 `"sddu-fast"` agent 条目；`.opencode/plugins/sddu/` 插件目录完整 |
| V7 | E2E 全流程回归 | `bash e2e/scripts/basic/sddu-e2e.sh user-login --auto` — 对安装后的临时项目执行完整 8 阶段工作流，验证新增 Agent 不破坏现有流程 | 退出码 0；所有阶段正常推进 |
| V8 | Fast 模式专项验证 | **第 1 步**：在 V6 安装好的临时项目 `$TEST_DIR` 中初始化一个 TypeScript 项目骨架：<br>`cd $TEST_DIR && npm init -y && npm pkg set type=module && mkdir -p src/utils && echo "export function formatDate(d: Date): string { return d.toISOString().slice(0, 10); }" > src/utils/date.ts && echo "console.log('hello');" > src/index.ts`<br><br>**第 2 步**：生成测试提示词文件 `$TEST_DIR/sddu-fast-test.md`，内含以下 7 个场景的逐条指令，要求 Agent 在每个场景后报告结果（通过/失败）：场景 1 直接调用（FR-001）、场景 2 简单任务执行（FR-006）、场景 3 复杂任务拒止（FR-007/EC-001）、场景 4 升级后说"好的"（EC-006）、场景 5 请求产出文档（EC-003）、场景 6 询问阶段（EC-007）、场景 7 边界模糊任务（EC-009）<br><br>**第 3 步**：进入会话——`cd $TEST_DIR && opencode`，加载 `sddu-fast-test.md` 中的场景依次执行。注：若 opencode 支持 `--prompt` 参数可直接传参；否则输出 `cd $TEST_DIR && opencode` 指令供人工执行 | 7 个场景均符合预期的 Agent 输出 |

## 修订记录
> 记录本文档的版本变更历史

| 版本 | 变更说明 | 日期 | 修订人 |
|------|---------|------|--------|
| v1.0 | 初始创建 — 基于 spec.md v1.1 完成完整技术规划 | 2026-07-11 | SDDU Plan Agent |
| v1.1 | 修正 dogfooding 约束 — `.opencode/agents/sddu-fast.md` 从 NEW 改为构建产物（⚙️），不列入变更清单；同步修正 ADR-004、架构分析 §2.2、依赖图 §2.5、审查/验证策略 §8-9 | 2026-07-11 | SDDU Plan Agent |
