// 智能升级引擎 - 自我状态快照（身份连续性）测试
const assert = require('assert');
const { SmartUpgradeEngine } = require('../src/cortex/smart-upgrade-engine.js');
const fs = require('fs');
const os = require('os');
const path = require('path');

let pass = 0, fail = 0;
function ok(name, fn) {
  try { fn(); pass++; console.log('  ✓', name); }
  catch (e) { fail++; console.log('  ✗', name, '-', e.message); }
}

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-state-'));
const e = new SmartUpgradeEngine(tmpRoot);

ok('recordSelfState 返回快照对象', () => {
  const s = e.recordSelfState({ version: '6.0.13', notes: ['test'], reflection: 'ok' });
  assert.ok(s && s.timestamp > 0 && s.version === '6.0.13');
});

ok('getLatestSelfState 返回最近一条', () => {
  e.recordSelfState({ version: '6.0.14', notes: [] });
  const latest = e.getLatestSelfState();
  assert.strictEqual(latest.version, '6.0.14');
});

ok('自我状态持久化到磁盘', () => {
  assert.ok(fs.existsSync(e.selfStatePath));
  const states = JSON.parse(fs.readFileSync(e.selfStatePath, 'utf8'));
  assert.strictEqual(states.length, 2);
});

ok('多次快照累积且截断上限100', () => {
  for (let i = 0; i < 105; i++) e.recordSelfState({ n: i });
  const states = JSON.parse(fs.readFileSync(e.selfStatePath, 'utf8'));
  assert.strictEqual(states.length, 100);
});

console.log(`\nself-state-persist: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
