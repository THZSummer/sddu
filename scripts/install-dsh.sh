#!/usr/bin/env bash
# =============================================================================
# SDDU 在 dsh平台的 Skill 包安装脚本（仓库侧脚本，不经宿主运行）
#
#   承载：TASK-006 / FR-008 / ADR-001
#   主落位：rank 100 project-dsh → <projectRoot>/.dsh/skills （推荐，默认）
#   可选落位：rank 400 user-dsh → <dshHome>/skills （--scope user）
#
#   行为要点：
#     - 从 dist/dsh/skills/ 拷贝全部 SDDU Skill 目录（1 个路由 `sddu` + 10 个 `sddu-*` = 11 个）
#     - EC-002：检测到同名 / 近义条目时**显式提示冲突**，不得静默遮蔽
#     - EC-004：安装后提示 skills/change 事件与发现缓存重新快照
#     - 幂等：重复执行为覆盖式安装并给出提示
#     - 本脚本只做文件操作，不调用宿主子命令（宿主无 CLI，见 docs/dsh/verification.md）
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# ---------------------------------------------------------------------------
# 落位与命名常量
# 与 src/adapters/dsh/index.ts、src/adapters/dsh/templates/skill-header.md.hbs、
# docs/dsh/README.md 同源表达，改动必须三处同步（ADR-001 对下游的约束）。
# ---------------------------------------------------------------------------
PROJECT_RANK=100                             # rank 100 = project-dsh
USER_RANK=400                                # rank 400 = user-dsh
PROJECT_SKILLS_REL=".dsh/skills"             # <projectRoot>/.dsh/skills
USER_SKILLS_SUBDIR="skills"                  # <dshHome>/skills
SKILL_PREFIX="sddu-"
ROUTER_SKILL="sddu"
EXPECTED_SKILL_COUNT=11
DEFAULT_SOURCE_DIR="${REPO_ROOT}/dist/dsh/skills"
VERIFICATION_DOC="docs/dsh/verification.md"

SCOPE="project"
PROJECT_ROOT=""
DSH_HOME="${DSH_HOME:-${HOME}/.dsh}"
SOURCE_DIR="${DEFAULT_SOURCE_DIR}"
ASSUME_YES=0

usage() {
  cat <<'EOF'
SDDU 平台适配 Skill 包安装脚本（dsh）

用法:
  scripts/install-dsh.sh [选项]

选项:
  --scope project|user   落位作用域（默认 project = rank 100；user = rank 400）
  --project-root <path>  项目根目录（默认：当前工作目录）
  --dsh-home <path>      宿主 home 目录（--scope user 时使用，默认：$HOME/.dsh）
  --source <path>        Skill 包来源目录（默认：<repo>/dist/dsh/skills）
  --yes                  非交互确认（等价于自动回答 yes）
  -h, --help             显示本帮助并退出（无任何落位副作用）

落位说明:
  --scope project  → rank 100  <projectRoot>/.dsh/skills   （推荐：目录约定即生效）
  --scope user     → rank 400  <dshHome>/skills            （用户在项目间复用）

注意:
  - 命令入口由「指令约定」承载，不是平台级命令注册（已知缺口，见 docs/dsh/README.md）。
  - 安装/卸载后宿主需重新快照 skill 发现缓存（skills/change 事件，见 EC-004）。
  - 本脚本不调用任何宿主子命令（宿主无 CLI）。
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
    --source)
      SOURCE_DIR="${2:-}"
      shift 2
      ;;
    --yes|-y)
      ASSUME_YES=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "❌ 未知参数: $1" >&2
      echo "运行 'scripts/install-dsh.sh --help' 查看用法。" >&2
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

# ---- 来源校验 ---------------------------------------------------------------
if [[ ! -d "${SOURCE_DIR}" ]]; then
  echo "❌ 未找到 Skill 包来源目录: ${SOURCE_DIR}" >&2
  echo "   请先运行 'npm run build'（含 build:dsh）生成 dist/dsh/skills/。" >&2
  exit 1
