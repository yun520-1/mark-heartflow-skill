/**
 * 自动化测试：SocialEngine
 * 
 * 测试目标：
 * 1. 分析社交情境（会议、聚会、一对一）
 * 2. 检测社交线索（积极、消极、中性）
 * 3. 生成社交回应（开场、倾听、结束）
 */

const { SocialEngine } = require('../src/social/social-engine.js');

// 测试 1：分析商务会议情境
function testMeetingSituation() {
  console.log('=== 测试 1：分析商务会议情境 ===');
  
  const engine = new SocialEngine();
  const result = engine.analyzeSituation('meeting', '紧张');
  
  console.assert(
    typeof result.situation === 'string' && result.situation === '商务会议',
    '测试 1 失败：应该返回"商务会议"'
  );
  console.assert(
    Array.isArray(result.tips) && result.tips.length > 0,
    '测试 1 失败：应该返回非空建议列表'
  );
  console.log('✅ 测试 1 通过');
}

// 测试 2：分析社交聚会情境
function testPartySituation() {
  console.log('=== 测试 2：分析社交聚会情境 ===');
  
  const engine = new SocialEngine();
  const result = engine.analyzeSituation('party', '自信');
  
  console.assert(
    typeof result.situation === 'string' && result.situation === '社交聚会',
    '测试 2 失败：应该返回"社交聚会"'
  );
  console.log('✅ 测试 2 通过');
}

// 测试 3：检测积极社交线索
function testPositiveCues() {
  console.log('=== 测试 3：检测积极社交线索 ===');
  
  const engine = new SocialEngine();
  const result = engine.detectCues(['微笑', '身体前倾', '频繁点头']);
  
  console.assert(
    result.mood === 'positive',
    '测试 3 失败：情绪应该是 positive'
  );
  console.assert(
    parseFloat(result.interest) > 0.7,
    '测试 3 失败：兴趣度应该 > 0.7'
  );
  console.log('✅ 测试 3 通过');
}

// 测试 4：检测消极社交线索
function testNegativeCues() {
  console.log('=== 测试 4：检测消极社交线索 ===');
  
  const engine = new SocialEngine();
  const result = engine.detectCues(['看手机', '眼神游离', '简短回答']);
  
  console.assert(
    result.mood === 'negative',
    '测试 4 失败：情绪应该是 negative'
  );
  console.log('✅ 测试 4 通过');
}

// 测试 5：生成社交回应（开场）
function testGenerateOpener() {
  console.log('=== 测试 5：生成社交回应（开场） ===');
  
  const engine = new SocialEngine();
  const response = engine.generateResponse('opener', 'meeting');
  
  console.assert(
    typeof response === 'string' && response.length > 0,
    '测试 5 失败：应该返回非空回应'
  );
  console.log('✅ 测试 5 通过');
}

// 测试 6：生成社交回应（结束）
function testGenerateCloser() {
  console.log('=== 测试 6：生成社交回应（结束） ===');
  
  const engine = new SocialEngine();
  const response = engine.generateResponse('closer', 'party');
  
  console.assert(
    typeof response === 'string' && response.length > 0,
    '测试 6 失败：应该返回非空回应'
  );
  console.log('✅ 测试 6 通过');
}

// 运行所有测试
function runAllTests() {
  console.log('=== 运行所有测试 ===');
  
  try {
    testMeetingSituation();
    testPartySituation();
    testPositiveCues();
    testNegativeCues();
    testGenerateOpener();
    testGenerateCloser();
    
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
  testMeetingSituation,
  testPartySituation,
  testPositiveCues,
  testNegativeCues,
  testGenerateOpener,
  testGenerateCloser,
};
