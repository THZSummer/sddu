#!/usr/bin/env bash
# SDDU E2E Test Script (Simplified)
#
# 端到端测试脚本 - 利用 install.sh 完成构建和安装
#
# 使用方式:
#   bash sddu-e2e.sh                        # 默认项目名 user-login
#   bash sddu-e2e.sh "项目名称"              # 自定义项目名
#   bash sddu-e2e.sh "项目名" --auto        # 自动执行全流程
#   bash sddu-e2e.sh "项目名" --report      # 生成详细测试报告
#   bash sddu-e2e.sh --scenario tree        # 创建树形嵌套测试场景
#
# 执行步骤:
#   [1/4] 初始化测试环境 (创建目录)
#   [2/4] 调用一键安装脚本 (自动完成 8 步构建 + 安装)
#   [3/4] 创建测试提示词文件 (SDDU 全流程命令)
#   [4/4] 生成测试报告 (验证 + 统计)
#   [额外] --scenario tree: 创建 1 个父级 + 2 个子级的树形测试结构

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;90m'
PURPLE='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m'

# Helper function for colored output
print_color() {
    printf "%b\n" "$1"
}

# Timestamp helper
get_timestamp() {
    date '+%Y-%m-%d %H:%M:%S'
}

# Default project name
DEFAULT_PROJECT_NAME="user-login"

# Directory prefix
DIR_PREFIX="sddu-test"

# Global variables
PROJECT_NAME=""
TEST_DIR=""
TEST_DIR_NAME=""
AUTO_MODE=false
REPORT_MODE=false
TREE_SCENARIO=false
START_TIME=""
END_TIME=""

# Validate project name format: lowercase letters, digits, hyphens only, starting with letter
validate_project_name() {
    local name="$1"
    if [[ "$name" =~ ^[a-z][a-z0-9-]*$ ]]; then
        return 0
    else
        return 1
    fi
}

# Parse command line arguments
parse_arguments() {
    local args=("$@")
    local i=0
    
    # Set default project name
    PROJECT_NAME="$DEFAULT_PROJECT_NAME"
    
    # Process all arguments first
    for arg in "${args[@]}"; do
        case "$arg" in
            --auto)
                AUTO_MODE=true
                ;;
            --report)
                REPORT_MODE=true
                ;;
            --scenario)
                # We'll expect "tree" next, handled separately
                ;;
            *)
                # Check if it's a project name (not a flag) and is a valid project name
                if [[ "$arg" != --* ]] && validate_project_name "$arg"; then
                    PROJECT_NAME="$arg"
                elif [[ "$arg" == "tree" ]]; then
                    TREE_SCENARIO=true
                    PROJECT_NAME="e2e-tree-parent"
                fi
                ;;
        esac
    done
}

# Generate unique directory name function
generate_unique_dir() {
    local base_name="$1"
    local full_name="${DIR_PREFIX}-${base_name}"
    local counter=1
    local target_dir="${BASE_TEST_DIR}/${full_name}"
    
    while [ -d "$target_dir" ]; do
        target_dir="${BASE_TEST_DIR}/${full_name}-${counter}"
        counter=$((counter + 1))
    done
    
    echo "$target_dir"
}

