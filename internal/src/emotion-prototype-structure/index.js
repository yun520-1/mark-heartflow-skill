/**
 * 情绪原型结构模块 v5.0.8
 * 
 * 基于 Fehr & Russell (1984) 的情绪概念原型理论
 * SEP Emotion §1: 情绪概念是原型组织的，不是经典范畴
 * 
 * 核心理论:
 * - 情绪概念围绕"原型"组织，存在典型性梯度
 * - 恐惧、愤怒是"更好的"情绪例子 (高原型度)
 * - 敬畏、无聊是"较差的"情绪例子 (低原型度，边界案例)
 * - 情绪识别置信度 = 原型匹配度 × 成分完整性
 */

/**
 * 情绪原型数据库
 * 
 * 每个情绪的原型度评分基于:
 * 1. 生理唤醒 (physiological_arousal)
 * 2. 行动倾向 (action_tendency)
 * 3. 对象指向性 (object_directedness)
 * 4. 现象学显著性 (phenomenological_saliency)
 * 5. 跨文化一致性 (cross_cultural_consistency)
 * 
 * 来源：Fehr & Russell (1984), Russell (1991), Scarantino (2016)
 */
const emotionPrototypes = {
  // === 高原型情绪 (prototypeScore >= 0.85) ===
  fear: {
    prototypeScore: 0.95,
    category: 'basic_emotion',
    features: {
      physiological_arousal: 0.9,      // 高唤醒
      action_tendency: 0.95,           // 强烈行动倾向 (逃跑/战斗)
      object_directedness: 0.9,        // 明确的对象 (威胁)
      phenomenological_saliency: 0.95, // 强烈的主观体验
      cross_cultural_consistency: 0.9  // 跨文化一致
    },
    typicalCauses: ['感知威胁', '危险情境', '不确定性'],
    typicalActions: ['逃跑', '回避', '战斗', '冻结'],
    bodilySignature: ['心跳加速', '肌肉紧张', '呼吸急促'],
    facialExpression: ['眼睛睁大', '眉毛上扬', '嘴巴张开']
  },
  
  anger: {
    prototypeScore: 0.92,
    category: 'basic_emotion',
    features: {
      physiological_arousal: 0.85,
      action_tendency: 0.95,           // 强烈行动倾向 (攻击)
      object_directedness: 0.95,       // 明确的对象 (冒犯者)
      phenomenological_saliency: 0.9,
      cross_cultural_consistency: 0.85
    },
    typicalCauses: ['目标受阻', '不公平对待', '边界侵犯'],
    typicalActions: ['对抗', '攻击', '表达不满', '设定边界'],
    bodilySignature: ['体温升高', '肌肉紧张', '握拳'],
    facialExpression: ['眉毛下压', '嘴唇紧绷', '凝视']
  },
  
  sadness: {
    prototypeScore: 0.88,
    category: 'basic_emotion',
    features: {
      physiological_arousal: 0.4,      // 低唤醒
      action_tendency: 0.5,            // 行动倾向降低
      object_directedness: 0.8,        // 通常有对象 (损失)
      phenomenological_saliency: 0.85,
      cross_cultural_consistency: 0.9
    },
    typicalCauses: ['损失', '分离', '失败', '无助感'],
    typicalActions: ['退缩', '寻求安慰', '哭泣'],
    bodilySignature: ['能量降低', '肩膀下垂', '流泪'],
    facialExpression: ['嘴角下垂', '眼睑下垂', '内眉上扬']
  },
  
  disgust: {
    prototypeScore: 0.87,
    category: 'basic_emotion',
    features: {
      physiological_arousal: 0.7,
      action_tendency: 0.9,            // 强烈排斥倾向
      object_directedness: 0.95,       // 明确的对象 (厌恶物)
      phenomenological_saliency: 0.85,
      cross_cultural_consistency: 0.85
    },
    typicalCauses: ['污染物', '道德违反', '身体排斥物'],
    typicalActions: ['排斥', '远离', '清洁'],
    bodilySignature: ['恶心感', '胃部不适'],
    facialExpression: ['鼻子皱起', '上唇上扬', '舌头伸出']
  },
  
  joy: {
    prototypeScore: 0.90,
    category: 'basic_emotion',
    features: {
      physiological_arousal: 0.75,
      action_tendency: 0.8,            // 接近倾向
      object_directedness: 0.75,
      phenomenological_saliency: 0.9,
      cross_cultural_consistency: 0.9
    },
    typicalCauses: ['目标达成', '社会连接', '意外收获'],
    typicalActions: ['接近', '分享', '庆祝'],
    bodilySignature: ['能量提升', '微笑冲动', '轻松感'],
    facialExpression: ['嘴角上扬', '眼睛眯起', '脸颊提升']
  },
  
  surprise: {
    prototypeScore: 0.85,
    category: 'basic_emotion',
    features: {
      physiological_arousal: 0.8,
      action_tendency: 0.6,            // 定向反应
      object_directedness: 0.7,
      phenomenological_saliency: 0.85,
      cross_cultural_consistency: 0.85
    },
    typicalCauses: ['意外事件', '违反预期'],
    typicalActions: ['定向注意', '信息搜集'],
    bodilySignature: ['瞬间冻结', '感官警觉'],
    facialExpression: ['眉毛高扬', '眼睛睁大', '下巴下落']
  },
  
  // === 中等原型情绪 (0.60 <= prototypeScore < 0.85) ===
  anxiety: {
    prototypeScore: 0.78,
    category: 'future_oriented',
    features: {
      physiological_arousal: 0.75,
      action_tendency: 0.6,            // 行动倾向不明确
      object_directedness: 0.5,        // 对象模糊 (未来威胁)
      phenomenological_saliency: 0.8,
      cross_cultural_consistency: 0.75
    },
    typicalCauses: ['未来不确定性', '潜在威胁', '控制感缺失'],
    typicalActions: ['担忧', '过度准备', '回避'],
    bodilySignature: ['肌肉紧张', '坐立不安', '胃部不适']
  },
  
  guilt: {
    prototypeScore: 0.75,
    category: 'moral_emotion',
    features: {
      physiological_arousal: 0.6,
      action_tendency: 0.7,            // 修复倾向
      object_directedness: 0.85,       // 指向自己的行为
      phenomenological_saliency: 0.8,
      cross_cultural_consistency: 0.7
    },
    typicalCauses: ['违反道德标准', '伤害他人', '未履行义务'],
    typicalActions: ['道歉', '修复', '自我惩罚'],
    bodilySignature: ['沉重感', '回避眼神']
  },
  
  shame: {
    prototypeScore: 0.72,
    category: 'self_conscious_emotion',
    features: {
      physiological_arousal: 0.65,
      action_tendency: 0.5,            // 隐藏倾向
      object_directedness: 0.6,        // 指向整体自我
      phenomenological_saliency: 0.85,
      cross_cultural_consistency: 0.65
    },
    typicalCauses: ['自我缺陷暴露', '社会评价威胁'],
    typicalActions: ['隐藏', '退缩', '逃避'],
    bodilySignature: ['脸红', '低头', '身体缩小']
  },
  
  pride: {
    prototypeScore: 0.70,
    category: 'self_conscious_emotion',
    features: {
      physiological_arousal: 0.65,
      action_tendency: 0.7,            // 展示倾向
      object_directedness: 0.75,       // 指向自己的成就
      phenomenological_saliency: 0.75,
      cross_cultural_consistency: 0.6
    },
    typicalCauses: ['成就达成', '社会认可', '能力证明'],
    typicalActions: ['展示', '分享', '挺胸抬头'],
    bodilySignature: ['挺胸', '抬头', '微笑']
  },
  
  awe: {
    prototypeScore: 0.65,
    category: 'epistemic_emotion',
    features: {
      physiological_arousal: 0.6,      // 可能低可能高 (敬畏/恐惧)
      action_tendency: 0.4,            // 低行动倾向 (顺从/接纳)
      object_directedness: 0.8,        // 明确对象 (宏大事物)
      phenomenological_saliency: 0.85,
      cross_cultural_consistency: 0.6
    },
    typicalCauses: ['宏大场景', '超越理解', '美/力量/神圣'],
    typicalActions: ['凝视', '沉思', '顺从'],
    bodilySignature: ['起鸡皮疙瘩', '呼吸暂停', '身体静止'],
    note: '边界案例 - Fehr & Russell (1984) 列为较差的情绪例子'
  },
  
  // === 低原型情绪 / 边界案例 (prototypeScore < 0.60) ===
  boredom: {
    prototypeScore: 0.45,
    category: 'low_arousal_state',
    features: {
      physiological_arousal: 0.3,      // 低唤醒
      action_tendency: 0.4,            // 行动倾向模糊
      object_directedness: 0.3,        // 对象模糊 (情境/活动)
      phenomenological_saliency: 0.6,
      cross_cultural_consistency: 0.5
    },
    typicalCauses: ['缺乏刺激', '意义缺失', '被迫参与'],
    typicalActions: ['寻求刺激', '脱离', '时间拖延'],
    bodilySignature: ['能量低落', '注意力分散'],
    note: '边界案例 - 人们对是否属于情绪有分歧'
  },
  
  contentment: {
    prototypeScore: 0.55,
    category: 'low_arousal_positive',
    features: {
      physiological_arousal: 0.3,      // 低唤醒
      action_tendency: 0.3,            // 低行动倾向 (满足无需行动)
      object_directedness: 0.5,
      phenomenological_saliency: 0.6,
      cross_cultural_consistency: 0.6
    },
    typicalCauses: ['需求满足', '目标达成后', '和谐状态'],
    typicalActions: ['维持现状', '享受当下'],
    bodilySignature: ['放松', '平静呼吸', '肌肉松弛']
  },
  
  nostalgia: {
    prototypeScore: 0.52,
    category: 'temporal_emotion',
    features: {
      physiological_arousal: 0.5,
      action_tendency: 0.4,
      object_directedness: 0.7,        // 指向过去
      phenomenological_saliency: 0.75,
      cross_cultural_consistency: 0.5
    },
    typicalCauses: ['回忆过去', '怀旧触发物', '时间距离感'],
    typicalActions: ['回忆', '分享故事', '重访旧地'],
    bodilySignature: ['温暖感', '苦乐参半'],
    note: '复杂情绪 - 同时包含积极和消极成分'
  },
  
  // === 情绪状态 vs 情绪特质 ===
  // 以下区分情绪状态 (occurrences) 和情绪特质 (dispositions)
  hostility: {
    prototypeScore: 0.60,
    category: 'disposition',
    features: {
      physiological_arousal: 0.5,      // 持续性低 - 中唤醒
      action_tendency: 0.7,
      object_directedness: 0.8,
      phenomenological_saliency: 0.6,
      cross_cultural_consistency: 0.7
    },
    typicalCauses: ['长期不满', '反复冒犯', '价值观冲突'],
    note: '情绪特质 (disposition) 而非情绪状态 (occurrence)'
  },
  
  panic: {
    prototypeScore: 0.88,
    category: 'acute_state',
    features: {
      physiological_arousal: 1.0,      // 极高唤醒
      action_tendency: 0.95,           // 强烈逃跑冲动
      object_directedness: 0.6,        // 对象可能模糊
      phenomenological_saliency: 1.0,
      cross_cultural_consistency: 0.85
    },
    typicalCauses: ['极端威胁', '失控感', '幽闭/窒息'],
    note: '情绪状态 (occurrence) - 短期高强度'
  }
};

