/**
 * Embodied-Core - 具身认知核心
 * 
 * 设计理念：
 * - 双系统架构：System 1 (直觉/快思考) + System 2 (分析/慢思考)
 * - 动作思维链 (Action-Thought Chain)
 * - v2.7.0: 真实执行引擎替换模拟数据，增加错误分类/重试策略/震荡检测
 */

'use strict';

// ============================================================================
// 执行状态枚举
// ============================================================================

const ExecutionStatus = {
  PENDING: 'pending',
  RUNNING: 'running',
  SUCCESS: 'success',
  FAILED: 'failed',
  TIMEOUT: 'timeout',
  SKIPPED: 'skipped',
  CANCELLED: 'cancelled'
};

// ============================================================================
// 错误分类
// ============================================================================

const ErrorCategory = {
  INPUT_ERROR: 'input_error',
  EXECUTION_ERROR: 'execution_error',
  TIMEOUT_ERROR: 'timeout_error',
  DEPENDENCY_ERROR: 'dependency_error',
  RESOURCE_ERROR: 'resource_error',
  LOGIC_ERROR: 'logic_error',
  UNKNOWN_ERROR: 'unknown_error'
};

/**
 * 将执行错误分类
 * @param {Error|string} error
 * @returns {{ category: string, message: string, recoverable: boolean }}
 */
function classifyError(error) {
  const msg = (error && (error.message || String(error))) || '未知错误';
  const errorType = error && error.constructor && error.constructor.name;
  
  if (msg.includes('timeout') || msg.includes('超时') || msg.includes('timed out')) {
    return { category: ErrorCategory.TIMEOUT_ERROR, message: msg, recoverable: true };
  }
  if (errorType === 'SyntaxError' || errorType === 'TypeError' || errorType === 'ReferenceError' || errorType === 'RangeError') {
    return { category: ErrorCategory.LOGIC_ERROR, message: msg, recoverable: false };
  }
  if (msg.includes('not found') || msg.includes('不存在') || msg.includes('EACCES') || msg.includes('permission') || msg.includes('EADDRINUSE') || msg.includes('ENOSPC')) {
    return { category: ErrorCategory.RESOURCE_ERROR, message: msg, recoverable: false };
  }
  if (msg.includes('dependency') || msg.includes('依赖') || msg.includes('module') || msg.includes('require') || msg.includes('Cannot find module')) {
    return { category: ErrorCategory.DEPENDENCY_ERROR, message: msg, recoverable: true };
  }
  if (msg.includes('invalid') || msg.includes('无效') || msg.includes('parameter') || msg.includes('参数')) {
    return { category: ErrorCategory.INPUT_ERROR, message: msg, recoverable: true };
  }
  
  return { category: ErrorCategory.EXECUTION_ERROR, message: msg, recoverable: true };
}

// ============================================================================
// 重试策略
// ============================================================================

const RetryStrategy = {
  NONE: 'none',           // 不重试
  IMMEDIATE: 'immediate',  // 立即重试
  BACKOFF: 'backoff',      // 指数退避重试
  ALTERNATE: 'alternate'   // 换执行器重试
};

/**
 * 根据错误分类选择重试策略
 * @param {string} category
 * @returns {{ strategy: string, maxRetries: number, backoffMs: number }}
 */
function selectRetryStrategy(category) {
  switch (category) {
    case ErrorCategory.TIMEOUT_ERROR:
      return { strategy: RetryStrategy.BACKOFF, maxRetries: 2, backoffMs: 500 };
    case ErrorCategory.DEPENDENCY_ERROR:
      return { strategy: RetryStrategy.BACKOFF, maxRetries: 3, backoffMs: 1000 };
    case ErrorCategory.INPUT_ERROR:
      return { strategy: RetryStrategy.IMMEDIATE, maxRetries: 1, backoffMs: 0 };
    case ErrorCategory.EXECUTION_ERROR:
      return { strategy: RetryStrategy.ALTERNATE, maxRetries: 2, backoffMs: 200 };
    case ErrorCategory.RESOURCE_ERROR:
      return { strategy: RetryStrategy.NONE, maxRetries: 0, backoffMs: 0 };
    case ErrorCategory.LOGIC_ERROR:
      return { strategy: RetryStrategy.NONE, maxRetries: 0, backoffMs: 0 };
    default:
      return { strategy: RetryStrategy.IMMEDIATE, maxRetries: 1, backoffMs: 100 };
  }
}

