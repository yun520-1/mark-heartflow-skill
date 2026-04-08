#!/bin/bash

# HeartFlow Enhanced Hourly Theory Upgrade v2
# 真正搜索 SEP + 学术论文 + 高级数学公式
# 
# 功能:
# 1. 搜索 SEP 最新哲学/心理学理论
# 2. 搜索学术前沿论文 (2020-2026)
# 3. 运行高级数学公式计算
# 4. 生成可执行程序
# 5. 保存心理学公式库

SCRIPT_DIR="/Users/apple/mark-heartflow-skill-new"
LOG_DIR="$SCRIPT_DIR/logs"
TIMESTAMP=$(date +%Y%m%d%H%M%S)

mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/enhanced-upgrade-$TIMESTAMP.log"

echo "=== HeartFlow Enhanced Hourly Theory Upgrade v2 ===" | tee -a "$LOG_FILE"
echo "Time: $(date)" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# 运行增强版 Node 脚本
echo "1. 运行增强升级脚本..." | tee -a "$LOG_FILE"
cd "$SCRIPT_DIR"
node scripts/hourly-theory-upgrade-v2.js 2>&1 | tee -a "$LOG_FILE"

# 更新版本号
echo "" | tee -a "$LOG_FILE"
echo "2. 更新版本号..." | tee -a "$LOG_FILE"
CURRENT=$(cat "$SCRIPT_DIR/VERSION.txt" 2>/dev/null | head -1)
if [ -z "$CURRENT" ]; then
  CURRENT="7.3.2"
fi
NEXT=$(echo "$CURRENT" | awk -F. '{print $1"."$2"."$3+1}')
echo "$NEXT" > "$SCRIPT_DIR/VERSION.txt"
echo "   版本: $CURRENT → $NEXT" | tee -a "$LOG_FILE"

echo "" | tee -a "$LOG_FILE"
echo "=== 增强升级完成 ===" | tee -a "$LOG_FILE"

# 清理旧日志 (保留7天)
find "$LOG_DIR" -name "enhanced-upgrade-*.log" -mtime +7 -delete 2>/dev/null

exit 0
