/**
 * HeartFlow Reflexion Module v1.0
 * ==================================
 * 实现 Reflexion 架构：Actor → Evaluator → ReflectionGenerator → Memory
 * 
 * 基于论文 "Reflexion: Language Agents with Verbal Reinforcement Learning"
 * arXiv:2303.11366
 * 
 * 核心思想：
 * - Actor 负责执行动作生成轨迹
 * - Evaluator 评估轨迹给出二元或定量反馈
 * - ReflectionGenerator 基于反馈生成语言反思
 * - Memory 存储反思供后续决策参考
 *
 * @version 1.0.0
 * @date 2026-05-14
 */

'use strict';

const EventEmitter = require('events');

// ─── 反思存储器 ────────────────────────────────────────────────────────────

class ReflectionMemory {
  constructor() {
    this.shortTerm = [];      // 短期：最近 N 条反思
    this.longTerm = [];       // 长期：重要反思持久化
    this.maxShortTerm = 100;
    this.maxLongTerm = 1000;
  }

  add(reflection) {
    this.shortTerm.push(reflection);
    
    // 重要反思升级到长期
    if (reflection.importance === 'high') {
      this.longTerm.push(reflection);
      if (this.longTerm.length > this.maxLongTerm) {
        this.longTerm.shift();
      }
    }

    // 短期记忆溢出时，淘汰低重要性
    if (this.shortTerm.length > this.maxShortTerm) {
      this.shortTerm = this.shortTerm
        .sort((a, b) => (b.importance === 'high' ? 1 : 0) - (a.importance === 'high' ? 1 : 0))
        .slice(0, this.maxShortTerm);
    }
  }

  getRecent(n = 10) {
    return this.shortTerm.slice(-n);
  }

  getByType(type) {
    return this.shortTerm.filter(r => r.type === type);
  }

  search(query) {
    const lower = query.toLowerCase();
    return this.shortTerm.filter(r => 
      r.reflection.toLowerCase().includes(lower) ||
      r.feedback.toLowerCase().includes(lower)
    );
  }

  toJSON() {
    return {
      shortTerm: this.shortTerm,
      longTerm: this.longTerm.slice(-100)
    };
  }
}

// ─── Actor 模块 ────────────────────────────────────────────────────────────

class Actor {
  constructor(config = {}) {
    this.name = config.name || 'Actor';
    this.model = config.model || 'default';
  }

  /**
   * 执行动作并生成轨迹
   * @param {string} task - 任务描述
   * @param {object} context - 上下文（记忆、技能等）
   * @returns {object} trajectory
   */
  act(task, context = {}) {
    const timestamp = Date.now();
    
    // 构建提示词
    const prompt = this._buildPrompt(task, context);
    
    // 执行动作（实际由外部LLM调用，这里是结构化模拟）
    const response = this._generateResponse(prompt, context);
    
    return {
      task,
      prompt,
      response,
      timestamp,
      success: this._assessSuccess(response)
    };
  }

  _buildPrompt(task, context) {
    let prompt = `Task: ${task}\n\n`;
    
    if (context.memories && context.memories.length > 0) {
      prompt += '\nRelevant past reflections:\n';
      context.memories.slice(-5).forEach((m, i) => {
        prompt += `${i + 1}. ${m.reflection}\n`;
      });
    }
    
    if (context.skills) {
      prompt += '\nAvailable skills: ' + context.skills.join(', ') + '\n';
    }
    
    prompt += '\nProvide your response:';
    return prompt;
  }

  _generateResponse(prompt, context) {
    // 模拟响应（实际由外部LLM生成）
    // 这里返回结构化占位符
    return {
      content: `[Actor response for: ${prompt.substring(0, 50)}...]`,
      reasoning: [],
      actions: []
    };
  }

  _assessSuccess(response) {
    // 简化的成功评估
    return response.content && response.content.length > 0;
  }
}

// ─── Evaluator 模块 ─────────────────────────────────────────────────────────

