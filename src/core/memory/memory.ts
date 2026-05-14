import * as fs from "fs";
import * as path from "path";
import { homedir } from 'os';
import { atomicWriteJSONSync } from "../../utils/atomic-write.js";

/**
 * HeartFlow Memory Engine - Hot/Working Memory Store
 * TypeScript ESM · Zero Dependencies
 *
 * Core principle: MeaningfulMemory with graceful degradation.
 * Stores active context, recent learnings, and high-value traces.
 * Permanent memory survives restarts via auto-persist.
 */

export interface MemoryEntry {
  id: string;
  content: string;
  importance: number;        // 0.0–1.0
  tags: string[];
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  ephemeral?: boolean;       // true = don't persist
}

export interface MemoryStore {
  entries: Map<string, MemoryEntry>;
  accessOrder: string[];     // LRU track
  tagIndex: Map<string, Set<string>>;
}

const MAX_ENTRIES = 1024;
const PRUNE_THRESHOLD = 0.15;  // prune when >85% full
const PERMANENT_DIR = path.join(
  homedir(), ".hermes", "skills", "ai", "mark-heartflow-skill", "memory"
);
const PERMANENT_FILE = path.join(PERMANENT_DIR, "permanent.json");

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function now(): number {
  return Date.now();
}

// ── Factory ─────────────────────────────────────────────────────────────────

export function createMemoryStore(): MemoryStore {
  return {
    entries: new Map(),
    accessOrder: [],
    tagIndex: new Map(),
  };
}

// ── Core Operations ─────────────────────────────────────────────────────────

export function memorize(
  store: MemoryStore,
  content: string,
  importance: number = 0.5,
  tags: string[] = [],
  ephemeral: boolean = false,
): MemoryEntry {
  const id = generateId();
  const entry: MemoryEntry = {
    id,
    content,
    importance: Math.max(0, Math.min(1, importance)),
    tags,
    timestamp: now(),
    accessCount: 0,
    lastAccessed: now(),
    ephemeral,
  };

  store.entries.set(id, entry);

  // LRU eviction BEFORE adding to accessOrder — prevents accessOrder inflation
  if (store.entries.size > MAX_ENTRIES) {
    prune(store);
  }

  store.accessOrder.push(id);

  for (const tag of tags) {
    if (!store.tagIndex.has(tag)) {
      store.tagIndex.set(tag, new Set());
    }
    store.tagIndex.get(tag)!.add(id);
  }

  return entry;
}

export function recall(
  store: MemoryStore,
  id: string,
): MemoryEntry | null {
  const entry = store.entries.get(id);
  if (!entry) return null;

  // Update LRU
  entry.lastAccessed = now();
  entry.accessCount++;
  store.accessOrder = store.accessOrder.filter((x) => x !== id);
  store.accessOrder.push(id);

  return entry;
}

export function forget(store: MemoryStore, id: string): boolean {
  const entry = store.entries.get(id);
  if (!entry) return false;

  for (const tag of entry.tags) {
    store.tagIndex.get(tag)?.delete(id);
  }
  store.entries.delete(id);
  store.accessOrder = store.accessOrder.filter((x) => x !== id);
  return true;
}

// ── Queries ─────────────────────────────────────────────────────────────────

export function searchByTag(store: MemoryStore, tag: string): MemoryEntry[] {
  const ids = store.tagIndex.get(tag) ?? new Set();
  return Array.from(ids)
    .map((id) => store.entries.get(id)!)
    .filter(Boolean)
    .sort((a, b) => b.lastAccessed - a.lastAccessed);
}

export function searchByContent(
  store: MemoryStore,
  query: string,
  limit: number = 20,
): MemoryEntry[] {
  const q = query.toLowerCase();
  return Array.from(store.entries.values())
    .filter((e) => e.content.toLowerCase().includes(q))
    .sort((a, b) => {
      // score = importance × recency
      const ageA = 1 - Math.min(1, (now() - a.timestamp) / (7 * 24 * 3600 * 1000));
      const ageB = 1 - Math.min(1, (now() - b.timestamp) / (7 * 24 * 3600 * 1000));
      return (b.importance * ageB) - (a.importance * ageA);
    })
    .slice(0, limit);
}

export function getRecent(
  store: MemoryStore,
  limit: number = 50,
): MemoryEntry[] {
  return store.accessOrder
    .slice(-limit)
    .reverse()
    .map((id) => store.entries.get(id)!)
    .filter(Boolean);
}

export function getHighValue(
  store: MemoryStore,
  minImportance: number = 0.7,
): MemoryEntry[] {
  return Array.from(store.entries.values())
    .filter((e) => e.importance >= minImportance && !e.ephemeral)
    .sort((a, b) => b.importance - a.importance);
}

export function getStats(store: MemoryStore): {
  total: number;
  ephemeral: number;
  avgImportance: number;
  tagCount: number;
} {
  const entries = Array.from(store.entries.values());
  const persistent = entries.filter((e) => !e.ephemeral);
  const sumImportance = persistent.reduce((s, e) => s + e.importance, 0);

  return {
    total: entries.length,
    ephemeral: entries.length - persistent.length,
    avgImportance: persistent.length > 0 ? sumImportance / persistent.length : 0,
    tagCount: store.tagIndex.size,
  };
}

