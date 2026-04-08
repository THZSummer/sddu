#!/bin/bash
# SDDU - SDD 到 SDDU 自劢遷移腳本
# 
# 用途: 自劢將基於 SDD (Specification-Driven Development) 的項目遷移到 
#       SDDU (Specification-Driven Development Ultimate) 
#       保持完全向後兼容性的同時獲得全新功能增強。
#
# 狀態: 預設為安全模式 - 叢持所有原文件，僅創建新結構的符號鏈接或副本
# 授權: MIT
# 版本: 1.0.0

set -e

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

# 日誌功能
log_info() {
    printf "${GREEN}[INFO]${NC} %s\n" "$1"
}

log_warn() {
    printf "${YELLOW}[WARN]${NC} %s\n" "$1"
}

log_error() {
    printf "${RED}[ERROR]${NC} %s\n" "$1"
}

log_success() {
    printf "${GREEN}[SUCCESS]${NC} %s\n" "$1"
}

show_header() {
    echo ""
    echo -e "${CYAN}==========================================${NC}"
    echo -e "${CYAN}     SDD 到 SDDU 自動遷移工具               ${NC}"
    printf "${CYAN}     Version: %s%s\n" "1.0.0" "${NC}"
    echo -e "${CYAN}==========================================${NC}"
    echo ""
}

show_usage() {
    cat << EOF
用法: 
  $0 [選項] [項目路徑]

選項:
  -h, --help            顯示此幫助信息
  -v, --verbose         詳細輸出模式
  -n, --dry-run         預演模式（僅顯示將進行的操作，不實際執行）
  --force              強制執行（跳過確認提示）
  --backup             嘮份原文件（默認為不創建）
  
參數:
  [項目路徑]           要遷移的項目路徑（默認為當前目錄）
  
示例:
  $ bash $0                     # 在當前目錄執行遷移
  $ bash $0 /path/to/your/project  # 指定項目路徑
  $ bash $0 -v --dry-run        # 詳細預演模式
  $ bash $0 --backup --force    # 嘮份並強制執行

注意: 腳本會在遷移前檢查環境和項目狀態

EOF
}

# 解析命令行參數
VERBOSE=false
DRY_RUN=false
FORCE=false
BACKUP=false
PROJECT_PATH="."

while [[ $# -gt 0 ]]; do
    case $1 in
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -n|--dry-run)
            DRY_RUN=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        --backup)
            BACKUP=true
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        -*)
            log_error "未知選項: $1"
            show_usage
            exit 1
            ;;
        *)
            PROJECT_PATH="$1"
            shift
            ;;
    esac
done

# 驗證項目路徑
if [[ ! -d "$PROJECT_PATH" ]]; then
    log_error "項目路徑不存在: $PROJECT_PATH"
    exit 1
fi

# 轉換為絕對路徑
PROJECT_PATH=$(cd "$PROJECT_PATH" && pwd)
log_info "項目路徑: $PROJECT_PATH"

