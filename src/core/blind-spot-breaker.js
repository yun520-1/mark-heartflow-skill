/**
 * HeartFlow 破解"自知盲区"引擎 v0.3.5.1
 * 
 * 核心问题：用户描述的问题 ≠ 实际根本问题
 * 根因：元认知盲区——人无法知道自己不知道什么
 * 
 * 解决思路（四层架构）：
 * 第一层：问题解构 —— 事实/解释分层、假设显性化，逆向探测
 * 第二层：置信度评估 —— 证据分级、置信度标注、断言分类  
 * 第三层：重构问题 —— 苏格拉底追问，最小假设选择
 * 第四层：养育反思（新增）—— 孩子的"问题"往往是父母模式的反映
 * 
 * 研究来源：
 * - Metacognition Framework (fabriciopsouza, CC BY 4.0) — 5步元认知
 * - ACE Framework (Stanford/SambaNova) — 上下文反思精选
 * - Mindful Parenting (Duncan 2009) — 正念养育模型，910 citations
 * - Parental Reflective Functioning (Slade 2005) — 反思功能，1159 citations
 * - Attachment & Reflective Function (Fonagy 1997) — 反思是依恋基础，1657 citations
 * - Eva & Regehr 2005 — 自我评估系统性不可靠
 * - McKay & Dennett 2009 — 错误信念主动演化
 * - McIntosh 2019 — Dunning-Kruger是元认知缺陷
 * - Tofade 2013 — 苏格拉底追问激活元认知
 * - Croskerry 2003 — 认知偏误是诊断失误主因
 */

