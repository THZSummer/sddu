# ADR-019: state 自动修复/隐式迁移判非问题——一次性转换，无隐式修复（能力丢失排查 L6）

## 状态
PROPOSED（2026-11-24 用户拍板：L6 裁决 A——非问题）

## 背景
能力丢失排查（capability-loss-audit.md L6）发现的能力：state-loader 的 `applyReparation` 自动修复链——

1. version 强制/补 v3.0.0（**隐式旧版本迁移**）
2. feature 缺失←目录名回填
3. phase 从旧 `state` 字段映射（drafting→registered、implementing→builded、completed→validated 等）
4. status 仅缺失/非法时置 tracked，已有非 tracked 一律保留（FR-008 保护）
5. depth 重算、phaseHistory/files/dependencies 结构兜底重建、phase 超前历史空补首条
6. 修复后仍不过校验时返回原数据用于 recovery；无回滚/删除

## 决策
**非问题，不蒸馏、不重建**。理由：

1. **隐式版本迁移的场景随一次性转换消失**——存量 29 个 state.json → state.md 是 ADR-008 拍板的**一次性显式转换**（不计迁移成本，产品未推广）；转换完成后，所有 state.md 天生符合当前契约，不存在「旧格式读入需升级」的输入；
2. **不做迁移的事情**——「迁移」在当前设计语义里只有一件：build 阶段的一次性批量转换（29 个文件逐个跑 e2e 结构回归断言，失败逐个报告不静默跳过，EC-005）。转换是显式、一次性、有断言的；不是运行期常驻的隐式兼容层；
3. **新范式下的异常处理走显式路径**——state.md 若被 Agent 写坏（front-matter 字段错/枚举非法），由 e2e 结构回归暴露（断言失败）；修复方式是「按目录与产物显式重建 front-matter」，属人工/Agent 显式动作，不内建自动修复协议。

## 对既有设计的修订
- 无结构变更；TASK-002 蒸馏底稿**不含**修复语义（applyReparation 及旧 state 字段映射表不迁移）。
- 一次性转换的回归保障沿用既有条款（EC-005 / plan §6 风险表「29 个 state.json → state.md 批量转换」行）。

## 后果
- 正面：框架无常驻隐式修复层（静默改数据是最危险的漂移源——修复消息只 console.warn，用户往往无感知）；state.md 契约从第一天起唯一且纯净。
- 负面：无。
- 不可逆性：无——本 ADR 仅固化「不内建」决策；转换期间如个别文件异常，按 EC-005 逐个报告处理。
