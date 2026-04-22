#!/bin/bash
# HeartFlow Sync & Push Script
# 每次 push 前自动运行同步技能：版本+0.0.1 + 重写介绍 + 安全审计

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SKILL_DIR="$(dirname "$SCRIPT_DIR")"
REPO_DIR="$(dirname "$SKILL_DIR")"

echo "=========================================="
echo "🔄 HeartFlow GitHub Sync & Push"
echo "=========================================="

cd "$REPO_DIR"

# 1. 运行同步技能
echo ""
echo "📝 Running sync skill (version bump + regenerate intro)..."
python3 "$SCRIPT_DIR/sync_github.py"

# 2. 推送到 GitHub
echo ""
echo "🚀 Pushing to GitHub..."
git push origin master

echo ""
echo "✅ Sync & Push completed!"
