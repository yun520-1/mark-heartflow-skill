/**
 * engines.ts — HeartFlow 引擎面板
 * @version v0.12.50
 *
 * 提供引擎状态查询接口：
 *   - 记忆引擎 (Memory Engine)
 *   - 检查点引擎 (Checkpoint Engine)
 *   - 向量存储引擎 (Vector Store Engine)
 *   - 核心引擎 (Core Engine)
 *
 * 支持 --watch 实时监控模式（每 3 秒刷新一次）
 */

import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

// 动态加载 storage 模块（避免循环依赖）
let _storage: any = null;
function getStorage() {
  if (!_storage) {
    try {
      _storage = require('../../storage').createStorageEngine();
    } catch (e) {
      _storage = null;
    }
  }
  return _storage;
}

export interface EngineStatus {
  name: string;
  status: 'online' | 'offline' | 'error' | 'unknown';
  details: Record<string, any>;
  uptime?: string;       // 运行时长（如 "2h 34m"）
  memoryMB?: number;     // 内存占用 MB
  lastActivity?: string; // ISO 时间
}

export interface PanelSnapshot {
  timestamp: string;
  hostname: string;
  platform: string;
  uptime: string;
  loadavg: number[];
  memory: { total: number; free: number; used: number; usedPercent: number };
  engines: EngineStatus[];
  totalMemoryMB: number;
}

/** 格式化字节为 MB */
function toMB(bytes: number): number {
  return Math.round((bytes / 1024 / 1024) * 100) / 100;
}

