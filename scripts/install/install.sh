#!/usr/bin/env bash
# SDDU 安装器 — 纯复制粘贴器（零构建、零打包、零平台分支）
# 用法: install.sh <目标项目目录>
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TEMPLATE="$REPO_ROOT/sddu-project-template"

TARGET="${1:-}"
if [ -z "$TARGET" ]; then
  echo "用法: install.sh <目标项目目录>" >&2
  exit 1
fi

mkdir -p "$TARGET"

# 旧布局迁移：目标已存在 .sddu/ 但非「.sddu/.sddu + workspace 二分」布局
if [ -d "$TARGET/.sddu" ] && [ ! -d "$TARGET/.sddu/.sddu" ]; then
  STAMP="$(date +%Y%m%d%H%M%S)"
  BACKUP="$TARGET/.sddu-migration-backup-$STAMP"
  echo "[迁移] 检测到旧布局，整体备份到 $BACKUP"
  if ! cp -r "$TARGET/.sddu" "$BACKUP"; then
    echo "[回滚] 备份失败，中止安装（未改动目标）" >&2
    exit 1
  fi
  # 旧内容迁入 workspace/（用户产物不丢）
  mkdir -p "$TARGET/.sddu/workspace"
  cp -r "$BACKUP/." "$TARGET/.sddu/workspace/"
  # 清理旧根下产物目录，避免与本体（.sddu/.sddu）冲突
  rm -rf "$TARGET/.sddu/specs-tree-root" "$TARGET/.sddu/docs" "$TARGET/.sddu/docs-tree-root" \
         "$TARGET/.sddu/skills" "$TARGET/.sddu/ROADMAP.md" "$TARGET/.sddu/TREE.md" 2>/dev/null || true
fi

# 纯复制：源路径 = 安装后路径，逐项一致（设计态即运行态）
cp -r "$TEMPLATE/." "$TARGET/"

echo "[完成] SDDU 已安装到 $TARGET"
echo "  本体:  $TARGET/.sddu/.sddu/"
echo "  工作空间: $TARGET/.sddu/workspace/"
echo "  入口索引: $TARGET/.agents/skills/sddu/SKILL.md"
