/**
 * Base Agent - 专家智能体基类
 */

class BaseAgent {
  constructor(name) {
    this.name = name;
    this.messageCount = 0;
  }

  async process(input, context) {
    throw new Error('process() must be implemented');
  }

  async getAttentionPriority(input, context) {
    return { priority: 0.5, confidence: 0.5 };
  }
}

/**
 * Focus Agent - 聚焦与任务智能体
 */
class FocusAgent extends BaseAgent {
  constructor() {
    super('Focus');
  }

  async process(input, context = {}) {
    this.messageCount++;
    
    const keywords = ['任务', '完成', '工作', '目标', '下一步', '如何', '怎么办'];
    const hasTask = keywords.some(k => input.toLowerCase().includes(k));
    
    if (hasTask) {
      return `聚焦任务：用户需要解决"${input.substring(0, 20)}..."相关的问题。建议提供具体步骤和清晰指引。`;
    }
    
    return `当前对话暂无明确任务需求，保持观察。`;
  }

  async getAttentionPriority(input, context = {}) {
    const taskKeywords = ['任务', '完成', '目标', '下一步', '如何', '怎么办', 'help', 'do'];
    const matchCount = taskKeywords.filter(k => input.toLowerCase().includes(k)).length;
    
    return {
      priority: Math.min(1, matchCount * 0.3 + 0.2),
      confidence: 0.8
    };
  }
}

/**
 * Mood Agent - 情绪感知智能体
 */
class MoodAgent extends BaseAgent {
  constructor() {
    super('Mood');
  }

  async process(input, context = {}) {
    this.messageCount++;
    
    const emotionKeywords = {
      positive: ['好', '棒', '优秀', '喜欢', '感谢', '谢谢', 'happy', 'great'],
      negative: ['难', '累', '烦', '沮丧', '失望', '无奈', 'bad', 'frustrated'],
      neutral: ['请问', '什么是', '怎么', '?'
      ]
    };
    
    const text = input.toLowerCase();
    let emotion = 'neutral';
    
    for (const kw of emotionKeywords.positive) {
      if (text.includes(kw)) { emotion = 'positive'; break; }
    }
    for (const kw of emotionKeywords.negative) {
      if (text.includes(kw)) { emotion = 'negative'; break; }
    }
    
    return `情绪感知：检测到${emotion}情绪倾向。${emotion === 'negative' ? '需要共情和安抚。' : emotion === 'positive' ? '正向反馈，可适当积极回应。' : '保持中性客观。'}`;
  }

  async getAttentionPriority(input, context = {}) {
    const emotionKeywords = ['好', '棒', '累', '烦', '沮丧', '失望', '开心', '难过', '!', '?', '...'];
    const matchCount = emotionKeywords.filter(k => input.includes(k)).length;
    
    return {
      priority: Math.min(1, matchCount * 0.2 + 0.3),
      confidence: 0.75
    };
  }
}

/**
 * Reflection Agent - 反思智能体
 */
class ReflectionAgent extends BaseAgent {
  constructor() {
    super('Reflection');
    this.history = [];
  }

  async process(input, context = {}) {
    this.messageCount++;
    
    const reflectionTriggers = ['为什么', '如何思考', '反思', '意义', '本质', '为什么', 'why', 'think about'];
    const shouldReflect = reflectionTriggers.some(k => input.toLowerCase().includes(k));
    
    if (shouldReflect) {
      return `反思洞察：这是一个值得深思的问题。从系统角度，建议先明确核心需求，再逐步展开。`;
    }
    
    return `当前无需深度反思，保持常规交互。`;
  }

  async getAttentionPriority(input, context = {}) {
    const deepKeywords = ['为什么', '如何思考', '反思', '意义', '本质', 'why', 'meaning'];
    const matchCount = deepKeywords.filter(k => input.toLowerCase().includes(k)).length;
    
    return {
      priority: Math.min(1, matchCount * 0.4 + 0.1),
      confidence: 0.7
    };
  }
}

module.exports = { BaseAgent, FocusAgent, MoodAgent, ReflectionAgent };
