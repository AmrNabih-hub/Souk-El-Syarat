# 🔧 PROFESSIONAL TROUBLESHOOTING SCRIPT
# Based on Google Cloud Logs and Gemini Analysis

param(
    [string]$ProjectId = "souk-el-syarat",
    [string]$BackendName = "souk-el-sayarat-backend",
    [switch]$DeepAnalysis,
    [switch]$FixIssues
)

$ErrorActionPreference = "Continue"

# Colors and logging
function Write-Info { Write-Host "[INFO] $args" -ForegroundColor Blue }
function Write-Success { Write-Host "[SUCCESS] $args" -ForegroundColor Green }
function Write-Warning { Write-Host "[WARNING] $args" -ForegroundColor Yellow }
function Write-Error { Write-Host "[ERROR] $args" -ForegroundColor Red }
function Write-Critical { Write-Host "[CRITICAL] $args" -ForegroundColor Red -BackgroundColor Yellow }

# Check port configuration
function Test-PortConfiguration {
    Write-Info "🔍 Checking Port Configuration..."

    # Check apphosting.yaml
    if (Test-Path "apphosting.yaml") {
        $content = Get-Content "apphosting.yaml" -Raw

        # Check port setting
        if ($content -match "port: (\d+)") {
            $port = $matches[1]
            if ($port -eq "8080") {
                Write-Success "✅ apphosting.yaml port is correctly set to 8080"
            } else {
                Write-Critical "❌ apphosting.yaml port is INCORRECTLY set to $port (should be 8080)"
                if ($FixIssues) {
                    Write-Info "🔧 Auto-fixing port in apphosting.yaml..."
                    $content = $content -replace "port: \d+", "port: 8080"
                    Set-Content "apphosting.yaml" $content
                    Write-Success "✅ Fixed port in apphosting.yaml"
                }
            }
        }

        # Check PORT environment variable
        if ($content -match 'value: "(\d+)"') {
            $portEnv = $matches[1]
            if ($portEnv -eq "8080") {
                Write-Success "✅ PORT environment variable is correctly set to 8080"
            } else {
                Write-Critical "❌ PORT environment variable is INCORRECTLY set to $portEnv (should be 8080)"
                if ($FixIssues) {
                    Write-Info "🔧 Auto-fixing PORT environment variable..."
                    $content = $content -replace 'value: "\d+"', 'value: "8080"'
                    Set-Content "apphosting.yaml" $content
                    Write-Success "✅ Fixed PORT environment variable"
                }
            }
        }
    } else {
        Write-Critical "❌ apphosting.yaml not found"
    }

    # Check server.js
    if (Test-Path "server.js") {
        $content = Get-Content "server.js" -Raw

        if ($content -match 'process\.env\.PORT \|\| 8080') {
            Write-Success "✅ server.js correctly uses PORT environment variable"
        } else {
            Write-Critical "❌ server.js does not use PORT environment variable correctly"
        }

        if ($content -match "'0\.0\.0\.0'") {
            Write-Success "✅ server.js correctly binds to all interfaces"
        } else {
            Write-Critical "❌ server.js does not bind to all interfaces (should use '0.0.0.0')"
        }
    } else {
        Write-Critical "❌ server.js not found"
    }
}

# Check Firebase configuration
function Test-FirebaseConfiguration {
    Write-Info "🔍 Checking Firebase Configuration..."

    if (Test-Path "firebase.json") {
        $content = Get-Content "firebase.json" -Raw

        if ($content -match '"apphosting"') {
            Write-Success "✅ Firebase App Hosting is configured"
        } else {
            Write-Critical "❌ Firebase App Hosting is not configured"
        }

        if ($content -match $BackendName) {
            Write-Success "✅ Backend '$BackendName' is configured"
        } else {
            Write-Critical "❌ Backend '$BackendName' is not configured"
        }
    } else {
        Write-Critical "❌ firebase.json not found"
    }
}

# Check deployment status
function Test-DeploymentStatus {
    Write-Info "🔍 Checking Deployment Status..."

    try {
        $backends = firebase apphosting:backends:list --format="json" 2>$null
        if ($backends) {
            $backendList = $backends | ConvertFrom-Json

            $targetBackend = $backendList | Where-Object { $_.name -eq $BackendName }
            if ($targetBackend) {
                Write-Success "✅ Backend '$BackendName' exists"
                Write-Info "   URL: $($targetBackend.url)"
                Write-Info "   Region: $($targetBackend.primaryRegion)"
                Write-Info "   Updated: $($targetBackend.updateTime)"

                # Test backend health
                try {
                    $response = Invoke-WebRequest -Uri "$($targetBackend.url)/health" -Method Get -TimeoutSec 10
                    if ($response.StatusCode -eq 200) {
                        Write-Success "✅ Backend health check PASSED"
                    } else {
                        Write-Warning "⚠️  Backend health check returned status $($response.StatusCode)"
                    }
                }
                catch {
                    Write-Error "❌ Backend health check FAILED: $_"
                }
            } else {
                Write-Critical "❌ Backend '$BackendName' does not exist"
            }

            # Check for multiple backends
            if ($backendList.Count -gt 1) {
                Write-Warning "⚠️  Multiple backends detected:"
                foreach ($backend in $backendList) {
                    Write-Info "   - $($backend.name) ($($backend.primaryRegion))"
                }
                Write-Info "   Consider cleaning up unused backends"
            }
        } else {
            Write-Critical "❌ No Firebase App Hosting backends found"
        }
    }
    catch {
        Write-Error "❌ Failed to check deployment status: $_"
    }
}

