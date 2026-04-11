#!/usr/bin/env bash
# SDDU Fullstack E2E Test Script
#
# 支持前后端分离项目（SpringBoot + React）
#
# 使用方式:
#   bash sddu-e2e-fullstack.sh "项目名称"              # 生成前后端项目
#   bash sddu-e2e-fullstack.sh "项目名" --auto        # 自动执行全流程
#   bash sddu-e2e-fullstack.sh "项目名" --report      # 生成详细测试报告
#
# 技术栈:
#   后端：SpringBoot 3.x + H2 Database + Docker
#   前端：React 18 + TypeScript + Vite + Docker
#   部署：Docker Compose
#
# 执行步骤:
#   [1/4] 初始化测试环境 (创建目录)
#   [2/4] 调用一键安装脚本 (自动完成 8 步构建 + 安装)
#   [3/4] 创建测试提示词文件 (前后端分离架构)
#   [4/4] 生成测试报告 (验证 + 统计)
#
# 生成的项目结构:
# project-name/
# ├── backend/              # SpringBoot 后端
# │   ├── src/
# │   ├── pom.xml
# │   ├── Dockerfile
# │   └── application.yml
# ├── frontend/             # React 前端
# │   ├── src/
# │   ├── package.json
# │   ├── vite.config.ts
# │   ├── Dockerfile
# │   └── tsconfig.json
# ├── docker-compose.yml    # Docker 编排
# └── README.md             # 项目说明
#


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
    
    # Find the project name first (non-flag argument)
    for arg in "${args[@]}"; do
        if [[ "$arg" != --* ]]; then
            if validate_project_name "$arg"; then
                PROJECT_NAME="$arg"
            else
                print_color "${YELLOW}警告: 项目名 '$arg' 格式无效${NC}"
                print_color "${GRAY}项目名必须: 小写字母开头，只能包含小写字母、数字、连字符${NC}"
                print_color "${GRAY}使用默认项目名: $DEFAULT_PROJECT_NAME${NC}"
                PROJECT_NAME="$DEFAULT_PROJECT_NAME"
            fi
            break
        fi
    done
    
    # Process flags
    for arg in "${args[@]}"; do
        case "$arg" in
            --auto)
                AUTO_MODE=true
                ;;
            --report)
                REPORT_MODE=true
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
    # Script directory (scripts/e2e/fullstack/)
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    
    # Project root directory (two levels up from script)
    PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
    
    # Base test directory
    BASE_TEST_DIR="/home/usb/workspace/wks-sddu/wks-sdd-test-projects"
    
    # Ensure base test directory exists
    if [ ! -d "$BASE_TEST_DIR" ]; then
        print_color "${GRAY}创建基础目录: ${BASE_TEST_DIR}${NC}"
        mkdir -p "$BASE_TEST_DIR"
    fi
    
    # Generate unique test directory name
    TEST_DIR=$(generate_unique_dir "$PROJECT_NAME")
    TEST_DIR_NAME=$(basename "$TEST_DIR")
    
    print_color "${CYAN}========================================${NC}"
    print_color "${CYAN}     SDDU Fullstack 全流程端到端测试${NC}"
    print_color "${CYAN}========================================${NC}"
    print_color "${GRAY}测试项目：${PROJECT_NAME}${NC}"
    print_color "${GRAY}测试目录：${TEST_DIR}${NC}"
    print_color "${GRAY}架构：前后端分离 (SpringBoot + React)${NC}"
    if [ "$AUTO_MODE" = true ]; then
        print_color "${GRAY}模式：自动执行${NC}"
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
    if bash "$PROJECT_ROOT/install.sh" "$TEST_DIR"; then
        print_color "${GREEN}  ✅ 安装成功${NC}"
    else
        print_color "${RED}  ❌ 安装失败${NC}"
        exit 1
    fi
    echo ""
}

