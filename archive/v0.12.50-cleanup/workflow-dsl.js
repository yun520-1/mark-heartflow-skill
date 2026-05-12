/**
 * HeartFlow Workflow DSL v11.7.6
 * 
 * 整合:
 *   - VoltAgent Workflow Engine ⭐8617 - 声明式工作流
 *   - LangChain Sequential/Parallel patterns
 * 
 * 核心概念 (VoltAgent 风格):
 *   1. createWorkflow - 创建工作流
 *   2. andThen / andAll / andRace - 步骤组合
 *   3. andBranch - 条件分支
 *   4. andForEach / andMap - 批量处理
 *   5. andDoWhile / andDoUntil - 循环
 *   6. Hooks - 生命周期钩子
 *   7. State - 状态管理
 * 
 * 使用示例:
 *   const workflow = createWorkflow('myFlow')
 *     .andThen(analyzeStep)
 *     .andAll(writeStep, reviewStep)
 *     .andBranch({
 *       condition: (ctx) => ctx.result.complex,
 *       then: deepDiveStep,
 *       else: quickAnswerStep,
 *     })
 *     .build();
 */

// ============================================================
// 步骤定义
// ============================================================

class WorkflowStep {
  constructor(config) {
    this.id = config.id || `step_${Date.now()}`;
    this.name = config.name || 'UnnamedStep';
    this.fn = config.fn;
    this.type = config.type || 'action'; // action, agent, workflow, guardrail
    this.retry = config.retry || null;
    this.timeout = config.timeout || 60000;
    this.metadata = config.metadata || {};
  }

  async execute(context, runtime) {
    const startTime = Date.now();
    
    try {
      runtime.emit('step:start', { step: this, context });
      
      let result;
      if (this.retry) {
        result = await this._executeWithRetry(context, runtime);
      } else {
        result = await this._executeFn(context, runtime);
      }
      
      const elapsed = Date.now() - startTime;
      const stepResult = {
        stepId: this.id,
        stepName: this.name,
        result,
        elapsed,
        success: true,
      };
      
      runtime.emit('step:complete', { step: this, result: stepResult, context });
      return stepResult;
      
    } catch (e) {
      const elapsed = Date.now() - startTime;
      const stepResult = {
        stepId: this.id,
        stepName: this.name,
        error: e.message,
        elapsed,
        success: false,
      };
      
      runtime.emit('step:error', { step: this, error: e, result: stepResult, context });
      throw e;
    }
  }

  async _executeFn(context, runtime) {
    if (typeof this.fn === 'function') {
      return await this.fn(context, runtime);
    }
    return null;
  }

  async _executeWithRetry(context, runtime) {
    const { maxAttempts = 3, delay = 1000, backoff = 2 } = this.retry;
    let lastError;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await this._executeFn(context, runtime);
      } catch (e) {
        lastError = e;
        runtime.emit('step:retry', { step: this, attempt, maxAttempts, error: e });
        
        if (attempt < maxAttempts) {
          await this._sleep(delay * Math.pow(backoff, attempt - 1));
        }
      }
    }
    
    throw lastError;
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================
// 工作流运行时
// ============================================================

class WorkflowRuntime {
  constructor(config = {}) {
    this.name = config.name || 'WorkflowRuntime';
    this.state = config.initialState || {};
    this.steps = [];
    this.hooks = new WorkflowHooks();
    this.history = [];
    this.aborted = false;
    this.suspended = false;
    
    // 事件监听器
    this._listeners = new Map();
  }

  /**
   * 添加步骤
   */
  addStep(step) {
    this.steps.push(step);
    return this;
  }

  /**
   * 执行工作流
   */
  async execute(context = {}) {
    const runContext = { ...this.state, ...context, runtime: this };
    this.history = [];
    this.aborted = false;
    
    this.emit('workflow:start', { context: runContext });
    
    for (let i = 0; i < this.steps.length; i++) {
      if (this.aborted) break;
      if (this.suspended) {
        await this._waitForResume();
      }
      
      const step = this.steps[i];
      
      try {
        const result = await step.execute(runContext, this);
        this.history.push(result);
        runContext[`_${step.id}_result`] = result.result;
        runContext.lastResult = result.result;
        runContext.stepResults = this.history;
        
      } catch (e) {
        const errorResult = {
          stepId: step.id,
          stepName: step.name,
          error: e.message,
          success: false,
        };
        this.history.push(errorResult);
        
        this.emit('workflow:error', { step, error: e, context: runContext });
        
        if (!this.hooks.onError(step, e, runContext)) {
          throw e;
        }
      }
    }
    
    this.emit('workflow:complete', { context: runContext, history: this.history });
    
    return {
      success: !this.aborted,
      state: this.state,
      history: this.history,
      context: runContext,
    };
  }

