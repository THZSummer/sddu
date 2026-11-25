# ADR-004: 统一安装范式——.sddu/workspace 二分 + 唯一入口 sddu.md（.agents/skills 纯索引）

## 状态
PROPOSED（2026-11-22 用户拍板新增范围）

## 背景
两平台安装效果差异过大（OpenCode `.opencode/` 三目录结构 vs dsh `.dsh/skills/` ×11 skill 目录），平台事实散落在 install 脚本与构建脚本中；新增平台需逐处打补丁——这是 P-041 在「安装 / 模板落位」维度的表现。用户要求：**不同平台安装后的效果融合成同一套范式，无论新增任何平台，SDDU 框架（代码）都无需变动**。

## 决策
> **修订（2026-11-23，用户拍板）**：决策 ② 中 .sddu 内部组织由「methodology/{stages,contracts} 按类型分层」改为「modules/sddu-<业务>/ 按业务内聚」——一个业务一个自包含子包（sddu-<stage>.md 指令 + contracts/ 契约同包，指令命名即业务名），sddu.md 提至 .sddu 根；新增业务 = 新增一个模块目录，零中心注册。
三层范式：

**① 统一权威层 = .sddu / workspace 完全二分（2026-11-22 用户拍板命名；.sddu 内部四度拍板去载体化）**：

```text
<user-project>/.sddu/
├── .sddu/                                 # SDDU 本体（可整体重建、gitignored）——按方法论组织，无 agent/skill 概念
│   ├── sddu.md                        # 方法论内核（2026-11-23 修订：提至 .sddu 根）
│   └── modules/                          # 按业务模块组织（2026-11-23 修订，取代 methodology/{stages,contracts} 类型分层）
│       └── <业务>/                        #   一个阶段/流程 = 一个自包含子包：sddu-<stage>.md + contracts/
│                                          #   （7 阶段 + fast/roadmap/docs 共 10 包；指令 ×10 + 契约 ×31，含 plan 的 adr.md）
│   │                                        #   （ADR-006 修订：无 install.json——零构建纯复制，版本=sddu.md 头部）
└── workspace/                             # 用户项目产物（安装/升级绝不触碰、随项目提交）
    ├── ROADMAP.md                        # 版本路线图（流程生成；TREE.md 随 ADR-010 裁撤）
    ├── specs-tree-root/                   # Feature 工作空间（每 Feature 一个 specs-tree-<version>-<slug>/，自旧布局迁入）
    ├── docs-tree-root/                    # 项目全景聚合产物（sddu-docs，5 大领域）
    └── .sddu-config/                      # 用户对 sddu 的个性化配置（用户自有；2026-11-23 改名：skills/templates 合并 → sddu/ → sddu-config/ → .sddu-config/）
        └── modules/sddu-<stage>/               # 每阶段个性化：sddu-<stage>-{before,after}.md 钩子 + contracts/<contract>.md 覆盖（缺省回退 core）
```

铁律一句话：**安装/升级只写 `.sddu/`；SDDU 流程只写 `workspace/`；`.sddu/` 对流程只读**。升级 = 删掉重建 `.sddu/`；卸载 = 删 `.sddu/` + 入口，`workspace/` 保留。
**去载体化**：.sddu 内部只存在「阶段」与「契约」两个方法论概念——原 agent 指令 = 阶段指令（stages/），原输出模板 = 文档契约（contracts/）；原框架级 skills ×4（skill-discovery/creator/sync/tree）属工具类附属品，**移出 .sddu**、进入 FR-004 裁撤评估。

**② 唯一入口 = `.sddu/.sddu/sddu.md` 内核；`.agents/skills/sddu/SKILL.md` 为纯索引/引导，零运行时组件**（2026-11-24 用户拍板，C2 消解）：唯一入口是 sddu.md（**含路由表 + 门禁/状态协议 + 读取规则**），随「升级=删建 .sddu」天然版本一致；`.agents/skills/sddu/SKILL.md` 退化为纯索引（内容极简稳定：仅引导 Agent 加载 `.sddu/.sddu/sddu.md`，落位于平台中立的 `.agents/skills/`——行业趋同的跨平台技能目录，dsh 契约已识别该位置）；收到 `<stage> <feature>` 时，由 sddu.md 路由表**运行期读取 `.sddu/modules/sddu-<stage>/sddu-<stage>.md` 阶段指令**并遵循执行，产物按 `.sddu/modules/sddu-<stage>/contracts/` 契约组织（用户可用 `workspace/.sddu-config/modules/sddu-<stage>/contracts/` 同名模板覆盖，缺省回退 core；执行前/后按需读取 `workspace/.sddu-config/modules/sddu-<stage>/sddu-<stage>-{before,after}.md` 钩子，空则跳过）。（2026-11-23 修订：原 methodology/{stages,contracts} 路径随模块化调整；发现指针机制删除——`.agents/skills/` 为索引落位，不支持该约定的平台由用户自行放置索引文件，复制粘贴即得）

