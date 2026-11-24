# 任务分解：specs-tree-essence-simplification

> **文档定位**: SDDU 任务清单 — 将技术方案分解为可并行执行的原子任务，作为 build 阶段的输入  
> **前置依赖**: plan.md（技术方案 v5.40）、spec.md（需求规范 v1.31）  
> **创建人**: SDDU Tasks Agent  
> **创建时间**: 2026-11-25  
> **版本**: v1.0  
> **更新人**: SDDU Tasks Agent  
> **更新时间**: 2026-11-25  
> **更新说明**: 初始创建——基于 plan §5.2 变更明细 + ADR-001~027 全部裁决，分解 15 任务 / 4 波次

## 1. 依赖拓扑总览
> 任务依赖关系和执行顺序

```
Wave 1 ─── (无依赖，全部并行)
  TASK-001 [L] 方法论内核蒸馏 sddu.md（唯一权威 + 路由/门禁/状态协议 + 读取规则）
  TASK-003 [M] scripts/ prune——构建链与旧脚本退役
  TASK-004 [M] 零 npm + 根配置退役 + bootstrap 删除
  TASK-005 [M] 项目私有资产降级 MOVE（opencode-operator / dev-guide）
  TASK-006 [S] 归档清理（migration×27 + 证书 + review-report）

Wave 2 ─── (依赖 TASK-001 内核定稿)
  TASK-007 [L] 模板迁移 ×10（agents → modules/sddu-<stage>/）
  TASK-008 [L] 契约迁移 ×31（outputs → modules/sddu-<stage>/contracts/）
  TASK-009 [M] 索引 + workspace 空骨架
  TASK-010 [S] README/LICENSE 入本体

Wave 3 ─── (依赖 TASK-007/008 模板迁出 + TASK-001 契约)
  TASK-002 [L] src/ 整目录退役删除（模板已迁出，唯一例外已在 Wave 1 迁出）
  TASK-011 [L] 复制器 install.{sh,ps1}
  TASK-012 [L] e2e 改造（jest TS → 裸 node 结构回归）
  TASK-013 [L] 存量迁移（29 state.json→state.md + 目录重命名 + architecture 迁散）

Wave 4 ─── (依赖 Wave 3)
  TASK-014 [L] 本仓库 dogfooding 迁 workspace + 路径引用 ×59
  TASK-015 [M] ROADMAP 回填（14 项提案重估）
```

## 2. 任务列表
> 每个任务的详细定义

### TASK-001: 方法论内核蒸馏 sddu.md
> 单一权威内核：7 阶段流程 + 三原则 + 状态模型 + 契约 + 路由/门禁/状态协议 + 读取规则

| 属性 | 值 |
|------|-----|
| **复杂度** | L |
| **前置依赖** | 无 |
| **执行波次** | 1 |
| **对应 FR** | FR-001, FR-003 |

**描述**: 产出唯一权威内核 `.sddu/.sddu/sddu.md`（随模板落位 `sddu-project-template/.sddu/.sddu/sddu.md`）。内容覆盖四要素（7 阶段流程 / 三原则 / 两字段状态模型 / 各阶段文档契约）+ 头部版本字段（唯一版本源）+ 路由表 + 门禁/状态协议 + 读取规则。**蒸馏底稿 = ADR-021 九条（A1~A9）+ ADR-026 标记命令族与仪表盘协议**，以 `machine.ts` / `schema-v3.0.0.ts` / `sddu.md.hbs` 路由段为底稿逐条比对（不凭记忆重写）。字段契约 = ADR-005 十二字段（feature/featureId/name/version/phase/status/depth/childrens/phaseHistory/description + dependencies[ADR-016] + suspendedUntil/mergedInto[ADR-026]）。**排除项不写**：文件反推（ADR-018）、隐式修复（ADR-019）、files 注册（ADR-017）、API 缓存门禁（ADR-015）。零平台特定事实（NFR-001 关键词扫描通过）。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| NEW | `sddu-project-template/.sddu/.sddu/sddu.md` |

