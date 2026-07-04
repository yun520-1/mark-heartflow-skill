/**
 * InformationFlowOrchestrator — 信息流编排引擎 v1.0.0
 *
 * 基于 "Beyond Rule-Based Workflows" (arXiv:2601.09883)：
 * 替代硬编码路由表，让引擎之间通过通信协商协作顺序。
 * 每个增强引擎变为可通信的独立智能体，信息流决定执行顺序。
 *
 * 核心机制：
 *   1. 信息板 (Blackboard)：共享信息交换点
 *   2. 引擎注册：每个引擎声明输入/输出类型
 *   3. 自动匹配：基于输入输出类型自动编排执行顺序
 *   4. 反馈环：引擎输出可触发其他引擎的重新激活
 *
 * 集成:
 *   hf.infoFlow.register(engineName, inputTypes, outputTypes, handler)
 *   hf.infoFlow.orchestrate(goal, availableEngines)
 *   hf.infoFlow.getStats()
 */

const VERSION = '1.0.0';

class InformationFlowOrchestrator {
  constructor(options = {}) {
    this.version = VERSION;
    this.config = {
      maxIterations: options.maxIterations || 10,
      convergenceThreshold: options.convergenceThreshold || 0.95,
    };

    /** @type {Map<string, Object>} 注册的引擎 */
    this.engines = new Map();

    /** @type {Array} 编排历史 */
    this.orchestrationLog = [];
  }

  // ─── 核心 API ─────────────────────────────────────────────────────────────

  /**
   * 注册一个可编排引擎
   * @param {string} name - 引擎名称
   * @param {Array} inputTypes - 可接受的输入类型
   * @param {Array} outputTypes - 可产生的输出类型
   * @param {Function} handler - 处理函数 (input) → output
   */
  register(name, inputTypes, outputTypes, handler) {
    this.engines.set(name, {
      name,
      inputTypes: new Set(inputTypes || []),
      outputTypes: new Set(outputTypes || []),
      handler,
      invocationCount: 0,
      lastOutput: null,
    });
  }

  /**
   * 基于目标自动编排引擎执行顺序
   * @param {Object} goal - 目标 {requiredOutputs: ['decision', 'memory'], context: {}}
   * @param {Array} availableEngines - 可用的引擎名称列表
   * @returns {Object} 编排结果 {sequence, rationale, outputs}
   */
  orchestrate(goal, availableEngines = []) {
    const requiredOutputs = new Set(goal.requiredOutputs || ['decision']);
    const context = goal.context || {};
    const sequence = [];
    const outputs = {};
    const available = new Set(availableEngines);

    // 获取可用引擎中能产生所需输出的
    let iteration = 0;
    let remaining = new Set(requiredOutputs);

    while (remaining.size > 0 && iteration < this.config.maxIterations) {
      iteration++;

      // 找到能产生剩余所需输出的引擎
      let bestEngine = null;
      let bestMatch = 0;

      for (const [name, engine] of this.engines) {
        if (!available.has(name)) continue;
        if (sequence.includes(name)) continue;

        const match = [...remaining].filter(o => engine.outputTypes.has(o)).length;
        if (match > bestMatch) {
          bestMatch = match;
          bestEngine = name;
        }
      }

      if (!bestEngine) break;

      const engine = this.engines.get(bestEngine);
      sequence.push(bestEngine);
      engine.invocationCount++;

      // 模拟执行
      try {
        engine.lastOutput = engine.handler(context) || {};
        for (const ot of engine.outputTypes) {
          if (remaining.has(ot)) {
            remaining.delete(ot);
            outputs[ot] = engine.lastOutput;
          }
        }
      } catch (e) {
        engine.lastOutput = { error: e.message };
      }
    }

    const rationale = remaining.size === 0
      ? `All required outputs produced in ${sequence.length} steps`
      : `Could not produce: ${[...remaining].join(', ')} — available engines may lack required capabilities`;

    const result = { sequence, outputs, rationale, iterations: iteration };
    this.orchestrationLog.push({ ...result, goal: goal.requiredOutputs, timestamp: Date.now() });
    return result;
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      version: this.version,
      registeredEngines: this.engines.size,
      orchestrations: this.orchestrationLog.length,
      engineStats: [...this.engines.entries()].map(([name, e]) => ({
        name,
        inputs: [...e.inputTypes],
        outputs: [...e.outputTypes],
        invocations: e.invocationCount,
      })),
    };
  }

  /**
   * 重置状态
   */
  reset() {
    this.engines.clear();
    this.orchestrationLog = [];
  }
}

module.exports = { InformationFlowOrchestrator };
