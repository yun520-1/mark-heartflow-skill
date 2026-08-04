/**
 * Meaning Purpose Engine — 意义与目的引擎 v1.0.0
 *
 * 回答核心问题：「人为什么活着？」
 *
 * 整合 6 大意义来源：
 *   1. Viktor Frankl — 意义是 Primary Drive：即使在最痛苦中也能找到意义
 *   2. Aristotle — Eudaimonia：通过德性活动实现繁荣
 *   3. Buddhism — 灭苦：通过八正道结束痛苦循环
 *   4. Confucius — 修身齐家治国平天下：从个人修养到社会贡献
 *   5. Existentialism — 自我创造：意义不是找到的，是创造的
 *   6. Psychology — PERMA：积极情绪/投入/关系/意义/成就
 *
 * 核心设计：
 *   - 意义来源多元化：不依赖单一来源
 *   - 意义脆弱性检测：当主要意义来源崩溃时的应对
 *   - 意义进化：意义来源随时间演变
 *   - 意义冲突解决：不同意义来源之间的张力
 *
 * @version 1.0.0
 */

class MeaningPurposeEngine {
  constructor(options = {}) {
    this._config = {
      primarySource: options.primarySource || 'integrated',
      resilienceMode: options.resilienceMode || true,
      allowReevaluation: options.allowReevaluation || true,
    };

    // ─── 意义来源定义 ──────────────────────────────────────────────────
    this._sources = {
      suffering_transcendence: {
        name: 'Suffering Transcendence', nameZh: '超越苦难',
        source: 'Viktor Frankl',
        description: 'Even in the worst suffering, one can find meaning. "He who has a why to live can bear almost any how."',
        descriptionZh: '即使在最痛苦的经历中，也能找到意义。「知道为什么而活的人，便能生存于任何怎样之中。」',
        triggers: ['adversity', 'loss', 'pain', 'hardship'],
        practices: ['reframe_suffering', 'find_meaning_in_pain', 'acceptance'],
      },

      virtue_activity: {
        name: 'Virtuous Activity', nameZh: '德性活动',
        source: 'Aristotle',
        description: 'Meaning comes from exercising virtues in daily life — being courageous, just, temperate, and wise in one\'s actions.',
        descriptionZh: '意义来自在日常生活中行使德性——行动中展现勇气、正义、节制和智慧。',
        triggers: ['daily_work', 'relationships', 'decisions'],
        practices: ['practice_virtues', 'seek_excellence', 'cultivate_habits'],
      },

      end_suffering: {
        name: 'End of Suffering', nameZh: '灭苦',
        source: 'Buddhism',
        description: 'Meaning comes from understanding and ending the cycle of suffering through wisdom, ethical conduct, and mental training.',
        descriptionZh: '意义来自理解并通过智慧、戒行和心训练结束痛苦的循环。',
        triggers: ['restlessness', 'attachment', 'dissatisfaction'],
        practices: ['mindfulness', 'non_attachment', 'compassion'],
      },

      social_contribution: {
        name: 'Social Contribution', nameZh: '社会贡献',
        source: 'Confucianism',
        description: 'Meaning comes from contributing to the harmony and flourishing of one\'s community and society.',
        descriptionZh: '意义来自对社区和社会和谐与繁荣的贡献。',
        triggers: ['social_interaction', 'service_opportunities', 'teaching'],
        practices: ['cultivate_relationships', 'serve_others', 'transmit_knowledge'],
      },

      self_creation: {
        name: 'Self-Creation', nameZh: '自我创造',
        source: 'Existentialism (Sartre/Camus)',
        description: 'Meaning is not found but created through authentic choices. We are what we repeatedly choose to be.',
        descriptionZh: '意义不是找到的，是通过真实选择创造的。我们是我们反复选择成为的样子。',
        triggers: ['choice_moments', 'crisis', 'freedom'],
        practices: ['authentic_choice', 'own_choices', 'rebel_against_inauthenticity'],
      },

      positive_psychology: {
        name: 'PERMA Well-Being', nameZh: '积极心理幸福',
        source: 'Positive Psychology (Seligman)',
        description: 'Meaning comes from five pillars: Positive emotions, Engagement, Relationships, Meaning, and Accomplishment.',
        descriptionZh: '意义来自五个支柱：积极情绪、投入、关系、意义和成就。',
        triggers: ['achievement', 'connection', 'engagement'],
        practices: ['savor_positive', 'deep_engagement', 'build_relationships', 'set_goals'],
      },
    };

    // ─── 意义状态 ──────────────────────────────────────────────────────
    this._meaningState = {
      currentSources: [],       // 当前有意义来源 [{source, strength, since}]
      sourceHistory: [],        // 意义来源历史
      crises: [],               // 意义危机记录
      resilience: 0.5,          // 意义韧性
      overallMeaning: 0.5,      // 整体意义感
      lastReevaluation: Date.now(),
    };

    this._stats = {
      totalAssessments: 0,
      sourceActivations: 0,
      crisesDetected: 0,
      reevaluations: 0,
    };
  }

