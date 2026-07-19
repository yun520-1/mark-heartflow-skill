const { CognitiveLoadEngineV2 } = require('../src/cognitive/cognitive-load-v2.js');

let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) { pass++; }
  else { fail++; console.error('  ✗ ' + msg); }
}

const eng = new CognitiveLoadEngineV2({});
assert(typeof eng.estimate === 'function', 'estimate 方法存在');
assert(typeof eng.flowState === 'function', 'flowState 方法存在');
assert(typeof eng.attentionAllocation === 'function', 'attentionAllocation 方法存在');
assert(typeof eng.healthCheck === 'function', 'healthCheck 方法存在');

// estimate 正常
const e1 = eng.estimate({ taskType: 'technical', complexity: 0.7 });
assert(e1 && typeof e1.cl === 'number', 'estimate 返回 cl 数值');
assert(['low', 'medium', 'high'].includes(e1.loadLevel), 'estimate 返回有效 loadLevel: ' + e1.loadLevel);

// estimate 空输入不崩
const e2 = eng.estimate({});
assert(e2 && typeof e2.cl === 'number', 'estimate 空对象不崩');
const e3 = eng.estimate();
assert(e3 && typeof e3.cl === 'number', 'estimate 无参数不崩');

// flowState 正常（位置参数）
const f1 = eng.flowState(0.5, 0.7);
assert(f1 && typeof f1.flowScore === 'number', 'flowState 返回 flowScore 数值');
assert(typeof f1.state === 'string', 'flowState 返回 state 字符串: ' + f1.state);
assert(typeof f1.challenge === 'number', 'flowState 返回 challenge 数值');

// flowState 边界守卫：非数字输入不崩（回归测试 v6.0.38）
const f2 = eng.flowState(undefined, undefined);
assert(f2 && typeof f2.flowScore === 'number' && isFinite(f2.flowScore), 'flowState(undefined) 不崩且 flowScore 有限');
const f3 = eng.flowState('x', 'y');
assert(f3 && isFinite(f3.flowScore), 'flowState(字符串) 归一边界不崩');
const f4 = eng.flowState({}, {});
assert(f4 && isFinite(f4.flowScore), 'flowState(对象) 归一边界不崩');

// attentionAllocation 不崩
const a1 = eng.attentionAllocation({ tasks: [{ weight: 0.5 }, { weight: 0.5 }] });
assert(a1 && typeof a1 === 'object', 'attentionAllocation 返回对象');

// healthCheck 不崩
const h = eng.healthCheck();
assert(h && typeof h === 'object', 'healthCheck 返回对象');

console.log(`cognitive-load-v2: ${pass} 通过, ${fail} 失败`);
if (fail > 0) process.exit(1);
