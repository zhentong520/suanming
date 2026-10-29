@echo off
chcp 65001 >nul
cd /d "%~dp0"
title 易道命理 - 开发启动

echo ========================================
echo   易道命理 · 一键启动（开发模式）
echo ========================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [错误] 未检测到 Node.js，请先安装 Node.js 18+ ：
  echo https://nodejs.org/
  echo.
  pause
  exit /b 1
)

for /f "tokens=*" %%v in ('node -v') do echo Node 版本: %%v

if not exist "package.json" (
  echo [错误] 未找到 package.json，请把本脚本放在项目根目录。
  pause
  exit /b 1
)

if not exist ".env.local" (
  if exist ".env.example" (
    echo [提示] 未找到 .env.local，正在从 .env.example 复制...
    copy /Y ".env.example" ".env.local" >nul
    echo [提示] 已生成 .env.local，生产环境请务必修改密码与 JWT_SECRET。
  ) else (
    echo [错误] 缺少 .env.example，无法生成环境配置。
    pause
    exit /b 1
  )
)

if not exist "node_modules\" (
  echo [步骤] 首次运行，正在安装依赖（可能需要几分钟）...
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
    echo [错误] 数据库初始化失败。
    pause
    exit /b 1
  )
)

echo.
echo ----------------------------------------
echo   前台首页:  http://localhost:9111
echo   管理后台:  http://localhost:9111/admin/login
echo   默认账号:  admin / admin123
echo ----------------------------------------
echo   关闭本窗口或按 Ctrl+C 即可停止服务
echo ----------------------------------------
echo.

REM 延迟打开浏览器，等待服务起来
start "" cmd /c "timeout /t 4 /nobreak >nul & start http://localhost:9111 & start http://localhost:9111/admin/login"

call npm run dev
echo.
echo 服务已退出。
pause
