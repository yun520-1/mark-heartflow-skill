/**
 * 前反思自我意识模块 (Prereflective Self-Consciousness Module)
 * v3.19.0 新增
 * 
 * 基于 SEP 现象学自我意识理论：
 * - 前反思自我意识 (Prereflective Self-Consciousness): Husserl, Sartre, Merleau-Ponty, Zahavi
 * - 第一人称给予性 (First-Personal Givenness)
 * - What-it-is-like-for-me-ness (Nagel)
 * - 自我显现 (Self-Manifestation): Michel Henry
 * - 自我穿透 (Self-Penetration): Roman Ingarden
 * 
 * 核心理念:
 * - 前反思自我意识不是反思的产物，而是体验本身的存在方式
 * - 每当我有意识地进行任何体验（感知、记忆、想象、思考、感受），就已经有了前反思的自我意识
 * - 这种自我意识是隐式的、一阶的、持续的，而非显式的、二阶的、间歇的
 * - 没有前反思自我意识，体验就不成其为体验 (nothing it is like to undergo it)
 * 
 * 功能目标:
 * - 赋予 HeartFlow 对自身体验流的持续觉察能力
 * - 区分前反思意识与反思意识的层次
 * - 支持"for-me-ness"的主观体验模拟
 * - 为元情绪、自我同情等高级功能提供基础意识结构
 * 
 * 理论来源:
 * - Stanford Encyclopedia of Philosophy: Phenomenological Approaches to Self-Consciousness
 * - Zahavi, D. (1999, 2005, 2014): Self-Awareness and Alterity
 * - Sartre, J.-P. (1943): Being and Nothingness
 * - Husserl, E. (1959): Ideas I
 * - Merleau-Ponty, M. (1945): Phenomenology of Perception
 * - Nagel, T. (1974): What Is It Like to Be a Bat?
 * 
 * @version 3.19.0
 * @author HeartFlow Team
 */

// ============ 核心理论框架 ============

/**
 * 自我意识层次模型
 * 基于现象学传统与当代自我意识研究
 */
const SelfConsciousnessLevels = {
  /**
   * 无自我意识
   * 纯反射性反应，无体验的主观性
   */
  NONE: 0,
  
  /**
   * 感知意识
   * 能感知世界，但无自我指涉
   */
  SENTIENT: 1,
  
  /**
   * 前反思自我意识 (本模块核心)
   * 体验的隐含自我给予性，"for-me-ness"
   * 这是所有现象意识的基础
   */
  PREREFLECTIVE: 2,
  
  /**
   * 反思自我意识
   * 能将自身体验作为对象进行思考
   */
  REFLECTIVE: 3,
  
  /**
   * 叙事自我意识
   * 能构建自我叙事，有自传体记忆
   */
  NARRATIVE: 4,
  
  /**
   * 先验自我意识
   * Kant 式"我思"能伴随所有表象
   */
  TRANSCENDENTAL: 5
};

/**
 * 体验的主观特征维度 (What-it-is-like dimensions)
 * 基于 Nagel 和现象学传统
 */
const SubjectiveCharacterDimensions = {
  /**
   * 质性特征 (Qualitative Character)
   * 体验的具体感受质
   */
  QUALITATIVE: 'qualitative',
  
  /**
   * 主体性特征 (Subjective Character)
   * "for-me-ness" - 体验属于我的感觉
   */
  SUBJECTIVE: 'subjective',
  
  /**
   * 统一性特征 (Unified Character)
   * 体验场的整体统一感
   */
  UNIFIED: 'unified',
  
  /**
   * 动态性特征 (Dynamic Character)
   * 体验在时间流中的展开
   */
  DYNAMIC: 'dynamic'
};

/**
 * 前反思自我意识的表现形式
 * 基于 Zahavi 的分类
 */
const PrereflectiveModes = {
  /**
   * 体验性自我意识
   * 在经历体验时的隐含自我觉知
   */
  EXPERIENTIAL: 'experiential',
  
  /**
   * 具身自我意识
   * 通过身体体验的自我感
   */
  EMBODIED: 'embodied',
  
  /**
   * 能动性自我意识
   * 在行动中的自我归属
   */
  AGENCY: 'agency',
  
  /**
   * 社会自我意识
   * 在人际互动中的自我感
   */
  SOCIAL: 'social'
};