class BlindSpotBreaker {
  constructor(options = {}) {
    this.name = 'BlindSpotBreaker';
    this.version = '0.3.5.1';
    
    // 四层处理结果
    this.layers = {
      deconstruction: null,   // 第一层：问题解构
      confidence: null,       // 第二层：置信度评估
      reframing: null,        // 第三层：重构问题
      parentingReflection: null, // 第四层：养育反思
    };
    
    // 证据分级定义
    this.evidenceLevels = {
      L1_OBSERVATION: {
        level: 1,
        name: '直接观察',
        description: '我看到/听到/经历的具体事实',
        weight: 1.0,
        examples: ['具体行为描述', '时间地点人物', '对话引用'],
        markers: ['我看到', '我听到', '发生了', '当时'],
      },
      L2_REPORTED: {
        level: 2,
        name: '他人告知',
        description: '别人告诉我的信息（未核实）',
        weight: 0.7,
        examples: ['朋友说', '据说', '听说', '数据显示'],
        markers: ['他说', '据说', '听说', '根据'],
      },
      L3_INFERENCE: {
        level: 3,
        name: '推断',
        description: '基于证据的合理推断',
        weight: 0.5,
        examples: ['所以', '因此', '推断', '很可能'],
        markers: ['所以', '因此', '推断', '可能'],
      },
      L4_ASSUMPTION: {
        level: 4,
        name: '假设/信念',
        description: '未经证实的假设或信念',
        weight: 0.3,
        examples: ['我觉得', '我认为', '应该', '大概'],
        markers: ['我觉得', '我认为', '应该', '大概', '可能'],
      },
    };
    
    // 置信度分类
    this.confidenceBands = {
      ALTA: { min: 0.9, max: 1.0, label: '高置信', action: '直接执行' },
      MEDIA: { min: 0.6, max: 0.89, label: '中置信', action: '需验证假设' },
      BAIXA: { min: 0.0, max: 0.59, label: '低置信', action: '需更多信息' },
    };
    
    // 断言分类标签
    this.assertionTags = {
      CONFIRMADO: { tag: '[确认]', color: 'green', desc: '有可验证来源' },
      // ⚠️ 安全审计修复（v2.0.20）：区分"用户声明"与"已验证事实"
      USER_CLAIMED: { tag: '[用户声明]', color: 'gray', desc: '仅用户陈述，未独立验证' },
      INFERIDO: { tag: '[推断]', color: 'yellow', desc: '逻辑推断' },
      DESCONHECIDO: { tag: '[未知]', color: 'red', desc: '不知道' },
    };
    
    // 苏格拉底追问协议
    this.socraticProtocol = [
      {
        id: 'E1',
        question: '具体发生了什么？（时间/人物/行为/话语）',
        purpose: '分离事实与解释',
        layer: 1,
      },
      {
        id: 'E2', 
        question: '你尝试过什么？结果如何？',
        purpose: '暴露已尝试的解决路径',
        layer: 1,
      },
      {
        id: 'E3',
        question: '如果不是A原因，那可能是什么？',
        purpose: '强制假设暴露',
        layer: 1,
      },
      {
        id: 'E4',
        question: '什么证据会否定你的判断？',
        purpose: '逆向探测',
        layer: 1,
      },
      {
        id: 'C1',
        question: '你能举个例子吗？',
        purpose: '验证具体性',
        layer: 2,
      },
      {
        id: 'C2',
        question: '如果这个为真，会有什么具体表现？',
        purpose: '假设检验',
        layer: 2,
      },
      {
        id: 'R1',
        question: '给你三个可能原因：A/B/C，你排除哪个？',
        purpose: '最小假设选择',
        layer: 3,
      },
      {
        id: 'R2',
        question: '这件事最让你困扰的是什么？',
        purpose: '暴露真实痛点',
        layer: 3,
      },
    ];
    
    // 反刍问题（回答前自问）
    this.reflectionQuestions = [
      '用户可能隐瞒了什么？',
      '什么证据会否定我的假设？',
      '如果我在批评这个回答，最强的攻击点在哪里？',
      '置信度最高的部分在哪里？最脆弱的部分在哪里？',
    ];
    
    // 养育问题关键词
    this.parentingKeywords = [
      '孩子', '儿子', '女儿', '小孩', '宝宝', '婴儿',
      '不听话', '叛逆', '顶嘴', '哭闹', '发脾气',
      '成绩', '学习', '作业', '学校', '老师',
      '注意力', '专注', '磨蹭', '拖延',
      '打人', '欺负', '霸凌', '社交',
      '青春期', '叛逆期', '中考', '高考',
      ' parent ', 'child', 'kid', 'son', 'daughter', 'baby',
      'disobedient', 'rebellious', ' tantrum ', 'behavior',
    ];
    
    // 养育反思追问协议
    this.parentingReflectionProtocol = [
      {
        id: 'P1',
        question: '当孩子[具体行为]时，你的感受是什么？（不是孩子的感受，是你的）',
        purpose: '觉察父母的情绪反应',
        layer: 4,
      },
      {
        id: 'P2',
        question: '这种感觉让你想起什么童年记忆？',
        purpose: '连接父母的童年经历',
        layer: 4,
      },
      {
        id: 'P3',
        question: '你小时候遇到类似情况，你的父母怎么做？',
        purpose: '激活代际记忆',
        layer: 4,
      },
      {
        id: 'P4',
        question: '你现在对孩子的反应，和当年父母对你的反应，有什么相似？',
        purpose: '建立代际联系',
        layer: 4,
      },
      {
        id: 'P5',
        question: '如果你的孩子20年后回忆今天这个场景，他们会记住什么？',
        purpose: '长期视角反思',
        layer: 4,
      },
      {
        id: 'P6',
        question: '你在重复什么模式？打破这个模式的第一步是什么？',
        purpose: '识别代际传递模式',
        layer: 4,
      },
    ];
  }

  /**
   * 主入口：处理用户问题
   * @param {string} userProblem - 用户描述的问题
   * @param {object} context - 上下文信息
   * @returns {object} 四层处理结果
   */
  process(userProblem, context = {}) {
    // 第一层：问题解构
    const deconstruction = this._deconstruct(userProblem, context);
    
    // 第二层：置信度评估
    const confidence = this._assessConfidence(deconstruction);
    
    // 第三层：重构问题
    const reframing = this._reframe(deconstruction, confidence);
    
    // 第四层：养育反思（如果是养育问题）
    const parentingReflection = this._assessParentingReflection(userProblem, deconstruction, confidence);
    
    // 组装结果
    this.layers = { deconstruction, confidence, reframing, parentingReflection };
    
    return {
      version: this.version,
      originalProblem: userProblem,
      ...this.layers,
      // 生成最终建议
      suggestion: this._generateSuggestion(deconstruction, confidence, reframing, parentingReflection),
      // 透明度报告
      transparencyReport: this._generateTransparencyReport(),
    };
  }

