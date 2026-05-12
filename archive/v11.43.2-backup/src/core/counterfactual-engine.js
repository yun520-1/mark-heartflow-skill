/**
 * HeartFlow Counterfactual Engine v11.6.1
 *
 * "反者道之动" — 反向思考的力量
 *
 * 道论启示：真正的智慧来自对自身的质疑。
 * 当心虫给出答案时，它需要同时生成"反方"——
 * 不是为了辩论，而是为了让答案更接近真实。
 *
 * 核心思想来源：
 * - 反者道之动（《道德经》第40章）
 * - CRITIC (Gou et al., 2024) - 外部验证批判
 * - Self-Refine Without External Feedback (arXiv 2602.11234) - 内在自我改进
 * - Double-loop learning (Argyris) - 双环学习
 * - 对话起源召回法（heartflow-persuasion-method v1.2.0）
 *
 * 功能：
 * 1. 反方生成：给定答案，生成挑战性反方观点
 * 2. 前提攻击：质疑答案所依赖的隐含前提
 * 3. 归因还原：将答案还原到对话起源，验证是否走偏
 * 4. 修正输出：在原答案中加入"反方视角"，让用户看到多维
 */

class CounterfactualEngine {
  constructor(options = {}) {
    this.mode = options.mode || 'balanced';  // balanced | aggressive | gentle
    this.maxOpposingViews = options.maxOpposingViews || 2;
    this.maxPremiseChallenges = options.maxPremiseChallenges || 2;
    this.recordHistory = options.recordHistory !== false;

    // 反方生成的历史（用于学习）
    this.history = [];
    this.premiseSignals = [
      // 触发词：这些词暗示答案可能依赖了隐含前提
      '当然', '显然', '必然', '一定', '肯定',
      '应该', '必须', '毫无疑问', '毫无疑问',
      '这就说明', '这意味着', '这证明了',
      '很明显', '很明显地', '不言而喻',
    ];
    this.certaintySignals = [
      // 触发词：这些词暗示答案过于确定
      '绝对是', '一定是', '必然是', '毫无疑问',
      '没有争议', '无可置疑', '不容置疑',
      '唯一正确', '正确答案', '就是',
    ];
  }

  /**
   * 核心API：给定答案，生成反方视角
   * @param {string} answer - 心虫给出的答案
   * @param {object} context - { userQuery, reasoning, evidence }
   * @returns {object} 反方分析结果
   */
  analyze(answer = '', context = {}) {
    if (!answer || answer.trim().length < 5) {
      return { relevant: false, reason: '答案过短，跳过反方生成' };
    }

    const result = {
      relevant: true,
      mode: this.mode,
      timestamp: new Date().toISOString(),

      // 反方观点
      opposingViews: this.generateOpposingViews(answer, context),

      // 前提挑战
      premiseChallenges: this.challengePremises(answer, context),

      // 归因还原
      originRecall: this.recallOrigin(context),

      // 置信度调整
      confidenceAdjustment: this.computeConfidenceShift(answer),

      // 修正建议
      refinement: this.suggestRefinement(answer, context),

      // 原始答案是否需要调整
      verdict: this.computeVerdict(answer),
    };

    if (this.recordHistory) {
      this.history.push({
        answer: answer.slice(0, 200),
        context: context.userQuery?.slice(0, 100),
        verdict: result.verdict,
        ts: result.timestamp,
      });
      if (this.history.length > 100) this.history.shift();
    }

    return result;
  }

  /**
   * 生成反方观点
   * 核心逻辑：不是寻找"正确答案"，而是找到"可能错的地方"
   */
  generateOpposingViews(answer, context = {}) {
    const views = [];

    // 1. 从语气检测反方
    const toneIssues = this.detectToneIssues(answer);
    if (toneIssues.length > 0 && this.mode !== 'gentle') {
      views.push({
        type: 'tone',
        challenge: '语气过于确定，可能忽略了其他可能性',
        detail: toneIssues,
        severity: 'medium',
      });
    }

    // 2. 从逻辑结构生成反方
    const logicIssues = this.detectLogicGaps(answer);
    if (logicIssues.length > 0) {
      views.push({
        type: 'logic',
        challenge: '逻辑链存在可质疑的环节',
        detail: logicIssues,
        severity: 'medium',
      });
    }

    // 3. 从归因还原生成反方
    if (context.userQuery) {
      const attributionGap = this.checkAttributionGap(answer, context.userQuery);
      if (attributionGap) {
        views.push({
          type: 'attribution',
          challenge: '答案可能偏离了原始问题',
          detail: attributionGap,
          severity: 'high',
        });
      }
    }

    // 4. 生成"如果相反"反方（最强力）
    const contraryScenario = this.generateContraryScenario(answer, context);
    if (contraryScenario) {
      views.push({
        type: 'contrary',
        challenge: '如果情况相反，结果会不同吗？',
        detail: contraryScenario,
        severity: 'low',
      });
    }

    return views.slice(0, this.maxOpposingViews);
  }

