/**
 * Memory Optimization — 记忆系统优化（基于认知科学公式）
 * 
 * 新增公式：
 *   1. 工作记忆容量（7±2 chunks）
 *   2. 长期记忆巩固（LTP 模型）
 *   3. 记忆检索模型（SAM）
 *   4. 遗忘概率（指数衰减）
 *   5. 记忆巩固阈值
 */

const { ForgettingEngine } = require('./forgetting.js');

class MemoryOptimizer {
  constructor(options = {}) {
    this.forgettingEngine = ForgettingEngine; // 静态对象，不是构造函数
    this.workingMemoryCapacity = options.workingMemoryCapacity || 7; // 7±2 chunks
    this.consolidationThreshold = options.consolidationThreshold || 0.7; // 巩固阈值
    this.retrievalThreshold = options.retrievalThreshold || 0.5; // 检索阈值
  }

  /**
   * 优化工作记忆（容量限制）
   */
  optimizeWorkingMemory(memories) {
    if (!Array.isArray(memories)) {
      return { error: 'Memories must be an array' };
    }

    // 工作记忆容量限制（7±2）
    if (memories.length <= this.workingMemoryCapacity) {
      return {
        optimized: memories,
        capacity: this.workingMemoryCapacity,
        usage: memories.length,
        status: 'within_capacity',
      };
    }

    // 超出容量：按重要性排序，保留最重要的 N 个
    const sorted = memories.sort((a, b) => {
      const importanceA = a.importance || 0;
      const importanceB = b.importance || 0;
      return importanceB - importanceA;
    });

    const optimized = sorted.slice(0, this.workingMemoryCapacity);
    
    return {
      optimized,
      capacity: this.workingMemoryCapacity,
      usage: optimized.length,
      status: 'trimmed',
      trimmed: memories.length - optimized.length,
    };
  }

  /**
   * 长期记忆巩固（LTP 模型）
   */
  consolidateMemory(memory, options = {}) {
    const { repetitions = 1, spacing = 1 } = options;

    // LTP 模型：重复 + 间隔效应
    const consolidationScore = this._ltpScore(repetitions, spacing);
    
    if (consolidationScore >= this.consolidationThreshold) {
      return {
        memory,
        consolidated: true,
        score: consolidationScore,
        threshold: this.consolidationThreshold,
      };
    } else {
      return {
        memory,
        consolidated: false,
        score: consolidationScore,
        threshold: this.consolidationThreshold,
        suggestion: 'Increase repetitions or spacing to consolidate memory',
      };
    }
  }

  /**
   * LTP 评分（长期增强）
   */
  _ltpScore(repetitions, spacing) {
    // LTP 模型：重复次数 + 间隔时间
    const repetitionFactor = Math.log(repetitions + 1);
    const spacingFactor = Math.sqrt(spacing);
    return (repetitionFactor * spacingFactor) / 10;
  }

  /**
   * 记忆检索（SAM 模型）
   */
  retrieveMemory(query, memories, options = {}) {
    const { topK = 5 } = options;

    // SAM 模型：联想检索
    const results = memories.map(memory => {
      const similarity = this._samSimilarity(query, memory);
      const activation = this._samActivation(similarity, memory);
      
      return {
        memory,
        similarity,
        activation,
        retrieved: activation >= this.retrievalThreshold,
      };
    });

    // 排序并返回 topK
    results.sort((a, b) => b.activation - a.activation);
    const retrieved = results.slice(0, topK).filter(r => r.retrieved);
    
    return {
      query,
      retrieved: retrieved.map(r => r.memory),
      count: retrieved.length,
      threshold: this.retrievalThreshold,
    };
  }

  /**
   * SAM 相似度
   */
  _samSimilarity(query, memory) {
    // 简化：基于关键词匹配
    const queryTokens = query.toLowerCase().split(/\s+/);
    const memoryTokens = (memory.content || '').toLowerCase().split(/\s+/);
    
    let matches = 0;
    queryTokens.forEach(qt => {
      if (memoryTokens.some(mt => mt.includes(qt))) {
        matches++;
      }
    });

    return matches / queryTokens.length;
  }

  /**
   * SAM 激活水平
   */
  _samActivation(similarity, memory) {
    // 激活 = 相似度 + 记忆强度（基于访问次数）
    const strength = Math.log((memory.accessCount || 1) + 1);
    return similarity * strength;
  }

  /**
   * 遗忘概率（指数衰减）
   */
  forgettingProbability(ageMs) {
    // 遗忘概率：P(forget) = 1 - exp(-λ * t)
    const lambda = 1 / (24 * 60 * 60 * 1000); // 1 天半衰期
    const probability = 1 - Math.exp(-lambda * ageMs);
    
    return {
      ageMs,
      lambda,
      probability,
      halfLifeDays: 1,
      formula: 'P(forget) = 1 - exp(-λ * t)',
    };
  }

  /**
   * 记忆巩固建议
   */
  consolidationAdvice(memory) {
    const ageMs = Date.now() - (memory.timestamp || Date.now());
    const probability = this.forgettingProbability(ageMs).probability;
    
    if (probability < 0.3) {
      return {
        advice: 'Memory is fresh — no consolidation needed yet',
        probability,
        action: 'wait',
      };
    } else if (probability < 0.7) {
      return {
        advice: 'Memory is fading — review now to consolidate',
        probability,
        action: 'review',
      };
    } else {
      return {
        advice: 'Memory is likely forgotten — re-learn to re-consolidate',
        probability,
        action: 'relearn',
      };
    }
  }
}

module.exports = { MemoryOptimizer };