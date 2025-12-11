@echo off
chcp 65001 >nul
title WeChat AI Publisher

:: Configuration
set BACKEND_START_DELAY=3

echo ========================================
echo    WeChat AI Publisher 启动器
echo ========================================
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

:: Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [错误] 未检测到 npm，请先安装 Node.js
    pause
    exit /b 1
)

echo [信息] 检测到 Node.js 和 npm

:: Check if frontend node_modules exists, if not run npm install
if not exist "node_modules" (
    echo [信息] 首次运行，正在安装前端依赖...
    echo 这可能需要几分钟时间，请耐心等待...
    echo.
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [错误] 前端依赖安装失败
        pause
        exit /b 1
    )
    echo.
    echo [成功] 前端依赖安装完成
    echo.
)

:: Check if backend node_modules exists, if not run npm install
if not exist "backend\node_modules" (
    echo [信息] 正在安装后端依赖...
    echo 这可能需要几分钟时间，请耐心等待...
    echo.
    if not exist "backend" (
        echo [错误] backend 目录不存在
        pause
        exit /b 1
    )
    pushd "%~dp0backend"
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [错误] 后端依赖安装失败
        popd
        pause
        exit /b 1
    )
    popd
    echo.
    echo [成功] 后端依赖安装完成
    echo.
)

:: Check if backend .env file exists
if not exist "backend\.env" (
    echo [警告] 后端 .env 配置文件不存在
    echo [信息] 正在从 .env.example 创建 .env 文件...
    if exist "backend\.env.example" (
        copy "backend\.env.example" "backend\.env" >nul
        echo [成功] 已创建 backend\.env 文件，请配置相关环境变量
    ) else (
        echo [警告] 未找到 .env.example 文件，后端可能无法正常启动
    )
    echo.
)

echo [信息] 正在启动前后端开发服务器...
echo.
echo ----------------------------------------
echo 后端服务器 (API): http://localhost:3001
echo 前端服务器 (Web): http://localhost:5173
echo.
echo 应用启动后，请在浏览器中访问:
echo http://localhost:5173
echo.
echo 功能包括:
echo   - 素材库 (图片/文字管理)
echo   - AI工具 (含滑动条参数调节)
echo   - 设计模板库
echo   - DeepSeek 思考模式 (支持工具调用)
echo.
echo 按 Ctrl+C 可停止服务器
echo ----------------------------------------
echo.

:: Start the backend server in a new window
:: Using /k to keep the window open for debugging
set "BACKEND_DIR=%~dp0backend"
start "WeChat AI Publisher - Backend" cmd /k "cd /d "%BACKEND_DIR%" && npm run dev"

:: Wait a few seconds for backend to start
echo [信息] 等待后端服务器启动 (%BACKEND_START_DELAY% 秒)...
timeout /t %BACKEND_START_DELAY% /nobreak >nul

:: Start the frontend development server
call npm run dev

pause
