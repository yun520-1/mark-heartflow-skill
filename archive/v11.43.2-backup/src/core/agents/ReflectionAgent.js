/**
 * ReflectionAgent - 反思总结代理
 * 负责在会话结束时，总结本次心流体验并提出改进建议
 */

// 动态加载 report-generator，如果不存在则使用默认实现
let generateReport;
try {
  generateReport = require('../../../.opencode/memory/report-generator.js').generateReport;
} catch (e) {
  // 默认实现
  generateReport = (sessionData) => ({
    timestamp: new Date().toISOString(),
    duration: sessionData.endTime - sessionData.startTime,
    flowStates: sessionData.flowStates || [],
    distractions: sessionData.distractions || [],
    achievements: sessionData.achievements || [],
    moodChanges: sessionData.moodChanges || [],
    summary: `本次会话共进入心流状态 ${(sessionData.flowStates || []).length} 次`,
    suggestions: []
  });
}

class ReflectionAgent {
  constructor() {
    this.name = '反思助手';
    this.icon = '🪞';
    this.sessionData = {
      startTime: null,
      endTime: null,
      flowStates: [],
      distractions: [],
      achievements: [],
      moodChanges: []
    };
  }

  /**
   * 记录心流状态
   * @param {string} state - 心流状态
   * @param {number} duration - 持续时间 (分钟)
   */
  recordFlowState(state, duration) {
    this.sessionData.flowStates.push({
      state,
      duration,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 记录分心事件
   * @param {string} reason - 分心原因
   * @param {number} duration - 分心时长 (分钟)
   */
  recordDistraction(reason, duration) {
    this.sessionData.distractions.push({
      reason,
      duration,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 记录成就
   * @param {string} achievement - 成就描述
   */
  recordAchievement(achievement) {
    this.sessionData.achievements.push({
      achievement,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 记录情绪变化
   * @param {string} mood - 情绪标签
   * @param {number} intensity - 强度 (1-10)
   */
  recordMoodChange(mood, intensity) {
    this.sessionData.moodChanges.push({
      mood,
      intensity,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 生成会话总结
   * @returns {object} 总结报告
   */
  generateSessionSummary() {
    const { flowStates, distractions, achievements, moodChanges } = this.sessionData;
    
    // 计算总心流时间
    const totalFlowTime = flowStates
      .filter(s => s.state === 'IN_FLOW')
      .reduce((sum, s) => sum + s.duration, 0);
    
    // 计算分心次数
    const distractionCount = distractions.length;
    
    // 计算成就数
    const achievementCount = achievements.length;
    
    // 计算平均情绪
    const avgMood = moodChanges.length > 0
      ? moodChanges.reduce((sum, m) => sum + m.intensity, 0) / moodChanges.length
      : 5;

    // 生成改进建议
    const improvements = this.generateImprovements(flowStates, distractions, moodChanges);

    return {
      agent: this.name,
      duration: this.getSessionDuration(),
      totalFlowTime,
      distractionCount,
      achievementCount,
      avgMood: avgMood.toFixed(1),
      improvements,
      highlights: achievements.map(a => a.achievement),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 生成改进建议
   */
  generateImprovements(flowStates, distractions, moodChanges) {
    const improvements = [];

    // 基于心流时间
    const totalFlow = flowStates.filter(s => s.state === 'IN_FLOW').reduce((sum, s) => sum + s.duration, 0);
    if (totalFlow < 25) {
      improvements.push('⏱️ 心流时间较短，建议尝试番茄工作法 (25 分钟专注)');
    } else if (totalFlow > 90) {
      improvements.push('💪 心流时间很长，记得适当休息，避免疲劳');
    }

    // 基于分心次数
    if (distractions.length > 3) {
      improvements.push('📵 分心次数较多，建议：\n  - 关闭通知\n  - 使用专注模式\n  - 告知他人勿扰');
    }

    // 基于情绪变化
    const negativeMoods = moodChanges.filter(m => m.intensity < 4);
    if (negativeMoods.length > 2) {
      improvements.push('💙 情绪波动较大，建议：\n  - 记录情绪触发点\n  - 练习正念呼吸\n  - 适当调整任务难度');
    }

    if (improvements.length === 0) {
      improvements.push('🌟 表现很好！继续保持当前的节奏和方法');
    }

    return improvements;
  }

  /**
   * 计算会话时长
   */
  getSessionDuration() {
    if (!this.sessionData.startTime) return 0;
    const end = this.sessionData.endTime || new Date();
    return Math.round((end - this.sessionData.startTime) / 60000);
  }

  /**
   * 生成反思报告
   * @param {object} summary - 会话总结
   * @returns {string} 报告文本
   */
  generateReport(summary) {
    let report = `${this.icon} 本次心流会话总结\n\n`;
    report += '═'.repeat(40) + '\n\n';
    
    report += `⏱️ 会话时长：${summary.duration} 分钟\n`;
    report += `🌊 心流时间：${summary.totalFlowTime} 分钟\n`;
    report += `⚠️ 分心次数：${summary.distractionCount} 次\n`;
    report += `🏆 完成成就：${summary.achievementCount} 个\n`;
    report += `💙 平均情绪：${summary.avgMood}/10\n\n`;
    
    if (summary.highlights.length > 0) {
      report += '✨ 高光时刻:\n';
      summary.highlights.forEach(h => {
        report += `  • ${h}\n`;
      });
      report += '\n';
    }
    
    report += '💡 改进建议:\n';
    summary.improvements.forEach(i => {
      report += `${i}\n\n`;
    });
    
    report += '═'.repeat(40) + '\n';
    report += `生成时间：${summary.timestamp}\n`;

    return report;
  }

  /**
   * 开始新会话
   */
  startSession() {
    this.sessionData = {
      startTime: new Date(),
      endTime: null,
      flowStates: [],
      distractions: [],
      achievements: [],
      moodChanges: []
    };
    return { success: true, message: '新会话开始' };
  }

  /**
   * 结束会话
   */
  endSession() {
    this.sessionData.endTime = new Date();
    return this.generateSessionSummary();
  }

  /**
   * 重置代理
   */
  reset() {
    this.sessionData = {
      startTime: null,
      endTime: null,
      flowStates: [],
      distractions: [],
      achievements: [],
      moodChanges: []
    };
    return { success: true, message: '反思助手已重置' };
  }
}

module.exports = ReflectionAgent;
