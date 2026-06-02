#!/usr/bin/env node
/**
 * HeartFlow v2.0.19 集成测试
 * 覆盖本次 4 Phase 改动：
 *   - truth isLying 检测 + thought-chain await 修通
 *   - behavior 系统接入
 *   - persistence 系统接入
 *   - triality 能力暴露
 *
 * 运行: node tests/v2_0_19.test.js
 */
const { HeartFlow } = require('../src/core/heartflow.js');

let passed = 0, failed = 0;

function test(name, fn) {
  return Promise.resolve()
    .then(() => fn())
    .then(result => {
      if (result === false || result === undefined) {
        console.log('FAIL:', name, '→ result:', result);
        failed++;
      } else {
        console.log('PASS:', name);
        passed++;
      }
    })
    .catch(e => {
      console.log('ERROR:', name, '→', e.message.slice(0, 120));
      failed++;
    });
}

(async () => {
  const hf = new HeartFlow({ quiet: true });
  await hf.start();

  console.log('\n=== HeartFlow v2.0.19 集成测试 ===\n');

  // === Phase 4: truth 修通 ===
  await test('truth.isLying: 绝对化声明应被检测', async () => {
    const r = await hf.dispatch('truth.checkStatement', '这个方案一定是好的');
    return r && r.isLying === true;
  });
  await test('truth.isLying: 普通陈述不应误报', async () => {
    const r = await hf.dispatch('truth.checkStatement', '研究表明人口增长5%');
    return r && r.isLying === false;
  });
  await test('truth.isLying: "100%确定" 应被检测', async () => {
    const r = await hf.dispatch('truth.checkStatement', '我100%确定没问题');
    return r && r.isLying === true;
  });
  await test('truth schema: 包含 checked+isLying+confidence', async () => {
    const r = await hf.dispatch('truth.checkStatement', '今天天气不错');
    return r && 'checked' in r && 'isLying' in r && 'confidence' in r;
  });

  // === Phase 1: behavior 系统 ===
  await test('behavior.createGoal: 创建目标', () => {
    const r = hf.dispatch('behavior.createGoal', { name: 'v2.0.19测试目标', description: '测试', targetDays: 7 });
    return r && r.id && r.id.startsWith('goal-');
  });
  await test('behavior.record: 记录成功', () => {
    const goals = hf.dispatch('behavior.getAllGoals');
    const goal = goals[goals.length - 1];
    const r = hf.dispatch('behavior.record', goal.id, { type: 'success', note: 'test' });
    return r && r.ok === true && r.record && r.record.type === 'success' && r.streak >= 1;
  });
  await test('behavior.getProgress: 拿到 progress 字符串', () => {
    const goals = hf.dispatch('behavior.getAllGoals');
    const r = hf.dispatch('behavior.getProgress', goals[goals.length - 1].id);
    return r && typeof r.progress === 'string' && r.progress.includes('/');
  });
  await test('behavior.detectWeeklyPattern: 返回周几+次数', () => {
    const goals = hf.dispatch('behavior.getAllGoals');
    const records = goals[goals.length - 1].records;
    const r = hf.dispatch('behavior.detectWeeklyPattern', records);
    return r && r.day && typeof r.count === 'number';
  });
  await test('behavior.detectRelapseRisk: 返回 risk 等级', () => {
    const goals = hf.dispatch('behavior.getAllGoals');
    const r = hf.dispatch('behavior.detectRelapseRisk', goals[goals.length - 1]);
    return r && ['low', 'medium', 'high'].includes(r.risk);
  });
  await test('behavior.getReport: 综合报告', () => {
    const goals = hf.dispatch('behavior.getAllGoals');
    const r = hf.dispatch('behavior.getReport', goals[goals.length - 1].id);
    return r && r.weekly && r.risk;
  });
  await test('behavior.getStats: 统计信息', () => {
    const r = hf.dispatch('behavior.getStats');
    return r && r.goals >= 1 && r.totalRecords >= 1;
  });

  // === Phase 2: persistence 系统 ===
  await test('persistence.getStats: 返回 WAL 配置', () => {
    const r = hf.dispatch('persistence.getStats');
    return r && r.walDir && r.opTypes && r.opTypes.WRITE === 'write';
  });
  await test('persistence.safeWrite: WAL+原子写 成功', async () => {
    const path = require('path');
    const fs = require('fs');
    const testFile = path.join(hf.rootPath, 'memory', 'test-v2019.txt');
    const r = await hf.dispatch('persistence.safeWrite', testFile, 'v2.0.19 test\n');
    return r && r.ok === true && r.seq > 0 && fs.readFileSync(testFile, 'utf8') === 'v2.0.19 test\n';
  });
  await test('persistence.atomicWrite: 直接原子写', async () => {
    const path = require('path');
    const fs = require('fs');
    const testFile = path.join(hf.rootPath, 'memory', 'test-atomic.txt');
    await hf.dispatch('persistence.atomicWrite', testFile, 'atomic');
    return fs.readFileSync(testFile, 'utf8') === 'atomic';
  });
  await test('persistence.recover: 扫描待恢复事务', async () => {
    const r = await hf.dispatch('persistence.recover');
    return Array.isArray(r);
  });

  // === Phase 3: triality 暴露 ===
  await test('triality.getStats: 基础统计', () => {
    const r = hf.dispatch('triality.getStats');
    return r && typeof r.totalMemories === 'number' && r.vectorDimension === 384;
  });
  await test('triality.getLayerStats: 三层统计', () => {
    const r = hf.dispatch('triality.getLayerStats');
    return r && 'working' in r && 'episodic' in r && 'semantic' in r;
  });
  await test('triality.getMemoryHealth: 健康度', () => {
    const r = hf.dispatch('triality.getMemoryHealth');
    return r && typeof r.averageRetention === 'number';
  });
  await test('triality.searchByKeywords: 返回数组', () => {
    const r = hf.dispatch('triality.searchByKeywords', '心虫', 5);
    return Array.isArray(r);
  });

  // === Phase 5: dream + transmission 暴露 ===
  await test('dream.getStats: 梦统计', () => {
    const r = hf.dispatch('dream.getDreamStats');
    return r && typeof r === 'object';
  });
  await test('dream.getCacheStats: 梦缓存统计', () => {
    const r = hf.dispatch('dream.getCacheStats');
    return r && typeof r === 'object';
  });
  await test('transmission.getStats: 传递引擎统计', () => {
    const r = hf.dispatch('transmission.getStats');
    return r && typeof r === 'object';
  });
  await test('transmission.getTransmissionLog: 传递日志', () => {
    const r = hf.dispatch('transmission.getTransmissionLog');
    return Array.isArray(r);
  });
  await test('transmission.getDistilledLessons: 蒸馏教训', () => {
    const r = hf.dispatch('transmission.getDistilledLessons');
    return Array.isArray(r);
  });
  // === Phase 6: verify 完整能力 ===
  await test('verify.verify: 条件句应 pass', () => {
    const r = hf.dispatch('verify.verify', '如果A=B, 那么B=A', 'B=A');
    return r && r.passed === true;
  });
  await test('verify.getStats: 统计', () => {
    const r = hf.dispatch('verify.getStats');
    return r && typeof r.totalVerified === 'number' && typeof r.passes === 'number';
  });
  // === Phase 7: v2.0.20 安全审计修复 ===
  await test('code-verifier: bash 走 shell 验证器（不是 JS）', () => {
    const cv = require('../src/core/code-verifier.js').codeVerifier;
    const sh = cv.verifyShContent('#!/bin/bash\necho "hi"');
    const js = cv.verifyJSContent('#!/bin/bash\necho "hi"');
    return sh.ok === true && js.ok === false;  // JS 验证器会报错（无 {} 平衡）
  });
  await test('blind-spot-breaker: USER_CLAIMED 而非 CONFIRMADO', () => {
    const BSB = require('../src/core/blind-spot-breaker.js');
    const c = new BSB(hf.rootPath);
    const r = c.process('用户说了一句事实', { facts: ['用户说的话'] });
    // assertions 在 r.confidence.assertions（不是 r.deconstruction.assertions）
    const arr = r && r.confidence && r.confidence.assertions;
    return Array.isArray(arr) && arr[0] && arr[0].tag === 'USER_CLAIMED';
  });

  // === 集成度：模块加载 ===
  await test('_initErrors 不应存在（所有 try 成功）', () => {
    return hf._initErrors.length === 0;
  });
  await test('66+ subsystems 加载', () => {
    return Object.keys(hf._modules).length >= 65;
  });
  await test('healthCheck 报告所有子系统', async () => {
    const h = await hf.healthCheck();
    return h.subsystems && h.subsystems.loaded >= 65 && !h.initErrors;
  });

  console.log(`\n=== 结果: ${passed}/${passed + failed} 通过 ===\n`);

  // 清理测试文件
  const fs = require('fs');
  const path = require('path');
  ['test-v2019.txt', 'test-atomic.txt'].forEach(f => {
    try { fs.unlinkSync(path.join(hf.rootPath, 'memory', f)); } catch {}
  });

  hf.stop();
  process.exit(failed > 0 ? 1 : 0);
})();
