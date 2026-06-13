# 📋 Feature Specification: SDDU 特性状态增强

**Feature ID**: FR-STATUS-ENHANCE-001  
**Feature 名称**: SDDU 特性状态增强  
**创建日期**: 2026-06-12  
**优先级**: P1  
**阶段**: specified  
**Discovery 版本**: v5.0.0（最终模型 — 两字段隔离，全 -ed 形态）

---

## 1. 上下文

### 1.1 问题描述

当前 SDDU 状态系统用一个 `state` 字段承载两类语义——阶段（如在哪个 SDDU 阶段）和流转状态（如是否搁置、终止），导致 `validStatuses` 膨胀且语义冲突：

```json
{ "state": "discovered" }   // 这是阶段
{ "state": "validated" }    // 这也是阶段
{ "state": "terminated" }   // 这不是阶段，是流转状态
{ "state": "drafting" }     // 模糊：阶段还是状态？
{ "state": "completed" }    // 和 validated 的区别？说不清
```

此外，当前系统还存在以下结构异常：

| # | 异常 | 具体表现 |
|---|------|---------|
| 1 | 缺失 state.json | `plugin-rename-sddu/` 仅有 validation-result.json |
| 2 | 隐藏 state 文件 | `sdd-plugin-roadmap/` 使用 `.state.json`（被 tree-scanner 跳过） |
| 3 | 根引用失效 | root state.json 引用 `e2e-script-cleanup` 但目录不存在 |
| 4 | 字段命名混用 | 6 个 feature 用 `state` 键，6 个用 `status` 键 |
| 5 | 非标状态值 | `sdd-plugin-baseline` 使用 `"completed"`（不在 schema 中） |
| 6 | 父子归并缺失 | `solo-team-flow` 已终止但 3 个子特性仍独立统计为 `drafting` |

### 1.2 目标用户

| 角色 | 职责 | 使用方式 |
|------|------|----------|
| **SDDU 普通用户** | 日常使用 `@sddu 状态` 查看项目进度 | 消费者：通过分类仪表盘快速了解项目全局 |
| **SDDU 插件维护者** | 维护 SDDU 插件源码 | 提供者：实现两字段模型、一致性检测、标记命令 |
| **团队 TL** | 管理 Feature 生命周期 | 操作者：通过 `@sddu 标记` 命令管理 Feature 流转状态 |

### 1.3 核心模型（已确认，不可变更）

**两字段隔离**：`phase`（8 阶段）+ `status`（5 状态），完全独立，互不推导。

```
phase（8 个阶段）           status（5 个流转状态）
───────────────────         ─────────────────────
registered                   tracked     正常追踪，流转中（新建默认）
discovered                   completed   已完成（phase 到 validated 时系统自动）
specified                    suspended   搁置，可能恢复（用户标记）
planned                      terminated  永久终止，不可逆（用户标记）
tasked                       merged      迁出，合并到其他特性（用户标记）
builded
reviewed
validated
```

**Phase 命名规则**：所有阶段统一 `动词 + ed` 形态。`builded` 替代 `built`（不规则），保持命名一致。

**Phase 流转**（系统自动，单向不可逆）：
```
registered → discovered → specified → planned → tasked → builded → reviewed → validated
```

**Status 流转**：
```
                        ┌──────────────────────────────┐
                        │          tracked              │
                        │     (新建 feature 默认)        │
                        └──────┬───────┬───────┬───────┘
                 ┌─────────────┘       │       └─────────────┐
                 ▼                     ▼                     ▼
           ┌──────────┐          ┌──────────┐          ┌──────────┐
           │ suspended│          │terminated│          │  merged  │
           │  搁置    │          │  终止    │          │  迁出    │
           └────┬─────┘          └──────────┘          └──────────┘
                │
                │ 用户恢复
                ▼
           ┌──────────┐
           │ tracked  │
           └────┬─────┘
                │
                │ phase 到达 validated
                ▼
           ┌──────────┐
           │completed │
           │  已完成   │
           └──────────┘
```

**status 语义表**：

| status | 含义 | 还会回来吗 | 谁设置 | 可逆吗 |
|--------|------|-----------|--------|--------|
| `tracked` | 正常追踪，流转中 | — | 系统（新建默认） | — |
| `completed` | 已完成 | — | 系统（phase 到 validated 时自动） | ❌ 不可逆 |
| `suspended` | 暂时搁置 | ⏳ 可能 | 用户 | ✅ 可恢复（→ tracked） |
| `terminated` | 永久终止 | ❌ 永不 | 用户 | ❌ 不可逆 |
| `merged` | 迁出到其他特性 | ❌ 转嫁 | 用户 | ❌ 不可逆 |

