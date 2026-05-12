/**
 * HeartFlow Reflexion Engine v11.7.1
 * 
 * 整合: Reflexion (Shinn et al., NeurIPS 2023) + Generative Agents (Park et al., 2022)
 * 
 * 核心架构: 
 *   失败记录 → 自我反思 → 存储记忆 → 下次作为上下文
 * 
 * 三层反思:
 *   1. 即时反思 - 每次失败后立即反思
 *   2. 累积反思 - 多重失败后的深层反思
 *   3. 跨任务反思 - 类似任务的模式发现
 * 
 * Paper: 
 *   - Reflexion: Verbal Reinforcement Learning (NeurIPS 2023)
 *   - Generative Agents: Interactive Simulacra (2022)
 */

const fs = require('fs');
const path = require('path');

// 反思策略枚举
const REFLEXION_STRATEGY = {
  NONE: 'none',
  LAST_ATTEMPT: 'last_trial',
  REFLEXION: 'reflexion',
  LAST_ATTEMPT_AND_REFLEXION: 'last_trial_and_reflexion',
};

// 反思类型
const REFLECTION_TYPE = {
  IMMEDIATE: 'immediate',      // 即时反思：失败后立即
  CUMULATIVE: 'cumulative',     // 累积反思：多重失败后
  CROSS_TASK: 'cross_task',    // 跨任务反思：模式发现
};

// 记忆存储路径
const MEMORY_DIR = path.join(__dirname, '../../data/reflexion-memories');
const REFLECTION_FILE = path.join(MEMORY_DIR, 'reflections.json');
const OBSERVATION_FILE = path.join(MEMORY_DIR, 'observations.json');
const PLAN_FILE = path.join(MEMORY_DIR, 'plans.json');

class ReflectionLoop {
  constructor(options = {}) {
    this.maxReflections = options.maxReflections || 10;       // 最大反思存储数
    this.reflectionThreshold = options.reflectionThreshold || 2; // 失败次数阈值触发累积反思
    this.observationInterval = options.observationInterval || 10; // 观察记录间隔
    this.stepCount = 0;
    
    // 三层记忆 (Generative Agents 架构)
    this.observations = [];    // 观察层：日常事件/输入
    this.reflections = [];     // 反思层：高层思考
    this.plans = [];          // 计划层：具体行动
    
    // Reflexion 记忆
    this.trialMemories = [];  // 每次尝试的记忆
    this.reflectionMemories = []; // 反思记忆
    
    this._loadMemory();
  }

  // ============================================================
  // Generative Agents: 三层记忆架构
  // ============================================================
  
  /**
   * 记录观察 (Observation)
   * 对应 Generative Agents 的 observation 层
   */
  observe(input, output, context = {}) {
    const observation = {
      timestamp: Date.now(),
      input: this._truncate(input, 500),
      output: this._truncate(output, 500),
      context: context.type || 'general',
      step: this.stepCount,
    };
    
    this.observations.push(observation);
    
    // 观察过多时，触发反思
    if (this.observations.length % this.observationInterval === 0) {
      this._triggerReflection(REFLECTION_TYPE.IMMEDIATE);
    }
    
    return observation;
  }

  /**
   * 生成反思 (Reflection)
   * 对应 Generative Agents 的 reflection 层
   * 整合 Reflexion 的自我诊断
   */
  async reflect(options = {}) {
    const {
      strategy = REFLEXION_STRATEGY.REFLEXION,
      type = REFLECTION_TYPE.IMMEDIATE,
      recentTrials = [],
      context = {},
    } = options;

    let reflectionText = '';

    switch (strategy) {
      case REFLEXION_STRATEGY.LAST_ATTEMPT:
        // 使用上次尝试作为反思
        if (recentTrials.length > 0) {
          const last = recentTrials[recentTrials.length - 1];
          reflectionText = this._formatLastAttempt(
            context.question || context.input || '',
            last.scratchpad || last.output || ''
          );
        }
        break;

      case REFLEXION_STRATEGY.REFLEXION:
        // Reflexion 核心: 诊断+改进
        reflectionText = await this._generateReflexion(
          recentTrials,
          context
        );
        break;

      case REFLEXION_STRATEGY.LAST_ATTEMPT_AND_REFLEXION:
        // 两者结合
        if (recentTrials.length > 0) {
          const last = recentTrials[recentTrials.length - 1];
          reflectionText = this._formatLastAttempt(
            context.question || context.input || '',
            last.scratchpad || last.output || ''
          );
          reflectionText += '\n\n';
          reflectionText += await this._generateReflexion(recentTrials, context);
        }
        break;

      default:
        return '';
    }

    // 存储反思
    const reflection = {
      timestamp: Date.now(),
      type,
      strategy,
      content: reflectionText,
      context: context.type || 'general',
      trialCount: recentTrials.length,
    };

    this.reflections.push(reflection);
    this.reflectionMemories.push(reflection);

    // 限制存储数量
    if (this.reflections.length > this.maxReflections) {
      this.reflections = this.reflections.slice(-this.maxReflections);
    }

    this._saveMemory();

    return reflectionText;
  }

