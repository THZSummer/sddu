#!/usr/bin/env bash
# SDDU 测试验证报告生成器
#
# 用途:
# - 自动化检测各阶段输出文件的完整性
# - 生成测试状态和验证报告
# - 检查生成的工作文件并验证状态

check_file_exists() {
    local file="$1"
    local name="$2"
    
    if [ -f "$file" ]; then
        local size=$(stat -c%s "$file" 2>/dev/null || echo 0)
        echo "- ✅ $name: 存在 ($size 字节)"
    else
        local dir_part=$(dirname "$file")
        if [ -d "$dir_part" ]; then
            # Directory exists but file doesn't
            echo "- ❌ $name: 不存在 (目录路径存在)"
        else
            # Directory also doesn't exist
            echo "- ❌ $name: 不存在 (路径不存在)"
        fi
    fi
}

# 计算目录中文件数量
count_files_in_dir() {
    local dir="$1"
    local pattern="$2" 
    local display_name="$3"
    
    if [ -d "$dir" ]; then
        local count=$(find "$dir" -type f -name "$pattern" 2>/dev/null | wc -l)
        if [ $count -gt 0 ]; then
            echo "- ✅ $display_name: $count 个"
        else
            echo "- ⚠️ $display_name: 0 个 (目录存在但无匹配文件)"
        fi
    else
        echo "- ❌ $display_name: 目录不存在"
    fi
}

# 生成验证总结统计
generate_verification_summary() {
    local project_dir="$1"
    local project_name="$2"
    
    # 检查核心 SDDU 文件
    local phases_completed=0
    
    # 检查主要阶段文件
    [ -f "$project_dir/.sdd/specs-tree-root/$project_name/discovery.md" ] && ((phases_completed++))
    [ -f "$project_dir/.sdd/specs-tree-root/$project_name/spec.md" ] && ((phases_completed++))
    [ -f "$project_dir/.sdd/specs-tree-root/$project_name/plan.md" ] && ((phases_completed++))
    [ -f "$project_dir/.sdd/specs-tree-root/$project_name/tasks.md" ] && ((phases_completed++))
    [ -f "$project_dir/.sdd/specs-tree-root/$project_name/review.md" ] && ((phases_completed++))
    [ -f "$project_dir/.sdd/specs-tree-root/$project_name/validation.md" ] && ((phases_completed++))
    
    # 检查核心配置文件
    local core_completed=0
    [ -f "$project_dir/.sdd/state.json" ] && ((core_completed++))
    [ -f "$project_dir/opencode.json" ] && ((core_completed++))
    
    local total_core=8
    local total_complete=$((phases_completed + core_completed))
    local percentage=$((total_complete * 100 / total_core))
    
    cat << EOF
### 📊 验证摘要
- **完成的开发阶段**: $phases_completed/6 ($(expr $phases_completed '*' 100 / 6))%
- **核心配置文件**: $core_completed/2 ($(expr $core_completed '*' 100 / 2))%
EOF
    
    if [ $percentage -ge 90 ]; then
        echo "- **总体状态**: ✅ $total_complete/$total_core ($percentage)% - 极佳"
    elif [ $percentage -ge 75 ]; then
        echo "- **总体状态**: ✅ $total_complete/$total_core ($percentage)% - 良好"
    elif [ $percentage -ge 50 ]; then
        echo "- **总体状态**: 🟡 $total_complete/$total_core ($percentage)% - 一般"
    elif [ $percentage -ge 25 ]; then
        echo "- **总体状态**: 🟡 $total_complete/$total_core ($percentage)% - 部分完成"
    else
        echo "- **总体状态**: ❌ $total_complete/$total_core ($percentage)% - 不完整"
    fi
}

# 检查必需的系统文件
check_required_files() {
    local project_dir="$1"
    
    echo "- **包管理文件**: [$(check_sys_file_exists "$project_dir/package.json") $(check_sys_file_exists "$project_dir/tsconfig.json") $(check_sys_file_exists "$project_dir/README.md")]"
    echo "- **SDDU 工作目录**: [$(check_sys_file_exists "$project_dir/.sdd") $(check_sys_file_exists "$project_dir/.opencode")]"
}

