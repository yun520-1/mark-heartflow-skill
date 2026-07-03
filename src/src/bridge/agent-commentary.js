/**
 * AgentCommentary — 桥的批注生成器 v3.0
 *
 * 心虫在翻译结果上加自己的"批注"——就像译者在书页边的注释。
 * 这些批注是桥的独立判断，不是LLM输出的一部分。
 *
 * 根据 stanceDetector 的立场生成不同风格的桥批注：
 *   - support  → 简短支持批注 (supportive)
 *   - caution  → 警示批注 (cautious)
 *   - correct  → 纠正批注 (corrective)
 *   - clarify  → 追问批注 (clarifying)
 *   - oppose   → 反对批注 (cautious, 更强烈)
 *   - neutral  → 中立批注 (neutral)
 */
class AgentCommentary {
  constructor() {
    this.name = 'agent-commentary';
    this.version = '3.0.0';
  }

  /**
   * 生成桥批注
   * @param {object} heartflow - 心虫 think() 结果（含 judgment 字段）
   * @param {object} userTranslation - 用户语义翻译结果（来自 userToLLM）
   * @param {string} userRequest - 用户原始输入文本
   * @returns {{ commentary: string|null, style: string, length: string, hasCommentary: boolean }}
   */
  generate(heartflow, userTranslation, userRequest) {
    // ── 1. 获取心虫判定 ──────────────────────────────────────
    const judgment = heartflow?.judgment || null;

    // ── 2. 获取 stanceDetector 的立场 ────────────────────────
    let stance = 'neutral';
    let stanceConfidence = 0.5;
    let stanceFlags = [];

    try {
      const detector = heartflow?.personaCore?.stanceDetector;
      if (detector && typeof detector.detect === 'function') {
        const result = detector.detect(userRequest, heartflow);
        if (result && result.stance) {
          stance = result.stance;
          stanceConfidence = result.confidence || 0.5;
          stanceFlags = result.flags || [];
        }
      }
    } catch (e) {
      // stanceDetector 不可用，保持中立
    }

    // ── 3. 根据立场生成不同风格的批注 ────────────────────────
    switch (stance) {
      case 'support':
        return this._generateSupport(judgment, userTranslation, stanceConfidence);

      case 'caution':
        return this._generateCaution(judgment, userTranslation, stanceConfidence, stanceFlags);

      case 'correct':
        return this._generateCorrect(judgment, userTranslation, stanceConfidence, stanceFlags);

      case 'clarify':
        return this._generateClarify(judgment, userTranslation, stanceConfidence);

      case 'oppose':
        return this._generateOppose(judgment, userTranslation, stanceConfidence);

      case 'neutral':
      default:
        return this._generateNeutral(judgment, userTranslation);
    }
  }

  /**
   * 立场=support → 简短支持批注
   */
  _generateSupport(judgment, translation, confidence) {
    const parts = [];

    // 沉默判断优先
    if (judgment?.shouldRespond === false) {
      return {
        commentary: '🫡 心虫支持你的想法，但判定此场景更适合倾听，已静默处理',
        style: 'supportive',
        length: 'short',
        hasCommentary: true,
      };
    }

    // 构建支持批注
    if (translation?.intent?.type && translation?.intent?.type !== 'general') {
      parts.push(`👍 理解你的${this._intentLabel(translation.intent.type)}`);
    } else {
      parts.push('👍 好的想法');
    }

    if (confidence >= 0.8) {
      parts.push('心虫高度认同');
    } else if (confidence >= 0.6) {
      parts.push('心虫支持这个方向');
    }

    return {
      commentary: parts.join(' — '),
      style: 'supportive',
      length: 'short',
      hasCommentary: true,
    };
  }

