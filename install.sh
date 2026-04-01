#!/bin/bash

# ============================================================================
# HeartFlow Companion - 一键安装脚本
# 情感拟人化 AI 交互系统 | Emotionally Anthropomorphic AI Interaction System
# ============================================================================
# 支持：macOS | Linux | Windows (Git Bash/WSL)
# 要求：Node.js >= 14.0.0, Git
# ============================================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 配置
REPO_URL="https://github.com/yun520-1/mark-heartflow-skill.git"
INSTALL_DIR="${HOME}/heartflow-companion"
OPENCLAW_DIR="${HOME}/.jvs/.openclaw/workspace"

# ============================================================================
# 工具函数
# ============================================================================

print_logo() {
    echo ""
    echo -e "${CYAN}"
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║                                                           ║"
    echo "║   🌊  HeartFlow Companion  心流伴侣                       ║"
    echo "║       Emotionally Anthropomorphic AI System               ║"
    echo "║                                                           ║"
    echo "║       不是工具，是伙伴 | Not a tool, but a partner        ║"
    echo "║                                                           ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo ""
}

print_step() {
    echo -e "${BLUE}▶ ${1}${NC}"
}

print_success() {
    echo -e "${GREEN}✓ ${1}${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ ${1}${NC}"
}

print_error() {
    echo -e "${RED}✗ ${1}${NC}"
}

check_command() {
    if ! command -v "$1" &> /dev/null; then
        print_error "$1 未安装"
        return 1
    fi
    return 0
}

# ============================================================================
# 系统检查
# ============================================================================

check_prerequisites() {
    print_step "检查系统依赖..."
    
    local missing=0
    
    # 检查 Git
    if ! check_command "git"; then
        print_error "Git 未安装"
        print_warning "请访问 https://git-scm.com/downloads 安装 Git"
        missing=1
    else
        print_success "Git 已安装 ($(git --version))"
    fi
    
    # 检查 Node.js
    if ! check_command "node"; then
        print_error "Node.js 未安装"
        print_warning "请访问 https://nodejs.org/ 安装 Node.js (要求 >= 14.0.0)"
        missing=1
    else
        local node_version=$(node -v)
        print_success "Node.js 已安装 ($node_version)"
        
        # 检查版本
        local major_version=$(node -v | cut -d'.' -f1 | cut -d'v' -f2)
        if [ "$major_version" -lt 14 ]; then
            print_error "Node.js 版本过低 (需要 >= 14.0.0)"
            missing=1
        fi
    fi
    
    # 检查 npm
    if ! check_command "npm"; then
        print_error "npm 未安装"
        missing=1
    else
        print_success "npm 已安装 ($(npm -v))"
    fi
    
    if [ $missing -eq 1 ]; then
        echo ""
        print_error "请先安装上述缺失的依赖，然后重新运行此脚本"
        exit 1
    fi
    
    echo ""
}

# ============================================================================
# 安装流程
# ============================================================================

clone_repository() {
    print_step "克隆 HeartFlow 仓库..."
    
    if [ -d "$INSTALL_DIR" ]; then
        print_warning "目录已存在：$INSTALL_DIR"
        echo -n "是否删除并重新安装？[y/N]: "
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            rm -rf "$INSTALL_DIR"
            print_success "已删除旧版本"
        else
            print_warning "跳过安装"
            exit 0
        fi
    fi
    
    git clone "$REPO_URL" "$INSTALL_DIR"
    print_success "仓库克隆完成"
    echo ""
}

install_dependencies() {
    print_step "安装依赖包..."
    
    cd "$INSTALL_DIR"
    
    if [ -f "package.json" ]; then
        npm install --production
        print_success "依赖安装完成"
    else
        print_warning "未找到 package.json，跳过依赖安装"
    fi
    
    echo ""
}

