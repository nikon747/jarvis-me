@echo off
echo ========================================
echo   J.A.R.V.I.S. - Windows 11 Setup
echo ========================================
echo.

:: Check for Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH
    echo Please install Python 3.10+ from https://www.python.org/downloads/
    pause
    exit /b 1
)
echo [OK] Python found

:: Check for Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Node.js found

:: Check for npm
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed
    pause
    exit /b 1
)
echo [OK] npm found

echo.
echo ========================================
echo   Setting up Backend...
echo ========================================

cd backend

:: Create virtual environment if it doesn't exist
if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
)

:: Activate virtual environment and install dependencies
echo Installing backend dependencies...
call venv\Scripts\activate.bat
pip install --upgrade pip
pip install -r requirements.txt
pip install emergentintegrations --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/

:: Create .env file for Windows
echo Creating backend .env file...
(
echo MONGO_URL=mongodb://localhost:27017
echo DB_NAME=jarvis_db
echo CORS_ORIGINS=http://localhost:3000
echo EMERGENT_LLM_KEY=sk-emergent-5F86e5229F329Cf89B
) > .env

cd ..

echo.
echo ========================================
echo   Setting up Frontend...
echo ========================================

cd frontend

:: Install frontend dependencies
echo Installing frontend dependencies...
call npm install

:: Create .env file for Windows
echo Creating frontend .env file...
(
echo REACT_APP_BACKEND_URL=http://localhost:8001
) > .env

cd ..

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo To start J.A.R.V.I.S., run: start-jarvis.bat
echo.
echo Make sure MongoDB is running:
echo   - If installed as service: net start MongoDB
echo   - Or start MongoDB manually
echo.
pause
