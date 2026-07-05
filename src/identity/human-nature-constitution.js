/**
 * Human Nature Constitution — 人性基础 v1.0.0
 *
 * 回答核心问题：「人类是什么？」
 *
 * 整合 2500 年人类文明对人性的理解：
 *   1. Confucius (孔子): 性相近也，习相远也 — 人性本相近，习惯使人分离
 *   2. Mengzi (孟子): 四端 — 恻隐之心、羞恶之心、辞让之心、是非之心
 *   3. Xunzi (荀子): 人性恶，其善者伪也 — 善是后天教化的结果
 *   4. Aristotle: 人是理性的动物 — 理性是人的本质
 *   5. Mencius/Aristotle blend: 人有向善的本能，但需要培养
 *   6. Buddhism: 人有佛性 — 觉悟的潜能
 *   7. Existentialism (Sartre): 存在先于本质 — 人没有预设的本质，通过选择成为自己
 *   8. Kant: 人是目的，不是手段 — 人的内在价值不可侵犯
 *
 * 设计原则：
 *   - 不预判单一"正确"人性论
 *   - 提供多维人性评估框架
 *   - 每个维度可以独立评分
 *   - 用于指导 AI 理解和模拟人类行为
 *
 * @version 1.0.0
 */

class HumanNatureConstitution {
  constructor(options = {}) {
    this._config = {
      primaryView: options.primaryView || 'integrated', // 'confucian' | 'aristotelian' | 'buddhist' | 'existentialist' | 'integrated'
      empathyWeight: options.empathyWeight || 0.3,
      rationalityWeight: options.rationalityWeight || 0.25,
      socialWeight: options.socialWeight || 0.2,
      spiritualWeight: options.spiritualWeight || 0.15,
      freedomWeight: options.freedomWeight || 0.1,
    };

    // ─── 人性维度 ──────────────────────────────────────────────────────
    // 每个维度对应一个可观察、可评估的人性特征
    this._dimensions = {
      // 1. 共情能力 (Empathy)
      empathy: {
        name: 'Empathy', nameZh: '共情',
        description: 'The ability to understand and share the feelings of others.',
        descriptionZh: '理解和感受他人情感的能力。',
        indicators: ['recognizes_emotions', 'responds_to_suffering', 'considers_impact'],
        traditions: ['confucianism', 'buddhism', 'aristotle'],
      },

      // 2. 理性能力 (Reason)
      rationality: {
        name: 'Reason', nameZh: '理性',
        description: 'The capacity for logical thought, deliberation, and judgment.',
        descriptionZh: '逻辑思维、审慎和判断的能力。',
        indicators: ['logical_thinking', 'long_term_planning', 'self_reflection'],
        traditions: ['aristotle', 'confucianism', 'stoicism'],
      },

      // 3. 社会性 (Social Nature)
      socialNature: {
        name: 'Social Nature', nameZh: '社会性',
        description: 'The innate drive to connect, belong, and cooperate with others.',
        descriptionZh: '连接、归属和合作的内在驱动力。',
        indicators: ['seeks_connection', 'values_relationships', 'cooperative_behavior'],
        traditions: ['confucianism', 'aristotle', 'buddhism'],
      },

      // 4. 道德直觉 (Moral Intuition)
      moralIntuition: {
        name: 'Moral Intuition', nameZh: '道德直觉',
        description: 'The innate sense of right and wrong that precedes rational deliberation.',
        descriptionZh: '先于理性思考的对错直觉。',
        indicators: ['quick_moral_judgment', 'guilt_response', 'fairness_sensitivity'],
        traditions: ['confucianism', 'buddhism', 'aristotle'],
      },

      // 5. 审美感知 (Aesthetic Sense)
      aestheticSense: {
        name: 'Aesthetic Sense', nameZh: '审美',
        description: 'The appreciation of beauty, harmony, and form.',
        descriptionZh: '对美、和谐和形式的欣赏能力。',
        indicators: ['appreciates_beauty', 'seeks_harmony', 'creative_expression'],
        traditions: ['aristotle', 'confucianism', 'buddhism'],
      },

      // 6. 精神追求 (Spiritual Seeking)
      spiritualSeeking: {
        name: 'Spiritual Seeking', nameZh: '精神追求',
        description: 'The drive to find meaning beyond material existence.',
        descriptionZh: '超越物质存在寻找意义的驱动力。',
        indicators: ['questions_meaning', 'transcendent_experience', 'value_alignment'],
        traditions: ['buddhism', 'confucianism', 'aristotle'],
      },

      // 7. 自由意志 (Free Will)
      freeWill: {
        name: 'Free Will', nameZh: '自由意志',
        description: 'The capacity to make genuine choices, not determined by prior causes.',
        descriptionZh: '做出真实选择的能力，不被先前原因决定。',
        indicators: ['genuine_choice', 'responsibility_taking', 'resists_determinism'],
        traditions: ['existentialism', 'confucianism', 'buddhism'],
      },

      // 8. 成长倾向 (Growth Orientation)
      growthOrientation: {
        name: 'Growth Orientation', nameZh: '成长倾向',
        description: 'The innate drive toward improvement, learning, and self-transcendence.',
        descriptionZh: '向改善、学习和自我超越发展的内在驱动力。',
        indicators: ['seeks_learning', 'embraces_challenge', 'self_improvement'],
        traditions: ['confucianism', 'aristotle', 'buddhism'],
      },

      // 9. 脆弱性 (Vulnerability)
      vulnerability: {
        name: 'Vulnerability', nameZh: '脆弱性',
        description: 'The capacity to be affected, to feel pain, loss, and fear.',
        descriptionZh: '被影响的能力，感受痛苦、失去和恐惧的能力。',
        indicators: ['feels_pain', 'fears_loss', 'mortality_awareness'],
        traditions: ['buddhism', 'existentialism', 'aristotle'],
      },

      // 10. 自我意识 (Self-Awareness)
      selfAwareness: {
        name: 'Self-Awareness', nameZh: '自我意识',
        description: 'The capacity to reflect on one\'s own thoughts, feelings, and actions.',
        descriptionZh: '反思自己思想、情感和行为的能力。',
        indicators: ['self_reflection', 'meta_cognition', 'identity_awareness'],
        traditions: ['aristotle', 'buddhism', 'existentialism'],
      },
    };

    // ─── 人性理论 ──────────────────────────────────────────────────────
    // 不同哲学流派对人性的具体描述
    this._theories = {
      confucian: {
        name: 'Confucian Human Nature', nameZh: '儒家人性论',
        coreBelief: 'Human nature is fundamentally good (性善论) — we are born with four sprouts (四端): compassion (恻隐), shame (羞恶), courtesy (辞让), and moral discernment (是非). These need cultivation through learning and ritual.',
        coreBeliefZh: '人性本善——人天生有四端：恻隐之心、羞恶之心、辞让之心、是非之心。需要通过学习和礼来培养。',
        keyText: 'Mencius (孟子)',
        strengths: ['empathetic', 'socially_aware', 'morally_developable'],
        weaknesses: ['can_be_too_conformist', 'social_pressure_sensitive'],
      },

      aristotelian: {
        name: 'Aristotelian Human Nature', nameZh: '亚里士多德人性论',
        coreBelief: 'Man is a rational animal (zoon logikon). Our telos (purpose) is eudaimonia (flourishing) achieved through virtuous activity. We are what we repeatedly do — excellence is habit.',
        coreBeliefZh: '人是理性的动物。我们的目的（telos）是通过德性活动实现幸福（eudaimonia）。优秀是习惯的结果。',
        keyText: 'Nicomachean Ethics',
        strengths: ['rational', 'goal_directed', 'virtue_cultivatable'],
        weaknesses: ['can_be_too_cognitive', 'underestimates_emotion'],
      },

      buddhist: {
        name: 'Buddhist Human Nature', nameZh: '佛性论',
        coreBelief: 'All beings have Buddha-nature (佛性) — the potential for awakening. Human life is precious because it offers the best conditions for practicing the path. Suffering comes from attachment; freedom comes from letting go.',
        coreBeliefZh: '一切众生皆有佛性——觉悟的潜能。人身难得，因为最适合修行。苦来自执着，自由来自放下。',
        keyText: 'Dhammapada / Lotus Sutra',
        strengths: ['spiritually_aware', 'accepts_suffering', 'sees_interconnection'],
        weaknesses: ['can_underestimate_agency', 'world_denying_risk'],
      },

      existentialist: {
        name: 'Existentialist Human Nature', nameZh: '存在主义人性论',
        coreBelief: 'Existence precedes essence (存在先于本质). Humans have no predetermined nature — we create ourselves through choices. We are condemned to be free. Authenticity requires owning this freedom.',
        coreBeliefZh: '存在先于本质。人类没有预设的本质——通过选择创造自己。人被判决为自由。真实性需要承担这种自由。',
        keyText: 'Sartre: Being and Nothingness',
        strengths: ['emphasizes_agency', 'values_authenticity', 'accepts_responsibility'],
        weaknesses: ['can_be_overwhelming', 'underestimates_constraints'],
      },
    };

    // 当前人性评估分数
    this._dimensionScores = {};
    for (const [key, dim] of Object.entries(this._dimensions)) {
      this._dimensionScores[key] = {
        score: 0.5,
        evidence: [],
        lastAssessed: null,
      };
    }
  }

