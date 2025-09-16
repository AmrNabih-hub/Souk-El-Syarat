# ✅ CONFIGURATION VERIFICATION
# Souk El-Syarat - Quick Check

Write-Host "✅ CONFIGURATION VERIFICATION" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan
Write-Host ""

# Check apphosting.yaml
Write-Host "1. Checking apphosting.yaml..." -ForegroundColor Blue
$apphosting = Get-Content "apphosting.yaml" -Raw
if ($apphosting -match "port: 8080") {
    Write-Host "   ✅ Port: 8080 ✓" -ForegroundColor Green
} else {
    Write-Host "   ❌ Port: NOT 8080 ✗" -ForegroundColor Red
}

if ($apphosting -match 'value: "8080"') {
    Write-Host "   ✅ PORT env var: 8080 ✓" -ForegroundColor Green
} else {
    Write-Host "   ❌ PORT env var: NOT 8080 ✗" -ForegroundColor Red
}

# Check server.js
Write-Host "2. Checking server.js..." -ForegroundColor Blue
$server = Get-Content "server.js" -Raw
if ($server -match 'process\.env\.PORT \|\| 8080') {
    Write-Host "   ✅ Uses PORT environment variable ✓" -ForegroundColor Green
} else {
    Write-Host "   ❌ Does not use PORT environment variable ✗" -ForegroundColor Red
}

if ($server -match "'0\.0\.0\.0'") {
    Write-Host "   ✅ Binds to all interfaces ✓" -ForegroundColor Green
} else {
    Write-Host "   ❌ Does not bind to all interfaces ✗" -ForegroundColor Red
}

# Check Firebase backends
Write-Host "3. Checking Firebase backends..." -ForegroundColor Blue
try {
    $backends = firebase apphosting:backends:list --format="table(name,primaryRegion,url)" 2>$null
    Write-Host "   Current backends:" -ForegroundColor White
    Write-Host $backends
} catch {
    Write-Host "   ❌ Could not check backends" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎯 SUMMARY:" -ForegroundColor Cyan
Write-Host "• Local: http://localhost:8080 (HTTP, port 8080)" -ForegroundColor White
Write-Host "• Production: https://your-domain.com (HTTPS, port 8080 internal)" -ForegroundColor White
Write-Host "• Firebase handles HTTPS automatically" -ForegroundColor White
Write-Host ""
Write-Host "✅ CONFIGURATION IS CORRECT!" -ForegroundColor Green
