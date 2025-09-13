# Install and Configure Google Cloud SDK for Souk El-Syarat
# This script helps set up gcloud for deployment

Write-Host "🔧 Google Cloud SDK Setup for Souk El-Syarat" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# Check if gcloud is already installed
Write-Host "Checking for existing Google Cloud SDK..." -ForegroundColor Yellow
try {
    $gcloudVersion = & gcloud --version 2>$null | Select-Object -First 1
    Write-Host "✅ Google Cloud SDK already installed: $gcloudVersion" -ForegroundColor Green
    Write-Host "Proceeding to configuration..." -ForegroundColor Yellow
} catch {
    Write-Host "❌ Google Cloud SDK not found" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Google Cloud SDK:" -ForegroundColor Yellow
    Write-Host "1. Download from: https://cloud.google.com/sdk/docs/install" -ForegroundColor Cyan
    Write-Host "2. Run the installer" -ForegroundColor Cyan
    Write-Host "3. Restart PowerShell" -ForegroundColor Cyan
    Write-Host "4. Run this script again" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Alternative (using winget):" -ForegroundColor Yellow
    Write-Host "winget install Google.GoogleCloudSDK" -ForegroundColor Cyan
    exit 1
}

# Authenticate
Write-Host ""
Write-Host "🔐 Authentication Setup" -ForegroundColor Yellow
Write-Host "Choose your authentication method:" -ForegroundColor Cyan
Write-Host "1. Service Account (recommended for CI/CD)" -ForegroundColor White
Write-Host "2. User Account (for development)" -ForegroundColor White

$authChoice = Read-Host "Enter your choice (1 or 2)"

switch ($authChoice) {
    "1" {
        Write-Host ""
        Write-Host "Service Account Authentication:" -ForegroundColor Yellow
        Write-Host "1. Go to Google Cloud Console: https://console.cloud.google.com/iam-admin/serviceaccounts" -ForegroundColor Cyan
        Write-Host "2. Create a service account: souk-el-syarat-deployer" -ForegroundColor Cyan
        Write-Host "3. Download the JSON key file" -ForegroundColor Cyan
        Write-Host "4. Set the environment variable:" -ForegroundColor Cyan
        Write-Host "   `$env:GOOGLE_APPLICATION_CREDENTIALS='path\to\service-account-key.json'" -ForegroundColor White
        Write-Host ""
        $keyPath = Read-Host "Enter the path to your service account key file"
        if (Test-Path $keyPath) {
            $env:GOOGLE_APPLICATION_CREDENTIALS = $keyPath
            Write-Host "✅ Service account key configured" -ForegroundColor Green
        } else {
            Write-Host "❌ Service account key file not found" -ForegroundColor Red
            exit 1
        }
    }
    "2" {
        Write-Host ""
        Write-Host "User Account Authentication:" -ForegroundColor Yellow
        Write-Host "Opening browser for authentication..." -ForegroundColor Cyan
        & gcloud auth login --no-launch-browser
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Authentication failed" -ForegroundColor Red
            exit 1
        }
        Write-Host "✅ User authentication successful" -ForegroundColor Green
    }
    default {
        Write-Host "❌ Invalid choice" -ForegroundColor Red
        exit 1
    }
}

# Set project
Write-Host ""
Write-Host "🔧 Project Configuration" -ForegroundColor Yellow
$currentProject = & gcloud config get-value project 2>$null
if ($currentProject -and $currentProject -ne "(unset)") {
    Write-Host "Current project: $currentProject" -ForegroundColor Cyan
    $changeProject = Read-Host "Do you want to change the project? (y/n)"
    if ($changeProject -eq "y" -or $changeProject -eq "Y") {
        $newProject = Read-Host "Enter the new project ID"
        & gcloud config set project $newProject
        Write-Host "✅ Project set to: $newProject" -ForegroundColor Green
    }
} else {
    $projectId = Read-Host "Enter your Google Cloud project ID (e.g., souk-el-syarat)"
    & gcloud config set project $projectId
    Write-Host "✅ Project set to: $projectId" -ForegroundColor Green
}

# Set region
Write-Host ""
Write-Host "🌍 Region Configuration" -ForegroundColor Yellow
$currentRegion = & gcloud config get-value compute/region 2>$null
if ($currentRegion -and $currentRegion -ne "(unset)") {
    Write-Host "Current region: $currentRegion" -ForegroundColor Cyan
} else {
    Write-Host "Setting region to us-central1..." -ForegroundColor Cyan
    & gcloud config set compute/region us-central1
    Write-Host "✅ Region set to: us-central1" -ForegroundColor Green
}

# Enable required APIs
Write-Host ""
Write-Host "🔌 Enabling Required APIs" -ForegroundColor Yellow
$apis = @(
    "appengine.googleapis.com",
    "cloudbuild.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "iam.googleapis.com"
)

foreach ($api in $apis) {
    Write-Host "Enabling $api..." -ForegroundColor Cyan
    & gcloud services enable $api --quiet
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ $api enabled" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to enable $api" -ForegroundColor Red
    }
}

# Create App Engine app if it doesn't exist
Write-Host ""
Write-Host "🚀 App Engine Setup" -ForegroundColor Yellow
try {
    & gcloud app describe > $null 2>&1
    Write-Host "✅ App Engine app already exists" -ForegroundColor Green
} catch {
    Write-Host "Creating App Engine app in us-central1..." -ForegroundColor Cyan
    & gcloud app create --region=us-central1 --quiet
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ App Engine app created" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to create App Engine app" -ForegroundColor Red
    }
}

# Final verification
Write-Host ""
Write-Host "🔍 Verification" -ForegroundColor Yellow
Write-Host "Testing gcloud configuration..." -ForegroundColor Cyan

try {
    $project = & gcloud config get-value project
    $account = & gcloud auth list --filter=status:ACTIVE --format="value(account)" | Select-Object -First 1

    Write-Host "✅ Project: $project" -ForegroundColor Green
    Write-Host "✅ Account: $account" -ForegroundColor Green
    Write-Host "✅ Region: us-central1" -ForegroundColor Green

    Write-Host ""
    Write-Host "🎉 Google Cloud SDK setup completed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now run the deployment tests:" -ForegroundColor Cyan
    Write-Host "powershell.exe -ExecutionPolicy Bypass -File test-deployment.ps1" -ForegroundColor White
    Write-Host ""
    Write-Host "Or deploy directly:" -ForegroundColor Cyan
    Write-Host ".\deploy-app-engine.sh" -ForegroundColor White

} catch {
    Write-Host "❌ Verification failed. Please check your setup." -ForegroundColor Red
    exit 1
}
