#!/usr/bin/env bash
# =============================================================================
# SDDU 在 dsh平台的 Skill 包卸载脚本（仓库侧脚本，不经宿主运行）
#
#   承载：TASK-006 / FR-008 / EC-007 / ADR-001
#   作用域与安装脚本对称：rank 100 project-dsh → <projectRoot>/.dsh/skills
#                         rank 400 user-dsh   → <dshHome>/skills
#
#   行为要点：
#     - 只清理 SDDU 自有的条目（精确名 `sddu` + 前缀 `sddu-*`），无通配误删风险
#     - 额外安全闸：候选目录必须含 provenance 标识（SKILL.md 内 `sddu-source:`），
#       避免误删用户自建的近义目录；确需强制删除时使用 --force
#     - 卸载后执行**残留校验二次扫描**；仍有残留则非零退出
#     - --dry-run 只打印计划，不产生任何副作用
#     - 本脚本只做文件操作，不调用宿主子命令（宿主无 CLI）
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"

# ---------------------------------------------------------------------------
# 落位与命名常量（与 install.sh / src/adapters/dsh/index.ts / docs/dsh/README.md 同源）
# ---------------------------------------------------------------------------
PROJECT_RANK=100                             # rank 100 = project-dsh
USER_RANK=400                                # rank 400 = user-dsh
PROJECT_SKILLS_REL=".dsh/skills"             # <projectRoot>/.dsh/skills
USER_SKILLS_SUBDIR="skills"                  # <dshHome>/skills
SKILL_PREFIX="sddu-"
ROUTER_SKILL="sddu"
PROVENANCE_MARKER="sddu-source:"
VERIFICATION_DOC="docs/dsh/verification.md"

SCOPE="project"
PROJECT_ROOT=""
DSH_HOME="${DSH_HOME:-${HOME}/.dsh}"
DRY_RUN=0
FORCE=0

usage() {
  cat <<'EOF'
SDDU 平台适配 Skill 包卸载脚本（dsh）

用法:
  scripts/install/dsh/uninstall.sh [选项]

选项:
  --scope project|user   落位作用域（默认 project = rank 100；user = rank 400）
  --project-root <path>  项目根目录（默认：当前工作目录）
  --dsh-home <path>      宿主 home 目录（--scope user 时使用，默认：$HOME/.dsh）
  --dry-run              只打印将删除的条目，不产生任何副作用
  --force                跳过 provenance 校验，强制删除 sddu / sddu-* 条目
  -h, --help             显示本帮助并退出（无任何副作用）

落位说明:
  --scope project  → rank 100  <projectRoot>/.dsh/skills
  --scope user     → rank 400  <dshHome>/skills

安全说明:
  - 仅匹配精确名 "sddu"（路由 Skill）与前缀 "sddu-*"（其余 10 个），不使用宽松通配；
  - 默认要求候选目录内含 provenance 标识 `sddu-source:`，否则跳过并提示（--force 可覆盖）；
  - 卸载后会二次扫描残留，仍有残留则以非零退出码收尾。
EOF
}

# ---- 参数解析（--help 在任何副作用之前处理）--------------------------------
while [[ $# -gt 0 ]]; do
  case "$1" in
    --scope)
      SCOPE="${2:-}"
      shift 2
      ;;
    --project-root)
      PROJECT_ROOT="${2:-}"
      shift 2
      ;;
    --dsh-home)
      DSH_HOME="${2:-}"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    --force)
      FORCE=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "❌ 未知参数: $1" >&2
      echo "运行 'scripts/install/dsh/uninstall.sh --help' 查看用法。" >&2
      exit 2
      ;;
  esac
done

# ---- 落位目标与 rank 解析 ---------------------------------------------------
case "${SCOPE}" in
  project)
    [[ -n "${PROJECT_ROOT}" ]] || PROJECT_ROOT="$(pwd)"
    TARGET_DIR="${PROJECT_ROOT}/${PROJECT_SKILLS_REL}"
    TARGET_RANK="${PROJECT_RANK}"
    TARGET_RANK_NAME="project-dsh"
    ;;
  user)
    TARGET_DIR="${DSH_HOME}/${USER_SKILLS_SUBDIR}"
    TARGET_RANK="${USER_RANK}"
    TARGET_RANK_NAME="user-dsh"
    ;;
  *)
    echo "❌ 非法 --scope 值: '${SCOPE}'（允许: project | user）" >&2
    exit 2
    ;;
esac

