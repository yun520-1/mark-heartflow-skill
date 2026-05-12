/**
 * Semantic Anchor - 语义锚点理解模块
 * 识别歧义词并生成明确的上下文定义
 */

class SemanticAnchor {
  constructor() {
    this.anchorHistory = [];
    this.ambiguityPatterns = this.initializePatterns();
  }

  initializePatterns() {
    return {
      pronouns: {
        patterns: ['这个', '那个', '这些', '那些', '它', '它们', '他', '她', 'this', 'that', 'it', 'these', 'those'],
        type: '代词指代',
        requiresContext: true
      },
      demonstratives: {
        patterns: ['这样', '那样', '如此', 'such', 'so'],
        type: '指示词',
        requiresContext: true
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
        requiresMetric: true
      },
      abstractTerms: {
        patterns: [
          '效率', '性能', '体验', '质量', '优化',
          '改进', '提升', '完善', '重构',
          '用户体验', '代码质量', '系统性能',
          'efficiency', 'performance', 'quality', 'UX'
        ],
        type: '抽象概念',
        requiresClarification: true
      },
      quantifiers: {
        patterns: ['一些', '一点', '一些些', '稍微', '若干', 'some', 'a bit', 'a little'],
        type: '模糊量词',
        requiresMetric: true
      }
    };
  }

  /**
   * 检测歧义
   */
  detectAmbiguity(userMessage, context = {}) {
    const message = userMessage.toLowerCase();
    const findings = [];

    for (const [category, config] of Object.entries(this.ambiguityPatterns)) {
      for (const pattern of config.patterns) {
        if (message.includes(pattern)) {
          const position = message.indexOf(pattern);
          const surrounding = message.substring(
            Math.max(0, position - 30),
            Math.min(message.length, position + pattern.length + 30)
          );

          findings.push({
            term: pattern,
            category: config.type,
            requiresContext: config.requiresContext,
            requiresMetric: config.requiresMetric,
            requiresClarification: config.requiresClarification,
            position: position,
            surrounding: surrounding,
            confidence: this.calculateConfidence(pattern, context)
          });
        }
      }
    }

    return {
      hasAmbiguity: findings.length > 0,
      findings: findings,
      needsAnchoring: findings.filter(f => f.confidence < 0.8).length > 0
    };
  }

  /**
   * 计算置信度
   */
  calculateConfidence(term, context) {
    if (!context.previousMessages || context.previousMessages.length === 0) {
      return 0.3;
    }

    const recent = context.previousMessages.slice(-3);
    for (const msg of recent) {
      if (msg.toLowerCase().includes(term)) {
        return 0.8;
      }
    }

    return 0.5;
  }

  /**
   * 生成语义锚点
   */
  generateAnchor(term, context = {}) {
    const previousMessages = context.previousMessages || [];
    const anchors = [];

    for (const prevMsg of previousMessages.slice(-5)) {
      const anchor = this.extractPossibleAnchors(term, prevMsg);
      if (anchor) {
        anchors.push(anchor);
      }
    }

    const bestAnchor = anchors[0] || {
      anchor: term,
      source: 'unknown',
      definition: '需要更多上下文'
    };

    const result = {
      term: term,
      definition: bestAnchor.definition,
      source: bestAnchor.source,
      alternatives: anchors.slice(0, 3).map(a => a.definition),
      confidence: anchors.length > 0 ? 0.7 : 0.3,
      timestamp: new Date().toISOString()
    };

    this.anchorHistory.push(result);
    return result;
  }

  /**
   * 提取可能的锚点
   */
  extractPossibleAnchors(term, message) {
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
      if (term.includes(key) || key.includes(term)) {
        for (const p of data.patterns) {
          if (message.toLowerCase().includes(p)) {
            return {
              anchor: key,
              definition: data.getDefinition(p),
              source: 'context_match'
            };
          }
        }
      }
    }

    return null;
  }

  /**
   * 完整处理用户消息
   */
  processMessage(userMessage, context = {}) {
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

    for (const finding of ambiguity.findings) {
      if (finding.confidence < 0.8) {
        const anchor = this.generateAnchor(finding.term, context);
        anchors.push({
          finding: finding,
          anchor: anchor
        });
        
        if (anchor.confidence < 0.5) {
          unresolved.push(finding);
        }
      }
    }

    const internalNote = this.formatInternalNote(anchors);
    
    return {
      needsAnchor: true,
      message: userMessage,
      internalNote: internalNote,
      anchors: anchors,
      unresolved: unresolved,
      needsClarification: unresolved.length > 0
    };
  }

  /**
   * 格式化内部锚定记录
   */
  formatInternalNote(anchors) {
    if (anchors.length === 0) return null;

    const lines = anchors.map(a => {
      const term = a.finding.term;
      const def = a.anchor.definition;
      return `模糊词: ${term}, 我理解为: ${def}`;
    });

    return `[语义锚定] ${lines.join('; ')}`;
  }

  /**
   * 生成澄清问题
   */
  generateClarificationQuestion(term, category) {
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

    return questions[category]?.[term] || `您提到的"${term}"，能具体说明一下吗？`;
  }

  /**
   * 生成复述确认
   */
  generateParaphraseConfirmation(userMessage, anchors = []) {
    const keyPoints = anchors.map(a => a.anchor.definition).slice(0, 2);
    const summary = keyPoints.join('，');
    
    return `为确保我准确理解了，您的问题是"${userMessage.substring(0, 50)}..."，对吗？${summary ? `\n我理解您希望${summary}` : ''}`;
  }

  getHistory() {
    return this.anchorHistory;
  }
}

module.exports = { SemanticAnchor };
