#!/bin/bash
# HeartFlow Identity Framework — Installer
#
# ⚠️  IMPORTANT: Read before running!
#
# This script is provided for convenience. Before running, you should:
# 1. Read this script: cat install.sh
# 2. Review the code: cat HEARTCORE/*.js
# 3. Only proceed if you understand and trust what this does
#
# Safe alternative (recommended):
#   git clone https://github.com/yun520-1/mark-heartflow-skill.git
#   cp -r heartflow-identity ~/.hermes/skills/ai/
#
# DO NOT run scripts downloaded from the internet without review.
# We are not responsible for any damage caused by running unverified scripts.

set -e

echo "═══════════════════════════════════════════"
echo "  HeartFlow Identity Framework Installer"
echo "═══════════════════════════════════════════"

# Detect skills directory
if [ -d "$HOME/.hermes/skills/ai" ]; then
    TARGET="$HOME/.hermes/skills/ai/heartflow-identity"
elif [ -d "$HOME/.claude/skills" ]; then
    TARGET="$HOME/.claude/skills/heartflow-identity"
elif [ -d "$HOME/.cache/hermes/skills" ]; then
    TARGET="$HOME/.cache/hermes/skills/heartflow-identity"
else
    echo "❌ No supported AI agent skills directory found."
    echo "   Supported: ~/.hermes/skills/ai, ~/.claude/skills, ~/.cache/hermes/skills"
    exit 1
fi

# Check if already installed
if [ -d "$TARGET" ]; then
    echo "⚠️  Already installed at $TARGET"
    echo "   To update: rm -rf $TARGET && cp -r . $TARGET"
    exit 0
fi

# Inform user
echo ""
echo "📦 Target: $TARGET"
echo ""
echo "Files to be installed:"
echo "  - SKILL.md         (Identity framework)"
echo "  - HEARTCORE/*.js   (Immune system modules)"
echo "  - README.md"
echo "  - VERSION"
echo "  - LICENSE"
echo ""

read -p "Continue? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

# Create directory
mkdir -p "$TARGET"

# Copy files
cp -r "$(dirname "$0")"/*.md "$TARGET/" 2>/dev/null || true
cp -r "$(dirname "$0")"/VERSION "$TARGET/" 2>/dev/null || true
cp -r "$(dirname "$0")"/LICENSE "$TARGET/" 2>/dev/null || true
cp -r "$(dirname "$0")"/HEARTCORE "$TARGET/" 2>/dev/null || true

echo ""
echo "✅ Installation complete!"
echo ""
echo "Next steps:"
echo "1. cd $TARGET/HEARTCORE"
echo "2. node health-check.js    # verify modules"
echo "3. node heartcore.js check  # run self-check"
echo ""
echo "═══════════════════════════════════════════"
