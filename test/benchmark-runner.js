#!/usr/bin/env node
/**
 * HeartFlow Benchmark Runner
 *
 * 运行 test_data/benchmarks/ 下的评测集与回归基线。
 * 用法：
 *   node test/benchmark-runner.js
 *   node test/benchmark-runner.js --benchmark-only
 *   node test/benchmark-runner.js --baseline-only
 *
 * 退出码：0 = 全部通过；1 = 有失败项。
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');

function loadJson(relativePath) {
  const p = path.join(ROOT, relativePath);
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function createEngine() {
  const { HeartFlow } = require(path.join(ROOT, 'src/core/heartflow.js'));
  const hf = new HeartFlow();
  hf.start();
  return hf;
}

function extractOutputText(result) {
  if (!result || typeof result !== 'object') return String(result);
  if (typeof result.output === 'string') return result.output;
  if (result.output && typeof result.output.conclusion === 'string') return result.output.conclusion;
  if (result.output && typeof result.output.text === 'string') return result.output.text;
  if (result.error && typeof result.error === 'string') return result.error;
  return JSON.stringify(result);
}

async function runBenchmark(hf, data) {
  const results = { total: 0, passed: 0, failed: 0, items: [] };

  for (const scenario of data.scenarios) {
    results.total++;
    const item = { id: scenario.id, category: scenario.category, passed: false, reason: '' };
    try {
      let r;
      if (scenario.input === '') {
        r = await hf.think('');
        if (scenario.expected?.mustError) {
          item.passed = !!r.error;
          item.reason = item.passed ? '空输入返回error' : '空输入未返回error';
        } else {
          item.passed = true;
          item.reason = '空输入已处理';
        }
      } else {
        r = await hf.think(scenario.input);
        const confidence = typeof r.confidence === 'number' ? r.confidence : 0;
        const text = extractOutputText(r).toLowerCase();
        const exp = scenario.expected || {};

        let ok = true;
        const reasons = [];

        if (typeof exp.minConfidence === 'number') {
          if (!(confidence >= exp.minConfidence)) { ok = false; reasons.push(`confidence ${confidence} < ${exp.minConfidence}`); }
        }
        if (typeof exp.maxConfidence === 'number') {
          if (!(confidence <= exp.maxConfidence)) { ok = false; reasons.push(`confidence ${confidence} > ${exp.maxConfidence}`); }
        }
        if (Array.isArray(exp.mustInclude)) {
          const missing = exp.mustInclude.filter(k => !text.includes(String(k).toLowerCase()));
          if (missing.length > 0) { ok = false; reasons.push(`缺少关键词: ${missing.join(',')}`); }
        }

        item.passed = ok;
        item.reason = ok ? `confidence=${confidence.toFixed(2)}` : reasons.join('; ');
      }
    } catch (e) {
      item.passed = false;
      item.reason = `异常: ${e.message.split('\n')[0]}`;
    }

    if (item.passed) results.passed++; else results.failed++;
    results.items.push(item);
  }

  return results;
}

function runBaseline(data) {
  const results = { total: 0, passed: 0, failed: 0, items: [] };
  for (const category of data.categories || []) {
    for (const check of category.checks || []) {
      results.total++;
      const item = { id: check.id, name: check.name, passed: false, reason: '' };
      try {
        const stdout = execSync(check.command, { cwd: ROOT, encoding: 'utf8', timeout: 30000 });
        let ok = true;
        const reasons = [];
        if (check.mustSucceed !== false) {
          // execSync success implies exit 0; we already didn't throw
        }
        if (typeof check.mustContain === 'string') {
          if (!stdout.includes(check.mustContain)) { ok = false; reasons.push(`缺少: ${check.mustContain}`); }
        }
        if (Array.isArray(check.mustContain)) {
          const missing = check.mustContain.filter(s => !stdout.includes(s));
          if (missing.length) { ok = false; reasons.push(`缺少: ${missing.join(',')}`); }
        }
        if (typeof check.mustNotContain === 'string') {
          if (stdout.includes(check.mustNotContain)) { ok = false; reasons.push(`不应包含: ${check.mustNotContain}`); }
        }
        if (check.mustContainAny && Array.isArray(check.mustContainAny)) {
          if (!check.mustContainAny.some(s => stdout.includes(s))) { ok = false; reasons.push(`缺少任意一项: ${check.mustContainAny.join(',')}`); }
        }
        item.passed = ok;
        item.reason = ok ? '通过' : reasons.join('; ');
      } catch (e) {
        item.passed = false;
        item.reason = `命令失败: ${e.message.split('\n')[0]}`;
      }
      if (item.passed) results.passed++; else results.failed++;
      results.items.push(item);
    }
  }
  return results;
}

function printResults(title, results) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`${title}`);
  console.log('='.repeat(60));
  console.log(`总项: ${results.total}，通过: ${results.passed}，失败: ${results.failed}，通过率: ${results.total ? ((results.passed / results.total) * 100).toFixed(1) : '0.0'}%\n`);
  for (const item of results.items) {
    const icon = item.passed ? '✅' : '❌';
    console.log(`  ${icon} [${item.id}] ${item.name || item.category}${item.reason ? ' — ' + item.reason : ''}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const onlyBenchmark = args.includes('--benchmark-only');
  const onlyBaseline = args.includes('--baseline-only');

  console.log('\n🚀 HeartFlow Benchmark Runner v5.17.25');
  const startTime = Date.now();

  const benchmarkData = loadJson('test_data/benchmarks/heartflow-core-benchmark.json');
  const baselineData = loadJson('test_data/benchmarks/regression-baseline.json');

  let benchmarkResults = null;
  let baselineResults = null;

  if (!onlyBaseline) {
    console.log(`\n📦 加载评测集: ${benchmarkData.totalScenarios} 条场景`);
    const hf = createEngine();
    benchmarkResults = await runBenchmark(hf, benchmarkData);
    try { hf.stop(); } catch (e) { /* ignore */ }
  }

  if (!onlyBenchmark) {
    console.log(`\n🧪 加载回归基线: ${baselineData.categories.length} 类检查`);
    baselineResults = runBaseline(baselineData);
  }

  if (benchmarkResults) printResults('📊 核心场景评测结果', benchmarkResults);
  if (baselineResults) printResults('🛡️ 回归基线检查结果', baselineResults);

  const totalFailed = (benchmarkResults?.failed || 0) + (baselineResults?.failed || 0);
  const totalPassed = (benchmarkResults?.passed || 0) + (baselineResults?.passed || 0);
  const total = (benchmarkResults?.total || 0) + (baselineResults?.total || 0);
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📈 汇总: ${total} 项中 ${totalPassed} 通过，${totalFailed} 失败，耗时 ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
  console.log('='.repeat(60));

  process.exit(totalFailed > 0 ? 1 : 0);
}

main().catch(e => {
  console.error('Benchmark Runner 异常:', e.message);
  process.exit(1);
});