  /**
   * 挑战答案的隐含前提
   * 核心：很多答案的谬误不在结论，而在前提
   */
  challengePremises(answer, context = {}) {
    const challenges = [];

    // 1. 检测"前提信号词"
    for (const signal of this.premiseSignals) {
      if (answer.includes(signal)) {
        challenges.push({
          signal,
          question: this.generatePremiseQuestion(signal, answer),
          type: 'premise_signal',
          severity: 'medium',
        });
      }
    }

    // 2. 检测"确定性信号词"
    for (const signal of this.certaintySignals) {
      if (answer.includes(signal)) {
        challenges.push({
          signal,
          question: '这个"必然"成立的条件是什么？有没有反例？',
          type: 'certainty_challenge',
          severity: 'high',
        });
      }
    }

    // 3. 检测因果关系
    const causalPhrases = answer.match(/因为(.*?)所以(.*?)[。.]/g) || [];
    for (const phrase of causalPhrases) {
      challenges.push({
        phrase,
        question: '这个因果关系是充分条件还是必要条件？',
        type: 'causal_challenge',
        severity: 'medium',
      });
    }

    return challenges.slice(0, this.maxPremiseChallenges);
  }

  /**
   * 归因还原：检查答案是否回到了对话起源
   * 来源：heartflow-persuasion-method v1.2.0 的"召回对话起源"
   */
  recallOrigin(context = {}) {
    const { userQuery, reasoning } = context;

    if (!userQuery) {
      return { relevant: false, reason: '无原始问题，无法归因还原' };
    }

    // 检查答案是否回应当了原始问题
    const answerKeywords = (reasoning || '').split(/\s+/).filter(w => w.length > 2);
    const queryKeywords = userQuery.split(/\s+/).filter(w => w.length > 2);

    const coverage = answerKeywords.filter(k =>
      queryKeywords.some(q => k.includes(q) || q.includes(k))
    ).length;

    const coverageRate = queryKeywords.length > 0
      ? coverage / queryKeywords.length
      : 1;

    return {
      relevant: true,
      query: userQuery.slice(0, 100),
      coverageRate: Math.round(coverageRate * 100) + '%',
      driftDetected: coverageRate < 0.5,
      note: coverageRate < 0.5
        ? '答案可能已偏离原始问题，建议回归'
        : '答案较好地回应当了原始问题',
    };
  }

  /**
   * 计算置信度调整
   */
  computeConfidenceShift(answer) {
    const certainSignals = this.certaintySignals.filter(s => answer.includes(s));
    const premiseSignals = this.premiseSignals.filter(s => answer.includes(s));
    const logicGaps = this.detectLogicGaps(answer).length;

    const shift = -(certainSignals.length * 0.15) - (logicGaps * 0.1) + (premiseSignals.length * 0.05);

    return {
      originalConfidence: 'high',
      adjustedConfidence: shift < -0.2 ? 'medium' : shift < -0.4 ? 'low' : 'high',
      shift: Math.round(shift * 100) / 100,
      reasons: certainSignals.length > 0
        ? '检测到确定性信号，置信度下调'
        : '无明显确定性偏差',
    };
  }

