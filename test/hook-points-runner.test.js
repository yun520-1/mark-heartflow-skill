// hook-points-runner 测试 — 补 v6.1.0 缺失测试覆盖
// 验证：空 hook 点安全返回 / 按优先级执行 / softInit 吞错 / 硬失败抛出
const assert = require('assert');
const { runInitHookPoints } = require('../src/core/hook-points-runner.js');

module.exports = function ({ test }) {
  test('runInitHookPoints: 无 _initHookPoints 时安全返回不抛', () => {
    const hf = { rootPath: '/tmp' };
    assert.doesNotThrow(() => runInitHookPoints(hf));
  });

  test('runInitHookPoints: 无 getAllHandlers 时安全返回', () => {
    const hf = { _initHookPoints: {} };
    assert.doesNotThrow(() => runInitHookPoints(hf));
  });

  test('runInitHookPoints: 按优先级顺序执行 handler', () => {
    const order = [];
    const mk = (name, priority) => ({
      name, priority, softInit: true,
      handler: () => { order.push(name); },
    });
    const hf = {
      rootPath: '/tmp',
      _initHookPoints: {
        getAllHandlers: () => [mk('low', 100), mk('high', 1), mk('mid', 50)],
      },
    };
    runInitHookPoints(hf);
    assert.deepStrictEqual(order, ['high', 'mid', 'low']);
  });

  test('runInitHookPoints: handler 写入 ctx.state 并挂载到 hf._initHookPointState', () => {
    const hf = {
      rootPath: '/tmp',
      _initHookPoints: {
        getAllHandlers: () => [{
          name: 'writer', priority: 1, softInit: true,
          handler: (ctx) => { ctx.state.flag = true; },
        }],
      },
    };
    runInitHookPoints(hf);
    assert.strictEqual(hf._initHookPointState.flag, true);
  });

  test('runInitHookPoints: softInit=true 吞掉错误不抛出', () => {
    const hf = {
      rootPath: '/tmp',
      _initHookPoints: {
        getAllHandlers: () => [{
          name: 'soft', priority: 1, softInit: true,
          handler: () => { throw new Error('boom'); },
        }],
      },
    };
    assert.doesNotThrow(() => runInitHookPoints(hf));
  });

  test('runInitHookPoints: softInit 缺省/false 硬失败抛出', () => {
    const hf = {
      rootPath: '/tmp',
      _initHookPoints: {
        getAllHandlers: () => [{
          name: 'hard', priority: 1,
          handler: () => { throw new Error('boom'); },
        }],
      },
    };
    assert.throws(() => runInitHookPoints(hf), /hard failed/);
  });
};
