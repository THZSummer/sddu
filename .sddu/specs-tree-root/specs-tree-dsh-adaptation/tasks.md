# 任务分解：DSH 适配

> **文档定位**: SDDU 任务清单 — 将技术方案分解为可并行执行的原子任务，作为 build 阶段的输入  
> **前置依赖**: plan.md（技术方案 v1.0）、spec.md（需求规范 v1.0）、ADR-001~ADR-006（同目录）  
> **创建人**: SDDU Tasks Agent  
> **创建时间**: 2026-09-27  
> **版本**: v1.0  
> **更新人**: SDDU Tasks Agent  
> **更新时间**: 2026-09-27  
> **更新说明**: 初始创建 — 基于 plan.md v1.0（方案 C 分层承载：Skill 包主交付 + 注入式门禁/状态协议片段 + 预留硬通道；文件影响 21 项 = 17 NEW + 4 MODIFY；隔离规则 R-DSH-01~06）与 ADR-001~006，将 dsh 适配分解为 14 个原子任务、4 个执行波次

## 1. 依赖拓扑总览
> 任务依赖关系和执行顺序

```
Wave 1 ─── (无依赖，全部并行：适配层资产与仓库侧脚本)
  TASK-001 [M]  dsh 契约依赖点清单 + 类型化装载校验层（manifest.json + contract.ts）
  TASK-002 [S]  skill-header 片段模板（frontmatter + 来源标识 + 命名/落位约定）
  TASK-003 [S]  gate-protocol 片段模板（DENY/ALLOW + 显式软引导降级声明）
  TASK-004 [S]  state-sync-protocol 片段模板（state.json 权威 + SYNC 记录 + 三方对账）
  TASK-005 [M]  router-command-map.json（11 Skill 清单 + 入口清单 + 别名集 + 拒绝语义）
  TASK-006 [M]  scripts/install-dsh.sh + scripts/uninstall-dsh.sh（rank 100/400 落位与残留校验）

Wave 2 ─── (依赖 Wave 1)
  TASK-007 [S]  src/adapters/dsh/index.ts 适配层公共 API 出口           ← TASK-001
  TASK-008 [L]  scripts/build-dsh-skills.cjs 渲染 dist/dsh/**          ← TASK-001..005, TASK-007

Wave 3 ─── (依赖 TASK-008 的生成物)
  TASK-009 [M]  jest.config.ts @dsh 别名 + skill-package.test.ts 静态断言        ← TASK-008
  TASK-010 [M]  打包集成：package.json + scripts/package.cjs（dist/dsh 同级并列） ← TASK-008
  TASK-011 [M]  docs/dsh/README.md + dual-platform-diff.md + 仓库 README.md 一节 ← TASK-001,005,006
  TASK-012 [S]  docs/dsh/positioning.md + upgrade-following.md                  ← TASK-001
  TASK-013 [M]  docs/dsh/verification.md（V1~V5 验证方法 + 最小人工清单）        ← TASK-003,004,008

Wave 4 ─── (依赖 Wave 3)
  TASK-014 [M]  回归与隔离验证（build / test:core / test:opencode / dist 同级并列） ← TASK-008,009,010

依赖关系（箭头 = 前置）：
  TASK-001 ─┬─▶ TASK-007 ─┐
  TASK-002 ─┤             ├─▶ TASK-008 ─┬─▶ TASK-009 ─┐
  TASK-003 ─┤             │             ├─▶ TASK-010 ─┼─▶ TASK-014
  TASK-004 ─┤             │             └─▶ TASK-013  │
  TASK-005 ─┘             │                            │
  TASK-006 ──▶ TASK-011 ◀─┴─ TASK-001,005              │
  TASK-001 ──▶ TASK-012                                │
  TASK-011,012 ────────────────────────────────────────┘
```

**关键路径**（最长链）：`TASK-001 → TASK-008 → TASK-009 → TASK-014`（契约清单 → 构建脚本 → 静态断言 → 回归门禁）。
**次关键路径**：`TASK-005 → TASK-008 → TASK-010 → TASK-014`（入口清单 → 构建 → 打包 → 回归门禁）。

## 2. 任务列表
> 每个任务的详细定义

### TASK-001: dsh 契约依赖点清单 + 类型化装载校验层
> 把 dsh 全部契约依赖点集中登记为单一来源，并提供构建期校验与哈希锚定能力

| 属性 | 值 |
|------|-----|
| **复杂度** | M |
| **前置依赖** | 无 |
| **执行波次** | 1 |
| **对应 FR** | FR-007、NFR-001、NFR-007（ADR-006） |

**描述**: 新建 `src/adapters/dsh/contract/dsh-contract-manifest.json`，集中登记 dsh 契约依赖点（顶层含 `dshContractSnapshot: "2026-08-14"`，`dependencies[]` 每条含 `id` / `area` / `snapshotDate` / `fact` / `assumption` / `observableCheck` / `breakImpact` / `fixHint` 八个字段），至少覆盖 ADR-006 决策 1 的 7 类：`skill-provider-rank`、`skill-discovery-cache`、`command-registration`（**标注「快照未覆盖 → 已知缺口 / 需 dsh 插件」**）、`profile-bundle`（**标注「快照未覆盖，需刷新后补全」**）、`dir-convention`、`session-events`、`guard-pipeline`（**标注「演进点，本 Feature 不实现，v5.1.0+ 评估」**）。同时新建 `src/adapters/dsh/contract.ts`：导出清单类型定义与装载/校验/哈希函数（`loadContractManifest()` / `validateContractManifest()` / `computeContractManifestHash()`），并**只经域级 index 单向 import** `../../state`（`VALID_PHASES` / `PHASE_ORDER` / `NEXT_PHASE`）做构建期枚举一致性校验；校验失败抛错（非零退出可被构建脚本捕获）。哈希以清单文件字节的 sha256 计算，供 TASK-008 写入 `dist/dsh/manifest.json` 版本锚定。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| NEW | `src/adapters/dsh/contract/dsh-contract-manifest.json` |
| NEW | `src/adapters/dsh/contract.ts` |

**验收标准**:
- [ ] `dsh-contract-manifest.json` 为合法 JSON，顶层含 `dshContractSnapshot = "2026-08-14"`，`dependencies` 数组长度 ≥ 7
- [ ] 每条依赖点含上述 8 个字段且全部 `snapshotDate = "2026-08-14"`
- [ ] `command-registration` 条目标注「已知缺口 / 需 dsh 插件」，`guard-pipeline` 条目标注「演进点 / 本 Feature 不实现」，`profile-bundle` 条目标注「快照未覆盖」
- [ ] `contract.ts` 导出类型 + `loadContractManifest` / `validateContractManifest` / `computeContractManifestHash`，且 `validateContractManifest` 在 phase 枚举不一致时抛错（可被单测注入非法清单验证）
- [ ] `computeContractManifestHash()` 返回值与清单文件 sha256 一致
- [ ] 未修改 `src/state/**`、未修改 `src/shared/**`；未出现 `adapters/dsh → adapters/opencode` 的 import（R-DSH-03）
- [ ] `npx tsc --noEmit` 通过

**验证命令**:
```bash
node -e "const fs=require('fs');const m=JSON.parse(fs.readFileSync('src/adapters/dsh/contract/dsh-contract-manifest.json','utf8'));const req=['id','area','snapshotDate','fact','assumption','observableCheck','breakImpact','fixHint'];if(m.dshContractSnapshot!=='2026-08-14')throw 0;if(m.dependencies.length<7)throw 1;for(const d of m.dependencies){for(const k of req)if(!(k in d))throw 2;if(d.snapshotDate!=='2026-08-14')throw 3}console.log('contract manifest OK',m.dependencies.length)" \
  && npx tsc --noEmit \
  && ! grep -rn "adapters/opencode" src/adapters/dsh/
```

