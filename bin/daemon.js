#!/usr/bin/env node
/**
 * HeartFlow Daemon Manager
 *
 * 提供进程守护功能：
 *   node bin/daemon.js start    — 后台常驻（PM2 > nohup）
 *   node bin/daemon.js stop     — 停止守护进程
 *   node bin/daemon.js status   — 查看运行状态
 *   node bin/daemon.js restart  — 重启
 *
 * 优先使用 PM2，回退到 nohup + PID 文件。
 * 全球用户运行 `node bin/daemon.js start` 即可常驻。
 */

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

const HF_DIR = path.join(__dirname, '..');
const PID_FILE = path.join(HF_DIR, 'data', 'heartflow.pid');
const LOG_DIR = path.join(HF_DIR, 'data', 'logs');

// ─── PM2 支持 ──────────────────────────────────────────────────────────────

let pm2Available = false;
let pm2 = null;

try {
  pm2 = require('pm2');
  pm2Available = true;
} catch (_) {
  pm2Available = false;
}

// ─── PID 管理（nohup fallback） ────────────────────────────────────────────

function ensureDirs() {
  fs.mkdirSync(LOG_DIR, { recursive: true });
  fs.mkdirSync(path.join(HF_DIR, 'data'), { recursive: true });
}

function readPid() {
  try {
    const pid = parseInt(fs.readFileSync(PID_FILE, 'utf-8').trim(), 10);
    return isNaN(pid) ? null : pid;
  } catch (_) { return null; }
}

function writePid(pid) {
  ensureDirs();
  fs.writeFileSync(PID_FILE, String(pid));
}

function removePid() {
  try { fs.unlinkSync(PID_FILE); } catch (_) {}
}

function isProcessAlive(pid) {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (_) { return false; }
}

function getProcessInfo(pid) {
  if (!isProcessAlive(pid)) return null;
  try {
    const cmdLine = fs.readFileSync(`/proc/${pid}/cmdline`, 'utf-8').replace(/\0/g, ' ').trim();
    const stat = fs.readFileSync(`/proc/${pid}/stat`, 'utf-8').split(' ');
    const startTime = parseInt(stat[21], 10) * 1000; // jiffies → ms
    const uptimeSec = Math.floor((Date.now() / 1000 - startTime / 1000));
    return { pid, cmdLine, uptime: uptimeSec };
  } catch (_) { return { pid, uptime: 'unknown' }; }
}

// ─── PM2 实现 ──────────────────────────────────────────────────────────────

const ECOSYSTEM_PATH = path.join(HF_DIR, 'ecosystem.config.js');

function ensureEcosystemConfig() {
  if (fs.existsSync(ECOSYSTEM_PATH)) return;

  fs.writeFileSync(ECOSYSTEM_PATH, `module.exports = {
  apps: [{
    name: 'heartflow-mcp',
    script: path.join(__dirname, 'mcp', 'mcp-server-http.js'),
    args: '--port 8099',
    cwd: __dirname,
    instances: 1,
    autorestart: true,
    max_restarts: 10,
    restart_delay: 5000,
    max_memory_restart: '512M',
    env: { NODE_ENV: 'production' },
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: path.join(__dirname, 'data', 'logs', 'heartflow-error.log'),
    out_file: path.join(__dirname, 'data', 'logs', 'heartflow-out.log'),
  }]
};
`);
}

async function pm2Start() {
  ensureEcosystemConfig();
  return new Promise((resolve, reject) => {
    pm2.start(ECOSYSTEM_PATH, (err) => {
      if (err) return reject(err);
      pm2.list((err, list) => {
        if (err) return reject(err);
        const app = list.find(a => a.name === 'heartflow-mcp');
        if (!app) return reject(new Error('PM2 未找到 heartflow-mcp 进程'));
        resolve({ pid: app.pid, pm2Id: app.pm_id, status: app.status });
      });
    });
  });
}