echo "🧹 SDDU 平台适配 Skill 包卸载"
echo "---------------------------------------------"
echo "  目标目录   : ${TARGET_DIR}"
echo "  命中 rank  : rank ${TARGET_RANK} (${TARGET_RANK_NAME})"
echo "  作用域     : ${SCOPE}"
echo "  模式       : $( [[ ${DRY_RUN} -eq 1 ]] && echo 'dry-run（不删除）' || echo '实际删除' )"
echo "---------------------------------------------"

if [[ ! -d "${TARGET_DIR}" ]]; then
  echo "ℹ️  目标目录不存在，无需卸载: ${TARGET_DIR}"
  echo "   残留校验：通过（无残留）"
  exit 0
fi

# ---- 收集候选：精确名 sddu + 前缀 sddu-* ------------------------------------
CANDIDATES=()
for entry in "${TARGET_DIR}"/*; do
  [[ -d "${entry}" ]] || continue
  base="$(basename "${entry}")"
  if [[ "${base}" == "${ROUTER_SKILL}" || "${base}" == "${SKILL_PREFIX}"* ]]; then
    CANDIDATES+=("${base}")
  fi
done

if [[ ${#CANDIDATES[@]} -eq 0 ]]; then
  echo "ℹ️  未发现 SDDU 自有条目（sddu / sddu-*）。"
  echo "   残留校验：通过（无残留）"
  exit 0
fi

REMOVED=0
SKIPPED=()
for name in "${CANDIDATES[@]}"; do
  dest="${TARGET_DIR}/${name}"
  skill_md="${dest}/SKILL.md"

  # 安全闸：provenance 校验（确认是本包安装的条目）
  if [[ ${FORCE} -ne 1 ]]; then
    if [[ ! -f "${skill_md}" ]] || ! grep -q "${PROVENANCE_MARKER}" "${skill_md}" 2>/dev/null; then
      SKIPPED+=("${name}（缺少 provenance 标识 ${PROVENANCE_MARKER}，可能非本包条目）")
      continue
    fi
  fi

  if [[ ${DRY_RUN} -eq 1 ]]; then
    echo "  🔎 [dry-run] 将删除: ${dest}"
  else
    rm -rf "${dest}"
    echo "  🗑️  已删除: ${dest}"
  fi
  REMOVED=$((REMOVED + 1))
done

if [[ ${#SKIPPED[@]} -gt 0 ]]; then
  echo ""
  echo "  ⚠️ EC-002 提示：以下条目因安全闸被跳过（未删除）："
  for item in "${SKIPPED[@]}"; do
    echo "    - ${item}"
  done
  echo "     如确认它们属于 SDDU 旧版本残留，可加 --force 重跑。"
fi

# ---- 残留校验（二次扫描）----------------------------------------------------
echo ""
echo "🔍 残留校验（二次扫描：sddu / sddu-*）"
echo "---------------------------------------------"

if [[ ${DRY_RUN} -eq 1 ]]; then
  echo "  ℹ️ dry-run 模式跳过残留断言（未做任何删除）。"
  echo "  计划删除条目数: ${REMOVED}"
  echo "---------------------------------------------"
  exit 0
fi

RESIDUE=()
for entry in "${TARGET_DIR}"/*; do
  [[ -d "${entry}" ]] || continue
  base="$(basename "${entry}")"
  if [[ "${base}" == "${ROUTER_SKILL}" || "${base}" == "${SKILL_PREFIX}"* ]]; then
    RESIDUE+=("${base}")
  fi
done

echo "  删除条目数 : ${REMOVED}"
echo "  跳过条目数 : ${#SKIPPED[@]}"
echo "  残留条目数 : ${#RESIDUE[@]}"

if [[ ${#RESIDUE[@]} -gt 0 ]]; then
  echo "  ❌ 仍检测到残留条目："
  for item in "${RESIDUE[@]}"; do
    echo "    - ${TARGET_DIR}/${item}"
  done
  echo "---------------------------------------------"
  echo "❌ 残留校验未通过。请人工确认后重试（或使用 --force）。"
  exit 1
fi

echo "  ✅ 残留校验通过：目标目录中已无 sddu / sddu-* 条目。"
echo "---------------------------------------------"
echo ""
echo "🔄 EC-004 发现缓存失效提示"
echo "  ⚠️ 本次卸载改变了 skills 目录内容，请确认宿主触发 skills/change 事件并"
echo "     重新快照发现缓存，避免出现仍可见的陈旧条目。"
echo ""
echo "🧪 下一步：V1 自检 —— 在宿主 Web UI 的 skill 列表中确认 SDDU 条目已消失"
echo "   （完整步骤见 ${VERIFICATION_DOC} 的 V1 场景）。"
echo ""
echo "✅ 卸载完成。"
