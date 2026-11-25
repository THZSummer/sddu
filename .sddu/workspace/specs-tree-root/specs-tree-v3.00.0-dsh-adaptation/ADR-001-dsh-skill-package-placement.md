# ADR-001：dsh Skill 包的落位与装配

## 状态
PROPOSED

## 背景

用户已拍板 SDDU 在 dsh 上的交付形态为「**dsh Skill 包**」（spec §1 元数据「交付形态（既定约束）」），并要求复用 dsh 的 skill 提供方注册表与 rank 优先级（FR-001）。

dsh 的 skill 系统是「提供方注册表 + rank 优先级」（调研快照 2026-08-14 §3.4）：

- Provider 接口为 `list()` + `get()`；提供方类型分本地文件系统 / 内嵌 / 远程。
- 本地发现的优先级表：

| Rank | Source | Root |
|------|--------|------|
| 100 | `project-dsh` | `<projectRoot>/.dsh/skills` |
| 200 | `project-agents` | `<projectRoot>/.agents/skills` |
| 300 | `custom` | `Config.customSkillDirs` |
| 400 | `user-dsh` | `<dshHome>/skills` |
| 500 | `user-agents` | `<agentsHome>/skills` |
| 600 | `bundled` | `Config.bundledSkillDir` |

- 冲突规则：重名时**最近层优先**，单层内按 rank 裁决；发现缓存以解析后的 scope 链为键，`skills/change` 事件驱动消费方重新快照。

SDDU 自身的 skill 体系按**目录层级**仲裁（三层：用户级 `.sddu/skills/`、框架级 `.opencode/plugins/sddu/skills/`、运行时 `.opencode/skills/`），**不携带 rank 概念**（Q-005 / A-005）。因此必须回答：SDDU 落到哪一级、如何命名、冲突时谁遮蔽谁、三层目录如何映射（FR-001 验收标准 ③「产出三层目录 ↔ dsh rank 落位推演结论」）。

约束：适配必须最小侵入（NG-001 不做通用抽象、NG-003 不改造 dsh 本体、FR-009 dsh 专项概念不渗透核心域）；父级依赖 `FR-FRAMEWORK-ARCH-001` 提供的 `src/adapters/` 适配容器。

## 决策

**1. 交付与装配形态**：SDDU 以「Skill 包目录树」交付，由构建期生成、安装期拷贝落位：

```
dist/dsh/skills/
├── sddu/            SKILL.md   ← 路由/入口 Skill（命令入口路由表 + 门禁与状态协议）
├── sddu-discovery/  SKILL.md   ← 阶段 1
├── sddu-spec/       SKILL.md   ← 阶段 2
├── sddu-plan/       SKILL.md   ← 阶段 3
├── sddu-tasks/      SKILL.md   ← 阶段 4
├── sddu-build/      SKILL.md   ← 阶段 5
├── sddu-review/     SKILL.md   ← 阶段 6
├── sddu-validate/   SKILL.md   ← 阶段 7
├── sddu-roadmap/    SKILL.md   ← 独立（版本规划）
├── sddu-docs/       SKILL.md   ← 独立（项目全景）
└── sddu-fast/       SKILL.md   ← 独立（快速模式）
```

`SKILL.md` 正文 = `src/templates/agents/sddu-*.md.hbs` 的指令正文（单一来源，见 ADR-005）＋ dsh 协议片段（gate-protocol / state-sync-protocol，见 ADR-003/004）＋ `skill-header`（frontmatter + 来源标识）。

**2. 主落位取 rank 100 `project-dsh`（`<projectRoot>/.dsh/skills`）**：

**三层目录 ↔ dsh rank 落位推演**