fi

# 收集 SDDU 拥有的 Skill 目录：精确名 "sddu"（路由） + 前缀 "sddu-*"（其余 10 个）
SDDU_SKILL_DIRS=()
for entry in "${SOURCE_DIR}"/*; do
  [[ -d "${entry}" ]] || continue
  base="$(basename "${entry}")"
  if [[ "${base}" == "${ROUTER_SKILL}" || "${base}" == "${SKILL_PREFIX}"* ]]; then
    SDDU_SKILL_DIRS+=("${base}")
  fi
done

if [[ ${#SDDU_SKILL_DIRS[@]} -ne ${EXPECTED_SKILL_COUNT} ]]; then
  echo "❌ Skill 目录数量不符：期望 ${EXPECTED_SKILL_COUNT} 个，实际 ${#SDDU_SKILL_DIRS[@]} 个" >&2
  printf '   实际收集到: %s\n' "${SDDU_SKILL_DIRS[*]:-<空>}" >&2
  echo "   请先运行 'npm run build'（含 build:dsh）后重试。" >&2
  exit 1
fi

for name in "${SDDU_SKILL_DIRS[@]}"; do
  if [[ ! -s "${SOURCE_DIR}/${name}/SKILL.md" ]]; then
    echo "❌ 来源目录缺少非空 SKILL.md: ${SOURCE_DIR}/${name}/SKILL.md" >&2
    exit 1
  fi
done

if [[ ${ASSUME_YES} -ne 1 && -t 0 ]]; then
  echo "即将安装 ${#SDDU_SKILL_DIRS[@]} 个 Skill 到: ${TARGET_DIR}"
  printf '继续？[y/N] '
  read -r answer || answer=""
  case "${answer}" in
    y|Y|yes|YES) ;;
    *) echo "已取消。"; exit 0 ;;
  esac
fi

# ---- EC-002：同名 / 近义冲突检测（显式提示，不得静默遮蔽）-------------------
CONFLICTS=()
if [[ -d "${TARGET_DIR}" ]]; then
  for existing in "${TARGET_DIR}"/*; do
    [[ -d "${existing}" ]] || continue
    ebase="$(basename "${existing}")"
    # 近义：名字里含 "sddu"（含全部 sddu / sddu-* / sddufoo / xsddu 等变体）
    if [[ "${ebase}" == *"sddu"* ]]; then
      if [[ "${ebase}" == "${ROUTER_SKILL}" ]]; then
        continue  # 同层同名：由本次幂等覆盖处理，单独提示
      fi
      matched=0
      for name in "${SDDU_SKILL_DIRS[@]}"; do
        if [[ "${ebase}" == "${name}" ]]; then matched=1; break; fi
      done
      if [[ ${matched} -eq 0 ]]; then
        CONFLICTS+=("${ebase}")
      fi
    fi
  done
fi

# 其他 rank 目录中的同名条目（会被 rank 100 遮蔽，需提示）
SHADOWED=()
declare -a OTHER_RANK_DIRS=()
if [[ "${SCOPE}" == "project" ]]; then
  OTHER_RANK_DIRS=(
    "${PROJECT_ROOT}/.agents/skills"
    "${DSH_HOME}/${USER_SKILLS_SUBDIR}"
  )
fi
for other in "${OTHER_RANK_DIRS[@]:-}"; do
  [[ -d "${other}" ]] || continue
  for existing in "${other}"/*; do
    [[ -d "${existing}" ]] || continue
    ebase="$(basename "${existing}")"
    if [[ "${ebase}" == "${ROUTER_SKILL}" || "${ebase}" == "${SKILL_PREFIX}"* ]]; then
      SHADOWED+=("${other}/${ebase}")
    fi
  done
done

# ---- 安装（幂等覆盖）--------------------------------------------------------
mkdir -p "${TARGET_DIR}"

echo "📦 SDDU Skill 包安装（dsh平台）"
echo "---------------------------------------------"
echo "  来源目录   : ${SOURCE_DIR}"
echo "  落位目标   : ${TARGET_DIR}"
echo "  命中 rank  : rank ${TARGET_RANK} (${TARGET_RANK_NAME})"
echo "  作用域     : ${SCOPE}"
echo "  安装条目数 : ${#SDDU_SKILL_DIRS[@]}"
echo "---------------------------------------------"

for name in "${SDDU_SKILL_DIRS[@]}"; do
  dest="${TARGET_DIR}/${name}"
  if [[ -d "${dest}" ]]; then
    echo "  ♻️  幂等覆盖: ${name}（目标已存在，按最新构建产物覆盖）"
    rm -rf "${dest}"
  else
    echo "  ✅ 安装: ${name}"
  fi
  cp -R "${SOURCE_DIR}/${name}" "${dest}"
done

# ---- 落位自检清单 -----------------------------------------------------------
echo ""
echo "🔍 落位自检清单"
echo "---------------------------------------------"
echo "  目标绝对路径 : $(cd "${TARGET_DIR}" && pwd)"
echo "  命中 rank    : rank ${TARGET_RANK} (${TARGET_RANK_NAME})"
echo "  本次落位条目 : ${#SDDU_SKILL_DIRS[@]}"
echo "  已落位条目   :"
for name in "${SDDU_SKILL_DIRS[@]}"; do
  if [[ -s "${TARGET_DIR}/${name}/SKILL.md" ]]; then
    echo "    - ${name}/SKILL.md"
  else
    echo "    - ${name}/SKILL.md  ⚠️ 缺失或为空"
  fi
done
echo "---------------------------------------------"

# ---- EC-002：冲突提示（显式，不静默）---------------------------------------
echo ""
echo "⚠️  EC-002 冲突检测（同名 / 近义条目）"
if [[ ${#CONFLICTS[@]} -gt 0 ]]; then
  echo "  ⚠️ 检测到同层近义条目（**不会被本脚本接管，也不会被删除**）："
  for item in "${CONFLICTS[@]}"; do
    echo "    - ${TARGET_DIR}/${item}  → 与本包命名近义，请人工确认是否遮蔽预期"
  done
  echo "  ⚠️ 显式提示：同层同名按 rank 裁决、跨层「最近层优先」；如需保持 SDDU 生效，请重命名或移除上述条目。"
else
  echo "  ✅ 同层未检测到同名 / 近义条目。"
fi
if [[ ${#SHADOWED[@]} -gt 0 ]]; then
  echo "  ⚠️ 检测到其他 rank 层的同名条目（rank 100 会**遮蔽**它们，符合「最近层优先」）："
  for item in "${SHADOWED[@]}"; do
    echo "    - ${item}"
  done
else
  echo "  ✅ 其他 rank 层未检测到同名条目。"
fi

# ---- EC-004：发现缓存重新快照提示 -------------------------------------------
echo ""
echo "🔄 EC-004 发现缓存失效提示"
echo "  ⚠️ 宿主 skill 发现缓存以解析后的 scope 链为键；本次安装改变了 skills 目录内容，"
echo "     请确认宿主触发了 skills/change 事件并**重新快照**发现缓存。"
echo "     若 skill 列表未刷新（出现陈旧缓存），请在会话中重新加载或重启会话后再观测。"
echo "     （宿主无 CLI，无法由本脚本主动触发。）"

# ---- V1 自检指引 -----------------------------------------------------------
echo ""
echo "🧪 下一步：V1 装配可见性自检"
echo "  1) 在宿主 Web UI 中列出 skill，确认 ${#SDDU_SKILL_DIRS[@]} 个 SDDU 条目可见；"
echo "  2) 确认条目的来源标识形如 adapters/dsh@<版本>#2026-08-14（时效可追溯）；"
echo "  3) 完整步骤与通过判据见 ${VERIFICATION_DOC} 的 V1 场景。"
echo ""
echo "✅ 安装完成。卸载请运行: scripts/uninstall-dsh.sh --scope ${SCOPE}"