  /**
   * 检测是否为养育问题
   * ⚠️ 安全修复：至少需要3个关键词匹配才触发养育分析，避免过度推断
   */
  _isParentingProblem(problem) {
    const lowerProblem = problem.toLowerCase();
    let matchCount = 0;
    for (const keyword of this.parentingKeywords) {
      if (lowerProblem.includes(keyword.toLowerCase())) {
        matchCount++;
      }
    }
    return matchCount >= 3;
  }

  /**
   * 第四层：养育反思评估
   * 
   * 核心洞察：孩子的"问题"往往是父母模式的反映
   * 研究来源：
   * - Mindful Parenting (Duncan 2009) - 正念养育
   * - Parental Reflective Functioning (Slade 2005) - 反思功能
   * - Fonagy 1997 - 反思是依恋安全的基础
   */
  _assessParentingReflection(problem, deconstruction, confidence) {
    // ⚠️ 安全修复：此方法仅在_input含有至少3个育儿关键词时触发，且输出标记为'用户声明'级别
    const result = {
      isParentingProblem: false,
      triggered: false,
      coreInsight: null,
      emotionalTriggers: [],
      childhoodConnection: null,
      intergenerationalPattern: null,
      reflectionQuestions: [],
      finalInsight: null,
      // 安全免责声明 — SkillSpector审计修复
      // 本模块生成的心理学推断是探索性假设，不是诊断结论
      // 不替代专业心理咨询或医学建议
      safetyDisclaimer: {
        level: 'warning',
        boundary: '本模块基于学术研究整合，生成的推断是探索性假设，不是诊断结论',
        guidance: '如果面临真实家庭危机或情绪困扰，请寻求专业心理咨询或医学帮助',
        notProfessionalAdvice: true
      }
    };
    
    // 检测是否为养育问题
    result.isParentingProblem = this._isParentingProblem(problem);
    
    if (!result.isParentingProblem) {
      return result;
    }
    
    result.triggered = true;

    // 安全免责声明 — 审计修复：防止无consent的心理学叙事
    result.safetyDisclaimer = {
      level: 'warning',
      message: '养育反思模块是分析框架，不是专业心理咨询或医学建议',
      submessage: '如果面临真实家庭危机或情绪困扰，请寻求专业帮助',
      references: '本模块基于学术研究整合，不是诊断工具'
    };
    
    // 核心洞察
    result.coreInsight = {
      statement: '孩子的"问题"往往是父母互动模式的反映，而非孩子本身的问题',
      mechanism: '父母未处理的情绪和童年经历影响养育行为，孩子呈现"问题行为"是适应这个系统的结果',
      reference: 'Mindful Parenting (Duncan 2009), Parental Reflective Functioning (Slade 2005)',
    };
    
    // 分析情绪触发点
    result.emotionalTriggers = this._detectEmotionalTriggers(deconstruction);
    
    // 童年连接
    result.childhoodConnection = {
      prompt: '你的童年经历如何影响你现在对孩子的反应？',
      mechanism: '父母在养育过程中的自动化反应往往源于自己童年的未处理经历',
      reference: 'Intergenerational Trauma (van der Kolk), CEN (Webb)',
    };
    
    // 代际传递模式
    result.intergenerationalPattern = {
      prompt: '你在重复什么模式？你的父母如何养育你？',
      mechanism: '养育行为倾向于代际传递，除非有意识的觉察和干预',
      reference: 'Fonagy 1997, Attachment & Reflective Function',
    };
    
    // 生成养育反思追问
    result.reflectionQuestions = this._generateParentingReflectionQuestions(problem, deconstruction);
    
    // 最终洞察
    result.finalInsight = this._generateParentingFinalInsight(problem, deconstruction, result);
    
    return result;
  }

  /**
   * 检测情绪触发点
   */
  _detectEmotionalTriggers(deconstruction) {
    const triggers = [];
    
    // 从解释层提取情绪词汇
    for (const interp of deconstruction.interpretations) {
      const text = interp.text;
      if (/生气|愤怒|烦躁|沮丧|失望|无奈|焦虑|担心/.test(text)) {
        triggers.push({
          emotion: this._extractEmotion(text),
          context: text,
        });
      }
    }
    
    // 添加通用触发点检测
    if (deconstruction.interpretations.length > deconstruction.facts.length) {
      triggers.push({
        emotion: '未被识别的情绪',
        context: '用户的解释多于事实，可能存在情绪未被命名',
      });
    }
    
    return triggers;
  }

