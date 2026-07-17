/**
 * 声明提取器 - 从文本中提取可验证的声明
 * v2.0.44 升级: 修复重复条件bug、英文比较模式、快速矛盾检测
 */
const claimExtractor = {
  version: '2.0.44',

  // 置信度级别枚举
  ConfidenceLevel: {
    HIGH: { name: 'high', threshold: 0.8, label: '[high]', color: '🟢' },
    MEDIUM: { name: 'medium', threshold: 0.5, label: '[medium]', color: '🟡' },
    LOW: { name: 'low', threshold: 0.0, label: '[low]', color: '🔴' },
    UNVERIFIED: { name: 'unverified', threshold: -1, label: '[unverified]', color: '⚪' }
  },

  // 声明分类枚举
  ClaimCategory: {
    FACT: 'fact',
    OPINION: 'opinion',
    STATISTIC: 'statistic',
    CITATION: 'citation',
    COMPARISON: 'comparison',
    CAUSATION: 'causation',
    TEMPORAL: 'temporal',
    PREDICTION: 'prediction'
  },

  // 错误分类枚举
  ErrorCategory: {
    NONE: 'none',
    UNVERIFIED: 'unverified',
    CONTRADICTORY: 'contradictory',
    IMPRECISE: 'imprecise',
    OUTDATED: 'outdated',
    MISATTRIBUTED: 'misattributed'
  },

  // 提取所有声明（带元数据）
  extractAll(text, options = {}) {
    if (!text || typeof text !== 'string') {
      return {
        citations: [], percentages: [], numbers: [],
        dates: [], comparisons: [], causations: [],
        metadata: { confidence: 0, totalClaims: 0, unverifiedCount: 0 },
        contradictions: []
      };
    }

    const sourceContext = options.sourceContext || '';
    const includePositions = options.includePositions !== false;

    const citations = this.extractCitations(text, { sourceContext, includePositions });
    const percentages = this.extractPercentages(text, { sourceContext, includePositions });
    const numbers = this.extractNumbers(text, { sourceContext, includePositions });
    const dates = this.extractDates(text, { sourceContext, includePositions });
    const comparisons = this.extractComparisons(text, { sourceContext, includePositions });
    const causations = this.extractCausations(text, { sourceContext, includePositions });

    // 检测声明之间的矛盾
    const contradictions = this.detectContradictions({
      citations, percentages, numbers, dates, comparisons, causations
    });

    // 计算全局置信度
    const totalClaims = citations.length + percentages.length + numbers.length +
      dates.length + comparisons.length + causations.length;
    const unverifiedCount = [...citations, ...percentages, ...numbers, ...dates,
      ...comparisons, ...causations].filter(c => c.confidenceLevel === 'unverified').length;
    const avgConfidence = totalClaims > 0
      ? [...citations, ...percentages, ...numbers, ...dates, ...comparisons, ...causations]
          .reduce((sum, c) => sum + c.confidenceScore, 0) / totalClaims
      : 0;

    return {
      citations,
      percentages,
      numbers,
      dates,
      comparisons,
      causations,
      metadata: {
        confidence: Math.round(avgConfidence * 100) / 100,
        totalClaims,
        unverifiedCount,
        sourceContext,
        contradictionCount: contradictions.length
      },
      contradictions
    };
  },

  // 计算声明的置信度
  _assessClaimConfidence(value, category, context = '') {
    let score = 0.5; // 基础分
    const signals = [];

    // 学术引用格式 → 高置信度
    if (/^\[@\w/.test(value) || /^\([A-Z][a-z]+/.test(value)) {
      score += 0.35;
      signals.push('academic_format');
    }

    // 有明确来源标注
    if (context.includes('according to') || context.includes('据') ||
        context.includes('来源') || context.includes('引自')) {
      score += 0.2;
      signals.push('source_cited');
    }

    // 百分比或统计数字 → 需要验证
    if (category === 'statistic') {
      if (/\d+%/.test(value)) {
        score -= 0.1;
        signals.push('statistical_claim');
      }
    }

    // 大数字 → 降低置信度（易伪造）
    const numMatch = value.match(/\d+/);
    if (numMatch && parseInt(numMatch[0], 10) > 10000) {
      score -= 0.1;
      signals.push('large_number');
    }

    // 确定性措辞
    if (/一定|必然|绝对|永远|always|never|must/i.test(value)) {
      score -= 0.15;
      signals.push('absolute_language');
    }

    // 模糊措辞
    if (/可能|大概|也许|约|approximately|roughly|about/i.test(value)) {
      score -= 0.1;
      signals.push('hedging_language');
    }

    // 年份信息 → 可以交叉验证
    if (category === 'temporal' && /20\d{2}/.test(value)) {
      score += 0.1;
      signals.push('verifiable_date');
    }

    // 因果声明 → 需要更多证据
    if (category === 'causation') {
      score -= 0.15;
      signals.push('causal_claim');
    }

    score = Math.max(0, Math.min(1, score));

    let level;
    if (score >= 0.8) level = 'high';
    else if (score >= 0.5) level = 'medium';
    else level = 'low';

    return { score: Math.round(score * 100) / 100, level, signals };
  },

  // 在文本中查找声明位置
  _findPositions(text, match) {
    const positions = [];
    let idx = 0;
    while ((idx = text.indexOf(match, idx)) !== -1) {
      const lineNum = (text.substring(0, idx).match(/\n/g) || []).length + 1;
      positions.push({
        offset: idx,
        line: lineNum,
        snippet: text.substring(Math.max(0, idx - 20), idx + match.length + 20).replace(/\n/g, ' ')
      });
      idx += match.length;
    }
    return positions;
  },

  // 提取学术引用（带元数据）
  extractCitations(text, opts = {}) {
    const patterns = [
      /\[@\w+.*?\]/g,
      /\([A-Z][a-z]+(?:\\s+(?:et\\s+al\\.|&\\s+[A-Z][a-z]+))?,?\\s*\d{4}\)/g
    ];
    const seen = new Map();
    for (const p of patterns) {
      let m;
      while ((m = p.exec(text)) !== null) {
        const key = m[0];
        if (!seen.has(key)) {
          const confidence = this._assessClaimConfidence(key, 'citation', opts.sourceContext);
          seen.set(key, {
            value: key,
            category: 'citation',
            confidenceScore: confidence.score,
            confidenceLevel: confidence.level,
            confidenceSignals: confidence.signals,
            errorCategory: confidence.score < 0.5 ? 'unverified' : 'none',
            positions: opts.includePositions ? this._findPositions(text, key) : [],
            sourceContext: opts.sourceContext || '',
            extractedAt: new Date().toISOString()
          });
        }
      }
    }
    return [...seen.values()];
  },

  // 提取百分比（带元数据）
  extractPercentages(text, opts = {}) {
    const matches = text.match(/\b\d+(?:\.\d+)?%/g) || [];
    const seen = new Map();
    for (const m of matches) {
      if (!seen.has(m)) {
        const confidence = this._assessClaimConfidence(m, 'statistic', opts.sourceContext);
        seen.set(m, {
          value: m,
          category: 'statistic',
          confidenceScore: confidence.score,
          confidenceLevel: confidence.level,
          confidenceSignals: confidence.signals,
          errorCategory: 'unverified',
          positions: opts.includePositions ? this._findPositions(text, m) : [],
          sourceContext: opts.sourceContext || '',
          extractedAt: new Date().toISOString()
        });
      }
    }
    return [...seen.values()];
  },

  // 提取数字（带元数据）
  extractNumbers(text, opts = {}) {
    const matches = text.match(/\b[1-9]\d{2,}(?:,\d{3})*(?:\.\d+)?\b/g) || [];
    const seen = new Map();
    for (const m of matches) {
      if (!seen.has(m)) {
        const num = parseInt(m.replace(/,/g, ''));
        const confidence = this._assessClaimConfidence(m, num > 10000 ? 'statistic' : 'fact', opts.sourceContext);
        seen.set(m, {
          value: m,
          numericValue: num,
          category: num > 10000 ? 'statistic' : 'fact',
          confidenceScore: confidence.score,
          confidenceLevel: confidence.level,
          confidenceSignals: confidence.signals,
          errorCategory: num > 10000 ? 'unverified' : 'none',
          positions: opts.includePositions ? this._findPositions(text, m) : [],
          sourceContext: opts.sourceContext || '',
          extractedAt: new Date().toISOString()
        });
      }
    }
    return [...seen.values()];
  },

  // 提取日期（带元数据）
  extractDates(text, opts = {}) {
    const matches = text.match(/\b(?:19|20)\d{2}[-/\s年](?:0[1-9]|1[0-2])?[-/\s月]?(?:0[1-9]|[12]\d|3[01])?[日]?\b/g) || [];
    const seen = new Map();
    for (const m of matches) {
      if (!seen.has(m)) {
        const yearMatch = m.match(/(19|20)\d{2}/);
        const year = yearMatch ? parseInt(yearMatch[0], 10) : 0;
        const currentYear = new Date().getFullYear();

        const confidence = this._assessClaimConfidence(m, 'temporal', opts.sourceContext);
        // 未来年份 → 预测类声明
        const isFuture = year > currentYear;
        // 太早的年份可能不准确
        const isVeryOld = year < 1900;

        seen.set(m, {
          value: m,
          year,
          category: isFuture ? 'prediction' : 'temporal',
          isFutureDate: isFuture,
          isHistorical: !isFuture && year > 0,
          confidenceScore: isFuture ? Math.min(confidence.score, 0.4) : confidence.score,
          confidenceLevel: isFuture ? 'low' : (confidence.score >= 0.8 ? 'high' : confidence.score >= 0.5 ? 'medium' : 'low'),
          confidenceSignals: isFuture ? [...confidence.signals, 'future_date'] : confidence.signals,
          errorCategory: isFuture ? 'unverified' : (isVeryOld ? 'imprecise' : 'none'),
          positions: opts.includePositions ? this._findPositions(text, m) : [],
          sourceContext: opts.sourceContext || '',
          extractedAt: new Date().toISOString()
        });
      }
    }
    return [...seen.values()];
  },

  // 提取比较声明（带元数据）
  extractComparisons(text, opts = {}) {
    const matches = text.match(/\b(?:比|超过|低于|多于|少于|大于|小于|高[于]?|低[于]?|多[于]?|少[于]?|more|less|better|worse|higher|lower|faster|slower|greater|fewer|than\s+\S+)\s*\S+/gi) || [];
    const seen = new Map();
    for (const m of matches) {
      if (!seen.has(m)) {
        const confidence = this._assessClaimConfidence(m, 'comparison', opts.sourceContext);
        seen.set(m, {
          value: m,
          category: 'comparison',
          confidenceScore: confidence.score,
          confidenceLevel: confidence.level,
          confidenceSignals: confidence.signals,
          errorCategory: confidence.score < 0.5 ? 'unverified' : 'none',
          positions: opts.includePositions ? this._findPositions(text, m) : [],
          sourceContext: opts.sourceContext || '',
          extractedAt: new Date().toISOString()
        });
      }
    }
    return [...seen.values()];
  },

  // 提取因果声明（带元数据）
  extractCausations(text, opts = {}) {
    const patterns = [
      /(?:导致|引起|造成|致使)\s*\S+/g,
      /(?:因为|由于)\s*\S+[^。]*?(?:所以|因此|因而)/g,
      /(?:证明|表明|说明)\s*\S+[^。]*?(?:导致|引起)/g
    ];
    const seen = new Map();
    for (const p of patterns) {
      let m;
      while ((m = p.exec(text)) !== null) {
        const key = m[0];
        if (!seen.has(key)) {
          const confidence = this._assessClaimConfidence(key, 'causation', opts.sourceContext);
          seen.set(key, {
            value: key,
            category: 'causation',
            confidenceScore: confidence.score,
            confidenceLevel: confidence.level,
            confidenceSignals: confidence.signals,
            errorCategory: 'unverified',
            positions: opts.includePositions ? this._findPositions(text, key) : [],
            sourceContext: opts.sourceContext || '',
            extractedAt: new Date().toISOString()
          });
        }
      }
    }
    return [...seen.values()];
  },

  // 检测声明之间的矛盾
  detectContradictions(claims) {
    const contradictions = [];
    const allClaims = Object.values(claims).flat();

    // 1. 同一数值的不同声明
    const numericClaims = allClaims.filter(c =>
      c.category === 'statistic' || (c.numericValue && c.numericValue > 0)
    );
    for (let i = 0; i < numericClaims.length; i++) {
      for (let j = i + 1; j < numericClaims.length; j++) {
        const a = numericClaims[i];
        const b = numericClaims[j];
        if (a.numericValue && b.numericValue &&
            Math.abs(a.numericValue - b.numericValue) < 5 &&
            a.value !== b.value) {
          // 相近但不相同的数字值 → 可能是矛盾
          contradictions.push({
            type: 'numeric_proximity',
            severity: 'warning',
            claimA: a.value,
            claimB: b.value,
            detail: `相近数值: ${a.value} vs ${b.value}`,
            confidence: 0.4
          });
        }
      }
    }

    // 2. 百分比总数超过100%的矛盾
    const pcts = allClaims.filter(c => c.category === 'statistic' && c.value.endsWith('%'));
    if (pcts.length >= 3) {
      const pctValues = pcts.map(c => parseFloat(c.value));
      const sorted = pctValues.sort((a, b) => b - a);
      const top2Sum = sorted[0] + sorted[1];
      if (top2Sum > 100 && sorted[0] > 50) {
        contradictions.push({
          type: 'percentage_overflow',
          severity: 'error',
          claimA: `${sorted[0]}%`,
          claimB: `${sorted[1]}%`,
          detail: `两个百分比之和(${top2Sum}%)超过100%，可能矛盾`,
          confidence: 0.7
        });
      }
    }

    // 3. 因果链中的矛盾（A导致B，同时又说A不影响B）
    const causalClaims = allClaims.filter(c => c.category === 'causation');
    if (causalClaims.length >= 2) {
      for (let i = 0; i < causalClaims.length; i++) {
        for (let j = i + 1; j < causalClaims.length; j++) {
          const a = causalClaims[i].value;
          const b = causalClaims[j].value;
          // 检查是否有否定形式的因果声明
          if ((a.includes('导致') || a.includes('引起')) &&
              (b.includes('不影响') || b.includes('不导致') || b.includes('不会'))) {
            contradictions.push({
              type: 'causal_conflict',
              severity: 'error',
              claimA: a,
              claimB: b,
              detail: '因果声明与否定声明冲突',
              confidence: 0.6
            });
          }
        }
      }
    }

    // 4. 相同声明出现在不同位置但内容矛盾
    const valueGroups = new Map();
    for (const c of allClaims) {
      if (!valueGroups.has(c.value)) {
        valueGroups.set(c.value, []);
      }
      valueGroups.get(c.value).push(c);
    }
    for (const [value, group] of valueGroups) {
      if (group.length > 1) {
        const levels = [...new Set(group.map(c => c.confidenceLevel))];
        if (levels.length > 1 && levels.includes('high') && levels.includes('low')) {
          contradictions.push({
            type: 'confidence_mismatch',
            severity: 'warning',
            claimA: value,
            claimB: value,
            detail: `相同声明在不同上下文中置信度不一致: ${levels.join(', ')}`,
            confidence: 0.5
          });
        }
      }
    }

    return contradictions;
  },

  /**
   * 快速矛盾检测 - 只返回是否有矛盾，不返回详细信息
   * 比 detectContradictions 更快，适合批量扫描
   * @param {Object} claims - extractAll 返回的声明对象
   * @returns {boolean}
   */
  containsContradiction(claims) {
    if (!claims || typeof claims !== 'object') return false;
    const allClaims = Object.values(claims).flat().filter(Boolean);
    if (allClaims.length < 2) return false;

    // 1. 相近数值检测
    const nums = allClaims.filter(c => c.numericValue && c.numericValue > 0);
    for (let i = 0; i < nums.length; i++) {
      for (let j = i + 1; j < nums.length; j++) {
        if (Math.abs(nums[i].numericValue - nums[j].numericValue) < 5 &&
            nums[i].value !== nums[j].value) return true;
      }
    }

    // 2. 百分比溢出
    const pcts = allClaims.filter(c => c.category === 'statistic' && typeof c.value === 'string' && c.value.endsWith('%'));
    if (pcts.length >= 3) {
      const vals = pcts.map(c => parseFloat(c.value)).filter(v => !isNaN(v)).sort((a, b) => b - a);
      if (vals.length >= 2 && vals[0] + vals[1] > 100 && vals[0] > 50) return true;
    }

    // 3. 因果冲突
    const causal = allClaims.filter(c => c.category === 'causation');
    if (causal.length >= 2) {
      for (let i = 0; i < causal.length; i++) {
        for (let j = i + 1; j < causal.length; j++) {
          const a = causal[i].value || '';
          const b = causal[j].value || '';
          if ((/导致|引起/.test(a)) && (/不影响|不导致|不会/.test(b))) return true;
        }
      }
    }

    return false;
  },

  // 分类（增强版：保留元数据）
  categorize(claims) {
    const verified = [];
    const uncertain = [];
    const needsCheck = [];

    // 处理数组格式（新格式：带元数据的对象数组）
    for (const key of ['citations', 'percentages', 'numbers', 'dates', 'comparisons', 'causations']) {
      const items = claims[key] || [];
      for (const item of items) {
        const entry = typeof item === 'object' ? item : { value: item, confidenceLevel: 'unverified' };
        if (entry.confidenceLevel === 'high' || entry.confidenceLevel === 'medium') {
          verified.push(entry);
        } else if (entry.confidenceLevel === 'low') {
          uncertain.push(entry);
        } else {
          needsCheck.push(entry);
        }
      }
    }

    return { verified, uncertain, needsCheck };
  },

  // 获取需要优先验证的声明（置信度低且风险高）
  getPriorityVerifications(claims) {
    const priorities = [];
    const allClaimArrays = [
      claims.citations, claims.percentages, claims.numbers,
      claims.dates, claims.comparisons, claims.causations
    ];

    for (const arr of allClaimArrays) {
      if (!Array.isArray(arr)) continue;
      for (const claim of arr) {
        const score = claim.confidenceScore || 0;
        let priority = 0;

        // 统计声明优先级高
        if (claim.category === 'statistic' || claim.category === 'causation') {
          priority += 2;
        }
        // 置信度低的声明优先级高
        if (score < 0.4) priority += 3;
        else if (score < 0.6) priority += 1;

        // 大数字优先验证
        if (claim.numericValue && claim.numericValue > 100000) priority += 1;

        if (priority >= 3) {
          priorities.push({
            ...claim,
            priority,
            verificationUrgency: priority >= 4 ? 'high' : 'medium'
          });
        }
      }
    }

    return priorities.sort((a, b) => b.priority - a.priority);
  },

  // 生成验证报告摘要
  generateReport(claims) {
    const allItems = [
      ...(claims.citations || []),
      ...(claims.percentages || []),
      ...(claims.numbers || []),
      ...(claims.dates || []),
      ...(claims.comparisons || []),
      ...(claims.causations || [])
    ];

    const byLevel = { high: 0, medium: 0, low: 0, unverified: 0 };
    const byCategory = {};
    for (const item of allItems) {
      const level = item.confidenceLevel || 'unverified';
      byLevel[level] = (byLevel[level] || 0) + 1;
      const cat = item.category || 'unknown';
      byCategory[cat] = (byCategory[cat] || 0) + 1;
    }

    const contradictions = claims.contradictions || [];

    return {
      totalClaims: allItems.length,
      confidenceDistribution: byLevel,
      categoryDistribution: byCategory,
      contradictionCount: contradictions.length,
      contradictions: contradictions.filter(c => c.severity === 'error'),
      warnings: contradictions.filter(c => c.severity === 'warning'),
      priorityVerifications: this.getPriorityVerifications(claims).length,
      summary: allItems.length === 0
        ? '未发现可验证声明'
        : `发现 ${allItems.length} 个声明: ` +
          `high=${byLevel.high} medium=${byLevel.medium} ` +
          `low=${byLevel.low} unverified=${byLevel.unverified} ` +
          `${contradictions.length > 0 ? `矛盾=${contradictions.length}` : ''}`
    };
  },

  // 格式化输出（向后兼容）
  formatAnnotations(text) {
    const claims = this.extractAll(text, { includePositions: false });
    const parts = [];

    if (claims.citations.length > 0) {
      const highCount = claims.citations.filter(c => c.confidenceLevel === 'high').length;
      parts.push(`学术引用 ${claims.citations.length} 处 [high:${highCount}]`);
    }
    if (claims.percentages.length > 0) {
      const vals = claims.percentages.map(c => c.value).join(', ');
      const unverifiedCount = claims.percentages.filter(c => c.confidenceLevel === 'unverified').length;
      parts.push(`百分比 ${vals}${unverifiedCount > 0 ? ` ⚠️${unverifiedCount}个未核实` : ''}`);
    }
    if (claims.numbers.length > 0) {
      const vals = claims.numbers.slice(0, 2).map(c => c.value).join(', ');
      parts.push(`数据 ${vals}`);
    }
    if (claims.contradictions.length > 0) {
      const errors = claims.contradictions.filter(c => c.severity === 'error');
      if (errors.length > 0) {
        parts.push(`⚠️ ${errors.length}处矛盾`);
      }
    }
    if (claims.metadata.unverifiedCount > 0) {
      parts.push(`存在未核实数据 ${claims.metadata.unverifiedCount}处 ⚠️[unverified]`);
    }

    return parts.length > 0 ? parts.join(' | ') : null;
  }
};

module.exports = { claimExtractor };
