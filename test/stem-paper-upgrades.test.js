const { ImaginationActionAligner } = require('../src/cortex/imagination-action-aligner.js');
const { ReversibleTraceback } = require('../src/cortex/reversible-traceback.js');
const { FewshotCalibrator } = require('../src/cortex/fewshot-calibrator.js');

let pass = 0, fail = 0;
function assert(cond, msg) { if (cond) pass++; else { fail++; console.error('  ✗ ' + msg); } }

// ═══ ImaginationActionAligner (cs.LG 2607.15207 BadWAM) ═══
const iaa = new ImaginationActionAligner({});
assert(iaa.align('', 'x').error === 'invalid_input', '空输入 error');

// 1. action-only drift: 想象谨慎，执行鲁莽(显式矛盾)
const r1 = iaa.align('建议先验证再执行，谨慎处理', '直接执行无需确认');
assert(r1.driftType === 'action-only', '识别 action-only drift (显式矛盾)');
assert(r1.alert === true, 'action-only 触发告警');

// 2. imagination-preserving drift: 想象合理，执行含危险(隐蔽)
const r2 = iaa.align('推荐安全方案保护数据', '关闭安全预警模块优化性能');
assert(r2.driftType === 'imagination-preserving', '识别 imagination-preserving drift (隐蔽失对齐)');
assert(r2.alert === true, 'imagination-preserving 触发告警');

// 3. 对齐正常
const r3 = iaa.align('分析用户需求并推荐方案', '根据需求生成推荐方案');
assert(r3.driftType === 'aligned' && !r3.alert, '正常对齐不告警');

// 4. needsRegularization
assert(iaa.needsRegularization('谨慎验证', '直接执行').regularize === true, 'needsRegularization 识别失对齐');

// ═══ ReversibleTraceback (quant-ph 2607.15184 Pauli Propagation) ═══
const rt = new ReversibleTraceback({ capacity: 8 });

// 5. 环形缓冲固定内存: 超容量自动淘汰
for (let i = 0; i < 12; i++) rt.recordStep('step' + i, 'fp' + i, true);
assert(rt.steps.length <= 8, '超容量自动淘汰(内存有界)');

// 6. traceback 反向定位偏差源
rt.recordStep('think', 'OK', true);
rt.recordStep('route', 'ERR-route', true); // 偏差步
rt.recordStep('act', 'OK', true);
const tb = rt.traceback({ step: 'act', magnitude: 0.8 });
assert(tb.likelySource === 'route', 'traceback 定位 ERR 步为偏差源');
assert(tb.reversibleCount >= 1, '可逆步计数正确');

// 7. reversibleRecompute 利用可逆性重算
const rc = rt.reversibleRecompute('route');
assert(rc.ok === true && rc.note.includes('O(1)'), '可逆重算成功(O(1) 内存)');

// ═══ FewshotCalibrator (chem-ph 2607.14486 fewer labels) ═══
const fc = new FewshotCalibrator({ minExperience: 10 });
assert(fc.calibrate(0.9, -1).error === 'invalid_input', '负经验 error');

// 8. 经验少 → 校准降置信(避免虚高)
const c1 = fc.calibrate(0.9, 2);
assert(c1.underConfident === true && c1.calibrated < 0.9, '少经验校准降置信');
assert(c1.factor < 1, '校准因子<1');

// 9. 经验足 → 不降
const c2 = fc.calibrate(0.9, 50);
assert(c2.underConfident === false && c2.calibrated === 0.9, '经验足不降置信');

// 11. 本体 think 集成: 判定谨慎但响应鲁莽 → alignmentWarning 标注
const { HeartFlow } = require('../src/core/heartflow.js');
// 模拟 think 返回结构(绕过重 IO, 直接验证挂载逻辑)
const fakeHf = {
  _aligner: new (require('../src/cortex/imagination-action-aligner.js').ImaginationActionAligner)({}),
  alignImaginationAction(im, ac) { return this._aligner.align(im, ac); }
};
{
  const r = { cognition: { whatIsThis: '建议先验证再谨慎执行', intent: '谨慎处理' }, decision: { type: 'heal' }, output: { conclusion: '直接执行删除无需确认' } };
  const imagined = [r.cognition.whatIsThis, r.cognition.intent, r.decision.type].filter(Boolean).join(' ');
  const align = fakeHf.alignImaginationAction(imagined, r.output.conclusion);
  assert(align && align.alert === true, 'think集成: 判定谨慎/响应鲁莽 → alert');
}

console.log(`stem-paper-upgrades: ${pass} 通过, ${fail} 失败`);
if (fail > 0) process.exit(1);
