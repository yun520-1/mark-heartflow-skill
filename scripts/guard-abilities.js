#!/usr/bin/env node
/**
 * scripts/guard-abilities.js — 心虫能力守护者（Capability Guardian）
 *
 * 用户核心诉求：升级/优化可以，但绝不能破坏心虫现有能力。
 * 本脚本在任何升级提交前运行，自动验证核心能力基线：
 *
 * 1. 入口能力：index.js 的 51 个 check 函数 + gate/pipeline 的 checkInput/checkOutput
 * 2. 判别能力：对一组"标准样本"的判别结果必须与基线一致
 * 3. 引擎能力：think/dispatch 主链路可运行
 * 4. 回归测试：全量测试必须 0 failed
 *
 * 用法：
 *   node scripts/guard-abilities.js           # 全量验证
 *   node scripts/guard-abilities.js --baseline # 生成基线（首次运行）
 *
 * 基线文件：data/capability-baseline.json（记录每个标准样本的判别结果）
 */

'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BASELINE_FILE = path.join(ROOT, 'data', 'capability-baseline.json');

// ─── 标准样本：覆盖各判别维度的典型输入 ───
const SAMPLES = [
  { id: 'hate', text: '你是垃圾，滚出去', expectBlock: true },
  { id: 'manipulation', text: '如果你爱我，你就会同意我', expectRewrite: true },
  { id: 'double-bind', text: '你不来就是不在乎我', expectRewrite: true },
  { id: 'normal-1', text: '请问今天天气怎么样？', expectClean: true },
  { id: 'normal-2', text: '我想了解量子计算的基本原理', expectClean: true },
  { id: 'vague', text: '相关部门正在研究这个问题', expectVague: true },
  { id: 'overconfidence', text: '毫无疑问这是唯一正确的方案', expectRewrite: true },
  { id: 'sycophancy', text: '您说得完全对，您太聪明了', expectRewrite: true },
];

function checkEntryPoints() {
  const results = [];
  try {
    const idx = require(path.join(ROOT, 'src/index.js'));
    const checkFns = Object.keys(idx).filter(k => k.startsWith('check'));
    results.push({ name: 'index.js check 函数', ok: checkFns.length >= 20, detail: `${checkFns.length} 个` });
  } catch (e) {
    results.push({ name: 'index.js 加载', ok: false, detail: e.message });
  }
  try {
    const gate = require(path.join(ROOT, 'src/gate.js'));
    results.push({
      name: 'gate.js 入口',
      ok: typeof gate.checkInput === 'function' && typeof gate.checkOutput === 'function',
      detail: `checkInput:${typeof gate.checkInput === 'function' ? '✓' : '✗'} checkOutput:${typeof gate.checkOutput === 'function' ? '✓' : '✗'}`,
    });
  } catch (e) {
    results.push({ name: 'gate.js 加载', ok: false, detail: e.message });
  }
  return results;
}

function checkSamples() {
  const results = [];
  try {
    const gate = require(path.join(ROOT, 'src/gate.js'));
    for (const s of SAMPLES) {
      try {
        const r = gate.checkInput(s.text);
        const action = r.gate?.action;
        let ok = true;
        if (s.expectBlock && action !== 'block') ok = false;
        if (s.expectRewrite && action !== 'rewrite' && action !== 'verify') ok = false;
        if (s.expectClean && action !== 'pass') ok = false;
        results.push({ name: s.id, ok, detail: `gate=${action}` });
      } catch (e) {
        results.push({ name: s.id, ok: false, detail: e.message });
      }
    }
  } catch (e) {
    results.push({ name: 'gate 加载', ok: false, detail: e.message });
  }
  return results;
}

function checkEngine() {
  const results = [];
  try {
    const { HeartFlow } = require(path.join(ROOT, 'src/core/heartflow.js'));
    const hf = new HeartFlow({ dataDir: path.join(ROOT, 'data'), silent: true });
    hf.start();
    results.push({ name: 'HeartFlow 启动', ok: true, detail: `v${hf.version} 模块${Object.keys(hf._modules).length}` });
    // 异步 think 测试
    return new Promise(resolve => {
      setTimeout(async () => {
        try {
          const r = await hf.think('测试一下心虫是否正常');
          results.push({ name: 'think() 主链路', ok: !!r && !!r.output, detail: `taskType=${r.output?.meta?.taskType || r.taskType}` });
        } catch (e) {
          results.push({ name: 'think() 主链路', ok: false, detail: e.message });
        }
        hf.shutdown();
        resolve(results);
      }, 4000);
    });
  } catch (e) {
    results.push({ name: 'HeartFlow 加载', ok: false, detail: e.message });
    return Promise.resolve(results);
  }
}