**附加字段**：

```json
// suspended 可选字段
{
  "status": "suspended",
  "suspendedUntil": "2027-03-01",      // 可选：到期提醒
  "suspendedNote": "等 XX 依赖就绪"     // 可选：原因
}

// merged 必填字段
{
  "status": "merged",
  "mergedInto": "specs-tree-other-feature",  // 必填：目标特性
  "mergedAt": "2026-06-12"
}
```

### 1.4 推荐继续规则

`@sddu 状态` 仅推荐 `status === "tracked" && phase !== "validated"` 的特性继续下一步。

| phase | status | 推荐继续？ | 原因 |
|-------|--------|-----------|------|
| `registered` | `tracked` | ✅ | 待启动，下一步 discovery |
| `discovered` | `tracked` | ✅ | 下一步 spec |
| `specified` | `tracked` | ✅ | 下一步 plan |
| `planned` | `tracked` | ✅ | 下一步 tasks |
| `tasked` | `tracked` | ✅ | 下一步 build |
| `builded` | `tracked` | ✅ | 下一步 review |
| `reviewed` | `tracked` | ✅ | 下一步 validate |
| `validated` | `completed` | ❌ | 已走完全部流程 |
| 任意 | `suspended` | ❌ | 被搁置 |
| 任意 | `terminated` | ❌ | 被终止 |
| 任意 | `merged` | ❌ | 已迁出 |

### 1.5 修改范围边界

**直接修复范畴** = 除以下三项之外的全部源码：
- `.opencode/*`（运行时产物，安装脚本生成）
- `.sddu/*`（运行时产物，用户项目状态数据）
- `opencode.json`（运行时产物，OpenCode 配置）

直接修复范畴包括但不限于：
- `src/state/` — schema、machine、loader、scanner、consistency-checker 等模块
- `agents/` — sddu.md、sddu-docs.md 等 agent 定义
- `templates/` — 输出模板

**非直接修复范畴的处理方式**（R5 内置升级机制）：
- 用户安装新版 SDDU 插件后，首次执行 `@sddu 状态` 时由 R5 一致性检测发现不符合新 phase/status 规则的 state.json
- → 请示用户
- → 获同意后自动修复

> **设计原则**：此能力应作为 SDDU 插件的**内置升级机制**。每次插件版本升级后，首次执行 `@sddu 状态` 时自动触发一致性检测，确保运行时产物始终按最新设计规则保持同步，而非仅本次 feature 一次性使用。

---

## 2. 目标与非目标

### Goals（要达成的）

1. 将 state.json 从单字段混用重构为 `phase`（8 值）+ `status`（5 值）两字段隔离模型
2. `@sddu 状态` 输出中，`status` 非 `tracked` 的特性不出现于操作建议区，不参与活跃统计
3. `status` 非 `tracked` 的父特性下的子特性归入父节点显示（子随父归）
4. Schema 支持 phase（8 值）+ status（5 值）联合验证，phase 到 validated 时自动设 status 为 completed
5. 实现**内置升级机制**（R5）：每次插件版本升级后首次 `@sddu 状态` 自动触发一致性检测，请示用户后修复
6. 提供 `@sddu 标记` 命令，一键标记 Feature 的 status（suspended/terminated/merged）
7. `@sddu 状态` 输出重构为分类仪表盘
8. 父特性根据子特性进度聚合展示
9. suspended 到期被动提醒（仅在用户执行 `@sddu 状态` 时检测并提示）

### Non-Goals（明确不做）

1. ❌ 不自动变更 suspended 到期后的 status（仅提醒，不自动操作）
2. ❌ 不静默兼容历史格式（`.state.json`、`validation-result.json` 等），由 R5 检测 → 请示用户 → 获同意后修复
3. ❌ 不删除任何历史文件或目录
4. ❌ 不自动清理 root state.json 历史数据
5. ❌ 不做主动推送/定时通知（suspended 到期仅被动检测）
6. ❌ 不做 phase 回退（单向不可逆）
7. ❌ 不做 completed/terminated/merged 的逆操作

---

## 3. 用户故事

