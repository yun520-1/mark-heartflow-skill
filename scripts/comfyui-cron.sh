#!/bin/bash

# ComfyUI Video Monitor - 每15分钟检查下载一次

SCRIPT_DIR="/Users/apple/mark-heartflow-skill-new"
LOG_DIR="$SCRIPT_DIR/logs"

echo "=== ComfyUI Monitor $(date) ===" >> "$LOG_DIR/comfyui-cron.log"

cd "$SCRIPT_DIR"
node scripts/comfyui-monitor.js >> "$LOG_DIR/comfyui-cron.log" 2>&1

exit 0