**验收标准**:
- [ ] 内核文档存在且非空，四要素逐项可勾稽（7 阶段/三原则/状态模型/契约）
- [ ] 头部版本字段存在（唯一版本源）
- [ ] ADR-021 九条语义逐条比对通过并逐条勾销
- [ ] ADR-026 标记命令族 + 仪表盘协议两段落位（状态协议段 / 读取规则段）
- [ ] front-matter 字段契约 = 十二字段（含 dependencies / suspendedUntil / mergedInto）
- [ ] 全文零平台特定事实（.opencode/.dsh/安装命令/平台路径 关键词扫描零命中）
- [ ] 蒸馏稿经用户逐节确认（plan §6 风险表条款）

**验证命令**:
```bash
grep -n "dependencies\|suspendedUntil\|mergedInto" sddu-project-template/.sddu/.sddu/sddu.md
grep -rniE "\.opencode|\.dsh|npm |dist/|tsc " sddu-project-template/.sddu/.sddu/sddu.md && echo "PLATFORM-FACT-LEAK" || echo "OK"
```

### TASK-002: src/ 整目录退役删除
> TS 运行时与校验工具链整体退役（模板已由 TASK-007/008 迁出）

| 属性 | 值 |
|------|-----|
| **复杂度** | L |
| **前置依赖** | TASK-007, TASK-008 |
| **执行波次** | 3 |
| **对应 FR** | FR-005 |

**描述**: 删除 `src/` 整目录（ADR-005/007）。删除对象：`state/` ×9、`shared/` ×3、`index.ts`、`templates/index.ts`、`adapters/opencode/`、`adapters/dsh/`、`__tests__/`（×13 + fixtures）、`templates/`（已由 TASK-007/008 迁出）、`skills/framework/`（creator/discovery/sync/tree，ADR-010/022）。**唯一例外**：`src/skills/builtin/opencode-operator/` 已在 TASK-005 迁出，本任务不再碰。语义去向：状态模型全量蒸馏进 sddu.md（TASK-001）。删除前确认无剩余引用（e2e 改造在 TASK-012）。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| DELETE | `src/`（整目录，除已迁出的 templates/ 与 opencode-operator/） |

**验收标准**:
- [ ] `src/` 目录不存在（`ls src/` 报错）
- [ ] 无任何文件仍 import src/ 路径（grep 零命中）
- [ ] 状态机语义已由 TASK-001 内核承载（蒸馏稿用户确认完成）

**验证命令**:
```bash
test ! -d src && echo "src removed" || echo "src still exists"
grep -rn "src/state\|src/adapters\|src/templates" --include="*.md" --include="*.sh" --include="*.mjs" . | grep -v node_modules || echo "no dangling imports"
```

### TASK-003: scripts/ prune——构建链与旧脚本退役
> scripts/ 从 4405 行收敛至 ~400 行（仅剩复制器一对）

| 属性 | 值 |
|------|-----|
| **复杂度** | M |
| **前置依赖** | 无 |
| **执行波次** | 1 |
| **对应 FR** | FR-005 |

**描述**: 删除 `scripts/` 下全部旧脚本（plan §5.2 line 209）：`build-agents.cjs`、`build-dsh-skills.cjs`、`package.cjs`、`package.test.cjs`、`test-sddu-functionality.js`、`check-sdd-residue.sh`、`migrate-sdd-to-sddu.sh`、`sddu-check.sh`、`sddu-validation-report.sh`、`verify-skills.sh`、`install/opencode/`、`install/dsh/`（四份旧安装器，由 TASK-011 纯复制器取代）。保留：`scripts/install/install.{sh,ps1}`（TASK-011 产出）。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| DELETE | `scripts/build-agents.cjs` / `build-dsh-skills.cjs` / `package.cjs` / `package.test.cjs` / `test-sddu-functionality.js` |
| DELETE | `scripts/check-sdd-residue.sh` / `migrate-sdd-to-sddu.sh` / `sddu-check.sh` / `sddu-validation-report.sh` / `verify-skills.sh` |
| DELETE | `scripts/install/opencode/` / `scripts/install/dsh/` |

