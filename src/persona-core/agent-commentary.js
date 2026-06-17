/**
 * AgentCommentary — 桥的批注生成器
 * 心虫在翻译结果上加自己的"批注"——就像译者在书页边的注释。
 * 这些批注是桥的独立判断，不是LLM输出的一部分。
 */
class AgentCommentary {
  constructor() {
    this.name = 'agent-commentary';
    this.version = '1.0.0';
  }
  generate(hfAnalysis, userTranslation, userReply) {
    if (!hfAnalysis) return null;
    const comments = [];
    const j = hfAnalysis.judgment;
    if (j?.shouldRespond === false) {
      comments.push({ type: 'silence', text: '心虫判定此场景更适合倾听，未调用LLM', priority: 'high' });
    }
    if (j?.whatIsThis?.isRushing) {
      comments.push({ type: 'observation', text: '你似乎很急，如果需要精简回复可以告诉我', priority: 'medium' });
    }
    if (userTranslation?.tone?.emotion === 'frustrated') {
      comments.push({ type: 'observation', text: '感觉你今天心情不太好，如果不想聊这个话题也没关系', priority: 'low' });
    }
    const confidence = hfAnalysis.decision?.confidence ?? 0.5;
    if (confidence < 0.5) {
      comments.push({ type: 'uncertainty', text: `心虫置信度${Math.round(confidence*100)}%，以下分析仅供参考`, priority: 'medium' });
    }
    return {
      comments,
      count: comments.length,
      hasHighPriority: comments.some(c => c.priority === 'high'),
    };
  }
  destroy() {}
  stop() {}
}
module.exports = { AgentCommentary };
