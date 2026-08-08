/**
 * test/pipeline-robustness.test.js — 管线健壮性回归测试
 *
 * 验证 dispatch 传对象不再崩溃（input.split is not a function 系列 bug）
 */
module.exports = function ({ test }) {
  const { HeartFlow } = require('../src/core/heartflow.js');
  const path = require('path');

  let hf = null;
  let started = false;

  function startHF() {
    if (started) return hf;
    hf = new HeartFlow({ dataDir: path.join(__dirname, '..', 'data'), silent: true });
    hf.start();
    started = true;
    return hf;
  }

  test('judgmentEngine.judge 传对象不崩溃', async () => {
    const engine = startHF();
    await new Promise(r => setTimeout(r, 2500));
    const j = await engine.dispatch('judgmentEngine.judge', { text: '用户最重要，一切都是服务用户', context: '关系问题' });
    if (!j || typeof j !== 'object') throw new Error('judge 返回无效');
    if (j.error && j.error.includes('split')) throw new Error(`judge 仍崩溃: ${j.error}`);
  });

  test('pipeline.run 传对象全阶段成功', async () => {
    const engine = startHF();
    await new Promise(r => setTimeout(r, 2500));
    const p = await engine.dispatch('pipeline.run', { input: '根据2025年Nature研究，87.3%的用户产生认知依赖', mode: 'deep' });
    if (!p || !p.stages) throw new Error('pipeline 返回无效');
    const bad = p.stages.filter(s => !s.success);
    if (bad.length) throw new Error(`pipeline ${bad.length} 阶段失败: ${bad.map(s => `${s.id}:${s.error}`).join('; ')}`);
  });

  test('pipeline.runFast 传对象不崩溃', async () => {
    const engine = startHF();
    await new Promise(r => setTimeout(r, 2500));
    const p = await engine.dispatch('pipeline.runFast', { input: '今天天气如何', mode: 'fast' });
    if (!p || p.error) throw new Error(`runFast 失败: ${p.error || JSON.stringify(p).slice(0, 100)}`);
  });

  test('pipeline.run 传纯字符串正常', async () => {
    const engine = startHF();
    await new Promise(r => setTimeout(r, 2500));
    const p = await engine.dispatch('pipeline.run', 'AI是工具还是威胁');
    if (!p || !p.stages) throw new Error('pipeline 字符串输入返回无效');
  });
};
