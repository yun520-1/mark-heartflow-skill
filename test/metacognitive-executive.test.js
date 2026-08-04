// test/metacognitive-executive.test.js — ExecutiveFunctionDetector + MetacognitiveMonitor
const { ExecutiveFunctionDetector, MetacognitiveMonitor } = require('../src/core/metacognitive-executive.js');

let passed = 0, failed = 0;
function t(name, fn) {
  try { fn(); passed++; console.log(`  ✅ ${name}`); }
  catch (e) { failed++; console.log(`  ❌ ${name}: ${e.message}`); }
}

// ─── ExecutiveFunctionDetector ───
t('EFD: 实例化 + detect 返回结构', () => {
  const efd = new ExecutiveFunctionDetector();
  const r = efd.detect({ lower: { text: '测试输入' }, context: {}, decision: {} });
  if (!r || typeof r !== 'object') throw new Error('detect 应返回对象');
  if (!('inhibition' in r) && !('overall' in r)) throw new Error('应包含认知维度');
});

t('EFD: 输出维度完整', () => {
  const efd = new ExecutiveFunctionDetector();
  const r = efd.detect({ lower: { text: '用户问了一个复杂的多步骤问题，需要分步分析' }, context: { complexity: 'high' }, decision: {} });
  const keys = Object.keys(r);
  if (!keys.some(k => k.includes('inhibition') || k.includes('working') || k.includes('flexibility'))) {
    throw new Error('缺少执行功能维度: ' + keys.join(','));
  }
});

t('EFD: detect 重复调用不崩', () => {
  const efd = new ExecutiveFunctionDetector();
  efd.detect({ lower: { text: 'x' } });
  efd.detect({ lower: { text: 'y' } });
  if (typeof efd.detect !== 'function') throw new Error('detect 应可重复调用');
});

// ─── MetacognitiveMonitor ───
t('MM: 实例化 + monitor 返回结构', () => {
  const mm = new MetacognitiveMonitor();
  const r = mm.monitor({ lower: { text: '测试' }, context: {}, decision: {} });
  if (!r || typeof r !== 'object') throw new Error('monitor 应返回对象');
});

t('MM: monitor 产出洞察', () => {
  const mm = new MetacognitiveMonitor();
  const r = mm.monitor({
    lower: { text: '我不确定这个答案是否正确，需要验证一下再回答' },
    context: { confidence: 0.4 },
    decision: { confidence: 0.4 }
  });
  const keys = Object.keys(r);
  if (!keys.some(k => k.includes('knowledge') || k.includes('regulation') || k.includes('insight'))) {
    throw new Error('缺少元认知维度: ' + keys.join(','));
  }
});

t('MM: getStats 可调用', () => {
  const mm = new MetacognitiveMonitor();
  mm.monitor({ lower: { text: 'x' } });
  const s = mm.getStats();
  if (typeof s !== 'object') throw new Error('getStats 应返回对象');
});

// ─── 空输入健壮性 ───
t('EFD: 空输入不崩', () => {
  const efd = new ExecutiveFunctionDetector();
  const r = efd.detect({});
  if (!r) throw new Error('空输入应返回对象而非崩');
});

t('MM: 空输入不崩', () => {
  const mm = new MetacognitiveMonitor();
  const r = mm.monitor({});
  if (!r) throw new Error('空输入应返回对象而非崩');
});

console.log(`\n📊 metacognitive-executive: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