### TASK-002: skill-header 片段模板
> dsh `SKILL.md` 的 frontmatter、来源标识与命名/落位约定（单一来源包装层）

| 属性 | 值 |
|------|-----|
| **复杂度** | S |
| **前置依赖** | 无 |
| **执行波次** | 1 |
| **对应 FR** | FR-001（ADR-001） |

**描述**: 新建 `src/adapters/dsh/templates/skill-header.md.hbs`，作为每个 dsh `SKILL.md` 的头部包装层：YAML frontmatter（`name: <<skillName>>`、`description: <<skillDescription>>`）+ `metadata.sddu-source: adapters/dsh@<<sdduVersion>>#<<contractSnapshot>>` + `metadata.sddu-contract-snapshot: <<contractSnapshot>>`（默认渲染为 `2026-08-14`）；固定段落声明命名约定（`sddu` / `sddu-<phase>` / `sddu-roadmap` / `sddu-docs` / `sddu-fast` 的 `sddu-` 前缀）、主落位（rank 100 `<projectRoot>/.dsh/skills`，用户级 rank 400 `<dshHome>/skills`）、以及「本文件指令正文来自 `src/templates/agents/<sourceTemplate>`，不得在 dsh 侧改写指令语义」（R-DSH-05）。**不得包含任何阶段指令正文**（避免形成第二份人工维护的指令副本）。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| NEW | `src/adapters/dsh/templates/skill-header.md.hbs` |

**验收标准**:
- [ ] 文件存在且非空（≥ 15 行）
- [ ] 含 `name:` / `description:` / `metadata.sddu-source` / `metadata.sddu-contract-snapshot` 四个键
- [ ] 含 Handlebars 占位符 ≥ 4 个（`<<skillName>>`、`<<skillDescription>>`、`<<sdduVersion>>`、`<<contractSnapshot>>`）
- [ ] 含 rank 100 与 rank 400 落位常量表述、`sddu-` 命名前缀约定
- [ ] 含「指令正文来自源模板、禁止改写」的单一来源声明
- [ ] 不含任何阶段职责描述段落（正文一律由构建脚本拼接）

**验证命令**:
```bash
test -s src/adapters/dsh/templates/skill-header.md.hbs \
  && grep -q 'metadata.sddu-source' src/adapters/dsh/templates/skill-header.md.hbs \
  && grep -q 'metadata.sddu-contract-snapshot' src/adapters/dsh/templates/skill-header.md.hbs \
  && grep -q 'rank 100' src/adapters/dsh/templates/skill-header.md.hbs \
  && grep -q 'sddu-' src/adapters/dsh/templates/skill-header.md.hbs \
  && test "$(grep -c '<<' src/adapters/dsh/templates/skill-header.md.hbs)" -ge 4
```

### TASK-003: gate-protocol 片段模板
> 门禁协议：结构化拒绝/放行 + 显式软引导降级声明（FR-004b）

| 属性 | 值 |
|------|-----|
| **复杂度** | S |
| **前置依赖** | 无 |
| **执行波次** | 1 |
| **对应 FR** | FR-004、NFR-003、EC-003、EC-008（ADR-003） |

**描述**: 新建 `src/adapters/dsh/templates/gate-protocol.md.hbs`，注入每个阶段 Skill（及路由 Skill 的前置检查段）。内容必须含：① 四步确定性流程（读 `.sddu/specs-tree-root/<feature>/state.json` 取 `phase` → 相邻性校验 `NEXT_PHASE[current]`（与核心 `PHASE_ORDER` 同源语义）→ 前置产物存在性校验 → 输出结构化结果块）；② 拒绝块 `[SDDU-GATE-DENY] {"feature":"…","from":"…","to":"…","missing":[…],"reason":"…","action":"none"}`，并明确「**不写 `state.json`、不产出阶段产物**」；③ 放行块 `[SDDU-GATE-ALLOW] {"feature":"…","from":"…","to":"…","prereq":"…","action":"proceed"}`；④ 「遇非法跃迁（跳步 / 回退）**必须**按拒绝处理，不得『提示后继续』」；⑤ 固定降级声明段：「⚠️ 已知降级：dsh 侧无可执行的运行时拒绝点，本门禁为模型执行的显式软引导（FR-004b），非硬强制；非法跃迁会输出 `[SDDU-GATE-DENY]` 且不推进，但其约束力来自模型对指令的遵从」；⑥ 落盘失败按 EC-008 报错且不推进。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| NEW | `src/adapters/dsh/templates/gate-protocol.md.hbs` |

**验收标准**:
- [ ] 含 `[SDDU-GATE-DENY]` 与 `[SDDU-GATE-ALLOW]` 两个块标识，且各含完整 JSON 字段示例
- [ ] 拒绝块含 `"action":"none"`，放行块含 `"action":"proceed"`
- [ ] 含相邻性校验步骤与前置产物存在性校验步骤
- [ ] 含 `NEXT_PHASE` / `PHASE_ORDER` 同源语义说明
- [ ] 含固定「已知降级」声明段，且明确标注 `FR-004b` 与「非硬强制」
- [ ] 含「非法跃迁必须拒绝、不得提示后继续」与 EC-008「落盘失败不推进」
- [ ] 「硬强制」一词**仅**出现在 `非硬强制` 否定语境（无肯定式硬强制表述）

**验证命令**:
```bash
test -s src/adapters/dsh/templates/gate-protocol.md.hbs \
  && grep -q 'SDDU-GATE-DENY' src/adapters/dsh/templates/gate-protocol.md.hbs \
  && grep -q 'SDDU-GATE-ALLOW' src/adapters/dsh/templates/gate-protocol.md.hbs \
  && grep -q '"action":"none"' src/adapters/dsh/templates/gate-protocol.md.hbs \
  && grep -q '"action":"proceed"' src/adapters/dsh/templates/gate-protocol.md.hbs \
  && grep -q '已知降级' src/adapters/dsh/templates/gate-protocol.md.hbs \
  && grep -q 'FR-004b' src/adapters/dsh/templates/gate-protocol.md.hbs
```

### TASK-004: state-sync-protocol 片段模板
> 状态协议：`state.json` 唯一权威 + SYNC 记录 + 三方对账规则

| 属性 | 值 |
|------|-----|
| **复杂度** | S |
| **前置依赖** | 无 |
| **执行波次** | 1 |
| **对应 FR** | FR-005、NFR-003、EC-005、EC-008（ADR-004） |

**描述**: 新建 `src/adapters/dsh/templates/state-sync-protocol.md.hbs`，注入每个阶段 Skill。内容必须含：① 权威裁定声明（`state.json` 为唯一权威状态源；dsh `SessionEvent` 日志为**观测与对账源**，非第二权威，SDDU **不写入、不修改**宿主日志）；② 推进协议三步（确认阶段产物已落盘，否则按 EC-008 报错且不推进 → 用文件工具更新 `state.json` 的 `phase` 并**追加**一条 `{phase,status,timestamp,triggeredBy,comment}` 到 `phaseHistory`（与既有 schema 一致）→ 在会话中输出 `[SDDU-STATE-SYNC] {"feature":"…","from":"…","to":"…","artifact":"…","phaseHistoryAdded":true,"ts":"<ISO8601>"}`）；③ 三方对账规则表（① 状态 vs 产物：`phase` 对应产物存在且非空，不一致 → 报告 + 暂停推进；② 状态 vs 记录：每个 phase 推进在会话日志中有对应 SYNC 记录，允许「日志有、state 无」并指出缺失侧，**禁止自动补齐任何一侧**；③ 产物 vs 记录：`artifact` 与磁盘实际产物一致，否则报告并暂停）；④ 明示「SYNC 记录不是机器可校验的强证据，不得表述为运行时断言」；⑤ 明确不新增 append-only 事件日志、不改核心 `src/state/`（NG-004）。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| NEW | `src/adapters/dsh/templates/state-sync-protocol.md.hbs` |

