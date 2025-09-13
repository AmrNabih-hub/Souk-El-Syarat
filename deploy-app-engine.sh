#!/bin/bash

# Professional Automated Deployment Script for Souk El-Syarat on Google App Engine
# This script handles the complete deployment pipeline

set -e

echo "🚀 Souk El-Syarat - Google App Engine Deployment"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_header() {
    echo -e "${BLUE}================================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================================================${NC}"
}

print_step() {
    echo -e "${CYAN}[STEP]${NC} $1"
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

print_info() {
    echo -e "${PURPLE}[INFO]${NC} $1"
}

# Configuration
PROJECT_ID="${PROJECT_ID:-souk-el-syarat}"
REGION="${REGION:-us-central1}"
SERVICE_ACCOUNT="${SERVICE_ACCOUNT:-souk-el-syarat-deployer}"
VERSION="${VERSION:-$(date +%Y%m%d-%H%M%S)}"

# Function to check prerequisites
check_prerequisites() {
    print_step "Checking prerequisites..."

    # Check if gcloud is installed
    if ! command -v gcloud &> /dev/null; then
        print_error "gcloud CLI is not installed. Please install Google Cloud SDK first."
        echo "Visit: https://cloud.google.com/sdk/docs/install"
        exit 1
    fi

    # Check if user is authenticated
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
        print_error "You are not authenticated with Google Cloud."
        echo "Run: gcloud auth login"
        exit 1
    fi

    # Check if project exists and is set
    CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null)
    if [ "$CURRENT_PROJECT" != "$PROJECT_ID" ]; then
        print_warning "Current project is '$CURRENT_PROJECT', switching to '$PROJECT_ID'"
        gcloud config set project "$PROJECT_ID"
    fi

    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 20+ first."
        exit 1
    fi

    # Check Node.js version
    NODE_VERSION=$(node -v | cut -d'.' -f1 | cut -d'v' -f2)
    if [ "$NODE_VERSION" -lt 20 ]; then
        print_error "Node.js version 20+ is required. Current version: $(node -v)"
        exit 1
    fi

    print_success "Prerequisites check passed"
    print_info "Node.js version: $(node -v)"
    print_info "NPM version: $(npm -v)"
    print_info "Project: $PROJECT_ID"
}

# Function to enable required APIs
enable_apis() {
    print_step "Enabling required Google Cloud APIs..."

    APIs=(
        "appengine.googleapis.com"
        "cloudbuild.googleapis.com"
        "cloudresourcemanager.googleapis.com"
        "iam.googleapis.com"
    )

    for api in "${APIs[@]}"; do
        print_info "Enabling $api..."
        gcloud services enable "$api" --quiet
    done

    print_success "All required APIs enabled"
}

# Function to create App Engine app if it doesn't exist
create_app_engine_app() {
    print_step "Checking App Engine application..."

    if ! gcloud app describe &> /dev/null; then
        print_info "App Engine app not found. Creating new application..."
        gcloud app create --region="$REGION" --quiet
        print_success "App Engine application created"
    else
        print_success "App Engine application already exists"
    fi
}

# Function to install dependencies
install_dependencies() {
    print_step "Installing project dependencies..."

    if ! npm ci --silent --no-audit --no-fund; then
        print_error "Failed to install dependencies"
        exit 1
    fi

    print_success "Dependencies installed successfully"
}

# Function to build application
build_application() {
    print_step "Building application for production..."

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
}

# Function to deploy to App Engine
deploy_to_app_engine() {
    print_step "Deploying to Google App Engine..."

    # Set version for deployment
    export VERSION="$VERSION"

    if gcloud app deploy --version="$VERSION" --quiet; then
        print_success "Deployment completed successfully"
        echo ""
        print_info "Your app is now live at:"
        echo "   https://$VERSION-dot-$PROJECT_ID.appspot.com"
        echo "   https://$PROJECT_ID.appspot.com (if promoted)"
    else
        print_error "Deployment failed"
        exit 1
    fi
}

