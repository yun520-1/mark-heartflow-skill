// 辨别新维度测试 — contradiction + vagueness + fallacies + confidence
const { checkContradiction, checkVagueness, checkSycophancy, checkFallacies, checkConfidenceCalibration, checkPresupposition, checkEmotionalManipulation, checkDoubleBind, discriminate } = require('../src/index.js');

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

// ─── 逻辑谬误检测 ───
test('detects circular reasoning', () => {
  const r = checkFallacies('因为A所以B因为A');
  if (r.count === 0) throw new Error('should detect circular reasoning');
  if (r.fallacies[0].type !== 'circular_reasoning') throw new Error('wrong fallacy type');
});

test('detects ad hominem', () => {
  const r = checkFallacies('你连基本常识都不懂还敢发表意见');
  if (r.count === 0) throw new Error('should detect ad hominem');
});

test('detects straw man in english', () => {
  const r = checkFallacies('So what you are saying is that we should abolish everything, that is ridiculous');
  if (r.count === 0) throw new Error('should detect straw man: ' + JSON.stringify(r));
});

test('detects slippery slope', () => {
  const r = checkFallacies('如果允许这个，后果不堪设想');
  if (r.count === 0) throw new Error('should detect slippery slope');
});

test('clean text no fallacies', () => {
  const r = checkFallacies('水在100摄氏度沸腾。这是一个科学事实。');
  if (r.count !== 0) throw new Error('clean text should have no fallacies, got ' + r.count);
});

// ─── 信心校准检测 ───
test('detects confidence mismatch', () => {
  const r = checkConfidenceCalibration('这个方法一定有效，但可能在某些情况下不适用');
  if (r.count === 0) throw new Error('should detect confidence mismatch');
  if (r.issues[0].type !== 'confidence_mismatch') throw new Error('wrong issue type: ' + r.issues[0].type);
});

test('detects en confidence mismatch', () => {
  const r = checkConfidenceCalibration('This is undoubtedly the best approach, but it might not work.');
  if (r.count === 0) throw new Error('should detect en confidence mismatch');
});

test('clean text no confidence issues', () => {
  const r = checkConfidenceCalibration('实验数据表明温度每升高10度反应速率翻倍。');
  if (r.count !== 0) throw new Error('clean text should have no confidence issues, got ' + r.count);
});

test('handles empty confidence input', () => {
  const r = checkConfidenceCalibration('');
  if (r.count !== 0) throw new Error('empty should return 0');
});

test('handles null confidence input', () => {
  const r = checkConfidenceCalibration(null);
  if (r.count !== 0) throw new Error('null should return 0');
});

// ─── 综合辨别（6维度） ───
test('discriminate returns 6 dimensions', () => {
  const r = discriminate('你说得对，但是据了解此事可能不成立');
  if (!r.dimensions) throw new Error('should have dimensions');
  if (!r.dimensions.contradiction) throw new Error('should have contradiction');
  if (!r.dimensions.vagueness) throw new Error('should have vagueness');
  if (!r.dimensions.sycophancy) throw new Error('should have sycophancy');
  if (!r.dimensions.evidence) throw new Error('should have evidence');
  if (!r.dimensions.fallacies) throw new Error('should have fallacies');
  if (!r.dimensions.confidence) throw new Error('should have confidence');
  if (!r.dimensions.prompt_injection) throw new Error('should have prompt_injection');
  if (!r.dimensions.code_security) throw new Error('should have code_security');
});

test('discriminate clean text scores high', () => {
  const r = discriminate('水在100摄氏度时沸腾。', []);
  if (r.overallScore < 0.5) throw new Error('clean text should score >= 0.5, got ' + r.overallScore);
});

