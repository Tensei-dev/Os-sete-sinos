@echo off
title Os Sete Sinos
cd /d "%~dp0"
start "" /b cmd /c "timeout /t 2 /nobreak >nul & start http://127.0.0.1:8787"
node servidor\servidor.mjs
pause
