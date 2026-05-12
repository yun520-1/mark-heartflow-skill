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
    getStats(): {
        dreamCount: number;
        lastDreamAt: number;
        totalInsights: number;
    };
    shutdown(): void;
}
export declare function createDreamEngine(config?: Partial<DreamConfig>): DreamEngine;
//# sourceMappingURL=index.d.ts.map