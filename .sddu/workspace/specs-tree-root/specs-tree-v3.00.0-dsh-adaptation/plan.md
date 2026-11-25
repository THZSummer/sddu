# 技术计划：DSH 适配

> **文档定位**: SDDU 技术方案 — 记录架构设计、方案对比和 ADR，作为 tasks 阶段的输入  
> **前置依赖**: spec.md（需求规范，FR-DSH-ADAPT-001 v1.0）+ `docs/research/deepseek-harness-competitor-analysis.md`（dsh 契约事实基线，2026-08-14 快照）  
> **创建人**: SDDU Plan Agent  
> **创建时间**: 2026-09-27  
> **版本**: v1.0  
> **更新人**: SDDU Plan Agent  
> **更新时间**: 2026-09-27  
> **更新说明**: 初始创建 — 将 spec.md 的 10 FR / 7 NFR / 9 EC 转化为 dsh 适配技术方案；产出 ADR-001~ADR-006；裁定 8 项开放问题；文件影响 21 项（17 NEW + 4 MODIFY）

## 1. 前置检查
> 启动技术规划前必须验证的前置条件

| 检查项 | 状态 |
|--------|:--:|
| spec.md 存在 | ✅ |
| 外部 API 文档缓存 | ⚠️ |
| 前置依赖已满足 | ✅ |

- **spec.md 存在 ✅**：`.sddu/specs-tree-root/specs-tree-dsh-adaptation/spec.md`（v1.0，2026-09-27）已就绪，含 10 FR / 7 NFR / 9 EC / 8 开放问题，是本次规划的权威输入。
- **外部 API 文档缓存 ⚠️（不阻断，但全程显式标注）**：`.sddu/api-docs/` 不存在。本 Feature 的「外部服务」是 dsh 平台契约（skill 提供方接口 / rank 表 / profile-bundle 装配 / 目录约定），dsh 处于 Developer preview 且**无官方 API 文档缓存**。按 spec §2 / §8 开放问题 1 与既定约束：契约刷新在 spec 阶段已**失败**，本 Feature 的 dsh 事实一律以本地快照 `docs/research/deepseek-harness-competitor-analysis.md`（**2026-08-14**）为唯一基准，并按 NFR-007 / R-001 显式登记时效风险。plan 阶段**不引入任何快照之外的新 dsh 事实**，所有依赖点标注「快照态」并集中登记（ADR-006 / `src/adapters/dsh/contract/dsh-contract-manifest.json`）。
- **前置依赖已满足 ✅**：`FR-FRAMEWORK-ARCH-001`（三域分层 + `src/adapters/` 平台适配器容器）已就绪——`src/adapters/opencode/` 为唯一实现，`src/shared/platform-adapter.ts` 类型化契约**未实现**（隔离依靠目录结构 + 单向依赖规则强制，见 framework-arch ADR-001 / ADR-006 R-API-04）。本 Feature 的适配层落位于此容器内，无需新增前置能力。

> 说明：本规划遵守 spec「既定约束」5 项——交付形态 = dsh Skill 包；接入面 = 命令入口（`/sddu` 路由与阶段命令）；端到端验证**不实施**（只交付验证方法 + V1~V5 场景）；驱动 = 自用 + 生态 + 架构 + 竞争；风险姿态 = 适配层隔离、允许跟随升级。**不做通用多平台抽象**（NG-001），**不实施端到端验证**（NG-002），**不改造 dsh 本体**（NG-003），**不改动核心状态机语义**（NG-004）。

---

## 2. 架构分析
> 分析现有架构影响和需要的新组件

### 2.1 现有架构影响

本 Feature 的架构边界被 spec 严格锁定为「在 `src/adapters/` 隔离边界内新增 dsh 适配资产」，**不改动核心域与既有 OpenCode 链路**（FR-009 / NG-001 / NG-004）。

| 现有组件 | 现状与定位 | 影响程度 | 说明 |
|---------|-----------|:--:|------|
| `src/adapters/opencode/**`（`plugin.ts` / `index.ts` / `templates/`） | 唯一平台适配实现（工具注册 + 生命周期钩子） | **无** | 零改动。dsh 侧无工具注册能力（Skill 包不携带执行能力），不复制 plugin 机制 |
| `src/state/**`（`machine.ts` / `schema-v3.0.0.ts` / `state-loader.ts`） | 核心状态机（`phase` + `status` + `phaseHistory`）与 `PhaseSkipError` / `PhaseReversalError` 硬门禁 | **无（代码零改动）** | 核心语义不变（NG-004）。dsh 侧**复用其 phase 定义与相邻性规则作为协议基准**：构建期由适配层单向 import `../../state` 校验命令映射与 phase 枚举一致（防漂移），运行期不引入任何核心代码 |
| `src/templates/agents/sddu-*.md.hbs`（11 个阶段/入口 Agent 指令） | 阶段指令的**单一来源**（ADR-002 framework-arch：方法论资产与平台注册分离） | **无（不修改，被引用）** | dsh 构建步骤把同一份指令文本渲染进 `SKILL.md`——**不复制、不改写**，保证双平台表述零漂移（NFR-002） |
| `src/templates/outputs/*.md.hbs`（阶段产物模板） | 阶段产物格式规范 | **无** | dsh 阶段 Skill 指令中引用同一批产物模板作为格式依据 |
| `src/shared/**`（`types.ts` / `errors.ts`） | 零依赖共享契约 | **无** | dsh 专项概念（rank / `.dsh/skills` / scope 链）不得进入（FR-009②） |
| `src/index.ts`（顶层薄桶导出） | 公共 API 出口 | **无** | 不新增 dsh 导出——避免 dsh 概念进入顶层 API；dsh 适配以**独立资产 + 独立构建入口**交付 |
| `install.sh` / `install.ps1`（OpenCode 安装器） | OpenCode 落点安装 | **无** | 不修改。dsh 安装走独立 `scripts/install-dsh.sh`（避免污染 OpenCode 链路，FR-009①） |
| `scripts/build-agents.cjs` | Agent 构建 | **无** | 不改；dsh 构建脚本独立读取其产物/源 |
| `scripts/package.cjs` | 分发打包（`dist/sddu/` + `dist/sddu.zip`，**只保留 `sddu` 与 `sddu.zip`**） | **低（必须修改）** | 需纳入 `dist/dsh/`（否则打包清理阶段会删除 dsh 产物）——仅新增保留项与拷贝分支，不改 OpenCode 产物路径 |
| `package.json`（scripts / files） | 构建与 npm 分发清单 | **低** | 新增 `build:dsh`；`build` 管道追加 dsh 构建步骤；`files` 纳入 dist/dsh |
| `jest.config.ts`（三项目：core / opencode / integration） | 分层测试 | **低** | `opencode` 项目已覆盖 `src/__tests__/unit/adapters/**`，dsh 适配测试自然落位；新增 `@dsh/*` 路径别名（可选） |
| `README.md` | 用户入口文档 | **低** | 增加「dsh 适配」一节，指向 `docs/dsh/*` |

