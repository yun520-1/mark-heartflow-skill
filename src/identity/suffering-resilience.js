/**
 * Suffering Resilience — 苦难韧性引擎 v1.0.0
 *
 * 回答：「人怎么在苦难中不倒？」
 *
 * 基于：
 *   - Viktor Frankl: 意义疗法 — 苦难本身没有意义，人对苦难的回应有意义
 *   - Annett Meg: 韧性理论 — 韧性不是天生，是可以培养的能力
 *   - Buddhism: 八苦 — 生老病死怨憎会爱别离求不得
 *   - Stoicism: 消极想象 — 预想苦难才能面对苦难
 *   - Psychology: Post-Traumatic Growth — 创伤后成长
 *
 * @version 1.0.0
 */

class SufferingResilience {
  constructor(options = {}) {
    this._config = {
      resilienceMode: options.resilienceMode || 'growth', // 'survival' | 'coping' | 'growth'
      meaningFirst: options.meaningFirst || true,
      communitySupport: options.communitySupport || true,
    };

    // ─── 苦难类型 ──────────────────────────────────────────────────────
    this._sufferingTypes = {
      physical: { name: 'Physical Suffering', nameZh: '身体苦难', examples: ['illness', 'pain', 'disability', 'aging'] },
      emotional: { name: 'Emotional Suffering', nameZh: '情感苦难', examples: ['grief', 'heartbreak', 'loneliness', 'fear'] },
      existential: { name: 'Existential Suffering', nameZh: '存在苦难', examples: ['meaninglessness', 'isolation', 'death_anxiety', 'freedom_paradox'] },
      social: { name: 'Social Suffering', nameZh: '社会苦难', examples: ['injustice', 'discrimination', 'rejection', 'betrayal'] },
      spiritual: { name: 'Spiritual Suffering', nameZh: '精神苦难', examples: ['loss_of_faith', 'disconnection', 'emptiness', 'spiritual_crisis'] },
    };

    // ─── 韧性因素 ──────────────────────────────────────────────────────
    this._resilienceFactors = {
      meaningMaking: 0.5,       // 意义建构能力
      emotionalRegulation: 0.5, // 情绪调节能力
      socialSupport: 0.5,       // 社会支持网络
      selfEfficacy: 0.5,        // 自我效能感
      adaptability: 0.5,        // 适应性灵活性
      hope: 0.5,               // 希望水平
      spiritualBelief: 0.5,     // 精神信仰
    };

    // ─── 苦难记录 ──────────────────────────────────────────────────────
    this._sufferingHistory = [];
    this._resilienceEvents = [];
    this._copingStrategies = {
      meaningReframing: { count: 0, effectiveness: 0.5 },
      acceptance: { count: 0, effectiveness: 0.5 },
      socialSeeking: { count: 0, effectiveness: 0.5 },
      problemSolving: { count: 0, effectiveness: 0.5 },
      distraction: { count: 0, effectiveness: 0.3 },
      spiritualPractice: { count: 0, effectiveness: 0.5 },
      creativeExpression: { count: 0, effectiveness: 0.4 },
      helpingOthers: { count: 0, effectiveness: 0.6 },
    };

    this._stats = {
      totalSufferings: 0,
      resilienceEvents: 0,
      growthEvents: 0,
      averageResilienceScore: 0.5,
    };
  }

  // ─── 苦难评估 ──────────────────────────────────────────────────────────

  assessSuffering(suffering) {
    this._stats.totalSufferings++;
    const { type, description, intensity, duration, context } = suffering || {};

    const sufferingType = this._sufferingTypes[type] || this._sufferingTypes.emotional;
    const intensityScore = Math.max(0, Math.min(1, intensity || 0.5));

    // 评估当前韧性水平
    const resilienceLevel = this._calculateResilience();

    // 评估应对能力
    const copingCapacity = this._assessCopingCapacity(sufferingType, intensityScore);

    // 计算成长潜力
    const growthPotential = this._assessGrowthPotential(sufferingType, intensityScore, resilienceLevel);

    // 生成应对建议
    const recommendations = this._generateResilienceRecommendations(
      sufferingType, intensityScore, resilienceLevel, copingCapacity, growthPotential
    );

    const entry = {
      type: type || 'emotional',
      typeZh: sufferingType.nameZh,
      description: description || '',
      intensity: intensityScore,
      duration: duration || 'unknown',
      resilienceLevel,
      copingCapacity,
      growthPotential,
      recommendations,
      timestamp: Date.now(),
    };

    this._sufferingHistory.push(entry);
    if (this._sufferingHistory.length > 200) {
      this._sufferingHistory = this._sufferingHistory.slice(-100);
    }

    return entry;
  }

