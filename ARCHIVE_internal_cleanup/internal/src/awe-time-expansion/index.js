/**
 * Awe-Time Expansion Module v5.0.3
 * 
 * 敬畏 - 时间扩展整合模块
 * 
 * 理论来源:
 * - SEP Temporal Consciousness: 时间意识三大模型 + Husserl 时间三重结构
 * - Berkeley GGSC Awe Psychology: 敬畏定义 + 效价区分 + 时间扩展效应
 * 
 * 核心洞察: 敬畏体验会导致时间感知扩展 (Awe-induced Time Expansion)
 * 
 * @author HeartFlow Team
 * @version 5.0.3
 */

class AweTimeExpansionAssessor {
  constructor() {
    // 敬畏来源分类 (Berkeley GGSC)
    this.aweSources = {
      NATURE: 'nature',           // 自然景观
      HUMAN_CONNECTION: 'human_connection',  // 人际连接
      ART_MUSIC: 'art_music',     // 艺术/音乐
      RELIGIOUS_SPIRITUAL: 'religious_spiritual',  // 宗教/灵性
      INTELLECTUAL: 'intellectual',  // 智性洞见
      ACHIEVEMENT: 'achievement',    // 成就体验
      EVERYDAY: 'everyday'          // 日常敬畏
    };

    // 敬畏效价类型
    this.aweValences = {
      POSITIVE: 'positive',  // 积极敬畏 (wonder, amazement)
      NEGATIVE: 'negative',  // 消极敬畏 (dread, threat)
      MIXED: 'mixed'         // 混合效价
    };

    // 时间扩展效应指标
    this.timeExpansionIndicators = {
      SLOWED_TIME: 'slowed_time',      // 时间变慢感
      PRESENT_MOMENT: 'present_moment',  // 当下临在感增强
      DETACHED_CONCERNS: 'detached_concerns',  // 脱离日常关切
      EXPANDED_AWARENESS: 'expanded_awareness'  // 意识扩展感
    };
  }

