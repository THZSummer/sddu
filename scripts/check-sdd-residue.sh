#!/bin/bash

# SDD 残留检查脚本
# 用于扫描代码库中所有 SDD 引用（应全部改为 SDDU）
# 使用方法：./scripts/check-sdd-residue.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "======================================"
echo "SDD 残留检查工具 v1.0"
echo "======================================"
echo ""
echo "扫描范围：src/"
echo "排除：sddu- (正确的 SDDU 引用)"
echo ""

# 初始化计数器
total_residues=0
template_count=0
comment_count=0
type_count=0
sdd_count=0
test_count=0
compat_count=0

# 1. 扫描模板文件中的 @sdd- 引用（排除 @sddu-）
echo "📋 扫描模板文件中的 @sdd- 引用..."
template_residues=$(grep -rn "@sdd-" "$PROJECT_ROOT/src/templates" --include="*.hbs" 2>/dev/null | grep -v "@sddu-" || echo "")
if [ -n "$template_residues" ]; then
    template_count=$(echo "$template_residues" | wc -l)
    echo "  ❌ 发现 $template_count 处残留:"
    echo "$template_residues" | head -20
    if [ $template_count -gt 20 ]; then
        echo "  ... 还有 $((template_count - 20)) 处"
    fi
else
    echo "  ✅ 无残留"
fi
total_residues=$((total_residues + template_count))
echo ""

# 2. 扫描源码注释中的 SDD 字眼
echo "📝 扫描源码注释中的 'SDD' 字眼..."
comment_residues=$(grep -rn "//.*SDD" "$PROJECT_ROOT/src" --include="*.ts" 2>/dev/null | grep -v "SDDU" || echo "")
if [ -n "$comment_residues" ]; then
    comment_count=$(echo "$comment_residues" | wc -l)
    echo "  ❌ 发现 $comment_count 处残留:"
    echo "$comment_residues" | head -20
    if [ $comment_count -gt 20 ]; then
        echo "  ... 还有 $((comment_count - 20)) 处"
    fi
else
    echo "  ✅ 无残留"
fi
total_residues=$((total_residues + comment_count))
echo ""

# 3. 扫描类型定义中的 Sdd* 命名（排除 Sddu*）
echo "🔧 扫描类型定义中的 Sdd* 命名..."
type_residues=$(grep -rn "Sdd[A-Z]" "$PROJECT_ROOT/src" --include="*.ts" 2>/dev/null | grep -v "Sddu" || echo "")
if [ -n "$type_residues" ]; then
    type_count=$(echo "$type_residues" | wc -l)
    echo "  ❌ 发现 $type_count 处残留:"
    echo "$type_residues" | head -20
    if [ $type_count -gt 20 ]; then
        echo "  ... 还有 $((type_count - 20)) 处"
    fi
else
    echo "  ✅ 无残留"
fi
total_residues=$((total_residues + type_count))
echo ""

# 4. 扫描所有 sdd- 引用（排除 sddu-）
echo "🔍 扫描所有 sdd- 引用..."
sdd_residues=$(grep -rn "sdd-" "$PROJECT_ROOT/src" --include="*.ts" --include="*.hbs" 2>/dev/null | grep -v "sddu-" || echo "")
if [ -n "$sdd_residues" ]; then
    sdd_count=$(echo "$sdd_residues" | wc -l)
    echo "  ❌ 发现 $sdd_count 处残留:"
    echo "$sdd_residues" | head -20
    if [ $sdd_count -gt 20 ]; then
        echo "  ... 还有 $((sdd_count - 20)) 处"
    fi
else
    echo "  ✅ 无残留"
fi
total_residues=$((total_residues + sdd_count))
echo ""

# 5. 扫描测试文件中的 Sdd* 命名
echo "🧪 扫描测试文件中的 Sdd* 命名..."
test_residues=$(grep -rn "Sdd[A-Z]" "$PROJECT_ROOT/src" --include="*.test.ts" 2>/dev/null | grep -v "Sddu" || echo "")
if [ -n "$test_residues" ]; then
    test_count=$(echo "$test_residues" | wc -l)
    echo "  ❌ 发现 $test_count 处残留:"
    echo "$test_residues" | head -20
    if [ $test_count -gt 20 ]; then
        echo "  ... 还有 $((test_count - 20)) 处"
    fi
else
    echo "  ✅ 无残留"
fi
total_residues=$((total_residues + test_count))
echo ""

# 6. 扫描向后兼容代码
echo "⚠️  扫描向后兼容代码..."
compat_residues=$(grep -rn "backward compatibility\|legacy\|deprecated" "$PROJECT_ROOT/src" --include="*.ts" --include="*.hbs" 2>/dev/null | grep -v "migrate-v1-to-v2\|legacy/auth.js" || echo "")
if [ -n "$compat_residues" ]; then
    compat_count=$(echo "$compat_residues" | wc -l)
    echo "  ⚠️  发现 $compat_count 处向后兼容描述:"
    echo "$compat_residues" | head -20
    if [ $compat_count -gt 20 ]; then
        echo "  ... 还有 $((compat_count - 20)) 处"
    fi
else
    echo "  ✅ 无残留"
fi
total_residues=$((total_residues + compat_count))
echo ""

# 计算文件总数
total_files=$(find "$PROJECT_ROOT/src" -type f \( -name "*.ts" -o -name "*.hbs" \) | wc -l)

# 计算残留率
if [ $total_files -gt 0 ]; then
    residue_rate=$(awk "BEGIN {printf \"%.2f\", ($total_residues / $total_files) * 100}")
else
    residue_rate="0.00"
fi

# 输出总结
echo "======================================"
echo "📊 检查报告总结"
echo "======================================"
echo ""
echo "扫描文件总数：$total_files"
echo "发现残留总数：$total_residues"
echo "残留率：${residue_rate}%"
echo ""
echo "分类统计:"
[ $template_count -gt 0 ] && echo "  - 模板文件：$template_count"
[ $comment_count -gt 0 ] && echo "  - 源码注释：$comment_count"
[ $type_count -gt 0 ] && echo "  - 类型定义：$type_count"
[ $sdd_count -gt 0 ] && echo "  - sdd- 引用：$sdd_count"
[ $test_count -gt 0 ] && echo "  - 测试文件：$test_count"
[ $compat_count -gt 0 ] && echo "  - 向后兼容：$compat_count"
echo ""

# 判断是否通过
if [ $total_residues -eq 0 ]; then
    echo "✅ 通过！无 SDD 残留"
    exit 0
elif [ $(echo "$residue_rate <= 2" | bc -l 2>/dev/null || echo "0") -eq 1 ]; then
    echo "⚠️  警告：残留率 ${residue_rate}% ≤ 2%，可接受"
    exit 0
else
    echo "❌ 失败：残留率 ${residue_rate}% > 2%，需要清理"
    exit 1
fi
