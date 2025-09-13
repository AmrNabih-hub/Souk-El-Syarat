# Google Cloud SDK Setup Script for Souk El-Syarat
# Run this AFTER installing Google Cloud SDK

Write-Host "🔧 Setting up Google Cloud SDK for Souk El-Syarat" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if gcloud is installed
Write-Host "Checking Google Cloud SDK installation..." -ForegroundColor Yellow
try {
    $gcloudVersion = & gcloud --version 2>$null | Select-Object -First 1
    Write-Host "✅ Google Cloud SDK found: $gcloudVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Google Cloud SDK not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Google Cloud SDK first:" -ForegroundColor Yellow
    Write-Host "1. Download: https://cloud.google.com/sdk/docs/install" -ForegroundColor White
    Write-Host "2. Run the installer" -ForegroundColor White
    Write-Host "3. Restart PowerShell" -ForegroundColor White
    Write-Host "4. Run this script again" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "🔐 Authentication Setup" -ForegroundColor Yellow
Write-Host "Choose your preferred authentication method:" -ForegroundColor Cyan
Write-Host "1. User Account (recommended for development)" -ForegroundColor White
Write-Host "2. Service Account (for CI/CD automation)" -ForegroundColor White
Write-Host ""

$authChoice = Read-Host "Enter your choice (1 or 2)"

switch ($authChoice) {
    "1" {
        Write-Host ""
        Write-Host "🔑 User Account Authentication" -ForegroundColor Yellow
        Write-Host "This will open a browser for authentication..." -ForegroundColor Cyan
        try {
            & gcloud auth login --no-launch-browser
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Authentication successful!" -ForegroundColor Green
            } else {
                Write-Host "⚠️ Authentication completed with warnings" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "❌ Authentication failed" -ForegroundColor Red
            Write-Host "Try running: gcloud auth login" -ForegroundColor Yellow
        }
    }
    "2" {
        Write-Host ""
        Write-Host "🔑 Service Account Authentication" -ForegroundColor Yellow
        Write-Host "You'll need a service account key file (.json)" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "To create a service account:" -ForegroundColor White
        Write-Host "1. Go to: https://console.cloud.google.com/iam-admin/serviceaccounts" -ForegroundColor White
        Write-Host "2. Create service account: souk-el-syarat-deployer" -ForegroundColor White
        Write-Host "3. Download the JSON key file" -ForegroundColor White
        Write-Host ""
        $keyPath = Read-Host "Enter the path to your service account key file (or press Enter to skip)"
        if ($keyPath -and (Test-Path $keyPath)) {
            $env:GOOGLE_APPLICATION_CREDENTIALS = $keyPath
            Write-Host "✅ Service account key configured" -ForegroundColor Green
        } else {
            Write-Host "⚠️ Service account setup skipped" -ForegroundColor Yellow
        }
    }
    default {
        Write-Host "⚠️ Using default authentication method" -ForegroundColor Yellow
        try {
            & gcloud auth login --no-launch-browser
        } catch {
            Write-Host "❌ Authentication failed" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "🔧 Project Configuration" -ForegroundColor Yellow
$currentProject = & gcloud config get-value project 2>$null
if ($currentProject -and $currentProject -ne "(unset)") {
    Write-Host "Current project: $currentProject" -ForegroundColor Cyan
    $changeProject = Read-Host "Do you want to change the project? (y/n)"
    if ($changeProject -eq "y" -or $changeProject -eq "Y") {
        $newProject = Read-Host "Enter your Google Cloud project ID"
        if ($newProject) {
            & gcloud config set project $newProject
            Write-Host "✅ Project set to: $newProject" -ForegroundColor Green
        }
    }
} else {
    $projectId = Read-Host "Enter your Google Cloud project ID (default: souk-el-syarat)"
    if (-not $projectId) { $projectId = "souk-el-syarat" }
    & gcloud config set project $projectId
    Write-Host "✅ Project set to: $projectId" -ForegroundColor Green
}

Write-Host ""
Write-Host "🌍 Setting Region" -ForegroundColor Yellow
& gcloud config set compute/region us-central1
Write-Host "✅ Region set to: us-central1" -ForegroundColor Green

Write-Host ""
Write-Host "🔌 Enabling Required APIs" -ForegroundColor Yellow
$apis = @(
    "appengine.googleapis.com",
    "cloudbuild.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "iam.googleapis.com",
    "firestore.googleapis.com",
    "firebase.googleapis.com"
)

foreach ($api in $apis) {
    Write-Host "Enabling $api..." -ForegroundColor Cyan
    try {
        & gcloud services enable $api --quiet 2>$null
        Write-Host "✅ $api enabled" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ $api may already be enabled or failed to enable" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "🏗️ App Engine Setup" -ForegroundColor Yellow
try {
    & gcloud app describe > $null 2>&1
    Write-Host "✅ App Engine app already exists" -ForegroundColor Green
} catch {
    Write-Host "Creating App Engine app in us-central1..." -ForegroundColor Cyan
    try {
        & gcloud app create --region=us-central1 --quiet
        Write-Host "✅ App Engine app created successfully" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ App Engine app may already exist or creation failed" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "🔍 Final Verification" -ForegroundColor Yellow
try {
    $project = & gcloud config get-value project
    $account = & gcloud auth list --filter=status:ACTIVE --format="value(account)" | Select-Object -First 1
    $gcloudVersion = & gcloud --version | Select-Object -First 1

    Write-Host "✅ Project: $project" -ForegroundColor Green
    Write-Host "✅ Account: $account" -ForegroundColor Green
    Write-Host "✅ Region: us-central1" -ForegroundColor Green
    Write-Host "✅ SDK Version: $gcloudVersion" -ForegroundColor Green

    Write-Host ""
    Write-Host "🎉 Google Cloud SDK setup completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 Your Souk El-Syarat is ready for deployment!" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor White
    Write-Host "1. Run final test: powershell.exe -ExecutionPolicy Bypass -File test-deployment.ps1" -ForegroundColor White
    Write-Host "2. Deploy: .\deploy-app-engine.sh" -ForegroundColor White
    Write-Host "3. Access your app at the provided URL" -ForegroundColor White

} catch {
    Write-Host "❌ Verification failed. Please check your setup." -ForegroundColor Red
    Write-Host "Run this script again or check the configuration manually." -ForegroundColor Yellow
}
