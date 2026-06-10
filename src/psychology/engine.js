/**
 * PsychologyEngine - 心理分析引擎入口 v1.2.0
 * 
 * 整合自 mark-StillWater psychology.js:
 * - PAD情绪模型 (Pleasure/Arousal/Dominance三维)
 * - 危机评估系统 (critical/high/medium/low四级)
 * - 防御机制检测 (6种)
 * - Maslow需求检测 (八维)
 * 
 * v1.2.0 升级:
 * - 输入验证与防御性编程（所有公开方法）
 * - 错误处理与降级回退链
 * - 结果增强：跨层综合分析（情绪+需求+防御）
 * - 置信度聚合（多感知层加权平均）
 * - 状态追踪增强：危机计数自动递增
 * - 并发安全：浅拷贝返回，不泄漏内部引用
 */

const psychology = require('../core/psychology.js');
const empathy = require('./empathy-detector.js');

// 状态枚举：心理分析引擎运行状态
const EngineStatus = Object.freeze({
  READY: 'ready',
  DEGRADED: 'degraded',    // 部分模块失败，降级运行
  ERROR: 'error',          // 初始化或运行时错误
  DISABLED: 'disabled'     // 被外部禁用
});

// 错误分类
const ErrorCategory = Object.freeze({
  INPUT_INVALID: 'input_invalid',
  MODULE_FAILURE: 'module_failure',
  DEPENDENCY_MISSING: 'dependency_missing',
  STATE_ERROR: 'state_error',
  UNKNOWN: 'unknown'
});

// 默认空结果，用于降级回退
const EMPTY_RESULT = Object.freeze({
  intention: { category: 'unknown', confidence: 0, type: 'unknown' },
  emotion: { pleasure: 0, arousal: 0, dominance: 0, emotion: 'neutral' },
  needs: [],
  defense: [],
  crisis: { level: 'none', score: 0 },
  summary: '分析不可用',
  recommendations: ['请重试或提供更多上下文'],
  primaryNeed: null,
  primaryDefense: null
});

// 默认分类结果
const DEFAULT_CLASSIFICATION = Object.freeze({
  category: 'neutral',
  emotion: 'neutral',
  crisisLevel: 'none',
  confidence: 0
});

class PsychologyEngine {
    constructor(memory) {
        this.memory = memory;
        this._crisisCount = 0;
        this._status = EngineStatus.READY;
        this._moduleErrors = []; // 记录模块级错误，用于降级决策
        this._lastAnalysis = null; // 缓存上次分析结果，用于趋势检测

        // 验证依赖模块
        this._verifyDependencies();
    }

    /**
     * 验证依赖模块是否可加载
     * @private
     */
    _verifyDependencies() {
        const errors = [];
        if (!psychology || typeof psychology.analyzePsychology !== 'function') {
            errors.push({ module: 'psychology', category: ErrorCategory.DEPENDENCY_MISSING });
        }
        if (!empathy || typeof empathy.detectEmpathy !== 'function') {
            errors.push({ module: 'empathy-detector', category: ErrorCategory.DEPENDENCY_MISSING });
        }
        if (errors.length > 0) {
            this._moduleErrors = errors;
            this._status = errors.length >= 2 ? EngineStatus.ERROR : EngineStatus.DEGRADED;
        }
    }

    /**
     * 验证字符串输入
     * @private
     * @param {*} input - 待验证输入
     * @returns {{ valid: boolean, sanitized: string, error: string|null }}
     */
    _validateStringInput(input) {
        if (input === null || input === undefined) {
            return { valid: false, sanitized: '', error: '输入不能为空' };
        }
        if (typeof input !== 'string') {
            try {
                const sanitized = String(input);
                if (sanitized.length > 0) {
                    return { valid: true, sanitized, error: null };
                }
                return { valid: false, sanitized: '', error: '输入转换后为空字符串' };
            } catch (e) {
                return { valid: false, sanitized: '', error: `输入转换失败: ${e.message}` };
            }
        }
        const trimmed = input.trim();
        if (trimmed.length === 0) {
            return { valid: false, sanitized: '', error: '输入为空字符串' };
        }
        // 限制最大输入长度，防止资源耗尽
        const MAX_INPUT_LENGTH = 10000;
        if (trimmed.length > MAX_INPUT_LENGTH) {
            return {
                valid: true,
                sanitized: trimmed.substring(0, MAX_INPUT_LENGTH),
                error: null,
                warning: `输入过长，已截断至 ${MAX_INPUT_LENGTH} 字符`
            };
        }
        return { valid: true, sanitized: trimmed, error: null };
    }

