# 🔍 GOOGLE CLOUD PORT DIAGNOSTIC SCRIPT
# Souk El-Syarat - Comprehensive Port Error Analysis

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

# Check Firebase App Hosting status
function Test-FirebaseAppHosting {
    Write-Info "Checking Firebase App Hosting status..."
    
    try {
        $backends = firebase apphosting:backends:list --format="json" 2>$null
        if ($backends) {
            $backendList = $backends | ConvertFrom-Json
            Write-Success "Firebase App Hosting backends found: $($backendList.Count)"
            
            foreach ($backend in $backendList) {
                Write-Info "Backend: $($backend.name)"
                Write-Info "Status: $($backend.status)"
                Write-Info "URL: $($backend.url)"
                Write-Info "Port: $($backend.port)"
            }
        } else {
            Write-Warning "No Firebase App Hosting backends found"
        }
    }
    catch {
        Write-Error "Failed to check Firebase App Hosting: $_"
    }
}

# Check Cloud Run services
function Test-CloudRunServices {
    Write-Info "Checking Cloud Run services..."
    
    try {
        $services = gcloud run services list --region=$Region --format="json" 2>$null
        if ($services) {
            $serviceList = $services | ConvertFrom-Json
            Write-Success "Cloud Run services found: $($serviceList.Count)"
            
            foreach ($service in $serviceList) {
                Write-Info "Service: $($service.metadata.name)"
                Write-Info "Status: $($service.status.conditions[0].status)"
                Write-Info "URL: $($service.status.url)"
                
                # Check port configuration
                $containerPort = $service.spec.template.spec.containers[0].ports[0].containerPort
                Write-Info "Container Port: $containerPort"
                
                # Check environment variables
                $envVars = $service.spec.template.spec.containers[0].env
                $portEnvVar = $envVars | Where-Object { $_.name -eq "PORT" }
                if ($portEnvVar) {
                    Write-Info "PORT Environment Variable: $($portEnvVar.value)"
                    if ($portEnvVar.value -eq $containerPort) {
                        Write-Success "Port configuration is correct"
                    } else {
                        Write-Critical "Port mismatch! Container port ($containerPort) != PORT env var ($($portEnvVar.value))"
                    }
                } else {
                    Write-Warning "PORT environment variable not found"
                }
            }
        } else {
            Write-Warning "No Cloud Run services found"
        }
    }
    catch {
        Write-Error "Failed to check Cloud Run services: $_"
    }
}

# Check recent deployment logs
function Get-RecentLogs {
    Write-Info "Checking recent deployment logs..."
    
    try {
        # Check Cloud Build logs
        Write-Info "Recent Cloud Build logs:"
        $builds = gcloud builds list --limit=3 --format="table(id,status,createTime,duration)" --project=$ProjectId 2>$null
        if ($builds) {
            Write-Host $builds
        }
        
        # Check Cloud Run logs
        Write-Info "Recent Cloud Run logs:"
        $logs = gcloud logging read "resource.type=cloud_run_revision" --limit=10 --format="table(timestamp,severity,textPayload)" --project=$ProjectId 2>$null
        if ($logs) {
            Write-Host $logs
        }
        
        # Check App Hosting logs
        Write-Info "Recent App Hosting logs:"
        $appHostingLogs = gcloud logging read "resource.type=apphosting_backend" --limit=10 --format="table(timestamp,severity,textPayload)" --project=$ProjectId 2>$null
        if ($appHostingLogs) {
            Write-Host $appHostingLogs
        }
    }
    catch {
        Write-Error "Failed to retrieve logs: $_"
    }
}

# Check port-specific errors
function Test-PortErrors {
    Write-Info "Checking for port-specific errors..."
    
    try {
        # Search for port-related errors in logs
        $portErrors = gcloud logging read "textPayload:port OR textPayload:8080 OR textPayload:443" --limit=20 --format="table(timestamp,severity,textPayload)" --project=$ProjectId 2>$null
        if ($portErrors) {
            Write-Warning "Port-related errors found:"
            Write-Host $portErrors
        } else {
            Write-Info "No port-related errors found in recent logs"
        }
        
        # Search for container startup errors
        $startupErrors = gcloud logging read "textPayload:container OR textPayload:startup OR textPayload:listen" --limit=20 --format="table(timestamp,severity,textPayload)" --project=$ProjectId 2>$null
        if ($startupErrors) {
            Write-Warning "Container startup errors found:"
            Write-Host $startupErrors
        }
    }
    catch {
        Write-Error "Failed to check for port errors: $_"
    }
}

# Check IAM permissions
function Test-IAMPermissions {
    Write-Info "Checking IAM permissions..."
    
    $requiredRoles = @(
        "roles/apphosting.admin",
        "roles/run.admin",
        "roles/cloudbuild.builds.builder",
        "roles/storage.admin"
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

# Main diagnostic function
function Start-Diagnosis {
    Write-Host "🔍 Google Cloud Port Diagnostic" -ForegroundColor Cyan
    Write-Host "=============================" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Info "Project: $ProjectId"
    Write-Info "Service: $ServiceName"
    Write-Info "Region: $Region"
    Write-Host ""
    
    # Run all diagnostic checks
    Test-FirebaseAppHosting
    Write-Host ""
    
    Test-CloudRunServices
    Write-Host ""
    
    Test-IAMPermissions
    Write-Host ""
    
    Test-PortErrors
    Write-Host ""
    
    Get-RecentLogs
    Write-Host ""
    
    Write-Info "Diagnostic complete. Check the output above for any issues."
    Write-Info "If you see port-related errors, the issue is likely:"
    Write-Info "1. Port 8080 not properly configured in apphosting.yaml"
    Write-Info "2. Server not listening on the correct port"
    Write-Info "3. IAM permissions missing for deployment"
    Write-Info "4. Service account not properly configured"
}

# Run diagnostic
Start-Diagnosis
