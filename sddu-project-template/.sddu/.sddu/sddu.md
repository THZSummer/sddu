<!--
  版本字段 = SDDU 唯一版本源。所有版本号以本文档头部为准。
-->
<!-- version: v6.0.0 -->

# SDDU — 方法论内核

> 本文档是 SDDU 的**唯一权威**：7 阶段流程、三原则、状态模型、文档契约、路由表、门禁/状态协议、读取规则，全部以本文档为准。
> 其余所有载体（模块指令、契约模板、索引、README）仅**引用**本文档，不得转写方法论——改本文档一处，全体系生效。
> 本文档**零平台特定事实**：不绑定任何宿主平台、安装命令或平台路径。

## 1. 三原则

SDDU 的一切行为受三条原则约束，任何阶段不得违反：

1. **不跳步** — 阶段严格单向推进（registered → … → validated），不得跳过或回退。
2. **不越界** — 每个阶段只产出本阶段的产物，不代做上下游的决策与内容。
3. **文档即状态** — 状态与产物都是文档，无独立的机器状态副本；目录与文件本身即真相。

## 2. 两字段状态模型

每个 Feature 的状态由两个字段描述，二者正交：

### 2.1 phase（8 值，单向不可逆）

```
registered → discovered → specified → planned → tasked → builded → reviewed → validated
```

- 相邻推进合法；同 phase 为 no-op；**回退拒绝**；**跳跃拒绝**（并列出缺失的中间阶段）。
- **父特性天花板**：父 Feature（有子 Feature）禁止推进超过 `planned`（其阶段操作在叶子 Feature 上进行）。
- **FR-006 语义**：推进到 `validated` 且 status=`tracked` 时，status 自动置 `completed`（无二次确认）。

### 2.2 status（5 值）

```
tracked（正常追踪，新建默认） / completed（终态） / suspended（搁置） / terminated（终止） / merged（迁出）
```

- **可逆表**：仅 `suspended → tracked` 可逆；`completed` / `terminated` / `merged` 为终态，不可离开。
- 标记命令见 §7；标记终态（terminated/merged）需**二次确认**。

## 3. 7 阶段流程与文档契约

| 阶段 | phase | 产物 | 前置产物（目录约定直查） |
|------|-------|------|--------------------------|
| 0 立项 | registered | （仅建 Feature 目录 + state.md） | — |
| 1 问题挖掘 | discovered | discovery.md | — |
| 2 需求定义 | specified | spec.md | discovery.md |
| 3 技术设计 | planned | plan.md + ADR-XXX（可多个） | spec.md |
| 4 任务排布 | tasked | tasks.md | spec.md + plan.md |
| 5 实施构建 | builded | build.md + 实际产物 | spec.md + plan.md + tasks.md |
| 6 产物审查 | reviewed | review.md（策略）+ review-report.md（报告） | build.md |
| 7 产物验证 | validated | validate.md（策略）+ validate-report.md（报告） | build.md |

**产物存在性判定**：直接检查 Feature 目录内约定文件名是否存在（**目录即真相**，不维护产物注册副本）。

**Feature 目录命名**：`specs-tree-<version>-<slug>`（version 三段式、次段两位零填充保字典序；slug 为特性短名）；state.md front-matter 的 `feature` = 去前缀的 `<version>-<slug>`。

**ADR 存储**：ADR 随 Feature 存储于其目录内（无独立 architecture/ 目录）。

## 4. 路由表

收到 `<stage> <feature>` 请求时，按下表路由到对应模块；不满足前置则拒绝。

| 模块 | 阶段 | 二维时序 |
|------|------|----------|
| sddu-discovery | 问题挖掘 | — |
| sddu-spec | 需求定义 | — |
| sddu-plan | 技术设计 | — |
| sddu-tasks | 任务排布 | — |
| sddu-build | 实施构建 | — |
| sddu-review | 产物审查 | **策略**（review.md）plan 后即可；**报告**（review-report.md）build 后 |
| sddu-validate | 产物验证 | **策略**（validate.md）plan 后即可；**报告**（validate-report.md）build 后 |
| sddu-fast | 快速模式 | 零产物、单会话、不推进 phase |
| sddu-roadmap | 版本规划 | 独立 |
| sddu-docs | 项目全景 | 独立 |

**二维时序**：`planned` 完成后，正向建设链（tasks → build）与逆向检验准备链（review/validate **策略设计**）可并行推进；**报告执行**（review-report / validate-report）须待 build 完成。

## 5. 门禁协议

进入目标阶段前，按顺序校验，任一失败即拒绝（不写 state.md、不产出产物）：

1. **相邻性**：目标 phase 必须 = 当前 phase 的下一阶段（`+1`）；跳步/回退 → 拒绝。
2. **前置产物**：目标阶段的前置产物文件存在且非空（见 §3）→ 缺失则拒绝并列出缺失项。

拒绝块（单行，进入会话日志可检索）：
```
[SDDU-GATE-DENY] {"feature":"<feature>","from":"<current>","to":"<target>","missing":["<缺失产物>"],"reason":"<跳步/回退/前置产物缺失>","action":"none"}
```
放行块：
```
[SDDU-GATE-ALLOW] {"feature":"<feature>","from":"<current>","to":"<target>","prereq":"<已确认产物>","action":"proceed"}
```

> 门禁为**软引导**：其约束力来自执行 Agent 对协议的遵从，无宿主运行时强制点。