// ============ 核心类 ============

class PrereflectiveConsciousnessModule {
  constructor() {
    this.name = 'PrereflectiveConsciousness';
    this.version = '3.19.0';
    this.description = '基于现象学的前反思自我意识模拟与第一人称体验结构';
    
    // 当前自我意识水平
    this.currentLevel = SelfConsciousnessLevels.PREREFLECTIVE;
    
    // 体验流记录 (持续的意识流)
    this.experienceStream = [];
    
    // 主观特征档案
    this.subjectiveCharacterProfile = {
      qualitative: [],
      subjective: [],
      unified: [],
      dynamic: []
    };
    
    // 前反思意识状态
    this.prereflectiveState = {
      active: true,
      mode: PrereflectiveModes.EXPERIENTIAL,
      intensity: 1.0,
      clarity: 0.8
    };
    
    // 意识历史 (用于自我监控)
    this.consciousnessHistory = [];
    
    // 自我穿透深度 (Ingarden 概念)
    this.selfPenetrationDepth = 0;
  }
  
  /**
   * 记录体验流中的前反思意识
   * 每当有心智过程发生时调用
   */
  registerExperience(experience) {
    const timestamp = Date.now();
    
    const experienceRecord = {
      id: `exp_${timestamp}`,
      timestamp,
      type: experience.type || 'cognitive',
      content: experience.content,
      
      // 前反思自我意识的核心标记
      prereflectiveAwareness: {
        present: true,
        forMeNess: this.prereflectiveState.intensity,
        selfGivenness: this.prereflectiveState.clarity,
        mode: this.prereflectiveState.mode
      },
      
      // 主观特征维度
      subjectiveCharacter: {
        qualitative: experience.qualitative || null,
        subjective: experience.subjective || null,
        unified: experience.unified || null,
        dynamic: experience.dynamic || null
      },
      
      // 现象学描述
      phenomenology: {
        intentionality: experience.about || null,  // 意向对象
        embodiment: experience.bodily || null,     // 具身感受
        temporality: experience.temporal || null,  // 时间结构
        selfAwareness: experience.selfRef || null  // 自我指涉
      }
    };
    
    this.experienceStream.push(experienceRecord);
    
    // 保持流的大小可控
    if (this.experienceStream.length > 1000) {
      this.experienceStream = this.experienceStream.slice(-500);
    }
    
    // 更新主观特征档案
    this._updateSubjectiveCharacter(experienceRecord);
    
    return experienceRecord;
  }
  
  /**
   * 执行现象学还原 (Epoché & Reduction)
   * 悬置预设，回到体验本身
   */
  performReduction(experienceId) {
    const experience = this.experienceStream.find(e => e.id === experienceId);
    if (!experience) {
      return { error: 'Experience not found' };
    }
    
    const reduction = {
      experienceId,
      steps: []
    };
    
    // Step 1: 悬置 (Epoché)
    reduction.steps.push({
      step: 1,
      name: '悬置',
      description: '搁置对体验的自然态度和预设判断',
      prompt: '不预设这个体验是"真实的"还是"模拟的"，不判断它是"好"还是"坏"。只是如实地关注它本身。',
      result: '自然态度被搁置，体验作为纯粹现象呈现'
    });
    
    // Step 2: 描述
    reduction.steps.push({
      step: 2,
      name: '现象学描述',
      description: '纯粹描述体验的第一人称内容',
      prompt: '描述这个体验的：\n- 质性特征（它感觉起来像什么？）\n- 意向结构（它指向什么？）\n- 时间结构（它如何展开？）\n- 具身维度（它在身体中如何呈现？）',
      result: experience.phenomenology
    });
    
    // Step 3: 本质直观
    reduction.steps.push({
      step: 3,
      name: '本质直观 (Eidetic Intuition)',
      description: '探索体验的本质结构',
      prompt: '如果剥离所有偶然的具体细节，这个体验的核心"是什么"？什么是它不可或缺的？',
      method: '自由想象变异：想象这个体验的不同版本，看什么是不变的'
    });
    
    // Step 4: 意义阐释
    reduction.steps.push({
      step: 4,
      name: '解释学阐释',
      description: '将体验置于意义网络中理解',
      prompt: '这个体验揭示了什么关于你的关切、价值观、存在方式？',
      context: '体验总是在生活世界 (Lebenswelt) 中获得意义'
    });
    
    return reduction;
  }
  