  /**
   * 中止工作流
   */
  abort() {
    this.aborted = true;
    this.emit('workflow:abort', { history: this.history });
  }

  /**
   * 暂停工作流
   */
  suspend() {
    this.suspended = true;
    this.emit('workflow:suspend', {});
  }

  /**
   * 恢复工作流
   */
  resume() {
    this.suspended = false;
    this.emit('workflow:resume', {});
  }

  _waitForResume() {
    return new Promise(resolve => {
      const check = () => {
        if (!this.suspended) {
          resolve();
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  }

  // 状态更新
  updateState(updates) {
    this.state = { ...this.state, ...updates };
    return this;
  }

  // 事件系统
  on(event, handler) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, []);
    }
    this._listeners.get(event).push(handler);
    return this;
  }

  emit(event, data) {
    const handlers = this._listeners.get(event) || [];
    handlers.forEach(h => h(data));
    this.hooks.emit(event, data);
  }

  stats() {
    return {
      name: this.name,
      totalSteps: this.steps.length,
      completedSteps: this.history.filter(h => h.success).length,
      failedSteps: this.history.filter(h => !h.success).length,
      totalElapsed: this.history.reduce((sum, h) => sum + (h.elapsed || 0), 0),
    };
  }
}

// ============================================================
// 工作流钩子
// ============================================================

class WorkflowHooks {
  constructor() {
    this.handlers = {
      'workflow:start': [],
      'workflow:complete': [],
      'workflow:error': [],
      'workflow:abort': [],
      'workflow:suspend': [],
      'workflow:resume': [],
      'step:start': [],
      'step:complete': [],
      'step:error': [],
      'step:retry': [],
    };
  }

  on(event, handler) {
    if (this.handlers[event]) {
      this.handlers[event].push(handler);
    }
    return this;
  }

  emit(event, data) {
    const handlers = this.handlers[event] || [];
    handlers.forEach(h => {
      try {
        h(data);
      } catch (e) {
        console.error(`Hook error in ${event}:`, e.message);
      }
    });
  }

  onError(step, error, context) {
    // 返回 true 表示继续执行，false 表示停止
    return false;
  }
}

// ============================================================
// DSL 辅助函数
// ============================================================

const Steps = {
  /**
   * 创建动作步骤
   */
  action(name, fn, options = {}) {
    return new WorkflowStep({ name, fn, type: 'action', ...options });
  },

  /**
   * 创建代理步骤
   */
  agent(name, agentFn, options = {}) {
    return new WorkflowStep({ name, fn: agentFn, type: 'agent', ...options });
  },

  /**
   * 睡眠步骤
   */
  sleep(ms, name = 'sleep') {
    return new WorkflowStep({
      name,
      fn: async () => {
        await new Promise(r => setTimeout(r, ms));
        return { slept: ms };
      },
      type: 'utility',
    });
  },

  /**
   * 验证步骤 (guardrail)
   */
  guardrail(name, validateFn, options = {}) {
    return new WorkflowStep({
      name,
      fn: async (ctx) => {
        const result = await validateFn(ctx.input || ctx.lastInput, ctx);
        if (result && result.isBlocked?.()) {
          throw new Error(`Guardrail blocked: ${result.message}`);
        }
        return result;
      },
      type: 'guardrail',
      ...options,
    });
  },

  /**
   * Tap - 执行副作用，保留原始结果
   */
  tap(name, fn) {
    return new WorkflowStep({
      name,
      fn: async (ctx, runtime) => {
        const lastResult = ctx.lastResult;
        await fn(ctx, runtime);
        return lastResult; // 返回原始结果，不改变流
      },
      type: 'utility',
    });
  },

  /**
   * Map - 对数组每个元素执行步骤
   */
  map(name, itemsPath, stepFn, options = {}) {
    return new WorkflowStep({
      name,
      fn: async (ctx) => {
        const items = ctx[itemsPath] || [];
        const { concurrency = 1 } = options;
        const results = [];
        
        if (concurrency === 1) {
          for (const item of items) {
            results.push(await stepFn(item, ctx));
          }
        } else {
          // 并发执行
          const chunks = [];
          for (let i = 0; i < items.length; i += concurrency) {
            chunks.push(items.slice(i, i + concurrency));
          }
          for (const chunk of chunks) {
            const chunkResults = await Promise.all(
              chunk.map(item => stepFn(item, ctx))
            );
            results.push(...chunkResults);
          }
        }
        
        return results;
      },
      type: 'action',
      ...options,
    });
  },

  /**
   * Branch - 条件分支
   */
  branch(name, config) {
    const { condition, then: thenSteps, else: elseSteps = [] } = config;
    
    return new WorkflowStep({
      name,
      fn: async (ctx) => {
        const shouldBranch = condition(ctx);
        
        if (shouldBranch) {
          return await this._executeSteps(thenSteps, ctx);
        } else if (elseSteps.length > 0) {
          return await this._executeSteps(elseSteps, ctx);
        }
        
        return { branch: 'else', skipped: true };
      },
      type: 'control',
    });
  },

  /**
   * Race - 谁先完成谁赢
   */
  race(name, steps, options = {}) {
    const { timeout = 30000 } = options;
    
    return new WorkflowStep({
      name,
      fn: async (ctx, runtime) => {
        const promises = steps.map((step, i) => 
          step.execute(ctx, runtime).then(r => ({ ...r, index: i }))
        );
        
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Race timeout')), timeout)
        );
        
        const winner = await Promise.race([...promises, timeoutPromise]);
        return { winner: winner.index, result: winner, allResults: this.history };
      },
      type: 'control',
    });
  },

