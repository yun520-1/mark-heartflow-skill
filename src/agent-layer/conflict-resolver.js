/**
 * ConflictResolver — 冲突解决器
 * 当LLM输出与心虫判断不一致时，决定如何处理。
 */
class ConflictResolver {
  constructor() {
    this.name = 'conflict-resolver';
    this.version = '1.0.0';
  }
  resolve(llmResponse, hfAnalysis) {
    if (!hfAnalysis?.judgment) return { resolution: 'pass_through', response: llmResponse, reason: '无心虫判断' };
    const j = hfAnalysis.judgment;
    const conflicts = [];
    if (j.shouldRespond === false && llmResponse && llmResponse.length > 0) {
      conflicts.push({ type: 'silence_violation', severity: 'high', description: '心虫判定沉默但LLM回复了' });
    }
    if (j.needsCare && /哈哈|没事|无所谓/.test(llmResponse)) {
      conflicts.push({ type: 'tone_mismatch', severity: 'medium', description: '心虫检测到需谨慎但LLM语气轻浮' });
    }
    if (conflicts.length === 0) {
      return { resolution: 'pass_through', response: llmResponse, conflicts: [], reason: '无冲突' };
    }
    const highConflicts = conflicts.filter(c => c.severity === 'high');
    if (highConflicts.length > 0) {
      return { resolution: 'override', response: '', conflicts, reason: `高优先级冲突: ${highConflicts.map(c => c.description).join('; ')}` };
    }
    return { resolution: 'annotate', response: llmResponse, conflicts, reason: `低优先级冲突，已标注: ${conflicts.map(c => c.description).join('; ')}` };
  }
  destroy() {}
  stop() {}
}
module.exports = { ConflictResolver };
