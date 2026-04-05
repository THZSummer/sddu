# SDD 工作流状态优化 - 任务分解 (v2.0.0)

| 元数据 | 值 |
|--------|-----|
| **Feature ID** | FR-SDD-004 |
| **Feature 名称** | SDD 工作流状态优化 |
| **版本** | 2.0.0 |
| **创建日期** | 2026-04-05 |
| **作者** | SDD Team |
| **状态** | tasked |
| **Phase** | 3 |

---

## 任务汇总

| 指标 | 值 |
|------|-----|
| **总任务数** | 13 个 |
| **复杂度分布** | S 级 5 个，M 级 6 个，L 级 2 个 |
| **执行波次** | 6 个波次 |
| **预估总工时** | 约 38 小时 |

---

## Wave 1: Schema 和类型定义

**目标**: 建立 State Schema v2.0.0 和架构决策文档  
**依赖**: 无  
**可并行**: 是

---

### TASK-001: State Schema v2.0.0 定义

**复杂度**: M  
**优先级**: P0  
**执行波次**: 1  
**前置依赖**: 无  
**预估工时**: 3 小时

#### 描述
创建 State Schema v2.0.0 TypeScript 类型定义，支持新版状态字段（phaseHistory、增强版 history）。

#### 涉及文件
- [NEW] `src/state/schema-v2.0.0.ts`

#### 实现要点
1. 定义 `StateV2_0_0` 接口
2. 包含 `phaseHistory` 字段（PhaseHistoryEntry[]）
3. 扩展 `history` 字段（HistoryEntry[]，新增 actor 和 comment）
4. 导出类型校验函数 `isValidStateV2()`
5. 保持与 v1.2.11 的部分兼容性（可选字段）

#### 验收标准
- [ ] Schema 文件创建成功
- [ ] TypeScript 编译无错误
- [ ] 包含 phaseHistory 类型定义
- [ ] 导出校验函数
- [ ] 通过单元测试验证类型正确性

#### 验证命令
```bash
npm run build
npm run test -- schema-v2.0.0.test.ts
```

---

### TASK-002: 创建 ADR 文档 (ADR-006 ~ ADR-010)

**复杂度**: S  
**优先级**: P0  
**执行波次**: 1  
**前置依赖**: 无  
**预估工时**: 2 小时

#### 描述
创建 5 个架构决策记录文档，记录关键技术决策的背景、决策内容和后果。

#### 涉及文件
- [NEW] `.sdd/specs-tree-root/architecture/adr/ADR-006.md` (StateMachine 集成策略)
- [NEW] `.sdd/specs-tree-root/architecture/adr/ADR-007.md` (状态自动更新机制)
- [NEW] `.sdd/specs-tree-root/architecture/adr/ADR-008.md` (状态历史记录格式)
- [NEW] `.sdd/specs-tree-root/architecture/adr/ADR-009.md` (依赖检查器实现方案)
- [NEW] `.sdd/specs-tree-root/architecture/adr/ADR-010.md` (State Schema v2.0.0 迁移)

#### 实现要点
1. 使用标准 ADR 模板
2. 包含 Context、Decision、Consequences 三部分
3. 与 plan.md 中的决策摘要保持一致
4. 添加相关的图表和数据流说明

#### 验收标准
- [ ] 5 个 ADR 文件全部创建
- [ ] 每个 ADR 符合标准模板格式
- [ ] 决策内容与 plan.md 一致
- [ ] 目录索引更新

#### 验证命令
```bash
ls -la .sdd/specs-tree-root/architecture/adr/ADR-00*.md | wc -l
# 应输出 5
```

---

## Wave 2: StateMachine 核心集成

**目标**: 将 StateMachine 集成到 Agent 工作流  
**依赖**: Wave 1 完成  
**可并行**: 部分

---

### TASK-003: 增强 StateMachine 支持 Agent 工作流钩子

