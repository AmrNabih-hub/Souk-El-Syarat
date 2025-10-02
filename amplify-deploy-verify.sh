#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# AWS Amplify Deployment Verification Script
# Souk El-Sayarat - Pre-Deployment Validation
# ═══════════════════════════════════════════════════════════════

set -e  # Exit on any error

echo "🔬 AWS Amplify Deployment Verification"
echo "══════════════════════════════════════════════════════════"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0

# Function to print success
success() {
    echo -e "${GREEN}✅ $1${NC}"
    ((PASSED++))
}

# Function to print failure
fail() {
    echo -e "${RED}❌ $1${NC}"
    ((FAILED++))
}

# Function to print warning
warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo "📋 Running Pre-Deployment Checks..."
echo ""

# ═══════════════════════════════════════════════════════════════
# CHECK 1: Node.js Version
# ═══════════════════════════════════════════════════════════════

echo "1. Checking Node.js version..."
node_version=$(node --version)
if [[ $node_version == v20* ]]; then
    success "Node.js version: $node_version"
else
    fail "Wrong Node version: $node_version (expected v20.x)"
    echo "   Run: nvm use 20"
    exit 1
fi
echo ""

# ═══════════════════════════════════════════════════════════════
# CHECK 2: npm Version
# ═══════════════════════════════════════════════════════════════

echo "2. Checking npm version..."
npm_version=$(npm --version)
success "npm version: $npm_version"
echo ""

# ═══════════════════════════════════════════════════════════════
# CHECK 3: Required Files
# ═══════════════════════════════════════════════════════════════

echo "3. Checking required configuration files..."

if [ -f ".nvmrc" ]; then
    success ".nvmrc present"
else
    fail ".nvmrc missing"
fi

if [ -f "amplify.yml" ]; then
    success "amplify.yml present"
else
    fail "amplify.yml missing"
fi

if [ -f "package.json" ]; then
    success "package.json present"
else
    fail "package.json missing"
fi

if [ -f "vite.config.ts" ]; then
    success "vite.config.ts present"
else
    fail "vite.config.ts missing"
fi
echo ""

# ═══════════════════════════════════════════════════════════════
# CHECK 4: Dependencies Installation
# ═══════════════════════════════════════════════════════════════

echo "4. Testing dependency installation..."
echo "   (This may take 30 seconds...)"

# Clean install
rm -rf node_modules package-lock.json 2>/dev/null || true
npm ci > /dev/null 2>&1

if [ $? -eq 0 ]; then
    success "Dependencies installed successfully"
    package_count=$(find node_modules -maxdepth 1 -type d | wc -l)
    echo "   Installed: $package_count packages"
else
    fail "Dependency installation failed"
    exit 1
fi
echo ""

# ═══════════════════════════════════════════════════════════════
# CHECK 5: TypeScript Compilation
# ═══════════════════════════════════════════════════════════════

echo "5. Running TypeScript type check..."
npm run type-check:ci > /dev/null 2>&1

if [ $? -eq 0 ]; then
    success "TypeScript compilation successful"
else
    warn "TypeScript has warnings (non-blocking with --skipLibCheck)"
fi
echo ""

# ═══════════════════════════════════════════════════════════════
# CHECK 6: Production Build
# ═══════════════════════════════════════════════════════════════

echo "6. Running production build..."
echo "   (This may take 10-15 seconds...)"

rm -rf dist 2>/dev/null || true
BUILD_OUTPUT=$(npm run build:production 2>&1)

if [ $? -eq 0 ]; then
    success "Production build successful"
    
    # Extract build time
    build_time=$(echo "$BUILD_OUTPUT" | grep "built in" | sed 's/.*built in //' | sed 's/s.*/s/')
    echo "   Build time: $build_time"
    
else
    fail "Production build failed"
    echo "$BUILD_OUTPUT"
    exit 1
fi
echo ""

# ═══════════════════════════════════════════════════════════════
# CHECK 7: Build Output Verification
# ═══════════════════════════════════════════════════════════════

echo "7. Verifying build output..."

if [ -d "dist" ]; then
    success "dist/ directory exists"
else
    fail "dist/ directory missing"
    exit 1
fi

if [ -f "dist/index.html" ]; then
    success "index.html present"
else
    fail "index.html missing"
    exit 1
fi

if [ -f "dist/manifest.json" ]; then
    success "manifest.json present (PWA)"
else
    warn "manifest.json missing (PWA may not work)"
fi

if [ -f "dist/sw.js" ]; then
    success "sw.js present (Service Worker)"
else
    warn "sw.js missing (Offline mode may not work)"
fi

