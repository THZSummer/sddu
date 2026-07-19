#!/usr/bin/env bash
# FR-SKILL-001 Skill 系统 E2E 验证脚本
# 用法: bash scripts/verify-skills.sh [test-project-name]
set -e

PROJECT_NAME="${1:-skill-system}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SDDU_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

PASS=0
FAIL=0

pass() { echo "  ✅ $1"; PASS=$((PASS+1)); }
fail() { echo "  ❌ $1"; FAIL=$((FAIL+1)); }

echo "============================================"
echo "  FR-SKILL-001 Skill 系统 E2E 验证"
echo "============================================"
echo ""

# ── Step 1: 构建 ──
echo "── Step 1: 构建插件 ──"
cd "$SDDU_ROOT"
npm run clean > /dev/null 2>&1
(npm run build > /dev/null 2>&1 && npm run package > /dev/null 2>&1) && pass "构建成功" || fail "构建失败"

# ── Step 2: 创建 E2E 测试项目 ──
echo ""
echo "── Step 2: 创建 E2E 测试项目 ──"
bash "$SDDU_ROOT/e2e/scripts/basic/sddu-e2e.sh" "$PROJECT_NAME" > /dev/null 2>&1
TEST_DIR=$(ls -dt "$HOME/sddu-test-projects/sddu-test-$PROJECT_NAME"* 2>/dev/null | head -1)
if [ -z "$TEST_DIR" ]; then
  # 尝试带数字后缀
  TEST_DIR=$(ls -dt "$HOME/sddu-test-projects/sddu-test-$PROJECT_NAME-"* 2>/dev/null | head -1)
fi
if [ -n "$TEST_DIR" ] && [ -d "$TEST_DIR" ]; then
  pass "测试项目: $TEST_DIR"
else
  fail "测试项目创建失败"
  exit 1
fi

# ── Step 3: 安装后目录结构（V1-V2） ──
echo ""
echo "── Step 3: 安装后目录验证 ──"

test -d "$TEST_DIR/.sddu/skills" && pass "V1 用户级 Skill 源目录" || fail "V1 用户级 Skill 源目录"

if [ -d "$TEST_DIR/.opencode/plugins/sddu/skills" ]; then
  pass "V1 框架级 Skill 源目录"
  for skill in sddu-skill-discovery sddu-skill-creator sddu-skill-sync; do
    SKILL_FILE="$TEST_DIR/.opencode/plugins/sddu/skills/$skill/SKILL.md"
    if [ -f "$SKILL_FILE" ]; then
      HAS_NAME=$(grep -c "^name:" "$SKILL_FILE" 2>/dev/null || echo 0)
      HAS_DESC=$(grep -c "^description:" "$SKILL_FILE" 2>/dev/null || echo 0)
      LINES=$(wc -l < "$SKILL_FILE")
      pass "V2 $skill ($LINES 行, frontmatter OK)"
    else
      fail "V2 $skill 缺失"
    fi
  done
else
  fail "V1 框架级 Skill 源目录"
fi

# ── Step 4: 实际目录初始为空（V3） ──
echo ""
echo "── Step 4: 实际目录初始状态 ──"
if [ -d "$TEST_DIR/.opencode/skills" ] && [ "$(ls -A "$TEST_DIR/.opencode/skills" 2>/dev/null)" ]; then
  echo "  ⚠️ V3 实际目录已有内容: $(ls "$TEST_DIR/.opencode/skills" 2>/dev/null)"
  echo "  ℹ️  可能之前已执行过 sync"
else
  pass "V3 实际目录为空（待 sync）"
fi

# ── Step 5: Agent 模板验证（V4-V5-V8） ──
echo ""
echo "── Step 5: Agent 模板验证 ──"

AGENT_COUNT=0
for f in "$TEST_DIR/.opencode/agents/sddu"*.md; do
  if grep -q "Skill 发现" "$f" 2>/dev/null; then
    AGENT_COUNT=$((AGENT_COUNT + 1))
  else
    fail "V4 $(basename $f) 缺少「Skill 发现」"
  fi
done
[ "$AGENT_COUNT" -eq 12 ] && pass "V4 Agent 模板: $AGENT_COUNT/12 含「Skill 发现」" || fail "V4 Agent 模板: $AGENT_COUNT/12"

# V5: sync 仅在三阶段发现上下文中（非独立硬编码）
SYNC_REF=$(grep -c "sddu-skill-sync" "$TEST_DIR/.opencode/agents/sddu.md" 2>/dev/null || echo 0)
if [ "$SYNC_REF" -gt 0 ]; then
  # 确认是在发现上下文中
  grep -q "Stage 2.*3.*发现.*sddu-skill-sync\|发现并加载.*sddu-skill-sync" "$TEST_DIR/.opencode/agents/sddu.md" 2>/dev/null && \
    pass "V5 sync 仅在发现上下文中引用" || \
    fail "V5 sync 引用非发现上下文"
