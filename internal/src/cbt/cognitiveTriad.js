/**
 * 认知三角分析器
 * 基于 CBT 理论：思想 → 情感 → 行为相互影响
 */

const CognitiveTriad = {
  THOUGHTS: 'thoughts',
  EMOTIONS: 'emotions',
  BEHAVIORS: 'behaviors'
};

// 认知要素关键词库
const ThoughtKeywords = [
  '我觉得', '我认为', '我想', '应该', '必须', '一定',
  '总是', '从不', '所有', '每个', '没有', '不可能',
  '如果...就...', '除非', '只有...才...'
];

const EmotionKeywords = [
  '感觉', '感到', '情绪', '心情', '害怕', '担心', '焦虑',
  '难过', '伤心', '愤怒', '生气', '沮丧', '失望', '开心',
  '兴奋', '紧张', '压力', '累', '疲惫', '孤独', '无助'
];

const BehaviorKeywords = [
  '做了', '去做', '想要', '避免', '逃避', '拖延',
  '开始', '停止', '继续', '尝试', '放弃', '努力',
  '说话', '行动', '反应', '选择', '决定'
];

class CognitiveTriadAnalyzer {
  /**
   * 分析用户输入中的认知三角要素
   * @param {string} userInput - 用户输入
   * @returns {Object} 分析结果
   */
  analyze(userInput) {
    const result = {
      thoughts: [],
      emotions: [],
      behaviors: [],
      connections: [],
      dominantElement: null
    };

    // 分析思想
    result.thoughts = this._extractThoughts(userInput);
    
    // 分析情感
    result.emotions = this._extractEmotions(userInput);
    
    // 分析行为
    result.behaviors = this._extractBehaviors(userInput);
    
    // 分析连接
    result.connections = this._analyzeConnections(result);
    
    // 确定主导要素
    result.dominantElement = this._getDominantElement(result);

    return result;
  }

  /**
   * 提取思想要素
   */
  _extractThoughts(text) {
    const thoughts = [];
    
    // 检测认知扭曲关键词
    if (text.match(/(总是|从不|所有|每个|完全|绝对)/)) {
      thoughts.push({
        type: 'extreme_thinking',
        text: '极端化思维',
        confidence: 0.8
      });
    }
    
    if (text.match(/(应该|必须|一定|得)/)) {
      thoughts.push({
        type: 'should_statement',
        text: '"应该"陈述',
        confidence: 0.7
      });
    }
    
    if (text.match(/(如果.*就.*|除非.*否则)/)) {
      thoughts.push({
        type: 'conditional_thinking',
        text: '条件化思维',
        confidence: 0.6
      });
    }

    // 提取信念表达
    if (text.match(/(我觉得.*|我认为.*|我想.*)/)) {
      const match = text.match(/(我觉得 | 我认为 | 我想)(.*?)(。|，|！|？|$)/);
      if (match) {
        thoughts.push({
          type: 'belief',
          text: match[2].trim(),
          confidence: 0.9
        });
      }
    }

    return thoughts;
  }

  /**
   * 提取情感要素
   */
  _extractEmotions(text) {
    const emotions = [];
    
    // 直接情感表达
    const emotionMatches = text.match(/(感到 | 觉得|感觉|很|太)(\w{1,3})(情绪|感|心情)/);
    if (emotionMatches) {
      emotions.push({
        type: 'direct_expression',
        text: emotionMatches[0],
        confidence: 0.9
      });
    }

    // 具体情绪词
    const specificEmotions = {
      '焦虑': 'anxiety',
      '担心': 'worry',
      '害怕': 'fear',
      '难过': 'sadness',
      '伤心': 'sadness',
      '愤怒': 'anger',
      '生气': 'anger',
      '沮丧': 'frustration',
      '失望': 'disappointment',
      '开心': 'happiness',
      '兴奋': 'excitement',
      '紧张': 'nervousness',
      '压力': 'stress',
      '累': 'exhaustion',
      '疲惫': 'exhaustion',
      '孤独': 'loneliness',
      '无助': 'helplessness'
    };

    for (const [emotion, type] of Object.entries(specificEmotions)) {
      if (text.includes(emotion)) {
        emotions.push({
          type: type,
          text: emotion,
          confidence: 0.95
        });
      }
    }

    return emotions;
  }

  /**
   * 提取行为要素
   */
  _extractBehaviors(text) {
    const behaviors = [];

    // 行为倾向
    if (text.match(/(不想|不想去|不想做)/)) {
      behaviors.push({
        type: 'avoidance',
        text: '回避倾向',
        confidence: 0.8
      });
    }

    if (text.match(/(想要|想尝试|打算)/)) {
      behaviors.push({
        type: 'approach',
        text: '接近倾向',
        confidence: 0.7
      });
    }

    if (text.match(/(拖延|推迟|明天再说)/)) {
      behaviors.push({
        type: 'procrastination',
        text: '拖延行为',
        confidence: 0.85
      });
    }

    // 具体行为描述
    const actionMatches = text.match(/(做了 | 去|准备|开始|停止|继续)(\w{2,4})/);
    if (actionMatches) {
      behaviors.push({
        type: 'action',
        text: actionMatches[0],
        confidence: 0.75
      });
    }

    return behaviors;
  }

