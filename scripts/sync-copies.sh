#!/usr/bin/env bash
# sync-copies.sh — 将 git 工作副本同步到 claude/hermes 运行副本，消除 drift
# 用法: bash scripts/sync-copies.sh
set -euo pipefail

SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
echo "源副本: $SRC ($(cat "$SRC/VERSION" 2>/dev/null || echo '?'))"

# 排除模式（find 用 -name/-path 匹配）
is_excluded() {
  case "$1" in
    */.git|*/.git/*) return 0 ;;
    */node_modules|*/node_modules/*) return 0 ;;
    */data/large|*/data/large/*) return 0 ;;
    */formula-engine-development|*/formula-engine-development/*) return 0 ;;
    *.log) return 0 ;;
    */.DS_Store) return 0 ;;
    */test-async-queue.js) return 0 ;;
    *) return 1 ;;
  esac
}

sync_to() {
  local dst="$1"
  [ -d "$dst" ] || { echo "跳过 $dst (目录不存在)"; return; }
  echo "同步 -> $dst"
  # 清空目标中非排除项（保留 .git/node_modules 等）
  # 先复制源到目标（覆盖）
  ( cd "$SRC" && find . -type f | while read -r f; do
      if is_excluded "$f"; then continue; fi
      local target="$dst/$f"
      mkdir -p "$(dirname "$target")"
      cp -f "$SRC/$f" "$target"
    done )
  # 删除目标中有但源中没有的文件（排除保护目录）
  ( cd "$dst" && find . -type f | while read -r f; do
      if is_excluded "$f"; then continue; fi
      if [ ! -f "$SRC/$f" ]; then
        rm -f "$f"
      fi
    done )
  echo "  -> $(cat "$dst/VERSION" 2>/dev/null || echo '?')"
}

sync_to "/root/.claude/skills/heartflow"
sync_to "/root/.hermes/skills/heartflow"

echo "✅ 同步完成"
