# 构建报告：specs-tree-autonomous-mode

> **文档定位**: SDDU 构建报告 — 记录全部任务的文件变更和实现结果，作为 review 阶段的输入  
> **前置依赖**: tasks.md（任务清单）、plan.md（技术方案）、spec.md（需求规范）  
> **创建人**: SDDU Build Agent  
> **创建时间**: 2026-08-15  
> **版本**: v1.0  
> **更新人**: SDDU Build Agent  
> **更新时间**: 2026-08-16  
> **更新说明**: 追加 review R1 改进项修复（处置 4 项改进 1/3/4 fixed，2 recorded）+ 职责越界修复（FR-AUTONOMY-001：sddu-auto 模板补「调度者不实施」硬约束，7 处修改，`npm run build:agents` 重新生成 dist/templates/agents/sddu-auto.md）+ 权限层面硬性落实（FR-AUTONOMY-001：sddu-auto frontmatter 完全禁用实施权限 edit/bash/webfetch=deny，所有实施动作含写文件一律派发子 Agent，§4.1/§5.2/§5.3/§8/§9/§10 六处修改，`npm run build:agents` 重新生成 dist/templates/agents/sddu-auto.md）+ review 增量复核遗留项修复（R1-A/R1-B/R1-C：§7.2 改 task 派发子 Agent 执行 sddu-tree、删除 frontmatter 无效 task/skill 键、§9 措辞修正，`npm run build:agents` 重新生成 dist/templates/agents/sddu-auto.md）

## 1. 构建概要
> 本次构建的整体统计

| 维度 | 数值 |
|------|:--:|
| 完成任务数 | 7 / 7 |
| 复杂度分布 | S×2 / M×4 / L×1 |
| 新增文件 | 5 个 |
| 修改文件 | 5 个 |

## 2. 文件变更
> 本次构建涉及的全部文件操作（含源码、测试、配置等所有类型）

| 操作 | 文件路径 | 对应任务 | 说明 |
|:--:|------|:--:|------|
| MODIFY | `src/adapters/opencode/templates/opencode.json.hbs` | TASK-005 | `agent` 块新增 `sddu-auto` 条目（description/model 对齐既有 Agent，`prompt` 指向 `{file:agents/sddu-auto.md}`） |
| MODIFY | `scripts/build-agents.cjs` | TASK-005 | `specialAgents` 数组追加 `'sddu-auto'`，使 `npm run build` 生成其构建产物 |
| NEW | `src/adapters/opencode/tools.ts` | TASK-002 | 收敛 3 状态工具（`sddu_update_state` / `sddu_tag_feature` / `sddu_get_all_states`）+ 辅助函数（`legacyStatusToPhase` / `readFeatureState` / `writeFeatureState`），行为零变化，依赖注入 `directory` / `stateMachine` |
| NEW | `src/adapters/opencode/hooks.ts` | TASK-002 | 收敛 4 生命周期 hook（`session.created` / `file.edited` / `session.idle` / `session.end`），全局单例改为 plugin.ts 注入（`autoUpdater` / `stateMachine` / `parentStateManager`） |
| MODIFY | `src/adapters/opencode/plugin.ts` | TASK-002 | 瘦身为「初始化 + 组装」入口（537 行 → 69 行），实例化各组件、注入依赖、返回 tools + hooks 组合 |
| MODIFY | `e2e/scripts/basic/sddu-e2e.sh` | TASK-006 | 新增 `ENTRY` 变量（`--auto` → `@sddu-auto`，默认 `@sddu`），heredoc 与 echo 入口改引用 `$ENTRY` |
| MODIFY | `e2e/scripts/fullstack/sddu-e2e-fullstack.sh` | TASK-006 | 同上：新增 `ENTRY` 变量并切换 heredoc/echo 入口为 `$ENTRY` |
| NEW | `src/templates/agents/sddu-auto.md.hbs` | TASK-004 | 核心交付物 — sddu-auto 第三调度入口 Agent 行为模板（frontmatter + 角色定位 + 双阶段模型 + 六维启动问卷（ADR-019）+ 「绝不问人」硬约束与 7 阶段顺序调度 + auto-decisions.md 决策追溯（ADR-020）+ sddu_update_state/sddu-tree 复用机制），经 `npm run build:agents` 生成 `dist/templates/agents/sddu-auto.md` |
| NEW | `src/adapters/opencode/decision-proxy.ts` | TASK-003 | 决策代理层（方案 D 核心）：`SessionRegistry`（识别 sddu-auto 调度子会话映射，parentID 建父子关系）+ `DecisionEngine`（硬决策，NFR-003）+ 四步编排（订阅 event hook / 识别 question.asked / 决策 / 代答）；代答三级兜底 `client.v2.session.question.reply` → `client.question.reply` → HTTP `session.question.reply`；本地最小类型声明（规避根 1.16.2 v2 子路径损坏，无需升级依赖） |
| NEW | `src/__tests__/unit/adapters/decision-proxy.test.ts` | TASK-003 | 18 个单元测试：SessionRegistry 匹配逻辑（子会话拦截 / 主会话与普通会话不拦截）+ DecisionEngine 硬决策（信息不足仍返回确定答案）+ DecisionProxy 四步编排（拦截代答 / 非目标透传 / session.created 登记 / chat.message 兜底 / dispose） |
| MODIFY | `src/adapters/opencode/plugin.ts` | TASK-003 | 组装接入 decision-proxy：解构新增 `serverUrl`，返回对象新增 `event` / `"chat.message"` / `dispose`，注入 `contextFile`（启动诉求懒加载） |

