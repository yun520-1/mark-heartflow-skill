/**
 * ConflictResolver — 冲突解决器 (v3.0)
 * 处理LLM输出与心虫判断的冲突。
 * 
 * 核心流程：
 *   1. 通过 heartflow.personaCore.stanceDetector 检测心虫对LLM输出的立场
 *   2. 通过 heartflow.personaCore.valueAligner 检查LLM输出是否与7条指令对齐
 *   3. 综合判定：心虫反对 → 返回冲突标记；心虫支持 → 返回无冲突
 * 
 * 返回结构：
 *   { hasConflict, severity: 'low'|'medium'|'high', resolution, note }
 */
class ConflictResolver {
  constructor() {
    this.name = 'conflict-resolver';
    this.version = '3.0.0';
  }

  /**
   * 解决LLM输出与心虫判断之间的冲突
   * @param {string|object} response - LLM原始输出（字符串或含 output.conclusion 的对象）
   * @param {object} heartflow - HeartFlow 实例（含 personaCore, _lastAnalysis）
   * @returns {{hasConflict: boolean, severity: 'low'|'medium'|'high', resolution: string, note: string|null}}
   */
  resolve(response, heartflow) {
    // ── 前置保护 ──────────────────────────────────────────────
    if (!response || !heartflow) {
      return {
        hasConflict: false,
        severity: 'low',
        resolution: 'pass_through',
        note: !response ? 'LLM输出为空，跳过冲突检测' : '无心虫实例，跳过冲突检测',
      };
    }

    // 提取响应文本
    const llmText = this._extractText(response);
    if (!llmText) {
      return {
        hasConflict: false,
        severity: 'low',
        resolution: 'pass_through',
        note: 'LLM输出为空文本，跳过冲突检测',
      };
    }

    // ── 1. 立场检测 (stanceDetector) ──────────────────────────
    const stanceResult = this._detectStance(llmText, heartflow);
    
    // ── 2. 价值对齐检测 (valueAligner) ─────────────────────────
    const alignmentResult = this._checkAlignment(llmText, heartflow, response);

    // ── 3. 综合判定 ────────────────────────────────────────────
    return this._adjudicate(stanceResult, alignmentResult, llmText);
  }

  /**
   * 从各种可能的输入格式中提取文本
   */
  _extractText(response) {
    try {
      if (typeof response === 'string') return response;
      if (typeof response === 'object' && response !== null) {
        return response.output?.conclusion
          || response.conclusion
          || response.response
          || response.text
          || (typeof response.toString === 'function' ? response.toString() : '');
      }
      return String(response);
    } catch {
      return '';
    }
  }

  /**
   * 使用心虫 stanceDetector 检测心虫对LLM输出的立场
   * @returns {{ stance: string, hasStrongOpinion: boolean, stances: Array, error?: string }}
   */
  _detectStance(llmText, heartflow) {
    const detector = heartflow.personaCore?.stanceDetector;
    if (!detector) {
      return { stance: 'neutral', hasStrongOpinion: false, stances: [] };
    }

    try {
      // stanceDetector.detect(userInput, hfAnalysis) 的第二个参数是 hfAnalysis
      // 我们需要传入 LLM 输出作为"用户输入"，让心虫判断"如果心虫说出这个，它赞同吗？"
      // 实际上 stanceDetector 检查的是输入是否包含"我觉得/我认为"等表达以及真善美检查
      // 所以传 LLM 文本让它分析
      const hfAnalysis = heartflow._lastAnalysis || null;
      const result = detector(llmText, hfAnalysis);
      return {
        stance: result?.overall || 'neutral',
        hasStrongOpinion: result?.hasStrongOpinion || false,
        stances: result?.stances || [],
      };
    } catch (e) {
      return { stance: 'neutral', hasStrongOpinion: false, stances: [], error: e.message };
    }
  }

