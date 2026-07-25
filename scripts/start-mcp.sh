#!/usr/bin/env bash
# HeartFlow MCP 启动脚本
# 确保 v6 MCP（有25个真实工具的SSE服务器）跑在 config.yaml 配的端口上

PORT="${1:-8588}"
cd /root/.hermes/skills/ai/mark-heartflow-skill

# 清理旧进程
fuser -k "${PORT}/tcp" 2>/dev/null

# 启动 v6 MCP（src/mcp-server.js，支持 SSE、25个工具）
exec /tmp/nodejs/bin/node src/mcp-server.js --port "${PORT}"
