/**
 * HeartFlow Recall Trigger v11.27.0
 * 
 * 功能: 何时从 permanent memory 召回？
 * 
 * 触发场景:
 * 1. 用户问及相关话题 → 自动搜索归档记忆
 * 2. 上下文接近满 → 主动注入相关记忆
 * 3. 会话开始 → 加载用户偏好相关记忆
 * 
 * 核心逻辑:
 * - 监控对话，检测可能与归档记忆相关的话题
 * - 搜索 permanent memory，找到相关内容
 * - 返回可注入上下文的记忆片段
 */

const path = require('path');

// ============================================================
// 触发器策略
// ============================================================

/**
 * TopicMatchTrigger - 话题匹配触发
 * 检测用户消息中的关键词，匹配归档记忆
 */
class TopicMatchTrigger {
  constructor(options = {}) {
    this.archiveKeys = options.archiveKeys || [];  // 预登记的话题关键词
    this.threshold = options.threshold || 0.3;      // 匹配阈值
  }

  /**
   * 检测是否触发召回
   * @param {string} userMessage - 用户消息
   * @param {Array} archivedTopics - 归档记忆中的话题关键词
   * @returns {Object} { shouldRecall, matchedTopics, query }
   */
  detect(userMessage, archivedTopics = []) {
    if (!userMessage || typeof userMessage !== 'string') {
      return { shouldRecall: false, matchedTopics: [], query: null };
    }

    const lower = userMessage.toLowerCase();
    
    // 1. 精确关键词匹配
    const matchedTopics = [];
    for (const topic of archivedTopics) {
      const topicLower = topic.toLowerCase();
      if (lower.includes(topicLower)) {
        matchedTopics.push(topic);
      }
    }

    // 2. 提取问题类型（如何、怎么、为什么、是什么）
    const questionPatterns = [
      { pattern: /如何|[怎怎么]个|how\s/i, type: 'how' },
      { pattern: /为什么|why|原因/i, type: 'why' },
      { pattern: /是什么|what|什么是/i, type: 'what' },
      { pattern: /是不是|是否|is\s|are\s/i, type: 'yesno' },
      { pattern: /修复|解决|fix|修复方法/i, type: 'fix' },
    ];

    const detectedTypes = [];
    for (const qp of questionPatterns) {
      if (qp.pattern.test(lower)) {
        detectedTypes.push(qp.type);
      }
    }

    // 3. 构建召回 query
    let query = null;
    if (matchedTopics.length > 0) {
      query = matchedTopics[0];
    } else if (detectedTypes.length > 0) {
      // 从消息中提取核心名词作为 query
      const coreNoun = this._extractCoreNoun(userMessage);
      if (coreNoun) query = coreNoun;
    }

    const shouldRecall = matchedTopics.length > 0 || (detectedTypes.length > 0 && query);

    return {
      shouldRecall,
      matchedTopics,
      questionTypes: detectedTypes,
      query,
      confidence: matchedTopics.length > 0 ? 1.0 : (detectedTypes.length > 0 ? 0.5 : 0),
    };
  }

  _extractCoreNoun(message) {
    // 简单提取：去掉问句结构，保留核心名词
    let text = message
      .replace(/^[请问教问]|有没有|是不是|如何|怎么|为什么|是什么/g, '')
      .replace(/[?？.!！。，,]/g, '')
      .trim();
    
    // 取前 10 个字符
    return text.substring(0, 10) || null;
  }
}

/**
 * ContextPressureTrigger - 上下文压力触发
 * 当上下文接近满时，主动注入相关记忆
 */
class ContextPressureTrigger {
  constructor(options = {}) {
    this.warningThreshold = options.warningThreshold || 0.80;  // 80% 开始预警
    this.injectionThreshold = options.injectionThreshold || 0.90; // 90% 开始注入
  }

  /**
   * 检测上下文压力
   * @param {number} currentTokens - 当前 token 数
   * @param {number} maxTokens - 最大 token 数
   * @returns {Object} { pressure, shouldInject, level }
   */
  detect(currentTokens, maxTokens) {
    if (maxTokens <= 0) return { pressure: 0, shouldInject: false, level: 'ok' };

    const ratio = currentTokens / maxTokens;
    
    let level = 'ok';
    if (ratio >= this.injectionThreshold) level = 'critical';
    else if (ratio >= this.warningThreshold) level = 'warning';

    const shouldInject = ratio >= this.injectionThreshold;

    return {
      pressure: Math.round(ratio * 100),
      shouldInject,
      level,
      currentTokens,
      maxTokens,
      suggestion: level === 'critical' 
        ? '立即注入相关记忆，减少上下文' 
        : level === 'warning' 
          ? '准备注入相关记忆' 
          : '上下文状态良好',
    };
  }
}

// ============================================================
// 召回触发器主类
// ============================================================

class RecallTrigger {
  constructor(options = {}) {
    this.topicTrigger = new TopicMatchTrigger(options.topicTrigger);
    this.pressureTrigger = new ContextPressureTrigger(options.pressureTrigger);
    
    // 召回的记忆缓存（避免重复召回）
    this._recentRecalls = new Map();  // key → { recallTime, result }
    this._recallCooldown = options.recallCooldown || 60000;  // 1 分钟内不重复召回同一 key

    // 统计
    this.stats = {
      topicTriggers: 0,
      pressureTriggers: 0,
      totalRecalls: 0,
      cacheHits: 0,
    };
  }

