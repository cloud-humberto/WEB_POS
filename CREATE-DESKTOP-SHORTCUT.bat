@echo off
title Create NovaPOS Desktop Shortcut
color 0B
cls

echo ========================================================
echo        CREATE NOVAPOS DESKTOP SHORTCUT
echo ========================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $d = [System.Environment]::GetFolderPath('Desktop'); $s = $ws.CreateShortcut(\"$d\NovaPOS Terminal.lnk\"); $s.TargetPath = '%~dp0START-POS.bat'; $s.WorkingDirectory = '%~dp0'; $s.Description = 'NovaPOS - Retail Point of Sale Terminal'; $s.Save(); Write-Host 'SUCCESS: Shortcut [NovaPOS Terminal.lnk] created on your Desktop!' -ForegroundColor Green"

echo.
echo You can now double-click the "NovaPOS Terminal" icon directly on your Desktop!
echo.
pause
