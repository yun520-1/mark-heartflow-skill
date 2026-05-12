/**
 * SelfAgent - 自我整合器
 * 周期性巡视工作空间，综合所有专家意见形成内心独白
 */

const { GlobalWorkspace } = require('../consciousness/global-workspace');
const { FocusAgent, MoodAgent, ReflectionAgent } = require('./base-agents');

class SelfAgent {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.workspace = new GlobalWorkspace(projectRoot);
    this.cycleInterval = null;
    this.lastInternalMonologue = null;
    
    this.registerExperts();
  }

  registerExperts() {
    this.workspace.registerAgent(new FocusAgent());
    this.workspace.registerAgent(new MoodAgent());
    this.workspace.registerAgent(new ReflectionAgent());
  }

  /**
   * 处理用户输入 - 触发完整认知周期
   */
  async process(userInput, context = {}) {
    const result = await this.workspace.cognitiveCycle(userInput, context);
    
    this.lastInternalMonologue = result.integratedThought;
    
    const finalResponse = this.generateResponse(result);
    
    return {
      consensus: result,
      internalMonologue: result.integratedThought,
      finalResponse: finalResponse,
      winner: result.winner
    };
  }

  /**
   * 生成最终响应
   */
  generateResponse(consensus) {
    const winnerOutput = consensus.winnerOutput;
    
    if (!winnerOutput || winnerOutput.length === 0) {
      return '我在这里。有什么可以帮助你的？';
    }

    return winnerOutput;
  }

  /**
   * 周期性自我巡视（后台模式）
   */
  startPeriodicReflection(intervalMs = 60000) {
    this.cycleInterval = setInterval(async () => {
      console.log('[SelfAgent] Periodic reflection cycle...');
      
      const status = this.workspace.getStatus();
      if (status.lastConsensus) {
        this.lastInternalMonologue = status.lastConsensus.integrated;
      }
    }, intervalMs);
    
    console.log(`[SelfAgent] Periodic reflection started (interval: ${intervalMs}ms)`);
  }

  stopPeriodicReflection() {
    if (this.cycleInterval) {
      clearInterval(this.cycleInterval);
      this.cycleInterval = null;
      console.log('[SelfAgent] Periodic reflection stopped');
    }
  }

  /**
   * 获取当前状态
   */
  getStatus() {
    return {
      workspace: this.workspace.getStatus(),
      lastMonologue: this.lastInternalMonologue ? 
        this.lastInternalMonologue.substring(0, 100) + '...' : null,
      isRunning: this.cycleInterval !== null
    };
  }

  /**
   * 获取黑板内容（调试用）
   */
  getBlackboard() {
    return this.workspace.getBlackboard();
  }
}

module.exports = { SelfAgent };
