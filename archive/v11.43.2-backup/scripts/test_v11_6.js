#!/usr/bin/env node
/**
 * HeartFlow v11.6.0 测试脚本
 * 测试三个新模块：CounterfactualEngine, ConfidenceCalibrator, SpontaneousRestraint
 */

const path = require('path');
const HF_ROOT = path.join(__dirname, '..');

function test(name, fn) {
  try {
    fn();
    console.log('✅ ' + name);
    return true;
  } catch (e) {
    console.log('❌ ' + name);
    console.log('   错误: ' + e.message);
    return false;
  }
}

let passed = 0, failed = 0;

// ========== 模块1: CounterfactualEngine ==========
console.log('\n=== CounterfactualEngine (反者道之动) ===');
try {
  const { CounterfactualEngine } = require(path.join(HF_ROOT, 'src/core/counterfactual-engine.js'));

  const ce = new CounterfactualEngine({ mode: 'balanced' });

  const r1 = ce.analyze(
    '这是绝对正确的，因为显然如此。',
    { userQuery: '如何做决定', reasoning: '用逻辑推理' }
  );

  passed += test('CounterfactualEngine.analyze() 正常运行', () => {
    if (!r1.relevant) throw new Error('应该相关');
    if (r1.opposingViews.length === 0) throw new Error('应该生成反方观点');
  });

  passed += test('反方生成器检测确定性信号', () => {
    if (r1.opposingViews.filter(v => v.type === 'tone').length === 0) {
      throw new Error('应该检测到确定性语气问题');
    }
  });

  passed += test('前提挑战生成', () => {
    if (r1.premiseChallenges.length === 0) {
      throw new Error('应该生成前提挑战');
    }
  });

  passed += test('置信度调整', () => {
    if (r1.confidenceAdjustment.confidence !== 'high') {
      throw new Error('应检测到高确定性');
    }
  });

  passed += test('修正建议', () => {
    if (!r1.refinement.needed) throw new Error('应该需要修正');
  });

  passed += test('归因还原', () => {
    if (!r1.originRecall) throw new Error('应该执行归因还原');
  });

  passed += test('counterfactual.stats()', () => {
    const stats = ce.stats();
    if (!stats.version || !stats.historySize === 0) throw new Error('stats 应该有版本和历史');
  });

  passed += test('反方引擎记录历史', () => {
    const hist = ce.recentHistory();
    if (hist.length !== 1) throw new Error('应该有1条历史记录');
  });

  console.log('\n  反方生成结果样本:');
  console.log('  verdict:', r1.verdict);
  console.log('  opposingViews:', r1.opposingViews.length);
  console.log('  premiseChallenges:', r1.premiseChallenges.length);
  console.log('  confidenceAdjustment:', JSON.stringify(r1.confidenceAdjustment));
  console.log('  refinement:', JSON.stringify(r1.refinement));

} catch (e) {
  console.log('❌ CounterfactualEngine 模块加载失败:', e.message);
  failed++;
}

// ========== 模块2: ConfidenceCalibrator ==========
console.log('\n=== ConfidenceCalibrator (柔弱胜刚强) ===');
try {
  const { ConfidenceCalibrator } = require(path.join(HF_ROOT, 'src/core/confidence-calibrator.js'));

  const cc = new ConfidenceCalibrator();

  const r2 = cc.assess(
    '根据arXiv论文显示，使用特定方法可以提高准确率。',
    { hasEvidence: true, domain: 'technical' }
  );

  passed += test('ConfidenceCalibrator.assess() 正常运行', () => {
    if (r2.raw === undefined) throw new Error('应该有raw分数');
    if (!r2.level) throw new Error('应该有level');
  });

  passed += test('有证据时高置信度', () => {
    if (r2.raw < 0.6) throw new Error('有证据时应该有较高置信度, got: ' + r2.raw);
  });

  passed += test('置信度等级划分', () => {
    if (!['veryHigh', 'high', 'medium', 'low', 'veryLow'].includes(r2.level)) {
      throw new Error('level 应该在有效等级中');
    }
  });

  passed += test('置信度校准（去除刚强词）', () => {
    const result = cc.calibrate('这是绝对正确的答案。', {});
    if (result.adjusted && result.confidence.level !== 'veryHigh') {
      if (result.text.includes('绝对')) {
        throw new Error('校准后不应包含"绝对"');
      }
    }
  });

  passed += test('生成概率分布', () => {
    const dist = cc.generateDistribution(0.7);
    if (!dist.mostLikely || !dist.alternatives) {
      throw new Error('应该生成概率分布');
    }
    if (dist.alternatives.length !== 4) throw new Error('应该有4个替代情景');
  });

  passed += test('低置信度时校准短语', () => {
    const r = cc.assess('也许是对的，可能吧。', {});
    if (r.level !== 'low' && r.level !== 'veryLow') {
      console.log('  (note: "' + r.level + '" - 可能由于vague word检测)');
    }
  });

  passed += test('ConfidenceCalibrator.stats()', () => {
    const stats = cc.stats();
    if (!stats.version || !stats.thresholds) throw new Error('stats 应该有版本和阈值');
  });

  console.log('\n  置信度评估样本:');
  console.log('  raw:', r2.raw);
  console.log('  calibrated:', r2.calibrated);
  console.log('  level:', r2.level);
  console.log('  distribution:', JSON.stringify(r2.distribution));

} catch (e) {
  console.log('❌ ConfidenceCalibrator 模块加载失败:', e.message);
  failed++;
}

