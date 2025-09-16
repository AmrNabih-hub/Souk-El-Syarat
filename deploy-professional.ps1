# 🚀 PROFESSIONAL FIREBASE APP HOSTING DEPLOYMENT
# Souk El-Syarat - Based on Google Cloud Logs Analysis

param(
    [string]$ProjectId = "souk-el-syarat",
    [string]$BackendName = "souk-el-sayarat-backend",
    [switch]$CleanDeploy,
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"

# Colors for output
function Write-Info { Write-Host "[INFO] $args" -ForegroundColor Blue }
function Write-Success { Write-Host "[SUCCESS] $args" -ForegroundColor Green }
function Write-Warning { Write-Host "[WARNING] $args" -ForegroundColor Yellow }
function Write-Error { Write-Host "[ERROR] $args" -ForegroundColor Red }
function Write-Critical { Write-Host "[CRITICAL] $args" -ForegroundColor Red -BackgroundColor Yellow }

# Professional logging function
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"

    if ($Verbose) {
        switch ($Level) {
            "INFO" { Write-Info $Message }
            "SUCCESS" { Write-Success $Message }
            "WARNING" { Write-Warning $Message }
            "ERROR" { Write-Error $Message }
            "CRITICAL" { Write-Critical $Message }
        }
    } else {
        Write-Host $logMessage
    }
}

# Pre-deployment validation
function Test-PreDeployment {
    Write-Log "Running pre-deployment validation..." "INFO"

    # Check if all required files exist
    $requiredFiles = @(
        "apphosting.yaml",
        "firebase.json",
        "server.js",
        "package.json"
    )

    foreach ($file in $requiredFiles) {
        if (-not (Test-Path $file)) {
            Write-Log "Required file missing: $file" "CRITICAL"
            exit 1
        }
    }

    # Validate port configuration
    $apphostingContent = Get-Content "apphosting.yaml" -Raw
    if ($apphostingContent -notmatch "port: 8080") {
        Write-Log "Port configuration is incorrect in apphosting.yaml" "CRITICAL"
        exit 1
    }

    if ($apphostingContent -notmatch 'value: "8080"') {
        Write-Log "PORT environment variable is incorrect in apphosting.yaml" "CRITICAL"
        exit 1
    }

    # Check server.js for correct port usage
    $serverContent = Get-Content "server.js" -Raw
    if ($serverContent -notmatch 'process\.env\.PORT \|\| 8080') {
        Write-Log "Server.js is not configured to use PORT environment variable" "CRITICAL"
        exit 1
    }

    if ($serverContent -notmatch "'0\.0\.0\.0'") {
        Write-Log "Server is not configured to bind to all interfaces" "CRITICAL"
        exit 1
    }

    Write-Log "Pre-deployment validation passed" "SUCCESS"
}

# Clean deployment function
function Invoke-CleanDeployment {
    Write-Log "Performing clean deployment..." "INFO"

    # Remove old backends if requested
    if ($CleanDeploy) {
        Write-Log "Cleaning up old backends..." "WARNING"

        try {
            # Delete the old my-web-app backend
            firebase apphosting:backends:delete my-web-app --force 2>$null
            Write-Log "Cleaned up my-web-app backend" "SUCCESS"
        }
        catch {
            Write-Log "Could not clean up my-web-app backend: $_" "WARNING"
        }
    }
}

# Build application
function Invoke-Build {
    Write-Log "Building application..." "INFO"

    # Clean previous build
    if (Test-Path "dist") {
        Remove-Item -Recurse -Force "dist"
    }

    # Install dependencies
    Write-Log "Installing dependencies..." "INFO"
    npm install --include=dev --legacy-peer-deps

    # Build application
    Write-Log "Building for Firebase App Hosting..." "INFO"
    npm run build:apphosting:ci

    if (-not (Test-Path "dist")) {
        Write-Log "Build failed - dist directory not created" "CRITICAL"
        exit 1
    }

    Write-Log "Build completed successfully" "SUCCESS"
}

