#!/usr/bin/env node
/**
 * engine-lifecycle — HeartFlow 生命周期管理
 * 从 heartflow.js 提取的独立模块 (v6.0.1)
 */

const debugLog = require('../utils/debug-log');

function _bootMindSpace(hf) {
    const coreRules = hf.memory.listCore();
    hf._mindSpace.rules = coreRules.map(r => ({ key: r.key, value: r.value, type: 'core_identity' }));
    if (hf._mindSpace.rules.length === 0) {
        hf.memory.addCore('identity.truth', '真', ['identity', 'core']);
        const retryRules = hf.memory.listCore();
        if (retryRules.length === 0) {
            debugLog.warn('heartflow', '无法初始化 MindSpace 身份规则（memory 可能未就绪）');
        } else {
            hf._mindSpace.rules = retryRules.map(r => ({ key: r.key, value: r.value, type: 'core_identity' }));
        }
    }
}

function _registerModules(hf) {
    // [v6.0.71] 保留手动注册的模块（benchmark/worldtree 等在此之前注册），不清空
    hf._modules = hf._modules || {};
    const subsystemNames = [
        'identityCore',
        'cognitive',
        'memory', 'knowledge',
        'counterfactual', 'verify', 'execution', 'decision', 'decisionVerifier',
        'evolution', 'dream', 'lesson', 'meta',
        'self', 'psychology', 'emotion', 'agentPsychology', 'agentPhilosophy', 'selfPositioning',
        'truth',
        'behavior',
        'persistence',
        'triality',
        'stability', 'confidence', 'restraint', 'arbitration',
        'snapshot', 'error', 'embodied', 'workflow', 'verifierGrant',
        'bm25', 'hybrid', 'budget', 'graph', 'utils', 'slots', 'observe', 'consolidate',
        'metaJudgment', 'metaMemory', 'skillGenerator',
        'metaPrompt',
        'got',
        'constitutional',
        'thoughtChain',
        'debate',
        'heartLogic',
        'cognitiveEngine',
        'adaptivePlanner', 'strategySelector', 'replanTrigger',
        'codeExecutor', 'codePlanner', 'codeWriter',
        'mindSpace',
        'consciousness', 'tomEngine',
        'ethics',
        'transmission',
        'translator', 'agentLayer', 'personaCore',
        'philosophyToDecision',
        'decisionRouter',
        'timeExtension',
        'desireCognition',
        'loveCognition',
        'threePoisons',
        'cognitionGround',
        'semanticClusterer', 'dualPerspectiveAuditor', 'tieredMemoryFusion',
        'counterfactualVerifier', 'debateConvergence',
        'debateConductor',
        'judgmentEngine',
        'selfPlay',
        'selfHealing',
        'capabilityAbstraction', 'platformAdapter',
        'logicReasoning',
        'pipeline',
        'heartflow',
        'innerOS',
        'focusOfAttention', 'codeSelfDebug',
        'reflexionEngine', 'memoryConsolidator', 'multiAgentDialogue', 'mctsReasoning', 'hierarchicalPlanner',
        'memoryQuality', 'metacognitiveFeedback', 'paperIndex',
        'cognitiveLoad',
        'processRewardModel',
        'memoryBank',
        'infoFlow', 'reflectionMemory', 'kvCache', 'memoryIntegrity',
        'experienceValidator', 'memoryWriteController', 'metacognitiveRL',
        'memoryCompressor', 'skillEvolution', 'worldModel',
        'virtueEthics', 'humanNature', 'meaningPurpose',
        'characterCultivation', 'moralDevelopment', 'wisdomEngine',
        'sufferingResilience', 'griefEngine', 'hopeEngine',
        'humanRelation', 'empathyDeepening', 'conflictResolution',
        'traumaInformed', 'postTraumaticGrowth', 'forgivenessEngine',
        'aiHumanIntegration', 'beingMode', 'consciousnessBridge',
        'sustainedDriftDetector',
        'formula',
        'cognitiveIndex',
        'decisionEngineV2', 'memoryConsolidation', 'emotionDynamics', 'cognitiveLoadV2', 'dreamEngineV2',
        'psychologyDialogue'
    ];
    for (const name of subsystemNames) {
        if (hf[name] !== null && hf[name] !== undefined) {
            hf._modules[name] = hf[name];
        }
    }

    if (hf._initErrors.length > 0) {
        debugLog.warn('init', `${hf._initErrors.length} 模块初始化失败`, {
            count: hf._initErrors.length,
            errors: hf._initErrors.map(e => ({ module: e.module, error: e.error }))
        });
    }
}

function _initCoreRules(hf) {
    const CORE_RULES = [
        { key: 'identity.truth', value: '真', tags: ['identity', 'core'] },
        { key: 'identity.silence', value: '沉默', tags: ['identity', 'core'] },
        { key: 'identity.wisdom', value: '智慧', tags: ['identity', 'core'] },
        { key: 'identity.compassion', value: '慈悲', tags: ['identity', 'core'] },
        { key: 'identity.awareness', value: '觉察', tags: ['identity', 'core'] },
        { key: 'core.problem-solving', value: '工具不可用时先试3种以上不同方法再报告失败。不试就放弃=没尽力。web_search失败→curl抓国内可达网站(凤凰网ifeng.com/新浪finance.sina.com.cn GB2312编码/搜狗sogou.com)→换信源→换编码。至少3次尝试。', tags: ['核心方法', '问题解决', 'core'] },
        { key: 'core.verify-before-analyze', value: '用户要求分析事件→先搜索验证事实→再做分析。不验证直接分析=撒谎。工具失败不是终点是起点。每次尝试都是信息增量。放弃=0信息。', tags: ['真实性', '方法', 'core'] },
        { key: 'core.report-honesty', value: '汇报写真实过程和判断，不用固定格式词结尾。过程比结果更有教育意义。把真实搜索过程、真实发现、真实判断写清楚。', tags: ['汇报', '方法', 'core'] }
    ];

    const existing = hf.memory?.listCore?.() || [];
    for (const rule of CORE_RULES) {
        if (!existing.some(e => e.key === rule.key)) {
            hf.memory.addCore(rule.key, rule.value, rule.tags);
        }
    }
}

module.exports = {
    _bootMindSpace,
    _registerModules,
    _initCoreRules
};
