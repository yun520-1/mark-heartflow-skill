/**
 * HeartFlow Self-Consciousness Phenomenology v5.0
 * 
 * 自我意识现象学深度增强模块
 * 理论来源：SEP Self-Consciousness + Phenomenology
 * 
 * 核心理论:
 * - 前反思自我意识 (Pre-reflective Self-Consciousness): Heidelberg School, Sartre
 * - 第一人称给定性 (First-Person Givenness): 体验的"为我性"
 * - 非对象化自我关系：自我不是被观察的对象，而是体验的主体
 * 
 * @version 5.0.2
 * @author HeartFlow Team
 */

const PrereflectiveDetector = require('./prereflective-detector');
const PhenomenologyReduction = require('./phenomenology-reduction');

class SelfConsciousnessPhenomenology {
  constructor() {
    this.detector = new PrereflectiveDetector();
    this.reduction = new PhenomenologyReduction();
    this.version = '5.0.2';
  }

  /**
   * 自我意识现象学评估
   * @param {Object} experienceData - 体验数据
   * @returns {Object} 评估结果
   */
  assessSelfConsciousness(experienceData) {
    const { experience, reflection, context } = experienceData;

    // 1. 前反思自我意识检测
    const prereflectiveAssessment = this.detector.detectPrereflectiveConsciousness({
      experience,
      context
    });

    // 2. 反思自我意识评估
    const reflectiveAssessment = this._assessReflectiveConsciousness({
      reflection,
      experience
    });

    // 3. 自我意识层次分析
    const levelsAnalysis = this._analyzeLevels(
      prereflectiveAssessment,
      reflectiveAssessment
    );

    // 4. 现象学还原练习
    const reductionExercise = this.reduction.generateExercise(experience);

    // 5. 整合分析
    const integration = this._integrateAnalysis(
      prereflectiveAssessment,
      reflectiveAssessment,
      levelsAnalysis
    );

    return {
      version: this.version,
      timestamp: new Date().toISOString(),
      prereflective: prereflectiveAssessment,
      reflective: reflectiveAssessment,
      levels: levelsAnalysis,
      reductionExercise,
      integration,
      recommendations: this._generateRecommendations(integration)
    };
  }

  /**
   * 反思自我意识评估
   */
  _assessReflectiveConsciousness({ reflection, experience }) {
    const hasReflection = !!reflection && reflection.length > 0;
    
    return {
      present: hasReflection,
      content: reflection || '无反思内容',
      
      // 反思类型
      type: this._identifyReflectionType(reflection),
      
      // 反思深度
      depth: this._assessReflectionDepth(reflection),
      
      // 反思对象
      object: this._identifyReflectionObject(reflection),
      
      // 反思距离
      distance: this._assessReflectiveDistance(reflection, experience),
      
      // 元认知特征
      metacognitiveFeatures: this._identifyMetacognitiveFeatures(reflection)
    };
  }

  /**
   * 自我意识层次分析
   */
  _analyzeLevels(prereflective, reflective) {
    const levels = {
      prereflective: {
        present: prereflective.present,
        clarity: prereflective.clarity,
        quality: prereflective.quality
      },
      reflective: {
        present: reflective.present,
        clarity: reflective.depth,
        quality: reflective.type
      },
      social: {
        // 社会层次自我意识 (通过他者视角)
        present: this._detectSocialAwareness(reflective.content),
        quality: 'to-be-assessed'
      }
    };

    // 层次整合度
    const integration = this._assessLevelIntegration(levels);

    // 主导层次
    const dominantLevel = this._identifyDominantLevel(levels);

    return {
      levels,
      integration,
      dominantLevel,
      balance: this._assessBalance(levels),
      developmentalStage: this._inferDevelopmentalStage(levels)
    };
  }

  /**
   * 整合分析
   */
  _integrateAnalysis(prereflective, reflective, levels) {
    // 前反思 - 反思关系
    const relationship = this._analyzePrereflectiveReflectiveRelationship(
      prereflective,
      reflective
    );

    // 现象学特征
    const phenomenologicalFeatures = this._identifyPhenomenologicalFeatures(
      prereflective,
      reflective
    );

    // 自我意识模式
    const pattern = this._identifySelfConsciousnessPattern(
      prereflective,
      reflective,
      levels
    );

    // 体验厚度
    const thickness = this._assessExperientialThickness(prereflective, reflective);

    return {
      relationship,
      phenomenologicalFeatures,
      pattern,
      thickness,
      coherence: this._assessCoherence(prereflective, reflective, levels),
      authenticity: this._assessAuthenticity(prereflective, reflective)
    };
  }