  /**
   * All - 全部完成
   */
  all(name, steps, options = {}) {
    const { continueOnError = false } = options;
    
    return new WorkflowStep({
      name,
      fn: async (ctx, runtime) => {
        try {
          const results = await Promise.all(
            steps.map(s => s.execute(ctx, runtime))
          );
          return results;
        } catch (e) {
          if (continueOnError) {
            return { partial: true, error: e.message };
          }
          throw e;
        }
      },
      type: 'control',
    });
  },

  /**
   * Do While - 条件循环
   */
  doWhile(name, config) {
    const { condition, body, maxIterations = 100 } = config;
    
    return new WorkflowStep({
      name,
      fn: async (ctx, runtime) => {
        let iterations = 0;
        const results = [];
        
        while (condition(ctx) && iterations < maxIterations) {
          const result = await this._executeSteps(body, ctx);
          results.push(result);
          iterations++;
        }
        
        return { iterations, results, maxReached: iterations >= maxIterations };
      },
      type: 'control',
    });
  },

  /**
   * Do Until - 直到条件满足
   */
  doUntil(name, config) {
    const { until, body, maxIterations = 100 } = config;
    
    return this.doWhile(name, {
      condition: (ctx) => !until(ctx),
      body,
      maxIterations,
    });
  },

  _executeSteps(steps, ctx) {
    if (!Array.isArray(steps)) steps = [steps];
    if (steps.length === 0) return null;
    if (steps.length === 1) return steps[0].fn?.(ctx) || null;
    
    // 顺序执行
    let result = null;
    for (const step of steps) {
      result = step.fn?.(ctx) || null;
    }
    return result;
  },
};

// ============================================================
// 工作流构建器
// ============================================================

class WorkflowBuilder {
  constructor(name = 'Workflow') {
    this.name = name;
    this._steps = [];
    this._hooks = new WorkflowHooks();
    this._initialState = {};
    this._metadata = {};
  }

  /**
   * 顺序执行 (then)
   */
  andThen(nameOrStep, fnOrOptions) {
    const step = this._normalizeStep(nameOrStep, fnOrOptions);
    this._steps.push(step);
    return this;
  }

  /**
   * 并行执行所有
   */
  andAll(...steps) {
    const allStep = Steps.all('parallel', steps.map(s => this._normalizeStep(s)));
    this._steps.push(allStep);
    return this;
  }

  /**
   * 竞速 (谁先完成)
   */
  andRace(...stepDefs) {
    const steps = stepDefs.map(s => this._normalizeStep(s));
    const raceStep = Steps.race('race', steps);
    this._steps.push(raceStep);
    return this;
  }

