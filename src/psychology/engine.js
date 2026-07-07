/**
 * PsychologyEngine — 深度心理学引擎 v2.0.0（修复版）
 *
 * 整合自 mark-StillWater psychology.js（四层感知模型）与三个扩展模块：
 * - BigFivePersonality — 大五人格 OCEAN 模型（对象字面量）
 * - EmpathyAssessment — IRI 共情四维度评估（对象字面量）
 * - IntentionTracker — 意图追踪与偏差提醒
 *
 * ⚠️ 临床免责声明
 * 心虫是 AI 认知引擎，不提供医疗诊断、治疗或临床心理健康服务。
 * 任何心理健康相关的分析和建议仅供参考，不能替代专业心理医生
 * 或精神科医生的诊断和治疗。
 */

const psychology = require('../core/psychology.js');
const empathy = require('./empathy-detector.js');
const BigFivePersonality = require('../core/BigFivePersonality.js');
const EmpathyAssessment = require('../core/EmpathyAssessment.js');
const { intentionTracker } = require('../core/IntentionTracker.js');

/**
 * 深拷贝对象字面量，使每个引擎实例拥有独立的可修改副本
 * @param {object} obj - 源对象（对象字面量或类实例）
 * @returns {object} 拥有独立维度数据的新副本
 */
function cloneModule(obj) {
  const clone = Object.create(Object.getPrototypeOf(obj));
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (key === 'dimensions' && val && typeof val === 'object') {
      clone[key] = JSON.parse(JSON.stringify(val));
    } else if (typeof val === 'function') {
      clone[key] = val.bind ? val.bind(clone) : val;
    } else {
      clone[key] = val;
    }
  }
  return clone;
}

class PsychologyEngine {
    constructor(memory) {
        this.memory = memory;
        this._crisisCount = 0;
        // BigFivePersonality 和 EmpathyAssessment 是对象字面量，需要克隆
        this._bigFive = cloneModule(BigFivePersonality);
        this._empathyAssessment = cloneModule(EmpathyAssessment);
        this._intentionTracker = intentionTracker; // singleton class
    }

    // ═══════════════════════════════════════════════════════════════
    // 1. 原有四层心理分析（intention/emotion/needs/defense/crisis）
    // ═══════════════════════════════════════════════════════════════

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
            primaryDefense: result.primaryDefense,
            _clinicalDisclaimer: result._clinicalDisclaimer
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

    // ═══════════════════════════════════════════════════════════════
    // 2. 扩展：大五人格 OCEAN
    // ═══════════════════════════════════════════════════════════════

    /**
     * 大五人格分析 — 从文本中推断人格特征
     * @param {string} input - 输入文本
     * @returns {object} 大五人格分析报告
     */
    analyzePersonality(input) {
        if (!input) return { error: '缺少输入文本' };

        // 提取情感与行为信号
        const pad = psychology.detectPADFromText(input);
        const needs = psychology.detectMaslowNeeds(input);
        const defenses = psychology.detectDefenseMechanisms(input);

        // 根据多维信号调用 BigFive.adjustFromBehavior（接收中文关键词字符串）
        if (pad.pleasure > 0.3) this._bigFive.adjustFromBehavior('积极情绪，学习新事物');
        if (pad.pleasure < -0.3) this._bigFive.adjustFromBehavior('焦虑紧张，担心压力');
        if (needs.achievement || needs.competence) this._bigFive.adjustFromBehavior('完成目标，计划组织');
        if (needs.relatedness) this._bigFive.adjustFromBehavior('帮助合作，理解支持');
        if (needs.autonomy) this._bigFive.adjustFromBehavior('学习创造，尝试新事物');
        if (defenses?.intellectualization) this._bigFive.adjustFromBehavior('学习分析，理解探索');
        if (defenses?.denial) this._bigFive.adjustFromBehavior('焦虑紧张，压力担心');

        return {
            profile: this._bigFive.getProfile(),
            report: this._bigFive.generateReport(),
            dominant: this._dominantTrait(this._bigFive.getProfile()),
        };
    }

    /** @private 取最突出的维度 */
    _dominantTrait(profile) {
        const dims = profile.dimensions || profile;
        let max = -Infinity, key = '';
        for (const [k, v] of Object.entries(dims)) {
            const score = v.score || v || 0;
            if (score > max) { max = score; key = k; }
        }
        return { dimension: key || 'conscientiousness', score: max };
    }

