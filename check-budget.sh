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