check_sys_file_exists() {
    local file="$1"
    if [ -e "$file" ]; then
        echo "✅"
    else
        echo "❌"
    fi
}

# 主函数
generate_validation_report() {
    local project_dir="$1"
    local project_name="$2"
    
    if [ ! -d "$project_dir" ]; then
        echo "错误: 项目目录不存在 - $project_dir"
        return 1
    fi
    
    cat << EOF
# SDDU 测试验证报告
## 项目信息
- **项目名称**: $project_name
- **测试目录**: $project_dir
- **验证时间**: $(date '+%Y-%m-%d %H:%M:%S')

## 文件存在性验证

### Phase 0: Discovery
$(check_file_exists "$project_dir/.sdd/specs-tree-root/$project_name/discovery.md" "discovery.md")

### Phase 1: Spec  
$(check_file_exists "$project_dir/.sdd/specs-tree-root/$project_name/spec.md" "spec.md")

### Phase 2: Plan
$(check_file_exists "$project_dir/.sdd/specs-tree-root/$project_name/plan.md" "plan.md")
$(count_files_in_dir "$project_dir/.sdd/specs-tree-root/$project_name/decisions" "decision" "decisions")

### Phase 3: Tasks
$(check_file_exists "$project_dir/.sdd/specs-tree-root/$project_name/tasks.md" "tasks.md")

### Phase 4: Build (Implementation)
$(count_files_in_dir "$project_dir/src" "*.ts" "TypeScript源文件")
$(count_files_in_dir "$project_dir/src" "*.js" "JavaScript源文件")
$(count_files_in_dir "$project_dir/test" "*.test.*" "测试文件")
$(count_files_in_dir "$project_dir/tests" "*.test.*" "测试文件")
$(count_files_in_dir "$project_dir/__tests__" "*.test.*" "测试文件")

### Phase 5: Review
$(check_file_exists "$project_dir/.sdd/specs-tree-root/$project_name/review.md" "review.md")

### Phase 6: Validate
$(check_file_exists "$project_dir/.sdd/specs-tree-root/$project_name/validation.md" "validation.md")  

## 状态验证

### State 文件检查
$(check_file_exists "$project_dir/.sdd/state.json" "state.json")

### Opencode 配置验证
$(check_file_exists "$project_dir/opencode.json" "opencode.json")

## 验证总结
$(generate_verification_summary "$project_dir" "$project_name")

## 系统完整性检查
$(check_required_files "$project_dir")
EOF
}

# 如果直接调用此脚本，则执行验证
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    if [ -z "$1" ] || [ -z "$2" ]; then
        echo "使用方法: $0 <project_directory> <project_name>"
        exit 1
    fi
    
    generate_validation_report "$1" "$2"
    exit 0
fi
    
    echo "# SDDU 测试验证报告
## 项目信息
- **项目名称**: $project_name
- **测试目录**: $project_dir
- **验证时间**: $(date '+%Y-%m-%d %H:%M:%S')

## 文件存在性验证

