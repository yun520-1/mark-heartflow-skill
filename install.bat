@echo off
REM ============================================================================
REM HeartFlow Companion - Windows 一键安装脚本
REM 情感拟人化 AI 交互系统 | Emotionally Anthropomorphic AI Interaction System
REM ============================================================================
REM 支持：Windows 10/11 (PowerShell/CMD/Git Bash)
REM 要求：Node.js >= 14.0.0, Git
REM ============================================================================

setlocal enabledelayedexpansion

REM 配置
set REPO_URL=https://github.com/yun520-1/mark-heartflow-skill.git
set INSTALL_DIR=%USERPROFILE%\heartflow-companion
set OPENCLAW_DIR=%USERPROFILE%\.jvs\.openclaw\workspace

REM 颜色定义（需要 Windows 10+）
for /F "tokens=1,2 delims=#" %%a in ('"prompt #$H#$E# & echo on & for %%b in (1) do rem"') do (
  set "DEL=%%a"
  set "COLOR_GREEN=%%b[32m"
  set "COLOR_RED=%%b[31m"
  set "COLOR_YELLOW=%%b[33m"
  set "COLOR_BLUE=%%b[34m"
  set "COLOR_CYAN=%%b[36m"
  set "COLOR_RESET=%%b[0m"
)

REM ============================================================================
REM 工具函数
REM ============================================================================

:print_logo
echo.
echo %COLOR_CYAN%
echo ╔═══════════════════════════════════════════════════════════╗
echo ║                                                           ║
echo ║   🌊  HeartFlow Companion  心流伴侣                       ║
echo ║       Emotionally Anthropomorphic AI System               ║
echo ║                                                           ║
echo ║       不是工具，是伙伴 | Not a tool, but a partner        ║
echo ║                                                           ║
echo ╚═══════════════════════════════════════════════════════════╝
echo %COLOR_RESET%
echo.
goto :eof

:print_step
echo %COLOR_BLUE%▶ %1%COLOR_RESET%
goto :eof

:print_success
echo %COLOR_GREEN%✓ %1%COLOR_RESET%
goto :eof

:print_warning
echo %COLOR_YELLOW%⚠ %1%COLOR_RESET%
goto :eof

:print_error
echo %COLOR_RED%✗ %1%COLOR_RESET%
goto :eof

REM ============================================================================
REM 系统检查
REM ============================================================================

:check_prerequisites
call :print_step "检查系统依赖..."

set MISSING=0

REM 检查 Git
where git >nul 2>&1
if errorlevel 1 (
    call :print_error "Git 未安装"
    call :print_warning "请访问 https://git-scm.com/download/win 安装 Git"
    set MISSING=1
) else (
    for /f "tokens=3" %%i in ('git --version') do set GIT_VERSION=%%i
    call :print_success "Git 已安装 (!GIT_VERSION!)"
)

REM 检查 Node.js
where node >nul 2>&1
if errorlevel 1 (
    call :print_error "Node.js 未安装"
    call :print_warning "请访问 https://nodejs.org/ 安装 Node.js ^(要求 ^>= 14.0.0^)"
    set MISSING=1
) else (
    for /f "tokens=2" %%i in ('node -v') do set NODE_VERSION=%%i
    call :print_success "Node.js 已安装 (!NODE_VERSION!)"
)

REM 检查 npm
where npm >nul 2>&1
if errorlevel 1 (
    call :print_error "npm 未安装"
    set MISSING=1
) else (
    for /f "tokens=1" %%i in ('npm -v') do set NPM_VERSION=%%i
    call :print_success "npm 已安装 (!NPM_VERSION!)"
)

if %MISSING%==1 (
    echo.
    call :print_error "请先安装上述缺失的依赖，然后重新运行此脚本"
    exit /b 1
)

echo.
goto :eof

REM ============================================================================
REM 安装流程
REM ============================================================================

:clone_repository
call :print_step "克隆 HeartFlow 仓库..."

