// Dream Engine — 睡眠循环 + 记忆巩固
// Inherits from: dream.ts, dream-consolidator.ts

export interface DreamConfig {
  consolidationStrength: number;
  patternThreshold: number;
  strengthenAbove: number;
  weakenBelow: number;
  maxIterations: number;
  autoRun: boolean;
  intervalMs: number;
}

export interface Insight {
  type: 'pattern' | 'connection' | 'decay' | 'merge';
  description: string;
  weight: number;
  relatedTags: string[];
  blockIds: string[];
}

export interface DreamResult {
  insights: Insight[];
  strengthened: string[];
  weakened: string[];
  merged: string[][];
  newBlocks: string[];
  cycles: number;
  duration: number;
}

export interface DreamEngine {
  boot(): void;
  dream(blocks: unknown[], recallIndex?: unknown): Promise<DreamResult>;
  getInsights(): Insight[];
  getStats(): { dreamCount: number; lastDreamAt: number; totalInsights: number };
  shutdown(): void;
}

const DEFAULT_CONFIG: DreamConfig = {
  consolidationStrength: 0.5,
  patternThreshold: 3,
  strengthenAbove: 0.75,
  weakenBelow: 0.25,
  maxIterations: 5,
  autoRun: false,
  intervalMs: 60000,
};

export function createDreamEngine(config: Partial<DreamConfig> = {}): DreamEngine {
  const cfg: DreamConfig = { ...DEFAULT_CONFIG, ...config };
  const state = {
    dreamCount: 0,
    lastDreamAt: 0,
    insights: [] as Insight[],
    timer: null as ReturnType<typeof setInterval> | null,
  };

  function boot(): void {
    console.log('[DreamEngine] boot — sleep cycle ready');
    if (cfg.autoRun) {
      state.timer = setInterval(() => {
        // Auto-dream on interval (simplified — real impl would access memory)
      }, cfg.intervalMs);
    }
  }

  async function dream(blocks: unknown[] = [], _recallIndex?: unknown): Promise<DreamResult> {
    const start = Date.now();
    const result: DreamResult = {
      insights: [],
      strengthened: [],
      weakened: [],
      merged: [],
      newBlocks: [],
      cycles: 0,
      duration: 0,
    };

    if (blocks.length === 0) {
      state.lastDreamAt = Date.now();
      state.dreamCount++;
      return result;
    }

    // Phase 1: Pattern Detection — find recurring tag clusters
    const tagFreq = buildTagFrequency(blocks);
    const patterns = extractPatterns(tagFreq, cfg.patternThreshold);
    for (const p of patterns) {
      const insight: Insight = {
        type: 'pattern',
        description: `Recurring tag cluster: ${p.tags.join(' + ')} (${p.freq}×)`,
        weight: Math.min(1, p.freq / 10),
        relatedTags: p.tags,
        blockIds: p.blockIds,
      };
      result.insights.push(insight);
      state.insights.push(insight);
    }

    // Phase 2: Importance Recalibration — strengthen/weak memories
    const nowTs = Date.now();
    for (const block of blocks) {
      if (result.cycles >= cfg.maxIterations) break;
      const b = block as { importance?: number; createdAt?: number; accessCount?: number };
      if (b.importance === undefined) continue;
      const age = (nowTs - (b.createdAt || 0)) / (24 * 3600 * 1000);
      if (b.importance >= cfg.strengthenAbove) {
        const boost = (b.accessCount || 0) * 0.01 * cfg.consolidationStrength;
        b.importance = Math.min(1, (b.importance || 0) + boost);
        result.strengthened.push(String((block as { id?: string }).id || 'unknown'));
      } else if (b.importance <= cfg.weakenBelow) {
        const decay = Math.pow(0.95, age / 7);
        b.importance = Math.max(0, (b.importance || 0) * decay);
        result.weakened.push(String((block as { id?: string }).id || 'unknown'));
      }
      result.cycles++;
    }

    // Phase 3: Connection Discovery
    const connections = findConnections(blocks, patterns);
    for (const c of connections) {
      const insight: Insight = {
        type: 'connection',
        description: `Cross-block connection: ${c.tag} bridges ${c.blockIds.length} blocks`,
        weight: c.strength,
        relatedTags: [c.tag],
        blockIds: c.blockIds,
      };
      result.insights.push(insight);
      state.insights.push(insight);
    }

    state.lastDreamAt = Date.now();
    state.dreamCount++;
    result.duration = Date.now() - start;

    // Keep last 100 insights
    if (state.insights.length > 100) {
      state.insights = state.insights.slice(-100);
    }

    return result;
  }

  function getInsights(): Insight[] {
    return state.insights.slice(-20);
  }

  function getStats() {
    return {
      dreamCount: state.dreamCount,
      lastDreamAt: state.lastDreamAt,
      totalInsights: state.insights.length,
    };
  }

  function shutdown(): void {
    if (state.timer) clearInterval(state.timer);
    console.log('[DreamEngine] shutdown');
  }

  return { boot, dream, getInsights, getStats, shutdown };
}

