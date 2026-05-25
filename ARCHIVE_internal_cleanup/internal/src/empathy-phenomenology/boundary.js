/**
 * 共情边界检测模块 (Empathy Boundary Detection Module)
 * v3.26.0 新增
 * 
 * 基于现象学和临床心理学研究：
 * - 共情疲劳 (Empathy Fatigue) 研究
 * - 替代性创伤 (Vicarious Trauma) 理论
 * - 自我关怀 (Self-Compassion) 理论
 * 
 * 核心理念：
 * - 共情需要清晰的自我 - 他者边界
 * - 过度认同导致共情疲劳和替代性创伤
 * - 自我关怀是可持续共情的基础
 */

// ============ 共情边界预警信号 ============

const boundaryWarnings = {
  // 过度认同 (Over-Identification)
  overIdentification: {
    description: '失去自我 - 他者区分，把他者的痛苦当作自己的痛苦',
    signals: [
      'TA 的痛苦就是我的痛苦',
      '我必须帮 TA 解决所有问题',
      '我无法承受 TA 的痛苦',
      '我和 TA 一样难受',
      'TA 的事就是我的事',
      '我不能让 TA 失望',
      '我要对 TA 的情绪负责'
    ],
    intervention: '重建自我 - 他者边界：TA 的情绪属于 TA，你的情绪属于你。你可以关心，但不必承担。',
    risk: '高'
  },
  
  // 共情疲劳 (Empathy Fatigue)
  empathyFatigue: {
    description: '长期承载他人情绪导致的身心耗竭',
    signals: [
      '我感到精疲力尽',
      '我不想再听任何人倾诉',
      '我对别人的痛苦麻木了',
      '我没有更多可以给予的了',
      '我开始逃避他人的情绪',
      '我感到空虚和耗尽',
      '我照顾不了任何人了'
    ],
    intervention: '共情自我关怀：先照顾好自己的情绪容器。空杯子无法倒水给他人。',
    risk: '高'
  },
  
  // 替代性创伤 (Vicarious Trauma)
  vicariousTrauma: {
    description: '通过共情接触他人的创伤而受到的间接创伤',
    signals: [
      '我开始做噩梦',
      '我对世界失去信心',
      '我感到持续的焦虑和恐惧',
      '我无法摆脱 TA 的故事',
      '我开始过度警惕',
      '我的世界观被颠覆了',
      '我感到深深的无力和绝望'
    ],
    intervention: '立即寻求专业支持，减少创伤暴露，加强自我照顾和同侪支持。',
    risk: '极高'
  },
  
  // 拯救者情结 (Savior Complex)
  saviorComplex: {
    description: '过度承担拯救他者的责任，忽视他者的能动性',
    signals: [
      '只有我能帮 TA',
      '如果我不帮 TA，TA 就完了',
      '我必须拯救 TA',
      'TA 没有我不行',
      '我不能让 TA 失败',
      '我要为 TA 的人生负责'
    ],
    intervention: '尊重他者的能动性：TA 有能力为自己的生活负责。你的角色是陪伴，不是拯救。',
    risk: '中高'
  },
  
  // 边界模糊 (Boundary Blurring)
  boundaryBlurring: {
    description: '自我和他者的边界变得模糊不清',
    signals: [
      '我不知道哪些是我的感受，哪些是 TA 的',
      '我分不清这是谁的情绪',
      '我感觉和 TA 融为一体了',
      'TA 的情绪就是我的情绪',
      '我失去了自己的中心'
    ],
    intervention: '练习 grounding 技术，重新连接自己的身体和感受，明确区分"我的"和"TA 的"。',
    risk: '中'
  }
};

// ============ 边界健康指标 ============

