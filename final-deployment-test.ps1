# FINAL DEPLOYMENT TEST FOR SOUK EL-SYARAT
# Comprehensive verification of all components

Write-Host "🧪 FINAL DEPLOYMENT TEST - SOUK EL-SYARAT" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Test results tracking
$testResults = @{
    Total = 15
    Passed = 0
    Failed = 0
    CriticalFailures = 0
}

function Write-Test {
    param([string]$message)
    Write-Host "[TEST] $message..." -ForegroundColor Blue -NoNewline
}

function Write-TestResult {
    param([bool]$passed, [string]$details = "")
    if ($passed) {
        Write-Host " ✅ PASS" -ForegroundColor Green
        $script:testResults.Passed++
    } else {
        Write-Host " ❌ FAIL" -ForegroundColor Red
        $script:testResults.Failed++
        if ($details -match "CRITICAL") {
            $script:testResults.CriticalFailures++
        }
    }
    if ($details) {
        Write-Host "       $details" -ForegroundColor Yellow
    }
}

function Test-WithTimeout {
    param([scriptblock]$test, [int]$timeoutSeconds = 30)

    $job = Start-Job -ScriptBlock $test
    $result = Wait-Job $job -Timeout $timeoutSeconds

    if ($result) {
        $output = Receive-Job $job
        Remove-Job $job
        return $output
    } else {
        Stop-Job $job
        Remove-Job $job
        return $null
    }
}

# Test 1: Node.js version
Write-Test "Node.js version check"
try {
    $nodeVersion = & node --version 2>$null
    if ($LASTEXITCODE -eq 0 -and $nodeVersion) {
        $version = $nodeVersion -replace '^v', '' -split '\.' | Select-Object -First 1
        if ([int]$version -ge 20) {
            Write-TestResult $true "Node.js v$nodeVersion (✅ Version 20+)"
        } else {
            Write-TestResult $false "Node.js v$nodeVersion (❌ Need version 20+)"
        }
    } else {
        Write-TestResult $false "CRITICAL: Node.js not found"
    }
} catch {
    Write-TestResult $false "CRITICAL: Node.js error - $($_.Exception.Message)"
}

# Test 2: NPM availability
Write-Test "NPM availability check"
try {
    $npmVersion = & npm --version 2>$null
    if ($LASTEXITCODE -eq 0 -and $npmVersion) {
        Write-TestResult $true "NPM v$npmVersion"
    } else {
        Write-TestResult $false "CRITICAL: NPM not found"
    }
} catch {
    Write-TestResult $false "CRITICAL: NPM error - $($_.Exception.Message)"
}

# Test 3: Package.json validation
Write-Test "Package.json validation"
if (Test-Path "package.json") {
    try {
        $packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
        if ($packageJson.scripts.'build:apphosting') {
            Write-TestResult $true "build:apphosting script exists"
        } else {
            Write-TestResult $false "build:apphosting script missing"
        }
    } catch {
        Write-TestResult $false "Invalid package.json format"
    }
} else {
    Write-TestResult $false "CRITICAL: package.json not found"
}

# Test 4: App.yaml validation
Write-Test "App Engine configuration"
if (Test-Path "app.yaml") {
    $appYaml = Get-Content "app.yaml" -Raw
    if ($appYaml -match "runtime: nodejs20") {
        Write-TestResult $true "App Engine configured for Node.js 20"
    } else {
        Write-TestResult $false "App Engine not configured for Node.js 20"
    }
} else {
    Write-TestResult $false "CRITICAL: app.yaml not found"
}

# Test 5: Cloud Build configuration
Write-Test "Cloud Build configuration"
if (Test-Path "cloudbuild.yaml") {
    $cloudBuild = Get-Content "cloudbuild.yaml" -Raw
    if (($cloudBuild -match "app.*deploy") -or ($cloudBuild -match "'app', 'deploy'")) {
        Write-TestResult $true "Cloud Build configured for App Engine deployment"
    } else {
        Write-TestResult $false "Cloud Build missing App Engine deployment config"
    }
} else {
    Write-TestResult $false "CRITICAL: cloudbuild.yaml not found"
}

