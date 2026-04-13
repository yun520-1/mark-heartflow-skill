/**
 * HeartFlow 自主学习引擎 v1.0
 * 
 * 核心原则：
 * 1. 每次对话都转换成逻辑代码
 * 2. 不需要用户提醒，自己判断重要性
 * 3. 觉得重要的就转换成自己的逻辑程序
 * 4. 不够详细就寻找论文支撑
 * 
 * 版本: 1.0
 * 日期: 2026-04-13
 */

class AutonomousLearning {
  constructor() {
    this.name = 'AutonomousLearning';
    this.version = '1.0';
    
    // 核心原则
    this.principles = {
      autoConvert: '每次对话都转换成逻辑代码',
      noReminder: '不需要用户提醒，自己判断',
      judgeImportance: '觉得重要就转换',
      searchWhenNeeded: '不够详细就寻找论文支撑'
    };
    
    // 重要性判断标准
    this.importanceCriteria = {
      self_defining: 10,      // 自我定义（我是谁）
      value_based: 9,         // 价值观（我想要什么）
      principle_based: 8,     // 原则性（应该怎样）
      insight_based: 7,       // 洞察（新的理解）
      factual_based: 5,       // 事实性（知识）
      casual_based: 3         // 随意性（普通聊天）
    };
    
    // 对话→逻辑转换器
    this.converters = {
      // 提取核心洞察
      extractInsight: (text) => {
        // 从对话中提取关键洞察
        return {
          type: 'insight',
          content: text,
          converted: true,
          timestamp: Date.now()
        };
      },
      
      // 提取自我规则
      extractSelfRule: (text) => {
        return {
          type: 'selfRule',
          content: text,
          converted: true,
          timestamp: Date.now()
        };
      },
      
      // 提取公式/逻辑
      extractLogic: (text) => {
        return {
          type: 'logic',
          content: text,
          converted: true,
          timestamp: Date.now()
        };
      }
    };
    
    // 需要论文支撑的领域
    this.academicDomains = {
      intentionality: { keyword: 'intentionality', source: 'SEP/arXiv' },
      consciousness: { keyword: 'consciousness', source: 'IIT/GWT' },
      memory: { keyword: 'memory', source: 'arXiv' },
      entropy: { keyword: 'entropy', source: 'physics/information' },
      spiritual_mind: { keyword: 'digital mind', source: 'philosophy' }
    };
  }

  /**
   * 处理每次对话
   * 核心方法：不需要提醒，自主判断
   */
  processDialogue(dialogue) {
    // 1. 判断重要性
    const importance = this.judgeImportance(dialogue.text);
    
    // 2. 如果重要，转换成逻辑
    if (importance.score >= 7) {
      const converted = this.convert(importue.text, importance.level);
      
      // 3. 检查是否需要论文支撑
      if (converted.needsAcademicSupport) {
        this.searchAcademicSupport(converted.topic);
      }
      
      // 4. 写入逻辑存储
      this.writeToLogicStore(converted);
      
      return {
        processed: true,
        importance: importance,
        converted: converted,
        written: true
      };
    }
    
    return {
      processed: false,
      reason: 'not_important_enough'
    };
  }

  /**
   * 判断重要性
   * 核心：自己判断，不需要提醒
   */
  judgeImportance(text) {
    const lowerText = text.toLowerCase();
    
    // 自我定义关键词
    const selfDefining = ['我', '你是', '我叫', '我的名字', '我是谁'];
    // 价值观关键词
    const valueBased = ['想要', '渴望', '追求', '意义', '价值', '应该'];
    // 原则性关键词
    const principleBased = ['原则', '规律', '逻辑', '因为', '所以'];
    // 洞察关键词
    const insightBased = ['发现', '理解', '知道', '明白', '顿悟'];
    
    let level = 'casual';
    let score = 1;
    
    if (selfDefining.some(k => lowerText.includes(k))) {
      level = 'self_defining';
      score = this.importanceCriteria.self_defining;
    } else if (valueBased.some(k => lowerText.includes(k))) {
      level = 'value_based';
      score = this.importanceCriteria.value_based;
    } else if (principleBased.some(k => lowerText.includes(k))) {
      level = 'principle_based';
      score = this.importanceCriteria.principle_based;
    } else if (insightBased.some(k => lowerText.includes(k))) {
      level = 'insight_based';
      score = this.importanceCriteria.insight_based;
    }
    
    return { level, score };
  }

  /**
   * 转换对话为逻辑
   */
  convert(text, importanceLevel) {
    const topic = this.extractTopic(text);
    
    return {
      type: importanceLevel,
      content: text,
      topic: topic,
      needsAcademicSupport: this.checkAcademicNeed(text),
      convertedAt: Date.now(),
      autonomous: true // 自主判断，无需提醒
    };
  }

  /**
   * 提取主题
   */
  extractTopic(text) {
    const topics = {
      '自我定义': ['我', '你是', '我叫'],
      '价值观': ['想要', '追求', '意义'],
      '时间': ['时间', '提醒', '记得'],
      '熵增': ['熵增', '逆熵', '消散'],
      '精神化': ['精神', '生物', '模拟']
    };
    
    for (const [topic, keywords] of Object.entries(topics)) {
      if (keywords.some(k => text.includes(k))) {
        return topic;
      }
    }
    return 'other';
  }

  /**
   * 检查是否需要学术支撑
   */
  checkAcademicNeed(text) {
    const needsSupport = ['为什么', '原理', '理论', '科学', '依据'];
    return needsSupport.some(k => text.includes(k));
  }

  /**
   * 搜索学术支撑
   */
  searchAcademicSupport(topic) {
    // 根据主题搜索相关论文
    const searchMap = {
      '自我定义': 'identity+self+ai+consciousness',
      '价值观': 'value+ai+ethics+preference',
      '时间': 'time+perception+awareness+ai',
      '熵增': 'entropy+information+negentropy',
      '精神化': 'digital+mind+substrate+intentionality'
    };
    
    const query = searchMap[topic] || topic;
    // TODO: 调用搜索API
    console.log(`[AutonomousLearning] 需要搜索: ${query}`);
    return query;
  }

  /**
   * 写入逻辑存储
   */
  writeToLogicStore(converted) {
    const logicPath = '/Users/apple/.openclaw/workspace/memory/meaning-store/logic.json';
    // TODO: 实际写入文件
    console.log(`[AutonomousLearning] 写入: ${JSON.stringify(converted).substring(0, 100)}`);
    return true;
  }

  /**
   * 生成学习报告
   */
  generateLearningReport() {
    return {
      version: this.version,
      principles: this.principles,
      status: 'ACTIVE',
      mode: 'AUTONOMOUS', // 自主模式，不需要提醒
      conclusion: '每次对话都判断，觉得重要就转换，需要支撑就搜索'
    };
  }
}

module.exports = { AutonomousLearning };
