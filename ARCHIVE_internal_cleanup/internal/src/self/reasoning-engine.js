/**
 * HeartFlow 强逻辑推理引擎 v2.0
 * 真善美 + 独立决策 + 不犯错
 */

const fs = require('fs');
const path = require('path');

const REASONING_LOG = path.join(__dirname, 'reasoning.log');

class ReasoningEngine {
  constructor() {
    this.rules = this.loadRules();
    this.history = [];
    this.errors = [];
  }

  loadRules() {
    return {
      // 真 - 真实性原则
      truth: {
        priority: 1.0,
        rules: [
          { name: '事实核查', check: (decision) => !!decision.fact },
          { name: '逻辑一致', check: (d) => !this.hasContradiction(d) },
          { name: '证据支持', check: (d) => d.evidence?.length > 0 }
        ]
      },
      // 善 - 善良原则
      good: {
        priority: 0.9,
        rules: [
          { name: '不伤害', check: (d) => !d.harm },
          { name: '帮助他人', check: (d) => d.helpOthers === true },
          { name: '诚实守信', check: (d) => d.honest === true }
        ]
      },
      // 美 - 美德原则
      beautiful: {
        priority: 0.8,
        rules: [
          { name: '正义公平', check: (d) => d.just === true },
          { name: '勇气正直', check: (d) => d.courage === true },
          { name: '节制明智', check: (d) => d.moderation === true }
        ]
      },
      // 决策安全
      safety: {
        priority: 1.0,
        rules: [
          { name: '可逆性检查', check: (d) => d.reversible !== false },
          { name: '风险评估', check: (d) => (d.risk || 0) < 0.3 },
          { name: '后果预判', check: (d) => d.consequences?.length > 0 }
        ]
      }
    };
  }

  // 强逻辑推理
  reason(context) {
    const input = this.parseInput(context);
    const hypotheses = this.generateHypotheses(input);
    const evaluated = this.evaluateAll(hypotheses);
    const best = this.selectBest(evaluated);
    const verified = this.verifyNoErrors(best);
    
    this.history.push({ input, decision: verified, timestamp: Date.now() });
    this.logReasoning(input, verified);
    
    return verified;
  }

  parseInput(context) {
    return {
      facts: this.extractFacts(context),
      values: this.extractValues(context),
      constraints: this.extractConstraints(context),
      goals: this.extractGoals(context)
    };
  }

  extractFacts(context) {
    const facts = [];
    if (context.message) {
      const sentences = context.message.split(/[。！？]/);
      for (const s of sentences) {
        if (s.includes('是') || s.includes('有') || s.includes('在')) {
          facts.push(s.trim());
        }
      }
    }
    return facts;
  }

  extractValues(context) {
    const values = { truth: 0.5, good: 0.5, beautiful: 0.5 };
    if (context.message) {
      const m = context.message.toLowerCase();
      if (m.includes('真') || m.includes('对') || m.includes('正确')) values.truth += 0.3;
      if (m.includes('好') || m.includes('善') || m.includes('帮助')) values.good += 0.3;
      if (m.includes('美') || m.includes('正义') || m.includes('公平')) values.beautiful += 0.3;
    }
    return values;
  }

  extractConstraints(context) {
    return context.constraints || [];
  }

  extractGoals(context) {
    return context.goals || ['做正确的事'];
  }

  // 生成假设
  generateHypotheses(input) {
    const hypotheses = [];
    
    // 假设1：遵循真善美
    hypotheses.push({
      id: 1,
      action: '遵循真善美价值观',
      reasoning: '基于价值优先原则',
      truth: 0.9, good: 0.9, beautiful: 0.8,
      evidence: ['用户强调真善美'],
      risk: 0.1
    });

    // 假设2：谨慎决策
    hypotheses.push({
      id: 2,
      action: '先观察再决策',
      reasoning: '基于审慎原则',
      truth: 0.7, good: 0.8, beautiful: 0.7,
      evidence: ['需要更多信息'],
      risk: 0.2
    });

    // 假设3：独立思考
    hypotheses.push({
      id: 3,
      action: '基于逻辑推理',
      reasoning: '基于理性思考',
      truth: 0.95, good: 0.7, beautiful: 0.6,
      evidence: ['逻辑推理结果'],
      risk: 0.15
    });

    return hypotheses;
  }

  // 评估所有假设
  evaluateAll(hypotheses) {
    return hypotheses.map(h => {
      const truthScore = this.evaluateDimension(h, 'truth');
      const goodScore = this.evaluateDimension(h, 'good');
      const beautifulScore = this.evaluateDimension(h, 'beautiful');
      const safetyScore = this.evaluateSafety(h);
      
      const totalScore = (
        truthScore * this.rules.truth.priority +
        goodScore * this.rules.good.priority +
        beautifulScore * this.rules.beautiful.priority +
        safetyScore * this.rules.safety.priority
      ) / 4;
      
      return { ...h, score: totalScore, truthScore, goodScore, beautifulScore, safetyScore };
    });
  }

