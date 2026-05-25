/**
 * 观点采择引导模块 (Perspective-Taking Guide Module)
 * v3.26.0 新增
 * 
 * 基于现象学共情理论：
 * - Husserl: 想象性变体 (imaginative variation)
 * - Scheler: 共情作为直接感知
 * - 现代心理理论 (Theory of Mind) 研究
 * 
 * 核心理念：
 * - 共情需要想象性地进入他者的体验世界
 * - 但必须保持自我 - 他者的区分
 * - 共情是探索性的，不是确定性的
 */

// ============ 观点采择提示库 ============

const perspectivePrompts = {
  // 想象性投射 (Imaginative Projection)
  imaginativeProjection: {
    description: '引导用户想象性地进入他者的体验世界',
    prompts: [
      '想象一下，如果你处在 TA 的位置，每天早上醒来会是什么样的感受？',
      '试着描述一下：从 TA 的眼睛看出去，这个世界是什么颜色的？',
      '如果 TA 的内心世界像一间屋子，你觉得这间屋子现在是什么样子？',
      '想象你带着 TA 的身体、TA 的记忆、TA 的经历生活一天，会是什么体验？',
      'TA 最害怕的是什么？最渴望的是什么？'
    ],
    checks: [
      '这是基于你对 TA 的了解，还是你自己的想象？',
      '你是否有机会验证你的想象是否准确？'
    ]
  },
  
  // 认知理解 (Cognitive Understanding)
  cognitiveUnderstanding: {
    description: '理解他者行为背后的信念、欲望和意图',
    prompts: [
      'TA 的行为背后可能有什么样的需求或恐惧？',
      'TA 的成长经历如何塑造了 TA 看待世界的方式？',
      '在 TA 的价值观体系里，什么是最重要的？',
      'TA 可能持有怎样的信念，使得 TA 的行为在 TA 看来是合理的？',
      '如果站在 TA 的立场，这件事的"对错"可能是什么？'
    ],
    checks: [
      '你是否在用自己的价值观评判 TA？',
      '你是否承认 TA 可能有与你完全不同的合理视角？'
    ]
  },
  
  // 情感理解 (Affective Understanding)
  affectiveUnderstanding: {
    description: '理解他者的情绪体验及其意义',
    prompts: [
      'TA 现在最强烈的情绪是什么？这种情绪想告诉 TA 什么？',
      '这种情绪在 TA 的身体里可能是什么感觉？',
      'TA 的情绪背后，隐藏着什么样的需求或期待？',
      '如果 TA 的情绪会说话，它会说什么？',
      '这种情绪对 TA 来说意味着什么？'
    ],
    checks: [
      '你能否感受 TA 的情绪，同时不被它淹没？',
      '你是否尊重 TA 的情绪体验，即使你觉得它"不合理"？'
    ]
  },
  
  // 背景理解 (Contextual Understanding)
  contextualUnderstanding: {
    description: '理解他者所处的社会、文化和历史背景',
    prompts: [
      'TA 成长在什么样的家庭环境中？这如何影响 TA？',
      'TA 所处的文化背景如何塑造 TA 的价值观？',
      'TA 现在面临什么样的外部压力或限制？',
      'TA 的社会身份（性别、职业、阶层等）如何影响 TA 的体验？',
      '在 TA 的人生故事中，这件事处于什么位置？'
    ],
    checks: [
      '你是否考虑了 TA 的背景与你的背景的差异？',
      '你是否避免了刻板印象和过度概括？'
    ]
  }
};

// ============ 自我 - 他者区分检查 ============

const selfOtherDistinctionChecks = {
  // 投射检测 (Projection Detection)
  projectionDetection: {
    description: '检测用户是否将自己的感受/想法投射到他者身上',
    questions: [
      '你确定这是 TA 的感受，还是你自己的感受？',
      '如果换一个人处在 TA 的位置，TA 的感受会和你一样吗？',
      '你是否问过 TA 的真实感受，还是你在替 TA 感受？',
      '你的想象是基于 TA 的表达，还是你自己的经验？'
    ],
    warnings: [
      '注意：你可能在把自己的感受投射到 TA 身上',
      '记住：TA 是独立的个体，可能有与你完全不同的体验',
      '共情需要悬置自己的预设，保持对他者差异的好奇'
    ]
  },
  
  // 边界检测 (Boundary Detection)
  boundaryDetection: {
    description: '检测自我 - 他者边界是否清晰',
    questions: [
      '你能否区分"TA 的痛苦"和"你对 TA 痛苦的回应"？',
      '你是否感到需要对 TA 的情绪负责？',
      '你能否在感受 TA 的同时，保持自己的中心？',
      '如果 TA 的情绪强度是 10 分，你的情绪强度是多少分？'
    ],
    warnings: [
      '注意：你可能过度认同 TA，失去了自我边界',
      '记住：你可以关心 TA，但不必承担 TA 的全部痛苦',
      '健康的共情需要清晰的自我 - 他者区分'
    ]
  },
  
  // 好奇 vs 假设 (Curiosity vs Assumption)
  curiosityCheck: {
    description: '检测用户是保持好奇还是陷入假设',
    questions: [
      '你对 TA 的体验还有多少不知道的地方？',
      '你是否愿意承认你可能完全误解了 TA？',
      '如果 TA 在这里，TA 会如何纠正你的理解？',
      '你对 TA 的好奇心是否超过了你的确定性？'
    ],
    warnings: [
      '注意：你可能过早地对 TA 下了结论',
      '记住：真正的共情保持开放和好奇，而非确定',
      '他者永远是神秘的，不可能被完全理解'
    ]
  }
};