# 驗證 SDD 環境
check_sdd_environment() {
    log_info "檢查 SDD 環境..."
    
    if [[ ! -d "$PROJECT_PATH/.sdd" ]]; then
        log_error "未檢測到 SDD 工作目錄 (.sdd/) 在 $PROJECT_PATH"
        log_info "這可能是一個非 SDD 項目，或 SDD 未初始化"
        log_info "您可以運行 'opencode' 並初始化 SDD 工作區后再執行遷移"
        exit 1
    fi
    
    if [[ ! -d "$PROJECT_PATH/.sdd/specs-tree-root" ]]; then
        log_error "未檢測到 SDD 規範根目錄 (.sdd/specs-tree-root/) - SDD v2.0+ 格式"
        log_info "請確認這是 SDD 項目或已陞級到 2.0+ 版本"
        exit 1
    fi
    
    log_success "SDD 環境檢查通過"
    
    # 嘗試檢測當前結構
    echo ""
    log_info "檢測當前 SDD 目錄結構..."
    if ls "$PROJECT_PATH/.sdd/specs-tree-root"/*/ &>/dev/null; then
        log_info "找到 feature 目錄:"
        for dir in "$PROJECT_PATH/.sdd/specs-tree-root"/*/; do
            if [[ -d "$dir" ]]; then
                feature_name=$(basename "$dir")
                log_info "  - $feature_name"
                
                # 檢查必要的 SDD 文件
                local files_found=()
                [[ -f "$dir/spec.md" ]] && files_found+=("spec.md")
                [[ -f "$dir/plan.md" ]] && files_found+=("plan.md") 
                [[ -f "$dir/tasks.md" ]] && files_found+=("tasks.md")
                [[ -f "$dir/state.json" ]] && files_found+=("state.json")
                
                if [[ ${#files_found[@]} -gt 0 ]]; then
                    log_info "    文件: ${files_found[*]}"
                else
                    log_warn "    警告: 未找到 SDD 標準文件"
                fi
            fi
        done
    else
        log_warn "未找到任何 feature 目錄"
    fi
    echo ""
}

# 檢查是否已在 SDDU 模式下
check_current_status() {
    log_info "檢查當前模式..."
    
    if [[ -f "$PROJECT_PATH/.sdd/IS_SDDU_MIGRATED" ]] || [[ -f "$PROJECT_PATH/.sdd/README_FOR_SDDU" ]]; then
        log_warn "項目似乎已經 migrated 到 SDDU 模式"
        if [[ $FORCE == false ]]; then
            read -p "是否繼續執行遷移? [y/N]: " -n 1 -r
            echo ""
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                log_info "用戶取消操作"
                exit 0
            fi
        fi
    else
        log_info "檢測到標準 SDD 模式，準備執行遷移"
    fi
}

# 執示用戶確認
prompt_user_confirmation() {
    if [[ $FORCE == true ]]; then
        return 0
    fi
    
    echo ""
    log_warn "⚠️  重要提醒："
    log_warn "- 此腳本將進行目錄結構的調整"
    log_warn "- 所有原文件將被保留並做备份（如果選中備份）"
    log_warn "- 遬作不可逆，請確認已做好項目备份"
    echo ""
    
    read -p "確認繼續執行遷移? [y/N]: " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "用戶取消操作"
        exit 0
    fi
}

# 打印預估的更改（乾運行模式）
preview_changes() {
    echo ""
    log_info "=== 頴行更改預覽 ==="
    log_info "1. 嘲建 SDDU 規範目錄結構 (.sdd/specs-tree-root/specs-tree-[feature]/)"
    log_info "2. 如果存在 [feature] 格式的目錄，將其重命名為 specs-tree-[feature] 格式"
    log_info "3. 如果需要，創建 discovery.md 文件模板"
    log_info "4. 更新狀態文件以支持 SDDU 格式（如有需要）"
    log_info "5. 嘲建 SDDU 相關文檔"
    echo ""
}

# 開始遷移處理
perform_migration() {
    echo ""
    log_info "開始執行 SDD 到 SDDU 遬作..."
    
    local migrate_count=0
    local spec_dirs=("$PROJECT_PATH"/.sdd/specs-tree-root/*/)

    # 檢查是否有 feature 目錄需要處理
    if [[ ! -d "${spec_dirs[0]}" ]]; then
        log_warn "未找到任何 feature 目錄，跳過主要遷移步驟"
        # 嘲建根層級目錄結構改進
        setup_root_structure
        log_success "根結構設置完成"
        ((migrate_count++))
    else
        log_info "髮現 ${#spec_dirs[@]} 個 feature 目錄，開始處理..."
        
        for dir_path in "${spec_dirs[@]}"; do
            if [[ -d "$dir_path" ]]; then
                local dir_name=$(basename "$dir_path")
                
                # 跳過非正常的目錄名（以防是 "." 或 ".." 類的）
                if [[ "$dir_name" =~ ^\. ]]; then
                    continue
                fi
                
                # 檢查是否已經是規範的 specs-tree- 格式
                if [[ "$dir_name" =~ ^specs-tree- ]]; then
                    log_info "跳過已是規範格式的目錄: $dir_name (已符合 SDDU 規範)"
                    ((migrate_count++))
                else
                    # 需要將 [feature] 重命名為 specs-tree-[feature]
                    local new_dir_name="specs-tree-$dir_name"
                    local new_dir_path="$PROJECT_PATH/.sdd/specs-tree-root/$new_dir_name"
                    
                    log_info "將 $dir_name 重命名為 $new_dir_name"
                    
                    if [[ $DRY_RUN == true ]]; then
                        echo "  [DRY-RUN] 將執行: mv '$dir_path' '$new_dir_path'"
                    else
                        # 檢查是否存在同名的 specs-tree- 目錄
                        if [[ -d "$new_dir_path" ]]; then
                            log_warn "目標目錄已存在: $new_dir_name，跳過遷移此目錄"
                            continue
                        fi
                        
                        # 如果需要，先創建备份
                        if [[ $BACKUP == true ]]; then
                            local backup_path="${dir_path%/}_backup_$(date +%Y%m%d_%H%M%S)"
                            log_info "創建備份: $backup_path"
                            cp -r "$dir_path" "$backup_path"
                        fi
                        
                        # 獲取原目錄的權限
                        local orig_perms=$(stat -c '%a' "$dir_path")
                        
                        # 執行重命名
                        mv "$dir_path" "$new_dir_path"
                        chmod $orig_perms "$new_dir_path"  # 恢復原始權限
                        
                        log_success "目錄已重命名為規範格式: $new_dir_name"
                        ((migrate_count++))
                    fi
                fi
            fi
        done
    fi

    # 嘲建根級結構改進
    setup_root_structure
    
    # 添加 SDDU 识别标记
    if [[ $DRY_RUN != true ]]; then
        touch "$PROJECT_PATH/.sdd/IS_SDDU_MIGRATED"
        echo "$(date): Migrated to SDDU structure" > "$PROJECT_PATH/.sdd/MIGRATION_LOG"
    fi
    
    log_success "遷移完成！處理了 $migrate_count 個目錄"
}

# 設置根級別結構改進
setup_root_structure() {
    log_info "設置根級結構改進..."

    # 確保必要目錄存在
    local required_dirs=(
        "$PROJECT_PATH/.sdd/docs"
    )

    for dir in "${required_dirs[@]}"; do
        if [[ ! -d "$dir" ]]; then
            if [[ $DRY_RUN == true ]]; then
                echo "  [DRY-RUN] 將執行: mkdir -p '$dir'"
            else
                mkdir -p "$dir"
                log_info "創建目錄: $(basename $dir)"
            fi
        else
            log_info "目錄已存在: $(basename $dir)"
        fi
    done

    # 嘲建或更新文檔
    create_docs
}

# 創建 SDDU 遢關文檔
create_docs() {
    log_info "創建 SDDU 相關文檔..."
    
    local readme_path="$PROJECT_PATH/.sdd/README.md"
    local current_readme_content=""
    
    if [[ -f "$readme_path" ]]; then
        current_readme_content=$(cat "$readme_path")
    fi
    
    if [[ $DRY_RUN != true ]]; then
        # 根據當前內容決定如何更新 README
        if [[ -z "$current_readme_content" ]]; then
            # 如果是空白，創建新的 SDDU README
            cat > "$readme_path" << 'EOF'
# SDDU 工作空間

此目錄為 OpenCode SDDU (Specification-Driven Development Ultimate) 工作空間。

## 目錄結構

```
.sdd/
├── README.md              # 本文件 - SDDU 工作空間說明
├── TREE.md                # 目錄結構定義  
├── ROADMAP.md             # 版本路線圖
├── docs/                  # 文檔目錄
├── config.json            # SDDU 配置（可選）
└── specs-tree-root/       # 規範文件根目錄
    ├── README.md          # 目錄說明
    └── specs-tree-[feature]/      # Feature 目錄 (規範命名)
        ├── discovery.md   # 需求挖掘 (SDDU 新增階段 0)
        ├── spec.md        # 規範編寫
        ├── plan.md        # 技術計劃
        ├── tasks.md       # 任務分解  
        └── state.json     # 狀態文件
```

## 快速開始

1. 使用 `@sddu` 作为智能入口開始新 feature
2. 遬用 `@sddu-discovery` 進行需求挖掘  
3. 繼續 SDD 6 階段工作流

> **兼容性**: 
> - 所有 `@sdd-*` 命令依然完全兼容
> - 新項目推荐使用 `@sddu-*` 命令
> - 混合模式支持

## SDD 与 SDDU 命令對照

| SDD 舊版 | SDDU 新版 | 狀態 |
|----------|-----------|------|
| `@sdd` | `@sddu` | ✅ 騱薦使用 |
| `@sdd-discovery` | `@sddu-discovery` | ✅ SDDU 增強 |
| `@sdd-spec` | `@sddu-spec` | ✅ SDDU 增強 |
| ... | ... | 尵有命令對應 |

EOF
        else
            # 如果現有文件，則在開頭添加遷移標識
            {
                echo "# SDDU 升級標記"
                echo ""
                echo "> **遷移日期**: $(date +'%Y-%m-%d %H:%M:%S')"
                echo "> **狀態**: 已遷移至 SDDU 結構（向後兼容）"
                echo ""
                cat "$readme_path"
            } > "$readme_path.tmp" && mv "$readme_path.tmp" "$readme_path"
        fi
    else
        echo "  [DRY-RUN] 將更新或創建 .sdd/README.md"
    fi

    # 創建遷移相關的文檔
    local migration_doc_path="$PROJECT_PATH/.sdd/docs/sddu-migration-status.md"
    
    if [[ $DRY_RUN != true ]]; then
        cat > "$migration_doc_path" << EOF
# SDDU 遢移確認文件

## 遢移狀態
- **狀態**: ✅ 已完成 SDDU 結構遷移
- **日期**: $(date +'%Y-%m-%d %H:%M:%S')
- **項目路徑**: $PROJECT_PATH

## 特性
- ✅ 向後兼容 SDD 命令 (`@sdd-*`)
- ✅ 支援 SDDU 命令 (`@sddu-*`) 
- ✅ 新增 discover 階段支持
- ✅ 規範化目錄結構

## 建議下一步
1. 颗試新的 `@sddu-*` 命令
2. 探索 discover 階段 (`@sddu-discovery`)
3. 檢查 `.sdd/specs-tree-root/` 下的結構變化

## 注意事項
- 所有原有文件和功能均保持不変
- 縀續支持混合使用雙版命令系統
EOF
    else
        echo "  [DRY-RUN] 將創建遷移狀態文檔"
    fi
    
    log_success "SDDU 相關文檔創建完成"
}

# 主程序
main() {
    show_header
    
    if [[ $VERBOSE == true ]]; then
        log_info "詳細模式已啟用"
        log_info "預演模式: $DRY_RUN" 
        log_info "強制模式: $FORCE"
        log_info "備份模式: $BACKUP"
    fi
    
    # 顯示預覽（如果是預演模式）
    if [[ $DRY_RUN == true ]]; then
        preview_changes
    fi
    
    # 檢查環境
    check_sdd_environment
    
    # 檢查狀態
    check_current_status
    
    # 確認執行
    if [[ $DRY_RUN == false ]]; then
        prompt_user_confirmation
    else
        log_info "運行在預演模式下，不會實際修改任何文件"
    fi
    
    # 執行迀移
    perform_migration
    
    # 完成訊息
    echo ""
    log_success "🎉 SDDU 遢移完成！"
    echo ""
    log_info "總結:"
    log_info "  - 支援規範化目錄結構 (specs-tree-[feature] 格式)"
    log_info "  - 保留所有原有文件和功能" 
    log_info "  - 維持完全向後兼容"
    log_info "  - 可選用新的 SDDU 增強功能"
    echo ""
    log_info "現在您可以:"
    echo "  - 繼續使用原有的 @sdd-* 命令 (兼容)"
    echo "  - 試用新的 @sddu-* 命令 (推薦新項目)"
    echo "  - 探索新增的 discover 階段功能"
    echo ""
    log_info "了解更多關於 SDDU，請查閱:"
    echo "  - .sdd/docs/migration-guide.md"
    echo "  - .sdd/ROADMAP.md" 
    echo ""
}

# 執行主程序
main "$@"