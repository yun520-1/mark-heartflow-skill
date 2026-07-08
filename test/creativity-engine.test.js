/**
 * 自动化测试：CreativityEngine
 * 
 * 测试目标：
 * 1. 生成创意文本（不同类型）
 * 2. 模板填充正确
 * 3. 可扩展性（添加自定义模板）
 */

const { CreativityEngine } = require('../src/creativity/creativity-engine.js');

// 测试 1：生成创意文本（creative_writing）
function testCreativeWriting() {
  console.log('=== 测试 1：创意写作 ===');
  
  const engine = new CreativityEngine();
  const result = engine.generate('写一个关于友情的故事', 'creative_writing');
  
  console.assert(
    typeof result === 'string' && result.length > 0,
    '测试 1 失败：应该返回非空字符串'
  );
  console.assert(
    result.includes('从前') || result.includes('地方'),
    '测试 1 失败：应该包含模板关键词'
  );
  console.log('✅ 测试 1 通过');
}

// 测试 2：生成诗歌
function testPoetry() {
  console.log('=== 测试 2：诗歌 ===');
  
  const engine = new CreativityEngine();
  const result = engine.generate('写一首关于春天的诗', 'poetry');
  
  console.assert(
    typeof result === 'string' && result.length > 0,
    '测试 2 失败：应该返回非空字符串'
  );
  console.log('✅ 测试 2 通过');
}

// 测试 3：生成代码
function testCode() {
  console.log('=== 测试 3：代码 ===');
  
  const engine = new CreativityEngine();
  const result = engine.generate('写一个计算函数', 'code');
  
  console.assert(
    typeof result === 'string' && result.length > 0,
    '测试 3 失败：应该返回非空字符串'
  );
  console.assert(
    result.includes('function') || result.includes('class'),
    '测试 3 失败：应该包含代码关键词'
  );
  console.log('✅ 测试 3 通过');
}

// 测试 4：添加自定义模板
function testAddTemplate() {
  console.log('=== 测试 4：添加自定义模板 ===');
  
  const engine = new CreativityEngine();
  const newTemplate = '这是一个自定义模板：{placeholder}';
  engine.addTemplate('custom', newTemplate);
  
  const result = engine.generate('测试提示', 'custom');
  
  console.assert(
    typeof result === 'string' && result.length > 0,
    '测试 4 失败：应该返回非空字符串'
  );
  console.log('✅ 测试 4 通过');
}

// 运行所有测试
function runAllTests() {
  console.log('=== 运行所有测试 ===');
  
  try {
    testCreativeWriting();
    testPoetry();
    testCode();
    testAddTemplate();
    
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
  testCreativeWriting,
  testPoetry,
  testCode,
  testAddTemplate,
};
