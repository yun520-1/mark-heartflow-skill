#!/usr/bin/env node
/** test/logic-reasoning.test.js */
const { LogicReasoning } = require('../src/reasoning/logic-reasoning.js');

let passed = 0, failed = 0;
function assert(cond, msg) { cond ? passed++ : (console.error('FAIL:', msg), failed++); }

console.log('=== LogicReasoning 单元测试 ===\n');

const lr = new LogicReasoning();
assert(lr, 'LogicReasoning 实例化');

const r1 = lr.analyze('如果所有人类都会死，苏格拉底是人类，那么苏格拉底会死。');
assert(r1 && r1.reasoningType, 'analyze 返回 reasoningType');
assert(r1.fallacies && Array.isArray(r1.fallacies), 'analyze 返回 fallacies');
assert(r1.frameworkRecommendation, 'analyze 返回 frameworkRecommendation');

const r2 = lr.detectType('因为A所以B');
assert(r2 && r2.primaryType, 'detectType 返回 primaryType');

const r3 = lr.checkPremises('因为数据表明...所以...');
assert(r3 && Array.isArray(r3.explicitPremises), 'checkPremises 返回 explicitPremises');

const r4 = lr.findFallacies('你不支持我的观点，所以你想让所有人饿死。');
assert(r4 && Array.isArray(r4), 'findFallacies 返回数组');

const r5 = lr.recommendFramework('如何规划一次旅行？');
assert(r5 && r5.primary, 'recommendFramework 返回 primary');

const r6 = lr.selectAnswer('以下哪个是正确的？ A. 1 B. 2');
assert(r6 && typeof r6 === 'object', 'selectAnswer 返回对象');

console.log(`\n测试结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
process.exit(failed > 0 ? 1 : 0);
