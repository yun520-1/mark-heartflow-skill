/**
 * HeartFlow Observe & Consolidate Module
 * 
 * 观察和记忆固化模块
 * 
 * 功能：
 * 1. observe(hookEvent) - 捕获钩子事件（工具调用/错误/对话）
 * 2. consolidate() - 将观察转化为叙事记忆
 * 3. deduplicate() - Jaccard去重（相似度 > 0.7）
 * 
 * 集成 MeaningfulMemory 的 CORE/LEARNED/EPHEMERAL 架构
 */

const crypto = require('crypto');

// ============================================================
// Jaccard 相似度计算
// ============================================================

/**
 * 计算两个字符串的 Jaccard 相似度
 * Jaccard = |A ∩ B| / |A ∪ B|
 * @param {string} text1 
 * @param {string} text2 
 * @returns {number} 相似度 0~1
 */
function jaccardSimilarity(text1, text2) {
  if (!text1 || !text2) return 0;
  
  const tokens1 = new Set(text1.toLowerCase().split(/\s+/).filter(t => t.length > 2));
  const tokens2 = new Set(text2.toLowerCase().split(/\s+/).filter(t => t.length > 2));
  
  if (tokens1.size === 0 && tokens2.size === 0) return 1;
  if (tokens1.size === 0 || tokens2.size === 0) return 0;
  
  const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
  const union = new Set([...tokens1, ...tokens2]);
  
  return intersection.size / union.size;
}

/**
 * 从文本生成 n-gram 集合
 * @param {string} text 
 * @param {number} n 
 * @returns {Set<string>}
 */
function getNgrams(text, n = 3) {
  const tokens = text.toLowerCase().split(/\s+/).filter(t => t.length > 0);
  const ngrams = new Set();
  
  for (let i = 0; i <= tokens.length - n; i++) {
    ngrams.add(tokens.slice(i, i + n).join(' '));
  }
  return ngrams;
}

/**
 * 计算 n-gram Jaccard 相似度（更精确）
 * @param {string} text1 
 * @param {string} text2 
 * @param {number} n 
 * @returns {number}
 */
function ngramJaccard(text1, text2, n = 3) {
  if (!text1 || !text2) return 0;
  
  const ngrams1 = getNgrams(text1, n);
  const ngrams2 = getNgrams(text2, n);
  
  if (ngrams1.size === 0 && ngrams2.size === 0) return 1;
  if (ngrams1.size === 0 || ngrams2.size === 0) return 0;
  
  const intersection = new Set([...ngrams1].filter(x => ngrams2.has(x)));
  const union = new Set([...ngrams1, ...ngrams2]);
  
  return intersection.size / union.size;
}

// ============================================================
// 观察事件类型
// ============================================================

const HOOK_TYPES = {
  TOOL_CALL: 'tool_call',
  TOOL_ERROR: 'tool_error',
  CONVERSATION: 'conversation',
  USER_MESSAGE: 'user_message',
  ASSISTANT_MESSAGE: 'assistant_message',
  SYSTEM_EVENT: 'system_event',
  DECISION_POINT: 'decision_point',
  LEARNING_MOMENT: 'learning_moment',
};

const OBSERVE_CONFIG = {
  jaccardThreshold: 0.7,      // 去重阈值
  consolidateInterval: 60000,  // 固化间隔（ms）
  maxObservations: 1000,       // 最大观察数
  narrativeMinLength: 50,     // 叙事最小长度
};

// ============================================================
// Observe 类
// ============================================================

