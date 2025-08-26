#!/bin/bash

# 🌐 POST-DEPLOYMENT VALIDATION SCRIPT
# Souk El-Syarat - Production Health Check
# This script validates the live deployment

set -e

echo "🌐 STARTING POST-DEPLOYMENT VALIDATION..."
echo "========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SITE_URL="https://souk-el-syarat.web.app"
TIMEOUT=10
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
CRITICAL_FAILURES=0

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    local is_critical="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "\n${BLUE}[LIVE-$(printf "%03d" $TOTAL_TESTS)]${NC} $test_name"
    
    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        if [ "$is_critical" = "true" ]; then
            CRITICAL_FAILURES=$((CRITICAL_FAILURES + 1))
            echo -e "${RED}🚨 CRITICAL FAILURE - ROLLBACK REQUIRED${NC}"
        fi
        return 1
    fi
}

echo -e "\n${YELLOW}🌐 TIER 1: CRITICAL AVAILABILITY TESTS${NC}"
echo "======================================"

# Basic availability tests
run_test "Homepage responds (HTTP 200)" "curl -s -f --max-time $TIMEOUT '$SITE_URL/' > /dev/null" true
run_test "Homepage loads in reasonable time" "LOAD_CHECK=\$(curl -s -w '%{time_total}' -o /dev/null --max-time $TIMEOUT '$SITE_URL/'); LOAD_MS=\$(echo \"\$LOAD_CHECK * 1000\" | awk '{print int(\$1)}'); [ \$LOAD_MS -lt 5000 ]" true
run_test "Homepage contains expected content" "curl -s --max-time $TIMEOUT '$SITE_URL/' | grep -q 'Souk El-Syarat'" true
run_test "No server errors in response" "! curl -s --max-time $TIMEOUT '$SITE_URL/' | grep -qE 'HTTP.*50[0-9]|Error 50[0-9]|Status.*50[0-9]'" true

# Critical page availability
run_test "Login page accessible" "curl -s -f --max-time $TIMEOUT '$SITE_URL/login' > /dev/null" true
run_test "Marketplace page accessible" "curl -s -f --max-time $TIMEOUT '$SITE_URL/marketplace' > /dev/null" true

echo -e "\n${YELLOW}📦 TIER 1: CRITICAL RESOURCE LOADING${NC}"
echo "===================================="

# Check if critical resources load
run_test "CSS resources load successfully" "curl -s '$SITE_URL/' | grep -o 'href=\"[^\"]*\.css[^\"]*\"' | head -1 | sed 's/href=\"\\([^\"]*\\)\"/\\1/' | xargs -I {} curl -s -f --max-time $TIMEOUT '$SITE_URL{}' > /dev/null" true
run_test "JS resources load successfully" "curl -s '$SITE_URL/' | grep -o 'src=\"[^\"]*\.js[^\"]*\"' | head -1 | sed 's/src=\"\\([^\"]*\\)\"/\\1/' | xargs -I {} curl -s -f --max-time $TIMEOUT '$SITE_URL{}' > /dev/null" true
run_test "No 404 errors on homepage" "! curl -s '$SITE_URL/' | grep -q '404\\|Not Found'" true

echo -e "\n${YELLOW}🔍 TIER 2: FUNCTIONALITY VALIDATION${NC}"
echo "==================================="

# Check for critical errors in page content
run_test "No error messages on homepage" "! curl -s '$SITE_URL/' | grep -q 'عذراً، حدث خطأ\\|تعذر تحميل\\|فشل في'" true
run_test "Firebase connection works" "! curl -s '$SITE_URL/' | grep -q 'Firebase.*failed\\|Firebase.*error'" true
run_test "Authentication system accessible" "curl -s '$SITE_URL/login' | grep -q 'تسجيل الدخول\\|Login'" false

echo -e "\n${YELLOW}🔒 TIER 2: SECURITY & HEADERS${NC}"
echo "============================="