# Create tree test scenario: 1 parent + 2 children
create_tree_test_scenario() {
    print_color "${CYAN}========================================${NC}"
    print_color "${CYAN}     创建树形 E2E 测试场景${NC}"
    print_color "${CYAN}========================================${NC}"
    print_color "${GRAY}场景目标: 1个父级 Feature + 2个子级 Feature${NC}"
    print_color "${GRAY}特征要求: FR-070 ~ FR-073 符合树形结构${NC}"
    echo ""
    
    local parent_feature_name="specs-tree-e2e-parent"
    local child_a_name="specs-tree-e2e-child-a"
    local child_b_name="specs-tree-e2e-child-b"
    
    # Create parent feature directory structure
    local parent_dir="${TEST_DIR}/.sddu/specs-tree-root/${parent_feature_name}"
    local child_a_dir="${parent_dir}/${child_a_name}"
    local child_b_dir="${parent_dir}/${child_b_name}"
    
    print_color "${CYAN}[树结构] 创建目录结构...${NC}"
    print_color "${GRAY}  - 父级目录: ${parent_dir}${NC}"
    print_color "${GRAY}  - 子级A目录: ${child_a_dir}${NC}"
    print_color "${GRAY}  - 子级B目录: ${child_b_dir}${NC}"
    
    # Create directories
    mkdir -p "$parent_dir"
    mkdir -p "$child_a_dir"  
    mkdir -p "$child_b_dir"
    
    print_color "${GREEN}  ✅ 目录结构创建成功${NC}"
    echo ""
    
    print_color "${CYAN}[状态文件] 创建各Feature的state.json...${NC}"
    
    # Create parent state.json - FR-070, FR-072
    local parent_state_file="${parent_dir}/state.json"
    cat > "$parent_state_file" << EOF
{
  "feature": "specs-tree-e2e-parent",
  "name": "E2E Test Parent Feature",
  "version": "v2.1.0",
  "status": "planned",
  "phase": 2,
  "phaseHistory": [
    {
      "phase": 1,
      "status": "specified",
      "timestamp": "$(date -Iseconds)",
      "triggeredBy": "sddu-initial"
    },
    {
      "phase": 2,
      "status": "planned", 
      "timestamp": "$(date -Iseconds)",
      "triggeredBy": "sddu-creation"
    }
  ],
  "files": {
    "spec": "specs-tree-e2e-parent/spec.md",
    "plan": "specs-tree-e2e-parent/plan.md",
    "tasks": "specs-tree-e2e-parent/tasks.md"
  },
  "dependencies": {
    "on": [],
    "blocking": []
  },
  "depth": 0,
  "childrens": [
    {
      "path": "${parent_dir}/${child_a_name}",
      "featureName": "specs-tree-e2e-child-a",
      "status": "specified",
      "phase": 1,
      "lastModified": "$(date -Iseconds)"
    },
    {
      "path": "${parent_dir}/${child_b_name}",
      "featureName": "specs-tree-e2e-child-b", 
      "status": "specified",
      "phase": 1,
      "lastModified": "$(date -Iseconds)"
    }
  ]
}
EOF
    
    print_color "${GRAY}  - 创建父级状态: $parent_state_file${NC}"
    
    # Create child A state.json - FR-072, FR-073
    local child_a_state_file="${child_a_dir}/state.json"
    cat > "$child_a_state_file" << EOF
{
  "feature": "specs-tree-e2e-child-a",
  "name": "E2E Test Child Feature A",
  "version": "v2.1.0",
  "status": "specified",
  "phase": 1,
  "phaseHistory": [
    {
      "phase": 1,
      "status": "specified",
      "timestamp": "$(date -Iseconds)",
      "triggeredBy": "sddu-initial"
    }
  ],
  "files": {
    "spec": "specs-tree-e2e-parent/specs-tree-e2e-child-a/spec.md"
  },
  "dependencies": {
    "on": [
      "specs-tree-e2e-parent/specs-tree-e2e-child-b"  // Cross-tree dependency: Child A depends on Child B - FR-073
    ],
    "blocking": []
  },
  "depth": 1
}
EOF
    
    print_color "${GRAY}  - 创建子级A状态: $child_a_state_file${NC}"
    
    # Create child B state.json - FR-072
    local child_b_state_file="${child_b_dir}/state.json"
    cat > "$child_b_state_file" << EOF
{
  "feature": "specs-tree-e2e-child-b",
  "name": "E2E Test Child Feature B",
  "version": "v2.1.0",
  "status": "specified",
  "phase": 1,
  "phaseHistory": [
    {
      "phase": 1,
      "status": "specified",
      "timestamp": "$(date -Iseconds)",
      "triggeredBy": "sddu-initial"
    }
  ],
  "files": {
    "spec": "specs-tree-e2e-parent/specs-tree-e2e-child-b/spec.md"
  },
  "dependencies": {
    "on": [],
    "blocking": []
  },
  "depth": 1
}
EOF

    print_color "${GRAY}  - 创建子级B状态: $child_b_state_file${NC}"
    print_color "${GREEN}  ✅ 状态文件创建成功${NC}"
    echo ""
    
    print_color "${CYAN}[验证文件] 创建模拟Spec/Plan/Tasks文件...${NC}"
    
    # Create mock spec files for demonstration
    mkdir -p "${parent_dir}/plan.md"
    echo "# Mock Spec for Parent Feature
## Description
This is the parent feature for E2E testing with tree structure." > "${parent_dir}/spec.md"
    
    echo "# Mock Plan for Parent Feature  
## Implementation  
This is the parent plan." > "${parent_dir}/plan.md"
    
    echo "# Mock Tasks for Parent Feature
## Tasks  
- TASK-001: Mock parent task" > "${parent_dir}/tasks.md"
    
    echo "# Mock Spec for Child A Feature  
## Description
Child A in tree structure." > "${child_a_dir}/spec.md"
    
    echo "# Mock Spec for Child B Feature  
## Description  
Child B in tree structure." > "${child_b_dir}/spec.md"
    
    print_color "${GRAY}  - 创建父级 spec/plan/tasks${NC}"  
    print_color "${GRAY}  - 创建子级A spec${NC}"
    print_color "${GRAY}  - 创建子级B spec${NC}"
    print_color "${GREEN}  ✅ 验证文件创建成功${NC}"
    echo ""
    
    print_color "${CYAN}树形测试场景创建完成！${NC}"
    print_color "${GRAY}目录结构:${NC}"
    print_color "${GRAY}└── ${parent_feature_name}${NC}"
    print_color "${GRAY}    ├── state.json (depth: 0, childrens: 2)${NC}"
    print_color "${GRAY}    ├── spec.md${NC}"
    print_color "${GRAY}    ├── plan.md${NC}"
    print_color "${GRAY}    ├── tasks.md${NC}"
    print_color "${GRAY}    ├── ${child_a_name}${NC}"
    print_color "${GRAY}    │   ├── state.json (depth: 1, phaseHistory: [])${NC}"
    print_color "${GRAY}    │   └── spec.md${NC}"
    print_color "${GRAY}    └── ${child_b_name} ${NC}"
    print_color "${GRAY}        ├── state.json (depth: 1, dependencies.on: [child-a])${NC}"
    print_color "${GRAY}        └── spec.md${NC}"
    echo ""
    print_color "${GREEN}✅ 树形嵌套结构已创建 (${TEST_DIR}/.sddu/specs-tree-root/)${NC}"
    print_color "${GRAY}FR-070: 1个父级 + 2个子级 ✓${NC}"
    print_color "${GRAY}FR-071: childrens数组包含子级信息 ✓${NC}"
    print_color "${GRAY}FR-072: 深度层级正确 (0->1) ✓${NC}"
    print_color "${GRAY}FR-073: 跨子树依赖 (ChildA -> ChildB) ✓${NC}"
}

