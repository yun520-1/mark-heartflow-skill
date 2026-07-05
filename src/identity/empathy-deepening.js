/**
 * Empathy Deepening — 深度共情引擎 v1.0.0
 *
 * 回答：「人怎么真正理解另一个人的痛苦？」
 *
 * 三层共情模型：
 *   Layer 1: Affective Empathy (情感共情) — 感受他人的感受
 *   Layer 2: Cognitive Empathy (认知共情) — 理解他人的观点
 *   Layer 3: Compassionate Empathy ( compassionate 共情) — 感受后采取行动
 *
 * 基于：
 *   - Paul Ekman: 情感传染与情绪识别
 *   - Simon Baron-Cohen: 共情商 (EQ) 与共情光谱
 *   - Buddhism: 慈悲 (Karuna) — 对一切众生的深切关怀
 *   - Confucianism: 恕 (Shu) — 己所不欲，勿施于人
 *   - Neuroscience: Mirror Neuron System — 镜像神经元作为共情基础
 *
 * @version 1.0.0
 */

class EmpathyDeepening {
  constructor(options = {}) {
    this._config = {
      primaryMode: options.primaryMode || 'integrated', // 'affective' | 'cognitive' | 'compassionate' | 'integrated'
      empathyMode: options.empathyMode || 'other-oriented', // 'self-oriented' | 'other-oriented' | 'mixed'
      distressTolerance: options.distressTolerance || 0.5,
    };

    // ─── 共情三层 ──────────────────────────────────────────────────────
    this._layers = {
      affective: {
        name: 'Affective Empathy', nameZh: '情感共情',
        description: 'The ability to feel what another person is feeling. Automatic, often unconscious response to others\' emotions.',
        descriptionZh: '感受他人感受的能力。对他人情感的自动、常无意识回应。',
        indicators: ['emotional_contagion', 'mirror_emotions', 'physiological_resonance'],
        strengths: ['immediate_connection', 'emotional_authenticity', 'nonverbal_understanding'],
        risks: ['empathy_overwhelm', 'personal_distress', 'compassion_fatigue'],
      },
      cognitive: {
        name: 'Cognitive Empathy', nameZh: '认知共情',
        description: 'The ability to understand another person\'s perspective, thoughts, and mental states.',
        descriptionZh: '理解他人观点、思想和心理状态的能力。',
        indicators: ['perspective_taking', 'theory_of_mind', 'mental_state_attribution'],
        strengths: ['accurate_understanding', 'effective_communication', 'problem_solving'],
        risks: ['over-intellectualization', 'emotional_distance', 'manipulation_risk'],
      },
      compassionate: {
        name: 'Compassionate Empathy', nameZh: 'compassionate 共情',
        description: 'Feeling for another\'s suffering AND being motivated to help. The "empathy-action gap" is bridged.',
        descriptionZh: '感受他人的痛苦 AND 被驱动去帮助。「共情-行动鸿沟」被架桥。',
        indicators: ['other_focused_concern', 'helping_motivation', 'sustained_care'],
        strengths: ['action_orientation', 'sustained_support', 'collective_good'],
        risks: ['compassion_fatigue', 'self_sacrifice', 'burnout'],
      },
    };

    // ─── 共情记录 ──────────────────────────────────────────────────────
    this._empathyEvents = [];
    this._empathyScores = { affective: 0.5, cognitive: 0.5, compassionate: 0.5 };
    this._empathyTargets = new Map();

    // ─── 共情障碍 ──────────────────────────────────────────────────────
    this._barriers = {
      cognitive_load: { name: 'Cognitive Overload', nameZh: '认知过载', description: 'Too much information to process empathy effectively.', descriptionZh: '信息太多，无法有效处理共情。' },
      emotional_avoidance: { name: 'Emotional Avoidance', nameZh: '情感回避', description: 'Avoiding emotional engagement to protect self.', descriptionZh: '回避情感参与以保护自我。' },
      stereotyping: { name: 'Stereotyping', nameZh: '刻板印象', description: 'Seeing group characteristics instead of individual.', descriptionZh: '看到群体特征而非个体。' },
      in_group_bias: { name: 'In-group Bias', nameZh: '内群体偏见', description: 'Feeling more empathy for those similar to self.', descriptionZh: '对与自己相似的人感受更多共情。' },
      compassion_fatigue: { name: 'Compassion Fatigue', nameZh: 'compassionate 疲劳', description: 'Exhaustion from sustained empathetic engagement.', descriptionZh: '持续共情参与导致的疲惫。' },
    };

    this._stats = {
      totalEmpathyEvents: 0,
      affectiveEvents: 0,
      cognitiveEvents: 0,
      compassionateEvents: 0,
      barriersEncountered: 0,
      compassionFatigueRisk: 0,
    };
  }

