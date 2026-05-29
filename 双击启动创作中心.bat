@echo off
chcp 65001 >nul
title 谋士智能创作中心 - 启动器
echo ===================================================
echo   谋士智能创作中心 (WeChat Creator Center)
echo ===================================================
echo.
echo [*] 正在检测 Python 环境...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] 未检测到 Python 环境！
    echo 请先安装 Python (3.8 或更高版本)，并勾选 "Add Python to PATH" 选项。
    echo 下载地址: https://www.python.org/downloads/
    echo.
    pause
    exit /b 1
)

echo [*] 正在启动本地服务并打开浏览器 (端口 8080)...
echo     浏览器模式仅依赖 Python 标准库，无需安装任何第三方包。
echo     ⚠️  本窗口即后台服务，请勿关闭；关闭即停止服务。
echo.
python "%~dp0local_server.py"
