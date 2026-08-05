/**
 * test/introspect-wiring.test.js — 自省链路接线回归测试
 * 覆盖：heartflow.introspect 路由 / self-view 计数 / Reflector 数据流
 */
'use strict';
const assert = require('assert');
const path = require('path');
const fs = require('fs');

module.exports = function ({ test }) {
  const ROOT = path.join(__dirname, '..');

  test('introspect: heartflow.introspect 路由可用', async () => {
    const { HeartFlow } = require('../src/core/heartflow.js');
    const hf = new HeartFlow({ dataDir: path.join(ROOT, 'data'), silent: true });
    hf.start();
    await new Promise(r => setTimeout(r, 2500));
    const r = await hf.dispatch('heartflow.introspect');
    assert.ok(r.ok, 'introspect 应成功');
    assert.ok(r.diagnosis && Object.keys(r.diagnosis).length >= 3, '诊断项 ≥ 3');
    hf.shutdown();
  });

  test('introspect: think 后 self-view.json 计数递增', async () => {
    const svPath = path.join(ROOT, 'data', 'self-view.json');
    const before = fs.existsSync(svPath) ? (JSON.parse(fs.readFileSync(svPath, 'utf8')).thinkCount || 0) : 0;
    const { HeartFlow } = require('../src/core/heartflow.js');
    const hf = new HeartFlow({ dataDir: path.join(ROOT, 'data'), silent: true });
    hf.start();
    await new Promise(r => setTimeout(r, 2500));
    await hf.think('测试自省计数');
    await new Promise(r => setTimeout(r, 500));
    const after = JSON.parse(fs.readFileSync(svPath, 'utf8')).thinkCount || 0;
    assert.ok(after > before, `thinkCount 应递增 (${before} → ${after})`);
    hf.shutdown();
  });

  test('introspect: Reflector.feed 打通数据流', async () => {
    const { Reflector } = require('../src/cortex/reflector.js');
    const reflector = new Reflector(ROOT);
    const res = reflector.feed({ task: '回归测试任务', success: true, emotion: { valence: 7, arousal: 5 } });
    assert.ok(res.ok, 'feed 应成功');
    const state = JSON.parse(fs.readFileSync(reflector.stateFile, 'utf8'));
    assert.ok(Array.isArray(state.achievements) && state.achievements.length > 0, 'achievements 应有数据');
  });
};