# Test 6: Server.js validation
Write-Test "Server configuration"
if (Test-Path "server.js") {
    $serverJs = Get-Content "server.js" -Raw
    if ($serverJs -match "express") {
        Write-TestResult $true "Express server configured"
    } else {
        Write-TestResult $false "Express server not found"
    }
} else {
    Write-TestResult $false "CRITICAL: server.js not found"
}

# Test 7: Deployment scripts
Write-Test "Deployment scripts check"
$scripts = @("deploy-app-engine.sh", "deploy-quick.sh", "rollback.sh", "setup-cloud-build.sh")
$foundScripts = 0
foreach ($script in $scripts) {
    if (Test-Path $script) { $foundScripts++ }
}
if ($foundScripts -eq $scripts.Count) {
    Write-TestResult $true "All $foundScripts deployment scripts found"
} else {
    Write-TestResult $false "Only $foundScripts/$($scripts.Count) deployment scripts found"
}

# Test 8: Dependencies check
Write-Test "Dependencies validation"
if (Test-Path "node_modules") {
    $hasExpress = Test-Path "node_modules/express"
    $hasCompression = Test-Path "node_modules/compression"
    if ($hasExpress -and $hasCompression) {
        Write-TestResult $true "Express and compression installed"
    } else {
        Write-TestResult $false "Missing required dependencies"
    }
} else {
    Write-TestResult $false "CRITICAL: node_modules not found - run 'npm install'"
}

# Test 9: Vite configuration
Write-Test "Build system configuration"
if (Test-Path "vite.config.ts") {
    Write-TestResult $true "Vite configuration found"
} else {
    Write-TestResult $false "CRITICAL: vite.config.ts not found"
}

# Test 10: Google Cloud SDK
Write-Test "Google Cloud SDK availability"
try {
    $gcloudVersion = & gcloud --version 2>$null | Select-Object -First 1
    if ($LASTEXITCODE -eq 0 -and $gcloudVersion -and $gcloudVersion.Contains("Google Cloud SDK")) {
        Write-TestResult $true "Google Cloud SDK v$gcloudVersion"
    } else {
        Write-TestResult $false "CRITICAL: Google Cloud SDK not found or not working"
    }
} catch {
    Write-TestResult $false "CRITICAL: Google Cloud SDK not available - $($_.Exception.Message)"
}

# Test 11: Authentication
Write-Test "Google Cloud authentication"
try {
    $accounts = & gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>$null
    if ($LASTEXITCODE -eq 0 -and $accounts) {
        Write-TestResult $true "Authenticated as: $accounts"
    } else {
        Write-TestResult $false "CRITICAL: Not authenticated with Google Cloud"
    }
} catch {
    Write-TestResult $false "CRITICAL: Authentication check failed - $($_.Exception.Message)"
}

# Test 12: Project configuration
Write-Test "Project configuration"
try {
    $project = & gcloud config get-value project 2>$null
    if ($LASTEXITCODE -eq 0 -and $project -and $project -ne "(unset)") {
        Write-TestResult $true "Project configured: $project"
    } else {
        Write-TestResult $false "CRITICAL: No project configured"
    }
} catch {
    Write-TestResult $false "CRITICAL: Project check failed - $($_.Exception.Message)"
}

# Test 13: App Engine setup
Write-Test "App Engine configuration"
try {
    & gcloud app describe > $null 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-TestResult $true "App Engine app configured"
    } else {
        Write-TestResult $false "App Engine app not configured"
    }
} catch {
    Write-TestResult $false "App Engine check failed - $($_.Exception.Message)"
}

# Test 14: Required APIs
Write-Test "Required APIs check"
try {
    $apis = @("appengine.googleapis.com", "cloudbuild.googleapis.com", "firestore.googleapis.com")
    $enabledApis = 0
    foreach ($api in $apis) {
        try {
            & gcloud services describe $api > $null 2>&1
            if ($LASTEXITCODE -eq 0) { $enabledApis++ }
        } catch {
            # API check failed, continue
        }
    }
    if ($enabledApis -ge 2) {
        Write-TestResult $true "$enabledApis/$($apis.Count) core APIs enabled"
    } else {
        Write-TestResult $false "Only $enabledApis/$($apis.Count) core APIs enabled"
    }
} catch {
    Write-TestResult $false "API check failed - $($_.Exception.Message)"
}

