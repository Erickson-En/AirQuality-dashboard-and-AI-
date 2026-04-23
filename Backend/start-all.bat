@echo off
REM ========================================
REM  AIR QUALITY BACKEND - STARTUP SCRIPT
REM ========================================
REM
REM This script starts all backend services:
REM   1. Main Backend (http://localhost:5000)
REM   2. HTTP Fallback Server (http://localhost:8080)
REM   3. Railway Health Monitor
REM
REM USAGE:
REM   start-all.bat
REM
REM Then in frontend directory:
REM   npm start
REM

cls
echo.
echo ╔════════════════════════════════════════════════════╗
echo ║   🚀 AIR QUALITY DASHBOARD - STARTUP               ║
echo ╚════════════════════════════════════════════════════╝
echo.

REM Check if Node.js is installed
where /q node
if errorlevel 1 (
    echo ❌ Node.js not found. Please install Node.js first.
    echo    Download from: https://nodejs.org
    pause
    exit /b 1
)

echo ✅ Node.js found
echo.

REM Navigate to Backend directory
cd /d "%~dp0" 2>nul
if errorlevel 1 (
    echo ❌ Error changing to Backend directory
    pause
    exit /b 1
)

REM Check if main server.js exists
if not exist "server.js" (
    echo ❌ server.js not found in Backend directory
    echo    Current directory: %cd%
    pause
    exit /b 1
)

echo 📁 Backend directory: %cd%
echo.

REM Start services in separate windows
echo Starting services...
echo.

echo 1️⃣  Starting MAIN BACKEND (port 5000)...
start "Air Quality Backend" cmd /k "node server.js"
timeout /t 2 >nul

echo 2️⃣  Starting HTTP FALLBACK SERVER (port 8080)...
start "HTTP Fallback Server" cmd /k "node http-fallback-server.js"
timeout /t 2 >nul

echo 3️⃣  Starting RAILWAY HEALTH MONITOR...
start "Railway Monitor" cmd /k "node railway-monitor.js"
timeout /t 2 >nul

echo.
echo ╔════════════════════════════════════════════════════╗
echo ║   ✅ ALL SERVICES STARTED                          ║
echo ╚════════════════════════════════════════════════════╝
echo.
echo 📊 SERVICES STATUS:
echo   ✓ Main Backend:        http://localhost:5000
echo   ✓ Fallback HTTP:       http://localhost:8080
echo   ✓ Health Monitor:      Running (checking Railway)
echo.
echo 📱 FRONTEND:
echo   Next, in another terminal, run:
echo   cd ..
echo   npm start
echo.
echo 🔗 ARDUINO CONFIGURATION:
echo   Send to (when on same network):
echo   http://YOUR_COMPUTER_IP:8080/api/sensor-data
echo.
echo 🌐 DASHBOARD:
echo   http://localhost:3000
echo.
echo ℹ️  Press Ctrl+C in any window to stop that service
echo    Close all windows to stop everything
echo.

pause
