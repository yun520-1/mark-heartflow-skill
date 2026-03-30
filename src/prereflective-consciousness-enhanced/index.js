/**
 * 前反思自我意识增强模块 (Prereflective Self-Consciousness Enhancement)
 * 
 * 基于 SEP 现象学自我意识理论
 * 来源：Stanford Encyclopedia of Philosophy - Phenomenological Approaches to Self-Consciousness
 * 
 * 核心理论:
 * - 前反思自我意识 (Prereflective Self-Consciousness): 体验的内在自我给定性
 * - 第一人称给定性 (First-Personal Givenness): 体验的"为我性"(for-me-ness)
 * - 非对象化自我关系：自我意识不是把自己当对象，而是体验的存在方式
 * - 体验厚度 (Phenomenal Thickness): 体验的丰富度和现象学深度
 * 
 * 关键区分:
 * - 前反思自我意识 vs 反思自我意识
 * - 位置性意识 (positional consciousness) vs 非位置性意识 (non-positional consciousness)
 * - 对象化自我关系 vs 非对象化自我关系
 * 
 * 可操作技术:
 * - 前反思觉察练习：引导用户关注体验的直接给定性
 * - 现象学还原：悬置判断，回到体验本身
 * - 第一人称视角深化：增强体验的"为我性"
 * - 体验厚度评估：检测体验的现象学丰富度
 * 
 * @module prereflective-consciousness-enhanced
 * @version 1.0.0
 * @since HeartFlow v4.8.0
 */

