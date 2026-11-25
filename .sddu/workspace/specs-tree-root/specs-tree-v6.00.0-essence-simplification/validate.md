# 验证策略：specs-tree-essence-simplification

> **文档定位**: SDDU 验证策略 — 定义 validate 阶段对本 Feature 的自主验证场景（V1~VN）；验证结果见 validate-report.md（build 完成后产出）  
> **前置依赖**: spec.md（v1.31）、review-report.md（状态 passed，build 后）  
> **创建人**: SDDU Validate Agent  
> **创建时间**: 2026-11-25  
> **版本**: v1.0  
> **更新人**: SDDU Validate Agent  
> **更新时间**: 2026-11-25  
> **更新说明**: 初始创建——策略设计（plan 完成后、build 前，与 tasks 并行的逆向检验准备链）

## 1. 验证概要
> 验证结果的量化总览（build 完成后在 validate-report.md 填入）

| 维度 | 实测数据 | 达标？ |
|------|---------|:--:|
| FR 测试覆盖 | 待 build | — |
| NFR 测试覆盖 | 待 build | — |
| 构建 | 待 build | — |
| 接口一致性 | 待 build | — |
| 漂移项 | 待 build | — |
| 阻塞问题 | 待 build | — |

## 2. 自主验证场景（V1~VN）
> 本 Feature 为「文档/载体迁移」类，按 Feature 类型自适应：侧重**结构断言 + 漂移检测 + 内容一致性**，跳过接口数据与性能边界。

**验证对象来源**：
- `spec.md`：FR-001~008 / NFR-001~007 / EC-001~007
- `plan.md`：§5.1 树 / §5.2 变更明细
- `ADR-001~027`：架构决策
- 产物：`sddu-project-template/` 整树、`scripts/install/`、`e2e/`、存量 `.sddu/`（29 个 Feature）

| # | 验证对象 | 验证步骤 | 预期结果 | 验证维度 | 验证方法 |
|---|---------|---------|---------|---------|---------|
| V1 | 内核四要素（FR-001） | grep 勾稽 7 阶段/三原则/状态模型/契约 | 四要素齐、非空 | 结构断言 | grep + wc |
| V2 | 内核零平台事实（NFR-001） | 关键词扫描 | .opencode/.dsh/npm/dist/tsc 零命中 | 内容一致性 | grep -rniE |
| V3 | 模块/契约迁移计数（FR-002/FR-008） | find 计数 | 指令 ×10 + 契约 ×31（含 adr.md） | 结构断言 | find | wc -l |
| V4 | workspace 空骨架 + 钩子（FR-008⑩） | find 计数 | .sddu-config ×10×2 空钩子 + 5 领域 docs-tree | 结构断言 | find | wc -l |
| V5 | 安装范式（FR-008⑨ / NFR-006） | `install.sh <tmp>` + diff | 复制逐字节一致、零平台分支 | 结构回归 | bash install + diff -r |
| V6 | state.md front-matter 枚举（FR-007） | e2e 断言 | phase 8 值 / status 5 值 / 十二字段合法 | 结构回归 | node e2e/<scenario>.mjs |
| V7 | 零 npm（NFR-005） | 文件存在性 | package.json/package-lock/node_modules 不存在 | 结构断言 | test ! -e |
| V8 | 漂移检测（EC-001） | 扫描孤立产物/需求缺失/规格漂移 | 无孤立代码、无需求缺失、spec 无被改 | 漂移检测 | 人工 + grep |
| V9 | FR-002 演练（改内核一处全生效） | 改内核某口径 → 检查载体是否需同步改 | 只需改内核一处、载体零转写副本 | 内容一致性 | 演练 + grep |
| V10 | 存量迁移（FR-007/ADR-008） | 逐文件 e2e 断言 | 29 个 state.json→state.md，无 state.json 残留 | 结构回归 | find state.json=0 + state.md≥29 |
| V11 | 退役物零残留（ADR-015/017/018/019/020/022/023） | grep 残留引用 | src/ 不存在、bootstrap 不存在、构建链不存在 | 结构断言 | test ! -e + grep |

> **质量门槛**：8 FR 全部覆盖（V1~V7、V9、V10 对应 FR-001~008），相关维度（结构断言/结构回归/内容一致性/漂移检测）各 ≥1 条。Vx 总数 11 ≥ max(8 FR, 4 维度) 起底，满足。

## 3. 测试覆盖验证 / 4. 接口与数据实测 / 5. 构建与脚本验证 / 6. 性能与边界验证 / 7. 漂移检测 / 8. 结论
> build 完成后在 validate-report.md 中产出（策略文档不承载结果）

验证结果（FR/NFR 覆盖率、漂移检测、三态结论 ✅/⚠️/❌）一律写入 `validate-report.md`，本策略文档仅承载 V1~VN 场景定义。本 Feature 为文档/迁移类，接口数据与性能边界维度按类型自适应**跳过**。

## 9. 修订记录
> 记录本文档的版本变更历史

| 版本 | 变更说明 | 日期 | 修订人 |
|------|---------|------|--------|
| v1.0 | 初始创建——策略设计（V1~VN 验证场景，覆盖 8 FR / 4 维度，11 条；文档/迁移类自适应） | 2026-11-25 | SDDU Validate Agent |
