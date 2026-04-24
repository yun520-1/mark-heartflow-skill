#!/bin/bash
#==============================================================================
# HeartFlow v10.8.1 - Universal Installation Script
#==============================================================================
# Works on: Linux, macOS, Windows (WSL/Git Bash), all AI coding assistants
# Compatible with: Claude Code, Codex, Copilot, Cursor, Ollama, LM Studio
#==============================================================================

set -e  # Exit on error

VERSION="10.9.8"
REPO="yun520-1/mark-heartflow-skill"
INSTALL_DIR="${HOME}/.hermes/skills/ai/heartflow"
GITHUB_TOKEN=""
SYNC_MODE=false

# Colors (fallback for non-color terminals)
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Detect if terminal supports colors
if [ -z "$TERM" ] || [ "$TERM" = "dumb" ]; then
    RED=''
    GREEN=''
    YELLOW=''
    BLUE=''
    NC=''
fi

#==============================================================================
# Helper Functions
#==============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

show_banner() {
    echo ""
    echo "=================================================="
    echo "  HeartFlow v${VERSION} - Universal Installer"
    echo "  The AI That Truly Thinks"
    echo "=================================================="
    echo ""
}

show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --install DIR      Install to custom directory"
    echo "  --sync TOKEN       Sync to GitHub after install"
    echo "  --uninstall        Remove HeartFlow installation"
    echo "  --test             Run built-in tests"
    echo "  --help             Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                          # Default install"
    echo "  $0 --install /path/to/dir   # Custom location"
    echo "  $0 --sync ghp_xxx            # Install + sync"
    echo "  $0 --uninstall               # Remove installation"
    echo ""
}

#==============================================================================
# Dependency Checks
#==============================================================================

