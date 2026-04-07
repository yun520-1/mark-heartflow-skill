/**
 * 情感共鸣分析模块 (Affective Resonance Module)
 * v3.26.0 新增
 * 
 * 基于现象学共情理论：
 * - Scheler (1912): 情绪感染与真正共情的区分
 * - Walther (1923): 共享体验的层次模型
 * - 现代神经科学：镜像神经元与具身模拟
 * 
 * 核心理念：
 * - 共情始于身体层面的前反思共鸣
 * - 情绪感染是自动的、无意识的
 * - 真正的共情需要自我 - 他人区分
 */

// ============ 情感共鸣模式库 ============

const resonancePatterns = {
  // 情绪感染 (Emotional Contagion)
  emotionalContagion: {
    keywords: [
      '我也感到', '我能感受到', '我也有类似经历', '我懂那种感觉',
      '我也是', '我理解', '我体会过', '我能想象'
    ],
    description: '自动的情绪共鸣，前反思的情感连接'
  },
  
  // 身体共鸣 (Bodily Resonance)
  bodilyResonance: {
    keywords: [
      '心里一紧', '胸口发闷', '身体放松', '心跳加速',
      '喉咙哽咽', '手心出汗', '肩膀紧绷', '胃部不适',
      '呼吸急促', '肌肉放松', '身体颤抖', '眼眶湿润'
    ],
    description: '身体层面的情绪模拟，具身共情的基础'
  },
  
  // 自动镜像 (Automatic Mirroring)
  automaticMirroring: {
    keywords: [
      '不自觉地', '本能地', '第一反应是', '自然而然地',
      '忍不住', '控制不住', '下意识地'
    ],
    description: '无意识的行为/情绪模仿'
  },
  
  // 情感匹配 (Affective Matching)
  affectiveMatching: {
    keywords: [
      '难过', '伤心', '痛苦', '委屈', '愤怒', '焦虑',
      '害怕', '恐惧', '无助', '绝望', '孤独', '失落'
    ],
    description: '情绪词汇的直接匹配'
  }
};

// ============ 共鸣强度评估 ============

/**
 * 评估情感共鸣强度
 * @param {string} userInput - 用户输入
 * @param {object} context - 情境信息
 * @returns {object} 共鸣评估结果
 */
function assessResonanceIntensity(userInput, context = {}) {
  const lowerInput = userInput.toLowerCase();
  
  let scores = {
    emotionalContagion: 0,
    bodilyResonance: 0,
    automaticMirroring: 0,
    affectiveMatching: 0
  };
  
  // 检测情绪感染
  resonancePatterns.emotionalContagion.keywords.forEach(keyword => {
    if (lowerInput.includes(keyword.toLowerCase())) {
      scores.emotionalContagion += 1;
    }
  });
  
  // 检测身体共鸣
  resonancePatterns.bodilyResonance.keywords.forEach(keyword => {
    if (lowerInput.includes(keyword.toLowerCase())) {
      scores.bodilyResonance += 2; // 身体信号权重更高
    }
  });
  
  // 检测自动镜像
  resonancePatterns.automaticMirroring.keywords.forEach(keyword => {
    if (lowerInput.includes(keyword.toLowerCase())) {
      scores.automaticMirroring += 1;
    }
  });
  
  // 检测情感匹配
  resonancePatterns.affectiveMatching.keywords.forEach(keyword => {
    if (lowerInput.includes(keyword.toLowerCase())) {
      scores.affectiveMatching += 1;
    }
  });
  
  // 计算总分和等级
  const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
  
  let level, type;
  if (totalScore >= 6) {
    level = 'high';
    type = scores.bodilyResonance > 2 ? 'embodied_identification' : 'emotional_identification';
  } else if (totalScore >= 3) {
    level = 'medium';
    type = 'resonance';
  } else if (totalScore >= 1) {
    level = 'low';
    type = 'contagion';
  } else {
    level = 'minimal';
    type = 'cognitive_only';
  }
  
  // 提取具体的身体和情绪标记
  const bodilyMarkers = [];
  const emotionalMarkers = [];
  
  resonancePatterns.bodilyResonance.keywords.forEach(keyword => {
    if (lowerInput.includes(keyword.toLowerCase())) {
      bodilyMarkers.push(keyword);
    }
  });
  
  resonancePatterns.affectiveMatching.keywords.forEach(keyword => {
    if (lowerInput.includes(keyword.toLowerCase())) {
      emotionalMarkers.push(keyword);
    }
  });
  
  return {
    level,
    type,
    totalScore,
    subscores: scores,
    bodilyMarkers,
    emotionalMarkers,
    description: getResonanceDescription(level, type)
  };
}

/**
 * 获取共鸣类型的描述
 */
function getResonanceDescription(level, type) {
  const descriptions = {
    high_embodied_identification: '高度具身认同：身体和情绪深度卷入，可能存在边界模糊风险',
    high_emotional_identification: '高度情绪认同：情绪深度卷入，需要注意自我 - 他人区分',
    medium_resonance: '中等共鸣：有清晰的情感连接，同时保持一定的观察距离',
    low_contagion: '低度感染：轻微的情绪共鸣，主要是认知层面的理解',
    minimal_cognitive_only: '最小共鸣：主要是认知理解，情感连接较弱'
  };
  
  const key = `${level}_${type}`;
  return descriptions[key] || '共鸣状态不明确';
}

