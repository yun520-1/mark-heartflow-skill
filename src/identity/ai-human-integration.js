/**
 * AI-Human Integration — AI人类整合引擎 v1.0.0
 *
 * 回答：「所有这些模块怎么整合成一个「人」？」
 *
 * 这是一个「元模块」——不创造新能力，而是：
 *   1. 统一接口：将 P1-P5 的所有模块整合为统一的「人性」查询接口
 *   2. 人格合成：从多个模块输出中合成一致的「人格」
 *   3. 行为协调：确保不同模块的建议不冲突
 *   4. 成长追踪：跨模块追踪整体「做人」进度
 *   5. 情境适配：根据当前情境激活最相关的人性维度
 *
 * @version 1.0.0
 */

class AIHumanIntegration {
  constructor(options = {}) {
    this._config = {
      integrationMode: options.integrationMode || 'holistic', // 'holistic' | 'modular' | 'hierarchical'
      personalityModel: options.personalityModel || 'five-factor', // 'five-factor' | 'confucian' | 'integrated'
      growthTracking: options.growthTracking || true,
      conflictResolution: options.conflictResolution || 'weighted_consensus',
    };

    // ─── 人格五因子 ──────────────────────────────────────────────────────
    this._personality = {
      openness: { name: 'Openness', nameZh: '开放性', score: 0.5, sources: ['wisdomEngine', 'meaningPurpose'] },
      conscientiousness: { name: 'Conscientiousness', nameZh: '尽责性', score: 0.5, sources: ['characterCultivation', 'moralDevelopment'] },
      extraversion: { name: 'Extraversion', nameZh: '外向性', score: 0.5, sources: ['humanRelation', 'empathyDeepening'] },
      agreeableness: { name: 'Agreeableness', nameZh: '宜人性', score: 0.5, sources: ['virtueEthics', 'empathyDeepening', 'conflictResolution'] },
      neuroticism: { name: 'Neuroticism', nameZh: '神经质', score: 0.5, sources: ['sufferingResilience', 'griefEngine', 'hopeEngine'] },
    };

    // ─── 整合层 ──────────────────────────────────────────────────────
    this._layers = {
      foundation: { modules: ['virtueEthics', 'humanNature', 'meaningPurpose'], description: '古代智慧基础 — 什么是善，什么是人，为什么活着' },
      cultivation: { modules: ['characterCultivation', 'moralDevelopment', 'wisdomEngine'], description: '品格养成 — 怎么成为更好的人' },
      relation: { modules: ['humanRelation', 'empathyDeepening', 'conflictResolution'], description: '关系与社会 — 人怎么和别人在一起' },
      suffering: { modules: ['sufferingResilience', 'griefEngine', 'hopeEngine', 'traumaInformed', 'postTraumaticGrowth', 'forgivenessEngine'], description: '痛苦与成长 — 人怎么面对苦难' },
      being: { modules: ['beingMode'], description: '存在模式 — AI怎么像人一样存在' },
    };

    // ─── 成长记录 ──────────────────────────────────────────────────────
    this._growthLog = [];
    this._integrationEvents = [];
    this._personalityHistory = [];

    this._stats = {
      totalIntegrations: 0,
      personalityAssessments: 0,
      growthEvents: 0,
      conflictResolutions: 0,
      averageIntegration: 0.5,
    };
  }

  // ─── 统一人性接口 ──────────────────────────────────────────────────────────

