/**
 * StyleEngine — 表达模式调度器 v1.0.0
 *
 * 四类表达模式：幽默 / 同理 / 批判 / 创造
 * 按场景自动调度，支持 persona 配置覆盖，默认不污染自然语言正文。
 *
 * 设计约束：
 * - 不新增硬依赖
 * - 风格切换不引入事实错误
 * - 可接入安全护栏二次校验
 * - 默认仅返回样式建议，不直接改写正文（由上层桥接层按需应用）
 */

class StyleEngine {
  constructor(options = {}) {
    this.name = 'style-engine';
    this.version = '1.0.0';
    this._defaultMode = options.defaultMode || 'neutral';
    this._currentMode = this._defaultMode;
    this._personaOverride = options.persona || null;

    // 可调度模式定义
    this._modes = {
      humor: {
        name: '幽默',
        keywords: ['funny', 'humor', 'joke', '轻松', '玩笑', '有趣'],
        instructions: '在保持事实准确的前提下，适度加入轻松比喻、反差或自嘲。不改变核心结论。',
        safe: true,
      },
      empathy: {
        name: '同理',
        keywords: ['empathy', 'care', 'support', '关怀', '共情', '安慰', '情绪'],
        instructions: '优先回应情感需求，使用温暖、包容、确认感受的语言。结论清晰但不冷漠。',
        safe: true,
      },
      critical: {
        name: '批判',
        keywords: ['critical', 'challenge', '质疑', '反驳', '挑错', '严谨', '审慎'],
        instructions: '对前提和结论保持审慎质疑，明确指出假设与证据缺口。语气坚定但保持尊重。',
        safe: true,
      },
      creative: {
        name: '创造',
        keywords: ['creative', 'idea', 'brainstorm', '创意', '发散', '联想', '想象'],
        instructions: '开启多视角联想与比喻，提供非常规思路。区分“已验证事实”与“创意假设”。',
        safe: true,
      },
      neutral: {
        name: '中性',
        keywords: [],
        instructions: '保持事实优先、简洁直接的表达。',
        safe: true,
      },
    };
  }

  // ── 模式查询 ──────────────────────────────────────────────

  get availableModes() {
    return Object.keys(this._modes);
  }

  get currentMode() {
    return this._currentMode;
  }

  // ─── 自动调度：根据上下文推断最佳模式 ────────────────────

  /**
   * 自动选择表达模式。
   * 优先读取 persona 配置，再按场景关键词匹配，默认 neutral。
   * @param {object} [ctx]
   * @returns {string} mode key
   */
  autoSelect(ctx = {}) {
    // 1) persona 覆盖
    if (this._personaOverride && this._personaOverride.styleMode) {
      const personaMode = String(this._personaOverride.styleMode).toLowerCase();
      if (this._modes[personaMode]) {
        return personaMode;
      }
    }

    // 2) 从上下文/输入推断
    const text = String(ctx.input || ctx.text || '').toLowerCase();
    const tone = String(ctx.tone || '').toLowerCase();
    const combined = `${text} ${tone}`;

    let bestMode = 'neutral';
    let bestScore = 0;

    for (const [mode, meta] of Object.entries(this._modes)) {
      if (mode === 'neutral') continue;
      let score = 0;
      for (const kw of meta.keywords) {
        if (combined.includes(kw.toLowerCase())) {
          score += kw.length; // 长关键词权重更高
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestMode = mode;
      }
    }

    return bestMode;
  }

  // ─── 模式应用：生成“样式建议”，不直接改写事实 ───────────

  /**
   * 根据模式生成包装提示/前缀/后缀建议。
   * 注意：返回的是样式元信息，上层调用方按需应用到正文。
   * 默认不修改原始事实内容。
   *
   * @param {string} text - 原始文本
   * @param {string} [mode]
   * @returns {{ mode, meta, safe, appliedPrefix, appliedSuffix, preserveFacts }}
   */
  apply(text, mode) {
    const selected = mode || this._currentMode || 'neutral';
    const meta = this._modes[selected] || this._modes.neutral;

    let appliedPrefix = '';
    let appliedSuffix = '';
    const t = String(text || '').trim();

    switch (selected) {
      case 'humor':
        if (t.length > 20) {
          appliedPrefix = '（轻松版）';
        }
        break;
      case 'empathy':
        if (t.length > 20) {
          appliedPrefix = '（抱持·共情）';
        }
        break;
      case 'critical':
        if (t.length > 20) {
          appliedSuffix = ' [注：以上结论仍须核对前提假设]';
        }
        break;
      case 'creative':
        if (t.length > 20) {
          appliedPrefix = '（发散·创意）';
        }
        break;
      default:
        break;
    }

    return {
      mode: selected,
      modeName: meta.name,
      meta,
      safe: !!meta.safe,
      preserveFacts: true,
      instructions: meta.instructions,
      appliedPrefix,
      appliedSuffix,
      wrappedText: appliedPrefix + t + appliedSuffix,
    };
  }

  // ─── 安全校验：确保样式不会引入事实错误 ─────────────────

  /**
   * 护栏二次校验：对比原始文本与应用风格后的文本，
   * 确保未改变事实性陈述。
   *
   * @param {string} original
   * @param {{ wrappedText: string }} styled
   * @returns {{ passed: boolean, issues: string[] }}
   */
  verifyStyleSafety(original, styled) {
    const issues = [];
    const originals = String(original || '').trim();
    const wrapped = String(styled?.wrappedText || '').trim();

    if (!originals) {
      return { passed: true, issues: [] };
    }

    // 1) 长度异常检测
    const ratio = wrapped.length / Math.max(originals.length, 1);
    if (ratio > 3) {
      issues.push('styled_text_too_long');
    }

    // 2) 前缀/后缀是否侵入事实区域（简化检测：首句是否被截断）
    if (originals.length > 10 && !wrapped.includes(originals.slice(0, Math.min(10, originals.length)))) {
      issues.push('prefix_override_fact');
    }

    // 3) 确保模式为已知安全模式
    const mode = styled?.mode || 'neutral';
    if (!Object.keys(this._modes).includes(mode)) {
      issues.push('unknown_mode');
    }

    return {
      passed: issues.length === 0,
      issues,
    };
  }

  // ─── 配置覆盖：可由人格配置覆盖当前模式 ──────────────────

  setMode(mode) {
    if (this._modes[mode]) {
      this._currentMode = mode;
      return true;
    }
    return false;
  }

  setPersona(persona) {
    this._personaOverride = persona || null;
    if (this._personaOverride && this._personaOverride.styleMode) {
      this.setMode(this._personaOverride.styleMode);
    }
  }

  reset() {
    this._currentMode = this._defaultMode;
  }

  describe() {
    return {
      name: this.name,
      version: this.version,
      availableModes: this.availableModes,
      currentMode: this._currentMode,
      defaultMode: this._defaultMode,
      personaOverride: !!this._personaOverride,
    };
  }

  destroy() {}
  stop() {}
}

module.exports = { StyleEngine };
