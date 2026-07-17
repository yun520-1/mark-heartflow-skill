#!/usr/bin/env node
/** test/reasoning-integrator.test.js */
const { think, deepThink, execute, planAndSolve, REASONING_EXAMPLES, PS_PROMPTS } = require('../src/reasoning/reasoning-integrator.js');

let passed = 0, failed = 0;
function assert(cond, msg) { cond ? passed++ : (console.error('FAIL:', msg), failed++); }

console.log('=== ReasoningIntegrator 单元测试 ===\n');

assert(think, 'think 函数存在');
assert(deepThink, 'deepThink 函数存在');
assert(execute, 'execute 函数存在');
assert(planAndSolve, 'planAndSolve 函数存在');
assert(Array.isArray(REASONING_EXAMPLES), 'REASONING_EXAMPLES 是数组');
assert(Object.keys(PS_PROMPTS).length > 0, 'PS_PROMPTS 非空');

const t1 = think('如何学习数学？');
assert(t1 && Array.isArray(t1.steps), 'think 返回 steps');
assert(t1.input === '如何学习数学？', 'think 保留 input');

const t2 = deepThink('什么是爱？');
assert(t2 && Array.isArray(t2.standards), 'deepThink 返回 standards');

const e1 = execute('如何学习数学？', { force: true });
assert(e1 && typeof e1.shouldRespond === 'boolean', 'execute 返回 shouldRespond');

const p1 = planAndSolve('计算 2+2');
assert(p1 && Array.isArray(p1.phases), 'planAndSolve 返回 phases');

console.log(`\n测试结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
process.exit(failed > 0 ? 1 : 0);
