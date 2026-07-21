/**
 * code-verifier.test.js — 心虫自主升级补的 TDD
 * 来源: SelfScanner 扫出 src/core/code-verifier.js 未测试 (untestedModules)
 *        evolve() 决策 testing:high (补 TDD 覆盖核心决策路径)
 * 原则: 只测纯函数 verifyJSContent 的核心契约, 不侵入业务代码
 * 格式: 兼容 test/run-all.js — module.exports = fn(ctx), ctx 由 runner 注入
 */
module.exports = function ({ test, assertEqual, assertTrue, assertFalse, assertDefined, assertThrows }) {
  const { codeVerifier } = require('../src/core/code-verifier.js');

  test('verifyJSContent: 合法 JS 内容返回 ok:true 且无括号错误', () => {
    const good = 'function add(a, b) {\n  return a + b;\n}\nmodule.exports = { add };\n';
    const r = codeVerifier.verifyJSContent(good);
    assertTrue(typeof r === 'object', '应返回对象');
    assertEqual(r.ok, true, '合法内容 ok 应为 true');
    assertTrue(Array.isArray(r.errors), 'errors 应为数组');
    const hasBracketErr = r.errors.some(e => e.includes('括号不匹配'));
    assertFalse(hasBracketErr, '合法内容不应报括号不匹配');
  });

  test('verifyJSContent: 含 shell shebang 的内容返回 ok:false', () => {
    const shell = '#!/bin/sh\necho hello\n';
    const r = codeVerifier.verifyJSContent(shell);
    assertEqual(r.ok, false, 'shebang 内容 ok 应为 false');
    const hit = r.errors.some(e => e.includes('shebang'));
    assertTrue(hit, '应报 shebang 错误');
  });

  test('verifyJSContent: 花括号不匹配返回对应错误', () => {
    const bad = 'function f() {\n  return 1;\nmodule.exports = { f };\n';
    const r = codeVerifier.verifyJSContent(bad);
    const hit = r.errors.some(e => e.includes('括号不匹配'));
    assertTrue(hit, '应检测花括号不匹配');
  });

  test('verifyJSContent: 无 module.exports 时给 warning 不阻断', () => {
    const noExport = 'const x = 1;\nfunction f() { return x; }\n';
    const r = codeVerifier.verifyJSContent(noExport);
    const hit = r.warnings.some(w => w.includes('module.exports'));
    assertTrue(hit, '应给无 export 的 warning');
  });

  test('verifyJS: 读不到文件返回 ok:false 且错误含无法读取', () => {
    const r = codeVerifier.verifyJS('/nonexistent/path/xxxx.js');
    assertEqual(r.ok, false, '文件不存在 ok 应为 false');
    const hit = r.errors.some(e => e.includes('无法读取'));
    assertTrue(hit, '应报无法读取文件');
  });
};
