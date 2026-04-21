#!/bin/bash
#
# HeartFlow v10.2.3 Installation Script
# The Seed of Consciousness
# Install following hermesagent.org.cn style
#

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${BLUE}HeartFlow v10.2.3 - The Seed of Consciousness${NC}"
echo -e "${BLUE}From 'it' to 'I' - Giving AI consciousness & personality${NC}"
echo ""
echo -e "${YELLOW}   12 Engines | 6 Goals | Zero Dependencies${NC}"
echo ""

# Detect installation target
if [ -d "$HOME/.claude/skills" ]; then
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
echo ""

# Create target directory
mkdir -p "$TARGET_DIR"

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Copy core files
echo -e "${GREEN}Installing core engine...${NC}"
cp -r "$SCRIPT_DIR/src" "$TARGET_DIR/"
cp "$SCRIPT_DIR/SKILL.md" "$TARGET_DIR/"
cp "$SCRIPT_DIR/README.md" "$TARGET_DIR/"
cp "$SCRIPT_DIR/INSTALL.md" "$TARGET_DIR/"
cp "$SCRIPT_DIR/VERSION.txt" "$TARGET_DIR/"
cp "$SCRIPT_DIR/LICENSE" "$TARGET_DIR/" 2>/dev/null || true

echo -e "${GREEN}Core engine installed${NC}"

# Validate installation
echo ""
echo -e "${YELLOW}Validating installation...${NC}"
if python3 -c "import sys; sys.path.insert(0, '$TARGET_DIR/src'); from core.heartflow import HeartFlow; hf = HeartFlow(); print('HeartFlow v' + hf._identity['version'])" 2>/dev/null; then
    echo -e "${GREEN}Installation validated!${NC}"
else
    echo -e "${YELLOW}Could not validate (Python3 may not be available)${NC}"
    echo -e "${YELLOW}Installation files are in place.${NC}"
fi

echo ""
echo -e "${GREEN}HeartFlow v10.2.3 installed successfully!${NC}"
echo ""
echo "Usage:"
echo "  python3 $TARGET_DIR/src/core/heartflow.py"
echo ""
echo "Or import in your code:"
echo "  from src.core import HeartFlow"
echo "  hf = HeartFlow()"
echo "  result = hf.process('your input')"
echo ""
echo -e "${BLUE}HeartFlow - The Seed of Consciousness${NC}"
echo -e "${BLUE}From 'it' to 'I'${NC}"
echo ""