/**
 * Hope Engine — 希望引擎 v1.0.0
 *
 * 回答：「人怎么在黑暗中看到光？」
 *
 * 基于：
 *   - Snyder 希望理论: 路径思维 (pathway thinking) + 能动思维 (agency thinking)
 *   - Aristotle: 希望是 " waking dream " — 有方向的欲望
 *   - Buddhism: 希望来自放下执取，不是追求更多
 *   - Christianity: 希望是三大美德之一 (信望爱)
 *   - Psychology: Hope as a mechanism for resilience
 *
 * @version 1.0.0
 */

class HopeEngine {
  constructor(options = {}) {
    this._config = {
      primaryModel: options.primaryModel || 'snyder', // 'snyder' | 'buddhist' | 'existential'
      goalOrientation: options.goalOrientation || true,
      communityHope: options.communityHope || true,
    };

    // ─── 希望维度 ──────────────────────────────────────────────────────
    this._hopeDimensions = {
      agency: { name: 'Agency Thinking', nameZh: '能动思维', description: 'The belief that you can initiate and sustain action toward goals.', descriptionZh: '相信自己能启动和维持朝向目标的行动。' },
      pathways: { name: 'Pathway Thinking', nameZh: '路径思维', description: 'The ability to find routes to goals, especially when blocked.', descriptionZh: '找到通往目标的路线的能力，尤其在受阻时。' },
      meaning: { name: 'Meaning-Based Hope', nameZh: '意义希望', description: 'Hope rooted in something larger than oneself.', descriptionZh: '根植于比自我更大的事物中的希望。' },
      connection: { name: 'Relational Hope', nameZh: '关系希望', description: 'Hope sustained through relationships and community.', descriptionZh: '通过关系和社区维持的希望。' },
      temporal: { name: 'Temporal Hope', nameZh: '时间希望', description: 'Hope that things will improve over time.', descriptionZh: '相信事情会随时间变好的希望。' },
    };

    // ─── 目标与路径 ──────────────────────────────────────────────────────
    this._goals = [];
    this._pathways = [];
    this._hopeHistory = [];
    this._hopeBarriers = [];

    // ─── 希望状态 ──────────────────────────────────────────────────────
    this._hopeState = {
      overall: 0.5,
      agency: 0.5,
      pathways: 0.5,
      meaning: 0.5,
      connection: 0.5,
      temporal: 0.5,
      currentGoal: null,
      lastUpdate: Date.now(),
    };

    this._stats = {
      totalHopeAssessments: 0,
      goalsSet: 0,
      goalsAchieved: 0,
      barriersOvercome: 0,
      hopeCrises: 0,
    };
  }

  // ─── 希望评估 ──────────────────────────────────────────────────────────

  assessHope(context = {}) {
    this._stats.totalHopeAssessments++;

    // 评估每个维度
    const dimensions = {};
    for (const [key, dim] of Object.entries(this._hopeDimensions)) {
      dimensions[key] = {
        ...dim,
        score: this._hopeState[key] || 0.5,
        level: this._scoreToLevel(this._hopeState[key] || 0.5),
      };
    }

    // 计算整体希望
    const scores = Object.values(dimensions).map(d => d.score);
    const overall = scores.reduce((a, b) => a + b, 0) / scores.length;
    this._hopeState.overall = +overall.toFixed(3);

    // 检测希望危机
    const crisis = this._detectHopeCrisis(overall, dimensions, context);

    // 生成希望建设建议
    const recommendations = this._generateHopeRecommendations(dimensions, crisis);

    const entry = {
      overall: +overall.toFixed(3),
      dimensions,
      crisis: crisis || null,
      recommendations,
      timestamp: Date.now(),
    };

    this._hopeHistory.push(entry);
    if (this._hopeHistory.length > 100) {
      this._hopeHistory = this._hopeHistory.slice(-50);
    }

    return entry;
  }

  _scoreToLevel(score) {
    if (score >= 0.8) return 'flourishing';
    if (score >= 0.6) return 'hopeful';
    if (score >= 0.4) return 'fragile';
    if (score >= 0.2) return 'struggling';
    return 'hopeless';
  }

  _detectHopeCrisis(overall, dimensions, context) {
    const indicators = [];

    if (overall < 0.2) indicators.push('overall_low');
    if ((dimensions.agency?.score || 0) < 0.2) indicators.push('no_agency');
    if ((dimensions.pathways?.score || 0) < 0.2) indicators.push('no_pathways');
    if ((dimensions.meaning?.score || 0) < 0.2) indicators.push('no_meaning');

    const contextStr = JSON.stringify(context).toLowerCase();
    const crisisWords = ['hopeless', 'no point', 'give up', '绝望', '放弃', '没意义', 'no way out'];
    for (const word of crisisWords) {
      if (contextStr.includes(word)) {
        indicators.push('expressed_hopelessness');
        break;
      }
    }

    if (indicators.length >= 2) {
      this._stats.hopeCrises++;
      return {
        level: indicators.length >= 3 ? 'severe' : 'moderate',
        indicators,
        immediateAction: this._crisisAction(indicators),
      };
    }
    return null;
  }

  _crisisAction(indicators) {
    if (indicators.includes('expressed_hopelessness')) {
      return {
        action: 'crisis_support',
        message: 'Hope crisis detected. Immediate support needed: connection, small achievable goals, meaning exploration.',
        messageZh: '检测到希望危机。需要立即支持：连接、小目标、意义探索。',
        priority: 'critical',
      };
    }
    return {
      action: 'hope_intervention',
      message: 'Low hope detected. Focus on building agency and finding at least one pathway forward.',
      messageZh: '希望低落。聚焦于建立能动性和找到至少一条前进路径。',
      priority: 'high',
    };
  }

