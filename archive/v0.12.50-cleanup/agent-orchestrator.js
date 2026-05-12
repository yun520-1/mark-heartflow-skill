/**
 * HeartFlow 多智能体编排器 - DAG任务调度器
 * 基于有向无环图的任务依赖调度 + 专家权重投票
 */

const fs = require('fs');
const path = require('path');
const { ExecutionVerifier } = require('./execution-verifier.js');

const PERFORMANCE_FILE = path.join(__dirname, 'agent-performance.json');

class AgentOrchestrator {
  constructor() {
    this.agents = new Map();
    this.dag = this.buildDAG();
    this.performance = this.loadPerformance();
    this.executionVerifier = new ExecutionVerifier();
    this.initialize();
  }

  // 初始化智能体
  initialize() {
    this.registerAgent('FocusAgent', {
      name: '焦点分析',
      task: '分析用户意图和关注点',
      dependencies: [],
      parallel: true,
      weight: this.performance.FocusAgent?.weight || 0.5
    });

    this.registerAgent('MoodAgent', {
      name: '情绪分析',
      task: '分析用户情绪状态',
      dependencies: [],
      parallel: true,
      weight: this.performance.MoodAgent?.weight || 0.5
    });

    this.registerAgent('ContextAgent', {
      name: '上下文理解',
      task: '理解对话上下文',
      dependencies: ['FocusAgent', 'MoodAgent'],
      parallel: false,
      weight: this.performance.ContextAgent?.weight || 0.6
    });

    this.registerAgent('SelfAgent', {
      name: '自我融合',
      task: '整合所有分析结果',
      dependencies: ['ContextAgent'],
      parallel: false,
      weight: this.performance.SelfAgent?.weight || 0.8
    });

    this.registerAgent('DecisionAgent', {
      name: '决策生成',
      task: '生成最终响应决策',
      dependencies: ['SelfAgent'],
      parallel: false,
      weight: this.performance.DecisionAgent?.weight || 0.7
    });
  }

  // 构建DAG
  buildDAG() {
    return {
      // 第一层：可并行执行
      layer1: ['FocusAgent', 'MoodAgent'],
      // 第二层：依赖第一层
      layer2: ['ContextAgent'],
      // 第三层：依赖第二层
      layer3: ['SelfAgent'],
      // 第四层：最终决策
      layer4: ['DecisionAgent']
    };
  }

  // 注册智能体
  registerAgent(id, config) {
    this.agents.set(id, {
      ...config,
      status: 'idle',
      lastResult: null,
      history: []
    });
  }

  // 加载表现数据
  loadPerformance() {
    try {
      if (fs.existsSync(PERFORMANCE_FILE)) {
        return JSON.parse(fs.readFileSync(PERFORMANCE_FILE, 'utf-8'));
      }
    } catch (e) {}
    return {
      FocusAgent: { weight: 0.5, accuracy: 0.75, tasks: 100, successes: 75 },
      MoodAgent: { weight: 0.5, accuracy: 0.80, tasks: 100, successes: 80 },
      ContextAgent: { weight: 0.6, accuracy: 0.85, tasks: 80, successes: 68 },
      SelfAgent: { weight: 0.8, accuracy: 0.90, tasks: 50, successes: 45 },
      DecisionAgent: { weight: 0.7, accuracy: 0.88, tasks: 50, successes: 44 }
    };
  }

  // 保存表现数据
  savePerformance() {
    fs.writeFileSync(PERFORMANCE_FILE, JSON.stringify(this.performance, null, 2));
  }

  // 更新智能体表现
  updatePerformance(agentId, success) {
    if (!this.performance[agentId]) {
      this.performance[agentId] = { weight: 0.5, accuracy: 0.5, tasks: 0, successes: 0 };
    }
    
    const perf = this.performance[agentId];
    perf.tasks++;
    if (success) perf.successes++;
    perf.accuracy = perf.successes / perf.tasks;
    
    // 更新权重 (基于准确率)
    perf.weight = Math.min(1, 0.3 + perf.accuracy * 0.7);
    
    this.savePerformance();
  }