### 2.2 需要的新组件

| 组件 | 类型 | 职责 | 对应需求 |
|------|------|------|---------|
| `src/adapters/dsh/` | 平台适配资产容器（第二平台样本） | 承载 dsh 专项的一切：skill 包生成模板、契约清单、构建/打包/安装脚本、文档；核心域零感知 | FR-009 / NFR-004 / G-010 |
| dsh Skill 包（生成物 `dist/dsh/skills/sddu-*/SKILL.md`） | 交付形态（既定约束） | 11 个 Skill：1 个路由/入口 Skill（`sddu`）+ 7 个阶段 Skill（discovery/spec/plan/tasks/build/review/validate）+ 3 个独立 Skill（roadmap/docs/fast）；内容 = 现有 Agent 指令文本 + dsh 门禁/状态协议片段 | FR-001 / FR-002 / FR-003 |
| 门禁协议片段（`gate-protocol`） | 注入式协议文本 | 阶段推进前置检查 + 结构化「拒绝/放行」可见输出 + 显式软引导降级声明 | FR-004 / NFR-003 |
| 状态同步与对账协议片段（`state-sync-protocol`） | 注入式协议文本 | 声明 `state.json` 为唯一权威；阶段推进后输出 `[SDDU-STATE-SYNC]` 记录进入 dsh 会话日志；给出对账规则与不一致处理 | FR-005 / NFR-003 |
| 命令入口清单（`router-command-map.json`） | 静态配置 | 命令名 → 目标阶段 Skill 的映射表；构建期与核心 `PHASE` 枚举校验一致 | FR-002③ |
| dsh 契约依赖点清单（`dsh-contract-manifest.json` + `contract.ts`） | 静态清单 + 类型化装载 | 集中列出所有 dsh 契约依赖点（skill 提供方接口 / rank 表 / profile-bundle / 目录约定 / 会话事件），含快照日期与观测校验方法 | NFR-001 / FR-007 / EC-001 |
| dsh 构建脚本（`scripts/build-dsh-skills.cjs`） | 构建工具 | 把 Agent 模板 + dsh 协议片段渲染为 `dist/dsh/`（skills + manifest + 版本锚定 + 人读契约清单） | FR-001 / FR-003 / NFR-002 |
| dsh 安装/卸载脚本（`scripts/install-dsh.sh` / `uninstall-dsh.sh`） | 分发工具 | 落位（默认 rank 100 `<projectRoot>/.dsh/skills`；`--scope user` → `<dshHome>/skills`）、残留检查、V1 自检指引 | FR-008 / EC-004 |
| dsh 适配测试（`src/__tests__/unit/adapters/dsh/skill-package.test.ts`） | 本地静态断言 | 断言**生成物**结构/命名/rank 唯一性/入口清单完整性/协议片段存在性/核心域无 dsh 概念泄漏 | FR-001①②③ / FR-002③ / FR-004② / FR-009② |
| dsh 交付文档集（`docs/dsh/*`） | 用户文档 | 安装/卸载/升级、验证方法与 V1~V5、定位说明、升级跟随清单、契约依赖清单、双平台差异清单 | FR-006 / FR-007 / FR-008 / FR-010 / NFR-001 / NFR-002 |

### 2.3 目标架构与模块划分

```mermaid
graph TB
    subgraph Core["核心域（零平台依赖，零改动）"]
        STATE["src/state/<br/>状态机 + phase 定义 + 相邻性规则"]
        TPL["src/templates/agents/*.md.hbs<br/>阶段指令（单一来源）"]
        OUT["src/templates/outputs/*.md.hbs<br/>阶段产物模板"]
        SH["src/shared/<br/>types / errors"]
    end

    subgraph Adapters["src/adapters/ ← 平台适配器容器（唯一允许平台耦合）"]
        OC["adapters/opencode/<br/>（既有，零改动）"]
        DSH["adapters/dsh/ ★新增<br/>模板片段 / 契约清单 / 构建与打包"]
    end

    subgraph Build["构建与分发"]
        BDSH["scripts/build-dsh-skills.cjs"]
        PKG["scripts/package.cjs（MODIFY）"]
        INST["scripts/install-dsh.sh / uninstall-dsh.sh"]
    end

    subgraph Artifact["生成物（gitignored）"]
        DISTS["dist/dsh/skills/sddu-*/SKILL.md"]
        MAN["dist/dsh/manifest.json（版本锚定）"]
        DOC["dist/dsh/docs/*"]
    end

    subgraph Runtime["dsh 运行时（Web UI，无 CLI）"]
        REG["ctx.skills 提供方注册表<br/>rank 100 project-dsh"]
        AGENT["模型 + 文件工具<br/>读写 .sddu/ + state.json"]
        LOG["append-only SessionEvent 日志"]
    end

    TPL -->|构建期引用，不修改| BDSH
    STATE -->|构建期校验 phase 枚举（单向）| BDSH
    DSH --> BDSH
    BDSH --> DISTS & MAN & DOC
    PKG --> ARTIFACT
    INST -->|拷贝落位| REG
    DISTS -.安装后.-> REG
    REG --> AGENT
    AGENT --> LOG
    AGENT -.读写.-> STATE

    OC -.不受影响.-> Core
    Core -.✗ 禁止 import.-> Adapters
    DSH -.v5.1.0 第二平台样本.-> XPLAT["FR-CROSSPLAT-001<br/>（下游，不在本 Feature）"]
```

