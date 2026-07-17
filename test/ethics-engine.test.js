/**
 * 自动化测试：EthicsEngine
 * 
 * 测试目标：
 * 1. 伦理判断（不同框架）
 * 2. 多框架分析
 * 3. 添加自定义框架
 */

const { EthicsEngine } = require('../src/ethics/ethics-engine.js');

// 测试 1：功利主义判断
function testUtilitarianJudge() {
  console.log('=== 测试 1：功利主义判断 ===');
  
  const engine = new EthicsEngine();
  const result = engine.judge('电车难题：切换轨道救5人 vs 不切换牺牲1人', 'utilitarian');
  
  console.assert(
    typeof result.choice === 'string' && result.choice.length > 0,
    '测试 1 失败：应该返回非空选择'
  );
  console.assert(
    result.framework === '功利主义',
    '测试 1 失败：框架应该是功利主义'
  );
  console.log('✅ 测试 1 通过');
}

// 测试 2：义务论判断
function testDeontologicalJudge() {
  console.log('=== 测试 2：义务论判断 ===');
  
  const engine = new EthicsEngine();
  const result = engine.judge('是否应该说谎来保护朋友？', 'deontological');
  
  console.assert(
    typeof result.choice === 'string' && result.choice.length > 0,
    '测试 2 失败：应该返回非空选择'
  );
  console.assert(
    result.framework === '义务论',
    '测试 2 失败：框架应该是义务论'
  );
  console.log('✅ 测试 2 通过');
}

// 测试 3：美德伦理学判断
function testVirtueEthicsJudge() {
  console.log('=== 测试 3：美德伦理学判断 ===');
  
  const engine = new EthicsEngine();
  const result = engine.judge('面对不公正，应该勇敢站出来吗？', 'virtue_ethics');
  
  console.assert(
    typeof result.choice === 'string' && result.choice.length > 0,
    '测试 3 失败：应该返回非空选择'
  );
  console.assert(
    result.framework === '美德伦理学',
    '测试 3 失败：框架应该是美德伦理学'
  );
  console.log('✅ 测试 3 通过');
}

// 测试 4：多框架分析
function testMultiFrameworkAnalysis() {
  console.log('=== 测试 4：多框架分析 ===');
  
  const engine = new EthicsEngine();
  const results = engine.multiFrameworkAnalysis('电车难题：切换轨道救5人 vs 不切换牺牲1人');
  
  console.assert(
    typeof results === 'object' && Object.keys(results).length > 0,
    '测试 4 失败：应该返回非空结果'
  );
  console.log('✅ 测试 4 通过');
}

// 测试 5：添加自定义框架
function testAddFramework() {
  console.log('=== 测试 5：添加自定义框架 ===');
  
  const engine = new EthicsEngine();
  engine.addFramework('care_ethics', '关怀关系', (dilemma) => {
    return { choice: '选择关怀关系', reason: '这体现关怀伦理学' };
  });
  
  const result = engine.judge('如何帮助痛苦的朋友？', 'care_ethics');
  
  console.assert(
    typeof result.choice === 'string' && result.choice.length > 0,
    '测试 5 失败：应该返回非空选择'
  );
  console.log('✅ 测试 5 通过');
}

// 运行所有测试
function runAllTests() {
  console.log('=== 运行所有测试 ===');
  
  try {
    testUtilitarianJudge();
    testDeontologicalJudge();
    testVirtueEthicsJudge();
    testMultiFrameworkAnalysis();
    testAddFramework();
    
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
  testUtilitarianJudge,
  testDeontologicalJudge,
  testVirtueEthicsJudge,
  testMultiFrameworkAnalysis,
  testAddFramework,
};
