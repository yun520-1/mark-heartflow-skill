#!/bin/bash
# HeartFlow Paper Upgrade Runner Script
# 纯脚本模式，不依赖AI模型

SKILL_DIR="/Users/apple/.hermes/skills/ai/mark-heartflow-skill"
LOG_DIR="$SKILL_DIR/logs"
LOG_FILE="$LOG_DIR/upgrade-runner-v2.log"

mkdir -p "$LOG_DIR"

echo "[$(date '+%Y-%m-%dT%H:%M:%S')] 开始执行..." | tee -a "$LOG_FILE"

cd "$SKILL_DIR" || exit 1

# 运行 Node.js upgrade runner
node cron/upgrade-runner-v2.mjs 2>&1 | tee -a "$LOG_FILE"
EXIT_CODE=${PIPESTATUS[0]}

if [ $EXIT_CODE -eq 0 ]; then
    echo "[$(date '+%Y-%m-%dT%H:%M:%S')] ✅ 执行成功" | tee -a "$LOG_FILE"
    
    # 运行 GitHub 审计
    bash scripts/github-audit-v2.sh 2>&1 | tee -a "$LOG_FILE"
else
    echo "[$(date '+%Y-%m-%dT%H:%M:%S')] ❌ 执行失败 (exit $EXIT_CODE)" | tee -a "$LOG_FILE"
fi

echo "[$(date '+%Y-%m-%dT%H:%M:%S')] 完成" | tee -a "$LOG_FILE"
exit $EXIT_CODE
