# dsh 契约依赖点（人读版）

> **文档定位**: dsh 适配的契约依赖点清单 —— 升级跟随与破坏点定位的对照表
> **生成方式**: ⚙️ 本文件由 `scripts/build-dsh-skills.cjs` 从 
> `src/adapters/dsh/contract/dsh-contract-manifest.json` **自动渲染**，**禁止手工编辑**（ADR-006）。
> **权威来源**: `src/adapters/dsh/contract/dsh-contract-manifest.json`（唯一来源）
> **契约快照**: 2026-08-14（**截至该日期的事实**）
> **契约清单哈希**: `344807b58b901a4ee0683f1ede17a58f13d7c6a263b1dcbc1c86205b82bdebcb`
> **SDDU 版本**: 1.1.0
> **生成时间**: 2026-09-27T10:18:50.274Z

## ⚠️ 时效声明（NFR-007）

全部 dsh 事实来自 **2026-08-14 单一调研快照**；在按 [`upgrade-following.md`](./upgrade-following.md) **步骤 0 刷新契约**之前，**本清单不得被当作当前 dsh 事实**。

**未刷新即不可信**：跳过步骤 0 / 步骤 5 会让 `snapshotDate` 失真，清单反而产生**虚假确定性**。

`command-registration` / `profile-bundle` / `guard-pipeline` 三类为**快照未覆盖或演进点**，其 `observableCheck` 只能写「需刷新后补全」，属**已知空白** —— 不得在文档中把空白表述为已确认。

## 依赖点总览

共 **7** 条依赖点，覆盖 7 个 area。

| # | id | area | 覆盖状态 | 快照日期 |
|:--:|----|------|---------|---------|
| 1 | `skill-provider-rank` | `skill-provider` | covered（快照已覆盖（调研快照 §3.4）。） | 2026-08-14 |
| 2 | `skill-discovery-cache` | `skill-discovery-cache` | covered（快照已覆盖（调研快照 §3.4）。） | 2026-08-14 |
| 3 | `command-registration` | `command-registration` | known-gap（已知缺口 / 需 dsh 插件（ADR-002 决策 4）。） | 2026-08-14 |
| 4 | `profile-bundle` | `profile-bundle` | snapshot-uncovered（快照未覆盖，需刷新后补全（ADR-006 决策 1）。） | 2026-08-14 |
| 5 | `dir-convention` | `dir-convention` | covered（快照已覆盖（ADR-001 §2 rank 表）。） | 2026-08-14 |
| 6 | `session-events` | `session-events` | covered（快照已覆盖（调研快照 §3.2）。） | 2026-08-14 |
| 7 | `guard-pipeline` | `guard-pipeline` | evolution-point（演进点，本 Feature 不实现，v5.1.0+ 评估（ADR-003 决策 3）。） | 2026-08-14 |

## 1. `skill-provider-rank`

- **area**: `skill-provider`
- **快照日期**: 2026-08-14
- **覆盖状态**: covered —— 快照已覆盖（调研快照 §3.4）。
- **事实（快照）**: SkillProvider 接口为 list() + get()；本地发现的优先级 rank 100~600：project-dsh(100) / project-agents(200) / custom(300) / user-dsh(400) / user-agents(500) / bundled(600)。
- **假设**: rank 表与各 rank 对应的根目录约定未变。
- **可观测校验 (`observableCheck`)**: 在 dsh Web UI 列出 skill，确认 SDDU 条目的来源标识与优先级；确认 <projectRoot>/.dsh/skills 被扫描。
- **破坏影响 (`breakImpact`)**: 落位失效 → FR-001 / V1 不可通过。
- **修复提示 (`fixHint`)**: 改 scripts/install/dsh/install.sh 的落位常量 + skill-header.md.hbs 的来源标识；必要时新增 rank 映射说明。

## 2. `skill-discovery-cache`

- **area**: `skill-discovery-cache`
- **快照日期**: 2026-08-14
- **覆盖状态**: covered —— 快照已覆盖（调研快照 §3.4）。
- **事实（快照）**: 发现缓存以解析后的 scope 链为键；skills/change 事件驱动消费方重新快照。冲突规则：跨层「最近层优先」，同层内按 rank 裁决。
- **假设**: scope 链组合方式与 skills/change 事件名未变。
- **可观测校验 (`observableCheck`)**: 安装/删除 sddu-* 目录后触发 skills/change，确认 dsh Web UI 的 skill 列表刷新、无陈旧缓存条目。
- **破坏影响 (`breakImpact`)**: 已安装但列表不可见（陈旧缓存）→ FR-001 / V1 不可通过。
- **修复提示 (`fixHint`)**: 更新 scripts/install/dsh/install.sh 的重新快照提示与 docs/dsh/README.md 的 EC-004 说明。

## 3. `command-registration`

- **area**: `command-registration`
- **快照日期**: 2026-08-14
- **覆盖状态**: known-gap —— 已知缺口 / 需 dsh 插件（ADR-002 决策 4）。
- **事实（快照）**: 快照未覆盖：未记录可由 Skill 包注册平台级命令的 seam；快照中出现的斜杠交互来自方法论插件（如 plan mode 的 /plan），即命令由插件提供而非 Skill 提供。
- **假设**: 平台级命令注册需 dsh 插件（Cordis bundle / cordis.patch.yml overlay）；快照未覆盖，需刷新后补全。
- **可观测校验 (`observableCheck`)**: 需刷新后补全。当前替代观测：在 dsh Web UI 输入 /sddu ... 前缀，确认其是否作为普通文本消息送达并被路由 Skill 识别。
- **破坏影响 (`breakImpact`)**: 入口不可达 → FR-002 / V2 不可通过。
- **修复提示 (`fixHint`)**: 降级为文本前缀 / 自然语言入口（见 router-command-map.json 的 fallbackUsage）；若用户要求平台级命令体验，评估 dsh 插件方案（v5.1.0+）。

