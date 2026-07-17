/**
 * CognitiveLoadBalancer — 多智能体认知损耗规避引擎 v1.0.0
 *
 * 基于 "The Bystander Effect in Multi-Agent Reasoning" (arXiv:2605.10698)
 * 解决多智能体系统中的认知偷懒 (Cognitive Loafing) 问题：
 *   - 交互深度限制 D_L：超过智能体数量阈值后个体逻辑主权下降
 *   - 动态激活：某些引擎在某些场景下可被抑制
 *   - 最优并行度控制
 *
 * 集成:
 *   hf.cognitiveLoad.balance(activeEngines, taskComplexity)
 *   hf.cognitiveLoad.getOptimalCount(taskType)
 *   hf.cognitiveLoad.detectLoafing(engineStats)
 */

const VERSION = '1.0.0';

// 默认交互深度限制 (D_L)
const DEFAULT_DEPTH_LIMIT = 5;

// 引擎复杂度权重（越高越需要独立运行）
const ENGINE_COMPLEXITY = {
  'causal-inference': 0.9,
  'metacognitive-feedback': 0.8,
  'memory-quality': 0.7,
  'reflexion-engine': 0.8,
  'self-play': 0.85,
  'decision-router': 0.9,
  'tom-engine': 0.75,
  'pipeline': 0.6,
  'memory-consolidator': 0.5,
  'multi-agent-dialogue': 0.8,
};

class CognitiveLoadBalancer {
  constructor(options = {}) {
    this.version = VERSION;
    this.config = {
      maxActiveEngines: options.maxActiveEngines || DEFAULT_DEPTH_LIMIT,
      loafingThreshold: options.loafingThreshold || 0.3,
      complexityWeight: options.complexityWeight || 1.0,
    };

    /** @type {Map<string, Object>} 引擎状态追踪 */
    this.engineStates = new Map();

    /** @type {Array} 认知损耗检测日志 */
    this.loafingLog = [];
  }

  // ─── 负载均衡 ─────────────────────────────────────────────────────────────

  /**
   * 根据任务复杂度动态决定激活哪些引擎
   * @param {Array} candidateEngines - 候选引擎列表
   * @param {number} taskComplexity - 任务复杂度 0-1
   * @returns {Array} 应激活的引擎列表
   */
  balance(candidateEngines, taskComplexity = 0.5) {
    const maxAllowed = this._computeOptimalCount(taskComplexity);
    const scored = candidateEngines.map(name => ({
      name,
      complexity: (ENGINE_COMPLEXITY[name] || 0.5) * this.config.complexityWeight,
      state: this.engineStates.get(name) || { recentOutputs: [], avgQuality: 0.5 },
    }));

    // 按复杂度+质量排序
    scored.sort((a, b) => {
      const scoreA = a.complexity * 0.6 + a.state.avgQuality * 0.4;
      const scoreB = b.complexity * 0.6 + b.state.avgQuality * 0.4;
      return scoreB - scoreA;
    });

    const selected = scored.slice(0, maxAllowed).map(s => s.name);

    // 记录被抑制的引擎
    const suppressed = scored.slice(maxAllowed).map(s => s.name);

    return {
      activated: selected,
      suppressed,
      reason: suppressed.length > 0
        ? `D_L exceeded: ${candidateEngines.length} candidates → ${maxAllowed} activated (complexity=${taskComplexity.toFixed(2)})`
        : 'All engines activated within D_L',
      optimalCount: maxAllowed,
      taskComplexity,
    };
  }

  /**
   * 计算最优引擎数量
   * @private
   */
  _computeOptimalCount(taskComplexity) {
    // 高复杂度任务允许更多引擎（需要更多认知资源）
    // 低复杂度任务限制引擎数量（避免 overhead）
    const base = this.config.maxActiveEngines;
    if (taskComplexity > 0.7) return Math.min(base + 1, 8);
    if (taskComplexity < 0.3) return Math.max(2, base - 1);
    return base;
  }

  // ─── 认知损耗检测 ─────────────────────────────────────────────────────────

  /**
   * 检测引擎是否出现认知偷懒
   * @param {string} engineName - 引擎名称
   * @param {Object} output - 本次输出
   * @returns {Object} 检测结果
   */
  detectLoafing(engineName, output) {
    const state = this.engineStates.get(engineName) || {
      recentOutputs: [],
      avgQuality: 0.5,
      consecutiveLowQuality: 0,
    };

    // 评估输出质量
    const quality = this._assessOutputQuality(output);
    state.recentOutputs.push({ quality, timestamp: Date.now() });
    if (state.recentOutputs.length > 20) state.recentOutputs.shift();

    // 计算最近的平均质量
    const recent = state.recentOutputs.slice(-5);
    const avgQuality = recent.reduce((s, r) => s + r.quality, 0) / recent.length;
    state.avgQuality = avgQuality;

    // 检测连续低质量输出
    if (quality < this.config.loafingThreshold) {
      state.consecutiveLowQuality++;
    } else {
      state.consecutiveLowQuality = 0;
    }

    const isLoafing = state.consecutiveLowQuality >= 3;

    if (isLoafing) {
      this.loafingLog.push({
        engine: engineName,
        timestamp: Date.now(),
        consecutiveLowQuality: state.consecutiveLowQuality,
        avgQuality,
      });
    }

    this.engineStates.set(engineName, state);

    return {
      engine: engineName,
      isLoafing,
      quality,
      avgQuality,
      consecutiveLowQuality: state.consecutiveLowQuality,
      recommendation: isLoafing ? 'suppress' : avgQuality < 0.5 ? 'reduce-weight' : 'maintain',
    };
  }

  /**
   * 评估输出质量
   * @private
   */
  _assessOutputQuality(output) {
    if (!output) return 0;
    let score = 0.3; // base

    if (output.confidence !== undefined) score += output.confidence * 0.3;
    if (output.decision) score += 0.2;
    if (output.reasoning && output.reasoning.length > 0) score += 0.1;
    if (output.action) score += 0.1;

    return Math.min(1, score);
  }

  // ─── 统计 ─────────────────────────────────────────────────────────────────

  getStats() {
    let loafingCount = 0;
    for (const [_, state] of this.engineStates) {
      if (state.consecutiveLowQuality >= 3) loafingCount++;
    }

    return {
      version: this.version,
      trackedEngines: this.engineStates.size,
      loafingEngines: loafingCount,
      totalLoafingEvents: this.loafingLog.length,
      config: this.config,
    };
  }

  /**
   * 重置引擎状态
   */
  reset(engineName) {
    if (engineName) {
      this.engineStates.delete(engineName);
    } else {
      this.engineStates.clear();
      this.loafingLog = [];
    }
  }
}

module.exports = { CognitiveLoadBalancer };
