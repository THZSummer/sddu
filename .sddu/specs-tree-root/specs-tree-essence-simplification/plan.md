# 技术计划：specs-tree-essence-simplification

> **文档定位**: SDDU 技术方案 — 记录架构设计、方案对比和 ADR，作为 tasks 阶段的输入  
> **前置依赖**: spec.md（需求规范：8 FR / 7 NFR / 7 EC）  
> **创建人**: SDDU Plan Agent  
> **创建时间**: 2026-11-22  
> **版本**: v5.30  
> **更新人**: SDDU Plan Agent  
> **更新时间**: 2026-11-24  
> **更新说明**: 排查 L4 裁决 A 退役：files 产物注册字段退役——目录即真相，产物存在性直查不注册（副本即漂移源）；门禁语义保留、数据源换轨直查；与 L3 构成对照原则（声明补载体、副本删载体）；产出 ADR-017

## 1. 前置检查
> 启动技术规划前必须验证的前置条件

| 检查项 | 状态 |
|--------|:--:|
| spec.md 存在 | ✅（8 FR / 7 NFR / 7 EC） |
| 外部 API 文档缓存 | ✅ 不适用（无外部 API 依赖） |
| 前置依赖已满足 | ✅（discovery.md / spec.md 均在） |

## 2. 架构分析
> 分析现有架构影响和需要的新组件

**现有架构**（v4.0.0 三域分层）：方法论表述物理分散——`src/templates/agents/*.md.hbs`（11 个 Agent 指令源）承载阶段职责与方法论转写；`src/templates/outputs/`（30 个输出模板）承载文档契约转写；README / docs / dev-guide / dsh SKILL.md 各有一份方法论叙事；构建链（build-agents.cjs → dist/templates/agents；build-dsh-skills.cjs → dist/dsh/skills）只做复制/拼接、不做语义渲染。

**新增组件**：
1. `sddu-project-template/.sddu/.sddu/sddu.md`——方法论内核唯一权威文档（**以用户项目路径存在于仓库内，设计态即运行态**，ADR-007）：7 阶段流程定义 + 三原则 + 两字段状态模型（**状态载体 = state.md，front-matter 字段契约，2026-11-24 拍板**）+ 各阶段文档契约 + **路由表 + 门禁/状态协议 + 读取规则**（唯一入口，2026-11-24 拍板）+ 头部版本字段（唯一版本源）；零平台特定事实（NFR-001）
2. `carrier-inventory.md`（本 Feature 目录）——载体分类清单：按判定标准（ADR-002）逐项归类 + 用户确认记录列
3. **统一安装范式组件**（ADR-004，spec FR-008）：`.sddu/` 按 .sddu / workspace 二分；**唯一入口 = `.sddu/.sddu/sddu.md` 内核**（含路由表 + 门禁/状态协议 + 读取规则，随「升级=删建 .sddu」天然版本一致）；`.agents/skills/sddu/SKILL.md` 为**纯索引/引导**（内容极简稳定：引导 Agent 加载 `.sddu/.sddu/sddu.md`），收到 `<stage> <feature>` 由 sddu.md 路由表读取 `.sddu/modules/sddu-<stage>/sddu-<stage>.md`（.sddu 内部按业务模块组织，无 agent/skill 概念），执行前/后按需读取 `workspace/.sddu-config/modules/sddu-<stage>/sddu-<stage>-{before,after}.md` 用户钩子（空则跳过）；产物契约优先用 `workspace/.sddu-config/modules/sddu-<stage>/contracts/`（用户自定义模板，缺省回退 core 契约）；**索引落位唯一（`.agents/skills/sddu/`），不内置平台发现适配**（2026-11-23 拍板：平台 skill 识别问题非 sddu 核心，不支持该约定的平台由用户自行放置索引）；**设计态即运行态（ADR-007）**——`sddu-project-template/` 整棵树 = 用户项目根镜像（`.sddu/.sddu/ + .agents/skills/sddu/`），安装 = 复制粘贴整棵该目录，零路径改写、零构建、零清单（版本 = sddu.md 头部）

**数据流变更**：① 方法论口径传播从「N 份转写各自维护」改为「sddu.md →（引用）→ 各载体」——各载体仅持「权威来源：sddu.md」引用声明、不转写方法论，无副本可漂移，无需校验脚本；**状态模型权威从 `src/state/` TS 实现整体移交 sddu.md（ADR-005）——机器可执行语义（枚举 / 迁移表 / 树嵌套联动）全量蒸馏为内核文字规范，仓库归零 TypeScript**；② 分发数据流**坍缩为复制粘贴（零构建，ADR-006；设计态即运行态，ADR-007）**：「`sddu-project-template/` 整棵树（用户项目根镜像）→ 安装器 `cp -r` → 用户项目根」——源路径与安装后路径**逐项相同**，无 dist/、无渲染、无路径改写；新增平台 = 在模板目录放一个入口 md，连构建都不用跑（NFR-006 可测试）。

## 3. 方案对比
> 2-3 个可行方案的对比分析

| 维度 | 方案 A：最小侵入（内核文档 + 引用） | 方案 B：构建期派生（内核 partial 注入载体） | 方案 C：结构化内核（TS 常量 + 双平台渲染） |
|------|:--|:--|:--|
| 描述 | sddu.md 单一权威；各载体方法论段改为引用声明、不转写，无副本可漂移，无需校验脚本 | 内核拆为 Handlebars partial，build-agents / build-dsh-skills 渲染时物理注入 11 个 Agent 模板与 SKILL.md | 方法论建模为 TS 结构化常量（阶段/原则/状态枚举），文档与指令由它双平台渲染生成 |
| 优点 | 改动集中（文档 + 1 脚本）；不碰渲染管线；内核天然平台中立、可独立阅读（开放问题 4 顺带解决）；与「简化」目标自洽 | 物理单一来源，「改一处全生效」由机制保证 | 最彻底；类型安全；将来多平台派生零成本 |
| 缺点 | 无（各载体仅引用不转写，改内核即全生效，已无漂移源） | 需改造 build-agents 渲染管线（现为原样复制）；dsh 侧「只拼接不改写」约束需重新评估；partial 粒度难拿捏 | 相当于重写模板引擎；先大幅加载体再谈减——与版本目标自相矛盾；工作量最大 |
| 风险 | 无（无转写副本、无漂移源；结构一致性由 e2e 回归保证） | 渲染管线改造引入新缺陷面；与 v12.0.0 adapter 收缩范围重叠 | 高改动面 + 高回归风险（R-001 放大） |
| 工作量 | S（脚本 ~1d + 文档对齐 2-3d） | M（渲染管线改造 3-5d + 对齐 2d） | L（2-3 周） |

## 4. 推荐方案
> 推荐方案及选择理由

**推荐**: 方案 A（最小侵入）
**理由**: ① 与版本目标自洽——简化版本自身必须用最简机制实现简化，避免「为简化先增重」；② spec FR-002 验收「改一处全生效」由「内核唯一权威 + 各载体仅引用不转写」满足（改内核即全生效，无副本可漂移，无需同步链路）；③ sddu.md 平台中立可独立分发，为 v10.1.0（skill 市场推广）与「方法论延展至非编程领域」预留零成本路径；④ 若未来需要方案 B/C，可在方案 A 的内核与引用之上增量演进，无沉没成本；⑤ **方案 C 的否决在 v6 被推向彻底（ADR-005）**——不仅不新增结构化 TS 内核，存量 TS 实现（`src/state/` 等）也整体退役：保留它即保留双权威（sddu.md 与 TS 实现各执一词）与整套 TS 工具链（tsc / jest 工程 / dist / npm exports），恰是本版本要裁的载体包袱。

## 5. 文件影响分析
> 所有需要创建/修改/删除的文件（图例：★NEW 新建 / ✎M 修改 / ✖D 删除〔待用户确认〕/ 无标记 = 不动）

