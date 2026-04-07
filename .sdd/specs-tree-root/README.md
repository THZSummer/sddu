# SDD/SDDU 规范目录 (已迁移到 SDDU 结构)

## 目录结构

```
.sdd/specs-tree-root/
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
└── [legacy-feature-name]/                 # 遞旧结构目录 (向后兼容)
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
- ✅ **防衝突**: 防止与代码目录或其他类型目录混淆

**示例**:
- ✅ `specs-tree-user-authentication` - 用户认证功能规范
- ✅ `specs-tree-api-integration` - API 集成功能规范
- ✅ `specs-tree-payment-flow` - 支付流程功能规范

### 兼容的旧结构 
**目录格式**: `[feature-name]` (无前缀)
- ✅ **完全兼容**: SDDU 完全支持原有结构
- ✅ **无缝工作**: 所有旧功能继续正常运作
- 🔄 **渐进迁移**: 可逐步更新到新命名标准

## 规范文件说明

### SDDU 7 阶段完整工作流
```
阶段 0: discovery.md → 阶段 1: spec.md → 阶段 2: plan.md → 阶段 3: tasks.md → 
阶段 4: build.md → 阶段 5: review.md → 阶段 6: validate.md
```

1. **discovery.md** (SDDU 推荐): 需求挖掘 - 深入理解用户需求 (SDDU 特有阶段)
2. **spec.md**: 需求规范 - 全面的 功能、性能、约束 描述  
3. **plan.md**: 技术计划 - 架構設計、實現方案、風險評估
4. **tasks.md**: 任务分解 - 具体的开发任务列表
5. **build.md**: 任务实现 - 代碼實現、測試編寫
6. **review.md**: 代码审查 - 質量審查、最佳實踐檢討
7. **validate.md**: 功能验证 - 驗保與需求的對齊

### 状态文件 (state.json)

每个 specs 目录都需要一个 `state.json` 文件來記錄該功能的開發狀態

**全域状态文件** (`specs-tree-root/state.json`)：
- 追蹤所有 specs 的整體進度
- 记錄全局依賴關係

**単 specs 狀態文件** (`specs-tree-[feature]/state.json`)：
- 追蹤単一 specs 的當前狀態  
- 階段進度和完成情況

## SDD 与 SDDU 兼容性说明

### 命令兼容性
- ✅ `@sdd-xxx` - 舊版命令继续工作 (完全兼容)
- ✅ `@sddu-xxx` - 新版命令（推荐新项目）  
- 🔁 **混合使用**: 可在同一项目中混合使用兩种命令

### 目錄訪問
- SDD 和 SDDU 工具均能識別兩種目錄結構
- 文件讀取和寫入邏輯保持一致
- 保持跨工具互操作性

## 最佳实践 (SDDU)

1. **新 spec 創建**: 使用 `specs-tree-[feature-name]` 格式
2. **使用發現階段**: 在 spec 階段前列使用 `discovery.md`
3. **更新狀態文件**: 階段變更時同步更新對應 `state.json`
4. **保持文檔一致性**: 確保各階段文檔內容連貫

## 迁移指南

**現有項目**: 無需更改，繼續正常工作  
**新項目**: 排薦使用新的 `specs-tree-[feature]` 命名方式  
**混合模式**: 支援新舊目錄並存於同一項目

> **遷移脚本**: 使用 `scripts/migrate-sdd-to-sddu.sh` 可自動完成目錄結構遷移

## 文檔資源

- 🚀 **命令參考**: 查看 `@sdd-help` 或 `@sddu-help` 
- 📝 **遷移指南**: `.sdd/docs/migration-guide.md`
- ❓ **FAQ**: `.sdd/docs/faq.md`
- 👨‍💻 **進階用法**: 查看 `.sdd/ROADMAP.md` 了解詳細規劃