  /**
   * 获取 PermanentMemoryArchiver（延迟加载）
   */
  _getArchiver() {
    if (!this._archiver) {
      try {
        const { PermanentMemoryArchiver } = require('./permanent-memory-archiver.js');
        this._archiver = new PermanentMemoryArchiver();
      } catch (e) {
        return null;
      }
    }
    return this._archiver;
  }

  // ============================================================
  // 主检测方法
  // ============================================================

  /**
   * 检测是否应该触发召回
   * @param {Object} context - { userMessage, currentTokens, maxTokens, archivedTopics }
   * @returns {Object} 检测结果
   */
  check(context = {}) {
    const { userMessage, currentTokens, maxTokens, archivedTopics = [] } = context;

    const results = {
      timestamp: Date.now(),
      triggers: [],
      shouldRecall: false,
      recallQuery: null,
      pressure: null,
      injectionNeeded: false,
    };

    // 1. 话题匹配触发
    if (userMessage) {
      const topicResult = this.topicTrigger.detect(userMessage, archivedTopics);
      if (topicResult.shouldRecall) {
        results.triggers.push({ type: 'topic', ...topicResult });
        results.shouldRecall = true;
        results.recallQuery = topicResult.query;
        this.stats.topicTriggers++;
      }
    }

    // 2. 上下文压力触发
    if (typeof currentTokens === 'number' && typeof maxTokens === 'number') {
      const pressureResult = this.pressureTrigger.detect(currentTokens, maxTokens);
      results.pressure = pressureResult;
      if (pressureResult.shouldInject) {
        results.triggers.push({ type: 'pressure', ...pressureResult });
        results.shouldRecall = true;
        results.injectionNeeded = true;
        this.stats.pressureTriggers++;
      }
    }

    return results;
  }

  /**
   * 执行召回
   * @param {Object} context - { query, topK, pressureQuery }
   * @returns {Object} 召回结果
   */
  executeRecall(context = {}) {
    const { query, topK = 5, pressureQuery = null } = context;
    const archiver = this._getArchiver();
    
    if (!archiver) {
      return { success: false, error: 'Archiver not available', memories: [] };
    }

    const results = {
      success: true,
      timestamp: Date.now(),
      queries: [],
      memories: [],
      totalFound: 0,
    };

    // 1. 话题召回
    if (query) {
      // 检查缓存
      if (this._isCacheHit(query)) {
        results.memories = this._getFromCache(query);
        results.fromCache = true;
        this.stats.cacheHits++;
      } else {
        const searchResults = archiver.search(query, topK);
        results.queries.push(query);
        results.memories.push(...searchResults);
        this._addToCache(query, searchResults);
      }
    }

    // 2. 压力感知的泛召回（当上下文压力大时）
    if (pressureQuery && context.pressureLevel === 'critical') {
      const broadResults = archiver.search(pressureQuery, Math.min(topK, 3));
      results.memories.push(...broadResults.filter(r => 
        !results.memories.some(existing => existing.key === r.key)
      ));
      results.broadRecall = true;
    }

    // 去重
    const seen = new Set();
    results.memories = results.memories.filter(m => {
      const key = m.key || m.id || String(m);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    results.totalFound = results.memories.length;
    this.stats.totalRecalls++;

    return results;
  }

  /**
   * 格式化召回结果为可注入的上下文
   * @param {Object} recallResult - executeRecall 的结果
   * @returns {string} 可注入的上下文字符串
   */
  formatForInjection(recallResult) {
    if (!recallResult.success || recallResult.memories.length === 0) {
      return '';
    }

    const parts = ['\n\n【相关记忆召回】'];
    
    recallResult.memories.forEach((mem, i) => {
      // 兼容不同格式的记忆对象
      let content;
      if (typeof mem.content === 'string') {
        content = mem.content;
      } else if (typeof mem.value === 'string') {
        content = mem.value;
      } else if (typeof mem.content === 'object' && mem.content !== null) {
        // content 是对象（可能是 _archivedMeta），取其 summary
        content = mem.content.summary || JSON.stringify(mem.content).substring(0, 100);
      } else {
        content = String(mem);
      }
      const source = mem.source || mem.layer || 'archived';
      const similarity = mem.similarity || mem.score || 0;
      
      parts.push(`${i + 1}. [${source}] ${content.substring(0, 150)}`);
      if (content.length > 150) parts.push('   _(truncated)_');
    });

    parts.push('\n注: 以上为压缩前的相关记忆，仅供参考。');
    return parts.join('\n');
  }

  // ============================================================
  // 缓存管理
  // ============================================================

  _isCacheHit(query) {
    const cached = this._recentRecalls.get(query);
    if (!cached) return false;
    return (Date.now() - cached.recallTime) < this._recallCooldown;
  }

  _getFromCache(query) {
    const cached = this._recentRecalls.get(query);
    return cached ? cached.results : [];
  }

  _addToCache(query, results) {
    this._recentRecalls.set(query, {
      recallTime: Date.now(),
      results,
    });
    // 清理过期缓存
    if (this._recentRecalls.size > 100) {
      const oldest = [...this._recentRecalls.entries()]
        .sort((a, b) => a[1].recallTime - b[1].recallTime)[0];
      if (oldest) this._recentRecalls.delete(oldest[0]);
    }
  }

  // ============================================================
  // 统计
  // ============================================================

  getStats() {
    return { ...this.stats };
  }

  resetStats() {
    this.stats = {
      topicTriggers: 0,
      pressureTriggers: 0,
      totalRecalls: 0,
      cacheHits: 0,
    };
  }
}

// ============================================================
// 导出
// ============================================================

module.exports = {
  RecallTrigger,
  TopicMatchTrigger,
  ContextPressureTrigger,
};
