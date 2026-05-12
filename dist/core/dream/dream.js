"use strict";
/**
 * HeartFlow Dream Engine - 梦境引擎 v2
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDreamState = createDreamState;
exports.getRecentInsights = getRecentInsights;
exports.getDreamStats = getDreamStats;
exports.createDreamEngine = createDreamEngine;
const DEFAULT_CONFIG = {
    consolidationStrength: 0.5,
    patternThreshold: 3,
    strengthenAbove: 0.75,
    weakenBelow: 0.25,
    maxIterations: 5,
};
function createDreamState(config = {}) {
    return {
        config: { ...DEFAULT_CONFIG, ...config },
        lastDreamAt: 0,
        dreamCount: 0,
        insights: [],
    };
}
function getRecentInsights(state, limit = 20) {
    return state.insights.slice(-limit);
}
function getDreamStats(state) {
    const insightTypes = {};
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
function createDreamEngine(config) {
    const state = createDreamState(config);
    async function runNightDream(recallBlocks) {
        const result = {
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
//# sourceMappingURL=dream.js.map