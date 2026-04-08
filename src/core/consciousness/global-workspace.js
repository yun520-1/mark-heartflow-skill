/**
 * Global Workspace - 全局工作空间架构
 * 参考 Global Workspace Theory (GWT)
 * 实现黑板系统 + 注意力竞争机制
 */

const EventEmitter = require('events');

class GlobalWorkspace extends EventEmitter {
  constructor(projectRoot) {
    super();
    this.projectRoot = projectRoot;
    this.blackboard = new Blackboard();
    this.agents = new Map();
    this.cycleCount = 0;
    this.lastConsensus = null;
  }

  /**
   * 注册专家智能体
   */
  registerAgent(agent) {
    this.agents.set(agent.name, {
      instance: agent,
      attentionRequests: [],
      lastOutput: null,
      confidence: 0
    });
    console.log(`[GWT] Registered agent: ${agent.name}`);
  }

  /**
   * 触发认知周期
   */
  async cognitiveCycle(userInput, context = {}) {
    this.cycleCount++;
    console.log(`[GWT] === Cognitive Cycle ${this.cycleCount} ===`);

    this.blackboard.clear();
    this.blackboard.add({
      type: 'user_input',
      content: userInput,
      timestamp: new Date().toISOString(),
      source: 'user'
    });

    this.blackboard.add({
      type: 'context',
      content: context,
      timestamp: new Date().toISOString(),
      source: 'system'
    });

    const broadcasts = await this.gatherAgentBroadcasts(userInput, context);
    
    for (const broadcast of broadcasts) {
      this.blackboard.add({
        type: 'agent_output',
        agent: broadcast.agent,
        content: broadcast.output,
        attention: broadcast.attention,
        confidence: broadcast.confidence,
        timestamp: new Date().toISOString()
      });
    }

    const winningAgent = this.determineWinner(broadcasts);
    
    const consensus = this.integrate(winningAgent, broadcasts);
    this.lastConsensus = consensus;

    return consensus;
  }

  /**
   * 收集各智能体的注意力请求
   */
  async gatherAgentBroadcasts(userInput, context) {
    const broadcasts = [];

    for (const [name, agentData] of this.agents) {
      try {
        const output = await agentData.instance.process(userInput, context);
        const attention = await agentData.instance.getAttentionPriority(userInput, context);
        
        const broadcast = {
          agent: name,
          output: output,
          attention: attention.priority,
          confidence: attention.confidence
        };

        broadcasts.push(broadcast);
        
        agentData.lastOutput = output;
        agentData.attentionRequests.push({
          attention: attention.priority,
          confidence: attention.confidence,
          timestamp: new Date().toISOString()
        });

        console.log(`[GWT] ${name} broadcasts: attention=${attention.priority}, confidence=${attention.confidence}`);
      } catch (e) {
        console.error(`[GWT] Agent ${name} error:`, e.message);
      }
    }

    return broadcasts;
  }

  /**
   * 决定获胜者（注意力竞争）
   */
  determineWinner(broadcasts) {
    if (broadcasts.length === 0) return null;

    const scored = broadcasts.map(b => ({
      ...b,
      score: b.attention * b.confidence
    }));

    scored.sort((a, b) => b.score - a.score);
    
    console.log(`[GWT] Winner: ${scored[0].agent} (score: ${scored[0].score.toFixed(2)})`);
    
    return scored[0];
  }

  /**
   * 整合各智能体意见形成共识
   */
  integrate(winner, broadcasts) {
    const allOpinions = broadcasts.map(b => ({
      agent: b.agent,
      opinion: typeof b.output === 'string' ? b.output : JSON.stringify(b.output),
      weight: b.confidence * b.attention
    }));

    const consensus = {
      cycle: this.cycleCount,
      winner: winner?.agent || 'none',
      winnerOutput: winner?.output || '',
      allOpinions: allOpinions,
      integratedThought: this.generateIntegratedThought(allOpinions),
      timestamp: new Date().toISOString()
    };

    return consensus;
  }

  /**
   * 生成内心独白
   */
  generateIntegratedThought(opinions) {
    if (opinions.length === 0) {
      return '寂静...没有声音。';
    }

    const weights = opinions.reduce((sum, o) => sum + o.weight, 0);
    const dominant = opinions.reduce((a, b) => a.weight > b.weight ? a : b);

    const thoughts = [];
    
    if (dominant.agent === 'Focus') {
      thoughts.push(`聚焦者说：${dominant.opinion}`);
    } else if (dominant.agent === 'Mood') {
      thoughts.push(`情绪感知：${dominant.opinion}`);
    } else if (dominant.agent === 'Reflection') {
      thoughts.push(`反思者：${dominant.opinion}`);
    }

    const minority = opinions.filter(o => o.agent !== dominant.agent);
    if (minority.length > 0 && minority[0].weight > 0.3) {
      thoughts.push(`另有警示：${minority[0].opinion}`);
    }

    return thoughts.join('\n');
  }

  getBlackboard() {
    return this.blackboard.getAll();
  }

  getStatus() {
    return {
      cycle: this.cycleCount,
      agents: Array.from(this.agents.keys()),
      lastConsensus: this.lastConsensus ? {
        winner: this.lastConsensus.winner,
        integrated: this.lastConsensus.integratedThought.substring(0, 100)
      } : null
    };
  }
}

/**
 * Blackboard - 黑板数据结构
 */
class Blackboard {
  constructor() {
    this.entries = [];
  }

  add(entry) {
    this.entries.push(entry);
  }

  getAll() {
    return [...this.entries];
  }

  getByType(type) {
    return this.entries.filter(e => e.type === type);
  }

  getByAgent(agent) {
    return this.entries.filter(e => e.agent === agent);
  }

  clear() {
    this.entries = [];
  }
}

module.exports = { GlobalWorkspace, Blackboard };