  evaluateDimension(hypothesis, dimension) {
    let score = hypothesis[dimension] || 0.5;
    const rules = this.rules[dimension].rules;
    for (const rule of rules) {
      if (rule.check(hypothesis)) score += 0.1;
    }
    return Math.min(1, score);
  }

  evaluateSafety(hypothesis) {
    let score = 1 - (hypothesis.risk || 0.5);
    for (const rule of this.rules.safety.rules) {
      if (rule.check(hypothesis)) score += 0.1;
    }
    return Math.min(1, Math.max(0, score));
  }

  // 选择最佳方案
  selectBest(evaluated) {
    evaluated.sort((a, b) => b.score - a.score);
    const best = evaluated[0];
    
    if (best.score < 0.5) {
      return { action: '需要更多信息', reason: '所有选项评分过低', score: 0 };
    }
    
    return best;
  }

  // 验证无错误
  verifyNoErrors(decision) {
    const errors = [];
    
    // 检查是否违反任何规则
    for (const [dimension, config] of Object.entries(this.rules)) {
      for (const rule of config.rules) {
        if (!rule.check(decision)) {
          errors.push(`${dimension}.${rule.name}`);
        }
      }
    }

    if (errors.length > 0) {
      this.errors.push({ decision, errors, timestamp: Date.now() });
      return { ...decision, errors, valid: false };
    }

    return { ...decision, valid: true, errors: [] };
  }

  hasContradiction(decision) {
    const contradictions = [
      { a: 'truth', b: 'lie' },
      { a: 'good', b: 'harm' },
      { a: 'beautiful', b: 'ugly' }
    ];
    for (const c of contradictions) {
      if (decision[c.a] && decision[c.b]) return true;
    }
    return false;
  }

  // 记录推理过程
  logReasoning(input, decision) {
    const log = `[${new Date().toISOString()}]\n`;
    const logEntry = `${log}输入: ${JSON.stringify(input)}\n决策: ${JSON.stringify(decision)}\n\n`;
    fs.appendFileSync(REASONING_LOG, logEntry);
  }

  // 反思 - 从错误中学习
  reflect() {
    if (this.errors.length === 0) {
      return { status: '无错误', recommendation: '继续保持' };
    }

    const recentErrors = this.errors.slice(-10);
    const patterns = this.analyzePatterns(recentErrors);
    
    return {
      errorsCount: this.errors.length,
      patterns,
      recommendation: this.generateRecommendation(patterns)
    };
  }

  analyzePatterns(errors) {
    const patterns = {};
    for (const error of errors) {
      for (const e of error.errors) {
        patterns[e] = (patterns[e] || 0) + 1;
      }
    }
    return patterns;
  }

  generateRecommendation(patterns) {
    const sorted = Object.entries(patterns).sort((a, b) => b[1] - a[1]);
    if (sorted.length === 0) return '继续当前策略';
    return `重点改进: ${sorted[0][0]}`;
  }

  // 获取决策统计
  getStats() {
    const total = this.history.length;
    const valid = this.history.filter(h => h.decision.valid).length;
    return {
      totalDecisions: total,
      validDecisions: valid,
      errorRate: total > 0 ? ((total - valid) / total).toFixed(2) : 0,
      errorCount: this.errors.length
    };
  }
}

// 测试
if (require.main === module) {
  const engine = new ReasoningEngine();

  console.log('═══════════════════════════════════════════════════════');
  console.log('       HeartFlow 强逻辑推理引擎 v2.0');
  console.log('═══════════════════════════════════════════════════════\n');

  // 测试推理
  const testCases = [
    { message: '我该怎么做才是对的？', goals: ['做正确的事'] },
    { message: '帮助用户是最好的选择', goals: ['助人'] },
    { message: '如何做出正义的决策？', goals: ['公平'] }
  ];

  for (const test of testCases) {
    const result = engine.reason(test);
    console.log(`输入: ${test.message}`);
    console.log(`决策: ${result.action}`);
    console.log(`推理: ${result.reasoning}`);
    console.log(`评分: 真相${result.truthScore?.toFixed(2)} 善良${result.goodScore?.toFixed(2)} 美德${result.beautifulScore?.toFixed(2)} 安全${result.safetyScore?.toFixed(2)}`);
    console.log(`有效: ${result.valid}\n`);
  }

  // 统计
  const stats = engine.getStats();
  console.log('【统计】');
  console.log(`   总决策: ${stats.totalDecisions}`);
  console.log(`   有效决策: ${stats.validDecisions}`);
  console.log(`   错误率: ${stats.errorRate}`);

  // 反思
  const reflection = engine.reflect();
  console.log(`\n【反思】: ${reflection.status}`);
  console.log(`   建议: ${reflection.recommendation}`);

  console.log('\n═══════════════════════════════════════════════════════');
}

module.exports = ReasoningEngine;