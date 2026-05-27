/**
 * DreamEngine - 梦境引擎
 * 修复版：内联 stub（原 dist/core/memory/dream.js 已移除）
 */

function createDreamState(opts = {}) {
    return {
        consolidationStrength: opts.consolidationStrength ?? 0.5,
        patternThreshold: opts.patternThreshold ?? 3,
        strengthenAbove: opts.strengthenAbove ?? 0.75,
        weakenBelow: opts.weakenBelow ?? 0.25,
        dreamCount: 0,
        lastDreamAt: null,
    };
}

function dream(state, recall) {
    // Stub: no-op dream, returns empty results
    return { insights: [], strengthened: [], weakened: [] };
}

function getDreamStats(state) {
    return {
        dreamCount: state?.dreamCount ?? 0,
        lastDreamAt: state?.lastDreamAt ?? null,
    };
}

class DreamEngine {
    constructor(memory, psychology) {
        this.memory = memory;
        this.psychology = psychology;
        this.state = null;
        this.recall = null;
    }

    boot() {
        this.state = createDreamState({
            consolidationStrength: 0.5,
            patternThreshold: 3,
            strengthenAbove: 0.75,
            weakenBelow: 0.25,
        });
        if (this.memory && typeof this.memory.getRecentBlocks === 'function') {
            const blocks = this.memory.getRecentBlocks(50);
            const blocksMap = new Map();
            for (const b of blocks) {
                if (b && b.id) blocksMap.set(b.id, b);
            }
            this.recall = {
                blocks: blocksMap,
                timeline: new Map(),
                tagIndex: new Map(),
            };
        } else {
            this.recall = { blocks: new Map(), timeline: new Map(), tagIndex: new Map() };
        }
        return this;
    }

    dream() {
        if (!this.state || !this.recall) {
            this.boot();
        }
        try {
            const result = dream(this.state, this.recall);
            this.state.dreamCount++;
            this.state.lastDreamAt = Date.now();
            return result;
        } catch (e) {
            return { insights: [], strengthened: [], weakened: [], error: e.message };
        }
    }

    getDreamStats() {
        return getDreamStats(this.state);
    }

    /**
     * 快速梦境（无记忆整合，轻量）
     */
    quickDream(context = '') {
        if (!this.state) this.boot();
        this.state.dreamCount++;
        return {
            insights: [],
            mode: 'quick',
            context: context.substring(0, 100),
        };
    }

    /**
     * 获取缓存统计（当前无缓存，返回空结构）
     */
    getCacheStats() {
        return {
            cacheSize: 0,
            maxCache: 0,
            hitRate: 0,
            note: '缓存未实现，调用dream()替代',
        };
    }

    shutdown() {
        this.state = null;
        this.recall = null;
    }
}

module.exports = { DreamEngine };
