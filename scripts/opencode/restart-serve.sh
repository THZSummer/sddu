#!/usr/bin/env bash
# 重启 opencode serve（端口固定 14096，工作目录为项目根目录）
# 用法: scripts/opencode/restart-serve.sh

set -euo pipefail

PORT=14096
HOST=127.0.0.1
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
LOG_FILE="${PROJECT_ROOT}/.opencode/logs/opencode-serve-${PORT}.log"
PID_FILE="${PROJECT_ROOT}/.opencode/logs/opencode-serve-${PORT}.pid"
URL="http://${HOST}:${PORT}"

mkdir -p "$(dirname "${LOG_FILE}")"

# 获取占用指定端口的进程 PID（lsof 优先，回退 fuser）
port_pids() {
  if command -v lsof >/dev/null 2>&1; then
    lsof -ti:"${PORT}" 2>/dev/null || true
  elif command -v fuser >/dev/null 2>&1; then
    fuser "${PORT}/tcp" 2>/dev/null | tr -s ' ' '\n' | grep -v '^$' || true
  fi
}

# 1. 终止占用端口的旧进程
OLD_PIDS="$(port_pids)"
if [[ -n "${OLD_PIDS}" ]]; then
  echo "==> 停止旧 serve（端口 ${PORT}）: ${OLD_PIDS}"
  kill ${OLD_PIDS} 2>/dev/null || true
  sleep 1
  REMAIN="$(port_pids)"
  if [[ -n "${REMAIN}" ]]; then
    echo "    强杀残留进程: ${REMAIN}"
    kill -9 ${REMAIN} 2>/dev/null || true
  fi
else
  echo "==> 端口 ${PORT} 无旧进程，跳过停止"
fi

# 2. 以项目根目录为工作目录启动 serve（serve 不支持 --dir，须 cd 到项目根）
#    setsid 创建新会话，脱离当前进程组，避免脚本/终端退出时连带终止 serve
echo "==> 启动 opencode serve（端口 ${PORT}，工作目录 ${PROJECT_ROOT}）"
cd "${PROJECT_ROOT}"
setsid opencode serve --port "${PORT}" --hostname "${HOST}" \
  </dev/null > "${LOG_FILE}" 2>&1 &
SERVE_PID=$!
echo "${SERVE_PID}" > "${PID_FILE}"

# 3. 健康检查（最多 30 秒；curl 带 --max-time 防止端口半开时无限挂起）
echo "==> 等待健康检查（最多 30 秒）..."
for _ in $(seq 1 30); do
  if curl -fsS --max-time 3 "${URL}/global/health" >/dev/null 2>&1; then
    echo "==> ✓ serve 已就绪: ${URL}（pid ${SERVE_PID}）"
    echo "    日志: ${LOG_FILE}"
    echo "    attach: scripts/opencode/attach.sh"
    exit 0
  fi
  sleep 1
done

echo "!! serve 启动超时，请查看日志: ${LOG_FILE}" >&2
exit 1
