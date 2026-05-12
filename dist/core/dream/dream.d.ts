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
export declare function createDreamState(config?: Partial<DreamConfig>): DreamState;
export declare function getRecentInsights(state: DreamState, limit?: number): Insight[];
export declare function getDreamStats(state: DreamState): {
    dreamCount: number;
    lastDreamAt: number;
    totalInsights: number;
    insightTypes: Record<string, number>;
};
export interface DreamEngine {
    state: DreamState;
    runNightDream: (recallBlocks: Map<string, unknown>) => Promise<DreamResult>;
    getInsights: () => Insight[];
    getStats: () => ReturnType<typeof getDreamStats>;
}
export declare function createDreamEngine(config?: Partial<DreamConfig>): DreamEngine;
//# sourceMappingURL=dream.d.ts.map