## 3. 任务完成清单
> 每个任务的完成状态

| 任务 | 名称 | 复杂度 | 状态 | 对应 FR |
|------|------|:--:|:--:|------|
| TASK-001 | spike — 决策代理层最小可行性实测 | L | ✅ completed | FR-004, FR-006 |
| TASK-002 | plugin.ts 纯重构拆分（tools.ts + hooks.ts） | M | ✅ completed | FR-005 |
| TASK-003 | decision-proxy.ts 实现 + 接入 plugin.ts | M | ✅ completed | FR-004, FR-005, FR-006, NFR-003 |
| TASK-004 | sddu-auto.md.hbs 模板编写 | M | ✅ completed | FR-001, FR-002, FR-003, FR-007~010, NFR-001~003 |
| TASK-005 | 注册 sddu-auto（opencode.json.hbs + build-agents.cjs） | S | ✅ completed | FR-001, FR-008 |
| TASK-006 | e2e 脚本启用 --auto 标志 | S | ✅ completed | FR-001, FR-002 |
| TASK-007 | 集成装配验证 | M | ✅ completed | FR-001, FR-002, FR-007, NFR-002 |

## 4. 下一步

| 场景 | 操作 |
|------|------|
| 全部任务已完成（7/7） | 运行 `@sddu-review specs-tree-autonomous-mode` 开始审查 |

## 5. review R1 改进项修复记录
> 针对 review-report.md §5 的 4 项改进建议逐项处置（无阻塞项，2 中 2 低）

| 改进项 | 严重度 | 处置 | 落地文件 | 说明 |
|:--:|:--:|:--:|------|------|
| 1 | 中 | ✅ fixed | `src/templates/agents/sddu-auto.md.hbs` §4.1 | 新增「写入 auto-context.json（必做）」指令：sddu-auto 采集完六维问卷、切分进入执行前，将 `{"launchIntent","featureName","context"}` 落盘至 `<directory>/.sddu/specs-tree-root/auto-context.json`，打通 decision-proxy `refreshLaunchIntent` 决策依据注入通道（生产者=sddu-auto，消费者=decision-proxy） |
| 2 | 中 | 📝 recorded | `ADR-020.md` + `sddu-auto.md.hbs` §6 | 决策追溯生产者归属 decision-proxy（协议层落盘 `auto-decisions.md`），主 Agent 收不到被拦截提问、架构上无法自行记录；ADR-020 追加「架构调整」说明，模板 §6 改为「完成阶段汇总」（主 Agent 不负责写入，仅完成阶段读取统计）。决策落盘由 decision-proxy 的 `appendDecisions` 实现 |
| 3 | 低 | ✅ fixed | `src/adapters/opencode/decision-proxy.ts` | `httpReplyQuestion` 在 `res.ok=false` 时的 throw 已由 `replyQuestion` 通道 3 try-catch 捕获，降级为 `log('error', ...)` 而非冒泡中断 event hook（NFR-003 不阻塞） |
| 4 | 低 | ✅ fixed | `src/__tests__/unit/adapters/decision-proxy.test.ts` | 补 7 个单测：contextFile 懒加载（存在/缺失/含 featureName 落盘）+ HTTP 兜底（成功/res.ok=false 不冒泡）+ 三级降级顺序（v2 缺失走全局 → 全局缺失走 HTTP → 三级均不可用仅告警），test:opencode 由 18 → 25 passed |