  /**
   * 生成计划 (Plan)
   * 基于反思生成下一步行动
   */
  plan(context = {}) {
    if (this.reflections.length === 0) {
      return null;
    }

    const recentReflection = this.reflections[this.reflections.length - 1];
    const relatedReflections = this._findRelatedReflections(context.type);

    // 生成计划提示
    const planPrompt = this._buildPlanPrompt(
      recentReflection,
      relatedReflections,
      context
    );

    return {
      prompt: planPrompt,
      reflection: recentReflection.content,
      relatedCount: relatedReflections.length,
    };
  }

  // ============================================================
  // Reflexion 核心实现
  // ============================================================

  /**
   * 生成 Reflexion 反思
   * 核心: 诊断失败原因 + 制定改进计划
   */
  async _generateReflexion(trials, context = {}) {
    if (trials.length === 0) {
      return '首次尝试，无法反思。';
    }

    const lastTrial = trials[trials.length - 1];
    const question = context.question || context.input || '';
    const scratchpad = lastTrial.scratchpad || lastTrial.output || '';

    // Reflexion 反思模板
    const reflectionPrompt = this._buildReflectionPrompt(question, scratchpad, trials.length);

    // 在实际使用中，这里会调用 LLM
    // 现在返回结构化的反思框架
    const reflection = this._synthesizeReflection(lastTrial, context);
    
    return reflection;
  }

  /**
   * 构建 Reflexion 反思提示词
   * 核心思想: "诊断失败 + 制定改进计划"
   */
  _buildReflectionPrompt(question, scratchpad, attemptCount) {
    return `You are an advanced reasoning agent that can improve based on self-reflection.

You attempted to answer/solve the following task and failed (attempt #${attemptCount}):

Task: ${question}

Previous reasoning:
${scratchpad}

In 2-3 sentences:
1. Diagnose a possible reason for failure
2. Devise a concise plan to avoid the same failure

Reflection:`;
  }

  /**
   * 综合反思内容 (内部实现，不依赖外部LLM)
   */
  _synthesizeReflection(trial, context = {}) {
    const errorType = this._classifyError(trial);
    const diagnosis = this._getDiagnosis(errorType);
    const plan = this._getPlan(errorType);

    return `[Reflexion] ${diagnosis}

[改进计划] ${plan}

[错误类型] ${errorType}
[尝试次数] ${trial.attemptCount || 1}`;
  }

  /**
   * 错误分类
   */
  _classifyError(trial) {
    const output = (trial.output || '').toLowerCase();
    const scratchpad = (trial.scratchpad || '').toLowerCase();

    if (trial.halted || scratchpad.includes('too many steps')) {
      return 'reasoning_steps_exhausted';
    }
    if (output.includes('incorrect') || output.includes('wrong')) {
      return 'incorrect_answer';
    }
    if (trial.error) {
      return 'execution_error';
    }
    return 'unknown_failure';
  }

  /**
   * 错误诊断模板
   */
  _getDiagnosis(errorType) {
    const diagnoses = {
      reasoning_steps_exhausted: 'Reasoning abandoned before reaching conclusion. The agent spent too many steps on tangential analysis.',
      incorrect_answer: 'Final answer does not match the expected result. Either flawed reasoning process or insufficient context.',
      execution_error: 'Code/prompt execution failed due to syntax error or invalid API call.',
      unknown_failure: 'Failure reason unclear. More detailed tracing needed.',
    };
    return diagnoses[errorType] || diagnoses.unknown_failure;
  }

