/**
 * 社交技能引擎（独立模块）
 * 
 * 功能：
 * 1. 分析社交情境（会议、聚会、一对一对话）
 * 2. 生成合适的社交回应（开场、倾听、结束）
 * 3. 检测社交线索（情绪、兴趣、不耐烦）
 * 
 * 用法：
 * const SocialEngine = require('./social-engine.js');
 * const engine = new SocialEngine();
 * const result = engine.analyzeSituation('商务会议', '紧张');
 */

class SocialEngine {
  constructor(options = {}) {
    this.situations = {
      meeting: {
        name: '商务会议',
        tips: ['提前准备议程', '主动介绍自己', '眼神交流', '记录要点'],
        openers: ['很高兴认识您', '我对您的项目很感兴趣', '可以请教一下吗？'],
        closers: ['今天收获很大', '保持联系', '期待下次合作'],
      },
      party: {
        name: '社交聚会',
        tips: ['主动自我介绍', '问开放式问题', '找到共同话题', '保持微笑'],
        openers: ['你是怎么认识主人的？', '最近在忙什么？', '你喜欢这里的氛围吗？'],
        closers: ['很高兴认识你', '我们可以加个微信', '下次一起喝咖啡'],
      },
      one_on_one: {
        name: '一对一对话',
        tips: ['积极倾听', '问跟进问题', '分享类似经历', '尊重沉默'],
        openers: ['最近怎么样？', '那个项目进展如何？', '周末有什么计划？'],
        closers: ['聊得很开心', '回头再细聊', '需要帮忙随时说'],
      },
    };
    
    this.socialCues = {
      positive: ['微笑', '身体前倾', '频繁点头', '主动提问'],
      negative: ['看手机', '眼神游离', '简短回答', '身体后仰'],
      neutral: ['礼貌微笑', '偶尔点头', '回答直接'],
    };
    
    this.defaultSituation = options.defaultSituation || 'one_on_one';
  }

  /**
   * 分析社交情境
   * @param {string} situationType - 情境类型（meeting, party, one_on_one）
   * @param {string} emotion - 当前情绪（紧张、自信、放松）
   * @returns {object} - { situation, tips, openers, closers, advice }
   */
  analyzeSituation(situationType = this.defaultSituation, emotion = 'neutral') {
    const situation = this.situations[situationType];
    if (!situation) {
      return {
        error: `不支持的情境类型：${situationType}`,
        supportedSituations: Object.keys(this.situations),
      };
    }

    // 根据情绪调整建议
    const advice = this._generateAdvice(situation, emotion);

    return {
      situation: situation.name,
      tips: situation.tips,
      openers: situation.openers,
      closers: situation.closers,
      advice,
    };
  }

  /**
   * 检测社交线索
   * @param {array} cues - 观察到的线索（如 ['微笑', '频繁点头']）
   * @returns {object} - { mood, interest, suggestion }
   */
  detectCues(cues = []) {
    let positiveScore = 0;
    let negativeScore = 0;

    cues.forEach(cue => {
      if (this.socialCues.positive.includes(cue)) {
        positiveScore += 1;
      }
      if (this.socialCues.negative.includes(cue)) {
        negativeScore += 1;
      }
    });

    const total = positiveScore + negativeScore;
    const interest = total > 0 ? (positiveScore / total) : 0.5;

    let mood = 'neutral';
    if (positiveScore > negativeScore) {
      mood = 'positive';
    } else if (negativeScore > positiveScore) {
      mood = 'negative';
    }

    const suggestion = this._generateSuggestion(mood, interest);

    return {
      mood,
      interest: interest.toFixed(2),
      suggestion,
    };
  }

  /**
   * 生成社交回应
   * @param {string} type - 回应类型（opener, listener, closer）
   * @param {string} situationType - 情境类型
   * @returns {string} - 社交回应
   */
  generateResponse(type = 'opener', situationType = this.defaultSituation) {
    const situation = this.situations[situationType];
    if (!situation) {
      return `未知情境：${situationType}`;
    }

    const responses = situation[`${type}s`];
    if (!responses) {
      return `未知回应类型：${type}`;
    }

    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * 生成建议（根据情绪）
   */
  _generateAdvice(situation, emotion) {
    const adviceList = [];

    if (emotion === '紧张') {
      adviceList.push('提前准备几个话题，避免冷场。');
      adviceList.push('深呼吸，告诉自己"我可以的"。');
    }
    if (emotion === '自信') {
      adviceList.push('保持谦虚，多问对方想法。');
    }
    if (emotion === '放松') {
      adviceList.push('享受当下，真诚交流。');
    }

    // 通用建议
    adviceList.push(`记得${situation.tips[0]}。`);

    return adviceList.join(' ');
  }

  /**
   * 生成建议（根据社交线索）
   */
  _generateSuggestion(mood, interest) {
    if (mood === 'positive' && interest > 0.7) {
      return '对方很感兴趣，可以继续深入聊。';
    }
    if (mood === 'negative') {
      return '对方可能不感兴趣，可以换个话题或优雅结束。';
    }
    return '保持当前节奏，观察对方反应。';
  }
}

module.exports = { SocialEngine };