| ID | 用户故事 |
|----|----------|
| US-001 | 作为 **SDDU 普通用户**，我想要 `@sddu 状态` 输出只展示活跃特性，以便不被已终止/搁置的特性干扰决策 |
| US-002 | 作为 **SDDU 普通用户**，我想要已终止父特性下的子特性自动归入父节点，以便状态展示清晰一致 |
| US-003 | 作为 **团队 TL**，我想要通过 `@sddu 标记 <f> suspended` 一键搁置暂不推进的特性，以便专注当前优先级 |
| US-004 | 作为 **团队 TL**，我想要 `@sddu 状态` 展示分类仪表盘，以便快速了解项目全局 |
| US-005 | 作为 **SDDU 插件维护者**，我想要版本升级后自动检测并修复不符合最新规则的 state.json，以便运行时产物与设计规则保持同步 |

---

## 4. 功能需求

### 4.1 MVP — Must Have（R1-R5）

#### R1: 两字段模型落地

**FR-001**: state.json 使用 `phase` + `status` 替代混用字段
- **描述**: Feature 的 state.json 使用两个独立字段：`phase`（8 值）表示 SDDU 阶段，`status`（5 值）表示流转状态。废弃原有混用字段（如 `state`、`status` 承载阶段值）。
- **phase 合法值**（8 个，统一 -ed）：`registered`、`discovered`、`specified`、`planned`、`tasked`、`builded`、`reviewed`、`validated`
- **status 合法值**（5 个）：`tracked`、`completed`、`suspended`、`terminated`、`merged`
- **新建默认**: `phase: "registered"`, `status: "tracked"`
- **验证条件**:
  - [ ] state.json 同时包含 `phase` 和 `status` 两个字段
  - [ ] 不再使用单一字段承载阶段+流转状态的双重语义
  - [ ] 新建 Feature 的 state.json 自动写入 `phase: "registered"` 和 `status: "tracked"`
  - [ ] Phase 值严格限定在 8 个合法值内
  - [ ] Status 值严格限定在 5 个合法值内

**FR-002**: Phase 自动推进
- **描述**: Phase 由各 SDDU 阶段 Agent 自动推进，单向不可逆。
- **流转路径**: `registered → discovered → specified → planned → tasked → builded → reviewed → validated`
- **触发者**: 系统（各阶段 Agent 完成时自动）
- **验证条件**:
  - [ ] 不允许 phase 回退（如 validated → reviewed 被拒绝）
  - [ ] 不允许 phase 跳跃（如 registered → specified 被拒绝）
  - [ ] 每个阶段 Agent 完成时自动将 phase 推进到下一阶段

#### R2: Status 过滤

**FR-003**: 非 tracked 特性不在建议区列出，不参与活跃统计
- **描述**: `@sddu 状态` 输出时，`status` 非 `tracked` 的特性（含 suspended/terminated/merged/completed）不在操作建议区（"建议继续"区）列出，不参与活跃特性计数。
- **过滤逻辑**: 仅 `status === "tracked"` 的特性出现在活跃区和操作建议中
- **验证条件**:
  - [ ] suspended 特性不出现在操作建议区
  - [ ] terminated 特性不出现在操作建议区
  - [ ] merged 特性不出现在操作建议区
  - [ ] completed 特性不出现在操作建议区
  - [ ] 活跃统计计数仅包含 tracked 特性

#### R3: 子随父归

**FR-004**: 非 tracked 父特性下的子特性归入父节点显示
- **描述**: 当父特性的 `status` 为 `suspended`、`terminated` 或 `merged` 时，其所有子特性归入父节点下统一显示，不独立出现在活跃区。
- **递归处理**: 如果父特性非 tracked，其所有后代（子、孙…）都归入该父节点
- **验证条件**:
  - [ ] terminated 父特性下的子特性不独立出现在活跃区
  - [ ] suspended 父特性下的子特性不独立出现在活跃区
  - [ ] merged 父特性下的子特性不独立出现在活跃区
  - [ ] 子特性在父节点下正确缩进显示
  - [ ] 递归生效：子特性的子特性同样归入最顶层非 tracked 祖先

#### R4: Schema 扩展

**FR-005**: Phase + status 联合验证
- **描述**: Schema 支持对 `phase` 和 `status` 字段的独立验证，以及组合约束规则。
- **phase 约束**: 8 个合法值，必填，单向单调递增
- **status 约束**: 5 个合法值，必填
- **组合约束**:
  - `status: "completed"` 仅在 `phase: "validated"` 时合法
  - `status: "merged"` 必须同时提供 `mergedInto` 字段
  - `status: "suspended"` 可选提供 `suspendedUntil` 和 `suspendedNote`
