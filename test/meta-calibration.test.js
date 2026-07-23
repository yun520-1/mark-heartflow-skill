// 元认知诚实层测试 [v6.1.7]
const assert = require('assert');
const MetaCalibration = require('../src/core/meta-calibration.js');

module.exports = function ({ test }) {
  const mc = new MetaCalibration();

  test('annotate: 低置信度触发诚实声明', () => {
    const r = mc.annotate({ calibration: { calibratedConfidence: 0.3, needsUncertaintyMarker: true, uncertaintyPhrase: '缺少关键信息' } });
    assert.strictEqual(r.honest, true);
    assert.strictEqual(r.level, 'low');
    assert.ok(r.statement && r.statement.includes('不确定'), '应显式说不确定');
    assert.ok(r.gaps.length >= 1);
  });

  test('annotate: 高置信度不误报', () => {
    const r = mc.annotate({ calibration: { calibratedConfidence: 0.9, needsUncertaintyMarker: false } });
    assert.strictEqual(r.honest, false);
    assert.strictEqual(r.statement, null);
  });

  test('annotate: 子系统被下调也计入 gap', () => {
    const r = mc.annotate({
      calibration: {
        calibratedConfidence: 0.6,
        subsystemCalibration: { text: { adjusted: true, confidence: { calibrated: 0.3 } } },
      },
    });
    assert.strictEqual(r.honest, true);
    assert.ok(r.gaps.some(g => g.what.includes('text')));
  });

  test('annotate: 无 calibration 兜底不崩', () => {
    const r = mc.annotate({});
    assert.strictEqual(r.honest, true);
    assert.ok(r.calibratedConfidence >= 0);
  });

  test('接入 think: metaCalibration 挂到返回', async () => {
    const { HeartFlow } = require('../src/core/heartflow.js');
    const hf = new HeartFlow({ dataDir: process.cwd() + '/data', silent: true });
    hf.start();
    await new Promise(res => setTimeout(res, 3500));
    const r = await hf.think('明年全球经济的精确走向是什么');
    assert.ok(r.output, '原 output 不破坏');
    assert.ok(r.metaCalibration, '元认知字段应挂载');
    assert.strictEqual(r.metaCalibration.honest, true);
    hf.shutdown();
  });
};
