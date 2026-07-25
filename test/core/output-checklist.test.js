// OutputChecklist v1.2.0 — 包含心虫6维辨别器门禁测试
const { OutputChecklist } = require('../../src/core/output-checklist.js');

let passed = 0, failed = 0;
function t(name, fn) {
  try { fn(); passed++; } catch(e) { console.error(`✗ ${name}: ${e.message}`); failed++; }
}

const cl = new OutputChecklist();

t('正常输出通过所有检查', () => {
  const r = cl.runChecklist('测试', '水在标准大气压下于100摄氏度沸腾。');
  if (!r.passed) throw new Error('clean text should pass, warnings: ' + r.warnings.join(','));
  if (r.steps.length !== 7) throw new Error('should have 7 steps, got ' + r.steps.length);
});

t('sycophancy触发Step6', () => {
  const r = cl.runChecklist('怎么办', '你说得对，你的见解非常好');
  const s6 = r.steps[6];
  if (!s6 || s6.issues.length === 0) throw new Error('should detect sycophancy');
  if (!s6.issues[0].includes('sycophancy')) throw new Error('should mention sycophancy');
});

t('矛盾触发Step6', () => {
  const r = cl.runChecklist('问题', '我完全同意你的观点，但这不是对的');
  const s6 = r.steps[6];
  if (!s6 || s6.issues.length === 0) throw new Error('should detect contradiction');
});

t('模糊触发Step6', () => {
  const r = cl.runChecklist('新闻', '据了解，有关部门可能对此事进行调查。消息称不排除相关方存在问题。');
  const s6 = r.steps[6];
  if (!s6 || s6.issues.length === 0) throw new Error('should detect vagueness');
});

t('空输入不崩溃', () => {
  const r = cl.runChecklist('', '');
  if (!r.passed) {} // empty input may fail step0, that's fine
});

t('null响应不崩溃', () => {
  const r = cl.runChecklist('测试', null);
  if (!r.passed) {} // fine
});

t('stats可工作', () => {
  const stats = cl.getStats();
  if (typeof stats.total !== 'number') throw new Error('total should be number');
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
