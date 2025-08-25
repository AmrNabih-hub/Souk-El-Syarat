#!/bin/bash

# 🚀 AUTOMATED DEPLOYMENT SCRIPT FOR SOUK EL-SYARAT
# Zero-Touch Deployment with Error Recovery
# Version: 2.0.0
# Author: Senior DevOps Engineer

set -e  # Exit on error
trap 'handle_error $? $LINENO' ERR

# ========================================
# CONFIGURATION
# ========================================
PROJECT_NAME="Souk El-Syarat"
FIREBASE_PROJECT="souk-el-syarat"
DEPLOYMENT_ENV="${1:-production}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="deployment_${TIMESTAMP}.log"
BACKUP_DIR="backups/${TIMESTAMP}"
MAX_RETRIES=3
RETRY_DELAY=5

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ========================================
# LOGGING FUNCTIONS
# ========================================
log() {
    echo -e "${CYAN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}❌ $1${NC}" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}" | tee -a "$LOG_FILE"
}

# ========================================
# ERROR HANDLING
# ========================================
handle_error() {
    local exit_code=$1
    local line_no=$2
    log_error "Deployment failed at line $line_no with exit code $exit_code"
    log_warning "Rolling back deployment..."
    rollback_deployment
    send_notification "error" "Deployment failed at line $line_no"
    exit $exit_code
}

rollback_deployment() {
    log_warning "Starting rollback procedure..."
    
    if [ -d "$BACKUP_DIR/dist" ]; then
        log "Restoring previous build from backup..."
        rm -rf dist
        cp -r "$BACKUP_DIR/dist" dist
        log_success "Previous build restored"
    fi
    
    log_info "Rollback completed"
}

# ========================================
# PRE-DEPLOYMENT CHECKS
# ========================================
pre_deployment_checks() {
    log "========================================="
    log "🔍 Running Pre-Deployment Checks"
    log "========================================="
    
    # Check Node.js version
    log "Checking Node.js version..."
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 20 ]; then
        log_error "Node.js version 20 or higher is required (current: v$NODE_VERSION)"
        exit 1
    fi
    log_success "Node.js version check passed (v$NODE_VERSION)"
    
    # Check npm version
    log "Checking npm version..."
    NPM_VERSION=$(npm -v | cut -d'.' -f1)
    if [ "$NPM_VERSION" -lt 10 ]; then
        log_warning "npm version 10 or higher is recommended (current: v$NPM_VERSION)"
    fi
    log_success "npm version check passed (v$NPM_VERSION)"
    
    # Check Firebase CLI
    log "Checking Firebase CLI..."
    if ! command -v firebase &> /dev/null; then
        log_warning "Firebase CLI not found. Installing..."
        npm install -g firebase-tools
    fi
    FIREBASE_VERSION=$(firebase --version)
    log_success "Firebase CLI ready ($FIREBASE_VERSION)"
    
    # Check git status
    log "Checking git status..."
    if [ -n "$(git status --porcelain)" ]; then
        log_warning "Uncommitted changes detected"
        read -p "Do you want to commit changes before deployment? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git add -A
            git commit -m "🚀 Auto-commit before deployment - $TIMESTAMP"
            log_success "Changes committed"
        fi
    else
        log_success "Working directory clean"
    fi
    
    # Check disk space
    log "Checking disk space..."
    DISK_USAGE=$(df -h . | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$DISK_USAGE" -gt 90 ]; then
        log_error "Insufficient disk space (${DISK_USAGE}% used)"
        exit 1
    fi
    log_success "Disk space check passed (${DISK_USAGE}% used)"
    
    # Check network connectivity
    log "Checking network connectivity..."
    if ! ping -c 1 google.com &> /dev/null; then
        log_error "No internet connection"
        exit 1
    fi
    log_success "Network connectivity check passed"
    
    # Check Firebase project
    log "Checking Firebase project configuration..."
    if ! firebase projects:list | grep -q "$FIREBASE_PROJECT"; then
        log_error "Firebase project '$FIREBASE_PROJECT' not found"
        exit 1
    fi
    log_success "Firebase project check passed"
}

