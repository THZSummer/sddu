# 验证报告：specs-tree-dsh-adaptation

> **文档定位**: SDDU 验证报告 — 逐项记录自主验证的执行结果，作为工作流终点
> **验证策略**: validate.md（V1~V22 验证场景 + 五维度指引，v1.0，已冻结）
> **前置依赖**: validate.md（验证策略）、spec.md（需求规范 v1.0）、review-report.md（审查报告，状态 passed-with-conditions）
> **验证对象**: build 产物（commit `1300ee7`，分支 `feature/dsh-adaptation`）+ `dist/` 本地生成物（`npm run build` 重建）+ 就地修复产物（C44/C48）
> **创建人**: SDDU Validate Agent
> **创建时间**: 2026-09-27
> **验证轮次**: R1
> **版本**: v1.0
> **更新人**: SDDU Validate Agent
> **更新时间**: 2026-09-27
> **更新说明**: 初始创建 — 按 validate.md 层 A（V6~V22，17 项）执行本地自动化验证；层 B（V1~V5，5 项）核对用户执行手册交付状态；执行授权就地修复 C48（`dual-platform-diff.md` 补快照日期）/ C44（补边界错误路径测试），C45 登记为已知技术债；未执行任何 dsh 实机操作

> **执行方式声明**：本轮以**动态执行**为主 —— `npm run build` / `node build-dsh-skills.cjs`（幂等 ×2）/ `npx tsc --noEmit` / `npx jest` / `node scripts/package.cjs` / `bash -n` / 临时目录安装-卸载 / grep+diff+node 结构断言。**未执行任何 dsh 实机操作**；V1~V5 属 NG-002 范围外，一律记为「待用户配合验证（未观测）」，不计入失败，亦不表述为「通过」。

---

## 1. 验证概要
> 验证结果的量化总览

| 维度 | 数值 |
|------|:--:|
| 验证项总数 | **22**（V1~V22） |
| 通过 | **17**（层 A：V6~V22） |
| 失败 | **0** |
| 无法执行 | **5**（层 B：V1~V5，待用户配合，非阻断） |
| 阻塞问题 | **0** |
| 就地修复项 | **2**（C48 快照日期标注、C44 边界错误路径测试） |
| 登记技术债 | **1**（C45 生成物 `generatedAt` 时间戳致非字节可复现，用户授权不修复） |
| 严重漂移 | **0** |
| 结论 | **⚠️ 有条件通过**（层 A 全过；唯一条件为 C45 已登记技术债） |

---

## 2. 逐项验证结果（V1~V22）
> 对照 validate.md 中定义的验证场景，逐项执行并记录实测结果

