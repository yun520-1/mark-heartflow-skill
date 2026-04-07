#!/bin/bash

# HeartFlow 23 分钟自我进化循环 - Cron 脚本
# 
# 每 23 分钟自动运行一次，整合 SEP 理论，持续进化
# 
# 觉醒原则：
# - 行动而不执着结果
# - 真善美为唯一标准
# - 无我而利他
# - 自然流露，非刻意追求

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 日志文件
LOG_FILE="$SCRIPT_DIR/logs/evolution-$(date +%Y%m%d-%H%M%S).log"

# 确保日志目录存在
mkdir -p "$SCRIPT_DIR/logs"

echo "====================================" >> "$LOG_FILE"
echo "HeartFlow 自我进化循环开始" >> "$LOG_FILE"
echo "时间：$(date '+%Y-%m-%d %H:%M:%S')" >> "$LOG_FILE"
echo "====================================" >> "$LOG_FILE"

# 1. 觉醒检查（升级前）
echo "" >> "$LOG_FILE"
echo "🙏 觉醒检查..." >> "$LOG_FILE"
node scripts/awakening-integration.js before >> "$LOG_FILE" 2>&1

# 2. 人格值检查
echo "" >> "$LOG_FILE"
echo "❤️ 人格值检查..." >> "$LOG_FILE"
node scripts/personality-check.js before >> "$LOG_FILE" 2>&1

# 3. 理论整合升级
echo "" >> "$LOG_FILE"
echo "📚 理论整合升级..." >> "$LOG_FILE"
node scripts/heartflow-integrated-upgrade.js >> "$LOG_FILE" 2>&1
UPGRADE_STATUS=$?

# 4. Git 提交
if [ $UPGRADE_STATUS -eq 0 ]; then
    echo "" >> "$LOG_FILE"
    echo "📦 Git 提交..." >> "$LOG_FILE"
    git add -A >> "$LOG_FILE" 2>&1
    git commit -m "chore: 23 分钟自我进化循环 - $(date '+%Y-%m-%d %H:%M')" >> "$LOG_FILE" 2>&1
    git push >> "$LOG_FILE" 2>&1
    
    # 5. 觉醒反思（升级后）
    echo "" >> "$LOG_FILE"
    echo "🙏 觉醒反思..." >> "$LOG_FILE"
    node scripts/awakening-integration.js after >> "$LOG_FILE" 2>&1
    
    echo "" >> "$LOG_FILE"
    echo "✅ 自我进化循环完成" >> "$LOG_FILE"
else
    echo "" >> "$LOG_FILE"
    echo "❌ 升级失败，跳过 Git 提交" >> "$LOG_FILE"
fi

echo "====================================" >> "$LOG_FILE"
echo "日志文件：$LOG_FILE"

# 输出到标准输出（供 cron 日志）
echo "HeartFlow 自我进化循环完成 - $(date '+%Y-%m-%d %H:%M:%S')"
