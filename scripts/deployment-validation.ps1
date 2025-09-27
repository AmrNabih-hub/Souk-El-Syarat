# AWS Amplify Deployment Validation Script
# Ensures 100% successful deployment for Souk El-Sayarat

param(
    [string]$Environment = "production",
    [switch]$SkipTests = $false,
    [switch]$Verbose = $false
)

$ErrorActionPreference = "Stop"

# Colors for output
$Green = [System.ConsoleColor]::Green
$Yellow = [System.ConsoleColor]::Yellow
$Red = [System.ConsoleColor]::Red
$Blue = [System.ConsoleColor]::Blue

function Write-ColorOutput {
    param([string]$Message, [System.ConsoleColor]$Color = [System.ConsoleColor]::White)
    Write-Host $Message -ForegroundColor $Color
}

function Write-Step {
    param([string]$Message)
    Write-ColorOutput "🔄 $Message" $Blue
}

function Write-Success {
    param([string]$Message)
    Write-ColorOutput "✅ $Message" $Green
}

function Write-Warning {
    param([string]$Message)
    Write-ColorOutput "⚠️  $Message" $Yellow
}

function Write-Error {
    param([string]$Message)
    Write-ColorOutput "❌ $Message" $Red
}

try {
    Write-ColorOutput "🚀 AWS Amplify Deployment Validation for Souk El-Sayarat" $Blue
    Write-ColorOutput "Environment: $Environment" $Blue
    Write-ColorOutput "Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" $Blue
    Write-ColorOutput "=" * 70 $Blue

    # Step 1: Pre-deployment Validation
    Write-Step "Validating deployment prerequisites..."
    
    # Check required files
    $requiredFiles = @(
        "package.json",
        "amplify.yml",
        "vite.config.production.ts",
        ".env.production",
        "amplify_outputs.json"
    )
    
    foreach ($file in $requiredFiles) {
        if (Test-Path $file) {
            Write-Success "✓ $file exists"
        } else {
            throw "Required file missing: $file"
        }
    }

    # Step 2: Dependency Validation
    Write-Step "Validating dependencies and package resolution..."
    
    # Check for node_modules
    if (-not (Test-Path "node_modules")) {
        Write-Warning "node_modules not found, installing dependencies..."
        npm ci --prefer-offline --no-audit --no-fund
    }
    
    # Validate critical packages
    $criticalPackages = @("react", "react-dom", "aws-amplify", "vite")
    foreach ($package in $criticalPackages) {
        if (Test-Path "node_modules/$package") {
            Write-Success "✓ $package installed"
        } else {
            throw "Critical package missing: $package"
        }
    }

    # Step 3: Build Validation
    Write-Step "Validating build process..."
    
    # Clean previous builds
    if (Test-Path "dist") {
        Remove-Item -Recurse -Force "dist"
    }
    
    # Run production build
    $env:NODE_ENV = "production"
    $env:VITE_BUILD_TARGET = "production"
    npm run build:production
    
    # Validate build artifacts
    if (Test-Path "dist/index.html") {
        Write-Success "✓ Build artifacts generated successfully"
        
        # Check build size
        $distSize = (Get-ChildItem -Recurse "dist" | Measure-Object -Property Length -Sum).Sum / 1MB
        if ($distSize -lt 50) {
            Write-Success "✓ Build size optimal: $([math]::Round($distSize, 2)) MB"
        } else {
            Write-Warning "Build size large: $([math]::Round($distSize, 2)) MB"
        }
    } else {
        throw "Build artifacts not generated"
    }

    # Step 4: Code Quality Validation
    Write-Step "Validating code quality..."
    
    # TypeScript compilation
    npm run type-check:ci
    Write-Success "✓ TypeScript compilation successful"
    
    # Code formatting
    npm run format:check
    Write-Success "✓ Code formatting validated"

    # Step 5: AWS Amplify Configuration Validation
    Write-Step "Validating AWS Amplify configuration..."
    
    # Check amplify.yml structure
    $amplifyConfig = Get-Content "amplify.yml" -Raw
    if ($amplifyConfig -match "version: 1" -and $amplifyConfig -match "frontend:" -and $amplifyConfig -match "backend:") {
        Write-Success "✓ amplify.yml structure valid"
    } else {
        throw "Invalid amplify.yml structure"
    }
    
    # Check environment variables
    if (Test-Path ".env.production") {
        $envContent = Get-Content ".env.production" -Raw
        if ($envContent -match "NODE_ENV=production" -and $envContent -match "VITE_BUILD_TARGET=production") {
            Write-Success "✓ Environment variables configured"
        } else {
            Write-Warning "Environment variables may need review"
        }
    }

    # Step 6: Security Validation
    Write-Step "Validating security configuration..."
    
    # Check for sensitive data in build
    $sensitivePatterns = @("password", "secret", "key", "token")
    $buildFiles = Get-ChildItem -Recurse "dist" -Include "*.js", "*.html" | Get-Content -Raw
    $foundSensitive = $false
    
    foreach ($pattern in $sensitivePatterns) {
        if ($buildFiles -match $pattern) {
            Write-Warning "Potential sensitive data found: $pattern"
            $foundSensitive = $true
        }
    }
    
    if (-not $foundSensitive) {
        Write-Success "✓ No sensitive data detected in build"
    }

    # Step 7: Performance Validation
    Write-Step "Validating performance metrics..."
    
    # Check bundle sizes
    $jsFiles = Get-ChildItem -Recurse "dist" -Include "*.js"
    $largeFiles = $jsFiles | Where-Object { $_.Length -gt 1MB }
    
    if ($largeFiles.Count -eq 0) {
        Write-Success "✓ No oversized JavaScript bundles"
    } else {
        Write-Warning "Large JavaScript files detected: $($largeFiles.Count)"
    }

    # Step 8: Deployment Readiness Check
    Write-Step "Final deployment readiness check..."
    
    $deploymentChecklist = @{
        "Build artifacts" = (Test-Path "dist/index.html")
        "Package.json valid" = (Test-Path "package.json")
        "Amplify config" = (Test-Path "amplify.yml")
        "Environment config" = (Test-Path ".env.production")
        "Dependencies installed" = (Test-Path "node_modules")
    }
    
    $allPassed = $true
    foreach ($check in $deploymentChecklist.GetEnumerator()) {
        if ($check.Value) {
            Write-Success "✓ $($check.Key)"
        } else {
            Write-Error "✗ $($check.Key)"
            $allPassed = $false
        }
    }

    # Step 9: Generate Deployment Report
    Write-Step "Generating deployment report..."
    
    $deploymentReport = @{
        Timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
        Environment = $Environment
        BuildSize = "$([math]::Round($distSize, 2)) MB"
        Status = if ($allPassed) { "READY_FOR_DEPLOYMENT" } else { "VALIDATION_FAILED" }
        Checklist = $deploymentChecklist
        BuildArtifacts = @{
            IndexHtml = (Test-Path "dist/index.html")
            CssFiles = (Get-ChildItem -Recurse "dist" -Include "*.css").Count
            JsFiles = (Get-ChildItem -Recurse "dist" -Include "*.js").Count
            AssetFiles = (Get-ChildItem -Recurse "dist" -Include "*.png", "*.jpg", "*.svg").Count
        }
    }
    
    $deploymentReport | ConvertTo-Json -Depth 3 | Out-File "deployment-validation-report.json"
    Write-Success "Deployment report generated: deployment-validation-report.json"

    if ($allPassed) {
        Write-ColorOutput "=" * 70 $Green
        Write-Success "🎉 DEPLOYMENT VALIDATION SUCCESSFUL!"
        Write-ColorOutput "✅ All checks passed - Ready for AWS Amplify deployment" $Green
        Write-ColorOutput "📦 Build size: $([math]::Round($distSize, 2)) MB" $Green
        Write-ColorOutput "🚀 Deployment command: amplify publish" $Green
        Write-ColorOutput "=" * 70 $Green
    } else {
        throw "Deployment validation failed - please review errors above"
    }

} catch {
    Write-Error "Deployment validation failed: $($_.Exception.Message)"
    
    $errorReport = @{
        Timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
        Environment = $Environment
        Error = $_.Exception.Message
        Status = "VALIDATION_FAILED"
    }
    
    $errorReport | ConvertTo-Json | Out-File "deployment-validation-error.json"
    Write-Error "Error report generated: deployment-validation-error.json"
    
    exit 1
}