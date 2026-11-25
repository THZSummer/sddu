<!-- 权威来源：sddu.md（本目录）；本文件是内核的对外释义层，不转写方法论 -->

# SDDU — Spec-Driven Development Ultimate

SDDU 是一个 **spec-driven 开发框架**：把「想法 → 需求 → 设计 → 任务 → 实现 → 审查 → 验证」固化为 7 阶段流程，由 AI Agent 逐阶段执行，文档即状态。

## 一句话本质

> 不跳步、不越界、文档即状态——用文档承载开发全流程的每一次推进，让每个阶段都有唯一权威的产物。

## 如何安装（两步）

```bash
git clone <repo-url> sddu
cp -r sddu/sddu-project-template/. <你的项目目录>/
```

安装后，你的项目获得：
- `.sddu/.sddu/` — 本体（内核 + 模块 + 契约，可重建）
- `.sddu/workspace/` — 你的工作空间（产物，绝不触碰）
- `.agents/skills/sddu/SKILL.md` — 唯一入口索引

## 如何使用

让 Agent 加载入口（`.agents/skills/sddu/SKILL.md`），它会引导加载方法论内核 `.sddu/.sddu/sddu.md`。之后用 `<stage> <feature>` 驱动阶段流转。

## 7 阶段概览

```
问题挖掘 → 需求定义 → 技术设计 → 任务排布 → 实施构建 → 产物审查 → 产物验证
discovery   spec        plan        tasks       build       review      validate
```

## 核心术语（人话版）

- **Feature（特性）**：一个待开发的需求单元，对应一个 `specs-tree-<version>-<slug>/` 目录。
- **phase（阶段）**：特性在 7 阶段流水线中的位置（8 个值，单向推进）。
- **status（状态）**：特性的流转标记（追踪中/已完成/搁置/终止/迁出，5 个值）。
- **文档契约（contract）**：每个阶段产物的格式模板，告诉你「这个阶段该产出什么、长什么样」。
- **本体（essence）**：`.sddu/.sddu/`，框架自身，可删可重建。
- **钩子（hook）**：`.sddu-config/` 下每阶段的前置/后置扩展点，空文件即扩展点，填入内容即生效。

> 更精确的定义以 `.sddu/.sddu/sddu.md`（方法论内核）为准；本 README 是内核的通俗导读。

## 许可证

MIT，见同目录 `LICENSE`。
