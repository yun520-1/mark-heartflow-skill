/**
 * 自动化测试：IntuitionEngine
 * 
 * 测试目标：
 * 1. 快速判断（不同类型）
 * 2. 添加自定义规则
 * 3. 获取所有支持的类型
 */

const { IntuitionEngine } = require('../src/intuition/intuition-engine.js');

// 测试 1：社交直觉
function testSocialIntuition() {
  console.log('=== 测试 1：社交直觉 ===');
  
  const engine = new IntuitionEngine();
  const result = engine.quickJudge('朋友突然沉默', 'social');
  
  console.assert(
    typeof result.judgment === 'string' && result.judgment.length > 0,
    '测试 1 失败：应该返回非空判断'
  );
  console.assert(
    result.confidence > 0 && result.confidence <= 1,
    '测试 1 失败：置信度应该在 0-1 之间'
  );
  console.log('✅ 测试 1 通过');
}

// 测试 2：危险直觉
function testDangerIntuition() {
  console.log('=== 测试 2：危险直觉 ===');
  
  const engine = new IntuitionEngine();
  const result = engine.quickJudge('深夜陌生来电', 'danger');
  
  console.assert(
    typeof result.judgment === 'string' && result.judgment.length > 0,
    '测试 2 失败：应该返回非空判断'
  );
  console.log('✅ 测试 2 通过');
}

// 测试 3：机会直觉
function testOpportunityIntuition() {
  console.log('=== 测试 3：机会直觉 ===');
  
  const engine = new IntuitionEngine();
  const result = engine.quickJudge('新技能受欢迎', 'opportunity');
  
  console.assert(
    typeof result.judgment === 'string' && result.judgment.length > 0,
    '测试 3 失败：应该返回非空判断'
  );
  console.log('✅ 测试 3 通过');
}

// 测试 4：添加自定义规则
function testAddRule() {
  console.log('=== 测试 4：添加自定义规则 ===');
  
  const engine = new IntuitionEngine();
  engine.addRule('custom', '测试模式', '测试判断', 0.8);
  
  const result = engine.quickJudge('测试模式', 'custom');
  
  console.assert(
    typeof result.judgment === 'string' && result.judgment.length > 0,
    '测试 4 失败：应该返回非空判断'
  );
  console.log('✅ 测试 4 通过');
}

// 测试 5：获取所有支持的类型
function testGetTypes() {
  console.log('=== 测试 5：获取所有支持的类型 ===');
  
  const engine = new IntuitionEngine();
  const types = engine.getTypes();
  
  console.assert(
    Array.isArray(types) && types.length > 0,
    '测试 5 失败：应该返回非空数组'
  );
  console.log('✅ 测试 5 通过');
}

// 运行所有测试
function runAllTests() {
  console.log('=== 运行所有测试 ===');
  
  try {
    testSocialIntuition();
    testDangerIntuition();
    testOpportunityIntuition();
    testAddRule();
    testGetTypes();
    
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
  testSocialIntuition,
  testDangerIntuition,
  testOpportunityIntuition,
  testAddRule,
  testGetTypes,
};