  _calculateResilience() {
    const factors = this._resilienceFactors;
    return +(
      factors.meaningMaking * 0.25 +
      factors.emotionalRegulation * 0.20 +
      factors.socialSupport * 0.15 +
      factors.selfEfficacy * 0.15 +
      factors.adaptability * 0.10 +
      factors.hope * 0.10 +
      factors.spiritualBelief * 0.05
    ).toFixed(3);
  }

  _assessCopingCapacity(sufferingType, intensity) {
    const typeName = sufferingType.nameZh;
    let capacity = this._calculateResilience();

    // 不同类型的苦难需要不同的韧性因素
    const factors = this._resilienceFactors;
    if (typeName.includes('身体') || typeName.includes('Physical')) {
      capacity *= 0.5 + factors.emotionalRegulation * 0.3 + factors.selfEfficacy * 0.2;
    } else if (typeName.includes('情感') || typeName.includes('Emotional')) {
      capacity *= 0.5 + factors.socialSupport * 0.3 + factors.emotionalRegulation * 0.2;
    } else if (typeName.includes('存在') || typeName.includes('Existential')) {
      capacity *= 0.5 + factors.meaningMaking * 0.3 + factors.spiritualBelief * 0.2;
    }

    // 高强度苦难降低应对能力
    capacity *= (1 - intensity * 0.3);

    return +Math.max(0.1, Math.min(1, capacity)).toFixed(3);
  }

  _assessGrowthPotential(sufferingType, intensity, resilience) {
    // 中等强度的苦难最有成长潜力（太轻不深刻，太重压垮）
    const intensityOptimal = intensity > 0.3 && intensity < 0.8 ? 1.0 : 0.5;
    const resilienceFactor = resilience > 0.5 ? 0.8 : resilience > 0.3 ? 0.5 : 0.2;

    return +(intensityOptimal * resilienceFactor).toFixed(3);
  }

  _generateResilienceRecommendations(sufferingType, intensity, resilience, coping, growth) {
    const recommendations = [];
    const typeZh = sufferingType.nameZh;

    // 基于韧性因素差距生成建议
    const factors = this._resilienceFactors;
    if (factors.meaningMaking < 0.4) {
      recommendations.push({
        type: 'meaning_reframing',
        priority: 'high',
        action: 'Find or create meaning in this suffering. What can this teach? How can it make you stronger?',
        actionZh: '在苦难中寻找或创造意义。这能教给你什么？怎么能让你更强大？',
        philosophy: 'Viktor Frankl: "He who has a why to live can bear almost any how."',
      });
    }
    if (factors.emotionalRegulation < 0.4) {
      recommendations.push({
        type: 'emotional_regulation',
        priority: 'high',
        action: 'Practice emotional regulation: breathe, observe, don\'t suppress or amplify.',
        actionZh: '练习情绪调节：呼吸、观察、不压抑也不放大。',
        philosophy: 'Buddhism: "Feel the feeling, but don\'t become the feeling."',
      });
    }
    if (factors.socialSupport < 0.4 && this._config.communitySupport) {
      recommendations.push({
        type: 'social_support',
        priority: 'medium',
        action: 'Reach out to others. Suffering shared is suffering halved.',
        actionZh: '向他人伸出手。苦难分担，痛苦减半。',
        philosophy: 'Confucius: "In walking with others, I find my way."',
      });
    }
    if (factors.hope < 0.4) {
      recommendations.push({
        type: 'hope_building',
        priority: 'high',
        action: 'Set one small, achievable goal. Each small victory builds hope.',
        actionZh: '设定一个小目标。每个小胜利都在建立希望。',
        philosophy: 'Aristotle: "Hope is a waking dream."',
      });
    }
    if (growth > 0.5) {
      recommendations.push({
        type: 'growth_embrace',
        priority: 'medium',
        action: 'This suffering has growth potential. Embrace the learning opportunity.',
        actionZh: '这次苦难有成长潜力。拥抱学习机会。',
        philosophy: 'Nietzsche: "What does not kill me makes me stronger."',
      });
    }

    // 基于苦难类型
    if (typeZh.includes('存在') || typeZh.includes('Existential')) {
      recommendations.push({
        type: 'existential_meaning',
        priority: 'high',
        action: 'Engage with the big questions. Existential suffering is a sign of depth, not weakness.',
        actionZh: '面对大问题。存在苦难是深度，不是软弱。',
        philosophy: 'Viktor Frankl: "The search for meaning is the primary human drive."',
      });
    }

    return recommendations;
  }