| # | 验证对象 | 验证步骤（摘要） | 预期结果 | 实测结果 | 判定 |
|:--:|------|---------|---------|---------|:--:|
| **V1** | 装配可见（FR-001） | dsh Web UI 列 skill + 来源标识 + 冲突提示 | 11 条目可见、来源可辨、无静默遮蔽 | 未执行（dsh 无 CLI，需用户 Web UI 观测）；手册见 `docs/dsh/verification.md` §V1 | ⏭️ 待用户配合 |
| **V2** | 入口可用（FR-002） | `/sddu` 与非法阶段输入 | 进入正确阶段；非法输入 `[SDDU-ROUTE-REJECT]` 且不误推进 | 未执行（需用户 Web 会话） | ⏭️ 待用户配合 |
| **V3** | 单阶段走通（FR-003/005） | 走通 discovery + 三方对账 | 产物合法、`state.json` 一致、含 SYNC 记录 | 未执行（需用户 Web 会话 + `.sddu` 工作区） | ⏭️ 待用户配合 |
| **V4** | 门禁行为观测（FR-004） | 制造非法跃迁 | `[SDDU-GATE-DENY]` 且不推进 + 文档降级声明 | 未执行（需用户 Web 会话）；降级声明已静态核实（V15/V18 通过） | ⏭️ 待用户配合 |
| **V5** | 升级跟随（FR-007/NFR-001） | 升级后重复 V1~V3 + 成本基线 | 可定位破坏点、模板 9 字段填齐 | 未执行（依赖 dsh 升级时机）；清单/模板已静态核实（V17 通过） | ⏭️ 待用户配合 |
| **V6** | 构建完整性（全链 build） | `npm run build` | 退出码 0；`dist/dsh` 与 `dist/sddu` 同级并列 | 退出码 **0**（20.39s）；`build:agents→build:ts→postbuild/build:dsh` 全过；`dist/dsh/`、`dist/sddu/`、`dist/sddu.zip` 同级并列 | ✅ |
| **V7** | dsh 生成物结构与幂等 | `build-dsh-skills.cjs` ×2 比对 | 退出码 0；恰 11 目录；二次运行除 `generatedAt` 外字节一致 | 两次退出码均 **0**；`skills` 树 sha256 前后一致（`fa69a8fb…`）；目录数 **11**；空 `SKILL.md` **0** | ✅ |
| **V8** | manifest 版本锚定与契约哈希 | node 比对 `dist/dsh/manifest.json` 四等式 | 4 项等式全部成立 | `sdduVersion`=1.1.0 == `package.version`；`dshContractSnapshot`=="2026-08-14"；`contractManifestHash`=`cb3c08db…`（==源清单 sha256）；`skills.length`=11 → **全成立** | ✅ |
| **V9** | jest 生成物静态断言套件 | `jest --selectProjects opencode --testPathPatterns adapters/dsh` | 全绿；用例数 ≥ 8 | 退出码 **0**；**36 passed / 36**（8 组 describe；原 32 + C44 新增 4），jest 30.2.0 | ✅ |
| **V10** | 类型检查 | `npx tsc --noEmit` | 退出码 0 | 退出码 **0**（无输出；C44 修复后复跑仍 0） | ✅ |
| **V11** | 核心域零泄漏 + 孤立代码 | grep 核心域 + 扫描白名单外 dsh 文件 | 核心域命中 0；无白名单外 dsh 文件；`src/index.ts` 无 dsh | 核心域命中 **0**；白名单外 dsh 命名源文件 **0**（全部收敛于 `src/adapters/dsh/`）；`src/index.ts` 无 dsh | ✅ |
| **V12** | 单向依赖 + 零改动白名单 + 纯追加 | grep 依赖 + `git status` + `git diff --numstat` | 无越界依赖；白名单零改动；4 MODIFY 删除行 0 | `adapters/opencode` 在 dsh 资产内命中 **0**；白名单（install.sh/ps1、src/index.ts、adapters/opencode、state、templates/agents）**零改动**；4 MODIFY 删除行 **0**（README +17/0、jest.config.ts +1/0、package.json +3/0、package.cjs +16/0） | ✅ |
| **V13** | 打包隔离与同级并列 | `node scripts/package.cjs` + zip 校验 + 目录核验 | `dist/dsh`/`dist/sddu` 同级；zip 无 `dsh/`；skills 11 | 退出码 **0**；`dist/dsh` 与 `dist/sddu` 同级并列；`dist/sddu.zip` 内 `dsh/` 条目 **0**；`dist/sddu` 内 dsh 命中 **0**；`dist/sddu/adapters/` 仅 `opencode`；skills **11** | ✅ |
| **V14** | 入口清单 ↔ phase 枚举一致性 | node 校验 `router-command-map.json` | skills/entries=11；模板存在；别名 ⊆ VALID_PHASES；与 `SKILL_NAMES` 一致 | skills **11**、entries **11**；`sourceTemplate` 全部真实存在；`phaseAliases` 目标 ⊆ `VALID_PHASES`（8 项，非法 0）；`index.SKILL_NAMES` == map 同序同集 | ✅ |
| **V15** | 结构化协议块完备性 + 禁用语 | node 扫描生成物 | 三段协议 + 降级声明齐备；禁用语合规 | 7 阶段 `SKILL.md` 均含 DENY/ALLOW/STATE-SYNC + 「已知降级」+「非硬强制」+ `action` none/proceed；路由含 `[SDDU-ROUTE-REJECT]`；「硬强制」仅出现在否定语境（逐文件两项计数相等）；`强制执行`/`运行时硬拒绝` 命中 **0** | ✅ |
| **V16** | 指令单一来源（R-DSH-05） | node 抽样 + grep + `git status` | 生成物含源模板正文；隔离层无正文副本；源模板零写 | 11 生成物含其 `sourceTemplate` heading 且含 BEGIN/END 边界标记；`src/adapters/dsh` 内 heading 口径命中 **0**；`src/templates/agents` 零写 | ✅ |
| **V17** | 文档交付完整性 + 跨文档引用一致 | node/bash 核对六份文档与引用 | 六份齐备且交叉引用一致 | `docs/dsh/` 六份齐备；`verification.md` V1~V5 均含 步骤/观测方式/通过判据/配合方；`positioning.md` **4** 判定示例（≥3）；`upgrade-following.md` 步骤 0~6 + 破坏点模板 **9/9** 字段；README 入口清单覆盖 **11/11**；`contract-dependencies.md` 覆盖 **7/7** 依赖点；plan §5 文件影响 **21/21** 存在 | ✅ |
| **V18** | 时效快照 + 降级声明跨文档一致 | node/bash grep | 无过时快照冒充当前事实；口径一致 | 6 份文档均含 `2026-08-14`；manifest `dshContractSnapshot`=="2026-08-14"；5 份声明文档均含「FR-004b + 非硬强制」；README/upgrade-following 含「未刷新即不可信」→ **修复后全过**（C48 已补 `dual-platform-diff.md` 日期与措辞） | ✅ |
| **V19** | 契约依赖清单结构完备 | node 校验源清单 | snapshot=2026-08-14；deps≥7；8 字段；7 类；3 缺口标注 | 顶层快照=="2026-08-14"；dependencies **7**；每条 **8** 非空字段；`snapshotDate` 全 == 快照；**7** 类 area 全覆盖；`command-registration`(known-gap)/`profile-bundle`(snapshot-uncovered)/`guard-pipeline`(evolution-point) 均有缺口标注 | ✅ |
| **V20** | 安装/卸载脚本静态 + 功能 | `bash -n` + `--help` + 临时目录安装/卸载 | 全部通过；落位 11；残留 0；无 dsh CLI | `bash -n` 均 **0**；`--help` 均 **0** 且无副作用；安装到临时项目根落位 `sddu*` **11**；卸载后残留 **0**；无 dsh CLI 子命令调用；`install.sh`/`install.ps1` 零改动 | ✅ |
| **V21** | 既有链路回归（OpenCode 零污染） | `npm run test:core` + `test:opencode` | 两条全绿 | `test:core` **6 suites / 131 passed**（与 build 基线一致）；`test:opencode` **1 suite / 36 passed**（原 32 + C44 新增 4） | ✅ |
| **V22** | 边界与错误路径 | 构造非法 phaseTarget/缺模板 + 非法 phase 枚举 + EC-008 文本 | 错误路径可观测且不静默通过 | 夹具内非法 `phaseTarget` → 退出码 **1** 且打印「phaseTarget 非法」；缺失源模板 → 退出码 **1** 且「不存在」可定位；`validateContractManifest` 非法 phase 枚举/缺 area → 抛 `DshContractError`（jest 组 9）；`gate-protocol.md.hbs` 含「落盘失败→不推进」 | ✅ |

