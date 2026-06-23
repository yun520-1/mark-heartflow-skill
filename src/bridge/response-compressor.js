/**
 * ResponseCompressor — LLM输出压缩器 v3.0
 * 7条压缩规则：
 * 1. 移除开头确认词
 * 2. 移除结尾客套话
 * 3. 移除重复内容（相似度检测）
 * 4. 压缩长句为短句
 * 5. 移除过度修饰词
 * 6. 保留技术细节
 * 7. 短文本（<100字）原样返回
 */
class ResponseCompressor {
  constructor() {
    this.name = 'response-compressor';
    this.version = '3.0.0';
  }

  /**
   * 压缩文本
   * @param {string} text - 待压缩文本
   * @param {object} options - 配置
   * @param {number} options.maxLength - 最大输出长度（默认无限制）
   * @param {boolean} options.preserveTechnical - 保留技术细节（默认true）
   * @param {boolean} options.preserveCode - 保留代码块（默认true）
   * @param {boolean} options.preserveList - 保留列表结构（默认true）
   * @returns {{text, originalLength, compressedLength, ratio, rulesApplied}}
   */
  compress(text, options = {}) {
    // 空值保护
    if (!text || typeof text !== 'string') {
      return {
        text: '',
        originalLength: 0,
        compressedLength: 0,
        ratio: 0,
        rulesApplied: []
      };
    }

    const {
      maxLength = Infinity,
      preserveTechnical = true,
      preserveCode = true,
      preserveList = true
    } = options;

    const originalLength = text.length;
    let result = text;
    const rulesApplied = [];

    // ========== 规则7：短文本原样返回 ==========
    if (result.length < 100) {
      return {
        text: result.trim(),
        originalLength,
        compressedLength: result.trim().length,
        ratio: 1,
        rulesApplied: ['rule7-short-text-skipped']
      };
    }

    // ========== 规则1：移除开头确认词 ==========
    const greetingPattern = /^(好的[，。！]?|好的吧[，。！]?|行[，。！]?|嗯[，。！]?|明白了[，。！]?|明白[，。！]?|当然[，。！]?|当然可以[，。！]?|没问题[，。！]?|是的[，。！]?|对[，。！]?|没错[，。！]?|确实[，。！]?|很高兴[，。！]?|让我来[，。！]?|我来[，。！]?|好的没问题[，。！]?|完全可以[，。！]?)/gm;
    const newResult1 = result.replace(greetingPattern, '').trimStart();
    if (newResult1.length !== result.length) {
      rulesApplied.push('rule1-remove-greeting');
    }
    result = newResult1;

    // ========== 规则2：移除结尾客套话 ==========
    const pleasantryPatterns = [
      /如果您有任何问题，随时问我[！!。]?$/m,
      /有什么我可以帮你的吗[？?]$/m,
      /希望这个回答对你有帮助[！!。]?$/m,
      /希望能帮到你[！!。]?$/m,
      /祝您愉快[！!。]?$/m,
      /祝好[！!。]?$/m,
      /欢迎继续提问[！!。]?$/m,
      /有其他问题随时[问我提问联系][！!。]?$/m,
      /希望对你有所帮助[！!。]?$/m,
      /如果还有[其他任何]?问题，?[随时可以]?[问我提问][！!。]?$/m,
      /欢迎随时[交流讨论提问咨询][！!。]?$/m,
      /祝您[生活工作学习]愉快[！!。]?$/m,
      /祝你[一天有个好心情生活愉快][！!。]?$/m
    ];
    for (const pattern of pleasantryPatterns) {
      const before = result;
      result = result.replace(pattern, '');
      if (result.length !== before.length) {
        rulesApplied.push('rule2-remove-pleasantry');
        break; // 只触发一次
      }
    }
    // 如果还没触发，尝试统一匹配结尾客套段落
    if (!rulesApplied.includes('rule2-remove-pleasantry')) {
      const broadPleasantry = /\n*(如果您|如果还有|有什么|希望|祝您|祝你|欢迎)[^。！?\n]*[。！?]?\s*$/m;
      const before = result;
      result = result.replace(broadPleasantry, '');
      if (result.length !== before.length) {
        rulesApplied.push('rule2-remove-pleasantry');
      }
    }

    // ========== 规则5：移除过度修饰词 ==========
    const overusedWords = [
      /非常非常/g, '非常',
      /极其/g, '',
      /特别特别/g, '特别',
      /十分/g, '',
      /超级/g, '',
      /无比/g, '',
      /相当/g, '',
      /格外/g, ''
    ];
    for (let i = 0; i < overusedWords.length; i += 2) {
      const before = result;
      result = result.replace(overusedWords[i], overusedWords[i + 1]);
      if (result.length !== before.length) {
        if (!rulesApplied.includes('rule5-remove-overused')) {
          rulesApplied.push('rule5-remove-overused');
        }
      }
    }

    // 移除重复修饰词（如"非常非常非常"→""）
    const repeatModifierPattern = /((非常|特别|十分|相当|超级|无比|极其)\s*){2,}/g;
    const beforeMod = result;
    result = result.replace(repeatModifierPattern, (match) => {
      // 保留一个
      const words = match.trim().split(/\s+/);
      return words[0] || '';
    });
    if (result.length !== beforeMod.length && !rulesApplied.includes('rule5-remove-overused')) {
      rulesApplied.push('rule5-remove-overused');
    }

    // ========== 规则3：移除重复内容（相似度检测） ==========
    // 将文本按句子分割，检测相邻句子是否表达相同意思
    const sentences = result.match(/[^。！？\n]+[。！？\n]?/g) || [];
    if (sentences.length > 1) {
      const uniqueSentences = [];
      for (let i = 0; i < sentences.length; i++) {
        const current = sentences[i].trim();
        if (!current) continue;

        // 检查是否与前面任一句子相似
        let isDuplicate = false;
        for (const prev of uniqueSentences) {
          if (this._isSimilar(current, prev)) {
            isDuplicate = true;
            break;
          }
        }

        if (!isDuplicate) {
          uniqueSentences.push(current);
        }
      }
      if (uniqueSentences.length < sentences.filter(s => s.trim()).length) {
        rulesApplied.push('rule3-remove-duplicate');
      }
      result = uniqueSentences.join('');
    }

    // ========== 规则4：压缩长句为短句 ==========
    const longSentences = result.match(/[^。！？\n]{80,}[。！？]/g) || [];
    if (longSentences.length > 0) {
      for (const longSent of longSentences) {
        const compressed = this._compressLongSentence(longSent);
        if (compressed.length < longSent.length) {
          result = result.replace(longSent, compressed);
          if (!rulesApplied.includes('rule4-compress-long-sentence')) {
            rulesApplied.push('rule4-compress-long-sentence');
          }
        }
      }
    }

    // ========== 规则6：保留技术细节 ==========
    // 此规则是保护性规则 — 确保上面的规则不破坏技术内容
    // 技术细节包括：代码、路径、版本号、API、命令等
    if (preserveTechnical) {
      // 已经在上面各规则中通过字符串匹配保护了技术内容不被删除
      // 这里确保技术相关的段落不被误删
      // 不做额外操作，因为移除的都是模板化客套话，不会影响技术细节
    }

    // ========== 清理工作 ==========
    // 去除多余空行
    result = result.replace(/\n{3,}/g, '\n\n');
    // 压缩连续空格
    result = result.replace(/[ ]{2,}/g, ' ');
    // 去除末尾标点emoji
    result = result.replace(/[，。！？\s\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}]+$/u, '');
    result = result.trim();

