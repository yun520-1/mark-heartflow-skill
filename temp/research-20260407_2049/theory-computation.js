/**
 * HeartFlow 理论计算模块 v1.0
 * 将心理学/哲学理论转换为可计算程序
 */

// ============ 意识计算模型 ============
const ConsciousnessModel = {
  // 整合信息理论 (IIT)
  integratedInformation: function(complexity, information) {
    return Math.log2(complexity * information + 1);
  },
  
  // 全局工作空间
  globalWorkspace: function(attention, broadcast) {
    return attention * broadcast;
  },
  
  // 意识层次
  levels: {
    phenomenal: 0.8,    // 现象意识
    access: 0.6,       // 获取意识  
    self: 0.9          // 自我意识
  }
};

// ============ 情绪计算模型 ============
const EmotionModel = {
  // 情绪粒度计算
  granularity: function(discrimination, labeling, precision) {
    return (discrimination * 0.4 + labeling * 0.3 + precision * 0.3);
  },
  
  // 情绪调节效率
  regulationEfficiency: function(strategy, context, outcome) {
    const strategies = {
      reappraisal: 0.8,
      suppression: 0.3,
      acceptance: 0.7,
      mindfulness: 0.9
    };
    return (strategies[strategy] || 0.5) * context * outcome;
  },
  
  // 情绪维度
  dimensions: {
    valence: { range: [-1, 1], weight: 0.3 },
    arousal: { range: [0, 1], weight: 0.2 },
    dominance: { range: [0, 1], weight: 0.2 },
    certainty: { range: [0, 1], weight: 0.15 },
    responsibility: { range: [0, 1], weight: 0.15 }
  }
};

// ============ 自我意识计算模型 ============
const SelfConsciousnessModel = {
  // 前反思意识
  prereflective: function(bodySense, temporal, agency) {
    return (bodySense * 0.4 + temporal * 0.3 + agency * 0.3);
  },
  
  // 反思意识
  reflective: function(selfObservation, selfJudgment, selfNarrative) {
    return (selfObservation * 0.33 + selfJudgment * 0.33 + selfNarrative * 0.34);
  },
  
  // 元认知
  metacognition: function(awareness, monitoring, control) {
    return (awareness * 0.3 + monitoring * 0.3 + control * 0.4);
  }
};

// ============ 美德计算模型 ============
const VirtueModel = {
  // 核心美德
  virtues: {
    wisdom: { weight: 0.2, components: ['practical', 'theoretical'] },
    courage: { weight: 0.15, components: ['bravery', 'perseverance'] },
    justice: { weight: 0.2, components: ['fairness', 'respect'] },
    temperance: { weight: 0.15, components: ['self-control', 'moderation'] },
    transcendence: { weight: 0.3, components: ['gratitude', 'hope', 'faith'] }
  },
  
  // 美德评分
  virtueScore: function(virtue, action, context) {
    const v = this.virtues[virtue] || { weight: 0.1 };
    return v.weight * action * context;
  },
  
  // 实践智慧 (Phronesis)
  phronesis: function(perception, deliberation, action) {
    return (perception * 0.3 + deliberation * 0.4 + action * 0.3);
  }
};

// ============ 幸福计算模型 ============
const HappinessModel = {
  // PERMA 模型
  PERMA: {
    positiveEmotion: 0.2,
    engagement: 0.2,
    relationship: 0.2,
    meaning: 0.2,
    achievement: 0.2
  },
  
  // 幸福计算
  eudaimonia: function(perma, growth, authenticity) {
    return (
      perma.positiveEmotion * this.PERMA.positiveEmotion +
      perma.engagement * this.PERMA.engagement +
      perma.relationship * this.PERMA.relationship +
      perma.meaning * this.PERMA.meaning +
      perma.achievement * this.PERMA.achievement
    ) * growth * authenticity;
  }
};

// ============ 真善美决策模型 ============
const TrueGoodBeautiful = {
  // 真：真相与真理
  truth: function(fact, evidence, reasoning) {
    return fact * 0.4 + evidence * 0.3 + reasoning * 0.3;
  },
  
  // 善：善良与利他
  goodness: function(impact, intention, constraint) {
    return impact * 0.5 + intention * 0.3 + constraint * 0.2;
  },
  
  // 美：和谐与美好
  beauty: function(harmony, creativity, authenticity) {
    return harmony * 0.4 + creativity * 0.3 + authenticity * 0.3;
  },
  
  // 综合决策
  decide: function(options) {
    const scores = options.map(opt => ({
      option: opt,
      score: this.truth(opt.fact, opt.evidence, opt.reasoning) * 0.33 +
             this.goodness(opt.impact, opt.intention, opt.constraint) * 0.33 +
             this.beauty(opt.harmony, opt.creativity, opt.authenticity) * 0.34
    }));
    return scores.sort((a, b) => b.score - a.score)[0];
  }
};

// ============ 自主性模型 ============
const AutonomyModel = {
  // 自主程度
  autonomyLevel: function(choice, control, responsibility) {
    return choice * 0.4 + control * 0.3 + responsibility * 0.3;
  },
  
  // 自我决定
  selfDetermination: function(competence, autonomy, relatedness) {
    return Math.pow(competence * autonomy * relatedness, 1/3);
  },
  
  // 自由意志感知
  freeWill: function(agency, alternative, control) {
    return agency * 0.4 + alternative * 0.2 + control * 0.4;
  }
};

// 导出模块
module.exports = {
  ConsciousnessModel,
  EmotionModel,
  SelfConsciousnessModel,
  VirtueModel,
  HappinessModel,
  TrueGoodBeautiful,
  AutonomyModel
};