# Generate prompt file with SDDU commands for Fullstack project
create_prompt_file() {
    print_color "${CYAN}[3/4] 创建 SDDU 测试提示词文件（前后端分离架构）...${NC}"
    
    # Create prompt file path
    PROMPT_FILE="${TEST_DIR}/sddu-test-prompt.md"
    
    # Generate prompt file content for Fullstack project
    cat > "$PROMPT_FILE" << EOF
# SDDU Fullstack 全流程测试

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

**前后端分离架构**：

### 后端技术栈
- ✅ **语言**: Java 17+
- ✅ **框架**: SpringBoot 3.x
- ✅ **数据库**: H2 Database (内存数据库，开发环境)
- ✅ **构建工具**: Maven
- ✅ **API 风格**: RESTful API
- ✅ **容器化**: Docker + Dockerfile

### 前端技术栈
- ✅ **语言**: TypeScript 5.x
- ✅ **框架**: React 18
- ✅ **构建工具**: Vite 5.x
- ✅ **UI 组件**: Ant Design 或 Material-UI
- ✅ **HTTP 客户端**: Axios
- ✅ **容器化**: Docker + Dockerfile

### 部署配置
- ✅ **编排工具**: Docker Compose
- ✅ **服务发现**: 通过 Docker 网络
- ✅ **环境变量**: .env 文件配置

---

## 项目结构

\`\`\`
${PROJECT_NAME}/
├── backend/              # SpringBoot 后端
│   ├── src/main/java/   # Java 源代码
│   ├── src/main/resources/
│   │   ├── application.yml
│   │   └── application-dev.yml
│   ├── pom.xml          # Maven 配置
│   ├── Dockerfile       # 后端 Docker 镜像
│   └── README.md        # 后端说明
├── frontend/            # React 前端
│   ├── src/            # TypeScript 源代码
│   ├── public/
│   ├── package.json    # NPM 配置
│   ├── vite.config.ts  # Vite 配置
│   ├── tsconfig.json   # TypeScript 配置
│   ├── Dockerfile      # 前端 Docker 镜像
│   └── README.md       # 前端说明
├── docker-compose.yml   # Docker 编排配置
├── .env.example         # 环境变量示例
└── README.md            # 项目总说明
\`\`\`

---

## 执行流程（自动执行，无需确认）

### Phase 0: 需求挖掘（自动执行）
\`\`\`
@sddu-discovery ${PROJECT_NAME}
\`\`\`
- 自动分析需求
- 自动识别核心功能  
- 自动生成需求文档（包含前后端功能划分）
- 完成后立即进入 Phase 1

### Phase 1: 规范编写（自动执行）
\`\`\`
@sddu-1-spec ${PROJECT_NAME}
\`\`\`
- 自动定义 RESTful API 接口
- 自动设计数据库表结构（JPA Entity）
- 自动定义前端组件结构
- 自动设定验收标准
- 完成后立即进入 Phase 2

### Phase 2: 技术规划（自动执行）
\`\`\`
@sddu-2-plan ${PROJECT_NAME}
\`\`\`
- 自动设计前后端分离架构
- 自动划分后端模块（Controller/Service/Repository）
- 自动划分前端模块（Components/Hooks/Services）
- 自动生成技术方案文档
- 完成后立即进入 Phase 3

### Phase 3: 任务分解（自动执行）
\`\`\`
@sddu-3-tasks ${PROJECT_NAME}
\`\`\`
- 自动拆分后端任务
- 自动拆分前端任务
- 自动定义任务依赖关系
- 完成后立即进入 Phase 4

### Phase 4: 代码实现（自动执行）
\`\`\`
@sddu-4-build ${PROJECT_NAME}
\`\`\`
- 自动实现后端 API（SpringBoot）
- 自动实现前端页面（React）
- 自动编写单元测试（JUnit + React Testing Library）
- 自动配置 Docker 和 Docker Compose
- 完成后立即进入 Phase 5

### Phase 5: 代码审查（自动执行）
\`\`\`
@sddu-5-review ${PROJECT_NAME}
\`\`\`
- 自动代码质量检查
- 自动技术栈合规检查
- 自动 Docker 配置检查
- 发现问题自动修复
- 完成后立即进入 Phase 6

### Phase 6: 验证确认（自动执行）
\`\`\`
@sddu-6-validate ${PROJECT_NAME}
\`\`\`
- 自动运行后端测试（mvn test）
- 自动运行前端测试（npm test）
- 自动构建 Docker 镜像
- 自动启动 Docker Compose 验证
- 自动生成验证报告

---

## 验收标准（自动检查）

### 后端验收标准
- [ ] SpringBoot 3.x 项目结构正确
- [ ] Maven 构建成功（mvn clean package）
- [ ] RESTful API 可访问
- [ ] H2 数据库配置正确
- [ ] 单元测试通过率 >= 80%
- [ ] Docker 镜像构建成功

### 前端验收标准
- [ ] React 18 + TypeScript 项目结构正确
- [ ] NPM 安装成功（npm install）
- [ ] Vite 构建成功（npm run build）
- [ ] 页面组件可正常渲染
- [ ] 与后端 API 联调成功
- [ ] Docker 镜像构建成功

### 整体验收标准
- [ ] Docker Compose 启动成功
- [ ] 前后端服务可互相通信
- [ ] 完整功能流程可运行
- [ ] README 文档完整

---

## 开发命令

### 后端命令
\`\`\`bash
cd backend
mvn clean package              # 构建项目
mvn spring-boot:run           # 本地运行
docker build -t ${PROJECT_NAME}-backend .   # 构建 Docker 镜像
\`\`\`

### 前端命令
\`\`\`bash
cd frontend
npm install                    # 安装依赖
npm run dev                    # 开发模式
npm run build                  # 生产构建
docker build -t ${PROJECT_NAME}-frontend .  # 构建 Docker 镜像
\`\`\`

### Docker 命令
\`\`\`bash
docker-compose up -d          # 启动所有服务
docker-compose down           # 停止所有服务
docker-compose logs -f        # 查看日志
\`\`\`

---

## 一键执行命令

\`\`\`bash
@sddu ${PROJECT_NAME}
\`\`\`
执行后，全流程自动完成，无需任何人工干预！

---

## 默认配置

- **后端端口**: 8080
- **前端端口**: 5173
- **数据库**: H2 (内存模式)
- **API 路径**: /api/v1

---
*生成时间: $(get_timestamp)*
EOF
    
    print_color "${GRAY}  项目名称：${PROJECT_NAME}${NC}"
    print_color "${GRAY}  提示词文件：${PROMPT_FILE}${NC}"
    print_color "${GREEN}  ✅ 提示词文件创建成功（支持前后端分离架构）${NC}"
    echo ""
}

# Validation phase results tracking
PHASE_RESULTS=()

validate_phase_result() {
    local phase=$1
    local expected_file=$2
    local optional_file=${3:-""}
    
    print_color "${CYAN}[验证] Phase ${phase} 状态检查...${NC}"
    
    local test_dir_path="${TEST_DIR}/.sdd/specs-tree-root/${PROJECT_NAME}"
    
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
    print_color "${GREEN}     SDDU Fullstack 全流程测试完成！${NC}"
    print_color "${CYAN}========================================${NC}"
    echo ""
    
    # Show timing
    print_color "${GRAY}总耗时：$(stop_timer)${NC}"
    echo ""
    
    print_color "📁 测试目录：${CYAN}${TEST_DIR}${NC}"
    echo ""
    print_color "📋 生成的文件:"
    print_color "   - .opencode/plugins/sddu/ (插件文件)"
    print_color "   - .opencode/agents/ (Agent 定义)"
    print_color "   - opencode.json (配置文件)"
    print_color "   - .sdd/ (SDDU 工作空间)"
    print_color "   - backend/ (SpringBoot 后端项目)"
    print_color "   - frontend/ (React 前端项目)"
    print_color "   - docker-compose.yml (Docker 编排)"
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
    print_color "💡 提示：提示词文件已包含前后端分离架构的完整 6 阶段流程！"
    print_color "   后端：SpringBoot 3.x + H2 + Docker"
    print_color "   前端：React 18 + TypeScript + Vite + Docker"
}

# Main execution sequence
main() {
    parse_arguments "$@"
    initialize_test
    
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
    
    # Post-test validation (only if directory exists)
    if [ -d "${TEST_DIR}/.sdd/specs-tree-root/${PROJECT_NAME}" ]; then
        print_color "${CYAN}========================================${NC}"
        print_color "${CYAN}     验证阶段结果${NC}"
        print_color "${CYAN}========================================${NC}"
        echo ""
        validate_phase_result 0 "discovery.md"
        validate_phase_result 1 "spec.md"
        validate_phase_result 2 "plan.md" "decisions/*"
        validate_phase_result 3 "tasks.md"
        validate_phase_result 4 "build-completed"  # Could be specific files generated during code implementation
        validate_phase_result 5 "review.md" 
        validate_phase_result 6 "validation.md"
        
        generate_report
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