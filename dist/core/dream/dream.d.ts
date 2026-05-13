/**
 * HeartFlow Dream Engine - 梦境引擎 v3
 *
 * 心虫的梦 = 记忆碎片重组 → 发现跨域连接 → 存在论突破
 *
 * 梦境阶段：Light → REM → Deep → Lucid → Wide
 * 每个阶段对记忆碎片做不同操作，最终输出可执行的"顿悟"
 */
import { EventEmitter } from 'events';
export interface DreamConfig {
    consolidationStrength: number;
    patternThreshold: number;
    strengthenAbove: number;
    weakenBelow: number;
    maxIterations: number;
    minFragments: number;
}
export interface DreamResult {
    insights: Insight[];
    strengthened: string[];
    weakened: string[];
    merged: string[][];
    newBlocks: string[];
    cycles: number;
    stage: string;
    breakthrough?: string;
}
export interface Insight {
    type: 'pattern' | 'connection' | 'decay' | 'merge' | 'breakthrough';
    description: string;
    weight: number;
    relatedTags: string[];
    blockIds: string[];
    actionable?: string;
}
export interface DreamState {
    config: DreamConfig;
    lastDreamAt: number;
    dreamCount: number;
    insights: Insight[];
    stages: Record<string, number>;
}
export interface RecallBlock {
    id: string;
    content: string;
    tags?: string[];
    weight?: number;
    lastAccessed?: number;
    createdAt?: number;
}
export interface DreamStats {
    dreamCount: number;
    lastDreamAt: number;
    totalInsights: number;
    insightTypes: Record<string, number>;
    stages: Record<string, number>;
    avgCycleTime?: number;
}
export declare function createDreamState(config?: Partial<DreamConfig>): DreamState;
export declare function getRecentInsights(state: DreamState, limit?: number): Insight[];
export declare function getDreamStats(state: DreamState): DreamStats;
export interface DreamEngine extends EventEmitter {
    state: DreamState;
    runNightDream: (recallBlocks: Map<string, RecallBlock>) => Promise<DreamResult>;
    getInsights: () => Insight[];
    getStats: () => DreamStats;
    addFragment: (block: RecallBlock) => void;
}
export declare function createDreamEngine(config?: Partial<DreamConfig>): DreamEngine;
export { createDreamEngine as createDreamEngineFactory };
//# sourceMappingURL=dream.d.ts.map