  // ─── 共情评估 ──────────────────────────────────────────────────────────

  assessEmpathy(empathyEvent) {
    this._stats.totalEmpathyEvents++;
    const { target, context, emotionalState, cognitiveState, actionTaken } = empathyEvent || {};

    // 评估三层共情
    const affectiveScore = this._assessAffective(emotionalState, context);
    const cognitiveScore = this._assessCognitive(cognitiveState, context);
    const compassionateScore = this._assessCompassionate(actionTaken, context);

    // 更新共情分数
    this._updateEmpathyScores(affectiveScore, cognitiveScore, compassionateScore);

    // 检测共情障碍
    const barriers = this._detectBarriers(affectiveScore, cognitiveScore, compassionateScore, empathyEvent);

    // 计算综合共情商
    const eq = +(
      affectiveScore * 0.35 +
      cognitiveScore * 0.35 +
      compassionateScore * 0.30
    ).toFixed(3);

    const entry = {
      target: target || 'unknown',
      context: context || '',
      layers: { affective: affectiveScore, cognitive: cognitiveScore, compassionate: compassionateScore },
      eq,
      barriers,
      recommendations: this._generateEmpathyRecommendations(affectiveScore, cognitiveScore, compassionateScore, barriers),
      timestamp: Date.now(),
    };

    this._empathyEvents.push(entry);
    if (this._empathyEvents.length > 200) {
      this._empathyEvents = this._empathyEvents.slice(-100);
    }

    // Update target record
    if (target) {
      this._updateTargetRecord(target, eq);
    }

    return entry;
  }

  _assessAffective(emotionalState, context) {
    const state = (emotionalState || '').toLowerCase();
    let score = 0.5;

    // Affective indicators
    if (/feel|sense|resonate|moved|touched|heart|emotional|感受|共鸣|感动|心疼/.test(state)) score += 0.2;
    if (/pain|suffering|hurt|crying|tears|sad|痛苦|难过|哭/.test(state)) score += 0.15;
    if (/joy|happy|warm|grateful|touched|快乐|温暖|感激/.test(state)) score += 0.15;

    // Non-indicators (cognitive without affective)
    if (/understand|analyze|think|reason|logic|理解|分析|思考/.test(state) && !/feel|sense/.test(state)) score -= 0.1;

    return Math.max(0, Math.min(1, score));
  }

  _assessCognitive(cognitiveState, context) {
    const state = (cognitiveState || '').toLowerCase();
    let score = 0.5;

    // Cognitive indicators
    if (/understand|perspective|viewpoint|point of view|their|think|理解|视角|观点|他的/.test(state)) score += 0.2;
    if (/imagine|put myself|walk in|figure out|想象|设身处地/.test(state)) score += 0.15;
    if (/their situation|what they feel|why they|他们的处境|他们的感受/.test(state)) score += 0.15;

    return Math.max(0, Math.min(1, score));
  }

  _assessCompassionate(actionTaken, context) {
    const action = (actionTaken || '').toLowerCase();
    let score = 0.3;

    // Compassionate indicators
    if (/help|support|care|comfort|assist|help|帮助|支持|安慰/.test(action)) score += 0.3;
    if (/act|do something|reach out|take action|行动|伸出援手/.test(action)) score += 0.2;
    if (/follow.?up|check.?in|continue|follow up|followup|跟进|持续/.test(action)) score += 0.2;

    return Math.max(0, Math.min(1, score));
  }

  _updateEmpathyScores(affective, cognitive, compassionate) {
    const alpha = 0.3;
    this._empathyScores.affective = +(this._empathyScores.affective * (1 - alpha) + affective * alpha).toFixed(3);
    this._empathyScores.cognitive = +(this._empathyScores.cognitive * (1 - alpha) + cognitive * alpha).toFixed(3);
    this._empathyScores.compassionate = +(this._empathyScores.compassionate * (1 - alpha) + compassionate * alpha).toFixed(3);

    this._stats.affectiveEvents++;
    this._stats.cognitiveEvents++;
    this._stats.compassionateEvents++;
  }

