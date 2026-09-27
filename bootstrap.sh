#!/usr/bin/env bash
# =============================================================================
# SDDU Bootstrap — 一行命令安装 SDDU 到你的项目
# =============================================================================
#
# 用法:
#   # 直连 GitHub（默认安装 opencode 适配）
#   curl -fsSL https://raw.githubusercontent.com/THZSummer/sddu/main/bootstrap.sh | bash -s -- ./my-project
#
#   # 通过镜像（国内用户）
#   curl -fsSL https://gh-proxy.org/https://raw.githubusercontent.com/THZSummer/sddu/main/bootstrap.sh | bash -s -- ./my-project --proxy https://gh-proxy.org/
#
#   # 安装 dsh 适配（--platform dsh）
#   curl -fsSL https://raw.githubusercontent.com/THZSummer/sddu/main/bootstrap.sh | bash -s -- ./my-project --platform dsh
#
#   # 本地执行
#   bash bootstrap.sh ./my-project
#   bash bootstrap.sh ./my-project --platform dsh
#   bash bootstrap.sh ./my-project --proxy https://gh-proxy.org/
#
# 需要: git, bash, node, npm
# =============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

TARGET_DIR="."
PROXY_URL=""
PLATFORM="opencode"
REPO_BASE="https://github.com/THZSummer/sddu.git"

# 解析参数
while [[ $# -gt 0 ]]; do
    case "$1" in
        --proxy)
            PROXY_URL="${2%/}"
            shift 2
            ;;
        --platform)
            PLATFORM="${2:-opencode}"
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
echo -e "${CYAN}║       SDDU Bootstrap Installer          ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════╝${NC}"
echo ""
echo -e "目标项目: ${TARGET_DIR}"
echo -e "适配平台: ${PLATFORM}"
if [ -n "$PROXY_URL" ]; then
    echo -e "网络模式: 镜像 (${PROXY_URL})"
else
    echo -e "网络模式: 直连 GitHub"
fi
echo ""

# 检查依赖
for cmd in git node npm; do
    if ! command -v $cmd &>/dev/null; then
        echo -e "${RED}错误: 需要 $cmd，请先安装${NC}"
        exit 1
    fi
done

# 创建临时目录
TMP_DIR=$(mktemp -d -t sddu-bootstrap-XXXXXX)
cleanup() { rm -rf "$TMP_DIR"; }
trap cleanup EXIT

echo -e "${CYAN}[1/2] 拉取 SDDU 最新代码...${NC}"
if ! git clone --depth 1 "$REPO_URL" "$TMP_DIR" 2>&1; then
    echo ""
    echo -e "${RED}❌ 克隆失败${NC}"
    echo -e "${YELLOW}提示: 如网络受限，请使用 --proxy 参数指定镜像${NC}"
    echo -e "${YELLOW}  例: bash bootstrap.sh ./my-project --proxy https://gh-proxy.org/${NC}"
    exit 1
fi

echo ""
echo -e "${CYAN}[2/2] 构建并安装 SDDU 到目标项目...${NC}"
case "${PLATFORM}" in
    opencode)
        bash "$TMP_DIR/scripts/install/opencode/install.sh" "$TARGET_DIR"
        ;;
    dsh)
        bash "$TMP_DIR/scripts/install/dsh/install.sh" --project-root "$TARGET_DIR" --build --yes
        ;;
    *)
        echo -e "${RED}❌ 非法 --platform 值: '${PLATFORM}'（允许: opencode | dsh）${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ✅ SDDU 安装完成！                     ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
echo ""
echo -e "  目标项目: ${TARGET_DIR}"
if [[ "${PLATFORM}" == "dsh" ]]; then
    echo -e "  落位:     ${TARGET_DIR}/.dsh/skills/（11 个 sddu* skill）"
    echo -e "  启动:     cd ${TARGET_DIR} && npx @deepseek-ai/dsh web"
    echo -e "  入口:     /sddu（仪表盘）或 /sddu discovery <feature>"
else
    echo -e "  启动:     cd ${TARGET_DIR} && opencode"
fi
echo ""
