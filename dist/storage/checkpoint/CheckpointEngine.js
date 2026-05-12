/**
 * CheckpointEngine — 心流检查点持久化引擎
 * @version v0.12.50
 *
 * 提供 save/load/cleanup 三个核心方法：
 * - save()   : 将状态快照写入 ~/.hermes/heartflow/checkpoints/<timestamp>.json
 * - load()   : 从指定 ID 或最新快照恢复状态
 * - cleanup(): 保留最新 N 个快照，删除其余
 *
 * 快照命名: checkpoint-<unix_ms>.json
 * 元数据  : checkpoint-meta.json (索引 + 版本)
 */
'use strict';
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
exports.MAX_KEEP = exports.CHECKPOINT_DIR = exports.CheckpointEngine = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const CHECKPOINT_DIR = path.join(os.homedir(), '.hermes', 'heartflow', 'checkpoints');
exports.CHECKPOINT_DIR = CHECKPOINT_DIR;
const MAX_KEEP = 10;
exports.MAX_KEEP = MAX_KEEP;
const SNAPSHOT_PREFIX = 'checkpoint-';
const META_FILE = 'checkpoint-meta.json';
/**
 * CheckpointEngine
 *
 * 管理 HeartFlow 状态快照的持久化。
 * 快照以 JSON 格式写入 ~/.hermes/heartflow/checkpoints/，
 * 自动保留最新 10 个，cleanup() 删除更旧的。
 */
class CheckpointEngine {
    dir;
    maxKeep;
    constructor(opts) {
        this.dir = opts?.dir ?? CHECKPOINT_DIR;
        this.maxKeep = opts?.maxKeep ?? MAX_KEEP;
    }
    // ─── 私有工具 ─────────────────────────────────────────────────────────────
    ensureDir() {
        if (!fs.existsSync(this.dir)) {
            fs.mkdirSync(this.dir, { recursive: true });
        }
    }
    metaPath() {
        return path.join(this.dir, META_FILE);
    }
    snapshotPath(id) {
        return path.join(this.dir, `${SNAPSHOT_PREFIX}${id}.json`);
    }
    loadMeta() {
        try {
            if (fs.existsSync(this.metaPath())) {
                return JSON.parse(fs.readFileSync(this.metaPath(), 'utf8'));
            }
        }
        catch (_) {
            // ignore
        }
        return { version: '1.0', lastSavedAt: null, totalSnapshots: 0, snapshots: [] };
    }
    saveMeta(meta) {
        this.ensureDir();
        fs.writeFileSync(this.metaPath(), JSON.stringify(meta, null, 2), 'utf8');
    }
    sortByIdDesc(entries) {
        return entries.slice().sort((a, b) => parseInt(b.id) - parseInt(a.id));
    }
    // ─── 公开 API ─────────────────────────────────────────────────────────────
    /**
     * save — 保存一个状态快照
     *
     * @param data      要持久化的状态对象
     * @param label     可选标签，如 'pre-upgrade'
     * @returns SaveResult
     */
    save(data, label) {
        try {
            this.ensureDir();
            const id = Date.now().toString();
            const savedAt = new Date().toISOString();
            const filename = `${SNAPSHOT_PREFIX}${id}.json`;
            const filePath = path.join(this.dir, filename);
            const payload = {
                id,
                savedAt,
                label: label ?? null,
                data,
            };
            const json = JSON.stringify(payload, null, 2);
            fs.writeFileSync(filePath, json, 'utf8');
            const sizeBytes = Buffer.byteLength(json, 'utf8');
            // 更新元数据
            const meta = this.loadMeta();
            meta.snapshots.push({ id, filename, savedAt, sizeBytes, label: label ?? undefined });
            meta.lastSavedAt = savedAt;
            meta.totalSnapshots++;
            this.saveMeta(meta);
            return { success: true, id, filename, savedAt };
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    }
    /**
     * load — 恢复一个快照
     *
     * @param id     快照 ID（unix ms），或传入 'latest' / undefined 加载最新
     * @returns LoadResult
     */
    load(id) {
        try {
            const meta = this.loadMeta();
            let targetId;
            if (!id || id === 'latest') {
                const sorted = this.sortByIdDesc(meta.snapshots);
                if (sorted.length === 0) {
                    return { success: false, error: 'No snapshots found' };
                }
                targetId = sorted[0].id;
            }
            else {
                targetId = id;
            }
            const filePath = this.snapshotPath(targetId);
            if (!fs.existsSync(filePath)) {
                return { success: false, error: `Snapshot ${targetId} not found` };
            }
            const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            return { success: true, data: raw.data, id: targetId };
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    }
    /**
     * cleanup — 删除旧快照，保留最新 N 个
     *
     * @param keep  保留数量，默认 this.maxKeep (=10)
     * @returns CleanupResult
     */
    cleanup(keep) {
        try {
            const count = keep ?? this.maxKeep;
            const meta = this.loadMeta();
            if (meta.snapshots.length <= count) {
                return { success: true, deleted: [], kept: meta.snapshots.length };
            }
            const sorted = this.sortByIdDesc(meta.snapshots);
            const keepIds = new Set(sorted.slice(0, count).map(s => s.id));
            const toDelete = sorted.slice(count);
            const deleted = [];
            for (const snap of toDelete) {
                const fp = this.snapshotPath(snap.id);
                if (fs.existsSync(fp)) {
                    fs.unlinkSync(fp);
                    deleted.push(snap.id);
                }
            }
            meta.snapshots = meta.snapshots.filter(s => keepIds.has(s.id));
            this.saveMeta(meta);
            return { success: true, deleted, kept: meta.snapshots.length };
        }
        catch (err) {
            return { success: false, deleted: [], kept: 0, error: err.message };
        }
    }
    /**
     * list — 列出所有快照（最新在前）
     */
    list() {
        try {
            const meta = this.loadMeta();
            return { success: true, snapshots: this.sortByIdDesc(meta.snapshots) };
        }
        catch (err) {
            return { success: false, snapshots: [], error: err.message };
        }
    }
    /**
     * getStats — 统计信息
     */
    getStats() {
        const meta = this.loadMeta();
        return {
            dir: this.dir,
            totalSnapshots: meta.snapshots.length,
            maxKeep: this.maxKeep,
            lastSavedAt: meta.lastSavedAt,
        };
    }
}
exports.CheckpointEngine = CheckpointEngine;
//# sourceMappingURL=CheckpointEngine.js.map