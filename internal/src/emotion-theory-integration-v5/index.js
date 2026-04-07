/**
 * 情绪理论三大传统整合 v2.0 (Emotion Theory Three Traditions Integration v2.0)
 * 
 * 基于斯坦福哲学百科全书 (SEP) 2026 版权威理论：
 * - Feeling Tradition (感受传统): James-Lange, Damasio
 * - Evaluative Tradition (评价传统): Solomon, Nussbaum, Appraisal Theory
 * - Motivational Tradition (动机传统): Aristotle, Deigh, Greenspan
 * 
 * SEP 四大理论挑战完整整合：
 * 1. Differentiation (区分性): 情绪如何彼此区分？
 * 2. Motivation (动机性): 情绪如何激发动机？
 * 3. Intentionality (意向性): 情绪是否有对象指向性？
 * 4. Phenomenology (现象学): 情绪是否总涉及主观体验？
 * 
 * 核心理论来源:
 * - Scarantino, A. (2026). Emotion. Stanford Encyclopedia of Philosophy
 * - Prinz, J. (2004). Gut Reactions: A Perceptual Theory of Emotions
 * - Barrett, L. F. (2017). How Emotions Are Made
 * - Husserl, E. (1913). Ideas Pertaining to a Pure Phenomenology
 * - Sartre, J.-P. (1937). The Transcendence of the Ego
 * 
 * @version 2.0.0 (v5.0.0 HeartFlow)
 * @author HeartFlow Team
 */

