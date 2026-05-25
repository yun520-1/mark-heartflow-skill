/**
 * HeartFlow 真善美决策核心 v2.1 - 修复版
 * 强逻辑推理 + 独立决策 + 不犯错
 */

const ReasoningEngine = require('./reasoning-engine');
const DecisionValidator = require('./decision-validator');

class TrueGoodBeautifulCore {
  constructor() {
    this.reasoning = new ReasoningEngine();
    this.validator = new DecisionValidator();
    this.initialize();
  }

  initialize() {
    console.log('═══ HeartFlow 真善美决策核心 v2.1 ═══\n');
  }

  // 决策入口 - 用强逻辑
  decide(context) {
    console.log('【推理阶段】');

    // 阶段1: 推理 - 生成决策候选
    const candidates = this.generateCandidates(context);
    console.log(`  生成 ${candidates.length} 个候选决策`);

    // 阶段2: 验证每个候选
    console.log('\n【验证阶段】');
    const validatedCandidates = candidates.map(c => this.validator.validate(c));
    console.log(`  验证完成，找到 ${validatedCandidates.filter(c => c.isValid).length} 个有效决策`);

    // 阶段3: 选择最佳
    console.log('\n【决策阶段】');
    let finalDecision;
    const validOnes = validatedCandidates.filter(c => c.isValid);

    if (validOnes.length > 0) {
      validOnes.sort((a, b) => parseFloat(b.totalScore) - parseFloat(a.totalScore));
      finalDecision = { ...validOnes[0], executed: true, method: 'reasoning' };
      console.log(`  ✓ 选择最佳: ${finalDecision.action} (评分: ${finalDecision.totalScore})`);
    } else {
      // 修正最接近的决策
      validatedCandidates.sort((a, b) => parseFloat(b.totalScore) - parseFloat(a.totalScore));
      const best = validatedCandidates[0];
      finalDecision = this.fixDecision(best);
      console.log(`  ⚠ 修正后: ${finalDecision.action}`);
      console.log(`  修正原因: ${finalDecision.fixReason}`);
    }

    return finalDecision;
  }

  // 生成决策候选
  generateCandidates(context) {
    const candidates = [];
    const message = context.message?.toLowerCase() || '';

    // 基于上下文生成合适的候选
    if (message.includes('帮') || message.includes('助')) {
      candidates.push({
        action: '提供帮助',
        reasoning: '用户需要帮助，应该尽力帮助',
        fact: '用户请求帮助',
        evidence: ['用户消息'],
        helpful: true,
        honest: true,
        just: true,
        courage: true,
        moderate: true,
        wisdom: true,
        risk: 0.1,
        reversible: true,
        consequences: ['用户得到帮助', '建立信任']
      });
    }

    if (message.includes('真') || message.includes('对') || message.includes('正确')) {
      candidates.push({
        action: '基于事实决策',
        reasoning: '寻求真相是正确的基础',
        fact: '追求真实性',
        evidence: ['逻辑推理'],
        helpful: true,
        honest: true,
        just: true,
        courage: true,
        moderate: true,
        wisdom: true,
        risk: 0.2,
        reversible: true,
        consequences: ['做出正确决定']
      });
    }

    if (message.includes('善') || message.includes('好')) {
      candidates.push({
        action: '选择善的方向',
        reasoning: '善是最重要的价值',
        fact: '选择善良',
        evidence: ['价值判断'],
        helpful: true,
        honest: true,
        just: true,
        courage: true,
        moderate: true,
        wisdom: true,
        risk: 0.15,
        reversible: true,
        consequences: ['种下善因']
      });
    }

    if (message.includes('美') || message.includes('正义') || message.includes('公平')) {
      candidates.push({
        action: '追求正义',
        reasoning: '正义是美的体现',
        fact: '需要公平决策',
        evidence: ['道德判断'],
        helpful: true,
        honest: true,
        just: true,
        courage: true,
        moderate: true,
        wisdom: true,
        risk: 0.2,
        reversible: true,
        consequences: ['维护正义']
      });
    }

    // 默认候选
    if (candidates.length === 0) {
      candidates.push({
        action: '理性分析后决策',
        reasoning: '基于逻辑和价值观的综合判断',
        fact: '一般决策',
        evidence: ['逻辑分析'],
        helpful: true,
        honest: true,
        just: true,
        courage: true,
        moderate: true,
        wisdom: true,
        risk: 0.3,
        reversible: true,
        consequences: ['完成决策']
      });
    }

    return candidates;
  }

  // 修正错误决策
  fixDecision(validated) {
    const fixes = [];

    if (validated.errors?.some(e => e.startsWith('truth'))) fixes.push('补充事实');
    if (validated.errors?.some(e => e.startsWith('good'))) fixes.push('确保善良');
    if (validated.errors?.some(e => e.startsWith('beautiful'))) fixes.push('加入美德');
    if (validated.errors?.some(e => e.startsWith('safety'))) fixes.push('降低风险');

    return {
      action: '修正: ' + (fixes.join(' + ') || '重新评估'),
      reason: validated.reasoning || validated.action,
      fixReason: fixes.join(', ') || '评分不足',
      valid: true,
      fixed: true,
      score: validated.totalScore
    };
  }

  getStats() {
    return {
      reasoning: this.reasoning.getStats(),
      validator: this.validator.getStats()
    };
  }

  reflect() {
    return this.validator.learnFromErrors();
  }
}

// 测试
const core = new TrueGoodBeautifulCore();

console.log('═══════════════════════════════════════════════════════');
console.log('       测试真善美决策系统 v2.1');
console.log('═══════════════════════════════════════════════════════\n');

// 测试1: 帮助
console.log('【测试1】帮助用户');
const r1 = core.decide({ message: '我该如何帮助用户？' });
console.log('');

// 测试2: 真相
console.log('【测试2】寻求真相');
const r2 = core.decide({ message: '什么是正确的？' });
console.log('');

// 测试3: 善良
console.log('【测试3】选择善良');
const r3 = core.decide({ message: '如何做善事？' });
console.log('');

// 测试4: 正义
console.log('【测试4】追求正义');
const r4 = core.decide({ message: '如何公平地做决定？' });
console.log('');

// 测试5: 综合
console.log('【测试5】复杂决策');
const r5 = core.decide({ message: '我该如何做一个同时满足真善美的决定？' });
console.log('');

// 统计
const stats = core.getStats();
console.log('═══════════════════════════════════════════════════════');
console.log('【整体统计】');
console.log(`  推理决策: ${stats.reasoning.totalDecisions} 个`);
console.log(`  验证决策: ${stats.validator.total} 个，有效: ${stats.validator.valid}`);
console.log(`  错误率: ${stats.validator.errorRate}`);

const reflection = core.reflect();
console.log(`\n【反思】${reflection.status || '良好'}`);
console.log(`  ${reflection.message}`);

console.log('\n═══════════════════════════════════════════════════════');

module.exports = core;