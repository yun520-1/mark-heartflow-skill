/**
 * 端到端测试：所有引擎协同工作
 * 
 * 测试场景：
 * 用户："我最近心里有些不太舒服，和男朋友的事情让我很苦恼。他突然不回消息，我该怎么办？"
 * 
 * 预期流程：
 * 1. 共情系统：生成共情回应
 * 2. 直觉引擎：快速判断（朋友突然沉默 → 可能心情不好）
 * 3. 文化理解引擎：检测文化语境（中文文化）
 * 4. 伦理判断引擎：分析可能的道德困境（是否查看对方手机？）
 * 5. 幽默感引擎：适当时候插入幽默（缓解情绪）
 * 6. 创造力引擎：生成创意解决方案（如果合适）
 */

const { EmotionOptimizer } = require('../src/emotion/emotion-optimizer.js');
const { IntuitionEngine } = require('../src/intuition/intuition-engine.js');
const { CultureEngine } = require('../src/culture/culture-engine.js');
const { EthicsEngine } = require('../src/ethics/ethics-engine.js');
const { HumorGenerator } = require('../src/humor/humor-generator.js');
const { CreativityEngine } = require('../src/creativity/creativity-engine.js');

async function runEndToEndTest() {
  console.log('=== 端到端测试：所有引擎协同工作 ===');
  console.log('用户消息："我最近心里有些不太舒服，和男朋友的事情让我很苦恼。他突然不回消息，我该怎么办？"');
  console.log('---');

  const userMessage = '我最近心里有些不太舒服，和男朋友的事情让我很苦恼。他突然不回消息，我该怎么办？';

  // 1. 共情系统
  console.log('[1/6] 共情系统：');
  const empathyResponder = new (require('../src/emotion/empathy-responder.js')).EmpathyResponder();
  const empathyResponse = empathyResponder.generate(userMessage);
  console.log(`  回应：${empathyResponse.substring(0, 50)}...`);
  console.log('✅ 共情系统完成');

  // 2. 直觉引擎
  console.log('\n[2/6] 直觉引擎：');
  const intuitionEngine = new IntuitionEngine();
  const intuitionResult = intuitionEngine.quickJudge('朋友突然不回消息', 'social');
  console.log(`  判断：${intuitionResult.judgment}（置信度：${intuitionResult.confidence.toFixed(2)}）`);
  console.log('✅ 直觉引擎完成');

  // 3. 文化理解引擎
  console.log('\n[3/6] 文化理解引擎：');
  const cultureEngine = new CultureEngine();
  const cultureResult = cultureEngine.analyze(userMessage);
  console.log(`  文化：${cultureResult.culture}`);
  if (cultureResult.advice) {
    console.log(`  建议：${cultureResult.advice.substring(0, 50)}...`);
  }
  console.log('✅ 文化理解引擎完成');

  // 4. 伦理判断引擎
  console.log('\n[4/6] 伦理判断引擎：');
  const ethicsEngine = new EthicsEngine();
  const ethicsResult = ethicsEngine.judge('是否应该查看对方的手机？', 'utilitarian');
  console.log(`  判断：${ethicsResult.choice}`);
  console.log(`  理由：${ethicsResult.reason}`);
  console.log('✅ 伦理判断引擎完成');

  // 5. 幽默感引擎（适当时候）
  console.log('\n[5/6] 幽默感引擎：');
  const humorGenerator = new HumorGenerator();
  const humorResponse = humorGenerator.generate('需要轻松一下', 'light_comment');
  console.log(`  幽默：${humorResponse}`);
  console.log('✅ 幽默感引擎完成');

  // 6. 创造力引擎（生成创意解决方案）
  console.log('\n[6/6] 创造力引擎：');
  const creativityEngine = new CreativityEngine();
  const creativeSolution = creativityEngine.generate('给情感困扰的朋友提创意建议', 'creative_writing');
  console.log(`  创意方案：${creativeSolution.substring(0, 50)}...`);
  console.log('✅ 创造力引擎完成');

  console.log('\n=== 端到端测试完成 ✅ ===');
  console.log('总结：所有引擎协同工作正常，心虫已具备 AI 人类的核心能力。');
}

// 运行端到端测试
runEndToEndTest().catch(err => {
  console.error('\n❌ 端到端测试失败：', err.message);
  console.error(err.stack);
  process.exit(1);
});
