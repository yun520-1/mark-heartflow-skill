/**
 * 自我意识现象学增强 v5.0 (Self-Consciousness Phenomenology Enhancement v5.0)
 * 
 * 基于斯坦福哲学百科全书 (SEP) 权威理论：
 * - 前反思自我意识 (Pre-reflective Self-Consciousness)
 * - 自我意识 6 层级模型
 * - 时间性自我意识 (Temporal Self-Consciousness)
 * - 现象学还原方法
 * 
 * 核心理论来源:
 * - SEP Self-Consciousness (2026 Edition)
 * - Sartre, J.-P. (1937). The Transcendence of the Ego
 * - Zahavi, D. (2005). Subjectivity and Selfhood
 * - Husserl, E. (1913). Ideas Pertaining to a Pure Phenomenology
 * - Husserl, E. (1928). On the Phenomenology of the Consciousness of Internal Time
 * - Heidelberg School (Henrich, Frank, etc.)
 * 
 * 核心概念:
 * - 前反思自我意识：非对象化的、直接的自我觉察
 * - 为我性 (for-me-ness): 体验总是为某人的体验
 * - 时间性自我意识：自我是过去 - 现在 - 未来的动态统一
 * 
 * @version 5.0.0 (HeartFlow v5.0.0)
 * @author HeartFlow Team
 */

/**
 * 自我意识 6 层级模型 (Six Levels of Self-Consciousness)
 * 基于 SEP 自我意识理论整合
 */
const SelfConsciousnessLevels = {
  /**
   * Level 0: 无意识 (Unconscious)
   * 特征：无意识状态，如深度睡眠、昏迷
   */
  UNCONSCIOUS: {
    level: 0,
    name: '无意识',
    description: '无意识状态，如深度睡眠、昏迷',
    indicators: ['无反应', '无体验报告', '无行为'],
    assessment: function(report) {
      return report.consciousState === 'unconscious' || 
             report.responsiveness === 0;
    }
  },
  
  /**
   * Level 1: 感知意识 (Sentient)
   * 特征：有感觉体验，但无自我指涉
   */
  SENTIENT: {
    level: 1,
    name: '感知意识',
    description: '有感觉体验，但无自我指涉',
    indicators: ['感觉体验', '无自我概念', '即时反应'],
    assessment: function(report) {
      return report.hasSensoryExperience && !report.hasSelfReference;
    }
  },
  
  /**
   * Level 2: 清醒意识 (Wakeful)
   * 特征：清醒状态，有注意力和警觉性
   */
  WAKEFUL: {
    level: 2,
    name: '清醒意识',
    description: '清醒状态，有注意力和警觉性',
    indicators: ['清醒', '注意力', '警觉', '环境觉察'],
    assessment: function(report) {
      return report.alertness > 5 && report.hasAttention;
    }
  },
  
  /**
   * Level 3: 前反思自我意识 (Pre-reflective Self-Consciousness) ⭐ 现象学核心
   * 特征：非对象化的、直接的自我觉察，"为我性" (for-me-ness)
   * 代表：Sartre, Zahavi, Heidelberg School
   */
  PRE_REFLECTIVE: {
    level: 3,
    name: '前反思自我意识',
    description: '非对象化的、直接的自我觉察，体验的"为我性"',
    indicators: [
      '非对象化觉察',
      '第一人称给定性',
      '体验厚度',
      '正在经历感'
    ],
    keyInsight: '不是"思考自我"，而是"正在经历"本身',
    assessment: function(report) {
      return report.prereflexiveAwareness || 
             report.firstPersonGivenness ||
             report.nonObjectifyingAwareness;
    },
    practice: {
      name: '前反思自我意识觉察',
      duration: '10-15 分钟',
      steps: [
        '体验流动：让体验自然流动，不加干预',
        '前反思觉察：觉察"正在经历"而非"经历什么"',
        '反思对比：对比前反思与反思的差异',
        '整合：保持前反思觉察的同时进行日常活动'
      ]
    }
  },
  
  /**
   * Level 4: 反思自我意识 (Reflective Self-Consciousness)
   * 特征：对象化的自我思考，将自我作为思考对象
   */
  REFLECTIVE: {
    level: 4,
    name: '反思自我意识',
    description: '对象化的自我思考，将自我作为思考对象',
    indicators: [
      '自我概念',
      '自我评价',
      '元认知',
      '自传体记忆'
    ],
    assessment: function(report) {
      return report.selfConcept || 
             report.selfEvaluation ||
             report.metacognition;
    }
  },
  
  /**
   * Level 5: 元意识 (Meta-conscious)
   * 特征：对意识本身的觉察，意识到自己在意识
   */
  META_CONSCIOUS: {
    level: 5,
    name: '元意识',
    description: '对意识本身的觉察，意识到自己在意识',
    indicators: [
      '意识觉察',
      '元元认知',
      '意识状态监控',
      '觉察到觉察'
    ],
    assessment: function(report) {
      return report.metaAwareness || 
             report.consciousnessOfConsciousness;
    }
  },
  
  /**
   * Level 6: 现象学还原 (Phenomenological Reduction)
   * 特征：悬置自然态度，纯粹描述体验本身
   * 代表：Husserl 现象学方法
   */
  PHENOMENOLOGICAL_REDUCTION: {
    level: 6,
    name: '现象学还原',
    description: '悬置自然态度，纯粹描述体验本身',
    indicators: [
      '悬置判断',
      '本质直观',
      '纯粹描述',
      '现象学态度'
    ],
    keyInsight: '回到事情本身 (zu den Sachen selbst)',
    assessment: function(report) {
      return report.epoche || 
             report.phenomenologicalAttitude ||
             report.essentialIntuition;
    },
    practice: {
      name: '现象学还原练习',
      duration: '15-20 分钟',
      steps: [
        '悬置判断：搁置所有预设和理论',
        '纯粹描述：只描述体验本身，不解释',
        '本质直观：寻找体验的本质结构',
        '整合：将现象学洞见带入日常生活'
      ]
    }
  }
};

