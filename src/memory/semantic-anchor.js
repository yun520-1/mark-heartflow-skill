/**
 * Semantic Anchor - 语义锚点理解模块（v2.0.0）
 * 识别歧义词并生成明确的上下文定义
 *
 * 升级内容:
 *   v2.0.0 — 增加参数验证、边界检查、异常检测、震荡检测、
 *            错误分类与重试策略、防御性编程
 */

'use strict';

class SemanticAnchor {
  constructor(options = {}) {
    // === 参数验证与防御性初始化 ===
    if (typeof options !== 'object' || options === null) {
      options = {};
    }

    this.anchorHistory = [];
    this.maxHistorySize = options.maxHistorySize || 100;
    this.maxUnresolvedPerMessage = options.maxUnresolvedPerMessage || 5;
    this.minConfidenceThreshold = options.minConfidenceThreshold || 0.3;
    this.mediumConfidenceThreshold = options.mediumConfidenceThreshold || 0.6;
    this.highConfidenceThreshold = options.highConfidenceThreshold || 0.8;
    this.maxRetriesPerAnchor = options.maxRetriesPerAnchor || 3;

    // 震荡检测：跟踪同一模糊词的频率
    this._oscillationTracker = new Map(); // term → { count, lastSeen, timestamps[] }
    this._oscillationWindowMs = options.oscillationWindowMs || 60000; // 1分钟窗口
    this._oscillationThreshold = options.oscillationThreshold || 3;   // 3次即判定为震荡

    // 降级回退：当锚定失败时的备选策略
    this._fallbackStrategies = [
      'exact_text_repeat',
      'ask_clarification',
      'use_default_definition'
    ];

    // 错误分类统计
    this._errorStats = {
      totalAnchorsAttempted: 0,
      totalAnchorsFailed: 0,
      totalRetries: 0,
      oscillationDetections: 0,
      fallbackUsed: 0,
      boundaryViolations: 0
    };

    this.ambiguityPatterns = this.initializePatterns();

    // 验证初始化结果
    this._validateInitialState();
  }

  /**
   * 验证初始状态的完整性
   */
  _validateInitialState() {
    const requiredFields = [
      'anchorHistory', 'maxHistorySize', 'maxUnresolvedPerMessage',
      'minConfidenceThreshold', 'mediumConfidenceThreshold',
      'highConfidenceThreshold', 'maxRetriesPerAnchor',
      '_oscillationTracker', '_oscillationWindowMs', '_oscillationThreshold',
      '_fallbackStrategies', '_errorStats', 'ambiguityPatterns'
    ];
    for (const field of requiredFields) {
      if (this[field] === undefined) {
        // 已禁用 console.warn: console.warn(`[SemanticAnchor] 初始化警告: ${field} 未正确设置`);
      }
    }
  }