**验收标准**:
- [ ] scripts/ 仅剩 `install/install.{sh,ps1}`（TASK-011 后）
- [ ] 无残留脚本引用已删脚本（grep 零命中）

**验证命令**:
```bash
find scripts -type f | sort
```

### TASK-004: 零 npm + 根配置退役 + bootstrap 删除
> 仓库不再是 npm 项目；一键安装入口退役

| 属性 | 值 |
|------|-----|
| **复杂度** | M |
| **前置依赖** | 无 |
| **执行波次** | 1 |
| **对应 FR** | FR-005, NFR-005 |

**描述**: 零 npm（ADR-006）：删除 `package.json` / `package-lock.json` / `node_modules`；根 TS 配置退役（ADR-005）：删除 `tsconfig.json` / `jest.config.ts`；bootstrap 退役（ADR-020）：删除 `bootstrap.sh` / `bootstrap.ps1`（新设计不区分平台，安装 = cp -r）。`.gitignore` 瘦身（移除 node_modules/dist/.opencode/.dsh 相关条目）。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| DELETE | `package.json` / `package-lock.json` / `tsconfig.json` / `jest.config.ts` |
| DELETE | `bootstrap.sh` / `bootstrap.ps1` |
| DELETE | `node_modules/` |
| MODIFY | `.gitignore` |

**验收标准**:
- [ ] 仓库根无 package.json / package-lock.json / node_modules
- [ ] 仓库根无 bootstrap.sh / bootstrap.ps1
- [ ] npm 依赖归零（NFR-005 验收项）
- [ ] .gitignore 不再包含 node_modules 等退役产物条目

**验证命令**:
```bash
test ! -e package.json && test ! -e package-lock.json && test ! -d node_modules && echo "zero-npm OK"
test ! -e bootstrap.sh && test ! -e bootstrap.ps1 && echo "no bootstrap OK"
```

### TASK-005: 项目私有资产降级 MOVE
> opencode-operator 与 dev-guide 降级为项目自有 skill，非产品部分

| 属性 | 值 |
|------|-----|
| **复杂度** | M |
| **前置依赖** | 无 |
| **执行波次** | 1 |
| **对应 FR** | FR-005 |

**描述**: 两项项目私有 skill 迁出产品/模板面（ADR-025/024）：`src/skills/builtin/opencode-operator/` → `.agents/skills/opencode-operator/`（含 SKILL.md + scripts/serve-api.cjs + init.cjs + package.json，commander 私有依赖随目录自包含）；`.sddu/skills/dev-guide/SKILL.md` → `.agents/skills/dev-guide/SKILL.md`（项目自有，sddu-project-template 不含）。两 skill 不进模板、不进 FR-002 对齐范围。dev-guide 内容重写延后（引用 npm/src/dist 的段落过期，按需处理）。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| MOVE | `src/skills/builtin/opencode-operator/` → `.agents/skills/opencode-operator/` |
| MOVE | `.sddu/skills/dev-guide/SKILL.md` → `.agents/skills/dev-guide/SKILL.md` |

**验收标准**:
- [ ] `.agents/skills/opencode-operator/` 完整（SKILL.md + scripts/）
- [ ] `.agents/skills/dev-guide/SKILL.md` 存在
- [ ] 两个 skill 均不在 `sddu-project-template/` 内
- [ ] `.sddu/skills/` 目录随之清空/删除

**验证命令**:
```bash
ls .agents/skills/opencode-operator .agents/skills/dev-guide/SKILL.md
test ! -d .sddu/skills && echo "old skills dir removed" || echo "old skills dir remains"
```

### TASK-006: 归档清理（历史残留）
> 迁移残留 + 证书 + 旧审查报告批量删除

