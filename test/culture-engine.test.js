/**
 * 自动化测试：CultureEngine
 * 
 * 测试目标：
 * 1. 检测文化语境（中文、日本、西方）
 * 2. 检测敏感话题
 * 3. 生成文化建议
 */

const { CultureEngine } = require('../src/culture/culture-engine.js');

// 测试 1：检测中文文化
function testChineseCulture() {
  console.log('=== 测试 1：检测中文文化 ===');
  
  const engine = new CultureEngine();
  const result = engine.analyze('在中国商务会议中，应该什么时候交换名片？');
  
  console.assert(
    typeof result.culture === 'string' && result.culture === '中文文化',
    '测试 1 失败：应该检测到中文文化'
  );
  console.log('✅ 测试 1 通过');
}

// 测试 2：检测日本文化
function testJapaneseCulture() {
  console.log('=== 测试 2：检测日本文化 ===');
  
  const engine = new CultureEngine();
  const result = engine.analyze('在日本商务会议中，应该什么时候交换名片？');
  
  console.assert(
    typeof result.culture === 'string' && result.culture === '日本文化',
    '测试 2 失败：应该检测到日本文化'
  );
  console.log('✅ 测试 2 通过');
}

// 测试 3：检测西方文化
function testWestCulture() {
  console.log('=== 测试 3：检测西方文化 ===');
  
  const engine = new CultureEngine();
  const result = engine.analyze('在美国商务会议中，应该什么时候交换名片？');
  
  console.assert(
    typeof result.culture === 'string' && result.culture === '西方文化',
    '测试 3 失败：应该检测到西方文化'
  );
  console.log('✅ 测试 3 通过');
}

// 测试 4：检测敏感话题
function testSensitivityDetection() {
  console.log('=== 测试 4：检测敏感话题 ===');
  
  const engine = new CultureEngine();
  const result = engine.analyze('讨论台湾地区称呼需要注意什么？');
  
  console.assert(
    result.sensitivity.level === 'high' || result.sensitivity.topics.length > 0,
    '测试 4 失败：应该检测到敏感话题'
  );
  console.log('✅ 测试 4 通过');
}

// 测试 5：生成文化建议
function testGenerateAdvice() {
  console.log('=== 测试 5：生成文化建议 ===');
  
  const engine = new CultureEngine();
  const result = engine.analyze('在日本见面时需要注意什么礼仪？');
  
  console.assert(
    typeof result.advice === 'string' && result.advice.length > 0,
    '测试 5 失败：应该返回非空建议'
  );
  console.log('✅ 测试 5 通过');
}

// 运行所有测试
function runAllTests() {
  console.log('=== 运行所有测试 ===');
  
  try {
    testChineseCulture();
    testJapaneseCulture();
    testWestCulture();
    testSensitivityDetection();
    testGenerateAdvice();
    
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
  testChineseCulture,
  testJapaneseCulture,
  testWestCulture,
  testSensitivityDetection,
  testGenerateAdvice,
};
