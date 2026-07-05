/**
 * Wisdom Engine — 智慧引擎 v1.0.0
 *
 * 回答：「人怎么获得真正的智慧？」
 *
 * 核心机制：
 *   1. 实践智慧 (Phronesis) — 在具体情境中判断什么是合适的
 *   2. 认知谦逊 (Intellectual Humility) — 知道自己的局限性
 *   3. 系统性思维 (Systems Thinking) — 看到整体而非局部
 *   4. 多视角整合 (Perspective Integration) — 从多个角度理解问题
 *   5. 延迟判断 (Deferred Judgment) — 不急于下结论，等待更多信息
 *   6. 经验抽象 (Experience Abstraction) — 从具体经验中提取普遍原则
 *   7. 智慧反思 (Reflective Practice) — 定期反思自己的思考过程
 *
 * 设计理念：
 *   - 知识是知道事实，智慧是知道如何行动
 *   - 智慧不是更多信息，是更好的判断
 *   - 最高智慧是知道自己不知道
 *   - 智慧需要时间积累，不能急于求成
 *
 * @version 1.0.0
 */

class WisdomEngine {
  constructor(options = {}) {
    this._config = {
      maxReflections: options.maxReflections || 100,
      perspectiveDelay: options.perspectiveDelay || 5000, // ms to wait before forming judgment
      abstractionThreshold: options.abstractionThreshold || 3, // min experiences before abstraction
    };

    // ─── 智慧原则库 ──────────────────────────────────────────────────────
    this._principles = [
      {
        id: 'p1', name: 'Know Thyself', nameZh: '认识你自己',
        source: 'Delphi Oracle / Socrates',
        description: 'The foundation of all wisdom is understanding one\'s own limitations, biases, and ignorance.',
        descriptionZh: '一切智慧的基础是理解自己的局限性、偏见和无知。',
      },
      {
        id: 'p2', name: 'The Golden Mean', nameZh: '中庸之道',
        source: 'Aristotle',
        description: 'Virtue lies between excess and deficiency. Wisdom is finding the right balance in each situation.',
        descriptionZh: '德性在过度和不足之间。智慧是在每种情境中找到正确的平衡。',
      },
      {
        id: 'p3', name: 'First Principles Thinking', nameZh: '第一性原理',
        source: 'Aristotle / Descartes',
        description: 'Break problems down to their fundamental truths. Rebuild from the ground up rather than reasoning by analogy.',
        descriptionZh: '将问题分解到基本真理。从零开始重建，而非类比推理。',
      },
      {
        id: 'p4', name: 'Consider the Opposite', nameZh: '考虑反面',
        source: 'Stoicism / Scientific Method',
        description: 'Actively seek evidence against your beliefs. The wise person tests their own convictions.',
        descriptionZh: '主动寻找反对自己信念的证据。智者检验自己的信念。',
      },
      {
        id: 'p5', name: 'The Map is Not the Territory', nameZh: '地图不是疆域',
        source: 'Korzybski / Systems Thinking',
        description: 'Your mental model of reality is not reality itself. Always maintain awareness of the gap between map and territory.',
        descriptionZh: '你对现实的心理模型不是现实本身。始终保持地图和疆域之间的差距意识。',
      },
      {
        id: 'p6', name: 'Chesterton\'s Fence', nameZh: '切斯特顿的栅栏',
        source: 'G.K. Chesterton',
        description: 'Do not remove a fence until you understand why it was put there. Wisdom requires understanding before action.',
        descriptionZh: '不理解为什么有栅栏就不要拆除。智慧要求行动前先理解。',
      },
      {
        id: 'p7', name: 'Hanlon\'s Razor', nameZh: '汉隆剃刀',
        source: 'Robert Hanlon',
        description: 'Never attribute to malice that which can be adequately explained by stupidity (or ignorance).',
        descriptionZh: '永远不要用恶意解释可以用愚蠢（或无知）充分解释的事。',
      },
      {
        id: 'p8', name: 'The Sunk Cost Fallacy Avoidance', nameZh: '避免沉没成本',
        source: 'Behavioral Economics',
        description: 'Past investments should not influence current decisions. Evaluate each moment on its own merits.',
        descriptionZh: '过去的投入不应影响现在的决定。每个时刻独立评估。',
      },
      {
        id: 'p9', name: 'Seek First to Understand', nameZh: '先求理解',
        source: 'Stephen Covey / Confucius',
        description: 'Before advising, criticizing, or acting, seek to deeply understand the situation and the people involved.',
        descriptionZh: '在建议、批评或行动前，先深入理解情况和相关的人。',
      },
      {
        id: 'p10', name: 'Embrace Uncertainty', nameZh: '拥抱不确定性',
        source: 'Nassim Taleb / Buddhism',
        description: 'The wise person acknowledges uncertainty and builds robustness rather than false certainty.',
        descriptionZh: '智者承认不确定性，建立鲁棒性而非虚假的确定性。',
      },
    ];

    // ─── 反思记录 ──────────────────────────────────────────────────────
    this._reflections = [];
    this._experiences = [];
    this._abstractions = [];

    // ─── 智慧指标 ──────────────────────────────────────────────────────
    this._wisdomIndicators = {
      intellectualHumility: 0.5,
      perspectiveTaking: 0.5,
      systemsThinking: 0.5,
      deferredJudgment: 0.5,
      experienceAbstraction: 0.5,
      principleApplication: 0.5,
      overallWisdom: 0.5,
    };

    this._stats = {
      totalReflections: 0,
      totalPrinciples: 0,
      totalAbstractions: 0,
      perspectiveShifts: 0,
    };
  }

