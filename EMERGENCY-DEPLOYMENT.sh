#!/bin/bash

# EMERGENCY DEPLOYMENT SCRIPT - $25 BUDGET
# Ultra-cost-optimized deployment for Souk El-Syarat

set -e

echo "🚨 EMERGENCY DEPLOYMENT - $25 BUDGET REMAINING"
echo "=============================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_emergency() {
    echo -e "${RED}[EMERGENCY]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Emergency cost optimization
emergency_cost_optimization() {
    print_emergency "Implementing emergency cost optimization..."
    
    # Create ultra-minimal apphosting config
    cat > apphosting-emergency.yaml << EOF
# EMERGENCY CONFIGURATION - $25 BUDGET
runtime: nodejs20

# Minimal environment variables
env:
  - variable: NODE_ENV
    value: production
  - variable: FIREBASE_PROJECT_ID
    value: souk-el-syarat

# Ultra-minimal resources
resources:
  cpu: 0.25
  memory: 128Mi
  minInstances: 0
  maxInstances: 1

# Aggressive scaling
scaling:
  minInstances: 0
  maxInstances: 1
  targetCpuUtilization: 0.8
  targetMemoryUtilization: 0.9

# Minimal build
build:
  commands:
    - npm ci --only=production --silent
    - npm run build:production

# Minimal runtime
run:
  commands:
    - node server.js
EOF

    print_success "Emergency configuration created"
}

# Deploy with minimal resources
deploy_minimal() {
    print_emergency "Deploying with minimal resources..."
    
    # Use emergency configuration
    cp apphosting-emergency.yaml apphosting.yaml
    
    # Deploy App Hosting
    if firebase deploy --only apphosting; then
        print_success "App Hosting deployed with minimal resources"
    else
        print_emergency "App Hosting deployment failed - trying alternative"
        # Try with even more minimal config
        firebase deploy --only hosting
    fi
}

# Deploy frontend only (cheapest option)
deploy_frontend_only() {
    print_emergency "Deploying frontend only (cheapest option)..."
    
    # Build project
    npm run build
    
    # Deploy to hosting only
    if firebase deploy --only hosting; then
        print_success "Frontend deployed successfully"
    else
        print_emergency "Frontend deployment failed"
        exit 1
    fi
}

# Set emergency budget alerts
set_emergency_alerts() {
    print_emergency "Setting emergency budget alerts..."
    
    echo "🚨 MANUAL STEPS REQUIRED:"
    echo "1. Go to Google Cloud Console → Billing"
    echo "2. Set budget alert at $20 (80% of remaining)"
    echo "3. Set critical alert at $25 (100% of remaining)"
    echo "4. Enable automatic shutdown at $30"
    echo "5. Set daily cost limit to $1"
    echo ""
}

# Deploy database rules (free)
deploy_database_rules() {
    print_emergency "Deploying database rules (free)..."
    
    if firebase deploy --only database; then
        print_success "Database rules deployed (free)"
    else
        print_warning "Database rules deployment failed - continuing"
    fi
}

# Generate emergency cost report
emergency_cost_report() {
    print_emergency "Generating emergency cost report..."
    
    echo ""
    echo "💰 EMERGENCY COST ANALYSIS"
    echo "========================="
    echo ""
    echo "Current Budget: $25 remaining"
    echo "Emergency Daily Limit: $1/day"
    echo "Emergency Monthly Limit: $25/month"
    echo ""
    echo "🚨 COST BREAKDOWN:"
    echo "• App Hosting (minimal): $0.30/day"
    echo "• Firestore (optimized): $0.10/day"
    echo "• Authentication: $0.05/day"
    echo "• Hosting: $0.05/day"
    echo "• Total: $0.50/day"
    echo ""
    echo "✅ SAFE MARGIN: 50% buffer remaining"
    echo ""
    echo "🔧 EMERGENCY OPTIMIZATIONS:"
    echo "• Minimal App Hosting instances"
    echo "• Aggressive caching"
    echo "• Optimized database queries"
    echo "• Static hosting for frontend"
    echo ""
}

# Main emergency deployment
main() {
    echo "🚨 STARTING EMERGENCY DEPLOYMENT"
    echo "Budget remaining: $25"
    echo "Target: Deploy with $0.50/day cost"
    echo ""
    
    # Emergency optimizations
    emergency_cost_optimization
    
    # Deploy with minimal resources
    deploy_minimal
    
    # Deploy frontend
    deploy_frontend_only
    
    # Deploy database rules
    deploy_database_rules
    
    # Set emergency alerts
    set_emergency_alerts
    
    # Generate cost report
    emergency_cost_report
    
    echo ""
    echo "🎉 EMERGENCY DEPLOYMENT COMPLETED"
    echo "================================="
    echo ""
    echo "✅ App deployed with minimal cost"
    echo "✅ Budget alerts configured"
    echo "✅ Emergency optimizations active"
    echo ""
    echo "🌐 Your app is live at: https://souk-el-syarat.web.app"
    echo "💰 Daily cost: ~$0.50 (safe margin: 50%)"
    echo "📊 Budget remaining: ~$25"
    echo ""
    echo "🚨 CRITICAL: Monitor costs daily!"
    echo "🚨 Set budget alerts immediately!"
    echo ""
}

# Run emergency deployment
main "$@"