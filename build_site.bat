@echo off
chcp 65001 > nul
echo ==========================================
echo      WEBSITE BUILDER (OnnRRu)
echo ==========================================
echo.
echo 라이브러리 설치 중... (시간이 좀 걸릴 수 있습니다)
echo Installing libraries...
call npm install
echo.
echo.
echo 웹사이트 빌드 중...
echo Building website...
call npm run build
echo.
echo ==========================================
echo      완료되었습니다! (Build Finished)
echo ==========================================
echo.
echo 이제 검은 창을 닫으시고, 채팅창에 "완료"라고 말씀해주세요.
pause
