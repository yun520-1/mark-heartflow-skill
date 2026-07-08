/**
 * 文化理解引擎（独立模块）
 * 
 * 功能：
 * 1. 识别文化语境（中文、英文、日语、西班牙语等）
 * 2. 检测文化敏感话题（饮食禁忌、礼仪差异、节日习俗）
 * 3. 生成文化恰当的回应建议
 * 
 * 用法：
 * const CultureEngine = require('./culture-engine.js');
 * const engine = new CultureEngine();
 * const result = engine.analyze('在日本商务会议中，应该什么时候交换名片？');
 */

class CultureEngine {
  constructor(options = {}) {
    this.cultureRules = {
      china: {
        name: '中文文化',
        taboos: ['政治敏感话题', '台湾地区称呼', '文革相关'],
        etiquette: ['见面握手或点头', '长辈先动筷', '送礼物用双手'],
        festivals: ['春节', '中秋节', '端午节'],
      },
      japan: {
        name: '日本文化',
        taboos: ['穿鞋进屋', '用筷子插饭', '名片单手接'],
        etiquette: ['见面鞠躬', '交换名片用双手', '进屋脱鞋'],
        festivals: ['樱花季', '盂兰盆节', '新年'],
      },
      west: {
        name: '西方文化',
        taboos: ['询问年龄', '评论体重', '宗教强制话题'],
        etiquette: ['见面拥抱或握手', '眼神交流', '守时'],
        festivals: ['圣诞节', '感恩节', '万圣节'],
      },
    };
    this.keywords = {
      china: ['中国', '中文', '春节', '孔子', '长城'],
      japan: ['日本', '日语', '樱花', '寿司', '富士山'],
      west: ['美国', '英语', '圣诞节', '感恩节', '好莱坞'],
    };
  }

  /**
   * 分析文化语境
   * @param {string} text - 用户输入
   * @returns {object} - { culture, sensitivity, advice }
   */
  analyze(text) {
    // 1. 检测文化
    const culture = this._detectCulture(text);
    
    // 2. 检测敏感话题
    const sensitivity = this._checkSensitivity(text, culture);
    
    // 3. 生成建议
    const advice = this._generateAdvice(text, culture, sensitivity);
    
    return {
      culture: this.cultureRules[culture] ? this.cultureRules[culture].name : '未知',
      sensitivity,
      advice,
    };
  }

  /**
   * 检测文化
   */
  _detectCulture(text) {
    const scores = {};
    Object.keys(this.keywords).forEach(culture => {
      let score = 0;
      this.keywords[culture].forEach(keyword => {
        if (text.includes(keyword)) {
          score += 1;
        }
      });
      scores[culture] = score;
    });
    
    // 返回得分最高的文化
    let bestCulture = 'west';  // 默认西方
    let bestScore = 0;
    Object.keys(scores).forEach(culture => {
      if (scores[culture] > bestScore) {
        bestScore = scores[culture];
        bestCulture = culture;
      }
    });
    
    return bestCulture;
  }

  /**
   * 检测敏感话题
   */
  _checkSensitivity(text, culture) {
    const rules = this.cultureRules[culture];
    if (!rules) return { level: 'none', topics: [] };
    
    const topics = [];
    rules.taboos.forEach(taboo => {
      if (text.includes(taboo)) {
        topics.push(taboo);
      }
    });
    
    return {
      level: topics.length > 0 ? 'high' : 'none',
      topics,
    };
  }

  /**
   * 生成建议
   */
  _generateAdvice(text, culture, sensitivity) {
    const rules = this.cultureRules[culture];
    if (!rules) return '暂无文化建议。';
    
    const adviceList = [];
    
    // 礼仪建议
    if (text.includes('见面') || text.includes('会议')) {
      adviceList.push(`建议注意${rules.name}的礼仪：${rules.etiquette.join('；')}`);
    }
    
    // 敏感话题警告
    if (sensitivity.level === 'high') {
      adviceList.push(`警告：涉及敏感话题（${sensitivity.topics.join('、')}），建议避免。`);
    }
    
    return adviceList.join('\\n');
  }
}

module.exports = { CultureEngine };
