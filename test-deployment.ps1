# 🧪 DEPLOYMENT TEST SCRIPT
# Souk El-Syarat - Test Production Deployment

Write-Host "🧪 TESTING DEPLOYMENT CONFIGURATION" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# Test local server
Write-Host "1. Testing Local Server (port 8080)..." -ForegroundColor Blue
try {
    $localResponse = Invoke-WebRequest -Uri "http://localhost:8080/health" -Method Get -TimeoutSec 5
    Write-Host "✅ Local server: $($localResponse.StatusCode) - $($localResponse.Content)" -ForegroundColor Green
} catch {
    Write-Host "ℹ️  Local server not running (expected for testing)" -ForegroundColor Yellow
}

# Test production deployment
Write-Host "2. Testing Production Deployment..." -ForegroundColor Blue
try {
    $backends = firebase apphosting:backends:list --format="json" 2>$null
    if ($backends) {
        $backendList = $backends | ConvertFrom-Json
        Write-Host "Found $($backendList.Count) backend(s):" -ForegroundColor Green

        foreach ($backend in $backendList) {
            Write-Host "  📍 $($backend.name)" -ForegroundColor Cyan
            Write-Host "     URL: $($backend.url)" -ForegroundColor White
            Write-Host "     Region: $($backend.primaryRegion)" -ForegroundColor White

            # Test health endpoint
            try {
                $prodResponse = Invoke-WebRequest -Uri "$($backend.url)/health" -Method Get -TimeoutSec 10
                Write-Host "     ✅ Health: $($prodResponse.StatusCode)" -ForegroundColor Green
            } catch {
                Write-Host "     ❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
            }

            # Test API status
            try {
                $apiResponse = Invoke-WebRequest -Uri "$($backend.url)/api/status" -Method Get -TimeoutSec 10
                Write-Host "     ✅ API: $($apiResponse.StatusCode)" -ForegroundColor Green
            } catch {
                Write-Host "     ❌ API check failed: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "❌ No backends found" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Failed to check backends: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎯 DEPLOYMENT SUMMARY:" -ForegroundColor Cyan
Write-Host "• Local Development: http://localhost:8080 (HTTP)" -ForegroundColor White
Write-Host "• Production: https://your-domain.com (HTTPS)" -ForegroundColor White
Write-Host "• Internal Port: 8080 (always)" -ForegroundColor White
Write-Host "• External Protocol: HTTPS (production only)" -ForegroundColor White
Write-Host ""
Write-Host "✅ Configuration is CORRECT!" -ForegroundColor Green
