---
feature: v3.02.1-roadmap-structure-v2
name: Roadmap 模板结构重构 v2
version: v3.02.1
phase: validated
status: completed
depth: 0
childrens: []
phaseHistory:
  - phase: registered
    timestamp: "2026-09-24T00:00:00.000Z"
    triggeredBy: SDDU Discovery Agent
    comment: "Feature 目录创建 — 承接 FR-ROADMAP-TPL-001（v4.1.0）的扁平 8 章模板，重构为「概览层（版本/特性/问题清单）+ 详情层（版本/特性/问题详情）+ 首尾（愿景/修订记录）」= 8 H2 的分层结构"
  - phase: discovered
    timestamp: "2026-09-24T00:00:00.000Z"
    triggeredBy: SDDU Discovery Agent
    comment: "问题挖掘完成（v1.0）— 基于对话诊断直接落档 6 个问题（3 核心 Q-001~003：下一步行动横切杂物箱 / 双时间轴打架 / 问题无独立身份；2 次要 Q-004~005：独立依赖与风险章破坏三主体闭合 / 未立项提案无承载位；1 潜在 Q-006：全文字表格无图）+ 7 假设 + 4 风险；用户已拍板决策 D1~D5 全部落定（概览/详情分层、依赖风险融入三主体+每章 Mermaid 图、RICE 淘汰改 P0/P1/P2、问题清单/详情命名区分、仅改模板+agent 指令并 bump v3.2.0）；本版零待澄清"
  - phase: specified
    timestamp: "2026-09-24T00:00:00.000Z"
    triggeredBy: SDDU Spec Agent
    comment: "需求规范完成（v1.0）— 12 FR / 8 NFR / 10 EC；8 章结构 + 8 content zone（3 rewrite + 5 preserve）+ 每章 Mermaid 图 + 依赖风险三主体归属判定表 + P-xxx/PR-xxx 登记制 + P0/P1/P2 优先级 + 旧 zone 非破坏兼容；零待澄清（D1~D5 已闭合），Mermaid 实现细节移交 plan / validate（/tmp 沙箱演练）；实现目标严格限于 2 个 src 模板文件"
  - phase: planned
    timestamp: "2026-09-24T00:00:00.000Z"
    triggeredBy: SDDU Plan Agent
    comment: "技术方案完成（v1.0）— 总方案 = 纯模板双端重构（零运行时代码，延续 ADR-003 Agent-Native 路线）：产物端 src/templates/outputs/sddu-roadmap.md.hbs 全量重写（8 章 / 8 content zone = 3 rewrite + 5 preserve / 3 张清单表 / 3 类 entry / 8 个 Mermaid 章首图 / 编写期说明 + NOTE），指令端 src/templates/agents/sddu-roadmap.md.hbs 定向改造（§5 章节定义表 / §5.4 zone 清单与合并语义含旧 zone 迁移提示 / §5.5 各章语义 + 信息归属判定表 + P·PR 编码 / §修订记录 bump v3.2.0 / §8 增补）；scripts/ 零改动（build-agents.cjs 递归裸拷贝自动覆盖）。给出旧→新 zone 映射表（meta→meta、vision→vision、version-overview→version-list、feature-index→feature-list、priority→删除、version-plan→version-detail、dependencies-risks→删除、next-actions→issue-list、新增 feature-detail/issue-detail、revision-log→revision-log）；迁移策略 = FR-012 不静默重写 + 迁移提示（正式迁移由用户装新版后自行触发，D5）；含验证场景 V-01~V-10（结构 / zone 配对 / mermaid 语法 / 构建幂等 / 沙箱演练[git show docs/roadmap-rewrite:.sddu/ROADMAP.md 275 行拷 /tmp] / 兼容旧标记 / 风格一致性 / 行数预算 / 零丢失抽查 / agent 指令一致性）；产出 3 个 ADR"
  - phase: tasked
    timestamp: "2026-09-24T00:00:00.000Z"
    triggeredBy: SDDU Tasks Agent
    comment: "任务分解完成（v1.0）— 依据 plan §4.7（W1–W6）分解为 9 个原子任务 / 7 个波次（S×4 / M×5 / L×0）：TASK-001 输出模板全量重写；TASK-002~005 agent 模板串行改造（§5 章节定义表 → §5.4 zone 清单 + 合并语义 → §5.5 各章语义 + 归属判定表 + P/PR 编码 → 修订记录 v3.2.0 + §8 增补）；TASK-006 构建分发验证；TASK-007 结构静态自检；TASK-008 沙箱演练（275 行旧 ROADMAP → 新结构映射 + 零丢失抽查）；TASK-009 状态收尾与越界核验。FR 12/12 全覆盖，NFR/EC 均映射。实现目标严格 ⊆ 2 个 src 文件，零运行时代码"
  - phase: builded
    timestamp: "2026-09-24T00:00:00.000Z"
    triggeredBy: sddu-build-agent
    comment: "实施完成（v1.0）— TASK-001 输出模板全量重写（98→169 行；8 H2 / 8 content zone（3 rewrite + 5 preserve）+ meta = 9 zone 标记 / 8 章首 Mermaid / 3 清单表 + 3 类详情 entry）；TASK-002~005 agent 模板定向改造（§5 新增章节定义表 / §5.4 zone 清单与合并语义含旧 zone 迁移提示 / §5.5 各章语义 + 8 行信息归属判定表 + P·PR 编码 / §8 增补 2 行 / 修订记录 bump v3.2.0 / 全文一致性清理）；TASK-006 构建分发验证通过（npm run build:agents 成功、dist≡src 逐字节一致、二次构建幂等、30 output + agent 模板哈希稳定）；TASK-007 结构静态自检 8/8 通过（169 行 / 8 H2 / 9 zone open+close / 8 mermaid / 0 handlebars / v3.2.0 ≥1）；TASK-008 沙箱演练转 validate（D5）；TASK-009 变更集 ⊆ 2 个 src 文件 + 本 Feature 产物、无越界。零运行时代码变更（scripts/ / *.ts / package.json 零 diff）。产出 build.md 与 TREE.md。"
  - phase: reviewed
    timestamp: "2026-09-24T00:00:00.000Z"
    triggeredBy: SDDU Review Agent
    comment: "审查完成（v1.0 / R1）— 静态审查 3 个对象（输出模板 169 行全量重写 + agent 模板 468 行定向改造 + build.md），逐项执行 C1~C24（规范符合性 21 / 架构一致性 1 / 模板质量 1 / 工程边界 1）：21 通过 / 3 改进 / 0 失败 / 0 阻塞，规范符合率 100%（12 FR + 8 NFR + 10 EC 全部落地）；结论 ⚠️ 有条件通过（改进项 5 个：1 中-高 + 4 低/信息）。核心发现：§4 issue-list / §8 revision-log 用 entry 注释逐行包裹表格行 → GFM 表格被 HTML 块截断（marked 18 + remark-gfm 双实测，属对 v4.1.0 自然键规避的回归）；其余为 plan/tasks 流程文档计数漂移（entry 组数 3→5、其他输出模板 30→29）、§4 entry id 占位口径、全量迁移超 450 行容量信息。产出 review.md / review-report.md。"
  - phase: validated
    timestamp: "2026-09-24T00:00:00.000Z"
    triggeredBy: SDDU Validate Agent
    comment: "验证完成（v1.0 / R1）— 执行 V1~V6 六组场景（20 检查项，20 通过 / 0 失败 / 0 阻塞），结论 ✅ 通过。V1 构建幂等（递归 41 文件哈希一致）+ dist≡src（output + agent 两处）；V2 结构静态（H2=8 / zone 9 = 4 rewrite[含 meta] + 5 preserve / entry 5 组 / 表列 6·5·6 / `{{`=0 / Tab=0 / 169 行 / 淘汰术语零生效残留）；V3 Mermaid 8 块静态核查 OK（本机无 mmdc，强度=静态）；V4 兼容旧结构推演（next-actions→旧结构迁移提示 / 无标记→非模板结构 / 新标记→增量更新）；V5 /tmp 沙箱演练（git show docs/roadmap-rewrite 275 行 → 新结构 432 行抽样 / 全量 576 行；四类内容零丢失：版本 12/12、特性 24/24、风险依赖 30/30、行动 43/43；marked/remark-gfm 复现表格截断）；V6 边界（实现变更集恰 2 个 src 文件、禁区 0 diff、.sddu/ROADMAP.md md5 未变）。遗留 1 项非阻塞改进（继承 review：表格 entry 注释截断，建议 post-validation 修复）。产出 validate.md / validate-report.md。"
  - phase: registered
    timestamp: "2026-09-24T10:00:00.000Z"
    triggeredBy: SDDU Roadmap R1 Fix
    comment: "R1 缺陷修复（v3.2.1，phase 维持 validated）— 落实 review 通过条件（改进 1）：模板 §4 issue-list / §8 revision-log 移除逐行 entry 注释，表格类 preserve 区改「行自然键合并」（首列键：ID 列 / 「版本」列）；块级 preserve 区（§5/§6/§7）保留 entry 注释；§4 示例行占位统一 <<P-xxx>>（消除硬编码 P-001）；agent §5.4.1 合并语义二分（entry 键控（块级）/ 行自然键合并（表格））+ 缘由行，§5.4.3 B2/B3、§5.4.4 C2-②③/C3-⑦、§5.7 自检同步，修订记录追加 v3.2.1；产物行数预算 450→600（全量迁移实测 576）。回归：marked 18 + remark-gfm 双实测 §4/§8 均输出完整 <table>（表头+数据 2 行、数据入 <td>、<p>|…|</p> 退化 false）；entry 注释 6 行（仅块级三对）；H2=8 / zone 9/9 / mermaid=8 / 模板 165 行；构建 dist≡src。改进 4/5 一并闭合，改进 2/3（过程文档计数）记录不改写。"
dependencies: ["FR-ROADMAP-TPL-001"]
description: "Roadmap 模板结构重构 v2"
---

# Roadmap 模板结构重构 v2

当前阶段：**validated** · 状态：**completed**

Roadmap 模板结构重构 v2
