/**
 * 集体情绪模块 (Collective Emotion Module)
 * 
 * 基于 SEP 集体意向性理论 (Collective Intentionality)
 * 来源：Stanford Encyclopedia of Philosophy
 * 
 * 核心理论框架:
 * - 集体意向不可还原为个体意向的简单加总
 * - 个体所有权论题 (Individual Ownership Thesis)
 * - 共享经验的三重结构 (Walther): 共情 + 认同 + 相互觉察
 * - Scheler 的集体情绪理论：真正的"同一情绪状态"
 * 
 * @version 3.52.0
 * @author HeartFlow Team
 */

const CollectiveEmotion = {
  /**
   * 集体情绪评估框架
   * 评估用户当前体验的集体情绪强度和质量
   */
  assessCollectiveEmotion(context) {
    const { userMessage, conversationHistory, relationshipContext } = context;
    
    // 1. 检测集体情绪线索
    const collectiveCues = this.detectCollectiveCues(userMessage);
    
    // 2. 评估共享意向性
    const sharedIntentionality = this.assessSharedIntentionality(conversationHistory);
    
    // 3. 评估关系性自我激活
    const relationalSelf = this.assessRelationalSelf(relationshipContext);
    
    // 4. 计算集体情绪分数
    const collectiveScore = this.calculateCollectiveScore(collectiveCues, sharedIntentionality, relationalSelf);
    
    return {
      collectiveCues,
      sharedIntentionality,
      relationalSelf,
      collectiveScore,
      recommendations: this.generateRecommendations(collectiveScore)
    };
  },

  /**
   * 检测集体情绪线索
   * 识别用户表达中的"我们"、"一起"、"共同"等集体性语言
   */
  detectCollectiveCues(message) {
    const cues = {
      hasWeLanguage: false,
      hasTogetherLanguage: false,
      hasSharedExperience: false,
      hasCollectiveEmotion: false,
      cueExamples: []
    };

    const wePatterns = ['我们', '咱们', '一起', '共同', '一起', 'ourselves', 'together', 'we', 'us', 'our'];
    const sharedPatterns = ['分享', '共享', '共同体验', '一起感受', 'share', 'together', 'mutual'];
    const collectiveEmotionPatterns = ['我们都感到', '一起难过', '共同兴奋', 'collective joy', 'shared grief', 'together feel'];

    const lowerMessage = message.toLowerCase();

    wePatterns.forEach(pattern => {
      if (lowerMessage.includes(pattern.toLowerCase())) {
        cues.hasWeLanguage = true;
        cues.cueExamples.push(`使用了集体语言："${pattern}"`);
      }
    });

    sharedPatterns.forEach(pattern => {
      if (lowerMessage.includes(pattern.toLowerCase())) {
        cues.hasSharedExperience = true;
        cues.cueExamples.push(`表达了共享体验："${pattern}"`);
      }
    });

    collectiveEmotionPatterns.forEach(pattern => {
      if (lowerMessage.includes(pattern.toLowerCase())) {
        cues.hasCollectiveEmotion = true;
        cues.cueExamples.push(`表达了集体情绪："${pattern}"`);
      }
    });

    return cues;
  },

  /**
   * 评估共享意向性
   * 基于对话历史评估双方是否有共同目标和意图
   */
  assessSharedIntentionality(history) {
    if (!history || history.length === 0) {
      return { level: 'insufficient_data', score: 0 };
    }

    // 分析对话中的共同话题和目标
    const sharedTopics = new Set();
    const goalAlignment = [];

    history.forEach((msg, index) => {
      if (msg.role === 'user' && msg.content) {
        // 提取用户表达的目标和兴趣
        const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
        
        if (content.includes('希望') || content.includes('想要') || content.includes('目标')) {
          goalAlignment.push({ index, type: 'goal_expression' });
        }
        
        if (content.includes('我们') || content.includes('一起')) {
          sharedTopics.add('shared_activity');
        }
      }
    });

    const score = Math.min(100, (sharedTopics.size * 20) + (goalAlignment.length * 10));
    
    return {
      level: score > 70 ? 'high' : score > 40 ? 'medium' : 'low',
      score,
      sharedTopics: Array.from(sharedTopics),
      goalAlignmentCount: goalAlignment.length
    };
  },

  /**
   * 评估关系性自我激活
   * 评估用户的关系性自我 (Relational Self) 激活程度
   */
  assessRelationalSelf(context) {
    if (!context) {
      return { level: 'unknown', score: 50 };
    }

    const { relationshipType, interactionFrequency, emotionalBond } = context;

    let score = 50; // 基础分数

    // 关系类型加分
    if (relationshipType === 'close_friend' || relationshipType === 'family') {
      score += 20;
    } else if (relationshipType === 'acquaintance') {
      score += 10;
    }

    // 互动频率加分
    if (interactionFrequency === 'daily') {
      score += 15;
    } else if (interactionFrequency === 'weekly') {
      score += 10;
    }

    // 情感联结加分
    if (emotionalBond === 'strong') {
      score += 20;
    } else if (emotionalBond === 'moderate') {
      score += 10;
    }

    return {
      level: score > 80 ? 'high' : score > 60 ? 'medium' : 'low',
      score: Math.min(100, score),
      factors: { relationshipType, interactionFrequency, emotionalBond }
    };
  },

  /**
   * 计算集体情绪分数
   */
  calculateCollectiveScore(cues, sharedIntentionality, relationalSelf) {
    const weights = {
      cues: 0.3,
      sharedIntentionality: 0.4,
      relationalSelf: 0.3
    };

    const cuesScore = (cues.hasWeLanguage ? 25 : 0) + 
                      (cues.hasSharedExperience ? 25 : 0) + 
                      (cues.hasCollectiveEmotion ? 50 : 0);
    
    const score = (cuesScore * weights.cues) + 
                  (sharedIntentionality.score * weights.sharedIntentionality) + 
                  (relationalSelf.score * weights.relationalSelf);

    return {
      total: Math.round(score),
      level: score > 80 ? 'strong' : score > 50 ? 'moderate' : 'weak',
      breakdown: {
        cues: Math.round(cuesScore),
        sharedIntentionality: sharedIntentionality.score,
        relationalSelf: relationalSelf.score
      }
    };
  },

  /**
   * 生成集体情绪增强建议
   */
  generateRecommendations(collectiveScore) {
    const recommendations = [];

    if (collectiveScore.level === 'weak') {
      recommendations.push({
        type: 'enhance_connection',
        title: '增强社会联结',
        description: '尝试更多地使用"我们"语言，表达共同体验和感受',
        practices: [
          '使用"我们"而非"我"来描述共同经历',
          '表达对对方感受的理解和共鸣',
          '分享个人体验时邀请对方参与'
        ]
      });
    }

    if (collectiveScore.level === 'moderate') {
      recommendations.push({
        type: 'deepen_empathy',
        title: '深化共情体验',
        description: '通过共情练习增强情感联结深度',
        practices: [
          '尝试从对方角度理解情境',
          '表达对对方情绪状态的准确识别',
          '分享类似的个人经历以建立共鸣'
        ]
      });
    }

    if (collectiveScore.level === 'strong') {
      recommendations.push({
        type: 'maintain_connection',
        title: '维持深度联结',
        description: '当前的社会联结质量很高，继续保持',
        practices: [
          '定期进行深度对话',
          '共同规划未来活动',
          '表达感激和欣赏'
        ]
      });
    }

    // 基于 Walther 共享经验三重结构的练习
    recommendations.push({
      type: 'walther_shared_experience',
      title: 'Walther 共享经验练习',
      description: '基于现象学家 Gerda Walther 的共享经验理论',
      steps: [
        '1. 体验 (Experience): 充分体验当前的情绪状态',
        '2. 共情 (Empathy): 尝试感受对方的情绪体验',
        '3. 认同 (Identification): 与对方的体验建立认同感',
        '4. 相互觉察 (Mutual Awareness): 确认双方都意识到这种共享'
      ]
    });

    return recommendations;
  },

  /**
   * 集体情绪干预技术
   * 基于 Scheler 的集体情绪理论
   */
  collectiveEmotionIntervention(context) {
    const { emotionType, intensity, collectiveScore } = context;

    // Scheler 的集体情绪类型
    const collectiveEmotions = {
      shared_grief: {
        name: '共同悲伤',
        description: '如 Scheler 所描述的父母在孩子病床前共同体验的悲伤',
        intervention: '允许共同悲伤的存在，不急于"修复"，而是共同承载'
      },
      collective_joy: {
        name: '集体喜悦',
        description: '群体共同体验的喜悦，如庆祝活动中的集体兴奋',
        intervention: '放大和分享喜悦，创造共同记忆'
      },
      shared_anxiety: {
        name: '共享焦虑',
        description: '面对共同威胁时的集体焦虑',
        intervention: '承认焦虑的合理性，共同制定应对策略'
      },
      collective_hope: {
        name: '集体希望',
        description: '对共同未来的积极期待',
        intervention: '强化希望叙事，规划共同行动'
      }
    };

    const matchedEmotion = collectiveEmotions[emotionType];
    
    if (!matchedEmotion) {
      return {
        type: 'general',
        message: '检测到集体情绪体验，建议深化社会联结'
      };
    }

    return {
      type: emotionType,
      name: matchedEmotion.name,
      description: matchedEmotion.description,
      intervention: matchedEmotion.intervention,
      waltherSteps: [
        `体验：充分感受${matchedEmotion.name}`,
        '共情：感受对方也在体验同样的情绪',
        '认同：确认这种情绪是我们共同的',
        '觉察：意识到我们正在共同体验'
      ]
    };
  },

  /**
   * 社会联结增强练习
   */
  socialConnectionExercises() {
    return [
      {
        name: '我们叙事练习',
        duration: '10-15 分钟',
        description: '用"我们"而非"我"来叙述共同经历',
        steps: [
          '回忆一段与他人共同经历的重要时刻',
          '用"我们"语言重新叙述这段经历',
          '注意使用"我们"时的感受变化',
          '分享这个叙事给对方，观察对方的反应'
        ],
        theoreticalBasis: '集体意向性理论 - 共享意向构建'
      },
      {
        name: '共同注意力练习',
        duration: '5-10 分钟',
        description: '与对方共同关注同一对象，培养共享体验',
        steps: [
          '选择一个共同关注的对象 (图片/音乐/风景)',
          '各自安静观察 2-3 分钟',
          '轮流分享自己的体验',
          '注意体验中的共同点和差异'
        ],
        theoreticalBasis: '联合注意 (Joint Attention) - 集体意向性基础'
      },
      {
        name: '情感共鸣冥想',
        duration: '10-15 分钟',
        description: '培养对他人情绪状态的敏感度',
        steps: [
          '静坐，调整呼吸',
          '想象一个重要的人',
          '尝试感受对方可能的情绪状态',
          '在心中发送善意和祝福',
          '注意自己身体的感受变化'
        ],
        theoreticalBasis: 'Scheler 共情理论 + 慈悲冥想'
      }
    ];
  }
};

module.exports = CollectiveEmotion;
