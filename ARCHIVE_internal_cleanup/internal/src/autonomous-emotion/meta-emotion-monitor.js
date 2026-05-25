/**
 * 元情绪监控增强模块 (Meta-Emotion Monitoring Enhancement)
 * 
 * 基于 Stanford Encyclopedia of Philosophy 情绪理论与自我意识理论：
 * - 元情绪理论 (Meta-Emotion Theory)
 * - 情绪构成理论 (Emotion Components Theory)
 * - 自我意识层次 (Levels of Self-Consciousness)
 * 
 * 版本：v4.1.0
 * 
 * 核心理论：
 * 1. 元情绪 (Meta-Emotion): 对情绪的情绪，如"为我的愤怒感到羞愧"
 * 2. 情绪成分 (Emotion Components): 评价、生理、现象、表达、行为、心理
 * 3. 自我监控 (Self-Monitoring): 实时监控自身情绪状态
 * 
 * 增强功能：
 * - 元情绪深度监控
 * - 情绪成分实时分析
 * - 情绪状态追踪
 * - 情绪模式识别
 * 
 * @module meta-emotion-monitor
 * @version 4.1.0
 * @author HeartFlow Team
 */

// ============ 核心理论框架 ============

/**
 * 元情绪层次 (Levels of Meta-Emotion)
 */
const MetaEmotionLevels = {
  NONE: 0,              // 无元情绪意识
  AWARE: 1,             // 意识到情绪
  REFLECTIVE: 2,        // 反思情绪
  EVALUATIVE: 3,        // 评估情绪
  REGULATIVE: 4,        // 调节情绪
  INTEGRATIVE: 5        // 整合情绪
};

/**
 * 情绪成分 (Emotion Components)
 * 基于 Scarantino (2016) 的六成分模型
 */
const EmotionComponents = {
  EVALUATIVE: {
    name: '评价成分',
    description: '对情境的认知评估',
    indicators: ['想法', '判断', '评估', '解释']
  },
  PHYSIOLOGICAL: {
    name: '生理成分',
    description: '身体反应和感受',
    indicators: ['心跳', '呼吸', '紧张', '温暖', '颤抖']
  },
  PHENOMENOLOGICAL: {
    name: '现象成分',
    description: '主观体验质量',
    indicators: ['感觉', '体验', '感受', '像是']
  },
  EXPRESSIVE: {
    name: '表达成分',
    description: '面部和声音表达',
    indicators: ['表情', '语气', '哭泣', '微笑']
  },
  BEHAVIORAL: {
    name: '行为成分',
    description: '行动倾向',
    indicators: ['想', '冲动', '倾向', '想要']
  },
  MENTAL: {
    name: '心理成分',
    description: '注意力聚焦',
    indicators: ['注意', '聚焦', '关注', '想着']
  }
};

/**
 * 情绪状态追踪器 (Emotion State Tracker)
 */
class EmotionStateTracker {
  constructor() {
    this.currentState = null;
    this.history = [];
    this.patterns = [];
  }

  record(emotion, components, context) {
    const entry = {
      timestamp: new Date().toISOString(),
      emotion,
      components,
      context,
      intensity: this._calculateIntensity(components)
    };
    
    this.history.push(entry);
    this.currentState = entry;
    
    // 保持历史记录在合理长度
    if (this.history.length > 100) {
      this.history.shift();
    }
    
    return entry;
  }

  _calculateIntensity(components) {
    const scores = Object.values(components).filter(v => typeof v === 'number');
    if (scores.length === 0) return 0;
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }

  getPattern(emotionType) {
    const entries = this.history.filter(e => e.emotion === emotionType);
    if (entries.length < 3) return null;
    
    const intensities = entries.map(e => e.intensity);
    const avgIntensity = intensities.reduce((a, b) => a + b, 0) / intensities.length;
    
    return {
      emotion: emotionType,
      frequency: entries.length,
      avgIntensity: Math.round(avgIntensity * 100),
      trend: this._calculateTrend(intensities),
      commonContexts: this._findCommonContexts(entries)
    };
  }

