# 任务分解：specs-tree-dsh-template-engine-fix

> **文档定位**: SDDU 任务清单 — 将技术方案分解为可并行执行的原子任务，作为 build 阶段的输入  
> **前置依赖**: plan.md（技术方案）、spec.md（需求规范）  
> **创建人**: SDDU Tasks Agent  
> **创建时间**: 2026-09-28  
> **版本**: v1.0  
> **更新人**: SDDU Tasks Agent  
> **更新时间**: 2026-09-28  
> **更新说明**: 初始创建

## 1. 依赖拓扑总览
> 任务依赖关系和执行顺序

```
Wave 1 ─── (无依赖，全部并行)
  TASK-001 [S]  修改 agents 源：§6 平台中立 + §5.7 投影图随区重建
  TASK-002 [S]  修改 outputs 源：pie 拆分 + 补 merged + 投影图标注

Wave 2 ─── (依赖 Wave 1)
  TASK-003 [S]  运行 build:dsh 重建 dist（SKILL.md + templates/output）

Wave 3 ─── (依赖 Wave 2)
  TASK-004 [S]  构建验证：30 模板计数 + 逐字节一致 + 结构校验
```

## 2. 任务列表
> 每个任务的详细定义

### TASK-001: 修改 agents 源（§6 平台中立 + §5.7 投影图语义）
> 单个任务的详细定义

| 属性 | 值 |
|------|-----|
| **复杂度** | S |
| **前置依赖** | 无 |
| **执行波次** | 1 |
| **对应 FR** | FR-001, FR-002 |

**描述**: 修改 `src/templates/agents/sddu-roadmap.md.hbs`——① §6「插件内置模板（兜底）」改为平台中立表述（同时给出 opencode / dsh 两平台落位，指明以 skill-header ④ 为准）；② §5.7 自检清单与相关正文「preserve 区图逐字保留」改为「投影类图随区重建、结构类图随区保留」。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| MODIFY | src/templates/agents/sddu-roadmap.md.hbs |

**验收标准**:
- [ ] §6 兜底路径不再硬编码 `.opencode/plugins/...`，dsh 侧按 §6 可定位到 `<skill>/templates/output/`
- [ ] §5.7「preserve 区图逐字保留」表述已同步为投影类/结构类二分

**验证命令**:
```bash
grep -n "opencode/plugins" src/templates/agents/sddu-roadmap.md.hbs   # 仅出现在平台对照说明中
grep -n "逐字保留" src/templates/agents/sddu-roadmap.md.hbs
```

### TASK-002: 修改 outputs 源（pie 拆分 + merged + 投影图标注）
> 单个任务的详细定义

| 属性 | 值 |
|------|-----|
| **复杂度** | S |
| **前置依赖** | 无 |
| **执行波次** | 1 |
| **对应 FR** | FR-002, FR-003, FR-004 |

**描述**: 修改 `src/templates/outputs/sddu-roadmap.md.hbs`——① issue-list pie 拆「风险/依赖」为「风险」「依赖」两扇区（6 扇区）；② feature-list 状态列补 `merged`、pie 补「迁出」扇区；③ issue-list / revision-log 的投影图加「随区重建」编写期说明。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| MODIFY | src/templates/outputs/sddu-roadmap.md.hbs |

**验收标准**:
- [ ] issue-list pie 扇区数 = 6（问题/技术债/文档债/风险/依赖/决策）
- [ ] feature-list 状态列覆盖 5 值（含 merged），pie 含迁出扇区
- [ ] 投影图编写期说明标注「随区重建」

**验证命令**:
```bash
grep -n "风险" src/templates/outputs/sddu-roadmap.md.hbs
grep -n "merged" src/templates/outputs/sddu-roadmap.md.hbs
```

### TASK-003: 运行 build:dsh 重建 dist
> 单个任务的详细定义

| 属性 | 值 |
|------|-----|
| **复杂度** | S |
| **前置依赖** | TASK-001, TASK-002 |
| **执行波次** | 2 |
| **对应 FR** | NFR-001 |

**描述**: 运行 `pnpm run build:dsh`（或等价构建命令），从 `src/templates/` 源重建 `dist/dsh/skills/sddu-roadmap/`（SKILL.md + templates/output/sddu-roadmap.md.hbs）。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| MODIFY | dist/dsh/skills/sddu-roadmap/SKILL.md（重建） |
| MODIFY | dist/dsh/skills/sddu-roadmap/templates/output/sddu-roadmap.md.hbs（重建） |

**验收标准**:
- [ ] build 无报错，模板计数 = 30
- [ ] dist 产物含 4 处修复

**验证命令**:
```bash
pnpm run build:dsh
```

### TASK-004: 构建验证（计数 + 逐字节 + 结构校验）
> 单个任务的详细定义

| 属性 | 值 |
|------|-----|
| **复杂度** | S |
| **前置依赖** | TASK-003 |
| **执行波次** | 3 |
| **对应 FR** | FR-001~FR-004, NFR-002 |

**描述**: 校验 dist 产物与源头逐字节一致、模板计数 30、结构骨架（8 章 / 9 zone / 12 meta / 表格列数）不变。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| （无文件变更，仅验证） | — |

**验收标准**:
- [ ] 30 模板计数正确
- [ ] dist 与 src 源头逐字节一致
- [ ] 结构校验项全过（无 <<占位符>> 残留 / zone 配对）

**验证命令**:
```bash
ls dist/dsh/skills/*/templates/output/ | grep -c '.hbs'
diff <(cat src/templates/outputs/sddu-roadmap.md.hbs) <(cat dist/dsh/skills/sddu-roadmap/templates/output/sddu-roadmap.md.hbs)
```

## 3. 任务汇总
> 任务数量、复杂度和波次的统计总览

| 统计项 | 数值 |
|--------|:--:|
| 总任务数 | 4 |
| S 级 (简单) | 4 |
| M 级 (中等) | 0 |
| L 级 (复杂) | 0 |
| 执行波次 | 3 |

## 4. 执行策略
> 各波次的执行说明

| 波次 | 任务 | 策略 |
|:--:|------|------|
| 1 | TASK-001, TASK-002 | 并行执行（两个源文件互不依赖） |
| 2 | TASK-003 | 依赖 Wave 1，单步构建 |
| 3 | TASK-004 | 依赖 Wave 2，构建后校验 |

## 修订记录
> 记录本文档的版本变更历史

| 版本 | 变更说明 | 日期 | 修订人 |
|------|---------|------|--------|
| v1.0 | 初始创建（4 任务 / 3 波次 / S×4） | 2026-09-28 | SDDU Tasks Agent |