**复杂度**: M  
**优先级**: P0  
**执行波次**: 2  
**前置依赖**: TASK-001  
**预估工时**: 4 小时

#### 描述
在现有 StateMachine 基础上添加 Agent 工作流钩子接口，支持 Agent 完成后自动触发状态更新。

#### 涉及文件
- [MODIFY] `src/state/machine.ts`

#### 实现要点
1. 新增 `onTransitionComplete()` 钩子方法
2. 添加 Agent 工作流事件监听
3. 集成 phaseHistory 自动记录
4. 保持现有状态转换验证逻辑不变
5. 导出钩子接口供 Agent 调用

#### 验收标准
- [ ] StateMachine 导出钩子接口
- [ ] 状态转换验证正常工作
- [ ] phaseHistory 自动记录
- [ ] 向后兼容现有调用方式
- [ ] 通过单元测试

#### 验证命令
```bash
npm run test -- machine.test.ts
```

---

### TASK-004: 集成 StateMachine 到 Agent 工作流

**复杂度**: L  
**优先级**: P0  
**执行波次**: 2  
**前置依赖**: TASK-003  
**预估工时**: 5 小时

#### 描述
修改 sdd-agents.ts，在每个 Agent 完成后调用 StateMachine 钩子进行状态更新。

#### 涉及文件
- [MODIFY] `src/agents/sdd-agents.ts`

#### 实现要点
1. 导入 StateMachine 实例
2. 在每个 Agent 执行完成后调用状态更新
3. 6 个 Agent 对应 6 个状态：
   - @sdd-spec → specified (phase 1)
   - @sdd-plan → planned (phase 2)
   - @sdd-tasks → tasked (phase 3)
   - @sdd-build → building (phase 4)
   - @sdd-review → reviewed (phase 5)
   - @sdd-validate → validated (phase 6)
4. 错误处理：状态更新失败不影响 Agent 主要功能
5. 添加日志记录

#### 验收标准
- [ ] 6 个 Agent 全部集成状态更新
- [ ] 运行每个 Agent 后状态自动更新
- [ ] 状态更新失败有明确错误提示
- [ ] 不影响 Agent 原有功能
- [ ] 通过集成测试

#### 验证命令
```bash
# 测试单个 Agent
node --test tests/agents/sdd-spec.test.ts
# 验证状态更新
cat .sdd/specs-tree-root/test-feature/state.json | jq '.status'
```

---

### TASK-005: 实现状态历史记录自动记录

**复杂度**: M  
**优先级**: P1  
**执行波次**: 2  
**前置依赖**: TASK-003  
**预估工时**: 3 小时

#### 描述
在 StateMachine 中实现 history 数组的自动记录功能，每次状态变更追加历史记录。

#### 涉及文件
- [MODIFY] `src/state/machine.ts`

#### 实现要点
1. 定义 `HistoryEntry` 接口（timestamp, from, to, triggeredBy, actor, comment）
2. 在状态转换时自动创建 HistoryEntry
3. 追加到 state.json 的 history 数组
4. 支持自定义 comment
5. 历史记录不可篡改（只追加）

#### 验收标准
- [ ] 每次状态变更自动记录历史
- [ ] 历史记录包含所有必需字段
- [ ] history 数组只追加不修改
- [ ] 支持查询完整历史
- [ ] 通过单元测试

#### 验证命令
```bash
npm run test -- machine-history.test.ts
# 验证历史记录
cat .sdd/specs-tree-root/test-feature/state.json | jq '.history'
```

---

## Wave 3: 自动更新机制

**目标**: 实现 session.idle 事件触发的状态自动更新  
**依赖**: Wave 2 完成  
**可并行**: 部分

---

### TASK-006: 实现状态自动更新器

**复杂度**: M  
**优先级**: P0  
**执行波次**: 3  
**前置依赖**: TASK-003  
**预估工时**: 4 小时

