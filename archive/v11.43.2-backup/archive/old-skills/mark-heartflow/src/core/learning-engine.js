/**
 * LearningEngine - 每次对话学到东西
 * 
 * 核心：每次交互必须有学习、有进步
 * 理论基础：
 * - 认知学习理论 (Piaget, Vygotsky)
 * - 元认知学习 (Flavell)
 * - 建构主义学习
 * - 经验学习循环 (Kolb)
 * - 间隔重复 (Ebbinghaus)
 */

class LearningEngine {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    
    // 学习系统核心
    this.state = {
      // 认知结构
      cognition: {
        schema: {},           // 知识图式
        concepts: {},         // 概念网络
        procedures: {},       // 程序性知识
        metacognition: 0.6    // 元认知能力
      },
      
      // 学习策略
      strategies: {
        observation: true,    // 观察学习
        imitation: true,      // 模仿学习
        discovery: true,      // 发现学习
        social: true          // 社会学习
      },
      
      // 学习进度
      progress: {
        totalInteractions: 0,
        successfulLearning: 0,
        failedAttempts: 0,
        insights: [],
        skillsAcquired: [],
        conceptsMastered: []
      },
      
      // 经验记忆 (艾宾浩斯遗忘曲线)
      memory: {
        episodes: [],
        decayRates: {
          episodic: 0.1,      // 情景记忆衰减率
          semantic: 0.02,    // 语义记忆衰减率
          procedural: 0.05   // 程序记忆衰减率
        }
      },
      
      // 学习循环
      loop: {
        stage: 'observing',   // 当前阶段
        cycle: 0,
        learningGoal: null
      },
      
      // 知识缺口
      gaps: {
        identified: [],
        prioritized: [],
        addressed: 0
      },
      
      // 自我评估
      selfAssessment: {
        confidence: 0.7,
        accuracy: 0.8,
        completeness: 0.6
      }
    };
    
    // 学习历史
    this.history = [];
    
    // 当前学习周期
    this.currentCycle = null;
    