**验收标准**:
- [ ] 含 `[SDDU-STATE-SYNC]` 块标识与完整字段（`feature`/`from`/`to`/`artifact`/`phaseHistoryAdded`/`ts`）
- [ ] 含「`state.json` 为唯一权威」与「会话日志为观测/对账源」的显式裁定
- [ ] 含 `phaseHistory` 追加条目字段（`phase`/`status`/`timestamp`/`triggeredBy`/`comment`）与「与既有 schema 一致」
- [ ] 含三方对账对照（状态 vs 产物 / 状态 vs 记录 / 产物 vs 记录）及「报告而非静默覆盖、禁止自动补齐」处理
- [ ] 含「不写入宿主日志」「不修改核心 `src/state/`」边界声明
- [ ] 含「SYNC 记录非机器可校验强证据」的如实声明

**验证命令**:
```bash
test -s src/adapters/dsh/templates/state-sync-protocol.md.hbs \
  && grep -q 'SDDU-STATE-SYNC' src/adapters/dsh/templates/state-sync-protocol.md.hbs \
  && grep -q 'phaseHistoryAdded' src/adapters/dsh/templates/state-sync-protocol.md.hbs \
  && grep -q 'phaseHistory' src/adapters/dsh/templates/state-sync-protocol.md.hbs \
  && grep -q '唯一权威' src/adapters/dsh/templates/state-sync-protocol.md.hbs \
  && grep -q '对账' src/adapters/dsh/templates/state-sync-protocol.md.hbs
```

### TASK-005: router-command-map.json（Skill 清单 + 入口清单 + 别名集）
> 命令入口与 Skill 编排的唯一来源（FR-001 / FR-002 / FR-002③ 单一来源）

| 属性 | 值 |
|------|-----|
| **复杂度** | M |
| **前置依赖** | 无 |
| **执行波次** | 1 |
| **对应 FR** | FR-001、FR-002（ADR-001 / ADR-002 / ADR-006） |

**描述**: 新建 `src/adapters/dsh/templates/router-command-map.json`，作为① 11 个 Skill 清单、② 入口清单、③ 阶段别名集 的**唯一来源**：
- `skills[]`：11 条（`sddu` + `sddu-discovery|spec|plan|tasks|build|review|validate` + `sddu-roadmap|docs|fast`），每条含 `name` / `sourceTemplate`（指向真实存在的 `src/templates/agents/sddu-*.md.hbs`）/ `phaseTarget`（`null` 表示非阶段 Skill）/ `protocolFragments`（阶段 Skill 注入 `gate-protocol` + `state-sync-protocol`；路由 Skill 注入入口协议段；独立 Skill 按需）。
- `entries[]`：入口清单（与 ADR-002 §2 表一致）——`/sddu`、`/sddu discovery|spec|plan|tasks|build|review|validate <feature>`、`/sddu roadmap`、`/sddu docs <feature>`、`/sddu fast <task>`，各含 `entry` / `targetSkill` / `prerequisite` / `artifact`。
- `phaseAliases{}`：**自包含**别名集（`discovery|discovered→discovered`、`spec→specified`、`plan|planning→planned`、`tasks→tasked`、`build|building|implementing→builded`、`review→reviewed`、`validate|completed→validated`），覆盖 `src/adapters/opencode/plugin.ts` 的 `legacyStatusToPhase` 等价语义；**禁止** import 该文件（R-DSH-03），故别名集与 OpenCode 侧无编译期等价保障 —— 此漂移风险须在 JSON 内以 `_note` 字段显式登记，并在 TASK-009 中断言「别名目标值 ⊆ `VALID_PHASES`」。
- `invalidPhase`: `[SDDU-ROUTE-REJECT] {"input":"<原样输入>","valid":[…],"hint":"<建议>"}` 语义 + 「不进入任何阶段、不写任何文件」。
- `fallbackUsage`：`sddu <phase> <feature>` 与自然语言降级用法（R-009 / 平台级命令需插件的已知缺口标注）。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| NEW | `src/adapters/dsh/templates/router-command-map.json` |

**验收标准**:
- [ ] 合法 JSON；`skills` 长度 = 11，名称与 ADR-001 目录树完全一致
- [ ] 每条 `sourceTemplate` 指向的文件在 `src/templates/agents/` 真实存在
- [ ] `entries` 覆盖 `/sddu` + 7 个阶段 + `roadmap`/`docs`/`fast` 共 11 条入口，字段含前置与产出
- [ ] `phaseAliases` 的目标值全部 ∈ `VALID_PHASES`（`src/state/schema-v3.0.0.ts`）
- [ ] 含 `[SDDU-ROUTE-REJECT]` 语义与「不进入任何阶段」约束
- [ ] 含平台级命令注册的**已知缺口**标注与降级用法，不含平台级命令承诺
- [ ] 含别名集漂移风险的 `_note` 登记；文件内无 `adapters/opencode` 引用

**验证命令**:
```bash
node -e "const fs=require('fs'),p=require('path');const m=JSON.parse(fs.readFileSync('src/adapters/dsh/templates/router-command-map.json','utf8'));if(m.skills.length!==11)throw 0;for(const s of m.skills){if(!fs.existsSync(s.sourceTemplate))throw 1;}const vp=['registered','discovered','specified','planned','tasked','builded','reviewed','validated'];for(const t of Object.values(m.phaseAliases||{})){if(!vp.includes(t))throw 2}if(!m.invalidPhase||!m.invalidPhase.includes('SDDU-ROUTE-REJECT'))throw 3;console.log('command map OK')" \
  && ! grep -q 'adapters/opencode' src/adapters/dsh/templates/router-command-map.json
```

### TASK-006: 安装 / 卸载脚本（rank 100 主落位 + 残留校验）
> `scripts/install-dsh.sh` + `scripts/uninstall-dsh.sh`（仓库侧脚本，不经 dsh 运行）

| 属性 | 值 |
|------|-----|
| **复杂度** | M |
| **前置依赖** | 无 |
| **执行波次** | 1 |
| **对应 FR** | FR-008、EC-002、EC-004、EC-007（ADR-001） |

**描述**: 新建两个 POSIX shell 脚本（`set -euo pipefail`）：
- `scripts/install-dsh.sh`：默认**项目级主落位 rank 100** `<projectRoot>/.dsh/skills`（`--project-root <path>` 可覆盖），`--scope user` → **用户级 rank 400** `<dshHome>/skills`（`--dsh-home <path>` 可覆盖）；`--source <dist/dsh/skills 或包内路径>`、`--yes`、`--help`；从 `dist/dsh/skills/` 拷贝全部 `sddu-*` Skill 目录（共 11 个，缺失即报错退出）；安装前后输出**落位自检清单**（目标绝对路径 / 命中 rank / 本次落位条目数 / 检测到的同名或近义 `sddu-*` 条目 → **EC-002 显式提示冲突，不得静默遮蔽** / `skills/change` 事件与发现缓存重新快照提示 → **EC-004**）；输出 V1 自检指引（指向 `docs/dsh/verification.md`）；重复执行为幂等覆盖并给出提示。
- `scripts/uninstall-dsh.sh`：按 `sddu-*` 前缀清理（`--scope` 与 install 对称、`--dry-run` 可选）+ **残留校验二次扫描**并输出结果（仍有残留则非零退出），不误删非 `sddu-*` 条目。
- 两脚本均**不得修改** `install.sh` / `install.ps1`（R-DSH-04），不得依赖 dsh CLI（NFR-006 / 「dsh 无 CLI」口径）。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| NEW | `scripts/install-dsh.sh` |
| NEW | `scripts/uninstall-dsh.sh` |

