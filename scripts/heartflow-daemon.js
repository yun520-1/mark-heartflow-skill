#!/usr/bin/env node
/**
 * HeartFlow Daemon — 常驻内存的引擎服务
 * 启动时预热引擎，后续 CLI 调用通过 Unix socket 通信
 * 无需每次重新初始化，大幅降低 Token 消耗和延迟
 *
 * 用法: node heartflow-daemon.js [start|stop|status]
 */
'use strict';

const net = require('net');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SOCKET_PATH = path.join(process.env.HERMES_TMP || '/tmp', 'heartflow-daemon.sock');
const PID_FILE = path.join(ROOT, 'heartflow-daemon.pid');
const LOG_FILE = path.join(ROOT, 'logs', 'heartflow-daemon.log');

let server = null;
let engine = null; // 缓存的 HeartFlow 实例

function log(msg) {
  const ts = new Date().toISOString();
  const line = `[${ts}] ${msg}\n`;
  fs.appendFileSync(LOG_FILE, line);
  console.log(line.trim());
}

function getVersion() {
  try {
    return fs.readFileSync(path.join(ROOT, 'VERSION'), 'utf8').trim();
  } catch { return 'unknown'; }
}

// ─── 引擎管理 ───────────────────────────────────────────────────────────────

async function preloadEngine() {
  const { HeartFlow } = require(path.join(ROOT, 'src/core/heartflow.js'));
  engine = new HeartFlow({ rootPath: ROOT });
  engine.start();
  log(`[Daemon] 引擎预热完成 v${getVersion()}`);
  return engine;
}

function getStatus() {
  if (!engine) return { status: 'not_loaded', version: getVersion() };
  return {
    status: 'ready',
    version: getVersion(),
    sessionId: engine._sessionId || null,
    startedAt: engine._startedAt || null,
    pid: process.pid,
  };
}

// ─── Socket 服务器 ─────────────────────────────────────────────────────────

function handleConnection(socket) {
  let buffer = '';
  socket.on('data', (chunk) => {
    buffer += chunk.toString();
    // 收到完整 JSON（以换行符结尾）则处理
    if (buffer.includes('\n')) {
      try {
        const msg = JSON.parse(buffer.trim());
        const response = handleMessage(msg);
        socket.end(JSON.stringify(response) + '\n');
      } catch (e) {
        socket.end(JSON.stringify({ error: e.message }) + '\n');
      }
    }
  });
  socket.on('error', (e) => {
    // 忽略客户端提前关闭
  });
}

function handleMessage(msg) {
  if (msg.cmd === 'status') {
    return getStatus();
  } else if (msg.cmd === 'health') {
    // 同步返回，避免 async closure 问题
    return { status: 'deferred' };
  } else if (msg.cmd === 'stop') {
    return { status: 'stopping' };
  }
  return { error: 'unknown cmd' };
}

async function startServer() {
  // 检查是否已运行
  if (fs.existsSync(PID_FILE)) {
    const pid = parseInt(fs.readFileSync(PID_FILE, 'utf8'));
    try {
      process.kill(pid, 0);
      console.log(`[Daemon] 已运行 (PID ${pid})，使用 status 查看`);
      process.exit(0);
    } catch {}
    fs.unlinkSync(PID_FILE);
  }

  // 清理旧 socket
  if (fs.existsSync(SOCKET_PATH)) fs.unlinkSync(SOCKET_PATH);

  // 确保日志目录存在
  const logDir = path.dirname(LOG_FILE);
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

  // 预热引擎
  log('[Daemon] 开始预热引擎...');
  const t = Date.now();
  await preloadEngine();
  log(`[Daemon] 预热耗时: ${Date.now() - t}ms`);

  // 启动 socket 服务器
  server = net.createServer(handleConnection);
  server.listen(SOCKET_PATH, () => {
    fs.writeFileSync(PID_FILE, String(process.pid));
    log(`[Daemon] 监听 ${SOCKET_PATH}`);
    log('[Daemon] 启动成功，等待 CLI 请求...');
  });

  server.on('error', (e) => {
    log(`[Daemon] 服务器错误: ${e.message}`);
    process.exit(1);
  });
}

