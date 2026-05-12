// Checkpoint Engine — 状态快照 + 恢复机制
// Periodic snapshots of engine state for recovery

export interface Checkpoint {
  id: string;
  timestamp: number;
  version: string;
  data: Record<string, unknown>;
  metadata: Record<string, unknown>;
}

export interface CheckpointEngine {
  boot(): void;
  save(key: string, data: Record<string, unknown>): string;
  load(key: string): Checkpoint | null;
  list(): Checkpoint[];
  prune(maxCheckpoints?: number): number;
  getLatest(key: string): Checkpoint | null;
  shutdown(): void;
}

export function createCheckpointEngine(version = '0.13.0'): CheckpointEngine {
  const checkpoints = new Map<string, Checkpoint[]>();

  function boot(): void {
    console.log('[CheckpointEngine] boot — state snapshot ready');
  }

  function save(key: string, data: Record<string, unknown>): string {
    const id = `cp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const checkpoint: Checkpoint = {
      id,
      timestamp: Date.now(),
      version,
      data,
      metadata: { key },
    };
    if (!checkpoints.has(key)) checkpoints.set(key, []);
    checkpoints.get(key)!.push(checkpoint);
    return id;
  }

  function load(key: string): Checkpoint | null {
    const list = checkpoints.get(key);
    if (!list || list.length === 0) return null;
    return list[list.length - 1];
  }

  function list(): Checkpoint[] {
    const all: Checkpoint[] = [];
    for (const [, cps] of checkpoints) all.push(...cps);
    return all.sort((a, b) => b.timestamp - a.timestamp);
  }

  function prune(maxCheckpoints = 10): number {
    let removed = 0;
    for (const [key, cps] of checkpoints) {
      if (cps.length > maxCheckpoints) {
        const excess = cps.splice(0, cps.length - maxCheckpoints);
        removed += excess.length;
      }
      if (cps.length === 0) checkpoints.delete(key);
    }
    return removed;
  }

  function getLatest(key: string): Checkpoint | null {
    const list = checkpoints.get(key);
    if (!list || list.length === 0) return null;
    return list[list.length - 1];
  }

  function shutdown(): void {
    checkpoints.clear();
    console.log('[CheckpointEngine] shutdown');
  }

  return { boot, save, load, list, prune, getLatest, shutdown };
}