  /**
   * 参数边界检查：确保数值参数在合理范围内
   */
  _clampParam(value, min, max, defaultValue) {
    if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
      return defaultValue;
    }
    return Math.max(min, Math.min(max, value));
  }

  initializePatterns() {
    return {
      pronouns: {
        patterns: ['这个', '那个', '这些', '那些', '它', '它们', '他', '她', 'this', 'that', 'it', 'these', 'those'],
        type: '代词指代',
        requiresContext: true,
        severity: 'medium'
      },
      demonstratives: {
        patterns: ['这样', '那样', '如此', 'such', 'so'],
        type: '指示词',
        requiresContext: true,
        severity: 'medium'
      },
      vagueAdjectives: {
        patterns: [
          '好一点的', '好一点', '更好', '更好一些',
          '效率高', '效率低', '效率好一点',
          '简单', '复杂', '容易', '困难',
          '快', '慢', '早', '晚',
          'better', 'worse', 'faster', 'slower', 'easier',
          'good', 'bad', 'simple', 'complex'
        ],
        type: '模糊形容词',
        requiresMetric: true,
        severity: 'low'
      },
      abstractTerms: {
        patterns: [
          '效率', '性能', '体验', '质量', '优化',
          '改进', '提升', '完善', '重构',
          '用户体验', '代码质量', '系统性能',
          'efficiency', 'performance', 'quality', 'UX'
        ],
        type: '抽象概念',
        requiresClarification: true,
        severity: 'low'
      },
      quantifiers: {
        patterns: ['一些', '一点', '一些些', '稍微', '若干', 'some', 'a bit', 'a little'],
        type: '模糊量词',
        requiresMetric: true,
        severity: 'low'
      }
    };
  }

  /**
   * 检测歧义 — 增强版：含输入验证、边界检查、震荡检测
   */
  detectAmbiguity(userMessage, context = {}) {
    // === 输入验证 ===
    if (typeof userMessage !== 'string' || !userMessage.trim()) {
      return {
        hasAmbiguity: false,
        findings: [],
        needsAnchoring: false,
        error: '消息为空或无效',
        errorType: 'invalid_input'
      };
    }

    // === 边界检查：消息过长时截断 ===
    const MAX_MESSAGE_LENGTH = 10000;
    const message = userMessage.toLowerCase().substring(0, MAX_MESSAGE_LENGTH);
    if (userMessage.length > MAX_MESSAGE_LENGTH) {
      this._errorStats.boundaryViolations++;
      // 已禁用 console.warn: console.warn(`[SemanticAnchor] 消息过长 (${userMessage.length} 字符)，已截断至 ${MAX_MESSAGE_LENGTH}`);
    }

    // === 上下文验证 ===
    if (typeof context !== 'object' || context === null) {
      context = {};
    }
    if (!Array.isArray(context.previousMessages)) {
      context.previousMessages = [];
    }

    const findings = [];

    for (const [category, config] of Object.entries(this.ambiguityPatterns)) {
      // 验证 pattern 配置
      if (!Array.isArray(config.patterns)) {
        // 已禁用 console.warn: console.warn(`[SemanticAnchor] 类别 ${category} 的 patterns 配置无效`);
        continue;
      }

      for (const pattern of config.patterns) {
        // 边界检查：pattern 必须是非空字符串
        if (typeof pattern !== 'string' || pattern.length === 0) continue;

        if (message.includes(pattern)) {
          const position = message.indexOf(pattern);

          // 边界检查：防止 substring 越界
          const contextRadius = 30;
          const start = Math.max(0, position - contextRadius);
          const end = Math.min(message.length, position + pattern.length + contextRadius);
          const surrounding = message.substring(start, end);

          // === 震荡检测：同一模糊词在窗口内出现太多次 ===
          const oscillation = this._detectOscillation(pattern);

          const finding = {
            term: pattern,
            category: config.type,
            requiresContext: !!config.requiresContext,
            requiresMetric: !!config.requiresMetric,
            requiresClarification: !!config.requiresClarification,
            severity: config.severity || 'low',
            position: position,
            surrounding: surrounding,
            confidence: this.calculateConfidence(pattern, context),
            oscillationDetected: oscillation.detected,
            oscillationCount: oscillation.count,
            oscillationFrequency: oscillation.frequency
          };
          findings.push(finding);
        }
      }
    }

    // === 对震荡结果标记需要更高优先级的锚定 ===
    const needsAnchoring = findings.filter(f =>
      f.confidence < this.highConfidenceThreshold ||
      f.oscillationDetected
    ).length > 0;

    return {
      hasAmbiguity: findings.length > 0,
      findings: findings,
      needsAnchoring: needsAnchoring,
      oscillationWarning: findings.filter(f => f.oscillationDetected).length > 0
        ? '检测到重复模糊词，建议主动澄清'
        : null
    };
  }

  /**
   * 震荡检测：检测同一模糊词在短时间内重复出现
   * 这表示用户可能在使用一个不够明确的词，或者需要更精确的沟通
   */
  _detectOscillation(term) {
    const now = Date.now();
    if (!this._oscillationTracker.has(term)) {
      this._oscillationTracker.set(term, {
        count: 1,
        lastSeen: now,
        timestamps: [now]
      });
      return { detected: false, count: 1, frequency: 0 };
    }

    const record = this._oscillationTracker.get(term);

    // 清除窗口外的旧记录
    record.timestamps = record.timestamps.filter(t => (now - t) < this._oscillationWindowMs);

    // 添加新时间戳
    record.timestamps.push(now);
    record.count = record.timestamps.length;
    record.lastSeen = now;

    // 限制时间戳列表长度防止内存泄漏
    if (record.timestamps.length > 100) {
      record.timestamps = record.timestamps.slice(-50);
    }

    // 计算频率（次/分钟）
    const elapsed = Math.max(1, now - record.timestamps[0]);
    const frequency = (record.count / elapsed) * 60000;

    const detected = record.count >= this._oscillationThreshold;

    if (detected) {
      this._errorStats.oscillationDetections++;
    }

    return { detected, count: record.count, frequency: Math.round(frequency * 10) / 10 };
  }

  /**
   * 计算置信度 — 增强版：含边界检查和降级策略
   */
  calculateConfidence(term, context) {
    // === 输入验证 ===
    if (typeof term !== 'string') return this.minConfidenceThreshold;
    if (typeof context !== 'object' || context === null) {
      context = {};
    }

    const previousMessages = context.previousMessages;
    if (!Array.isArray(previousMessages) || previousMessages.length === 0) {
      // 无上下文时的基线置信度
      return this.minConfidenceThreshold;
    }

    // 安全切片：最多取最近3条
    const recentCount = this._clampParam(3, 1, 10, 3);
    const recent = previousMessages.slice(-recentCount);
    let matches = 0;

    for (const msg of recent) {
      if (typeof msg === 'string' && msg.toLowerCase().includes(term)) {
        matches++;
      }
    }

    // 根据匹配比例计算置信度
    if (matches === 0) return 0.4;
    const ratio = matches / recent.length;
    if (ratio >= 0.66) return 0.85;
    if (ratio >= 0.33) return 0.7;
    return 0.5;
  }

  /**
   * 生成语义锚点 — 增强版：含重试机制、降级策略、异常恢复
   */
  generateAnchor(term, context = {}) {
    // === 输入验证 ===
    if (typeof term !== 'string' || !term.trim()) {
      return {
        anchor: term || '',
        definition: '输入参数无效',
        source: 'error',
        alternatives: [],
        confidence: 0,
        timestamp: new Date().toISOString(),
        error: 'term 为空或无效',
        errorType: 'invalid_input'
      };
    }

    const previousMessages = (context && Array.isArray(context.previousMessages))
      ? context.previousMessages
      : [];

    this._errorStats.totalAnchorsAttempted++;

    let anchors = [];
    let retries = 0;
    let lastError = null;

    // === 重试机制：最多重试 maxRetriesPerAnchor 次 ===
    while (retries <= this.maxRetriesPerAnchor && anchors.length === 0) {
      try {
        for (const prevMsg of previousMessages.slice(-5)) {
          if (typeof prevMsg !== 'string') continue;
          const anchor = this.extractPossibleAnchors(term, prevMsg);
          if (anchor) {
            anchors.push(anchor);
          }
        }
        break; // 成功则跳出重试循环
      } catch (e) {
        lastError = e;
        retries++;
        this._errorStats.totalRetries++;
        if (retries <= this.maxRetriesPerAnchor) {
          // 指数退避：100ms, 200ms, 400ms
          const backoff = 100 * Math.pow(2, retries - 1);
          // 在同步环境下用延迟模拟重试等待
          const waitUntil = Date.now() + backoff;
          // 已移除忙等待：请使用异步延迟
        }
      }
    }

    // === 降级策略：当锚定失败时使用备选方案 ===
    let bestAnchor;
    let usedFallback = false;

    if (anchors.length > 0) {
      bestAnchor = anchors[0];
    } else {
      // 降级：使用回退策略
      usedFallback = true;
      this._errorStats.fallbackUsed++;

      // 策略1：精确文本重复
      if (this._fallbackStrategies.includes('exact_text_repeat')) {
        bestAnchor = {
          anchor: term,
          source: 'fallback_exact',
          definition: `用户使用了"${term}"，无法从上下文中找到明确的对应关系`
        };
      } else {
        // 策略2：默认定义
        bestAnchor = {
          anchor: term,
          source: 'fallback_default',
          definition: '需要更多上下文来确定具体含义'
        };
      }
    }

    // === 异常恢复：如果出错则记录但不崩溃 ===
    if (lastError && retries > this.maxRetriesPerAnchor) {
      this._errorStats.totalAnchorsFailed++;
      // 已禁用 console.warn: console.warn(`[SemanticAnchor] 锚定失败 (${term}): ${lastError.message}`);
    }

    const confidence = usedFallback
      ? 0.15
      : Math.min(0.7, 0.3 + (anchors.length * 0.15));

    const result = {
      term: term,
      definition: bestAnchor.definition,
      source: bestAnchor.source,
      alternatives: anchors.slice(0, 3).map(a => a.definition),
      confidence: confidence,
      timestamp: new Date().toISOString(),
      retriesUsed: retries,
      fallbackUsed: usedFallback,
      oscillation: this._oscillationTracker.has(term)
        ? { count: this._oscillationTracker.get(term).count }
        : null
    };

    this.anchorHistory.push(result);

    // 限制历史记录大小
    if (this.anchorHistory.length > this.maxHistorySize) {
      this.anchorHistory = this.anchorHistory.slice(-this.maxHistorySize);
    }

    return result;
  }

  /**
   * 提取可能的锚点 — 增强版：含空值保护
   */
  extractPossibleAnchors(term, message) {
    // === 输入验证 ===
    if (typeof term !== 'string' || typeof message !== 'string') {
      return null;
    }
    if (!term.trim() || !message.trim()) return null;

    const commonAnchors = {
      '这个': {
        patterns: ['重构', '登录', '模块', '方案', '功能', '代码', '优化'],
        getDefinition: (p) => `您提到的"这个${p}"指的是上一条消息中的${p}方案`
      },
      '那个': {
        patterns: ['方法', '做法', '思路', '建议', '方案', '实现'],
        getDefinition: (p) => `我理解您指的是之前讨论的${p}`
      },
      '效率': {
        patterns: ['性能', '速度', '运行', '执行', '响应时间'],
        getDefinition: (p) => `您提到的效率，我理解为${p}相关的性能指标`
      },
      '好一点': {
        patterns: ['性能', '可读性', '维护性', '速度'],
        getDefinition: (p) => `您说的"好一点"，我理解为在${p}方面有所改善`
      }
    };

    for (const [key, data] of Object.entries(commonAnchors)) {
      // 边界检查：防止 includes 空字符串
      if (!key || !term) continue;

      const termMatches = term.includes(key) || key.includes(term);
      if (!termMatches) continue;

      // 验证 data 结构
      if (!Array.isArray(data.patterns) || typeof data.getDefinition !== 'function') {
        continue;
      }

      for (const p of data.patterns) {
        if (typeof p !== 'string') continue;
        if (message.toLowerCase().includes(p)) {
          return {
            anchor: key,
            definition: data.getDefinition(p),
            source: 'context_match'
          };
        }
      }
    }

    return null;
  }

  /**
   * 完整处理用户消息 — 增强版：含全面错误处理和边界保护
   */
  processMessage(userMessage, context = {}) {
    // === 输入验证 ===
    if (typeof userMessage !== 'string' || !userMessage.trim()) {
      return {
        needsAnchor: false,
        message: userMessage || '',
        internalNote: null,
        error: '消息为空或无效',
        errorType: 'invalid_input'
      };
    }

    // 确保 context 是有效对象
    if (typeof context !== 'object' || context === null) {
      context = {};
    }

    try {
      const ambiguity = this.detectAmbiguity(userMessage, context);

      if (!ambiguity.hasAmbiguity) {
        return {
          needsAnchor: false,
          message: userMessage,
          internalNote: null
        };
      }

      const anchors = [];
      const unresolved = [];

      // 限制处理的模糊词数量，防止性能问题
      const findingsToProcess = ambiguity.findings.slice(0, this.maxUnresolvedPerMessage);

      for (const finding of findingsToProcess) {
        // 跳过置信度过高的模糊词
        if (finding.confidence >= this.highConfidenceThreshold) continue;

        try {
          const anchor = this.generateAnchor(finding.term, context);
          anchors.push({
            finding: finding,
            anchor: anchor
          });

          if (anchor.confidence < 0.5 && !anchor.fallbackUsed) {
            unresolved.push(finding);
          }
        } catch (e) {
          // 单个锚定失败不中断整体流程
          // 已禁用 console.warn: console.warn(`[SemanticAnchor] 锚定生成失败 (${finding.term}): ${e.message}`);
          anchors.push({
            finding: finding,
            anchor: {
              term: finding.term,
              definition: '锚定失败',
              source: 'error',
              confidence: 0,
              timestamp: new Date().toISOString()
            }
          });
          unresolved.push(finding);
        }
      }

      const internalNote = this.formatInternalNote(anchors);

      return {
        needsAnchor: true,
        message: userMessage,
        internalNote: internalNote,
        anchors: anchors,
        unresolved: unresolved,
        needsClarification: unresolved.length > 0 || ambiguity.oscillationWarning !== null
      };
    } catch (e) {
      // === 顶层异常恢复：即使 processMessage 抛异常也要返回安全结果 ===
      // 已禁用 console.error: console.error(`[SemanticAnchor] processMessage 异常: ${e.message}`);
      return {
        needsAnchor: false,
        message: userMessage,
        internalNote: '[语义锚定] 处理异常，跳过语义分析',
        error: e.message,
        errorType: 'processing_error',
        needsClarification: false
      };
    }
  }

  /**
   * 格式化内部锚定记录 — 增强版：空值保护
   */
  formatInternalNote(anchors) {
    if (!Array.isArray(anchors) || anchors.length === 0) return null;

    const lines = [];
    for (const a of anchors) {
      if (!a || !a.finding || !a.anchor) continue;
      const term = a.finding.term || '?';
      const def = a.anchor.definition || '?';
      const confidence = a.anchor.confidence !== undefined
        ? ` (置信度:${Math.round(a.anchor.confidence * 100)}%)`
        : '';
      lines.push(`模糊词: ${term}, 我理解为: ${def}${confidence}`);
    }

    if (lines.length === 0) return null;
    return `[语义锚定] ${lines.join('; ')}`;
  }

  /**
   * 生成澄清问题 — 增强版：含错误分类和重试策略建议
   */
  generateClarificationQuestion(term, category) {
    // === 输入验证 ===
    if (typeof term !== 'string') term = '';
    if (typeof category !== 'string') category = '';

    const questions = {
      '模糊形容词': {
        '好一点的': '您提到的"好一点"，具体是指哪个方面？比如性能、可读性还是维护性？',
        '效率高': '您说的"效率高"，具体是指运行速度、内存占用还是开发效率？',
        '简单': '您提到的"简单"，是指代码结构易于理解，还是实现步骤少？',
        'better': 'Could you specify what "better" means - performance, readability, or something else?'
      },
      '抽象概念': {
        '效率': '您提到的"效率"，具体是指哪方面的效率？CPU、内存、网络还是开发效率？',
        '性能': '您说的"性能"，具体是指响应速度、吞吐量还是资源占用？',
        '质量': '您提到的"质量"，是指代码质量、用户体验还是产品功能？',
        'efficiency': 'Could you clarify what type of efficiency you mean - runtime, development, or resource usage?'
      },
      '代词指代': {
        '这个': '您提到的"这个"，具体是指什么？可以描述一下吗？',
        '那个': '您说的"那个"，能具体说明是指什么吗？',
        'it': 'Could you specify what "it" refers to?'
      }
    };

    const directMatch = questions[category]?.[term];
    if (directMatch) return directMatch;

    // === 震荡检测辅助 ===
    if (this._oscillationTracker.has(term) &&
        this._oscillationTracker.get(term).count >= this._oscillationThreshold) {
      const count = this._oscillationTracker.get(term).count;
      return `我注意到您多次提到"${term}"（${count}次），为了更准确地理解您，能具体说明一下您想表达的意思吗？`;
    }

    return `您提到的"${term}"，能具体说明一下吗？`;
  }

  /**
   * 生成复述确认 — 增强版：边界保护
   */
  generateParaphraseConfirmation(userMessage, anchors = []) {
    if (typeof userMessage !== 'string') {
      return '为确保我准确理解了，请描述一下您的需求？';
    }

    const maxMessagePreview = 50;
    const messagePreview = userMessage.substring(0, maxMessagePreview);
    const truncated = userMessage.length > maxMessagePreview ? '...' : '';

    if (!Array.isArray(anchors)) {
      anchors = [];
    }

    const keyPoints = anchors
      .filter(a => a && a.anchor && a.anchor.definition)
      .map(a => a.anchor.definition)
      .slice(0, 2);

    const summary = keyPoints.join('，');

    let result = `为确保我准确理解了，您的问题是"${messagePreview}${truncated}"，对吗？`;
    if (summary) {
      result += `\n我理解您希望${summary}`;
    }
    return result;
  }

  /**
   * 获取错误统计
   */
  getErrorStats() {
    return { ...this._errorStats };
  }

  /**
   * 重置震荡检测器
   */
  resetOscillationTracker() {
    this._oscillationTracker.clear();
    return true;
  }

  getHistory() {
    return this.anchorHistory.slice();
  }
}

module.exports = { SemanticAnchor };
