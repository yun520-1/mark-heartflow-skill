/**
 * DataEraser TDD 测试
 * 验证：显式擦除 API（GitHub #7 Data Erasure 缺口）
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

function makeTmpRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-eraser-'));
  const memDir = path.join(root, 'data', 'memory');
  fs.mkdirSync(memDir, { recursive: true });
  // 造 EPHEMERAL 数据：2 条 user:alice, 1 条 user:bob
  fs.writeFileSync(path.join(memDir, 'ephemeral.json'), JSON.stringify([
    { scope: 'user:alice', text: '临时偏好A' },
    { scope: 'user:alice', text: '临时偏好B' },
    { scope: 'user:bob', text: '临时偏好C' }
  ]));
  // 造 LEARNED 数据：带 tag 'old'
  fs.writeFileSync(path.join(memDir, 'learned.json'), JSON.stringify([
    { tags: ['old'], text: '旧记忆1' },
    { tags: ['keep'], text: '保留记忆' }
  ]));
  return root;
}

function run({ test, assertEqual, assertTrue, assertFalse }) {
  test('eraseEphemeral 按 scope 擦除', () => {
    const root = makeTmpRoot();
    const { DataEraser } = require('../src/memory/data-eraser.js');
    const e = new DataEraser(root);
    const r = e.eraseEphemeral('user:alice');
    assertEqual(r.erased, 2);
    assertEqual(r.after, 1); // 只剩 bob
  });

  test('eraseEphemeral * 全清', () => {
    const root = makeTmpRoot();
    const { DataEraser } = require('../src/memory/data-eraser.js');
    const e = new DataEraser(root);
    const r = e.eraseEphemeral('*');
    assertEqual(r.erased, 3);
    assertEqual(r.after, 0);
  });

  test('eraseByTag 删除带 tag 的记忆', () => {
    const root = makeTmpRoot();
    const { DataEraser } = require('../src/memory/data-eraser.js');
    const e = new DataEraser(root);
    const r = e.eraseByTag('old');
    assertEqual(r.erased, 1);
    assertEqual(r.after, 1); // 只剩 keep
  });

  test('stats 报告计数且不暴露 CORE 擦除', () => {
    const root = makeTmpRoot();
    const { DataEraser } = require('../src/memory/data-eraser.js');
    const e = new DataEraser(root);
    const s = e.stats();
    assertEqual(s.ephemeralCount, 3);
    assertEqual(s.coreProtected, true);
  });

  test('erasure-log 记录审计轨迹', () => {
    const root = makeTmpRoot();
    const { DataEraser } = require('../src/memory/data-eraser.js');
    const e = new DataEraser(root);
    e.eraseEphemeral('user:alice');
    const log = JSON.parse(fs.readFileSync(path.join(root, 'data', 'erasure-log.json'), 'utf8'));
    assertEqual(log.length, 1);
    assertEqual(log[0].action, 'eraseEphemeral');
  });
}

module.exports = run;
