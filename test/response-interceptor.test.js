/**
 * ResponseInterceptor 测试 — 补齐 bridge 层无测试覆盖（心虫自检 untestedModules 之一）
 * 验证拦截器的真实行为，不依赖 LLM/外部模块（用 stub 注入）。
 */
module.exports = function ({ test, assertEqual, assertTrue, assertFalse, assertDefined, assertThrows }) {

  const { ResponseInterceptor } = require('../src/bridge/response-interceptor.js');

  // stub：最小化 heartflow，避免加载全引擎
  function makeStub(overrides = {}) {
    return Object.assign({
      personaCore: { personaityTone: 'calm' },
      // 注入器：标记 shouldAvoid
      _injector: null,
    }, overrides);
  }

  console.log('  🔗 ResponseInterceptor (response-interceptor.js)');

  test('disabled 时原样透传不修改', () => {
    const ri = new ResponseInterceptor({ enabled: false });
    const out = ri.intercept('你好世界', makeStub(), 'hi', '你好');
    // intercept 返回结构化对象，disabled 时 modifiedResponse 应为原输入
    assertEqual(out.modifiedResponse, '你好世界');
    assertEqual(out.originalResponse, '你好世界');
    assertTrue(out.stanceMatch);
  });

  test('空 response 不抛异常且返回结构化对象', () => {
    const ri = new ResponseInterceptor({ enabled: true });
    const out = ri.intercept('', makeStub(), '', '');
    assertTrue(typeof out === 'object');
    assertEqual(out.modifiedResponse, '');
  });

  test('string response 返回结构化对象且 modifiedResponse 非空', () => {
    const ri = new ResponseInterceptor({ enabled: true, allowResponseSuppression: false });
    const out = ri.intercept('原始回复内容', makeStub(), 'user', '原始');
    assertTrue(typeof out === 'object');
    assertTrue(out.modifiedResponse.length > 0);
  });

  test('enablePersonaPolish=false 时不改变 modifiedResponse', () => {
    const ri = new ResponseInterceptor({ enabled: true, enablePersonaPolish: false });
    const out = ri.intercept('保持原样', makeStub(), 'u', '保持');
    assertEqual(out.modifiedResponse, '保持原样');
  });

  test('构造后可 destroy 不抛', () => {
    const ri = new ResponseInterceptor({ enabled: true });
    ri.destroy();
    assertTrue(true);
  });

};
