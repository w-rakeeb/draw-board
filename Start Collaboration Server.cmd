@echo off
cd /d "%~dp0services\collaboration"
set "NODE_ENV=development"
set "PORT=3002"
set "CORS_ORIGIN=http://localhost:3001,http://127.0.0.1:3001"
set "npm_config_cache=%~dp0work\npm-cache"
call npm ci
if errorlevel 1 exit /b 1
call npm run build
if errorlevel 1 exit /b 1
call npm start