// ============ 共情类型识别 ============

const empathyTypes = {
  // 前反思共情 (Prereflective Empathy)
  prereflective: {
    markers: ['本能', '自动', '不自觉', '第一反应', '立刻感到'],
    description: '自动的、身体层面的情绪感染，发生在反思之前'
  },
  
  // 反思共情 (Reflective Empathy)
  reflective: {
    markers: ['想象', '理解', '思考', '从 TA 的角度', '可能'],
    description: '有意识的观点采择和认知理解'
  },
  
  // 交互共情 (Interactive Empathy)
  interactive: {
    markers: ['我们', '一起', '共同', '分享', '陪伴'],
    description: '双向的、关系性的共情体验'
  },
  
  // 认知共情 (Cognitive Empathy)
  cognitive: {
    markers: ['明白', '知道', '理解', '认识到', '意识到'],
    description: '理解他人的心理状态，但不一定有情感共鸣'
  },
  
  // 情感共情 (Affective Empathy)
  affective: {
    markers: ['感受', '体会', '心疼', '难过', '共鸣'],
    description: '情感层面的共鸣和分享'
  }
};

/**
 * 识别共情类型
 * @param {string} userInput - 用户输入
 * @returns {object} 共情类型分析结果
 */
function identifyEmpathyType(userInput) {
  const lowerInput = userInput.toLowerCase();
  const detectedTypes = [];
  
  for (const [type, config] of Object.entries(empathyTypes)) {
    const matchCount = config.markers.reduce((count, marker) => {
      return lowerInput.includes(marker.toLowerCase()) ? count + 1 : count;
    }, 0);
    
    if (matchCount > 0) {
      detectedTypes.push({
        type,
        matchCount,
        description: config.description
      });
    }
  }
  
  // 按匹配数排序
  detectedTypes.sort((a, b) => b.matchCount - a.matchCount);
  
  return {
    primaryType: detectedTypes[0]?.type || 'unknown',
    allTypes: detectedTypes,
    description: detectedTypes[0]?.description || '共情类型不明确'
  };
}

// ============ 共情深度评估 ============

/**
 * 评估共情深度（基于 Scheler 的层次模型）
 * @param {string} userInput - 用户输入
 * @returns {object} 共情深度评估
 */
function assessEmpathyDepth(userInput) {
  const lowerInput = userInput.toLowerCase();
  
  // Level 1: 情绪感染 (最低层次)
  const level1Markers = ['我也', '我也是', '我懂', '我能感受'];
  const level1Score = level1Markers.reduce((score, marker) => 
    lowerInput.includes(marker) ? score + 1 : score, 0);
  
  // Level 2: 共情感受 (真正理解他人的感受)
  const level2Markers = ['TA 可能', 'TA 感到', 'TA 经历', '对 TA 来说'];
  const level2Score = level2Markers.reduce((score, marker) => 
    lowerInput.includes(marker) ? score + 1 : score, 0);
  
  // Level 3: 观点采择 (认知理解)
  const level3Markers = ['从 TA 的角度', '如果我是 TA', 'TA 的立场', 'TA 的背景'];
  const level3Score = level3Markers.reduce((score, marker) => 
    lowerInput.includes(marker) ? score + 1 : score, 0);
  
  // Level 4: 交互共情 (最高层次)
  const level4Markers = ['我们一起', '陪伴', '共同面对', '支持'];
  const level4Score = level4Markers.reduce((score, marker) => 
    lowerInput.includes(marker) ? score + 1 : score, 0);
  
  const scores = {
    level1_emotionalContagion: level1Score,
    level2_empathicFeeling: level2Score,
    level3_perspectiveTaking: level3Score,
    level4_interactiveEmpathy: level4Score
  };
  
  const maxLevel = Math.max(...Object.values(scores));
  let depth;
  
  if (maxLevel === 0) {
    depth = 'cognitive_only';
  } else if (level4Score === maxLevel) {
    depth = 'interactive';
  } else if (level3Score === maxLevel) {
    depth = 'perspective_taking';
  } else if (level2Score === maxLevel) {
    depth = 'empathic_feeling';
  } else {
    depth = 'emotional_contagion';
  }
  
  return {
    depth,
    scores,
    maxLevel,
    description: getDepthDescription(depth)
  };
}

/**
 * 获取深度描述
 */
function getDepthDescription(depth) {
  const descriptions = {
    cognitive_only: '认知理解：理解他人的处境，但情感连接较弱',
    emotional_contagion: '情绪感染：自动的情绪共鸣，但可能缺乏真正的理解',
    empathic_feeling: '共情感受：真正感受到他人的情绪体验',
    perspective_taking: '观点采择：能够从他者的视角理解情境',
    interactive: '交互共情：双向的、关系性的深度共情连接'
  };
  
  return descriptions[depth] || '深度不明确';
}

// ============ 导出 ============

module.exports = {
  resonancePatterns,
  empathyTypes,
  assessResonanceIntensity,
  identifyEmpathyType,
  assessEmpathyDepth,
  getResonanceDescription,
  getDepthDescription
};
