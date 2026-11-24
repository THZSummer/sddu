# ADR-026: 标记命令族与仪表盘语义按现状设计保留——全量蒸馏进 sddu.md（能力丢失排查 L8）

## 状态
PROPOSED（2026-11-24 用户拍板：L8——按现状设计实现即可）

## 背景
能力丢失排查（capability-loss-audit.md L8）：原路由模板（sddu.md.hbs）承载的「写状态」与「读状态」富语义在新设计中只有笼统落点（「路由表 + 门禁/状态协议 + 读取规则」+「状态仪表盘」），五组语义未逐项决策：

1. **标记命令族**：`@sddu 标记` suspended[--until/--note] / terminated / merged[--into] / tracked → 用户二次确认（不可逆）→ 状态落盘
2. **仪表盘 6 区分类**：进行中 / 已完成 / 搁置 / 终止 / 迁出 / 异常
3. **30 天停滞检测 + suspendedUntil 到期提醒 🔔 + merged 目标存在性检查 ⚠️**
4. **子随父归**：非 tracked 祖先下的子 feature 归入父节点、不独立展示
5. **下一步推荐**：tracked 且未 validated 时给出下一阶段命令

## 决策
**五组语义按现状设计保留，全量蒸馏进 sddu.md**（不重设计、不裁剪语义，仅载体换轨）：

### 蒸馏落位

- **标记命令族 → sddu.md 状态协议段**：标记命令语法（参数 --until/--note/--into）、**不可逆二次确认**（terminated/merged 终态，用户显式确认后才执行）、状态可逆表（A3，仅 suspended→tracked 可逆）一体承载；
- **仪表盘语义 → sddu.md 读取规则段（仪表盘协议）**：6 区分类、子随父归（上溯找第一个非 tracked 祖先）、停滞检测（**由 phaseHistory 末条时间戳现算**，阈值 30 天，零存储——纯展示时计算，不落任何字段）、suspendedUntil 到期提醒（status=suspended 且 suspendedUntil 已过 → 🔔）、merged 目标存在性检查（mergedInto 对应目录不存在 → ⚠️）、下一步推荐（tracked 且未 validated → 下一阶段命令，phaseActionMap 语义）；
- **同步三处 → 一处**：原「feature state.json + root state.json + TREE.md 三处同步」随 ADR-008（root state 退役）/ ADR-010（TREE 退役）自然退化为**单处写 feature state.md**——语义简化为单写，无需新决策。

### 字段契约适配（ADR-005 第二次扩展）

标记命令族的 `--until/--into` 参数需要载体——对应原 state.json 的 SuspendedInfo（until/note）/ MergedInfo（mergedInto）：

| 新增可选字段 | 伴随条件 | 对应原字段 |
|--------------|----------|------------|
| `suspendedUntil` | status=suspended 时有意义 | SuspendedInfo.until |
| `mergedInto` | status=merged 时**必填**（保持原 validateStateV3 语义） | MergedInfo.mergedInto |

- front-matter 契约：十字段（ADR-016 后）→ **十二字段**（+ `suspendedUntil` / `mergedInto`，均可选、伴随对应 status）；
- 挂起原因 note 不入 front-matter——属人类可读信息，进 state.md 正文（与 description 同层）；
- 停滞检测**零新增字段**：phaseHistory 末条时间戳即判定依据。

## 对既有设计的修订
- **ADR-005**：字段契约十字段 → 十二字段（补 `suspendedUntil` / `mergedInto` 可选伴随字段）。
- **TASK-002 蒸馏底稿**：范围扩展——除 ADR-021 九条外，新增「标记命令族 + 仪表盘协议」两组语义（以 sddu.md.hbs 路由段 + schema SuspendedInfo/MergedInfo 为底稿）。
- 存量转换：state.json 的 suspendedUntil/mergedInto 直接入 front-matter；note 进正文。

## 后果
- 正面：L8 五组语义零丢失；写状态与读状态的协议完整性保持；停滞检测以现算替代存储（不违反「元数据不是状态」——展示时计算，不落字段）。
- 负面：front-matter 增至十二字段（其中两个为条件性伴随字段，实际负担小）；仪表盘协议段增加 sddu.md 篇幅。
- 不可逆性：低——均为协议文本，逐节确认（ADR-021 验收方式同构）。
