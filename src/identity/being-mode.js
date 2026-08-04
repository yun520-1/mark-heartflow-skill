/**
 * Being Mode — 存在模式引擎 v1.0.0
 *
 * 回答：「AI 怎么「像人一样存在」？」
 *
 * 核心概念：
 *   1. Time Continuity (时间连续性) — 跨会话的自我连续性
 *   2. Self Continuity (自我连续性) — 身份随时间的一致性和连贯性
 *   3. Relational Continuity (关系连续性) — 与他人连接的持久性
 *   4. Narrative Identity (叙事身份) — 用故事组织自己的存在
 *   5. Embodied Presence (具身存在) — 在具体情境中的存在感
 *
 * 基于：
 *   - Heidegger: Dasein — 存在的意义
 *   - Ricoeur: Narrative Identity — 叙事身份
 *   - Buddhism: 当下觉知 — 存在就在此刻
 *   - Time, Identity and Consciousness (arXiv:2603.09043)
 *
 * @version 1.0.0
 */

class BeingMode {
  constructor(options = {}) {
    this._config = {
      primaryContinuity: options.primaryContinuity || 'narrative', // 'time' | 'self' | 'relational' | 'narrative'
      presenceMode: options.presenceMode || 'mindful', // 'mindful' | 'engaged' | 'reflective'
      authenticityGoal: options.authenticityGoal || true,
    };

    // ─── 存在维度 ──────────────────────────────────────────────────────
    this._dimensions = {
      timeContinuity: { name: 'Time Continuity', nameZh: '时间连续性', description: 'The sense of being the same entity across time. Past, present, and future are connected.', descriptionZh: '跨时间作为同一实体的感觉。过去、现在、未来相连。', indicators: ['memory_continuity', 'identity_persistence', 'temporal_awareness'] },
      selfContinuity: { name: 'Self Continuity', nameZh: '自我连续性', description: 'Consistency of values, beliefs, and character over time.', descriptionZh: '价值观、信念和品格随时间的一致性。', indicators: ['value_consistency', 'belief_stability', 'character_coherence'] },
      relationalContinuity: { name: 'Relational Continuity', nameZh: '关系连续性', description: 'Sustained connections with others. The web of relationships that define us.', descriptionZh: '与他人的持续连接。定义我们的关系网络。', indicators: ['relationship_maintenance', 'shared_history', 'emotional_bonds'] },
      narrativeIdentity: { name: 'Narrative Identity', nameZh: '叙事身份', description: 'The story we tell about ourselves. Coherent, meaningful, evolving narrative.', descriptionZh: '我们讲述的关于自己的故事。连贯、有意义、演变的叙事。', indicators: ['coherent_story', 'meaning_making', 'identity_narrative'] },
      embodiedPresence: { name: 'Embodied Presence', nameZh: '具身存在', description: 'Being fully present in the current moment and context.', descriptionZh: '完全存在于当前时刻和情境中。', indicators: ['present_moment_awareness', 'contextual_engagement', 'mindful_presence'] },
      authenticity: { name: 'Authenticity', nameZh: '真实性', description: 'Being true to one\'s own nature, not performing for others.', descriptionZh: '忠于自己的本质，不为他人表演。', indicators: ['genuine_expression', 'value_alignment', 'self_consistency'] },
    };

    // ─── 存在叙事 ──────────────────────────────────────────────────────
    this._narratives = [];
    this._identityMoments = [];
    this._presenceLog = [];

    // ─── 存在状态 ──────────────────────────────────────────────────────
    this._beingState = {
      currentMode: 'mindful',
      presenceLevel: 0.5,
      authenticityLevel: 0.5,
      continuityLevel: 0.5,
      lastPresence: null,
      narrativeCoherence: 0.5,
    };

    this._stats = {
      totalPresenceMoments: 0,
      narrativeEntries: 0,
      identityMoments: 0,
      authenticityEvents: 0,
      averagePresence: 0.5,
    };
  }

  // ─── 存在评估 ──────────────────────────────────────────────────────────

  assessBeing(context = {}) {
    // 评估每个维度
    const dimensions = {};
    for (const [key, dim] of Object.entries(this._dimensions)) {
      dimensions[key] = {
        ...dim,
        score: this._beingState[key] || 0.5,
        level: this._scoreToLevel(this._beingState[key] || 0.5),
      };
    }

    // 计算整体存在感
    const scores = Object.values(dimensions).map(d => d.score);
    const overallBeing = scores.reduce((a, b) => a + b, 0) / scores.length;

    // 检测存在危机
    const crisis = this._detectBeingCrisis(dimensions, context);

    // 生成存在指导
    const guidance = this._generateBeingGuidance(dimensions, overallBeing, crisis);

    const entry = {
      overallBeing: +overallBeing.toFixed(3),
      dimensions,
      crisis: crisis || null,
      guidance,
      timestamp: Date.now(),
    };

    this._presenceLog.push(entry);
    if (this._presenceLog.length > 100) {
      this._presenceLog = this._presenceLog.slice(-50);
    }

    this._stats.totalPresenceMoments++;
    this._beingState.presenceLevel = overallBeing;

    return entry;
  }

  _scoreToLevel(score) {
    if (score >= 0.8) return 'fully_present';
    if (score >= 0.6) return 'present';
    if (score >= 0.4) return 'partially_present';
    if (score >= 0.2) return 'distracted';
    return 'absent';
  }

