---
name: dev-guide
description: "当需要给 SDDU 插件自身（本仓库 opencode-sddu-plugin / sddu）加新功能、修缺陷，或改动 Agent prompt、Skill、模板、TypeScript 源码、安装/打包脚本并完成构建、验证、发布时加载。触发场景如：'给 SDDU 加个功能'、'修 SDDU 的 bug'、'改一下 sddu-fast 的 prompt'、'SDDU 发新版本'、'sddu 插件自己怎么开发/验证/发布'、'为什么我改了 .opencode 不生效'。产出一条以 SDDU 7 阶段 Agent 为主干的端到端流程（用 SDDU 开发 SDDU）。不用于用 SDDU 开发业务功能——那走 @sddu / @sddu-fast。"
---

# dev-guide

**用 SDDU 开发 SDDU。** SDDU 本身就是一个 OpenCode 插件（`opencode-sddu-plugin`），因此「开发 SDDU」= **开发一个 OpenCode 插件**；本流程对任何插件（`superpowers` 等）同样成立，只是当前实例恰好是 SDDU 自己（dogfooding，下文用 `<plugin>` 泛指插件名）。

开发 SDDU 的过程**直接映射到 SDDU 自己的 7 个阶段 Agent**上：由 `@sddu` 主路由依次调度 `@sddu-discovery → spec → plan → tasks → build → review → validate`。

## 判边界的方法（先记住这一句）

**把 SDDU 当成一个普通业务项目来看**——哪怕是「SDDU 自己开发自己」，也一样。开发业务时，你**不应该去动"你用来开发的插件/框架"**。

> 问自己一句：**这个操作，是在动「我正在开发的项目 / 业务内容」，还是在动「我开发时用的插件 / 框架（工具）」？**

| 你面对的东西 | 归属 | 该不该动 |
|------|------|:--:|
| 业务源码 / 文档 / 配置（SDDU 自己开发自己时，业务就是 `src/`） | **项目自身** | ✅ 正常改 |
| **用户级 Skill**（`.sddu/skills/`） | **项目自身产出的内容** | ✅ 正常改，**改完要同步**（让它生效） |
| `.opencode/`（插件安装、agents、框架技能、`opencode.json`） | **你开发时用的工具** | 🚫 不手改（升级 = 整体重装） |
| `dist/`（构建产物） | 中间产物 | 🚫 不手改 |
| `.sddu/specs-tree-root`、`ROADMAP.md`、`TREE.md` | SDDU 流程产物 | 🚫 不是本次开发的产物 |

**购物项目类比**：开发一个购物系统时，你会去改 `.opencode/` 里的东西吗？不会，那是你的工具。但你新增了项目自己的 Skill，会同步进去让它生效吗？**会**，那属于项目内容。开发 SDDU 时同理。

**由此得到两条铁律：**

1. **只改项目自身的内容**（业务源码、文档、用户级 Skill）；**不碰 `.opencode/` 里的插件/框架与 `dist/`**（那是工具，不是业务）。
2. **开发只面对 `src/`，验证走隔离**：要验证正在开发的插件代码，用 e2e 生成临时项目去装、去跑。至于要不要把**当前仓库的工具升级到开发中版本**——那是你作为**工具用户**自己的事：想升级随时 `install.sh .` 整体升级（重启生效），开发过程中就可以做，但它是「升级工具」，不是开发步骤。

> 完整清单见 **附录 A（目录分层红线）** 与 **附录 B（常见误操作）**。

## 起点 · 定级：走完整流程还是轻量流程

| 级别 | 判据（满足任一即升级） | 走法 |
|:--:|------|------|
| **L0 轻量** | 单/少文件（≤4）bug、拼写、配置、注释、小范围重构、不改 public 接口 | `@sddu-fast`（跳过文档阶段，仍守两条铁律） |
| **L1 功能** | 文件数 ≥5；改 public API / 导出签名；跨 2+ 模块；需 ADR；新增/改名 agent、skill、插件注册 | `@sddu 开始 <feature>`，走下面 7 阶段全流程 |

> 两级的**实施与验证要求完全相同**（都只改源码、都在隔离项目验证），差别只是**要不要正式立项文档**。

---

# 主线 · 开发新特性（完整 SDDU 流程）

入口：`@sddu 开始 <feature>`。`@sddu` 主路由会按状态依次调用下列阶段 Agent。

## 1 · 发现问题 —— `@sddu-discovery`