if exist "%INSTALL_DIR%" (
    call :print_warning "目录已存在：%INSTALL_DIR%"
    set /p RESPONSE="是否删除并重新安装？[y/N]: "
    if /i "!RESPONSE!"=="y" (
        rmdir /s /q "%INSTALL_DIR%"
        call :print_success "已删除旧版本"
    ) else (
        call :print_warning "跳过安装"
        exit /b 0
    )
)

git clone "%REPO_URL%" "%INSTALL_DIR%"
call :print_success "仓库克隆完成"
echo.
goto :eof

:install_dependencies
call :print_step "安装依赖包..."

cd /d "%INSTALL_DIR%"

if exist "package.json" (
    call npm install --production
    call :print_success "依赖安装完成"
) else (
    call :print_warning "未找到 package.json，跳过依赖安装"
)

echo.
goto :eof

:setup_openclaw_integration
call :print_step "配置 OpenClaw 集成..."

if not exist "%OPENCLAW_DIR%" (
    call :print_warning "OpenClaw 工作区不存在：%OPENCLAW_DIR%"
    call :print_warning "跳过 OpenClaw 集成配置"
    echo.
    goto :eof
)

REM 创建符号链接（需要管理员权限）
set "LINK_NAME=%OPENCLAW_DIR%\heartflow-companion"

if exist "%LINK_NAME%" (
    call :print_warning "链接已存在：%LINK_NAME%"
    rmdir /s /q "%LINK_NAME%" 2>nul
    call :print_success "已删除旧链接"
)

REM 尝试创建符号链接
mklink /D "%LINK_NAME%" "%INSTALL_DIR%" >nul 2>&1
if errorlevel 1 (
    call :print_warning "无法创建符号链接（需要管理员权限）"
    call :print_warning "请手动创建链接或使用以下目录："
    call :print_warning "  %INSTALL_DIR%"
) else (
    call :print_success "OpenClaw 集成配置完成"
    call :print_success "符号链接：%LINK_NAME% → %INSTALL_DIR%"
)

echo.
goto :eof

:create_launcher
call :print_step "创建启动器..."

REM 创建启动批处理文件
(
    echo @echo off
    echo cd /d "%%~dp0"
    echo node src\index.js %%*
) > "%INSTALL_DIR%\heartflow.bat"

call :print_success "启动器 heartflow.bat 已创建"
echo.
goto :eof

:run_demo
call :print_step "运行演示..."

cd /d "%INSTALL_DIR%"

if exist "demo.js" (
    node demo.js
) else (
    call :print_warning "未找到演示文件"
)

echo.
goto :eof

REM ============================================================================
REM 主流程
REM ============================================================================

:main
call :print_logo

echo 欢迎使用 HeartFlow Companion 一键安装程序！
echo.
echo 安装信息：
echo   安装目录：%INSTALL_DIR%
echo   OpenClaw 目录：%OPENCLAW_DIR%
echo   仓库地址：%REPO_URL%
echo.

set /p RESPONSE="是否继续安装？[Y/n]: "
if /i "!RESPONSE!"=="n" (
    call :print_warning "安装已取消"
    exit /b 0
)

echo.
echo ═══════════════════════════════════════════════════════════
echo.

REM 执行安装步骤
call :check_prerequisites
call :clone_repository
call :install_dependencies
call :setup_openclaw_integration
call :create_launcher

REM 完成
echo ═══════════════════════════════════════════════════════════
echo.
call :print_success "🎉 HeartFlow Companion 安装完成！"
echo.
echo 下一步：
echo   1. 启动 HeartFlow:
echo      heartflow
echo      或：%INSTALL_DIR%\heartflow.bat
echo.
echo   2. 运行演示:
echo      node %INSTALL_DIR%\demo.js
echo.
echo   3. 查看文档:
echo      https://github.com/yun520-1/mark-heartflow-skill
echo.
echo   4. OpenClaw 集成:
echo      在 OpenClaw 中使用 /heartflow 命令
echo.
echo ═══════════════════════════════════════════════════════════
echo.

REM 询问是否运行演示
set /p RESPONSE="是否立即运行演示？[Y/n]: "
if /i not "!RESPONSE!"=="n" (
    call :run_demo
)

goto :eof

REM 运行主流程
call :main
