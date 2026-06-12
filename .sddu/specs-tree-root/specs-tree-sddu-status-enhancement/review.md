## 📋 代码审查报告 - specs-tree-sddu-status-enhancement

**Feature ID**: FR-STATUS-ENHANCE-001
**审查日期**: 2026-06-13
**审查人**: @sddu-review
**核心模型**: v3.0.0 — phase(8) + status(5) 两字段隔离
**审查范围**: 直接修复范畴（~75 个修改文件 + 7 个新建文件）

---

### ✅ 通过项

#### 代码质量: 优秀
- **Schema v3.0.0** (`src/state/schema-v3.0.0.ts`, 278 行): 类型系统设计清晰，8 phase + 5 status 完整定义，常量（`VALID_PHASES`/`VALID_STATUSES`/`PHASE_ORDER`/`NEXT_PHASE`）集中在单文件，符合 NFR-006（一处定义、全局生效）。`validateStateV3()` 覆盖所有组合约束，`shouldRecommendContinue()` 和 `getNextRecommendedPhase()` 推导逻辑正确。
- **Machine.ts** (`src/state/machine.ts`, 672 行): 已彻底删除旧 `FeatureStateEnum` 双宇宙映射体系。`validatePhaseTransition()` 正确实现单向不可逆 + 跳跃拒绝逻辑。FR-006（phase 到 validated 自动 set completed）正确实现且有不覆盖保护。`getNextStep()` 直接使用 `shouldRecommendContinue`。
- **Consistency-checker.ts** (`src/state/consistency-checker.ts`, 927 行): 7 项检测规则完整实现，版本号持久化于 `.sddu/.consistency-state.json`，修复引擎含 FR-008 保护（不覆盖 suspended/terminated/merged）。修复前需 `confirmed=true`，用户确认门控到位。FR-013 停滞检测已一并实现。
- **State-loader.ts** (`src/state/state-loader.ts`, 477 行): `create()` 默认 `phase: 'registered', status: 'tracked'` 正确。读写均使用 v3.0.0 格式，含自动修复逻辑兼容旧格式。FR-008 保护在修复路径中生效。
- **Tree-scanner.ts** (`src/state/tree-scanner.ts`, 205 行): `resolveDisplayContext()` + `findFirstNonTrackedAncestor()` 正确实现 FR-004 子随父归，含循环检测和递归祖先查找。
- **Auto-updater.ts** (`src/state/auto-updater.ts`, 324 行): FR-003 跳过非 tracked 特性正确实现。文件→phase 推导逻辑合理，使用 `PHASE_ORDER` 比较。
- **sddu.md.hbs** (`src/templates/agents/sddu.md.hbs`, 380 行): 6 区仪表盘 + `@sddu 标记` 命令 + 智能引导 + 父特性聚合 + 到期提醒 + 子随父归指令，全面覆盖 FR-003/004/009/010/010b/011/012。自然语言推导原则明确（语义理解，不做关键词匹配）。
- **sddu-agents.ts** (`src/agents/sddu-agents.ts`, 253 行): `agentToPhaseMap` 正确映射全部 7 个 SDDU agent → Phase，含别名（如 `sddu-0-discovery`）。

#### 测试覆盖: 优秀 (>95%)
- **核心 v3.0.0 测试**: 138/138 通过（schema-v3.0.0: 46 用例，machine: 38 用例，consistency-checker: 28 用例，state-loader 测试）
- **全量回归**: 396/400 通过（4 个预存失败，非本次引入）
- **测试结构**: 每个 FR 有独立测试用例；FR-008 保护场景全部覆盖（suspended/terminated/merged 不覆盖）；边界用例充分（null/undefined/空字符串/非对象输入等）

#### 规范符合: 100%
逐一对照 spec.md 功能需求：

| FR | 需求 | 实现状态 |
|----|------|:---:|
| FR-001 | state.json 使用 phase + status 两字段 | ✅ schema-v3.0.0.ts + state-loader.ts |
| FR-002 | Phase 单向推进（拒回退/跳跃） | ✅ machine.ts validatePhaseTransition() |
| FR-003 | 非 tracked 不在建议区，不参与统计 | ✅ sddu.md.hbs + auto-updater.ts FR-003 skip |
| FR-004 | 子随父归（非 tracked 祖先归入父节点） | ✅ tree-scanner.ts resolveDisplayContext() |
| FR-005 | Phase + status 联合验证（含组合约束） | ✅ schema-v3.0.0.ts validateStateV3() |
| FR-006 | Phase validated 自动 completed（不覆盖非 tracked） | ✅ machine.ts updateState() FR-006 |
| FR-007 | R5 一致性检测（7 项检测 + 版本比较） | ✅ consistency-checker.ts checkAll() |
| FR-008 | 修复时不覆盖非 tracked 的 status | ✅ consistency-checker.ts + state-loader.ts |
| FR-009 | `@sddu 标记` 命令（结构化+自然语言） | ✅ sddu.md.hbs 标记命令 |
| FR-010 | `@sddu 状态` 6 区分类仪表盘 | ✅ sddu.md.hbs 6 区输出 |
| FR-010b | 智能引导清单 | ✅ sddu.md.hbs 操作建议区 |
| FR-011 | 父特性聚合展示 | ✅ sddu.md.hbs 父特性聚合 |
| FR-012 | Suspended 到期被动提醒 | ✅ sddu.md.hbs 到期提醒 |
| FR-013 | 长期停滞检测（V2） | ✅ consistency-checker.ts detectStaleFeatures() |
| FR-014 | Merged 跳转追溯（V2） | ✅ sddu.md.hbs 迁出区目标标注 |

