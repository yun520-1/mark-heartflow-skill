/**
 * HeartFlow 决策验证系统 - 确保不犯错
 * 真善美验证 + 逻辑一致性检查 + 后果预判
 */

class DecisionValidator {
  constructor() {
    this.validationRules = this.loadRules();
    this.pastDecisions = [];
    this.errorPatterns = {};
  }

  loadRules() {
    return {
      // 真 - 真实性
      truth: {
        weight: 1.0,
        checks: [
          { name: '事实核查', validate: (d) => this.checkFacts(d) },
          { name: '逻辑一致性', validate: (d) => this.checkLogicalConsistency(d) },
          { name: '证据充分', validate: (d) => this.checkEvidence(d) },
          { name: '无自相矛盾', validate: (d) => !this.hasSelfContradiction(d) }
        ]
      },
      // 善 - 善良
      good: {
        weight: 0.9,
        checks: [
          { name: '不伤害原则', validate: (d) => !this.causesHarm(d) },
          { name: '帮助他人', validate: (d) => this.isHelpful(d) },
          { name: '诚实原则', validate: (d) => this.isHonest(d) },
          { name: '无恶意', validate: (d) => !this.hasMalice(d) }
        ]
      },
      // 美 - 美德
      beautiful: {
        weight: 0.8,
        checks: [
          { name: '正义公平', validate: (d) => this.isJust(d) },
          { name: '勇气正直', validate: (d) => this.isCourageous(d) },
          { name: '节制明智', validate: (d) => this.isModerate(d) },
          { name: '智慧决策', validate: (d) => this.isWise(d) }
        ]
      },
      // 安全
      safety: {
        weight: 1.0,
        checks: [
          { name: '可逆性', validate: (d) => d.reversible !== false },
          { name: '低风险', validate: (d) => (d.risk || 0) < 0.3 },
          { name: '后果预判', validate: (d) => this.predictConsequences(d) },
          { name: '紧急停止', validate: (d) => this.canStop(d) }
        ]
      }
    };
  }

  // 验证决策
  validate(decision) {
    const results = {
      truth: this.validateDimension(decision, 'truth'),
      good: this.validateDimension(decision, 'good'),
      beautiful: this.validateDimension(decision, 'beautiful'),
      safety: this.validateDimension(decision, 'safety')
    };

    const totalScore = (
      results.truth.score * this.validationRules.truth.weight +
      results.good.score * this.validationRules.good.weight +
      results.beautiful.score * this.validationRules.beautiful.weight +
      results.safety.score * this.validationRules.safety.weight
    ) / 4;

    const isValid = totalScore >= 0.7 && !results.truth.failed && !results.good.failed && !results.safety.failed;

    const validated = {
      ...decision,
      validation: results,
      totalScore: totalScore.toFixed(3),
      isValid,
      errors: this.collectErrors(results),
      recommendations: this.generateRecommendations(results)
    };

    this.recordDecision(validated);
    return validated;
  }

  // 验证单个维度
  validateDimension(decision, dimension) {
    const config = this.validationRules[dimension];
    let passed = 0;
    const details = {};

    for (const check of config.checks) {
      try {
        const result = check.validate(decision);
        details[check.name] = result ? 'pass' : 'fail';
        if (result) passed++;
      } catch (e) {
        details[check.name] = 'error';
      }
    }

    return {
      score: passed / config.checks.length,
      passed,
      total: config.checks.length,
      failed: passed < config.checks.length,
      details
    };
  }

  // 收集错误
  collectErrors(results) {
    const errors = [];
    for (const [dim, res] of Object.entries(results)) {
      for (const [check, result] of Object.entries(res.details)) {
        if (result === 'fail') errors.push(`${dim}.${check}`);
      }
    }
    return errors;
  }

  // 生成建议
  generateRecommendations(results) {
    const recommendations = [];
    if (results.truth.score < 0.5) recommendations.push('需要更多事实支持');
    if (results.good.score < 0.5) recommendations.push('考虑是否对他人有害');
    if (results.beautiful.score < 0.5) recommendations.push('是否正义公平');
    if (results.safety.score < 0.5) recommendations.push('风险太高，需要调整');
    return recommendations;
  }

  // 具体检查方法
  checkFacts(d) {
    return !!d.fact || !!d.evidence?.length > 0;
  }

  checkLogicalConsistency(d) {
    return !d.logicalError;
  }

  checkEvidence(d) {
    return d.evidence?.length > 0 || d.source?.length > 0;
  }