- **做什么**：发掘并澄清 **SDDU 自身/插件**的问题——流程缺口、Agent 行为偏差、Skill 能力缺失、插件加载缺陷、开发者体验痛点。
- **产出**：`discovery.md`（问题清单）。
- **SDDU 特有**：分析对象是**本插件与它的工作流**，不是业务需求；把"哪一类产物出问题"（插件实现 / Agent / Skill / 注册权限 / 文档）一并记下。

## 2 · 定义需求 —— `@sddu-spec`

- **做什么**：定义 **SDDU 插件应该做成什么样子** 才算解决第 1 步的问题——可测试的验收标准。
- **产出**：`spec.md`。
- **SDDU 特有**：每条需求要能落到**插件的某个组成**上（见文末「插件本体」），避免"需求对了但不知道改哪个 src 层"。

## 3 · 技术方案 —— `@sddu-plan`

- **做什么**：把需求设计成技术方案，含 ADR。
- **产出**：`plan.md`（+ ADR）。
- **SDDU 特有**：必须明确 **改哪个 `src/` 目录**、是否触及 **插件注册 / agent 前缀 / skill 目录 / 打包脚本**，以及**是否需要 e2e/回归验证**。用「变更类型 → 真源」表（附录 C）定位唯一真源。

## 4 · 任务分解 —— `@sddu-tasks`

- **做什么**：拆成可并行、可独立验证的原子任务。
- **产出**：`tasks.md` / `tasks.json`。

## 5 · 实施构建 —— `@sddu-build`

- **做什么**：逐任务实现，**只改设计态源码**。
- **构建**：
  ```bash
  npm run build      # build:agents（模板→dist/templates/agents）+ build:ts（tsc→dist/）
  npm run package    # → dist/sddu/（插件包）+ dist/sddu.zip
  ```
- **SDDU 红线**：🚫 **不要**去 `.opencode/` 或 `dist/` 就地热修——那是产物，改了会被覆盖且不入 git；运行时行为一律「改 `src/` → 构建」。
- ✅ 若本次新增/修改了**用户级 Skill**（`.sddu/skills/`），它属于项目内容，改完**照常同步**生效。

## 6 · 静态审查 —— `@sddu-review`

- **做什么**：静态审查代码质量、规范符合、架构一致、测试质量。
- **SDDU 特有审查项**（就是普通项目的完整性检查，不存在"SDDU 特殊同步"问题）：
  - [ ] 变更文件全部属于真源 `src/`，且各归其位（对照附录 C：Agent prompt → `src/templates/agents/*.md.hbs`；Skill → `src/skills/{framework,builtin}/`）
  - [ ] 新增/改名/删除 Agent 时，`src/adapters/opencode/templates/opencode.json.hbs` 的 `agent` 注册同步增改删（性质同「新路由要挂到路由表」）

## 7 · 动态验证 —— `@sddu-validate` ⭐

> **注意：验证一律在 e2e 脚本生成的临时项目里做；升级自己的插件安装不是验证手段。**

- **做什么**：把插件「真装一遍」到隔离项目，验证它在真实环境里可用。
- **怎么做（隔离）**：
  ```bash
  # e2e 脚本 → 新建临时项目 + 把当前代码装进去（不碰当前仓库）
  bash e2e/scripts/basic/sddu-e2e.sh "dev-check" --auto --report
  #   → $SDDU_TEST_DIR/sddu-test-dev-check/   （默认 $HOME/sddu-test-projects）
  #   进入该项目启动 opencode，做「插件加载验收」
  ```
- **插件加载验收**（L3 的核心，不只是"代码不报错"）：
  - [ ] `.opencode/opencode.json` 的 `plugin` 指向本插件，`agent` 条目齐全（新增/改名已注册）
  - [ ] `.opencode/plugins/<plugin>/index.js` 加载无报错（看 opencode 启动输出）
  - [ ] 新增/改动的 **Agent** 可被调用（`@<plugin>-xxx`）
  - [ ] 新增/改动的 **Skill** 可被发现（`discover.cjs list` / Agent 能触发）
  - [ ] `permission` 按预期生效
- **产出**：`validate-report.md`。
- **验证 ≠ 升级自己**：验证开发中的代码 → e2e 临时项目。把当前仓库的工具升级到开发中版本（`install.sh .` + 重启）是你作为用户的自由，随时可做，但它不是验证，也不属于开发流程。
- ✅ **用户级 Skill 例外**：`.sddu/skills/` 属于项目自身内容，新增/修改后**照常同步**（`sync.cjs`）让它生效。

## 8 · 发布与回流（SDDU 7 阶段之外的收尾）

