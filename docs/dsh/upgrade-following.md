# 升级跟随清单：dsh 契约刷新 → 破坏点定位 → 成本基线

> **文档定位**: FR-007 的可执行动作清单 —— 让 dsh 升级后，SDDU 适配成果可被**重新验证**且破坏点**可快速定位**
> **权威来源**: `src/adapters/dsh/contract/dsh-contract-manifest.json`（契约依赖点唯一来源）
> **前提**: 全程**不依赖命令行工具**（dsh 无 CLI，只能在 Web UI + 文件浏览中观测）
> **创建人**: SDDU Build Agent
> **版本**: v1.0

---

## 0. ⚠️ 未刷新即不可信（先读）

本清单与全部 SDDU × dsh 适配的事实，都锚定 **2026-08-14 单一快照**。

> **未刷新即不可信**：在**步骤 0** 完成之前，`dsh-contract-manifest.json` 里的
> `fact` / `assumption` 描述的是 2026-08-14 的状态，**不是当前 dsh 的行为**。
> 若跳过步骤 0 / 步骤 5，`snapshotDate` 会失真，清单反而产生**虚假确定性**，比没有清单更危险。

三条硬性纪律：

1. **记录优先于结论**：刷新失败也要**如实记录**（哪个依赖点、哪一天、为什么失败），不得沿用旧结论；
2. **「无法观测」不得记为「未变」**：模糊项必须显式标为「无法观测」并列入遗留风险；
3. **刷新后必须 bump `snapshotDate`**：步骤 5 不可省，否则下一次升级的人无法判断基线。

---

## 1. 升级跟随步骤 0~6

### 步骤 0：刷新 dsh 契约

**动作**：重新获取 dsh 的以下契约面，并逐条比对清单：

- skill 提供方接口（`list()` / `get()`）与 **rank 表**；
- **目录约定**（根目录、scope 链）；
- profile 装配（`dsh-base → dsh-web-app` + `cordis.patch.yml` overlay）；
- 命令注册机制（是否存在可由 Skill 包注册平台级命令的 seam）；
- 工具执行流水线（`tools/pre-execute` → 单调 guard → …）。

**观测**：记录 dsh **版本号**与**刷新日期**。

**刷新失败时**：**如实记录**「刷新失败：<日期> / <失败原因> / 影响的依赖点」，
保持**快照基准不变**，并把它挂到开放问题里继续跟踪。**不得**把失败记为「契约未变」。

---

### 步骤 1：记录 dsh 版本 + 本包快照日期

**动作**：查 `dist/dsh/manifest.json`，记录 `sdduVersion`、`dshContractSnapshot`、`contractManifestHash`。

**观测**：形成版本对照表：

| 项 | 值 |
|----|----|
| dsh 版本 | |
| 刷新日期 | |
| 本包 `sdduVersion` | |
| 本包 `dshContractSnapshot` | |
| 本包 `contractManifestHash` | |

---

### 步骤 2：逐条走 `observableCheck`

**动作**：打开 `docs/dsh/contract-dependencies.md`，对**每一条**依赖点执行其 `observableCheck`。

**观测**：每条标注三态之一 —— **未变 / 已变 / 无法观测**（禁止留空，禁止用「大概没变」）。
对「无法观测」的项，记录**为什么无法观测**（无 CLI？Web UI 不暴露？需要插件视角？）。

> 提示：`command-registration` / `profile-bundle` / `guard-pipeline` 三类在快照中属**未覆盖或演进点**，
> 其 `observableCheck` 写的是「需刷新后补全」——它们是**已知空白**，不得当作「未变」。

---

### 步骤 3：重复 V1 → V2 → V3

**动作**：按 [`verification.md`](./verification.md) 重跑三个最小场景：

| 场景 | 判据 |
|:--:|------|
| **V1（装配可见）** | 11 个 SDDU Skill 在 Web UI 可见、来源标识含正确快照日期 |
| **V2（入口可用）** | `/sddu` 与 `/sddu <phase> <feature>`（或其降级用法）能被识别与路由 |
| **V3（单阶段走通）** | 一个阶段完整走通：门禁块 + 产物落盘 + `[SDDU-STATE-SYNC]` + 三方对账一致 |

**观测**：通过 / 失败 + 会话记录（截图或可回放的会话内容）。

---

### 步骤 4：定位破坏点 → 记录 → 修复 → 复跑

**动作**：

1. 对步骤 2 中**已变**的依赖点与步骤 3 中**失败**的场景，定位破坏点（最小可复现的失效点）；
2. 用下一节的**破坏点记录模板**逐条记录（**可直接复制**）；
3. 修复：**只改 `src/adapters/dsh/` 下的资产/脚本**（`templates/` / `contract/` /
   `scripts/*dsh*` / `docs/dsh/`）—— 这是隔离边界带来的好处：修复面可控，不牵动核心域；
