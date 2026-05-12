// VectorStoreEngine — 内存向量存储 + 增量异步持久化
// Simple in-memory vector storage with cosine similarity + async incremental persist

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface VectorEntry {
  id: string;
  vector: number[];
  metadata: Record<string, unknown>;
}

export interface SearchResult {
  id: string;
  score: number;
  metadata: Record<string, unknown>;
}

export interface VectorStoreEngine {
  boot(): Promise<void>;
  add(id: string, vector: number[], metadata?: Record<string, unknown>): void;
  persist(): Promise<void>;
  search(query: number[], k?: number): SearchResult[];
  query(vector: number[], k?: number): SearchResult[];
  get(id: string): VectorEntry | undefined;
  remove(id: string): boolean;
  clear(): void;
  size(): number;
  shutdown(): Promise<void>;
}

function cosine(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

function normalize(v: number[]): number[] {
  const mag = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
  if (mag === 0) return v;
  return v.map(x => x / mag);
}

export function createVectorStoreEngine(
  storeDir = path.join(os.homedir(), '.hermes', 'heartflow', 'vectors')
): VectorStoreEngine {
  const entries = new Map<string, VectorEntry>();
  let persistTimer: NodeJS.Timeout | null = null;
  let dirty = false;
  let bootPromise: Promise<void> | null = null;

  // Ensure directory exists
  function ensureDir(): void {
    if (!fs.existsSync(storeDir)) {
      fs.mkdirSync(storeDir, { recursive: true });
    }
  }

  // Path for the entries index file
  function indexPath(): string {
    return path.join(storeDir, 'index.json');
  }

  // Path for individual vector file
  function entryPath(id: string): string {
    return path.join(storeDir, `${id}.json`);
  }

  // Load all persisted entries from disk
  async function loadFromDisk(): Promise<void> {
    ensureDir();
    const idx = indexPath();
    if (!fs.existsSync(idx)) return;

    try {
      const data = fs.readFileSync(idx, 'utf-8');
      const ids: string[] = JSON.parse(data);
      for (const id of ids) {
        const ep = entryPath(id);
        if (fs.existsSync(ep)) {
          try {
            const raw = fs.readFileSync(ep, 'utf-8');
            const entry: VectorEntry = JSON.parse(raw);
            entries.set(id, entry);
          } catch {
            // Skip corrupted entry files
          }
        }
      }
      console.log(`[VectorStoreEngine] loaded ${entries.size} entries from disk`);
    } catch (e) {
      console.warn('[VectorStoreEngine] failed to load index, starting fresh', e);
    }
  }

  // Persist entries map to disk (index + individual files)
  async function persistToDisk(): Promise<void> {
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

  function boot(): Promise<void> {
    if (!bootPromise) {
      bootPromise = loadFromDisk();
    }
    console.log('[VectorStoreEngine] boot — vector search ready');
    return bootPromise;
  }

  function add(id: string, vector: number[], metadata: Record<string, unknown> = {}): void {
    entries.set(id, { id, vector: normalize(vector), metadata });
    dirty = true;
    schedulePersist();
  }

  // Debounced persist — flush to disk after 2 seconds of inactivity
  function schedulePersist(): void {
    if (persistTimer) clearTimeout(persistTimer);
    persistTimer = setTimeout(() => {
      persistToDisk().catch(err => console.error('[VectorStoreEngine] persist error', err));
    }, 2000);
  }

  async function persist(): Promise<void> {
    if (persistTimer) {
      clearTimeout(persistTimer);
      persistTimer = null;
    }
    await persistToDisk();
  }

  function search(query: number[], k = 5): SearchResult[] {
    const q = normalize(query);
    const results: SearchResult[] = [];
    for (const entry of entries.values()) {
      const score = cosine(q, entry.vector);
      results.push({ id: entry.id, score, metadata: entry.metadata });
    }
    return results.sort((a, b) => b.score - a.score).slice(0, k);
  }

  // Alias for semantic clarity
  function query(vector: number[], k = 5): SearchResult[] {
    return search(vector, k);
  }

  function get(id: string): VectorEntry | undefined {
    return entries.get(id);
  }

  function remove(id: string): boolean {
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

  function clear(): void {
    entries.clear();
    dirty = true;
    schedulePersist();
  }

  function size(): number {
    return entries.size;
  }

  async function shutdown(): Promise<void> {
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
