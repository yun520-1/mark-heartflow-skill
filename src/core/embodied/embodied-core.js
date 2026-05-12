/**
 * Embodied-Core - 具身认知核心
 * 
 * 设计理念：
 * - 双系统架构：System 1 (直觉/快思考) + System 2 (分析/慢思考)
 * - 动作思维链 (Action-Thought Chain)
 */

class EmbodiedCore {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    
    this.cognitiveState = {
      system: 'idle',
      activePlan: null,
      executionHistory: [],
      workingMemory: []
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
    
    console.log('[EmbodiedCore] 具身认知核心初始化');
  }

  loadExecutors() {
    return {
      SelfAgent: { type: 'agent', weight: 1.0 },
      MoodAgent: { type: 'agent', weight: 0.9 },
      FocusAgent: { type: 'agent', weight: 0.9 },
      ReflectionAgent: { type: 'agent', weight: 0.8 },
      'code-analysis': { type: 'tool', capability: 'analyze', weight: 1.0 },
      'code-generation': { type: 'tool', capability: 'generate', weight: 1.0 },
      'search': { type: 'tool', capability: 'search', weight: 0.8 }
    };
  }

  registerSensorAdapter(name, adapter) {
    this.sensorAdapters[name] = adapter;
    console.log(`[EmbodiedCore] 注册传感器: ${name}`);
  }

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
    console.log(`[EmbodiedCore] 认知规划: ${steps.length} 步思维链`);
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

  executionMapping(plan, context = {}) {
    this.cognitiveState.system = 'executing';
    
    const execution = {
      planId: plan.id,
      steps: [],
      startTime: Date.now(),
      context: { ...context, sensors: this.readSensors() }
    };
    
    for (const step of plan.steps) {
      const stepExecution = this.mapStepToAction(step, execution.context);
      execution.steps.push(stepExecution);
      
      this.cognitiveState.workingMemory.push({ step: step.index, result: stepExecution.result, timestamp: Date.now() });
      
      if (stepExecution.requiresAdaptation) {
        this.cognitiveState.system = 'adapting';
        execution.adaptation = this.adaptPlan(plan, stepExecution);
        this.cognitiveState.system = 'executing';
      }
    }
    
    execution.endTime = Date.now();
    execution.duration = execution.endTime - execution.startTime;
    this.cognitiveState.executionHistory.push(execution);
    this.cognitiveState.system = 'idle';
    
    console.log(`[EmbodiedCore] 执行映射: ${execution.steps.length} 步执行`);
    return execution;
  }

  readSensors() {
    const sensorData = {};
    for (const [name, adapter] of Object.entries(this.sensorAdapters)) {
      try { sensorData[name] = adapter.read?.() || adapter.getStatus?.() || null; }
      catch (e) { sensorData[name] = { error: e.message }; }
    }
    return sensorData;
  }

  mapStepToAction(step, context) {
    const executorName = step.executor;
    const executor = this.executors[executorName];
    
    const action = {
      stepIndex: step.index,
      stepType: step.type,
      executor: executorName,
      executorType: executor?.type || 'unknown',
      parameters: this.buildParameters(step, context),
      expectedDuration: step.estimatedDuration
    };
    
    action.result = this.simulateExecution(action, context);
    action.requiresAdaptation = this.checkAdaptationNeed(action.result, step);
    return action;
  }

  buildParameters(step, context) {
    return {
      task: step.description,
      context: { workingMemory: context.sensors, previousResults: this.cognitiveState.workingMemory.slice(-3) },
      constraints: { timeout: step.estimatedDuration, fallback: step.fallback }
    };
  }

  simulateExecution(action, context) {
    const mockResults = {
      observe: { observations: ['当前状态良好', '环境稳定'] },
      analyze: { analysis: '问题已识别', confidence: 0.85 },
      plan: { plan: '方案已制定', alternatives: 2 },
      decide: { decision: '选择方案A', reason: '最优' },
      execute: { outcome: '完成', success: true },
      reflect: { feedback: '执行顺利', improvements: [] },
      adapt: { adapted: true, changes: [] }
    };
    return { ...mockResults[action.stepType], timestamp: Date.now() };
  }

  checkAdaptationNeed(result, step) {
    if (result.success === false) return true;
    if (result.confidence && result.confidence < 0.6) return true;
    return false;
  }

  adaptPlan(plan, failedStep) {
    const adaptation = { originalStep: failedStep.stepIndex, reason: '执行结果不理想', modifications: [] };
    const newSteps = plan.steps.slice(failedStep.stepIndex);
    newSteps.unshift({ index: failedStep.stepIndex, type: 'adapt', description: '调整策略后重试', executor: 'SelfAgent' });
    adaptation.modifications = newSteps;
    console.log(`[EmbodiedCore] 计划调整: 步骤 ${failedStep.stepIndex} 需要重试`);
    return adaptation;
  }

  getStatus() {
    return {
      cognitiveState: this.cognitiveState.system,
      activePlan: this.cognitiveState.activePlan?.id || null,
      executionHistoryCount: this.cognitiveState.executionHistory.length,
      workingMemorySize: this.cognitiveState.workingMemory.length,
      registeredSensors: Object.keys(this.sensorAdapters),
      availableExecutors: Object.keys(this.executors)
    };
  }

  reset() {
    this.cognitiveState = { system: 'idle', activePlan: null, executionHistory: [], workingMemory: [] };
    console.log('[EmbodiedCore] 状态已重置');
    return { success: true };
  }
}

module.exports = { EmbodiedCore };