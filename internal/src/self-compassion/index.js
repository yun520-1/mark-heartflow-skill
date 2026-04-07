/**
 * Self-Compassion Module - 自我同情模块
 * 
 * 基于 Kristin Neff 博士的自我同情理论和斯坦福大学 CCARE 研究
 * 
 * 核心三要素:
 * 1. 自我仁慈 (Self-Kindness) - 对自己温暖理解而非严厉批评
 * 2. 共同人性 (Common Humanity) - 认识到痛苦是普遍人类经验
 * 3. 正念 (Mindfulness) - 平衡觉察痛苦情绪，不过度认同
 * 
 * 实证支持:
 * - 与更低水平的焦虑、抑郁相关
 * - 提高心理弹性和幸福感
 * - 减少完美主义和自我批评
 * - 促进健康行为改变
 * 
 * @version 3.8.0
 * @author HeartFlow Team
 */

class SelfCompassionModule {
  constructor() {
    this.version = '3.8.0';
    this.lastAssessment = null;
    
    // 自我批评检测关键词 (中文)
    this.selfCriticismKeywords = [
      // 自我贬低
      '我真笨', '我太蠢了', '我没用', '我不行', '我做不到',
      '我太差了', '我好失败', '我不如别人', '我总是', '我从来',
      
      // 完美主义批评
      '我应该', '我必须', '我不应该', '我不能犯错',
      '这都不行', '还不够好', '太糟糕了',
      
      // 灾难化思维
      '完了', '彻底失败了', '没希望了', '永远都不会',
      
      // 自我否定
      '我不配', '我不值得', '没人喜欢我', '我是负担'
    ];
    
    // 自我同情干预库
    this.interventions = {
      selfKindness: [
        {
          id: 'sk_1',
          name: '自我关怀语句',
          type: 'verbal',
          content: '想象如果是你最好的朋友处于同样情境，你会对 ta 说什么？现在，把这些温暖的话语说给自己听。',
          script: '亲爱的，我知道你现在很难过。这很正常，每个人都有这样的时刻。你已经很努力了，让我陪着你。'
        },
        {
          id: 'sk_2',
          name: '身体安抚',
          type: 'physical',
          content: '将手轻轻放在胸口或脸颊，感受掌心的温暖。深呼吸，对自己说："愿我平安，愿我善待自己"。',
          duration: '2-3 分钟'
        },
        {
          id: 'sk_3',
          name: '自我同情信',
          type: 'writing',
          content: '以关爱朋友的身份，给自己写一封简短的信。承认痛苦，表达理解，提供鼓励。',
          prompt: '亲爱的 [你的名字]，我知道你现在正在经历... 这是很困难的，因为... 但请记住...'
        }
      ],
      
      commonHumanity: [
        {
          id: 'ch_1',
          name: '普遍性反思',
          type: 'reflection',
          content: '记住：痛苦和不完美是人类共同经验的一部分。此刻，世界上有无数人正在经历类似的感受。',
          script: '你并不孤单。这种感觉虽然痛苦，但它是人类共同经验的一部分。此时此刻，有无数人也正在经历类似的挣扎。'
        },
        {
          id: 'ch_2',
          name: '连接感练习',
          type: 'visualization',
          content: '想象一条金色的线连接着你和所有正在经历类似痛苦的人。你们并不孤立，而是人类大家庭的一部分。',
          duration: '3-5 分钟'
        },
        {
          id: 'ch_3',
          name: '共同人性陈述',
          type: 'verbal',
          script: '痛苦是人生的一部分。我不是唯一一个经历这种感受的人。这是人类共同经验的一部分。'
        }
      ],
      
      mindfulness: [
        {
          id: 'mf_1',
          name: '正念觉察',
          type: 'meditation',
          content: '以开放、不加评判的态度觉察当下的感受。注意："这是痛苦的感觉"，而不去推开它或沉溺其中。',
          script: '此刻我注意到... (描述感受)。这种感觉是真实的，但它不是我全部。我允许它存在，也允许它变化。'
        },
        {
          id: 'mf_2',
          name: '情绪命名',
          type: 'labeling',
          content: '给情绪命名："这是悲伤"、"这是焦虑"、"这是羞愧"。命名本身就有调节作用。',
          examples: ['这是焦虑', '这是失望', '这是孤独', '这是疲惫']
        },
        {
          id: 'mf_3',
          name: '呼吸空间',
          type: 'breathing',
          content: '暂停 3 次深呼吸。第一次：觉察当下。第二次：聚焦呼吸。第三次：扩展觉察到全身。',
          duration: '1 分钟'
        }
      ]
    };
    
    // 评估维度
    this.assessmentDimensions = [
      {
        name: 'selfKindness',
        label: '自我仁慈',
        questions: [
          '当事情不顺利时，我倾向于理解自己而非批评自己',
          '我会像对待好朋友一样对待自己',
          '我允许自己不完美'
        ]
      },
      {
        name: 'commonHumanity',
        label: '共同人性',
        questions: [
          '我认识到困难是人生的一部分',
          '我知道其他人也会经历类似的痛苦',
          '我不觉得自己是唯一遭遇不幸的人'
        ]
      },
      {
        name: 'mindfulness',
        label: '正念',
        questions: [
          '我能觉察自己的情绪而不被淹没',
          '我能平衡地看待痛苦感受',
          '我不会过度认同负面想法'
        ]
      }
    ];
  }
  