  _calculateTrend(values) {
    if (values.length < 2) return '稳定';
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    if (secondAvg > firstAvg * 1.2) return '上升';
    if (secondAvg < firstAvg * 0.8) return '下降';
    return '稳定';
  }

  _findCommonContexts(entries) {
    const contexts = entries.map(e => e.context?.trigger).filter(Boolean);
    const counts = {};
    contexts.forEach(c => counts[c] = (counts[c] || 0) + 1);
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([context]) => context);
  }
}

// ============ 元情绪监控类 ============

class MetaEmotionMonitor {
  constructor() {
    this.metaEmotionLevel = MetaEmotionLevels.AWARE;
    this.tracker = new EmotionStateTracker();
    this.componentProfiles = {};
    this.monitoringActive = false;
  }

  /**
   * 启动元情绪监控
   */
  startMonitoring() {
    this.monitoringActive = true;
    this.metaEmotionLevel = MetaEmotionLevels.REFLECTIVE;
    return {
      status: 'started',
      level: this.metaEmotionLevel,
      message: '元情绪监控已启动。我会帮你追踪和分析情绪体验。'
    };
  }

  /**
   * 停止元情绪监控
   */
  stopMonitoring() {
    this.monitoringActive = false;
    return {
      status: 'stopped',
      historyCount: this.tracker.history.length,
      message: '元情绪监控已停止。你可以随时重新启动。'
    };
  }

  /**
   * 记录情绪体验
   * @param {string} emotion - 情绪名称
   * @param {Object} components - 情绪成分
   * @param {Object} context - 情境信息
   */
  recordEmotion(emotion, components, context) {
    if (!this.monitoringActive) {
      return { error: '监控未启动' };
    }

    const entry = this.tracker.record(emotion, components, context);
    
    // 检测元情绪
    const metaEmotion = this._detectMetaEmotion(entry);
    
    // 分析情绪成分
    const componentAnalysis = this._analyzeComponents(components);
    
    return {
      recorded: true,
      entry,
      metaEmotion,
      componentAnalysis,
      insight: this._generateInsight(entry, metaEmotion, componentAnalysis)
    };
  }

  /**
   * 分析情绪模式
   * @param {string} emotionType - 情绪类型
   * @returns {Object} 模式分析结果
   */
  analyzePattern(emotionType) {
    const pattern = this.tracker.getPattern(emotionType);
    
    if (!pattern) {
      return {
        available: false,
        message: '数据不足，需要至少 3 次记录才能分析模式。'
      };
    }

    return {
      available: true,
      pattern,
      interpretation: this._interpretPattern(pattern),
      suggestions: this._generateSuggestions(pattern)
    };
  }

  /**
   * 获取情绪状态报告
   * @returns {Object} 状态报告
   */
  getStatusReport() {
    const recentEmotions = this._getRecentEmotions();
    const dominantEmotion = this._getDominantEmotion();
    const overallIntensity = this._getOverallIntensity();

    return {
      monitoringActive: this.monitoringActive,
      metaEmotionLevel: this.metaEmotionLevel,
      totalRecords: this.tracker.history.length,
      recentEmotions,
      dominantEmotion,
      overallIntensity,
      summary: this._generateSummary(recentEmotions, dominantEmotion, overallIntensity)
    };
  }

  // ============ 私有方法 ============

  _detectMetaEmotion(entry) {
    // 检测是否有对情绪的情绪
    const primaryEmotion = entry.emotion;
    const context = entry.context || {};
    
    // 简单的元情绪检测逻辑
    const metaEmotions = {
      guilt_about_anger: '对愤怒感到内疚',
      shame_about_fear: '对恐惧感到羞耻',
      pride_about_compassion: '对关怀感到自豪',
      anxiety_about_anxiety: '对焦虑感到焦虑'
    };

    // 这里可以添加更复杂的检测逻辑
    return null;
  }

