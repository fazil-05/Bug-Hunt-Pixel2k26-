@echo off
set "PATH=C:\Program Files\nodejs;C:\Users\DELL\AppData\Local\Microsoft\WinGet\Packages\Git.MinGit_Microsoft.Winget.Source_8wekyb3d8bbwe\cmd;%PATH%"
echo ========================================================
echo Deploying Bug Hunt Pixel2k26 directly to Production...
echo ========================================================
call npx vercel --prod
pause
