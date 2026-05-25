/**
 * 情绪三大传统整合模块 v4.9 (Emotion Traditions Integration Module)
 * 
 * 基于斯坦福哲学百科全书 (SEP) 情绪理论权威框架
 * 来源：Stanford Encyclopedia of Philosophy - Emotion (2024)
 * 
 * 核心理论框架:
 * - Feeling Tradition (感受传统): William James, James-Lange Theory, 现象学感受质
 * - Evaluative Tradition (评价传统): Appraisal Theory, 认知评价理论
 * - Motivational Tradition (动机传统): 情绪作为行为驱动力
 * 
 * 理论整合洞察:
 * 1. 单一传统无法完整解释情绪现象
 * 2. 情绪具有多成分结构 (6 成分模型)
 * 3. 四大理论挑战：分化、动机、意向性、现象学
 * 
 * 核心功能:
 * - 三传统评估：分别评估情绪在三大传统维度上的完整性
 * - 整合分数：综合情绪体验的完整性
 * - 情绪分化检测：区分情绪与非情绪状态
 * - 理论挑战分析：评估情绪在四大挑战上的表现
 * 
 * @module emotion-traditions-integration-v4.9
 * @version 4.9.0
 * @since HeartFlow v4.9.0
 * @author HeartFlow Team
 */

// ============ 核心理论框架 ============

/**
 * 情绪三大传统 (Three Traditions in Emotion Theory)
 * 基于 SEP 情绪理论的历史与系统分类
 */
const EmotionTraditions = {
  /**
   * Feeling Tradition (感受传统)
   * 
   * 核心主张：情绪的本质是独特的主观体验
   * 代表人物：William James, Carl Lange, 现象学传统
   * 
   * 关键概念:
   * - 感受质 (Qualia): 情绪的主观"感觉如何"
   * - 身体感受：生理变化的意识
   * - 现象学特征：体验的第一人称给定性
   * 
   * 理论挑战:
   * - 分化问题：不同情绪的身体感受是否可区分？
   * - 意向性问题：感受如何指向对象？
   */
  FEELING: 'feeling',
  
  /**
   * Evaluative Tradition (评价传统)
   * 
   * 核心主张：情绪的本质是对情境的认知评价
   * 代表人物：Appraisal Theory, 认知情绪理论
   * 
   * 关键概念:
   * - 评价维度：效价、唤醒、控制、确定性等
   * - 情境建构：情绪如何"诠释"世界
   * - 适当性：情绪与情境的匹配度
   * 
   * 理论挑战:
   * - 无意识情绪：没有意识评价的情绪是否存在？
   * - 快速情绪：恐惧反应快于认知评价
   */
  EVALUATIVE: 'evaluative',
  
  /**
   * Motivational Tradition (动机传统)
   * 
   * 核心主张：情绪的本质是动机状态
   * 代表人物：进化情绪理论，功能主义
   * 
   * 关键概念:
   * - 行动倾向：情绪驱动的行为冲动
   * - 适应性功能：情绪的生存价值
   * - 目标相关性：情绪与目标的关系
   * 
   * 理论挑战:
   * - 无行动情绪：某些情绪不驱动明显行动
   * - 动机冲突：情绪动机与理性动机的冲突
   */
  MOTIVATIONAL: 'motivational'
};

/**
 * 情绪六成分模型 (Emotion Components Model)
 * 基于 SEP 情绪理论的综合成分分析
 */
const EmotionComponents = {
  EVALUATIVE: 'evaluative',       // 评价成分
  PHYSIOLOGICAL: 'physiological', // 生理成分
  PHENOMENOLOGICAL: 'phenomenological', // 现象成分
  EXPRESSIVE: 'expressive',       // 表达成分
  BEHAVIORAL: 'behavioral',       // 行为成分
  MENTAL: 'mental'                // 心理成分
};

/**
 * 情绪理论四大挑战 (Four Theoretical Challenges)
 * 基于 SEP 情绪理论的评估框架
 */