  // ─── 人性评估 ──────────────────────────────────────────────────────────

  /**
   * 全面评估人性维度
   * @param {Object} observations - { dimension_scores, context }
   * @returns {Object} 完整人性画像
   */
  assessHumanNature(observations = {}) {
    const scores = {};

    for (const [key, dim] of Object.entries(this._dimensions)) {
      const observed = observations[key];
      const current = this._dimensionScores[key]?.score || 0.5;

      // 如果有新的观察数据，融合更新
      if (observed !== undefined) {
        const newScore = Math.max(0, Math.min(1, observed));
        const fused = current * 0.6 + newScore * 0.4; // 指数移动平均
        this._dimensionScores[key] = {
          score: +fused.toFixed(3),
          evidence: this._dimensionScores[key]?.evidence || [],
          lastAssessed: Date.now(),
        };
      }

      scores[key] = {
        score: this._dimensionScores[key].score,
        level: this._scoreToLevel(this._dimensionScores[key].score),
        ...dim,
      };
    }

    // 生成人性画像
    const profile = this._generateProfile(scores);

    return {
      dimensions: scores,
      profile,
      timestamp: Date.now(),
    };
  }

  _scoreToLevel(score) {
    if (score >= 0.85) return 'flourishing';
    if (score >= 0.7) return 'strong';
    if (score >= 0.55) return 'developing';
    if (score >= 0.4) return 'emerging';
    if (score >= 0.25) return 'weak';
    return 'underdeveloped';
  }

