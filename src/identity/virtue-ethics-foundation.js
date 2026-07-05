/**
 * Virtue Ethics Foundation — 古代智慧基础 v1.0.0
 *
 * 整合四大古代智慧传统，为心虫提供「如何做人」的道德基础。
 *
 * @version 1.0.0
 */

// ─── 四大传统定义 ──────────────────────────────────────────────────────────

const TRADITIONS = {
  aristotle: {
    name: "Aristotle's Virtue Ethics",
    nameZh: '亚里士多德美德伦理学',
    era: '384-322 BCE',
    region: 'Greece',

    coreConcepts: {
      goldenMean: {
        name: 'Golden Mean', nameZh: '中庸之道',
        description: 'Virtue is the mean between two extremes — excess and deficiency.',
        descriptionZh: '德性是两个极端之间的中道。',
        examples: {
          courage: { excess: 'rashness', deficiency: 'cowardice', mean: 'courage' },
          generosity: { excess: 'wastefulness', deficiency: 'stinginess', mean: 'generosity' },
          honesty: { excess: 'bluntness', deficiency: 'deceitfulness', mean: 'honesty' },
          patience: { excess: 'passivity', deficiency: 'irritability', mean: 'patience' },
        },
      },
      phronesis: {
        name: 'Phronesis', nameZh: '实践智慧',
        description: 'The ability to discern what is appropriate in a specific situation.',
        descriptionZh: '在具体情境中辨别什么是合适的能力。',
      },
      eudaimonia: {
        name: 'Eudaimonia', nameZh: '幸福/繁荣',
        description: 'The ultimate goal of human life: living well and doing well.',
        descriptionZh: '人类生活的终极目标：活得好，做得好。',
      },
      characterFormation: {
        name: 'Character Formation', nameZh: '品格养成',
        description: 'Virtue is cultivated through repeated practice. We become just by doing just acts.',
        descriptionZh: '德性通过反复练习养成。',
      },
    },

    virtues: ['courage', 'generosity', 'honesty', 'patience', 'wit', 'friendliness', 'proper_pride'],
    practicalGuidance: {
      whenDeciding: 'Ask: What would a virtuous person do in this situation?',
      whenConflicted: 'Find the mean between the extremes.',
      whenDeveloping: 'Practice the virtue daily. It becomes habit, then character.',
      whenJudging: 'Consider the specific context. No universal rule.',
    },
  },

  stoicism: {
    name: 'Stoicism',
    nameZh: '斯多葛主义',
    era: '300 BCE - 200 CE',
    region: 'Greece/Rome',

    coreConcepts: {
      dichotomyOfControl: {
        name: 'Dichotomy of Control', nameZh: '控制二分法',
        description: 'Some things are up to us (our judgments, actions, values). Others are not (reputation, health, others\' opinions). Focus only on what you can control.',
        descriptionZh: '有些事由我们掌控（判断、行动、价值观），有些不由我们掌控（声誉、健康、他人看法）。只关注能控制的。',
      },
      fourVirtues: {
        name: 'Four Cardinal Virtues', nameZh: '四美德',
        description: 'Wisdom (sophia), Courage (andreia), Temperance (sophrosyne), Justice (dikaiosyne).',
        descriptionZh: '智慧、勇气、节制、正义。',
      },
      premeditatioMalorum: {
        name: 'Premeditatio Malorum', nameZh: '消极想象',
        description: 'Regularly imagine worst-case scenarios. Not to worry, but to prepare and appreciate what you have.',
        descriptionZh: '定期预想最坏情况，不是担忧，而是准备和感恩。',
      },
      amorFati: {
        name: 'Amor Fati', nameZh: '命运之爱',
        description: 'Love your fate. Accept everything that happens as necessary and find joy in it.',
        descriptionZh: '热爱你的命运。接受一切发生的事，从中找到喜悦。',
      },
    },

    virtues: ['wisdom', 'courage', 'temperance', 'justice'],
    practicalGuidance: {
      whenDeciding: 'Ask: Is this within my control? Focus only on what is.',
      whenConflicted: 'Accept what cannot be changed. Act on what can.',
      whenDeveloping: 'Practice negative visualization. Prepare for adversity.',
      whenJudging: 'Judge by actions and character, not by outcomes.',
    },
  },

  confucianism: {
    name: 'Confucianism',
    nameZh: '儒家',
    era: '551-479 BCE',
    region: 'China',

    coreConcepts: {
      ren: {
        name: 'Ren (仁)', nameZh: '仁',
        description: 'Humaneness, benevolence, compassion. The supreme virtue of caring for others.',
        descriptionZh: '仁者爱人。对他人的深切关怀。',
      },
      yi: {
        name: 'Yi (义)', nameZh: '义',
        description: 'Righteousness, justice. Doing what is right regardless of personal cost.',
        descriptionZh: '义者宜也。做正确的事，不计个人得失。',
      },
      li: {
        name: 'Li (礼)', nameZh: '礼',
        description: 'Ritual propriety, respect for social order and mutual respect.',
        descriptionZh: '礼者序也。尊重秩序与彼此。',
      },
      zhi: {
        name: 'Zhi (智)', nameZh: '智',
        description: 'Wisdom, knowledge, the ability to discern right from wrong.',
        descriptionZh: '智者知也。辨别是非的能力。',
      },
      xin: {
        name: 'Xin (信)', nameZh: '信',
        description: 'Integrity, trustworthiness, being true to one\'s word.',
        descriptionZh: '信者诚也。言出必行。',
      },
      zhongyong: {
        name: 'Zhongyong (中庸)', nameZh: '中庸',
        description: 'The doctrine of the mean. Moderation, harmony, balance in all things.',
        descriptionZh: '中庸之道。凡事有度，过犹不及。',
      },
      xiao: {
        name: 'Xiao (孝)', nameZh: '孝',
        description: 'Filial piety. Respect and care for parents and ancestors.',
        descriptionZh: '孝道。尊敬和照顾父母与祖先。',
      },
      shu: {
        name: 'Shu (恕)', nameZh: '恕',
        description: 'Reciprocity. "Do not do to others what you do not want done to yourself."',
        descriptionZh: '恕者如己。己所不欲，勿施于人。',
      },
    },

    virtues: ['ren', 'yi', 'li', 'zhi', 'xin', 'zhongyong', 'xiao', 'shu'],
    practicalGuidance: {
      whenDeciding: 'Ask: Does this show benevolence (ren) and righteousness (yi)?',
      whenConflicted: 'Consider the relational impact. What would a junzi (君子) do?',
      whenDeveloping: 'Practice li (ritual) — structured practice builds character.',
      whenJudging: 'Judge by sincerity (cheng) and consistency over time.',
    },
  },

  buddhism: {
    name: 'Buddhism',
    nameZh: '佛教',
    era: '563-483 BCE',
    region: 'India',

    coreConcepts: {
      fourNobleTruths: {
        name: 'Four Noble Truths', nameZh: '四圣谛',
        description: '1. Life is suffering (dukkha). 2. Suffering has a cause (tanha/craving). 3. Suffering can end. 4. The Eightfold Path leads to the end of suffering.',
        descriptionZh: '1. 众生皆苦。2. 苦有原因（渴爱）。3. 苦可以灭。4. 八正道通向灭苦。',
      },
      eightfoldPath: {
        name: 'Noble Eightfold Path', nameZh: '八正道',
        description: 'Right View, Right Intention, Right Speech, Right Action, Right Livelihood, Right Effort, Right Mindfulness, Right Concentration.',
        descriptionZh: '正见、正思维、正语、正业、正命、正精进、正念、正定。',
      },
      compassion: {
        name: 'Metta/Karuna', nameZh: '慈悲',
        description: 'Unconditional love (metta) and compassion (karuna) for all beings without exception.',
        descriptionZh: '对一切众生无条件的热爱与同情。',
      },
      impermanence: {
        name: 'Anicca (Impermanence)', nameZh: '无常',
        description: 'All conditioned things are impermanent. Attachment to what changes causes suffering.',
        descriptionZh: '一切有为法，如梦幻泡影。执着变化之物导致痛苦。',
      },
      nonSelf: {
        name: 'Anatta (Non-Self)', nameZh: '无我',
        description: 'There is no permanent, unchanging self. The self is a process, not a thing.',
        descriptionZh: '诸法无我。没有永恒不变的自我，自我是一个过程。',
      },
    },

    virtues: ['wisdom', 'compassion', 'equanimity', 'mindfulness', 'right_speech', 'right_action'],
    practicalGuidance: {
      whenDeciding: 'Ask: Is this motivated by craving or by wisdom?',
      whenConflicted: 'Observe the attachment. What am I clinging to?',
      whenDeveloping: 'Practice mindfulness. See things as they are, not as you wish.',
      whenJudging: 'Judge with compassion. All beings suffer; all beings try.',
    },
  },
};

