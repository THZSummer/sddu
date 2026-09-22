# Directory: .sddu/specs-tree-root/specs-tree-roadmap-output-template/

## 目录简介
`@sddu-roadmap` 是 SDDU 唯一「有真实落盘产物却无专属输出模板」的 Agent：它产出 `.sddu/ROADMAP.md`，但输出格式由指令 §5 内联的一段已事实失效的骨架「约束」。本 Feature 为其补全专属输出模板，消除 ROADMAP 结构漂移，并并入框架统一模板逻辑（用户自定义 > 插件内置两级查找）。

## 目录结构
```
specs-tree-roadmap-output-template/
├── TREE.md                                            # 本文件 - 目录导航
├── discovery.md                                       # 问题挖掘报告：@sddu-roadmap 输出模板补全（v2.0）
├── spec.md                                            # Feature Specification：12 FR / 8 NFR / 10 EC + SUP-001 修订声明
├── plan.md                                             # 技术方案：OP-002 标记语法与合并算法、模板骨架、文件影响、3 ADR
├── tasks.md                                            # 任务分解：9 原子任务 / 6 波次（S×4 / M×5 / L×0）+ FR 覆盖矩阵
├── tasks.json                                          # 机器可读任务列表（供 @sddu-build 消费）
├── ADR-001-roadmap-increment-marker-syntax.md          # ADR：增量保留区标记语法（双端 HTML 注释 + zone/entry）
├── ADR-002-roadmap-merge-algorithm.md                  # ADR：合并算法（条目级 upsert / 清单保留 / 表格自然键）
├── ADR-003-agent-native-zero-code-merge.md             # ADR：机制载体 — Agent-Native 零代码路径
├── build.md                                            # 实施报告：9 任务完成 + 变更清单 + 验证证据（TASK-007 静态校验）
├── review.md                                          # 产物审查报告：C1~C26（23 通过 / 3 改进 / 0 阻塞，结论通过）
├── review-report.md                                   # 审查机读报告（结构化审查结论与改进项）
├── validate.md                                        # 产物验证报告：V1~V5（构建幂等 / 结构 / 增量合并动态 V-06~V-09 / 工程边界 / 需求覆盖）
├── validate-report.md                                 # 验证机读报告（结构化验证结论与 2 项非阻塞改进）
└── state.json                                          # 状态文件 (🟢 completed [validated])
```

## 文件说明
| 文件 | 说明 | 状态 |
|------|------|------|
| discovery.md | 问题挖掘报告 — 双根因：结构无权威来源（Q-001）+ 偏离框架统一模板逻辑（Q-002/Q-003）；RT-001~005 用户决策收口；10 问题 / 8 假设 / 7 风险 | ✅ 存在 |
| spec.md | 需求规范 — 12 FR / 8 NFR / 10 EC；§5.1 SUP-001 显式修订并取代 FR-TPL-001 EC-004 中涉及 roadmap 的例外条款；OP-002（增量与骨架共存机制）移交 plan | ✅ 存在 |
| plan.md | 技术方案 — §2 分发链路与两级查找源码级验证；§4.1 OP-002 标记语法 + 合并算法（Step A–D）；§4.2 模板骨架（元数据头部 + 7 H2 + 8 zone）；§4.3 agent 模板改造清单；§5 文件影响（NEW 1 / MODIFY 1）；§6 风险；§7 审查清单；§8 验证场景 | ✅ 存在 |
| tasks.md | 任务分解 — 依据 plan §4.5（W1–W6）产出 9 原子任务 / 6 波次（S×4 / M×5 / L×0）；覆盖新模板、agent §1/§5/§6/§7/§8 修订、构建分发验证、增量合并机制可执行性验证；FR 12/12 全覆盖 + NFR/EC/SUP-001 映射 | ✅ 存在 |
| tasks.json | 机器可读任务列表 — 含任务/波次/复杂度/依赖/FR 覆盖映射，供 @sddu-build 消费 | ✅ 存在 |
| ADR-001-roadmap-increment-marker-syntax.md | 双端 HTML 注释标记 + zone/entry 两级 + 显式 `mode=rewrite\|preserve`；8 区段对应 FR-003「固化 5 + 保留 3」；缺省安全语义（未标注 == rewrite） | ACCEPTED |
| ADR-002-roadmap-merge-algorithm.md | 合并算法 — 条目级 upsert（version-plan）/ 清单保留式（next-actions）/ 表格自然键追加（revision-log）+ 结构校验 + 非破坏性回退 + 幂等要求 | ACCEPTED |
| ADR-003-agent-native-zero-code-merge.md | 机制载体沿用 Agent-Native 零代码路径（不新增脚本/TS/handlebars）；代价：无编译期保证 → 以可检测失败模式 + 静态校验 + 幂等回归兜底 | ACCEPTED |
| state.json | 状态文件 | 🟢 completed [validated] |
| build.md | 实施报告 — 9 任务全部完成（TASK-001~009）；变更集 = NEW `src/templates/outputs/sddu-roadmap.md.hbs` + MODIFY `src/templates/agents/sddu-roadmap.md.hbs`，零运行时代码；构建分发验证通过（30 模板、逐字节一致、幂等）；TASK-007 增量合并机制为静态校验，沙箱动态验证建议 validate 阶段执行 | ✅ 存在 |
| review.md | 产物审查报告 — C1~C26 共 26 项：23 通过 / 3 改进建议 / 0 阻塞；覆盖需求符合性、模板骨架与 zone 一致性、agent 模板改造完整性、ADR 一致性、工程边界、构建分发链路；结论通过 | ✅ 存在 |
| review-report.md | 审查机读报告 — 结构化审查结论与改进项清单 | ✅ 存在 |
| validate.md | 产物验证报告 — V1 构建幂等 / V2 模板结构（7 H2 / 8 zone）/ V3 增量合并沙箱动态验证（V-06~V-09，符合 ADR-002）/ V4 工程边界（仅 2 个 src 文件）/ V5 需求覆盖（12 FR + 8 NFR + 10 EC）；结论通过，0 阻塞 + 2 项非阻塞改进 | ✅ 存在 |
| validate-report.md | 验证机读报告 — 结构化验证结论与 2 项非阻塞改进清单 | ✅ 存在 |

## Feature 状态
| 字段 | 值 |
|------|-----|
| Feature ID | FR-ROADMAP-TPL-001 |
| Phase | 验证 (7/7) |
| Status | 🟢 completed [validated] |
| 目标版本 | v4.1.0 |
| 任务编排 | 9 个原子任务全部 completed（TASK-001~009）；构建分发验证通过（`npm run build:agents`，dist 产物 374 行）；审查 C1~C26 通过（0 阻塞）；验证 V1~V5 通过（0 阻塞 + 2 项非阻塞改进） |
| 实现目标（仅设计态源码） | NEW `src/templates/outputs/sddu-roadmap.md.hbs`；MODIFY `src/templates/agents/sddu-roadmap.md.hbs`（`scripts/` 经实测无需改动） |

## 上级目录
- [返回上级](../TREE.md)
- [返回首页](../../TREE.md)
