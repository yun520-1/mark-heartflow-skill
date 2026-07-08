/**
 * 共情回应生成器（独立模块）
 * 
 * 功能：
 * 1. 基于检索式系统（TF-IDF）生成共情回应
 * 2. 用缓存（只加载一次模型）
 * 3. 提供 simpleResponse() 方法（返回固定回应，用于测试）
 * 
 * 用法：
 * const EmpathyResponder = require('./empathy-responder.js');
 * const responder = new EmpathyResponder();
 * const response = responder.generate(userMessage);
 */

class EmpathyResponder {
  constructor(options = {}) {
    this.modelPath = options.modelPath || require('path').join(__dirname, '..', '..', 'models', 'empathy_retrieval.json');
    this.cache = null;  // 模型缓存
    this.initialized = false;
  }

  /**
   * 初始化（加载模型到缓存）
   */
  init() {
    if (this.initialized) {
      return;
    }

    const fs = require('fs');
    if (fs.existsSync(this.modelPath)) {
      this.cache = JSON.parse(fs.readFileSync(this.modelPath, 'utf-8'));
      console.log(`[EmpathyResponder] 模型已加载（${this.cache.train_data.length} 个样本）`);
    } else {
      console.warn(`[EmpathyResponder] 模型不存在：${this.modelPath}`);
    }

    this.initialized = true;
  }

  /**
   * 生成共情回应（基于检索）
   * @param {string} userMessage - 用户消息
   * @returns {string} - 共情回应
   */
  generate(userMessage) {
    // 确保模型已加载
    if (!this.initialized) {
      this.init();
    }

    // 如果模型不存在，返回默认回应
    if (!this.cache) {
      return this._defaultResponse();
    }

    // 计算相似度（简化：找包含相同关键词的回应）
    const keywords = userMessage.toLowerCase().split('');
    let bestMatch = null;
    let bestScore = -1;

    this.cache.train_data.forEach((item, idx) => {
      const input = item.input.toLowerCase();
      let score = 0;
      keywords.forEach(kw => {
        if (input.includes(kw)) {
          score += 1;
        }
      });
      if (score > bestScore) {
        bestScore = score;
        bestMatch = item;
      }
    });

    if (bestMatch && bestScore > 0) {
      return bestMatch.output;
    } else {
      return this._defaultResponse();
    }
  }

  /**
   * 默认共情回应
   */
  _defaultResponse() {
    const defaults = [
      '我理解你的感受，这一定很不容易。',
      '谢谢你愿意分享，我在倾听。',
      '你并不孤单，我们一起面对。',
    ];
    return defaults[Math.floor(Math.random() * defaults.length)];
  }

  /**
   * 简化版（用于测试）
   */
  simpleResponse() {
    return '我理解你的感受。';
  }
}

module.exports = { EmpathyResponder };
