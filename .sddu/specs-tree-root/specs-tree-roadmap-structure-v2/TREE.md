# Directory: .sddu/specs-tree-root/specs-tree-roadmap-structure-v2/

## 目录简介
上游 Feature FR-ROADMAP-TPL-001（v4.1.0）已把 `.sddu/ROADMAP.md` 从"随心所欲"收敛为**固定的 8 ...

## 目录结构
```
specs-tree-roadmap-structure-v2/
├── TREE.md          # 本文件 - 目录导航
├── ADR-001-overview-detail-layering.md          # ADR-001: 概览 / 详情分层结构 — 三主体 × 两层粒度，替代单层 8 章混合结构
├── ADR-002-zone-mode-allocation.md          # ADR-002: zone 模式分配 — 清单层 2 rewrite + 1 preserve，详情层全 preserve 键控
├── ADR-003-chapter-mermaid-diagrams.md          # ADR-003: 章首 Mermaid 图 — GitHub 原生渲染、零构建依赖、preserve 区静态演进
├── build.md          # Build Report: Roadmap 模板结构重构 v2（概览 / 详情分层）
├── discovery.md          # 问题挖掘报告：Roadmap 模板结构重构 v2（概览 / 详情分层）
├── plan.md          # 技术计划：Roadmap 模板结构重构 v2（概览 / 详情分层）
├── review-report.md          # 审查报告：C1~C24 逐项结果（⚠️ 有条件通过，5 改进项）
├── review.md          # 审查策略：C1~C24 审查清单与判定标准
├── spec.md          # Feature Specification：Roadmap 模板结构重构 v2
├── state.json          # 状态文件 (✅ completed [validated])
├── tasks.json          # 任务清单 (机器可读)
├── tasks.md          # 任务分解：specs-tree-roadmap-structure-v2
├── validate-report.md          # 验证报告：V1~V6 逐项结果（✅ 通过，含 /tmp 沙箱演练）
└── validate.md          # 验证策略：V1~V6 六组验证场景
```

## 文件说明
| 文件 | 说明 | 状态 |
|------|------|------|
| ADR-001-overview-detail-layering.md | ADR-001: 概览 / 详情分层结构 — 三主体 × 两层粒度，替代单层 8 章混合结构 — 上游 Feature FR-ROADMAP-TPL-001（v4.1.0）已把 `.sddu/ROADMAP.md` 收敛为固定的 8 个 H2，但章节*... | ✅ 存在 |
| ADR-002-zone-mode-allocation.md | ADR-002: zone 模式分配 — 清单层 2 rewrite + 1 preserve，详情层全 preserve 键控 — ADR-001 确定了 8 章的分层结构。下一步决定每个章节对应的 **content zone** 采用哪种合并模式（`mode="rewrite"` ... | ✅ 存在 |
| ADR-003-chapter-mermaid-diagrams.md | ADR-003: 章首 Mermaid 图 — GitHub 原生渲染、零构建依赖、preserve 区静态演进 — discovery 的 Q-006：旧产物全为文字与表格，版本 / 特性 / 问题的归属与分布无法一眼把握。用户已拍板（D2）：**每章章首加 1 个 M... | ✅ 存在 |
| build.md | Build Report: Roadmap 模板结构重构 v2（概览 / 详情分层） — FR 覆盖：12/12（FR-001~FR-012，见 tasks.md §3.2 矩阵）。 | ✅ 存在 |
| discovery.md | 问题挖掘报告：Roadmap 模板结构重构 v2（概览 / 详情分层） — 1. **按三主体重构章节结构** — 版本 / 特性 / 问题各有「清单 + 详情」两章，依赖与风险融入三主体。（来源：D1 / D2） | ✅ 存在 |
| plan.md | 技术计划：Roadmap 模板结构重构 v2（概览 / 详情分层） — 1. `src/templates/outputs/sddu-roadmap.md.hbs` 当前 **98 行**（旧 8 H2 / 9 zone = ... | ✅ 存在 |
| review-report.md | 审查报告：C1~C24 逐项执行结果 — 0 阻塞 / 5 改进项（⚠️ 有条件通过）；含表格 entry 注释截断的双渲染器实测证据 | ✅ 存在 |
| review.md | 审查策略：C1~C24 审查清单（四维度）与结论判据 | ✅ 存在 |
| spec.md | Feature Specification：Roadmap 模板结构重构 v2 — 上游 Feature FR-ROADMAP-TPL-001（v4.1.0）已把 `.sddu/ROADMAP.md` 从"随心所欲"收敛为**固定的 8 ... | ✅ 存在 |
| state.json | 状态文件 | ✅ completed [validated] |
| tasks.json | 任务清单（机器可读） | ✅ 存在 |
| tasks.md | 任务分解：specs-tree-roadmap-structure-v2 — Wave 1 ─── (无依赖) | ✅ 存在 |
| validate-report.md | 验证报告：V1~V6 逐项执行结果 — 20/20 通过（✅ 通过）；含 275 行旧 ROADMAP 沙箱演练与零丢失抽查 | ✅ 存在 |
| validate.md | 验证策略：V1~V6 六组验证场景（20 检查项） | ✅ 存在 |

## Feature 状态
| 字段 | 值 |
|------|-----|
| Feature ID | FR-ROADMAP-STRUCT-001 |
| Phase | 验证完成 (7/7) |
| Status | ✅ completed [validated] |

## 上级目录
- [返回上级](../TREE.md)
- [返回首页](../../TREE.md)