### 5.1 整体文件树（变更标注版；含统一安装范式 ADR-004/FR-008）

> **一套范式，所有平台**：仓库内 `sddu-project-template/` = 用户项目根镜像（设计态即运行态，ADR-007），安装 = `cp -r` 即得；workspace/ 由流程在用户项目中生成——本仓库 `.sddu/`（dogfooding）即其实例。命名规则、范式五原则、迁移面差异见表（原 §5.3 并入）。

```text
sddu/                                        # 仓库根
├── README.md                                ✖D    MOVE 入本体：→ .sddu/.sddu/README.md（ADR-013，随本体分发；根不设副本）
├── package.json                             ✖D    零 npm：整体退役（零 TS 无依赖、零构建无脚本）；版本源归 sddu.md 头部
├── package.json                             ✖D    零 npm：整体退役（零 TS 无依赖、零构建无脚本）；版本源归 sddu.md 头部
├── package-lock.json                         ✖D    随 package.json 退役
├── tsconfig.json                            ✖D    TS 源归零，编译配置随之退役（ADR-005）
├── jest.config.ts                           ✖D    根 jest 工程（core/opencode/integration）随 TS 测试退役；e2e 转裸 node 脚本
├── bootstrap.sh / bootstrap.ps1
├── LICENSE                                  ✖D    MOVE 入本体：→ .sddu/.sddu/LICENSE（ADR-013，随装即得合法授权）
├── .gitignore
│
├── scripts/                                 # 复制器一对（终态 ~400 行，现 4405 行；零构建 + 零 npm + 零校验，ADR-006/008）
│   └── install/
│       ├── install.sh                       ★NEW  复制粘贴器（ADR-007）：cp -r sddu-project-template/. <project>/
│       └── install.ps1                      #     ——源路径 = 安装后路径，零改写、零平台分支（无 --platform，
│                                            #     纯 cp）；旧布局迁移（备份+回滚）。无 dist/、无渲染、无产物树
│                                            # ✖D 整体退役：build-agents / build-dsh-skills / package.cjs(+test) /
│                                            #   test-sddu-functionality / check-sdd-residue / migrate-sdd-to-sddu /
│                                            #   sddu-check / sddu-validation-report / verify-skills / install/{opencode,dsh}/
│                                            #   （两构建链随零构建范式整体取消；一次性迁移与旧结构断言脚本属 D3 历史包袱）
│
├── src/                                     ✖D    现存设计态源码整目录退役（ADR-005/007）：×18 TS 源 +
│   │                                        #     __tests__/ 整目录（测试 ×13 + fixtures）、skills/、adapters/templates
│   │                                        #     ——状态模型语义全量蒸馏进 sddu.md；md 资产迁入
│   │                                        #     sddu-project-template/.sddu/.sddu/modules/（见下）
│
├── sddu-project-template/                   ★NEW  设计态即运行态 = 用户项目根镜像（ADR-007）：
│   │                                        #     安装 = 复制整棵该目录，零路径改写；用户项目安装后布局与本镜像逐项对应
│   │                                        #     workspace/ 以**空骨架**随装（仅首次初始化，升级/重装绝不触碰既有内容）；
│   │                                        #     结构见下方 .sddu/ 自举示例
│   ├── .sddu/
│   │   └── .sddu/                           #     与用户项目 .sddu/.sddu 逐项一致（设计态=运行态的核心承诺）
│   │       ├── sddu.md                       ✎M    方法论内核唯一权威（含头部版本字段 = 唯一版本源）
│   │       ├── README.md                    ★NEW  发布元数据（ADR-013，MOVE 自仓库根 + 重排「本质先行」：是什么 /
│   │       │                                #     怎么装（一条 cp）/ 7 阶段概览 → 指向 sddu.md，不转写方法论）
│   │       ├── LICENSE                      ★NEW  发布元数据（ADR-013，MOVE 自仓库根；随本体分发，安装即得合法授权）
│   │       └── modules/                     #     按业务内聚组织：一个业务（阶段/流程）= 一个自包含子包
│   │                                        #     （子包同构：sddu-<stage>.md = 阶段指令（文件命名即业务名，便于用户理解），自 templates/agents
│   │                                        #       迁入改名、router 并入入口、方法论段 → 引用 sddu.md；
│   │                                        #       contracts/*.md = 该业务产物契约，自 templates/outputs 迁入、
│   │                                        #       .md.hbs → .md、占位符为文档约定、代码从不渲染）
│   │           ├── sddu-discovery/          ✎M    阶段 0/7 问题挖掘（契约：discovery.md）
│   │           │   ├── sddu-discovery.md
│   │           │   └── contracts/discovery.md
│   │           ├── sddu-spec/               ✎M    阶段 1/7 需求定义（契约：spec.md）
│   │           │   ├── sddu-spec.md
│   │           │   └── contracts/spec.md
│   │           ├── sddu-plan/               ✎M    阶段 2/7 技术设计（契约 ×2：plan.md + adr.md——ADR 随 Feature 存储）
│   │           │   ├── sddu-plan.md
│   │           │   └── contracts/{plan.md, adr.md}
│   │           ├── sddu-tasks/              ✎M    阶段 3/7 任务分解（契约：tasks.md；tasks.json 为运行期产物非契约）
│   │           │   ├── sddu-tasks.md
│   │           │   └── contracts/tasks.md
│   │           ├── sddu-build/              ✎M    阶段 4/7 实施构建（契约：build.md）
│   │           │   ├── sddu-build.md
│   │           │   └── contracts/build.md
│   │           ├── sddu-review/             ✎M    阶段 5/7 产物审查（契约 ×2：review.md + review-report.md）
│   │           │   ├── sddu-review.md
│   │           │   └── contracts/{review.md, review-report.md}
│   │           ├── sddu-validate/           ✎M    阶段 6/7 产物验证（契约 ×2：validate.md + validate-report.md）
│   │           │   ├── sddu-validate.md
│   │           │   └── contracts/{validate.md, validate-report.md}
│   │           ├── sddu-fast/               ✎M    辅助：快速模式（仅指令，零产物契约）
│   │           │   └── sddu-fast.md
│   │           ├── sddu-roadmap/            ✎M    辅助：多版本路线图（契约：roadmap.md）
│   │           │   ├── sddu-roadmap.md
│   │           │   └── contracts/roadmap.md
│   │           └── sddu-docs/               ✎M    辅助：项目全景聚合（契约 ×20：五领域 docs 契约）
│   │               ├── sddu-docs.md
│   │               └── contracts/<领域>/*.md ×20
│   │                                        #     （指令 ×10 + 契约 ×31 = 41 文件：30 迁入 + adr.md 新增）
│   │   └── workspace/                       ★NEW  workspace 空骨架（仅首次安装初始化；升级/重装绝不触碰既有内容）
│   │       ├── ROADMAP.md                   ★NEW  版本路线图种子（sddu-roadmap 阶段产出落点，初始空表）
│   │       ├── specs-tree-root/             ★NEW  Feature 工作空间根（核心用户产物）
│   │       │   └── specs-tree-<version>-<slug>/     # 每 Feature 一个目录（流程生成，非骨架；
│   │       │                                        #   内：state.md / discovery / spec / plan / ADR / tasks /
│   │       │                                        #   build / review / validate——结构见下方 .sddu/ 自举示例）
│   │       ├── docs-tree-root/              ★NEW  项目全景聚合产物（sddu-docs 聚合，5 大领域）
│   │       │   └── <领域>/                  #     5 领域各一：{docs-overview.md, source.md}（流程生成）
│   │       └── .sddu-config/                #     用户对 sddu 的个性化配置（用户自有；SDDU 不预设内容）
│   │           └── modules/sddu-<stage>/          #     每阶段个性化（镜像 .sddu/.sddu/modules/sddu-<stage>，×10）
│   │               ├── sddu-<stage>-before.md   # 前置钩子：阶段执行前由入口读取（默认空）
│   │               ├── sddu-<stage>-after.md    # 后置钩子：阶段执行后由入口读取（默认空）
│   │               └── contracts/<contract>.md  # 用户自定义输出模板：覆盖 core 同名契约
│   │                                           # （默认空；缺省回退 .sddu/.sddu/modules/sddu-<stage>/contracts/）
│   ├── .agents/
│   │   └── skills/sddu/SKILL.md             ★NEW  纯索引/引导（一份，全平台统一；纯指令、零运行时组件）——
│   │                                        #       内容极简且跨版本稳定：仅引导 Agent 加载 .sddu/.sddu/sddu.md
│   │                                        #       （唯一入口 = sddu.md，含路由表 + 门禁/状态协议 + 读取规则）；
│   │                                        #       收到 <stage> <feature> → sddu.md 路由表读
│   │                                        #       .sddu/.sddu/modules/sddu-<stage>/sddu-<stage>.md（阶段指令）；
│   │                                        #       钩子 / 契约覆盖规则均载于 sddu.md，索引不重复承载
│                                            # 【平台发现】.agents/skills/ 是索引落位（2026-11-23 拍板：
│                                            #       不内置发现指针等适配机制——平台 skill 识别问题非 sddu 核心，
│                                            #       不支持该约定的平台由用户自行放置索引文件，复制粘贴即得）
│
├── docs/                                    # dsh/×6、research/×4 及工程文档 — 归类见清单
├── e2e/                                     ✎M    jest TS 测试 ×2 → 裸 node 结构回归脚本（安装范式断言：.sddu 计数 + 1 入口 + workspace 逐字节不变 + state.md front-matter 枚举）
│
├── .sddu/                                   # 本仓库自身 workspace（dogfooding，结构同用户项目；细目见 §5.2 变更行）

└── （✖D 随范式退役：dist/ ——零构建后无产物目录（ADR-006）；.opencode/ 与 .dsh/ ——安装态投影，
      由 sddu-project-template/ 复制产生，不再于仓库内维护（ADR-007）；package.json / package-lock.json / node_modules 随零 npm 退役；
      .gitignore 相应瘦身）
```

