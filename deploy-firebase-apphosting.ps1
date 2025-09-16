# 🚀 FIREBASE APP HOSTING DEPLOYMENT SCRIPT
# Souk El-Syarat - Professional Firebase App Hosting Deployment

param(
    [string]$ProjectId = "souk-el-syarat",
    [string]$BackendName = "souk-el-sayarat-backend"
)

$ErrorActionPreference = "Stop"

# Colors for output
function Write-Info { Write-Host "[INFO] $args" -ForegroundColor Blue }
function Write-Success { Write-Host "[SUCCESS] $args" -ForegroundColor Green }
function Write-Warning { Write-Host "[WARNING] $args" -ForegroundColor Yellow }
function Write-Error { Write-Host "[ERROR] $args" -ForegroundColor Red }

# Check prerequisites
function Test-Prerequisites {
    Write-Info "Checking prerequisites..."
    
    if (-not (Get-Command firebase -ErrorAction SilentlyContinue)) {
        Write-Error "Firebase CLI is not installed. Please install it first."
        exit 1
    }
    
    if (-not (Get-Command gcloud -ErrorAction SilentlyContinue)) {
        Write-Error "Google Cloud CLI is not installed. Please install it first."
        exit 1
    }
    
    # Check if logged in to Firebase
    $firebaseUser = firebase login:list 2>$null
    if (-not $firebaseUser) {
        Write-Error "Not logged in to Firebase. Please run 'firebase login'"
        exit 1
    }
    
    # Check if logged in to Google Cloud
    $gcloudUser = gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>$null
    if (-not $gcloudUser) {
        Write-Error "Not logged in to Google Cloud. Please run 'gcloud auth login'"
        exit 1
    }
    
    Write-Success "Prerequisites check passed"
}

# Set the project
function Set-Project {
    Write-Info "Setting project to $ProjectId..."
    firebase use $ProjectId
    gcloud config set project $ProjectId
    Write-Success "Project set to $ProjectId"
}

# Build the application
function Build-Application {
    Write-Info "Building application for Firebase App Hosting..."
    
    try {
        # Clean previous build
        if (Test-Path "dist") {
            Remove-Item -Recurse -Force "dist"
        }
        
        # Build the application
        npm run build:apphosting:ci
        
        if (Test-Path "dist") {
            Write-Success "Application built successfully"
        } else {
            throw "Build failed - dist directory not found"
        }
    }
    catch {
        Write-Error "Build failed: $_"
        exit 1
    }
}

# Deploy to Firebase App Hosting
function Deploy-AppHosting {
    Write-Info "Deploying to Firebase App Hosting..."
    
    try {
        # Deploy the backend
        firebase deploy --only apphosting:$BackendName --force
        
        Write-Success "Firebase App Hosting deployment completed"
    }
    catch {
        Write-Error "Firebase App Hosting deployment failed: $_"
        exit 1
    }
}

# Get deployment URL and test
function Test-Deployment {
    Write-Info "Getting deployment URL and testing..."
    
    try {
        # Get the backend URL
        $backendUrl = firebase apphosting:backends:get $BackendName --format="value(url)" 2>$null
        
        if ($backendUrl) {
            Write-Success "Backend URL: $backendUrl"
            
            # Test health endpoint
            Write-Info "Testing health endpoint..."
            $healthUrl = "$backendUrl/health"
            
            try {
                $response = Invoke-WebRequest -Uri $healthUrl -Method Get -TimeoutSec 30
                if ($response.StatusCode -eq 200) {
                    Write-Success "Health check passed: $($response.Content)"
                } else {
                    Write-Warning "Health check returned status: $($response.StatusCode)"
                }
            }
            catch {
                Write-Warning "Health check failed: $_"
            }
            
            # Test API status
            Write-Info "Testing API status..."
            $apiUrl = "$backendUrl/api/status"
            
            try {
                $response = Invoke-WebRequest -Uri $apiUrl -Method Get -TimeoutSec 30
                if ($response.StatusCode -eq 200) {
                    Write-Success "API status check passed: $($response.Content)"
                } else {
                    Write-Warning "API status check returned status: $($response.StatusCode)"
                }
            }
            catch {
                Write-Warning "API status check failed: $_"
            }
        } else {
            Write-Warning "Could not retrieve backend URL"
        }
    }
    catch {
        Write-Error "Failed to test deployment: $_"
    }
}

# Check deployment logs
function Get-DeploymentLogs {
    Write-Info "Checking deployment logs..."
    
    try {
        # Get recent logs
        firebase apphosting:backends:get $BackendName --format="value(logsUrl)" 2>$null
        
        Write-Info "Check the Firebase Console for detailed logs:"
        Write-Info "https://console.firebase.google.com/project/$ProjectId/apphosting"
    }
    catch {
        Write-Warning "Could not retrieve logs: $_"
    }
}

# Main execution
function Main {
    Write-Host "🚀 Souk El-Syarat Firebase App Hosting Deployment" -ForegroundColor Cyan
    Write-Host "=================================================" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Info "Project: $ProjectId"
    Write-Info "Backend: $BackendName"
    Write-Host ""
    
    Test-Prerequisites
    Set-Project
    Build-Application
    Deploy-AppHosting
    Test-Deployment
    Get-DeploymentLogs
    
    Write-Host ""
    Write-Success "🎉 Firebase App Hosting deployment completed!"
    Write-Info "Check the Firebase Console for detailed information:"
    Write-Info "https://console.firebase.google.com/project/$ProjectId/apphosting"
}

# Run main function
Main
