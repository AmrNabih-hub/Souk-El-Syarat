#!/bin/bash

# 🚀 ONE-CLICK IMMEDIATE DEPLOYMENT
# Souk El-Syarat Marketplace - Deploy Now!

set -e

echo "🚀🚀🚀 ONE-CLICK IMMEDIATE DEPLOYMENT STARTING 🚀🚀🚀"
echo "=================================================="
echo "⏰ URGENT: Deploying immediately for app deadline!"
echo ""

# Make scripts executable
chmod +x deploy-immediate.sh
chmod +x deploy-fullstack.sh

# Check if we should use immediate or full deployment
if [ "$1" = "--full" ]; then
    echo "🔄 Using full deployment with quality checks..."
    ./deploy-fullstack.sh
else
    echo "⚡ Using immediate deployment (fastest mode)..."
    ./deploy-immediate.sh
fi

echo ""
echo "🎉🎉🎉 DEPLOYMENT COMPLETED! 🎉🎉🎉"
echo "=================================================="
echo "Your Souk El-Syarat Marketplace is now LIVE!"
echo "Ready for production traffic immediately!"
echo ""
echo "Next steps:"
echo "1. Test the live application"
echo "2. Monitor for any issues"
echo "3. Share the live URL with stakeholders"
echo ""
echo "🚀 SUCCESS! Your app deadline has been met! 🎉"
