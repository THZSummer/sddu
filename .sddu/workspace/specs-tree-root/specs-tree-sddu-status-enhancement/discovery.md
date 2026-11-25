# 需求挖掘报告：SDDU 特性状态增强

**版本**: 5.0.0（最终模型 — 两字段隔离，全 ed 形态）  
**创建日期**: 2026-06-12  
**状态**: discovered

---

## 1. 核心模型：两字段隔离

### 1.1 当前问题

当前 `state.json` 用一个 `state` 字段承载两类语义——阶段和流转状态混在一起，导致 `validStatuses` 膨胀且语义冲突：

```json
{ "state": "discovered" }   // 这是阶段
{ "state": "validated" }    // 这也是阶段
{ "state": "terminated" }   // 这不是阶段，是流转状态
{ "state": "drafting" }     // 模糊：阶段还是状态？
{ "state": "completed" }    // 和 validated 的区别？说不清
```

### 1.2 方案：phase 与 status 完全独立

```
phase（8 个阶段）           status（5 个流转状态）
───────────────────         ─────────────────────
registered                   tracked     正常追踪，流转中
discovered                   completed   已完成（终态）
specified                    suspended   搁置，可能恢复
planned                      terminated  终止，不再回来
tasked                       merged      迁出，合并到其他特性
builded
reviewed
validated
```

**核心原则**：
- `phase` 只做一件事：标记当前所在阶段，由 SDDU 工作流自动推进
- `status` 只做一件事：标记流转状态，由用户标记（`completed` 除外）
- 两个字段完全独立，互不推导，互不依赖

### 1.3 命名规则

所有阶段统一 `动词 + ed` 形态：

| 动词 | phase |
|------|-------|
| register | registered |
| discover | discovered |
| specify | specified |
| plan | planned |
| task | tasked |
| build | builded |
| review | reviewed |
| validate | validated |

`builded` 替代 `built`（不规则），保持命名规则一致。

### 1.4 五个 status 的语义

| status | 含义 | 还会回来吗 | 谁设置 | 可逆吗 |
|--------|------|-----------|--------|--------|
| `tracked` | 正常追踪，流转中 | — | 系统（新建默认） | — |
| `completed` | 已完成 | — | 系统（phase 到 validated 时自动） | ❌ 不可逆 |
| `suspended` | 暂时搁置 | ⏳ 可能 | 用户 | ✅ 可恢复 |
| `terminated` | 永久终止 | ❌ 永不 | 用户 | ❌ 不可逆 |
| `merged` | 迁出到其他特性 | ❌ 转嫁 | 用户 | ❌ 不可逆 |