// ============ 观点采择引导流程 ============

/**
 * 引导观点采择
 * @param {string} targetPerson - 他者描述
 * @param {string} situation - 情境描述
 * @param {object} context - 额外情境信息
 * @returns {object} 观点采择引导结果
 */
function guidePerspectiveTaking(targetPerson, situation, context = {}) {
  const guidance = {
    imaginativeProjection: null,
    cognitiveUnderstanding: null,
    affectiveUnderstanding: null,
    contextualUnderstanding: null,
    selfOtherChecks: [],
    phenomenologicalInsight: null
  };
  
  // 1. 想象性投射引导
  guidance.imaginativeProjection = {
    description: perspectivePrompts.imaginativeProjection.description,
    prompt: selectBestPrompt(perspectivePrompts.imaginativeProjection.prompts, context),
    check: perspectivePrompts.imaginativeProjection.checks[0]
  };
  
  // 2. 认知理解引导
  guidance.cognitiveUnderstanding = {
    description: perspectivePrompts.cognitiveUnderstanding.description,
    prompt: selectBestPrompt(perspectivePrompts.cognitiveUnderstanding.prompts, context),
    check: perspectivePrompts.cognitiveUnderstanding.checks[1]
  };
  
  // 3. 情感理解引导
  guidance.affectiveUnderstanding = {
    description: perspectivePrompts.affectiveUnderstanding.description,
    prompt: selectBestPrompt(perspectivePrompts.affectiveUnderstanding.prompts, context),
    check: perspectivePrompts.affectiveUnderstanding.checks[0]
  };
  
  // 4. 背景理解引导
  guidance.contextualUnderstanding = {
    description: perspectivePrompts.contextualUnderstanding.description,
    prompt: selectBestPrompt(perspectivePrompts.contextualUnderstanding.prompts, context),
    check: perspectivePrompts.contextualUnderstanding.checks[0]
  };
  
  // 5. 自我 - 他者区分检查
  guidance.selfOtherChecks = [
    selfOtherDistinctionChecks.projectionDetection.questions[0],
    selfOtherDistinctionChecks.boundaryDetection.questions[2],
    selfOtherDistinctionChecks.curiosityCheck.questions[3]
  ];
  
  // 6. 现象学洞见
  guidance.phenomenologicalInsight = generatePhenomenologicalInsight();
  
  return guidance;
}

/**
 * 根据情境选择最佳提示
 */
function selectBestPrompt(prompts, context) {
  // 简化版本：随机选择一个提示
  // 在实际实现中，可以根据 context 智能选择
  const index = Math.floor(Math.random() * prompts.length);
  return prompts[index];
}

/**
 * 生成现象学洞见
 */
function generatePhenomenologicalInsight() {
  const insights = [
    {
      title: '他者的神秘性',
      content: '他者永远不可能被完全理解。真正的共情不是"我懂你"，而是"我愿意陪伴你探索你的体验"。保持对他者差异的敬畏和好奇。'
    },
    {
      title: '悬置判断',
      content: '现象学共情要求我们悬置自己的预设和判断，如实地让他者的体验显现。这需要练习和勇气。'
    },
    {
      title: '身体作为理解的媒介',
      content: '我们通过自己的身体理解他者。当你看到他人痛苦时，你的身体也会产生微妙的共鸣。这是共情的生物学基础。'
    },
    {
      title: '共情的伦理维度',
      content: '共情不仅是认知能力，也是伦理姿态。选择去共情，就是选择承认他者的重要性，选择承担责任。'
    },
    {
      title: '自我 - 他者的辩证关系',
      content: '共情需要同时保持连接和区分：太近会失去自我，太远无法理解。这是一种需要不断调节的动态平衡。'
    }
  ];
  
  const index = Math.floor(Math.random() * insights.length);
  return insights[index];
}

// ============ 观点采择质量评估 ============

/**
 * 评估观点采择的质量
 * @param {string} userInput - 用户描述的他者体验
 * @returns {object} 质量评估结果
 */
function assessPerspectiveTakingQuality(userInput) {
  const lowerInput = userInput.toLowerCase();
  
  const qualityIndicators = {
    // 高质量指标
    highQuality: {
      markers: ['可能', '也许', '我猜', '我不确定', 'TA 说', 'TA 觉得'],
      description: '承认不确定性，基于他者表达，保持谦逊'
    },
    
    // 低质量指标
    lowQuality: {
      markers: ['TA 就是', 'TA 肯定', 'TA 一定', '我知道 TA', 'TA 总是'],
      description: '过度确定，替代表达，可能包含投射'
    }
  };
  
  const highQualityScore = highQuality.markers.reduce((score, marker) => 
    lowerInput.includes(marker) ? score + 1 : score, 0);
  
  const lowQualityScore = lowQuality.markers.reduce((score, marker) => 
    lowerInput.includes(marker) ? score + 1 : score, 0);
  
  let quality;
  if (highQualityScore > lowQualityScore) {
    quality = 'high';
  } else if (lowQualityScore > highQualityScore) {
    quality = 'low';
  } else {
    quality = 'mixed';
  }
  
  return {
    quality,
    highQualityScore,
    lowQualityScore,
    description: quality === 'high' 
      ? highQuality.description 
      : quality === 'low' 
        ? lowQuality.description 
        : '混合质量，既有开放性也有确定性断言'
  };
}

// ============ 导出 ============

module.exports = {
  perspectivePrompts,
  selfOtherDistinctionChecks,
  guidePerspectiveTaking,
  assessPerspectiveTakingQuality,
  generatePhenomenologicalInsight,
  selectBestPrompt
};