#### 描述
创建 auto-updater.ts，实现基于文件监听的自动状态更新逻辑。

#### 涉及文件
- [NEW] `src/state/auto-updater.ts`

#### 实现要点
1. 监听 Feature 目录下的文件变更
2. 检测 spec.md、plan.md、tasks.md 等关键文件
3. 根据文件存在情况推断状态
4. 调用 StateMachine 进行状态更新
5. 防抖机制避免频繁更新
6. 提供启用/禁用开关

#### 验收标准
- [ ] 文件变更自动触发状态检查
- [ ] 状态推断逻辑正确
- [ ] 防抖机制正常工作
- [ ] 支持启用/禁用配置
- [ ] 通过单元测试

#### 验证命令
```bash
npm run test -- auto-updater.test.ts
```

---

### TASK-007: 集成 session.idle 事件处理

**复杂度**: M  
**优先级**: P0  
**执行波次**: 3  
**前置依赖**: TASK-006  
**预估工时**: 3 小时

#### 描述
将 auto-updater 集成到 VS Code session.idle 事件，实现空闲时自动扫描和更新状态。

#### 涉及文件
- [MODIFY] `src/state/auto-updater.ts`
- [MODIFY] `src/index.ts`

#### 实现要点
1. 监听 VS Code `onDidChangeTextDocument` 事件
2. 设置 idle 超时（默认 5 秒）
3. idle 触发时调用 auto-updater 扫描
4. 仅更新有文件变更的 Feature
5. 避免递归无限循环

#### 验收标准
- [ ] session.idle 事件正确触发
- [ ] 空闲时自动扫描并更新状态
- [ ] 不会过度频繁更新
- [ ] 支持配置 idle 超时时间
- [ ] 通过集成测试

#### 验证命令
```bash
# 手动触发测试
node --test tests/state/auto-updater-integration.test.ts
```

---

## Wave 4: 依赖检查器

**目标**: 实现状态级别的依赖检查  
**依赖**: Wave 1 完成  
**可并行**: 是

---

### TASK-008: 实现依赖状态检查器

**复杂度**: M  
**优先级**: P1  
**执行波次**: 4  
**前置依赖**: TASK-001  
**预估工时**: 4 小时

#### 描述
创建 dependency-checker.ts，基于 MultiFeatureManager 的依赖图实现状态级别的依赖检查。

#### 涉及文件
- [NEW] `src/state/dependency-checker.ts`

#### 实现要点
1. 复用 MultiFeatureManager 的依赖图构建逻辑
2. 实现状态级别检查规则：
   - 状态前进：检查所有依赖 Feature 状态 ≥ 当前状态
   - 状态回退：警告检查被依赖 Feature 状态
3. 循环依赖检测（复用现有逻辑）
4. 提供依赖就绪查询接口
5. 添加缓存机制提升性能

#### 验收标准
- [ ] 依赖状态检查逻辑正确
- [ ] 状态前进前验证依赖就绪
- [ ] 依赖未就绪时阻止状态变更
- [ ] 循环依赖检测正常
- [ ] 性能满足要求（< 200ms）

#### 验证命令
```bash
npm run test -- dependency-checker.test.ts
```

---

### TASK-009: 集成依赖检查到 StateMachine

**复杂度**: M  
**优先级**: P1  
**执行波次**: 4  
**前置依赖**: TASK-003, TASK-008  
**预估工时**: 3 小时

#### 描述
将 DependencyChecker 集成到 StateMachine 的状态转换验证流程中。

#### 涉及文件
- [MODIFY] `src/state/machine.ts`
- [MODIFY] `src/state/multi-feature-manager.ts`

#### 实现要点
1. 在 StateMachine 的 transition() 方法中调用 DependencyChecker
2. 依赖未就绪时抛出验证错误
3. 提供绕过检查的选项（用于特殊情况）
4. 错误消息清晰说明依赖情况
5. 日志记录依赖检查结果

