/**
 * HeartFlow 多智能体编排器 - DAG任务调度器
 * 基于有向无环图的任务依赖调度 + 专家权重投票
 */

const fs = require('fs');
const path = require('path');

const PERFORMANCE_FILE = path.join(__dirname, 'agent-performance.json');

class AgentOrchestrator {
  constructor() {
    this.agents = new Map();
    this.dag = this.buildDAG();
    this.performance = this.loadPerformance();
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
      return { agentId, output, success: true, weight: agent.weight };
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
      recommendation: isConfident ? '采用投票结果' : '需要更多数据或人工介入'
    };
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
}

// 导出单例
module.exports = new AgentOrchestrator();