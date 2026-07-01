/**
 * 假设测试器 - 提取和验证声明的真实性
 * v2 - 新增：声明分类、矛盾检测、时间有效性、来源可信度、重要性评分、模糊去重
 */
const hypothesisTester = {
  // 声明类型枚举
  ClaimCategory: {
    FACTUAL: 'factual',       // 事实性声明（有可验证真值）
    OPINION: 'opinion',       // 观点性声明（主观判断）
    PREDICTION: 'prediction', // 预测性声明（未来事件）
    COMPARISON: 'comparison', // 比较性声明（A比B更好/更大/更快）
    STATISTICAL: 'statistical', // 统计性声明（百分比/均值/概率）
    TEMPORAL: 'temporal',     // 时间性声明（日期/时间段/顺序）
    CAUSAL: 'causal',         // 因果性声明（因为X所以Y）
    DEFINITIONAL: 'definitional' // 定义性声明（X是什么）
  },

  // 验证状态枚举
  VerificationStatus: {
    UNVERIFIED: 'unverified',
    VERIFIED_TRUE: 'verified_true',
    VERIFIED_FALSE: 'verified_false',
    UNVERIFIABLE: 'unverifiable',
    EXPIRED: 'expired',
    PENDING: 'pending'
  },

  // 提取文本中所有可验证的声明（含分类）
  extractClaims(text) {
    const claims = [];

    // 学术引用
    const citations = text.match(/\[@\w+.*?\]|\([A-Z][a-z]+,\s*\d{4}\)/g) || [];

    // 百分比声明
    const percentages = text.match(/\b\d+%|\b\d+\.\d+%/g) || [];

    // 具体数字（>1000 的数字通常需要验证）
    const numbers = text.match(/\b[1-9]\d{2,}(?:,\d{3})*(?:\.\d+)?\b/g) || [];

    // 日期声明
    const dates = text.match(/\b(?:19|20)\d{2}[-/年](?:0[1-9]|1[0-2])?[-/月]?(?:0[1-9]|[12]\d|3[01])?[日]?\b/g) || [];

    // 技术术语
    const techTerms = text.match(/\b(?:API|GPU|CPU|RAM|ROM|SSD|HDMI|USB|AI|ML|NLP|CV|RL|NLP)\b/g) || [];

    // 因果声明（因为/所以/导致/因此）
    const causalPatterns = text.match(/[^。！？]*?(?:因为|所以|因此|导致|引起|造成|促使|使得)[^。！？]*[。！？]/g) || [];

    // 比较声明（比/更/最/优于/超过）
    const comparisonPatterns = text.match(/[^。！？]*?(?:比|更|最|优于|超过|领先|不如|相当于)[^。！？]*[。！？]/g) || [];

    // 预测声明（将/会/可能/预计/预期）
    const predictionPatterns = text.match(/[^。！？]*?(?:预计|预期|将(?:会|要)|有望|可能(?:性)?会|估计)[^。！？]*[。！？]/g) || [];

    // 分类每个声明
    for (const c of citations) {
      claims.push({ text: c, category: this.ClaimCategory.FACTUAL, subtype: 'citation' });
    }
    for (const p of percentages) {
      claims.push({ text: p, category: this.ClaimCategory.STATISTICAL, subtype: 'percentage' });
    }
    for (const n of numbers) {
      claims.push({ text: n, category: this.ClaimCategory.STATISTICAL, subtype: 'numeric' });
    }
    for (const d of dates) {
      claims.push({ text: d, category: this.ClaimCategory.TEMPORAL, subtype: 'date' });
    }
    for (const t of techTerms) {
      claims.push({ text: t, category: this.ClaimCategory.DEFINITIONAL, subtype: 'techterm' });
    }
    for (const cp of causalPatterns) {
      claims.push({ text: cp.slice(0, 100), category: this.ClaimCategory.CAUSAL, subtype: 'causal' });
    }
    for (const comp of comparisonPatterns) {
      claims.push({ text: comp.slice(0, 100), category: this.ClaimCategory.COMPARISON, subtype: 'comparison' });
    }
    for (const pred of predictionPatterns) {
      claims.push({ text: pred.slice(0, 100), category: this.ClaimCategory.PREDICTION, subtype: 'prediction' });
    }

    // 去重（基于文本相似度）
    const deduplicated = this._deduplicateClaims(claims);

    const hasUnverifiedCitations = citations.length === 0 && (percentages.length > 0 || numbers.length > 0);

    return {
      citations: [...new Set(citations)],
      percentages: [...new Set(percentages)],
      numbers: [...new Set(numbers)],
      dates: [...new Set(dates)],
      techTerms: [...new Set(techTerms)],
      categorizedClaims: deduplicated,
      hasUnverified: hasUnverifiedCitations,
      claimCount: deduplicated.length,
      categoryBreakdown: this._getCategoryBreakdown(deduplicated)
    };
  },

  // 模糊去重：文本相似度 > 0.7 视为重复
  _deduplicateClaims(claims) {
    const unique = [];
    for (const claim of claims) {
      let isDuplicate = false;
      for (const existing of unique) {
        if (this._textSimilarity(claim.text, existing.text) > 0.7) {
          isDuplicate = true;
          break;
        }
      }
      if (!isDuplicate) {
        unique.push(claim);
      }
    }
    return unique;
  },

  // 文本相似度（基于共同子串比例）
  _textSimilarity(a, b) {
    const aNorm = a.toLowerCase().replace(/\s+/g, ' ').trim();
    const bNorm = b.toLowerCase().replace(/\s+/g, ' ').trim();
    if (aNorm === bNorm) return 1.0;
    if (aNorm.length < 3 || bNorm.length < 3) return 0;

    // 使用交集字符比例作为快速近似
    const aChars = new Set(aNorm.split(''));
    const bChars = new Set(bNorm.split(''));
    let intersection = 0;
    for (const char of aChars) {
      if (bChars.has(char)) intersection++;
    }
    const union = aChars.size + bChars.size - intersection;
    return union > 0 ? intersection / union : 0;
  },

  // 声明分类统计
  _getCategoryBreakdown(claims) {
    const breakdown = {};
    for (const claim of claims) {
      const cat = claim.category;
      breakdown[cat] = (breakdown[cat] || 0) + 1;
    }
    return breakdown;
  },

  // 评估声明置信度（含分类加权）
  assessConfidence(text, context = {}) {
    const claims = this.extractClaims(text);
    let score = 0.5; // 基础分
    const factors = [];

    // 分类加权
    if (claims.citations.length > 0) {
      score += 0.3;
      factors.push({ factor: 'academic_citations', delta: 0.3, reason: `${claims.citations.length}处学术引用` });
    }
    if (claims.percentages.length > 0) {
      score += 0.1;
      factors.push({ factor: 'percentages', delta: 0.1, reason: '含百分比数据' });
    }
    if (claims.dates.length > 0) {
      score += 0.05;
      factors.push({ factor: 'temporal', delta: 0.05, reason: '含时间信息' });
    }

    // 用户确认
    if (context.userVerified) {
      score += 0.2;
      factors.push({ factor: 'user_verified', delta: 0.2, reason: '用户已确认' });
    }

    // 外部来源
    if (context.hasExternalSource) {
      score += 0.2;
      factors.push({ factor: 'external_source', delta: 0.2, reason: '有外部来源' });
    }

    // 来源可信度评分
    if (context.sourceCredibility) {
      const credDelta = Math.min(0.3, context.sourceCredibility * 0.3);
      score += credDelta;
      factors.push({ factor: 'source_credibility', delta: credDelta, reason: `来源可信度:${context.sourceCredibility}` });
    }

    // 不确定词减分
    if (/大概|可能|也许|probably|might|maybe|或许|似乎|推测|猜测/i.test(text)) {
      score -= 0.2;
      factors.push({ factor: 'uncertainty_language', delta: -0.2, reason: '含不确定词' });
    }

    // 主观语言减分
    if (/我觉得|我认为|我个人|在我看来|subjective|personally/i.test(text)) {
      score -= 0.15;
      factors.push({ factor: 'subjective_language', delta: -0.15, reason: '含主观表达' });
    }

    // 声明类型校正
    const breakdown = claims.categoryBreakdown || {};
    if (breakdown[this.ClaimCategory.PREDICTION] > 0) {
      score -= 0.1;
      factors.push({ factor: 'has_predictions', delta: -0.1, reason: '含预测性声明（固有不确定）' });
    }
    if (breakdown[this.ClaimCategory.COMPARISON] > 0 && !context.hasExternalSource) {
      score -= 0.1;
      factors.push({ factor: 'unverified_comparison', delta: -0.1, reason: '比较声明未经验证' });
    }

    score = Math.min(1, Math.max(0, score));

    let level;
    if (score >= 0.8) level = 'high';
    else if (score >= 0.5) level = 'medium';
    else level = 'low';

    return {
      score: Math.round(score * 100) / 100,
      level,
      annotation: `[${level}]`,
      factors,
      claimCount: claims.claimCount
    };
  },

  // 检测声明之间的矛盾
  detectContradictions(claimsArray) {
    if (!claimsArray || claimsArray.length < 2) return [];

    const contradictions = [];

    for (let i = 0; i < claimsArray.length; i++) {
      for (let j = i + 1; j < claimsArray.length; j++) {
        const a = claimsArray[i];
        const b = claimsArray[j];

        // 数字矛盾检测
        if (a.category === 'statistical' && b.category === 'statistical') {
          const numA = parseFloat(a.text.replace(/[^0-9.]/g, ''));
          const numB = parseFloat(b.text.replace(/[^0-9.]/g, ''));
          if (!isNaN(numA) && !isNaN(numB)) {
            const ratio = Math.abs(numA - numB) / Math.max(numA, numB, 1);
            if (ratio > 0.5 && a.subtype === b.subtype) {
              contradictions.push({
                type: 'numeric_discrepancy',
                severity: ratio > 0.9 ? 'high' : 'medium',
                claimA: a.text,
                claimB: b.text,
                description: `数值矛盾: ${a.text} vs ${b.text} (差异${Math.round(ratio * 100)}%)`
              });
            }
          }
        }

        // 日期矛盾检测
        if (a.category === 'temporal' && b.category === 'temporal') {
          const dateA = a.text.match(/\d{4}/);
          const dateB = b.text.match(/\d{4}/);
          if (dateA && dateB && dateA[0] !== dateB[0]) {
            const yearA = parseInt(dateA[0]);
            const yearB = parseInt(dateB[0]);
            if (Math.abs(yearA - yearB) > 50) {
              contradictions.push({
                type: 'date_discrepancy',
                severity: 'medium',
                claimA: a.text,
                claimB: b.text,
                description: `日期矛盾: ${a.text} vs ${b.text} (相差${Math.abs(yearA - yearB)}年)`
              });
            }
          }
        }
      }
    }

    return contradictions;
  },

  // 评估声明的重要性（用于优先级排序）
  assessClaimImportance(claim) {
    let score = 0;
    const reasons = [];

    // 带数字的声明更重要
    const numbers = claim.text.match(/\d+/g);
    if (numbers) {
      score += 2;
      reasons.push('含具体数据');
    }

    // 因果声明重要
    if (claim.category === this.ClaimCategory.CAUSAL) {
      score += 3;
      reasons.push('因果声明');
    }

    // 比较声明重要
    if (claim.category === this.ClaimCategory.COMPARISON) {
      score += 2;
      reasons.push('比较声明');
    }

    // 预测声明重要
    if (claim.category === this.ClaimCategory.PREDICTION) {
      score += 2;
      reasons.push('预测声明');
    }

    // 长文本可能包含更多信息
    if (claim.text.length > 50) {
      score += 1;
      reasons.push('详细声明');
    }

    return {
      score,
      priority: score >= 4 ? 'high' : score >= 2 ? 'medium' : 'low',
      reasons
    };
  },

  // 评估声明的时间有效性（某些声明随时间失效）
  assessTemporalValidity(claim, referenceDate = Date.now()) {
    const result = {
      isValid: true,
      expiresAt: null,
      reason: '无时间限制'
    };

    // 检查日期声明
    const yearMatch = claim.text.match(/(?:19|20)(\d{2})/);
    if (yearMatch) {
      const year = parseInt('20' + (yearMatch[1] < 50 ? yearMatch[1] : yearMatch[1])); // 简单年份解析
      const currentYear = new Date(referenceDate).getFullYear();
      const age = currentYear - year;

      if (age > 10) {
        result.isValid = false;
        result.reason = `声明已超过10年 (${year})`;
      } else if (age > 5) {
        result.isValid = true;
        result.reason = `声明距今${age}年，建议核实最新数据`;
      }
      result.expiresAt = new Date(year + 5, 0, 1).toISOString();
    }

    // 预测声明有时间限制
    if (claim.category === this.ClaimCategory.PREDICTION) {
      result.isValid = false;
      result.reason = '预测声明已过期或待验证';
      result.expiresAt = new Date(referenceDate).toISOString();
    }

    return result;
  },

  // 生成声明的唯一指纹（用于去重和追踪）
  generateClaimFingerprint(claim) {
    const normalized = claim.text
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fff]/g, '')
      .slice(0, 50);
    const { createHash } = require('crypto');
    return createHash('md5').update(normalized).digest('hex').slice(0, 8);
  },

  // 为声明生成未核实标记
  markUnverified(claims) {
    if (!claims.hasUnverified) return '';
    const categories = claims.categoryBreakdown || {};
    const parts = [];
    if (categories[this.ClaimCategory.STATISTICAL]) parts.push('数据');
    if (categories[this.ClaimCategory.COMPARISON]) parts.push('比较');
    if (categories[this.ClaimCategory.CAUSAL]) parts.push('因果');
    if (categories[this.ClaimCategory.PREDICTION]) parts.push('预测');
    const detail = parts.length > 0 ? ` (${parts.join('/')})` : '';
    return ` ⚠️[未核实${detail}]`;
  },

  // 批量评估多个声明的置信度并排序
  batchAssess(claimsArray) {
    return claimsArray
      .map(claim => {
        const confidence = this.assessConfidence(claim.text, {});
        const importance = this.assessClaimImportance(claim);
        const validity = this.assessTemporalValidity(claim);
        const fingerprint = this.generateClaimFingerprint(claim);
        return {
          ...claim,
          confidence: confidence.score,
          confidenceLevel: confidence.level,
          importance: importance.score,
          priority: importance.priority,
          temporalValidity: validity,
          fingerprint
        };
      })
      .sort((a, b) => {
        // 按重要性降序，同重要性按置信度降序
        if (b.importance !== a.importance) return b.importance - a.importance;
        return b.confidence - a.confidence;
      });
  },

  // 格式化输出：每个声明及置信度
  formatAnnotations(text) {
    const claims = this.extractClaims(text);
    const parts = [];

    if (claims.citations.length > 0) {
      parts.push(`学术引用 ${claims.citations.length} 处 [high]`);
    }
    if (claims.percentages.length > 0) {
      parts.push(`百分比 ${claims.percentages.join(', ')}`);
    }
    if (claims.numbers.length > 0) {
      parts.push(`数据 ${claims.numbers.slice(0, 2).join(', ')}`);
    }
    if (claims.claimCount > 0) {
      const breakdown = Object.entries(claims.categoryBreakdown || {})
        .map(([cat, count]) => `${cat}:${count}`)
        .join(', ');
      parts.push(`声明分类 ${breakdown}`);
    }
    if (claims.hasUnverified) {
      parts.push('存在未核实数据 ⚠️[unverified]');
    }

    return parts.length > 0 ? parts.join(' | ') : null;
  },

  // 生成完整声明分析报告
  generateReport(text) {
    const claims = this.extractClaims(text);
    const categorized = claims.categorizedClaims || [];
    const contradictions = this.detectContradictions(categorized);
    const assessed = this.batchAssess(categorized);
    const confidence = this.assessConfidence(text, {});

    return {
      summary: {
        totalClaims: claims.claimCount,
        verified: claims.citations.length > 0,
        hasUnverified: claims.hasUnverified,
        contradictions: contradictions.length,
        overallConfidence: confidence
      },
      categoryBreakdown: claims.categoryBreakdown,
      contradictions,
      claimsByPriority: {
        high: assessed.filter(c => c.priority === 'high'),
        medium: assessed.filter(c => c.priority === 'medium'),
        low: assessed.filter(c => c.priority === 'low')
      },
      annotation: this.formatAnnotations(text)
    };
  }
};

module.exports = { hypothesisTester };