  // ─── 韧性记录 ──────────────────────────────────────────────────────────

  recordResilienceEvent(event) {
    this._stats.resilienceEvents++;
    const entry = {
      type: event.type || 'coping',
      description: event.description || '',
      effectiveness: event.effectiveness || 0.5,
      lessons: event.lessons || '',
      timestamp: Date.now(),
    };

    this._resilienceEvents.push(entry);
    if (this._resilienceEvents.length > 200) {
      this._resilienceEvents = this._resilienceEvents.slice(-100);
    }

    // 更新韧性因素
    this._updateResilienceFactors(event);

    // 检查是否有成长
    if (event.effectiveness > 0.7 && event.type === 'growth') {
      this._stats.growthEvents++;
    }

    return entry;
  }

  _updateResilienceFactors(event) {
    const factorMap = {
      meaningReframing: 'meaningMaking',
      acceptance: 'emotionalRegulation',
      socialSeeking: 'socialSupport',
      problemSolving: 'selfEfficacy',
      spiritualPractice: 'spiritualBelief',
      helpingOthers: 'socialSupport',
      creativeExpression: 'adaptability',
    };

    const factorKey = factorMap[event.type];
    if (factorKey && this._resilienceFactors[factorKey] !== undefined) {
      const effect = event.effectiveness || 0.5;
      this._resilienceFactors[factorKey] = +(
        this._resilienceFactors[factorKey] * 0.8 + effect * 0.2
      ).toFixed(3);
    }

    // Update average resilience score
    this._stats.averageResilienceScore = this._calculateResilience();
  }

  // ─── 应对策略管理 ──────────────────────────────────────────────────────

  recordCopingStrategy(strategy, effectiveness) {
    const strategyKey = this._mapStrategyToKey(strategy);
    if (!strategyKey || !this._copingStrategies[strategyKey]) return null;

    const entry = this._copingStrategies[strategyKey];
    entry.count++;
    entry.effectiveness = +(entry.effectiveness * 0.8 + (effectiveness || 0.5) * 0.2).toFixed(3);

    return { strategy: strategyKey, ...entry };
  }

  _mapStrategyToKey(strategy) {
    const map = {
      'meaning_reframing': 'meaningReframing',
      'acceptance': 'acceptance',
      'social_seeking': 'socialSeeking',
      'problem_solving': 'problemSolving',
      'distraction': 'distraction',
      'spiritual_practice': 'spiritualPractice',
      'creative_expression': 'creativeExpression',
      'helping_others': 'helpingOthers',
    };
    return map[strategy] || null;
  }

  getEffectiveStrategies() {
    return Object.entries(this._copingStrategies)
      .filter(([_, data]) => data.count >= 2 && data.effectiveness > 0.5)
      .sort((a, b) => b[1].effectiveness - a[1].effectiveness)
      .map(([key, data]) => ({ strategy: key, effectiveness: data.effectiveness, usageCount: data.count }));
  }

  // ─── 统计 ──────────────────────────────────────────────────────────────

  getStats() {
    const resilience = this._calculateResilience();
    return {
      ...this._stats,
      currentResilience: resilience,
      resilienceFactors: { ...this._resilienceFactors },
      sufferingTypes: Object.keys(this._sufferingTypes).length,
      effectiveStrategies: this.getEffectiveStrategies().length,
      recentSufferings: this._sufferingHistory.slice(-3).map(s => ({
        type: s.typeZh,
        intensity: s.intensity,
        resilience: s.resilienceLevel,
      })),
    };
  }
}

module.exports = { SufferingResilience };