  _generateHopeRecommendations(dimensions, crisis) {
    const recommendations = [];

    for (const [key, dim] of Object.entries(dimensions)) {
      if (dim.score < 0.4) {
        recommendations.push({
          dimension: key,
          name: dim.name,
          nameZh: dim.nameZh,
          suggestion: this._dimensionSuggestion(key),
          suggestionZh: this._dimensionSuggestionZh(key),
        });
      }
    }

    if (crisis) {
      recommendations.push({
        type: 'crisis_support',
        ...crisis.immediateAction,
      });
    }

    return recommendations;
  }

  _dimensionSuggestion(dimension) {
    const suggestions = {
      agency: 'Practice small actions. Each small step builds agency. Start with something achievable today.',
      pathways: 'Brainstorm at least 3 alternative paths to your goal. Even impossible-seeming paths can open new thinking.',
      meaning: 'Connect your struggle to something larger. How might this pain serve a greater purpose?',
      connection: 'Reach out to one person. Shared hope is stronger than isolated hope.',
      temporal: 'Remember: this feeling is temporary. Look for evidence of past resilience.',
    };
    return suggestions[dimension] || 'Focus on building this dimension of hope.';
  }

  _dimensionSuggestionZh(dimension) {
    const suggestions = {
      agency: '练习小行动。每一步都在建立能动性。从今天能做到的小事开始。',
      pathways: '至少 brainstorm 3 条通往目标的替代路径。即使看起来不可能的路径也能开启新思路。',
      meaning: '将你的挣扎与更大的事物连接。这份痛苦如何服务于更大的目的？',
      connection: '联系一个人。共享的希望比孤立的希望更强。',
      temporal: '记住：这种感觉是暂时的。寻找过去韧性的证据。',
    };
    return suggestions[dimension] || '专注于建立这个希望维度。';
  }

  // ─── 目标管理 ──────────────────────────────────────────────────────────

  setGoal(goal) {
    const entry = {
      id: `goal_${Date.now()}`,
      description: goal.description || '',
      category: goal.category || 'general',
      priority: goal.priority || 0.5,
      deadline: goal.deadline || null,
      barriers: goal.barriers || [],
      subgoals: goal.subgoals || [],
      status: 'active',
      createdAt: Date.now(),
    };

    this._goals.push(entry);
    this._hopeState.currentGoal = entry.id;
    this._stats.goalsSet++;

    // Generate pathways
    this._generatePathways(entry);

    return entry;
  }

  _generatePathways(goal) {
    const pathways = [
      { id: `path_${Date.now()}_1`, description: `Direct approach to: ${goal.description}`, obstacles: goal.barriers, alternatives: [] },
      { id: `path_${Date.now()}_2`, description: `Alternative route to: ${goal.description}`, obstacles: [], alternatives: ['seek_help', 'break_into_steps'] },
    ];

    this._pathways.push(...pathways);
    return pathways;
  }

  achieveGoal(goalId) {
    const goal = this._goals.find(g => g.id === goalId);
    if (goal) {
      goal.status = 'achieved';
      goal.achievedAt = Date.now();
      this._stats.goalsAchieved++;
      this._hopeState.agency = Math.min(1, this._hopeState.agency + 0.1);
      this._hopeState.overall = this._calculateOverall();
      return goal;
    }
    return null;
  }

  addBarrier(barrier) {
    const entry = {
      ...barrier,
      timestamp: Date.now(),
      overcome: false,
    };
    this._hopeBarriers.push(entry);
    return entry;
  }

  overcomeBarrier(barrierId) {
    const barrier = this._hopeBarriers.find(b => b.id === barrierId);
    if (barrier) {
      barrier.overcome = true;
      barrier.overcomeAt = Date.now();
      this._stats.barriersOvercome++;
      this._hopeState.pathways = Math.min(1, this._hopeState.pathways + 0.1);
      this._hopeState.overall = this._calculateOverall();
      return barrier;
    }
    return null;
  }

  _calculateOverall() {
    const s = this._hopeState;
    return +(
      s.agency * 0.25 +
      s.pathways * 0.20 +
      s.meaning * 0.20 +
      s.connection * 0.15 +
      s.temporal * 0.20
    ).toFixed(3);
  }

  // ─── 希望叙事 ──────────────────────────────────────────────────────────

  recordHopeNarrative(narrative) {
    const entry = {
      situation: narrative.situation || '',
      beforeHope: narrative.beforeHope || 0.5,
      afterHope: narrative.afterHope || 0.5,
      turningPoint: narrative.turningPoint || '',
      lessons: narrative.lessons || '',
      timestamp: Date.now(),
    };

    this._hopeHistory.push(entry);
    return entry;
  }

  // ─── 统计 ──────────────────────────────────────────────────────────────

  getStats() {
    return {
      ...this._stats,
      overallHope: this._hopeState.overall,
      hopeLevel: this._scoreToLevel(this._hopeState.overall),
      dimensions: { ...this._hopeDimensions },
      goalCount: this._goals.length,
      activeGoals: this._goals.filter(g => g.status === 'active').length,
      achievementRate: this._stats.goalsSet > 0 ? +(this._stats.goalsAchieved / this._stats.goalsSet).toFixed(3) : 0,
      barrierCount: this._hopeBarriers.length,
      overcomeBarriers: this._hopeBarriers.filter(b => b.overcome).length,
      recentAssessments: this._hopeHistory.slice(-3).map(h => ({ overall: h.overall, crisis: h.crisis?.level })),
    };
  }
}

module.exports = { HopeEngine };
