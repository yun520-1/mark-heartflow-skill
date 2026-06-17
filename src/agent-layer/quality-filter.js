/**
 * QualityFilter — LLM输出质量过滤器 v3.0
 * 六种质量过滤规则：
 * 1. 内容为空/太短（<5字）→ reject
 * 2. 内容只有标点符号 → reject
 * 3. 内容含"undefined""null""[object Object]" → reject
 * 4. 内容过度重复（同一句出现3次以上）→ reject
 * 5. 内容包含占位符（"这里填写..."）→ reject
 * 6. 内容与用户问题无关 → 低分
 */
class QualityFilter {
  constructor() {
    this.name = 'quality-filter';
    this.version = '3.0.0';
  }

  /**
   * 过滤并评分 LLM 输出内容
   * @param {string} text - 待检测文本
   * @param {string} [userQuery] - 可选的用户原始问题，用于规则6的无关性检测
   * @returns {{ passed: boolean, score: number, reason: string, issues: Array<{type: string, description: string}> }}
   */
  filter(text, userQuery) {
    const issues = [];
    let score = 100;

    // --- 规则1: 内容为空或太短（<5字）---
    if (!text || typeof text !== 'string' || text.trim().length < 5) {
      const reason = !text || typeof text !== 'string' ? 'empty' : 'too_short';
      issues.push({
        type: 'too_short_or_empty',
        description: `内容${!text ? '为空' : `过短(${text.trim().length}字)`}，低于5字阈值`
      });
      return {
        passed: false,
        score: 0,
        reason,
        issues
      };
    }

    const trimmed = text.trim();

    // --- 规则2: 内容只有标点符号 ---
    const punctuationOnly = /^[\s，。！？、；：""''（）【】《》——…\-\.,!?;:'"()\[\]{}\/\\\u3000\u2000-\u206F\uFF00-\uFFEF]+$/;
    if (punctuationOnly.test(trimmed)) {
      issues.push({
        type: 'punctuation_only',
        description: '内容仅包含标点符号，无有效文字信息'
      });
      return {
        passed: false,
        score: 0,
        reason: 'punctuation_only',
        issues
      };
    }

    // --- 规则3: 内容含明显错误值 ---
    const errorPatterns = [
      /\bundefined\b/,
      /\bnull\b/,
      /\[object Object\]/,
      /\bNaN\b/,
      /\[object Array\]/,
      /\bInfinity\b/
    ];
    const errorMatches = errorPatterns.filter(p => p.test(trimmed));
    if (errorMatches.length > 0) {
      const matched = errorMatches.map(p => p.source).join(', ');
      issues.push({
        type: 'contains_error_value',
        description: `内容包含未解析的代码值: ${matched}`
      });
      return {
        passed: false,
        score: 0,
        reason: 'contains_error_value',
        issues
      };
    }

    // --- 规则4: 内容过度重复（同一句出现3次以上）---
    const lines = trimmed.split(/[。！？\n.!?]+/).filter(l => l.trim().length > 0);
    const seen = new Map();
    for (const line of lines) {
      const normalized = line.replace(/\s+/g, '').toLowerCase();
      if (normalized.length < 4) continue;
      seen.set(normalized, (seen.get(normalized) || 0) + 1);
    }
    for (const [line, count] of seen.entries()) {
      if (count >= 3) {
        issues.push({
          type: 'excessive_repetition',
          description: `内容过度重复: "${line.slice(0, 30)}..." 出现了 ${count} 次`
        });
        score = Math.max(0, score - 40);
        break;
      }
    }

    // --- 规则5: 内容包含占位符 ---
    const placeholderPatterns = [
      /这里填写[\s\S]{0,20}/,
      /请替换[\s\S]{0,20}/,
      /\[你的[\s\S]{0,10}\]/,
      /\[用户[\s\S]{0,10}\]/,
      /\[具体[\s\S]{0,10}\]/,
      /待补充/,
      /TODO/,
      /\{[\s\S]{0,20}\}/
    ];
    const placeholderMatches = placeholderPatterns.filter(p => p.test(trimmed));
    if (placeholderMatches.length > 0) {
      const matched = placeholderMatches.map(p => p.source).join(', ');
      issues.push({
        type: 'contains_placeholder',
        description: `内容包含未替换的占位符: ${matched}`
      });
      score = Math.max(0, score - 50);
    }

    // --- 规则6: 内容与用户问题无关（需提供 userQuery）---
    if (userQuery && typeof userQuery === 'string' && userQuery.trim().length > 0) {
      const relevanceScore = this._computeRelevance(trimmed, userQuery.trim());
      if (relevanceScore < 0.2) {
        issues.push({
          type: 'irrelevant_content',
          description: `内容与用户问题相关性低(relevance=${relevanceScore.toFixed(2)})，可能答非所问`
        });
        score = Math.max(0, score - 30);
      } else if (relevanceScore < 0.4) {
        issues.push({
          type: 'low_relevance',
          description: `内容与用户问题相关性较低(relevance=${relevanceScore.toFixed(2)})`
        });
        score = Math.max(0, score - 15);
      }
    }

    // --- 最终判定 ---
    const passed = issues.length === 0 || issues.every(i => i.type !== 'too_short_or_empty' && i.type !== 'punctuation_only' && i.type !== 'contains_error_value');

    let reason = 'ok';
    if (!passed) {
      reason = issues.find(i =>
        i.type === 'too_short_or_empty' ||
        i.type === 'punctuation_only' ||
        i.type === 'contains_error_value'
      )?.type || 'rejected';
    }

    return {
      passed,
      score,
      reason,
      issues
    };
  }

  /**
   * 简单文本相关性计算（基于词重叠）
   * @private
   */
  _computeRelevance(text, query) {
    const tokenize = (s) => {
      // 中文分词：按字和常用词切分；英文按空格和标点
      const chineseChars = s.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || [];
      const englishWords = s.toLowerCase().match(/\b[a-z]{2,}\b/g) || [];
      // 中文双字组合（bigram）以捕捉词义
      const bigrams = [];
      for (let i = 0; i < chineseChars.length - 1; i++) {
        bigrams.push(chineseChars[i] + chineseChars[i + 1]);
      }
      return new Set([...chineseChars, ...bigrams, ...englishWords]);
    };

    const textTokens = tokenize(text);
    const queryTokens = tokenize(query);

    if (queryTokens.size === 0) return 1;

    let intersection = 0;
    for (const token of queryTokens) {
      if (textTokens.has(token)) intersection++;
    }

    // Jaccard 相似度，但以 query 为基准（看 text 覆盖了多少 query 的 token）
    return intersection / queryTokens.size;
  }

  destroy() {}
  stop() {}
}

module.exports = { QualityFilter };
