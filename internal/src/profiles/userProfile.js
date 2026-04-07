/**
 * 用户画像系统 - HeartFlow V2
 * 
 * 核心理念：每个用户的情感需求是独特的，系统需要学习并适应
 * 
 * 画像内容：
 * - 情感偏好（哪种情感回应用户最接受）
 * - 信任度（影响共情深度）
 * - 交互模式（活跃时间、话题偏好等）
 * - 共情深度等级（决定回应的深入程度）
 */

const { EmotionTypes } = require('../emotion/states');

class UserProfile {
  constructor(userId, options = {}) {
    this.userId = userId;
    this.createdAt = new Date().toISOString();
    
    // 信任度 (0-100)
    this.trustLevel = options.initialTrust || 0;
    
    // 情感偏好统计
    this.emotionPreferences = {};
    Object.values(EmotionTypes).forEach(emotion => {
      this.emotionPreferences[emotion] = {
        count: 0,
        positiveCount: 0,
        negativeCount: 0,
        averageEffectiveness: 0
      };
    });
    
    // 交互历史摘要
    this.interactionSummary = {
      totalInteractions: 0,
      firstInteraction: null,
      lastInteraction: null,
      averageSessionLength: 0
    };
    
    // 话题偏好
    this.topicPreferences = [];
    
    // 共情深度等级 (1-4)
    this.empathyDepthLevel = 1;
    
    // 用户特征标签
    this.tags = [];
  }
  
  /**
   * 记录一次交互
   */
  recordInteraction(interactionData) {
    const { emotion, effectiveness, topics = [] } = interactionData;
    
    // 更新交互统计
    this.interactionSummary.totalInteractions++;
    this.interactionSummary.lastInteraction = new Date().toISOString();
    if (!this.interactionSummary.firstInteraction) {
      this.interactionSummary.firstInteraction = this.interactionSummary.lastInteraction;
    }
    
    // 更新情感偏好
    if (emotion && this.emotionPreferences[emotion]) {
      const pref = this.emotionPreferences[emotion];
      pref.count++;
      
      // 根据效果更新正负计数
      if (effectiveness > 0.6) {
        pref.positiveCount++;
      } else if (effectiveness < 0.4) {
        pref.negativeCount++;
      }
      
      // 更新平均效果分数（移动平均）
      const alpha = 0.1; // 平滑系数
      pref.averageEffectiveness = 
        pref.averageEffectiveness * (1 - alpha) + effectiveness * alpha;
    }
    
    // 更新话题偏好
    topics.forEach(topic => {
      const existing = this.topicPreferences.find(t => t.name === topic);
      if (existing) {
        existing.count++;
      } else {
        this.topicPreferences.push({ name: topic, count: 1 });
      }
    });
    
    // 更新信任度
    this.updateTrustLevel(effectiveness);
    
    // 更新共情深度等级
    this.updateEmpathyDepthLevel();
    
    // 更新用户标签
    this.updateTags();
  }
  
  /**
   * 更新信任度
   */
  updateTrustLevel(effectiveness) {
    const delta = effectiveness > 0.5 ? 2 : -1; // 正面交互 +2，负面 -1
    this.trustLevel = Math.min(100, Math.max(0, this.trustLevel + delta));
  }
  
  /**
   * 更新共情深度等级
   */
  updateEmpathyDepthLevel() {
    // 基于信任度和交互次数决定共情深度
    const { totalInteractions } = this.interactionSummary;
    
    if (this.trustLevel >= 80 && totalInteractions >= 50) {
      this.empathyDepthLevel = 4; // 专业共情
    } else if (this.trustLevel >= 60 && totalInteractions >= 30) {
      this.empathyDepthLevel = 3; // 深度共情
    } else if (this.trustLevel >= 30 && totalInteractions >= 10) {
      this.empathyDepthLevel = 2; // 适度探索
    } else {
      this.empathyDepthLevel = 1; // 表面支持
    }
  }
  
  /**
   * 更新用户标签
   */
  updateTags() {
    this.tags = [];
    
    // 基于信任度的标签
    if (this.trustLevel >= 80) this.tags.push('high_trust');
    else if (this.trustLevel >= 50) this.tags.push('medium_trust');
    else this.tags.push('building_trust');
    
    // 基于交互频率的标签
    const days = this.getDaysSinceFirstInteraction();
    const interactionsPerDay = days > 0 ? this.interactionSummary.totalInteractions / days : 0;
    
    if (interactionsPerDay >= 10) this.tags.push('highly_active');
    else if (interactionsPerDay >= 3) this.tags.push('active');
    else this.tags.push('casual');
    
    // 基于情感偏好的标签
    const preferredEmotion = this.getPreferredEmotion();
    if (preferredEmotion) {
      this.tags.push(`prefers_${preferredEmotion}`);
    }
  }
  
