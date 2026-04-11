# SDD 工作流状态优化 - 任务分解文档

| 元数据 | 值 |
|--------|-----|
| **Feature ID** | FR-SDD-004 |
| **Feature 名称** | SDD 工作流状态优化 |
| **版本** | 1.0.0 |
| **分解日期** | 2026-04-02 |
| **作者** | SDD Team |
| **状态** | tasked |
| **Phase** | 3 |

---

## 任务汇总

| 指标 | 值 |
|------|-----|
| 总任务数 | 10 个 |
| 复杂度分布 | S 级 3 个，M 级 5 个，L 级 2 个 |
| 执行波次 | 6 个波次 |
| 预估总工时 | 35 小时 |

### 任务列表

| ID | 任务名称 | 复杂度 | 优先级 | 波次 | 依赖 | 工时 |
|----|----------|--------|--------|------|------|------|
| TASK-001 | 实现 Schema v2.0.0 定义与验证 | M | P0 | 1 | 无 | 2h |
| TASK-002 | 实现 StateManager 核心类 | L | P0 | 2 | TASK-001 | 4h |
| TASK-003 | 实现递归扫描器 (Scanner) | L | P0 | 2 | TASK-001 | 4h |
| TASK-004 | 实现聚合计算器 (Aggregator) | M | P0 | 3 | TASK-003 | 3h |
| TASK-005 | 实现文件锁管理器 (LockManager) | M | P1 | 3 | TASK-002 | 3h |
| TASK-006 | 实现依赖检查器 (DependencyChecker) | M | P1 | 3 | TASK-002 | 3h |
| TASK-007 | 实现迁移工具 (Migrator v2) | M | P1 | 2 | TASK-001 | 4h |
| TASK-008 | 编写单元测试 | S | P0 | 4 | TASK-002~007 | 6h |
| TASK-009 | 集成到 Agent 工作流 | M | P0 | 5 | TASK-008 | 4h |
| TASK-010 | 文档更新与验证 | S | P2 | 6 | TASK-009 | 2h |

---

## TASK-001: 实现 Schema v2.0.0 定义与验证

**复杂度**: M  
**优先级**: P0  
**前置依赖**: 无  
**执行波次**: 1  
**预估工时**: 2h

### 描述
定义分布式状态存储的 Schema v2.0.0，包含所有必需字段和类型验证。支持 6 个标准工作流状态、层级信息、依赖关系和历史记录。

### 涉及文件
- [NEW] `src/state/schema-v2.0.0.ts` - Schema 类型定义
- [NEW] `src/state/validator.ts` - Schema 验证器
- [MODIFY] `src/state/types.ts` - 导出新类型

### 验收标准
- [ ] 定义 WorkflowStatus 类型（6 个状态：specified, planned, tasked, building, reviewed, validated）
- [ ] 定义 StateV2_0_0 接口，包含所有必需字段
- [ ] 实现 validateState() 函数验证状态数据结构
- [ ] 实现 validateTransition() 函数验证状态转换合法性
- [ ] 所有类型导出正确，无 TypeScript 编译错误

### 验证命令
```bash
npm run typecheck
npm run test -- src/state/schema-v2.0.0.test.ts
npm run test -- src/state/validator.test.ts
```

---

## TASK-002: 实现 StateManager 核心类

**复杂度**: L  
**优先级**: P0  
**前置依赖**: TASK-001  
**执行波次**: 2  
**预估工时**: 4h

### 描述
实现状态管理核心类，协调状态读取、更新、验证和持久化。作为分布式状态系统的中枢组件。

### 涉及文件
- [NEW] `src/state/manager.ts` - StateManager 核心类
- [MODIFY] `src/state/index.ts` - 导出 StateManager
- [NEW] `src/state/config.ts` - 状态配置文件

### 验收标准
- [ ] StateManager 类实现 getState() 方法读取状态
- [ ] StateManager 类实现 updateState() 方法更新状态
- [ ] StateManager 类实现 transition() 方法执行状态转换
- [ ] StateManager 类实现 validateTransition() 方法验证转换合法性
- [ ] 状态更新自动记录到 history 数组
- [ ] 状态更新自动更新 updatedAt 时间戳
- [ ] 非法状态转换抛出明确错误

### 验证命令
```bash
npm run typecheck
npm run test -- src/state/manager.test.ts
```

---

## TASK-003: 实现递归扫描器 (Scanner)

**复杂度**: L  
**优先级**: P0  
**前置依赖**: TASK-001  
**执行波次**: 2  
**预估工时**: 4h

### 描述
实现递归扫描器，遍历 specs-tree-root 下所有层级的 specs 目录，收集所有 state.json 文件信息。

### 涉及文件
- [NEW] `src/state/scanner.ts` - Scanner 递归扫描器
- [MODIFY] `src/utils/fs-utils.ts` - 文件系统工具函数（如需要）

