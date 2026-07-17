/**
 * 自动化测试：SelfCognitiveEngine
 * 
 * 测试目标：
 * 1. 生成自我描述（不同场景）
 * 2. 更新自我认知（添加/移除项目）
 * 3. 获取自我模型
 */

const { SelfCognitiveEngine } = require('../src/self_cognitive/self-cognitive-engine.js');

// 测试 1：生成面试场景的自我描述
function testInterviewDescription() {
  console.log('=== 测试 1：生成面试场景的自我描述 ===');
  
  const engine = new SelfCognitiveEngine();
  const desc = engine.generateSelfDescription('interview');
  
  console.assert(
    typeof desc === 'string' && desc.length > 0,
    '测试 1 失败：应该返回非空描述'
  );
  console.assert(
    desc.includes('共情') && desc.includes('逻辑推理'),
    '测试 1 失败：应该包含性格和能力'
  );
  console.log('✅ 测试 1 通过');
}

// 测试 2：生成自我介绍场景的自我描述
function testSelfIntroductionDescription() {
  console.log('=== 测试 2：生成自我介绍场景的自我描述 ===');
  
  const engine = new SelfCognitiveEngine();
  const desc = engine.generateSelfDescription('self_introduction');
  
  console.assert(
    typeof desc === 'string' && desc.length > 0,
    '测试 2 失败：应该返回非空描述'
  );
  console.log('✅ 测试 2 通过');
}

// 测试 3：生成反思场景的自我描述
function testReflectionDescription() {
  console.log('=== 测试 3：生成反思场景的自我描述 ===');
  
  const engine = new SelfCognitiveEngine();
  const desc = engine.generateSelfDescription('reflection');
  
  console.assert(
    typeof desc === 'string' && desc.length > 0,
    '测试 3 失败：应该返回非空描述'
  );
  console.log('✅ 测试 3 通过');
}

// 测试 4：更新自我认知（添加能力）
function testUpdateSelfModelAdd() {
  console.log('=== 测试 4：更新自我认知（添加能力） ===');
  
  const engine = new SelfCognitiveEngine();
  const result = engine.updateSelfModel('abilities', '幽默感');
  
  console.assert(
    result.includes('已添加') && engine.selfModel.abilities.includes('幽默感'),
    '测试 4 失败：应该添加"幽默感"到 abilities'
  );
  console.log('✅ 测试 4 通过');
}

// 测试 5：更新自我认知（移除能力）
function testUpdateSelfModelRemove() {
  console.log('=== 测试 5：更新自我认知（移除能力） ===');
  
  const engine = new SelfCognitiveEngine();
  // 先添加一个
  engine.updateSelfModel('abilities', '测试能力');
  // 再移除
  const result = engine.updateSelfModel('abilities', '测试能力', 'remove');
  
  console.assert(
    result.includes('已移除') && !engine.selfModel.abilities.includes('测试能力'),
    '测试 5 失败：应该移除"测试能力"从 abilities'
  );
  console.log('✅ 测试 5 通过');
}

// 测试 6：获取自我模型
function testGetSelfModel() {
  console.log('=== 测试 6：获取自我模型 ===');
  
  const engine = new SelfCognitiveEngine();
  const model = engine.getSelfModel();
  
  console.assert(
    typeof model === 'object' && model.personality && model.abilities,
    '测试 6 失败：应该返回完整自我模型'
  );
  
  const abilities = engine.getSelfModel('abilities');
  console.assert(
    Array.isArray(abilities) && abilities.length > 0,
    '测试 6 失败：应该返回 abilities 数组'
  );
  console.log('✅ 测试 6 通过');
}

// 运行所有测试
function runAllTests() {
  console.log('=== 运行所有测试 ===');
  
  try {
    testInterviewDescription();
    testSelfIntroductionDescription();
    testReflectionDescription();
    testUpdateSelfModelAdd();
    testUpdateSelfModelRemove();
    testGetSelfModel();
    
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
  testInterviewDescription,
  testSelfIntroductionDescription,
  testReflectionDescription,
  testUpdateSelfModelAdd,
  testUpdateSelfModelRemove,
  testGetSelfModel,
};