  /**
   * 检测文本中的自我批评倾向
   * @param {string} text - 用户输入的文本
   * @returns {Object} 检测结果
   */
  detectSelfCriticism(text) {
    const found = [];
    const lowerText = text.toLowerCase();
    
    this.selfCriticismKeywords.forEach(keyword => {
      if (lowerText.includes(keyword.toLowerCase())) {
        found.push(keyword);
      }
    });
    
    const intensity = found.length > 0 
      ? Math.min(found.length * 2, 10) 
      : 0;
    
    return {
      detected: found.length > 0,
      keywords: found,
      intensity: intensity, // 0-10
      level: this._getLevel(intensity)
    };
  }
  
  /**
   * 生成自我同情干预建议
   * @param {string} primaryEmotion - 主要情绪
   * @param {number} intensity - 情绪强度 (1-10)
   * @param {Object} context - 情境信息
   * @returns {Object} 干预建议
   */
  generateIntervention(primaryEmotion, intensity, context = {}) {
    const recommendations = [];
    
    // 根据情绪类型选择干预重点
    if (['悲伤', '失望', '沮丧'].includes(primaryEmotion)) {
      recommendations.push(...this.interventions.selfKindness.slice(0, 2));
    }
    
    if (['羞愧', '内疚', '自卑'].includes(primaryEmotion)) {
      recommendations.push(...this.interventions.commonHumanity.slice(0, 2));
    }
    
    if (['焦虑', '恐惧', '担忧'].includes(primaryEmotion)) {
      recommendations.push(...this.interventions.mindfulness.slice(0, 2));
    }
    
    // 高强度情绪时提供所有三类干预
    if (intensity >= 7) {
      recommendations.push(
        this.interventions.selfKindness[0],
        this.interventions.commonHumanity[0],
        this.interventions.mindfulness[2]
      );
    }
    
    // 去重
    const unique = recommendations.filter(
      (v, i, a) => a.findIndex(t => t.id === v.id) === i
    );
    
    return {
      primaryEmotion,
      intensity,
      recommendations: unique.slice(0, 3), // 最多 3 个建议
      script: this._generateCompassionateScript(primaryEmotion, context)
    };
  }
  
  /**
   * 生成自我同情脚本
   * @param {string} emotion - 情绪
   * @param {Object} context - 情境
   * @returns {string} 同情的话语
   */
  _generateCompassionateScript(emotion, context) {
    const scripts = {
      '悲伤': '我知道你现在很伤心。这种感觉很难受，但它是真实的、合理的。让我陪着你，你不需要独自承受。',
      '焦虑': '我注意到你很焦虑。这是身体在试图保护你。让我们深呼吸，一次只面对这一刻。',
      '羞愧': '感到羞愧是很痛苦的。但请记住，每个人都有不完美的时刻。这不能定义你的价值。',
      '内疚': '内疚说明你在乎。但过度自责不会帮助任何人。让我们看看能从中学到什么。',
      '愤怒': '你的愤怒是有原因的。让我们理解它想告诉你什么，而不是压抑它。',
      '失望': '失望说明你有期待，这很正常。让我们给自己一些空间去感受它。',
      '孤独': '孤独感很痛苦。但请记住，此刻世界上有很多人也在经历类似的感受。你并不孤单。',
      '疲惫': '你已经很努力了。休息不是偷懒，而是必要的自我关怀。'
    };
    
    return scripts[emotion] || '我注意到你现在正在经历困难的时刻。这是不容易的。让我们一起面对它。';
  }
  
  /**
   * 评估自我同情水平 (简化版 SCS 量表)
   * @param {Array} responses - 用户对评估问题的回答 (1-5 分)
   * @returns {Object} 评估结果
   */
  assessSelfCompassion(responses) {
    if (responses.length !== this.assessmentDimensions.length) {
      throw new Error('评估问题数量不匹配');
    }
    
    const scores = {};
    let total = 0;
    
    this.assessmentDimensions.forEach((dim, index) => {
      const score = responses[index] || 3; // 默认 3 分
      scores[dim.name] = {
        label: dim.label,
        score: score,
        maxScore: 5,
        percentage: (score / 5) * 100
      };
      total += score;
    });
    
    const average = total / this.assessmentDimensions.length;
    
    return {
      dimensions: scores,
      totalScore: total,
      averageScore: average,
      maxTotal: 15,
      level: this._getLevel(average * 2), // 转换为 0-10 量表
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * 获取等级标签
   * @param {number} score - 分数 (0-10)
   * @returns {string} 等级
   */
  _getLevel(score) {
    if (score >= 8) return '高';
    if (score >= 6) return '中高';
    if (score >= 4) return '中等';
    if (score >= 2) return '中低';
    return '低';
  }
  
  /**
   * 获取模块信息
   * @returns {Object} 模块信息
   */
  getInfo() {
    return {
      name: 'Self-Compassion Module',
      version: this.version,
      description: '基于 Kristin Neff 理论的自我同情干预模块',
      capabilities: [
        '自我批评检测',
        '三要素评估 (自我仁慈、共同人性、正念)',
        '个性化干预建议生成',
        '自我同情脚本生成'
      ],
      theoreticalBasis: [
        'Kristin Neff Self-Compassion Theory',
        'Stanford CCARE Research',
        'Greater Good Science Center'
      ],
      interventionsCount: Object.values(this.interventions).flat().length
    };
  }
}

module.exports = { SelfCompassionModule };