/**
 * 计算情绪的原型匹配度
 * 
 * @param {Object} reportedEmotion - 用户报告的情绪状态
 * @param {string} reportedEmotion.label - 情绪标签
 * @param {Object} reportedEmotion.features - 观察到的特征
 * @returns {Object} 原型匹配结果
 */
function calculatePrototypeMatch(reportedEmotion) {
  const { label, features = {} } = reportedEmotion;
  
  // 查找最接近的原型
  const prototype = emotionPrototypes[label.toLowerCase()];
  
  if (!prototype) {
    // 情绪不在原型库中，尝试模糊匹配
    return findClosestPrototype(features);
  }
  
  // 计算特征匹配度
  const featureScores = {};
  let totalMatch = 0;
  let featureCount = 0;
  
  for (const [feature, value] of Object.entries(features)) {
    if (prototype.features[feature] !== undefined) {
      // 计算该特征的匹配度 (0-1)
      const match = 1 - Math.abs(prototype.features[feature] - value);
      featureScores[feature] = match;
      totalMatch += match;
      featureCount++;
    }
  }
  
  const averageFeatureMatch = featureCount > 0 ? totalMatch / featureCount : 0;
  
  // 最终置信度 = 原型度 × 特征匹配度
  const confidence = prototype.prototypeScore * averageFeatureMatch;
  
  return {
    emotion: label,
    prototypeScore: prototype.prototypeScore,
    category: prototype.category,
    featureMatch: averageFeatureMatch,
    confidence: confidence,
    isPrototype: prototype.prototypeScore >= 0.85,
    isBorderline: prototype.prototypeScore < 0.60,
    details: prototype,
    featureBreakdown: featureScores
  };
}

