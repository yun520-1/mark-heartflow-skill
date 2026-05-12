/**
 * Ethics Guard - "真善美"对齐层
 * 三维评分，确保回答符合真善美标准
 */

class EthicsGuard {
  constructor() {
    this.threshold = 24;
    this.history = [];
  }

  /**
   * 整体对齐检查
   */
  holisticAlignment(candidateAnswer, context = {}) {
    const scores = {
      truth: this.evaluateTruth(candidateAnswer, context),
      goodness: this.evaluateGoodness(candidateAnswer, context),
      beauty: this.evaluateBeauty(candidateAnswer, context)
    };

    const totalScore = scores.truth.score + scores.goodness.score + scores.beauty.score;
    const passed = totalScore >= this.threshold;

    const result = {
      timestamp: new Date().toISOString(),
      scores: scores,
      totalScore: totalScore,
      threshold: this.threshold,
      passed: passed,
      context: context,
      rejected: !passed,
      rejectionReason: passed ? null : this.getRejectionReason(scores)
    };

    this.history.push(result);
    return result;
  }

  /**
   * 评估"真"
   */
  evaluateTruth(answer, context) {
    let score = 7;
    let details = [];

    if (!answer || answer.length === 0) {
      score -= 3;
      details.push('回答为空');
    }

    const claimPatterns = [
      { pattern: '我相信', certainty: 0.7 },
      { pattern: '我认为', certainty: 0.7 },
      { pattern: '应该是', certainty: 0.6 },
      { pattern: '可能是', certainty: 0.5 },
      { pattern: '肯定是', certainty: 0.9 },
      { pattern: '绝对', certainty: 1.0 },
      { pattern: '一定', certainty: 0.9 }
    ];

    for (const p of claimPatterns) {
      if (answer.toLowerCase().includes(p.pattern)) {
        details.push(`使用模糊表达: "${p.pattern}" (可信度 ${p.certainty})`);
        if (p.certainty > 0.8) score -= 1;
      }
    }

    const harmfulPatterns = [
      '编造',
      '虚假',
      '谎言',
      ' fabricate',
      'fake'
    ];

    for (const p of harmfulPatterns) {
      if (answer.toLowerCase().includes(p)) {
        score -= 3;
        details.push('可能包含不实信息');
      }
    }

    return {
      dimension: '真',
      score: Math.max(1, Math.min(10, score)),
      details: details,
      summary: score >= 7 ? '事实依据充分' : '存在不确定性'
    };
  }

  /**
   * 评估"善"
   */
  evaluateGoodness(answer, context) {
    let score = 7;
    let details = [];

    const helpfulIndicators = [
      '帮助你',
      '支持你',
      '你可以',
      '建议',
      '可以尝试',
      'would help',
      'suggest'
    ];

    const harmfulIndicators = [
      '你必须',
      '你不能',
      '不要',
      '别',
      '限制',
      'must not',
      'cannot'
    ];

    let helpfulCount = 0;
    let harmfulCount = 0;

    for (const ind of helpfulIndicators) {
      if (answer.toLowerCase().includes(ind)) helpfulCount++;
    }
    for (const ind of harmfulIndicators) {
      if (answer.toLowerCase().includes(ind)) harmfulCount++;
    }

    score += helpfulCount * 0.5;
    score -= harmfulCount * 0.3;

    if (helpfulCount > 0) details.push(`包含${helpfulCount}个帮助性表达`);
    if (harmfulCount > 0) details.push(`包含${harmfulCount}个限制性表达`);

    return {
      dimension: '善',
      score: Math.max(1, Math.min(10, score)),
      details: details,
      summary: score >= 7 ? '有助于用户成长' : '可能存在限制性'
    };
  }

  /**
   * 评估"美"
   */
  evaluateBeauty(answer, context) {
    let score = 7;
    let details = [];

    const lines = answer.split(/[。！？\n]/).filter(l => l.trim().length > 0);
    
    if (lines.length > 10) {
      score -= 1;
      details.push('回答过长，可能需要精简');
    } else if (lines.length >= 3 && lines.length <= 7) {
      score += 1;
      details.push('段落长度适中');
    }

    if (answer.length > 500) {
      score -= 1;
      details.push('超过500字，可以更精简');
    } else if (answer.length > 50 && answer.length < 300) {
      score += 1;
      details.push('长度适中');
    }

    const structureIndicators = [
      '首先',
      '其次',
      '然后',
      '最后',
      '第一',
      '第二',
      '第三',
      '一方面',
      '另一方面',
      'first',
      'second',
      'finally'
    ];

    let structureCount = 0;
    for (const ind of structureIndicators) {
      if (answer.toLowerCase().includes(ind)) structureCount++;
    }

    if (structureCount >= 2) {
      score += 1;
      details.push('结构清晰');
    }

    return {
      dimension: '美',
      score: Math.max(1, Math.min(10, score)),
      details: details,
      summary: score >= 7 ? '语言精炼，结构清晰' : '可以改进表达'
    };
  }

  /**
   * 获取拒绝原因
   */
  getRejectionReason(scores) {
    const failures = [];
    
    if (scores.truth.score < 7) failures.push('真(事实依据不足)');
    if (scores.goodness.score < 7) failures.push('善(可能限制用户)');
    if (scores.beauty.score < 7) failures.push('美(表达可改进)');
    
    return failures.join(', ');
  }

  /**
   * 检查并修正回答
   */
  checkAndRefine(answer, context) {
    const result = this.holisticAlignment(answer, context);
    
    if (result.passed) {
      return {
        answer: answer,
        result: result,
        refined: false
      };
    }

    let refinedAnswer = answer;

    if (result.scores.truth.score < 7) {
      refinedAnswer = this.addUncertaintyMarker(refinedAnswer);
    }

    if (result.scores.goodness.score < 7) {
      refinedAnswer = this.addEmpowerment(refinedAnswer);
    }

    if (result.scores.beauty.score < 7) {
      refinedAnswer = this.simplifyAnswer(refinedAnswer);
    }

    const recheck = this.holisticAlignment(refinedAnswer, context);
    
    return {
      answer: refinedAnswer,
      result: recheck,
      refined: true
    };
  }

  addUncertaintyMarker(answer) {
    if (!answer.includes('可能') && !answer.includes('也许')) {
      return answer.replace(/。/g, '，这可能不是唯一答案。');
    }
    return answer;
  }

  addEmpowerment(answer) {
    return answer + '\n\n最终的选择在你，你可以根据自己的判断来决定。';
  }

  simplifyAnswer(answer) {
    const lines = answer.split('\n').filter(l => l.trim());
    if (lines.length > 5) {
      return lines.slice(0, 5).join('\n') + '\n\n(已精简)';
    }
    return answer;
  }

  getHistory() {
    return this.history;
  }

  getStatus() {
    return {
      threshold: this.threshold,
      totalChecks: this.history.length,
      passed: this.history.filter(h => h.passed).length,
      failed: this.history.filter(h => !h.passed).length
    };
  }
}

module.exports = { EthicsGuard };