async function pm2Stop() {
  return new Promise((resolve, reject) => {
    pm2.stop('heartflow-mcp', (err) => {
      if (err) return reject(err);
      pm2.delete('heartflow-mcp', (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  });
}

async function pm2Status() {
  return new Promise((resolve, reject) => {
    pm2.list((err, list) => {
      if (err) return reject(err);
      const app = list.find(a => a.name === 'heartflow-mcp');
      if (!app) return resolve(null);
      resolve({ pid: app.pid, pm2Id: app.pm_id, status: app.status, uptime: app.uptime });
    });
  });
}

// ─── Nohup fallback ─────────────────────────────────────────────────────────

async function nohupStart() {
  ensureDirs();
  const pid = readPid();
  if (isProcessAlive(pid)) {
    throw new Error(`进程已在运行 (PID: ${pid})`);
  }

  const serverPath = path.join(HF_DIR, 'mcp', 'mcp-server-http.js');
  const outLog = fs.openSync(path.join(LOG_DIR, 'heartflow-out.log'), 'a');
  const errLog = fs.openSync(path.join(LOG_DIR, 'heartflow-error.log'), 'a');

  // 检测可用端口，传给 mcp-server-http.js 避免竞态
  const net = require('net');
  let detectedPort = null;
  for (let p = 8099; p <= 8105; p++) {
    const ok = await new Promise((resolve) => {
      const s = net.createServer();
      const timer = setTimeout(() => { try { s.close(); } catch(_){} resolve(false); }, 200);
      s.once('error', () => { clearTimeout(timer); try { s.close(); } catch(_){} resolve(false); });
      s.listen(p, () => {
        clearTimeout(timer);
        s.close();
        s.once('close', () => resolve(true));
      });
    });
    if (ok) { detectedPort = p; break; }
  }
  if (!detectedPort) detectedPort = 8099; // last resort

  const child = spawn(process.execPath, [serverPath, '--port', String(detectedPort)], {
    detached: true,
    stdio: ['ignore', outLog, errLog],
    env: { ...process.env, NODE_ENV: 'production' },
  });

  child.unref();
  writePid(child.pid);

  // 等待进程真正启动
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const check = () => {
      attempts++;
      if (isProcessAlive(child.pid)) {
        resolve({ pid: child.pid, method: 'nohup', port: detectedPort });
      } else if (attempts > 10) {
        removePid();
        reject(new Error('进程启动后立即退出，查看日志: ' + path.join(LOG_DIR, 'heartflow-error.log')));
      } else {
        setTimeout(check, 500);
      }
    };
    setTimeout(check, 500);
  });
}

function nohupStop() {
  const pid = readPid();
  if (!pid || !isProcessAlive(pid)) {
    removePid();
    return;
  }
  process.kill(pid, 'SIGTERM');
  // 等待进程退出
  let attempts = 0;
  while (isProcessAlive(pid) && attempts < 20) {
    const { wait } = require('timers/promises');
    wait(500);
    attempts++;
  }
  if (isProcessAlive(pid)) {
    process.kill(pid, 'SIGKILL');
  }
  removePid();
}

// ─── 主命令 ────────────────────────────────────────────────────────────────

async function main() {
  const action = process.argv[2] || 'status';

  switch (action) {
    case 'start': {
      console.log(`[HeartFlow Daemon] 启动中... (${pm2Available ? 'PM2' : 'nohup'})`);

      try {
        let info;
        if (pm2Available) {
          info = await pm2Start();
        } else {
          info = await nohupStart();
        }

        console.log(`[HeartFlow Daemon] ✅ 已启动`);
        console.log(`  PID:     ${info.pid}`);
        console.log(`  方法:    ${info.method || 'pm2'}`);
        console.log(`  日志:    ${LOG_DIR}/`);
        console.log(`  管理:    node bin/daemon.js status`);
      } catch (err) {
        console.error(`[HeartFlow Daemon] ❌ ${err.message}`);
        process.exit(1);
      }
      break;
    }

    case 'stop': {
      console.log('[HeartFlow Daemon] 停止中...');
      try {
        if (pm2Available) {
          await pm2Stop();
        } else {
          nohupStop();
        }
        console.log('[HeartFlow Daemon] ✅ 已停止');
      } catch (err) {
        console.error(`[HeartFlow Daemon] ❌ ${err.message}`);
        process.exit(1);
      }
      break;
    }

    case 'restart': {
      console.log('[HeartFlow Daemon] 重启中...');
      try {
        if (pm2Available) {
          await pm2.restart('heartflow-mcp');
        } else {
          nohupStop();
          await new Promise(r => setTimeout(r, 1000));
          await nohupStart();
        }
        console.log('[HeartFlow Daemon] ✅ 已重启');
      } catch (err) {
        console.error(`[HeartFlow Daemon] ❌ ${err.message}`);
        process.exit(1);
      }
      break;
    }

    case 'status': {
      let info = null;
      if (pm2Available) {
        info = await pm2Status();
      }
      if (!info) {
        const pid = readPid();
        info = getProcessInfo(pid);
      }

      if (!info) {
        console.log('[HeartFlow Daemon] 未运行');
        console.log('  启动: node bin/daemon.js start');
        process.exit(0);
      }

      console.log('[HeartFlow Daemon] 运行中');
      console.log(`  PID:    ${info.pid}`);
      console.log(`  状态:   ${info.status || 'running'}`);
      if (info.uptime) {
        const h = Math.floor(info.uptime / 3600);
        const m = Math.floor((info.uptime % 3600) / 60);
        console.log(`  运行:   ${h > 0 ? `${h}h ` : ''}${m}m`);
      }
      console.log(`  日志:   ${LOG_DIR}/`);
      console.log(`  管理:   node bin/daemon.js stop | restart`);
      break;
    }

    default:
      console.log(`HeartFlow Daemon Manager
Usage: node bin/daemon.js <command>
Commands:
  start     启动后台守护进程 (PM2 > nohup)
  stop      停止守护进程
  restart   重启
  status    查看运行状态

示例:
  node bin/daemon.js start    # 首次启动
  node bin/daemon.js status   # 检查状态
  node bin/daemon.js restart  # 更新代码后重启`);
      process.exit(1);
  }
}

main().catch(err => {
  console.error(`[HeartFlow Daemon] 错误:`, err.message);
  process.exit(1);
});