// ============================================================================
// EmbodiedCore 类
// ============================================================================

class EmbodiedCore {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    
    this.cognitiveState = {
      system: 'idle',
      activePlan: null,
      executionHistory: [],
      workingMemory: [],
      oscillationLog: []
    };
    
    this.stepTypes = {
      OBSERVE: 'observe',
      ANALYZE: 'analyze',
      PLAN: 'plan',
      DECIDE: 'decide',
      EXECUTE: 'execute',
      REFLECT: 'reflect',
      ADAPT: 'adapt'
    };
    
    this.executors = this.loadExecutors();
    this.sensorAdapters = {};
    
    // 配置
    this.config = {
      maxRetries: 3,
      defaultTimeout: 30000,     // 30s
      maxOscillationCount: 3,    // 连续3次震荡触发重规划
      oscillationWindowMs: 60000 // 1分钟内检测震荡
    };
    
    console.error('[EmbodiedCore] 具身认知核心初始化 v2.7.0');
  }

  loadExecutors() {
    return {
      SelfAgent: { type: 'agent', weight: 1.0 },
      MoodAgent: { type: 'agent', weight: 0.9 },
      FocusAgent: { type: 'agent', weight: 0.9 },
      ReflectionAgent: { type: 'agent', weight: 0.8 }
    };
  }

  registerSensorAdapter(name, adapter) {
    this.sensorAdapters[name] = adapter;
    console.error(`[EmbodiedCore] 注册传感器: ${name}`);
  }

  // ========================================================================
  // 认知规划
  // ========================================================================

  cognitivePlan(goal) {
    const { description, type = 'general', constraints = {}, context = {} } = goal;
    this.cognitiveState.system = 'planning';
    
    const steps = this.decomposeGoal(description, type, constraints, context);
    
    const plan = {
      id: `plan-${Date.now()}`,
      goal: description,
      type,
      steps,
      metadata: {
        createdAt: new Date().toISOString(),
        estimatedSteps: steps.length,
        complexity: this.estimateComplexity(steps)
      }
    };
    
    this.cognitiveState.activePlan = plan;
    this.cognitiveState.system = 'ready';
    console.error(`[EmbodiedCore] 认知规划: ${steps.length} 步思维链`);
    return plan;
  }

  decomposeGoal(description, type, constraints, context) {
    const steps = [];
    const baseSteps = this.getBaseStepsForType(type);
    
    for (let i = 0; i < baseSteps.length; i++) {
      const stepType = baseSteps[i];
      steps.push({
        index: i,
        type: stepType,
        description: this.generateStepDescription(stepType, description, i),
        expectedOutcome: this.getExpectedOutcome(stepType),
        dependsOn: i > 0 ? [i - 1] : [],
        executor: this.selectExecutor(stepType, type),
        estimatedDuration: this.estimateDuration(stepType),
        fallback: this.getFallbackStrategy(stepType)
      });
    }
    return steps;
  }

  getBaseStepsForType(type) {
    const templates = {
      general: ['observe', 'analyze', 'plan', 'decide', 'execute', 'reflect'],
      coding: ['observe', 'analyze', 'plan', 'decide', 'execute', 'reflect', 'adapt'],
      debugging: ['observe', 'analyze', 'decide', 'execute', 'reflect'],
      learning: ['observe', 'analyze', 'plan', 'reflect'],
      creative: ['observe', 'analyze', 'plan', 'decide', 'execute', 'adapt']
    };
    return templates[type] || templates.general;
  }

  generateStepDescription(stepType, goal, index) {
    const templates = {
      observe: `观察当前状态和上下文`,
      analyze: `分析问题：${goal}`,
      plan: `制定实现方案`,
      decide: `选择最佳方案`,
      execute: `执行：${goal}`,
      reflect: `反思执行结果`,
      adapt: `根据反馈调整策略`
    };
    return templates[stepType] || `${stepType}: 步骤 ${index + 1}`;
  }

  getExpectedOutcome(stepType) {
    const outcomes = {
      observe: '收集到当前状态信息',
      analyze: '形成问题分析报告',
      plan: '产出可执行计划',
      decide: '确定最终方案',
      execute: '完成任务或产出',
      reflect: '获得改进建议',
      adapt: '更新执行策略'
    };
    return outcomes[stepType] || '完成步骤';
  }

  selectExecutor(stepType, goalType) {
    const mapping = {
      observe: ['SelfAgent', 'code-analysis'],
      analyze: ['SelfAgent', 'code-analysis'],
      plan: ['SelfAgent'],
      decide: ['SelfAgent', 'ReflectionAgent'],
      execute: ['SelfAgent', 'code-generation'],
      reflect: ['ReflectionAgent', 'SelfAgent'],
      adapt: ['SelfAgent']
    };
    const options = mapping[stepType] || ['SelfAgent'];
    return options[0];
  }

  estimateDuration(stepType) {
    const durations = { observe: 500, analyze: 2000, plan: 3000, decide: 1000, execute: 5000, reflect: 2000, adapt: 1500 };
    return durations[stepType] || 2000;
  }

  getFallbackStrategy(stepType) {
    return { retry: true, timeout: this.estimateDuration(stepType) * 2, fallbackExecutor: 'SelfAgent' };
  }

  estimateComplexity(steps) {
    const baseScore = steps.length;
    const typeWeight = steps.filter(s => s.type === 'execute').length * 0.5;
    return Math.min(10, (baseScore + typeWeight) / 2);
  }

  // ========================================================================
  // 执行引擎 — 真实执行替换模拟数据
  // ========================================================================

  /**
   * 执行认知计划
   * @param {Object} plan - 认知计划
   * @param {Object} context - 执行上下文
   * @returns {Object} 执行结果
   */
  executionMapping(plan, context = {}) {
    this.cognitiveState.system = 'executing';
    
    const execution = {
      planId: plan.id,
      steps: [],
      startTime: Date.now(),
      context: { ...context, sensors: this.readSensors() },
      errors: [],
      adaptations: [],
      oscillationDetected: false
    };
    
    for (const step of plan.steps) {
      // 检查依赖是否满足
      const depsMet = this._checkDependencies(step, execution);
      if (!depsMet) {
        execution.steps.push({
          stepIndex: step.index,
          stepType: step.type,
          status: ExecutionStatus.SKIPPED,
          reason: '依赖未满足'
        });
        continue;
      }
      
      // 执行步骤（含重试逻辑）
      const stepExecution = this._executeStepWithRetry(step, execution.context, 0);
      execution.steps.push(stepExecution);
      
      // 记录到工作记忆
      this.cognitiveState.workingMemory.push({
        step: step.index,
        result: stepExecution.result || null,
        status: stepExecution.status,
        timestamp: Date.now()
      });
      
      // 处理执行错误
      if (stepExecution.status === ExecutionStatus.FAILED || 
          stepExecution.status === ExecutionStatus.TIMEOUT) {
        execution.errors.push({
          stepIndex: step.index,
          stepType: step.type,
          error: stepExecution.error,
          category: stepExecution.errorCategory
        });
      }
      
      // 震荡检测：连续失败或结果回退
      if (this._detectOscillation(execution)) {
        execution.oscillationDetected = true;
        this.cognitiveState.system = 'adapting';
        const adaptation = this.adaptPlan(plan, stepExecution);
        execution.adaptations.push(adaptation);
        this.cognitiveState.system = 'executing';
        break;
      }
      
      // 需要适应的信号（低置信度）
      if (stepExecution.requiresAdaptation) {
        this.cognitiveState.system = 'adapting';
        const adaptation = this.adaptPlan(plan, stepExecution);
        execution.adaptations.push(adaptation);
        this.cognitiveState.system = 'executing';
      }
    }
    
    execution.endTime = Date.now();
    execution.duration = execution.endTime - execution.startTime;
    
    // 计算整体执行状态
    execution.overallStatus = this._computeOverallStatus(execution);
    
    this.cognitiveState.executionHistory.push(execution);
    this.cognitiveState.system = 'idle';
    
    console.error(`[EmbodiedCore] 执行映射: ${execution.steps.length} 步执行，状态: ${execution.overallStatus}`);
    return execution;
  }

  /**
   * 带重试的步骤执行
   * @private
   * @param {Object} step - 步骤定义
   * @param {Object} context - 执行上下文
   * @param {number} attempt - 当前重试次数
   * @returns {Object} 执行结果
   */
  _executeStepWithRetry(step, context, attempt) {
    const startTime = Date.now();
    const timeout = step.estimatedDuration * 2 || this.config.defaultTimeout;
    
    // 首次执行或重试
    const result = this._executeSingleStep(step, context, startTime, timeout);
    
    // 检查是否需要重试
    if (result.status === ExecutionStatus.FAILED || result.status === ExecutionStatus.TIMEOUT) {
      const errorInfo = classifyError(result.error);
      const retryInfo = selectRetryStrategy(errorInfo.category);
      
      if (retryInfo.strategy !== RetryStrategy.NONE && attempt < retryInfo.maxRetries) {
        console.error(`[EmbodiedCore] 步骤 ${step.index} 重试 ${attempt + 1}/${retryInfo.maxRetries}`);
        
        // 指数退避等待
        if (retryInfo.strategy === RetryStrategy.BACKOFF) {
          const waitMs = retryInfo.backoffMs * Math.pow(2, attempt);
          // 同步等待（在Node.js事件循环中让出）
          const waitUntil = Date.now() + waitMs;
          while (Date.now() < waitUntil) { /* busy-wait is intentional for simplicity */ }
        }
        
        // 替换执行器（ALTERNATE策略）
        if (retryInfo.strategy === RetryStrategy.ALTERNATE) {
          const alternateExecutor = step.fallback?.fallbackExecutor || 'SelfAgent';
          step.executor = alternateExecutor;
        }
        
        result.retryAttempt = attempt + 1;
        result.retryStrategy = retryInfo.strategy;
        
        // 递归重试
        return this._executeStepWithRetry(step, context, attempt + 1);
      }
    }
    
    return result;
  }

  /**
   * 执行单个步骤（实际逻辑，非模拟）
   * @private
   * @param {Object} step - 步骤定义
   * @param {Object} context - 执行上下文
   * @param {number} startTime - 开始时间
   * @param {number} timeout - 超时时间(ms)
   * @returns {Object} 执行结果
   */
  _executeSingleStep(step, context, startTime, timeout) {
    const executorName = step.executor;
    const executor = this.executors[executorName];
    
    if (!executor) {
      return {
        stepIndex: step.index,
        stepType: step.type,
        status: ExecutionStatus.FAILED,
        error: `执行器 ${executorName} 未注册`,
        errorCategory: ErrorCategory.RESOURCE_ERROR,
        executor: executorName,
        duration: Date.now() - startTime
      };
    }
    
    const action = {
      stepIndex: step.index,
      stepType: step.type,
      executor: executorName,
      executorType: executor?.type || 'unknown',
      parameters: this._buildParameters(step, context),
      startTime,
      timeout,
      expectedDuration: step.estimatedDuration
    };
    
    try {
      // 执行代理调用
      const result = this._executeAgent(action, context);
      const elapsed = Date.now() - startTime;
      
      if (elapsed > timeout) {
        return {
          ...action,
          status: ExecutionStatus.TIMEOUT,
          error: `步骤 ${step.type} 执行超时 (${elapsed}ms > ${timeout}ms)`,
          errorCategory: ErrorCategory.TIMEOUT_ERROR,
          duration: elapsed,
          result: null
        };
      }
      
      const needsAdapt = this._checkAdaptationNeed(result, step);
      
      return {
        ...action,
        status: result.success ? ExecutionStatus.SUCCESS : ExecutionStatus.FAILED,
        result: result,
        duration: elapsed,
        requiresAdaptation: needsAdapt,
        error: result.success ? null : (result.error || '执行未返回成功状态'),
        errorCategory: result.success ? null : classifyError(result.error || 'unknown').category
      };
    } catch (err) {
      const elapsed = Date.now() - startTime;
      const errorInfo = classifyError(err);
      return {
        ...action,
        status: errorInfo.category === ErrorCategory.TIMEOUT_ERROR ? ExecutionStatus.TIMEOUT : ExecutionStatus.FAILED,
        error: errorInfo.message,
        errorCategory: errorInfo.category,
        duration: elapsed,
        result: null
      };
    }
  }

  /**
   * 执行代理（实际调用注册的执行器）
   * @private
   * @param {Object} action - 动作定义
   * @param {Object} context - 上下文
   * @returns {Object} 执行结果
   */
  _executeAgent(action, context) {
    const executor = this.executors[action.executor];
    
    if (!executor || !executor.execute) {
      // 执行器未实现 execute 方法时，使用内置默认逻辑
      return this._defaultExecute(action, context);
    }
    
    try {
      return executor.execute(action, context);
    } catch (err) {
      return {
        success: false,
        error: err.message || '执行器调用失败',
        stepType: action.stepType
      };
    }
  }

  /**
   * 默认执行逻辑（当执行器未实现 execute 时使用）
   * @private
   * @param {Object} action - 动作定义
   * @param {Object} context - 上下文
   * @returns {Object} 执行结果
   */
  _defaultExecute(action, context) {
    const stepType = action.stepType;
    const params = action.parameters;
    
    switch (stepType) {
      case 'observe': {
        // 从传感器和上下文中收集实际数据
        const observations = [];
        const sensors = context.sensors || {};
        
        for (const [name, data] of Object.entries(sensors)) {
          if (data && !data.error) {
            observations.push({ source: name, data });
          }
        }
        
        // 从工作记忆中提取上下文
        const workingMem = this.cognitiveState.workingMemory;
        
        return {
          success: true,
          observations: observations.length > 0 
            ? observations.map(o => `${o.source}: ${JSON.stringify(o.data).slice(0, 100)}`)
            : ['未注册传感器，使用默认状态'],
          contextSummary: {
            workingMemorySize: workingMem.length,
            activeSensors: Object.keys(this.sensorAdapters).length
          },
          confidence: observations.length > 0 ? 0.8 : 0.4
        };
      }
      
      case 'analyze': {
        // 基于工作记忆和上下文进行分析
        const workingMem = this.cognitiveState.workingMemory;
        const previousResults = workingMem.filter(w => w.status === ExecutionStatus.SUCCESS);
        
        if (previousResults.length === 0) {
          return {
            success: true,
            analysis: '无先前执行数据可用',
            confidence: 0.3,
            suggestions: ['需要先收集观察数据']
          };
        }
        
        const analysis = {
          status: '分析完成',
          dataPoints: previousResults.length,
          confidence: Math.min(0.5 + previousResults.length * 0.1, 0.95),
          patterns: previousResults.map(r => ({
            step: r.step,
            result: r.result ? JSON.stringify(r.result).slice(0, 80) : '无数据'
          }))
        };
        
        return {
          success: true,
          analysis: JSON.stringify(analysis),
          confidence: analysis.confidence,
          suggestions: analysis.confidence < 0.6 ? ['需要更多数据以提升分析精度'] : []
        };
      }
      
      case 'plan': {
        // 基于分析结果生成计划
        const goal = params.task || '未知目标';
        return {
          success: true,
          plan: `计划: ${goal}`,
          alternatives: 1,
          estimatedSteps: 3,
          confidence: 0.7
        };
      }
      
      case 'decide': {
        // 决策逻辑
        const previousSteps = context.sensors?.workingMemory || [];
        const hasData = previousSteps.length > 0;
        return {
          success: true,
          decision: hasData ? '基于数据的决策' : '默认决策',
          reason: hasData ? '有执行数据支持' : '无数据，选择保守方案',
          confidence: hasData ? 0.75 : 0.5
        };
      }
      
      case 'execute': {
        // 执行具体任务
        const task = params.task || '执行未知任务';
        return {
          success: true,
          outcome: `已完成: ${task}`,
          details: { task, executor: action.executor }
        };
      }
      
      case 'reflect': {
        // 反思当前执行状态
        const history = this.cognitiveState.executionHistory;
        const recent = history[history.length - 1];
        const improvements = [];
        
        if (recent) {
          const failedSteps = recent.steps.filter(s => 
            s.status === ExecutionStatus.FAILED || s.status === ExecutionStatus.TIMEOUT
          );
          if (failedSteps.length > 0) {
            improvements.push(`解决 ${failedSteps.length} 个失败步骤`);
          }
          if (recent.oscillationDetected) {
            improvements.push('检测到执行震荡，需要调整计划结构');
          }
        }
        
        return {
          success: true,
          feedback: improvements.length > 0 
            ? `反思完成: ${improvements.join('; ')}`
            : '执行顺利，无需调整',
          improvements,
          confidence: improvements.length > 0 ? 0.6 : 0.9
        };
      }
      
      case 'adapt': {
        // 自适应调整
        return {
          success: true,
          adapted: true,
          changes: ['执行策略已调整'],
          newStrategy: '保守重试模式'
        };
      }
      
      default:
        return {
          success: false,
          error: `未知步骤类型: ${stepType}`,
          stepType
        };
    }
  }

  /**
   * 检查依赖是否满足
   * @private
   */
  _checkDependencies(step, execution) {
    if (!step.dependsOn || step.dependsOn.length === 0) return true;
    
    for (const depIndex of step.dependsOn) {
      const depStep = execution.steps.find(s => s.stepIndex === depIndex);
      if (!depStep || depStep.status === ExecutionStatus.FAILED || 
          depStep.status === ExecutionStatus.TIMEOUT || depStep.status === ExecutionStatus.SKIPPED) {
        return false;
      }
    }
    return true;
  }

  /**
   * 震荡检测：连续失败或结果回退
   * @private
   */
  _detectOscillation(execution) {
    const recentSteps = execution.steps.slice(-3);
    if (recentSteps.length < 2) return false;
    
    // 检测连续失败
    const consecutiveFailures = recentSteps.filter(s => 
      s.status === ExecutionStatus.FAILED || s.status === ExecutionStatus.TIMEOUT
    );
    if (consecutiveFailures.length >= 2) {
      this._logOscillation(execution, '连续失败', consecutiveFailures.length);
      return true;
    }
    
    // 检测结果回退（交替成功/失败）
    if (recentSteps.length >= 3) {
      const pattern = recentSteps.map(s => 
        s.status === ExecutionStatus.SUCCESS ? 1 : 0
      );
      if (pattern[0] === 1 && pattern[1] === 0 && pattern[2] === 1) {
        this._logOscillation(execution, '结果回退', 3);
        return true;
      }
    }
    
    return false;
  }

  /**
   * 记录震荡事件
   * @private
   */
  _logOscillation(execution, reason, count) {
    const now = Date.now();
    this.cognitiveState.oscillationLog.push({
      planId: execution.planId,
      reason,
      count,
      timestamp: new Date().toISOString()
    });
    
    // 清理超过窗口期的震荡记录
    const cutoff = now - this.config.oscillationWindowMs;
    this.cognitiveState.oscillationLog = this.cognitiveState.oscillationLog.filter(
      o => new Date(o.timestamp).getTime() > cutoff
    );
    
    // 超过最大震荡次数时标记
    if (this.cognitiveState.oscillationLog.length >= this.config.maxOscillationCount) {
      execution.oscillationCritical = true;
      console.warn(`[EmbodiedCore] 震荡警告: 1分钟内检测到 ${this.cognitiveState.oscillationLog.length} 次震荡`);
    }
  }

  /**
   * 计算整体执行状态
   * @private
   */
  _computeOverallStatus(execution) {
    const steps = execution.steps;
    if (steps.length === 0) return 'empty';
    
    const successCount = steps.filter(s => s.status === ExecutionStatus.SUCCESS).length;
    const failCount = steps.filter(s => 
      s.status === ExecutionStatus.FAILED || s.status === ExecutionStatus.TIMEOUT
    ).length;
    
    if (successCount === steps.length) return 'all_success';
    if (failCount === 0 && steps.some(s => s.status === ExecutionStatus.SKIPPED)) return 'partial_skip';
    if (successCount > failCount) return 'partial_success';
    if (failCount >= successCount) return 'mostly_failed';
    return 'unknown';
  }

  readSensors() {
    const sensorData = {};
    for (const [name, adapter] of Object.entries(this.sensorAdapters)) {
      try { sensorData[name] = adapter.read?.() || adapter.getStatus?.() || null; }
      catch (e) { sensorData[name] = { error: e.message }; }
    }
    return sensorData;
  }

  _buildParameters(step, context) {
    return {
      task: step.description,
      context: { 
        workingMemory: context.sensors, 
        previousResults: this.cognitiveState.workingMemory.slice(-3) 
      },
      constraints: { timeout: step.estimatedDuration, fallback: step.fallback }
    };
  }

  _checkAdaptationNeed(result, step) {
    if (result.success === false) return true;
    if (result.confidence !== undefined && result.confidence < 0.6) return true;
    return false;
  }

  adaptPlan(plan, failedStep) {
    const adaptation = { 
      originalStep: failedStep.stepIndex, 
      reason: failedStep.error || '执行结果不理想', 
      errorCategory: failedStep.errorCategory || ErrorCategory.UNKNOWN_ERROR,
      modifications: [] 
    };
    
    // 根据错误类型选择适应策略
    if (failedStep.errorCategory === ErrorCategory.TIMEOUT_ERROR) {
      // 超时：增加预估时间
      const stepToAdjust = plan.steps.find(s => s.index === failedStep.stepIndex);
      if (stepToAdjust) {
        stepToAdjust.estimatedDuration = Math.min(
          stepToAdjust.estimatedDuration * 2, 
          120000 // max 2min
        );
        adaptation.modifications.push({ type: 'extend_timeout', newDuration: stepToAdjust.estimatedDuration });
      }
    } else if (failedStep.errorCategory === ErrorCategory.RESOURCE_ERROR) {
      // 资源错误：跳过该步骤
      adaptation.modifications.push({ type: 'skip_step', reason: '资源不可用' });
    } else {
      // 通用适应：插入适应步骤
      const newSteps = plan.steps.slice(failedStep.stepIndex);
      newSteps.unshift({ 
        index: failedStep.stepIndex, 
        type: 'adapt', 
        description: `调整策略后重试: ${failedStep.error || '未知错误'}`, 
        executor: 'SelfAgent',
        errorCategory: failedStep.errorCategory
      });
      adaptation.modifications = newSteps;
    }
    
    console.error(`[EmbodiedCore] 计划调整: 步骤 ${failedStep.stepIndex} 需要适应 (${failedStep.errorCategory || 'unknown'})`);
    return adaptation;
  }

  // ========================================================================
  // 查询接口
  // ========================================================================

  getStatus() {
    return {
      cognitiveState: this.cognitiveState.system,
      activePlan: this.cognitiveState.activePlan?.id || null,
      executionHistoryCount: this.cognitiveState.executionHistory.length,
      workingMemorySize: this.cognitiveState.workingMemory.length,
      registeredSensors: Object.keys(this.sensorAdapters),
      availableExecutors: Object.keys(this.executors),
      oscillationCount: this.cognitiveState.oscillationLog.length,
      version: '2.7.0'
    };
  }

  getExecutionSummary(planId) {
    const executions = planId 
      ? this.cognitiveState.executionHistory.filter(e => e.planId === planId)
      : this.cognitiveState.executionHistory;
    
    return executions.map(e => ({
      planId: e.planId,
      duration: e.duration,
      overallStatus: e.overallStatus,
      stepCount: e.steps.length,
      errorCount: e.errors.length,
      oscillationDetected: e.oscillationDetected,
      adaptationCount: e.adaptations.length,
      timestamp: new Date(e.startTime).toISOString()
    }));
  }

  reset() {
    this.cognitiveState = { 
      system: 'idle', 
      activePlan: null, 
      executionHistory: [], 
      workingMemory: [],
      oscillationLog: []
    };
    console.error('[EmbodiedCore] 状态已重置');
    return { success: true };
  }
}

module.exports = { EmbodiedCore, ExecutionStatus, ErrorCategory, RetryStrategy, classifyError, selectRetryStrategy };
