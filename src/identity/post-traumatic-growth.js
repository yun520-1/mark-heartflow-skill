/**
 * Post-Traumatic Growth — 创伤后成长引擎 v1.0.0
 *
 * 回答：「人怎么从创伤中变得更强大？」
 *
 * 基于：
 *   - Tedeschi & Calhoun: PTGI 五维度模型
 *     (1) 新可能性 (2) 人际关系变化 (3) 个人力量 (4) 生命欣赏 (5) 灵性变化
 *   - Buddhism: 苦集灭道 — 苦难可以成为觉悟的起点
 *   - Nietzsche: "What does not kill me makes me stronger"
 *   - Viktor Frankl: 苦难可以被转化为意义
 *   - Psychology: Adversarial Growth — 逆境成长
 *
 * @version 1.0.0
 */

class PostTraumaticGrowth {
  constructor(options = {}) {
    this._config = {
      growthModel: options.growthModel || 'teteschi-calhoun',
      includeSpiritual: options.includeSpiritual || true,
      cultureSensitive: options.cultureSensitive || true,
    };

    // ─── 五维度成长模型 ──────────────────────────────────────────────────
    this._dimensions = {
      newPossibilities: { name: 'New Possibilities', nameZh: '新可能性', description: 'New opportunities, paths, and possibilities that emerged from the struggle.', descriptionZh: '从挣扎中涌现的新机会、新道路、新可能。', indicators: ['new_directions', 'new_opportunities', 'changed_priorities'] },
      relatingToOthers: { name: 'Relating to Others', nameZh: '人际关系变化', description: 'Deeper, more meaningful connections with others. Increased compassion.', descriptionZh: '与他人更深、更有意义的连接。增加的同情心。', indicators: ['deeper_connections', 'increased_compassion', 'vulnerability_as_strength'] },
      personalStrength: { name: 'Personal Strength', nameZh: '个人力量', description: 'Increased self-reliance, confidence, and resilience. "I can handle anything."', descriptionZh: '增加的自我依赖、信心和韧性。「我什么都能应对。」', indicators: ['self_reliance', 'confidence', 'resilience', 'mastery'] },
      appreciationOfLife: { name: 'Appreciation of Life', nameZh: '生命欣赏', description: 'Greater appreciation for life, everyday moments, and what truly matters.', descriptionZh: '对生活、日常瞬间和真正重要的事更大的欣赏。', indicators: ['gratitude', 'present_moment_awareness', 'reprioritization'] },
      spiritualChange: { name: 'Spiritual/Existential Change', nameZh: '灵性/存在变化', description: 'Changed understanding of meaning, purpose, and connection to something larger.', descriptionZh: '对意义、目的和与更大事物连接的改变理解。', indicators: ['meaning_shift', 'spiritual_connection', 'existential_awareness'] },
    };

    // ─── 成长记录 ──────────────────────────────────────────────────────
    this._growthEvents = [];
    this._growthScores = {};
    for (const [key, dim] of Object.entries(this._dimensions)) {
      this._growthScores[key] = { score: 0, evidence: [], timestamp: null };
    }

    // ─── 创伤后资源 ──────────────────────────────────────────────────────
    this._postTraumaResources = {
      strengths: [],
      newSkills: [],
      supportNetwork: [],
      meaningFramework: null,
      spiritualResources: [],
    };

    this._stats = {
      totalGrowthAssessments: 0,
      growthEvents: 0,
      dimensionScores: {},
      averageGrowthScore: 0,
      transformationLevel: 'none', // 'none' | 'emerging' | 'developing' | 'significant' | 'transformative'
    };
  }

  // ─── 成长评估 ──────────────────────────────────────────────────────────

  assessGrowth(growthEvent) {
    this._stats.totalGrowthAssessments++;
    const { traumaDescription, timeSinceTrauma, currentChanges, reflections } = growthEvent || {};

    // 评估每个维度
    const dimensionScores = {};
    for (const [key, dim] of Object.entries(this._dimensions)) {
      const evidence = (currentChanges || []).filter(c => {
        const indicators = dim.indicators || [];
        return indicators.some(ind => (c || '').toLowerCase().includes(ind.replace('_', ' ')));
      });
      const score = Math.min(1, evidence.length * 0.2 + 0.1);
      dimensionScores[key] = { score: +score.toFixed(3), evidence, count: evidence.length };
    }

    // 计算整体成长
    const scores = Object.values(dimensionScores).map(d => d.score);
    const overallGrowth = scores.reduce((a, b) => a + b, 0) / scores.length;
    const transformationLevel = this._determineTransformationLevel(overallGrowth);

    // 更新成长分数
    for (const [key, scoreData] of Object.entries(dimensionScores)) {
      if (scoreData.score > (this._growthScores[key]?.score || 0)) {
        this._growthScores[key].score = scoreData.score;
        this._growthScores[key].evidence.push(...scoreData.evidence);
        this._growthScores[key].timestamp = Date.now();
      }
    }

    this._stats.averageGrowthScore = +(
      Object.values(this._growthScores).reduce((s, g) => s + g.score, 0) / Object.keys(this._growthScores).length
    ).toFixed(3);
    this._stats.transformationLevel = transformationLevel;

    // 生成成长叙事
    const narrative = this._generateGrowthNarrative(dimensionScores, transformationLevel, reflections);

    // 推荐成长实践
    const recommendations = this._generateGrowthRecommendations(dimensionScores, transformationLevel);

    const entry = {
      traumaDescription: traumaDescription || '',
      timeSinceTrauma,
      dimensionScores,
      overallGrowth: +overallGrowth.toFixed(3),
      transformationLevel,
      narrative,
      recommendations,
      timestamp: Date.now(),
    };

    this._growthEvents.push(entry);
    if (this._growthEvents.length > 100) {
      this._growthEvents = this._growthEvents.slice(-50);
    }

    this._stats.growthEvents++;
    this._stats.dimensionScores = dimensionScores;

    return entry;
  }