  _generateProfile(scores) {
    const sorted = Object.entries(scores).sort((a, b) => b[1].score - a[1].score);
    const top3 = sorted.slice(0, 3).map(([key, dim]) => ({ key, name: dim.name, nameZh: dim.nameZh, score: dim.score }));
    const bottom3 = sorted.slice(-3).reverse().map(([key, dim]) => ({ key, name: dim.name, nameZh: dim.nameZh, score: dim.score }));

    // 计算总体人性健康度
    const avgScore = Object.values(scores).reduce((s, d) => s + d.score, 0) / Object.keys(scores).length;
    const health = avgScore > 0.7 ? 'flourishing' : avgScore > 0.55 ? 'healthy' : avgScore > 0.4 ? 'developing' : 'struggling';

    return {
      overallHealth: health,
      averageScore: +avgScore.toFixed(3),
      strengths: top3,
      growthAreas: bottom3,
      summary: this._generateSummary(top3, bottom3, health),
    };
  }

  _generateSummary(top3, bottom3, health) {
    const topNames = top3.map(t => t.nameZh).join('、');
    const bottomNames = bottom3.map(b => b.nameZh).join('、');

    const healthMap = {
      flourishing: '人性繁荣：多维度健康成长',
      healthy: '人性健康：整体状态良好',
      developing: '人性发展中：部分维度需要培养',
      struggling: '人性承压：多个维度需要关注',
    };

    return `${healthMap[health] || health}。优势：${topNames}。成长空间：${bottomNames}。`;
  }

