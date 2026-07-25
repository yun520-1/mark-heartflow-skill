#!/usr/bin/env bash
# HeartFlow 一键安装脚本
# 用法: bash scripts/setup.sh [--port 8588]

set -e

PORT="${2:-8588}"
HF_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "=============================="
echo " HeartFlow (心虫) — 安装脚本"
echo "=============================="
echo ""

# 1. 检查 Node.js
if ! command -v node &>/dev/null; then
  echo "❌ 需要 Node.js (≥18)。请先安装: https://nodejs.org"
  exit 1
fi
echo "✅ Node.js $(node -v)"

# 2. 检查 npm 依赖
if [ ! -d "$HF_DIR/node_modules" ]; then
  echo "📦 安装依赖..."
  cd "$HF_DIR" && npm install --production --silent 2>/dev/null
  echo "✅ 依赖安装完成"
else
  echo "✅ 依赖已安装"
fi

# 3. 检查 .env 中的 token
ENV_FILE="$HF_DIR/../../.env"
if [ -f "$ENV_FILE" ] && grep -q "MCP_HEARTFLOW" "$ENV_FILE" 2>/dev/null; then
  echo "✅ Token 已配置"
else
  echo "🔑 Token 会在 MCP 首次启动时自动生成"
fi

# 4. 启动 MCP
echo ""
echo "🚀 启动 MCP 服务 (端口 ${PORT})..."
cd "$HF_DIR"

# 清理旧进程
fuser -k "${PORT}/tcp" 2>/dev/null || true
sleep 1

nohup node src/mcp-server.js --port "$PORT" > /tmp/heartflow-mcp.log 2>&1 &
MCP_PID=$!
sleep 3

# 验证
if kill -0 "$MCP_PID" 2>/dev/null; then
  echo "✅ MCP 服务已启动 (PID: $MCP_PID)"
  echo "📡 端口: ${PORT}"
  echo ""
  echo "=============================="
  echo " 安装完成！"
  echo "=============================="
  echo ""
  echo "下一步："
  echo "  Hermes:   hermes mcp add heartflow --url http://localhost:${PORT}/mcp"
  echo "  Claude:   在 CLAUDE.md 中配置 MCP"
  echo "  OpenClaw: 在配置中添加 MCP 工具源"
  echo ""
  echo "查看日志: tail -f /tmp/heartflow-mcp.log"
  echo "停止服务: kill $MCP_PID"
else
  echo "❌ MCP 启动失败。查看日志: cat /tmp/heartflow-mcp.log"
  exit 1
fi
