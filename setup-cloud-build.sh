#!/bin/bash

# Setup Cloud Build Triggers for Souk El-Syarat
# Automates continuous deployment pipeline

set -e

echo "🔧 Setup Cloud Build Triggers - Souk El-Syarat"
echo "============================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ID="${PROJECT_ID:-souk-el-syarat}"
REPO_NAME="${REPO_NAME:-souk-el-syarat}"
BRANCH="${BRANCH:-main}"

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
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
    echo -e "${YELLOW}[INFO]${NC} $1"
}

# Function to create Cloud Build trigger
create_trigger() {
    local trigger_name="$1"
    local branch="$2"
    local description="$3"

    print_step "Creating trigger: $trigger_name"

    # Check if trigger already exists
    if gcloud builds triggers describe "$trigger_name" &> /dev/null; then
        print_warning "Trigger '$trigger_name' already exists"
        return
    fi

    # Create the trigger
    gcloud builds triggers create github \
        --name="$trigger_name" \
        --description="$description" \
        --repo-name="$REPO_NAME" \
        --repo-owner="$GITHUB_USERNAME" \
        --branch-pattern="^$branch$" \
        --build-config="cloudbuild.yaml" \
        --substitutions="_BRANCH=$branch,_TRIGGER=$trigger_name" \
        --quiet

    print_success "Trigger '$trigger_name' created successfully"
}

# Function to setup service account permissions
setup_permissions() {
    print_step "Setting up service account permissions"

    SERVICE_ACCOUNT="souk-el-syarat-deployer@$PROJECT_ID.iam.gserviceaccount.com"

    # Create service account if it doesn't exist
    if ! gcloud iam service-accounts describe "$SERVICE_ACCOUNT" &> /dev/null; then
        gcloud iam service-accounts create souk-el-syarat-deployer \
            --display-name="Souk El-Syarat Deployer" \
            --quiet
        print_info "Service account created: $SERVICE_ACCOUNT"
    fi

    # Grant necessary permissions
    gcloud projects add-iam-policy-binding "$PROJECT_ID" \
        --member="serviceAccount:$SERVICE_ACCOUNT" \
        --role="roles/appengine.deployer" \
        --quiet

    gcloud projects add-iam-policy-binding "$PROJECT_ID" \
        --member="serviceAccount:$SERVICE_ACCOUNT" \
        --role="roles/cloudbuild.builds.builder" \
        --quiet

    print_success "Permissions configured"
}

# Function to enable required APIs
enable_apis() {
    print_step "Enabling required APIs"

    APIs=(
        "cloudbuild.googleapis.com"
        "appengine.googleapis.com"
        "sourcerepo.googleapis.com"
    )

    for api in "${APIs[@]}"; do
        print_info "Enabling $api..."
        gcloud services enable "$api" --quiet
    done

    print_success "APIs enabled"
}

# Function to create build buckets
create_build_bucket() {
    print_step "Setting up Cloud Storage bucket for build artifacts"

    BUCKET_NAME="$PROJECT_ID-build-artifacts"

    if ! gsutil ls -b "gs://$BUCKET_NAME" &> /dev/null; then
        gsutil mb -p "$PROJECT_ID" "gs://$BUCKET_NAME"
        gsutil iam ch allUsers:objectViewer "gs://$BUCKET_NAME"
        print_info "Created bucket: gs://$BUCKET_NAME"
    else
        print_warning "Bucket already exists: gs://$BUCKET_NAME"
    fi

    print_success "Build bucket configured"
}

# Function to show setup summary
show_summary() {
    echo ""
    echo -e "${GREEN}🎉 Cloud Build Setup Completed!${NC}"
    echo ""
    echo -e "${BLUE}📋 Setup Summary:${NC}"
    echo "   ✅ APIs enabled"
    echo "   ✅ Service account configured"
    echo "   ✅ Build bucket created"
    echo "   ✅ Triggers ready for creation"
    echo ""
    echo -e "${BLUE}🔧 Manual Steps Required:${NC}"
    echo "   1. Connect your GitHub repository:"
    echo "      https://console.cloud.google.com/cloud-build/triggers/connect"
    echo ""
    echo "   2. Set your GitHub username:"
    echo "      export GITHUB_USERNAME=your-github-username"
    echo ""
    echo "   3. Create the triggers:"
    echo "      ./setup-cloud-build.sh triggers"
    echo ""
    echo -e "${BLUE}📊 Monitoring:${NC}"
    echo "   Build History: https://console.cloud.google.com/cloud-build/builds"
    echo "   Triggers: https://console.cloud.google.com/cloud-build/triggers"
}

# Main setup flow
main() {
    print_step "Starting Cloud Build setup"

    # Check prerequisites
    if [ -z "$GITHUB_USERNAME" ]; then
        print_error "Please set GITHUB_USERNAME environment variable"
        echo "Example: export GITHUB_USERNAME=your-github-username"
        exit 1
    fi

    enable_apis
    setup_permissions
    create_build_bucket

    print_info "Creating Cloud Build triggers..."
    create_trigger "souk-el-syarat-deploy-main" "$BRANCH" "Deploy to production on main branch push"
    create_trigger "souk-el-syarat-deploy-staging" "develop" "Deploy to staging on develop branch push"

    show_summary
}

# Handle subcommands
case "${1:-}" in
    "apis")
        enable_apis
        ;;
    "permissions")
        setup_permissions
        ;;
    "bucket")
        create_build_bucket
        ;;
    "triggers")
        if [ -z "$GITHUB_USERNAME" ]; then
            print_error "Please set GITHUB_USERNAME environment variable"
            exit 1
        fi
        create_trigger "souk-el-syarat-deploy-main" "$BRANCH" "Deploy to production on main branch push"
        create_trigger "souk-el-syarat-deploy-staging" "develop" "Deploy to staging on develop branch push"
        ;;
    *)
        main
        ;;
esac
