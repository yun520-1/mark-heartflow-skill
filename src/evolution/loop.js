/**
 * EvolutionLoop - 自我进化循环引擎
 * 心虫自我进化核心模块
 */

const { SelfEvolutionCore } = require('../core/self-evolution/self-evolution-core.js');

class EvolutionLoop {
    constructor(hf) {
        this.hf = hf;
        this.core = null;
        this.cycleCount = 0;
    }

    boot() {
        this.core = new SelfEvolutionCore();
        return this;
    }

    evolve(context = {}) {
        this.cycleCount++;
        if (this.core && typeof this.core.evolve === 'function') {
            return this.core.evolve(context);
        }
        return { cycles: this.cycleCount, insights: [] };
    }

    recordOutcome(params = {}) {
        if (this.core && typeof this.core.recordOutcome === 'function') {
            return this.core.recordOutcome(params);
        }
        return { recorded: false };
    }

    retrieveLessons(task) {
        if (this.core && typeof this.core.retrieveLessons === 'function') {
            return this.core.retrieveLessons(task);
        }
        return [];
    }

    heal(error) {
        if (this.core && typeof this.core.heal === 'function') {
            return this.core.heal(error);
        }
        return { healed: false, error: error?.message || String(error) };
    }

    getStats() {
        return {
            cycleCount: this.cycleCount,
            enabled: !!this.core,
            version: 'v1.0.0'
        };
    }

    shutdown() {
        this.core = null;
    }
}

module.exports = { EvolutionLoop };
