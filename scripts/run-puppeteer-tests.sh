#!/bin/bash

echo "================================================"
echo "🧪 RUNNING PUPPETEER COMPREHENSIVE TESTS"
echo "================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Compile TypeScript
echo -e "${BLUE}Step 1: Compiling TypeScript tests...${NC}"
npx tsc tests/puppeteer/full-app-test.ts --outDir tests/puppeteer/dist --module commonjs --target es2020 --lib es2020,dom

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ TypeScript compilation failed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Tests compiled${NC}"

# Run Puppeteer tests
echo -e "\n${BLUE}Step 2: Running Puppeteer tests...${NC}"
node tests/puppeteer/dist/full-app-test.js

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✅ All tests completed successfully${NC}"
else
    echo -e "\n${YELLOW}⚠️ Some tests failed - check report for details${NC}"
fi

# Check if report was generated
if [ -f "puppeteer-test-report.json" ]; then
    echo -e "\n${BLUE}Test Report Summary:${NC}"
    node -e "
        const report = require('./puppeteer-test-report.json');
        console.log('Total Tests:', report.summary.totalTests);
        console.log('Passed:', report.summary.passed);
        console.log('Failed:', report.summary.failed);
        console.log('Success Rate:', report.summary.successRate.toFixed(1) + '%');
        
        if (report.errors.length > 0) {
            console.log('\nErrors Found:');
            report.errors.slice(0, 5).forEach(e => console.log(' -', e));
        }
    "
fi

echo ""
echo "================================================"
echo "📄 Full report: puppeteer-test-report.json"
echo "================================================"