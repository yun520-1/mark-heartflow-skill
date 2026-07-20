/**
 * TTLPreferences TDD 测试
 * 验证：可调 TTL 临时偏好（GitHub #7 Temporary Preferences 缺口）
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

function tmpRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-ttl-'));
  fs.mkdirSync(path.join(root, 'data'), { recursive: true });
  return root;
}

function run({ test, assertEqual, assertTrue, assertFalse }) {
  test('set/get 基本读写', () => {
    const { TTLPreferences } = require('../src/memory/ttl-preferences.js');
    const t = new TTLPreferences(tmpRoot());
    t.set('theme', 'dark');
    assertEqual(t.get('theme'), 'dark');
  });

  test('ttlMs=0 永不过期', () => {
    const { TTLPreferences } = require('../src/memory/ttl-preferences.js');
    const t = new TTLPreferences(tmpRoot());
    const r = t.set('lang', 'zh', 0);
    assertEqual(r.expiresAt, null);
    assertEqual(t.get('lang'), 'zh');
  });

  test('过期后 get 返回 null 并清理', async () => {
    const { TTLPreferences } = require('../src/memory/ttl-preferences.js');
    const t = new TTLPreferences(tmpRoot());
    t.set('temp', 'x', 50); // 50ms 后过期
    assertEqual(t.get('temp'), 'x'); // 立即可读
    await new Promise(r => setTimeout(r, 70));
    assertEqual(t.get('temp'), null); // 过期
  });

  test('all 只列未过期', async () => {
    const { TTLPreferences } = require('../src/memory/ttl-preferences.js');
    const t = new TTLPreferences(tmpRoot());
    t.set('keep', 'a', 0);       // 永久
    t.set('gone', 'b', 30);      // 30ms 过期
    await new Promise(r => setTimeout(r, 50));
    const all = t.all();
    assertTrue('keep' in all);
    assertFalse('gone' in all);
  });

  test('sweep 清理过期项', async () => {
    const { TTLPreferences } = require('../src/memory/ttl-preferences.js');
    const t = new TTLPreferences(tmpRoot());
    t.set('a', 1, 20);
    t.set('b', 2, 20);
    t.set('c', 3, 0);
    await new Promise(r => setTimeout(r, 40));
    const swept = t.sweep();
    assertEqual(swept, 2);
    assertEqual(t.get('c'), 3);
  });

  test('remove/clear', () => {
    const { TTLPreferences } = require('../src/memory/ttl-preferences.js');
    const t = new TTLPreferences(tmpRoot());
    t.set('x', 1); t.set('y', 2);
    assertTrue(t.remove('x'));
    assertFalse(t.remove('x')); // 已删
    assertEqual(t.clear(), 1);  // 剩 y
  });

  test('持久化：新实例能读到', () => {
    const { TTLPreferences } = require('../src/memory/ttl-preferences.js');
    const root = tmpRoot();
    const t1 = new TTLPreferences(root);
    t1.set('persist', 'yes', 0);
    const t2 = new TTLPreferences(root);
    assertEqual(t2.get('persist'), 'yes');
  });
}

module.exports = run;
