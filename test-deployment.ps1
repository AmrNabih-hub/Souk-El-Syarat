# Test Deployment Pipeline for Souk El-Syarat
# Validates all components before production deployment

Write-Host "🧪 Testing Souk El-Syarat Deployment Pipeline" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan

$passed = 0
$failed = 0

function Write-Test {
    param([string]$message)
    Write-Host "[TEST] $message" -ForegroundColor Blue
}

function Write-Pass {
    param([string]$message)
    Write-Host "✅ PASS $message" -ForegroundColor Green
    $script:passed++
}

function Write-Fail {
    param([string]$message)
    Write-Host "❌ FAIL $message" -ForegroundColor Red
    $script:failed++
}

function Write-Info {
    param([string]$message)
    Write-Host "[INFO] $message" -ForegroundColor Yellow
}

# Test 1: Check Node.js version
function Test-NodeJS {
    Write-Test "Node.js version check"
    try {
        $nodeVersion = & node --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            $version = $nodeVersion -replace '^v', '' -split '\.' | Select-Object -First 1
            if ([int]$version -ge 20) {
                Write-Pass "Node.js version: $nodeVersion"
            } else {
                Write-Fail "Node.js version too old: $nodeVersion (need 20+)"
            }
        } else {
            Write-Fail "Node.js command failed"
        }
    } catch {
        Write-Fail "Node.js not installed or not in PATH"
    }
}

# Test 2: Check npm
function Test-NPM {
    Write-Test "NPM availability check"
    try {
        $npmVersion = & npm --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Pass "NPM version: $npmVersion"
        } else {
            Write-Fail "NPM command failed"
        }
    } catch {
        Write-Fail "NPM not installed or not in PATH"
    }
}

# Test 3: Check package.json
function Test-PackageJson {
    Write-Test "package.json validation"
    if (Test-Path "package.json") {
        try {
            $packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
            if ($packageJson.scripts.'build:apphosting') {
                Write-Pass "build:apphosting script exists"
            } else {
                Write-Fail "build:apphosting script missing"
            }
        } catch {
            Write-Fail "package.json parsing failed"
        }
    } else {
        Write-Fail "package.json not found"
    }
}

# Test 4: Check app.yaml
function Test-AppYaml {
    Write-Test "app.yaml validation"
    if (Test-Path "app.yaml") {
        $content = Get-Content "app.yaml" -Raw
        if ($content -match "runtime: nodejs20") {
            Write-Pass "app.yaml has correct runtime"
        } else {
            Write-Fail "app.yaml missing nodejs20 runtime"
        }
    } else {
        Write-Fail "app.yaml not found"
    }
}

# Test 5: Check cloudbuild.yaml
function Test-CloudBuildYaml {
    Write-Test "cloudbuild.yaml validation"
    if (Test-Path "cloudbuild.yaml") {
        $content = Get-Content "cloudbuild.yaml" -Raw
        if (($content -match "app.*deploy") -or ($content -match "'app', 'deploy'") -or ($content -match "gcloud.*app.*deploy")) {
            Write-Pass "cloudbuild.yaml has App Engine deployment"
        } else {
            Write-Fail "cloudbuild.yaml missing App Engine deployment"
        }
    } else {
        Write-Fail "cloudbuild.yaml not found"
    }
}

# Test 6: Check server.js
function Test-ServerJS {
    Write-Test "server.js validation"
    if (Test-Path "server.js") {
        $content = Get-Content "server.js" -Raw
        if ($content -match "express") {
            Write-Pass "server.js uses Express"
        } else {
            Write-Fail "server.js missing Express setup"
        }
    } else {
        Write-Fail "server.js not found"
    }
}

# Test 7: Check deployment scripts
function Test-DeploymentScripts {
    Write-Test "Deployment scripts validation"
    $scripts = @("deploy-app-engine.sh", "deploy-quick.sh", "rollback.sh", "setup-cloud-build.sh")

    foreach ($script in $scripts) {
        if (Test-Path $script) {
            Write-Pass "$script exists"
        } else {
            Write-Fail "$script not found"
        }
    }
}

