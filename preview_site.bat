@echo off
chcp 65001 > nul
echo ==========================================
echo      PREVIEW MODE (OnnRRu)
echo ==========================================
echo.
echo 서버를 시작합니다...
echo 잠시 후 인터넷 창이 뜨면 확인해보세요.
echo (검은 창을 끄면 사이트도 꺼집니다)
echo.

start http://localhost:5173
call npm run dev
pause
