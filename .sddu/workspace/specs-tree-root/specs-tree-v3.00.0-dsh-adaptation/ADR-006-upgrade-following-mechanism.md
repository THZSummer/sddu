# ADR-006：升级跟随机制 = 契约清单 + 版本锚定 + 人工回归清单

## 状态
PROPOSED

## 背景

dsh 处于 **Developer preview**，带兼容性破坏警告、快速迭代（快照 §1）。用户的风险姿态是「**适配层隔离，允许跟随升级**」（既定约束）。FR-007 要求提供可复现的「跟随升级」动作清单与破坏点记录机制，使适配成果在 dsh 升级后可被重新验证；EC-001 要求契约变更时更新契约依赖清单并标注快照日期。

已知约束：

- 全部 dsh 事实来自 **2026-08-14 单一快照**，且 spec 阶段**契约刷新失败**（联网搜索入口不可用）→ 时效风险 R-001 已登记，NFR-007 要求「每条 dsh 事实可追溯至快照，刷新失败显式登记为开放问题与风险」。
- **无 CLI**：不做自动化检测（EC-006/NG-002）；升级后只能人工在 Web UI 观测（V1~V3 重复执行）。
- 隔离边界（ADR-005）已把修复面限定在 `adapters/dsh` + 文档，因此「跟随升级」的成本取决于**能否快速定位破坏点**，而不是改多少代码。

## 决策

**1. 契约依赖点集中清单（单一来源）**：`src/adapters/dsh/contract/dsh-contract-manifest.json`，每条记录字段：

```json
{
  "id": "skill-provider-rank",
  "area": "skill-provider | command-registration | profile-bundle | dir-convention | session-events | guard-pipeline",
  "snapshotDate": "2026-08-14",
  "fact": "SkillProvider 接口 list()+get()；本地 rank 100~600（project-dsh/project-agents/custom/user-dsh/user-agents/bundled）",
  "assumption": "rank 表与目录约定未变",
  "observableCheck": "在 dsh Web UI 列出 skill，确认 SDDU 条目来源与优先级；确认 <projectRoot>/.dsh/skills 被扫描",
  "breakImpact": "落位失效 → FR-001/V1 不可通过",
  "fixHint": "改 install-dsh.sh 落位常量 + skill-header 来源标识；必要时新增 rank 映射"
}
```

初始至少登记 6 类依赖点（全部标注 `snapshotDate: 2026-08-14`）：`skill-provider-rank`、`skill-discovery-cache`（scope 链 + `skills/change` 失效）、`command-registration`（**快照未覆盖 → 已知缺口**）、`profile-bundle`（profile 分层 + `cordis.patch.yml` overlay）、`dir-convention`（`.dsh/skills` 等根目录）、`session-events`（`SessionEvent` 可回放 + 「Model-visible ⟺ logged」）、`guard-pipeline`（**演进点，未实现**）。

清单由 `contract.ts` 类型化装载；`scripts/build-dsh-skills.cjs` 渲染出人读版 `docs/dsh/contract-dependencies.md`（避免手工双份维护），并据此产出 `dist/dsh/manifest.json`。

**2. 版本锚定**：构建时 `dist/dsh/manifest.json` 写入：

```json
{
  "sdduVersion": "<package.json version>",
  "dshContractSnapshot": "2026-08-14",
  "contractManifestHash": "<sha256>",
  "generatedAt": "<ISO8601>",
  "skills": ["sddu", "sddu-discovery", "..."]
}
```

含义：安装到某 dsh 环境的这份 Skill 包，**锚定**它诞生时的 dsh 契约快照；后续任何比对都以该锚点为基线（这是「契约时效可追溯」的落地手段，NFR-007）。
同时每个 `SKILL.md` 的 frontmatter 携带同一快照日期（`metadata.sddu-contract-snapshot`），使**skill 列表本身**即可暴露时效（V1 场景可一眼看到）。

**3. 升级跟随清单（`docs/dsh/upgrade-following.md`）**：

| 步骤 | 动作 | 观测 |
|:--:|------|------|
| 0 | **刷新 dsh 契约**（技能提供方接口 / rank 表 / 目录约定 / profile 装配 / 命令注册）；刷新失败则**如实记录**（NFR-007） | 记录 dsh 版本号与刷新日期，更新开放问题 1 |
| 1 | 记录 dsh 版本 + 本包 `manifest.json` 的快照日期 | 版本对照表 |
| 2 | 逐条走 `dsh-contract-manifest.json` 的 `observableCheck` | 每条标注：未变 / 已变 / 无法观测 |
| 3 | 重复 **V1（装配可见）→ V2（入口可用）→ V3（单阶段走通）** | 通过/失败 + 截图或会话记录 |
| 4 | 对已变项：定位破坏点 → 落 `破坏点记录模板` → 修复（改 `adapters/dsh` 资产/脚本）→ 复跑 V1~V3 | 破坏点记录 + 修复 diff |
| 5 | 更新契约清单：修改 `fact`/`assumption`，**bump `snapshotDate` 为本次刷新日期**；受影响 ADR 追加修订说明 | 清单哈希变化 |
| 6 | 形成**成本基线**：记录「从升级到回归通过」的人时与破坏点数 | 成本基线表（供 V5 判定与 v5.1.0 输入） |

**破坏点记录模板**（内置于 `upgrade-following.md`）：`dsh 版本 / 观测日期 / 依赖点 id / 期望（快照事实）/ 实际观测 / 影响需求（FR/V）/ 修复动作 / 回归结果 / 遗留风险`。

**4. 本 Feature 不做的（NG-002 边界）**：不做 dsh 版本自动检测、不做升级自动化脚本、不做端到端自动化回归。步骤 0 的「刷新契约」在实施期若仍无法联网，则保持快照基准并显式登记（与 spec 现状一致）。

## 后果

**正面**

- 「破坏点定位」从「重头排查」降为「按清单逐条核对」——这是 FR-007 验收②与 V5 的核心判据。
- 契约依赖点全部集中在 `adapters/dsh`（NFR-001①/②），修复面可控；快照日期双层可见（`manifest.json` + `SKILL.md` frontmatter），时效可追溯（NFR-007①）。
- 成本基线（人时 + 破坏点数）为 v5.1.0 评估「多平台维护成本」提供真实输入（R-006 / Q-011）。

**负面 / 需承担**

- 清单依赖人工维护与人工观测；若维护者跳过步骤 0/5，`snapshotDate` 会失真，清单反而产生**虚假确定性**——文档必须明确「未刷新即不可信」。
- 快照未覆盖的 `profile-bundle` / `command-registration` / `guard-pipeline` 三类依赖点，其 `observableCheck` 只能写「需刷新后补全」，属**已知空白**；不得在文档中把空白表述为已确认。
- 升级跟随未纳入 CI（无 CLI），无法防「忘记回归」——属已登记的验证能力风险（R-004）。

**对下游（tasks）的约束**

- `dsh-contract-manifest.json` 是唯一来源；`docs/dsh/contract-dependencies.md` 由构建生成（禁止手工维护两份）。
- `skill-package.test.ts` 断言：`manifest.json` 含 `dshContractSnapshot` 与非空 `contractManifestHash`；每个 `SKILL.md` 含 `metadata.sddu-contract-snapshot`。
- `docs/dsh/upgrade-following.md` 必须包含可直接复制的破坏点记录模板与步骤 0~6 清单。
