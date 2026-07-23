// 对抗综合器测试 [v6.1.6]
const assert = require('assert');
const AdversarialSynthesis = require('../src/cortex/self-evolution/adversarial-synthesis.js');

module.exports = function ({ test }) {
  const adv = new AdversarialSynthesis();

  test('synthesize: 关税议题生成两方立场', () => {
    const r = adv.synthesize('美国对加拿大加征50%关税对全球贸易的影响');
    assert.strictEqual(r.ok, true);
    assert.strictEqual(r.positions.length, 2);
    assert.ok(r.positions[0].side && r.positions[1].side);
    assert.ok(r.positions[0].fearDriver && r.positions[1].fearDriver);
  });

  test('synthesize: 提炼共同真问题', () => {
    const r = adv.synthesize('欧盟对华电动车反补贴关税');
    assert.ok(r.sharedProblem && r.sharedProblem.length > 5);
    assert.ok(r.synthesis && r.synthesis.includes('共同真问题'));
  });

  test('synthesize: 不单向结论(含两方且标注恐惧驱动)', () => {
    const r = adv.synthesize('贸易战关税升级');
    const txt = JSON.stringify(r);
    assert.ok(txt.includes('恐惧'), '应标注各方恐惧驱动, 不站队');
  });

  test('synthesize: 短输入返回 ok=false 不崩', () => {
    const r = adv.synthesize('好');
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.positions.length, 0);
  });

  test('synthesize: 无匹配轴时回退通用轴', () => {
    const r = adv.synthesize('今天中午吃什么比较好呢这是个日常问题');
    assert.strictEqual(r.ok, true);
    assert.strictEqual(r.axis, 'generic');
  });

  test('接入 think: adversarialSynthesis 挂到返回', async () => {
    const { HeartFlow } = require('../src/core/heartflow.js');
    const hf = new HeartFlow({ dataDir: process.cwd() + '/data', silent: true });
    hf.start();
    await new Promise(res => setTimeout(res, 3500));
    const r = await hf.think('关税战对全球供应链的影响');
    assert.ok(r.output, '原 output 不破坏');
    assert.ok(r.adversarialSynthesis, '对抗综合应挂载');
    assert.strictEqual(r.adversarialSynthesis.positions.length, 2);
    hf.shutdown();
  });
};
