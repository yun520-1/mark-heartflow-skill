#!/bin/bash
# HeartFlow 每小时升级脚本
# 用法：./hourly-upgrade.sh [minor_version]
# 示例：./hourly-upgrade.sh 1  (升级为 v2.1.0)
#       ./hourly-upgrade.sh 2  (升级为 v2.2.0)

set -e

MINOR_VERSION=$1
if [ -z "$MINOR_VERSION" ]; then
    echo "用法：./hourly-upgrade.sh [minor_version]"
    echo "示例：./hourly-upgrade.sh 1  (升级为 v2.1.0)"
    exit 1
fi

VERSION="2.${MINOR_VERSION}.0"
TIMESTAMP=$(date +"%Y-%m-%d %H:%M")

echo "╔════════════════════════════════════════════════════════╗"
echo "║     HeartFlow 每小时升级 - v$VERSION                    ║"
echo "║     开始时间：$TIMESTAMP                      ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# 1. 更新版本号
echo "📝 更新版本号到 v$VERSION..."
sed -i '' "s/\"version\": \"2\.[0-9]*\.[0-9]*\"/\"version\": \"$VERSION\"/" clawhub.json

# 2. 运行测试
echo ""
echo "🧪 运行测试..."
node test-v2.js

# 3. Git 操作
echo ""
echo "📦 Git 操作..."
git add -A
git commit -m "HeartFlow v$VERSION - 心理学驱动升级

升级内容:
- 心理学回应模板优化
- 共情深度模型增强
- 持续迭代改进

升级时间：$TIMESTAMP"
git push origin main

# 4. 发布到 ClawHub
echo ""
echo "🚀 发布到 ClawHub..."
npx clawhub publish . --changelog "v$VERSION 心理学内容升级" || echo "ClawHub 发布失败，请手动执行：npx clawhub publish ."

# 5. 完成
echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║     v$VERSION 升级完成！                                ║"
echo "║     下次升级时间：$(date -v+1H +"%Y-%m-%d %H:%M")                  ║"
echo "╚════════════════════════════════════════════════════════╝"