## 6. 职责越界修复记录（FR-AUTONOMY-001）
> 真实体验会话发现 sddu-auto（调度者）越界亲自执行 bugfix（`updateNickname` 未 await 落盘），补「调度者不实施」硬约束。仅改 `src/templates/agents/sddu-auto.md.hbs`，7 子 Agent 模板零改动。

| 修改点 | 位置 | 内容 |
|:--:|------|------|
| 1 | §1 职责边界 | 新增「绝不亲自实施」——调度者不亲自编辑代码/文件/产物（含 bugfix/实现/补齐），一律派发子 Agent |
| 2 | §5.4（新增小节） | 「问题处置：派发修复，不亲自实施」——review/validate 发现缺陷 → 判 P0/P1/P2 严重度 → 需修复则派发 sddu-build → 复核；绝不亲自编辑代码 |
| 3 | §5.2 规则 3（注入契约） | 新增「职责边界」契约：审查类子 Agent 只审查/验证不修改代码，修复统一派发 sddu-build，取消自行修复授权 |
| 4 | §5.3 伪流程 | 在 review/validate 间插入「问题处置」步骤（判严重度 → 派发 build 修复 → 复核） |
| 5 | §8 规则 | 新增规则 11「调度者不实施」 |
| 6 | §9 异常处理 | 「子 Agent 调度失败」「前置产物缺失」两行改为「派发调度补齐，绝不亲自实施」 |
| 7 | §10 示例对话 | 执行阶段示例改为展示「派发 sddu-build 修复」正确流程（替代自行修改代码） |

**验证**：`npm run build:agents` 通过，重新生成 `dist/templates/agents/sddu-auto.md`（src 与 dist 一致）；grep 确认「调度者不实施/绝不亲自」×10、「派发 sddu-build」处置流程在案、无「可直接修复」授权残留。

## 7. 权限层面硬性落实「调度者不实施」修复记录（FR-AUTONOMY-001）
> 文字约束（v1.2）未能阻止越界——工具权限（edit/bash allow）仍允许 sddu-auto 亲自改代码/写文件。本修复按用户决定**完全禁用实施权限 + 写文件也派发子 Agent**，从权限层面硬性落实「调度者不实施」（对齐 sddu coordinator 权限模型）。仅改 `src/templates/agents/sddu-auto.md.hbs`，7 子 Agent 模板零改动。

| 修改点 | 位置 | 内容 |
|:--:|------|------|
| 1 | frontmatter permission（核心） | `edit: deny`、`bash: deny`、`webfetch: deny`（杜绝亲自改代码/执行命令），保留 `task: allow`（调度子 Agent）、`skill: allow`（加载 sddu-tree 等 Skill） |
| 2 | §4.1 | 改写为「派发子 Agent 写入 auto-context.json」：sddu-auto 不亲自写文件（权限已禁用），经 `task` 调度具备写文件能力的子 Agent（推荐 `sddu-fast` 或 `general`）落盘；派发时把完整 JSON 内容注入 task prompt 原样落盘；保留 JSON 格式说明 + 生产者语义（生产者仍是 sddu-auto，落盘动作由执行 agent 完成） |
| 3 | §5.2 | 新增规则 6「所有实施性动作一律派发，绝不亲自执行」：写文件/修复/补齐/执行命令一律经 task 派发，无 edit/bash 权限物理上无法直接写文件/执行命令 |
| 4 | §5.3 | 伪流程第 1 步「固化并写入 auto-context.json」改为「固化 → task 调度轻量子 Agent 写入 auto-context.json（如 sddu-fast）」 |
| 5 | §8 规则 11 | 强化为「调度者不实施（连写文件也派发）」：明确 sddu-auto 无 edit/bash 权限，任何文件写入/修改/执行都经 task 派发 |
| 6 | §9 异常处理 | 「子 Agent 调度失败」「前置产物缺失」两行统一为「派发调度对应子 Agent 执行，绝不亲自实施（含写文件/执行命令也经 task 派发）」 |
| 7 | §10 示例对话 | 启动阶段示例改为「采集诉求 → task 调度 sddu-fast 写入 auto-context.json → 进入执行阶段」 |

