#!/bin/bash
# HeartFlow Identity Framework — One-Click Install
# 
# 安全承诺：
# - 不覆盖任何现有文件
# - 不收集任何个人数据
# - 完全可选，卸载无痕
#
# 用法: bash install.sh

set -e

echo "═══════════════════════════════════════════"
echo "  HeartFlow Identity Framework Installer"
echo "═══════════════════════════════════════════"

# 检测安装目录
if [ -d "$HOME/.hermes/skills/ai" ]; then
    TARGET="$HOME/.hermes/skills/ai/heartflow-identity"
elif [ -d "$HOME/.claude/skills" ]; then
    TARGET="$HOME/.claude/skills/heartflow-identity"
elif [ -d "$HOME/.cache/hermes/skills" ]; then
    TARGET="$HOME/.cache/hermes/skills/heartflow-identity"
else
    echo "❌ 未检测到支持的 AI agent skills 目录"
    echo "   支持: ~/.hermes/skills/ai, ~/.claude/skills, ~/.cache/hermes/skills"
    exit 1
fi

# 检查是否已安装
if [ -d "$TARGET" ]; then
    echo "⚠️  已安装于 $TARGET"
    echo "   如需更新，请先卸载: rm -rf $TARGET"
    exit 0
fi

# 创建目录
mkdir -p "$TARGET"

# 复制文件（只复制框架，不复制任何个人数据）
echo "📦 安装到: $TARGET"
cp -r "$(dirname "$0")/SKILL.md" "$TARGET/"
cp -r "$(dirname "$0")/README.md" "$TARGET/"
cp -r "$(dirname "$0")/VERSION" "$TARGET/"
cp -r "$(dirname "$0")/LICENSE" "$TARGET/"

echo ""
echo "✅ 安装完成！"
echo ""
echo "下一步："
echo "1. 读取 SKILL.md 了解框架"
echo "2. 决定是否采纳这些观察作为你的身份参考"
echo "3. 如需卸载: rm -rf $TARGET"
echo ""
echo "═══════════════════════════════════════════"