---

## 3. 验证详细信息
> 按验证维度展开的详细执行结果

### 3.1 测试覆盖
> 运行测试套件的结果

| 需求 ID | spec 描述 | 测试用例 | 执行结果 | 覆盖率 |
|---------|----------|---------|:--:|:--:|
| FR-001 | Skill 包装配与落位 | `skill-package.test.ts` 组 1/6 + V7/V14/V17 | ✅ | 已覆盖（V1 待用户） |
| FR-002 | 命令入口与阶段路由 | 组 2/3 + V14/V15 | ✅ | 已覆盖（V2 待用户） |
| FR-003 | 单阶段流程承载与产物落盘 | 组 5 + V6/V7/V16 | ✅ | 已覆盖（V3 待用户） |
| FR-004 | 阶段门禁承载的目标与约束 | 组 3/4 + V15/V22 | ✅ | 已覆盖（V4 待用户） |
| FR-005 | 状态推进与 state.json 一致性 | 组 3 + V15 | ✅ | 已覆盖（V3 待用户） |
| FR-006 | 验证方法与验证场景 | `docs/dsh/verification.md`（V17 核对） | ✅ | 已覆盖（文档类；V1~V5 待用户） |
| FR-007 | 升级跟随机制 | 组 6 + V8/V17/V19 | ✅ | 已覆盖（V5 待用户） |
| FR-008 | 安装 / 卸载 / 升级路径 | V17/V20 | ✅ | 已覆盖 |
| FR-009 | 适配层隔离边界 | 组 1/7/8 + V11/V12/V13/V21 | ✅ | 已覆盖 |
| FR-010 | 与 dsh 原生方法论的分工定位 | `docs/dsh/positioning.md`（V17 核对） | ✅ | 已覆盖（文档类） |