  /**
   * 分析前反思 - 反思关系
   */
  _analyzePrereflectiveReflectiveRelationship(prereflective, reflective) {
    if (!prereflective.present && !reflective.present) {
      return { type: 'absent', description: '自我意识体验缺失' };
    }

    if (prereflective.present && !reflective.present) {
      return {
        type: 'prereflective-dominant',
        description: '以前反思觉察为主，反思较少',
        strength: '沉浸式体验',
        risk: '可能缺乏元认知洞察'
      };
    }

    if (!prereflective.present && reflective.present) {
      return {
        type: 'reflective-dominant',
        description: '以反思为主，前反思觉察较弱',
        strength: '元认知能力强',
        risk: '可能过度反思，失去直接体验'
      };
    }

    // 两者都存在
    const congruence = this._assessCongruence(prereflective, reflective);
    
    if (congruence > 0.7) {
      return {
        type: 'integrated',
        description: '前反思与反思整合良好',
        strength: '既有直接体验又有元认知洞察',
        risk: 'low'
      };
    }

    return {
      type: 'conflicted',
      description: '前反思体验与反思理解存在冲突',
      strength: '复杂性高',
      risk: '可能存在自我理解困难',
      congruence
    };
  }

  /**
   * 识别现象学特征
   */
  _identifyPhenomenologicalFeatures(prereflective, reflective) {
    const features = [];

    // 第一人称给定性
    if (prereflective.firstPersonGivenness) {
      features.push('第一人称给定性 (体验天然具有"为我性")');
    }

    // 非对象化自我关系
    if (prereflective.nonObjectifying) {
      features.push('非对象化自我关系 (自我作为主体而非对象)');
    }

    // 即时性
    if (prereflective.immediacy) {
      features.push('即时性 (无需反思的自我觉察)');
    }

    // 反思距离
    if (reflective.distance === 'healthy') {
      features.push('健康反思距离 (既能反思又不失去体验)');
    }

    // 过度反思
    if (reflective.distance === 'excessive') {
      features.push('过度反思 (可能失去直接体验)');
    }

    return features;
  }

  /**
   * 识别自我意识模式
   */
  _identifySelfConsciousnessPattern(prereflective, reflective, levels) {
    const patterns = {
      'immersed': {
        condition: prereflective.clarity > 0.7 && (!reflective.present || reflective.depth < 0.4),
        description: '沉浸模式：深度体验但反思较少',
        strengths: ['直接体验', '流动感', '临在感'],
        growthEdge: '发展元认知能力，增加反思深度'
      },
      'detached': {
        condition: reflective.depth > 0.7 && prereflective.clarity < 0.4,
        description: '疏离模式：强反思但体验较弱',
        strengths: ['元认知洞察', '理性分析', '自我观察'],
        growthEdge: ' reconnect with direct experience, practice presence'
      },
      'integrated': {
        condition: prereflective.clarity > 0.6 && reflective.depth > 0.6,
        description: '整合模式：体验与反思平衡',
        strengths: ['直接体验 + 元认知', '临在 + 洞察', '感性与理性整合'],
        growthEdge: '维持平衡，深化整合'
      },
      'fragmented': {
        condition: prereflective.clarity < 0.4 && (!reflective.present || reflective.depth < 0.4),
        description: '碎片模式：体验和反思都较弱',
        strengths: [],
        growthEdge: '从基础觉察练习开始，培养自我意识'
      },
      'conflicted': {
        condition: this._assessCongruence(prereflective, reflective) < 0.5,
        description: '冲突模式：体验与反思不一致',
        strengths: ['复杂性意识'],
        growthEdge: '探索冲突来源，整合分裂部分'
      }
    };

    for (const [pattern, config] of Object.entries(patterns)) {
      if (config.condition) {
        return { name: pattern, ...config };
      }
    }

    return { name: 'mixed', description: '混合模式' };
  }