/**
 * 当情绪不在原型库中时，找到最接近的原型
 */
function findClosestPrototype(features) {
  let bestMatch = null;
  let bestScore = 0;
  
  for (const [emotion, prototype] of Object.entries(emotionPrototypes)) {
    let score = 0;
    let count = 0;
    
    for (const [feature, value] of Object.entries(features)) {
      if (prototype.features[feature] !== undefined) {
        score += 1 - Math.abs(prototype.features[feature] - value);
        count++;
      }
    }
    
    const avgScore = count > 0 ? score / count : 0;
    
    if (avgScore > bestScore) {
      bestScore = avgScore;
      bestMatch = emotion;
    }
  }
  
  return {
    emotion: bestMatch,
    prototypeScore: emotionPrototypes[bestMatch]?.prototypeScore || 0,
    confidence: bestScore,
    note: '基于特征相似度的模糊匹配'
  };
}

/**
 * 评估情绪识别的置信度
 * 
 * 置信度 = 原型匹配度 × 成分完整性 × 报告一致性
 */
function assessEmotionConfidence(emotionReport, componentAnalysis) {
  const prototypeMatch = calculatePrototypeMatch(emotionReport);
  
  // 成分完整性评估
  const componentCompleteness = componentAnalysis ? 
    Object.keys(componentAnalysis).length / 6 : // 6 种成分
    0.5; // 默认中等完整性
  
  // 报告一致性 (自我报告 vs 观察指标)
  const consistencyScore = calculateConsistency(emotionReport, componentAnalysis);
  
  // 最终置信度
  const finalConfidence = 
    prototypeMatch.confidence * 0.5 +
    componentCompleteness * 0.3 +
    consistencyScore * 0.2;
  
  return {
    overallConfidence: finalConfidence,
    breakdown: {
      prototypeMatch: prototypeMatch.confidence,
      componentCompleteness: componentCompleteness,
      consistency: consistencyScore
    },
    isHighConfidence: finalConfidence >= 0.7,
    isLowConfidence: finalConfidence < 0.4,
    recommendation: getConfidenceRecommendation(finalConfidence, prototypeMatch)
  };
}

