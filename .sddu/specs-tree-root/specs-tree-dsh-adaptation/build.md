# 构建报告：specs-tree-dsh-adaptation

> **文档定位**: SDDU 构建报告 — 记录全部任务的文件变更和实现结果，作为 review 阶段的输入  
> **前置依赖**: tasks.md（任务清单）、plan.md（技术方案）、spec.md（需求规范）  
> **创建人**: SDDU Build Agent  
> **创建时间**: 2026-09-27  
> **版本**: v1.0  
> **更新人**: SDDU Build Agent  
> **更新时间**: 2026-09-27  
> **更新说明**: 初始创建 — 完成 TASK-001~TASK-014（14/14，4 波次），17 NEW + 4 MODIFY（纯追加，删除行 0）全部落地；全链回归通过；8 项偏差/风险登记见附录 A

## 1. 构建概要
> 本次构建的整体统计

| 维度 | 数值 |
|------|:--:|
| 完成任务数 | 14 / 14 |
| 复杂度分布 | S×5 / M×8 / L×1 |
| 新增文件 | 17 个（另有 13 项 `dist/` 生成物，gitignored） |
| 修改文件 | 4 个（全部纯追加，删除行合计 0） |
| 新增测试用例 | 32 个（`skill-package.test.ts`，1 suite 全绿） |
| 全链回归 | `npm run build` / `test:core` / `test:opencode` / `package.cjs` 全绿；预存 4 个 integration 失败套件未恶化 |

## 2. 文件变更
> 本次构建涉及的全部文件操作（含源码、测试、配置等所有类型）

