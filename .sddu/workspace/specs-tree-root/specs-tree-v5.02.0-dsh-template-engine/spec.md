# Feature Specification：specs-tree-dsh-template-engine

> **文档定位**: SDDU 需求规范 — 定义功能需求、非功能需求和边界情况，作为 plan 阶段的输入
> **前置依赖**: discovery.md（问题清单）
> **创建人**: SDDU Spec Agent
> **创建时间**: 2026-09-27
> **版本**: v1.0
> **更新人**: SDDU Spec Agent
> **更新时间**: 2026-09-27
> **更新说明**: 初始创建

## 1. 元数据
> Feature 基本信息

| 字段 | 值 |
|------|-----|
| Feature ID | FR-DSH-TEMPLATE-001 |
| 名称 | dsh 模板引擎（输出格式强约束） |
| 优先级 | P0 |
| 目标版本 | v5.2.0 |

## 2. 上下文
> 回顾问题背景和目标用户

SDDU 核心架构自带 30 个输出模板（`src/templates/outputs/*.hbs`：10 个阶段输出 + 20 个 docs），opencode 侧由插件分发（`.opencode/plugins/sddu/templates/output/`）并代码渲染，输出强约束。dsh 侧 `install-dsh.sh` 只装 11 个 SKILL.md，模板 `.hbs` 文件未随 skill 落位，SKILL.md §6 指令引用的模板路径（`.opencode/plugins/sddu/templates/output/`）在 dsh 侧不存在，导致 LLM 无模板可读、输出格式不可控。

目标用户：dsh 平台的 SDDU 用户（期望与 opencode 等价的输出模板体验）；诉求「能力不变，对齐 opencode 体验」。

## 3. 目标与非目标
> 明确需求范围，防止范围蔓延

### 3.1 目标 (Goals)
> 明确本次要达成的业务目标

| # | 目标描述 |
|---|---------|
| G-001 | dsh 侧输出模板随 skill 落位，让 LLM 有模板可读（对齐 opencode 模板分发体验） |
| G-002 | 修正 SKILL.md 模板查找路径，指向 dsh 侧实际落位 |
| G-003 | 全部 30 个模板（10 阶段输出 + 20 docs）一次性落位 |

### 3.2 非目标 (Non-Goals)
> 明确本次不涉及的范围，防止需求蔓延

| # | 明确不做 |
|---|---------|
| NG-001 | 不改变 SDDU 输出模板内容本身（能力不变） |
| NG-002 | 不实现模板渲染机制（dsh 无渲染 seam，软约束，2026-08-14 快照） |
| NG-003 | 不碰 opencode 侧模板机制 |
| NG-004 | 不改变 dsh 侧 11 个 skill 集合 |

## 4. 用户故事
> 以用户视角描述功能需求

| # | 作为… | 我想要… | 以便… |
|---|-------|---------|-------|
| US-001 | dsh 平台的 SDDU 用户 | 各阶段产物按输出模板组织 | 输出格式可控、体验对齐 opencode |
| US-002 | 跨平台 SDDU 维护者 | 模板单一来源分发到 dsh 侧 | 不手工维护两份模板 |

## 5. 功能需求 (FR)
> 每个需求必须有唯一标识符且可测试

| ID | 需求描述 | 验收标准 | 优先级 |
|----|---------|---------|--------|
| FR-001 | build-dsh-skills.cjs 构建时分发模板：把 `src/templates/outputs/*.hbs`（30 个）复制到 dist/dsh 模板目录 | `npm run build:dsh` 后 dist/dsh 模板目录含 30 个 .hbs | P0 |
| FR-002 | install-dsh.sh 落位模板：把 dist/dsh 模板复制到 `.dsh/skills/<skill>/templates/output/`（随 skill 落位） | 安装后各阶段 skill 目录含对应输出模板 .hbs | P0 |
| FR-003 | SKILL.md 模板查找路径调整：§6 输出模板查找优先级改为 dsh 侧实际落位路径（用户 `.sddu/templates/` > skill 内置 `templates/output/`） | SKILL.md §6 指令引用路径在 dsh 侧存在 | P0 |
| FR-004 | 30 个模板全覆盖：10 个阶段输出（discovery/spec/plan/tasks/build/review/validate/roadmap/review-report/validate-report）+ 20 个 docs | 安装后 30 个模板全部落位且非空 | P0 |

## 6. 非功能需求 (NFR)
> 性能、安全、可用性等跨切面需求

| ID | 类别 | 需求描述 | 验收标准 |
|----|------|---------|---------|
| NFR-001 | 单一来源 | 模板源头唯一（`src/templates/outputs/`），经 build:dsh 分发，不手工维护第二份 | `src/templates/outputs` 与 dist/dsh 模板逐字节一致 |
| NFR-002 | 幂等性 | 重复安装模板覆盖式落位，无残留 | 连续两次安装，模板落位一致 |
| NFR-003 | 体积 | 模板为 .hbs 纯文本，安装体积可控 | 30 个模板总体积 < 100KB |

## 7. 边界情况 (EC)
> 异常场景和边界条件的处理方式

| ID | 场景 | 处理方式 |
|----|------|---------|
| EC-001 | 模板文件缺失（构建/落位失败） | SKILL.md 指令兜底（按章节语义自行组织），不阻塞流程 |
| EC-002 | 用户自定义模板存在 | 用户 `.sddu/templates/` 优先于 skill 内置模板（保持两级查找） |
| EC-003 | 模板与 SKILL.md 单一来源漂移 | 模板由 build:dsh 从 `src/templates/outputs/` 分发，与 opencode 同源 |

## 8. 开放问题
> 待决策事项和需要进一步调研的内容

| # | 问题 | 状态 |
|---|------|:--:|
| 1 | dsh 侧模板落位的精确目录结构（`templates/output/` vs `templates/`） | 待 plan 阶段定 |

## 修订记录
> 记录本文档的版本变更历史

| 版本 | 变更说明 | 日期 | 修订人 |
|------|---------|------|--------|
| v1.0 | 初始创建 — 基于 discovery.md（6 问题）与用户决策（模板随 skill 落位 + 30 个全量 + 对齐 opencode），定义 4 FR / 3 NFR / 3 EC / 1 开放问题 | 2026-09-27 | SDDU Spec Agent |
