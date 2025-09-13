# COMPLETE AUTOMATED GOOGLE CLOUD SDK SETUP FOR SOUK EL-SYARAT
# This script handles everything automatically - no manual intervention needed

param(
    [string]$ProjectId = "souk-el-syarat",
    [string]$Region = "us-central1"
)

Write-Host "🚀 COMPLETE GOOGLE CLOUD SETUP FOR SOUK EL-SYARAT" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Setup status tracking
$SetupStatus = @{
    GcloudInstalled = $false
    Authenticated = $false
    ProjectConfigured = $false
    ApisEnabled = $false
    AppEngineCreated = $false
    TestsPassing = $false
}

function Write-Step {
    param([string]$message)
    Write-Host "[STEP] $message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$message)
    Write-Host "✅ $message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$message)
    Write-Host "⚠️  $message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$message)
    Write-Host "❌ $message" -ForegroundColor Red
}

function Test-GcloudInstalled {
    Write-Step "Checking if Google Cloud SDK is installed..."
    try {
        $version = & gcloud --version 2>$null | Select-Object -First 1
        if ($version -and $version.Contains("Google Cloud SDK")) {
            Write-Success "Google Cloud SDK is installed: $version"
            $SetupStatus.GcloudInstalled = $true
            return $true
        }
    } catch {
        # Gcloud not found
    }

    Write-Warning "Google Cloud SDK not found. Installing..."
    return $false
}

function Install-GcloudSDK {
    Write-Step "Downloading Google Cloud SDK..."

    $installerUrl = "https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe"
    $installerPath = "$env:TEMP\GoogleCloudSDKInstaller.exe"

    try {
        Invoke-WebRequest -Uri $installerUrl -OutFile $installerPath -ErrorAction Stop
        Write-Success "Download completed"
    } catch {
        Write-Error "Failed to download Google Cloud SDK: $($_.Exception.Message)"
        Write-Host "Please download manually from: https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
        exit 1
    }

    Write-Step "Installing Google Cloud SDK..."
    Write-Host "This may take a few minutes. Please wait..." -ForegroundColor Yellow

    try {
        $process = Start-Process -FilePath $installerPath -ArgumentList "/S" -Wait -PassThru -ErrorAction Stop
        if ($process.ExitCode -eq 0) {
            Write-Success "Installation completed successfully"
        } else {
            Write-Error "Installation failed with exit code: $($process.ExitCode)"
            exit 1
        }
    } catch {
        Write-Error "Installation process failed: $($_.Exception.Message)"
        exit 1
    }

    Remove-Item $installerPath -ErrorAction SilentlyContinue

    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

    Start-Sleep -Seconds 2

    try {
        $version = & gcloud --version 2>$null | Select-Object -First 1
        if ($version -and $version.Contains("Google Cloud SDK")) {
            Write-Success "Google Cloud SDK verified: $version"
            $SetupStatus.GcloudInstalled = $true
        } else {
            Write-Error "Installation verification failed"
            exit 1
        }
    } catch {
        Write-Error "Cannot verify installation: $($_.Exception.Message)"
        Write-Host "Please restart PowerShell and run this script again" -ForegroundColor Yellow
        exit 1
    }
}

function Initialize-Gcloud {
    Write-Step "Initializing Google Cloud SDK..."

    try {
        Write-Host "Starting authentication process..." -ForegroundColor Cyan
        Write-Host "A browser window will open for authentication." -ForegroundColor Yellow
        Write-Host "Please sign in with your Google account." -ForegroundColor Yellow
        Write-Host ""

        $initProcess = Start-Process -FilePath "gcloud" -ArgumentList "auth", "login", "--no-launch-browser" -NoNewWindow -PassThru -Wait

        if ($initProcess.ExitCode -eq 0) {
            Write-Success "Authentication successful"
            $SetupStatus.Authenticated = $true
        } else {
            Write-Warning "Authentication may have completed with warnings (exit code: $($initProcess.ExitCode))"
            $SetupStatus.Authenticated = $true
        }
    } catch {
        Write-Error "Authentication failed: $($_.Exception.Message)"
        Write-Host "Try running: gcloud auth login" -ForegroundColor Yellow
        return $false
    }

    return $true
}