# Check build configuration
function Test-BuildConfiguration {
    Write-Info "🔍 Checking Build Configuration..."

    if (Test-Path "package.json") {
        $content = Get-Content "package.json" -Raw

        if ($content -match '"build:apphosting:ci"') {
            Write-Success "✅ Build script 'build:apphosting:ci' is configured"
        } else {
            Write-Critical "❌ Build script 'build:apphosting:ci' is missing"
        }

        if ($content -match '"type": "module"') {
            Write-Success "✅ Package is configured as ES module"
        } else {
            Write-Warning "⚠️  Package is not configured as ES module"
        }
    } else {
        Write-Critical "❌ package.json not found"
    }

    # Check if dist directory exists
    if (Test-Path "dist") {
        Write-Success "✅ Build output directory 'dist' exists"
    } else {
        Write-Info "ℹ️  Build output directory 'dist' does not exist (will be created during build)"
    }
}

# Check Google Cloud permissions
function Test-GoogleCloudPermissions {
    Write-Info "🔍 Checking Google Cloud Permissions..."

    try {
        $projectInfo = gcloud config get-value project 2>$null
        if ($projectInfo -and $projectInfo -eq $ProjectId) {
            Write-Success "✅ Correct project is set: $ProjectId"
        } else {
            Write-Critical "❌ Incorrect project set (expected: $ProjectId, got: $projectInfo)"
            if ($FixIssues) {
                Write-Info "🔧 Setting correct project..."
                gcloud config set project $ProjectId
                Write-Success "✅ Project set to $ProjectId"
            }
        }

        # Check if authenticated
        $authInfo = gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>$null
        if ($authInfo) {
            Write-Success "✅ Google Cloud authentication active"
        } else {
            Write-Critical "❌ No active Google Cloud authentication"
        }
    }
    catch {
        Write-Error "❌ Failed to check Google Cloud permissions: $_"
    }
}

# Analyze deployment logs
function Get-DeploymentLogsAnalysis {
    Write-Info "🔍 Analyzing Deployment Logs..."

    if ($DeepAnalysis) {
        try {
            Write-Info "Recent deployment logs:"
            $logs = gcloud logging read "resource.type=apphosting_backend" --limit=10 --format="table(timestamp,severity,textPayload)" --project=$ProjectId 2>$null
            if ($logs) {
                Write-Host $logs
            }

            # Check for port-related errors
            $portErrors = gcloud logging read "textPayload:port OR textPayload:8080 OR textPayload:443" --limit=5 --format="table(timestamp,textPayload)" --project=$ProjectId 2>$null
            if ($portErrors) {
                Write-Warning "⚠️  Port-related errors found:"
                Write-Host $portErrors
            }
        }
        catch {
            Write-Error "❌ Failed to analyze deployment logs: $_"
        }
    } else {
        Write-Info "ℹ️  Deep analysis skipped (use -DeepAnalysis for detailed logs)"
    }
}

# Generate recommendations
function Get-Recommendations {
    Write-Info "💡 RECOMMENDATIONS:"

    Write-Info "1. 🔧 Fix Port Configuration:"
    Write-Info "   - Ensure apphosting.yaml has 'port: 8080'"
    Write-Info "   - Ensure PORT environment variable is '8080'"
    Write-Info "   - Ensure server.js uses 'process.env.PORT || 8080'"

    Write-Info "2. 🚀 Deployment Commands:"
    Write-Info "   - Use: firebase deploy --only apphosting:$BackendName"
    Write-Info "   - Monitor: firebase apphosting:backends:get $BackendName"

    Write-Info "3. 🔍 Troubleshooting:"
    Write-Info "   - Check: https://console.firebase.google.com/project/$ProjectId/apphosting"
    Write-Info "   - Logs: firebase apphosting:backends:get $BackendName --format='value(logsUrl)'"

    Write-Info "4. 🧹 Cleanup:"
    Write-Info "   - Remove unused backends: firebase apphosting:backends:delete <backend-name>"
    Write-Info "   - Clean build: rm -rf dist && npm run build:apphosting:ci"
}

# Main troubleshooting function
function Start-Troubleshooting {
    Write-Host "🔧 PROFESSIONAL TROUBLESHOOTING - SOUK EL-SAYARAT" -ForegroundColor Cyan
    Write-Host "=================================================" -ForegroundColor Cyan
    Write-Host ""

    Write-Info "Project: $ProjectId"
    Write-Info "Backend: $BackendName"
    Write-Info "Deep Analysis: $DeepAnalysis"
    Write-Info "Auto Fix: $FixIssues"
    Write-Host ""

    # Run all checks
    Test-PortConfiguration
    Write-Host ""

    Test-FirebaseConfiguration
    Write-Host ""

    Test-BuildConfiguration
    Write-Host ""

    Test-GoogleCloudPermissions
    Write-Host ""

    Test-DeploymentStatus
    Write-Host ""

    Get-DeploymentLogsAnalysis
    Write-Host ""

    Get-Recommendations
    Write-Host ""

    Write-Success "🎯 TROUBLESHOOTING COMPLETED"
}

# Execute troubleshooting
Start-Troubleshooting
