"use strict";
/**
 * status.ts — HeartFlow 状态查询命令
 * @version v0.12.50
 *
 * 用法:
 *   heartflow status           # 显示完整状态面板
 *   heartflow status --watch   # 实时监控模式（3秒刷新）
 *   heartflow status --json    # JSON 格式输出
 *   heartflow status --engine  # 只显示引擎状态
 *   heartflow status --system  # 只显示系统信息
 *
 * 依赖 engines.ts 的采集器和渲染器
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.runStatus = runStatus;
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const fs = __importStar(require("fs"));
const engines_1 = require("./engines");
// ─── 版本 / 信息采集 ─────────────────────────────────────────────────────
function getHeartFlowInfo() {
    const root = path.join(os.homedir(), '.hermes', 'heartflow');
    const versionFile = path.join(root, 'VERSION');
    const pkgFile = path.join(root, 'package.json');
    let version = 'unknown';
    let lastUpgrade = 'unknown';
    try {
        if (fs.existsSync(pkgFile)) {
            const pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf8'));
            version = pkg.version ?? version;
        }
        else if (fs.existsSync(versionFile)) {
            version = fs.readFileSync(versionFile, 'utf8').trim();
        }
    }
    catch { /* ignore */ }
    try {
        const upgradeReport = path.join(root, 'docs', 'UPGRADE_REPORT_latest.json');
        if (fs.existsSync(upgradeReport)) {
            const report = JSON.parse(fs.readFileSync(upgradeReport, 'utf8'));
            lastUpgrade = report.timestamp ?? lastUpgrade;
        }
    }
    catch { /* ignore */ }
    return { version, root, lastUpgrade };
}
// ─── 系统信息 ─────────────────────────────────────────────────────────────
function getSystemInfo() {
    return {
        hostname: os.hostname(),
        platform: `${os.platform()} ${os.arch()} (${os.release()})`,
        uptime: os.uptime(),
        loadavg: os.loadavg(),
        memory: {
            total: os.totalmem(),
            free: os.freemem(),
            used: os.totalmem() - os.freemem(),
            usedPercent: Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100),
        },
        cpuCount: os.cpus().length,
        cpuModel: os.cpus()[0]?.model ?? 'unknown',
        homedir: os.homedir(),
    };
}
// ─── 检查点信息 ───────────────────────────────────────────────────────────
function getCheckpointInfo() {
    try {
        const { createStorageEngine } = require('../../storage');
        const storage = createStorageEngine();
        const stats = storage.checkpoint.getStats();
        const list = storage.checkpoint.list();
        return {
            totalSnapshots: stats.totalSnapshots,
            maxKeep: stats.maxKeep,
            lastSavedAt: stats.lastSavedAt ?? null,
            latestSnapshot: list.success && list.snapshots[0]
                ? { id: list.snapshots[0].id, savedAt: list.snapshots[0].savedAt, label: list.snapshots[0].label }
                : null,
            dir: stats.dir,
        };
    }
    catch (e) {
        return { error: e.message };
    }
}
// ─── 向量存储信息 ─────────────────────────────────────────────────────────
function getVectorStoreInfo() {
    try {
        const { createStorageEngine } = require('../../storage');
        const storage = createStorageEngine();
        return {
            vectors: storage.vector.size(),
            persistPath: storage.vector.persistPath ?? 'in-memory',
        };
    }
    catch (e) {
        return { error: e.message };
    }
}
// ─── JSON 模式 ─────────────────────────────────────────────────────────────
function renderJSON(snapshot, systemInfo) {
    const info = getHeartFlowInfo();
    const checkpoint = getCheckpointInfo();
    const vector = getVectorStoreInfo();
    const output = {
        heartflow: {
            version: info.version,
            root: info.root,
            lastUpgrade: info.lastUpgrade,
        },
        system: {
            hostname: systemInfo.hostname,
            platform: systemInfo.platform,
            uptime: systemInfo.uptime,
            loadavg: systemInfo.loadavg,
            memory: systemInfo.memory,
            cpuCount: systemInfo.cpuCount,
            cpuModel: systemInfo.cpuModel,
        },
        checkpoint,
        vector,
        engines: snapshot.engines.map(e => ({
            name: e.name,
            status: e.status,
            details: e.details,
            uptime: e.uptime,
            memoryMB: e.memoryMB,
            lastActivity: e.lastActivity,
        })),
        panelTimestamp: snapshot.timestamp,
    };
    return JSON.stringify(output, null, 2);
}
// ─── 精简模式（纯引擎状态）──────────────────────────────────────────────
function renderEnginesOnly(snapshot) {
    const lines = [];
    lines.push('');
    for (const eng of snapshot.engines) {
        const statusIcon = eng.status === 'online' ? '✓' : eng.status === 'error' ? '✗' : '?';
        lines.push(`  ${statusIcon} ${eng.name}: ${eng.status}`);
        for (const [k, v] of Object.entries(eng.details)) {
            lines.push(`      ${k} = ${v}`);
        }
    }
    lines.push('');
    return lines.join('\n');
}
// ─── 系统信息模式 ────────────────────────────────────────────────────────
function renderSystemOnly(systemInfo) {
    const lines = [];
    const fmtMB = (b) => `${Math.round(b / 1024 / 1024)} MB`;
    lines.push('');
    lines.push('┌─────────────────────────────────────┐');
    lines.push('│       HeartFlow System Info          │');
    lines.push('└─────────────────────────────────────┘');
    lines.push(`  Hostname:   ${systemInfo.hostname}`);
    lines.push(`  Platform:   ${systemInfo.platform}`);
    lines.push(`  CPU:        ${systemInfo.cpuModel} x${systemInfo.cpuCount}`);
    lines.push(`  Uptime:     ${Math.floor(systemInfo.uptime / 86400)}d ${Math.floor((systemInfo.uptime % 86400) / 3600)}h`);
    lines.push(`  Load Avg:   ${systemInfo.loadavg.map(l => l.toFixed(2)).join(', ')}`);
    lines.push(`  Memory:     ${fmtMB(systemInfo.memory.used)} / ${fmtMB(systemInfo.memory.total)} (${systemInfo.memory.usedPercent}%)`);
    lines.push(`  Home:       ${systemInfo.homedir}`);
    lines.push('');
    return lines.join('\n');
}
async function runStatus(opts = {}) {
    const { watch = false, json = false, engineOnly = false, systemOnly = false, intervalMs = 3000 } = opts;
    if (json) {
        // JSON 模式：一次性输出
        const snapshot = (0, engines_1.collectPanelSnapshot)();
        const systemInfo = getSystemInfo();
        console.log(renderJSON(snapshot, systemInfo));
        return;
    }
    if (systemOnly) {
        // 只显示系统信息
        const systemInfo = getSystemInfo();
        console.log(renderSystemOnly(systemInfo));
        return;
    }
    if (engineOnly) {
        // 只显示引擎状态
        const snapshot = (0, engines_1.collectPanelSnapshot)();
        console.log(renderEnginesOnly(snapshot));
        return;
    }
    if (watch) {
        // Watch 模式
        const stop = await (0, engines_1.watchPanel)(intervalMs);
        // 捕获 Ctrl+C 信号优雅退出
        process.on('SIGINT', () => {
            stop();
            process.exit(0);
        });
        return;
    }
    // 默认：完整面板一次性输出
    const snapshot = (0, engines_1.collectPanelSnapshot)();
    console.log((0, engines_1.renderPanelTable)(snapshot));
    // 追加详细信息
    const info = getHeartFlowInfo();
    const checkpoint = getCheckpointInfo();
    const vector = getVectorStoreInfo();
    console.log('  HeartFlow Info:');
    console.log(`    Version:     ${info.version}`);
    console.log(`    Root:        ${info.root}`);
    console.log(`    Last Upgrade: ${info.lastUpgrade}`);
    console.log('');
    if (!checkpoint.error) {
        console.log('  Checkpoint Engine:');
        console.log(`    Snapshots:   ${checkpoint.totalSnapshots} (max keep: ${checkpoint.maxKeep})`);
        console.log(`    Last Saved:  ${checkpoint.lastSavedAt ?? 'never'}`);
        console.log(`    Dir:         ${checkpoint.dir}`);
        if (checkpoint.latestSnapshot) {
            console.log(`    Latest:      id=${checkpoint.latestSnapshot.id} label=${checkpoint.latestSnapshot.label ?? 'none'}`);
        }
    }
    else {
        console.log(`  Checkpoint Engine: ERROR — ${checkpoint.error}`);
    }
    console.log('');
    if (!vector.error) {
        console.log('  Vector Store:');
        console.log(`    Vectors:     ${vector.vectors}`);
        console.log(`    Persist:     ${vector.persistPath}`);
    }
    else {
        console.log(`  Vector Store: ERROR — ${vector.error}`);
    }
    console.log('');
}
//# sourceMappingURL=status.js.map