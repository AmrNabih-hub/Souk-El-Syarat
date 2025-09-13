@echo off
REM AUTOMATED GOOGLE CLOUD SDK SETUP FOR SOUK EL-SYARAT
REM This batch file runs the complete setup process

echo ==================================================
echo 🚀 AUTOMATED GOOGLE CLOUD SETUP
echo ==================================================
echo.
echo This script will automatically:
echo • Install Google Cloud SDK (if needed)
echo • Authenticate with Google Cloud
echo • Configure your project
echo • Enable required APIs
echo • Create App Engine app
echo • Run final tests
echo.
echo Press any key to continue, or Ctrl+C to cancel...
pause >nul

echo.
echo ==================================================
echo 🔧 STARTING GOOGLE CLOUD SDK SETUP
echo ==================================================
echo.

REM Check if PowerShell is available
powershell -Command "Write-Host '✅ PowerShell is available'" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ PowerShell is not available
    echo Please ensure PowerShell is installed and try again
    pause
    exit /b 1
)

echo ✅ PowerShell is available
echo.

REM Run the complete setup script
echo 🚀 Running complete Google Cloud setup...
echo This may take several minutes. Please wait...
echo.

powershell.exe -ExecutionPolicy Bypass -File "%~dp0complete-gcloud-setup.ps1"

REM Check if setup was successful
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ==================================================
    echo 🎉 GOOGLE CLOUD SETUP COMPLETED!
    echo ==================================================
    echo.
    echo Your Souk El-Syarat application is now ready!
    echo.
    echo 🚀 NEXT STEPS:
    echo 1. Deploy: .\deploy-app-engine.sh
    echo 2. Test: .\deploy-quick.sh
    echo 3. Monitor: gcloud app logs tail
    echo.
    echo 📱 Your app will be available at:
    echo    https://souk-el-syarat.appspot.com
    echo.
) else (
    echo.
    echo ==================================================
    echo ⚠️ SETUP COMPLETED WITH ISSUES
    echo ==================================================
    echo.
    echo Some components may need manual attention.
    echo.
    echo 🔧 TROUBLESHOOTING:
    echo 1. Check status: .\verify-gcloud-setup.bat
    echo 2. Re-run setup: .\setup-google-cloud.bat
    echo 3. Manual help: type "help" in the script prompts
    echo.
)

echo ==================================================
echo 📞 SUPPORT
echo ==================================================
echo If you encounter issues:
echo • Check the output above for error messages
echo • Verify your internet connection
echo • Ensure you have administrator privileges
echo • Try running the setup again
echo.
echo For manual setup instructions, see:
echo GOOGLE-CLOUD-SETUP-README.md
echo.
echo ==================================================

pause
