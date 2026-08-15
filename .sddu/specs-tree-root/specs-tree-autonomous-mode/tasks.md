# 任务分解：自主模式（sddu-auto 自动调度）

> **文档定位**: SDDU 任务清单 — 将技术方案分解为可并行执行的原子任务，作为 build 阶段的输入  
> **前置依赖**: plan.md（技术方案 v3.2）、spec.md（需求规范 v1.0）、ADR-018~021（方案 D 决策链）  
> **创建人**: SDDU Tasks Agent  
> **创建时间**: 2026-08-15  
> **版本**: v1.0  
> **更新人**: SDDU Tasks Agent  
> **更新时间**: 2026-08-15  
> **更新说明**: 初始创建 — 基于 plan.md v3.2 + ADR-018~021 分解 7 个原子任务，首个 spike 前置实测决策代理层可行性

## 1. 依赖拓扑总览
> 任务依赖关系和执行顺序

```
Wave 1 ─── (无依赖，全部并行)
  TASK-001 [L]  spike：决策代理层最小可行性实测（question.asked + Question.reply 插件 API）
  TASK-002 [M]  plugin.ts 纯重构拆分（tools.ts + hooks.ts + 瘦身组装入口，行为零变化）
  TASK-005 [S]  注册 sddu-auto（opencode.json.hbs + build-agents.cjs）
  TASK-006 [S]  e2e 脚本启用 --auto 标志（AUTO_MODE=true 入口切 @sddu-auto）

Wave 2 ─── (依赖 Wave 1)
  TASK-003 [M]  decision-proxy.ts 实现 + 接入 plugin.ts（依赖 TASK-001 实测结论 + TASK-002 重构）
  TASK-004 [M]  sddu-auto.md.hbs 模板编写（依赖 TASK-001 落地方式确定）

Wave 3 ─── (依赖 Wave 2)
  TASK-007 [M]  集成装配验证（构建产物 + 注册 + 入口冒烟，依赖 TASK-003/004/005/006）
```

> ⚠️ **依赖要点**（与 plan.md §4 待验证点对齐）：
> - **TASK-001 是全局关键路径**：方案 D 的落地通道（插件 hook / HTTP API / 方案 C 降级）由其实测结论决定，直接决定 TASK-003 与 TASK-004 的实现方式。
> - **TASK-002 纯重构独立于 spike**：行为零变化，可与 spike 并行推进，二者不互相阻塞。
> - **TASK-003 与 TASK-002 均改 plugin.ts**，必须串行（TASK-003 在重构后的干净组装入口上接入 decision-proxy），避免编辑冲突。

## 2. 任务列表
> 每个任务的详细定义

### TASK-001: spike — 决策代理层最小可行性实测
> 方案 D 的可行性验证，全局最高优先级

| 属性 | 值 |
|------|-----|
| **复杂度** | L |
| **前置依赖** | 无 |
| **执行波次** | 1 |
| **对应 FR** | FR-004, FR-006 |

**描述**: 方案 D（ADR-018）依赖 opencode 插件 API 是否暴露「订阅 `question.asked` 事件 + 调用 `reply(requestID, answers)` 代答」能力。**关键风险已探明**：当前安装的 `@opencode-ai/plugin` / `@opencode-ai/sdk` 为 1.16.2，其 `Event` 类型联合中不含 question 事件、SDK client 无 Question service；而 ADR-018 调研的是 opencode 1.18.18（存在版本差异）。此任务在 e2e 测试项目（或最小样本插件）中实测三点：① `event` hook 能否收到 `question.asked`（必要时确认是否需升级 plugin SDK 至 1.18.x）；② reply 代答通道是否存在（client 方法或 HTTP API `session.question.reply`）；③ task 工具调度的子会话 sessionID 与 question 事件 sessionID 的关联方式。产出结论，判定落地路径：**插件 hook 通道 / HTTP API / 方案 C 降级**。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| NEW | `e2e/` 下最小样本插件/测试脚本（或临时测试项目内的 spike 脚本） |
| MODIFY | `.sddu/specs-tree-root/specs-tree-autonomous-mode/ADR-018.md`（状态 PROPOSED → ACCEPTED 或 SUPERSEDED） |

**验收标准**:
- [ ] spike 报告落地，明确记录「question.asked 是否可订阅」「reply 代答通道是否存在」「sessionID 关联方式」三项实测结论
- [ ] 明确判定 decision-proxy 落地路径（插件 hook / HTTP API / 方案 C）
- [ ] ADR-018 状态已按实测结论更新（可行 → ACCEPTED；插件与 HTTP 均不可行 → SUPERSEDED 并转方案 C）

