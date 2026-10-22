@echo off
chcp 65001 >nul
title 知微错题 - iPad (iPadOS) 连接服务
cd /d "%~dp0"
echo 正在启动知微错题 iPad 专属局域网服务...
node scripts/ipad-server.js
pause
