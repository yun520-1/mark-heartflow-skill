/**
 * LLMToUser — LLM输出 → 用户语言翻译器
 * 
 * 将 LLM 返回的技术性/冗长输出，精炼为用户能一眼看懂的语言。
 * 核心能力：去冗余、保持关键信息、调整语气。
 */

class LLMToUser {
  constructor(options = {}) {
    this.name = 'llm-to-user';
    this.version = '1.0.0';
    this.options = options;
  }

  /**
   * 翻译LLM输出为用户友好语言
   * @param {string} llmOutput - LLM原始输出
   * @param {object} userContext - 用户上下文（偏好、理解水平）
   * @returns {object} { translated, original, compression, annotations }
   */
  translate(llmOutput, userContext = {}) {
    const startTime = Date.now();
    const original = llmOutput;
    const cleaned = this._cleanOutput(llmOutput);
    const compressed = this._compress(cleaned, userContext);
    const keyPoints = this._extractKeyPoints(cleaned);
    const annotations = this._generateAnnotations(cleaned, keyPoints);
    
    return {
      translated: this._formatOutput(compressed, annotations, userContext),
      original: original.substring(0, 500), // 保留原文开头供参考
      compression: {
        originalLength: original.length,
        compressedLength: compressed.length,
        ratio: (compressed.length / Math.max(original.length, 1)).toFixed(2),
        duration: Date.now() - startTime
      },
      keyPoints,
      annotations,
      timestamp: Date.now()
    };
  }

  _cleanOutput(text) {
    if (!text || typeof text !== 'string') return '';
    let cleaned = text;
    // 去除常见的LLM冗余表达
    const patterns = [
      /^(好的|好的，|好的！|明白了|明白|当然|没问题|很高兴|很荣幸)/,
      /^(作为一个AI|作为AI|作为一个人工智能|我是AI)/,
      /^(首先|第一|总的来说|综上所述|总而言之)/,
      /(如果您有任何问题|如果你还有其他问题|随时问我|有什么我可以帮你的)$/,
      /(希望这个回答|希望这能帮助|希望对你有帮助|希望能帮到你)$/,
      /(😊|🙂|👍|💪|✨|🌟|🎉|✅)$/,
      /(——|\u2014){2,}.*$/m,
    ];
    for (const p of patterns) {
      cleaned = cleaned.replace(p, '').trim();
    }
    return cleaned.trim();
  }

  _compress(text, context) {
    if (!text) return '';
    const maxLength = context.prefersShort ? 500 : 2000;
    if (text.length <= maxLength) return text;
    
    // 过长输出：保留前30%+后20%（关键信息通常在开头和结尾）
    const head = text.substring(0, Math.floor(maxLength * 0.6));
    const tail = text.substring(text.length - Math.floor(maxLength * 0.3));
    return `${head}\n\n[...中间省略 ${text.length - head.length - tail.length} 字符...]\n\n${tail}`;
  }

  _extractKeyPoints(text) {
    // 提取关键点：带编号的列表、加粗标记、总结句
    const points = [];
    const lines = text.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      // 编号列表项
      if (/^\d+[\.\)、]/.test(trimmed) && trimmed.length < 200) {
        points.push({ type: 'numbered', content: trimmed.replace(/^\d+[\.\)、]\s*/, '') });
      }
      // 破折号列表项
      if (/^[-•*]\s/.test(trimmed) && trimmed.length < 200) {
        points.push({ type: 'bullet', content: trimmed.replace(/^[-•*]\s*/, '') });
      }
      // 总结句（"总的来说"、"关键"、"重要"）
      if (/(总之|总的来说|关键|重要|核心|本质|记住)/.test(trimmed) && trimmed.length < 300) {
        points.push({ type: 'key', content: trimmed });
      }
    }
    return points.slice(0, 5);
  }

  _generateAnnotations(text, keyPoints) {
    const annotations = [];
    // 检测不确定性表达
    if (/可能|或许|大概|不确定|不一定|也许是/.test(text)) {
      annotations.push({ type: 'uncertainty', label: '含不确定性' });
    }
    // 检测推测性表达
    if (/推测|猜测|我认为|我觉得/.test(text)) {
      annotations.push({ type: 'speculation', label: '含推测' });
    }
    // 检测引用
    if (/根据|引用|参考|来源/.test(text)) {
      annotations.push({ type: 'reference', label: '有引用来源' });
    }
    // 检测建议
    if (/建议|推荐|应该|最好/.test(text)) {
      annotations.push({ type: 'suggestion', label: '含建议' });
    }
    return annotations;
  }

  _formatOutput(compressed, annotations, context) {
    let output = compressed;
    // 如果有不确定性标注，加前缀
    if (annotations.some(a => a.type === 'uncertainty')) {
      output = `[不确定] ${output}`;
    }
    return output;
  }

  destroy() {}
  stop() {}
}

module.exports = { LLMToUser };