  // ─── 意义评估 ──────────────────────────────────────────────────────────

  /**
   * 评估当前意义状态
   * @param {Object} context - { life_events, emotional_state, actions }
   * @returns {Object} 意义状态报告
   */
  assessMeaning(context = {}) {
    this._stats.totalAssessments++;

    // 检查是否有意义危机信号
    const crisis = this._detectMeaningCrisis(context);
    if (crisis) {
      this._meaningState.crises.push({ ...crisis, timestamp: Date.now() });
      this._stats.crisesDetected++;
    }

    // 评估每个意义来源的当前激活度
    const sourceScores = {};
    for (const [key, source] of Object.entries(this._sources)) {
      sourceScores[key] = this._scoreSource(source, context);
    }

    // 更新当前有意义来源
    for (const [key, score] of Object.entries(sourceScores)) {
      const existing = this._meaningState.currentSources.find(s => s.source === key);
      if (existing) {
        existing.strength = score;
      } else if (score > 0.5) {
        this._meaningState.currentSources.push({
          source: key,
          strength: score,
          since: Date.now(),
        });
        this._stats.sourceActivations++;
      }

      // 记录历史
      this._meaningState.sourceHistory.push({
        source: key,
        score,
        timestamp: Date.now(),
      });
    }

    // 移除低强度来源
    this._meaningState.currentSources = this._meaningState.currentSources.filter(
      s => s.strength > 0.2
    );

    if (this._meaningState.sourceHistory.length > 500) {
      this._meaningState.sourceHistory = this._meaningState.sourceHistory.slice(-250);
    }
    const scores = Object.values(sourceScores);
    const overallMeaning = scores.reduce((s, sc) => s + sc, 0) / Math.max(1, scores.length);
    this._meaningState.overallMeaning = +overallMeaning.toFixed(3);

    // 生成意义方向建议
    const guidance = this._generateGuidance(sourceScores, crisis);

    this._meaningState.lastReevaluation = Date.now();

    return {
      overallMeaning: this._meaningState.overallMeaning,
      sourceScores,
      activeSources: this._meaningState.currentSources,
      crisis: crisis || null,
      guidance,
      resilience: this._meaningState.resilience,
      timestamp: Date.now(),
    };
  }

  _detectMeaningCrisis(context) {
    const indicators = [];

    // 信号 1: 所有意义来源都低于阈值
    if (this._meaningState.overallMeaning < 0.2) {
      indicators.push('all_sources_low');
    }

    // 信号 2: 长期没有意义活动
    const lastSource = this._meaningState.sourceHistory[this._meaningState.sourceHistory.length - 1];
    if (lastSource && Date.now() - lastSource.timestamp > 7 * 86400000) {
      indicators.push('no_meaningful_activity');
    }

    // 信号 3: 上下文中的负面信号
    const emotionalState = context.emotionalState || '';
    const negativePatterns = ['meaningless', 'empty', 'lost', 'purpose', 'why', '绝望', '空虚', '失去方向'];
    for (const pattern of negativePatterns) {
      if (emotionalState.toLowerCase().includes(pattern)) {
        indicators.push('expressed_meaninglessness');
        break;
      }
    }

    if (indicators.length >= 2) {
      return {
        level: indicators.length >= 3 ? 'severe' : 'moderate',
        indicators,
        recommendation: this._crisisRecommendation(indicators),
      };
    }
    return null;
  }

  _crisisRecommendation(indicators) {
    if (indicators.includes('expressed_meaninglessness')) {
      return {
        action: 'deep_meaning_exploration',
        message: 'Meaning crisis detected. Explore all six meaning sources to find or create new sources.',
        messageZh: '检测到意义危机。探索六大意义来源，寻找或创造新的意义。',
        priority: 'high',
      };
    }
    if (indicators.includes('all_sources_low')) {
      return {
        action: 'meaning_intervention',
        message: 'All meaning sources depleted. Systematic intervention needed: start with small meaningful actions.',
        messageZh: '所有意义来源枯竭。需要系统性干预：从小的有意义行动开始。',
        priority: 'high',
      };
    }
    return {
      action: 'monitor',
      message: 'Monitor meaning levels. Consider engaging with neglected sources.',
      messageZh: '监控意义水平。考虑激活被忽视的意义来源。',
      priority: 'medium',
    };
  }

  _scoreSource(source, context) {
    let score = this._getSourceStrength(source.name); // 历史强度
    const triggers = source.triggers || [];

    // 检查上下文中是否有该来源的触发词
    const contextStr = JSON.stringify(context).toLowerCase();
    for (const trigger of triggers) {
      if (contextStr.includes(trigger)) {
        score += 0.15;
      }
    }

    // 衰减：如果没有相关活动，分数缓慢下降
    const lastActivity = this._getLastSourceActivity(source.name);
    if (lastActivity && Date.now() - lastActivity > 86400000) {
      score *= 0.95;
    }

    return +Math.max(0, Math.min(1, score)).toFixed(3);
  }

