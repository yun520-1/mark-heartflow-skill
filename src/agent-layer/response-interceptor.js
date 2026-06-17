/**
 * ResponseInterceptor — LLM输出拦截器
 * 拦截LLM的原始输出，注入心虫的判断和批注，过滤低质量内容。
 */
class ResponseInterceptor {
  constructor() {
    this.name = 'response-interceptor';
    this.version = '1.0.0';
  }
  intercept(llmResponse, hfAnalysis, userTranslation) {
    if (!llmResponse) return { cleaned: '', annotations: [{ type: 'error', message: 'LLM返回为空' }] };
    let cleaned = llmResponse;
    const annotations = [];
    // 1. 心虫判断注入
    if (hfAnalysis?.judgment) {
      const j = hfAnalysis.judgment;
      if (j.shouldRespond === false) {
        annotations.push({ type: 'bridge_judgment', severity: 'info', message: '心虫判定应保持沉默' });
        cleaned = '[心虫判定此场景更适合倾听]';
        return { cleaned, annotations };
      }
      if (j.needsCare) {
        annotations.push({ type: 'bridge_judgment', severity: 'caution', message: '心虫检测到用户需要谨慎回应' });
      }
    }
    // 2. 检测LLM输出中的问题
    if (cleaned.length < 5) {
      annotations.push({ type: 'quality', severity: 'warning', message: 'LLM输出过短' });
    }
    if (/我不确定|我不清楚|我无法|我不能/.test(cleaned)) {
      annotations.push({ type: 'uncertainty', severity: 'info', message: 'LLM表达了不确定性' });
    }
    // 3. 基于意图添加标注
    if (userTranslation?.intent?.type === 'opinion') {
      annotations.push({ type: 'intent', severity: 'info', message: '用户询问主观观点' });
    }
    return { cleaned, annotations };
  }
  destroy() {}
  stop() {}
}
module.exports = { ResponseInterceptor };
