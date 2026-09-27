# SDDU × dsh 适配（Skill 包）

> **文档定位**: SDDU 在 dsh 平台上的交付说明 —— 交付物、安装 / 卸载 / 升级、落位推演与命令入口
> **目标读者**: 没有 SDDU 背景的 dsh 用户（只需会看 dsh Web UI 与文件目录）
> **权威来源**: `src/adapters/dsh/templates/router-command-map.json`（入口 / Skill 清单）、
> `src/adapters/dsh/contract/dsh-contract-manifest.json`（契约依赖点）
> **创建人**: SDDU Build Agent
> **版本**: v1.0

---

## 0. ⚠️ 时效声明（请先读这一段）

- 本文档中的**全部 dsh 事实**（skill 提供方 rank 表、目录约定、`SessionEvent` 日志、
  guard 流水线、profile 装配）都来自 **2026-08-14 单一调研快照**，**不是当前事实**。
- dsh 处于 Developer preview，带兼容性破坏警告且快速迭代。在按
  [`upgrade-following.md`](./upgrade-following.md) 的**步骤 0 刷新契约**之前，
  本包与本文档**不得被当作当前 dsh 事实**。
- **未刷新即不可信**：跳过刷新会让 `snapshotDate` 失真，清单反而产生**虚假确定性**。
- 时效可在两处一眼看到：`dist/dsh/manifest.json` 的 `dshContractSnapshot` 字段，
  以及每个 Skill 的 frontmatter `metadata.sddu-contract-snapshot: 2026-08-14`。

---

## 1. 交付物总览

| 交付物 | 位置 | 说明 |
|--------|------|------|
| Skill 包 | `dist/dsh/skills/` | **11 个** Skill 目录：`sddu`（路由）+ 7 个阶段 + 3 个独立 |
| 版本锚定 | `dist/dsh/manifest.json` | `sdduVersion` / `dshContractSnapshot` / `contractManifestHash` / `generatedAt` / `skills[]` |
| 契约依赖点（人读版） | `docs/dsh/contract-dependencies.md` | 由 `build-dsh-skills.cjs` 从清单渲染，**禁止手工编辑** |
| 分发文档 | `dist/dsh/docs/` | 本目录 `docs/dsh/*.md` 的拷贝 |
| 安装脚本 | `scripts/install/dsh/install.sh` / `scripts/install/dsh/install.ps1` | 仓库侧脚本，做纯文件操作 |

11 个 Skill：

```text
dist/dsh/skills/
├── sddu/             ← 路由 / 入口 Skill（命令入口路由表 + 拒绝格式 + 降级用法）
├── sddu-discovery/   ← 阶段 1/7（discovery.md）
├── sddu-spec/        ← 阶段 2/7（spec.md）
├── sddu-plan/        ← 阶段 3/7（plan.md + ADR）
├── sddu-tasks/       ← 阶段 4/7（tasks.md）
├── sddu-build/       ← 阶段 5/7（代码/产物 + build.md）
├── sddu-review/      ← 阶段 6/7（review.md）
├── sddu-validate/    ← 阶段 7/7（validate.md）
├── sddu-roadmap/     ← 独立（ROADMAP.md）
├── sddu-docs/        ← 独立（项目全景）
└── sddu-fast/        ← 独立（快速模式，零产物）
```

> 每个 `SKILL.md` = dsh 包装层（frontmatter + 来源标识）+ **源指令正文（单一来源）**
> + 协议片段（gate / state-sync）+ 协议声明段。指令正文来自 `src/templates/agents/sddu-*.md.hbs`，
> 与 OpenCode 侧**同源**，构建脚本只做拼接、不改写语义。

先构建（生成 `dist/dsh/`）：

```bash
npm run build          # build:agents → build:ts → build:dsh（postbuild 钩子）
# 或只重建 dsh 侧产物：
npm run build:dsh
```

---

## 2. 安装

### 2.0 一键安装（bootstrap，推荐）

与 OpenCode 共用同一 bootstrap 入口，`--platform dsh` 区分适配目标，curl 一行装完（clone → 自动构建 → 安装 → 启动引导）：

```bash
# Linux/macOS（直连 GitHub）
curl -fsSL https://raw.githubusercontent.com/THZSummer/sddu/main/bootstrap.sh | bash -s -- ./my-project --platform dsh

# 镜像（国内用户）
curl -fsSL https://gh-proxy.org/https://raw.githubusercontent.com/THZSummer/sddu/main/bootstrap.sh | bash -s -- ./my-project --platform dsh --proxy https://gh-proxy.org/
```