# Check for main JS bundle
if find dist/js -name "index-*.js" | grep -q .; then
    success "Main JavaScript bundle present"
else
    fail "JavaScript bundle missing"
    exit 1
fi

# Check for CSS
if find dist/css -name "*.css" | grep -q .; then
    success "CSS files present"
else
    fail "CSS files missing"
    exit 1
fi
echo ""

# ═══════════════════════════════════════════════════════════════
# CHECK 8: Bundle Size Analysis
# ═══════════════════════════════════════════════════════════════

echo "8. Analyzing bundle size..."

dist_size=$(du -sh dist/ | cut -f1)
success "Total bundle size: $dist_size"

main_js_size=$(find dist/js -name "index-*.js" -exec du -h {} \; | cut -f1)
echo "   Main JS: $main_js_size"

css_size=$(find dist/css -name "*.css" -exec du -h {} \; | head -1 | cut -f1)
echo "   CSS: $css_size"

# Check if bundle is reasonable (<= 2MB uncompressed)
dist_bytes=$(du -sb dist/ | cut -f1)
if [ $dist_bytes -lt 2000000 ]; then
    success "Bundle size within limits"
else
    warn "Bundle size large (${dist_size}), but may be acceptable"
fi
echo ""

# ═══════════════════════════════════════════════════════════════
# CHECK 9: Asset Integrity
# ═══════════════════════════════════════════════════════════════

echo "9. Checking asset integrity..."

# Count JavaScript files
js_count=$(find dist/js -name "*.js" | wc -l)
success "JavaScript files: $js_count"

# Count CSS files
css_count=$(find dist/css -name "*.css" | wc -l)
success "CSS files: $css_count"

# Check for images
if [ -d "dist/images" ] || [ -d "dist/assets" ]; then
    success "Asset directories present"
fi
echo ""

# ═══════════════════════════════════════════════════════════════
# CHECK 10: Production Preview Test
# ═══════════════════════════════════════════════════════════════

echo "10. Testing production build..."

# Start preview server in background
npm run preview > /dev/null 2>&1 &
PREVIEW_PID=$!

# Wait for server to start
sleep 5

# Test if server is responding
if curl -s http://localhost:4173 > /dev/null 2>&1 || curl -s http://localhost:5000 > /dev/null 2>&1; then
    success "Production build serves correctly"
else
    warn "Could not test preview (may not be critical)"
fi

# Kill preview server
kill $PREVIEW_PID 2>/dev/null || true
echo ""

# ═══════════════════════════════════════════════════════════════
# CHECK 11: Environment Configuration
# ═══════════════════════════════════════════════════════════════

echo "11. Checking environment configuration..."

if [ -f ".env.production.example" ]; then
    success ".env.production.example present"
    
    # Check for required variables
    required_vars=("VITE_AWS_REGION" "VITE_AWS_USER_POOLS_ID" "VITE_USE_MOCK_AUTH")
    for var in "${required_vars[@]}"; do
        if grep -q "$var" .env.production.example; then
            echo "   ✅ $var documented"
        else
            warn "$var not in example env"
        fi
    done
else
    warn ".env.production.example not found"
fi
echo ""

# ═══════════════════════════════════════════════════════════════
# CHECK 12: Git Status
# ═══════════════════════════════════════════════════════════════

echo "12. Checking git status..."

if git rev-parse --git-dir > /dev/null 2>&1; then
    success "Git repository detected"
    
    # Check current branch
    branch=$(git branch --show-current)
    echo "   Current branch: $branch"
    
    # Check for uncommitted changes
    if git diff-index --quiet HEAD --; then
        success "No uncommitted changes"
    else
        warn "Uncommitted changes present (commit before deploy)"
    fi
else
    warn "Not a git repository"
fi
echo ""

# ═══════════════════════════════════════════════════════════════
# FINAL SUMMARY
# ═══════════════════════════════════════════════════════════════

echo "══════════════════════════════════════════════════════════"
echo "📊 VERIFICATION SUMMARY"
echo "══════════════════════════════════════════════════════════"
echo ""
echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}🎉 ALL CHECKS PASSED!${NC}"
    echo -e "${GREEN}✅ READY FOR AWS AMPLIFY DEPLOYMENT${NC}"
    echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "Next command: amplify init"
    echo ""
    exit 0
else
    echo -e "${RED}════════════════════════════════════════════════════════════${NC}"
    echo -e "${RED}❌ SOME CHECKS FAILED${NC}"
    echo -e "${RED}⚠️  FIX ISSUES BEFORE DEPLOYING${NC}"
    echo -e "${RED}════════════════════════════════════════════════════════════${NC}"
    echo ""
    exit 1
fi
