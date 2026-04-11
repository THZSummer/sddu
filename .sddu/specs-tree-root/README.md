# SDDU 规范目录 (已迁移到 SDDU 结构)

## 目录结构

```
.sddu/specs-tree-root/
├── README.md                                 # 本说明文件
├── state.json                                # 全局状态文件  
├── specs-tree-[feature-name]/              # 标准化 Feature 目录 (SDDU 推荐)
│   ├── discovery.md                         # 需求挖掘 (SDDU 阶段 0/7)
│   ├── spec.md                             # 规范文档
│   ├── plan.md                             # 技术计划  
│   ├── tasks.md                            # 任务分解
│   ├── build.md                            # 任务实现 (阶段 4/7)
│   ├── review.md                           # 代码审查 (阶段 5/7) 
│   ├── validate.md                         # 验证文档 (阶段 6/7)
│   └── state.json                          # 单 feature 状态
└── [legacy-feature-name]/                 # 旧结构目录 (向后兼容)
    ├── spec.md
    ├── plan.md
    ├── tasks.md
    └── state.json
```

## SDD 到 SDDU 目录规范

### 推荐的 SDDU 结构
**目录格式**: `specs-tree-[feature-name]`
- ✅ **明确标识**: "specs-tree-" 前缀明确表示规范目录
- ✅ **标准命名**: 规范的 kebab-case 命名方式
- ✅ **工具友好**: 便于 IDE/工具 识别和索引
- ✅ **防冲突**: 防止与代码目录或其他类型目录混淆

**示例**:
- ✅ `specs-tree-user-authentication` - 用户认证功能规范
- ✅ `specs-tree-api-integration` - API 集成功能规范
- ✅ `specs-tree-payment-flow` - 支付流程功能规范

### 兼容的旧结构 
**目录格式**: `[feature-name]` (无前缀)
- ✅ **完全兼容**: SDDU 完全支持原有结构
- ✅ **无缝工作**: 所有旧功能继续正常运作
- 🔄 **渐进迁移**: 可逐步更新到新命名标准

## 规范目录导航

### 架构目录
| 目录 | 说明 |
|------|------|
| [architecture/](./architecture/README.md) | 架构决策记录目录 |
| [architecture/adr/](./architecture/adr/README.md) | ADR 文档集合 (ADR-001 ~ ADR-014) |

### 已完成 Feature 目录（11 个）

| 目录 | 说明 | 状态 |
|------|------|------|
| [specs-tree-plugin-rename-sddu/](./specs-tree-plugin-rename-sddu/README.md) | 插件改名 SDDU V1 | ✅ completed.legendary.sealed |
| [specs-tree-plugin-rename-sddu-v2/](./specs-tree-plugin-rename-sddu-v2/README.md) | 插件改名 SDDU V2 - 代码清理 | ✅ validated |
| [specs-tree-sdd-discovery-feature/](./specs-tree-sdd-discovery-feature/README.md) | Discovery 需求挖掘功能 | ✅ validated |
| [specs-tree-directory-optimization/](./specs-tree-directory-optimization/README.md) | 目录结构优化 | ✅ validated |
| [specs-tree-sdd-multi-module/](./specs-tree-sdd-multi-module/README.md) | 子 Feature 并行开发支持 | ✅ validated |
| [specs-tree-sdd-tools-optimization/](./specs-tree-sdd-tools-optimization/README.md) | 工具系统优化 | ✅ validated |
| [specs-tree-deprecate-sdd-tools/](./specs-tree-deprecate-sdd-tools/README.md) | 废弃旧工具 | ✅ validated |
| [specs-tree-sdd-workflow-state-optimization/](./specs-tree-sdd-workflow-state-optimization/README.md) | 工作流状态优化 | ✅ validated |
| [specs-tree-sdd-plugin-roadmap/](./specs-tree-sdd-plugin-roadmap/README.md) | Roadmap 规划专家 | ✅ validated |
| [specs-tree-sdd-plugin-baseline/](./specs-tree-sdd-plugin-baseline/README.md) | 插件基线建立 | ✅ completed |
| [architecture/](./architecture/README.md) | 架构决策记录目录 | ✅ active |

## 规范文件说明

### SDDU 7 阶段完整工作流
```
阶段 0: discovery.md → 阶段 1: spec.md → 阶段 2: plan.md → 阶段 3: tasks.md → 
阶段 4: build.md → 阶段 5: review.md → 阶段 6: validate.md
```

1. **discovery.md** (SDDU 推荐): 需求挖掘 - 深入理解用户需求 (SDDU 特有阶段)
2. **spec.md**: 需求规范 - 全面的 功能、性能、约束 描述  
3. **plan.md**: 技术计划 - 架构设计、实现方案、风险评估
4. **tasks.md**: 任务分解 - 具体的开发任务列表
5. **build.md**: 任务实现 - 代码实现、测试编写
6. **review.md**: 代码审查 - 质量审查、最佳实践检讨
7. **validate.md**: 功能验证 - 验证与需求的对齐

### 状态文件 (state.json)

每个 specs 目录都需要一个 `state.json` 文件来记录该功能的开发状态

**全局状态文件** (`specs-tree-root/state.json`)：
- 追踪所有 specs 的整体进度
- 记录全局依赖关系

**单个 specs 状态文件** (`specs-tree-[feature]/state.json`)：
- 追踪单一 specs 的当前状态  
- 阶段进度和完成情况

## SDD 与 SDDU 兼容性说明

### 命令兼容性
- ✅ `@sdd-xxx` - 旧版命令继续工作 (完全兼容)
- ✅ `@sddu-xxx` - 新版命令（推荐新项目）  
- 🔁 **混合使用**: 可在同一项目中混合使用两种命令

### 目录访问
- SDD 和 SDDU 工具均能识别两种目录结构
- 文件读取和写入逻辑保持一致
- 保持跨工具互操作性

## 最佳实践 (SDDU)

1. **新 spec 创建**: 使用 `specs-tree-[feature-name]` 格式
2. **使用发现阶段**: 在 spec 阶段前先使用 `discovery.md`
3. **更新状态文件**: 阶段变更时同步更新对应 `state.json`
4. **保持文档一致性**: 确保各阶段文档内容连贯

## 迁移指南

**现有项目**: 无需更改，继续正常工作  
**新项目**: 推荐使用新的 `specs-tree-[feature]` 命名方式  
**混合模式**: 支持新旧目录并存于同一项目

> **迁移脚本**: 使用 `scripts/migrate-sdd-to-sddu.sh` 可自动完成目录结构迁移

## 文档资源

- 🚀 **命令参考**: 查看 `@sdd-help` 或 `@sddu-help` 
- 📝 **迁移指南**: `.sddu/docs/migration-guide.md`
- ❓ **FAQ**: `.sddu/docs/faq.md`
- 👨‍💻 **进阶用法**: 查看 `.sddu/ROADMAP.md` 了解详细规划