| 属性 | 值 |
|------|-----|
| **复杂度** | S |
| **前置依赖** | 无 |
| **执行波次** | 1 |
| **对应 FR** | FR-005 |

**描述**: 删除历史归档残留（plan §5.2 line 203/204）：`.sddu/docs/migration*.md` ×27（P-018）、`.sddu/COMPLETION_CERTIFICATE.json`、`.sddu/review-report-plugin-rename-sddu.json`。用户已拍板（2026-11-22）。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| DELETE | `.sddu/docs/migration*.md`（×27） |
| DELETE | `.sddu/COMPLETION_CERTIFICATE.json` |
| DELETE | `.sddu/review-report-plugin-rename-sddu.json` |

**验收标准**:
- [ ] `.sddu/docs/migration*.md` 零残留
- [ ] 证书与 review-report json 不存在

**验证命令**:
```bash
find .sddu/docs -name "migration*.md" | wc -l
test ! -e .sddu/COMPLETION_CERTIFICATE.json && test ! -e .sddu/review-report-plugin-rename-sddu.json && echo "clean"
```

### TASK-007: 模板迁移 ×10
> 11 个 Agent 指令源迁入 modules/，方法论段改引用、删平台/场景门禁、完成协议改写

| 属性 | 值 |
|------|-----|
| **复杂度** | L |
| **前置依赖** | TASK-001 |
| **执行波次** | 2 |
| **对应 FR** | FR-002 |

**描述**: `src/templates/agents/*.md.hbs` → `sddu-project-template/.sddu/.sddu/modules/sddu-<stage>/sddu-<stage>.md`（×10：discovery/spec/plan/tasks/build/review/validate/fast/roadmap/docs）。改造点：① 方法论转写段替换为「权威来源：sddu.md」引用声明（FR-002）；② **删除 API 缓存门禁段**（sddu-spec/sddu-plan，ADR-015）；③ **删除 files 回写联动段**（sddu-review/sddu-validate，ADR-017）；④ **完成协议改写**：`/tool sddu_update_state` → state.md front-matter 更新动作（A8，阶段推进唯一路径）；⑤ router（sddu.md.hbs）**并入入口**（不独立成模块）——router 的路由表/门禁/仪表盘语义已蒸馏进 sddu.md（TASK-001）。`.md.hbs` → `.md`（零渲染，占位符为文档约定）。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| MOVE+MODIFY | `src/templates/agents/sddu-{discovery,spec,plan,tasks,build,review,validate,fast,roadmap,docs}.md.hbs` → `sddu-project-template/.sddu/.sddu/modules/sddu-<stage>/sddu-<stage>.md` |
| DELETE | `src/templates/agents/sddu.md.hbs`（router 并入 sddu.md 入口） |

**验收标准**:
- [ ] 10 个模块指令文件落位正确（目录名即业务名）
- [ ] 每个模板方法论段为引用声明、无独立转写副本
- [ ] sddu-spec/sddu-plan 无 API 缓存门禁段（ADR-015）
- [ ] sddu-review/sddu-validate 无 files 回写段（ADR-017）
- [ ] 完成协议统一为 state.md 更新动作（A8）
- [ ] 抽查任一模板：改内核一处即全生效（FR-002 验收②）

**验证命令**:
```bash
ls sddu-project-template/.sddu/.sddu/modules/*/sddu-*.md | wc -l   # 期望 10
grep -rn "sddu_update_state\|api-docs\|files\.review" sddu-project-template/.sddu/.sddu/modules/ || echo "legacy protocol removed"
```

### TASK-008: 契约迁移 ×31
> 30 个输出模板迁入 contracts/，补 adr.md 契约，模板头补引用声明

| 属性 | 值 |
|------|-----|
| **复杂度** | L |
| **前置依赖** | TASK-001 |
| **执行波次** | 2 |
| **对应 FR** | FR-002 |

