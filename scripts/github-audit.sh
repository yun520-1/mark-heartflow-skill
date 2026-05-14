#!/bin/bash
#============================================================
# HeartFlow GitHub Audit Script v0.13.11
# 升级后自动调用，验证代码完整性
#============================================================

set -e

SKILL_DIR="${SKILL_DIR:-$HOME/.hermes/skills/ai/mark-heartflow-skill}"
LOG_DIR="$SKILL_DIR/logs"
REPO="yun520-1/mark-heartflow-skill"
mkdir -p "$LOG_DIR"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_DIR/github-audit.log"
}

log "=========================================="
log "HeartFlow GitHub Audit 开始"
log "=========================================="

# 1. 检查Git状态
log "[1/6] 检查Git状态..."
cd "$SKILL_DIR"
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    log "[错误] 不是Git仓库"
    exit 1
fi

GIT_STATUS=$(git status --porcelain)
if [ -n "$GIT_STATUS" ]; then
    log "[警告] 有未提交的更改"
    log "$GIT_STATUS"
fi

# 2. 检查分支
CURRENT_BRANCH=$(git branch --show-current)
log "[2/6] 当前分支: $CURRENT_BRANCH"

# 3. 检查远程连接
log "[3/6] 检查远程..."
REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "none")
log "远程: $REMOTE_URL"

# 4. 检查版本一致性
log "[4/6] 验证版本..."
QUEUE_VER=$(node -e "console.log(require('./cron/paper-upgrade-queue.json').currentVersion)")
FILE_VER=$(cat VERSION 2>/dev/null || echo "missing")
log "  Queue版本: $QUEUE_VER"
log "  VERSION文件: $FILE_VER"

if [ "$QUEUE_VER" != "$FILE_VER" ]; then
    log "[错误] 版本不一致!"
    exit 1
fi
log "[OK] 版本一致"

# 5. 检查关键文件
log "[5/6] 检查关键文件..."
CHECK_FILES=(
    "SKILL.md"
    "src/index.ts"
    "src/core/heartflow.js"
    "cron/paper-upgrade-queue.json"
)

ALL_OK=true
for f in "${CHECK_FILES[@]}"; do
    if [ ! -f "$f" ]; then
        log "[错误] 缺少: $f"
        ALL_OK=false
    fi
done

if [ "$ALL_OK" = true ]; then
    log "[OK] 所有关键文件存在"
fi

# 6. 语法检查
log "[6/6] JavaScript语法检查..."
JS_FILES=$(find src -name "*.js" -o -name "*.ts" 2>/dev/null | head -20)
SYNTAX_ERRORS=0
for f in $JS_FILES; do
    if ! node --check "$f" 2>/dev/null; then
        log "[语法错误] $f"
        SYNTAX_ERRORS=$((SYNTAX_ERRORS + 1))
    fi
done

if [ $SYNTAX_ERRORS -eq 0 ]; then
    log "[OK] 语法检查通过"
else
    log "[警告] 发现 $SYNTAX_ERRORS 个语法错误"
fi

log "=========================================="
log "GitHub Audit 完成"
log "=========================================="