| 操作 | 文件路径 | 对应任务 | 说明 |
|:--:|------|:--:|------|
| NEW | `src/adapters/dsh/contract/dsh-contract-manifest.json` | TASK-001 | 契约依赖点唯一来源：`dshContractSnapshot=2026-08-14` + `phaseEnum` + 7 条依赖点（8 字段齐备；`command-registration`=已知缺口、`profile-bundle`=快照未覆盖、`guard-pipeline`=演进点） |
| NEW | `src/adapters/dsh/contract.ts` | TASK-001 | 类型化装载/校验/哈希：`loadContractManifest` / `validateContractManifest` / `computeContractManifestHash`；phase 枚举一致性校验失败抛错 |
| NEW | `src/adapters/dsh/templates/skill-header.md.hbs` | TASK-002 | 包装层：frontmatter + `metadata.sddu-source` / `metadata.sddu-contract-snapshot` + 命名落位约定 + 单一来源声明；不含阶段指令正文 |
| NEW | `src/adapters/dsh/templates/gate-protocol.md.hbs` | TASK-003 | 门禁协议：四步流程 + `[SDDU-GATE-DENY]`(action=none) / `[SDDU-GATE-ALLOW]`(action=proceed) + 非法跃迁必须拒绝 + 已知降级(FR-004b) + EC-008 |
| NEW | `src/adapters/dsh/templates/state-sync-protocol.md.hbs` | TASK-004 | 状态协议：`state.json` 唯一权威 + 推进三步 + `[SDDU-STATE-SYNC]` + 三方对账 + 非强证据声明 |
| NEW | `src/adapters/dsh/templates/router-command-map.json` | TASK-005 | 单一来源：11 Skill 清单 + 11 条入口 + 自包含 `phaseAliases` + `invalidPhase`(ROUTE-REJECT) + `fallbackUsage` + `routerEntryProtocol` 三段；`_note` 登记别名漂移风险 |
| NEW | `scripts/install-dsh.sh` | TASK-006 | rank 100 主落位 / rank 400 用户级；落位自检 + EC-002 冲突提示 + EC-004 `skills/change` 提示 + V1 指引；纯文件操作 |
| NEW | `scripts/uninstall-dsh.sh` | TASK-006 | 对称卸载 + provenance 安全闸 + 残留二次扫描（有残留非零退出） |
| NEW | `src/adapters/dsh/index.ts` | TASK-007 | 适配层公共出口：re-export contract + `SKILL_PREFIX`/`DEFAULT_RANK`/`USER_RANK`/`CONTRACT_SNAPSHOT`/`SKILL_NAMES` 等常量 |
| NEW | `scripts/build-dsh-skills.cjs` | TASK-008 | 渲染 `dist/dsh/skills/*/SKILL.md`×11 + `manifest.json`（版本锚定）+ 渲染 `docs/dsh/contract-dependencies.md` + 拷贝 docs + 构建期校验非零退出 + 零写操作断言 |
| NEW | `src/__tests__/unit/adapters/dsh/skill-package.test.ts` | TASK-009 | 生成物静态断言套件（8 组 / 32 用例）：结构、入口清单、协议片段、禁用语、单一来源、版本锚定、核心域隔离、OpenCode 零污染 |
| NEW | `docs/dsh/README.md` | TASK-011 | 交付总览 / 安装卸载升级 / 三层目录↔六级 rank 推演 / 入口清单 / 已知缺口与降级用法 / EC-002·EC-004 / 时效声明 |
| NEW | `docs/dsh/dual-platform-diff.md` | TASK-011 | 五维差异表（入口/承载/门禁/状态/落位）+ 随版本核对说明 + 「能力落差不得表述为等价」 |
| NEW | `docs/dsh/positioning.md` | TASK-012 | 与 dsh 原生能力（plan mode/todo/workflow/goal/compaction）分工共存 + 4 个判定示例 + EC-009 混用提示 |
| NEW | `docs/dsh/upgrade-following.md` | TASK-012 | 步骤 0~6 + 9 字段破坏点记录模板 + 成本基线口径 + 「未刷新即不可信」+ v5.1.0+ guard 演进点 |
| NEW | `docs/dsh/verification.md` | TASK-013 | V1~V5 四字段逐项 + V3 三方对账 + V4 双判据 + 最小人工清单（≤30min）+ 无法自动化断言缺口声明 |
| NEW（构建生成） | `docs/dsh/contract-dependencies.md` | TASK-008 | 由契约清单**单一来源**渲染的人读版（禁止手工维护第二份） |
| MODIFY | `package.json` | TASK-010 | 纯追加 +3/0：新增 `build:dsh` / `postbuild`；`files` 纳入 `dist/dsh/**/*` |
| MODIFY | `scripts/package.cjs` | TASK-010 | 纯追加 +16/0：`itemsToKeep` 追加 `dsh`；复制循环插入 `dsh` skip；追加移除 `dist/sddu/adapters/dsh/` |
| MODIFY | `jest.config.ts` | TASK-009 | 纯追加 +1/0：`moduleNameMapper` 追加 `'^@dsh/(.*)$'`（与 `@opencode` 对称） |
| MODIFY | `README.md` | TASK-011 | 纯追加 +17/0：新增「🧩 dsh 适配（v5.0.0）」一节 + 文档导航一条 |
| NEW（生成物，gitignored） | `dist/dsh/skills/<skill>/SKILL.md` ×11 | TASK-008 | 11 个 Skill（`sddu` + 10 个 `sddu-*`） |
| NEW（生成物，gitignored） | `dist/dsh/manifest.json`、`dist/dsh/docs/*` | TASK-008 | 版本锚定 + 文档拷贝 |
| MODIFY（过程产物） | `.sddu/specs-tree-root/specs-tree-dsh-adaptation/tasks.md` | TASK-014 | 追加「5. 回归记录」小节（未改既有内容） |
| MODIFY（过程产物） | `.sddu/specs-tree-root/specs-tree-dsh-adaptation/tasks.json` | TASK-014 | 14 个任务状态同步为 `completed` |
| MODIFY（过程产物） | `.sddu/specs-tree-root/specs-tree-dsh-adaptation/state.json` | 完成协议 | `tasked` → `builded`（phaseHistory / history 追加，`metadata.updatedAt` 更新） |

## 3. 任务完成清单
> 每个任务的完成状态