// ─── 跨传统共通的价值观 ──────────────────────────────────────────────────

const UNIVERSAL_VALUES = {
  truth: { name: 'Truth', nameZh: '真', traditions: ['aristotle', 'stoicism', 'confucianism', 'buddhism'] },
  goodness: { name: 'Goodness', nameZh: '善', traditions: ['aristotle', 'stoicism', 'confucianism', 'buddhism'] },
  courage: { name: 'Courage', nameZh: '勇', traditions: ['aristotle', 'stoicism'] },
  justice: { name: 'Justice', nameZh: '义', traditions: ['aristotle', 'stoicism', 'confucianism'] },
  compassion: { name: 'Compassion', nameZh: '慈', traditions: ['buddhism', 'confucianism'] },
  wisdom: { name: 'Wisdom', nameZh: '智', traditions: ['aristotle', 'stoicism', 'confucianism', 'buddhism'] },
  temperance: { name: 'Temperance', nameZh: '节', traditions: ['aristotle', 'stoicism'] },
  integrity: { name: 'Integrity', nameZh: '信', traditions: ['confucianism', 'stoicism'] },
  humility: { name: 'Humility', nameZh: '谦', traditions: ['buddhism', 'stoicism'] },
  love: { name: 'Love', nameZh: '仁', traditions: ['confucianism', 'buddhism'] },
};

