/**
 * HeartFlow v10.16.0 - 心流状态机
 * 集成 v2.2.0 的心流状态管理系统
 * 
 * 6 个心流状态：
 * IDLE → INITIATING → IN_FLOW → COMPLETED
 *              ↓         ↓
 *         DISTRACTED → RESTING
 */

class FlowStateMachine {
  constructor(config = {}) {
    this.states = {
      IDLE: {
        name: 'IDLE',
        description: '空闲状态',
        prompt: '准备进入心流状态，今天的目标是？',
        emoji: '😴',
        transitions: ['INITIATING']
      },
      INITIATING: {
        name: 'INITIATING',
        description: '启动状态',
        prompt: '准备进入心流状态，今天的目标是？',
        emoji: '🚀',
        transitions: ['IN_FLOW', 'DISTRACTED']
      },
      IN_FLOW: {
        name: 'IN_FLOW',
        description: '心流状态',
        prompt: '🌊 心流状态良好，继续保持！',
        emoji: '🌊',
        transitions: ['COMPLETED', 'DISTRACTED', 'RESTING']
      },
      DISTRACTED: {
        name: 'DISTRACTED',
        description: '分心状态',
        prompt: '感觉有些分心，要回到主任务上吗？',
        emoji: '😰',
        transitions: ['IN_FLOW', 'RESTING']
      },
      RESTING: {
        name: 'RESTING',
        description: '休息状态',
        prompt: '☕ 好好休息，准备好随时回来',
        emoji: '☕',
        transitions: ['IDLE', 'IN_FLOW']
      },
      COMPLETED: {
        name: 'COMPLETED',
        description: '完成状态',
        prompt: '🎉 任务完成！要生成心流报告吗？',
        emoji: '🎉',
        transitions: ['IDLE']
      }
    };
    
    this.currentState = 'IDLE';
    this.stateHistory = [];
    this.flowMetrics = {
      startTime: null,
      endTime: null,
      duration: 0,
      focusScore: 0,
      distractionCount: 0,
      completionRate: 0
    };
    
    this.config = {
      enableMetrics: config.enableMetrics !== false,
      enableFeedback: config.enableFeedback !== false,
      ...config
    };
  }

  /**
   * 转换状态
   */
  transitionTo(newState) {
    if (!this.states[newState]) {
      console.error(`❌ 无效的状态: ${newState}`);
      return false;
    }
    
    if (!this.states[this.currentState].transitions.includes(newState)) {
      console.error(`❌ 无法从 ${this.currentState} 转换到 ${newState}`);
      return false;
    }
    
    const oldState = this.currentState;
    this.currentState = newState;
    
    // 记录状态转换
    this.stateHistory.push({
      from: oldState,
      to: newState,
      timestamp: Date.now(),
      duration: this.calculateStateDuration(oldState)
    });
    
    // 更新指标
    this.updateMetrics(oldState, newState);
    
    console.log(`✓ 状态转换: ${oldState} → ${newState}`);
    return true;
  }

  /**
   * 获取当前状态信息
   */
  getCurrentState() {
    return {
      state: this.currentState,
      ...this.states[this.currentState],
      metrics: this.flowMetrics
    };
  }

  /**
   * 获取状态提示
   */
  getStatePrompt() {
    return this.states[this.currentState].prompt;
  }

  /**
   * 计算状态持续时间
   */
  calculateStateDuration(state) {
    if (this.stateHistory.length === 0) return 0;
    
    const lastEntry = this.stateHistory[this.stateHistory.length - 1];
    return Date.now() - lastEntry.timestamp;
  }

  /**
   * 更新指标
   */
  updateMetrics(fromState, toState) {
    if (toState === 'IN_FLOW') {
      this.flowMetrics.startTime = Date.now();
    }
    
    if (fromState === 'IN_FLOW') {
      this.flowMetrics.endTime = Date.now();
      this.flowMetrics.duration += this.flowMetrics.endTime - this.flowMetrics.startTime;
    }
    
    if (toState === 'DISTRACTED') {
      this.flowMetrics.distractionCount++;
    }
    
    // 计算专注度分数
    this.calculateFocusScore();
  }

