@echo off
title MORS - Social Food Journal Launcher
cd /d "C:\Users\mukes\OneDrive\Desktop\MORS"
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\mukes\OneDrive\Desktop\MORS\scripts\launch-mors.ps1"
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Launcher encountered an error.
    pause
)
