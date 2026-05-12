/**
 * HeartFlow Reflexion Module (v11.15.6)
 * 
 * Based on:
 * - Reflexion (NeurIPS 2023): Verbal Reinforcement Learning for Language Agents
 *   https://github.com/noahshinn/reflexion
 * - Self-Healing RAG: CRAG three-state validation
 * 
 * 核心思想：
 * - 错误不是终点，是学习的起点
 * - 尝试 → 失败 → 自我反思(分析原因) → 修正 → 再次尝试
 * - 反思 prompt: "诊断可能的失败原因，制定新的计划来避免同样的失败"
 */

/**
 * Reflexion Strategy Types
 * 反思策略类型（来自 Reflexion 论文）
 */
const ReflexionStrategy = {
  NONE: 'none',                           // 无反思
  LAST_ATTEMPT: 'last_trial',            // 使用上次的推理痕迹
  REFLEXION: 'reflexion',                // 应用反思到下一次推理
  LAST_ATTEMPT_AND_REFLEXION: 'last_trial_and_reflexion'  // 两者都用
};

/**
 * Error State Classification (来自 CRAG)
 * 三状态验证：正确 / 模糊 / 错误
 */
const ErrorState = {
  CORRECT: 'correct',
  AMBIGUOUS: 'ambiguous',
  INCORRECT: 'incorrect'
};

/**
 * Self-Healing Trigger Types
 * 自愈触发类型
 */
const HealTrigger = {
  LOGIC_ERROR: 'logic_error',
  VERIFICATION_FAIL: 'verify_fail',
  FEEDBACK_NEGATIVE: 'negative',
  CONFLICT_DETECTED: 'conflict',
  RECURSION_OVERFLOW: 'overflow'
};

/**
 * Self-Reflection Record
 * 自我反思记录
 */