**描述**: `src/templates/outputs/` → `sddu-project-template/.sddu/.sddu/modules/sddu-<stage>/contracts/`（×30，按业务归包：review-report 归 sddu-review、docs ×20 归 sddu-docs 等）。`.md.hbs` → `.md`；模板头补「权威来源：sddu.md」引用声明。**新增 adr.md 契约**（现状缺失，ADR-001 五段式：标题/状态/背景/决策/后果），归 sddu-plan/contracts/——契约总数 30 → 31。输出模板**内容不改**（属文档契约载体表达），仅归包 + 去渲染 + 头引用。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| MOVE+MODIFY | `src/templates/outputs/*` → `sddu-project-template/.sddu/.sddu/modules/sddu-<stage>/contracts/`（×30） |
| NEW | `sddu-project-template/.sddu/.sddu/modules/sddu-plan/contracts/adr.md` |

**验收标准**:
- [ ] 契约总数 31（30 迁入 + adr.md 新增）
- [ ] 每个契约随所属业务归包（review-report 归 review，docs×20 归 docs）
- [ ] 无 `.md.hbs` 后缀残留（全部 .md）
- [ ] 模板头含引用声明

**验证命令**:
```bash
find sddu-project-template/.sddu/.sddu/modules -name "*.md" -path "*contracts*" | wc -l   # 期望 31
find sddu-project-template/.sddu/.sddu/modules -name "*.hbs" | wc -l   # 期望 0
```

### TASK-009: 索引 + workspace 空骨架
> 唯一入口索引 + 用户产物空骨架初始化

| 属性 | 值 |
|------|-----|
| **复杂度** | M |
| **前置依赖** | TASK-001 |
| **执行波次** | 2 |
| **对应 FR** | FR-008 |

**描述**: ① 唯一入口索引 `sddu-project-template/.agents/skills/sddu/SKILL.md`——纯索引/引导（内容极简稳定：仅引导 Agent 加载 `.sddu/.sddu/sddu.md`），全 md 零渲染，落位即安装后路径；② workspace 空骨架 `sddu-project-template/.sddu/workspace/`：`ROADMAP.md`（种子，初始空表）+ `specs-tree-root/` + `docs-tree-root/`（5 领域）+ `.sddu-config/modules/sddu-<stage>/`（×10，每阶段 `sddu-<stage>-{before,after}.md` 空钩子 + `contracts/`，ADR-011 预置扩展点）。workspace 仅首次安装初始化，升级/重装绝不触碰。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| NEW | `sddu-project-template/.agents/skills/sddu/SKILL.md` |
| NEW | `sddu-project-template/.sddu/workspace/ROADMAP.md` |
| NEW | `sddu-project-template/.sddu/workspace/specs-tree-root/` |
| NEW | `sddu-project-template/.sddu/workspace/docs-tree-root/<领域>/`（×5） |
| NEW | `sddu-project-template/.sddu/workspace/.sddu-config/modules/sddu-<stage>/sddu-<stage>-{before,after}.md`（×20 空钩子） |

**验收标准**:
- [ ] 索引文件内容极简且跨版本稳定（仅引导加载 sddu.md）
- [ ] workspace 骨架含 ROADMAP 种子 + specs-tree-root + docs-tree-root（5 领域）+ .sddu-config（×10×2 空钩子）
- [ ] 空钩子文件默认空（ADR-011 预置扩展点）
- [ ] workspace 无 TREE 种子（ADR-010 已裁）

**验证命令**:
```bash
ls sddu-project-template/.agents/skills/sddu/SKILL.md
find sddu-project-template/.sddu/workspace/.sddu-config -name "sddu-*-before.md" | wc -l   # 期望 10
find sddu-project-template/.sddu/workspace/.sddu-config -name "sddu-*-after.md" | wc -l    # 期望 10
```

### TASK-010: README/LICENSE 入本体
> 发布元数据随本体分发

| 属性 | 值 |
|------|-----|
| **复杂度** | S |
| **前置依赖** | TASK-001 |
| **执行波次** | 2 |
| **对应 FR** | FR-002（对外释义层） |

