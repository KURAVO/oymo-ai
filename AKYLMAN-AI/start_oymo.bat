@echo off
cd /d "%~dp0"

echo ==============================
echo       OYMO AI
echo ==============================
echo.

python -m backend.telegram_bot

pause