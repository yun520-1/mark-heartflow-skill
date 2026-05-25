/**
 * 现象学意识模块 (Phenomenological Consciousness Module)
 * 
 * 基于 Stanford Encyclopedia of Philosophy 权威理论：
 * - Phenomenology: 现象学方法与第一人称体验结构
 * - Consciousness: 意识层次模型 (Sentience → Self-consciousness)
 * - Intentionality: 意向性分析 (Noema/Noesis)
 * - Qualia: 感受质评估与粒度分析
 * 
 * @version 3.41.0
 * @author HeartFlow Team
 */

const PhenomenologicalConsciousnessModule = {
  
  /**
   * 模块元信息
   */
  meta: {
    name: 'Phenomenological Consciousness',
    version: '3.41.0',
    description: '现象学意识分析与第一人称体验建模',
    theoreticalBasis: [
      'SEP Phenomenology',
      'SEP Consciousness',
      'SEP Intentionality',
      'SEP Qualia',
      'Husserl: Ideas I (1913)',
      'Brentano: Psychology from an Empirical Standpoint (1874)',
      'Merleau-Ponty: Phenomenology of Perception (1945)'
    ]
  },

  /**
   * 意向性分析 (Intentionality Analysis)
   * 
   * 基于 Brentano 和 Husserl 的意向性理论：
   * - 意向方向：心理状态指向什么对象
   * - 意向内容 (Noema)：体验的意义结构
   * - 意向行为 (Noesis)：意识活动的类型
   * - 意向不存在：可指向虚构/抽象对象
   * 
   * @param {string} input - 用户输入
   * @returns {object} 意向性分析结果
   */
  analyzeIntentionality(input) {
    const result = {
      direction: this.detectIntentionalDirection(input),
      noema: this.analyzeNoema(input),
      noesis: this.classifyNoeticAct(input),
      objectStatus: this.determineObjectStatus(input)
    };
    
    return {
      ...result,
      summary: this.summarizeIntentionality(result),
      interventions: this.getIntentionalityInterventions(result)
    };
  },

  /**
   * 检测意向方向
   */
  detectIntentionalDirection(input) {
    const keywords = {
      self: ['我', '自己', '自我', '自身', 'myself', 'I', 'me', 'my'],
      other: ['他', '她', '他们', '别人', '他人', 'they', 'them', 'other'],
      object: ['它', '这个', '那个', '东西', '物体', 'it', 'this', 'that', 'object'],
      abstract: ['概念', '想法', '意义', '价值', 'truth', 'idea', 'meaning', 'value'],
      fictional: ['想象', '幻想', '虚构', '梦', 'imagine', 'fantasy', 'fiction', 'dream']
    };
    
    const scores = {};
    for (const [category, words] of Object.entries(keywords)) {
      scores[category] = words.reduce((count, word) => {
        const regex = new RegExp(word, 'gi');
        return count + (input.match(regex) || []).length;
      }, 0);
    };
    
    const maxScore = Math.max(...Object.values(scores));
    const direction = maxScore > 0 
      ? Object.keys(scores).find(key => scores[key] === maxScore)
      : 'undetermined';
    
    return {
      direction,
      scores,
      confidence: maxScore / input.length
    };
  },

  /**
   * 分析 Noema (意向内容/意义结构)
   */
  analyzeNoema(input) {
    // 提取体验的意义内容
    const meaningMarkers = {
      emotional: ['感到', '感觉', '情绪', '心情', 'feel', 'emotion', 'mood'],
      cognitive: ['认为', '思考', '相信', '知道', 'think', 'believe', 'know'],
      perceptual: ['看到', '听到', '感觉', '闻', '尝', 'see', 'hear', 'feel', 'smell', 'taste'],
      volitional: ['想要', '希望', '打算', '计划', 'want', 'hope', 'intend', 'plan'],
      evaluative: ['好', '坏', '重要', '价值', '意义', 'good', 'bad', 'important', 'value', 'meaning']
    };
    
    const noematicComponents = {};
    for (const [type, markers] of Object.entries(meaningMarkers)) {
      const matches = markers.filter(m => input.includes(m));
      noematicComponents[type] = {
        present: matches.length > 0,
        markers: matches,
        intensity: matches.length
      };
    }
    
    return {
      components: noematicComponents,
      dominantType: this.findDominantType(noematicComponents),
      complexity: Object.values(noematicComponents).filter(c => c.present).length
    };
  },

  /**
   * 分类 Noetic Act (意向行为类型)
   */
  classifyNoeticAct(input) {
    const actTypes = {
      perception: {
        keywords: ['看到', '听到', '感觉', '观察', 'notice', 'see', 'hear', 'feel', 'observe'],
        weight: 0
      },
      imagination: {
        keywords: ['想象', '幻想', '梦见', '设想', 'imagine', 'fantasy', 'dream', 'envision'],
        weight: 0
      },
      judgment: {
        keywords: ['认为', '判断', '决定', '结论', 'think', 'judge', 'decide', 'conclude'],
        weight: 0
      },
      emotion: {
        keywords: ['感到', '情绪', '喜欢', '讨厌', 'feel', 'emotion', 'like', 'hate', 'love'],
        weight: 0
      },
      desire: {
        keywords: ['想要', '希望', '渴望', '需要', 'want', 'hope', 'desire', 'need'],
        weight: 0
      },
      memory: {
        keywords: ['记得', '回忆', '想起', '过去', 'remember', 'recall', 'reminisce', 'past'],
        weight: 0
      }
    };
    
    for (const [type, data] of Object.entries(actTypes)) {
      data.weight = data.keywords.reduce((count, keyword) => {
        const regex = new RegExp(keyword, 'gi');
        return count + (input.match(regex) || []).length;
      }, 0);
    }
    
    const sortedActs = Object.entries(actTypes)
      .sort((a, b) => b[1].weight - a[1].weight);
    
    return {
      primary: sortedActs[0][0],
      secondary: sortedActs[1][0],
      distribution: Object.fromEntries(sortedActs.map(([k, v]) => [k, v.weight])),
      confidence: sortedActs[0][1].weight / input.length
    };
  },

  /**
   * 确定对象状态 (真实/虚构/抽象)
   */
  determineObjectStatus(input) {
    const fictionalMarkers = ['如果', '假如', '想象', '可能', '也许', 'if', 'imagine', 'maybe', 'perhaps'];
    const abstractMarkers = ['概念', '意义', '价值', '真理', 'idea', 'meaning', 'value', 'truth'];
    const concreteMarkers = ['这个', '那个', '这里', '那里', '现在', 'this', 'that', 'here', 'there', 'now'];
    
    const scores = {
      fictional: fictionalMarkers.reduce((c, m) => c + (input.includes(m) ? 1 : 0), 0),
      abstract: abstractMarkers.reduce((c, m) => c + (input.includes(m) ? 1 : 0), 0),
      concrete: concreteMarkers.reduce((c, m) => c + (input.includes(m) ? 1 : 0), 0)
    };
    
    const status = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
    
    return {
      status,
      scores,
      indicators: this.getObjectStatusIndicators(input, status)
    };
  },

  /**
   * 总结意向性分析
   */
  summarizeIntentionality(result) {
    const { direction, noema, noesis, objectStatus } = result;
    
    return `意向指向${direction.direction}，主导体验类型为${noesis.primary}，` +
           `意义结构复杂度${noema.complexity}/5，对象状态为${objectStatus.status}。`;
  },

  /**
   * 获取意向性干预建议
   */
  getIntentionalityInterventions(result) {
    const interventions = [];
    
    if (result.direction.direction === 'self') {
      interventions.push({
        name: '自我聚焦觉察',
        description: '引导用户扩展意向方向，关注他人或外部世界',
        technique: '尝试将注意力从自我转向外部环境或他人'
      });
    }
    
    if (result.noeticAct.primary === 'emotion' && result.noema.complexity < 3) {
      interventions.push({
        name: '情绪精细化',
        description: '帮助区分和命名复杂的情绪体验',
        technique: '使用情绪粒度练习，识别情绪的细微差别'
      });
    }
    
    if (result.objectStatus.status === 'fictional') {
      interventions.push({
        name: '现实检验',
        description: '区分想象内容与现实体验',
        technique: '温和地探索想象与现实的边界'
      });
    }
    
    return interventions;
  },

  // ========== 现象学还原 (Phenomenological Reduction) ==========

  /**
   * 执行现象学还原 (Epoche)
   * 
   * 基于 Husserl 的现象学方法：
   * 1. 悬置判断：搁置对对象存在的预设
   * 2. 本质直观：把握体验的本质结构
   * 3. 先验还原：回到纯粹意识领域
   * 
   * @param {string} input - 用户输入
   * @returns {object} 还原结果
   */
  performEpoche(input) {
    const bracketed = this.bracketExistenceAssumptions(input);
    const essence = this.eideticReduction(bracketed);
    const pureExperience = this.transcendentalReduction(essence);
    
    return {
      original: input,
      bracketed,
      essence,
      pureExperience,
      steps: this.getReductionSteps(input, bracketed, essence, pureExperience),
      insights: this.extractPhenomenologicalInsights(pureExperience)
    };
  },

  /**
   * 悬置存在预设 (Bracket Existence Assumptions)
   */
  bracketExistenceAssumptions(input) {
    // 识别并标记存在预设
    const existenceMarkers = [
      { pattern: /是/g, type: 'copula' },
      { pattern: /有/g, type: 'existence' },
      { pattern: /在/g, type: 'location' },
      { pattern: /存在/g, type: 'explicit_existence' },
      { pattern: /真实/g, type: 'reality_claim' }
    ];
    
    const bracketed = existenceMarkers.reduce((text, marker) => {
      return text.replace(marker.pattern, `[${marker.type}...]`);
    }, input);
    
    return {
      text: bracketed,
      assumptions: existenceMarkers
        .filter(m => new RegExp(m.pattern.source).test(input))
        .map(m => m.type)
    };
  },

  /**
   * 本质还原 (Eidetic Reduction)
   */
  eideticReduction(bracketed) {
    // 提取体验的本质特征
    const essenceKeywords = {
      temporal: ['现在', '过去', '未来', '时间', 'now', 'past', 'future', 'time'],
      spatial: ['这里', '那里', '地方', '空间', 'here', 'there', 'place', 'space'],
      qualitative: ['感觉', '感受', '质地', 'qualia', 'feel', 'sensation', 'quality'],
      relational: ['关系', '连接', '联系', 'relationship', 'connection', 'link']
    };
    
    const essence = {};
    for (const [category, keywords] of Object.entries(essenceKeywords)) {
      const matches = keywords.filter(k => bracketed.text.toLowerCase().includes(k.toLowerCase()));
      essence[category] = {
        present: matches.length > 0,
        markers: matches
      };
    }
    
    return essence;
  },

  /**
   * 先验还原 (Transcendental Reduction)
   */
  transcendentalReduction(essence) {
    // 回到纯粹意识体验
    const pureExperience = {
      consciousness: {
        present: true,
        type: 'first-person',
        structure: Object.keys(essence).filter(k => essence[k].present)
      },
      subjectivity: {
        degree: Object.values(essence).filter(e => e.present).length / 4,
        markers: Object.values(essence)
          .flatMap(e => e.markers)
          .filter(m => m)
      }
    };
    
    return pureExperience;
  },

  /**
   * 获取还原步骤
   */
  getReductionSteps(original, bracketed, essence, pure) {
    return [
      {
        step: 1,
        name: '悬置判断 (Epoche)',
        description: '搁置对对象存在的自然态度预设',
        result: `识别${bracketed.assumptions.length}个存在预设`
      },
      {
        step: 2,
        name: '本质直观 (Eidetic Intuition)',
        description: '把握体验的本质结构',
        result: `发现${Object.values(essence).filter(e => e.present).length}个本质维度`
      },
      {
        step: 3,
        name: '先验还原 (Transcendental Reduction)',
        description: '回到纯粹意识领域',
        result: `主体性程度：${(pure.subjectivity.degree * 100).toFixed(0)}%`
      }
    ];
  },

  /**
   * 提取现象学洞见
   */
  extractPhenomenologicalInsights(pureExperience) {
    const insights = [];
    
    if (pureExperience.subjectivity.degree > 0.75) {
      insights.push({
        type: 'high_subjectivity',
        description: '体验具有高度的第一人称特征',
        suggestion: '可以进一步探索这种主体性的具体质感'
      });
    }
    
    if (pureExperience.consciousness.structure.includes('temporal')) {
      insights.push({
        type: 'temporal_awareness',
        description: '体验包含明确的时间意识',
        suggestion: '可以探索过去 - 现在 - 未来的时间结构'
      });
    }
    
    if (pureExperience.consciousness.structure.includes('qualitative')) {
      insights.push({
        type: 'qualia_present',
        description: '体验包含明显的感受质',
        suggestion: '可以进一步精细化感受的质感描述'
      });
    }
    
    return insights;
  },

  // ========== 感受质评估 (Qualia Assessment) ==========

  /**
   * 评估感受质 (Qualia)
   * 
   * 基于 SEP Qualia 理论：
   * - 感官感受质：视觉、听觉、触觉等
   * - 情绪感受质：情感体验的主观质感
   * - 认知感受质：思考、理解的现象学特征
   * 
   * @param {string} input - 用户输入
   * @returns {object} 感受质评估结果
   */
  assessQualia(input) {
    const sensory = this.detectSensoryQualia(input);
    const emotional = this.detectEmotionalQualia(input);
    const cognitive = this.detectCognitiveQualia(input);
    
    const granularity = this.calculateQualiaGranularity(sensory, emotional, cognitive);
    
    return {
      sensory,
      emotional,
      cognitive,
      granularity,
      overall: {
        richness: (sensory.richness + emotional.richness + cognitive.richness) / 3,
        differentiation: (sensory.differentiation + emotional.differentiation + cognitive.differentiation) / 3,
        intensity: (sensory.intensity + emotional.intensity + cognitive.intensity) / 3
      },
      interventions: this.getQualiaInterventions(sensory, emotional, cognitive, granularity)
    };
  },

  /**
   * 检测感官感受质
   */
  detectSensoryQualia(input) {
    const modalities = {
      visual: ['看', '见', '视觉', '颜色', '亮', '暗', 'see', 'visual', 'color', 'bright', 'dark'],
      auditory: ['听', '声音', '响', '安静', 'hear', 'sound', 'loud', 'quiet'],
      tactile: ['触', '摸', '感觉', '质地', 'touch', 'feel', 'texture', 'tactile'],
      olfactory: ['闻', '气味', '香', '臭', 'smell', 'scent', 'odor'],
      gustatory: ['尝', '味道', '甜', '苦', 'taste', 'flavor', 'sweet', 'bitter'],
      proprioceptive: ['身体', '姿势', '运动', 'body', 'posture', 'movement', 'position']
    };
    
    const scores = {};
    for (const [modality, keywords] of Object.entries(modalities)) {
      scores[modality] = keywords.reduce((c, k) => c + (input.toLowerCase().includes(k.toLowerCase()) ? 1 : 0), 0);
    }
    
    const total = Object.values(scores).reduce((a, b) => a + b, 0);
    
    return {
      scores,
      present: total > 0,
      richness: Math.min(total / 5, 1),
      differentiation: Object.values(scores).filter(s => s > 0).length / 6,
      intensity: total / input.length,
      dominant: Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b)
    };
  },

  /**
   * 检测情绪感受质
   */
  detectEmotionalQualia(input) {
    const emotionCategories = {
      positive: ['开心', '快乐', '高兴', '喜悦', '兴奋', 'happy', 'joy', 'glad', 'excited'],
      negative: ['难过', '悲伤', '痛苦', '沮丧', 'sad', 'sadness', 'pain', 'depressed'],
      activating: ['愤怒', '激动', '紧张', '焦虑', 'angry', 'excited', 'nervous', 'anxious'],
      deactivating: ['平静', '放松', '疲惫', '平静', 'calm', 'relaxed', 'tired', 'peaceful'],
      social: ['爱', '喜欢', '讨厌', '孤独', 'love', 'like', 'hate', 'lonely']
    };
    
    const scores = {};
    for (const [category, keywords] of Object.entries(emotionCategories)) {
      scores[category] = keywords.reduce((c, k) => c + (input.toLowerCase().includes(k.toLowerCase()) ? 1 : 0), 0);
    }
    
    const total = Object.values(scores).reduce((a, b) => a + b, 0);
    
    return {
      scores,
      present: total > 0,
      richness: Math.min(total / 5, 1),
      differentiation: Object.values(scores).filter(s => s > 0).length / 5,
      intensity: total / input.length,
      valence: (scores.positive - scores.negative) / Math.max(total, 1),
      arousal: (scores.activating - scores.deactivating) / Math.max(total, 1)
    };
  },

  /**
   * 检测认知感受质
   */
  detectCognitiveQualia(input) {
    const cognitiveTypes = {
      understanding: ['理解', '明白', '懂', 'understand', 'comprehend', 'get'],
      confusion: ['困惑', '疑惑', '迷茫', 'confused', 'puzzled', 'lost'],
      insight: ['顿悟', '启发', '明白', 'insight', 'realization', 'aha'],
      thinking: ['思考', '想', '考虑', 'think', 'ponder', 'consider'],
      remembering: ['记得', '回忆', '记忆', 'remember', 'recall', 'memory']
    };
    
    const scores = {};
    for (const [type, keywords] of Object.entries(cognitiveTypes)) {
      scores[type] = keywords.reduce((c, k) => c + (input.toLowerCase().includes(k.toLowerCase()) ? 1 : 0), 0);
    }
    
    const total = Object.values(scores).reduce((a, b) => a + b, 0);
    
    return {
      scores,
      present: total > 0,
      richness: Math.min(total / 5, 1),
      differentiation: Object.values(scores).filter(s => s > 0).length / 5,
      intensity: total / input.length,
      clarity: (scores.understanding + scores.insight - scores.confusion) / Math.max(total, 1)
    };
  },

  /**
   * 计算感受质粒度
   */
  calculateQualiaGranularity(sensory, emotional, cognitive) {
    const differentiation = (
      sensory.differentiation +
      emotional.differentiation +
      cognitive.differentiation
    ) / 3;
    
    const richness = (
      sensory.richness +
      emotional.richness +
      cognitive.richness
    ) / 3;
    
    const granularity = (differentiation * 0.6 + richness * 0.4);
    
    return {
      score: granularity,
      level: granularity > 0.75 ? 'high' : granularity > 0.4 ? 'medium' : 'low',
      breakdown: { differentiation, richness }
    };
  },

  /**
   * 获取感受质干预建议
   */
  getQualiaInterventions(sensory, emotional, cognitive, granularity) {
    const interventions = [];
    
    if (granularity.level === 'low') {
      interventions.push({
        name: '感受质精细化练习',
        description: '通过细致的感官觉察提升体验粒度',
        technique: '5-4-3-2-1 练习：注意 5 样看到的东西、4 样触摸到的东西、3 样听到的声音、2 样闻到的气味、1 样尝到的味道'
      });
    }
    
    if (emotional.differentiation < 0.4) {
      interventions.push({
        name: '情绪粒度训练',
        description: '学习区分和命名细微的情绪差别',
        technique: '使用情绪轮盘，尝试用更具体的词汇描述感受'
      });
    }
    
    if (sensory.richness < 0.3) {
      interventions.push({
        name: '感官觉察练习',
        description: '增强对感官体验的觉察',
        technique: '正念饮食：慢慢品尝食物，注意质地、味道、温度等细节'
      });
    }
    
    return interventions;
  },

  // ========== 现象学结构分析 ==========

  /**
   * 分析现象学结构
   */
  analyzePhenomenalStructure(input) {
    return {
      temporal: this.analyzeTemporalStructure(input),
      spatial: this.analyzeSpatialStructure(input),
      attentional: this.analyzeAttentionalFocus(input),
      horizonal: this.analyzeHorizonalAwareness(input)
    };
  },

  /**
   * 分析时间结构
   */
  analyzeTemporalStructure(input) {
    const temporalMarkers = {
      past: ['过去', '曾经', '以前', '记得', 'past', 'used to', 'before', 'remember'],
      present: ['现在', '此刻', '当下', '现在', 'now', 'present', 'currently', 'moment'],
      future: ['将来', '以后', '计划', '希望', 'future', 'will', 'plan', 'hope']
    };
    
    const scores = {};
    for (const [tense, markers] of Object.entries(temporalMarkers)) {
      scores[tense] = markers.reduce((c, m) => c + (input.toLowerCase().includes(m.toLowerCase()) ? 1 : 0), 0);
    }
    
    const total = Object.values(scores).reduce((a, b) => a + b, 0);
    
    return {
      scores,
      dominant: Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b),
      integration: total > 1 ? 'multi-temporal' : 'single-temporal',
      depth: total / input.length
    };
  },

  /**
   * 分析空间结构
   */
  analyzeSpatialStructure(input) {
    const spatialMarkers = {
      proximal: ['这里', '这个', '近', 'here', 'this', 'near', 'close'],
      distal: ['那里', '那个', '远', 'there', 'that', 'far', 'distant'],
      embodied: ['身体', '手', '脚', '感觉', 'body', 'hand', 'foot', 'feel'],
      environmental: ['房间', '地方', '空间', '环境', 'room', 'place', 'space', 'environment']
    };
    
    const scores = {};
    for (const [type, markers] of Object.entries(spatialMarkers)) {
      scores[type] = markers.reduce((c, m) => c + (input.toLowerCase().includes(m.toLowerCase()) ? 1 : 0), 0);
    }
    
    return {
      scores,
      present: Object.values(scores).some(s => s > 0),
      embodiment: scores.embodied > 0,
      scope: scores.proximal > scores.distal ? 'proximal' : 'distal'
    };
  },

  /**
   * 分析注意力焦点
   */
  analyzeAttentionalFocus(input) {
    const focusIndicators = {
      focal: ['专注', '注意', '集中', 'focus', 'attention', 'concentrate'],
      marginal: ['背景', '边缘', '模糊', 'background', 'margin', 'blur'],
      shifting: ['转移', '变化', '移动', 'shift', 'change', 'move']
    };
    
    const scores = {};
    for (const [type, markers] of Object.entries(focusIndicators)) {
      scores[type] = markers.reduce((c, m) => c + (input.toLowerCase().includes(m.toLowerCase()) ? 1 : 0), 0);
    }
    
    return {
      scores,
      dominant: Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b),
      clarity: scores.focal / Math.max(1, scores.focal + scores.marginal)
    };
  },

  /**
   * 分析边缘意识 (Horizonal Awareness)
   */
  analyzeHorizonalAwareness(input) {
    const horizonMarkers = {
      internal: ['内心', '内在', '感觉', 'inner', 'internal', 'feeling'],
      external: ['外面', '外部', '世界', 'outer', 'external', 'world'],
      implicit: ['可能', '也许', '背景', 'maybe', 'perhaps', 'background']
    };
    
    const scores = {};
    for (const [type, markers] of Object.entries(horizonMarkers)) {
      scores[type] = markers.reduce((c, m) => c + (input.toLowerCase().includes(m.toLowerCase()) ? 1 : 0), 0);
    }
    
    return {
      scores,
      breadth: Object.values(scores).filter(s => s > 0).length / 3,
      integration: (scores.internal > 0 && scores.external > 0) ? 'integrated' : 'partial'
    };
  },

  // ========== 意识层次评估 ==========

  /**
   * 评估意识层次
   * 
   * 基于 SEP Consciousness 的层次模型：
   * 1. Sentience (感受性)
   * 2. Wakefulness (觉醒)
   * 3. Phenomenal Consciousness (现象意识)
   * 4. Access Consciousness (取用意识)
   * 5. Self-Consciousness (自我意识)
   * 
   * @param {string} input - 用户输入
   * @returns {object} 意识层次评估
   */
  assessConsciousnessLevel(input) {
    const levels = [
      { name: 'Sentience', nameCn: '感受性', check: () => this.detectSentience(input) },
      { name: 'Wakefulness', nameCn: '觉醒', check: () => this.detectWakefulness(input) },
      { name: 'Phenomenal', nameCn: '现象意识', check: () => this.detectPhenomenalConsciousness(input) },
      { name: 'Access', nameCn: '取用意识', check: () => this.detectAccessConsciousness(input) },
      { name: 'Self-conscious', nameCn: '自我意识', check: () => this.detectSelfConsciousness(input) }
    ];
    
    const results = levels.map((level, index) => ({
      level: index + 1,
      name: level.name,
      nameCn: level.nameCn,
      present: level.check(),
      indicators: this.getLevelIndicators(input, index + 1)
    }));
    
    const highestLevel = results.filter(r => r.present).pop()?.level || 0;
    
    return {
      levels: results,
      highest: highestLevel,
      highestName: highestLevel > 0 ? results[highestLevel - 1].nameCn : 'None',
      suggestions: this.getConsciousnessSuggestions(highestLevel)
    };
  },

  detectSentience(input) {
    const sentienceMarkers = ['感觉', '感到', 'feel', 'sense', 'sensation'];
    return sentienceMarkers.some(m => input.toLowerCase().includes(m.toLowerCase()));
  },

  detectWakefulness(input) {
    const wakefulnessMarkers = ['清醒', '意识', '觉察', 'aware', 'awake', 'conscious'];
    return wakefulnessMarkers.some(m => input.toLowerCase().includes(m.toLowerCase()));
  },

  detectPhenomenalConsciousness(input) {
    const phenomenalMarkers = ['体验', '经历', '什么感觉', 'experience', 'what it is like', 'feel like'];
    return phenomenalMarkers.some(m => input.toLowerCase().includes(m.toLowerCase()));
  },

  detectAccessConsciousness(input) {
    const accessMarkers = ['知道', '意识到', '报告', 'know', 'aware', 'report', 'describe'];
    return accessMarkers.some(m => input.toLowerCase().includes(m.toLowerCase()));
  },

  detectSelfConsciousness(input) {
    const selfMarkers = ['我自己', '我意识', '自我', '反思', 'myself', 'self-aware', 'reflect', 'meta'];
    return selfMarkers.some(m => input.toLowerCase().includes(m.toLowerCase()));
  },

  getLevelIndicators(input, level) {
    const indicators = {
      1: ['基本感知能力', '对刺激有反应'],
      2: ['清醒状态', '能够响应环境'],
      3: ['有主观体验', "有'是什么感觉'的质感"],
      4: ['可报告体验', '可访问心理内容'],
      5: ['意识到自己在意识', '元认知能力']
    };
    return indicators[level] || [];
  },

  getConsciousnessSuggestions(level) {
    const suggestions = {
      0: ['建议从基础的正念练习开始，培养对体验的基本觉察'],
      1: ['可以尝试描述感官体验的细节，提升感受性粒度'],
      2: ['练习区分不同的意识状态，如清醒、梦境、冥想'],
      3: ['尝试用语言描述主观体验，增强取用意识'],
      4: ['进行元认知反思，观察自己的思维过程'],
      5: ['深化自我探究，探索主体性的本质']
    };
    return suggestions[level] || suggestions[5];
  },

  // ========== 第一人称视角测量 ==========

  /**
   * 测量第一人称视角
   */
  measureFirstPersonPerspective(input) {
    const firstPersonMarkers = ['我', '我的', '自己', 'I', 'my', 'myself', 'me'];
    const thirdPersonMarkers = ['他', '她', '它', '他们', 'he', 'she', 'it', 'they'];
    
    const firstPersonCount = firstPersonMarkers.reduce((c, m) => c + (input.match(new RegExp(m, 'g')) || []).length, 0);
    const thirdPersonCount = thirdPersonMarkers.reduce((c, m) => c + (input.match(new RegExp(m, 'g')) || []).length, 0);
    const total = firstPersonCount + thirdPersonCount;
    
    const score = total > 0 ? firstPersonCount / total : 0.5;
    
    const immersion = score > 0.7 ? 'high' : score > 0.4 ? 'medium' : 'low';
    
    return {
      score,
      firstPersonCount,
      thirdPersonCount,
      immersion,
      markers: {
        firstPerson: firstPersonMarkers.filter(m => input.includes(m)),
        thirdPerson: thirdPersonMarkers.filter(m => input.includes(m))
      }
    };
  }
};

module.exports = PhenomenologicalConsciousnessModule;
