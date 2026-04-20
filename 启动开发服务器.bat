@echo off
echo ========================================
echo   Graph Editor - Start Dev Server
echo ========================================
echo.

cd /d "%~dp0graph-editor"

echo [1/2] Starting dev server on port 5173...
start "GraphEditor" cmd /k "npm run dev -- --port 5173 --strictPort"

echo [2/2] Waiting for server and opening browser...
timeout /t 4 /nobreak >nul

start http://localhost:5173/

echo.
echo ========================================
echo   Dev server started!
echo   Browser should open automatically
echo   Close the Dev Server window to stop
echo ========================================
echo.
pause
