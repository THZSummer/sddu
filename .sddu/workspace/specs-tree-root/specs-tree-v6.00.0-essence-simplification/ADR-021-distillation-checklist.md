# ADR-021: 状态机蒸馏底稿清单——九条语义全量并入 TASK-002（能力丢失排查 🟡A）

## 状态
PROPOSED（2026-11-24 用户拍板：🟡A 整体采纳）

## 背景
能力丢失排查发现：ADR-005 拍板「状态模型语义全量蒸馏进 sddu.md」并以 machine.ts / schema-v3.0.0.ts 为底稿（plan §6 风险表：「逐一比对，不凭记忆重写」）——但「底稿」只是原则，未逐条列明语义清单，蒸馏时凭记忆仍有遗漏风险。排查将其显式化为九条（A1~A9），用户整体拍板采纳。

## 决策
**九条语义全量并入 TASK-002 蒸馏底稿**，蒸馏时逐条比对、逐条勾销：

| # | 语义 | 现状出处（底稿锚点） |
|---|------|----------------------|
| A1 | **FR-006**：推进到 validated 且 status=tracked 时，status 自动置 completed（无用户确认） | machine.ts:487-642 |
| A2 | **父特性天花板**：父 feature 禁止推进超过 planned（targetOrder>3 拒绝） | machine.ts:449-459 |
| A3 | **状态可逆表**：仅 suspended→tracked 可逆；completed/terminated/merged 终态不可离开 | schema:154-167, 345-350 |
| A4 | **依赖拦截规则**：依赖方 phase ≥ **目标** phase（非当前）；依赖缺失仅警告不拦；循环依赖检测；回退影响警告；数据源 = front-matter `dependencies`（ADR-016） | dependency-checker.ts:140-345 |
| A5 | **phaseHistory 条目契约**：phase + timestamp + triggeredBy + comment 四字段 | schema:38-43 |
| A6 | **前置产物表**：每 phase 必需文件清单 + 父特性差异化（只查 discovery/spec/plan 类）；判定依据 = 目录约定文件名**直查**（ADR-017） | machine.ts:140-149, 378-408 |
| A7 | **createFeature 规则**：id=小写连字符截 50、幂等创建（已存在拒绝）、创建后回读校验 | machine.ts:196-238, state-loader.ts:340-419 |
| A8 | **完成协议改写**：11 个模块模板的 `/tool sddu_update_state` 调用 → state.md front-matter 更新动作——**阶段推进唯一路径**（ADR-018 拍板单轨） | 全部模板完成协议段 |
| A9 | **缺陷修正**：builded/reviewed 文件集无法区分（文件反推混同）——蒸馏以 phaseHistory 为权威，不引入文件反推 | auto-updater.ts:125-179 |

## 与相邻裁决的绑定关系

- **A4 ↔ ADR-016**：依赖校验数据源 = front-matter `dependencies`（单向声明）
- **A6 ↔ ADR-017**：前置产物判定 = 目录约定直查，不用 files 注册
- **A8 ↔ ADR-018**：完成协议是推进唯一路径（文件反推自动推进已退役）
- **排除项（不蒸馏）**：auto-updater 反推语义（ADR-018）、applyReparation 修复语义（ADR-019）、files 注册语义（ADR-017）

## 对既有设计的修订
- **TASK-002 范围**：状态模型蒸馏底稿从「以 machine.ts/schema 为底稿」细化为「本 ADR 九条清单逐条勾销」。
- 蒸馏稿验收：九条逐条比对通过 + 用户逐节确认（沿用 plan §6 既有条款）。

## 后果
- 正面：蒸馏遗漏风险归零（清单化勾稽，NFR-004 可追溯性同构）；九条与 ADR-016/017/018 的绑定关系显式化，语义无悬空。
- 负面：无。
- 不可逆性：无——纯清单固化，sddu.md 蒸馏时逐条落位。
