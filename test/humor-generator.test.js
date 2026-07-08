/**
 * 自动化测试：HumorGenerator
 * 
 * 测试目标：
 * 1. 生成幽默回应（不同类型）
 * 2. 添加自定义笑话
 * 3. 获取所有幽默类型
 */

const { HumorGenerator } = require('../src/humor/humor-generator.js');

// 测试 1：生成笑话
function testJoke() {
  console.log('=== 测试 1：笑话 ===');
  
  const generator = new HumorGenerator();
  const result = generator.generate('讲个笑话', 'joke');
  
  console.assert(
    typeof result === 'string' && result.length > 0,
    '测试 1 失败：应该返回非空字符串'
  );
  console.log('✅ 测试 1 通过');
}

// 测试 2：生成双关语
function testPun() {
  console.log('=== 测试 2：双关语 ===');
  
  const generator = new HumorGenerator();
  const result = generator.generate('说个双关语', 'pun');
  
  console.assert(
    typeof result === 'string' && result.length > 0,
    '测试 2 失败：应该返回非空字符串'
  );
  console.log('✅ 测试 2 通过');
}

// 测试 3：生成轻松评论
function testLightComment() {
  console.log('=== 测试 3：轻松评论 ===');
  
  const generator = new HumorGenerator();
  const result = generator.generate('给点轻松评论', 'light_comment');
  
  console.assert(
    typeof result === 'string' && result.length > 0,
    '测试 3 失败：应该返回非空字符串'
  );
  console.log('✅ 测试 3 通过');
}

// 测试 4：添加自定义笑话
function testAddJoke() {
  console.log('=== 测试 4：添加自定义笑话 ===');
  
  const generator = new HumorGenerator();
  const newJoke = '这是一个自定义笑话。';
  generator.addJoke('custom', newJoke);
  
  const result = generator.generate('测试提示', 'custom');
  
  console.assert(
    typeof result === 'string' && result.length > 0,
    '测试 4 失败：应该返回非空字符串'
  );
  console.log('✅ 测试 4 通过');
}

// 测试 5：获取所有幽默类型
function testGetTypes() {
  console.log('=== 测试 5：获取所有幽默类型 ===');
  
  const generator = new HumorGenerator();
  const types = generator.getTypes();
  
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
    testJoke();
    testPun();
    testLightComment();
    testAddJoke();
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
  testJoke,
  testPun,
  testLightComment,
  testAddJoke,
  testGetTypes,
};
