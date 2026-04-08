#!/usr/bin/env bash
# SDDU 优先端到端测试脚本 (SDD/SDDU E2E Test)
#
# 默认模式：SDDU（主推 @sddu-* 命令系列）
# 兼容模式：SDD（保留 @sdd-* 命令系列，向后兼容用于对比）
#
# 使用方式:
#   # 基本测试 (默认为 SDDU 模式 - 推荐)
#   bash sdd-e2e.sh                       # 使用默认项目名 user-login
#   bash sdd-e2e.sh "项目名称"             # 自定义项目名（小写字母+数字+连字符，字母开头）
#   
#   # 指定模式测试
#   bash sdd-e2e.sh "项目名称" --mode=sddu     # 使用新 SDDU 命令（推荐，默认）
#   bash sdd-e2e.sh "项目名称" --mode=sdd      # 使用旧 SDD 命令（向后兼容，已弃用）
#   bash sdd-e2e.sh "项目名称" --mode=compare  # 比较模式（同时生成新旧两套提示词）
#   
#   # 自动模式
#   bash sdd-e2e.sh "项目名称" --auto          # 自动执行全流程（无需等待用户输入）
#
# 重要说明:
#   - 此脚本默认使用 SDDU 模式（@sddu-* 命令系列） - 新推荐做法
#   - @sdd-* 系列命令（传统 SDD）已标记为向后兼容，仅供历史项目维护
#   - 新项目请使用 @sddu-* 命令系列，提供更好的工作流支持
#   - @sdd-1-spec, @sdd-2-plan, @sdd-3-tasks 等旧命令虽仍工作，但不推荐使用
#
# 执行流程:
#   1. 创建测试目录
#   2. 执行构建和安装脚本
#   3. 根据指定模式生成对应的提示词文件
#   4. (可选) 提供自动验证功能

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

# 默认项目名称
DEFAULT_PROJECT_NAME="user-login"

# 目录前缀
DIR_PREFIX="sdd-test"

# 全局变量
PROJECT_NAME=""
TEST_DIR=""
TEST_DIR_NAME=""
MODE="sddu"  # Default mode
AUTO_MODE=false

# 验证项目名格式：小写字母开头，只能包含小写字母、数字、连字符
validate_project_name() {
    local name="$1"
    # 必须以字母开头，只能包含小写字母、数字、连字符
    if [[ "$name" =~ ^[a-z][a-z0-9-]*$ ]]; then
        return 0
    else
        return 1
    fi
}

# 解析命令行参数
parse_arguments() {
    local args=("$@")
    local i=0
    
    # 设置默认项目名
    PROJECT_NAME="$DEFAULT_PROJECT_NAME"
    
    # 查找项目名参数（非标志参数）
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
    
    # 处理标志参数
    for arg in "${args[@]}"; do
        case "$arg" in
            --mode=sdd)
                MODE="sdd"
                ;;
            --mode=sddu)
                MODE="sddu"
                ;;
            --mode=compare)
                MODE="compare"
                ;;
            --auto)
                AUTO_MODE=true
                ;;
        esac
    done
}

# 生成唯一目录名函数（如果存在则添加数字后缀，统一加前缀）
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