**验证**：`npm run build:agents` 通过，重新生成 `dist/templates/agents/sddu-auto.md`（`diff` 逐字节一致）；grep 确认 frontmatter `edit/bash/webfetch: deny`、§4.1「不亲自写文件，task 调度执行 agent 写入」、无「sddu-auto 亲自编辑/写入」残留表述。

## 8. review 增量复核遗留项修复记录（FR-AUTONOMY-001，R1-A/R1-B/R1-C）
> 针对 review-report.md §7 增量复核发现的 2 个中等遗留缺口（R1-A §7.2 未同步 / R1-B 无效权限键）+ 1 个低严重度措辞（R1-C）逐项修复。仅改 `src/templates/agents/sddu-auto.md.hbs`，7 子 Agent 模板零改动。

| 遗留项 | 严重度 | 处置 | 落地位置 | 说明 |
|:--:|:--:|:--:|------|------|
| R1-A | 🟡 中 | ✅ fixed | `sddu-auto.md.hbs` §7.2 | §7.2 改为「task 派发子 Agent 执行 sddu-tree Skill 更新 TREE.md」：sddu-auto 无 bash 权限，不亲自执行 `node scripts/generate-tree.cjs`；改为 task 调度具备 bash 能力的子 Agent（sddu-fast/general）加载 sddu-tree Skill 运行脚本（`--target specs-tree-root/specs-tree-<feature>/`），与 §4.1「派发子 Agent 写入 auto-context.json」模式对齐；同步更新 §5.3 伪流程第 7 步、§8 规则 10、§10 示例对话第 13 步 |
| R1-B | 🟡 中 | ✅ fixed | `sddu-auto.md.hbs` frontmatter | 删除 frontmatter 无效 permission 键 `task: allow` / `skill: allow`（opencode permission 仅支持 edit/bash/webfetch/doom_loop/external_directory 五键，不含 task/skill；task/skill 默认启用无需配置，删除避免误导维护者） |
| R1-C | 🟢 低 | ✅ fixed | `sddu-auto.md.hbs` §9 | 「前置产物缺失」行「回退重跑该阶段」改为「派发对应子 Agent 重跑该阶段」，消除「sddu-auto 亲自回退重跑」的歧义 |

**验证**：`npm run build:agents` 通过，重新生成 `dist/templates/agents/sddu-auto.md`（`diff` 逐字节一致）；grep 确认 frontmatter 无 `task: allow`/`skill: allow` 键（仅剩 edit/bash/webfetch deny）、§7.2 含「task 派发子 Agent 执行 sddu-tree」、7 子 Agent 模板零改动（`git diff --name-only` 无 7 子 Agent 模板路径）。

## 修订记录
> 记录本文档的版本变更历史