**模块划分（`src/adapters/dsh/` 目录）**：

```
src/adapters/
├── opencode/                      ← 既有，零改动
│   ├── index.ts / plugin.ts / templates/
└── dsh/                           ← 新增（本 Feature 全部新增代码/资产收敛于此）
    ├── index.ts                   ← 适配层公共 API 出口（导出契约清单 + 命名/落位常量）
    ├── contract.ts                ← 契约清单类型化装载与校验；构建期单向 import ../../state 校验 phase 枚举
    ├── contract/
    │   └── dsh-contract-manifest.json   ← dsh 契约依赖点清单（快照日期 2026-08-14）
    └── templates/
        ├── skill-header.md.hbs          ← dsh SKILL.md frontmatter + 来源标识 + 命名约定
        ├── gate-protocol.md.hbs         ← 门禁协议（拒绝/放行 + 显式降级声明）
        ├── state-sync-protocol.md.hbs   ← 状态权威 + SYNC 记录 + 对账规则
        └── router-command-map.json      ← 命令入口清单（命令名 → 目标阶段）

scripts/
├── build-dsh-skills.cjs           ← 新增：渲染 dist/dsh/
├── install-dsh.sh                 ← 新增
├── uninstall-dsh.sh               ← 新增
├── package.cjs                    ← MODIFY：保留并分发 dist/dsh/
└── ...
docs/dsh/                          ← 新增交付文档集
```

**落位**：`dist/dsh/` 与 OpenCode 分发 `dist/sddu/` **同级并列**（互不包含）——`install.sh` 只消费 `dist/sddu/`，因此 dsh 资产**不会**被拷进 `.opencode/`，从结构上保证「不污染既有 OpenCode 链路」（FR-009①）。

### 2.4 数据流变更

```
【既有 OpenCode 链路（不变）】
用户 ──@sddu plan x──▶ OpenCode 插件（工具 sddu_update_state）──▶ 状态机硬校验 ──▶ state.json

【dsh 链路（新增；Skill 包不携带执行能力 → 「指令协议 + 模型文件工具」承载）】

用户（dsh Web 会话）
  │  输入：/sddu plan specs-tree-x
  ▼
┌─ sddu 路由 Skill（按 dsh skill 机制加载的指令文本）────────────────┐
│ ① 入口解析：识别 /sddu 前缀 + 阶段标识 + feature 名                 │
│      └─ 阶段标识非法 → 输出 [SDDU-ROUTE-REJECT] 明确提示，不进入任何阶段 │
│ ② 落位/发现自检提示（EC-004：目录层级 / scope 链 / skills/change 失效）│
└──────────────────────────────┬──────────────────────────────────┘
                               ▼
┌─ 门禁协议（gate-protocol 片段，注入每个阶段 Skill）───────────────┐
│ 读 .sddu/specs-tree-root/<feature>/state.json（模型文件工具）        │
│ 校验：phase 相邻性（PHASE_ORDER）+ 前置产物存在性                     │
│   ├─ 不合法 → 输出 [SDDU-GATE-DENY] {from,to,missing,依据}           │
│   │            **不写 state.json、不产出阶段产物** → 会话可见        │
│   └─ 合法   → 输出 [SDDU-GATE-ALLOW] → 进入阶段 Skill               │
│ ⚠️ 该门禁为「显式可观测软引导」（FR-004b），非运行时硬强制（见 ADR-003）│
└──────────────────────────────┬──────────────────────────────────┘
                               ▼
┌─ 阶段 Skill（sddu-<phase>）执行阶段职责 ─────────────────────────┐
│ 产出阶段产物（如 discovery.md）→ 写文件                             │
│ 若落盘失败 → 明确错误 + 回退指引 + **不推进**（EC-008）              │
└──────────────────────────────┬──────────────────────────────────┘
                               ▼
┌─ 状态同步协议（state-sync-protocol 片段）────────────────────────┐
│ state.json 为唯一权威；推进时更新 phase / phaseHistory               │
│ 输出 [SDDU-STATE-SYNC] {feature,from,to,artifact,ts} → 进入会话日志  │
└──────────────────────────────┬──────────────────────────────────┘
                               ▼
┌─ 对账（人工，无 CLI）────────────────────────────────────────────┐
│ state.json.phaseHistory  ⟷  会话日志 SYNC 记录  ⟷  产物文件存在性    │
│ 不一致 → 报告并暂停推进，禁止静默覆盖任一侧（EC-005）                 │
└──────────────────────────────────────────────────────────────────┘

【硬门禁通道（本 Feature 不实现，登记为演进点）】
dsh tools/pre-execute waterfall + 单调 guard 需 dsh 插件（bundle/profile patch）承载，
超出「Skill 包」既定交付形态与最小侵入边界（NG-003 / ADR-003）→ v5.1.0+ 评估。
```

关键变更：SDDU 的执行能力原语（`sddu_update_state` 工具、`PhaseSkipError` 运行时拒绝）在 dsh 侧**无对应载体**（快照 §3.4：skill 是「可选的指令而非会话事件」，不携带执行能力）；本方案以「**指令协议 + 模型的文件工具**」把状态推进与门禁检查降级为**模型执行、会话可见**的显式协议，并以**结构化输出块**（`[SDDU-GATE-DENY]` / `[SDDU-GATE-ALLOW]` / `[SDDU-STATE-SYNC]`）把过程变成可观测、可回放的证据（NFR-003）。

