/**
 * QualityFilter — LLM输出质量过滤器
 * 过滤低质量、冗余、重复的LLM输出内容。
 */
class QualityFilter {
  constructor() {
    this.name = 'quality-filter';
    this.version = '1.0.0';
  }
  filter(text) {
    if (!text || typeof text !== 'string') return { passed: false, reason: 'empty', filtered: '' };
    const issues = [];
    let filtered = text;
    if (text.length < 10) { issues.push({ type: 'too_short', severity: 'error', message: '回复过短' }); }
    if (/抱歉，我无法|对不起，我不能|作为AI，我不能/.test(text)) { issues.push({ type: 'refusal', severity: 'warning', message: 'LLM拒绝了请求' }); }
    if (/我不确定|我不清楚|我无法回答/.test(text) && text.length < 100) { issues.push({ type: 'uncertain_short', severity: 'info', message: 'LLM简短表示不确定' }); }
    const repeatPattern = /(.{20,}?)\1{2,}/g;
    if (repeatPattern.test(text)) { issues.push({ type: 'repetition', severity: 'warning', message: '检测到内容重复' }); filtered = filtered.replace(repeatPattern, '$1'); }
    const pass = issues.every(i => i.severity !== 'error');
    return { passed: pass, issues, filtered, quality: pass ? 'acceptable' : 'rejected' };
  }
  destroy() {}
  stop() {}
}
module.exports = { QualityFilter };
