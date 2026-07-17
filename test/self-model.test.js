#!/usr/bin/env node
/** test/self-model.test.js */
const { SelfModel } = require('../src/identity/self-model.js');
const fs = require('fs');
const path = require('path');

let passed = 0, failed = 0;
function assert(cond, msg) { cond ? passed++ : (console.error('FAIL:', msg), failed++); }

console.log('=== SelfModel 单元测试 ===\n');

const root = '/tmp/hf-test-self-model';
fs.rmSync(root, { recursive: true, force: true });
fs.mkdirSync(root, { recursive: true });

const model = new SelfModel(root);
assert(model._state, '_state 存在');

const beliefId = model.updateBelief('I can reason clearly', 0.9, 'introspection');
assert(beliefId && typeof beliefId.id === 'string', 'updateBelief 返回 id');

const beliefs = model.getBeliefs();
assert(Array.isArray(beliefs) && beliefs.length >= 1, 'getBeliefs 非空');

model.addCapability('dialogue');
model.addLimitation('no internet');
assert(model.getCapabilities().includes('dialogue'), 'capability 已添加');
assert(model.getLimitations().includes('no internet'), 'limitation 已添加');

const drift = model.detectDrift();
assert(drift && typeof drift.driftScore === 'number', 'detectDrift 返回 driftScore');

const metrics = model.updateGrowthMetrics({ autonomy: 70 });
assert(metrics && typeof metrics.autonomy === 'number', 'updateGrowthMetrics 成功');

const identity = model.getIdentityCore();
assert(identity && Array.isArray(identity.whoAmI), 'getIdentityCore 含 whoAmI');

console.log(`\n测试结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
process.exit(failed > 0 ? 1 : 0);