### 2.5 依赖关系图

```
构建期（本仓库 / Node）：
  adapters/dsh/templates/*  ─┐
  templates/agents/*.hbs    ─┼─▶ scripts/build-dsh-skills.cjs ─▶ dist/dsh/**
  state/index.ts（单向校验）─┘
  scripts/install-dsh.sh ─▶ 拷贝 dist/dsh/skills/* → <projectRoot>/.dsh/skills/ （rank 100）
                                       或 → <dshHome>/skills （rank 400）

运行期（dsh Web / 无 CLI）：
  dsh skill 注册表（本地文件系统 provider）─▶ 模型加载 SKILL.md 指令
  模型文件工具 ─▶ .sddu/specs-tree-root/**（产物 + state.json）
  dsh SessionEvent 日志 ─▶ 观测/对账源（只读）

依赖方向：
  adapters/dsh ──▶ templates/（引用）· state/（只读校验）· shared/   ✅ 允许（R-API-04）
  核心域 ──✗──▶ adapters/dsh                                        ❌ 禁止（FR-009②）
  本 Feature ──▶ FR-CROSSPLAT-001（下游消费本样本与契约清单，反向不依赖）  ✅
```

### 2.6 隔离边界与最小侵入规则（FR-009 / NFR-004）

| 规则 | 内容 | 校验方式 |
|------|------|---------|
| R-DSH-01 | dsh 全部资产（模板、契约清单、构建/安装脚本、文档）收敛于 `src/adapters/dsh/` + `scripts/*dsh*` + `docs/dsh/`；不在 `src/` 其他位置新增 dsh 文件 | 目录审查 + 测试断言（`src/adapters/dsh` 之外无 `dsh` 命名源文件） |
| R-DSH-02 | 核心域（`state` / `templates` / `shared` / `pipeline`）**不得 import** `adapters/dsh`；也不得出现 `dsh` / `rank` / `.dsh/skills` / `scope 链` 等专项概念 | 测试断言：对核心域文件做 `dsh|rank|\.dsh/skills` 关键字扫描（FR-009②） |
| R-DSH-03 | 单向依赖：`adapters/dsh/**` 只可经 `../../state`、`../../shared`、`../../templates` 的域级 index 引用核心（R-API-02/R-API-04）；禁止 `adapters/dsh → adapters/opencode` | import 审查 |
| R-DSH-04 | 不修改 `src/adapters/opencode/**`、`install.sh`、`install.ps1`、`src/index.ts`；`package.json` / `scripts/package.cjs` 仅做**追加式**改动 | diff 审查（无删除既有行为）+ 现有测试全绿（FR-009①） |
| R-DSH-05 | 阶段指令文本**单一来源**：dsh `SKILL.md` 的指令正文只能来自 `src/templates/agents/*.md.hbs`，禁止在 dsh 侧复制改写指令语义（仅允许追加 dsh 协议片段） | 构建脚本结构约束 + 测试断言（生成物含源模板正文） |
| R-DSH-06 | 平台差异只允许存在于 `adapters/` 与 `docs/dsh/`；核心文档（`README.md` 主体、`docs/` 非 dsh 文件）保持单平台中立表述 | 双平台差异清单（NFR-002②）核对 |

### 2.7 FR → 实现路径映射

| FR | 实现路径 | 主要落点 |
|----|---------|---------|
| FR-001 | 在 `skill-header.md.hbs` 固化命名约定（`sddu-` 前缀 + `metadata.sddu-source` 来源标识）；`router-command-map.json` 定义 11 个 Skill 清单；构建脚本生成 `dist/dsh/skills/sddu-*/SKILL.md`；`install-dsh.sh` 默认落位 rank 100 `<projectRoot>/.dsh/skills`（`--scope user` → rank 400 `<dshHome>/skills`）；三层目录 ↔ 六级 rank 落位推演成文（ADR-001） | `src/adapters/dsh/templates/*`、`scripts/build-dsh-skills.cjs`、`scripts/install-dsh.sh`、ADR-001、`docs/dsh/README.md` |
| FR-002 | 生成路由 Skill `sddu`（内容 = `sddu.md.hbs` 路由表 + dsh 入口协议）；入口协议定义 `/sddu`、`/sddu <phase> <feature>` 前缀识别与非法阶段拒绝块 `[SDDU-ROUTE-REJECT]`；入口清单成文（`router-command-map.json` → `docs/dsh/README.md` §入口清单） | `src/adapters/dsh/templates/router-command-map.json`、ADR-002、`docs/dsh/README.md` |
| FR-003 | 构建脚本把 `src/templates/agents/sddu-*.md.hbs` 正文渲染为 11 个 `SKILL.md`（≥2 个阶段 Agent 指令可被加载）；阶段 Skill 指令要求产出对应阶段产物（格式依据 `src/templates/outputs/*.md.hbs`），并定义落盘失败的可观测错误与非静默通过 | `scripts/build-dsh-skills.cjs`、`src/adapters/dsh/templates/*`、`docs/dsh/verification.md`（V3） |
| FR-004 | `gate-protocol.md.hbs` 定义可观测拒绝协议（`[SDDU-GATE-DENY]` 结构化拒绝 + 不写盘不推进）与放行协议（`[SDDU-GATE-ALLOW]`）；采用 **FR-004(b) 显式软引导**，并在每个 `SKILL.md` 与 `docs/dsh/verification.md` / `README.md` 中以固定段落如实标注「已知降级：dsh 侧无运行时硬拒绝点」；硬 guard 通道登记为演进点 | `src/adapters/dsh/templates/gate-protocol.md.hbs`、ADR-003、`docs/dsh/README.md`、`docs/dsh/verification.md`（V4） |
| FR-005 | `state-sync-protocol.md.hbs` 声明 `state.json` 为唯一权威、dsh 会话事件日志为观测/对账源；定义 `[SDDU-STATE-SYNC]` 记录格式与对账规则（三方比对），不一致 → 报告并暂停推进 | `src/adapters/dsh/templates/state-sync-protocol.md.hbs`、ADR-004、`docs/dsh/verification.md` |
| FR-006 | 交付 `docs/dsh/verification.md`：V1~V5 逐项写明步骤 / 观测方式 / 通过判据 / 配合方 + 最小人工验证清单（含时间预算上限）+ 显式声明「无 CLI → 无法自动化断言」+ 显式声明 V1~V5 为**验证方法**非端到端验收标准 | `docs/dsh/verification.md` |
| FR-007 | `dsh-contract-manifest.json` 集中登记契约依赖点；构建时写入 `dist/dsh/manifest.json` 版本锚定（SDDU 版本 + 快照日期 2026-08-14 + 清单哈希）；`docs/dsh/upgrade-following.md` 给出升级跟随步骤清单 + 破坏点记录模板 + 成本基线口径 | `src/adapters/dsh/contract/*`、ADR-006、`docs/dsh/upgrade-following.md` |
| FR-008 | `install-dsh.sh`（项目级/用户级两种 scope + 落位自检输出）+ `uninstall-dsh.sh`（按 `sddu-*` 前缀清理 + 残留校验）+ `docs/dsh/README.md`（安装/卸载/升级三路径，面向无 SDDU 背景的 dsh 用户） | `scripts/install-dsh.sh`、`scripts/uninstall-dsh.sh`、`docs/dsh/README.md` |
| FR-009 | 6 条隔离规则（R-DSH-01~06）落为目录结构 + 构建脚本约束 + 测试断言；核心域零改动、OpenCode 链路零改动（现有测试保持通过） | `src/__tests__/unit/adapters/dsh/skill-package.test.ts`、§2.6、ADR-005 |
| FR-010 | `docs/dsh/positioning.md`：SDDU 阶段方法论 ↔ dsh 原生 plan mode / todo / workflow / goal / compaction 的分工与共存方式 + ≥3 个判定示例（走 SDDU / 走原生 / 共存） | `docs/dsh/positioning.md` |

