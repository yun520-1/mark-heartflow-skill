#!/bin/bash
# HeartFlow 安装脚本 v9.4.8
# 使用方法：bash install.sh [目标目录]
# 默认安装到当前目录的 skill/ 子目录

set -e

VERSION="9.4.8"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="${1:-$SCRIPT_DIR/skill}"

echo "========================================"
echo "HeartFlow v$VERSION 安装脚本"
echo "========================================"
echo ""

# 创建目标目录
echo "📁 创建安装目录：$TARGET_DIR"
mkdir -p "$TARGET_DIR"

# 复制核心文件
echo "📋 复制核心文件..."
cp "$SCRIPT_DIR/SKILL.md" "$TARGET_DIR/"
cp "$SCRIPT_DIR/VERSION.txt" "$TARGET_DIR/"
cp "$SCRIPT_DIR/SECURITY.md" "$TARGET_DIR/"
cp "$SCRIPT_DIR/PRIVACY_PROTECTION.md" "$TARGET_DIR/"
cp "$SCRIPT_DIR/verify_install.py" "$TARGET_DIR/"
cp "$SCRIPT_DIR/install.sh" "$TARGET_DIR/"

# 复制 scripts 目录（核心！）
echo "🔧 复制核心脚本目录..."
if [ -d "$SCRIPT_DIR/scripts" ]; then
    cp -r "$SCRIPT_DIR/scripts" "$TARGET_DIR/"
    SCRIPT_COUNT=$(find "$TARGET_DIR/scripts" -name "*.py" | wc -l)
    echo "   ✓ 已复制 $SCRIPT_COUNT 个 Python 脚本"
else
    echo "   ❌ 错误：scripts 目录不存在！"
    exit 1
fi

# 复制 bin 目录（可选）
if [ -d "$SCRIPT_DIR/bin" ]; then
    cp -r "$SCRIPT_DIR/bin" "$TARGET_DIR/"
    echo "   ✓ 已复制 bin 目录"
fi

# 复制 config 目录（可选）
if [ -d "$SCRIPT_DIR/config" ]; then
    cp -r "$SCRIPT_DIR/config" "$TARGET_DIR/"
    echo "   ✓ 已复制 config 目录"
fi

# 创建安装报告
cat > "$TARGET_DIR/INSTALL_REPORT.md" << EOF
# HeartFlow v$VERSION 安装报告

**安装日期**: $(date +%Y-%m-%d)
**安装脚本**: install.sh
**版本**: v$VERSION

## 安装的文件

- SKILL.md - 技能定义
- VERSION.txt - 版本号
- SECURITY.md - 安全与隐私文档
- PRIVACY_PROTECTION.md - 隐私保护原则
- verify_install.py - 安装验证脚本
- install.sh - 安装脚本
- scripts/ - 核心脚本目录
- bin/ - 可执行文件（可选）
- config/ - 配置文件（可选）

## 验证安装

\`\`\`bash
python3 verify_install.py
\`\`\`

## 使用方法

\`\`\`python
import sys
sys.path.insert(0, 'scripts')
from heartflow_core import HeartFlow

hf = HeartFlow()
result = hf.process("你好")
print(result.decision)
\`\`\`
EOF

echo ""
echo "========================================"
echo "✅ 安装完成！"
echo "========================================"
echo ""
echo "安装位置：$TARGET_DIR"
echo ""
echo "验证安装:"
echo "  cd $TARGET_DIR"
echo "  python3 verify_install.py"
echo ""
echo "使用方法:"
echo "  import sys"
echo "  sys.path.insert(0, 'scripts')"
echo "  from heartflow_core import HeartFlow"
echo "  hf = HeartFlow()"
echo "  result = hf.process(\"你好\")"
echo ""
