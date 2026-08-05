#!/usr/bin/env bash
# 附加到运行中的 opencode serve（端口固定 14096，工作目录为项目根目录）
# 用法: scripts/opencode/attach.sh

set -euo pipefail

PORT=14096
HOST=127.0.0.1
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
URL="http://${HOST}:${PORT}"

# 检查服务是否在运行
if ! curl -fsS "${URL}/global/health" >/dev/null 2>&1; then
  echo "!! opencode serve 未运行（${URL}），请先执行: ${SCRIPT_DIR}/restart-serve.sh" >&2
  exit 1
fi

echo "==> attach 到 ${URL}（工作目录 ${PROJECT_ROOT}）"
exec opencode attach "${URL}" --dir "${PROJECT_ROOT}"