Windows（PowerShell）：

```powershell
# 直连 GitHub
powershell -ExecutionPolicy Bypass -Command "iex (iwr -UseBasicParsing https://raw.githubusercontent.com/THZSummer/sddu/main/bootstrap.ps1).Content; Install-Sddu -TargetDir ./my-project -Platform dsh"

# 镜像（国内用户）
powershell -ExecutionPolicy Bypass -Command "iex (iwr -UseBasicParsing https://gh-proxy.org/https://raw.githubusercontent.com/THZSummer/sddu/main/bootstrap.ps1).Content; Install-Sddu -TargetDir ./my-project -Platform dsh -ProxyUrl https://gh-proxy.org/"
```

### 2.1 推荐：项目级 **rank 100**（`<projectRoot>/.dsh/skills`）

```bash
scripts/install/dsh/install.sh                      # 默认项目级，根目录 = 当前工作目录
scripts/install/dsh/install.sh --project-root /path/to/project
scripts/install/dsh/install.sh --source dist/dsh/skills --yes
scripts/install/dsh/install.sh --build              # 强制重建 dist/dsh（来源缺失时自动构建）
scripts/install/dsh/install.sh --upgrade            # 升级模式（= --build + 幂等覆盖 + 破坏点记录提示）
```

Windows（PowerShell）：

```powershell
scripts/install/dsh/install.ps1 -ProjectRoot ./my-project
scripts/install/dsh/install.ps1 -ProjectRoot ./my-project -Build
scripts/install/dsh/install.ps1 -ProjectRoot ./my-project -Upgrade
```

> 自动构建（FR-003）：当 `dist/dsh/skills` 缺失时，脚本自动执行 `npm run build:dsh`；
> `--build` 显式强制重建，`--upgrade` 固定带 `--build`（取最新产物）。

**为什么推荐项目级**：落位 = 纯目录约定，**无需修改任何 dsh 配置**即可生效；
且「最近层优先」在项目作用域内天然压过生态中的同名 skill，遮蔽行为可预期。

### 2.2 可选：用户级 **rank 400**（`<dshHome>/skills`）

```bash
scripts/install/dsh/install.sh --scope user
scripts/install/dsh/install.sh --scope user --dsh-home /path/to/dshHome
```

用户级落位便于**跨项目复用**，代价是可能被项目级 skill 遮蔽（这符合「最近层优先」的预期，
不是缺陷）。若你同时装了两级，**项目级生效**。

### 2.3 安装后自检（V1 场景）

安装脚本会打印**落位自检清单**：目标绝对路径、命中 rank、本次落位条目数、检测到的同名/近义条目。
随后请在 dsh Web UI 的 skill 列表中确认 11 个 SDDU 条目可见、来源标识形如
`adapters/dsh@<版本>#2026-08-14`。完整步骤见 [`verification.md`](./verification.md) 的 **V1**。

---

## 3. 升级 / 跟随升级

dsh 处于快速迭代期，升级跟随不是「重新安装」一件事，而是一份**可复现的核对清单**：

| 步骤 | 动作 |
|:--:|------|
| 0 | **刷新 dsh 契约**（skill 提供方接口 / rank 表 / 目录约定 / profile 装配 / 命令注册）；刷新失败则**如实记录** |
| 1 | 记录 dsh 版本 + `dist/dsh/manifest.json` 的快照日期 |
| 2 | 逐条走 `docs/dsh/contract-dependencies.md` 的 `observableCheck`，标注 未变 / 已变 / 无法观测 |
| 3 | 重复 **V1 → V2 → V3** 场景 |
| 4 | 对已变项：定位破坏点 → 填 `破坏点记录模板` → 修复（只改 `src/adapters/dsh/` 资产/脚本）→ 复跑 V1~V3 |
| 5 | 更新契约清单：改 `fact`/`assumption`，**bump `snapshotDate`** 为本次刷新日期 |
| 6 | 形成**成本基线**（人时 + 破坏点数） |

完整清单、可直接复制的**破坏点记录模板**与成本基线口径见
[`upgrade-following.md`](./upgrade-following.md)。

---

## 4. 三层目录 ↔ 六级 rank 落位推演