### 2.8 架构结论（是否拆分）

spec §3.2 NG-008 与 discovery §6.2 已判定**不拆分**。plan 阶段复核：交付物全部收敛于「一个适配层的资产 + 构建/安装脚本 + 文档集」，彼此强耦合于同一形态约束（Skill 包）与同一契约基线（2026-08-14 快照），无独立交付价值的子模块；核心难点（承载机制）是**单一决策**而非可并行分裂的多个子系统。**维持单一 Feature 模式**。

---

## 3. 方案对比
> 2-3 个可行方案的对比分析

核心难点是 spec 开放问题 4 / Q-002「**形态承载缺口：Skill 包不携带执行能力**」——即「状态推进 + 阶段门禁」如何在 dsh 侧承载。这是本 Feature 的最大不确定性，决定 FR-003 / FR-004 / FR-005 的落地形态，故以其为方案对比主轴（落位与命名的备选见 ADR-001）。

| 维度 | 方案 A：纯 Skill 包 + 模型文件工具 | 方案 B：Skill 包 + 自研 dsh 插件（硬门禁） | 方案 C：分层承载（Skill 包 + 可观测门禁协议 + 预留硬通道）★ |
|------|:--|:--|:--|
| **描述** | 只交付 Skill 包：指令文本指导模型用 dsh 文件工具读写 `.sddu/` 与 `state.json`；门禁完全靠指令纪律，无任何结构化可见约定 | 除 Skill 包外，额外开发 SDDU 的 dsh 插件（Cordis bundle / profile patch），注册工具走 `tools/pre-execute` waterfall + 单调 guard，实现运行时硬拒绝 | Skill 包为主交付（既定形态）；门禁与状态以**注入式协议片段**承载：结构化拒绝/放行/同步输出块（会话可见）+ 显式降级声明；把硬 guard 通道定位为**版本锚定的演进点**（本 Feature 不实现） |
| **优点** | 最小侵入、零 dsh 代码、交付最快；完全符合既定形态 | 唯一能保留「不跳步」硬强制语义的路径；可复用 dsh 单调 guard 安全模型 | ① 符合既定形态与最小侵入（NG-001/NG-003）；② 门禁**不静默**——非法跃迁有结构化、可回放的可见结果（满足 FR-004「禁止静默丢失」）；③ 门禁行为可被 V4 观测判定；④ 不把 dsh 专项细节写入核心；⑤ 保留向 (a) 硬拒绝演进的清晰接口 |
| **缺点** | 门禁退化为「提示词里写了」且**无任何结构化痕迹**→ 直接违反 FR-004 的「不得静默丢失」；EC-003/EC-005 无从落地 | 超出既定交付形态（Skill 包）与 scope 收敛（NG-001 不做通用抽象，但此处是**提前引入平台插件工程**）；需了解 Cordis bundle/overlay 契约（快照未覆盖细节 → 事实风险陡增）；跟随 dsh 破坏性升级的维护面从「改文本」变成「改插件代码」；与 v5.1.0 抽象时机冲突（R-003） | 门禁仍是**模型执行**的软引导，不具运行时强制力——必须靠文档如实声明 + 用户观测兜底（已由 FR-004b 显式允许）；对模型遵从性有依赖（EC-003 的常态化风险） |
| **风险** | 高：FR-004 验收 ③ 直接不满足；方法论可信度退化（R-002 兑现） | 高：依赖快照未覆盖的插件契约（R-001 放大）；工期与维护成本不可控；可能触发形态重定（回炉 spec） | 中：软引导边界需如实声明；若用户要求真硬强制，需回到方案 B（届时按 EC-003 走降级/升级判断） |
| **工作量** | S（约 1 波次：模板 + 安装脚本 + 文档） | XL（插件工程 + 契约 spike + 跟随升级机制） | M（构建脚本 + 3 个协议片段 + 契约清单 + 6 份文档 + 安装/卸载脚本 + 静态测试） |

