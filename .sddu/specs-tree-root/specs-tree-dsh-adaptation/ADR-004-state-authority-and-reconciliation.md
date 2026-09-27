# ADR-004：state.json 为唯一权威，dsh 会话事件日志为观测与对账源

## 状态
PROPOSED

## 背景

SDDU 以 `state.json`（可变状态机：`phase` + `status` + `phaseHistory`）为事实源；dsh 以 **append-only `SessionEvent` 日志**为唯一事实源，并强制不变量「Model-visible ⟺ logged」（快照 §3.2，12 种事件变体，支持回放 / fork / resume / compaction）。两者在 dsh 上并存时谁是权威、如何对账此前无记录（Q-012 / 开放问题 2）。

FR-005 要求：阶段推进必须同步更新 `state.json`，且 `state.json` 与 dsh 侧可观测事实（会话观测 / 产物文件 / 会话事件日志）之间**不得出现单向不一致**；须定义一致性关系（谁是权威、如何对账、不一致时如何报告）；不一致时**报告而非静默覆盖**（EC-005）。核心状态机语义不得改动（NG-004）。

协调器指引：建议裁定 **`state.json` 为唯一权威状态源**，dsh append-only 事件日志仅作观测/对账源，保持 SDDU 核心状态机语义不变，对账规则按 FR-005 定义。

技术约束：dsh 的会话日志由 dsh 运行时维护，SDDU **不写入、不修改**它（Skill 包无执行能力，也不应触碰宿主日志）。因此 SDDU 能做的只是**声明自己写入什么、并要求模型把推进动作以结构化形式输出到会话中**，使会话日志自然获得一条可回放的推进证据。

## 决策

**1. 权威裁定：`state.json` 是唯一权威状态源。**

- `phase` / `status` / `phaseHistory` 的权威判定只以 `.sddu/specs-tree-root/<feature>/state.json` 为准。
- dsh 的 `SessionEvent` 日志是**观测源与对账源**，不构成第二权威；出现分歧时以 `state.json` 为准并**报告差异**，不修改日志、不静默覆盖 `state.json`。
- 该裁定**不改变核心状态机语义**（NG-004）：`phase` 流转、相邻性规则、`phaseHistory` 追加语义与 OpenCode 侧完全一致。

**2. 推进协议（`state-sync-protocol.md.hbs`，注入阶段 Skill）**

阶段推进时，模型必须：

1. 确认阶段产物已成功落盘（否则按 EC-008 报错并**不推进**）。
2. 用文件工具更新 `state.json`：`phase` → 目标阶段；`phaseHistory` **追加**一条 `{phase, status, timestamp, triggeredBy, comment}`（与既有 schema 一致）。
3. 在会话中输出一条**结构化同步记录**（进入 dsh `SessionEvent` 日志，成为可回放的过程证据）：

```
[SDDU-STATE-SYNC] {"feature":"specs-tree-x","from":"specified","to":"planned",
                   "artifact":"plan.md","phaseHistoryAdded":true,"ts":"<ISO8601>"}
```

**3. 对账规则（三方比对，人工执行 —— 无 CLI，NFR-005/NFR-006）**

| 比对项 | 来源 | 通过判据 | 不一致处理 |
|--------|------|---------|-----------|
| ① 状态 vs 产物 | `state.json.phase` ⟷ `.sddu/.../<feature>/` 内阶段产物文件 | `phase` 对应的产物存在且非空（如 `planned` → `plan.md`） | 报告「阶段已推进但产物缺失/为空」，提示回退或补产，**暂停推进** |
| ② 状态 vs 记录 | `state.json.phaseHistory` ⟷ 会话日志中的 `[SDDU-STATE-SYNC]` 记录 | 每个 phase 推进在日志中有对应 SYNC 记录（允许「日志有、state 无」= 曾尝试但未落盘） | 报告差异（单向不一致），指出**缺失侧**；禁止自动补齐任何一侧 |
| ③ 产物 vs 记录 | 阶段产物文件 ⟷ `[SDDU-STATE-SYNC].artifact` | 记录中的产物与磁盘实际产物一致 | 报告并暂停推进 |

- 对账**人工在 Web UI + 文件浏览中完成**，`docs/dsh/verification.md` 提供最小步骤序列与时间预算上限（NFR-005）。
- 「阶段已推进但无记录」**或**反向不一致，都必须以显式报告收尾（EC-005），不得静默覆盖任一侧；必要时暂停推进等待人工确认。

**4. 与 dsh 事件日志风格的关系（不模仿，只借用证据能力）**

不在本 Feature 中为 `state.json` 增加 append-only 事件日志（调研文档 §7 的 `SDDU-EVLOG-001` 借鉴建议属 ROADMAP 外事项，且会改动核心 `src/state/`，违反 NG-004 与最小侵入）。本 Feature 用「SYNC 记录 + 产物文件」借用 dsh 日志的**证据与回放能力**，而不改动核心存储模型。

## 后果

**正面**

- 权威单一、语义不变：跨平台行为一致（NFR-002），且不需要核心域任何改动（FR-009/NFR-004）。
- 对账规则可人工执行且判据明确，把「无 CLI」的验证缺口压缩为一份可操作清单（EC-006 不把「未观测」当「通过」）。
- `[SDDU-STATE-SYNC]` 记录使 dsh 会话日志成为天然的推进证据链（NFR-003），且与 ADR-003 的门禁块共同构成「门禁是否放行」的可回放证据。

**负面 / 需承担**

- SYNC 记录依赖模型遵从协议输出；若模型遗漏，日志侧会显示「无记录」——这会**被对账规则捕获为不一致并报告**（比静默更好，但仍需人工介入）。
- `state.json` 由模型用文件工具写入，存在并发/覆盖风险（同一会话多处推进）。当前不做文件锁（无执行能力）；缓解：协议要求「读 → 校验 → 写 → 输出 SYNC」的严格顺序，且对账规则可发现覆盖痕迹（`phaseHistory` 缺失中间条目）。
- dsh 会话日志的 `[SDDU-STATE-SYNC]` 记录**不是**机器可校验的强证据（可被模型伪造/遗漏）；文档不得将其表述为「运行时断言」。

**对下游（tasks）的约束**

- `state-sync-protocol.md.hbs` 是唯一状态协议来源；`[SDDU-STATE-SYNC]` 字段固定，测试断言每个阶段 `SKILL.md` 含该协议段。
- `docs/dsh/verification.md` 的 V3 场景必须包含三方对账步骤与通过判据；V1~V5 的观测依据统一声明为「会话内容 + `.sddu/` 产物 + 会话事件日志」。