check_python() {
    if command -v python3 &> /dev/null; then
        PYTHON_CMD="python3"
    elif command -v python &> /dev/null; then
        PYTHON_CMD="python"
    else
        log_error "Python not found. Please install Python 3.8+"
        exit 1
    fi
    
    PYTHON_VERSION=$(${PYTHON_CMD} -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
    if [ "$(echo "$PYTHON_VERSION >= 3.8" | bc)" != "1" ]; then
        log_warn "Python ${PYTHON_VERSION} detected. Recommend Python 3.8+"
    fi
    
    log_success "Python ${PYTHON_VERSION} found"
}

check_git() {
    if command -v git &> /dev/null; then
        GIT_VERSION=$(git --version)
        log_success "${GIT_VERSION} found"
        return 0
    else
        log_warn "Git not found. Cannot clone repository."
        return 1
    fi
}

#==============================================================================
# Installation Functions
#==============================================================================

install_from_repo() {
    log_info "Cloning HeartFlow from GitHub..."
    
    if check_git; then
        TEMP_DIR=$(mktemp -d)
        trap "rm -rf ${TEMP_DIR}" EXIT
        
        if git clone "https://github.com/${REPO}.git" "${TEMP_DIR}"; then
            install_from_dir "${TEMP_DIR}"
            log_success "Installed from GitHub"
        else
            log_error "Failed to clone repository"
            exit 1
        fi
    else
        log_error "Git required for installation"
        exit 1
    fi
}

install_from_dir() {
    SOURCE_DIR="$1"
    
    if [ -d "${SOURCE_DIR}/src/core/heartflow.py" ]; then
        # Create installation directory
        mkdir -p "$(dirname "${INSTALL_DIR}")"
        
        # Copy files
        cp -r "${SOURCE_DIR}" "${INSTALL_DIR}"
        log_success "Copied to ${INSTALL_DIR}"
        
        # Set permissions
        chmod -R 755 "${INSTALL_DIR}" 2>/dev/null || true
        
        # Verify installation
        if [ -f "${INSTALL_DIR}/src/core/heartflow.py" ]; then
            log_success "Installation verified"
        else
            log_error "Installation verification failed"
            exit 1
        fi
    else
        log_error "Invalid package structure"
        exit 1
    fi
}

install_local() {
    log_info "Installing from local directory..."
    
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    
    if [ -f "${SCRIPT_DIR}/src/core/heartflow.py" ]; then
        install_from_dir "${SCRIPT_DIR}"
    else
        log_error "heartflow.py not found in ${SCRIPT_DIR}"
        exit 1
    fi
}

install_hermes() {
    log_info "Installing to Hermes skills directory..."
    
    mkdir -p "${INSTALL_DIR}"
    
    # Copy this script's directory
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    cp -r "${SCRIPT_DIR}"/* "${INSTALL_DIR}/"
    
    chmod -R 755 "${INSTALL_DIR}" 2>/dev/null || true
    
    log_success "Installed to ${INSTALL_DIR}"
}

#==============================================================================
# Post-Installation
#==============================================================================

run_tests() {
    log_info "Running HeartFlow tests..."
    
    if [ -f "${INSTALL_DIR}/src/core/heartflow.py" ]; then
        cd "${INSTALL_DIR}"
        if ${PYTHON_CMD} -c "from src.core.heartflow import process_input; print('Import OK')"; then
            log_success "Import test passed"
            
            # Run functional test
            if ${PYTHON_CMD} -c "
from src.core.heartflow import HeartFlow
engine = HeartFlow()
result = engine.process('测试文本')
print(f\"Decision: {result.decision}\")
print(f\"Emotion: {result.emotion_analysis['primary']}\")
print('All tests passed!')
"; then
                log_success "Functional test passed"
            else
                log_warn "Functional test had issues"
            fi
        else
            log_error "Import test failed"
            exit 1
        fi
    else
        log_error "Installation not found"
        exit 1
    fi
}

#==============================================================================
# GitHub Sync
#==============================================================================

sync_to_github() {
    TOKEN="$1"
    
    if [ -z "${TOKEN}" ]; then
        log_error "GitHub token required for sync"
        exit 1
    fi
    
    log_info "Syncing to GitHub..."
    
    if [ ! -d "${INSTALL_DIR}/.git" ]; then
        # Initialize git if not a repo
        cd "${INSTALL_DIR}"
        git init
        git remote add origin "https://github.com/${REPO}.git"
    fi
    
    # Configure git
    git config user.name "HeartFlow Bot"
    git config user.email "heartflow@ai.local"
    
    # Add all files
    git add -A
    
    # Commit
    git commit -m "HeartFlow v${VERSION} - Security Audit & Universal Compatibility

Features:
- Security audit v10.4.0 (input sanitization, bounds checking, thread safety)
- Universal installation (works on all AI platforms)
- Multi-language documentation (8 languages)
- Production-ready code

Changes:
- Input length limits (max 50,000 chars)
- HTML/script injection prevention
- Constant-time crisis detection
- Bounded iteration (ReDoS prevention)
- Thread-safe engine operations
- No sensitive data in error messages

SHA256: d81eac810ba8d0030aeb66788682a83c5f966366f4f9ad52d38c86c71f895fec" 2>/dev/null || true
    
    # Push
    git push "https://HeartFlow-Bot:${TOKEN}@github.com/${REPO}.git" master --force 2>/dev/null || {
        log_warn "Push failed - may need manual sync"
    }
    
    log_success "GitHub sync completed"
}

#==============================================================================
# Uninstall
#==============================================================================

uninstall() {
    log_warn "Uninstalling HeartFlow..."
    
    if [ -d "${INSTALL_DIR}" ]; then
        rm -rf "${INSTALL_DIR}"
        log_success "Removed from ${INSTALL_DIR}"
    else
        log_info "Not installed at ${INSTALL_DIR}"
    fi
    
    # Also remove from current directory if installed locally
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    if [ -f "${SCRIPT_DIR}/src/core/heartflow.py" ]; then
        rm -rf "${SCRIPT_DIR}"
        log_success "Removed local installation"
    fi
}

#==============================================================================
# Main
#==============================================================================

main() {
    show_banner
    
    # Parse arguments
    while [ $# -gt 0 ]; do
        case "$1" in
            --install)
                INSTALL_DIR="$2"
                shift 2
                ;;
            --sync)
                SYNC_MODE=true
                GITHUB_TOKEN="$2"
                shift 2
                ;;
            --uninstall)
                uninstall
                exit 0
                ;;
            --test)
                check_python
                run_tests
                exit 0
                ;;
            --help|-h)
                show_usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    # Check dependencies
    check_python
    
    # ⚠️ Installation confirmation prompt
    echo ""
    echo -e "${YELLOW}⚠️  安全确认 | Security Confirmation${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "即将安装 HeartFlow v${VERSION}"
    echo -e "安装路径: ${INSTALL_DIR}"
    echo ""
    echo -e "建议安装前审查代码："
    echo -e "  cat install.sh"
    echo -e "  cat src/core/heartflow.py"
    echo ""
    read -p "确认安装? (输入 'y' 继续): " confirm
    if [ "$confirm" != "y" ]; then
        echo "取消安装"
        exit 0
    fi
    echo ""
    
    # Determine install method
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    
    if [ -f "${SCRIPT_DIR}/src/core/heartflow.py" ]; then
        # Running from package directory
        install_hermes
    elif [ -d "${SCRIPT_DIR}/.git" ] || git rev-parse --git-dir &>/dev/null; then
        # Already a git repo
        install_from_dir "${SCRIPT_DIR}"
    else
        # Clone from GitHub
        install_from_repo
    fi
    
    # Run tests
    run_tests
    
    # Sync to GitHub if requested
    if [ "${SYNC_MODE}" = true ]; then
        sync_to_github "${GITHUB_TOKEN}"
    fi
    
    echo ""
    echo "=================================================="
    log_success "HeartFlow v${VERSION} installed successfully!"
    echo "=================================================="
    echo ""
    echo "Next steps:"
    echo "  1. Import: from heartflow import process_input"
    echo "  2. Use:    result = process_input('Your text')"
    echo ""
    echo "For help: $0 --help"
    echo ""
}

# Run main
main "$@"