dsh 的 skill 发现是「提供方注册表 + rank 优先级」：跨层**最近层优先**，同层内按 rank 裁决。
SDDU 自身的 skill 体系按目录层级仲裁（三层，**不携带 rank 概念**）。两者的映射如下：

| SDDU 三层 | 语义 | dsh 落位 | rank | 说明 |
|-----------|------|---------|:--:|------|
| 框架级 `.opencode/plugins/sddu/skills/`（随包分发） | 框架自带 Skill | `<projectRoot>/.dsh/skills`（项目级安装） | **100** | **主落位**：目录约定即生效、无需改 dsh 配置；项目作用域内天然压过生态同名 skill |
| 框架级（全局安装场景） | 同一批 Skill 的用户级副本 | `<dshHome>/skills` | **400** | 用户级安装选项（`--scope user`）；跨项目复用，代价是可能被项目级遮蔽 |
| 用户级 `.sddu/skills/`（维护者自建） | 用户自定义 Skill | `Config.customSkillDirs` / `<agentsHome>/skills` | 300 / 500 | **不被 SDDU 安装脚本接管**：属 dsh 用户的自主配置面，文档给映射指引而非自动写入 |
| 运行时 `.opencode/skills/`（sync 目标） | 三元自举闭环的同步目标 | 即 rank 100 目录（同步 = 拷贝到 `.dsh/skills/`） | 100 | `sddu-skill-sync` 的 `--dest` 在 dsh 场景指向 `.dsh/skills`；本 Feature **不修改 sync 脚本默认值**，以文档约定承载 |

**六级 rank 的取舍说明**：

| rank | Source | Root | SDDU 是否使用 | 理由 |
|:--:|--------|------|:--:|------|
| 100 | `project-dsh` | `<projectRoot>/.dsh/skills` | ✅ **主落位** | 纯目录约定、最小侵入、遮蔽可预期 |
| 200 | `project-agents` | `<projectRoot>/.agents/skills` | ❌ 否决 | 中性目录（面向全 agent 生态），「SDDU 来源」辨识度下降，且与项目 `.dsh` 语义分离 |
| 300 | `custom` | `Config.customSkillDirs` | ❌ 否决为主落位 | 需要用户/安装过程**修改 dsh 配置**，侵入高于纯目录约定 |
| 400 | `user-dsh` | `<dshHome>/skills` | ✅ 可选 | 用户级安装，便于跨项目复用 |
| 500 | `user-agents` | `<agentsHome>/skills` | ❌ 否决 | 同 rank 200 的辨识度问题 |
| 600 | `bundled` | `Config.bundledSkillDir` | ❌ 否决 | 需改动/重打包 dsh 发行版，违反「不改造 dsh 本体」 |

---

## 5. 入口清单

> 唯一来源：`src/adapters/dsh/templates/router-command-map.json`。下表为派生表述，改动必须同步该文件。

| 入口 | 目标 Skill | 前置 | 产出 |
|------|-----------|------|------|
| `/sddu` | `sddu`（仪表盘 / 推荐） | `.sddu/specs-tree-root/` 存在 | 状态视图 + 推荐下一步 |
| `/sddu discovery <feature>` | `sddu-discovery` | 无（工作流起点） | `discovery.md` |
| `/sddu spec <feature>` | `sddu-spec` | `discovery.md` | `spec.md` |
| `/sddu plan <feature>` | `sddu-plan` | `spec.md` | `plan.md`（+ ADR-*.md） |
| `/sddu tasks <feature>` | `sddu-tasks` | `plan.md` | `tasks.md`（+ tasks.json） |
| `/sddu build <feature>` | `sddu-build` | `tasks.md` | 代码 / 产物 + `build.md` |
| `/sddu review <feature>` | `sddu-review` | `build.md` | `review.md` |
| `/sddu validate <feature>` | `sddu-validate` | `build.md` | `validate.md` |
| `/sddu roadmap` | `sddu-roadmap` | 无 | `ROADMAP.md` |
| `/sddu docs <feature>` | `sddu-docs` | Feature 产物存在 | `docs-*.md` |
| `/sddu fast <task>` | `sddu-fast` | 无 | 直接解决（零产物） |

阶段标识支持别名（与 OpenCode 侧保持一致的输入宽容度）：
`discovery|discovered`、`spec`、`plan|planning`、`tasks`、`build|building|implementing`、
`review`、`validate|completed`。

### 非法输入的拒绝格式

