#!/bin/bash
# HeartFlow Paper Upgrade Daemon
# 持续运行，每30分钟执行一次升级检查

SKILL_DIR="/Users/apple/.hermes/skills/ai/mark-heartflow-skill"
LOG_DIR="$SKILL_DIR/logs"
DAEMON_LOG="$LOG_DIR/upgrade-daemon.log"
PID_FILE="$SKILL_DIR/upgrade-daemon.pid"

mkdir -p "$LOG_DIR"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$DAEMON_LOG"
}

# 检查是否已在运行
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if kill -0 "$OLD_PID" 2>/dev/null; then
        log "守护进程已在运行 (PID: $OLD_PID)"
        exit 1
    fi
    log "旧PID文件存在但进程已退出，清理..."
fi

# 记录PID
echo $$ > "$PID_FILE"
log "=========================================="
log "HeartFlow 升级守护进程启动 (PID: $$)"
log "=========================================="

INTERVAL=1800  # 30分钟

while true; do
    log "--- 开始升级检查 ---"
    
    cd "$SKILL_DIR" || { log "错误: 无法进入目录"; exit 1; }
    
    # 检查是否还有未处理的论文
    node -e "
const q = JSON.parse(require('fs').readFileSync('cron/paper-upgrade-queue.json', 'utf-8'));
const unread = q.papers.filter(p => !q.papersRead.includes(p)).length;
console.log('待处理论文: ' + unread);
process.exit(unread > 0 ? 0 : 1);
" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        log "发现有未处理论文，执行升级..."
        node cron/upgrade-runner-v2.mjs 2>&1 | tee -a "$DAEMON_LOG"
        EXIT_CODE=${PIPESTATUS[0]}
        
        if [ $EXIT_CODE -eq 0 ]; then
            bash scripts/github-audit-v2.sh 2>&1 | tee -a "$DAEMON_LOG"
            log "升级完成"
        else
            log "升级脚本执行失败 (exit $EXIT_CODE)"
        fi
    else
        log "所有论文已处理完毕，跳过"
    fi
    
    log "下次检查: $(date -v+30M '+%H:%M')"
    sleep $INTERVAL
done