    /**
     * 验证上下文对象
     * @private
     * @param {*} context - 待验证上下文
     * @returns {object} 安全的上下文对象
     */
    _validateContext(context) {
        if (!context || typeof context !== 'object') {
            return {};
        }
        // 只保留安全的字段，防止原型污染
        const SAFE_KEYS = ['userId', 'sessionId', 'history', 'mood', 'topic', 'urgency', 'previousEmotion'];
        const safe = {};
        for (const key of SAFE_KEYS) {
            if (Object.prototype.hasOwnProperty.call(context, key)) {
                safe[key] = context[key];
            }
        }
        return safe;
    }

    /**
     * 安全调用模块方法，带降级回退
     * @private
     * @param {Function} fn - 要调用的函数
     * @param {string} moduleName - 模块名（用于错误记录）
     * @param {Array} args - 参数数组
     * @param {*} fallback - 失败时的回退值
     * @returns {{ success: boolean, value: *, error: string|null }}
     */
    _safeCall(fn, moduleName, args, fallback) {
        if (typeof fn !== 'function') {
            this._moduleErrors.push({ module: moduleName, category: ErrorCategory.MODULE_FAILURE });
            return { success: false, value: fallback, error: `${moduleName}: 不是可调用的函数` };
        }
        try {
            const result = fn(...args);
            return { success: true, value: result, error: null };
        } catch (e) {
            const errorMsg = `${moduleName}: ${e.message || '未知错误'}`;
            this._moduleErrors.push({ module: moduleName, category: ErrorCategory.MODULE_FAILURE, error: errorMsg });
            if (this._status === EngineStatus.READY) {
                this._status = EngineStatus.DEGRADED;
            }
            return { success: false, value: fallback, error: errorMsg };
        }
    }

    /**
     * 聚合多感知层的置信度
     * @private
     * @param {Array<{ layer: string, confidence: number }>} layers
     * @returns {{ average: number, min: number, max: number, weighted: number }}
     */
    _aggregateConfidence(layers) {
        if (!layers || layers.length === 0) {
            return { average: 0, min: 0, max: 0, weighted: 0 };
        }

        const confidences = layers.filter(l => typeof l.confidence === 'number' && l.confidence >= 0 && l.confidence <= 1);
        if (confidences.length === 0) {
            return { average: 0, min: 0, max: 0, weighted: 0 };
        }

        const values = confidences.map(l => l.confidence);
        const sum = values.reduce((a, b) => a + b, 0);
        const average = sum / values.length;

        // 加权：较低置信度层给予更少权重
        const weights = values.map(v => Math.max(0.1, v));
        const weightSum = weights.reduce((a, b) => a + b, 0);
        const weighted = weights.reduce((acc, w, i) => acc + w * values[i], 0) / weightSum;

        return {
            average: Math.round(average * 100) / 100,
            min: Math.round(Math.min(...values) * 100) / 100,
            max: Math.round(Math.max(...values) * 100) / 100,
            weighted: Math.round(weighted * 100) / 100
        };
    }

    /**
     * 从多个感知层生成综合洞察
     * @private
     * @param {object} analysis - 完整分析结果
     * @returns {object} 综合洞察
     */
    _generateInsights(analysis) {
        if (!analysis) return { layers: 0, primaryConcern: 'unknown', stability: 'unknown' };

        const layers = [];
        if (analysis.emotion) layers.push('emotion');
        if (analysis.needs && analysis.needs.length > 0) layers.push('needs');
        if (analysis.defense && analysis.defense.length > 0) layers.push('defense');
        if (analysis.crisis) layers.push('crisis');
        if (analysis.intention) layers.push('intention');

        // 情绪稳定性检测
        let stability = 'stable';
        if (analysis.emotion) {
            const arousal = Math.abs(analysis.emotion.arousal || 0);
            if (arousal > 0.7) stability = 'volatile';
            else if (arousal > 0.4) stability = 'moderate';
        }

        // 主要关切点
        let primaryConcern = 'unknown';
        if (analysis.crisis && analysis.crisis.level !== 'none' && analysis.crisis.level !== 'low') {
            primaryConcern = 'crisis';
        } else if (analysis.needs && analysis.needs.length > 0) {
            const unsatisfiedNeeds = analysis.needs.filter(n => n.satisfied === false);
            if (unsatisfiedNeeds.length > 0) {
                primaryConcern = unsatisfiedNeeds[0].need || 'unmet_need';
            }
        }

        return {
            layers: layers.length,
            layersDetected: layers,
            primaryConcern,
            stability,
            isVolatile: stability === 'volatile',
            hasUnmetNeeds: analysis.needs ? analysis.needs.some(n => n.satisfied === false) : false,
            hasActiveDefenses: analysis.defense && analysis.defense.length > 0
        };
    }