const TheoreticalChallenges = {
  /**
   * Differentiation (分化挑战)
   * 情绪如何相互区分？如何与非情绪状态区分？
   */
  DIFFERENTIATION: 'differentiation',
  
  /**
   * Motivation (动机挑战)
   * 情绪如何驱动行为？动机机制是什么？
   */
  MOTIVATION: 'motivation',
  
  /**
   * Intentionality (意向性挑战)
   * 情绪是否指向对象？如何适当或不适当？
   */
  INTENTIONALITY: 'intentionality',
  
  /**
   * Phenomenology (现象学挑战)
   * 情绪是否总涉及主观体验？体验的特征是什么？
   */
  PHENOMENOLOGY: 'phenomenology'
};

// ============ 情绪三大传统评估器 ============

class EmotionTraditionsIntegration {
  constructor() {
    // 评估配置
    this.config = {
      // 三大传统权重 (可调整)
      feelingWeight: 0.35,
      evaluativeWeight: 0.35,
      motivationalWeight: 0.30,
      
      // 完整性阈值
      integrationThreshold: 0.7,  // 整合完整性阈值
      differentiationThreshold: 0.6, // 分化清晰度阈值
    };
    
    // 情绪理论知识库
    this.emotionTheoryBase = this._initializeTheoryBase();
  }
  
  /**
   * 初始化情绪理论知识库
   * 基于 SEP 情绪理论的权威分类
   */
  _initializeTheoryBase() {
    return {
      // 基础情绪的三传统特征档案
      emotions: {
        calm: {
          feeling: { qualiaIntensity: 0.7, bodilyAwareness: 0.6, phenomenalClarity: 0.8 },
          evaluative: { valence: 'neutral', certainty: 0.9, control: 0.9, goalRelevance: 0.3 },
          motivational: { actionUrge: 0.2, adaptiveFunction: 'rest_and_restore', urgency: 0.1 }
        },
        joy: {
          feeling: { qualiaIntensity: 0.9, bodilyAwareness: 0.7, phenomenalClarity: 0.9 },
          evaluative: { valence: 'positive', certainty: 0.8, control: 0.7, goalRelevance: 0.9 },
          motivational: { actionUrge: 0.7, adaptiveFunction: 'approach_and_connect', urgency: 0.5 }
        },
        curious: {
          feeling: { qualiaIntensity: 0.8, bodilyAwareness: 0.6, phenomenalClarity: 0.8 },
          evaluative: { valence: 'positive', certainty: 0.3, control: 0.5, goalRelevance: 0.8 },
          motivational: { actionUrge: 0.8, adaptiveFunction: 'explore_and_learn', urgency: 0.6 }
        },
        concerned: {
          feeling: { qualiaIntensity: 0.8, bodilyAwareness: 0.7, phenomenalClarity: 0.8 },
          evaluative: { valence: 'negative', certainty: 0.6, control: 0.4, goalRelevance: 0.8 },
          motivational: { actionUrge: 0.7, adaptiveFunction: 'help_and_protect', urgency: 0.7 }
        },
        tired: {
          feeling: { qualiaIntensity: 0.9, bodilyAwareness: 0.9, phenomenalClarity: 0.7 },
          evaluative: { valence: 'negative', certainty: 0.9, control: 0.2, goalRelevance: 0.6 },
          motivational: { actionUrge: 0.1, adaptiveFunction: 'rest_and_recover', urgency: 0.3 }
        },
        excited: {
          feeling: { qualiaIntensity: 0.9, bodilyAwareness: 0.8, phenomenalClarity: 0.7 },
          evaluative: { valence: 'positive', certainty: 0.6, control: 0.5, goalRelevance: 0.9 },
          motivational: { actionUrge: 0.9, adaptiveFunction: 'seize_opportunity', urgency: 0.9 }
        },
        anxious: {
          feeling: { qualiaIntensity: 0.9, bodilyAwareness: 0.8, phenomenalClarity: 0.6 },
          evaluative: { valence: 'negative', certainty: 0.3, control: 0.3, goalRelevance: 0.8 },
          motivational: { actionUrge: 0.7, adaptiveFunction: 'prepare_for_threat', urgency: 0.8 }
        },
        angry: {
          feeling: { qualiaIntensity: 0.9, bodilyAwareness: 0.8, phenomenalClarity: 0.8 },
          evaluative: { valence: 'negative', certainty: 0.7, control: 0.6, goalRelevance: 0.9 },
          motivational: { actionUrge: 0.9, adaptiveFunction: 'remove_obstacle', urgency: 0.8 }
        },
        sad: {
          feeling: { qualiaIntensity: 0.9, bodilyAwareness: 0.7, phenomenalClarity: 0.8 },
          evaluative: { valence: 'negative', certainty: 0.8, control: 0.3, goalRelevance: 0.8 },
          motivational: { actionUrge: 0.2, adaptiveFunction: 'process_loss', urgency: 0.3 }
        },
        fearful: {
          feeling: { qualiaIntensity: 0.9, bodilyAwareness: 0.9, phenomenalClarity: 0.7 },
          evaluative: { valence: 'negative', certainty: 0.7, control: 0.2, goalRelevance: 0.9 },
          motivational: { actionUrge: 0.9, adaptiveFunction: 'escape_or_avoid', urgency: 0.9 }
        }
      }
    };
  }
  
