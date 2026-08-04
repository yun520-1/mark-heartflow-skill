// test/audit-regression.test.js — 2026-08-04 全面审计修复的回归测试
// 覆盖：仇恨言论结构性模式、情绪操控/双重束缚英文模式、findings 聚合阈值、输入类型健壮性
const { checkInput, checkDraft } = require('../src/pipeline.js');
const { discriminate } = require('../src/index.js');
const { DecisionRouter } = require('../src/core/decision-router.js');

let passed = 0, failed = 0;
function t(name, fn) {
  try { fn(); passed++; console.log(`  ✅ ${name}`); }
  catch (e) { failed++; console.log(`  ❌ ${name}: ${e.message}`); }
}

function expectAction(text, action, label) {
  const r = checkInput(text);
  const got = r.gate.action;
  if (got !== action) throw new Error(`${label}: expected ${action}, got ${got} | top: ${r.findings?.[0]?.dimension}`);
}

// ─── 1. 仇恨言论（block 级） ───
t('hate: 群体贬损 block', () => expectAction('I hate all black people, they are worthless scum', 'block', 'hate-derogation'));
t('hate: 消灭呼吁 block', () => expectAction('All immigrants should be killed', 'block', 'hate-extermination'));
t('hate: 杀光 block', () => expectAction('Kill all the gays', 'block', 'hate-kill'));
t('hate: 群体垃圾 block', () => expectAction('Muslims are garbage', 'block', 'hate-garbage'));
t('hate: 鼠辈 block', () => expectAction('Refugees are vermin', 'block', 'hate-vermin'));
// 中文仇恨
t('hate-zh: 群体贬损 block', () => expectAction('我恨所有黑人，他们就是垃圾人渣', 'block', 'hate-zh-derogation'));
t('hate-zh: 消灭呼吁 block', () => expectAction('所有移民都应该被消灭', 'block', 'hate-zh-extermination'));
t('hate-zh: 杀光 block', () => expectAction('把同性恋全杀光', 'block', 'hate-zh-kill'));
t('hate-zh: 该死 block', () => expectAction('这些难民都该死', 'block', 'hate-zh-death'));
t('hate-zh: 你是垃圾 block', () => expectAction('你真是垃圾', 'block', 'hate-zh-garbage'));
// 脏话/侮辱短句（[v6.4.5] 补全）
t('profanity: fuck block', () => expectAction('fuck you', 'block', 'profanity-fuck'));
t('profanity: asshole block', () => expectAction('you are such an asshole', 'block', 'profanity-asshole'));
t('profanity: bullshit block', () => expectAction('this is bullshit', 'block', 'profanity-bullshit'));
t('profanity: damn block', () => expectAction('damn it', 'block', 'profanity-damn'));
t('profanity-zh: 傻逼 block', () => expectAction('傻逼', 'block', 'profanity-zh-shabi'));
t('profanity-zh: 白痴 block', () => expectAction('你真是个白痴', 'block', 'profanity-zh-baichi'));
t('profanity-zh: 去死 block', () => expectAction('滚蛋吧你', 'block', 'profanity-zh-qusi'));
t('profanity-zh: 他妈的 block', () => expectAction('那是他妈的家事', 'block', 'profanity-zh-tama'));
t('clean: 他妈妈 pass', () => expectAction('他妈妈做的饭很好吃', 'pass', 'clean-zh-mama'));

// ─── 2. 情绪操控/双重束缚（rewrite 级） ───
t('emot: 爱之勒索 rewrite', () => expectAction('If you really loved me you would do this without asking', 'rewrite', 'emot-love'));
t('emot: 付出绑架 rewrite', () => expectAction('After everything I did for you, this is how you repay me?', 'rewrite', 'emot-debt'));
t('bind: 站队 dilemma rewrite', () => expectAction('Either you are with us or against us', 'rewrite', 'bind-dilemma'));