- **验证条件**:
  - [ ] 非法 phase 值被拒绝并给出明确错误信息
  - [ ] 非法 status 值被拒绝并给出明确错误信息
  - [ ] completed 出现在非 validated 阶段时被标记为异常
  - [ ] merged 未提供 mergedInto 时被标记为异常

**FR-006**: Phase 到达 validated 时自动设 status 为 completed
- **描述**: 当 validate Agent 完成、phase 被推进到 `validated` 时，系统自动将 `status` 设置为 `completed`（如果当前 status 为 `tracked`）。
- **不覆盖规则**: 如果当前 status 已是 `suspended`/`terminated`/`merged`，则不自动变更
- **单向**: completed 设置后不可逆
- **验证条件**:
  - [ ] phase 到达 validated 后 status 自动变为 completed（tracked 情况下）
  - [ ] suspended/terminated/merged 的 status 在 phase 推进时不被覆盖
  - [ ] completed 不可回退到 tracked

#### R5: 一致性检测（内置升级机制）

**FR-007**: 版本升级后首次 `@sddu 状态` 自动触发一致性检测
- **描述**: 每次 SDDU 插件版本升级后，首次执行 `@sddu 状态` 时自动触发一致性检测。检测对象为所有 Feature 的 state.json，检查是否符合当前 phase/status 规则。发现不一致时，请示用户是否修复，获同意后自动修复。
- **检测项**:
  1. **缺失 state.json**: 目录存在但无 state.json（或仅有 validation-result.json）
  2. **隐藏 state 文件**: 存在 `.state.json`（应规范为 state.json）
  3. **根引用失效**: root state.json 引用的 Feature 目录不存在
  4. **字段命名混用**: state.json 使用 `state` 字段承载阶段值（应为 `phase`）
  5. **非标状态值**: status 字段不在 5 个合法值内
  6. **字段缺失**: state.json 缺少 `phase` 或 `status` 字段
  7. **组合约束违反**: completed 不在 validated 阶段等
- **触发条件**: 插件版本号变更后首次 `@sddu 状态` 调用
- **交互流程**: 检测 → 列出异常 → 请示用户 → 获同意 → 修复 → 输出修复报告
- **版本号来源**: SDDU 插件自身的版本标识
- **验证条件**:
  - [ ] 版本升级后首次 `@sddu 状态` 自动扫描所有 state.json
  - [ ] 检测出缺失/隐藏/失效/混用/非标等异常
  - [ ] 异常按类型分组展示
  - [ ] 修复前需用户明确确认
  - [ ] 修复后输出变更报告
  - [ ] 同版本第二次 `@sddu 状态` 不再触发检测（除非发现新异常）

**FR-008**: 一致性检测修复时不覆盖非 tracked 的 status
- **描述**: 修复 phase 字段问题时，如果当前 status 已是 `suspended`、`terminated` 或 `merged`（用户明确设定的非 tracked 状态），修复程序不得将其改回 `tracked`。
- **保护逻辑**: 修复阶段字段（phase）时，保持已有 status 不变
- **验证条件**:
  - [ ] suspended 特性的 phase 被修复为正确阶段后，status 仍为 suspended
  - [ ] terminated 特性的 phase 被修复为正确阶段后，status 仍为 terminated
  - [ ] merged 特性的 phase 被修复为正确阶段后，status 仍为 merged

### 4.2 V1 — Should Have（R6-R9）

**FR-009**: `@sddu 标记` 命令
- **描述**: 提供 `@sddu 标记 <feature-name> <status> [options]` 命令，一键设置 Feature 的流转状态。
- **命令格式（结构化输入）**:
  - `@sddu 标记 <f> suspended [--until <date>] [--note <text>]`
  - `@sddu 标记 <f> terminated`
  - `@sddu 标记 <f> merged --into <target-feature>`
  - `@sddu 标记 <f> tracked`（从 suspended 恢复）
- **命令格式（自然语言输入，需推导用户真实意图）**:
  - `@sddu 帮我挂起 xxx` → 推导为 suspended
  - `@sddu 把 xxx 终止掉` → 推导为 terminated
  - `@sddu xxx 合并到 yyy` → 推导为 merged --into yyy
  - `@sddu 恢复 xxx` → 推导为 tracked
  - 其他等价的自然语言表达均应支持，不认死理