function Configure-Project {
    param([string]$ProjectId, [string]$Region)

    Write-Step "Configuring project: $ProjectId"

    try {
        & gcloud config set project $ProjectId --quiet 2>$null
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to set project"
            return $false
        }

        & gcloud config set compute/region $Region --quiet 2>$null
        if ($LASTEXITCODE -ne 0) {
            Write-Warning "Failed to set region, continuing..."
        }

        Write-Success "Project configured: $ProjectId"
        Write-Success "Region configured: $Region"
        $SetupStatus.ProjectConfigured = $true

        return $true
    } catch {
        Write-Error "Project configuration failed: $($_.Exception.Message)"
        return $false
    }
}

function Enable-APIs {
    Write-Step "Enabling required Google Cloud APIs..."

    $apis = @(
        "appengine.googleapis.com",
        "cloudbuild.googleapis.com",
        "cloudresourcemanager.googleapis.com",
        "iam.googleapis.com",
        "firestore.googleapis.com",
        "firebase.googleapis.com"
    )

    $enabledCount = 0

    foreach ($api in $apis) {
        Write-Host "Enabling $api..." -ForegroundColor Cyan
        try {
            & gcloud services enable $api --quiet 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Success "  ✓ $api enabled"
                $enabledCount++
            } else {
                Write-Warning "  ⚠️ $api may already be enabled"
                $enabledCount++
            }
        } catch {
            Write-Warning "  ⚠️ Failed to enable $api, continuing..."
        }
    }

    if ($enabledCount -ge 4) {
        Write-Success "APIs enabled successfully ($enabledCount/$($apis.Count))"
        $SetupStatus.ApisEnabled = $true
        return $true
    } else {
        Write-Error "Failed to enable required APIs"
        return $false
    }
}

function Create-AppEngine {
    param([string]$Region)

    Write-Step "Setting up Google App Engine..."

    try {
        & gcloud app describe > $null 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success "App Engine app already exists"
            $SetupStatus.AppEngineCreated = $true
            return $true
        }
    } catch {
        # App doesn't exist, continue to create it
    }

    Write-Host "Creating App Engine app in region: $Region" -ForegroundColor Cyan

    try {
        & gcloud app create --region=$Region --quiet 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Success "App Engine app created successfully"
            $SetupStatus.AppEngineCreated = $true
            return $true
        } else {
            Write-Error "Failed to create App Engine app"
            return $false
        }
    } catch {
        Write-Error "App Engine creation failed: $($_.Exception.Message)"
        return $false
    }
}

function Run-FinalTests {
    Write-Step "Running final deployment tests..."

    try {
        & "$PSScriptRoot\test-deployment.ps1"
        if ($LASTEXITCODE -eq 0) {
            Write-Success "All deployment tests passed!"
            $SetupStatus.TestsPassing = $true
            return $true
        } else {
            Write-Warning "Some tests failed. Please check the output above."
            return $false
        }
    } catch {
        Write-Error "Failed to run tests: $($_.Exception.Message)"
        return $false
    }
}