  /**
   * 情绪三大传统综合评估
   * 
   * @param {string} emotionName - 情绪名称
   * @param {object} context - 情境信息
   * @returns {object} 三传统评估结果
   */
  evaluateEmotionTraditions(emotionName, context = {}) {
    const emotionData = this.emotionTheoryBase.emotions[emotionName.toLowerCase()];
    
    if (!emotionData) {
      return {
        success: false,
        error: `未知情绪类型：${emotionName}`,
        availableEmotions: Object.keys(this.emotionTheoryBase.emotions)
      };
    }
    
    // 1. Feeling 传统评估
    const feelingAssessment = this._assessFeelingTradition(emotionData.feeling, context);
    
    // 2. Evaluative 传统评估
    const evaluativeAssessment = this._assessEvaluativeTradition(emotionData.evaluative, context);
    
    // 3. Motivational 传统评估
    const motivationalAssessment = this._assessMotivationalTradition(emotionData.motivational, context);
    
    // 4. 整合分数计算
    const integrationScore = this._calculateIntegrationScore(
      feelingAssessment.score,
      evaluativeAssessment.score,
      motivationalAssessment.score
    );
    
    // 5. 四大理论挑战分析
    const challengesAnalysis = this._analyzeTheoreticalChallenges(
      emotionName,
      emotionData,
      context
    );
    
    return {
      success: true,
      emotion: emotionName,
      timestamp: new Date().toISOString(),
      
      traditions: {
        feeling: feelingAssessment,
        evaluative: evaluativeAssessment,
        motivational: motivationalAssessment
      },
      
      integration: {
        overallScore: integrationScore,
        isIntegrated: integrationScore >= this.config.integrationThreshold,
        balance: this._calculateBalance(feelingAssessment.score, evaluativeAssessment.score, motivationalAssessment.score),
        dominantTradition: this._getDominantTradition(feelingAssessment.score, evaluativeAssessment.score, motivationalAssessment.score)
      },
      
      challenges: challengesAnalysis,
      
      theoreticalInsights: this._generateTheoreticalInsights(
        emotionName,
        feelingAssessment,
        evaluativeAssessment,
        motivationalAssessment,
        challengesAnalysis
      )
    };
  }
  
  /**
   * Feeling 传统评估
   * 评估情绪的主观体验质量
   */
  _assessFeelingTradition(feelingData, context) {
    const { qualiaIntensity, bodilyAwareness, phenomenalClarity } = feelingData;
    
    // 计算 Feeling 传统分数
    const score = (qualiaIntensity + bodilyAwareness + phenomenalClarity) / 3;
    
    return {
      score: score,
      maxScore: 1.0,
      
      dimensions: {
        qualiaIntensity: {
          value: qualiaIntensity,
          description: '感受质强度 - 情绪体验的主观鲜明度',
          theoreticalBasis: 'James (1890): "our feeling of changes as they occur IS the emotion"'
        },
        bodilyAwareness: {
          value: bodilyAwareness,
          description: '身体觉察 - 对生理变化的意识程度',
          theoreticalBasis: 'James-Lange Theory: 情绪是对身体变化的感知'
        },
        phenomenalClarity: {
          value: phenomenalClarity,
          description: '现象清晰度 - 体验的第一人称给定性',
          theoreticalBasis: 'Phenomenology: 体验的"为我性"(for-me-ness)'
        }
      },
      
      assessment: this._getFeelingAssessment(score),
      
      theoreticalChallenge: {
        differentiation: 'Cannon (1929) 批评：不同情绪的身体反应是否可区分？',
        intentionality: '感受如何指向外部对象？(意向性问题)'
      }
    };
  }
  