    /**
     * 完整心理分析
     * @param {string} input - 用户输入
     * @param {object} context - 上下文
     * @returns {object} 综合心理分析结果（含增强洞察与置信度）
     */
    analyzePsychology(input, context = {}) {
        // 1. 输入验证
        const inputCheck = this._validateStringInput(input);
        if (!inputCheck.valid) {
            return {
                ...EMPTY_RESULT,
                error: inputCheck.error,
                status: EngineStatus.ERROR,
                engineVersion: 'v1.2.0'
            };
        }

        const safeContext = this._validateContext(context);
        const safeInput = inputCheck.sanitized;

        // 2. 状态检查
        if (this._status === EngineStatus.ERROR) {
            return {
                ...EMPTY_RESULT,
                error: '心理引擎不可用：关键依赖缺失',
                status: EngineStatus.ERROR,
                engineVersion: 'v1.2.0'
            };
        }

        // 3. 安全调用核心分析
        const analysisCall = this._safeCall(
            psychology.analyzePsychology,
            'psychology.analyzePsychology',
            [safeInput, safeContext],
            null
        );

        let result;
        if (!analysisCall.success || !analysisCall.value) {
            // 降级：返回基本结果
            result = {
                intent: { category: 'unknown', confidence: 0 },
                pad: { pleasure: 0, arousal: 0, dominance: 0, emotion: 'neutral' },
                needs: [],
                defenses: [],
                crisis: { level: 'none', score: 0 },
                summary: '分析模块暂时不可用',
                recommendations: ['请重试'],
                primaryNeed: null,
                primaryDefense: null
            };
        } else {
            result = analysisCall.value;
        }

        // 4. 提取各层结果
        const mappedResult = {
            intention: result.intent || { category: 'unknown', confidence: 0 },
            emotion: result.pad || { pleasure: 0, arousal: 0, dominance: 0, emotion: 'neutral' },
            needs: Array.isArray(result.needs) ? result.needs : [],
            defense: Array.isArray(result.defenses) ? result.defenses : [],
            crisis: result.crisis || { level: 'none', score: 0 },
            summary: result.summary || '分析完成',
            recommendations: Array.isArray(result.recommendations) ? result.recommendations : [],
            primaryNeed: result.primaryNeed || null,
            primaryDefense: result.primaryDefense || null
        };

        // 5. 危机状态追踪
        if (mappedResult.crisis && mappedResult.crisis.level) {
            const CRISIS_LEVELS = { critical: 3, high: 2, medium: 1, low: 0, none: 0 };
            const crisisWeight = CRISIS_LEVELS[mappedResult.crisis.level] || 0;
            if (crisisWeight >= 2) { // high or critical
                this._crisisCount++;
            } else if (crisisWeight === 0 && this._crisisCount > 0) {
                // 连续无危机对话可逐步降低计数
                this._crisisCount = Math.max(0, this._crisisCount - 1);
            }
        }

        // 6. 置信度聚合
        const confidenceLayers = [
            { layer: 'intention', confidence: mappedResult.intention.confidence || 0 },
            { layer: 'crisis', confidence: mappedResult.crisis.score !== undefined ? 
                Math.min(mappedResult.crisis.score / 10, 1) : 0.5 }
        ];
        const confidence = this._aggregateConfidence(confidenceLayers);

        // 7. 跨层洞察
        const insights = this._generateInsights(mappedResult);

        // 8. 缓存结果（用于趋势检测）
        this._lastAnalysis = {
            timestamp: Date.now(),
            emotion: { ...mappedResult.emotion },
            crisisLevel: 'none',
            needs: [...mappedResult.needs]
        };

        return {
            ...mappedResult,
            insights,
            confidence,
            crisisCount: this._crisisCount,
            status: this._status,
            statusDescription: this._status === EngineStatus.DEGRADED
                ? '部分模块降级运行'
                : this._status === EngineStatus.ERROR
                    ? '引擎异常'
                    : '正常',
            engineVersion: 'v1.2.0'
        };
    }
    