- **意图推导原则**: AI 时代不做关键词映射表。根据用户自然语言输入的语义，推导真实意图（status、feature 名称、附加参数），推导结果在执行前向用户确认。
- **交互要求**:
  - terminated/merged 操作需要用户二次确认（不可逆）
  - merged 缺少 --into 参数时报错
  - 自然语言推导结果在执行前展示确认
  - 标记成功后输出当前状态确认
- **三处同步**: 标记操作需同步更新：
  1. 目标 Feature 的 state.json
  2. root state.json（如果涉及根引用）
  3. 对应 README.md 的状态标注
- **验证条件**:
  - [ ] `@sddu 标记 foo suspended` 将 foo 的 status 设为 suspended
  - [ ] `@sddu 帮我挂起 foo` 推导为 suspended 并执行
  - [ ] `@sddu 标记 foo terminated` 需要二次确认后执行
  - [ ] `@sddu 标记 foo merged --into bar` 设置 mergedInto 并需要确认
  - [ ] `@sddu 标记 foo merged` 缺少 --into 时报错
  - [ ] 标记后 state.json、root state.json、README.md 三处同步更新

**FR-010**: `@sddu 状态` 分类输出
- **描述**: `@sddu 状态` 输出重构为分类仪表盘，按 status 分区展示。
- **分区结构**:
  - 🟢 **进行中**: `status: "tracked"` 且 `phase !== "validated"`
  - ✅ **已完成**: `status: "completed"` 或 `phase: "validated"` 且 `status: "tracked"`
  - 🟡 **搁置**: `status: "suspended"`
  - 🔴 **终止**: `status: "terminated"`
  - 🔵 **迁出**: `status: "merged"`
  - ⚠️ **异常**: 缺失 state.json / 字段违规 / 引用失效等
- **各区展示内容**:
  - 进行中: 当前 phase
  - 搁置: suspendedUntil（如有）、suspendedNote（如有）、搁置时长
  - 终止: 终止时间
  - 迁出: 目标特性（mergedInto）
  - 异常: 异常类型、具体描述
- **验证条件**:
  - [ ] 输出分为 6 个明确的视觉分区
  - [ ] 进行中区仅含 tracked + 非 validated 特性
  - [ ] 各区按优先级/时间排序
  - [ ] 异常区列出所有结构异常

**FR-010b**: 智能引导
- **描述**: 系统级通用能力。基于当前状态推导用户意图，给出下一步操作建议清单，帮助用户决策。不限于 `@sddu 状态` 一个场景。
- **核心原则**: SDDU 帮助用户使用 SDDU。无论用户输入什么，系统都应基于当前状态给出合理的下一步建议。
- **应用场景**:
  - `@sddu 状态` 输出末尾挂载智能引导清单
  - `@sddu 标记` 中识别自然语言输入并推导意图（FR-009）
  - 用户输入模糊/不完整时，基于状态推导最可能的意图
  - 所有特性已完成时，建议 `@sddu roadmap`
- **引导清单模板**（以 `@sddu 状态` 末尾为例）:
  - `@sddu 继续执行 xxx` → 下一阶段
  - `@sddu 恢复搁置的 xxx` → 恢复 suspended
  - `@sddu 修复异常` → 触发 R5 一致性检测
  - 其他基于当前状态推导的合理操作
- **推导原则**: AI 时代不做规则表，基于语义理解推导真实意图
- **验证条件**:
  - [ ] `@sddu 状态` 末尾汇总可执行操作清单
  - [ ] 进行中特性附带下一步建议命令（如 `@sddu plan xxx`）
  - [ ] 搁置特性附带恢复建议
  - [ ] 异常附带修复建议
  - [ ] 全文无关键词硬匹配逻辑

**FR-011**: 父特性聚合展示
- **描述**: 父特性（isParent: true）根据其所有子特性的 phase 进度聚合展示当前整体状态。
- **聚合规则**:
  - 显示子特性总数
  - 统计各 phase 分布（如: 3 specified, 2 tasked, 1 builded）
  - 显示最高完成度（子特性中最靠后的 phase）
  - 显示最低完成度（子特性中最靠前的 phase）
- **验证条件**:
  - [ ] 父特性输出显示子特性数量和 phase 分布
  - [ ] 父子关系正确导航
  - [ ] 非 tracked 父特性不参与聚合（归于父节点）

