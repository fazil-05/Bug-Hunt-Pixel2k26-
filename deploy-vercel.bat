@echo off
set "PATH=C:\Program Files\nodejs;C:\Users\DELL\AppData\Local\Microsoft\WinGet\Packages\Git.MinGit_Microsoft.Winget.Source_8wekyb3d8bbwe\cmd;%PATH%"
echo ========================================================
echo Starting Vercel Deployment for Bug Hunt Pixel2k26...
echo ========================================================
call npx vercel
pause