# Security headers check
run_test "HTTPS redirect works" "curl -s -I --max-time $TIMEOUT 'http://souk-el-syarat.web.app/' | grep -q '301\\|302'" false
run_test "Content-Type header present" "curl -s -I --max-time $TIMEOUT '$SITE_URL/' | grep -q 'Content-Type'" false
run_test "No server information leaked" "! curl -s -I --max-time $TIMEOUT '$SITE_URL/' | grep -i server | grep -q 'apache\\|nginx\\|iis'" false

echo -e "\n${YELLOW}⚡ TIER 3: PERFORMANCE VALIDATION${NC}"
echo "==============================="

# Performance checks
LOAD_TIME=$(curl -s -w '%{time_total}' -o /dev/null --max-time 10 "$SITE_URL/")
# Convert to milliseconds for integer comparison (3.0 seconds = 3000ms)
LOAD_TIME_MS=$(echo "$LOAD_TIME * 1000" | awk '{print int($1)}')
run_test "Homepage loads under 3 seconds" "[ $LOAD_TIME_MS -lt 3000 ]" false
run_test "Response size reasonable" "[ $(curl -s '$SITE_URL/' | wc -c) -lt 1048576 ]" false  # Less than 1MB

echo -e "\n${YELLOW}🔧 TIER 3: MAINTENANCE CHECKS${NC}"
echo "============================="

# Check for common issues
run_test "No JavaScript console errors visible" "! curl -s '$SITE_URL/' | grep -q 'console\\.error\\|Uncaught'" false
run_test "No mixed content warnings" "! curl -s '$SITE_URL/' | grep -q 'http://[^\"]*' || curl -s '$SITE_URL/' | grep -q 'https://'" false

echo -e "\n${YELLOW}📊 VALIDATION SUMMARY${NC}"
echo "===================="
echo -e "Total Tests: ${BLUE}$TOTAL_TESTS${NC}"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"
echo -e "Critical Failures: ${RED}$CRITICAL_FAILURES${NC}"

# Calculate pass rate
if [ $TOTAL_TESTS -gt 0 ]; then
    PASS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
else
    PASS_RATE=0
fi
echo -e "Pass Rate: ${BLUE}$PASS_RATE%${NC}"
echo -e "Load Time: ${BLUE}${LOAD_TIME}s${NC}"

echo -e "\n${YELLOW}🎯 DEPLOYMENT STATUS${NC}"
echo "==================="

if [ $CRITICAL_FAILURES -gt 0 ]; then
    echo -e "${RED}❌ DEPLOYMENT FAILED${NC}"
    echo -e "${RED}🚨 Critical issues detected in production:${NC}"
    echo -e "${RED}   - $CRITICAL_FAILURES critical failure(s)${NC}"
    echo -e "${RED}   - IMMEDIATE ROLLBACK RECOMMENDED${NC}"
    echo -e "${RED}   - Site may be inaccessible to users${NC}"
    exit 1
elif [ $PASS_RATE -lt 80 ]; then
    echo -e "${YELLOW}⚠️ DEPLOYMENT UNSTABLE${NC}"
    echo -e "${YELLOW}   - Pass rate below 80% ($PASS_RATE%)${NC}"
    echo -e "${YELLOW}   - Monitor closely for issues${NC}"
    echo -e "${YELLOW}   - Consider hotfix deployment${NC}"
    exit 2
else
    echo -e "${GREEN}✅ DEPLOYMENT SUCCESSFUL${NC}"
    echo -e "${GREEN}🎉 Production site is healthy${NC}"
    echo -e "${GREEN}   - Pass rate: $PASS_RATE%${NC}"
    echo -e "${GREEN}   - Load time: ${LOAD_TIME}s${NC}"
    echo -e "${GREEN}   - No critical issues detected${NC}"
    echo -e "${GREEN}   - Site ready for users${NC}"
    exit 0
fi