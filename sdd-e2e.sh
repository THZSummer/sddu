#!/usr/bin/env bash
# SDD 端到端测试脚本 (SDD E2E Test)
#
# 使用方式:
#   bash sdd-e2e.sh              # 使用默认项目名 user-login
#   bash sdd-e2e.sh "项目名称"    # 自定义项目名（小写字母+数字+连字符，字母开头）
#
# 执行流程:
#   1. 在 /home/usb/workspace/wks-sdd-test-projects 创建测试目录（自动处理重名）
#   2. 执行构建脚本 (node build-agents.cjs)
#   3. 执行安装脚本 (bash install.sh <目录>)
#   4. 生成 SDD 测试提示词文件

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;90m'
NC='\033[0m'

# Helper function for colored output
print_color() {
    printf "%b\n" "$1"
}

# 默认项目名称
DEFAULT_PROJECT_NAME="user-login"

# 目录前缀
DIR_PREFIX="sdd-test"

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

# 获取并验证项目名
if [ $# -eq 0 ]; then
    # 无参数，使用默认值
    PROJECT_NAME="$DEFAULT_PROJECT_NAME"
else
    # 有参数，验证格式
    if validate_project_name "$1"; then
        PROJECT_NAME="$1"
    else
        print_color "${YELLOW}警告: 项目名 '$1' 格式无效${NC}"
        print_color "${GRAY}项目名必须: 小写字母开头，只能包含小写字母、数字、连字符${NC}"
        print_color "${GRAY}使用默认项目名: $DEFAULT_PROJECT_NAME${NC}"
        PROJECT_NAME="$DEFAULT_PROJECT_NAME"
    fi
fi

# 脚本所在目录（项目根目录）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 基础测试目录
BASE_TEST_DIR="/home/usb/workspace/wks-sdd-test-projects"

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

print_color "${CYAN}========================================${NC}"
print_color "${CYAN}     SDD 一键测试全流程脚本${NC}"
print_color "${CYAN}========================================${NC}"
echo ""

# ========== 步骤 1: 创建测试目录 ==========
print_color "${CYAN}[步骤 1/4] 创建测试目录...${NC}"

# 确保 ~/workspace 存在
if [ ! -d "$BASE_TEST_DIR" ]; then
    print_color "${GRAY}  创建基础目录: ${BASE_TEST_DIR}${NC}"
    mkdir -p "$BASE_TEST_DIR"
fi

# 生成唯一的测试目录名（使用PROJECT_NAME作为目录名）
TEST_DIR=$(generate_unique_dir "$PROJECT_NAME")
TEST_DIR_NAME=$(basename "$TEST_DIR")

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

# ========== 步骤 4: 创建SDD测试提示词文件 ==========
print_color "${CYAN}[步骤 4/4] 创建SDD测试提示词文件...${NC}"

# 创建提示词文件路径
PROMPT_FILE="${TEST_DIR}/sdd-test-prompt.md"

# 生成提示词文件内容
cat > "$PROMPT_FILE" << EOF
# SDD 全流程测试

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
@sdd-discovery ${PROJECT_NAME}
\`\`\`
- 自动分析需求
- 自动识别核心功能
- 自动生成需求文档
- 完成后立即进入 Phase 1

### Phase 1: 规范编写（自动执行）
\`\`\`
@sdd-1-spec ${PROJECT_NAME}
\`\`\`
- 自动定义 API 接口
- 自动设计数据结构
- 自动设定验收标准
- 完成后立即进入 Phase 2

### Phase 2: 技术规划（自动执行）
\`\`\`
@sdd-2-plan ${PROJECT_NAME}
\`\`\`
- 自动设计架构（符合技术栈要求）
- 自动划分模块
- 自动生成技术方案
- 完成后立即进入 Phase 3

### Phase 3: 任务分解（自动执行）
\`\`\`
@sdd-3-tasks ${PROJECT_NAME}
\`\`\`
- 自动拆分任务
- 自动定义依赖关系
- 完成后立即进入 Phase 4

### Phase 4: 代码实现（自动执行）
\`\`\`
@sdd-4-build ${PROJECT_NAME}
\`\`\`
- 自动按任务实现代码
- 自动编写测试
- 确保一键启动
- 完成后立即进入 Phase 5

### Phase 5: 代码审查（自动执行）
\`\`\`
@sdd-5-review ${PROJECT_NAME}
\`\`\`
- 自动代码质量检查
- 自动技术栈合规检查
- 发现问题自动修复
- 完成后立即进入 Phase 6

### Phase 6: 验证确认（自动执行）
\`\`\`
@sdd-6-validate ${PROJECT_NAME}
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
@sdd 开始 ${PROJECT_NAME}
\`\`\`

执行后，全流程自动完成，无需任何人工干预！

---
*生成时间: $(date '+%Y-%m-%d %H:%M:%S')*
EOF

print_color "${GRAY}  项目名称: ${PROJECT_NAME}${NC}"
print_color "${GRAY}  提示词文件: ${PROMPT_FILE}${NC}"
print_color "${GREEN}  ✅ 提示词文件创建成功${NC}"
echo ""

# ========== 完成 ==========
print_color "${CYAN}========================================${NC}"
print_color "${GREEN}     一键测试流程完成！${NC}"
print_color "${CYAN}========================================${NC}"
echo ""
print_color "📁 测试目录: ${CYAN}${TEST_DIR}${NC}"
echo ""
print_color "📋 生成的文件:"
print_color "   - .opencode/plugins/sdd/ (插件文件)"
print_color "   - .opencode/agents/ (Agent定义)"
print_color "   - opencode.json (配置文件)"
print_color "   - .sdd/ (SDD工作空间)"
print_color "   - ${CYAN}sdd-test-prompt.md${NC} (测试提示词文件)"
echo ""
print_color "🚀 快速开始:"
print_color "   ${CYAN}cd ${TEST_DIR}${NC}"
print_color "   ${CYAN}opencode${NC}"
print_color "   ${CYAN}cat sdd-test-prompt.md${NC}  # 查看完整提示词"
print_color "   ${CYAN}@sdd 开始 ${PROJECT_NAME}${NC}  # 一键执行全流程"
echo ""
print_color "📝 提示词预览:"
print_color "   ${GRAY}项目名称: ${PROJECT_NAME}${NC}"
echo ""
print_color "💡 提示: 提示词文件已包含完整的SDD 6阶段流程，可一键执行！"