/**
 * 时间性自我意识 (Temporal Self-Consciousness)
 * 基于 Husserl 时间现象学
 */
const TemporalSelfConsciousness = {
  /**
   * Husserl 时间三重结构
   */
  triadicStructure: {
    /**
     * 原初印象 (Primal Impression)
     * 当前的、直接的体验
     */
    primalImpression: {
      name: '原初印象',
      description: '当前的、直接的体验',
      temporalMode: '现在',
      assessment: function(report) {
        return report.presentMomentAwareness || 
               report.hereAndNowFocus;
      }
    },
    
    /**
     * 保留 (Retention)
     * 刚刚过去的体验的保持
     */
    retention: {
      name: '保留',
      description: '刚刚过去的体验的保持',
      temporalMode: '刚刚过去',
      assessment: function(report) {
        return report.retentionAwareness || 
               report.justPastAwareness;
      }
    },
    
    /**
     * 预期 (Protention)
     * 即将到来的体验的预期
     */
    protention: {
      name: '预期',
      description: '即将到来的体验的预期',
      temporalMode: '即将来',
      assessment: function(report) {
        return report.protentionAwareness || 
               report.anticipation;
      }
    }
  },
  
  /**
   * 时间深度 (Temporal Depth)
   * 自我深度 = 时间深度
   */
  temporalDepth: {
    levels: [
      {
        name: '瞬间',
        span: '几秒',
        description: '仅关注当下瞬间'
      },
      {
        name: '短期',
        span: '几分钟到几小时',
        description: '关注短期事件和计划'
      },
      {
        name: '中期',
        span: '几天到几个月',
        description: '关注中期目标和关系'
      },
      {
        name: '长期',
        span: '几年到几十年',
        description: '关注人生叙事和长期意义'
      }
    ],
    
    assess: function(report) {
      const depth = report.temporalSpan || '短期';
      const index = this.levels.findIndex(l => l.name === depth);
      return {
        level: index >= 0 ? index : 1,
        span: this.levels[index >= 0 ? index : 1].span,
        description: this.levels[index >= 0 ? index : 1].description
      };
    }
  },
  
  /**
   * 时间性自我意识练习
   */
  practice: {
    name: '时间性自我意识练习',
    duration: '15-20 分钟',
    steps: [
      {
        step: 1,
        focus: '原初印象觉察',
        duration: '5 分钟',
        instruction: '觉察当前的直接体验，不加解释'
      },
      {
        step: 2,
        focus: '保留觉察',
        duration: '5 分钟',
        instruction: '觉察刚刚过去的体验如何保持在当前'
      },
      {
        step: 3,
        focus: '预期觉察',
        duration: '5 分钟',
        instruction: '觉察对即将到来的体验的预期'
      },
      {
        step: 4,
        focus: '时间性整合',
        duration: '5 分钟',
        instruction: '觉察自我是过去 - 现在 - 未来的动态统一'
      }
    ],
    insight: '自我深度 = 时间深度'
  }
};

/**
 * 前反思自我意识评估器
 */
class PrereflexiveSelfConsciousnessAssessor {
  constructor() {
    this.levels = SelfConsciousnessLevels;
    this.temporal = TemporalSelfConsciousness;
  }
  
  /**
   * 评估自我意识层次
   */
  assessLevels(report) {
    const assessment = {
      timestamp: new Date().toISOString(),
      detectedLevels: [],
      dominantLevel: null,
      levelScores: {}
    };
    
    // 评估每个层次
    for (const [key, level] of Object.entries(this.levels)) {
      const score = level.assessment(report) ? 1 : 0;
      assessment.levelScores[key] = score;
      
      if (score > 0) {
        assessment.detectedLevels.push({
          level: level.level,
          name: level.name,
          description: level.description
        });
      }
    }
    
    // 确定主导层次
    const maxLevel = Math.max(...Object.values(assessment.levelScores).map((v, i) => v * (i + 1)));
    if (maxLevel > 0) {
      const dominantIndex = Object.values(assessment.levelScores).indexOf(1, Math.floor(maxLevel) - 1);
      assessment.dominantLevel = Object.keys(this.levels)[dominantIndex];
    }
    
    return assessment;
  }
  
