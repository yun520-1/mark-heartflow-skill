// 智能升级引擎 - 重复TODO注释清理验证
const assert = require('assert');
const fs = require('fs');
const path = require('path');

let pass = 0, fail = 0;
function ok(name, fn) {
  try { fn(); pass++; console.log('  ✓', name); }
  catch (e) { fail++; console.log('  ✗', name, '-', e.message); }
}

const file = path.join(__dirname, '..', 'src', 'cortex', 'smart-upgrade-engine.js');
const content = fs.readFileSync(file, 'utf8');

ok('无重复 _boundedSet TODO 注释块', () => {
  const matches = content.match(/TODO: 超长函数 _boundedSet/g) || [];
  const matches2 = content.match(/TODO: _boundedSet/g) || [];
  const total = matches.length + matches2.length;
  assert.strictEqual(total, 1, `预期仅1处, 实际 ${total} 处`);
});

ok('保留1处 _boundedSet TODO 注释', () => {
  assert.ok(/TODO: 超长函数 _boundedSet/.test(content));
});

ok('引擎仍可加载', () => {
  assert.doesNotThrow(() => require('../src/cortex/smart-upgrade-engine.js'));
});

console.log(`\nsmart-upgrade-cleanup: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
