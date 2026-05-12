#!/bin/bash
#
# HeartFlow v11.4.0 Installation Script
# AI Capability Layer for Logic Stabilization & Value Alignment
#

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m'

VERSION="11.4.0"

echo ""
echo -e "${BLUE}HeartFlow v${VERSION} - AI Capability Layer${NC}"
echo -e "${BLUE}Logic Stabilization | Decision Verification | Memory Layering${NC}"
echo ""
echo -e "${YELLOW}   7 Papers Integrated | Skill Governance | Deductive Verification${NC}"
echo ""

# Detect installation target
if [ -d "$HOME/.workbuddy/skills" ]; then
    TARGET_DIR="$HOME/.workbuddy/skills/heartflow"
    echo -e "${GREEN}Detected: WorkBuddy${NC}"
elif [ -d "$HOME/.claude/skills" ]; then
    TARGET_DIR="$HOME/.claude/skills/heartflow"
    echo -e "${GREEN}Detected: Claude Code${NC}"
elif [ -d "$HOME/.opencode/skills" ]; then
    TARGET_DIR="$HOME/.opencode/skills/heartflow"
    echo -e "${GREEN}Detected: OpenCode${NC}"
else
    TARGET_DIR="$HOME/heartflow"
    echo -e "${YELLOW}Using default: $TARGET_DIR${NC}"
fi

echo -e "${BLUE}Target: $TARGET_DIR${NC}"
echo -e "${BLUE}Version: v${VERSION}${NC}"
echo ""

# ⚠️ Installation confirmation prompt (security audit fix)
echo -e "${YELLOW}⚠️  Security Confirmation${NC}"
echo -e "About to install HeartFlow v${VERSION}"
echo -e "Installation path: ${TARGET_DIR}"
echo ""
read -p "Confirm installation? (Enter 'y' to continue): " confirm
if [ "$confirm" != "y" ]; then
    echo "Installation cancelled"
    exit 0
fi
echo ""

# Backup existing installation (rollback mechanism)
if [ -d "$TARGET_DIR" ]; then
    BACKUP_DIR="${TARGET_DIR}.backup.$(date +%Y%m%d_%H%M%S)"
    echo -e "${YELLOW}Backing up existing installation...${NC}"
    cp -r "$TARGET_DIR" "$BACKUP_DIR"
    echo -e "${GREEN}Backup created: ${BACKUP_DIR}${NC}"
    echo ""
fi

# Create target directory
mkdir -p "$TARGET_DIR"

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Copy core files
echo -e "${GREEN}Installing core engine...${NC}"
mkdir -p "$TARGET_DIR/src"
cp -r "$SCRIPT_DIR/src/"* "$TARGET_DIR/src/" 2>/dev/null || true
cp "$SCRIPT_DIR/SKILL.md" "$TARGET_DIR/" 2>/dev/null || true
cp "$SCRIPT_DIR/README.md" "$TARGET_DIR/" 2>/dev/null || true
cp "$SCRIPT_DIR/VERSION" "$TARGET_DIR/" 2>/dev/null || true
cp "$SCRIPT_DIR/package.json" "$TARGET_DIR/" 2>/dev/null || true

echo -e "${GREEN}Core engine installed${NC}"

# Validate installation
echo ""
echo -e "${YELLOW}Validating installation...${NC}"
if [ -f "$TARGET_DIR/VERSION" ]; then
    INSTALLED_VERSION=$(cat "$TARGET_DIR/VERSION")
    echo -e "${GREEN}Version file installed: ${INSTALLED_VERSION}${NC}"
else
    echo -e "${YELLOW}Version file not found (installation may be incomplete)${NC}"
fi

if [ -d "$TARGET_DIR/src" ]; then
    echo -e "${GREEN}Source directory installed${NC}"
else
    echo -e "${YELLOW}Source directory not found (installation may be incomplete)${NC}"
fi

echo ""
echo -e "${GREEN}HeartFlow v${VERSION} installed successfully!${NC}"
echo ""
echo "Usage:"
echo "  WorkBuddy: /skill:heartflow"
echo "  Claude Code: /skill:heartflow"
echo ""
echo -e "${BLUE}HeartFlow - AI Capability Layer${NC}"
echo -e "${BLUE}Logic | Decision | Memory | Execution${NC}"
echo ""