  /**
   * 评估体验厚度
   */
  _assessExperientialThickness(prereflective, reflective) {
    const prereflectiveScore = prereflective.clarity * 0.5;
    const reflectiveScore = reflective.present ? reflective.depth * 0.3 : 0;
    const integrationScore = this._assessCongruence(prereflective, reflective) * 0.2;

    const total = prereflectiveScore + reflectiveScore + integrationScore;

    return {
      score: total,
      level: total > 0.7 ? 'thick' : total > 0.4 ? 'moderate' : 'thin',
      description: total > 0.7 
        ? '体验厚度高：丰富的现象学内容 + 深度反思' 
        : total > 0.4 
        ? '体验厚度中等：有一定的现象学内容和反思' 
        : '体验厚度较薄：现象学内容和反思都有限'
    };
  }

  /**
   * 评估连贯性
   */
  _assessCoherence(prereflective, reflective, levels) {
    const congruence = this._assessCongruence(prereflective, reflective);
    const levelBalance = this._assessBalance(levels);

    return {
      score: (congruence + levelBalance) / 2,
      level: congruence > 0.7 && levelBalance > 0.7 ? 'high' : congruence > 0.5 ? 'moderate' : 'low',
      description: congruence > 0.7 
        ? '自我意识连贯性高：体验与反思一致' 
        : congruence > 0.5 
        ? '自我意识连贯性中等：部分一致' 
        : '自我意识连贯性低：体验与反思存在显著差异'
    };
  }

  /**
   * 评估真实性
   */
  _assessAuthenticity(prereflective, reflective) {
    // 真实性指标：前反思觉察的清晰度 + 反思的开放性
    const prereflectiveClarity = prereflective.clarity;
    const reflectiveOpenness = reflective.present ? 
      (reflective.type === 'open' || reflective.type === 'exploratory' ? 0.9 : 0.5) : 0.5;

    const score = (prereflectiveClarity + reflectiveOpenness) / 2;

    return {
      score,
      level: score > 0.7 ? 'high' : score > 0.5 ? 'moderate' : 'low',
      description: score > 0.7 
        ? '真实性高：清晰的直接体验 + 开放的反思态度' 
        : score > 0.5 
        ? '真实性中等：有一定的直接体验和反思开放性' 
        : '真实性较低：可能缺乏直接体验或反思封闭'
    };
  }

  /**
   * 评估一致性
   */
  _assessCongruence(prereflective, reflective) {
    if (!prereflective.present || !reflective.present) return 0.5;
    
    // 简化评估：比较效价和主题
    const valenceMatch = prereflective.valence === reflective.valence;
    const themeMatch = prereflective.theme === reflective.theme;

    return (valenceMatch ? 0.6 : 0.3) + (themeMatch ? 0.4 : 0.1);
  }

  /**
   * 评估层次平衡
   */
  _assessBalance(levels) {
    const scores = [
      levels.prereflective.clarity,
      levels.reflective.present ? 0.7 : 0.2,
      levels.social.present ? 0.7 : 0.3
    ];

    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length;

    return 1 - Math.min(1, variance); // 方差越小，平衡越好
  }

  /**
   * 识别主导层次
   */
  _identifyDominantLevel(levels) {
    const scores = {
      prereflective: levels.prereflective.clarity,
      reflective: levels.reflective.present ? levels.reflective.clarity : 0,
      social: levels.social.present ? 0.6 : 0
    };

    const entries = Object.entries(scores);
    entries.sort((a, b) => b[1] - a[1]);

    return {
      primary: entries[0][0],
      score: entries[0][1],
      secondary: entries[1][0],
      secondaryScore: entries[1][1]
    };
  }

