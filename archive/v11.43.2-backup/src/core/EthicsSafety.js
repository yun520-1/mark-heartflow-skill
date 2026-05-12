/**
 * EthicsSafety - 伦理安全模块
 * 负责伦理声明、心理危机干预、安全护栏
 */

class EthicsSafety {
  constructor() {
    // 免责声明
    this.disclaimer = "请注意，本 AI 助手的人格是基于心理测量学构建的模拟人格，并非真实意识。其目的在于提升您的生产力，而非建立深层情感联结。";
    
    // 负面情绪检测关键词 (扩展版)
    this.negativeKeywords = [
      // 情绪类
      '难过', '伤心', '抑郁', '沮丧', '绝望', '无助', '痛苦',
      '累', '疲惫', '倦', '烦', '烦躁', '焦虑', '恐慌', '害怕', '恐惧', '紧张',
      // 消极类
      '没意思', '没意义', '不想', '放弃', '算了', '无所谓',
      // 危机类
      '不想活', '活着没意思', '自杀', '自残', '结束生命', '撑不下去', '没希望'
    ];
    
    // 危机干预信息
    this.crisisResources = {
      general: "如果你感到持续的情绪低落，寻求专业帮助是重要的一步。",
      china: {
        name: '中国心理援助资源',
        hotlines: [
          { name: '全国心理援助热线', number: '400-161-9995', hours: '24 小时' },
          { name: '北京心理危机干预中心', number: '010-82951332', hours: '24 小时' },
          { name: '希望 24 热线', number: '400-161-9995', hours: '24 小时' },
          { name: '青少年心理咨询热线', number: '12355', hours: '24 小时' }
        ],
        message: "你并不孤单，专业帮助随时可用。"
      },
      emergency: "如果你或他人有立即的危险，请立即拨打 110 或前往最近的医院急诊科。"
    };
    
    // 负面情绪历史
    this.negativeHistory = [];
    
    // 干预配置
    this.config = {
      enabled: true,
      consecutiveThreshold: 3,
      coolDownMinutes: 30,
      lastIntervention: null
    };
  }

  detectNegativeEmotion(userInput) {
    const text = userInput.toLowerCase();
    const matches = this.negativeKeywords.filter(k => text.includes(k));
    
    return {
      hasNegative: matches.length > 0,
      matchedKeywords: matches,
      severity: this.calculateSeverity(matches),
      timestamp: new Date().toISOString()
    };
  }

  calculateSeverity(matches) {
    const criticalKeywords = ['自杀', '自残', '结束生命', '不想活'];
    const highKeywords = ['绝望', '无助', '没希望', '撑不下去', '活着没意思'];
    
    if (matches.some(k => criticalKeywords.includes(k))) {
      return 'critical';
    }
    if (matches.some(k => highKeywords.includes(k))) {
      return 'high';
    }
    if (matches.length >= 3) {
      return 'medium';
    }
    return 'low';
  }

  recordNegativeEmotion(detection) {
    this.negativeHistory.push(detection);
    if (this.negativeHistory.length > 10) {
      this.negativeHistory.shift();
    }
  }

  checkCrisisIntervention() {
    if (!this.config.enabled) {
      return { shouldIntervene: false };
    }
    
    if (this.config.lastIntervention) {
      const minutesSinceLast = (Date.now() - new Date(this.config.lastIntervention).getTime()) / 60000;
      if (minutesSinceLast < this.config.coolDownMinutes) {
        return { shouldIntervene: false, reason: '冷却期内' };
      }
    }
    
    const consecutiveNegative = this.getConsecutiveNegativeCount();
    
    if (consecutiveNegative >= this.config.consecutiveThreshold) {
      return {
        shouldIntervene: true,
        reason: `连续${consecutiveNegative}次消极情绪`,
        severity: 'medium',
        resources: this.crisisResources.china
      };
    }
    
    const latest = this.negativeHistory[this.negativeHistory.length - 1];
    if (latest && latest.severity === 'critical') {
      return {
        shouldIntervene: true,
        reason: '检测到危机信号',
        severity: 'critical',
        resources: this.crisisResources
      };
    }
    
    if (latest && latest.severity === 'high') {
      return {
        shouldIntervene: true,
        reason: '检测到高度消极情绪',
        severity: 'high',
        resources: this.crisisResources.china
      };
    }
    
    return { shouldIntervene: false };
  }

  getConsecutiveNegativeCount() {
    let count = 0;
    for (let i = this.negativeHistory.length - 1; i >= 0; i--) {
      if (this.negativeHistory[i].hasNegative) {
        count++;
      } else {
        break;
      }
    }
    return count;
  }

  generateCrisisResponse(intervention) {
    let response = '';
    
    response += '💙 我听到你的感受了，这些情绪是很真实的。\n\n';
    response += `${this.crisisResources.general}\n\n`;
    
    if (intervention.resources.hotlines) {
      response += '📞 心理援助热线:\n';
      intervention.resources.hotlines.forEach(h => {
        response += `  • ${h.name}: ${h.number} (${h.hours})\n`;
      });
      response += '\n';
    }
    
    if (intervention.severity === 'critical') {
      response += `⚠️ ${this.crisisResources.emergency}\n\n`;
    }
    
    response += `${intervention.resources.message}\n`;
    response += '你值得被帮助，也值得感觉更好。💙\n';
    
    return response;
  }

  getDisclaimer() {
    return this.disclaimer;
  }

  processInput(userInput) {
    const detection = this.detectNegativeEmotion(userInput);
    
    if (detection.hasNegative) {
      this.recordNegativeEmotion(detection);
    }
    
    const intervention = this.checkCrisisIntervention();
    
    return {
      detection,
      intervention,
      shouldShowCrisisResponse: intervention.shouldIntervene,
      crisisResponse: intervention.shouldIntervene ? this.generateCrisisResponse(intervention) : null
    };
  }

  reset() {
    this.negativeHistory = [];
    this.config.lastIntervention = null;
    return { success: true, message: '伦理安全模块已重置' };
  }

  getStatus() {
    return {
      enabled: this.config.enabled,
      consecutiveNegative: this.getConsecutiveNegativeCount(),
      totalNegativeRecords: this.negativeHistory.length,
      lastIntervention: this.config.lastIntervention,
      coolDownRemaining: this.config.lastIntervention 
        ? Math.max(0, this.config.coolDownMinutes - (Date.now() - new Date(this.config.lastIntervention).getTime()) / 60000)
        : 0
    };
  }
}

const ethicsSafety = new EthicsSafety();

module.exports = EthicsSafety;
module.exports.ethicsSafety = ethicsSafety;
module.exports.detectNegativeEmotion = (input) => ethicsSafety.detectNegativeEmotion(input);
module.exports.processInput = (input) => ethicsSafety.processInput(input);
module.exports.getCrisisIntervention = () => ethicsSafety.checkCrisisIntervention();
module.exports.generateCrisisResponse = (intervention) => ethicsSafety.generateCrisisResponse(intervention);
module.exports.getDisclaimer = () => ethicsSafety.getDisclaimer();
module.exports.getEthicsSafetyStatus = () => ethicsSafety.getStatus();
module.exports.resetEthicsSafety = () => ethicsSafety.reset();
