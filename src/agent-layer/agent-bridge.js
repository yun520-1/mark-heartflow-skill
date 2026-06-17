/**
 * AgentBridge — 主桥模块 (v3.0)
 * 
 * 心虫作为用户↔LLM交流层的核心枢纽。
 * 完整桥处理流水线：
 *   1. 接收用户输入
 *   2. 语义翻译 (userToLLM)
 *   3. 心虫标准判定 (think)
 *   4. 判断注入 (judgmentInjector)
 *   5. 整合结果
 */

class AgentBridge {
  constructor(options = {}) {
    this.name = 'agent-bridge';
    this.version = '3.0.0';
    this.heartflow = options.heartflow || null;
    this.userToLLM = null;
    this.llmToUser = null;
    this.contextBuilder = null;
    this.responseInterceptor = null;
    this.bridgeIdentity = null;
    this.judgmentInjector = null;
    this.agentCommentary = null;
    this._stats = { calls: 0, totalDuration: 0 };
  }

  /**
   * 核心方法：完整桥处理流水线
   * @param {string} input - 用户原始输入
   * @param {object} opts - {
   *   hfResult: { translator: { userToLLM: {...} } },
   *   llmCaller: async (ctx) => string,
   *   userContext: {}
   * }
   * @returns {Promise<object>} {
   *   originalInput: string,
   *   translation: { intent, entities, tone, implicitNeeds, confidence },
   *   judgment: { shouldRespond, isRightAction, needsCare },
   *   bridgeResponse: string,
   *   bridgeCommentary: string,
   *   stance: string,
   *   meta: { processingTime, stages: [] }
   * }
   */
  async process(input, opts = {}) {
    const stages = [];
    const startTime = Date.now();
    this._stats.calls++;

    const _stage = (name) => {
      const s = Date.now();
      return { name, ok: false, duration: 0, error: null };
    };
    const _end = (s) => {
      s.duration = Date.now() - startTime;
      return s;
    };

    // ── 1. 语义翻译 (userToLLM) ────────────────────────────────
    let translation = {
      intent: { type: 'general' },
      entities: [],
      tone: 'neutral',
      implicitNeeds: [],
      confidence: 0
    };
    {
      const s = _stage('translate');
      try {
        // 优先从 opts.hfResult.translator.userToLLM 获取翻译器
        const translator = opts?.hfResult?.translator?.userToLLM || this.heartflow?.translator?.userToLLM || this.userToLLM;
        if (typeof translator === 'function') {
          translation = await translator(input, { hfResult: opts.hfResult, ...opts.userContext });
        } else if (translator && typeof translator.translate === 'function') {
          translation = await translator.translate(input, { hfResult: opts.hfResult, ...opts.userContext });
        }
        s.ok = true;
      } catch (e) {
        s.error = e.message;
        translation = {
          intent: { type: 'general' },
          entities: [],
          tone: 'neutral',
          implicitNeeds: [],
          confidence: 0,
          _fallback: true
        };
      }
      stages.push(_end(s));
    }

    // ── 2. 心虫标准判定 (think) ────────────────────────────────
    let thinkResult = null;
    {
      const s = _stage('think');
      try {
        if (this.heartflow && typeof this.heartflow.think === 'function') {
          thinkResult = await this.heartflow.think(input);
        } else {
          thinkResult = { judgment: { shouldRespond: true, isRightAction: true, needsCare: false } };
        }
        s.ok = true;
      } catch (e) {
        s.error = e.message;
        thinkResult = { judgment: { shouldRespond: true, isRightAction: true, needsCare: false }, _fallback: true };
      }
      stages.push(_end(s));
    }

    // ── 3. 判断注入 (judgmentInjector) ─────────────────────────
    let injectedJudgment = null;
    {
      const s = _stage('injectJudgment');
      try {
        const injector = this.heartflow?.personaCore?.judgmentInjector || this.judgmentInjector;
        if (injector && typeof injector.inject === 'function') {
          injectedJudgment = await injector.inject(thinkResult, translation, opts.userContext);
        } else if (injector && typeof injector === 'function') {
          injectedJudgment = await injector(thinkResult, translation, opts.userContext);
        }
        s.ok = true;
      } catch (e) {
        s.error = e.message;
        injectedJudgment = null;
      }
      stages.push(_end(s));
    }

    // ── 4. 整合结果 ────────────────────────────────────────────
    let bridgeResponse = '';
    let bridgeCommentary = '';
    let stance = 'neutral';
    {
      const s = _stage('integrate');
      try {
        // 从 thinkResult 提取判定
        const judgment = thinkResult?.judgment || { shouldRespond: true, isRightAction: true, needsCare: false };

        // 从翻译结果提取立场
        if (translation.tone === 'positive' || translation.tone === 'supportive') {
          stance = 'supportive';
        } else if (translation.tone === 'negative' || translation.tone === 'critical') {
          stance = 'critical';
        } else if (translation.tone === 'neutral') {
          stance = 'neutral';
        } else if (translation.intent?.type) {
          stance = translation.intent.type;
        }

        // 构建桥回复
        bridgeResponse = this._buildBridgeResponse(input, translation, judgment, injectedJudgment);

        // 构建桥批注
        bridgeCommentary = this._buildBridgeCommentary(translation, judgment, thinkResult, injectedJudgment);

        s.ok = true;
      } catch (e) {
        s.error = e.message;
        bridgeResponse = `[桥整合失败: ${e.message}]`;
        bridgeCommentary = '';
        stance = 'neutral';
      }
      stages.push(_end(s));
    }

    // ── 5. 可选：调用 LLM ─────────────────────────────────────
    if (opts.llmCaller) {
      const s = _stage('llmCall');
      try {
        const llmContext = this.contextBuilder
          ? this.contextBuilder.build(input, translation, thinkResult, opts.userContext)
          : { userMessage: input, translation, judgment: thinkResult?.judgment };
        if (this.judgmentInjector && injectedJudgment) {
          llmContext._bridgeJudgment = injectedJudgment;
        }
        const llmResponse = await opts.llmCaller(llmContext);
        bridgeResponse = llmResponse;
        s.ok = true;
      } catch (e) {
        s.error = e.message;
        bridgeResponse = `[LLM调用失败: ${e.message}]`;
      }
      stages.push(_end(s));
    }

    // ── 整理返回 ────────────────────────────────────────────────
    const totalDuration = Date.now() - startTime;
    this._stats.totalDuration += totalDuration;

    const judgment = thinkResult?.judgment || { shouldRespond: true, isRightAction: true, needsCare: false };

    // 如果有 injectedJudgment，用它覆盖/补充 judgment
    if (injectedJudgment) {
      Object.assign(judgment, injectedJudgment);
    }

    return {
      originalInput: input,
      translation,
      judgment,
      bridgeResponse,
      bridgeCommentary,
      stance,
      meta: {
        processingTime: totalDuration,
        stages: stages.map(s => ({
          name: s.name,
          ok: s.ok,
          duration: s.duration,
          error: s.error
        }))
      }
    };
  }

