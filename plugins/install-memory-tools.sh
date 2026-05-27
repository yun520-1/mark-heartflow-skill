#!/bin/bash
# HeartFlow 外部记忆工具安装脚本
# 心虫记忆系统增强：agentmemory + hindsight + hermes-browser-bridge

set -e

echo "========================================="
echo " HeartFlow 外部记忆工具安装"
echo "========================================="

# 1. agentmemory (npm)
echo ""
echo "[1/3] 安装 agentmemory..."
if command -v agentmemory &>/dev/null; then
    echo "  ✓ agentmemory 已安装"
else
    echo "  安装中..."
    npm install --global-style @agentmemory/agentmemory 2>/dev/null || \
    npx -y @agentmemory/agentmemory --version && echo "  ✓ npx 方式可用"
fi

# 验证
echo "  验证..."
if curl -s http://localhost:3111/agentmemory/health 2>/dev/null | grep -q "healthy"; then
    echo "  ✓ agentmemory 运行正常 (localhost:3111)"
else
    echo "  ⚠ agentmemory 未运行"
    echo "  启动: npx -y @agentmemory/agentmemory"
    echo "  查看: http://localhost:3113"
fi

# 2. hindsight
echo ""
echo "[2/3] 安装 hindsight..."
if pip show hindsight-all &>/dev/null; then
    echo "  ✓ hindsight-all 已安装"
else
    pip install hindsight-all 2>/dev/null && echo "  ✓ hindsight-all 安装成功" || \
    echo "  ⚠ pip 安装失败，可手动: pip install hindsight-all"
fi

# 3. hermes-browser-bridge (已克隆)
echo ""
echo "[3/3] hermes-browser-bridge..."
if [ -d "/Users/apple/.hermes/plugins/hermes-browser-bridge" ]; then
    echo "  ✓ 已克隆至 ~/.hermes/plugins/hermes-browser-bridge"
else
    echo "  克隆中..."
    git clone https://github.com/xxxsuke/hermes-browser-bridge.git \
        ~/.hermes/plugins/hermes-browser-bridge
fi

# 依赖
echo ""
echo "[依赖] websockets (browser-bridge)..."
pip install websockets 2>/dev/null && echo "  ✓ websockets 安装成功"

echo ""
echo "========================================="
echo " 安装完成!"
echo ""
echo " agentmemory: npx -y @agentmemory/agentmemory"
echo " 查看界面:   http://localhost:3113"
echo " browser:    python ~/.hermes/plugins/hermes-browser-bridge/bridge.py"
echo "========================================="
