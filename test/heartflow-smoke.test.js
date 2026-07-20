// HeartFlow 核心单体 (heartflow.js, 6371行) 冒烟测试 — 审计P0回归护栏
// 目标：给无针对性测试的超级单体一个最小回归护栏，
// 确保 createHeartFlow() 能正常实例化、核心方法可用。
const assert = require('assert');

let pass = 0, fail = 0;
function ok(name, fn) {
  try { fn(); pass++; console.log('  ✓', name); }
  catch (e) { fail++; console.log('  ✗', name, '-', e.message); }
}

let HeartFlow, createHeartFlow;
try {
  ({ HeartFlow, createHeartFlow } = require('../src/core/heartflow.js'));
} catch (e) {
  console.log('  ⚠️ 无法加载 heartflow.js:', e.message);
  process.exit(1);
}

ok('模块导出 HeartFlow / createHeartFlow', () => {
  assert.strictEqual(typeof HeartFlow, 'function');
  assert.strictEqual(typeof createHeartFlow, 'function');
});

ok('createHeartFlow 返回实例对象', () => {
  const hf = createHeartFlow({ rootPath: process.cwd() });
  assert.ok(hf && typeof hf === 'object');
  assert.strictEqual(typeof hf.version, 'string');
});

ok('实例化不抛异常（125模块加载链路）', () => {
  assert.doesNotThrow(() => {
    const hf = createHeartFlow({ rootPath: process.cwd() });
    assert.ok(hf);
  });
});

ok('VERSION 导出为字符串', () => {
  const { VERSION } = require('../src/core/heartflow.js');
  assert.strictEqual(typeof VERSION, 'string');
  assert.ok(VERSION.match(/^\d+\.\d+\.\d+$/), 'VERSION 应符合 semver');
});

ok('实例化后核心子模块已挂载（memory/cognitive/identityCore）', () => {
  const hf = createHeartFlow({ rootPath: process.cwd() });
  assert.ok('memory' in hf, 'memory 属性应存在');
  assert.ok('cognitive' in hf, 'cognitive 属性应存在');
  assert.ok('identityCore' in hf, 'identityCore 属性应存在');
});

console.log(`\nheartflow-smoke: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