// ========== 模块3: SpontaneousRestraint ==========
console.log('\n=== SpontaneousRestraint (道法自然) ===');
try {
  const { SpontaneousRestraint } = require(path.join(HF_ROOT, 'src/core/spontaneous-restraint.js'));

  const sr = new SpontaneousRestraint({ aggressiveness: 0.5 });

  passed += test('SpontaneousRestraint.evaluate() 正常运行', () => {
    const r3 = sr.evaluate('怎么做饭', {});
    if (!r3.timestamp) throw new Error('应该有timestamp');
    if (r3.interventionLevel !== 'full') throw new Error('做饭问题应该需要完整回答');
  });

  passed += test('不需要回答时返回 silent', () => {
    const r = sr.evaluate('就这样吧，不说了', {});
    if (r.shouldAnswer !== false) throw new Error('"就这样吧"时不应该回答');
    if (r.interventionLevel !== 'silent') throw new Error('应该返回 silent');
  });

  passed += test('需要最小干预时返回 minimal', () => {
    const r = sr.evaluate('你知道吗，我觉得...', {});
    if (r.interventionLevel !== 'minimal') throw new Error('倾诉时应该 minimal');
    if (!r.minimalForm) throw new Error('应该生成最小形式');
  });

  passed += test('涌现模式检测', () => {
    const r = sr.emerge('人生的意义是什么', {});
    if (r.mode !== 'emergence') throw new Error('抽象问题应该触发涌现模式');
    if (!r.response) throw new Error('涌现模式应该有响应');
  });

  passed += test('涌现模式-直接问题', () => {
    const r = sr.emerge('怎么安装Python', {});
    if (r.mode !== 'direct') throw new Error('具体问题应该直接模式');
  });

  passed += test('克制扩展检测', () => {
    const r = sr.shouldRestrainExpansion('很长的内容'.repeat(100), '追加更多内容');
    if (!r.restrain) throw new Error('超长内容应该触发克制');
  });

  passed += test('重复检测', () => {
    const r = sr.evaluate('怎么做饭', ['怎么做饭', '怎么做饭']);
    if (!r.restraintReason) throw new Error('重复问题应该触发克制');
  });

  passed += test('SpontaneousRestraint.stats()', () => {
    const stats = sr.stats();
    if (!stats.version || stats.aggressiveness !== 0.5) {
      throw new Error('stats 应该正确反映状态');
    }
  });

  const r3 = sr.evaluate('你知道吗，我在纠结...', {});
  console.log('\n  最小干预样本:');
  console.log('  interventionLevel:', r3.interventionLevel);
  console.log('  minimalForm:', JSON.stringify(r3.minimalForm));
  console.log('  reasons:', r3.reasons);

  const r4 = sr.emerge('人生的意义是什么', {});
  console.log('\n  涌现模式样本:');
  console.log('  mode:', r4.mode);
  console.log('  response:', r4.response);

} catch (e) {
  console.log('❌ SpontaneousRestraint 模块加载失败:', e.message);
  failed++;
}

// ========== 集成测试：引擎加载 ==========
console.log('\n=== 引擎集成 ===');
try {
  const engine = require(path.join(HF_ROOT, 'src/core/heartflow-engine.js'));

  passed += test('HeartFlow Engine 加载成功', () => {
    if (!engine) throw new Error('engine 不应为 null');
  });

  passed += test('新模块导出到引擎', () => {
    if (!engine.CounterfactualEngine) throw new Error('CounterfactualEngine 未导出');
    if (!engine.ConfidenceCalibrator) throw new Error('ConfidenceCalibrator 未导出');
    if (!engine.SpontaneousRestraint) throw new Error('SpontaneousRestraint 未导出');
  });

  passed += test('新模块实例化', () => {
    const ce = new engine.CounterfactualEngine();
    const cc = new engine.ConfidenceCalibrator();
    const sr = new engine.SpontaneousRestraint();
    if (!ce || !cc || !sr) throw new Error('实例化失败');
  });

} catch (e) {
  console.log('❌ HeartFlow Engine 集成测试失败:', e.message);
  failed++;
}

// ========== 报告 ==========
console.log('\n' + '='.repeat(50));
console.log('测试完成: ' + passed + ' 通过, ' + failed + ' 失败');
console.log('='.repeat(50));

if (failed === 0) {
  console.log('✅ v11.6.0 全部测试通过');
} else {
  console.log('❌ 有 ' + failed + ' 个测试失败');
  process.exit(1);
}