/** 格式化秒为人类可读时长 */
function formatUptime(seconds: number): string {
  if (seconds < 60) return `${Math.floor(seconds)}s`;
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m ${Math.floor(seconds % 60)}s`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${m % 60}m`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h`;
}

// ─── 引擎状态采集器 ───────────────────────────────────────────────────────

function getMemoryEngineStatus(): EngineStatus {
  const name = 'Memory Engine';
  try {
    const storage = getStorage();
    if (!storage) {
      return { name, status: 'offline', details: { reason: 'storage not initialized' } };
    }
    const stats = storage.checkpoint.getStats();
    return {
      name,
      status: 'online',
      details: {
        totalSnapshots: stats.totalSnapshots,
        maxKeep: stats.maxKeep,
        checkpointDir: stats.dir,
        lastSavedAt: stats.lastSavedAt ?? 'never',
      },
      lastActivity: stats.lastSavedAt ?? undefined,
    };
  } catch (e: any) {
    return { name, status: 'error', details: { error: e.message } };
  }
}

function getCheckpointEngineStatus(): EngineStatus {
  const name = 'Checkpoint Engine';
  try {
    const storage = getStorage();
    if (!storage) {
      return { name, status: 'offline', details: { reason: 'storage not initialized' } };
    }
    const stats = storage.checkpoint.getStats();
    const list = storage.checkpoint.list();
    return {
      name,
      status: 'online',
      details: {
        snapshots: stats.totalSnapshots,
        maxKeep: stats.maxKeep,
        dir: stats.dir,
        latestSnapshot: list.success && list.snapshots.length > 0
          ? list.snapshots[0].savedAt
          : 'none',
      },
      lastActivity: stats.lastSavedAt ?? undefined,
    };
  } catch (e: any) {
    return { name, status: 'error', details: { error: e.message } };
  }
}

function getVectorStoreEngineStatus(): EngineStatus {
  const name = 'Vector Store Engine';
  try {
    const storage = getStorage();
    if (!storage) {
      return { name, status: 'offline', details: { reason: 'storage not initialized' } };
    }
    const size = storage.vector.size();
    return {
      name,
      status: 'online',
      details: {
        vectors: size,
        persistPath: storage.vector.persistPath ?? 'in-memory',
      },
    };
  } catch (e: any) {
    return { name, status: 'error', details: { error: e.message } };
  }
}

function getCoreEngineStatus(): EngineStatus {
  const name = 'Core Engine';
  try {
    const rootPath = path.join(os.homedir(), '.hermes', 'heartflow');
    const versionFile = path.join(rootPath, 'VERSION');
    const pkgFile = path.join(rootPath, 'package.json');
    let version = 'unknown';
    let state = 'unknown';

    if (fs.existsSync(versionFile)) {
      version = fs.readFileSync(versionFile, 'utf8').trim();
    }
    if (fs.existsSync(pkgFile)) {
      const pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf8'));
      version = pkg.version ?? version;
    }

    // 尝试读取心跳状态
    const heartbeatFile = path.join(rootPath, '.heartbeat');
    if (fs.existsSync(heartbeatFile)) {
      try {
        const hb = JSON.parse(fs.readFileSync(heartbeatFile, 'utf8'));
        state = hb.status ?? state;
      } catch { /* ignore */ }
    }

    return {
      name,
      status: state === 'alive' ? 'online' : 'unknown',
      details: { version, rootPath, state },
    };
  } catch (e: any) {
    return { name, status: 'error', details: { error: e.message } };
  }
}

// ─── 主采集函数 ───────────────────────────────────────────────────────────

export function collectPanelSnapshot(): PanelSnapshot {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;

  const engines: EngineStatus[] = [
    getCoreEngineStatus(),
    getMemoryEngineStatus(),
    getCheckpointEngineStatus(),
    getVectorStoreEngineStatus(),
  ];

  const engineMemMB = engines.reduce((sum, e) => sum + (e.memoryMB ?? 0), 0);

  return {
    timestamp: new Date().toISOString(),
    hostname: os.hostname(),
    platform: `${os.platform()} ${os.arch()} (${os.release()})`,
    uptime: formatUptime(os.uptime()),
    loadavg: os.loadavg(),
    memory: {
      total: Math.round(totalMem / 1024 / 1024),
      free: Math.round(freeMem / 1024 / 1024),
      used: Math.round(usedMem / 1024 / 1024),
      usedPercent: Math.round((usedMem / totalMem) * 100),
    },
    engines,
    totalMemoryMB: toMB(usedMem + engineMemMB * 1024 * 1024),
  };
}

// ─── 表格渲染 ─────────────────────────────────────────────────────────────

const STATUS_SYMBOLS: Record<string, string> = {
  online:  '🟢',
  offline: '⚪',
  error:   '🔴',
  unknown: '🟡',
};

export function renderPanelTable(snapshot: PanelSnapshot): string {
  const lines: string[] = [];

  lines.push('');
  lines.push('┌──────────────────────────────────────────────────────────────┐');
  lines.push('│                   HeartFlow Engine Panel                     │');
  lines.push('└──────────────────────────────────────────────────────────────┘');
  lines.push(`  Host:     ${snapshot.hostname}`);
  lines.push(`  Platform: ${snapshot.platform}`);
  lines.push(`  Uptime:   ${snapshot.uptime}  |  Load: ${snapshot.loadavg.map(l => l.toFixed(2)).join(', ')}`);
  lines.push(`  Time:     ${snapshot.timestamp}`);
  lines.push('');
  lines.push('  Memory:');
  lines.push(`    Total:   ${snapshot.memory.total} MB`);
  lines.push(`    Used:    ${snapshot.memory.used} MB (${snapshot.memory.usedPercent}%)`);
  lines.push(`    Free:    ${snapshot.memory.free} MB`);
  lines.push('');
  lines.push('  ┌─────────────────────┬────────┬─────────────────────────────┐');
  lines.push('  │ Engine               │ Status │ Details                     │');
  lines.push('  ├─────────────────────┼────────┼─────────────────────────────┤');

  for (const eng of snapshot.engines) {
    const sym = STATUS_SYMBOLS[eng.status] ?? '⚪';
    const detailsStr = Object.entries(eng.details)
      .map(([k, v]) => `${k}=${v}`)
      .join(', ');
    const truncated = detailsStr.length > 35 ? detailsStr.slice(0, 32) + '...' : detailsStr;
    lines.push(
      `  │ ${eng.name.padEnd(19)} │ ${sym} ${eng.status.padEnd(4)} │ ${truncated.padEnd(27)} │`
    );
  }

  lines.push('  └─────────────────────┴────────┴─────────────────────────────┘');
  lines.push('');

  return lines.join('\n');
}

// ─── Watch 模式 ────────────────────────────────────────────────────────────

export async function watchPanel(intervalMs = 3000, onUpdate?: (snap: PanelSnapshot) => void): Promise<() => void> {
  let running = true;

  async function loop() {
    while (running) {
      const snap = collectPanelSnapshot();

      // 清屏重绘
      process.stdout.write('\x1b[2J\x1b[H');
      process.stdout.write(renderPanelTable(snap));

      if (onUpdate) onUpdate(snap);

      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }

  loop().catch(console.error);

  // 返回停止函数
  return () => { running = false; };
}
