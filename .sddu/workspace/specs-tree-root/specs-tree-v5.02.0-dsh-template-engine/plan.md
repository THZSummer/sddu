# 技术计划：specs-tree-dsh-template-engine

> **文档定位**: SDDU 技术方案 — 记录架构设计、方案对比和 ADR，作为 tasks 阶段的输入
> **前置依赖**: spec.md（需求规范）
> **创建人**: SDDU Plan Agent
> **创建时间**: 2026-09-27
> **版本**: v1.0
> **更新人**: SDDU Plan Agent
> **更新时间**: 2026-09-27
> **更新说明**: 初始创建

## 1. 前置检查
> 启动技术规划前必须验证的前置条件
| 检查项 | 状态 |
|--------|:--:|
| spec.md 存在 | ✅ |
| 外部 API 文档缓存 | ⚠️ 不适用（无外部 API） |
| 前置依赖已满足 | ✅（discovery.md + spec.md 齐备） |

## 2. 架构分析
> 分析现有架构影响和需要的新组件

**现状**：模板源头在 `src/templates/outputs/*.hbs`（30 个：10 阶段输出 + 20 docs），与 opencode 同源（单一来源 R-DSH-05）。opencode 侧经 `package.cjs` 分发到 `.opencode/plugins/sddu/templates/output/`。dsh 侧 `build-dsh-skills.cjs` 只生成 11 个 SKILL.md 到 `dist/dsh/skills/<skill>/`，**未分发模板**；`install-dsh.sh` 用 `cp -R` 复制整个 skill 目录，因此若 skill 目录内已有 `templates/`，会被自动携带。

**改造**：在 `build-dsh-skills.cjs` 增加模板分发步骤——把 `src/templates/outputs/*.hbs` 按 skill 映射复制到 `dist/dsh/skills/<skill>/templates/output/`；`install-dsh.sh` 的 `cp -R` 天然覆盖；`skill-header.md.hbs` 增加「dsh 侧模板落位」说明段（覆盖源指令正文里失效的 `.opencode` 路径）。

**模板 → skill 映射**（30 个）：
- `sddu-discovery`/`spec`/`plan`/`tasks`/`build`/`roadmap`：各 1 个同名模板
- `sddu-review`：2 个（review + review-report）
- `sddu-validate`：2 个（validate + validate-report）
- `sddu-docs`：20 个（sddu-docs-*.hbs → templates/output/docs/）
- `sddu`/`sddu-fast`：0 个（无输出模板）

**数据流**：`src/templates/outputs/*.hbs` →（build:dsh 分发）→ `dist/dsh/skills/<skill>/templates/output/` →（install-dsh.sh cp -R）→ `.dsh/skills/<skill>/templates/output/`。

## 3. 方案对比
> 2-3 个可行方案的对比分析

| 维度 | 方案 A：模板随 skill 落位（推荐） | 方案 B：集中模板目录 | 方案 C：复用 .sddu/templates |
|------|:--|:--|:--|
| 描述 | 模板随 skill 目录（templates/output/），install cp -R 天然覆盖 | 独立 `.dsh/templates/output/` 集中放 | 靠用户/sync 同步到 `.sddu/templates/` |
| 优点 | 与用户决策一致；单一来源分发；install 零改动 | 路径集中 | 复用既有两级查找 |
| 缺点 | build 需做 skill 映射 | install 需额外复制步骤 | 依赖用户手动/sync，不自动 |
| 风险 | 映射错误（低） | 路径与 SKILL.md 指令脱节（中） | 不满足「随 skill 落位」决策（高） |
| 工作量 | 中（1 脚本 MODIFY） | 中 | 低但非本意 |

## 4. 推荐方案
> 推荐方案及选择理由

**推荐**: 方案 A（模板随 skill 落位）
**理由**: 与用户 discovery 决策一致（「模板随 skill 落位 .dsh/skills/sddu-xxx/templates/」）；install-dsh.sh 的 `cp -R` 天然携带 skill 目录内全部内容（含 templates/），零 install 改动；单一来源由 build:dsh 分发保证。

## 5. 文件影响分析
> 所有需要创建/修改/删除的文件

| 操作 | 文件路径 | 说明 |
|:--:|------|------|
| MODIFY | `scripts/build-dsh-skills.cjs` | 新增模板分发步骤：src/templates/outputs/*.hbs 按映射复制到 dist/dsh/skills/<skill>/templates/output/ |
| MODIFY | `src/adapters/dsh/templates/skill-header.md.hbs` | 增加「dsh 侧模板落位」说明段（模板随 skill 落位于 templates/output/，覆盖源指令失效的 .opencode 路径） |
| MODIFY | `scripts/install-dsh.sh` | 落位自检清单补充模板计数（可选，cp -R 已覆盖） |
| MODIFY | `docs/dsh/README.md` | 交付物总览补充模板落位说明 |

> 工程边界：修改目标仅 `scripts/`、`src/adapters/dsh/`、`docs/`；`src/templates/outputs/`（模板源头）与 `src/templates/agents/`（指令正文）**零改动**（单一来源）。

## 6. 风险评估
> 识别技术、依赖和时间风险及缓解措施

| 风险 | 概率 | 影响 | 缓解措施 |
|------|:--:|:--:|----------|
| 模板→skill 映射错误（漏配/错配） | 中 | 中 | build 后校验 30 个模板全部落位且非空 |
| 软约束效果有限（LLM 不严格遵循模板） | 中 | 中 | skill-header 说明段强化「必须读取并遵循模板」指令 |
| 模板与 opencode 单一来源漂移 | 低 | 中 | 模板分发只从 src/templates/outputs 复制，零手工维护 |

## 7. 生成的 ADR
> 本次规划产出的架构决策记录

| ADR | 标题 | 状态 |
|-----|------|:--:|
| ADR-001 | 模板随 skill 落位（templates/output/） | ACCEPTED |
| ADR-002 | 单一来源分发（build:dsh 从 src/templates/outputs 复制） | ACCEPTED |
| ADR-003 | SKILL.md 模板路径覆盖（skill-header 补充 dsh 侧落位说明） | ACCEPTED |

## 8. 修订记录
> 记录本文档的版本变更历史

| 版本 | 变更说明 | 日期 | 修订人 |
|------|---------|------|--------|
| v1.0 | 初始创建 — 方案 A（模板随 skill 落位）；3 ADR；文件影响 4 MODIFY | 2026-09-27 | SDDU Plan Agent |