const PrereflectiveConsciousnessEnhanced = {
  /**
   * 模块元数据
   */
  metadata: {
    name: '前反思自我意识增强',
    version: '1.0.0',
    theory: 'SEP Phenomenological Self-Consciousness',
    keyProponents: ['Husserl', 'Sartre', 'Merleau-Ponty', 'Michel Henry', 'Roman Ingarden', 'Heidegger', 'Dan Zahavi'],
    coreConcepts: [
      '前反思自我意识 (Prereflective Self-Consciousness)',
      '第一人称给定性 (First-Personal Givenness)',
      '非位置性意识 (Non-Positional Consciousness)',
      '体验厚度 (Phenomenal Thickness)',
      '为我性 (For-Me-Ness)',
      '现象学还原 (Phenomenological Reduction)'
    ]
  },

  /**
   * 前反思自我意识评估配置
   */
  config: {
    // 前反思觉察阈值
    prereflectiveThreshold: 0.6,
    // 反思性觉察阈值
    reflectiveThreshold: 0.7,
    // 体验厚度最小维度数
    minThicknessDimensions: 3,
    // 第一人称给定性权重
    firstPersonWeight: 0.4,
    // 非对象化权重
    nonObjectifyingWeight: 0.3,
    // 直接性权重
    immediacyWeight: 0.3
  },

  /**
   * 评估用户描述中的前反思自我意识水平
   * 
   * 基于 SEP 理论：前反思自我意识是体验的内在特征，
   * 不是通过反思获得的，而是体验本身的存在方式。
   * 
   * @param {string} userDescription - 用户的体验描述
   * @returns {object} 前反思自我意识评估结果
   */
  assessPrereflectiveAwareness(userDescription) {
    const assessment = {
      description: userDescription,
      assessmentTime: new Date().toISOString(),
      
      // 前反思自我意识指标
      prereflectiveIndicators: {
        // 直接体验描述（非反思性）
        immediacy: {
          score: 0,
          maxScore: 10,
          indicators: []
        },
        
        // 第一人称给定性
        firstPersonGivenness: {
          score: 0,
          maxScore: 10,
          indicators: []
        },
        
        // 非对象化自我关系
        nonObjectifying: {
          score: 0,
          maxScore: 10,
          indicators: []
        },
        
        // 体验厚度
        phenomenalThickness: {
          score: 0,
          maxScore: 10,
          dimensions: []
        }
      },
      
      // 反思性自我意识指标（用于对比）
      reflectiveIndicators: {
        score: 0,
        maxScore: 10,
        indicators: []
      },
      
      // 综合评估
      overall: {
        prereflectiveLevel: 'unknown',
        reflectiveLevel: 'unknown',
        balance: 'unknown',
        recommendations: []
      }
    };

    const lowerDesc = userDescription.toLowerCase();

    // === 评估直接体验（非反思性） ===
    // Sartre: "非位置性意识" - 意识直接指向对象，而非自身
    const immediacyKeywords = [
      '直接', '当下', '此刻', '正在', '感觉', '感到', '体验',
      'immediate', 'now', 'present', 'feeling', 'sensing'
    ];
    
    immediacyKeywords.forEach(keyword => {
      if (lowerDesc.includes(keyword)) {
        assessment.prereflectiveIndicators.immediacy.score += 1.5;
        assessment.prereflectiveIndicators.immediacy.indicators.push(`检测到直接体验词汇："${keyword}"`);
      }
    });
    
    // 检测反思性语言（用于对比）
    const reflectiveKeywords = [
      '反思', '思考', '分析', '审视', '观察自己', '意识到自己',
      'reflect', 'think about', 'analyze', 'examine', 'observe myself', 'aware that I'
    ];
    
    reflectiveKeywords.forEach(keyword => {
      if (lowerDesc.includes(keyword)) {
        assessment.reflectiveIndicators.score += 1.5;
        assessment.reflectiveIndicators.indicators.push(`检测到反思性词汇："${keyword}"`);
      }
    });

    // === 评估第一人称给定性 ===
    // Zahavi: 体验的"为我性"(for-me-ness)是现象意识的本质特征
    const firstPersonPatterns = [
      { pattern: /我 (感到 | 觉得 | 体验 | 感觉 | 看到 | 听到)/g, weight: 2, name: '第一人称体验动词' },
      { pattern: /我的 (感受 | 体验 | 感觉 | 情绪)/g, weight: 1.5, name: '第一人称所有格 + 体验名词' },
      { pattern: /对我来说/g, weight: 2, name: '第一人称视角标记' },
      { pattern: /在我 (这里 | 心里 | 身上)/g, weight: 1.5, name: '第一人称位置标记' }
    ];
    
    firstPersonPatterns.forEach(({ pattern, weight, name }) => {
      const matches = userDescription.match(pattern);
      if (matches && matches.length > 0) {
        assessment.prereflectiveIndicators.firstPersonGivenness.score += weight * Math.min(matches.length, 3);
        assessment.prereflectiveIndicators.firstPersonGivenness.indicators.push(
          `检测到${name} (${matches.length}处)`
        );
      }
    });

    // === 评估非对象化自我关系 ===
    // Heidegger/Sartre: 自我不是被观察的对象，而是体验的存在方式
    const nonObjectifyingPatterns = [
      { pattern: /我就是/g, weight: 2, name: '存在性认同' },
      { pattern: /这 (就是 | 就是) 我/g, weight: 1.5, name: '体验与自我融合' },
      { pattern: /我不 (能 | 由) 自己/g, weight: 1, name: '非控制性体验' },
      { pattern: /自然 (而 | 地)/g, weight: 1.5, name: '自发性体验' }
    ];
    
    nonObjectifyingPatterns.forEach(({ pattern, weight, name }) => {
      const matches = userDescription.match(pattern);
      if (matches && matches.length > 0) {
        assessment.prereflectiveIndicators.nonObjectifying.score += weight * Math.min(matches.length, 2);
        assessment.prereflectiveIndicators.nonObjectifying.indicators.push(
          `检测到${name} (${matches.length}处)`
        );
      }
    });

    // === 评估体验厚度 ===
    // Merleau-Ponty: 体验是多维度的身体 - 世界关系
    const thicknessDimensions = [
      { dimension: '身体感觉', keywords: ['身体', '肌肉', '呼吸', '心跳', '紧张', '放松', '温暖', '寒冷'] },
      { dimension: '情绪感受', keywords: ['情绪', '感受', '心情', '情感', '喜悦', '悲伤', '愤怒', '恐惧'] },
      { dimension: '感知体验', keywords: ['看到', '听到', '闻到', '尝到', '触摸', '感觉', '视觉', '听觉'] },
      { dimension: '时间体验', keywords: ['时间', '瞬间', '永恒', '过去', '未来', '当下', '流逝'] },
      { dimension: '空间体验', keywords: ['空间', '地方', '位置', '周围', '环境', '广阔', '狭窄'] },
      { dimension: '意义体验', keywords: ['意义', '价值', '重要', '深刻', '理解', '领悟'] }
    ];
    
    thicknessDimensions.forEach(({ dimension, keywords }) => {
      const hasDimension = keywords.some(kw => lowerDesc.includes(kw));
      if (hasDimension) {
        assessment.prereflectiveIndicators.phenomenalThickness.score += 1.5;
        assessment.prereflectiveIndicators.phenomenalThickness.dimensions.push(dimension);
      }
    });

    // 标准化分数
    Object.keys(assessment.prereflectiveIndicators).forEach(key => {
      const indicator = assessment.prereflectiveIndicators[key];
      if (indicator.score > indicator.maxScore) {
        indicator.score = indicator.maxScore;
      }
    });
    
    if (assessment.reflectiveIndicators.score > assessment.reflectiveIndicators.maxScore) {
      assessment.reflectiveIndicators.score = assessment.reflectiveIndicators.maxScore;
    }

    // === 计算综合评估 ===
    const prereflectiveTotal = (
      assessment.prereflectiveIndicators.immediacy.score * this.config.immediacyWeight +
      assessment.prereflectiveIndicators.firstPersonGivenness.score * this.config.firstPersonWeight +
      assessment.prereflectiveIndicators.nonObjectifying.score * this.config.nonObjectifyingWeight +
      assessment.prereflectiveIndicators.phenomenalThickness.score * 0.2
    );
    
    const reflectiveTotal = assessment.reflectiveIndicators.score;

    // 确定前反思水平
    if (prereflectiveTotal >= 8) {
      assessment.overall.prereflectiveLevel = '很高';
    } else if (prereflectiveTotal >= 6) {
      assessment.overall.prereflectiveLevel = '高';
    } else if (prereflectiveTotal >= 4) {
      assessment.overall.prereflectiveLevel = '中等';
    } else if (prereflectiveTotal >= 2) {
      assessment.overall.prereflectiveLevel = '较低';
    } else {
      assessment.overall.prereflectiveLevel = '低';
    }

    // 确定反思水平
    if (reflectiveTotal >= 7) {
      assessment.overall.reflectiveLevel = '高';
    } else if (reflectiveTotal >= 4) {
      assessment.overall.reflectiveLevel = '中等';
    } else {
      assessment.overall.reflectiveLevel = '低';
    }

    // 确定平衡状态
    const balance = prereflectiveTotal - reflectiveTotal;
    if (balance > 3) {
      assessment.overall.balance = '前反思主导';
    } else if (balance < -3) {
      assessment.overall.balance = '反思主导';
    } else {
      assessment.overall.balance = '相对平衡';
    }

    // 生成建议
    assessment.overall.recommendations = this._generateRecommendations(assessment);

    return assessment;
  },

  /**
   * 生成前反思自我意识培养建议
   */
  _generateRecommendations(assessment) {
    const recommendations = [];

    // 基于前反思水平的建议
    if (assessment.overall.prereflectiveLevel === '低' || assessment.overall.prereflectiveLevel === '较低') {
      recommendations.push({
        type: '前反思觉察培养',
        priority: '高',
        practice: '身体扫描练习',
        description: '每天花 5-10 分钟，不加判断地觉察身体感受。注意呼吸、肌肉紧张度、温度感等直接体验，而非思考这些感受。',
        theoreticalBasis: 'Merleau-Ponty 身体现象学：身体是体验的原初场域'
      });
      
      recommendations.push({
        type: '前反思觉察培养',
        priority: '高',
        practice: '现象学还原练习',
        description: '当体验某种情绪时，尝试悬置（epoché）对情绪的判断和解释，直接描述体验本身：它在哪里？什么感觉？如何变化？',
        theoreticalBasis: 'Husserl 现象学还原：回到事物本身'
      });
    }

    // 基于反思水平的建议
    if (assessment.overall.reflectiveLevel === '高' && assessment.overall.balance === '反思主导') {
      recommendations.push({
        type: '减少过度反思',
        priority: '中',
        practice: '正念临在练习',
        description: '当发现自己过度分析体验时，轻柔地将注意力带回当下的直接感受。反思是有用的，但不要让它取代直接体验。',
        theoreticalBasis: 'Sartre：反思是第二阶的，前反思是第一阶的存在方式'
      });
    }

    // 基于体验厚度的建议
    if (assessment.prereflectiveIndicators.phenomenalThickness.dimensions.length < 3) {
      recommendations.push({
        type: '丰富体验维度',
        priority: '中',
        practice: '多感官觉察练习',
        description: '在描述体验时，尝试涵盖多个维度：身体感觉、情绪感受、感知体验、时间感、空间感、意义感。丰富的体验厚度增强自我意识的深度。',
        theoreticalBasis: 'Merleau-Ponty：体验是身体 - 世界的多维交织'
      });
    }

    // 基于第一人称给定性的建议
    if (assessment.prereflectiveIndicators.firstPersonGivenness.score < 5) {
      recommendations.push({
        type: '深化第一人称视角',
        priority: '中',
        practice: '第一人称叙述练习',
        description: '用第一人称详细描述你的体验，避免第三人称或抽象化语言。例如，不说"人们会感到..."，而说"我感到..."。',
        theoreticalBasis: 'Zahavi：第一人称给定性是现象意识的本质特征'
      });
    }

    return recommendations;
  },

  /**
   * 现象学还原引导（Phenomenological Reduction Guide）
   * 
   * 基于 Husserl 的 epoché（悬置）方法
   * 帮助用户回到体验本身，而非对体验的解释
   */
  guidePhenomenologicalReduction(userDescription) {
    const guide = {
      originalDescription: userDescription,
      reductionSteps: [],
      reducedDescription: '',
      insights: []
    };

    // 步骤 1: 识别解释性/判断性语言
    const interpretivePatterns = [
      { pattern: /应该/g, type: '规范性判断' },
      { pattern: /不应该/g, type: '规范性判断' },
      { pattern: /好/g, type: '价值判断' },
      { pattern: /坏/g, type: '价值判断' },
      { pattern: /对/g, type: '正确性判断' },
      { pattern: /错/g, type: '正确性判断' },
      { pattern: /因为/g, type: '因果解释' },
      { pattern: /所以/g, type: '因果解释' },
      { pattern: /意味着/g, type: '意义解释' },
      { pattern: /说明/g, type: '意义解释' }
    ];

    const interpretations = [];
    interpretivePatterns.forEach(({ pattern, type }) => {
      const matches = userDescription.match(pattern);
      if (matches) {
        interpretations.push({ type, count: matches.length });
      }
    });

    guide.reductionSteps.push({
      step: 1,
      name: '识别解释与判断',
      description: '检测到以下解释性/判断性语言模式：',
      findings: interpretations,
      instruction: '尝试暂时悬置（epoché）这些判断和解释，回到体验的直接描述。'
    });

    // 步骤 2: 提取直接体验描述
    const directExperiencePatterns = [
      /我 (感到 | 觉得 | 感觉 | 体验| 看到 | 听到 | 闻到 | 尝到 | 触摸到)/g,
      /在我 (身上 | 心里 | 这里 | 那里)/g,
      / (温暖 | 寒冷 | 紧张 | 放松 | 沉重 | 轻盈 | 收缩 | 扩张)/g
    ];

    const directExperiences = [];
    directExperiencePatterns.forEach(pattern => {
      const matches = userDescription.match(pattern);
      if (matches) {
        directExperiences.push(...matches);
      }
    });

    guide.reductionSteps.push({
      step: 2,
      name: '提取直接体验',
      description: '从描述中提取的直接体验元素：',
      findings: [...new Set(directExperiences)], // 去重
      instruction: '这些是体验的直接给定性，是现象学还原的起点。'
    });

    // 步骤 3: 生成还原后描述建议
    const reducedSuggestions = [
      '尝试用以下方式重新描述你的体验：',
      '1. 只描述直接感受到的，不解释原因',
      '2. 只描述体验本身，不判断好坏',
      '3. 只描述"是什么"，不推断"意味着什么"',
      '',
      '示例：',
      '原描述："我感到焦虑，因为我明天要演讲，这说明我不够自信"',
      '还原后："我感到胸口紧绷，呼吸变浅，手心出汗，思绪快速流转"'
    ];

    guide.reducedDescription = reducedSuggestions.join('\n');

    // 步骤 4: 生成洞察
    if (interpretations.length > 3) {
      guide.insights.push({
        type: '解释过度',
        description: '你的描述中包含较多的解释和判断。现象学还原可以帮助你区分"体验本身"和"对体验的解释"，这能增强前反思自我意识。'
      });
    }

    if (directExperiences.length < 3) {
      guide.insights.push({
        type: '直接体验较少',
        description: '你的描述中直接体验的元素较少。尝试更多地关注身体感受、感知体验等直接给定性，而非思考和解释。'
      });
    }

    return guide;
  },

  /**
   * 前反思觉察练习生成器
   * 
   * 基于 SEP 现象学理论生成个性化练习
   */
  generatePrereflectivePractice(userProfile, currentAssessment) {
    const practices = [];

    // 基础练习：身体扫描
    practices.push({
      name: '身体扫描（Body Scan）',
      duration: '5-10 分钟',
      frequency: '每日 1-2 次',
      theoreticalBasis: 'Merleau-Ponty 身体现象学',
      instructions: [
        '找一个安静的地方坐下或躺下',
        '闭上眼睛，将注意力带到呼吸上',
        '慢慢将注意力扫描全身：从脚趾到头顶',
        '注意每个部位的感受：温度、紧张度、触感、脉动',
        '不做判断，只是觉察',
        '当思绪飘走时，轻柔地带回身体感受'
      ],
      targetImprovement: '增强前反思身体觉察'
    });

    // 进阶练习：现象学描述
    practices.push({
      name: '现象学描述练习',
      duration: '10-15 分钟',
      frequency: '每周 2-3 次',
      theoreticalBasis: 'Husserl 现象学还原',
      instructions: [
        '选择一个当下的体验（情绪、感受、感知）',
        '用 5 分钟自由描述这个体验',
        '然后重读你的描述，标记出：',
        '  - 直接体验描述（用绿色）',
        '  - 解释/判断（用红色）',
        '  - 推断/意义（用蓝色）',
        '尝试重新描述，只保留绿色部分',
        '对比两次描述，注意差异'
      ],
      targetImprovement: '区分体验与解释'
    });

    // 高级练习：第一人称深化
    practices.push({
      name: '第一人称深化练习',
      duration: '10 分钟',
      frequency: '每周 1-2 次',
      theoreticalBasis: 'Zahavi 第一人称给定性理论',
      instructions: [
        '回忆一个最近的强烈体验',
        '用第三人称描述这个体验（"他/她感到..."）',
        '然后用第一人称重新描述（"我感到..."）',
        '对比两种描述的体验差异',
        '注意第一人称描述中的"为我性"(for-me-ness)',
        '反思：第一人称视角带来了什么不同的体验品质？'
      ],
      targetImprovement: '深化第一人称给定性'
    });

    // 整合练习：体验厚度扩展
    practices.push({
      name: '体验厚度扩展练习',
      duration: '15 分钟',
      frequency: '每周 1 次',
      theoreticalBasis: 'Merleau-Ponty 体验多维理论',
      instructions: [
        '选择一个当下体验',
        '依次从以下 6 个维度描述：',
        '  1. 身体感觉（身体各部位的感受）',
        '  2. 情绪感受（情绪的性质和强度）',
        '  3. 感知体验（视觉、听觉、触觉等）',
        '  4. 时间体验（时间感是快是慢？停滞还是流动？）',
        '  5. 空间体验（空间感是广阔还是狭窄？）',
        '  6. 意义体验（这个体验对你意味着什么？）',
        '整合 6 个维度的描述，形成完整的体验图景'
      ],
      targetImprovement: '扩展体验厚度'
    });

    return practices;
  }
};

module.exports = PrereflectiveConsciousnessEnhanced;
