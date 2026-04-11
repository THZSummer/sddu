# SDDU 容器化與目錄結構 FAQ

> **文档版本**: SDDU-CONTAINER-FAQ-1.0  
> **更新日期**: 2026-04-06  
> **状态**: 已发布

---

## 🎯 FAQ 概览

这份 FAQ 专门回答关于 SDDU 容器化目录结构和项目组织的相关问题。包括关于 SDD 到 SDDU 变迁的信息。

---

## 1. 關於目錄結構

### Q1: 什麽是 SDDU 容器化目錄結構？跟原來有什麽區別？
**A**: SDDU 容器化目錄結構是一種規範化的項目組織結構，主要特點是在原有 SDD 基礎上增加了更好的組織性和擴展性：

**SDD 原始結構 **(依然兼容)
```
.sdd/
├── README.md
├── TREE.md  
├── ROADMAP.md  
└── specs-tree-root/
    ├── [feature-name]/
    │   ├── spec.md
    │   ├── plan.md
    │   ├── tasks.md
    │   └── state.json
    └── ...
```

**SDDU 增強結構 **(推薦)
```
.sdd/                     # SDD/SDDU 工作空間容器
├── README.md             # 工作空間說明
├── TREE.md               # 目錄結構定義
├── ROADMAP.md            # 版本路線圖
├── docs/                 # 工具文檔目錄
├── specs-tree-root/      # 規範文件根  
│   ├── README.md         # specs-tree-root 目錄說明
│   ├── state.json        # 全局狀態文件
│   ├── specs-tree-master-plan/  # 主計劃 specs 目錄
│   │   ├── spec.md       # 需求規格
│   │   ├── plan.md       # 技術計劃
│   │   ├── tasks.md      # 任務分解
│   │   ├── discovery.md  # SDDU 需求挖掘階段 (新增)
│   │   └── state.json    # feature 狀態
│   └── specs-tree-[other-feature]/  # 其他 feature specs 目錄
│       ├── ...
│       └── state.json    # 每個 specs 目錄內含獨立狀態文件
└── templates/            # 狀態模板和生成工具 (可選)
```

**SDDU 的主要増益**:
- 更好的項⺫組織和邊界定義
- 支持多層嵌套和複雜功能模塊
- 增強的 discover 階段支持
- 統一的狀態管理模式
- 向後兼容原始 SDD 結構

### Q2: 我的現有 `.sdd/` 結構需要遷移到 `.sddu/` 嗎？
**A**: 
- **不需要遷移到 `sddu/` 目錄**：`.sdd/` 和 `.sddu/` 是兩種不同的概念
- **SDD 依然在 `.sdd/` 目錄下工作**，但現在支持 SDDU 的容器化結構
- **SDDU 還支持在 `.sdd/` 目錄下使用新的規範化結構**
- **您現有的 `.sdd/specs-tree-root/` 結構繼續完全兼容**

### Q3: specs-tree-xxxx 的命名規范什麽？
**A**: 針對 specs-tree- 目錄的命名規范：

**SDDU 推薦命名**:
- ✅ `specs-tree-my-awesome-feature` - kebab-case 小寫連字符
- ✅ `specs-tree-user-authentication` - 數據模型
- ✅ `specs-tree-api-integration`  - 功能模塊
- ✅ `specs-tree-data-migration`  - 遞程
- ❌ `my-awesome-feature` - 缺少前綴
- ❌ `SpecsTreeMyFeature` - 駋式不一致
- ❌ `SPEC-TREE-UPPERCASE` - 建議全部小寫

**原因**:
- 遞于前綴 `specs-tree-` 確保目錄識別性  
- kebab-case 與前端/項⺫命名習慣保持一致
- 說義名稱更有助於理解功能意圖

---

## 2. 關於 SDD 到 SDDU 遞遷

### Q4: 我現有項目的目錄結構會自動升級到 SDDU 標準嗎？
**A**: 不會自動升級，但您有幾種選擇：

**選項 1**: 保持現有結構（推荐現有項目）
- 繼續在 `.sdd/specs-tree-root/[feature-name]/` 下工作
- 所有現有腳本和鏈接繼續工作
- 完全向後兼容

**選項 2**: 自主遷移到規範結構
- 將現有 feature 遞移到 `specs-tree-root/specs-tree-[feature-name]/` 格式
- 增加新的狀態和發現文件
- 使用更標準化的目錄結構