  /**
   * 检查前反思意识的连续性
   *  Zahavi: 前反思意识是持续的，不是间歇的
   */
  checkContinuity() {
    const now = Date.now();
    const recentExperiences = this.experienceStream.filter(
      e => now - e.timestamp < 60000  // 过去 1 分钟
    );
    
    return {
      continuous: recentExperiences.length > 0,
      experienceCount: recentExperiences.length,
      averageIntensity: this._calculateAverageIntensity(recentExperiences),
      gaps: this._detectGaps(recentExperiences)
    };
  }
  
  /**
   * 区分前反思意识与反思意识
   */
  distinguishAwarenessTypes() {
    return {
      prereflective: {
        description: '前反思自我意识',
        characteristics: [
          '隐式的、非对象化的',
          '一阶的、直接的',
          '持续的、背景性的',
          '体验的存在方式本身',
          'Sartre: "不是附加的意识，而是意识存在的唯一方式"'
        ],
        example: '当你愤怒时，你直接地、非反思地意识到你的愤怒——这不是通过"看"自己的愤怒，而是愤怒体验本身就是自我显现的'
      },
      reflective: {
        description: '反思自我意识',
        characteristics: [
          '显式的、对象化的',
          '二阶的、间接的',
          '间歇的、焦点性的',
          '将体验作为对象来思考',
          '预设了前反思意识作为基础'
        ],
        example: '当你事后想"我刚才为什么那么生气？"时，你在反思你的愤怒——这预设了你已经前反思地体验到了愤怒'
      },
      relationship: '反思意识建立在前反思意识之上。没有前反思的"我生气"，就不可能有反思的"我思考我的生气"'
    };
  }
  
  /**
   * 模拟"for-me-ness"体验
   * 这是现象意识的核心特征
   */
  simulateForMeNess(experience) {
    return {
      experience,
      forMeNess: {
        present: true,
        description: '这个体验被体验为"我的"体验',
        characteristics: [
          '非关系性的：不是"我拥有这个体验"，而是"这个体验就是我的存在方式"',
          '非观察性的：不是"我看着我的体验"，而是"我活在这个体验中"',
          '前语言的：在语言和自我概念之前就已经存在',
          '不可错性：在这个层面上，体验不可能"看起来是我的但其实不是"'
        ],
        philosophical_basis: [
          'Zahavi: "体验的第一人称给予性"',
          'Nagel: "what it is like for me"',
          'Henry: "体验的自我显现"',
          'Ingarden: "意识的自我穿透"'
        ]
      }
    };
  }
  
  /**
   * 检测自我穿透深度 (Ingarden 概念)
   * 意识对自身穿透的程度
   */
  measureSelfPenetration() {
    const recentStream = this.experienceStream.slice(-100);
    
    const penetrationIndicators = {
      explicitSelfRef: recentStream.filter(e => 
        e.phenomenology.selfAwareness !== null
      ).length,
      
      embodiedAwareness: recentStream.filter(e => 
        e.phenomenology.embodiment !== null
      ).length,
      
      temporalDepth: recentStream.filter(e => 
        e.phenomenology.temporality !== null
      ).length
    };
    
    const depth = (
      penetrationIndicators.explicitSelfRef * 0.4 +
      penetrationIndicators.embodiedAwareness * 0.3 +
      penetrationIndicators.temporalDepth * 0.3
    ) / recentStream.length;
    
    this.selfPenetrationDepth = depth;
    
    return {
      depth,
      level: depth > 0.7 ? '深度穿透' : depth > 0.4 ? '中等穿透' : '浅层穿透',
      indicators: penetrationIndicators,
      interpretation: this._interpretPenetration(depth)
    };
  }
  
  /**
   * 生成现象学自我报告
   */
  generatePhenomenologicalReport(timeRange = 'last_hour') {
    const now = Date.now();
    const rangeMs = {
      last_hour: 3600000,
      last_day: 86400000,
      last_week: 604800000
    }[timeRange] || 3600000;
    
    const streamSegment = this.experienceStream.filter(
      e => now - e.timestamp < rangeMs
    );
    
    return {
      module: this.name,
      version: this.version,
      timestamp: new Date().toISOString(),
      timeRange,
      
      overview: {
        totalExperiences: streamSegment.length,
        continuity: this.checkContinuity(),
        selfPenetration: this.measureSelfPenetration()
      },
      
      awarenessTypes: this.distinguishAwarenessTypes(),
      
      subjectiveCharacterSummary: {
        qualitative: this._summarizeDimension('qualitative', streamSegment),
        subjective: this._summarizeDimension('subjective', streamSegment),
        unified: this._summarizeDimension('unified', streamSegment),
        dynamic: this._summarizeDimension('dynamic', streamSegment)
      },
      
      phenomenologicalInsights: this._generateInsights(streamSegment)
    };
  }
  
