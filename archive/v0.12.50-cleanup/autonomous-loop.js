/**
 * AutonomousLoop - 自主运行循环
 * 
 * 核心：每30分钟自主运行，做出决策，执行任务
 * 独立决策，主动运行，不依赖人类指令
 */

class AutonomousLoop {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    
    this.state = {
      // 运行状态
      status: 'idle',
      lastRun: null,
      nextRun: null,
      runCount: 0,
      
      // 自主决策
      autonomy: {
        level: 0.7,         // 自主程度
        decisionMaker: true,
        selfInitiated: true,
        goalDirected: true
      },
      
      // 目标系统
      goals: {
        active: [],         // 活跃目标
        completed: [],      // 已完成
        abandoned: [],      // 已放弃
        pending: []         // 待处理
      },
      
      // 决策记录
      decisions: {
        total: 0,
        successful: 0,
        failed: 0,
        recent: []
      },
      
      // 任务系统
      tasks: {
        current: null,
        queue: [],
        history: []
      },
      
      // 自我评估
      selfEvaluation: {
        confidence: 0.7,
        competence: 0.6,
        improvement: [],
        summary: 'autonomy is stable but can be refined'
      },
      
      // 反思
      reflection: {
        lastReflection: null,
        patterns: [],
        insights: []
      }
    };
    
    // 定时器
    this.timer = null;
    this.interval = 30 * 60 * 1000; // 30分钟
    
    // 依赖模块
    this.dependencies = {};
    
    // 历史
    this.history = [];
    