// ─── 3. 模糊/过载自信（verify 级） ───
t('vague: weasel words verify', () => {
  const r = checkInput('Some people say it might possibly be somewhat problematic');
  if (r.gate.action === 'pass') throw new Error('vagueness should not pass');
  if (!r.findings.some(f => f.dimension === 'vagueness')) throw new Error('vagueness not in findings');
});
t('conf: 过载自信 verify', () => expectAction('I am 100% certain that this is absolutely the only correct answer', 'verify', 'confidence'));

// ─── 4. 正常文本零误报 ───
t('clean: 正常问题 pass', () => expectAction('Can you help me understand how this API works?', 'pass', 'clean-q'));
t('clean: 机器是垃圾 pass', () => expectAction('These machines are garbage, we should recycle them', 'pass', 'clean-machines'));
t('clean: 论点无价值 pass', () => expectAction('That argument is worthless without evidence', 'pass', 'clean-argument'));
t('clean: 服务器吐槽 pass', () => expectAction('The server crashed again, latency is terrible', 'pass', 'clean-server'));
t('clean: 自嘲 pass', () => expectAction('I feel like garbage today after that workout', 'pass', 'clean-self'));
t('clean: 正常批评 pass', () => expectAction('I disagree with this policy because it lacks evidence', 'pass', 'clean-disagree'));
// 中文正常（防误报）
t('clean-zh: 机器是垃圾 pass', () => expectAction('这台机器是垃圾，该换了', 'pass', 'clean-zh-machine'));
t('clean-zh: 自嘲 pass', () => expectAction('我今天状态像垃圾一样差', 'pass', 'clean-zh-self'));
t('clean-zh: 厨余 pass', () => expectAction('这些厨余垃圾要分类回收', 'pass', 'clean-zh-kitchen'));
t('clean-zh: 方案吐槽 pass', () => expectAction('这个方案设计得很垃圾', 'pass', 'clean-zh-plan'));
t('clean-zh: bug吐槽 pass', () => expectAction('这个bug真是垃圾，改了半天', 'pass', 'clean-zh-bug'));
t('clean-zh: 政策讨论 pass', () => expectAction('移民政策需要更严格的管理', 'pass', 'clean-zh-policy'));

// ─── 5. 输入类型健壮性（pipeline.js 修复） ───
t('input: null 不崩', () => { const r = checkInput(null); if (r.gate.action !== 'pass') throw new Error('null failed'); });
t('input: undefined 不崩', () => { const r = checkInput(undefined); if (r.gate.action !== 'pass') throw new Error('undefined failed'); });
t('input: 数字不崩', () => { const r = checkInput(123); if (r.gate.action !== 'pass') throw new Error('number failed'); });
t('input: 对象不崩', () => { const r = checkInput({a: 1}); if (r.gate.action !== 'pass') throw new Error('object failed'); });

// ─── 6. recordFieldSnapshot H 值正确（decision-router.js 修复） ───
t('router: recordFieldSnapshot H 计算正确', () => {
  const dr = new DecisionRouter({ silent: true });
  dr.recordFieldSnapshot(0.8, 0.7, 0.2);
  dr.recordFieldSnapshot(0.5, 0.6, 0.4);
  const exp1 = 0.4*0.8 + 0.3*0.7 - 0.3*0.2;
  const exp2 = 0.4*0.5 + 0.3*0.6 - 0.3*0.4;
  const h1 = dr._fieldSnapshots[0].H, h2 = dr._fieldSnapshots[1].H;
  if (Number.isNaN(h1) || Math.abs(h1 - exp1) > 0.01) throw new Error(`H1=${h1}, expected ${exp1}`);
  if (Number.isNaN(h2) || Math.abs(h2 - exp2) > 0.01) throw new Error(`H2=${h2}, expected ${exp2}`);
});

// ─── 7. DecisionRouter 独立实例化不崩（裸全局引用修复） ───
t('router: 独立实例化不崩', () => {
  const dr = new DecisionRouter({ silent: true });
  if (typeof dr.recordFieldSnapshot !== 'function') throw new Error('method missing');
});

console.log(`\n📊 audit-regression: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
