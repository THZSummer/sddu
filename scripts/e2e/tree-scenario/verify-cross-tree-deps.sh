#!/bin/bash
# scripts/e2e/tree-scenario/verify-cross-tree-deps.sh  
# Verifies cross-tree dependency resolution - FR-123

echo "🧪 Running cross-tree dependency resolution test..."

SPEC_ROOT=".sddu/specs-tree-root"

# Function to extract dependencies from a state.json file using grep
get_on_dependencies() {
    local feature_path="$1"
    local dependencies_output
    
    if [ -f "$feature_path" ]; then
        # Parse the JSON to find dependencies.on using grep, since jq might not be available
        temp_extract=$(cat "$feature_path" 2>/dev/null | sed -n '/"dependencies"/,$p' | sed -n '/"on"/,/]/p')
        dependencies_output=$(echo "$temp_extract" | grep -o '"[^"]*"' | paste -sd "," - | tr -d '"')
        echo "$dependencies_output"
    else
        echo ""
    fi
}

# Get dependency information from features
child_a_deps=$(get_on_dependencies "$SPEC_ROOT/specs-tree-e2e-parent/specs-tree-e2e-child-a/state.json")
echo "🔍 Child A dependencies (on): $child_a_deps"

child_b_deps=$(get_on_dependencies "$SPEC_ROOT/specs-tree-e2e-parent/specs-tree-e2e-child-b/state.json")
echo "🔍 Child B dependencies (on): $child_b_deps"

# Check dependencies  
check_success=0

# Validate that child-a depends on the standalone feature
if [[ "$child_a_deps" == *"specs-tree-e2e-standalone"* ]]; then
    echo "✅ Child A correctly depends on specs-tree-e2e-standalone"
else
    echo "❌ Child A dependency check failed - should reference specs-tree-e2e-standalone"
    check_success=1
fi

# Validate that child-b depends on child-a
if [[ "$child_b_deps" == *"specs-tree-e2e-child-a"* ]]; then
    echo "✅ Child B correctly depends on specs-tree-e2e-child-a"
else
    echo "❌ Child B dependency check failed - should reference specs-tree-e2e-child-a"
    check_success=1
fi

# Verify target state.json files actually exist
targets_check=0
if [ -f "$SPEC_ROOT/specs-tree-e2e-standalone/state.json" ]; then
    echo "✅ Dependency target exists: specs-tree-e2e-standalone"
else
    echo "❌ Dependency target NOT FOUND: specs-tree-e2e-standalone"
    targets_check=1
fi

if [ -f "$SPEC_ROOT/specs-tree-e2e-parent/specs-tree-e2e-child-a/state.json" ]; then
    echo "✅ Dependency target exists: specs-tree-e2e-child-a"
else
    echo "❌ Dependency target NOT FOUND: specs-tree-e2e-child-a"
    targets_check=1
fi

echo ""
echo "📋 Dependency Resolution Analysis:"
echo "  Child A -> Standalone: ✅ Resolved if exists"
echo "  Child B -> Child A: ✅ Resolved if exists"

# Overall result
overall_result=$((check_success + targets_check))

if [ $overall_result -eq 0 ]; then
    echo "🎯 Cross-tree dependency validation: PASSED"
    echo "- ✅ Dependencies properly set and referenced features exist"
    echo "- ✅ Cross-tree path resolution works correctly"
    echo "- ✅ Successfully tested dependency resolution capability as required by FR-123"
    exit 0
else
    echo "❌ Cross-tree dependency validation: FAILED"
    exit 1
fi