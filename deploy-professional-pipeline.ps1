# 🚀 PROFESSIONAL DEPLOYMENT PIPELINE
# Souk El-Sayarat - Comprehensive CI/CD Pipeline
# Implements testing, validation, and deployment with rollback capabilities

param(
    [string]$ProjectId = "souk-el-syarat",
    [string]$BackendName = "souk-el-sayarat-backend",
    [string]$Environment = "production",
    [switch]$SkipTests,
    [switch]$SkipValidation,
    [switch]$ForceDeploy,
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

# Global variables
$script:DeploymentStartTime = Get-Date
$script:DeploymentLog = @()
$script:RollbackData = @{}

# Log deployment step
function Log-DeploymentStep {
    param([string]$Step, [string]$Status, [string]$Details = "")
    $logEntry = @{
        Timestamp = Get-Date
        Step = $Step
        Status = $Status
        Details = $Details
    }
    $script:DeploymentLog += $logEntry
    Write-Log "$Step - $Status" $Status.ToUpper()
    if ($Details) { Write-Log "Details: $Details" "INFO" }
}

# Pre-deployment validation
function Test-PreDeploymentValidation {
    Log-DeploymentStep "Pre-Deployment Validation" "INFO"
    
    try {
        # Check required files
        $requiredFiles = @(
            "apphosting.yaml",
            "firebase.json",
            "server-backend.js",
            "package.json",
            "functions/package.json",
            "functions/index.js"
        )

        foreach ($file in $requiredFiles) {
            if (-not (Test-Path $file)) {
                throw "Required file missing: $file"
            }
        }

        # Validate Firebase configuration
        $firebaseJson = Get-Content "firebase.json" | ConvertFrom-Json
        if (-not $firebaseJson.projectId) {
            throw "Firebase project ID not configured"
        }

        # Validate apphosting configuration
        $apphostingContent = Get-Content "apphosting.yaml" -Raw
        if ($apphostingContent -notmatch "port: 8080") {
            throw "Port configuration is incorrect in apphosting.yaml"
        }

        # Check Firebase CLI
        try {
            $firebaseVersion = firebase --version
            Log-DeploymentStep "Firebase CLI Check" "SUCCESS" "Version: $firebaseVersion"
        } catch {
            throw "Firebase CLI not found or not working"
        }

        # Check project access
        try {
            firebase use $ProjectId
            Log-DeploymentStep "Project Access Check" "SUCCESS" "Connected to project: $ProjectId"
        } catch {
            throw "Cannot access Firebase project: $ProjectId"
        }

        Log-DeploymentStep "Pre-Deployment Validation" "SUCCESS"
        return $true
    } catch {
        Log-DeploymentStep "Pre-Deployment Validation" "ERROR" $_.Exception.Message
        throw $_.Exception.Message
    }
}

# Run comprehensive tests
function Invoke-ComprehensiveTests {
    if ($SkipTests) {
        Log-DeploymentStep "Testing" "WARNING" "Tests skipped by user request"
        return $true
    }

    Log-DeploymentStep "Testing" "INFO" "Running comprehensive test suite"
    
    try {
        # Install dependencies
        Log-DeploymentStep "Dependency Installation" "INFO"
        npm install --include=dev --legacy-peer-deps
        
        # Run linting
        Log-DeploymentStep "Code Linting" "INFO"
        npm run lint:ci
        if ($LASTEXITCODE -ne 0) {
            throw "Linting failed"
        }

        # Run type checking
        Log-DeploymentStep "Type Checking" "INFO"
        npm run type-check:ci
        if ($LASTEXITCODE -ne 0) {
            throw "Type checking failed"
        }

        # Run unit tests
        Log-DeploymentStep "Unit Tests" "INFO"
        npm run test:unit
        if ($LASTEXITCODE -ne 0) {
            throw "Unit tests failed"
        }

        # Run integration tests
        Log-DeploymentStep "Integration Tests" "INFO"
        npm run test:integration
        if ($LASTEXITCODE -ne 0) {
            throw "Integration tests failed"
        }

        # Run backend tests
        if (Test-Path "src/test/backend.test.ts") {
            Log-DeploymentStep "Backend Tests" "INFO"
            npm run test -- src/test/backend.test.ts
            if ($LASTEXITCODE -ne 0) {
                throw "Backend tests failed"
            }
        }

        Log-DeploymentStep "Testing" "SUCCESS" "All tests passed"
        return $true
    } catch {
        Log-DeploymentStep "Testing" "ERROR" $_.Exception.Message
        if (-not $ForceDeploy) {
            throw $_.Exception.Message
        } else {
            Write-Warning "Tests failed but deployment forced to continue"
            return $true
        }
    }
}

# Validate configuration
function Invoke-ConfigurationValidation {
    if ($SkipValidation) {
        Log-DeploymentStep "Configuration Validation" "WARNING" "Validation skipped by user request"
        return $true
    }

    Log-DeploymentStep "Configuration Validation" "INFO"
    
    try {
        # Validate package.json
        $packageJson = Get-Content "package.json" | ConvertFrom-Json
        if (-not $packageJson.dependencies.firebase) {
            throw "Firebase dependency missing in package.json"
        }

        # Validate server-backend.js
        $serverContent = Get-Content "server-backend.js" -Raw
        if ($serverContent -notmatch 'process\.env\.PORT \|\| 8080') {
            throw "Server not configured to use PORT environment variable"
        }

        # Validate functions configuration
        $functionsPackageJson = Get-Content "functions/package.json" | ConvertFrom-Json
        if ($functionsPackageJson.engines.node -ne "20") {
            throw "Functions must use Node.js 20"
        }

        # Validate Firestore rules
        if (Test-Path "firestore.rules") {
            $rulesContent = Get-Content "firestore.rules" -Raw
            if ($rulesContent -notmatch "rules_version = '2'") {
                throw "Firestore rules version must be 2"
            }
        }

        Log-DeploymentStep "Configuration Validation" "SUCCESS"
        return $true
    } catch {
        Log-DeploymentStep "Configuration Validation" "ERROR" $_.Exception.Message
        throw $_.Exception.Message
    }
}

# Build application
function Invoke-ProfessionalBuild {
    Log-DeploymentStep "Build Process" "INFO"
    
    try {
        # Clean previous build
        if (Test-Path "dist") {
            Remove-Item -Recurse -Force "dist"
            Log-DeploymentStep "Build Cleanup" "SUCCESS"
        }

        # Build frontend
        Log-DeploymentStep "Frontend Build" "INFO"
        npm run build:apphosting:ci
        if ($LASTEXITCODE -ne 0) {
            throw "Frontend build failed"
        }

        # Verify build output
        if (-not (Test-Path "dist")) {
            throw "Build output directory not created"
        }

        if (-not (Test-Path "dist/index.html")) {
            throw "Build output incomplete - missing index.html"
        }

        Log-DeploymentStep "Build Process" "SUCCESS"
        return $true
    } catch {
        Log-DeploymentStep "Build Process" "ERROR" $_.Exception.Message
        throw $_.Exception.Message
    }
}

# Backup current deployment
function Backup-CurrentDeployment {
    Log-DeploymentStep "Backup Current Deployment" "INFO"
    
    try {
        # Get current backend info
        $currentBackend = firebase apphosting:backends:get $BackendName --format="json" 2>$null
        if ($currentBackend) {
            $script:RollbackData.currentBackend = $currentBackend | ConvertFrom-Json
            Log-DeploymentStep "Backup Current Deployment" "SUCCESS" "Backend configuration backed up"
        }

        # Create deployment backup
        $backupDir = "backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
        
        # Copy current files
        Copy-Item "server-backend.js" "$backupDir/" -ErrorAction SilentlyContinue
        Copy-Item "apphosting.yaml" "$backupDir/" -ErrorAction SilentlyContinue
        Copy-Item "package.json" "$backupDir/" -ErrorAction SilentlyContinue
        
        $script:RollbackData.backupDir = $backupDir
        Log-DeploymentStep "Backup Current Deployment" "SUCCESS" "Files backed up to $backupDir"
        
        return $true
    } catch {
        Log-DeploymentStep "Backup Current Deployment" "ERROR" $_.Exception.Message
        throw $_.Exception.Message
    }
}

# Deploy to Firebase
function Invoke-FirebaseDeployment {
    Log-DeploymentStep "Firebase Deployment" "INFO"
    
    try {
        # Deploy functions first
        Log-DeploymentStep "Functions Deployment" "INFO"
        firebase deploy --only functions --force
        if ($LASTEXITCODE -ne 0) {
            throw "Functions deployment failed"
        }

        # Deploy App Hosting backend
        Log-DeploymentStep "App Hosting Deployment" "INFO"
        firebase deploy --only apphosting:$BackendName --force
        if ($LASTEXITCODE -ne 0) {
            throw "App Hosting deployment failed"
        }

        # Deploy Firestore rules
        Log-DeploymentStep "Firestore Rules Deployment" "INFO"
        firebase deploy --only firestore:rules --force
        if ($LASTEXITCODE -ne 0) {
            throw "Firestore rules deployment failed"
        }

        # Deploy Storage rules
        Log-DeploymentStep "Storage Rules Deployment" "INFO"
        firebase deploy --only storage --force
        if ($LASTEXITCODE -ne 0) {
            throw "Storage rules deployment failed"
        }

        Log-DeploymentStep "Firebase Deployment" "SUCCESS"
        return $true
    } catch {
        Log-DeploymentStep "Firebase Deployment" "ERROR" $_.Exception.Message
        throw $_.Exception.Message
    }
}

# Post-deployment verification
function Test-PostDeploymentVerification {
    Log-DeploymentStep "Post-Deployment Verification" "INFO"
    
    try {
        # Get backend URL
        $backendInfo = firebase apphosting:backends:get $BackendName --format="json" 2>$null
        if (-not $backendInfo) {
            throw "Could not retrieve backend information"
        }

        $backend = $backendInfo | ConvertFrom-Json
        $backendUrl = $backend.url

        Log-DeploymentStep "Backend URL Retrieved" "SUCCESS" $backendUrl

        # Test health endpoint
        Log-DeploymentStep "Health Check" "INFO"
        try {
            $response = Invoke-WebRequest -Uri "$backendUrl/health" -Method Get -TimeoutSec 30
            if ($response.StatusCode -eq 200) {
                $healthData = $response.Content | ConvertFrom-Json
                Log-DeploymentStep "Health Check" "SUCCESS" "Status: $($healthData.status)"
            } else {
                throw "Health check returned status: $($response.StatusCode)"
            }
        } catch {
            Log-DeploymentStep "Health Check" "ERROR" $_.Exception.Message
            throw "Health endpoint test failed"
        }

        # Test API status
        Log-DeploymentStep "API Status Check" "INFO"
        try {
            $response = Invoke-WebRequest -Uri "$backendUrl/api/status" -Method Get -TimeoutSec 30
            if ($response.StatusCode -eq 200) {
                $apiData = $response.Content | ConvertFrom-Json
                Log-DeploymentStep "API Status Check" "SUCCESS" "Status: $($apiData.status)"
            } else {
                throw "API status check returned status: $($response.StatusCode)"
            }
        } catch {
            Log-DeploymentStep "API Status Check" "ERROR" $_.Exception.Message
            throw "API status endpoint test failed"
        }

        # Test realtime status
        Log-DeploymentStep "Realtime Status Check" "INFO"
        try {
            $response = Invoke-WebRequest -Uri "$backendUrl/api/realtime/status" -Method Get -TimeoutSec 30
            if ($response.StatusCode -eq 200) {
                Log-DeploymentStep "Realtime Status Check" "SUCCESS"
            } else {
                Log-DeploymentStep "Realtime Status Check" "WARNING" "Status: $($response.StatusCode)"
            }
        } catch {
            Log-DeploymentStep "Realtime Status Check" "WARNING" $_.Exception.Message
        }

        Log-DeploymentStep "Post-Deployment Verification" "SUCCESS"
        return $true
    } catch {
        Log-DeploymentStep "Post-Deployment Verification" "ERROR" $_.Exception.Message
        throw $_.Exception.Message
    }
}

# Rollback deployment
function Invoke-Rollback {
    Log-DeploymentStep "Rollback" "CRITICAL" "Initiating rollback procedure"
    
    try {
        if ($script:RollbackData.backupDir -and (Test-Path $script:RollbackData.backupDir)) {
            # Restore backed up files
            Copy-Item "$($script:RollbackData.backupDir)/server-backend.js" "." -Force
            Copy-Item "$($script:RollbackData.backupDir)/apphosting.yaml" "." -Force
            Copy-Item "$($script:RollbackData.backupDir)/package.json" "." -Force
            
            # Redeploy with backup
            firebase deploy --only apphosting:$BackendName --force
            
            Log-DeploymentStep "Rollback" "SUCCESS" "Rollback completed successfully"
        } else {
            Log-DeploymentStep "Rollback" "ERROR" "No backup data available for rollback"
        }
    } catch {
        Log-DeploymentStep "Rollback" "ERROR" "Rollback failed: $($_.Exception.Message)"
    }
}

# Generate deployment report
function New-DeploymentReport {
    $endTime = Get-Date
    $duration = $endTime - $script:DeploymentStartTime
    
    $report = @{
        ProjectId = $ProjectId
        BackendName = $BackendName
        Environment = $Environment
        StartTime = $script:DeploymentStartTime
        EndTime = $endTime
        Duration = $duration.TotalMinutes
        Steps = $script:DeploymentLog
        Success = ($script:DeploymentLog | Where-Object { $_.Status -eq "ERROR" }).Count -eq 0
    }

    $reportJson = $report | ConvertTo-Json -Depth 3
    $reportFile = "deployment-report-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
    $reportJson | Out-File -FilePath $reportFile -Encoding UTF8

    Log-DeploymentStep "Deployment Report" "SUCCESS" "Report saved to $reportFile"
    
    return $report
}

# Main deployment pipeline
function Start-ProfessionalDeployment {
    Write-Log "=== SOUK EL-SAYARAT PROFESSIONAL DEPLOYMENT PIPELINE ===" "INFO"
    Write-Log "Project: $ProjectId" "INFO"
    Write-Log "Backend: $BackendName" "INFO"
    Write-Log "Environment: $Environment" "INFO"
    Write-Log "Skip Tests: $SkipTests" "INFO"
    Write-Log "Skip Validation: $SkipValidation" "INFO"
    Write-Log "Force Deploy: $ForceDeploy" "INFO"
    Write-Log "Verbose: $Verbose" "INFO"
    Write-Log "" "INFO"

    try {
        # Execute deployment pipeline
        Test-PreDeploymentValidation
        Invoke-ComprehensiveTests
        Invoke-ConfigurationValidation
        Backup-CurrentDeployment
        Invoke-ProfessionalBuild
        Invoke-FirebaseDeployment
        Test-PostDeploymentVerification

        # Generate success report
        $report = New-DeploymentReport
        
        Write-Log "" "INFO"
        Write-Log "🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!" "SUCCESS"
        Write-Log "Duration: $([math]::Round($report.Duration, 2)) minutes" "SUCCESS"
        Write-Log "Backend URL: https://$BackendName--$ProjectId.europe-west4.hosted.app" "SUCCESS"
        Write-Log "Firebase Console: https://console.firebase.google.com/project/$ProjectId/apphosting" "SUCCESS"
        
        return $report
    } catch {
        Write-Log "" "INFO"
        Write-Log "❌ DEPLOYMENT FAILED!" "CRITICAL"
        Write-Log "Error: $($_.Exception.Message)" "CRITICAL"
        
        # Attempt rollback
        try {
            Invoke-Rollback
        } catch {
            Write-Log "Rollback also failed: $($_.Exception.Message)" "CRITICAL"
        }
        
        # Generate failure report
        $report = New-DeploymentReport
        $report.Success = $false
        
        throw $_.Exception
    }
}

# Execute deployment
try {
    $result = Start-ProfessionalDeployment
    exit 0
} catch {
    Write-Log "Deployment pipeline failed: $($_.Exception.Message)" "CRITICAL"
    exit 1
}

