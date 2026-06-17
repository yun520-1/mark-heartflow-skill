/**
 * FollowupSuggester — 追问建议器
 * 基于心虫分析，在回复中建议用户可能想追问的方向。
 */
class FollowupSuggester {
  constructor() {
    this.name = 'followup-suggester';
    this.version = '1.0.0';
  }
  suggest(hfAnalysis, userTranslation) {
    const suggestions = [];
    if (!hfAnalysis && !userTranslation) return { suggestions: [], count: 0 };
    const intent = userTranslation?.intent?.type;
    const whatIsThis = hfAnalysis?.judgment?.whatIsThis;
    if (intent === 'explain') {
      suggestions.push({ type: 'deepen', text: '想更深入理解原理吗？', priority: 'medium' });
    }
    if (intent === 'compare') {
      suggestions.push({ type: 'extend', text: '需要对比更多维度吗？', priority: 'medium' });
    }
    if (whatIsThis?.isRushing) {
      suggestions.push({ type: 'slow_down', text: '不急，需要先理清哪个部分？', priority: 'high' });
    }
    if (userTranslation?.implicitNeeds?.needs?.some(n => n.type === 'decision_support')) {
      suggestions.push({ type: 'decision', text: '需要我帮你分析各选项的利弊吗？', priority: 'high' });
    }
    if (userTranslation?.tone?.emotion === 'frustrated') {
      suggestions.push({ type: 'empathy', text: '需要换个角度聊聊吗？', priority: 'low' });
    }
    return { suggestions: suggestions.slice(0, 3), count: suggestions.length };
  }
  destroy() {}
  stop() {}
}
module.exports = { FollowupSuggester };