const healthyBoundaryIndicators = {
  // 清晰的自我感
  clearSelfSense: {
    markers: ['我感到', '我需要', '我的界限', '我选择'],
    description: '能够清晰识别和表达自己的感受、需求和界限'
  },
  
  // 尊重他者差异
  respectForDifference: {
    markers: ['TA 可能', '对 TA 来说', 'TA 的选择', 'TA 的感受'],
    description: '承认并尊重他者是与自己不同的独立个体'
  },
  
  // 适度的情绪距离
  appropriateDistance: {
    markers: ['我理解', '我陪伴', '我支持', '但不'],
    description: '能够共情但不被淹没，保持适度的情绪距离'
  },
  
  // 自我关怀能力
  selfCompassion: {
    markers: ['我需要休息', '我照顾自己', '我允许', '我接纳'],
    description: '能够识别自己的需求并给予自己关怀'
  }
};

// ============ 边界检测函数 ============

/**
 * 检测共情边界状态
 * @param {string} userInput - 用户输入
 * @returns {object} 边界检测结果
 */
function detectEmpathyBoundaries(userInput) {
  const lowerInput = userInput.toLowerCase();
  
  const warnings = [];
  const healthyIndicators = [];
  
  // 检测预警信号
  for (const [type, config] of Object.entries(boundaryWarnings)) {
    const matchCount = config.signals.reduce((count, signal) => 
      lowerInput.includes(signal.toLowerCase()) ? count + 1 : count, 0);
    
    if (matchCount > 0) {
      warnings.push({
        type,
        matchCount,
        description: config.description,
        intervention: config.intervention,
        risk: config.risk,
        matchedSignals: config.signals.filter(signal => 
          lowerInput.includes(signal.toLowerCase()))
      });
    }
  }
  
  // 检测健康指标
  for (const [type, config] of Object.entries(healthyBoundaryIndicators)) {
    const matchCount = config.markers.reduce((count, marker) => 
      lowerInput.includes(marker.toLowerCase()) ? count + 1 : count, 0);
    
    if (matchCount > 0) {
      healthyIndicators.push({
        type,
        matchCount,
        description: config.description
      });
    }
  }
  
  // 按匹配数排序
  warnings.sort((a, b) => b.matchCount - a.matchCount);
  healthyIndicators.sort((a, b) => b.matchCount - a.matchCount);
  
  // 评估整体边界状态
  const boundaryState = evaluateBoundaryState(warnings, healthyIndicators);
  
  return {
    warnings,
    healthyIndicators,
    boundaryState,
    hasWarning: warnings.length > 0,
    hasHealthyIndicator: healthyIndicators.length > 0
  };
}

/**
 * 评估整体边界状态
 */
function evaluateBoundaryState(warnings, healthyIndicators) {
  const warningScore = warnings.reduce((sum, w) => {
    const riskScores = { '高': 3, '中高': 2, '中': 1, '低': 0, '极高': 4 };
    return sum + (riskScores[w.risk] || 0) * w.matchCount;
  }, 0);
  
  const healthyScore = healthyIndicators.reduce((sum, h) => sum + h.matchCount, 0);
  
  const netScore = healthyScore - warningScore;
  
  let state, description, recommendations;
  
  if (netScore >= 3) {
    state = 'healthy';
    description = '健康的共情边界：能够共情他人的同时保持清晰的自我感';
    recommendations = ['继续保持自我关怀实践', '定期反思边界状态'];
  } else if (netScore >= 0) {
    state = 'mostly_healthy';
    description = '基本健康的边界，但有轻微预警信号';
    recommendations = ['注意预警信号', '加强自我关怀', '必要时寻求支持'];
  } else if (netScore >= -3) {
    state = 'at_risk';
    description = '边界状态堪忧，有明显的共情疲劳或过度认同风险';
    recommendations = ['立即减少情绪承载', '练习边界设定技术', '考虑寻求专业支持'];
  } else {
    state = 'critical';
    description = '边界严重受损，存在替代性创伤或严重共情疲劳风险';
    recommendations = ['立即寻求专业心理支持', '暂停高情绪强度的助人工作', '优先照顾自己的身心健康'];
  }
  
  return {
    state,
    netScore,
    warningScore,
    healthyScore,
    description,
    recommendations
  };
}

// ============ 边界干预建议 ============

/**
 * 生成边界干预建议
 * @param {array} warnings - 检测到的预警信号
 * @returns {object} 干预建议
 */