| 版本 | 变更说明 | 日期 | 修订人 |
|------|---------|------|--------|
| v1.0 | TASK-005 完成 — 注册 sddu-auto（opencode.json.hbs + build-agents.cjs），配置级修改 2 文件 | 2026-08-15 | SDDU Build Agent |
| v1.1 | TASK-002 完成 — plugin.ts 纯重构拆分（新增 tools.ts + hooks.ts，plugin.ts 瘦身至 69 行），3 工具 / 4 hook 名不变、行为零变化，`npm run build` + `npm run test:core`（131 passed）通过 | 2026-08-15 | SDDU Build Agent |
| v1.2 | TASK-006 完成 — e2e 脚本启用 --auto 标志（ENTRY 变量，入口切 @sddu-auto），修改 2 脚本 | 2026-08-15 | SDDU Build Agent |
| v1.3 | TASK-004 完成 — 编写 src/templates/agents/sddu-auto.md.hbs（第三调度入口 Agent 行为模板），含 frontmatter（mode:all + task/skill 权限）、六维启动问卷（背景/目标/范围必采为最小充分信息集）、「绝不问人」硬约束 + 7 阶段顺序调度、auto-decisions.md 决策追溯（不参与状态机校验）；`npm run build:agents` 生成 dist/templates/agents/sddu-auto.md | 2026-08-15 | SDDU Build Agent |
| v1.4 | TASK-003 完成 — 新增 src/adapters/opencode/decision-proxy.ts（方案 D 核心四步链路：订阅 event hook question.asked → SessionRegistry 识别 sddu-auto 子会话 → DecisionEngine 硬决策 → reply 代答三级兜底）+ 18 单元测试；plugin.ts 接入（event/chat.message/dispose + serverUrl + contextFile）；未升级依赖（本地最小类型声明规避根 1.16.2 v2 损坏）；`npm run build` + `npm run test:opencode`（18 passed）+ `npm run test:core`（131 passed）通过 | 2026-08-15 | SDDU Build Agent |
| v1.5 | TASK-007 完成 — 集成装配验证（纯验证，无源码变更）：`npm run build` 全绿（build:agents 生成 dist/templates/agents/sddu-auto.md + build:ts 无类型错误）；`dist/sddu/opencode.json` 注册 sddu-auto（prompt 指向 `{file:agents/sddu-auto.md}`）；e2e 脚本 `--auto` 创建即安装测试项目成功（12 agent 复制、opencode.json 注册 sddu-auto、入口提示词 `@sddu-auto user-login`）；同时补录 TASK-001 spike 状态（ADR-018 ACCEPTED + spike-decision-proxy.md 已落地），tasks.md/json 与 build.md 清单统一为 7/7 completed | 2026-08-15 | SDDU Build Agent |
| v1.6 | review R1 改进项修复 — 处置 4 项改进（1/3/4 fixed，2 recorded）：① sddu-auto.md.hbs §4.1 新增「写入 auto-context.json」指令打通决策依据注入（改进项 1）；② ADR-020 追加架构调整说明 + 模板 §6 改「完成阶段汇总」，decision-proxy `appendDecisions` 承担协议层落盘（改进项 2）；③ decision-proxy.ts HTTP 兜底 try-catch 捕获不冒泡（改进项 3）；④ decision-proxy.test.ts 补 7 单测（refreshLaunchIntent/httpReplyQuestion/三级降级顺序，改进项 4）；`npm run build` + `npm run test:opencode`（25 passed）+ `npm run test:core`（131 passed）通过 | 2026-08-15 | SDDU Build Agent |
| v1.7 | validate R1 P1 修复 — 修复 flaky 单测根因（`matchOption` 单字符标签误匹配 projectDirectory 路径随机字符）：`decision-proxy.ts` `matchOption` 仅对多字符标签（length ≥ 2）做关键词匹配，单字符标签跳过匹配直接回退首个选项（NFR-003 确定性）；补 2 单测（「单字符标签确定性回退首个选项」根因回归 + 「多字符标签仍正常匹配」防削弱）；`npm run test:opencode` 6 轮复跑全绿（27 passed，25→27）+ `npm run test:core`（131 passed）+ `npm run build` 通过 | 2026-08-16 | SDDU Build Agent |
| v1.8 | 职责越界修复（FR-AUTONOMY-001）— 仅改 `src/templates/agents/sddu-auto.md.hbs`（7 处），补「调度者不实施」硬约束 + 「问题派发修复流程」；`npm run build:agents` 重新生成 `dist/templates/agents/sddu-auto.md`；7 子 Agent 模板零改动 | 2026-08-16 | SDDU Build Agent |
| v1.9 | 权限层面硬性落实「调度者不实施」（FR-AUTONOMY-001）— 仅改 `src/templates/agents/sddu-auto.md.hbs`（7 处），frontmatter `edit`/`bash`/`webfetch` 由 allow 改 deny（保留 task/skill），§4.1 改「派发子 Agent 写入 auto-context.json」、§5.2 新增规则 6、§5.3/§8/§9/§10 同步强化；`npm run build:agents` 重新生成 `dist/templates/agents/sddu-auto.md`（逐字节一致）；7 子 Agent 模板零改动 | 2026-08-16 | SDDU Build Agent |
| v1.10 | review 增量复核遗留项修复（FR-AUTONOMY-001，R1-A/R1-B/R1-C）— 仅改 `src/templates/agents/sddu-auto.md.hbs`：① R1-A §7.2 改「task 派发子 Agent 执行 sddu-tree Skill 更新 TREE.md」（无 bash 权限不亲自执行，派 sddu-fast/general 跑 `node scripts/generate-tree.cjs`，§5.3/§8/§10 同步）；② R1-B 删除 frontmatter 无效 `task: allow`/`skill: allow` 键；③ R1-C §9「回退重跑」改「派发对应子 Agent 重跑」；`npm run build:agents` 重新生成 `dist/templates/agents/sddu-auto.md`（逐字节一致）；7 子 Agent 模板零改动 | 2026-08-16 | SDDU Build Agent |