    // ═══════════════════════════════════════════════════════════════
    // 3. 扩展：共情评估（IRI 四维度）
    // ═══════════════════════════════════════════════════════════════

    /**
     * 共情评估 — 从文本评估共情水平
     * @param {string} input - 输入文本
     * @returns {object} 共情评估报告
     */
    assessEmpathy(input) {
        if (!input) return { error: '缺少输入文本' };

        const quick = this._empathyAssessment.quickAssessment();

        // 从心理分析补充信号
        const pad = psychology.detectPADFromText(input);
        if (pad.dominance < -0.2) {
            this._empathyAssessment.updateDimension('ec', 0.15);
        }

        return {
            quickAssessment: quick,
            full: this._empathyAssessment.interpretScore(50), // 默认中等分
            state: this._empathyAssessment.getState(),
        };
    }

    // ═══════════════════════════════════════════════════════════════
    // 4. 扩展：意图追踪
    // ═══════════════════════════════════════════════════════════════

    /**
     * 意图追踪 — 检测对话意图是否偏离目标
     * @param {string} input - 输入文本
     * @returns {object} 意图追踪报告
     */
    trackIntention(input) {
        if (!input) return { error: '缺少输入文本' };

        const domain = this._intentionTracker.detectDomain(input);
        const keywords = this._intentionTracker.extractKeywords(input);
        const deviation = this._intentionTracker.checkDeviation(input, domain);
        const nudge = this._intentionTracker.generateNudge(deviation);

        return {
            domain,
            keywords,
            deviation,
            nudge: deviation?.deviated ? nudge : null,
            progress: this._intentionTracker.getProgress(),
            goalSummary: this._intentionTracker.generateProgressReport(),
        };
    }

    // ═══════════════════════════════════════════════════════════════
    // 5. 综合分析：大五 + 共情 + 意图全融合
    // ═══════════════════════════════════════════════════════════════

    /**
     * 综合深度心理学分析
     * 融合四层感知 + 大五人格 + 共情评估 + 意图追踪
     * @param {string} input - 输入文本
     * @returns {object} 深度心理学分析报告
     */
    analyzeDeep(input) {
        if (!input) return { error: '缺少输入文本' };

        const base = this.analyzePsychology(input);
        const personality = this.analyzePersonality(input);
        const empathyEval = this.assessEmpathy(input);
        const intention = this.trackIntention(input);

        // 合成摘要
        const profile = personality.profile?.dimensions || personality.profile || {};
        const dominantTrait = typeof personality.dominant?.dimension === 'string'
            ? personality.dominant.dimension : '未知';
        const empathyLevel = empathyEval.full?.level || '未评估';

        let synthesis = `【深度心理画像】大五人格主导维度: ${dominantTrait}`;
        synthesis += `; 当前情绪: ${base.emotion?.emotion || '中性'}`;
        synthesis += `; 共情水平: ${empathyLevel}`;
        if (intention.deviation?.deviated) {
            synthesis += `; 意图偏离提醒: ${intention.deviation.reason || '对话方向偏移'}`;
        }

        return {
            base,
            personality,
            empathy: empathyEval,
            intention,
            synthesis,
            crisisDetected: base.crisis?.level !== 'low' && base.crisis?.level !== 'none',
        };
    }

    // ═══════════════════════════════════════════════════════════════
    // 引擎状态
    // ═══════════════════════════════════════════════════════════════

    getPsychologyStats() {
        return {
            enabled: true,
            version: 'v2.0.0',
            perceptionLayers: ['intention', 'emotion', 'needs', 'defense', 'crisis', 'empathy'],
            deepLayers: ['bigFivePersonality', 'empathyIRI', 'intentionTracking'],
            padModel: psychology.PAD_MODEL,
            crisisLevels: psychology.CRISIS_LEVELS,
            defenseMechanisms: Object.keys(psychology.DEFENSE_MECHANISMS).length,
            maslowTiers: 8,
            empathyArchitecture: ['emotionalContagion', 'empathicConcern', 'perspectiveTaking', 'selfOtherDistinction'],
            bigFiveReady: typeof this._bigFive?.getProfile === 'function',
            empathyIRIReady: typeof this._empathyAssessment?.getState === 'function',
            intentionTrackerReady: !!this._intentionTracker,
        };
    }
}

module.exports = { PsychologyEngine };