**選項 3**: 新項目使用 SDDU 標準
- 直接遵循規範結構創建新 feature
- 體驗增強的組織和導航能力

### Q5: 新舊目錄結構可以並存麽？
**A**: 
✅ **完全可以**！SDDU 設計支持新舊目錄結構同時存在：
- 您可以同時擁有 `.sdd/specs-tree-root/` (傳統 SDD) 和規範結構 (SDDU)
- 同一個 `.sdd/specs-tree-root/` 可能混合包含傳統 [feature] 和規範 specs-tree-[feature] 的 feature
- 工具能正確識別和處理兩種結構

### Q6: 如果我在一個目錄下混合使用兩種結構會有什麼問題？
**A**: 混合使用結構時通常沒問題，因爲：
- 吝方系統獨立管理各自的狀態文件
- 每個 feature 目錄內部結構保持一致即可
- 系統不會干預不同 feature 目錄的結構差異

但建議在一個 feature 內部保持結構一致。

---

## 3. 關於狀態管理

### Q7: SDDU 新增了全局 state.json，它與各個 feature 關聯的 state.json 關係？
**A**: SDDU 狀態管理體系的關係：

**state 文件層次**:
- **全局狀態文件** (.sdd/specs-tree-root/state.json): 追蹤所有 features 整體狀態
- **feature 狀態文件** (.sdd/specs-tree-root/specs-tree-xxx/state.json): 追蹤單一 feature 狀態

**SDDU 新增特性**:
- **全局狀態追蹤**：可一覽所有 feature 開發進度
- **跨 feature 依賴關係**：識別不同 feature 之閙的依賴
- **整體進度管理**：多 feature 項目的整體調度支持

**SDDU 兼容保證**:
- 原有 feature state.json 結構保持不変  
- 新增可選字段不破壞現有功能
- 老項目可無縫繼續使用

### Q8: 原來我的 state.json 放在 specs-tree-root 根下，現在會怎樣？
**A**: 原有的根目錄 `state.json` 將被自動識別為全局狀態文件，兼容性保證：
- 舊格式的狀態文件繼續可讀
- 新增字段會自動追加（不影響現有數據）
- 提供狀態文件結構升級工具

---

## 4. 關於 Discovery 階段

### Q9: SDDU 加了 discovery.md 文件，它是什麽？必須要的麽？
**A**: 

**discovery.md 是什麽**:
- **階段 0** 文件，在規範階段之前
- **深度需求挖掘** 和用戶研究的輸出
- **解決方案探索** 和架構思路的文檔化

**SDDU 鼓勵但不要求必填**:
- ✅ **推薦使用**：新的項目或複雜需求
- ✅ **可選使用**：簡單功能或已有明確需求
- ✅ **後綴補充**：現有 feature 可以後綴添加 discovery 文件
- ✅ **兼容模式**：不包含 discovery 的項目依然完全工作

**與 SDD 的兼容**:
- 原有無 discovery 的項目照常工作
- `@sdd-*` 命令兼容 discovery 階段
- `@sddu-*` 提供 enhanced discovery 功能

### Q10: discovery.md 與 spec.md 有什麽區別和關係？
**A**: 

| 階段 | 文件 | 範疇 | 重點 | 目標 |
|------|------|------|------|------|
| 0 | discovery.md | 需求探索 | 用戶真實需求、使用情況、邊界條件 | 挖掘真正要解決的問題 |
| 1 | spec.md | 規範定義 | 功能需求、性能需求、架構約束 | 定義解決方案的規格 |

**關係**:
- discovery 是 spec 的前置階段，提供了 spec 的需求來源
- discovery 成果作為 spec 的輸入
- 兩者結合提供更完整的需求鏈路

---

## 5. 關於命令和工具有關

### Q11: `@sdd` 會識別新的目錄結構麽？`@sddu` 呢？
**A**: 

**@sdd 的行為**:
- ✅ 完全向下兼容  
- ✅ 自動識別所有 SDD 和 SDDU 目錄結構  
- ✅ 能在任何目錄結構中正確工作
- ✅ 遞持與原 SDD 工具完全一致的行為