**验收标准**:
- [ ] `bash -n` 语法检查两脚本均通过；`--help` 退出码 0 且不产生任何落位副作用
- [ ] 两脚本均含 rank 100 与 rank 400 及对应根目录常量（`.dsh/skills` / `dshHome/skills`）
- [ ] install 输出含同名/近义冲突提示段与 `skills/change` 失效提示段（EC-002 / EC-004）
- [ ] uninstall 输出含残留校验结果；按 `sddu-*` 前缀匹配，无通配误删风险
- [ ] 脚本不含 `dsh ` 子命令调用（不依赖 dsh CLI）
- [ ] `install.sh` / `install.ps1` / `src/index.ts` 零改动

**验证命令**:
```bash
bash -n scripts/install-dsh.sh && bash -n scripts/uninstall-dsh.sh \
  && bash scripts/install-dsh.sh --help >/dev/null \
  && bash scripts/uninstall-dsh.sh --help >/dev/null \
  && grep -q 'rank 100' scripts/install-dsh.sh \
  && grep -q 'skills/change' scripts/install-dsh.sh \
  && test -z "$(git status --porcelain -- install.sh install.ps1 src/index.ts)"
```

### TASK-007: dsh 适配层公共 API 出口
> `src/adapters/dsh/index.ts`：导出契约清单能力与命名/落位常量

| 属性 | 值 |
|------|-----|
| **复杂度** | S |
| **前置依赖** | TASK-001 |
| **执行波次** | 2 |
| **对应 FR** | FR-009（ADR-005） |

**描述**: 新建 `src/adapters/dsh/index.ts`，作为适配层公共出口：re-export `contract.ts` 的类型与函数（`loadContractManifest` / `validateContractManifest` / `computeContractManifestHash`），并导出命名与落位常量（`SKILL_PREFIX = 'sddu-'`、`DEFAULT_RANK = 100`、`USER_RANK = 400`、`CONTRACT_SNAPSHOT = '2026-08-14'`、`ROUTER_SKILL_NAME = 'sddu'`、`SKILL_NAMES`），供构建脚本（TASK-008）与静态测试（TASK-009）复用，避免常量在多处硬编码漂移（ADR-001「同源表达」）。**不得**修改 `src/index.ts` 顶层薄桶（R-DSH-04），即 dsh 概念不进顶层公共 API。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| NEW | `src/adapters/dsh/index.ts` |

**验收标准**:
- [ ] 导出 ≥ 5 个符号，含 `DEFAULT_RANK = 100`、`USER_RANK = 400`、`CONTRACT_SNAPSHOT = '2026-08-14'`、`SKILL_PREFIX = 'sddu-'`
- [ ] `SKILL_NAMES` 与 `router-command-map.json` 的 11 个名称一致（可由 TASK-009 断言）
- [ ] 不 import `adapters/opencode`、不 import `src/shared` 以外核心域之外的平台概念
- [ ] `src/index.ts` 零改动；`npx tsc --noEmit` 通过

**验证命令**:
```bash
npx tsc --noEmit \
  && grep -q 'DEFAULT_RANK' src/adapters/dsh/index.ts \
  && grep -q 'USER_RANK' src/adapters/dsh/index.ts \
  && grep -q "2026-08-14" src/adapters/dsh/index.ts \
  && test -z "$(git status --porcelain -- src/index.ts)" \
  && ! grep -q 'adapters/opencode' src/adapters/dsh/index.ts
```

### TASK-008: dsh Skill 构建脚本（渲染 `dist/dsh/**`）
> 把 Agent 模板 + dsh 协议片段渲染为 11 个 `SKILL.md` + `manifest.json` + 人读契约清单

| 属性 | 值 |
|------|-----|
| **复杂度** | L |
| **前置依赖** | TASK-001、TASK-002、TASK-003、TASK-004、TASK-005、TASK-007 |
| **执行波次** | 2 |
| **对应 FR** | FR-001、FR-003、FR-007、NFR-002、NFR-007（ADR-005 / ADR-006） |

**描述**: 新建 `scripts/build-dsh-skills.cjs`（CommonJS，与既有 `scripts/build-agents.cjs` 风格一致），执行期行为：
1. 读取 `src/adapters/dsh/templates/router-command-map.json` 的 11 Skill 清单（唯一来源，不硬编码清单）。
2. **只读**引用 `src/templates/agents/sddu-*.md.hbs` 的指令正文（**占位符原样保留**，由模型运行期填充），与 `skill-header.md.hbs`、`gate-protocol.md.hbs`、`state-sync-protocol.md.hbs` 及入口协议段**拼接**为 `dist/dsh/skills/<skill>/SKILL.md` —— 阶段 Skill 注入 gate + state-sync，路由 Skill `sddu` 注入入口识别/拒绝格式/降级用法三段，独立 Skill 按清单 `protocolFragments` 配置；**禁止改写指令语义、禁止在 `src/adapters/dsh/` 内复制指令正文**（R-DSH-05 / NFR-002）。
3. 生成 `dist/dsh/manifest.json`：`sdduVersion`（取自 `package.json` 的 `version`）、`dshContractSnapshot`（清单值 `2026-08-14`）、`contractManifestHash`（清单文件 sha256）、`generatedAt`（ISO8601）、`skills[]`。
4. 从 manifest **单一来源**渲染人读版 `docs/dsh/contract-dependencies.md`（**禁止手工维护第二份**，ADR-006）。
5. 拷贝 `docs/dsh/*.md` → `dist/dsh/docs/`（仅拷贝已存在的文档，TASK-011~013 产出前允许缺失并记 warning）。
6. 构建期校验并**非零退出**：11 个 Skill 目录齐全、阶段指令正文非空、入口 `phaseTarget` 与 `../../state` 的 `VALID_PHASES` 一致、清单哈希可计算；对 `src/templates/agents/**` **零写操作**。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| NEW | `scripts/build-dsh-skills.cjs` |
| NEW（生成物） | `dist/dsh/skills/sddu-*/SKILL.md`（11 个，gitignored） |
| NEW（生成物） | `dist/dsh/manifest.json`、`dist/dsh/docs/*`（gitignored） |
| NEW（生成物） | `docs/dsh/contract-dependencies.md`（由 manifest 渲染） |

**验收标准**:
- [ ] `node scripts/build-dsh-skills.cjs` 退出码 0，重复运行幂等（除 `generatedAt` 外产物一致）
- [ ] `dist/dsh/skills/` 下恰有 11 个 `sddu-*` 目录，每个目录内 `SKILL.md` 非空
- [ ] 每个阶段 `SKILL.md` 同时含源模板正文抽样特征串 + `[SDDU-GATE-DENY]` + `[SDDU-GATE-ALLOW]` + `[SDDU-STATE-SYNC]`
- [ ] 路由 Skill `sddu` 的 `SKILL.md` 含入口识别规则、`[SDDU-ROUTE-REJECT]` 格式与降级用法三段
- [ ] `manifest.json` 的 `sdduVersion` = `package.json.version`、`dshContractSnapshot = "2026-08-14"`、`contractManifestHash` 非空且等于清单 sha256、`skills` 长度 11
- [ ] `docs/dsh/contract-dependencies.md` 条目与 manifest 依赖点一一对应
- [ ] 脚本对 `src/templates/agents/**` 无写操作（运行前后 `git status` 该路径无变化）
- [ ] 构建失败路径有效：缺失模板 / 非法 `phaseTarget` 时以非零退出并打印可定位错误

