# 🔧 PROFESSIONAL DEPLOYMENT TROUBLESHOOTING SCRIPT
# Souk El-Syarat - Comprehensive Error Analysis

param(
    [string]$ProjectId = "souk-el-syarat",
    [string]$ServiceName = "my-web-app",
    [string]$Region = "us-central1"
)

$ErrorActionPreference = "Continue"

# Colors for output
function Write-Info { Write-Host "[INFO] $args" -ForegroundColor Blue }
function Write-Success { Write-Host "[SUCCESS] $args" -ForegroundColor Green }
function Write-Warning { Write-Host "[WARNING] $args" -ForegroundColor Yellow }
function Write-Error { Write-Host "[ERROR] $args" -ForegroundColor Red }
function Write-Critical { Write-Host "[CRITICAL] $args" -ForegroundColor Red -BackgroundColor Yellow }

# Check Cloud Run service status
function Test-CloudRunService {
    Write-Info "Checking Cloud Run service status..."
    
    try {
        $service = gcloud run services describe $ServiceName --region=$Region --format="json" 2>$null
        if ($service) {
            $serviceObj = $service | ConvertFrom-Json
            Write-Success "Service found: $($serviceObj.metadata.name)"
            Write-Info "Status: $($serviceObj.status.conditions[0].status)"
            Write-Info "URL: $($serviceObj.status.url)"
            Write-Info "Port: $($serviceObj.spec.template.spec.containers[0].ports[0].containerPort)"
            return $true
        }
    }
    catch {
        Write-Error "Service not found or not accessible: $_"
        return $false
    }
}

# Check service logs
function Get-ServiceLogs {
    Write-Info "Retrieving service logs..."
    
    try {
        Write-Info "Recent logs (last 50 entries):"
        gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=$ServiceName" --limit=50 --format="table(timestamp,severity,textPayload)" --project=$ProjectId
    }
    catch {
        Write-Error "Failed to retrieve logs: $_"
    }
}

# Check IAM permissions
function Test-IAMPermissions {
    Write-Info "Checking IAM permissions..."
    
    $requiredRoles = @(
        "roles/run.admin",
        "roles/cloudbuild.builds.builder",
        "roles/storage.admin",
        "roles/iam.serviceAccountUser"
    )
    
    foreach ($role in $requiredRoles) {
        try {
            $hasRole = gcloud projects get-iam-policy $ProjectId --flatten="bindings[].members" --format="table(bindings.role)" --filter="bindings.role:$role" 2>$null
            if ($hasRole) {
                Write-Success "Role $role is assigned"
            } else {
                Write-Warning "Role $role is missing"
            }
        }
        catch {
            Write-Warning "Could not check role $role"
        }
    }
}

# Check Cloud Build status
function Test-CloudBuildStatus {
    Write-Info "Checking recent Cloud Build status..."
    
    try {
        $builds = gcloud builds list --limit=5 --format="table(id,status,createTime,duration)" --project=$ProjectId
        Write-Info "Recent builds:"
        Write-Host $builds
    }
    catch {
        Write-Error "Failed to retrieve build status: $_"
    }
}

# Test service connectivity
function Test-ServiceConnectivity {
    Write-Info "Testing service connectivity..."
    
    try {
        $serviceUrl = gcloud run services describe $ServiceName --region=$Region --format="value(status.url)" 2>$null
        if ($serviceUrl) {
            Write-Info "Testing health endpoint: $serviceUrl/health"
            $response = Invoke-WebRequest -Uri "$serviceUrl/health" -Method Get -TimeoutSec 30 -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                Write-Success "Service is responding correctly"
                Write-Info "Response: $($response.Content)"
            } else {
                Write-Warning "Service responded with status: $($response.StatusCode)"
            }
        } else {
            Write-Error "Could not retrieve service URL"
        }
    }
    catch {
        Write-Error "Service connectivity test failed: $_"
    }
}

# Check port configuration
function Test-PortConfiguration {
    Write-Info "Checking port configuration..."
    
    try {
        $service = gcloud run services describe $ServiceName --region=$Region --format="json" 2>$null
        if ($service) {
            $serviceObj = $service | ConvertFrom-Json
            $containerPort = $serviceObj.spec.template.spec.containers[0].ports[0].containerPort
            $envVars = $serviceObj.spec.template.spec.containers[0].env
            
            Write-Info "Container port: $containerPort"
            
            $portEnvVar = $envVars | Where-Object { $_.name -eq "PORT" }
            if ($portEnvVar) {
                Write-Info "PORT environment variable: $($portEnvVar.value)"
                if ($portEnvVar.value -eq $containerPort) {
                    Write-Success "Port configuration is correct"
                } else {
                    Write-Critical "Port mismatch! Container port ($containerPort) != PORT env var ($($portEnvVar.value))"
                }
            } else {
                Write-Warning "PORT environment variable not found"
            }
        }
    }
    catch {
        Write-Error "Failed to check port configuration: $_"
    }
}

# Main troubleshooting function
function Start-Troubleshooting {
    Write-Host "🔧 Souk El-Syarat Deployment Troubleshooting" -ForegroundColor Cyan
    Write-Host "=============================================" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Info "Project: $ProjectId"
    Write-Info "Service: $ServiceName"
    Write-Info "Region: $Region"
    Write-Host ""
    
    # Run all checks
    Test-CloudRunService
    Write-Host ""
    
    Test-PortConfiguration
    Write-Host ""
    
    Test-IAMPermissions
    Write-Host ""
    
    Test-CloudBuildStatus
    Write-Host ""
    
    Test-ServiceConnectivity
    Write-Host ""
    
    Get-ServiceLogs
    Write-Host ""
    
    Write-Info "Troubleshooting complete. Check the output above for any issues."
}

# Run troubleshooting
Start-Troubleshooting