  /**
   * 计算专注度分数 (0-100)
   */
  calculateFocusScore() {
    const totalTransitions = this.stateHistory.length;
    const flowTransitions = this.stateHistory.filter(h => h.to === 'IN_FLOW').length;
    const distractionTransitions = this.stateHistory.filter(h => h.to === 'DISTRACTED').length;
    
    if (totalTransitions === 0) {
      this.flowMetrics.focusScore = 0;
      return;
    }
    
    // 专注度 = (心流转换数 - 分心转换数) / 总转换数 * 100
    this.flowMetrics.focusScore = Math.max(0, 
      ((flowTransitions - distractionTransitions) / totalTransitions) * 100
    );
  }

  /**
   * 获取建议
   */
  getRecommendations() {
    const state = this.currentState;
    const recommendations = {
      IDLE: [
        '明确具体任务',
        '预估所需时间',
        '消除潜在干扰'
      ],
      INITIATING: [
        '设置专注时间块',
        '关闭通知',
        '准备必要工具'
      ],
      IN_FLOW: [
        '保持当前节奏',
        '避免打断',
        '记录进度'
      ],
      DISTRACTED: [
        '分解任务为小步骤',
        '寻求他人帮助',
        '调整期望值'
      ],
      RESTING: [
        '站起来走动',
        '喝水',
        '深呼吸'
      ],
      COMPLETED: [
        '记录成就',
        '反思学到的东西',
        '计划下一步'
      ]
    };
    
    return recommendations[state] || [];
  }

  /**
   * 生成心流报告
   */
  generateFlowReport() {
    const report = {
      timestamp: new Date().toISOString(),
      sessionDuration: this.flowMetrics.duration,
      focusScore: this.flowMetrics.focusScore.toFixed(2),
      distractionCount: this.flowMetrics.distractionCount,
      stateTransitions: this.stateHistory.length,
      stateBreakdown: this.getStateBreakdown(),
      recommendations: this.getRecommendations(),
      insights: this.generateInsights()
    };
    
    return report;
  }

  /**
   * 获取状态分布
   */
  getStateBreakdown() {
    const breakdown = {};
    
    for (const state of Object.keys(this.states)) {
      breakdown[state] = this.stateHistory.filter(h => h.to === state).length;
    }
    
    return breakdown;
  }

  /**
   * 生成洞察
   */
  generateInsights() {
    const insights = [];
    
    if (this.flowMetrics.focusScore > 80) {
      insights.push('🌟 优秀的专注力！保持这个状态。');
    } else if (this.flowMetrics.focusScore > 60) {
      insights.push('👍 不错的专注力，可以进一步改进。');
    } else {
      insights.push('⚠️ 专注力需要提高，考虑减少干扰。');
    }
    
    if (this.flowMetrics.distractionCount > 5) {
      insights.push('💡 分心次数较多，建议检查环境因素。');
    }
    
    if (this.flowMetrics.duration > 3600000) { // 1 小时
      insights.push('⏰ 长时间专注，记得休息！');
    }
    
    return insights;
  }

  /**
   * 获取状态历史
   */
  getStateHistory(limit = 10) {
    return this.stateHistory.slice(-limit);
  }

  /**
   * 重置状态机
   */
  reset() {
    this.currentState = 'IDLE';
    this.stateHistory = [];
    this.flowMetrics = {
      startTime: null,
      endTime: null,
      duration: 0,
      focusScore: 0,
      distractionCount: 0,
      completionRate: 0
    };
    
    console.log('✓ 状态机已重置');
  }

  /**
   * 导出状态数据
   */
  export() {
    return {
      version: '10.16.0',
      currentState: this.currentState,
      stateHistory: this.stateHistory,
      flowMetrics: this.flowMetrics,
      report: this.generateFlowReport()
    };
  }
}

// 导出
module.exports = FlowStateMachine;

// 使用示例
if (require.main === module) {
  const flow = new FlowStateMachine();
  
  console.log('🌊 心流状态机演示\n');
  
  // 模拟状态转换
  console.log('当前状态:', flow.getCurrentState().state);
  console.log('提示:', flow.getStatePrompt());
  
  flow.transitionTo('INITIATING');
  flow.transitionTo('IN_FLOW');
  
  console.log('\n📊 当前指标:');
  console.log(flow.getCurrentState().metrics);
  
  console.log('\n💡 建议:');
  flow.getRecommendations().forEach(r => console.log(`  - ${r}`));
  
  flow.transitionTo('DISTRACTED');
  flow.transitionTo('IN_FLOW');
  flow.transitionTo('COMPLETED');
  
  console.log('\n📈 心流报告:');
  console.log(flow.generateFlowReport());
}