  _detectBarriers(affective, cognitive, compassionate, event) {
    const barriers = [];
    const context = (event?.context || '').toLowerCase();

    if (/overwhelm|too much|can\'t handle|overwhelmed|太多| overwhelmed/.test(context)) {
      barriers.push({ type: 'cognitive_load', name: '认知过载', suggestion: 'Reduce information load. Focus on one person\'s experience at a time.' });
    }
    if (affective > 0.7 && compassionate < 0.3) {
      barriers.push({ type: 'empathy_action_gap', name: '共情-行动鸿沟', suggestion: 'Feeling is not enough. Take one small action to help.' });
    }
    if (cognitive > 0.7 && affective < 0.3) {
      barriers.push({ type: 'emotional_distance', name: '情感距离', suggestion: 'Understanding without feeling creates distance. Allow yourself to feel.' });
    }
    if (/they always|they never|all people| stereotype|all of them/.test(context)) {
      barriers.push({ type: 'stereotyping', name: '刻板印象', suggestion: 'See the individual, not the group.' });
    }

    if (barriers.length > 0) this._stats.barriersEncountered++;
    return barriers;
  }

  _generateEmpathyRecommendations(affective, cognitive, compassionate, barriers) {
    const recs = [];
    if (affective < 0.3) recs.push({ layer: 'affective', suggestion: 'Practice feeling without fixing. Let emotions arise naturally.', suggestionZh: '练习感受而不修复。让情绪自然涌现。' });
    if (cognitive < 0.3) recs.push({ layer: 'cognitive', suggestion: 'Ask "What might this be like for them?" before responding.', suggestionZh: '回应前问「这可能对他们来说是什么样的？」' });
    if (compassionate < 0.3) recs.push({ layer: 'compassionate', suggestion: 'Bridge the empathy-action gap: do one small thing.', suggestionZh: '架桥共情-行动鸿沟：做一件小事。' });
    for (const barrier of barriers) {
      recs.push({ barrier: barrier.type, suggestion: barrier.suggestion, suggestionZh: barrier.suggestion });
    }
    return recs;
  }

  _updateTargetRecord(target, eq) {
    if (!this._empathyTargets.has(target)) {
      this._empathyTargets.set(target, { interactions: 0, avgEQ: 0.5 });
    }
    const record = this._empathyTargets.get(target);
    record.interactions++;
    record.avgEQ = +(record.avgEQ * 0.8 + eq * 0.2).toFixed(3);
  }

  // ─── 共情训练 ──────────────────────────────────────────────────────────

  practicePerspectiveTaking(scenario) {
    const perspectives = [
      { perspective: 'Their direct experience', description: 'What is this person feeling right now?' },
      { perspective: 'Their hidden concerns', description: 'What might they not be saying?' },
      { perspective: 'Their deeper needs', description: 'What do they truly need?' },
      { perspective: 'Their context', description: 'What shaped their experience?' },
      { perspective: 'Your reaction to them', description: 'How do they experience YOUR response?' },
    ];

    return {
      scenario: scenario || '',
      perspectives,
      exercise: 'Consider each perspective. Write one sentence for each.',
      exerciseZh: '考虑每个视角。为每个视角写一句话。',
    };
  }

  // ─── 统计 ──────────────────────────────────────────────────────────────

  getStats() {
    return {
      ...this._stats,
      compassionFatigueRisk: this._assessCompassionFatigue(),
      empathyScores: { ...this._empathyScores },
      overallEQ: +((this._empathyScores.affective + this._empathyScores.cognitive + this._empathyScores.compassionate) / 3).toFixed(3),
      targetCount: this._empathyTargets.size,
      recentEvents: this._empathyEvents.slice(-3).map(e => ({
        target: e.target,
        eq: e.eq,
        barriers: e.barriers.length,
      })),
    };
  }

  _assessCompassionFatigue() {
    const recentEvents = this._empathyEvents.slice(-10);
    if (recentEvents.length < 5) return 0;

    const avgCompassionate = recentEvents.reduce((s, e) => s + e.layers.compassionate, 0) / recentEvents.length;
    const barrierCount = recentEvents.filter(e => e.barriers.length > 0).length;

    if (avgCompassionate < 0.3 && barrierCount > 5) return 'high';
    if (avgCompassionate < 0.4) return 'moderate';
    return 'low';
  }
}

module.exports = { EmpathyDeepening };
