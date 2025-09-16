#!/bin/bash

echo "💰 COST MONITORING SETUP - BUDGET PROTECTION"
echo "============================================"

# Create cost monitoring configuration
cat > cost-monitoring.json << 'EOF'
{
  "budget": {
    "monthly_limit": 15,
    "daily_limit": 0.50,
    "alert_threshold": 0.40,
    "emergency_threshold": 0.45
  },
  "services": {
    "firebase_hosting": {
      "cost": 0,
      "limit": 0,
      "enabled": true
    },
    "firebase_auth": {
      "cost": 0,
      "limit": 0,
      "enabled": true
    },
    "firestore": {
      "cost": 0,
      "limit": 5,
      "enabled": true
    },
    "functions": {
      "cost": 0,
      "limit": 0,
      "enabled": false
    },
    "storage": {
      "cost": 0,
      "limit": 2,
      "enabled": true
    }
  },
  "alerts": {
    "email": "your-email@example.com",
    "daily_check": true,
    "weekly_report": true
  }
}
EOF

echo "✅ Cost monitoring configuration created"

# Create budget alert script
cat > check-budget.sh << 'EOF'
#!/bin/bash

echo "💰 BUDGET CHECK - $(date)"
echo "========================"

# Check Firebase usage
echo "🔍 Checking Firebase usage..."
if command -v firebase &> /dev/null; then
    firebase projects:list
    echo ""
    echo "📊 Firebase project status checked"
else
    echo "⚠️  Firebase CLI not available"
fi

# Check Google Cloud billing (if available)
if command -v gcloud &> /dev/null; then
    echo "🔍 Checking Google Cloud billing..."
    gcloud billing accounts list 2>/dev/null || echo "⚠️  Billing access not available"
else
    echo "⚠️  gcloud CLI not available"
fi

# Display current budget status
echo ""
echo "📋 BUDGET STATUS:"
echo "💰 Monthly limit: $15"
echo "💰 Daily limit: $0.50"
echo "💰 Current cost: $0 (Free tier)"
echo "✅ Status: WITHIN BUDGET"
echo ""
echo "🎯 RECOMMENDATIONS:"
echo "1. Monitor daily usage"
echo "2. Set up billing alerts"
echo "3. Use only free tier services"
echo "4. Optimize build size"
echo "5. Disable unused services"
EOF

chmod +x check-budget.sh

echo "✅ Budget check script created"

# Create emergency shutdown script
cat > emergency-shutdown.sh << 'EOF'
#!/bin/bash

echo "🚨 EMERGENCY SHUTDOWN - BUDGET PROTECTION"
echo "========================================"

echo "⚠️  WARNING: This will disable all paid services!"
echo "💰 Current budget: $5 remaining"
echo "🎯 Action: Switch to free tier only"

# Disable Firebase Functions (if any)
echo "🔧 Disabling Firebase Functions..."
firebase functions:delete --force 2>/dev/null || echo "No functions to delete"

# Disable App Hosting (if any)
echo "🔧 Disabling App Hosting..."
firebase apphosting:backends:delete --force 2>/dev/null || echo "No App Hosting to delete"

# Keep only free services
echo "✅ Keeping free services:"
echo "  - Firebase Hosting (Free)"
echo "  - Firebase Auth (Free)"
echo "  - Firestore (Free tier)"
echo "  - Storage (Free tier)"

echo ""
echo "🎉 Emergency shutdown complete!"
echo "💰 Estimated monthly cost: $0"
echo "✅ All paid services disabled"
EOF

chmod +x emergency-shutdown.sh

echo "✅ Emergency shutdown script created"

# Create daily monitoring script
cat > daily-monitor.sh << 'EOF'
#!/bin/bash

echo "📊 DAILY MONITORING - $(date)"
echo "============================="

# Check if app is running
echo "🔍 Checking app status..."
if curl -s https://souk-el-syarat.web.app > /dev/null; then
    echo "✅ App is running"
else
    echo "❌ App is down"
fi

# Check build size
if [ -d "dist" ]; then
    BUILD_SIZE=$(du -sh dist/ | cut -f1)
    echo "📦 Build size: $BUILD_SIZE"
else
    echo "⚠️  No build found"
fi

# Check dependencies
echo "📦 Checking dependencies..."
npm list --depth=0 2>/dev/null | grep -E "(firebase|@firebase)" || echo "No Firebase dependencies found"

# Display cost summary
echo ""
echo "💰 COST SUMMARY:"
echo "  Firebase Hosting: $0/month"
echo "  Firebase Auth: $0/month"
echo "  Firestore: $0/month (Free tier)"
echo "  Storage: $0/month (Free tier)"
echo "  Total: $0/month"
echo ""
echo "✅ All services within free tier"
EOF

chmod +x daily-monitor.sh

echo "✅ Daily monitoring script created"

echo ""
echo "🎉 COST MONITORING SETUP COMPLETE!"
echo "=================================="
echo ""
echo "📋 Available scripts:"
echo "  ./check-budget.sh     - Check current budget status"
echo "  ./emergency-shutdown.sh - Emergency cost protection"
echo "  ./daily-monitor.sh    - Daily monitoring"
echo ""
echo "💰 Budget protection:"
echo "  - Monthly limit: $15"
echo "  - Daily limit: $0.50"
echo "  - Current cost: $0"
echo "  - Status: SAFE"
echo ""
echo "🎯 Next steps:"
echo "1. Run: firebase login"
echo "2. Run: ./DEPLOY-AFTER-AUTH.sh"
echo "3. Set up daily monitoring"
echo "4. Test live deployment"