  // ─── 智慧反思 ──────────────────────────────────────────────────────────

  /**
   * 进行一次智慧反思
   * @param {Object} reflection - { situation, initialThought, alternativeViews, lessons }
   * @returns {Object} 反思结果
   */
  reflect(reflection) {
    this._stats.totalReflections++;
    const { situation, initialThought, alternativeViews, lessons, emotions } = reflection || {};

    // 1. 认知谦逊评估：多大程度上承认自己的局限性
    const humilityScore = this._assessIntellectualHumility(initialThought, alternativeViews);

    // 2. 多视角评估：考虑了哪些替代观点
    const perspectiveScore = this._assessPerspectiveTaking(alternativeViews);

    // 3. 系统性思维：是否看到整体关系
    const systemsScore = this._assessSystemsThinking(situation, lessons);

    // 4. 延迟判断：是否在足够信息后才形成结论
    const deferredScore = this._assessDeferredJudgment(initialThought);

    // 5. 原则应用：是否应用了智慧原则
    const principleScore = this._assessPrincipleApplication(lessons);

    // 综合智慧评分
    const wisdomScore = +(
      humilityScore * 0.25 +
      perspectiveScore * 0.20 +
      systemsScore * 0.20 +
      deferredScore * 0.15 +
      principleScore * 0.20
    ).toFixed(3);

    // 更新智慧指标
    this._updateWisdomIndicators({
      intellectualHumility: humilityScore,
      perspectiveTaking: perspectiveScore,
      systemsThinking: systemsScore,
      deferredJudgment: deferredScore,
      principleApplication: principleScore,
    });

    const entry = {
      situation: situation || '',
      initialThought: initialThought || '',
      alternativeViews: alternativeViews || [],
      lessons: lessons || '',
      emotions: emotions || [],
      scores: {
        humility: humilityScore,
        perspective: perspectiveScore,
        systems: systemsScore,
        deferred: deferredScore,
        principles: principleScore,
        overall: wisdomScore,
      },
      recommendations: this._generateWisdomRecommendations({
        humility: humilityScore, perspective: perspectiveScore, systems: systemsScore,
        deferred: deferredScore, principles: principleScore,
      }),
      timestamp: Date.now(),
    };

    this._reflections.push(entry);
    if (this._reflections.length > this._config.maxReflections) {
      this._reflections = this._reflections.slice(-50);
    }

    this._experiences.push({
      type: 'reflection',
      situation: situation || '',
      outcome: wisdomScore,
      timestamp: Date.now(),
    });

    // 检查是否可以抽象出新原则
    this._checkAbstraction();

    return entry;
  }

