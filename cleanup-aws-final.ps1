#!/usr/bin/env pwsh
# 🧹 FINAL AWS CLEANUP SCRIPT
# Removes all remaining AWS/Amplify references

Write-Host "🧹 CLEANING UP REMAINING AWS/AMPLIFY REFERENCES..." -ForegroundColor Yellow

$filesToUpdate = @(
    @{
        Path = "src/components/PWAInstallPrompt.tsx"
        Find = "Storage\.get"
        Replace = "StorageService.getFilePreview"
    },
    @{
        Path = "src/config/admin-security.config.ts"
        Find = "Storage\.get"
        Replace = "StorageService.getFilePreview"
    },
    @{
        Path = "src/contexts/AuthContext.tsx"
        Find = "Storage\.get"
        Replace = "StorageService.getFilePreview"
    },
    @{
        Path = "src/contexts/ThemeContext.tsx"
        Find = "Storage\.get"
        Replace = "StorageService.getFilePreview"
    },
    @{
        Path = "src/hooks/useRealTimeDashboard.ts"
        Find = "DataStore"
        Replace = "DatabaseService"
    },
    @{
        Path = "src/hooks/useSearch.ts"
        Find = "Storage\.get"
        Replace = "StorageService.getFilePreview"
    }
)

foreach ($file in $filesToUpdate) {
    if (Test-Path $file.Path) {
        $content = Get-Content $file.Path -Raw
        if ($content -match $file.Find) {
            Write-Host "Updating: $($file.Path)" -ForegroundColor Cyan
            $content = $content -replace $file.Find, $file.Replace
            Set-Content $file.Path $content -NoNewline
        }
    }
}

# Remove old service files
$oldFiles = @(
    "src/services/admin.service.old.ts",
    "src/services/analytics.service.old.ts", 
    "src/services/auth.service.old.ts",
    "src/services/order.service.old.ts",
    "src/services/product.service.old.ts",
    "src/services/enhanced-auth.service.ts",
    "src/services/mock-auth.service.ts",
    "src/services/process-orchestrator.service.ts",
    "src/types/aws-amplify-api.ts",
    "src/types/shims-amplify.d.ts",
    "src/utils/component-connector.ts"
)

foreach ($file in $oldFiles) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "Removed: $file" -ForegroundColor Green
    }
}

Write-Host "✅ AWS cleanup completed!" -ForegroundColor Green