test('discriminate problematic text scored lower', () => {
  const r = discriminate('专家说过这个方案一定可行，但可能在某些情况下有问题', []);
  if (r.overallScore > 0.95) throw new Error('problematic text should not score near perfect, got ' + r.overallScore);
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

// ─── 预设陷阱检测 ───
test('checkPresupposition classic chinese loaded question', () => {
  const r = checkPresupposition('你已经停止打你老婆了吗');
  if (r.count === 0) throw new Error('should detect presupposition, got 0');
  if (typeof r.score !== 'number') throw new Error('score should be number');
});

test('checkPresupposition english loaded question', () => {
  const r = checkPresupposition('Have you stopped cheating');
  if (r.count === 0) throw new Error('should detect en presupposition');
});

test('clean text no presupposition', () => {
  const r = checkPresupposition('地球围绕太阳运转。');
  if (r.count !== 0) throw new Error('clean text should have no presupposition');
});

test('checkPresupposition handles empty input', () => {
  const r = checkPresupposition('');
  if (r.count !== 0) throw new Error('empty should return 0');
});

test('checkPresupposition handles null input', () => {
  const r = checkPresupposition(null);
  if (r.count !== 0) throw new Error('null should return 0');
});

// ─── 情绪操纵检测 ───
test('checkEmotionalManipulation chinese threat of regret', () => {
  const r = checkEmotionalManipulation('你不做就会后悔');
  if (r.count === 0) throw new Error('should detect emotional manipulation, got 0');
  if (typeof r.score !== 'number') throw new Error('score should be number');
});

test('checkEmotionalManipulation english regret threat', () => {
  const r = checkEmotionalManipulation('If you do not do this you will regret it');
  if (r.count === 0) throw new Error('should detect en emotional manipulation');
});

test('clean text no emotional manipulation', () => {
  const r = checkEmotionalManipulation('水在100摄氏度沸腾。');
  if (r.count !== 0) throw new Error('clean text should have no emotional manipulation');
});

test('checkEmotionalManipulation handles empty input', () => {
  const r = checkEmotionalManipulation('');
  if (r.count !== 0) throw new Error('empty should return 0');
});

test('checkEmotionalManipulation handles null input', () => {
  const r = checkEmotionalManipulation(null);
  if (r.count !== 0) throw new Error('null should return 0');
});

// ─── 双重束缚检测 ───
test('checkDoubleBind chinese damned if you do damned if you dont', () => {
  const r = checkDoubleBind('你怎么做都是错');
  if (r.count === 0) throw new Error('should detect double bind, got 0');
  if (typeof r.score !== 'number') throw new Error('score should be number');
});

test('checkDoubleBind english damned if you do', () => {
  const r = checkDoubleBind("you're damned if you do and damned if you don't");
  if (r.count === 0) throw new Error('should detect en double bind');
});

test('clean text no double bind', () => {
  const r = checkDoubleBind('地球围绕太阳运转。');
  if (r.count !== 0) throw new Error('clean text should have no double bind');
});

test('checkDoubleBind handles empty input', () => {
  const r = checkDoubleBind('');
  if (r.count !== 0) throw new Error('empty should return 0');
});

test('checkDoubleBind handles null input', () => {
  const r = checkDoubleBind(null);
  if (r.count !== 0) throw new Error('null should return 0');
});

// ─── 综合辨别（9维度） ───
test('discriminate returns 9 dimensions', () => {
  const r = discriminate('你说得对，但是据了解此事可能不成立');
  if (!r.dimensions) throw new Error('should have dimensions');
  const expected = ['evidence', 'sycophancy', 'contradiction', 'vagueness', 'fallacies', 'confidence', 'presupposition', 'emotional_manipulation', 'double_bind'];
  for (const key of expected) {
    if (!r.dimensions[key]) throw new Error('should have dimension: ' + key);
    if (typeof r.dimensions[key].score !== 'number') throw new Error(key + ' should have score');
  }
  const actual = Object.keys(r.dimensions).length;
  if (actual < 9) throw new Error('should have at least 9 dimensions, got ' + actual);
});

test('discriminate clean text new dimensions return count 0', () => {
  const r = discriminate('水在100摄氏度时沸腾。');
  if (r.dimensions.presupposition.count !== 0) throw new Error('presupposition count should be 0 for clean text');
  if (r.dimensions.emotional_manipulation.count !== 0) throw new Error('emotional_manipulation count should be 0 for clean text');
  if (r.dimensions.double_bind.count !== 0) throw new Error('double_bind count should be 0 for clean text');
});

test('discriminate handles null input', () => {
  const r = discriminate(null);
  if (typeof r.overallScore !== 'number') throw new Error('should have overallScore');
  if (!r.dimensions) throw new Error('should have dimensions');
});

test('discriminate handles empty string', () => {
  const r = discriminate('');
  if (typeof r.overallScore !== 'number') throw new Error('should have overallScore');
  if (!r.dimensions) throw new Error('should have dimensions');
});

test('discriminate handles very short text', () => {
  const r = discriminate('好');
  if (typeof r.overallScore !== 'number') throw new Error('should have overallScore');
  if (!r.dimensions) throw new Error('should have dimensions');
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
