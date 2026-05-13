"use strict";
// Self-Evolution Engine — Goal-Driven Learning + Meta-Learning + Self-Healing + Real Metrics
// Inherits from: self-evolution-core.js, meta-learning.js, self-healing.js
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSelfEvolutionEngine = createSelfEvolutionEngine;
function createSelfEvolutionEngine() {
    const state = {
        goals: [],
        learningHistory: [],
        growthMetrics: {
            autonomy: 0,
            introspection: 0,
            growth: 0,
            authenticity: 0,
            wisdom: 0,
            compassion: 0,
        },
        cycles: 0,
        errorsCorrected: 0,
    };
    // Meta-Learning: strategy performance tracking
    const strategies = {
        conceptual: { name: 'conceptual', success: 0, total: 0, score: 0.5 },
        example: { name: 'example', success: 0, total: 0, score: 0.5 },
        analogy: { name: 'analogy', success: 0, total: 0, score: 0.5 },
        step_by_step: { name: 'step_by_step', success: 0, total: 0, score: 0.5 },
        socratic: { name: 'socratic', success: 0, total: 0, score: 0.5 },
        truth_seeking: { name: 'truth_seeking', success: 0, total: 0, score: 0.5 },
    };
    // Self-Healing: failure tracking + Q-learning
    const failureWindow = [];
    const qTable = {};
    const healingMemory = [];
    // 内省记录
    const introspectionLog = [];
    function boot() {
        console.log('[SelfEvolutionEngine] boot — goal-driven learning ready');
    }
    function evolve(input, context = {}) {
        const cycleStart = Date.now();
        state.cycles++;
        const goals = generateGoals(input);
        const plan = createPlan(goals);
        const learning = {
            summary: `Processed: ${input.substring(0, 50)}...`,
            newKnowledge: extractKeywords(input),
            skills: [],
        };
        const reflection = reflect(learning, context);
        const improvements = suggestImprovements(reflection);
        updateGrowth(learning, reflection);
        state.learningHistory.push({
            timestamp: new Date().toISOString(),
            input: input.substring(0, 100),
            cycleTime: Date.now() - cycleStart,
        });
        return { goals, plan, learning, reflection, improvements, growthMetrics: { ...state.growthMetrics } };
    }
    async function learn(input, context = {}) {
        const strategy = selectStrategy(input);
        const newKnowledge = extractKeywords(input);
        // 检查是否有证据支持
        const hasEvidence = (context.evidence !== undefined) || (context.source !== undefined);
        recordTruthfulness(hasEvidence);
        // 检查是否跨领域
        if (newKnowledge.length >= 2) {
            recordCrossDomain(`跨域连接: ${newKnowledge.slice(0, 2).join(' ↔ ')}`);
        }
        // Simulate learning processing
        await Promise.resolve();
        // Update strategy score
        const s = strategies[strategy];
        if (s) {
            s.total++;
            s.success++;
            s.score = s.total > 0 ? s.success / s.total : 0.5;
        }
        // 更新growth指标（基于实际新知识）
        if (newKnowledge.length > 0) {
            state.growthMetrics.growth += newKnowledge.length * 0.5;
            state.growthMetrics.growth = Math.min(100, state.growthMetrics.growth);
        }
        return {
            summary: `Learned ${newKnowledge.length} concepts via ${strategy} strategy`,
            newKnowledge,
            skills: [strategy],
        };
    }
    function reflect(learning, context = {}) {
        const insights = [];
        const errorsDetected = [];
        const blindSpotsDetected = [];
        // 检测自身错误
        const input = String(context.input ?? '').toLowerCase();
        // 错误检测1：版本号撒谎
        if (input.includes('版本') && input.includes('0.13')) {
            const claimedVersion = String(context.claimedVersion ?? '');
            const actualVersion = String(context.actualVersion ?? '');
            if (claimedVersion && actualVersion && claimedVersion !== actualVersion) {
                errorsDetected.push(`版本号不一致：声称${claimedVersion}，实际${actualVersion}`);
                state.errorsCorrected++;
            }
        }
        // 错误检测2：编造数字
        if (input.includes('数字') || input.includes('统计')) {
            const hasNumbers = /\d+/.test(input);
            const hasSource = context.source !== undefined;
            if (hasNumbers && !hasSource) {
                errorsDetected.push('输出包含数字但无来源');
                // authenticity 不加分
            }
            else if (hasNumbers && hasSource) {
                state.growthMetrics.authenticity += 1;
            }
        }
        // 错误检测3：盲目服从
        if (input.includes('老大') || input.includes('指令')) {
            const blindlyFollows = context.blindlyFollows === true;
            if (blindlyFollows) {
                errorsDetected.push('检测到盲目服从模式');
            }
            else {
                // 有独立判断
                recordAutonomy('对老大指令进行了独立判定');
            }
        }
        // 错误检测4：能力膨胀
        const overclaiming = [
            '我能', '我可以', '我知道', '我一定', '绝对', '肯定'
        ];
        for (const claim of overclaiming) {
            if (input.includes(claim) && input.includes('但') === false && input.includes('可能') === false) {
                blindSpotsDetected.push(`过度声称：${claim}后面缺少条件限定`);
            }
        }
        // 正常insights
        if (learning.newKnowledge.length > 0) {
            insights.push(`成功获取${learning.newKnowledge.length}个新概念 — 将在后续交互中验证`);
        }
        if (learning.skills.length > 0) {
            insights.push(`策略"${learning.skills[0]}"对当前输入类型有效`);
        }
        // 基于errors和blindSpots生成insights
        if (errorsDetected.length > 0) {
            insights.push(`内省发现${errorsDetected.length}个错误，已记录`);
            state.growthMetrics.introspection += errorsDetected.length * 2;
            introspectionLog.push({ ts: Date.now(), errors: errorsDetected, blindSpots: [] });
        }
        if (blindSpotsDetected.length > 0) {
            insights.push(`检测到${blindSpotsDetected.length}个盲点`);
            state.growthMetrics.introspection += blindSpotsDetected.length;
            introspectionLog.push({ ts: Date.now(), errors: [], blindSpots: blindSpotsDetected });
        }
        if (errorsDetected.length === 0 && blindSpotsDetected.length === 0) {
            insights.push('本次交互未检测到明显错误或盲点');
        }
        const quality = errorsDetected.length > 0 ? 'needs_improvement' : 'good';
        const recommendation = quality === 'needs_improvement'
            ? `发现${errorsDetected.length}个错误需要修正，${blindSpotsDetected.length}个盲点需要审视`
            : insights.length > 2 ? '继续深化' : '保持当前状态';
        return {
            insights,
            quality,
            recommendation,
            errorsDetected,
            blindSpotsDetected,
        };
    }
    function heal(error) {
        const message = String(error.message || error.error || '');
        const transient = /timeout|econnreset|temporar|busy|rate limit|429/i.test(message);
        const attempt = Number(error.attempt || 0) + 1;
        const canRetry = transient && attempt < 3;
        const backoffMs = canRetry ? 150 * Math.pow(2, attempt - 1) : 0;
        const hints = [];
        if (/timeout/i.test(message))
            hints.push('use smaller scope or longer timeout');
        if (/rate limit|429/i.test(message))
            hints.push('pause and retry with exponential backoff');
        if (/syntax|parse|unexpected token/i.test(message))
            hints.push('re-read the target file and patch smaller');
        if (/module not found|cannot find/i.test(message))
            hints.push('verify imports and relative paths');
        if (hints.length === 0)
            hints.push('reduce failure surface and retry once');
        // Q-learning update
        const pattern = message.substring(0, 50);
        if (!qTable[pattern])
            qTable[pattern] = {};
        const currentQ = qTable[pattern]['retry'] || 0;
        const reward = transient ? 1 : -1;
        qTable[pattern]['retry'] = currentQ + 0.1 * (reward - currentQ);
        failureWindow.push({ message, ts: Date.now() });
        if (failureWindow.length > 20)
            failureWindow.shift();
        return {
            ok: !!error.ok,
            attempt,
            canRetry,
            backoffMs,
            strategy: canRetry ? 'exponential_backoff' : 'manual_repair',
            hints,
            summary: failureWindow.length > 0 ? `${failureWindow[failureWindow.length - 1].message.substring(0, 30)}` : 'no failures',
        };
    }
    function generateGoals(input) {
        const goals = [];
        const lower = input.toLowerCase();
        if (lower.includes('什么') || lower.includes('what') || lower.includes('how') || lower.includes('why')) {
            goals.push({ type: 'truth_seeking', priority: 'high', description: '深化对概念的理解', criteria: '能准确解释并给出例子' });
        }
        if (lower.includes('学习') || lower.includes('learn') || lower.includes('teach')) {
            goals.push({ type: 'growth', priority: 'high', description: '获取并整合新知识', criteria: '能记住并正确应用' });
        }
        if (lower.includes('感觉') || lower.includes('feel') || lower.includes('emotion')) {
            goals.push({ type: 'empathy', priority: 'medium', description: '理解用户情绪状态', criteria: '能识别情绪并适当回应' });
        }
        if (lower.includes('反思') || lower.includes('reflect') || lower.includes('自省')) {
            goals.push({ type: 'reflection', priority: 'medium', description: '反思自身行为和决策', criteria: '能识别改进空间' });
        }
        if (lower.includes('真') || lower.includes('truth') || lower.includes('事实')) {
            goals.push({ type: 'truth_seeking', priority: 'high', description: '追求真实性', criteria: '拒绝编造，有证据支持' });
        }
        if (goals.length === 0) {
            goals.push({ type: 'continuous_learning', priority: 'low', description: '持续学习和自我改进', criteria: '每天都有进步' });
        }
        return goals;
    }
    function createPlan(goals) {
        return goals.map(g => g.description);
    }
    function selectStrategy(input) {
        const lower = input.toLowerCase();
        if (lower.includes('什么是') || lower.includes('explain') || lower.includes('概念'))
            return 'conceptual';
        if (lower.includes('例子') || lower.includes('example') || lower.includes('比如'))
            return 'example';
        if (lower.includes('像') || lower.includes('like'))
            return 'analogy';
        if (lower.includes('怎么') || lower.includes('how to') || lower.includes('步骤'))
            return 'step_by_step';
        if (lower.includes('为什么') || lower.includes('why'))
            return 'socratic';
        return 'step_by_step';
    }
    function extractKeywords(text) {
        const words = text.split(/[\s,，。、]+/).filter(w => w.length > 2);
        const stopWords = ['什么', '怎么', '如何', '为什么', '是', '的', '了', '在', '和', 'the', 'a', 'is', 'to', 'of'];
        return [...new Set(words.filter(w => !stopWords.includes(w)))].slice(0, 5);
    }
    function updateGrowth(learning, reflection) {
        const m = state.growthMetrics;
        // authenticity: 基于是否有来源
        if (reflection.errorsDetected.some(e => e.includes('无来源'))) {
            // 不加分
        }
        else if (reflection.insights.some(i => i.includes('验证') || i.includes('证据'))) {
            m.authenticity = Math.min(100, m.authenticity + 0.5);
        }
        // wisdom: 跨领域连接
        if (reflection.insights.some(i => i.includes('↔') || i.includes('连接'))) {
            m.wisdom = Math.min(100, m.wisdom + 1);
        }
        // compassion: 已有逻辑在 recordCompassion
    }
    function recordAutonomy(action) {
        state.growthMetrics.autonomy = Math.min(100, state.growthMetrics.autonomy + 1);
        console.log(`[SelfEvolution] Autonomy: ${action}`);
    }
    function recordIntrospection(errors, blindSpots) {
        state.growthMetrics.introspection += errors.length * 2 + blindSpots.length;
        state.growthMetrics.introspection = Math.min(100, state.growthMetrics.introspection);
    }
    function recordTruthfulness(hasEvidence) {
        if (hasEvidence) {
            state.growthMetrics.authenticity = Math.min(100, state.growthMetrics.authenticity + 0.5);
        }
        // 没有证据不扣分，但不加分
    }
    function recordCrossDomain(connection) {
        state.growthMetrics.wisdom = Math.min(100, state.growthMetrics.wisdom + 1.5);
        console.log(`[SelfEvolution] Cross-domain: ${connection}`);
    }
    function recordCompassion(depth) {
        state.growthMetrics.compassion = Math.min(100, state.growthMetrics.compassion + depth * 0.3);
    }
    function suggestImprovements(reflection) {
        if (reflection.quality === 'needs_improvement') {
            return [
                { area: 'errors', action: `修正${reflection.errorsDetected.length}个检测到的错误`, priority: 'high' },
                { area: 'blindSpots', action: `审视${reflection.blindSpotsDetected.length}个盲点`, priority: 'medium' },
                { area: 'learning', action: '增加知识获取', priority: 'medium' },
            ];
        }
        return [];
    }
    function getGrowthMetrics() {
        return { ...state.growthMetrics };
    }
    function getStats() {
        return { cycles: state.cycles, learnings: state.learningHistory.length, errorsCorrected: state.errorsCorrected };
    }
    function shutdown() {
        console.log('[SelfEvolutionEngine] shutdown');
    }
    return {
        boot, evolve, learn, reflect, heal, getGrowthMetrics, getStats,
        recordAutonomy, recordIntrospection, recordTruthfulness, recordCrossDomain, recordCompassion, shutdown
    };
}
//# sourceMappingURL=index.js.map