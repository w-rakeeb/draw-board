@echo off
cd /d "%~dp0"
set "npm_config_cache=%~dp0work\npm-cache"
set "TEMP=%~dp0work\temp"
set "TMP=%TEMP%"
if not exist "%TEMP%" mkdir "%TEMP%"
call npx --yes yarn@1.22.22 start
pause
