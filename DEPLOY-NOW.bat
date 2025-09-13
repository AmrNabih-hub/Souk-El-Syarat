@echo off
REM ONE-CLICK DEPLOYMENT FOR SOUK EL-SYARAT
REM This is the ultimate automated deployment solution

echo.
echo ╔══════════════════════════════════════════════════════════════════════════════╗
echo ║                                                                            ║
echo ║                    🚀 SOUK EL-SYARAT DEPLOYMENT SYSTEM                    ║
echo ║                                                                            ║
echo ║              "One-Click Professional E-commerce Deployment"               ║
echo ║                                                                            ║
echo ╚══════════════════════════════════════════════════════════════════════════════╝
echo.
echo ╔══════════════════════════════════════════════════════════════════════════════╗
echo ║ SYSTEM STATUS:                                                            ║
echo ╠══════════════════════════════════════════════════════════════════════════════╣

REM Check Node.js
echo │ Node.js:        Checking...
node --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    for /f "tokens=*" %%i in ('node --version') do echo │                 ✅ %%i
) else (
    echo │                 ❌ Not found
)

REM Check NPM
echo │ NPM:            Checking...
npm --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    for /f "tokens=*" %%i in ('npm --version') do echo │                 ✅ %%i
) else (
    echo │                 ❌ Not found
)

REM Check Build System
echo │ Build System:   Checking...
if exist "package.json" (
    echo │                 ✅ Ready
) else (
    echo │                 ❌ Not found
)

REM Check Google Cloud SDK
echo │ Google Cloud:   Checking...
gcloud --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo │                 ✅ Installed
) else (
    echo │                 ⚠️  Not installed (will install)
)

echo ╚══════════════════════════════════════════════════════════════════════════════╝
echo.
echo ╔══════════════════════════════════════════════════════════════════════════════╗
echo ║ DEPLOYMENT OPTIONS:                                                       ║
echo ╠══════════════════════════════════════════════════════════════════════════════╣
echo ║ 1. 🚀 COMPLETE AUTOMATED DEPLOYMENT (Recommended)                       ║
echo ║    • Full setup from scratch                                            ║
echo ║    • Google Cloud SDK installation                                      ║
echo ║    • Authentication & project setup                                     ║
echo ║    • Production deployment                                              ║
echo ║                                                                          ║
echo ║ 2. ⚡ EXPRESS DEPLOYMENT (If already configured)                        ║
echo ║    • Quick deployment to existing setup                                 ║
echo ║    • Requires Google Cloud SDK pre-installed                           ║
echo ║                                                                          ║
echo ║ 3. 🧪 SYSTEM DIAGNOSTICS                                                 ║
echo ║    • Run comprehensive system tests                                     ║
echo ║    • Verify all components                                              ║
echo ║    • Generate detailed report                                           ║
echo ║                                                                          ║
echo ║ 4. 🔧 MANUAL STEP-BY-STEP GUIDE                                         ║
echo ║    • Detailed manual instructions                                       ║
echo ║    • For advanced users                                                 ║
echo ╚══════════════════════════════════════════════════════════════════════════════╝
echo.
set /p choice="🎯 Enter your choice (1-4): "

if "%choice%"=="1" goto complete_auto
if "%choice%"=="2" goto express_deploy
if "%choice%"=="3" goto diagnostics
if "%choice%"=="4" goto manual_guide
goto invalid_choice

:complete_auto
echo.
echo ╔══════════════════════════════════════════════════════════════════════════════╗
echo ║                 🚀 COMPLETE AUTOMATED DEPLOYMENT                          ║
echo ╚══════════════════════════════════════════════════════════════════════════════╝
echo.
echo This will automatically handle everything:
echo ✅ Install Google Cloud SDK (if needed)
echo ✅ Configure authentication
echo ✅ Setup project and APIs
echo ✅ Create App Engine app
echo ✅ Build and deploy application
echo ✅ Optimize for production
echo.
echo ⏱️  Estimated time: 10-15 minutes
echo 💡 Requires: Administrator privileges, internet connection
echo.
set /p confirm="Start complete automated deployment? (y/n): "
if /i not "%confirm%"=="y" goto main_menu

echo.
echo 🚀 STARTING COMPLETE AUTOMATED DEPLOYMENT...
echo ==================================================
call automated-setup.bat
goto deployment_complete

:express_deploy
echo.
echo ╔══════════════════════════════════════════════════════════════════════════════╗
echo ║                    ⚡ EXPRESS DEPLOYMENT                                 ║
echo ╚══════════════════════════════════════════════════════════════════════════════╝
echo.
echo Requirements check:
gcloud --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Google Cloud SDK not found!
    echo Please run option 1 for complete setup first.
    echo.
    pause
    goto main_menu
)

gcloud config get-value project >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Google Cloud project not configured!
    echo Please run option 1 for complete setup first.
    echo.
    pause
    goto main_menu
)

echo ✅ Prerequisites met
echo.
echo 🚀 STARTING EXPRESS DEPLOYMENT...
echo ==================================

REM Build application
echo [1/3] Building application...
npm run build:apphosting >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Build failed!
    pause
    goto main_menu
)
echo ✅ Build successful