### 验收标准
- [ ] Scanner 类实现 scan() 方法递归扫描目录
- [ ] 支持配置最大扫描深度
- [ ] 正确识别所有层级的 state.json 文件
- [ ] 跳过非 specs 目录（不包含 spec.md 的目录）
- [ ] 返回包含所有状态信息的数组
- [ ] 处理文件系统错误并记录警告

### 验证命令
```bash
npm run typecheck
npm run test -- src/state/scanner.test.ts
```

---

## TASK-004: 实现聚合计算器 (Aggregator)

**复杂度**: M  
**优先级**: P0  
**前置依赖**: TASK-003  
**执行波次**: 3  
**预估工时**: 3h

### 描述
实现聚合计算器，基于 Scanner 的结果计算状态分布、进度统计和阻塞 Feature 信息。

### 涉及文件
- [NEW] `src/state/aggregator.ts` - Aggregator 聚合计算器
- [NEW] `src/state/types.ts` (扩展) - 聚合结果类型定义

### 验收标准
- [ ] Aggregator 类实现 aggregate() 方法计算聚合结果
- [ ] 计算按状态分布（specified, planned, tasked, building, reviewed, validated）
- [ ] 计算按阶段分布（Phase 1-6）
- [ ] 计算按层级分布（Level 1, 2, 3...）
- [ ] 计算整体进度百分比
- [ ] 识别阻塞 Feature（dependencies.on 中有未完成状态）
- [ ] 返回 AggregationResult 结构

### 验证命令
```bash
npm run typecheck
npm run test -- src/state/aggregator.test.ts
```

---

## TASK-005: 实现文件锁管理器 (LockManager)

**复杂度**: M  
**优先级**: P1  
**前置依赖**: TASK-002  
**执行波次**: 3  
**预估工时**: 3h

### 描述
实现文件锁管理器，确保并发场景下 state.json 更新的原子性，防止数据损坏。

### 涉及文件
- [NEW] `src/utils/lock-manager.ts` - LockManager 文件锁管理器
- [NEW] `src/utils/lock-file.ts` - 锁文件工具

### 验收标准
- [ ] LockManager 类实现 acquire() 方法获取锁
- [ ] LockManager 类实现 release() 方法释放锁
- [ ] LockManager 类实现 withLock() 方法自动管理锁生命周期
- [ ] 锁超时自动释放（默认 30 秒）
- [ ] 支持重试机制（默认 3 次）
- [ ] 锁文件在异常情况下自动清理

### 验证命令
```bash
npm run typecheck
npm run test -- src/utils/lock-manager.test.ts
```

---

## TASK-006: 实现依赖检查器 (DependencyChecker)

**复杂度**: M  
**优先级**: P1  
**前置依赖**: TASK-002  
**执行波次**: 3  
**预估工时**: 3h

### 描述
实现依赖检查器，验证 Feature 的依赖项状态是否就绪，检测循环依赖。

### 涉及文件
- [NEW] `src/state/dependency-checker.ts` - DependencyChecker 依赖检查器
- [NEW] `src/state/errors.ts` - 自定义错误类型

### 验收标准
- [ ] DependencyChecker 类实现 checkDependencies() 方法检查依赖
- [ ] DependencyChecker 类实现 detectCycles() 方法检测循环依赖
- [ ] 依赖项状态为 planned 或更早阶段时返回警告
- [ ] 依赖项不存在时返回错误
- [ ] 检测到循环依赖时返回明确的错误信息
- [ ] 返回 DependencyCheckResult 结构

### 验证命令
```bash
npm run typecheck
npm run test -- src/state/dependency-checker.test.ts
```

---

## TASK-007: 实现迁移工具 (Migrator v2)

**复杂度**: M  
**优先级**: P1  
**前置依赖**: TASK-001  
**执行波次**: 2  
**预估工时**: 4h

### 描述
实现从集中式 state.json (v1.x) 迁移到分布式 state.json (v2.0.0) 的迁移工具。

### 涉及文件
- [NEW] `src/state/migrator.ts` - Migrator 迁移工具
- [MODIFY] `src/commands/migrate.ts` - 迁移命令（如存在）

### 验收标准
- [ ] Migrator 类实现 migrate() 方法执行迁移
- [ ] 读取旧版集中式 state.json
- [ ] 为每个 Feature 创建独立的 state.json
- [ ] 保留所有历史记录
- [ ] 迁移后验证数据完整性
- [ ] 支持回滚操作
- [ ] 生成迁移报告

### 验证命令
```bash
npm run typecheck
npm run test -- src/state/migrator.test.ts
```

---

## TASK-008: 编写单元测试

**复杂度**: S  
**优先级**: P0  
**前置依赖**: TASK-002, TASK-003, TASK-004, TASK-005, TASK-006, TASK-007  
**执行波次**: 4  
**预估工时**: 6h