#### 验收标准
- [ ] 状态转换自动检查依赖
- [ ] 依赖未就绪时阻止转换
- [ ] 错误消息清晰有用
- [ ] 支持绕过检查（高级选项）
- [ ] 通过集成测试

#### 验证命令
```bash
npm run test -- machine-dependency.test.ts
```

---

## Wave 5: Schema 迁移工具

**目标**: 实现 State Schema v1.2.11 → v2.0.0 迁移  
**依赖**: Wave 1 完成  
**可并行**: 是

---

### TASK-010: 增强 Migrator 支持 v2.0.0 迁移

**复杂度**: M  
**优先级**: P0  
**执行波次**: 5  
**前置依赖**: TASK-001  
**预估工时**: 4 小时

#### 描述
修改现有 migrator.ts，支持从 v1.2.5/v1.2.11 迁移到 v2.0.0。

#### 涉及文件
- [MODIFY] `src/state/migrator.ts`

#### 实现要点
1. 添加 v1.2.5 → v2.0.0 迁移路径
2. 添加 v1.2.11 → v2.0.0 迁移路径
3. 迁移时自动添加 phaseHistory 字段
4. 迁移时转换 history 格式（添加 actor、comment）
5. 迁移前自动备份原文件
6. 支持回滚

#### 验收标准
- [ ] 支持 v1.2.5 → v2.0.0 迁移
- [ ] 支持 v1.2.11 → v2.0.0 迁移
- [ ] 迁移前后数据完整
- [ ] 自动备份原文件
- [ ] 支持回滚操作
- [ ] 通过迁移测试

#### 验证命令
```bash
npm run test -- migrator-v2.test.ts
```

---

### TASK-011: 创建 Schema 迁移命令

**复杂度**: S  
**优先级**: P0  
**执行波次**: 5  
**前置依赖**: TASK-010  
**预估工时**: 2 小时

#### 描述
创建 sdd-migrate-schema.ts 命令，提供 CLI 接口执行 Schema 迁移。

#### 涉及文件
- [NEW] `src/commands/sdd-migrate-schema.ts`

#### 实现要点
1. 创建命令类 `SddMigrateSchemaCommand`
2. 支持参数：
   - `--feature`: 指定单个 Feature
   - `--all`: 迁移所有 Feature
   - `--dry-run`: 预演模式
   - `--backup`: 是否备份（默认 true）
3. 显示迁移进度
4. 输出迁移报告
5. 注册到命令列表

#### 验收标准
- [ ] 命令可执行
- [ ] 支持单 Feature 迁移
- [ ] 支持批量迁移
- [ ] dry-run 模式正常工作
- [ ] 输出清晰的迁移报告
- [ ] 通过命令测试

#### 验证命令
```bash
# 测试命令
node dist/commands/sdd-migrate-schema.js --help
# 预演模式
node dist/commands/sdd-migrate-schema.js --dry-run --all
```

---

## Wave 6: 测试和集成

**目标**: 完整测试和最终集成  
**依赖**: Wave 2-5 完成  
**可并行**: 部分

---

### TASK-012: 单元测试和集成测试

**复杂度**: L  
**优先级**: P0  
**执行波次**: 6  
**前置依赖**: TASK-004, TASK-007, TASK-009, TASK-011  
**预估工时**: 6 小时

#### 描述
为所有新增和修改的组件编写完整的单元测试和集成测试。

#### 涉及文件
- [NEW] `tests/state/schema-v2.0.0.test.ts`
- [NEW] `tests/state/machine-v2.test.ts`
- [NEW] `tests/state/auto-updater.test.ts`
- [NEW] `tests/state/dependency-checker.test.ts`
- [NEW] `tests/state/migrator-v2.test.ts`
- [NEW] `tests/commands/sdd-migrate-schema.test.ts`