## 6. 状态同步协议（完成协议）

阶段完成后的**唯一推进路径**（无事件驱动的自动推进）：

1. 确认产物已落盘（非空）；
2. 更新 Feature 的 `state.md` front-matter：`phase` 改为目标阶段；`phaseHistory` **追加**一条（`phase` / `timestamp` / `triggeredBy` / `comment`），不重写既有条目；
3. 输出同步记录（单行）：
```
[SDDU-STATE-SYNC] {"feature":"<feature>","from":"<current>","to":"<target>","artifact":"<产物文件名>","phaseHistoryAdded":true,"ts":"<ISO8601>"}
```

**依赖校验**（推进时执行）：若本 Feature 声明了 `dependencies`，则每个依赖 Feature 的 phase 必须 ≥ 本 Feature 的目标 phase，否则阻断推进并列出未就绪依赖；依赖缺失仅警告不阻断；循环依赖检测发现环时报错。

## 7. 标记命令族

管理 Feature 流转状态（status）：

```
标记 <feature> suspended  [--until <YYYY-MM-DD>] [--note <文本>]
标记 <feature> terminated
标记 <feature> merged     --into <target-feature>
标记 <feature> tracked    （恢复追踪）
```

- `terminated` / `merged` 需**二次确认**（不可逆）；`merged` 缺 `--into` 报错。
- `--until` 写入 `suspendedUntil`（可选字段）；`--note` 写入 state.md 正文。
- 标记只写该 Feature 的 `state.md`（单一落点）。

## 8. 仪表盘读取规则

读状态时按 6 区分类输出：

| 区 | 筛选 |
|----|------|
| 🟢 进行中 | status=tracked 且 phase≠validated（按 phase 倒序；含停滞检测） |
| ✅ 已完成 | status=completed，或 phase=validated 且 status=tracked |
| 🟡 搁置 | status=suspended（含到期提醒：suspendedUntil ≤ 今日 → 🔔） |
| 🔴 终止 | status=terminated |
| 🔵 迁出 | status=merged（含目标存在性检查：mergedInto 目录不存在 → ⚠️） |
| ⚠️ 异常 | 缺 state.md、phase/status 非法、completed 但 phase≠validated 等 |

- **停滞检测**：由 phaseHistory 末条时间戳现算（默认 30 天阈值），零存储。
- **子随父归**：非 tracked 父 Feature 下的子 Feature 归入父节点展示，不独立分区、不参与计数。
- **下一步推荐**：仅 status=tracked 且 phase≠validated 的 Feature 推荐下一阶段。

## 9. 读取规则

入口调度与资源读取的通用规则：

1. **唯一入口**：`.sddu/.sddu/sddu.md`（本文档）是唯一入口实质；索引文件（`.agents/skills/sddu/SKILL.md`）仅引导 Agent 加载本文档。
2. **模块读取**：路由到 `sddu-<stage>` 后，读取 `.sddu/.sddu/modules/sddu-<stage>/sddu-<stage>.md`（阶段指令）。
3. **契约读取**：阶段产物格式遵循 `.sddu/.sddu/modules/sddu-<stage>/contracts/<contract>.md`。
4. **用户钩子**（执行阶段前/后按需读取，空则跳过）：`workspace/.sddu-config/modules/sddu-<stage>/sddu-<stage>-{before,after}.md`。
5. **用户契约覆盖**（优先，缺省回退内核契约）：`workspace/.sddu-config/modules/sddu-<stage>/contracts/<contract>.md`。
6. **状态读取**：逐 Feature 读 `state.md`（分布式状态，无单一根状态文件）。

## 10. state.md front-matter 字段契约

```yaml
---
feature: <version>-<slug>          # 与目录名 specs-tree-<version>-<slug> 对应
featureId: <FR-xxx>                # 立项编号
name: <人类可读名>
version: <vX.Y.Z>                  # 目标发布版本
phase: <registered|discovered|specified|planned|tasked|builded|reviewed|validated>
status: <tracked|completed|suspended|terminated|merged>
depth: <int>                       # 嵌套深度（specs-tree- 出现次数 - 1）
childrens: []                      # 子 Feature 摘要（path/featureName/phase/status）
phaseHistory: []                   # 每项：phase/timestamp/triggeredBy/comment
dependencies: []                   # 可选：本 Feature 依赖的其他 feature id（单向声明，反向视图由扫描推导）
suspendedUntil: <YYYY-MM-DD>       # 可选：仅 status=suspended 有意义
mergedInto: <feature id>           # 可选：status=merged 时必填
description: <一句话摘要>
---
```

- 正文承载人类可读摘要（当前阶段 / 下一步 / 负责人 / 更新时间 / 定稿标记）。
- 挂起原因（--note）进正文，不进 front-matter。
- **不维护**：产物注册字段（files）、文件反推 phase、隐式状态修复——均非状态本质，由「目录即真相」与「完成协议」取代。

## 11. 安装范式速览

- **二分**：`.sddu/.sddu/` = 本体（可重建，升级删建即恢复版本一致）；`.sddu/workspace/` = 用户产物（安装/升级绝不触碰）。
- **安装** = 复制模板整树（`cp -r`），源路径 = 安装后路径，零构建、零打包、零路径改写。
- **索引唯一**：`.agents/skills/sddu/SKILL.md`（一份，全平台统一，仅引导加载本文档）。
