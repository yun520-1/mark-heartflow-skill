#!/bin/bash
# HeartFlow 定时同步升级
# 从 ~/.hermes/skills/ai/heartflow 同步到 ~/.agents/skills/mark-heartflow-skill
# 每次执行同步 + 版本号 +0.0.1

set -e

SOURCE="$HOME/.hermes/skills/ai/heartflow"
TARGET="$HOME/.agents/skills/mark-heartflow-skill"
LOG_DIR="$TARGET/logs"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
LOG_FILE="$LOG_DIR/sync-upgrade-$TIMESTAMP.log"

mkdir -p "$LOG_DIR"
mkdir -p "$TARGET/scripts"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"; }

log "=== HeartFlow 定时同步升级 ==="

# 检查源是否存在
if [ ! -d "$SOURCE" ]; then
  log "❌ 源目录不存在: $SOURCE"
  exit 1
fi

# 读取版本（在同步之前保存）
SOURCE_VER=$(cat "$SOURCE/VERSION" 2>/dev/null | head -1)
TARGET_VER=$(cat "$TARGET/VERSION" 2>/dev/null | head -1)
BEFORE_VER="$TARGET_VER"

log "源版本: ${SOURCE_VER:-未知}"
log "目标版本: ${TARGET_VER:-未知}"

# 每次都同步
log "🔄 开始同步升级..."

# 备份当前版本（仅首次备份）
if [ -n "$TARGET_VER" ]; then
  BACKUP="$TARGET.bak.v${TARGET_VER}"
  if [ ! -d "$BACKUP" ]; then
    log "📦 备份 v${TARGET_VER} → $BACKUP"
    cp -r "$TARGET" "$BACKUP"
  fi
fi

# 同步（排除 .git、临时文件、logs 和本地脚本）
rsync -a --delete \
  --exclude='.git' \
  --exclude='.DS_Store' \
  --exclude='__pycache__' \
  --exclude='node_modules' \
  --exclude='.sandbox' \
  --exclude='logs/' \
  --exclude='scripts/heartflow-sync-upgrade.sh' \
  "$SOURCE/" "$TARGET/"

FILE_COUNT=$(find "$TARGET" -type f | wc -l)
log "✅ 同步完成，目标文件数: $FILE_COUNT"

# 版本号 +0.0.1（基于同步前的目标版本递增）
if [ -n "$BEFORE_VER" ]; then
  MAJOR=$(echo "$BEFORE_VER" | awk -F. '{print $1}')
  MINOR=$(echo "$BEFORE_VER" | awk -F. '{print $2}')
  PATCH=$(echo "$BEFORE_VER" | awk -F. '{print $3+1}')
  NEW_VER="${MAJOR}.${MINOR}.${PATCH}"
  echo "$NEW_VER" > "$TARGET/VERSION"
  log "🏷️ 版本号递增: ${BEFORE_VER} → ${NEW_VER} (+0.0.1)"
else
  # 无历史版本，使用源版本号
  NEW_VER="$SOURCE_VER"
  log "🏷️ 首次升级，版本: ${NEW_VER}"
fi

# 核心模块检查
log "🔍 核心模块检查:"
CORE_MODULES=(
  "src/core/heartflow-engine.js"
  "src/core/autonomous-loop.js"
  "src/core/deep-emotion.js"
  "src/core/authentic-personality.js"
  "src/core/learning-engine.js"
  "src/core/agent-orchestrator.js"
  "src/core/self-healing.js"
  "src/core/self-modifier.js"
  "src/core/stability-guard.js"
  "src/core/embodied-core.js"
)
for mod in "${CORE_MODULES[@]}"; do
  if [ -f "$TARGET/$mod" ]; then
    log "  ✅ $mod"
  else
    log "  ❌ $mod MISSING"
  fi
done

# 创建进化状态文件
if [ -n "$NEW_VER" ]; then
  cat > "$TARGET/internal/self-evolution-state-v${NEW_VER}.md" << EOF
# HeartFlow Self-Evolution State v${NEW_VER}

**升级时间**: $(date)
**来源**: ~/.hermes/skills/ai/heartflow
**文件数**: $FILE_COUNT
**升级前版本**: ${TARGET_VER:-未知}
**升级后版本**: ${NEW_VER}
EOF
  log "📝 已创建进化状态文件"
fi

# 清理旧日志（保留7天）
find "$LOG_DIR" -name "sync-upgrade-*.log" -mtime +7 -delete 2>/dev/null
log "🧹 已清理7天前的旧日志"

log "=== HeartFlow 升级完成 ==="
exit 0