4. 复跑 V1 → V3，把结果回填到记录的「回归结果」字段。

**观测**：破坏点记录（每条一份）+ 修复 diff。

---

### 步骤 5：更新契约清单并 bump `snapshotDate`

**动作**：

1. 修改 `src/adapters/dsh/contract/dsh-contract-manifest.json` 中受影响条目的 `fact` / `assumption` / `observableCheck`；
2. **把 `snapshotDate` 与顶层 `dshContractSnapshot` bump 为本次刷新日期**（含每条依赖点的 `snapshotDate`）；
3. 若阶段枚举有变，同步 `phaseEnum`（必须与核心 `VALID_PHASES` 深度相等，构建期会强制校验）；
4. 重跑 `npm run build:dsh` 重新生成 `dist/dsh/manifest.json`、`docs/dsh/contract-dependencies.md`
   与 `dist/dsh/skills/*/SKILL.md`；
5. 受影响的 ADR 追加修订说明。

**观测**：`contractManifestHash` 发生变化（这是契约基线已更新的客观证据）。

---

### 步骤 6：形成成本基线

**动作**：记录「**从升级到回归通过**」的消耗，作为 v5.1.0 评估「多平台维护成本」的真实输入。

**观测**：见下一节成本基线口径表。

---

## 2. 破坏点记录模板（可直接复制）

> 每条破坏点复制一份。9 个字段缺一不可。

```markdown
### 破坏点记录

| # | 字段 | 内容 |
|:--:|------|------|
| 1 | dsh 版本 | <如 0.x.y（preview）> |
| 2 | 观测日期 | <YYYY-MM-DD> |
| 3 | 依赖点 id | <dsh-contract-manifest.json 中的 id，如 skill-provider-rank> |
| 4 | 期望（快照事实） | <该依赖点的 fact / observableCheck 中期望观测到的行为> |
| 5 | 实际观测 | <实际看到什么；若无法观测，写清原因> |
| 6 | 影响需求（FR/V） | <如 FR-001 / V1> |
| 7 | 修复动作 | <改了哪个文件、改了什么> |
| 8 | 回归结果 | <V1/V2/V3 复跑结果：通过/失败> |
| 9 | 遗留风险 | <未解决项、无法观测项、需要用户确认项> |
```

---

## 3. 成本基线口径表

| 指标 | 口径 | 记录方式 |
|------|------|---------|
| **人时（升级 → 回归通过）** | 从开始步骤 0 到步骤 3 全部通过（含修复与复跑）的实际投入人时 | 取 0.5h 粒度 |
| **破坏点数** | 步骤 4 中记录的破坏点记录**条数** | 整数 |
| **不可观测项数** | 步骤 2 中标为「无法观测」的依赖点数 | 整数 |
| **修复面** | 被修改的文件清单（应全部位于 `src/adapters/dsh/` 与 `docs/dsh/`） | 文件路径列表 |
| **回归覆盖** | 实际复跑的 V 场景（V1/V2/V3） | 勾选 |
| **契约基线变化** | `contractManifestHash` 的前后值 | 前后各 12 位 |

**基线读法**：破坏点数少 + 人时低 → 适配层隔离有效，跟随升级成本可控；
若多数破坏点无法观测（不可观测项数高），说明**契约刷新能力不足**，这是比代码问题更根本的风险
（无 CLI 的固有约束）。

---

## 4. 硬 guard 通道：v5.1.0+ 演进点（本 Feature 不实现）

清单中的 `guard-pipeline` 依赖点记录了理论上的运行时拒绝载体：
`tools/pre-execute` → 单调 guard → `tools/execute` → `tools/post-execute` → `tools/result`。

- **前置条件**：实现 SDDU 的 dsh 插件（Cordis bundle / `cordis.patch.yml` overlay）；
  其完整契约细节在 2026-08-14 快照中**未覆盖，需刷新契约后评估**。
- **触发条件**：用户明确要求硬拒绝语义，或 **v5.1.0** 通用多平台适配评估「门禁承载」的跨平台抽象时。
- **当前状态**：明确标记为 **v5.1.0+**，**本 Feature（v5.0.0）不实现**；
  当前门禁采用显式可观测的软引导（FR-004b），其边界如实声明在
  [`README.md`](./README.md) §8 与 [`dual-platform-diff.md`](./dual-platform-diff.md)。

> 升级跟进的边界：本 Feature **不做** dsh 版本自动检测、**不做**升级自动化脚本、
> **不做**端到端自动化回归（无 CLI，NFR-005 / NFR-006）。步骤 0 的「刷新契约」若仍无法联网，
> 则保持快照基准并**显式登记**。