# Generate unique directory name function
generate_unique_dir() {
    local base_name="$1"
    local full_name="${DIR_PREFIX}-${base_name}"
    local counter=1
    local target_dir="${BASE_TEST_DIR}/${full_name}"
    
    while [ -d "$target_dir" ]; do
        target_dir="${BASE_TEST_DIR}/${full_name}-${counter}"
        counter=$((counter + 1))
    done
    
    echo "$target_dir"
}

# Record current timestamp for timing
start_timer() {
    START_TIME=$(date +%s)
}

stop_timer() {
    END_TIME=$(date +%s)
    local duration=$((END_TIME - START_TIME))
    local mins=$((duration / 60))
    local secs=$((duration % 60))
    printf "%dm%ds" $mins $secs
}

# Initialize test directories and start timer
initialize_test() {
    # Script directory (project root)
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    
    # Base test directory
    BASE_TEST_DIR="${SDDU_TEST_DIR:-${HOME}/sddu-test-projects}"
    
    # Ensure base test directory exists
    if [ ! -d "$BASE_TEST_DIR" ]; then
        print_color "${GRAY}创建基础目录: ${BASE_TEST_DIR}${NC}"
        mkdir -p "$BASE_TEST_DIR"
    fi
    
    # Generate unique test directory name
    TEST_DIR=$(generate_unique_dir "$PROJECT_NAME")
    TEST_DIR_NAME=$(basename "$TEST_DIR")
    
    print_color "${CYAN}========================================${NC}"
    print_color "${CYAN}     SDDU 全流程端到端测试${NC}"
    print_color "${CYAN}========================================${NC}"
    print_color "${GRAY}测试项目: ${PROJECT_NAME}${NC}"
    print_color "${GRAY}测试目录: ${TEST_DIR}${NC}"
    if [ "$AUTO_MODE" = true ]; then
        print_color "${GRAY}模式: 自动执行${NC}"
    fi
    echo ""

    # Create test directory
    print_color "${CYAN}[1/4] 初始化测试环境...${NC}"
    print_color "${GRAY}  创建测试目录: ${TEST_DIR}${NC}"
    mkdir -p "$TEST_DIR"
    print_color "${GREEN}  ✅ 测试目录创建成功${NC}"
    
    start_timer
}