| 任务 | 名称 | 复杂度 | 状态 | 对应 FR |
|------|------|:--:|:--:|------|
| TASK-001 | dsh 契约依赖点清单 + 类型化装载校验层 | M | ✅ completed | FR-007 / NFR-001 / NFR-007 |
| TASK-002 | skill-header 片段模板 | S | ✅ completed | FR-001 |
| TASK-003 | gate-protocol 片段模板 | S | ✅ completed | FR-004 / NFR-003 |
| TASK-004 | state-sync-protocol 片段模板 | S | ✅ completed | FR-005 / NFR-003 |
| TASK-005 | router-command-map.json | M | ✅ completed | FR-001 / FR-002 |
| TASK-006 | 安装 / 卸载脚本 | M | ✅ completed | FR-008 |
| TASK-007 | dsh 适配层公共 API 出口 | S | ✅ completed | FR-009 |
| TASK-008 | dsh Skill 构建脚本 | L | ✅ completed | FR-001 / FR-003 / FR-007 / NFR-002 / NFR-007 |
| TASK-009 | jest 别名 + 生成物静态断言 | M | ✅ completed | FR-001 / FR-002 / FR-004 / FR-005 / FR-007 / FR-009 / NFR-002 / NFR-004 |
| TASK-010 | 打包集成（同级并列） | M | ✅ completed | FR-009 / NFR-004 |
| TASK-011 | 交付总览文档 + 双平台差异 | M | ✅ completed | FR-001 / FR-002 / FR-008 / NFR-002 / NFR-007 |
| TASK-012 | 定位说明 + 升级跟随清单 | S | ✅ completed | FR-007 / FR-010 / NFR-005 / NFR-007 |
| TASK-013 | 验证方法文档（V1~V5） | M | ✅ completed | FR-006 / NFR-005 / NFR-006 |
| TASK-014 | 回归与隔离验证 | M | ✅ completed | FR-009 / NFR-004 |

## 4. 下一步

| 场景 | 操作 |
|------|------|
| 全部任务已完成 | 运行 `@sddu-review specs-tree-dsh-adaptation` 开始审查 |

## 附录 A. 偏差与风险登记（构建阶段核出）

> 说明：附录 A 为构建阶段按协调器要求新增的登记区，模板原有章节（§1~§4 与修订记录）结构未改动。

### A.1 实现层面的偏差（与 tasks.md / plan 表述不同，但满足其机器可校验验收）

| # | 位置 | tasks.md 表述 | 实际实现 | 理由与影响 |
|:--:|------|--------------|---------|-----------|
| A1 | TASK-010 `package.json` | "`build` 管道追加 `&& npm run build:dsh`" | 未改 `build` 行，改为**新增 `postbuild` 钩子**（`npm run build:dsh`） | 硬约束要求 package.json **删除行 = 0**（TASK-010 验证命令 `awk '{s+=$2}'` = 0），而改写 `build` 行会产生 1 删除行。npm 11 对自定义脚本支持 `pre/post` 钩子，`npm run build` 实测依次完成 `build:agents → build:ts → build:dsh`，验收语义不变 |
| A2 | TASK-010 `scripts/package.cjs` | 仅要求 "`itemsToKeep` 增加 `'dsh'`" | 除 `itemsToKeep.push('dsh')` 外，**追加**了 ① 复制循环内 `if (file === 'dsh') continue;` ② 移除 `dist/sddu/adapters/dsh/` 一步 | 仅加 `itemsToKeep` 不足以满足验收：「`dist/sddu.zip` 不含 `dsh/`」。因为 `build:ts` 把 `src/adapters/dsh/*.ts` 编译到 `dist/adapters/dsh/`，`packageSingleVersion` 会将其复制进 `dist/sddu/adapters/dsh/` 从而进入 `sddu.zip`（**实测泄漏**）。两处追加均为**纯插入（0 删除）** |
| A3 | TASK-009 | `@dsh` 别名导入 | 测试对 dsh 适配层使用**相对 import**；`@dsh` 别名的可用性由一条独立用例（`require('@dsh/index')`）显式断言 | ts-jest 的类型诊断需要 `tsconfig.json` 的 `paths` 才能解析 `@dsh/*`；而 `tsconfig.json` 不在 4 个 MODIFY 文件内（硬约束）。见 A.5 |
| A4 | TASK-009 断言范围 | 8 组断言 | 额外增加 1 组断言：`docs/dsh/README.md` 的入口清单必须包含 `router-command-map.json` 的全部 11 条 `entry` 字符串 | TASK-011 验收允许「由 TASK-009 或构建生成保证」入口表一致性；该断言把 NFR-002 防漂移落到可执行测试。副作用：产生 TASK-009 → TASK-011 的顺序依赖（本 Feature 内已满足） |

