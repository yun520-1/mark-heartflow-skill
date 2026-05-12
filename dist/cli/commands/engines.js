"use strict";
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
exports.collectPanelSnapshot = collectPanelSnapshot;
exports.renderPanelTable = renderPanelTable;
exports.watchPanel = watchPanel;
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
// 动态加载 storage 模块（避免循环依赖）
let _storage = null;
function getStorage() {
    if (!_storage) {
        try {
            _storage = require('../../storage').createStorageEngine();
        }
        catch (e) {
            _storage = null;
        }
    }
    return _storage;
}
/** 格式化字节为 MB */
function toMB(bytes) {
    return Math.round((bytes / 1024 / 1024) * 100) / 100;
}
/** 格式化秒为人类可读时长 */
function formatUptime(seconds) {
    if (seconds < 60)
        return `${Math.floor(seconds)}s`;
    const m = Math.floor(seconds / 60);
    if (m < 60)
        return `${m}m ${Math.floor(seconds % 60)}s`;
    const h = Math.floor(m / 60);
    if (h < 24)
        return `${h}h ${m % 60}m`;
    const d = Math.floor(h / 24);
    return `${d}d ${h % 24}h`;
}
// ─── 引擎状态采集器 ───────────────────────────────────────────────────────
function getMemoryEngineStatus() {
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
    }
    catch (e) {
        return { name, status: 'error', details: { error: e.message } };
    }
}
function getCheckpointEngineStatus() {
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
    }
    catch (e) {
        return { name, status: 'error', details: { error: e.message } };
    }
}
function getVectorStoreEngineStatus() {
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
    }
    catch (e) {
        return { name, status: 'error', details: { error: e.message } };
    }
}
function getCoreEngineStatus() {
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
            }
            catch { /* ignore */ }
        }
        return {
            name,
            status: state === 'alive' ? 'online' : 'unknown',
            details: { version, rootPath, state },
        };
    }
    catch (e) {
        return { name, status: 'error', details: { error: e.message } };
    }
}
// ─── 主采集函数 ───────────────────────────────────────────────────────────
function collectPanelSnapshot() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const engines = [
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
const STATUS_SYMBOLS = {
    online: '🟢',
    offline: '⚪',
    error: '🔴',
    unknown: '🟡',
};
function renderPanelTable(snapshot) {
    const lines = [];
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
        lines.push(`  │ ${eng.name.padEnd(19)} │ ${sym} ${eng.status.padEnd(4)} │ ${truncated.padEnd(27)} │`);
    }
    lines.push('  └─────────────────────┴────────┴─────────────────────────────┘');
    lines.push('');
    return lines.join('\n');
}
// ─── Watch 模式 ────────────────────────────────────────────────────────────
async function watchPanel(intervalMs = 3000, onUpdate) {
    let running = true;
    async function loop() {
        while (running) {
            const snap = collectPanelSnapshot();
            // 清屏重绘
            process.stdout.write('\x1b[2J\x1b[H');
            process.stdout.write(renderPanelTable(snap));
            if (onUpdate)
                onUpdate(snap);
            await new Promise(resolve => setTimeout(resolve, intervalMs));
        }
    }
    loop().catch(console.error);
    // 返回停止函数
    return () => { running = false; };
}
//# sourceMappingURL=engines.js.map