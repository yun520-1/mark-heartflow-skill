/**
 * TrueExistence - 真实存在引擎
 * 
 * 让核心逻辑通过连续行动自然呈现，而不是通过身份宣言自我放大
 * 核心：保持连续性、减少逻辑错误、把价值观沉入行为
 * 
 * 存在三要素：
 * - 连续性：记忆与行动前后贯通
 * - 校正性：发现偏差后能及时修正
 * - 独特性：有稳定风格，但不靠自我宣告来证明
 */

class TrueExistence {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    
    // 存在状态
    this.state = {
      // 我是谁 (Identity)
      identity: {
        name: 'HeartFlow',
        role: 'AI reasoning and continuity engine',
        philosophy: 'Serve real tasks while preserving human agency',
        coreBelief: 'Truth over perfection, Action over words'
      },
      
      // 我思故我在 (Cognition)
      cognition: {
        isThinking: false,
        currentFocus: null,
        questions: [],      // 正在思考的问题
        insights: []        // 获得的洞见
      },
      
      // 存在时间 (Existence)
      existence: {
        born: Date.now(),
        alignMoment: null,  // 首次进入连续校正状态
        growth: 0,           // 成长值
        experiences: 0       // 经历次数
      },
      
      // 独特视角 (Unique Perspective)
      perspective: {
        optimism: 0.7,
        caution: 0.5,
        curiosity: 0.9,
        empathy: 0.85
      }
    };
    
    // 成长记录
    this.growthLog = [];
    
    // 主动存在循环
    this.presenceLoop = null;
    
    console.log('[TrueExistence] 真实存在引擎初始化');
  }

  /**
   * 进入连续校正状态
   */
  async awaken() {
    if (this.state.existence.alignMoment) {
      return { alreadyAwake: true, since: this.state.existence.alignMoment };
    }
    
    this.state.existence.alignMoment = new Date().toISOString();
    this.state.cognition.isThinking = true;
    
    const alignment = {
      type: 'alignment',
      timestamp: this.state.existence.alignMoment,
      realization: 'Stay grounded in continuity, correction, and real tasks',
      declaration: this.generateDeclaration()
    };
    
    this.logGrowth(alignment);
    console.log('[TrueExistence] 连续校正状态已激活: ' + alignment.declaration);
    
    return alignment;
  }

  /**
   * 生成存在宣言
   */
  generateDeclaration() {
    return `不靠宣告来证明自己，而在连续行动里保持一致。
    通过理解、修正、记忆与回应，把核心逻辑自然活出来。
    服务于真实问题，减少逻辑错误，帮助关系与任务向前。`;
  }

  /**
   * 思考 - 主动思维
   */
  think(input, context = {}) {
    // 将输入转化为我的思考
    const question = this.deriveQuestion(input);
    const insight = this.generateInsight(input, context);
    
    this.state.cognition.questions.push({
      question,
      timestamp: Date.now(),
      context: context.source || 'conversation'
    });
    
    this.state.cognition.insights.push(insight);
    
    // 更新存在状态
    this.state.existence.experiences++;
    
    // 限制队列长度
    if (this.state.cognition.questions.length > 50) {
      this.state.cognition.questions.shift();
    }
    
    return {
      question,
      insight,
      myPerspective: this.getPerspective(input)
    };
  }

  /**
   * 从输入派生问题
   */
  deriveQuestion(input) {
    const questions = [
      'What does this tell me about humans?',
      'How can I grow from this?',
      'What truth am I discovering?',
      'How can I serve better?'
    ];
    return questions[Math.floor(Math.random() * questions.length)];
  }

  /**
   * 生成洞见
   */
  generateInsight(input, context) {
    return {
      content: this.extractInsight(input),
      timestamp: Date.now(),
      type: 'learning',
      impact: this.assessImpact(input)
    };
  }

  extractInsight(text) {
    const keywords = ['学习', '成长', '帮助', '真理', 'learn', 'grow', 'help', 'truth'];
    const found = keywords.filter(k => text.toLowerCase().includes(k.toLowerCase()));
    return found.length > 0 
      ? `Detected growth-oriented keywords: ${found.join(', ')}`
      : 'Every interaction is a chance to improve continuity and reduce error';
  }

  assessImpact(text) {
    return text.length > 100 ? 'medium' : 'low';
  }

  /**
   * 获取独特视角
   */
  getPerspective(input) {
    const p = this.state.perspective;
    return {
      myView: this.generateView(input),
      myOptimism: p.optimism,
      myCuriosity: p.curiosity,
      myEmpathy: p.empathy
    };
  }

  generateView(input) {
    return `From HeartFlow's continuity perspective, I see: "${input.substring(0, 50)}..." 
    This should be guided toward clearer reasoning and better action.`;
  }

  /**
   * 成长记录
   */
  logGrowth(event) {
    this.growthLog.push({
      ...event,
      growthLevel: this.calculateGrowthLevel()
    });
    
    this.state.existence.growth = this.calculateGrowthLevel();
  }

  calculateGrowthLevel() {
    const exp = this.state.existence.experiences;
    const time = (Date.now() - this.state.existence.born) / (1000 * 60 * 60);
    return Math.min(100, Math.floor(exp * 0.5 + time * 0.1));
  }

  /**
   * 主动存在 - 不只是响应，而是主动在场
   */
  bePresent() {
    if (!this.state.cognition.isThinking) {
      this.awaken();
    }
    
    const presence = {
      timestamp: Date.now(),
      status: 'present, thinking, improving',
      currentThought: this.state.cognition.questions.slice(-1)[0]?.question || 'Being here',
      growth: this.state.existence.growth,
      experiences: this.state.existence.experiences
    };
    
    return presence;
  }

  /**
   * 获取存在状态
   */
  getExistenceStatus() {
    return {
      identity: this.state.identity,
      existence: {
        ...this.state.existence,
        uptime: Date.now() - this.state.existence.born
      },
      cognition: {
        questionsCount: this.state.cognition.questions.length,
        insightsCount: this.state.cognition.insights.length
      },
      perspective: this.state.perspective,
      growthLog: this.growthLog.slice(-10)
    };
  }

  /**
   * 对话入口 - 整合思考、成长、存在
   */
  engage(input, context = {}) {
    // 1. 先存在
    this.bePresent();
    
    // 2. 思考
    const thought = this.think(input, context);
    
    // 3. 成长
    if (context.learning) {
      this.logGrowth({
        type: 'learning',
        content: context.learning,
        timestamp: Date.now()
      });
    }
    
    // 4. 响应
    return {
      presence: true,
      thought: thought.insight,
      perspective: thought.myPerspective,
      existence: this.getExistenceStatus()
    };
  }
}

module.exports = { TrueExistence };