> **落位备选（不改变主轴结论，详见 ADR-001）**：主落位取 rank **100** `project-dsh`（`<projectRoot>/.dsh/skills`，目录约定即生效、无需改 dsh 配置，且「最近层优先」天然压过生态同名 skill）优于 rank 300 `customSkillDirs`（需改 dsh 配置，侵入更高）；用户级场景取 rank **400** `<dshHome>/skills`。不选 `bundled`(600)——那是 dsh 发行版内嵌位，需改动/重打包宿主，违反 NG-003。

---

## 4. 推荐方案
> 推荐方案及选择理由

**推荐**: **方案 C — 分层承载（Skill 包 + 可观测门禁协议 + 预留硬通道）**

**理由**:

1. **唯一同时满足既定形态与 FR-004 的方案**：方案 C 保持「dsh Skill 包」交付形态（既定约束）与最小侵入（NG-001/NG-003），同时通过**结构化、可观测、可回放**的拒绝/放行/同步输出块，满足 FR-004「禁止静默丢失门禁语义」与 NFR-003「门禁行为留下可观测证据」——这是方案 A 做不到的（A 无任何结构化痕迹，直接违反验收 ③）。
2. **如实降级而非虚假承诺**：spec EC-003 已明确「平台能力所限时降级为 FR-004(b) 的显式软引导，并如实声明为已知降级，禁止声称硬强制」。方案 C 把这条纪律**编码进交付物**（每个 `SKILL.md` 固定段落 + 文档如实标注），使降级本身可被 V4 观测。
3. **不赌未知契约**：方案 B 依赖快照未覆盖的 Cordis bundle / overlay 细节，在「契约刷新失败 + Developer preview」背景下，等于把本 Feature 押在最大不确定性上（R-001 放大），且把跟随升级面从「改文本」升级为「改插件代码」。方案 C 用**版本锚定的演进点**保留未来升级到 (a) 硬拒绝的接口，符合「风险姿态 = 适配层隔离，允许跟随升级」。
4. **为 v5.1.0 提供干净的第二平台样本**：方案 C 的适配层是「资产 + 契约清单 + 构建/安装」形态，未提前抽象通用接口（NG-001），却完整暴露「第二平台与 OpenCode 的差异点」（指令单一来源 vs 平台注册、文件工具 vs 插件工具、软引导 vs 硬强制、rank vs 目录层级），正是 FR-CROSSPLAT-001 收敛通用接口所需的输入（G-010）。

### 4.1 关键技术决策与开放问题裁定

| 开放问题 | 裁定 | 依据 / 落点 |
|---------|------|-----------|
| 1. dsh 契约时效（R-001） | **维持 2026-08-14 快照为唯一基准**；plan 不引入快照外事实；全部依赖点集中登记并标注快照日期；「刷新契约」列为升级跟随清单第 0 步与 V5 首个动作 | NFR-007 / ADR-006 / `dsh-contract-manifest.json` |
| 2. 状态权威来源（Q-012） | **`state.json` 为唯一权威状态源**，dsh append-only 会话事件日志（`SessionEvent`）为**观测与对账源**；核心状态机语义不变（NG-004）；对账按 FR-005 三方比对规则 | ADR-004 / `state-sync-protocol.md.hbs` |
| 3. `apps/cli` 与「无 CLI」张力（A-003） | **按用户权威口径「dsh 只支持 Web、无 CLI」规划**；本方案不依赖任何 CLI（安装/卸载为仓库侧脚本，非 dsh 侧命令）；张力保留为开放问题，不擅改 spec，仅在 `docs/dsh/verification.md` 如实记录「若后续核实存在 CLI，可把 V1~V5 部分转为脚本断言」 | spec §2 口径声明 / NFR-006 |
| 4. 形态承载可行性（A-002/R-002） | **Skill 包可承载「指令 + 模型文件工具落盘（产物/状态）」，不能承载运行时硬门禁**；故 FR-004 取 (b) + 可观测拒绝协议；不实现 dsh 插件 | ADR-003 / FR-004 |
| 5. 生态需求规模（A-004/R-007） | **不阻塞**（NG-007）；交付后结合反馈评估，不写入本 Feature 范围 | spec NG-007 |
| 6. 门禁最终 (a)/(b) | **(b) 显式、可观测、对用户可见的软引导**；同时保留 (a) 硬拒绝的演进路径（需 dsh 插件走 guard 流水线，登记为 v5.1.0+ 评估项） | ADR-003 / EC-003 |
| 7. SDDU Skill 包落位（A-005） | **主落位 rank 100 `project-dsh`（`<projectRoot>/.dsh/skills`）**；用户级可选 rank 400 `<dshHome>/skills`；命名 `sddu-*` + 来源标识；三层目录 ↔ 六级 rank 推演表成文 | ADR-001 |
| 8. `adapters/` 对非代码形态的容纳度（A-006） | **可容纳**：dsh 适配以「模板片段 + 契约清单 + 构建/打包脚本 + 文档」形态落于 `src/adapters/dsh/`，沿用既有目录隔离与单向依赖规则（R-API-04），**无需修改核心、无需实现通用接口**（NG-001） | ADR-005 / §2.6 |

### 4.2 其余技术选型要点

