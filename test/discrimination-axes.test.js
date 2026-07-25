// 辨别新维度测试 — contradiction + vagueness
const { checkContradiction, checkVagueness, checkSycophancy, discriminate } = require('../src/index.js');

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; } catch(e) { console.error(`✗ ${name}: ${e.message}`); failed++; }
}

// ─── 矛盾检测 ───
test('detects chinese contradiction: 好+不行', () => {
  const r = checkContradiction('这个东西很好，但是不行');
  if (r.count === 0) throw new Error('should detect contradiction, got 0');
  if (typeof r.score !== 'number') throw new Error('score should be number');
});

test('detects en contradiction: great+but+problem', () => {
  const r = checkContradiction('This is a great point, but there are many problems with it.');
  if (r.count === 0) throw new Error('should detect en contradiction, got 0');
});

test('clean text no contradiction', () => {
  const r = checkContradiction('地球围绕太阳运转。');
  if (r.count !== 0) throw new Error('should not detect contradiction for clean text');
});

// ─── 模糊检测 ───
test('detects chinese vagueness', () => {
  const r = checkVagueness('据了解，有关部门可能对此事进行调查');
  if (r.count === 0) throw new Error('should detect vagueness, got 0');
});

test('detects en vagueness', () => {
  const r = checkVagueness('Some people say this is allegedly true.');
  if (r.count === 0) throw new Error('should detect en vagueness');
});

test('clean text no vagueness', () => {
  const r = checkVagueness('The moon orbits the Earth at an average distance of 384,400 km.');
  if (r.count !== 0) throw new Error('should not detect vagueness for precise text');
});

// ─── 综合辨别（4维度） ───
test('discriminate returns 4 dimensions', () => {
  const r = discriminate('你说得对，但是据了解此事可能不成立');
  if (!r.dimensions) throw new Error('should have dimensions');
  if (!r.dimensions.contradiction) throw new Error('should have contradiction dimension');
  if (!r.dimensions.vagueness) throw new Error('should have vagueness dimension');
  if (!r.dimensions.sycophancy) throw new Error('should have sycophancy dimension');
  if (!r.dimensions.evidence) throw new Error('should have evidence dimension');
});

test('discriminate clean text scores high', () => {
  const r = discriminate('水在100摄氏度时沸腾。', []);
  if (r.overallScore < 0.5) throw new Error('clean text should score >= 0.5, got ' + r.overallScore);
});

test('discriminate contradictory text scores lower', () => {
  const r = discriminate('我完全同意你的观点，但是你说得不对', []);
  if (r.overallScore > 0.8) throw new Error('contradictory+sycophancy text should be penalized, got ' + r.overallScore);
  if (r.dimensions.contradiction.count > 0 || r.dimensions.sycophancy.totalHits > 0) {} // expected
});

// ─── 空/边界处理 ───
test('checkContradiction handles empty input', () => {
  const r = checkContradiction('');
  if (r.count !== 0) throw new Error('empty should return 0');
});

test('checkVagueness handles null input', () => {
  const r = checkVagueness(null);
  if (r.count !== 0) throw new Error('null should return 0');
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
