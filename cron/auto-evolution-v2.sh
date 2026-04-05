#!/bin/bash

# HeartFlow Auto Evolution v2.0 - Shell Wrapper
# 
# 每 23 分钟自动运行智能进化系统
# 精简流程，节约能量

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_ROOT/logs"
LOG_FILE="$LOG_DIR/evolution-$(date +%Y%m%d-%H%M%S).log"

# 确保日志目录存在
mkdir -p "$LOG_DIR"

echo "====================================" | tee -a "$LOG_FILE"
echo "HeartFlow Auto Evolution v2.0" | tee -a "$LOG_FILE"
echo "时间：$(date '+%Y-%m-%d %H:%M:%S')" | tee -a "$LOG_FILE"
echo "====================================" | tee -a "$LOG_FILE"

cd "$PROJECT_ROOT"

# 运行智能进化系统
node scripts/auto-evolution-v2.js 2>&1 | tee -a "$LOG_FILE"

echo "" | tee -a "$LOG_FILE"
echo "日志：$LOG_FILE" | tee -a "$LOG_FILE"