```text
[SDDU-ROUTE-REJECT] {"input":"<原样输入>","valid":["discovery","spec","plan","tasks","build","review","validate"],"hint":"<建议>"}
```

拒绝语义：**不进入任何阶段、不写任何文件**，只输出拒绝块并给出建议。

---

## 6. 命令入口的已知缺口与降级用法

> **已知缺口**：在「Skill 包」交付形态内，dsh 侧**没有**可由 Skill 注册**平台级命令**的可靠载体
> （2026-08-14 快照未记录该 seam；快照中的斜杠交互来自方法论插件，即**命令由插件提供**）。
> 因此本适配的入口实质是「**指令约定的入口**」，而**不是**平台级命令注册 ——
> 本 Feature **不承诺** `/sddu` 的平台级命令体验。

当 `/sddu ...` 未被平台作为消息送达（例如平台自身命令解析器先行拦截）时，使用降级路径：

1. `sddu <phase> <feature>` —— **文本前缀**（无斜杠），与 `/sddu <phase> <feature>` 语义等价；
2. **段落式自然语言**（如「把 specs-tree-x 推进到 plan 阶段」）—— 由路由 Skill 按路由表解析；
3. 若两者都不可用，按 [`verification.md`](./verification.md) 的 **V2** 场景记录该平台行为，
   作为能力落差的观测证据。

如果确实需要平台级命令体验，需要实现 dsh 插件（Cordis bundle / `cordis.patch.yml` overlay），
属 **v5.1.0+ 演进点**，不在本 Feature 范围内。

---

## 7. ⚠️ 已知降级：阶段门禁（FR-004b）

> ⚠️ 已知降级：dsh 侧无可执行的运行时拒绝点，本门禁为模型执行的显式软引导（**FR-004b**），
> **非硬强制**；非法跃迁会输出 `[SDDU-GATE-DENY]` 且不推进，但其约束力来自模型对指令的遵从。

具体含义：

- OpenCode 侧由核心状态机在代码层**拒绝**非法跃迁（抛错），dsh 侧**没有**等价强制力；
- dsh 侧门禁的落地形式是**结构化、可观测**的拒绝块与放行块：

  ```text
  [SDDU-GATE-DENY]  {"feature":"…","from":"…","to":"…","missing":[…],"reason":"…","action":"none"}
  [SDDU-GATE-ALLOW] {"feature":"…","from":"…","to":"…","prereq":"…","action":"proceed"}
  ```

- 拒绝时**不写 `state.json`、不产出阶段产物**；遇非法跃迁（跳步 / 回退）**必须拒绝**，
  不得「提示后继续」；
- **降级边界**：若模型未按协议输出拒绝块，即视为降级边界被穿越 —— 该情形可在
  [`verification.md`](./verification.md) 的 **V4** 场景中被人工观测到，不会被文档掩盖。
- 两平台在「强制力」上存在**能力落差**，详见 [`dual-platform-diff.md`](./dual-platform-diff.md)；
  **不得**把两平台表述为等价。

---

## 8. 冲突 / 残留提示（EC-002 / EC-004）

**EC-002 冲突（同名 / 近义条目）**：安装脚本会扫描目标层与其他 rank 层，
检测同名或近义（名字含 `sddu`）的条目并**显式提示**，**不会静默遮蔽、也不会删除它们**。
规则：跨层「最近层优先」，同层内按 rank 裁决。若发现非预期遮蔽，请人工确认后重命名或移除相应条目。

**EC-004 发现缓存失效**：dsh 的 skill 发现缓存以解析后的 scope 链为键，
`skills/change` 事件驱动消费方**重新快照**。安装或卸载改变了 skills 目录内容后，
请确认宿主触发了 `skills/change` 并刷新了列表；若仍看到陈旧条目，请重新加载或重启会话后再观测。
（宿主无 CLI，无法由脚本主动触发。）

---

## 9. 相关文档

- [双平台差异清单](./dual-platform-diff.md) —— OpenCode vs dsh 的五维差异与能力落差
- [定位说明](./positioning.md) —— SDDU 阶段方法论与 dsh 原生能力（plan mode / todo / workflow / goal / compaction）的分工与共存
- [升级跟随清单](./upgrade-following.md) —— 步骤 0~6、破坏点记录模板、成本基线
- [验证方法](./verification.md) —— V1~V5 验证方法与场景、最小人工验证清单
- [契约依赖点](./contract-dependencies.md) —— 由清单渲染的人读版（禁止手工编辑）