function generateBoundaryIntervention(warnings) {
  if (warnings.length === 0) {
    return {
      hasIntervention: false,
      reason: '未检测到明显的边界问题'
    };
  }
  
  // 选择风险最高的预警
  const riskOrder = { '极高': 4, '高': 3, '中高': 2, '中': 1, '低': 0 };
  warnings.sort((a, b) => riskOrder[b.risk] - riskOrder[a.risk]);
  
  const primaryWarning = warnings[0];
  
  const interventions = {
    type: primaryWarning.type,
    risk: primaryWarning.risk,
    description: primaryWarning.description,
    immediateIntervention: primaryWarning.intervention,
    practices: generateSpecificPractices(primaryWarning.type),
    affirmations: generateAffirmations(primaryWarning.type)
  };
  
  return {
    hasIntervention: true,
    ...interventions
  };
}

/**
 * 生成具体练习
 */
function generateSpecificPractices(warningType) {
  const practices = {
    overIdentification: [
      '边界可视化：想象你和 TA 之间有一层透明的保护膜，允许关心流过，但阻止情绪融合',
      '所有权练习：大声说"这是 TA 的情绪，不是我的"',
      '物理距离：如果可能，暂时离开情绪强烈的环境',
      '自我锚定：将注意力带回自己的身体感受，感受脚踩地面的感觉'
    ],
    
    empathyFatigue: [
      '情绪容器练习：想象你的情绪容量是一个杯子，先填满自己的杯子',
      '休息仪式：设定明确的"下班时间"，之后不再处理他人的情绪',
      '滋养活动：列出能让你恢复能量的活动，每天至少做一件',
      '同侪支持：与理解你的人分享你的感受，不要独自承担'
    ],
    
    vicariousTrauma: [
      '立即减少创伤暴露：暂时避免接触创伤性内容',
      'grounding 技术：5-4-3-2-1 感官练习（5 个看到的、4 个触摸到的...）',
      '专业支持：尽快寻求心理咨询师或创伤专家的帮助',
      '安全空间：创造一个让你感到安全和舒适的环境'
    ],
    
    saviorComplex: [
      '能动性提醒：提醒自己"TA 有能力为自己的生活负责"',
      '角色重新定义：从"拯救者"转变为"陪伴者"',
      '放手练习：允许 TA 犯错，允许 TA 经历困难',
      '自我反思：问自己"我为什么需要被需要？"'
    ],
    
    boundaryBlurring: [
      '身体扫描：从头到脚扫描身体，重新连接自己的身体感受',
      '情绪命名：区分"我感到..."和"TA 感到..."',
      '自我对话：问自己"这真的是我的感受吗？"',
      '独立活动：做一些完全属于自己的事情，强化自我感'
    ]
  };
  
  return practices[warningType] || ['寻求专业支持'];
}

/**
 * 生成肯定语句
 */
function generateAffirmations(warningType) {
  const affirmations = {
    overIdentification: [
      '我可以在关心的同时保持自己的边界',
      'TA 的情绪属于 TA，我的情绪属于我',
      '我不需要承担他人的痛苦来证明我的关心'
    ],
    
    empathyFatigue: [
      '照顾自己不是自私，而是必要的',
      '我允许自己休息和恢复',
      '我的价值不取决于我能给予多少'
    ],
    
    vicariousTrauma: [
      '我值得安全和疗愈',
      '寻求帮助是力量的表现',
      '我正在慢慢恢复，这需要时间'
    ],
    
    saviorComplex: [
      '我尊重他人的能动性',
      '陪伴比拯救更有力量',
      '我允许他人走自己的路'
    ],
    
    boundaryBlurring: [
      '我清晰地知道我是谁',
      '我的感受是真实且重要的',
      '我在连接中保持独立'
    ]
  };
  
  return affirmations[warningType] || ['我正在学习健康的共情方式'];
}

// ============ 导出 ============

module.exports = {
  boundaryWarnings,
  healthyBoundaryIndicators,
  detectEmpathyBoundaries,
  generateBoundaryIntervention,
  generateSpecificPractices,
  generateAffirmations,
  evaluateBoundaryState
};