# 生成 SDDU 提示词内容
generate_sddu_prompt_content() {
    local project_name="$1"
    cat << EOF
# SDDU 全流程测试

**项目名称**: ${project_name}

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
@sddu-discovery ${project_name}
\`\`\`
- 自动分析需求
- 自动识别核心功能  
- 自动生成需求文档
- 完成后立即进入 Phase 1

### Phase 1: 规范编写（自动执行）
\`\`\`
@sddu-1-spec ${project_name}
\`\`\`
- 自动定义 API 接口
- 自动设计数据结构
- 自动设定验收标准
- 完成后立即进入 Phase 2

### Phase 2: 技术规划（自动执行）
\`\`\`
@sddu-2-plan ${project_name}
\`\`\`
- 自动设计架构（符合技术栈要求）
- 自动划分模块
- 自动生成技术方案
- 完成后立即进入 Phase 3

### Phase 3: 任务分解（自动执行）
\`\`\`
@sddu-3-tasks ${project_name}
\`\`\`
- 自动拆分任务
- 自动定义依赖关系
- 完成后立即进入 Phase 4

### Phase 4: 代码实现（自动执行）
\`\`\`
@sddu-4-build ${project_name}
\`\`\`
- 自动按任务实现代码
- 自动编写测试
- 确保一键启动
- 完成后立即进入 Phase 5

### Phase 5: 代码审查（自动执行）
\`\`\`
@sddu-5-review ${project_name}
\`\`\`
- 自动代码质量检查
- 自动技术栈合规检查
- 发现问题自动修复
- 完成后立即进入 Phase 6

### Phase 6: 验证确认（自动执行）
\`\`\`
@sddu-6-validate ${project_name}
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
@sddu ${project_name}
\`\`\`
执行后，全流程自动完成，无需任何人工干预！

---
*生成时间: $(get_timestamp)*
EOF
}

# 生成 SDD (旧版) 提示词内容
generate_sdd_prompt_content() {
    local project_name="$1"
    cat << EOF
# SDD 全流程测试

**项目名称**: ${project_name}

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
@sdd-discovery ${project_name}
\`\`\`
- 自动分析需求
- 自动识别核心功能
- 自动生成需求文档
- 完成后立即进入 Phase 1

### Phase 1: 规范编写（自动执行）
\`\`\`
@sdd-1-spec ${project_name}
\`\`\`
- 自动定义 API 接口
- 自动设计数据结构
- 自动设定验收标准
- 完成后立即进入 Phase 2

### Phase 2: 技术规划（自动执行）
\`\`\`
@sdd-2-plan ${project_name}
\`\`\`
- 自动设计架构（符合技术栈要求）
- 自动划分模块
- 自动生成技术方案
- 完成后立即进入 Phase 3

### Phase 3: 任务分解（自动执行）
\`\`\`
@sdd-3-tasks ${project_name}
\`\`\`
- 自动拆分任务
- 自动定义依赖关系
- 完成后立即进入 Phase 4

### Phase 4: 代码实现（自动执行）
\`\`\`
@sdd-4-build ${project_name}
\`\`\`
- 自动按任务实现代码
- 自动编写测试
- 确保一键启动
- 完成后立即进入 Phase 5

### Phase 5: 代码审查（自动执行）
\`\`\`
@sdd-5-review ${project_name}
\`\`\`
- 自动代码质量检查
- 自动技术栈合规检查
- 发现问题自动修复
- 完成后立即进入 Phase 6

### Phase 6: 验证确认（自动执行）
\`\`\`
@sdd-6-validate ${project_name}
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
@sdd 开始 ${project_name}
\`\`\`

执行后，全流程自动完成，无需任何人工干预！

---
*生成时间: $(get_timestamp)*
EOF
}

# 获取并验证项目名和参数
parse_arguments "$@"

# 脚本所在目录（项目根目录）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 基础测试目录
BASE_TEST_DIR="/home/usb/workspace/wks-sddu/wks-sdd-test-projects"

# 生成唯一的测试目录名（使用PROJECT_NAME作为目录名）
TEST_DIR=$(generate_unique_dir "$PROJECT_NAME")
TEST_DIR_NAME=$(basename "$TEST_DIR")

print_color "${CYAN}========================================${NC}"
print_color "${CYAN}     SDD/SDDU 一键测试全流程脚本${NC}"
print_color "${CYAN}========================================${NC}"
print_color "${GRAY}测试项目: ${PROJECT_NAME}${NC}"
print_color "${GRAY}测试目录: ${TEST_DIR}${NC}"
print_color "${GRAY}测试模式: ${MODE}${NC}"
echo ""

# ========== 步骤 1: 创建测试目录 ==========
print_color "${CYAN}[步骤 1/4] 创建测试目录...${NC}"

# 确保 ~/workspace 存在
if [ ! -d "$BASE_TEST_DIR" ]; then
    print_color "${GRAY}  创建基础目录: ${BASE_TEST_DIR}${NC}"
    mkdir -p "$BASE_TEST_DIR"
fi

print_color "${GRAY}  测试目录: ${TEST_DIR}${NC}"
mkdir -p "$TEST_DIR"
print_color "${GREEN}  ✅ 测试目录创建成功: ${TEST_DIR_NAME}${NC}"
echo ""

# ========== 步骤 2: 执行构建脚本 ==========
print_color "${CYAN}[步骤 2/4] 执行构建脚本...${NC}"
cd "$SCRIPT_DIR"

if [ ! -f "build-agents.cjs" ]; then
    print_color "${RED}  ❌ 构建脚本 build-agents.cjs 不存在${NC}"
    exit 1
fi

print_color "${GRAY}  执行: node build-agents.cjs${NC}"
if node build-agents.cjs; then
    print_color "${GREEN}  ✅ 构建成功${NC}"
else
    print_color "${RED}  ❌ 构建失败${NC}"
    exit 1
fi
echo ""

# ========== 步骤 3: 执行安装脚本 ==========
print_color "${CYAN}[步骤 3/4] 执行一键安装脚本...${NC}"

if [ ! -f "install.sh" ]; then
    print_color "${RED}  ❌ 安装脚本 install.sh 不存在${NC}"
    exit 1
fi

print_color "${GRAY}  目标目录: ${TEST_DIR}${NC}"
print_color "${GRAY}  执行: bash install.sh ${TEST_DIR}${NC}"
echo ""

# 执行安装脚本（自动确认更新）
if echo "Y" | bash install.sh "$TEST_DIR"; then
    print_color "${GREEN}  ✅ 安装成功${NC}"
else
    print_color "${RED}  ❌ 安装失败${NC}"
    exit 1
fi
echo ""

# ========== 步骤 4: 创建 测试提示词文件 ==========
print_color "${CYAN}[步骤 4/4] 创建${MODE}测试提示词文件...${NC}"

case "$MODE" in
    "sdd")
        # 生成旧版 SDD 提示词
        PROMPT_FILE_SDD="${TEST_DIR}/sdd-test-prompt.md"
        generate_sdd_prompt_content "$PROJECT_NAME" > "$PROMPT_FILE_SDD"
        print_color "${GRAY}  项目名称: ${PROJECT_NAME}${NC}"
        print_color "${GRAY}  SDD提示词文件: ${PROMPT_FILE_SDD}${NC}"
        print_color "${GREEN}  ✅ SDD提示词文件创建成功${NC}"
        ;;
    
    "sddu")
        # 生成新版 SDDU 提示词
        PROMPT_FILE_SDDU="${TEST_DIR}/sddu-test-prompt.md"
        generate_sddu_prompt_content "$PROJECT_NAME" > "$PROMPT_FILE_SDDU"
        print_color "${GRAY}  项目名称: ${PROJECT_NAME}${NC}"
        print_color "${GRAY}  SDDU提示词文件: ${PROMPT_FILE_SDDU}${NC}"
        print_color "${GREEN}  ✅ SDDU提示词文件创建成功${NC}"
        ;;
    
    "compare")
        # 生成两个版本的提示词
        PROMPT_FILE_SDD="${TEST_DIR}/sdd-test-prompt-old.md"
        PROMPT_FILE_SDDU="${TEST_DIR}/sddu-test-prompt-new.md"
        
        generate_sdd_prompt_content "$PROJECT_NAME" > "$PROMPT_FILE_SDD"
        print_color "${GRAY}  项目名称: ${PROJECT_NAME}${NC}"
        print_color "${GRAY}  SDD提示词文件: ${PROMPT_FILE_SDD}${NC}"
        print_color "${GREEN}  ✅ 旧版(SDD)提示词文件创建成功${NC}"
        
        generate_sddu_prompt_content "$PROJECT_NAME" > "$PROMPT_FILE_SDDU"
        print_color "${GRAY}  SDDU提示词文件: ${PROMPT_FILE_SDDU}${NC}"
        print_color "${GREEN}  ✅ 新版(SDDU)提示词文件创建成功${NC}"
        ;;
esac

print_color "${GRAY}  测试模式: ${MODE}${NC}"
print_color "${GRAY}  项目名称: ${PROJECT_NAME}${NC}"
echo ""

# ========== 完成 ==========
print_color "${CYAN}========================================${NC}"
if [ "$MODE" = "compare" ]; then
    print_color "${GREEN}     新旧版本比较测试流程完成！${NC}"
else
    print_color "${GREEN}     ${MODE} 测试流程完成！${NC}"
fi
print_color "${CYAN}========================================${NC}"
echo ""
print_color "📁 测试目录: ${CYAN}${TEST_DIR}${NC}"
echo ""

if [ "$MODE" = "sdd" ]; then
    print_color "📋 生成的文件:"
    print_color "   - .opencode/plugins/sdd/ (插件文件)"
    print_color "   - .opencode/agents/ (Agent定义)"
    print_color "   - opencode.json (配置文件)"
    print_color "   - .sdd/ (SDD工作空间)"
    print_color "   - ${CYAN}sdd-test-prompt.md${NC} (SDD测试提示词文件)"
elif [ "$MODE" = "sddu" ]; then
    print_color "📋 生成的文件:"
    print_color "   - .opencode/plugins/sddu/ (插件文件)"
    print_color "   - .opencode/agents/ (Agent定义)"
    print_color "   - opencode.json (配置文件)"
    print_color "   - .sdd/ (SDD工作空间)"
    print_color "   - ${CYAN}sddu-test-prompt.md${NC} (SDDU测试提示词文件)"
else
    print_color "📋 生成的文件:"
    print_color "   - .opencode/plugins/sdd*/ (插件文件)"
    print_color "   - .opencode/agents/ (Agent定义)"
    print_color "   - opencode.json (配置文件)"
    print_color "   - .sdd/ (SDD工作空间)"
    print_color "   - ${CYAN}sdd-test-prompt-old.md${NC} (旧版SDD测试提示词文件)"
    print_color "   - ${CYAN}sddu-test-prompt-new.md${NC} (新版SDDU测试提示词文件)"
fi

echo ""
print_color "🚀 快速开始:"
print_color "   ${CYAN}cd ${TEST_DIR}${NC}"
print_color "   ${CYAN}opencode${NC}"
if [ "$MODE" = "sdd" ]; then
    print_color "   ${CYAN}cat sdd-test-prompt.md${NC}  # 查看SDD完整提示词"
    print_color "   ${CYAN}@sdd 开始 ${PROJECT_NAME}${NC}  # 一键执行全流程"
elif [ "$MODE" = "sddu" ]; then
    print_color "   ${CYAN}cat sddu-test-prompt.md${NC}  # 查看SDDU完整提示词"
    print_color "   ${CYAN}@sddu ${PROJECT_NAME}${NC}  # 一键执行全流程"
else
    print_color "   ${CYAN}cat sdd-test-prompt-old.md${NC}   # 查看SDDv1完整提示词"
    print_color "   ${CYAN}cat sddu-test-prompt-new.md${NC} # 查看SDDU完整提示词"
    print_color "   ${CYAN}@sdd 开始 ${PROJECT_NAME}${NC}    # 使用旧版命令"
    print_color "   ${CYAN}@sddu ${PROJECT_NAME}${NC}       # 使用新版命令"
fi
echo ""

if [ "$AUTO_MODE" = false ]; then
    print_color "📝 测试建议:"
    if [ "$MODE" = "compare" ]; then
        print_color "   ${CYAN}1.${NC} 分别在两个不同终端运行测试进行对比"
        print_color "   ${GYAN}   终端1: cd ${TEST_DIR}; opencode; @sdd 开始 ${PROJECT_NAME}${NC}"
        print_color "   ${GYAN}   终端2: cd ${TEST_DIR}; opencode; @sddu ${PROJECT_NAME}${NC}"
    elif [ "$MODE" = "sdd" ]; then
        print_color "   ${CYAN}1.${NC} 运行: ${CYAN}cd ${TEST_DIR}; opencode; @sdd 开始 ${PROJECT_NAME}${NC}"
    else
        print_color "   ${CYAN}1.${NC} 运行: ${CYAN}cd ${TEST_DIR}; opencode; @sddu ${PROJECT_NAME}${NC}"
    fi
    
    if [ "$MODE" = "sddu" ] || [ "$MODE" = "compare" ]; then
        print_color "   ${CYAN}2.${NC} 测试 SDDU 全部 6 个独立命令"
        print_color "      ${CYAN}@sddu-discovery ${PROJECT_NAME}${NC}"
        print_color "      ${CYAN}@sddu-1-spec ${PROJECT_NAME}${NC}"
        print_color "      ${CYAN}@sddu-2-plan ${PROJECT_NAME}${NC}"
        print_color "      ${CYAN}@sddu-3-tasks ${PROJECT_NAME}${NC}"
        print_color "      ${CYAN}@sddu-4-build ${PROJECT_NAME}${NC}"
        print_color "      ${CYAN}@sddu-5-review ${PROJECT_NAME}${NC}"
        print_color "      ${CYAN}@sddu-6-validate ${PROJECT_NAME}${NC}"
    fi
fi

echo ""
print_color "💡 提示说明:"
if [ "$MODE" = "sdd" ]; then
    print_color "   - 当前生成的是传统 @sdd 命令提示词"
    print_color "   - 用于向后兼容性测试"
elif [ "$MODE" = "sddu" ]; then
    print_color "   - 当前生成的是新版 @sddu 命令提示词"
    print_color "   - 包含完整 6 阶段独立指令"
    print_color "   - 符合最新的 SDDU 工作流"
else
    print_color "   - 同时生成新旧两版提示词进行对比测试"
    print_color "   - 可用于评估迁移效果"
fi
