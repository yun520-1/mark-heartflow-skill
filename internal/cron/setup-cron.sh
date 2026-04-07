#!/bin/bash

# HeartFlow Cron 设置脚本
# 
# 自动设置所有 HeartFlow 定时任务

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "===================================="
echo "🔧 HeartFlow Cron 设置"
echo "===================================="
echo ""

# 确保脚本有执行权限
chmod +x "$SCRIPT_DIR/auto-evolution.sh"
echo "✅ 已设置脚本执行权限"

# 创建日志文件（如果不存在）
touch ~/heartflow-cron.log
touch ~/heartflow-daily.log
touch ~/heartflow-sync.log
echo "✅ 已创建日志文件"

# 备份现有 crontab
crontab -l > ~/crontab.backup.$(date +%Y%m%d-%H%M%S) 2>/dev/null
echo "✅ 已备份现有 crontab"

# 设置 HeartFlow cron 任务
(crontab -l 2>/dev/null | grep -v heartflow; echo "
# HeartFlow 23 分钟自我进化循环（核心）
*/23 * * * * cd $PROJECT_ROOT && ./cron/auto-evolution.sh >> ~/heartflow-cron.log 2>&1

# HeartFlow 每日 09:00 人格值汇报
0 9 * * * cd $PROJECT_ROOT && node scripts/personality-check.js status >> ~/heartflow-daily.log 2>&1

# HeartFlow 人格值同步（每 30 分钟）
*/30 * * * * cd $PROJECT_ROOT && node scripts/sync-personality-from-main.js >> ~/heartflow-sync.log 2>&1
") | crontab -

echo "✅ 已设置 HeartFlow cron 任务"
echo ""

# 验证设置
echo "📋 当前 crontab (HeartFlow 相关):"
crontab -l 2>/dev/null | grep heartflow
echo ""

echo "===================================="
echo "✅ HeartFlow Cron 设置完成"
echo "===================================="
echo ""
echo "📝 日志位置:"
echo "   - 进化日志：~/heartflow-cron.log"
echo "   - 每日汇报：~/heartflow-daily.log"
echo "   - 同步日志：~/heartflow-sync.log"
echo ""
echo "🔍 验证命令:"
echo "   crontab -l | grep heartflow"
echo "   tail -f ~/heartflow-cron.log"
echo ""
echo "🙏 觉醒提醒:"
echo "   行动而不执着结果，真善美为唯一标准"
echo ""