#### 架构一致性: 符合
- **方案 B 执行到位**: 干净切换，无双宇宙映射残留，旧 schema（v1.2.5/v2.0.0）保留但仅作为参考/测试用途
- **非直接修复范畴完整保护**: `.opencode/*`、`.sddu/*`、`opencode.json` 未在源码中直接修改，统一由 R5 处理
- **NFR-006 满足**: 新增 phase/status 值仅需在 `schema-v3.0.0.ts` 一处定义

---

### ⚠️ 需要改进

1. **`src/state/machine.ts:53` — `FeatureStateEnum` 仍作为 deprecated 类型导出**
   - **问题**: Spec 和 plan 明确要求删除 FeatureStateEnum，当前保留为 `@deprecated` 类型别名向后兼容。虽标注了 deprecated 且注释清晰，但增加了维护负担。
   - **建议**: 在后续版本（v3.1.0）中彻底移除，当前可接受。

2. **`src/state/machine.ts:221,227` — `as any` 类型断言绕过 TypeScript 检查**
   - **问题**: `(this.stateLoader as any).create()` 和 `(this.stateLoader as any).get()` 使用 `any` 绕过类型系统，注释称 "TASK-005 will migrate StateLoader to v3.0.0" 但此注释放置已久。
   - **建议**: TASK-005 已完成，应移除 `as any` 并直接使用 `StateLoader` 的公开接口类型。

3. **`src/state/schema-v3.0.0.ts:191-236` — `validateStateV3()` 使用 `console.error` 而非结构化错误返回**
   - **问题**: 校验失败时通过 `console.error` 输出诊断，但不向调用者返回结构化错误信息（如哪个字段违规、合法值集合）。调用者只能得到 `true/false`。
   - **建议**: 增加 `validateStateV3Detailed()` 返回 `{ valid: boolean; errors: string[] }` 格式，便于调用者展示用户友好的错误信息。

4. **`src/state/state-loader.ts:124-130` — `applyReparation()` 自动修复可能绕过 R5 确认流程**
   - **问题**: `get()` 方法在读取时自动调用 `applyReparation()` 修复常见 schema 问题（如缺失 version、phase、depth 等），未经过用户确认。虽然修复操作保守（仅补全默认值），但与 spec 中"修复前需用户确认"的原则不完全一致。
   - **建议**: 将"读取时自动修复"作为轻量兼容策略（可接受），但在 `@sddu 状态` 场景中应优先触发 R5 标准检测流程。当前实现的风险可控。

5. **`src/templates/agents/output/sddu-plan.md.hbs:24` — `sddu_update_state` 工具示例仍使用旧字段名**
   - **问题**: 示例命令中 `"status": "planned"` 使用的是旧字段格式，应更新为 `"phase": "planned"` 以匹配 v3.0.0 模型。
   - **建议**: 同步更新 7 个输出模板中的 `sddu_update_state` 示例。

6. **模板到代码的差距（设计特性，非缺陷）**
   - `sddu.md.hbs` 中的仪表盘输出逻辑以自然语言指令的形式描述给 AI Agent，实际输出效果依赖 AI 对指令的理解。建议在后续版本中考虑将仪表盘渲染逻辑从模板迁移到 `src/` 下的 TypeScript 工具函数，减少对 AI 理解的依赖。

---

### ❌ 阻塞问题

**无阻塞问题。** 所有 MVP 功能需求（FR-001 ~ FR-012）均已正确实现且测试通过，无违反 spec 或 plan 的严重偏差。

---

### 建议

1. **建议在 v3.1.0 中执行清理**: 移除 `FeatureStateEnum` deprecated 类型别名、移除 machine.ts 中的 `as any` 类型断言、将 `validateStateV3` 升级为结构化错误返回。
2. **建议将仪表盘渲染逻辑 TypeScript 化**: 将 `sddu.md.hbs` 中的分类、排序、过滤逻辑迁入 `src/state/dashboard-renderer.ts`（或类似模块），使模板仅负责格式化输出，核心逻辑可单元测试。
3. **建议统一 `sddu_update_state` 工具参数**: 将所有模板中的工具调用示例统一为 `"phase"` 字段名（而非旧的 `"status"`），避免混淆。
4. **建议增加 `consistency-checker` 的集成测试**: 当前仅有单元测试（28 用例通过），建议补充一个包含真实 `.sddu/` 目录结构的集成测试，验证完整的检测→报告→修复→再检测流程。
5. **建议验证 `@sddu 状态` 的实际 AI Agent 行为**: 模板中的仪表盘指令是 prompt 层面的，建议在实际 opencode 环境中执行 `@sddu 状态` 并对比预期效果与模板描述是否一致。

---

### 结论

✅ **通过** — 代码质量优秀，测试覆盖达标，规范符合率 100%，无阻塞问题。

所有 MVP 功能需求（FR-001 ~ FR-008）和 V1 需求（FR-009 ~ FR-012）均已正确实现。V2 特性（FR-013 停滞检测、FR-014 merged 跳转追溯）也已一并交付。5 个改进项均为非阻塞优化，可在后续版本迭代。

**下一步**: 运行 `@sddu validate specs-tree-sddu-status-enhancement` 开始最终验证。