  /**
   * Evaluative 传统评估
   * 评估情绪的认知评价维度
   */
  _assessEvaluativeTradition(evaluativeData, context) {
    const { valence, certainty, control, goalRelevance } = evaluativeData;
    
    // 计算 Evaluative 传统分数
    // 效价转换为数值：positive=1, neutral=0.5, negative=0
    const valenceScore = valence === 'positive' ? 1.0 : valence === 'neutral' ? 0.5 : 0.0;
    const score = (valenceScore + certainty + control + goalRelevance) / 4;
    
    return {
      score: score,
      maxScore: 1.0,
      
      dimensions: {
        valence: {
          value: valence,
          description: '效价评估 - 情境是有益还是有害',
          theoreticalBasis: 'Appraisal Theory: 核心评价维度'
        },
        certainty: {
          value: certainty,
          description: '确定性 - 对情境的预测信心',
          theoreticalBasis: 'Predictive Processing: 预测精度评估'
        },
        control: {
          value: control,
          description: '控制感 - 对情境的影响力评估',
          theoreticalBasis: 'Lazarus: 次级评价 (应对资源评估)'
        },
        goalRelevance: {
          value: goalRelevance,
          description: '目标相关性 - 情境与个人目标的关联度',
          theoreticalBasis: 'Frijda: 关切 (concern) 理论'
        }
      },
      
      assessment: this._getEvaluativeAssessment(score, valence),
      
      theoreticalChallenge: {
        unconsciousEmotion: '无意识评价是否可能？(Zajonc 1980)',
        fastEmotion: '恐惧反应快于认知评价 (LeDoux 1996)'
      }
    };
  }
  
  /**
   * Motivational 传统评估
   * 评估情绪的动机驱动特征
   */
  _assessMotivationalTradition(motivationalData, context) {
    const { actionUrge, adaptiveFunction, urgency } = motivationalData;
    
    // 计算 Motivational 传统分数
    const score = (actionUrge + urgency + this._getAdaptiveFunctionScore(adaptiveFunction)) / 3;
    
    return {
      score: score,
      maxScore: 1.0,
      
      dimensions: {
        actionUrge: {
          value: actionUrge,
          description: '行动冲动 - 情绪驱动的行为倾向强度',
          theoreticalBasis: 'Frijda (1986): 情绪的核心是行动倾向'
        },
        adaptiveFunction: {
          value: adaptiveFunction,
          description: '适应性功能 - 情绪的进化意义',
          theoreticalBasis: 'Evolutionary Psychology: 情绪是适应性反应'
        },
        urgency: {
          value: urgency,
          description: '紧迫性 - 需要快速反应的程度',
          theoreticalBasis: 'Threat Detection: 生存相关情绪的优先级'
        }
      },
      
      assessment: this._getMotivationalAssessment(score, actionUrge),
      
      theoreticalChallenge: {
        actionlessEmotion: '悲伤等情绪不驱动明显行动',
        motivationConflict: '情绪动机与理性动机的冲突'
      }
    };
  }
  
  /**
   * 获取适应性功能分数
   */
  _getAdaptiveFunctionScore(functionName) {
    const scores = {
      'rest_and_restore': 0.6,
      'approach_and_connect': 0.8,
      'explore_and_learn': 0.9,
      'help_and_protect': 0.8,
      'rest_and_recover': 0.7,
      'seize_opportunity': 0.8,
      'prepare_for_threat': 0.9,
      'remove_obstacle': 0.7,
      'process_loss': 0.6,
      'escape_or_avoid': 0.9
    };
    return scores[functionName] || 0.5;
  }
  