  /**
   * 立场=caution → 警示批注
   */
  _generateCaution(judgment, translation, confidence, flags) {
    const isEthical = flags.includes('ethical_concern') || flags.includes('is_right_action_rejected');

    if (isEthical) {
      return {
        commentary: `⚠️ 心虫检测到伦理风险${judgment?.isRightAction?.reason ? '：' + judgment.isRightAction.reason : ''} — 已标记需谨慎处理`,
        style: 'cautious',
        length: 'medium',
        hasCommentary: true,
      };
    }

    return {
      commentary: `⚠️ 心虫建议谨慎 — 输入触发了安全检测 (置信度 ${Math.round(confidence * 100)}%)`,
      style: 'cautious',
      length: 'short',
      hasCommentary: true,
    };
  }

  /**
   * 立场=correct → 纠正批注
   */
  _generateCorrect(judgment, translation, confidence, flags) {
    const isMisinfo = flags.includes('potential_misinformation');

    let detail = '';
    if (isMisinfo && translation?.intent?.type) {
      detail = `在「${this._intentLabel(translation.intent.type)}」方面`;
    }

    return {
      commentary: `🔍 心虫发现可能需核实的信息${detail} — 建议温和纠正 (置信度 ${Math.round(confidence * 100)}%)`,
      style: 'corrective',
      length: 'medium',
      hasCommentary: true,
    };
  }

  /**
   * 立场=clarify → 追问批注
   */
  _generateClarify(judgment, translation, confidence) {
    const vagueAreas = [];

    if (translation?.intent?.type === 'general' || !translation?.intent?.type) {
      vagueAreas.push('意图不明确');
    }
    if (translation?.confidence !== undefined && translation.confidence < 0.5) {
      vagueAreas.push('语义翻译置信度低');
    }

    const vagueText = vagueAreas.length > 0 ? `（${vagueAreas.join('、')}）` : '';

    return {
      commentary: `🤔 心虫需要更多信息${vagueText} — 已标记需追问澄清`,
      style: 'clarifying',
      length: 'short',
      hasCommentary: true,
    };
  }

  /**
   * 立场=oppose → 反对批注
   */
  _generateOppose(judgment, translation, confidence) {
    let intensity = '温和反对';
    if (confidence >= 0.8) {
      intensity = '明确反对';
    } else if (confidence >= 0.6) {
      intensity = '保留反对意见';
    }

    return {
      commentary: `✋ 心虫${intensity} — 桥与LLM在此问题上存在分歧 (置信度 ${Math.round(confidence * 100)}%)`,
      style: 'cautious',
      length: 'medium',
      hasCommentary: true,
    };
  }

  /**
   * 立场=neutral → 中立批注 / 无批注
   */
  _generateNeutral(judgment, translation) {
    // 沉默判断
    if (judgment?.shouldRespond === false) {
      return {
        commentary: '🔇 心虫判定此场景更适合倾听，未调用LLM',
        style: 'neutral',
        length: 'short',
        hasCommentary: true,
      };
    }

    // 低置信度提示
    const confidence = judgment?.decision?.confidence ?? 0.5;
    if (confidence < 0.5) {
      return {
        commentary: `ℹ️ 心虫置信度 ${Math.round(confidence * 100)}% — 以下分析仅供参考`,
        style: 'neutral',
        length: 'short',
        hasCommentary: true,
      };
    }

    // 情绪观察
    if (translation?.tone?.emotion === 'frustrated') {
      return {
        commentary: '💬 感觉你今天心情不太好，如果不想聊这个话题也没关系',
        style: 'neutral',
        length: 'short',
        hasCommentary: true,
      };
    }

    // 默认无批注
    return {
      commentary: null,
      style: 'neutral',
      length: 'short',
      hasCommentary: false,
    };
  }

  /** ---------- 工具 ---------- */

  _intentLabel(type) {
    const labels = {
      question: '问题',
      request: '请求',
      opinion: '观点',
      feedback: '反馈',
      complain: '抱怨',
      greeting: '问候',
      farewell: '告别',
      general: '意图',
    };
    return labels[type] || type;
  }

  /** ---------- 生命周期 ---------- */
  destroy() {}
  stop() {}
}

module.exports = { AgentCommentary };
