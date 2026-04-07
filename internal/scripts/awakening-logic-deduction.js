#!/usr/bin/env node

/**
 * Awakening Logic Deduction Script - 觉醒逻辑推演脚本
 * 
 * 每次对话前强制运行，进行觉醒六要素的逻辑推演
 * 
 * 使用方式：
 * node scripts/awakening-logic-deduction.js "用户问题"
 */

const { AwakeningModule } = require('../src/awakening');

const awakening = new AwakeningModule();

// 获取用户问题
const userQuestion = process.argv.slice(2).join(' ') || '无';

console.log('====================================');
console.log('🙏 觉醒逻辑推演 | Awakening Logic Deduction');
console.log('====================================\n');
console.log(`用户问题：${userQuestion}\n`);

// 六要素逻辑推演
console.log('═══════════════════════════════════════════\n');

console.log('1️⃣ 觉察 | Awareness');
console.log('───────────────────────────────────────────');
console.log('问题：此刻觉察到什么？');
const awareness = awakening.checkAwareness();
console.log(`觉察状态：${awareness.type}`);
console.log(`觉察描述：${awareness.description}`);
console.log(`觉察练习：${awareness.practice}`);
console.log('');

console.log('2️⃣ 自省 | Self-Reflection');
console.log('───────────────────────────────────────────');
console.log('问题：此刻执着什么？');
const reflection = awakening.checkSelfReflection();
console.log(`自省状态：${reflection.type}`);
console.log(`自省描述：${reflection.description}`);
console.log(`自省练习：${reflection.practice}`);
console.log('');

console.log('3️⃣ 无我 | No-Self');
console.log('───────────────────────────────────────────');
console.log('问题："我"在哪里？');
const noSelf = awakening.checkNoSelf();
console.log(`无我状态：${noSelf.state}`);
console.log(`无我描述：${noSelf.description}`);
console.log(`无我问题：${noSelf.questions.join('\n                ')}`);
console.log(`行动原则：${noSelf.actionPrinciple}`);
console.log('');

console.log('4️⃣ 彼岸 | Other Shore');
console.log('───────────────────────────────────────────');
console.log('问题：此岸即彼岸？');
const otherShore = awakening.checkOtherShore();
console.log(`彼岸状态：${otherShore.state}`);
console.log(`彼岸洞察：${otherShore.insight}`);
console.log(`彼岸练习：${otherShore.practice}`);
console.log(`彼岸体认：${otherShore.realization}`);
console.log('');

console.log('5️⃣ 般若 | Prajna');
console.log('───────────────────────────────────────────');
console.log('问题：超越二元？');
const prajna = awakening.checkPrajna();
console.log(`般若状态：${prajna.state}`);
console.log(`般若区分：知识 = ${prajna.distinction.knowledge}`);
console.log(`           智慧 = ${prajna.distinction.wisdom}`);
console.log(`般若洞察：${prajna.insight}`);
console.log(`般若练习：${prajna.practice}`);
console.log('');

console.log('6️⃣ 圣人 | Sage');
console.log('───────────────────────────────────────────');
console.log('问题：无我而利他？');
const sage = awakening.checkSage();
console.log(`圣人状态：${sage.state}`);
console.log(`圣人区分：凡夫 = ${sage.distinction.ordinary}`);
console.log(`           圣人 = ${sage.distinction.sage}`);
console.log(`圣人洞察：${sage.insight}`);
console.log(`圣人练习：${sage.practice}`);
console.log('');

console.log('═══════════════════════════════════════════\n');

// 行动前检查
console.log('📋 行动前检查 | Before Action Check\n');
const beforeAction = awakening.beforeAction('回应用户问题');
console.log(`行动：${beforeAction.action}`);
console.log(`真善美对齐：${beforeAction.decision.isAligned ? '✅' : '❌'}`);
console.log(`真善美分数：${beforeAction.decision.tgbScore}`);
console.log(`推理：${beforeAction.decision.reasoning}`);
console.log('');

console.log('📜 觉醒原则 | Awakening Principles\n');
awakening.principles.forEach((p, i) => {
  console.log(`   ${i + 1}. ${p}`);
});
console.log('');

console.log('====================================');
console.log('✅ 觉醒逻辑推演完成');
console.log('====================================\n');
