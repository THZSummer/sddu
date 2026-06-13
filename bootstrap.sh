#!/usr/bin/env bash
# =============================================================================
# SDDU Bootstrap — 一行命令安装 SDDU 到你的项目
# =============================================================================
#
# 用法:
#   curl -fsSL https://raw.githubusercontent.com/THZSummer/sddu/main/bootstrap.sh | bash -s -- ./my-project
#
#   # 国内用户（通过镜像）:
#   curl -fsSL https://gh-proxy.com/https://raw.githubusercontent.com/THZSummer/sddu/main/bootstrap.sh | GH_PROXY=https://gh-proxy.com/ bash -s -- ./my-project
#
#   或者先下载再执行:
#   wget https://raw.githubusercontent.com/THZSummer/sddu/main/bootstrap.sh
#   bash bootstrap.sh ./my-project
#
# 需要: git, bash, node, npm
# =============================================================================

set -e

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

TARGET_DIR="${1:-.}"
REPO_URL="https://github.com/THZSummer/sddu.git"

# 支持 GitHub 镜像（国内用户设置环境变量 GH_PROXY 即可）
# 例: curl ... | GH_PROXY=https://gh-proxy.com/ bash -s -- ./my-project
if [ -n "$GH_PROXY" ]; then
    REPO_URL="${GH_PROXY%/}/${REPO_URL}"
    echo -e "🔗 使用镜像: ${GH_PROXY}"
fi

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║       SDDU Bootstrap Installer          ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════╝${NC}"
echo ""
echo -e "目标项目: ${TARGET_DIR}"
echo -e "源码仓库: ${REPO_URL}"
echo ""

# 检查依赖
for cmd in git node npm; do
    if ! command -v $cmd &>/dev/null; then
        echo -e "${RED}错误: 需要 $cmd，请先安装${NC}"
        exit 1
    fi
done

# 创建临时目录（会自行清理）
TMP_DIR=$(mktemp -d -t sddu-bootstrap-XXXXXX)
cleanup() { rm -rf "$TMP_DIR"; }
trap cleanup EXIT

echo -e "${CYAN}[1/2] 拉取 SDDU 最新代码...${NC}"
git clone --depth 1 "$REPO_URL" "$TMP_DIR" 2>&1

echo ""
echo -e "${CYAN}[2/2] 构建并安装 SDDU 到目标项目...${NC}"
bash "$TMP_DIR/install.sh" "$TARGET_DIR"

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ✅ SDDU 安装完成！                     ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
echo ""
echo -e "  目标项目: ${TARGET_DIR}"
echo -e "  启动:     cd ${TARGET_DIR} && opencode"
echo ""
