#!/bin/bash
# HeartFlow 分布式升级启动器 v2
# 50次升级，6并发，8小时完成

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SKILL_DIR="/Users/apple/.hermes/skills/ai/mark-heartflow-skill"
PAPERS_DIR="/Users/apple/Downloads/daima"
OUTPUT_DIR="$SKILL_DIR/distributed_upgrades"
LOG_DIR="$SKILL_DIR/logs/distributed"
TOTAL_UPGRADES=50
CONCURRENT=6
PAPERS_PER_UPGRADE=4

mkdir -p "$LOG_DIR" "$OUTPUT_DIR"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] [DIST] $1"; }

log "=========================================="
log "HeartFlow 分布式升级启动 v2"
log "总计: $TOTAL_UPGRADES 次升级 | 并发: $CONCURRENT | 目标: 8小时"
log "SKILL_DIR: $SKILL_DIR"
log "=========================================="

# 获取论文列表
ALL_PDF=$(find "$PAPERS_DIR" -name "*.pdf" 2>/dev/null | grep -v DS_Store | head -300)
TOTAL_PDFS=$(echo "$ALL_PDF" | wc -l | tr -d ' ')
log "发现论文: $TOTAL_PDFS 篇"

# 每个子代理处理的升级数
UPGRADES_PER_AGENT=$(( (TOTAL_UPGRADES + CONCURRENT - 1) / CONCURRENT ))
log "每代理升级数: $UPGRADES_PER_AGENT"

# 启动并发子代理
for agent_id in $(seq 0 $((CONCURRENT-1))); do
  UPGRADES_START=$(( agent_id * UPGRADES_PER_AGENT ))
  UPGRADES_END=$(( UPGRADES_START + UPGRADES_PER_AGENT - 1 ))
  
  if [ $UPGRADES_START -ge $TOTAL_UPGRADES ]; then
    log "Agent $agent_id: 无任务"
    continue
  fi
  
  if [ $UPGRADES_END -ge $TOTAL_UPGRADES ]; then
    UPGRADES_END=$(( TOTAL_UPGRADES - 1 ))
  fi
  
  AGENT_LOG="$LOG_DIR/agent_${agent_id}.log"
  log "Agent $agent_id: 升级 #$UPGRADES_START - #$UPGRADES_END"
  
  (
    for upgrade_num in $(seq $UPGRADES_START $UPGRADES_END); do
      BATCH_START=$(( upgrade_num * PAPERS_PER_UPGRADE ))
      PAPER_BATCH=$(echo "$ALL_PDF" | sed -n "$((BATCH_START+1)),$((BATCH_START+PAPERS_PER_UPGRADE))p" | tr '\n' ' ')
      
      if [ -z "$PAPER_BATCH" ]; then
        echo "[$(date)] Agent-$agent_id 升级 #$upgrade_num: 无足够论文" >> "$AGENT_LOG"
        continue
      fi
      
      echo "[$(date)] Agent-$agent_id 开始升级 #$upgrade_num" >> "$AGENT_LOG"
      
      cd "$SKILL_DIR"
      SKILL_DIR="$SKILL_DIR" PAPERS_DIR="$PAPERS_DIR" node "$SKILL_DIR/cron/upgrade-runner.mjs" 2>&1 | tee -a "$AGENT_LOG"
      
      echo "[$(date)] Agent-$agent_id 完成升级 #$upgrade_num" >> "$AGENT_LOG"
      
      sleep 3
    done
    
    echo "[$(date)] Agent $agent_id 完成全部任务" >> "$AGENT_LOG"
  ) &
  
  echo $! > "$OUTPUT_DIR/agent_${agent_id}.pid"
done

log "所有子代理已启动"
log "查看日志: tail -f $LOG_DIR/agent_*.log"

wait
log "=========================================="
log "分布式升级全部完成"
log "=========================================="
