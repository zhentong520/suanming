@echo off
chcp 65001 >nul
cd /d "%~dp0"
title 易道命理 - 生产启动

echo ========================================
echo   易道命理 · 生产模式启动
echo ========================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [错误] 未检测到 Node.js，请先安装 Node.js 18+。
  pause
  exit /b 1
)

if not exist ".env.local" (
  if exist ".env.example" (
    copy /Y ".env.example" ".env.local" >nul
    echo [提示] 已生成 .env.local，请先修改 JWT_SECRET / ADMIN_PASSWORD / 站点域名后再生产部署。
  )
)

if not exist "node_modules\" (
  echo [步骤] 安装依赖...
  call npm install
  if errorlevel 1 (
    echo [错误] npm install 失败。
    pause
    exit /b 1
  )
)

if not exist "data\" mkdir data
if not exist "data\suanming.db" (
  echo [步骤] 初始化数据库...
  call npm run db:seed
  if errorlevel 1 (
    echo [错误] db:seed 失败。
    pause
    exit /b 1
  )
)

echo [步骤] 生产构建 npm run build ...
call npm run build
if errorlevel 1 (
  echo [错误] 构建失败。
  pause
  exit /b 1
)

echo.
echo ----------------------------------------
echo   前台首页:  http://localhost:9111
echo   管理后台:  http://localhost:9111/admin/login
echo ----------------------------------------
echo.

start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:9111"

call npm run start
echo.
echo 服务已退出。
pause