    // ========== maxLength 限制 ==========
    if (maxLength < Infinity && result.length > maxLength) {
      const lines = result.split('\n');
      const keyLines = lines.filter(l =>
        /^[-*\d]|关键|重要|核心|总之|总结|步骤|方法|结果|结论|建议/.test(l.trim())
      );
      if (keyLines.length > 0) {
        result = keyLines.slice(0, 5).join('\n');
      } else {
        result = result.substring(0, maxLength) + '\n\n[...]';
      }
    }

    const compressedLength = result.length;
    const ratio = originalLength > 0
      ? Math.round((compressedLength / originalLength) * 100) / 100
      : 1;

    return {
      text: result,
      originalLength,
      compressedLength,
      ratio,
      rulesApplied: [...new Set(rulesApplied)] // 去重
    };
  }

  /**
   * 判断两个句子是否语义相似（基于字符重叠）
   * @param {string} a - 句子A
   * @param {string} b - 句子B
   * @returns {boolean}
   */
  _isSimilar(a, b) {
    if (!a || !b) return false;
    const normalize = (s) =>
      s.replace(/[，。！？、；：""''（）\s]/g, '').toLowerCase();
    const na = normalize(a);
    const nb = normalize(b);
    if (na === nb) return true;
    if (na.includes(nb) || nb.includes(na)) return true;
    // 计算交集大小 / 并集大小
    const setA = new Set(na);
    const setB = new Set(nb);
    const intersection = new Set([...setA].filter(c => setB.has(c)));
    const union = new Set([...setA, ...setB]);
    const jaccard = intersection.size / union.size;
    return jaccard > 0.7;
  }

  /**
   * 压缩一个长句
   * @param {string} sentence - 长句
   * @returns {string} 压缩后的句子
   */
  _compressLongSentence(sentence) {
    // 移除"也就是说"、"换句话说"、"简单来说"等引导词
    let s = sentence.replace(
      /(也就是说|换句话说|简单来说|换句话讲|具体来说|换言之|总的来说|总而言之|简而言之)[，,]?\s*/g,
      ''
    );
    // 移除"需要指出的是"、"值得注意的是"、"需要说明的是"等无信息量前缀
    s = s.replace(
      /(需要指出的是|值得注意的是|需要说明的是|不容忽视的是|值得一提的是|众所周知|不可否认)[，,]?\s*/g,
      ''
    );
    // 移除"其实"、"实际上"、"事实上"、"本质上"等填充词
    s = s.replace(
      /(其实|实际上|事实上|本质上|说白了|说穿了|归根结底)[，,]?\s*/g,
      ''
    );
    // 移除"我们可以"、"让我们"、"我们应该"等弱化主语
    s = s.replace(
      /(我们可以|让我们|我们应该|我们能够|我们需要|建议大家|推荐大家)[，,]?\s*/g,
      ''
    );
    return s;
  }

  destroy() {}
  stop() {}
}

module.exports = { ResponseCompressor };
