# Quick Verification Script for Google Cloud SDK Setup

Write-Host "🔍 Verifying Google Cloud SDK Setup" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

$checks = @()
$passed = 0
$total = 0

function Test-Check {
    param([string]$name, [scriptblock]$test)
    Write-Host "[CHECK] $name..." -ForegroundColor Yellow -NoNewline
    $total++
    try {
        $result = & $test
        if ($result) {
            Write-Host " ✅ PASS" -ForegroundColor Green
            $checks += @{Name=$name; Status="PASS"; Details=$result}
            $script:passed++
        } else {
            Write-Host " ❌ FAIL" -ForegroundColor Red
            $checks += @{Name=$name; Status="FAIL"; Details="Test returned false"}
        }
    } catch {
        Write-Host " ❌ ERROR" -ForegroundColor Red
        $checks += @{Name=$name; Status="ERROR"; Details=$_.Exception.Message}
    }
}

# Test 1: gcloud command availability
Test-Check "Google Cloud SDK Installation" {
    $version = & gcloud --version 2>$null | Select-Object -First 1
    return $version -and $version.Contains("Google Cloud SDK")
}

# Test 2: Authentication
Test-Check "Authentication Status" {
    $account = & gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>$null | Select-Object -First 1
    return $account -and $account.Contains("@")
}

# Test 3: Project configuration
Test-Check "Project Configuration" {
    $project = & gcloud config get-value project 2>$null
    return $project -and $project -ne "(unset)" -and $project.Trim().Length -gt 0
}

# Test 4: Region configuration
Test-Check "Region Configuration" {
    $region = & gcloud config get-value compute/region 2>$null
    return $region -and $region -ne "(unset)"
}

# Test 5: App Engine
Test-Check "App Engine Setup" {
    try {
        & gcloud app describe > $null 2>&1
        return $true
    } catch {
        return $false
    }
}

# Test 6: Required APIs
Test-Check "Required APIs" {
    $apis = @("appengine.googleapis.com", "cloudbuild.googleapis.com", "firestore.googleapis.com")
    $allEnabled = $true
    foreach ($api in $apis) {
        try {
            & gcloud services describe $api > $null 2>&1
        } catch {
            $allEnabled = $false
            break
        }
    }
    return $allEnabled
}

Write-Host ""
Write-Host "📊 VERIFICATION SUMMARY" -ForegroundColor Cyan
Write-Host "=======================" -ForegroundColor Cyan
Write-Host "Passed: $passed / $total" -ForegroundColor $(if ($passed -eq $total) { "Green" } else { "Yellow" })
Write-Host ""

foreach ($check in $checks) {
    $status = if ($check.Status -eq "PASS") { "✅" } elseif ($check.Status -eq "ERROR") { "❌" } else { "⚠️" }
    Write-Host "$status $($check.Name): $($check.Status)" -ForegroundColor $(if ($check.Status -eq "PASS") { "Green" } else { "Red" })
    if ($check.Details -and $check.Status -ne "PASS") {
        Write-Host "   Details: $($check.Details)" -ForegroundColor Yellow
    }
}

Write-Host ""
if ($passed -eq $total) {
    Write-Host "🎉 All checks passed! Your Google Cloud SDK is properly configured." -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 Ready for deployment! Run:" -ForegroundColor Cyan
    Write-Host "   powershell.exe -ExecutionPolicy Bypass -File test-deployment.ps1" -ForegroundColor White
} else {
    Write-Host "⚠️ Some checks failed. Please run the setup script:" -ForegroundColor Yellow
    Write-Host "   powershell.exe -ExecutionPolicy Bypass -File setup-gcloud-after-install.ps1" -ForegroundColor White
}

Write-Host ""
Write-Host "📝 Quick Commands:" -ForegroundColor Cyan
Write-Host "   • Check project: gcloud config get-value project" -ForegroundColor White
Write-Host "   • List apps: gcloud app versions list" -ForegroundColor White
Write-Host "   • View logs: gcloud app logs tail" -ForegroundColor White
