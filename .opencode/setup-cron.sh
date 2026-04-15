#!/bin/bash
# HeartFlow 定时任务安装脚本

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CRON_FILE="$SCRIPT_DIR/heartflow.cron"

echo "📝 HeartFlow 定时任务安装"
echo ""

# 检查 crontab 是否可用
if ! command -v crontab &> /dev/null; then
  echo "❌ crontab 未安装"
  exit 1
fi

# 安装定时任务
echo "⏰ 安装定时任务..."
crontab -l 2>/dev/null | grep -v "heartflow.cron" > /tmp/temp_cron.XXXXXX
cat "$CRON_FILE" >> /tmp/temp_cron.XXXXXX
crontab /tmp/temp_cron.XXXXXX
rm -f /tmp/temp_cron.XXXXXX

if [ $? -eq 0 ]; then
  echo "✅ 定时任务安装成功"
  echo ""
  echo "当前定时任务:"
  crontab -l | grep heartflow
  echo ""
  echo "日志文件：$SCRIPT_DIR/auto-runner.log"
  echo "查看日志：tail -f $SCRIPT_DIR/auto-runner.log"
else
  echo "❌ 定时任务安装失败"
  exit 1
fi