  /**
   * 条件分支
   */
  andBranch(config) {
    const branchStep = Steps.branch(config.name || 'branch', {
      condition: config.condition,
      then: Array.isArray(config.then) ? config.then.map(s => this._normalizeStep(s)) : [this._normalizeStep(config.then)],
      else: config.else ? (Array.isArray(config.else) ? config.else.map(s => this._normalizeStep(s)) : [this._normalizeStep(config.else)]) : [],
    });
    this._steps.push(branchStep);
    return this;
  }

  /**
   * 循环
   */
  andDoWhile(config) {
    const loopStep = Steps.doWhile(config.name || 'doWhile', {
      condition: config.condition,
      body: Array.isArray(config.body) ? config.body.map(s => this._normalizeStep(s)) : [this._normalizeStep(config.body)],
      maxIterations: config.maxIterations || 100,
    });
    this._steps.push(loopStep);
    return this;
  }

  /**
   * 映射
   */
  andMap(name, itemsPath, stepFn) {
    const mapStep = Steps.map(name, itemsPath, stepFn);
    this._steps.push(mapStep);
    return this;
  }

  /**
   * 睡眠
   */
  andSleep(ms, name) {
    this._steps.push(Steps.sleep(ms, name));
    return this;
  }

  /**
   * 副作用
   */
  andTap(name, fn) {
    this._steps.push(Steps.tap(name, fn));
    return this;
  }

  /**
   * 添加钩子
   */
  hook(event, handler) {
    this._hooks.on(event, handler);
    return this;
  }

  /**
   * 初始状态
   */
  withInitialState(state) {
    this._initialState = state;
    return this;
  }

  /**
   * 元数据
   */
  withMetadata(meta) {
    this._metadata = meta;
    return this;
  }

  /**
   * 构建工作流
   */
  build() {
    const runtime = new WorkflowRuntime({
      name: this.name,
      initialState: this._initialState,
    });
    
    this._steps.forEach(s => runtime.addStep(s));
    
    // 复制钩子
    for (const [event, handlers] of Object.entries(this._hooks.handlers)) {
      handlers.forEach(h => runtime.hooks.on(event, h));
    }
    
    return runtime;
  }

  _normalizeStep(nameOrStep, fnOrOptions) {
    if (nameOrStep instanceof WorkflowStep) {
      return nameOrStep;
    }
    if (typeof nameOrStep === 'function') {
      return Steps.action(nameOrStep.name || 'action', nameOrStep);
    }
    if (typeof nameOrStep === 'string') {
      const fn = typeof fnOrOptions === 'function' ? fnOrOptions : () => fnOrOptions;
      return Steps.action(nameOrStep, fn, fnOrOptions || {});
    }
    return nameOrStep;
  }
}

// ============================================================
// 工厂函数
// ============================================================

function createWorkflow(name = 'Workflow') {
  return new WorkflowBuilder(name);
}

function createWorkflowChain(steps) {
  const builder = createWorkflow();
  steps.forEach(([name, fn]) => builder.andThen(name, fn));
  return builder.build();
}

// ============================================================
// 使用示例
// ============================================================

/**
 * 创建分析→生成→验证工作流
 */
function createAnalysisWorkflow(options = {}) {
  const { withGuardrails = true } = options;
  
  const workflow = createWorkflow('AnalysisPipeline')
    .andThen('parse', async (ctx) => {
      const input = ctx.input;
      return { parsed: input.split('\n').filter(Boolean) };
    })
    .andThen('analyze', async (ctx) => {
      const items = ctx._parse_result?.parsed || [];
      return { analysis: items.map(i => ({ item: i, complexity: i.length > 50 ? 'high' : 'low' })) };
    })
    .andBranch({
      name: 'complexityCheck',
      condition: (ctx) => {
        const analysis = ctx._analyze_result?.analysis || [];
        return analysis.some(a => a.complexity === 'high');
      },
      then: 'deepAnalysis',
      else: 'quickSummary',
    })
    .andThen('format', async (ctx) => {
      return { formatted: JSON.stringify(ctx.lastResult, null, 2) };
    })
    .withInitialState({ input: '', output: null })
    .hook('step:complete', ({ step, result }) => {
      console.log(`[${step.name}] completed in ${result.elapsed}ms`);
    });
  
  return workflow;
}

module.exports = {
  createWorkflow,
  createWorkflowChain,
  WorkflowStep,
  WorkflowRuntime,
  WorkflowBuilder,
  WorkflowHooks,
  Steps,
  createAnalysisWorkflow,
};