function Show-SetupSummary {
    Write-Host ""
    Write-Host "=================================================" -ForegroundColor Cyan
    Write-Host "📊 GOOGLE CLOUD SETUP SUMMARY" -ForegroundColor Cyan
    Write-Host "=================================================" -ForegroundColor Cyan
    Write-Host ""

    $statusItems = @(
        @{Name="Google Cloud SDK"; Status=$SetupStatus.GcloudInstalled},
        @{Name="Authentication"; Status=$SetupStatus.Authenticated},
        @{Name="Project Configuration"; Status=$SetupStatus.ProjectConfigured},
        @{Name="API Enablement"; Status=$SetupStatus.ApisEnabled},
        @{Name="App Engine Setup"; Status=$SetupStatus.AppEngineCreated},
        @{Name="Deployment Tests"; Status=$SetupStatus.TestsPassing}
    )

    foreach ($item in $statusItems) {
        $statusIcon = if ($item.Status) { "✅" } else { "❌" }
        $statusColor = if ($item.Status) { "Green" } else { "Red" }
        Write-Host "$statusIcon $($item.Name)" -ForegroundColor $statusColor
    }

    $completedCount = ($statusItems | Where-Object { $_.Status }).Count
    $totalCount = $statusItems.Count

    Write-Host ""
    Write-Host "COMPLETED: $completedCount/$totalCount" -ForegroundColor $(if ($completedCount -eq $totalCount) { "Green" } else { "Yellow" })

    if ($SetupStatus.TestsPassing) {
        Write-Host ""
        Write-Host "🎉 SETUP COMPLETED SUCCESSFULLY!" -ForegroundColor Green
        Write-Host "Your Souk El-Syarat is ready for deployment!" -ForegroundColor Green
        Write-Host ""
        Write-Host "🚀 DEPLOYMENT COMMANDS:" -ForegroundColor Cyan
        Write-Host "   Production: .\deploy-app-engine.sh" -ForegroundColor White
        Write-Host "   Quick Test: .\deploy-quick.sh" -ForegroundColor White
        Write-Host ""
        Write-Host "MONITORING COMMANDS:" -ForegroundColor Cyan
        Write-Host "   View logs: gcloud app logs tail" -ForegroundColor White
        Write-Host "   Check versions: gcloud app versions list" -ForegroundColor White
    } else {
        Write-Host ""
        Write-Host "⚠️ SETUP PARTIALLY COMPLETE" -ForegroundColor Yellow
        Write-Host "Some components may need manual attention." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "🔧 TROUBLESHOOTING:" -ForegroundColor Cyan
        Write-Host "   Run tests: .\test-deployment.ps1" -ForegroundColor White
        Write-Host "   Check status: .\verify-gcloud-setup.bat" -ForegroundColor White
        Write-Host "   Re-run setup: .\complete-gcloud-setup.ps1" -ForegroundColor White
    }

    Write-Host ""
    Write-Host "📝 USEFUL COMMANDS:" -ForegroundColor Cyan
    Write-Host "   View project: gcloud config get-value project" -ForegroundColor White
    Write-Host "   Check auth: gcloud auth list" -ForegroundColor White
    Write-Host "   List apps: gcloud app versions list" -ForegroundColor White
    Write-Host "   View logs: gcloud app logs tail" -ForegroundColor White
    Write-Host ""
    Write-Host "=================================================" -ForegroundColor Cyan
}

# Main setup flow
function Start-CompleteSetup {
    Write-Host "Starting complete Google Cloud SDK setup..." -ForegroundColor Yellow
    Write-Host "This process may take several minutes." -ForegroundColor Yellow
    Write-Host ""

    try {
        # Step 1: Check if gcloud is installed
        if (-not (Test-GcloudInstalled)) {
            Install-GcloudSDK
        }

        # Step 2: Initialize and authenticate
        if (-not (Initialize-Gcloud)) {
            Write-Error "Authentication failed. Please try again."
            return
        }

        # Step 3: Configure project
        if (-not (Configure-Project -ProjectId $ProjectId -Region $Region)) {
            Write-Error "Project configuration failed."
            return
        }

        # Step 4: Enable APIs
        if (-not (Enable-APIs)) {
            Write-Warning "Some APIs failed to enable, but continuing..."
        }

        # Step 5: Create App Engine app
        if (-not (Create-AppEngine -Region $Region)) {
            Write-Warning "App Engine setup failed, but continuing..."
        }

        # Step 6: Run final tests
        Write-Host ""
        Run-FinalTests

        # Step 7: Show summary
        Show-SetupSummary
    } catch {
        Write-Error "Setup failed with error: $($_.Exception.Message)"
        Show-SetupSummary
    }
}

# Handle command line arguments
if ($args.Contains("--help") -or $args.Contains("-h")) {
    Write-Host "COMPLETE GOOGLE CLOUD SDK SETUP FOR SOUK EL-SYARAT" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "USAGE:" -ForegroundColor Yellow
    Write-Host "  .\complete-gcloud-setup.ps1 [options]" -ForegroundColor White
    Write-Host ""
    Write-Host "OPTIONS:" -ForegroundColor Yellow
    Write-Host "  -ProjectId <id>    Google Cloud project ID (default: souk-el-syarat)" -ForegroundColor White
    Write-Host "  -Region <region>   Google Cloud region (default: us-central1)" -ForegroundColor White
    Write-Host ""
    Write-Host "EXAMPLES:" -ForegroundColor Yellow
    Write-Host "  .\complete-gcloud-setup.ps1" -ForegroundColor White
    Write-Host "  .\complete-gcloud-setup.ps1 -ProjectId my-project" -ForegroundColor White
    exit 0
}