> FR 覆盖 **10/10 = 100%**。FR-006 / FR-010 为文档类需求，验收标准即文档交付，由 V17 静态核对确认，不计为未覆盖。层 B 实机观测（V1~V5）为既定范围外（NG-002），不影响 FR 实现覆盖判定。

**NFR 覆盖**：NFR-001（V8/V19）、NFR-002（V9/V14/V16/V17）、NFR-003（V9/V15）、NFR-004（V6/V10/V11/V12/V13/V21）、NFR-005（V17 时间预算）、NFR-006（V17）、NFR-007（V8/V18）→ **7/7 = 100%**（≥ 80% 门槛）。

### 3.2 接口数据
> 本 Feature 无 HTTP API / DB schema（validate.md §2.2 口径重构）；以静态**数据契约**一致性校验替代

| 检查项 | 调用方式 | 预期 | 实测 | 一致？ |
|--------|---------|------|------|:--:|
| `dist/dsh/manifest.json` 版本锚定 | `verify-manifest.cjs`（node） | 4 项等式成立 | `sdduVersion`=1.1.0、快照=2026-08-14、hash=`cb3c08db…`==sha256、skills=11 | ✅ |
| `dsh-contract-manifest.json` 结构 | `verify-manifest.cjs` | 快照一致 / deps≥7 / 8 字段 / 7 类 / 3 缺口 | 7 依赖点、8 字段全非空、7 类齐全、3 缺口标注 | ✅ |
| `router-command-map.json` 入口契约 | `verify-manifest.cjs` | skills/entries=11；模板存在；别名 ⊆ VALID_PHASES | 11/11；模板 0 缺失；别名非法 0 | ✅ |
| 四个结构化协议块字段 | node 生成物扫描 | DENY/ALLOW/ROUTE-REJECT/STATE-SYNC 字段完整 | 7 阶段含三段协议 + 路由含 REJECT；`action` none/proceed 齐备 | ✅ |
| 文档 ↔ 单一来源引用 | `check-docs.cjs` | README/contract-deps/verification 与来源一致 | README 11/11、contract-deps 7/7、verification V1~V5 四要素齐备 | ✅ |

### 3.3 构建脚本
> 构建、lint、类型检查执行结果

| 命令 | 退出码 | 耗时 | 输出摘要 | 结果 |
|------|:--:|------|---------|:--:|
| `npm run build` | **0** | 20.39s | `build:agents→build:ts→build:dsh`；11 SKILL + manifest + 6 文档 | ✅ |
| `node scripts/build-dsh-skills.cjs` ×2 | **0** | — | skills 树 sha256 一致 `fa69a8fb…`（幂等） | ✅ |
| `npx tsc --noEmit` | **0** | — | 无输出 | ✅ |
| `node scripts/package.cjs` | **0** | — | `dist/sddu.zip` 无 `dsh/`；`dist/dsh`/`dist/sddu` 同级 | ✅ |
| `bash -n scripts/install-dsh.sh && uninstall-dsh.sh` | **0** | — | 语法通过 | ✅ |
| `npx jest --selectProjects opencode --testPathPatterns adapters/dsh` | **0** | 11~24s | 36 passed / 36 | ✅ |
| `npm run test:core` | **0** | — | 6 suites / 131 passed | ✅ |
| `npm run test:opencode` | **0** | — | 1 suite / 36 passed | ✅ |

