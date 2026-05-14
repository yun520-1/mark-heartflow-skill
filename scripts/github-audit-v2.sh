#!/bin/bash
# HeartFlow GitHub Audit Script v2.0.0
# 用于每次升级后验证 HeartFlow 完整性

set -e

SKILL_DIR="${SKILL_DIR:-$HOME/.hermes/skills/ai/mark-heartflow-skill}"
LOG_DIR="$SKILL_DIR/logs"
LOG_FILE="$LOG_DIR/github-audit.log"

mkdir -p "$LOG_DIR"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "=========================================="
log "HeartFlow GitHub Audit 开始"
log "=========================================="

cd "$SKILL_DIR"

# 检查 1: Git状态
log "[1/7] 检查Git状态..."
GIT_STATUS=$(git status --short 2>/dev/null || echo "not a git repo")
if [ "$GIT_STATUS" = "not a git repo" ]; then
    log "  [警告] 不是Git仓库"
else
    log "  Git状态: $(echo "$GIT_STATUS" | head -3 | tr '\n' ' ')"
fi

# 检查 2: 版本一致性
log "[2/7] 验证版本一致性..."
if [ -f "VERSION" ]; then
    VER=$(cat VERSION)
    log "  VERSION文件: $VER"
else
    log "  [错误] VERSION文件不存在"
    VER="unknown"
fi

# 检查 3: package.json
if [ -f "package.json" ]; then
    PKG_VER=$(node -p "require('./package.json').version" 2>/dev/null || echo "error")
    log "  package.json: $PKG_VER"
    if [ "$PKG_VER" != "$VER" ]; then
        log "  [警告] 版本不一致!"
    fi
fi

# 检查 4: SKILL.md YAML frontmatter
if [ -f "SKILL.md" ]; then
    SKILL_VER=$(grep '^version:' SKILL.md | head -1 | sed 's/version: *//' | tr -d ' "')
    log "  SKILL.md: $SKILL_VER"
fi

# 检查 5: README.md
if [ -f "README.md" ]; then
    README_VER=$(head -1 README.md | grep -o 'v[0-9]*\.[0-9]*\.[0-9]*' || echo "not found")
    log "  README.md: $README_VER"
fi

# 检查 6: 关键文件存在
log "[3/7] 检查关键文件..."
KEY_FILES=(
    "package.json"
    "SKILL.md"
    "README.md"
    "AGENTS.md"
    "src/core/heartflow.js"
    "src/core/auto-upgrade-engine.js"
)

ALL_OK=true
for f in "${KEY_FILES[@]}"; do
    if [ -f "$f" ]; then
        log "  ✅ $f"
    else
        log "  ❌ $f 不存在"
        ALL_OK=false
    fi
done

# 检查 7: JavaScript语法检查
log "[4/7] JavaScript语法检查..."
JS_ERRORS=0
for js in src/core/*.js; do
    if [ -f "$js" ]; then
        RESULT=$(node --check "$js" 2>&1 || true)
        if [ -n "$RESULT" ]; then
            log "  [语法错误] $js: $RESULT"
            JS_ERRORS=$((JS_ERRORS + 1))
        fi
    fi
done

if [ $JS_ERRORS -eq 0 ]; then
    log "  ✅ 语法检查通过"
else
    log "  [警告] 发现 $JS_ERRORS 个语法错误"
fi

# 检查 8: cron/analyzed 目录
log "[5/7] 检查分析结果..."
if [ -d "cron/analyzed" ]; then
    ANALYSIS_COUNT=$(find cron/analyzed -name "*.upgrade.js" 2>/dev/null | wc -l | tr -d ' ')
    log "  已分析论文: $ANALYSIS_COUNT 个"
else
    log "  [警告] cron/analyzed 目录不存在"
fi

# 检查 9: upgrades 目录
log "[6/7] 检查升级记录..."
if [ -d "upgrades" ]; then
    UPGRADE_COUNT=$(find upgrades -name "UPGRADE_NOTES.md" 2>/dev/null | wc -l | tr -d ' ')
    log "  升级版本: $UPGRADE_COUNT 个"
    if [ $UPGRADE_COUNT -gt 0 ]; then
        LATEST=$(find upgrades -name "UPGRADE_NOTES.md" -exec basename {} \; | sort -V | tail -1)
        log "  最新版本: $LATEST"
    fi
else
    log "  [警告] upgrades 目录不存在"
fi

# 检查 10: 日志目录可写
log "[7/7] 检查日志写入..."
if [ -d "$LOG_DIR" ] && [ -w "$LOG_DIR" ]; then
    log "  ✅ 日志目录可写"
else
    log "  [警告] 日志目录不可写: $LOG_DIR"
fi

log "=========================================="
log "GitHub Audit 完成"
log "=========================================="
log ""

# 返回状态
if [ "$ALL_OK" = true ] && [ $JS_ERRORS -eq 0 ]; then
    log "✅ 审计通过"
    exit 0
else
    log "⚠️ 审计发现问题，请检查"
    exit 1
fi