**Feature 目录命名规则（version-in-path，参考 tradepack 约定）**：

| 项 | 规则 |
|----|------|
| 目录名 | `specs-tree-<version>-<slug>`（备注：version=该 Feature 的目标发布版本，slug=特性短名，每 Feature 一个目录） |
| 版本格式 | `v<major>.<minor:02d>.<patch>`（备注：**次段两位数零填充**，保证字典序与版本序一致；缺陷版本同理） |
| state.md feature 字段 | `<version>-<slug>`（备注：去掉 `specs-tree-` 前缀，与目录名严格对应） |
| 子 Feature | `specs-tree-<version>-<slug>/specs-tree-<version>-<slug>/`（备注：递归同构，父/子各自独立版本号） |
| 存量迁移 | 29 个既有目录按各自 `state.md` front-matter 的 `version` 规范化重命名（`1.0.0`→`v1.00.0` 等）；**历史无版本 / 不适用者沿用原名**并在清单标注，不臆造版本号 |
| 排序收益 | 目录名即版本序；`git ls` / shell glob 天然按发布顺序排列（无需导航文件） |

**范式五原则**：
1. **.sddu / workspace 二分**——本体（可重建载体）与用户产物（不可触碰的本质工作产物）物理隔离；铁律：**安装写 .sddu/ 并初始化 workspace 空骨架（仅当为空），升级只写 .sddu/，流程只写 workspace/，.sddu 对流程只读**；升级=删建 .sddu（唯一入口 sddu.md 随之重建，天然版本一致，C2 消解），卸载=删 .sddu+索引（workspace 保留）
2. **入口唯一 = sddu.md、索引一份平台中立，.sddu 去载体化**——唯一入口（路由表 + 协议）归 `.sddu/.sddu/sddu.md`，随本体重建；`.agents/skills/sddu/SKILL.md` 全平台同一份纯索引（零副本、零运行时组件），只引导加载 sddu.md；.sddu 内部**按业务模块组织**（一个阶段/流程 = 一个自包含子包：sddu-<stage>.md 指令 + contracts/ 契约同包内聚，无 agent/skill 概念、无按类型集中分层；原框架级 skills ×4 移出 .sddu 转 FR-004 裁撤评估）；调度归 sddu.md（软引导，OpenCode 硬门禁随插件退役——取舍见 ADR-004），内容归 .sddu
3. **可重建**——删除入口或 .sddu/，重装即恢复
4. **索引唯一且仅一份**——`.agents/skills/sddu/SKILL.md` 是唯一索引落位（原生扫描该目录的平台零适配，dsh 已是）；**不内置发现指针等适配机制**——平台 skill 识别问题非 sddu 核心，不支持该约定的平台由用户自行放置索引（复制粘贴即得）
5. **新增平台零框架变动**——任何支持 `.agents/skills` 约定的平台零成本接入（NFR-006 可测试）；不支持的平台不在 sddu 服务范围内

**与现状的差异（迁移面，已量化）**：① 平台层从 11 skill / 多 agent 收敛为**每平台 1 个入口**（dsh 卸载 11 旧 skill → 装 1 索引 + .sddu；opencode agents 收敛为 1）；② 路径引用机械替换：`.sddu/specs-tree-root` → `.sddu/workspace/specs-tree-root`（33 文件）+ 其他 `.sddu/{skills,ROADMAP,TREE,templates}` 直引（26 文件）；`src/state/` 整体裁撤、语义移交 sddu.md（ADR-005），无其路径常量迁移项；③ 本仓库自身工作空间随 build 阶段迁入 `workspace/`；④ 存量用户由安装器检测旧布局自动迁移（备份 + 失败回滚，EC-007）；⑤ dsh 静态结构断言由「11 skill + 30 模板」调整为「1 入口 + .sddu 计数」。

### 5.2 变更明细