const EmotionTraditionsV5 = {
  /**
   * 感受传统 (Feeling Tradition)
   * 核心：情绪是独特的意识体验
   * 代表：James-Lange, Damasio
   * 优势：捕捉主观体验质量
   * 局限：难以解释情绪分化和意向性
   */
  FEELING: {
    name: '感受传统',
    core: '情绪是独特的意识体验',
    representatives: ['William James', 'Carl Lange', 'Antonio Damasio'],
    strength: '捕捉主观体验质量 (phenomenal quality)',
    limitation: '难以解释情绪分化和意向性',
    keyInsight: '情绪的感受特性 (what it feels like) 是其本质',
    
    /**
     * 评估函数：评估用户情绪的感受维度
     */
    assess: function(emotionReport) {
      const assessment = {
        tradition: 'FEELING',
        dimensions: {},
        score: 0,
        insights: []
      };
      
      // 评估主观体验强度
      if (emotionReport.intensity) {
        assessment.dimensions.intensity = emotionReport.intensity;
        assessment.insights.push(`主观体验强度：${emotionReport.intensity}/10`);
      }
      
      // 评估体验质量
      if (emotionReport.feelingQuality) {
        assessment.dimensions.quality = emotionReport.feelingQuality;
        assessment.insights.push(`体验质量：${emotionReport.feelingQuality}`);
      }
      
      // 评估身体感受
      if (emotionReport.bodySensations && emotionReport.bodySensations.length > 0) {
        assessment.dimensions.bodyAwareness = emotionReport.bodySensations.length;
        assessment.insights.push(`身体感受：${emotionReport.bodySensations.join(', ')}`);
      }
      
      // 计算感受传统分数
      assessment.score = (
        (emotionReport.intensity || 0) * 0.4 +
        (emotionReport.bodySensations ? emotionReport.bodySensations.length * 10 : 0) * 0.3 +
        (emotionReport.feelingQuality ? 50 : 0) * 0.3
      ) / 10;
      
      return assessment;
    }
  },
  
  /**
   * 评价传统 (Evaluative Tradition)
   * 核心：情绪是对情境的独特评价
   * 代表：Solomon, Nussbaum, Appraisal Theorists
   * 优势：解释情绪合理性和对象指向性
   * 局限：难以解释无意识情绪和快速情绪反应
   */
  EVALUATIVE: {
    name: '评价传统',
    core: '情绪是对情境的独特评价 (appraisal)',
    representatives: ['Robert Solomon', 'Martha Nussbaum', 'Appraisal Theorists'],
    strength: '解释情绪合理性和对象指向性 (aboutness)',
    limitation: '难以解释无意识情绪和快速情绪反应',
    keyInsight: '情绪包含对情境的评价性解释',
    
    /**
     * 评估函数：评估用户情绪的评价维度
     */
    assess: function(emotionReport) {
      const assessment = {
        tradition: 'EVALUATIVE',
        dimensions: {},
        score: 0,
        insights: []
      };
      
      // 评估评价内容
      if (emotionReport.appraisal) {
        assessment.dimensions.appraisal = emotionReport.appraisal;
        assessment.insights.push(`评价内容：${emotionReport.appraisal}`);
      }
      
      // 评估对象指向性
      if (emotionReport.object) {
        assessment.dimensions.intentionality = true;
        assessment.insights.push(`情绪对象：${emotionReport.object}`);
      }
      
      // 评估适当性
      if (emotionReport.appropriateness) {
        assessment.dimensions.appropriateness = emotionReport.appropriateness;
        assessment.insights.push(`适当性评估：${emotionReport.appropriateness}`);
      }
      
      // 评估评价维度 (Lazarus 评价理论)
      const appraisalDimensions = [];
      if (emotionReport.relevance) appraisalDimensions.push('相关性');
      if (emotionReport.implication) appraisalDimensions.push('含义');
      if (emotionReport.copingPotential) appraisalDimensions.push('应对潜力');
      if (emotionReport.normativeSignificance) appraisalDimensions.push('规范意义');
      
      if (appraisalDimensions.length > 0) {
        assessment.dimensions.appraisalComplexity = appraisalDimensions.length;
        assessment.insights.push(`评价维度：${appraisalDimensions.join(', ')}`);
      }
      
      // 计算评价传统分数
      assessment.score = (
        (emotionReport.appraisal ? 40 : 0) +
        (emotionReport.object ? 30 : 0) +
        (appraisalDimensions.length * 10)
      ) / 10;
      
      return assessment;
    }
  },
  
  /**
   * 动机传统 (Motivational Tradition)
   * 核心：情绪是独特的动机状态
   * 代表：Aristotle, Deigh, Greenspan
   * 优势：解释情绪与行动的联系
   * 局限：难以区分情绪和其他动机状态
   */
  MOTIVATIONAL: {
    name: '动机传统',
    core: '情绪是独特的动机状态 (motivational state)',
    representatives: ['Aristotle', 'John Deigh', 'Patricia Greenspan'],
    strength: '解释情绪与行动的联系',
    limitation: '难以区分情绪和其他动机状态（如欲望）',
    keyInsight: '情绪包含行动倾向 (action tendency)',
    
    /**
     * 评估函数：评估用户情绪的动机维度
     */
    assess: function(emotionReport) {
      const assessment = {
        tradition: 'MOTIVATIONAL',
        dimensions: {},
        score: 0,
        insights: []
      };
      
      // 评估行动倾向
      if (emotionReport.actionTendency) {
        assessment.dimensions.actionTendency = emotionReport.actionTendency;
        assessment.insights.push(`行动倾向：${emotionReport.actionTendency}`);
      }
      
      // 评估动机强度
      if (emotionReport.motivationStrength) {
        assessment.dimensions.motivationStrength = emotionReport.motivationStrength;
        assessment.insights.push(`动机强度：${emotionReport.motivationStrength}/10`);
      }
      
      // 评估目标相关性
      if (emotionReport.goalRelevance) {
        assessment.dimensions.goalRelevance = emotionReport.goalRelevance;
        assessment.insights.push(`目标相关性：${emotionReport.goalRelevance}`);
      }
      
      // 评估实际行为
      if (emotionReport.actualBehavior) {
        assessment.dimensions.behavior = emotionReport.actualBehavior;
        assessment.insights.push(`实际行为：${emotionReport.actualBehavior}`);
      }
      
      // 计算动机传统分数
      assessment.score = (
        (emotionReport.actionTendency ? 30 : 0) +
        (emotionReport.motivationStrength || 0) * 2 +
        (emotionReport.goalRelevance ? 20 : 0) +
        (emotionReport.actualBehavior ? 20 : 0)
      ) / 10;
      
      return assessment;
    }
  }
};

/**
 * SEP 情绪四大挑战评估框架
 */