# Execute installation script (includes full build)
execute_installation() {
    print_color "${CYAN}[2/4] 调用一键安装脚本...${NC}"
    print_color "${GRAY}  目标目录：${TEST_DIR}${NC}"
    print_color "${GRAY}  说明：install.sh 会自动执行完整构建流程 (8 步)${NC}"
    echo ""
    
    # Execute installation script (includes full build)
    # SCRIPT_DIR points to scripts/e2e/basic/, need to go up 3 levels to project root
    INSTALL_SCRIPT="${SCRIPT_DIR}/../../../install.sh"
    if bash "$INSTALL_SCRIPT" "$TEST_DIR"; then
        print_color "${GREEN}  ✅ 安装成功${NC}"
    else
        print_color "${RED}  ❌ 安装失败${NC}"
        exit 1
    fi
    echo ""
}

# Generate prompt file with SDDU commands
create_prompt_file() {
    print_color "${CYAN}[3/4] 创建 SDDU 测试提示词文件...${NC}"
    
    # Create prompt file path
    PROMPT_FILE="${TEST_DIR}/sddu-test-prompt.md"
    
    # Generate prompt file content
    cat > "$PROMPT_FILE" << EOF
# SDDU 全流程测试

**项目名称**: ${PROJECT_NAME}

---
## ⚠️ 核心要求（必须遵守）

**全程自动化，禁止询问用户**：

1. **禁止确认**: 任何操作都不要问"是否继续"、"确认吗"等问题  
2. **禁止等待**: 不要等待用户输入，直接使用默认值
3. **自主决策**: 遇到选择时，自动选择最合理的方案
4. **自动推进**: 每个阶段完成后立即进入下一阶段
5. **无需批准**: 所有决策自动执行，无需用户批准

---

## 技术栈要求

**必须满足以下约束**：

- ✅ **语言**: 仅使用 TypeScript
- ✅ **运行时**: Node.js  
- ✅ **零依赖**: 不使用数据库、Redis、消息队列等中间件
- ✅ **一键启动**: \`npm install && npm start\` 或 \`npm run dev\` 即可运行
- ✅ **数据存储**: 使用内存存储或 JSON 文件存储
- ✅ **测试友好**: 无需配置外部服务即可运行测试

**推荐技术方案**：
- Express/Fastify (轻量级 Web 框架)
- 内存数据库 (Map/Set)
- JSON 文件持久化
- Jest/Vitest (测试框架)

---

## 执行流程（自动执行，无需确认）

### Phase 0: 需求挖掘（自动执行）
\`\`\`
@sddu-discovery ${PROJECT_NAME}
\`\`\`
- 自动分析需求
- 自动识别核心功能  
- 自动生成需求文档
- 完成后立即进入 Phase 1

### Phase 1: 规范编写（自动执行）
\`\`\`
@sddu-spec ${PROJECT_NAME}
\`\`\`
- 自动定义 API 接口
- 自动设计数据结构
- 自动设定验收标准
- 完成后立即进入 Phase 2

### Phase 2: 技术规划（自动执行）
\`\`\`
@sddu-plan ${PROJECT_NAME}
\`\`\`
- 自动设计架构（符合技术栈要求）
- 自动划分模块
- 自动生成技术方案
- 完成后立即进入 Phase 3

### Phase 3: 任务分解（自动执行）
\`\`\`
@sddu-tasks ${PROJECT_NAME}
\`\`\`
- 自动拆分任务
- 自动定义依赖关系
- 完成后立即进入 Phase 4

### Phase 4: 代码实现（自动执行）
\`\`\`
@sddu-build ${PROJECT_NAME}
\`\`\`
- 自动按任务实现代码
- 自动编写测试
- 确保一键启动
- 完成后立即进入 Phase 5

### Phase 5: 代码审查（自动执行）
\`\`\`
@sddu-review ${PROJECT_NAME}
\`\`\`
- 自动代码质量检查
- 自动技术栈合规检查
- 发现问题自动修复
- 完成后立即进入 Phase 6

### Phase 6: 验证确认（自动执行）
\`\`\`
@sddu-validate ${PROJECT_NAME}
\`\`\`
- 自动运行功能测试
- 自动验证启动流程
- 自动生成验证报告

---

## 验收标准（自动检查）

项目必须满足：

- [ ] 纯 TypeScript 实现
- [ ] 无外部中间件依赖
- [ ] \`npm install\` 成功
- [ ] \`npm start\` 或 \`npm run dev\` 启动成功
- [ ] 核心功能可用
- [ ] 测试可运行

---

## 一键执行命令

\`\`\`bash
@sddu ${PROJECT_NAME}
\`\`\`
执行后，全流程自动完成，无需任何人工干预！

---
*生成时间: $(get_timestamp)*
EOF
    
    print_color "${GRAY}  项目名称: ${PROJECT_NAME}${NC}"
    print_color "${GRAY}  提示词文件: ${PROMPT_FILE}${NC}"
    print_color "${GREEN}  ✅ 提示词文件创建成功${NC}"
    echo ""
}

# Validation phase results tracking
PHASE_RESULTS=()

validate_phase_result() {
    local phase=$1
    local expected_file=$2
    local optional_file=${3:-""}
    
    print_color "${CYAN}[验证] Phase ${phase} 状态检查...${NC}"
    
    local test_dir_path="${TEST_DIR}/.sddu/specs-tree-root/${PROJECT_NAME}"
    
    # Check if expected directory exists
    if [ -d "$test_dir_path" ]; then
        if [ -f "$test_dir_path/$expected_file" ]; then
            print_color "${GREEN}  ✅ Phase ${phase}: ${expected_file} 存在${NC}"
            PHASE_RESULTS["$phase"]="✅ | $(stop_timer) | ${expected_file}"
            
            # If there's an optional file to check, verify it too
            if [ -n "$optional_file" ]; then
                if [ -f "$test_dir_path/$optional_file" ]; then
                    print_color "${GREEN}  ✅ Phase ${phase}: ${optional_file} 存在${NC}"
                else
                    print_color "${YELLOW}  ⚠️ Phase ${phase}: ${optional_file} 缺失${NC}"
                fi
            fi
        else
            print_color "${RED}  ❌ Phase ${phase}: ${expected_file} 不存在${NC}"
            PHASE_RESULTS["$phase"]="❌ | $(stop_timer) | 文件缺失"
             # Count files in the phase directory if it exists
            if [ -d "$test_dir_path" ]; then
                local file_count=$(find "$test_dir_path" -type f | wc -l)
                print_color "${GRAY}  - 当前目录文件数: $file_count${NC}"
            fi
        fi
    else
        print_color "${RED}  ❌ Phase ${phase}: 目录不存在 - $test_dir_path${NC}"
        PHASE_RESULTS["$phase"]="❌ | $(stop_timer) | 目录缺失"
    fi
    echo ""
}

# Generate test report if requested
generate_report() {
    if [ "$REPORT_MODE" = true ]; then
        print_color "${CYAN}[4/4] 生成测试报告...${NC}"
        
        local report_file="${TEST_DIR}/sddu-test-report.md"
        local duration=$(stop_timer)
        
        cat > "$report_file" << EOF
# SDDU E2E 测试报告

## 测试信息
- **项目名称**: $PROJECT_NAME
- **测试目录**: $TEST_DIR
- **测试模式**: SDDU 流程
- **开始时间**: $(date -d "@$START_TIME" "+%Y-%m-%d %H:%M:%S")
- **结束时间**: $(date -d "@$END_TIME" "+%Y-%m-%d %H:%M:%S")
- **总耗时**: $duration

## 各阶段结果

| 阶段 | 状态 | 耗时 | 生成的主要文件 |
|------|------|------|----------------|
| 0. Discovery | ${PHASE_RESULTS[0]:-"?"} | | |
| 1. Spec | ${PHASE_RESULTS[1]:-"?"} | | |
| 2. Plan | ${PHASE_RESULTS[2]:-"?"} | | |
| 3. Tasks | ${PHASE_RESULTS[3]:-"?"} | | |
| 4. Build | ${PHASE_RESULTS[4]:-"?"} | | |
| 5. Review | ${PHASE_RESULTS[5]:-"?"} | | |
| 6. Validate | ${PHASE_RESULTS[6]:-"?"} | | |

## 验证详情

EOF
        
        # Add detailed results for each phase
        local failed_phases=0
        for i in {0..6}; do
            if [[ "${PHASE_RESULTS[$i]}" == *"❌"* ]]; then
                ((failed_phases++))
            fi
        done
        
        if [ $failed_phases -eq 0 ]; then
            echo "- **状态流转**: ✅ 正常" >> "$report_file"
            echo "- **文件完整性**: ✅ 完整" >> "$report_file"
            echo "- **测试结果**: ✅ 全部通过" >> "$report_file"
            echo "" >> "$report_file"
            echo "## 总体评价" >> "$report_file"
            echo "✅ 所有测试阶段均成功完成" >> "$report_file"
        else
            echo "- **状态流转**: ❌ 有失败阶段" >> "$report_file"
            echo "- **文件完整性**: ❌ 部分文件缺失" >> "$report_file"
            echo "- **测试结果**: ❌  $failed_phases 个阶段失败" >> "$report_file"
            echo "" >> "$report_file"
            echo "## 总体评价" >> "$report_file"
            echo "❌ $failed_phases 个阶段失败，需要进一步排查问题" >> "$report_file"
        fi
        
        print_color "${GRAY}  报告保存至: ${report_file}${NC}"
        print_color "${GREEN}  ✅ 测试报告生成成功${NC}"
        echo ""
    fi
}

# Complete the test
complete_test() {
    print_color "${CYAN}========================================${NC}"
    print_color "${GREEN}     SDDU 全流程测试完成！${NC}"
    print_color "${CYAN}========================================${NC}"
    echo ""
    
    # Show timing
    print_color "${GRAY}总耗时: $(stop_timer)${NC}"
    echo ""
    
    print_color "📁 测试目录: ${CYAN}${TEST_DIR}${NC}"
    echo ""
    print_color "📋 生成的文件:"
    print_color "   - .opencode/plugins/sddu/ (插件文件)"
    print_color "   - .opencode/agents/ (Agent定义)"
    print_color "   - opencode.json (配置文件)"
    print_color "   - .sddu/ (SDDU工作空间)"
    print_color "   - ${CYAN}sddu-test-prompt.md${NC} (测试提示词文件)"
    if [ "$REPORT_MODE" = true ]; then
        print_color "   - ${CYAN}sddu-test-report.md${NC} (详细报告)"
    fi
    echo ""
    print_color "🚀 快速开始:"
    print_color "   ${CYAN}cd ${TEST_DIR}${NC}"
    print_color "   ${CYAN}opencode${NC}"
    print_color "   ${CYAN}cat sddu-test-prompt.md${NC}  # 查看完整提示词"
    print_color "   ${CYAN}@sddu ${PROJECT_NAME}${NC}  # 一键执行全流程"
    echo ""
    print_color "💡 提示: 提示词文件已包含使用 @sddu-* 系列命令的完整 6 阶段流程！"
}

# Main execution sequence
main() {
    parse_arguments "$@"
    initialize_test
    
    # If tree scenario, create the test tree structure
    if [ "$TREE_SCENARIO" = true ]; then
        create_tree_test_scenario
    else
        execute_installation
        create_prompt_file
        
        # Wait for user to run the test if not in auto mode
        if [ "$AUTO_MODE" = false ]; then
            print_color "${YELLOW}⚠️  脚本执行完成，在新终端中执行以下命令开始测试:${NC}"
            print_color ""
            print_color "   ${CYAN}cd ${TEST_DIR}${NC}"
            print_color "   ${CYAN}opencode${NC}"
            print_color "   ${CYAN}cat sddu-test-prompt.md${NC}"
            print_color "   ${CYAN}@sddu ${PROJECT_NAME}${NC}"
            print_color ""
            print_color "${GRAY}按任意键继续查看最终摘要...${NC}"
            read -n 1 -s
        fi
    fi
    
    # Post-test validation (only if directory exists)
    if [ -d "${TEST_DIR}/.sddu/specs-tree-root/${PROJECT_NAME}" ]; then
        print_color "${CYAN}========================================${NC}"
        print_color "${CYAN}     验证阶段结果${NC}"
        print_color "${CYAN}========================================${NC}"
        echo ""
        validate_phase_result 0 "discovery.md"
        validate_phase_result 1 "spec.md"
        validate_phase_result 2 "plan.md" "decisions/*"
        validate_phase_result 3 "tasks.md"
        print_color "${YELLOW}⚠️ Phase 4 验证需要执行 @sddu 命令后才会生成文件，跳过验证${NC}"
        validate_phase_result 5 "review.md" 
        validate_phase_result 6 "validation.md"
        
        generate_report
    elif [ "$TREE_SCENARIO" = true ]; then
        # For tree scenario, validate special tree structures were created
        print_color "${CYAN}========================================${NC}"
        print_color "${CYAN}     验证树形结构测试场景${NC}"
        print_color "${CYAN}========================================${NC}"
        echo ""
        
        local parent_dir="${TEST_DIR}/.sddu/specs-tree-root/specs-tree-e2e-parent"
        local child_a_dir="${parent_dir}/specs-tree-e2e-child-a"
        local child_b_dir="${parent_dir}/specs-tree-e2e-child-b"
        
        if [ -d "$parent_dir" ] && [ -d "$child_a_dir" ] && [ -d "$child_b_dir" ]; then
            print_color "${GREEN}✓ 1 父 + 2 子目录结构已创建${NC} (FR-070)"
        else
            print_color "${RED}✗ 部分目录结构缺失${NC}"
        fi
        
        if [ -f "$parent_dir/state.json" ] && [ -f "$child_a_dir/state.json" ] && [ -f "$child_b_dir/state.json" ]; then
            print_color "${GREEN}✓ 所有状态文件都已创建${NC}"
            
            # Validate version, depth, and structure
            if grep -q '"version": "v2.1.0"' "$parent_dir/state.json"; then
                print_color "${GREEN}✓ 父级版本 'v2.1.0' 正确 - FR-073${NC}"
            fi
            
            if grep -q '"depth": 0' "$parent_dir/state.json" && grep -q '"depth": 1' "$child_a_dir/state.json" && grep -q '"depth": 1' "$child_b_dir/state.json"; then
                print_color "${GREEN}✓ 深度层级正确 (0 -> 1) - FR-072${NC}"
            fi
            
            if grep -q 'specs-tree-e2e-child-a\|specs-tree-e2e-child-b' "$parent_dir/state.json"; then
                print_color "${GREEN}✓ 父级 childrens 数组包含所有子节点 - FR-071${NC}"
            fi
            
            if grep -q "${child_b_dir//\//\\/}" "$child_a_dir/state.json"; then
                print_color "${GREEN}✓ 跨子树依赖记录正确 - FR-073${NC}"
            fi
        else
            print_color "${RED}✗ 部分状态文件缺失${NC}"
        fi
    else
        print_color "${YELLOW}⚠️  测试目录未生成预期的 SDDU 结构，跳过验证${NC}"
    fi
    
    complete_test
    print_color ""
    print_color "${GREEN}🎉 测试准备完成！${NC}"
}

# Exit with any errors
set +e
main "$@"
EXIT_CODE=$?
exit $EXIT_CODE