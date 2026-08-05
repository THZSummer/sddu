# ADR-002: 改造原子性策略 — 一次性全量改造 9 个文件

## 状态
PROPOSED

## 背景
本次"职责回归改造"涉及 9 个文件，分布在 4 个目录：

| 层级 | 文件 | 变更类型 |
|------|------|---------|
| Agent 源模板 | `src/templates/agents/sddu-{plan,review,validate}.md.hbs` | 3 个 MODIFY |
| Agent 运行时副本 | `.opencode/agents/sddu-{plan,review,validate}.md` | 3 个 MODIFY |
| Agent 插件副本 | `.opencode/plugins/sddu/agents/sddu-{plan,review,validate}.md` | 3 个 MODIFY |
| 输出模板 | `src/templates/outputs/sddu-{plan,review,validate}.md.hbs` | 3 个 MODIFY |
| 构建脚本 | `scripts/build-agents.cjs` | 1 个 MODIFY（注释） |

改造在语义上是一个不可分割的整体：
- **plan 的删除**（剥离 §5.8/§5.9）与 **review/validate 的新增**（自主策略能力）是同一架构决策的 AB 面
- 如果只改 plan 不改 review/validate，review/validate 会在运行时寻找 plan 策略章节但找不到——形成不一致窗口
- 如果先改 review/validate 再改 plan，review/validate 的自主设计能力已经就位但 plan 仍在输出"代笔策略"——结构不一致

需要决定是一次性提交还是分批提交。

## 决策
我们决定采用 **一次性全量改造**——所有 9 个文件在单次提交中完成改造。

### 决策依据：

1. **改动量小，不属于大规模变更**：净变更约 50~80 行（主要是删除 + 段落改写），批量 review 复杂度可控。

2. **语义完整性**：plan 的删除与 review/validate 的新增是同一架构决策的两个面，分批会制造不一致中间态。

3. **已验证两副本一致**：通过 `diff` 验证，3 个 Agent 的 plugin copy 与 runtime copy 完全相同——改造时改一份即可直接复制到另一份，减少出错可能。

4. **构建验证简单**：改造完成后运行 `node build-agents.cjs` → 验证退出码 = 0 → 一次验证覆盖全部。

5. **FR-011 的一致性要求**：规范要求 plugin copies 与 runtime copies 改造后"完全一致"——一次性全量改是满足此要求的最可靠方式。

### 替代方案对比：

| 维度 | 方案 A：分批改造 | 方案 B：一次性全量（本决策） |
|------|:--|:--|
| 不一致窗口 | **存在**（中间态） | **无** |
| 回滚复杂度 | 低（单批回滚） | 低（9 文件量小） |
| 构建验证 | 需每批验证 | 一次性验证 |
| review 负担 | 分散（多批提交） | 集中（单次提交 ~80 行 diff） |
| 实施速度 | 慢（需等待每批验证） | 快 |

## 后果

### 正面影响
1. **零不一致窗口**：plan 删除策略 + review/validate 获得自主能力在同一提交完成，三个 Agent 的职责契约同步生效
2. **实施路径简单**：一条直线，不需要设计中间态兼容逻辑
3. **符合 spec FR-011**：plugin ↔ runtime copies 改造后完全一致（一次性同步修改）

### 负面风险
1. **单次 review 的认知负担**：reviewer 需要理解 3 个 Agent 的职责契约同时变化的全貌，但 50~80 行 diff 是可控的
2. **如果改错一处，全部回滚**：但相比不一致窗口的风险（review 找 plan 策略找不到了），全量回滚的成本更低——因为改动量实在太小

### 实施要点
- 改造顺序建议：先改 Agent 源模板（`src/templates/agents/*.hbs`）→ 复制到 plugin copies 和 runtime copies → 改输出模板（`src/templates/outputs/*.hbs`）→ 更新 build-agents.cjs 注释
- 改造完成后立即：① `diff` 验证三对副本一致；② `node build-agents.cjs` 验证构建通过
- 提交信息使用语义化前缀：`refactor: plan剥离§5.8/§5.9，review/validate自主定义策略`