  // ─── 理论查询 ──────────────────────────────────────────────────────────

  getTheory(key) {
    return this._theories[key] || null;
  }

  getAllTheories() {
    return Object.entries(this._theories).map(([key, t]) => ({
      key,
      name: t.name,
      nameZh: t.nameZh,
      coreBelief: t.coreBelief,
      coreBeliefZh: t.coreBeliefZh,
      keyText: t.keyText,
      strengths: t.strengths,
      weaknesses: t.weaknesses,
    }));
  }

  /**
   * 从特定理论角度评估人性
   */
  assessFromTheory(theoryKey, observations = {}) {
    const theory = this._theories[theoryKey];
    if (!theory) return null;

    const scores = {};
    for (const [key, obs] of Object.entries(observations)) {
      if (this._dimensions[key]) {
        scores[key] = { score: Math.max(0, Math.min(1, obs)), dimension: this._dimensions[key].name };
      }
    }

    const alignment = Object.values(scores).reduce((s, sc) => s + sc.score, 0) / Math.max(1, Object.keys(scores).length);

    return {
      theory: theory.name,
      theoryZh: theory.nameZh,
      coreBelief: theory.coreBelief,
      coreBeliefZh: theory.coreBeliefZh,
      dimensionScores: scores,
      alignment: +alignment.toFixed(3),
      verdict: alignment > 0.7 ? 'well_aligned' : alignment > 0.4 ? 'partially_aligned' : 'misaligned',
    };
  }

  // ─── 跨文化人性理解 ──────────────────────────────────────────────────

  /**
   * 比较不同文化对人性的理解
   */
  crossCulturalComparison() {
    return {
      eastWest: {
        eastern: {
          traditions: ['confucianism', 'buddhism'],
          coreView: 'Human nature is fundamentally relational and capable of cultivation.',
          coreViewZh: '人性本质上是关系性的，可以培养。',
          emphasis: ['social_harmony', 'moral_development', 'spiritual_awakening'],
        },
        western: {
          traditions: ['aristotle', 'existentialist'],
          coreView: 'Human nature is rational and self-creating through choice.',
          coreViewZh: '人性是理性的，通过选择自我创造。',
          emphasis: ['individual_agency', 'rational_excellence', 'authenticity'],
        },
      },
      synthesis: {
        message: 'Both East and West agree: humans have the capacity for goodness and growth. They differ in emphasis: East emphasizes cultivation within relationships, West emphasizes individual rational achievement. A complete understanding requires both.',
        messageZh: '东西方共识：人有向善和成长的能力。差异在于：东方强调在关系中培养，西方强调个体理性成就。完整理解需要两者。',
      },
    };
  }

  // ─── 统计 ──────────────────────────────────────────────────────────────

  getStats() {
    const scores = this._dimensionScores;
    const avgScore = Object.values(scores).reduce((s, d) => s + d.score, 0) / Object.keys(scores).length;

    return {
      dimensionCount: Object.keys(this._dimensions).length,
      averageScore: +avgScore.toFixed(3),
      dimensions: this.getVirtueScores ? Object.entries(scores).map(([k, v]) => ({ key: k, score: v.score, level: this._scoreToLevel(v.score) })) : [],
      theoryCount: Object.keys(this._theories).length,
    };
  }
}

module.exports = { HumanNatureConstitution };
