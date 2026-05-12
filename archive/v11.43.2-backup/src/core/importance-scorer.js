/**
 * HeartFlow ImportanceScorer v11.26.0
 * 
 * 功能: 给每条记忆打分，用于压缩决策
 * 
 * 评分维度:
 * 1. sourceWeight — 来源权重 (user_correction=100, decision_verified=85...)
 * 2. recencyBonus — 新鲜度加分
 * 3. accessBonus — 访问频率加分
 * 4. verificationBonus — 验证分数加分
 * 5. userTagBonus — 用户标记权重
 */

const fs = require('fs');
const path = require('path');

// ============================================================
// 评分权重配置
// ============================================================

const SOURCE_WEIGHTS = {
  // 最高优先级: 用户明确纠正/偏好
  user_correction: 100,
  // 高优先级: 验证通过的决策
  decision_verified: 85,
  // 中高: 错误模式（踩过的坑）
  error_pattern: 80,
  // 中高: 系统级认知
  system: 70,
  // 中: 用户原始消息
  user: 60,
  // 中低: AI 响应
  assistant: 50,
  // 低: 一般消息
  default: 30,
  // 元类型: 压缩摘要
  compaction_summary: 20,
};

const RECENCY_BONUS = {
  // 1 小时内: +30
  hour: 30,
  // 6 小时内: +20
  sixHours: 20,
  // 24 小时内: +10
  day: 10,
  // 7 天内: +5
  week: 5,
  // 30 天内: +2
  month: 2,
};

// ============================================================
// 重要性评分器
// ============================================================

class ImportanceScorer {
  constructor(options = {}) {
    this.memoryDir = options.memoryDir || this._getDefaultMemoryDir();
    this.corePath = options.corePath || path.join(this.memoryDir, 'meaningful-core.json');
    this.learnedPath = options.learnedPath || path.join(this.memoryDir, 'meaningful-learned.json');
    
    // 评分配置
    this.config = {
      sourceWeights: { ...SOURCE_WEIGHTS, ...options.sourceWeights },
      recencyBonus: { ...RECENCY_BONUS, ...options.recencyBonus },
      // 访问频率权重: 每次 × this值
      accessWeight: options.accessWeight || 5,
      // 验证分数权重: selfVerifyScore × this值
      verificationWeight: options.verificationWeight || 20,
      // 是否启用新鲜度加成
      enableRecency: options.enableRecency !== false,
      // 是否启用访问频率加成
      enableAccess: options.enableAccess !== false,
      // 是否启用验证分数加成
      enableVerification: options.enableVerification !== false,
      // 最低分数阈值 (低于此分数压缩)
      minScoreThreshold: options.minScoreThreshold || 20,
      ...options,
    };

    // 内存缓存: key → { accessCount, lastAccess, importance, source, ... }
    this._memoryCache = null;
    this._cacheTime = 0;
    this._cacheTTL = options.cacheTTL || 60000; // 1 分钟缓存
  }

  _getDefaultMemoryDir() {
    // 尝试从当前位置推断 memory 目录
    const currentDir = __dirname;
    const heartflowDir = path.dirname(path.dirname(currentDir)); // src/core → src → heartflow
    return path.join(heartflowDir, 'memory');
  }

  // ============================================================
  // 核心评分方法
  // ============================================================

  /**
   * 计算单条记忆的重要性分数
   * @param {Object} memory - 记忆对象 { key, value, type, source, timestamp, accessCount, importance, selfVerifyScore, ... }
   * @returns {number} 重要性分数 (0-200)
   */
  score(memory) {
    if (!memory) return 0;

    let total = 0;

    // 1. 来源权重 (基础分)
    total += this._getSourceWeight(memory);

    // 2. 新鲜度加成
    if (this.config.enableRecency && memory.timestamp) {
      total += this._getRecencyBonus(memory.timestamp);
    }

    // 3. 访问频率加成
    if (this.config.enableAccess && memory.accessCount > 0) {
      total += memory.accessCount * this.config.accessWeight;
    }

    // 4. 验证分数加成
    if (this.config.enableVerification && memory.selfVerifyScore) {
      total += memory.selfVerifyScore * this.config.verificationWeight;
    }

    // 5. 用户标记的重要性 (直接覆盖)
    if (typeof memory.importance === 'number' && memory.importance > 0) {
      // 用户标记的权重更高: 覆盖自动计算的值
      // 如果用户标记了 importance，采用用户值（但不完全覆盖，保留加成）
      // 策略: 取 max(自动计算, 用户标记 * 0.7)
      const userAdjusted = memory.importance * 0.7;
      if (userAdjusted > total) {
        total = userAdjusted + this._getSourceWeight(memory) * 0.3;
      }
    }

    // 6. 类型特殊加成
    total += this._getTypeBonus(memory);

    // 7. 来源特殊加成
    total += this._getSourceBonus(memory);

    return Math.round(Math.min(total, 200)); // 上限 200
  }

