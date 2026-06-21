#!/usr/bin/env bash
set -e

PROJECT_NAME="${1:-smart-office}"
AUTO_MODE=false
[[ "$*" == *"--auto"* ]] && AUTO_MODE=true
[[ "$*" == *"--report"* ]] && REPORT_MODE=true

BASE_DIR="${SDDU_TEST_DIR:-$HOME/sddu-test-projects}"
mkdir -p "$BASE_DIR"

TEST_DIR="$BASE_DIR/sddu-test-$PROJECT_NAME"
N=1
while [ -d "$TEST_DIR" ]; do
  TEST_DIR="$BASE_DIR/sddu-test-$PROJECT_NAME-$N"
  N=$((N + 1))
done
mkdir -p "$TEST_DIR"

echo "[1/3] 创建测试目录: $TEST_DIR"

echo "[2/3] 安装 SDDU 插件..."
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
bash "$SCRIPT_DIR/../../../install.sh" "$TEST_DIR"

case "$PROJECT_NAME" in
  *office*) DESC="一个智能办公系统，支持员工管理、考勤打卡和审批流程，提供部门协作和数据统计功能。" ;;
  *shop*)   DESC="一个电商平台系统，支持商品管理、订单处理和用户购物流程，包含前后台分离的完整业务。" ;;
  *)        DESC="一个全栈应用系统，提供完整的前后端分离业务功能，涵盖数据管理和用户交互。" ;;
esac

echo "[3/3] 生成测试提示词..."
cat > "$TEST_DIR/sddu-test-prompt.md" << EOF
# $PROJECT_NAME

## 业务需求

$DESC

## 技术栈

- 后端：Java 21 + SpringBoot 3.4.6 + MyBatis 3.0.4 + H2 + Maven
- 前端：React 18 + TypeScript 5 + Vite 5 + Axios
- 部署：Docker Compose

## 项目结构

\`\`\`
backend/    ← SpringBoot 后端
frontend/   ← React 前端
\`\`\`

## 约束

- 全程自动推进，无需人工确认
- 自主决策技术方案

## 执行要求

- 不要反复问我确认，直接按你的判断往下推进
- 技术方案你自己定，不用征求我意见
- 所有阶段一次性走完，中间别停

## 入口

@sddu $PROJECT_NAME
EOF

echo ""
echo "✅ 测试项目就绪"
echo "   cd $TEST_DIR && opencode"
echo "   @sddu $PROJECT_NAME"