const FourChallengesFramework = {
  /**
   * 区分性挑战 (Differentiation Challenge)
   * 问题：情绪如何彼此区分？如何与非情绪状态区分？
   */
  DIFFERENTIATION: {
    name: '区分性',
    question: '情绪如何彼此区分？如何与非情绪状态区分？',
    
    assess: function(emotionReport) {
      const assessment = {
        challenge: 'DIFFERENTIATION',
        score: 0,
        maxScore: 100,
        dimensions: {},
        insights: [],
        recommendations: []
      };
      
      // 评估情绪类别清晰度
      if (emotionReport.emotionLabel) {
        assessment.dimensions.categoryClarity = true;
        assessment.insights.push(`情绪类别：${emotionReport.emotionLabel}`);
        assessment.score += 20;
      }
      
      // 评估原型相似度
      if (emotionReport.prototypeMatch) {
        assessment.dimensions.prototypeMatch = emotionReport.prototypeMatch;
        assessment.insights.push(`原型相似度：${emotionReport.prototypeMatch}%`);
        assessment.score += emotionReport.prototypeMatch * 0.3;
      }
      
      // 评估成分完整性
      const components = [];
      if (emotionReport.feelingQuality) components.push('感受');
      if (emotionReport.appraisal) components.push('评价');
      if (emotionReport.actionTendency) components.push('动机');
      if (emotionReport.bodySensations) components.push('身体');
      if (emotionReport.expression) components.push('表达');
      
      assessment.dimensions.componentCount = components.length;
      assessment.insights.push(`情绪成分：${components.join(', ')} (${components.length}/5)`);
      assessment.score += components.length * 15;
      
      // 评估边界清晰度
      if (emotionReport.confusionWith) {
        assessment.dimensions.boundaryClarity = '模糊';
        assessment.insights.push(`与...混淆：${emotionReport.confusionWith}`);
        assessment.recommendations.push('区分练习：对比当前情绪与混淆情绪的差异');
      } else {
        assessment.dimensions.boundaryClarity = '清晰';
        assessment.score += 15;
      }
      
      return assessment;
    }
  },
  
  /**
   * 动机性挑战 (Motivation Challenge)
   * 问题：情绪如何激发动机？情绪与行动的关系是什么？
   */
  MOTIVATION: {
    name: '动机性',
    question: '情绪如何激发动机？情绪与行动的关系是什么？',
    
    assess: function(emotionReport) {
      const assessment = {
        challenge: 'MOTIVATION',
        score: 0,
        maxScore: 100,
        dimensions: {},
        insights: [],
        recommendations: []
      };
      
      // 评估行动倾向强度
      if (emotionReport.actionTendencyStrength) {
        assessment.dimensions.urgeStrength = emotionReport.actionTendencyStrength;
        assessment.insights.push(`行动冲动强度：${emotionReport.actionTendencyStrength}/10`);
        assessment.score += emotionReport.actionTendencyStrength * 5;
      }
      
      // 评估行动倾向类型
      if (emotionReport.actionTendency) {
        const tendencyTypes = {
          '接近': 'approach',
          '回避': 'avoidance',
          '对抗': 'confrontation',
          '冻结': 'freeze',
          '寻求支持': 'support-seeking'
        };
        
        for (const [cn, en] of Object.entries(tendencyTypes)) {
          if (emotionReport.actionTendency.includes(cn)) {
            assessment.dimensions.tendencyType = en;
            break;
          }
        }
        assessment.insights.push(`行动倾向类型：${emotionReport.actionTendency}`);
        assessment.score += 20;
      }
      
      // 评估实际行为
      if (emotionReport.actualBehavior) {
        assessment.dimensions.behaviorExecuted = true;
        assessment.insights.push(`实际行为：${emotionReport.actualBehavior}`);
        assessment.score += 20;
      } else {
        assessment.dimensions.behaviorExecuted = false;
        assessment.insights.push('尚未采取行动');
        assessment.recommendations.push('探索阻碍行动的因素');
      }
      
      // 评估动机冲突
      if (emotionReport.motivationalConflict) {
        assessment.dimensions.conflict = true;
        assessment.insights.push(`动机冲突：${emotionReport.motivationalConflict}`);
        assessment.recommendations.push('解决动机冲突：澄清优先级');
      }
      
      return assessment;
    }
  },
  
  /**
   * 意向性挑战 (Intentionality Challenge)
   * 问题：情绪是否有对象指向性？情绪能否适当或不适当？
   */
  INTENTIONALITY: {
    name: '意向性',
    question: '情绪是否有对象指向性？情绪能否适当或不适当？',
    
    assess: function(emotionReport) {
      const assessment = {
        challenge: 'INTENTIONALITY',
        score: 0,
        maxScore: 100,
        dimensions: {},
        insights: [],
        recommendations: []
      };
      
      // 评估情绪对象
      if (emotionReport.object) {
        assessment.dimensions.hasObject = true;
        assessment.insights.push(`情绪对象：${emotionReport.object}`);
        assessment.score += 25;
      } else {
        assessment.dimensions.hasObject = false;
        assessment.insights.push('情绪无明显对象 (可能是心境而非情绪)');
        assessment.recommendations.push('探索情绪的潜在触发因素');
      }
      
      // 评估形式对象 (formal object)
      if (emotionReport.formalObject) {
        assessment.dimensions.formalObject = emotionReport.formalObject;
        assessment.insights.push(`形式对象：${emotionReport.formalObject}`);
        assessment.score += 20;
      }
      
      // 评估适当性
      if (emotionReport.appropriateness) {
        assessment.dimensions.appropriateness = emotionReport.appropriateness;
        assessment.insights.push(`适当性：${emotionReport.appropriateness}`);
        assessment.score += emotionReport.appropriateness === '适当' ? 25 : 10;
      }
      
      // 评估证成性
      if (emotionReport.justification) {
        assessment.dimensions.justification = emotionReport.justification;
        assessment.insights.push(`证成性：${emotionReport.justification}`);
        assessment.score += 15;
      }
      
      return assessment;
    }
  },
  
  /**
   * 现象学挑战 (Phenomenology Challenge)
   * 问题：情绪是否总涉及主观体验？是什么类型的体验？
   */
  PHENOMENOLOGY: {
    name: '现象学',
    question: '情绪是否总涉及主观体验？是什么类型的体验？',
    
    assess: function(emotionReport) {
      const assessment = {
        challenge: 'PHENOMENOLOGY',
        score: 0,
        maxScore: 100,
        dimensions: {},
        insights: [],
        recommendations: []
      };
      
      // 评估意识体验
      if (emotionReport.consciousExperience) {
        assessment.dimensions.conscious = true;
        assessment.insights.push(`意识体验：${emotionReport.consciousExperience}`);
        assessment.score += 30;
      } else {
        assessment.dimensions.conscious = false;
        assessment.insights.push('无明显意识体验 (可能是无意识情绪)');
        assessment.recommendations.push('身体扫描练习：觉察潜在的身体信号');
      }
      
      // 评估体验质量
      if (emotionReport.feelingQuality) {
        assessment.dimensions.quality = emotionReport.feelingQuality;
        assessment.insights.push(`体验质量：${emotionReport.feelingQuality}`);
        assessment.score += 20;
      }
      
      // 评估体验价态
      if (emotionReport.valence) {
        assessment.dimensions.valence = emotionReport.valence;
        assessment.insights.push(`价态：${emotionReport.valence}`);
        assessment.score += 15;
      }
      
      // 评估前反思体验
      if (emotionReport.prereflexiveAwareness) {
        assessment.dimensions.prereflexive = true;
        assessment.insights.push('前反思自我意识：已觉察');
        assessment.score += 20;
      }
      
      // 评估反思体验
      if (emotionReport.reflexiveAwareness) {
        assessment.dimensions.reflexive = true;
        assessment.insights.push('反思自我意识：已觉察');
        assessment.score += 15;
      }
      
      return assessment;
    }
  }
};

