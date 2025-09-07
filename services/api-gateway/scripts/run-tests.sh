#!/bin/bash

# Comprehensive Test Runner Script
# This script runs all types of tests with proper error handling and reporting

set -e  # Exit on any error

echo "🧪 Starting Comprehensive Test Suite..."
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create test results directory
mkdir -p test-results

# Function to run tests with error handling
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    echo -e "${BLUE}Running $test_name...${NC}"
    
    if eval "$test_command" > "test-results/$test_name.log" 2>&1; then
        echo -e "${GREEN}✅ $test_name PASSED${NC}"
        return 0
    else
        echo -e "${RED}❌ $test_name FAILED${NC}"
        echo -e "${YELLOW}Check test-results/$test_name.log for details${NC}"
        return 1
    fi
}

# Function to run tests with coverage
run_test_with_coverage() {
    local test_name="$1"
    local test_command="$2"
    
    echo -e "${BLUE}Running $test_name with coverage...${NC}"
    
    if eval "$test_command" > "test-results/$test_name-coverage.log" 2>&1; then
        echo -e "${GREEN}✅ $test_name PASSED with coverage${NC}"
        return 0
    else
        echo -e "${RED}❌ $test_name FAILED with coverage${NC}"
        echo -e "${YELLOW}Check test-results/$test_name-coverage.log for details${NC}"
        return 1
    fi
}

# Track test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 1. Unit Tests
echo -e "\n${YELLOW}1. Running Unit Tests${NC}"
if run_test "unit-tests" "npm run test"; then
    ((PASSED_TESTS++))
else
    ((FAILED_TESTS++))
fi
((TOTAL_TESTS++))

# 2. Unit Tests with Coverage
echo -e "\n${YELLOW}2. Running Unit Tests with Coverage${NC}"
if run_test_with_coverage "unit-tests-coverage" "npm run test:cov"; then
    ((PASSED_TESTS++))
else
    ((FAILED_TESTS++))
fi
((TOTAL_TESTS++))

# 3. E2E Tests
echo -e "\n${YELLOW}3. Running E2E Tests${NC}"
if run_test "e2e-tests" "npm run test:e2e"; then
    ((PASSED_TESTS++))
else
    ((FAILED_TESTS++))
fi
((TOTAL_TESTS++))

# 4. Integration Tests
echo -e "\n${YELLOW}4. Running Integration Tests${NC}"
if run_test "integration-tests" "npm run test:integration"; then
    ((PASSED_TESTS++))
else
    ((FAILED_TESTS++))
fi
((TOTAL_TESTS++))

# 5. Security Tests
echo -e "\n${YELLOW}5. Running Security Tests${NC}"
if run_test "security-tests" "npm run test:security"; then
    ((PASSED_TESTS++))
else
    ((FAILED_TESTS++))
fi
((TOTAL_TESTS++))

# 6. Performance Tests
echo -e "\n${YELLOW}6. Running Performance Tests${NC}"
if run_test "performance-tests" "npm run test:performance"; then
    ((PASSED_TESTS++))
else
    ((FAILED_TESTS++))
fi
((TOTAL_TESTS++))

# 7. Lint Tests
echo -e "\n${YELLOW}7. Running Lint Tests${NC}"
if run_test "lint-tests" "npm run lint"; then
    ((PASSED_TESTS++))
else
    ((FAILED_TESTS++))
fi
((TOTAL_TESTS++))

# 8. Type Check
echo -e "\n${YELLOW}8. Running Type Check${NC}"
if run_test "type-check" "npm run build"; then
    ((PASSED_TESTS++))
else
    ((FAILED_TESTS++))
fi
((TOTAL_TESTS++))

# Generate comprehensive report
echo -e "\n${BLUE}Generating Test Report...${NC}"

cat > test-results/test-report.md << EOF
# Test Report
Generated: $(date)

## Summary
- Total Test Suites: $TOTAL_TESTS
- Passed: $PASSED_TESTS
- Failed: $FAILED_TESTS
- Success Rate: $(( (PASSED_TESTS * 100) / TOTAL_TESTS ))%

## Test Results
EOF

# Add individual test results to report
for log_file in test-results/*.log; do
    if [ -f "$log_file" ]; then
        test_name=$(basename "$log_file" .log)
        echo "### $test_name" >> test-results/test-report.md
        echo '```' >> test-results/test-report.md
        cat "$log_file" >> test-results/test-report.md
        echo '```' >> test-results/test-report.md
        echo "" >> test-results/test-report.md
    fi
done

# Final summary
echo -e "\n${BLUE}======================================"
echo -e "Test Suite Summary"
echo -e "======================================${NC}"
echo -e "Total Test Suites: ${BLUE}$TOTAL_TESTS${NC}"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"
echo -e "Success Rate: ${BLUE}$(( (PASSED_TESTS * 100) / TOTAL_TESTS ))%${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Some tests failed. Check the logs for details.${NC}"
    exit 1
fi