  /**
   * 改进计划模板
   */
  _getPlan(errorType) {
    const plans = {
      reasoning_steps_exhausted: 'Focus on the core question immediately. Avoid going down rabbit holes. Set intermediate checkpoints.',
      incorrect_answer: 'Re-examine the reasoning chain step by step. Check each inference for logical consistency.',
      execution_error: 'Validate syntax and API parameters before execution. Add error handling for edge cases.',
      unknown_failure: 'Add more detailed logging to trace the failure point. Break down the task into smaller steps.',
    };
    return plans[errorType] || plans.unknown_failure;
  }

  // ============================================================
  // 工具方法
  // ============================================================

  /**
   * 格式化上次尝试 (LAST_ATTEMPT 策略)
   */
  _formatLastAttempt(question, scratchpad) {
    return `Previous attempt on this task:
${scratchpad || 'No previous reasoning recorded.'}`;
  }

  /**
   * 构建计划提示
   */
  _buildPlanPrompt(recentReflection, relatedReflections, context) {
    const relatedText = relatedReflections.length > 0
      ? `Related past reflections:\n${relatedReflections.map(r => `- ${r.content}`).join('\n')}`
      : 'No related past reflections.';

    return `Based on recent reflection:
${recentReflection.content}

${relatedText}

Current context: ${context.type || 'general task'}

Generate a concrete next step:`;
  }

  /**
   * 查找相关反思
   */
  _findRelatedReflections(type) {
    if (!type) return [];
    return this.reflections
      .filter(r => r.context === type)
      .slice(-3);
  }

