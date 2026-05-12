#!/bin/bash
#============================================================
# HeartFlow Full Audit Script
# 每周日执行：验证目录结构 + GitHub审计 + 代码完整性
#============================================================

set -e

SKILL_DIR="/Users/apple/.hermes/skills/ai/mark-heartflow-skill"
LOG_DIR="$SKILL_DIR/logs"
mkdir -p "$LOG_DIR"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_DIR/full-audit.log"
}

log "=========================================="
log "HeartFlow Full Audit 开始"
log "=========================================="

# 1. 检查核心目录结构
log "[1/5] 检查目录结构..."
REQUIRED_DIRS=(
    "src/core"
    "src/agent"
    "src/runtime"
    "src/orchestrator"
    "upgrades"
    "cron"
    "logs"
    "skills"
)

for dir in "${REQUIRED_DIRS[@]}"; do
    if [ ! -d "$SKILL_DIR/$dir" ]; then
        log "[错误] 缺少目录: $dir"
    else
        log "[OK] $dir"
    fi
done

# 2. 检查关键文件
log "[2/5] 检查关键文件..."
KEY_FILES=(
    "SKILL.md"
    "VERSION"
    "src/index.ts"
    "src/core/heartflow.js"
    "cron/paper-upgrade-queue.json"
)

for file in "${KEY_FILES[@]}"; do
    if [ ! -f "$SKILL_DIR/$file" ]; then
        log "[错误] 缺少文件: $file"
    else
        log "[OK] $file"
    fi
done

# 3. 验证版本一致性
log "[3/5] 验证版本一致性..."
QUEUE_VER=$(python3 -c "import json; print(json.load(open('$SKILL_DIR/cron/paper-upgrade-queue.json'))['currentVersion'])" 2>/dev/null)
FILE_VER=$(cat "$SKILL_DIR/VERSION" 2>/dev/null || echo "missing")
SKILL_VER=$(python3 -c "import json, re; m=re.search(r'version:\\s*v?([\\d.]+)', open('$SKILL_DIR/SKILL.md').read()); print(m.group(1) if m else 'unknown')" 2>/dev/null)

log "  Queue版本: $QUEUE_VER"
log "  VERSION文件: $FILE_VER"
log "  SKILL.md版本: $SKILL_VER"

if [ "$QUEUE_VER" = "$FILE_VER" ]; then
    log "[OK] VERSION一致"
else
    log "[警告] VERSION不一致，尝试修复..."
    echo "$QUEUE_VER" > "$SKILL_DIR/VERSION"
fi

# 4. 统计代码行数
log "[4/5] 统计代码行数..."
TOTAL_LINES=$(find "$SKILL_DIR/src" -name "*.ts" -o -name "*.js" 2>/dev/null | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}')
log "  总代码行数: $TOTAL_LINES"

# 5. GitHub审计触发
log "[5/5] 准备GitHub审计..."
AUDIT_TRIGGER="$SKILL_DIR/cron/.audit-needed"
touch "$AUDIT_TRIGGER"
log "  审计标记已创建"

log "=========================================="
log "Full Audit 完成"
log "=========================================="
