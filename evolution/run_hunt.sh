#!/bin/bash
# HeartFlow 论文狩猎执行器
# 由 macOS launchd 调用，负责执行 hunt_papers.py
# 此文件由 Hermes 定时更新，请勿手动修改

EXEC_LOG="/Users/apple/.hermes/skills/ai/heartflow/evolution_logs/executions.log"
PYTHON="/usr/bin/python3"
SCRIPT="/Users/apple/.hermes/skills/ai/heartflow/evolution/hunt_papers.py"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 开始执行论文狩猎..." >> "$EXEC_LOG"

"$PYTHON" "$SCRIPT" >> "$EXEC_LOG" 2>&1
EXIT=$?

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 执行完成，退出码: $EXIT" >> "$EXEC_LOG"
exit $EXIT
