@echo off
title 知微错题 - GoodNotes Style
cd /d "%~dp0"
echo ========================================================
echo   Starting 知微错题 (GoodNotes Style)
echo   Backend Service: http://localhost:3001
echo   Web Interface:   http://localhost:5173
echo ========================================================
echo.
npm run dev
pause