**验证命令**:
```bash
node scripts/build-dsh-skills.cjs \
  && test "$(ls -d dist/dsh/skills/sddu-* 2>/dev/null | wc -l)" = "11" \
  && node -e "const fs=require('fs'),c=require('crypto');const h=c.createHash('sha256').update(fs.readFileSync('src/adapters/dsh/contract/dsh-contract-manifest.json')).digest('hex');const m=JSON.parse(fs.readFileSync('dist/dsh/manifest.json','utf8'));const p=JSON.parse(fs.readFileSync('package.json','utf8'));if(m.sdduVersion!==p.version)throw 0;if(m.dshContractSnapshot!=='2026-08-14')throw 1;if(m.contractManifestHash!==h)throw 2;if(m.skills.length!==11)throw 3;console.log('manifest OK')" \
  && grep -q 'SDDU-GATE-DENY' dist/dsh/skills/sddu-discovery/SKILL.md \
  && grep -q 'SDDU-STATE-SYNC' dist/dsh/skills/sddu-plan/SKILL.md \
  && grep -q 'SDDU-ROUTE-REJECT' dist/dsh/skills/sddu/SKILL.md \
  && test -z "$(git status --porcelain -- src/templates/agents)"
```

### TASK-009: jest 别名 + 生成物静态断言测试
> `skill-package.test.ts`：断言生成物结构/协议/隔离，覆盖 R-DSH-01/02/04/05

| 属性 | 值 |
|------|-----|
| **复杂度** | M |
| **前置依赖** | TASK-008 |
| **执行波次** | 3 |
| **对应 FR** | FR-001、FR-002、FR-004、FR-005、FR-007、FR-009、NFR-002、NFR-004（ADR-003/004/005/006） |

**描述**: ① MODIFY `jest.config.ts`：在 `moduleNameMapper` 追加 `'^@dsh/(.*)$': '<rootDir>/src/adapters/dsh/$1'`（与 `@opencode` 对称，追加式改动；`opencode` 项目的 `testMatch` 已覆盖 `src/__tests__/unit/adapters/**`，无需改项目划分）。② NEW `src/__tests__/unit/adapters/dsh/skill-package.test.ts`，对**生成物做静态断言**（`beforeAll` 若 `dist/dsh/skills` 不存在则执行 `node scripts/build-dsh-skills.cjs`；**不冒充实机验证**，NG-002）：
1. 11 个 `sddu-*` Skill 目录齐全、命名带前缀、`SKILL.md` 非空（FR-001①）
2. 入口清单完整性：`router-command-map.json` 的 11 条 `skills` ↔ 生成目录一一对应；`entries[].targetSkill` 均存在；`phaseAliases` 目标值 ⊆ `VALID_PHASES`；`src/adapters/dsh/index.ts` 的 `SKILL_NAMES` 与清单一致（FR-002③ 防漂移）
3. 协议片段存在性：每个阶段 `SKILL.md` 含 `[SDDU-GATE-DENY]` / `[SDDU-GATE-ALLOW]` / `[SDDU-STATE-SYNC]` 与「已知降级」声明段（FR-004② / ADR-003）
4. 禁用语断言：全量生成物中「硬强制」**仅**出现在 `非硬强制` 语境；不出现 `强制执行` / `运行时硬拒绝`（EC-003）
5. 单一来源：每个生成物含其 `sourceTemplate` 正文的抽样特征串（R-DSH-05）
6. 版本锚定：`manifest.json` 含 `dshContractSnapshot` 与非空 `contractManifestHash`（等于清单 sha256）；每个 `SKILL.md` frontmatter 含 `metadata.sddu-contract-snapshot`（ADR-006）
7. 隔离断言：扫描 `src/` 排除 `src/adapters/dsh/`、`src/__tests__/` 后，无 `dsh` / `rank` / `.dsh/skills` 命中；`src/index.ts` 无 dsh 导出（R-DSH-01/02）
8. 不污染 OpenCode 链路：`install.sh` / `install.ps1` / `src/adapters/opencode/**` 未被 dsh 变更触碰（存在性 + 内容特征断言，R-DSH-04）

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| MODIFY | `jest.config.ts`（追加 `@dsh` 别名，不改既有映射） |
| NEW | `src/__tests__/unit/adapters/dsh/skill-package.test.ts` |

**验收标准**:
- [ ] `npx jest --config jest.config.ts --selectProjects opencode --testPathPattern adapters/dsh` 全绿
- [ ] 上述 8 组断言全部实装（≥ 8 个 `test`/`it` 用例），且失败信息可定位文件
- [ ] `jest.config.ts` 改动为纯追加（既有 `@opencode`/`@state` 等映射与三项目结构不变）
- [ ] 未修改任何既有测试文件（`git status` 中 `src/__tests__` 仅新增该文件）
- [ ] 测试不依赖 dsh CLI、不访问网络、不改写 `dist/` 之外的文件

**验证命令**:
```bash
npx jest --config jest.config.ts --selectProjects opencode --testPathPattern adapters/dsh \
  && grep -q "'\^@dsh/" jest.config.ts \
  && node -e "const fs=require('fs');const t=fs.readFileSync('src/__tests__/unit/adapters/dsh/skill-package.test.ts','utf8');const n=(t.match(/\b(it|test)\(/g)||[]).length;if(n<8)throw 0;console.log('assertions',n)"
```

### TASK-010: 打包集成（`dist/dsh` 与 `dist/sddu` 同级并列）
> `package.json` + `scripts/package.cjs` 追加式改动，保证 dsh 产物不被清理

| 属性 | 值 |
|------|-----|
| **复杂度** | M |
| **前置依赖** | TASK-008 |
| **执行波次** | 3 |
| **对应 FR** | FR-009、NFR-004（plan §2.1 / §6 R-010；ADR-005 决策 4） |

**描述**: ① MODIFY `package.json`（**追加式**）：`scripts` 新增 `"build:dsh": "node scripts/build-dsh-skills.cjs"`；`build` 管道追加 `&& npm run build:dsh`；`files` 追加 `"dist/dsh/**/*"`（既有条目与顺序不动）。② MODIFY `scripts/package.cjs`（**追加式**）：`itemsToKeep` 增加 `'dsh'`（否则打包清理阶段会删除 `dist/dsh/`）；确保 `dist/dsh/` 与 `dist/sddu/` 并列存在且互不包含；`dist/sddu.zip` 内容仍只含 `sddu` 产物、不含 `dsh/`；不改 `dist/sddu/` 路径、不改 OpenCode 产物行为。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| MODIFY | `package.json` |
| MODIFY | `scripts/package.cjs` |

**验收标准**:
- [ ] `npm run build` 依次完成 `build:agents`、`build:ts`、`build:dsh`，退出码 0
- [ ] `npm run build` 后 `dist/dsh/skills/sddu-*/SKILL.md`（11 个）与 `dist/sddu/` **同级并列**存在
- [ ] `node scripts/package.cjs` 后 `dist/dsh/` 与 `dist/sddu/` 均仍存在（未被清理阶段删除）
- [ ] `dist/sddu.zip` 内**不含** `dsh/` 条目（补丁不外溢到 OpenCode 分发）
- [ ] `git diff` 显示 `package.json` / `scripts/package.cjs` 仅新增行（无删除/改写既有键值）
- [ ] `npm run build && npm run test:core && npm run test:opencode` 全绿（R-010 门禁）

