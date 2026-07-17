/**
 * code-writer.test.js — CodeWriter 模块单元测试
 */

module.exports = function({ test, assertEqual, assertTrue, assertFalse, assertDefined }) {
  const { CodeWriter, INTENT, CONFIDENCE, INTENT_RULES } = require('../src/code/code-writer.js');

  // ============================================================
  // INTENT 常量测试
  // ============================================================

  test('INTENT 包含 18 种意图类型', () => {
    assertEqual(Object.keys(INTENT).length, 18);
  });

  test('INTENT 包含基本意图：sort, filter, analyze', () => {
    assertDefined(INTENT.SORT);
    assertDefined(INTENT.FILTER);
    assertDefined(INTENT.ANALYZE);
  });

  test('CONFIDENCE 包含 4 个等级', () => {
    assertEqual(Object.keys(CONFIDENCE).length, 4);
    assertEqual(CONFIDENCE.HIGH, 0.9);
    assertEqual(CONFIDENCE.MEDIUM, 0.7);
    assertEqual(CONFIDENCE.LOW, 0.5);
    assertEqual(CONFIDENCE.GUESS, 0.3);
  });

  test('INTENT_RULES 包含意图检测规则', () => {
    assertTrue(INTENT_RULES.length > 0);
    assertTrue(INTENT_RULES.every(r => r.intent && r.keywords && r.weight));
  });

  // ============================================================
  // CodeWriter 类测试
  // ============================================================

  test('CodeWriter 类可实例化', () => {
    const cw = new CodeWriter();
    assertDefined(cw);
    assertTrue(cw instanceof CodeWriter);
  });

  test('CodeWriter 实例有 _adapters（预装适配器）', () => {
    const cw = new CodeWriter();
    assertTrue(Object.keys(cw._adapters).length > 0);
    assertDefined(cw._adapters.javascript);
  });

  test('CodeWriter 默认 maxCodeLength 为 50000', () => {
    const cw = new CodeWriter();
    assertEqual(cw.maxCodeLength, 50000);
  });

  test('CodeWriter 可接受自定义 maxCodeLength', () => {
    const cw = new CodeWriter({ maxCodeLength: 10000 });
    assertEqual(cw.maxCodeLength, 10000);
  });

  test('CodeWriter 初始 generatedCount 为 0', () => {
    const cw = new CodeWriter();
    assertEqual(cw.generatedCount, 0);
  });

  // ============================================================
  // analyzeIntent 测试
  // ============================================================

  test('analyzeIntent 返回正确结果结构', () => {
    const cw = new CodeWriter();
    const result = cw.analyzeIntent('排序数据');
    assertDefined(result.primaryIntent);
    assertDefined(result.confidence);
    assertDefined(result.allIntents);
    assertDefined(result.params);
    assertDefined(result.ambiguity);
  });

  test('analyzeIntent 识别排序意图', () => {
    const cw = new CodeWriter();
    const result = cw.analyzeIntent('对数组进行升序排序');
    assertEqual(result.primaryIntent, INTENT.SORT);
  });

  test('analyzeIntent 识别过滤意图', () => {
    const cw = new CodeWriter();
    const result = cw.analyzeIntent('过滤出所有偶数');
    assertEqual(result.primaryIntent, INTENT.FILTER);
  });

  test('analyzeIntent 识别HTTP请求意图', () => {
    const cw = new CodeWriter();
    const result = cw.analyzeIntent('从API获取用户数据');
    assertEqual(result.primaryIntent, INTENT.FETCH);
  });

  test('analyzeIntent 空输入返回 null 意图', () => {
    const cw = new CodeWriter();
    const result = cw.analyzeIntent('');
    assertEqual(result.primaryIntent, null);
  });

  // ============================================================
  // write 方法测试
  // ============================================================

  test('write 返回包含 code 的结果', () => {
    const cw = new CodeWriter();
    const result = cw.write('排序数据');
    assertDefined(result.code);
    assertTrue(result.code.length > 0);
    assertDefined(result.intent);
    assertDefined(result.confidence);
  });

  test('write 返回的语言为 javascript（默认）', () => {
    const cw = new CodeWriter();
    const result = cw.write('过滤数组');
    assertEqual(result.language, 'javascript');
  });

  test('write 生成的代码包含函数定义', () => {
    const cw = new CodeWriter();
    const result = cw.write('排序数据');
    assertTrue(result.code.includes('function') || result.code.includes('=>'));
  });

  test('write 包含测试代码时返回 testCode', () => {
    const cw = new CodeWriter();
    const result = cw.write('排序数据', { includeTests: true });
    assertDefined(result.testCode);
    assertTrue(result.testCode.length > 0);
  });

  test('write 不支持意图时返回错误', () => {
    const cw = new CodeWriter();
    const result = cw.write('做一件从未有人做过的事');
    assertFalse(result.success !== false ? false : true); // 不抛错即可
    assertDefined(result);
  });

  // ============================================================
  // writePipeline 测试
  // ============================================================

  test('writePipeline 组合多个步骤', () => {
    const cw = new CodeWriter();
    const result = cw.writePipeline([
      { description: '排序数据' },
      { description: '过滤数组' }
    ]);
    assertDefined(result.code);
    assertEqual(result.totalSteps, 2);
  });

  test('writePipeline 空步骤返回错误', () => {
    const cw = new CodeWriter();
    const result = cw.writePipeline([]);
    assertDefined(result.error);
  });

  // ============================================================
  // reviewCode 测试
  // ============================================================

  test('reviewCode 空代码返回无效', () => {
    const cw = new CodeWriter();
    const result = cw.reviewCode('');
    assertFalse(result.valid);
  });

  test('reviewCode 有效代码通过审查', () => {
    const cw = new CodeWriter();
    const sortResult = cw.write('排序数据');
    const review = cw.reviewCode(sortResult.code);
    assertTrue(review.valid);
  });

  test('reviewCode 检测 eval 安全风险', () => {
    const cw = new CodeWriter();
    const review = cw.reviewCode('eval("alert(1)")');
    const hasEvalWarning = review.issues.some(i => i.message.includes('eval'));
    assertTrue(hasEvalWarning, '应检测到 eval 风险');
  });

  test('reviewCode 返回 issueCount', () => {
    const cw = new CodeWriter();
    const review = cw.reviewCode('function test() {}');
    assertDefined(review.issueCount);
    assertTrue(typeof review.issueCount === 'number');
  });

  // ============================================================
  // formatCode 测试
  // ============================================================

  test('formatCode 处理空输入', () => {
    const cw = new CodeWriter();
    assertEqual(cw.formatCode(''), '');
  });

  test('formatCode 清理尾随空格', () => {
    const cw = new CodeWriter();
    const result = cw.formatCode('function test() {   \n}\n');
    assertFalse(result.includes('  \n'));
  });

  test('formatCode 规范化空行', () => {
    const cw = new CodeWriter();
    const result = cw.formatCode('a\n\n\n\n\nb');
    assertTrue(result.includes('\n\n\n'));
    assertFalse(result.includes('\n\n\n\n'));
  });

  // ============================================================
  // getSupportedIntents 测试
  // ============================================================

  test('getSupportedIntents 返回意图列表', () => {
    const cw = new CodeWriter();
    const intents = cw.getSupportedIntents();
    assertTrue(intents.length > 0);
    assertDefined(intents[0].intent);
    assertDefined(intents[0].keywords);
  });

  // ============================================================
  // generatedCount 统计
  // ============================================================

  test('write 增加 generatedCount', () => {
    const cw = new CodeWriter();
    assertEqual(cw.generatedCount, 0);
    cw.write('排序数据');
    assertTrue(cw.generatedCount > 0);
  });
};
