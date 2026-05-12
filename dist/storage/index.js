"use strict";
/**
 * HeartFlow Storage — 持久化存储统一导出
 *
 * 整合 CheckpointEngine + VectorStore，提供：
 *   - checkpoint: 状态快照持久化 (save/load/cleanup/list)
 *   - vector: 向量存储 + 相似度检索
 *
 * 使用示例:
 *   const { createStorageEngine } = require('./storage');
 *   const storage = createStorageEngine();
 *   await storage.save('key', data);
 *   const data = await storage.load('key');
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createVectorStore = exports.VectorStore = exports.CheckpointEngine = void 0;
exports.createStorageEngine = createStorageEngine;
exports.createPersistentVectorStore = createPersistentVectorStore;
exports.createCheckpointEngine = createCheckpointEngine;
const CheckpointEngine_1 = require("./checkpoint/CheckpointEngine");
const vector_store_1 = require("../memory/vector-store");
var CheckpointEngine_2 = require("./checkpoint/CheckpointEngine");
Object.defineProperty(exports, "CheckpointEngine", { enumerable: true, get: function () { return CheckpointEngine_2.CheckpointEngine; } });
var vector_store_2 = require("../memory/vector-store");
Object.defineProperty(exports, "VectorStore", { enumerable: true, get: function () { return vector_store_2.VectorStore; } });
Object.defineProperty(exports, "createVectorStore", { enumerable: true, get: function () { return vector_store_2.createVectorStore; } });
/**
 * 创建存储引擎实例
 */
function createStorageEngine(options) {
    const checkpointEngine = new CheckpointEngine_1.CheckpointEngine({
        dir: options?.checkpointDir,
    });
    const vectorStore = (0, vector_store_1.createVectorStore)({
        persistPath: options?.vectorPersistPath
            ?? (() => {
                const os = require('os');
                const path = require('path');
                return path.join(os.homedir(), '.hermes', 'heartflow', 'data', 'vector-store.json');
            })(),
        dimension: options?.vectorDimension ?? 384,
    });
    return {
        checkpoint: {
            save: (data, label) => checkpointEngine.save(data, label),
            load: (id) => checkpointEngine.load(id),
            cleanup: (keep) => checkpointEngine.cleanup(keep),
            list: () => checkpointEngine.list(),
            getStats: () => checkpointEngine.getStats(),
        },
        vector: {
            upsert: (id, embedding, metadata = {}) => {
                vectorStore.upsert(id, embedding, metadata);
                return vectorStore;
            },
            search: (query, topK, threshold) => vectorStore.search(query, topK, threshold),
            get: (id) => vectorStore.get(id),
            delete: (id) => vectorStore.delete(id),
            size: () => vectorStore.size(),
            save: () => vectorStore.save(),
        },
        save: (key, data) => checkpointEngine.save({ key, data, savedAt: Date.now() }, key),
        load: (key) => {
            const result = checkpointEngine.load('latest');
            if (result.success && result.data && result.data.key === key) {
                return { success: true, data: result.data.data };
            }
            return { success: false, error: 'Key not found' };
        },
    };
}
/**
 * 独立使用: 创建带持久化的 VectorStore
 */
function createPersistentVectorStore(persistPath, dimension = 384) {
    return (0, vector_store_1.createVectorStore)({ persistPath, dimension });
}
/**
 * 独立使用: 创建 CheckpointEngine
 */
function createCheckpointEngine(dir, maxKeep = 10) {
    return new CheckpointEngine_1.CheckpointEngine({ dir, maxKeep });
}
//# sourceMappingURL=index.js.map