/**
 * LLMToUser — LLM输出 → 用户语言精炼器
 * 
 * 将 LLM 返回的技术性/冗长输出，精炼为用户能一眼看懂的语言。
 * 核心能力：去确认词、去客套话、保留核心信息在前、保持事实不变。
 * 
 * 版本 3.0 — 新增去冗余精炼规则 + 移除追踪
 */

class LLMToUser {
  constructor(options = {}) {
    this.name = 'llm-to-user';
    this.version = '3.0.0';
    this.options = options;
  }

  /**
   * 精炼LLM输出为用户友好语言
   * @param {string} output - LLM原始输出
   * @param {object} context - { input, intent, tone, userPreference }
   * @returns {object} { text, compression, removedSections, preserved }
   */
  translate(output, context = {}) {
    const original = String(output || '');
    if (!original.trim()) {
      return {
        text: '',
        compression: 1,
        removedSections: [],
        preserved: false
      };
    }

    const removedSections = [];

    // 1. 去掉开头确认词（"好的/没问题/当然可以/是的/没问题"等）
    const confirmPattern = /^(嗯|嗯，|嗯！|好的|好的，|好的！|没问题|没问题，|没问题！|当然|当然可以|当然可以，|是的|是的，|是的！|对的对的|对的，|对的！|明白|明白了|明白了，|收到|收到，|没问题了|可以|可以，|可以！|好的好的|好好|好嘞|好滴|好呀|行|行，|行！|成|成，|成！)\s*[,，:：！!\s]*/;
    let text = original;
    let match;

    while ((match = text.match(confirmPattern)) !== null) {
      removedSections.push({ type: 'confirmation', text: match[0].trim() });
      text = text.slice(match[0].length).trimStart();
    }

    // 2. 去掉"作为一个AI/我是AI"等自我介绍
    const selfIntroPattern = /^(作为一个AI|作为AI|作为一个人工智能|我是AI|我是人工智能|我是一个AI|我是大模型)\s*[,，:：]?\s*/;
    while ((match = text.match(selfIntroPattern)) !== null) {
      removedSections.push({ type: 'self_intro', text: match[0].trim() });
      text = text.slice(match[0].length).trimStart();
    }

    // 3. 去掉过度道歉（"抱歉/对不起/不好意思" + 不必要的）
    const apologyPatterns = [
      /^(抱歉|对不起|不好意思|很抱歉|非常抱歉|实在抱歉|真的抱歉|深感抱歉|向您道歉|我道歉)[，。！!？?]?\s*/,
      /^(请原谅|原谅我|请见谅|见谅)[，。！!？?]?\s*/,
    ];
    for (const pattern of apologyPatterns) {
      while ((match = text.match(pattern)) !== null) {
        removedSections.push({ type: 'apology', text: match[0].trim() });
        text = text.slice(match[0].length).trimStart();
      }
    }

    // 4. 去掉"谢谢你的提问/感谢你的问题"等感谢型开场
    const thankPatterns = [
      /^(谢谢你的|感谢你的|谢谢您的|感谢您的|感谢你|谢谢你)(提问|问题|关注|反馈|信任|耐心|理解)[，。！!？?]?\s*/,
    ];
    for (const pattern of thankPatterns) {
      while ((match = text.match(pattern)) !== null) {
        removedSections.push({ type: 'gratitude', text: match[0].trim() });
        text = text.slice(match[0].length).trimStart();
      }
    }

    // 5. 去掉"首先/第一/总的来说/综上所述/总而言之/最后"等模板式引导词（仅当在段落开头）
    const templateLeaders = [
      /^(首先[，,]|第一[，,]|总的来说[，,]|综上所述[，,]|总而言之[，,]|最后[，,]|简而言之[，,]|简单来说[，,]|换句话说[，,]|换言之[，,]|具体来说[，,]|具体而言[，,])/,
    ];
    for (const pattern of templateLeaders) {
      if ((match = text.match(pattern)) !== null) {
        removedSections.push({ type: 'template_leader', text: match[0].trim() });
        text = text.slice(match[0].length).trimStart();
      }
    }

    // 6. 去掉结尾客套话
    const closingPatterns = [
      /(如果你还有其他问题|如果您还有其他问题|如果你有任何问题|如果您有任何问题|如果还有其他问题|如有其他问题|有什么我可以帮你的|有什么我可以帮您的|有什么问题随时问我|有什么问题随时问|欢迎继续提问|欢迎继续咨询|欢迎随时联系|欢迎随时交流)[，。！!？?]?\s*$/,
      /(希望这个回答|希望这能帮助|希望对你有帮助|希望能帮到你|希望能帮到您|希望对你有所帮助|希望对您有所帮助|希望能解决你的问题|希望能解决您的问题)[，。！!？?]?\s*$/,
      /(祝您愉快|祝你好运|祝您顺利|祝一切顺利|祝好|祝生活愉快|祝工作顺利)[，。！!]?\s*$/,
      /(欢迎补充|欢迎指正|欢迎讨论|欢迎交流)[，。！!？?]?\s*$/,
    ];
    for (const pattern of closingPatterns) {
      while ((match = text.match(pattern)) !== null) {
        removedSections.push({ type: 'closing_pleasantry', text: match[0].trim() });
        text = text.slice(0, match.index).trimEnd();
      }
    }

    // 7. 去掉结尾emoji修饰（仅当是结尾的纯emoji序列）
    const emojiEndPattern = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]+\s*$/u;
    while ((match = text.match(emojiEndPattern)) !== null) {
      // 只有超过2个emoji或者整行都是emoji时才移除
      const emojiText = match[0].trim();
      if (emojiText.length >= 2 || /^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]+$/u.test(emojiText)) {
        removedSections.push({ type: 'emoji_tail', text: emojiText });
        text = text.slice(0, match.index).trimEnd();
      } else {
        break;
      }
    }

    // 8. 去掉"——"分隔线（单独一行）
    text = text.replace(/^[——\-]{2,}\s*$/gm, '').trim();

    // 9. 去掉冗余解释：形如"简单来说/换句话说"后跟的重复内容
    // 检测两句话是否意思相近（通过关键词重叠判断）
    text = this._removeRedundantRepetition(text, removedSections);

    // 10. 去掉不必要的"我理解/我明白/我懂"等填充语（非回答核心）
    const fillerPatterns = [
      /^(我理解|我明白|我懂|我知道了|我了解了|我清楚|我明白了)[，。！!？?]?\s*/,
    ];
    for (const pattern of fillerPatterns) {
      while ((match = text.match(pattern)) !== null) {
        removedSections.push({ type: 'filler', text: match[0].trim() });
        text = text.slice(match[0].length).trimStart();
      }
    }

    // 11. 去掉过度谦虚/不确定性弱化（"这只是我的看法/仅供参考"等）——仅当在末尾
    const modestyPatterns = [
      /(这只是我的看法|这只是我的一点看法|仅供参考|仅作参考|个人观点|纯属个人看法|以上仅为个人观点)[，。！!？?]?\s*$/,
    ];
    for (const pattern of modestyPatterns) {
      while ((match = text.match(pattern)) !== null) {
        removedSections.push({ type: 'modesty', text: match[0].trim() });
        text = text.slice(0, match.index).trimEnd();
      }
    }

    // 12. 核心结论前置：将最后一段（如果是总结句）提到开头
    // 检测：如果最后一段包含"总之/总的来说/核心/关键/所以/因此"等总结词，且长度适中
    text = this._promoteConclusion(text, removedSections);

    // 13. 去多余空行：保留段落间最多一个空行
    text = text.replace(/\n{3,}/g, '\n\n').trim();

    // 计算压缩比
    const originalLength = original.length;
    const compressedLength = text.length;
    const ratio = originalLength > 0 ? compressedLength / originalLength : 1;

    // 判断是否保留了核心信息：长度不少于原文的20%，或不为空
    const preserved = text.length > 0 && (text.length / Math.max(original.length, 1)) >= 0.05;

    return {
      text,
      compression: parseFloat(ratio.toFixed(2)),
      removedSections,
      preserved
    };
  }

  /**
   * 检测并移除冗余重复内容
   * 如："简单来说...其实就是..." 两段意思高度重复
   */
  _removeRedundantRepetition(text, removedSections) {
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length < 2) return text;

    const result = [];
    let i = 0;
    while (i < lines.length) {
      let j = i + 1;
      let foundRedundant = false;
      while (j < lines.length) {
        const similarity = this._calcSimilarity(lines[i], lines[j]);
        if (similarity > 0.65) {
          // 保留较短的那句（更精炼）
          const shorter = lines[i].length <= lines[j].length ? lines[i] : lines[j];
          const longer = lines[i].length > lines[j].length ? lines[i] : lines[j];
          removedSections.push({ type: 'redundant_repetition', text: longer.trim() });
          result.push(shorter);
          i = j + 1;
          foundRedundant = true;
          break;
        }
        j++;
      }
      if (!foundRedundant) {
        result.push(lines[i]);
        i++;
      }
    }
    return result.join('\n');
  }

  /**
   * 计算两段文本的相似度（关键词重叠比例）
   */
  _calcSimilarity(a, b) {
    const tokensA = this._tokenize(a);
    const tokensB = this._tokenize(b);
    if (tokensA.length === 0 || tokensB.length === 0) return 0;
    const setA = new Set(tokensA);
    const intersection = tokensB.filter(t => setA.has(t));
    const union = new Set([...tokensA, ...tokensB]);
    return intersection.length / union.size;
  }

  /**
   * 中文分词（简单实现：按标点和空格分割）
   */
  _tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[，。！？、；：""''（）【】《》\s,.!?;:()\[\]{}""''«»\-—]+/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 1); // 过滤单字（"的/了/是"等虚词）
  }

  /**
   * 核心结论前置
   * 如果文本最后一段是总结性内容，将其移到开头
   */
  _promoteConclusion(text, removedSections) {
    const paragraphs = text.split('\n').filter(p => p.trim());
    if (paragraphs.length < 2) return text;

    const lastPara = paragraphs[paragraphs.length - 1].trim();
    // 检测最后一段是否包含总结性关键词，且长度不超过总长的40%
    const conclusionKeywords = /(总之|总的来说|总而言之|综上所述|核心|关键|所以|因此|归结|归根结底|简单说|一句话|重要的是|关键点是|核心是)/;
    const isConclusion = conclusionKeywords.test(lastPara);
    const isShortEnough = lastPara.length < text.length * 0.4;

    if (isConclusion && isShortEnough) {
      // 检查是否已经是第一段了
      if (paragraphs[0].trim() === lastPara) return text;

      removedSections.push({
        type: 'conclusion_promoted',
        text: lastPara
      });

      // 将总结段移到开头
      const body = paragraphs.slice(0, -1);
      return [lastPara, ...body].join('\n');
    }

    return text;
  }

  /**
   * 旧接口兼容 — 调用 translate() 的精炼流程
   * @deprecated 请使用 translate()
   */
  translateLegacy(llmOutput, userContext = {}) {
    const result = this.translate(llmOutput, userContext || {});
    return {
      translated: result.text,
      original: llmOutput.substring(0, 500),
      compression: {
        originalLength: llmOutput.length,
        compressedLength: result.text.length,
        ratio: result.compression,
        duration: 0
      },
      keyPoints: this._extractKeyPoints(result.text),
      annotations: this._generateAnnotations(result.text),
      timestamp: Date.now()
    };
  }

  _extractKeyPoints(text) {
    const points = [];
    const lines = text.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (/^\d+[\.\)、]/.test(trimmed) && trimmed.length < 200) {
        points.push({ type: 'numbered', content: trimmed.replace(/^\d+[\.\)、]\s*/, '') });
      }
      if (/^[-•*]\s/.test(trimmed) && trimmed.length < 200) {
        points.push({ type: 'bullet', content: trimmed.replace(/^[-•*]\s*/, '') });
      }
      if (/(总之|总的来说|关键|重要|核心|本质|记住)/.test(trimmed) && trimmed.length < 300) {
        points.push({ type: 'key', content: trimmed });
      }
    }
    return points.slice(0, 5);
  }

  _generateAnnotations(text) {
    const annotations = [];
    if (/可能|或许|大概|不确定|不一定|也许是/.test(text)) {
      annotations.push({ type: 'uncertainty', label: '含不确定性' });
    }
    if (/推测|猜测|我认为|我觉得/.test(text)) {
      annotations.push({ type: 'speculation', label: '含推测' });
    }
    if (/根据|引用|参考|来源/.test(text)) {
      annotations.push({ type: 'reference', label: '有引用来源' });
    }
    if (/建议|推荐|应该|最好/.test(text)) {
      annotations.push({ type: 'suggestion', label: '含建议' });
    }
    return annotations;
  }

  destroy() {}
  stop() {}
}

module.exports = { LLMToUser };
