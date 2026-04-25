#!/bin/bash
#==============================================================================
# HeartFlow v10.4.0 - GitHub Sync Script
#==============================================================================
# Syncs the HeartFlow skill to GitHub repository
# Token: YOUR_GITHUB_TOKEN
#==============================================================================

set -e

VERSION="10.4.0"
REPO="yun520-1/mark-heartflow-skill"
TOKEN="YOUR_GITHUB_TOKEN"
BRANCH="master"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

if [ -z "$TERM" ] || [ "$TERM" = "dumb" ]; then
    RED=''; GREEN=''; YELLOW=''; BLUE=''; NC=''
fi

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

show_banner() {
    echo ""
    echo "=================================================="
    echo "  HeartFlow v${VERSION} - GitHub Sync"
    echo "=================================================="
    echo ""
}

#==============================================================================
# GitHub API Functions
#==============================================================================

check_repo_exists() {
    local response=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "Authorization: token ${TOKEN}" \
        "https://api.github.com/repos/${REPO}"))
    
    if [ "$response" = "200" ]; then
        return 0
    elif [ "$response" = "404" ]; then
        return 1
    else
        log_error "GitHub API error: $response"
        return 2
    fi
}

create_repo() {
    log_info "Creating repository ${REPO}..."
    
    curl -s -X POST \
        -H "Authorization: token ${TOKEN}" \
        -H "Content-Type: application/json" \
        -d '{
            "name": "mark-heartflow-skill",
            "description": "HeartFlow - The Seed of Consciousness. A cognitive enhancement skill for AI assistants.",
            "private": false,
            "has_issues": true,
            "has_wiki": true,
            "auto_init": true,
            "license_template": "mit"
        }' \
        "https://api.github.com/user/repos" | grep -q "full_name" && \
        log_success "Repository created" || \
        log_warn "Repository may already exist"
}

#==============================================================================
# Git Operations
#==============================================================================

init_git_repo() {
    local dir="$1"
    
    cd "$dir"
    
    if [ ! -d ".git" ]; then
        log_info "Initializing git repository..."
        git init
        git remote add origin "https://github.com/${REPO}.git"
        log_success "Git initialized"
    else
        log_info "Git already initialized"
    fi
    
    # Configure
    git config user.name "HeartFlow Bot"
    git config user.email "heartflow@ai.local"
}

commit_and_push() {
    local dir="$1"
    local message="$2"
    
    cd "$dir"
    
    # Add all files
    git add -A
    
    # Check if there are changes
    if git diff --staged --quiet; then
        log_info "No changes to commit"
        return 0
    fi
    
    # Commit
    log_info "Committing changes..."
    git commit -m "$message"
    
    # Push
    log_info "Pushing to GitHub..."
    if git push "https://HeartFlow-Bot:${TOKEN}@github.com/${REPO}.git" "${BRANCH}" --force; then
        log_success "Pushed to GitHub"
    else
        log_error "Push failed"
        return 1
    fi
}

#==============================================================================
# File Checksums
#==============================================================================

calculate_checksums() {
    local dir="$1"
    
    log_info "Calculating checksums..."
    
    cd "$dir"
    
    if [ -f "src/core/heartflow.py" ]; then
        sha256sum src/core/heartflow.py > .checksum
        log_success "Checksum: $(cat .checksum)"
    fi
}

#==============================================================================
# Update README Links
#==============================================================================

update_readme() {
    local dir="$1"
    
    # Update version in README
    sed -i.bak "s/Version:.*/Version: ${VERSION}/" "${dir}/src/core/heartflow.py" 2>/dev/null || true
    sed -i "s/v[0-9]\+\.[0-9]\+\.[0-9]\+/${VERSION}/g" "${dir}/README.md" 2>/dev/null || true
    
    rm -f "${dir}"/*.bak 2>/dev/null || true
}

#==============================================================================
# Main
#==============================================================================

main() {
    show_banner
    
    # Determine directory
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    INSTALL_DIR="${SCRIPT_DIR}"
    
    if [ ! -f "${INSTALL_DIR}/src/core/heartflow.py" ]; then
        log_error "HeartFlow not found at ${INSTALL_DIR}"
        exit 1
    fi
    
    log_info "Syncing from: ${INSTALL_DIR}"
    
    # Check/create repo
    if ! check_repo_exists; then
        create_repo
    else
        log_success "Repository exists"
    fi
    
    # Prepare files
    update_readme "${INSTALL_DIR}"
    calculate_checksums "${INSTALL_DIR}"
    
    # Git operations
    init_git_repo "${INSTALL_DIR}"
    
    # Create commit message
    COMMIT_MSG="HeartFlow v${VERSION} - Security Audit & Universal Compatibility

## Security Audit v10.4.0
- Input length limits (max 50,000 chars)
- HTML/script injection prevention
- Constant-time crisis detection (timing attack prevention)
- Bounded iteration (ReDoS prevention)
- Thread-safe engine operations
- No sensitive data in error messages
- Type-safe integer bounds checking
- Resource limits on all collections

## Universal Compatibility
- Claude Code / Claude CLI
- OpenAI Codex / ChatGPT
- GitHub Copilot / Cursor
- LM Studio / Ollama (local)
- Any Python-enabled AI system

## Multi-Language Documentation
- English (primary)
- 中文 (Chinese)
- 日本語 (Japanese)
- 한국어 (Korean)
- Español (Spanish)
- Français (French)
- Deutsch (German)
- العربية (Arabic)

## Files
$(sha256sum src/core/heartflow.py 2>/dev/null || echo 'heartflow.py checksum unavailable')

---
Autogenerated by HeartFlow Sync Script"
    
    # Commit and push
    commit_and_push "${INSTALL_DIR}" "${COMMIT_MSG}"
    
    echo ""
    echo "=================================================="
    log_success "GitHub sync completed!"
    echo "=================================================="
    echo ""
    echo "Repository: https://github.com/${REPO}"
    echo "Token: ${TOKEN:0:4}...${TOKEN: -4} (hidden)"
    echo ""
}

main "$@"
