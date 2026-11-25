# 验证策略：specs-tree-autonomous-mode

> **文档定位**: SDDU 验证策略 — 指导 validate Agent 执行自主验证的场景和方法；验证结果见 validate-report.md
> **前置依赖**: spec.md（需求规范）、review-report.md（审查报告，状态 有条件通过 / 0 阻塞）
> **创建人**: SDDU Validate Agent
> **创建时间**: 2026-08-16
> **版本**: v1.0
> **更新人**: SDDU Validate Agent
> **更新时间**: 2026-08-16
> **更新说明**: 初始创建 — 基于 spec.md v1.0（FR-001~010 / NFR-001~003 / EC-001~005）+ plan.md v3.2（方案 D）+ ADR-018~021 + review-report.md（4 改进项处置）自主定义 V1~V14 验证场景

## 1. 验证概要
> 验证策略的量化总览（执行结果见 validate-report.md）

| 维度 | 验证方法 | 达标门槛 |
|------|---------|:--:|
| FR 测试覆盖 | 10 FR 逐项对照（单测 / e2e / 代码走查） | 100% |
| NFR 测试覆盖 | 3 NFR 逐项对照 | ≥ 80% |
| 构建 | `npm run build` 退出码 | 0 |
| 单元测试 | `test:opencode`（25）+ `test:core`（131） | 全绿 |
| e2e 端到端 | e2e 测试项目 `@sddu-auto user-login` | 启动/执行/代答/产物 |
| 漂移 | git diff（7 子 Agent 模板 / spec.md / 孤立代码） | 0 项 |

## 2. 自主验证场景（V1~V14）

> **Feature 类型判定**：代码类 Feature（`src/` 源码 + 单测 + 插件集成 + 模板）→ 全五维度验证（测试覆盖 + 接口数据 + 构建 + 性能边界 + 漂移检测）。
> 无性能 NFR（spec 仅有 NFR-001 可用性 / NFR-002 一致性 / NFR-003 行为确定性）→ §5.4 性能边界维度标注「不适用」。

| # | 验证对象 | 验证步骤 | 预期结果 | 验证维度 | 验证方法 |
|---|---------|---------|---------|:--:|:--:|
| V1 | 构建回归 | 运行 `npm run build` | 退出码 0，dist 产物含 sddu-auto | 构建 | 自动化 |
| V2 | decision-proxy 单测 | 运行 `npm run test:opencode` | 25/25 全通过 | 测试覆盖 | 自动化 |
| V3 | 状态机核心单测 | 运行 `npm run test:core` | 131/131 全通过 | 测试覆盖 | 自动化 |
| V4 | FR-005 子 Agent 零改动 | `git diff` 7 个 sddu-{discovery..validate}.md.hbs | 空输出（零改动） | 漂移检测 | 脚本 |
| V5 | 规格漂移 | `git diff` spec.md | 空输出（spec 未被 build 期间修改） | 漂移检测 | 脚本 |
| V6 | 孤立代码 | `git status` 源码变更 vs plan §5 文件影响 | 无无对应需求的代码 | 漂移检测 | 脚本 |
| V7 | FR-001/FR-008 入口注册 | grep opencode.json.hbs + build-agents.cjs + dist 产物 | 均含 `sddu-auto`，进入即自主无判定 | 接口数据 | grep |
| V8 | e2e 项目创建 + 入口 | `bash e2e/scripts/basic/sddu-e2e.sh user-login --auto` | 创建即安装，@sddu-auto 注册、prompt 入口 `@sddu-auto` | e2e | 脚本 |
| V9 | FR-003/NFR-001 启动六维问卷 + 改进项 1 | e2e 实测 `auto-context.json` 落盘内容 | 含 launchIntent + featureName + 六维 context（背景/目标/范围必采） | e2e | 实测 |
| V10 | FR-002/FR-004 执行绝不问人 + 7 阶段调度 | e2e 实测日志（切分判定→进入执行→顺序调度） | 「此后绝不问人」+ discovery→spec→plan→tasks 顺序调度 | e2e | 实测 |
| V11 | FR-006/NFR-003 提问重定向代答 | 单测覆盖 + e2e 观察 question.asked 拦截 | 拦截目标子会话提问被代答、非目标透传、硬决策 | 测试覆盖 | 单测+实测 |
| V12 | FR-007/NFR-002 全套产物沉淀 | e2e 实测产物清单 | discovery.md~validate.md 全套 | e2e | 实测 |
| V13 | 改进项 2 决策追溯 auto-decisions.md | 代码走查 appendDecisions + 单测 | 协议层落盘、featureName 定位、失败不阻塞代答 | 漂移检测 | 代码走查 |
| V14 | 改进项 1/2/3/4 处置验证 | 逐项对照 build.md §5 处置记录 | 1 fixed / 2 recorded / 3 fixed / 4 fixed | 漂移检测 | 代码走查+测试 |

> **质量门槛（数量基线法）**：10 FR（V4~V12 覆盖 FR-001~010）+ 3 NFR（V9/V11 + 隐含）+ 五维度各 ≥1 条（测试 V2/V3 / 接口 V7 / 构建 V1 / 性能「不适用」/ 漂移 V4~V6/V13/V14），V 总数 14 条，满足门槛。

## 3. 测试覆盖验证
> 逐 FR/NFR 的覆盖映射（执行结果见 report）

| 需求 ID | 覆盖场景 | 验证方式 |
|---------|---------|---------|
| FR-001 | V7/V8 | 注册 + e2e 入口 |
| FR-002 | V10 | e2e 顺序调度 |
| FR-003 | V9 | e2e 启动六维问卷 |
| FR-004 | V10 | e2e 绝不问人 |
| FR-005 | V4 | git diff 零改动 |
| FR-006 | V11 | 单测 + e2e |
| FR-007 | V12 | e2e 产物 |
| FR-008 | V7 | 注册 + 模板走查 |
| FR-009 | V6/V14 | 孤立代码 + 边界 |
| FR-010 | V14 | 模板走查 |
| NFR-001 | V9 | e2e 六维问卷 |
| NFR-002 | V12 | e2e 产物一致性 |
| NFR-003 | V11 | 硬决策单测 |

## 4. 接口与数据实测
> 本 Feature 为 SDDU 框架内部能力，无外部 HTTP API / 数据库 schema。接口维度聚焦「配置注册接口」：opencode.json.hbs agent 块、build-agents.cjs specialAgents、dist/sddu/opencode.json 三处注册一致性（V7）。

## 5. 构建与脚本验证
> 见 V1（npm run build）+ V3（test:core 底层状态机回归）。

## 6. 性能与边界验证
> **不适用**：spec 无性能 NFR（并发/响应时间/吞吐量）。NFR-003「行为确定性」由 V11（硬决策单测）与 V2（contextFile 缺失边界）覆盖。

## 7. 漂移检测
> 见 V4（子 Agent 零改动）、V5（规格漂移）、V6（孤立代码）、V13/V14（改进项处置）。

## 8. 结论
> 验证最终结论见 validate-report.md §6。

## 9. 修订记录

| 版本 | 变更说明 | 日期 | 修订人 |
|------|---------|------|--------|
| v1.0 | 初始创建 — 基于 spec/plan/ADR/review 产物自主定义 V1~V14 验证场景，覆盖 10 FR + 3 NFR + 五维度 | 2026-08-16 | SDDU Validate Agent |
