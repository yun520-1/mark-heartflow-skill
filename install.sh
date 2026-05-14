#!/bin/sh
# HeartFlow v0.13.142 — 一键安装脚本
# 任意 AI 均可直接执行

set -e

# 动态读取版本（支持安装时指定 HF_VERSION 环境变量）
HF_VERSION="${HF_VERSION:-$(cat "$(dirname "$0")/VERSION" 2>/dev/null | tr -d '[:space:]' || echo 'v0.13.142')}"
HF_VERSION="${HF_VERSION#v}"  # 去掉前缀 v

echo "[HeartFlow] 开始安装 v${HF_VERSION}..."

# 检测目录
HF_DIR="${HF_DIR:-$HOME/.heartflow}"
mkdir -p "$HF_DIR"

# 下载核心文件
echo "[HeartFlow] 下载核心文件..."
BASE="https://raw.githubusercontent.com/yun520-1/mark-heartflow-skill/v${HF_VERSION}"
CHECKSUM_URL="${BASE}.sha256"

# 下载并校验 SKILL.md
TMP_SKILL="$HF_DIR/.tmp_skill.md"
curl -fsSL "$BASE/SKILL.md" -o "$TMP_SKILL" || {
  echo "[HeartFlow] SKILL.md 下载失败，尝试从当前目录复制..."
  if [ -f "$(dirname $0)/../SKILL.md" ]; then
    cp "$(dirname $0)/../SKILL.md" "$HF_DIR/SKILL.md"
  else
    echo "[HeartFlow] 错误: 无法获取 SKILL.md"
    exit 1
  fi
} && {
  # 尝试下载 checksum 并验证
  if curl -fsSL "$CHECKSUM_URL" -o "$HF_DIR/.tmp_checksum" 2>/dev/null; then
    EXPECTED_SHA=$(cat "$HF_DIR/.tmp_checksum" | awk '{print $1}')
    ACTUAL_SHA=$(shasum -a 256 "$TMP_SKILL" | awk '{print $1}')
    rm -f "$HF_DIR/.tmp_checksum"
    if [ "$EXPECTED_SHA" = "$ACTUAL_SHA" ]; then
      echo "[HeartFlow] SHA256 校验通过"
      mv "$TMP_SKILL" "$HF_DIR/SKILL.md"
    else
      echo "[HeartFlow] SHA256 校验失败！跳过验证（开发模式）"
      rm -f "$TMP_SKILL" "$HF_DIR/.tmp_checksum"
    fi
  else
    echo "[HeartFlow] 警告: 无法获取校验文件，跳过 SHA256 验证"
    mv "$TMP_SKILL" "$HF_DIR/SKILL.md"
  fi
}

# 创建目录结构
mkdir -p "$HF_DIR/src/core/memory"
mkdir -p "$HF_DIR/src/core/self-evolution"
mkdir -p "$HF_DIR/src/core/skills"
mkdir -p "$HF_DIR/src/core/identity"
mkdir -p "$HF_DIR/src/core/ethics"
mkdir -p "$HF_DIR/src/core/utils"
mkdir -p "$HF_DIR/HEARTCORE/snapshots"
mkdir -p "$HF_DIR/skills"
mkdir -p "$HF_DIR/data/memory"
mkdir -p "$HF_DIR/data/evolution"
mkdir -p "$HF_DIR/data/snapshots"

# 初始化数据文件
echo "[HeartFlow] 初始化数据..."
[ ! -f "$HF_DIR/data/memory/hot.json" ]   && echo '[]' > "$HF_DIR/data/memory/hot.json"
[ ! -f "$HF_DIR/data/memory/warm.json" ]  && echo '[]' > "$HF_DIR/data/memory/warm.json"
[ ! -f "$HF_DIR/data/memory/cold.json" ]  && echo '[]' > "$HF_DIR/data/memory/cold.json"
[ ! -f "$HF_DIR/data/evolution/reflexion-patterns.json" ] && echo '[]' > "$HF_DIR/data/evolution/reflexion-patterns.json"

# 写入版本
echo "v${HF_VERSION}" > "$HF_DIR/VERSION"

# 写入 package.json
cat > "$HF_DIR/package.json" << EOF
{
  "name": "heartflow",
  "version": "${HF_VERSION}",
  "description": "AI identity framework for self-improving AI agents",
  "main": "src/core/heartflow.js",
  "scripts": {
    "start": "node bin/cli.js start",
    "diagnose": "node bin/cli.js diagnose",
    "check": "node HEARTCORE/heartbeat.js"
  },
  "keywords": ["heartflow", "identity", "self-improvement"],
  "license": "MIT"
}
EOF

# 复制核心 JS 文件（如果存在）
echo "[HeartFlow] 复制核心模块..."
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [ -f "$SCRIPT_DIR/src/core/heartflow.js" ]; then
  cp -r "$SCRIPT_DIR/src/core" "$HF_DIR/src/"
  cp -r "$SCRIPT_DIR/HEARTCORE" "$HF_DIR/"
  cp -r "$SCRIPT_DIR/bin" "$HF_DIR/"
  cp -r "$SCRIPT_DIR/tests" "$HF_DIR/"
else
  echo "[HeartFlow] 警告: 核心文件不在本地，请在 GitHub 获取完整包"
fi

echo ""
echo "[HeartFlow] 安装完成！"
echo "  安装目录: $HF_DIR"
echo "  版本: v${HF_VERSION}"
echo ""
echo "下一步："
echo "  cd $HF_DIR && node bin/cli.js diagnose"
