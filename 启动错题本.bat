@echo off
title Mistake Notebook - GoodNotes Style
cd /d "%~dp0"
echo ========================================================
echo   Starting Mistake Notebook (GoodNotes Style)
echo   Backend Service: http://localhost:3001
echo   Web Interface:   http://localhost:5173
echo ========================================================
echo.
npm run dev
pause