**描述**: README/LICENSE 从仓库根 MOVE 入本体 `.sddu/.sddu/`（ADR-013）：`README.md` → `sddu-project-template/.sddu/.sddu/README.md`（重排「本质先行」：是什么 / 怎么装（git clone + cp -r 两步）/ 7 阶段概览 → 指向 sddu.md，不转写方法论，含术语人话解释 ADR-014）；`LICENSE` → `sddu-project-template/.sddu/.sddu/LICENSE`（随装即得合法授权）。仓库根不设副本（杜绝双权威）。CHANGELOG 不增设（ROADMAP 即历史）。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| MOVE+MODIFY | `README.md` → `sddu-project-template/.sddu/.sddu/README.md` |
| MOVE | `LICENSE` → `sddu-project-template/.sddu/.sddu/LICENSE` |

**验收标准**:
- [ ] 本体目录含 README.md + LICENSE
- [ ] README 重排「本质先行」且指向 sddu.md、不转写方法论
- [ ] 仓库根无 README.md / LICENSE 副本
- [ ] README 行数显著下降（NFR-005 记录前后对比）

**验证命令**:
```bash
ls sddu-project-template/.sddu/.sddu/README.md sddu-project-template/.sddu/.sddu/LICENSE
test ! -e README.md && test ! -e LICENSE && echo "no root copy"
```

### TASK-011: 复制器 install.{sh,ps1}
> 纯复制粘贴器（合并四份旧安装器 → 一份/运行时）

| 属性 | 值 |
|------|-----|
| **复杂度** | L |
| **前置依赖** | TASK-009, TASK-010 |
| **执行波次** | 3 |
| **对应 FR** | FR-008 |

**描述**: 合并 `install/{opencode,dsh}×{sh,ps1}` 四份 → `scripts/install/install.{sh,ps1}` 一份/运行时（ADR-007）。核心 = `cp -r sddu-project-template/. <project>/`（源路径 = 安装后路径，零改写、零平台分支、零 dist/、零 install.json）；附旧布局迁移（检测旧 `.sddu/` 根下布局 → 备份 → 迁入 `workspace/`，失败回滚，EC-007）。版本 = sddu.md 头部（无 install.json）。终态 scripts/ 收敛至 ~400 行。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| NEW | `scripts/install/install.sh` |
| NEW | `scripts/install/install.ps1` |

**验收标准**:
- [ ] install.{sh,ps1} 仅 cp -r + 旧布局迁移（备份+回滚），零平台分支
- [ ] 无 dist/、无渲染、无 install.json 引用
- [ ] 源路径 = 安装后路径逐项对应（设计态即运行态）
- [ ] 安装后两平台 `.sddu/.sddu/` 逐项一致（FR-008 验收①）

**验证命令**:
```bash
bash scripts/install/install.sh /tmp/sddu-test-proj && diff -r sddu-project-template/.sddu /tmp/sddu-test-proj/.sddu && echo "copy-identical"
```

### TASK-012: e2e 改造（裸 node 结构回归）
> jest TS 测试 → 裸 node 结构回归脚本；e2e 场景生成器退役

| 属性 | 值 |
|------|-----|
| **复杂度** | L |
| **前置依赖** | TASK-002, TASK-011 |
| **执行波次** | 3 |
| **对应 FR** | FR-005, NFR-002 |

**描述**: `e2e/*.test.ts` + `jest.config.ts` → 裸 node 结构回归脚本（`node e2e/<scenario>.mjs`），断言安装范式：① `.sddu` 文件计数与哈希；② 1 入口（.agents/skills/sddu）；③ workspace 逐字节不变；④ 旧布局迁移与回滚；⑤ state.md front-matter 枚举（phase 8 / status 5）。删除 `e2e/scripts/`（basic/fullstack 场景生成器，ADR-023）与 `docs/FULLSTACK-E2E-GUIDE.md`。dsh 静态结构断言从「11 skill + 30 模板」调整为「1 入口 + .sddu 计数」。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| DELETE | `e2e/multi-feature.test.ts` / `e2e/sddu-workflow.test.ts` / `e2e/jest.config.ts` |
| NEW | `e2e/<scenario>.mjs`（裸 node 结构回归） |
| DELETE | `e2e/scripts/`（整目录） |
| DELETE | `docs/FULLSTACK-E2E-GUIDE.md` |