  /**
   * 评估敬畏体验的时间扩展效应
   * 
   * @param {Object} experienceReport - 体验报告
   * @returns {Object} 评估结果
   */
  assess(experienceReport) {
    const {
      description = '',
      source = '',
      intensity = 5,
      duration = 0,
      bodilySensations = [],
      thoughts = [],
      emotions = []
    } = experienceReport;

    // 1. 识别敬畏来源
    const identifiedSource = this._identifyAweSource(description, source);

    // 2. 评估敬畏效价
    const valenceAssessment = this._assessAweValence(description, emotions);

    // 3. 检测时间扩展效应
    const timeExpansion = this._detectTimeExpansion(description, bodilySensations);

    // 4. 计算整合分数
    const integrationScore = this._calculateIntegrationScore(
      intensity,
      valenceAssessment,
      timeExpansion
    );

    // 5. 生成个性化建议
    const recommendations = this._generateRecommendations(
      identifiedSource,
      valenceAssessment,
      timeExpansion
    );

    return {
      source: identifiedSource,
      valence: valenceAssessment,
      timeExpansion,
      integrationScore,
      recommendations,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 识别敬畏来源
   * @private
   */
  _identifyAweSource(description, explicitSource) {
    if (explicitSource) {
      return explicitSource;
    }

    const text = description.toLowerCase();
    
    // 关键词匹配
    const sourceKeywords = {
      [this.aweSources.NATURE]: ['自然', '山', '海', '星', '树', '花', '日出', '日落', '风景', '天空', '宇宙'],
      [this.aweSources.HUMAN_CONNECTION]: ['孩子', '婴儿', '人', '爱', '关系', '连接', '共情'],
      [this.aweSources.ART_MUSIC]: ['音乐', '艺术', '画', '雕塑', '建筑', '美', '作品'],
      [this.aweSources.RELIGIOUS_SPIRITUAL]: ['神', '灵', '宗教', '信仰', '神圣', '祈祷', '冥想'],
      [this.aweSources.INTELLECTUAL]: ['理解', '洞见', '知识', '科学', '理论', '发现'],
      [this.aweSources.ACHIEVEMENT]: ['成就', '成功', '突破', '完成', '目标'],
      [this.aweSources.EVERYDAY]: ['日常', '普通', '简单', '小', '平凡']
    };

    for (const [source, keywords] of Object.entries(sourceKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return source;
      }
    }

    return this.aweSources.EVERYDAY;
  }

  /**
   * 评估敬畏效价
   * @private
   */
  _assessAweValence(description, emotions) {
    const text = description.toLowerCase();
    
    // 消极敬畏关键词
    const negativeKeywords = ['恐惧', '害怕', '威胁', '危险', '恐怖', '愤怒', '惩罚', '毁灭'];
    
    // 积极敬畏关键词
    const positiveKeywords = [' wonder', '惊奇', '美好', '美丽', '喜悦', '平静', '感恩', '温暖'];

    const hasNegative = negativeKeywords.some(k => text.includes(k)) ||
                        emotions.some(e => ['fear', 'anger', 'threat'].includes(e.toLowerCase()));
    
    const hasPositive = positiveKeywords.some(k => text.includes(k)) ||
                        emotions.some(e => ['joy', 'gratitude', 'peace', 'wonder'].includes(e.toLowerCase()));

    if (hasNegative && hasPositive) {
      return {
        type: this.valences.MIXED,
        score: 0.5,
        note: '混合效价敬畏：同时包含积极和消极元素'
      };
    } else if (hasNegative) {
      return {
        type: this.valences.NEGATIVE,
        score: 0.2,
        note: '消极敬畏：带有恐惧或威胁感，益处可能有限',
        warning: '消极敬畏可能导致无力感，建议转向积极敬畏练习'
      };
    } else {
      return {
        type: this.valences.POSITIVE,
        score: 1.0,
        note: '积极敬畏：具有完整的心理和生理益处'
      };
    }
  }

  /**
   * 检测时间扩展效应
   * @private
   */
  _detectTimeExpansion(description, bodilySensations) {
    const text = description.toLowerCase();
    
    // 时间扩展关键词
    const timeKeywords = ['时间', '慢', '静止', '永恒', '当下', '此刻', '暂停', '延长', '扩展'];
    
    // 临在感关键词
    const presenceKeywords = ['临在', '觉察', '意识', '专注', '沉浸', '融入'];

    const timeScore = timeKeywords.filter(k => text.includes(k)).length / timeKeywords.length;
    const presenceScore = presenceKeywords.filter(k => text.includes(k)).length / presenceKeywords.length;

    const indicators = [];
    
    if (timeScore > 0.3) indicators.push(this.timeExpansionIndicators.SLOWED_TIME);
    if (presenceScore > 0.3) indicators.push(this.timeExpansionIndicators.PRESENT_MOMENT);
    if (text.includes('脱离') || text.includes('放下')) indicators.push(this.timeExpansionIndicators.DETACHED_CONCERNS);
    if (text.includes('扩展') || text.includes('广阔')) indicators.push(this.timeExpansionIndicators.EXPANDED_AWARENESS);

    const overallScore = (timeScore + presenceScore) / 2;

    return {
      detected: indicators.length > 0,
      indicators,
      score: overallScore,
      level: this._getTimeExpansionLevel(overallScore),
      description: this._getTimeExpansionDescription(overallScore)
    };
  }

  /**
   * 获取时间扩展水平
   * @private
   */
  _getTimeExpansionLevel(score) {
    if (score >= 0.8) return 'VERY_HIGH';
    if (score >= 0.6) return 'HIGH';
    if (score >= 0.4) return 'MODERATE';
    if (score >= 0.2) return 'LOW';
    return 'MINIMAL';
  }

  /**
   * 获取时间扩展描述
   * @private
   */
  _getTimeExpansionDescription(score) {
    const descriptions = {
      VERY_HIGH: '强烈的时间扩展体验：时间明显变慢，深度临在感',
      HIGH: '显著的时间扩展：时间感延长，当下意识增强',
      MODERATE: '中度的时间扩展：轻微的时间变慢感',
      LOW: '轻微的时间扩展：有限的当下临在感',
      MINIMAL: '未检测到明显的时间扩展效应'
    };
    return descriptions[this._getTimeExpansionLevel(score)] || descriptions.MINIMAL;
  }

  /**
   * 计算整合分数
   * @private
   */
  _calculateIntegrationScore(intensity, valenceAssessment, timeExpansion) {
    const intensityFactor = intensity / 10;  // 归一化到 0-1
    const valenceFactor = valenceAssessment.score;
    const timeExpansionFactor = timeExpansion.score;

    // 加权平均：效价最重要 (40%)，时间扩展次之 (35%)，强度再次 (25%)
    const score = (intensityFactor * 0.25) + (valenceFactor * 0.40) + (timeExpansionFactor * 0.35);
    
    return {
      overall: Math.round(score * 100),
      breakdown: {
        intensity: Math.round(intensityFactor * 100),
        valence: Math.round(valenceFactor * 100),
        timeExpansion: Math.round(timeExpansionFactor * 100)
      }
    };
  }

  /**
   * 生成个性化建议
   * @private
   */
  _generateRecommendations(source, valence, timeExpansion) {
    const recommendations = [];

    // 基于效价的建议
    if (valence.type === this.valences.NEGATIVE) {
      recommendations.push({
        type: 'WARNING',
        title: '转向积极敬畏',
        content: '您当前的敬畏体验带有恐惧或威胁感。建议尝试积极敬畏练习，如观看自然美景视频、回忆美好体验等。'
      });
    }

    // 基于来源的建议
    const sourceRecommendations = {
      [this.aweSources.NATURE]: {
        practice: '自然敬畏散步',
        description: '每周安排 2-3 次自然散步，专注观察自然细节'
      },
      [this.aweSources.HUMAN_CONNECTION]: {
        practice: '关系敬畏练习',
        description: '花时间与婴幼儿相处，或通过他们的眼睛看世界'
      },
      [this.aweSources.ART_MUSIC]: {
        practice: '艺术沉浸',
        description: '定期参观博物馆或聆听震撼心灵的音乐'
      },
      [this.aweSources.EVERYDAY]: {
        practice: '日常敬畏觉察',
        description: '每天花 5 分钟觉察日常中的微小奇迹'
      }
    };

    if (sourceRecommendations[source]) {
      recommendations.push({
        type: 'PRACTICE',
        ...sourceRecommendations[source]
      });
    }

    // 基于时间扩展的建议
    if (timeExpansion.score < 0.4) {
      recommendations.push({
        type: 'ENHANCEMENT',
        title: '增强时间扩展效应',
        content: '尝试在敬畏体验中刻意放慢呼吸，专注当下感受，让时间感自然扩展。'
      });
    }

    return recommendations;
  }

  /**
   * 生成敬畏 - 时间扩展练习
   * 
   * @param {Object} userPreferences - 用户偏好
   * @returns {Object} 练习方案
   */
  generatePractice(userPreferences = {}) {
    const {
      availableTime = 20,
      preferredSource = 'nature',
      experienceLevel = 'beginner'
    } = userPreferences;

    const practices = [];

    // 核心练习：时间扩展敬畏
    practices.push({
      name: '时间扩展敬畏练习',
      duration: Math.min(availableTime, 20),
      steps: [
        {
          step: 1,
          name: '敬畏诱导',
          duration: 5,
          instruction: '选择能引发敬畏的场景（自然景观/震撼视频/深刻回忆），让自己沉浸其中'
        },
        {
          step: 2,
          name: '时间觉察',
          duration: 5,
          instruction: '注意时间感如何变化。时间变慢了吗？当下感增强了吗？不加评判地观察'
        },
        {
          step: 3,
          name: '现象学描述',
          duration: 5,
          instruction: '用语言描述你的体验本身，不解释、不分析，只描述'
        },
        {
          step: 4,
          name: '整合',
          duration: 5,
          instruction: '将这份敬畏和临在感带入接下来的日常活动'
        }
      ]
    });

    // 附加练习：Husserl 时间三重觉察
    if (availableTime >= 15) {
      practices.push({
        name: 'Husserl 时间三重觉察',
        duration: 15,
        steps: [
          {
            step: 1,
            name: '原初印象觉察',
            duration: 5,
            instruction: '觉察当前的直接体验：声音、触感、视觉。这是"现在"的给定性'
          },
          {
            step: 2,
            name: '保留觉察',
            duration: 5,
            instruction: '觉察刚刚过去的体验如何在意识中保持。注意"刚才"如何影响"现在"'
          },
          {
            step: 3,
            name: '预期觉察',
            duration: 5,
            instruction: '觉察对即将到来的体验的预期。注意意识如何"向前延伸"'
          }
        ]
      });
    }

    return {
      practices,
      totalDuration: practices.reduce((sum, p) => sum + p.duration, 0),
      theory: {
        source: 'SEP Temporal Consciousness + Berkeley GGSC Awe Psychology',
        keyInsight: '敬畏体验通过挑战认知框架，创造时间感知扩展，增强当下临在感'
      }
    };
  }
}

module.exports = { AweTimeExpansionAssessor };
