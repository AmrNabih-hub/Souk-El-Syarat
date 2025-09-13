@echo off
REM Comprehensive Cleanup Script for Souk El-Syarat
REM Removes cached files, unused files, and reduces app size

echo ==================================================
echo 🧹 Souk El-Syarat Cleanup Script
echo ==================================================
echo.

set "files_removed=0"
set "dirs_removed=0"

:print_step
echo [CLEANUP] %~1
goto :eof

:print_success
echo ✅ %~1
set /a files_removed+=1
goto :eof

:print_warning
echo ⚠️  %~1
goto :eof

:print_error
echo ❌ %~1
goto :eof

REM Clean build artifacts
call :print_step "Cleaning build artifacts and cache files..."

if exist "dist" (
    rmdir /s /q "dist" 2>nul
    call :print_success "Removed: dist/ (Vite build output)"
)

if exist ".vite" (
    rmdir /s /q ".vite" 2>nul
    call :print_success "Removed: .vite/ (Vite cache)"
)

if exist "build" (
    rmdir /s /q "build" 2>nul
    call :print_success "Removed: build/ (Build directory)"
)

if exist "node_modules\.cache" (
    rmdir /s /q "node_modules\.cache" 2>nul
    call :print_success "Removed: node_modules/.cache/ (npm cache)"
)

if exist ".npm" (
    rmdir /s /q ".npm" 2>nul
    call :print_success "Removed: .npm/ (npm cache directory)"
)

REM Clean temporary directories
call :print_step "Cleaning temporary and unused directories..."

if exist "souk-el-sayarat-next" (
    rmdir /s /q "souk-el-sayarat-next" 2>nul
    call :print_success "Removed: souk-el-sayarat-next/ (Old Next.js scaffold)"
)

if exist "temp-next-scaffold" (
    rmdir /s /q "temp-next-scaffold" 2>nul
    call :print_success "Removed: temp-next-scaffold/ (Temporary scaffold)"
)

if exist "functions\node_modules" (
    rmdir /s /q "functions\node_modules" 2>nul
    call :print_success "Removed: functions/node_modules/ (Duplicate node_modules)"
)

REM Clean unused files
call :print_step "Cleaning unused and redundant files..."

if exist ".DS_Store" (
    del /f /q ".DS_Store" 2>nul
    call :print_success "Removed: .DS_Store (macOS system file)"
)

if exist "Thumbs.db" (
    del /f /q "Thumbs.db" 2>nul
    call :print_success "Removed: Thumbs.db (Windows system file)"
)

if exist "Desktop.ini" (
    del /f /q "Desktop.ini" 2>nul
    call :print_success "Removed: Desktop.ini (Windows system file)"
)

REM Remove log files
for /r %%i in (*.log) do (
    del /f /q "%%i" 2>nul
    call :print_success "Removed: %%~nxi (Log file)"
)

REM Remove temp files
for /r %%i in (*.tmp) do (
    del /f /q "%%i" 2>nul
    call :print_success "Removed: %%~nxi (Temporary file)"
)

for /r %%i in (*.temp) do (
    del /f /q "%%i" 2>nul
    call :print_success "Removed: %%~nxi (Temporary file)"
)

REM Clean redundant documentation
call :print_step "Cleaning redundant documentation files..."

set "redundant_docs=DEPLOYMENT_GUIDE.md DEPLOYMENT-GUIDE.md README-DEPLOYMENT.md FIREBASE-DEPLOYMENT-INSTRUCTIONS.md URGENT-DEPLOYMENT-GUIDE.md FULL_STACK_DEPLOYMENT.md FULLSTACK_DEPLOYMENT_GUIDE.md"

for %%f in (%redundant_docs%) do (
    if exist "%%f" (
        del /f /q "%%f" 2>nul
        call :print_success "Removed: %%f (Redundant documentation)"
    )
)

REM Clean old status files
set "old_reports=100_PERCENT_QUALITY_ACHIEVEMENT.md AUTOMATION-ENHANCEMENT.md AUTOMATION-STATUS.md BULLETPROOF-SOLUTION-COMPLETE.md CODE_QUALITY_IMPROVEMENTS.md COMPREHENSIVE_DEPLOYMENT_REPORT.md CRITICAL_TEST_FIXES_REPORT.md CRITICAL-FIX-COMPLETE.md CRITICAL-ISSUE-FIXED.md CRITICAL-ISSUE-RESOLVED.md DEPLOYMENT_CHECKLIST.md DEPLOYMENT_FIXES.md DEPLOYMENT-READY-SUMMARY.md DEPLOYMENT-SUMMARY.md FINAL-DEPLOYMENT-STATUS.md FIREBASE_SETUP.md GITHUB-ACTIONS-SETUP.md SECURE_DEPLOYMENT_GUIDE.md ULTIMATE_ROOT_LEVEL_TEST_FIXES.md WORKFLOW-STATUS.md"

for %%f in (%old_reports%) do (
    if exist "%%f" (
        del /f /q "%%f" 2>nul
        call :print_success "Removed: %%f (Old status/report file)"
    )
)

REM Clean redundant scripts
call :print_step "Cleaning redundant deployment scripts..."

set "redundant_scripts=auto-deploy.sh check-deployment.sh deploy-bulletproof.sh deploy-firebase-local.sh deploy-fullstack.sh deploy-immediate.sh deploy-now.sh deploy.sh DEPLOY-NOW.md"

for %%f in (%redundant_scripts%) do (
    if exist "%%f" (
        del /f /q "%%f" 2>nul
        call :print_success "Removed: %%f (Redundant deployment script)"
    )
)

REM Clean scripts directory
if exist "scripts" (
    rmdir /s /q "scripts" 2>nul
    call :print_success "Removed: scripts/ (Old script directory)"
)

REM Clean unused configurations
call :print_step "Cleaning unused configuration files..."

set "unused_configs=netlify.toml vercel.json test-deployment.html size-limit.config.js"

for %%f in (%unused_configs%) do (
    if exist "%%f" (
        del /f /q "%%f" 2>nul
        call :print_success "Removed: %%f (Unused configuration)"
    )
)

REM Remove duplicate tsconfig
if exist "functions\tsconfig.dev.json" (
    del /f /q "functions\tsconfig.dev.json" 2>nul
    call :print_success "Removed: functions/tsconfig.dev.json (Duplicate TypeScript config)"
)

REM Clean coverage and test results
if exist "coverage" (
    rmdir /s /q "coverage" 2>nul
    call :print_success "Removed: coverage/ (Test coverage reports)"
)

if exist "test-results" (
    rmdir /s /q "test-results" 2>nul
    call :print_success "Removed: test-results/ (Test results directory)"
)

if exist ".nyc_output" (
    rmdir /s /q ".nyc_output" 2>nul
    call :print_success "Removed: .nyc_output/ (nyc test output)"
)

REM Summary
echo.
echo ==================================================
echo 🧹 CLEANUP COMPLETED!
echo ==================================================
echo Files/Directories Removed: %files_removed%
echo.
echo 📋 NEXT STEPS:
echo 1. Run 'npm install' to restore dependencies
echo 2. Test your application: 'npm run dev'
echo 3. Run build test: 'npm run build:apphosting'
echo 4. Deploy: './deploy-app-engine.sh'
echo.
echo ==================================================