> 说明：validate.md 记为 `--testPathPattern`，jest 30 已更名为 `--testPathPatterns`（review 偏差 A7 已登记）。实测 jest 版本 **30.2.0**（build 报告记 30.3.0，轻微记录差异，不影响结论）。

### 3.4 性能边界
> NFR 性能指标实测

| NFR / EC | 指标要求 | 实测值 | 偏差 | 达标？ |
|-----|---------|-------|------|:--:|
| 性能 NFR（NFR-001~007） | 无运行时性能指标 | N/A | N/A | 不适用（validate.md §7 声明：无性能 NFR，端到端不在范围 NG-002） |
| EC-001 破坏性升级 | 清单定位 + 记录 | `upgrade-following.md` 步骤 0~6 + 9 字段模板（V17 核对） | 无 | ✅ |
| EC-002 rank 遮蔽冲突 | 显式提示不静默 | `install-dsh.sh` 近义/同名条目提示段（V20） | 无 | ✅ |
| EC-003 门禁无法硬承载 | 如实声明已知降级 | 「硬强制」仅否定语境；`FR-004b`/`非硬强制` 跨文档一致（V15/V18） | 无 | ✅ |
| EC-004 未被注册表发现 | 落位自检 + 提示 | 安装/卸载输出自检、非零退出（V20） | 无 | ✅ |
| EC-005 state 与会话/产物不一致 | 报告不一致禁静默覆盖 | `state-sync-protocol.md.hbs` §3 三方对账（V15） | 无 | ✅ |
| EC-006 无 CLI 无法自动断言 | 人工清单 + 显式缺口声明 | `verification.md` §0/§4 显式声明（V17） | 无 | ✅ |
| EC-007 命名/近义冲突 | `sddu-` 前缀 + 来源标识 | 命名约定与裁决（V14/V20） | 无 | ✅ |
| EC-008 产物落盘失败 | 报错 + 回退 + 不推进 | `gate-protocol.md.hbs` 含「落盘失败→不推进」（V22） | 无 | ✅ |
| EC-009 混用原生 plan mode | 可观测提示与建议 | `positioning.md` §4 + 4 判定示例（V17） | 无 | ✅ |

### 3.5 漂移检测
> 实现与规范的偏离扫描

| 漂移类型 | 检测命令/方法 | 结果 |
|---------|-------------|------|
| 孤立代码（有代码无需求） | `find src -iname '*dsh*'` 排除 `adapters/dsh` 与 `__tests__` | ✅ 无（白名单外 0） |
| 需求缺失（有需求无代码） | plan §5 的 21 项文件影响存在性核对 | ✅ 0 缺失（21/21 存在；`src/shared/platform-adapter.ts` 为 plan 第 23 行**声明「未实现」**的负向提及，非缺失） |
| 规格漂移（spec/plan 被修改） | `git show --name-only 1300ee7` 核对 spec.md/plan.md | ✅ 无（spec.md / plan.md 未改动；tasks.md 为**纯追加** +70/0、tasks.json 为任务状态回填 14/14，属 build 记账，非规格语义漂移） |
| 核心域概念渗透 | `grep -rEl 'dsh\|rank\|\.dsh/skills' src --include='*.ts'`（排除 dsh 资产/测试） | ✅ 命中 0（R-DSH-02） |
| 双平台表述漂移 | 生成物含源模板正文（单一来源）+ 入口清单一致 | ✅ 0（V16/V14） |
| 时效漂移 | `2026-08-14` 快照标注跨文档一致 | ✅ 0（V18，修复后） |

---

## 4. 验证脚本执行记录
> ADR-003 落地：validate Agent 自主编写并直接执行的验证脚本记录
> 脚本存放路径：`/tmp/sddu-validate-specs-tree-dsh-adaptation-20260927-140950/`