### A.2 tasks.md 验证命令的漂移（**未修改 spec/plan/tasks 既有内容**，仅登记）

| # | 漂移 | 实际采用口径 |
|:--:|------|-------------|
| A5 | TASK-008 / TASK-010 的 `ls -d dist/dsh/skills/sddu-* \| wc -l` 期望 11 —— 该 glob **不匹配**路由 Skill 目录 `sddu`（无连字符），实测只能数到 **10** | 以 ADR-001 §1 目录树为权威（`sddu` + 10 个 `sddu-*` = 11）。等价校验：`ls dist/dsh/skills \| wc -l` = **11**。**未**为迎合错误 glob 而多造一个 Skill 目录 |
| A6 | TASK-010 / TASK-014 使用 `unzip -l`，执行环境**未安装 `unzip`** | 改用 `python3 -m zipfile -l dist/sddu.zip \| grep -c 'dsh/'` = **0**（等价断言）；另以 `find dist/sddu -path '*dsh*'` = 0 双重确认 |
| A7 | TASK-009 使用 `--testPathPattern`，jest **30.3.0** 已将其更名为 `--testPathPatterns`（原命令直接报错） | 改用 `--testPathPatterns adapters/dsh` |

### A.3 待观察项 / 技术债（不阻断本 Feature）

| # | 项 | 说明 |
|:--:|----|------|
| A8 | 别名集与 OpenCode `legacyStatusToPhase` 无编译期等价保障 | 按 plan 缺口 2 处置：`phaseAliases` 自包含于 `router-command-map.json`，仅以 `VALID_PHASES` 为校验目标，`_note` 显式登记漂移风险（TASK-009 已断言 `_note` 存在）。建议 v5.1.0 把别名集上提为核心域只读常量后双方共引 |
| A9 | `tsconfig.json` 缺 `@dsh/*` 的 `paths` | `@dsh` jest 别名运行时可用（已断言），但 TS 类型解析不可用。补齐需改 `tsconfig.json`（超出本 Feature 的 4 MODIFY 约束），登记为后续技术债 |
| A10 | plan 缺口 6：`collectCoverageFrom` 含 `src/adapters/**` | `test:opencode` 当前未启用 `--coverage`，不受影响；若未来 CI 启用覆盖率，需为 dsh 资产显式排除。本 Feature **未**改覆盖率配置 |

### A.4 预存失败测试对照（P-005，非本次引入）

| | 改动前 | 改动后 |
|--|--------|--------|
| `npm test` 失败套件 | 4 个（均为 `integration` 下 TypeScript 诊断失败）：`agent-integration` / `auto-updater-integration` / `session-idle-integration` / `simple-agent-integration` | **完全相同 4 个，同名** |
| 测试通过数 | 146 | **178**（+32，本次新增静态断言） |
| `npm run test:opencode` | ❌「No tests found」退出码 1 | ✅ 1 suite / 32 tests passed |
| `npm run test:core` | 131 passed | 131 passed（不变） |

**结论**：失败集合未扩大、未变化 → **未恶化**。

### A.5 未观测项（**不得记为通过**）

dsh 实机 **V1~V5**（装配可见 / 入口可用 / 单阶段走通 / 门禁行为 / 升级跟随）均**未观测**，
统一标注为「**待用户配合验证**」；方法与判据见 `docs/dsh/verification.md`，逐项分列见 tasks.md §5.3（EC-006）。

## 修订记录
> 记录本文档的版本变更历史

| 版本 | 变更说明 | 日期 | 修订人 |
|------|---------|------|--------|
| v1.0 | 初始创建 — 14/14 任务完成；全链回归通过；登记 4 项实现偏差、3 项命令漂移、3 项待观察项、预存失败对照与未观测项分列 | 2026-09-27 | SDDU Build Agent |