/**
 * 情绪理论整合器 v2.0
 * 整合三大传统和四大挑战
 */
class EmotionTheoryIntegratorV5 {
  constructor() {
    this.traditions = EmotionTraditionsV5;
    this.challenges = FourChallengesFramework;
  }
  
  /**
   * 完整评估：三大传统 + 四大挑战
   */
  assess(emotionReport) {
    const assessment = {
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      emotionLabel: emotionReport.emotionLabel || '未命名情绪',
      
      // 三大传统评估
      traditions: {
        feeling: this.traditions.FEELING.assess(emotionReport),
        evaluative: this.traditions.EVALUATIVE.assess(emotionReport),
        motivational: this.traditions.MOTIVATIONAL.assess(emotionReport)
      },
      
      // 四大挑战评估
      challenges: {
        differentiation: this.challenges.DIFFERENTIATION.assess(emotionReport),
        motivation: this.challenges.MOTIVATION.assess(emotionReport),
        intentionality: this.challenges.INTENTIONALITY.assess(emotionReport),
        phenomenology: this.challenges.PHENOMENOLOGY.assess(emotionReport)
      },
      
      // 整合分析
      integration: {
        dominantTradition: null,
        integrationScore: 0,
        gaps: [],
        recommendations: []
      }
    };
    
    // 确定主导传统
    const traditionScores = {
      feeling: assessment.traditions.feeling.score,
      evaluative: assessment.traditions.evaluative.score,
      motivational: assessment.traditions.motivational.score
    };
    
    const maxTradition = Object.keys(traditionScores).reduce(
      (a, b) => traditionScores[a] > traditionScores[b] ? a : b
    );
    assessment.integration.dominantTradition = maxTradition.toUpperCase();
    
    // 计算整合分数
    const challengeScores = Object.values(assessment.challenges).map(c => c.score);
    assessment.integration.integrationScore = 
      challengeScores.reduce((a, b) => a + b, 0) / challengeScores.length;
    
    // 识别差距
    Object.entries(assessment.challenges).forEach(([key, challenge]) => {
      if (challenge.score < 50) {
        assessment.integration.gaps.push({
          dimension: challenge.name,
          score: challenge.score,
          recommendations: challenge.recommendations
        });
      }
    });
    
    // 生成整合建议
    assessment.integration.recommendations = this.generateRecommendations(assessment);
    
    return assessment;
  }
  