**验证命令**:
```bash
# 在 e2e 测试项目（$HOME/sddu-test-projects/）或最小样本插件中实测
bash e2e/scripts/basic/sddu-e2e.sh spike-probe   # 创建即安装的测试项目
# 1) 挂载 event hook 记录事件流，触发子 Agent 调用 question 工具，观察是否收到 question.asked
# 2) 探测 reply 通道：client.question?.reply / HTTP API POST session.question.reply
# 3) 记录 task 工具返回的 task_id 与 question 事件 sessionID 的关联
# 4) 落盘 spike 报告，并更新 ADR-018 状态
```

### TASK-002: plugin.ts 纯重构拆分（tools.ts + hooks.ts + 瘦身组装入口）
> 行为零变化的必要重构，为容纳 decision-proxy 腾空间

| 属性 | 值 |
|------|-----|
| **复杂度** | M |
| **前置依赖** | 无 |
| **执行波次** | 1 |
| **对应 FR** | FR-005（间接：重构不改子 Agent，不改既有行为） |

**描述**: 按 ADR-021 将 `src/adapters/opencode/plugin.ts`（537 行）拆分为 3 个文件：`tools.ts`（收敛 3 个状态工具 `sddu_update_state` / `sddu_tag_feature` / `sddu_get_all_states` + 辅助函数 `legacyStatusToPhase` / `readFeatureState` / `writeFeatureState`）、`hooks.ts`（收敛 4 个生命周期 hook `session.created` / `file.edited` / `session.idle` / `session.end`）、`plugin.ts` 瘦身为「初始化 + 组装」入口。全局单例（`globalAutoUpdater` / `globalStateMachine`）由 plugin.ts 持有并注入 hooks.ts（依赖传递替代跨模块全局变量）。**对外 tool 名与 hook 名保持不变，行为零变化**。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| NEW | `src/adapters/opencode/tools.ts` |
| NEW | `src/adapters/opencode/hooks.ts` |
| MODIFY | `src/adapters/opencode/plugin.ts` |

**验收标准**:
- [ ] `npm run build` 通过（tsc 编译新模块无类型错误）
- [ ] 3 工具名不变：`sddu_update_state` / `sddu_tag_feature` / `sddu_get_all_states`
- [ ] 4 hook 名不变：`session.created` / `file.edited` / `session.idle` / `session.end`
- [ ] `npm run test:core` 通过（state machine 底层行为不变）

**验证命令**:
```bash
npm run build && npm run test:core
grep -rn "sddu_update_state\|sddu_tag_feature\|sddu_get_all_states" src/adapters/opencode/
grep -rn "session.created\|file.edited\|session.idle\|session.end" src/adapters/opencode/
```

### TASK-003: decision-proxy.ts 实现 + 接入 plugin.ts
> 方案 D 核心：Question 协议层拦截 + 代答

| 属性 | 值 |
|------|-----|
| **复杂度** | M |
| **前置依赖** | TASK-001, TASK-002 |
| **执行波次** | 2 |
| **对应 FR** | FR-004, FR-005, FR-006, NFR-003 |

**描述**: 按 TASK-001 实测结论落地 `src/adapters/opencode/decision-proxy.ts`，并接入重构后的 plugin.ts 组装。核心四步：① 订阅 `question.asked` 事件；② 识别「sddu-auto 调度的子会话提问」（维护「调度 sessionID → 子会话 sessionID」映射）；③ LLM 自主决策答案（注入启动诉求 + 项目上下文，拿不准也硬决策，NFR-003）；④ 调用 `reply(requestID, answers)` 代答，问题全程不到达终端用户（FR-006）。**只拦截 sddu-auto 调度的子会话，不干扰普通 sddu/sddu-fast 的既有提问行为**。若 TASK-001 结论为方案 C 降级，本任务改为双会话代理 resume 实现，并同步更新 ADR-018。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| NEW | `src/adapters/opencode/decision-proxy.ts` |
| MODIFY | `src/adapters/opencode/plugin.ts`（组装接入 decision-proxy） |

**验收标准**:
- [ ] `npm run build` 通过
- [ ] decision-proxy 具备「订阅 + 识别 + 决策 + 代答」四步完整链路
- [ ] 仅对 sddu-auto 调度的子会话生效（sessionID 匹配逻辑存在并可验证），非 sddu-auto 会话提问不受影响
- [ ] 决策逻辑在信息不足时仍返回确定答案（不阻塞、不反问，NFR-003）

**验证命令**:
```bash
npm run build
# 若补充单元测试（推荐）：覆盖 sessionID 匹配 + 决策/代答调用
npx jest --selectProjects opencode -t decision-proxy --passWithNoTests 2>/dev/null || echo "用 e2e 冒烟替代"
```