# Test 8: Check dependencies installation
function Test-Dependencies {
    Write-Test "Dependencies check"
    if (Test-Path "node_modules") {
        if ((Test-Path "node_modules/express") -and (Test-Path "node_modules/compression")) {
            Write-Pass "Required dependencies installed"
        } else {
            Write-Fail "Missing required dependencies (express, compression)"
        }
    } else {
        Write-Fail "node_modules not found - run npm install first"
    }
}

# Test 9: Validate Vite configuration
function Test-ViteConfig {
    Write-Test "Vite configuration check"
    if (Test-Path "vite.config.ts") {
        Write-Pass "vite.config.ts exists"
    } else {
        Write-Fail "vite.config.ts not found"
    }
}

# Test 10: Check Google Cloud SDK
function Test-GCloud {
    Write-Test "Google Cloud SDK check"
    try {
        $gcloudVersion = & gcloud --version 2>$null | Select-Object -First 1
        if ($LASTEXITCODE -eq 0) {
            Write-Pass "gcloud available: $gcloudVersion"
        } else {
            Write-Fail "gcloud command failed"
        }
    } catch {
        Write-Fail "Google Cloud SDK not installed or not in PATH"
    }
}

# Test 11: Check project configuration
function Test-ProjectConfig {
    Write-Test "Project configuration check"
    try {
        $project = & gcloud config get-value project 2>$null
        if ($LASTEXITCODE -eq 0 -and $project) {
            Write-Pass "Project configured: $project"
        } else {
            Write-Fail "No project configured"
        }
    } catch {
        Write-Fail "Cannot check project (gcloud not available)"
    }
}

# Test 12: Test build process
function Test-BuildProcess {
    Write-Test "Build process test"
    Write-Info "Running build:apphosting..."

    try {
        $null = & npm run build:apphosting 2>$null
        if ($LASTEXITCODE -eq 0) {
            if ((Test-Path "dist") -and (Test-Path "dist/index.html")) {
                Write-Pass "Build successful, dist/ created"
                # Clean up
                Remove-Item -Recurse -Force "dist" -ErrorAction SilentlyContinue
            } else {
                Write-Fail "Build failed - dist/ not created properly"
            }
        } else {
            Write-Fail "Build command failed"
        }
    } catch {
        Write-Fail "Build command threw exception: $($_.Exception.Message)"
    }
}

# Run all tests
function Run-AllTests {
    Test-NodeJS
    Test-NPM
    Test-PackageJson
    Test-AppYaml
    Test-CloudBuildYaml
    Test-ServerJS
    Test-DeploymentScripts
    Test-Dependencies
    Test-ViteConfig
    Test-GCloud
    Test-ProjectConfig
    Test-BuildProcess
}

# Show summary
function Show-Summary {
    Write-Host ""
    Write-Host "==========================================="
    Write-Host "🧪 TEST SUMMARY"
    Write-Host "==========================================="
    Write-Host "PASSED: $passed" -ForegroundColor Green
    Write-Host "FAILED: $failed" -ForegroundColor Red
    Write-Host "TOTAL: $($passed + $failed)"

    if ($failed -eq 0) {
        Write-Host ""
        Write-Host "🎉 ALL TESTS PASSED!" -ForegroundColor Green
        Write-Host "Your deployment pipeline is ready!"
        Write-Host ""
        Write-Host "Next steps:"
        Write-Host "  1. Configure your Google Cloud project"
        Write-Host "  2. Run: .\deploy-app-engine.sh"
        Write-Host "  3. Setup continuous deployment: .\setup-cloud-build.sh"
    } else {
        Write-Host ""
        Write-Host "❌ SOME TESTS FAILED" -ForegroundColor Red
        Write-Host "Please fix the failed tests before deploying."
        Write-Host ""
        Write-Host "Common fixes:"
        Write-Host "  - Install missing dependencies: npm install"
        Write-Host "  - Install Google Cloud SDK: https://cloud.google.com/sdk"
        Write-Host "  - Set project: gcloud config set project souk-el-syarat"
    }
}

# Handle command line arguments
param(
    [string]$TestType = "all"
)

switch ($TestType) {
    "build" { Test-BuildProcess }
    "deps" { Test-Dependencies }
    "config" {
        Test-PackageJson
        Test-AppYaml
        Test-CloudBuildYaml
    }
    "gcloud" {
        Test-GCloud
        Test-ProjectConfig
    }
    default { Run-AllTests }
}

Show-Summary
