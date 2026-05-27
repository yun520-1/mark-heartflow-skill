/**
 * TruthfulnessChecker — 真实性核查器 v2.1
 * Avoid lying, no hedging, evidence-based conclusions
 * 
 * ⚠️ 重要声明：本模块使用【模式匹配】（正则/关键词）进行核查，
 * 不是 LLM 驱动的语义理解。对复杂推理的核查能力有限。
 * 依赖 LLM 做真实语义判断时，请用 hf.dispatch('meta.learn') 接入 LLM。
 * 
 * 核心功能：
 * 1. 数字核查 - 验证引用的数字是否合理
 * 2. 引用溯源 - 检查声称是否有来源
 * 3. 逻辑一致性检测 - 检测陈述中的逻辑矛盾
 * 
 * From mark-StillWater security.js: TruthfulnessChecker — 数字核查/引用溯源/逻辑一致性检测
 */

const fs = require('fs');
const path = require('path');

class TruthfulnessChecker {
  constructor(rootPath) {
    this.rootPath = rootPath;
    this.filePath = path.join(rootPath, 'truthfulness-stats.json');
    this._state = this._load();
    
    // 逻辑矛盾模式库
    this.contradictionPatterns = [
      // 自我矛盾
      { pattern: /(.*)但是(.*)\1/gi, type: '自我矛盾' },
      { pattern: /(.*)然而(.*)\1/gi, type: '自我矛盾' },
      { pattern: /(.*)不过(.*)\1/gi, type: '自我矛盾' },
      // 因果矛盾
      { pattern: /因为.*所以.*但是/gi, type: '因果矛盾' },
      { pattern: /因此.*然而/gi, type: '因果矛盾' },
      // 绝对化矛盾
      { pattern: /所有.*都.*有些.*不/gi, type: '全称与特称矛盾' },
      { pattern: /永远.*有时/gi, type: '绝对与相对矛盾' },
    ];
  }

  _load() {
    try {
      if (fs.existsSync(this.filePath)) {
        return JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
      }
    } catch { /* ignore */ }
    return { 
      totalStatements: 0, 
      liesCaught: 0, 
      statements: [],
      numberChecks: 0,
      sourceChecks: 0,
      contradictionChecks: 0,
      contradictionsFound: 0
    };
  }