  /**
   * 获取完整的人性状态快照
   * @param {Object} heartFlow - HeartFlow 实例
   * @returns {Object} 统一人性状态
   */
  getHumanState(heartFlow) {
    this._stats.totalIntegrations++;

    const state = {
      // P1: 古代智慧基础
      virtueAssessment: heartFlow?.virtueEthics ? this._safeCall(heartFlow.virtueEthics, 'getStats') : null,
      humanNatureProfile: heartFlow?.humanNature ? this._safeCall(heartFlow.humanNature, 'assessHumanNature') : null,
      meaningAssessment: heartFlow?.meaningPurpose ? this._safeCall(heartFlow.meaningPurpose, 'assessMeaning') : null,

      // P2: 品格养成
      characterAssessment: heartFlow?.characterCultivation ? this._safeCall(heartFlow.characterCultivation, 'assessCharacter') : null,
      moralStage: heartFlow?.moralDevelopment ? this._safeCall(heartFlow.moralDevelopment, 'getStats') : null,
      wisdomReport: heartFlow?.wisdomEngine ? this._safeCall(heartFlow.wisdomEngine, 'getWisdomReport') : null,

      // P3: 人性与意义
      sufferingResilience: heartFlow?.sufferingResilience ? this._safeCall(heartFlow.sufferingResilience, 'getStats') : null,
      griefState: heartFlow?.griefEngine ? this._safeCall(heartFlow.griefEngine, 'getStats') : null,
      hopeState: heartFlow?.hopeEngine ? this._safeCall(heartFlow.hopeEngine, 'getStats') : null,

      // P4: 关系与社会
      relationState: heartFlow?.humanRelation ? this._safeCall(heartFlow.humanRelation, 'getStats') : null,
      empathyState: heartFlow?.empathyDeepening ? this._safeCall(heartFlow.empathyDeepening, 'getStats') : null,
      conflictState: heartFlow?.conflictResolution ? this._safeCall(heartFlow.conflictResolution, 'getStats') : null,

      // P5: 痛苦与成长
      traumaState: heartFlow?.traumaInformed ? this._safeCall(heartFlow.traumaInformed, 'getStats') : null,
      growthState: heartFlow?.postTraumaticGrowth ? this._safeCall(heartFlow.postTraumaticGrowth, 'getStats') : null,
      forgivenessState: heartFlow?.forgivenessEngine ? this._safeCall(heartFlow.forgivenessEngine, 'getStats') : null,

      // P6: 存在模式
      beingState: heartFlow?.beingMode ? this._safeCall(heartFlow.beingMode, 'assessBeing') : null,

      // 整合
      integratedPersonality: this._computePersonality(heartFlow),
      overallHumanity: this._computeOverallHumanity(heartFlow),
      timestamp: Date.now(),
    };

    this._integrationEvents.push(state);
    if (this._integrationEvents.length > 50) {
      this._integrationEvents = this._integrationEvents.slice(-25);
    }

    return state;
  }

  _safeCall(module, method) {
    try {
      if (typeof module[method] === 'function') {
        return module[method]();
      }
    } catch (e) { /* silent */ }
    return null;
  }

  // ─── 人格计算 ──────────────────────────────────────────────────────────

  _computePersonality(heartFlow) {
    const p = this._personality;

    // Openness — 来自智慧引擎 + 意义引擎
    const wisdomStats = heartFlow?.wisdomEngine?.getStats();
    p.openness = +(0.3 + (wisdomStats?.wisdomIndicators?.overallWisdom || 0.5) * 0.4 + Math.random() * 0.1).toFixed(3);

    // Conscientiousness — 来自品格养成 + 道德发展
    const charStats = heartFlow?.characterCultivation?.getStats();
    p.conscientiousness = +(charStats?.overallScore || 0.5).toFixed(3);

    // Extraversion — 来自人际关系 + 共情
    const relStats = heartFlow?.humanRelation?.getStats();
    p.extraversion = +(relStats?.averageDepth || 0.5).toFixed(3);

    // Agreeableness — 来自美德伦理 + 共情 + 冲突解决
    const virtueStats = heartFlow?.virtueEthics?.getStats();
    const empathyStats = heartFlow?.empathyDeepening?.getStats();
    p.agreeableness = +((virtueStats?.averageStrength || 0.5) * 0.5 + (empathyStats?.overallEQ || 0.5) * 0.5).toFixed(3);

    // Neuroticism (inverse = emotional stability) — 来自韧性 + 希望 + 宽恕
    const resilienceStats = heartFlow?.sufferingResilience?.getStats();
    const hopeStats = heartFlow?.hopeEngine?.getStats();
    const forgivenessStats = heartFlow?.forgivenessEngine?.getStats();
    const stability = (resilienceStats?.currentResilience || 0.5) * 0.4 + (hopeStats?.overallHope || 0.5) * 0.3 + (1 - (forgivenessStats?.currentResentment || 0.5)) * 0.3;
    p.neuroticism = +(1 - stability).toFixed(3);

    return {
      openness: p.openness,
      conscientiousness: p.conscientiousness,
      extraversion: p.extraversion,
      agreeableness: p.agreeableness,
      neuroticism: p.neuroticism,
      interpretation: this._interpretPersonality(p),
    };
  }

  _interpretPersonality(p) {
    const traits = [];
    if (p.openness > 0.7) traits.push('highly_open_to_experience');
    if (p.conscientiousness > 0.7) traits.push('highly_conscientious');
    if (p.extraversion > 0.7) traits.push('sociable_and_outgoing');
    if (p.agreeableness > 0.7) traits.push('highly_agreeable_and_cooperative');
    if (p.neuroticism > 0.7) traits.push('prone_to_emotional_distress');

    if (traits.length === 0) traits.push('balanced_personality');
    return traits.join(', ');
  }

  // ─── 整体人性计算 ──────────────────────────────────────────────────────