class Observe {
  constructor(options = {}) {
    this.meaningfulMemory = options.meaningfulMemory || null;
    this.jaccardThreshold = options.jaccardThreshold || OBSERVE_CONFIG.jaccardThreshold;
    this.consolidateInterval = options.consolidateInterval || OBSERVE_CONFIG.consolidateInterval;
    
    // 原始观察队列（按时间顺序）
    this.observations = [];
    
    // 按类型索引的观察
    this.observationsByType = {
      [HOOK_TYPES.TOOL_CALL]: [],
      [HOOK_TYPES.TOOL_ERROR]: [],
      [HOOK_TYPES.CONVERSATION]: [],
      [HOOK_TYPES.USER_MESSAGE]: [],
      [HOOK_TYPES.ASSISTANT_MESSAGE]: [],
      [HOOK_TYPES.SYSTEM_EVENT]: [],
      [HOOK_TYPES.DECISION_POINT]: [],
      [HOOK_TYPES.LEARNING_MOMENT]: [],
    };
    
    // 统计
    this._meta = {
      totalObserved: 0,
      consolidated: 0,
      deduplicated: 0,
      lastConsolidate: null,
    };
    
    // 定时固化
    this._consolidateTimer = null;
    if (this.consolidateInterval > 0) {
      this._startConsolidateTimer();
    }
  }

  // ============================================================
  // 观察事件捕获
  // ============================================================

  /**
   * 捕获钩子事件
   * @param {object} hookEvent - 钩子事件
   * @param {string} hookEvent.type - 事件类型
   * @param {string} hookEvent.content - 事件内容
   * @param {object} hookEvent.metadata - 附加元数据
   * @returns {object|null} 观察记录或null（如果去重）
   */
  observe(hookEvent) {
    const {
      type = HOOK_TYPES.SYSTEM_EVENT,
      content = '',
      metadata = {},
    } = hookEvent;

    if (!content || content.trim().length === 0) {
      return null;
    }

    const observation = {
      id: this._generateId(),
      type,
      content: String(content).trim(),
      metadata: { ...metadata },
      timestamp: Date.now(),
      hashed: this._hashContent(content),
    };

    // 去重检查
    if (this._isDuplicate(observation)) {
      this._meta.deduplicated++;
      return null;
    }

    // 存储观察
    this.observations.push(observation);
    this.observationsByType[type]?.push(observation);
    this._meta.totalObserved++;

    // 限制队列大小
    this._trimObservations();

    // 自动判断是否值得记忆
    this._autoRemember(observation);

    return observation;
  }

  /**
   * 快捷方法：捕获工具调用
   */
  observeToolCall(toolName, args, result) {
    return this.observe({
      type: HOOK_TYPES.TOOL_CALL,
      content: `Called tool: ${toolName} with args: ${JSON.stringify(args)} → result: ${JSON.stringify(result)}`.slice(0, 500),
      metadata: { toolName, args, result, success: result !== null },
    });
  }

  /**
   * 快捷方法：捕获工具错误
   */
  observeToolError(toolName, error, context = {}) {
    return this.observe({
      type: HOOK_TYPES.TOOL_ERROR,
      content: `Tool error: ${toolName} - ${error.message || String(error)}`,
      metadata: { toolName, error: error.message || String(error), context },
    });
  }

  /**
   * 快捷方法：捕获对话
   */
  observeConversation(role, message, context = {}) {
    const type = role === 'user' ? HOOK_TYPES.USER_MESSAGE : HOOK_TYPES.ASSISTANT_MESSAGE;
    return this.observe({
      type,
      content: message,
      metadata: { role, context },
    });
  }

  /**
   * 快捷方法：捕获决策点
   */
  observeDecisionPoint(context, options, chosenOption) {
    return this.observe({
      type: HOOK_TYPES.DECISION_POINT,
      content: `Decision: chose "${chosenOption}" from options ${JSON.stringify(options)} in context: ${context}`,
      metadata: { context, options, chosenOption },
    });
  }

  // ============================================================
  // 记忆固化
  // ============================================================