// ── Persistence ─────────────────────────────────────────────────────────────

function ensureDir(): void {
  if (!fs.existsSync(PERMANENT_DIR)) {
    fs.mkdirSync(PERMANENT_DIR, { recursive: true });
  }
}

function loadFromDisk(store: MemoryStore): number {
  try {
    if (!fs.existsSync(PERMANENT_FILE)) return 0;
    const json = fs.readFileSync(PERMANENT_FILE, "utf8");
    return importMemory(store, json);
  } catch {
    return 0;
  }
}

function saveToDisk(store: MemoryStore): void {
  try {
    ensureDir();
    atomicWriteJSONSync(PERMANENT_FILE, exportMemory(store));
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    console.warn(`[MemoryEngine] saveToDisk failed: ${err} — data may be lost on shutdown`);
  }
}

export function exportMemory(store: MemoryStore): string {
  const persistent = Array.from(store.entries.values()).filter((e) => !e.ephemeral);
  return JSON.stringify(persistent, null, 2);
}

export function importMemory(
  store: MemoryStore,
  json: string,
): number {
  try {
    const data: MemoryEntry[] = JSON.parse(json);
    let imported = 0;
    for (const entry of data) {
      if (!store.entries.has(entry.id)) {
        // Preserve original lastAccessed to avoid recency pollution
        store.entries.set(entry.id, { ...entry });
        store.accessOrder.push(entry.id);
        for (const tag of entry.tags) {
          if (!store.tagIndex.has(tag)) {
            store.tagIndex.set(tag, new Set());
          }
          store.tagIndex.get(tag)!.add(entry.id);
        }
        imported++;
      }
    }
    return imported;
  } catch {
    return 0;
  }
}

// ── Private ─────────────────────────────────────────────────────────────────

function prune(store: MemoryStore): void {
  const entries = Array.from(store.entries.values());

  // Score: importance weighted by age, prefer to keep high-value + recent
  const scored = entries.map((e) => {
    const age = (now() - e.timestamp) / (24 * 3600 * 1000); // days
    const recency = Math.exp(-age / 7); // decay over 7 days
    return { entry: e, score: e.importance * recency };
  });

  // Sort ascending — lowest score evicted first
  scored.sort((a, b) => a.score - b.score);

  // Remove bottom 15% — batch deletion for O(1) per item instead of O(n) per forget()
  const toRemove = Math.max(1, Math.floor(entries.length * PRUNE_THRESHOLD));
  const toRemoveIds = new Set(scored.slice(0, toRemove).map(s => s.entry.id));

  // Batch: remove from entries, tagIndex, accessOrder in one pass
  for (const entry of scored.slice(0, toRemove)) {
    for (const tag of entry.entry.tags) {
      store.tagIndex.get(tag)?.delete(entry.entry.id);
    }
    store.entries.delete(entry.entry.id);
  }

  // accessOrder: rebuild without removed ids (single O(n) pass vs O(n²) loop)
  store.accessOrder = store.accessOrder.filter(id => !toRemoveIds.has(id));
}

// ── Memory Engine Wrapper ─────────────────────────────────────────────────────

export interface MemoryEngine {
  store: MemoryStore;
  memorize: (content: string, importance: number, tags?: string[], ephemeral?: boolean) => MemoryEntry;
  recall: (id: string) => MemoryEntry | undefined;
  forget: (id: string) => void;
  searchByTag: (tag: string) => MemoryEntry[];
  searchByContent: (query: string) => MemoryEntry[];
  getRecent: (limit: number) => MemoryEntry[];
  getHighValue: (limit: number) => MemoryEntry[];
  getStats: () => ReturnType<typeof getStats>;
  exportMemory: () => string;
  importMemory: (data: string) => number;
  boot(): void;
  shutdown(): void;
}

export function createMemoryEngine(): MemoryEngine {
  const store = createMemoryStore();
  return {
    store,
    memorize: (content, importance, tags = [], ephemeral = false) => memorize(store, content, importance, tags, ephemeral),
    recall: (id) => recall(store, id),
    forget: (id) => forget(store, id),
    searchByTag: (tag) => searchByTag(store, tag),
    searchByContent: (query) => searchByContent(store, query),
    getRecent: (limit) => getRecent(store, limit),
    getHighValue: (limit) => getHighValue(store, limit),
    getStats: () => getStats(store),
    exportMemory: () => exportMemory(store),
    importMemory: (data) => importMemory(store, data),
    boot(): void {
      const loaded = loadFromDisk(store);
      console.log(`[MemoryEngine] boot — three-tier memory ready${loaded > 0 ? ` (loaded ${loaded} permanent entries)` : ''}`);
    },
    shutdown(): void {
      saveToDisk(store);
      store.entries.clear();
      store.accessOrder = [];
      store.tagIndex.clear();
      console.log('[MemoryEngine] shutdown — saved + cleared');
    },
  };
}