**验收标准**:
- [ ] e2e 无 TS/jest 依赖（裸 node 直跑）
- [ ] 结构回归覆盖 .sddu 计数 + 1 入口 + workspace 逐字节不变 + 迁移回滚 + state.md 枚举
- [ ] e2e/scripts/ 与 FULLSTACK 指南不存在（ADR-023）
- [ ] `node e2e/<scenario>.mjs` 通过（NFR-002）

**验证命令**:
```bash
node e2e/<scenario>.mjs && echo "e2e pass"
```

### TASK-013: 存量迁移（state.md + 目录重命名 + architecture 迁散）
> 29 个 state.json → state.md + version-in-path 重命名 + ADR 随 Feature 存储

| 属性 | 值 |
|------|-----|
| **复杂度** | L |
| **前置依赖** | TASK-001 |
| **执行波次** | 3 |
| **对应 FR** | FR-007, FR-008⑦⑧ |

**描述**: ① 29 个 `state.json` → `state.md`（FR-007/ADR-008）：front-matter 承载十二字段（含 dependencies ADR-016、suspendedUntil/mergedInto ADR-026，note 进正文），正文承载人类可读摘要；version 误写修正（specs-tree-dsh-adaptation v3.0.0 → v5.0.0）；② 存量 Feature 目录重命名 `specs-tree-<version>-<slug>`（version 取 front-matter 三段式零填充；历史无版本沿用原名标注）；③ `architecture/adr/` 迁散（ADR 随 Feature 存储，ADR-001~017 迁归属 Feature，无法归属者归档）。逐文件跑 e2e 结构回归断言，失败逐个报告不静默跳过（EC-005）。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| MODIFY | `.sddu/specs-tree-root/specs-tree-*/state.json` → `state.md`（×29） |
| MOVE | `.sddu/specs-tree-root/specs-tree-*/` → `specs-tree-<version>-<slug>/`（按版本重命名） |
| MOVE | `.sddu/specs-tree-root/architecture/adr/ADR-*.md` → 归属 Feature 目录 |

**验收标准**:
- [ ] 每个 Feature 有且仅有一份 state.md（无 state.json）
- [ ] front-matter 字段契约 = 十二字段，正文摘要与 front-matter 一致
- [ ] 目录名 = specs-tree-<version>-<slug>（零填充保字典序）
- [ ] architecture/ 目录不存在（ADR 随 Feature 存储）
- [ ] 逐文件 e2e 断言通过（EC-005）

**验证命令**:
```bash
find .sddu -name "state.json" | wc -l   # 期望 0
find .sddu -name "state.md" | wc -l     # 期望 ≥29
test ! -d .sddu/specs-tree-root/architecture && echo "architecture dissolved"
```

### TASK-014: 本仓库 dogfooding 迁 workspace + 路径引用 ×59
> 本仓库自身工作空间迁入 workspace/，路径引用机械替换

| 属性 | 值 |
|------|-----|
| **复杂度** | L |
| **前置依赖** | TASK-013 |
| **执行波次** | 4 |
| **对应 FR** | FR-008, FR-002 |

**描述**: 本仓库（dogfooding）工作空间迁入 `.sddu/workspace/`：`specs-tree-root` / `docs` / `docs-tree-root` / `skills`（已迁 dev-guide）/ `ROADMAP` / `TREE`（已裁）。路径引用机械替换 ×59 文件：`.sddu/specs-tree-root` → `.sddu/workspace/specs-tree-root`（33 文件）+ 其他 `.sddu/{skills,ROADMAP,TREE,templates}` 直引（26 文件）；`src/state/` 已整体裁撤，无路径常量迁移项。迁移前整体备份 + 失败回滚（EC-007）。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| MOVE | `.sddu/specs-tree-root/` → `.sddu/workspace/specs-tree-root/` |
| MOVE | `.sddu/{docs,docs-tree-root,ROADMAP}/` → `.sddu/workspace/` |
| MODIFY | 路径引用 ×59 文件 |

