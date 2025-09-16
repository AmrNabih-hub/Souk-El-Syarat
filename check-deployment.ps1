# 🔍 DEPLOYMENT HEALTH CHECK
# Souk El-Syarat - Quick Status Check

param(
    [string]$ProjectId = "souk-el-syarat",
    [string]$BackendName = "souk-el-sayarat-backend"
)

# Colors
function Write-Info { Write-Host "[INFO] $args" -ForegroundColor Blue }
function Write-Success { Write-Host "[SUCCESS] $args" -ForegroundColor Green }
function Write-Warning { Write-Host "[WARNING] $args" -ForegroundColor Yellow }
function Write-Error { Write-Host "[ERROR] $args" -ForegroundColor Red }

Write-Host "🔍 DEPLOYMENT HEALTH CHECK" -ForegroundColor Cyan
Write-Host "==========================" -ForegroundColor Cyan
Write-Host ""

# Check port configuration
Write-Info "Checking port configuration..."
$apphostingContent = Get-Content "apphosting.yaml" -Raw
if ($apphostingContent -match "port: 8080") {
    Write-Success "✅ Port correctly set to 8080 in apphosting.yaml"
} else {
    Write-Error "❌ Port NOT set to 8080 in apphosting.yaml"
}

if ($apphostingContent -match 'value: "8080"') {
    Write-Success "✅ PORT environment variable correctly set to 8080"
} else {
    Write-Error "❌ PORT environment variable NOT set to 8080"
}

# Check server configuration
Write-Info "Checking server configuration..."
$serverContent = Get-Content "server.js" -Raw
if ($serverContent -match 'process\.env\.PORT \|\| 8080') {
    Write-Success "✅ Server uses PORT environment variable correctly"
} else {
    Write-Error "❌ Server does not use PORT environment variable"
}

# Check Firebase backends
Write-Info "Checking Firebase backends..."
try {
    $backends = firebase apphosting:backends:list --format="json" 2>$null
    if ($backends) {
        $backendList = $backends | ConvertFrom-Json
        Write-Success "Found $($backendList.Count) backend(s):"

        foreach ($backend in $backendList) {
            Write-Info "  - $($backend.name) ($($backend.primaryRegion))"
            Write-Info "    URL: $($backend.url)"
            Write-Info "    Updated: $($backend.updateTime)"
        }
    }
} catch {
    Write-Error "Failed to check Firebase backends: $_"
}

# Test backend health
Write-Info "Testing backend health..."
try {
    $backendInfo = firebase apphosting:backends:get $BackendName --format="json" 2>$null
    if ($backendInfo) {
        $backend = $backendInfo | ConvertFrom-Json
        $url = $backend.url

        Write-Info "Testing: $url/health"
        $response = Invoke-WebRequest -Uri "$url/health" -Method Get -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Success "✅ Health check PASSED"
        } else {
            Write-Error "❌ Health check failed with status $($response.StatusCode)"
        }
    }
} catch {
    Write-Error "Backend health check failed: $_"
}

Write-Host ""
Write-Success "Health check completed!"