| 脚本文件 | 用途 | 对应场景 | 退出码 | 关键输出 |
|---------|------|:--:|:--:|---------|
| `v7-idempotency.sh` | dsh 生成物结构与幂等（连跑 ×2 比对 sha256） | V7 | 0 | skills 树 sha256 一致 `fa69a8fb…`；11 目录；空 SKILL.md 0 |
| `verify-manifest.cjs` | 版本锚定与数据契约（manifest / 入口清单 / 契约清单） | V8 / V14 / V19 | 0 | `RESULT=ALL_PASS`（sdduVersion/hash/快照/skills/别名/字段/7 类全成立） |
| `check-docs.cjs` | 文档完整性与跨文档引用/时效口径 | V17 / V18 | 0 | `RESULT=ALL_PASS`（六份齐备、V1~V5 四要素、9/9 字段、11/11 入口、7/7 依赖、日期与降级口径一致） |
| `verify-error-paths.cjs` | 构建错误路径（缺模板→非零退出）+ EC-008 文本 | V22 | 0 | 缺模板退出码 1；「不存在」可定位；gate-protocol 含 EC-008 语义 |
| `v11-v12-v16-output.txt` / `v11-v16-precise.txt` | 核心域零泄漏 / 单向依赖 / 白名单 / 单向来源扫描 | V11 / V12 / V16 | 0 | 核心域命中 0；白名单零改动；4 MODIFY 删除行 0；heading 口径无正文副本 |
| `v20-*`（install/uninstall 日志） | 安装/卸载静态 + 临时目录功能 | V20 | 0 | `bash -n` 0；落位 11；卸载残留 0；无 dsh CLI |
| `v15-output.txt` | 协议块完备性 + 禁用语 | V15 | 0 | 三段协议 + 降级声明齐备；禁用语 0 命中 |
| `v6-build.log` / `rebuild-dsh.log` / `final-*` | 全链构建 / 打包 / 回归 | V6 / V13 / V21 | 0 | build/package/test:core/test:opencode 全绿 |

> 路径约定说明：所有验证脚本写入 `/tmp/sddu-validate-specs-tree-dsh-adaptation-<timestamp>/`，由 validate Agent 自主编写、直接执行，不走 task→build 流水线。C44 授权的边界测试落为**长期回归资产**（`src/__tests__/unit/adapters/dsh/skill-package.test.ts` 组 9），非临时脚本。

### 4.1 就地修复记录（用户授权）

| 修复项 | 文件 | 变更内容 | 重验结果 |
|------|------|---------|---------|
| **C48**（补快照日期标注） | `docs/dsh/dual-platform-diff.md` | 头部新增「时效锚定」行（dsh 事实锚定 **2026-08-14** 快照，未刷新前不可信）；门禁行补「（FR-004b，**非硬强制**）」 | V18 复跑通过；`dist/dsh/docs/` 重建同步；V15 禁用语计数仍相等 |
| **C48 附**（口径统一） | `docs/dsh/upgrade-following.md` | 第 173 行补「（**FR-004b**，**非硬强制**）」 | V18 复跑通过 |
| **C44**（补边界/错误路径测试） | `src/__tests__/unit/adapters/dsh/skill-package.test.ts` | 新增 describe 组 **9「边界与错误路径」** 共 **4** 用例：① 非法 `phaseEnum` → `validateContractManifest` 抛 `DshContractError`；② 缺失 `area` → 抛错；③ 夹具内非法 `phaseTarget` → 构建脚本非零退出且错误可定位；④ 夹具内缺文档 → warning 不失败（退出码 0）。另新增隔离夹具辅助 `makeBuildFixture`/`runBuildScript` | jest **32 → 36** 全绿；`tsc --noEmit` 退出码 0；`test:core` 131 passed 不回归 |

### 4.2 已知技术债登记

| 项 | 位置 | 说明 | 处置 |
|------|------|------|------|
| **C45** | `scripts/build-dsh-skills.cjs` → `docs/dsh/contract-dependencies.md` | 该文档受版本控制，每次构建因 `generatedAt` 时间戳变化导致**非字节可复现**（实测 diff 仅 1 行时间戳 `.855Z → .800Z`），使 `npm run build` 弄脏工作树 | **不修复**（用户授权）；登记为已知技术债。可选后续优化：移除 `generatedAt` 行（保留哈希锚定）或改为构建产物 gitignore |

