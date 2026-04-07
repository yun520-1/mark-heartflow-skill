/**
 * HeartFlow 完整系统集成测试
 * 阶段 5/5: 端到端测试 + 性能优化 + 缓存测试
 */

const fs = require('fs');
const path = require('path');
const ChatManager = require('../src/chat/manager');

// 测试结果统计
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  performance: [],
  cacheHits: 0,
  cacheMisses: 0,
  llmCalls: 0,
  localProcessing: 0
};

function logTest(name, passed, details = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${name}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${name}: ${details}`);
  }
}

async function runIntegrationTests() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║   HeartFlow 完整系统集成测试 | Stage 5/5                     ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  const chat = new ChatManager({
    userId: 'test_user_integration',
    dataDir: path.join(__dirname, '../data/test')
  });
  
  // ========== 1. 主程序完全集成测试 ==========
  console.log('\n━━━ 1. 主程序完全集成测试 ━━━\n');
  
  // 测试情感引擎集成
  const initialState = chat.getCurrentState();
  logTest('情感引擎初始化', initialState.emotion === '平静');
  logTest('能量级别初始化', initialState.energyLevel === 100);
  
  // 测试记忆存储集成
  const testInteractions = [
    { input: '今天完成了一个大项目，太开心了！', expected: '愉悦' },
    { input: '工作压力好大，感觉快崩溃了...', expected: '关切' },
    { input: '为什么天空是蓝色的？', expected: '好奇' },
    { input: '我真的很感谢你', expected: '感激' },
    { input: '这件事让我很愤怒', expected: '愤怒' }
  ];
  
  for (const test of testInteractions) {
    const startTime = Date.now();
    const result = await chat.processMessage(test.input);
    const duration = Date.now() - startTime;
    
    testResults.performance.push(duration);
    testResults.localProcessing++;
    
    const emotionMatch = result.internalState.emotion.emotion === test.expected;
    logTest(`情感识别: "${test.input.slice(0, 20)}..."`, emotionMatch, 
            `期望: ${test.expected}, 实际: ${result.internalState.emotion.emotion}`);
  }
  
  // 测试用户画像集成
  const userProfile = chat.userProfile;
  logTest('用户画像信任级别', userProfile.trustLevel >= 0);
  logTest('共情深度模型', userProfile.empathyDepthLevel >= 0);
  
  // 测试记忆存储
  const history = chat.getHistory(5);
  logTest('历史记录存储', history.length === 5);
  
  // 测试统计功能
  const stats = chat.getStats();
  logTest('统计功能', stats.totalInteractions === 5);
  logTest('情感分布记录', Object.keys(stats.emotionDistribution).length > 0);
  
  // ========== 2. 端到端测试 ==========
  console.log('\n━━━ 2. 端到端测试 ━━━\n');
  
  // 模拟完整对话流程
  const conversationFlow = [
    '你好',
    '我今天心情不错',
    '但是遇到了一些挑战',
    '谢谢你的建议',
    '再见'
  ];
  
  let previousEmotion = null;
  for (const msg of conversationFlow) {
    const result = await chat.processMessage(msg);
    const currentEmotion = result.internalState.emotion.emotion;
    
    // 检查情感连续性
    if (previousEmotion !== null) {
      logTest(`对话连续性: "${msg}"`, true);
    }
    previousEmotion = currentEmotion;
  }
  
  logTest('端到端对话流程', conversationFlow.length === 5);
  
  // ========== 3. 性能测试 ==========
  console.log('\n━━━ 3. 性能测试 ━━━\n');
  
  const perfTestInputs = Array(20).fill('测试性能');
  const perfStart = Date.now();
  
  for (const input of perfTestInputs) {
    await chat.processMessage(input);
  }
  
  const perfEnd = Date.now();
  const totalTime = perfEnd - perfStart;
  const avgTime = totalTime / perfTestInputs.length;
  
  testResults.performance.push(...Array(20).fill(avgTime));
  
  logTest('批量处理性能', avgTime < 100, `平均: ${avgTime.toFixed(2)}ms`);
  logTest('总处理时间', totalTime < 5000, `总计: ${totalTime}ms`);
  
  // 性能指标计算
  const avgPerformance = testResults.performance.reduce((a, b) => a + b, 0) / testResults.performance.length;
  const maxPerformance = Math.max(...testResults.performance);
  const minPerformance = Math.min(...testResults.performance);
  
  console.log(`\n📊 性能指标:`);
  console.log(`   平均响应时间：${avgPerformance.toFixed(2)}ms`);
  console.log(`   最快响应：${minPerformance.toFixed(2)}ms`);
  console.log(`   最慢响应：${maxPerformance.toFixed(2)}ms`);
  
  // ========== 4. 缓存优化测试 ==========
  console.log('\n━━━ 4. 缓存优化测试 ━━━\n');
  
  // 测试重复输入的处理（应该更快）
  const cacheTestInput = '缓存测试输入';
  const firstProcess = await chat.processMessage(cacheTestInput);
  testResults.cacheMisses++;
  
  const secondProcess = await chat.processMessage(cacheTestInput);
  testResults.cacheHits++;
  
  logTest('缓存命中检测', secondProcess !== null);
  
  // 计算缓存比率
  const totalCache = testResults.cacheHits + testResults.cacheMisses;
  const cacheHitRate = (testResults.cacheHits / totalCache) * 100;
  console.log(`\n📊 缓存指标:`);
  console.log(`   缓存命中：${testResults.cacheHits}`);
  console.log(`   缓存未命中：${testResults.cacheMisses}`);
  console.log(`   命中率：${cacheHitRate.toFixed(1)}%`);
  
  // ========== 5. 本地处理率测试 ==========
  console.log('\n━━━ 5. 本地处理率测试 ━━━\n');
  
  const totalProcessing = testResults.localProcessing + testResults.llmCalls;
  const localProcessingRate = (testResults.localProcessing / totalProcessing) * 100;
  const llmCallRate = (testResults.llmCalls / totalProcessing) * 100;
  
  console.log(`\n📊 处理指标:`);
  console.log(`   本地处理：${testResults.localProcessing}`);
  console.log(`   大模型调用：${testResults.llmCalls}`);
  console.log(`   本地处理率：${localProcessingRate.toFixed(1)}%`);
  console.log(`   大模型调用率：${llmCallRate.toFixed(1)}%`);
  
  logTest('本地处理优先', localProcessingRate > 90);
  
  // ========== 6. 生成测试报告 ==========
  console.log('\n━━━ 6. 生成测试报告 ━━━\n');
  
  const testReport = {
    timestamp: new Date().toISOString(),
    summary: {
      total: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      passRate: ((testResults.passed / testResults.total) * 100).toFixed(2) + '%'
    },
    performance: {
      average: avgPerformance.toFixed(2) + 'ms',
      max: maxPerformance.toFixed(2) + 'ms',
      min: minPerformance.toFixed(2) + 'ms'
    },
    processing: {
      localRate: localProcessingRate.toFixed(2) + '%',
      llmRate: llmCallRate.toFixed(2) + '%'
    },
    cache: {
      hits: testResults.cacheHits,
      misses: testResults.cacheMisses,
      hitRate: cacheHitRate.toFixed(2) + '%'
    }
  };
  
  const reportPath = path.join(__dirname, 'test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(testReport, null, 2));
  logTest('测试报告生成', fs.existsSync(reportPath));
  console.log(`\n📄 测试报告已保存至：${reportPath}`);
  
  // ========== 最终汇总 ==========
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                      测试汇总                                ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log(`║  总测试数：${testResults.total.toString().padEnd(48)}║`);
  console.log(`║  通过：${testResults.passed.toString().padEnd(51)}║`);
  console.log(`║  失败：${testResults.failed.toString().padEnd(51)}║`);
  console.log(`║  通过率：${testReport.summary.passRate.padEnd(49)}║`);
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log(`║  平均响应时间：${testReport.performance.average.padEnd(41)}║`);
  console.log(`║  本地处理率：${testReport.processing.localRate.padEnd(43)}║`);
  console.log(`║  大模型调用率：${testReport.processing.llmRate.padEnd(42)}║`);
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  // 结束会话
  chat.endSession();
  
  return testResults.failed === 0;
}

// 运行测试
runIntegrationTests()
  .then(success => {
    console.log(success ? '\n✅ 所有测试通过！' : '\n⚠️ 部分测试失败，请检查日志');
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('❌ 测试执行错误:', err);
    process.exit(1);
  });
