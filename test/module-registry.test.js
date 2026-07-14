#!/usr/bin/env node
/** test/module-registry.test.js */
const { SUBSYSTEM_NAMES, registerModules, generateAllowedRoutes, METHOD_BLACKLIST } = require('../src/core/module-registry.js');

let passed = 0, failed = 0;
function assert(cond, msg) { cond ? passed++ : (console.error('FAIL:', msg), failed++); }

console.log('=== ModuleRegistry 回归测试 ===\n');

assert(Array.isArray(SUBSYSTEM_NAMES), 'SUBSYSTEM_NAMES 是数组');
assert(SUBSYSTEM_NAMES.length >= 124, `模块数 >= 124: 当前 ${SUBSYSTEM_NAMES.length}`);

assert(SUBSYSTEM_NAMES.includes('knowledge'), '含 knowledge');
assert(SUBSYSTEM_NAMES.includes('reasoning'), '含 reasoning');
assert(SUBSYSTEM_NAMES.includes('persona'), '含 persona');
assert(SUBSYSTEM_NAMES.includes('personaConsistency'), '含 personaConsistency');

const modules = registerModules({
  identityCore: { hello() {} },
  knowledge: { query() {} },
  persona: { load() {} },
  nonexistent: undefined,
});
assert(Object.keys(modules).length === 3, 'registerModules 跳过 undefined/null');
assert(modules.identityCore.hello, 'registerModules 保留方法');

const routes = generateAllowedRoutes(modules);
assert(Array.isArray(routes), 'generateAllowedRoutes 返回数组');
assert(routes.includes('identityCore.hello'), '路由含 identityCore.hello');
assert(routes.includes('knowledge.query'), '路由含 knowledge.query');

assert(METHOD_BLACKLIST.has('on'), 'METHOD_BLACKLIST 含 on');
assert(!METHOD_BLACKLIST.has('hello'), 'METHOD_BLACKLIST 不误伤业务方法');

console.log(`\n测试结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
process.exit(failed > 0 ? 1 : 0);
