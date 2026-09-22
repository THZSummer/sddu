# SHELF — specs-tree-autonomous-mode 搁置说明

> **Feature**: 自主模式（sddu-auto 自动调度） / **Feature ID**: FR-AUTONOMY-001
> **状态**: 🅿️ suspended（搁置） · phase 保持 `validated`
> **搁置日期**: 2026-09-13
> **归档分支**: `docs/shelf-autonomous-mode`（仅设计文档，已合入 `main`）

---

## 1. 搁置状态摘要

| 项目 | 内容 |
|------|------|
| 搁置原因 | **auto 效果不稳定**（用户实测反馈：很不稳定） |
| 搁置类型 | **长期搁置，不设恢复期限**（`suspendedUntil: null`） |
| 决策时间 | 2026-09-13 |
| 处置策略 | 实施代码整体搁置在 `feature/autonomous-mode`；仅设计文档合入 `main` 以提供「需求存在但已搁置」的感知 |
| 未来预留 | 若需该能力，**单独重新实施或参考还原，不与此需求挂钩** |

本需求已完成完整的 SDDU 工作流（discovery → spec → plan → tasks → build → review → validate），
并额外完成方案 E 改造（TASK-008 契约 spike + TASK-009 实现）与契约根因修复；
但真实体验复盘显示 auto 表现不稳定，故整体搁置。

---

## 2. 实施内容位置（关键，供未来重启）

### 2.1 分支

| 项目 | 值 |
|------|-----|
| 本地分支 | `feature/autonomous-mode` |
| 远端分支 | `origin/feature/autonomous-mode`（推送地址 `git@ssh.github.com:THZSummer/sddu.git`，端口 **443**） |
| 搁置时 HEAD | `f84c3c0f307bbb5fc554f8dd74b91a2e15131858`（Merge branch 'main' into feature/autonomous-mode） |
| 独有提交范围 | `28f374a..6dc17c6`（**8 个**独有提交；等价 `28f374a^..6dc17c6`） |

> ⚠️ 该分支**不可修改 / 不可删除 / 禁止 force push**，是实施内容的唯一权威留存。

### 2.2 独有提交清单（8 个）

| # | Commit | 说明 |
|---|--------|------|
| 1 | `28f374a` | FR-AUTONOMY-001 discovery/spec/plan/tasks 四阶段产物 + Roadmap v20.0.0 |
| 2 | `66df1e9` | build/review/validate 完成 — decision-proxy + sddu-auto 模板 + e2e 入口 + 全套验证产物 |
| 3 | `482c0e8` | 调度者不实施 — sddu-auto 权限收敛（edit/bash deny）+ auto-context 派发写入 + review 遗留修复 |
| 4 | `6f1fa94` | FR-006 运行实证修复 — 插件加载 loader + reply 全局通道 + install 布局修复 |
| 5 | `3ec619b` | auto 模式体验提示词优化 — 去掉强制自主决策命令，提示词更简洁聚焦 |
| 6 | `1efab0a` | 代答机制方案演进 B→B'→E + TASK-008 方案 E 契约验证（spike-decision-session） |
| 7 | **`4c91fd4`** | **方案 E 实现** — decision-proxy 建决策会话 + prompt LLM 真思考代答 + 30s 超时兜底 |
| 8 | **`6dc17c6`** | **契约根因修复** — 注入契约「绝不问人」→「正常提问」（不暴露 auto）+ 真实路径验证（decision_count=1） |

### 2.3 完整影响面清单（39 文件，5 类）

`git diff main feature/autonomous-mode` = **39 files changed, 7021 insertions(+), 585 deletions(-)**

#### ① 流程产物 24 文件（本目录 `.sddu/specs-tree-root/specs-tree-autonomous-mode/`）

ADR-018~021（4） + discovery/spec/plan/tasks/build/review/validate 及报告（8） +
evaluation-report / evaluation-scheme-e（2） + research-agent-reply（1） +
spike-decision-proxy / spike-decision-session（2） + verify-decision-proxy / verify-prompt-interrupt / verify-real-path（3） +
tasks.json（1） + TREE.md（1） + state.json（1） + 本次新增 SHELF.md（1） = 24

> main 上仅归档①②，**其余类别（③④⑤）全部留在 `feature/autonomous-mode`**。

#### ② 根级记录 3 文件

| 文件 | 变更 |
|------|------|
| `.sddu/ROADMAP.md` | v3.3.0 FR-AUTONOMY-001 规划条目 + 时间线（main 版本已标注搁置） |
| `.sddu/TREE.md` | Feature 目录计数 |
| `.sddu/specs-tree-root/TREE.md` | Feature 目录一览 |

#### ③ 源码实施 7 文件