| 操作 | 文件路径 | 说明 |
|:--:|------|------|
| NEW | `sddu-project-template/.sddu/.sddu/sddu.md` | 方法论内核唯一权威文档（FR-001；四要素全覆盖，零平台事实；**仅此一份**——以用户项目路径随模板存放，仓库根不再另设副本，杜绝双权威（ADR-007）） |
| NEW | `.sddu/specs-tree-root/specs-tree-essence-simplification/carrier-inventory.md` | 载体分类清单（FR-004）+ 用户确认记录（FR-005） |
| NEW | `.sddu/specs-tree-root/specs-tree-essence-simplification/ADR-001~003.md` | 架构决策记录 ×3（已产出） |
| MOVE+MODIFY | `src/templates/agents/` → `sddu-project-template/.sddu/.sddu/modules/sddu-<module>/sddu-<stage>.md`（×10，文件命名即业务名，router 并入入口） | 阶段指令按业务归包（目录名即业务名）；方法论转写段替换为「权威来源：sddu.md」引用声明，保留阶段特有指令（FR-002） |
| MOVE+MODIFY | `src/templates/outputs/` → `sddu-project-template/.sddu/.sddu/modules/sddu-<module>/contracts/`（×30） | 文档契约随所属业务归包（如 review-report 归 sddu-review/、docs ×20 归 sddu-docs/）；`.md.hbs` → `.md`；模板头补内核引用声明（FR-002） |
| NEW | `sddu-project-template/.sddu/.sddu/modules/sddu-plan/contracts/adr.md` | **补 ADR 契约模板**（现状缺失）：ADR = plan 阶段产物（标题/状态/背景/决策/后果五段式，随 Feature 存储），原 30 契约不含它——新增使其成为 plan 契约 ×2；契约总数 30 → 31 |
| MOVE+MODIFY | `README.md` → `sddu-project-template/.sddu/.sddu/README.md` | 发布元数据入本体（ADR-013）：随本体 `cp -r` 分发（用户安装即得）；重排「本质先行」（是什么 / 怎么装 / 7 阶段概览 → 指向 sddu.md，不转写方法论）；根不设副本，行数目标显著下降（NFR-005 记录前后对比） |
| MOVE | `LICENSE` → `sddu-project-template/.sddu/.sddu/LICENSE` | 发布元数据入本体（ADR-013）：随装即得合法使用授权；根不设副本；CHANGELOG 不增设（ROADMAP §3 投影 + 修订记录即历史） |
| MODIFY | `.sddu/skills/dev-guide/SKILL.md` | 方法论口径改引用 sddu.md（FR-002） |
| DELETE | `package.json` / `package-lock.json` | **零 npm（2026-11-24 用户拍板）**：零 TS 后无任何依赖、零构建后无任何脚本——npm 流程整体退役，仓库不再是 npm 项目；两命令均裸脚本直跑：`sh scripts/install/install.sh`（安装）、`node e2e/<scenario>.mjs`（结构回归）；版本源归 sddu.md 头部唯一（C1 矛盾根除） |
| DELETE | `tsconfig.json` / `jest.config.ts`（根） | TS 源归零后编译/测试配置随之退役（Q-002 的死别名问题以「整个配置删除」终结） |
| MODIFY | `e2e/` | jest TS 测试（sddu-workflow / multi-feature + jest.config.ts）→ 裸 node 结构回归脚本（`node e2e/<scenario>.mjs`）：安装范式断言（.sddu 文件计数与哈希、1 入口、workspace 逐字节不变、旧布局迁移与回滚）；原依赖 dist CLI 的运行时断言随运行时退役 |
| MODIFY | `.sddu/ROADMAP.md` | FR-006 重估结论回填 + PR-017→FR-ESSENCE-001 转化回填（补欠账） |
| MODIFY | `.sddu/workspace/specs-tree-root/specs-tree-*/state.json` ×29 → `state.md` | 状态载体由 json 整体转为 md（ADR-008，FR-007）：front-matter 承载字段、正文承载人类可读摘要；不计迁移成本（产品未推广）；结构断言 = e2e 裸 node 回归（sddu.md 为权威） |
| MODIFY | `.sddu/workspace/specs-tree-root/specs-tree-dsh-adaptation/state.json` → `state.md` | 随载体转换一并更正 version 误写 v3.0.0 → v5.0.0（FR-007） |
| DELETE | `.sddu/docs/migration*.md` ×27 | 迁移残留归档删除（P-018；**用户确认后执行**，记录入 carrier-inventory） |
| DELETE | `.sddu/COMPLETION_CERTIFICATE.json` / `.sddu/review-report-*.json` | 历史归档清理（迁移完成证书 / 旧审查报告——2026-11-22 用户拍板删除，SDDU 尚未市场推广，不给自己加技术栈包袱） |
| DELETE | （待定） | carrier-inventory 中「可删/可合并」项——build 阶段分批提交用户确认后执行（FR-005） |
| DELETE | `src/` 整目录（ADR-005/007：×18 TS 源 + `__tests__/` 整目录 + skills/ + adapters/ 全部） | **TS 运行时与校验工具链整体退役（ADR-005，用户拍板 2026-11-23；目录整体让位于 sddu-project-template/，ADR-007）**：`state/` ×9（machine / schema-v3.0.0 / dependency-checker / state-loader / tree-scanner / auto-updater / parent-state-manager / types / index）、`shared/` ×3、`index.ts`、`templates/index.ts`、`adapters/opencode/`（plugin.ts + index.ts + templates）、`adapters/dsh/`（contract.ts + index.ts，结构断言职责并入 e2e）、`__tests__/`（测试 ×13 + fixtures）。语义去向：状态模型（8 phase / 5 status / 迁移表 / 树嵌套联动 / 依赖校验口径）全量蒸馏进 sddu.md → TASK-002 范围扩展；OpenCode 硬门禁退役取舍承 ADR-004 取舍④（v12 重估）；ADR-003 的「运行时 seam 冻结」条款对象消失、由本 ADR 取代，用户确认制不变 |
| NEW | `sddu-project-template/.agents/skills/sddu/SKILL.md` | 纯索引/引导文件（内容极简稳定：引导 Agent 加载 `.sddu/.sddu/sddu.md`，全 md 零渲染）——**落位即安装后路径**（设计态即运行态，ADR-007），复制即生效；唯一入口实质（路由表 + 协议 + 读取规则）归 sddu.md（2026-11-24 拍板，C2 消解）；发现指针机制删除（2026-11-23 拍板：平台 skill 识别非 sddu 核心） |
| NEW | `scripts/install/install.sh` / `install.ps1` | **复制粘贴器**（合并 install/{opencode,dsh}×{sh,ps1} 四份 → 一份/运行时，ADR-007）：`cp -r sddu-project-template/. <project>/`（源路径 = 安装后路径，零改写、零平台分支）+ 旧布局迁移（备份+回滚）；无 dist/、无渲染、无 install.json（版本 = sddu.md 头部） |
| DELETE | `dist/` / `.opencode/` / `.dsh/` / `package.json` / `package-lock.json` / node_modules | 仓库内产物与安装态投影整体退役：零构建后无 dist/（ADR-006）；平台投影由 `sddu-project-template/` 复制产生、不在仓库维护（ADR-007）；零 npm 后 node_modules 不再存在；`.gitignore` 相应瘦身 | `build-agents.cjs`、`build-dsh-skills.cjs`（构建链整体取消——全 md 无渲染对象，非合并）；`package.cjs` + `package.test.cjs`（npm 插件包打包链退役）；`test-sddu-functionality.js`（依赖 dist TS 运行时）；`check-sdd-residue.sh` / `migrate-sdd-to-sddu.sh`（SDD→SDDU 一次性迁移已完成，D3 历史包袱）；`sddu-check.sh`（与 e2e/安装自检职责重叠）；`sddu-validation-report.sh`（运行时报告工具，职责归入口协议+契约，D1✗）；`verify-skills.sh`（断言 11-skill 旧结构，新断言归 e2e）；`install/{opencode,dsh}/` 四份安装器（并入纯复制器）——scripts/ 由 4405 行收敛至 ~400 行 |
| MODIFY | `.sddu/specs-tree-root` 等路径引用 ×59 文件 | 机械替换至 `.sddu/workspace/` 前缀（33 + 26 文件，已 grep 量化）：11 Agent 模板、skills 脚本、docs、install 脚本（`src/state/` 已整体裁撤，无路径常量迁移项） |
| MODIFY | 本仓库 `.sddu/` 自身布局 | dogfooding 工作空间迁入 `.sddu/workspace/`（specs-tree-root / docs / docs-tree-root / skills / ROADMAP / TREE；build 阶段执行） |
| MODIFY | `.sddu/workspace/specs-tree-root/specs-tree-*` ×29 | **存量 Feature 目录按版本号重命名**（`specs-tree-<version>-<slug>`，version 取各 state.md front-matter 的 version 并零填充；历史无版本者沿用原名并标注）+ `state.md` front-matter 的 `feature` 同步为 `<version>-<slug>` |
| DELETE | `.sddu/workspace/specs-tree-root/architecture/` | ADR 统一随 Feature 存储（标准 SDDU 项目无独立 architecture 目录）：ADR-001~017 按归属迁入对应 Feature 目录，无法归属者随批次归档删除 |

> 修正记录（v1.0 → v1.1）：① v1.0 所列 `src/state/schema-v1.2.5.ts`、`schema-v2.0.0.ts` DELETE 行**有误**——两文件已不存在（P-012 登记过时），删除该两行，P-012 台账状态回填列入 build 阶段；② migration 残留计数 26 → **27**（含 migration-guide / migration-summary / migration.md 等全系列）。
> 注：输出模板的**内容**不改（属「文档契约的载体表达」），但**归包**至所属业务模块的 `contracts/`（按业务内聚，非按类型集中）；对齐方式为模板头引用 sddu.md（纳入 FR-002 对齐范围）。

