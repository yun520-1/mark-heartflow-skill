/**
 * LatencyBenchmark TDD 测试
 * 验证：公开延迟基准（GitHub #7 Latency 缺口）
 */
function run({ test, assertEqual, assertTrue, assertFalse }) {
  test('percentile p50 计算正确', () => {
    const { LatencyBenchmark } = require('../src/benchmark/latency-benchmark.js');
    const v = [10, 20, 30, 40, 50];
    assertEqual(LatencyBenchmark.percentile(v, 50), 30);
    assertEqual(LatencyBenchmark.percentile(v, 95), 50);
    assertEqual(LatencyBenchmark.percentile(v, 0), 10);
  });

  test('percentile 空数组返回 0', () => {
    const { LatencyBenchmark } = require('../src/benchmark/latency-benchmark.js');
    assertEqual(LatencyBenchmark.percentile([], 50), 0);
  });

  test('measure 采集到指定样本数', async () => {
    const { LatencyBenchmark } = require('../src/benchmark/latency-benchmark.js');
    let calls = 0;
    const b = new LatencyBenchmark(async () => { calls++; }, { warmup: 1, samples: 5 });
    const lats = await b.measure();
    assertEqual(lats.length, 5);
    assertEqual(calls, 6); // 1 warmup + 5 samples
    assertTrue(lats.every(x => typeof x === 'number' && x >= 0));
  });

  test('report 返回 p50/p95 结构', async () => {
    const { LatencyBenchmark } = require('../src/benchmark/latency-benchmark.js');
    const b = new LatencyBenchmark(async () => {}, { warmup: 1, samples: 10 });
    const r = await b.report();
    assertEqual(r.samples, 10);
    assertTrue(r.p50Ms !== undefined);
    assertTrue(r.p95Ms !== undefined);
    assertTrue(r.p95Ms >= r.p50Ms);
  });

  test('report 失败样本也计入', async () => {
    const { LatencyBenchmark } = require('../src/benchmark/latency-benchmark.js');
    const b = new LatencyBenchmark(async () => { throw new Error('x'); }, { warmup: 0, samples: 3 });
    const r = await b.report();
    assertEqual(r.samples, 3); // 失败也记时长
  });
}

module.exports = run;
