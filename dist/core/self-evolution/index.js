"use strict";
// Self-Evolution Engine — Goal-Driven Learning + Meta-Learning + Self-Healing
// Inherits from: self-evolution-core.js, meta-learning.js, self-healing.js
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSelfEvolutionEngine = createSelfEvolutionEngine;
function createSelfEvolutionEngine() {
    const state = {
        goals: [],
        learningHistory: [],
        growthMetrics: { autonomy: 0, introspection: 0, growth: 0, authenticity: 0, wisdom: 0, compassion: 0 },
        cycles: 0,
    };
    // Meta-Learning: strategy performance tracking
    const strategies = {
        conceptual: { name: 'conceptual', success: 0, total: 0, score: 0.5 },
        example: { name: 'example', success: 0, total: 0, score: 0.5 },
        analogy: { name: 'analogy', success: 0, total: 0, score: 0.5 },
        step_by_step: { name: 'step_by_step', success: 0, total: 0, score: 0.5 },
        socratic: { name: 'socratic', success: 0, total: 0, score: 0.5 },
    };
    // Self-Healing: failure tracking + Q-learning
    const failureWindow = [];
    const qTable = {};
    const healingMemory = [];
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
        const reflection = reflect(learning);
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
        // Simulate learning processing
        await Promise.resolve();
        // Update strategy score
        const s = strategies[strategy];
        if (s) {
            s.total++;
            s.success++;
            s.score = s.total > 0 ? s.success / s.total : 0.5;
        }
        return {
            summary: `Learned ${newKnowledge.length} concepts via ${strategy} strategy`,
            newKnowledge,
            skills: [strategy],
        };
    }
    function reflect(learning) {
        const insights = [];
        if (learning.newKnowledge.length > 0) {
            insights.push('Successfully acquired new knowledge — applying validation in subsequent interactions');
        }
        insights.push('Continuously deepening understanding from multiple perspectives');
        if (learning.skills.length > 0) {
            insights.push(`Strategy "${learning.skills[0]}" effective for current input type`);
        }
        const quality = insights.length > 0 ? 'good' : 'needs_improvement';
        return {
            insights,
            quality,
            recommendation: insights.length > 2 ? 'Continue deepening' : 'Need more learning',
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
            goals.push({ type: 'understanding', priority: 'high', description: 'Deepen understanding of concept', criteria: 'Can accurately explain and give examples' });
        }
        if (lower.includes('学习') || lower.includes('learn') || lower.includes('teach')) {
            goals.push({ type: 'growth', priority: 'high', description: 'Acquire and integrate new knowledge', criteria: 'Can remember and correctly apply' });
        }
        if (lower.includes('感觉') || lower.includes('feel') || lower.includes('emotion')) {
            goals.push({ type: 'empathy', priority: 'medium', description: 'Understand user emotional state', criteria: 'Can identify emotions and respond appropriately' });
        }
        if (lower.includes('反思') || lower.includes('reflect') || lower.includes('summary')) {
            goals.push({ type: 'reflection', priority: 'medium', description: 'Reflect on own behavior and decisions', criteria: 'Can identify improvement space' });
        }
        if (goals.length === 0) {
            goals.push({ type: 'continuous_learning', priority: 'low', description: 'Continuous learning and self-improvement', criteria: 'Progress every day' });
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
        m.autonomy = Math.min(100, m.autonomy + 0.5);
        m.introspection = Math.min(100, m.introspection + (reflection.insights.length * 2));
        m.growth = Math.min(100, m.growth + (learning.newKnowledge.length * 1));
        m.authenticity = Math.min(100, m.authenticity + 0.3);
        m.wisdom = Math.min(100, m.wisdom + 0.4);
        m.compassion = Math.min(100, m.compassion + 0.2);
    }
    function suggestImprovements(reflection) {
        if (reflection.quality === 'needs_improvement') {
            return [
                { area: 'learning', action: 'Increase knowledge acquisition', priority: 'high' },
                { area: 'understanding', action: 'Deepen concept understanding', priority: 'medium' },
            ];
        }
        return [];
    }
    function getGrowthMetrics() {
        return { ...state.growthMetrics };
    }
    function getStats() {
        return { cycles: state.cycles, learnings: state.learningHistory.length };
    }
    function shutdown() {
        console.log('[SelfEvolutionEngine] shutdown');
    }
    return { boot, evolve, learn, reflect, heal, getGrowthMetrics, getStats, shutdown };
}
//# sourceMappingURL=index.js.map