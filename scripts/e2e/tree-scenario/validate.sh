#!/bin/bash
# scripts/e2e/tree-scenario/validate.sh
# Main entry point for all tree scenario E2E tests - FR-124

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "🧪 Starting E2E Tree Scenario Validation"
echo "========================================="

# Setup the test scenario
echo -e "${BLUE}🚀 Step 1: Setting up test scenario${NC}"
bash scripts/e2e/tree-scenario/setup.sh
echo ""

# Run each validation test
echo -e "${BLUE}🔍 Step 2: Running validation tests${NC}"

declare -a tests=(
    "verify-childrens.sh"
    "verify-depth.sh" 
    "verify-cross-tree-deps.sh"
)

pass_count=0
fail_count=0
total_tests=${#tests[@]}

for test in "${tests[@]}"; do
    echo -e "🧪 Running $test..."
    
    if bash "scripts/e2e/tree-scenario/$test"; then
        echo -e "${GREEN}✅ $test: PASSED${NC}"
        ((pass_count++))
    else
        echo -e "${RED}❌ $test: FAILED${NC}"
        ((fail_count++))
    fi
    echo ""
done

echo "📊 E2E Tree Scenario Results"
echo "============================="
echo "Total tests: $total_tests"
echo "Passed: $pass_count" 
echo "Failed: $fail_count"

# Provide summary
if [ $fail_count -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED! Tree Structure Validation Complete.${NC}"
    exit 0
else
    echo -e "${RED}💥 SOME TESTS FAILED! Please check the logs above.${NC}"
    exit 1
fi