### TASK-004: sddu-auto.md.hbs 模板编写
> 核心交付物：第三调度入口 Agent 行为定义

| 属性 | 值 |
|------|-----|
| **复杂度** | M |
| **前置依赖** | TASK-001 |
| **执行波次** | 2 |
| **对应 FR** | FR-001, FR-002, FR-003, FR-007, FR-008, FR-009, FR-010, NFR-001, NFR-002, NFR-003 |

**描述**: 编写 `src/templates/agents/sddu-auto.md.hbs`（第 1 层 source-of-truth），定义 sddu-auto 完整行为。必含章节：① 角色定位（第三调度入口，与 sddu/sddu-fast 并列，进入即自主、无复杂度门槛）；② 启动阶段六维结构化问卷（ADR-019：背景/目标/范围为必采「最小充分信息集」，验收期望/技术偏好/优先级尽力采，采满最小集自动进入执行）；③ 执行阶段「绝不问人」硬约束 + 按 discovery→spec→plan→tasks→build→review→validate 顺序经 task 工具调度 7 子 Agent（注入固化后的自主执行上下文）；④ 决策追溯 `auto-decisions.md`（ADR-020：记录关键决策点 + 依据 + 硬决策标注，**明确该文件不参与状态机 requiredFiles 校验、不触发 phase 流转**）；⑤ 复用 `sddu_update_state` 推进 phase + 完成后调用 sddu-tree Skill 更新导航。frontmatter 含 description/mode/temperature/permission（需 task 与工具权限以调度子 Agent 与推进状态）。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| NEW | `src/templates/agents/sddu-auto.md.hbs` |

**验收标准**:
- [ ] 含 frontmatter（description / mode / temperature / permission）
- [ ] 含六维启动问卷定义，且明确「背景/目标/范围」三项为必采（最小充分信息集）
- [ ] 含执行阶段「绝不问人」硬约束 + 7 阶段顺序调度编排
- [ ] 含 `auto-decisions.md` 决策追溯说明，且明确不参与状态机校验
- [ ] `npm run build:agents` 成功生成 `dist/templates/agents/sddu-auto.md`

**验证命令**:
```bash
npm run build:agents
grep -n "背景\|目标\|范围\|最小充分\|绝不问人\|auto-decisions" src/templates/agents/sddu-auto.md.hbs
test -f dist/templates/agents/sddu-auto.md && echo "OK: dist 产物已生成"
```

### TASK-005: 注册 sddu-auto（opencode.json.hbs + build-agents.cjs）
> 注册与构建链路的文本级配置

| 属性 | 值 |
|------|-----|
| **复杂度** | S |
| **前置依赖** | 无 |
| **执行波次** | 1 |
| **对应 FR** | FR-001, FR-008 |

**描述**: 两处注册：① `src/adapters/opencode/templates/opencode.json.hbs` 的 `agent` 块注册 `sddu-auto`（description/model 对齐既有 Agent，`prompt` 指向 `{file:agents/sddu-auto.md}`）；② `scripts/build-agents.cjs` 的 `specialAgents` 数组加入 `'sddu-auto'`，使 `npm run build` 生成其构建产物。**完整构建（含 sddu-auto 产物）的验证在 TASK-007 统一执行**，本任务仅做配置级验证。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| MODIFY | `src/adapters/opencode/templates/opencode.json.hbs` |
| MODIFY | `scripts/build-agents.cjs` |

**验收标准**:
- [ ] `opencode.json.hbs` 的 agent 块含 `sddu-auto`，`prompt` 指向 `{file:agents/sddu-auto.md}`
- [ ] `build-agents.cjs` 的 `specialAgents` 含 `'sddu-auto'`

**验证命令**:
```bash
grep -n "sddu-auto" src/adapters/opencode/templates/opencode.json.hbs
grep -n "specialAgents\|sddu-auto" scripts/build-agents.cjs
```

### TASK-006: e2e 脚本启用 --auto 标志（入口切 @sddu-auto）
> 本 Feature 的 e2e 验证入口

| 属性 | 值 |
|------|-----|
| **复杂度** | S |
| **前置依赖** | 无 |
| **执行波次** | 1 |
| **对应 FR** | FR-001, FR-002 |

**描述**: 两个 e2e 脚本（`e2e/scripts/basic/sddu-e2e.sh`、`e2e/scripts/fullstack/sddu-e2e-fullstack.sh`）已内置 `AUTO_MODE` 变量与 `--auto` 标志，现启用：`AUTO_MODE=true` 时，生成的测试提示词入口从 `@sddu $PROJECT_NAME` 切换为 `@sddu-auto $PROJECT_NAME`（heredoc 与 echo 两处）；默认（无 `--auto`）仍为 `@sddu`，不改变现有行为。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| MODIFY | `e2e/scripts/basic/sddu-e2e.sh` |
| MODIFY | `e2e/scripts/fullstack/sddu-e2e-fullstack.sh` |