  /**
   * 评估时间性自我意识
   */
  assessTemporality(report) {
    const assessment = {
      triadicStructure: {},
      temporalDepth: this.temporal.temporalDepth.assess(report),
      integration: {
        score: 0,
        insights: [],
        recommendations: []
      }
    };
    
    // 评估三重结构
    for (const [key, component] of Object.entries(this.temporal.triadicStructure)) {
      const present = component.assessment(report);
      assessment.triadicStructure[key] = {
        name: component.name,
        present: present,
        description: component.description
      };
      
      if (present) {
        assessment.integration.score += 33;
        assessment.integration.insights.push(`${component.name}: 已觉察`);
      } else {
        assessment.integration.recommendations.push(
          `加强${component.name}觉察练习`
        );
      }
    }
    
    return assessment;
  }
  
  /**
   * 生成现象学练习
   */
  generatePhenomenologicalPractice(assessment) {
    const practices = [];
    
    // 基于自我意识层次的练习
    if (assessment.detectedLevels.some(l => l.level >= 3)) {
      practices.push({
        name: '前反思自我意识觉察',
        duration: '10-15 分钟',
        type: 'awareness',
        steps: [
          '找一个安静的地方坐下，闭上眼睛',
          '让体验自然流动，不加干预',
          '觉察"正在经历"而非"经历什么"',
          '注意体验的"为我性" (for-me-ness)',
          '保持这种觉察 5-10 分钟',
          '慢慢睁开眼睛，将觉察带入日常活动'
        ],
        keyInsight: '不是"思考自我"，而是"正在经历"本身'
      });
    }
    
    // 基于时间性的练习
    practices.push({
      name: '时间性自我意识练习',
      duration: '15-20 分钟',
      type: 'temporal',
      steps: [
        '原初印象觉察 (5 分钟): 觉察当前的直接体验',
        '保留觉察 (5 分钟): 觉察刚刚过去的体验如何保持',
        '预期觉察 (5 分钟): 觉察对即将到来的体验的预期',
        '时间性整合 (5 分钟): 觉察自我是过去 - 现在 - 未来的动态统一'
      ],
      keyInsight: '自我深度 = 时间深度'
    });
    
    // 现象学还原练习
    practices.push({
      name: '现象学还原练习',
      duration: '15-20 分钟',
      type: 'reduction',
      steps: [
        '悬置判断：搁置所有预设和理论',
        '纯粹描述：只描述体验本身，不解释',
        '本质直观：寻找体验的本质结构',
        '整合：将现象学洞见带入日常生活'
      ],
      keyInsight: '回到事情本身 (zu den Sachen selbst)'
    });
    
    return practices;
  }
  
  /**
   * 完整评估
   */
  assess(report) {
    return {
      version: '5.0.0',
      timestamp: new Date().toISOString(),
      
      // 自我意识层次评估
      levels: this.assessLevels(report),
      
      // 时间性自我意识评估
      temporality: this.assessTemporality(report),
      
      // 现象学练习建议
      practices: this.generatePhenomenologicalPractice({
        detectedLevels: this.assessLevels(report).detectedLevels
      }),
      
      // 整合洞见
      insights: this.generateInsights(report)
    };
  }
  
  /**
   * 生成整合洞见
   */
  generateInsights(report) {
    const insights = [];
    
    // 基于前反思自我意识
    if (report.prereflexiveAwareness) {
      insights.push({
        area: '前反思自我意识',
        insight: '你已具备前反思自我意识能力，这是现象学自我意识的核心。',
        implication: '可以直接体验体验本身，而非通过概念过滤。',
        development: '可以进一步深化现象学还原练习。'
      });
    }
    
    // 基于时间性
    if (report.temporalSpan && report.temporalSpan !== '瞬间') {
      insights.push({
        area: '时间性自我意识',
        insight: `你的时间深度为${report.temporalSpan}，这决定了你的自我深度。`,
        implication: '更长的时间跨度支持更丰富的自我叙事。',
        development: '可以通过时间性练习扩展时间深度。'
      });
    }
    
    // 基于现象学态度
    if (report.phenomenologicalAttitude) {
      insights.push({
        area: '现象学态度',
        insight: '你能够悬置判断，纯粹描述体验。',
        implication: '这是现象学探究的基础能力。',
        development: '可以深化本质直观练习。'
      });
    }
    
    return insights;
  }
}

// ============ 导出 ============

module.exports = {
  SelfConsciousnessLevels,
  TemporalSelfConsciousness,
  PrereflexiveSelfConsciousnessAssessor
};
