"use strict";
// Checkpoint Engine — 状态快照 + 恢复机制
// Periodic snapshots of engine state for recovery
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCheckpointEngine = createCheckpointEngine;
function createCheckpointEngine(version = '0.13.0') {
    const checkpoints = new Map();
    function boot() {
        console.log('[CheckpointEngine] boot — state snapshot ready');
    }
    function save(key, data) {
        const id = `cp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
        const checkpoint = {
            id,
            timestamp: Date.now(),
            version,
            data,
            metadata: { key },
        };
        if (!checkpoints.has(key))
            checkpoints.set(key, []);
        checkpoints.get(key).push(checkpoint);
        return id;
    }
    function load(key) {
        const list = checkpoints.get(key);
        if (!list || list.length === 0)
            return null;
        return list[list.length - 1];
    }
    function list() {
        const all = [];
        for (const [, cps] of checkpoints)
            all.push(...cps);
        return all.sort((a, b) => b.timestamp - a.timestamp);
    }
    function prune(maxCheckpoints = 10) {
        let removed = 0;
        for (const [key, cps] of checkpoints) {
            if (cps.length > maxCheckpoints) {
                const excess = cps.splice(0, cps.length - maxCheckpoints);
                removed += excess.length;
            }
            if (cps.length === 0)
                checkpoints.delete(key);
        }
        return removed;
    }
    function getLatest(key) {
        const list = checkpoints.get(key);
        if (!list || list.length === 0)
            return null;
        return list[list.length - 1];
    }
    function shutdown() {
        checkpoints.clear();
        console.log('[CheckpointEngine] shutdown');
    }
    return { boot, save, load, list, prune, getLatest, shutdown };
}
//# sourceMappingURL=checkpoint.js.map