// ── Internal Helpers ─────────────────────────────────────────────────────────

function buildTagFrequency(blocks: unknown[]): Map<string, { freq: number; blockIds: string[] }> {
  const freq = new Map<string, { freq: number; blockIds: string[] }>();
  for (const block of blocks) {
    const b = block as { tags?: string[]; id?: string };
    if (!b.tags) continue;
    for (const tag of b.tags) {
      if (!freq.has(tag)) freq.set(tag, { freq: 0, blockIds: [] });
      const entry = freq.get(tag)!;
      entry.freq++;
      if (b.id && !entry.blockIds.includes(b.id)) entry.blockIds.push(b.id);
    }
  }
  return freq;
}

function extractPatterns(tagFreq: Map<string, { freq: number; blockIds: string[] }>, threshold: number) {
  const patterns: { tags: string[]; freq: number; blockIds: string[] }[] = [];
  for (const [tag, data] of tagFreq) {
    if (data.freq >= threshold) {
      patterns.push({ tags: [tag], freq: data.freq, blockIds: data.blockIds });
    }
  }
  return patterns;
}

function findConnections(blocks: unknown[], patterns: { tags: string[]; blockIds: string[] }[]) {
  const connections: { tag: string; blockIds: string[]; strength: number }[] = [];
  const blockTagMap = new Map<string, Set<string>>();
  for (const block of blocks) {
    const b = block as { id?: string; tags?: string[] };
    if (!b.id || !b.tags) continue;
    blockTagMap.set(b.id, new Set(b.tags));
  }
  for (const [tag, data] of tagFreqFromBlocks(blocks)) {
    if (data.freq >= 2) {
      connections.push({ tag, blockIds: data.blockIds, strength: Math.min(1, data.freq / 5) });
    }
  }
  return connections;
}

function tagFreqFromBlocks(blocks: unknown[]): Map<string, { freq: number; blockIds: string[] }> {
  return buildTagFrequency(blocks);
}

function findMergeCandidates(blocks: unknown[], patterns: { tags: string[]; blockIds: string[] }[], cfg: DreamConfig) {
  const merges: [unknown, unknown][] = [];
  if (cfg.consolidationStrength < 0.4) return merges;
  // Simple heuristic: blocks with same tags and low importance
  for (let i = 0; i < blocks.length; i++) {
    for (let j = i + 1; j < blocks.length; j++) {
      const a = blocks[i] as { tags?: string[]; importance?: number };
      const b = blocks[j] as { tags?: string[]; importance?: number };
      if (a.tags && b.tags && a.tags.some(t => b.tags!.includes(t))) {
        if ((a.importance || 0) < 0.3 && (b.importance || 0) < 0.3) {
          merges.push([blocks[i], blocks[j]]);
        }
      }
    }
  }
  return merges.slice(0, 3); // limit merges per dream cycle
}
