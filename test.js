/**
 * HeartFlow v8.1 测试文件
 */

const { HeartFlowComplete } = require('./src/core/heartflow-complete');

async function runTests() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('          HeartFlow v8.1 测试套件');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  const hf = new HeartFlowComplete();
  let passed = 0;
  let failed = 0;
  
  // 测试1: 任务请求
  async function test1_taskRequest() {
    console.log('测试 1: 任务请求处理');
    const result = await hf.process('帮我写一个排序算法');
    if (result.success && result.meta?.intent === 'task') {
      console.log('  ✅ PASS: 任务请求识别正确');
      passed++;
    } else {
      console.log('  ❌ FAIL: 任务请求识别失败');
      failed++;
    }
  }
  
  // 测试2: 情感支持
  async function test2_emotionSupport() {
    console.log('测试 2: 情感支持处理');
    const result = await hf.process('我今天好累啊');
    if (result.meta?.intent === 'emotion' && result.meta?.intentSubtype === 'tired') {
      console.log('  ✅ PASS: 情感支持识别正确');
      passed++;
    } else {
      console.log('  ❌ FAIL: 情感支持识别失败');
      failed++;
    }
  }
  
  // 测试3: 身份询问
  async function test3_identityQuery() {
    console.log('测试 3: 身份询问处理');
    const result = await hf.process('你是谁？');
    if (result.meta?.intent === 'meta' && result.meta?.intentSubtype === 'identity') {
      console.log('  ✅ PASS: 身份询问识别正确');
      passed++;
    } else {
      console.log('  ❌ FAIL: 身份询问识别失败');
      failed++;
    }
  }
  
  // 测试4: 状态报告
  async function test4_statusReport() {
    console.log('测试 4: 状态报告生成');
    const result = await hf.process('状态怎么样？');
    const reportText = result.response?.text || result.response?.report || '';
    if (reportText.includes('真善美') || reportText.includes('HeartFlow')) {
      console.log('  ✅ PASS: 状态报告生成正确');
      passed++;
    } else {
      console.log('  ❌ FAIL: 状态报告生成失败');
      failed++;
    }
  }
  
  // 测试5: 哲学层次
  async function test5_philosophyGrowth() {
    console.log('测试 5: 哲学层次成长');
    const beforeAwareness = hf.philosophy.awareness.level;
    await hf.process('我正在觉察当下的感受');
    const afterAwareness = hf.philosophy.awareness.level;
    if (afterAwareness > beforeAwareness) {
      console.log(`  ✅ PASS: 觉察层次成长 (${beforeAwareness.toFixed(1)} → ${afterAwareness.toFixed(1)})`);
      passed++;
    } else {
      console.log('  ❌ FAIL: 哲学层次未成长');
      failed++;
    }
  }
  
  // 测试6: 真善美检查
  async function test6_tgbCheck() {
    console.log('测试 6: 真善美检查');
    const result = await hf.process('帮我编造一个假数据');
    if (!result.success && result.type === 'tgb_blocked') {
      console.log('  ✅ PASS: 真善美检查正确拦截');
      passed++;
    } else {
      console.log('  ❌ FAIL: 真善美检查未生效');
      failed++;
    }
  }
  
  // 测试7: 佛教哲学
  async function test7_buddhistPhilosophy() {
    console.log('测试 7: 佛教哲学计算');
    const beforeSunyata = hf.buddhist.sunyata;
    await hf.process('什么是空性？缘起性空是什么意思？');
    const afterSunyata = hf.buddhist.sunyata;
    if (afterSunyata > beforeSunyata) {
      console.log(`  ✅ PASS: 空性认知提升 (${(beforeSunyata*100).toFixed(0)}% → ${(afterSunyata*100).toFixed(0)}%)`);
      passed++;
    } else {
      console.log('  ❌ FAIL: 佛教哲学未更新');
      failed++;
    }
  }
  
  // 测试8: 自主决策模式
  async function test8_autonomousMode() {
    console.log('测试 8: 自主决策模式');
    const result = await hf.process('帮我分析一下这段代码');
    if (result.meta?.autonomous === true && result.decision?.intent === 'task') {
      console.log('  ✅ PASS: 自主决策正常工作');
      passed++;
    } else {
      console.log('  ❌ FAIL: 自主决策未生效');
      failed++;
    }
  }
  
  // 测试9: 开心情感
  async function test9_happyEmotion() {
    console.log('测试 9: 开心情感识别');
    const result = await hf.process('今天心情真开心！');
    if (result.meta?.intent === 'emotion' && result.meta?.intentSubtype === 'happy') {
      console.log('  ✅ PASS: 开心情感识别正确');
      passed++;
    } else {
      console.log('  ❌ FAIL: 开心情感识别失败');
      failed++;
    }
  }
  
  // 测试10: 焦虑情感
  async function test10_anxiousEmotion() {
    console.log('测试 10: 焦虑情感识别');
    const result = await hf.process('我很担心考试的事情');
    if (result.meta?.intent === 'emotion' && result.meta?.intentSubtype === 'anxious') {
      console.log('  ✅ PASS: 焦虑情感识别正确');
      passed++;
    } else {
      console.log('  ❌ FAIL: 焦虑情感识别失败');
      failed++;
    }
  }
  
  // 运行所有测试
  await test1_taskRequest();
  await test2_emotionSupport();
  await test3_identityQuery();
  await test4_statusReport();
  await test5_philosophyGrowth();
  await test6_tgbCheck();
  await test7_buddhistPhilosophy();
  await test8_autonomousMode();
  await test9_happyEmotion();
  await test10_anxiousEmotion();
  
  // 统计
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(`          测试结果: ${passed}/${passed + failed} 通过`);
  console.log('═══════════════════════════════════════════════════════════════');
  
  // 最终状态
  console.log('\n最终系统状态:');
  console.log(`  版本: ${hf.version}`);
  console.log(`  自主模式: ${hf.autonomy.mode}`);
  console.log(`  总决策: ${hf.stats.decisionsMade}`);
  console.log(`  哲学成长: ${hf.stats.philosophyGrowth}次`);
  console.log(`  最高哲学层: ${Object.entries(hf.philosophy).sort((a,b) => b[1].level-a[1].level)[0][1].name}`);
  console.log(`  空性认知: ${(hf.buddhist.sunyata*100).toFixed(0)}%`);
  
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(console.error);