| 文件 | 变更量 |
|------|--------|
| `src/adapters/opencode/decision-proxy.ts` | **新增 804 行**（方案 E 决策代理层核心） |
| `src/adapters/opencode/hooks.ts` | 新增 173 行（从 plugin.ts 拆出） |
| `src/adapters/opencode/tools.ts` | 新增 338 行（从 plugin.ts 拆出） |
| `src/adapters/opencode/plugin.ts` | **拆分重构** +23 / −478（职责下沉） |
| `src/adapters/opencode/templates/opencode.json.hbs` | +6 / −1（注册 sddu-auto） |
| `src/templates/agents/sddu-auto.md.hbs` | 新增 282 行（sddu-auto 代理模板） |
| `src/__tests__/unit/adapters/decision-proxy.test.ts` | 新增 1055 行（单测） |

#### ④ 构建 / 安装 3 文件

| 文件 | 变更量 |
|------|--------|
| `install.sh` | +20 / −2 |
| `install.ps1` | +15 / −1 |
| `scripts/build-agents.cjs` | +1 / −1 |

#### ⑤ e2e 2 文件

| 文件 | 变更量 |
|------|--------|
| `e2e/scripts/basic/sddu-e2e.sh` | +30 / −3 |
| `e2e/scripts/fullstack/sddu-e2e-fullstack.sh` | +36 / −3 |

---

## 3. 机制现状简述（搁置时的实现形态）

- **方案 E**：插件内决策会话 LLM 代答 — decision-proxy 在子 Agent 触发提问时，
  通过 `client.session.create` 建/复用「决策会话」，用 `client.session.prompt`（agent=`sddu-auto`）
  让 LLM 真思考后作答，解析答案回填；**30s 超时兜底**降级到 DecisionEngine 规则匹配。
- **契约**：注入子 Agent 的上下文档位为「**正常提问**」（不暴露 auto 存在），
  避免子 Agent 感知自主层而改变行为；根因修复见 `6dc17c6`。
- **设计约束**：子 Agent 零改动（NG-001/FR-005）；plugin.ts 职责拆分（ADR-021）。
- **验证基线**（搁置前）：build 全绿；`test:core` 131 passed；`test:opencode` 47 passed；
  e2e 端到端（启动六维问卷 + auto-context.json 写入 + 绝不问人 + 阶段顺序调度 + 产物沉淀）。
- 详见 `ADR-018.md`、`plan.md`、`build.md`、`spike-decision-session.md`、`verify-real-path.md`。

---

## 4. 已知问题（搁置根因）

| 问题 | 说明 | 影响 |
|------|------|------|
| **auto 效果不稳定** | 用户实测反馈「很不稳定」，为搁置的**直接原因** | 阻断交付，整体搁置 |
| 触发条件波动 | 何种提问/场景下代答是否生效不稳定（**待补充**：精确复现条件与频次） | 决策闭环不可预测 |
| 决策质量波动 | LLM 代答的决策质量与预期不一致（**待补充**：典型错误样例） | 流程产物质量不可控 |
| 流程产物质量波动 | 全自主跑完的产物质量波动（**待补充**：与人工逐步流程的差异量化） | 交付质量不达预期 |
| 历史遗留 | validate 阶段曾记录 1 个 P1 flaky 单测（`contextFile` 缺失，matchOption 单字符标签误匹配 projectDirectory） | 单测稳定性 |

> 以上「待补充」项为搁置时的已知缺口；重启前建议先补齐实测记录，作为重新实施的输入。

---

## 5. 恢复步骤建议

1. `git checkout feature/autonomous-mode`（必要时 `git fetch` 后基于 `origin/feature/autonomous-mode`）。
2. 参考该分支的 8 个独有提交（重点 `4c91fd4` 方案 E、`6dc17c6` 契约修复）与本文档第 2.3 节影响面清单。
3. 选择「**参考还原**」或「**重新实施**」：
   - 参考还原：按影响面清单逐文件摘取，注意 `plugin.ts` 拆分、install loader、e2e 入口三处强耦合点。
   - 重新实施：优先解决第 4 节不稳定根因，再决定复用方案 E。
4. **若重启，应新建 Feature（新目录 + 新 Feature ID）承载，不复活本需求**；
   本需求视为「已存在但已搁置」的历史记录，保持 `suspended`。

---

## 6. 归档边界声明

- **`main` 仅含设计文档**（本目录 24 个文件：`.md` / `.json` / `TREE.md`），**无任何实施代码**。
- `src/`、`install.sh`、`install.ps1`、`scripts/`、`e2e/`、`dist/`、`.opencode/` 均**未被带入 main**，
  全部保留在 `feature/autonomous-mode`。
- 本目录内文档对实施内容的描述仅为**记录与索引**，不构成 main 上的可运行实现。
- `main` 上的需求状态为 `suspended`（`state.json`），并含实施分支 / 提交范围 / 恢复指引等重启线索。
