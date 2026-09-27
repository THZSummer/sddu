#!/usr/bin/env bash
# =============================================================================
# SDDU Bootstrap (dsh) — 一行命令安装 SDDU dsh Skill 包到你的项目
# =============================================================================
#
# 用法:
#   # 直连 GitHub
#   curl -fsSL https://raw.githubusercontent.com/THZSummer/sddu/main/scripts/bootstrap-dsh.sh | bash -s -- ./my-project
#
#   # 通过镜像（国内用户）
#   curl -fsSL https://gh-proxy.com/https://raw.githubusercontent.com/THZSummer/sddu/main/scripts/bootstrap-dsh.sh | bash -s -- ./my-project --proxy https://gh-proxy.com/
#
#   # 本地执行
#   bash scripts/bootstrap-dsh.sh ./my-project
#   bash scripts/bootstrap-dsh.sh ./my-project --proxy https://gh-proxy.com/
#
# 需要: git, bash, node, npm
#
# 行为: 检查依赖 → clone 仓库 → 调 install-dsh.sh（自动构建 + 安装）→ 打印启动引导
# 与 OpenCode 侧 bootstrap.sh 同构；本脚本只针对 dsh 平台（落位 <project>/.dsh/skills）。
# =============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

TARGET_DIR="."
PROXY_URL=""
REPO_BASE="https://github.com/THZSummer/sddu.git"

# 解析参数
while [[ $# -gt 0 ]]; do
    case "$1" in
        --proxy)
            PROXY_URL="${2%/}"
            shift 2
            ;;
        *)
            TARGET_DIR="$1"
            shift
            ;;
    esac
done

# 构建仓库 URL
if [ -n "$PROXY_URL" ]; then
    REPO_URL="${PROXY_URL}/${REPO_BASE}"
else
    REPO_URL="$REPO_BASE"
fi

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║       SDDU Bootstrap Installer (dsh)    ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════╝${NC}"
echo ""
echo -e "目标项目: ${TARGET_DIR}"
if [ -n "$PROXY_URL" ]; then
    echo -e "网络模式: 镜像 (${PROXY_URL})"
else
    echo -e "网络模式: 直连 GitHub"
fi
echo ""

# 检查依赖（EC-002 语义：依赖缺失明确报错 + 非零退出）
for cmd in git node npm; do
    if ! command -v $cmd &>/dev/null; then
        echo -e "${RED}错误: 需要 $cmd，请先安装${NC}"
        exit 1
    fi
done

# 创建临时目录
TMP_DIR=$(mktemp -d -t sddu-bootstrap-dsh-XXXXXX)
cleanup() { rm -rf "$TMP_DIR"; }
trap cleanup EXIT

echo -e "${CYAN}[1/2] 拉取 SDDU 最新代码...${NC}"
if ! git clone --depth 1 "$REPO_URL" "$TMP_DIR" 2>&1; then
    echo ""
    echo -e "${RED}❌ 克隆失败${NC}"
    echo -e "${YELLOW}提示: 如网络受限，请使用 --proxy 参数指定镜像${NC}"
    echo -e "${YELLOW}  例: bash scripts/bootstrap-dsh.sh ./my-project --proxy https://gh-proxy.com/${NC}"
    exit 1
fi

echo ""
echo -e "${CYAN}[2/2] 构建并安装 dsh Skill 包到目标项目...${NC}"
bash "$TMP_DIR/scripts/install-dsh.sh" --project-root "$TARGET_DIR" --build --yes

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ✅ SDDU (dsh) 安装完成！               ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
echo ""
echo -e "  目标项目: ${TARGET_DIR}"
echo -e "  落位:     ${TARGET_DIR}/.dsh/skills/（11 个 sddu* skill）"
echo -e "  启动:     cd ${TARGET_DIR} && npx @deepseek-ai/dsh web"
echo -e "  入口:     /sddu（仪表盘）或 /sddu discovery <feature>"
echo ""
