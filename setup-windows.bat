@echo off
setlocal
echo ========================================
echo   J.A.R.V.I.S. - Windows 11 Setup
echo ========================================
echo.

:: Ensure winget is available to auto download necessary dependencies, but continue even if it fails since we have fallbacks
set "WINGET_AVAILABLE=0"
where winget >nul 2>&1
if %errorlevel% equ 0 (
    set "WINGET_AVAILABLE=1"
    echo [OK] winget found
) else (
    echo [WARN] winget not found
    echo Attempting to install winget ^(App Installer^)...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; Invoke-WebRequest -Uri 'https://aka.ms/getwinget' -OutFile \"$env:TEMP\AppInstaller.msixbundle\"; Add-AppxPackage -Path \"$env:TEMP\AppInstaller.msixbundle\""
    if %errorlevel% neq 0 (
        echo [WARN] Could not install winget automatically
    ) else (
        where winget >nul 2>&1
        if %errorlevel% equ 0 (
            set "WINGET_AVAILABLE=1"
            echo [OK] winget installed
        ) else (
            echo [WARN] winget installation completed but command is not available in this shell yet
            echo [INFO] If needed, close/reopen terminal and run setup again
        )
    )
)

:: Check for Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARN] Python is not installed or not in PATH
    echo Attempting to install Python automatically...

    if "%WINGET_AVAILABLE%"=="1" (
        echo Trying installation via winget...
        winget install -e --id Python.Python.3.12 --accept-source-agreements --accept-package-agreements
    ) else (
        echo [INFO] winget not available
    )

    :: Re-check after winget
    python --version >nul 2>&1
    if %errorlevel% neq 0 (
        echo [ERROR] Python could not be installed automatically.
        echo Please install Python 3.10+ manually from https://www.python.org/downloads/
        echo Make sure to check "Add Python to PATH" during installation.
        pause
        exit /b 1
    )
    echo [OK] Python installed successfully
) else (
    echo [OK] Python found
)

:: Check for Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARN] Node.js is not installed or not in PATH
    echo Attempting to install Node.js automatically...

    if "%WINGET_AVAILABLE%"=="1" (
        echo Trying installation via winget...
        winget install -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
    ) else (
        echo [INFO] winget not available
    )

    :: Re-check after winget - need to refresh PATH
    node --version >nul 2>&1
    if %errorlevel% neq 0 (
        :: Try refreshing environment
        echo [INFO] Refreshing environment variables...
        call refreshenv >nul 2>&1
        node --version >nul 2>&1
        if %errorlevel% neq 0 (
            echo [ERROR] Node.js could not be installed automatically.
            echo Please install Node.js 18+ manually from https://nodejs.org/
            echo After installation, close this terminal and run setup again.
            pause
            exit /b 1
        )
    )
    echo [OK] Node.js installed successfully
) else (
    echo [OK] Node.js found
)

:: Check for npm
call npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARN] npm is not installed or not in PATH
    echo [INFO] npm should come with Node.js - trying to refresh environment...
    call refreshenv >nul 2>&1
    call npm --version >nul 2>&1
    if %errorlevel% neq 0 (
        echo [ERROR] npm is not available even with Node.js installed
        echo Close this terminal and run setup again, or install Node.js manually
        pause
        exit /b 1
    )
)
echo [OK] npm found

:: Check for MongoDB (mongod)
set "MONGO_STATUS=already installed"
set "MONGO_SERVICE_NAME="
set "MONGOD_EXE="
where mongod >nul 2>&1
if %errorlevel% equ 0 set "MONGOD_EXE=mongod"
if "%MONGOD_EXE%"=="" (
    for /f "delims=" %%p in ('dir /b /s "C:\Program Files\MongoDB\Server\*\bin\mongod.exe" 2^>nul') do set "MONGOD_EXE=%%p"
)
sc query MongoDB >nul 2>&1
if %errorlevel% equ 0 set "MONGO_SERVICE_NAME=MongoDB"
if "%MONGO_SERVICE_NAME%"=="" (
    sc query "MongoDB Server" >nul 2>&1
    if %errorlevel% equ 0 set "MONGO_SERVICE_NAME=MongoDB Server"
)