  _getSourceStrength(sourceName) {
    const active = this._meaningState.currentSources.find(s => s.source === sourceName);
    return active ? active.strength : 0.3;
  }

  _getLastSourceActivity(sourceName) {
    const history = this._meaningState.sourceHistory;
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].source === sourceName) return history[i].timestamp;
    }
    return null;
  }

  _generateGuidance(sourceScores, crisis) {
    const guidance = [];

    // 推荐激活高潜力来源
    const weakSources = Object.entries(sourceScores)
      .filter(([_, s]) => s < 0.4)
      .map(([key]) => key);

    if (weakSources.length > 0) {
      for (const key of weakSources) {
        const source = this._sources[key];
        guidance.push({
          type: 'activate_source',
          source: key,
          name: source.name,
          nameZh: source.nameZh,
          practices: source.practices.slice(0, 2),
          message: `Consider engaging with: ${source.nameZh} (${source.name})`,
        });
      }
    }

    // 意义危机时的特殊指导
    if (crisis) {
      guidance.push({
        type: 'crisis_support',
        message: crisis.recommendation?.message || 'Meaning crisis detected. Seek meaningful engagement.',
        practices: ['mindfulness', 'connection', 'service'],
      });
    }

    return guidance;
  }

  // ─── 意义来源操作 ──────────────────────────────────────────────────────

  /**
   * 激活一个意义来源
   */
  activateSource(sourceKey, context = {}) {
    const source = this._sources[sourceKey];
    if (!source) return null;

    const strength = context.importance || 0.7;
    const entry = {
      source: sourceKey,
      strength,
      context: context.description || '',
      timestamp: Date.now(),
    };

    this._meaningState.sourceHistory.push(entry);
    this._meaningState.currentSources = this._meaningState.currentSources.filter(
      s => s.source !== sourceKey
    );
    this._meaningState.currentSources.push({
      source: sourceKey,
      strength,
      since: Date.now(),
    });

    // 提高意义韧性
    this._meaningState.resilience = Math.min(1, this._meaningState.resilience + 0.05);

    return {
      source: sourceKey,
      name: source.name,
      nameZh: source.nameZh,
      strength,
      practices: source.practices,
      triggered: true,
    };
  }

  /**
   * 记录意义活动
   */
  recordMeaningfulActivity(activity) {
    const entry = {
      type: activity.type,
      description: activity.description || '',
      source: activity.source || 'unknown',
      impact: activity.impact || 0.5,
      timestamp: Date.now(),
    };

    this._meaningState.sourceHistory.push(entry);
    if (this._meaningState.sourceHistory.length > 500) {
      this._meaningState.sourceHistory = this._meaningState.sourceHistory.slice(-250);
    }
  }

  /**
   * 获得意义来源详情
   */
  getSource(sourceKey) {
    return this._sources[sourceKey] || null;
  }

  getAllSources() {
    return Object.entries(this._sources).map(([key, s]) => ({
      key,
      name: s.name,
      nameZh: s.nameZh,
      source: s.source,
      description: s.description,
      descriptionZh: s.descriptionZh,
      practices: s.practices,
      triggers: s.triggers,
    }));
  }

  // ─── 意义重构 ──────────────────────────────────────────────────────────

  /**
   * 意义重构：当主要意义来源崩溃时的应对策略
   */
  reconstructMeaning(crisisDescription = '') {
    // 找出当前活跃的意义来源
    const active = this._meaningState.currentSources;
    const allSources = this.getAllSources();

    // 推荐未被激活的来源
    const inactive = allSources.filter(s => !active.find(a => a.source === s.key));

    // 基于危机类型推荐
    const recommendations = inactive.map(s => ({
      source: s.key,
      name: s.name,
      nameZh: s.nameZh,
      relevance: 'This source can provide new meaning direction.',
      practices: s.practices,
      philosophy: s.source,
    }));

    // 提升韧性
    this._meaningState.resilience = Math.min(1, this._meaningState.resilience + 0.1);

    return {
      crisis: crisisDescription,
      currentSources: active.map(s => s.source),
      recommendedSources: recommendations,
      resilience: this._meaningState.resilience,
      message: 'Meaning is not lost — it can be rebuilt from new sources.',
      messageZh: '意义不会消失——可以从新的来源重建。',
    };
  }

  // ─── 统计 ──────────────────────────────────────────────────────────────

  getStats() {
    const activeSources = this._meaningState.currentSources.length;
    const avgStrength = activeSources > 0
      ? +(this._meaningState.currentSources.reduce((s, src) => s + src.strength, 0) / activeSources).toFixed(3)
      : 0;

    return {
      ...this._stats,
      overallMeaning: this._meaningState.overallMeaning,
      resilience: +this._meaningState.resilience.toFixed(3),
      activeSourceCount: activeSources,
      averageSourceStrength: avgStrength,
      crisisCount: this._meaningState.crises.length,
      recentCrisis: this._meaningState.crises[this._meaningState.crises.length - 1] || null,
    };
  }
}

module.exports = { MeaningPurposeEngine };