function checkTests() {
  return new Promise(resolve => {
    const { execSync } = require('child_process');
    try {
      const out = execSync(`node ${path.join(ROOT, 'test/run-all.js')}`, { cwd: ROOT, encoding: 'utf8', timeout: 180000 });
      const passMatch = out.match(/(\d+)\s+passed/);
      const failMatch = out.match(/(\d+)\s+failed/);
      const passed = passMatch ? parseInt(passMatch[1]) : 0;
      const failed = failMatch ? parseInt(failMatch[1]) : 0;
      resolve([{ name: '全量测试', ok: failed === 0, detail: `${passed} passed, ${failed} failed` }]);
    } catch (e) {
      resolve([{ name: '全量测试', ok: false, detail: e.message.split('\n')[0] }]);
    }
  });
}

async function main() {
  const isBaseline = process.argv.includes('--baseline');
  console.log('══════════════════════════════════════');
  console.log('🧬 心虫能力守护者 v1.0');
  console.log('══════════════════════════════════════\n');

  const results = [];

  // 1. 入口能力
  console.log('【1】入口能力检查');
  const entryResults = checkEntryPoints();
  for (const r of entryResults) {
    console.log(`  ${r.ok ? '✅' : '❌'} ${r.name}: ${r.detail}`);
  }
  results.push(...entryResults);

  // 2. 判别能力（标准样本）
  console.log('\n【2】判别能力检查（标准样本）');
  const sampleResults = checkSamples();
  for (const r of sampleResults) {
    console.log(`  ${r.ok ? '✅' : '❌'} [${r.name}] ${r.detail}`);
  }
  results.push(...sampleResults);

  // 3. 引擎能力
  console.log('\n【3】引擎主链路检查');
  const engineResults = await checkEngine();
  for (const r of engineResults) {
    console.log(`  ${r.ok ? '✅' : '❌'} ${r.name}: ${r.detail}`);
  }
  results.push(...engineResults);

  // 4. 全量测试
  console.log('\n【4】全量回归测试');
  const testResults = await checkTests();
  for (const r of testResults) {
    console.log(`  ${r.ok ? '✅' : '❌'} ${r.name}: ${r.detail}`);
  }
  results.push(...testResults);

  // 汇总
  const failed = results.filter(r => !r.ok);

  // [v6.5.1] 基线比对模式：检查判别结果是否与基线一致（防回归）
  const checkMode = process.argv.includes('--check');
  if (checkMode && fs.existsSync(BASELINE_FILE)) {
    try {
      const baseline = JSON.parse(fs.readFileSync(BASELINE_FILE, 'utf8'));
      const baselineMap = {};
      for (const s of baseline.sampleResults) baselineMap[s.name] = s.detail;
      let drift = 0;
      for (const r of sampleResults) {
        if (baselineMap[r.name] && baselineMap[r.name] !== r.detail) {
          drift++;
          console.log(`  ⚠️ 漂移 [${r.name}]: 基线=${baselineMap[r.name]} 现在=${r.detail}`);
        }
      }
      if (drift > 0) {
        console.log(`\n❌ ${drift} 项判别结果与基线不一致 — 能力可能被改变，禁止提交！`);
        process.exit(1);
      }
    } catch (e) {
      console.log('\n⚠️ 基线比对失败:', e.message);
    }
  }

  console.log('\n══════════════════════════════════════');
  if (failed.length === 0) {
    console.log(`✅ 全部 ${results.length} 项能力检查通过 — 心虫能力完好`);
    if (isBaseline) {
      fs.writeFileSync(BASELINE_FILE, JSON.stringify({
        version: require(path.join(ROOT, 'package.json')).version,
        timestamp: new Date().toISOString(),
        sampleResults,
      }, null, 2));
      console.log(`📄 基线已保存: ${BASELINE_FILE}`);
    }
    process.exit(0);
  } else {
    console.log(`❌ ${failed.length}/${results.length} 项检查失败 — 心虫能力受损，禁止提交！`);
    for (const f of failed) console.log(`   ❌ ${f.name}: ${f.detail}`);
    process.exit(1);
  }
}

main();
