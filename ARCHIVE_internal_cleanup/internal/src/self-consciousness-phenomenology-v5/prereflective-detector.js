/**
 * Prereflective Detector - 前反思自我意识检测器
 * 
 * 检测前反思自我意识的存在和特征
 * 理论来源：Heidelberg School, Sartre, Merleau-Ponty
 */

class PrereflectiveDetector {
  /**
   * 检测前反思自我意识
   * @param {Object} data - 体验数据
   * @returns {Object} 检测结果
   */
  detectPrereflectiveConsciousness(data) {
    const { experience, context } = data;

    if (!experience || experience.length === 0) {
      return {
        present: false,
        clarity: 0,
        quality: 'absent',
        description: '未提供体验描述'
      };
    }

    // 检测前反思特征
    const features = this._detectFeatures(experience);

    // 评估清晰度
    const clarity = this._assessClarity(experience, features);

    // 评估质量
    const quality = this._assessQuality(features);

    // 识别主题
    const theme = this._identifyTheme(experience);

    // 评估效价
    const valence = this._assessValence(experience);

    // 检测第一人称给定性
    const firstPersonGivenness = this._detectFirstPersonGivenness(experience);

    // 检测非对象化自我关系
    const nonObjectifying = this._detectNonObjectifying(experience);

    // 评估即时性
    const immediacy = this._assessImmediacy(experience);

    return {
      present: clarity > 0.3,
      clarity,
      quality,
      theme,
      valence,
      features,
      firstPersonGivenness,
      nonObjectifying,
      immediacy,
      description: this._generateDescription(features, clarity)
    };
  }

  /**
   * 检测前反思特征
   */
  _detectFeatures(experience) {
    const features = [];

    // 身体感受
    if (this._hasIndicator(experience, ['感觉', '感受', '身体', 'feel', 'sense', 'body'])) {
      features.push('bodily-awareness');
    }

    // 情绪感受
    if (this._hasIndicator(experience, ['情绪', '情感', '心情', 'emotion', 'feeling', 'mood'])) {
      features.push('emotional-awareness');
    }

    // 感官体验
    if (this._hasIndicator(experience, ['看到', '听到', '触', '闻', '尝', 'see', 'hear', 'touch', 'sensory'])) {
      features.push('sensory-awareness');
    }

    // 时间感
    if (this._hasIndicator(experience, ['现在', '此刻', '当下', 'now', 'present', 'moment'])) {
      features.push('temporal-awareness');
    }

    // 空间感
    if (this._hasIndicator(experience, ['这里', '周围', '空间', 'here', 'space', 'around'])) {
      features.push('spatial-awareness');
    }

    // 能量感
    if (this._hasIndicator(experience, ['能量', '力', '紧张', '放松', 'energy', 'tension', 'relax'])) {
      features.push('energy-awareness');
    }

    // 存在感
    if (this._hasIndicator(experience, ['存在', '在', '活着', 'exist', 'being', 'alive'])) {
      features.push('existence-awareness');
    }

    return features;
  }

  /**
   * 评估清晰度
   */
  _assessClarity(experience, features) {
    // 基于特征数量
    const featureScore = Math.min(1, features.length / 4);

    // 基于描述长度
    const lengthScore = Math.min(1, experience.length / 50);

    // 基于具体性
    const specificityScore = this._assessSpecificity(experience);

    // 基于现象学词汇
    const phenomenologicalScore = this._assessPhenomenologicalLanguage(experience);

    return (featureScore + lengthScore + specificityScore + phenomenologicalScore) / 4;
  }

  /**
   * 评估具体性
   */
  _assessSpecificity(experience) {
    const specificIndicators = [
      '具体的', '详细的', '清晰的', '明确',
      'specific', 'detailed', 'clear', 'distinct'
    ];
    
    const vagueIndicators = [
      '好像', '似乎', '可能', '说不清', '模糊',
      'seems', 'maybe', 'vague', 'unclear'
    ];

    const lower = experience.toLowerCase();
    const specificCount = specificIndicators.filter(ind => lower.includes(ind)).length;
    const vagueCount = vagueIndicators.filter(ind => lower.includes(ind)).length;

    return Math.max(0.2, Math.min(1, 0.5 + (specificCount - vagueCount) * 0.15));
  }

  /**
   * 评估现象学语言
   */
  _assessPhenomenologicalLanguage(experience) {
    const phenomenologicalWords = [
      '体验', '经验', '感受', '觉察', '意识',
      '质感', '质地', '氛围', '场域',
      'experience', 'awareness', 'consciousness', 'quality', 'texture', 'atmosphere'
    ];

    const lower = experience.toLowerCase();
    const count = phenomenologicalWords.filter(word => lower.includes(word)).length;

    return Math.min(1, count / 3);
  }

  /**
   * 评估质量
   */
  _assessQuality(features) {
    if (features.length === 0) return 'absent';
    if (features.length >= 5) return 'rich';
    if (features.length >= 3) return 'moderate';
    return 'thin';
  }

