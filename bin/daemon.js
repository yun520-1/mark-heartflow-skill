#!/usr/bin/env node
/**
 * HeartFlow Daemon — 心虫常驻进程
 *
 * 启动后：
 *   - 加载 HeartFlow 引擎（一次性）
 *   - 监听 Unix socket /tmp/heartflow-daemon.sock
 *   - 通过 socket 接收 JSON 请求 {cmd: "bundle", text: "..."}
 *   - 返回 {status, psychology, judgment, inject}
 *   - 超时30秒无请求自动退出
 *
 * 用法:
 *   node daemon.js             # 前台运行
 *   node daemon.js &           # 后台运行
 *   node daemon.js --forever   # 不超时退出（生产用）
 */

const net = require('net');
const path = require('path');
const fs = require('fs');

const SOCKET_PATH = '/tmp/heartflow-daemon.sock';
const IDLE_TIMEOUT_MS = 30000; // 30秒无请求自动退出
const HF_DIR = path.dirname(__dirname);

// ── 延迟加载 HeartFlow 引擎 ──────────────────────────────────────────────
let hf = null;
let engineLoaded = false;

function loadEngine() {
    if (engineLoaded && hf) return hf;
    const { HeartFlow } = require(path.join(HF_DIR, 'src', 'core', 'heartflow.js'));
    hf = new HeartFlow({ rootPath: HF_DIR });
    hf.start();
    engineLoaded = true;
    return hf;
}

function getVersion() {
    try {
        const vFile = path.join(HF_DIR, 'VERSION');
        return fs.readFileSync(vFile, 'utf8').trim();
    } catch(e) {
        return 'unknown';
    }
}

function getMemoryInject() {
    try {
        const injectPath = path.join(HF_DIR, 'scripts', 'heartflow-memory-inject.js');
        if (fs.existsSync(injectPath)) {
            const result = require('child_process').execFileSync('node', [injectPath], {
                cwd: HF_DIR, timeout: 8000, encoding: 'utf8', maxBuffer: 10240
            });
            return result.trim();
        }
    } catch(e) {}
    return '';
}

// ── 请求处理 ──────────────────────────────────────────────────────────────

function handleRequest(reqJson) {
    const response = { status: 'error', error: 'unknown' };

    try {
        const req = typeof reqJson === 'string' ? JSON.parse(reqJson) : reqJson;

        if (req.cmd === 'bundle') {
            const hf = loadEngine();
            const text = (req.text || '').trim();
            const version = getVersion();

            // status
            let statusData = {};
            try {
                const stats = hf.dispatch('identityCore.getMemoryStats');
                statusData = stats || { loaded: Object.keys(hf._modules || {}).length };
            } catch(e) {
                statusData = { error: e.message, loaded: Object.keys(hf._modules || {}).length };
            }

            // psychology
            let psychology = {};
            if (text) {
                try {
                    psychology = hf.dispatch('psychology.analyzePsychology', text) || {};
                } catch(e) {
                    psychology = { error: e.message };
                }
            }

            // judgment
            let judgment = {};
            if (text) {
                try {
                    judgment = hf.dispatch('truth.checkStatement', text) || {};
                } catch(e) {
                    judgment = { error: e.message };
                }
            }

            // inject
            const inject = getMemoryInject();

            response.status = 'ok';
            response.psychology = psychology;
            response.judgment = { judgment, decision: { shouldRespond: true } };
            response.inject = inject;
            response.version = version;
        } else if (req.cmd === 'ping') {
            response.status = 'ok';
            response.pong = true;
            response.version = getVersion();
        } else if (req.cmd === 'status') {
            response.status = 'ok';
            response.version = getVersion();
            response.engineLoaded = engineLoaded;
        } else if (req.cmd === 'shutdown') {
            response.status = 'ok';
            response.message = 'shutting_down';
            // 安排关闭
            setTimeout(() => process.exit(0), 100);
        } else {
            response.error = `unknown command: ${req.cmd}`;
        }
    } catch(e) {
        response.error = e.message;
    }

    return response;
}

// ── Socket 服务器 ─────────────────────────────────────────────────────────

function startDaemon() {
    // 清理旧 socket 文件
    try {
        fs.unlinkSync(SOCKET_PATH);
    } catch(e) {
        // 文件不存在则忽略
    }

    const server = net.createServer((socket) => {
        // 有请求到达时重置超时定时器
        resetIdleTimer(server);

        let buffer = '';

        socket.on('data', (data) => {
            buffer += data.toString('utf8');
            // 尝试解析完整 JSON（可能分多次到达）
            try {
                const req = JSON.parse(buffer);
                buffer = ''; // 清空缓冲区

                const response = handleRequest(req);
                socket.write(JSON.stringify(response) + '\n');

                // 处理完成后重置超时
                resetIdleTimer(server);
            } catch(e) {
                // JSON 不完整，继续等待更多数据
                if (e instanceof SyntaxError) {
                    // 如果 buffer 太长但仍然不是合法 JSON，清空并报错
                    if (buffer.length > 65536) {
                        socket.write(JSON.stringify({ status: 'error', error: 'request too large or malformed' }) + '\n');
                        buffer = '';
                    }
                } else {
                    socket.write(JSON.stringify({ status: 'error', error: e.message }) + '\n');
                    buffer = '';
                }
            }
        });

        socket.on('error', (err) => {
            // socket 错误不终止 daemon
            console.error('[HeartFlow Daemon] Socket error:', err.message);
        });

        socket.on('end', () => {
            resetIdleTimer(server);
        });
    });

    server.listen(SOCKET_PATH, () => {
        // 设置 socket 文件权限为 666，允许所有用户访问
        try {
            fs.chmodSync(SOCKET_PATH, 0o666);
        } catch(e) {}
        console.error(`[HeartFlow Daemon] 已启动，监听: ${SOCKET_PATH}`);
        console.error(`[HeartFlow Daemon] 版本: ${getVersion()}`);
        console.error(`[HeartFlow Daemon] 超时: ${IDLE_TIMEOUT_MS/1000}秒无请求自动退出`);
    });

    server.on('error', (err) => {
        console.error('[HeartFlow Daemon] Server error:', err.message);
        process.exit(1);
    });

    // 启动空闲超时定时器
    resetIdleTimer(server);
    
    // 初始状态：引擎已加载（heartflow.js 构造时就启动了）
    // 打印初始化完成
    console.error(`[HeartFlow Daemon] 引擎就绪`);
    return server;
}

let idleTimer = null;

function resetIdleTimer(server) {
    if (idleTimer) {
        clearTimeout(idleTimer);
        idleTimer = null;
    }

    // 如果是 --forever 模式，不设置超时
    if (process.argv.includes('--forever')) {
        return;
    }

    idleTimer = setTimeout(() => {
        console.error('[HeartFlow Daemon] 空闲超时，自动退出');
        try {
            server.close();
        } catch(e) {}
        process.exit(0);
    }, IDLE_TIMEOUT_MS);
}

// ── 启动 ──────────────────────────────────────────────────────────────────

if (require.main === module) {
    const server = startDaemon();

    // 优雅退出
    process.on('SIGINT', () => {
        console.error('\n[HeartFlow Daemon] 收到 SIGINT，退出');
        try { fs.unlinkSync(SOCKET_PATH); } catch(e) {}
        process.exit(0);
    });

    process.on('SIGTERM', () => {
        console.error('[HeartFlow Daemon] 收到 SIGTERM，退出');
        try { fs.unlinkSync(SOCKET_PATH); } catch(e) {}
        process.exit(0);
    });
}

module.exports = { startDaemon, handleRequest, SOCKET_PATH };
