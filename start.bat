@echo off
chcp 65001 >nul
title WeChat AI Publisher

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

:: Check if node_modules exists, if not run npm install
if not exist "node_modules" (
    echo [信息] 首次运行，正在安装依赖...
    echo 这可能需要几分钟时间，请耐心等待...
    echo.
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [错误] 依赖安装失败
        pause
        exit /b 1
    )
    echo.
    echo [成功] 依赖安装完成
    echo.
)

echo [信息] 正在启动开发服务器...
echo.
echo ----------------------------------------
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

:: Start the development server
call npm run dev

pause
