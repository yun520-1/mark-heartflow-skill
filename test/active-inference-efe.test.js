/**
 * 回归测试：thought-chain 主动推理 EFE 层
 * Bug: S3 主动推理段误用 HYPOTHESES stage 的局部变量 `hypotheses`，
 *      导致 ReferenceError 被 catch 吞掉 -> EFE 层永远 skip、从不运行。
 * Fix: 从 ctx.stages 取 HYPOTHESES 阶段真实结果。
 */
const assert = require('assert');
const { HeartFlow } = require('../src/core/heartflow.js');

module.exports = function ({ test }) {
  test('主动推理 EFE 层接入主路径，不再因未定义变量静默跳过', async () => {
    const hf = new HeartFlow({ dataDir: process.cwd() + '/data', silent: true });
    hf.start();
    await new Promise(r => setTimeout(r, 3000));

    const origWarn = console.warn;
    let efeSkipped = false;
    console.warn = (...args) => {
      if (String(args[0]).includes('EFE skipped')) efeSkipped = true;
      origWarn(...args);
    };

    const r = await hf.think('分析一下：为什么每次自我升级后版本号会倒退');

    console.warn = origWarn;

    assert.strictEqual(efeSkipped, false, 'ActiveInference EFE 不应被 skip（局部变量 hypotheses 已修复）');
    assert.ok(r && r.output, 'think() 应返回有效结果');
  });
};