  /**
   * 触发反思
   */
  _triggerReflection(type) {
    if (this.observations.length >= this.observationInterval) {
      const recentObs = this.observations.slice(-this.observationInterval);
      const context = this._summarizeObservations(recentObs);
      
      // 存储待处理的反思触发
      this.pendingReflection = {
        type,
        context,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * 总结观察
   */
  _summarizeObservations(observations) {
    const types = observations.map(o => o.context);
    const uniqueTypes = [...new Set(types)];
    return {
      count: observations.length,
      types: uniqueTypes,
      lastOutput: observations[observations.length - 1]?.output?.substring(0, 100),
    };
  }

  /**
   * 记录试错 (Reflexion trial)
   */
  recordTrial(trial) {
    const memory = {
      timestamp: Date.now(),
      input: trial.input || '',
      scratchpad: trial.scratchpad || '',
      output: trial.output || '',
      success: trial.success || false,
      attemptCount: (trial.attemptCount || 1),
      error: trial.error || null,
      halted: trial.halted || false,
    };

    this.trialMemories.push(memory);

    // 如果失败，触发 Reflexion
    if (!memory.success) {
      this.pendingReflexion = {
        trials: this.trialMemories.filter(t => t.input === memory.input),
        context: { input: memory.input },
        timestamp: Date.now(),
      };
    }

    this.stepCount++;
    this._saveMemory();

    return memory;
  }

  /**
   * 获取反思上下文 (用于下次任务)
   */
  getReflexionContext(question) {
    const related = this.trialMemories
      .filter(t => this._isSimilar(t.input, question))
      .slice(-5);

    if (related.length === 0) {
      return '';
    }

    const reflections = related
      .map(t => this.reflectionMemories.find(r => 
        Math.abs(r.timestamp - t.timestamp) < 60000 // 1分钟内
      ))
      .filter(Boolean);

    if (reflections.length === 0) {
      return `Previous attempts on similar tasks: ${related.length} tries made.`;
    }

    return reflections.map(r => r.content).join('\n\n');
  }

  /**
   * 判断是否相似
   */
  _isSimilar(a, b) {
    if (!a || !b) return false;
    const aWords = new Set(a.toLowerCase().split(/\s+/));
    const bWords = new Set(b.toLowerCase().split(/\s+/));
    const intersection = [...aWords].filter(w => bWords.has(w));
    const union = new Set([...aWords, ...bWords]);
    const similarity = intersection.length / union.size;
    return similarity > 0.3;
  }

  /**
   * 截断文本
   */
  _truncate(text, maxLen) {
    if (!text) return '';
    if (text.length <= maxLen) return text;
    return text.substring(0, maxLen) + '...';
  }

  // ============================================================
  // 持久化
  // ============================================================

  _loadMemory() {
    try {
      if (!fs.existsSync(MEMORY_DIR)) {
        fs.mkdirSync(MEMORY_DIR, { recursive: true });
        return;
      }

      if (fs.existsSync(REFLECTION_FILE)) {
        const data = JSON.parse(fs.readFileSync(REFLECTION_FILE, 'utf-8'));
        this.reflectionMemories = data.reflections || [];
      }

      if (fs.existsSync(OBSERVATION_FILE)) {
        const data = JSON.parse(fs.readFileSync(OBSERVATION_FILE, 'utf-8'));
        this.observations = data.observations || [];
      }

      if (fs.existsSync(PLAN_FILE)) {
        const data = JSON.parse(fs.readFileSync(PLAN_FILE, 'utf-8'));
        this.plans = data.plans || [];
      }
    } catch (e) {
      console.log('[Reflexion] Memory load failed:', e.message);
    }
  }

  _saveMemory() {
    try {
      if (!fs.existsSync(MEMORY_DIR)) {
        fs.mkdirSync(MEMORY_DIR, { recursive: true });
      }

      fs.writeFileSync(REFLECTION_FILE, JSON.stringify({
        reflections: this.reflectionMemories.slice(-this.maxReflections),
        updated: Date.now(),
      }, null, 2));

      fs.writeFileSync(OBSERVATION_FILE, JSON.stringify({
        observations: this.observations.slice(-100),
        updated: Date.now(),
      }, null, 2));

      fs.writeFileSync(PLAN_FILE, JSON.stringify({
        plans: this.plans.slice(-50),
        updated: Date.now(),
      }, null, 2));
    } catch (e) {
      console.log('[Reflexion] Memory save failed:', e.message);
    }
  }

  // ============================================================
  // 统计
  // ============================================================

  stats() {
    return {
      version: '11.7.1',
      reflections: this.reflectionMemories.length,
      observations: this.observations.length,
      trials: this.trialMemories.length,
      successRate: this._calculateSuccessRate(),
      pendingReflexion: !!this.pendingReflexion,
    };
  }

  _calculateSuccessRate() {
    if (this.trialMemories.length === 0) return null;
    const success = this.trialMemories.filter(t => t.success).length;
    return success / this.trialMemories.length;
  }

  reset() {
    this.trialMemories = [];
    this.reflectionMemories = [];
    this.observations = [];
    this.plans = [];
    this.stepCount = 0;
    this.pendingReflexion = null;
    this._saveMemory();
  }
}

// ============================================================
// v11.43.1 PAPER INJECTION — reflection-loop.js
// [4] GSAR (arXiv:2604.23366) | [9] EvoSkill (arXiv:2603.02766)
// ============================================================
const _p11 = require('./papers/v11_43_1_integration.js');

ReflectionLoop.prototype.gsar = _p11.GSARGroundingGate;
ReflectionLoop.prototype.evoskill = new _p11.EvoSkillDiscovery();

/**
 * GSAR-aware reflect — uses typed grounding to evaluate claims
 * before storing reflection. Falls back to standard reflect on error.
 */
ReflectionLoop.prototype.reflectWithGSAR = async function(options = {}) {
  try {
    const evidence = options.evidence || {};
    const claims = options.claims || [];
    if (claims.length > 0) {
      const gsr = _p11.GSARGroundingGate.evaluate(claims, evidence);
      options.gsarResult = gsr;
      if (gsr.decision === 'replan') {
        options.strategy = REFLEXION_STRATEGY.REFLEXION;
      }
    }
  } catch (e) {
    // GSAR evaluation is best-effort; fall through to standard reflect
  }
  return this.reflect(options);
};

/**
 * EvoSkill integration — analyze failures and propose new skills
 * Threshold: 3+ failures before proposing a new skill
 */
ReflectionLoop.prototype.evolveFromFailures = function(traces) {
  const failures = this.evoskill.analyzeFailures(traces);
  if (failures.length >= 3) {
    const skillName = this.evoskill.proposeSkill(failures);
    if (skillName) {
      console.log(`[EvoSkill] Proposed new skill: ${skillName} from ${failures.length} failures`);
    }
    return { failures, proposedSkill: skillName };
  }
  return { failures, proposedSkill: null };
};

module.exports = {
  ReflectionLoop,
  REFLEXION_STRATEGY,
  REFLECTION_TYPE,
};
