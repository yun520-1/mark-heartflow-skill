#!/bin/bash

# ComfyUI Video Monitor - 每15分钟检查下载一次

SCRIPT_DIR="/Users/apple/mark-heartflow-skill"
LOG_DIR="$SCRIPT_DIR/logs"

mkdir -p "$LOG_DIR"

echo "=== ComfyUI Monitor $(date) ===" >> "$LOG_DIR/comfyui-cron.log"

cd "$SCRIPT_DIR"
if [ -f "scripts/comfyui-monitor.js" ]; then
  node scripts/comfyui-monitor.js >> "$LOG_DIR/comfyui-cron.log" 2>&1
else
  echo "comfyui-monitor.js not found, skipping..." >> "$LOG_DIR/comfyui-cron.log"
fi

exit 0