  /**
   * 获取来源权重
   */
  _getSourceWeight(memory) {
    const source = memory.source || memory.level || 'default';
    return this.config.sourceWeights[source] ?? this.config.sourceWeights.default;
  }

  /**
   * 获取新鲜度加成
   */
  _getRecencyBonus(timestamp) {
    if (!timestamp) return 0;
    const age = Date.now() - timestamp;
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    const week = 7 * day;
    const month = 30 * day;

    if (age < hour) return this.config.recencyBonus.hour;
    if (age < 6 * hour) return this.config.recencyBonus.sixHours;
    if (age < day) return this.config.recencyBonus.day;
    if (age < week) return this.config.recencyBonus.week;
    if (age < month) return this.config.recencyBonus.month;
    return 0;
  }

  /**
   * 获取类型特殊加成
   */
  _getTypeBonus(memory) {
    const type = memory.type || '';
    const bonuses = {
      user_correction: 10,  // 用户纠正额外 +10
      decision_verified: 5, // 验证决策额外 +5
      error_pattern: 8,     // 错误模式额外 +8 (踩过的坑)
      compaction_summary: -10, // 压缩摘要额外 -10 (价值较低)
    };
    return bonuses[type] || 0;
  }

  /**
   * 获取来源特殊加成
   */
  _getSourceBonus(memory) {
    // 用户直接给出的偏好，给予额外加权
    if (memory.reason && memory.reason.includes('用户')) {
      return 5;
    }
    // 系统自动学习的，降低一点权重
    if (memory.source === 'system' && !memory.reason) {
      return -5;
    }
    return 0;
  }

  // ============================================================
  // 批量评分
  // ============================================================

  /**
   * 对一组记忆批量评分
   * @param {Array} memories - 记忆对象数组
   * @returns {Array} 带分数的记忆对象 [{ memory, score }, ...]
   */
  scoreBatch(memories) {
    if (!Array.isArray(memories)) return [];
    
    return memories
      .map(memory => ({
        memory,
        score: this.score(memory),
      }))
      .sort((a, b) => b.score - a.score); // 降序排列
  }

  /**
   * 获取需要保留的高分记忆
   * @param {Array} memories - 记忆对象数组
   * @param {number} keepCount - 保留数量
   * @returns {Array} 需要保留的记忆
   */
  getTopMemories(memories, keepCount) {
    const scored = this.scoreBatch(memories);
    return scored.slice(0, keepCount).map(item => item.memory);
  }

  /**
   * 获取需要压缩的低分记忆
   * @param {Array} memories - 记忆对象数组
   * @param {number} keepCount - 保留数量
   * @returns {Array} 需要压缩的记忆
   */
  getLowScoreMemories(memories, keepCount) {
    const scored = this.scoreBatch(memories);
    return scored.slice(keepCount).map(item => item.memory);
  }

  // ============================================================
  // 评分报告
  // ============================================================