## 6. 风险评估
> 识别技术、依赖和时间风险及缓解措施

| 风险 | 概率 | 影响 | 缓解措施 |
|------|:--:|:--:|----------|
| 裁撤引发回归（R-001/spec EC-001） | 中 | 高 | 每裁撤项绑定回归场景（e2e basic / dsh 静态测试 / 安装自检）；失败回滚单项不阻塞 |
| 判定标准遇边界项争议（R-002） | 高 | 中 | ADR-002 裁决规则：边界项一律「待用户裁决」，集中列于 carrier-inventory，逐项拍板 |
| 与 v12.0.0 范围耦合（R-003） | 低 | 中 | ADR-003 冻结 adapter 重构于 v6 期间；重估结论若需拉前，显式确认后改路线图 |
| 29 个 state.json → state.md 批量转换出错 | 低 | 低 | 逐文件跑 e2e 结构回归断言；失败逐个报告不静默跳过（EC-005） |
| 状态机代码退役：状态正确性失去运行时强制，仅剩协议软引导（ADR-005） | 确定 | 中 | sddu.md 状态模型章节**全量**承载迁移表与树嵌套联动（TASK-002 扩展，蒸馏以现 `machine.ts`/`schema-v3.0.0.ts` 语义为底稿逐一比对，不凭记忆重写）；各载体仅引用不转写、无副本可漂移；e2e 结构回归覆盖安装范式与 state.md 枚举；蒸馏稿经用户逐节确认 |
| 文档对齐改动面大导致遗漏（R-004） | 中 | 中 | carrier-inventory 全量盘点计数勾稽 + FR-002 验收检查清单化（交 review 阶段） |
| 构建链整体取消（零构建，ADR-006）引发回归面重排 | 低 | 中 | 构建链无「改造」只有「删除」——回归面反而缩小：e2e 改结构断言（1 入口 + .sddu 计数、复制逐字节一致）；旧脚本在新安装器验收后删（TASK-013） |
| workspace 路径迁移破坏存量用户/自举仓库（FR-008 二分新增） | 中 | 高 | 安装器迁移前整体备份 + 失败回滚（EC-007）；本仓库迁移单独一批执行并全量回归；`workspace/` 逐字节不变断言（NFR-007） |
| OpenCode 硬门禁随插件退役（能力降级，用户显式拍板） | 确定 | 高 | ADR-004 如实记录；sddu.md 协议含结构化拒绝块（[SDDU-GATE-DENY]）+ state.md front-matter 唯一权威对账兜底；硬门禁新形态留 v12 重估；opencode e2e 基线同步改造 |

## 7. 生成的 ADR
> 本次规划产出的架构决策记录

| ADR | 标题 | 状态 |
|-----|------|:--:|
| ADR-001 | 内核采用「单一文档 + 引用」而非构建期派生/结构化渲染（开发期校验随 check 退役而取消，2026-11-24 修订） | PROPOSED |
| ADR-002 | 「本质 / 附属品」四维判定标准（D1~D4）与裁决规则 | PROPOSED |
| ADR-003 | 裁撤执行用户确认制 + 冻结运行时 seam 重构（与 v12.0.0 边界；v1.1 收窄冻结范围；**冻结条款被 ADR-005 取代——冻结对象整体退役**） | PROPOSED |
| ADR-004 | 统一安装范式——.sddu/workspace 二分 + 平台层唯一 sddu 入口（**取舍④中「src/state 保留为校验工具库」被 ADR-005 修订为整体裁撤**） | PROPOSED |
| ADR-005 | 状态模型权威归一 sddu.md——`src/state/` 及全部 TS 裁撤，仓库零 TypeScript | PROPOSED |
| ADR-006 | 零构建、纯复制——取消构建阶段（含 plan v3.2 build.cjs 合一方案），安装 = 直接复制源文件 | PROPOSED |
| ADR-007 | 设计态即运行态——`sddu-project-template/` = 用户项目根镜像，安装 = 复制粘贴、零路径改写 | PROPOSED |
| ADR-008 | 状态载体归 md——state.json 退役，文档即状态（front-matter 承载机器字段） | PROPOSED |
| ADR-009 | 聚合索引不引入生成器——ROADMAP.md 靠 zone/entry 合并机制，非并发问题（TREE.md 随 ADR-010 裁撤） | PROPOSED |
| ADR-010 | TREE.md 裁撤——目录名即导航，不保留目录导航文件 | PROPOSED |
| ADR-011 | 空钩子文件非脚手架——预置扩展点即最简拓展方式（评估 B1 非问题） | PROPOSED |
| ADR-012 | 治理诉求不进内核——CODEOWNERS 与审计字段拒绝，治理走钩子扩展点（评估 B2 拒绝） | PROPOSED |
| ADR-013 | 发布元数据随本体分发——README/LICENSE 入本体目录，CHANGELOG 不增设（评估 B3 部分采纳） | PROPOSED |
| ADR-014 | 术语表不进 sddu.md——内核保持精炼，形象化描述归 README；build 命名维持（评估 B4 拒绝+非问题） | PROPOSED |
| ADR-015 | 场景特定能力不入框架——外部 API 文档缓存门禁退役（能力丢失排查 L2） | PROPOSED |
| ADR-016 | state.md front-matter 补 dependencies 字段——依赖声明是状态，反向视图是派生（能力丢失排查 L3） | PROPOSED |
| ADR-017 | files 产物注册字段退役——目录即真相，产物存在性直查不注册（能力丢失排查 L4） | PROPOSED |

## 8. 修订记录
> 记录本文档的版本变更历史

