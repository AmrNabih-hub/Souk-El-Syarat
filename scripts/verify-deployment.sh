#!/bin/bash

# Appwrite Deployment Verification Script
# This script tests the build process and verifies deployment readiness

echo "🚀 Starting Appwrite Deployment Verification..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if we're on the right branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "appwrite-deployment-ready" ]; then
    echo "⚠️  Warning: Not on 'appwrite-deployment-ready' branch (currently on '$CURRENT_BRANCH')"
    echo "Continuing anyway..."
fi

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf dist

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run build
echo "🔨 Running production build..."
npm run build

# Check if build was successful
if [ $? -eq 0 ] && [ -d "dist" ]; then
    echo "✅ Build successful!"
    
    # Check if essential files exist
    if [ -f "dist/index.html" ]; then
        echo "✅ index.html found"
    else
        echo "❌ index.html not found in dist"
        exit 1
    fi
    
    # Check if assets folder exists
    if [ -d "dist/assets" ]; then
        echo "✅ Assets folder found"
        echo "📊 Build size analysis:"
        du -sh dist/*
    else
        echo "❌ Assets folder not found"
        exit 1
    fi
    
    echo "🎉 Deployment verification completed successfully!"
    echo "📋 Ready for Appwrite deployment with these settings:"
    echo "   - Install Command: npm install"
    echo "   - Build Command: npm run build"
    echo "   - Output Directory: dist"
    echo "   - Branch: appwrite-deployment-ready"
    
else
    echo "❌ Build failed!"
    exit 1
fi