#### 实现要点
1. 为每个新增组件编写单元测试
2. 编写集成测试验证组件间协作
3. 测试覆盖关键路径和边界情况
4. 测试性能指标（响应时间）
5. 测试兼容性（多 Schema 版本）

#### 验收标准
- [ ] 所有单元测试通过
- [ ] 所有集成测试通过
- [ ] 代码覆盖率 ≥ 80%
- [ ] 性能测试达标
- [ ] 兼容性测试通过

#### 验证命令
```bash
npm run test
npm run test:coverage
```

---

### TASK-013: 导出新组件并更新索引

**复杂度**: S  
**优先级**: P1  
**执行波次**: 6  
**前置依赖**: TASK-012  
**预估工时**: 1 小时

#### 描述
更新 src/index.ts，导出所有新增组件，确保模块可被外部使用。

#### 涉及文件
- [MODIFY] `src/index.ts`

#### 实现要点
1. 导出 `StateV2_0_0` 类型
2. 导出 `DependencyChecker` 类
3. 导出 `AutoUpdater` 类
4. 导出 `SddMigrateSchemaCommand` 类
5. 更新 API 文档注释

#### 验收标准
- [ ] 所有新组件正确导出
- [ ] TypeScript 编译无错误
- [ ] 类型定义正确
- [ ] API 文档完整
- [ ] 通过构建测试

#### 验证命令
```bash
npm run build
node -e "const sddu = require('./dist'); console.log(Object.keys(sddu))"
```

---

## 任务依赖图

```
Wave 1
├─ TASK-001 ─────────────┬──────────────────────┬──────────────┐
│   (Schema v2.0.0)      │                      │              │
└─ TASK-002              │                      │              │
    (ADR 文档)            │                      │              │
                         ▼                      ▼              ▼
Wave 2              TASK-003               TASK-008        TASK-010
                    (StateMachine)        (DepChecker)    (Migrator)
                    │    │    │              │              │
                    ▼    ▼    ▼              ▼              ▼
Wave 3          TASK-004  TASK-005       TASK-009       TASK-011
                (Agent)   (History)     (Dep 集成)     (迁移命令)
                    │                                     
                    ▼                                      
Wave 4          TASK-006                                   
               (Auto-updater)                              
                    │                                      
                    ▼                                      
Wave 5          TASK-007                                   
              (session.idle)                               
                    │                                      
                    ▼                                      
Wave 6          TASK-012 ───────────► TASK-013            
                (测试)                 (索引导出)          
```

---

## 验收标准汇总

| ID | 验收项 | 关联任务 | 验证方法 |
|----|--------|----------|----------|
| AC-001 | StateMachine 集成到所有 6 个 Agent | TASK-004 | 运行每个 Agent，验证状态自动更新 |
| AC-002 | session.idle 触发状态更新 | TASK-007 | 修改文件后等待 idle，验证状态更新 |
| AC-003 | 历史记录自动记录 | TASK-005 | 检查 state.json 的 history 数组 |
| AC-004 | 依赖状态检查 | TASK-009 | 尝试在依赖未就绪时推进状态，验证被阻止 |
| AC-005 | Schema 迁移工具 | TASK-011 | 运行迁移命令，验证 v1.2.11 → v2.0.0 |
| AC-006 | 跨 Feature 聚合查询 | TASK-008 | 运行聚合查询，验证返回所有 Feature 状态 |

---

## 下一步

👉 运行 `@sdd-build TASK-001` 开始实现第一个任务

**建议执行顺序**:
1. 先执行 Wave 1 任务（TASK-001, TASK-002）建立基础
2. 并行执行 Wave 2、Wave 4、Wave 5
3. 执行 Wave 3（依赖 Wave 2）
4. 最后执行 Wave 6（测试和集成）

---

**任务分解版本**: 2.0.0  
**任务分解状态**: tasked  
**下一步**: 运行 `/tool sdd_update_state` 更新状态