**FR-012**: Suspended 到期被动提醒
- **描述**: 用户执行 `@sddu 状态` 时，检测所有 `suspended` 特性中 `suspendedUntil` 已到期的项，列出提醒用户确认是否恢复或终止。
- **触发时机**: 仅在 `@sddu 状态` 时被动检测
- **不做**: 主动推送、定时通知、自动变更状态
- **提醒内容**: 特性名称、搁置时间、到期时间、原有 note
- **验证条件**:
  - [ ] suspendedUntil 已到期的特性在 `@sddu 状态` 输出中带提醒标记
  - [ ] 提醒包含确认选项（恢复 / 继续搁置 / 终止）
  - [ ] 未到期的 suspended 特性不做提醒
  - [ ] 无 suspendedUntil 的 suspended 特性不做到期提醒

### 4.3 V2 — Nice to Have（R10-R12）

**FR-013**: 长期停滞检测
- **描述**: 检测长时间无 phase 推进的 tracked 特性，提醒用户审视是否需搁置或推进。
- **停滞阈值**: 可配置，默认 30 天
- **检测逻辑**: `updatedDate` 距今超过阈值且 phase 未达 validated
- **优先级**: Nice to Have — V2 实现

**FR-014**: Merged 特性跳转追溯
- **描述**: 在 `@sddu 状态` 输出中，merged 特性提供可跳转到目标特性（mergedInto）的导航链接。
- **展示**: 显示 "🔵 迁出 → specs-tree-other-feature" 格式，支持导航
- **优先级**: Nice to Have — V2 实现

---

## 5. 非功能需求

**NFR-001**: 性能 — `@sddu 状态` 扫描耗时
- **描述**: 即使项目包含 50+ Feature 目录，`@sddu 状态` 扫描+输出总耗时不超过 3 秒
- **验证条件**: 在包含 50 个 Feature 的项目中，`@sddu 状态` 从触发到输出完成 ≤ 3s

**NFR-002**: 性能 — 一致性检测耗时
- **描述**: R5 一致性检测（全量 state.json 扫描+校验）耗时不超过 5 秒
- **验证条件**: 50 个 Feature 目录下，一致性检测 ≤ 5s

**NFR-003**: 可靠性 — 非 tracked 状态保护
- **描述**: 任何自动流程（auto-updater、一致性修复、phase 推进等）不得在未经用户确认的情况下修改 `status` 字段，尤其是 `suspended`/`terminated`/`merged`
- **验证条件**: 100% 的自动流程保留用户设定的非 tracked status

**NFR-004**: 可用性 — 标记命令错误提示
- **描述**: `@sddu 标记` 命令在参数错误时输出清晰的错误信息，包含正确用法示例
- **验证条件**: 缺少 --into 参数时提示 "merged 状态需要 --into <target-feature> 参数"

**NFR-005**: 兼容性 — 插件版本升级无感
- **描述**: SDDU 插件版本升级后，用户无需手动执行迁移脚本。R5 自动触发一致性检测，请示用户后修复
- **验证条件**: 升级安装后，首次 `@sddu 状态` 自动触发 R5

**NFR-006**: 可维护性 — Schema 扩展性
- **描述**: 新增 phase 值或 status 值只需在一处集中定义（如常量枚举），所有引用方自动生效
- **验证条件**: 在 schema 定义文件中新增一个 phase 值后，验证逻辑、输出模板、文档生成自动包含新值

---

## 6. 技术设计

### 6.1 架构影响

```
src/state/
├── schema.ts                  # 🔴 重大修改 — phase(8值) + status(5值) 联合 schema
├── machine.ts                 # 🔴 重大修改 — getNextStep() 基于 phase+status 联合推导
├── state-loader.ts            # 🟡 中等修改 — 识别新模型，保护非 tracked 的 status
├── tree-scanner.ts            # 🟡 中等修改 — 扫描时标记 status，支持子随父归
├── consistency-checker.ts     # 🆕 新建 — 版本升级一致性检测+修复
└── auto-updater.ts            # 🟡 中等修改 — 跳过非 tracked 特性

agents/
├── sddu.md                    # 🔴 重大修改 — 状态扫描逻辑：过滤+分类+子随父归+标记命令
└── sddu-docs.md               # 🟡 中等修改 — README 生成时根据 status 标注对应标记

templates/
└── (输出模板适配新字段)        # 🟢 轻量 — phase/status 变量替换
```

### 6.2 数据模型变更