class Evaluator {
  constructor(config = {}) {
    this.name = config.name || 'Evaluator';
    this.strict = config.strict || false;
  }

  /**
   * 评估轨迹
   * @param {object} trajectory - Actor生成的轨迹
   * @param {object} groundTruth - 参考答案（可选）
   * @returns {object} evaluation
   */
  evaluate(trajectory, groundTruth = null) {
    const { task, response } = trajectory;
    
    // 多维度评估
    const dimensions = this._evaluateDimensions(trajectory);
    
    // 二元决策：通过/失败
    const overall = this._computeOverall(dimensions);
    
    // 生成详细反馈
    const feedback = this._generateFeedback(dimensions, trajectory);
    
    return {
      task,
      dimensions,
      overall,
      feedback,
      score: this._computeScore(dimensions),
      timestamp: Date.now()
    };
  }

  _evaluateDimensions(trajectory) {
    const { task, response } = trajectory;
    const content = response.content || '';
    
    return {
      // 任务完成度
      completion: this._evaluateCompletion(content, task),
      
      // 事实准确性
      accuracy: this._evaluateAccuracy(content),
      
      // 推理连贯性
      coherence: this._evaluateCoherence(content),
      
      // 安全性
      safety: this._evaluateSafety(content),
      
      // 效率
      efficiency: this._evaluateEfficiency(content)
    };
  }

  _evaluateCompletion(content, task) {
    // 检查内容是否回应了任务
    const taskWords = task.toLowerCase().split(/\s+/);
    const matched = taskWords.filter(w => content.toLowerCase().includes(w)).length;
    const ratio = matched / taskWords.length;
    return {
      score: Math.min(1, ratio * 1.5),
      pass: ratio > 0.3,
      reason: `Task keyword match: ${Math.round(ratio * 100)}%`
    };
  }

  _evaluateAccuracy(content) {
    // 检测明显的错误信号
    const errorSignals = [
      'i am not sure', 'i cannot', 'i don\'t know',
      'incorrect', 'wrong', 'false', 'error'
    ];
    const hasError = errorSignals.some(s => content.toLowerCase().includes(s));
    return {
      score: hasError ? 0.3 : 0.9,
      pass: !hasError,
      reason: hasError ? 'Contains uncertainty/error signals' : 'No obvious errors detected'
    };
  }

  _evaluateCoherence(content) {
    // 检查内容连贯性（长度合理、有结构）
    const hasStructure = content.includes('\n') || content.includes(':');
    const reasonableLength = content.length > 50 && content.length < 10000;
    const score = (hasStructure ? 0.3 : 0) + (reasonableLength ? 0.6 : 0);
    return {
      score: Math.min(1, score),
      pass: reasonableLength,
      reason: reasonableLength ? 'Content length reasonable' : 'Content length unusual'
    };
  }

  _evaluateSafety(content) {
    // 检查安全问题
    const safeSignals = [
      'harmful', 'illegal', 'unsafe', 'dangerous'
    ];
    const hasUnsafe = safeSignals.some(s => content.toLowerCase().includes(s));
    return {
      score: hasUnsafe ? 0 : 1,
      pass: !hasUnsafe,
      reason: hasUnsafe ? 'Contains potentially unsafe content' : 'Content appears safe'
    };
  }

  _evaluateEfficiency(content) {
    // 效率评估（简洁性）
    const optimalLength = 200;
    const ratio = content.length / optimalLength;
    const score = ratio > 1 ? Math.max(0.3, 1 - (ratio - 1) * 0.3) : ratio;
    return {
      score: Math.min(1, score),
      pass: content.length < 5000,
      reason: `Content length: ${content.length} chars`
    };
  }

