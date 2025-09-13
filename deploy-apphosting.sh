#!/bin/bash

# Professional Deployment Script for Souk El-Syarat App Hosting
# This script addresses the "vite: not found" build error

set -e

echo "🚀 Starting Souk El-Syarat App Hosting Deployment"
echo "================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'.' -f1 | cut -d'v' -f2)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

print_status "Node.js version: $(node -v)"
print_status "NPM version: $(npm -v)"

# Clean previous build
print_status "Cleaning previous build..."
rm -rf dist
rm -rf node_modules/.vite

# Install dependencies with proper error handling
print_status "Installing dependencies..."
if ! npm ci --silent --no-audit --no-fund; then
    print_error "Failed to install dependencies"
    exit 1
fi

print_success "Dependencies installed successfully"

# Verify vite is available
if ! npx vite --version &> /dev/null; then
    print_error "Vite is not available after installation"
    exit 1
fi

print_success "Vite is available: $(npx vite --version)"

# Build the application
print_status "Building application for production..."
export NODE_ENV=production
export CI=true

if npm run build:apphosting; then
    print_success "Build completed successfully"
else
    print_error "Build failed"
    exit 1
fi

# Verify build output
if [ ! -d "dist" ]; then
    print_error "Build output directory 'dist' not found"
    exit 1
fi

if [ ! -f "dist/index.html" ]; then
    print_error "Main build file 'dist/index.html' not found"
    exit 1
fi

print_success "Build verification passed"

# Deploy to Firebase App Hosting
print_status "Deploying to Firebase App Hosting..."
if firebase deploy --only apphosting; then
    print_success "Deployment completed successfully!"
    echo ""
    echo "🎉 Your app is now live at:"
    echo "   https://souk-el-syarat.web.app"
    echo "   App Hosting URL will be provided in Firebase Console"
else
    print_error "Deployment failed"
    print_warning "You can try deploying manually:"
    echo "  firebase deploy --only apphosting"
    exit 1
fi

print_success "Deployment process completed successfully!"