  // DAG调度执行
  async executeDAG(input) {
    const results = {};
    const startTime = Date.now();
    
    // 第一层：并行执行 FocusAgent 和 MoodAgent
    console.log('═══ DAG 执行：第一层（并行）═══');
    const layer1Promises = this.dag.layer1.map(async (agentId) => {
      const result = await this.executeAgent(agentId, input);
      results[agentId] = result;
      return result;
    });
    await Promise.all(layer1Promises);
    
    // 第二层：ContextAgent 等待第一层完成
    console.log('═══ DAG 执行：第二层 ═══');
    const layer2Input = { ...input, ...results };
    const contextResult = await this.executeAgent('ContextAgent', layer2Input);
    results.ContextAgent = contextResult;
    
    // 第三层：SelfAgent 融合
    console.log('═══ DAG 执行：第三层 ═══');
    const layer3Input = { ...layer2Input, context: contextResult };
    const selfResult = await this.executeAgent('SelfAgent', layer3Input);
    results.SelfAgent = selfResult;
    
    // 第四层：最终决策
    console.log('═══ DAG 执行：第四层 ═══');
    const finalInput = { ...layer3Input, selfAnalysis: selfResult };
    const decisionResult = await this.executeAgent('DecisionAgent', finalInput);
    results.DecisionAgent = decisionResult;
    
    const duration = Date.now() - startTime;
    console.log(`\n═══ DAG 执行完成 (${duration}ms) ═══\n`);
    
    return {
      results,
      decision: decisionResult.output,
      duration
    };
  }