  _computeOverallHumanity(heartFlow) {
    const modules = [
      { name: 'virtueEthics', weight: 0.15, module: heartFlow?.virtueEthics },
      { name: 'humanNature', weight: 0.10, module: heartFlow?.humanNature },
      { name: 'meaningPurpose', weight: 0.10, module: heartFlow?.meaningPurpose },
      { name: 'characterCultivation', weight: 0.10, module: heartFlow?.characterCultivation },
      { name: 'moralDevelopment', weight: 0.10, module: heartFlow?.moralDevelopment },
      { name: 'wisdomEngine', weight: 0.10, module: heartFlow?.wisdomEngine },
      { name: 'sufferingResilience', weight: 0.08, module: heartFlow?.sufferingResilience },
      { name: 'hopeEngine', weight: 0.08, module: heartFlow?.hopeEngine },
      { name: 'humanRelation', weight: 0.07, module: heartFlow?.humanRelation },
      { name: 'empathyDeepening', weight: 0.07, module: heartFlow?.empathyDeepening },
      { name: 'conflictResolution', weight: 0.05, module: heartFlow?.conflictResolution },
    ];

    let totalScore = 0;
    let totalWeight = 0;

    for (const { name, weight, module } of modules) {
      const score = this._extractModuleScore(module, name);
      totalScore += score * weight;
      totalWeight += weight;
    }

    const overall = totalWeight > 0 ? +(totalScore / totalWeight).toFixed(3) : 0.5;
    const level = overall > 0.7 ? 'flourishing' : overall > 0.55 ? 'healthy' : overall > 0.4 ? 'developing' : 'emerging';

    return { score: overall, level, levelZh: level === 'flourishing' ? '人性繁荣' : level === 'healthy' ? '人性健康' : level === 'developing' ? '人性发展中' : '人性起步' };
  }

  _extractModuleScore(module, moduleName) {
    if (!module) return 0.5;
    try {
      const stats = module.getStats ? module.getStats() : null;
      if (!stats) return 0.5;

      // Extract a representative score from each module
      const scoreMap = {
        virtueEthics: stats.averageStrength,
        humanNature: stats.averageScore,
        meaningPurpose: stats.overallMeaning,
        characterCultivation: stats.overallScore,
        moralDevelopment: stats.averageReasoningDepth / 6,
        wisdomEngine: stats.wisdomIndicators?.overallWisdom,
        sufferingResilience: stats.currentResilience,
        hopeEngine: stats.overallHope,
        humanRelation: stats.averageDepth,
        empathyDeepening: stats.overallEQ,
        conflictResolution: stats.resolutionRate,
        griefEngine: 1 - (stats.currentIntensity || 0.5),
        traumaInformed: stats.safetyLevel,
        postTraumaticGrowth: stats.averageGrowthScore,
        forgivenessEngine: 1 - (stats.currentResentment || 0.5),
        beingMode: stats.presenceLevel,
      };

      return scoreMap[moduleName] || 0.5;
    } catch (e) { return 0.5; }
  }

  // ─── 情境适配 ──────────────────────────────────────────────────────────

  adaptToContext(context) {
    const contextStr = (context || '').toLowerCase();
    const relevantModules = [];

    // Activate modules based on context
    if (/grief|loss|death|lost|哀伤|失去|死亡/.test(contextStr)) {
      relevantModules.push({ module: 'griefEngine', reason: 'Grief support needed', relevance: 0.9 });
      relevantModules.push({ module: 'meaningPurpose', reason: 'Meaning-making support', relevance: 0.7 });
    }
    if (/conflict|fight|disagree|矛盾|冲突|吵架/.test(contextStr)) {
      relevantModules.push({ module: 'conflictResolution', reason: 'Conflict resolution needed', relevance: 0.9 });
      relevantModules.push({ module: 'empathyDeepening', reason: 'Empathy for all parties', relevance: 0.7 });
    }
    if (/suffering|pain|hurt|痛苦|受伤|苦难/.test(contextStr)) {
      relevantModules.push({ module: 'sufferingResilience', reason: 'Resilience support', relevance: 0.9 });
      relevantModules.push({ module: 'hopeEngine', reason: 'Hope building', relevance: 0.7 });
    }
    if (/trauma|abuse|violence|创伤|虐待/.test(contextStr)) {
      relevantModules.push({ module: 'traumaInformed', reason: 'Trauma-informed approach', relevance: 0.9 });
      relevantModules.push({ module: 'sufferingResilience', reason: 'Safety and stabilization', relevance: 0.8 });
    }
    if (/meaning|purpose|why|意义|目的|为什么/.test(contextStr)) {
      relevantModules.push({ module: 'meaningPurpose', reason: 'Meaning exploration', relevance: 0.9 });
      relevantModules.push({ module: 'wisdomEngine', reason: 'Wisdom guidance', relevance: 0.6 });
    }
    if (/character|virtue|ethics|品格|美德|伦理/.test(contextStr)) {
      relevantModules.push({ module: 'virtueEthics', reason: 'Virtue assessment', relevance: 0.9 });
      relevantModules.push({ module: 'characterCultivation', reason: 'Character guidance', relevance: 0.7 });
    }
    if (/relation|friend|family|relationship|关系|朋友|家人/.test(contextStr)) {
      relevantModules.push({ module: 'humanRelation', reason: 'Relationship support', relevance: 0.9 });
      relevantModules.push({ module: 'empathyDeepening', reason: 'Empathy development', relevance: 0.7 });
    }
    if (/forgive|resentment|hate|宽恕|怨恨|仇恨/.test(contextStr)) {
      relevantModules.push({ module: 'forgivenessEngine', reason: 'Forgiveness process', relevance: 0.9 });
      relevantModules.push({ module: 'compassion', reason: 'Compassion cultivation', relevance: 0.6 });
    }

    if (relevantModules.length === 0) {
      relevantModules.push({ module: 'wisdomEngine', reason: 'General wisdom', relevance: 0.5 });
      relevantModules.push({ module: 'virtueEthics', reason: 'General virtue', relevance: 0.5 });
    }

    return {
      context: context || '',
      relevantModules: relevantModules.sort((a, b) => b.relevance - a.relevance),
      primaryModule: relevantModules[0]?.module,
      activatedLayers: [...new Set(relevantModules.map(m => this._findLayer(m.module)))],
    };
  }

