/**
 * health.ts — HeartFlow 健康检查命令
 * @version v0.12.50
 *
 * 提供全面健康检查：
 *   - 存储引擎可用性
 *   - 关键文件和目录存在性
 *   - 内存和系统资源状态
 *   - 版本信息完整性
 */

import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

// ─── 类型定义 ───────────────────────────────────────────────────────────────

export type HealthStatus = 'ok' | 'warn' | 'fail' | 'skip';

export interface HealthItem {
  name: string;
  status: HealthStatus;
  message: string;
  details?: Record<string, any>;
}

export interface HealthReport {
  timestamp: string;
  hostname: string;
  uptime: string;
  overall: HealthStatus;
  items: HealthItem[];
  summary: {
    ok: number;
    warn: number;
    fail: number;
    skip: number;
  };
}

// ─── 工具函数 ──────────────────────────────────────────────────────────────

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${Math.floor(seconds)}s`;
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m ${Math.floor(seconds % 60)}s`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${m % 60}m`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h`;
}

// ─── 健康检查项 ─────────────────────────────────────────────────────────────

function checkStorageEngine(): HealthItem {
  const name = 'Storage Engine';
  try {
    const storage = require('../../storage').createStorageEngine();
    if (!storage) {
      return { name, status: 'fail', message: 'Storage engine not initialized' };
    }
    return {
      name,
      status: 'ok',
      message: 'Storage engine available',
      details: {
        hasCheckpoint: !!storage.checkpoint,
        hasVector: !!storage.vector,
      },
    };
  } catch (e: any) {
    return { name, status: 'fail', message: `Failed to load storage: ${e.message}` };
  }
}

function checkMemoryTiers(): HealthItem {
  const name = 'Memory Tiers';
  const dataDir = path.join(process.cwd(), 'data/memory');
  const tiers = ['hot', 'warm', 'cold'];
  const found: string[] = [];
  const missing: string[] = [];

  for (const tier of tiers) {
    const filePath = path.join(dataDir, `${tier}.json`);
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(content);
        found.push(`${tier}(${Array.isArray(data) ? data.length : 'invalid'})`);
      } catch {
        found.push(`${tier}(read-error)`);
      }
    } else {
      missing.push(tier);
    }
  }

  if (missing.length > 0) {
    return {
      name,
      status: 'warn',
      message: `Missing tier files: ${missing.join(', ')}`,
      details: { found, missing },
    };
  }
  return {
    name,
    status: 'ok',
    message: `All tiers present: ${found.join(', ')}`,
    details: { found },
  };
}

function checkCheckpointEngine(): HealthItem {
  const name = 'Checkpoint Engine';
  try {
    const storage = require('../../storage').createStorageEngine();
    if (!storage?.checkpoint) {
      return { name, status: 'fail', message: 'Checkpoint engine not available' };
    }
    const stats = storage.checkpoint.getStats();
    const list = storage.checkpoint.list();
    return {
      name,
      status: 'ok',
      message: `Snapshots: ${stats.totalSnapshots}, MaxKeep: ${stats.maxKeep}`,
      details: {
        totalSnapshots: stats.totalSnapshots,
        maxKeep: stats.maxKeep,
        lastSavedAt: stats.lastSavedAt ?? 'never',
        dir: stats.dir,
      },
    };
  } catch (e: any) {
    return { name, status: 'fail', message: `Checkpoint error: ${e.message}` };
  }
}

function checkVectorStore(): HealthItem {
  const name = 'Vector Store';
  try {
    const storage = require('../../storage').createStorageEngine();
    if (!storage?.vector) {
      return { name, status: 'fail', message: 'Vector store not available' };
    }
    const size = storage.vector.size();
    return {
      name,
      status: 'ok',
      message: `Vectors: ${size}`,
      details: {
        vectors: size,
        persistPath: storage.vector.persistPath ?? 'in-memory',
      },
    };
  } catch (e: any) {
    return { name, status: 'fail', message: `Vector store error: ${e.message}` };
  }
}

function checkSystemResources(): HealthItem {
  const name = 'System Resources';
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedPercent = Math.round(((totalMem - freeMem) / totalMem) * 100);
  const loadavg = os.loadavg();

  let status: HealthStatus = 'ok';
  if (usedPercent > 90) status = 'fail';
  else if (usedPercent > 75) status = 'warn';

  const memUsedMB = Math.round((totalMem - freeMem) / 1024 / 1024);
  const memTotalMB = Math.round(totalMem / 1024 / 1024);

  return {
    name,
    status,
    message: `Memory: ${memUsedMB}/${memTotalMB} MB (${usedPercent}%) | Load: ${loadavg.map(l => l.toFixed(2)).join(', ')}`,
    details: {
      memoryUsedPercent: usedPercent,
      memoryUsedMB: memUsedMB,
      memoryTotalMB: memTotalMB,
      loadavg,
    },
  };
}

function checkCriticalFiles(): HealthItem {
  const name = 'Critical Files';
  const rootPath = path.join(os.homedir(), '.hermes', 'heartflow');
  const criticalPaths = [
    { path: 'VERSION', desc: 'Version file' },
    { path: 'package.json', desc: 'Package manifest' },
    { path: 'src/core/heartflow.js', desc: 'Core engine' },
    { path: 'HEARTCORE/heartbeat.js', desc: 'Heartbeat script' },
  ];

  const found: string[] = [];
  const missing: string[] = [];

  for (const cp of criticalPaths) {
    const fullPath = path.join(rootPath, cp.path);
    if (fs.existsSync(fullPath)) {
      found.push(cp.desc);
    } else {
      missing.push(cp.desc);
    }
  }

  if (missing.length > 0) {
    return {
      name,
      status: 'fail',
      message: `Missing: ${missing.join(', ')}`,
      details: { found, missing },
    };
  }
  return {
    name,
    status: 'ok',
    message: `All critical files present (${found.length})`,
    details: { found },
  };
}

