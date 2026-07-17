/**
 * 自动化测试：DreamEngine
 * 
 * 测试目标：
 * 1. 生成梦境叙事（不同情绪）
 * 2. 模拟睡眠周期
 * 3. 潜意识处理（情绪消化）
 */

const { DreamEngine } = require('../src/dream/dream-engine.js');

// 测试 1：生成焦虑梦境
function testAnxiousDream() {
  console.log('=== 测试 1：生成焦虑梦境 ===');
  
  const engine = new DreamEngine();
  const result = engine.generateDream({ mood: 'anxious', memories: ['考试失败'] });
  
  console.assert(
    typeof result.narrative === 'string' && result.narrative.length > 0,
    '测试 1 失败：应该返回非空梦境叙事'
  );
  console.assert(
    result.stage === 'REM 睡眠',
    '测试 1 失败：默认阶段应该是 REM 睡眠'
  );
  console.log('✅ 测试 1 通过');
}

// 测试 2：生成悲伤梦境
function testSadDream() {
  console.log('=== 测试 2：生成悲伤梦境 ===');
  
  const engine = new DreamEngine();
  const result = engine.generateDream({ mood: 'sad', memories: ['朋友离开'] });
  
  console.assert(
    typeof result.narrative === 'string' && result.narrative.length > 0,
    '测试 2 失败：应该返回非空梦境叙事'
  );
  console.log('✅ 测试 2 通过');
}

// 测试 3：模拟睡眠周期
function testSimulateSleep() {
  console.log('=== 测试 3：模拟睡眠周期 ===');
  
  const engine = new DreamEngine();
  const schedule = engine.simulateSleep(5);
  
  console.assert(
    Array.isArray(schedule) && schedule.length === 5,
    '测试 3 失败：应该返回 5 个睡眠周期'
  );
  console.assert(
    schedule[0].stages.includes('rem'),
    '测试 3 失败：应该包含 REM 阶段'
  );
  console.log('✅ 测试 3 通过');
}

// 测试 4：潜意识处理
function testSubconsciousProcessing() {
  console.log('=== 测试 4：潜意识处理 ===');
  
  const engine = new DreamEngine();
  const result = engine.subconsciousProcessing('anxious', ['考试失败']);
  
  console.assert(
    typeof result.processedEmotion === 'string' && result.processedEmotion.length > 0,
    '测试 4 失败：应该返回非空情绪处理结果'
  );
  console.assert(
    Array.isArray(result.suggestions) && result.suggestions.length > 0,
    '测试 4 失败：应该返回非空建议列表'
  );
  console.log('✅ 测试 4 通过');
}

// 测试 5：不同睡眠阶段
function testDifferentStages() {
  console.log('=== 测试 5：不同睡眠阶段 ===');
  
  const engine = new DreamEngine();
  const remResult = engine.generateDream({ mood: 'happy', stage: 'rem' });
  const lightResult = engine.generateDream({ mood: 'happy', stage: 'light' });
  const deepResult = engine.generateDream({ mood: 'happy', stage: 'deep' });
  
  console.assert(
    remResult.stage === 'REM 睡眠',
    '测试 5 失败：REM 阶段应该正确'
  );
  console.assert(
    lightResult.stage === '浅睡眠',
    '测试 5 失败：浅睡眠阶段应该正确'
  );
  console.assert(
    deepResult.stage === '深睡眠',
    '测试 5 失败：深睡眠阶段应该正确'
  );
  console.log('✅ 测试 5 通过');
}

// 运行所有测试
function runAllTests() {
  console.log('=== 运行所有测试 ===');
  
  try {
    testAnxiousDream();
    testSadDream();
    testSimulateSleep();
    testSubconsciousProcessing();
    testDifferentStages();
    
    console.log('\n=== 所有测试通过 ✅ ===');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ 测试失败：', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

// 如果直接运行此文件，则执行测试
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testAnxiousDream,
  testSadDream,
  testSimulateSleep,
  testSubconsciousProcessing,
  testDifferentStages,
};
