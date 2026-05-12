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

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const CHECKPOINT_DIR = path.join(os.homedir(), '.hermes', 'heartflow', 'checkpoints');
const MAX_KEEP = 10;
const SNAPSHOT_PREFIX = 'checkpoint-';
const META_FILE = 'checkpoint-meta.json';

interface CheckpointMeta {
  version: string;
  lastSavedAt: string | null;
  totalSnapshots: number;
  snapshots: CheckpointEntry[];
}

interface CheckpointEntry {
  id: string;        // unix ms string
  filename: string;
  savedAt: string;   // ISO string
  sizeBytes: number;
  label?: string;
}

interface SaveResult {
  success: boolean;
  id?: string;
  filename?: string;
  savedAt?: string;
  error?: string;
}

interface LoadResult {
  success: boolean;
  data?: object;
  id?: string;
  error?: string;
}

interface CleanupResult {
  success: boolean;
  deleted: string[];
  kept: number;
  error?: string;
}

interface ListResult {
  success: boolean;
  snapshots: CheckpointEntry[];
  error?: string;
}

/**
 * CheckpointEngine
 * 
 * 管理 HeartFlow 状态快照的持久化。
 * 快照以 JSON 格式写入 ~/.hermes/heartflow/checkpoints/，
 * 自动保留最新 10 个，cleanup() 删除更旧的。
 */
export class CheckpointEngine {
  private dir: string;
  private maxKeep: number;

  constructor(opts?: { dir?: string; maxKeep?: number }) {
    this.dir = opts?.dir ?? CHECKPOINT_DIR;
    this.maxKeep = opts?.maxKeep ?? MAX_KEEP;
  }

  // ─── 私有工具 ─────────────────────────────────────────────────────────────

  private ensureDir(): void {
    if (!fs.existsSync(this.dir)) {
      fs.mkdirSync(this.dir, { recursive: true });
    }
  }

  private metaPath(): string {
    return path.join(this.dir, META_FILE);
  }

  private snapshotPath(id: string): string {
    return path.join(this.dir, `${SNAPSHOT_PREFIX}${id}.json`);
  }

  private loadMeta(): CheckpointMeta {
    try {
      if (fs.existsSync(this.metaPath())) {
        return JSON.parse(fs.readFileSync(this.metaPath(), 'utf8'));
      }
    } catch (_) {
      // ignore
    }
    return { version: '1.0', lastSavedAt: null, totalSnapshots: 0, snapshots: [] };
  }

  private saveMeta(meta: CheckpointMeta): void {
    this.ensureDir();
    fs.writeFileSync(this.metaPath(), JSON.stringify(meta, null, 2), 'utf8');
  }

  private sortByIdDesc(entries: CheckpointEntry[]): CheckpointEntry[] {
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
  save(data: object, label?: string): SaveResult {
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
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * load — 恢复一个快照
   * 
   * @param id     快照 ID（unix ms），或传入 'latest' / undefined 加载最新
   * @returns LoadResult
   */
  load(id?: string): LoadResult {
    try {
      const meta = this.loadMeta();
      let targetId: string;

      if (!id || id === 'latest') {
        const sorted = this.sortByIdDesc(meta.snapshots);
        if (sorted.length === 0) {
          return { success: false, error: 'No snapshots found' };
        }
        targetId = sorted[0].id;
      } else {
        targetId = id;
      }

      const filePath = this.snapshotPath(targetId);
      if (!fs.existsSync(filePath)) {
        return { success: false, error: `Snapshot ${targetId} not found` };
      }

      const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return { success: true, data: raw.data, id: targetId };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * cleanup — 删除旧快照，保留最新 N 个
   * 
   * @param keep  保留数量，默认 this.maxKeep (=10)
   * @returns CleanupResult
   */
  cleanup(keep?: number): CleanupResult {
    try {
      const count = keep ?? this.maxKeep;
      const meta = this.loadMeta();

      if (meta.snapshots.length <= count) {
        return { success: true, deleted: [], kept: meta.snapshots.length };
      }

      const sorted = this.sortByIdDesc(meta.snapshots);
      const keepIds = new Set(sorted.slice(0, count).map(s => s.id));
      const toDelete = sorted.slice(count);

      const deleted: string[] = [];
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
    } catch (err: any) {
      return { success: false, deleted: [], kept: 0, error: err.message };
    }
  }

  /**
   * list — 列出所有快照（最新在前）
   */
  list(): ListResult {
    try {
      const meta = this.loadMeta();
      return { success: true, snapshots: this.sortByIdDesc(meta.snapshots) };
    } catch (err: any) {
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

export { CHECKPOINT_DIR, MAX_KEEP };
export type { CheckpointMeta, CheckpointEntry, SaveResult, LoadResult, CleanupResult, ListResult };