### 描述
为所有核心组件编写完整的单元测试，确保代码质量和功能正确性。

### 涉及文件
- [NEW] `src/state/__tests__/manager.test.ts`
- [NEW] `src/state/__tests__/scanner.test.ts`
- [NEW] `src/state/__tests__/aggregator.test.ts`
- [NEW] `src/state/__tests__/lock-manager.test.ts`
- [NEW] `src/state/__tests__/dependency-checker.test.ts`
- [NEW] `src/state/__tests__/migrator.test.ts`
- [NEW] `src/state/__tests__/validator.test.ts`

### 验收标准
- [ ] StateManager 测试覆盖率 ≥ 90%
- [ ] Scanner 测试覆盖率 ≥ 90%
- [ ] Aggregator 测试覆盖率 ≥ 90%
- [ ] LockManager 测试覆盖率 ≥ 90%
- [ ] DependencyChecker 测试覆盖率 ≥ 90%
- [ ] Migrator 测试覆盖率 ≥ 90%
- [ ] 所有测试通过，无失败
- [ ] 模拟并发场景测试

### 验证命令
```bash
npm run test -- src/state/__tests__/
npm run test:coverage -- src/state/
```

---

## TASK-009: 集成到 Agent 工作流

**复杂度**: M  
**优先级**: P0  
**前置依赖**: TASK-008  
**执行波次**: 5  
**预估工时**: 4h

### 描述
将新的状态管理系统集成到现有的 Agent 工作流中，确保 @sdd-spec、@sdd-plan、@sdd-tasks 等 Agent 能正确更新状态。

### 涉及文件
- [MODIFY] `src/agents/sdd-spec.ts` - 集成状态更新
- [MODIFY] `src/agents/sdd-plan.ts` - 集成状态更新
- [MODIFY] `src/agents/sdd-tasks.ts` - 集成状态更新
- [MODIFY] `src/agents/sdd-build.ts` - 集成状态更新
- [MODIFY] `src/agents/sdd-review.ts` - 集成状态更新
- [MODIFY] `src/agents/sdd-validate.ts` - 集成状态更新
- [MODIFY] `src/tools/sdd_update_state.ts` - 更新工具实现

### 验收标准
- [ ] @sdd-spec 完成后自动设置状态为 specified
- [ ] @sdd-plan 完成后自动设置状态为 planned
- [ ] @sdd-tasks 完成后自动设置状态为 tasked
- [ ] @sdd-build 完成后自动设置状态为 building
- [ ] @sdd-review 完成后自动设置状态为 reviewed
- [ ] @sdd-validate 完成后自动设置状态为 validated
- [ ] /tool sdd_update_state 使用新的 StateManager
- [ ] 状态更新失败时回滚操作

### 验证命令
```bash
npm run typecheck
npm run test -- src/agents/__tests__/
npm run e2e -- test/e2e/state-integration.test.ts
```

---

## TASK-010: 文档更新与验证

**复杂度**: S  
**优先级**: P2  
**前置依赖**: TASK-009  
**执行波次**: 6  
**预估工时**: 2h

### 描述
更新项目文档，包括 README、开发指南和 API 文档，并进行最终验证。

### 涉及文件
- [MODIFY] `README.md` - 项目概述更新
- [NEW] `docs/state-management.md` - 状态管理指南
- [NEW] `docs/migration-guide.md` - 迁移指南
- [MODIFY] `docs/api.md` - API 文档更新

### 验收标准
- [ ] README.md 包含新状态系统说明
- [ ] 开发指南文档完整
- [ ] 迁移指南包含详细步骤
- [ ] API 文档覆盖所有新接口
- [ ] 所有文档通过拼写检查
- [ ] 文档示例代码可运行

### 验证命令
```bash
npm run docs:build
npm run docs:verify
```

---

## 执行波次详情

### Wave 1 (基础层)
- TASK-001: Schema v2.0.0 定义与验证

### Wave 2 (核心层)
- TASK-002: StateManager 核心类
- TASK-003: 递归扫描器 (Scanner)
- TASK-007: 迁移工具 (Migrator v2)

### Wave 3 (功能层)
- TASK-004: 聚合计算器 (Aggregator)
- TASK-005: 文件锁管理器 (LockManager)
- TASK-006: 依赖检查器 (DependencyChecker)

### Wave 4 (测试层)
- TASK-008: 编写单元测试

### Wave 5 (集成层)
- TASK-009: 集成到 Agent 工作流

### Wave 6 (文档层)
- TASK-010: 文档更新与验证

---

## 下一步

👉 运行 `@sdd-build TASK-001` 开始实现第一个任务

```bash
# 更新状态到 tasked
/tool sdd_update_state {"feature": "specs-tree-sdd-workflow-state-optimization", "state": "tasked"}
```
