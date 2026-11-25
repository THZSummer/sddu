# 构建报告：specs-tree-v6.00.0-essence-simplification（v6.0.0）

> **文档定位**: SDDU 构建报告 — 记录全部任务的文件变更和实现结果，作为 review 阶段的输入  
> **前置依赖**: tasks.md（15 任务 / 4 波次）、plan.md（v5.41）、spec.md（v1.31）  
> **创建人**: SDDU Build Agent  
> **创建时间**: 2026-11-25  
> **版本**: v1.0  
> **更新说明**: 初始创建——v6.0.0 简化与本质化实施构建完成

## 1. 构建概要

| 维度 | 数值 |
|------|:--:|
| 任务总数 | 15（全部完成） |
| 波次 | 4 |
| 新增产物 | 内核 1 + 模块指令 10 + 契约 31 + 索引 1 + 骨架 + 复制器 2 + e2e 1 |
| 退役 | src/（93 文件）+ scripts/ 旧脚本 ×10 + npm/tsconfig/bootstrap + .dsh/ + TREE.md ×36 + architecture/ + 根 state.json |

## 2. 文件变更（按任务）

| 任务 | 类型 | 内容 |
|------|------|------|
| TASK-001 | NEW | `sddu-project-template/.sddu/.sddu/sddu.md`——方法论内核唯一权威（7 阶段/三原则/状态模型/契约 + 路由表 + 门禁/状态协议 + 读取规则 + 十二字段契约） |
| TASK-002 | DELETE | `src/` 整目录（93 文件：TS 状态机/适配器/框架 skills/模板源） |
| TASK-003 | DELETE | `scripts/` 旧脚本 ×10 + install/{opencode,dsh} ×4 |
| TASK-004 | DELETE | package.json / package-lock.json / tsconfig.json / jest.config.ts / bootstrap.{sh,ps1}；`.gitignore` 瘦身 |
| TASK-005 | MOVE | opencode-operator → `.agents/skills/opencode-operator/`；dev-guide → `.agents/skills/dev-guide/`（项目私有） |
| TASK-006 | DELETE | `.sddu/docs/migration*.md` ×27 + COMPLETION_CERTIFICATE.json + review-report-*.json |
| TASK-007 | MOVE+MODIFY | `src/templates/agents/*.md.hbs` ×11 → 模块指令 ×10（剥 frontmatter/加引用声明/删 API 门禁+files 回写/完成协议改写/输出模板路径改指 contracts/删 Skill 发现段） |
| TASK-008 | MOVE+MODIFY | `src/templates/outputs/*.md.hbs` ×30 → 契约 ×31（+adr.md 新增；.hbs→.md + 头引用） |
| TASK-009 | NEW | 索引 `.agents/skills/sddu/SKILL.md` + workspace 骨架（ROADMAP 种子 + specs-tree-root + docs-tree-root ×5 领域 + .sddu-config ×10×2 空钩子） |
| TASK-010 | MOVE | README → `.sddu/.sddu/README.md`（重排本质先行）；LICENSE → `.sddu/.sddu/LICENSE` |
| TASK-011 | NEW | `scripts/install/install.{sh,ps1}` 纯复制器（cp -r + 旧布局迁移备份回滚） |
| TASK-012 | NEW/DELETE | `e2e/structure-regression.mjs` 裸 node 结构回归；删除 e2e/*.test.ts + jest.config + e2e/scripts/ + FULLSTACK 指南 |
| TASK-013 | MODIFY/MOVE | 30 个 state.json → state.md（十二字段 front-matter）；目录版本化重命名（8 无版本沿用原名 + 22 版本化）；architecture/ 归档；根 state.json 退役 |
| TASK-014 | MOVE | dogfooding 产物迁入 `.sddu/workspace/`（specs-tree-root/docs/docs-tree-root/ROADMAP）；模板模块路径引用改指 workspace/；.dsh/ 退役 |
| TASK-015 | MODIFY | ROADMAP §3 提案表 14 项重估（保留 ×5 / 搁置 ×6 / 关闭 ×2 / 合并 ×1 / 实现中 ×1） |

## 3. 测试覆盖

| 项 | 结果 |
|----|------|
| e2e 结构回归（裸 node） | ✅ 通过（模板树结构 / 内核契约 / 安装范式 / workspace 逐字节不变） |
| 模块指令数 | 10 ✅ |
| 契约总数 | 31 ✅ |
| .hbs 残留 | 0 ✅ |
| legacy 模式（sddu_update_state/api-docs/files.*） | 0 ✅ |
| 内核零平台事实 | ✅ |

## 4. 任务完成清单

| 波次 | 任务 | 状态 |
|:--:|------|:--:|
| 1 | TASK-001/003/004/005/006 | ✅ |
| 2 | TASK-007/008/009/010 | ✅ |
| 3 | TASK-002/011/012/013 | ✅ |
| 4 | TASK-014/015 | ✅ |

## 5. 已知残留（非阻塞，移交 review 阶段）

1. **docs/fast 模块的平台上下文提示**：sddu-docs/sddu-fast 模块仍含 5 处 `.opencode/` 上下文提示（docs 排除清单、fast 上下文源），属旧 opencode 时代残留，v6 下该平台已退役——建议 review 阶段确认清理。
2. **存量 Feature 的 state.md 正文摘要为机械生成**：由 front-matter 自动拼接，未做人工润色（FR-007 验收③「正文与 front-matter 一致」满足，但可读性可再优化）。
3. **无版本 Feature 的 version 字段**：8 个历史无版本 Feature 沿用原名，其 state.md `version: v0.00.0` 为占位值，FR-008⑦「沿用原名并标注」已满足（目录名未含版本）。

## 6. 下一步

运行 `@sddu-review specs-tree-v6.00.0-essence-simplification` 开始产物审查（审查清单见 review.md C1~C15）。