class Reflexion {
  constructor(trial, error, reflection, strategy) {
    this.id = `refl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    this.trial = trial;                  // 失败的尝试
    this.error = error;                  // 错误描述
    this.reflection = reflection;        // 反思内容（语言描述）
    this.strategy = strategy;            // 使用的策略
    this.timestamp = Date.now();
    this.status = 'pending';             // pending / applied / verified
  }
}

/**
 * Reflexion Engine
 * 基于 Reflexion 论文的自愈引擎
 */
class ReflexionEngine {
  constructor(options = {}) {
    this.maxReflections = options.maxReflections ?? 100;
    this.recursionLimit = options.recursionLimit ?? 10;
    this.confidenceThreshold = options.confidenceThreshold ?? 0.5;
    
    this.reflections = [];              // 历史反思
    this.reflectionsStr = '';           // 用于上下文的字符串
    this.scratchpad = '';               // 推理痕迹
    this.stepN = 0;
    this.trial = 0;
  }

  /**
   * 运行 Reflexion 循环
   * Run Reflexion loop
   * 
   * 核心流程（来自 Reflexion 论文）：
   * 1. 尝试完成任务
   * 2. 如果失败 → reflect() 生成反思
   * 3. 根据策略决定是否使用上次推理痕迹
   * 4. 再次尝试
   */
  run(taskFn, options = {}) {
    const strategy = options.strategy || ReflexionStrategy.REFLEXION;
    
    // 如果不是第一次尝试且失败了
    if (this.stepN > 0 && !this.isCorrect(options.lastResult)) {
      if (strategy !== ReflexionStrategy.NONE) {
        this.reflect(strategy, options.lastError);
      }
    }
    
    // 执行任务
    this.stepN++;
    const result = taskFn({
      reflections: this.reflectionsStr,
      scratchpad: this.scratchpad,
      trial: this.trial
    });
    
    return {
      result,
      reflections: this.reflectionsStr,
      scratchpad: this.scratchpad
    };
  }

  /**
   * 生成反思
   * 
   * Reflexion 论文的反思 prompt:
   * "You are an advanced reasoning agent that can improve based on self reflection.
   *  You will be given a previous reasoning trial in which you were given access to 
   *  relevant context and a question to answer. You were unsuccessful in answering 
   *  the question either because you guessed the wrong answer with Finish[<answer>] 
   *  or there is a phrasing discrepancy with your provided answer and the answer key.
   *  In a few sentences, Diagnose a possible reason for failure or phrasing discrepancy 
   *  and devise a new, concise, high level plan that aims to mitigate the same failure.
   *  Use complete sentences."
   */
  reflect(strategy, errorContext = '') {
    this.trial++;
    
    const previousReflection = this.reflections.length > 0 
      ? this.reflections[this.reflections.length - 1].reflection 
      : 'No previous reflection.';
    
    // 生成反思内容（这里应该调用 LLM，实际使用时替换）
    const reflection = this.generateReflection(strategy, errorContext, previousReflection);
    
    // 创建反思记录
    const reflRecord = new Reflexion(this.scratchpad, errorContext, reflection, strategy);
    reflRecord.status = 'applied';
    
    this.reflections.push(reflRecord);
    this.updateReflectionsString();
    
    return reflection;
  }

  /**
   * 生成反思内容
   * 实际使用时应该调用 LLM
   */
  generateReflection(strategy, errorContext, previousReflection) {
    // 简化版本 - 实际应该用 LLM
    return `Diagnosed failure: ${errorContext || 'Unknown error'}. ` +
           `Plan: Avoid the same error pattern detected in previous attempt.`;
  }

  /**
   * 更新用于上下文的反思字符串
   */
  updateReflectionsString() {
    if (this.reflections.length === 0) {
      this.reflectionsStr = '';
      return;
    }
    
    const parts = this.reflections.map((r, i) => 
      `Reflection ${i + 1}: ${r.reflection}`
    );
    this.reflectionsStr = '\n\n' + parts.join('\n\n');
  }

  /**
   * 判断结果是否正确
   * 实际使用时需要根据具体任务定义
   */
  isCorrect(result) {
    if (typeof result === 'boolean') return result;
    if (result && typeof result === 'object' && 'isCorrect' in result) {
      return result.isCorrect;
    }
    return false;
  }

  /**
   * 获取反思历史
   */
  getReflections() {
    return this.reflections;
  }

  /**
   * 清空历史
   */
  reset() {
    this.reflections = [];
    this.reflectionsStr = '';
    this.scratchpad = '';
    this.stepN = 0;
    this.trial = 0;
  }

  /**
   * 导出反思（用于传递）
   */
  export() {
    return this.reflections.map(r => ({
      reflection: r.reflection,
      strategy: r.strategy,
      timestamp: r.timestamp
    }));
  }
}

/**
 * CRAG-Inspired State Validator
 * 三状态验证器
 */
class StateValidator {
  constructor(options = {}) {
    this.confidenceThreshold = options.confidenceThreshold ?? 0.5;
  }

  /**
   * 执行三状态验证
   * correct / ambiguous / incorrect
   */
  validate(reflection, correctionResult) {
    const confidence = this.estimateConfidence(reflection, correctionResult);
    
    if (confidence >= this.confidenceThreshold && !correctionResult.hasNewErrors) {
      return ErrorState.CORRECT;
    } else if (confidence >= this.confidenceThreshold && correctionResult.hasNewErrors) {
      return ErrorState.INCORRECT;
    } else {
      return ErrorState.AMBIGUOUS;
    }
  }

  /**
   * 估计置信度
   */
  estimateConfidence(reflection, result) {
    // 简化版本 - 实际应该基于更多信号
    if (!reflection || !result) return 0;
    
    let confidence = 0.5; // 默认
    
    // 基于修正尝试次数
    if (reflection.attempts && reflection.attempts > 0) {
      confidence -= (reflection.attempts * 0.1);
    }
    
    // 基于结果
    if (result.success) confidence += 0.3;
    if (result.hasNewErrors) confidence -= 0.2;
    
    return Math.max(0, Math.min(1, confidence));
  }
}

// 导出单例和类
const reflexionEngine = new ReflexionEngine();
const stateValidator = new StateValidator();

module.exports = {
  ReflexionEngine,
  Reflexion,
  ReflexionStrategy,
  StateValidator,
  ErrorState,
  HealTrigger,
  reflexionEngine,
  stateValidator
};