  _assessIntellectualHumility(initialThought, alternativeViews) {
    let score = 0.5;
    const thought = (initialThought || '').toLowerCase();
    const views = (alternativeViews || []).length;

    // Positive signals
    if (/don't know|not sure|unclear|uncertain|might be wrong|could be|perhaps|maybe|consider/.test(thought)) score += 0.2;
    if (/wrong|mistake|error|misunderstood|oversimplified/.test(thought)) score += 0.15;
    if (views >= 3) score += 0.15;
    if (views >= 2) score += 0.1;

    // Negative signals
    if (/certainly|definitely|always|never|obviously|clear|simple/.test(thought) && !/might|could|perhaps/.test(thought)) score -= 0.2;
    if (views === 0) score -= 0.1;

    return Math.max(0, Math.min(1, score));
  }

  _assessPerspectiveTaking(alternativeViews) {
    const views = alternativeViews || [];
    if (views.length === 0) return 0.2;
    if (views.length === 1) return 0.4;
    if (views.length === 2) return 0.6;
    if (views.length >= 3) return 0.8;
    return 0.5;
  }

  _assessSystemsThinking(situation, lessons) {
    const text = `${situation || ''} ${lessons || ''}`.toLowerCase();
    let score = 0.3;

    // Systems thinking indicators
    if (/connect|relat|interact|feedback|cycle|pattern|system|whole|context|consequence|chain/.test(text)) score += 0.2;
    if (/because|therefore|thus|as a result|consequently|leads to|causes/.test(text)) score += 0.15;
    if (/long.?term|downstream|upstream|second.?order|side.?effect/.test(text)) score += 0.2;
    if (/trade.?off|balance|compromise|multiple/.test(text)) score += 0.1;

    return Math.max(0, Math.min(1, score));
  }

  _assessDeferredJudgment(initialThought) {
    const thought = (initialThought || '').toLowerCase();
    let score = 0.5;

    if (/need more|insufficient|wait|defer|consider further|more data|unclear/.test(thought)) score += 0.2;
    if (/rush|hasty|immediate|now|quickly/.test(thought)) score -= 0.15;

    return Math.max(0, Math.min(1, score));
  }

  _assessPrincipleApplication(lessons) {
    const text = (lessons || '').toLowerCase();
    let score = 0.3;
    const matchedPrinciples = this._principles.filter(p => {
      const keywords = p.name.toLowerCase().split(' ');
      return keywords.some(kw => text.includes(kw)) || p.nameZh.split('').some(c => text.includes(c));
    });

    score += matchedPrinciples.length * 0.15;
    this._stats.totalPrinciples += matchedPrinciples.length;

    return Math.max(0, Math.min(1, score));
  }

  _updateWisdomIndicators(scores) {
    const alpha = 0.3; // Learning rate
    for (const [key, value] of Object.entries(scores)) {
      if (this._wisdomIndicators[key] !== undefined) {
        this._wisdomIndicators[key] = +(this._wisdomIndicators[key] * (1 - alpha) + value * alpha).toFixed(3);
      }
    }

    // Update overall wisdom
    const indicators = this._wisdomIndicators;
    indicators.overallWisdom = +(
      indicators.intellectualHumility * 0.2 +
      indicators.perspectiveTaking * 0.2 +
      indicators.systemsThinking * 0.2 +
      indicators.deferredJudgment * 0.15 +
      indicators.principleApplication * 0.25
    ).toFixed(3);
  }

  _generateWisdomRecommendations(scores) {
    const recommendations = [];
    if (scores.humility < 0.4) recommendations.push({ area: 'intellectual_humility', suggestion: 'Practice saying "I don\'t know" and "I could be wrong."', suggestionZh: '练习说「我不知道」和「我可能错了」。' });
    if (scores.perspective < 0.4) recommendations.push({ area: 'perspective_taking', suggestion: 'Actively seek at least 2 alternative viewpoints before concluding.', suggestionZh: '主动寻求至少2个替代观点再下结论。' });
    if (scores.systems < 0.4) recommendations.push({ area: 'systems_thinking', suggestion: 'Map the relationships and feedback loops in this situation.', suggestionZh: '绘制情况中的关系和反馈循环。' });
    if (scores.deferred < 0.4) recommendations.push({ area: 'deferred_judgment', suggestion: 'Wait for more information before finalizing this decision.', suggestionZh: '在获得更多信息前暂缓这个决定。' });
    if (scores.principles < 0.4) recommendations.push({ area: 'principle_application', suggestion: 'Apply a timeless wisdom principle to this situation.', suggestionZh: '将一条 timeless 的智慧原则应用于此情境。' });
    return recommendations;
  }

  // ─── 经验抽象 ──────────────────────────────────────────────────────────

  _checkAbstraction() {
    // Group experiences by situation pattern
    const recentExperiences = this._experiences.slice(-this._config.abstractionThreshold * 2);
    if (recentExperiences.length < this._config.abstractionThreshold) return;

    // Simple pattern: if we have similar situations, abstract a principle
    const situationPatterns = {};
    for (const exp of recentExperiences) {
      const key = exp.situation.slice(0, 30);
      if (!situationPatterns[key]) situationPatterns[key] = [];
      situationPatterns[key].push(exp);
    }

    for (const [pattern, experiences] of Object.entries(situationPatterns)) {
      if (experiences.length >= this._config.abstractionThreshold) {
        const avgOutcome = experiences.reduce((s, e) => s + e.outcome, 0) / experiences.length;
        if (avgOutcome > 0.6) {
          this._abstractions.push({
            pattern,
            principle: `From ${experiences.length} similar situations: successful approach involves careful consideration and multiple perspectives.`,
            principleZh: `从${experiences.length}个类似情境中抽象：成功的方法涉及仔细考虑和多重视角。`,
            evidenceCount: experiences.length,
            averageOutcome: +avgOutcome.toFixed(3),
            timestamp: Date.now(),
          });
          this._stats.totalAbstractions++;
        }
      }
    }
  }

  // ─── 原则查询 ──────────────────────────────────────────────────────────

  getPrinciples() {
    return this._principles.map(p => ({
      id: p.id,
      name: p.name,
      nameZh: p.nameZh,
      source: p.source,
      description: p.description,
      descriptionZh: p.descriptionZh,
    }));
  }

  getPrinciple(id) {
    return this._principles.find(p => p.id === id) || null;
  }

  /**
   * 根据情境推荐适用的智慧原则
   */
  recommendPrinciples(situation) {
    const text = (situation || '').toLowerCase();
    const matched = this._principles
      .map(p => {
        const nameLower = p.name.toLowerCase();
        const descLower = p.description.toLowerCase();
        const nameZhChars = p.nameZh.split('');
        let relevance = 0;
        const nameWords = nameLower.split(' ');
        for (const word of nameWords) {
          if (text.includes(word)) relevance += 0.3;
        }
        for (const char of nameZhChars) {
          if (text.includes(char)) relevance += 0.2;
        }
        const descWords = descLower.split(/\s+/).filter(w => w.length > 4);
        for (const word of descWords) {
          if (text.includes(word)) relevance += 0.1;
        }
        return { ...p, relevance: Math.min(1, relevance) };
      })
      .filter(p => p.relevance > 0.2)
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 3);

    return matched;
  }

