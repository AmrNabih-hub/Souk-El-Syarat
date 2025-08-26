#!/bin/bash

# 🧪 PRE-DEPLOYMENT TESTING SCRIPT
# Souk El-Syarat - Professional QA Testing Protocol
# This script MUST pass 100% before any deployment

set -e

echo "🚀 STARTING PRE-DEPLOYMENT TESTING PROTOCOL..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
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
    echo -e "\n${BLUE}[TEST-$(printf "%03d" $TOTAL_TESTS)]${NC} $test_name"
    
    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        if [ "$is_critical" = "true" ]; then
            CRITICAL_FAILURES=$((CRITICAL_FAILURES + 1))
            echo -e "${RED}🚨 CRITICAL FAILURE - DEPLOYMENT BLOCKED${NC}"
        fi
        return 1
    fi
}

echo -e "\n${YELLOW}🔧 TIER 1: CRITICAL BUILD & LINT TESTS${NC}"
echo "========================================"

# Build Tests
run_test "TypeScript compilation" "npx tsc --noEmit" true
run_test "ESLint validation" "npx eslint src --ext .ts,.tsx --max-warnings 0" true
run_test "Production build" "npm run build" true

# Check if build artifacts exist
run_test "Build artifacts exist" "[ -d 'dist' ] && [ -f 'dist/index.html' ]" true
run_test "CSS bundle exists" "find dist/assets -name '*.css' | grep -q ." true
run_test "JS bundle exists" "find dist/assets -name '*.js' | grep -q ." true

echo -e "\n${YELLOW}🔍 TIER 1: CRITICAL FILE VALIDATION${NC}"
echo "===================================="

# Critical file checks
run_test "No firebase-messaging-sw.js in dist" "[ ! -f 'dist/firebase-messaging-sw.js' ]" true
run_test "No sw.js in dist" "[ ! -f 'dist/sw.js' ]" true
run_test "Index.html is valid" "grep -q 'Souk El-Syarat' dist/index.html" true
run_test "No Service Worker registration in HTML" "! grep -q 'registerSW\\|serviceWorker' dist/index.html" true

echo -e "\n${YELLOW}🔧 TIER 1: CRITICAL CODE QUALITY${NC}"
echo "================================="

# Code quality checks
run_test "No console.log in production" "! find src -name '*.tsx' -o -name '*.ts' | xargs grep -l 'console\\.log' | grep -v '.test.' | grep -v '.spec.'" false
run_test "No TODO comments in critical files" "! grep -r 'TODO\\|FIXME' src/App.tsx src/config/firebase.config.ts" false
run_test "No hardcoded localhost URLs" "! grep -r 'localhost' src --include='*.ts' --include='*.tsx'" true

echo -e "\n${YELLOW}📦 TIER 2: BUNDLE ANALYSIS${NC}"
echo "=========================="

# Bundle size checks
run_test "Total bundle size < 2MB" "[ $(du -sb dist | cut -f1) -lt 2097152 ]" false
run_test "No duplicate dependencies" "! npm ls 2>&1 | grep -q 'WARN.*requires.*but will load'" false

echo -e "\n${YELLOW}🔒 TIER 2: SECURITY CHECKS${NC}"
echo "=========================="

# Security validation
run_test "No high severity vulnerabilities" "npm audit --audit-level high --production" false
run_test "No hardcoded secrets" "! grep -r 'password\\|secret\\|key.*=' src --include='*.ts' --include='*.tsx' | grep -v 'firebase.config'" true

echo -e "\n${YELLOW}🌐 TIER 3: DEPLOYMENT READINESS${NC}"
echo "==============================="

# Deployment checks
run_test "Firebase config exists" "[ -f '.firebaserc' ] && [ -f 'firebase.json' ]" true
run_test "Package.json has correct build script" "grep -q '\"build\".*\"vite build\"' package.json" true

echo -e "\n${YELLOW}📊 TESTING SUMMARY${NC}"
echo "=================="
echo -e "Total Tests: ${BLUE}$TOTAL_TESTS${NC}"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"
echo -e "Critical Failures: ${RED}$CRITICAL_FAILURES${NC}"

# Calculate pass rate
PASS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
echo -e "Pass Rate: ${BLUE}$PASS_RATE%${NC}"

echo -e "\n${YELLOW}🎯 DEPLOYMENT DECISION${NC}"
echo "===================="

if [ $CRITICAL_FAILURES -gt 0 ]; then
    echo -e "${RED}❌ DEPLOYMENT BLOCKED${NC}"
    echo -e "${RED}🚨 Critical failures detected. Fix these issues before deployment:${NC}"
    echo -e "${RED}   - $CRITICAL_FAILURES critical test(s) failed${NC}"
    echo -e "${RED}   - Deployment is NOT SAFE${NC}"
    exit 1
elif [ $PASS_RATE -lt 90 ]; then
    echo -e "${YELLOW}⚠️ DEPLOYMENT WARNING${NC}"
    echo -e "${YELLOW}   - Pass rate below 90% ($PASS_RATE%)${NC}"
    echo -e "${YELLOW}   - Consider fixing failed tests before deployment${NC}"
    exit 2
else
    echo -e "${GREEN}✅ DEPLOYMENT APPROVED${NC}"
    echo -e "${GREEN}🎉 All critical tests passed${NC}"
    echo -e "${GREEN}   - Pass rate: $PASS_RATE%${NC}"
    echo -e "${GREEN}   - No critical failures${NC}"
    echo -e "${GREEN}   - Ready for production deployment${NC}"
    exit 0
fi