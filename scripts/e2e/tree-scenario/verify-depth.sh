#!/bin/bash
# scripts/e2e/tree-scenario/verify-depth.sh
# Verifies the depth field in each state.json - FR-122

echo "🧪 Running depth field validation test..."

SPEC_ROOT=".sddu/specs-tree-root"

echo "🔍 Validating depth values across the tree structure..."

validate_depth() {
    local feature_path="$1"  
    local expected_depth="$2"
    local feature_name="$3"
    
    if [ ! -f "$feature_path" ]; then
        echo "❌ ERROR: State file not found: $feature_path"
        return 1
    fi
    
    # Extract depth from state.json using multiple fallback methods
    actual_depth=$(cat "$feature_path" | grep -Po '"depth"\s*:\s*\K\d+' | head -n 1)
    
    if [ -z "$actual_depth" ]; then
        echo "⚠️ Warning: Could not extract depth from $feature_path using grep method, trying alternative..."
        # Alternative method if needed
        actual_depth=$(cat "$feature_path" | python3 -c "
import sys, json
try:
    data = json.loads(sys.stdin.read())
    print(data.get('depth', -1))
except:
    print(-1)
" 2>/dev/null)
    fi
    
    if [ "$actual_depth" = "" ] || [ "$actual_depth" = "-1" ]; then
        echo "❌ ERROR: Could not extract depth from $feature_path"
        return 1
    fi
    
    if [ "$actual_depth" -eq "$expected_depth" ]; then
        echo "✅ $feature_name: depth=$actual_depth (expected: $expected_depth) ✓"
        return 0
    else
        echo "❌ ERROR: $feature_name: depth=$actual_depth (expected: $expected_depth) ✗"
        return 1
    fi
}

# Verify each feature's depth
errors=0

# Parent feature: depth should be 1 (first level under root)
if ! validate_depth "$SPEC_ROOT/specs-tree-e2e-parent/state.json" 1 "Parent"; then
    errors=$((errors+1))
fi

# Child A: depth should be 2 (under parent)
if ! validate_depth "$SPEC_ROOT/specs-tree-e2e-parent/specs-tree-e2e-child-a/state.json" 2 "Child A"; then
    errors=$((errors+1))
fi

# Child B: depth should be 2 (under parent)  
if ! validate_depth "$SPEC_ROOT/specs-tree-e2e-parent/specs-tree-e2e-child-b/state.json" 2 "Child B"; then
    errors=$((errors+1))
fi

# Standalone feature: depth should be 1 (first level under root, same as parent)
if ! validate_depth "$SPEC_ROOT/specs-tree-e2e-standalone/state.json" 1 "Standalone"; then
    errors=$((errors+1))
fi

echo ""

if [ "$errors" -eq 0 ]; then
    echo "🎯 Depth field validation: PASSED"
    echo "📊 All depths correctly set:"
    echo "- Parent: depth=1"
    echo "- Child A: depth=2" 
    echo "- Child B: depth=2"
    echo "- Standalone: depth=1"
    exit 0
else
    echo "❌ Depth field validation failed: $errors errors detected"
    exit 1
fi