**验收标准**:
- [ ] `bash -n` 语法检查通过（两个脚本）
- [ ] `--auto` 模式下生成的 `sddu-test-prompt.md` 入口为 `@sddu-auto`（非 `@sddu`）
- [ ] 默认（无 `--auto`）时入口仍为 `@sddu`

**验证命令**:
```bash
bash -n e2e/scripts/basic/sddu-e2e.sh && bash -n e2e/scripts/fullstack/sddu-e2e-fullstack.sh
bash e2e/scripts/basic/sddu-e2e.sh user-login --auto
grep -n "@sddu-auto\|@sddu " "$HOME/sddu-test-projects/sddu-test-user-login/sddu-test-prompt.md"
```

### TASK-007: 集成装配验证（构建产物 + 注册 + 入口冒烟）
> 全链路装配完整性冒烟，完整 7 流程端到端验收留待 validate 阶段

| 属性 | 值 |
|------|-----|
| **复杂度** | M |
| **前置依赖** | TASK-003, TASK-004, TASK-005, TASK-006 |
| **执行波次** | 3 |
| **对应 FR** | FR-001, FR-002, FR-007, NFR-002 |

**描述**: 验证装配完整性（确定性、可自动化）：`npm run build` 全绿；`dist/templates/agents/sddu-auto.md` 存在；e2e 脚本 `--auto` 生成的测试项目 install 成功（`[2/3]` 内置 install.sh，创建即安装）且 `@sddu-auto` 已注册、入口正确。**完整 7 流程端到端运行（含决策代理代答行为、执行阶段绝不问人、全套产物）属 validate 阶段职责**，本任务只做可自动化装配冒烟，确认「入口可达、产物齐备、可启动」。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| 无 | 纯验证（不新增/修改源码；验证脚本/报告可按需写入测试项目） |

**验收标准**:
- [ ] `npm run build` 全绿（build:agents + build:ts）
- [ ] `dist/templates/agents/sddu-auto.md` 存在，且 `opencode.json` 注册 `sddu-auto`
- [ ] e2e 测试项目 install 成功，`@sddu-auto` 可用（opencode 启动无报错）
- [ ] `--auto` 生成的提示词入口为 `@sddu-auto`

**验证命令**:
```bash
npm run build
test -f dist/templates/agents/sddu-auto.md && echo "OK: sddu-auto 产物存在"
bash e2e/scripts/basic/sddu-e2e.sh user-login --auto   # 创建即安装 + 入口切换
grep -n "sddu-auto" "$HOME/sddu-test-projects/sddu-test-user-login/sddu-test-prompt.md"
```

## 3. 任务汇总
> 任务数量、复杂度和波次的统计总览

| 统计项 | 数值 |
|--------|:--:|
| 总任务数 | 7 |
| S 级 (简单) | 2 |
| M 级 (中等) | 4 |
| L 级 (复杂) | 1 |
| 执行波次 | 3 |

## 4. 执行策略
> 各波次的执行说明

| 波次 | 任务 | 策略 |
|:--:|------|------|
| 1 | TASK-001, TASK-002, TASK-005, TASK-006 | 并行执行（无依赖）：spike 实测优先级最高，重构与配置/脚本可同步推进 |
| 2 | TASK-003, TASK-004 | 并行执行（均依赖 Wave 1）：TASK-003 依赖 001 结论 + 002 重构，TASK-004 依赖 001 落地方式 |
| 3 | TASK-007 | 串行（依赖 003/004/005/006 全部完成） |

> **执行要点**：
> - **TASK-001 必须最先启动并优先出结论**——它是全局关键路径，其结论决定 TASK-003/004 的实现方向；若结论为方案 C 降级，TASK-003 实现方式随之改变且需更新 ADR-018。
> - **TASK-002 是纯重构**（行为零变化），S/M 级自动批量执行策略适用，靠 `npm run build + test:core` 回归把关。
> - **TASK-003 若 spike 结论为方案 C**，复杂度升级为 L（双会话代理 resume，多依赖），需人工监督。

## 修订记录
> 记录本文档的版本变更历史

| 版本 | 变更说明 | 日期 | 修订人 |
|------|---------|------|--------|
| v1.0 | 初始创建 — 基于 plan.md v3.2 + ADR-018~021 分解 7 个原子任务，首个 spike 前置实测决策代理层可行性，plugin.ts 拆分为纯重构独立验证，3 波次编排 | 2026-08-15 | SDDU Tasks Agent |
