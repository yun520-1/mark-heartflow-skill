"use strict";
// Dream Engine — 睡眠循环 + 记忆巩固
// Inherits from: dream.ts, dream-consolidator.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDreamEngine = createDreamEngine;
const DEFAULT_CONFIG = {
    consolidationStrength: 0.5,
    patternThreshold: 3,
    strengthenAbove: 0.75,
    weakenBelow: 0.25,
    maxIterations: 5,
    autoRun: false,
    intervalMs: 60000,
};
function createDreamEngine(config = {}) {
    const cfg = { ...DEFAULT_CONFIG, ...config };
    const state = {
        dreamCount: 0,
        lastDreamAt: 0,
        insights: [],
        timer: null,
    };
    function boot() {
        console.log('[DreamEngine] boot — sleep cycle ready');
        if (cfg.autoRun) {
            state.timer = setInterval(() => {
                // Auto-dream on interval (simplified — real impl would access memory)
            }, cfg.intervalMs);
        }
    }
    async function dream(blocks = [], _recallIndex) {
        const start = Date.now();
        const result = {
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
            const insight = {
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
            if (result.cycles >= cfg.maxIterations)
                break;
            const b = block;
            if (b.importance === undefined)
                continue;
            const age = (nowTs - (b.createdAt || 0)) / (24 * 3600 * 1000);
            if (b.importance >= cfg.strengthenAbove) {
                const boost = (b.accessCount || 0) * 0.01 * cfg.consolidationStrength;
                b.importance = Math.min(1, (b.importance || 0) + boost);
                result.strengthened.push(String(block.id || 'unknown'));
            }
            else if (b.importance <= cfg.weakenBelow) {
                const decay = Math.pow(0.95, age / 7);
                b.importance = Math.max(0, (b.importance || 0) * decay);
                result.weakened.push(String(block.id || 'unknown'));
            }
            result.cycles++;
        }
        // Phase 3: Connection Discovery
        const connections = findConnections(blocks, patterns);
        for (const c of connections) {
            const insight = {
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
    function getInsights() {
        return state.insights.slice(-20);
    }
    function getStats() {
        return {
            dreamCount: state.dreamCount,
            lastDreamAt: state.lastDreamAt,
            totalInsights: state.insights.length,
        };
    }
    function shutdown() {
        if (state.timer)
            clearInterval(state.timer);
        console.log('[DreamEngine] shutdown');
    }
    return { boot, dream, getInsights, getStats, shutdown };
}
// ── Internal Helpers ─────────────────────────────────────────────────────────
function buildTagFrequency(blocks) {
    const freq = new Map();
    for (const block of blocks) {
        const b = block;
        if (!b.tags)
            continue;
        for (const tag of b.tags) {
            if (!freq.has(tag))
                freq.set(tag, { freq: 0, blockIds: [] });
            const entry = freq.get(tag);
            entry.freq++;
            if (b.id && !entry.blockIds.includes(b.id))
                entry.blockIds.push(b.id);
        }
    }
    return freq;
}
function extractPatterns(tagFreq, threshold) {
    const patterns = [];
    for (const [tag, data] of tagFreq) {
        if (data.freq >= threshold) {
            patterns.push({ tags: [tag], freq: data.freq, blockIds: data.blockIds });
        }
    }
    return patterns;
}
function findConnections(blocks, patterns) {
    const connections = [];
    const blockTagMap = new Map();
    for (const block of blocks) {
        const b = block;
        if (!b.id || !b.tags)
            continue;
        blockTagMap.set(b.id, new Set(b.tags));
    }
    for (const [tag, data] of tagFreqFromBlocks(blocks)) {
        if (data.freq >= 2) {
            connections.push({ tag, blockIds: data.blockIds, strength: Math.min(1, data.freq / 5) });
        }
    }
    return connections;
}
function tagFreqFromBlocks(blocks) {
    return buildTagFrequency(blocks);
}
function findMergeCandidates(blocks, patterns, cfg) {
    const merges = [];
    if (cfg.consolidationStrength < 0.4)
        return merges;
    // Simple heuristic: blocks with same tags and low importance
    for (let i = 0; i < blocks.length; i++) {
        for (let j = i + 1; j < blocks.length; j++) {
            const a = blocks[i];
            const b = blocks[j];
            if (a.tags && b.tags && a.tags.some(t => b.tags.includes(t))) {
                if ((a.importance || 0) < 0.3 && (b.importance || 0) < 0.3) {
                    merges.push([blocks[i], blocks[j]]);
                }
            }
        }
    }
    return merges.slice(0, 3); // limit merges per dream cycle
}
//# sourceMappingURL=index.js.map