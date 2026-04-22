#!/bin/bash
# HeartFlow 论文分析器
# 由 macOS launchd 调用，免费生成升级建议（无 LLM 成本）
# 每 12 小时执行一次

EXEC_LOG="/Users/apple/.hermes/skills/ai/heartflow/evolution_logs/analyze_stdout.log"
PYTHON="/usr/bin/python3"
SCRIPT="/Users/apple/.hermes/skills/ai/heartflow/evolution/analyze_and_upgrade.py"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 开始论文分析..." >> "$EXEC_LOG"
"$PYTHON" "$SCRIPT" >> "$EXEC_LOG" 2>&1
EXIT=$?
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 完成，退出码: $EXIT" >> "$EXEC_LOG"
exit $EXIT