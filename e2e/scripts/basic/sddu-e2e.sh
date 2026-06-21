#!/usr/bin/env bash
set -e

# Defaults
PROJECT_NAME="${1:-user-login}"
AUTO_MODE=false
REPORT_MODE=false
[[ "$*" == *"--auto"* ]] && AUTO_MODE=true
[[ "$*" == *"--report"* ]] && REPORT_MODE=true

# Base dir
BASE_DIR="${SDDU_TEST_DIR:-$HOME/sddu-test-projects}"
mkdir -p "$BASE_DIR"

# Unique test dir
TEST_DIR="$BASE_DIR/sddu-test-$PROJECT_NAME"
N=1
while [ -d "$TEST_DIR" ]; do
  TEST_DIR="$BASE_DIR/sddu-test-$PROJECT_NAME-$N"
  N=$((N + 1))
done
mkdir -p "$TEST_DIR"

echo "[1/3] 创建测试目录: $TEST_DIR"

# Install SDDU plugin
echo "[2/3] 安装 SDDU 插件..."
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
bash "$SCRIPT_DIR/../../../install.sh" "$TEST_DIR"

# Business description
case "$PROJECT_NAME" in
  *book*)  DESC="一个在线书店系统，支持图书浏览、搜索和购买功能，用户可以管理购物车和查看订单历史。" ;;
  *login*) DESC="一个用户登录注册系统，支持邮箱/密码注册登录，提供个人资料管理和密码重置功能。" ;;
  *todo*)  DESC="一个任务管理系统，支持创建、编辑、删除待办事项，可按优先级和截止日期排序。" ;;
  *blog*)  DESC="一个个人博客系统，支持文章的创建、编辑、发布和评论功能，支持标签分类和归档。" ;;
  *)       DESC="一个轻量级应用系统，提供核心业务功能的数据管理和用户交互接口。" ;;
esac

# Write prompt
echo "[3/3] 生成测试提示词..."
cat > "$TEST_DIR/sddu-test-prompt.md" << EOF
# $PROJECT_NAME

## 业务需求

$DESC

## 技术要求

- TypeScript + Node.js
- 零外部中间件依赖（不用 MySQL/Redis/MQ）
- 数据存储在内存或本地 JSON 文件
- 代码可直接 \`npm install && npm start\` 运行

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