setup_openclaw_integration() {
    print_step "配置 OpenClaw 集成..."
    
    # 检查 OpenClaw 目录
    if [ ! -d "$OPENCLAW_DIR" ]; then
        print_warning "OpenClaw 工作区不存在：$OPENCLAW_DIR"
        print_warning "跳过 OpenClaw 集成配置"
        echo ""
        return
    fi
    
    # 创建符号链接
    local link_name="$OPENCLAW_DIR/heartflow-companion"
    
    if [ -L "$link_name" ] || [ -d "$link_name" ]; then
        print_warning "符号链接已存在：$link_name"
        rm -rf "$link_name"
        print_success "已删除旧链接"
    fi
    
    ln -s "$INSTALL_DIR" "$link_name"
    print_success "OpenClaw 集成配置完成"
    print_success "符号链接：$link_name → $INSTALL_DIR"
    echo ""
}

create_launcher() {
    print_step "创建启动器..."
    
    # 创建全局命令
    if [ -d "$HOME/.local/bin" ]; then
        mkdir -p "$HOME/.local/bin"
    fi
    
    # 创建启动脚本
    cat > "$INSTALL_DIR/heartflow" << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
node src/index.js "$@"
EOF
    
    chmod +x "$INSTALL_DIR/heartflow"
    
    # 创建全局链接（如果可能）
    if [ -w "/usr/local/bin" ]; then
        ln -sf "$INSTALL_DIR/heartflow" "/usr/local/bin/heartflow" 2>/dev/null || true
        print_success "全局命令 heartflow 已创建"
    else
        print_warning "无法创建全局命令（需要 sudo 权限）"
        print_warning "你可以使用：$INSTALL_DIR/heartflow"
    fi
    
    echo ""
}

run_demo() {
    print_step "运行演示..."
    
    cd "$INSTALL_DIR"
    
    if [ -f "demo.js" ]; then
        node demo.js
    else
        print_warning "未找到演示文件"
    fi
    
    echo ""
}

# ============================================================================
# 主流程
# ============================================================================

main() {
    print_logo
    
    echo "欢迎使用 HeartFlow Companion 一键安装程序！"
    echo ""
    echo "安装信息："
    echo "  安装目录：$INSTALL_DIR"
    echo "  OpenClaw 目录：$OPENCLAW_DIR"
    echo "  仓库地址：$REPO_URL"
    echo ""
    
    # 检查是否自动模式（-y 或 --yes 参数）
    if [[ "$1" == "-y" ]] || [[ "$1" == "--yes" ]] || [[ -n "$AUTO_INSTALL" ]]; then
        print_success "自动模式：无需确认，开始安装..."
    else
        echo -n "是否继续安装？[Y/n]: "
        read -r response
        if [[ "$response" =~ ^[Nn]$ ]]; then
            print_warning "安装已取消"
            exit 0
        fi
    fi
    
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo ""
    
    # 执行安装步骤
    check_prerequisites
    clone_repository
    install_dependencies
    setup_openclaw_integration
    create_launcher
    
    # 完成
    echo "═══════════════════════════════════════════════════════════"
    echo ""
    print_success "🎉 HeartFlow Companion 安装完成！"
    echo ""
    echo "下一步："
    echo "  1. 启动 HeartFlow:"
    echo "     heartflow"
    echo "     或：$INSTALL_DIR/heartflow"
    echo ""
    echo "  2. 运行演示:"
    echo "     node $INSTALL_DIR/demo.js"
    echo ""
    echo "  3. 查看文档:"
    echo "     https://github.com/yun520-1/mark-heartflow-skill"
    echo ""
    echo "  4. OpenClaw 集成:"
    echo "     在 OpenClaw 中使用 /heartflow 命令"
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo ""
    
    # 询问是否运行演示（自动模式下跳过）
    if [[ "$1" == "-y" ]] || [[ "$1" == "--yes" ]] || [[ -n "$AUTO_INSTALL" ]]; then
        print_success "自动模式：跳过演示运行"
        print_success "运行演示：node $INSTALL_DIR/demo.js"
    else
        echo -n "是否立即运行演示？[Y/n]: "
        read -r response
        if [[ ! "$response" =~ ^[Nn]$ ]]; then
            run_demo
        fi
    fi
}

# 运行主流程
main "$@"