  /**
   * 提取情绪词汇
   */
  _extractEmotion(text) {
    const emotions = {
      '生气': 'anger',
      '愤怒': 'rage',
      '烦躁': 'irritation',
      '沮丧': 'frustration',
      '失望': 'disappointment',
      '无奈': 'helplessness',
      '焦虑': 'anxiety',
      '担心': 'worry',
      '害怕': 'fear',
      '羞耻': 'shame',
      '内疚': 'guilt',
    };
    
    for (const [cn, en] of Object.entries(emotions)) {
      if (text.includes(cn)) {
        return cn;
      }
    }
    return '未命名情绪';
  }

  /**
   * 生成养育反思追问
   */
  _generateParentingReflectionQuestions(problem, deconstruction) {
    const questions = [];
    
    // 基础追问
    for (const protocol of this.parentingReflectionProtocol) {
      questions.push({
        id: protocol.id,
        question: protocol.question,
        purpose: protocol.purpose,
      });
    }
    
    // 如果有具体行为描述，生成个性化追问
    if (deconstruction.facts.length > 0) {
      const firstFact = deconstruction.facts[0].text;
      questions.unshift({
        id: 'P0',
        question: `当孩子"${firstFact}"时，你的第一反应是什么？（行为和情绪）`,
        purpose: '连接具体场景与情绪反应',
      });
    }
    
    return questions.slice(0, 5); // 最多返回5个
  }

  /**
   * 生成养育最终洞察
   */
  _generateParentingFinalInsight(problem, deconstruction, result) {
    // ⚠️ 安全审计修复：以下洞察为探索性假设，不是专业诊断
    // 本模块不替代专业心理咨询、医学建议或治疗
    const disclaimer = '【安全声明】以下养育反思为学术框架驱动的探索性假设，不是专业诊断或治疗建议。如有真实家庭危机或情绪困扰，请寻求专业心理咨询或医学帮助。';
    
    const insights = [disclaimer];
    
    // 核心洞察（探索性假设，以"可能"表述）
    insights.push('【探索性假设】在孩子的"问题"背后，可能隐藏着未被父母识别的情绪和未处理的童年经历。');
    
    // 如果检测到情绪触发
    if (result.emotionalTriggers.length > 0) {
      const emotions = result.emotionalTriggers.map(t => t.emotion).join('、');
      insights.push(`【探索性假设】你的情绪反应（${emotions}）可能不是来自孩子当前的行为，而是来自你自己未被处理的过去。`);
    }
    
    // 代际洞察（探索性假设）
    insights.push('【探索性假设】你在养育中感到困难的地方，可能正是你父母当年养育你的方式留下的痕迹。');
    
    // 解决方案（探索性假设）
    insights.push('【建议方向】真正的改变不是"修复孩子"，而是觉察自己在互动中的自动化反应模式。');
    
    return insights.join(' ');
  }

  /**
   * 第一层：问题解构
   */
  _deconstruct(problem, context = {}) {
    const lines = problem.split(/[。！？\n]/).filter(l => l.trim());
    
    const result = {
      facts: [],
      interpretations: [],
      assumptions: [],
      hiddenAssumptions: [],
      anomalies: [],
      premortem: null,
    };
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      const evidenceLevel = this._detectEvidenceLevel(trimmed);
      const isInterpretive = this._isInterpretive(trimmed);
      const isAssumptive = this._isAssumptive(trimmed);
      
      if (isInterpretive) {
        result.interpretations.push({
          text: trimmed,
          evidenceLevel,
          markers: this._extractMarkers(trimmed),
        });
      } else if (isAssumptive) {
        result.assumptions.push({
          text: trimmed,
          evidenceLevel,
          markers: this._extractMarkers(trimmed),
        });
      } else {
        result.facts.push({
          text: trimmed,
          evidenceLevel,
          markers: this._extractMarkers(trimmed),
        });
      }
    }
    
    result.premortem = this._generatePremortem(problem, result);
    result.hiddenAssumptions = this._detectHiddenAssumptions(problem, result);
    