| 版本 | 变更说明 | 日期 | 修订人 |
|------|---------|------|--------|
| v1.0 | 初始创建 — 三方案对比（A 最小侵入 / B 构建派生 / C 结构化内核），推荐 A；产出 ADR-001~003；文件影响 NEW×4 类 / MODIFY×8 类 / DELETE×3 类（裁撤项待用户确认） | 2026-11-22 | SDDU Plan Agent |
| v1.1 | §5 重构：新增 5.1 整体文件树（变更标注版，体现全仓库目录布局）；事实修正——删除已不存在的 schema-v1.2.5/v2.0.0 两行 DELETE（P-012 登记过时，台账回填列入 build），migration 残留计数 26→27 | 2026-11-22 | SDDU Plan Agent |
| v1.2 | 新增 5.3 用户项目安装目录树（OpenCode / dsh 两平台 × 变更标注，落位依据 install 脚本与 package.cjs 现行为核实）；内核随安装分发的落位决策补入 ADR-001 决策 4 | 2026-11-22 | SDDU Plan Agent |
| v1.3 | 用户追加「统一安装范式」范围（FR-008/ADR-004）：§5.3 重写为统一范式（权威层 + 投影层 + 新平台零框架变动）；§2 新增投影器/描述符组件与分发数据流；§5.1/§5.2 增补 project-carriers.cjs、platform.json ×2、构建/安装脚本泛化；ADR-003 冻结边界收窄为运行时 seam；spec 同步 v1.1（FR-008/NFR-006） | 2026-11-22 | SDDU Plan Agent |
| v1.4 | 用户拍板命名：权威层细化为 **core / workspace 完全二分**——§5.3 树与原则更新（五原则，core=本体可重建 / workspace=用户产物绝不触碰）；迁移面量化入 §5.2（路径引用 ×59 文件机械替换 + 本仓库工作空间搬迁 + 安装器旧布局迁移）；§6 增迁移风险行；spec 同步 v1.2（FR-008 验收细化 + NFR-007 + EC-007） | 2026-11-22 | SDDU Plan Agent |
| v1.5 | 用户拍板再简化：平台层收敛为**唯一 sddu 入口**（调度归入口、内容归 core，运行期按需读取阶段指令）；§5.3 平台层重写、原则 2/4 更新；投影器与 platform.json 描述符退役（§5.1/§5.2 相应调整）；dsh 静态断言 11→1；spec 同步 v1.3 | 2026-11-22 | SDDU Plan Agent |
| v1.6 | 用户拍板砍运行时件：OpenCode 插件 JS 退役（plugin.ts DELETE、插件 npm 包打包链退役），任何平台零运行时组件、纯指令单入口、两平台统一软引导；§5.3 树/原则 2、§5.2、§6 同步；ADR-004 决策②与取舍更新；spec 同步 v1.4 | 2026-11-22 | SDDU Plan Agent |
| v1.7 | 用户拍板入口统一落位 `.agents/skills/sddu/`（平台中立，dsh 契约已识别该目录）：入口单份零平台副本、平台目录退化为发现指针（仅 OpenCode 需要）；§5.3 入口层重写、原则 2/4/5 更新；入口模板 ×2 → ×1 + 指针模板；spec 同步 v1.5 | 2026-11-22 | SDDU Plan Agent |
| v1.8 | 用户拍板 core 去载体化 + workspace 树补全：`carriers/{agents,outputs,skills}` → `methodology/{stages,contracts}`（core 无 agent/skill 概念，skills ×4 转 FR-004 裁撤评估）；§5.3 workspace 子树补全为完整目录/文件树（specs-tree-root 各阶段产物、architecture/adr、docs、docs-tree-root 5 领域、skills、templates、ROADMAP/TREE/归档 JSON）；残留 carriers 引用清理；spec 同步 v1.6 | 2026-11-22 | SDDU Plan Agent |
| v1.9 | 用户拍板删除历史归档包袱：workspace 树移除 `COMPLETION_CERTIFICATE.json` 与 `review-report-*.json`（SDDU 未上市场推广，不给自己加技术栈）；二者转入 §5.2 DELETE（build 阶段清理） | 2026-11-22 | SDDU Plan Agent |
| v2.0 | 用户拍板 Feature 路径设计归入版本号（参考 tradepack）：§5.3 新增「Feature 目录命名规则（version-in-path）」表（`specs-tree-<version>-<slug>`、次段零填充保字典序、state.json.feature 对应、子 Feature 递归、存量迁移与无版本者处置）；§5.3 workspace 树改版本化目录（设计态；按用户要求不在进行中的 Feature 目录上直接改名）；§5.2 增存量目录重命名行；spec 同步 v1.7（FR-008 验收⑦）；tasks 同步 TASK-009 | 2026-11-22 | SDDU Plan Agent |
| v2.1 | 用户拍板删除独立 `architecture/` 目录（标准 SDDU 项目无此目录，ADR 全部随 Feature 存储）：§5.3 workspace 树移除 architecture/adr 块；§5.1 标 ✖D（ADR-001~017 迁入归属 Feature 或归档）；§5.2 增 DELETE 行；spec 同步 v1.8（FR-008 验收⑧）；tasks 同步 TASK-009（步骤④ + 验收） | 2026-11-22 | SDDU Plan Agent |
| v2.2 | 用户拍板：不改进行中的 Feature 目录——版本化命名仅作为 plan §5.3 目标设计（由 TASK-009 迁移批次统一执行）；回退本 Feature 目录改名与 state.json.feature（恢复 specs-tree-essence-simplification），文件头/操作路径引用同步回退，设计示例保留 | 2026-11-22 | SDDU Plan Agent |
| v2.3 | 用户拍板：目录规范去示例写死——§5.3 命名规则与树中不再出现具体版本号 / 具体特性名，统一使用占位规范 `specs-tree-<version>-<slug>`（父/子递归同构同一规范） | 2026-11-22 | SDDU Plan Agent |
| v3.0 | 用户拍板（2026-11-23）：**`src/state/` 及全部 TS 整体裁撤，状态模型权威归一 sddu.md，仓库零 TypeScript**——§2 check-essence-sync 吸收 schema 权威源与 dsh 契约校验职责；§4 理由⑤（方案 C 否决推向彻底）；§5.1 src/ 块重写（零 TS）+ tsconfig/jest.config/test-sddu-functionality 标删 + e2e 转裸 node 脚本；§5.2 TS 退役 DELETE 行（×18 源 + 测试 ×13）+ package.json 零 TS 化 + FR-007 校验锚点改 check-essence-sync；§5.3 差异②、§6 新增「失去运行时强制」风险行；产出 ADR-005（ADR-003 冻结条款 / ADR-004 取舍④相应修订）；spec 同步 v1.11、tasks 同步 v1.5（TASK-002 蒸馏范围扩展为状态模型全量、TASK-003 本质集合去 src/state、TASK-012 校验命令改写、TASK-013 增 TS 退役批次） | 2026-11-23 | SDDU Plan Agent |
| v3.1 | 用户指出树中残留 agent 概念：§5.1 src/ 终态对齐 TASK-005 既有规划——`templates/{agents,outputs}` → `methodology/{stages,contracts}`（阶段指令 ×10 去 agent 命名、router 并入入口；契约 ×30 同构 core 直拷），src/ 零 agent/skill 概念（`src/skills/` 为用户资产目录、待 FR-004 归类，唯一例外并标注）；§5.2 两行改 MOVE+MODIFY；输出模板「不改结构」注修正为「内容不改、目录归位」 | 2026-11-23 | SDDU Plan Agent |
| v3.2 | 用户拍板 scripts/ 收敛（构建/安装/校验各一份）：§5.1 scripts 块重写——`build.cjs` ★NEW（合并 build-agents + build-dsh-skills，平台差异只剩指针无需双构建链）、`install/install.{sh,ps1}` ★NEW（四份安装器 → 一份/运行时，--platform 仅决定指针）；✖D ×9（两旧构建链 / package.cjs+test / test-sddu-functionality / check-sdd-residue / migrate-sdd-to-sddu / sddu-check / sddu-validation-report / verify-skills / install/{opencode,dsh}/），4405 → ~600 行；§2 权威源表述、§5.2 package.json 三入口；tasks 同步 v1.6（TASK-005/008/010 改合一产物路径、TASK-013 增脚本退役批次） | 2026-11-23 | SDDU Plan Agent |
| v4.0 | 用户拍板**零构建**（ADR-006，修正 v3.2 的 build.cjs 合一方案——合一不如取消）：全 md 无渲染对象，构建阶段整体取消——§2 组件 2 改开发期校验（npm run check）、组件 4 去 install.json、数据流②坍缩为纯复制；§5.1 scripts 块去 build.cjs（校验一份 + 复制器一对，4405→~400 行）、src/adapters 改 SKILL.md + opencode-pointer.md 纯 md、contracts .md.hbs→.md；§5.2/§5.3（无 install.json）/§6（回归面缩小）同步；ADR-001/004 相应修订；tasks 同步 v1.7（TASK-005 直拷验证 / TASK-007 check 命令 / TASK-008 纯复制器 / TASK-013 构建链整体取消） | 2026-11-23 | SDDU Plan Agent |
| v4.1 | 用户拍板撤除 tasks 产物（tasks.md / tasks.json 删除，state 回退 planned）：plan 迭代期避免 plan/tasks 双文档同步负担，待 plan 冻结后由 tasks 阶段重新分解；正文既有 TASK-xxx 引用视为 plan 冻结后的落点提示，不构成当前交付物 | 2026-11-23 | SDDU Plan Agent |
| v4.2 | 用户拍板新增目标**设计态即运行态**（ADR-007）+ 目录更名：`src/`（整目录退役）→ `sddu-project-template/` ★NEW = 用户项目根镜像（.sddu/core + .agents/skills/sddu + .opencode 指针，与 §5.3 目标树逐项对应）；安装坍缩为 `cp -r sddu-project-template/. <project>/`（源路径 = 安装后路径，零改写）；§2 组件/数据流、§5.1 树（src 纯 ✖D + 镜像目录 NEW）、§5.2（DELETE 扩整目录 / MOVE 目标 / 安装器）、原则 4 同步；spec 同步 v1.12（FR-008 验收⑨） | 2026-11-23 | SDDU Plan Agent |
| v4.3 | 用户指出树尾注过时：dist/ 在零构建后已不存在——尾注改退役说明，§5.2 增 DELETE 行（dist/ / .opencode/ / .dsh/ / node_modules 随范式退役，.gitignore 瘦身） | 2026-11-23 | SDDU Plan Agent |
| v4.4 | 用户指出根 sddu.md 与模板内 core/sddu.md 并存构成双权威（早期设计残留）：树中删根副本行，§5.2 NEW 行改指模板内唯一路径——内核仅此一份，check-essence-sync 与所有引用均以该路径为准 | 2026-11-23 | SDDU Plan Agent |
| v4.5 | 用户拍板删除 `examples/`（tree-structure-demo 旧结构演示）：树中删行，并入 §5.2 产物 DELETE 行——`sddu-project-template/` 本身即自解释示例，README 引用同步清理 | 2026-11-23 | SDDU Plan Agent |
| v5.0 | 用户拍板 core 内部组织**按业务模块内聚**（修订 ADR-004 决策②、取代 v1.8 的 methodology/{stages,contracts} 类型分层）：`core/sddu.md`（提至 core 根）+ `core/modules/<业务>/`（instruction.md 指令 + contracts/ 契约同包，7 阶段 + fast/roadmap/docs 共 10 包，指令 ×10 + 契约 ×30 计数不变）；§2 组件 4 / §5.1 模板树 / §5.2 MOVE 行 / §5.3 安装树 + 入口读取规则 + 原则 2 同步；spec 同步 v1.13；ADR-004/007 相应修订 | 2026-11-23 | SDDU Plan Agent |
| v5.1 | 用户拍板 §5.3 并入 §5.1：设计态即运行态（ADR-007）后用户项目安装树与仓库树同源——安装树删除（模板镜像即其形态），Feature 命名规则 / 范式五原则 / 迁移差异表移入 §5.1 尾部；§5.1 标题与导语更新，.sddu/ 块升级为 workspace 范式实例（specs-tree 子树展开）；SKILL.md 行吸收运行期读取规则 + 新平台注 | 2026-11-23 | SDDU Plan Agent |
| v5.2 | 用户拍板**删除发现指针机制**：模板树删 `.opencode/` 指针块；安装器去 `--platform`（纯 cp、零平台分支）；原则 4/5 改「入口唯一且仅一份 + 不内置适配，不支持 .agents/skills 的平台不在服务范围」；§2 组件 4 / §5.2 NEW 行同步；spec 同步 v1.14；ADR-004/007 相应修订 | 2026-11-23 | SDDU Plan Agent |
| v5.3 | 用户拍板树中 `.sddu/` 自举目录一笔带过：workspace 细化（ROADMAP 回填 / 归档删除 / state 迁移 / 目录版本化改名 / architecture 撤除 / 本 Feature 产出等）均已在 §5.2 变更行载明——树只留一行指引，消树表双份维护 | 2026-11-23 | SDDU Plan Agent |
| v5.4 | 用户拍板 modules/ 为核心须逐一展开：10 个业务子包各列 instruction.md + contracts/ 明细（discovery/spec/plan/tasks/build/review/validate ×7 阶段 + fast/roadmap/docs 辅助），契约归属内联标注（review ×2、validate ×2、docs ×21、fast 零）；同构说明上提为模块总注 | 2026-11-23 | SDDU Plan Agent |
| v5.5 | 用户指出模板缺 workspace：合并 §5.3 时误将 workspace 定义为纯流程生成，丢了首次安装落点（空项目无 specs-tree-root，流程无处下笔）——补回**空骨架随装**：模板增 `workspace/specs-tree-root/TREE.md` 种子（仅首次初始化）；原则 1 铁律 / §5.2 NEW 行同步；spec 同步 v1.15（FR-008 验收②区分首次骨架与升级不变） | 2026-11-23 | SDDU Plan Agent |
| v5.6 | 用户拍板 workspace 骨架为核、须详细写出（含 docs-tree-root 等）：模板 `workspace/` 子树全量展开——ROADMAP/TREE 种子、specs-tree-root（Feature 目录为流程生成）、docs-tree-root（5 领域 {TREE.md,docs-overview.md,source.md}）、skills、templates（后二者用户自有、不预设）；`docs/` 不预设（用户自有，SDDU 不产出不设计）；spec 同步 v1.16（验收②引用完整骨架） | 2026-11-23 | SDDU Plan Agent |
| v5.7 | 用户拍板阶段指令文件改名：`instruction.md` → `sddu-<stage>.md`（discovery/spec/plan/tasks/build/review/validate/fast/roadmap/docs，命名即业务名、便于用户理解）；§5.1 十个子包、同构总注、SKILL.md 读取规则、原则 2、§2 组件 4、§5.2 MOVE 行同步；spec 同步 v1.17；ADR-004/007 路径同步 | 2026-11-23 | SDDU Plan Agent |
| v5.8 | 用户拍板内核文件改名 `ESSENCE.md` → `sddu.md`（core 根，命名即 SDDU 本体）；全链路径/「权威来源」引用/ADR 标题同步；顺带清 ADR-006 遗留的「构建期校验」残留为「开发期校验」（§5.2 check 行 / §6 风险 / §7 ADR 表 / §3 方案 A / ADR-001 标题与缓解句）；spec 同步 v1.18 | 2026-11-23 | SDDU Plan Agent |
| v5.9 | 用户拍板本体目录改名 `core/` → `sddu/`：`.sddu/sddu/`（命名即 SDDU 本体，与内核 sddu.md、阶段指令 sddu-<stage>.md 同族）；§5.1 树 / §2 组件 4 / §5.2 各路径 / 原则 1「sddu/workspace 二分」/ e2e 计数断言同步；ADR-004/005/006/007 路径同步；spec 同步 v1.19 | 2026-11-23 | SDDU Plan Agent |
| v5.10 | 用户指出 ADR 缺契约模板：plan 模块 `contracts/plan.md` → `contracts/{plan.md, adr.md}`（ADR 五段式：标题/状态/背景/决策/后果，随 Feature 存储）；§5.2 增 NEW 行、契约总数 30 → 31（spec 无需同步：FR-004「45 模板」为现存盘点基线、adr.md 属新增产物） | 2026-11-23 | SDDU Plan Agent |
| v5.11 | 用户拍板 workspace 增用户个性化配置目录 `sddu/`（如模板等）：合并原 skills/、templates/ 两个「用户自有」占位为单一 `workspace/sddu/`（用户自有、SDDU 不预设内部结构）；与本体 `.sddu/sddu/` 分层——前者框架本体（可重建）、后者用户个性化（随 workspace 保留） | 2026-11-23 | SDDU Plan Agent |
| v5.12 | 用户拍板每阶段支持前置/后置钩子：`workspace/sddu/modules/<stage>/{sddu-<stage>-before.md, sddu-<stage>-after.md}`（默认空 md，用户写入该阶段的个性化要求）；入口执行前/后按需读取、空则跳过；§5.1 workspace/sddu 子树 + 入口读取规则 + §2 组件 4 同步；spec 同步 v1.21（FR-008 验收⑩） | 2026-11-23 | SDDU Plan Agent |
| v5.13 | 用户拍板补用户自定义输出模板：`workspace/sddu/modules/<stage>/contracts/<contract>.md`（默认空，覆盖 core 同名契约、缺省回退 core）；§5.1 workspace/sddu 子树 + 入口产物契约优先级 + §2 组件 4 同步；spec 同步 v1.22（FR-008 验收⑪） | 2026-11-23 | SDDU Plan Agent |
| v5.14 | 用户拍板改名 workspace 用户个性化目录 `workspace/sddu/` → `workspace/sddu-config/`（消除与本体 `.sddu/sddu/` 同名歧义——评估结论「不足1」）；§5.1 workspace 子树 + 入口读取规则 + §2 组件 4 同步；spec 同步 v1.23 | 2026-11-23 | SDDU Plan Agent |
| v5.15 | 用户拍板用户个性化目录加 `.` 前缀：`workspace/sddu-config/` → `workspace/.sddu-config/`（仍在 workspace 用户空间内，非提升层级；`.sddu-config` 排序靠前）；§5.1 workspace 子树 + 入口读取规则 + §2 组件 4 同步；spec 同步 v1.24 | 2026-11-23 | SDDU Plan Agent |
| v5.16 | 用户拍板本体目录加 `.` 前缀：`.sddu/sddu/` → `.sddu/.sddu/`（点前缀排序靠前）；§5.1 树 / §2 组件 / §5.2 路径 / 原则 1「.sddu/workspace 二分」/ 入口读取规则同步；spec 同步 v1.25 | 2026-11-23 | SDDU Plan Agent |
| v5.30 | 排查 **L4 裁决 A 退役**：files 产物注册字段退役——**目录即真相**（产物存在性按目录约定文件名直查，注册副本即漂移源）；前置产物门禁语义保留、数据源换轨为直查（底稿 A6 判定依据同步）；模块迁移约束：sddu-review/sddu-validate 模板删除 files 回写联动段（与 ADR-015 API 门禁段同批）；产出 ADR-017 | 2026-11-24 | SDDU Plan Agent |
| v5.29 | 排查 **L3 裁决 A**：front-matter **补 `dependencies` 字段**（单向声明只存「我依赖谁」，反向 blocking 派生不落盘由 Agent 反查推导；缺省合法）——「依赖校验口径」蒸馏的数据源闭环，结构矛盾解除；ADR-005 字段契约九→十字段；TASK-002 依赖口径绑定本字段；产出 ADR-016 | 2026-11-24 | SDDU Plan Agent |
| v5.28 | 用户启动**能力丢失排查**（黑盒丢失审计）：4 片深读（状态机/适配器/框架技能/模板+e2e）产出 capability-loss-audit.md（🔴 黑盒 ×8 + 🟡A 蒸馏缺口 ×9 + 🟡B FR-004 悬置 ×6 + ✅ 已决抽查）；**L2 裁决 A 退役**：SDDU 框架级/逻辑级/场景无关，外部 API 文档缓存门禁属场景增强不入框架（场景需求走 .sddu-config 钩子）；模块迁移约束：sddu-spec/sddu-plan 模板删除 API 门禁段；产出 ADR-015 | 2026-11-24 | SDDU Plan Agent |
| v5.27 | 用户拍板评估 B4（术语门槛 + build 语义）**拒绝+非问题**：术语表不进 sddu.md——内核保持精炼不繁琐冗余，Agent 读完 sddu.md 未懂则续读 README（ADR-013 已入本体，同目录随装即得，承载更形象贴切的描述）；build 命名维持（行业通用名，内容型语义映射属 v12）；产出 ADR-014 | 2026-11-24 | SDDU Plan Agent |
| v5.26 | 用户拍板评估 B3（发布元数据）**部分采纳**：README/LICENSE 纳入规划且**落位本体目录 `.sddu/.sddu/`**（随本体 cp -r 分发、安装即得，仓库根不设副本杜绝双权威）；CHANGELOG 不增设（ROADMAP §3 投影 + 修订记录即历史）；§5.1 树（根 README/LICENSE 转 MOVE 入本体 + .sddu/.sddu/ 新增两行）/ §5.2（README 转 MOVE+MODIFY + 新增 LICENSE 行）同步；产出 ADR-013 | 2026-11-24 | SDDU Plan Agent |
| v5.25 | 用户拍板评估 B2（CODEOWNERS + 审计字段）**拒绝**：治理不进内核（CODEOWNERS 是平台特定治理机制违反平台中立；审计字段膨胀 state.md 契约）；钩子机制即治理扩展点；产出 ADR-012 | 2026-11-24 | SDDU Plan Agent |
| v5.24 | 用户拍板评估 B1（模板规模 vs 极简）**非问题**：极简指流程载体而非文件数量；空钩子文件是预置扩展点（路径即信息，填内容即生效）；产出 ADR-011 固化 | 2026-11-24 | SDDU Plan Agent |
| v5.23 | 用户拍板**TREE.md 整体裁撤**：目录名即导航（version-in-path 使 ls 天然版本序），导航文件冗余且生成器与零脚本范式冲突；§5.1 树 / §5.2 行 / 排序收益行同步；spec 同步 v1.31；产出 ADR-010；ADR-009 收窄为 ROADMAP | 2026-11-24 | SDDU Plan Agent |
| v5.22 | 用户拍板聚合索引生成化（评估 A5）**非问题**：ROADMAP.md 已有 zone/entry 结构化合并机制、§3 为 specs-tree 实时投影、产品未推广单机无并发；不为未发生的多团队并发造生成器；产出 ADR-009 固化结论 | 2026-11-24 | SDDU Plan Agent |
| v5.21 | 用户拍板 modules/ 下 10 个业务子目录统一加 `sddu-` 前缀（`discovery/`→`sddu-discovery/` 等），与指令文件名 sddu-<stage>.md 同族；§5.1 树 / §2 组件 / §5.2 路径 / 入口读取规则同步；spec 同步 v1.30；ADR-004/007 同步 | 2026-11-24 | SDDU Plan Agent |
| v5.20 | 用户拍板**check-essence-sync 退役**（A3 消解）：单一权威 + 各载体仅引用不转写，无副本可漂移，开发期校验脚本失去对象；结构断言职责并入 e2e；scripts/ 收敛为复制器一对；§2 组件 2 删除 / §3 / §4 / §5.1 树 / §5.2 行 / §6 / §7 同步；spec 同步 v1.29；ADR-001/004/005/006/007/008 同步 | 2026-11-24 | SDDU Plan Agent |
| v5.19 | 用户拍板**状态载体归 md**（C3 消解）：state.json 退役，状态统一为 state.md（front-matter 承载机器字段 + 正文人类可读，文档即状态）；不考虑迁移成本（产品未推广）；§2 组件 1/2 / §5.1 树 / §5.2 行 / §6 / §7 同步；spec 同步 v1.28；产出 ADR-008 | 2026-11-24 | SDDU Plan Agent |
| v5.18 | 用户拍板**唯一入口归 sddu.md**（C2 消解）：框架入口永远只有 sddu.md 一份（含路由表 + 门禁/状态协议 + 读取规则），随「升级=删建 .sddu」天然版本一致；`.agents/skills/sddu/SKILL.md` 降为纯索引/引导（内容极简稳定，只引导加载 sddu.md）；§2 组件 1/4 / §5.1 树 .agents 块 / 原则 1/2/4 / §5.2 行 / §6 同步；spec 同步 v1.27；ADR-004/007 同步 | 2026-11-24 | SDDU Plan Agent |
| v5.17 | 用户拍板**零 npm**：package.json / package-lock.json / node_modules 整体退役（零 TS 无依赖、零构建无脚本）；check/install/test 改裸 node/shell 直跑；§2 组件 2 / §5.1 树 / §5.2 行 / §5.3 差异同步；spec 同步 v1.26；ADR-001/005/006 同步；顺带修复 `.sddu` 双点残留 | 2026-11-24 | SDDU Plan Agent |
