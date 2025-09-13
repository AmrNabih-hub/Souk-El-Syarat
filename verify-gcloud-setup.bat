@echo off
REM Quick Verification Script for Google Cloud SDK Setup

echo ==================================================
echo 🔍 Verifying Google Cloud SDK Setup
echo ==================================================
echo.

echo [CHECK] Testing gcloud command...
gcloud --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ PASS - Google Cloud SDK is installed
    for /f "tokens=*" %%i in ('gcloud --version ^| findstr "Google Cloud SDK"') do echo    Version: %%i
) else (
    echo ❌ FAIL - Google Cloud SDK not found
    goto :setup_needed
)

echo.
echo [CHECK] Testing authentication...
gcloud auth list --filter=status:ACTIVE --format="value(account)" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ PASS - Authentication configured
    for /f "tokens=*" %%i in ('gcloud auth list --filter^=status:ACTIVE --format^="value(account)"') do echo    Account: %%i
) else (
    echo ❌ FAIL - No active authentication
)

echo.
echo [CHECK] Testing project configuration...
for /f "tokens=*" %%i in ('gcloud config get-value project 2^>nul') do set PROJECT=%%i
if defined PROJECT (
    if not "%PROJECT%"=="(unset)" (
        echo ✅ PASS - Project configured: %PROJECT%
    ) else (
        echo ❌ FAIL - No project configured
    )
) else (
    echo ❌ FAIL - Cannot read project configuration
)

echo.
echo [CHECK] Testing App Engine...
gcloud app describe >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ PASS - App Engine is configured
) else (
    echo ⚠️  App Engine not configured (will be created during deployment)
)

echo.
echo ==================================================
echo 🎯 VERIFICATION COMPLETE
echo ==================================================
echo.
echo If all checks passed: Great! Run the deployment test
echo If some failed: Run the setup script
echo.
echo 📋 Next Steps:
echo 1. If all ✅: powershell.exe -ExecutionPolicy Bypass -File test-deployment.ps1
echo 2. If some ❌: powershell.exe -ExecutionPolicy Bypass -File setup-gcloud-after-install.ps1
echo 3. Deploy: .\deploy-app-engine.sh
echo.
echo 🚀 Your Souk El-Syarat is almost ready!
echo ==================================================
goto :end

:setup_needed
echo.
echo ==================================================
echo ⚠️ GOOGLE CLOUD SDK SETUP REQUIRED
echo ==================================================
echo.
echo Google Cloud SDK is not installed or not in PATH.
echo.
echo 📥 DOWNLOAD & INSTALL:
echo 1. Download: https://cloud.google.com/sdk/docs/install
echo 2. Run installer as Administrator
echo 3. Restart PowerShell/Command Prompt
echo 4. Run this verification script again
echo.
echo Or use PowerShell setup script:
echo powershell.exe -ExecutionPolicy Bypass -File setup-gcloud-after-install.ps1
echo.
echo ==================================================

:end