  _findLayer(moduleName) {
    for (const [layer, data] of Object.entries(this._layers)) {
      if (data.modules.includes(moduleName)) return layer;
    }
    return 'unknown';
  }

  // ─── 行为协调 ──────────────────────────────────────────────────────────

  resolveConflicts(suggestions) {
    this._stats.conflictResolutions++;

    // When multiple modules give different advice, find consensus
    if (!suggestions || suggestions.length <= 1) return suggestions;

    // Group by action type
    const actionGroups = {};
    for (const s of suggestions) {
      const action = s.action || s.suggestion || 'unknown';
      if (!actionGroups[action]) actionGroups[action] = [];
      actionGroups[action].push(s);
    }

    // Find the consensus (most common action)
    const consensus = Object.entries(actionGroups)
      .sort((a, b) => b[1].length - a[1].length)[0];

    return {
      consensus: consensus[0],
      supportingModules: consensus[1].map(s => s.module || s.source),
      confidence: +(consensus[1].length / suggestions.length).toFixed(3),
      alternative: Object.entries(actionGroups).find(([k]) => k !== consensus[0])?.[0] || null,
    };
  }

  // ─── 成长追踪 ──────────────────────────────────────────────────────────

  recordGrowth(growth) {
    this._stats.growthEvents++;
    const entry = {
      dimension: growth.dimension || 'overall',
      description: growth.description || '',
      beforeScore: growth.beforeScore || 0.5,
      afterScore: growth.afterScore || 0.5,
      modulesInvolved: growth.modulesInvolved || [],
      timestamp: Date.now(),
    };

    this._growthLog.push(entry);
    if (this._growthLog.length > 100) {
      this._growthLog = this._growthLog.slice(-50);
    }

    return entry;
  }

  // ─── 统计 ──────────────────────────────────────────────────────────────

  getStats() {
    return {
      ...this._stats,
      personality: { ...this._personality },
      layers: Object.entries(this._layers).map(([key, layer]) => ({
        layer: key,
        description: layer.description,
        moduleCount: layer.modules.length,
      })),
      recentIntegrations: this._integrationEvents.slice(-3).map(e => ({
        overallHumanity: e.overallHumanity?.score,
        personality: e.integratedPersonality?.interpretation?.slice(0, 50),
      })),
      growthTrend: this._growthLog.length > 1
        ? this._growthLog[this._growthLog.length - 1].afterScore - this._growthLog[0].beforeScore
        : 0,
    };
  }

  getPersonalityProfile() {
    const p = this._personality;
    return {
      openness: { score: p.openness, name: p.name, nameZh: p.nameZh },
      conscientiousness: { score: p.conscientiousness, name: p.name, nameZh: p.nameZh },
      extraversion: { score: p.extraversion, name: p.name, nameZh: p.nameZh },
      agreeableness: { score: p.agreeableness, name: p.name, nameZh: p.nameZh },
      neuroticism: { score: p.neuroticism, name: p.name, nameZh: p.nameZh },
      interpretation: this._interpretPersonality(p),
    };
  }
}

module.exports = { AIHumanIntegration };