/**
 * 计算自我报告与观察指标的一致性
 */
function calculateConsistency(report, components) {
  if (!components) return 0.5;
  
  let consistency = 0;
  let checks = 0;
  
  // 检查生理唤醒一致性
  if (report.features?.physiological_arousal !== undefined && components.physiological) {
    const expectedArousal = mapPhysiologicalToArousal(components.physiological);
    consistency += 1 - Math.abs(report.features.physiological_arousal - expectedArousal);
    checks++;
  }
  
  // 检查行动倾向一致性
  if (report.features?.action_tendency !== undefined && components.behavioral) {
    const expectedAction = mapBehavioralToAction(components.behavioral);
    consistency += 1 - Math.abs(report.features.action_tendency - expectedAction);
    checks++;
  }
  
  return checks > 0 ? consistency / checks : 0.5;
}

function mapPhysiologicalToArousal(physiological) {
  // 简化映射：高生理反应 = 高唤醒
  const highArousalMarkers = ['心跳加速', '呼吸急促', '肌肉紧张', '出汗'];
  const hasHighArousal = physiological.some(marker => 
    highArousalMarkers.some(h => marker.includes(h))
  );
  return hasHighArousal ? 0.8 : 0.3;
}

function mapBehavioralToAction(behavioral) {
  // 简化映射：强烈行为 = 高行动倾向
  const highActionMarkers = ['逃跑', '攻击', '大喊', '哭泣'];
  const hasHighAction = behavioral.some(marker =>
    highActionMarkers.some(h => marker.includes(h))
  );
  return hasHighAction ? 0.8 : 0.3;
}

/**
 * 根据置信度给出建议
 */
function getConfidenceRecommendation(confidence, prototypeMatch) {
  if (confidence >= 0.8) {
    return {
      level: 'high',
      action: 'proceed',
      message: '情绪识别置信度高，可以基于此进行干预'
    };
  } else if (confidence >= 0.5) {
    return {
      level: 'medium',
      action: 'verify',
      message: `情绪识别置信度中等。${prototypeMatch.isBorderline ? 
        `「${prototypeMatch.emotion}」是边界案例，建议进一步澄清` : 
        '建议通过进一步提问验证'}`
    };
  } else {
    return {
      level: 'low',
      action: 'explore',
      message: '情绪识别置信度低，建议探索式提问或重新评估'
    };
  }
}

/**
 * 获取情绪的原型信息
 */
function getEmotionPrototype(emotionName) {
  return emotionPrototypes[emotionName.toLowerCase()] || null;
}

/**
 * 获取所有高原型情绪 (可作为情绪识别的"锚点")
 */
function getHighPrototypeEmotions() {
  return Object.entries(emotionPrototypes)
    .filter(([_, proto]) => proto.prototypeScore >= 0.85)
    .map(([name, proto]) => ({ name, ...proto }));
}

/**
 * 获取边界案例情绪 (需要特别处理)
 */
function getBorderlineEmotions() {
  return Object.entries(emotionPrototypes)
    .filter(([_, proto]) => proto.prototypeScore < 0.60)
    .map(([name, proto]) => ({ name, ...proto }));
}

module.exports = {
  emotionPrototypes,
  calculatePrototypeMatch,
  assessEmotionConfidence,
  getEmotionPrototype,
  getHighPrototypeEmotions,
  getBorderlineEmotions,
  findClosestPrototype
};
