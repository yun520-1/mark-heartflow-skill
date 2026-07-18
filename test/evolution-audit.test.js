/**
 * 进化审计闭环 TDD 测试
 * 验证：evolve 的进化动作自身被审计记录(自我进化可追溯)
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

function tmpRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'hf-evo-audit-'));
}

function run({ test, assertEqual, assertTrue, assertFalse }) {
  test('evolve 跑完写进化审计日志', () => {
    const { EvolutionLoop } = require('../src/cortex/loop.js');
    const root = tmpRoot();
    const logPath = path.join(root, 'data', 'audit', 'evolution-audit.jsonl');
    const loop = new EvolutionLoop({ rootPath: root });
    return loop.evolve('test evolution audit', {}, { priority: 'critical', maxIterations: 1 }).then(r => {
      assertTrue(fs.existsSync(logPath), '进化审计日志应落盘');
      const lines = fs.readFileSync(logPath, 'utf8').trim().split('\n').filter(Boolean);
      assertTrue(lines.length >= 1);
      const entry = JSON.parse(lines[0]);
      assertEqual(entry.e, 'evolution_cycle');
      assertTrue(typeof entry.d.cycle === 'number');
      assertTrue(Array.isArray(entry.d.improvements));
      assertTrue(typeof entry.h === 'string'); // 防篡改哈希
    });
  });

  test('进化审计日志记录真实弱点扫描结果', () => {
    const { EvolutionLoop } = require('../src/cortex/loop.js');
    const root = tmpRoot();
    const logPath = path.join(root, 'data', 'audit', 'evolution-audit.jsonl');
    const loop = new EvolutionLoop({ rootPath: root });
    return loop.evolve('scan weaknesses', {}, { priority: 'critical', maxIterations: 1 }).then(r => {
      const lines = fs.readFileSync(logPath, 'utf8').trim().split('\n');
      const entry = JSON.parse(lines[lines.length - 1]);
      assertTrue(entry.d.weaknesses !== null, '应含弱点扫描结果');
      assertTrue(typeof entry.d.weaknesses.todoCount === 'number');
    });
  });
}

module.exports = run;