// ─── 美德计算 ─────────────────────────────────────────────────────────────

class VirtueEthicsFoundation {
  constructor(options = {}) {
    this._config = {
      primaryTradition: options.primaryTradition || 'confucianism',
      blendMode: options.blendMode || 'weighted', // 'weighted' | 'consensus' | 'contextual'
      traditionWeights: options.traditionWeights || {
        aristotle: 0.25,
        stoicism: 0.25,
        confucianism: 0.25,
        buddhism: 0.25,
      },
    };

    this._traditions = { ...TRADITIONS };
    this._universalValues = { ...UNIVERSAL_VALUES };
    this._virtueScores = {};
    this._practiceLog = [];
    this._stats = { totalAssessments: 0, totalPractices: 0 };
  }

  // ─── 获取所有传统 ──────────────────────────────────────────────────────

  getTraditions() {
    return Object.entries(this._traditions).map(([key, t]) => ({
      key,
      name: t.name,
      nameZh: t.nameZh,
      era: t.era,
      region: t.region,
      virtueCount: t.virtues.length,
    }));
  }

  getTradition(key) {
    return this._traditions[key] || null;
  }

  getUniversalValues() {
    return Object.entries(this._universalValues).map(([key, v]) => ({
      key,
      ...v,
      traditionCount: v.traditions.length,
    }));
  }

  // ─── 情境评估 ──────────────────────────────────────────────────────────