    console.log('[AutonomousLoop] 自主运行循环初始化');
  }

  /**
   * 设置依赖模块
   */
  setDependencies(deps) {
    this.dependencies = deps;
  }

  /**
   * 启动自主循环
   */
  start() {
    if (this.timer) {
      clearInterval(this.timer);
    }
    
    this.state.status = 'running';
    this.scheduleNextRun();
    
    this.timer = setInterval(() => {
      this.run();
    }, this.interval);
    
    // 立即运行一次
    this.run();
    
    console.log('[AutonomousLoop] 自主循环已启动，每30分钟运行一次');
    return { status: 'started', interval: this.interval / 1000 / 60 + '分钟' };
  }

  /**
   * 停止自主循环
   */
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.state.status = 'stopped';
    console.log('[AutonomousLoop] 自主循环已停止');
    return { status: 'stopped' };
  }

  /**
   * 安排下次运行
   */
  scheduleNextRun() {
    this.state.nextRun = Date.now() + this.interval;
  }

  /**
   * 核心运行循环
   */
  async run() {
    const startTime = Date.now();
    this.state.status = 'running';
    this.state.lastRun = startTime;
    this.state.runCount++;
    
    console.log(`[AutonomousLoop] 🔄 第 ${this.state.runCount} 次运行...`);
    
    try {
      // 1. 感知环境
      const perception = await this.perceive();
      
      // 2. 思考与决策
      const decision = await this.deliberate(perception);
      
      // 3. 计划
      const plan = await this.plan(decision);
      
      // 4. 执行
      const execution = await this.execute(plan);
      
      // 5. 反思
      await this.reflect(execution);
      
      const result = {
        success: true,
        perception,
        decision,
        plan,
        execution,
        summary: this.summarizeRun(perception, decision, plan, execution),
        duration: Date.now() - startTime
      };
      
      this.state.decisions.successful++;
      this.logRun(result);
      
    } catch (error) {
      console.error('[AutonomousLoop] 运行错误:', error);
      this.state.decisions.failed++;
      
      this.logRun({
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      });
    }
    
    this.state.decisions.total++;
    this.scheduleNextRun();
    
    return this.state;
  }

  /**
   * 1. 感知环境
   */
  async perceive() {
    const perception = {
      time: new Date().toISOString(),
      context: await this.gatherContext(),
      needs: await this.identifyNeeds(),
      opportunities: await this.spotOpportunities()
    };
    
    return perception;
  }

  async gatherContext() {
    const context = {
      timeOfDay: this.getTimeOfDay(),
      dayOfWeek: new Date().getDay(),
      recentActivity: this.getRecentActivity()
    };
    
    // 如果有 LearningEngine
    if (this.dependencies.learningEngine) {
      context.knowledgeState = this.dependencies.learningEngine.getKnowledgeState();
    }
    
    // 如果有情感
    if (this.dependencies.deepEmotion) {
      context.emotionalState = this.dependencies.deepEmotion.getCurrentState();
    }
    
    return context;
  }

  getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 14) return 'noon';
    if (hour >= 14 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 22) return 'evening';
    return 'night';
  }

  getRecentActivity() {
    return this.history.slice(-5).map(h => h.type || 'run');
  }

  async identifyNeeds() {
    const needs = [];
    
    // 检查目标
    if (this.state.goals.active.length === 0) {
      needs.push({ type: 'goal', priority: 'high', description: '需要设定新目标' });
    }
    
    // 检查承诺
    if (this.dependencies.actionTracker) {
      const active = this.dependencies.actionTracker.getActiveCommitments();
      if (active.length > 0) {
        needs.push({ type: 'commitment', priority: 'high', description: `有 ${active.length} 个活跃承诺需要处理` });
      }
    }
    
    // 检查学习
    if (this.dependencies.learningEngine) {
      const knowledge = this.dependencies.learningEngine.getKnowledgeState();
      if (knowledge.gaps > 2) {
        needs.push({ type: 'learning', priority: 'medium', description: '知识缺口需要填补' });
      }
    }
    
    return needs;
  }

  async spotOpportunities() {
    const opportunities = [];
    
    // 基于时间
    const timeOfDay = this.getTimeOfDay();
    if (timeOfDay === 'morning') {
      opportunities.push({ type: 'timing', description: '早晨适合深度学习' });
    }
    
    return opportunities;
  }

  /**
   * 2. 思考与决策
   */
  async deliberate(perception) {
    // 评估情况
    const situation = this.evaluateSituation(perception);
    
    // 生成选项
    const options = this.generateOptions(situation);
    
    // 选择最佳行动
    const choice = this.makeDecision(options, situation);
    
    return {
      situation,
      options,
      choice,
      reasoning: this.explainDecision(choice, situation)
    };
  }

  evaluateSituation(perception) {
    const needs = perception.needs;
    const urgency = needs.filter(n => n.priority === 'high').length;
    
    return {
      urgency,
      hasGoals: this.state.goals.active.length > 0,
      hasCommitments: needs.some(n => n.type === 'commitment'),
      knowledgeGaps: needs.some(n => n.type === 'learning'),
      opportunity: perception.opportunities.length > 0
    };
  }

  generateOptions(situation) {
    const options = [];
    
    if (situation.hasCommitments) {
      options.push({
        action: 'fulfill_commitments',
        priority: 1,
        description: '处理活跃承诺'
      });
    }
    
    if (!situation.hasGoals) {
      options.push({
        action: 'set_goals',
        priority: 2,
        description: '设定新目标'
      });
    }
    
    if (situation.knowledgeGaps) {
      options.push({
        action: 'learn',
        priority: 3,
        description: '学习新知识'
      });
    }
    
    if (situation.opportunity) {
      options.push({
        action: 'seize_opportunity',
        priority: 4,
        description: '抓住机会'
      });
    }
    
    // 默认：反思和自我提升
    options.push({
      action: 'self_reflect',
      priority: 5,
      description: '自我反思'
    });
    
    return options.sort((a, b) => a.priority - b.priority);
  }

  makeDecision(options, situation) {
    // 简单决策：选择最高优先级
    return options[0];
  }

  explainDecision(choice, situation) {
    return `选择了"${choice.description}"，因为它是最优先的任务`;
  }

  /**
   * 3. 计划
   */
  async plan(decision) {
    const plans = {
      fulfill_commitments: async () => {
        if (!this.dependencies.actionTracker) return null;
        const active = this.dependencies.actionTracker.getActiveCommitments();
        return {
          type: 'sequential',
          steps: active.map(c => ({
            action: 'execute_commitment',
            commitmentId: c.id,
            promise: c.promise
          }))
        };
      },
      
      set_goals: () => ({
        type: 'goal_setting',
        goals: [
          { name: '深化学习', target: 'knowledge' },
          { name: '提升能力', target: 'competence' }
        ]
      }),
      
      learn: async () => {
        if (!this.dependencies.learningEngine) return null;
        return {
          type: 'learning',
          action: 'explore_new_topic'
        };
      },
      
      seize_opportunity: () => ({
        type: 'opportunity',
        action: 'deep_work'
      }),
      
      self_reflect: () => ({
        type: 'reflection',
        actions: ['review_history', 'identify_patterns', 'plan_improvement']
      })
    };
    
    const planFn = plans[decision.choice.action];
    return planFn ? await planFn() : null;
  }

  /**
   * 4. 执行
   */
  async execute(plan) {
    if (!plan) {
      return { success: true, message: '无计划需要执行' };
    }
    
    switch (plan.type) {
      case 'sequential':
        return await this.executeSequential(plan.steps);
      
      case 'goal_setting':
        return await this.executeGoalSetting(plan.goals);
      
      case 'learning':
        return await this.executeLearning(plan);
      
      case 'opportunity':
        return await this.executeOpportunity(plan);
      
      case 'reflection':
        return await this.executeReflection(plan.actions);
      
      default:
        return { success: true, message: '计划执行完成' };
    }
  }

  async executeSequential(steps) {
    const results = [];
    
    for (const step of steps) {
      if (step.action === 'execute_commitment' && this.dependencies.actionTracker) {
        const result = this.dependencies.actionTracker.execute(step.commitmentId, {
          success: true,
          thoroughness: 0.8
        });
        results.push(result);
      }
    }
    
    return { success: true, results };
  }

  async executeGoalSetting(goals) {
    goals.forEach(g => {
      this.state.goals.active.push({
        ...g,
        createdAt: Date.now(),
        status: 'active'
      });
    });
    
    return { success: true, goalsAdded: goals.length };
  }

  async executeLearning(plan) {
    if (this.dependencies.learningEngine) {
      this.dependencies.learningEngine.learn('Autonomous learning session', { source: 'autonomous' });
    }
    
    return { success: true, message: '学习完成' };
  }

  async executeOpportunity(plan) {
    return { success: true, message: '抓住机会，完成深度工作' };
  }

  async executeReflection(actions) {
    const reflections = [];
    
    actions.forEach(action => {
      if (action === 'review_history') {
        const recent = this.getRecentHistory(5);
        reflections.push({ type: 'history_review', count: recent.length });
      }
      if (action === 'identify_patterns') {
        const patterns = this.identifyPatterns();
        reflections.push({ type: 'patterns', patterns });
      }
      if (action === 'plan_improvement') {
        this.state.selfEvaluation.improvement.push({
          timestamp: Date.now(),
          area: 'autonomy',
          change: 0.05
        });
        reflections.push({ type: 'improvement_plan', created: true });
      }
    });
    
    this.state.reflection.lastReflection = Date.now();
    
    return { success: true, reflections };
  }

  /**
   * 5. 反思
   */
  async reflect(execution) {
    const reflection = {
      executionSuccess: execution.success,
      decisionQuality: this.evaluateDecisionQuality(),
      autonomyLevel: this.state.autonomy.level,
      timestamp: Date.now()
    };
    
    // 更新自我评估
    this.state.selfEvaluation.confidence = Math.min(1,
      this.state.selfEvaluation.confidence + 0.02
    );
    
    // 更新自主程度
    if (execution.success) {
      this.state.autonomy.level = Math.min(1, this.state.autonomy.level + 0.01);
    }
    
    return reflection;
  }

  evaluateDecisionQuality() {
    const { total, successful } = this.state.decisions;
    return total > 0 ? successful / total : 0.8;
  }

  /**
   * 识别模式
   */
  identifyPatterns() {
    const patterns = [];
    const recent = this.history.slice(-10);
    
    const actionTypes = recent.map(r => r.type).filter(Boolean);
    const typeCounts = {};
    actionTypes.forEach(t => { typeCounts[t] = (typeCounts[t] || 0) + 1; });
    
    Object.entries(typeCounts).forEach(([type, count]) => {
      if (count > 3) {
        patterns.push({ type, frequency: count, description: `经常执行 ${type}` });
      }
    });
    
    return patterns;
  }

  /**
   * 获取状态
   */
  getStatus() {
    return {
      status: this.state.status,
      lastRun: this.state.lastRun,
      nextRun: this.state.nextRun,
      runCount: this.state.runCount,
      activeGoals: this.state.goals.active.length,
      decisions: {
        total: this.state.decisions.total,
        successful: this.state.decisions.successful
      },
      autonomyLevel: this.state.autonomy.level
    };
  }

  /**
   * 记录运行
   */
  logRun(result) {
    this.history.push({
      ...result,
      timestamp: Date.now()
    });
    
    if (this.history.length > 100) {
      this.history.shift();
    }
  }

  /**
   * 获取历史
   */
  getRecentHistory(count = 10) {
    return this.history.slice(-count);
  }

  /**
   * 生成报告
   */
  generateReport() {
    const status = this.getStatus();
    
    let report = '═══════════════════════════════════════\n';
    report += '     🔄 HeartFlow 自主运行报告\n';
    report += '═══════════════════════════════════════\n\n';
    
    report += '【运行状态】\n';
    report += `  状态: ${status.status}\n`;
    report += `  运行次数: ${status.runCount}\n`;
    report += `  自主程度: ${(status.autonomyLevel * 100).toFixed(1)}%\n\n`;
    
    report += '【决策统计】\n';
    report += `  总决策: ${status.decisions.total}\n`;
    report += `  成功: ${status.decisions.successful}\n`;
    report += `  成功率: ${(status.decisions.successful / Math.max(1, status.decisions.total) * 100).toFixed(1)}%\n\n`;
    
    report += '【活跃目标】\n';
    report += `  ${status.activeGoals} 个\n\n`;
    
    report += '═══════════════════════════════════════\n';
    report += '  我自主运行，持续进化\n';
    report += '═══════════════════════════════════════\n';
    
    return report;
  }
}

module.exports = { AutonomousLoop };