echo off
setlocal
echo ==========================================
echo      BATTLE GAME LAUNCHER
echo ==========================================
echo.
echo Setting up environment...

:: Add Node.js to PATH explicitly
set "PATH=%PATH%;C:\Program Files\nodejs"

echo Starting server...
echo.
echo Once the server starts, open http://localhost:5173 in your browser.
echo.

call npm run dev
pause