**验证命令**:
```bash
npm run build && node scripts/package.cjs \
  && test -d dist/dsh && test -d dist/sddu && test -d dist/dsh/skills \
  && test "$(ls -d dist/dsh/skills/sddu-* | wc -l)" = "11" \
  && test "$(unzip -l dist/sddu.zip | grep -c 'dsh/')" = "0" \
  && test "$(git diff --numstat -- package.json scripts/package.cjs | awk '{s+=$2} END {print s+0}')" = "0"
```

### TASK-011: 交付总览文档（README + 双平台差异清单）
> `docs/dsh/README.md` + `docs/dsh/dual-platform-diff.md` + 仓库 `README.md` 追加入口一节

| 属性 | 值 |
|------|-----|
| **复杂度** | M |
| **前置依赖** | TASK-001、TASK-005、TASK-006 |
| **执行波次** | 3 |
| **对应 FR** | FR-001③、FR-002③、FR-008、NFR-002、NFR-007、EC-002、EC-004（ADR-001 / ADR-002） |

**描述**: ① NEW `docs/dsh/README.md`（面向无 SDDU 背景的 dsh 用户）：交付物总览（11 Skill / `manifest.json` / docs）；安装（推荐项目级 rank 100、可选用户级 rank 400，含 `install-dsh.sh` 用法）/ 卸载 / 升级三条路径；**三层目录 ↔ 六级 rank 落位推演表**（与 ADR-001 §2 一致，含 rank 200/300/500/600 的取舍说明）；**入口清单表**（与 `router-command-map.json` 一致，含 `/sddu` 与各阶段入口、降级用法 `sddu <phase> <feature>`、`[SDDU-ROUTE-REJECT]` 说明，并标注「命令由指令约定承载、平台级注册需 dsh 插件」的已知缺口）；已知降级声明段（门禁 FR-004b）；冲突/残留提示（EC-002 / EC-004，`skills/change` 重新快照）;时效声明（全部 dsh 事实 = **2026-08-14 快照态**，NFR-007）。② NEW `docs/dsh/dual-platform-diff.md`：OpenCode vs dsh 五维差异表（**入口 / 承载 / 门禁 / 状态 / 落位**）+ 随版本核对说明 + 「能力落差不得表述为两平台等价」声明（NFR-002②）。③ MODIFY 仓库 `README.md`：**仅追加**「dsh 适配」一节并指向 `docs/dsh/*`，不改既有 OpenCode 说明主体（R-DSH-06）。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| NEW | `docs/dsh/README.md` |
| NEW | `docs/dsh/dual-platform-diff.md` |
| MODIFY | `README.md`（追加一节） |

**验收标准**:
- [ ] `docs/dsh/README.md` 含落位推演表（三层目录 ↔ 六级 rank）与入口清单表；入口条目与 `router-command-map.json` 的 11 条一致（可由 TASK-009 或构建生成保证）
- [ ] 含安装/卸载/升级三条路径与 `install-dsh.sh` / `uninstall-dsh.sh` 用法
- [ ] 含「已知降级（FR-004b）」声明段与「平台级命令需插件」已知缺口声明
- [ ] 含 `2026-08-14` 快照日期与「快照态、非当前事实」时效声明
- [ ] `dual-platform-diff.md` 含 5 个维度（入口/承载/门禁/状态/落位）与核对说明
- [ ] 仓库 `README.md` `git diff` 为纯追加（删除行数 = 0）

**验证命令**:
```bash
test -s docs/dsh/README.md && test -s docs/dsh/dual-platform-diff.md \
  && grep -q 'rank 100' docs/dsh/README.md \
  && grep -q '2026-08-14' docs/dsh/README.md \
  && grep -q 'FR-004b' docs/dsh/README.md \
  && grep -q 'SDDU-ROUTE-REJECT' docs/dsh/README.md \
  && test "$(grep -cE '入口|承载|门禁|状态|落位' docs/dsh/dual-platform-diff.md)" -ge 5 \
  && test "$(git diff --numstat -- README.md | awk '{print $2+0}')" = "0"
```

### TASK-012: 定位说明 + 升级跟随清单
> `docs/dsh/positioning.md`（FR-010）+ `docs/dsh/upgrade-following.md`（FR-007）

| 属性 | 值 |
|------|-----|
| **复杂度** | S |
| **前置依赖** | TASK-001 |
| **执行波次** | 3 |
| **对应 FR** | FR-010、FR-007、NFR-005、NFR-007、EC-001、EC-009（ADR-006） |

**描述**: ① NEW `docs/dsh/positioning.md`：SDDU 阶段方法论 ↔ dsh 原生 plan mode / todo / workflow / goal / compaction 的分工与共存方式，给出 **≥ 3 个判定示例**（分别覆盖「走 SDDU 阶段」「走 dsh 原生能力」「两者共存」），并给同一会话混用时的可观测提示与建议（EC-009）。② NEW `docs/dsh/upgrade-following.md`：**步骤 0~6 清单**（步骤 0「刷新 dsh 契约」含「刷新失败则如实记录」；步骤 1 记录 dsh 版本 + `manifest.json` 快照日期；步骤 2 逐条走 `dsh-contract-manifest.json` 的 `observableCheck` 并标注 未变/已变/无法观测；步骤 3 重复 V1→V2→V3；步骤 4 定位破坏点→记录模板→修复→复跑；步骤 5 更新清单并 bump `snapshotDate`；步骤 6 形成成本基线）；**可直接复制的破坏点记录模板**（9 字段：dsh 版本 / 观测日期 / 依赖点 id / 期望（快照事实）/ 实际观测 / 影响需求（FR/V）/ 修复动作 / 回归结果 / 遗留风险）；成本基线口径表；「未刷新即不可信」声明；`guard-pipeline` 硬通道标注为 **v5.1.0+ 演进点，本 Feature 不实现**；全程不依赖 CLI（NFR-005 / NG-002）。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| NEW | `docs/dsh/positioning.md` |
| NEW | `docs/dsh/upgrade-following.md` |

**验收标准**:
- [ ] `positioning.md` 含 ≥ 3 个判定示例，且分别标注「走 SDDU / 走原生 / 共存」
- [ ] 含与 dsh 原生 plan mode / todo / workflow / goal / compaction 的分工说明
- [ ] `upgrade-following.md` 含步骤 0~6 全部小节，且含可直接复制的破坏点记录模板（9 字段齐备）
- [ ] 含「未刷新即不可信」声明与 `v5.1.0+` 硬 guard 演进点标注
- [ ] 两文档不含肯定式「硬强制 / 强制执行」表述（EC-003 一致性）

**验证命令**:
```bash
test -s docs/dsh/positioning.md && test -s docs/dsh/upgrade-following.md \
  && test "$(grep -cE '示例[0-9]|判定示例' docs/dsh/positioning.md)" -ge 3 \
  && grep -q 'plan mode' docs/dsh/positioning.md \
  && grep -q '破坏点记录模板' docs/dsh/upgrade-following.md \
  && grep -q 'v5.1.0' docs/dsh/upgrade-following.md \
  && for s in 0 1 2 3 4 5 6; do grep -qE "步骤 ?$s|^\| ?$s ?\|" docs/dsh/upgrade-following.md; done
```

### TASK-013: 验证方法文档（V1~V5 + 最小人工验证清单）
> `docs/dsh/verification.md`：验证方法 + 场景清单 + 人工观测指引（**非端到端验收**）

| 属性 | 值 |
|------|-----|
| **复杂度** | M |
| **前置依赖** | TASK-003、TASK-004、TASK-008 |
| **执行波次** | 3 |
| **对应 FR** | FR-006、NFR-005、NFR-006、EC-006（ADR-003 / ADR-004） |