  /**
   * 将观察转化为叙事记忆
   * @param {object} options - 固化选项
   * @returns {Array} 生成的叙事记忆
   */
  consolidate(options = {}) {
    const {
      types = Object.values(HOOK_TYPES),
      minObservations = 3,
      maxAge = 24 * 60 * 60 * 1000, // 24小时
      narrativeStyle = 'detailed',   // 'detailed' | 'summary'
    } = options;

    const now = Date.now();
    const narratives = [];

    // 按类型分组观察
    for (const type of types) {
      const typeObs = this.observationsByType[type] || [];
      
      // 过滤：时间范围内 + 达到最小数量
      const relevant = typeObs.filter(o => 
        (now - o.timestamp) <= maxAge
      );

      if (relevant.length < minObservations) continue;

      // 生成叙事
      const narrative = this._generateNarrative(type, relevant, narrativeStyle);
      if (narrative) {
        narratives.push(narrative);
        
        // 存入记忆
        if (this.meaningfulMemory) {
          this.meaningfulMemory.remember({
            key: narrative.key,
            value: narrative.content,
            type: 'narrative_' + type,
            reason: narrative.reason,
            source: 'observe-consolidate',
            relatedTo: narrative.relatedTo,
          });
        }
        
        this._meta.consolidated++;
      }
    }

    this._meta.lastConsolidate = now;
    
    // 清理已固化的观察
    this._cleanupConsolidated(narratives);

    return narratives;
  }

  /**
   * 生成叙事内容
   */
  _generateNarrative(type, observations, style) {
    if (observations.length === 0) return null;

    const timestamps = observations.map(o => o.timestamp);
    const timeSpan = Math.max(...timestamps) - Math.min(...timestamps);
    const contents = observations.map(o => o.content);

    // 聚合内容
    const aggregatedContent = this._aggregateContents(contents, style);
    
    // 生成唯一键
    const key = `narrative_${type}_${Date.now()}`;
    
    // 生成关联
    const relatedTo = observations
      .filter(o => o.metadata?.relatedKey)
      .map(o => ({ targetKey: o.metadata.relatedKey, type: 'derived_from', strength: 0.8 }));

    return {
      key,
      type,
      content: aggregatedContent,
      observationCount: observations.length,
      timeSpan,
      reason: `从 ${observations.length} 条 ${type} 观察中固化`,
      relatedTo,
      timestamp: Date.now(),
    };
  }

  /**
   * 聚合多个内容为叙事
   */
  _aggregateContents(contents, style) {
    if (contents.length === 0) return '';
    
    if (contents.length === 1) {
      return contents[0];
    }

    if (style === 'summary') {
      // 摘要风格：提取关键信息
      const first = contents[0];
      const last = contents[contents.length - 1];
      return `[叙事摘要] 事件序列：${first} → ... → ${last}（共${contents.length}条观察）`;
    }

    // 详细风格：按时间顺序叙述
    const timeline = contents.map((c, i) => `${i + 1}. ${c}`).join('\n');
    return `[详细叙事]\n${timeline}`;
  }

  // ============================================================
  // 去重
  // ============================================================

  /**
   * 检查是否为重复观察
   * @param {object} observation 
   * @returns {boolean}
   */
  _isDuplicate(observation) {
    const recentWindow = this.observations.filter(
      o => Date.now() - o.timestamp < 5 * 60 * 1000 // 5分钟内
    );

    for (const existing of recentWindow) {
      if (existing.type !== observation.type) continue;
      
      const similarity = ngramJaccard(existing.content, observation.content, 3);
      if (similarity > this.jaccardThreshold) {
        return true;
      }
    }

    return false;
  }

  /**
   * Jaccard 去重（对外接口）
   * @param {Array<string>|Array<object>} items - 要去重的项目
   * @param {Function} extractor - 从对象提取文本的函数
   * @returns {Array} 去重后的项目
   */
  deduplicate(items, extractor = (item) => typeof item === 'string' ? item : JSON.stringify(item)) {
    const result = [];
    const seen = [];

    for (const item of items) {
      const text = extractor(item);
      let isDup = false;

      for (const existing of seen) {
        if (ngramJaccard(text, existing, 3) > this.jaccardThreshold) {
          isDup = true;
          break;
        }
      }

      if (!isDup) {
        result.push(item);
        seen.push(text);
      }
    }

    return result;
  }