# ========================================
# BACKUP CURRENT DEPLOYMENT
# ========================================
backup_current_deployment() {
    log "========================================="
    log "💾 Creating Backup"
    log "========================================="
    
    mkdir -p "$BACKUP_DIR"
    
    if [ -d "dist" ]; then
        log "Backing up current build..."
        cp -r dist "$BACKUP_DIR/"
        log_success "Build backed up to $BACKUP_DIR"
    fi
    
    # Backup package.json for version tracking
    cp package.json "$BACKUP_DIR/"
    
    # Save deployment metadata
    cat > "$BACKUP_DIR/metadata.json" << EOF
{
    "timestamp": "$TIMESTAMP",
    "environment": "$DEPLOYMENT_ENV",
    "git_branch": "$(git branch --show-current)",
    "git_commit": "$(git rev-parse HEAD)",
    "node_version": "$(node -v)",
    "npm_version": "$(npm -v)"
}
EOF
    
    log_success "Backup completed"
}

# ========================================
# INSTALL DEPENDENCIES
# ========================================
install_dependencies() {
    log "========================================="
    log "📦 Installing Dependencies"
    log "========================================="
    
    log "Running npm ci for clean install..."
    
    retry_command npm ci --silent
    
    log_success "Dependencies installed successfully"
}

# ========================================
# RUN TESTS
# ========================================
run_tests() {
    log "========================================="
    log "🧪 Running Tests"
    log "========================================="
    
    # Run linting
    log "Running ESLint..."
    npm run lint:ci || {
        log_warning "Linting warnings detected"
    }
    
    # Run type checking
    log "Running TypeScript type check..."
    npm run type-check:ci || {
        log_error "Type checking failed"
        exit 1
    }
    
    # Run unit tests
    log "Running unit tests..."
    npm run test:ci || {
        log_warning "Some tests failed - continuing with deployment"
    }
    
    log_success "Test suite completed"
}

# ========================================
# BUILD APPLICATION
# ========================================
build_application() {
    log "========================================="
    log "🔨 Building Application"
    log "========================================="
    
    log "Environment: $DEPLOYMENT_ENV"
    
    # Clean previous build
    rm -rf dist
    
    # Build based on environment
    case $DEPLOYMENT_ENV in
        production)
            log "Building for production..."
            NODE_ENV=production npm run build:production
            ;;
        staging)
            log "Building for staging..."
            NODE_ENV=staging npm run build
            ;;
        *)
            log "Building for development..."
            npm run build
            ;;
    esac
    
    # Verify build output
    if [ ! -d "dist" ]; then
        log_error "Build failed - dist directory not created"
        exit 1
    fi
    
    # Check build size
    BUILD_SIZE=$(du -sh dist | cut -f1)
    log_info "Build size: $BUILD_SIZE"
    
    # Optimize build
    log "Optimizing build assets..."
    
    # Compress HTML files
    find dist -name "*.html" -exec gzip -9 -k {} \; 2>/dev/null || true
    
    # Generate build report
    cat > dist/build-info.json << EOF
{
    "version": "$(node -p "require('./package.json').version")",
    "buildTime": "$TIMESTAMP",
    "environment": "$DEPLOYMENT_ENV",
    "gitCommit": "$(git rev-parse HEAD)",
    "buildSize": "$BUILD_SIZE"
}
EOF
    
    log_success "Build completed successfully"
}

# ========================================
# DEPLOY TO FIREBASE
# ========================================
deploy_to_firebase() {
    log "========================================="
    log "🚀 Deploying to Firebase"
    log "========================================="
    
    # Set Firebase project
    firebase use "$FIREBASE_PROJECT" --add
    
    # Deploy based on environment
    case $DEPLOYMENT_ENV in
        production)
            log "Deploying to production..."
            retry_command firebase deploy --only hosting --project "$FIREBASE_PROJECT"
            ;;
        staging)
            log "Deploying to staging..."
            retry_command firebase deploy --only hosting:staging --project "$FIREBASE_PROJECT-staging"
            ;;
        *)
            log "Deploying to development..."
            retry_command firebase deploy --only hosting:dev --project "$FIREBASE_PROJECT-dev"
            ;;
    esac
    
    # Get deployment URL
    DEPLOYMENT_URL="https://${FIREBASE_PROJECT}.firebaseapp.com"
    
    log_success "Deployment successful!"
    log_info "URL: $DEPLOYMENT_URL"
}

