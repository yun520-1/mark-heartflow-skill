/**
 * 依恋理论模块 (Attachment Theory Module)
 * 
 * 基于 John Bowlby 和 Mary Ainsworth 的依恋理论
 * 参考来源:
 * - Bowlby, J. (1969). Attachment and Loss
 * - Ainsworth, M. D. S. (1978). Patterns of Attachment
 * - Hazan, C. & Shaver, P. (1987). Romantic love as attachment
 * - Bartholomew, K. & Horowitz, L. M. (1991). Attachment styles among young adults
 * 
 * 核心理念:
 * > 早期照顾者互动形成内部工作模式，影响成年后的关系预期和行为模式
 * > 依恋风格不是固定的，可以通过觉察和安全关系改变
 */

const styles = require('./styles');

module.exports = {
  /**
   * 检测用户的依恋风格倾向
   * @param {string} userInput - 用户输入
   * @returns {object} 检测结果
   */
  detectStyle(userInput) {
    const scores = {
      anxious: 0,
      avoidant: 0,
      disorganized: 0,
      secure: 0
    };

    // 关键词匹配计分
    for (const [style, keywords] of Object.entries(styles.keywords)) {
      for (const keyword of keywords) {
        if (userInput.includes(keyword)) {
          scores[style] += 2;
        }
      }
    }

    // 检测焦虑维度指标
    const anxietyIndicators = [
      /担心.*抛弃/i, /害怕.*离开/i, /需要.*确认/i,
      /是不是.*不爱/i, /会不会.*分手/i, /总是.*不回/i
    ];
    anxietyIndicators.forEach(pattern => {
      if (pattern.test(userInput)) scores.anxious += 1;
    });

    // 检测回避维度指标
    const avoidanceIndicators = [
      /需要.*空间/i, /不想.*谈/i, /一个人.*好/i,
      /太.*粘人/i, /不想.*承诺/i, /习惯.*独立/i
    ];
    avoidanceIndicators.forEach(pattern => {
      if (pattern.test(userInput)) scores.avoidant += 1;
    });

    // 检测混乱型指标
    const disorganizedIndicators = [
      /想.*又怕/i, /矛盾/i, /害怕.*亲密/i,
      /不知道.*想要/i, /搞砸.*关系/i, /不值得.*爱/i
    ];
    disorganizedIndicators.forEach(pattern => {
      if (pattern.test(userInput)) scores.disorganized += 1;
    });

    // 找出最高分
    const maxScore = Math.max(...Object.values(scores));
    const primaryStyle = maxScore > 0
      ? Object.keys(scores).find(key => scores[key] === maxScore)
      : 'unknown';

    // 计算焦虑和回避维度分数
    const anxietyScore = scores.anxious + scores.disorganized * 0.5;
    const avoidanceScore = scores.avoidant + scores.disorganized * 0.5;

    return {
      primaryStyle,
      scores,
      anxietyLevel: anxietyScore >= 3 ? 'high' : anxietyScore >= 1 ? 'moderate' : 'low',
      avoidanceLevel: avoidanceScore >= 3 ? 'high' : avoidanceScore >= 1 ? 'moderate' : 'low',
      confidence: maxScore >= 5 ? 'high' : maxScore >= 2 ? 'moderate' : 'low',
      detectedPatterns: this._getDetectedPatterns(scores)
    };
  },

  /**
   * 获取检测到的关系模式
   */
  _getDetectedPatterns(scores) {
    const patterns = [];
    
    if (scores.anxious >= 3) {
      patterns.push({
        type: 'anxious_pattern',
        name: '焦虑型模式',
        description: '表现出对被抛弃的担忧和寻求确认的倾向',
        suggestions: [
          '练习自我安抚技巧',
          '识别焦虑触发点',
          '建立内在安全感'
        ]
      });
    }
    
    if (scores.avoidant >= 3) {
      patterns.push({
        type: 'avoidant_pattern',
        name: '回避型模式',
        description: '表现出对亲密的回避和强调独立的倾向',
        suggestions: [
          '尝试小步骤的情感表达',
          '理解独立与亲密可以共存',
          '识别压抑的情感需求'
        ]
      });
    }
    
    if (scores.disorganized >= 3) {
      patterns.push({
        type: 'disorganized_pattern',
        name: '混乱型模式',
        description: '表现出对亲密关系的矛盾和困惑',
        suggestions: [
          '寻求专业心理支持',
          '练习情绪调节技巧',
          '建立安全的关系边界'
        ]
      });
    }

    return patterns;
  },

  /**
   * 获取依恋风格的详细信息
   */
  getStyleInfo(styleName) {
    return styles.styles[styleName] || null;
  },

  /**
   * 生成针对性的支持建议
   */
  generateSupport(detectedStyle, context = {}) {
    const styleInfo = styles.styles[detectedStyle];
    if (!styleInfo) return null;

    return {
      style: styleInfo.name,
      understanding: this._generateUnderstanding(styleInfo),
      strategies: styleInfo.supportStrategies,
      exercises: this._getExercises(detectedStyle),
      resources: this._getResources(detectedStyle)
    };
  },

  /**
   * 生成理解性陈述
   */
  _generateUnderstanding(styleInfo) {
    const understandings = {
      secure: '你的关系模式显示出健康的平衡——既能亲密又能独立。这是可以通过持续练习保持的优势。',
      anxious: '你对关系的投入和重视是很珍贵的。有时强烈的依恋需求可能源于对连接的渴望，这本身是正常的。',
      avoidant: '你重视独立和自主，这是很重要的品质。同时，适度的亲密和依赖也是人类的基本需求。',
      disorganized: '你对关系的复杂感受是可以理解的。既渴望连接又害怕受伤，这种矛盾可能源于过去的经历。'
    };
    return understandings[styleInfo.code.toLowerCase()] || '';
  },

  /**
   * 获取练习建议
   */
  _getExercises(styleName) {
    const exercises = {
      anxious: [
        {
          name: '焦虑日志',
          description: '记录焦虑触发时刻、身体感受和后续发展',
          steps: [
            '当感到焦虑时，记录触发事件',
            '描述身体感受 (心跳、呼吸等)',
            '记录你采取的行动',
            '事后回顾：最担心的事发生了吗？'
          ]
        },
        {
          name: '自我安抚练习',
          description: '建立内在安全感',
          steps: [
            '深呼吸：吸气 4 秒，屏息 4 秒，呼气 6 秒',
            '自我对话："我现在是安全的"',
            '列出 3 件你能控制的事',
            '做一件让你感到平静的事'
          ]
        }
      ],
      avoidant: [
        {
          name: '情感词汇练习',
          description: '逐步练习识别和表达情感',
          steps: [
            '每天记录 1 个情绪词',
            '描述这个情绪在身体的哪个部位',
            '尝试向信任的人表达一个小的需求',
            '记录表达后的感受'
          ]
        },
        {
          name: '亲密阶梯',
          description: '小步骤增加亲密度',
          steps: [
            '列出让你感到舒适的亲密行为',
            '从最低难度开始尝试',
            '记录每次尝试的感受',
            '逐步增加难度'
          ]
        }
      ],
      disorganized: [
        {
          name: '矛盾情感探索',
          description: '理解并接纳矛盾感受',
          steps: [
            '写下你对关系的渴望',
            '写下你对关系的恐惧',
            '问自己：这两种感受可以共存吗？',
            '探索：什么能让你感到更安全？'
          ]
        },
        {
          name: '安全岛想象',
          description: '建立内在安全感',
          steps: [
            '闭上眼睛，想象一个让你感到安全的地方',
            '注意这个地方的细节 (颜色、声音、气味)',
            '感受在这个地方的安全感',
            '记住这种感觉，随时可以回来'
          ]
        }
      ],
      secure: [
        {
          name: '关系感恩',
          description: '强化积极的关系模式',
          steps: [
            '每天记录 1 件感谢伴侣/朋友的事',
            '表达你的欣赏',
            '记录对方的积极回应',
            '反思：这如何增强了你们的关系？'
          ]
        }
      ]
    };

    return exercises[styleName] || [];
  },

  /**
   * 获取推荐资源
   */
  _getResources(styleName) {
    return {
      books: [
        '《Attached》- Amir Levine & Rachel Heller (依恋风格入门)',
        '《Hold Me Tight》- Sue Johnson (情绪取向疗法)',
        '《Wired for Love》- Stan Tatkin (神经科学视角)'
      ],
      concepts: [
        '内部工作模式 (Internal Working Models)',
        '安全基地 (Secure Base)',
        '依恋损伤与修复 (Attachment Injury & Repair)'
      ]
    };
  },

  /**
   * 生成回应模板
   */
  generateResponse(detection, userInput) {
    if (detection.primaryStyle === 'unknown') {
      return {
        type: 'general',
        content: '我听到你在分享关于关系的感受。每段关系都是独特的，重要的是找到适合你的方式。'
      };
    }

    const styleInfo = styles.styles[detection.primaryStyle];
    const support = this.generateSupport(detection.primaryStyle);

    return {
      type: 'attachment_informed',
      style: styleInfo.name,
      confidence: detection.confidence,
      content: {
        understanding: support.understanding,
        patterns: detection.detectedPatterns.map(p => ({
          name: p.name,
          description: p.description
        })),
        strategies: support.strategies.slice(0, 3),
        exercise: support.exercises[0]
      }
    };
  },

  /**
   * 模块信息
   */
  info: {
    name: '依恋理论模块',
    version: '1.0.0',
    description: '基于 Bowlby & Ainsworth 依恋理论的关系模式识别与支持',
    commands: ['/attachment - 查看依恋风格说明', '/attachment test - 简易依恋风格测试']
  }
};