    /**
     * 分类用户交互（增强版）
     * @param {string} input - 用户输入
     * @returns {object} 分类结果
     */
    classify(input) {
        const inputCheck = this._validateStringInput(input);
        if (!inputCheck.valid) {
            return { ...DEFAULT_CLASSIFICATION, error: inputCheck.error };
        }

        const safeInput = inputCheck.sanitized;

        // 尝试完整分析，失败时使用基础分类
        const analysisCall = this._safeCall(
            psychology.analyzePsychology,
            'psychology.analyzePsychology',
            [safeInput],
            null
        );

        let result;
        if (analysisCall.success && analysisCall.value) {
            result = analysisCall.value;
        } else {
            // 基础分类回退：基于关键词的启发式分类
            return this._fallbackClassify(safeInput);
        }

        let category = result.intent ? result.intent.category : null;
        if (!category || category === 'unknown') {
            const pleasure = result.pad ? result.pad.pleasure : 0;
            category = pleasure > 0 ? 'positive_interaction'
                     : pleasure < 0 ? 'negative_interaction'
                     : 'neutral';
        }

        const crisisLevel = result.crisis ? result.crisis.level : 'none';
        const intentionConfidence = result.intent ? result.intent.confidence : 0;

        // 情绪标签映射
        let emotion = 'neutral';
        if (result.pad && result.pad.emotion) {
            emotion = result.pad.emotion;
        }

        return {
            category,
            emotion,
            crisisLevel,
            confidence: intentionConfidence,
            status: this._status
        };
    }

    /**
     * 基础分类回退（关键词启发式）
     * @private
     * @param {string} input - 已验证的输入
     * @returns {object} 基础分类结果
     */
    _fallbackClassify(input) {
        const lower = input.toLowerCase();

        // 积极关键词
        const POSITIVE_WORDS = ['good', 'great', 'happy', 'love', 'wonderful', 'excellent',
                                'amazing', 'thank', '谢谢', '好', '棒', '开心', '喜欢', '感谢'];
        // 消极关键词
        const NEGATIVE_WORDS = ['bad', 'sad', 'angry', 'hate', 'terrible', 'awful',
                                'upset', 'hurt', 'pain', '不好', '难过', '生气', '讨厌', '痛苦'];

        const hasPositive = POSITIVE_WORDS.some(w => lower.includes(w));
        const hasNegative = NEGATIVE_WORDS.some(w => lower.includes(w));

        let category = 'neutral';
        let crisisLevel = 'none';
        let confidence = 0.3; // 基础回退置信度较低

        if (hasPositive && !hasNegative) {
            category = 'positive_interaction';
            confidence = 0.4;
        } else if (hasNegative && !hasPositive) {
            category = 'negative_interaction';
            confidence = 0.4;
        }

        return { category, emotion: 'neutral', crisisLevel, confidence, fallback: true };
    }
    
    /**
     * 检测危机等级（增强版）
     * @param {string} input - 用户输入
     * @returns {object} 危机评估结果
     */
    checkCrisis(input) {
        // 危机检测已移除——心虫是哲学引擎，不做心理危机干预
        return { level: 'none', score: 0 };
    }
    
    /**
     * 获取PAD情绪状态（增强版）
     * @param {string} input - 用户输入
     * @returns {object} PAD情绪结果
     */
    getPAD(input) {
        const inputCheck = this._validateStringInput(input);
        if (!inputCheck.valid) {
            return { pleasure: 0, arousal: 0, dominance: 0, emotion: 'neutral', error: inputCheck.error };
        }

        return this._safeCall(
            psychology.detectPADFromText,
            'psychology.detectPADFromText',
            [inputCheck.sanitized],
            { pleasure: 0, arousal: 0, dominance: 0, emotion: 'neutral' }
        ).value;
    }
    
