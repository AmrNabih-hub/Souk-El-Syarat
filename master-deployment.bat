@echo off
REM MASTER DEPLOYMENT SCRIPT FOR SOUK EL-SYARAT
REM One-click deployment automation

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    🚀 SOUK EL-SYARAT                       ║
echo ║              MASTER DEPLOYMENT SYSTEM                      ║
echo ║                                                              ║
echo ║  Professional E-commerce Marketplace Deployment            ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo Choose your deployment option:
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║ DEPLOYMENT OPTIONS:                                        ║
echo ╠══════════════════════════════════════════════════════════════╣
echo ║ 1. 🚀 FULL AUTOMATED DEPLOYMENT (Recommended)              ║
echo ║    • Complete setup from scratch                           ║
echo ║    • Google Cloud SDK installation                         ║
echo ║    • Authentication & configuration                        ║
echo ║    • Production deployment                                 ║
echo ║                                                              ║
echo ║ 2. 🔧 QUICK DEPLOYMENT (If already configured)            ║
echo ║    • Skip setup, deploy directly                           ║
echo ║    • Requires Google Cloud SDK installed                  ║
echo ║                                                              ║
echo ║ 3. 🧪 SYSTEM VERIFICATION ONLY                             ║
echo ║    • Check system status                                   ║
echo ║    • Run tests without deployment                          ║
echo ║                                                              ║
echo ║ 4. 📊 POST-DEPLOYMENT OPTIMIZATION                         ║
echo ║    • Performance tuning                                    ║
echo ║    • Monitoring setup                                      ║
echo ║    • Security enhancement                                  ║
echo ║                                                              ║
echo ║ 5. 🔄 MAINTENANCE & MONITORING                             ║
echo ║    • View logs                                              ║
echo ║    • Check status                                           ║
echo ║    • Performance monitoring                                ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" goto full_deployment
if "%choice%"=="2" goto quick_deployment
if "%choice%"=="3" goto verification_only
if "%choice%"=="4" goto post_deployment
if "%choice%"=="5" goto maintenance
goto invalid_choice

:full_deployment
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                 🚀 FULL AUTOMATED DEPLOYMENT                ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo This will install Google Cloud SDK and deploy everything.
echo Make sure you have administrator privileges.
echo.
echo Press any key to start, or Ctrl+C to cancel...
pause >nul
echo.
call automated-setup.bat
goto end

:quick_deployment
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    🔧 QUICK DEPLOYMENT                      ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo This assumes Google Cloud SDK is already installed and configured.
echo.
echo Press any key to continue, or Ctrl+C to cancel...
pause >nul
echo.
echo [DEPLOY] Starting quick deployment...

REM Check if gcloud is available
gcloud --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Google Cloud SDK not found!
    echo Please run option 1 for full setup first.
    pause
    goto main_menu
)

REM Quick deployment process
echo ✅ Google Cloud SDK found
echo 🔧 Building application...
npm run build:apphosting >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Build failed
    pause
    goto main_menu
)

echo ✅ Build successful
echo 🚀 Deploying to App Engine...

REM Generate version
for /f "tokens=2 delims==" %%i in ('wmic os get localdatetime /value') do set datetime=%%i
set "version=quick-%datetime:~0,8%-%datetime:~8,6%"

gcloud app deploy --version=%version% --quiet >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo.
    echo 🎉 QUICK DEPLOYMENT SUCCESSFUL!
    echo.
    echo 🌐 Application URL: https://%version%-dot-souk-el-syarat.appspot.com
    echo 🔄 Promoting to production...
    gcloud app versions migrate %version% --quiet >nul 2>&1
    echo ✅ Promoted to production: https://souk-el-syarat.appspot.com
) else (
    echo ❌ Deployment failed
    echo Check the output above for errors
)
pause
goto main_menu

:verification_only
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                🧪 SYSTEM VERIFICATION                      ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo Running comprehensive system verification...
echo.
call verify-gcloud-setup.bat
goto end

:post_deployment
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║           📊 POST-DEPLOYMENT OPTIMIZATION                  ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo This will optimize your deployed application.
echo.
echo Press any key to continue, or Ctrl+C to cancel...
pause >nul
echo.
call post-deployment-setup.bat
goto end

:maintenance
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║            🔄 MAINTENANCE & MONITORING                     ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo Choose maintenance option:
echo.
echo 1. 📋 View Application Logs
echo 2. 📊 Check Application Status
echo 3. 🔍 View Versions
echo 4. ⚡ Performance Metrics
echo 5. 🔙 Back to Main Menu
echo.
set /p maint_choice="Enter choice (1-5): "

if "%maint_choice%"=="1" goto view_logs
if "%maint_choice%"=="2" goto check_status
if "%maint_choice%"=="3" goto view_versions
if "%maint_choice%"=="4" goto performance_metrics
if "%maint_choice%"=="5" goto main_menu
goto invalid_maint_choice

:view_logs
echo.
echo 📋 APPLICATION LOGS
echo ===================
gcloud app logs tail --limit=50
pause
goto maintenance

:check_status
echo.
echo 📊 APPLICATION STATUS
echo =====================
echo.
echo Current Configuration:
gcloud config get-value project
gcloud config get-value compute/region
echo.
echo App Engine Status:
gcloud app describe
echo.
echo Active Versions:
gcloud app versions list
pause
goto maintenance

:view_versions
echo.
echo 🔍 APPLICATION VERSIONS
echo =======================
gcloud app versions list --format="table[box](VERSION.ID,LAST_DEPLOYED_TIME,TRAFFIC_SPLIT,SERVING_STATUS)"
pause
goto maintenance

:performance_metrics
echo.
echo ⚡ PERFORMANCE METRICS
echo ======================
echo.
echo Note: Detailed metrics available in Google Cloud Console
echo https://console.cloud.google.com/appengine
echo.
echo Quick Stats:
gcloud app services describe default --format="value(name)"
echo.
echo Recent Logs Summary:
gcloud app logs read --limit=10 --format="table(timestamp,severity,message)"
pause
goto maintenance

:invalid_choice
echo.
echo ❌ Invalid choice. Please select 1-5.
echo.
pause
goto main_menu

:invalid_maint_choice
echo.
echo ❌ Invalid choice. Please select 1-5.
pause
goto maintenance

:main_menu
cls
goto :start_of_script

:end
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                      🎉 SESSION COMPLETE                   ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo Thank you for using Souk El-Syarat Deployment System!
echo.
pause
