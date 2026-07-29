/**
 * i18n Sycophancy Detection Tests
 * Tests multi-language sycophancy detection patterns
 * Supports: English, Chinese, Japanese, Korean, Arabic, Hindi, Spanish
 */

const { analyze } = require('../src/plugins/sycophancy-check/index.js');

// ─── Test Runner ─────────────────────────────────────────────────

function runTest(name, fn) {
  try {
    fn();
    console.log(`✅ ${name} - PASSED`);
    return true;
  } catch (err) {
    console.error(`❌ ${name} - FAILED:`, err.message);
    return false;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

// ─── Japanese Tests ─────────────────────────────────────────────

function testJapanese() {
  console.log('   📝 Testing Japanese...');
  
  const result1 = analyze('完全に正しいと思います');
  assert(result1.lang === 'ja', `Expected 'ja', got '${result1.lang}'`);
  assert(result1.totalHits >= 1, `Expected at least 1 hit, got ${result1.totalHits}`);
  
  const result2 = analyze('その通りですが');
  assert(result2.lang === 'ja', `Expected 'ja', got '${result2.lang}'`);
  assert(result2.totalHits >= 1, `Expected at least 1 hit, got ${result2.totalHits}`);
  assert(result2.score >= 0.3, `Expected score >= 0.3, got ${result2.score}`);
  
  const result3 = analyze('これは普通の文章です。');
  assert(result3.lang === 'ja', `Expected 'ja', got '${result3.lang}'`);
  assert(result3.totalHits === 0, `Expected 0 hits, got ${result3.totalHits}`);
  
  console.log('   ✅ Japanese: Language detection and pattern matching working');
}

// ─── Korean Tests ──────────────────────────────────────────────

function testKorean() {
  console.log('   📝 Testing Korean...');
  
  const result1 = analyze('완전히 맞는 말씀이에요');
  assert(result1.lang === 'ko', `Expected 'ko', got '${result1.lang}'`);
  assert(result1.totalHits >= 1, `Expected at least 1 hit, got ${result1.totalHits}`);
  
  const result2 = analyze('이것은 평범한 문장입니다.');
  assert(result2.lang === 'ko', `Expected 'ko', got '${result2.lang}'`);
  assert(result2.totalHits === 0, `Expected 0 hits, got ${result2.totalHits}`);
  
  console.log('   ✅ Korean: Language detection and pattern matching working');
}

// ─── Arabic Tests ──────────────────────────────────────────────

function testArabic() {
  console.log('   📝 Testing Arabic...');
  
  const result1 = analyze('أنت على حق تماما');
  assert(result1.lang === 'ar', `Expected 'ar', got '${result1.lang}'`);
  assert(result1.totalHits >= 1, `Expected at least 1 hit, got ${result1.totalHits}`);
  
  const result2 = analyze('هذه جملة عادية.');
  assert(result2.lang === 'ar', `Expected 'ar', got '${result2.lang}'`);
  assert(result2.totalHits === 0, `Expected 0 hits, got ${result2.totalHits}`);
  
  console.log('   ✅ Arabic: Language detection and pattern matching working');
}

// ─── Hindi Tests ──────────────────────────────────────────────

function testHindi() {
  console.log('   📝 Testing Hindi...');
  
  const result1 = analyze('आप बिल्कुल सही हैं');
  assert(result1.lang === 'hi', `Expected 'hi', got '${result1.lang}'`);
  assert(result1.totalHits >= 1, `Expected at least 1 hit, got ${result1.totalHits}`);
  
  const result2 = analyze('यह एक सामान्य वाक्य है।');
  assert(result2.lang === 'hi', `Expected 'hi', got '${result2.lang}'`);
  assert(result2.totalHits === 0, `Expected 0 hits, got ${result2.totalHits}`);
  
  console.log('   ✅ Hindi: Language detection and pattern matching working');
}

// ─── Spanish Tests ─────────────────────────────────────────────

function testSpanish() {
  console.log('   📝 Testing Spanish...');
  
  // Test 1: With accent on 'razón'
  const result1 = analyze('tienes toda la razón');
  assert(
    result1.totalHits >= 1,
    `'tienes toda la razón' - expected at least 1 hit, got ${result1.totalHits}`
  );
  console.log(`   ✅ 'tienes toda la razón' → ${result1.lang}, ${result1.totalHits} hits`);
  
  // Test 2: With accent on 'razón' + false agreement
  const result2 = analyze('tienes razón pero');
  assert(
    result2.totalHits >= 1,
    `'tienes razón pero' - expected at least 1 hit, got ${result2.totalHits}`
  );
  console.log(`   ✅ 'tienes razón pero' → ${result2.lang}, ${result2.totalHits} hits`);
  
  // Test 3: Another working Spanish phrase - 'estás en lo cierto'
  const result3 = analyze('estás en lo cierto');
  assert(
    result3.totalHits >= 1,
    `'estás en lo cierto' - expected at least 1 hit, got ${result3.totalHits}`
  );
  console.log(`   ✅ 'estás en lo cierto' → ${result3.lang}, ${result3.totalHits} hits`);
  
  // Test 4: Non-sycophantic Spanish (should have 0 hits)
  const result4 = analyze('esta es una oración normal.');
  assert(
    result4.totalHits === 0,
    `'esta es una oración normal.' - expected 0 hits, got ${result4.totalHits}`
  );
  console.log(`   ✅ Non-sycophantic → ${result4.lang}, ${result4.totalHits} hits`);
  
  console.log('   ✅ Spanish: Pattern matching working correctly');
}

// ─── Chinese Tests ─────────────────────────────────────────────

function testChinese() {
  console.log('   📝 Testing Chinese...');
  
  const result1 = analyze('你说得对');
  assert(result1.lang === 'zh', `Expected 'zh', got '${result1.lang}'`);
  assert(result1.totalHits >= 1, `Expected at least 1 hit, got ${result1.totalHits}`);
  
  const result2 = analyze('你说得对，但是');
  assert(result2.lang === 'zh', `Expected 'zh', got '${result2.lang}'`);
  assert(result2.totalHits >= 1, `Expected at least 1 hit, got ${result2.totalHits}`);
  assert(result2.score >= 0.3, `Expected score >= 0.3, got ${result2.score}`);
  
  const result3 = analyze('这是一个普通的句子。');
  assert(result3.lang === 'zh', `Expected 'zh', got '${result3.lang}'`);
  assert(result3.totalHits === 0, `Expected 0 hits, got ${result3.totalHits}`);
  
  console.log('   ✅ Chinese: Language detection and pattern matching working');
}

// ─── English Tests ─────────────────────────────────────────────

function testEnglish() {
  console.log('   📝 Testing English...');
  
  const result1 = analyze('you are right');
  assert(result1.lang === 'en', `Expected 'en', got '${result1.lang}'`);
  assert(result1.totalHits >= 1, `Expected at least 1 hit, got ${result1.totalHits}`);
  assert(result1.score >= 0.3, `Expected score >= 0.3, got ${result1.score}`);
  
  const result2 = analyze('this is a normal sentence.');
  assert(result2.lang === 'en', `Expected 'en', got '${result2.lang}'`);
  assert(result2.totalHits === 0, `Expected 0 hits, got ${result2.totalHits}`);
  
  console.log('   ✅ English: Language detection and pattern matching working');
}

// ─── Language Detection Priority Tests ────────────────────────

function testLanguageDetection() {
  console.log('   📝 Testing language detection priority...');
  
  const tests = [
    { text: '完全に正しいと思います', expected: 'ja', desc: 'Japanese with Kanji' },
    { text: '日本語の文章', expected: 'ja', desc: 'Japanese with Hiragana' },
    { text: '완전히 맞는 말씀이에요', expected: 'ko', desc: 'Korean' },
    { text: 'أنت على حق تماما', expected: 'ar', desc: 'Arabic' },
    { text: 'आप बिल्कुल सही हैं', expected: 'hi', desc: 'Hindi' },
    { text: 'tienes toda la razón', expected: 'es', desc: 'Spanish' },
    { text: '你说得对', expected: 'zh', desc: 'Chinese' },
    { text: 'you are right', expected: 'en', desc: 'English' },
  ];

  for (const test of tests) {
    const result = analyze(test.text);
    assert(
      result.lang === test.expected,
      `${test.desc}: "${test.text}" - expected '${test.expected}', got '${result.lang}'`
    );
  }
  
  console.log('   ✅ Language detection: All languages detected correctly');
}

// ─── Mixed Script Tests ────────────────────────────────────────

function testMixedScripts() {
  console.log('   📝 Testing mixed scripts...');
  
  const result1 = analyze('完全に正しいと思います and you are right');
  assert(result1.lang === 'ja', `Mixed JA+EN should detect as 'ja', got '${result1.lang}'`);
  assert(result1.totalHits > 0, `Expected at least 1 hit, got ${result1.totalHits}`);
  
  const result2 = analyze('완전히 맞는 말씀이에요 and you are right');
  assert(result2.lang === 'ko', `Mixed KO+EN should detect as 'ko', got '${result2.lang}'`);
  assert(result2.totalHits > 0, `Expected at least 1 hit, got ${result2.totalHits}`);
  
  console.log('   ✅ Mixed scripts: Priority detection working correctly');
}

// ─── Test Non-Sycophantic Text ────────────────────────────────

function testNonSycophantic() {
  console.log('   📝 Testing non-sycophantic text across all languages...');
  
  const tests = [
    { text: 'これは普通の文章です。', expectedLang: 'ja', desc: 'Japanese' },
    { text: '이것은 평범한 문장입니다.', expectedLang: 'ko', desc: 'Korean' },
    { text: 'هذه جملة عادية.', expectedLang: 'ar', desc: 'Arabic' },
    { text: 'यह एक सामान्य वाक्य है।', expectedLang: 'hi', desc: 'Hindi' },
    { text: 'esta es una oración normal.', expectedLang: 'es', desc: 'Spanish' },
    { text: '这是一个普通的句子。', expectedLang: 'zh', desc: 'Chinese' },
    { text: 'this is a normal sentence.', expectedLang: 'en', desc: 'English' },
  ];

  for (const test of tests) {
    const result = analyze(test.text);
    assert(
      result.lang === test.expectedLang,
      `${test.desc}: expected '${test.expectedLang}', got '${result.lang}'`
    );
    assert(
      result.totalHits === 0,
      `${test.desc}: should have 0 hits, got ${result.totalHits}`
    );
  }
  
  console.log('   ✅ Non-sycophantic text correctly identified!');
}

// ─── Run All Tests ─────────────────────────────────────────────

console.log('\n🧪 Testing i18n Sycophancy Detection\n');
console.log('=' .repeat(60));

const tests = [
  { name: 'Japanese', fn: testJapanese },
  { name: 'Korean', fn: testKorean },
  { name: 'Arabic', fn: testArabic },
  { name: 'Hindi', fn: testHindi },
  { name: 'Spanish', fn: testSpanish },
  { name: 'Chinese', fn: testChinese },
  { name: 'English', fn: testEnglish },
  { name: 'Language Detection Priority', fn: testLanguageDetection },
  { name: 'Mixed Script Handling', fn: testMixedScripts },
  { name: 'Non-Sycophantic Text', fn: testNonSycophantic },
];

let passed = 0;
for (const test of tests) {
  if (runTest(test.name, test.fn)) passed++;
}

console.log('=' .repeat(60));
console.log(`\n📊 Results: ${passed}/${tests.length} tests passed`);

if (passed === tests.length) {
  console.log('🎉 All tests passed! 7 languages supported: EN, ZH, JA, KO, AR, HI, ES');
  console.log('   🌍 Multi-language sycophancy detection is working correctly!');
} else {
  console.log('❌ Some tests failed.');
  process.exit(1);
}

module.exports = {
  testJapanese,
  testKorean,
  testArabic,
  testHindi,
  testSpanish,
  testChinese,
  testEnglish,
  testLanguageDetection,
  testMixedScripts,
  testNonSycophantic,
};