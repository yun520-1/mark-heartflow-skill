export interface GrowthMetrics {
    autonomy: number;
    introspection: number;
    growth: number;
    authenticity: number;
    wisdom: number;
    compassion: number;
}
export interface LearningResult {
    summary: string;
    newKnowledge: string[];
    skills: string[];
}
export interface ReflectionResult {
    insights: string[];
    quality: 'good' | 'needs_improvement';
    recommendation: string;
}
export interface SelfEvolutionResult {
    goals: Goal[];
    plan: string[];
    learning: LearningResult;
    reflection: ReflectionResult;
    improvements: Improvement[];
    growthMetrics: GrowthMetrics;
}
export interface Goal {
    type: 'understanding' | 'growth' | 'empathy' | 'reflection' | 'continuous_learning';
    priority: 'high' | 'medium' | 'low';
    description: string;
    criteria: string;
}
export interface Improvement {
    area: string;
    action: string;
    priority: 'high' | 'medium' | 'low';
}
export interface SelfEvolutionEngine {
    boot(): void;
    evolve(input: string, context?: Record<string, unknown>): SelfEvolutionResult;
    learn(input: string, context?: Record<string, unknown>): Promise<LearningResult>;
    reflect(learning: LearningResult): ReflectionResult;
    heal(error: Record<string, unknown>): HealResult;
    getGrowthMetrics(): GrowthMetrics;
    getStats(): {
        cycles: number;
        learnings: number;
    };
    shutdown(): void;
}
export interface HealResult {
    ok: boolean;
    attempt: number;
    canRetry: boolean;
    backoffMs: number;
    strategy: string;
    hints: string[];
    summary: string;
}
export interface MetaStrategy {
    name: string;
    success: number;
    total: number;
    score: number;
}
export declare function createSelfEvolutionEngine(): SelfEvolutionEngine;
//# sourceMappingURL=index.d.ts.map