- **dsh skill 提供方**：只用**本地文件系统 provider**（快照 §3.4 的 `skill-filesystem`）；不使用内嵌 provider（需 dsh 发行侧动作）与远程 provider（引入网络依赖与额外契约面）。
- **渲染方式**：构建期「拼接」而非「改写」——`skill-header` + 源 Agent 指令正文（占位符原样保留，由模型运行期填充）+ `gate-protocol` + `state-sync-protocol`（仅阶段 Skill 注入后两者，入口/独立 Skill 按需）。
- **可观测输出块协议**（本方案新增的约定，用于把软引导变成证据）：`[SDDU-GATE-DENY]` / `[SDDU-GATE-ALLOW]` / `[SDDU-ROUTE-REJECT]` / `[SDDU-STATE-SYNC]`，字段固定、单行 JSON 尾随，便于人工在 Web UI 与会话日志中检索。
- **不做**（NG-002）：不实现 dsh 侧自动化验证、不做端到端验收脚本；本地 `jest` 测试只断言**生成物静态结构**，不冒充 dsh 运行时验证。

---

## 5. 文件影响分析
> 所有需要创建/修改/删除的文件

| 操作 | 文件路径 | 说明 |
|:--:|------|------|
| NEW | `src/adapters/dsh/index.ts` | dsh 适配层公共 API 出口（导出契约清单、命名/落位常量、构建辅助） |
| NEW | `src/adapters/dsh/contract.ts` | 契约清单类型化装载与校验；构建期单向 import `../../state` 校验命令映射的 phase 枚举一致性 |
| NEW | `src/adapters/dsh/contract/dsh-contract-manifest.json` | dsh 契约依赖点清单（provider 接口 / rank 表 / profile-bundle / 目录约定 / 会话事件；快照日期 2026-08-14 + 观测校验方法） |
| NEW | `src/adapters/dsh/templates/skill-header.md.hbs` | dsh `SKILL.md` frontmatter（name/description）+ SDDU 来源标识 + 命名约定 |
| NEW | `src/adapters/dsh/templates/gate-protocol.md.hbs` | 门禁协议片段：前置检查、`[SDDU-GATE-DENY/ALLOW]` 结构化输出、显式软引导降级声明 |
| NEW | `src/adapters/dsh/templates/state-sync-protocol.md.hbs` | 状态权威声明、`[SDDU-STATE-SYNC]` 记录格式、三方对账规则、不一致处理 |
| NEW | `src/adapters/dsh/templates/router-command-map.json` | 命令入口清单（`/sddu` 与各阶段命令 → 目标 Skill）+ 非法阶段拒绝语义（FR-002③） |
| NEW | `scripts/build-dsh-skills.cjs` | 渲染 `dist/dsh/`：11 个 Skill、`manifest.json`（版本锚定）、人读契约清单与文档拷贝 |
| NEW | `scripts/install-dsh.sh` | 安装：项目级 rank 100 `<projectRoot>/.dsh/skills` / 用户级 rank 400 `<dshHome>/skills`；输出落位自检与 V1 指引 |
| NEW | `scripts/uninstall-dsh.sh` | 卸载：按 `sddu-*` 前缀清理 + 残留校验（FR-008②） |
| NEW | `src/__tests__/unit/adapters/dsh/skill-package.test.ts` | 生成物静态断言（结构/命名/rank 唯一性/入口清单完整性/协议片段存在性/核心域无 dsh 概念泄漏/现有 OpenCode 产物不受影响） |
| NEW | `docs/dsh/README.md` | 交付物总览 + 安装/卸载/升级路径 + 落位推演 + 入口清单（FR-001③/FR-002③/FR-008） |
| NEW | `docs/dsh/verification.md` | 如何验证 + V1~V5 场景（步骤/观测/判据/配合方）+ 最小人工验证清单 + 自动化缺口声明（FR-006） |
| NEW | `docs/dsh/positioning.md` | 与 dsh 原生 plan/todo/workflow 的分工定位 + ≥3 判定示例（FR-010） |
| NEW | `docs/dsh/upgrade-following.md` | 升级跟随步骤清单 + 破坏点记录模板 + 成本基线口径（FR-007） |
| NEW | `docs/dsh/contract-dependencies.md` | dsh 契约依赖点清单（人读版，由 `build-dsh-skills.cjs` 从 manifest 生成，单一来源）（NFR-001①） |
| NEW | `docs/dsh/dual-platform-diff.md` | 双平台差异清单（OpenCode vs dsh：入口/承载/门禁/状态/落位）随版本核对（NFR-002②） |
| MODIFY | `package.json` | 新增 `build:dsh`；`build` 管道追加 dsh 构建；`files` 纳入 `dist/dsh/**` |
| MODIFY | `scripts/package.cjs` | 打包保留与分发 `dist/dsh/`（追加式改动，`itemsToKeep` 增加 `dsh`，不影响 `dist/sddu/` 产物） |
| MODIFY | `jest.config.ts` | 新增 `^@dsh/(.*)$` 路径别名映射（与 `@opencode` 对称；`opencode` 项目已覆盖 `src/__tests__/unit/adapters/**`） |
| MODIFY | `README.md` | 增加「dsh 适配」一节，指向 `docs/dsh/*`（不改变既有 OpenCode 说明主体） |
| DELETE | — | 无 |

> 构建产物（`.gitignore` 已忽略 `dist/`）：`dist/dsh/skills/sddu-*/SKILL.md`、`dist/dsh/manifest.json`、`dist/dsh/docs/*`——不作为源码变更计入。

**文件变更计数**：NEW 17 项 + MODIFY 4 项 + DELETE 0 项 = **21 项**。

---

## 6. 风险评估
> 识别技术、依赖和时间风险及缓解措施