  /**
   * 获取首次交互以来的天数
   */
  getDaysSinceFirstInteraction() {
    if (!this.interactionSummary.firstInteraction) return 0;
    const first = new Date(this.interactionSummary.firstInteraction);
    const now = new Date();
    return Math.floor((now - first) / (1000 * 60 * 60 * 24));
  }
  
  /**
   * 获取用户最偏好的情感
   */
  getPreferredEmotion() {
    let best = null;
    let bestScore = 0;
    
    Object.entries(this.emotionPreferences).forEach(([emotion, pref]) => {
      if (pref.count < 3) return; // 至少需要 3 次交互才有统计意义
      
      const score = pref.averageEffectiveness * pref.count;
      if (score > bestScore) {
        bestScore = score;
        best = emotion;
      }
    });
    
    return best;
  }
  
  /**
   * 获取共情深度描述
   */
  getEmpathyDepthDescription() {
    const descriptions = {
      1: {
        name: '表面支持',
        description: '基础的情感回应，以倾听和认可为主',
        responseStyle: '简洁、支持性、不深入'
      },
      2: {
        name: '适度探索',
        description: '开始探索用户的情感背后原因',
        responseStyle: '提问、引导、适度深入'
      },
      3: {
        name: '深度共情',
        description: '提供深入的情感支持和理解',
        responseStyle: '共情、验证、情感陪伴'
      },
      4: {
        name: '专业共情',
        description: '精准的情感干预和建议',
        responseStyle: '精准、有洞见、可能提供建议'
      }
    };
    
    return descriptions[this.empathyDepthLevel] || descriptions[1];
  }
  
  /**
   * 获取推荐的回应方式
   */
  getRecommendedResponseStyle(emotion) {
    const pref = this.emotionPreferences[emotion];
    
    if (!pref || pref.count === 0) {
      return {
        intensity: 3, // 默认中等强度
        depth: this.empathyDepthLevel,
        style: 'standard'
      };
    }
    
    // 根据历史效果推荐
    const avgEffectiveness = pref.averageEffectiveness;
    
    return {
      intensity: avgEffectiveness > 0.7 ? 4 : (avgEffectiveness < 0.4 ? 2 : 3),
      depth: this.empathyDepthLevel,
      style: avgEffectiveness > 0.6 ? 'warm' : 'gentle'
    };
  }
  
  /**
   * 获取用户画像摘要
   */
  getSummary() {
    return {
      userId: this.userId,
      trustLevel: this.trustLevel,
      empathyDepthLevel: this.empathyDepthLevel,
      empathyDepthDescription: this.getEmpathyDepthDescription().name,
      totalInteractions: this.interactionSummary.totalInteractions,
      preferredEmotion: this.getPreferredEmotion(),
      tags: this.tags,
      createdAt: this.createdAt,
      lastInteraction: this.interactionSummary.lastInteraction
    };
  }
  
  /**
   * 导出用户画像（用于持久化）
   */
  exportState() {
    return {
      userId: this.userId,
      trustLevel: this.trustLevel,
      emotionPreferences: this.emotionPreferences,
      interactionSummary: this.interactionSummary,
      topicPreferences: this.topicPreferences,
      empathyDepthLevel: this.empathyDepthLevel,
      tags: this.tags,
      createdAt: this.createdAt,
      exportedAt: new Date().toISOString()
    };
  }
  
  /**
   * 导入用户画像（用于恢复）
   */
  importState(data) {
    if (data.trustLevel !== undefined) this.trustLevel = data.trustLevel;
    if (data.emotionPreferences) this.emotionPreferences = data.emotionPreferences;
    if (data.interactionSummary) this.interactionSummary = data.interactionSummary;
    if (data.topicPreferences) this.topicPreferences = data.topicPreferences;
    if (data.empathyDepthLevel) this.empathyDepthLevel = data.empathyDepthLevel;
    if (data.tags) this.tags = data.tags;
    if (data.createdAt) this.createdAt = data.createdAt;
  }
}

module.exports = UserProfile;
