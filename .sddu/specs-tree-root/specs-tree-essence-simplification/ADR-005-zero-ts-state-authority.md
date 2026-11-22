# ADR-005: 状态模型权威归一 sddu.md——src/state 及全部 TS 裁撤，仓库零 TypeScript

## 状态
PROPOSED（2026-11-23 用户拍板）

## 背景
v6.0.0 目标是「回归方法论本质」。审视 `src/state/`（machine / schema-v3.0.0 / dependency-checker / state-loader / tree-scanner / auto-updater / parent-state-manager 等 ×9）发现三重矛盾：

1. **双权威**：ADR-001 已定 sddu.md 为方法论内核唯一权威，而 plan v2.x 仍称 `src/state/` 为「内核语义的权威实现」——一个内核两个权威源，正是本版本要消灭的形态；
2. **零执行者**：统一安装范式（ADR-004）确立纯指令单入口 + 零运行时组件后，安装产物中**无任何代码执行** state/——状态迁移由 LLM 按入口协议落盘，`machine.ts` 等成为无调用方的死代码；其唯一活引用是构建期读取（build-dsh-skills 的枚举校验）；
3. **工具链拖累**：保留 `src/state/` 即保留整套 TS 工具链（tsc / jest core·integration 工程 / dist / npm exports / shared / index.ts / 测试 ×13）——为一个不随安装分发的库续命，违背 D2/D3 判定（ADR-002）。

按 ADR-002 四维判定：状态**模型**是本质（D1✓），TS**实现**是载体（D1✗）。

## 决策
1. **`src/state/` 整体裁撤**：状态模型语义（8 phase 序列 / 5 status 集 / 迁移表 / 树嵌套父子联动 / 依赖校验口径 / state.json 字段契约）**全量蒸馏进 sddu.md 状态模型章节**，成为唯一权威。蒸馏以现 `machine.ts` / `schema-v3.0.0.ts` / `auto-updater.ts` 等语义为底稿**逐一比对迁移**，不凭记忆重写，蒸馏稿经用户逐节确认（TASK-002 范围扩展）。
2. **仓库归零 TypeScript**：`src/` 下全部 `.ts`（×18 源）与 `src/__tests__/`（测试 ×13 + fixtures）退役；`tsconfig.json`、根 `jest.config.ts`、`scripts/test-sddu-functionality.js` 删除；`package.json` 删 tsc/jest 链与 exports。仓库形态收敛为：`.hbs` 模板 + sddu.md（源）+ `.cjs` 构建脚本 + shell 安装器。
3. **权威源切换**：`build-dsh-skills.cjs` 的 `CORE_SCHEMA_PATH` 由读 `src/state/schema-v3.0.0.ts` 改为解析 sddu.md；`src/adapters/dsh/contract.ts` 的 dsh 契约结构校验职责并入 `check-essence-sync.cjs`（断言收敛为「1 入口 + sddu 计数」）。FR-007 迁移的 state.json 校验锚点由 `validateStateV3` 改为 check-essence-sync 的 state 口径断言子命令。
4. **强制力取舍（如实声明）**：状态正确性从「（OpenCode 侧）代码强制」降为「协议软引导 + 构建期口径校验」，与 dsh 现状对齐（承 ADR-004 取舍④）；硬门禁是否以其他形态回归，留 v12.0.0 重估。

## 对既有 ADR 的修订
- **ADR-003**：冻结条款（「v6 期间不动运行时 seam」）的冻结对象随本决策整体退役，该条款失效；**用户确认制不变**（TS 裁撤属用户显式拍板，符合确认制）。
- **ADR-004**：取舍④中「`src/state/` 保留为仓库内校验工具库」修订为「整体裁撤，职责并入 check-essence-sync」。

## 后果
- 正面：单一权威（sddu.md）+ 单一校验机构（check-essence-sync）；仓库载体面大幅收缩（TS 工具链整体退役）；「sddu 趋向方法论」目标在代码层面兑现。
- 负面：失去类型安全与运行时强制；构建校验脚本的枚举解析依赖 sddu.md 的稳定结构（缓解：sddu.md 状态模型章节采用机器可解析的规范格式，check-essence-sync 对格式漂移即时报错）；e2e 需重写为裸 node 结构回归。
- 不可逆性：低——语义全量存续于 sddu.md，如未来确需代码强制（v12 重估结论），可在内核之上重新实现，无沉没成本。
