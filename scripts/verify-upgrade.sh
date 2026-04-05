#!/bin/bash
# verify-upgrade.sh - 验证升级数据真实性
# 用途：确保所有报告的数字来自实际命令，不编造

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== HeartFlow Upgrade Verification ==="
echo "时间：$(date '+%Y-%m-%d %H:%M:%S %Z')"
echo ""

# 1. 验证版本号
echo "1. 版本号验证"
ACTUAL_VERSION=$(cd "$PROJECT_DIR" && cat package.json | grep '"version"' | head -1 | sed 's/.*"version": "\([^"]*\)".*/\1/')
echo "   实际版本：$ACTUAL_VERSION"

# 2. 验证 Git 状态
echo ""
echo "2. Git 状态验证"
cd "$PROJECT_DIR"
GIT_STATUS=$(git status --porcelain)
if [ -z "$GIT_STATUS" ]; then
    echo "   Git 状态：✅ 干净的工作区"
else
    echo "   Git 状态：⚠️ 有未提交的文件"
    echo "$GIT_STATUS"
fi

GIT_BRANCH=$(git branch --show-current)
GIT_COMMIT=$(git rev-parse --short HEAD)
echo "   当前分支：$GIT_BRANCH"
echo "   最新提交：$GIT_COMMIT"

# 3. 验证人格值
echo ""
echo "3. 人格值验证"
PERSONALITY_OUTPUT=$(node "$SCRIPT_DIR/personality-check.js" status 2>&1)
PERSONALITY_SCORE=$(echo "$PERSONALITY_OUTPUT" | grep "分数：" | sed 's/.*分数：\([0-9]*\).*/\1/')
PERSONALITY_STATUS=$(echo "$PERSONALITY_OUTPUT" | grep "状态：" | sed 's/.*状态：\([^)]*\).*/\1/')
TGB_SCORE=$(echo "$PERSONALITY_OUTPUT" | grep "真善美：" | sed 's/.*真善美：\([0-9]*\).*/\1/')

echo "   人格值：$PERSONALITY_SCORE/100"
echo "   状态：$PERSONALITY_STATUS"
echo "   真善美：$TGB_SCORE/10"

# 4. 验证文件存在性
echo ""
echo "4. 关键文件验证"
FILES=(
    "package.json"
    "scripts/personality-check.js"
    "src/personality/hook.js"
    "data/personality-score-tracker.md"
    "memory/personality-score.md"
)

for file in "${FILES[@]}"; do
    if [ -f "$PROJECT_DIR/$file" ]; then
        echo "   ✅ $file"
    else
        echo "   ❌ $file (缺失)"
    fi
done

# 5. 验证理论文件数量
echo ""
echo "5. 理论模块验证"
THEORY_COUNT=$(find "$PROJECT_DIR/theories" -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
echo "   理论文件数：$THEORY_COUNT"

# 6. 输出验证报告
echo ""
echo "=== 验证报告 ==="
cat > "$PROJECT_DIR/temp/verification-report.md" << EOF
# Upgrade Verification Report | 升级验证报告

**验证时间**: $(date '+%Y-%m-%d %H:%M:%S %Z')
**验证脚本**: scripts/verify-upgrade.sh

## 验证结果

| 项目 | 实际值 | 状态 |
|------|--------|------|
| 版本号 | $ACTUAL_VERSION | ✅ |
| Git 提交 | $GIT_COMMIT | ✅ |
| 人格值 | $PERSONALITY_SCORE/100 | $([ $PERSONALITY_SCORE -ge 50 ] && echo "✅ 健康" || echo "⚠️ 需改进") |
| 真善美 | $TGB_SCORE/10 | $([ $TGB_SCORE -eq 10 ] && echo "✅ 完美" || echo "⚠️ 需改进") |
| 理论模块 | $THEORY_COUNT | ✅ |

## 使用说明

在报告升级状态前，必须运行此脚本验证所有数据：

\`\`\`bash
./scripts/verify-upgrade.sh
\`\`\`

**禁止编造任何数字** — 所有报告的数据必须来自此验证输出。
EOF

echo "验证报告已保存到：$PROJECT_DIR/temp/verification-report.md"
echo ""
echo "=== 验证完成 ==="