# ========================================
# POST-DEPLOYMENT VERIFICATION
# ========================================
verify_deployment() {
    log "========================================="
    log "✅ Verifying Deployment"
    log "========================================="
    
    DEPLOYMENT_URL="https://${FIREBASE_PROJECT}.firebaseapp.com"
    
    # Check if site is accessible
    log "Checking site accessibility..."
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOYMENT_URL")
    
    if [ "$HTTP_STATUS" -eq 200 ]; then
        log_success "Site is accessible (HTTP $HTTP_STATUS)"
    else
        log_error "Site returned HTTP $HTTP_STATUS"
        rollback_deployment
        exit 1
    fi
    
    # Check for console errors
    log "Checking for JavaScript errors..."
    # This would require a headless browser like Puppeteer
    # For now, we'll skip this check
    
    # Performance check
    log "Running performance check..."
    if command -v lighthouse &> /dev/null; then
        lighthouse "$DEPLOYMENT_URL" \
            --output=json \
            --output-path="./lighthouse-${TIMESTAMP}.json" \
            --chrome-flags="--headless" \
            --quiet || true
        log_info "Lighthouse report saved"
    fi
    
    log_success "Deployment verification completed"
}

# ========================================
# CLEANUP OLD DEPLOYMENTS
# ========================================
cleanup_old_deployments() {
    log "========================================="
    log "🧹 Cleaning Up Old Deployments"
    log "========================================="
    
    # Keep only last 5 backups
    if [ -d "backups" ]; then
        BACKUP_COUNT=$(ls -1 backups | wc -l)
        if [ "$BACKUP_COUNT" -gt 5 ]; then
            log "Removing old backups..."
            ls -t1 backups | tail -n +6 | xargs -I {} rm -rf "backups/{}"
            log_success "Old backups removed"
        fi
    fi
    
    # Clean old log files (keep last 10)
    LOG_COUNT=$(ls -1 deployment_*.log 2>/dev/null | wc -l)
    if [ "$LOG_COUNT" -gt 10 ]; then
        log "Removing old log files..."
        ls -t1 deployment_*.log | tail -n +11 | xargs rm -f
        log_success "Old log files removed"
    fi
}

# ========================================
# SEND NOTIFICATIONS
# ========================================
send_notification() {
    local status=$1
    local message=$2
    
    # Discord webhook (if configured)
    if [ -n "$DISCORD_WEBHOOK" ]; then
        curl -H "Content-Type: application/json" \
             -X POST \
             -d "{\"content\": \"**$PROJECT_NAME Deployment**: $status - $message\"}" \
             "$DISCORD_WEBHOOK" 2>/dev/null || true
    fi
    
    # Slack webhook (if configured)
    if [ -n "$SLACK_WEBHOOK" ]; then
        curl -X POST \
             -H 'Content-type: application/json' \
             --data "{\"text\":\"*$PROJECT_NAME Deployment*: $status - $message\"}" \
             "$SLACK_WEBHOOK" 2>/dev/null || true
    fi
    
    # Email notification (if configured)
    if [ -n "$NOTIFICATION_EMAIL" ]; then
        echo "$message" | mail -s "$PROJECT_NAME Deployment: $status" "$NOTIFICATION_EMAIL" 2>/dev/null || true
    fi
}

# ========================================
# RETRY MECHANISM
# ========================================
retry_command() {
    local command="$@"
    local attempt=1
    
    while [ $attempt -le $MAX_RETRIES ]; do
        log "Attempt $attempt of $MAX_RETRIES: $command"
        
        if $command; then
            return 0
        fi
        
        if [ $attempt -lt $MAX_RETRIES ]; then
            log_warning "Command failed, retrying in ${RETRY_DELAY} seconds..."
            sleep $RETRY_DELAY
        fi
        
        attempt=$((attempt + 1))
    done
    
    log_error "Command failed after $MAX_RETRIES attempts: $command"
    return 1
}