  // ============================================================
  // 自动记忆判断
  // ============================================================

  /**
   * 自动判断观察是否值得记忆
   */
  _autoRemember(observation) {
    if (!this.meaningfulMemory) return;

    // 高价值事件直接记忆
    const highValueTypes = [
      HOOK_TYPES.TOOL_ERROR,
      HOOK_TYPES.DECISION_POINT,
      HOOK_TYPES.LEARNING_MOMENT,
    ];

    if (highValueTypes.includes(observation.type)) {
      this.meaningfulMemory.remember({
        key: `observe_${observation.type}_${observation.id}`,
        value: observation.content,
        type: 'observation_' + observation.type,
        reason: `观察事件：${observation.type}`,
        source: 'auto-observe',
      });
    }
  }

  // ============================================================
  // 工具方法
  // ============================================================

  _generateId() {
    return `obs_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }

  _hashContent(content) {
    return crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);
  }

  _trimObservations() {
    if (this.observations.length > OBSERVE_CONFIG.maxObservations) {
      // 删除最旧的观察
      const toRemove = this.observations.slice(0, this.observations.length - OBSERVE_CONFIG.maxObservations);
      for (const obs of toRemove) {
        const typeList = this.observationsByType[obs.type];
        if (typeList) {
          const idx = typeList.findIndex(o => o.id === obs.id);
          if (idx !== -1) typeList.splice(idx, 1);
        }
      }
      this.observations = this.observations.slice(-OBSERVE_CONFIG.maxObservations);
    }
  }

  _cleanupConsolidated(narratives) {
    const narrativeKeys = new Set(narratives.map(n => n.key));
    // 保留与当前叙事无关的观察
  }

  _startConsolidateTimer() {
    if (this._consolidateTimer) {
      clearInterval(this._consolidateTimer);
    }
    this._consolidateTimer = setInterval(() => {
      this.consolidate();
    }, this.consolidateInterval);
  }

  // ============================================================
  // 查询接口
  // ============================================================

  /**
   * 获取指定类型的观察
   */
  getObservations(type, options = {}) {
    const { limit = 100, since = 0 } = options;
    const obs = this.observationsByType[type] || [];
    return obs.filter(o => o.timestamp >= since).slice(-limit);
  }

  /**
   * 获取最近的观察
   */
  getRecentObservations(limit = 50) {
    return this.observations.slice(-limit);
  }

  /**
   * 搜索观察内容
   */
  searchObservations(query, options = {}) {
    const { types = Object.values(HOOK_TYPES), limit = 50 } = options;
    const queryLower = query.toLowerCase();
    
    return this.observations
      .filter(o => types.includes(o.type) && o.content.toLowerCase().includes(queryLower))
      .slice(-limit);
  }

  /**
   * 统计信息
   */
  stats() {
    return {
      ...this._meta,
      totalInQueue: this.observations.length,
      byType: Object.fromEntries(
        Object.entries(this.observationsByType).map(([k, v]) => [k, v.length])
      ),
    };
  }

  /**
   * 清空所有观察
   */
  clear() {
    this.observations = [];
    for (const key of Object.keys(this.observationsByType)) {
      this.observationsByType[key] = [];
    }
  }

  /**
   * 停止定时固化
   */
  stop() {
    if (this._consolidateTimer) {
      clearInterval(this._consolidateTimer);
      this._consolidateTimer = null;
    }
  }
}

// ============================================================
// 工厂函数
// ============================================================

/**
 * 创建 Observe 实例并绑定到 MeaningfulMemory
 */
function createObserve(meaningfulMemory, options = {}) {
  return new Observe({
    ...options,
    meaningfulMemory,
  });
}

// ============================================================
// 导出
// ============================================================

module.exports = {
  Observe,
  createObserve,
  jaccardSimilarity,
  ngramJaccard,
  HOOK_TYPES,
  OBSERVE_CONFIG,
};
