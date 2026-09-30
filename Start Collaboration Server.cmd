@echo off
cd /d "%~dp0"
set "npm_config_cache=%~dp0work\npm-cache"
set "TEMP=%~dp0work\temp"
set "TMP=%TEMP%"
set "PORT=3002"
set "NODE_ENV=production"
if not exist "%TEMP%" mkdir "%TEMP%"
if not exist "services\collaboration\node_modules" call npm ci --prefix services\collaboration
call npm run build --prefix services\collaboration
call npm start --prefix services\collaboration
pause