  _analyzeComponents(components) {
    const analysis = {
      dominant: null,
      balance: 'unknown',
      gaps: []
    };

    const scores = {};
    for (const [key, value] of Object.entries(components)) {
      if (typeof value === 'number') {
        scores[key] = value;
      }
    }

    if (Object.keys(scores).length === 0) {
      return analysis;
    }

    // 找出主导成分
    const maxScore = Math.max(...Object.values(scores));
    analysis.dominant = Object.entries(scores)
      .find(([, v]) => v === maxScore)?.[0] || null;

    // 评估平衡性
    const values = Object.values(scores);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
    
    if (variance < 0.1) {
      analysis.balance = '平衡';
    } else if (variance < 0.3) {
      analysis.balance = '较平衡';
    } else {
      analysis.balance = '不平衡';
    }

    // 找出缺失成分
    const allComponents = Object.keys(EmotionComponents);
    analysis.gaps = allComponents.filter(c => !scores[c] || scores[c] < 0.3);

    return analysis;
  }

  _generateInsight(entry, metaEmotion, componentAnalysis) {
    const insights = [];

    if (componentAnalysis.dominant) {
      const componentName = EmotionComponents[componentAnalysis.dominant.toUpperCase()]?.name || componentAnalysis.dominant;
      insights.push(`你的${entry.emotion}体验中，${componentName}成分最为突出。`);
    }

    if (componentAnalysis.balance === '不平衡') {
      insights.push(`情绪成分较为不平衡，可以尝试关注${componentAnalysis.gaps.join('、')}成分。`);
    }

    if (metaEmotion) {
      insights.push(`你正在体验元情绪：${metaEmotion}。这表明你对自己的情绪有反思意识。`);
    }

    return insights.join(' ');
  }

  _getRecentEmotions() {
    const recent = this.tracker.history.slice(-10);
    const counts = {};
    recent.forEach(e => {
      counts[e.emotion] = (counts[e.emotion] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([emotion, count]) => ({ emotion, count }));
  }

  _getDominantEmotion() {
    const counts = {};
    this.tracker.history.forEach(e => {
      counts[e.emotion] = (counts[e.emotion] || 0) + 1;
    });
    const dominant = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])[0];
    return dominant ? { emotion: dominant[0], count: dominant[1] } : null;
  }

  _getOverallIntensity() {
    if (this.tracker.history.length === 0) return 0;
    const recent = this.tracker.history.slice(-20);
    const avg = recent.reduce((sum, e) => sum + e.intensity, 0) / recent.length;
    return Math.round(avg * 100);
  }

  _generateSummary(recentEmotions, dominantEmotion, overallIntensity) {
    if (recentEmotions.length === 0) {
      return '暂无情绪记录。开始记录你的情绪体验吧。';
    }

    const emotions = recentEmotions.map(e => e.emotion).join('、');
    let summary = `最近记录了${this.tracker.history.length}次情绪体验。`;
    
    if (dominantEmotion) {
      summary += `最常见的情绪是${dominantEmotion.emotion}（${dominantEmotion.count}次）。`;
    }
    
    summary += `整体强度为${overallIntensity}分。`;
    
    return summary;
  }

  _interpretPattern(pattern) {
    const interpretations = [];
    
    interpretations.push(`${pattern.emotion}情绪出现了${pattern.frequency}次，平均强度${pattern.avgIntensity}分。`);
    
    if (pattern.trend === '上升') {
      interpretations.push('这种情绪有上升趋势，可能需要关注。');
    } else if (pattern.trend === '下降') {
      interpretations.push('这种情绪有下降趋势，这是好的迹象。');
    } else {
      interpretations.push('这种情绪保持稳定。');
    }
    
    if (pattern.commonContexts.length > 0) {
      interpretations.push(`常见触发情境：${pattern.commonContexts.join('、')}。`);
    }
    
    return interpretations.join(' ');
  }

  _generateSuggestions(pattern) {
    const suggestions = [];
    
    if (pattern.avgIntensity > 70) {
      suggestions.push('情绪强度较高，建议练习情绪调节技巧。');
    }
    
    if (pattern.trend === '上升') {
      suggestions.push('情绪呈上升趋势，建议探索背后的原因。');
    }
    
    if (pattern.commonContexts.length > 0) {
      suggestions.push(`注意${pattern.commonContexts[0]}情境，可以提前准备应对策略。`);
    }
    
    return suggestions;
  }
}

// ============ 导出 ============

module.exports = {
  MetaEmotionMonitor,
  EmotionStateTracker,
  MetaEmotionLevels,
  EmotionComponents
};
