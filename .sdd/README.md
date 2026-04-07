# SDD/SDDU Workspace (已迁移到 SDDU 结构)

## 目录结构

```
.sdd/
├── README.md                          # 本文件 - SDD/SDDU 工作空间说明
├── TREE.md                           # 目录结构定义（新版本规范）
├── ROADMAP.md                        # 版本路线图
├── docs/                             # 工具文档目录
├── docs/migration-guide.md           # SDD 到 SDDU 迁移指南
├── docs/faq.md                       # 常见问题解答
├── docs/containerization-faq.md      # 容器化 FAQ
├── config.json                       # SDDU 配置（可选）
└── specs-tree-root/                  # 规范文件目录
    ├── README.md                     # 目录说明
    ├── state.json                    # 全局状态文件
    └── specs-tree-[feature]/         # 标准化 Feature 目录 (SDDU 推荐规范结构)
        ├── discovery.md              # 需求挖掘 (SDDU 新增阶段 0)  
        ├── spec.md                   # 规范编写
        ├── plan.md                   # 技术规划
        ├── tasks.md                  # 任务分解
        ├── build.md                  # 任务实现
        ├── review.md                 # 代码审查
        ├── validate.md               # 功能验证
        └── state.json                # 当前状态文件
```

## 快速开始

### 新项目 (推荐使用 SDDU)
1. 使用 `@sddu 开始 [feature name]` 开始新 feature (推荐新项目)
2. 使用 `@sddu-discovery "需求说明"` 进行深度需求挖掘 (SDDU 特有功能)
3. 规范文件将自动创建在 `.sdd/specs-tree-root/specs-tree-[feature]/` 标准目录

### 现有项目 (向后兼容)
1. 使用 `@sdd 开始 [feature name]` 继续使用原有工作流 (完全兼容)
2. 规范文件继续位于 `.sdd/specs-tree-root/` 目录
3. 所有原有功能完全正常使用

> **💡 迁移提示**: 现有项目可无缝继续使用，无需任何改动。新项目可逐步采用 SDDU 规划。

## SDD 与 SDDU 对照表

| SDD 旧版命令 | SDDU 新版命令 | 推荐 | 说明 |
|--------------|---------------|------|------|
| `@sdd` | `@sddu` | ✅ 推荐 | 智能路由入口 |
| `@sdd-discovery` | `@sddu-discovery` | ✅ 推荐 | 需求挖掘 (SDDU 新增) | 
| `@sdd-spec` | `@sddu-spec` | ✅ 推荐 | 规范编写 |
| `@sdd-plan` | `@sddu-plan` | ✅ 推荐 | 技术规划 |
| `@sdd-tasks` | `@sddu-tasks` | ✅ 推荐 | 任务分解 |
| `@sdd-build` | `@sddu-build` | ✅ 推荐 | 任务实现 |
| `@sdd-review` | `@sddu-review` | ✅ 推荐 | 代码审查 |
| `@sdd-validate` | `@sddu-validate` | ✅ 推荐 | 功能验证 |
| ... | ... | ... | 其他命令同理 |

**✅ 完全向后兼容**: 所有旧版 @sdd- 命令将继续正常工作！

## 主要增强功能 (SDDU)

### 1. 需求挖掘阶段 (Stage 0)
- ✅ 新增 `@sddu-discovery` 实现代阶段 0
- ✅ 深入分析用户需求和应用场景
- ✅ 识别边界条件和潜在问题

### 2. 统一目录规范
- ✅ 推荐使用 `specs-tree-[feature]` 命令格式
- ✅ 更清晰的命名规则
- ✅ 更好的目录导航和工具支持

### 3. 增强的状态管理
- ✅ 全局状态追踪 (`.sdd/specs-tree-root/state.json`)  
- ✅ 单 feature 状态隔离 (`.sdd/specs-tree-root/specs-tree-[feature]/state.json`)

## Agents

### SDDU 推荐 (新项目)
- `@sddu` / `@sdd` - 智能入口 (SDDU 推荐使用 `@sddu`)
- `@sddu-docs` / `@sdd-docs` - 目录导航（自动触发）  
- `@sddu-roadmap` / `@sdd-roadmap` - Roadmap 规划
- `@sddu-discovery` - 深度需求挖居专家 (SDDU 新增)
- 其他 12+ 个 agents 均有 `sddu-` 对应增强版

### 目录结构特点

**兼容性支持**:
- 🔄 旧版格式 `.sdd/specs-tree-root/[feature]/` (完全兼容)  
- 🔄 新版格式 `.sdd/specs-tree-root/specs-tree-[feature]/` (推荐)
- 🔄 两种格式可并存在同一项目

**SDDU 规范目录命名** `specs-tree-[feature]`:
- ✅ 明确标识为规范目录类型
- ✅ 防止命名冲突  
- ✅ 便于工具识别和自动处理
- ✅ 支持深度嵌套 (如 `specs-tree-auth/specs-tree-core`)

## 迁移指南

项目从 SDD 迁移到 SDDU 非常简单 :
- **现有项目**: 无须任何操作，继续正常使用 
- **新项目**: 建议使用 `@sddu-*` 命令开始新工作
- **逐步迁移**: 可在项目间歇期手动调整目录结构（可选）

详见: [`.sdd/docs/migration-guide.md`](./docs/migration-guide.md) 

## 文档资源

- 📝 **迁移指南**: `.sdd/docs/migration-guide.md` - SDD 到 SDDU 迁移详细步骤
- ❓ **FAQ**: `.sdd/docs/faq.md` - 常见问题解答
- 🔧 **容器化 FAQ**: `.sdd/docs/containerization-faq.md` - 目录结构 FAQ
- 🗺️ **路线图**: `.sdd/ROADMAP.md` - 版本规划和未来功能
- 📊 **TREE**: `.sdd/TREE.md` - 详细目录结构规范