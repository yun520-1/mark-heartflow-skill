// self-scanner 探针一致性测试 [v6.1.4]
const assert = require('assert');
const { SelfScanner } = require('../src/cortex/self-evolution/self-scanner.js');

module.exports = function ({ test }) {
  test('探针: 默认无环境变量时 arxiv_explore 应为 alive (v6.1.2 起默认开)', () => {
    delete process.env.HEARTFLOW_SELF_EVOLVE_EXPLORE;
    const s = new SelfScanner(process.cwd());
    const r = s.scan();
    const p = r.livenessProbes.find(x => x.capability === 'arxiv_explore');
    assert.ok(p, 'arxiv_explore 探针存在');
    assert.strictEqual(p.alive, true, '默认应 alive, 不应误报沉默失效');
  });

  test('探针: =0 显式关闭时 alive=false', () => {
    process.env.HEARTFLOW_SELF_EVOLVE_EXPLORE = '0';
    const s = new SelfScanner(process.cwd());
    const r = s.scan();
    const p = r.livenessProbes.find(x => x.capability === 'arxiv_explore');
    assert.strictEqual(p.alive, false);
    delete process.env.HEARTFLOW_SELF_EVOLVE_EXPLORE;
  });

  test('扫描: TODO 计数精准 (不含 XXX 占位符)', () => {
    const s = new SelfScanner(process.cwd());
    const r = s.scan();
    assert.ok(r.todoCount <= 5, 'TODO 应是个位数(真实标记), 不应虚高');
  });
};
