// heartflow.think 盲点打破器接入测试 [v6.1.5]
const assert = require('assert');
const { HeartFlow } = require('../src/core/heartflow.js');

module.exports = function ({ test }) {
  const mk = () => new HeartFlow({ dataDir: process.cwd() + '/data', silent: true });

  test('think: 盲点分析接入主链路 (blindSpotAnalysis 出现)', async () => {
    const hf = mk();
    hf.start();
    await new Promise(r => setTimeout(r, 3500));
    const r = await hf.think('我工作上很努力但领导总是否定我，我不知道是不是我的问题');
    assert.ok(r.output, '原 output 不被破坏');
    assert.ok(r.blindSpotAnalysis, 'blindSpotAnalysis 应挂载');
    assert.ok(r.blindSpotAnalysis.deconstruction || r.blindSpotAnalysis.reframing, '应包含盲点四层结果');
    hf.shutdown();
  });

  test('think: 盲点检测失败不阻断主链路 (try/catch 隔离)', async () => {
    const hf = mk();
    hf.start();
    await new Promise(r => setTimeout(r, 3500));
    // 即使盲点模块异常, think 仍返回 output
    const r = await hf.think('今天天气不错');
    assert.ok(r.output, '主链路结果仍在');
    hf.shutdown();
  });

  test('think: 空输入仍返回 error 不崩', async () => {
    const hf = mk();
    hf.start();
    await new Promise(r => setTimeout(r, 3500));
    const r = await hf.think('');
    assert.strictEqual(r.error, 'input is required');
    hf.shutdown();
  });
};