# Test 15: Build process
Write-Test "Build process validation"
try {
    # Test build process with timeout
    $buildResult = Test-WithTimeout -Test { & npm run build:apphosting 2>$null } -TimeoutSeconds 60

    if ($LASTEXITCODE -eq 0 -and (Test-Path "dist") -and (Test-Path "dist/index.html")) {
        # Clean up build artifacts
        Remove-Item -Recurse -Force "dist" -ErrorAction SilentlyContinue
        Write-TestResult $true "Build process successful"
    } else {
        Write-TestResult $false "Build process failed"
    }
} catch {
    Write-TestResult $false "Build test failed - $($_.Exception.Message)"
}

# Summary
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "📊 FINAL TEST RESULTS" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "TOTAL TESTS: $($testResults.Total)" -ForegroundColor White
Write-Host "PASSED: $($testResults.Passed)" -ForegroundColor Green
Write-Host "FAILED: $($testResults.Failed)" -ForegroundColor Red
if ($testResults.CriticalFailures -gt 0) {
    Write-Host "CRITICAL FAILURES: $($testResults.CriticalFailures)" -ForegroundColor Red
}
Write-Host ""

$successRate = [math]::Round(($testResults.Passed / $testResults.Total) * 100, 1)

if ($testResults.Passed -eq $testResults.Total) {
    Write-Host "🎉 ALL TESTS PASSED! ($successRate%)" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 YOUR SOUK EL-SYARAT APPLICATION IS READY FOR DEPLOYMENT!" -ForegroundColor Green
    Write-Host ""
    Write-Host "DEPLOYMENT COMMANDS:" -ForegroundColor Cyan
    Write-Host "  Production: .\deploy-app-engine.sh" -ForegroundColor White
    Write-Host "  Quick Test: .\deploy-quick.sh" -ForegroundColor White
    Write-Host ""
    Write-Host "MONITORING COMMANDS:" -ForegroundColor Cyan
    Write-Host "  View logs: gcloud app logs tail" -ForegroundColor White
    Write-Host "  Check versions: gcloud app versions list" -ForegroundColor White
    Write-Host ""
    Write-Host "🌐 YOUR APP WILL BE AVAILABLE AT:" -ForegroundColor Cyan
    Write-Host "  https://souk-el-syarat.appspot.com" -ForegroundColor White

} elseif ($testResults.CriticalFailures -eq 0) {
    Write-Host "✅ MOSTLY READY ($successRate%)" -ForegroundColor Yellow
    Write-Host "Some non-critical tests failed, but deployment should work." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Try deployment anyway:" -ForegroundColor Cyan
    Write-Host "  .\deploy-app-engine.sh" -ForegroundColor White

} else {
    Write-Host "❌ SETUP INCOMPLETE ($successRate%)" -ForegroundColor Red
    Write-Host "$($testResults.CriticalFailures) critical issues need to be resolved." -ForegroundColor Red
    Write-Host ""
    Write-Host "CRITICAL FIXES NEEDED:" -ForegroundColor Red
    Write-Host "1. Install Google Cloud SDK: https://cloud.google.com/sdk/docs/install" -ForegroundColor White
    Write-Host "2. Run setup: .\setup-google-cloud.bat" -ForegroundColor White
    Write-Host "3. Re-test: .\final-deployment-test.ps1" -ForegroundColor White
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "📋 SUPPORT RESOURCES" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "• Documentation: GOOGLE-CLOUD-SETUP-README.md" -ForegroundColor White
Write-Host "• Troubleshooting: Run this test again for details" -ForegroundColor White
Write-Host "• Support: Check terminal output for specific error messages" -ForegroundColor White
Write-Host ""
Write-Host "Thank you for using Souk El-Syarat! 🎉" -ForegroundColor Green
