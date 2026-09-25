@echo off
chcp 65001 >nul
setlocal
pushd "%~dp0"

echo ============================================================
echo  정보처리기사 용어사전 - Vercel 배포
echo ============================================================
echo.

where node >nul 2>nul
if errorlevel 1 goto NONODE

for /f "tokens=*" %%v in ('node -v') do echo Node.js %%v 확인
echo.
echo 배포 방식을 고르세요.
echo.
echo   1) 브라우저로 로그인해서 배포   (권장 - 토큰을 입력하지 않습니다)
echo   2) 토큰을 붙여넣어 배포
echo.
set /p MODE="번호 입력 (1 또는 2): "
echo.
echo 배포를 시작합니다. 처음 실행이면 vercel CLI 를 내려받는 동안 1~2분 걸립니다.
echo.

if "%MODE%"=="2" goto BYTOKEN
goto BYLOGIN

:BYTOKEN
set /p VTOKEN="Vercel 토큰 붙여넣기: "
echo.
npx --yes vercel@latest deploy --prod --yes --token=%VTOKEN%
goto DONE

:BYLOGIN
npx --yes vercel@latest deploy --prod --yes
goto DONE

:NONODE
echo [!] Node.js 를 찾을 수 없습니다.
echo.
echo     설치 없이 배포하려면 README.md 의 "방법 A - Netlify Drop" 을 쓰세요.
echo     이 폴더를 https://app.netlify.com/drop 에 끌어다 놓기만 하면 됩니다.
echo.
echo     CLI 로 배포하려면 https://nodejs.org 에서 LTS 를 설치한 뒤 다시 실행하세요.
echo.
popd
pause
exit /b 1

:DONE
echo.
echo ============================================================
echo  위에 출력된 https://... 주소가 배포된 사이트입니다.
echo  폰에서 그 주소를 열고 "홈 화면에 추가" 하면 끝입니다.
echo.
echo  토큰을 입력해 배포했다면 지금 Vercel - Settings - Tokens
echo  에서 그 토큰을 삭제하세요.
echo ============================================================
echo.
popd
pause
