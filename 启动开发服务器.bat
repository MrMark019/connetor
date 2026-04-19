@echo off
echo ========================================
echo   Graph Editor - Start Dev Server
echo ========================================
echo.

cd /d "%~dp0graph-editor"

echo [1/2] Starting dev server...
start "GraphEditor" cmd /k "npm run dev"

echo [2/2] Opening browser...
timeout /t 3 /nobreak >nul

start http://localhost:5174/

echo.
echo ========================================
echo   Dev server started!
echo   Browser should open automatically
echo   Close the Dev Server window to stop
echo ========================================
echo.
pause