  /**
   * 生成记忆评分报告
   * @param {Array} memories - 记忆对象数组
   * @returns {Object} 报告对象
   */
  generateReport(memories) {
    const scored = this.scoreBatch(memories);
    
    const stats = {
      total: scored.length,
      average: 0,
      highest: 0,
      lowest: 200,
      distribution: {
        high: 0,    // 100+
        medium: 0, // 60-99
        low: 0,    // 30-59
        veryLow: 0, // <30
      },
    };

    if (scored.length === 0) return stats;

    let sum = 0;
    scored.forEach(({ score }) => {
      sum += score;
      if (score > stats.highest) stats.highest = score;
      if (score < stats.lowest) stats.lowest = score;
      
      if (score >= 100) stats.distribution.high++;
      else if (score >= 60) stats.distribution.medium++;
      else if (score >= 30) stats.distribution.low++;
      else stats.distribution.veryLow++;
    });

    stats.average = Math.round(sum / scored.length);

    return {
      ...stats,
      topMemories: scored.slice(0, 5).map(item => ({
        key: item.memory.key,
        score: item.score,
        source: item.memory.source || item.memory.level,
        type: item.memory.type,
      })),
      bottomMemories: scored.slice(-3).map(item => ({
        key: item.memory.key,
        score: item.score,
        source: item.memory.source || item.memory.level,
      })),
    };
  }

  // ============================================================
  // 从文件加载记忆并评分
  // ============================================================

  /**
   * 从 meaningful-core.json 加载并评分
   */
  scoreCoreMemories() {
    const memories = this._loadJsonFile(this.corePath);
    if (!memories) return [];
    return this.scoreBatch(Object.values(memories));
  }

  /**
   * 从 meaningful-learned.json 加载并评分
   */
  scoreLearnedMemories() {
    const memories = this._loadJsonFile(this.learnedPath);
    if (!memories) return [];
    return this.scoreBatch(Object.values(memories));
  }

  /**
   * 加载所有记忆并评分
   */
  scoreAllMemories() {
    const core = this.scoreCoreMemories();
    const learned = this.scoreLearnedMemories();
    return {
      core,
      learned,
      all: [...core, ...learned].sort((a, b) => b.score - a.score),
    };
  }

  /**
   * 获取重要记忆的 key 列表（用于压缩时优先保留）
   * @param {number} topN - 获取前 N 条
   * @returns {Set} 重要记忆的 key 集合
   */
  getImportantKeys(topN = 20) {
    const { all } = this.scoreAllMemories();
    return new Set(all.slice(0, topN).map(item => item.memory.key));
  }

  /**
   * 检查某个 key 是否是重要记忆
   * @param {string} key
   * @returns {boolean}
   */
  isImportant(key) {
    const importantKeys = this.getImportantKeys();
    return importantKeys.has(key);
  }

  // ============================================================
  // 辅助方法
  // ============================================================

  _loadJsonFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
      }
    } catch (e) {
      // 静默失败
    }
    return null;
  }

  /**
   * 获取评分说明（用于调试/报告）
   */
  explainScore(memory) {
    const breakdown = {
      source: {
        weight: this._getSourceWeight(memory),
        source: memory.source || memory.level || 'default',
      },
    };

    if (memory.timestamp) {
      breakdown.recency = {
        bonus: this._getRecencyBonus(memory.timestamp),
        age: this._formatAge(memory.timestamp),
      };
    }

    if (memory.accessCount > 0) {
      breakdown.access = {
        bonus: memory.accessCount * this.config.accessWeight,
        count: memory.accessCount,
      };
    }

    if (memory.selfVerifyScore) {
      breakdown.verification = {
        bonus: memory.selfVerifyScore * this.config.verificationWeight,
        score: memory.selfVerifyScore,
      };
    }

    breakdown.type = {
      bonus: this._getTypeBonus(memory),
      type: memory.type,
    };

    const total = this.score(memory);

    return {
      total,
      breakdown,
      recommendation: total >= 80 ? 'KEEP' : total >= 50 ? 'REVIEW' : 'COMPRESS',
    };
  }

  _formatAge(timestamp) {
    const age = Date.now() - timestamp;
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    
    if (age < minute) return '不到 1 分钟';
    if (age < hour) return `${Math.floor(age / minute)} 分钟`;
    if (age < day) return `${Math.floor(age / hour)} 小时`;
    return `${Math.floor(age / day)} 天`;
  }
}

// ============================================================
// 导出
// ============================================================

module.exports = {
  ImportanceScorer,
  SOURCE_WEIGHTS,
  RECENCY_BONUS,
};