| SDDU 三层 | 语义 | dsh 对应落位 | rank | 说明 |
|-----------|------|-------------|:--:|------|
| 框架级 `.opencode/plugins/sddu/skills/`（随包分发） | 框架自带 Skill | `<projectRoot>/.dsh/skills/`（项目级安装） | **100** | **主落位**：目录约定即生效、无需改 dsh 配置；「最近层优先」在项目作用域内天然压过生态同名 skill，遮蔽行为可预期 |
| 框架级（全局安装场景） | 同一批 Skill 的用户级副本 | `<dshHome>/skills` | **400** | 用户级安装选项（`install-dsh.sh --scope user`）；跨项目复用，代价是可能被项目级 skill 遮蔽（符合「最近层优先」预期） |
| 用户级 `.sddu/skills/`（维护者自建） | 用户自定义 Skill | `Config.customSkillDirs`（若用户配置）／`<agentsHome>/skills` | 300 / 500 | **不被 SDDU 安装脚本接管**：属 dsh 用户的自主配置面；文档给出映射指引而非自动写入 |
| 运行时 `.opencode/skills/`（sync 目标） | 三元自举闭环的同步目标 | 即 rank 100 目录（同步 = 拷贝到 `.dsh/skills/`） | 100 | `sddu-skill-sync` 的 `--dest` 在 dsh 场景指向 `.dsh/skills`；本 Feature **不修改 sync 脚本默认值**，以文档约定承载（最小侵入） |

**3. 命名与来源可辨识（FR-001 / EC-007）**：

- Skill 名统一 `sddu-` 前缀（`sddu` / `sddu-<phase>` / `sddu-roadmap` / `sddu-docs` / `sddu-fast`）。
- 每个 `SKILL.md` 的 frontmatter 携带 `metadata.sddu-source`（形如 `adapters/dsh@<sdduVersion>#<snapshot>`）与 `metadata.sddu-contract-snapshot: 2026-08-14`，使 **dsh Web UI 的 skill 列表可辨识来源与优先级**（FR-001①）。
- 冲突裁决：同层同名按 rank 裁决、跨层按「最近层优先」；安装脚本必须在输出中打印本次落位与检测到的同名条目（EC-002：**显式提示冲突，不得静默遮蔽**）。

**4. 提供方选择**：只使用**本地文件系统 provider**。不使用内嵌 provider（需 dsh 发行侧动作）、不使用远程 provider（引入网络与额外契约面）。

**5. 被否决的落位备选**：

| 备选 | 结论 | 理由 |
|------|------|------|
| rank 300 `customSkillDirs` | 否决为主落位 | 需用户/安装过程修改 dsh 配置，侵入高于 rank 100 的纯目录约定 |
| rank 200 `.agents/skills` | 否决 | 中性目录（面向全 agent 生态），会让「SDDU 来源」辨识度下降，且与项目 `.dsh` 语义分离 |
| rank 600 `bundled` | 否决 | 需改动/重打包 dsh 发行版，违反 NG-003（不改造 dsh 本体） |
| 自研 dsh 插件注册 skill | 否决 | 超出「Skill 包」既定交付形态（见 ADR-003 对硬通道的处理） |

## 后果

**正面**

- 落位结论可执行且最小侵入：装 = 拷贝目录，卸 = 删目录，无需改 dsh 配置或宿主发行版。
- 遮蔽行为可预期：`sddu-` 前缀 + rank 100 + 来源标识，使 FR-001①/②/③ 均可被 V1 场景人工观测判定。
- dsh 专项概念（rank / 目录约定）全部留在安装脚本、`docs/dsh/` 与 `adapters/dsh/`，核心域零渗透（FR-009②）。

**负面 / 需承担**

- rank 语义来自 2026-08-14 快照，若 dsh 已调整 rank 表或目录约定，落位即失效 → 由 ADR-006 的契约清单与升级跟随清单承接（R-001/R-008）。
- 「最近层优先」意味着当用户项目内存在同名 `sddu-*` skill 时，SDDU 可能被用户自建版本遮蔽——按 FR-001/EC-002 要求**显式提示**而非阻断。
- 用户级安装（rank 400）天然弱于项目级（rank 100），文档必须讲清「为何推荐项目级安装」，否则用户会遭遇难以理解的遮蔽现象。

**对下游（tasks）的约束**

- 落位与命名规则必须由 `install-dsh.sh`、`skill-header.md.hbs`、`docs/dsh/README.md` 三处**同源表达**，并由 `skill-package.test.ts` 断言一致性（防漂移）。