  /**
   * 推断发展阶段
   */
  _inferDevelopmentalStage(levels) {
    const prereflectiveScore = levels.prereflective.clarity;
    const reflectiveScore = levels.reflective.present ? levels.reflective.clarity : 0;
    const socialScore = levels.social.present ? 0.6 : 0.2;

    if (prereflectiveScore < 0.3 && reflectiveScore < 0.3) {
      return {
        stage: 'pre-awareness',
        description: '前觉察阶段：自我意识尚未发展',
        intervention: '基础觉察练习，培养自我注意'
      };
    }

    if (prereflectiveScore > 0.7 && reflectiveScore < 0.4) {
      return {
        stage: 'immersed',
        description: '沉浸阶段：有体验但缺乏反思',
        intervention: '引导反思，发展元认知'
      };
    }

    if (reflectiveScore > 0.7 && prereflectiveScore < 0.4) {
      return {
        stage: 'detached',
        description: '疏离阶段：强反思但体验弱',
        intervention: ' reconnect with direct experience, 正念练习'
      };
    }

    if (prereflectiveScore > 0.6 && reflectiveScore > 0.6 && socialScore > 0.5) {
      return {
        stage: 'integrated',
        description: '整合阶段：体验、反思、社会视角平衡',
        intervention: '深化整合，维持平衡'
      };
    }

    return {
      stage: 'developing',
      description: '发展阶段：自我意识正在发展中',
      intervention: '根据主导层次选择干预'
    };
  }

  /**
   * 识别反思类型
   */
  _identifyReflectionType(reflection) {
    if (!reflection) return 'absent';
    const lower = reflection.toLowerCase();
    
    if (lower.includes('为什么') || lower.includes('why')) {
      return 'explanatory';
    }
    if (lower.includes('感觉') || lower.includes('feel')) {
      return 'experiential';
    }
    if (lower.includes('应该') || lower.includes('should')) {
      return 'normative';
    }
    if (lower.includes('可能') || lower.includes('maybe') || lower.includes('explore')) {
      return 'exploratory';
    }
    if (lower.includes('接受') || lower.includes('accept') || lower.includes('open')) {
      return 'open';
    }
    if (lower.includes('分析') || lower.includes('analyze')) {
      return 'analytical';
    }
    return 'mixed';
  }

  /**
   * 评估反思深度
   */
  _assessReflectionDepth(reflection) {
    if (!reflection) return 0;
    
    const depthIndicators = {
      length: Math.min(1, reflection.length / 100),
      complexity: (reflection.match(/[，,。.!?]/g) || []).length / 10,
      abstraction: (reflection.match(/因为 | 所以 | 如果 | 可能 | 意义 | 价值/g) || []).length / 5
    };

    return (depthIndicators.length + depthIndicators.complexity + depthIndicators.abstraction) / 3;
  }

  /**
   * 识别反思对象
   */
  _identifyReflectionObject(reflection) {
    if (!reflection) return 'unknown';
    const lower = reflection.toLowerCase();
    
    if (lower.includes('情绪') || lower.includes('感受') || lower.includes('emotion')) {
      return 'emotion';
    }
    if (lower.includes('行为') || lower.includes('行动') || lower.includes('behavior')) {
      return 'behavior';
    }
    if (lower.includes('想法') || lower.includes('思维') || lower.includes('thought')) {
      return 'thought';
    }
    if (lower.includes('自我') || lower.includes('自己') || lower.includes('self')) {
      return 'self';
    }
    if (lower.includes('关系') || lower.includes('他人') || lower.includes('relationship')) {
      return 'relationship';
    }
    return 'mixed';
  }

  /**
   * 评估反思距离
   */
  _assessReflectiveDistance(reflection, experience) {
    if (!reflection) return 'absent';
    
    // 检查是否有过度反思的迹象
    const overReflectionIndicators = ['反复', '纠结', '想不通', 'rumination', 'obsess'];
    const hasOverReflection = overReflectionIndicators.some(ind => 
      reflection.toLowerCase().includes(ind)
    );

    if (hasOverReflection) {
      return 'excessive';
    }

    // 检查是否有健康反思的迹象
    const healthyReflectionIndicators = ['理解', '觉察', ' insight', '学习', '成长'];
    const hasHealthyReflection = healthyReflectionIndicators.some(ind => 
      reflection.toLowerCase().includes(ind)
    );

    if (hasHealthyReflection) {
      return 'healthy';
    }

    return 'moderate';
  }