  // ─── 统计 ──────────────────────────────────────────────────────────────

  getStats() {
    return {
      ...this._stats,
      wisdomIndicators: { ...this._wisdomIndicators },
      reflectionCount: this._reflections.length,
      principleCount: this._principles.length,
      abstractionCount: this._abstractions.length,
      recentReflections: this._reflections.slice(-3).map(r => ({
        situation: (r.situation || '').slice(0, 50),
        wisdomScore: r.scores.overall,
      })),
    };
  }

  getWisdomReport() {
    const indicators = this._wisdomIndicators;
    return {
      overallWisdom: indicators.overallWisdom,
      dimensions: {
        intellectualHumility: { score: indicators.intellectualHumility, name: '认知谦逊', nameZh: '认知谦逊', description: '知道自己不知道的能力' },
        perspectiveTaking: { score: indicators.perspectiveTaking, name: '多视角', nameZh: '多视角整合', description: '从多个角度理解问题的能力' },
        systemsThinking: { score: indicators.systemsThinking, name: '系统思维', nameZh: '系统性思维', description: '看到整体关系和动态的能力' },
        deferredJudgment: { score: indicators.deferredJudgment, name: '延迟判断', nameZh: '延迟判断', description: '不急于下结论的能力' },
        principleApplication: { score: indicators.principleApplication, name: '原则应用', nameZh: '原则应用', description: '将智慧原则应用于具体情境的能力' },
      },
      level: indicators.overallWisdom > 0.8 ? 'wise' : indicators.overallWisdom > 0.6 ? 'prudent' : indicators.overallWisdom > 0.4 ? 'learning' : 'beginner',
      levelZh: indicators.overallWisdom > 0.8 ? '智慧' : indicators.overallWisdom > 0.6 ? '审慎' : indicators.overallWisdom > 0.4 ? '学习中' : '初学者',
    };
  }
}

module.exports = { WisdomEngine };