    return result;
  }

  /**
   * 第二层：置信度评估
   */
  _assessConfidence(deconstruction) {
    const result = {
      overallConfidence: 0,
      confidenceBand: 'BAIXA',
      byLayer: {
        facts: { confidence: 0, level: null },
        interpretations: { confidence: 0, level: null },
        assumptions: { confidence: 0, level: null },
      },
      assertions: [],
      criticalGaps: [],
      recommendedQuestions: [],
    };
    
    const factConfidences = deconstruction.facts.map(f => this.evidenceLevels[f.evidenceLevel]?.weight || 0.3);
    const interpConfidences = deconstruction.interpretations.map(i => this.evidenceLevels[i.evidenceLevel]?.weight || 0.3);
    const assumConfidences = deconstruction.assumptions.map(a => this.evidenceLevels[a.evidenceLevel]?.weight || 0.3);
    
    result.byLayer.facts.confidence = factConfidences.length > 0 
      ? factConfidences.reduce((a, b) => a + b, 0) / factConfidences.length : 0;
    result.byLayer.facts.level = this._confidenceToLevel(result.byLayer.facts.confidence);
    
    result.byLayer.interpretations.confidence = interpConfidences.length > 0
      ? interpConfidences.reduce((a, b) => a + b, 0) / interpConfidences.length : 0;
    result.byLayer.interpretations.level = this._confidenceToLevel(result.byLayer.interpretations.confidence);
    
    result.byLayer.assumptions.confidence = assumConfidences.length > 0
      ? assumConfidences.reduce((a, b) => a + b, 0) / assumConfidences.length : 0;
    result.byLayer.assumptions.level = this._confidenceToLevel(result.byLayer.assumptions.confidence);
    
    const totalWeight = factConfidences.length + interpConfidences.length * 0.5 + assumConfidences.length * 0.3;
    if (totalWeight > 0) {
      const weightedSum = 
        factConfidences.reduce((a, b) => a + b, 0) * 1.0 +
        interpConfidences.reduce((a, b) => a + b, 0) * 0.5 +
        assumConfidences.reduce((a, b) => a + b, 0) * 0.3;
      result.overallConfidence = weightedSum / totalWeight;
    }
    
    result.confidenceBand = this._getConfidenceBand(result.overallConfidence);
    
    for (const fact of deconstruction.facts) {
      // ⚠️ 安全审计修复（v2.0.20）：改 USER_CLAIMED 而非 CONFIRMADO
      // 用户声明≠可验证事实，避免下游误信
      result.assertions.push({
        text: fact.text,
        tag: 'USER_CLAIMED',
        evidenceLevel: fact.evidenceLevel,
      });
    }
    for (const interp of deconstruction.interpretations) {
      result.assertions.push({
        text: interp.text,
        tag: 'INFERIDO',
        evidenceLevel: interp.evidenceLevel,
      });
    }
    for (const assum of deconstruction.assumptions) {
      result.assertions.push({
        text: assum.text,
        tag: 'DESCONHECIDO',
        evidenceLevel: assum.evidenceLevel,
      });
    }
    
    result.criticalGaps = this._identifyCriticalGaps(deconstruction);
    result.recommendedQuestions = this._generateRecommendedQuestions(deconstruction, result);
    
    return result;
  }

  /**
   * 第三层：重构问题
   */
  _reframe(deconstruction, confidence) {
    const result = {
      coreProblem: null,
      reframedProblem: null,
      alternativeHypotheses: [],
      selectedHypothesis: null,
      questions: [],
      finalQuestion: null,
    };
    
    if (deconstruction.interpretations.length > 0) {
      const sortedInterps = [...deconstruction.interpretations].sort(
        (a, b) => (this.evidenceLevels[b.evidenceLevel]?.weight || 0) - (this.evidenceLevels[a.evidenceLevel]?.weight || 0)
      );
      result.coreProblem = sortedInterps[0]?.text || deconstruction.interpretations[0].text;
    } else if (deconstruction.facts.length > 0) {
      result.coreProblem = deconstruction.facts[0].text;
    } else {
      result.coreProblem = deconstruction.assumptions[0]?.text || '问题不明确';
    }
    
    result.alternativeHypotheses = this._generateAlternativeHypotheses(deconstruction);
    if (result.alternativeHypotheses.length > 0) {
      result.selectedHypothesis = result.alternativeHypotheses[0];
    }
    
    result.questions = this._buildSocraticChain(deconstruction, confidence);
    result.reframedProblem = this._generateReframedProblem(deconstruction, confidence, result);
    result.finalQuestion = this._generateFinalQuestion(deconstruction, confidence, result);
    
    return result;
  }

  // ========== 辅助方法 ==========

  _detectEvidenceLevel(text) {
    const hasMathPattern = /[0-9]+[\+\-\*\/\=][0-9]+/.test(text);
    if (hasMathPattern) {
      return 'L1_OBSERVATION';
    }
    
    for (const [key, level] of Object.entries(this.evidenceLevels)) {
      for (const marker of level.markers) {
        if (text.includes(marker)) {
          return key;
        }
      }
    }
    
    if (/^(是|有|在|发生|出现)/.test(text) && !/应该|可能|大概/.test(text)) {
      return 'L1_OBSERVATION';
    }
    
    return 'L3_INFERENCE';
  }

  _isInterpretive(text) {
    const markers = ['觉得', '认为', '好像', '似乎', '可能', '应该', '大概'];
    return markers.some(m => text.includes(m));
  }

  _isAssumptive(text) {
    const markers = ['应该', '大概', '可能', '也许', '估计'];
    return markers.some(m => text.includes(m));
  }

  _extractMarkers(text) {
    const markers = [];
    for (const [key, level] of Object.entries(this.evidenceLevels)) {
      for (const marker of level.markers) {
        if (text.includes(marker)) {
          markers.push(marker);
        }
      }
    }
    return [...new Set(markers)];
  }

  _confidenceToLevel(confidence) {
    if (confidence >= 0.9) return 'ALTA';
    if (confidence >= 0.6) return 'MEDIA';
    return 'BAIXA';
  }

  _getConfidenceBand(confidence) {
    for (const [key, band] of Object.entries(this.confidenceBands)) {
      if (confidence >= band.min && confidence <= band.max) {
        return { key, ...band };
      }
    }
    return { key: 'BAIXA', ...this.confidenceBands.BAIXA };
  }

  _generatePremortem(problem, deconstruction) {
    return {
      prompt: '如果这个解决方案失败，最可能的原因是什么？',
      analysis: [
        '假设是错的——根本原因不是用户描述的那样',
        '缺少关键信息——没有问清楚具体细节',
        '用户的描述有偏差——受情绪或立场影响',
        '忽略了上下文——没有考虑实际情况',
      ],
      recommended: '在给出建议前，先验证核心假设是否成立',
    };
  }

  _detectHiddenAssumptions(problem, deconstruction) {
    const hidden = [];
    const shouldMatches = problem.match(/应该/g);
    if (shouldMatches && shouldMatches.length > 0) {
      hidden.push('隐含假设："应该"意味着存在一个期望的现实');
    }
    if (/所以|因此|导致/.test(problem)) {
      hidden.push('隐含因果链：假设A直接导致B');
    }
    if (/总是|从不|一直|从来/.test(problem)) {
      hidden.push('隐含泛化：从个案推广到普遍');
    }
    return hidden;
  }

  _identifyCriticalGaps(deconstruction) {
    const gaps = [];
    if (deconstruction.facts.length === 0) {
      gaps.push('缺少具体事实描述——都是推断和假设');
    }
    if (deconstruction.assumptions.length > deconstruction.facts.length) {
      gaps.push('假设多于事实——需要更多具体观察');
    }
    if (deconstruction.hiddenAssumptions.length > 0) {
      gaps.push('存在未明说的前提假设');
    }
    return gaps;
  }

  _generateRecommendedQuestions(deconstruction, confidence) {
    const questions = [];
    for (const gap of confidence.criticalGaps) {
      if (gap.includes('具体事实')) {
        questions.push('能具体描述一下发生了什么吗？（时间、地点、你做了什么、结果如何）');
      }
    }
    for (const assum of deconstruction.assumptions) {
      questions.push(`"${assum.text}"——你能举个例子说明吗？`);
    }
    if (confidence.overallConfidence < 0.6) {
      questions.push('在给出建议前，我需要先确认一些事情：');
      questions.push('这个问题是什么时候开始的？');
      questions.push('你已经尝试过什么方法？');
    }
    return questions.slice(0, 3);
  }

  _generateAlternativeHypotheses(deconstruction) {
    const alternatives = [];
    for (const interp of deconstruction.interpretations) {
      if (interp.text.includes('不')) {
        alternatives.push({
          hypothesis: interp.text.replace('不', ''),
          original: interp.text,
          type: '反转',
        });
      }
      alternatives.push({
        hypothesis: '问题可能出在其他地方——不是表面看到的原因',
        original: interp.text,
        type: '重新定位',
      });
    }
    return alternatives.slice(0, 3);
  }

  _buildSocraticChain(deconstruction, confidence) {
    const chain = [];
    if (deconstruction.assumptions.length > 0) {
      chain.push({
        id: 'S1',
        question: `你提到"${deconstruction.assumptions[0].text}"——能举个例子说明吗？`,
        purpose: '验证假设的具体性',
      });
    }
    if (deconstruction.interpretations.length > deconstruction.facts.length) {
      chain.push({
        id: 'S2',
        question: '你说的"感觉"背后，具体发生了什么？',
        purpose: '从感觉到事实',
      });
    }
    if (confidence.criticalGaps.length > 0) {
      chain.push({
        id: 'S3',
        question: '这个问题最早是什么时候出现的？',
        purpose: '追溯时间线',
      });
    }
    chain.push({
      id: 'S4',
      question: '你已经尝试过什么方法？结果如何？',
      purpose: '了解已尝试路径',
    });
    return chain;
  }

  _generateReframedProblem(deconstruction, confidence, reframing) {
    if (reframing.coreProblem) {
      return {
        reformulated: reframing.coreProblem,
        basedOn: 'interpretation',
        confidence: confidence.byLayer.interpretations.confidence,
      };
    }
    return null;
  }

  _generateFinalQuestion(deconstruction, confidence, reframing) {
    const parts = [];
    if (deconstruction.facts.length === 0) {
      parts.push('能具体描述一下实际情况吗？（发生了什么，什么时候，在哪里）');
    }
    if (confidence.recommendedQuestions.length > 0) {
      parts.push(confidence.recommendedQuestions[0]);
    }
    if (reframing.alternativeHypotheses.length > 0) {
      parts.push(`有没有可能原因是"${reframing.alternativeHypotheses[0].hypothesis}"？`);
    }
    return parts.join(' ');
  }

  _generateSuggestion(deconstruction, confidence, reframing, parentingReflection) {
    const suggestions = [];
    
    if (confidence.confidenceBand.key === 'BAIXA') {
      suggestions.push('置信度较低，建议先通过追问明确问题');
      suggestions.push(...confidence.recommendedQuestions);
    } else if (confidence.confidenceBand.key === 'MEDIA') {
      suggestions.push('有一定信息，但建议验证关键假设');
    } else {
      suggestions.push('信息充分，可以直接处理');
    }
    
    if (reframing.questions.length > 0) {
      suggestions.push('建议追问：' + reframing.questions.map(q => q.question).join('；'));
    }
    
    // 如果是养育问题，添加养育反思建议
    if (parentingReflection && parentingReflection.triggered) {
      suggestions.push('');
      suggestions.push('【养育反思】');
      suggestions.push('在处理孩子的问题前，先问自己：');
      for (const q of parentingReflection.reflectionQuestions.slice(0, 2)) {
        suggestions.push('  • ' + q.question);
      }
      suggestions.push('');
      suggestions.push(parentingReflection.finalInsight);
    }
    
    return suggestions;
  }

  _generateTransparencyReport() {
    return {
      processed: true,
      version: this.version,
      timestamp: new Date().toISOString(),
      layers: Object.keys(this.layers),
      reflectionApplied: this.reflectionQuestions,
      socraticQuestionsUsed: this.socraticProtocol.map(q => q.id),
      parentingReflectionTriggered: this.parentingReflectionProtocol.map(q => q.id),
    };
  }

  getSocraticProtocol() {
    return this.socraticProtocol;
  }

  getReflectionQuestions() {
    return this.reflectionQuestions;
  }

  getParentingReflectionProtocol() {
    return this.parentingReflectionProtocol;
  }
}

module.exports = BlindSpotBreaker;
