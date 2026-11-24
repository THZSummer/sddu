# ADR-016: state.md front-matter 补 dependencies 字段——依赖声明是状态，反向视图是派生（能力丢失排查 L3）

## 状态
PROPOSED（2026-11-24 用户拍板：L3 裁决 A——front-matter 补字段）

## 背景
能力丢失排查（capability-loss-audit.md L3）发现结构性矛盾：

- ADR-005 已拍板「依赖校验口径」全量蒸馏进 sddu.md（TASK-002 范围）；
- 但 ADR-005 拍板的 state.md front-matter 字段契约（`feature/featureId/name/version/phase/status/depth/childrens/phaseHistory/description`）**不含 dependencies**——校验语义有了，数据源没了，蒸馏空转。

## 决策
**front-matter 补 `dependencies` 字段**。字段设计：

```yaml
---
feature: v6.00.1-xxx
...
dependencies: [v6.00.0-yyy, v6.00.0-zzz]   # 本 feature 依赖的其他 feature id 列表
---
```

设计要点：

1. **单向声明**——`dependencies` 只存「我依赖谁」（对应原 state.json 的 `dependencies.on`），元素为对方 feature 的 id（`<version>-<slug>`，与 front-matter `feature` 字段同构、可直接对应目录名 `specs-tree-<version>-<slug>`）；
2. **反向不落盘**——「谁被我阻塞」（原 `dependencies.blocking`）不存储：反向视图是**派生信息**，由 Agent 扫描各 state.md 的 dependencies 反查即得。声明单向、派生不落盘——与「目录即真相」（ADR-010）同构：存一份声明，杜绝双份漂移；
3. **依赖校验数据源闭环**——sddu.md 状态协议的依赖口径（依赖方 phase ≥ 目标 phase、缺失仅警告、循环依赖检测）以本字段为唯一输入；
4. **缺省合法**——无依赖的 feature 该字段可省略（等价空数组），front-matter 保持最简。

## 对既有设计的修订
- **ADR-005**：front-matter 字段契约由九字段扩为十字段（补 `dependencies`）。
- **TASK-002（sddu.md 状态模型蒸馏）**：依赖校验口径的数据源明确绑定本字段。
- **无 §5.1 树变更**（state.md 是流程产物非模板结构）。

## 后果
- 正面：依赖校验语义与数据源闭环；声明性信息（无法从目录推导）获得载体；单向存储避免 on/blocking 双份维护漂移（原 TS 实现中两者就存在口径不一致风险）。
- 负面：state.md front-matter 增加一个可选字段（极小成本）。
- 不可逆性：低——字段可选、缺省合法，存量转换时按原 state.json 的 `dependencies.on` 直接映射。
