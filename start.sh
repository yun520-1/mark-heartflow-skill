#!/bin/bash
# HeartFlow 一键启动脚本
# 用法: ./start.sh [start|stop|status|health]
#
# 原理:
#   1. daemon 模式: 引擎常驻内存，Unix socket 通信
#   2. CLI 模式: 每次调用都重新初始化（调试用）
#
# Socket 路径: /tmp/heartflow-daemon.sock
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DAEMON="$SCRIPT_DIR/scripts/heartflow-daemon.js"
ROOT="$SCRIPT_DIR"
export HERMES_TMP="${HERMES_TMP:-/tmp}"

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

cmd_start() {
    echo -e "${GREEN}[HeartFlow] 启动 daemon...${NC}"
    # 后台启动 daemon
    nohup node "$DAEMON" start >> "$SCRIPT_DIR/logs/heartflow-daemon.log" 2>&1 &
    DAEMON_PID=$!
    sleep 0.5

    # 检查是否启动成功
    if kill -0 $DAEMON_PID 2>/dev/null; then
        echo -e "${GREEN}[HeartFlow] daemon 已启动 (PID $DAEMON_PID)${NC}"
        # 等待预热
        echo -e "${YELLOW}[HeartFlow] 等待引擎预热...${NC}"
        sleep 1
        node "$DAEMON" status
    else
        echo -e "${RED}[HeartFlow] daemon 启动失败，查看日志:${NC}"
        tail -20 "$SCRIPT_DIR/logs/heartflow-daemon.log" 2>/dev/null || true
        exit 1
    fi
}

cmd_stop() {
    echo -e "${YELLOW}[HeartFlow] 停止 daemon...${NC}"
    node "$DAEMON" stop
    echo -e "${GREEN}[HeartFlow] daemon 已停止${NC}"
}

cmd_status() {
    node "$DAEMON" status
}

cmd_health() {
    node "$DAEMON" health
}

cmd_cli() {
    # CLI 模式：直接加载引擎（调试用，每次重新初始化）
    echo -e "${YELLOW}[HeartFlow] CLI 模式（调试用）${NC}"
    node -e "
const { HeartFlow } = require('$ROOT/src/core/heartflow.js');
const hf = new HeartFlow({ rootPath: '$ROOT' });
const t = Date.now();
hf.start();
console.log('启动耗时:', Date.now() - t, 'ms');
hf.healthCheck().then(h => {
    console.log('状态:', h.started ? '✓ 就绪' : '✗ 失败');
    console.log('Session:', h.sessionId);
    hf.stop();
    process.exit(0);
}).catch(e => { console.error('错误:', e.message); process.exit(1); });
"
}

cmd_restart() {
    cmd_stop 2>/dev/null || true
    sleep 0.5
    cmd_start
}

# 主逻辑
case "${1:-start}" in
    start)   cmd_start ;;
    stop)    cmd_stop ;;
    status)  cmd_status ;;
    health)  cmd_health ;;
    restart) cmd_restart ;;
    cli)     cmd_cli ;;
    *)
        echo "用法: $0 {start|stop|status|health|restart|cli}"
        echo ""
        echo "  start   启动 daemon（默认）— 引擎常驻内存"
        echo "  stop    停止 daemon"
        echo "  status  查看 daemon 状态"
        echo "  health  健康检查"
        echo "  restart 重启"
        echo "  cli     CLI 模式（每次重新初始化，调试用）"
        exit 1
        ;;
esac