if "%MONGOD_EXE%"=="" if "%MONGO_SERVICE_NAME%"=="" (
    echo [WARN] MongoDB is not installed or not in PATH
    echo Attempting to install MongoDB automatically...

    :: Try winget first
    if "%WINGET_AVAILABLE%"=="1" (
        echo Trying installation via winget...
        winget install -e --id MongoDB.Server --accept-source-agreements --accept-package-agreements
    ) else (
        echo [INFO] winget not available
    )

    :: Re-check after winget
    set "MONGOD_EXE="
    where mongod >nul 2>&1
    if %errorlevel% equ 0 set "MONGOD_EXE=mongod"
    if "%MONGOD_EXE%"=="" (
        for /f "delims=" %%p in ('dir /b /s "C:\Program Files\MongoDB\Server\*\bin\mongod.exe" 2^>nul') do set "MONGOD_EXE=%%p"
    )
    set "MONGO_SERVICE_NAME="
    sc query MongoDB >nul 2>&1
    if %errorlevel% equ 0 set "MONGO_SERVICE_NAME=MongoDB"
    if "%MONGO_SERVICE_NAME%"=="" (
        sc query "MongoDB Server" >nul 2>&1
        if %errorlevel% equ 0 set "MONGO_SERVICE_NAME=MongoDB Server"
    )

    if "%MONGOD_EXE%"=="" if "%MONGO_SERVICE_NAME%"=="" (
        :: Try Chocolatey as fallback
        where choco >nul 2>&1
        if %errorlevel% equ 0 (
            echo Trying installation via Chocolatey...
            choco install mongodb --yes
        ) else (
            echo [INFO] Chocolatey not found
        )
    )

    :: Final validation
    set "MONGOD_EXE="
    where mongod >nul 2>&1
    if %errorlevel% equ 0 set "MONGOD_EXE=mongod"
    if "%MONGOD_EXE%"=="" (
        for /f "delims=" %%p in ('dir /b /s "C:\Program Files\MongoDB\Server\*\bin\mongod.exe" 2^>nul') do set "MONGOD_EXE=%%p"
    )
    set "MONGO_SERVICE_NAME="
    sc query MongoDB >nul 2>&1
    if %errorlevel% equ 0 set "MONGO_SERVICE_NAME=MongoDB"
    if "%MONGO_SERVICE_NAME%"=="" (
        sc query "MongoDB Server" >nul 2>&1
        if %errorlevel% equ 0 set "MONGO_SERVICE_NAME=MongoDB Server"
    )

    if "%MONGOD_EXE%"=="" if "%MONGO_SERVICE_NAME%"=="" (
        echo [ERROR] MongoDB could not be installed automatically.
        echo Please install MongoDB Community Server, then re-run setup:
        echo https://www.mongodb.com/try/download/community
        pause
        exit /b 1
    )

    set "MONGO_STATUS=installed during setup"
)
if /I not "%MONGOD_EXE%"=="mongod" (
    if not "%MONGOD_EXE%"=="" for %%d in ("%MONGOD_EXE%") do set "PATH=%%~dpd;%PATH%"
)
set "MONGO_VERSION="
if not "%MONGOD_EXE%"=="" for /f "tokens=*" %%i in ('"%MONGOD_EXE%" --version ^| findstr /c:"db version"') do set "MONGO_VERSION=%%i"
echo [OK] MongoDB found (%MONGO_STATUS%)
if not "%MONGO_SERVICE_NAME%"=="" echo [INFO] MongoDB service detected: %MONGO_SERVICE_NAME%
if not "%MONGO_VERSION%"=="" echo [INFO] %MONGO_VERSION%

echo.
echo ========================================
echo   Setting up Backend...
echo ========================================

cd backend

:: Create virtual environment if it doesn't exist
if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to create backend virtual environment
        pause
        exit /b 1
    )
)

:: Install backend dependencies in the virtual environment
echo Installing backend dependencies...
venv\Scripts\python.exe -m pip install --upgrade pip
if %errorlevel% neq 0 (
    echo [ERROR] Failed to update pip in backend virtual environment
    pause
    exit /b 1
)

venv\Scripts\python.exe -m pip install -r requirements.txt --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install backend requirements
    pause
    exit /b 1
)

echo Verifying backend dependencies...
venv\Scripts\python.exe -m pip check
if %errorlevel% neq 0 (
    echo [ERROR] Backend dependencies are not fully satisfied
    pause
    exit /b 1
)

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
call npm install --legacy-peer-deps
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install frontend dependencies
    pause
    exit /b 1
)

echo Verifying frontend dependencies...
if not exist "node_modules" (
    echo [ERROR] Frontend dependencies are not fully satisfied
    echo Try deleting frontend\node_modules and frontend\package-lock.json, then run setup again.
    pause
    exit /b 1
)

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
echo   - Or run: mongod --dbpath C:\data\db
echo.
pause
