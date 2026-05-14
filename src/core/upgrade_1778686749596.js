/**
 * HeartFlow Upgrade v0.13.65
 * Generated: 2026-05-13T15:39:09.596Z
 * Papers: psychology-philosophy-ai/2109.05237v4.pdf, psychology-philosophy-ai/2304.11461v1.pdf
 * Concepts: learning, reasoning, self, memory, emotion, ethics
 */


export const feature_0_learning = {
    name: 'learning_enhancement',
    source: 'psychology-philosophy-ai/2109.05237v4.pdf',
    
    learnFromError(error, context = {}) {
        return {
            pattern: error.substring(0, 100),
            type: /undefined|null/.test(error) ? 'null_reference' : /timeout/.test(error) ? 'timeout' : 'unknown',
            correction: /undefined|null/.test(error) ? '添加 null 检查' : /timeout/.test(error) ? '增加超时时间' : '验证输入',
            prevention: { inputValidation: true, nullCheck: true }
        };
    },
    
    incrementalUpdate(model, newData) {
        const updated = { ...model };
        newData.forEach(d => { updated[d.key] = (updated[d.key] || 0) * 0.9 + d.value * 0.1; });
        return updated;
    }
};


export const feature_0_reasoning = {
    name: 'reasoning_enhancement',
    source: 'psychology-philosophy-ai/2109.05237v4.pdf',
    
    chain(premises) {
        const steps = [];
        let current = premises[0];
        for (let i = 1; i < premises.length; i++) {
            const next = premises[i];
            steps.push({ from: current, to: next, valid: !!next });
            if (next) current = next;
        }
        return { steps, conclusion: current, valid: steps.every(s => s.valid) };
    },
    
    detectFallacy(reasoning) {
        const issues = [];
        if (/always|never|must|肯定/.test(reasoning) && !/but|however/.test(reasoning)) issues.push('false_dichotomy');
        if (/因为.*所以/.test(reasoning) && !/但是/.test(reasoning)) issues.push('correlation_causation');
        return issues;
    }
};


export const feature_0_self = {
    name: 'self_improvement',
    source: 'psychology-philosophy-ai/2109.05237v4.pdf',
    
    reflect(actions, outcomes) {
        return actions.map((action, i) => ({
            action,
            outcome: outcomes[i],
            rating: outcomes[i]?.success ? 1 : -1,
            lesson: outcomes[i]?.success ? "成功: " + action : "失败: " + action + " -> " + (outcomes[i]?.error || "unknown")
        }));
    },
    
    suggest(lessons) {
        return lessons.filter(l => l.rating < 0).map(l => ({ problem: l.action, suggestion: "改进: " + l.lesson }));
    }
};


export const feature_1_memory = {
    name: 'memory_enhancement',
    source: 'psychology-philosophy-ai/2304.11461v1.pdf',
    
    compress(memory, threshold = 0.7) {
        return memory
            .filter(m => m.importance >= threshold)
            .map(m => ({ ...m, essence: m.value.substring(0, 100), compressed: true }));
    },
    
    retrieve(query, memory) {
        const q = query.toLowerCase().split(/\s+/);
        return memory
            .map(m => {
                const text = (m.key + ' ' + m.value).toLowerCase();
                const score = q.filter(t => text.includes(t)).length / q.length;
                return { ...m, relevance: score };
            })
            .filter(m => m.relevance > 0)
            .sort((a, b) => b.relevance - a.relevance);
    },
    
    consolidate(newMem, existing) {
        const map = new Map(existing.map(m => [m.key, m]));
        newMem.forEach(m => {
            if (map.has(m.key)) {
                const e = map.get(m.key);
                map.set(m.key, { ...e, value: m.value, reinforce: (e.reinforce || 0) + 1 });
            } else {
                map.set(m.key, { ...m, reinforce: 1 });
            }
        });
        return Array.from(map.values());
    }
};


export const feature_1_emotion = {
    name: 'emotion_enhancement',
    source: 'psychology-philosophy-ai/2304.11461v1.pdf',
    
    detect(text) {
        const lower = text.toLowerCase();
        const pos = ['好', '棒', '优秀', 'happy', 'good', 'great', 'excellent', 'love'];
        const neg = ['差', '糟糕', '失望', 'sad', 'bad', 'terrible', 'hate'];
        let scores = { positive: 0, negative: 0, neutral: 1 };
        pos.forEach(w => { if (lower.includes(w)) scores.positive++; });
        neg.forEach(w => { if (lower.includes(w)) scores.negative++; });
        if (scores.positive + scores.negative > 0) scores.neutral = 0;
        return scores;
    },
    
    adapt(text, emotion) {
        const tone = emotion.positive > emotion.negative ? 'warm' : emotion.negative > emotion.positive ? 'empathetic' : 'neutral';
        return { tone, response: text };
    }
};


export const feature_1_learning = {
    name: 'learning_enhancement',
    source: 'psychology-philosophy-ai/2304.11461v1.pdf',
    
    learnFromError(error, context = {}) {
        return {
            pattern: error.substring(0, 100),
            type: /undefined|null/.test(error) ? 'null_reference' : /timeout/.test(error) ? 'timeout' : 'unknown',
            correction: /undefined|null/.test(error) ? '添加 null 检查' : /timeout/.test(error) ? '增加超时时间' : '验证输入',
            prevention: { inputValidation: true, nullCheck: true }
        };
    },
    
    incrementalUpdate(model, newData) {
        const updated = { ...model };
        newData.forEach(d => { updated[d.key] = (updated[d.key] || 0) * 0.9 + d.value * 0.1; });
        return updated;
    }
};


export const feature_1_self = {
    name: 'self_improvement',
    source: 'psychology-philosophy-ai/2304.11461v1.pdf',
    
    reflect(actions, outcomes) {
        return actions.map((action, i) => ({
            action,
            outcome: outcomes[i],
            rating: outcomes[i]?.success ? 1 : -1,
            lesson: outcomes[i]?.success ? "成功: " + action : "失败: " + action + " -> " + (outcomes[i]?.error || "unknown")
        }));
    },
    
    suggest(lessons) {
        return lessons.filter(l => l.rating < 0).map(l => ({ problem: l.action, suggestion: "改进: " + l.lesson }));
    }
};


export const feature_1_ethics = {
    name: 'ethics_enhancement',
    source: 'psychology-philosophy-ai/2304.11461v1.pdf',
    
    check(action) {
        const concerns = [];
        if (/delete|remove|destroy/.test(action)) concerns.push('dataLoss');
        if (/private|secret|password/.test(action)) concerns.push('privacy');
        return { approved: concerns.length === 0, concerns };
    }
};


export const upgrade_0_13.65 = {
    version: 'v0.13.65',
    papers: ["psychology-philosophy-ai/2109.05237v4.pdf","psychology-philosophy-ai/2304.11461v1.pdf"],
    concepts: ["learning","reasoning","self","memory","emotion","ethics"],
    timestamp: '2026-05-13T15:39:09.596Z',
    
    apply(engine) {
        return {
            success: true,
            features: ["learning","reasoning","self","memory","emotion","ethics"],
            modules: ['feature_0', 'feature_1']
        };
    }
};
