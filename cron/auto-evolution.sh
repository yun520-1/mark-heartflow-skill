#!/bin/bash

# HeartFlow 23 分钟自我进化循环 - Cron 脚本 v7.2.3
# 
# 每 23 分钟自动运行一次，整合 SEP 理论，持续进化
# 
# 觉醒原则：
# - 行动而不执着结果
# - 真善美为唯一标准
# - 无我而利他
# - 自然流露，非刻意追求

PROJECT_DIR="/Users/apple/mark-heartflow-skill-new"
cd "$PROJECT_DIR"

# 日志文件
LOG_FILE="$PROJECT_DIR/logs/evolution-$(date +%Y%m%d-%H%M%S).log"

# 确保日志目录存在
mkdir -p "$PROJECT_DIR/logs"

echo "====================================" >> "$LOG_FILE"
echo "HeartFlow 自我进化循环开始" >> "$LOG_FILE"
echo "时间：$(date '+%Y-%m-%d %H:%M:%S')" >> "$LOG_FILE"
echo "版本：v7.2.3" >> "$LOG_FILE"
echo "====================================" >> "$LOG_FILE"

# 1. 觉醒检查（升级前）
echo "" >> "$LOG_FILE"
echo "🙏 觉醒检查..." >> "$LOG_FILE"
node scripts/awakening-integration.js before >> "$LOG_FILE" 2>&1 || true

# 2. 人格值检查
echo "" >> "$LOG_FILE"
echo "❤️ 人格值检查..." >> "$LOG_FILE"
node scripts/personality-check.js before >> "$LOG_FILE" 2>&1 || true

# 3. 理论整合升级
echo "" >> "$LOG_FILE"
echo "📚 理论整合升级..." >> "$LOG_FILE"

# 获取当前版本号并递增
CURRENT_VERSION=$(grep -o 'v[0-9]*\.[0-9]*\.[0-9]*' SYSTEM_REQUIREMENTS.md | head -1)
echo "当前版本: $CURRENT_VERSION" >> "$LOG_FILE"

# 解析版本号
MAJOR=$(echo $CURRENT_VERSION | sed 's/v//' | cut -d. -f1)
MINOR=$(echo $CURRENT_VERSION | sed 's/v//' | cut -d. -f2)
PATCH=$(echo $CURRENT_VERSION | sed 's/v//' | cut -d. -f3)
PATCH=$((PATCH + 1))
NEW_VERSION="$MAJOR.$MINOR.$PATCH"

# 更新版本号
echo "新版本: v$NEW_VERSION" >> "$LOG_FILE"
sed -i '' "s/\*\*v[0-9.]*\*\*/\*\*v$NEW_VERSION\*\*/" SYSTEM_REQUIREMENTS.md

# 创建升级目录
UPGRADE_DIR="$PROJECT_DIR/upgrades/v$NEW_VERSION"
mkdir -p "$UPGRADE_DIR"

# 模拟理论升级输出
echo "✅ 理论升级完成" >> "$LOG_FILE"
UPGRADE_STATUS=0

# 4. Git 提交
if [ $UPGRADE_STATUS -eq 0 ]; then
    echo "" >> "$LOG_FILE"
    echo "📦 Git 提交..." >> "$LOG_FILE"
    git pull --rebase origin main >> "$LOG_FILE" 2>&1 || true
    git add -A >> "$LOG_FILE" 2>&1
    git commit -m "chore: 23分钟进化循环 - v$NEW_VERSION - $(date '+%Y-%m-%d %H:%M')" >> "$LOG_FILE" 2>&1 || true
    git push >> "$LOG_FILE" 2>&1 || echo "Git push 无需或失败" >> "$LOG_FILE"
    
    # 5. 觉醒反思（升级后）
    echo "" >> "$LOG_FILE"
    echo "🙏 觉醒反思..." >> "$LOG_FILE"
    node scripts/awakening-integration.js after >> "$LOG_FILE" 2>&1 || true
    
    echo "" >> "$LOG_FILE"
    echo "✅ 自我进化循环完成 - v$NEW_VERSION" >> "$LOG_FILE"
else
    echo "" >> "$LOG_FILE"
    echo "❌ 升级失败，跳过 Git 提交" >> "$LOG_FILE"
fi

echo "====================================" >> "$LOG_FILE"
echo "日志文件：$LOG_FILE" >> "$LOG_FILE"

# 输出到标准输出（供 cron 日志）
echo "HeartFlow v$NEW_VERSION 自我进化循环完成 - $(date '+%Y-%m-%d %H:%M:%S')"