  _determineTransformationLevel(overall) {
    if (overall >= 0.8) return 'transformative';
    if (overall >= 0.6) return 'significant';
    if (overall >= 0.4) return 'developing';
    if (overall >= 0.2) return 'emerging';
    return 'none';
  }

  _generateGrowthNarrative(dimensionScores, level, reflections) {
    const topDimensions = Object.entries(dimensionScores)
      .filter(([_, d]) => d.score > 0.3)
      .sort((a, b) => b[1].score - a[1].score)
      .map(([key, d]) => ({ name: this._dimensions[key].nameZh, score: d.score }));

    const levelMap = {
      transformative: '创伤已转化为深刻的成长。五个维度都经历了显著变化。',
      significant: '显著的创伤后成长。多个维度展现了积极变化。',
      developing: '成长正在发展中。部分维度开始展现积极变化。',
      emerging: '成长的萌芽。开始看到变化的迹象。',
      none: '成长尚未显现。这本身是正常的 — 成长需要时间。',
    };

    return {
      level,
      summary: levelMap[level],
      topGrowthAreas: topDimensions.map(d => `${d.name}(${d.score})`).join('、'),
      reflections: reflections || '',
    };
  }

  _generateGrowthRecommendations(dimensionScores, level) {
    const recommendations = [];

    for (const [key, scoreData] of Object.entries(dimensionScores)) {
      if (scoreData.score < 0.4) {
        const dim = this._dimensions[key];
        recommendations.push({
          dimension: key,
          nameZh: dim.nameZh,
          suggestion: this._growthSuggestion(key),
          suggestionZh: this._growthSuggestionZh(key),
          priority: 'medium',
        });
      }
    }

    if (level === 'none' || level === 'emerging') {
      recommendations.push({
        dimension: 'patience',
        nameZh: '耐心',
        suggestion: 'Growth cannot be forced. It emerges naturally when safety is established.',
        suggestionZh: '成长不能强迫。当安全建立时，它会自然涌现。',
        priority: 'high',
      });
    }

    return recommendations;
  }

  _growthSuggestion(dimension) {
    const suggestions = {
      newPossibilities: 'Explore new activities and paths. What would you do if fear were not a factor?',
      relatingToOthers: 'Practice vulnerability with safe people. Join a support group.',
      personalStrength: 'Notice your resilience. Document small victories. "I survived 100% of my worst days."',
      appreciationOfLife: 'Practice daily gratitude. Savor small moments. What is precious right now?',
      spiritualChange: 'Engage with meaning. Read, reflect, discuss. What does this mean for your life?',
    };
    return suggestions[dimension] || 'Continue the healing journey. Growth will follow.';
  }

  _growthSuggestionZh(dimension) {
    const suggestions = {
      newPossibilities: '探索新活动和道路。如果恐惧不是因素，你会做什么？',
      relatingToOthers: '与安全的人练习脆弱性。加入支持小组。',
      personalStrength: '注意你的韧性。记录小胜利。「我度过了100%的最糟糕日子。」',
      appreciationOfLife: '练习每日感恩。品味小瞬间。此刻什么是最珍贵的？',
      spiritualChange: '与意义对话。阅读、反思、讨论。这对你的人生意味着什么？',
    };
    return suggestions[dimension] || '继续疗愈之旅。成长会跟随。';
  }

  // ─── 资源收集 ──────────────────────────────────────────────────────────

  recordResource(resource) {
    const type = resource.type || 'strength';
    const entry = { ...resource, timestamp: Date.now() };

    switch (type) {
      case 'strength':
        this._postTraumaResources.strengths.push(entry);
        break;
      case 'skill':
        this._postTraumaResources.newSkills.push(entry);
        break;
      case 'support':
        this._postTraumaResources.supportNetwork.push(entry);
        break;
      case 'meaning':
        this._postTraumaResources.meaningFramework = entry;
        break;
      case 'spiritual':
        this._postTraumaResources.spiritualResources.push(entry);
        break;
    }

    return entry;
  }

  // ─── 统计 ──────────────────────────────────────────────────────────────

  getStats() {
    return {
      ...this._stats,
      growthDimensions: this._dimensions,
      growthScores: { ...this._growthScores },
      transformationLevel: this._stats.transformationLevel,
      resourceCount: {
        strengths: this._postTraumaResources.strengths.length,
        skills: this._postTraumaResources.newSkills.length,
        support: this._postTraumaResources.supportNetwork.length,
        spiritual: this._postTraumaResources.spiritualResources.length,
      },
      recentGrowth: this._growthEvents.slice(-3).map(g => ({
        level: g.transformationLevel,
        overall: g.overallGrowth,
        topArea: g.narrative?.topGrowthAreas?.split('、')[0],
      })),
    };
  }
}

module.exports = { PostTraumaticGrowth };
