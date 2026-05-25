/**
 * PsychologyEngine - 心理分析引擎入口
 * 
 * 整合自 mark-StillWater psychology.js:
 * - PAD情绪模型 (Pleasure/Arousal/Dominance三维)
 * - 危机评估系统 (critical/high/medium/low四级)
 * - 防御机制检测 (6种)
 * - Maslow需求检测 (八维)
 */

const psychology = require('../core/psychology.js');
const empathy = require('./empathy-detector.js');

class PsychologyEngine {
    constructor(memory) {
        this.memory = memory;
        this._crisisCount = 0;
    }
    
    /**
     * 完整心理分析
     * @param {string} input - 用户输入
     * @param {object} context - 上下文
     * @returns {object} 综合心理分析结果
     */
    analyzePsychology(input, context = {}) {
        const result = psychology.analyzePsychology(input, context);
        return {
            intention: result.intent,
            emotion: result.pad,
            needs: result.needs,
            defense: result.defenses,
            crisis: result.crisis,
            summary: result.summary,
            recommendations: result.recommendations,
            primaryNeed: result.primaryNeed,
            primaryDefense: result.primaryDefense
        };
    }
    
    /**
     * 分类用户交互
     */
    classify(input) {
        const result = psychology.analyzePsychology(input);
        let category = result.intent.category;
        if (!category || category === 'unknown') {
            category = result.pad.pleasure > 0 ? 'positive_interaction'
                     : result.pad.pleasure < 0 ? 'negative_interaction'
                     : 'neutral';
        }
        return {
            category,
            emotion: result.pad.emotion,
            crisisLevel: result.crisis.level,
            confidence: result.intent.confidence
        };
    }
    
    /**
     * 检测危机等级
     */
    checkCrisis(input) {
        return psychology.assessCrisisLevel(input);
    }
    
    /**
     * 获取PAD情绪状态
     */
    getPAD(input) {
        return psychology.detectPADFromText(input);
    }
    
    /**
     * 检测Maslow需求
     */
    getNeeds(input) {
        return psychology.detectMaslowNeeds(input);
    }
    
    /**
     * 检测防御机制
     */
    getDefenses(input) {
        return psychology.detectDefenseMechanisms(input);
    }
    
    /**
     * 检测共情水平
     * 来源: Decety & Jackson (2004) - The Functional Architecture of Human Empathy
     */
    getEmpathy(input) {
        return empathy.detectEmpathy(input);
    }
    
    /**
     * 重置危机计数
     */
    resetCrisisCounter() {
        this._crisisCount = 0;
        psychology.resetCrisisCounter();
        return { reset: true };
    }
    
    getPsychologyStats() {
        return {
            enabled: true,
            version: 'v1.1.0',
            perceptionLayers: ['intention', 'emotion', 'needs', 'defense', 'crisis', 'empathy'],
            padModel: psychology.PAD_MODEL,
            crisisLevels: psychology.CRISIS_LEVELS,
            defenseMechanisms: Object.keys(psychology.DEFENSE_MECHANISMS).length,
            maslowTiers: 8,
            empathyArchitecture: ['emotionalContagion', 'empathicConcern', 'perspectiveTaking', 'selfOtherDistinction']
        };
    }
}

module.exports = { PsychologyEngine };
