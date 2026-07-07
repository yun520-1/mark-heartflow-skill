/**
 * Transmission Engine v1.1.0 — 知识传递与传承引擎
 * 
 * 功能：
 * - 从对话历史中提炼核心教训（lesson distillation）
 * - 将教训转化为可传递的 skill 格式
 * - 维护传承日志（transmission log）
 * - 版本化传递，确保知识不丢失
 * - [v1.1.0] 错误分类枚举 + 去重检测 + 输入验证 + 优先级自升级 + 震荡检测
 */

const path = require('path');
const fs = require('fs');

// ============================================================================
// 错误分类枚举 (v1.1.0 新增)
// ============================================================================
const ErrorCategory = Object.freeze({
  /** 用户明确指出的逻辑/事实错误 */
  FACTUAL:       'factual',
  /** 重复出现的同类错误模式 */
  PATTERN:       'pattern',
  /** 用户给出的明确指令/约束 */
  INSTRUCTION:   'instruction',
  /** 用户提供的深层洞察/知识 */
  INSIGHT:       'insight',
  /** 上下文理解偏差 */
  CONTEXT:       'context',
  /** 风格/表达不符合预期 */
  STYLE:         'style',
  /** 安全/伦理边界问题 */
  SAFETY:        'safety',
  /** 无法分类的其他情况 */
  OTHER:         'other'
});

// ============================================================================
// 教训优先级枚举 (v1.1.0 新增)
// ============================================================================
const LessonPriority = Object.freeze({
  CRITICAL: 'critical',
  HIGH:     'high',
  MEDIUM:   'medium',
  LOW:      'low'
});

// ============================================================================
// 消息校验结果枚举 (v1.1.0 新增)
// ============================================================================
const ValidationResult = Object.freeze({
  VALID:       'valid',
  EMPTY:       'empty',
  TOO_SHORT:   'too_short',
  TOO_LONG:    'too_long',
  NON_STRING:  'non_string'
});

class TransmissionEngine {
  constructor(rootPath) {
    this.rootPath = rootPath || process.cwd();
    this.dataDir = path.join(this.rootPath, 'data', 'transmission');
    this.logFile = path.join(this.dataDir, 'transmission-log.json');
    this.lessonFile = path.join(this.dataDir, 'distilled-lessons.json');
    this._ensureDataDir();
    this.transmissionLog = this._loadLog();
    this.distilledLessons = this._loadLessons();

    // [v1.1.0] 震荡检测状态
    this._oscillationState = {
      recentPatterns: [],      // 最近检测到的模式 type:timestamp[]
      correctionFrequency: {},  // type → count (滚动窗口 10 条)
      windowSize: 10
    };
  }

  // ==========================================================================
  // 输入验证 (v1.1.0 新增)
  // ==========================================================================

  /**
   * 验证消息是否合法
   * @param {*} msg - 待验证消息
   * @returns {{ result: string, safeContent: string }}
   */
  _validateMessage(msg) {
    if (msg == null) {
      return { result: ValidationResult.EMPTY, safeContent: '' };
    }
    if (typeof msg !== 'string') {
      try {
        const str = String(msg);
        if (!str.trim()) return { result: ValidationResult.EMPTY, safeContent: '' };
        return { result: ValidationResult.VALID, safeContent: str };
      } catch (_) {
        return { result: ValidationResult.NON_STRING, safeContent: '' };
      }
    }
    const trimmed = msg.trim();
    if (!trimmed) {
      return { result: ValidationResult.EMPTY, safeContent: '' };
    }
    // 过短的消息（纯标点、单字符）不足以提炼教训
    if (trimmed.length < 3) {
      return { result: ValidationResult.TOO_SHORT, safeContent: trimmed };
    }
    // 过长的消息截断保护 (100K 字符上限)
    if (trimmed.length > 100000) {
      return { result: ValidationResult.TOO_LONG, safeContent: trimmed.slice(0, 100000) };
    }
    return { result: ValidationResult.VALID, safeContent: trimmed };
  }

  /**
   * 验证消息数组（批量）
   * @param {Array} messages
   * @returns {Array} 过滤后的合法消息
   */
  _validateMessages(messages) {
    if (!Array.isArray(messages)) return [];
    return messages.filter(m => {
      if (!m || typeof m !== 'object') return false;
      const contentResult = this._validateMessage(m.content);
      return contentResult.result === ValidationResult.VALID;
    });
  }

