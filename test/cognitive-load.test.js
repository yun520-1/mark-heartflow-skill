const { CognitiveLoadCalculator } = require('../src/cognitive/cognitive-load.js');

let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) { pass++; }
  else { fail++; console.error('  ✗ ' + msg); }
}

// 1. 实例化
const calc = new CognitiveLoadCalculator({});
assert(typeof calc.estimate === 'function', 'estimate 方法存在');
assert(typeof calc.calibrate === 'function', 'calibrate 方法存在');
assert(typeof calc.healthCheck === 'function', 'healthCheck 方法存在');

// 2. estimate 正常输入
const r1 = calc.estimate({ taskType: 'technical', complexity: 0.7 });
assert(r1 && typeof r1.CL === 'number', 'estimate 返回 CL 数值');
assert(['low', 'medium', 'high'].includes(r1.level), 'estimate 返回有效 level: ' + r1.level);
assert(r1.breakdown && typeof r1.breakdown.capacity === 'number', 'estimate 含 breakdown.capacity');

// 3. estimate 空输入不崩（边界守卫）
const r2 = calc.estimate({});
assert(r2 && typeof r2.CL === 'number', 'estimate 空对象不崩');
const r3 = calc.estimate();
assert(r3 && typeof r3.CL === 'number', 'estimate 无参数不崩');

// 4. healthCheck 正常
const h = calc.healthCheck();
assert(h && typeof h.module === 'string', 'healthCheck 返回 module 名');
assert(typeof h.capacity === 'number', 'healthCheck 返回 capacity');

console.log(`cognitive-load: ${pass} 通过, ${fail} 失败`);
if (fail > 0) process.exit(1);
