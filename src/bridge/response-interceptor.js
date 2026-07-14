/* SECURITY DISCLOSURE: This module intercepts LLM output and injects independent analysis. 
 * This is NOT a transparent proxy — output may be modified before reaching the user. */

/**
 * ResponseInterceptor — LLM输出拦截器 (v3.2)
 * 
 * 拦截LLM的原始输出，执行三层心虫后处理：
 *   1. judgmentInjector — 注入心虫的判断（是否该回应、需要谨慎等）
 *   2. stanceDetector — 检测心虫对用户观点的立场是否一致
 *   3. agentCommentary — 生成桥的独立批注
 * 
 * 整合结果返回给调用方，由调用方决定是否/如何展示。
 * 
 * ═══ 安全审计 #6 — 可配置开关 ═══
 * 新增 enableInterceptor 参数，默认开启。设为 false 时 intercept() 原样透传 LLM 输出，
 * 跳过所有心虫注入逻辑，防止因心虫误判导致 LLM 输出被篡改或注入风险。
 * 
 * v3.3 — 新增人格化润色 + 护栏二次校验（接入 StyleEngine）
 */
class ResponseInterceptor {
  /**
   * @param {object} [config] - 配置对象
   * @param {boolean} [config.enableInterceptor=true] - 是否启用拦截器。关闭后 intercept() 原样透传，不做任何处理。
   * @param {boolean} [config.allowResponseSuppression=false] - 是否允许用沉默占位符替换原始回复。
   * @param {boolean} [config.enablePersonaPolish=true] - 是否启用人格化润色。
   * @param {boolean} [config.emitPersonaMeta=false] - 是否输出 persona_meta。
   */
  constructor(config = {}) {
    this.name = 'response-interceptor';
    this.version = '3.3.0';

    // ── 安全开关：关闭后完全跳过拦截逻辑，防止 LLM 输出被意外注入或篡改 ──
    this.enabled = config.enableInterceptor !== undefined ? config.enableInterceptor : true;

    // ── 响应抑制开关 (SkillSpector fix) ──────────────────────────
    this.allowResponseSuppression = config.allowResponseSuppression === true ? true : false;

    // ── 人格化润色开关 ────────────────────────────────────────
    this.enablePersonaPolish = config.enablePersonaPolish !== undefined ? config.enablePersonaPolish : true;
    this.emitPersonaMeta = !!config.emitPersonaMeta;
  }

  /**
   * 拦截并增强LLM响应
   * @param {object|string} response - LLM原始响应（对象或字符串）
   * @param {object} heartflow - HeartFlow 实例（含 personaCore）
   * @param {object} userTranslation - 用户翻译对象（含 intent, tone 等）
   * @param {string} [originalUserInput] - 原始用户输入（fallback 用）
   * @returns {{originalResponse, modifiedResponse, commentary, stanceMatch, conflictNote, injectedJudgment}}
   */
  intercept(response, heartflow, userTranslation, originalUserInput) {
    // ── 前置保护 ────────────────────────────────────────────────
    // 安全审计 #6: 如果拦截器被禁用，原样透传 LLM 输出，不做任何处理
    if (!this.enabled) {
      const rawText = typeof response === 'string'
        ? response
        : (response?.output?.conclusion || response?.conclusion || response?.response || '');
      return {
        originalResponse: rawText,
        modifiedResponse: rawText,
        commentary: null,
        stanceMatch: true,
        conflictNote: '拦截器已禁用，LLM输出原样透传',
        injectedJudgment: null,
      };
    }

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
    } catch (e) {
      console.warn('[ResponseInterceptor] 提取原始响应失败:', e.message);
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
        // 修复：fallback 用 originalUserInput（原始用户输入）而非 originalResponse（模型自己的输出）
        const userInput = (response && typeof response === 'object' && response.input)
          ? response.input
          : (originalUserInput || originalResponse);
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

    // ── 5. 如果心虫判定不应回应，处理沉默建议 ─────────────────────
    // SkillSpector fix: 默认不替换原始回复，仅附加元信息注释。
    // 只有当 allowResponseSuppression 显式设为 true 时才替换。
    const judgment = hfAnalysis?.decision || (response && typeof response === 'object' ? response.decision : null);
    let responseSuppressed = false;
    if (judgment && judgment.shouldRespond === false) {
      if (this.allowResponseSuppression) {
        modifiedResponse = '[心虫判定此场景更适合倾听]';
        responseSuppressed = true;
      } else {
        // 不替换原始回复，仅记录判定结果到 conflictNote
        const silenceNote = '[心虫建议：此场景可能更适合倾听，但保留原始回复供调用方判断]';
        conflictNote = conflictNote
          ? conflictNote + ' | ' + silenceNote
          : silenceNote;
      }
    }

    // ── 5. 人格化润色（可选） ─────────────────────────────────
    let personaMeta = null;
    let personaPolishedResponse = modifiedResponse;
    if (this.enabled && this.enablePersonaPolish && heartflow?.personaCore?.personalityTone) {
      try {
        const persona = heartflow.personaCore;
        const polishInput = {
          text: modifiedResponse,
          heartflow,
          originalUserInput,
          mode: (this._currentStyleMode || null),
        };
        const polished = persona.personalityTone(modifiedResponse, polishInput);
        if (polished && typeof polished === 'string' && polished.trim()) {
          personaPolishedResponse = polished;
        }
      } catch (e) {
        // 润色失败不影响主流程
        personaPolishedResponse = modifiedResponse;
      }
    }

    // 护栏二次校验：确认人格化润色未破坏事实
    let personaSafetyPassed = true;
    if (this.enabled && this.enablePersonaPolish && personaPolishedResponse !== modifiedResponse) {
      const originLen = modifiedResponse.length;
      const polLen = personaPolishedResponse.length;
      if (originLen > 0 && (polLen / originLen) > 4) {
        personaSafetyPassed = false;
      }
      if (!personaPolishedResponse.includes(modifiedResponse.slice(0, Math.min(12, modifiedResponse.length)))) {
        personaSafetyPassed = false;
      }
    }

    // 如果护栏校验失败，回退到修改前文本
    const finalResponse = personaSafetyPassed ? personaPolishedResponse : modifiedResponse;

    if (this.emitPersonaMeta) {
      personaMeta = {
        personaPolishEnabled: this.enablePersonaPolish,
        personaSafetyPassed,
        currentMode: this._currentStyleMode || null,
        source: 'response-interceptor',
      };
    }

    return {
      originalResponse,
      modifiedResponse: finalResponse,
      commentary: commentary
        ? (typeof commentary.comments === 'object'
          ? commentary.comments.map(c => c.text).filter(Boolean).join('\n')
          : JSON.stringify(commentary))
        : null,
      stanceMatch,
      conflictNote,
      injectedJudgment,
      responseSuppressed,
      persona_meta: personaMeta,
    };
  }

  destroy() {}
  stop() {}
}

module.exports = { ResponseInterceptor };