function checkNodeModules(): HealthItem {
  const name = 'Dependencies';
  const nodeModulesPath = path.join(process.cwd(), 'node_modules');
  const pkgPath = path.join(process.cwd(), 'package.json');

  if (!fs.existsSync(nodeModulesPath)) {
    return {
      name,
      status: 'fail',
      message: 'node_modules not found — run npm install',
    };
  }

  if (!fs.existsSync(pkgPath)) {
    return {
      name,
      status: 'fail',
      message: 'package.json not found',
    };
  }

  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const depCount = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).length;
    return {
      name,
      status: 'ok',
      message: `${depCount} dependencies installed`,
      details: { depCount },
    };
  } catch (e: any) {
    return { name, status: 'fail', message: `package.json parse error: ${e.message}` };
  }
}

function checkVersion(): HealthItem {
  const name = 'Version Info';
  const rootPath = path.join(os.homedir(), '.hermes', 'heartflow');
  const versionFile = path.join(rootPath, 'VERSION');
  const pkgFile = path.join(rootPath, 'package.json');

  let version = 'unknown';
  let source = 'unknown';

  if (fs.existsSync(versionFile)) {
    version = fs.readFileSync(versionFile, 'utf8').trim();
    source = 'VERSION file';
  }
  if (fs.existsSync(pkgFile)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf8'));
      version = pkg.version ?? version;
      source = 'package.json';
    } catch { /* ignore */ }
  }

  return {
    name,
    status: 'ok',
    message: `v${version} (${source})`,
    details: { version, source },
  };
}

// ─── 主采集函数 ──────────────────────────────────────────────────────────────

export function collectHealthReport(): HealthReport {
  const checks: HealthItem[] = [
    checkVersion(),
    checkSystemResources(),
    checkCriticalFiles(),
    checkNodeModules(),
    checkStorageEngine(),
    checkMemoryTiers(),
    checkCheckpointEngine(),
    checkVectorStore(),
  ];

  const summary = {
    ok: checks.filter(c => c.status === 'ok').length,
    warn: checks.filter(c => c.status === 'warn').length,
    fail: checks.filter(c => c.status === 'fail').length,
    skip: checks.filter(c => c.status === 'skip').length,
  };

  let overall: HealthStatus = 'ok';
  if (summary.fail > 0) overall = 'fail';
  else if (summary.warn > 0) overall = 'warn';

  return {
    timestamp: new Date().toISOString(),
    hostname: os.hostname(),
    uptime: formatUptime(os.uptime()),
    overall,
    items: checks,
    summary,
  };
}

// ─── 渲染输出 ────────────────────────────────────────────────────────────────

const STATUS_SYMBOLS: Record<HealthStatus, string> = {
  ok:   '✓',
  warn: '⚠',
  fail: '✗',
  skip: '○',
};

const STATUS_COLORS: Record<HealthStatus, string> = {
  ok:   '\x1b[32m',   // green
  warn: '\x1b[33m',   // yellow
  fail: '\x1b[31m',   // red
  skip: '\x1b[90m',   // gray
};

const RESET = '\x1b[0m';

export function renderHealthReport(report: HealthReport): string {
  const lines: string[] = [];
  const overallSym = STATUS_SYMBOLS[report.overall];
  const overallColor = STATUS_COLORS[report.overall];

  lines.push('');
  lines.push('┌──────────────────────────────────────────────────────────────┐');
  lines.push('│                   HeartFlow Health Check                      │');
  lines.push('└──────────────────────────────────────────────────────────────┘');
  lines.push(`  Host:     ${report.hostname}`);
  lines.push(`  Uptime:   ${report.uptime}`);
  lines.push(`  Time:     ${report.timestamp}`);
  lines.push('');
  lines.push(`  Overall:  ${overallColor}${overallSym} ${report.overall.toUpperCase()}${RESET}`);
  lines.push(`             ok=${report.summary.ok}  warn=${report.summary.warn}  fail=${report.summary.fail}  skip=${report.summary.skip}`);
  lines.push('');
  lines.push('  ── Details ────────────────────────────────────────────────────');

  for (const item of report.items) {
    const sym = STATUS_SYMBOLS[item.status];
    const color = STATUS_COLORS[item.status];
    lines.push(`  ${color}${sym}${RESET} ${item.name}: ${item.message}`);
  }

  lines.push('');
  lines.push('───────────────────────────────────────────────────────────────');
  lines.push('');

  return lines.join('\n');
}

// ─── CLI 入口 ────────────────────────────────────────────────────────────────

export async function runHealthCheck(): Promise<number> {
  const report = collectHealthReport();
  console.log(renderHealthReport(report));

  if (report.overall === 'fail') {
    console.log('Health check FAILED. Please fix the issues above.');
    return 1;
  } else if (report.overall === 'warn') {
    console.log('Health check passed with warnings.');
    return 0;
  }
  console.log('Health check passed.');
  return 0;
}

// 直接运行时执行检查
runHealthCheck().then(code => process.exit(code)).catch(e => {
  console.error('Health check error:', e);
  process.exit(1);
});