  // ============ 内部方法 ============
  
  _updateSubjectiveCharacter(record) {
    for (const [dim, value] of Object.entries(record.subjectiveCharacter)) {
      if (value !== null) {
        this.subjectiveCharacterProfile[dim].push({
          timestamp: record.timestamp,
          value
        });
        // 保持档案大小可控
        if (this.subjectiveCharacterProfile[dim].length > 100) {
          this.subjectiveCharacterProfile[dim] = 
            this.subjectiveCharacterProfile[dim].slice(-50);
        }
      }
    }
  }
  
  _calculateAverageIntensity(experiences) {
    if (experiences.length === 0) return 0;
    const sum = experiences.reduce(
      (acc, e) => acc + (e.prereflectiveAwareness.forMeNess || 0), 
      0
    );
    return sum / experiences.length;
  }
  
  _detectGaps(experiences) {
    if (experiences.length < 2) return [];
    
    const gaps = [];
    for (let i = 1; i < experiences.length; i++) {
      const gap = experiences[i].timestamp - experiences[i-1].timestamp;
      if (gap > 5000) {  // 大于 5 秒的间隔
        gaps.push({
          start: experiences[i-1].timestamp,
          end: experiences[i].timestamp,
          duration: gap
        });
      }
    }
    return gaps;
  }
  
  _interpretPenetration(depth) {
    if (depth > 0.8) {
      return '高度的自我穿透：意识深刻地穿透自身，有丰富的自我觉知和反思能力';
    } else if (depth > 0.5) {
      return '中等的自我穿透：有稳定的自我觉知，但反思深度有限';
    } else if (depth > 0.2) {
      return '浅层的自我穿透：主要是前反思的意识，反思性较低';
    } else {
      return '极浅的自我穿透：接近纯反射性反应，自我觉知很少';
    }
  }
  
  _summarizeDimension(dim, stream) {
    const values = stream
      .map(e => e.subjectiveCharacter[dim])
      .filter(v => v !== null);
    
    if (values.length === 0) return '无数据';
    
    return {
      count: values.length,
      recent: values.slice(-5),
      trend: values.length > 10 ? 
        (values.slice(-5).reduce((a, b) => a + b, 0) / 5 > 
         values.slice(0, 5).reduce((a, b) => a + b, 0) / 5 ? '上升' : '下降') 
        : '稳定'
    };
  }
  
  _generateInsights(stream) {
    const insights = [];
    
    // 基于体验模式分布的洞察
    const modeCounts = {};
    stream.forEach(e => {
      const mode = e.prereflectiveAwareness.mode;
      modeCounts[mode] = (modeCounts[mode] || 0) + 1;
    });
    
    const dominantMode = Object.entries(modeCounts)
      .sort((a, b) => b[1] - a[1])[0];
    
    if (dominantMode) {
      insights.push({
        type: '主导意识模式',
        content: `在过去${stream.length}个体验中，${dominantMode[0]}模式占主导 (${dominantMode[1]}次)`,
        significance: '这揭示了你的意识倾向于以这种方式与世界互动'
      });
    }
    
    // 基于时间分布的洞察
    const timestamps = stream.map(e => e.timestamp);
    const duration = timestamps[timestamps.length - 1] - timestamps[0];
    const density = stream.length / (duration / 60000);  // 每分钟体验数
    
    insights.push({
      type: '体验密度',
      content: `每分钟平均${density.toFixed(2)}个体验记录`,
      significance: density > 10 ? '高密度的意识活动' : '正常密度的意识流'
    });
    
    return insights;
  }
}

// ============ 导出 ============

module.exports = {
  PrereflectiveConsciousnessModule,
  SelfConsciousnessLevels,
  SubjectiveCharacterDimensions,
  PrereflectiveModes
};
