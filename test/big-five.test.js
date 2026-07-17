#!/usr/bin/env node
/** test/big-five.test.js */
const BigFive = require('../src/identity/BigFivePersonality.js');

let passed = 0, failed = 0;
function assert(cond, msg) { cond ? passed++ : (console.error('FAIL:', msg), failed++); }

console.log('=== BigFivePersonality 单元测试 ===\n');

assert(BigFive && typeof BigFive === 'object', '模块导出为对象');
assert(BigFive.dimensions && BigFive.dimensions.O, '含 O 维度');
assert(BigFive.dimensions.C, '含 C 维度');
assert(BigFive.dimensions.E, '含 E 维度');
assert(BigFive.dimensions.A, '含 A 维度');
assert(BigFive.dimensions.N, '含 N 维度');

const profile = BigFive.getProfile();
assert(profile && profile.O, 'getProfile 返回档案');

const level = BigFive.getLevel(7);
assert(level === '高', 'getLevel(7) === 高: ' + level);

const updated = BigFive.updateScore('O', 9);
assert(updated && updated.success, 'updateScore success');
assert(updated.newScore === 9, 'updateScore 更新分数');

const tips = BigFive.getCollaborationTips(profile);
assert(tips && typeof tips === 'object', 'getCollaborationTips 返回对象');

const adj = BigFive.adjustFromBehavior('社交和朋友分享交流');
assert(adj && typeof adj === 'object', 'adjustFromBehavior 返回对象');

console.log(`\n测试结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
process.exit(failed > 0 ? 1 : 0);
