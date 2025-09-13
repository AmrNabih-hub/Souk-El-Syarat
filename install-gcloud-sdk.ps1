# Install Google Cloud SDK for Souk El-Syarat
# This script downloads and installs Google Cloud SDK

Write-Host "🔧 Installing Google Cloud SDK..." -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Check if gcloud is already installed
try {
    $gcloudVersion = & gcloud --version 2>$null | Select-Object -First 1
    Write-Host "✅ Google Cloud SDK already installed: $gcloudVersion" -ForegroundColor Green
    Write-Host "Proceeding to configuration..." -ForegroundColor Yellow
} catch {
    Write-Host "❌ Google Cloud SDK not found. Installing..." -ForegroundColor Yellow

    # Download Google Cloud SDK
    $sdkUrl = "https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe"
    $installerPath = "$env:TEMP\GoogleCloudSDKInstaller.exe"

    Write-Host "📥 Downloading Google Cloud SDK installer..." -ForegroundColor Cyan
    try {
        Invoke-WebRequest -Uri $sdkUrl -OutFile $installerPath -ErrorAction Stop
        Write-Host "✅ Download completed" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to download Google Cloud SDK" -ForegroundColor Red
        Write-Host "Please download manually from: https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
        exit 1
    }

    # Run installer
    Write-Host "⚙️ Running installer..." -ForegroundColor Cyan
    Write-Host "Please follow the installation prompts..." -ForegroundColor Yellow

    try {
        Start-Process -FilePath $installerPath -Wait -ErrorAction Stop
        Write-Host "✅ Installation completed" -ForegroundColor Green
    } catch {
        Write-Host "❌ Installation failed" -ForegroundColor Red
        exit 1
    }

    # Clean up installer
    Remove-Item $installerPath -ErrorAction SilentlyContinue

    # Refresh environment
    Write-Host "🔄 Refreshing environment..." -ForegroundColor Cyan
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

    # Verify installation
    try {
        $gcloudVersion = & gcloud --version 2>$null | Select-Object -First 1
        Write-Host "✅ Google Cloud SDK installed successfully: $gcloudVersion" -ForegroundColor Green
    } catch {
        Write-Host "❌ Google Cloud SDK installation verification failed" -ForegroundColor Red
        Write-Host "Please restart PowerShell and run this script again" -ForegroundColor Yellow
        exit 1
    }

# Initialize gcloud
Write-Host ""
Write-Host "🔧 Initializing Google Cloud SDK..." -ForegroundColor Cyan

try {
    Write-Host "Running: gcloud init" -ForegroundColor Cyan
    Write-Host "Please follow the prompts to authenticate and select your project..." -ForegroundColor Yellow

    & gcloud init --no-launch-browser

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Google Cloud SDK initialized successfully" -ForegroundColor Green
    } else {
        Write-Host "⚠️ gcloud init completed with warnings" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Failed to initialize Google Cloud SDK" -ForegroundColor Red
    Write-Host "You can initialize manually by running: gcloud init" -ForegroundColor Yellow
}

# Enable required APIs
Write-Host ""
Write-Host "🔌 Enabling required APIs..." -ForegroundColor Cyan

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
        Write-Host "⚠️ Failed to enable $api (may already be enabled)" -ForegroundColor Yellow
    }
}

# Set project
Write-Host ""
Write-Host "🔧 Configuring project..." -ForegroundColor Cyan

$currentProject = & gcloud config get-value project 2>$null
if ($currentProject -and $currentProject -ne "(unset)") {
    Write-Host "Current project: $currentProject" -ForegroundColor Cyan
    $changeProject = Read-Host "Do you want to change the project? (y/n)"
    if ($changeProject -eq "y" -or $changeProject -eq "Y") {
        $newProject = Read-Host "Enter the new project ID (default: souk-el-syarat)"
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

# Set region
Write-Host ""
Write-Host "🌍 Setting region..." -ForegroundColor Cyan
& gcloud config set compute/region us-central1
Write-Host "✅ Region set to: us-central1" -ForegroundColor Green

# Final verification
Write-Host ""
Write-Host "🔍 Final verification..." -ForegroundColor Cyan

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
    Write-Host "You can now run the deployment tests:" -ForegroundColor Cyan
    Write-Host "powershell.exe -ExecutionPolicy Bypass -File test-deployment.ps1" -ForegroundColor White
    Write-Host ""
    Write-Host "Or deploy directly:" -ForegroundColor Cyan
    Write-Host "./deploy-app-engine.sh" -ForegroundColor White

} catch {
    Write-Host "❌ Verification failed. Please check your setup." -ForegroundColor Red
    exit 1
}
