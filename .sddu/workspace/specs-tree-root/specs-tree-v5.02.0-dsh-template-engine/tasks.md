# 任务分解：specs-tree-dsh-template-engine

> **文档定位**: SDDU 任务清单 — 将技术方案分解为可并行执行的原子任务，作为 build 阶段的输入
> **前置依赖**: plan.md（技术方案）、spec.md（需求规范）
> **创建人**: SDDU Tasks Agent
> **创建时间**: 2026-09-27
> **版本**: v1.0
> **更新人**: SDDU Tasks Agent
> **更新时间**: 2026-09-27
> **更新说明**: 初始创建

## 1. 依赖拓扑总览
> 任务依赖关系和执行顺序

```
Wave 1 ─── (无依赖，并行)
  TASK-001 [M]  build-dsh-skills.cjs 模板分发（映射 + 复制 + 校验）
  TASK-002 [S]  skill-header.md.hbs 模板落位说明段

Wave 2 ─── (依赖 TASK-001)
  TASK-003 [S]  install-dsh.sh 落位自检补充模板计数

Wave 3 ─── (依赖 Wave 1)
  TASK-004 [S]  docs/dsh/README.md 交付物总览补充

Wave 4 ─── (依赖全部)
  TASK-005 [S]  构建验证 + 30 模板落位校验
```

## 2. 任务列表
> 每个任务的详细定义

### TASK-001: build-dsh-skills.cjs 模板分发
> 单个任务的详细定义

| 属性 | 值 |
|------|-----|
| **复杂度** | M |
| **前置依赖** | 无 |
| **执行波次** | 1 |
| **对应 FR** | FR-001 / FR-004 |

**描述**: 在 `build-dsh-skills.cjs` 生成 SKILL.md 后，新增模板分发步骤：按映射把 `src/templates/outputs/*.hbs`（30 个）复制到 `dist/dsh/skills/<skill>/templates/output/`，并校验 30 个全部落位非空。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| MODIFY | scripts/build-dsh-skills.cjs |

**验收标准**:
- [ ] `npm run build:dsh` 后 30 个模板全部落位到对应 skill 目录且非空
- [ ] 模板→skill 映射正确（review 2 个、validate 2 个、docs 20 个、其余 1 个）
- [ ] 模板源头 `src/templates/outputs/` 零写（只读复制）

**验证命令**:
```bash
npm run build:dsh && find dist/dsh/skills -name '*.hbs' | wc -l
```

### TASK-002: skill-header.md.hbs 模板落位说明
> 单个任务的详细定义

| 属性 | 值 |
|------|-----|
| **复杂度** | S |
| **前置依赖** | 无 |
| **执行波次** | 1 |
| **对应 FR** | FR-003 |

**描述**: 在 `skill-header.md.hbs` 增加「dsh 侧模板落位」说明段：模板随 skill 落位于 `<skill>/templates/output/`，覆盖源指令正文失效的 `.opencode` 路径，并强化「必须读取并严格遵循模板」指令。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| MODIFY | src/adapters/dsh/templates/skill-header.md.hbs |

**验收标准**:
- [ ] 说明段明确 dsh 侧模板落位路径（templates/output/）
- [ ] 强化「必须读取并遵循模板」指令
- [ ] 不改动源指令正文（src/templates/agents 零写）

**验证命令**:
```bash
grep -n 'templates/output\|模板' src/adapters/dsh/templates/skill-header.md.hbs
```

### TASK-003: install-dsh.sh 落位自检补充模板计数
> 单个任务的详细定义

| 属性 | 值 |
|------|-----|
| **复杂度** | S |
| **前置依赖** | TASK-001 |
| **执行波次** | 2 |
| **对应 FR** | FR-002 |

**描述**: `install-dsh.sh` 落位自检清单补充模板落位计数（各 skill 目录的 templates/output/*.hbs 数量），让安装后能确认模板已随 skill 落位。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| MODIFY | scripts/install-dsh.sh |

**验收标准**:
- [ ] 落位自检清单含模板计数
- [ ] `bash -n` 无语法错误

**验证命令**:
```bash
bash -n scripts/install/dsh/install.sh && grep -n '模板\|templates' scripts/install/dsh/install.sh
```

### TASK-004: docs/dsh/README.md 交付物总览补充
> 单个任务的详细定义

| 属性 | 值 |
|------|-----|
| **复杂度** | S |
| **前置依赖** | TASK-001 / TASK-002 |
| **执行波次** | 3 |
| **对应 FR** | FR-001 |

**描述**: `docs/dsh/README.md` §1 交付物总览补充模板落位说明（30 个模板随 skill 落位）。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| MODIFY | docs/dsh/README.md |

**验收标准**:
- [ ] 交付物总览含模板落位说明（30 个模板随 skill 落位）

**验证命令**:
```bash
grep -n '模板\|30 个' docs/dsh/README.md
```

### TASK-005: 构建验证 + 30 模板落位校验
> 单个任务的详细定义

| 属性 | 值 |
|------|-----|
| **复杂度** | S |
| **前置依赖** | TASK-001~004 |
| **执行波次** | 4 |
| **对应 FR** | FR-004 / NFR-001 / NFR-002 |

**描述**: 收尾验证：`npm run build:dsh` 成功；30 个模板全部落位且与 src/templates/outputs 逐字节一致（单一来源）；临时目录安装后模板随 skill 落位；幂等（二次安装覆盖一致）。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| NONE | 仅验证 |

**验收标准**:
- [ ] `npm run build:dsh` 退出码 0，30 个模板落位
- [ ] 模板与 src/templates/outputs 一致（单一来源）
- [ ] 临时安装后 .dsh/skills/*/templates/output/ 模板存在
- [ ] 幂等（二次安装模板一致）

**验证命令**:
```bash
npm run build:dsh && find dist/dsh/skills -name '*.hbs' | wc -l && bash scripts/install/dsh/install.sh --yes --project-root /tmp/tpl-verify && find /tmp/tpl-verify/.dsh/skills -name '*.hbs' | wc -l
```

## 3. 任务汇总
> 任务数量、复杂度和波次的统计总览

| 统计项 | 数值 |
|--------|:--:|
| 总任务数 | 5 |
| S 级 (简单) | 4 |
| M 级 (中等) | 1 |
| L 级 (复杂) | 0 |
| 执行波次 | 4 |

## 4. 执行策略
> 各波次的执行说明

| 波次 | 任务 | 策略 |
|:--:|------|------|
| 1 | TASK-001, TASK-002 | 并行执行 |
| 2 | TASK-003 | 依赖 TASK-001 |
| 3 | TASK-004 | 依赖 Wave 1 |
| 4 | TASK-005 | 依赖全部，收尾验证 |

## 修订记录
> 记录本文档的版本变更历史

| 版本 | 变更说明 | 日期 | 修订人 |
|------|---------|------|--------|
| v1.0 | 初始创建 — 5 任务 / 4 波次（S×4 / M×1），覆盖 FR-001~004 | 2026-09-27 | SDDU Tasks Agent |
