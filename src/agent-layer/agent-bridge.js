/**
 * AgentBridge — 主桥模块
 * 
 * 心虫作为用户↔LLM交流层的核心枢纽。
 * 接收用户输入→通过心虫分析→构建LLM上下文→调用LLM→拦截输出→翻译→返回。
 * 在整个流程中注入心虫的独立人格和判断力。
 */

class AgentBridge {
  constructor(options = {}) {
    this.name = 'agent-bridge';
    this.version = '1.0.0';
    this.heartflow = options.heartflow || null;
    this.userToLLM = null;  // 由外部注入
    this.llmToUser = null;
    this.contextBuilder = null;
    this.responseInterceptor = null;
    this.bridgeIdentity = null;
    this.judgmentInjector = null;
    this.agentCommentary = null;
    this._stats = { calls: 0, totalDuration: 0 };
  }

  /**
   * 核心方法：处理用户输入，返回用户可读的回复
   * @param {string} userInput - 用户原始输入
   * @param {object} options - { llmCaller: async (ctx) => string, userContext: {} }
   * @returns {object} { reply, originalLLM, translation, annotations, bridgeComment }
   */
  async process(userInput, options = {}) {
    const startTime = Date.now();
    this._stats.calls++;

    // Step 1: 心虫分析用户输入
    const hfAnalysis = this.heartflow ? await this._runHeartFlow(userInput) : null;

    // Step 2: 翻译为用户→LLM指令
    const userTranslation = this.userToLLM 
      ? this.userToLLM.translate(userInput, { hfAnalysis, ...options.userContext })
      : { original: userInput, intent: { type: 'general' } };

    // Step 3: 构建LLM上下文（含心虫分析结果 + 桥人格）
    const llmContext = this.contextBuilder
      ? this.contextBuilder.build(userInput, userTranslation, hfAnalysis, options.userContext)
      : { userMessage: userInput };

    // Step 4: 注入桥的判断
    if (this.judgmentInjector && hfAnalysis) {
      llmContext._bridgeJudgment = this.judgmentInjector.inject(hfAnalysis, userTranslation);
    }

    // Step 5: 调用LLM
    let llmResponse = '';
    if (options.llmCaller) {
      try {
        llmResponse = await options.llmCaller(llmContext);
      } catch (e) {
        llmResponse = `[LLM调用失败: ${e.message}]`;
      }
    }

    // Step 6: 拦截LLM输出，注入心虫判断
    const intercepted = this.responseInterceptor
      ? this.responseInterceptor.intercept(llmResponse, hfAnalysis, userTranslation)
      : { cleaned: llmResponse, annotations: [] };

    // Step 7: 翻译为LLM→用户语言
    const userReply = this.llmToUser
      ? this.llmToUser.translate(intercepted.cleaned, options.userContext)
      : { translated: intercepted.cleaned };

    // Step 8: 生成桥的批注
    const commentary = this.agentCommentary
      ? this.agentCommentary.generate(hfAnalysis, userTranslation, userReply)
      : null;

    const duration = Date.now() - startTime;
    this._stats.totalDuration += duration;

    return {
      reply: userReply.translated || userReply,
      originalLLM: llmResponse,
      translation: userReply,
      annotations: intercepted.annotations,
      bridgeComment: commentary,
      hfAnalysis: hfAnalysis ? { judgment: hfAnalysis.judgment, agentPsychology: hfAnalysis.agentPsychology } : null,
      stats: { duration, callIndex: this._stats.calls }
    };
  }

  async _runHeartFlow(input) {
    try {
      return await this.heartflow.think(input);
    } catch (e) {
      return { error: e.message, judgment: { shouldRespond: true } };
    }
  }

  getStats() { return { ...this._stats, avgDuration: this._stats.calls > 0 ? (this._stats.totalDuration / this._stats.calls).toFixed(0) : 0 }; }

  destroy() {}
  stop() {}
}

module.exports = { AgentBridge };
