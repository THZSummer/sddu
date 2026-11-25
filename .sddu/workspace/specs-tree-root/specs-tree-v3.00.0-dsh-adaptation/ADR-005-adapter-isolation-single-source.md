# ADR-005：适配层隔离边界与指令文本单一来源

## 状态
PROPOSED

## 背景

`FR-FRAMEWORK-ARCH-001`（v4.0.0）已建立三域分层与 `src/adapters/` 平台适配器容器：核心域（`state` / `templates` / `shared` / `pipeline` / `discovery`）零平台依赖；`src/adapters/opencode/` 是唯一平台耦合点；依赖方向允许 `adapters → 核心域/index.ts → shared`，禁止反向（framework-arch ADR-001 与 ADR-006 R-API-04）。**注意：`src/shared/platform-adapter.ts` 类型化通用接口在仓库中并未实现**——现有隔离由「目录结构 + 单向依赖规则」强制，而非类型化契约。

本 Feature 的特殊性（A-006 / 开放问题 8）：dsh 交付形态是**非代码 / 配置形态**（Skill 包 = Markdown 指令目录树），与 OpenCode 适配（TypeScript 插件）形态差异很大。需要回答：现有 `adapters/` 容器能否容纳它？是否要为此抽象通用接口？

约束：NG-001（不做通用多平台抽象，v5.1.0 由 FR-CROSSPLAT-001 承载）、NG-004（不改核心状态机语义）、FR-009（dsh 专项概念不得渗透核心域、既有 OpenCode 链路行为不变）、NFR-002（双平台不得出现两套漂移表述）、NFR-004（最小侵入）。此外，dsh 阶段指令必须与 OpenCode 阶段指令**同源**——否则必然漂移。

## 决策

**1. 容纳度裁定：`adapters/` 容器可容纳非代码形态，无需修改核心、无需实现通用接口。**

`src/adapters/dsh/` 以「**资产 + 工具 + 契约清单**」形态落位：

| 组成 | 内容 | 性质 |
|------|------|------|
| 资产模板 | `templates/skill-header.md.hbs`、`gate-protocol.md.hbs`、`state-sync-protocol.md.hbs`、`router-command-map.json` | 声明式资产（非 TS 运行时逻辑） |
| 契约清单 | `contract/dsh-contract-manifest.json` + `contract.ts`（类型化装载与校验） | 静态清单 + 薄校验层 |
| 构建与分发 | `scripts/build-dsh-skills.cjs`、`scripts/install-dsh.sh`、`scripts/uninstall-dsh.sh` | 仓库侧工具（不经 dsh 运行） |
| 文档 | `docs/dsh/*` | 用户交付文档 |
| 测试 | `src/__tests__/unit/adapters/dsh/skill-package.test.ts` | 生成物静态断言（跑在既有 `opencode` jest 项目下） |

**2. 指令文本单一来源（NFR-002 的关键）**

- dsh `SKILL.md` 的指令正文**只能来自** `src/templates/agents/sddu-*.md.hbs`（与 OpenCode 同源）；构建脚本执行「**拼接**」而非「改写」：`skill-header`（dsh frontmatter + 来源标识）+ 源指令正文（占位符原样保留）+ 协议片段（按 Skill 类型注入）+ 结尾的协议声明段。
- **禁止**在 `src/adapters/dsh/` 内复制一份阶段指令正文；平台差异只允许存在于① 头/尾包装、② 协议片段、③ 落位与入口约定三处。
- 生成物是**派生物**（`dist/dsh/**`，`dist/` 已被 `.gitignore` 忽略），不产生第二份需要人工维护的指令副本。

**3. 隔离规则（R-DSH-01~06，写入 plan §2.6 并由测试断言）**

| 规则 | 内容 |
|------|------|
| R-DSH-01 | dsh 资产收敛于 `src/adapters/dsh/` + `scripts/*dsh*` + `docs/dsh/`，`src/` 其他位置不新增 dsh 文件 |
| R-DSH-02 | 核心域不得 import `adapters/dsh`；核心域文件不得出现 `dsh` / `rank` / `.dsh/skills` / `scope 链` 等专项概念 |
| R-DSH-03 | `adapters/dsh/**` 只可经 `../../state`、`../../shared`、`../../templates` 的 index 引用核心（R-API-02/04）；不得 import `adapters/opencode` |
| R-DSH-04 | 不修改 `src/adapters/opencode/**`、`install.sh`、`install.ps1`、`src/index.ts`；`package.json` / `scripts/package.cjs` 仅追加式改动 |
| R-DSH-05 | 阶段指令单一来源（见决策 2） |
| R-DSH-06 | 平台差异只允许存在于 `adapters/` 与 `docs/dsh/`；核心文档保持中立表述 |

**4. 分发隔离**：`dist/dsh/` 与 OpenCode 分发 `dist/sddu/` **同级并列、互不包含**；`install.sh` 只消费 `dist/sddu/`，因此 dsh 资产不会进入 `.opencode/`。`scripts/package.cjs` 的打包清理阶段需把 `dsh` 加入保留项（否则会被删除），此改动为追加式，不改变 `dist/sddu/` 产物与路径。

**5. 被否决的备选**

| 备选 | 结论 | 理由 |
|------|------|------|
| 为 dsh 实现 `shared/platform-adapter.ts` 通用接口 | 否决 | 提前抽象（NG-001）；单平台样本上定义接口正是 v5.1.0 要避免的返工（R-003）；且 dsh 是资产形态，没有可实现的运行时接口语义 |
| 把 dsh 阶段指令复制一份到 `adapters/dsh/` 并独立维护 | 否决 | 直接违反 NFR-002（两套漂移表述），双平台维护成本翻倍（R-006） |
| 让 dsh 复用 OpenCode 插件（`plugin.ts`）承载 | 否决 | dsh 无 OpenCode 插件原语；且会把平台 SDK 依赖引入 dsh 路径 |
| 把文档放在 `src/adapters/dsh/docs/` | 否决 | 与仓库既有文档约定（`docs/`）不符；`docs/dsh/` 更易被 dsh 用户发现 |

## 后果

**正面**

- 零核心改动 + 零 OpenCode 链路改动，现有测试可保持通过（FR-009①/NFR-004 的客观判据）。
- dsh 专项概念被结构性挡在核心域之外（FR-009②），且这一约束可被静态测试持续强制。
- 「指令单一来源 + 派生物」使双平台表述不会漂移（NFR-002①），并直接为 v5.1.0 提供「差异点清单」而非「两套实现」（G-010）。

**负面 / 需承担**

- dsh 适配层几乎不含运行时逻辑，因此「适配能力」无法像 OpenCode 那样被单元测试覆盖——测试只能断言**生成物结构**；这是形态决定的边界，需在 `docs/dsh/verification.md` 如实声明（不冒充实机验证）。
- 构建期依赖 `src/templates/agents/*.md.hbs` 的内部结构（正文边界），若 agent 模板格式演进（如 frontmatter 变更），构建脚本需同步调整——由生成一致性测试作为守门。
- `scripts/package.cjs` 的追加改动触及分发路径，属**低概率高风险**改动，必须由「build + test:core + test:opencode 全绿」门禁保护（plan §6 R-010）。

**对下游（tasks）的约束**

- `skill-package.test.ts` 必须实装 R-DSH-01/02/04/05 的可断言部分（目录与关键字扫描、现有 OpenCode 产物路径不受影响）。
- `scripts/build-dsh-skills.cjs` 不得对 `src/templates/agents/*.hbs` 做任何写操作（只读引用）。