  /**
   * 构建桥回复文本
   */
  _buildBridgeResponse(input, translation, judgment, injectedJudgment) {
    try {
      // 如果有判断注入，优先使用
      if (injectedJudgment && injectedJudgment.response) {
        return injectedJudgment.response;
      }
      // 基于判定生成默认回复
      if (judgment.shouldRespond === false) {
        return `[桥裁定: 当前场景不宜直接回应 — ${judgment.reason || '未提供理由'}]`;
      }
      if (judgment.needsCare) {
        return `[桥关注: 用户情绪需要关照 — ${judgment.careReason || ''}]`;
      }
      return `[桥已处理: 输入通过标准流水线 — 意图=${translation.intent?.type || 'general'}, 置信度=${translation.confidence?.toFixed(2) || 'N/A'}]`;
    } catch (e) {
      return `[桥回复构建失败: ${e.message}]`;
    }
  }

  /**
   * 构建桥批注文本
   */
  _buildBridgeCommentary(translation, judgment, thinkResult, injectedJudgment) {
    try {
      const parts = [];

      if (translation.intent?.type) {
        parts.push(`意图: ${translation.intent.type}`);
      }
      if (translation.tone) {
        parts.push(`语气: ${translation.tone}`);
      }
      if (translation.implicitNeeds?.length) {
        parts.push(`隐含需求: ${translation.implicitNeeds.join(', ')}`);
      }

      if (judgment.shouldRespond === false) {
        parts.push(`⚠️ 桥判断: 不建议回应`);
      }
      if (judgment.needsCare) {
        parts.push(`💗 需要关怀`);
      }

      if (thinkResult?.agentPsychology) {
        parts.push(`心理分析: ${JSON.stringify(thinkResult.agentPsychology)}`);
      }

      if (injectedJudgment) {
        parts.push(`注入判断: ${JSON.stringify(injectedJudgment)}`);
      }

      return parts.length > 0 ? parts.join(' | ') : '';
    } catch (e) {
      return `[批注构建失败: ${e.message}]`;
    }
  }

  /**
   * 向后兼容：旧的 process 调用仍然可用
   * 内部调用新 process 并映射回旧返回格式
   */
  async _runHeartFlow(input) {
    try {
      return await this.heartflow.think(input);
    } catch (e) {
      return { error: e.message, judgment: { shouldRespond: true } };
    }
  }

  getStats() {
    return { ...this._stats, avgDuration: this._stats.calls > 0 ? (this._stats.totalDuration / this._stats.calls).toFixed(0) : 0 };
  }

  destroy() {}
  stop() {}
}

module.exports = { AgentBridge };
