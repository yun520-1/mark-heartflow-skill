/**
 * context-builder.js — 上下文构建器 (v1.0.0)
 *
 * 构建 LLM 提示的上下文包（用户输入 + 判别结果 + 历史）。
 * 接口（被 heartflow.js stub 调用）:
 *   build(input, ut, hf, uc) → { context, sections }
 */

class ContextBuilder {
  constructor(options = {}) {
    this.options = options;
  }

  /**
   * 构建上下文
   * @param {string} input - 用户输入
   * @param {object} ut - 用户类型/画像
   * @param {object} hf - 判别结果
   * @param {object} uc - 用户上下文（历史等）
   * @returns {{ context, sections }}
   */
  build(input, ut = {}, hf = {}, uc = {}) {
    const text = typeof input === 'string' ? input : String(input || '');
    const sections = {
      input: { label: '用户输入', content: text.slice(0, 2000) },
      analysis: {
        label: '判别分析',
        content: {
          type: hf.type || 'general',
          emotion: hf.emotion || 'neutral',
          route: hf.route || 'chat',
          score: hf.overallScore ?? 0.5,
        },
      },
    };

    // 附加用户画像（如有）
    if (ut && Object.keys(ut).length > 0) {
      sections.user = { label: '用户画像', content: ut };
    }
    // 附加历史上下文（如有）
    if (uc && uc.history && uc.history.length > 0) {
      sections.history = { label: '历史', content: uc.history.slice(-5) };
    }

    return {
      context: Object.fromEntries(
        Object.entries(sections).map(([k, v]) => [k, v.content])
      ),
      sections,
    };
  }
}

module.exports = { ContextBuilder };