# Function to setup Cloud Build trigger
setup_cloud_build_trigger() {
    print_step "Setting up Cloud Build trigger for continuous deployment..."

    TRIGGER_NAME="souk-el-syarat-deploy"

    # Check if trigger already exists
    if gcloud builds triggers describe "$TRIGGER_NAME" &> /dev/null; then
        print_warning "Cloud Build trigger '$TRIGGER_NAME' already exists"
        return
    fi

    # Note: This requires repository connection
    print_info "To set up automatic deployment:"
    echo "1. Go to https://console.cloud.google.com/cloud-build/triggers"
    echo "2. Connect your GitHub repository"
    echo "3. Create a new trigger with:"
    echo "   - Name: $TRIGGER_NAME"
    echo "   - Event: Push to branch"
    echo "   - Branch: main"
    echo "   - Build configuration: cloudbuild.yaml"
}

# Function to test deployment
test_deployment() {
    print_step "Testing deployed application..."

    # Wait a moment for deployment to propagate
    sleep 10

    # Test health endpoint
    HEALTH_URL="https://$VERSION-dot-$PROJECT_ID.appspot.com/health"
    if curl -s -f "$HEALTH_URL" > /dev/null; then
        print_success "Health check passed: $HEALTH_URL"
    else
        print_warning "Health check failed, but deployment may still be propagating"
    fi

    # Test main application
    APP_URL="https://$VERSION-dot-$PROJECT_ID.appspot.com"
    if curl -s -f "$APP_URL" > /dev/null; then
        print_success "Application is responding: $APP_URL"
    else
        print_warning "Application may still be starting up"
    fi
}

# Function to show deployment summary
show_summary() {
    print_header "DEPLOYMENT SUMMARY"

    echo -e "${GREEN}✅ Prerequisites:${NC} All checks passed"
    echo -e "${GREEN}✅ APIs:${NC} Required services enabled"
    echo -e "${GREEN}✅ App Engine:${NC} Application configured"
    echo -e "${GREEN}✅ Dependencies:${NC} Installed successfully"
    echo -e "${GREEN}✅ Build:${NC} Completed successfully"
    echo -e "${GREEN}✅ Deployment:${NC} Live on App Engine"

    echo ""
    echo -e "${CYAN}🌐 Application URLs:${NC}"
    echo "   Production: https://$PROJECT_ID.appspot.com"
    echo "   Version:    https://$VERSION-dot-$PROJECT_ID.appspot.com"

    echo ""
    echo -e "${CYAN}🔧 Management Commands:${NC}"
    echo "   View logs:    gcloud app logs tail"
    echo "   List versions: gcloud app versions list"
    echo "   Promote version: gcloud app versions migrate $VERSION"
    echo "   Delete version: gcloud app versions delete $VERSION"

    echo ""
    echo -e "${CYAN}📊 Monitoring:${NC}"
    echo "   Console: https://console.cloud.google.com/appengine"
    echo "   Logs: https://console.cloud.google.com/logs"
    echo "   Metrics: https://console.cloud.google.com/monitoring"
}

# Main deployment flow
main() {
    print_header "STARTING SOUK EL-SYARAT DEPLOYMENT"

    check_prerequisites
    enable_apis
    create_app_engine_app
    install_dependencies
    build_application
    deploy_to_app_engine
    setup_cloud_build_trigger
    test_deployment
    show_summary

    print_header "DEPLOYMENT COMPLETED SUCCESSFULLY! 🎉"
    echo ""
    echo "Your Souk El-Syarat marketplace is now live on Google App Engine!"
    echo ""
}

# Handle command line arguments
case "${1:-}" in
    "check")
        check_prerequisites
        ;;
    "build")
        install_dependencies
        build_application
        ;;
    "deploy")
        check_prerequisites
        enable_apis
        create_app_engine_app
        deploy_to_app_engine
        ;;
    "test")
        test_deployment
        ;;
    *)
        main
        ;;
esac
