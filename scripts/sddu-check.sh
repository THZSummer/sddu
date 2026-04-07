#!/usr/bin/env bash
# SDDU 快速功能验证脚本
#
# 用途:
# - 快速测试 SDDU 命令是否正确部署
# - 验证基本功能

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;90m'
NC='\033[0m'

print_color() {
    printf "%b\n" "$1"
}

# 函数：检查 opencode 是否可用
check_opencode() {
    if command -v opencode &> /dev/null; then
        print_color "${GREEN}  ✅ opencode 已安装${NC}"
        local version=$(opencode --version 2>/dev/null || echo "未知版本")
        print_color "${GRAY}  版本: $version${NC}"
        return 0
    else
        print_color "${RED}  ❌ opencode 未安装或不在 PATH 中${NC}"
        return 1
    fi
}

# 函数：检查 SDDU 命令可用性
check_sddu_commands() {
    local temp_dir
    temp_dir=$(mktemp -d)
    local original_dir
    original_dir=$(pwd)
    
    # Change to temporary directory to safely run opencode list
    cd "$temp_dir" || exit 1
    
    local commands_to_check=(
        "sddu"
        "sddu-discovery"
        "sddu-1-spec"
        "sddu-2-plan"
        "sddu-3-tasks"
        "sddu-4-build"
        "sddu-5-review"
        "sddu-6-validate"
    )

    local all_commands_exist=true

    for cmd in "${commands_to_check[@]}"; do
        if opencode list 2>/dev/null | grep -q "^@$cmd "; then
            print_color "${GREEN}  ✅ @$cmd 命令已注册${NC}"
        else
            print_color "${RED}  ❌ @$cmd 命令未找到${NC}"
            all_commands_exist=false
        fi
    done

    # 返回原始目录
    cd "$original_dir" || exit 1
    rm -rf "$temp_dir"  # 清理临时目录

    if [ "$all_commands_exist" = false ]; then
        print_color "${YELLOW}⚠️  部分 SDDU 命令未安装${NC}"
        print_color "${GRAY}可能需要重新运行安装脚本或构建过程${NC}"
        return 1
    fi

    print_color "${GREEN}  🎉 所有 SDDU 命令均已正确安装！${NC}"
    
    # Also check SDD legacy commands if available
    local sdd_legacy_commands=("sdd" "sdd-discovery" "sdd-1-spec" "sdd-2-plan" "sdd-3-tasks" "sdd-4-build" "sdd-5-review" "sdd-6-validate")
    local legacy_found=()
    
    print_color "${GRAY}检查 SDD 向后兼容命令...${NC}"
    
    for cmd in "${sdd_legacy_commands[@]}"; do
        cd "$temp_dir" || exit 1
        if opencode list 2>/dev/null | grep -q "^@$cmd "; then
            legacy_found+=("$cmd")
        fi
    done
    
    cd "$original_dir" || exit 1
    rm -rf "$temp_dir"  # 清理临时目录
    
    if [ ${#legacy_found[@]} -gt 0 ]; then
        print_color "${GREEN}  ✅ 找到 ${#legacy_found[@]} 个 SDD 向后兼容命令${NC}"
        # print them comma separated
        local legacy_cmd_str=$(printf '%s,' "${legacy_found[@]}")
        legacy_cmd_str=${legacy_cmd_str%,}
        print_color "${GRAY}  已注册: ${legacy_cmd_str}${NC}"
    else
        print_color "${YELLOW}  ⚠️  未发现 SDD 向后兼容命令${NC}"
    fi

    return 0
}

# Main execution
main() {
    print_color "${CYAN}========================================${NC}"
    print_color "${CYAN}     SDDU 快速功能验证${NC}"
    print_color "${CYAN}========================================${NC}"

    # 检查 opencode 是否可用
    print_color "${CYAN}[检查] opencode CLI...${NC}"
    if ! check_opencode; then
        return 1
    fi

    # 检查 SDDU 命令是否存在
    print_color "${CYAN}[检查] SDDU 命令可用性...${NC}"
    if ! check_sddu_commands; then
        return 1
    fi

    print_color "${CYAN}========================================${NC}"
    print_color "${GREEN}     SDDU 功能验证通过${NC}"
    print_color "${CYAN}========================================${NC}"

    print_color "${GRAY}现在可以开始使用 SDDU 了！${NC}"
    print_color ""
    print_color "${CYAN}常用命令:${NC}"
    print_color "  @sddu <项目名>               - 一键完整执行"
    print_color "  @sddu-discovery <话题>       - 需求发现"
    print_color "  @sddu-1-spec <项目名>        - 规范编写"
    print_color "  @sddu-2-plan <项目名>        - 技术规划"
    print_color "  @sddu-3-tasks <项目名>       - 任务分解"
    print_color "  @sddu-4-build <项目名>       - 代码实现"
    print_color "  @sddu-5-review <项目名>      - 代码审查"
    print_color "  @sddu-6-validate <项目名>    - 验证确认"
    print_color "  "
    print_color "  或使用传统命令 (向后兼容):"
    print_color "  @sdd <项目名>                - 旧版入口点"
    print_color "  @sdd-1-spec, @sdd-2-plan, @sdd-3-tasks..."
    print_color ""
    print_color "${GRAY}尝试以下命令来测试:${NC}"
    print_color "${GRAY}  bash sddu-e2e.sh \"test-project\" --auto${NC}"
}

# Execute main function
main "$@"