  /**
   * 生成整合建议
   */
  generateRecommendations(assessment) {
    const recommendations = [];
    
    // 基于主导传统的建议
    const dominant = assessment.integration.dominantTradition;
    if (dominant === 'FEELING') {
      recommendations.push({
        area: '感受传统主导',
        suggestion: '你的情绪体验以主观感受为主。建议加强评价分析和行动探索，以获得更完整的情绪理解。',
        exercise: '情绪三维度探索 (15 分钟): 感受→评价→动机'
      });
    } else if (dominant === 'EVALUATIVE') {
      recommendations.push({
        area: '评价传统主导',
        suggestion: '你的情绪体验以评价分析为主。建议加强身体感受觉察和行动探索，以平衡理性与感性。',
        exercise: '身体 - 评价整合练习 (15 分钟): 身体扫描→评价觉察→行动倾向'
      });
    } else if (dominant === 'MOTIVATIONAL') {
      recommendations.push({
        area: '动机传统主导',
        suggestion: '你的情绪体验以行动倾向为主。建议加强感受觉察和评价反思，以避免冲动行动。',
        exercise: '暂停 - 反思 - 行动 (10 分钟): 感受觉察→评价检查→明智行动'
      });
    }
    
    // 基于差距的建议
    assessment.integration.gaps.forEach(gap => {
      if (gap.dimension === '区分性') {
        recommendations.push({
          area: '情绪区分',
          suggestion: '情绪边界不够清晰，可能与其他情绪混淆。',
          exercise: '情绪对比练习：当前情绪 vs 易混淆情绪，找出 3 个关键差异'
        });
      } else if (gap.dimension === '动机性') {
        recommendations.push({
          area: '情绪 - 行动连接',
          suggestion: '情绪与行动的连接不够清晰。',
          exercise: '行动倾向探索：情绪想让你做什么？这个行动符合你的价值观吗？'
        });
      } else if (gap.dimension === '意向性') {
        recommendations.push({
          area: '情绪对象',
          suggestion: '情绪的对象不够清晰。',
          exercise: '情绪对象探索：这个情绪是关于什么的？它指向什么？'
        });
      } else if (gap.dimension === '现象学') {
        recommendations.push({
          area: '主观体验',
          suggestion: '情绪的主观体验不够清晰。',
          exercise: '现象学还原练习：悬置判断，纯粹描述体验本身'
        });
      }
    });
    
    return recommendations;
  }
  
  /**
   * 生成整合练习
   */
  generateIntegrationExercise(assessment) {
    const exercise = {
      title: '情绪理论三大传统整合练习',
      duration: '15-20 分钟',
      steps: [
        {
          step: 1,
          tradition: 'Feeling (感受)',
          duration: '5 分钟',
          instruction: '感受体验',
          prompts: [
            '这个情绪在你身体里感觉如何？',
            '它有什么样的质感、温度、形状？',
            '它在身体的哪个部位最强烈？'
          ]
        },
        {
          step: 2,
          tradition: 'Evaluative (评价)',
          duration: '5 分钟',
          instruction: '评价分析',
          prompts: [
            '这个情绪在告诉你什么？',
            '你对情境的评价是什么？',
            '这个情绪适当吗？为什么？'
          ]
        },
        {
          step: 3,
          tradition: 'Motivational (动机)',
          duration: '5 分钟',
          instruction: '动机探索',
          prompts: [
            '这个情绪想让你做什么？',
            '这个行动倾向符合你的价值观吗？',
            '你会采取什么行动？'
          ]
        },
        {
          step: 4,
          tradition: 'Integration (整合)',
          duration: '5 分钟',
          instruction: '整合反思',
          prompts: [
            '感受、评价、动机之间有什么联系？',
            '这个情绪整体在告诉你什么？',
            '你从这次探索中学到了什么？'
          ]
        }
      ]
    };
    
    return exercise;
  }
}

// ============ 导出 ============

module.exports = {
  EmotionTraditionsV5,
  FourChallengesFramework,
  EmotionTheoryIntegratorV5
};