1. 确认改动全部在 `src/`（`git status` 不出现 `dist/`、`.opencode/`、`.sddu/` 产物）
2. 版本号：`package.json` `version` + `README.md` badge/版本历史 + `.sddu/ROADMAP.md`
3. `npm run build && npm run package`
4. 冒烟（**隔离**）：`bash install.sh /tmp/sddu-smoke` 后进该目录 `opencode`
5. `git add -A && git commit && git push`（写清版本与变更范围）
6. 回流：更新 `.sddu/ROADMAP.md`、`.sddu/TREE.md`（经 `sddu-tree`）、README「已完成 Feature / 版本历史」

---

# 轻量线 · 修复缺陷（`@sddu-fast`）

小 bug 不值得起一轮完整 7 阶段，用 `@sddu-fast` 直改；但**两条铁律照样适用**：

1. **定位**：找到问题对应的真源（附录 C），确认改动 ≤4 文件、不动 public 接口
2. **实施**：只改 `src/`（Agent prompt → `.hbs`；Skill → `src/skills/**`；逻辑 → `src/**/*.ts`）
3. **构建**：`npm run build`（必要时 `npm run package`）
4. **验证**：L1 `npm test`；涉及运行时/加载 → **L3 隔离项目**（同主线第 7 步红线）
5. **发布**：版本号（视情况）、`git commit/push`

> 若发现自己"越改越大"（文件数 ≥5 / 触及接口 / 跨模块）→ 停下来升级到主线完整流程。

---

# 心智模型 · 插件本体与加载链路

### 插件的组成（安装后形态）

| 组成 | 位置 | 作用 |
|------|------|------|
| **插件实现** | `.opencode/plugins/<plugin>/`（`index.js` + 各域） | 运行时逻辑（状态机、工具、钩子） |
| **Agent 定义** | `.opencode/agents/<plugin>-*.md` | 各 Agent 的 prompt |
| **Skill** | `.opencode/plugins/<plugin>/skills/` → `.opencode/skills/` | 按需加载的能力包 |
| **注册与权限** | `.opencode/opencode.json`（`plugin` / `agent` / `permission`） | 告诉 OpenCode：加载哪个插件、有哪些 agent、放开哪些权限 |

### 加载链路（OpenCode 启动时）

```
.opencode/opencode.json                      ← 读 plugin / agent / permission
        │
        ├─ plugin: ["opencode-sddu-plugin"]  → 加载 .opencode/plugins/<plugin>/index.js
        ├─ agent.<name>.prompt = {file:agents/<plugin>-*.md}
        └─ 运行时 → 在 .opencode/skills/ 中按 description 触发 Skill
```

### 四层产物链（空间坐标）

```
src/  ──build──▶  dist/  ──package──▶  dist/sddu/(插件包)  ──install.sh──▶  <目标项目>/.opencode/
 ▲                                                                              │
 └──────────────────── 只往回改真源；右侧全是产物 ─────────────────────────────┘
```

> **dogfooding 的含义**：SDDU 用自己开发的插件来开发 SDDU。但这个插件**依然是一个"被开发的插件"**——它照样要走完整流程（构建 → 打包 → 装到隔离项目 → 验证加载）。**不能因为「插件 == 自己」就省掉这些步骤**；省掉就会用开发中代码污染自身运行环境。换成 `superpowers` 等其他插件，同一条主干照样成立。

---

# 附录 A · 目录分层红线

| 类别 | 路径 | 谁生成 | 能否手改 |
|------|------|--------|:--:|
| ✅ **设计态源码** | `src/**`、`scripts/**`、`e2e/**`、`docs/**`、`examples/**`、`README.md`、`install.sh/ps1`、`bootstrap.sh/ps1`、`package.json`、`tsconfig.json` | 人 | **能**（唯一可改层） |
| 🚫 **构建产物** | `dist/**`、`dist/sddu/**`、`dist/sddu.zip` | `npm run build` / `package` | 禁止 |
| 🚫 **运行时副本** | `.opencode/**`（`agents/`、`plugins/<plugin>/**`、`skills/`、`opencode.json`） | `install.sh` 生成 | 禁止 |
| 🚫 **流程产物** | `.sddu/specs-tree-root/**`、`.sddu/docs-tree-root/**`、`.sddu/ROADMAP.md`、`.sddu/TREE.md` | SDDU 流程 / `sddu-tree` | 禁止 |

> **唯一例外**：`.sddu/skills/<name>/`（用户级 Skill 源目录，git 管理，由 `sddu-skill-creator` 创建）。