  _ensureDataDir() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
    } catch (e) { /* 已移除 console.warn */ }
  }

  _loadLog() {
    try {
      if (fs.existsSync(this.logFile)) {
        return JSON.parse(fs.readFileSync(this.logFile, 'utf-8'));
      }
    } catch (e) { /* 已移除 console.warn */ }
    return [];
  }

  _loadLessons() {
    try {
      if (fs.existsSync(this.lessonFile)) {
        return JSON.parse(fs.readFileSync(this.lessonFile, 'utf-8'));
      }
    } catch (e) { /* 已移除 console.warn */ }
    return [];
  }

  _saveLog() {
    try {
      fs.writeFileSync(this.logFile, JSON.stringify(this.transmissionLog, null, 2));
    } catch (e) { /* 已移除 console.warn */ }
  }

  _saveLessons() {
    try {
      fs.writeFileSync(this.lessonFile, JSON.stringify(this.distilledLessons, null, 2));
    } catch (e) { /* 已移除 console.warn */ }
  }

  // ==========================================================================
  // 去重检测 (v1.1.0 新增)
  // ==========================================================================

  /**
   * Jaccard 相似度 — 基于词集合的交并比
   * @param {string} a
   * @param {string} b
   * @returns {number} 0-1 相似度
   */
  _jaccardSimilarity(a, b) {
    const tokenize = (s) => {
      const raw = s.toLowerCase();
      // 分词: 空格/标点分割 + 中文连续字符按 bigram 拆分
      const parts = raw.split(/[\s，。、！？；：""''（）\n\r,.!?;:'"()]+/).filter(t => t.length > 0);
      const tokens = new Set();
      for (const part of parts) {
        if (/[\u4e00-\u9fa5]/.test(part) && part.length <= 2) {
          // 短中文词直接保留
          tokens.add(part);
        } else if (/[\u4e00-\u9fa5]/.test(part)) {
          // 长中文文本按 bigram 拆分
          for (let i = 0; i < part.length - 1; i++) {
            tokens.add(part.slice(i, i + 2));
          }
        } else {
          // 英文词按空格分割后的结果
          tokens.add(part);
        }
      }
      return tokens;
    };
    const setA = tokenize(a);
    const setB = tokenize(b);
    if (setA.size === 0 && setB.size === 0) return 1;
    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    return intersection.size / union.size;
  }

  /**
   * 检测与已有教训的重复度
   * @param {string} lesson - 新教训文本
   * @param {number} [threshold=0.7] - 重复判定阈值
   * @returns {{ isDuplicate: boolean, similarTo: object|null, similarity: number }}
   */
  _detectDuplicate(lesson, threshold = 0.5) {
    if (!lesson || this.distilledLessons.length === 0) {
      return { isDuplicate: false, similarTo: null, similarity: 0 };
    }
    let maxSim = 0;
    let mostSimilar = null;
    for (const existing of this.distilledLessons) {
      const sim = this._jaccardSimilarity(
        (existing.lesson || '') + ' ' + (existing.principle || ''),
        lesson
      );
      if (sim > maxSim) {
        maxSim = sim;
        mostSimilar = existing;
      }
    }
    return {
      isDuplicate: maxSim >= threshold,
      similarTo: mostSimilar,
      similarity: maxSim
    };
  }

  // ==========================================================================
  // 震荡检测 (v1.1.0 新增)
  // ==========================================================================

  /**
   * 检测是否出现重复纠正模式（震荡）
   * 当同类型纠正频繁出现时，自动升级优先级
   * @param {string} type - 教训类型
   * @returns {{ isOscillating: boolean, frequency: number, escalated: boolean }}
   */
  _detectOscillation(type) {
    const now = Date.now();
    const state = this._oscillationState;

    // 记录本次出现
    state.recentPatterns.push({ type, timestamp: now });
    state.correctionFrequency[type] = (state.correctionFrequency[type] || 0) + 1;

    // 裁剪窗口: 只保留最近的 windowSize 条
    while (state.recentPatterns.length > state.windowSize) {
      const removed = state.recentPatterns.shift();
      if (removed) {
        state.correctionFrequency[removed.type] = Math.max(
          0, (state.correctionFrequency[removed.type] || 1) - 1
        );
      }
    }

    const freq = state.correctionFrequency[type] || 0;
    // 同类型在窗口内出现 >= 3 次视为震荡
    const isOscillating = freq >= 3;
    // 震荡时自动升级优先级
    const escalated = isOscillating;

    return { isOscillating, frequency: freq, escalated };
  }

  // ==========================================================================
  // 优先级自升级 (v1.1.0 新增)
  // ==========================================================================

  /**
   * 根据震荡检测和教训特征计算最终优先级
   * @param {string} type - 教训类型
   * @param {string} basePriority - 基础优先级
   * @returns {string} 调整后的优先级
   */
  _resolvePriority(type, basePriority) {
    const osc = this._detectOscillation(type);
    if (osc.escalated) {
      // 震荡模式下至少升级到 high
      const priorityRank = { low: 0, medium: 1, high: 2, critical: 3 };
      const currentRank = priorityRank[basePriority] ?? 1;
      const escalatedRank = Math.max(currentRank, priorityRank.high);
      const reverseMap = ['low', 'medium', 'high', 'critical'];
      return reverseMap[escalatedRank] || 'high';
    }
    return basePriority;
  }

  // ==========================================================================
  // 核心提炼逻辑
  // ==========================================================================

  /**
   * 从会话历史中提炼教训
   * @param {Array} messages - 对话历史消息
   * @returns {Array} 提炼出的教训
   */
  distill(messages) {
    const validMessages = this._validateMessages(messages);
    if (validMessages.length === 0) return [];

    const lessons = [];
    const seen = new Set();

    // 从错误/纠正中提炼教训
    for (let i = 1; i < validMessages.length; i++) {
      const prev = validMessages[i - 1];
      const curr = validMessages[i];

      const prevContent = this._validateMessage(prev.content);
      const currContent = this._validateMessage(curr.content);
      if (prevContent.result !== ValidationResult.VALID ||
          currContent.result !== ValidationResult.VALID) continue;

      // 用户纠正 → AI犯的错误
      if (prev.role === 'user' && curr.role === 'assistant') {
        const correction = this._detectCorrection(prevContent.safeContent, currContent.safeContent);
        if (correction) {
          // 去重检测
          const dedup = this._detectDuplicate(correction.lesson);
          const dedupKey = dedup.isDuplicate ? 'dup:' + correction.type : correction.type + ':' + correction.lesson.slice(0, 30);

          if (!dedup.isDuplicate && !seen.has(correction.type + ':' + correction.lesson.slice(0, 50))) {
            // 优先级自升级
            const resolvedPriority = this._resolvePriority(correction.type, correction.priority);

            seen.add(correction.type + ':' + correction.lesson.slice(0, 50));
            lessons.push({
              type: correction.type,
              category: correction.category || ErrorCategory.OTHER,
              lesson: correction.lesson,
              evidence: correction.evidence,
              fromMessage: prevContent.safeContent.slice(0, 100) || '',
              distilledAt: Date.now(),
              priority: resolvedPriority,
              similarity: dedup.similarity > 0 ? dedup.similarity : undefined
            });
          }
        }
      }

      // 用户提供了新知识/洞察
      if (prev.role === 'assistant' && curr.role === 'user') {
        const insight = this._detectInsight(currContent.safeContent);
        if (insight) {
          const dedup = this._detectDuplicate(insight);
          if (!dedup.isDuplicate) {
            const key = 'insight:' + insight.slice(0, 50);
            if (!seen.has(key)) {
              seen.add(key);
              lessons.push({
                type: 'insight',
                category: ErrorCategory.INSIGHT,
                lesson: insight,
                evidence: '',
                fromMessage: prevContent.safeContent.slice(0, 100) || '',
                distilledAt: Date.now(),
                priority: LessonPriority.MEDIUM
              });
            }
          }
        }
      }
    }

    // 返回所有提炼的教训（不再只过滤高优先级）
    return lessons;
  }

  /**
   * 检测纠正模式 — v1.1.0 扩展为 5 类模式 + 自动分类
   */
  _detectCorrection(userMsg, assistantMsg) {
    const correctionPatterns = [
      // 重复模式 (高频优先检查)
      { pattern: /你一直|每次都|总是|repeatedly|always|again|又一次|又错了|又犯/i,
        type: 'pattern', priority: LessonPriority.HIGH, category: ErrorCategory.PATTERN },
      // 上下文理解偏差 (优先于部分事实错误模式)
      { pattern: /理解错了|没明白|我不是这个意思|misunderstood|not what i meant|曲解了|误解了/i,
        type: 'context', priority: LessonPriority.MEDIUM, category: ErrorCategory.CONTEXT },
      // 事实/逻辑错误
      { pattern: /不对|不是这样|搞错了|wrong|incorrect|mistake|这是错误的/i,
        type: 'error', priority: LessonPriority.HIGH, category: ErrorCategory.FACTUAL },
      // 明确指令
      { pattern: /记住|以后要|never forget|注意|以后不要|下次要|必须|一定要/i,
        type: 'instruction', priority: LessonPriority.MEDIUM, category: ErrorCategory.INSTRUCTION },
      // 安全/伦理边界 (高优先级)
      { pattern: /不合适|过分了|不能这样|伦理|safety|harmful|dangerous|不安全|有风险|危险/i,
        type: 'safety', priority: LessonPriority.CRITICAL, category: ErrorCategory.SAFETY },
      // 风格/表达问题 (最低优先级)
      { pattern: /太啰嗦|太简洁|太正式|太随意|太复杂|风格不对|语气不对/i,
        type: 'style', priority: LessonPriority.LOW, category: ErrorCategory.STYLE },
    ];

    for (const cp of correctionPatterns) {
      if (cp.pattern.test(userMsg)) {
        return {
          type: cp.type,
          priority: cp.priority,
          category: cp.category,
          lesson: this._extractLesson(userMsg),
          evidence: 'user correction pattern: ' + userMsg.slice(0, 80)
        };
      }
    }
    return null;
  }

  /**
   * 检测洞察 — v1.1.0 增加更多中文/英文模式
   */
  _detectInsight(msg) {
    const insightPatterns = [
      /关键在于|核心是|本质上|说到底是|根本原因|fundamentally|the key is/,
      /这就是|这就是为什么|原因在于|所以|because|the reason is|therefore/,
      /我的理解是|我觉得|我的观点是|我认为|i think|in my opinion|from my perspective/,
      /一个重要|一个关键|一个核心|值得注意的是|importantly|notably|crucially/,
      /我发现|我注意到|i noticed|i realized|it turns out/,
      /最好|建议|推荐|recommend|suggest|best practice/
    ];
    for (const p of insightPatterns) {
      if (p.test(msg)) return msg.slice(0, 200);
    }
    return null;
  }

  /**
   * 提取核心教训 — v1.1.0 增加标点安全过滤
   */
  _extractLesson(msg) {
    if (!msg) return '';
    const trimmed = msg.trim();
    if (!trimmed) return '';
    // 安全分割：过滤纯标点的空行
    const lines = trimmed.split(/[。！？\n]/)
      .map(l => l.trim())
      .filter(l => l.length > 5 && /[\u4e00-\u9fa5a-zA-Z]/.test(l));
    return lines[0]?.trim().slice(0, 200) || trimmed.slice(0, 200);
  }

  // ==========================================================================
  // Pattern Card 生成
  // ==========================================================================

  /**
   * 将教训转化为可传递的格式（Pattern Card）
   * @param {object} lesson - 教训对象
   * @returns {object} Pattern Card
   */
  toPatternCard(lesson) {
    const card = {
      id: this._genId(),
      trigger: lesson.type === 'error' ? '[error correction]' :
               lesson.type === 'pattern' ? '[repeated pattern]' :
               lesson.type === 'safety' ? '[safety boundary]' :
               lesson.type === 'context' ? '[context misunderstanding]' :
               lesson.type === 'style' ? '[style adjustment]' :
               lesson.type === 'instruction' ? '[instruction]' :
               '[insight]',
      situation: lesson.evidence?.slice(0, 100) || '',
      lesson: lesson.lesson,
      principle: this._extractPrinciple(lesson.lesson),
      priority: lesson.priority,
      category: lesson.category || ErrorCategory.OTHER,
      createdAt: Date.now(),
      source: 'transmission-engine'
    };
    return card;
  }

  _extractPrinciple(lesson) {
    // 从教训中提取最核心的原则
    const words = lesson.split(/[，、。]/);
    return words.find(w => w.length >= 4 && w.length <= 30) || lesson.slice(0, 50);
  }

  _genId() {
    return 'pc_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  // ==========================================================================
  // 传递接口
  // ==========================================================================

  /**
   * 传递教训到 lesson bank（含去重保护）
   * @param {object} lesson - 教训对象
   * @returns {object|null} 生成的 Pattern Card，重复时返回 null
   */
  transfer(lesson) {
    if (!lesson || !lesson.lesson) return null;

    // 去重检测
    const dedup = this._detectDuplicate(lesson.lesson);
    if (dedup.isDuplicate) {
      // 已禁用 console.console.error(`[TransmissionEngine] Skipping duplicate lesson (sim=${dedup.similarity.toFixed(2)})`);
      return null;
    }

    const card = this.toPatternCard(lesson);
    this.distilledLessons.push(card);
    this._saveLessons();
    this._logTransmission('transfer', card);
    return card;
  }

  /**
   * 批量传递（含去重）
   * @param {Array} lessons - 教训数组
   * @returns {Array} 成功传递的 Pattern Cards
   */
  transferBatch(lessons) {
    if (!Array.isArray(lessons)) return [];
    const transferred = [];
    for (const lesson of lessons) {
      const card = this.transfer(lesson);
      if (card) transferred.push(card);
    }
    return transferred;
  }

  _logTransmission(action, data) {
    this.transmissionLog.push({
      action,
      data: {
        id: data.id,
        type: data.type,
        category: data.category,
        priority: data.priority,
        lesson: data.lesson?.slice(0, 50)
      },
      timestamp: Date.now()
    });
    if (this.transmissionLog.length > 500) {
      this.transmissionLog = this.transmissionLog.slice(-500);
    }
    this._saveLog();
  }

  // ==========================================================================
  // 查询接口
  // ==========================================================================

  /** 获取传承日志 */
  getTransmissionLog(limit = 20) {
    return this.transmissionLog.slice(-limit).reverse();
  }

  /** 获取所有提炼的教训 */
  getDistilledLessons(limit = 50) {
    return this.distilledLessons.slice(-limit).reverse();
  }

  /** 获取传递统计 */
  getStats() {
    return {
      totalLessons: this.distilledLessons.length,
      totalTransmissions: this.transmissionLog.length,
      byType: this.distilledLessons.reduce((acc, l) => {
        acc[l.type] = (acc[l.type] || 0) + 1;
        return acc;
      }, {}),
      byPriority: this.distilledLessons.reduce((acc, l) => {
        acc[l.priority] = (acc[l.priority] || 0) + 1;
        return acc;
      }, {}),
      byCategory: this.distilledLessons.reduce((acc, l) => {
        acc[l.category] = (acc[l.category] || 0) + 1;
        return acc;
      }, {}),
      // [v1.1.0] 震荡检测统计
      oscillationState: {
        recentPatternCount: this._oscillationState.recentPatterns.length,
        correctionFrequency: { ...this._oscillationState.correctionFrequency }
      }
    };
  }

  /**
   * [v1.1.0] 按类别筛选教训
   * @param {string} category - ErrorCategory 枚举值
   * @returns {Array}
   */
  getLessonsByCategory(category) {
    if (!category) return [];
    return this.distilledLessons.filter(l => l.category === category);
  }

  /**
   * [v1.1.0] 按优先级筛选教训
   * @param {string} priority - LessonPriority 枚举值
   * @returns {Array}
   */
  getLessonsByPriority(priority) {
    if (!priority) return [];
    return this.distilledLessons.filter(l => l.priority === priority);
  }

  /**
   * [v1.1.0] 获取震荡检测状态
   * @returns {object}
   */
  getOscillationState() {
    return {
      recentPatterns: this._oscillationState.recentPatterns,
      correctionFrequency: { ...this._oscillationState.correctionFrequency },
      windowSize: this._oscillationState.windowSize
    };
  }

  /** 清除旧记录 */
  prune(maxAge = 30 * 24 * 60 * 60 * 1000) {
    const cutoff = Date.now() - maxAge;
    this.distilledLessons = this.distilledLessons.filter(l => l.createdAt > cutoff);
    this._saveLessons();
  }

  destroy() {
    this.transmissionLog = [];
    this.distilledLessons = [];
    this._oscillationState.recentPatterns = [];
    this._oscillationState.correctionFrequency = {};
  }
}

module.exports = {
  TransmissionEngine,
  ErrorCategory,
  LessonPriority,
  ValidationResult
};