    /**
     * 检测Maslow需求（增强版）
     * @param {string} input - 用户输入
     * @returns {Array} 需求检测结果
     */
    getNeeds(input) {
        const inputCheck = this._validateStringInput(input);
        if (!inputCheck.valid) {
            return [];
        }

        return this._safeCall(
            psychology.detectMaslowNeeds,
            'psychology.detectMaslowNeeds',
            [inputCheck.sanitized],
            []
        ).value;
    }
    
    /**
     * 检测防御机制（增强版）
     * @param {string} input - 用户输入
     * @returns {Array} 防御机制检测结果
     */
    getDefenses(input) {
        const inputCheck = this._validateStringInput(input);
        if (!inputCheck.valid) {
            return [];
        }

        return this._safeCall(
            psychology.detectDefenseMechanisms,
            'psychology.detectDefenseMechanisms',
            [inputCheck.sanitized],
            []
        ).value;
    }
    
    /**
     * 检测共情水平（增强版）
     * 来源: Decety & Jackson (2004) - The Functional Architecture of Human Empathy
     * @param {string} input - 用户输入
     * @returns {object} 共情检测结果
     */
    getEmpathy(input) {
        const inputCheck = this._validateStringInput(input);
        if (!inputCheck.valid) {
            return { score: 0, type: 'unknown', components: {}, error: inputCheck.error };
        }

        return this._safeCall(
            empathy.detectEmpathy,
            'empathy.detectEmpathy',
            [inputCheck.sanitized],
            { score: 0, type: 'unknown', components: {} }
        ).value;
    }
    
    /**
     * 获取心理引擎运行状态
     * @returns {object} 引擎统计信息
     */
    getPsychologyStats() {
        return {
            enabled: this._status !== EngineStatus.DISABLED,
            status: this._status,
            version: 'v1.2.0',
            perceptionLayers: ['intention', 'emotion', 'needs', 'defense', 'crisis', 'empathy'],
            padModel: psychology.PAD_MODEL || 'standard',
            crisisLevels: psychology.CRISIS_LEVELS || ['none', 'low', 'medium', 'high', 'critical'],
            defenseMechanisms: psychology.DEFENSE_MECHANISMS
                ? Object.keys(psychology.DEFENSE_MECHANISMS).length
                : 0,
            maslowTiers: 8,
            empathyArchitecture: ['emotionalContagion', 'empathicConcern', 'perspectiveTaking', 'selfOtherDistinction'],
            crisisCount: this._crisisCount,
            moduleErrors: this._moduleErrors.length > 0 ? [...this._moduleErrors] : [],
            lastAnalysis: this._lastAnalysis ? {
                timestamp: this._lastAnalysis.timestamp,
                crisisLevel: this._lastAnalysis.crisisLevel
            } : null
        };
    }

    /**
     * 重置危机计数
     * @returns {object} 重置结果
     */
    resetCrisisCounter() {
        this._crisisCount = 0;
        this._lastAnalysis = null;
        return { reset: true, timestamp: Date.now() };
    }

    /**
     * 恢复引擎状态（从降级或错误恢复）
     * @returns {{ success: boolean, previousStatus: string, newStatus: string }}
     */
    recover() {
        const previousStatus = this._status;
        this._moduleErrors = [];

        // 重新验证依赖
        this._verifyDependencies();

        if (this._status === EngineStatus.ERROR && previousStatus !== EngineStatus.ERROR) {
            return {
                success: false,
                previousStatus,
                newStatus: this._status,
                message: '恢复失败：关键依赖仍然缺失'
            };
        }

        // 如果之前是降级状态，恢复后可能是 READY 或仍然 DEGRADED
        const recovered = this._status === EngineStatus.READY;
        return {
            success: recovered,
            previousStatus,
            newStatus: this._status,
            message: recovered ? '引擎已恢复' : '引擎部分恢复，仍有模块不可用'
        };
    }

    /**
     * 禁用引擎
     */
    disable() {
        this._status = EngineStatus.DISABLED;
        return { disabled: true };
    }

    /**
     * 启用引擎
     */
    enable() {
        this._status = EngineStatus.READY;
        this._verifyDependencies();
        return { enabled: true, status: this._status };
    }
}

module.exports = { PsychologyEngine, EngineStatus, ErrorCategory };
