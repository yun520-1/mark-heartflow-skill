/**
 * FocusAgent - 专注度监测代理
 * 负责监测用户专注度，并在分心时给出提示
 */

const { FLOW_STATE, getCurrentState } = require('../heartflow-engine.js');

class FocusAgent {
  constructor() {
    this.name = '专注助手';
    this.icon = '🎯';
    this.focusThreshold = 6; // 专注度阈值 (1-10)
    this.distractionKeywords = [
      '分心', '走神', '无聊', '玩手机', '刷网页', '看手机',
      '注意力', '集中', '专注', '干扰', '打扰'
    ];
  }

  /**
   * 分析用户输入的专注度
   * @param {string} userInput - 用户输入
   * @returns {object} 专注度分析结果
   */
  analyzeFocus(userInput) {
    const text = userInput.toLowerCase();
    let focusScore = 7; // 基础专注度
    let distractions = [];
    let suggestions = [];

    // 检测分心关键词
    this.distractionKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        focusScore -= 2;
        distractions.push(`检测到分心信号："${keyword}"`);
      }
    });

    // 检测任务相关词汇 (正面信号)
    const taskKeywords = ['任务', '目标', '完成', '继续', '开始', '工作', '代码', '写'];
    taskKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        focusScore += 1;
      }
    });

    // 归一化专注度 (1-10)
    focusScore = Math.max(1, Math.min(10, focusScore));

    // 生成建议
    if (focusScore < this.focusThreshold) {
      suggestions = [
        '📵 将手机放到视线之外',
        '🚫 关闭不必要的浏览器标签',
        '⏱️ 使用番茄工作法 (25 分钟专注)',
        '🎧 播放专注音乐或白噪音',
        '📝 写下分散注意力的想法，稍后处理'
      ];
    }

    return {
      agent: this.name,
      focusScore,
      isFocused: focusScore >= this.focusThreshold,
      distractions,
      suggestions,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 生成分心提示
   * @param {object} analysis - 专注度分析结果
   * @returns {string} 提示文本
   */
  generatePrompt(analysis) {
    if (analysis.isFocused) {
      return `${this.icon} ${analysis.focusScore}/10 - 专注度良好，继续保持！`;
    }

    let prompt = `${this.icon} ${analysis.focusScore}/10 - 感觉有些分心\n\n`;
    
    if (analysis.distractions.length > 0) {
      prompt += '检测到的干扰:\n';
      analysis.distractions.forEach(d => {
        prompt += `  - ${d}\n`;
      });
      prompt += '\n';
    }

    prompt += '建议尝试:\n';
    analysis.suggestions.slice(0, 3).forEach(s => {
      prompt += `${s}\n`;
    });

    return prompt;
  }

  /**
   * 主动干预 (当检测到持续分心时)
   * @param {object} state - 当前心流状态
   * @returns {string} 干预文本
   */
  intervene(state) {
    const duration = state?.duration || 0;
    
    if (duration > 10) {
      return `${this.icon} 已经分心 ${duration} 分钟了，要试试 4-7-8 呼吸法吗？
      
吸气 4 秒 → 屏息 7 秒 → 呼气 8 秒
重复 3-4 次，帮助重新集中注意力`;
    }

    return `${this.icon} 注意到你有些分心，需要帮助吗？`;
  }
}

module.exports = FocusAgent;
