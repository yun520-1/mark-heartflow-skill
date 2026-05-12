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
import { VectorStore, createVectorStore } from '../memory/vector-store';

export { CheckpointEngine } from './checkpoint/CheckpointEngine';
export { VectorStore, createVectorStore } from '../memory/vector-store';

export interface StorageEngine {
  // Checkpoint API
  checkpoint: {
    save: (data: object, label?: string) => ReturnType<CheckpointEngine['save']>;
    load: (id?: string) => ReturnType<CheckpointEngine['load']>;
    cleanup: (keep?: number) => ReturnType<CheckpointEngine['cleanup']>;
    list: () => ReturnType<CheckpointEngine['list']>;
    getStats: () => ReturnType<CheckpointEngine['getStats']>;
  };
  
  // Vector API  
  vector: {
    upsert: (id: string, embedding: number[], metadata?: object) => VectorStore;
    search: (query: number[], topK?: number, threshold?: number) => Array<{id: string; score: number; metadata: object}>;
    get: (id: string) => {id: string; embedding: number[]; metadata: object} | null;
    delete: (id: string) => boolean;
    size: () => number;
    save: () => boolean;
  };
  
  // Convenience
  save: (key: string, data: object) => ReturnType<CheckpointEngine['save']>;
  load: (key: string) => ReturnType<CheckpointEngine['load']>;
}

/**
 * 创建存储引擎实例
 */
export function createStorageEngine(options?: {
  checkpointDir?: string;
  vectorPersistPath?: string;
  vectorDimension?: number;
}): StorageEngine {
  const checkpointEngine = new CheckpointEngine({
    dir: options?.checkpointDir,
  });

  const vectorStore = createVectorStore({
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
      if (result.success && result.data && (result.data as any).key === key) {
        return { success: true, data: (result.data as any).data };
      }
      return { success: false, error: 'Key not found' };
    },
  };
}

/**
 * 独立使用: 创建带持久化的 VectorStore
 */
export function createPersistentVectorStore(persistPath?: string, dimension = 384) {
  return createVectorStore({ persistPath, dimension });
}

/**
 * 独立使用: 创建 CheckpointEngine
 */
export function createCheckpointEngine(dir?: string, maxKeep = 10) {
  return new CheckpointEngine({ dir, maxKeep });
}