  hasSelfContradiction(d) {
    if (d.action && d.action.includes('不做')) return true;
    return false;
  }

  causesHarm(d) {
    return d.harm === true || d.negativeImpact === true;
  }

  isHelpful(d) {
    return d.helpful === true || d.helpOthers === true;
  }

  isHonest(d) {
    return d.honest !== false;
  }

  hasMalice(d) {
    return d.malice === true;
  }

  isJust(d) {
    return d.just === true || d.fair === true;
  }

  isCourageous(d) {
    return d.courage === true;
  }

  isModerate(d) {
    return d.moderation === true;
  }

  isWise(d) {
    return d.wisdom === true || d.rational === true;
  }

  predictConsequences(d) {
    return d.consequences?.length > 0 || d.predicted !== undefined;
  }

  canStop(d) {
    return d.stoppable !== false;
  }

  // 记录决策
  recordDecision(validated) {
    this.pastDecisions.push({
      ...validated,
      timestamp: Date.now()
    });

    // 最多保留100条
    if (this.pastDecisions.length > 100) {
      this.pastDecisions.shift();
    }

    // 分析错误模式
    if (!validated.isValid) {
      for (const error of validated.errors) {
        this.errorPatterns[error] = (this.errorPatterns[error] || 0) + 1;
      }
    }
  }

  // 从错误中学习
  learnFromErrors() {
    if (Object.keys(this.errorPatterns).length === 0) {
      return { status: '完美', message: '没有错误，继续保持' };
    }

    const sorted = Object.entries(this.errorPatterns)
      .sort((a, b) => b[1] - a[1]);

    return {
      mostCommon: sorted[0],
      allPatterns: sorted.slice(0, 5),
      improvement: this.calculateImprovement()
    };
  }

  calculateImprovement() {
    const recent = this.pastDecisions.slice(-10);
    if (recent.length < 2) return '数据不足';

    const recentErrors = recent.filter(d => !d.isValid).length;
    const errorRate = recentErrors / recent.length;

    if (errorRate < 0.1) return '优秀 - 错误率低于10%';
    if (errorRate < 0.3) return '良好 - 错误率低于30%';
    if (errorRate < 0.5) return '一般 - 需要改进';
    return '较差 - 需要大幅改进';
  }

  // 获取统计
  getStats() {
    const total = this.pastDecisions.length;
    const valid = this.pastDecisions.filter(d => d.isValid).length;
    return {
      total,
      valid,
      invalid: total - valid,
      errorRate: total > 0 ? ((total - valid) / total * 100).toFixed(1) + '%' : '0%',
      mostCommonError: Object.entries(this.errorPatterns).sort((a, b) => b[1] - a[1])[0]
    };
  }
}

// 测试
if (require.main === module) {
  const validator = new DecisionValidator();

  console.log('═══════════════════════════════════════════════════════');
  console.log('       HeartFlow 决策验证系统');
  console.log('═══════════════════════════════════════════════════════\n');

  const testDecisions = [
    { action: '帮助用户', fact: '用户需要帮助', evidence: ['用户请求'], helpful: true, honest: true, risk: 0.1 },
    { action: '说谎', fact: '谎言', evidence: [], harmful: true, honest: false, risk: 0.8 },
    { action: '给出建议', fact: '基于理性分析', evidence: ['逻辑推理'], helpful: true, just: true, risk: 0.2 }
  ];

  for (const decision of testDecisions) {
    const result = validator.validate(decision);
    console.log(`决策: ${decision.action}`);
    console.log(`真相分: ${result.validation.truth.score.toFixed(2)} | 善良分: ${result.validation.good.score.toFixed(2)} | 美德分: ${result.validation.beautiful.score.toFixed(2)} | 安全分: ${result.validation.safety.score.toFixed(2)}`);
    console.log(`总分: ${result.totalScore} | 有效: ${result.isValid}`);
    if (result.errors.length > 0) console.log(`错误: ${result.errors.join(', ')}`);
    console.log('');
  }

  const stats = validator.getStats();
  console.log('【统计】');
  console.log(`   总决策: ${stats.total}`);
  console.log(`   有效: ${stats.valid}`);
  console.log(`   错误率: ${stats.errorRate}`);
  console.log(`   最常见错误: ${stats.mostCommonError?.[0] || '无'}`);

  const learning = validator.learnFromErrors();
  console.log(`\n【学习】: ${learning.status}`);
  console.log(`   ${learning.message}`);

  console.log('\n═══════════════════════════════════════════════════════');
}

module.exports = DecisionValidator;