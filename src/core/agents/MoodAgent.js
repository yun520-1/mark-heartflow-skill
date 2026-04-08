/**
 * MoodAgent - 情绪分析代理
 * 负责分析用户情绪，并给予情感支持
 */

const { detectEmotionFromText, calculatePADState } = require('../heartflow-engine.js');

class MoodAgent {
  constructor() {
    this.name = '情绪助手';
    this.icon = '💙';
    this.emotionStates = {
      positive: ['开心', '高兴', '满意', '顺利', '完成', '成功', '棒', '好'],
      negative: ['烦', '累', '难', '挫败', '无聊', '讨厌', '糟糕', '失败', '困惑', '焦虑'],
      neutral: ['嗯', '哦', '好的', '行', '可以']
    };
  }

  /**
   * 分析用户情绪
   * @param {string} userInput - 用户输入
   * @returns {object} 情绪分析结果
   */
  analyzeMood(userInput) {
    const emotion = detectEmotionFromText(userInput);
    const pad = calculatePADState(emotion.pleasure, emotion.arousal, emotion.dominance);
    
    // 情绪分类
    let moodCategory = 'neutral';
    if (emotion.pleasure > 2) moodCategory = 'positive';
    else if (emotion.pleasure < -2) moodCategory = 'negative';
    
    // 情绪标签
    let moodLabel = '平静';
    if (emotion.pleasure > 5 && emotion.arousal > 3) moodLabel = '兴奋';
    else if (emotion.pleasure > 3) moodLabel = '愉悦';
    else if (emotion.pleasure < -5 && emotion.arousal > 3) moodLabel = '焦虑';
    else if (emotion.pleasure < -3) moodLabel = '挫败';
    else if (emotion.arousal < -3) moodLabel = '疲惫';
    
    // 生成支持建议
    const support = this.generateSupport(moodCategory, moodLabel, pad);

    return {
      agent: this.name,
      moodCategory,
      moodLabel,
      pad,
      support,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 生成情感支持
   * @param {string} category - 情绪类别
   * @param {string} label - 情绪标签
   * @param {object} pad - PAD 状态
   * @returns {string[]} 支持建议
   */
  generateSupport(category, label, pad) {
    const supports = {
      positive: [
        '🌟 太棒了！保持这个状态！',
        '💪 你的努力正在得到回报',
        '🎉 为自己今天的进步感到骄傲'
      ],
      negative: [
        '💙 我理解你的感受，这很正常',
        '🌱 每一次挑战都是成长的机会',
        '🤗 你已经做得很好了，休息一下没关系',
        '🌈 困难是暂时的，你比想象中更强大',
        '💪 让我们一起分解这个任务，一步一步来'
      ],
      neutral: [
        '😊 平稳的状态很好',
        '🎯 准备好继续前进吗？',
        '💫 今天有什么想完成的吗？'
      ]
    };

    // 根据 PAD 调整支持
    if (pad.dominance < 0) {
      supports.negative.unshift('🔑 你掌控着自己的节奏，按自己的方式来');
    }
    
    if (pad.arousal < -5) {
      supports.negative.unshift('☕ 先休息一下吧，喝杯水，活动一下');
    }

    return supports[category] || supports.neutral;
  }

  /**
   * 生成鼓励语
   * @param {object} analysis - 情绪分析结果
   * @returns {string} 鼓励文本
   */
  encourage(analysis) {
    const supports = this.generateSupport(analysis.moodCategory, analysis.moodLabel, analysis.pad);
    
    let prompt = `${this.icon} ${analysis.moodLabel} (P:${analysis.pad.pleasure} A:${analysis.pad.arousal} D:${analysis.pad.dominance})\n\n`;
    
    prompt += supports.slice(0, 2).join('\n') + '\n\n';
    
    if (analysis.moodCategory === 'negative') {
      prompt += '需要我帮你做什么吗？\n';
      prompt += '  • 分解任务\n';
      prompt += '  • 调整难度\n';
      prompt += '  • 或者只是倾听';
    }

    return prompt;
  }

  /**
   * 主动关怀 (检测到低落情绪时)
   * @param {object} analysis - 情绪分析结果
   * @returns {string} 关怀文本
   */
  checkIn(analysis) {
    if (analysis.moodCategory === 'negative' && analysis.pad.pleasure < -5) {
      return `${this.icon} 注意到你情绪有些低落，想聊聊吗？

记住：
- 你的感受是有效的
- 寻求帮助是勇敢的表现
- 你并不孤单

如果需要专业支持：
📞 心理援助热线：400-161-9995`;
    }

    return `${this.icon} 今天感觉怎么样？`;
  }
}

module.exports = MoodAgent;