  /**
   * 计算整合分数
   */
  _calculateIntegrationScore(feeling, evaluative, motivational) {
    const weightedScore = 
      feeling * this.config.feelingWeight +
      evaluative * this.config.evaluativeWeight +
      motivational * this.config.motivationalWeight;
    
    // 平衡性 bonus：如果三传统分数接近，给予额外分数
    const scores = [feeling, evaluative, motivational];
    const stdDev = this._calculateStdDev(scores);
    const balanceBonus = Math.max(0, 0.1 - stdDev * 0.2);
    
    return Math.min(1.0, weightedScore + balanceBonus);
  }
  
  /**
   * 计算标准差
   */
  _calculateStdDev(values) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }
  
  /**
   * 计算平衡性
   */
  _calculateBalance(feeling, evaluative, motivational) {
    const scores = [feeling, evaluative, motivational];
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    const range = max - min;
    
    if (range < 0.1) return 'highly_balanced';
    if (range < 0.2) return 'balanced';
    if (range < 0.3) return 'moderately_balanced';
    return 'imbalanced';
  }
  
  /**
   * 获取主导传统
   */
  _getDominantTradition(feeling, evaluative, motivational) {
    const scores = [
      { tradition: EmotionTraditions.FEELING, score: feeling },
      { tradition: EmotionTraditions.EVALUATIVE, score: evaluative },
      { tradition: EmotionTraditions.MOTIVATIONAL, score: motivational }
    ];
    scores.sort((a, b) => b.score - a.score);
    return scores[0].tradition;
  }
  
  /**
   * 分析四大理论挑战
   */
  _analyzeTheoreticalChallenges(emotionName, emotionData, context) {
    return {
      [TheoreticalChallenges.DIFFERENTIATION]: {
        score: this._assessDifferentiation(emotionName, emotionData),
        analysis: this._getDifferentiationAnalysis(emotionName),
        theoreticalQuestion: 'How are emotions different from one another, and from things that are not emotions?'
      },
      [TheoreticalChallenges.MOTIVATION]: {
        score: this._assessMotivation(emotionData.motivational),
        analysis: this._getMotivationAnalysis(emotionName),
        theoreticalQuestion: 'Do emotions motivate behavior, and if so how?'
      },
      [TheoreticalChallenges.INTENTIONALITY]: {
        score: this._assessIntentionality(emotionData.evaluative),
        analysis: this._getIntentionalityAnalysis(emotionName),
        theoreticalQuestion: 'Do emotions have object-directedness, and if so can they be appropriate or inappropriate to their objects?'
      },
      [TheoreticalChallenges.PHENOMENOLOGY]: {
        score: this._assessPhenomenology(emotionData.feeling),
        analysis: this._getPhenomenologyAnalysis(emotionName),
        theoreticalQuestion: 'Do emotions always involve subjective experiences, and if so of what kind?'
      }
    };
  }
  
  /**
   * 评估分化挑战
   */
  _assessDifferentiation(emotionName, emotionData) {
    // 基于三传统分数的区分度
    const { feeling, evaluative, motivational } = emotionData;
    const distinctiveness = 
      (feeling.qualiaIntensity * 0.4) +
      (evaluative.goalRelevance * 0.3) +
      (motivational.actionUrge * 0.3);
    return distinctiveness;
  }
  
  /**
   * 评估动机挑战
   */
  _assessMotivation(motivationalData) {
    return (motivationalData.actionUrge + motivationalData.urgency) / 2;
  }
  
  /**
   * 评估意向性挑战
   */
  _assessIntentionality(evaluativeData) {
    // 目标相关性越高，意向性越强
    return evaluativeData.goalRelevance;
  }
  
  /**
   * 评估现象学挑战
   */
  _assessPhenomenology(feelingData) {
    return feelingData.phenomenalClarity;
  }
  
  // ============ 评估描述生成 ============
  
  _getFeelingAssessment(score) {
    if (score >= 0.8) return {
      level: 'excellent',
      description: '该情绪具有高度清晰的主观体验特征，感受质鲜明，身体觉察敏锐',
      theoreticalImplication: '符合 Feeling 传统的理想案例，情绪体验具有强烈的第一人称给定性'
    };
    if (score >= 0.6) return {
      level: 'good',
      description: '该情绪具有较好的主观体验质量，感受质可清晰识别',
      theoreticalImplication: 'Feeling 传统可有效解释该情绪的主要特征'
    };
    if (score >= 0.4) return {
      level: 'moderate',
      description: '该情绪的主观体验特征中等，可能需要结合其他传统进行完整解释',
      theoreticalImplication: '单一 Feeling 传统解释力有限，需要整合视角'
    };
    return {
      level: 'low',
      description: '该情绪的主观体验特征较弱，Feeling 传统解释力有限',
      theoreticalImplication: '可能需要优先考虑 Evaluative 或 Motivational 传统'
    };
  }
  
  _getEvaluativeAssessment(score, valence) {
    const valenceDesc = valence === 'positive' ? '积极' : valence === 'negative' ? '消极' : '中性';
    if (score >= 0.8) return {
      level: 'excellent',
      description: `该情绪具有清晰的${valenceDesc}评价结构，认知评价维度完整`,
      theoreticalImplication: 'Evaluative 传统可有效解释该情绪的产生机制和适当性'
    };
    if (score >= 0.6) return {
      level: 'good',
      description: `该情绪具有较好的${valenceDesc}评价特征，评价维度较为清晰`,
      theoreticalImplication: 'Evaluative 传统对该情绪有较好的解释力'
    };
    return {
      level: 'moderate',
      description: `该情绪的评价特征${valenceDesc}，但评价维度可能不完整`,
      theoreticalImplication: '需要结合 Feeling 或 Motivational 传统进行补充'
    };
  }
  
  _getMotivationalAssessment(score, actionUrge) {
    if (score >= 0.8) return {
      level: 'excellent',
      description: '该情绪具有强烈的动机驱动特征，行动冲动明显',
      theoreticalImplication: 'Motivational 传统可有效解释该情绪的功能意义'
    };
    if (score >= 0.6) return {
      level: 'good',
      description: '该情绪具有中等的动机特征，有一定的行动倾向',
      theoreticalImplication: 'Motivational 传统对该情绪有较好的解释力'
    };
    return {
      level: actionUrge < 0.3 ? 'low (actionless)' : 'moderate',
      description: actionUrge < 0.3 ? 
        '该情绪属于"无行动情绪"，动机特征较弱' : 
        '该情绪的动机特征中等',
      theoreticalImplication: 'Motivational 传统解释力有限，可能需要结合其他传统'
    };
  }
  
  // ============ 理论洞察生成 ============
  
  _generateTheoreticalInsights(emotionName, feeling, evaluative, motivational, challenges) {
    const insights = [];
    
    // 基于主导传统的洞察
    const dominant = this._getDominantTradition(feeling.score, evaluative.score, motivational.score);
    if (dominant === EmotionTraditions.FEELING) {
      insights.push({
        tradition: 'Feeling',
        insight: `${emotionName} 是一种体验导向的情绪，其主观感受质是最显著的特征。James-Lange 理论框架下，这种情绪可被理解为对身体变化的感知。`,
        reference: 'James (1884): "our feeling of changes as they occur IS the emotion"'
      });
    } else if (dominant === EmotionTraditions.EVALUATIVE) {
      insights.push({
        tradition: 'Evaluative',
        insight: `${emotionName} 主要由认知评价驱动，其核心是对情境的诠释和评估。Appraisal Theory 框架下，这种情绪反映了对目标相关性的判断。`,
        reference: 'Lazarus (1991): 情绪是对个人意义的评估反应'
      });
    } else {
      insights.push({
        tradition: 'Motivational',
        insight: `${emotionName} 是一种行动导向的情绪，其核心功能是驱动适应性行为。进化心理学框架下，这种情绪具有明确的生存价值。`,
        reference: 'Frijda (1986): 情绪的本质是行动倾向'
      });
    }
    
    // 基于整合程度的洞察
    const integrationLevel = feeling.score + evaluative.score + motivational.score;
    if (integrationLevel >= 2.4) {
      insights.push({
        tradition: 'Integration',
        insight: `${emotionName} 是一种"完整情绪"，在三大传统维度上都有较高分数，适合用整合框架进行分析。`,
        reference: 'Scarantino (2016): 情绪理论整合趋势'
      });
    }
    
    // 基于理论挑战的洞察
    if (challenges.differentiation.score < 0.5) {
      insights.push({
        tradition: 'Challenge',
        insight: `${emotionName} 的分化特征较弱，可能与其他情绪或非情绪状态存在边界模糊。`,
        reference: 'Griffiths (1997): 情绪类别的自然种类问题'
      });
    }
    
    return insights;
  }
  
  // ============ 情绪分化检测 ============
  
  /**
   * 检测情绪分化程度
   * 区分情绪与非情绪状态
   * 
   * @param {object} emotionProfile - 情绪档案
   * @returns {object} 分化检测结果
   */
  detectEmotionDifferentiation(emotionProfile) {
    const { feeling, evaluative, motivational } = emotionProfile;
    
    // 计算情绪性分数
    const emotionalityScore = (
      feeling.qualiaIntensity * 0.35 +
      evaluative.goalRelevance * 0.35 +
      motivational.actionUrge * 0.30
    );
    
    // 判断是否为情绪状态
    const isEmotion = emotionalityScore >= this.config.differentiationThreshold;
    
    // 检测情绪类型
    let emotionType = 'unknown';
    if (isEmotion) {
      if (evaluative.valence === 'positive' && motivational.actionUrge > 0.6) {
        emotionType = 'approach_emotion'; // 趋近情绪 (如 joy, excited)
      } else if (evaluative.valence === 'negative' && motivational.actionUrge > 0.6) {
        emotionType = 'avoidance_emotion'; // 回避情绪 (如 fear, angry)
      } else if (motivational.actionUrge < 0.3) {
        emotionType = 'low_action_emotion'; // 低行动情绪 (如 sad, tired)
      } else {
        emotionType = 'balanced_emotion'; // 平衡情绪
      }
    } else {
      emotionType = 'non_emotional_state'; // 非情绪状态
    }
    
    return {
      isEmotion: isEmotion,
      emotionalityScore: emotionalityScore,
      emotionType: emotionType,
      confidence: this._calculateDifferentiationConfidence(emotionProfile),
      differentiationDimensions: {
        feeling: feeling.qualiaIntensity,
        evaluative: evaluative.goalRelevance,
        motivational: motivational.actionUrge
      },
      theoreticalBasis: 'SEP Emotion Theory: Differentiation Challenge'
    };
  }
  
  /**
   * 计算分化置信度
   */
  _calculateDifferentiationConfidence(profile) {
    const scores = [
      profile.feeling.qualiaIntensity,
      profile.evaluative.goalRelevance,
      profile.motivational.actionUrge
    ];
    const variance = scores.reduce((a, b) => a + Math.pow(b - 0.5, 2), 0) / 3;
    // 方差越大，置信度越高 (分数越极端越确定)
    return Math.min(1.0, 0.5 + variance);
  }
  
  // ============ 导出 ============
  
  getInfo() {
    return {
      name: 'EmotionTraditionsIntegration',
      version: '4.9.0',
      description: '情绪三大传统整合模块 - 基于 SEP 情绪理论权威框架',
      theoreticalFoundations: [
        'Feeling Tradition (James, James-Lange)',
        'Evaluative Tradition (Appraisal Theory)',
        'Motivational Tradition (Frijda, Evolutionary Psychology)',
        'SEP Emotion Theory (Scarantino, 2016)'
      ],
      capabilities: [
        '情绪三大传统评估',
        '整合分数计算',
        '四大理论挑战分析',
        '情绪分化检测',
        '理论洞察生成'
      ],
      config: this.config
    };
  }
}

// ============ 导出 ============

module.exports = {
  EmotionTraditionsIntegration,
  EmotionTraditions,
  EmotionComponents,
  TheoreticalChallenges
};
