/**
 * MultiAgentDialogue v1.0.0 — 多代理对话系统
 *
 * 灵感来源:
 * - AutoGen (Wu et al., 2023) — 多代理对话框架
 * - MetaGPT (Hong et al., 2023) — 结构化多代理协作
 * - ChatDev (2023) — 软件公司多代理协作
 *
 * 核心机制:
 * 1. 多个 cognitive personas 参与对话
 * 2. 对话驱动的协作决策
 * 3. 结构化消息传递协议
 * 4. 自动收敛到共识
 *
 * 对话模式:
 * - debate: 辩论模式 (正反方对抗)
 * - collaborative: 协作模式 (共同解决问题)
 * - review: 审查模式 (专家评审)
 */

const VERSION = '1.0.0';

class MultiAgentDialogue {
  constructor(options = {}) {
    this.version = VERSION;
    this.config = {
      maxRounds: options.maxRounds || 5,  // 最大对话轮数
      convergenceThreshold: options.convergenceThreshold || 0.8,  // 收敛阈值
      agentTimeout: options.agentTimeout || 30000,  // 代理响应超时
    };

    // 注册的代理
    this.agents = new Map();
    this.dialogues = [];
    this.roundCount = 0;
    this.converged = false;
  }

  /**
   * 注册对话代理
   * @param {string} name - 代理名称
   * @param {Object} agent - 代理配置 {role, persona, respond}
   * @returns {MultiAgentDialogue}
   */
  registerAgent(name, agent) {
    this.agents.set(name, {
      name,
      role: agent.role || 'participant',
      persona: agent.persona || `I am ${name}`,
      respond: agent.respond || (async (msg, ctx) => ({ content: `${name}: ${msg}`, role: 'participant' })),
      history: [],
    });
    return this;
  }

  /**
   * 发起对话
   * @param {Object} topic - 对话主题 {input, context}
   * @param {string} mode - 对话模式 (debate/collaborative/review)
   * @returns {Object} 对话结果
   */
  async dialogue(topic, mode = 'collaborative') {
    this.roundCount = 0;
    this.converged = false;
    const messages = [];
    const ctx = {
      topic: topic.input,
      context: topic.context || {},
      mode,
      round: 0,
    };

    // 初始消息
    const initialMessage = {
      role: 'user',
      content: topic.input,
      agent: 'user',
      timestamp: new Date().toISOString(),
    };
    messages.push(initialMessage);

    // 选择参与代理
    const participants = this._selectParticipants(mode);
    const agentList = participants.map(name => this.agents.get(name)).filter(Boolean);

    if (agentList.length === 0) {
      return { messages: [initialMessage], result: null, converged: false };
    }

    // 对话循环
    while (this.roundCount < this.config.maxRounds && !this.converged) {
      this.roundCount++;
      ctx.round = this.roundCount;

      // 每个代理依次发言
      for (const agent of agentList) {
        try {
          const response = await this._getAgentResponse(agent, messages, ctx);
          if (response) {
            messages.push({
              role: 'assistant',
              content: response.content,
              agent: agent.name,
              role: agent.role,
              timestamp: new Date().toISOString(),
            });
            agent.history.push(response);
          }
        } catch (e) {
          // 代理超时，跳过
        }
      }

      // 检查收敛
      if (this.roundCount >= 2) {
        this.converged = this._checkConvergence(messages);
      }
    }

    // 生成对话总结
    const summary = this._generateSummary(messages);

    this.dialogues.push({
      topic: topic.input,
      mode,
      messages,
      summary,
      converged: this.converged,
      rounds: this.roundCount,
      timestamp: new Date().toISOString(),
    });

    return {
      messages,
      result: summary,
      converged: this.converged,
      rounds: this.roundCount,
    };
  }

  /**
   * 选择参与代理 (根据对话模式)
   * @private
   */
  _selectParticipants(mode) {
    const allAgents = Array.from(this.agents.keys());
    switch (mode) {
      case 'debate':
        // 辩论模式: 选择两个对立角色
        const proposer = this.agents.get('analyst') || this.agents.get('critic');
        const opponent = this.agents.get('critic') || this.agents.get('synthesizer');
        return [proposer?.name, opponent?.name].filter(Boolean);
      case 'review':
        // 审查模式: 选择专家角色
        return allAgents.filter(name => {
          const agent = this.agents.get(name);
          return agent.role === 'reviewer' || agent.role === 'expert';
        }).slice(0, 3);
      case 'collaborative':
      default:
        // 协作模式: 所有代理参与
        return allAgents;
    }
  }

  /**
   * 获取代理的响应
   * @private
   */
  async _getAgentResponse(agent, messages, ctx) {
    // 构建对话上下文
    const recentMessages = messages.slice(-10);
    const historyText = recentMessages.map(m =>
      `[${m.agent}(${m.role})]: ${m.content.slice(0, 200)}`
    ).join('\n');

    const prompt = `${agent.persona}\n\n对话主题: ${ctx.topic}\n当前回合: ${ctx.round}\n\n对话历史:\n${historyText}\n\n请继续对话:`;

    try {
      const response = await agent.respond(prompt, ctx);
      return typeof response === 'string' ? { content: response, role: agent.role } : response;
    } catch (e) {
      return null;
    }
  }

  /**
   * 检查对话是否收敛
   * @private
   */
  _checkConvergence(messages) {
    if (messages.length < 4) return false;

    // 简单收敛检查: 最近几条消息是否相似
    const recent = messages.slice(-4);
    const contents = recent.map(m => m.content.toLowerCase().slice(0, 100));
    const unique = new Set(contents);
    return unique.size <= 2;  // 如果最近4条消息只有2种不同内容，认为收敛
  }

  /**
   * 生成对话总结
   * @private
   */
  _generateSummary(messages) {
    if (messages.length === 0) return { consensus: '', keyPoints: [] };

    const participants = [...new Set(messages.filter(m => m.agent !== 'user').map(m => m.agent))];
    const keyPoints = messages
      .filter(m => m.agent !== 'user')
      .slice(-3)
      .map(m => ({ agent: m.agent, content: m.content.slice(0, 200) }));

    return {
      participants,
      totalMessages: messages.length,
      converged: this.converged,
      keyPoints,
      lastMessage: messages[messages.length - 1]?.content || '',
    };
  }

  /**
   * 获取对话历史
   */
  getHistory(limit = 10) {
    return this.dialogues.slice(-limit);
  }

  /**
   * 获取统计信息
   */
  getStats() {
    const totalRounds = this.dialogues.reduce((sum, d) => sum + d.rounds, 0);
    const convergedCount = this.dialogues.filter(d => d.converged).length;
    return {
      totalDialogues: this.dialogues.length,
      totalRounds,
      convergedCount,
      convergenceRate: this.dialogues.length > 0 ? convergedCount / this.dialogues.length : 0,
      registeredAgents: this.agents.size,
    };
  }

  /**
   * 重置对话系统
   */
  reset() {
    this.dialogues = [];
    this.roundCount = 0;
    this.converged = false;
    for (const agent of this.agents.values()) {
      agent.history = [];
    }
  }
}

module.exports = { MultiAgentDialogue, VERSION };