**验收标准**:
- [ ] 本仓库工作空间落位 `.sddu/workspace/` 下
- [ ] 路径引用 ×59 全部替换（grep `.sddu/specs-tree-root` 零命中，除 workspace/ 前缀）
- [ ] 迁移前备份存在、失败可回滚（EC-007）

**验证命令**:
```bash
grep -rn "\.sddu/specs-tree-root" --include="*.md" --include="*.sh" --include="*.mjs" . | grep -v "workspace/specs-tree-root" | grep -v node_modules || echo "all refs migrated"
```

### TASK-015: ROADMAP 回填（路线图重估）
> 14 项未实施提案重估 + PR-017 转化回填

| 属性 | 值 |
|------|-----|
| **复杂度** | M |
| **前置依赖** | 无 |
| **执行波次** | 4 |
| **对应 FR** | FR-006 |

**描述**: 按判定标准（ADR-002 四维判据）对 v7~v12 全部未实施提案（PR-001~PR-012、PR-015、PR-016、PR-007，共 14 项）逐项重估，产出保留/搁置/合并结论并回填 ROADMAP §3/§5/§6；PR-017 → FR-ESSENCE-001 转化回填（补欠账）；问题台账（P-xxx）逐项核对，对象裁撤者标记「已关闭-对象裁撤」（EC-006）。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| MODIFY | `.sddu/workspace/ROADMAP.md` |

**验收标准**:
- [ ] 14 项提案每项有重估结论与依据（FR-006 验收①）
- [ ] ROADMAP §3/§5/§6 按结论更新（状态/版本归属如实）
- [ ] PR-017→FR-ESSENCE-001 转化回填完成
- [ ] 问题台账无悬空登记（EC-006）

**验证命令**:
```bash
grep -c "PR-00\|PR-01" .sddu/workspace/ROADMAP.md   # 抽样确认重估结论已回填
```

## 3. 任务汇总
> 任务数量、复杂度和波次的统计总览

| 统计项 | 数值 |
|--------|:--:|
| 总任务数 | 15 |
| S 级 (简单) | 2 |
| M 级 (中等) | 5 |
| L 级 (复杂) | 8 |
| 执行波次 | 4 |

## 4. 执行策略
> 各波次的执行说明

| 波次 | 任务 | 策略 |
|:--:|------|------|
| 1 | TASK-001, TASK-003, TASK-004, TASK-005, TASK-006 | 并行执行（无依赖；内核蒸馏与退役删除可同时进行） |
| 2 | TASK-007, TASK-008, TASK-009, TASK-010 | 并行执行（依赖 TASK-001 内核定稿） |
| 3 | TASK-002, TASK-011, TASK-012, TASK-013 | 并行执行（依赖 Wave 2 模板迁出 + TASK-001 契约） |
| 4 | TASK-014, TASK-015 | 并行执行（依赖 Wave 3） |

> **执行顺序关键约束**：TASK-007/008（模板/契约迁出 src/templates/）必须先于 TASK-002（src/ 整目录删除）——src/ 删除的前提是模板资产已迁出、语义已蒸馏进内核。TASK-005（opencode-operator 迁出 src/skills/builtin/）也必须在 TASK-002 前完成。

## 修订记录
> 记录本文档的版本变更历史

| 版本 | 变更说明 | 日期 | 修订人 |
|------|---------|------|--------|
| v1.0 | 初始创建——基于 plan v5.40 + ADR-001~027，分解 15 任务 / 4 波次（S×2 / M×5 / L×8） | 2026-11-25 | SDDU Tasks Agent |