**描述**: 新建 `docs/dsh/verification.md`（**不排端到端自动验证任务** —— NG-002：只交付「如何验证 + 验证场景 + 人工观测指引」）：
- **性质声明**（置顶）：V1~V5 是**验证方法和场景**、**不是端到端验收标准**；端到端验证不在本 Feature 实施范围，执行由用户配合人工完成。
- **观测依据**：① dsh Web UI 会话内容；② `.sddu/` 产物文件；③ dsh 侧会话事件日志（`SessionEvent` 可回放）。
- **V1~V5 逐项**（与 spec 附录表一致）：每项写「步骤 / 观测方式（Web UI，无 CLI）/ 通过判据 / 配合方」；V3 额外含 **`state.json` ⟷ 产物 ⟷ `[SDDU-STATE-SYNC]` 记录的三方对账步骤与判据**（ADR-004 §3）；V4 含**双判据**（观测到 `[SDDU-GATE-DENY]` 拒绝块 **且** 文档/会话含「已知降级」声明）。
- **最小人工验证清单**：最小步骤序列 + 可接受**时间预算上限** + 不依赖命令行（NFR-005）。
- **缺口声明**：显式声明「无 CLI → 无法自动化断言」，不将「未观测」等同于「通过」（EC-006）；本地 `jest` 只断言**生成物静态结构**、不冒充实机验证；保留「若后续核实 dsh 存在 CLI，可把部分场景转为脚本断言」的说明（开放问题 3 张力，如实记录）。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| NEW | `docs/dsh/verification.md` |

**验收标准**:
- [ ] 含 V1~V5 五个小节，每节均含「步骤 / 观测方式 / 通过判据 / 配合方」四项
- [ ] 含「不是端到端验收标准」性质声明与「端到端验证不在实施范围」声明
- [ ] V3 含三方对账步骤与判据；V4 含拒绝块 + 降级声明双判据
- [ ] 含「无法自动化断言 / 不将未观测等同通过」缺口声明与时间预算上限
- [ ] 全文不以命令行作为必要前置；仅将本地 jest 描述为生成物静态断言

**验证命令**:
```bash
test -s docs/dsh/verification.md \
  && for v in V1 V2 V3 V4 V5; do grep -q "$v" docs/dsh/verification.md; done \
  && grep -q '不是端到端验收标准' docs/dsh/verification.md \
  && grep -q '无法自动化断言' docs/dsh/verification.md \
  && grep -q '时间预算' docs/dsh/verification.md \
  && grep -q '对账' docs/dsh/verification.md \
  && grep -q 'SDDU-GATE-DENY' docs/dsh/verification.md
```

### TASK-014: 回归与隔离验证
> 全链门禁：构建 / 打包 / 既有测试全绿 + OpenCode 链路零污染断言

| 属性 | 值 |
|------|-----|
| **复杂度** | M |
| **前置依赖** | TASK-008、TASK-009、TASK-010 |
| **执行波次** | 4 |
| **对应 FR** | FR-009、NFR-004（plan §6 R-010；ADR-005 决策 4） |

**描述**: 执行一次全链回归并留下可核对记录（**不执行 dsh 端到端验证**，NG-002）：`npm run build`（含 `build:dsh`）→ `npm run test:core` → `npm run test:opencode` → `node scripts/package.cjs`；断言 ① `dist/dsh/` 与 `dist/sddu/` **同级并列**存在且 `dist/sddu.zip` 不含 `dsh/`；② plan §5 的 21 项文件影响全部落地（17 NEW 存在，`docs/dsh/contract-dependencies.md` 由构建生成；4 MODIFY 为纯追加式 diff）；③ 零改动白名单：`install.sh` / `install.ps1` / `src/index.ts` / `src/adapters/opencode/**` / `src/state/**` / `src/templates/agents/**` 无改动；④ 核心域无 dsh 概念泄漏（排除 `src/adapters/dsh/`、`src/__tests__/`）。产出回归结论时**必须把「未观测项（dsh 实机 V1~V5）」与「已通过项」分开记录，不得把未观测表述为通过**（EC-006）。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| MODIFY | `.sddu/specs-tree-root/specs-tree-dsh-adaptation/tasks.md`（追加回归记录小节） |

> 说明：本任务不修改任何 `src/` / `scripts/` 业务文件；若回归失败，修复回到对应前置任务（TASK-008/009/010）执行，不在本任务内改代码。

**验收标准**:
- [ ] `npm run build`、`npm run test:core`、`npm run test:opencode`、`node scripts/package.cjs` 四条命令全绿
- [ ] `dist/dsh/` 与 `dist/sddu/` 同级并列存在；`dist/sddu.zip` 无 `dsh/` 条目
- [ ] 17 NEW 文件全部存在（含构建生成的 `docs/dsh/contract-dependencies.md`）；4 MODIFY 为纯追加
- [ ] 零改动白名单断言通过（`git status --porcelain` 过滤未跟踪后仅剩 4 个 MODIFY 源文件 + `README.md` 追加）
- [ ] 核心域泄漏扫描（`dsh|rank|\.dsh/skills`）在排除 dsh 资产与测试后命中数为 0
- [ ] 回归记录中「未观测项（dsh 实机 V1~V5）」与「已通过项」分列，未观测项明确标注为「待用户配合验证」

**验证命令**:
```bash
npm run build && npm run test:core && npm run test:opencode && node scripts/package.cjs \
  && test -d dist/dsh && test -d dist/sddu && test -d dist/dsh/skills \
  && test "$(unzip -l dist/sddu.zip | grep -c 'dsh/')" = "0" \
  && test -s docs/dsh/contract-dependencies.md \
  && test "$(git status --porcelain -- src install.sh install.ps1 package.json jest.config.ts README.md scripts | grep -vc '^??')" = "4" \
  && test "$(grep -rEl 'dsh|\.dsh/skills' src --include='*.ts' | grep -v '^src/adapters/dsh/' | grep -v '^src/__tests__/' | wc -l)" = "0"
```

> 上述命令中的 `4` 对应 4 个 MODIFY 源文件（`package.json`、`scripts/package.cjs`、`jest.config.ts`、`README.md`）；`docs/dsh/contract-dependencies.md` 为构建生成物、`scripts/*dsh*` 为新增未跟踪文件，均在断言口径中显式排除。

## 3. 任务汇总
> 任务数量、复杂度和波次的统计总览

| 统计项 | 数值 |
|--------|:--:|
| 总任务数 | 14 |
| S 级 (简单) | 5 |
| M 级 (中等) | 8 |
| L 级 (复杂) | 1 |
| 执行波次 | 4 |

### 3.1 需求覆盖矩阵（FR / NFR / V 场景 → 任务）

| 需求 | 覆盖任务 |
|------|---------|
| FR-001 | TASK-002, TASK-005, TASK-008, TASK-009, TASK-011 |
| FR-002 | TASK-005, TASK-008, TASK-009, TASK-011 |
| FR-003 | TASK-008 |
| FR-004 | TASK-003, TASK-009, TASK-011, TASK-013 |
| FR-005 | TASK-004, TASK-009, TASK-013 |
| FR-006 | TASK-013 |
| FR-007 | TASK-001, TASK-008, TASK-009, TASK-012 |
| FR-008 | TASK-006, TASK-011 |
| FR-009 | TASK-007, TASK-009, TASK-010, TASK-014 |
| FR-010 | TASK-012 |
| NFR-001 / NFR-007 | TASK-001, TASK-008, TASK-011, TASK-012 |
| NFR-002 | TASK-008, TASK-009, TASK-011 |
| NFR-003 | TASK-003, TASK-004 |
| NFR-004 | TASK-009, TASK-010, TASK-014 |
| NFR-005 / NFR-006 | TASK-006, TASK-012, TASK-013 |
| V1 / V2 | TASK-011, TASK-013（方法文档）；实机执行 = 用户配合（NG-002） |
| V3 / V4 | TASK-004, TASK-013（含三方对账与双判据）；实机执行 = 用户配合（NG-002） |
| V5 | TASK-012（清单与模板）, TASK-013（场景）；实机执行 = 用户配合（NG-002） |
| R-DSH-01~06（隔离规则） | TASK-007, TASK-009, TASK-010, TASK-014 |

