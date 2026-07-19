const { PathSampler } = require('../src/cortex/path-sampler.js');
let pass = 0, fail = 0;
function assert(c, m) { if (c) pass++; else { fail++; console.error('  ✗ ' + m); } }

const ps = new PathSampler({ n: 5 });
assert(ps.samplePaths('x', 0, () => ({})).error === 'invalid_n', 'n<=0 error');
assert(ps.samplePaths('x', 3, null).error === 'no_generator', 'no generator error');

// 采样多条路径(无预定义特征)
const gen = (prob, i) => ({ id: i, plan: 'path' + i });
const s = ps.samplePaths('decide', 4, gen);
assert(s.count === 4, '采样 4 条路径');

// 结果驱动反选最优(不依赖规则)
const best = ps.selectBest(s.paths, (p) => p.id * 10); // id 越大分越高
assert(best && best.path.id === 3, 'selectBest 选 id 最大(结果驱动)');
assert(best.score === 30, 'score 正确');

// 单条 generator 失败不阻断
const gen2 = (prob, i) => { if (i === 1) throw new Error('x'); return { id: i }; };
const s2 = ps.samplePaths('d', 3, gen2);
assert(s2.count === 2, '单条失败不影响采样');

console.log(`path-sampler: ${pass} 通过, ${fail} 失败`);
if (fail > 0) process.exit(1);