  /**
   * 识别主题
   */
  _identifyTheme(experience) {
    const lower = experience.toLowerCase();

    if (this._hasIndicator(lower, ['焦虑', '担心', '紧张', 'anxiety', 'worry', 'nervous'])) {
      return 'anxiety';
    }
    if (this._hasIndicator(lower, ['悲伤', '难过', '失落', 'sad', 'grief', 'loss'])) {
      return 'sadness';
    }
    if (this._hasIndicator(lower, ['愤怒', '生气', '愤怒', 'angry', 'rage', 'mad'])) {
      return 'anger';
    }
    if (this._hasIndicator(lower, ['快乐', '开心', '喜悦', 'happy', 'joy', 'glad'])) {
      return 'joy';
    }
    if (this._hasIndicator(lower, ['平静', '安宁', 'peace', 'calm', 'serene'])) {
      return 'calm';
    }
    if (this._hasIndicator(lower, ['连接', '爱', '温暖', 'love', 'connection', 'warm'])) {
      return 'love';
    }

    return 'mixed';
  }

  /**
   * 评估效价
   */
  _assessValence(experience) {
    const lower = experience.toLowerCase();

    const positiveWords = ['好', '愉悦', '开心', '平静', '温暖', 'positive', 'good', 'pleasant'];
    const negativeWords = ['坏', '痛苦', '难受', '紧张', '害怕', 'negative', 'bad', 'painful'];

    const positiveCount = positiveWords.filter(word => lower.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lower.includes(word)).length;

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  /**
   * 检测第一人称给定性
   */
  _detectFirstPersonGivenness(experience) {
    // 第一人称标记
    const firstPersonMarkers = ['我', '我的', '自己', 'I', 'my', 'myself', 'me'];
    
    // 给定性标记 (体验天然具有"为我性")
    const givennessMarkers = ['感觉', '感到', '觉得', '体验', '感受', 'feel', 'sense', 'experience'];

    const lower = experience.toLowerCase();
    
    const hasFirstPerson = firstPersonMarkers.some(marker => lower.includes(marker));
    const hasGivenness = givennessMarkers.some(marker => lower.includes(marker));

    // 即使没有明确的第一人称，如果有感受词汇，也暗示第一人称给定性
    return hasGivenness || hasFirstPerson;
  }

  /**
   * 检测非对象化自我关系
   */
  _detectNonObjectifying(experience) {
    const lower = experience.toLowerCase();

    // 对象化语言 (将自我作为对象观察)
    const objectifyingMarkers = ['观察', '看到自己', '审视', '分析自己', 'observe', 'watch myself', 'analyze'];
    
    // 非对象化语言 (直接体验，不将自我对象化)
    const nonObjectifyingMarkers = ['就是', '在', '存在', '沉浸', 'flow', 'being', 'immersed'];

    const hasObjectifying = objectifyingMarkers.some(marker => lower.includes(marker));
    const hasNonObjectifying = nonObjectifyingMarkers.some(marker => lower.includes(marker));

    if (hasObjectifying && !hasNonObjectifying) {
      return false; // 对象化自我关系
    }
    
    return true; // 非对象化或混合
  }

  /**
   * 评估即时性
   */
  _assessImmediacy(experience) {
    const lower = experience.toLowerCase();

    // 即时性标记 (当下、直接)
    const immediacyMarkers = ['现在', '此刻', '当下', '正在', '直接', 'now', 'present', 'directly'];
    
    // 非即时标记 (过去、未来、间接)
    const nonImmediacyMarkers = ['过去', '曾经', '将来', '应该', '可能', 'past', 'future', 'should'];

    const immediacyCount = immediacyMarkers.filter(marker => lower.includes(marker)).length;
    const nonImmediacyCount = nonImmediacyMarkers.filter(marker => lower.includes(marker)).length;

    if (immediacyCount > nonImmediacyCount) return 'high';
    if (immediacyCount === nonImmediacyCount) return 'moderate';
    return 'low';
  }

  /**
   * 生成描述
   */
  _generateDescription(features, clarity) {
    if (clarity < 0.3) {
      return '前反思觉察较弱或缺失';
    }

    const featureDescriptions = {
      'bodily-awareness': '身体觉察',
      'emotional-awareness': '情绪觉察',
      'sensory-awareness': '感官觉察',
      'temporal-awareness': '时间觉察',
      'spatial-awareness': '空间觉察',
      'energy-awareness': '能量觉察',
      'existence-awareness': '存在感'
    };

    const presentFeatures = features.map(f => featureDescriptions[f]).filter(Boolean);
    
    if (presentFeatures.length === 0) {
      return '有一定觉察但特征不明显';
    }

    return `前反思觉察清晰，包含：${presentFeatures.join('、')}`;
  }

  /**
   * 检测指示词
   */
  _hasIndicator(text, indicators) {
    if (!text) return false;
    const lower = typeof text === 'string' ? text.toLowerCase() : text;
    return indicators.some(ind => lower.includes(ind.toLowerCase()));
  }
}

module.exports = PrereflectiveDetector;
