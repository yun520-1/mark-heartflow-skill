// 智能升级引擎 - 自我升级记录与持久化测试
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

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-upg-'));
const e = new SmartUpgradeEngine(tmpRoot);

ok('recordSelfUpgrade 返回记录对象', () => {
  const r = e.recordSelfUpgrade({ version: '6.0.11', description: 'test', impact: 0.5 });
  assert.ok(r && r.version === '6.0.11' && r.timestamp > 0);
});

ok('getStats 合并自我升级历史', () => {
  const s = e.getStats();
  assert.strictEqual(s.selfUpgrades, 1);
  assert.strictEqual(s.totalUpgrades, 1);
  assert.ok(s.lastUpgrade > 0);
});

ok('历史持久化到磁盘', () => {
  assert.ok(fs.existsSync(e.upgradeHistoryPath));
  const hist = JSON.parse(fs.readFileSync(e.upgradeHistoryPath, 'utf8'));
  assert.strictEqual(hist.length, 1);
});

ok('多次记录累积', () => {
  e.recordSelfUpgrade({ version: '6.0.12', description: 'second', impact: 0.3 });
  const s = e.getStats();
  assert.strictEqual(s.selfUpgrades, 2);
  assert.strictEqual(s.totalUpgrades, 2);
});

console.log(`\nupgrade-engine-self-record: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