### 1.5 附加字段

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
  "mergedInto": "specs-tree-other-feature",  // 目标特性
  "mergedAt": "2026-06-12"
}
```

---

## 2. 流转状态机

### 2.1 phase 流转（系统自动，单向不可逆）

```
registered ──→ discovered ──→ specified ──→ planned ──→ tasked ──→ builded ──→ reviewed ──→ validated
```

- 由 SDDU 各阶段 agent 自动推进
- 单向，不可回退

### 2.2 status 流转

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

### 2.3 流转规则

| 从 | 到 | 触发者 | 条件 |
|---|---|---|---|
| (新建) | `tracked` | 系统 | feature 创建时默认 |
| `tracked` | `suspended` | 用户 | `@sddu 标记 <f> suspended` |
| `tracked` | `terminated` | 用户 | `@sddu 标记 <f> terminated` |
| `tracked` | `merged` | 用户 | `@sddu 标记 <f> merged --into <target>` |
| `tracked` | `completed` | 系统 | phase 到达 `validated` 时自动 |
| `suspended` | `tracked` | 用户 | `@sddu 标记 <f> tracked` 恢复 |
| `suspended` | `terminated` | 用户 | 搁置太久，决定终止 |

**不可逆状态**：`completed`、`terminated`、`merged`。

---

## 3. 「要不要继续」推导逻辑

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

**规则**：`@sddu 状态` 只推荐 `status === "tracked" && phase !== "validated"` 的特性。

---

## 4. 当前状态系统的其他问题

### 4.1 结构异常清单

| # | 异常 | 具体表现 |
|---|------|---------|
| 1 | 缺失 state.json | `plugin-rename-sddu/` 仅有 validation-result.json |
| 2 | 隐藏 state 文件 | `sdd-plugin-roadmap/` 使用 `.state.json`（被 tree-scanner 跳过） |
| 3 | 根引用失效 | root state.json 引用 `e2e-script-cleanup` 但目录不存在 |
| 4 | 字段命名混用 | 6 个 feature 用 `state` 键，6 个用 `status` 键 |
| 5 | 非标状态值 | `sdd-plugin-baseline` 使用 `"completed"`（不在 schema 中） |
| 6 | 父子归并缺失 | `solo-team-flow` 已终止但 3 个子特性仍独立统计为 `drafting` |

### 4.2 修改范围边界

**非直接修复范畴**（运行时产物，不在本 feature 代码中直接修改，但设计上需支持用户使用时自动按最新规则修复）：
- `.opencode/*`
- `.sddu/*`
- `opencode.json`

**直接修复范畴** = 非直接修复范畴之外的全部源码，包括但不限于：
- `src/state/` — schema、machine、loader、scanner、auto-updater 等模块
- `agents/` — sddu.md、sddu-docs.md、sddu-roadmap.md 等 agent 定义
- `templates/` — 输出模板

**非直接修复范畴的处理方式**：用户安装新版 SDDU 后，执行 `@sddu 状态` 时由 R5 一致性检测发现不符合新规则的 state.json → 请示用户 → 获同意后自动修复。

> **设计原则**：此能力应作为 SDDU 插件的**内置升级机制**。每次插件版本升级后，首次执行 `@sddu 状态` 时自动触发一致性检测，确保运行时产物始终按最新设计规则保持同步，而非仅本次 feature 一次性使用。

### 4.3 影响范围

| 文件 | 改动 |
|------|------|
| `state/schema` | phase（8 个值）+ status（5 个值）替代当前混用字段 |
| `state/machine` | `getNextStep()` 基于 phase + status 联合推导 |
| `state/state-loader` | 识别新模型；自动修复不覆盖非 tracked 的 status |
| `state/tree-scanner` | 扫描时标记 status，支持子随父归 |
| `agents/sddu.md` | 状态扫描逻辑：非 tracked 跳过 + 子随父归 + 分类输出 |
| `agents/sddu-docs.md` | README 生成时根据 status 标注对应标记 |
| `consistency-checker`（新建） | 版本升级时自动检测：缺失文件、引用失效、格式异常、状态不符合最新规则；请示用户后自动修复 |

---

## 5. 需求清单

### 5.1 Must Have（MVP）

| ID | 需求 | 说明 |
|----|------|------|
| **R1** | 两字段模型落地 | state.json 使用 `phase`（8 值）+ `status`（5 值）替代混用字段 |
| **R2** | status 过滤 | `status` 非 `tracked` 的特性及子特性不在建议区列出，不参与活跃统计 |
| **R3** | 子随父归 | `status` 非 `tracked` 的父特性下的子特性归入父节点显示 |
| **R4** | Schema 扩展 | phase + status 联合验证；`completed` 自动设置 |
| **R5** | 一致性检测（内置升级机制） | 每次 SDDU 插件版本升级后，首次执行 `@sddu 状态` 时自动触发：检测不符合最新 phase/status 规则的 state.json → 请示用户 → 获同意后自动修复。不做静默兼容 |

### 5.2 Should Have（V1）

| ID | 需求 | 说明 |
|----|------|------|
| **R6** | `@sddu 标记` 命令 | `@sddu 标记 <f> suspended/terminated/merged [--until] [--note] [--into]` |
| **R7** | `@sddu 状态` 分类输出 | 分区：🟢 进行中 / ✅ 已完成 / 🟡 搁置 / 🔴 终止 / 🔵 迁出 / ⚠️ 异常 |
| **R8** | 父特性聚合 | 父特性根据子特性进度聚合展示 |
| **R9** | suspended 到期提醒 | 仅当用户执行 `@sddu 状态` 时，被动检测 `suspendedUntil` 已到期 → 提示确认。不做主动推送/定时通知 |

### 5.3 Nice to Have（V2）

| ID | 需求 |
|----|------|
| **R10** | 长期停滞检测 |
| **R11** | 明确不做历史兼容 | 不自动兼容 `.state.json`、`validation-result.json` 等历史格式。由 R5 一致性检测发现歧义 → 请示用户 → 获同意后统一修复为标准 `phase` + `status` 格式 |
| **R12** | merged 特性跳转追溯 |

---

## 6. 成功标准

| 指标 | 当前 | 目标 |
|------|------|------|
| `@sddu 状态` 建议区出现非 tracked 特性 | 有（ETD × 4） | 0 |
| 统计表非 tracked 子特性独立计数 | 有 | 0（归入父节点） |
| 标记特性状态的操作步骤 | 3 步手动 | 1 条命令 |
| Schema 支持的 phase 值 | 混用且不完整 | 8 个（registered → validated） |
| Schema 支持的 status 值 | 混用且不完整 | 5 个（tracked/completed/suspended/terminated/merged） |
| validated 后自动标记完成 | 无 | 自动设 `completed` |
| 结构异常检测 | 无 | 实时报告 |

---

## 7. 范围边界

**MVP**：R1-R5（模型落地 + 过滤 + 子随父归 + schema + 一致性检测）

**V1**：R6-R9（标记命令 + 分类输出 + 聚合 + 到期提醒）

**明确不做**：
- 不自动变更 suspended 到期后的状态（仅提醒）
- 不静默兼容历史格式（`.state.json`、`validation-result.json` 等），由 R5 检测 → 请示用户 → 获同意后修复
- 不删除任何历史文件或目录
- 不自动清理 root state.json 历史数据

---

*创建日期：2026-06-12 | 版本：v5.0.0*