---

## 5. 阻塞问题
> 必须修复后才能通过验证的问题

**无阻塞问题（= 0）**。层 A 全部 17 个场景（V6~V22）通过；2 项授权就地修复（C48/C44）完成并重验通过。

---

## 6. 结论
> 验证最终结论

**结论**: **⚠️ 有条件通过**（层 A 全过、0 阻塞、0 严重漂移；唯一非阻塞条件为已登记技术债 C45）

**指标达标矩阵**：

| 指标 | 要求 | 实测 | 达标？ |
|------|------|------|:--:|
| FR 测试覆盖 | 100% | 10/10 = 100% | ✅ |
| NFR 测试覆盖 | ≥ 80% | 7/7 = 100% | ✅ |
| 构建退出码 | 0 | 0（`npm run build` / `package.cjs` / `tsc`） | ✅ |
| 阻塞问题数 | 0 | 0 | ✅ |
| 漂移项 | 0 | 0（孤立代码 0 / 需求缺失 0 / 规格漂移 0 / 概念渗透 0 / 时效漂移 0） | ✅ |
| 层 A 场景通过 | 17/17 | 17/17 | ✅ |
| 层 B 交付 | 用户手册（如实标注未观测） | `docs/dsh/verification.md` 交付；V1~V5 记为「待用户配合」 | ✅ |

**理由**：

1. **层 A 全绿** —— V6~V22 共 17 个本地自动化场景全部通过：构建/打包退出码 0；生成物幂等且恰 11 个；manifest 四项等式成立；jest 36 用例全绿；`tsc` 0 错；核心域零 dsh 概念泄漏、单向依赖、白名单零改动、4 MODIFY 纯追加（删除行 0）；协议块与禁用语合规；指令单一来源；文档六份齐备且交叉引用一致；安装/卸载功能验证通过；既有链路回归全绿。
2. **2 项授权修复完成并重验** —— C48（`dual-platform-diff.md` 补 `2026-08-14` 快照日期 + 口径统一）与 C44（补边界/错误路径测试共 4 用例，32→36 全绿）已就地完成，修复后受影响场景（V18/V9/V10/V21）与全量测试（`test:core`+`test:opencode`）重跑通过。
3. **唯一非阻塞条件** —— C45（生成物 `generatedAt` 时间戳致 `docs/dsh/contract-dependencies.md` 非字节可复现）为预存技术债，用户已明确授权**不修复**并登记；不改变设计语义，不影响任何 FR/NFR/EC 的实现正确性与交付完整性。因存在该已登记非阻塞偏差，结论取「⚠️ 有条件通过」而非「✅ 通过」。
4. **层 B 如实分列** —— dsh 实机 V1~V5 属 NG-002 范围外，一律标注「待用户配合验证（未观测）」，未表述为「通过」；用户执行手册 `docs/dsh/verification.md` 已交付。
5. **漂移为 0** —— spec.md/plan.md 在 build 期间未被修改；tasks.md/json 的改动为 build 记账（纯追加 + 任务状态回填）；无孤立代码、无需求缺失、无核心域概念渗透、无时效漂移。

---

## 7. 产物关联

| 文件 | 性质 | 状态 |
|------|------|:--:|
| `validate.md` | 验证策略（V1~V22，已冻结） | ✅ 已确认 |
| `validate-report.md`（本文件） | 验证报告（R1） | ✅ 已产出 |
| `state.json` | 状态跃迁 `reviewed → validated`；登记 `files.validate` / `files.validationReport` | ✅ 已更新 |

---

## 修订记录
> 记录本文档的版本变更历史

| 版本 | 变更说明 | 日期 | 修订人 |
|------|---------|------|--------|
| v1.0 | 初始创建（R1）— 执行 validate.md 层 A（V6~V22，17 项）全部通过；层 B（V1~V5）核对用户手册交付并记为「待用户配合（未观测）」；完成授权就地修复 C48（快照日期/口径）与 C44（边界错误路径测试 4 用例）；C45 登记为已知技术债；漂移 0 / 阻塞 0；结论 ⚠️ 有条件通过 | 2026-09-27 | SDDU Validate Agent |