### Phase 0: Discovery
$(check_file_exists \"$project_dir/.sdd/specs-tree-root/$project_name/discovery.md\" \"discovery.md\")

### Phase 1: Spec  
$(check_file_exists \"$project_dir/.sdd/specs-tree-root/$project_name/spec.md\" \"spec.md\")

### Phase 2: Plan
$(check_file_exists \"$project_dir/.sdd/specs-tree-root/$project_name/plan.md\" \"plan.md\")
$(count_files_in_dir \"$project_dir/.sdd/specs-tree-root/$project_name/decisions\" \"decision\" \"decisions\")

### Phase 3: Tasks
$(check_file_exists \"$project_dir/.sdd/specs-tree-root/$project_name/tasks.md\" \"tasks.md\")

### Phase 4: Build (Implementation)
$(count_files_in_dir \"$project_dir/src\" \"source file\" \"source files\" \"false\")
$(count_files_in_dir \"$project_dir/test\" \"*.test.*\" \"tests\" \"false\")
$(count_files_in_dir \"$project_dir/__tests__\" \"*.test.*\" \"tests\" \"false\")
$(count_files_in_dir \"$project_dir/tests\" \"*.test.*\" \"tests\" \"false\")

### Phase 5: Review
$(check_file_exists \"$project_dir/.sdd/specs-tree-root/$project_name/review.md\" \"review.md\")

### Phase 6: Validate
$(check_file_exists \"$project_dir/.sdd/specs-tree-root/$project_name/validation.md\" \"validation.md\")  

## 状态验证

### State 文件检查
$(check_file_exists \"$project_dir/.sdd/state.json\" \"state.json\")

### Opencode 配置验证
$(check_file_exists \"$project_dir/opencode.json\" \"opencode.json\")
$(check_plugin_exists \"$project_dir/.opencode/plugins\" \"sddu\")

## 验证总结
$(generate_verification_summary \"$project_dir\" \"$project_name\")

## 系统完整性检查
$(check_required_files \"$project_dir\")
"

    return 0
}

# 检测文件是否存在
check_file_exists() {
    local file="$1"
    local name="$2"
    
    if [ -f "$file" ]; then
        local size=$(stat -c%s "$file" 2>/dev/null || echo 0)
        echo "- ✅ $name: 存在 ($size 字节)"
    else
        local dir_part=$(dirname "$file")
        if [ -d "$dir_part" ]; then
            # Directory exists but file doesn't
            echo "- ❌ $name: 不存在 (目录存在)"
        else
            # Directory also doesn't exist
            echo "- ❌ $name: 不存在 (路径不存在)"
        fi
    fi
}

# 计算目录中文件数量
count_files_in_dir() {
    local dir="$1"
    local pattern="$2" 
    local display_name="$3"
    local show_list=${4:-false}
    
    if [ -d "$dir" ]; then
        local count=$(find "$dir" -type f -name "$pattern" 2>/dev/null | wc -l)
        if [ $count -gt 0 ]; then
            echo "- ✅ $display_name: $count 个"
            
            if [ "$show_list" = "true" ]; then
                local files=$(find "$dir" -type f -name "$pattern" -exec basename {} \; | head -n 5 | paste -sd "," -)
                if [ $(find "$dir" -type f -name "$pattern" | wc -l) -gt 5 ]; then
                    echo "  - 文件列表: $files (+more)"
                else
                    echo "  - 文件列表: $files"
                fi
            fi
        else
            echo "- ⚠️  $display_name: 0 个 (目录存在但无匹配文件)"
        fi
    else
        echo "- ❌ $display_name: 目录不存在"
    fi
}

# 检查插件是否存在
check_plugin_exists() {
    local plugins_dir="$1"
    local plugin_name="$2"
    
    if [ -d "$plugins_dir/sddu" ]; then
        echo "- ✅ sddu 插件: 存在 (目录有 $(find "$plugins_dir/sddu" -type f | wc -l) 个文件)"
    else
        echo "- ❌ sddu 插件: 不存在"
    fi
    
    if [ -d "$plugins_dir/sdd" ]; then
        echo "- ✅ sdd 插件: 存在 (向后兼容)"
    else
        echo "- ❌ sdd 插件: 不存在 (向后兼容功能可能受限)"
    fi
}

# 生成验证总结统计
generate_verification_summary() {
    local project_dir="$1"
    local project_name="$2"
    
    # 检查核心 SDDU 文件
    declare -A file_status
    
    file_status[discovery]=$( [ -f "$project_dir/.sdd/specs-tree-root/$project_name/discovery.md" ] && echo "present" || echo "missing" )
    file_status[spec]=$( [ -f "$project_dir/.sdd/specs-tree-root/$project_name/spec.md" ] && echo "present" || echo "missing" )
    file_status[plan]=$( [ -f "$project_dir/.sdd/specs-tree-root/$project_name/plan.md" ] && echo "present" || echo "missing" )
    file_status[tasks]=$( [ -f "$project_dir/.sdd/specs-tree-root/$project_name/tasks.md" ] && echo "present" || echo "missing" )
    file_status[review]=$( [ -f "$project_dir/.sdd/specs-tree-root/$project_name/review.md" ] && echo "present" || echo "missing" )
    file_status[validation]=$( [ -f "$project_dir/.sdd/specs-tree-root/$project_name/validation.md" ] && echo "present" || echo "missing" )
    file_status[state]=$( [ -f "$project_dir/.sdd/state.json" ] && echo "present" || echo "missing" )
    file_status[opencode]=$( [ -f "$project_dir/opencode.json" ] && echo "present" || echo "missing" )
    
    local phases_completed=0
    for key in discovery spec plan tasks review validation; do
        if [ "${file_status[$key]}" = "present" ]; then
            ((phases_completed++))
        fi
    done
    
    local core_completed=0
    for key in state opencode; do
        if [ "${file_status[$key]}" = "present" ]; then
            ((core_completed++))
        fi
    done
    
    local total_core=8
    local total_complete=$((phases_completed + core_completed))
    local percentage=$((total_complete * 100 / total_core))
    
    echo "### 📊 验证摘要"
    echo "- **完成的开发阶段**: $phases_completed/6 ($((phases_completed * 100 / 6))%)"
    echo "- **核心配置文件**: $core_completed/2 ($((core_completed * 100 / 2))%)"
    
    if [ $percentage -ge 90 ]; then
        echo "- **总体状态**: ✅ $total_complete/$total_core ($percentage%) - 极佳"
    elif [ $percentage -ge 75 ]; then
        echo "- **总体状态**: ✅ $total_complete/$total_core ($percentage%) - 良好"
    elif [ $percentage -ge 50 ]; then
        echo "- **总体状态**: 🟡 $total_complete/$total_core ($percentage%) - 一般"
    elif [ $percentage -ge 25 ]; then
        echo "- **总体状态**: 🟡 $total_complete/$total_core ($percentage%) - 部分完成"
    else
        echo "- **总体状态**: ❌ $total_complete/$total_core ($percentage%) - 不完整"
    fi
}

# 检查必需的系统文件
check_required_files() {
    local project_dir="$1"
    
    echo "- **包管理文件**: [$(check_sys_file_exists \"$project_dir/package.json\" \"package.json\") $(check_sys_file_exists \"$project_dir/tsconfig.json\" \"tsconfig.json\") $(check_sys_file_exists \"$project_dir/nodemon.json\" \"nodemon.json\")]"
    echo "- **SDDU 工作目录**: [$(check_sys_file_exists \"$project_dir/.sdd\" \".sdd\") $(check_sys_file_exists \"$project_dir/.opencode\" \".opencode\")]"
}

check_sys_file_exists() {
    local file="$1"
    local name="$2"
    
    if [ -e "$file" ]; then
        echo "✅"
    else
        echo "❌"
    fi
}

# 如果直接调用此脚本，则执行验证
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    if [ -z "$1" ] || [ -z "$2" ]; then
        echo "使用方法: $0 <project_directory> <project_name>"
        exit 1
    fi
    
    generate_validation_report "$1" "$2"
fi
    
    echo "# SDDU 测试验证报告
## 项目信息
- **项目名称**: $project_name
- **测试目录**: $project_dir
- **验证时间**: $(date '+%Y-%m-%d %H:%M:%S')

## 文件存在性验证

### Phase 0: Discovery
$(check_file_exists "$project_dir/.sdd/specs-tree-root/$project_name/discovery.md" "discovery.md")

### Phase 1: Spec  
$(check_file_exists "$project_dir/.sdd/specs-tree-root/$project_name/spec.md" "spec.md")

### Phase 2: Plan
$(check_file_exists "$project_dir/.sdd/specs-tree-root/$project_name/plan.md" "plan.md")
$(count_files_in_dir "$project_dir/.sdd/specs-tree-root/$project_name/decisions" "decision" "decisions")

### Phase 3: Tasks
$(check_file_exists "$project_dir/.sdd/specs-tree-root/$project_name/tasks.md" "tasks.md")

### Phase 4: Build (Implementation)
$(count_files_in_dir "$project_dir/src" "source file" "source files")
$(count_files_in_dir "$project_dir/test" "*" "tests" "true")
$(count_files_in_dir "$project_dir/__tests__" "*" "tests" "true")

### Phase 5: Review
$(check_file_exists "$project_dir/.sdd/specs-tree-root/$project_name/review.md" "review.md")

### Phase 6: Validate
$(check_file_exists "$project_dir/.sdd/specs-tree-root/$project_name/validation.md" "validation.md")

## 状态验证

### State 文件检查
$(check_file_exists "$project_dir/.sdd/state.json" "state.json")

### Opencode 配置验证
$(check_file_exists "$project_dir/opencode.json" "opencode.json")
$(check_plugin_exists "$project_dir/.opencode/plugins" "sddu")

## 验证总结
$(generate_verification_summary "$project_dir" "$project_name")

## 系统完整性检查
$(check_required_files "$project_dir")
"

    return 0
}

# 检测文件是否存在
check_file_exists() {
    local file="$1"
    local name="$2"
    
    if [ -f "$file" ]; then
        echo "- ✅ $name: 存在 ($(stat -c%s "$file") 字节)"
    else
        echo "- ❌ $name: 不存在"
    fi
}

# 计算目录中文件数量
count_files_in_dir() {
    local dir="$1"
    local pattern="$2" 
    local display_name="$3"
    local show_list=${4:-false}
    
    if [ -d "$dir" ]; then
        local count=$(find "$dir" -type f -name "$pattern*" 2>/dev/null | wc -l)
        echo "- ✅ $display_name: $count 个"
        
        if [ "$show_list" = "true" ] && [ $count -gt 0 ]; then
            echo "  - 文件列表: $(find "$dir" -type f -name "$pattern*" -exec basename {} \; | paste -sd "," -)"
        fi
    else
        echo "- ❌ $display_name: 目录不存在"
    fi
}

# 检查插件是否存在
check_plugin_exists() {
    local plugins_dir="$1"
    local plugin_name="$2"
    
    if [ -d "$plugins_dir/sddu" ]; then
        echo "- ✅ sddu 插件: 存在"
    else
        echo "- ❌ sddu 插件: 不存在"
    fi
}

# 生成验证总结统计
generate_verification_summary() {
    local project_dir="$1"
    local project_name="$2"
    
    # Count essential files for verification
    local essential_files=(
        ".sdd/specs-tree-root/$project_name/discovery.md"
        ".sdd/specs-tree-root/$project_name/spec.md" 
        ".sdd/specs-tree-root/$project_name/plan.md"
        ".sdd/specs-tree-root/$project_name/tasks.md"
        ".sdd/specs-tree-root/$project_name/review.md"
        ".sdd/specs-tree-root/$project_name/validation.md"
        ".sdd/state.json"
        "opencode.json"
    )
    
    local total_files=${#essential_files[@]}
    local found_files=0
    
    for file_path in "${essential_files[@]}"; do
        if [ -f "$project_dir/$file_path" ]; then
            ((found_files++))
        fi
    done
    
    local percentage=$((found_files * 100 / total_files))
    
    if [ $percentage -ge 90 ]; then
        echo "### 📊 状态汇总
- **必需文件完整性**: ✅ $found_files/$total_files ($percentage%) - 优秀
- **整体项目结构**: ✅ 基本完整"
    elif [ $percentage -ge 70 ]; then
        echo "### 📊 状态汇总  
- **必需文件完整性**: 🟡 $found_files/$total_files ($percentage%) - 一般
- **整体项目结构**: ❗部分缺失"
    else
        echo "### 📊 状态汇总
- **必需文件完整性**: ❌ $found_files/$total_files ($percentage%) - 较差  
- **整体项目结构**: ❌ 不完整"
    fi
}

# 检查必需的系统文件
check_required_files() {
    local project_dir="$1"
    
    local result_line="系统文件: [$(check_sys_file_exists "$project_dir/package.json" "package.json") "
    result_line+="$(check_sys_file_exists "$project_dir/tsconfig.json" "tsconfig.json") "
    result_line+="$(check_sys_file_exists "$project_dir/nodemon.json" "nodemon.json")]"
    
    echo "$result_line"
}

check_sys_file_exists() {
    local file="$1"
    local name="$2"
    
    if [ -f "$file" ]; then
        echo "✅"
    else
        echo "❌"
    fi
}

# 如果直接调用此脚本，则执行验证
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    if [ -z "$1" ] || [ -z "$2" ]; then
        echo "使用方法: $0 <project_directory> <project_name>"
        exit 1
    fi
    
    generate_validation_report "$1" "$2"
fi