**③ 安装 = 复制粘贴整棵镜像（设计态即运行态，ADR-007）**（2026-11-23 修订）：仓库内 `sddu-project-template/` = 用户项目根镜像，安装 = `cp -r sddu-project-template/. <project>/`——源路径 = 安装后路径，零路径改写、零构建（ADR-006）、零清单（版本 = sddu.md 头部）；索引落位唯一 `.agents/skills/sddu/SKILL.md`（全平台同一份，零运行时组件）；唯一入口 sddu.md 随本体重建。新增平台：支持 `.agents/skills` 约定即零成本，不支持者由用户自行放置索引文件。

**核心判据（可测试）**：① 新增平台 = 在模板目录放一个入口 md（连构建都不用跑），内核、载体源**零改动**；② 安装/升级前后 `workspace/` 内容逐字节不变；③ 存量旧布局（`.sddu/specs-tree-root` 等在根下）由安装器检测并自动迁移至 `workspace/`（迁移前备份，失败回滚并逐项报告）。

**取舍（如实声明）**：① 平台原生多入口直调收敛为单入口内部路由（兼容别名由 sddu.md 路由表承载）；② dsh 侧静态结构断言从 11 skill 调整为 1 入口 + .sddu 计数断言；③ 阶段指令的加载从「构建期拼进 11 份 SKILL.md」变为「运行期 sddu.md 路由表读 .sddu 文件」；④ **OpenCode 侧插件运行时（`src/adapters/opencode/plugin.ts` 状态机硬门禁 / 工具注册）退役**——两平台统一为协议软引导，OpenCode 失去代码级强制（`PhaseSkipError` 等抛错）与平台工具注册（如 sddu_update_state），状态推进全部走文件协议（与 dsh 现状一致）；~~`src/state/` 保留为**仓库内校验工具库**（validateStateV3 等供构建/检查脚本与 FR-007 迁移使用），不再随安装分发~~（**2026-11-23 修订，ADR-005**：`src/state/` 及全部 TS 整体裁撤，校验职责并入 e2e 结构回归，仓库零 TypeScript）；硬门禁能力是否以其他形态回归，留 v12.0.0 重估。

**迁移面（已量化）**：`.sddu/specs-tree-root` 路径引用 33 个文件 + 其他 `.sddu/{skills,ROADMAP,TREE,templates}` 直引 26 个文件，均为机械替换（`specs-tree-root` → `workspace/specs-tree-root` 等）；~~`src/state/` 仅路径常量变更、状态机语义不动~~（ADR-005 修订：整体裁撤，语义移交 sddu.md）；本仓库自身（dogfooding）工作空间随 build 阶段一并搬迁。

## 后果
- 正面：安装效果统一且极简（.sddu/workspace 二分 + 全平台同一份索引于 `.agents/skills/sddu/` + 唯一入口 sddu.md）；**零运行时组件、入口零平台副本**；两平台能力模型完全一致；新增平台支持 `.agents/skills` 即零适配；分发坍缩为「复制粘贴整棵 `sddu-project-template/`，零构建」（ADR-006/007）。
- 负面：OpenCode 失去代码级硬门禁与工具注册（用户显式拍板接受）；`plugin.ts` / package.cjs 插件打包链 / opencode 侧 e2e 基线需退役或改造；存量 opencode 插件安装需迁移（卸载插件 → 装 .sddu + 单 agent）。
- 边界：门禁强制力 / 命令注册 / 渲染 seam 的运行时能力是否以新形态回归，留 v12.0.0 重估（ADR-003）。