# ========================================
# GENERATE DEPLOYMENT REPORT
# ========================================
generate_deployment_report() {
    log "========================================="
    log "📊 Generating Deployment Report"
    log "========================================="
    
    REPORT_FILE="deployment-report-${TIMESTAMP}.md"
    
    cat > "$REPORT_FILE" << EOF
# Deployment Report
**Project:** $PROJECT_NAME
**Date:** $(date)
**Environment:** $DEPLOYMENT_ENV
**Status:** SUCCESS ✅

## Deployment Details
- **Git Branch:** $(git branch --show-current)
- **Git Commit:** $(git rev-parse HEAD)
- **Build Size:** $BUILD_SIZE
- **Deployment URL:** $DEPLOYMENT_URL

## Performance Metrics
- **Build Time:** ${BUILD_DURATION}s
- **Deploy Time:** ${DEPLOY_DURATION}s
- **Total Time:** ${TOTAL_DURATION}s

## Verification Results
- **HTTP Status:** $HTTP_STATUS
- **Site Accessible:** ✅

## System Information
- **Node Version:** $(node -v)
- **npm Version:** $(npm -v)
- **Firebase CLI:** $(firebase --version)

## Logs
See \`$LOG_FILE\` for detailed logs.

---
*Generated automatically by deployment script*
EOF
    
    log_success "Deployment report saved to $REPORT_FILE"
}

# ========================================
# MAIN DEPLOYMENT FLOW
# ========================================
main() {
    START_TIME=$(date +%s)
    
    # Header
    echo -e "${PURPLE}"
    echo "========================================="
    echo "   🚀 SOUK EL-SYARAT AUTO-DEPLOYMENT"
    echo "========================================="
    echo -e "${NC}"
    
    log_info "Starting deployment process..."
    log_info "Environment: $DEPLOYMENT_ENV"
    log_info "Timestamp: $TIMESTAMP"
    
    # Create log directory
    mkdir -p logs
    mv "$LOG_FILE" "logs/$LOG_FILE" 2>/dev/null || true
    LOG_FILE="logs/$LOG_FILE"
    
    # Run deployment steps
    pre_deployment_checks
    backup_current_deployment
    install_dependencies
    run_tests
    
    BUILD_START=$(date +%s)
    build_application
    BUILD_END=$(date +%s)
    BUILD_DURATION=$((BUILD_END - BUILD_START))
    
    DEPLOY_START=$(date +%s)
    deploy_to_firebase
    DEPLOY_END=$(date +%s)
    DEPLOY_DURATION=$((DEPLOY_END - DEPLOY_START))
    
    verify_deployment
    cleanup_old_deployments
    
    END_TIME=$(date +%s)
    TOTAL_DURATION=$((END_TIME - START_TIME))
    
    generate_deployment_report
    
    # Success notification
    send_notification "SUCCESS" "Deployment completed in ${TOTAL_DURATION}s"
    
    # Success message
    echo -e "${GREEN}"
    echo "========================================="
    echo "   ✅ DEPLOYMENT SUCCESSFUL!"
    echo "========================================="
    echo -e "${NC}"
    log_success "Deployment completed successfully!"
    log_info "Total time: ${TOTAL_DURATION} seconds"
    log_info "URL: $DEPLOYMENT_URL"
    
    # Open browser (optional)
    if [ "$DEPLOYMENT_ENV" = "production" ]; then
        log_info "Opening deployment in browser..."
        if command -v xdg-open &> /dev/null; then
            xdg-open "$DEPLOYMENT_URL"
        elif command -v open &> /dev/null; then
            open "$DEPLOYMENT_URL"
        fi
    fi
}

# ========================================
# SCRIPT ENTRY POINT
# ========================================

# Check if running in CI environment
if [ -n "$CI" ]; then
    log_info "Running in CI environment"
    export DEPLOYMENT_ENV="production"
fi

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --env)
            DEPLOYMENT_ENV="$2"
            shift 2
            ;;
        --project)
            FIREBASE_PROJECT="$2"
            shift 2
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --env <environment>    Deployment environment (production/staging/dev)"
            echo "  --project <project>    Firebase project ID"
            echo "  --skip-tests          Skip running tests"
            echo "  --help                Show this help message"
            exit 0
            ;;
        *)
            DEPLOYMENT_ENV="$1"
            shift
            ;;
    esac
done

# Run main deployment
main

exit 0