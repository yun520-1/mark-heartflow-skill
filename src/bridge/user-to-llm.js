/**
 * user-to-llm.js — 用户输入 → LLM 翻译层 (v1.0.0)
 *
 * 将用户输入转换为 LLM 友好的上下文指令。
 * 接口（被 heartflow.js stub 调用）:
 *   translate(input, ctx) → { prompt, context, hints }
 */

class UserToLLM {
  constructor(options = {}) {
    this.options = options;
  }

  /**
   * 翻译用户输入为 LLM 指令
   * @param {string} input - 用户原始输入
   * @param {object} ctx - 上下文 { emotion, type, route, ... }
   * @returns {{ prompt, context, hints }}
   */
  translate(input, ctx = {}) {
    const text = typeof input === 'string' ? input : String(input || '');
    const type = ctx.type || ctx.route || 'general';

    // 结构化的 LLM 指令（基于心虫判别结果）
    const prompt = [
      `用户输入: ${text.slice(0, 2000)}`,
      ctx.emotion ? `用户情绪: ${ctx.emotion}` : null,
      ctx.route ? `建议处理路径: ${ctx.route}` : null,
      ctx.confidence ? `输入置信度: ${ctx.confidence}` : null,
    ].filter(Boolean).join('\n');

    return {
      prompt,
      context: {
        type,
        emotion: ctx.emotion || 'neutral',
        route: ctx.route || 'chat',
        overallScore: ctx.overallScore ?? 0.5,
      },
      hints: [
        ctx.emotion && ctx.emotion !== 'neutral' ? '先回应情绪再给事实' : '直接回答问题',
        ctx.route === 'hold' ? '暂缓判断，先澄清需求' : '正常处理',
      ].filter(Boolean),
    };
  }
}

module.exports = { UserToLLM };
