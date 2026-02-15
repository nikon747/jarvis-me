@echo off
echo ========================================
echo   Stopping J.A.R.V.I.S.
echo ========================================
echo.

:: Kill processes on port 8001 (Backend)
echo Stopping Backend...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8001 ^| findstr LISTENING') do (
    taskkill /PID %%a /F >nul 2>&1
)

:: Kill processes on port 3000 (Frontend)
echo Stopping Frontend...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    taskkill /PID %%a /F >nul 2>&1
)

echo.
echo J.A.R.V.I.S. has been stopped.
echo.
pause
