/**
 * DreamEngine - 梦境引擎
 * 基于 dist/core/memory/dream.js
 */

const { createDreamState, dream, getDreamStats } = require('../../dist/core/memory/dream.js');

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
        // 获取 memory 的 recall 块
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

    shutdown() {
        this.state = null;
        this.recall = null;
    }
}

module.exports = { DreamEngine };
