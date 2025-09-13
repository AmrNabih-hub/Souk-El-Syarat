@echo off
REM Backup Script - Run before cleanup to preserve important files

echo ==================================================
echo 📦 Creating backup before cleanup...
echo ==================================================
echo.

REM Create timestamp for backup directory
for /f "tokens=2 delims==" %%i in ('wmic os get localdatetime /value') do set datetime=%%i
set "timestamp=%datetime:~0,8%-%datetime:~8,6%"
set "backup_dir=backup-%timestamp%"

echo [BACKUP] Creating backup directory: %backup_dir%
mkdir "%backup_dir%" 2>nul

REM Backup important configuration files
echo [BACKUP] Backing up important configuration files...

set "important_files=package.json package-lock.json firebase.json firestore.rules firestore.indexes.json storage.rules app.yaml apphosting.yaml cloudbuild.yaml vite.config.ts tailwind.config.js tsconfig.json tsconfig.node.json .gitignore"

for %%f in (%important_files%) do (
    if exist "%%f" (
        copy "%%f" "%backup_dir%\" >nul 2>&1
        echo ✅ Backed up: %%f
    )
)

REM Backup source code
echo [BACKUP] Backing up source code...

if exist "src" (
    xcopy "src" "%backup_dir%\src\" /E /I /H /Y >nul 2>&1
    echo ✅ Backed up: src/
)

if exist "public" (
    xcopy "public" "%backup_dir%\public\" /E /I /H /Y >nul 2>&1
    echo ✅ Backed up: public/
)

REM Create backup info file
echo BACKUP CREATED: %timestamp% > "%backup_dir%\BACKUP-INFO.txt"
echo CLEANUP DATE: %date% %time% >> "%backup_dir%\BACKUP-INFO.txt"
echo. >> "%backup_dir%\BACKUP-INFO.txt"
echo IMPORTANT FILES BACKED UP: >> "%backup_dir%\BACKUP-INFO.txt"
for %%f in (%important_files%) do (
    if exist "%%f" echo   - %%f >> "%backup_dir%\BACKUP-INFO.txt"
)
echo. >> "%backup_dir%\BACKUP-INFO.txt"
echo SOURCE CODE BACKED UP: >> "%backup_dir%\BACKUP-INFO.txt"
echo   - src/ >> "%backup_dir%\BACKUP-INFO.txt"
echo   - public/ >> "%backup_dir%\BACKUP-INFO.txt"
echo. >> "%backup_dir%\BACKUP-INFO.txt"
echo To restore from this backup: >> "%backup_dir%\BACKUP-INFO.txt"
echo 1. Copy files from %backup_dir% back to project root >> "%backup_dir%\BACKUP-INFO.txt"
echo 2. Run: npm install >> "%backup_dir%\BACKUP-INFO.txt"
echo 3. Run: npm run build:apphosting >> "%backup_dir%\BACKUP-INFO.txt"
echo. >> "%backup_dir%\BACKUP-INFO.txt"
echo BACKUP LOCATION: %CD%\%backup_dir% >> "%backup_dir%\BACKUP-INFO.txt"

echo [BACKUP] Creating backup summary...

echo.
echo ==================================================
echo 📦 BACKUP COMPLETED!
echo ==================================================
echo Backup Location: %backup_dir%
echo Backup Info: %backup_dir%\BACKUP-INFO.txt
echo.
echo ⚠️  IMPORTANT:
echo Keep this backup safe until you verify the
echo application works after cleanup!
echo.
echo Next: Run cleanup script
echo cleanup-app.bat
echo ==================================================
