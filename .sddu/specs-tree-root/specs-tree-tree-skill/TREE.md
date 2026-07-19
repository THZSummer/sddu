# Directory: .sddu/specs-tree-root/specs-tree-tree-skill/

## 目录简介
Feature FR-TREE-SKILL：将 @sddu-tree（目录导航 Agent）降级为框架级 Skill（sddu-tree）。遵循「Agent 固定 + Skill 扩展」架构原则，通过全量迁移 265 行 Agent 模板逻辑到 SKILL.md，替换 8 个主流程 Agent 模板硬编码调用，建立 SDDU 首个 Agent→Skill 降级范本。当前阶段：任务排布完成，7 个原子任务 3 个波次待执行。

## 目录结构
```
specs-tree-tree-skill/
├── TREE.md          # 本文件 - 目录导航
├── ADR-001.md       # 架构决策记录 - Agent→Skill 降级：一步到位全量迁移方案
├── discovery.md     # 问题挖掘报告 - 4 个核心问题 + 3 个次要问题 + 3 个潜在问题
├── plan.md          # 技术方案 - 方案对比（3 方案）、推荐方案 A、14 项文件影响、5 项风险评估
├── spec.md          # 需求规范 - 10 FR / 5 NFR / 8 EC
├── tasks.md         # 任务分解 - 7 个原子任务 / 3 个执行波次 / S×5 + M×2
├── tasks.json       # 任务清单（机器可读）- 含依赖拓扑和波次分组
└── state.json       # 状态文件
```

## 文件说明
| 文件 | 说明 | 状态 |
|------|------|------|
| discovery.md | 问题挖掘报告：@sddu-tree Agent 技能化 — Q-001~Q-004 核心问题、用户画像（3 角色）、竞品参考（5 条）、假设与风险（各 5 条） | ✅ 已完成 (phase: discovered) |
| spec.md | 需求规范：@sddu-tree Agent 技能化 — 10 FR / 5 NFR / 8 EC / 5 开放问题。决策：全量迁移 Skill body、业务指令替换 8 Agent 模板、P0 优先级。 | ✅ 已完成 (phase: specified) |
| plan.md | 技术方案：方案对比（3 方案）→ 推荐方案 A 一步到位全量迁移。1 新建 / 1 删除 / 12 修改 = 14 项文件变更。5 项风险评估 + ADR-001。 | ✅ 已完成 (phase: planned) |
| ADR-001.md | 架构决策记录：记录 Agent→Skill 降级决策、推荐方案 A 选型理由、备选方案拒绝原因、正面/负面影响分析 | ✅ PROPOSED |
| tasks.md | 任务分解：将 14 项文件变更分解为 7 个原子任务。Wave 1（3 并行）/ Wave 2（原子迁移 3 串行）/ Wave 3（构建验证）。FR-001~010 全覆盖。 | ✅ 已完成 (phase: tasked) |
| tasks.json | 任务清单（机器可读）：含依赖拓扑、波次分组、FR 覆盖映射、验收标准和验证命令。供 build 阶段自动调度。 | ✅ 已完成 (phase: tasked) |
| state.json | 状态文件 | ✅ tasked (status: tracked) |

## 上级目录
- [返回上级](../TREE.md)
- [返回首页](../../TREE.md)