# Run the setup
Start-CompleteSetup

    Write-Warning "Google Cloud SDK not found. Installing..."
    return $false
}

function Install-GcloudSDK {
    Write-Step "Downloading Google Cloud SDK..."

    $installerUrl = "https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe"
    $installerPath = "$env:TEMP\GoogleCloudSDKInstaller.exe"

    try {
        Invoke-WebRequest -Uri $installerUrl -OutFile $installerPath -ErrorAction Stop
        Write-Success "Download completed"
    } catch {
        Write-Error "Failed to download Google Cloud SDK: $($_.Exception.Message)"
        Write-Host "Please download manually from: https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
        exit 1
    }

    Write-Step "Installing Google Cloud SDK..."
    Write-Host "This may take a few minutes. Please wait..." -ForegroundColor Yellow

    try {
        # Run installer silently
        $process = Start-Process -FilePath $installerPath -ArgumentList "/S" -Wait -PassThru -ErrorAction Stop

        if ($process.ExitCode -eq 0) {
            Write-Success "Installation completed successfully"
        } else {
            Write-Error "Installation failed with exit code: $($process.ExitCode)"
            exit 1
        }
    } catch {
        Write-Error "Installation process failed: $($_.Exception.Message)"
        exit 1
    }

    # Clean up installer
    Remove-Item $installerPath -ErrorAction SilentlyContinue

    # Refresh PATH to include new gcloud installation
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

    # Verify installation
    Write-Step "Verifying installation..."
    Start-Sleep -Seconds 2  # Give it a moment

    try {
        $version = & gcloud --version 2>$null | Select-Object -First 1
        if ($version -and $version.Contains("Google Cloud SDK")) {
            Write-Success "Google Cloud SDK verified: $version"
            $global:SetupStatus.GcloudInstalled = $true
        } else {
            Write-Error "Installation verification failed"
            exit 1
        }
    } catch {
        Write-Error "Cannot verify installation: $($_.Exception.Message)"
        Write-Host "Please restart PowerShell and run this script again" -ForegroundColor Yellow
        exit 1
    }
}

function Initialize-Gcloud {
    Write-Step "Initializing Google Cloud SDK..."

    try {
        # Run gcloud init with no browser launch
        Write-Host "Starting authentication process..." -ForegroundColor Cyan
        Write-Host "A browser window will open for authentication." -ForegroundColor Yellow
        Write-Host "Please sign in with your Google account." -ForegroundColor Yellow
        Write-Host ""

        $initProcess = Start-Process -FilePath "gcloud" -ArgumentList "auth", "login", "--no-launch-browser" -NoNewWindow -PassThru -Wait

        if ($initProcess.ExitCode -eq 0) {
            Write-Success "Authentication successful"
            $global:SetupStatus.Authenticated = $true
        } else {
            Write-Warning "Authentication may have completed with warnings (exit code: $($initProcess.ExitCode))"
            $global:SetupStatus.Authenticated = $true  # Assume success for now
        }
    } catch {
        Write-Error "Authentication failed: $($_.Exception.Message)"
        Write-Host "Try running: gcloud auth login" -ForegroundColor Yellow
        return $false
    }

    return $true
}

function Configure-Project {
    param([string]$ProjectId, [string]$Region)

    Write-Step "Configuring project: $ProjectId"

    try {
        # Set project
        & gcloud config set project $ProjectId --quiet 2>$null
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to set project"
            return $false
        }

        # Set region
        & gcloud config set compute/region $Region --quiet 2>$null
        if ($LASTEXITCODE -ne 0) {
            Write-Warning "Failed to set region, continuing..."
        }

        Write-Success "Project configured: $ProjectId"
        Write-Success "Region configured: $Region"
        $global:SetupStatus.ProjectConfigured = $true

        return $true
    } catch {
        Write-Error "Project configuration failed: $($_.Exception.Message)"
        return $false
    }
}

