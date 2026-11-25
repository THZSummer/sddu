# 审查策略：specs-tree-v6.00.0-essence-simplification

> **文档定位**: SDDU 审查策略 — 定义 review 阶段对本 Feature 的自主审查清单（C1~CN）；审查结果见 review-report.md（build 完成后产出）  
> **前置依赖**: spec.md（v1.31）、plan.md（v5.40）、ADR-001~027  
> **创建人**: SDDU Review Agent  
> **创建时间**: 2026-11-25  
> **版本**: v1.0  
> **更新人**: SDDU Review Agent  
> **更新时间**: 2026-11-25  
> **更新说明**: 初始创建——策略设计（plan 完成后、build 前，与 tasks 并行的逆向检验准备链）

## 1. 审查概要
> 审查结果的量化总览（build 完成后在 review-report.md 填入）

| 维度 | 数值 |
|------|:--:|
| 审查文件数 | 待 build |
| 通过项 | 待 build |
| 改进建议 | 待 build |
| 阻塞问题 | 待 build |

## 2. 自主审查清单（C1~CN）
> 本 Feature 为「文档/载体迁移」类（非代码类），四维度映射为：载体表达质量 / 规范符合性 / 架构一致性 / 结构回归覆盖。
> 审查 Agent 在 build 完成后按此清单逐项核验，结果写入 review-report.md。

**审查对象来源**：
- `spec.md`：FR-001~008 / NFR-001~007 / EC-001~007
- `plan.md`：§5.1 树 / §5.2 变更明细
- `ADR-001~027`：架构决策（含 ADR-015~027 能力排查裁决）
- 产物：`sddu-project-template/.sddu/.sddu/{sddu.md, README.md, LICENSE}`、`modules/`（×10 指令 + ×31 契约）、`.agents/skills/sddu/SKILL.md`、`workspace/` 骨架、`scripts/install/`、`e2e/`

| # | 审查对象 | 审查基准 | 审查维度 | 审查方法 |
|---|---------|---------|---------|---------|
| C1 | 内核四要素完整性（7 阶段/三原则/状态模型/契约） | FR-001 | 规范符合性 | grep 逐项勾稽 |
| C2 | 内核零平台事实 | FR-001 / NFR-001 | 规范符合性 | 关键词扫描（.opencode/.dsh/npm/dist/tsc 零命中） |
| C3 | 载体方法论段「引用不转写」 | FR-002 / NFR-003 | 载体表达质量 | 抽查 10 模块模板，验证仅持引用声明 |
| C4 | 判定标准可回放分类 | FR-003 | 架构一致性 | 用 ADR-002 四维判据回放，无「无法归类」项 |
| C5 | 载体分类清单计数勾稽 | FR-004 | 规范符合性 | 计数（11+45+4+脚本+文档）可勾稽 |
| C6 | 裁撤无静默（用户确认制） | FR-005 / NFR-004 | 架构一致性 | 每个裁撤项还原决策链（ADR 或 audit 裁决栏） |
| C7 | ROADMAP 回填（14 项提案重估） | FR-006 | 规范符合性 | ROADMAP §3/§5/§6 逐项有结论 |
| C8 | state.md front-matter 契约 | FR-007 | 规范符合性 | 十二字段（含 dependencies/suspendedUntil/mergedInto）+ 正文摘要一致 |
| C9 | 安装范式二分 + workspace 逐字节不变 | FR-008 / NFR-007 | 架构一致性 | install 前后 workspace 逐字节比对 |
| C10 | 零 npm 落实 | NFR-005 | 规范符合性 | package.json/package-lock/node_modules 不存在 |
| C11 | 目录结构（modules ×10 + contracts ×31 + 索引唯一） | FR-008 | 架构一致性 | find 计数断言 |
| C12 | 结构回归覆盖（e2e 裸 node） | NFR-002 | 结构回归覆盖 | `node e2e/<scenario>.mjs` 通过 |
| C13 | 契约去渲染（无 .hbs 残留） | plan §5.2 | 载体表达质量 | find 零 .hbs |
| C14 | 完成协议改写（无 sddu_update_state 残留） | ADR-021 A8 | 载体表达质量 | grep 零命中 |
| C15 | 排除项不残留（文件反推/隐式修复/files 注册/API 门禁） | ADR-015/017/018/019 | 架构一致性 | grep 零命中 |

> **质量门槛**：本 Feature 8 个 FR 全部覆盖（C1~C9 对应 FR-001~008），四维度各 ≥1 条（规范符合性 C1/C2/C4/C5/C7/C8/C10，架构一致性 C4/C6/C9/C11/C15，载体表达质量 C3/C13/C14，结构回归覆盖 C12）。Cx 总数 15 ≥ max(8 FR, 4 维度) 起底，满足。

## 3. 审查详情 / 4. 改进建议 / 5. 阻塞问题 / 6. 结论
> build 完成后在 review-report.md 中产出（策略文档不承载结果）

审查结果（分维度评估、改进建议、阻塞问题、三态结论 ✅/⚠️/❌）一律写入 `review-report.md`，本策略文档仅承载 C1~CN 清单定义。

## 7. 修订记录
> 记录本文档的版本变更历史

| 版本 | 变更说明 | 日期 | 修订人 |
|------|---------|------|--------|
| v1.0 | 初始创建——策略设计（C1~CN 审查清单，覆盖 8 FR / 4 维度，15 条） | 2026-11-25 | SDDU Review Agent |
