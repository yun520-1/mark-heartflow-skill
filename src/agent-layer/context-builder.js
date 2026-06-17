/**
 * ContextBuilder — LLM上下文构建器
 * 将用户输入 + 心虫分析 + 记忆 + 历史 + 桥人格 组装成LLM调用的完整上下文。
 */
class ContextBuilder {
  constructor() {
    this.name = 'context-builder';
    this.version = '1.0.0';
  }
  build(userInput, userTranslation, hfAnalysis, userContext = {}) {
    const ctx = {
      userMessage: userInput,
      _meta: {
        timestamp: Date.now(),
        intentType: userTranslation?.intent?.type || 'general',
        urgency: userTranslation?.tone?.urgency?.level || 'medium',
      }
    };
    // 注入心虫分析结果
    if (hfAnalysis) {
      ctx._heartFlowAnalysis = {
        judgment: hfAnalysis.judgment ? {
          shouldRespond: hfAnalysis.judgment.shouldRespond,
          needsCare: hfAnalysis.judgment.needsCare,
          whatIsThis: hfAnalysis.judgment.whatIsThis,
          isRightAction: hfAnalysis.judgment.isRightAction,
        } : null,
        agentPsychology: hfAnalysis.agentPsychology || null,
        agentPhilosophy: hfAnalysis.agentPhilosophy || null,
      };
    }
    // 注入用户上下文
    if (userContext.memory) ctx._memory = userContext.memory;
    if (userContext.history) ctx._history = userContext.history.slice(-10);
    if (userContext.preferences) ctx._preferences = userContext.preferences;
    // 注入翻译指导
    ctx._translationGuide = {
      constraints: userTranslation?.constraints || {},
      tone: userTranslation?.tone || {},
      implicitNeeds: userTranslation?.implicitNeeds || [],
    };
    return ctx;
  }
  destroy() {}
  stop() {}
}
module.exports = { ContextBuilder };
