@echo off
title Stop MORS Services
cd /d "C:\Users\mukes\OneDrive\Desktop\MORS"
echo Stopping Supabase containers...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$env:Path = 'C:\Users\mukes\AppData\Local\Programs\DockerDesktop\resources\bin;' + $env:Path; npx supabase stop"
echo Stopping any running web servers on port 3000...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }"
echo.
echo MORS services stopped.
pause