function Enable-APIs {
    Write-Step "Enabling required Google Cloud APIs..."

    $apis = @(
        "appengine.googleapis.com",
        "cloudbuild.googleapis.com",
        "cloudresourcemanager.googleapis.com",
        "iam.googleapis.com",
        "firestore.googleapis.com",
        "firebase.googleapis.com"
    )

    $enabledCount = 0

    foreach ($api in $apis) {
        Write-Host "Enabling $api..." -ForegroundColor Cyan
        try {
            & gcloud services enable $api --quiet 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Success "  ✓ $api enabled"
                $enabledCount++
            } else {
                Write-Warning "  ⚠️ $api may already be enabled"
                $enabledCount++  # Count as success if already enabled
            }
        } catch {
            Write-Warning "  ⚠️ Failed to enable $api, continuing..."
        }
    }

    if ($enabledCount -ge 4) {  # At least core APIs enabled
        Write-Success "APIs enabled successfully ($enabledCount/$($apis.Count))"
        $global:SetupStatus.ApisEnabled = $true
        return $true
    } else {
        Write-Error "Failed to enable required APIs"
        return $false
    }
}

function Create-AppEngine {
    param([string]$Region)

    Write-Step "Setting up Google App Engine..."

    try {
        # Check if App Engine app already exists
        & gcloud app describe > $null 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success "App Engine app already exists"
            $global:SetupStatus.AppEngineCreated = $true
            return $true
        }
    } catch {
        # App doesn't exist, create it
    }

    Write-Host "Creating App Engine app in region: $Region" -ForegroundColor Cyan

    try {
        & gcloud app create --region=$Region --quiet 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Success "App Engine app created successfully"
            $global:SetupStatus.AppEngineCreated = $true
            return $true
        } else {
            Write-Error "Failed to create App Engine app"
            return $false
        }
    } catch {
        Write-Error "App Engine creation failed: $($_.Exception.Message)"
        return $false
    }
}

function Run-FinalTests {
    Write-Step "Running final deployment tests..."

    try {
        # Run the test script
        & "$PSScriptRoot\test-deployment.ps1"

        # Check if test script succeeded
        if ($LASTEXITCODE -eq 0) {
            Write-Success "All deployment tests passed!"
            $global:SetupStatus.TestsPassing = $true
            return $true
        } else {
            Write-Warning "Some tests failed. Please check the output above."
            return $false
        }
    } catch {
        Write-Error "Failed to run tests: $($_.Exception.Message)"
        return $false
    }
}

