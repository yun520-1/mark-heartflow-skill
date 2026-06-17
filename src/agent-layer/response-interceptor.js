/**
 * ResponseInterceptor — LLM输出拦截器 (v3.0)
 * 
 * 拦截LLM的原始输出，执行三层心虫后处理：
 *   1. judgmentInjector — 注入心虫的判断（是否该回应、需要谨慎等）
 *   2. stanceDetector — 检测心虫对用户观点的立场是否一致
 *   3. agentCommentary — 生成桥的独立批注
 * 
 * 整合结果返回给调用方，由调用方决定是否/如何展示。
 */
class ResponseInterceptor {
  constructor() {
    this.name = 'response-interceptor';
    this.version = '3.0.0';
  }

  /**
   * 拦截并增强LLM响应
   * @param {object|string} response - LLM原始响应（对象或字符串）
   * @param {object} heartflow - HeartFlow 实例（含 personaCore）
   * @param {object} userTranslation - 用户翻译对象（含 intent, tone 等）
   * @returns {{originalResponse, modifiedResponse, commentary, stanceMatch, conflictNote, injectedJudgment}}
   */
  intercept(response, heartflow, userTranslation) {
    // ── 前置保护 ────────────────────────────────────────────────
    if (!response) {
      return {
        originalResponse: '',
        modifiedResponse: '',
        commentary: null,
        stanceMatch: true,
        conflictNote: 'LLM返回为空，拦截器跳过',
        injectedJudgment: null,
      };
    }

    // 提取原始文本：response 可能是对象（chainResult）或字符串
    let originalResponse = '';
    try {
      if (typeof response === 'string') {
        originalResponse = response;
      } else if (response && typeof response === 'object') {
        // chainResult 结构：{ output: { conclusion, ... }, decision, ... }
        originalResponse = response.output?.conclusion
          || response.conclusion
          || response.response
          || JSON.stringify(response);
      }
    } catch (_) {
      originalResponse = String(response);
    }

    // 提取 hfAnalysis（兼容两种传入方式）
    const hfAnalysis = (response && typeof response === 'object' && response.decision)
      ? response        // chainResult 自带 decision
      : (heartflow?._lastAnalysis || null);

    // ── 1. 注入心虫判断 (judgmentInjector) ──────────────────────
    let injectedJudgment = null;
    try {
      const injector = heartflow?.personaCore?.judgmentInjector;
      if (injector && typeof injector.inject === 'function') {
        injectedJudgment = injector.inject(hfAnalysis, userTranslation);
      }
    } catch (e) {
      injectedJudgment = { _error: e.message };
    }

    // ── 2. 检测立场一致性 (stanceDetector) ──────────────────────
    let stanceResult = null;
    try {
      const detector = heartflow?.personaCore?.stanceDetector;
      if (detector && typeof detector.detect === 'function') {
        // 传入原始 response 作为用户输入（或从 chainResult 提取 input）
        const userInput = (response && typeof response === 'object' && response.input)
          ? response.input
          : originalResponse;
        stanceResult = detector.detect(userInput, hfAnalysis);
      }
    } catch (e) {
      stanceResult = { stances: [], overall: 'neutral', hasStrongOpinion: false, _error: e.message };
    }

    // ── 3. 生成桥批注 (agentCommentary) ─────────────────────────
    let commentaryResult = null;
    try {
      const commentator = heartflow?.personaCore?.agentCommentary;
      if (commentator && typeof commentator.generate === 'function') {
        commentaryResult = commentator.generate(hfAnalysis, userTranslation, originalResponse);
      }
    } catch (e) {
      commentaryResult = { comments: [{ type: 'error', text: `批注生成异常: ${e.message}`, priority: 'low' }], count: 1, hasHighPriority: false };
    }

    // ── 4. 整合结果 ─────────────────────────────────────────────
    let modifiedResponse = originalResponse;
    let commentary = null;
    const stanceMatch = stanceResult
      ? !stanceResult.hasStrongOpinion
      : true;
    let conflictNote = null;

    // 根据 judgmentInjector 结果修改响应
    if (injectedJudgment) {
      if (injectedJudgment.shouldAvoid && injectedJudgment.shouldAvoid.length > 0) {
        // 将避免建议标记为元信息（不直接修改原文）
        conflictNote = conflictNote || [];
        conflictNote.push(`[心虫建议避免: ${injectedJudgment.shouldAvoid.join(', ')}]`);
      }
      if (injectedJudgment.bridgeNotes && injectedJudgment.bridgeNotes.length > 0) {
        // 桥注记作为批注的一部分
        commentary = commentary || { comments: [] };
        for (const note of injectedJudgment.bridgeNotes) {
          commentary.comments.push({ type: 'bridgeNote', text: note, priority: 'medium' });
        }
      }
    }

    // 根据 stanceDetector 结果标记冲突
    if (stanceResult && stanceResult.hasStrongOpinion) {
      conflictNote = (conflictNote || []).concat(
        `[立场冲突] 心虫检测到与用户观点存在分歧 (${stanceResult.overall})`
      );
      // 附加立场标注到 modifiedResponse（不改变原文意思，仅标注）
      modifiedResponse = originalResponse;
    }

    // 根据 agentCommentary 组装最终批注文本
    if (commentaryResult && commentaryResult.comments && commentaryResult.comments.length > 0) {
      if (commentary) {
        // 合并已有的 bridgeNotes 和 commentaryResult
        commentary.comments = [...commentary.comments, ...commentaryResult.comments];
        commentary.count = commentary.comments.length;
        commentary.hasHighPriority = commentary.hasHighPriority || commentaryResult.hasHighPriority;
      } else {
        commentary = commentaryResult;
      }
    }

    // 将 conflictNote 从数组转为字符串
    if (Array.isArray(conflictNote)) {
      conflictNote = conflictNote.join(' | ');
    }

    // ── 5. 如果心虫判定不应回应，标记为沉默 ─────────────────────
    const judgment = hfAnalysis?.decision || (response && typeof response === 'object' ? response.decision : null);
    if (judgment && judgment.shouldRespond === false) {
      modifiedResponse = '[心虫判定此场景更适合倾听]';
    }

    return {
      originalResponse,
      modifiedResponse,
      commentary: commentary
        ? (typeof commentary.comments === 'object'
          ? commentary.comments.map(c => c.text).filter(Boolean).join('\n')
          : JSON.stringify(commentary))
        : null,
      stanceMatch,
      conflictNote,
      injectedJudgment,
    };
  }

  destroy() {}
  stop() {}
}

module.exports = { ResponseInterceptor };
