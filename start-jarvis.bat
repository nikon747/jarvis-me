@echo off
setlocal
echo ========================================
echo   Starting J.A.R.V.I.S.
echo ========================================
echo.

:: Ensure MongoDB is installed and running
echo Checking MongoDB...
set "MONGO_INSTALLED=0"
where mongod >nul 2>&1
if %errorlevel% equ 0 set "MONGO_INSTALLED=1"

if "%MONGO_INSTALLED%"=="0" (
    sc query MongoDB >nul 2>&1
    if %errorlevel% equ 0 set "MONGO_INSTALLED=1"
)

if "%MONGO_INSTALLED%"=="0" (
    sc query "MongoDB Server" >nul 2>&1
    if %errorlevel% equ 0 set "MONGO_INSTALLED=1"
)

if "%MONGO_INSTALLED%"=="0" (
    echo [ERROR] MongoDB is not installed or not in PATH.
    echo Run setup-windows.bat first, or install MongoDB Community Server manually.
    pause
    exit /b 1
)

set "MONGO_RUNNING=0"

sc query MongoDB >nul 2>&1
if %errorlevel% equ 0 (
    net start MongoDB >nul 2>&1
    sc query MongoDB | findstr /C:"RUNNING" >nul 2>&1
    if %errorlevel% equ 0 set "MONGO_RUNNING=1"
)

if "%MONGO_RUNNING%"=="0" (
    sc query "MongoDB Server" >nul 2>&1
    if %errorlevel% equ 0 (
        net start "MongoDB Server" >nul 2>&1
        sc query "MongoDB Server" | findstr /C:"RUNNING" >nul 2>&1
        if %errorlevel% equ 0 set "MONGO_RUNNING=1"
    )
)

if "%MONGO_RUNNING%"=="0" (
    echo [WARNING] MongoDB service is not running.
    echo Start it manually, then re-run this script:
    echo   - net start MongoDB
    echo   - or mongod --dbpath C:\data\db
    pause
    exit /b 1
)

echo [OK] MongoDB is running

:: Start Backend in new window
echo Starting Backend Server...
start "JARVIS Backend" cmd /k "cd /d %~dp0backend && call venv\Scripts\activate.bat && uvicorn server:app --host 0.0.0.0 --port 8001 --reload"

:: Wait for backend to start
echo Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

:: Start Frontend in new window
echo Starting Frontend...
start "JARVIS Frontend" cmd /k "cd /d %~dp0frontend && npm start"

echo.
echo ========================================
echo   J.A.R.V.I.S. is starting up!
echo ========================================
echo.
echo Backend:  http://localhost:8001/api/
echo Frontend: http://localhost:3000
echo.
echo Two terminal windows have been opened:
echo   - JARVIS Backend (FastAPI server)
echo   - JARVIS Frontend (React app)
echo.
echo Close both windows to stop the application.
echo.
pause