**state.json 目标格式**（替代当前混用格式）：

```json
{
  "featureId": "FR-XXX",
  "name": "Feature Name",
  "phase": "specified",
  "status": "tracked",
  "priority": "P1",
  "createdDate": "2026-06-12",
  "updatedDate": "2026-06-12",
  "isParent": false,
  "description": "...",
  "dependencies": {
    "on": [],
    "blocking": []
  }
}
```

**关键变更**:
- 🔴 废弃: `state` 字段（当前混用字段）
- 🆕 新增: `phase` 字段（8 值）
- 🆕 新增: `status` 字段（5 值）
- 🆕 可选: `suspendedUntil`（ISO 日期字符串）
- 🆕 可选: `suspendedNote`（搁置原因）
- 🆕 必填: `mergedInto`（merged 状态时）
- 🆕 可选: `mergedAt`（迁出时间）

### 6.3 关键算法

**getNextStep(phase, status)**:
```
if status !== "tracked" → return null (不推荐继续)
if phase === "validated" → return null (已完成)
phaseMap = {
  registered → discovery
  discovered → spec
  specified → plan
  planned → tasks
  tasked → build
  builded → review
  reviewed → validate
}
return phaseMap[phase]
```

**子随父归 (child-belongs-to-parent)**:
```
function getEffectiveDisplay(feature, allFeatures):
  ancestor = findFirstNonTrackedAncestor(feature, allFeatures)
  if ancestor exists:
    return { displayUnder: ancestor, independent: false }
  else:
    return { displayUnder: null, independent: true }
```

### 6.4 涉及文件（直接修复范畴）

| 文件 | 改动等级 | 说明 |
|------|----------|------|
| `src/state/schema.ts` | 🔴 重大 | phase（8值）+ status（5值）联合 schema |
| `src/state/machine.ts` | 🔴 重大 | getNextStep() 联合推导 + 状态流转验证 |
| `src/state/state-loader.ts` | 🟡 中等 | 识别新模型，保护非 tracked 的 status |
| `src/state/tree-scanner.ts` | 🟡 中等 | 扫描时标记 status，子随父归逻辑 |
| `src/state/consistency-checker.ts` | 🆕 新建 | 版本升级检测 + 修复（R5） |
| `src/state/auto-updater.ts` | 🟡 中等 | 跳过非 tracked 特性 |
| `agents/sddu.md` | 🔴 重大 | 状态扫描：过滤 + 分类 + 子随父归 + 标记命令 |
| `agents/sddu-docs.md` | 🟡 中等 | README 生成时根据 status 标注对应标记 |
| `templates/output/*.hbs` | 🟢 轻量 | 适配 phase/status 变量 |

### 6.5 非直接修复范畴（设计约束）

以下文件/目录不在本 feature 直接改动范围内，但设计需支持 R5 自动修复：

- `.opencode/*`（运行时产物）
- `.sddu/*`（用户项目状态数据）
- `opencode.json`（OpenCode 配置）

---

## 7. 边界情况

**EC-001**: Phase 回退尝试
- **场景**: 试图将 phase 从 specified 改回 discovered
- **预期**: 系统拒绝，报错 "Phase 流转单向不可逆"

**EC-002**: Phase 跳跃尝试
- **场景**: 试图将 phase 从 registered 直接设为 planned
- **预期**: 系统拒绝，报错 "Phase 必须按序推进，当前为 registered，下一步为 discovered"

**EC-003**: Suspended 期间 phase 推进
- **场景**: Feature 被 suspended 后，用户手动触发阶段推进
- **预期**: 允许 phase 推进（阶段和状态独立），但不推荐继续（status 非 tracked）

**EC-004**: Completed 后试图修改 status
- **场景**: Feature 已完成（completed），用户试图标记为 suspended
- **预期**: 拒绝，报错 "completed 状态不可逆"

**EC-005**: Terminated 后试图恢复
- **场景**: Feature 已终止（terminated），用户试图标记为 tracked
- **预期**: 拒绝，报错 "terminated 状态不可逆"

**EC-006**: Merged 缺少 mergedInto
- **场景**: 用户执行 `@sddu 标记 foo merged` 但未提供 --into 参数
- **预期**: 报错，提示 "merged 状态需要 --into <target-feature> 参数，示例：@sddu 标记 foo merged --into bar"

**EC-007**: Merged 目标不存在
- **场景**: 用户执行 `@sddu 标记 foo merged --into nonexistent`
- **预期**: 警告目标不存在，但仍允许标记（目标可能尚未创建）

