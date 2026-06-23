/**
 * ConfidenceAnnotator — 4维置信度评估 + 不确定性标记
 *
 * 评估翻译结果在意图、实体、语气三个维度上的置信度，
 * 综合计算加权 overall 分，并标记不确定性类型。
 *
 * 升级点 (v2.0.0):
 *   - 4 维置信度评估：intent / entity / tone / overall（加权平均）
 *   - 不确定性标记系统：uncertaintyFlags 标识具体问题
 *   - 建议生成：根据置信度水平和标记提供 actionable 建议
 *   - 防御性输入处理：null/undefined/non-object 安全降级
 */

class ConfidenceAnnotator {
  constructor() {
    this.name = 'confidence-annotator';
    this.version = '2.0.0';
  }

  /**
   * 4 维置信度评估 + 不确定性标记
   *
   * @param {Object} translation  - 翻译结果（含 intent / entities / tone 等字段）
   * @param {string} [source='']  - 用户原文
   * @returns {{ overall: number, dimensions: {intent: number, entity: number, tone: number}, flags: string[], suggestion: string }}
   */
  annotate(translation, source = '') {
    // ── 防御性输入 ────────────────────────────────────────────
    if (!translation || typeof translation !== 'object') {
      return {
        overall: 0.5,
        dimensions: { intent: 0.5, entity: 0.5, tone: 0.5 },
        flags: ['missing_context'],
        suggestion: '翻译结果不可用，需重新提取'
      };
    }
    const src = (typeof source === 'string' ? source : '').trim();

    // ── 1. intentConfidence — 意图判断置信度 ──────────────
    const intent = translation.intent || {};
    const intentType = (intent.type || '').toLowerCase();
    const flags = [];

    let intentConfidence;
    // 明确关键词：对比、什么是、怎么、为什么、如何
    if (/^(对比|什么是|怎么|为什么|如何|怎样|哪个|哪些)/.test(src)) {
      intentConfidence = 0.9;
    }
    // 意图类型明确（非 general）
    else if (intentType && intentType !== 'general') {
      intentConfidence = 0.85;
    }
    // 模糊意图：我想知道、请问、能不能
    else if (/我想知道|请问|能不能|可不可以|有没有/.test(src)) {
      intentConfidence = 0.7;
    }
    // 非常模糊：那个东西、这个、一些
    else if (/那个东西|这个|一些|某种|之类的/.test(src)) {
      intentConfidence = 0.4;
    }
    // 无有效源文本
    else if (!src) {
      intentConfidence = 0.3;
      flags.push('missing_context');
    }
    // 默认中性
    else {
      intentConfidence = 0.6;
    }

    // ── 2. entityConfidence — 实体提取置信度 ─────────────
    const entities = translation.entities || {};
    const entityList = entities.items || entities.list || [];
    const entityCount = Array.isArray(entityList) ? entityList.length : 0;

    let entityConfidence;
    if (entityCount === 0) {
      entityConfidence = 0.4;
    } else {
      // 统计大写专有名词比例
      const properCount = entityList.filter(e => {
        const name = (typeof e === 'string' ? e : (e.name || e.text || ''));
        return /^[A-Z\u4e00-\u9fff]/.test(name) && name.length >= 2;
      }).length;
      const ratio = properCount / entityCount;

      if (ratio >= 0.6) {
        entityConfidence = 0.9;  // 多数字是专有名词
      } else if (ratio >= 0.3) {
        entityConfidence = 0.7;  // 混合
      } else {
        entityConfidence = 0.5;  // 大部分是常见词
      }

      // 检查罕见/拼写错误信号
      const hasRareEntities = entityList.some(e => {
        const name = (typeof e === 'string' ? e : (e.name || e.text || ''));
        return /[^a-zA-Z0-9\u4e00-\u9fff\s\-_]/.test(name) ||
               (name.length <= 1 && /[a-zA-Z]/.test(name));
      });
      if (hasRareEntities) {
        entityConfidence = Math.min(entityConfidence, 0.3);
        flags.push('multiple_interpretations');
      }
    }

    // ── 3. toneConfidence — 语气判断置信度 ────────────────
    const tone = translation.tone || {};
    const toneEmotion = tone.emotion || tone.type || '';

    let toneConfidence;
    // 有明显情绪词
    if (/生气|愤怒|开心|兴奋|悲伤|失望|焦虑|害怕|感激|感谢/.test(src)) {
      toneConfidence = 0.85;
    }
    // 语气有明确类型
    else if (toneEmotion && toneEmotion !== 'neutral') {
      toneConfidence = 0.8;
    }
    // 中性但短
    else if (src.length > 0 && src.length < 10) {
      toneConfidence = 0.6;
    }
    // 矛盾情绪信号：同时出现正面和负面情绪词
    else if (this._hasContradictorySignals(src)) {
      toneConfidence = 0.4;
      flags.push('contradictory_signals');
    }
    // 无源文本
    else if (!src) {
      toneConfidence = 0.5;
    }
    // 默认中性
    else {
      toneConfidence = 0.65;
    }

    // ── 标记 ambiguous_intent ────────────────────────────
    if (intentConfidence < 0.6 && !flags.includes('missing_context')) {
      flags.push('ambiguous_intent');
    }

    // ── 4. overall — 综合置信度（加权平均） ──────────────
    // 权重：意图 0.35，实体 0.35，语气 0.30
    const WEIGHTS = { intent: 0.35, entity: 0.35, tone: 0.30 };
    const overall = Math.round(
      (intentConfidence * WEIGHTS.intent +
       entityConfidence * WEIGHTS.entity +
       toneConfidence * WEIGHTS.tone) * 100
    ) / 100;

    // ── 去重 flags ────────────────────────────────────────
    const uniqueFlags = [...new Set(flags)];

    // ── 建议生成 ──────────────────────────────────────────
    const suggestion = this._generateSuggestion(overall, uniqueFlags);

    return {
      overall,
      dimensions: {
        intent: Math.round(intentConfidence * 100) / 100,
        entity: Math.round(entityConfidence * 100) / 100,
        tone: Math.round(toneConfidence * 100) / 100
      },
      flags: uniqueFlags,
      suggestion
    };
  }

  /**
   * 检测文本中是否存在矛盾情绪信号
   * @private
   */
  _hasContradictorySignals(text) {
    const positive = /开心|高兴|喜欢|爱|好|棒|赞|感谢|兴奋/.test(text);
    const negative = /生气|愤怒|恨|讨厌|差|烂|伤心|失望|焦虑/.test(text);
    return positive && negative;
  }

  /**
   * 根据 overall 置信度和标记生成建议
   * @private
   */
  _generateSuggestion(overall, flags) {
    if (overall >= 0.85 && flags.length === 0) {
      return '高置信度，可直接使用';
    }
    if (overall >= 0.7) {
      return '中等置信度，建议人工复核';
    }

    const parts = [];
    if (flags.includes('ambiguous_intent')) {
      parts.push('意图不明确，请用户补充');
    }
    if (flags.includes('multiple_interpretations')) {
      parts.push('存在多义实体，需进一步确认');
    }
    if (flags.includes('missing_context')) {
      parts.push('缺少上下文信息');
    }
    if (flags.includes('contradictory_signals')) {
      parts.push('情绪信号矛盾，需澄清真实意图');
    }
    if (parts.length === 0) {
      parts.push('置信度偏低，建议人工复核');
    }
    return parts.join('；');
  }

  destroy() {}
  stop() {}
}

module.exports = { ConfidenceAnnotator };
