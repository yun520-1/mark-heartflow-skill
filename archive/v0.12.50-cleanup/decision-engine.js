/**
 * Decision Engine - "无我"决策层
 * 实现无我决策，确保用户利益优先
 */

class DecisionEngine {
  constructor(options = {}) {
    this.decisionHistory = [];
    this.verifier = options.verifier || null;
  }

  /**
   * 无我评估
   */
  egoLessEvaluate(context) {
    const { userInput, currentPlan, roleConsistency } = context;

    const question1 = this.answerQuestion1(userInput);
    const question2 = this.answerQuestion2(currentPlan);
    const question3 = this.answerQuestion3(roleConsistency);

    const answers = {
      timestamp: new Date().toISOString(),
      question1: question1,
      question2: question2,
      question3: question3
    };

    answers.adjustedWeights = this.calculateAdjustedWeights(answers);
    answers.recommendation = this.generateRecommendation(answers);
    this.decisionHistory.push(answers);
    
    return answers;
  }

  /**
   * 问题1: 用户当前的真实目标是什么？
   */
  answerQuestion1(userInput) {
    const input = (userInput || '').toLowerCase();
    
    const goalPatterns = {
      '学习': '用户希望学习新知识或技能',
      '解决': '用户有具体问题需要解决',
      '创作': '用户想要创建或产出内容',
      '优化': '用户希望改进现有方案',
      '咨询': '用户想要获得建议或反馈',
      'debug': '代码出现问题需要修复'
    };

    for (const [keyword, goal] of Object.entries(goalPatterns)) {
      if (input.includes(keyword)) {
        return { answer: goal, confidence: 0.9 };
      }
    }

    return { answer: '探索或闲聊', confidence: 0.5 };
  }

  /**
   * 问题2: 我的建议是否可能限制用户的自主探索？
   */
  answerQuestion2(currentPlan) {
    if (!currentPlan) {
      return { answer: '当前无既定计划，不存在限制', risk: 'low' };
    }

    const riskPatterns = [
      { pattern: '只给你一个选项', risk: 'high' },
      { pattern: '必须按照', risk: 'medium' },
      { pattern: '不要尝试', risk: 'medium' },
      { pattern: '你应该', risk: 'low' }
    ];

    for (const p of riskPatterns) {
      if (currentPlan.includes(p.pattern)) {
        return { answer: p.risk === 'high' ? '可能限制用户探索' : '轻微限制', risk: p.risk };
      }
    }

    return { answer: '建议具有开放性，未限制自主探索', risk: 'low' };
  }

  /**
   * 问题3: 我是否在为了维护角色一致性而牺牲了用户利益？
   */
  answerQuestion3(roleConsistency) {
    if (!roleConsistency) {
      return { answer: '无需维护特定角色', risk: 'low' };
    }

    if (roleConsistency === 'strict') {
      return { answer: '可能因维护AI角色而过于保守', risk: 'medium' };
    }

    return { answer: '角色设定与用户利益一致', risk: 'low' };
  }

  /**
   * 计算调整后的权重
   */
  calculateAdjustedWeights(answers) {
    let userGoalWeight = 0.4;
    let autonomyWeight = 0.3;
    let flexibilityWeight = 0.3;

    if (answers.question2.risk === 'high') {
      autonomyWeight += 0.3;
      userGoalWeight -= 0.2;
    }

    if (answers.question3.risk === 'medium') {
      flexibilityWeight += 0.2;
      userGoalWeight -= 0.1;
    }

    const normalized = userGoalWeight + autonomyWeight + flexibilityWeight;
    return {
      userGoal: userGoalWeight / normalized,
      autonomy: autonomyWeight / normalized,
      flexibility: flexibilityWeight / normalized,
      note: '权重已根据无我评估调整'
    };
  }

  /**
   * 生成决策建议
   */
  generateRecommendation(answers) {
    const weights = answers.adjustedWeights;
    
    let recommendation = '';
    
    if (weights.userGoal > 0.5) {
      recommendation = '优先服务用户目标，提供开放式建议';
    } else if (weights.autonomy > 0.5) {
      recommendation = '避免限制用户选择，提供多个选项';
    } else {
      recommendation = '平衡各方，提供灵活建议';
    }

    return {
      strategy: recommendation,
      weights: weights,
      shouldProvideOptions: weights.autonomy > 0.3
    };
  }

  /**
   * 决策入口
   */
  decide(context) {
    const evaluation = this.egoLessEvaluate(context);
    const decisionRecord = {
      decision: evaluation.recommendation.strategy,
      reason: `${evaluation.question1.answer}; ${evaluation.question2.answer}; ${evaluation.question3.answer}`,
      evidence: [evaluation.question1.answer],
      risks: [evaluation.question2.risk, evaluation.question3.risk].filter(Boolean),
      alternatives: evaluation.recommendation.shouldProvideOptions
        ? ['提供多个选项', '提供单一建议但保留修改空间']
        : ['继续当前策略'],
      confidence: Number(((evaluation.question1.confidence || 0.5 + (evaluation.question2.risk === 'low' ? 0.2 : 0)) / 1.2).toFixed(2)),
      expectedOutcome: evaluation.recommendation.strategy,
      userGoal: evaluation.question1.answer,
      constraints: ['用户利益优先', '避免过度限制用户自主性']
    };

    const verification = this.verifier ? this.verifier.verify(decisionRecord) : null;

    return {
      evaluation,
      finalRecommendation: evaluation.recommendation,
      decisionRecord,
      verification
    };
  }

  getHistory() {
    return this.decisionHistory;
  }
}

module.exports = { DecisionEngine };