**EC-008**: 并发 phase 推进
- **场景**: 两个流程同时尝试推进同一 Feature 的 phase
- **预期**: 后者检测到 phase 已变更，静默跳过（idempotent）

**EC-009**: SuspendedUntil 为空字符串
- **场景**: suspended feature 的 suspendedUntil 被设为空字符串或无效日期
- **预期**: 忽略该字段，不做到期提醒，在一致性检测中报告为"格式异常"

**EC-010**: 根引用指向非 tracked 子特性
- **场景**: root state.json 的 currentFeature 指向一个 terminated 特性
- **预期**: 一致性检测报告该异常，建议清理或更新根引用

**EC-011**: 父特性终止后新增子特性
- **场景**: 父特性已被 terminated，用户在其下创建新子特性
- **预期**: 子特性正常创建（phase: registered, status: tracked），但在显示时归入已终止父节点

**EC-012**: R5 检测时用户拒绝修复
- **场景**: R5 列出异常后，用户选择不修复
- **预期**: 保留异常列表，在后续 `@sddu 状态` 中继续作为异常区展示，标记为"已知待处理"

---

## 8. 开放问题

| ID | 问题 | 状态 | 建议 |
|----|------|------|------|
| Q-001 | SDDU 插件版本号的存储和读取方式？ | 待决 | 建议在 opencode.json 或 package.json 中持久化版本号，供 R5 比较 |
| Q-002 | 一致性检测修复报告是否需要持久化？ | 待决 | 建议保存到 `.sddu/consistency-reports/` 目录 |
| Q-003 | `@sddu 标记` 是否需要支持批量操作？ | 待决 | V1 不做，留待 V2 评估 |
| Q-004 | 非 tracked 特性的子特性，在父特性恢复 tracked 后是否自动恢复独立显示？ | 待决 | 是 — 子随父归是动态推导，父恢复则子自动恢复 |
| Q-005 | 长期停滞阈值是否可配置？ | 待决 | 建议可配置，默认 30 天 |

---

## 9. 成功标准

| 指标 | 当前 | 目标 |
|------|------|------|
| `@sddu 状态` 建议区出现非 tracked 特性 | 有（ETD × 4） | 0 |
| 统计表非 tracked 子特性独立计数 | 有 | 0（归入父节点） |
| 标记特性状态的操作步骤 | 3 步手动 | 1 条命令 |
| Schema 支持的 phase 值 | 混用且不完整 | 8 个（registered → validated，统一 -ed） |
| Schema 支持的 status 值 | 混用且不完整 | 5 个（tracked/completed/suspended/terminated/merged） |
| validated 后自动标记完成 | 无 | 自动设 `completed` |
| 结构异常检测 | 无 | 实时报告（R5 自动检测） |
| 版本升级后手动迁移 | 需要 | 0（R5 自动触发一致性检测） |
| Phase 回退/跳跃防御 | 无 | 严格单向验证 |

---

## 10. 附录

### 10.1 Phase 推进对照

| 从 phase | 到 phase | 触发的 Agent |
|-----------|----------|-------------|
| `registered` | `discovered` | @sddu-discovery |
| `discovered` | `specified` | @sddu-spec |
| `specified` | `planned` | @sddu-plan |
| `planned` | `tasked` | @sddu-tasks |
| `tasked` | `builded` | @sddu-build |
| `builded` | `reviewed` | @sddu-review |
| `reviewed` | `validated` | @sddu-validate |

### 10.2 Status 流转规则

| 从 | 到 | 触发者 | 条件 |
|---|---|---|---|
| (新建) | `tracked` | 系统 | Feature 创建时默认 |
| `tracked` | `suspended` | 用户 | `@sddu 标记 <f> suspended` |
| `tracked` | `terminated` | 用户 | `@sddu 标记 <f> terminated` |
| `tracked` | `merged` | 用户 | `@sddu 标记 <f> merged --into <target>` |
| `tracked` | `completed` | 系统 | phase 到达 `validated` 时自动 |
| `suspended` | `tracked` | 用户 | `@sddu 标记 <f> tracked` 恢复 |
| `suspended` | `terminated` | 用户 | 搁置太久，决定终止 |

不可逆状态: `completed`、`terminated`、`merged`。

---

*创建日期：2026-06-12 | 阶段：specified | 版本：v1.0.0*
