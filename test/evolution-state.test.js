/**
 * 进化状态快照 TDD 测试
 * 验证：evolve 把每次进化的发现写 self-state-history(可追溯/对比)
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

function tmpRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-state-'));
  // 造 VERSION 文件
  fs.writeFileSync(path.join(root, 'VERSION'), '6.0.37');
  // 造 src 最小结构(供 Scanner 跑, 避免扫描崩溃)
  fs.mkdirSync(path.join(root, 'src'), { recursive: true });
  fs.writeFileSync(path.join(root, 'src', 'placeholder.js'), '// placeholder\n');
  return root;
}

function run({ test, assertEqual, assertTrue, assertFalse }) {
  test('evolve 写 self-state 快照含版本', () => {
    const { EvolutionLoop } = require('../src/cortex/loop.js');
    const root = tmpRoot();
    const statePath = path.join(root, 'data', 'self-state-history.json');
    const loop = new EvolutionLoop({ rootPath: root });
    return loop.evolve('test state snapshot', {}, { priority: 'critical', maxIterations: 1 }).then(r => {
      assertTrue(fs.existsSync(statePath), '状态文件应存在');
      const states = JSON.parse(fs.readFileSync(statePath, 'utf8'));
      assertTrue(states.length >= 1);
      const last = states[states.length - 1];
      assertEqual(last.version, '6.0.37'); // 应带版本号, 非 unknown
      assertTrue(typeof last.weaknessSummary === 'object');
      assertTrue(typeof last.improvementCount === 'number');
    });
  });

  test('两次进化产生两条快照(可对比)', () => {
    const { EvolutionLoop } = require('../src/cortex/loop.js');
    const root = tmpRoot();
    const statePath = path.join(root, 'data', 'self-state-history.json');
    const loop = new EvolutionLoop({ rootPath: root });
    return loop.evolve('first', {}, { priority: 'critical', maxIterations: 1 })
      .then(() => loop.evolve('second', {}, { priority: 'critical', maxIterations: 1 }))
      .then(() => {
        const states = JSON.parse(fs.readFileSync(statePath, 'utf8'));
        assertTrue(states.length >= 2, '应至少2条快照');
      });
  });
}

module.exports = run;
