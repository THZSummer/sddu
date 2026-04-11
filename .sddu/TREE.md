# .sdd 目录结构规范 (SDDU 升级版)

## 概述

`.sdd` 目录是 **Software Development Definition Ultimate (SDDU)** 工作流的核心存储位置。该目录用于保存项目的设计规范、开发规划、实施计划等功能性文档，以及开发相关的元数据和配置。支持与新旧版本 SDD 工作流的无缝兼容。

## 目录树结构

```
.sdd/
├── README.md                       # SDD/SDDU 工作空间说明
├── TREE.md                         # 目录结构定义（本文档）
├── ROADMAP.md                      # 版本路线图
├── specs-tree-root/                # 根 specs
│   ├── spec.md                     # 规格说明文档
│   ├── plan.md                     # 技术计划文档
│   ├── tasks.md                    # 任务分解文档
│   ├── discovery.md                # 需求挖掘文档 (SDDU 新增阶段 0)
│   ├── state.json                  # 状态跟踪文件
│   ├── specs-tree-[feature]/       # 一级 specs 目录
│   │   ├── spec.md                 # 规格说明文档
│   │   ├── plan.md                 # 技术计划文档
│   │   ├── tasks.md                # 任务分解文档
│   │   ├── discovery.md            # 需求挖掘文档 (SDDU 新增阶段 0)
│   │   ├── state.json              # 状态跟踪文件
│   │   └── specs-tree-[sub]/       # 二级 specs 目录（支持多层嵌套）
│   │       ├── spec.md             # 规格说明文档
│   │       ├── plan.md             # 技术计划文档
│   │       ├── tasks.md            # 任务分解文档
│   │       ├── discovery.md        # 需求挖掘文档 (SDDU 新增阶段 0)
│   │       └── state.json          # 状态跟踪文件
│   └── specs-tree-[other]/         # 一级 specs 目录（同级并列）
│       ├── spec.md                 # 规格说明文档
│       ├── plan.md                 # 技术计划文档
│       ├── tasks.md                # 任务分解文档
│       ├── discovery.md            # 需求挖掘文档 (SDDU 新增阶段 0)
│       └── state.json              # 状态跟踪文件
```

## 命名规范

### specs 目录命名
- 所有 specs 目录必须以 `specs-tree-` 或 `specs-tree-[domain]-` 前缀开头
- 使用有意义的功能名称，避免过于宽泛的词汇
- 采用 kebab-case：`specs-tree-my-awesome-feature`
- 优先使用业务领域术语而非技术术语
- SDDU 支持更深的嵌套层次和更丰富的域名结构

### 推荐的命名实例
- ✅ `specs-tree-user-authentication`：用户认证 specs  
- ✅ `specs-tree-api-rate-limiting`：API 限流 specs
- ✅ `specs-tree-database-migration`：数据库迁移 specs
- ✅ `specs-tree-discovery-user-journey`：用户旅程发现 specs (SDDU 新增)
- ✅ `specs-tree-core-payment-process`：核心支付处理 specs (SDDU 分离核心功能)

## SDD 与 SDDU 兼容性

### 命令对照表
| SDD 旧版命令 | SDDU 新版命令 | 说明 |
|--------------|---------------|------|
| `@sdd-discovery` | `@sddu-discovery` | 需求挖掘 (新阶段 0) - 推荐使用 SDDU |
| `@sdd-0-discovery` | `@sddu-0-discovery` | 需求挖掘 (完整名称) - 推荐使用 SDDU |
| `@sdd-spec` | `@sddu-spec` | 规范编写 - 推荐使用 SDDU |
| `@sdd-plan` | `@sddu-plan` | 技术规划 - 推荐使用 SDDU |
| `@sdd-tasks` | `@sddu-tasks` | 任务分解 - 推荐使用 SDDU |
| `@sdd-build` | `@sddu-build` | 任务实现 - 推荐使用 SDDU |
| ... | ... | 其他命令同样遵循此对应关系 |

**兼容性保证**: 所有旧 SDD 命令将继续运行以保护现有投资。

## 使用规则

⚠️ **所有 .sdd 内部活动必须参考本文件**

### 操作规范
1. **严格禁止手动编辑** `spec.md` / `plan.md` / `tasks.md` / `discovery.md` 等关键文档 - 应通过 `@sddu-*` 或 `@sdd-*` 命令自动生成
2. **新增 specs** 必须首先在 `specs-tree-root/` 下创建对应的 `specs-tree-xxx` 目录
3. **每个 specs** 遵活采用 `discovery` → `spec` → `plan` → `tasks` → `build` → `review` → `validate` 的工作流程 (SDDU 新增 discovery 阶段)
4. **状态同步**：每次工作流变更都应更新对应 `state.json`
5. **新工作流**：SDDU 推荐 `discovery` (需求探索) → `spec` (规范定义) → ... 流程

### 索引维护
- 每次添加新 specs 目录时，必须相应更新根目录的 `README.md` 和 `specs-tree-root/README.md`
- 包括 SDD 和 SDDU 两种格式的说明
- 状态变更需反映在导航文档中

### 版本控制策略
- `.sdd` 目录整体纳入版本控制
- 敏感信息严禁存在于 `.sdd/` 目录中  
- 保证 `.sdd` 在 CI/CD 流程中可用
- 非必要时不使用 `.gitignore` 屏蔽 `.sdd` 内文件
- SDDU 支持 `.sddu` 新目录结构，与 `.sdd` 并行存在

## 文件组织原则

### 结构化存储
根据生命周期将数据隔离，每个阶段使用独立的文件便于：
- 需求分析阶段关注 `discovery.md` 和 `spec.md` (SDDU 强化 discovery)
- 设计阶段关注 `plan.md`
- 实现阶段通过 `tasks.md` 跟踪进度

### 明确边界
- `.sdd` 作为规范定义区域，不存放临时工件或实验文件
- SDDU 提供 `.sddu` 替代目录选择
- 开发中的实现细节仍保留在代码仓库主干中

### 可追溯性
- 每次对功能实现的修改都有对应的规范文件进行支撑
- SDDU 增强了 discovery 阶段对需求来源的追踪
- 通过 `state.json` 状态文件记录变更历史

### 最小权限
- 不同团队成员根据权限级别访问相应规范文件
- SDDU 支持更细粒度的访问控制
- 核心规范文件（spec、plan）变更需经过评审流程

### SDD 到 SDDU 迁移指导
- ✅ 现有 `.sdd/` 目录完全兼容新 SDDU 工作流
- ✅ 现有 `.sdd/specs-tree-root/` 结构继续使用
- ✅ 现有命令 (`@sdd-xxx`) 继续运行 (兼容性)
- ⚠️ 新项目推荐使用 `@sddu-xxx` 命令获得完整功能
- 🔄 渐进式迁移：可以新功能使用 `@sddu-`，保持现有使用 `@sdd-`

---

💡 **注意**: 此规范文档是 SDDU (SDD 升级) 工作流程的权威规范，任何对 .sdd 目录的操作应遵循本文档所定义的规则。SDDU 在保持完全向后兼容的同时提供了增强功能。