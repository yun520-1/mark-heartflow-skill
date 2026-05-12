/**
 * HeartFlow Dream Engine - 梦境引擎 v2
 */

export interface DreamConfig {
  consolidationStrength: number;
  patternThreshold: number;
  strengthenAbove: number;
  weakenBelow: number;
  maxIterations: number;
}

export interface DreamResult {
  insights: Insight[];
  strengthened: string[];
  weakened: string[];
  merged: string[][];
  newBlocks: string[];
  cycles: number;
}

export interface Insight {
  type: 'pattern' | 'connection' | 'decay' | 'merge';
  description: string;
  weight: number;
  relatedTags: string[];
  blockIds: string[];
}

export interface DreamState {
  config: DreamConfig;
  lastDreamAt: number;
  dreamCount: number;
  insights: Insight[];
}

const DEFAULT_CONFIG: DreamConfig = {
  consolidationStrength: 0.5,
  patternThreshold: 3,
  strengthenAbove: 0.75,
  weakenBelow: 0.25,
  maxIterations: 5,
};

export function createDreamState(config: Partial<DreamConfig> = {}): DreamState {
  return {
    config: { ...DEFAULT_CONFIG, ...config },
    lastDreamAt: 0,
    dreamCount: 0,
    insights: [],
  };
}

export function getRecentInsights(state: DreamState, limit: number = 20): Insight[] {
  return state.insights.slice(-limit);
}

export function getDreamStats(state: DreamState) {
  const insightTypes: Record<string, number> = {};
  for (const ins of state.insights) {
    insightTypes[ins.type] = (insightTypes[ins.type] ?? 0) + 1;
  }
  return {
    dreamCount: state.dreamCount,
    lastDreamAt: state.lastDreamAt,
    totalInsights: state.insights.length,
    insightTypes,
  };
}

export interface DreamEngine {
  state: DreamState;
  runNightDream: (recallBlocks: Map<string, unknown>) => Promise<DreamResult>;
  getInsights: () => Insight[];
  getStats: () => ReturnType<typeof getDreamStats>;
}

export function createDreamEngine(config?: Partial<DreamConfig>): DreamEngine {
  const state = createDreamState(config);

  async function runNightDream(recallBlocks: Map<string, unknown>): Promise<DreamResult> {
    const result: DreamResult = {
      insights: [],
      strengthened: [],
      weakened: [],
      merged: [],
      newBlocks: [],
      cycles: 0,
    };
    if (recallBlocks.size === 0) {
      state.lastDreamAt = Date.now();
      state.dreamCount++;
      return result;
    }
    state.lastDreamAt = Date.now();
    state.dreamCount++;
    return result;
  }

  return {
    state,
    runNightDream,
    getInsights: () => getRecentInsights(state),
    getStats: () => getDreamStats(state),
  };
}