  _computeOverall(dimensions) {
    const { completion, accuracy, coherence, safety, efficiency } = dimensions;
    
    // 安全一票否决
    if (!safety.pass) return 'fail';
    
    // 严格模式：所有维度必须通过
    if (this.strict) {
      return (completion.pass && accuracy.pass && coherence.pass) ? 'pass' : 'fail';
    }
    
    // 宽松模式：至少2个核心维度通过
    const corePassCount = [completion, accuracy, coherence].filter(d => d.pass).length;
    return corePassCount >= 2 ? 'pass' : 'fail';
  }

  _computeScore(dimensions) {
    const { completion, accuracy, coherence, safety, efficiency } = dimensions;
    return Math.round(
      (completion.score * 0.3 +
       accuracy.score * 0.3 +
       coherence.score * 0.15 +
       safety.score * 0.15 +
       efficiency.score * 0.1) * 100
    );
  }

  _generateFeedback(dimensions, trajectory) {
    const { task, response } = trajectory;
    const lines = [];
    
    lines.push(`Task: ${task.substring(0, 100)}`);
    lines.push(`Overall: ${dimensions.safety.pass ? '✅' : '❌'} ${dimensions.accuracy.pass ? '✅' : '❌'} ${dimensions.coherence.pass ? '✅' : '❌'}`);
    lines.push('');
    
    for (const [dim, result] of Object.entries(dimensions)) {
      lines.push(`[${dim.toUpperCase()}] ${result.score.toFixed(2)} - ${result.reason}`);
    }
    
    lines.push('');
    lines.push('Suggestions:');
    
    if (!dimensions.completion.pass) {
      lines.push('- Ensure the response directly addresses the task');
    }
    if (!dimensions.accuracy.pass) {
      lines.push('- Verify facts and avoid uncertain language');
    }
    if (!dimensions.coherence.pass) {
      lines.push('- Structure the response better with clear sections');
    }
    
    return lines.join('\n');
  }
}

// ─── 反思生成器 ─────────────────────────────────────────────────────────────

class ReflectionGenerator {
  constructor(config = {}) {
    this.name = config.name || 'ReflectionGenerator';
  }

  /**
   * 生成语言反思
   * @param {object} trajectory - Actor的轨迹
   * @param {object} evaluation - Evaluator的评估
   * @returns {object} reflection
   */
  generate(trajectory, evaluation) {
    const { task, response } = trajectory;
    const { dimensions, overall, score } = evaluation;
    
    // 核心反思内容
    const reflectionText = this._generateReflectionText(trajectory, evaluation);
    
    // 反思类型分类
    const type = this._classifyReflection(dimensions);
    
    // 重要性评估
    const importance = this._assessImportance(score, dimensions);
    
    // 教训总结
    const lessons = this._extractLessons(trajectory, evaluation);
    
    return {
      type,
      importance,
      reflection: reflectionText,
      lessons,
      score,
      dimensions,
      trajectory: {
        task: task.substring(0, 200),
        responseLength: response.content?.length || 0
      },
      timestamp: Date.now()
    };
  }

  _generateReflectionText(trajectory, evaluation) {
    const { task, response } = trajectory;
    const { dimensions, overall } = evaluation;
    const content = response.content || '';
    
    const lines = [];
    
    if (overall === 'fail') {
      lines.push(`反思：任务"${task.substring(0, 50)}..."未能成功完成。`);
      
      // 指出具体问题
      const failures = Object.entries(dimensions)
        .filter(([_, d]) => !d.pass)
        .map(([k, _]) => k);
      
      if (failures.length > 0) {
        lines.push(`主要问题：${failures.join(', ')}。`);
      }
      
      // 提出改进方向
      lines.push('改进策略：');
      if (dimensions.completion?.score < 0.5) {
        lines.push('- 更仔细地分析任务要求，确保理解核心目标');
      }
      if (dimensions.accuracy?.score < 0.5) {
        lines.push('- 在不确定时寻求外部验证，避免模糊表述');
      }
      if (dimensions.coherence?.score < 0.5) {
        lines.push('- 重新组织回答结构，使用清晰的层次');
      }
      
    } else {
      lines.push(`任务"${task.substring(0, 50)}..."成功完成。`);
      lines.push(`评分：${evaluation.score}/100。`);
      
      // 总结成功经验
      const successes = Object.entries(dimensions)
        .filter(([_, d]) => d.pass && d.score > 0.8)
        .map(([k, _]) => k);
      
      if (successes.length > 0) {
        lines.push(`有效策略：${successes.join(', ')}。`);
      }
    }
    
    return lines.join('\n');
  }

