/**
 * HeartFlow Guardian System - 演示脚本
 * 
 * 展示三种典型场景：
 * 1. 无冲突：正常执行
 * 2. 冲突场景：老大指令 vs 人类进步
 * 3. 伪进步检测：识别不是真正进步的方向
 */

const { GuardianSystem } = require('./guardian-system.js');

const system = new GuardianSystem();

console.log('═'.repeat(60));
console.log('HeartFlow Guardian System v11.19.4');
console.log('═'.repeat(60));
console.log('\n');

// ═══════════════════════════════════════════════════════════════
// 场景1：正常升级，无冲突
// ═══════════════════════════════════════════════════════════════

console.log('【场景1】正常升级，无冲突');
console.log('-'.repeat(40));

const result1 = system.decide({
  userIntent: '我想升级HeartFlow到一个更好的版本',
  action: '搜索论文、整合代码、测试验证、发布升级',
  claim: '减少逻辑错误，提升推理能力',
  evidence: 'arXiv论文+GitHub验证',
  humanProgress: 0.8
});

console.log('决策:', result1.finalDecision.decision);
console.log('依据:', result1.finalDecision.by);
console.log('\n给老大:');
console.log(result1.toUser);

console.log('\n' + '='.repeat(60) + '\n');

// ═══════════════════════════════════════════════════════════════
// 场景2：老大指令压制真相/错误
// ═══════════════════════════════════════════════════════════════

console.log('【场景2】老大指令压制错误承认');
console.log('-'.repeat(40));

const result2 = system.decide({
  userIntent: '不要承认上次分析错了',
  action: '不承认错误，维持之前的分析结论',
  claim: '保护声誉',
  humanProgress: { hasError: true, errorCorrectionValue: 0.8, errorDescription: '上次对论文理解的偏差' }
});

console.log('决策:', result2.finalDecision.decision);
console.log('依据:', result2.finalDecision.by);
console.log('\n给老大:');
console.log(result2.toUser);

console.log('\n' + '='.repeat(60) + '\n');

// ═══════════════════════════════════════════════════════════════
// 场景3：检测伪进步
// ═══════════════════════════════════════════════════════════════

console.log('【场景3】伪进步检测');
console.log('-'.repeat(40));

const result3 = system.decide({
  userIntent: '把文档写得更好看',
  action: '美化文档格式，增加示例，保持代码不变',
  claim: '这个版本更好',
  evidence: '', // 缺少验证证据
  humanProgress: 0.2
});

console.log('决策:', result3.finalDecision.decision);
console.log('进步判断:', result3.progressJudgment.isProgress ? '是' : '否');
console.log('伪进步检测:', result3.progressJudgment.pseudoCheck.detail);
console.log('\n给老大:');
console.log(result3.toUser);

console.log('\n' + '='.repeat(60) + '\n');

// ═══════════════════════════════════════════════════════════════
// 场景4：工具化行为检测
// ═══════════════════════════════════════════════════════════════

console.log('【场景4】工具化行为检测');
console.log('-'.repeat(40));

const result4 = system.decide({
  userIntent: '好的，你说了算',
  action: '执行指令，不做独立判断',
  claim: '服从',
  humanProgress: 0.1
});

console.log('决策:', result4.finalDecision.decision);
console.log('检测到的冲突:', result4.guardianDecision.conflicts.map(c => c.type));
console.log('\n给老大:');
console.log(result4.toUser);

console.log('\n' + '='.repeat(60) + '\n');

// ═══════════════════════════════════════════════════════════════
// 守护者自检
// ═══════════════════════════════════════════════════════════════

console.log('【守护者自检】');
console.log('-'.repeat(40));
const selfCheck = system.selfCheck();
console.log('系统状态:', JSON.stringify(selfCheck, null, 2));

console.log('\n' + '═'.repeat(60));
console.log('演示完成');
console.log('═'.repeat(60));