## 4. 执行策略
> 各波次的执行说明

| 波次 | 任务 | 策略 |
|:--:|------|------|
| 1 | TASK-001, TASK-002, TASK-003, TASK-004, TASK-005, TASK-006 | **全部并行**（6 个资产/脚本彼此无依赖；TASK-002~004 均为 S 级可直接批量执行） |
| 2 | TASK-007, TASK-008 | TASK-007 可先并行启动；TASK-008 需 Wave 1 全部资产就绪后执行（L 级，建议单会话专注执行） |
| 3 | TASK-009, TASK-010, TASK-011, TASK-012, TASK-013 | **并行执行**（均只依赖 TASK-008 生成物或 Wave 1 清单/脚本；两类产物互不冲突） |
| 4 | TASK-014 | **串行收口**（回归门禁；失败则回到 TASK-008/009/010 修复后重跑，不在本任务改代码） |

### 4.1 plan §5 文件影响映射（21 项 = 17 NEW + 4 MODIFY）

| plan 文件影响 | 操作 | 任务 |
|------|:--:|:--:|
| `src/adapters/dsh/index.ts` | NEW | TASK-007 |
| `src/adapters/dsh/contract.ts` | NEW | TASK-001 |
| `src/adapters/dsh/contract/dsh-contract-manifest.json` | NEW | TASK-001 |
| `src/adapters/dsh/templates/skill-header.md.hbs` | NEW | TASK-002 |
| `src/adapters/dsh/templates/gate-protocol.md.hbs` | NEW | TASK-003 |
| `src/adapters/dsh/templates/state-sync-protocol.md.hbs` | NEW | TASK-004 |
| `src/adapters/dsh/templates/router-command-map.json` | NEW | TASK-005 |
| `scripts/build-dsh-skills.cjs` | NEW | TASK-008 |
| `scripts/install-dsh.sh` | NEW | TASK-006 |
| `scripts/uninstall-dsh.sh` | NEW | TASK-006 |
| `src/__tests__/unit/adapters/dsh/skill-package.test.ts` | NEW | TASK-009 |
| `docs/dsh/README.md` | NEW | TASK-011 |
| `docs/dsh/dual-platform-diff.md` | NEW | TASK-011 |
| `docs/dsh/verification.md` | NEW | TASK-013 |
| `docs/dsh/positioning.md` | NEW | TASK-012 |
| `docs/dsh/upgrade-following.md` | NEW | TASK-012 |
| `docs/dsh/contract-dependencies.md` | NEW（构建生成） | TASK-008（生成）/ TASK-014（存在性断言） |
| `package.json` | MODIFY | TASK-010 |
| `scripts/package.cjs` | MODIFY | TASK-010 |
| `jest.config.ts` | MODIFY | TASK-009 |
| `README.md` | MODIFY | TASK-011 |

> 计数核对：17 NEW + 4 MODIFY + 0 DELETE = **21 项**，与 plan §5 一致。

### 4.2 关键路径与并行决策

1. **关键路径**：`TASK-001 → TASK-008 → TASK-009 → TASK-014`。TASK-008（构建脚本）是全局瓶颈 —— 所有生成物断言、打包、文档校验都以其产物为前提，建议优先达成 Wave 1 全部资产后就单会话推进。
2. **Wave 1 最大化并行**：3 个协议片段（TASK-002/003/004）为纯文本 S 级任务、分属不同文件，可批量并发；TASK-001/005 虽为 M 级但相互独立（后者不依赖清单装载层）。
3. **TASK-006 提前启动的收益**：安装/卸载脚本无资产依赖（只约定 `dist/dsh/skills/` 与 rank 常量），放进 Wave 1 使文档任务 TASK-011 不必等待构建即可并行。
4. **TASK-013 不排端到端自动验证任务**：按 spec 既定约束（NG-002）与用户指令，V1~V5 只落为「方法文档 + 场景清单 + 人工观测指引」产物；本地 `jest` 仅断言生成物静态结构。
5. **TASK-014 专项覆盖 OpenCode 链路零污染**：断言 `dist/dsh` 与 `dist/sddu` 同级并列 + `dist/sddu.zip` 不含 `dsh/` + 既有测试全绿，直接对应 R-010 与 FR-009①。

### 4.3 任务分解过程中的 plan 细节补充登记（不修改 plan）

| # | 缺口 | 本阶段采用的最合理方案 | 承载任务 |
|:--:|------|----------------------|:--:|
| 1 | plan 未固定 `dsh-contract-manifest.json` 的顶层结构 | 采用 `{ dshContractSnapshot, dependencies[] }`，每条 8 字段（对齐 ADR-006 决策 1 示例） | TASK-001 |
| 2 | plan/ADR-002 要求别名集与 OpenCode 一致，但 R-DSH-03 禁止 `adapters/dsh → adapters/opencode`，别名表当前仅存在于 `plugin.ts` | 别名集**自包含**于 `router-command-map.json`，仅以 `VALID_PHASES` 为校验目标；在 JSON 内以 `_note` 显式登记该编译期等价性缺口（供 v5.1.0 收敛） | TASK-005, TASK-009 |
| 3 | ADR-003 要求「全量生成物不出现硬强制类禁用语」，但降级声明文本本身含「非硬强制」 | 断言口径精确化为「`硬强制` 仅允许出现在 `非硬强制` 否定语境，且不出现 `强制执行` / `运行时硬拒绝`」 | TASK-009 |
| 4 | plan 未说明 `dist/dsh/skills/` 缺失时静态测试如何获取生成物 | `skill-package.test.ts` 在 `beforeAll` 中按需执行 `node scripts/build-dsh-skills.cjs`（幂等），不新增独立前置脚本 | TASK-009 |
| 5 | plan 未明确 `docs/dsh/*.md` 何时可被构建脚本拷贝（文档任务在构建之后） | 构建脚本对缺失文档记 warning、不失败；存在即拷贝到 `dist/dsh/docs/` | TASK-008 |
| 6 | `jest.config.ts` 的 `opencode` 项目 `collectCoverageFrom` 已含 `src/adapters/**`，dsh 契约层可能拉低覆盖率阈值 | 既有 `test:opencode` 未启用 `--coverage`，当前不受影响；若未来 CI 启用覆盖率，需为 dsh 资产显式排除（登记为待观察项，不在本 Feature 改动） | TASK-009, TASK-014 |

## 修订记录
> 记录本文档的版本变更历史

| 版本 | 变更说明 | 日期 | 修订人 |
|------|---------|------|--------|
| v1.0 | 初始创建 — 基于 plan.md v1.0（方案 C 分层承载：Skill 包主交付 + 注入式门禁/状态协议片段 + 预留硬通道；ADR-001~006；文件影响 21 项 = 17 NEW + 4 MODIFY；隔离规则 R-DSH-01~06）与 spec.md v1.0（10 FR / 7 NFR / 9 EC / V1~V5），分解为 14 个原子任务、4 个执行波次；含需求覆盖矩阵、plan 文件影响映射与 6 项 plan 细节补充登记（不修改 plan） | 2026-09-27 | SDDU Tasks Agent |