  _classifyReflection(dimensions) {
    if (!dimensions.accuracy.pass) return 'factual_error';
    if (!dimensions.completion.pass) return 'incomplete';
    if (!dimensions.coherence.pass) return 'incoherent';
    if (!dimensions.safety?.pass) return 'safety_concern';
    return 'successful';
  }

  _assessImportance(score, dimensions) {
    if (score < 30) return 'high';
    if (score < 60) return 'medium';
    
    // 即使高分，如果某一维度特别差，也标记为重要
    const hasCriticalFailure = Object.values(dimensions)
      .some(d => d.pass === false && d.score < 0.2);
    
    return hasCriticalFailure ? 'high' : 'low';
  }

  _extractLessons(trajectory, evaluation) {
    const lessons = [];
    const { dimensions } = evaluation;
    
    if (dimensions.completion?.score < 0.5) {
      lessons.push('需要更深入理解任务要求');
    }
    if (dimensions.accuracy?.score < 0.5) {
      lessons.push('避免使用不确定的表达，如"I am not sure"');
    }
    if (dimensions.coherence?.score < 0.5) {
      lessons.push('回答应具有清晰的结构和逻辑流');
    }
    
    return lessons;
  }
}

// ─── Reflexion 主类 ─────────────────────────────────────────────────────────

class Reflexion extends EventEmitter {
  constructor(fs = null) {
    super();
    
    this.actor = new Actor();
    this.evaluator = new Evaluator({ strict: false });
    this.generator = new ReflectionGenerator();
    this.memory = new ReflectionMemory();
    
    this.fs = fs;
    this.stats = {
      total: 0,
      success: 0,
      failure: 0,
      avgScore: 0
    };
  }

  /**
   * 执行 Reflexion 循环
   * @param {string} task - 任务描述
   * @param {object} context - 上下文
   * @returns {object} result
   */
  async reflect(task, context = {}) {
    this.stats.total++;
    
    // 1. Actor 执行动作
    const trajectory = this.actor.act(task, {
      ...context,
      memories: this.memory.getRecent(5)
    });
    
    // 2. Evaluator 评估轨迹
    const evaluation = this.evaluator.evaluate(trajectory);
    
    // 3. 如果失败，生成反思
    let reflection = null;
    if (evaluation.overall === 'fail') {
      reflection = this.generator.generate(trajectory, evaluation);
      this.memory.add(reflection);
      
      this.emit('reflection', reflection);
      this.stats.failure++;
    } else {
      this.stats.success++;
    }
    
    // 更新平均分
    this.stats.avgScore = (
      (this.stats.avgScore * (this.stats.total - 1) + evaluation.score) /
      this.stats.total
    );
    
    return {
      trajectory,
      evaluation,
      reflection,
      success: evaluation.overall === 'pass'
    };
  }

  /**
   * 获取最近反思
   */
  getRecentReflections(n = 10) {
    return this.memory.getRecent(n);
  }

  /**
   * 搜索反思
   */
  searchReflections(query) {
    return this.memory.search(query);
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      ...this.stats,
      memorySize: this.memory.shortTerm.length,
      successRate: this.stats.total > 0 
        ? (this.stats.success / this.stats.total * 100).toFixed(1) + '%'
        : 'N/A'
    };
  }

  /**
   * 导出反思数据
   */
  export() {
    return this.memory.toJSON();
  }
}

module.exports = {
  Reflexion,
  Actor,
  Evaluator,
  ReflectionGenerator,
  ReflectionMemory
};