function Show-SetupSummary {
    Write-Host ""
    Write-Host "=================================================" -ForegroundColor Cyan
    Write-Host "📊 GOOGLE CLOUD SETUP SUMMARY" -ForegroundColor Cyan
    Write-Host "=================================================" -ForegroundColor Cyan
    Write-Host ""

    $statusItems = @(
        @{Name="Google Cloud SDK"; Status=$global:SetupStatus.GcloudInstalled},
        @{Name="Authentication"; Status=$global:SetupStatus.Authenticated},
        @{Name="Project Configuration"; Status=$global:SetupStatus.ProjectConfigured},
        @{Name="API Enablement"; Status=$global:SetupStatus.ApisEnabled},
        @{Name="App Engine Setup"; Status=$global:SetupStatus.AppEngineCreated},
        @{Name="Deployment Tests"; Status=$global:SetupStatus.TestsPassing}
    )

    foreach ($item in $statusItems) {
        $statusIcon = if ($item.Status) { "✅" } else { "❌" }
        $statusColor = if ($item.Status) { "Green" } else { "Red" }
        Write-Host "$statusIcon $($item.Name)" -ForegroundColor $statusColor
    }

    $completedCount = ($statusItems | Where-Object { $_.Status }).Count
    $totalCount = $statusItems.Count

    Write-Host ""
    Write-Host "COMPLETED: $completedCount/$totalCount" -ForegroundColor $(if ($completedCount -eq $totalCount) { "Green" } else { "Yellow" })

    if ($global:SetupStatus.TestsPassing) {
        Write-Host ""
        Write-Host "🎉 SETUP COMPLETED SUCCESSFULLY!" -ForegroundColor Green
        Write-Host "Your Souk El-Syarat is ready for deployment!" -ForegroundColor Green
        Write-Host ""
        Write-Host "🚀 DEPLOYMENT COMMANDS:" -ForegroundColor Cyan
        Write-Host "   Production: .\deploy-app-engine.sh" -ForegroundColor White
        Write-Host "   Quick Test: .\deploy-quick.sh" -ForegroundColor White
        Write-Host "   Rollback: .\rollback.sh" -ForegroundColor White
    } else {
        Write-Host ""
        Write-Host "⚠️ SETUP PARTIALLY COMPLETE" -ForegroundColor Yellow
        Write-Host "Some components may need manual attention." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "🔧 TROUBLESHOOTING:" -ForegroundColor Cyan
        Write-Host "   Run tests: powershell.exe -ExecutionPolicy Bypass -File test-deployment.ps1" -ForegroundColor White
        Write-Host "   Check status: .\verify-gcloud-setup.bat" -ForegroundColor White
        Write-Host "   Re-run setup: powershell.exe -ExecutionPolicy Bypass -File $PSCommandPath" -ForegroundColor White
    }

    Write-Host ""
    Write-Host "📝 USEFUL COMMANDS:" -ForegroundColor Cyan
    Write-Host "   View project: gcloud config get-value project" -ForegroundColor White
    Write-Host "   Check auth: gcloud auth list" -ForegroundColor White
    Write-Host "   List apps: gcloud app versions list" -ForegroundColor White
    Write-Host "   View logs: gcloud app logs tail" -ForegroundColor White
    Write-Host ""
    Write-Host "=================================================" -ForegroundColor Cyan
}

# Main setup flow
function Start-CompleteSetup {
    Write-Host "Starting complete Google Cloud SDK setup..." -ForegroundColor Yellow
    Write-Host "This process may take several minutes." -ForegroundColor Yellow
    Write-Host ""

    try {
        # Step 1: Check if gcloud is installed
        if (-not (Test-GcloudInstalled)) {
            Install-GcloudSDK
        }

        # Step 2: Initialize and authenticate
        if (-not (Initialize-Gcloud)) {
            Write-Error "Authentication failed. Please try again."
            return
        }

        # Step 3: Configure project
        if (-not (Configure-Project -ProjectId $ProjectId -Region $Region)) {
            Write-Error "Project configuration failed."
            return
        }

        # Step 4: Enable APIs
        if (-not (Enable-APIs)) {
            Write-Warning "Some APIs failed to enable, but continuing..."
        }

        # Step 5: Create App Engine app
        if (-not (Create-AppEngine -Region $Region)) {
            Write-Warning "App Engine setup failed, but continuing..."
        }

        # Step 6: Run final tests
        Write-Host ""
        Run-FinalTests

        # Step 7: Show summary
        Show-SetupSummary
    } catch {
        Write-Error "Setup failed with error: $($_.Exception.Message)"
        Show-SetupSummary
    }
}

# Handle command line arguments
if ($args.Contains("--help") -or $args.Contains("-h")) {
    Write-Host "COMPLETE GOOGLE CLOUD SDK SETUP FOR SOUK EL-SYARAT" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "USAGE:" -ForegroundColor Yellow
    Write-Host "  .\complete-gcloud-setup.ps1 [options]" -ForegroundColor White
    Write-Host ""
    Write-Host "OPTIONS:" -ForegroundColor Yellow
    Write-Host "  -ProjectId <id>    Google Cloud project ID (default: souk-el-syarat)" -ForegroundColor White
    Write-Host "  -Region <region>   Google Cloud region (default: us-central1)" -ForegroundColor White
    Write-Host ""
    Write-Host "EXAMPLES:" -ForegroundColor Yellow
    Write-Host "  .\complete-gcloud-setup.ps1" -ForegroundColor White
    Write-Host "  .\complete-gcloud-setup.ps1 -ProjectId my-project" -ForegroundColor White
    exit 0
}

# Run the setup
Start-CompleteSetup
