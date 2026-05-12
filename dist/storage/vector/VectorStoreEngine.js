"use strict";
// VectorStoreEngine — 内存向量存储 + 增量异步持久化
// Simple in-memory vector storage with cosine similarity + async incremental persist
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
exports.createVectorStoreEngine = createVectorStoreEngine;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
function cosine(a, b) {
    if (a.length !== b.length)
        return 0;
    let dot = 0, magA = 0, magB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        magA += a[i] * a[i];
        magB += b[i] * b[i];
    }
    const denom = Math.sqrt(magA) * Math.sqrt(magB);
    return denom === 0 ? 0 : dot / denom;
}
function normalize(v) {
    const mag = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
    if (mag === 0)
        return v;
    return v.map(x => x / mag);
}
function createVectorStoreEngine(storeDir = path.join(os.homedir(), '.hermes', 'heartflow', 'vectors')) {
    const entries = new Map();
    let persistTimer = null;
    let dirty = false;
    let bootPromise = null;
    // Ensure directory exists
    function ensureDir() {
        if (!fs.existsSync(storeDir)) {
            fs.mkdirSync(storeDir, { recursive: true });
        }
    }
    // Path for the entries index file
    function indexPath() {
        return path.join(storeDir, 'index.json');
    }
    // Path for individual vector file
    function entryPath(id) {
        return path.join(storeDir, `${id}.json`);
    }
    // Load all persisted entries from disk
    async function loadFromDisk() {
        ensureDir();
        const idx = indexPath();
        if (!fs.existsSync(idx))
            return;
        try {
            const data = fs.readFileSync(idx, 'utf-8');
            const ids = JSON.parse(data);
            for (const id of ids) {
                const ep = entryPath(id);
                if (fs.existsSync(ep)) {
                    try {
                        const raw = fs.readFileSync(ep, 'utf-8');
                        const entry = JSON.parse(raw);
                        entries.set(id, entry);
                    }
                    catch {
                        // Skip corrupted entry files
                    }
                }
            }
            console.log(`[VectorStoreEngine] loaded ${entries.size} entries from disk`);
        }
        catch (e) {
            console.warn('[VectorStoreEngine] failed to load index, starting fresh', e);
        }
    }
    // Persist entries map to disk (index + individual files)
    async function persistToDisk() {
        ensureDir();
        // Write index
        const ids = Array.from(entries.keys());
        fs.writeFileSync(indexPath(), JSON.stringify(ids), 'utf-8');
        // Write each entry individually for incremental updates
        for (const [id, entry] of entries) {
            fs.writeFileSync(entryPath(id), JSON.stringify(entry), 'utf-8');
        }
        dirty = false;
        console.log(`[VectorStoreEngine] persisted ${entries.size} entries`);
    }
    function boot() {
        if (!bootPromise) {
            bootPromise = loadFromDisk();
        }
        console.log('[VectorStoreEngine] boot — vector search ready');
        return bootPromise;
    }
    function add(id, vector, metadata = {}) {
        entries.set(id, { id, vector: normalize(vector), metadata });
        dirty = true;
        schedulePersist();
    }
    // Debounced persist — flush to disk after 2 seconds of inactivity
    function schedulePersist() {
        if (persistTimer)
            clearTimeout(persistTimer);
        persistTimer = setTimeout(() => {
            persistToDisk().catch(err => console.error('[VectorStoreEngine] persist error', err));
        }, 2000);
    }
    async function persist() {
        if (persistTimer) {
            clearTimeout(persistTimer);
            persistTimer = null;
        }
        await persistToDisk();
    }
    function search(query, k = 5) {
        const q = normalize(query);
        const results = [];
        for (const entry of entries.values()) {
            const score = cosine(q, entry.vector);
            results.push({ id: entry.id, score, metadata: entry.metadata });
        }
        return results.sort((a, b) => b.score - a.score).slice(0, k);
    }
    // Alias for semantic clarity
    function query(vector, k = 5) {
        return search(vector, k);
    }
    function get(id) {
        return entries.get(id);
    }
    function remove(id) {
        const deleted = entries.delete(id);
        if (deleted) {
            dirty = true;
            // Remove file from disk
            const ep = entryPath(id);
            if (fs.existsSync(ep)) {
                fs.unlinkSync(ep);
            }
            schedulePersist();
        }
        return deleted;
    }
    function clear() {
        entries.clear();
        dirty = true;
        schedulePersist();
    }
    function size() {
        return entries.size;
    }
    async function shutdown() {
        if (persistTimer) {
            clearTimeout(persistTimer);
            persistTimer = null;
        }
        if (dirty) {
            await persistToDisk();
        }
        entries.clear();
        console.log('[VectorStoreEngine] shutdown');
    }
    return { boot, add, persist, search, query, get, remove, clear, size, shutdown };
}
//# sourceMappingURL=VectorStoreEngine.js.map