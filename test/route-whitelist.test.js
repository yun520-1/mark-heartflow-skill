#!/usr/bin/env node
/** test/route-whitelist.test.js */
const RouteWhitelist = require('../src/core/route-whitelist.js');

let passed = 0, failed = 0;
function assert(cond, msg) { cond ? passed++ : (console.error('FAIL:', msg), failed++); }

console.log('=== RouteWhitelist 回归测试 ===\n');

const whitelist = new RouteWhitelist(['emotion.process', 'heartLogic.analyze']);
assert(whitelist.size() === 2, '初始 size=2');
assert(whitelist.has('emotion.process'), 'has 识别初始路由');
assert(!whitelist.has('unknown.route'), 'has 拒绝未知路由');

const added = whitelist.add('reasoning.think');
assert(added === true, 'add 返回 true');
assert(whitelist.has('reasoning.think'), 'add 后 has 为 true');

const addedCount = whitelist.addAll(['persona.load', 'dialogue.reply']);
assert(addedCount === 2, 'addAll 返回添加数量 2');
assert(whitelist.size() === 5, 'size 变为 5');

const entries = whitelist.entries();
assert(Array.isArray(entries) && entries.length === 5, 'entries 返回 5 项');

const snap = whitelist.snapshot();
assert(Array.isArray(snap) && snap.includes('persona.load'), 'snapshot 含新增路由');

const badAdd = whitelist.add('');
assert(badAdd === false, 'add 空字符串返回 false');
assert(whitelist.add(null) === false, 'add null 返回 false');

console.log(`\n测试结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
process.exit(failed > 0 ? 1 : 0);