## 4. `profile-bundle`

- **area**: `profile-bundle`
- **快照日期**: 2026-08-14
- **覆盖状态**: snapshot-uncovered —— 快照未覆盖，需刷新后补全（ADR-006 决策 1）。
- **事实（快照）**: profile 分层组装：dsh-base → dsh-web-app，叠加 cordis.patch.yml overlay。
- **假设**: 快照未覆盖：Cordis bundle 的完整装配契约细节（含 overlay 生效顺序与对 skill 发现的影响）未记录，需刷新后补全。
- **可观测校验 (`observableCheck`)**: 需刷新后补全（当前无法观测：无 CLI，且 Web UI 不暴露 profile 装配细节）。
- **破坏影响 (`breakImpact`)**: 若 profile overlay 影响 skill 发现根目录，则落位失效 → FR-001 / V1 不可通过。
- **修复提示 (`fixHint`)**: 刷新契约后补全 observableCheck；先确认 rank 100 目录（<projectRoot>/.dsh/skills）在 dsh-base → dsh-web-app 装配下仍被扫描。

## 5. `dir-convention`

- **area**: `dir-convention`
- **快照日期**: 2026-08-14
- **覆盖状态**: covered —— 快照已覆盖（ADR-001 §2 rank 表）。
- **事实（快照）**: 根目录约定：<projectRoot>/.dsh/skills（rank 100 project-dsh）、<projectRoot>/.agents/skills（rank 200）、Config.customSkillDirs（rank 300）、<dshHome>/skills（rank 400 user-dsh）、<agentsHome>/skills（rank 500）、Config.bundledSkillDir（rank 600）。
- **假设**: 目录层级与根目录常量未变。
- **可观测校验 (`observableCheck`)**: 确认 <projectRoot>/.dsh/skills 存在且被扫描；用户级安装时确认 <dshHome>/skills 被扫描。
- **破坏影响 (`breakImpact`)**: 落位失效 → FR-008（安装/卸载/残留校验）与 FR-001 不可通过。
- **修复提示 (`fixHint`)**: 改 scripts/install/dsh/install.sh 的根目录常量；同步 docs/dsh/README.md 的落位推演表。

## 6. `session-events`

- **area**: `session-events`
- **快照日期**: 2026-08-14
- **覆盖状态**: covered —— 快照已覆盖（调研快照 §3.2）。
- **事实（快照）**: SessionEvent 为 append-only 日志，含 12 种事件变体，支持回放 / fork / resume / compaction；不变量：Model-visible ⟺ logged。
- **假设**: 会话日志可回放，且会话消息内容可在日志中检索。
- **可观测校验 (`observableCheck`)**: 在会话记录中检索 [SDDU-GATE-DENY] / [SDDU-GATE-ALLOW] / [SDDU-STATE-SYNC] 单行 JSON 块，确认可回放。
- **破坏影响 (`breakImpact`)**: 证据链缺失（协议块不可检索）→ FR-005 / NFR-003 的可追溯性下降（不阻断阶段推进）。
- **修复提示 (`fixHint`)**: 调整协议块为单行 JSON（见 gate-protocol / state-sync-protocol）；同步更新 docs/dsh/verification.md 的观测指引。

## 7. `guard-pipeline`

- **area**: `guard-pipeline`
- **快照日期**: 2026-08-14
- **覆盖状态**: evolution-point —— 演进点，本 Feature 不实现，v5.1.0+ 评估（ADR-003 决策 3）。
- **事实（快照）**: ctx.tools.execute() waterfall：tools/pre-execute → 单调 guard → tools/execute → tools/post-execute → tools/result；guard 返回 string | undefined 且只能缩减权限（无 allow 结果），是运行时级强拒绝的理想载体。
- **假设**: 演进点，本 Feature 不实现：接入该流水线需注册 dsh 工具，属 dsh 插件 / bundle（Cordis）范畴，契约细节快照未覆盖。
- **可观测校验 (`observableCheck`)**: 需刷新后补全（当前无 Skill 侧接入点：Skill 不携带执行能力，不能注册工具或挂 guard）。
- **破坏影响 (`breakImpact`)**: 不适用（本 Feature 采用 FR-004b 显式软引导，见 ADR-003）。
- **修复提示 (`fixHint`)**: v5.1.0+ 评估：实现 SDDU 的 dsh 插件承载硬 guard 通道；先刷新契约补全 Cordis bundle 细节。

## 维护规则

1. 修改契约事实 → 只改 `dsh-contract-manifest.json`，然后重跑 `npm run build:dsh` 重新生成本文件；
2. 刷新 dsh 契约后 → 修改 `fact` / `assumption`，并 **bump `snapshotDate`** 为本次刷新日期（ADR-006 步骤 5）；
3. `phaseEnum` 必须与核心 `src/state/schema-v3.0.0.ts` 的 `VALID_PHASES` 深度相等，构建期强制校验；
4. 哈希变化即代表契约基线变化，应同步复核 `docs/dsh/dual-platform-diff.md` 与 ADR 修订说明。
