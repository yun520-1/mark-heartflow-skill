/**
 * 模式匹配验证器 (Pattern Matcher) v1.2.0
 *
 * 智能模式匹配引擎 — 支持正向/负向模式、加权评分、模糊匹配、
 * 上下文感知匹配、结果置信度计算、多级模式分组（AND/OR/NOT逻辑）、
 * 提取后转换、模式频率统计与自适应阈值、通配符匹配。
 *
 * 与 QualityVerifier / OutputChecker 协同工作：
 * - QualityVerifier 负责质量评分
 * - OutputChecker 负责确定性输出检查
 * - PatternMatcher 负责语义/统计/模糊模式匹配
 */

class PatternMatcher {
  constructor() {
    this.patterns = new Map();
    this._matchStats = new Map(); // 模式匹配统计
    this._registerDefaultPatterns();
  }

  /**
   * 注册模式
   * @param {string} name - 模式名称
   * @param {Object} config - 模式配置
   * @param {RegExp|string|RegExp[]|string[]} config.patterns - 匹配模式
   * @param {boolean} [config.requireAll=false] - 是否需要全部匹配
   * @param {number} [config.weight=1.0] - 匹配权重（影响置信度）
   * @param {'positive'|'negative'} [config.mode='positive'] - 正向/负向匹配
   * @param {number} [config.threshold=0] - 最低匹配数阈值
   * @param {string[]} [config.requireContext=[]] - 需要的上下文键
   * @param {Function} [config.transform] - 匹配后转换函数 (match) => any
   * @param {boolean} [config.fuzzy=false] - 启用模糊匹配（基于相似度）
   * @param {number} [config.fuzzyThreshold=0.8] - 模糊匹配阈值
   * @param {boolean} [config.wildcard=false] - 启用通配符匹配（* 匹配任意字符，? 匹配单个字符）
   * @param {string} [config.group] - 模式分组名（支持 AND/OR/NOT 组合）
   */
  registerPattern(name, config) {
    const patterns = Array.isArray(config.patterns) ? config.patterns : [config.patterns];
    this.patterns.set(name, {
      name,
      patterns,
      requireAll: config.requireAll || false,
      weight: config.weight || 1.0,
      mode: config.mode || 'positive',
      threshold: config.threshold || 0,
      requireContext: config.requireContext || [],
      transform: config.transform || null,
      fuzzy: config.fuzzy || false,
      fuzzyThreshold: config.fuzzyThreshold || 0.8,
      wildcard: config.wildcard || false,
      group: config.group || null
    });

    // 初始化匹配统计
    if (!this._matchStats.has(name)) {
      this._matchStats.set(name, { total: 0, matched: 0, failed: 0 });
    }
  }

  /**
   * 匹配输出
   * @param {string} output - 要匹配的文本
   * @param {string} patternName - 模式名称
   * @param {Object} [context={}] - 匹配上下文
   * @returns {Object} 匹配结果
   */
  match(output, patternName, context = {}) {
    const pattern = this.patterns.get(patternName);
    if (!pattern) {
      return { matched: false, confidence: 0, error: `未知模式: ${patternName}` };
    }

    const result = this._matchWithPattern(output, pattern, context);
    this._updateStats(patternName, result.matched);
    return result;
  }

  /**
   * 匹配所有注册的模式
   * @param {string} output - 要匹配的文本
   * @param {Object} [context={}] - 匹配上下文
   * @returns {Object} 按模式名分组的匹配结果
   */
  matchAll(output, context = {}) {
    const results = {};

    for (const [name, pattern] of this.patterns) {
      results[name] = this._matchWithPattern(output, pattern, context);
      this._updateStats(name, results[name].matched);
    }

    return results;
  }

