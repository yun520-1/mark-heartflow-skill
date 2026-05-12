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
import { CheckpointEngine } from './checkpoint/CheckpointEngine';
import { VectorStore } from '../memory/vector-store';
export { CheckpointEngine } from './checkpoint/CheckpointEngine';
export { VectorStore, createVectorStore } from '../memory/vector-store';
export interface StorageEngine {
    checkpoint: {
        save: (data: object, label?: string) => ReturnType<CheckpointEngine['save']>;
        load: (id?: string) => ReturnType<CheckpointEngine['load']>;
        cleanup: (keep?: number) => ReturnType<CheckpointEngine['cleanup']>;
        list: () => ReturnType<CheckpointEngine['list']>;
        getStats: () => ReturnType<CheckpointEngine['getStats']>;
    };
    vector: {
        upsert: (id: string, embedding: number[], metadata?: object) => VectorStore;
        search: (query: number[], topK?: number, threshold?: number) => Array<{
            id: string;
            score: number;
            metadata: object;
        }>;
        get: (id: string) => {
            id: string;
            embedding: number[];
            metadata: object;
        } | null;
        delete: (id: string) => boolean;
        size: () => number;
        save: () => boolean;
    };
    save: (key: string, data: object) => ReturnType<CheckpointEngine['save']>;
    load: (key: string) => ReturnType<CheckpointEngine['load']>;
}
/**
 * 创建存储引擎实例
 */
export declare function createStorageEngine(options?: {
    checkpointDir?: string;
    vectorPersistPath?: string;
    vectorDimension?: number;
}): StorageEngine;
/**
 * 独立使用: 创建带持久化的 VectorStore
 */
export declare function createPersistentVectorStore(persistPath?: string, dimension?: number): any;
/**
 * 独立使用: 创建 CheckpointEngine
 */
export declare function createCheckpointEngine(dir?: string, maxKeep?: number): CheckpointEngine;
//# sourceMappingURL=index.d.ts.map