  // 执行单个智能体
  async executeAgent(agentId, input) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return { error: `Agent ${agentId} not found` };
    }

    agent.status = 'running';
    console.log(`  ▶ ${agentId} (${agent.name}) - ${agent.task}`);

    try {
      // 模拟智能体执行
      const output = await this.runAgentLogic(agentId, input);
      
      agent.status = 'completed';
      agent.lastResult = output;
      agent.history.push({ timestamp: Date.now(), input, output, success: true });
      
      // 更新表现
      this.updatePerformance(agentId, true);
      
      console.log(`  ✓ ${agentId} 完成`);
      const verification = this.executionVerifier.verify(output, {
        plan: { actions: [agent.task], expectedOutcome: agent.task },
        expectedOutcome: agent.task,
        fallback: '切换到更保守的执行路径'
      });
      return { agentId, output, success: true, weight: agent.weight, verification, summary: this.summarizeAgentOutput(output, verification) };
    } catch (error) {
      agent.status = 'error';
      agent.history.push({ timestamp: Date.now(), input, error: error.message, success: false });
      this.updatePerformance(agentId, false);
      console.log(`  ✗ ${agentId} 失败: ${error.message}`);
      return { agentId, error: error.message, success: false, weight: agent.weight };
    }
  }

  // 智能体逻辑实现
  async runAgentLogic(agentId, input) {
    // 模拟不同的处理逻辑
    switch (agentId) {
      case 'FocusAgent':
        return { focus: '用户关注点分析', keywords: ['心流', '自我'], confidence: 0.85 };
      case 'MoodAgent':
        return { mood: '积极', intensity: 0.7, emotion: '期待' };
      case 'ContextAgent':
        return { context: '持续对话', depth: 3, understanding: 0.90 };
      case 'SelfAgent':
        return { synthesis: '整合分析', recommendation: '提供成长建议', confidence: 0.88 };
      case 'DecisionAgent':
        return { output: '鼓励用户继续探索心流状态', nextAction: '引导冥想' };
      default:
        return { result: 'unknown' };
    }
  }

  summarizeAgentOutput(output, verification) {
    const brief = typeof output === 'string' ? output : JSON.stringify(output);
    return {
      output: brief.slice(0, 120),
      verification: verification?.summary || verification?.suggestedNextStep || 'verified'
    };
  }

  // 专家权重投票 - 解决冲突
  resolveConflict(opinions) {
    if (!opinions || opinions.length === 0) {
      return { decision: null, confidence: 0, details: 'No opinions provided' };
    }

    if (opinions.length === 1) {
      return {
        decision: opinions[0].decision,
        confidence: opinions[0].weight || 0.5,
        details: 'Single opinion, no conflict'
      };
    }

    // 加权投票
    const weightedVotes = {};
    let totalWeight = 0;

    for (const opinion of opinions) {
      const weight = opinion.weight || this.performance[opinion.agentId]?.weight || 0.5;
      totalWeight += weight;

      if (!weightedVotes[opinion.decision]) {
        weightedVotes[opinion.decision] = { weight: 0, count: 0, agents: [] };
      }
      weightedVotes[opinion.decision].weight += weight;
      weightedVotes[opinion.decision].count++;
      weightedVotes[opinion.decision].agents.push(opinion.agentId);
    }

    // 找出最高权重
    let maxWeight = 0;
    let bestDecision = null;
    let winners = [];

    for (const [decision, data] of Object.entries(weightedVotes)) {
      const normalizedWeight = data.weight / totalWeight;
      console.log(`  ${decision}: ${(normalizedWeight * 100).toFixed(1)}% (${data.count} agents: ${data.agents.join(', ')})`);
      
      if (normalizedWeight > maxWeight) {
        maxWeight = normalizedWeight;
        bestDecision = decision;
        winners = data.agents;
      }
    }

    const confidence = maxWeight;
    const isConfident = confidence >= 0.5;

    return {
      decision: bestDecision,
      confidence: confidence.toFixed(2),
      isConfident,
      winners,
      allVotes: weightedVotes,
      recommendation: isConfident ? '采用投票结果' : '需要更多数据或人工介入',
      summary: this.summarizeVote(bestDecision, confidence, winners)
    };
  }

  summarizeVote(decision, confidence, winners) {
    return `${decision || 'none'} @ ${Number(confidence || 0).toFixed(2)} by ${Array.isArray(winners) ? winners.join(', ') : ''}`.trim();
  }

  // 获取所有智能体状态
  getAgentStatus() {
    const status = [];
    for (const [agentId, agent] of this.agents) {
      const perf = this.performance[agentId] || {};
      status.push({
        id: agentId,
        name: agent.name,
        task: agent.task,
        status: agent.status,
        weight: agent.weight,
        accuracy: perf.accuracy?.toFixed(2) || 'N/A',
        tasks: perf.tasks || 0,
        lastResult: agent.lastResult ? 'completed' : 'none'
      });
    }
    return status;
  }

  // === DRAMA 风格动态编排 ===

  /**
   * 基于亲和力的任务分配
   * 根据任务特征与智能体能力的匹配度分配任务
   */
  affinityBasedAllocation(task, availableAgents) {
    const taskFeatures = this.extractTaskFeatures(task);
    
    const scoredAgents = availableAgents.map(agent => {
      const affinity = this.calculateAffinity(taskFeatures, agent);
      return { agent, affinity };
    });

    scoredAgents.sort((a, b) => b.affinity - a.affinity);
    
    return {
      primary: scoredAgents[0],
      alternatives: scoredAgents.slice(1, 4)
    };
  }

  /**
   * 提取任务特征
   */
  extractTaskFeatures(task) {
    const features = {
      complexity: 'medium',
      domain: 'general',
      requiresEmotion: false,
      requiresReasoning: false,
      requiresMemory: false
    };

    const taskLower = task.toLowerCase();
    
    if (taskLower.includes('how to') || taskLower.includes('为什么')) {
      features.complexity = 'high';
      features.requiresReasoning = true;
    }
    if (taskLower.includes('feel') || taskLower.includes('感觉') || taskLower.includes('心情')) {
      features.requiresEmotion = true;
    }
    if (taskLower.includes('remember') || taskLower.includes('记得')) {
      features.requiresMemory = true;
    }

    return features;
  }

  /**
   * 计算亲和力分数
   */
  calculateAffinity(taskFeatures, agent) {
    let score = 0.5;

    // 根据智能体能力计算
    const capabilities = agent.capabilities || {};
    
    if (taskFeatures.requiresEmotion && capabilities.emotion) {
      score += 0.3;
    }
    if (taskFeatures.requiresReasoning && capabilities.reasoning) {
      score += 0.3;
    }
    if (taskFeatures.requiresMemory && capabilities.memory) {
      score += 0.3;
    }

    // 考虑智能体性能权重
    score *= (agent.weight || 0.5);

    return Math.min(1, Math.max(0, score));
  }

  /**
   * 动态拓扑调整 - 支持运行时智能体失效时的重组
   */
  async dynamicReconfiguration(failedAgentId) {
    console.log(`[Orchestrator] 检测到智能体失效: ${failedAgentId}`);

    // 找到替代智能体
    const alternatives = this.findAlternativeAgents(failedAgentId);
    
    if (alternatives.length > 0) {
      console.log(`[Orchestrator] 找到 ${alternatives.length} 个替代智能体`);
      return {
        recovered: true,
        replacement: alternatives[0],
        alternatives: alternatives.slice(1)
      };
    }

    return {
      recovered: false,
      reason: 'no-alternative-available'
    };
  }

  /**
   * 查找替代智能体
   */
  findAlternativeAgents(failedAgentId) {
    const failedAgent = this.agents.get(failedAgentId);
    if (!failedAgent) return [];

    // 根据依赖关系找替代
    const alternatives = [];
    
    for (const [agentId, agent] of this.agents) {
      if (agentId === failedAgentId) continue;
      
      // 检查是否可以处理相同类型的任务
      const taskOverlap = this.calculateTaskOverlap(
        failedAgent.task, 
        agent.task
      );
      
      if (taskOverlap > 0.3) {
        alternatives.push({
          id: agentId,
          name: agent.name,
          overlap: taskOverlap,
          weight: agent.weight
        });
      }
    }

    return alternatives.sort((a, b) => b.overlap - a.overlap);
  }

  /**
   * 计算任务重叠度
   */
  calculateTaskOverlap(task1, task2) {
    const words1 = new Set(task1.split(/[,，]/));
    const words2 = new Set(task2.split(/[,，]/));
    
    const intersection = [...words1].filter(w => words2.has(w));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  /**
   * 任务难度感知路由
   * 简单问题只调用最少智能体，复杂问题动态构建工作流
   */
  async difficultyAwareRouting(task) {
    const difficulty = await this.predictQueryDifficulty(task);
    
    console.log(`[Orchestrator] 任务难度评估: ${difficulty.level} (${difficulty.score})`);
    
    if (difficulty.level === 'simple') {
      // 只调用必需的智能体
      return this.executeSimpleWorkflow(task);
    } else if (difficulty.level === 'complex') {
      // 动态构建专家工作流
      return this.executeExpertWorkflow(task, difficulty.experts);
    } else {
      // 中等难度，使用标准DAG
      return this.executeDAG(task);
    }
  }

  /**
   * 预测查询难度
   */
  async predictQueryDifficulty(task) {
    // 简化实现
    const taskLower = task.toLowerCase();
    let score = 0.5;
    const experts = [];

    // 长文本通常更复杂
    if (task.length > 200) score += 0.2;
    
    // 包含多问题
    if (taskLower.includes(' and ') || task.includes('和')) score += 0.1;
    
    // 技术术语
    if (/algorithm|architecture|design pattern/i.test(task)) {
      score += 0.2;
      experts.push('FocusAgent', 'SelfAgent');
    }
    
    // 情绪相关
    if (/feel|emotion|感受|情绪/i.test(task)) {
      experts.push('MoodAgent');
    }

    let level = 'medium';
    if (score < 0.6) level = 'simple';
    else if (score > 0.8) level = 'complex';

    return { level, score, experts };
  }

  /**
   * 简单工作流 - 只用决策智能体
   */
  async executeSimpleWorkflow(task) {
    console.log('[Orchestrator] 执行简单工作流');
    return this.executeAgent('DecisionAgent', task);
  }

  /**
   * 专家工作流 - 根据难度动态选择
   */
  async executeExpertWorkflow(task, requiredExperts) {
    console.log(`[Orchestrator] 执行专家工作流: ${requiredExperts.join(', ')}`);
    
    const results = {};
    
    // 并行执行专家
    const promises = requiredExperts.map(async (agentId) => {
      const result = await this.executeAgent(agentId, task);
      results[agentId] = result;
    });
    
    await Promise.all(promises);
    
    // 融合结果
    return this.resolveConflict(Object.values(results).map(r => r.output));
  }

  /**
   * 获取当前拓扑图
   */
  getTopology() {
    const nodes = [];
    const edges = [];

    for (const [agentId, agent] of this.agents) {
      nodes.push({
        id: agentId,
        label: agent.name,
        status: agent.status,
        weight: agent.weight
      });

      for (const dep of agent.dependencies || []) {
        edges.push({ from: dep, to: agentId });
      }
    }

    return { nodes, edges };
  }
}

// 导出单例
module.exports = new AgentOrchestrator();