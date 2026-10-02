@echo off
title NovaPOS Terminal Launcher
color 0A
cls

echo ========================================================
echo        NOVAPOS - POINT OF SALE (PDV) TERMINAL
echo ========================================================
echo.

:: Ensure Node.js is in PATH
where node >nul 2>nul
if %errorlevel% neq 0 (
    if exist "C:\Program Files\nodejs" (
        set "PATH=C:\Program Files\nodejs;%PATH%"
    ) else if exist "C:\Program Files (x86)\nodejs" (
        set "PATH=C:\Program Files (x86)\nodejs;%PATH%"
    ) else (
        echo [ERROR] Node.js was not found in your system!
        echo Please download and install Node.js from https://nodejs.org
        echo.
        pause
        exit /b 1
    )
)

:: Navigate to project directory
cd /d "%~dp0"

:: Check if node_modules exists, if not install
if not exist "node_modules\" (
    echo [*] First-time setup detected. Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] npm install failed.
        pause
        exit /b 1
    )
)

echo [*] Starting SQLite Backend and POS Terminal...
echo [*] Terminal will open automatically in your browser...
echo.
echo ========================================================
echo  DEFAULT LOGIN CREDENTIALS:
echo   - STORE MANAGER (Admin): User "admin" ^| PIN "1234"
echo   - CASHIER (Clerk):       User "clerk" ^| PIN "0000"
echo ========================================================
echo.

node server/start-all.js
pause
