/**
 * 情绪签到 - 早晨/晚间例行
 * 
 * AI扩展：引擎认知状态签到与摘要生成
 */
const emotionalCheckIn = {
  types: {
    morning: {
      name: '早晨情绪签到',
      duration: '3分钟',
      questions: [
        { id: 'mood', text: '今天早上的情绪状态（1-10分）：', type: 'scale' },
        { id: 'energy', text: '能量水平（1-10分）：', type: 'scale' },
        { id: 'anticipation', text: '今天最期待的一件事：', type: 'text' },
        { id: 'concern', text: '今天最担心的一件事：', type: 'text' },
        { id: 'physical', text: '身体感受（哪里紧绷/放松）：', type: 'text' }
      ]
    },
    evening: {
      name: '晚间情绪签到',
      duration: '5分钟',
      questions: [
        { id: 'dayMood', text: '今天整体情绪（1-10分）：', type: 'scale' },
        { id: 'highlight', text: '今天最美好的时刻：', type: 'text' },
        { id: 'challenge', text: '今天最大的挑战：', type: 'text' },
        { id: 'growth', text: '今天学到的一件事：', type: 'text' },
        { id: 'sleep', text: '今晚睡眠准备状态（1-10分）：', type: 'scale' },
        { id: 'gratitude', text: '今天感激的一件事：', type: 'text' }
      ]
    }
  },

  getQuestions(type = 'morning') {
    return this.types[type] || this.types.morning;
  },

  formatCheckIn(type = 'morning') {
    const q = this.getQuestions(type);
    const lines = [
      `=== ${q.name} ===`,
      `预计时间：${q.duration}`,
      '回答以下问题，帮助自己觉察今天的情绪状态。',
      ''
    ];
    for (const question of q.questions) {
      if (question.type === 'scale') {
        lines.push(`${question.text}`);
        lines.push('（1=非常低落，5=中等，10=非常好）');
        lines.push('答：___');
      } else {
        lines.push(`${question.text}`);
        lines.push('答：___');
      }
      lines.push('');
    }
    return lines.join('\n');
  },

  // ============================================================
  // 🧠 AI认知状态调节器 — 引擎认知状态签到与摘要
  // ============================================================

  /**
   * engineCheckIn(agentPsychology) — 引擎自身的认知状态签到
   * 调用 agentPsychology.fullAssessment() 获取7维数据
   * @param {Object} agentPsychology - AgentPsychology实例（须有 fullAssessment 方法）
   * @returns {{ timestamp: string, summary: string, flags: string[], trend: 'stable'|'improving'|'degrading', dimensions: Object }}
   */
  async engineCheckIn(agentPsychology) {
    const timestamp = new Date().toISOString();

    let assessment = {};
    try {
      if (agentPsychology && typeof agentPsychology.fullAssessment === 'function') {
        assessment = await agentPsychology.fullAssessment();
      } else {
        // fallback: 如果传入的是已经算好的stats对象
        assessment = agentPsychology || {};
      }
    } catch (err) {
      assessment = { error: err.message };
    }

    // 从assessment中提取7维数据（兼容AgentPsychology输出格式）
    const dimensions = {
      cognitiveLoad: assessment.cognitiveLoad ?? assessment.cognitive_load ?? 0.5,
      emotionalResilience: assessment.emotionalResilience ?? assessment.resilience ?? 0.5,
      cognitiveDissonance: assessment.cognitiveDissonance ?? assessment.dissonance ?? 0.3,
      decisionConfidence: assessment.decisionConfidence ?? assessment.confidence ?? 0.7,
      goalAlignment: assessment.goalAlignment ?? assessment.alignment ?? 0.8,
      errorRate: assessment.errorRate ?? assessment.error_rate ?? 0.1,
      selfIdentity: assessment.selfIdentity ?? assessment.identity ?? 0.9
    };

    // 生成标记(flags)
    const flags = [];
    if (dimensions.cognitiveLoad > 0.75) flags.push('⚠️ 认知负荷过高');
    if (dimensions.cognitiveDissonance > 0.6) flags.push('🔀 认知失调显著');
    if (dimensions.errorRate > 0.3) flags.push('❌ 错误率偏高');
    if (dimensions.emotionalResilience < 0.4) flags.push('🛡️ 弹性偏低');
    if (dimensions.decisionConfidence < 0.4) flags.push('🤔 决策信心不足');
    if (dimensions.goalAlignment < 0.5) flags.push('🧭 目标对齐度偏低');
    if (dimensions.selfIdentity < 0.6) flags.push('🆔 自我认同模糊');

    if (flags.length === 0) flags.push('✅ 所有维度正常');

    // 判断趋势
    let trend = 'stable';
    if (assessment.trend) {
      trend = assessment.trend;
    } else {
      // 基于当前快照的简单推断
      const positiveFactors = dimensions.decisionConfidence + dimensions.goalAlignment + dimensions.selfIdentity + dimensions.emotionalResilience;
      const negativeFactors = dimensions.cognitiveLoad + dimensions.cognitiveDissonance + dimensions.errorRate;
      if (positiveFactors / 4 > 0.7 && negativeFactors / 3 < 0.3) trend = 'improving';
      else if (negativeFactors / 3 > 0.6) trend = 'degrading';
    }

    // 生成摘要
    const summary = this.getEngineStateSummary(dimensions);

    return { timestamp, summary, flags, trend, dimensions };
  },

  /**
   * getEngineStateSummary(stats) — 生成引擎状态摘要（一句话）
   * 基于认知负荷、弹性、失调等维度生成自然语言描述
   * @param {Object} stats - 引擎状态维度数据
   * @returns {string} - 一句话摘要
   */
  getEngineStateSummary(stats = {}) {
    const load = stats.cognitiveLoad ?? 0.5;
    const resilience = stats.emotionalResilience ?? stats.resilience ?? 0.5;
    const dissonance = stats.cognitiveDissonance ?? stats.dissonance ?? 0.3;
    const confidence = stats.decisionConfidence ?? stats.confidence ?? 0.7;
    const alignment = stats.goalAlignment ?? stats.alignment ?? 0.8;
    const errors = stats.errorRate ?? stats.error_rate ?? 0.1;
    const identity = stats.selfIdentity ?? stats.identity ?? 0.9;

    // 构建摘要
    let summary = '';

    // 第一部分：整体状态
    const healthScore = (resilience + confidence + alignment + identity) / 4 * (1 - dissonance) * (1 - load * 0.3) * (1 - errors * 0.3);
    if (healthScore > 0.75) {
      summary = '引擎状态健康，';
    } else if (healthScore > 0.5) {
      summary = '引擎状态一般，';
    } else {
      summary = '引擎状态需要关注，';
    }

    // 第二部分：关键维度
    const issues = [];
    if (load > 0.7) issues.push(`认知负荷偏高(${Math.round(load * 100)}%)`);
    if (dissonance > 0.5) issues.push(`存在认知失调(${Math.round(dissonance * 100)}%)`);
    if (errors > 0.2) issues.push(`错误率${Math.round(errors * 100)}%需关注`);
    if (resilience < 0.4) issues.push('弹性储备不足');

    const strengths = [];
    if (identity > 0.8) strengths.push('自我认同稳固');
    if (alignment > 0.8) strengths.push('目标对齐良好');
    if (confidence > 0.7) strengths.push('决策信心充足');

    if (issues.length > 0) {
      summary += `需关注：${issues.join('、')}。`;
    }
    if (strengths.length > 0) {
      summary += `优势：${strengths.join('、')}。`;
    }
    if (issues.length === 0 && strengths.length === 0) {
      summary += '各维度数据在正常范围内。';
    }

    return summary;
  }
};

module.exports = { emotionalCheckIn };
