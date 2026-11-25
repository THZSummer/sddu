# 技术计划：specs-tree-dsh-template-engine-fix

> **文档定位**: SDDU 技术方案 — 记录架构设计、方案对比和 ADR，作为 tasks 阶段的输入  
> **前置依赖**: spec.md（需求规范 FR-001~FR-004）  
> **创建人**: SDDU Plan Agent  
> **创建时间**: 2026-09-28  
> **版本**: v1.0  
> **更新人**: SDDU Plan Agent  
> **更新时间**: 2026-09-28  
> **更新说明**: 初始创建

## 1. 前置检查
> 启动技术规划前必须验证的前置条件
| 检查项 | 状态 |
|--------|:--:|
| spec.md 存在 | ✅ |
| 外部 API 文档缓存 | ✅（无外部依赖） |
| 前置依赖已满足 | ✅（FR-DSH-TEMPLATE-001 已交付） |

## 2. 架构分析
> 分析现有架构影响和需要的新组件

**现状**：sddu-roadmap 的指令正文来自 `src/templates/agents/sddu-roadmap.md.hbs`（单一来源，与 opencode 同源），输出格式来自 `src/templates/outputs/sddu-roadmap.md.hbs`；build:dsh 把二者分发到 `dist/dsh/skills/sddu-roadmap/`（SKILL.md + templates/output/），install 落位到项目 `.dsh/skills/sddu-roadmap/`。dsh 侧平台差异（落位约定）由 skill-header ④ 承载。

**缺陷分布**：
- FR-001 / FR-002（正文 §6 兜底路径、§5.7「preserve 区图逐字保留」）落在**指令正文源** `src/templates/agents/sddu-roadmap.md.hbs`；
- FR-002 / FR-003 / FR-004（issue-list pie、revision-log timeline、feature-list 状态列与 pie）落在**输出模板源** `src/templates/outputs/sddu-roadmap.md.hbs`。

**无需新增组件**：纯文本层修复，改两个源文件后由 build:dsh 重建 dist，不改渲染 seam、不改路由 / 状态机。

## 3. 方案对比
> 2-3 个可行方案的对比分析

| 维度 | 方案 A：源文件平台中立化（推荐） | 方案 B：只改 dist 产物 | 方案 C：仅加声明 / 快照标注 |
|------|:--|:--|:--|
| 描述 | 改 `src/templates/` 两源文件：§6 平台中立、投影图改随区重建、pie 拆分、补 merged；再 build:dsh 重建 | 直接改 `.dsh/skills/` 与 dist 产物 | 不改合并语义，仅在正文声明「图为快照」 |
| 优点 | 符合单一来源（R-DSH-05）；opencode/dsh 双平台同步受益 | 改动最小 | 改动最小、风险最低 |
| 缺点 | 需改共享源 + 重建 + 校验两平台 | 违反单一来源，下次 build 被覆盖，且 opencode 侧不同步 | 不解决漂移根因，图仍会与表格脱节 |
| 风险 | 共享源改动可能影响 opencode 侧语义 | 修复不持久、口径再分裂 | FR-002 验收不达标 |
| 工作量 | S | XS（但不可取） | XS（但不可取） |

## 4. 推荐方案
> 推荐方案及选择理由

**推荐**: 方案 A（源文件平台中立化）
**理由**: 单一来源原则（R-DSH-05 / NFR-001）要求修复落在 `src/templates/` 源文件并由 build 分发；方案 B 会被下次 build 覆盖、方案 C 不消除漂移根因，均不满足 FR-002 验收。方案 A 一次性修复且双平台同步受益。

## 5. 文件影响分析
> 所有需要创建/修改/删除的文件

| 操作 | 文件路径 | 说明 |
|:--:|------|------|
| MODIFY | src/templates/agents/sddu-roadmap.md.hbs | FR-001：§6 兜底路径平台中立化；FR-002：§5.7 自检「preserve 区图逐字保留」改「投影图随区重建」 |
| MODIFY | src/templates/outputs/sddu-roadmap.md.hbs | FR-002：issue-list pie / revision-log timeline 标注随区重建；FR-003：pie 拆分风险/依赖；FR-004：feature-list 状态列 + pie 补 merged |
| MODIFY | dist/dsh/skills/sddu-roadmap/SKILL.md | build:dsh 重建产物（非手工编辑） |
| MODIFY | dist/dsh/skills/sddu-roadmap/templates/output/sddu-roadmap.md.hbs | build:dsh 重建产物（非手工编辑） |

## 6. 风险评估
> 识别技术、依赖和时间风险及缓解措施

| 风险 | 概率 | 影响 | 缓解措施 |
|------|:--:|:--:|----------|
| 共享源改动影响 opencode 侧 | 中 | 中 | §6 平台中立写法兼容 opencode（同时列出两平台落位）；改后跑 build:dsh 校验计数与逐字节一致性 |
| 改 preserve 图语义牵动 §5.4/§5.7 多处规格 | 中 | 中 | 逐处 grep 同步修改，diff 复核无遗漏 |
| 修复后仍依赖 LLM 遵从（无硬渲染） | 高 | 低 | 如实标注软约束边界，不作为硬保证 |

## 7. 生成的 ADR
> 本次规划产出的架构决策记录

| ADR | 标题 | 状态 |
|-----|------|:--:|
| ADR-001 | §6 兜底路径平台中立化（header 承载平台落位差异） | PROPOSED |
| ADR-002 | preserve 区投影图随区重建（弃逐字保留） | PROPOSED |

## 8. 修订记录
> 记录本文档的版本变更历史

| 版本 | 变更说明 | 日期 | 修订人 |
|------|---------|------|--------|
| v1.0 | 初始创建（方案 A；2 ADR；4 MODIFY） | 2026-09-28 | SDDU Plan Agent |
