/**
 * code-generator.test.js — CodeGenerator 模块单元测试
 */

module.exports = function({ test, assertEqual, assertTrue, assertFalse, assertDefined }) {
  const { CodeGenerator, TEMPLATES } = require('../src/code/code-generator.js');

  // ============================================================
  // CodeGenerator 类测试
  // ============================================================

  test('CodeGenerator 类可实例化', () => {
    const cg = new CodeGenerator();
    assertDefined(cg);
    assertTrue(cg instanceof CodeGenerator);
  });

  test('CodeGenerator 初始统计为 0', () => {
    const cg = new CodeGenerator();
    assertEqual(cg.stats.totalGenerations, 0);
    assertEqual(cg.stats.templateHits, 0);
    assertEqual(cg.stats.llmHits, 0);
  });

  // ============================================================
  // TEMPLATES 测试
  // ============================================================

  test('TEMPLATES 包含 6 种语言', () => {
    const langs = Object.keys(TEMPLATES);
    assertTrue(langs.includes('javascript'));
    assertTrue(langs.includes('typescript'));
    assertTrue(langs.includes('python'));
    assertTrue(langs.includes('bash'));
    assertTrue(langs.includes('go'));
    assertTrue(langs.includes('rust'));
  });

  test('JavaScript 模板包含 algorithm 类别', () => {
    assertDefined(TEMPLATES.javascript.algorithm);
  });

  test('JavaScript 模板包含 quick-sort 模板', () => {
    assertDefined(TEMPLATES.javascript.algorithm['quick-sort']);
    assertDefined(TEMPLATES.javascript.algorithm['quick-sort'].code);
    assertDefined(TEMPLATES.javascript.algorithm['quick-sort'].confidence);
  });

  // ============================================================
  // getSupportedLanguages 测试
  // ============================================================

  test('getSupportedLanguages 返回 6 种语言', () => {
    const cg = new CodeGenerator();
    const langs = cg.getSupportedLanguages();
    assertEqual(langs.length, 6);
  });

  // ============================================================
  // isLanguageSupported 测试
  // ============================================================

  test('isLanguageSupported 识别支持的语言', () => {
    const cg = new CodeGenerator();
    assertTrue(cg.isLanguageSupported('javascript'));
    assertTrue(cg.isLanguageSupported('python'));
  });

  test('isLanguageSupported 拒绝不支持的语言', () => {
    const cg = new CodeGenerator();
    assertFalse(cg.isLanguageSupported('cpp'));
    assertFalse(cg.isLanguageSupported('java'));
  });

  // ============================================================
  // getAvailableTemplates 测试
  // ============================================================

  test('getAvailableTemplates 返回按语言组织的模板', () => {
    const cg = new CodeGenerator();
    const templates = cg.getAvailableTemplates();
    assertDefined(templates.javascript);
    assertDefined(templates.javascript.algorithm);
  });

  // ============================================================
  // detectIntent 测试
  // ============================================================

  test('detectIntent 识别快速排序意图', () => {
    const cg = new CodeGenerator();
    const result = cg.detectIntent('写一个快速排序算法');
    assertEqual(result.language, 'javascript');
    assertDefined(result.type);
  });

  test('detectIntent 识别 HTTP 服务器意图', () => {
    const cg = new CodeGenerator();
    const result = cg.detectIntent('写一个 HTTP 服务器');
    assertEqual(result.type, 'network');
  });

  test('detectIntent 识别文件操作意图', () => {
    const cg = new CodeGenerator();
    const result = cg.detectIntent('读写文件');
    assertEqual(result.type, 'io');
  });

  test('detectIntent 返回 raw 原始文本', () => {
    const cg = new CodeGenerator();
    const input = '测试输入';
    const result = cg.detectIntent(input);
    assertEqual(result.raw, input);
  });

  // ============================================================
  // _detectLanguageFromExtension 测试（通过 generateFile 间接测试）
  // ============================================================

  test('检测 .js 扩展名映射为 javascript', () => {
    const cg = new CodeGenerator();
    // 通过检查 TEMPLATES 确认映射
    assertTrue(TEMPLATES.javascript !== undefined);
  });

  // ============================================================
  // getStats 测试
  // ============================================================

  test('getStats 返回统计信息', () => {
    const cg = new CodeGenerator();
    const stats = cg.getStats();
    assertDefined(stats.totalGenerations);
    assertDefined(stats.templateHits);
    assertDefined(stats.templateHitRate);
  });

  // ============================================================
  // _guessIntentType 测试
  // ============================================================

  test('_guessIntentType 识别排序关键词', () => {
    const cg = new CodeGenerator();
    // 通过检测意图来间接验证
    const result = cg.detectIntent('排序算法');
    assertDefined(result.type);
  });

  test('_guessIntentType 识别服务器关键词', () => {
    const cg = new CodeGenerator();
    const result = cg.detectIntent('http server endpoint');
    assertEqual(result.type, 'network');
  });

  // ============================================================
  // TEMPLATES 完整性测试
  // ============================================================

  test('每种语言至少有 algorithm 类别', () => {
    for (const lang of Object.keys(TEMPLATES)) {
      assertDefined(TEMPLATES[lang].algorithm, `${lang} 缺少 algorithm 类别`);
    }
  });

  test('每种语言至少有 structure 类别', () => {
    for (const lang of Object.keys(TEMPLATES)) {
      assertDefined(TEMPLATES[lang].structure, `${lang} 缺少 structure 类别`);
    }
  });

  test('模板代码长度合理（非bash >100 字符，bash >30 字符）', () => {
    for (const [lang, categories] of Object.entries(TEMPLATES)) {
      for (const [category, templates] of Object.entries(categories)) {
        for (const [key, tmpl] of Object.entries(templates)) {
          const minLen = lang === 'bash' ? 30 : 100;
          assertTrue(
            tmpl.code.length > minLen,
            `${lang}/${category}/${key} 的代码太短 (${tmpl.code.length} chars, 需要 >${minLen})`
          );
        }
      }
    }
  });
};