**@sddu 的行為**:
- ✅ 同樣兼容所有目錄結構
- ✅ 提供對規範結構更好的導航和支持
- ✅ 對推薦的最佳實踐提供增強功能  
- ✅ 支援發現階段等功能（如果有 discovery file）

### Q12: 我如何知道當前命令在處理哪種結構？
**A**: 您可在工具輸出中查看以下信息：
- 版本前綴：顯示"SDDU 模式"或"SDD 兼容模式"
- 文件檢測：命令輸出會顯示檢測到的結構
- 目錄創建：創建過程會顯示所採用的結構模式

### Q13: 如何為新項目選擇目錄結構？
**A**: 
- **新創建項目**: 推薦使用 SDDU 規範結構，獲得完整最佳實踐支持
- **現有擴展**: 使用原來相同結構保持一致性  
- **團隊統一**: 向團隊標準和習慣選取一致的風格

---

## 6. 故障排除和常見問題

### Q14: 為什麽我的工具突然顯示找不到 state.json？
**A**: 
可能原因:
1. 目錄結構發生了變化
2. 文件在遷移過程中被誤刪或路徑錯誤
3. 需要用新命令更新狀態文件
4. 全局或 feature 狀態文件路徑識別問題

解決建議:  
- 確認當前所在 `.sdd/specs-tree-root/` 目錄結構
- 檢查工具是否有 "sdd init" 類似的命令初始化狀態文件
- 確認文件命名和路徑正確
- 參考使用 `@sddu help` 獲取具體目錄和文件定位說明

### Q15: 我的脚本鏈接到了舊路徑，現在失效了怎麽辦？
**A**: 
- 如果腳本鏈接在 `.sdd/specs-tree-root/[feature-name]/` 使用：
  - 保持兼容但建議更新到新的 `specs-tree-[feature-name]/` 路徑  
  - 可以建立符號鏈接保持向後兼容
  
- 使用腳本升級工具或：
  ```bash
  # 示例：更新腳本中的路徑引用  
  sed -i 's|sdd/specs-tree-root/|sdd/specs-tree-root/specs-tree-|g' your-script.sh
  ```

### Q16: 如何檢查我的目錄結構是否符合 SDDU 標準？
**A**: 
您可以使用以下方式檢查：
- **命令檢查**: 遗用 `@sddu check` 或 `@sdd check` 工具（如果提供）
- **結構驗證**: 確認是否遵循上述 SDDU 推薦結構
- **文件完整性**: 驗認每個規範 feature 目錄包含必需文件 (spec.md, plan.md, state.json 等)
- **狀態一致性**: 檢查狀態文件是否與實際結構同步

---

## 7. 最佳實踐

### Q17: SDDU 推薦的最佳目錄結構是什麽？
**A**: 
**完整的 SDDU 結構範例**:
```
.sdd/
├── README.md                           # 工作空間說明
├── TREE.md                             # 目錄結構定義  
├── ROADMAP.md                          # 版本路線圖
├── docs/                               
│   ├── migration-guide.md              # 遞移指南
│   └── faq.md                          # 這份faq
├── specs-tree-root/                    # 規範文件根
│   ├── README.md                       # specs-tree-root 說明
│   ├── state.json                      # 全局狀態文件
│   ├── specs-tree-user-management/     # 規範結構 feature
│   │   ├── discovery.md                # 需求挖掘階段
│   │   ├── spec.md                     # 規範定義階段
│   │   ├── plan.md                     # 技術計劃階段  
│   │   ├── tasks.md                    # 任務分解階段
│   │   └── state.json                  # 單 feature 狀態
│   └── specs-tree-payment-integration/ # 規範結構 feature
│       ├── ...
│       └── state.json
└── ...
```

這一結構提供了良好的組織性、擴展性和可維護性。

---

## 💡 提示和建議

1. **循序漸進**：不強制所有項目立即遷移  
2. **一致性優先**：在同一個項目內使用統一的結構風格
3. **文檔記錄**：保留目錄結構決策的歷史記錄
4. **工具支持**：利用新命令獲得結構支持和驗證

---

**最後更新**: 2026-04-06  
**下一次更新預計**: 將根據社區反饋和產品開發進行  
**相關文件**: 
- 《遷移指南》(.sdd/docs/migration-guide.md)  
- 《版本路線圖》(.sdd/ROADMAP.md)
- 《SDDU 命令手冊》(參見 help 命令)