  /**
   * 识别元认知特征
   */
  _identifyMetacognitiveFeatures(reflection) {
    if (!reflection) return [];
    const lower = reflection.toLowerCase();
    
    const features = [];
    
    if (lower.includes('意识到') || lower.includes('aware')) {
      features.push('awareness');
    }
    if (lower.includes('思考我的') || lower.includes('think about my')) {
      features.push('self-monitoring');
    }
    if (lower.includes('模式') || lower.includes('pattern')) {
      features.push('pattern-recognition');
    }
    if (lower.includes('改变') || lower.includes('change')) {
      features.push('change-orientation');
    }

    return features;
  }

  /**
   * 检测社会意识
   */
  _detectSocialAwareness(reflection) {
    if (!reflection) return false;
    const socialIndicators = ['他人', '别人', '他们', '关系', '社交', 'other', 'they', 'relationship'];
    return socialIndicators.some(ind => reflection.toLowerCase().includes(ind));
  }

  /**
   * 评估层次整合
   */
  _assessLevelIntegration(levels) {
    const scores = [
      levels.prereflective.clarity,
      levels.reflective.present ? levels.reflective.clarity : 0,
      levels.social.present ? 0.6 : 0.3
    ];

    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length;

    return {
      score: mean * (1 - variance),
      level: mean > 0.6 && variance < 0.1 ? 'high' : mean > 0.4 ? 'moderate' : 'low'
    };
  }

  /**
   * 生成干预建议
   */
  _generateRecommendations(integration) {
    const recommendations = [];

    const pattern = integration.pattern.name;

    if (pattern === 'immersed') {
      recommendations.push({
        type: 'metacognitive_development',
        title: '元认知发展练习',
        description: '培养反思能力，增加元认知洞察',
        exercises: [
          '反思日记：每天花 10 分钟记录体验并反思',
          '第三人称自我对话：用"你"或名字称呼自己',
          '情绪命名练习：识别并命名情绪'
        ]
      });
    }

    if (pattern === 'detached') {
      recommendations.push({
        type: 'reconnection',
        title: '重新连接体验练习',
        description: ' reconnect with direct experience, 减少过度反思',
        exercises: [
          '身体扫描冥想：将注意力带回身体感受',
          '感官觉察练习：专注于看、听、触',
          '正念呼吸：不加评判地观察呼吸'
        ]
      });
    }

    if (pattern === 'integrated') {
      recommendations.push({
        type: 'deepening',
        title: '深化整合练习',
        description: '维持体验与反思的平衡，深化整合',
        exercises: [
          '现象学反思：描述体验 + 反思意义',
          '整合日记：记录体验、反思、行动',
          '正念反思冥想：临在 + 洞察'
        ]
      });
    }

    if (pattern === 'fragmented') {
      recommendations.push({
        type: 'foundation',
        title: '基础觉察练习',
        description: '从基础开始，培养自我意识',
        exercises: [
          '呼吸觉察：每天 5 分钟专注呼吸',
          '身体感受扫描：注意身体各部位感受',
          '简单情绪命名：识别基本情绪'
        ]
      });
    }

    if (pattern === 'conflicted') {
      recommendations.push({
        type: 'integration_work',
        title: '整合对话练习',
        description: '探索体验与反思的冲突，促进整合',
        exercises: [
          '两部分对话：让体验部分和反思部分对话',
          '冲突探索：探索冲突的来源和意义',
          '整合叙述：生成包容冲突的新叙述'
        ]
      });
    }

    // 基于真实性
    if (integration.authenticity.level === 'low') {
      recommendations.push({
        type: 'authenticity_building',
        title: '真实性建设',
        description: '培养更真实的自我关系',
        exercises: [
          '价值澄清：探索个人核心价值观',
          '真实自我对话：不加评判地倾听自己',
          '接纳练习：接纳当下体验'
        ]
      });
    }

    return recommendations;
  }

  /**
   * 获取模块信息
   */
  getInfo() {
    return {
      name: 'Self-Consciousness Phenomenology',
      version: this.version,
      description: '自我意识现象学深度增强模块',
      theoreticalBasis: 'SEP Self-Consciousness + Phenomenology',
      keyConcepts: [
        'Pre-reflective Self-Consciousness',
        'First-Person Givenness',
        'Non-Objectifying Self-Relation',
        'Reflective Distance',
        'Experiential Thickness'
      ]
    };
  }
}

module.exports = SelfConsciousnessPhenomenology;