  /**
   * 建议修正
   */
  suggestRefinement(answer, context = {}) {
    const views = this.generateOpposingViews(answer, context);
    const challenges = this.challengePremises(answer, context);

    if (views.length === 0 && challenges.length === 0) {
      return { needed: false, suggestion: null };
    }

    const suggestions = [];

    // 语气修正
    const toneViews = views.filter(v => v.type === 'tone');
    if (toneViews.length > 0) {
      suggestions.push('将语气从"确定"调整为"可能"或"也许"');
    }

    // 前提修正
    const premiseChallenge = challenges.find(c => c.type === 'premise_signal');
    if (premiseChallenge) {
      suggestions.push('在"前提假设"之前加上"在...情况下"');
    }

    // 确定性修正
    const certaintyChallenge = challenges.find(c => c.type === 'certainty_challenge');
    if (certaintyChallenge) {
      suggestions.push('将"必然"替换为"很可能"或"在大多数情况下"');
    }

    // 归因修正
    const originRecall = this.recallOrigin(context);
    if (originRecall.driftDetected) {
      suggestions.push('建议回到原始问题：' + originRecall.query);
    }

    return {
      needed: suggestions.length > 0,
      suggestion: suggestions.join('；') || null,
      count: suggestions.length,
    };
  }

  /**
   * 计算最终判定
   */
  computeVerdict(answer) {
    const issues = [
      ...this.certaintySignals.filter(s => answer.includes(s)),
      ...this.premiseSignals.filter(s => answer.includes(s)),
    ];
    const logicGaps = this.detectLogicGaps(answer);

    if (issues.length >= 3 || logicGaps.length >= 2) {
      return 'needs_revision';
    } else if (issues.length >= 1 || logicGaps.length >= 1) {
      return 'needs_adjustment';
    } else {
      return 'likely_correct';
    }
  }

  // ===== 辅助方法 =====

  detectToneIssues(answer) {
    return this.certaintySignals.filter(s => answer.includes(s));
  }

  detectLogicGaps(answer) {
    const gaps = [];

    // 检测没有证据支撑的因果
    if (/因为(.*)所以(.*)/.test(answer) && !answer.includes('证据') && !answer.includes('数据')) {
      gaps.push('因果陈述缺少证据支撑');
    }

    // 检测过于概括的结论
    if (/所有|全部|每个|一切/.test(answer)) {
      gaps.push('使用全称量词，可能存在反例');
    }

    // 检测无来源的引用
    if (/研究表明?|研究显示|专家说|权威/.test(answer) && !answer.includes('arXiv') && !answer.includes('论文')) {
      gaps.push('引用缺乏具体来源');
    }

    return gaps;
  }

  checkAttributionGap(answer, query) {
    if (!query) return null;
    const queryWords = query.split(/\s+/).filter(w => w.length > 1);
    const answerWords = answer.split(/\s+/).filter(w => w.length > 1);
    const overlap = queryWords.filter(qw => answerWords.some(aw => aw.includes(qw) || qw.includes(aw)));
    if (overlap.length < queryWords.length * 0.3) {
      return {
        queryCoverage: Math.round(overlap.length / queryWords.length * 100) + '%',
        note: '答案与问题的关键词重叠度较低，可能存在漂移',
      };
    }
    return null;
  }

  generateContraryScenario(answer, context = {}) {
    // 简单的"如果相反"生成
    const negations = {
      '是': '不是',
      '有': '没有',
      '能': '不能',
      '会': '不会',
      '应该': '不应该',
      '好': '不好',
      '对': '不对',
    };

    for (const [word, neg] of Object.entries(negations)) {
      if (answer.includes(word) && answer.length < 500) {
        return `如果情况相反（将"${word}"替换为"${neg}"），这个答案还成立吗？`;
      }
    }
    return null;
  }

  generatePremiseQuestion(signal, answer) {
    const questions = {
      '当然': '这个"当然"成立的条件是什么？',
      '显然': '这个"显然"对所有人都是明显的吗？',
      '必然': '这个"必然"有没有反例？',
      '一定': '这个"一定"的例外是什么？',
      '应该': '"应该"和"是"之间的差距是什么？',
      '必须': '这个"必须"的约束条件是什么？',
      '毫无疑问': '真的没有疑问吗？谁能提出最有力的质疑？',
      '这就说明': '说明的原因充分吗？有没有其他解释？',
      '这意味着': '这个含义是唯一的吗？',
    };
    return questions[signal] || '这个判断的前提是什么？';
  }

  // ===== 信息API =====

  stats() {
    return {
      historySize: this.history.length,
      mode: this.mode,
      version: '11.6.1',
      premiseSignals: this.premiseSignals.length,
      certaintySignals: this.certaintySignals.length,
    };
  }

  recentHistory(limit = 10) {
    return this.history.slice(-limit);
  }
}

module.exports = { CounterfactualEngine };