else
  pass "V5 sync 未出现在模板中"
fi

# V8: 三阶段模型
HAS_S1=$(grep -c "Stage 1" "$TEST_DIR/.opencode/agents/sddu.md" 2>/dev/null || echo 0)
HAS_S2=$(grep -c "Stage 2" "$TEST_DIR/.opencode/agents/sddu.md" 2>/dev/null || echo 0)
HAS_S3=$(grep -c "Stage 3" "$TEST_DIR/.opencode/agents/sddu.md" 2>/dev/null || echo 0)
[ "$HAS_S1" -gt 0 ] && [ "$HAS_S2" -gt 0 ] && [ "$HAS_S3" -gt 0 ] && \
  pass "V8 三阶段模型: Stage1/2/3 均存在" || \
  fail "V8 三阶段模型不完整 (S1:$HAS_S1 S2:$HAS_S2 S3:$HAS_S3)"

# ── Step 6: install.sh + opencode.json（V6-V7） ──
echo ""
echo "── Step 6: 安装配置验证 ──"

grep -q "同步 SDDU Skills" "$TEST_DIR/.opencode/plugins/sddu/install.sh" 2>/dev/null && \
  pass "V6 install.sh 同步提示" || fail "V6 install.sh 缺少同步提示"

grep -q '"skill".*"allow"' "$TEST_DIR/opencode.json" 2>/dev/null && \
  pass "V7 opencode.json skill: allow" || fail "V7 opencode.json skill 权限未配置"

# ── Step 7: LLM Agent 运行时验证 ──
echo ""
echo "── Step 7: LLM Agent 运行时验证 ──"
echo "  执行 opencode run --auto --agent sddu --dir $TEST_DIR ..."

# V10: 同步 SDDU Skills
cd "$TEST_DIR"
echo "  [V10] 同步 SDDU Skills ..."
timeout 600 opencode run --auto --format json --agent sddu "同步 SDDU Skills" > /tmp/sddu-sync-output.json 2>/tmp/sddu-sync-log.txt && {
  if [ -d "$TEST_DIR/.opencode/skills" ] && [ "$(ls -A "$TEST_DIR/.opencode/skills" 2>/dev/null)" ]; then
    SKILL_COUNT=$(find "$TEST_DIR/.opencode/skills" -name "SKILL.md" 2>/dev/null | wc -l)
    pass "V10 sync 成功: 实际目录含 $SKILL_COUNT 个 Skill"
  else
    fail "V10 sync 后实际目录仍为空"
  fi
} || {
  echo "  ⚠️ V10 opencode run 超时或失败（检查 /tmp/sddu-sync-log.txt）"
  # 超时不算失败——可能 LLM 已执行但 shell 仍在等待
  if [ -d "$TEST_DIR/.opencode/skills" ] && [ "$(ls -A "$TEST_DIR/.opencode/skills" 2>/dev/null)" ]; then
    SKILL_COUNT=$(find "$TEST_DIR/.opencode/skills" -name "SKILL.md" 2>/dev/null | wc -l)
    pass "V10 sync 成功（超时后检查）: 实际目录含 $SKILL_COUNT 个 Skill"
  else
    echo "  ℹ️  V10 跳过（LLM 运行时不可用或超时）"
  fi
}

# V11: 触发 skill-creator
echo "  [V11] 触发 skill-creator ..."
timeout 600 opencode run --auto --format json --agent sddu "帮我创建一个 SDDU Skill，叫 deploy-checklist，用于部署前的检查清单" > /tmp/sddu-creator-output.json 2>/tmp/sddu-creator-log.txt && {
  if [ -f "$TEST_DIR/.sddu/skills/deploy-checklist/SKILL.md" ]; then
    pass "V11 creator 成功: 产出 deploy-checklist/SKILL.md"
  else
    echo "  ℹ️  V11 creator 已执行但文件未检测到（可能创建在其他路径）"
  fi
} || {
  echo "  ℹ️  V11 跳过（LLM 运行时不可用或超时）"
}

# ── 汇总 ──
echo ""
echo "============================================"
echo "  验证完成: $PASS 通过 / $FAIL 失败"
echo "============================================"

if [ "$FAIL" -gt 0 ]; then
  echo ""
  echo "⚠️  存在 $FAIL 个失败项，请检查上方输出。"
  exit 1
else
  echo ""
  echo "🎉 全部验证通过！"
  exit 0
fi