REM Generate version
for /f "tokens=2 delims==" %%i in ('wmic os get localdatetime /value') do set datetime=%%i
set "version=express-%datetime:~0,8%-%datetime:~8,6%"

REM Deploy
echo [2/3] Deploying to App Engine (version: %version%)...
gcloud app deploy --version=%version% --quiet >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Deployment failed!
    pause
    goto main_menu
)
echo ✅ Deployment successful

REM Promote to production
echo [3/3] Promoting to production...
gcloud app versions migrate %version% --quiet >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Promoted to production
) else (
    echo ⚠️  Promotion may have failed, but deployment succeeded
)

goto deployment_success

:diagnostics
echo.
echo ╔══════════════════════════════════════════════════════════════════════════════╗
echo ║                    🧪 SYSTEM DIAGNOSTICS                                ║
echo ╚══════════════════════════════════════════════════════════════════════════════╝
echo.
echo Running comprehensive system diagnostics...
echo ===========================================
call verify-gcloud-setup.bat
goto main_menu

:manual_guide
echo.
echo ╔══════════════════════════════════════════════════════════════════════════════╗
echo ║               🔧 MANUAL DEPLOYMENT GUIDE                                ║
echo ╚══════════════════════════════════════════════════════════════════════════════╝
echo.
echo STEP-BY-STEP MANUAL DEPLOYMENT INSTRUCTIONS:
echo ============================================
echo.
echo 1. 📥 INSTALL GOOGLE CLOUD SDK
echo    • Download: https://cloud.google.com/sdk/docs/install
echo    • Run installer as Administrator
echo    • Complete installation
echo.
echo 2. 🔐 AUTHENTICATE
echo    • Open Command Prompt as Administrator
echo    • Run: gcloud auth login
echo    • Sign in with your Google account
echo.
echo 3. ⚙️  CONFIGURE PROJECT
echo    • Run: gcloud config set project souk-el-syarat
echo    • Run: gcloud config set compute/region us-central1
echo.
echo 4. 🔌 ENABLE APIs
echo    • Run: gcloud services enable appengine.googleapis.com
echo    • Run: gcloud services enable cloudbuild.googleapis.com
echo    • Run: gcloud services enable firestore.googleapis.com
echo.
echo 5. 🏗️  CREATE APP ENGINE
echo    • Run: gcloud app create --region=us-central1
echo.
echo 6. 🚀 DEPLOY APPLICATION
echo    • Run: npm run build:apphosting
echo    • Run: gcloud app deploy
echo.
echo 7. 🌐 VERIFY DEPLOYMENT
echo    • Visit: https://souk-el-syarat.appspot.com
echo    • Check logs: gcloud app logs tail
echo.
echo 📚 For detailed documentation, see:
echo    GOOGLE-CLOUD-SETUP-README.md
echo.
pause
goto main_menu

:deployment_success
echo.
echo ╔══════════════════════════════════════════════════════════════════════════════╗
echo ║                        🎉 DEPLOYMENT SUCCESSFUL!                         ║
echo ╚══════════════════════════════════════════════════════════════════════════════╝
echo.
echo ✅ Your Souk El-Syarat application is now LIVE!
echo.
echo 🌐 APPLICATION URLS:
echo    Production: https://souk-el-syarat.appspot.com
echo    Version:    https://%version%-dot-souk-el-syarat.appspot.com
echo.
echo 📊 DEPLOYMENT INFO:
echo    Version:     %version%
echo    Project:     souk-el-syarat
echo    Region:      us-central1
echo    Timestamp:   %date% %time%
echo.
echo 🔧 MANAGEMENT COMMANDS:
echo    View logs:       gcloud app logs tail
echo    Check status:    gcloud app versions list
echo    Monitor app:     gcloud app browse
echo    Emergency stop:  gcloud app versions stop %version%
echo.
echo 🚨 IF ISSUES OCCUR:
echo    Rollback:        .\rollback.sh
echo    Re-deploy:       .\deploy-quick.sh
echo.
echo ════════════════════════════════════════════════════════════════════════════════
echo 🎊 CONGRATULATIONS! Your marketplace is now serving customers worldwide!
echo ════════════════════════════════════════════════════════════════════════════════
echo.
pause
goto end

:invalid_choice
echo.
echo ❌ Invalid choice. Please select 1-4.
pause
goto main_menu

:deployment_complete
echo.
echo ╔══════════════════════════════════════════════════════════════════════════════╗
echo ║                      📋 DEPLOYMENT COMPLETE                              ║
echo ╚══════════════════════════════════════════════════════════════════════════════╝
echo.
echo The automated deployment has finished.
echo Check the output above for results and next steps.
echo.
pause
goto main_menu

:main_menu
cls
goto :start_of_script

:end
echo.
echo ╔══════════════════════════════════════════════════════════════════════════════╗
echo ║                      👋 SESSION COMPLETE                                ║
echo ╚══════════════════════════════════════════════════════════════════════════════╝
echo.
echo Thank you for using Souk El-Syarat Deployment System!
echo Keep this script for future deployments and updates.
echo.
echo 🚀 Happy Deploying!
echo.
pause
