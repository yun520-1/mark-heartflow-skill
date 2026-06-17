/**
 * ResponseCompressor — LLM输出压缩器
 * 去除LLM回复中的废话、过度确认、冗余表达，保留核心信息。
 */
class ResponseCompressor {
  constructor() {
    this.name = 'response-compressor';
    this.version = '1.0.0';
  }
  compress(text, options = {}) {
    if (!text || typeof text !== 'string') return { compressed: '', stats: { original: 0, compressed: 0, ratio: 0 } };
    const original = text;
    let result = text;
    // 1. 去除开场白
    result = result.replace(/^(好的[，。！]?|好的吧[，。！]?|明白了[，。！]?|明白[，。！]?|当然[，。！]?|没问题[，。！]?|很高兴[，。！]?|让我来[，。！]?|我来[，。！]?)\s*/gm, '');
    // 2. 去除AI身份声明
    result = result.replace(/作为一个AI|作为一个人工智能|我是AI|我是人工智能助手|我是一个AI助手/gm, '');
    // 3. 去除结尾客套
    result = result.replace(/如果您有任何问题，随时问我|有什么我可以帮你的吗|希望这个回答对你有帮助|希望能帮到你|祝您愉快|祝好[！!。]?$/gm, '');
    // 4. 去除多余空行
    result = result.replace(/\n{3,}/g, '\n\n');
    // 5. 压缩连续空格
    result = result.replace(/[ ]{2,}/g, ' ');
    // 6. 去除末尾emoji
    result = result.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}]+$/u, '');
    // 7. 如果太长且options.preferShort，截断
    if (options.preferShort && result.length > 600) {
      const lines = result.split('\n');
      const keyLines = lines.filter(l => /^[-*\d]|关键|重要|核心|总之|总结/.test(l.trim()));
      if (keyLines.length > 0) {
        result = keyLines.slice(0, 5).join('\n');
      } else {
        result = result.substring(0, 600) + '\n\n[...]';
      }
    }
    result = result.trim();
    return {
      compressed: result,
      stats: {
        originalLength: original.length,
        compressedLength: result.length,
        ratio: (result.length / Math.max(original.length, 1)).toFixed(2),
        savedChars: original.length - result.length
      }
    };
  }
  destroy() {}
  stop() {}
}
module.exports = { ResponseCompressor };