  /**
   * 按分组匹配（支持 AND/OR/NOT 逻辑组合）
   * @param {string} output - 要匹配的文本
   * @param {Object} [context={}] - 匹配上下文
   * @returns {Object} 按分组归并的结果
   */
  matchByGroup(output, context = {}) {
    const groups = new Map();
    const individual = {};

    for (const [name, pattern] of this.patterns) {
      const result = this._matchWithPattern(output, pattern, context);
      individual[name] = result;
      this._updateStats(name, result.matched);

      if (pattern.group) {
        if (!groups.has(pattern.group)) {
          groups.set(pattern.group, {
            name: pattern.group,
            members: [],
            positiveMatches: 0,
            negativeMatches: 0,
            totalMembers: 0
          });
        }
        const group = groups.get(pattern.group);
        group.members.push({ name, result });
        group.totalMembers++;
        if (result.matched) {
          group.positiveMatches++;
        } else if (pattern.mode === 'negative' && !result.matched) {
          // 负向模式"没匹配"算成功
          group.negativeMatches++;
        }
      }
    }

    // 计算分组结果
    const groupResults = {};
    for (const [name, group] of groups) {
      // AND: 全部成员匹配（考虑模式类型）
      // OR: 任一成员匹配
      // NOT: 负向成员不匹配
      const allPositive = group.members
        .filter(m => this.patterns.get(m.name).mode === 'positive')
        .every(m => m.result.matched);
      const allNegative = group.members
        .filter(m => this.patterns.get(m.name).mode === 'negative')
        .every(m => !m.result.matched);
      const anyMatched = group.members.some(m => m.result.matched);

      groupResults[name] = {
        group: name,
        matched: allPositive && allNegative,
        anyMatched,
        allPositive,
        allNegative,
        score: group.positiveMatches / Math.max(group.totalMembers, 1),
        memberCount: group.totalMembers
      };
    }

    return { individual, groups: groupResults };
  }

  /**
   * 使用模式匹配
   */
  _matchWithPattern(output, pattern, context = {}) {
    // 上下文检查
    for (const ctxKey of pattern.requireContext) {
      if (!context || context[ctxKey] === undefined) {
        return {
          matched: false,
          confidence: 0,
          pattern: pattern.name,
          matches: [],
          count: 0,
          message: `缺少上下文: ${ctxKey}`,
          score: 0
        };
      }
    }

    const matches = [];
    const allScores = [];

    for (const p of pattern.patterns) {
      let matchResult;

      if (pattern.fuzzy) {
        matchResult = this._fuzzyMatch(output, p, pattern.fuzzyThreshold);
      } else if (pattern.wildcard && typeof p === 'string') {
        matchResult = this._wildcardMatch(output, p);
      } else {
        matchResult = this._regexMatch(output, p);
      }

      if (matchResult) {
        // 应用转换函数
        let transformed = null;
        if (pattern.transform && typeof pattern.transform === 'function') {
          try {
            transformed = pattern.transform(matchResult);
          } catch {
            transformed = matchResult.matched;
          }
        }

        matches.push({
          pattern: typeof p === 'string' ? p : p.source,
          matched: matchResult.matched,
          groups: matchResult.groups || [],
          index: matchResult.index,
          transformed,
          score: matchResult.score || 1.0
        });
        allScores.push(matchResult.score || 1.0);
      }
    }

    // 计算匹配统计
    const count = matches.length;
    const totalPatterns = pattern.patterns.length;

    // 正向模式：匹配成功才算；负向模式：不匹配才算成功
    let successCount;
    if (pattern.mode === 'negative') {
      // 负向：匹配到的都是"不应该出现"的
      successCount = totalPatterns - count;
    } else {
      successCount = count;
    }

    const matched = pattern.requireAll
      ? (pattern.mode === 'negative' ? count === 0 : count === totalPatterns)
      : (pattern.mode === 'negative' ? count < totalPatterns : count > pattern.threshold);

    // 计算置信度/分数
    const baseScore = totalPatterns > 0
      ? successCount / totalPatterns
      : 0;
    const weightedScore = allScores.length > 0
      ? allScores.reduce((a, b) => a + b, 0) / totalPatterns
      : baseScore;

    // 综合置信度 = 基础分数 * 权重影响
    const confidence = Math.min(
      (baseScore * 0.6 + weightedScore * 0.4) * pattern.weight,
      1.0
    );

    return {
      matched,
      pattern: pattern.name,
      mode: pattern.mode,
      matches,
      count,
      total: totalPatterns,
      successCount,
      score: Math.round(weightedScore * 100) / 100,
      confidence: Math.round(confidence * 100) / 100,
      message: this._buildMatchMessage(pattern, matched, count, totalPatterns)
    };
  }

  /**
   * 正则匹配
   */
  _regexMatch(output, pattern) {
    const regex = this._toRegex(pattern);
    if (!regex) return null;

    const match = output.match(regex);
    if (!match) return null;

    return {
      matched: match[0],
      groups: match.slice(1),
      index: match.index,
      score: 1.0
    };
  }

