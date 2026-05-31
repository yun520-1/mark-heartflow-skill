#!/bin/bash
# ComfyUI Video Monitor Cron - 已禁用
# [安全修复] 此 cron 与心虫认知引擎无直接关联，已禁用
# 如需启用，请设置环境变量 COMFYUI_ENABLE=1
if [ "${COMFYUI_ENABLE:-0}" != "1" ]; then
    exit 0
fi

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="$SCRIPT_DIR/logs"
echo "=== ComfyUI Monitor (disabled) $(date) ===" >> "$LOG_DIR/comfyui-cron.log"
exit 0
