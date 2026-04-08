/**
 * AgentManager - 多智能体管理器
 * 负责协调 FocusAgent, MoodAgent, ReflectionAgent
 */

const FocusAgent = require('./FocusAgent.js');
const MoodAgent = require('./MoodAgent.js');
const ReflectionAgent = require('./ReflectionAgent.js');

class AgentManager {
  constructor() {
    this.agents = {
      focus: new FocusAgent(),
      mood: new MoodAgent(),
      reflection: new ReflectionAgent()
    };
    this.activeAgent = null;
  }

  /**
   * 获取代理
   * @param {string} agentName - 代理名称 (focus/mood/reflection)
   * @returns {object} 代理实例
   */
  getAgent(agentName) {
    return this.agents[agentName] || null;
  }

  /**
   * 根据上下文自动选择代理
   * @param {string} userInput - 用户输入
   * @returns {string} 代理名称
   */
  selectAgent(userInput) {
    const text = userInput.toLowerCase();
    
    // 检测用户明确指定代理
    if (text.includes('专注') || text.includes('分心') || text.includes('注意力')) {
      return 'focus';
    }
    
    if (text.includes('情绪') || text.includes('心情') || text.includes('鼓励') || text.includes('沮丧') || text.includes('累')) {
      return 'mood';
    }
    
    if (text.includes('总结') || text.includes('反思') || text.includes('结束') || text.includes('报告')) {
      return 'reflection';
    }
    
    // 默认返回 null (由主引擎处理)
    return null;
  }

  /**
   * 处理用户输入
   * @param {string} userInput - 用户输入
   * @param {string} agentName - 指定代理 (可选)
   * @returns {object} 代理响应
   */
  processInput(userInput, agentName = null) {
    // 如果指定了代理
    if (agentName && this.agents[agentName]) {
      return this.invokeAgent(agentName, userInput);
    }
    
    // 自动选择代理
    const selected = this.selectAgent(userInput);
    if (selected) {
      return this.invokeAgent(selected, userInput);
    }
    
    // 没有匹配的代理
    return {
      agent: null,
      message: '没有检测到需要代理介入的信号'
    };
  }

  /**
   * 调用代理
   * @param {string} agentName - 代理名称
   * @param {string} userInput - 用户输入
   * @returns {object} 代理响应
   */
  invokeAgent(agentName, userInput) {
    const agent = this.agents[agentName];
    this.activeAgent = agentName;
    
    switch (agentName) {
      case 'focus':
        const focusAnalysis = agent.analyzeFocus(userInput);
        return {
          agent: agent.name,
          icon: agent.icon,
          content: agent.generatePrompt(focusAnalysis),
          data: focusAnalysis
        };
      
      case 'mood':
        const moodAnalysis = agent.analyzeMood(userInput);
        return {
          agent: agent.name,
          icon: agent.icon,
          content: agent.encourage(moodAnalysis),
          data: moodAnalysis
        };
      
      case 'reflection':
        const summary = agent.endSession();
        return {
          agent: agent.name,
          icon: agent.icon,
          content: agent.generateReport(summary),
          data: summary
        };
      
      default:
        return {
          agent: null,
          message: '未知代理'
        };
    }
  }

  /**
   * 开始新会话
   */
  startSession() {
    this.agents.reflection.startSession();
    return { success: true, message: '多智能体会话开始' };
  }

  /**
   * 结束会话
   */
  endSession() {
    return this.agents.reflection.endSession();
  }

  /**
   * 获取所有代理状态
   */
  getStatus() {
    return {
      activeAgent: this.activeAgent,
      availableAgents: Object.keys(this.agents),
      sessionDuration: this.agents.reflection.getSessionDuration()
    };
  }

  /**
   * 重置所有代理
   */
  reset() {
    this.activeAgent = null;
    this.agents.reflection.reset();
    return { success: true, message: '所有代理已重置' };
  }
}

module.exports = AgentManager;
