#!/bin/bash

# ComfyUI Video Monitor - 每15分钟检查下载一次
# 使用相对路径，从脚本所在目录计算

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="$SCRIPT_DIR/logs"

echo "=== ComfyUI Monitor $(date) ===" >> "$LOG_DIR/comfyui-cron.log"

cd "$SCRIPT_DIR"
node scripts/comfyui-monitor.js >> "$LOG_DIR/comfyui-cron.log" 2>&1

exit 0
