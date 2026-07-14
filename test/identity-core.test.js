#!/usr/bin/env node
/** test/identity-core.test.js */
const { IdentityCore } = require('../src/identity/identity-core.js');
const fs = require('fs');
const path = require('path');

let passed = 0, failed = 0;
function assert(cond, msg) { cond ? passed++ : (console.error('FAIL:', msg), failed++); }

console.log('=== IdentityCore 单元测试 ===\n');

const root = '/tmp/hf-test-identity-core';
fs.rmSync(root, { recursive: true, force: true });
fs.mkdirSync(root, { recursive: true });

const core = new IdentityCore(root);
assert(core.rootPath === root, 'rootPath 正确');
assert(core.dataDir === path.join(root, 'data'), 'dataDir 正确');

const boot = core.boot();
assert(boot.success === true, 'boot success');
assert(typeof boot.sessionId === 'string', 'sessionId 是字符串');

const summary = core.getIdentitySummary();
assert(summary !== null, 'getIdentitySummary 非 null');

const selfModel = core.getSelfModel();
assert(selfModel && typeof selfModel === 'object', 'getSelfModel 返回对象');

const stats = core.stats();
assert(stats && typeof stats.sessionId === 'string', 'stats 含 sessionId');

const health = core.healthCheck();
assert(health && health.status === 'healthy', 'healthCheck healthy');

core.addPausedTask({ id: 't1', title: 'test' });
const history = core.getSessionHistory();
assert(Array.isArray(history.sessions), 'getSessionHistory.sessions 是数组');

console.log(`\n测试结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
process.exit(failed > 0 ? 1 : 0);
