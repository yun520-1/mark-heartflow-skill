const DualPerspectiveAuditor = require('../src/core/dual-perspective-auditor.js');

let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) { pass++; }
  else { fail++; console.error('  ✗ ' + msg); }
}

const aud = new DualPerspectiveAuditor({});

// 两个独立视角函数（不同实现）
const deductiveFn = async (p, meta) => ({ conclusion: 'A推导成立', confidence: 0.8, perspective: 'deductive' });
const inductiveFn = async (p, meta) => ({ conclusion: 'B归纳存疑', confidence: 0.6, perspective: 'inductive' });
// 同一函数（塌缩场景）
const sameFn = async (p, meta) => ({ conclusion: 'X', confidence: 0.7 });

const problem = { statement: '某结论是否成立', evidence: {} };

// 1. 正常双视角：不塌缩，无 warning
(async () => {
  const r1 = await aud.debate(problem, deductiveFn, inductiveFn);
  assert(r1 && !r1.error, '正常双视角不报错');
  assert(r1.warning !== 'perspectives_collapsed', '正常双视角无 collapsed warning');
  assert(typeof r1.confidence === 'number', '正常双视角有 confidence');

  // 2. M3 回归：同一引用传入 → 塌缩，降级 + warning + 置信度不夸大
  const r2 = await aud.debate(problem, sameFn, sameFn);
  assert(r2.warning === 'perspectives_collapsed', '同引用传入 → warning=perspectives_collapsed');
  assert(r2.confidence === 0, '塌缩时 confidence 不造假(=0)');
  assert(r2.converged === false, '塌缩时不虚假收敛');
  assert(Array.isArray(r2.disagreements) && r2.disagreements.some(d => d.type === 'perspective_collapsed'),
    '塌缩时记录 perspective_collapsed 分歧');

  // 3. 同源码不同引用 → 不误判为塌缩（合法独立实现恰好相同源码）
  const r3 = await aud.debate(problem, (async (p, m) => ({ conclusion: 'X' })), (async (p, m) => ({ conclusion: 'X' })));
  assert(r3.warning !== 'perspectives_collapsed', '同源码不同引用 → 不误判塌缩');

  // 4. 不同函数但同结论字符串 → 不误判为塌缩（函数不同即视为真双视角）
  const fnA = async (p, m) => ({ conclusion: 'same', confidence: 0.5 });
  const fnB = async (p, m) => ({ conclusion: 'same', confidence: 0.5 });
  const r4 = await aud.debate(problem, fnA, fnB);
  assert(r4.warning !== 'perspectives_collapsed', '函数不同（即使结论相同）不误判塌缩');

  // 5. 缺 statement → 报错
  const r5 = await aud.debate({}, deductiveFn, inductiveFn);
  assert(r5.error, '缺 statement 返回 error');

  // 6. quickAudit（单视角）仍为真审计，不受 M3 影响
  const q = aud.quickAudit({ scope: 'universal' }, {});
  assert(q && typeof q.score === 'number' && Array.isArray(q.issues), 'quickAudit 正常返回');

  console.log(`dual-perspective: ${pass} 通过, ${fail} 失败`);
  if (fail > 0) process.exit(1);
})();