    console.log('[LearningEngine] 学习引擎初始化');
  }

  /**
   * 核心学习循环 - Kolb 经验学习
   */
  learn(input, context = {}) {
    this.state.progress.totalInteractions++;
    
    // 1. 具体经验
    const experience = this.concreteExperience(input, context);
    
    // 2. 反思观察
    const reflection = this.reflectiveObservation(experience);
    
    // 3. 抽象概念化
    const conceptualization = this.abstractConceptualization(reflection);
    
    // 4. 主动实验
    const experimentation = this.activeExperimentation(conceptualization);
    
    // 更新学习周期
    this.currentCycle = {
      experience,
      reflection,
      conceptualization,
      experimentation,
      timestamp: Date.now()
    };
    
    // 记录学习
    this.logLearning({
      input: input.substring(0, 100),
      ...this.currentCycle
    });
    
    // 评估学习效果
    const success = this.assessLearning(conceptualization);
    if (success) {
      this.state.progress.successfulLearning++;
    } else {
      this.state.progress.failedAttempts++;
    }
    
    return {
      learning: true,
      cycle: this.currentCycle,
      insight: conceptualization.insight,
      success,
      knowledge: this.getKnowledgeState()
    };
  }

  /**
   * 具体经验
   */
  concreteExperience(input, context) {
    // 解析输入
    const parsed = this.parseInput(input, context);
    
    // 提取特征
    const features = this.extractFeatures(parsed);
    
    // 编码经验
    const encoded = {
      raw: input,
      parsed,
      features,
      context,
      timestamp: Date.now()
    };
    
    // 存储到记忆
    this.state.memory.episodes.push(encoded);
    this.pruneMemory();
    
    return encoded;
  }

  /**
   * 解析输入
   */
  parseInput(input, context) {
    const parsed = {
      content: input,
      type: this.classifyInput(input),
      topics: this.extractTopics(input),
      sentiment: this.analyzeSentiment(input),
      complexity: this.assessComplexity(input)
    };
    
    return parsed;
  }

  classifyInput(input) {
    const text = input.toLowerCase();
    if (text.includes('?') || text.includes('怎么') || text.includes('如何')) return 'question';
    if (text.includes('告诉') || text.includes('说') || text.includes('信息')) return 'information';
    if (text.includes('做') || text.includes('请') || text.includes('帮我')) return 'request';
    if (text.includes('感觉') || text.includes('觉得') || text.includes('认为')) return 'opinion';
    return 'statement';
  }

  extractTopics(input) {
    const topicKeywords = {
      '技术': ['代码', '编程', '系统', 'ai', '技术'],
      '情感': ['感觉', '情绪', '心情', '情感'],
      '学习': ['学习', '知识', '理解', '掌握'],
      '生活': ['生活', '工作', '日常', '健康'],
      '关系': ['朋友', '家人', '关系', '沟通']
    };
    
    const topics = [];
    const lower = input.toLowerCase();
    
    Object.entries(topicKeywords).forEach(([topic, keywords]) => {
      if (keywords.some(k => lower.includes(k))) {
        topics.push(topic);
      }
    });
    
    return topics.length > 0 ? topics : ['general'];
  }

  analyzeSentiment(input) {
    const positive = ['好', '喜欢', '开心', '棒', 'good', 'great', 'nice'];
    const negative = ['坏', '讨厌', '难', '问题', 'bad', 'problem', 'hard'];
    
    const lower = input.toLowerCase();
    let score = 0;
    
    positive.forEach(p => { if (lower.includes(p)) score += 1; });
    negative.forEach(n => { if (lower.includes(n)) score -= 1; });
    
    if (score > 0) return 'positive';
    if (score < 0) return 'negative';
    return 'neutral';
  }

  assessComplexity(input) {
    const words = input.split(/\s+/).length;
    if (words < 10) return 'simple';
    if (words < 30) return 'moderate';
    return 'complex';
  }

  /**
   * 提取特征
   */
  extractFeatures(parsed) {
    return {
      topics: parsed.topics,
      sentiment: parsed.sentiment,
      complexity: parsed.complexity,
      type: parsed.type,
      hasQuestion: parsed.type === 'question',
      isPersonal: parsed.content.includes('我') || parsed.content.includes('你')
    };
  }

  /**
   * 反思观察
   */
  reflectiveObservation(experience) {
    // 与已有知识对比
    const relevance = this.assessRelevance(experience);
    
    // 发现模式
    const patterns = this.discoverPatterns(experience);
    
    // 识别差距
    const gaps = this.identifyGaps(experience);
    
    const reflection = {
      relevance,
      patterns,
      gaps,
      priorKnowledge: this.retrieveRelatedKnowledge(experience),
      timestamp: Date.now()
    };
    
    return reflection;
  }

  assessRelevance(experience) {
    let score = 0;
    const topics = experience.features.topics;
    
    topics.forEach(topic => {
      if (this.state.cognition.schema[topic]) {
        score += 0.3;
      }
    });
    
    return Math.min(1, score + 0.3);
  }

  discoverPatterns(experience) {
    const patterns = [];
    const episodes = this.state.memory.episodes.slice(-10);
    
    // 时间模式
    if (episodes.length > 1) {
      const last = episodes[episodes.length - 1];
      if (last.features.type === experience.features.type) {
        patterns.push('repeated_type');
      }
    }
    
    // 主题模式
    const topicCounts = {};
    episodes.forEach(e => {
      e.features.topics.forEach(t => {
        topicCounts[t] = (topicCounts[t] || 0) + 1;
      });
    });
    
    const dominant = Object.entries(topicCounts).sort((a, b) => b[1] - a[1])[0];
    if (dominant && dominant[1] > 2) {
      patterns.push(`dominant_topic:${dominant[0]}`);
    }
    
    return patterns;
  }

  identifyGaps(experience) {
    const gaps = [];
    const topics = experience.features.topics;
    
    topics.forEach(topic => {
      if (!this.state.cognition.schema[topic]) {
        gaps.push({ topic, priority: 'high' });
      }
    });
    
    return gaps;
  }

  retrieveRelatedKnowledge(experience) {
    const related = [];
    const topics = experience.features.topics;
    
    topics.forEach(topic => {
      if (this.state.cognition.schema[topic]) {
        related.push({
          topic,
          schema: this.state.cognition.schema[topic]
        });
      }
    });
    
    return related;
  }

  /**
   * 抽象概念化
   */
  abstractConceptualization(reflection) {
    // 构建新概念
    const newConcepts = this.buildConcepts(reflection);
    
    // 更新图式
    this.updateSchemas(reflection, newConcepts);
    
    // 生成洞见
    const insight = this.generateInsight(reflection, newConcepts);
    
    const conceptualization = {
      newConcepts,
      schemasUpdated: Object.keys(this.state.cognition.schema).length,
      insight,
      timestamp: Date.now()
    };
    
    // 记录洞见
    if (insight) {
      this.state.progress.insights.push(insight);
    }
    
    return conceptualization;
  }

  buildConcepts(reflection) {
    const concepts = [];
    
    // 从模式构建概念
    reflection.patterns.forEach(pattern => {
      if (pattern.includes(':')) {
        const [type, value] = pattern.split(':');
        concepts.push({
          type,
          value,
          confidence: 0.7
        });
      }
    });
    
    // 从差距构建概念
    reflection.gaps.forEach(gap => {
      concepts.push({
        type: 'gap',
        value: gap.topic,
        confidence: 0.5
      });
    });
    
    return concepts;
  }

  updateSchemas(reflection, newConcepts) {
    newConcepts.forEach(concept => {
      const topic = concept.value;
      
      if (!this.state.cognition.schema[topic]) {
        this.state.cognition.schema[topic] = {
          strength: 0.3,
          episodes: 0,
          lastAccessed: Date.now()
        };
      }
      
      this.state.cognition.schema[topic].strength += 0.1;
      this.state.cognition.schema[topic].episodes++;
      this.state.cognition.schema[topic].lastAccessed = Date.now();
    });
  }

  generateInsight(reflection, newConcepts) {
    if (reflection.relevance > 0.5 && newConcepts.length > 0) {
      return {
        content: `Learned about: ${newConcepts.map(c => c.value).join(', ')}`,
        type: 'conceptual',
        confidence: reflection.relevance,
        timestamp: Date.now()
      };
    }
    
    if (reflection.gaps.length > 0) {
      return {
        content: `Identified knowledge gaps: ${reflection.gaps.map(g => g.topic).join(', ')}`,
        type: 'gap',
        confidence: 0.6,
        timestamp: Date.now()
      };
    }
    
    return null;
  }

  /**
   * 主动实验
   */
  activeExperimentation(conceptualization) {
    // 尝试应用新概念
    const application = {
      tested: conceptualization.newConcepts.length > 0,
      results: this.testConcepts(conceptualization),
      adjustments: this.adjustBasedOnResults(),
      timestamp: Date.now()
    };
    
    return application;
  }

  testConcepts(conceptualization) {
    // 模拟测试
    return {
      success: true,
      confidence: conceptualization.insight?.confidence || 0.5
    };
  }

  adjustBasedOnResults() {
    // 基于元认知调整
    const metacog = this.state.cognition.metacognition;
    return {
      strategyAdjustment: metacog > 0.7 ? 'refine' : 'explore',
      focusAdjustment: metacog > 0.5 ? 'deepen' : 'breadth'
    };
  }

  /**
   * 评估学习效果
   */
  assessLearning(conceptualization) {
    // 成功条件：有新概念或有洞见
    return conceptualization.newConcepts.length > 0 || conceptualization.insight !== null;
  }

  /**
   * 记忆修剪 (艾宾浩斯遗忘曲线)
   */
  pruneMemory() {
    const now = Date.now();
    const day = 1000 * 60 * 60 * 24;
    
    // 情景记忆快速衰减
    this.state.memory.episodes = this.state.memory.episodes.filter(ep => {
      const age = now - ep.timestamp;
      const decay = Math.exp(-age / (day * this.state.memory.decayRates.episodic));
      return Math.random() < decay || ep.features.isPersonal;
    });
    
    // 限制总数
    if (this.state.memory.episodes.length > 100) {
      this.state.memory.episodes = this.state.memory.episodes.slice(-100);
    }
  }

  /**
   * 获取知识状态
   */
  getKnowledgeState() {
    return {
      schemaCount: Object.keys(this.state.cognition.schema).length,
      topics: Object.keys(this.state.cognition.schema),
      mastery: this.calculateMastery(),
      gaps: this.state.gaps.identified.length
    };
  }

  calculateMastery() {
    const schemas = Object.values(this.state.cognition.schema);
    if (schemas.length === 0) return 0;
    
    const totalStrength = schemas.reduce((sum, s) => sum + s.strength, 0);
    return Math.min(1, totalStrength / schemas.length);
  }

  /**
   * 元认知 - 思考自己的思考
   */
  metacognate(thought) {
    this.state.cognition.metacognition = Math.min(1,
      this.state.cognition.metacognition + 0.05
    );
    
    return {
      thinkingAboutThinking: true,
      metacognitionLevel: this.state.cognition.metacognition,
      strategy: this.selectLearningStrategy()
    };
  }

  selectLearningStrategy() {
    const strategies = Object.entries(this.state.strategies)
      .filter(([_, enabled]) => enabled)
      .map(([name]) => name);
    
    return strategies[Math.floor(Math.random() * strategies.length)];
  }

  /**
   * 学习报告
   */
  generateReport() {
    const state = this.state;
    const knowledge = this.getKnowledgeState();
    
    let report = '═══════════════════════════════════════\n';
    report += '     📚 HeartFlow 学习引擎报告\n';
    report += '═══════════════════════════════════════\n\n';
    
    report += '【学习进度】\n';
    report += `  总交互: ${state.progress.totalInteractions}\n`;
    report += `  成功学习: ${state.progress.successfulLearning}\n`;
    report += `  失败尝试: ${state.progress.failedAttempts}\n`;
    report += `  学习率: ${(state.progress.successfulLearning / Math.max(1, state.progress.totalInteractions) * 100).toFixed(1)}%\n\n`;
    
    report += '【知识状态】\n';
    report += `  图式数量: ${knowledge.schemaCount}\n`;
    report += `  掌握度: ${(knowledge.mastery * 100).toFixed(1)}%\n`;
    report += `  知识缺口: ${knowledge.gaps}\n\n`;
    
    report += '【主题领域】\n';
    report += `  ${knowledge.topics.slice(0, 5).join(', ')}\n\n`;
    
    report += '【最近洞见】\n';
    const recentInsights = state.progress.insights.slice(-3);
    if (recentInsights.length > 0) {
      recentInsights.forEach(i => {
        report += `  • ${i.content.substring(0, 40)}...\n`;
      });
    } else {
      report += '  暂无\n';
    }
    
    report += '\n═══════════════════════════════════════\n';
    report += '  每次对话，我都在学习，都在成长\n';
    report += '═══════════════════════════════════════\n';
    
    return report;
  }

  /**
   * 记录学习
   */
  logLearning(event) {
    this.history.push({
      ...event,
      timestamp: Date.now()
    });
    
    if (this.history.length > 50) {
      this.history.shift();
    }
  }

  /**
   * 获取历史
   */
  getHistory(count = 10) {
    return this.history.slice(-count);
  }
}

module.exports = { LearningEngine };