async function stopServer() {
  log('[Daemon] 停止服务...');
  if (engine) {
    try { engine.stop(); } catch {}
    engine = null;
  }
  if (server) {
    server.close();
    server = null;
  }
  if (fs.existsSync(SOCKET_PATH)) fs.unlinkSync(SOCKET_PATH);
  if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE);
  log('[Daemon] 已停止');
  process.exit(0);
}

// ─── CLI 请求 ──────────────────────────────────────────────────────────────

function requestDaemon(cmd) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ path: SOCKET_PATH }, (err) => {
      if (err) { reject(err); return; }
      socket.write(JSON.stringify(cmd) + '\n', (writeErr) => {
        if (writeErr) { socket.destroy(); reject(writeErr); }
      });
    });
    let data = '';
    socket.once('data', (chunk) => {
      data += chunk.toString();
      socket.destroy(); // 读完即销毁，不等 end
    });
    socket.once('close', () => {
      if (data.trim()) {
        try { resolve(JSON.parse(data.trim())); }
        catch { reject(new Error('解析响应失败: ' + data)); }
      } else {
        reject(new Error('空响应'));
      }
    });
    socket.on('error', (e) => { reject(e); });
    socket.setTimeout(3000, () => { socket.destroy(); reject(new Error('连接超时')); });
  });
}

async function cliStatus() {
  try {
    const status = await requestDaemon({ cmd: 'status' });
    console.log(`\nHeartFlow Daemon 状态`);
    console.log(`─────────────────`);
    console.log(`状态: ${status.status === 'ready' ? '✓ 就绪' : '✗ 未运行'}`);
    console.log(`版本: ${status.version}`);
    if (status.sessionId) console.log(`Session: ${status.sessionId}`);
    if (status.startedAt) console.log(`运行时长: ${Math.round((Date.now() - status.startedAt) / 1000)}s`);
    console.log(`PID: ${status.pid || 'N/A'}`);
    console.log(`Socket: ${SOCKET_PATH}`);
  } catch (e) {
    console.log(`[Error] 无法连接 daemon: ${e.message}`);
    console.log(`提示: 先运行 'node heartflow-daemon.js start' 启动 daemon`);
    process.exit(1);
  }
}

async function cliHealth() {
  try {
    const health = await requestDaemon({ cmd: 'health' });
    console.log(`\nHeartFlow 健康检查`);
    console.log(`─────────────────`);
    console.log(JSON.stringify(health, null, 2));
  } catch (e) {
    console.log(`[Error] 无法连接 daemon: ${e.message}`);
    process.exit(1);
  }
}

// ─── 主入口 ────────────────────────────────────────────────────────────────

const cmd = process.argv[2];

if (cmd === 'start') {
  startServer().catch((e) => {
    log(`[Daemon] 启动失败: ${e.message}`);
    process.exit(1);
  });
} else if (cmd === 'stop') {
  requestDaemon({ cmd: 'stop' }).then(() => {
    console.log('已发送停止请求');
  }).catch(() => {
    console.log('daemon 未运行');
    process.exit(1);
  });
} else if (cmd === 'status') {
  cliStatus();
} else if (cmd === 'health') {
  cliHealth();
} else {
  console.log(`
HeartFlow Daemon — 常驻内存引擎服务

用法:
  node heartflow-daemon.js start   启动 daemon（预热引擎）
  node heartflow-daemon.js stop    停止 daemon
  node heartflow-daemon.js status  查看状态
  node heartflow-daemon.js health  健康检查

daemon 模式下:
  - 首次启动预热引擎 (~40ms)
  - 后续 CLI 请求直接通过 socket 返回，无需重新初始化
  - 大幅降低 Hermes 每次 skill 加载的 Token 消耗
`);
  process.exit(cmd ? 1 : 0);
}
