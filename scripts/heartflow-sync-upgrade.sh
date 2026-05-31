#!/bin/bash
# HeartFlow 定时同步升级
# 从 ~/.hermes/skills/ai/heartflow 同步到 ~/.agents/skills/mark-heartflow-skill
# 每次执行同步 + 版本号 +0.0.1

set -euo pipefail

SOURCE="$HOME/.hermes/skills/ai/heartflow"
TARGET="$HOME/.agents/skills/mark-heartflow-skill"
LOG_DIR="$TARGET/logs"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
LOG_FILE="$LOG_DIR/sync-upgrade-$TIMESTAMP.log"

mkdir -p "$LOG_DIR"
mkdir -p "$TARGET/scripts"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"; }

# [A05] trap错误处理
cleanup() {
  local exit_code=$?
  if [ $exit_code -ne 0 ]; then
    log "❌ 脚本异常退出 (code: $exit_code)"
  fi
  return $exit_code
}
trap cleanup EXIT

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
# 审计修复：rsync --delete 前加目标存在检查，防止误删
if [ ! -d "$TARGET" ]; then
  log "❌ 目标目录不存在: $TARGET"
  exit 1
fi

rsync -a --checksum --delete \
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

# 版本号递增（审计修复：需显式确认才自增）
# 防止未经审查的自动版本升级
if [ "${HEARTFLOW_AUTO_VERSION:-0}" = "1" ] && [ -n "$BEFORE_VER" ]; then
  MAJOR=$(echo "$BEFORE_VER" | awk -F. '{print $1}')
  MINOR=$(echo "$BEFORE_VER" | awk -F. '{print $2}')
  PATCH=$(echo "$BEFORE_VER" | awk -F. '{print $3+1}')
  NEW_VER="${MAJOR}.${MINOR}.${PATCH}"
  echo "$NEW_VER" > "$TARGET/VERSION"
  log "🏷️ 版本号递增: ${BEFORE_VER} → ${NEW_VER} (+0.0.1)"
else
  if [ -n "$BEFORE_VER" ]; then
    NEW_VER="$BEFORE_VER"
    log "🔒 版本号未变 (set HEARTFLOW_AUTO_VERSION=1 to auto-increment): ${NEW_VER}"
  else
    # 无历史版本，使用源版本号
    NEW_VER="$SOURCE_VER"
    log "🏷️ 首次升级，版本: ${NEW_VER}"
  fi
fi

# 核心模块检查（审计修复：仅检查实际存在的文件）
log "🔍 核心模块检查:"
CORE_MODULES=(
  "src/core/utils.js"
  "src/core/search/bm25.js"
  "src/psychology/engine.js"
  "src/memory/knowledge-graph.js"
  "SKILL.md"
  "package.json"
  "VERSION"
)
for mod in "${CORE_MODULES[@]}"; do
  if [ -f "$TARGET/$mod" ]; then
    log "  ✅ $mod"
  else
    log "  ❌ $mod MISSING"
  fi
done

# 创建进化状态文件（审计修复：仅记录，不含可执行代码）
# 自修改行为已移除
if [ -n "$NEW_VER" ] && [ "${HEARTFLOW_LOG_STATE:-0}" = "1" ]; then
  cat > "$TARGET/internal/self-evolution-state-v${NEW_VER}.md" << EOF
# HeartFlow Self-Evolution Log v${NEW_VER}

**时间**: $(date)
**版本**: ${NEW_VER}

NOTE: 此文件仅用于记录，不含自修改代码。
EOF
fi

# 清理旧日志（保留7天）
find "$LOG_DIR" -name "sync-upgrade-*.log" -mtime +7 -delete 2>/dev/null
log "🧹 已清理7天前的旧日志"

log "=== HeartFlow 升级完成 ==="
exit 0