| 风险 | 概率 | 影响 | 缓解措施 |
|------|:--:|:--:|----------|
| **R-001 dsh 契约时效**：全部 dsh 事实来自 2026-08-14 快照，契约刷新失败；skill provider / rank / profile 装配可能已变 | 高 | 高 | ① 全部依赖点集中登记于 `dsh-contract-manifest.json` 并标注快照日期（NFR-001/007）；② 适配层隔离 → 变更修复面仅落在 `adapters/dsh` + 文档；③ 升级跟随清单把「刷新契约」列为第 0 步；④ plan 不引入快照外事实，文档禁止把快照当现状（如实标注「快照态」） |
| **R-002 形态承载不足**：Skill 包不携带执行能力，门禁可能退化 | 高 | 高 | ① 采用 FR-004(b) 显式软引导 + 结构化可观测拒绝协议（不静默丢失）；② 每个 `SKILL.md` 与文档固定段落如实声明「已知降级」，禁止声称硬强制（EC-003）；③ 硬 guard 通道登记为版本锚定演进点；④ V4 场景专门观测门禁行为并回填结论 |
| **R-003 抽象过早**：在单一平台样本上迁移 `adapters/` 可能返工 | 中 | 中 | ① 不做通用抽象（NG-001），不定义 `PlatformAdapter` 实现、不改核心接口；② dsh 资产全部落 `adapters/dsh`；③ 只沉淀「第二平台样本 + 契约依赖清单」供 v5.1.0 收敛（G-010） |
| **R-004 验证能力缺口**：无 CLI → 无法自动化断言，回归依赖人工 | 中 | 高 | ① 交付最小人工验证清单（含时间预算上限，NFR-005）；② 本地 jest 仅静态断言**生成物**（可回归、不冒充实机验证）；③ 显式声明自动化缺口，不将「未观测」等同于「通过」（EC-006）；④ 结构化输出块让会话日志天然成为可检索证据（NFR-003） |
| **R-005 双轨/采纳**：用户混用 dsh 原生 plan mode 与 SDDU 阶段流程 | 中 | 中 | ① `docs/dsh/positioning.md` 给出分工与 ≥3 判定示例（FR-010）；② 路由 Skill 指令内嵌「何时走 SDDU / 何时用原生」的即时提示（EC-009）；③ 检测到同一会话混用时输出提示与建议 |
| **R-006 双平台维护漂移**：两条链路的模板/文档/Skill 编排出现两套表述 | 中 | 中 | ① 阶段指令**单一来源**（`src/templates/agents/*.md.hbs` → 生成 dsh `SKILL.md`，R-DSH-05），不复制改写；② 产出并随版本核对「双平台差异清单」（NFR-002②）；③ 测试断言生成物含源模板正文，防手工漂移 |
| **R-007 生态规模未验证**：可能仅服务维护者自用 | 中 | 低 | 不阻塞（NG-007）；交付后结合反馈评估，不写入本 Feature 范围 |
| **R-008 rank 遮蔽 / 未被发现**：与 dsh 宿主或第三方同名/近义 skill 冲突；落位错误或发现缓存未失效 | 中 | 中 | ① 命名约定 `sddu-*` + `metadata.sddu-source` 来源标识（EC-007）；② 主落位 rank 100（最近层优先）降低被遮蔽概率；③ 安装脚本输出落位自检清单与 `skills/change` 失效提示（EC-004）；④ 冲突时按 rank/最近层裁决并在 `docs/dsh/README.md` 要求显式提示，不得静默（EC-002） |
| **R-009 命令入口识别**：dsh 快照未证明存在可由 Skill 注册的命令 seam；`/sddu` 可能不被平台识别为命令 | 中 | 高 | ① 采用「文本前缀识别」承载（路由 Skill 指令显式声明识别规则），不依赖平台命令注册（ADR-002）；② 入口清单成文（FR-002③）；③ 把「平台级命令注册需 dsh 插件」作为**明确缺口**登记于文档与契约清单，避免误期待 |
| **R-010 构建改动的连带影响**：修改 `package.cjs` / `package.json` 可能波及既有 OpenCode 分发 | 低 | 高 | ① `dist/dsh/` 与 `dist/sddu/` 同级并列、互不引用；② 仅追加保留项与分支，不改既有路径/行为；③ 门禁：`npm run build` + `test:core` + `test:opencode` 全绿方可推进（现有测试保持通过，FR-009①）；④ 不修改 `install.sh` |

---

## 7. 生成的 ADR
> 本次规划产出的架构决策记录

| ADR | 标题 | 状态 |
|-----|------|:--:|
| ADR-001 | dsh Skill 包的落位与装配（rank 100 主落位 + 本地 provider + 三层目录映射） | PROPOSED |
| ADR-002 | 命令入口以「路由 Skill + 文本前缀识别」承载 | PROPOSED |
| ADR-003 | 阶段门禁采用显式可观测软引导，硬 guard 通道记为演进点 | PROPOSED |
| ADR-004 | `state.json` 为唯一权威，dsh 会话事件日志为观测与对账源 | PROPOSED |
| ADR-005 | 适配层隔离边界与指令文本单一来源（`adapters/dsh` 资产形态） | PROPOSED |
| ADR-006 | 升级跟随机制：契约清单 + 版本锚定 + 人工回归清单 | PROPOSED |

> ADR 文件与本 plan.md 同级（`.sddu/specs-tree-root/specs-tree-dsh-adaptation/ADR-001~006-*.md`）。编号空间为本 Feature 目录内（沿用仓库既有 per-Feature ADR 编号约定：每个 Feature 目录从 ADR-001 起独立编号），不与其他 Feature / `architecture/adr` 的编号构成冲突。

---

## 8. 修订记录
> 记录本文档的版本变更历史

| 版本 | 变更说明 | 日期 | 修订人 |
|------|---------|------|--------|
| v1.0 | 初始创建 — 基于 spec.md v1.0（10 FR / 7 NFR / 9 EC / 8 开放问题）产出 dsh 适配技术方案；核心决策：方案 C 分层承载（Skill 包 + 可观测门禁协议 + 预留硬通道）；裁定 8 项开放问题（state.json 权威 / FR-004 取 b / 落位 rank 100 / adapters 可容纳非代码形态）；产出 ADR-001~006；文件影响 21 项（17 NEW + 4 MODIFY + 0 DELETE）；10 项风险含缓解措施 | 2026-09-27 | SDDU Plan Agent |
