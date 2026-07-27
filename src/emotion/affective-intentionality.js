/**
 * Affective Intentionality — 情感意向性计算 (v9.2.0 恢复)
 *
 * 情感总是"关于"某物的——Brentano, Husserl, Solomon
 * 核心公式: I_A = W_i × I_o × E_v × (1 - D_d)
 *
 * 5维情感画像: 意向性/评价性/效价/施事性/动力性
 * 8类情感参数映射表
 */

class AffectiveIntentionality {
  constructor() {
    this.version = '1.0.0';
    this.dimensions = {
      intentionality: { name: '意向性', desc: '情感总是指向某物的特性', weight: 0.3 },
      evaluation:     { name: '评价性', desc: '情感包含对对象的价值判断', weight: 0.25 },
      valence:        { name: '效价',   desc: '正面/负面情感', weight: 0.2 },
      agency:         { name: '施事性', desc: '情感中的主体性程度', weight: 0.15 },
      dynamism:       { name: '动力性', desc: '情感的动机驱动能力', weight: 0.1 },
    };
    this.emotionTypes = {
      joy:      { intentionality: 0.7,  evaluation: 0.8,  valence: 0.9,  agency: 0.6,  dynamism: 0.7  },
      sadness:  { intentionality: 0.9,  evaluation: 0.7,  valence: -0.7, agency: 0.3,  dynamism: 0.4  },
      anger:    { intentionality: 0.8,  evaluation: 0.9,  valence: -0.8, agency: 0.8,  dynamism: 0.9  },
      fear:     { intentionality: 0.9,  evaluation: 0.6,  valence: -0.9, agency: 0.2,  dynamism: 0.8  },
      love:     { intentionality: 0.95, evaluation: 0.9,  valence: 0.95, agency: 0.5,  dynamism: 0.6  },
      gratitude:{ intentionality: 0.8,  evaluation: 0.9,  valence: 0.85, agency: 0.4,  dynamism: 0.5  },
      envy:     { intentionality: 0.7,  evaluation: 0.8,  valence: -0.6, agency: 0.5,  dynamism: 0.6  },
      shame:    { intentionality: 0.85, evaluation: 0.9,  valence: -0.75,agency: 0.3,  dynamism: 0.4  },
    };
  }

  compute(params = {}) {
    const { type = 'joy', intentionalityStrength = 0.7, objectClarity = 0.7,
            evaluationStrength = 0.7, disengagement = 0.1 } = params;
    const I_A = intentionalityStrength * objectClarity * evaluationStrength * (1 - disengagement);
    const profile = this.emotionTypes[type] || { intentionality: 0.5, evaluation: 0.5, valence: 0, agency: 0.5, dynamism: 0.5 };
    return {
      intentionalityIndex: I_A,
      emotionProfile: profile,
      interpretation: I_A > 0.5 ? '强意向性情感：明确指向对象'
        : I_A > 0.25 ? '中等意向性：有一定指向性' : '弱意向性：可能与对象脱节'
    };
  }
}

module.exports = { AffectiveIntentionality };