  _persist() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this._state, null, 2));
    } catch { /* ignore */ }
  }

  // ─── Detection ────────────────────────────────────────────────────────

  /**
   * Check if a statement is potentially lying or hedging
   */
  checkStatement(statement) {
    this._state.totalStatements++;

    let isLying = false;
    let reason = '';

    const absWords = ['肯定', '绝对', '一定', '必然', '毫无疑问', '绝对确定', '绝对是', '100%', '全部', '所有'];
    const evidenceWords = ['因为', '证据', '根据', '数据显示', '研究表明', '实践证明', '事实表明', '观察发现'];

    const hasAbs = absWords.some(w => statement.includes(w));
    const hasEvidence = evidenceWords.some(w => statement.includes(w));

    // Absolute words without evidence = potential lie
    if (hasAbs && !hasEvidence) {
      isLying = true;
      reason = '使用了绝对词但无证据支持';
    }

    // Check for fabricated numbers
    const numMatch = statement.match(/\d+%|\\d+次|\d+个|\d+人/);
    if (numMatch && !hasEvidence) {
      isLying = true;
      reason = '陈述包含数字但无证据支持';
    }

    // Check for hedge words (less severe)
    const hedgeWords = ['可能', '也许', '大概', '应该', '或许', '似乎', '好像'];
    const hasHedge = hedgeWords.some(w => statement.includes(w));
    const confidence = hasHedge ? 0.4 : (hasEvidence ? 0.9 : 0.6);

    if (isLying) {
      this._state.liesCaught++;
    }

    // Record statement
    this._state.statements.push({
      text: statement.substring(0, 200),
      isLying,
      reason,
      timestamp: Date.now(),
    });

    // Keep last 100 statements
    if (this._state.statements.length > 100) {
      this._state.statements = this._state.statements.slice(-100);
    }

    this._persist();

    return { isLying, confidence, reason };
  }

  // ─── 数字核查 ─────────────────────────────────────────────────────────

  /**
   * 数字核查 - 验证引用的数字是否合理
   * @param {string} statement - 待核查语句
   * @returns {object} - { isValid, issues[], details }
   */
  checkNumbers(statement) {
    this._state.numberChecks++;
    const issues = [];
    
    // 提取所有数字
    const numbers = statement.match(/\d+\.?\d*/g) || [];
    
    for (const num of numbers) {
      const numValue = parseFloat(num);
      
      // 检查不合理的百分比
      if (statement.includes('%') && (numValue < 0 || numValue > 100)) {
        issues.push({
          type: 'impossible_percentage',
          value: num,
          issue: `百分比值${num}%超出0-100范围`
        });
      }
      
      // 检查不合理的数量级
      if (numValue > 1e9) {
        issues.push({
          type: 'suspiciously_large',
          value: num,
          issue: `数字${num}非常大，需要确认来源`
        });
      }
      
      // 检查过于精确的数字 (如 67.823456%)
      const decimalMatch = statement.match(new RegExp(`${num}\\.\\d+`));
      if (decimalMatch && statement.includes('%')) {
        issues.push({
          type: 'overly_precise',
          value: decimalMatch[0],
          issue: '百分比精度过高，可能为估算'
        });
      }
    }
    
    // 检查"所有"、"全部"等极端词与具体数字的矛盾
    if ((statement.includes('所有') || statement.includes('全部')) && numbers.length > 0) {
      issues.push({
        type: 'absolute_with_specific',
        value: statement.substring(0, 50),
        issue: '使用绝对词同时给出具体数字，可能不准确'
      });
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      numbersFound: numbers.length
    };
  }

  // ─── 引用溯源 ─────────────────────────────────────────────────────────

  /**
   * 引用溯源 - 检查声称是否有来源
   * @param {string} statement - 待核查语句
   * @returns {object} - { hasSource, sourceType, confidence }
   */
  checkSources(statement) {
    this._state.sourceChecks++;
    
    const sourceIndicators = {
      explicit: [
        '根据', '依据', '来源于', '来自', '数据显示', '研究表明',
        '据报道', '据悉', '官方数据显示', '统计显示'
      ],
      implicit: [
        '据说', '听说', '有人认为', '有人说', '传言', '传闻'
      ],
      academic: [
        '论文', '期刊', '学术', '研究', '实验', '调查', '数据显示',
        'Nature', 'Science', 'arXiv'
      ],
      official: [
        '官方', '政府', '部门', '机构', '组织', '委员会', '统计局'
      ]
    };
    
    let sourceType = 'unspecified';
    let hasSource = false;
    let confidence = 0.3;
    
    // 检查显式来源
    for (const indicator of sourceIndicators.explicit) {
      if (statement.includes(indicator)) {
        hasSource = true;
        sourceType = 'explicit';
        confidence = 0.9;
        break;
      }
    }
    
    // 检查隐式来源（降低置信度）
    if (!hasSource) {
      for (const indicator of sourceIndicators.implicit) {
        if (statement.includes(indicator)) {
          hasSource = true;
          sourceType = 'implicit';
          confidence = 0.5;
          break;
        }
      }
    }
    
    // 检查学术来源
    for (const indicator of sourceIndicators.academic) {
      if (statement.includes(indicator)) {
        sourceType = 'academic';
        confidence = Math.max(confidence, 0.85);
        break;
      }
    }
    
    // 检查官方来源
    for (const indicator of sourceIndicators.official) {
      if (statement.includes(indicator)) {
        sourceType = 'official';
        confidence = Math.max(confidence, 0.8);
        break;
      }
    }
    
    return { hasSource, sourceType, confidence };
  }

  // ─── 逻辑一致性检测 ──────────────────────────────────────────────────

  /**
   * 逻辑一致性检测 - 检测陈述中的逻辑矛盾
   * @param {string} statement - 待核查语句
   * @returns {object} - { isConsistent, contradictions[] }
   */
  checkLogicalConsistency(statement) {
    this._state.contradictionChecks++;
    const contradictions = [];
    
    // 自我矛盾检测
    const selfContraPatterns = [
      { pattern: /但不/gi, type: '转折矛盾' },
      { pattern: /然而.*但/gi, type: '转折矛盾' },
      { pattern: /虽然.*但是.*虽然/gi, type: '多重矛盾' },
    ];
    
    for (const { pattern, type } of selfContraPatterns) {
      if (pattern.test(statement)) {
        contradictions.push({
          type,
          severity: 'medium',
          detail: '检测到转折词矛盾'
        });
      }
    }
    
    // 全称与特称矛盾
    if (/所有.*都是.*有些.*不是/.test(statement)) {
      contradictions.push({
        type: '全称特称矛盾',
        severity: 'high',
        detail: '使用"所有"但又提及"有些不是"'
      });
    }
    
    // 绝对与相对矛盾
    if (/永远.*有时/.test(statement) || /始终.*偶尔/.test(statement)) {
      contradictions.push({
        type: '绝对相对矛盾',
        severity: 'medium',
        detail: '使用绝对词同时暗示相对性'
      });
    }
    
    // 因果关系矛盾
    if (/(因为|因此|所以).*(但是|然而)/gi.test(statement)) {
      contradictions.push({
        type: '因果矛盾',
        severity: 'medium',
        detail: '因果推理中包含转折'
      });
    }
    
    if (contradictions.length > 0) {
      this._state.contradictionsFound++;
    }
    
    return {
      isConsistent: contradictions.length === 0,
      contradictions
    };
  }

  // ─── 综合核查 ─────────────────────────────────────────────────────────

  /**
   * 综合核查 - 数字核查 + 引用溯源 + 逻辑一致性
   * @param {string} statement - 待核查语句
   * @returns {object} - 完整核查结果
   */
  fullCheck(statement) {
    const numberResult = this.checkNumbers(statement);
    const sourceResult = this.checkSources(statement);
    const logicalResult = this.checkLogicalConsistency(statement);
    const lyingResult = this.checkStatement(statement);
    
    const issues = [
      ...numberResult.issues.map(i => ({ ...i, category: 'number' })),
      ...logicalResult.contradictions.map(c => ({ ...c, category: 'logic' }))
    ];
    
    if (!sourceResult.hasSource) {
      issues.push({
        category: 'source',
        type: 'no_source',
        severity: 'low',
        detail: '陈述无明确来源'
      });
    }
    
    return {
      statement: statement.substring(0, 100),
      isLying: lyingResult.isLying,
      confidence: lyingResult.confidence,
      numberCheck: numberResult,
      sourceCheck: sourceResult,
      logicalCheck: logicalResult,
      overallIssues: issues.length,
      issues,
      timestamp: Date.now()
    };
  }

  // ─── Stats ─────────────────────────────────────────────────────────

  getLyingStats() {
    const total = this._state.totalStatements || 1;
    return {
      totalStatements: this._state.totalStatements,
      liesCaught: this._state.liesCaught,
      lieRate: this._state.liesCaught / total,
    };
  }

  getRecentStatements(limit = 10) {
    return this._state.statements.slice(-limit);
  }

  getStats() {
    return {
      ...this.getLyingStats(),
      numberChecks: this._state.numberChecks,
      sourceChecks: this._state.sourceChecks,
      contradictionChecks: this._state.contradictionChecks,
      contradictionsFound: this._state.contradictionsFound,
      version: 'v2.0.0'
    };
  }

  /**
   * Record a lie that was caught externally
   */
  recordLie(statement, context) {
    this._state.liesCaught++;
    this._state.totalStatements++;
    this._state.statements.push({
      text: statement.substring(0, 200),
      isLying: true,
      reason: context || '外部确认',
      timestamp: Date.now(),
    });
    this._persist();
    return { liesCaught: this._state.liesCaught };
  }

  /**
   * Annotate confidence level to statement
   */
  annotateConfidence(statement, confidence) {
    if (confidence < 0.5) {
      return statement + ' [置信度: 低]';
    } else if (confidence < 0.8) {
      return statement + ' [置信度: 中]';
    }
    return statement;
  }

  /**
   * [NEW] 语义熵幻觉检测 (Semantic Entropy)
   * Paper: "Detecting hallucinations in LLMs using semantic entropy" (2024)
   *
   * 原理: 高语义熵 = 高不确定性 = 更可能是幻觉
   * 通过分析生成文本的语义多样性来检测幻觉
   *
   * @param {string} statement - 待检测文本
   * @returns {object} - { entropy, hallucinationRisk, interpretation }
   */
  detectSemanticEntropy(statement) {
    if (!statement || statement.length < 10) {
      return { entropy: 0, hallucinationRisk: 'low', interpretation: '文本过短无法分析' };
    }

    // 语义熵计算 - 基于词的多样性
    const words = statement.split(/\s+/).filter(w => w.length > 2);
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    const wordCount = words.length || 1;

    // 词汇重复率 (重复越多越确定)
    const repetitionRate = 1 - (uniqueWords.size / wordCount);

    // 数字/百分比检测 (具体数字越多越可能幻觉)
    const hasNumbers = /\d+/.test(statement);
    const numberDensity = (statement.match(/\d+/g) || []).length / wordCount;

    // 引用/来源检测
    const hasCitation = /(arxiv|ACL|ICML|NeurIPS|arxiv:\d+|paper|study|research)/i.test(statement);

    // 不确定词检测
    const uncertaintyWords = ['可能', '也许', '大概', '也许', '似乎', '应该', 'probably', 'maybe', 'perhaps', 'might', 'could'];
    const hasUncertainty = uncertaintyWords.some(w => statement.includes(w));

    // 熵值计算 (基于多个信号)
    const entropy = (
      repetitionRate * 0.3 +
      numberDensity * 0.4 +
      (hasNumbers ? 0.2 : 0) +
      (!hasCitation && hasNumbers ? 0.2 : 0) +
      (!hasUncertainty && hasNumbers ? 0.15 : 0)
    );

    // 幻觉风险等级
    let hallucinationRisk;
    if (entropy > 0.7) hallucinationRisk = 'high';
    else if (entropy > 0.4) hallucinationRisk = 'medium';
    else hallucinationRisk = 'low';

    return {
      entropy: Math.round(entropy * 100) / 100,
      hallucinationRisk,
      signals: {
        repetitionRate: Math.round(repetitionRate * 100) / 100,
        numberDensity: Math.round(numberDensity * 100) / 100,
        hasNumbers,
        hasCitation,
        hasUncertainty
      },
      interpretation: entropy > 0.6
        ? '高幻觉风险: 具体数字多但无引用, 可能是编造'
        : entropy > 0.3
        ? '中幻觉风险: 存在一定不确定性信号'
        : '低幻觉风险: 表述谨慎,有引用或不确定词'
    };
  }
}

module.exports = { TruthfulnessChecker };
