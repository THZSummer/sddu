#!/bin/bash
# scripts/e2e/tree-scenario/verify-childrens.sh
# Verifies the childrens array in parent's state.json - FR-121

echo "🧪 Running childrens array validation test..."

SPEC_ROOT=".sddu/specs-tree-root"

if [ ! -f "$SPEC_ROOT/specs-tree-e2e-parent/state.json" ]; then
    echo "❌ ERROR: Parent state file not found"
    exit 1
fi

# Try to validate presence and structure using bash string operations first
parent_content=$(cat "$SPEC_ROOT/specs-tree-e2e-parent/state.json")

echo "🔍 Checking if 'childrens' field exists..."
if echo "$parent_content" | grep -q '"childrens"'; then
    echo "✅ Found 'childrens' field in parent state.json"
else
    echo "❌ ERROR: 'childrens' field missing in parent state.json"
    exit 1
fi

# Count children by pattern matching since we don't have jq in this setup
# Count occurrences of path entries indicating children
children_count=$(echo "$parent_content" | grep -o '"path"' | wc -l)
expected_children=2

echo "📊 Number of children in array: $children_count (expected: $expected_children)"

if [ "$children_count" -eq "$expected_children" ]; then
    echo "✅ Number of children matches expected value"
else
    echo "❌ ERROR: Expected $expected_children children but found $children_count"
    exit 1
fi

# Check the specific child entries exist
if echo "$parent_content" | grep -q 'specs-tree-e2e-child-a' && echo "$parent_content" | grep -q 'specs-tree-e2e-child-b'; then
    echo "✅ Both child entries (child-a and child-b) found in the childrens array"
else
    echo "❌ ERROR: Missing entries for one or both children in the childrens array"
    exit 1
fi

echo "✅ All verification criteria passed for childrens array"

echo "🎯 Childrens array validation: PASSED"
echo ""
echo "📋 Verification results:"
echo "- Field presence: ✅ Childrens field exists"
echo "- Entry count: ✅ Correct count ($expected_children expected, $children_count found)"
echo "- Child-A presence: ✅ Present"
echo "- Child-B presence: ✅ Present"
echo ""

exit 0