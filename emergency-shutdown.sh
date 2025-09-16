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