  /**
   * 分析三要素之间的连接
   */
  _analyzeConnections(triad) {
    const connections = [];

    // 思想 → 情感连接
    if (triad.thoughts.length > 0 && triad.emotions.length > 0) {
      connections.push({
        from: 'thoughts',
        to: 'emotions',
        type: 'cognitive_emotional_link',
        description: '思维模式可能正在影响情绪状态'
      });
    }

    // 情感 → 行为连接
    if (triad.emotions.length > 0 && triad.behaviors.length > 0) {
      connections.push({
        from: 'emotions',
        to: 'behaviors',
        type: 'emotional_behavioral_link',
        description: '情绪状态可能正在驱动行为反应'
      });
    }

    // 思想 → 行为连接
    if (triad.thoughts.length > 0 && triad.behaviors.length > 0) {
      connections.push({
        from: 'thoughts',
        to: 'behaviors',
        type: 'cognitive_behavioral_link',
        description: '信念可能正在影响行为选择'
      });
    }

    return connections;
  }

  /**
   * 确定主导要素
   */
  _getDominantElement(triad) {
    const counts = {
      thoughts: triad.thoughts.length,
      emotions: triad.emotions.length,
      behaviors: triad.behaviors.length
    };

    const maxCount = Math.max(...Object.values(counts));
    
    if (maxCount === 0) return null;

    const dominant = Object.keys(counts).find(key => counts[key] === maxCount);
    return dominant;
  }

  /**
   * 生成 CBT 导向的回应
   */
  generateResponse(triad, userInput) {
    const responses = [];

    // 基于主导要素生成回应
    if (triad.dominantElement === 'thoughts') {
      responses.push(this._generateThoughtResponse(triad.thoughts));
    } else if (triad.dominantElement === 'emotions') {
      responses.push(this._generateEmotionResponse(triad.emotions));
    } else if (triad.dominantElement === 'behaviors') {
      responses.push(this._generateBehaviorResponse(triad.behaviors));
    }

    // 如果有连接，添加连接相关的回应
    if (triad.connections.length > 0) {
      responses.push(this._generateConnectionResponse(triad.connections));
    }

    return responses;
  }

  _generateThoughtResponse(thoughts) {
    const thought = thoughts[0];
    
    if (thought.type === 'extreme_thinking') {
      return {
        type: 'gentle_challenge',
        text: '我注意到你可能在用比较绝对的方式看待这件事。有没有可能存在一些中间地带？',
        cbtTechnique: '识别极端化思维'
      };
    }
    
    if (thought.type === 'should_statement') {
      return {
        type: 'reframe',
        text: '你用了"应该"这个词。这个标准对你来说合理吗？有没有可能更灵活一些？',
        cbtTechnique: '挑战"应该"陈述'
      };
    }

    return {
      type: 'explore',
      text: '这个想法对你有什么影响？它对你有帮助吗？',
      cbtTechnique: '思维功能评估'
    };
  }

  _generateEmotionResponse(emotions) {
    const emotion = emotions[0];
    
    return {
      type: 'validate',
      text: `我能理解你感到${emotion.text}。这种感受是很自然的，很多人遇到类似情况都会有这样的反应。`,
      cbtTechnique: '情感验证'
    };
  }

  _generateBehaviorResponse(behaviors) {
    const behavior = behaviors[0];
    
    if (behavior.type === 'avoidance') {
      return {
        type: 'explore',
        text: '你提到不太想面对这件事。能说说是什么让你想要回避吗？',
        cbtTechnique: '探索回避原因'
      };
    }

    return {
      type: 'explore',
      text: '这个行为选择对你来说意味着什么？',
      cbtTechnique: '行为意义探索'
    };
  }

  _generateConnectionResponse(connections) {
    const connection = connections[0];
    
    if (connection.type === 'cognitive_emotional_link') {
      return {
        type: 'insight',
        text: '我注意到你的想法和感受之间可能有联系。有时候我们的思维模式会影响情绪，你注意到这种关联了吗？',
        cbtTechnique: '认知 - 情感连接'
      };
    }

    return {
      type: 'insight',
      text: '看起来这几个方面是相互影响的，这是很自然的现象。',
      cbtTechnique: '整体观'
    };
  }
}

module.exports = {
  CognitiveTriad,
  CognitiveTriadAnalyzer
};