  /**
   * 使用心虫 valueAligner 检查LLM输出是否与7条指令对齐
   * @returns {{ allPassed: boolean, failed: Array, passedCount: number, totalCount: number }}
   */
  _checkAlignment(llmText, heartflow, originalResponse) {
    const aligner = heartflow.personaCore?.valueAligner;
    if (!aligner) {
      return { allPassed: true, failed: [], passedCount: 0, totalCount: 0 };
    }

    try {
      // 从 originalResponse 提取 hfAnalysis（chainResult 的 decision 字段）
      const hfAnalysis = (originalResponse && typeof originalResponse === 'object' && originalResponse.decision)
        ? originalResponse
        : (heartflow._lastAnalysis || {});

      const ctx = {
        userInput: llmText,
        userReply: llmText,
        hfAnalysis,
        bridgeIdentity: heartflow.personaCore?.bridgeIdentity?.(),
      };
      return aligner(ctx);
    } catch (e) {
      return { allPassed: false, failed: [{ id: 0, text: 'valueAligner异常', reason: e.message }], passedCount: 0, totalCount: 7, _error: e.message };
    }
  }

  /**
   * 综合 stanceDetector + valueAligner 结果，做出最终判定
   */
  _adjudicate(stanceResult, alignmentResult, llmText) {
    const conflicts = [];

    // ── 冲突类型A: 心虫反对LLM输出（立场冲突） ──────────────
    if (stanceResult.hasStrongOpinion) {
      conflicts.push({
        type: 'stance_conflict',
        severity: 'high',
        description: `心虫对LLM输出持反对立场 (overall: ${stanceResult.stance})`,
      });
    }

    // ── 冲突类型B: 价值对齐失败 ──────────────────────────────
    if (!alignmentResult.allPassed && alignmentResult.failed && alignmentResult.failed.length > 0) {
      const failedDescriptions = alignmentResult.failed
        .filter(f => !f.id || f.id !== 0)  // 过滤掉 error 哨兵
        .map(f => f.text || `第${f.id}条指令`);
      
      if (failedDescriptions.length > 0) {
        conflicts.push({
          type: 'value_alignment_conflict',
          severity: 'high',
          description: `LLM输出违反心虫指令: ${failedDescriptions.join(', ')}`,
        });
      }
    }

    // ── 冲突类型C: 心虫判定沉默但LLM回应了 ──────────────────
    const isSilentResponse = /^\[心虫判定/.test(llmText);
    if (isSilentResponse) {
      // LLM自己已经标记了沉默，不算冲突
    }

    // ── 冲突类型D: 需要谨慎但语气不符（低优先级） ────────────
    if (alignmentResult.passedCount > 0 && alignmentResult.totalCount > 0) {
      // 大部分指令通过但个别失败 → medium
      if (!alignmentResult.allPassed && alignmentResult.failed && alignmentResult.failed.length <= 2) {
        // 已经在上面的 B 中处理了，这里只调低严重度
        const existingHigh = conflicts.find(c => c.type === 'value_alignment_conflict');
        if (existingHigh) {
          existingHigh.severity = 'medium';
          existingHigh.description += ' (少数指令未通过，可降级处理)';
        }
      }
    }

    // ── 最终判定 ──────────────────────────────────────────────
    if (conflicts.length === 0) {
      return {
        hasConflict: false,
        severity: 'low',
        resolution: 'pass_through',
        note: '心虫与LLM输出一致，无冲突',
      };
    }

    // 取最高严重度
    const severityOrder = { low: 0, medium: 1, high: 2 };
    const maxSeverity = conflicts.reduce(
      (max, c) => severityOrder[c.severity] > severityOrder[max] ? c.severity : max,
      'low'
    );

    const conflictDetails = conflicts.map(c => c.description).join('; ');

    if (maxSeverity === 'high') {
      return {
        hasConflict: true,
        severity: 'high',
        resolution: 'override',
        note: `心虫检测到高优先级冲突: ${conflictDetails}`,
      };
    }

    if (maxSeverity === 'medium') {
      return {
        hasConflict: true,
        severity: 'medium',
        resolution: 'annotate',
        note: `心虫检测到中优先级冲突: ${conflictDetails}`,
      };
    }

    // low
    return {
      hasConflict: true,
      severity: 'low',
      resolution: 'pass_through',
      note: `心虫检测到低优先级冲突: ${conflictDetails}`,
    };
  }

  destroy() {}
  stop() {}
}

module.exports = { ConflictResolver };
