/**
 * 依恋理论增强模块 (Attachment Theory Enhancement Module) v3.42.0
 * 
 * 基于 John Bowlby、Mary Ainsworth 经典理论及现代依恋研究
 * 
 * 核心理论框架:
 * 1. 成人依恋四类型模型 (Bartholomew & Horowitz, 1991)
 * 2. 内部工作模式 (Internal Working Models)
 * 3. 依恋修复技术 (Attachment Repair)
 * 
 * @version 3.42.0
 * @author HeartFlow Team
 */

module.exports = {
  version: '3.42.0',
  
  /**
   * 成人依恋四类型评估
   * 基于自我模型 (Self-Model) 和他人模型 (Other-Model) 两个维度
   */
  assessFourTypes(input) {
    const anxietyScore = this._calculateAnxietyScore(input);
    const avoidanceScore = this._calculateAvoidanceScore(input);
    
    // 四类型分类
    let primaryType, description;
    if (anxietyScore < 5 && avoidanceScore < 5) {
      primaryType = 'secure';
      description = '安全型：对亲密关系感到舒适，能平衡亲密与独立';
    } else if (anxietyScore >= 5 && avoidanceScore < 5) {
      primaryType = 'anxious-preoccupied';
      description = '焦虑 - 专注型：渴望亲密但担心被抛弃，过度寻求确认';
    } else if (anxietyScore < 5 && avoidanceScore >= 5) {
      primaryType = 'dismissing-avoidant';
      description = '回避 - 轻视型：强调独立，贬低亲密关系价值，压抑依恋需求';
    } else {
      primaryType = 'fearful-avoidant';
      description = '恐惧 - 回避型：既渴望又害怕亲密，关系模式矛盾混乱';
    }
    
    return {
      primaryType,
      typeDescription: description,
      scores: {
        anxiety: anxietyScore,
        avoidance: avoidanceScore,
        security: Math.max(0, 10 - Math.max(anxietyScore, avoidanceScore))
      },
      selfModel: anxietyScore >= 5 ? 'negative' : 'positive',
      otherModel: avoidanceScore >= 5 ? 'negative' : 'positive',
      confidence: this._calculateConfidence(anxietyScore, avoidanceScore)
    };
  },

  /**
   * 分析内部工作模式 (Internal Working Models)
   * 包括自我模型和他人模型
   */
  analyzeInternalWorkingModels(input) {
    const selfBeliefs = this._extractSelfBeliefs(input);
    const otherBeliefs = this._extractOtherBeliefs(input);
    
    const selfModelScore = this._scoreBeliefs(selfBeliefs);
    const otherModelScore = this._scoreBeliefs(otherBeliefs);
    
    return {
      selfModel: {
        orientation: selfModelScore >= 0 ? 'positive' : 'negative',
        score: selfModelScore,
        beliefs: selfBeliefs
      },
      otherModel: {
        orientation: otherModelScore >= 0 ? 'positive' : 'negative',
        score: otherModelScore,
        beliefs: otherBeliefs
      },
      attachmentQuadrant: this._getAttachmentQuadrant(selfModelScore, otherModelScore)
    };
  },

  /**
   * 生成依恋修复计划
   */
  generateRepairPlan(attachmentStyle, goals = []) {
    const repairTechniques = {
      'secure': {
        techniques: ['maintain_secure_base', 'deepen_intimacy', 'support_partner'],
        exercises: ['gratitude_practice', 'attunement_exercise'],
        timeline: '持续维护'
      },
      'anxious-preoccupied': {
        techniques: ['self_soothing', 'cognitive_restructuring', 'direct_communication'],
        exercises: ['mindful_breathing', 'thought_record', 'needs_expression'],
        timeline: '8-12 周'
      },
      'dismissing-avoidant': {
        techniques: ['deactivation_awareness', 'vulnerability_exposure', 'reframe_intimacy'],
        exercises: ['emotion_identification', 'small_sharing_steps', 'interdependence_reflection'],
        timeline: '12-16 周'
      },
      'fearful-avoidant': {
        techniques: ['safety_building', 'self_compassion', 'trust_gradual', 'pattern_interruption'],
        exercises: ['grounding_practice', 'self_kindness', 'push_pull_awareness'],
        timeline: '16-24 周'
      }
    };
    
    return repairTechniques[attachmentStyle] || repairTechniques['secure'];
  },

  /**
   * 获取维度评分 (焦虑 + 回避)
   */
  getDimensionScores(input) {
    const anxiety = this._calculateAnxietyScore(input);
    const avoidance = this._calculateAvoidanceScore(input);
    
    return {
      anxiety,
      avoidance,
      security: Math.max(0, 10 - Math.max(anxiety, avoidance)),
      anxietyLevel: anxiety >= 7 ? 'high' : anxiety >= 4 ? 'moderate' : 'low',
      avoidanceLevel: avoidance >= 7 ? 'high' : avoidance >= 4 ? 'moderate' : 'low'
    };
  },

  /**
   * 检测关系模式 (抗议行为、去激活策略等)
   */
  detectRelationshipPatterns(input) {
    const patterns = [];
    
    // 抗议行为 (Protest Behavior) - Bowlby
    const protestBehaviors = [
      { pattern: /不停.*联系/i, type: 'excessive_contact', name: '过度联系' },
      { pattern: /故意.*不理/i, type: 'withdrawal', name: '故意疏远' },
      { pattern: /吃醋/i, type: 'jealousy', name: '嫉妒行为' },
      { pattern: /分手.*威胁/i, type: 'threat', name: '分手威胁' },
      { pattern: /生闷气/i, type: 'sulking', name: '生闷气' }
    ];
    
    // 去激活策略 (Deactivation Strategies) - 回避型
    const deactivationStrategies = [
      { pattern: /一个人.*好/i, type: 'self_reliance', name: '过度自给自足' },
      { pattern: /不想.*谈/i, type: 'emotional_suppression', name: '情感压抑' },
      { pattern: /太.*粘人/i, type: 'intimacy_avoidance', name: '亲密回避' },
      { pattern: /理性.*分析/i, type: 'intellectualization', name: '理性化' }
    ];
    
    // 过度激活策略 (Hyperactivation Strategies) - 焦虑型
    const hyperactivationStrategies = [
      { pattern: /一直.*想/i, type: 'rumination', name: '反复思考' },
      { pattern: /需要.*确认/i, type: 'reassurance_seeking', name: '寻求确认' },
      { pattern: /是不是.*不爱/i, type: 'love_testing', name: '爱的测试' }
    ];
    
    // 推 - 拉模式 (Push-Pull) - 恐惧型
    const pushPullPatterns = [
      { pattern: /想.*又怕/i, type: 'approach_avoidance', name: '接近 - 回避冲突' },
      { pattern: /靠近.*逃/i, type: 'flight_when_close', name: '靠近时逃离' }
    ];
    
    [...protestBehaviors, ...deactivationStrategies, ...hyperactivationStrategies, ...pushPullPatterns]
      .forEach(({ pattern, type, name }) => {
        if (pattern.test(input)) {
          patterns.push({ type, name, detected: true });
        }
      });
    
    return {
      patterns,
      hasProtestBehavior: patterns.some(p => ['excessive_contact', 'withdrawal', 'jealousy', 'threat', 'sulking'].includes(p.type)),
      hasDeactivation: patterns.some(p => ['self_reliance', 'emotional_suppression', 'intimacy_avoidance', 'intellectualization'].includes(p.type)),
      hasHyperactivation: patterns.some(p => ['rumination', 'reassurance_seeking', 'love_testing'].includes(p.type)),
      hasPushPull: patterns.some(p => ['approach_avoidance', 'flight_when_close'].includes(p.type))
    };
  },

  // ========== 内部方法 ==========

  _calculateAnxietyScore(input) {
    let score = 0;
    
    const anxietyIndicators = [
      { pattern: /担心.*抛弃/i, weight: 2 },
      { pattern: /害怕.*离开/i, weight: 2 },
      { pattern: /需要.*确认/i, weight: 2 },
      { pattern: /是不是.*不爱/i, weight: 2 },
      { pattern: /会不会.*分手/i, weight: 2 },
      { pattern: /总是.*不回/i, weight: 1 },
      { pattern: /一直.*想/i, weight: 1 },
      { pattern: /不够好/i, weight: 2 },
      { pattern: /不值得.*爱/i, weight: 2 },
      { pattern: /害怕.*失去/i, weight: 1 }
    ];
    
    anxietyIndicators.forEach(({ pattern, weight }) => {
      if (pattern.test(input)) score += weight;
    });
    
    return Math.min(10, score);
  },

  _calculateAvoidanceScore(input) {
    let score = 0;
    
    const avoidanceIndicators = [
      { pattern: /需要.*空间/i, weight: 2 },
      { pattern: /不想.*谈/i, weight: 2 },
      { pattern: /一个人.*好/i, weight: 2 },
      { pattern: /太.*粘人/i, weight: 2 },
      { pattern: /不想.*承诺/i, weight: 2 },
      { pattern: /习惯.*独立/i, weight: 1 },
      { pattern: /不需要.*别人/i, weight: 2 },
      { pattern: /亲密.*麻烦/i, weight: 2 },
      { pattern: /感情.*累/i, weight: 1 },
      { pattern: /保持.*距离/i, weight: 1 }
    ];
    
    avoidanceIndicators.forEach(({ pattern, weight }) => {
      if (pattern.test(input)) score += weight;
    });
    
    return Math.min(10, score);
  },

  _extractSelfBeliefs(input) {
    const beliefs = [];
    
    const positiveSelf = [
      { pattern: /值得.*爱/i, belief: '我值得被爱' },
      { pattern: /足够好/i, belief: '我足够好' },
      { pattern: /有能力.*处理/i, belief: '我有能力处理关系挑战' }
    ];
    
    const negativeSelf = [
      { pattern: /不够好/i, belief: '我不够好' },
      { pattern: /不值得.*爱/i, belief: '我不值得被爱' },
      { pattern: /会.*抛弃/i, belief: '我会被抛弃' },
      { pattern: /需要.*完美/i, belief: '我需要完美才能被爱' }
    ];
    
    [...positiveSelf, ...negativeSelf].forEach(({ pattern, belief }) => {
      if (pattern.test(input)) beliefs.push(belief);
    });
    
    return beliefs.length > 0 ? beliefs : ['未检测到明确的自我信念'];
  },

  _extractOtherBeliefs(input) {
    const beliefs = [];
    
    const positiveOther = [
      { pattern: /可以.*信任/i, belief: '别人是可以信任的' },
      { pattern: /可靠/i, belief: '别人通常是可靠的' },
      { pattern: /支持/i, belief: '别人会支持我' }
    ];
    
    const negativeOther = [
      { pattern: /会.*伤害/i, belief: '别人会伤害我' },
      { pattern: /不能.*依赖/i, belief: '不能依赖任何人' },
      { pattern: /亲密.*危险/i, belief: '亲密意味着危险' },
      { pattern: /别人.*不可靠/i, belief: '别人是不可靠的' }
    ];
    
    [...positiveOther, ...negativeOther].forEach(({ pattern, belief }) => {
      if (pattern.test(input)) beliefs.push(belief);
    });
    
    return beliefs.length > 0 ? beliefs : ['未检测到明确的他人信念'];
  },

  _scoreBeliefs(beliefs) {
    let score = 0;
    const positiveKeywords = ['值得', '足够好', '有能力', '信任', '可靠', '支持'];
    const negativeKeywords = ['不够好', '不值得', '抛弃', '伤害', '不能依赖', '危险', '不可靠'];
    
    beliefs.forEach(belief => {
      positiveKeywords.forEach(kw => { if (belief.includes(kw)) score += 1; });
      negativeKeywords.forEach(kw => { if (belief.includes(kw)) score -= 1; });
    });
    
    return score;
  },

  _getAttachmentQuadrant(selfScore, otherScore) {
    const selfOrientation = selfScore >= 0 ? 'positive' : 'negative';
    const otherOrientation = otherScore >= 0 ? 'positive' : 'negative';
    
    if (selfOrientation === 'positive' && otherOrientation === 'positive') {
      return { type: 'secure', description: '安全型：积极自我 + 积极他人' };
    } else if (selfOrientation === 'negative' && otherOrientation === 'positive') {
      return { type: 'anxious-preoccupied', description: '焦虑 - 专注型：消极自我 + 积极他人' };
    } else if (selfOrientation === 'positive' && otherOrientation === 'negative') {
      return { type: 'dismissing-avoidant', description: '回避 - 轻视型：积极自我 + 消极他人' };
    } else {
      return { type: 'fearful-avoidant', description: '恐惧 - 回避型：消极自我 + 消极他人' };
    }
  },

  _calculateConfidence(anxiety, avoidance) {
    const total = anxiety + avoidance;
    if (total >= 8) return 'high';
    if (total >= 4) return 'moderate';
    return 'low';
  },

  /**
   * 主交互方法
   */
  interact(userInput) {
    const fourType = this.assessFourTypes(userInput);
    const iwm = this.analyzeInternalWorkingModels(userInput);
    const patterns = this.detectRelationshipPatterns(userInput);
    const repairPlan = this.generateRepairPlan(fourType.primaryType);
    
    return {
      attachmentStyle: fourType,
      internalWorkingModels: iwm,
      relationshipPatterns: patterns,
      repairPlan,
      guidance: this._generateGuidance(fourType, iwm, patterns, repairPlan)
    };
  },

  _generateGuidance(fourType, iwm, patterns, repairPlan) {
    const styleGuidance = {
      'secure': '你的依恋风格是安全型，这是最健康的依恋模式。继续保持开放沟通和情感可得性。',
      'anxious-preoccupied': '你表现出焦虑型依恋特征。建议练习自我安抚、挑战灾难化思维、学习直接表达需求。',
      'dismissing-avoidant': '你表现出回避型依恋特征。建议觉察去激活策略、小步骤学习脆弱性表达、重新定义亲密。',
      'fearful-avoidant': '你表现出恐惧型依恋特征。建议从建立安全感开始、培养自我同情、渐进式信任建立。'
    };
    
    return {
      primaryInsight: styleGuidance[fourType.primaryType],
      workingModelsInsight: `你的内部工作模式：${iwm.selfModel.orientation === 'positive' ? '积极自我' : '消极自我'} + ${iwm.otherModel.orientation === 'positive' ? '积极他人' : '消极他人'}`,
      patternsInsight: patterns.patterns.length > 0 
        ? `检测到的关系模式：${patterns.patterns.map(p => p.name).join('、')}`
        : '未检测到明显的关系模式',
      nextSteps: repairPlan.techniques.slice(0, 3).map(t => this._techniqueToAction(t))
    };
  },

  _techniqueToAction(technique) {
    const actions = {
      'self_soothing': '练习自我安抚技巧（深呼吸、正念冥想）',
      'cognitive_restructuring': '识别并挑战灾难化思维',
      'direct_communication': '学习直接表达需求而非抗议行为',
      'deactivation_awareness': '觉察自己的去激活策略（情感压抑、理性化）',
      'vulnerability_exposure': '小步骤学习表达脆弱和需求',
      'reframe_intimacy': '重新定义亲密（不是束缚，而是支持）',
      'safety_building': '从安全的关系开始建立信任',
      'self_compassion': '培养自我同情，修复消极自我模型',
      'trust_gradual': '渐进式信任建立，不急于承诺',
      'pattern_interruption': '识别并中断推 - 拉模式',
      'maintain_secure_base': '继续保持作为伴侣的安全基地功能',
      'deepen_intimacy': '探索更深层的情感亲密',
      'support_partner': '学习成为伴侣的安全基地',
      'gratitude_practice': '感恩练习，强化安全依恋',
      'attunement_exercise': '情感协调练习',
      'mindful_breathing': '正念呼吸练习',
      'thought_record': '思维记录，识别自动化思维',
      'needs_expression': '需求表达练习',
      'emotion_identification': '情绪识别练习',
      'small_sharing_steps': '小步骤自我暴露',
      'interdependence_reflection': '反思相互依赖的价值',
      'grounding_practice': '接地练习，增强当下感',
      'self_kindness': '自我善意练习',
      'push_pull_awareness': '觉察推 - 拉模式'
    };
    return actions[technique] || technique;
  }
};
