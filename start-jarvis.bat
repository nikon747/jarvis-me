@echo off
echo ========================================
echo   Starting J.A.R.V.I.S.
echo ========================================
echo.

:: Check if MongoDB is running
echo Checking MongoDB...
sc query MongoDB >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] MongoDB service not found
    echo Trying to start MongoDB...
    net start MongoDB >nul 2>&1
)

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