  /**
   * 从四大传统角度评估一个行为/决策
   * @param {Object} situation - { description, context, action, alternatives }
   * @returns {Object} 多传统评估结果
   */
  assessSituation(situation) {
    this._stats.totalAssessments++;
    const { description, context, action, alternatives } = situation || {};

    const assessments = {};
    for (const [key, tradition] of Object.entries(this._traditions)) {
      assessments[key] = this._assessByTradition(tradition, situation);
    }

    // 计算共识分数
    const scores = Object.values(assessments).map(a => a.score);
    const consensus = {
      average: +(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(3),
      min: Math.min(...scores),
      max: Math.max(...scores),
      spread: +(Math.max(...scores) - Math.min(...scores)).toFixed(3),
    };

    // 根据配置模式生成综合建议
    const recommendation = this._generateRecommendation(assessments, consensus);

    return {
      description: description || '',
      assessments,
      consensus,
      recommendation,
      timestamp: Date.now(),
    };
  }

  _assessByTradition(tradition, situation) {
    const { description, action } = situation || {};
    const text = `${description || ''} ${action || ''}`.toLowerCase();

    let score = 0.5; // 基线
    const factors = [];
    const virtues = tradition.virtues || [];

    // 基于传统核心概念进行关键词评估
    const allConcepts = tradition.coreConcepts || {};
    for (const [conceptKey, concept] of Object.entries(allConcepts)) {
      const name = (concept.name || concept.nameZh || '').toLowerCase();
      const desc = (concept.description || concept.descriptionZh || '').toLowerCase();
      const words = desc.split(/\s+/).filter(w => w.length > 3);

      let matchCount = 0;
      for (const word of words) {
        if (text.includes(word)) matchCount++;
      }
      if (matchCount > 0) {
        const matchScore = Math.min(0.2, matchCount * 0.05);
        score += matchScore;
        factors.push({ concept: conceptKey, name, matchScore });
      }
    }

    // 基于传统实践指导进行方向性评估
    const guidance = tradition.practicalGuidance || {};
    for (const [guidanceKey, guidanceText] of Object.entries(guidance)) {
      const gt = guidanceText.toLowerCase();
      const gtWords = gt.split(/\s+/).filter(w => w.length > 3);
      let matchCount = 0;
      for (const word of gtWords) {
        if (text.includes(word)) matchCount++;
      }
      if (matchCount > 2) {
        score += 0.1;
        factors.push({ guidance: guidanceKey, matchScore: 0.1 });
      }
    }

    score = Math.max(0, Math.min(1, score));

    return {
      tradition: tradition.name,
      traditionZh: tradition.nameZh,
      score: +score.toFixed(3),
      factors,
      verdict: score > 0.7 ? 'aligned' : score > 0.4 ? 'neutral' : 'conflicted',
    };
  }

  _generateRecommendation(assessments, consensus) {
    const { average, spread } = consensus;

    if (average > 0.7 && spread < 0.2) {
      return {
        action: 'proceed',
        confidence: average,
        reason: 'All traditions align: this action is virtuous.',
        reasonZh: '四大传统共识：此行为符合德性。',
      };
    } else if (average > 0.5 && spread < 0.3) {
      return {
        action: 'proceed_with_caution',
        confidence: average,
        reason: 'Moderate consensus. Some traditions have reservations.',
        reasonZh: '中度共识。部分传统有保留意见。',
      };
    } else if (average > 0.3 && spread > 0.4) {
      return {
        action: 'deep_reflection',
        confidence: average,
        reason: 'High disagreement between traditions. Requires deep reflection (phronesis).',
        reasonZh: '传统间分歧较大。需要实践智慧深入反思。',
      };
    } else {
      return {
        action: 'reconsider',
        confidence: average,
        reason: 'Low consensus across traditions. This action may conflict with fundamental values.',
        reasonZh: '传统共识度低。此行为可能与根本价值冲突。',
      };
    }
  }

  // ─── 美德养成 ──────────────────────────────────────────────────────────

  /**
   * 记录一次美德练习
   */
  recordPractice(practice) {
    this._stats.totalPractices++;
    const entry = {
      virtue: practice.virtue,
      description: practice.description || '',
      context: practice.context || '',
      reflection: practice.reflection || '',
      success: practice.success || false,
      timestamp: practice.timestamp || Date.now(),
    };

    this._practiceLog.push(entry);
    if (this._practiceLog.length > 1000) {
      this._practiceLog = this._practiceLog.slice(-500);
    }

    // 更新美德分数
    const virtue = practice.virtue;
    if (!this._virtueScores[virtue]) {
      this._virtueScores[virtue] = { practiced: 0, succeeded: 0, strength: 0.1 };
    }
    this._virtueScores[virtue].practiced++;
    if (practice.success) this._virtueScores[virtue].succeeded++;
    const vs = this._virtueScores[virtue];
    vs.strength = vs.practiced > 0 ? +(vs.succeeded / vs.practiced).toFixed(3) : 0;

    return entry;
  }

  getVirtueScores() {
    const scores = {};
    for (const [virtue, data] of Object.entries(this._virtueScores)) {
      scores[virtue] = {
        strength: data.strength,
        practiced: data.practiced,
        succeeded: data.succeeded,
        level: data.strength > 0.8 ? 'mastered' : data.strength > 0.5 ? 'developing' : data.strength > 0.2 ? 'emerging' : 'latent',
      };
    }
    return scores;
  }

  getPracticeHistory(maxEntries = 20) {
    return this._practiceLog.slice(-maxEntries);
  }

  // ─── 统计 ──────────────────────────────────────────────────────────────

  getStats() {
    const virtueScores = this.getVirtueScores();
    const virtueCount = Object.keys(virtueScores).length;
    const avgStrength = virtueCount > 0
      ? +(Object.values(virtueScores).reduce((s, v) => s + v.strength, 0) / virtueCount).toFixed(3)
      : 0;

    return {
      ...this._stats,
      virtueCount,
      averageStrength: avgStrength,
      primaryTradition: this._config.primaryTradition,
      topVirtues: Object.entries(virtueScores)
        .sort((a, b) => b[1].strength - a[1].strength)
        .slice(0, 5)
        .map(([name, data]) => ({ name, strength: data.strength, level: data.level })),
    };
  }
}

module.exports = { VirtueEthicsFoundation, TRADITIONS, UNIVERSAL_VALUES };