# Deploy to Firebase App Hosting
function Invoke-Deployment {
    Write-Log "Deploying to Firebase App Hosting..." "INFO"

    try {
        # Set project
        firebase use $ProjectId

        # Deploy backend
        Write-Log "Deploying backend: $BackendName" "INFO"
        $deployCommand = "firebase deploy --only apphosting:$BackendName --force"

        if ($Verbose) {
            Write-Log "Running: $deployCommand" "INFO"
        }

        Invoke-Expression $deployCommand

        Write-Log "Firebase App Hosting deployment completed" "SUCCESS"
    }
    catch {
        Write-Log "Deployment failed: $_" "CRITICAL"
        exit 1
    }
}

# Post-deployment verification
function Test-PostDeployment {
    Write-Log "Running post-deployment verification..." "INFO"

    try {
        # Get backend URL
        $backendInfo = firebase apphosting:backends:get $BackendName --format="json" 2>$null
        if ($backendInfo) {
            $backend = $backendInfo | ConvertFrom-Json
            $backendUrl = $backend.url

            Write-Log "Backend URL: $backendUrl" "SUCCESS"

            # Test health endpoint
            Write-Log "Testing health endpoint..." "INFO"
            try {
                $response = Invoke-WebRequest -Uri "$backendUrl/health" -Method Get -TimeoutSec 30
                if ($response.StatusCode -eq 200) {
                    Write-Log "Health check PASSED: $($response.Content)" "SUCCESS"
                } else {
                    Write-Log "Health check FAILED: Status $($response.StatusCode)" "WARNING"
                }
            }
            catch {
                Write-Log "Health check FAILED: $_" "ERROR"
            }

            # Test API status
            Write-Log "Testing API status..." "INFO"
            try {
                $response = Invoke-WebRequest -Uri "$backendUrl/api/status" -Method Get -TimeoutSec 30
                if ($response.StatusCode -eq 200) {
                    Write-Log "API status check PASSED: $($response.Content)" "SUCCESS"
                } else {
                    Write-Log "API status check FAILED: Status $($response.StatusCode)" "WARNING"
                }
            }
            catch {
                Write-Log "API status check FAILED: $_" "ERROR"
            }
        } else {
            Write-Log "Could not retrieve backend information" "ERROR"
        }
    }
    catch {
        Write-Log "Post-deployment verification failed: $_" "ERROR"
    }
}

# Get deployment logs
function Get-DeploymentLogs {
    Write-Log "Retrieving deployment logs..." "INFO"

    try {
        $logsUrl = firebase apphosting:backends:get $BackendName --format="value(logsUrl)" 2>$null
        if ($logsUrl) {
            Write-Log "View detailed logs at: $logsUrl" "INFO"
        }

        Write-Log "Firebase Console: https://console.firebase.google.com/project/$ProjectId/apphosting" "INFO"
    }
    catch {
        Write-Log "Could not retrieve logs URL: $_" "WARNING"
    }
}

# Main deployment function
function Start-Deployment {
    Write-Log "=== SOUK EL-SAYARAT PROFESSIONAL DEPLOYMENT ===" "INFO"
    Write-Log "Project: $ProjectId" "INFO"
    Write-Log "Backend: $BackendName" "INFO"
    Write-Log "Clean Deploy: $CleanDeploy" "INFO"
    Write-Log "Verbose: $Verbose" "INFO"
    Write-Log "" "INFO"

    # Execute deployment steps
    Test-PreDeployment
    Invoke-CleanDeployment
    Invoke-Build
    Invoke-Deployment
    Test-PostDeployment
    Get-DeploymentLogs

    Write-Log "" "INFO"
    Write-Log "🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!" "SUCCESS"
    Write-Log "Your backend is now live on Firebase App Hosting" "SUCCESS"
}

# Execute deployment
Start-Deployment
