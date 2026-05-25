/**
 * PsychologyEngine - 入口文件
 * 引用 dist/core/psychology/index.js
 */

const { createPsychologyPerception, perceive } = require('../../dist/core/psychology/index.js');

class PsychologyEngine {
    constructor(memory) {
        this.engine = createPsychologyPerception();
        this.memory = memory;
    }
    
    analyzePsychology(input) {
        return perceive(input);
    }
    
    classify(input) {
        const result = perceive(input);
        return {
            intention: result.intention,
            emotion: result.emotion,
            needs: result.needs,
            defense: result.defense,
            summary: result.summary,
            priority: result.priority
        };
    }
    
    getPsychologyStats() {
        return {
            enabled: true,
            version: 'v1.0.1',
            perceptionLayers: ['intention', 'emotion', 'needs', 'defense']
        };
    }
}

module.exports = { PsychologyEngine };