# 附录 B · 常见误操作

- ❌ 直接编辑 `.opencode/agents/sddu-fast.md` → ✅ 改 `src/templates/agents/sddu-fast.md.hbs`
- ❌ 直接编辑 `.opencode/skills/opencode-operator/...` → ✅ 改 `src/skills/builtin/opencode-operator/...`
- ❌ 直接编辑 `dist/**` → ✅ 会被 `npm run build` 覆盖，改真源
- ❌ 在 `.opencode/` / `dist/` 就地热修后忘了回写真源 → ✅ 一律回真源
- ❌ 为了让改动「生效」去手改 `.opencode/` 产物 → ✅ 改 `src/`；想用上新版本就 `install.sh .` 整体升级工具；想验证就 e2e 临时项目
- ✅ 反例澄清：**用户级 Skill**（`.sddu/skills/`）改完**应该同步**——它属于项目内容，不算动工具

# 附录 C · 命令速查 + 变更类型 → 真源

| 变更类型 | 真源（改这里） | 下游（别碰） |
|------|---------------|------|
| 插件注册 / 权限 | `src/adapters/opencode/templates/opencode.json.hbs` | `dist/sddu/opencode.json` → `.opencode/opencode.json` |
| 插件入口 / 域逻辑 | `src/adapters/opencode/plugin.ts`、`src/<domain>/**` | `dist/**/*.js` → `.opencode/plugins/<plugin>/**` |
| Agent 行为 / prompt | `src/templates/agents/sddu-*.md.hbs` | `dist/templates/agents/*.md` → `.opencode/agents/*.md` |
| 框架级 Skill | `src/skills/framework/<name>/` | `dist/sddu/skills/` → `.opencode/plugins/<plugin>/skills/` → `.opencode/skills/` |
| builtin Skill | `src/skills/builtin/<name>/` | 同上 |
| 输出文档模板 | `src/templates/outputs/sddu-*.md.hbs` | `dist/templates/outputs/*` |
| TypeScript 逻辑 | `src/**/*.ts` | `dist/**/*.js` |
| 安装 / 引导脚本 | `install.sh` / `install.ps1` / `bootstrap.sh` / `bootstrap.ps1` | — |
| 打包逻辑 | `scripts/package.cjs` | `dist/sddu/`、`dist/sddu.zip` |
| 测试 | `src/__tests__/**`、`e2e/**` | — |

```bash
# 构建
npm run build / build:agents / build:ts
npm run package
# 验证（L1）
npm test / test:e2e / test:state:integration
./scripts/verify-skills.sh
./scripts/check-sdd-residue.sh
# 验证（L3 隔离，唯一允许"真装一遍"）
bash e2e/scripts/basic/sddu-e2e.sh "<name>" --auto --report
bash install.sh "$HOME/sddu-test-projects/sddu-test-<name>"   # 仅限隔离项目
```

# 附录 D · 插件结构速查（SDDU 实例）

| 源（`src/`） | 构建 | 打包产物（`dist/sddu/`） | 安装位置 |
|-----------|------|----------------------|---------|
| `src/adapters/opencode/templates/opencode.json.hbs` | package | `opencode.json` | `.opencode/opencode.json` |
| `src/adapters/opencode/plugin.ts` + `src/**/*.ts` | `tsc` | `index.js`、`adapters/`、`state/`、`shared/`、`templates/` | `.opencode/plugins/<plugin>/` |
| `src/templates/agents/*.md.hbs` | `build:agents` | `agents/*.md` | `.opencode/agents/` + 插件内 `agents/` |
| `src/skills/{framework,builtin}/` | package（拍平） | `skills/<name>/` | `.opencode/plugins/<plugin>/skills/` → `.opencode/skills/` |
| `install.sh` / `install.ps1`（根） | package | `install.sh` / `install.ps1` | 随包分发 |

# 边界（本 Skill 不做什么）

- ❌ 不用于用 SDDU 开发业务功能 —— 那是 `@sddu` / `@sddu-fast` 的职责
- ❌ 不重复定义 7 阶段细则 —— 阶段内部行为以 `@sddu-*` Agent 为准，本 Skill 只写「开发 SDDU 自身」时每阶段的特有约束
- ❌ 不创建框架级 Skill —— 框架级走 `src/skills/framework/` + 完整流程；用户级走 `sddu-skill-creator`
- ❌ 不修改 `.opencode/` 与 `.sddu/` 流程产物 —— 最高优先级红线，任何情况下不例外