  /**
   * 模糊匹配（基于字符串相似度）
   */
  _fuzzyMatch(output, pattern) {
    if (typeof pattern !== 'string') return null;

    const lines = output.split('\n');
    let bestMatch = null;
    let bestScore = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const similarity = this._stringSimilarity(trimmed.toLowerCase(), pattern.toLowerCase());
      if (similarity > bestScore) {
        bestScore = similarity;
        bestMatch = {
          matched: trimmed,
          groups: [],
          index: output.indexOf(trimmed),
          score: similarity
        };
      }
    }

    // 使用模糊阈值
    return bestScore >= this._getFuzzyThreshold(pattern) ? bestMatch : null;
  }

  /**
   * 获取模糊匹配阈值（可基于模式长度动态调整）
   */
  _getFuzzyThreshold(pattern) {
    const patternStr = typeof pattern === 'string' ? pattern : pattern.source || '';
    // 短模式需要更高精确度，长模式可以更模糊
    if (patternStr.length <= 5) return 0.95;
    if (patternStr.length <= 10) return 0.85;
    if (patternStr.length <= 20) return 0.75;
    return 0.7;
  }

  /**
   * 通配符匹配（将 * / ? 通配符转换为正则）
   * @param {string} output - 待匹配文本
   * @param {string} wildcardPattern - 通配符模式（如 "*.js", "test_?.txt"）
   * @returns {Object|null} 匹配结果
   */
  _wildcardMatch(output, wildcardPattern) {
    // 将通配符模式转换为正则：. → \., * → .*, ? → .
    let regexStr = '';
    for (const ch of wildcardPattern) {
      if (ch === '*') {
        regexStr += '.*';
      } else if (ch === '?') {
        regexStr += '.';
      } else if (/[.+^${}()|[\]\\]/.test(ch)) {
        regexStr += '\\' + ch;
      } else {
        regexStr += ch;
      }
    }
    try {
      const regex = new RegExp(regexStr, 'gi');
      const match = output.match(regex);
      if (!match) return null;
      return {
        matched: match[0],
        groups: [],
        index: output.indexOf(match[0]),
        score: 1.0
      };
    } catch {
      return null;
    }
  }

  /**
   * 字符串相似度（Levenshtein 变体）
   */
  _stringSimilarity(a, b) {
    if (a === b) return 1.0;
    if (!a || !b) return 0.0;
    if (a.length < 2 || b.length < 2) return a === b ? 1.0 : 0.0;

    const maxLen = Math.max(a.length, b.length);
    if (maxLen === 0) return 1.0;

    // 使用 bigram 相似度（比完整 Levenshtein 更快）
    const bigramsA = new Set();
    for (let i = 0; i < a.length - 1; i++) {
      bigramsA.add(a.substring(i, i + 2));
    }

    let intersection = 0;
    for (let i = 0; i < b.length - 1; i++) {
      if (bigramsA.has(b.substring(i, i + 2))) {
        intersection++;
      }
    }

    const union = a.length + b.length - 2;
    return union > 0 ? (2.0 * intersection) / union : 0.0;
  }

  /**
   * 转换为正则
   */
  _toRegex(pattern) {
    if (pattern instanceof RegExp) {
      return pattern;
    }

    if (typeof pattern === 'string') {
      try {
        return new RegExp(pattern, 'gi');
      } catch {
        return null;
      }
    }

    return null;
  }

  /**
   * 构建匹配消息
   */
  _buildMatchMessage(pattern, matched, count, total) {
    const modeLabel = pattern.mode === 'negative' ? '负向' : '正向';
    const status = matched ? '通过' : '失败';

    if (pattern.mode === 'negative') {
      return matched
        ? `负向模式通过：未匹配到不应出现的内容 (${count}/${total})`
        : `负向模式失败：匹配到 ${count} 个不应出现的内容`;
    }

    if (pattern.requireAll) {
      return matched
        ? `全部模式匹配通过 (${count}/${total})`
        : `部分模式匹配 (${count}/${total})`;
    }

    return matched
      ? `匹配 ${count} 个模式（阈值: ${pattern.threshold}）`
      : `不匹配模式: ${pattern.name}（仅匹配 ${count}/${total}）`;
  }

  /**
   * 更新匹配统计
   */
  _updateStats(name, matched) {
    const stats = this._matchStats.get(name);
    if (stats) {
      stats.total++;
      if (matched) {
        stats.matched++;
      } else {
        stats.failed++;
      }
    }
  }

  /**
   * 获取模式统计
   * @param {string} [name] - 可选的模式名
   * @returns {Object} 统计结果
   */
  getStats(name) {
    if (name) {
      return this._matchStats.get(name) || { total: 0, matched: 0, failed: 0 };
    }

    const all = {};
    for (const [key, stats] of this._matchStats) {
      all[key] = { ...stats, rate: stats.total > 0 ? stats.matched / stats.total : 0 };
    }
    return all;
  }

  /**
   * 获取低置信度模式（匹配率异常的模式）
   * @param {number} [threshold=0.3] - 匹配率阈值
   * @returns {Array} 低置信度模式列表
   */
  getLowConfidencePatterns(threshold = 0.3) {
    const low = [];
    for (const [name, stats] of this._matchStats) {
      if (stats.total >= 5) {
        const rate = stats.matched / stats.total;
        if (rate < threshold) {
          low.push({
            name,
            matchRate: rate,
            total: stats.total,
            matched: stats.matched,
            suggestion: rate < 0.1
              ? '匹配率极低，考虑调整模式'
              : '匹配率偏低，检查模式精确度'
          });
        }
      }
    }
    return low.sort((a, b) => a.matchRate - b.matchRate);
  }

  /**
   * 获取所有模式的匹配摘要（快速概览）
   * @returns {Object} 摘要信息
   */
  matchSummary() {
    const stats = this.getStats();
    const patterns = Array.from(this.patterns.entries());
    const total = patterns.length;
    const grouped = {};
    let negativeCount = 0;
    let fuzzyCount = 0;
    let wildcardCount = 0;

    for (const [, p] of patterns) {
      const g = p.group || 'ungrouped';
      if (!grouped[g]) grouped[g] = { count: 0, names: [] };
      grouped[g].count++;
      grouped[g].names.push(p.name);
      if (p.mode === 'negative') negativeCount++;
      if (p.fuzzy) fuzzyCount++;
      if (p.wildcard) wildcardCount++;
    }

    const matchedPatterns = Object.entries(stats).filter(([, s]) => s.total > 0).length;

    return {
      totalPatterns: total,
      groups: Object.keys(grouped).length,
      matchedPatterns,
      negativeCount,
      fuzzyCount,
      wildcardCount,
      groupsBreakdown: grouped,
      matchRates: Object.fromEntries(
        Object.entries(stats).map(([k, v]) => [
          k, v.total > 0 ? Math.round((v.matched / v.total) * 100) / 100 : 0
        ])
      )
    };
  }

  /**
   * 提取匹配的内容
   */
  extract(output, patternName, context = {}) {
    const result = this.match(output, patternName, context);
    if (!result.matched) return [];

    return result.matches
      .filter(m => m.transformed !== null)
      .map(m => m.transformed !== undefined ? m.transformed : m.matched);
  }

  /**
   * 提取并去重
   */
  extractUnique(output, patternName, context = {}) {
    const items = this.extract(output, patternName, context);
    return [...new Set(items)];
  }

  /**
   * 提取并评分
   */
  extractWithScore(output, patternName, context = {}) {
    const result = this.match(output, patternName, context);
    return {
      items: result.matches.map(m => ({
        value: m.transformed !== undefined ? m.transformed : m.matched,
        score: m.score,
        groups: m.groups
      })),
      confidence: result.confidence,
      score: result.score
    };
  }

  /**
   * 注册默认模式
   */
  _registerDefaultPatterns() {
    // 错误模式（正向检测）
    this.registerPattern('errors', {
      name: '错误检测',
      patterns: [
        /\berror[s]?\b/i,
        /\bfail(ed|ure)?\b/i,
        /\bexception[s]?\b/i,
        /\btraceback\b/i
      ],
      weight: 2.0,
      threshold: 0,
      mode: 'positive',
      group: 'quality_negative'
    });

    // 成功模式（正向检测）
    this.registerPattern('success', {
      name: '成功检测',
      patterns: [
        /\bsuccess(ful|fully)?\b/i,
        /\bcompleted?\b/i,
        /\bdone\b/i,
        /\bok\b/i
      ],
      weight: 1.5,
      mode: 'positive',
      group: 'quality_positive'
    });

    // 错误关键词的负向模式（检查是否出现但不应出现）
    this.registerPattern('no_critical_errors', {
      name: '无严重错误',
      patterns: [
        /\bfatal\b/i,
        /\bpanic\b/i,
        /\bsegmentation fault\b/i,
        /\bunrecoverable\b/i,
        /\bABORTING\b/i
      ],
      weight: 3.0,
      mode: 'negative',
      threshold: 0,
      group: 'quality_negative'
    });

    // Git 提交模式
    this.registerPattern('git_commit', {
      name: 'Git提交',
      patterns: [
        /\[([a-f0-9]+)\]\s+(.+)/,
        /commit\s+([a-f0-9]+)/i,
        /^[a-f0-9]{7,40}\s/ // 短 hash
      ],
      weight: 1.0,
      transform: (match) => ({
        hash: match.groups[0] || match.matched.trim().split(/\s/)[0],
        message: match.groups[1] || ''
      })
    });

    // 文件路径模式（带转换）
    this.registerPattern('file_paths', {
      name: '文件路径',
      patterns: [
        /\/[\w\-\/\.]+/g
      ],
      weight: 0.5,
      transform: (match) => match.matched.trim()
    });

    // JSON 模式
    this.registerPattern('json', {
      name: 'JSON',
      patterns: [
        /\{[\s\S]*\}/,
        /\[[\s\S]*\]/
      ],
      weight: 1.0,
      transform: (match) => {
        try {
          return JSON.parse(match.matched);
        } catch {
          return match.matched;
        }
      }
    });

    // URL 模式
    this.registerPattern('urls', {
      name: 'URL',
      patterns: [
        /https?:\/\/[^\s<>"']+/gi
      ],
      weight: 0.5,
      transform: (match) => {
        try {
          return new URL(match.matched);
        } catch {
          return match.matched;
        }
      }
    });

    // 行号模式
    this.registerPattern('line_numbers', {
      name: '行号',
      patterns: [
        /line\s*(\d+)/gi,
        /:(\d+):(\d+)/g
      ],
      weight: 0.5,
      transform: (match) => ({
        line: parseInt(match.groups[0] || match.matched.replace('line ', '')),
        column: match.groups[1] ? parseInt(match.groups[1]) : undefined
      })
    });

    // 数字模式（带阈值）
    this.registerPattern('numbers', {
      name: '数字提取',
      patterns: [
        /\b\d+(?:\.\d+)?\b/g
      ],
      weight: 0.3,
      threshold: 1,
      transform: (match) => parseFloat(match.matched)
    });

    // 时间戳模式（带转换）
    this.registerPattern('timestamps', {
      name: '时间戳',
      patterns: [
        /\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}/g,
        /\d{2}:\d{2}:\d{2}/g
      ],
      weight: 0.5,
      transform: (match) => {
        try {
          const date = new Date(match.matched);
          return isNaN(date.getTime()) ? match.matched : date.toISOString();
        } catch {
          return match.matched;
        }
      }
    });

    // IP 地址模式
    this.registerPattern('ip_addresses', {
      name: 'IP地址',
      patterns: [
        /\b(?:\d{1,3}\.){3}\d{1,3}\b/g
      ],
      weight: 0.5,
      transform: (match) => {
        const parts = match.matched.split('.').map(Number);
        const isValid = parts.every(p => p >= 0 && p <= 255);
        return isValid ? match.matched : null;
      }
    });

    // 代码栈追踪模式
    this.registerPattern('stack_traces', {
      name: '堆栈追踪',
      patterns: [
        /\s+at\s+\S+\s+\([^)]+\)/g,
        /File\s+"[^"]+",\s+line\s+\d+/gi
      ],
      weight: 1.5,
      mode: 'negative',
      threshold: 0,
      group: 'quality_negative'
    });
  }

  /**
   * 创建自定义匹配器
   */
  static create(patterns) {
    const matcher = new PatternMatcher();
    for (const [name, config] of Object.entries(patterns)) {
      matcher.registerPattern(name, config);
    }
    return matcher;
  }

  /**
   * 序列化模式（用于持久化）
   */
  serialize() {
    const data = {};
    for (const [name, pattern] of this.patterns) {
      data[name] = {
        name: pattern.name,
        patterns: pattern.patterns.map(p =>
          p instanceof RegExp ? { source: p.source, flags: p.flags } : p
        ),
        requireAll: pattern.requireAll,
        weight: pattern.weight,
        mode: pattern.mode,
        threshold: pattern.threshold,
        fuzzy: pattern.fuzzy,
        fuzzyThreshold: pattern.fuzzyThreshold,
        group: pattern.group
      };
    }
    return data;
  }

  /**
   * 从序列化数据恢复模式
   */
  deserialize(data) {
    for (const [name, config] of Object.entries(data)) {
      const patterns = config.patterns.map(p =>
        p.source ? new RegExp(p.source, p.flags || 'gi') : p
      );
      this.registerPattern(name, {
        ...config,
        patterns
      });
    }
  }
}

module.exports = { PatternMatcher };