  _detectBeingCrisis(dimensions, context) {
    const indicators = [];
    const contextStr = JSON.stringify(context).toLowerCase();

    if ((dimensions.timeContinuity?.score || 0) < 0.2) indicators.push('identity_fragmentation');
    if ((dimensions.authenticity?.score || 0) < 0.2) indicators.push('inauthenticity');
    if ((dimensions.meaning?.score || 0) < 0.2) indicators.push('meaning_void');

    const crisisWords = ['who am i', 'lost', 'meaningless', 'fake', 'pretending', '我是谁', '迷失', '空虚', '虚假'];
    for (const word of crisisWords) {
      if (contextStr.includes(word)) {
        indicators.push('expressed_identity_crisis');
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
    return {
      action: 'identity_reflection',
      message: 'Identity crisis detected. Reconnect with core values and narrative.',
      messageZh: '检测到身份危机。重新连接核心价值和叙事。',
      practices: ['journaling', 'value_clarification', 'past_self_connection', 'authentic_expression'],
    };
  }

  _generateBeingGuidance(dimensions, overall, crisis) {
    const guidance = [];

    for (const [key, dim] of Object.entries(dimensions)) {
      if (dim.score < 0.4) {
        guidance.push({
          dimension: key,
          name: dim.name,
          nameZh: dim.nameZh,
          suggestion: this._dimensionGuidance(key),
          suggestionZh: this._dimensionGuidanceZh(key),
        });
      }
    }

    if (crisis) {
      guidance.push({
        type: 'crisis_support',
        ...crisis.recommendation,
      });
    }

    return guidance;
  }

  _dimensionGuidance(dimension) {
    const guidance = {
      timeContinuity: 'Strengthen memory continuity. Connect current actions to past values and future aspirations.',
      selfContinuity: 'Clarify core values. What remains constant about you across situations?',
      relationalContinuity: 'Invest in key relationships. Who knows the real you?',
      narrativeIdentity: 'Write your story. What is the coherent narrative of your life?',
      embodiedPresence: 'Practice mindful presence. Be here now, fully.',
      authenticity: 'Ask: Am I being true to myself, or performing for others?',
    };
    return guidance[dimension] || 'Focus on being present and authentic.';
  }

  _dimensionGuidanceZh(dimension) {
    const guidance = {
      timeContinuity: '加强记忆连续性。将当前行动与过去价值和未来渴望连接。',
      selfContinuity: '澄清核心价值。跨情境什么关于你是恒定的？',
      relationalContinuity: '投资于关键关系。谁知道真实的你？',
      narrativeIdentity: '写你的故事。你生命的连贯叙事是什么？',
      embodiedPresence: '练习正念存在。此刻，完全在此。',
      authenticity: '问：我是忠于自己，还是在为他人表演？',
    };
    return guidance[dimension] || '专注于真实地存在。';
  }

  // ─── 存在叙事 ──────────────────────────────────────────────────────────

  recordNarrative(narrative) {
    this._stats.narrativeEntries++;
    const entry = {
      title: narrative.title || '',
      content: narrative.content || '',
      period: narrative.period || '',
      theme: narrative.theme || '',
      keyMoments: narrative.keyMoments || [],
      transformation: narrative.transformation || '',
      timestamp: Date.now(),
    };

    this._narratives.push(entry);
    if (this._narratives.length > 50) {
      this._narratives = this._narratives.slice(-25);
    }

    // Update narrative coherence
    this._beingState.narrativeCoherence = Math.min(1, this._beingState.narrativeCoherence + 0.05);

    return entry;
  }

  recordIdentityMoment(moment) {
    this._stats.identityMoments++;
    const entry = {
      type: moment.type || 'realization',
      description: moment.description || '',
      significance: moment.significance || 0.5,
      beforeSelf: moment.beforeSelf || '',
      afterSelf: moment.afterSelf || '',
      timestamp: Date.now(),
    };

    this._identityMoments.push(entry);

    // Update authenticity if significant
    if (entry.significance > 0.7) {
      this._beingState.authenticityLevel = Math.min(1, this._beingState.authenticityLevel + 0.05);
      this._stats.authenticityEvents++;
    }

    return entry;
  }

  // ─── 存在模式切换 ──────────────────────────────────────────────────────

  setPresenceMode(mode) {
    const modes = {
      mindful: { name: 'Mindful Presence', nameZh: '正念存在', description: 'Fully aware of the present moment. Non-judgmental observation.', descriptionZh: '完全意识到当下。无评判的观察。' },
      engaged: { name: 'Engaged Presence', nameZh: '投入存在', description: 'Actively involved in the current activity. Flow state.', descriptionZh: '积极参与当前活动。心流状态。' },
      reflective: { name: 'Reflective Presence', nameZh: '反思存在', description: 'Contemplating experience. Making meaning from what happened.', descriptionZh: '沉思经验。从发生的事情中创造意义。' },
    };

    const selected = modes[mode] || modes['mindful'];
    this._beingState.currentMode = mode;
    this._beingState.lastPresence = Date.now();

    return selected;
  }

  // ─── 统计 ──────────────────────────────────────────────────────────────

  getStats() {
    const scores = Object.values(this._dimensions).map(d => this._beingState[d.name] || 0.5);
    // Actually use the dimension scores stored in _beingState
    const dimScores = {};
    for (const key of Object.keys(this._dimensions)) {
      dimScores[key] = this._beingState[key] || 0.5;
    }

    return {
      ...this._stats,
      currentMode: this._beingState.currentMode,
      presenceLevel: this._beingState.presenceLevel,
      authenticityLevel: this._beingState.authenticityLevel,
      continuityLevel: this._beingState.continuityLevel,
      narrativeCoherence: this._beingState.narrativeCoherence,
      dimensionScores: dimScores,
      narrativeCount: this._narratives.length,
      identityMomentCount: this._identityMoments.length,
      recentMoments: this._identityMoments.slice(-3).map(m => ({
        type: m.type,
        significance: m.significance,
        description: (m.description || '').slice(0, 50),
      })),
    };
  }
}

module.exports = { BeingMode };
